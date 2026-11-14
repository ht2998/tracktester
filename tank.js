// =====================================================================
// SCORPION 90-INSPIRED LIGHT TANK (Perkins diesel)
// A model of the British light reconnaissance tank, to real proportions:
// hull 4.4 m long and 2.2 m wide, 2.1 m to the turret roof, aluminium
// hull with a long sloping front (engine front right, driver front left),
// a low faceted turret on the back half with a long 90 mm gun, the
// commander's cupola on the left, the gunner's sight on the right, four
// smoke dischargers on each front corner of the turret, a stowage basket
// on the back, and on each side five big rubber-tyred road wheels, the
// drive sprocket at the front and the idler at the back, with no return
// rollers: the top run of the track rests on the road wheels.
// For now it drives with the car's physics; the tracks, wheels and
// sprockets turn with the speed of each side.
// =====================================================================

import * as THREE from 'three';
import { groundAt } from './ground.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 8;

// Where the driver's eye would be if you look out of the commander's hatch
const SIGHT_TURN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const DRIVER_TURN = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, Math.PI, 0, 'YXZ'));   // looking forward and a little down, through the vision block
export const TANK_EYE = new THREE.Vector3(0.42, 2.22, -0.62);

const TRACK_X = 0.88;      // middle of each track from the centre line
const TRACK_W = 0.43;      // track width
const WHEEL_R = 0.27;      // road wheels (about 0.54 m across)
const WHEEL_Y = 0.30;      // road wheel axle height (wheel + track under it)
const WHEEL_Z = [1.12, 0.5, -0.12, -0.74, -1.36];   // five road wheels, front to back
const SPROCKET = { z: 1.78, y: 0.56, r: 0.25 };     // drive sprocket, at the front
const IDLER = { z: -1.9, y: 0.5, r: 0.24 };        // idler, at the back

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------
// Joins shapes into one (fewer things to draw)
function merge(geos) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g0 of geos) {
    const g = g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
    }
    const ix = g.index ? Array.from(g.index.array) : [...Array(p.count).keys()];
    for (const v of ix) idx.push(v + base);
    base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

// A side profile [[z, y], ...] pushed out sideways to a given width
function sideProfile(points, width, xCentre = 0) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 });
  g.translate(0, 0, -width / 2);
  g.rotateY(-Math.PI / 2);       // the profile's forward becomes +z, the push becomes across (x)
  g.translate(xCentre, 0, 0);
  g.computeVertexNormals();
  return g;
}

// A solid from a bottom outline and a top outline (same number of corners,
// [[x, z], ...] going round), at heights y0 and y1: for sloped armour
function slopedPrism(bottom, top, y0, y1) {
  const n = bottom.length;
  const cx = bottom.reduce((a, p) => a + p[0], 0) / n, cz = bottom.reduce((a, p) => a + p[1], 0) / n, cy = (y0 + y1) / 2;
  const tris = [];
  // sides: two triangles per face
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = [bottom[i][0], y0, bottom[i][1]], b = [bottom[j][0], y0, bottom[j][1]];
    const c = [top[j][0], y1, top[j][1]], d = [top[i][0], y1, top[i][1]];
    tris.push([a, b, c], [a, c, d]);
  }
  // top and bottom caps
  const tc = [top.reduce((a, p) => a + p[0], 0) / n, y1, top.reduce((a, p) => a + p[1], 0) / n];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push([tc, [top[i][0], y1, top[i][1]], [top[j][0], y1, top[j][1]]]);
    tris.push([[cx, y0, cz], [bottom[i][0], y0, bottom[i][1]], [bottom[j][0], y0, bottom[j][1]]]);
  }
  // each face flat-shaded and turned to face outwards
  const pos = [], nor = [];
  for (let [a, b, c] of tris) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    const fx = (a[0] + b[0] + c[0]) / 3 - cx, fy = (a[1] + b[1] + c[1]) / 3 - cy, fz = (a[2] + b[2] + c[2]) / 3 - cz;
    if (fx * nx + fy * ny + fz * nz < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
    pos.push(...a, ...b, ...c);
    for (let k = 0; k < 3; k++) nor.push(nx, ny, nz);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? null : v * 0.5)).filter((v) => v !== null), 2));
  return g;
}

const box = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  if (rx) g.rotateX(rx);   // (the same as turning by Euler x, y, z)
  return g.translate(x, y, z);
};
const cyl = (r0, r1, len, seg, x, y, z, axis = 'y') => {
  const g = new THREE.CylinderGeometry(r0, r1, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g.translate(x, y, z);
};

// Faded British green with darker patches, a little dust low down, and
// the odd scuff: painted on a canvas
function paintTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#56603a';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = Math.random();
    g.fillStyle = v < 0.5 ? 'rgba(40,46,26,0.10)' : 'rgba(120,118,80,0.08)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 10, 2 + Math.random() * 10);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------------
// The track's path round the sprocket, road wheels and idler (in the
// side view: [z, y]), and the distance round it
// ---------------------------------------------------------------------
function trackPath() {
  const t = 0.03;   // half the track's thickness
  const pts = [];
  const arc = (c, r, a0, a1, steps) => {
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (a1 - a0) * (k / steps);
      pts.push([c.z + Math.cos(a) * (r + t), c.y + Math.sin(a) * (r + t)]);
    }
  };
  // bottom run, back to front, under the road wheels
  const bottom = WHEEL_Y - WHEEL_R - t;
  pts.push([WHEEL_Z[4] - 0.1, bottom]);
  pts.push([WHEEL_Z[0] + 0.1, bottom]);
  // up and round the front sprocket (from below to over the top)
  arc(SPROCKET, SPROCKET.r, -Math.PI / 2 - 0.35, Math.PI / 2, 12);
  // top run, front to back, resting on the road wheels' tops
  for (const z of WHEEL_Z) pts.push([z, WHEEL_Y + WHEEL_R + t]);
  // round the idler at the back (over the top, down the back, underneath)
  arc(IDLER, IDLER.r, Math.PI / 2, Math.PI * 1.5 + 0.35, 12);
  // lengths along it
  const L = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, L, total: L[pts.length] };
}

