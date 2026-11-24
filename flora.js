// Trees, shrubs and tall grass, swaying in the wind.
//
// Each kind of plant is built once as a little 3D model (a trunk and a
// leafy crown made of lumpy blobs, a palm with drooping fronds, a bush, a
// clump of long grass), then drawn hundreds or thousands of times at once
// with "instancing" (one draw for all of them, each with its own position,
// turn, size and shade of green), so a whole forest stays quick.
//
// The wind bends them on the graphics card: the higher up a part is, the
// further it leans downwind, in gusts that roll across the ground, with a
// faster flutter on top (leaves and grass tips). Trees barely move, bushes
// a little, long grass a lot.
//
// Sepang gets a tropical mix: oil palms, broadleaf rainforest trees,
// bushes (some flowering pink, like bougainvillea) and tall grass. The test
// area gets broadleaf trees and conifers round its edges.
import * as THREE from 'three';

export const BUILD = 5;

// The same random numbers every time (so the forest is always the same)
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Building the models: pieces are added into one list of triangles ---
class Builder {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  // add a (non-indexed) geometry, moved by matrix m, coloured by colour(x, y, z)
  add(geo, m, colour) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes?.position, N = g.attributes?.normal;
    if (!P || !P.array) return this;          // (nothing to add)
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    for (let i = 0; i < P.count; i++) {
      v.set(P.array[i * 3], P.array[i * 3 + 1], P.array[i * 3 + 2]).applyMatrix4(m);
      if (N && N.array) n.set(N.array[i * 3], N.array[i * 3 + 1], N.array[i * 3 + 2]).applyMatrix3(nm).normalize();
      else n.set(0, 1, 0);
      this.pos.push(v.x, v.y, v.z);
      this.nor.push(n.x, n.y, n.z);
      const c = colour(v.x, v.y, v.z);
      this.col.push(c.r, c.g, c.b);
    }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere?.();
    return g;
  }
}
const M = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// A lumpy leaf blob: a ball with its surface pushed in and out a little
function lumpyBall(rand, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const P = g.attributes?.position;
  if (P && P.array) {
    const seed = rand() * 10;
    for (let i = 0; i < P.count; i++) {
      const x = P.array[i * 3], y = P.array[i * 3 + 1], z = P.array[i * 3 + 2];
      const k = 1 + 0.16 * Math.sin(x * 4.1 + seed) * Math.sin(y * 3.7 + seed * 1.3) * Math.sin(z * 4.4 + seed * 0.7);
      P.array[i * 3] = x * k; P.array[i * 3 + 1] = y * k; P.array[i * 3 + 2] = z * k;
    }
  }
  return g;
}

const col = (hex) => new THREE.Color(hex);
const shade = (base, y, lo, hi, dark = 0.55) => base.clone().multiplyScalar(dark + (1 - dark) * Math.min(1, Math.max(0, (y - lo) / (hi - lo))));

