// =====================================================================
// GRASS: a patch of real 3D grass made of thousands of little tufts in
// three lengths (short, medium, long), drawn with instancing: one draw
// call per length. Driving over it flattens the grass under the tyres
// (those tufts disappear) and leaves a dark brown trail (drawn in
// rendering.js). The grip and drag are in physics.js (SURFACES.grass).
// =====================================================================

import * as THREE from 'three';

const CELL = 0.5;   // metres: lookup grid for "which tufts are under this tyre?"
const LENGTHS = [0.045, 0.085, 0.14];   // metres: short, medium, long

// One tuft: a few thin blades fanning out, dark at the root, lighter at the tip
function makeTuftGeometry() {
  const positions = [];
  const colours = [];
  const root = new THREE.Color(0x2f4a1e), tip = new THREE.Color(0x7fa548);
  const blades = 5;
  for (let b = 0; b < blades; b++) {
    const angle = (b / blades) * Math.PI * 2 + Math.random() * 0.8;
    const lean = 0.15 + Math.random() * 0.35;
    const width = 0.012 + Math.random() * 0.006;
    const height = 0.75 + Math.random() * 0.5;   // scaled by the tuft's length later
    const ox = Math.cos(angle) * 0.02, oz = Math.sin(angle) * 0.02;
    const px = Math.cos(angle + Math.PI / 2) * width / 2, pz = Math.sin(angle + Math.PI / 2) * width / 2;
    const tx = ox + Math.cos(angle) * lean * 0.12, tz = oz + Math.sin(angle) * lean * 0.12;
    // a single tapering triangle
    positions.push(ox - px, 0, oz - pz, ox + px, 0, oz + pz, tx, height, tz);
    colours.push(root.r, root.g, root.b, root.r, root.g, root.b, tip.r, tip.g, tip.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geo.computeVertexNormals();
  return geo;
}

export class GrassPatch {
  // bounds: { minX, maxX, minZ, maxZ }, tufts: how many in total
  constructor(scene, bounds, { tufts = 7000 } = {}) {
    this.bounds = bounds;
    const w = bounds.maxX - bounds.minX, d = bounds.maxZ - bounds.minZ;

    // The ground under the grass: dark, earthy green
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: 0x3d5427, roughness: 1 })
    );
    base.rotation.x = -Math.PI / 2;
    base.position.set((bounds.minX + bounds.maxX) / 2, 0.004, (bounds.minZ + bounds.maxZ) / 2);
    base.receiveShadow = true;
    scene.add(base);

    // Three lengths of grass, mixed in patches (longer in some spots)
    const geo = makeTuftGeometry();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    this.meshes = LENGTHS.map(() => {
      const mesh = new THREE.InstancedMesh(geo, mat, tufts);
      mesh.count = 0;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      return mesh;
    });

    this.tufts = [];          // { kind, index, x, z }
    this.grid = new Map();
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const tint = new THREE.Color();
    for (let i = 0; i < tufts; i++) {
      const x = bounds.minX + Math.random() * w;
      const z = bounds.minZ + Math.random() * d;
      // A slow wave across the patch decides which length grows where
      const patchiness = Math.sin(x * 0.9) * Math.cos(z * 0.7) + Math.random() * 1.2 - 0.6;
      const kind = patchiness > 0.45 ? 2 : patchiness > -0.35 ? 1 : 0;
      const mesh = this.meshes[kind];
      const index = mesh.count++;
      const len = LENGTHS[kind] * (0.8 + Math.random() * 0.4);
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      mesh.setMatrixAt(index, m.compose(p.set(x, 0.004, z), q, s.set(1 + Math.random() * 0.4, len, 1 + Math.random() * 0.4)));
      mesh.setColorAt(index, tint.setHSL(0.22 + Math.random() * 0.06, 0.35, 0.72 + Math.random() * 0.2));   // a slight shade per tuft
      const tuft = { kind, index, x, z, flat: false };
      this.tufts.push(tuft);
      const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key).push(tuft);
    }
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  contains(x, z) {
    const b = this.bounds;
    return x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
  }

  // A tyre rolled over (x, z): the grass under it is pressed flat and gone
  flatten(x, z, radius) {
    const c0 = Math.floor((x - radius) / CELL), c1 = Math.floor((x + radius) / CELL);
    const r0 = Math.floor((z - radius) / CELL), r1 = Math.floor((z + radius) / CELL);
    for (let cx = c0; cx <= c1; cx++) {
      for (let cz = r0; cz <= r1; cz++) {
        const list = this.grid.get(`${cx},${cz}`);
        if (!list) continue;
        for (const t of list) {
          if (t.flat || Math.hypot(t.x - x, t.z - z) > radius) continue;
          t.flat = true;
          const mesh = this.meshes[t.kind];
          mesh.setMatrixAt(t.index, this._zero);
          mesh.instanceMatrix.needsUpdate = true;
        }
      }
    }
  }
}