function pointOnPath(path, s, out) {
  const { pts, L, total } = path;
  s = ((s % total) + total) % total;
  let i = 0;
  while (L[i + 1] < s) i++;
  const a = pts[i], b = pts[(i + 1) % pts.length];
  const f = (s - L[i]) / Math.max(1e-6, L[i + 1] - L[i]);
  out.z = a[0] + (b[0] - a[0]) * f;
  out.y = a[1] + (b[1] - a[1]) * f;
  out.angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return out;
}

// ---------------------------------------------------------------------
// Build the tank
// ---------------------------------------------------------------------
export function buildScorpion() {
  const group = new THREE.Group();
  const paintMap = paintTexture();
  const MAT = {
    paint: new THREE.MeshStandardMaterial({ color: 0xffffff, map: paintMap, roughness: 0.82, metalness: 0.15 }),
    darkPaint: new THREE.MeshStandardMaterial({ color: 0x3c4428, roughness: 0.85, metalness: 0.1 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x3b3a35, roughness: 0.6, metalness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1c1c1b, roughness: 0.95 }),
    trackSteel: new THREE.MeshStandardMaterial({ color: 0x45433d, roughness: 0.7, metalness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1f2a30, roughness: 0.1, metalness: 0.6 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xd9d4c2, roughness: 0.2, metalness: 0.5, emissive: 0x000000 }),
    canvas: new THREE.MeshStandardMaterial({ color: 0x5d5a3e, roughness: 1 }),
  };
  // The hull sits 0.35 m off the ground (the real Scorpion's clearance);
  // the wheels and tracks stay where they are, under it
  const body = new THREE.Group();
  body.position.y = -0.07;
  group.add(body);
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    body.add(m);
    return m;
  };

  // ---------------- HULL ----------------
  // Lower hull between the tracks (the belly and the nose)
  const lowerHull = sideProfile([
    [-2.1, 0.42], [1.72, 0.42], [2.18, 0.8], [2.18, 0.92], [-2.1, 0.92],
  ], 1.18);
  // Upper hull reaching out over the tracks: long shallow front slope
  // (the glacis), flat roof, rear plate sloping in at the top
  const upperHull = sideProfile([
    [-2.17, 0.88], [2.2, 0.88], [2.22, 0.98], [1.02, 1.37], [-1.96, 1.37], [-2.17, 1.17],
  ], 2.14);
  const hullParts = [lowerHull, upperHull];
  // Track guards (mudguards) over the front of each track, and the hull's side lips
  for (const s of [1, -1]) {
    hullParts.push(box(TRACK_W + 0.05, 0.02, 0.5, s * TRACK_X, 0.88, 2.15, -0.35, 0, 0));
    hullParts.push(box(0.03, 0.06, 4.3, s * 1.075, 0.9, 0.02));
  }
  // Driver's hatch (front left) with its periscopes
  hullParts.push(cyl(0.27, 0.27, 0.05, 20, 0.48, 1.39, 0.78));
  // Engine air louvres on the right front of the deck: slats
  for (let k = 0; k < 8; k++) {
    const z = 1.62 - k * 0.075, y = 1.02 + (2.22 - z) * 0.31 * 0.82;   // following the slope of the glacis
    hullParts.push(box(0.75, 0.02, 0.05, -0.45, y + 0.015, z, -0.31));
  }
  // Rear deck grille (engine is at the front, this is the fighting compartment vent)
  hullParts.push(box(0.6, 0.03, 0.35, 0, 1.385, -1.55));
  // Tow shackles front and back
  for (const s of [1, -1]) {
    hullParts.push(box(0.08, 0.14, 0.12, s * 0.42, 0.62, 2.22));
    hullParts.push(box(0.08, 0.14, 0.12, s * 0.45, 0.72, -2.2));
  }
  // Side stowage bins on the hull's top edges
  hullParts.push(box(0.32, 0.22, 0.95, 0.92, 1.48, -1.25));
  hullParts.push(box(0.32, 0.22, 0.75, -0.92, 1.48, -1.35));
  add(merge(hullParts), MAT.paint);

  // Exhaust: a box with a grille on the right side, front
  add(merge([box(0.12, 0.3, 0.55, -1.12, 1.08, 1.25), box(0.13, 0.05, 0.5, -1.13, 1.27, 1.25)]), MAT.metal);
  // Driver's periscopes (glass) and the hatch hinge
  add(merge([0, 1, 2].map((k) => box(0.11, 0.06, 0.06, 0.38 + k * 0.1, 1.42, 1.02, -0.3))), MAT.glass, false);
  // Headlights with their guards
  for (const s of [1, -1]) {
    add(cyl(0.085, 0.085, 0.09, 16, s * 0.82, 1.06, 2.12, 'z'), MAT.metal);
    add(cyl(0.07, 0.07, 0.02, 16, s * 0.82, 1.06, 2.17, 'z'), MAT.lamp, false);
    add(merge([box(0.02, 0.2, 0.02, s * 0.82 + 0.1, 1.06, 2.2), box(0.02, 0.2, 0.02, s * 0.82 - 0.1, 1.06, 2.2), box(0.22, 0.02, 0.02, s * 0.82, 1.16, 2.2)]), MAT.darkPaint);
  }
  // Jerrycans on the back plate
  add(merge([box(0.17, 0.45, 0.32, 0.55, 0.95, -2.27), box(0.17, 0.45, 0.32, -0.55, 0.95, -2.27)]), MAT.darkPaint);
  // A rolled tarpaulin on the rear deck
  add(cyl(0.11, 0.11, 1.3, 14, 0, 1.48, -1.82, 'x'), MAT.canvas);

  // ---------------- TURRET ----------------
  // Low and faceted, its sides sloping in; set back on the hull
  const tz = -0.32;
  const bottom = [[0.5, 0.66], [0.86, 0.22], [0.86, -0.98], [0.6, -1.24], [-0.6, -1.24], [-0.86, -0.98], [-0.86, 0.22], [-0.5, 0.66]].map(([x, z]) => [x, z + tz]);
  const top = [[0.4, 0.5], [0.72, 0.16], [0.72, -0.9], [0.52, -1.1], [-0.52, -1.1], [-0.72, -0.9], [-0.72, 0.16], [-0.4, 0.5]].map(([x, z]) => [x, z + tz]);
  // The turret turns about the middle of its ring; it sits 10 cm lower
  // than it used to (overall height 2.10 m, to the cupola)
  const RING_Z = tz - 0.25;
  const turretPivot = new THREE.Group();
  turretPivot.position.set(0, -0.1, RING_Z);
  group.add(turretPivot);
  const turret = new THREE.Group();
  turret.position.z = -RING_Z;
  turretPivot.add(turret);
  const tAdd = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    turret.add(m);
    return m;
  };
  const turretParts = [slopedPrism(bottom, top, 1.37, 1.98)];
  // Turret ring collar
  turretParts.push(cyl(0.74, 0.76, 0.05, 32, 0, 1.39, tz - 0.25));
  // Gun mantlet (the armoured block the gun comes out of)
  turretParts.push(box(0.56, 0.44, 0.24, 0, 1.66, tz + 0.72));
  // Commander's cupola on the left, with its hatch
  turretParts.push(cyl(0.31, 0.33, 0.17, 24, 0.4, 2.06, tz - 0.32));
  turretParts.push(cyl(0.27, 0.27, 0.05, 24, 0.4, 2.17, tz - 0.32));
  // Gunner's sight housing on the right
  turretParts.push(box(0.24, 0.2, 0.3, -0.36, 2.07, tz + 0.15));
  // Stowage basket on the turret's back (a frame of bars)
  const basket = [];
  for (const y of [1.6, 1.85]) basket.push(box(1.3, 0.025, 0.025, 0, y, tz - 1.62));
  for (const x of [-0.62, -0.31, 0, 0.31, 0.62]) basket.push(box(0.025, 0.28, 0.025, x, 1.72, tz - 1.62));
  for (const s of [1, -1]) for (const y of [1.6, 1.85]) basket.push(box(0.025, 0.025, 0.4, s * 0.64, y, tz - 1.43));
  turretParts.push(...basket);
  tAdd(merge(turretParts), MAT.paint);
  // A canvas bundle in the basket
  tAdd(box(1.15, 0.22, 0.3, 0, 1.72, tz - 1.48), MAT.canvas);
  // Cupola periscopes, round the cupola
  const scopes = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 1.6 - Math.PI * 0.3;
    scopes.push(box(0.09, 0.07, 0.05, 0.4 + Math.sin(a) * 0.3, 2.09, tz - 0.32 + Math.cos(a) * 0.3, 0, a, 0));
  }
  scopes.push(box(0.16, 0.1, 0.03, -0.36, 2.09, tz + 0.31));   // gunner's sight window
  tAdd(merge(scopes), MAT.glass, false);

  // The 90 mm Cockerill Mk III gun (Scorpion 90): a long, slim barrel,
  // thicker at the base, with a plain muzzle (5.29 m long overall with the
  // gun forward), and the coaxial machine gun beside it
  const gun = new THREE.Group();
  gun.position.set(0, 1.66, tz + 0.82);
  turret.add(gun);
  const gunGeo = merge([
    cyl(0.085, 0.085, 0.35, 20, 0, 0, 0.17, 'z'),      // the base, out of the mantlet
    cyl(0.062, 0.072, 0.6, 20, 0, 0, 0.65, 'z'),       // the thick first part of the barrel
    cyl(0.058, 0.062, 1.88, 20, 0, 0, 1.89, 'z'),      // the barrel
    cyl(0.066, 0.066, 0.12, 20, 0, 0, 2.86, 'z'),      // the muzzle
  ]);
  const barrel = new THREE.Mesh(gunGeo, MAT.darkPaint);
  barrel.castShadow = true;
  gun.add(barrel);
  const coax = new THREE.Mesh(cyl(0.018, 0.018, 0.5, 8, 0.2, -0.04, 0.3, 'z'), MAT.metal);
  gun.add(coax);
  // Muzzle bore (dark)
  const bore = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  bore.position.set(0, 0, 2.925);
  gun.add(bore);

  // The roof machine gun on the commander's cupola: a pintle, the gun and
  // its ammunition box
  tAdd(merge([
    cyl(0.02, 0.02, 0.22, 8, 0.4, 2.29, tz - 0.12),
    cyl(0.017, 0.017, 1.0, 8, 0.4, 2.4, tz + 0.18, 'z'),
    box(0.06, 0.08, 0.34, 0.4, 2.42, tz - 0.08),
    box(0.03, 0.12, 0.22, 0.4, 2.36, tz - 0.22),
  ]), MAT.metal);
  tAdd(box(0.1, 0.1, 0.14, 0.47, 2.38, tz - 0.05), MAT.darkPaint);

  // Smoke dischargers: four tubes on each front corner of the turret,
  // aimed forwards and up
  const smokeTubes = [];
  for (const s of [1, -1]) {
    for (let k = 0; k < 4; k++) {
      const g = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10);
      g.rotateX(Math.PI / 2 - 0.5);
      g.rotateY(s * 0.35);
      g.translate(s * (0.66 + (k % 2) * 0.09), 1.8 + Math.floor(k / 2) * 0.1, tz + 0.32 - (k % 2) * 0.05);
      smokeTubes.push(g);
    }
    smokeTubes.push(box(0.22, 0.04, 0.2, s * 0.7, 1.74, tz + 0.27));   // their mounting bracket
  }
  tAdd(merge(smokeTubes), MAT.darkPaint);
  // Radio aerials at the back corners
  for (const s of [1, -1]) {
    tAdd(cyl(0.035, 0.035, 0.06, 8, s * 0.55, 2.0, tz - 0.95), MAT.metal);
    const whip = new THREE.Mesh(cyl(0.006, 0.004, 2.2, 5, s * 0.55, 3.1, tz - 0.95), MAT.metal);
    whip.castShadow = false;
    turret.add(whip);
  }

  // ---------------- RUNNING GEAR ----------------
  // Road wheels: rubber-tyred, two discs side by side with a gap for the
  // track's guide horns, a hub and bolts. Drawn with instancing.
  const roadWheelGeo = merge([
    cyl(WHEEL_R, WHEEL_R, 0.15, 28, 0.105, 0, 0, 'x'),
    cyl(WHEEL_R, WHEEL_R, 0.15, 28, -0.105, 0, 0, 'x'),
  ]);
  const hubGeo = (() => {
    const parts = [cyl(WHEEL_R * 0.8, WHEEL_R * 0.8, 0.35, 20, 0, 0, 0, 'x'), cyl(0.07, 0.07, 0.4, 12, 0, 0, 0, 'x')];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      parts.push(cyl(0.016, 0.016, 0.39, 6, 0, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 'x'));
    }
    return merge(parts);
  })();
  const wheelCount = WHEEL_Z.length * 2;
  const roadTyres = new THREE.InstancedMesh(roadWheelGeo, MAT.rubber, wheelCount);
  const roadHubs = new THREE.InstancedMesh(hubGeo, MAT.paint, wheelCount);
  // Drive sprockets (toothed) and idlers
  const sprocketGeo = (() => {
    const parts = [cyl(SPROCKET.r * 0.85, SPROCKET.r * 0.85, 0.32, 24, 0, 0, 0, 'x'), cyl(0.08, 0.08, 0.38, 12, 0, 0, 0, 'x')];
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2;
      for (const s of [1, -1]) {
        const tooth = new THREE.BoxGeometry(0.05, 0.07, 0.06);
        tooth.rotateX(a);
        tooth.translate(s * 0.13, Math.cos(a) * SPROCKET.r, Math.sin(a) * SPROCKET.r);
        parts.push(tooth);
      }
    }
    return merge(parts);
  })();
  const idlerGeo = merge([cyl(IDLER.r, IDLER.r, 0.3, 24, 0, 0, 0, 'x'), cyl(0.08, 0.08, 0.36, 12, 0, 0, 0, 'x')]);
  const sprockets = new THREE.InstancedMesh(sprocketGeo, MAT.metal, 2);
  const idlers = new THREE.InstancedMesh(idlerGeo, MAT.paint, 2);
  for (const mesh of [roadTyres, roadHubs, sprockets, idlers]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
  }
  // Suspension arms from the hull to each road wheel
  const arms = [];
  for (const s of [1, -1]) for (const z of WHEEL_Z) arms.push(box(0.1, 0.12, 0.38, s * (TRACK_X - 0.3), WHEEL_Y + 0.12, z + 0.16, -0.5, 0, 0));
  add(merge(arms), MAT.darkPaint);

  // The tracks: steel links with rubber pads, all the way round, each
  // with a guide horn in the middle. Drawn with instancing, sliding round
  // the path as the tank moves.
  const path = trackPath();
  const LINK = 0.135;
  const linkCount = Math.floor(path.total / LINK);
  const linkSpacing = path.total / linkCount;
  const linkGeo = merge([
    box(TRACK_W, 0.035, LINK * 0.88, 0, 0, 0),             // the shoe
    box(TRACK_W * 0.95, 0.02, 0.03, 0, -0.025, 0),         // a grouser bar across it
    box(0.05, 0.07, 0.07, 0, 0.045, 0),                     // the guide horn
  ]);
  const links = new THREE.InstancedMesh(linkGeo, MAT.trackSteel, linkCount * 2);
  links.castShadow = true;
  links.receiveShadow = true;
  links.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(links);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const pt = { z: 0, y: 0, angle: 0 };
  const travel = [0, 0];   // how far each track has moved (left, right)

  function place() {
    // tracks
    let n = 0;
    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? TRACK_X : -TRACK_X;
      for (let k = 0; k < linkCount; k++) {
        pointOnPath(path, k * linkSpacing - travel[side], pt);
        e.set(-pt.angle, 0, 0);
        q.setFromEuler(e);
        m4.compose(pos.set(x, pt.y, pt.z), q, one);
        links.setMatrixAt(n++, m4);
      }
    }
    links.instanceMatrix.needsUpdate = true;
    // wheels: turning with their track
    let w = 0;
    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? TRACK_X : -TRACK_X;
      const turn = travel[side];
      for (const z of WHEEL_Z) {
        e.set(turn / WHEEL_R, 0, 0);
        q.setFromEuler(e);
        m4.compose(pos.set(x, WHEEL_Y, z), q, one);
        roadTyres.setMatrixAt(w, m4);
        roadHubs.setMatrixAt(w, m4);
        w++;
      }
      e.set(turn / SPROCKET.r, 0, 0); q.setFromEuler(e);
      sprockets.setMatrixAt(side, m4.compose(pos.set(x, SPROCKET.y, SPROCKET.z), q, one));
      e.set(turn / IDLER.r, 0, 0); q.setFromEuler(e);
      idlers.setMatrixAt(side, m4.compose(pos.set(x, IDLER.y, IDLER.z), q, one));
    }
    for (const mesh of [roadTyres, roadHubs, sprockets, idlers]) mesh.instanceMatrix.needsUpdate = true;
  }
  place();


  // ---------------- THE DRIVER'S COMPARTMENT (seen only from his seat) ----------------
  // Front left of the hull, the engine through the bulkhead on his right.
  // Cream-painted walls, a vision block in the sloping front plate with its
  // periscope housing, the instrument panel under it, his two steering
  // levers with his gloved hands on them, the gear selector, the pedals
  // under his boots, a fire extinguisher, cables and a dim roof lamp.
  const interior = new THREE.Group();
  interior.visible = false;
  body.add(interior);
  const IMAT = {
    cream: new THREE.MeshStandardMaterial({ color: 0xd8d2bd, roughness: 0.9 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x6d7068, roughness: 0.75, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24261f, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8b8d86, roughness: 0.4, metalness: 0.8 }),
    vinyl: new THREE.MeshStandardMaterial({ color: 0x3c4430, roughness: 0.7 }),
    khaki: new THREE.MeshStandardMaterial({ color: 0x5c5a3e, roughness: 0.95 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.85 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa3231b, roughness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fb5a8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.12, depthWrite: false }),
  };
  const iAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.receiveShadow = false; m.castShadow = false; interior.add(m); return m; };
  // walls, floor and roof (the roof has the hatch well above the driver's head)
  const SLOPE = Math.atan2(0.39, 1.15);                      // the front plate's slope
  const onFront = (z) => 1.32 - (z - 1.0) * (0.39 / 1.15);    // height of the inside of the front plate
  iAdd(merge([
    box(0.92, 0.02, 2.0, 0.53, 0.47, 0.98),                  // floor
    box(0.02, 0.86, 2.0, 0.99, 0.9, 0.98),                   // left wall
    box(0.92, 0.86, 0.02, 0.53, 0.9, 0.0),                   // back wall, behind the seat
    box(0.92, 0.02, 0.42, 0.53, 1.33, 0.21),                 // roof behind the hatch
    box(0.92, 0.02, 0.2, 0.53, 1.33, 0.9),                   // roof ahead of the hatch
    box(0.24, 0.02, 0.38, 0.85, 1.33, 0.61), box(0.24, 0.02, 0.38, 0.17, 1.33, 0.61),
    box(0.36, 0.14, 0.02, 0.48, 1.4, 0.42), box(0.36, 0.14, 0.02, 0.48, 1.4, 0.8),   // hatch well
    box(0.02, 0.14, 0.38, 0.3, 1.4, 0.61), box(0.02, 0.14, 0.38, 0.66, 1.4, 0.61),
  ]), IMAT.cream);
  iAdd(box(0.36, 0.03, 0.38, 0.48, 1.47, 0.61), IMAT.grey);   // the hatch, shut, from underneath
  iAdd(cyl(0.025, 0.025, 0.22, 8, 0.48, 1.44, 0.61, 'x'), IMAT.steel);   // its handle
  // the sloping front plate, with the vision block cut out of it
  const plate = (x0, x1, z0, z1) => {
    const zc = (z0 + z1) / 2, len = (z1 - z0) / Math.cos(SLOPE);
    const g = new THREE.BoxGeometry(x1 - x0, 0.02, len);
    g.rotateX(SLOPE);
    return g.translate((x0 + x1) / 2, onFront(zc), zc);
  };
  iAdd(merge([
    plate(0.07, 0.99, 1.0, 1.06),          // above the window
    plate(0.07, 0.99, 1.4, 2.1),           // below it, down to the nose
    plate(0.07, 0.22, 1.06, 1.4),          // beside it
    plate(0.74, 0.99, 1.06, 1.4),
  ]), IMAT.cream);
  iAdd(plate(0.22, 0.74, 1.06, 1.4), IMAT.glass);              // the vision block's glass
  // the periscope housing: a dark frame round the window, standing off the plate
  iAdd(merge([
    plate(0.19, 0.77, 1.02, 1.06), plate(0.19, 0.77, 1.4, 1.44),
    plate(0.19, 0.22, 1.06, 1.4), plate(0.74, 0.77, 1.06, 1.4),
  ].map((g) => g.translate(0, -0.03, 0))), IMAT.dark);
  // the engine bulkhead on his right: grey, with insulation and hot pipes
  iAdd(box(0.02, 0.86, 2.0, 0.07, 0.9, 0.98), IMAT.grey);
  iAdd(merge([
    cyl(0.03, 0.03, 1.6, 10, 0.1, 1.15, 1.0, 'z'), cyl(0.022, 0.022, 1.6, 10, 0.1, 1.05, 1.0, 'z'),
    cyl(0.015, 0.015, 1.8, 8, 0.97, 1.25, 0.95, 'z'), cyl(0.015, 0.015, 1.8, 8, 0.97, 1.2, 0.95, 'z'),   // cables on the left wall
  ]), IMAT.steel);
  iAdd(box(0.04, 0.4, 0.7, 0.1, 0.8, 1.0), IMAT.dark);          // a box of electrics on the bulkhead
  iAdd(cyl(0.06, 0.06, 0.38, 14, 0.93, 0.8, 0.25), IMAT.red);   // fire extinguisher on the left wall
  // instrument panel, under the window, with live dials (a small screen)
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 256; panelCanvas.height = 96;
  const panelTex = new THREE.CanvasTexture(panelCanvas);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  const panel = iAdd(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: panelTex }));
  panel.position.set(0.48, 1.06, 1.36);
  panel.rotation.set(-0.45, Math.PI, 0);
  iAdd(box(0.56, 0.24, 0.06, 0.48, 1.055, 1.39, -0.45, 0, 0), IMAT.dark);
  // the seat (mostly out of sight below and behind)
  iAdd(merge([box(0.44, 0.08, 0.42, 0.48, 0.72, 0.4), box(0.44, 0.5, 0.08, 0.48, 1.0, 0.14, -0.2, 0, 0)]), IMAT.vinyl);
  // pedals and his boots on them, his legs stretched forward
  iAdd(merge([box(0.08, 0.02, 0.14, 0.38, 0.62, 1.62, -0.6, 0, 0), box(0.1, 0.02, 0.16, 0.6, 0.6, 1.6, -0.6, 0, 0)]), IMAT.steel);
  for (const x of [0.38, 0.6]) {
    iAdd(cyl(0.07, 0.065, 0.62, 10, x, 0.72, 0.9, 'z'), IMAT.khaki);   // thigh
    iAdd(cyl(0.055, 0.05, 0.5, 10, x, 0.66, 1.38, 'z'), IMAT.khaki);   // shin
    iAdd(box(0.1, 0.1, 0.24, x, 0.66, 1.66), IMAT.glove);              // boot
  }
  // the gear selector, by his right hand
  iAdd(merge([box(0.08, 0.04, 0.16, 0.2, 0.86, 0.72), cyl(0.012, 0.012, 0.2, 8, 0.2, 0.96, 0.72)]), IMAT.dark);
  iAdd(new THREE.SphereGeometry(0.03, 10, 8).translate(0.2, 1.07, 0.72), IMAT.dark);
  // the two steering levers: pull one back to slow that track and turn
  // that way, both to brake. His hands are on them.
  const levers = [0.22, 0.74].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.55, 1.0);
    interior.add(pivot);
    const rod = new THREE.Mesh(merge([cyl(0.016, 0.016, 0.56, 8, 0, 0.28, 0), box(0.06, 0.05, 0.06, 0, 0.02, 0)]), IMAT.steel);
    rod.rotation.x = -0.35;               // leaning back towards him
    pivot.add(rod);
    const grip = new THREE.Mesh(cyl(0.028, 0.028, 0.13, 10, 0, 0.6, 0), IMAT.dark);
    rod.add(grip);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10).scale(1, 1.3, 1.1).translate(0, 0.6, -0.02), IMAT.glove);
    rod.add(hand);
    return { pivot, rod };
  });
  // his forearms, from the levers back towards his elbows
  const forearms = levers.map(() => { const m = iAdd(cyl(0.04, 0.034, 1, 10, 0, 0, 0), IMAT.khaki); return m; });
  const handWorld = new THREE.Vector3(), elbow = new THREE.Vector3(), mid = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  // the dim roof lamp (and the light from the vision block)
  const lamp = new THREE.PointLight(0xffe2b0, 0, 2.2, 2);
  lamp.position.set(0.5, 1.25, 0.35);
  interior.add(lamp);
  let panelClock = 0;
  function updateInterior(dt, steer, brake, kmh, rpm, gear) {
    // levers pulled back by the steering and the brake
    const pull = [Math.min(1, Math.max(0, -steer) + brake * 0.8), Math.min(1, Math.max(0, steer) + brake * 0.8)];
    levers.forEach((l, i) => {
      l.pivot.rotation.x += (-0.45 * pull[i] - l.pivot.rotation.x) * Math.min(1, dt / 0.08);
      // forearm from the hand back to the elbow
      l.rod.updateMatrixWorld(true);
      interior.updateMatrixWorld(true);
      handWorld.set(0, 0.56, -0.05);
      l.rod.localToWorld(handWorld);
      interior.worldToLocal(handWorld);
      elbow.set(l.pivot.position.x + (i === 0 ? -0.08 : 0.08), 0.88, 0.5);
      mid.addVectors(handWorld, elbow).multiplyScalar(0.5);
      const f = forearms[i];
      f.position.copy(mid);
      f.scale.set(1, handWorld.distanceTo(elbow), 1);
      f.quaternion.setFromUnitVectors(up, elbow.clone().sub(handWorld).normalize());
    });
    // the instrument panel, ten times a second
    panelClock -= dt;
    if (panelClock > 0) return;
    panelClock = 0.1;
    const g = panelCanvas.getContext('2d');
    g.fillStyle = '#1b1d17'; g.fillRect(0, 0, 256, 96);
    const dial = (cx, value, max, label) => {
      g.strokeStyle = '#5b5f52'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, 50, 34, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#9da38c'; g.font = '11px sans-serif'; g.textAlign = 'center';
      g.fillText(label, cx, 88);
      const a = Math.PI * (0.75 + 1.5 * Math.min(1, value / max));
      g.strokeStyle = '#eee6c8'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx, 50); g.lineTo(cx + Math.cos(a) * 28, 50 + Math.sin(a) * 28); g.stroke();
    };
    dial(48, kmh, 80, 'km/h');
    dial(208, rpm, 3000, 'rpm');
    g.fillStyle = '#e0d9b8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
    g.fillText(gear, 128, 60);
    g.fillStyle = rpm > 2650 ? '#e0322b' : '#3a2a20';
    g.beginPath(); g.arc(128, 20, 6, 0, Math.PI * 2); g.fill();
    panelTex.needsUpdate = true;
  }

  group.visible = false;
  // where the exhaust pipe comes out (right side, front), for the smoke
  const exhaust = new THREE.Object3D();
  exhaust.position.set(-1.19, 1.0, 1.25);
  group.add(exhaust);
  let turretYaw = 0, gunPitch = 0;
  let recoil = 0;          // how far back the barrel has slid after a shot (m)
  const barrelHome = barrel.position.z;
  const muzzleLocal = new THREE.Vector3(0, 0, 2.95);
  return {
    group, turret, gun, exhaust,
    // Where the end of the barrel is and which way it points (world)
    muzzle(posOut, dirOut) {
      group.updateMatrixWorld();
      gun.localToWorld(posOut.copy(muzzleLocal));
      gun.getWorldDirection(dirOut);
      return posOut;
    },
    // The gunner's sight: just right of the gun and above it, looking along
    // it (so it turns and lifts with the gun). Writes a camera's position
    // and turn.
    sight(posOut, quatOut) {
      group.updateMatrixWorld();
      gun.localToWorld(posOut.set(-0.34, 0.3, 0.1));
      gun.getWorldQuaternion(quatOut);
      return quatOut.multiply(SIGHT_TURN);      // (a camera looks along -z; the gun points along +z)
    },
    // The driver's periscope: in the hatch at the front left of the hull,
    // looking ahead and a little down over the front. Writes a camera's
    // position and turn (it tips and rolls with the hull).
    driverView(posOut, quatOut) {
      group.updateMatrixWorld();
      body.localToWorld(posOut.set(0.48, 1.29, 0.62));        // his head up in the hatch well
      group.getWorldQuaternion(quatOut);
      return quatOut.multiply(DRIVER_TURN);
    },
    // show the inside of the driver's compartment (only from his seat), and
    // move his levers and dials
    setInterior(on, dt = 0, c = {}) {
      interior.visible = on;
      lamp.intensity = on ? 0.6 : 0;
      if (on) updateInterior(dt, c.steer || 0, c.brake || 0, c.kmh || 0, c.rpm || 720, c.gear || 'N');
    },
    // A shot: the barrel slams back and runs out again
    fired() { recoil = 0.28; },
    // which way the turret is facing, relative to the hull (radians, + = left)
    get turretYaw() { return turretYaw; },
    // Aim the turret at a point in the world: it turns (at about 40
    // degrees a second, like the real one's powered traverse) until the
    // gun faces it, and the gun lifts or dips towards it (-10 to +35 deg)
    aimAt(target, dt) {
      if (!target) return;
      // The turret swings round towards the target and stops when the gun
      // faces it; the gun lifts or dips until its line passes through the
      // target, or until it reaches its stops (+35 / -10 degrees)
      group.updateMatrixWorld();
      const local = group.worldToLocal(target.clone());
      const dx = local.x - turretPivot.position.x, dz = local.z - turretPivot.position.z;
      const want = Math.atan2(dx, dz);
      let diff = want - turretYaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const step = 0.7 * dt;
      turretYaw += Math.abs(diff) < 0.0015 ? diff : Math.max(-step, Math.min(step, diff));
      turretPivot.rotation.y = turretYaw;
      // (measured from the gun's own pivot, so its line really meets the target)
      group.updateMatrixWorld();
      const pivot = group.worldToLocal(gun.getWorldPosition(new THREE.Vector3()));
      const dist = Math.max(0.5, Math.hypot(local.x - pivot.x, local.z - pivot.z));
      const wantPitch = Math.max(-0.17, Math.min(0.61, Math.atan2(local.y - pivot.y, dist)));
      const pd = wantPitch - gunPitch;
      gunPitch += Math.abs(pd) < 0.001 ? pd : Math.max(-0.4 * dt, Math.min(0.4 * dt, pd));
      gun.rotation.x = -gunPitch;
    },
    // speedLeft / speedRight: how fast each side of the tank is moving over
    // the ground (m/s), so each track runs at its own speed when turning
    update(dt, speedLeft, speedRight) {
      travel[0] += speedLeft * dt;
      travel[1] += speedRight * dt;
      place();
      // the barrel running back out after recoil (about half a second)
      recoil = Math.max(0, recoil - dt * 0.55);
      barrel.position.z = barrelHome - recoil;
    },
    // the headlights glow when the car's lights are on
    setLights(on) { MAT.lamp.emissive.setHex(on ? 0xfff1d6 : 0x000000); MAT.lamp.emissiveIntensity = on ? 1.5 : 0; },
  };
}