// Broadleaf tree: a trunk flaring at its roots, kinking as it climbs, its
// boughs reaching out and up into a domed crown of leafy clumps (each its
// own shade of green, darker underneath and inside, lit on top)
function broadleaf(rand, { height = 9, leaf = 0x3f6b2a, simple = false } = {}) {
  const trunkB = new Builder(), leafB = new Builder();
  const bark = col(0x5a4632);
  const trunkH = height * 0.42;
  const lean = (rand() - 0.5) * 0.12, lean2 = (rand() - 0.5) * 0.12;
  // the root flare, then the trunk in two pieces with a slight kink
  trunkB.add(new THREE.CylinderGeometry(0.3, 0.52, 0.5, 9, 1), M(0, 0.25, 0), () => shade(bark, 0, 0, 1, 0.7));
  trunkB.add(new THREE.CylinderGeometry(0.25, 0.32, trunkH * 0.55, 9, 1), M(0, trunkH * 0.27 + 0.2, 0, 1, 1, 1, lean, 0, lean2), (x, y) => shade(bark, y, 0, trunkH, 0.75));
  const kx = Math.sin(lean2) * -trunkH * 0.5, kz = Math.sin(lean) * trunkH * 0.5;
  trunkB.add(new THREE.CylinderGeometry(0.18, 0.25, trunkH * 0.55, 8, 1), M(kx * 0.7, trunkH * 0.75 + 0.1, kz * 0.7, 1, 1, 1, -lean * 0.6, 0, -lean2 * 0.6), (x, y) => shade(bark, y, 0, trunkH, 0.75));
  const green = col(leaf);
  const crownY = trunkH + height * 0.24, crownR = height * 0.33;
  const blobs = simple ? 4 : 7 + Math.floor(rand() * 3);
  const tones = [green, green.clone().lerp(col(0x9ab04a), 0.14), green.clone().multiplyScalar(0.82), green.clone().lerp(col(0x6f9a2a), 0.2)];
  for (let k = 0; k < blobs; k++) {
    const a = (k / blobs) * Math.PI * 2 + rand() * 0.8;
    const up = k === 0 ? 1 : rand();                                  // (some clumps high in the dome, some round its rim)
    const off = k === 0 ? 0 : crownR * (0.5 + 0.35 * (1 - up));
    const r = crownR * (k === 0 ? 0.7 : 0.42 + rand() * 0.22);
    const bx = Math.sin(a) * off, by = crownY + (k === 0 ? crownR * 0.25 : (up - 0.35) * crownR * 0.8), bz = Math.cos(a) * off;
    const tone = tones[k % tones.length];
    leafB.add(lumpyBall(rand, simple ? 0 : 1), M(bx, by, bz, r, r * 0.78, r, 0, rand() * 6, 0),
      (x, y, z) => { const inner = Math.min(1, Math.hypot(x, z) / (crownR * 1.1)); return shade(tone, y, crownY - crownR * 0.9, crownY + crownR, 0.42 + 0.18 * inner); });
    // a bough from the trunk's top out to this clump (inside the leaves, so none stick out)
    if (!simple && k > 0 && k <= 4) {
      const sx = kx * 1.2, sy = trunkH, sz = kz * 1.2, dx = bx * 0.75 - sx, dy = by - r * 0.4 - sy, dz = bz * 0.75 - sz, L = Math.hypot(dx, dy, dz);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
      trunkB.add(new THREE.CylinderGeometry(0.05, 0.13, L, 6, 1).translate(0, L / 2, 0), new THREE.Matrix4().compose(new THREE.Vector3(sx, sy, sz), q, new THREE.Vector3(1, 1, 1)), () => bark);
    }
  }
  return { trunk: trunkB.build(), leaves: leafB.build() };
}

// Conifer: a straight trunk under stacked cones
function conifer(rand, { height = 11 } = {}) {
  const trunkB = new Builder(), leafB = new Builder();
  const bark = col(0x4e3b2b), green = col(0x2c4f2e);
  trunkB.add(new THREE.CylinderGeometry(0.12, 0.28, height * 0.35, 7, 1), M(0, height * 0.175, 0), () => bark);
  for (let k = 0; k < 4; k++) {
    const y = height * (0.25 + k * 0.18), r = height * (0.24 - k * 0.045);
    leafB.add(new THREE.ConeGeometry(r, height * 0.32, 9, 1), M(0, y + height * 0.16, 0, 1, 1, 1, 0, rand() * 6, 0),
      (x, yy) => shade(green, yy, height * 0.2, height, 0.55));
  }
  return { trunk: trunkB.build(), leaves: leafB.build() };
}

