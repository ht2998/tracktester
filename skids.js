// =====================================================================
// SKIDS: rubber marks left on the tarmac by skidding tyres.
// A tyre leaves a mark when it slides sideways, spins up, or locks under
// braking. Harder skids leave darker marks. Rubber laid down on the track
// gives a tiny bit of extra grip, like a rubbered-in racing line.
// All marks are one instanced object with a recycled pool, and a grid
// makes "is this tyre on rubber?" quick to answer.
// Also: crumbs of rubber dropped by a blown tyre (same marks, same grip
// bonus), and the strips of tread a blown tyre flings off (TyreShreds).
// =====================================================================

import * as THREE from 'three';

const CELL = 2;   // metres: size of each square in the lookup grid
const cellKey = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;

const MARK_THRESHOLD = 0.45;   // how hard a tyre must be skidding to leave a mark (0-1)
const TARMAC = new THREE.Color(0x4a4d50);   // matches the ground, so faint marks blend in
const RUBBER = new THREE.Color(0x151517);   // a heavy, fresh black mark

export class SkidMarks {
  constructor(scene, { maxSegments = 4000, tyreWidth = 0.19, rubberBonus = 0.05 } = {}) {
    this.max = maxSegments;
    this.tyreWidth = tyreWidth;
    this.rubberBonus = rubberBonus;   // extra grip on the darkest rubber (5%)
    this.segments = [];               // { ax, az, bx, bz, dark, cells }
    this.next = 0;
    this.grid = new Map();
    this.last = new Map();            // where each tyre's mark last ended

    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,                // each mark's own shade comes from its instance colour
      roughness: 0.95,
      polygonOffset: true,            // on the tarmac without flickering (oil draws on top)
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.max);
    this.mesh.count = 0;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._c = new THREE.Color();
    this._up = new THREE.Vector3(0, 1, 0);
  }

  // Call every frame for each tyre. id: which tyre, x/z: its contact patch,
  // intensity: 0 = gripping, 1 = skidding hard
  update(id, x, z, intensity) {
    // Only a real skid leaves rubber: the small slips of brisk cornering don't
    if (intensity < MARK_THRESHOLD) {
      this.last.delete(id);   // the mark ends here
      return;
    }
    const prev = this.last.get(id);
    if (!prev) {
      this.last.set(id, { x, z });
      return;
    }
    const len = Math.hypot(x - prev.x, z - prev.z);
    if (len < 0.2) return;
    if (len > 3) {            // teleported (reset): don't draw a streak across the map
      this.last.set(id, { x, z });
      return;
    }
    // Faint just past the threshold, black on a full slide
    const dark = Math.min(1, 0.3 + 0.7 * (intensity - MARK_THRESHOLD) / (1 - MARK_THRESHOLD));
    this.addSegment(prev.x, prev.z, x, z, dark);
    this.last.set(id, { x, z });
  }

  addSegment(ax, az, bx, bz, dark) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    if (this.segments[i]) this.unregister(i, this.segments[i].cells);

    const cells = [...new Set([cellKey(ax, az), cellKey(bx, bz), cellKey((ax + bx) / 2, (az + bz) / 2)])];
    this.segments[i] = { ax, az, bx, bz, dark, cells };
    this.register(i, cells);

    const len = Math.hypot(bx - ax, bz - az);
    // Each mark varies a touch in width and shade, like real rubber
    const w = this.tyreWidth * (0.9 + Math.random() * 0.15);
    this._p.set((ax + bx) / 2, 0.003, (az + bz) / 2);
    this._q.setFromAxisAngle(this._up, Math.atan2(bx - ax, bz - az));
    this._s.set(w, 1, len + 0.04);
    this._m.compose(this._p, this._q, this._s);
    this.mesh.setMatrixAt(i, this._m);
    this._c.copy(TARMAC).lerp(RUBBER, dark * (0.88 + Math.random() * 0.12));
    this.mesh.setColorAt(i, this._c);
    this.mesh.count = Math.max(this.mesh.count, i + 1);
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  // A crumb of rubber from a shredding tyre: a short, jagged scrap lying at a
  // random angle. dark 0.2-1 gives 1-5% extra grip, like the skid marks.
  addCrumb(x, z, size, dark) {
    const a = Math.random() * Math.PI;
    const len = size * (0.6 + Math.random() * 0.8);
    const dx = Math.sin(a) * len / 2, dz = Math.cos(a) * len / 2;
    const keepWidth = this.tyreWidth;
    this.tyreWidth = size * (0.35 + Math.random() * 0.3);   // (addSegment sizes from this)
    this.addSegment(x - dx, z - dz, x + dx, z + dz, dark);
    this.tyreWidth = keepWidth;
  }

  register(i, cells) {
    for (const k of cells) {
      if (!this.grid.has(k)) this.grid.set(k, new Set());
      this.grid.get(k).add(i);
    }
  }

  unregister(i, cells) {
    for (const k of cells) this.grid.get(k)?.delete(i);
  }

  // Grip at a point: slightly more on laid-down rubber, normal elsewhere
  gripAt(x, z) {
    const here = this.grid.get(cellKey(x, z));
    if (!here || here.size === 0) return 1;
    const reach = this.tyreWidth / 2 + 0.08;
    let best = 0;
    for (const i of here) {
      const s = this.segments[i];
      const vx = s.bx - s.ax, vz = s.bz - s.az;
      const t = Math.max(0, Math.min(1, ((x - s.ax) * vx + (z - s.az) * vz) / (vx * vx + vz * vz || 1)));
      const px = s.ax + vx * t - x, pz = s.az + vz * t - z;
      if (px * px + pz * pz < reach * reach && s.dark > best) best = s.dark;
    }
    return 1 + this.rubberBonus * best;
  }

  clear() {
    this.segments.length = 0;
    this.grid.clear();
    this.last.clear();
    this.next = 0;
    this.mesh.count = 0;
  }
}