// =====================================================================
// HOW THE TANK DRIVES: about 8.7 tonnes, a 200 hp turbo-diesel (about
// 149 kW), top speed about 72 km/h. It's slow to get going and takes a long way
// to stop. It steers by slowing one track: it can spin on the spot when
// stopped, turns less sharply the faster it goes, and steering scrubs off
// speed. The tracks barely slide sideways and grip well on grass and
// gravel. Hills slow it going up and speed it up going down.
// =====================================================================
export class TankPhysics {
  constructor() {
    this.mass = 8720;            // Scorpion 90 (kg)
    this.power = 149000;         // W: the Perkins 6-cylinder turbo-diesel, 200 hp at 2,700 rpm
    this.maxPull = 42000;        // N: the most the tracks can push before they slip
    this.topSpeed = 72.5 / 3.6;  // m/s
    this.reverseSpeed = 15 / 3.6;
    this.x = 0; this.z = 0; this.heading = 0;
    this.vx = 0; this.vy = 0; this.yawRate = 0;
    this.y = 0; this.pitch = 0; this.roll = 0;
    this.rpm = 720; this.load = 0; this.gearLabel = 'N';   // engine speed starts at idle, in neutral
    // rocking from the gun's recoil: the hull tips away from the shot on its
    // suspension and settles (pitch: + = nose down; roll: + = left side up)
    this.rock = { pitch: 0, roll: 0, vPitch: 0, vRoll: 0 };
  }

