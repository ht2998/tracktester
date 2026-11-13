// =====================================================================
// OIL: a leaking engine leaves oil on the track.
//   - While moving: a thin, continuous trail that follows the car
//   - While stopped: a puddle that slowly spreads out
// Any tyre that rolls over oil loses most of its grip. The trail and the
// puddles are each one instanced object (drawn in a single go), with a
// fixed pool that recycles the oldest pieces, and a simple grid makes
// "is this tyre on oil?" quick to answer.
// In the rain, oil spreads out wider while it fades into the road, losing
// its slipperiness as it goes, until it's washed away completely.
// =====================================================================

import * as THREE from 'three';
import { groundAt, lieOnGround } from './ground.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 6;

const CELL = 2;   // metres: size of each square in the lookup grid
const LOBES_PER_PUDDLE = 5;   // main pool + up to 4 lobes
const cellKey = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;

export class OilSlicks {
  // colour: what it looks like fresh (engine oil changes colour as it ages:
  // set .oilColour); ahead: how far forward of the car's middle it drips
  // from (the engine for oil, the radiator for coolant); shine: how glossy
  constructor(scene, { maxSegments = 1600, maxPuddles = 120, slickGrip = 0.35, colour = 0x0d0c0b, ahead = 0.6, roughness = 0.12, metalness = 0.4, flowSpeed = 0.9, flowTime = 45, amount = 1, evaporate = 0 } = {}) {
    // How much fluid there is to leak, compared with the engine oil (the
    // pools and trails are that much smaller), and how fast a pool dries up
    // on hot tarmac (share of its size per second)
    this.amount = amount;
    this.evaporate = evaporate;
    // How it runs downhill: speed (m/s per unit of slope), and for how long
    // a pool keeps creeping before it's spread too thin to move
    this.flowSpeed = flowSpeed;
    this.flowTime = flowTime;
    this.ahead = ahead;
    this.slickGrip = slickGrip;   // grip left on oil (1 = clean tarmac)
    this.maxSegments = maxSegments;
    this.maxPuddles = maxPuddles;

    this.segments = [];   // { ax, az, bx, bz, w, cells }
    this.nextSeg = 0;
    this.puddles = [];    // { x, z, r, maxR, cells }
    this.nextPuddle = 0;
    this.grid = new Map();   // cell -> Set of { kind, index }

    this.lastPoint = null;   // where the trail last ended
    this.wobble = 0;         // gentle side-to-side drift of the drip line
    this.activePuddle = -1;  // the puddle currently growing under the car

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,       // each piece's own shade comes from its instance colour (so rain can fade it)
      roughness,             // wet and shiny
      metalness,
      // Solid, not see-through: overlapping pieces would otherwise show as darker beads
      polygonOffset: true,   // sits on the tarmac without flickering
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    // Trail pieces: thin flat strips laid end to end
    const stripGeo = new THREE.PlaneGeometry(1, 1);
    stripGeo.rotateX(-Math.PI / 2);
    this.trailMesh = new THREE.InstancedMesh(stripGeo, mat, maxSegments);
    // Puddles: flat discs that grow
    const discGeo = new THREE.CircleGeometry(1, 24);
    discGeo.rotateX(-Math.PI / 2);
    this.puddleMesh = new THREE.InstancedMesh(discGeo, mat, maxPuddles * LOBES_PER_PUDDLE);

    for (const mesh of [this.trailMesh, this.puddleMesh]) {
      mesh.count = 0;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
    }

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._c = new THREE.Color();
    this.oilColour = new THREE.Color(colour);
    this.roadColour = new THREE.Color(0x3f4245);   // what it fades into
    this.washClock = 0;
  }

