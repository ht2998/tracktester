// =====================================================================
// GRASS: a patch of real 3D grass made of thousands of little tufts in
// three lengths (short, medium, long), drawn with instancing: one draw
// call per length. Driving over it flattens the grass under the tyres
// (those tufts disappear) and leaves a dark brown trail (drawn in
// rendering.js). The grip and drag are in physics.js (SURFACES.grass).
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 4;

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


// The grass material, shared by the patch and the field: vertex colours,
// and swaying in the wind on the graphics card
function grassUniforms(base = 0.004) {
  return {
    uWind: { value: new THREE.Vector2() }, uTime: { value: 0 },
    uBase: { value: base },              // ground height (where the roots are)
    uFade: { value: new THREE.Vector3() },   // x, z of the middle, and the radius they fade out at (0 = no fade)
  };
}
function grassMaterial(uniforms) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  // Swaying in the wind: the tips bend downwind, more for long grass, in
  // gusts that roll across the patch (done on the graphics card)
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'uniform vec2 uWind;\nuniform float uTime;\nuniform float uBase;\nuniform vec3 uFade;\n' + shader.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      // far edge of a field that follows the car: tufts shrink into the ground
      #ifdef USE_INSTANCING
      if (uFade.z > 0.0) {
        vec3 root = vec3(instanceMatrix[3][0], uBase, instanceMatrix[3][2]);
        float fade = smoothstep(uFade.z, uFade.z * 0.7, distance(root.xz, uFade.xy));
        mvPosition.xyz = root + (mvPosition.xyz - root) * fade;
      }
      #endif
      float hgt = max(mvPosition.y - uBase, 0.0);
      float wave = sin(uTime * 1.9 - dot(mvPosition.xz, normalize(uWind + vec2(1e-4))) * 0.45);
      float flutter = sin(uTime * 7.0 + mvPosition.x * 3.1 + mvPosition.z * 2.3);
      float bendAmt = hgt * hgt * (0.55 + 0.35 * wave) * 0.5;
      mvPosition.xz += uWind * bendAmt + normalize(uWind + vec2(1e-4)) * flutter * hgt * 0.03 * length(uWind) * 0.2;
      mvPosition.y -= bendAmt * length(uWind) * 0.25;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
  };
  return mat;
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
    this.windUniforms = grassUniforms();
    const mat = grassMaterial(this.windUniforms);
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

  // The wind at ground level (m/s, x and z) and the time, every frame
  setWind(x, z, time) {
    this.windUniforms.uWind.value.set(x, z);
    this.windUniforms.uTime.value = time;
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

// ---------------------------------------------------------------------
// FIELDS THAT FOLLOW THE CAR: for a whole circuit of grass and gravel,
// there's far too much ground to cover all of it in 3D tufts and stones.
// Instead the ground is split into 4 m squares, and only the squares near
// the car get them. Each square always grows the same tufts (they're made
// from its own seeded random numbers), so driving away and back looks the
// same, and the ones you've driven over stay flattened.
// ---------------------------------------------------------------------
const CHUNK = 4;

// The same random numbers every time for a given square
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

class ChunkScatter {
  // meshes: one InstancedMesh per kind. make(rand, x, z) -> { kind, matrix,
  // colour } for one item at (x, z), or null to skip. perChunk: how many
  // to try in each square at full density. near: everything this close
  // (all round, for the mirrors and looking back). far: how far ahead in
  // view. Further away they thin out (half beyond far/3, a quarter beyond
  // far*0.6), where single tufts are too small to see one by one anyway.
  constructor(meshes, { make, perChunk, near, far }) {
    this.meshes = meshes;
    this.make = make;
    this.perChunk = perChunk;
    this.near = near;
    this.far = far;
    this.cache = new Map();       // square -> its items, while near
    this.flat = new Map();        // square -> which items are flattened (kept for good)
    this.viewKey = null;
    this.pending = false;         // squares still to grow (spread over a few frames)
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  chunk(cx, cz) {
    const key = cx * 100003 + cz;
    let c = this.cache.get(key);
    if (c) return c;
    c = {
      key, cx, cz, items: [], tried: 0,
      rand: seeded(key * 2654435761 + 12345),
      // (each item's matrix and colour are kept as plain numbers in one
      // block per square, and copied straight into the meshes)
      mats: new Float32Array(this.perChunk * 16), cols: new Float32Array(this.perChunk * 3),
    };
    this.cache.set(key, c);
    return c;
  }

  // Grow a square's items up to the first `upTo` tries (always the same ones)
  grow(c, upTo) {
    while (c.tried < upTo) {
      const i = c.tried++;
      const x = (c.cx + c.rand()) * CHUNK, z = (c.cz + c.rand()) * CHUNK;
      const it = this.make(c.rand, x, z, i);
      if (!it) continue;
      const n = c.items.length;
      c.mats.set(it.matrix.elements, n * 16);
      if (it.colour) { c.cols[n * 3] = it.colour.r; c.cols[n * 3 + 1] = it.colour.g; c.cols[n * 3 + 2] = it.colour.b; }
      c.items.push({ kind: it.kind, x, z, i, n, slot: -1 });
    }
  }

  // Call every frame with the camera's position, the way it's looking
  // (dx, dz) and half the width of its view (radians). Rebuilds the set
  // when the camera has moved 4 m or turned 12 degrees.
  update(x, z, dx = 0, dz = 1, halfView = Math.PI) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const heading = Math.atan2(dx, dz);
    const key = `${cx},${cz},${Math.round(heading / 0.21)},${Math.round(halfView * 10)}`;
    if (key === this.viewKey && !this.pending) return;
    this.viewKey = key;
    this.pending = false;
    let budget = 60;              // new squares grown per frame (the rest next frame)
    const counts = this.meshes.map(() => 0);
    const caps = this.meshes.map((m) => m.instanceMatrix.count);
    const matArr = this.meshes.map((m) => m.instanceMatrix.array);
    const colArr = this.meshes.map((m) => m.instanceColor?.array);
    const zero = this._zero.elements;
    const reach = Math.ceil(this.far / CHUNK) + 1;
    const keep = new Set();
    const list = [];
    for (let ix = -reach; ix <= reach; ix++) {
      for (let iz = -reach; iz <= reach; iz++) {
        const mx = (cx + ix + 0.5) * CHUNK - x, mz = (cz + iz + 0.5) * CHUNK - z;
        const d = Math.hypot(mx, mz);
        if (d > this.far + CHUNK) continue;
        if (d > this.near + CHUNK) {
          // in view? (with a margin for the square's own size)
          let off = Math.atan2(mx, mz) - heading;
          off = Math.abs(Math.atan2(Math.sin(off), Math.cos(off)));
          if (off > halfView + 0.25 + Math.atan2(CHUNK, d)) continue;
        }
        list.push([cx + ix, cz + iz, d]);
      }
    }
    list.sort((p, q) => p[2] - q[2]);          // nearest first (they matter most)
    for (const [ux, uz, d] of list) {
      const share = d < this.far / 3 ? 1 : d < this.far * 0.6 ? 0.5 : 0.25;
      const want = Math.round(this.perChunk * share);
      const c = this.chunk(ux, uz);
      keep.add(c.key);
      if (c.tried < want) {
        if (budget <= 0) { this.pending = true; continue; }
        budget--;
        this.grow(c, want);
      }
      const flat = this.flat.get(c.key);
      const mats = c.mats, cols = c.cols;
      for (const it of c.items) {
        if (it.i >= want) { it.slot = -1; continue; }
        const k = it.kind, n = counts[k];
        if (n >= caps[k]) { it.slot = -1; continue; }
        it.slot = n;
        const dst = matArr[k], o = n * 16;
        if (flat && flat.has(it.i)) { for (let j = 0; j < 16; j++) dst[o + j] = zero[j]; }
        else { const src = it.n * 16; for (let j = 0; j < 16; j++) dst[o + j] = mats[src + j]; }
        const dc = colArr[k];
        if (dc) { const o3 = n * 3, s3 = it.n * 3; dc[o3] = cols[s3]; dc[o3 + 1] = cols[s3 + 1]; dc[o3 + 2] = cols[s3 + 2]; }
        counts[k] = n + 1;
      }
    }
    this.meshes.forEach((mesh, k) => {
      mesh.count = counts[k];
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    // forget squares that are well out of view (they'll grow back the same)
    if (this.cache.size > keep.size * 2 + 200) {
      for (const k of this.cache.keys()) if (!keep.has(k)) this.cache.delete(k);
    }
  }

  // Flatten the items within r of (x, z): they disappear, for good
  flatten(x, z, r) {
    const c = this.cache.get(Math.floor(x / CHUNK) * 100003 + Math.floor(z / CHUNK));
    if (!c) return;
    for (const it of c.items) {
      if (Math.abs(it.x - x) > r || Math.abs(it.z - z) > r || Math.hypot(it.x - x, it.z - z) > r) continue;
      let flat = this.flat.get(c.key);
      if (!flat) { flat = new Set(); this.flat.set(c.key, flat); }
      if (flat.has(it.i)) continue;
      flat.add(it.i);
      if (it.slot >= 0) {
        const mesh = this.meshes[it.kind];
        mesh.setMatrixAt(it.slot, this._zero);
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

// A whole circuit's grass, as 3D tufts everywhere the camera can see (out
// to `far`, then the painted grass texture). isGrass(x, z): is that spot grass?
export class GrassField {
  constructor(scene, isGrass, { groundY = 0, near = 10, far = 70, density = 20, maxTufts = 60000 } = {}) {
    this.isGrass = isGrass;
    this.windUniforms = grassUniforms(groundY);
    this.windUniforms.uFade.value.set(0, 0, far);
    const geo = makeTuftGeometry();
    const mat = grassMaterial(this.windUniforms);
    const meshes = LENGTHS.map(() => {
      const mesh = new THREE.InstancedMesh(geo, mat, Math.round(maxTufts * 0.55));
      mesh.count = 0;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.setColorAt(0, new THREE.Color());       // (makes its colour list)
      scene.add(mesh);
      return mesh;
    });
    const q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const tm = new THREE.Matrix4(), tc = new THREE.Color();
    this.scatter = new ChunkScatter(meshes, {
      perChunk: Math.round(density * CHUNK * CHUNK),
      near, far,
      make: (rand, x, z) => {
        const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand(), r5 = rand(), r6 = rand(), r7 = rand();
        if (!isGrass(x, z)) return null;
        const patchiness = Math.sin(x * 0.9) * Math.cos(z * 0.7) + r1 * 1.2 - 0.6;
        const kind = patchiness > 0.45 ? 2 : patchiness > -0.35 ? 1 : 0;
        const len = LENGTHS[kind] * (0.8 + r2 * 0.4);
        q.setFromAxisAngle(up, r3 * Math.PI * 2);
        tm.compose(p.set(x, groundY, z), q, sc.set(1 + r4 * 0.4, len, 1 + r5 * 0.4));
        tc.setHSL(0.22 + r6 * 0.06, 0.35, 0.72 + r7 * 0.2);
        return { kind, matrix: tm, colour: tc };
      },
    });
  }

  contains(x, z) { return this.isGrass(x, z); }
  flatten(x, z, r) { this.scatter.flatten(x, z, r); }

  // Every frame: where the camera is, which way it looks (dx, dz) and
  // half the width of its view (radians)
  update(x, z, dx, dz, halfView) {
    this.windUniforms.uFade.value.x = x;
    this.windUniforms.uFade.value.y = z;
    this.scatter.update(x, z, dx, dz, halfView);
  }

  setWind(x, z, time) {
    this.windUniforms.uWind.value.set(x, z);
    this.windUniforms.uTime.value = time;
  }
}

// Loose stones on gravel traps, everywhere the camera can see (like the
// test area's gravel trap). isGravel(x, z): is that spot gravel?
export class StoneField {
  constructor(scene, isGravel, { groundY = 0, near = 10, far = 45, density = 6, maxStones = 8000, shades = ['#a88c5f'] } = {}) {
    const mesh = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }),
      maxStones);
    mesh.count = 0;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, new THREE.Color());
    scene.add(mesh);
    const q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const tm = new THREE.Matrix4(), tc = new THREE.Color();
    this.scatter = new ChunkScatter([mesh], {
      perChunk: Math.round(density * CHUNK * CHUNK),
      near, far,
      make: (rand, x, z) => {
        const a = rand(), b = rand(), c = rand(), d = rand(), f = rand(), g = rand(), h = rand(), k = rand();
        if (!isGravel(x, z)) return null;
        const r = 0.012 + a * b * 0.035;
        q.setFromEuler(e.set(c * 6, d * 6, f * 6));
        tm.compose(p.set(x, groundY + r * 0.25, z), q,
          sc.set(r * (0.8 + g * 0.5), r * (0.5 + h * 0.3), r * (0.8 + k * 0.5)));
        return { kind: 0, matrix: tm, colour: tc.set(shades[Math.floor(a * 997) % shades.length]) };
      },
    });
  }

  update(x, z, dx, dz, halfView) { this.scatter.update(x, z, dx, dz, halfView); }
}