// Oil palm: a rough, slightly leaning trunk and a crown of long drooping fronds
function palm(rand, { height = 8, simple = false } = {}) {
  const trunkB = new Builder(), leafB = new Builder();
  const bark = col(0x6b5a44), green = col(0x4f7a2c);
  const lean = (rand() - 0.5) * 0.25;
  const segs = simple ? 3 : 6;
  for (let k = 0; k < segs; k++) {
    const y = (k / segs) * height;
    trunkB.add(new THREE.CylinderGeometry(0.26, 0.3, height / segs + 0.02, 7, 1),
      M(Math.sin(lean) * y * 0.15, y + height / segs / 2, 0, 1, 1, 1, 0, 0, lean * 0.15), () => shade(bark, k, 0, segs, 0.7));
  }
  const top = new THREE.Vector3(Math.sin(lean) * height * 0.15, height, 0);
  const fronds = simple ? 8 : 10 + Math.floor(rand() * 4);
  for (let f = 0; f < fronds; f++) {
    const a = (f / fronds) * Math.PI * 2 + rand() * 0.3;
    const len = 3.6 + rand() * 1.2;
    const up = 0.5 - rand() * 0.4;
    // a frond: a tapering strip that rises then droops (4 pieces)
    let px = top.x, py = top.y, pz = top.z;
    const pieces = simple ? 2 : 4;
    for (let s = 0; s < pieces; s++) {
      const t0 = s / pieces, t1 = (s + 1) / pieces;
      const segLen = len / pieces;
      const pitch = up - (t0 + t1) * 0.55;            // droops more towards the tip
      const w0 = 0.45 * (1 - t0 * 0.8), w1 = 0.45 * (1 - t1 * 0.8);
      const dx = Math.sin(a) * Math.cos(pitch) * segLen, dy = Math.sin(pitch) * segLen, dz = Math.cos(a) * Math.cos(pitch) * segLen;
      const sx = Math.cos(a), sz = -Math.sin(a);       // across the frond
      // (each side of the rib folded down a little, like a real frond's
      // leaflets hanging either side of it; the edge cut ragged)
      const fold = 0.32, rag = (t) => 0.75 + 0.25 * Math.abs(Math.sin(t * 37 + f));
      const quad = new THREE.BufferGeometry();
      const v = [];
      for (const side of [-1, 1]) {
        const e0 = w0 * rag(t0), e1 = w1 * rag(t1);
        const ax = px, ay = py, az = pz, bx = px + dx, by = py + dy, bz = pz + dz;
        const cx = ax + side * sx * e0, cy = ay - e0 * fold, cz = az + side * sz * e0;
        const ex = bx + side * sx * e1, ey = by - e1 * fold, ez = bz + side * sz * e1;
        v.push(ax, ay, az, cx, cy, cz, ex, ey, ez, ax, ay, az, ex, ey, ez, bx, by, bz);
      }
      quad.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      quad.computeVertexNormals?.();
      leafB.add(quad, new THREE.Matrix4(), () => shade(green, s, 0, pieces, 0.7));
      px += dx; py += dy; pz += dz;
    }
  }
  return { trunk: trunkB.build(), leaves: leafB.build() };
}

// A bush: a few lumpy blobs close to the ground
function shrub(rand, { size = 1.2, leaf = 0x3d6a2c, flowers = null } = {}) {
  const b = new Builder();
  const green = col(leaf), pink = flowers ? col(flowers) : null;
  const n = 5 + Math.floor(rand() * 3);
  const tones = [green, green.clone().lerp(col(0x9ab04a), 0.16), green.clone().multiplyScalar(0.8)];
  for (let k = 0; k < n; k++) {
    const a = rand() * Math.PI * 2, d = rand() * size * 0.55;
    const r = size * (0.3 + rand() * 0.24);
    const tone = tones[k % 3];
    b.add(lumpyBall(rand, 0), M(Math.sin(a) * d, r * 0.7, Math.cos(a) * d, r, r * 0.75, r), (x, y, z) => {   // (simpler blobs: there are thousands)
      if (pink && Math.sin(x * 9.1) * Math.sin(z * 8.3) * Math.sin(y * 7.7) > 0.25) return pink;   // patches of flowers
      return shade(tone, y, 0, size * 1.1, 0.45);
    });
  }
  return b.build();
}

