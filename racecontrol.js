// =====================================================================
// RACE CONTROL: what happens when something goes wrong out on the track.
//   - The safety car (a silver long-bonnet GT with a light bar, a tribute,
//     no badges): out of the pit exit after a big incident in a race; the
//     field queues up behind it, no overtaking, until the track's clear,
//     then "SAFETY CAR IN THIS LAP" and it peels off into the pit lane.
//   - The virtual safety car (VSC): for a smaller incident, everyone held
//     to a slower pace everywhere, no safety car needed.
//   - The red flag: a car blown up, or wreckage burning on the track:
//     the race stops, and restarts from the grid in the order they were.
//   - The recovery crane: a compact 6.5 tonne wheeled crane, the kind used
//     to lift cars clear of the barriers. In memory of Jules Bianchi: the
//     crane only ever works under double yellows, a safety car or a VSC,
//     and double yellows mean a speed limit in that zone.
//   - The ambulance (a tall, boxy high-roof van, a tribute): out to any
//     big crash, waits beside the car, then carries on round.
//   - Fire marshals: run from the nearest post with extinguishers to a
//     burning car, wreck or engine block, put it out, and walk back.
//   - Sweepers: bits of car left lying on the track get picked up.
//   - Nothing pops up out of thin air: the safety car and the ambulance
//     wait in the pit lane at the exit end and drive out and back; the
//     cranes are parked at recovery points (turns 1, 4, 9 and 15) and go
//     back there; marshals come out from behind their huts.
//   - A barrier badly hit: a safety car (or a red flag if it's wrecked),
//     and a repair crew from the nearest post fixing it.
//   - The rules: overtaking under yellow or the safety car, speeding under
//     the VSC or double yellows, ignoring blue flags: time penalties.
// The game (rendering.js) tells it what's happening every frame; the
// computer drivers (ai.js) ask it how fast they may go (rules()).
// =====================================================================

import * as THREE from 'three';
import { Person, makeExtinguisher } from './pits.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 10;

