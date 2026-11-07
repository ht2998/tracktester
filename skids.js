// =====================================================================
// SKIDS: rubber marks left on the tarmac by skidding tyres.
// A tyre leaves a mark when it slides sideways, spins up, or locks under
// braking. Harder skids leave darker marks. Rubber laid down on the track
// gives a tiny bit of extra grip, like a rubbered-in racing line.
// All marks are one instanced object with a recycled pool, and a grid
// makes "is this tyre on rubber?" quick to answer.
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
