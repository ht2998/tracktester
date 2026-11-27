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

export const BUILD = 11;

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
  constructor() { this.pos = []; this.nor = []; this.col = []; this.uv = []; }
  // add a (non-indexed) geometry, moved by matrix m, coloured by colour(x, y, z)
  add(geo, m, colour) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes?.position, N = g.attributes?.normal, U = g.attributes?.uv;
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
      if (U && U.array) this.uv.push(U.array[i * 2], U.array[i * 2 + 1]); else this.uv.push(0.5, 0.5);
    }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
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


// =====================================================================
// GROWN TREES: each one grown from a seed, so no two are alike (studied off
// real tree models: a trunk that tapers and wanders, boughs spiralling out
// of it round the trunk, twigs off the boughs, and the leaves as clusters
// of leafy cards at the twigs' ends, filling an envelope the shape of the
// kind of tree). Kinds: oak (wide, low boughs), plane (tall, round), beech
// (dense dome), birch (slender, pale bark, hanging twigs), poplar (a tall
// column), pine (bare trunk, flat tiers at the top), rain (the tropical
// rainforest tree: tall, its crown a broad flat umbrella)
// =====================================================================
const SPECIES = {
  oak:    { h: [11, 16], crown: [0.32, 0.95], wide: 0.5, flat: 0.75, r0: 0.032, boughs: [7, 10], rise: 0.35, twigs: 4, cards: 7, card: 1.5, bark: 0x5a4a3a, leaf: [0x4b7a32, 0x557f36, 0x426f2c] },
  plane:  { h: [13, 18], crown: [0.36, 0.98], wide: 0.36, flat: 0.95, r0: 0.026, boughs: [7, 9], rise: 0.6, twigs: 4, cards: 6, card: 1.5, bark: 0x8b8670, leaf: [0x5a8a3a, 0x4f7f32] },
  beech:  { h: [11, 15], crown: [0.3, 0.98], wide: 0.4, flat: 0.85, r0: 0.026, boughs: [8, 11], rise: 0.5, twigs: 4, cards: 7, card: 1.4, bark: 0x7d7b72, leaf: [0x4f8034, 0x5b8b3a] },
  birch:  { h: [10, 14], crown: [0.3, 0.98], wide: 0.26, flat: 1.1, r0: 0.019, boughs: [8, 11], rise: 0.55, droop: 0.5, twigs: 3, cards: 5, card: 1.1, bark: 0xd8d4c8, leaf: [0x6a9a3e, 0x5e8f38] },
  poplar: { h: [15, 19], crown: [0.15, 0.99], wide: 0.13, flat: 1.0, r0: 0.022, boughs: [10, 13], rise: 0.85, twigs: 3, cards: 5, card: 1.2, bark: 0x6e6a5c, leaf: [0x4e7d30, 0x5a8836] },
  pine:   { h: [12, 18], crown: [0.55, 1.0], wide: 0.24, flat: 0.8, r0: 0.024, boughs: [9, 12], rise: 0.12, twigs: 3, cards: 4, card: 1.3, needles: true, bark: 0x6b4a34, leaf: [0x2f5230, 0x355a34] },
  rain:   { h: [18, 26], crown: [0.6, 1.0], wide: 0.42, flat: 0.45, r0: 0.024, boughs: [6, 8], rise: 0.4, twigs: 4, cards: 7, card: 1.8, bark: 0x7a6a56, leaf: [0x2f5a22, 0x3a6527, 0x2b5320] },
};
// the leaves' cards: a cluster of leaves drawn once (pale, so each tree's own green tints it)
let LEAF_TEX = null, NEEDLE_TEX = null;
function leafTexture(needles) {
  if (typeof document === 'undefined') return null;
  if (needles ? NEEDLE_TEX : LEAF_TEX) return needles ? NEEDLE_TEX : LEAF_TEX;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const rand = seeded(needles ? 77 : 33);
  g.clearRect(0, 0, 256, 256);
  if (needles) {
    for (let k = 0; k < 9; k++) {                                  // (twigs of needles, fanned)
      const a = -1.2 + k * 0.3, x0 = 128, y0 = 236, L = 150 + rand() * 60;
      for (let n = 0; n < 60; n++) {
        const t = n / 60, x = x0 + Math.sin(a) * L * t, y = y0 - Math.cos(a) * L * t, side = n % 2 ? 1 : -1, l = 18 * (1 - t * 0.5);
        const v = 170 + rand() * 70; g.strokeStyle = `rgb(${v * 0.85 | 0},${v | 0},${v * 0.8 | 0})`; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l * side + Math.sin(a) * l * 0.5, y + Math.sin(a) * l * side - Math.cos(a) * l * 0.5); g.stroke();
      }
    }
  } else {
    for (let n = 0; n < 70; n++) {                                  // (leaves, overlapping, every one turned its own way)
      const x = 30 + rand() * 196, y = 30 + rand() * 196, a = rand() * Math.PI * 2, L = 22 + rand() * 18, W = L * (0.42 + rand() * 0.18);
      const v = 150 + rand() * 105;
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = `rgb(${v * 0.86 | 0},${v | 0},${v * 0.78 | 0})`;
      g.beginPath(); g.moveTo(0, -L / 2); g.quadraticCurveTo(W, 0, 0, L / 2); g.quadraticCurveTo(-W, 0, 0, -L / 2); g.fill();
      g.strokeStyle = `rgba(0,0,0,0.18)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -L / 2); g.lineTo(0, L / 2); g.stroke();
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (needles) NEEDLE_TEX = t; else LEAF_TEX = t;
  return t;
}
// a tapered tube along a list of points (each with its radius)
function tube(B, pts, sides, colour) {
  const g = new THREE.BufferGeometry(), pos = [], idx = [], up = new THREE.Vector3(0, 1, 0);
  const t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    t.set(q.x - o.x, q.y - o.y, q.z - o.z).normalize();
    a.copy(Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).cross(t).normalize(); b.copy(t).cross(a);
    for (let k = 0; k < sides; k++) { const ang = k / sides * Math.PI * 2, c = Math.cos(ang) * p.r, s = Math.sin(ang) * p.r; pos.push(p.x + a.x * c + b.x * s, p.y + a.y * c + b.y * s, p.z + a.z * c + b.z * s); }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) { const p0 = i * sides + k, p1 = i * sides + (k + 1) % sides, q0 = p0 + sides, q1 = p1 + sides; idx.push(p0, q0, p1, p1, q0, q1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  B.add(g, new THREE.Matrix4(), colour);
}
function growTree(rand, kind, { lite = false } = {}) {
  const sp = SPECIES[kind], trunkB = new Builder(), leafB = new Builder();
  const H = sp.h[0] + rand() * (sp.h[1] - sp.h[0]), R = H * sp.wide * (0.85 + rand() * 0.3);
  const base = H * sp.crown[0], cy = (base + H) / 2, ry = (H - base) / 2 * sp.flat + (H - base) / 2 * (1 - sp.flat) * 0.5;
  const bark = col(sp.bark), leafCols = sp.leaf.map(col);
  const barkCol = (x, y) => shade(bark, y, 0, H, 0.6);
  // the trunk: tapering, wandering a little as it climbs, up into the crown
  const lean = [(rand() - 0.5) * 0.06, (rand() - 0.5) * 0.06], r0 = H * sp.r0 * (0.85 + rand() * 0.3);
  const trunk = [];
  const TN = lite ? 4 : 9, topY = kind === 'poplar' || kind === 'pine' ? H * 0.97 : H * 0.8;
  for (let i = 0; i <= TN; i++) {
    const t = i / TN, y = topY * t, w = Math.sin(t * 5 + rand()) * 0.08 * H * 0.02;
    trunk.push({ x: lean[0] * y + w, y, z: lean[1] * y + w * 0.6, r: r0 * (i === 0 ? 1.45 : 1 - t * 0.8) });
  }
  tube(trunkB, trunk, lite ? 5 : 8, barkCol);
  const trunkAt = (y) => { const t = Math.min(1, y / topY); const i = Math.min(TN - 1, Math.floor(t * TN)), f = t * TN - i; const a = trunk[i], b = trunk[i + 1]; return { x: a.x + (b.x - a.x) * f, y, z: a.z + (b.z - a.z) * f, r: a.r + (b.r - a.r) * f }; };
  // where the envelope's edge is, from its middle, in a direction
  const reach = (dx, dy, dz) => { const L = Math.hypot(dx / R, dy / ry, dz / R); return 1 / (L || 1); };
  const cards = [];
  const nB = Math.round((sp.boughs[0] + rand() * (sp.boughs[1] - sp.boughs[0])) * (lite ? 0.6 : 1));
  for (let k = 0; k < nB; k++) {
    const t = (k + 0.5) / nB, y0 = base + (topY - base) * (0.05 + 0.9 * t) * (kind === 'pine' ? 1 : 0.92);
    const ang = k * 2.39996 + rand() * 0.5, out = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
    const rise = sp.rise + (rand() - 0.5) * 0.25 + (kind === 'pine' ? -t * 0.1 : 0);
    const dir = out.clone().multiplyScalar(1).add(new THREE.Vector3(0, rise, 0)).normalize();
    const s = trunkAt(y0);
    // how far to the envelope's edge from here, along this way
    const ox = s.x, oy = s.y - cy, oz = s.z;
    let L = 0.3; while (L < H && Math.hypot((ox + dir.x * L) / R, (oy + dir.y * L) / ry, (oz + dir.z * L) / R) < 0.92) L += 0.25;
    L *= 0.8 + rand() * 0.2;
    const pts = [], BN = lite ? 2 : 4, br = Math.max(0.03, s.r * 0.55);
    for (let i = 0; i <= BN; i++) {
      const u = i / BN, droop = (sp.droop || 0) * u * u * L * 0.25 + (kind === 'pine' ? u * u * L * 0.08 : 0);
      pts.push({ x: s.x + dir.x * L * u, y: s.y + dir.y * L * u - droop, z: s.z + dir.z * L * u, r: br * (1 - u * 0.8) });
    }
    tube(trunkB, pts, lite ? 3 : 5, barkCol);
    // twigs off the bough's outer part, each ending in a cluster of leaves
    const nT = lite ? 1 : sp.twigs;
    for (let j = 0; j < nT; j++) {
      const u = 0.45 + 0.55 * (j + rand() * 0.6) / nT, i = Math.min(BN - 1, Math.floor(u * BN)), f = u * BN - i;
      const p = { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f, z: pts[i].z + (pts[i + 1].z - pts[i].z) * f };
      const tw = new THREE.Vector3(rand() - 0.5, (rand() - 0.3) * 0.8 - (sp.droop || 0) * 0.6, rand() - 0.5).normalize().add(dir).normalize(), tl = L * (0.25 + rand() * 0.2);
      const end = { x: p.x + tw.x * tl, y: p.y + tw.y * tl, z: p.z + tw.z * tl };
      if (!lite && j === 0) tube(trunkB, [{ ...p, r: br * 0.35 }, { ...end, r: br * 0.12 }], 3, barkCol);   // (one twig per bough drawn; the rest hidden in the leaves anyway)
      cards.push(end, { x: (p.x + end.x) / 2, y: (p.y + end.y) / 2, z: (p.z + end.z) / 2 });
    }
    cards.push(pts[BN]);
  }
  if (kind === 'poplar' || kind === 'pine') cards.push(trunk[TN]);
  // the leaves: at each cluster point a few cards, turned every way, each its own green; darker
  // low and inside the crown, lit on top and at its rim
  const quad = new THREE.PlaneGeometry(1, 1);
  for (const c of cards) {
    const n = Math.max(1, Math.round(sp.cards * (lite ? 0.5 : 1) * (0.6 + rand() * 0.6) / 4));       // (half as many cards as at first, each bigger)
    for (let m = 0; m < n; m++) {
      const sz = sp.card * 1.35 * (0.75 + rand() * 0.5) * (lite ? 1.4 : 1);
      const px = c.x + (rand() - 0.5) * sz * 0.8, py = c.y + (rand() - 0.5) * sz * 0.6, pz = c.z + (rand() - 0.5) * sz * 0.8;
      const tone = leafCols[Math.floor(rand() * leafCols.length)];
      const mtx = M(px, py, pz, sz, sz, sz, (rand() - 0.5) * 2.4, rand() * Math.PI * 2, (rand() - 0.5) * 1.2);
      leafB.add(quad, mtx, (x, y, z) => { const rim = Math.min(1, Math.hypot(x / R, (y - cy) / ry, z / R)); return shade(tone, y, base - 1, H, 0.45 + 0.35 * rim); });
    }
  }
  // the simple shape, for far off: the trunk and the crown as one blob, in the tree's own colours
  const far = new Builder(), lg = leafCols[0];
  far.add(new THREE.CylinderGeometry(r0 * 0.5, r0 * 1.2, base + 0.5, 5, 1), M(0, (base + 0.5) / 2, 0), () => bark);
  far.add(new THREE.IcosahedronGeometry(1, 1), M(0, cy, 0, R * 0.95, ry * 0.95, R * 0.95), (x, y) => shade(lg, y, base, H, 0.5));
  return { trunk: trunkB.build(), leaves: leafB.build(), needles: !!sp.needles, height: H, simple: far.build() };
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
// Palm (studied off a real palm model): a trunk flaring at its foot and tapering up,
// wrapped in the stubs of old fronds; at the top a crown of long arching fronds, each a
// curved stalk with its leaflets hanging either side (a drawn, see-through texture),
// the young ones standing up, the old ones drooping. Limits: trunk 5-8.5 m, fronds 3.2-5 m
let FROND_TEX = null;
function frondTexture() {
  if (typeof document === 'undefined') return null;
  if (FROND_TEX) return FROND_TEX;
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const g = c.getContext('2d');
  const rand = seeded(91);
  g.clearRect(0, 0, 128, 512);
  for (let y = 6; y < 506; y += 5) {                                // (leaflets both sides of the stalk, longest mid-frond)
    const t = y / 512, L = 58 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)) * (0.8 + rand() * 0.3);
    for (const side of [-1, 1]) {
      const v = 150 + rand() * 90; g.strokeStyle = `rgb(${v * 0.85 | 0},${v | 0},${v * 0.7 | 0})`; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(64, y); g.quadraticCurveTo(64 + side * L * 0.6, y + 6, 64 + side * L, y + 22 + rand() * 8); g.stroke();
    }
  }
  g.strokeStyle = 'rgb(150,140,95)'; g.lineWidth = 4; g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 512); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (FROND_TEX = t);
}
function palm(rand, { height = 8, simple = false } = {}) {
  const trunkB = new Builder(), leafB = new Builder();
  const bark = col(0x6b5a44), boot = col(0x7a6a46), greens = [col(0x4f7a2c), col(0x5a8432), col(0x46702a)];
  const H = Math.min(8.5, Math.max(5, height * (0.85 + rand() * 0.25)));
  const lean = [(rand() - 0.5) * 0.08, (rand() - 0.5) * 0.08];
  // the trunk: flared foot, tapering, leaning a touch and curving back up
  const pts = [], TN = simple ? 4 : 10;
  for (let i = 0; i <= TN; i++) { const t = i / TN, y = H * t; pts.push({ x: lean[0] * y - lean[0] * y * t * 0.5, y, z: lean[1] * y - lean[1] * y * t * 0.5, r: 0.36 * (i === 0 ? 1.9 : 1 - t * 0.55) + (t < 0.15 ? 0.25 * (1 - t / 0.15) : 0) }); }
  tube(trunkB, pts, simple ? 6 : 9, (x, y) => shade(bark, y, 0, H, 0.7));
  const top = pts[TN];
  // the stubs of old fronds, spiralling up the trunk (its rough coat)
  if (!simple) for (let k = 0; k < 26; k++) {
    const t = 0.25 + 0.72 * k / 26, p = pts[Math.round(t * TN)], a = k * 2.39996;
    trunkB.add(new THREE.ConeGeometry(0.09, 0.45, 4, 1), M(p.x + Math.cos(a) * p.r, p.y, p.z + Math.sin(a) * p.r, 1, 1, 1, Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7), () => boot);
  }
  // the crown: fronds round the top, the young ones up, the old ones drooping
  const nF = simple ? 9 : 16 + Math.floor(rand() * 6);
  for (let f = 0; f < nF; f++) {
    const a = f * 2.39996 + rand() * 0.3, age = f / nF;                    // (0: youngest, at the top; 1: oldest, lowest)
    const len = 3.2 + rand() * 1.8, rise = 0.9 - age * 1.5 + (rand() - 0.5) * 0.3;
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    const N = simple ? 3 : 7, pos = [], uv = [], idx = [];
    let p = new THREE.Vector3(top.x, top.y - age * 0.4, top.z), pitch = rise;
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = 0.55 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.08)), fold = 0.25;
      for (const sd of [-1, 1]) { pos.push(p.x + side.x * w * sd, p.y - w * fold, p.z + side.z * w * sd); uv.push(sd < 0 ? 0 : 1, t); }
      pos.push(p.x, p.y, p.z); uv.push(0.5, t);
      const step = len / N; pitch -= (0.35 + age * 0.25) / N * 2;             // (arching over, the old ones more)
      p = p.clone().add(out.clone().multiplyScalar(Math.cos(pitch) * step)).add(new THREE.Vector3(0, Math.sin(pitch) * step, 0));
    }
    for (let i = 0; i < N; i++) { const a0 = i * 3, b0 = a0 + 3; idx.push(a0, b0, a0 + 2, a0 + 2, b0, b0 + 2, a0 + 2, b0 + 2, a0 + 1, a0 + 1, b0 + 2, b0 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const tone = greens[f % greens.length].clone().multiplyScalar(1 - age * 0.25);
    leafB.add(g, new THREE.Matrix4(), (x, y) => shade(tone, y, H - 3, H + 1, 0.6));
  }
  const far = new Builder(), g0 = greens[0];
  far.add(new THREE.CylinderGeometry(0.22, 0.42, H, 5, 1), M(0, H / 2, 0), () => bark);
  for (let f = 0; f < 6; f++) { const a = f / 6 * Math.PI * 2; far.add(new THREE.ConeGeometry(0.5, 4, 3, 1), M(Math.cos(a) * 1.8, H - 0.3, Math.sin(a) * 1.8, 1, 1, 0.3, 0, -a, Math.PI / 2 + 0.25), () => g0); }
  return { trunk: trunkB.build(), leaves: leafB.build(), frond: true, height: H, simple: far.build() };
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
// THE DETAIL BY DISTANCE: where the camera is (set every frame), and how far off a tree
// is still drawn in full; beyond that it's a simple shape (a trunk and a blob of crown in
// its colours), there but not in detail, until you come close enough to see the detail
export const FLORA_CAM = { value: new THREE.Vector3() };
export const LOD_DIST = 110;
function swayMaterial(uniforms, { sway, flutter, side = THREE.FrontSide, roughness = 0.85, map = null, lod = 0 }) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, side, ...(map ? { map, alphaTest: 0.5 } : {}) });
  mat.customProgramCacheKey = () => `sway${sway}-${flutter}-${lod}-${!!map}`;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uCam: FLORA_CAM });
    shader.vertexShader = 'uniform vec2 uWind;\nuniform float uTime;\nuniform vec3 uCam;\n' + shader.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        vec3 root = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        ${lod ? `{ float camD = distance(root.xz, uCam.xz); if (${lod === 1 ? 'camD > ' : 'camD <= '}${LOD_DIST.toFixed(1)}) mvPosition = vec4(root, 1.0); }` : ''}
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
  const L1 = forest ? 0 : 1;          // (by the track: full trees near, simple shapes far; the far forest is simple already)
  const treeMats = {
    trunk: swayMaterial(uniforms, { sway: 0.0002, flutter: 0.0005, roughness: 0.95 }),
    trunkNear: swayMaterial(uniforms, { sway: 0.0002, flutter: 0.0005, roughness: 0.95, lod: L1 }),
    leaves: swayMaterial(uniforms, { sway: 0.0004, flutter: 0.004, side: THREE.DoubleSide }),
    cards: swayMaterial(uniforms, { sway: 0.0004, flutter: 0.006, side: THREE.DoubleSide, map: leafTexture(false), lod: L1 }),
    needles: swayMaterial(uniforms, { sway: 0.0004, flutter: 0.004, side: THREE.DoubleSide, map: leafTexture(true), lod: L1 }),
    fronds: swayMaterial(uniforms, { sway: 0.0005, flutter: 0.008, side: THREE.DoubleSide, map: frondTexture(), lod: L1 }),
    far: swayMaterial(uniforms, { sway: 0.0003, flutter: 0.001, lod: 2 }),
  };
  // (the leaf cards' shadows: only where there are leaves on them, not their whole squares)
  const cardDepth = (map) => (map ? new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 }) : undefined);
  const shrubMat = swayMaterial(uniforms, { sway: 0.02, flutter: 0.01 });
  const grassMat = swayMaterial(uniforms, { sway: 0.08, flutter: 0.03, side: THREE.DoubleSide, roughness: 0.9 });

  // The kinds of plant (a few shapes of each, so they don't all look alike)
  const kinds = [];
  const addKind = (name, model, count, opts) => kinds.push({ name, model, count: Math.round(count * density * (isMobile ? 0.3 : 1)), ...opts });
  // (each tree grown from its own seed: several of each kind, so no two stands look alike)
  // (by the track half again as many trees as there were: TREES_NEAR; 3 was too slow)
  const TREES_NEAR = 1.5;
  const grow = (kind, n, count, opts) => { for (let k = 0; k < n; k++) addKind('tree', growTree(rand, kind, { lite: forest }), count / n * (forest ? 1 : TREES_NEAR), opts); };
  if (forest) {
    const tropical = style === 'tropical';
    for (let k = 0; k < 3; k++) if (tropical) addKind('palm', palm(rand, { height: 8 + k * 1.5, simple: true }), 900, { gap: 6, clear: 0, trunkR: 0.3 });
    if (tropical) grow('rain', 4, 3300, { gap: 8, clear: 0, trunkR: 0.45 });
    else { grow('oak', 2, 1300, { gap: 8, clear: 0, trunkR: 0.45 }); grow('beech', 2, 1200, { gap: 8, clear: 0, trunkR: 0.4 }); grow('pine', 2, 1100, { gap: 7, clear: 0, trunkR: 0.35 }); }
  } else if (style === 'tropical') {
    for (let k = 0; k < 3; k++) addKind('palm', palm(rand, { height: 7 + k * 1.5 }), 380 * TREES_NEAR, { gap: 7, clear: 16, trunkR: 0.3 });
    grow('rain', 4, 640, { gap: 10, clear: 18, trunkR: 0.45 });
    grow('plane', 2, 260, { gap: 9, clear: 18, trunkR: 0.4 });
    addKind('shrub', shrub(rand, { size: 1.3 }), 900, { gap: 4, clear: 9 });
    addKind('shrub', shrub(rand, { size: 1.6, leaf: 0x35612a }), 700, { gap: 4, clear: 9 });
    addKind('shrub', shrub(rand, { size: 1.2, leaf: 0x3a6a2c, flowers: 0xd6337f }), 500, { gap: 4, clear: 9 });
    addKind('grass', tallGrass(rand), 4000, { gap: 2, clear: 6 });
  } else {
    grow('oak', 3, 330, { gap: 9, clear: 0, trunkR: 0.45 });
    grow('beech', 2, 200, { gap: 9, clear: 0, trunkR: 0.4 });
    grow('birch', 2, 160, { gap: 6, clear: 0, trunkR: 0.25 });
    grow('poplar', 1, 90, { gap: 6, clear: 0, trunkR: 0.3 });
    grow('pine', 2, 200, { gap: 8, clear: 0, trunkR: 0.35 });
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
    const leafMat = kind.model.frond ? treeMats.fronds : kind.model.needles ? treeMats.needles : kind.model.height ? treeMats.cards : treeMats.leaves;
    const grown = !!kind.model.height && !forest;
    const parts = isTree ? [[kind.model.trunk, grown ? treeMats.trunkNear : treeMats.trunk], [kind.model.leaves, leafMat], ...(grown && kind.model.simple ? [[kind.model.simple, treeMats.far]] : [])]
      : [[kind.model, kind.name === 'grass' ? grassMat : shrubMat]];
    const meshes = parts.map(([geo, mat]) => {
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, kind.count));
      // (only the trunks cast shadows: thousands of see-through leaf cards in the shadow pass were the slowness)
      mesh.castShadow = shadows && isTree && !isMobile && !forest && geo === kind.model.trunk;
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