// A clump of long grass: thin blades fanning out from the middle
function tallGrass(rand) {
  const b = new Builder();
  const base = col(0x8a9a4e), tip = col(0xc9c48a);
  const blades = 22;
  for (let k = 0; k < blades; k++) {
    const a = rand() * Math.PI * 2, lean = 0.15 + rand() * 0.4;
    const h = 0.45 + rand() * 0.6, w = 0.022 + rand() * 0.01;
    const r0 = rand() * 0.14;
    const x0 = Math.sin(a) * r0, z0 = Math.cos(a) * r0;
    // (up, then curving over toward its tip)
    const xm = x0 + Math.sin(a) * lean * h * 0.35, zm = z0 + Math.cos(a) * lean * h * 0.35, hm = h * 0.6;
    const x1 = x0 + Math.sin(a) * lean * h * 1.3, z1 = z0 + Math.cos(a) * lean * h * 1.3, h1 = h * 0.92;
    const sx = Math.cos(a) * w, sz = -Math.sin(a) * w;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      x0 - sx, 0, z0 - sz, x0 + sx, 0, z0 + sz, xm + sx * 0.7, hm, zm + sz * 0.7,
      x0 - sx, 0, z0 - sz, xm + sx * 0.7, hm, zm + sz * 0.7, xm - sx * 0.7, hm, zm - sz * 0.7,
      xm - sx * 0.7, hm, zm - sz * 0.7, xm + sx * 0.7, hm, zm + sz * 0.7, x1, h1, z1], 3));
    g.computeVertexNormals?.();
    b.add(g, new THREE.Matrix4(), (x, y) => base.clone().lerp(tip, Math.min(1, y / 0.9)));
  }
  return b.build();
}

// The swaying, on the graphics card. sway: how far a part leans per metre
// of height squared, per m/s of wind; flutter: the quick shiver on top.
function swayMaterial(uniforms, { sway, flutter, side = THREE.FrontSide, roughness = 0.85 }) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, side });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'uniform vec2 uWind;\nuniform float uTime;\n' + shader.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        vec3 root = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float hgt = max(mvPosition.y - root.y, 0.0);
        vec2 dir = normalize(uWind + vec2(1e-4));
        float wave = sin(uTime * 1.3 - dot(root.xz, dir) * 0.21) * 0.5 + 0.5;
        float shiver = sin(uTime * 5.3 + mvPosition.x * 1.7 + mvPosition.z * 1.3);
        mvPosition.xz += uWind * (${sway.toFixed(5)} * hgt * hgt) * (0.5 + 0.5 * wave)
          + dir * shiver * ${flutter.toFixed(5)} * hgt * length(uWind);
      #endif
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
  };
  return mat;
}