  // The rain washing oil away. rain: 0-1. Spreads each piece while fading
  // it towards the road's colour; heavy rain clears it in about 1.5 minutes.
  weather(dt, rain) {
    this.flowDownhill(dt);
    if (rain < 0.02) return;
    this.washClock += dt;
    if (this.washClock < 0.25) return;            // a few times a second is plenty
    const step = this.washClock * rain / 70;
    this.washClock = 0;
    let changed = false;
    this.segments.forEach((sg, i) => {
      if (!sg) return;
      sg.wash = Math.min(1, (sg.wash || 0) + step);
      if (sg.wash >= 1) {
        this.unregister('seg', i, sg.cells);
        this.segments[i] = null;
        this.trailMesh.setMatrixAt(i, this._m.makeScale(0, 0, 0));
      } else this.drawSegment(i, sg);
      changed = true;
    });
    this.puddles.forEach((p, i) => {
      if (!p || i === this.activePuddle) return;
      p.wash = Math.min(1, (p.wash || 0) + step);
      if (p.wash >= 1) {
        this.unregister('pud', i, p.cells);
        this.puddles[i] = null;
        for (let k = 0; k < LOBES_PER_PUDDLE; k++) this.puddleMesh.setMatrixAt(i * LOBES_PER_PUDDLE + k, this._m.makeScale(0, 0, 0));
      } else this.drawPuddle(i, p);
      changed = true;
    });
    if (changed) {
      this.trailMesh.instanceMatrix.needsUpdate = true;
      this.puddleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  // Oil's colour as it washes away (wash 0 = fresh, 1 = gone)
  // (each piece keeps the colour it had when it fell: old oil on the road
  // doesn't change colour with the oil still in the engine)
  shade(wash, colour = this.oilColour) {
    return this._c.copy(colour).lerp(this.roadColour, Math.pow(wash || 0, 0.7));
  }

  // Call every frame.
  //   carX/carZ/heading: where the car is, so the oil falls from under the engine
  //   speed: m/s
  //   rate: 0 = not leaking, 1 = dripping (damaged), 2 = pouring (blown)
  // remaining: how much oil is left in the engine (0-1). As it runs low the
  // trail thins out, breaks up more and more, then becomes just the odd drop.
  update(dt, carX, carZ, heading, speed, rate, remaining = 1) {
    if (rate <= 0) {
      this.lastPoint = null;
      this.activePuddle = -1;
      return;
    }
    const fx = Math.sin(heading), fz = Math.cos(heading);
    // The drip line wanders irregularly: two uneven waves plus a slow random drift
    this.wobble += dt * (0.8 + Math.random() * 0.4);
    this.drift = Math.max(-0.05, Math.min(0.05, (this.drift || 0) + (Math.random() - 0.5) * 0.02));
    const side = Math.sin(this.wobble * 1.7) * 0.035 + Math.sin(this.wobble * 4.3 + 1.1) * 0.015 + this.drift;
    const x = carX + fx * this.ahead + fz * side;
    const z = carZ + fz * this.ahead - fx * side;

    const thin = Math.max(0, Math.min(1, remaining / 0.25));    // 1 = plenty left, 0 = all but empty
    if (Math.abs(speed) < 0.4) {
      // Stopped (or nearly): the oil pools and spreads (more slowly as it runs out)
      this.lastPoint = null;
      this.growPuddle(x, z, dt, rate * (0.15 + 0.85 * thin));
      return;
    }
    this.activePuddle = -1;

    // Moving: extend the trail as a continuous line
    if (!this.lastPoint) {
      this.lastPoint = { x, z };
      return;
    }
    const dx = x - this.lastPoint.x;
    const dz = z - this.lastPoint.z;
    const len = Math.hypot(dx, dz);
    if (len >= 0.35 && remaining < 0.07) {
      // Nearly empty: no more line, just the odd drop, fewer and smaller
      // until the last one falls
      if (Math.random() < 0.6 * remaining / 0.07) this.addDrop(x, z, this.amount * (0.02 + Math.random() * 0.035));
      this.lastPoint = { x, z };
    } else if (len >= 0.35) {
      // The leak puts out the same oil every second, so the slower the car,
      // the more lands on each metre: the trail thickens as you slow down
      // (1x at about 70 km/h, up to about 3x when crawling).
      const v = Math.abs(speed);
      const slowness = Math.min(3, Math.pow(20 / Math.max(v, 1.5), 0.6));
      // Width swells and thins unevenly as the leak spurts and eases
      this.flow = Math.max(0.55, Math.min(1.5, (this.flow || 1) + (Math.random() - 0.5) * 0.35));
      const width = this.amount * (rate >= 2 ? 0.11 : 0.07) * this.flow * slowness * (0.85 + Math.random() * 0.3) * (0.25 + 0.75 * thin);
      // Now and then a drip misses, leaving a short gap (only while dripping
      // fast), and more and more often as the oil runs out
      const gap = (rate < 2 && v > 8 && Math.random() < 0.06) || Math.random() < 0.55 * (1 - thin);
      if (!gap) this.addSegment(this.lastPoint.x, this.lastPoint.z, x, z, width);
      // Drips beside the line: more often, and bigger, the slower you go
      const dropChance = (rate >= 2 ? 0.05 : 0.025) * Math.pow(slowness, 2.2);
      if (Math.random() < dropChance) {
        const off = (Math.random() - 0.5) * 0.12 * slowness;
        this.addDrop(x + fz * off, z - fx * off, width * (0.8 + Math.random() * 0.9));
      }
      this.lastPoint = { x, z };
    }
  }

  addSegment(ax, az, bx, bz, w, colour = this.oilColour) {
    const i = this.nextSeg;
    this.nextSeg = (this.nextSeg + 1) % this.maxSegments;
    if (this.segments[i]) this.unregister('seg', i, this.segments[i].cells);
    const cells = this.cellsAlong(ax, az, bx, bz);
    this.segments[i] = { ax, az, bx, bz, w, cells, wash: 0, colour: colour.clone() };
    this.register('seg', i, cells);
    this.drawSegment(i, this.segments[i]);
    this.trailMesh.count = Math.max(this.trailMesh.count, i + 1);
  }

  // Strip centred between the two points, turned to face along the line,
  // slightly overlapping the next piece so the trail has no gaps (wider
  // and paler as the rain washes it out)
  drawSegment(i, sg) {
    const { ax, az, bx, bz } = sg;
    const len = Math.hypot(bx - ax, bz - az);
    const w = sg.w * (1 + 1.6 * (sg.wash || 0));
    this._p.set((ax + bx) / 2, 0.004 + groundAt((ax + bx) / 2, (az + bz) / 2), (az + bz) / 2);
    lieOnGround(this._q, this._p.x, this._p.z, Math.atan2(bx - ax, bz - az));   // (along the slope, on a hill)
    this._s.set(w, 1, len + w * 0.6);
    this._m.compose(this._p, this._q, this._s);
    this.trailMesh.setMatrixAt(i, this._m);
    this.trailMesh.setColorAt(i, this.shade(sg.wash, sg.colour));
    this.trailMesh.instanceMatrix.needsUpdate = true;
    this.trailMesh.instanceColor.needsUpdate = true;
  }

  // A single splash of oil: a small, slightly irregular blob
  addDrop(x, z, r) {
    const i = this.nextPuddle;
    this.nextPuddle = (this.nextPuddle + 1) % this.maxPuddles;
    if (this.puddles[i]) this.unregister('pud', i, this.puddles[i].cells);
    const p = this.makePuddle(x, z, r, r);
    this.puddles[i] = p;
    p.cells = this.cellsAround(x, z, r * 1.6);
    this.register('pud', i, p.cells);
    this.drawPuddle(i, p);
  }

  // A puddle is a main pool plus a few smaller lobes that spread unevenly
  makePuddle(x, z, r, maxR) {
    const lobes = [];
    const count = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      lobes.push({
        angle: a,
        reach: 0.6 + Math.random() * 0.45,     // how far out from the centre, as a share of r
        size: 0.45 + Math.random() * 0.35,     // lobe size, as a share of r
        speed: 0.6 + Math.random() * 0.9,      // some lobes spread faster than others
        squash: 0.6 + Math.random() * 0.35,
        turn: Math.random() * Math.PI,
      });
    }
    return { x, z, r, maxR, cells: [], angle: Math.random() * Math.PI, squash: 0.7 + Math.random() * 0.25, lobes, wash: 0, colour: this.oilColour.clone(), flowLeft: 1, trail: 0, tx: x, tz: z };
  }

  // Each puddle uses LOBES_PER_PUDDLE instances: the pool, then its lobes
  drawPuddle(i, p) {
    const base = i * LOBES_PER_PUDDLE;
    const spread = 1 + 1.2 * (p.wash || 0);           // the rain spreads it out
    const r = p.r * spread;
    this.shade(p.wash, p.colour);
    for (let k = 0; k < LOBES_PER_PUDDLE; k++) this.puddleMesh.setColorAt(base + k, this._c);
    this.puddleMesh.instanceColor.needsUpdate = true;
    this._p.set(p.x, 0.005 + groundAt(p.x, p.z), p.z);
    lieOnGround(this._q, p.x, p.z, p.angle);
    this._s.set(r, 1, r * p.squash);
    this._m.compose(this._p, this._q, this._s);
    this.puddleMesh.setMatrixAt(base, this._m);
    for (let k = 0; k < LOBES_PER_PUDDLE - 1; k++) {
      const lobe = p.lobes[k];
      if (!lobe) {
        this._s.set(0.0001, 1, 0.0001);   // unused slot: hidden
        this._m.compose(this._p, this._q, this._s);
      } else {
        const grow = Math.min(1, lobe.speed * (p.r / p.maxR) + 0.15);
        const lr = r * lobe.size * grow;
        const d = r * lobe.reach * grow;
        this._p.set(p.x + Math.sin(lobe.angle) * d, 0, p.z + Math.cos(lobe.angle) * d);
        this._p.y = 0.0052 + groundAt(this._p.x, this._p.z);
        lieOnGround(this._q, this._p.x, this._p.z, lobe.turn);
        this._s.set(lr, 1, lr * lobe.squash);
        this._m.compose(this._p, this._q, this._s);
      }
      this.puddleMesh.setMatrixAt(base + 1 + k, this._m);
    }
    this.puddleMesh.count = Math.max(this.puddleMesh.count, base + LOBES_PER_PUDDLE);
    this.puddleMesh.instanceMatrix.needsUpdate = true;
  }

  growPuddle(x, z, dt, rate) {
    let p = this.puddles[this.activePuddle];
    // Start a new puddle if there isn't one under the car
    if (this.activePuddle < 0 || !p || Math.hypot(x - p.x, z - p.z) > 0.3) {
      const i = this.nextPuddle;
      this.nextPuddle = (this.nextPuddle + 1) % this.maxPuddles;
      if (this.puddles[i]) this.unregister('pud', i, this.puddles[i].cells);
      p = this.makePuddle(x, z, 0.06, this.amount * (rate >= 2 ? 1.3 : 0.75) * (0.85 + Math.random() * 0.3));
      this.puddles[i] = p;
      this.activePuddle = i;
    }
    // Spreads quickly at first, then more slowly, in uneven spurts
    const speed = (rate >= 2 ? 0.25 : 0.08) * (1 - p.r / p.maxR) * (0.5 + Math.random());
    p.r = Math.min(p.maxR, p.r + speed * dt);

    this.unregister('pud', this.activePuddle, p.cells);
    p.cells = this.cellsAround(p.x, p.z, p.r * 1.6);   // lobes can reach beyond the main pool
    this.register('pud', this.activePuddle, p.cells);
    this.drawPuddle(this.activePuddle, p);
  }

  // Pools on a slope creep downhill (oil slowly, like honey; coolant much
  // faster, like water), leaving a thin streak behind, and slow down as
  // they spread thin. On level ground (under about 1.2%) they stay put.
  flowDownhill(dt) {
    let moved = false;
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i];
      if (!p) continue;
      // drying up in the heat (water-based coolant does; oil doesn't)
      if (this.evaporate > 0 && i !== this.activePuddle) {
        p.r *= 1 - this.evaporate * dt;
        if (p.r < 0.03) {
          this.unregister('pud', i, p.cells);
          this.puddles[i] = null;
          for (let k = 0; k < LOBES_PER_PUDDLE; k++) this.puddleMesh.setMatrixAt(i * LOBES_PER_PUDDLE + k, this._m.makeScale(0, 0, 0));
          moved = true;
          continue;
        }
        if (!(p.flowLeft > 0)) { this.drawPuddle(i, p); moved = true; }
      }
      if (!(p.flowLeft > 0)) continue;
      p.flowLeft -= dt / this.flowTime;
      const e = 0.6;
      const gx = (groundAt(p.x + e, p.z) - groundAt(p.x - e, p.z)) / (2 * e);
      const gz = (groundAt(p.x, p.z + e) - groundAt(p.x, p.z - e)) / (2 * e);
      const grade = Math.hypot(gx, gz);
      if (grade < 0.012) continue;
      const step = this.flowSpeed * (grade - 0.012) * Math.max(0, p.flowLeft) * Math.min(1, p.r / 0.3) * dt;
      if (step <= 0) continue;
      p.x -= (gx / grade) * step;
      p.z -= (gz / grade) * step;
      p.r = Math.max(0.05, p.r * (1 - 0.04 * step));      // (some of it stays behind as the streak)
      p.trail += step;
      if (p.trail > 0.2) {
        p.trail = 0;
        this.addSegment(p.tx, p.tz, p.x, p.z, Math.max(0.03, p.r * 0.3), p.colour);
        p.tx = p.x; p.tz = p.z;
      }
      this.unregister('pud', i, p.cells);
      p.cells = this.cellsAround(p.x, p.z, p.r * 1.6);
      this.register('pud', i, p.cells);
      this.drawPuddle(i, p);
      moved = true;
    }
    if (moved) {
      this.puddleMesh.instanceMatrix.needsUpdate = true;
      this.trailMesh.instanceMatrix.needsUpdate = true;
    }
  }

  // --- Lookup grid, so checking a tyre only looks at nearby oil ---
  cellsAlong(ax, az, bx, bz) {
    const keys = new Set([cellKey(ax, az), cellKey(bx, bz), cellKey((ax + bx) / 2, (az + bz) / 2)]);
    return [...keys];
  }

  cellsAround(x, z, r) {
    const keys = new Set();
    for (const dx of [-r, 0, r]) for (const dz of [-r, 0, r]) keys.add(cellKey(x + dx, z + dz));
    return [...keys];
  }

  register(kind, index, cells) {
    for (const k of cells) {
      if (!this.grid.has(k)) this.grid.set(k, new Set());
      this.grid.get(k).add(`${kind}:${index}`);
    }
  }

  unregister(kind, index, cells) {
    for (const k of cells) this.grid.get(k)?.delete(`${kind}:${index}`);
  }

  // Grip at a point on the ground: low on oil, normal everywhere else
  // (washed-out oil is less slippery)
  gripAt(x, z) {
    const here = this.grid.get(cellKey(x, z));
    if (!here || here.size === 0) return 1;
    const tyre = 0.1;   // half the width of a tyre's contact patch
    const slick = (wash) => this.slickGrip + (1 - this.slickGrip) * (wash || 0);
    let grip = 1;
    for (const id of here) {
      const [kind, n] = id.split(':');
      if (kind === 'pud') {
        const p = this.puddles[+n];
        if (!p) continue;
        const r = p.r * (1 + 1.2 * (p.wash || 0));
        const reach = r + tyre;
        if ((x - p.x) ** 2 + (z - p.z) ** 2 < reach * reach) { grip = Math.min(grip, slick(p.wash)); continue; }
        for (const lobe of p.lobes) {
          const grow = Math.min(1, lobe.speed * (p.r / p.maxR) + 0.15);
          const lr = r * lobe.size * grow + tyre;
          const d = r * lobe.reach * grow;
          const lx = p.x + Math.sin(lobe.angle) * d, lz = p.z + Math.cos(lobe.angle) * d;
          if ((x - lx) ** 2 + (z - lz) ** 2 < lr * lr) { grip = Math.min(grip, slick(p.wash)); break; }
        }
      } else {
        const s = this.segments[+n];
        if (!s) continue;
        // Distance from the point to the strip's centre line
        const vx = s.bx - s.ax, vz = s.bz - s.az;
        const t = Math.max(0, Math.min(1, ((x - s.ax) * vx + (z - s.az) * vz) / (vx * vx + vz * vz || 1)));
        const px = s.ax + vx * t - x, pz = s.az + vz * t - z;
        const reach = (s.w * (1 + 1.6 * (s.wash || 0))) / 2 + tyre;
        if (px * px + pz * pz < reach * reach) grip = Math.min(grip, slick(s.wash));
      }
    }
    return grip;
  }

  clear() {
    this.segments.length = 0;
    this.puddles.length = 0;
    this.grid.clear();
    this.nextSeg = 0;
    this.nextPuddle = 0;
    this.trailMesh.count = 0;
    this.puddleMesh.count = 0;
    this.lastPoint = null;
    this.activePuddle = -1;
  }
}
