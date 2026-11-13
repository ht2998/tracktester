// =====================================================================
// RAIN: falling rain, a wet track, puddles, mud, splashes and lightning.
//
// LEVELS: drizzle, light, moderate, heavy, thunderstorm (set with the
// weather in the side panel).
// WETNESS: the track gets wet gradually while it rains and dries slowly
// afterwards (faster in sunshine). Grip drops with wetness, far more for
// slicks than for intermediates and wets.
// PUDDLES: water pools at fixed low spots: they only start once the track
// is properly wet, grow with the rain, and drain slowly. Driving through
// one at speed can aquaplane the car.
// MUD: on the grass, muddy patches form later and more slowly than the
// puddles, and are very slippery.
// SPLASHES: drops hitting the ground throw a tiny crown; drops landing in
// a puddle make a spreading ripple instead.
// WASHING: the rain spreads oil out while it fades away, and fades rubber
// marks (see oil.js and skids.js).
// THUNDERSTORMS: lightning flashes light up everything, and the thunder
// arrives later the further away the strike was.
// =====================================================================

import * as THREE from 'three';
import { groundAt, lieOnGround } from './ground.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 4;

// How hard it rains at each level (0-1)
export const RAIN_LEVELS = { drizzle: 0.12, light: 0.3, moderate: 0.52, heavy: 0.78, storm: 1 };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const rand = (a, b) => a + Math.random() * (b - a);

// Splashes and ripples: a little ring or crown that grows and fades
const FX_VERT = `
attribute float aFade;
varying float vFade;
varying vec2 vUv;
void main() {
  vFade = aFade;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const FX_FRAG = `