// Plant everything. canPlace(x, z, clearance): may a plant this wide go
// here? area: { minX, maxX, minZ, maxZ } to scatter over; skip(x, z):
// leave this spot empty (e.g. the test area's driving ground). colliders: a
// list to add solid tree trunks to.
// seed: which random forest (different for each call); density: share of
// the usual number of plants.
// forest: just trees, lots of them, in simpler shapes (for the thick woods
// further out, where you only see them from a distance)
export function buildFlora(scene, { isMobile = false, style = 'tropical', area, canPlace, colliders = null, shadows = true, seed = null, density = 1, groves = true, forest = false }) {
  const uniforms = { uWind: { value: new THREE.Vector2() }, uTime: { value: 0 } };
  const rand = seeded(seed ?? (style === 'tropical' ? 1234 : 4321));
  const treeMats = {
    trunk: swayMaterial(uniforms, { sway: 0.0002, flutter: 0.0005, roughness: 0.95 }),
    leaves: swayMaterial(uniforms, { sway: 0.0004, flutter: 0.004, side: THREE.DoubleSide }),
  };
  const shrubMat = swayMaterial(uniforms, { sway: 0.02, flutter: 0.01 });
  const grassMat = swayMaterial(uniforms, { sway: 0.08, flutter: 0.03, side: THREE.DoubleSide, roughness: 0.9 });

  // The kinds of plant (a few shapes of each, so they don't all look alike)
  const kinds = [];
  const addKind = (name, model, count, opts) => kinds.push({ name, model, count: Math.round(count * density * (isMobile ? 0.3 : 1)), ...opts });
  if (forest) {
    const tropical = style === 'tropical';
    for (let k = 0; k < 3; k++) {
      if (tropical) addKind('palm', palm(rand, { height: 8 + k * 1.5, simple: true }), 900, { gap: 6, clear: 0, trunkR: 0.3 });
      addKind('tree', broadleaf(rand, { height: 13 + k * 4, leaf: [0x2f5a22, 0x3a6527, 0x2b5320][k], simple: true }), tropical ? 1100 : 1200, { gap: 7, clear: 0, trunkR: 0.45 });
    }
  } else if (style === 'tropical') {
    for (let k = 0; k < 3; k++) addKind('palm', palm(rand, { height: 7 + k * 1.5 }), 380, { gap: 7, clear: 16, trunkR: 0.3 });
    for (let k = 0; k < 3; k++) addKind('tree', broadleaf(rand, { height: 10 + k * 3, leaf: [0x3f6b2a, 0x35602a, 0x4a7530][k] }), 300, { gap: 9, clear: 18, trunkR: 0.4 });
    addKind('shrub', shrub(rand, { size: 1.3 }), 900, { gap: 4, clear: 9 });
    addKind('shrub', shrub(rand, { size: 1.6, leaf: 0x35612a }), 700, { gap: 4, clear: 9 });
    addKind('shrub', shrub(rand, { size: 1.2, leaf: 0x3a6a2c, flowers: 0xd6337f }), 500, { gap: 4, clear: 9 });
    addKind('grass', tallGrass(rand), 4000, { gap: 2, clear: 6 });
  } else {
    for (let k = 0; k < 3; k++) addKind('tree', broadleaf(rand, { height: 9 + k * 2.5, leaf: [0x4a7a32, 0x3d6b2b, 0x557f36][k] }), 260, { gap: 9, clear: 0, trunkR: 0.4 });
    for (let k = 0; k < 2; k++) addKind('tree', conifer(rand, { height: 10 + k * 4 }), 220, { gap: 8, clear: 0, trunkR: 0.3 });
    addKind('shrub', shrub(rand, { size: 1.3 }), 700, { gap: 4, clear: 0 });
    addKind('grass', tallGrass(rand), 2500, { gap: 2, clear: 0 });
  }

  // Groves: plants bunch up into woods and leave open spaces between
  const grove = (x, z) => Math.sin(x * 0.011 + 1.3) * Math.sin(z * 0.013 + 0.4) + 0.6 * Math.sin(x * 0.031) * Math.sin(z * 0.027 + 2.1);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const tint = new THREE.Color();
  let total = 0;
  for (const kind of kinds) {
    const isTree = kind.name === 'palm' || kind.name === 'tree';
    const parts = isTree ? [[kind.model.trunk, treeMats.trunk], [kind.model.leaves, treeMats.leaves]]
      : [[kind.model, kind.name === 'grass' ? grassMat : shrubMat]];
    const meshes = parts.map(([geo, mat]) => {
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, kind.count));
      mesh.castShadow = shadows && isTree && !isMobile && !forest;
      mesh.receiveShadow = true;
      mesh.count = 0;
      scene.add(mesh);
      return mesh;
    });
    let placed = 0, tries = 0;
    while (placed < kind.count && tries < kind.count * 30) {
      tries++;
      const x = area.minX + rand() * (area.maxX - area.minX), z = area.minZ + rand() * (area.maxZ - area.minZ);
      const g = grove(x, z);
      // trees want the woods, grass and bushes the edges and clearings
      const want = !groves || (isTree ? g > -0.1 : kind.name === 'grass' ? g < 0.6 : g > -0.6);
      const r1 = rand(), r2 = rand(), r3 = rand();
      if (!want || !canPlace(x, z, kind.clear, isTree)) continue;
      const s = isTree ? 0.8 + r1 * 0.45 : 0.7 + r1 * 0.6;
      q.setFromAxisAngle(up, r2 * Math.PI * 2);
      m4.compose(p.set(x, 0, z), q, sc.set(s, s * (0.9 + r3 * 0.2), s));
      tint.setHSL(0, 0, 0.85 + r3 * 0.3);
      for (const mesh of meshes) {
        mesh.setMatrixAt(placed, m4);
        mesh.setColorAt?.(placed, tint);
      }
      if (isTree && colliders) {
        const r = kind.trunkR * s;
        // (and which tree it is, so it can be knocked over)
        colliders.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, kind: 'tree', tree: { meshes, i: placed, x, z, s, sy: s * (0.9 + r3 * 0.2), q: q.clone() } });
      }
      placed++;
    }
    for (const mesh of meshes) {
      mesh.count = placed;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    total += placed;
  }

  return {
    count: total,
    // every frame: the wind at ground level (m/s) and the time
    setWind(x, z, time) {
      uniforms.uWind.value.set(x, z);
      uniforms.uTime.value = time;
    },
  };
}