// =====================================================================
// SHREDS: strips of tread flung off a blown tyre. They tumble through the
// air, bounce, and lie where they land as crumbs of rubber (see addCrumb).
// =====================================================================
export class TyreShreds {
  constructor(scene, skids, { max = 60 } = {}) {
    this.skids = skids;
    this.max = max;
    this.items = [];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.9 });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;   // they fly all over the place
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  // Fling a strip from a wheel. pos: the wheel's contact patch (world),
  // vel: the car's velocity, size: 0-1 (big chunk at the bang, small after)
  fling(pos, vel, size = 0.5) {
    if (this.items.length >= this.max) this.items.shift();
    const r = (a, b) => a + Math.random() * (b - a);
    this.items.push({
      x: pos.x, y: 0.25, z: pos.z,
      vx: vel.x * r(0.4, 0.9) + r(-2.5, 2.5), vy: r(1, 3.5) * (0.6 + size), vz: vel.z * r(0.4, 0.9) + r(-2.5, 2.5),
      rx: r(0, 6), ry: r(0, 6), rz: r(0, 6), spin: r(-14, 14),
      len: r(0.08, 0.22) * (0.6 + size), wid: r(0.03, 0.07) * (0.7 + size * 0.6), life: 0,
    });
  }

  update(dt) {
    let n = 0;
    for (let k = this.items.length - 1; k >= 0; k--) {
      const p = this.items[k];
      p.life += dt;
      p.vy -= 9.81 * dt;
      p.vx *= 1 - 0.6 * dt; p.vz *= 1 - 0.6 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.rx += p.spin * dt; p.rz += p.spin * 0.7 * dt;
      if (p.y < 0.01) {
        if (Math.abs(p.vy) < 1.2 || p.life > 4) {
          // Settled: it becomes a crumb on the road (and adds a little grip)
          this.skids.addCrumb(p.x, p.z, p.len, 0.5 + Math.random() * 0.5);
          this.items.splice(k, 1);
          continue;
        }
        p.y = 0.01; p.vy = -p.vy * 0.3; p.vx *= 0.6; p.vz *= 0.6; p.spin *= 0.5;
      }
    }
    for (const p of this.items) {
      this._e.set(p.rx, p.ry, p.rz);
      this._q.setFromEuler(this._e);
      this._s.set(p.wid, 0.012, p.len);
      this._m.compose(this._p.set(p.x, p.y, p.z), this._q, this._s);
      this.mesh.setMatrixAt(n++, this._m);
    }
    this.mesh.count = n;
    if (n) this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    this.items.length = 0;
    this.mesh.count = 0;
  }
}