const std = (color, rough = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const boxAt = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function addMesh(parent, geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; parent.add(m); return m; }
// each wheel its own pair of groups: the outer turns to steer, the inner rolls
function wheelGroup(parent, x, z, r) {
  const steer = new THREE.Group(); steer.position.set(x, r, z); parent.add(steer);
  const spin = new THREE.Group(); steer.add(spin);
  (parent.userData.wheels || (parent.userData.wheels = [])).push({ steer, spin, r, front: z > 0 });
  return spin;
}
function label(text, bg, fg, w = 256, h = 48) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = `bold ${Math.round(h * 0.62)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, transparent: bg === 'transparent' });
}

// --- THE AMBULANCE: a tall boxy high-roof van, short sloping nose, white
// with a red stripe, red beacons, AMBULANCE on the sides ---
// a side profile (points along the length z, and up y) made solid across
// the width, with rounded edges: for van bodies and cabs
function profileBody(pts, width, bevel = 0.07) {
  const sh = new THREE.Shape();
  pts.forEach(([z, y], k) => (k ? sh.lineTo(-z, y) : sh.moveTo(-z, y)));
  sh.lineTo(-pts[0][0], pts[0][1]);
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
  g.rotateY(Math.PI / 2);                            // (the shape's x becomes -z, its depth becomes x)
  g.translate(-(width - bevel * 2) / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}
// a box with rounded edges and corners
function roundBox(w, h, d, r, x = 0, y = 0, z = 0) {
  const sh = new THREE.Shape(), hw = w / 2 - r, hh = h / 2 - r;
  sh.moveTo(-hw, -h / 2); sh.lineTo(hw, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh); sh.lineTo(w / 2, hh);
  sh.quadraticCurveTo(w / 2, h / 2, hw, h / 2); sh.lineTo(-hw, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
  sh.lineTo(-w / 2, -hh); sh.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, d - r * 2), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 3, curveSegments: 4 });
  g.translate(x, y, z - (d - r * 2) / 2);
  g.computeVertexNormals();
  return g;
}
// the bright block pattern down the sides of an emergency vehicle
function blockStripe(c1, c2, w = 512, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let i = 0; i < w / 32; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? c1 : c2; g.fillRect(i * 32, j * 32, 32, 32); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, emissive: 0x111111 });
}

// --- DETAIL KIT: lots of small parts, merged into one mesh per material
// (so a detailed vehicle is still only a handful of things to draw) ---
function mergeGeos(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of geos) { if (!g.attributes.normal) g.computeVertexNormals(); n += g.attributes.position.count; }
  if (!(n > 0)) return null;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, c * 3), o * 3);
    nor.set(g.attributes.normal.array.subarray(0, c * 3), o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}
class Kit {
  constructor() { this.parts = new Map(); }
  add(geo, mat) { let l = this.parts.get(mat); if (!l) this.parts.set(mat, (l = [])); l.push(geo); return geo; }
  into(parent, shadow = true) {
    for (const [mat, list] of this.parts) {
      let geo = null;
      try { geo = mergeGeos(list); } catch (e) { geo = null; }
      if (geo) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow && !mat.transparent; m.receiveShadow = !mat.transparent; parent.add(m); }
      else for (const g of list) addMesh(parent, g, mat, shadow);
    }
    this.parts.clear();
    return parent;
  }
}
// a smooth curve through [z, value] points (for body outlines)
function spline(keys) {
  const n = keys.length;
  const m = keys.map((k, i) => { const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / ((b[0] - a[0]) || 1); });
  return (z) => {
    if (z <= keys[0][0]) return keys[0][1];
    if (z >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (z > keys[i + 1][0]) i++;
    const [z0, v0] = keys[i], [z1, v1] = keys[i + 1], h = z1 - z0, t = (z - z0) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * h * m[i + 1];
  };
}
// a smooth body made from cross-sections along its length: f(z) gives
// { w (width), top, bot, tuck (how much narrower at the top), sq (how
// square the corners: 2 round, 10 nearly square), x (sideways offset) }
function loft(z0, z1, n, f, ring = 28) {
  const pos = [], uv = [], idx = [];
  const R = ring + 1;
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * i / n, s = f(z);
    const hw = s.w / 2, mid = (s.top + s.bot) / 2, hh = Math.max(0.001, (s.top - s.bot) / 2), e = 2 / (s.sq ?? 4), ox = s.x || 0;
    for (let k = 0; k <= ring; k++) {
      const a = -Math.PI / 2 + k / ring * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const yy = Math.sign(sn) * Math.pow(Math.abs(sn), e), xx = Math.sign(c) * Math.pow(Math.abs(c), e);
      const taper = 1 - (s.tuck || 0) * Math.max(0, yy);
      pos.push(ox + xx * hw * taper, mid + yy * hh, z); uv.push(k / ring, i / n);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < ring; k++) { const a = i * R + k, b = a + R; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  // the two ends, closed
  for (const [i, dir] of [[0, -1], [n, 1]]) {
    let cx = 0, cy = 0;
    for (let k = 0; k < ring; k++) { cx += pos[(i * R + k) * 3]; cy += pos[(i * R + k) * 3 + 1]; }
    const base = pos.length / 3;
    pos.push(cx / ring, cy / ring, pos[i * R * 3 + 2]); uv.push(0.5, 0.5);
    for (let k = 0; k <= ring; k++) { const j = (i * R + k) * 3; pos.push(pos[j], pos[j + 1], pos[j + 2]); uv.push(0.5, 0.5); }
    for (let k = 0; k < ring; k++) dir > 0 ? idx.push(base, base + 1 + k, base + 2 + k) : idx.push(base, base + 2 + k, base + 1 + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// wheel arches cut into a body's underside (the bottom rises over each wheel)
const arched = (bot, wheelsZ, r, y) => (z) => { let b = bot(z); for (const wz of wheelsZ) { const d = z - wz; if (Math.abs(d) < r) b = Math.max(b, y + Math.sqrt(r * r - d * d)); } return b; };
// a tube from a to b (arrays [x, y, z])
function tube(a, b, r, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
}
// a canvas texture, drawn by fn(ctx, w, h)
function canvasMat(w, h, fn, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return new THREE.MeshStandardMaterial({ map: t, roughness: opts.rough ?? 0.5, metalness: opts.metal ?? 0, transparent: !!opts.transparent, emissive: opts.emissive ?? 0x000000, emissiveMap: opts.emissive ? t : null, side: opts.side ?? THREE.FrontSide });
}
// a flat decal standing just off a flat side (side: +1 right, -1 left, or 'back' / 'front')
function decal(parent, mat, w, h, x, y, z, side) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  p.position.set(x, y, z);
  if (side === 'back') p.rotation.y = Math.PI; else if (side === 'front') p.rotation.y = 0; else p.rotation.y = side * Math.PI / 2;
  parent.add(p); return p;
}
const plateMat = (text, yellow = false) => canvasMat(256, 64, (g, w, h) => {
  g.fillStyle = yellow ? '#f3c623' : '#f4f4f0'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#111'; g.font = 'bold 42px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
}, { rough: 0.4 });
// tyre tread round the outside of a tyre
const treadMat = (chunky) => canvasMat(512, 64, (g, w, h) => {
  // (x goes round the tyre, y across it)
  g.fillStyle = '#1c1c1c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0a0a0a';
  if (chunky) {
    // big chevron lugs, staggered either side of the middle
    for (let x = 0; x < w; x += 24) {
      g.beginPath(); g.moveTo(x, 6); g.lineTo(x + 10, 6); g.lineTo(x + 18, 30); g.lineTo(x + 8, 30); g.fill();
      g.beginPath(); g.moveTo(x + 12, h - 6); g.lineTo(x + 22, h - 6); g.lineTo(x + 30, 34); g.lineTo(x + 20, 34); g.fill();
    }
  } else {
    for (const y of [18, 31, 44]) g.fillRect(0, y, w, 3);           // the grooves round it
    for (let x = 0; x < w; x += 9) { g.fillRect(x, 6, 2, 10); g.fillRect(x + 4, 22, 2, 8); g.fillRect(x, 35, 2, 8); g.fillRect(x + 4, 48, 2, 10); }   // the sipes
  }
}, { rough: 0.95 });
// the sidewall: dark rubber with plain lettering round it (no brand)
const wallMat = (word) => canvasMat(512, 512, (g, w, h) => {
  g.fillStyle = '#161616'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a5a5a'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k < 2; k++) {
    g.save(); g.translate(w / 2, h / 2); g.rotate(k * Math.PI);
    const r = w * 0.4, s = word;
    for (let i = 0; i < s.length; i++) { g.save(); g.rotate((i - s.length / 2) * 0.09); g.translate(0, -r); g.fillText(s[i], 0, 0); g.restore(); }
    g.restore();
  }
}, { rough: 0.9 });

// A DETAILED WHEEL: a tyre with rounded shoulders, tread and sidewall
// lettering, a rim (spokes, steel with studs, or a chunky truck rim), a
// brake disc, and the caliper (which turns with the steering, not the wheel)
const WHEEL_CACHE = new Map();
function detailWheel(parent, x, z, r, w, style, mats, { dual = false } = {}) {
  const side = Math.sign(x) || 1;
  const spin = wheelGroup(parent, x, z, r);
  const steer = spin.parent;
  const key = [r, w, style, dual, side].join('|');
  let built = WHEEL_CACHE.get(key);
  if (!built) {
    const K = new Kit(), KS = new Kit();
    const toSide = (g) => g.rotateZ(-side * Math.PI / 2);         // (built round y, with +y the outside, then turned onto x)
    const tyreOne = (off) => {
      const sh = r * (style === 'truck' || style === 'crane' ? 0.16 : 0.12), rr = r * (style === 'sport' ? 0.72 : style === 'crane' ? 0.58 : 0.66);
      const prof = [];
      prof.push(new THREE.Vector2(rr, -w / 2));
      for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, -w / 2 + sh + Math.sin(a) * sh)); }
      for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, w / 2 - sh + Math.sin(a) * sh)); }
      prof.push(new THREE.Vector2(rr, w / 2));
      K.add(toSide(new THREE.LatheGeometry(prof, 32).translate(0, off, 0)), mats.tread);
      // the sidewalls with their lettering (flat rings just inside the tyre's face)
      for (const sgn of [1, -1]) K.add(toSide(new THREE.RingGeometry(rr, r - sh * 0.6, 32).rotateX(-sgn * Math.PI / 2).translate(0, off + sgn * (w / 2 + 0.002), 0)), mats.wall);
      return rr;
    };
    const rr = tyreOne(0);
    if (dual) tyreOne(-w * 1.08);
    const face = w / 2 - 0.01;
    // the rim's barrel and its dished face
    K.add(toSide(new THREE.CylinderGeometry(rr, rr, w * (dual ? 2.1 : 0.96), 28, 1, true).translate(0, dual ? -w * 0.54 : 0, 0)), mats.barrel);
    if (style === 'sport') {
      // ten spokes in pairs, a centre-lock nut, a big drilled disc
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.98, rr * 0.98, 0.02, 28).translate(0, face - 0.005, 0)), mats.lip);
      for (let k = 0; k < 5; k++) for (const o of [-0.13, 0.13]) {
        const a = k / 5 * Math.PI * 2 + o;
        K.add(toSide(new THREE.BoxGeometry(0.04, 0.03, rr * 0.8).translate(0, face - 0.04, rr * 0.52).rotateY(a)), mats.spoke);
      }
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.2, rr * 0.24, 0.07, 16).translate(0, face - 0.04, 0)), mats.spoke);
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.1, rr * 0.1, 0.05, 6).translate(0, face, 0)), mats.nut);
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.88, rr * 0.88, 0.035, 32).translate(0, -0.02, 0)), mats.disc);
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.4, rr * 0.4, 0.06, 16).translate(0, -0.01, 0)), mats.hub);
    } else {
      // a pressed steel or alloy disc with stud holes, a hub cap, wheel nuts
      const nStud = style === 'crane' ? 10 : style === 'truck' ? 10 : 6;
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.97, rr * 0.92, 0.03, 28).translate(0, face - 0.06, 0)), mats.lip);
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.5, rr * 0.62, 0.06, 24).translate(0, face - 0.03, 0)), mats.lip);
      for (let k = 0; k < (style === 'van' ? 8 : 10); k++) {      // the ventilation holes round the disc
        const a = k / (style === 'van' ? 8 : 10) * Math.PI * 2;
        K.add(toSide(new THREE.CylinderGeometry(rr * 0.09, rr * 0.09, 0.012, 10).translate(Math.cos(a) * rr * 0.76, face - 0.044, Math.sin(a) * rr * 0.76)), mats.hole);
      }
      for (let k = 0; k < nStud; k++) {
        const a = k / nStud * Math.PI * 2;
        K.add(toSide(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 6).translate(Math.cos(a) * rr * 0.36, face + 0.0, Math.sin(a) * rr * 0.36)), mats.nut);
      }
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.22, rr * 0.26, 0.06, 18).translate(0, face + 0.01, 0)), style === 'van' ? mats.lip : mats.nut);
      K.add(toSide(new THREE.CylinderGeometry(rr * 0.8, rr * 0.8, 0.03, 28).translate(0, -0.03, 0)), mats.disc);
    }
    // the caliper (with the steering, not the wheel): top and back of the disc
    KS.add(new THREE.BoxGeometry(0.1, rr * (style === 'sport' ? 0.5 : 0.36), rr * 0.3).translate(side * 0.01, rr * 0.62, -rr * 0.35), mats.caliper);
    built = { K, KS };
    WHEEL_CACHE.set(key, built);
    built.spinGroup = K.into(new THREE.Group());
    built.steerGroup = KS.into(new THREE.Group(), false);
  }
  spin.add(built.spinGroup.clone());
  steer.add(built.steerGroup.clone());
  return spin;
}
function wheelMats(opts = {}) {
  return {
    tread: opts.slick ? std(0x1a1a1a, 0.92) : treadMat(!!opts.chunky), wall: wallMat(opts.word || 'ALL SEASON  225/65 R16'),
    barrel: std(0x6c7076, 0.4, { metalness: 0.8 }), lip: std(opts.rim ?? 0xc9ccd1, 0.28, { metalness: 0.85 }),
    spoke: std(opts.rim ?? 0x34363a, 0.32, { metalness: 0.8 }), nut: std(0xb0b4b9, 0.25, { metalness: 0.9 }),
    hole: std(0x111214, 0.8), disc: std(0x6e6a66, 0.55, { metalness: 0.7 }), hub: std(0x2c2c2e, 0.5, { metalness: 0.6 }),
    caliper: std(opts.caliper ?? 0x2a2c30, 0.4, { metalness: 0.3 }),
  };
}
// a wing mirror on a stalk: the housing, the glass, the arm back to the door
function mirror(K, mats, x, y, z, side, { truck = false } = {}) {
  if (truck) {
    K.add(tube([x, y + 0.25, z - 0.05], [x + side * 0.28, y + 0.25, z - 0.05], 0.015), mats.arm);
    K.add(tube([x, y - 0.25, z - 0.05], [x + side * 0.28, y - 0.25, z - 0.05], 0.015), mats.arm);
    K.add(roundBox(0.06, 0.42, 0.22, 0.02, x + side * 0.3, y, z - 0.05), mats.body);
    K.add(new THREE.PlaneGeometry(0.17, 0.36).translate(0, 0, 0).rotateY(Math.PI).translate(x + side * 0.3, y, z - 0.162), mats.glass);
    return;
  }
  K.add(tube([x, y, z], [x + side * 0.13, y + 0.04, z - 0.04], 0.018), mats.arm);
  K.add(roundBox(0.2, 0.12, 0.09, 0.035, x + side * 0.2, y + 0.06, z - 0.06), mats.body);
  K.add(new THREE.PlaneGeometry(0.16, 0.08).rotateY(Math.PI).translate(x + side * 0.2, y + 0.06, z - 0.108), mats.glass);
}
// a seat (cushion, back, headrest) facing +z
function seat(K, mat, x, y, z, { bucket = false, w = 0.5 } = {}) {
  K.add(roundBox(w, 0.12, 0.5, 0.05, x, y, z), mat);
  K.add(roundBox(w, 0.62, 0.12, 0.05, x, y + 0.35, z - 0.26).rotateX(0), mat);
  if (bucket) for (const s of [-1, 1]) K.add(roundBox(0.08, 0.5, 0.4, 0.03, x + s * (w / 2), y + 0.25, z - 0.1), mat);
  else K.add(roundBox(w * 0.55, 0.18, 0.1, 0.04, x, y + 0.75, z - 0.27), mat);
}
// a steering wheel facing back at the driver
function steeringWheel(K, mat, x, y, z, tilt = 0.4, r = 0.18) {
  const m = new THREE.Matrix4().makeRotationX(tilt).setPosition(x, y, z);
  K.add(new THREE.TorusGeometry(r, 0.018, 6, 20).applyMatrix4(m), mat);
  K.add(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 10).rotateX(Math.PI / 2).applyMatrix4(m), mat);
  for (const a of [0, 2.2, -2.2]) K.add(new THREE.BoxGeometry(r, 0.025, 0.015).translate(r / 2, 0, 0).rotateZ(a - Math.PI / 2).applyMatrix4(m), mat);
  K.add(tube([x, y - 0.06, z + 0.06], [x, y - 0.25, z + 0.35], 0.03), mat);
}
// a light bar's lens: a lit and an unlit look, swapped by flash()
function lamp(color, dim) { return std(dim, 0.15, { emissive: 0x000000, transparent: true, opacity: 0.88, metalness: 0.1 }); }

// =====================================================================
// THE SAFETY CAR: a long-bonnet front-engined GT (a tribute: no badges).
// A smooth body with a long bonnet and vents, the cab set well back, a
// fastback with a ducktail and a fixed wing on swan necks, a big grille,
// LED headlights and running lights, side gills, wide arches, a carbon
// splitter, skirts and diffuser, four exhausts, centre-lock wheels and
// big brakes, and the light bar on the roof. Through the glass: two
// bucket seats, a roll cage, the dash, the wheel and the screens.
// =====================================================================
function buildSafetyCar() {
  const g = new THREE.Group();
  const silver = std(0xb7bcc2, 0.24, { metalness: 0.78 }), carbon = canvasMat(64, 64, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#1b1c1f' : '#26282c'; x.fillRect(i * 8, j * 8, 8, 8); } }, { rough: 0.35, metal: 0.3, repeat: [6, 6] });
  const black = std(0x101113, 0.55), gloss = std(0x0c0d0f, 0.15, { metalness: 0.4 }), glass = std(0x1b2532, 0.05, { metalness: 0.4, transparent: true, opacity: 0.55 });
  const chrome = std(0xdadde2, 0.12, { metalness: 0.95 }), interior = std(0x1d1d20, 0.75), red = std(0xc2111a, 0.5), alcantara = std(0x2c2d31, 0.95);
  const tail = std(0x5a0606, 0.2, { emissive: 0xff1208, emissiveIntensity: 0.9, transparent: true, opacity: 0.95 }), head = std(0xe8f0ff, 0.1, { emissive: 0xdfe8ff, emissiveIntensity: 1.2 });
  const lens = std(0xd8dde6, 0.05, { metalness: 0.2, transparent: true, opacity: 0.45 }), amber = std(0x7a4a08, 0.2, { emissive: 0xff9a10, emissiveIntensity: 0.5 });
  const K = new Kit();
  const FZ = 1.45, RZ = -1.35, WR = 0.34;
  // the main body: long bonnet, cab well back, short tail
  const w = spline([[-2.33, 1.66], [-2.16, 1.9], [-1.4, 2.0], [-0.65, 1.93], [0.4, 1.9], [1.45, 1.98], [2.0, 1.9], [2.37, 1.6]]);
  const top = spline([[-2.33, 0.7], [-2.24, 0.93], [-2.05, 1.01], [-1.7, 1.0], [-0.5, 0.98], [0.35, 0.99], [1.2, 0.93], [1.9, 0.82], [2.26, 0.62], [2.37, 0.47]]);
  const bot = arched(spline([[-2.33, 0.34], [-2.05, 0.22], [2.0, 0.2], [2.37, 0.27]]), [FZ, RZ], WR + 0.06, WR);
  K.add(loft(-2.33, 2.37, 72, (z) => ({ w: w(z), top: top(z), bot: bot(z), tuck: 0.1, sq: 5 })), silver);
  // under-tray (so you don't see through above the wheels) and arch liners
  K.add(roundBox(1.25, 0.3, 4.3, 0.05, 0, 0.33, 0.05), black);
  for (const zc of [FZ, RZ]) for (const s of [-1, 1]) K.add(new THREE.CylinderGeometry(WR + 0.05, WR + 0.05, 0.36, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.8, WR, zc), black);
  // the cab: glass, then the roof and the fastback over it
  const cw = spline([[-1.98, 1.5], [-1.2, 1.5], [-0.4, 1.47], [0.45, 1.62]]);
  const ct = spline([[-1.98, 0.99], [-1.62, 1.11], [-1.05, 1.27], [-0.55, 1.31], [-0.1, 1.28], [0.2, 1.13], [0.45, 0.99]]);
  K.add(loft(-1.98, 0.45, 40, (z) => ({ w: cw(z), top: ct(z), bot: 0.86, tuck: 0.24, sq: 3.2 })), glass);
  K.add(loft(-1.28, -0.12, 24, (z) => ({ w: cw(z) * 0.84, top: ct(z) + 0.012, bot: ct(z) - 0.05, tuck: 0.1, sq: 3 })), silver);
  K.add(loft(-2.0, -1.36, 14, (z) => ({ w: cw(z) * 1.01, top: ct(z) + 0.006, bot: 0.9, tuck: 0.24, sq: 3.2 })), silver);
  K.add(loft(-1.92, -1.42, 10, (z) => ({ w: cw(z) * 0.62, top: ct(z) + 0.014, bot: ct(z) - 0.03, tuck: 0.05, sq: 3 })), glass);     // the rear window, set into the fastback
  // A-pillars and the windscreen header (the frame round the glass)
  for (const s of [-1, 1]) {
    K.add(tube([s * 0.79, 0.99, 0.43], [s * 0.6, 1.27, -0.12], 0.035), silver);
    K.add(tube([s * 0.75, 0.97, -0.5], [s * 0.72, 1.27, -0.45], 0.02), black);      // the door's rear frame
  }
  // the ducktail and the wing on swan necks, with endplates
  K.add(loft(-2.34, -2.02, 6, () => ({ w: 1.7, top: 1.04, bot: 0.97, tuck: 0, sq: 6 })), carbon);
  K.add(loft(-2.42, -2.0, 10, (z) => ({ w: 1.8, top: 1.36 - (z + 2.42) * 0.18 + Math.sin((z + 2.42) / 0.42 * Math.PI) * 0.03, bot: 1.32 - (z + 2.42) * 0.12, tuck: 0, sq: 3 })), carbon);
  for (const s of [-1, 1]) {
    K.add(roundBox(0.02, 0.24, 0.5, 0.01, s * 0.91, 1.3, -2.2), carbon);
    K.add(new THREE.TorusGeometry(0.2, 0.02, 6, 12, Math.PI * 0.7).rotateY(Math.PI / 2).rotateX(-0.3).translate(s * 0.45, 1.13, -2.2), black);   // the swan necks
  }
  // the bonnet: a power bulge and two rows of vents
  K.add(loft(0.45, 1.75, 16, (z) => ({ w: 0.8 - (z - 0.45) * 0.25, top: top(z) + 0.035 * Math.sin((z - 0.45) / 1.3 * Math.PI), bot: top(z) - 0.05, tuck: 0.3, sq: 3 })), silver);
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) K.add(new THREE.BoxGeometry(0.42, 0.012, 0.028).rotateX(-0.1).translate(s * 0.58, top(1.05 + k * 0.06) + 0.004, 1.05 + k * 0.06), gloss);
  // front: the big grille (a honeycomb behind a frame), splitter, intakes
  const honey = canvasMat(128, 64, (x, w, h) => { x.fillStyle = '#060607'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a3c40'; x.lineWidth = 2; for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) { const cx = i * 8 + (j % 2) * 4, cy = j * 8; x.beginPath(); for (let a = 0; a < 6; a++) x.lineTo(cx + 3.5 * Math.cos(a * Math.PI / 3), cy + 3.5 * Math.sin(a * Math.PI / 3)); x.closePath(); x.stroke(); } }, { rough: 0.5 });
  decal(g, honey, 0.95, 0.3, 0, 0.52, 2.365, 'front');
  for (const [a, b] of [[[-0.5, 0.36, 2.36], [0.5, 0.36, 2.36]], [[-0.5, 0.68, 2.33], [0.5, 0.68, 2.33]], [[-0.5, 0.36, 2.36], [-0.5, 0.68, 2.33]], [[0.5, 0.36, 2.36], [0.5, 0.68, 2.33]]]) K.add(tube(a, b, 0.022), chrome);
  for (const s of [-1, 1]) { decal(g, honey, 0.32, 0.16, s * 0.68, 0.38, 2.29, 'front'); }
  K.add(roundBox(1.92, 0.03, 0.45, 0.01, 0, 0.2, 2.2), carbon);
  for (const s of [-1, 1]) K.add(roundBox(0.03, 0.12, 0.3, 0.01, s * 0.94, 0.26, 2.2), carbon);       // splitter end fences
  // headlights: swept-back lenses, LED running-light blades, projectors
  for (const s of [-1, 1]) {
    K.add(loft(1.82, 2.28, 8, (z) => ({ x: s * (0.66 + (2.28 - z) * 0.18), w: 0.38 - (2.28 - z) * 0.2, top: top(z) - 0.01, bot: top(z) - 0.13, tuck: 0, sq: 4 })), lens);
    K.add(new THREE.BoxGeometry(0.3, 0.018, 0.02).rotateY(s * 0.35).translate(s * 0.7, top(2.15) - 0.09, 2.18), head);
    for (const k of [0, 1]) K.add(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12).rotateX(Math.PI / 2).translate(s * (0.62 + k * 0.12), top(2.1) - 0.055, 2.1 - k * 0.06), chrome);
    K.add(new THREE.BoxGeometry(0.12, 0.03, 0.02).translate(s * 0.88, 0.42, 2.12), amber);       // the indicator
  }
  // the sides: gills behind the front wheels, skirts, door shut lines,
  // flush handles, mirrors, the fuel flap
  for (const s of [-1, 1]) {
    const sx = s * 0.99;
    for (let k = 0; k < 3; k++) K.add(new THREE.BoxGeometry(0.02, 0.025, 0.28).rotateX(-0.25).translate(sx, 0.62 - k * 0.07, 0.86 + k * 0.03), gloss);
    K.add(roundBox(0.06, 0.08, 2.2, 0.02, s * 0.97, 0.25, 0.05), carbon);
    for (const z0 of [0.42, -0.62]) K.add(new THREE.BoxGeometry(0.006, 0.6, 0.006).translate(s * 0.986, 0.62, z0), gloss);      // the door's shut lines
    K.add(roundBox(0.02, 0.03, 0.16, 0.01, s * 0.99, 0.84, -0.42), chrome);
    K.add(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 14).rotateZ(Math.PI / 2).translate(s * 0.99, 0.86, -1.7), gloss);
    mirror(K, { arm: black, body: silver, glass: chrome }, s * 0.74, 0.98, 0.28, s);
  }
  // the back: LED tail lights across, the third brake light, the
  // diffuser with its fins, four exhausts, the plate
  K.add(new THREE.BoxGeometry(1.5, 0.035, 0.02).translate(0, 0.9, -2.33), tail);
  for (const s of [-1, 1]) K.add(loft(-2.34, -2.2, 3, () => ({ x: s * 0.66, w: 0.4, top: 0.93, bot: 0.84, tuck: 0, sq: 6 })), tail);
  K.add(new THREE.BoxGeometry(0.4, 0.025, 0.02).translate(0, 1.3, -1.92), tail);
  K.add(loft(-2.34, -1.8, 8, (z) => ({ w: 1.6, top: 0.42, bot: 0.24 - (z + 1.8) * 0.1, tuck: 0, sq: 8 })), carbon);
  for (let k = -3; k <= 3; k++) K.add(new THREE.BoxGeometry(0.012, 0.16, 0.45).translate(k * 0.2, 0.3, -2.12), carbon);
  for (const s of [-1, 1]) for (const k of [0, 1]) { K.add(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 14, 1, true).rotateX(Math.PI / 2).translate(s * (0.28 + k * 0.13), 0.33, -2.3), chrome); K.add(new THREE.CircleGeometry(0.045, 12).rotateY(Math.PI).translate(s * (0.28 + k * 0.13), 0.33, -2.395), black); }
  decal(g, plateMat('SC 01', true), 0.52, 0.12, 0, 0.62, -2.345, 'back');
  decal(g, plateMat('SC 01'), 0.52, 0.12, 0, 0.4, 2.375, 'front');
  // inside: the dash, two bucket seats in red, a roll cage, the wheel, the screens
  K.add(roundBox(1.4, 0.18, 0.4, 0.05, 0, 0.88, 0.18), alcantara);
  for (const s of [-1, 1]) seat(K, red, s * 0.36, 0.42, -0.62, { bucket: true, w: 0.46 });
  steeringWheel(K, black, 0.36, 0.9, 0.0, 0.5, 0.17);
  K.add(roundBox(0.3, 0.16, 0.02, 0.02, -0.05, 0.98, 0.12), std(0x0f2a44, 0.2, { emissive: 0x1d4f8a, emissiveIntensity: 0.6 }));
  K.add(roundBox(0.22, 0.14, 0.02, 0.02, -0.38, 0.98, 0.12), std(0x2a1a06, 0.2, { emissive: 0xc77a10, emissiveIntensity: 0.5 }));
  for (const s of [-1, 1]) { K.add(tube([s * 0.62, 0.5, -1.2], [s * 0.58, 1.22, -0.9], 0.022), black); K.add(tube([s * 0.58, 1.22, -0.9], [s * 0.6, 1.2, -0.1], 0.022), black); }
  K.add(tube([-0.58, 1.22, -0.9], [0.58, 1.22, -0.9], 0.022), black);
  K.add(roundBox(1.5, 0.3, 0.6, 0.1, 0, 0.55, -1.5), interior);
  // the antenna
  K.add(new THREE.ConeGeometry(0.025, 0.09, 8).translate(0, 1.36, -1.25), black);
  // the light bar: an aero housing, two rows of amber LED modules under a
  // clear cover, green ones at the back for the cars to pass
  const bar = new THREE.Group(); g.add(bar);
  K.add(tube([-0.5, 1.29, -0.62], [-0.5, 1.33, -0.62], 0.02), black); K.add(tube([0.5, 1.29, -0.62], [0.5, 1.33, -0.62], 0.02), black);
  K.add(loft(-0.8, -0.44, 8, (z) => ({ w: 1.25, top: 1.42 - (z + 0.44) * (z + 0.44) * 0.3, bot: 1.33, tuck: 0.15, sq: 4 })), black);
  K.add(loft(-0.79, -0.45, 8, (z) => ({ w: 1.27, top: 1.445 - (z + 0.44) * (z + 0.44) * 0.3, bot: 1.36, tuck: 0.2, sq: 3 })), std(0xffffff, 0.05, { transparent: true, opacity: 0.18, metalness: 0.2 }));
  const lampsA = [], lampsB = [];
  for (let k = 0; k < 8; k++) {
    const m = new THREE.Mesh(roundBox(0.12, 0.05, 0.1, 0.015, -0.49 + k * 0.14, 1.39, -0.5), lamp(0xffa010, 0x3a2a08)); bar.add(m);
    (k % 2 ? lampsB : lampsA).push(m.material);
    const m2 = new THREE.Mesh(roundBox(0.12, 0.05, 0.08, 0.015, -0.49 + k * 0.14, 1.39, -0.62), lamp(0xffa010, 0x3a2a08)); bar.add(m2);
    (k % 2 ? lampsA : lampsB).push(m2.material);
  }
  const greens = [];
  for (const s of [-1, 1]) { const m = new THREE.Mesh(roundBox(0.24, 0.05, 0.06, 0.015, s * 0.28, 1.39, -0.74), lamp(0x20ff60, 0x0a2a12)); bar.add(m); greens.push(m.material); }
  // SAFETY CAR down each side, and across the bonnet
  const words = label('SAFETY CAR', 'transparent', '#16181c', 512, 64);
  for (const s of [-1, 1]) decal(g, words, 2.0, 0.24, s * 0.995, 0.6, -0.15, s);
  const bonnet = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.16), words); bonnet.rotation.x = -Math.PI / 2 + 0.08; bonnet.position.set(0, top(1.85) + 0.012, 1.85); g.add(bonnet);
  // the side stripe: a chequered band low on the doors
  const cheq = canvasMat(256, 16, (x, w, h) => { for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#e8e8e8'; x.fillRect(i * 8, j * 8, 8, 8); } }, { transparent: false });
  for (const s of [-1, 1]) decal(g, cheq, 2.2, 0.07, s * 0.996, 0.4, -0.2, s);
  K.into(g);
  // the wheels: centre-lock alloys, big drilled discs, yellow calipers, low-profile tyres
  const WM = wheelMats({ word: 'SAFETY  285/30 ZR20', rim: 0x2c2e33, caliper: 0xf2c21b });
  for (const [x, z] of [[-0.86, FZ], [0.86, FZ], [-0.86, RZ], [0.86, RZ]]) detailWheel(g, x, z, WR, 0.3, 'sport', WM);
  return { group: g, flash: (t, on) => {
    const a = on && Math.floor(t * 4) % 2 === 0, b = on && !a;
    for (const m of lampsA) m.emissive.setHex(a ? 0xffa010 : 0x000000);
    for (const m of lampsB) m.emissive.setHex(b ? 0xffa010 : 0x000000);
  }, green: (on) => greens.forEach((m) => m.emissive.setHex(on ? 0x20ff60 : 0x000000)) };
}

// =====================================================================
// THE AMBULANCE: a long-wheelbase high-roof van. A tall box body with
// rounded edges, a short sloping bonnet and a raked windscreen, a sliding
// side door and twin back doors (hinges, handles, windows), a high-
// visibility block pattern, AMBULANCE (backwards on the front, to read in
// a mirror), the star of life, light bars front and back with LED
// modules, corner flashers and scene lights, a roof air-conditioning
// unit, aerials, a back step, mud flaps, mirrors on arms, wipers. Through
// the windows: the cab seats and dash, and in the back the stretcher, the
// seats and the cupboards.
// =====================================================================
function buildAmbulance() {
  const g = new THREE.Group();
  const white = std(0xf6f6f2, 0.3, { metalness: 0.12 }), black = std(0x17181b, 0.55), glass = std(0x1a2330, 0.05, { metalness: 0.45, transparent: true, opacity: 0.5 });
  const trim = std(0x2a2c30, 0.65), grey = std(0x8a8e94, 0.5), chrome = std(0xd2d6dc, 0.15, { metalness: 0.9 }), cabinet = std(0xdfe3e6, 0.45);
  const red = std(0xc81e1e, 0.4), orange = std(0x7a4a08, 0.2, { emissive: 0xff9a10, emissiveIntensity: 0.4 }), tail = std(0x5a0606, 0.25, { emissive: 0xff1208, emissiveIntensity: 0.8 });
  const head = std(0xe9eef4, 0.1, { emissive: 0xdfe8ff, emissiveIntensity: 0.9 }), seatM = std(0x2a2f3a, 0.8), mattress = std(0xd23a1f, 0.7), green = std(0x2f7d4a, 0.6);
  const K = new Kit();
  const FZ = 1.42, RZ = -1.62, WR = 0.36;
  // the box body (behind the cab) and the cab with its bonnet: one tall
  // shape from the back doors to the nose, nearly square in section
  const top = spline([[-2.62, 2.42], [-2.5, 2.52], [1.15, 2.52], [1.4, 2.42], [1.55, 2.25], [2.02, 1.38], [2.3, 1.18], [2.5, 0.98], [2.56, 0.78]]);
  const wid = spline([[-2.62, 1.9], [1.3, 1.9], [2.0, 1.86], [2.56, 1.74]]);
  const bot = arched(() => 0.44, [FZ, RZ], WR + 0.07, WR);
  K.add(loft(-2.62, 2.56, 80, (z) => ({ w: wid(z), top: top(z), bot: bot(z), tuck: 0.02, sq: 9 })), white);
  K.add(roundBox(1.5, 0.32, 4.6, 0.05, 0, 0.42, 0), trim);                 // under the floor (no seeing through)
  for (const zc of [FZ, RZ]) for (const s of [-1, 1]) {
    K.add(new THREE.CylinderGeometry(WR + 0.06, WR + 0.06, 0.32, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.82, WR, zc), trim);
    K.add(new THREE.TorusGeometry(WR + 0.08, 0.04, 6, 16, Math.PI).rotateY(Math.PI / 2).translate(s * 0.95, WR, zc), trim);   // the arch mouldings
  }
  // the windscreen (raked, in a black frame) and the wipers
  const wsA = [2.02, 1.4], wsB = [1.55, 2.28], wsL = Math.hypot(wsA[0] - wsB[0], wsA[1] - wsB[1]), wsAng = Math.atan2(wsB[1] - wsA[1], wsA[0] - wsB[0]);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.7, wsL), glass); ws.position.set(0, (wsA[1] + wsB[1]) / 2 + 0.03, (wsA[0] + wsB[0]) / 2 + 0.03); ws.rotation.x = -(Math.PI / 2 - wsAng); g.add(ws);
  for (const s of [-1, 1]) K.add(tube([s * 0.2 - 0.1, 1.45, 2.03], [s * 0.2 + 0.32, 1.85, 1.86], 0.012), black);
  // the cab: side windows, a quarter light, the doors' shut lines, handles, steps, mirrors
  for (const s of [-1, 1]) {
    decal(g, glass, 0.78, 0.62, s * 0.951, 1.88, 1.15, s);
    decal(g, glass, 0.3, 0.5, s * 0.951, 1.8, 1.7, s);
    for (const z of [0.66, 1.92]) K.add(new THREE.BoxGeometry(0.006, 1.4, 0.008).translate(s * 0.953, 1.25, z), trim);
    K.add(roundBox(0.03, 0.04, 0.18, 0.012, s * 0.96, 1.42, 0.86), black);
    K.add(roundBox(0.3, 0.05, 0.4, 0.02, s * 0.86, 0.36, 1.2), grey);
    mirror(K, { arm: black, body: black, glass: chrome }, s * 0.95, 1.88, 1.95, s, { truck: true });
    // the sliding side door (on the kerb side, the right) or the panel line on the other, a window in it
    K.add(new THREE.BoxGeometry(0.006, 1.85, 0.008).translate(s * 0.953, 1.42, s > 0 ? -0.6 : 0.3), trim);
    K.add(new THREE.BoxGeometry(0.008, 0.008, 2.6).translate(s * 0.954, 2.36, -0.9), trim);
    if (s > 0) { K.add(tube([0.955, 2.38, 0.6], [0.955, 2.38, -1.6], 0.012), grey); K.add(roundBox(0.03, 0.05, 0.22, 0.012, 0.965, 1.42, -0.45), black); }
    decal(g, glass, 0.85, 0.5, s * 0.951, 1.98, -0.12, s);
    // side lockers low on the body, with handles
    for (const z of [-1.0, -2.1]) { K.add(new THREE.BoxGeometry(0.006, 0.42, 0.75).translate(s * 0.952, 0.9, z), trim); K.add(roundBox(0.025, 0.04, 0.12, 0.01, s * 0.96, 1.05, z), chrome); }
    // fuel flap, side marker lights, a scene light up high, a corner flasher
    if (s < 0) K.add(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 14).rotateZ(Math.PI / 2).translate(-0.955, 0.98, -1.15), grey);
    for (const z of [0.2, -1.3, -2.45]) K.add(roundBox(0.02, 0.05, 0.1, 0.01, s * 0.955, 0.62, z), orange);
    K.add(roundBox(0.04, 0.12, 0.42, 0.02, s * 0.96, 2.42, -1.75), head);
    // mud flaps
    K.add(new THREE.BoxGeometry(0.28, 0.32, 0.015).translate(s * 0.82, 0.3, RZ - 0.5), black);
    K.add(new THREE.BoxGeometry(0.26, 0.24, 0.015).translate(s * 0.82, 0.32, FZ - 0.48), black);
  }
  // the high-visibility block pattern, the red band, the words, the star of life
  const blocks = blockStripe('#0a5fd1', '#f2d21c');
  for (const s of [-1, 1]) {
    decal(g, blocks, 4.7, 0.42, s * 0.955, 1.0, -0.2, s);
    decal(g, std(0xc81e1e, 0.4), 3.6, 0.13, s * 0.955, 1.33, -0.75, s);
    decal(g, label('AMBULANCE', 'transparent', '#c81e1e', 512, 64), 2.2, 0.32, s * 0.956, 1.72, -1.15, s);
  }
  const star = canvasMat(128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = '#1f5fbf';
    x.save(); x.translate(64, 64); for (let k = 0; k < 3; k++) { x.save(); x.rotate(k * Math.PI / 3); x.fillRect(-14, -58, 28, 116); x.restore(); } x.restore();
    x.fillStyle = '#fff'; x.fillRect(61, 26, 6, 76); x.beginPath(); x.ellipse(64, 34, 8, 6, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); for (let y = 40; y < 96; y++) x.lineTo(64 + Math.sin(y / 6) * 10, y); x.stroke();
  }, { transparent: true });
  for (const s of [-1, 1]) decal(g, star, 0.6, 0.6, s * 0.957, 1.85, 0.25, s);
  decal(g, star, 0.5, 0.5, 0, 2.53, -1.0, 'front').rotation.set(-Math.PI / 2, 0, 0);
  const rev = canvasMat(512, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.save(); x.scale(-1, 1); x.fillStyle = '#c81e1e'; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AMBULANCE', -w / 2, h / 2 + 2); x.restore(); }, { transparent: true });
  const bonnetWord = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.16), rev); bonnetWord.position.set(0, 1.27, 2.3); bonnetWord.rotation.x = -0.75; g.add(bonnetWord);
  // the front: grille, bumper with fog lights, headlights, indicators, plate
  const grille = canvasMat(128, 48, (x, w, h) => { x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2c30'; for (let y = 4; y < h; y += 8) x.fillRect(4, y, w - 8, 3); }, { rough: 0.5 });
  decal(g, grille, 0.95, 0.3, 0, 0.88, 2.555, 'front');
  K.add(roundBox(1.96, 0.26, 0.26, 0.08, 0, 0.5, 2.5), trim);
  for (const s of [-1, 1]) {
    K.add(roundBox(0.36, 0.17, 0.08, 0.05, s * 0.66, 1.0, 2.46), head);
    K.add(roundBox(0.1, 0.07, 0.05, 0.02, s * 0.88, 1.0, 2.43), orange);
    K.add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12).rotateX(Math.PI / 2).translate(s * 0.68, 0.5, 2.635), head);
    // grille flashers (blue) built into the front
  }
  decal(g, plateMat('AMB 999'), 0.52, 0.12, 0, 0.62, 2.636, 'front');
  // the back: twin doors with windows, hinges, handles, the step, lights, the plate
  for (const sx of [-0.47, 0.47]) {
    decal(g, glass, 0.62, 0.55, sx, 1.92, -2.625, 'back');
    for (const y of [0.75, 1.5, 2.15]) K.add(roundBox(0.06, 0.1, 0.04, 0.01, Math.sign(sx) * 0.93, y, -2.64), grey);
    K.add(roundBox(0.04, 0.2, 0.04, 0.01, Math.sign(sx) * 0.06, 1.35, -2.64), chrome);
  }
  K.add(new THREE.BoxGeometry(0.012, 1.95, 0.01).translate(0, 1.45, -2.625), trim);
  decal(g, blockStripe('#e3261c', '#f2d21c'), 1.8, 0.32, 0, 0.98, -2.627, 'back');
  const tread = canvasMat(64, 64, (x, w, h) => { x.fillStyle = '#6f7378'; x.fillRect(0, 0, w, h); x.fillStyle = '#9aa0a6'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) x.fillRect(i * 8 + ((i + j) % 2) * 2, j * 8 + 2, 5, 2); }, { rough: 0.5, metal: 0.6, repeat: [6, 1] });
  K.add(roundBox(1.7, 0.08, 0.32, 0.02, 0, 0.42, -2.78), tread);
  for (const s of [-1, 1]) {
    K.add(roundBox(0.14, 0.42, 0.05, 0.02, s * 0.88, 1.0, -2.64), tail);
    K.add(roundBox(0.14, 0.12, 0.05, 0.02, s * 0.88, 0.7, -2.64), orange);
  }
  K.add(roundBox(0.5, 0.05, 0.04, 0.01, 0, 2.47, -2.63), tail);       // the high-level brake light
  decal(g, plateMat('AMB 999'), 0.52, 0.12, 0, 0.6, -2.63, 'back');
  // the roof: the air-conditioning unit, aerials, a grab rail
  K.add(roundBox(0.8, 0.18, 0.9, 0.06, 0, 2.6, -1.2), white);
  for (let k = 0; k < 6; k++) K.add(new THREE.BoxGeometry(0.6, 0.01, 0.03).translate(0, 2.695, -1.45 + k * 0.1), trim);
  for (const [x, z, h] of [[-0.6, 0.4, 0.35], [0.6, 0.6, 0.18]]) K.add(new THREE.CylinderGeometry(0.008, 0.015, h, 6).translate(x, 2.52 + h / 2, z), black);
  // inside the cab: two seats, the dash, the wheel
  for (const s of [-1, 1]) seat(K, seatM, s * 0.42, 1.0, 1.0, { w: 0.5 });
  K.add(roundBox(1.75, 0.3, 0.45, 0.06, 0, 1.38, 1.62), trim);
  steeringWheel(K, black, 0.42, 1.48, 1.38, 0.9, 0.2);
  K.add(roundBox(1.8, 1.3, 0.04, 0.02, 0, 1.6, 0.55), cabinet);        // the bulkhead behind the cab
  // the back: the stretcher on its trolley, a seat at its head, the cupboards, oxygen bottles
  K.add(roundBox(0.6, 0.08, 1.9, 0.03, -0.3, 0.98, -1.5), grey);
  K.add(roundBox(0.56, 0.07, 1.8, 0.03, -0.3, 1.05, -1.5), mattress);
  K.add(roundBox(0.5, 0.2, 0.35, 0.08, -0.3, 1.15, -0.72).rotateX(0), mattress);
  for (const z of [-2.3, -0.7]) K.add(tube([-0.3, 0.55, z], [-0.3, 0.95, z], 0.02), chrome);
  seat(K, seatM, 0.55, 0.98, -0.2, { w: 0.45 });
  K.add(roundBox(0.45, 1.35, 1.8, 0.03, 0.68, 1.75, -1.55), cabinet);
  for (let k = 0; k < 4; k++) K.add(new THREE.BoxGeometry(0.01, 0.3, 0.4).translate(0.45, 1.3 + k * 0.32, -1.55), std(0xa9b3bb, 0.3, { transparent: true, opacity: 0.6 }));
  for (const z of [-2.35, -2.2]) K.add(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 10).translate(-0.8, 1.0, z), green);
  K.add(roundBox(1.8, 0.04, 4.0, 0.01, 0, 0.6, -0.8), std(0x6a6e73, 0.8));
  // the light bars: front of the roof and the back, LED modules in red and blue
  const beacons = [];
  for (const [z, w] of [[1.12, 1.55], [-2.45, 1.3]]) {
    K.add(roundBox(w + 0.06, 0.08, 0.3, 0.03, 0, 2.56, z), trim);
    K.add(roundBox(w + 0.08, 0.15, 0.32, 0.06, 0, 2.66, z), std(0xffffff, 0.05, { transparent: true, opacity: 0.15 }));
    for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(roundBox(w / 6 - 0.03, 0.1, 0.24, 0.03, -w / 2 + (k + 0.5) * w / 6, 2.66, z), lamp(0, k < 3 ? 0x3a0a0a : 0x0a143a)); g.add(m); beacons.push({ m: m.material, red: k < 3, k }); }
  }
  // corner flashers on the body, and blue grille flashers
  for (const s of [-1, 1]) for (const [y, z] of [[2.32, 1.3], [2.32, -2.56], [0.82, 2.53]]) { const m = new THREE.Mesh(roundBox(0.1, 0.08, 0.06, 0.02, s * (z > 2 ? 0.3 : 0.9), y, z), lamp(0, s > 0 ? 0x0a143a : 0x3a0a0a)); g.add(m); beacons.push({ m: m.material, red: s < 0, k: beacons.length }); }
  K.into(g);
  const WM = wheelMats({ word: 'LIGHT TRUCK  235/65 R16C', rim: 0xd9dce0 });
  for (const [x, z] of [[-0.84, FZ], [0.84, FZ], [-0.84, RZ], [0.84, RZ]]) detailWheel(g, x, z, WR, 0.24, 'van', WM);
  const doors = new THREE.Vector3(0, 0, -3.3);
  return { group: g, doors, flash: (t, on) => {
    const ph = Math.floor(t * 8);
    for (const b of beacons) { const lit = on && ((ph + (b.red ? 0 : 2)) % 4 < 2) && ((ph + b.k) % 2 === 0 || ph % 8 < 4); b.m.emissive.setHex(lit ? (b.red ? 0xff1a1a : 0x2a5cff) : 0x000000); }
  } };
}

// =====================================================================
// THE FLATBED: a recovery truck: a cab-over cab (grille, bumper, lights,
// sun visor, mirrors on arms, a beacon bar), chassis rails with the fuel
// drum, the battery box and side guards, a long steel bed with tread
// plate, rails and tie-down points, a winch and its cable, a ramp end,
// toolboxes, twin rear wheels, mud flaps, an exhaust stack. The crane
// puts the wreck on it, and it takes it back to the pits.
// =====================================================================
function buildFlatbed() {
  const g = new THREE.Group();
  const white = std(0xf1f1ec, 0.35, { metalness: 0.15 }), dark = std(0x24262a, 0.55), glass = std(0x1d2733, 0.05, { metalness: 0.45, transparent: true, opacity: 0.55 });
  const steel = std(0x8d9298, 0.35, { metalness: 0.8 }), orange = std(0xf07b1a, 0.45), chrome = std(0xd8dce2, 0.15, { metalness: 0.95 }), black = std(0x141414, 0.6);
  const head = std(0xe9eef4, 0.1, { emissive: 0xdfe8ff, emissiveIntensity: 0.9 }), tail = std(0x5a0606, 0.25, { emissive: 0xff1208, emissiveIntensity: 0.8 }), amberLens = std(0x7a4a08, 0.2, { emissive: 0xff9a10, emissiveIntensity: 0.4 });
  const plate = canvasMat(64, 64, (x, w, h) => { x.fillStyle = '#8d9298'; x.fillRect(0, 0, w, h); x.fillStyle = '#b4b9bf'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.save(); x.translate(i * 8 + 4, j * 8 + 4); x.rotate((i + j) % 2 ? 0.7 : -0.7); x.fillRect(-3, -1, 6, 2); x.restore(); } }, { rough: 0.35, metal: 0.8, repeat: [8, 18] });
  const K = new Kit();
  // chassis rails, the cross members
  for (const s of [-0.45, 0.45]) K.add(roundBox(0.12, 0.3, 6.6, 0.02, s, 0.75, -0.55), dark);
  for (const z of [1.5, 0.3, -0.9, -2.1, -3.4]) K.add(new THREE.BoxGeometry(0.9, 0.14, 0.1).translate(0, 0.8, z), dark);
  // the cab, set over the front wheels
  const top = spline([[1.5, 2.55], [1.65, 2.65], [2.55, 2.65], [2.78, 2.45], [2.88, 1.6], [2.9, 0.6]]);
  K.add(loft(1.5, 2.9, 24, (z) => ({ w: 2.25, top: top(z), bot: z > 2.6 ? 0.62 : 0.85, tuck: 0.05, sq: 8 })), white);
  K.add(roundBox(2.3, 0.12, 0.3, 0.04, 0, 2.62, 2.9), dark);             // sun visor
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), glass); ws.position.set(0, 2.0, 2.885); ws.rotation.x = -0.08; g.add(ws);
  for (const s of [-1, 1]) {
    decal(g, glass, 0.9, 0.72, s * 1.13, 2.05, 2.2, s);
    K.add(new THREE.BoxGeometry(0.006, 1.6, 0.008).translate(s * 1.132, 1.55, 1.62), dark);
    K.add(roundBox(0.03, 0.04, 0.18, 0.01, s * 1.14, 1.55, 1.8), chrome);
    for (const y of [0.55, 0.95]) K.add(roundBox(0.3, 0.04, 0.42, 0.01, s * 1.0, y, 2.3), steel);
    K.add(tube([s * 1.14, 1.2, 1.55], [s * 1.14, 2.3, 1.55], 0.018), chrome);
    mirror(K, { arm: dark, body: dark, glass: chrome }, s * 1.13, 2.0, 2.75, s, { truck: true });
    K.add(tube([s * 0.2 - 0.25, 1.6, 2.9], [s * 0.2 + 0.25, 1.95, 2.92], 0.012), black);
  }
  const grille = canvasMat(128, 64, (x, w, h) => { x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a3c40'; for (let y = 4; y < h; y += 8) x.fillRect(4, y, w - 8, 4); }, { rough: 0.5 });
  decal(g, grille, 1.4, 0.45, 0, 1.15, 2.905, 'front');
  K.add(roundBox(2.3, 0.3, 0.28, 0.06, 0, 0.62, 2.95), dark);
  for (const s of [-1, 1]) { K.add(roundBox(0.32, 0.18, 0.06, 0.04, s * 0.78, 0.98, 2.9), head); K.add(roundBox(0.1, 0.08, 0.05, 0.02, s * 1.02, 0.98, 2.89), amberLens); }
  decal(g, plateMat('REC 1'), 0.52, 0.12, 0, 0.62, 3.096, 'front');
  for (const s of [-1, 1]) { const st = blockStripe('#f07b1a', '#f2f2ec', 256, 32); decal(g, st, 1.25, 0.2, s * 1.133, 1.25, 2.2, s); }
  // inside the cab: seats, the dash, the wheel
  for (const s of [-1, 1]) seat(K, std(0x2a2f3a, 0.8), s * 0.5, 1.1, 2.1, { w: 0.5 });
  K.add(roundBox(2.0, 0.3, 0.4, 0.05, 0, 1.45, 2.65), dark);
  steeringWheel(K, black, 0.5, 1.6, 2.45, 1.2, 0.22);
  // the fuel drum, battery box, side guards, the exhaust stack behind the cab
  K.add(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 16).rotateX(Math.PI / 2).translate(-0.82, 0.62, 0.9), steel);
  K.add(roundBox(0.5, 0.4, 0.6, 0.03, 0.82, 0.62, 0.9), dark);
  for (const s of [-1, 1]) for (const y of [0.4, 0.6]) K.add(new THREE.BoxGeometry(0.03, 0.05, 2.0).translate(s * 1.1, y, -0.3), steel);
  K.add(tube([0.9, 1.0, 1.45], [0.9, 2.9, 1.45], 0.07, 12), chrome);
  K.add(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 12, 1, true).translate(0.9, 1.9, 1.45), std(0x333333, 0.3, { metalness: 0.7, side: THREE.DoubleSide }));
  // the bed: tread plate, the rails and tie-down points, headboard, winch, ramp end
  const BED_Y = 1.08;
  K.add(roundBox(2.3, 0.12, 5.3, 0.03, 0, BED_Y - 0.06, -1.25), plate);
  for (const sx of [-1.16, 1.16]) { K.add(roundBox(0.06, 0.16, 5.3, 0.02, sx, BED_Y + 0.06, -1.25), orange); for (let k = 0; k < 6; k++) K.add(new THREE.TorusGeometry(0.04, 0.012, 6, 10).rotateY(Math.PI / 2).translate(sx * 0.95, BED_Y + 0.02, 1.0 - k * 0.95), chrome); }
  K.add(roundBox(2.3, 0.08, 0.9, 0.02, 0, BED_Y - 0.25, -4.25), plate);
  K.add(roundBox(2.3, 0.5, 0.1, 0.03, 0, BED_Y + 0.25, 1.38), orange);
  for (let k = 0; k < 4; k++) K.add(new THREE.BoxGeometry(2.1, 0.03, 0.02).translate(0, BED_Y + 0.08 + k * 0.1, 1.32), dark);
  K.add(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 16).rotateZ(Math.PI / 2).translate(0, BED_Y + 0.14, 1.12), dark);
  for (const s of [-1, 1]) K.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16).rotateZ(Math.PI / 2).translate(s * 0.32, BED_Y + 0.14, 1.12), orange);
  K.add(tube([0, BED_Y + 0.25, 1.06], [0, BED_Y + 0.05, 0.4], 0.012), steel);
  K.add(roundBox(0.14, 0.06, 0.14, 0.02, 0, BED_Y + 0.04, 0.38), std(0xd23c1a, 0.45));
  // toolboxes under the bed, mud flaps, rear lights, the plate, the under-run bar
  for (const s of [-1, 1]) {
    K.add(roundBox(0.5, 0.45, 1.0, 0.03, s * 0.86, 0.68, -1.0), steel);
    K.add(roundBox(0.02, 0.05, 0.2, 0.01, s * 1.115, 0.8, -1.0), chrome);
    K.add(new THREE.BoxGeometry(0.45, 0.5, 0.015).translate(s * 0.98, 0.42, -3.85), black);
    K.add(roundBox(0.3, 0.12, 0.06, 0.02, s * 0.85, 0.82, -4.68), tail);
    K.add(roundBox(0.12, 0.12, 0.06, 0.02, s * 0.55, 0.82, -4.68), amberLens);
  }
  K.add(roundBox(2.0, 0.12, 0.1, 0.02, 0, 0.52, -4.55), dark);
  decal(g, plateMat('REC 1'), 0.52, 0.12, 0, 0.68, -4.715, 'back');
  // the beacon bar on the cab roof
  const beacons = [];
  K.add(roundBox(1.6, 0.06, 0.25, 0.02, 0, 2.68, 2.1), dark);
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(roundBox(0.32, 0.14, 0.22, 0.05, -0.6 + k * 0.4, 2.78, 2.1), lamp(0, 0x3a2a08)); g.add(m); beacons.push(m.material); }
  K.into(g);
  const WM = wheelMats({ chunky: false, word: 'REGIONAL  245/70 R19.5', rim: 0xc8ccd2 });
  for (const [x, z] of [[-0.98, 2.1], [0.98, 2.1]]) detailWheel(g, x, z, 0.48, 0.3, 'truck', WM);
  for (const [x, z] of [[-1.0, -2.35], [1.0, -2.35], [-1.0, -3.25], [1.0, -3.25]]) detailWheel(g, x, z, 0.48, 0.28, 'truck', WM, { dual: true });
  return { group: g, bedY: BED_Y, bedAt: new THREE.Vector3(0, BED_Y, -1.3),
    flash: (t, on) => beacons.forEach((m, k) => m.emissive.setHex(on && (Math.floor(t * 3) + k) % 2 ? 0xffa010 : 0x000000)) };
}

// =====================================================================
// THE RECOVERY CRANE: a compact wheeled crane. A low yellow chassis on
// four big lugged tyres under mudguards, the cab off to the left (glass
// all round, the seat and the controls inside, wipers, mirrors, a ladder
// and grab rails), outriggers that slide out and jack down when it
// works, the turntable with its counterweight, and a telescopic boom in
// three sections that slide out one after the other, lifted by twin
// rams with their hoses. The hook block hangs straight down on its
// cables whatever the boom's doing, with slings for the car.
// =====================================================================
const BOOM_L0 = 5.2, BOOM_EXT = 1.5;          // (the hook's distance from the boom's pivot, retracted; how far each section slides)
function buildCrane() {
  const g = new THREE.Group();
  const yellow = std(0xe8b419, 0.38, { metalness: 0.2 }), dark = std(0x24262a, 0.5), glass = std(0x1d2733, 0.05, { metalness: 0.45, transparent: true, opacity: 0.5 });
  const steel = std(0xa4a8ae, 0.3, { metalness: 0.85 }), chrome = std(0xd8dce2, 0.12, { metalness: 0.95 }), black = std(0x141414, 0.7), hoseM = std(0x0d0d0d, 0.6);
  const head = std(0xe9eef4, 0.1, { emissive: 0xdfe8ff, emissiveIntensity: 0.8 }), tail = std(0x5a0606, 0.25, { emissive: 0xff1208, emissiveIntensity: 0.8 }), redM = std(0xd23c1a, 0.45);
  const chev = canvasMat(256, 64, (x) => { x.fillStyle = '#e8b419'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#16171a'; for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 32, 64); x.lineTo(i * 32 + 16, 64); x.lineTo(i * 32 + 48, 0); x.lineTo(i * 32 + 32, 0); x.fill(); } }, { rough: 0.4 });
  const stripes = canvasMat(64, 64, (x) => { x.fillStyle = '#e8b419'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#16171a'; for (let i = -2; i < 4; i++) { x.beginPath(); x.moveTo(i * 32, 64); x.lineTo(i * 32 + 16, 64); x.lineTo(i * 32 + 48, 0); x.lineTo(i * 32 + 32, 0); x.fill(); } }, { rough: 0.4 });
  const K = new Kit();
  // the chassis: long and low with rounded edges, the engine cover and
  // counterweight at the back, chevrons, the lights
  K.add(roundBox(2.3, 0.7, 5.0, 0.12, 0, 1.02, 0), yellow);
  K.add(roundBox(2.2, 0.62, 0.9, 0.14, 0, 1.15, -2.35), dark);
  for (let k = 0; k < 7; k++) K.add(new THREE.BoxGeometry(1.6, 0.03, 0.06).translate(0, 1.47, -2.05 - k * 0.09), black);     // engine grille slats
  decal(g, chev, 2.1, 0.5, 0, 1.15, -2.81, 'back');
  for (const s of [-1, 1]) {
    K.add(roundBox(0.22, 0.14, 0.05, 0.03, s * 0.92, 0.82, -2.82), tail);
    K.add(roundBox(0.22, 0.14, 0.05, 0.03, s * 0.92, 0.85, 2.52), head);
    // mudguards over the wheels, a ladder up the side, the toolbox
    for (const zc of [1.55, -1.55]) K.add(new THREE.CylinderGeometry(0.76, 0.76, 0.62, 18, 1, true, -Math.PI / 2 + 0.25, Math.PI - 0.5).rotateZ(Math.PI / 2).translate(s * 1.02, 0.64, zc), dark);
  }
  for (let k = 0; k < 4; k++) K.add(new THREE.BoxGeometry(0.04, 0.03, 0.36).translate(1.2, 0.5 + k * 0.28, 0.2), steel);
  for (const zz of [0.03, 0.37]) K.add(tube([1.2, 0.35, zz], [1.2, 1.5, zz], 0.02), steel);
  K.add(roundBox(0.25, 0.4, 0.8, 0.03, 1.08, 0.95, -0.7), dark);
  K.add(tube([0.7, 1.35, -2.0], [0.7, 2.35, -2.0], 0.06, 12), chrome);        // the exhaust stack
  K.add(new THREE.CylinderGeometry(0.075, 0.06, 0.1, 12).rotateX(0.4).translate(0.7, 2.38, -2.02), dark);
  // the cab, off to the left: a rounded profile, glass all round, the
  // seat and the control levers inside, a grab rail, wipers, mirrors
  K.add(profileBody([[0.85, 1.38], [0.85, 2.85], [1.0, 2.95], [1.75, 2.95], [1.98, 2.7], [2.15, 1.38]], 1.0, 0.06).translate(-0.62, 0, 0), yellow);
  for (const [w, h, x, y, z, ry] of [[0.82, 0.95, -0.62, 2.28, 2.09, 0], [0.9, 0.75, -1.125, 2.35, 1.4, -Math.PI / 2], [0.9, 0.75, -0.115, 2.35, 1.4, Math.PI / 2], [0.7, 0.6, -0.62, 2.4, 0.83, Math.PI]]) {
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); w1.position.set(x, y, z); w1.rotation.y = ry; if (!ry) w1.rotation.x = -0.25; g.add(w1);
  }
  for (const s of [-1, 1]) { K.add(tube([-0.62 + s * 0.05, 1.85, 2.17], [-0.62 + s * 0.05 + 0.3, 2.3, 2.06], 0.01), black); }
  seat(K, std(0x2a2f3a, 0.8), -0.62, 1.55, 1.25, { w: 0.48 });
  for (const s of [-1, 1]) { K.add(tube([-0.62 + s * 0.3, 1.6, 1.4], [-0.62 + s * 0.3, 1.9, 1.5], 0.015), black); K.add(new THREE.SphereGeometry(0.035, 8, 6).translate(-0.62 + s * 0.3, 1.92, 1.51), redM); }
  K.add(roundBox(0.8, 0.2, 0.25, 0.04, -0.62, 1.75, 1.95), dark);
  for (const y of [0.62, 0.95]) K.add(boxAt(0.32, 0.04, 0.42, -1.2, y, 1.45), steel);
  K.add(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6).translate(-1.15, 1.95, 0.95), chrome);
  mirror(K, { arm: dark, body: dark, glass: chrome }, -1.12, 2.4, 2.0, -1, { truck: true });
  K.add(roundBox(0.18, 0.1, 0.08, 0.02, -0.62, 2.98, 2.0), head);         // a work light on the cab roof
  K.into(g);
  // the outriggers: a box across the chassis front and back, beams that
  // slide out, jacks that come down onto pads
  const legs = [];
  const KO = new Kit();
  for (const z of [1.85, -1.85]) {
    KO.add(roundBox(2.3, 0.24, 0.36, 0.05, 0, 0.82, z), dark);
    decal(g, stripes, 0.3, 0.2, 1.155, 0.82, z, 1); decal(g, stripes, 0.3, 0.2, -1.155, 0.82, z, -1);
    for (const s of [-1, 1]) {
      const beam = new THREE.Group(); beam.position.set(0, 0, 0); g.add(beam);
      const KB = new Kit();
      KB.add(roundBox(0.7, 0.18, 0.28, 0.03, s * 0.9, 0.82, z), yellow);
      KB.add(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12).translate(s * 1.22, 0.85, z), yellow);
      KB.into(beam);
      const jack = new THREE.Group(); jack.position.set(s * 1.22, 0.65, z); beam.add(jack);
      const KJ = new Kit();
      KJ.add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10).translate(0, 0, 0), chrome);
      KJ.add(new THREE.CylinderGeometry(0.2, 0.24, 0.07, 14).translate(0, -0.3, 0), dark);
      KJ.into(jack);
      legs.push({ beam, jack, s });
    }
  }
  KO.into(g);
  // the turntable, the counterweight on it, and the boom: three sections
  const turntable = new THREE.Group(); turntable.position.set(0.45, 1.45, -0.9); g.add(turntable);
  const KT = new Kit();
  KT.add(new THREE.CylinderGeometry(0.72, 0.78, 0.32, 24).translate(0, 0.16, 0), dark);
  for (let k = 0; k < 24; k++) KT.add(new THREE.BoxGeometry(0.05, 0.05, 0.05).translate(Math.cos(k / 24 * Math.PI * 2) * 0.76, 0.05, Math.sin(k / 24 * Math.PI * 2) * 0.76), steel);
  KT.add(roundBox(1.0, 0.75, 1.1, 0.1, 0, 0.62, -0.2), yellow);
  KT.add(roundBox(1.1, 0.6, 0.45, 0.08, 0, 0.6, -0.92), dark);          // the counterweight
  decal(turntable, label('RECOVERY', '#24262a', '#e8b419', 256, 48), 0.9, 0.17, 0, 0.62, -1.15, 'back');
  for (const s of [-1, 1]) KT.add(roundBox(0.12, 0.35, 0.3, 0.03, s * 0.3, 1.0, -0.2), yellow);      // the boom's pivot cheeks
  KT.add(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12).rotateZ(Math.PI / 2).translate(0, 0.85, -0.2), chrome);
  KT.into(turntable);
  const boom = new THREE.Group(); boom.position.set(0, 0.85, -0.2); turntable.add(boom);
  const KB = new Kit();
  KB.add(roundBox(0.5, 0.52, 3.2, 0.06, 0, 0, 1.4), yellow);              // the base section (pointing forward, along +z)
  KB.add(roundBox(0.52, 0.06, 0.2, 0.02, 0, 0.0, 3.0), dark);
  for (let k = 0; k < 6; k++) KB.add(new THREE.BoxGeometry(0.01, 0.4, 0.06).translate(0.253, 0, 0.2 + k * 0.5), yellow);
  // the hoses along the side of the base
  KB.add(tube([0.27, 0.15, 0.1], [0.27, 0.15, 2.9], 0.018), hoseM); KB.add(tube([0.27, 0.08, 0.1], [0.27, 0.08, 2.9], 0.018), hoseM);
  decal(boom, stripes, 0.5, 0.3, 0, 0, 3.005, 'front');
  KB.into(boom);
  const mid = new THREE.Group(); boom.add(mid);
  const KM = new Kit(); KM.add(roundBox(0.4, 0.42, 2.6, 0.05, 0, 0, 2.3), yellow); KM.add(roundBox(0.42, 0.05, 0.16, 0.02, 0, 0, 3.6), dark); KM.into(mid);
  const tip = new THREE.Group(); mid.add(tip);
  const KP = new Kit();
  KP.add(roundBox(0.31, 0.32, 2.75, 0.04, 0, 0, 3.55), yellow);
  for (const s of [-1, 1]) KP.add(roundBox(0.04, 0.42, 0.4, 0.02, s * 0.12, -0.08, 5.05), yellow);       // the head's cheek plates
  KP.add(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 18).rotateZ(Math.PI / 2).translate(0, -0.05, 5.15), dark);   // the sheave
  KP.add(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8).rotateZ(Math.PI / 2).translate(0, -0.05, 5.15), chrome);
  KP.add(roundBox(0.1, 0.06, 0.06, 0.02, 0, 0.2, 4.95), std(0x3a2a08, 0.2, { emissive: 0xff7a10, emissiveIntensity: 0.6 }));    // the tip warning light
  KP.into(tip);
  // the lift rams: from the turntable up to the boom (each a barrel and a rod, re-aimed as the boom moves)
  const rams = [];
  const unitBarrel = new THREE.CylinderGeometry(0.08, 0.08, 1, 12).translate(0, 0.5, 0), unitRod = new THREE.CylinderGeometry(0.05, 0.05, 1, 10).translate(0, 0.5, 0);
  for (const sx of [-0.2, 0.2]) {
    const barrel = new THREE.Mesh(unitBarrel, steel), rod = new THREE.Mesh(unitRod, chrome); turntable.add(barrel); turntable.add(rod); barrel.castShadow = rod.castShadow = true;
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6).translate(0, 0.5, 0), hoseM); turntable.add(hose);
    rams.push({ sx, barrel, rod, hose });
  }
  // the hook: straight down on twin cables, the block, the hook, slings
  const hookAt = new THREE.Group(); hookAt.position.set(0, -0.15, BOOM_L0); tip.add(hookAt);
  const cable = new THREE.Group(); hookAt.add(cable);
  for (const sx of [-0.05, 0.05]) addMesh(cable, new THREE.CylinderGeometry(0.012, 0.012, 1, 5).translate(sx, -0.5, 0), steel, false);
  const hook = new THREE.Group(); hookAt.add(hook);
  const KH = new Kit();
  KH.add(roundBox(0.32, 0.4, 0.22, 0.05, 0, -0.18, 0), redM);
  for (const s of [-1, 1]) KH.add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14).rotateZ(Math.PI / 2).translate(s * 0.17, -0.1, 0), steel);
  decal(hook, stripes, 0.3, 0.12, 0, -0.3, 0.112, 'front');
  KH.add(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8).translate(0, -0.42, 0), steel);
  KH.add(new THREE.TorusGeometry(0.1, 0.03, 6, 12, Math.PI * 1.4).rotateZ(Math.PI * 0.8).translate(0, -0.55, 0), steel);
  KH.add(new THREE.BoxGeometry(0.06, 0.02, 0.02).translate(-0.06, -0.47, 0), std(0xe8b419, 0.4));     // the safety latch
  KH.into(hook);
  const slings = new THREE.Group(); hook.add(slings); slings.visible = false;
  const slingParts = [];
  for (const [x, z] of [[-0.55, 1.2], [0.55, 1.2], [-0.55, -1.2], [0.55, -1.2]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 5).translate(0, -0.5, 0), std(0xf0c020, 0.7)); slings.add(m); slingParts.push({ m, x, z }); }
  const beacon = addMesh(g, new THREE.CylinderGeometry(0.09, 0.1, 0.18, 12).translate(-0.62, 3.05, 1.4), std(0x3a2a08, 0.2, { emissive: 0x000000, transparent: true, opacity: 0.9 }), false).material;
  const beacon2 = addMesh(g, new THREE.CylinderGeometry(0.08, 0.09, 0.16, 12).translate(0.9, 1.45, -2.4), std(0x3a2a08, 0.2, { emissive: 0x000000 }), false).material;
  const WM = wheelMats({ chunky: true, word: 'EARTHMOVER  17.5 R25', rim: 0xe8b419 });
  for (const [x, z] of [[-1.02, 1.55], [1.02, 1.55], [-1.02, -1.55], [1.02, -1.55]]) detailWheel(g, x, z, 0.64, 0.5, 'crane', WM);
  const UP = new THREE.Vector3(0, 1, 0), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3();
  const C = { group: g, turntable, boom, mid, tip, hookAt, cable, hook, slings, ext: 0, out: 0, drop: 0.6, sling: 0,
    flash: (t, on) => { const v = on && Math.floor(t * 3) % 2 ? 0xffa010 : 0x000000; beacon.emissive.setHex(v); beacon2.emissive.setHex(on && Math.floor(t * 3 + 1) % 2 ? 0xffa010 : 0); },
    // how far the hook hangs (m below the boom's end)
    setDrop(d) { this.drop = d; cable.scale.y = Math.max(0.05, d); hook.position.y = -d; },
    // how far the boom's out (0 to 3 m): the middle section first, then the tip
    setExtend(e) { this.ext = Math.max(0, Math.min(2 * BOOM_EXT, e)); mid.position.z = Math.min(BOOM_EXT, this.ext); tip.position.z = Math.max(0, this.ext - BOOM_EXT); },
    // the outriggers: 0 stowed, 1 out and down on the ground
    setOutriggers(k) {
      this.out = Math.max(0, Math.min(1, k));
      const slide = Math.min(1, this.out * 2), down = Math.max(0, this.out * 2 - 1);
      for (const L of legs) { L.beam.position.x = L.s * 0.6 * slide; L.jack.position.y = 0.65 - 0.3 * down; }
    },
    // slings down from the hook to the car's corners (0: none)
    setSlings(len) { this.sling = len; slings.visible = len > 0.05; for (const p of slingParts) { const d = Math.hypot(p.x, p.z, len); p.m.scale.y = d; p.m.position.set(0, -0.6, 0); p.m.quaternion.setFromUnitVectors(UP, tmpD.set(-p.x, len, -p.z).normalize()); } },
    // after any move: the hook hangs straight down whatever the boom's
    // angle, and the rams follow the boom
    pose() {
      hookAt.rotation.x = -boom.rotation.x;
      for (const r of rams) {
        tmpA.set(r.sx, 0.42, 0.75);                                                  // the ram's foot, on the turntable
        tmpB.set(r.sx, -0.3, 1.7).applyEuler(boom.rotation).add(boom.position);     // its top, on the boom
        tmpD.subVectors(tmpB, tmpA); const L = tmpD.length(); tmpD.normalize();
        for (const m of [r.barrel, r.rod, r.hose]) { m.position.copy(tmpA); m.quaternion.setFromUnitVectors(UP, tmpD); }
        r.barrel.scale.y = Math.min(L, 1.05); r.rod.scale.y = L; r.hose.scale.y = L * 0.97; r.hose.position.x += 0.1 * Math.sign(r.sx);
      }
    } };
  C.setExtend(0); C.setOutriggers(0); C.pose();
  return C;
}

// (for the preview page)
export { buildSafetyCar, buildAmbulance, buildFlatbed, buildCrane };

export class RaceControl {
  // ctx: line (the track's centre line, 2 m apart), trackside, aiField,
  // groundAt(x, z), isMobile, pit (the pit lane's layout), hooks:
  //   toast(text), penalty(sec, why), extinguish(kind) ('car' | 'wreck' |
  //   'block'), removeDebris(obj), recoverPlayer(), playerModel()
  constructor(scene, { line, trackside, aiField, groundAt, hooks = {}, isMobile = false, pit, corners = [] }) {
    this.scene = scene; this.line = line; this.m = line.length; this.trackside = trackside;
    this.ai = aiField; this.groundAt = groundAt; this.hooks = hooks; this.isMobile = isMobile; this.pit = pit;
    this.phase = 'green';            // green | vsc | sc | red
    this.t = 0;
    this.phaseT = 0;
    this.crane = null; this.ambulance = null; this.sc = null;
    this.repairs = [];               // barriers being fixed
    this.runners = [];               // fire marshals and sweepers out on the track
    this.jobs = new Set();           // what's being dealt with (so nothing's done twice)
    this.penaltyState = { overtakeOrder: null, vscOver: 0, vscWarn: 0, blueT: 0, blueCalm: 0, dyOver: 0 };
    this.mats = {
      suits: [std(0xff7a12, 0.75)], helmet: std(0xf2f2ee, 0.5), visor: std(0x111418, 0.1, { metalness: 0.6 }),
      glove: std(0x2a2c30, 0.8), boot: std(0x111111, 0.8), black: std(0x151515, 0.7), red: std(0xc81e14, 0.4),
    };
    // (the speed a car can take each bit of the track at, for the safety car)
    this.vMax = new Float32Array(this.m);
    for (let i = 0; i < this.m; i++) {
      const a = line[(i - 6 + this.m) % this.m], b = line[i], c = line[(i + 6) % this.m];
      const h1 = Math.atan2(b.x - a.x, b.z - a.z), h2 = Math.atan2(c.x - b.x, c.z - b.z);
      let d = Math.abs(Math.atan2(Math.sin(h2 - h1), Math.cos(h2 - h1)));
      const R = d > 1e-4 ? 12 / d : 1e4;
      this.vMax[i] = Math.min(42, Math.sqrt(1.15 * 9.81 * R));
    }
    // where the pit exit joins the track, and where the entry leaves it
    this.exitI = trackside.nearestLine(10, pit.exitZ + 10, 80);
    this.entryI = trackside.nearestLine(10, pit.entryZ - 10, 80);
    // the racing line's points by marshal sector (for the computer drivers)
    const pts = aiField.racing.pts;
    this.sectorOfPt = new Int16Array(pts.length);
    for (let k = 0; k < pts.length; k++) { const i = trackside.nearestLine(pts[k].x, pts[k].z, 60); this.sectorOfPt[k] = i >= 0 ? trackside.sectorOf(i) : 0; }
    aiField.rules = this;            // (ai.js asks rules: cap(), noPass(), moveOver())
    // ---- the vehicles, parked and waiting ----
    // the safety car and the ambulance: in the pit lane, at the exit end,
    // in front of the last garages, facing the way out
    this.parkSC = { x: pit.garageX - 3.2, z: pit.z0 + 22 };
    this.parkAmb = { x: pit.garageX - 3.2, z: pit.z0 + 32 };
    this.sc = { ...buildSafetyCar(), x: this.parkSC.x, z: this.parkSC.z, heading: Math.PI, v: 0, i: 0, lat: 0, state: 'parked', mode: 'free', route: [] };
    this.ambulance = { ...buildAmbulance(), x: this.parkAmb.x, z: this.parkAmb.z, heading: Math.PI, v: 0, i: 0, lat: 2.5, state: 'parked', mode: 'free', route: [] };
    this.parkTruck = { x: pit.garageX - 3.4, z: pit.z0 + 50 };
    this.truck = { ...buildFlatbed(), x: this.parkTruck.x, z: this.parkTruck.z, heading: Math.PI, v: 0, i: 0, lat: 0, state: 'parked', mode: 'free', route: [] };
    for (const v of [this.sc, this.ambulance, this.truck]) { scene.add(v.group); this.place(v); v.flash(0, false); }
    // their size (half width, half length, and how far the middle is from
    // the origin) and who gives way to whom (the higher goes first)
    Object.assign(this.sc, { hw: 0.98, hl: 2.4, mid: 0.1, pri: 4, wb: 2.8 });
    Object.assign(this.ambulance, { hw: 1.0, hl: 2.65, mid: 0, pri: 3, wb: 3.05 });
    Object.assign(this.truck, { hw: 1.2, hl: 3.7, mid: -0.55, pri: 2, wb: 4.9 });
    // the cranes: one at each recovery point, beside the marshal post there
    this.cranes = [];
    const want = [0, 3, 8, 14].map((k) => corners[Math.min(k, corners.length - 1)]).filter(Boolean);
    const used = new Set();
    const circ = (a, b) => Math.abs(((a - b) % this.m + this.m * 1.5) % this.m - this.m / 2);
    const spots = [];
    for (const cn of want) {
      const apex = cn.apex ?? cn.a;
      let best = null, bd = Infinity;
      for (const p of trackside.posts) {
        if (used.has(p) || p.i == null) continue;
        const d = circ(p.i, apex);
        if (d < bd) { bd = d; best = p; }
      }
      if (best) { used.add(best); spots.push(best); }
    }
    // (and more round the lap, so one's never too far away: no post more
    // than ~500 m from a crane, ~700 m on a phone)
    const reach = (isMobile ? 700 : 500) / 2;
    for (const p of trackside.posts) {
      if (p.i == null || used.has(p) || p.i === 0) continue;
      if (spots.every((q) => circ(q.i, p.i) > reach)) { used.add(p); spots.push(p); }
    }
    for (const best of spots) {
      const lp = line[best.i], ax = best.x - lp.x, az = best.z - lp.z, ad = Math.hypot(ax, az) || 1;
      // its spot: on the verge between the track and the barrier (so it
      // never has to go through the barrier to get out), clear of
      // everything, as far off the tarmac as there's room for; or the
      // other side of the track; or, with no room either side, behind the post
      let park = null, side = 1;
      for (const sg of [1, -1]) {
        for (let k = 0; k < 7 && !park; k++) {
          const j = (best.i + k * 3 * (k % 2 ? 1 : -1) + this.m) % this.m, q = line[j];
          const sx = Math.sign((best.x - q.x) * q.lx + (best.z - q.z) * q.lz) * sg || sg;
          for (let off = 10; off >= 3.2; off -= 0.6) {
            const lat = sx * (q.width / 2 + off), px = q.x + q.lx * lat, pz = q.z + q.lz * lat;
            const edge = [q.x + q.lx * sx * q.width / 2, q.z + q.lz * sx * q.width / 2];
            if (this.hooks.blocked?.(px, pz, 2.2)) continue;
            if (!this.clearLine(edge, [px, pz], 1.6)) continue;
            park = { x: px, z: pz, i: j }; side = sx; break;
          }
        }
        if (park) break;
      }
      if (!park) park = { x: best.x + Math.sin(lp.heading) * 6 + ax / ad * 1.5, z: best.z + Math.cos(lp.heading) * 6 + az / ad * 1.5, i: best.i };
      // (parked along the track, facing the way the cars come)
      const ph = line[park.i].heading + Math.PI;
      const c = { ...buildCrane(), x: park.x, z: park.z, heading: ph, park, parkHeading: ph, state: 'parked', t: 0, lift: 0, post: best };
      c.setDrop(0.6);
      Object.assign(c, { hw: 1.25, hl: 2.6, mid: 0, pri: 1, wb: 3.1 });
      scene.add(c.group); this.place(c); c.flash(0, false);
      this.cranes.push(c);
    }
  }
  get busySC() { return this.sc && this.sc.state !== 'parked'; }

  // ---- for the computer drivers ----
  // the fastest he may go at racing-line point i (Infinity: as fast as he likes)
  cap(c, i, plan) {
    const race = this.ai.race;
    if (!race || race.phase !== 'racing') return Infinity;
    let cap = Infinity;
    if (this.phase === 'red') cap = 20;
    if (this.phase === 'vsc') cap = plan * 0.62;
    if (this.phase === 'sc' && (this.sc.state === 'out' || this.sc.state === 'lastLap')) {
      // behind the safety car: hold station behind it
      const gap = this.gapAhead(c.physics.x, c.physics.z, c.near, this.sc.x, this.sc.z);
      if (gap >= 0 && gap < 120) cap = Math.min(cap, Math.max(6, this.sc.v + (gap - 18) * 0.45));
      cap = Math.min(cap, plan * 0.7);
    }
    const f = this.trackside.posts[this.sectorOfPt[i]]?.flag;
    if (f === 'yellow') cap = Math.min(cap, plan * 0.9);
    if (f === 'yellow2') cap = Math.min(cap, plan * 0.7, 26);
    return cap;
  }
  noPass(i) {
    if (this.phase !== 'green') return true;
    const f = this.trackside.posts[this.sectorOfPt[i]]?.flag;
    return f === 'yellow' || f === 'yellow2';
  }
  // a car about to be lapped by you: over to one side, and a little off the pace
  moveOver(c) {
    const P = this.playerRef;
    if (!P || !this.ai.race || this.ai.race.phase !== 'racing') return 0;
    const ahead = this.gapAhead(P.x, P.z, this.ai.player.near, c.physics.x, c.physics.z);
    if (ahead < 0 || ahead > 60) return 0;
    if (this.ai.player.lap <= c.lap) return 0;
    const p = this.ai.racing.pts[c.near];
    const side = ((P.x - p.x) * p.nx + (P.z - p.z) * p.nz) > 0 ? -1 : 1;
    return side * 3;
  }
  // how far ahead along the racing line (x2, z2) is from a car at (x1, z1)
  gapAhead(x1, z1, near1, x2, z2) {
    const pts = this.ai.racing.pts, m = pts.length;
    const n2 = this.ai.nearest(x2, z2, near1);
    const k = (n2 - near1 + m) % m;
    return k > m / 2 ? -1 : k * (pts[near1].ds || 2);
  }

  // ---- a big one: called by the game (a car going up) ----
  bigIncident(kind, at) {
    const race = this.ai.race;
    if (race && race.phase === 'racing') this.setPhase('red');
    this.sendAmbulance(at);
  }

  setPhase(p) {
    if (p === this.phase) return;
    const was = this.phase;
    this.phase = p; this.phaseT = 0;
    const H = this.hooks;
    if (p === 'sc') { H.toast?.('SAFETY CAR DEPLOYED'); this.sendSafetyCar(); }
    if (p === 'vsc') H.toast?.('VIRTUAL SAFETY CAR: SLOW DOWN');
    if (p === 'red') H.toast?.('RED FLAG: SESSION STOPPED. BACK TO THE PITS SLOWLY');
    if (p === 'green' && was !== 'green') H.toast?.(was === 'red' ? 'RACE RESUMING' : 'GREEN FLAG: RACING');
  }

  // ---- vehicles out on the track ----
  // (smoothly between the points of the line, not in 2 m jumps)
  placeOnLine(obj, i, lat) {
    const L = this.line, m = this.m, i0 = ((Math.floor(i) % m) + m) % m, f = i - Math.floor(i);
    const p = L[i0], q = L[(i0 + 1) % m];
    const px = p.x + (q.x - p.x) * f, pz = p.z + (q.z - p.z) * f;
    const lx = p.lx + (q.lx - p.lx) * f, lz = p.lz + (q.lz - p.lz) * f;
    let dh = q.heading - p.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const x = px + lx * lat, z = pz + lz * lat;
    obj.group.position.set(x, this.groundAt(x, z), z);
    // (the body turns smoothly too, and eases into lane changes)
    const want = p.heading + dh * f + (obj.latV || 0) * 0.08 * (obj.dir || 1) + ((obj.dir || 1) < 0 ? Math.PI : 0);
    obj.heading = obj.heading == null ? want : obj.heading + Math.atan2(Math.sin(want - obj.heading), Math.cos(want - obj.heading)) * 0.35;
    obj.group.rotation.y = obj.heading;
    obj.x = x; obj.z = z;
  }
  // the way out: down the lane, out of the exit road, onto the track
  exitRoute() { const P = this.pit; return [[P.laneX + 1, P.z0 + 8], [P.laneX, P.z0 - 10], [P.laneX - 1, P.exitZ + 15]]; }
  // the way back in: the entry road, the lane, then the parking spot
  entryRoute(park) { const P = this.pit; return [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, park.z + 14], [park.x, park.z + 4], [park.x, park.z]]; }
  sendSafetyCar() {
    const sc = this.sc;
    if (sc.state !== 'parked') return;
    sc.state = 'leaving'; sc.mode = 'free'; sc.route = this.exitRoute(); sc.v = 0; sc.lat = 0;
  }
  sendAmbulance(at) {
    const a = this.ambulance;
    if (!at || a.state !== 'parked') return;
    const target = this.trackside.nearestLine(at.x, at.z, 80);
    if (target < 0) return;
    // (pulls up on the side of the track the car's on)
    const p = this.line[target], side = ((at.x - p.x) * p.lx + (at.z - p.z) * p.lz) >= 0 ? 1 : -1;
    a.target = target; a.side = side; a.at = { x: at.x, z: at.z };
    a.state = 'leaving'; a.mode = 'free'; a.route = this.exitRoute(); a.v = 0; a.lat = 0; a.wait = 0;
  }
  // the medical car for any big crash (no red flag by itself)
  medical(at) { this.sendAmbulance(at); }
  // off the road (in the pit lane and its roads): drive through a list of points
  followRoute(v, dt, speed) {
    if (!v.route.length) return true;
    const [tx, tz] = v.route[0], last = v.route.length === 1;
    v.v += Math.max(-6 * dt, Math.min(3 * dt, speed - v.v));
    if (last) v.v = Math.min(v.v, 1 + Math.hypot(tx - v.x, tz - v.z) * 0.8);
    if (this.steerTo(v, tx, tz, Math.max(1, v.v), dt, last ? 0 : 2.5, 2.2)) { v.route.shift(); if (last) { v.v = 0; return true; } }
    return false;
  }
  // from the end of the exit road onto the track itself
  joinTrack(v, lat) {
    v.mode = 'line'; const i = this.trackside.nearestLine(v.x, v.z, 80);
    v.i = i < 0 ? this.exitI : this.project(v.x, v.z, i).i;
    v.lat = i < 0 ? lat : this.project(v.x, v.z, i).lat;         // (from where it is, easing over to lat)
    v.latWant = lat;
  }
  // where a point is along the line (as a fractional point) and across it
  project(x, z, i) {
    const p = this.line[i], tx = Math.sin(p.heading), tz = Math.cos(p.heading);
    const along = (x - p.x) * tx + (z - p.z) * tz;
    return { i: ((i + along / 2) % this.m + this.m) % this.m, lat: (x - p.x) * p.lx + (z - p.z) * p.lz };
  }
  pointAt(i, lat) { const p = this.line[((Math.round(i) % this.m) + this.m) % this.m]; return [p.x + p.lx * lat, p.z + p.lz * lat]; }

  // ---- getting about without going through things ----
  // a path on foot: straight where it's clear, over a barrier (a vault),
  // round a fence, wall, hut or tree. opts: { run, panic, v }
  // THE QUICKEST CLEAR WAY ON FOOT: a search over a small grid (half a
  // metre a square) round the start and the end. Walls, fences, huts,
  // trees and the vehicles are in the way; a barrier low enough to vault
  // can be crossed, but a vault costs time (about what 4 m of running
  // would), so where going round a short barrier is quicker, he goes
  // round. The squares are then pulled into straight runs.
  footPath(from, to, opts = {}) {
    const B = this.hooks.blocked;
    const go = (pt) => ({ go: pt, ...opts });
    if (!B) return [go(to)];
    if (this.clearLine(from, to, 0.25) && !this.vehicleIn(from, to)) return [go(to)];
    const C = 0.5, pad = 14;
    const x0 = Math.min(from[0], to[0]) - pad, z0 = Math.min(from[1], to[1]) - pad;
    const nx = Math.min(360, Math.ceil((Math.abs(from[0] - to[0]) + pad * 2) / C)), nz = Math.min(360, Math.ceil((Math.abs(from[1] - to[1]) + pad * 2) / C));
    const N = nx * nz, cell = new Uint8Array(N), kindH = new Float32Array(N);     // 0 free, 1 vault, 2 no
    const vb = this.vehicleBlobs();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * C, z = z0 + (j + 0.5) * C, k = j * nx + i;
      const c = B(x, z, 0.22);
      if (c) {
        const h = c.kind === 'concrete' ? 1.0 : c.kind === 'tyres' ? 0.9 : c.kind === 'bollard' ? 0.5 : c.kind === 'armco' ? 0.75 : 0;
        if (h) { cell[k] = 1; kindH[k] = h; } else cell[k] = 2;
      } else if (vb.some(([bx, bz, br]) => (x - bx) ** 2 + (z - bz) ** 2 < (br + 0.3) ** 2)) cell[k] = 2;
    }
    const idx = (p) => { const i = Math.max(0, Math.min(nx - 1, Math.floor((p[0] - x0) / C))), j = Math.max(0, Math.min(nz - 1, Math.floor((p[1] - z0) / C))); return j * nx + i; };
    const s0 = idx(from), g0 = idx(to);
    cell[s0] = cell[s0] === 2 ? 0 : cell[s0]; cell[g0] = cell[g0] === 2 ? 0 : cell[g0];   // (he's there, after all)
    // A*, with a little heap
    const gs = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p2 = (i - 1) >> 1; if (heap[p2][0] <= heap[i][0]) break; [heap[p2], heap[i]] = [heap[i], heap[p2]]; i = p2; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const gx = g0 % nx, gz = Math.floor(g0 / nx);
    const hcost = (k) => Math.hypot(k % nx - gx, Math.floor(k / nx) - gz);
    gs[s0] = 0; push(s0, hcost(s0));
    const D8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = false, steps = 0;
    while (heap.length && steps++ < 60000) {
      const [, k] = pop();
      if (done[k]) continue; done[k] = 1;
      if (k === g0) { found = true; break; }
      const i = k % nx, j = Math.floor(k / nx);
      for (const [di, dj, w] of D8) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const kk = jj * nx + ii;
        if (cell[kk] === 2 || done[kk]) continue;
        if (di && dj && (cell[j * nx + ii] === 2 || cell[jj * nx + i] === 2)) continue;   // (no squeezing past a corner)
        // (onto a barrier from open ground: the cost of a vault)
        const extra = cell[kk] === 1 && cell[k] !== 1 ? 8 : cell[kk] === 1 ? 0.5 : 0;
        const g2 = gs[k] + w + extra;
        if (g2 < gs[kk]) { gs[kk] = g2; prev[kk] = k; push(kk, g2 + hcost(kk)); }
      }
    }
    if (!found) return this.footPathSimple(from, to, opts);
    const path = []; for (let k = g0; k >= 0; k = prev[k]) path.push(k); path.reverse();
    const at = (k) => [x0 + (k % nx + 0.5) * C, z0 + (Math.floor(k / nx) + 0.5) * C];
    // into moves: straight runs as far as each stays clear, a vault over each barrier
    const out = [];
    let cur = from, i = 0;
    while (i < path.length) {
      if (cell[path[i]] === 1) {
        // the barrier squares in a row: over them in one vault
        let e = i; while (e < path.length && cell[path[e]] === 1) e++;
        const h = Math.max(...path.slice(i, e).map((k) => kindH[k]));
        const land = e < path.length ? at(path[e]) : to;
        const ux = land[0] - cur[0], uz = land[1] - cur[1], ud = Math.hypot(ux, uz) || 1;
        const exit = [land[0] + ux / ud * 0.25, land[1] + uz / ud * 0.25];
        out.push({ vault: exit, h, t: 0.55 + h * 0.3 });
        cur = exit; i = e + 1;
        continue;
      }
      // the furthest square ahead that's in a straight clear line
      let far = i;
      for (let k2 = i; k2 < path.length && cell[path[k2]] === 0; k2 += 2) { if (this.clearLine(cur, at(path[k2]), 0.22) && !this.vehicleIn(cur, at(path[k2]))) far = k2; else break; }
      const next = far === path.length - 1 ? to : at(path[far]);
      if (cell[path[Math.min(path.length - 1, far + 1)]] === 1 && far + 1 < path.length) {
        // (run up to the barrier: stop just short of it to vault)
        out.push(go(next)); cur = next; i = far + 1;
      } else { out.push(go(next)); cur = next; i = far + 1; }
    }
    if (Math.hypot(cur[0] - to[0], cur[1] - to[1]) > 0.1) out.push(go(to));
    return out;
  }
  // the vehicles, as circles (for the paths on foot)
  vehicleBlobs() { const out = []; for (const v of [this.sc, this.ambulance, this.truck, ...(this.cranes || [])]) if (v) out.push(...this.circles(v)); return out; }
  vehicleIn(a, b) {
    const vb = this.vehicleBlobs(), dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1;
    for (const [cx, cz, r] of vb) {
      const t = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cz - a[1]) * dz) / (d * d)));
      if (Math.hypot(a[0] + dx * t - cx, a[1] + dz * t - cz) < r + 0.3) return true;
    }
    return false;
  }
  footPathSimple(from, to, opts = {}, depth = 0) {
    const B = this.hooks.blocked;
    const go = (pt) => ({ go: pt, ...opts });
    if (!B || depth > 6) return [go(to)];
    const dx = to[0] - from[0], dz = to[1] - from[1], d = Math.hypot(dx, dz);
    if (d < 0.3) return [go(to)];
    const ux = dx / d, uz = dz / d, step = 0.25;
    for (let s0 = step; s0 < d; s0 += step) {
      const x = from[0] + ux * s0, z = from[1] + uz * s0;
      const c = B(x, z, 0.22);
      if (!c) continue;
      const entry = [from[0] + ux * Math.max(0, s0 - 0.45), from[1] + uz * Math.max(0, s0 - 0.45)];
      if (c.kind === 'armco' || c.kind === 'tyres' || c.kind === 'concrete' || c.kind === 'bollard') {
        // through it to the far side, and over
        let e = s0; while (e < d + 3 && B(from[0] + ux * e, from[1] + uz * e, 0.22)) e += step;
        const exit = [from[0] + ux * (e + 0.4), from[1] + uz * (e + 0.4)];
        const h = c.kind === 'concrete' ? 1.0 : c.kind === 'tyres' ? 0.9 : c.kind === 'bollard' ? 0.5 : 0.75;
        return [go(entry), { vault: exit, h, t: 0.55 + h * 0.3 }, ...this.footPathSimple(exit, to, opts, depth + 1)];
      }
      // something not to climb: round the side of it (whichever way's clear first)
      const nx = -uz, nz = ux;
      for (const off of [1.5, 2.5, 4, 6, 9, 13, 18]) for (const sg of [1, -1]) {
        const mid = [x + nx * off * sg - ux * 0.5, z + nz * off * sg - uz * 0.5];
        if (B(mid[0], mid[1], 0.3)) continue;
        if (this.clearLine(from, mid, 0.22, true)) return [go(entry), ...this.footPathSimple(entry, mid, opts, depth + 1), ...this.footPathSimple(mid, to, opts, depth + 1)];
      }
      return [go(to)];
    }
    return [go(to)];
  }
  // is the straight line from a to b clear (barriers allowed, if vaultable)?
  clearLine(a, b, r, climbOK = false) {
    const B = this.hooks.blocked; if (!B) return true;
    const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    for (let s0 = 0.25; s0 < d; s0 += 0.3) {
      const c = B(a[0] + dx / d * s0, a[1] + dz / d * s0, r);
      if (c && !(climbOK && (c.kind === 'armco' || c.kind === 'tyres' || c.kind === 'concrete' || c.kind === 'bollard'))) return false;
    }
    return true;
  }
  // a vehicle's way from where it is to a point: off the verge onto the
  // track, along it (the way the cars go, unless it's a red flag or
  // nothing's racing and back is shorter), then off to the point
  planDrive(v, to, { latEnd = null, allowBack = false } = {}) {
    const i0 = this.trackside.nearestLine(v.x, v.z, 90), i1 = this.trackside.nearestLine(to[0], to[1], 90);
    if (i0 < 0 || i1 < 0) return [{ to }];
    const fwd = ((i1 - i0) % this.m + this.m) % this.m, back = this.m - fwd;
    if (Math.min(fwd, back) < 10) return [{ to }];
    const dir = allowBack && back < fwd ? -1 : 1;
    const half = (i) => this.line[((i % this.m) + this.m) % this.m].width / 2;
    // its own side of the track, on the edge of the tarmac
    const sideOf = (x, z, i) => Math.sign(this.project(x, z, i).lat) || 1;
    const s0 = sideOf(v.x, v.z, i0), s1 = latEnd != null ? Math.sign(latEnd) || 1 : sideOf(to[0], to[1], i1);
    const lat0 = s0 * (half(i0) - 1.4), lat1 = latEnd ?? s1 * (half(i1) - 1.4);
    const j0 = i0 + dir * 5, j1 = i1 - dir * 6;
    return [{ to: this.pointAt(j0, lat0) }, { line: ((j1 % this.m) + this.m) % this.m, dir, lat: lat1, lat0 }, { to }];
  }
  // driving the legs of a plan: true when it's got there
  driveLegs(v, dt, vLine, vOff) {
    const leg = v.legs?.[0];
    if (!leg) return true;
    if (leg.to) {
      const d = Math.hypot(leg.to[0] - v.x, leg.to[1] - v.z), last = v.legs.length === 1;
      v.v = Math.min(vOff, 0.6 + d * (last ? 0.45 : 0.8));
      if (this.steerTo(v, leg.to[0], leg.to[1], v.v, dt, last ? (leg.short || 0) : 1.2, 1.3)) { v.legs.shift(); if (!v.legs.length) { v.v = 0; return true; } if (v.legs[0].line != null) this.startLine(v, v.legs[0]); }
      return false;
    }
    // along the track
    if (v.mode !== 'line') this.startLine(v, leg);
    const left = ((leg.line - v.i) * leg.dir % this.m + this.m) % this.m * 2;
    const want = Math.min(vLine, this.vMax[Math.floor(v.i) % this.m] * 0.9, Math.sqrt(2 * 2.5 * Math.max(0, left - 2)) + 1) * (v.slow ?? 1);
    v.v += Math.max(-5 * dt, Math.min(2 * dt, want - v.v));
    v.i = ((v.i + leg.dir * v.v * dt / 2) % this.m + this.m) % this.m;
    v.latV = (leg.lat - v.lat) * Math.min(1, dt * 0.4) / Math.max(dt, 1e-3);
    v.lat += (leg.lat - v.lat) * Math.min(1, dt * 0.4);
    v.dir = leg.dir;
    this.placeOnLine(v, v.i, v.lat + (v.latBias || 0));
    if (left < 3) { v.legs.shift(); v.mode = 'free'; v.heading = v.group.rotation.y; v.dir = 1; }
    return false;
  }
  startLine(v, leg) {
    const i = this.trackside.nearestLine(v.x, v.z, 90);
    const pr = this.project(v.x, v.z, i < 0 ? 0 : i);
    v.mode = 'line'; v.i = pr.i; v.lat = pr.lat; v.dir = leg.dir;
  }
  // off the track at the entry, then down the lane home
  headHome(v, park) {
    v.mode = 'free'; v.route = this.entryRoute(park); v.heading = v.group.rotation.y;
  }
  // a vehicle driving round: speed by the corners, stop at a point
  drive(veh, dt, vWant, stopAt = null) {
    const m = this.m;
    let want = Math.min(vWant, this.vMax[Math.floor(veh.i) % m] * 0.95);
    if (stopAt != null) {
      const left = ((stopAt - veh.i) % m + m) % m * 2;
      want = Math.min(want, Math.sqrt(2 * 4 * Math.max(0, left - 1)));
      if (left < 2 && veh.v < 1) { veh.v = 0; return true; }
    }
    want *= veh.slow ?? 1;
    veh.v += Math.max(-8 * dt, Math.min(3.5 * dt, want - veh.v));
    veh.i = (veh.i + veh.v * dt / 2) % m;
    this.placeOnLine(veh, veh.i, veh.lat + (veh.latBias || 0));
    return false;
  }

  // ---- every frame ----
  // S: { physics (yours), playerModel, playerBroken, playerOnTrack, playerFire,
  //      playerStopped (s), playerOut (a DNF), inPits, wreck {burning}, engineBlock
  //      {obj, fire}, debris [flying parts], camera }
  update(dt, S) {
    this.t += dt; this.phaseT += dt;
    this.playerRef = S.physics;
    const race = this.ai.race, racing = race && race.phase === 'racing';
    if (!race || race.phase === 'grid') { if (this.phase !== 'green') this.phase = 'green'; }
    // what needs dealing with
    const needs = this.lastNeeds = this.survey(S);
    // the phase for a race: red (set by bigIncident) runs its course; a car
    // stopped on the track: the safety car; off it: the VSC
    if (racing) {
      if (this.phase === 'red') {
        // (once the track's clear; a crane still busy off the track holds it up for a minute and a half at most)
        if (this.phaseT > 20 && !needs.onTrackWreck && (!this.crane || this.phaseT > 90) && !this.repairs.length) this.restart();
      } else if (needs.onTrackWreck || needs.fireOnTrack || this.repairs.some((r) => !r.done)) this.setPhase('sc');
      else if (needs.offTrackWreck) { if (this.phase === 'green') this.setPhase('vsc'); }
      else if (this.phase === 'vsc' && this.phaseT > 4 && !this.crane) this.setPhase('green');
    }
    // the crane, for the first wreck in the queue (only under a safety car,
    // a VSC or a red flag in a race; any time in practice)
    const craneOK = !racing || this.phase !== 'green';
    if (!this.crane && craneOK && needs.wrecks.length) this.sendCrane(needs.wrecks[0]);
    if (this.crane?.state === 'go') { const nw = needs.wrecks.find((x) => x.key === this.crane.w.key); if (nw) { this.crane.w.x = nw.x; this.crane.w.z = nw.z; } }
    if (this.crane) this.updateCrane(dt, S, this.crane);
    if (this.phase === 'sc' && this.sc.state === 'parked') this.sendSafetyCar();
    this.avoid(dt, S);
    this.updateSafetyCar(dt, needs);
    this.updateAmbulance(dt);
    this.updateTruck(dt, S);
    for (const c of this.cranes) if (c !== this.crane && c.state !== 'parked') this.updateCrane(dt, S, c);
    this.updateRepairs(dt);
    // fire marshals and sweepers
    for (const f of needs.fires) if (!this.jobs.has(f.key)) this.sendFireMarshals(f);
    if (needs.debris.length && !this.runners.some((r) => r.job === 'sweep')) this.sendSweeper(needs.debris[0]);
    this.medics?.update?.(dt);
    for (const r of this.runners) r.person.update(dt, this.groundAt);
    this.runners = this.runners.filter((r) => { if (r.done) { this.scene.remove(r.person.root); return false; } return true; });
    // nothing solid gets driven through
    this.separate(S);
    for (const v of [this.sc, this.ambulance, this.truck, ...this.cranes]) if (v) this.rollWheels(v, dt);
    this.peopleClear(S);
    this.bump(S.physics, [...this.cranes, this.ambulance, this.sc, this.truck].filter(Boolean));
    // your penalties
    if (racing) this.judge(dt, S);
  }

  // ---- what's out there: wrecks to lift, fires to put out, bits to sweep ----
  survey(S) {
    const out = { wrecks: [], fires: [], debris: [], onTrackWreck: false, offTrackWreck: false, fireOnTrack: false };
    const onTrack = (x, z) => { const i = this.trackside.nearestLine(x, z, 30); if (i < 0) return false; const p = this.line[i]; return Math.hypot(p.x - x, p.z - z) < p.width / 2 + 1.5; };
    const near = (x, z) => this.trackside.nearestLine(x, z, 40) >= 0;
    // you: broken down out on the circuit
    if (S.playerBroken && S.playerStopped > 6 && !S.inPits && this.truck.load?.kind !== 'player' && near(S.physics.x, S.physics.z)) {
      const on = onTrack(S.physics.x, S.physics.z);
      out.wrecks.push({ key: 'player', kind: 'player', x: S.physics.x, z: S.physics.z, obj: S.playerModel, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the computer cars that are out of it
    for (const c of this.ai.cars) {
      if (c.parked || c.recovered || c.onTruck || !(c.dnf || c.wrecked)) continue;
      const on = onTrack(c.physics.x, c.physics.z);
      out.wrecks.push({ key: c, kind: 'ai', car: c, x: c.physics.x, z: c.physics.z, obj: c.model.car, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the engine block, once it's lying still
    const B = S.engineBlock;
    if (B?.obj?.parent && B.rest && near(B.obj.position.x, B.obj.position.z)) {
      const on = onTrack(B.obj.position.x, B.obj.position.z);
      // (your car first: while it's sat there near the block, the crane's for the car, not the bits)
      const carNear = S.physics && S.playerStopped > 0.5 && !S.inPits && this.truck.load?.kind !== 'player' && Math.hypot(S.physics.x - B.obj.position.x, S.physics.z - B.obj.position.z) < 35;
      if (!B.fire && !carNear) { out.wrecks.push({ key: 'block', kind: 'block', x: B.obj.position.x, z: B.obj.position.z, obj: B.obj, on }); if (on) out.onTrackWreck = true; }
      else if (on) out.onTrackWreck = true;
    }
    // fires: your car (stopped), the wreck, the block
    if (S.playerFire && S.playerStopped > 1.5 && !S.inPits) out.fires.push({ key: 'fire-car', kind: 'car', x: S.physics.x, z: S.physics.z });
    if (S.wreck?.burning) out.fires.push({ key: 'fire-wreck', kind: 'wreck', x: S.physics.x, z: S.physics.z });
    if (B?.obj?.parent && B.fire > 0 && B.rest) out.fires.push({ key: 'fire-block', kind: 'block', x: B.obj.position.x, z: B.obj.position.z });
    for (const f of out.fires) if (onTrack(f.x, f.z)) out.fireOnTrack = true;
    // bits lying on the track, still for a few seconds
    for (const d of S.debris || []) {
      if (!d.rest || d.obj === B?.obj || d.swept) continue;
      d.still = (d.still || 0) + 1 / 60;
      if (d.still > 5 && onTrack(d.obj.position.x, d.obj.position.z)) out.debris.push(d);
    }
    return out;
  }

  // ---- the safety car ----
  updateSafetyCar(dt, needs) {
    const sc = this.sc, clear = !needs.onTrackWreck && !needs.fireOnTrack && !this.crane && !this.repairs.some((r) => !r.done);
    if (sc.state === 'parked') return;
    sc.flash(this.t, sc.state !== 'home');
    sc.green(sc.state === 'out' && this.phaseT < 6);       // (the cars ahead of it may pass for a moment, to join the back)
    if (sc.state === 'leaving') {
      // down the pit lane (at the limit) and out of the exit road
      if (this.followRoute(sc, dt, sc.route.length > 1 ? 16 : 24)) { this.joinTrack(sc, 0); sc.state = 'out'; }
    } else if (sc.state === 'out') {
      this.drive(sc, dt, 34);
      if (clear && this.phaseT > 15) { sc.state = 'lastLap'; this.hooks.toast?.('SAFETY CAR IN THIS LAP'); }
    } else if (sc.state === 'lastLap') {
      // into the pit lane at the entry
      this.drive(sc, dt, 34);
      const left = ((this.entryI - sc.i) % this.m + this.m) % this.m;
      if (left < 6) { sc.state = 'home'; this.setPhase('green'); this.headHome(sc, this.parkSC); }
    } else if (sc.state === 'home') {
      // in at the entry, down the lane, and parked back where it was
      if (this.followRoute(sc, dt, 16)) { sc.state = 'parked'; sc.heading = Math.PI; this.place(sc); sc.flash(0, false); sc.green(false); }
    }
  }

  // ---- the ambulance ----
  updateAmbulance(dt) {
    const a = this.ambulance;
    if (a.state === 'parked') return;
    a.flash(this.t, a.state !== 'home');
    if (a.state === 'leaving') { if (this.followRoute(a, dt, a.route.length > 1 ? 16 : 22)) { this.joinTrack(a, 2.5 * a.side); a.state = 'out'; } }
    else if (a.state === 'out') {
      const p = this.line[Math.floor(a.i) % this.m], edge = p.width / 2 + 0.5;
      const latWant = Math.max(-edge, Math.min(edge, 4.5)) * a.side;
      a.latV = (latWant - a.lat) * Math.min(1, dt * 0.5) / Math.max(dt, 1e-3);
      a.lat += (latWant - a.lat) * Math.min(1, dt * 0.5);
      if (this.drive(a, dt, 40, a.target)) { a.state = 'wait'; a.wait = 0; a.latV = 0; }
    }
    else if (a.state === 'wait') {
      a.wait += dt;
      // the medics: out of the back for the driver, if he's out of his car
      const cas = this.hooks.casualty?.();
      if (cas && !this.medics) this.sendMedics(cas);
      if (this.medics ? this.medics.done : a.wait > (this.hooks.driverWaiting?.() ? 25 : 14)) { a.state = 'away'; this.medics = null; this.hooks.medicsDone?.(); }
    }
    else if (a.state === 'away') {
      // on round to the pit entry, then in
      a.lat += (0 - a.lat) * Math.min(1, dt * 0.5);
      this.drive(a, dt, 30);
      const left = ((this.entryI - a.i) % this.m + this.m) % this.m;
      if (left < 6) { a.state = 'home'; this.headHome(a, this.parkAmb); }
    } else if (a.state === 'home') {
      if (this.followRoute(a, dt, 16)) { a.state = 'parked'; a.heading = Math.PI; this.place(a); a.flash(0, false); }
    }
  }

  // ---- the recovery crane ----
  sendCrane(w) {
    // the nearest crane that's free, from its recovery point
    let best = null, bd = Infinity;
    for (const c of this.cranes) { if (c.state !== 'parked') continue; const d = (c.x - w.x) ** 2 + (c.z - w.z) ** 2; if (d < bd) { bd = d; best = c; } }
    if (!best) return;
    const c = this.crane = best;
    // it puts the wreck down off the road, just past its own spot
    const lp = this.line[c.post.i], tx = Math.sin(lp.heading), tz = Math.cos(lp.heading);
    // it puts the wreck down behind the barrier, at the nearest marshal post to it
    const post = this.nearestPost(w.x, w.z) || c.post;
    const pl = this.line[post.i ?? 0] || lp, ax = post.x - pl.x, az = post.z - pl.z, ad = Math.hypot(ax, az) || 1;
    const ptx = Math.sin(pl.heading || 0), ptz = Math.cos(pl.heading || 0);
    this.sendCraneTo(c, w);
    this.hooks.toast?.(w.kind === 'player' ? 'RECOVERY CRANE ON ITS WAY' : null);
    // a car: the flatbed sets off out of the pits at the same moment, for
    // where the crane will be working
    if ((w.kind === 'player' || w.kind === 'ai') && c.useTruck == null) c.useTruck = this.sendTruck(c, c.stand);
  }
  sendCraneTo(c, w) {
    // where it stops: beside the wreck, on the track side of it
    const wi = this.trackside.nearestLine(w.x, w.z, 60), wp = this.line[Math.max(0, wi)];
    let sx = wp.x - w.x, sz = wp.z - w.z, sd = Math.hypot(sx, sz);
    if (sd < 2) { sx = -Math.sin(wp.heading); sz = -Math.cos(wp.heading); sd = 1; }     // (on the racing line: behind it)
    const stand = [w.x + sx / sd * 4.2, w.z + sz / sd * 4.2];
    const red = this.phase === 'red' || !(this.ai.race && this.ai.race.phase === 'racing');
    Object.assign(c, { w, stand, aimAt: [w.x, w.z], state: 'go', t: 0, lift: 0, offset: null, legs: this.planDrive(c, stand, { allowBack: red }), mode: 'free' });
    c.legs[c.legs.length - 1].short = 0.3;
  }
  place(v) { v.group.position.set(v.x, this.groundAt(v.x, v.z), v.z); v.group.rotation.y = v.heading; }
  steerTo(v, tx, tz, speed, dt, stopShort = 0, turn = 0.9) {
    speed *= v.slow ?? 1;
    const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
    if (d <= stopShort + 0.2) return true;
    const want = Math.atan2(dx, dz);
    let df = want - v.heading; df = Math.atan2(Math.sin(df), Math.cos(df));
    // (a real vehicle: it can only turn as it rolls, no tighter than full
    // lock lets it; it slows for a sharp turn rather than pivoting)
    const step = Math.min(d - stopShort, speed * dt * Math.max(0.35, Math.cos(df)));
    const L = v.wb || 3, lock = Math.tan(0.6) / L;
    // (a point inside its turning circle: after a few seconds going round, a
    // shunt: it gets some extra turn, the way a driver backs and fills)
    v.orbitT = Math.abs(df) > 1.0 && d < 2 / lock ? (v.orbitT || 0) + dt : 0;
    const extra = v.orbitT > 2.5 ? dt * 0.6 : 0;
    v.heading += Math.max(-step * lock - extra, Math.min(step * lock + extra, df));
    v.x += Math.sin(v.heading) * step; v.z += Math.cos(v.heading) * step;
    this.place(v);
    return false;
  }
  // Where the boom has to be for the hook to hang right over (x, z) with
  // the boom's end at least `need` m above the ground: the turntable's
  // angle, the boom's angle and how far it's out. (Solved exactly, so the
  // hook ends up exactly over the spot.)
  boomFor(c, x, z, need) {
    const local = c.group.worldToLocal(new THREE.Vector3(x, c.group.position.y, z));
    const tt = c.turntable.position, lx = local.x - tt.x, lz = local.z - tt.z;
    const D = Math.hypot(lx, lz), yaw = D > 0.05 ? Math.atan2(lx, lz) : c.turntable.rotation.y;
    const H = D + 0.2;                                     // (from the boom's pivot, 0.2 m behind the turntable's middle)
    const V = need - (tt.y + 0.85);                         // (how high above the pivot)
    const Lmin = BOOM_L0, Lmax = BOOM_L0 + 2 * BOOM_EXT;
    // the angle for the height wanted, then the length for the reach;
    // if that's shorter or longer than it goes, the length it has and the
    // angle that gives that reach (L cos p + 0.15 sin p = H)
    let p = Math.max(0.1, Math.min(1.15, Math.atan2(V, H)));
    let L = (H - 0.15 * Math.sin(p)) / Math.cos(p);
    const atLen = (Lc) => { const R = Math.hypot(Lc, 0.15); return Math.atan2(0.15, Lc) + Math.acos(Math.min(1, H / R)); };
    if (L < Lmin) { L = Lmin; p = atLen(L); }
    if (L > Lmax) { L = Lmax; p = Math.max(0.02, atLen(L)); }
    const reach = L * Math.cos(p) + 0.15 * Math.sin(p) - 0.2;
    return { yaw, p, ext: L - BOOM_L0, D, ok: Math.abs(reach - D) < 0.05 };
  }
  // move the boom toward that (it slews, luffs and telescopes at its own
  // speeds); how far off it still is
  moveBoom(c, want, dt) {
    let dy = want.yaw - c.turntable.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    c.turntable.rotation.y += Math.max(-0.45 * dt, Math.min(0.45 * dt, dy));
    const p = -c.boom.rotation.x, dp = want.p - p;
    c.boom.rotation.x = -(p + Math.max(-0.3 * dt, Math.min(0.3 * dt, dp)));
    const de = want.ext - c.ext;
    c.setExtend(c.ext + Math.max(-0.9 * dt, Math.min(0.9 * dt, de)));
    c.pose();
    return Math.max(Math.abs(dy) * 4, Math.abs(dp) * 4, Math.abs(de));
  }
  // folded away: boom in, down and straight, the hook up, the legs up
  stowBoom(c, dt) {
    const k = Math.min(1, dt * 1.2);
    c.turntable.rotation.y *= 1 - k; c.boom.rotation.x *= 1 - k;
    c.setExtend(c.ext - dt * 0.9); c.setDrop(0.6); c.setSlings(0);
    c.setOutriggers(c.out - dt * 0.8); c.pose();
    return Math.abs(c.turntable.rotation.y) < 0.02 && Math.abs(c.boom.rotation.x) < 0.02 && c.ext < 0.01 && c.out <= 0;
  }
  updateCrane(dt, S, c) {
    const w = c.w;
    c.flash(this.t, c.state !== 'parked');
    c.t += dt;
    const SL = 1.0;                                        // (the slings' length, hook to car)
    const CAR_TOP = 0.95;
    if (c.state === 'home') {
      this.stowBoom(c, dt);
      if (c.out > 0) return;                               // (legs up before it moves)
      if (this.driveLegs(c, dt, 5.5, 2.2)) { c.state = 'back'; c.t = 0; }
      return;
    }
    if (c.state === 'back') {
      if (this.stowBoom(c, dt) || c.t > 4) { c.state = 'parked'; c.flash(0, false); c.turntable.rotation.y = 0; c.boom.rotation.x = 0; c.setExtend(0); c.setOutriggers(0); c.pose(); c.parkHeading = c.heading; }
      return;
    }
    const obj = w.obj;
    if (c.state === 'go') {
      // out at a crawl (20 km/h along the track, walking pace off it), and
      // it holds back 20 m off while there's still a fire there
      this.stowBoom(c, dt);
      if (c.out > 0) return;
      const fire = (this.lastNeeds?.fires || []).some((f) => Math.hypot(f.x - w.x, f.z - w.z) < 12);
      const d = Math.hypot(w.x - c.x, w.z - c.z);
      if (fire && d < 22) { c.v = 0; c.waiting = true; return; }
      c.waiting = false;
      // (the wreck's been moved since it set off: a new way there)
      if (Math.hypot(w.x - c.aimAt[0], w.z - c.aimAt[1]) > 4) { this.sendCraneTo(c, w); }
      if (this.driveLegs(c, dt, 7, 2.2)) { c.state = 'reach'; c.t = 0; }
    } else if (c.state === 'reach') {
      // the legs out and down, then the boom swung and run out right over
      // it, and the hook lowered to just above it; the slings on
      c.setOutriggers(c.out + dt / 1.5);
      if (c.out < 1) return;
      const want = this.boomFor(c, w.x, w.z, CAR_TOP + SL + 0.61 + 0.6);
      const off = this.moveBoom(c, want, dt);
      const hy = c.hookAt.getWorldPosition(new THREE.Vector3()).y, gy = this.groundAt(w.x, w.z);
      const dropTo = Math.max(0.25, hy - (gy + CAR_TOP + SL + 0.61));
      c.setDrop(c.drop + Math.max(-0.8 * dt, Math.min(0.8 * dt, (off < 0.05 ? dropTo : 0.6) - c.drop)));
      if (off < 0.05 && Math.abs(c.drop - dropTo) < 0.03) { c.setSlings(SL); if (!c.hookedT) c.hookedT = c.t; }
      if (c.hookedT && c.t - c.hookedT > 1.0) { c.state = 'lift'; c.t = 0; c.hookedT = 0; c.pick = [w.x, w.z]; c.hookWorld = new THREE.Vector3(); }
    } else if (c.state === 'lift') {
      // up it comes, straight up: the boom luffs up and runs out to keep the hook over the spot
      c.lift = 2.2 * Math.min(1, c.t / 3.5);
      this.moveBoom(c, this.boomFor(c, c.pick[0], c.pick[1], 2.2 + CAR_TOP + SL + 0.61 + 0.35), dt);
      if (c.t > 3.6) { c.state = 'carry'; c.t = 0; c.ferries = 0; }
    } else if (c.state === 'carry') {
      // a car goes on the flatbed (called out now, if it's free); the engine
      // block, or with the truck busy, over the barrier
      if (c.useTruck == null) c.useTruck = (w.kind === 'player' || w.kind === 'ai') && this.sendTruck(c);
      const T = this.truck;
      c.lift = 2.2;
      if (c.useTruck) {
        if (T.state !== 'waiting') { c.t = 0; return this.hang(c, w, obj, S); }          // (holding it up, waiting for the truck)
        T.group.updateMatrixWorld(true);
        c.dropAt = T.bedAt.clone().applyMatrix4(T.group.matrixWorld);
        // too far for the boom to reach (or too close under it): it drives
        // over to the truck, carrying the car, and sets up again beside it
        const want = this.boomFor(c, c.dropAt.x, c.dropAt.z, 2.2 + CAR_TOP + SL + 0.61 + 0.35);
        if ((!want.ok || want.D > 6.4 || want.D < 2.6) && c.ferries < 3) {
          c.ferries++;
          const h = T.group.rotation.y, rx = Math.cos(h), rz = -Math.sin(h);
          const side = ((c.x - c.dropAt.x) * rx + (c.z - c.dropAt.z) * rz) >= 0 ? 1 : -1;
          let to = null;
          for (const sg of [side, -side]) for (const along of [0, 1.5, -1.5]) {
            const px = c.dropAt.x + rx * sg * 5.2 + Math.sin(h) * along, pz = c.dropAt.z + rz * sg * 5.2 + Math.cos(h) * along;
            if (!to && !this.hooks.blocked?.(px, pz, 2.0)) to = [px, pz];
          }
          to = to || [c.dropAt.x + rx * side * 5.2, c.dropAt.z + rz * side * 5.2];
          c.legs = this.planDrive(c, to, { allowBack: true }); c.legs[c.legs.length - 1].short = 0.3;
          c.state = 'ferry'; c.t = 0;
          return this.hang(c, w, obj, S);
        }
      }
      // the boom swings round and lifts it over the barrier, off the track
      if (!c.dropAt) {
        const i = this.trackside.nearestLine(c.x, c.z, 60), lp = this.line[Math.max(0, i)];
        let ox = c.x - lp.x, oz = c.z - lp.z, od = Math.hypot(ox, oz);
        if (od < 0.5) { ox = lp.lx; oz = lp.lz; od = 1; }
        c.dropAt = new THREE.Vector3(c.x + ox / od * 5.2, 0, c.z + oz / od * 5.2);
      }
      const off = this.moveBoom(c, this.boomFor(c, c.dropAt.x, c.dropAt.z, 2.2 + CAR_TOP + SL + 0.61 + 0.35), dt);
      // (right over the spot, steady, and the car turned to lie along the bed)
      const turned = !c.useTruck || Math.abs(this.loadTurn(w, S, T.group.rotation.y, dt)) < 0.01;
      if (off < 0.01 && turned) { c.steady = (c.steady || 0) + dt; if (c.steady > 0.6) { c.state = 'drop'; c.t = 0; c.steady = 0; c.dropFrom = c.lift; } }
      else c.steady = 0;
    } else if (c.state === 'ferry') {
      // legs up, then over to the truck at a walk with the car on the hook
      c.setOutriggers(c.out - dt * 0.8);
      if (c.out <= 0 && this.driveLegs(c, dt, 4, 2.2)) { c.state = 'set'; c.t = 0; }
    } else if (c.state === 'set') {
      c.setOutriggers(c.out + dt / 1.5);
      if (c.out >= 1) { c.state = 'carry'; c.t = 0; }
    } else if (c.state === 'drop') {
      // straight down onto the spot, the boom held exactly over it
      const T = this.truck;
      this.moveBoom(c, this.boomFor(c, c.dropAt.x, c.dropAt.z, 2.2 + CAR_TOP + SL + 0.61 + 0.35), dt);
      if (c.useTruck) this.loadTurn(w, S, T.group.rotation.y, dt);
      const floor = c.useTruck ? c.dropAt.y - this.groundAt(c.dropAt.x, c.dropAt.z) : 0;      // (the bed's height where the car will sit)
      const e = Math.min(1, c.t / 2.0), ee = e * e * (3 - 2 * e);
      c.lift = c.dropFrom + (floor - c.dropFrom) * ee;
      if (c.t > 2.3 && c.useTruck) {
        this.hookLift = null;
        // on the bed: the slings off, and the truck takes it from here
        T.load = w; T.state = 'carry'; T.carryT = 0;
        if (w.kind === 'ai') w.car.onTruck = true;
        c.state = 'home'; c.t = 0; c.lift = 0; c.w = null; c.dropAt = null; c.useTruck = null; c.setSlings(0);
        c.legs = this.planDrive(c, [c.park.x, c.park.z], { allowBack: true });
        if (this.crane === c) this.crane = null;
        return;
      }
      if (c.t > 2.2 && !c.useTruck) {
        // done: the wreck's dealt with
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; }
        else if (w.kind === 'block') this.hooks.removeBlock?.();
        // and home, empty
        c.state = 'home'; c.t = 0; c.lift = 0; c.w = null; c.dropAt = null; c.useTruck = null; c.setSlings(0);
        c.legs = this.planDrive(c, [c.park.x, c.park.z], { allowBack: true });
        if (this.crane === c) this.crane = null;
        return;
      }
    }
    this.hang(c, w, obj, S);
  }
  // the load turned (a marshal steadying it on a rope) to lie along the
  // truck: how far it still has to go
  loadTurn(w, S, want, dt) {
    const cur = w.kind === 'player' ? S.physics?.heading ?? 0 : w.kind === 'ai' ? w.car.physics.heading : 0;
    let d = want - cur; d = Math.atan2(Math.sin(d), Math.cos(d));
    // (it may go either way round along the bed: whichever's nearer, nose to the cab)
    const hh = cur + Math.max(-0.5 * dt, Math.min(0.5 * dt, d));
    if (w.kind === 'player' && S.physics) S.physics.heading = hh;
    if (w.kind === 'ai') { w.car.physics.heading = hh; if (w.obj) w.obj.rotation.y = hh; }
    return d;
  }
  // the wreck hanging from the hook: right under it, on the slings
  hang(c, w, obj, S) {
    if (c.state === 'lift' || c.state === 'carry' || c.state === 'drop' || c.state === 'ferry' || c.state === 'set') {
      c.hookAt.updateWorldMatrix(true, false);
      const h = c.hookAt.getWorldPosition(new THREE.Vector3());
      if (c.state === 'lift' && !c.offset) c.offset = new THREE.Vector3(w.x - h.x, 0, w.z - h.z);
      // (any last bit it was off by when it was picked up, taken up as it lifts)
      const k = c.state === 'lift' ? 1 - Math.min(1, c.t / 1.5) : 0;
      if (c.state !== 'lift') c.offset = null;
      const x = h.x + (c.offset?.x || 0) * k, z = h.z + (c.offset?.z || 0) * k, lift = c.lift;
      w.x = x; w.z = z;
      const gy = this.groundAt(x, z);
      if (obj) { obj.position.x = x; obj.position.z = z; obj.position.y = gy + lift; }
      if (w.kind === 'player' && S.physics) { S.physics.x = x; S.physics.z = z; S.physics.vx = S.physics.vy = 0; this.liftedPlayer = lift; this.hookLift = lift; }
      if (w.kind === 'ai') { w.car.physics.x = x; w.car.physics.z = z; w.car.lift = lift; }
      // the hook hangs just over the car, the slings down to it
      c.setSlings(1.0);
      c.setDrop(Math.max(0.25, h.y - (gy + lift + 0.95 + 1.0 + 0.61)));
    }
  }

  // ---- the flatbed: out of the pit lane to the crane, then the wreck back to the pits ----
  sendTruck(c, at = [c.x, c.z]) {
    const T = this.truck;
    if (T.state !== 'parked') return false;
    // where it waits: on the track beside the crane, nose the way the cars go
    const i = this.trackside.nearestLine(at[0], at[1], 60);
    if (i < 0) return false;
    const pr = this.project(at[0], at[1], i), half = this.line[i].width / 2;
    const lat = Math.sign(pr.lat || 1) * Math.max(0, Math.min(half - 1.6, Math.abs(pr.lat) - 3.6));
    T.spot = this.pointAt(i + 5, lat); T.spotI = i + 5;      // (10 m on, clear of where the crane will stand)
    T.state = 'leaving'; T.mode = 'free'; T.route = this.exitRoute(); T.v = 0;
    this.hooks.toast?.(null);
    return true;
  }
  updateTruck(dt, S) {
    const T = this.truck;
    if (T.state === 'parked') return;
    T.flash(this.t, T.state !== 'home' && T.state !== 'unload');
    const red = this.phase === 'red' || !(this.ai.race && this.ai.race.phase === 'racing');
    if (T.state === 'leaving') {
      if (this.followRoute(T, dt, T.route.length > 1 ? 16 : 18)) { T.legs = this.planDrive(T, T.spot, { allowBack: red, latEnd: this.project(T.spot[0], T.spot[1], ((T.spotI % this.m) + this.m) % this.m).lat || 0.01 }); T.state = 'going'; }
    } else if (T.state === 'going') {
      if (this.driveLegs(T, dt, 16, 3)) { T.state = 'waiting'; T.v = 0; }
    } else if (T.state === 'carry') {
      // on round to the pit entry (the way the cars go), in, and to the box
      // (the short way back, against the way the cars go, only when nothing's racing or it's a red flag)
      if (!T.toPits) {
        const i = this.trackside.nearestLine(T.x, T.z, 60), fwd = ((this.entryI - i) % this.m + this.m) % this.m;
        const dir = red && this.m - fwd < fwd ? -1 : 1;
        T.legs = [{ line: dir > 0 ? this.entryI : (this.entryI + 4) % this.m, dir, lat: 0 }];
        T.toPits = 'track';
      }
      if (T.toPits === 'track') {
        if (this.driveLegs(T, dt, 22, 4)) {
          T.toPits = 'lane'; T.mode = 'free'; T.heading = T.group.rotation.y;
          const B = this.pit.box, P = this.pit;
          T.route = T.load.kind === 'player'
            ? [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, B.z + 16], [B.x, B.z + 7], [B.x, B.z + 2.5]]
            : [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, P.z0 + 60], [this.parkTruck.x, this.parkTruck.z + 6]];
        }
      } else if (T.toPits === 'lane') {
        if (this.followRoute(T, dt, 16)) { T.state = 'unload'; T.t = 0; }
      }
    } else if (T.state === 'unload') {
      // off the back, and the car's dealt with
      T.t += dt;
      if (T.t > 2) {
        const w = T.load;
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; w.car.onTruck = false; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; if (w.obj) w.obj.position.y = 0; }
        T.load = null; T.toPits = null; T.state = 'home';
        T.route = [[this.pit.laneX, T.z - 12], [this.pit.laneX, this.parkTruck.z + 14], [this.parkTruck.x, this.parkTruck.z + 4], [this.parkTruck.x, this.parkTruck.z]];
        return;
      }
    } else if (T.state === 'home') {
      if (this.followRoute(T, dt, 14)) { T.state = 'parked'; T.heading = Math.PI; this.place(T); T.flash(0, false); }
    }
    // the load rides on the bed
    if (T.load) {
      const w = T.load;
      T.group.updateMatrixWorld(true);
      const at = T.bedAt.clone().applyMatrix4(T.group.matrixWorld);
      w.x = at.x; w.z = at.z;
      const h = T.group.rotation.y;
      if (w.obj) { w.obj.position.set(at.x, at.y, at.z); if (w.kind === 'ai') w.obj.rotation.y = h; }
      if (w.kind === 'player' && S.physics) { S.physics.x = at.x; S.physics.z = at.z; S.physics.vx = S.physics.vy = 0; S.physics.heading = h; this.liftedPlayer = T.bedY; }
      if (w.kind === 'ai') { w.car.physics.x = at.x; w.car.physics.z = at.z; w.car.physics.heading = h; w.car.lift = this.groundAt(at.x, at.z) * 0 + T.bedY; }
    }
  }
  // how high your car is lifted (on the hook, or on the truck's bed)
  get playerLift() {
    if (this.truck?.load?.kind === 'player') return this.truck.bedY;
    if (this.crane?.w?.kind === 'player') return this.hookLift ?? this.crane.lift;
    return 0;
  }

  // ---- fire marshals: two from the nearest post, at a run ----
  nearestPost(x, z) {
    let best = null, bd = Infinity;
    for (const p of this.trackside.posts) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  // a marshal comes out from behind his hut (and goes back behind it when done)
  hutPath(post) {
    const lp = this.line[post.i ?? 0] || { x: post.x - 5, z: post.z, heading: 0 };
    const ax = post.x - lp.x, az = post.z - lp.z, ad = Math.hypot(ax, az) || 1;
    const tx = Math.sin(lp.heading ?? 0), tz = Math.cos(lp.heading ?? 0), side = Math.random() < 0.5 ? 1 : -1;
    return { behind: [post.x + ax / ad * 2.2, post.z + az / ad * 2.2], corner: [post.x + tx * 2.3 * side + ax / ad * 0.3, post.z + tz * 2.3 * side + az / ad * 0.3] };
  }
  newRunner(post, job) {
    const person = new Person(this.mats, 0);
    const h = this.hutPath(post);
    person.place(h.behind[0] + (Math.random() - 0.5), h.behind[1] + (Math.random() - 0.5), 0);
    this.scene.add(person.root);
    const r = { person, job, done: false, hut: h };
    this.runners.push(r);
    return r;
  }
  sendFireMarshals(f) {
    this.jobs.add(f.key);
    const post = this.nearestPost(f.x, f.z);
    if (!post) return;
    const job = { f, out: false, crew: [] };
    for (let k = 0; k < 2; k++) this.sendExtinguisher(job, post, k);
  }
  // one marshal with an extinguisher: out at a sprint, over the barrier,
  // then at the fire in bursts from the side away from the smoke, working
  // round it, until it's out (or his can's empty: then another comes)
  sendExtinguisher(job, post, k) {
    const f = job.f;
    const r = this.newRunner(post, 'fire');
    const ext = makeExtinguisher(this.mats);
    // held across the body like a rifle: one hand on the handle, the other under the can
    ext.rotation.x = Math.PI / 2 - 0.25; ext.position.set(0, -0.05, -0.2);
    r.person.hold(ext, 'front');
    r.can = 16;                                         // (seconds of spray in it)
    let ang = (k % 2 ? 1 : -1) * 0.9 + Math.atan2(post.x - f.x, post.z - f.z);
    const ring = f.kind === 'car' ? 2.4 : 2.0;
    const spot = () => [f.x + Math.sin(ang) * ring, f.z + Math.cos(ang) * ring];
    const out = () => (this.hooks.fireLeft?.(f.kind) ?? 0) <= 0 || job.out;
    const burst = () => [
      { face: [f.x, f.z], quick: true },
      { pose: 'SPRAY_RIFLE' },
      { fn: () => { r.spraying = true; } },
      { until: () => { r.burstT = (r.burstT || 0) + 1 / 60; return out() || r.burstT > 1.1 + Math.random() * 0.6 || r.can <= 0; } },
      { fn: () => { r.spraying = false; r.burstT = 0; } },
      { pose: 'RIFLE', t: 0.35 },
      // step round a little for the next one
      { fn: () => { if (!out() && r.can > 0) { ang += (k % 2 ? 1 : -1) * (0.25 + Math.random() * 0.25); r.person.then([{ go: spot(), v: 1.4 }, ...burst()]); } else r.person.then(after()); } },
    ];
    const after = () => {
      if (out()) {
        if (!job.out) { job.out = true; this.hooks.extinguish?.(f.kind); setTimeout(() => this.jobs.delete(f.key), 8000); }
        return [{ pose: 'STAND' }, { look: [f.x, f.z] }, { wait: 2.5 }, { look: null }, { pose: 'RIFLE' }, ...this.footPath(spot(), r.hut.corner), { go: r.hut.behind }, { fn: () => { r.done = true; } }];
      }
      // can's empty: back for another, and someone else comes with a full one
      this.sendExtinguisher(job, post, k + 2);
      return [{ pose: 'STAND' }, ...this.footPath(spot(), r.hut.corner), { go: r.hut.behind }, { fn: () => { r.done = true; } }];
    };
    r.person.run([
      { wait: (k % 2) * 0.35 + Math.random() * 0.5 },          // (not off the mark together)
      { pose: 'RIFLE' },
      { look: [f.x, f.z] },
      { go: r.hut.corner, run: true, panic: true },
      ...this.footPath(r.hut.corner, spot(), { run: true, panic: true }),
      { look: null },
      ...burst(),
    ]);
    // each burst knocks it down (two of them on it at once: twice as fast)
    r.sprayAt = () => {
      if (!r.spraying) return null;
      r.can -= 1 / 60;
      this.hooks.douse?.(f.kind, (f.kind === 'car' ? 0.075 : 0.06) / 60 * (0.9 + Math.random() * 0.2));
      return { x: r.person.x, z: r.person.z, tx: f.x, tz: f.z };
    };
    job.crew.push(r);
  }
  sendSweeper(d) {
    d.swept = true;
    const post = this.nearestPost(d.obj.position.x, d.obj.position.z);
    if (!post) return;
    const r = this.newRunner(post, 'sweep');
    const at = [d.obj.position.x, d.obj.position.z];
    r.person.run([
      { go: r.hut.corner, run: true },
      ...this.footPath(r.hut.corner, at, { run: true }),
      { pose: 'REACH', t: 0.6 },
      { fn: () => { this.hooks.removeDebris?.(d); } },
      { pose: 'CARRY' },
      ...this.footPath(at, r.hut.corner),
      { go: r.hut.behind },
      { fn: () => { r.done = true; } },
    ]);
  }
  // ---- a barrier hit hard: called by the game with the speed into it ----
  barrierHit(at, v, kind) {
    if (v < 18 || !at) return;
    // (one repair per stretch of barrier)
    if (this.repairs.some((r) => Math.hypot(r.x - at.x, r.z - at.z) < 12)) return;
    const severe = v >= 28;
    const rep = { x: at.x, z: at.z, kind, done: false, t: 0, need: severe ? 40 : 22, crew: [] };
    this.repairs.push(rep);
    const race = this.ai.race, racing = race && race.phase === 'racing';
    if (racing) {
      if (severe) { this.setPhase('red'); this.hooks.toast?.(kind === 'tyres' ? 'RED FLAG: THE TYRE WALL NEEDS REBUILDING' : 'RED FLAG: BARRIER REPAIRS'); }
      else if (this.phase === 'green') this.setPhase('sc');
    } else this.hooks.toast?.('BARRIER DAMAGED: REPAIR CREW ON ITS WAY');
    // the crew: three from the nearest post, to work along the damaged bit
    const post = this.nearestPost(at.x, at.z);
    if (!post) return;
    const i = this.trackside.nearestLine(at.x, at.z, 40), lp = this.line[Math.max(0, i)];
    const tx = Math.sin(lp?.heading || 0), tz = Math.cos(lp?.heading || 0);
    // (they stand on the track side of it, just off it, facing it)
    let nx = lp ? lp.x - at.x : 1, nz = lp ? lp.z - at.z : 0; const nd = Math.hypot(nx, nz) || 1; nx /= nd; nz /= nd;
    for (let k = 0; k < 3; k++) {
      const r = this.newRunner(post, 'repair');
      const off = (k - 1) * 1.6;
      const on = [at.x + tx * off, at.z + tz * off], stand = [on[0] + nx * 0.85, on[1] + nz * 0.85];
      r.person.run([
        { wait: k * 0.5 + Math.random() * 0.6 },
        { go: r.hut.corner, run: true },
        ...this.footPath(r.hut.corner, stand, { run: true }),
        { face: on, quick: true }, { look: on },
        { pose: k === 1 ? 'BOLT' : 'WORK' },
        { until: () => rep.done },
        { pose: 'STAND' }, { look: null },
        ...this.footPath(stand, r.hut.corner),
        { go: r.hut.behind },
        { fn: () => { r.done = true; } },
      ]);
      rep.crew.push(r);
    }
  }
  updateRepairs(dt) {
    for (const rep of this.repairs) {
      if (rep.done) continue;
      // (they start once they're all there)
      if (rep.crew.every((r) => r.person.want === 'WORK' || r.person.want === 'BOLT' || r.done)) {
        rep.t += dt;
        // (and it shows: the dents pulled out a bit at a time while they work)
        this.hooks.repairBarrier?.(rep, Math.min(1, dt * 3 / rep.need));
      }
      if (rep.t > rep.need) { rep.done = true; this.hooks.repairBarrier?.(rep, 1); this.hooks.barrierFixed?.(rep); this.hooks.toast?.('BARRIER REPAIRED'); }
    }
    this.repairs = this.repairs.filter((r) => !r.done || r.crew.some((c) => !c.done));
  }
  // white extinguisher clouds, for the game to draw (where, and at what)
  // ---- the medics: two out of the back of the ambulance ----
  // cas: { person (the driver), hurt (down: the stretcher) }
  sendMedics(cas) {
    const a = this.ambulance, M = this.medics = { done: false, crew: [], cas };
    if (!this.medicMats) {
      this.medicMats = { look: 'medic', suits: [std(0x1f6b3a, 0.8)], helmet: this.mats.helmet, visor: this.mats.visor, glove: std(0x3a6bd8, 0.6), boot: std(0x111111, 0.8) };
    }
    a.group.updateMatrixWorld(true);
    const back = a.doors.clone().applyMatrix4(a.group.matrixWorld), door = [back.x, back.z];
    const D = cas.person, body = D.bodyAt, at = () => body;
    // (one each side of him, halfway along, kneeling by his chest)
    const across = D.face + Math.PI / 2;
    const side = (k) => [body[0] + Math.sin(across) * (k ? 0.65 : -0.65), body[1] + Math.cos(across) * (k ? 0.65 : -0.65)];
    // the stretcher: a frame with a mattress, carried by its ends
    let stretcher = null;
    if (cas.hurt) {
      stretcher = new THREE.Group();
      addMesh(stretcher, roundBox(0.6, 0.08, 2.0, 0.03, 0, 0.0, 0), std(0xe8e8e2, 0.6));
      addMesh(stretcher, roundBox(0.56, 0.06, 1.9, 0.02, 0, 0.06, 0), std(0xd23a1f, 0.7));
      for (const sx of [-0.31, 0.31]) addMesh(stretcher, new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6).rotateX(Math.PI / 2).translate(sx, 0, 0), std(0xa4a8ae, 0.3, { metalness: 0.8 }), false);
      stretcher.visible = false; this.scene.add(stretcher);
    }
    let carried = false;
    const h0 = Math.atan2(door[0] - body[0], door[1] - body[1]);
    for (let k = 0; k < 2; k++) {
      const p = new Person(this.medicMats, 0);
      p.place(door[0] + (k - 0.5) * 0.7, door[1], a.heading + Math.PI);
      this.scene.add(p.root);
      const r = { person: p, job: 'medic', done: false };
      this.runners.push(r); M.crew.push(r);
      const there = side(k);
      const list = [
        { wait: 0.4 + k * 0.3 },
        ...this.footPath([p.x, p.z], there, { run: true }),
        { face: at() },
        { pose: 'MEDIC', t: cas.hurt ? 5 : 3.5 },
      ];
      if (cas.hurt) {
        // onto the stretcher, lifted, carried to the back doors and in
        list.push(
          { fn: () => { if (k === 0) { stretcher.visible = true; stretcher.position.set(body[0], this.groundAt(body[0], body[1]) + 0.28, body[1]); stretcher.rotation.y = h0; } } },
          { go: [body[0] + Math.sin(h0) * (k ? -1.15 : 1.15), body[1] + Math.cos(h0) * (k ? -1.15 : 1.15)] },
          { face: body },
          { pose: 'STRETCH', t: 1.2 },
          { fn: () => { if (k === 0) { carried = true; this.hooks.onStretcher?.(stretcher); } } },
          { pose: 'STRETCH_UP', t: 0.6 },
        );
      } else {
        list.push({ fn: () => { if (k === 0) this.hooks.helpUp?.(door); } }, { pose: 'STAND', t: 0.8 });
      }
      list.push(
        { until: () => carried || !cas.hurt },
        { fn: () => { if (cas.hurt) { r.person.follow = () => { const h = stretcher.rotation.y, e = k ? -1.15 : 1.15, sx = stretcher.position.x + Math.sin(h) * e, sz = stretcher.position.z + Math.cos(h) * e; return [sx, sz, h, M.moving ? 1.2 : 0]; }; } } },
        { until: () => M.loaded || !cas.hurt },
        { fn: () => { r.person.follow = null; } },
        ...(cas.hurt ? [] : this.footPath(there, door, { v: 1.4 })),
        { go: door },
        { fn: () => { r.done = true; r.person.root.visible = false; if (k === 1) M.done = true; } },
      );
      p.run(list);
    }
    // the stretcher's own trip to the doors once it's up
    M.update = (dt) => {
      if (!carried || M.loaded || !stretcher) return;
      const dx = door[0] - stretcher.position.x, dz = door[1] - stretcher.position.z, d = Math.hypot(dx, dz);
      M.moving = d > 0.6;
      if (d > 0.6) { const st = Math.min(d, 1.2 * dt); stretcher.position.x += dx / d * st; stretcher.position.z += dz / d * st; stretcher.position.y = this.groundAt(stretcher.position.x, stretcher.position.z) + 0.85; stretcher.rotation.y += Math.atan2(Math.sin(Math.atan2(dx, dz) - stretcher.rotation.y), Math.cos(Math.atan2(dx, dz) - stretcher.rotation.y)) * Math.min(1, dt * 2); }
      else { M.loaded = true; stretcher.visible = false; this.scene.remove(stretcher); this.hooks.loaded?.(); }
    };
  }
  sprays() { const out = []; for (const r of this.runners) { const s = r.sprayAt?.(); if (s) out.push(s); } return out; }

  // ---- solid vehicles: you don't drive through them ----
  // ---- keeping out of each other's way ----
  // each one looks ahead along its way: anything in its path (another of
  // them, a car) and it eases off, and (on the track) moves over to pass
  // it, the one lower down the order giving way. A stuck pair: the lower
  // one backs off and lets the other through.
  circles(v) {
    const h = v.group.rotation.y, fx = Math.sin(h), fz = Math.cos(h), out = [], r = v.hw + 0.05;
    const n = Math.max(2, Math.ceil(v.hl / v.hw));
    for (let k = 0; k < n; k++) { const a = v.mid - v.hl + r + (2 * (v.hl - r)) * k / (n - 1); out.push([v.group.position.x + fx * a, v.group.position.z + fz * a, r]); }
    return out;
  }
  avoid(dt, S) {
    const V = [this.sc, this.ambulance, this.truck, ...this.cranes].filter(Boolean);
    const others = [...V.map((v) => ({ x: v.group.position.x, z: v.group.position.z, hw: v.hw, hl: v.hl, pri: v.pri, v })),
      ...this.ai.cars.filter((c) => !c.parked).map((c) => ({ x: c.physics.x, z: c.physics.z, hw: 1, hl: 2.3, pri: 9 }))];
    if (S.physics) others.push({ x: S.physics.x, z: S.physics.z, hw: 1, hl: 2.3, pri: 9 });
    for (const A of V) {
      if (A.state === 'parked') { A.slow = 1; continue; }
      const h = A.group.rotation.y, fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
      let slow = 1, bias = 0;
      for (const B of others) {
        if (B.v === A) continue;
        const rx = B.x - A.group.position.x, rz = B.z - A.group.position.z;
        const ahead = rx * fx + rz * fz, side = rx * lx + rz * lz;
        const lane = A.hw + B.hw + 0.7;
        if (ahead <= 0 || ahead > 16 || Math.abs(side) > lane) continue;
        const gap = ahead - A.hl - B.hl - 0.8;
        // (a car, or one higher up the order, or one stopped: ease off for it)
        const yields = B.pri > A.pri || B.v?.state === 'parked' || (B.v && (B.v.v || 0) < 0.5);
        // (on the track it moves over and goes round, so it only slows to a
        // crawl, not a stop, unless it's already as far over as it can go)
        const canPass = A.mode === 'line' && Math.abs(A.latBias || 0) < 3.8;
        const floor = canPass ? 0.3 : 0;
        slow = Math.min(slow, yields ? Math.max(floor, Math.min(1, gap / 7)) : Math.max(0.35, Math.min(1, gap / 5)));
        bias += -(Math.sign(side) || 1) * (lane - Math.abs(side)) * Math.max(0, 1 - Math.max(0, gap) / 10);
      }
      // a pair stuck nose to nose for a while: the lower one goes anyway (round it)
      A.stuckT = slow < 0.05 ? (A.stuckT || 0) + dt : 0;
      if (A.stuckT > 3) { slow = 0.3; bias *= 1.5; }
      A.slow = (A.slow ?? 1) + (slow - (A.slow ?? 1)) * Math.min(1, dt * 6);
      // (moving over, on the track: the bias across it)
      if (A.mode === 'line') {
        const p = this.line[Math.floor(A.i) % this.m];
        const want = Math.max(-4, Math.min(4, bias * (lx * p.lx + lz * p.lz)));
        A.latBias = (A.latBias || 0) + (want - (A.latBias || 0)) * Math.min(1, dt * 1.5);
      } else A.latBias = (A.latBias || 0) * Math.max(0, 1 - dt * 2);
    }
  }
  // and nothing goes through anything: overlapping ones pushed apart (the
  // one lower down the order, or stopped, moves; one parked never does)
  separate(S) {
    const V = [this.sc, this.ambulance, this.truck, ...this.cranes].filter(Boolean);
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
      const A = V[i], B = V[j];
      if (A.state === 'parked' && B.state === 'parked') continue;
      if (Math.hypot(A.group.position.x - B.group.position.x, A.group.position.z - B.group.position.z) > A.hl + B.hl + 2) continue;
      let px = 0, pz = 0;
      for (const [ax, az, ar] of this.circles(A)) for (const [bx, bz, br] of this.circles(B)) {
        const dx = ax - bx, dz = az - bz, d = Math.hypot(dx, dz), o = ar + br - d;
        if (o > 0 && d > 1e-4) { px += dx / d * o; pz += dz / d * o; }
      }
      if (!px && !pz) continue;
      const aFixed = A.state === 'parked', bFixed = B.state === 'parked';
      const kA = aFixed ? 0 : bFixed ? 1 : A.pri < B.pri ? 1 : A.pri > B.pri ? 0 : 0.5;
      this.nudge(A, px * kA * 0.5, pz * kA * 0.5); this.nudge(B, -px * (1 - kA) * 0.5, -pz * (1 - kA) * 0.5);
    }
    // the computer cars out of them too
    for (const c of this.ai.cars) {
      if (c.parked || c.onTruck) continue;
      for (const v of V) for (const [cx, cz, r] of this.circles(v)) {
        const dx = c.physics.x - cx, dz = c.physics.z - cz, d = Math.hypot(dx, dz), o = r + 0.95 - d;
        if (o > 0 && d > 1e-4) { c.physics.x += dx / d * o; c.physics.z += dz / d * o; }
      }
    }
  }
  // nobody walks through a vehicle, a car, or anyone else: pushed back out
  // of them (not while being carried, or mid-vault)
  peopleClear(S) {
    const people = [...this.runners.map((r) => r.person), ...(this.hooks.people?.() || [])].filter((p) => p && p.root.visible && !p.follow && !p.keyed);
    const blobs = [];
    for (const v of [this.sc, this.ambulance, this.truck, ...this.cranes]) if (v) blobs.push(...this.circles(v));
    const car = (x, z, h) => { const fx = Math.sin(h), fz = Math.cos(h); for (const a of [-1.4, 0, 1.4]) blobs.push([x + fx * a, z + fz * a, 0.95]); };
    if (S.physics) car(S.physics.x, S.physics.z, S.physics.heading);
    for (const c of this.ai.cars) if (!c.parked) car(c.physics.x, c.physics.z, c.physics.heading);
    for (const p of people) {
      for (const [bx, bz, br] of blobs) {
        const dx = p.x - bx, dz = p.z - bz, d = Math.hypot(dx, dz), o = br + 0.3 - d;
        if (o > 0 && d > 1e-4) { p.x += dx / d * o; p.z += dz / d * o; }
      }
    }
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j], dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz), o = 0.55 - d;
      if (o > 0 && d > 1e-4) { a.x += dx / d * o / 2; a.z += dz / d * o / 2; b.x -= dx / d * o / 2; b.z -= dz / d * o / 2; }
    }
  }
  // the wheels: the front ones turned by how sharply it's turning, all of them rolling
  rollWheels(v, dt) {
    const W = v.group.userData.wheels; if (!W) return;
    const px = v.group.position.x, pz = v.group.position.z, h = v.group.rotation.y;
    if (v.lastP) {
      const dx = px - v.lastP[0], dz = pz - v.lastP[1];
      const along = dx * Math.sin(h) + dz * Math.cos(h);
      let dh = h - v.lastP[2]; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      const L = v.wb || 3;
      const want = Math.abs(along) > 1e-3 ? Math.max(-0.6, Math.min(0.6, Math.atan(dh * L / along))) : (v.steerA || 0);
      v.steerA = (v.steerA || 0) + (want - (v.steerA || 0)) * Math.min(1, dt * 6);
      for (const w of W) { if (w.front) w.steer.rotation.y = v.steerA; w.spin.rotation.x += along / w.r; }
    }
    v.lastP = [px, pz, h];
  }
  nudge(v, x, z) {
    if (!x && !z) return;
    if (v.mode === 'line') { const p = this.line[Math.floor(v.i) % this.m]; v.lat += x * p.lx + z * p.lz; this.placeOnLine(v, v.i, v.lat + (v.latBias || 0)); }
    else { v.x += x; v.z += z; v.group.position.x += x; v.group.position.z += z; }
  }

  bump(P, vehicles) {
    if (!P) return;
    if (this.playerLift > 0.3) return;      // (up on the hook or on the truck's bed: above them all, nothing to push it off)
    for (const v of vehicles) {
      const R = v === this.sc ? 2.3 : 2.8;
      const dx = P.x - v.x, dz = P.z - v.z, d = Math.hypot(dx, dz);
      if (d >= R || d < 1e-3) continue;
      const nx = dx / d, nz = dz / d;
      P.x += nx * (R - d); P.z += nz * (R - d);
      const fx = Math.sin(P.heading), fz = Math.cos(P.heading), lx = Math.cos(P.heading), lz = -Math.sin(P.heading);
      const vx = fx * P.vx + lx * P.vy, vz = fz * P.vx + lz * P.vy;
      const vn = vx * nx + vz * nz;
      if (vn < 0) {
        const nvx = vx - 1.4 * vn * nx, nvz = vz - 1.4 * vn * nz;
        P.vx = nvx * fx + nvz * fz; P.vy = nvx * lx + nvz * lz;
        if (-vn > 3) P.crashHit?.({ zone: (nx * fx + nz * fz) < -0.5 ? 'front' : 'left', speed: -vn, along: 0, across: 0 });
      }
    }
  }

  // ---- the red flag: everyone back, then a standing restart in the order they were ----
  restart() {
    this.setPhase('green');
    // (the safety car and the ambulance, back in the pit lane)
    for (const [v, park] of [[this.sc, this.parkSC], [this.ambulance, this.parkAmb]]) {
      v.state = 'parked'; v.mode = 'free'; v.route = []; v.v = 0; v.x = park.x; v.z = park.z; v.heading = Math.PI; this.place(v); v.flash(0, false);
    }
    this.sc.green(false);
    this.ai.restartFromGrid?.();
    this.hooks.toast?.('RESTART: BACK ON THE GRID');
  }

  // ---- your penalties ----
  judge(dt, S) {
    const A = this.ai, st = this.penaltyState, P = S.physics, H = this.hooks;
    if (A.player.finished || A.player.dnf || S.inPits) { st.overtakeOrder = null; return; }
    const pts = A.racing.pts, L = A.racing.length, m = pts.length;
    const prog = (t) => t.lap * L + ((pts[t.near].s - pts[A.startIndex].s + L) % L);
    const me = prog(A.player);
    // overtaking under yellow or the safety car: who you've just passed
    const sector = this.sectorOfPt[A.player.near];
    const flag = this.trackside.posts[sector]?.flag;
    const noPass = this.phase === 'sc' || this.phase === 'vsc' || flag === 'yellow' || flag === 'yellow2';
    const order = new Map();
    for (const c of A.cars) if (!c.dnf && !c.parked && !c.wrecked) order.set(c, prog(c) - me);
    if (st.overtakeOrder && noPass) {
      for (const [c, gap] of order) {
        const was = st.overtakeOrder.get(c);
        if (was != null && was > 0 && was < 40 && gap <= 0 && gap > -40 && Math.abs(c.physics.vx) > 8) {
          H.penalty?.(5, this.phase === 'sc' ? 'OVERTAKING UNDER THE SAFETY CAR' : this.phase === 'vsc' ? 'OVERTAKING UNDER THE VSC' : 'OVERTAKING UNDER YELLOW');
        }
      }
    }
    st.overtakeOrder = order;
    // too fast under the VSC, or through a double yellow
    const plan = A.plan().v[A.player.near] || 30, v = Math.abs(P.vx);
    const limit = this.phase === 'vsc' ? plan * 0.62 * 1.12 : flag === 'yellow2' ? Math.min(plan * 0.7, 26) * 1.12 : Infinity;
    if (v > limit) {
      st.vscOver += dt;
      if (st.vscOver > 2) {
        st.vscOver = 0; st.vscWarn++;
        if (st.vscWarn >= 3) { st.vscWarn = 0; H.penalty?.(5, this.phase === 'vsc' ? 'SPEEDING UNDER THE VSC' : 'SPEEDING UNDER DOUBLE YELLOWS'); }
        else H.toast?.(this.phase === 'vsc' ? 'SLOW DOWN: VSC' : 'SLOW DOWN: DOUBLE YELLOW');
      }
    } else st.vscOver = Math.max(0, st.vscOver - dt);
    // ignoring blue flags: being caught by a car a lap up and not letting it by
    if (A.blueFlagFor()) { st.blueT += dt; st.blueCalm = 0; if (st.blueT > 15) { st.blueT = 0; H.penalty?.(5, 'IGNORING BLUE FLAGS'); } }
    else { st.blueCalm += dt; if (st.blueCalm > 6) st.blueT = 0; }
  }
}