uniform vec3 colour;
uniform float opacity;
varying float vFade;
void main() {
  if (vFade <= 0.0) discard;
  gl_FragColor = vec4(colour, opacity * vFade);
}`;

export class RainSystem {
  // spots: { puddles: [{x, z, r}], mud: [{x, z, r}] } where water and mud can gather
  // roofs: [{ minX, maxX, minZ, maxZ, height }]: rain stops on them
  constructor(scene, { isMobile = false, spots, roofs = [] }) {
    this.scene = scene;
    this.roofs = roofs;
    this.isMobile = isMobile;
    this.level = null;            // null = no rain, else a key of RAIN_LEVELS
    this.intensity = 0;           // how hard it's raining right now (eases in and out)
    this.wetness = 0;             // the track: 0 dry, 1 soaked
    this.water = 0;               // how full the puddles are (0-1)
    this.mud = 0;                 // how muddy the grass patches are (0-1)
    this.flash = 0;               // lightning: 1 at the strike, fading fast
    this.nextStrike = rand(6, 14);
    this.pendingThunder = [];     // { at, strength }

    // --- Falling rain: short streaks in a box around the camera ---
    this.maxDrops = isMobile ? 900 : 2200;
    this.drops = new Float32Array(this.maxDrops * 3);
    this.dropSpeed = new Float32Array(this.maxDrops);
    const linePos = new Float32Array(this.maxDrops * 6);
    const geo = new THREE.BufferGeometry();
    this.lineAttr = new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.lineAttr);
    this.rainMat = new THREE.LineBasicMaterial({ color: 0xc9d4de, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
    this.rain = new THREE.LineSegments(geo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.layers.set(1);
    scene.add(this.rain);
    this.dropsReady = false;

    // --- Puddles: dark, glossy pools at fixed spots, each a cluster of discs ---
    this.puddles = (spots.puddles || []).map((p) => ({
      ...p,
      lobes: Array.from({ length: 4 }, () => ({ a: rand(0, 6.28), d: rand(0.2, 0.6), s: rand(0.45, 0.8), sq: rand(0.55, 0.9), turn: rand(0, 3.14) })),
      squash: rand(0.55, 0.85), turn: rand(0, 3.14), cur: 0,
    }));
    const disc = new THREE.CircleGeometry(1, 28);
    disc.rotateX(-Math.PI / 2);
    this.puddleMat = new THREE.MeshStandardMaterial({
      color: 0x2b3036, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    this.puddleMesh = new THREE.InstancedMesh(disc, this.puddleMat, Math.max(1, this.puddles.length * 5));
    this.puddleMesh.frustumCulled = false;
    this.puddleMesh.receiveShadow = true;
    this.puddleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.puddleMesh);

    // --- Mud on the grass: brown wet patches ---
    this.muds = (spots.mud || []).map((p) => ({
      ...p,
      lobes: Array.from({ length: 4 }, () => ({ a: rand(0, 6.28), d: rand(0.3, 0.7), s: rand(0.5, 0.85), sq: rand(0.6, 0.95), turn: rand(0, 3.14) })),
      squash: rand(0.6, 0.9), turn: rand(0, 3.14), cur: 0,
    }));
    this.mudMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a1a, roughness: 0.3, metalness: 0, transparent: true, opacity: 0,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    this.mudMesh = new THREE.InstancedMesh(disc, this.mudMat, Math.max(1, this.muds.length * 5));
    this.mudMesh.frustumCulled = false;
    this.mudMesh.receiveShadow = true;
    this.mudMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mudMesh);

    // --- Splashes (crowns) and ripples ---
    const fx = (geo, max, colour, opacity) => {
      const g = geo;
      const fade = new THREE.InstancedBufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aFade', fade);
      const mat = new THREE.ShaderMaterial({
        uniforms: { colour: { value: new THREE.Color(colour).convertLinearToSRGB() }, opacity: { value: opacity } },
        vertexShader: FX_VERT, fragmentShader: FX_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.InstancedMesh(g, mat, max);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.layers.set(1);
      scene.add(mesh);
      return { mesh, fade, items: new Array(max).fill(null), next: 0, max };
    };
    // A crown: an open, flaring little cup of water
    const crown = new THREE.CylinderGeometry(1, 0.45, 1, 10, 1, true);
    crown.translate(0, 0.5, 0);
    this.crowns = fx(crown, isMobile ? 120 : 260, 0xdfe7ee, 0.55);
    const ring = new THREE.RingGeometry(0.82, 1, 24);
    ring.rotateX(-Math.PI / 2);
    this.ripples = fx(ring, isMobile ? 90 : 200, 0xd2dce6, 0.5);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this.washClock = 0;
  }

  setLevel(level) {
    this.level = RAIN_LEVELS[level] ? level : null;
  }

  get target() { return this.level ? RAIN_LEVELS[this.level] : 0; }

  // --- Questions the rest of the game asks ---

  // Standing water at a point: 0 = none, 1 = deep in a full puddle
  puddleAt(x, z) {
    let best = 0;
    for (const p of this.puddles) {
      if (p.cur < 0.05) continue;
      const r = p.r * p.cur;
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < r * 1.15) best = Math.max(best, (1 - d / (r * 1.15)) * this.water);
    }
    return best;
  }

  // Mud at a point (on the grass): 0-1
  mudAt(x, z) {
    let best = 0;
    for (const p of this.muds) {
      if (p.cur < 0.05) continue;
      const r = p.r * p.cur;
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < r * 1.1) best = Math.max(best, (1 - d / (r * 1.1)) * 0.6 + 0.4 * this.mud);
    }
    return best;
  }

  // --- Every frame ---
  // camera: the rain falls around it; carVel: so the rain streaks slant as you drive;
  // sunlight: 0-1, dries the track faster
  update(dt, camera, carVel, sunlight) {
    const target = this.target;
    this.intensity += clamp(target - this.intensity, -dt / 8, dt / 8);   // rain builds and eases over a few seconds
    const rain = this.intensity;

    // Track wetness: wets in about a minute of moderate rain; dries over a
    // few minutes (faster in sunshine)
    if (rain > 0.02) this.wetness = Math.min(1, this.wetness + dt * rain / 40);
    else this.wetness = Math.max(0, this.wetness - dt * (0.002 + 0.006 * sunlight));
    // Puddles fill once it's properly wet, and drain slowly
    if (rain > 0.1 && this.wetness > 0.45) this.water = Math.min(1, this.water + dt * rain / 70);
    else this.water = Math.max(0, this.water - dt * (0.0025 + 0.004 * sunlight));
    // Mud forms later and more slowly than puddles, and lasts longer
    if (rain > 0.25 && this.wetness > 0.7) this.mud = Math.min(1, this.mud + dt * rain / 160);
    else this.mud = Math.max(0, this.mud - dt * 0.0012);

    this.updatePools(this.puddles, this.puddleMesh, this.puddleMat, this.water, 0.9, 0.007);
    this.updatePools(this.muds, this.mudMesh, this.mudMat, this.mud, 0.95, 0.009);
    this.updateDrops(dt, camera, carVel, rain);
    this.updateFx(this.crowns, dt, 0.18, (it, t) => {
      const grow = Math.min(1, t / 0.35);
      return [it.s * (0.4 + grow), it.s * 2.2 * Math.sin(Math.PI * Math.min(1, t)), 1 - t];
    });
    this.updateFx(this.ripples, dt, 0.7, (it, t) => [it.s * (0.15 + t), 1, (1 - t) * (1 - t)]);

    // Lightning (thunderstorms only)
    this.flash = Math.max(0, this.flash - dt * 5);
    if (this.level === 'storm' && rain > 0.7) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) {
        const km = rand(0.4, 6);                   // how far away it struck
        this.flash = clamp(1.4 - km * 0.18, 0.25, 1);
        // a second flicker straight after, sometimes
        if (Math.random() < 0.5) this.reflash = rand(0.08, 0.2);
        this.pendingThunder.push({ at: (km * 1000) / 343, strength: clamp(1.2 - km * 0.15, 0.25, 1) });
        this.nextStrike = rand(7, 22);
      }
    }
    if (this.reflash !== undefined) {
      this.reflash -= dt;
      if (this.reflash <= 0) { this.flash = Math.max(this.flash, 0.7); this.reflash = undefined; }
    }
    // Thunder due now? (handed to the sound)
    this.thunderNow = null;
    for (const t of this.pendingThunder) t.at -= dt;
    const due = this.pendingThunder.findIndex((t) => t.at <= 0);
    if (due >= 0) this.thunderNow = this.pendingThunder.splice(due, 1)[0];
  }

  // Grow or shrink puddles / mud patches and draw them
  updatePools(pools, mesh, mat, fill, maxOpacity, height) {
    if (!pools.length) return;
    mat.opacity = maxOpacity * smooth(0.02, 0.25, fill);
    mesh.visible = mat.opacity > 0.01;
    if (!mesh.visible) return;
    pools.forEach((p, i) => {
      // bigger puddles fill up later than small ones
      p.cur = smooth(p.start ?? 0, 1, fill);
      const r = p.r * p.cur;
      const base = i * 5;
      this._p.set(p.x, height + groundAt(p.x, p.z), p.z);
      lieOnGround(this._q, p.x, p.z, p.turn);
      this._s.set(Math.max(1e-4, r), 1, Math.max(1e-4, r * p.squash));
      mesh.setMatrixAt(base, this._m.compose(this._p, this._q, this._s));
      p.lobes.forEach((l, k) => {
        const lr = Math.max(1e-4, r * l.s);
        this._p.set(p.x + Math.sin(l.a) * r * l.d, 0, p.z + Math.cos(l.a) * r * l.d);
        this._p.y = height + 0.0003 * (k + 1) + groundAt(this._p.x, this._p.z);
        lieOnGround(this._q, this._p.x, this._p.z, l.turn);
        mesh.setMatrixAt(base + 1 + k, this._m.compose(this._p, this._q, this._s.set(lr, 1, lr * l.sq)));
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  // Rain streaks falling around the camera; each drop that reaches the
  // ground may leave a splash (or a ripple, in a puddle)
  // The height rain stops at: a roof, or the ground
  roofAt(x, z) {
    for (const r of this.roofs) if (x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ) return r.height;
    return 0;
  }

  updateDrops(dt, camera, carVel, rain) {
    const active = Math.round(this.maxDrops * smooth(0, 1, rain));
    this.rain.visible = active > 0;
    this.rainMat.opacity = 0.18 + 0.25 * rain;
    if (!active) { this.rain.geometry.setDrawRange(0, 0); return; }
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const BOX = 14, TOP = 12;
    const d = this.drops;
    if (!this.dropsReady) {
      for (let i = 0; i < this.maxDrops; i++) {
        d[i * 3] = cx + rand(-BOX, BOX); d[i * 3 + 1] = rand(0, TOP + cy); d[i * 3 + 2] = cz + rand(-BOX, BOX);
        this.dropSpeed[i] = rand(8, 10.5);
      }
      this.dropsReady = true;
    }
    const line = this.lineAttr.array;
    const streak = 0.05 + 0.03 * rain;             // seconds of motion shown as a streak
    // Splash budget: only some landings near the camera get a visible splash
    let splashes = Math.round((this.isMobile ? 40 : 90) * rain * dt * 10);
    const wind = this.wind || { x: 0.8, z: 0.3 };   // set by the game (blows harder in a storm: the rain slants)
    for (let i = 0; i < active; i++) {
      let x = d[i * 3], y = d[i * 3 + 1], z = d[i * 3 + 2];
      const v = this.dropSpeed[i];
      y -= v * dt;
      x += wind.x * dt; z += wind.z * dt;
      const roofUp = this.roofAt(x, z), ground = groundAt(x, z);
      const floor = ground + roofUp;
      if (y <= floor) {
        // Landed: a crown splash, or a ripple if it fell in a puddle
        // (none on a roof: you wouldn't see them up there)
        if (!roofUp && splashes > 0 && Math.abs(x - cx) < 9 && Math.abs(z - cz) < 9) {
          splashes--;
          if (this.puddleAt(x, z) > 0.15) this.spawnFx(this.ripples, x, ground + 0.012, z, rand(0.12, 0.28), rand(0.5, 0.8));
          else if (this.wetness > 0.15) this.spawnFx(this.crowns, x, ground + 0.004, z, rand(0.025, 0.05), rand(0.14, 0.22));
        }
        x = cx + rand(-BOX, BOX); z = cz + rand(-BOX, BOX); y = cy + rand(4, TOP);
      }
      // keep the drops in a box that follows the camera
      if (x - cx > BOX) x -= 2 * BOX; else if (x - cx < -BOX) x += 2 * BOX;
      if (z - cz > BOX) z -= 2 * BOX; else if (z - cz < -BOX) z += 2 * BOX;
      // never inside a building: a drop that ends up under a roof starts again above it
      const roof = this.roofAt(x, z);
      if (roof && y < roof + groundAt(x, z)) y = roof + groundAt(x, z) + rand(0.5, TOP);
      d[i * 3] = x; d[i * 3 + 1] = y; d[i * 3 + 2] = z;
      // The streak points along the drop's motion as you see it from the
      // moving car: it slants towards you when you drive fast
      const rx = wind.x - carVel.x * 0.5, rz = wind.z - carVel.z * 0.5;
      const k = i * 6;
      line[k] = x; line[k + 1] = y; line[k + 2] = z;
      line[k + 3] = x - rx * streak; line[k + 4] = y + v * streak; line[k + 5] = z - rz * streak;
    }
    this.rain.geometry.setDrawRange(0, active * 2);
    this.lineAttr.needsUpdate = true;
  }

  spawnFx(set, x, y, z, size, life) {
    const i = set.next;
    set.next = (set.next + 1) % set.max;
    set.items[i] = { x, y, z, s: size, life: 0, maxLife: life };
  }

  updateFx(set, dt, _defaultLife, shape) {
    let any = false;
    for (let i = 0; i < set.max; i++) {
      const it = set.items[i];
      if (!it) continue;
      any = true;
      it.life += dt;
      const t = it.life / it.maxLife;
      if (t >= 1) {
        set.items[i] = null;
        set.fade.array[i] = 0;
        continue;
      }
      const [wide, tall, fade] = shape(it, t);
      this._p.set(it.x, it.y, it.z);
      this._q.identity();
      set.mesh.setMatrixAt(i, this._m.compose(this._p, this._q, this._s.set(wide, tall, wide)));
      set.fade.array[i] = fade;
    }
    if (any) {
      set.mesh.instanceMatrix.needsUpdate = true;
      set.fade.needsUpdate = true;
    }
  }

  // Wet tarmac looks darker and shinier
  wetLook(material, dry) {
    const w = this.wetness;
    material.roughness = dry.roughness - (dry.roughness - 0.35) * w;
    material.color.copy(dry.colour).multiplyScalar(1 - 0.35 * w);
  }

  clearSurface() {
    this.wetness = 0;
    this.water = 0;
    this.mud = 0;
  }
}