  // The 90 mm fires with the turret at turretYaw (relative to the hull):
  // the hull is kicked back, away from the gun, and rocks on its springs,
  // and the whole tank is shoved a little the other way
  recoilKick(turretYaw) {
    const kick = 0.75;     // rad/s: tips about 3 degrees at the peak
    this.rock.vPitch -= kick * Math.cos(turretYaw);   // gun forward: the nose lifts
    this.rock.vRoll += kick * Math.sin(turretYaw);    // gun to the left: the left side lifts
    // the shove: about 0.3 m/s back along the gun line
    const shove = 0.3;
    this.vx -= shove * Math.cos(turretYaw);
    this.vy -= shove * Math.sin(turretYaw);
  }

  place(x, z, heading) {
    this.x = x; this.z = z; this.heading = heading;
    this.vx = this.vy = this.yawRate = 0;
  }

  // controls: { throttle, brake, steer (-1 right .. 1 left), handbrake }
  // ground: surface grip at a point (1 = dry tarmac), from the game
  update(dt, c, surfaceGrip = () => 1) {
    const G = 9.81, m = this.mass;
    const throttle = c.throttle || 0, brake = c.brake || 0, steer = c.steer || 0;
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    // the slope along and across the tank (front/back 2 m apart, sides 1.8 m)
    const hF = groundAt(this.x + fx * 1.6, this.z + fz * 1.6), hB = groundAt(this.x - fx * 1.6, this.z - fz * 1.6);
    const hL = groundAt(this.x + fz * 0.9, this.z - fx * 0.9), hR = groundAt(this.x - fz * 0.9, this.z + fx * 0.9);
    const slopeF = (hF - hB) / 3.2, slopeL = (hL - hR) / 1.8;
    // soft ground: a little more drag, slightly less pull (tracks hardly mind)
    const grip = Math.min(1, 0.75 + 0.25 * surfaceGrip(this.x, this.z));
    const roll = 0.035 + 0.03 * (1 - grip);              // rolling resistance (tracks are draggy)
    const v = this.vx;
    let force = 0;
    // forwards: power-limited pull, governed at the top speed
    if (throttle > 0 && v < this.topSpeed) force += throttle * Math.min(this.maxPull * grip, this.power / Math.max(1, Math.abs(v)));
    // the brake pedal: brakes while moving forwards; held when stopped, it reverses slowly
    if (brake > 0) {
      if (v > 0.3) force -= brake * 0.45 * m * G * grip;
      else if (v > -this.reverseSpeed) force -= brake * 0.45 * this.maxPull;
    }
    if (c.handbrake) force -= Math.sign(v) * Math.min(Math.abs(v) * m / dt, 0.7 * m * G);
    // resistance: the tracks, the air, gravity on a slope, and scrubbing round a turn
    const scrub = Math.abs(this.yawRate) * 0.25 * m * G * grip * Math.min(1, Math.abs(v) / 2);
    const resist = (roll * m * G + scrub) * Math.sign(v) + 1.2 * v * Math.abs(v);
    let a = (force - resist) / m - G * slopeF / Math.sqrt(1 + slopeF * slopeF);
    // (don't let resistance alone push it backwards through zero)
    if (throttle === 0 && brake === 0 && Math.abs(v) < 0.2 && Math.abs(slopeF) < 0.1) { this.vx = 0; a = 0; }
    this.vx += a * dt;
    if (this.vx > this.topSpeed) this.vx = this.topSpeed;
    // Steering: one track slows. On the spot it pivots at about 50 degrees
    // a second; at speed the turn is limited by how hard the tracks can
    // grip sideways (about half a g)
    const pivot = 0.9 * (Math.abs(this.vx) < 0.5 ? 1 : 1 - Math.min(0.5, Math.abs(this.vx) / 30));
    const yawMax = Math.min(pivot, (0.5 * G * grip) / Math.max(0.5, Math.abs(this.vx)));
    const target = steer * yawMax * (this.vx < -0.2 ? -1 : 1) * (Math.abs(this.vx) < 0.5 && throttle === 0 && brake === 0 && Math.abs(steer) > 0 ? 1 : 1);
    this.yawRate += (target - this.yawRate) * Math.min(1, dt / 0.35);
    // Sideways: the tracks hardly slide; any sideways speed dies away fast
    // (a slope across the tank still nudges it a little)
    this.vy -= this.vx * this.yawRate * dt;
    this.vy += -G * slopeL * 0.15 * dt;
    this.vy *= Math.exp(-dt * 9 * grip);
    // move
    this.heading += this.yawRate * dt;
    const sn = Math.sin(this.heading), cs = Math.cos(this.heading);
    this.x += (sn * this.vx + cs * this.vy) * dt;
    this.z += (cs * this.vx - sn * this.vy) * dt;
    // the recoil rock: a stiff, well-damped spring (about 1.6 wobbles a second)
    {
      const R = this.rock, w = 2 * Math.PI * 1.6, zeta = 0.28;
      R.vPitch += (-w * w * R.pitch - 2 * zeta * w * R.vPitch) * dt;
      R.vRoll += (-w * w * R.roll - 2 * zeta * w * R.vRoll) * dt;
      R.pitch += R.vPitch * dt;
      R.roll += R.vRoll * dt;
    }
    // sit on the ground, tilted with it (heavy: no bounce)
    this.y = groundAt(this.x, this.z);
    this.pitch += (-Math.atan(slopeF) - this.pitch) * Math.min(1, dt / 0.15);
    this.roll += (Math.atan(slopeL) - this.roll) * Math.min(1, dt / 0.15);
    // a rough engine speed, for the sound and the dials
    // engine speed: the seven-speed gearbox keeps the diesel between about
    // 1,800 and 2,700 rpm when it's pulling (idle 720)
    const frac = Math.min(1, Math.abs(this.vx) / this.topSpeed);
    const gearPos = frac * 7 - Math.min(6, Math.floor(frac * 7));        // where it is within the current gear (top gear runs up to the governor)
    const pulling = Math.abs(this.vx) > 0.5 ? 1850 + 850 * gearPos : 720 + 1400 * throttle;
    if (!Number.isFinite(this.rpm)) this.rpm = 720;
    this.rpm += ((throttle > 0.05 || Math.abs(this.vx) > 0.5 ? pulling : 720) - this.rpm) * Math.min(1, dt / 0.25);
    this.load = throttle;
    // which of the seven gears it's in (the TN15 gearbox changes by itself)
    const sp = this.vx;
    this.gearLabel = sp < -0.3 ? 'R' : Math.abs(sp) < 0.3 && throttle < 0.05 ? 'N' : String(Math.min(7, Math.floor(frac * 7) + 1));
  }
}
