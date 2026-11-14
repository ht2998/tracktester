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
export const BUILD = 12;

// Where the driver's eye would be if you look out of the commander's hatch
const SIGHT_TURN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const DRIVER_TURN = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25, Math.PI, 0, 'YXZ'));   // looking forward and a little down: the periscope's window, his levers below it
const CREW_TURN = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, Math.PI, 0, 'YXZ'));   // the crew view: looking forward over the breech
const PERISCOPE_TURN = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.07, Math.PI, 0, 'YXZ'));  // the periscope's head, looking out over the front
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
  const hullParts = [upperHull];
  // Track guards (mudguards) over the front of each track, and the hull's side lips
  for (const s of [1, -1]) {
    hullParts.push(box(TRACK_W + 0.05, 0.02, 0.5, s * TRACK_X, 0.88, 2.15, -0.35, 0, 0));
    hullParts.push(box(0.03, 0.06, 4.3, s * 1.075, 0.9, 0.02));
  }
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
  // The belly and the driver's hatch on their own: from the driver's seat
  // they'd cut through his compartment, so they're hidden while he's in it
  const lowerHullMesh = add(lowerHull, MAT.paint);
  const driverHatch = add(cyl(0.27, 0.27, 0.05, 20, 0.48, 1.39, 0.78), MAT.paint);   // driver's hatch (front left)

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
  // Worn cream paint with rivet rows and grime, a vision block in the
  // sloping front plate with a padded brow rest and a bolted periscope
  // frame, the instrument panel under it, a switch box and intercom on the
  // left wall, the engine bulkhead on the right with pipes and electrics,
  // and in front of him his two steering levers, his gloved hands wrapped
  // round their grips, his arms coming from his shoulders and pulling them
  // back as he steers and brakes.
  const interior = new THREE.Group();
  interior.visible = false;
  body.add(interior);
  // worn paint, painted on a canvas: speckles, grime collecting low down,
  // scuffs, rivets in rows (also used as a bump map, so it catches the light)
  const wornTexture = (base, grime, rivets) => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    for (let i = 0; i < 26; i++) {      // grime streaks and smudges
      const x = Math.random() * 256, y = Math.random() * 256;
      const r = g.createRadialGradient(x, y, 0, x, y, 8 + Math.random() * 26);
      r.addColorStop(0, grime); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(x - 40, y - 40, 80, 80);
    }
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1;
    for (let i = 0; i < 18; i++) {      // scuffs through to bare metal
      const x = Math.random() * 256, y = Math.random() * 256;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 8); g.stroke();
    }
    if (rivets) {                       // a seam with a row of rivets each side
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 126, 256, 3);
      for (let x = 8; x < 256; x += 21) for (const y of [116, 140]) {
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + 1, y + 1, 3.2, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const creamTex = wornTexture('#d6cfb6', 'rgba(70,60,40,0.22)', true);
  const greyTex = wornTexture('#6f7268', 'rgba(20,18,14,0.3)', false);
  const IMAT = {
    cream: new THREE.MeshStandardMaterial({ map: creamTex, bumpMap: creamTex, bumpScale: 1.5, roughness: 0.85 }),
    grey: new THREE.MeshStandardMaterial({ map: greyTex, bumpMap: greyTex, bumpScale: 1, roughness: 0.7, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24261f, roughness: 0.75 }),
    black: new THREE.MeshStandardMaterial({ color: 0x121311, roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9a9c95, roughness: 0.35, metalness: 0.85 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.4, metalness: 0.8 }),
    vinyl: new THREE.MeshStandardMaterial({ color: 0x3a4230, roughness: 0.65 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1a19, roughness: 0.95 }),
    khaki: new THREE.MeshStandardMaterial({ color: 0x5f5d40, roughness: 0.95 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x2b2520, roughness: 0.8 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa3231b, roughness: 0.45, metalness: 0.1 }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffe9c0, emissive: 0xffd89a, emissiveIntensity: 1.2 }),
    lampGreen: new THREE.MeshStandardMaterial({ color: 0x1d3a1d, emissive: 0x2bd14a, emissiveIntensity: 0 }),
    lampRed: new THREE.MeshStandardMaterial({ color: 0x3a1a1a, emissive: 0xff3322, emissiveIntensity: 0 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fb5a8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.1, depthWrite: false }),
  };
  // UVs laid out by size (in metres, 2 texture tiles a metre), so the
  // paint and rivets come out the same size on every wall
  const metreUV = (geo, perMetre = 2) => {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ax >= ay && ax >= az) uv.setXY(i, z * perMetre, y * perMetre);
      else if (ay >= az) uv.setXY(i, x * perMetre, z * perMetre);
      else uv.setXY(i, x * perMetre, y * perMetre);
    }
    return geo;
  };
  const iAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.receiveShadow = false; m.castShadow = false; interior.add(m); return m; };
  // walls, floor and roof (the roof has the hatch well above the driver's head)
  const SLOPE = Math.atan2(0.39, 1.15);                      // the front plate's slope
  const onFront = (z) => 1.32 - (z - 1.0) * (0.39 / 1.15);    // height of the inside of the front plate
  iAdd(metreUV(merge([
    // (the bottom of the compartment is only as wide as the hull between
    // the tracks; above the track it widens out over a shelf)
    box(0.57, 0.02, 2.0, 0.355, 0.58, 0.98),                 // floor
    box(0.02, 0.3, 2.0, 0.64, 0.73, 0.98),                   // lower left wall, beside the track
    box(0.35, 0.02, 2.0, 0.815, 0.88, 0.98),                 // the shelf over the track
    box(0.02, 0.45, 2.0, 0.99, 1.105, 0.98),                 // left wall above it
    box(0.92, 0.4, 0.02, 0.53, 0.77, 1.98),                  // the nose, down at his feet
    box(0.92, 0.76, 0.02, 0.53, 0.95, 0.0),                  // back wall, behind the seat
    box(0.92, 0.02, 0.42, 0.53, 1.33, 0.21),                 // roof behind the hatch
    box(0.92, 0.02, 0.2, 0.53, 1.33, 0.9),                   // roof ahead of the hatch
    box(0.24, 0.02, 0.38, 0.85, 1.33, 0.61), box(0.24, 0.02, 0.38, 0.17, 1.33, 0.61),
    box(0.36, 0.14, 0.02, 0.48, 1.4, 0.42), box(0.36, 0.14, 0.02, 0.48, 1.4, 0.8),   // hatch well
    box(0.02, 0.14, 0.38, 0.3, 1.4, 0.61), box(0.02, 0.14, 0.38, 0.66, 1.4, 0.61),
  ])), IMAT.cream);
  // the hatch, shut, from underneath: its locking handle and hinge
  iAdd(metreUV(box(0.36, 0.03, 0.38, 0.48, 1.47, 0.61)), IMAT.grey);
  iAdd(merge([
    cyl(0.018, 0.018, 0.24, 8, 0.48, 1.42, 0.61, 'x'),
    box(0.02, 0.04, 0.02, 0.38, 1.44, 0.61), box(0.02, 0.04, 0.02, 0.58, 1.44, 0.61),
    cyl(0.025, 0.025, 0.3, 10, 0.48, 1.44, 0.44, 'x'),
  ]), IMAT.steel);
  // the sloping front plate, with the vision block cut out of it
  const plate = (x0, x1, z0, z1) => {
    const zc = (z0 + z1) / 2, len = (z1 - z0) / Math.cos(SLOPE);
    const g = new THREE.BoxGeometry(x1 - x0, 0.02, len);
    g.rotateX(SLOPE);
    return g.translate((x0 + x1) / 2, onFront(zc), zc);
  };
  iAdd(metreUV(merge([
    plate(0.07, 0.99, 1.0, 1.06),          // above the window
    plate(0.07, 0.99, 1.4, 2.1),           // below it, down to the nose
    plate(0.07, 0.22, 1.06, 1.4),          // beside it
    plate(0.74, 0.99, 1.06, 1.4),
  ])), IMAT.cream);
  iAdd(metreUV(plate(0.22, 0.74, 1.06, 1.4)), IMAT.cream);
  // THE PERISCOPE: its body hangs down from the roof in front of his face,
  // with a wide window he looks into; the window shows what the periscope's
  // head (up on the roof) sees outside (drawn by the game each frame)
  iAdd(merge([
    box(0.58, 0.2, 0.11, 0.42, 1.23, 0.955),                  // the body
    box(0.5, 0.06, 0.12, 0.42, 1.36, 0.98),                   // up through the roof
  ]), IMAT.dark);
  iAdd(merge([                                                // a lip round the window
    box(0.54, 0.018, 0.03, 0.42, 1.312, 0.89), box(0.54, 0.018, 0.03, 0.42, 1.138, 0.89),
    box(0.02, 0.19, 0.03, 0.159, 1.225, 0.89), box(0.02, 0.19, 0.03, 0.681, 1.225, 0.89),
  ]), IMAT.black);
  iAdd(merge([[0.18, 1.3], [0.66, 1.3], [0.18, 1.15], [0.66, 1.15]].map(([x, y]) => cyl(0.007, 0.007, 0.01, 6, x, y, 0.873, 'z'))), IMAT.steel);
  const periscopeScreen = iAdd(new THREE.PlaneGeometry(0.5, 0.16).rotateY(Math.PI).translate(0.42, 1.225, 0.898), new THREE.MeshBasicMaterial({ color: 0x0b0c0a }));
  {
    const pad = new THREE.CapsuleGeometry(0.018, 0.44, 6, 12);      // the rubber brow pad on top
    pad.rotateZ(Math.PI / 2);
    pad.translate(0.42, 1.3, 0.875);
    iAdd(pad, IMAT.rubber);
  }
  // the engine bulkhead on his right: grey, with hot pipes, an electrics
  // box and cables; cables and a switch box on the left wall
  iAdd(metreUV(box(0.02, 0.76, 2.0, 0.07, 0.95, 0.98)), IMAT.grey);
  iAdd(merge([
    cyl(0.03, 0.03, 1.6, 12, 0.11, 1.27, 1.0, 'z'), cyl(0.022, 0.022, 1.6, 12, 0.11, 1.19, 1.0, 'z'),
    cyl(0.04, 0.04, 0.03, 12, 0.11, 1.27, 0.5, 'z'), cyl(0.04, 0.04, 0.03, 12, 0.11, 1.27, 1.4, 'z'),   // pipe clamps
    cyl(0.012, 0.012, 1.8, 8, 0.97, 1.25, 0.95, 'z'), cyl(0.012, 0.012, 1.8, 8, 0.97, 1.21, 0.95, 'z'),
  ]), IMAT.steel);
  iAdd(metreUV(box(0.05, 0.3, 0.4, 0.1, 0.8, 1.55)), IMAT.grey);               // the electrics box, down by his right foot
  iAdd(merge([0, 1, 2].map((k) => cyl(0.016, 0.016, 0.03, 10, 0.13, 0.88 - k * 0.08, 1.4, 'x'))), IMAT.black);   // its plugs
  // the switch box on the left wall: toggle switches and warning lamps
  iAdd(box(0.06, 0.16, 0.3, 0.95, 1.1, 0.95), IMAT.dark);
  iAdd(merge([0, 1, 2, 3].map((k) => cyl(0.005, 0.005, 0.04, 6, 0.91, 1.13, 0.85 + k * 0.06, 'x').rotateZ(0))), IMAT.steel);
  const warnGreen = iAdd(new THREE.SphereGeometry(0.012, 10, 8).translate(0.92, 1.06, 0.88), IMAT.lampGreen);
  const warnRed = iAdd(new THREE.SphereGeometry(0.012, 10, 8).translate(0.92, 1.06, 0.98), IMAT.lampRed);
  // the intercom box with its coiled lead hanging down
  iAdd(box(0.06, 0.12, 0.14, 0.95, 1.18, 0.42), IMAT.dark);
  {
    const pts = [];
    for (let k = 0; k <= 120; k++) {
      const t = k / 120, a = t * Math.PI * 2 * 12;
      pts.push(new THREE.Vector3(0.93 + Math.cos(a) * 0.015, 1.12 - t * 0.2, 0.42 + Math.sin(a) * 0.015 + t * 0.06));
    }
    iAdd(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.004, 5), IMAT.black);
  }
  // fire extinguisher on the left wall, strapped on
  iAdd(merge([cyl(0.055, 0.055, 0.26, 16, 0.92, 1.02, 0.22), new THREE.SphereGeometry(0.055, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0.92, 1.15, 0.22)]), IMAT.red);
  iAdd(merge([cyl(0.014, 0.014, 0.05, 8, 0.92, 1.22, 0.22), box(0.02, 0.02, 0.07, 0.92, 1.25, 0.25)]), IMAT.black);
  iAdd(merge([cyl(0.059, 0.059, 0.022, 16, 0.92, 0.95, 0.22), cyl(0.059, 0.059, 0.022, 16, 0.92, 1.1, 0.22)]), IMAT.dark);
  // the roof lamp in its little wire cage
  iAdd(new THREE.SphereGeometry(0.022, 12, 8).translate(0.75, 1.3, 0.3), IMAT.bulb);
  iAdd(merge([cyl(0.04, 0.04, 0.012, 14, 0.75, 1.318, 0.3), cyl(0.032, 0.032, 0.004, 14, 0.75, 1.28, 0.3)]), IMAT.steel);
  // instrument panel, under the window, with live dials (a small screen)
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 512; panelCanvas.height = 192;
  const panelTex = new THREE.CanvasTexture(panelCanvas);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  const panel = iAdd(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: panelTex }));
  panel.position.set(0.48, 1.0, 1.325);
  panel.rotation.set(-0.45, Math.PI, 0);
  iAdd(box(0.56, 0.24, 0.06, 0.48, 0.995, 1.36, -0.45, 0, 0), IMAT.dark);
  iAdd(merge([[-0.26, 0.1], [0.26, 0.1], [-0.26, -0.1], [0.26, -0.1]].map(([dx, dy]) => cyl(0.008, 0.008, 0.01, 6, 0.48 + dx, 0.995 + dy * Math.cos(0.45), 1.33 - dy * Math.sin(0.45), 'z'))), IMAT.steel);
  // the seat (mostly out of sight below and behind)
  iAdd(merge([box(0.42, 0.08, 0.42, 0.33, 0.74, 0.4), box(0.42, 0.5, 0.08, 0.33, 1.0, 0.14, -0.2, 0, 0), box(0.06, 0.16, 0.04, 0.33, 0.66, 0.4)]), IMAT.vinyl);
  // pedals, and his legs stretched forward to them
  iAdd(merge([box(0.08, 0.02, 0.14, 0.26, 0.68, 1.62, -0.6, 0, 0), box(0.1, 0.02, 0.16, 0.4, 0.66, 1.6, -0.6, 0, 0)]), IMAT.steel);
  const limbBetween = (a, b, r, mat) => {
    const len = a.distanceTo(b);
    const g = new THREE.CapsuleGeometry(r, len, 6, 12);
    const m = iAdd(g, mat);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return m;
  };
  for (const x of [0.26, 0.4]) {
    const hip = new THREE.Vector3(x, 0.84, 0.42), knee = new THREE.Vector3(x, 0.94, 0.98), ankle = new THREE.Vector3(x, 0.74, 1.5);
    limbBetween(hip, knee, 0.066, IMAT.khaki);
    limbBetween(knee, ankle, 0.05, IMAT.khaki);
    iAdd(new THREE.SphereGeometry(0.064, 12, 10).translate(knee.x, knee.y, knee.z), IMAT.khaki);
    iAdd(new THREE.CapsuleGeometry(0.045, 0.18, 4, 10).rotateX(Math.PI / 2 - 0.5).translate(x, 0.72, 1.6), IMAT.black);   // boot
  }
  // the gear selector, by his right hand, in its gate
  iAdd(merge([box(0.07, 0.05, 0.2, 0.115, 0.86, 0.5)]), IMAT.dark);
  iAdd(merge([cyl(0.01, 0.01, 0.2, 8, 0.115, 0.97, 0.5)]), IMAT.steel);
  iAdd(new THREE.SphereGeometry(0.028, 12, 10).translate(0.115, 1.08, 0.5), IMAT.black);

  // THE TWO STEERING LEVERS, standing up in front of him either side of his
  // knees: pull one back to slow that track and turn that way, both to
  // brake. Rubber boots where they come up through the floor, steel rods,
  // rubber grips with his gloved hands wrapped round them.
  const GRIP_Y = 0.44;
  const levers = [0.12, 0.52].map((x, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.6, 1.18);
    interior.add(pivot);
    iAdd(merge([cyl(0.035, 0.05, 0.1, 12, x, 0.64, 1.18), box(0.1, 0.03, 0.1, x, 0.595, 1.18)]), IMAT.rubber);   // the boot and its mount
    const rod = new THREE.Group();
    rod.rotation.x = -0.06;
    pivot.add(rod);
    rod.add(new THREE.Mesh(cyl(0.017, 0.017, 0.4, 10, 0, 0.2, 0), IMAT.steel));
    rod.add(new THREE.Mesh(cyl(0.03, 0.028, 0.14, 14, 0, GRIP_Y, 0), IMAT.rubber));     // the grip
    rod.add(new THREE.Mesh(cyl(0.032, 0.032, 0.012, 14, 0, GRIP_Y - 0.075, 0), IMAT.steel));   // its collar
    rod.add(new THREE.Mesh(cyl(0.012, 0.012, 0.012, 10, 0, GRIP_Y + 0.075, 0.0), i === 0 ? IMAT.red : IMAT.dark));   // a button on top
    // the hand: palm behind the grip, four fingers curled round the front,
    // the thumb lying over the top
    const hand = new THREE.Group();
    hand.position.set(0, GRIP_Y, 0);
    rod.add(hand);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), IMAT.glove);
    palm.scale.set(1.05, 1.35, 0.7);
    palm.position.set(0, 0, -0.045);
    hand.add(palm);
    for (let k = 0; k < 4; k++) {
      const f = new THREE.TorusGeometry(0.04, 0.0115, 8, 14, Math.PI * 1.15);
      f.rotateX(Math.PI / 2);
      f.rotateY(0.08 * Math.PI);
      const fm = new THREE.Mesh(f, IMAT.glove);
      fm.position.y = 0.04 - k * 0.025;
      fm.scale.setScalar(1 - k * 0.04);
      hand.add(fm);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 4, 10), IMAT.glove);
    thumb.rotation.x = Math.PI / 2 - 0.3;
    thumb.position.set((i === 0 ? -1 : 1) * 0.012, 0.065, -0.005);
    hand.add(thumb);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.07, 14), IMAT.glove);   // the gauntlet over his wrist
    cuff.position.set(0, -0.01, -0.09);
    cuff.rotation.x = Math.PI / 2 - 0.4;
    hand.add(cuff);
    return { pivot, rod, hand };
  });
  // his arms: from his shoulders (just below and behind his eyes) down to
  // his hands, bending at the elbows, which hang out and down
  const UPPER = 0.31, FORE = 0.29;
  const driverArms = levers.map(() => ({
    upper: iAdd(new THREE.CapsuleGeometry(0.046, UPPER, 6, 12), IMAT.khaki),
    fore: iAdd(new THREE.CapsuleGeometry(0.04, FORE, 6, 12), IMAT.khaki),
  }));
  const SHOULDERS = [new THREE.Vector3(0.23, 1.03, 0.56), new THREE.Vector3(0.61, 1.03, 0.56)];
  const _w = new THREE.Vector3(), _d = new THREE.Vector3(), _el = new THREE.Vector3(), _pole = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3();
  const placeLimb = (m, a, b, len) => {
    _dir.subVectors(b, a);
    const l = _dir.length();
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(_up, _dir.divideScalar(l || 1));
    m.scale.set(1, l / len, 1);
  };
  function placeArm(i) {
    const sh = SHOULDERS[i];
    // the wrist: just behind the hand
    levers[i].rod.updateMatrixWorld(true);
    _w.set(0, GRIP_Y - 0.01, -0.1);
    levers[i].rod.localToWorld(_w);
    interior.worldToLocal(_w);
    _d.subVectors(_w, sh);
    let len = _d.length();
    const maxLen = UPPER + FORE - 0.005;
    if (len > maxLen) { _d.multiplyScalar(maxLen / len); len = maxLen; }
    const along = (UPPER * UPPER - FORE * FORE + len * len) / (2 * len);
    const lift = Math.sqrt(Math.max(0, UPPER * UPPER - along * along));
    _dir.copy(_d).normalize();
    _pole.set(i === 0 ? -0.15 : 0.1, -1, 0);           // elbows hanging down (clear of the walls and his knees)
    _pole.addScaledVector(_dir, -_pole.dot(_dir)).normalize();
    _el.copy(sh).addScaledVector(_dir, along).addScaledVector(_pole, lift);
    const wrist = _dir.multiplyScalar(len).add(sh);
    placeLimb(driverArms[i].upper, sh, _el, UPPER);
    placeLimb(driverArms[i].fore, _el, wrist.clone(), FORE);
  }
  // the roof lamp's light (and the light from the vision block)
  const lamp = new THREE.PointLight(0xffe2b0, 0, 2.6, 2);
  lamp.position.set(0.72, 1.24, 0.32);
  interior.add(lamp);
  let panelClock = 0;
  function updateInterior(dt, steer, brake, kmh, rpm, gear) {
    // levers pulled back by the steering and the brake, the arms following
    const pull = [Math.min(1, Math.max(0, -steer) + brake * 0.8), Math.min(1, Math.max(0, steer) + brake * 0.8)];
    interior.updateMatrixWorld(true);
    levers.forEach((l, i) => {
      l.pivot.rotation.x += (-0.32 * pull[i] - l.pivot.rotation.x) * Math.min(1, dt / 0.08);
      placeArm(i);
    });
    IMAT.lampRed.emissiveIntensity = rpm > 2650 ? 2 : 0;
    IMAT.lampGreen.emissiveIntensity = 1.2;
    // the instrument panel, ten times a second
    panelClock -= dt;
    if (panelClock > 0) return;
    panelClock = 0.1;
    const g = panelCanvas.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 192);
    grad.addColorStop(0, '#24271f'); grad.addColorStop(1, '#16180f');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 192);
    const dial = (cx, value, max, step, label) => {
      const cy = 92, R = 66;
      // bezel and face
      g.fillStyle = '#5d6052'; g.beginPath(); g.arc(cx, cy, R + 8, 0, 7); g.fill();
      g.fillStyle = '#0d0e0b'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      // ticks and numbers
      g.strokeStyle = '#d8d2b4'; g.fillStyle = '#d8d2b4'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let v = 0; v <= max + 1e-6; v += step / 2) {
        const a = Math.PI * (0.75 + 1.5 * v / max), major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
        g.lineWidth = major ? 3 : 1.5;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * (R - (major ? 12 : 7)), cy + Math.sin(a) * (R - (major ? 12 : 7)));
        g.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2));
        g.stroke();
        if (major) { g.font = 'bold 13px sans-serif'; g.fillText(max > 500 ? String(v / 1000) : String(v), cx + Math.cos(a) * (R - 24), cy + Math.sin(a) * (R - 24)); }
      }
      g.font = '12px sans-serif'; g.fillStyle = '#9ea48c'; g.fillText(label, cx, cy + 34);
      // the needle
      const a = Math.PI * (0.75 + 1.5 * Math.min(1.02, value / max));
      g.strokeStyle = '#f0e2b0'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10); g.lineTo(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10)); g.stroke();
      g.fillStyle = '#3a3c33'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
    };
    dial(96, kmh, 80, 20, 'km/h');
    dial(416, rpm, 3000, 500, 'rpm ×1000');
    // the gear in a little window, warning lamps over it
    g.fillStyle = '#0a0b08'; g.fillRect(216, 70, 80, 56);
    g.strokeStyle = '#5d6052'; g.lineWidth = 4; g.strokeRect(216, 70, 80, 56);
    g.fillStyle = '#e8dfb8'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(gear, 256, 99);
    const lampAt = (x, on, col) => { g.fillStyle = on ? col : '#2b2a24'; g.beginPath(); g.arc(x, 40, 9, 0, 7); g.fill(); };
    lampAt(226, rpm > 2650, '#ff3b2b');
    lampAt(256, true, '#3ad25a');
    lampAt(286, brake > 0.1, '#ffb02b');
    g.font = '10px sans-serif'; g.fillStyle = '#9ea48c';
    g.fillText('GOV   CHG   BRK', 256, 150);
    panelTex.needsUpdate = true;
  }

  // ---------------- THE TURRET'S INSIDE (seen only from the crew view) ----------------
  // Seen from behind the two men in the turret: the gunner on the right,
  // pressed to his sight, hands on his controls; the commander on the left,
  // who loads. Between them the breech of the 90 mm. When it fires the whole
  // breech slams back 40 cm and runs out again with a little bounce, the
  // breech block drops open and throws the empty case back into the canvas
  // bag on the floor; the commander turns, pulls the next round from the
  // rack beside him, swings it in behind the breech and rams it home, and
  // the block slams shut upwards.
  const crew = new THREE.Group();
  crew.visible = false;
  turret.add(crew);
  const gunInside = new THREE.Group();          // the breech end: tips with the gun
  gunInside.visible = false;
  gun.add(gunInside);
  const recoiling = new THREE.Group();          // the part that slides back
  gunInside.add(recoiling);
  const cAdd = (geo, mat, parent = crew) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = false; parent.add(m); return m; };
  const CMAT = {
    wall: new THREE.MeshStandardMaterial({ color: 0xd3ccb4, roughness: 0.85, side: THREE.BackSide }),
    floor: new THREE.MeshStandardMaterial({ map: greyTex, bumpMap: greyTex, bumpScale: 1, roughness: 0.8, metalness: 0.3 }),
    gunSteel: new THREE.MeshStandardMaterial({ color: 0x4a4c47, roughness: 0.45, metalness: 0.8 }),
    olive: new THREE.MeshStandardMaterial({ color: 0x3d4426, roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc39a4c, roughness: 0.3, metalness: 0.9 }),
    canvas: new THREE.MeshStandardMaterial({ color: 0x6a6446, roughness: 1 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc89a7a, roughness: 0.7 }),
  };
  // the walls and roof (the inside of the turret's shell) and the floor
  {
    const cz0 = tz - 0.3;
    const shrink = (pts, k) => pts.map(([x, z]) => [x * k, (z - cz0) * k + cz0]);
    cAdd(slopedPrism(shrink(bottom, 0.95), shrink(top, 0.95), 1.42, 1.95), CMAT.wall);
    const fl = new THREE.CircleGeometry(0.8, 32).rotateX(-Math.PI / 2).translate(0, 1.425, RING_Z);
    cAdd(metreUV(fl), CMAT.floor);
    // the turret ring, a ring of bolts round it, a roof lamp
    cAdd(new THREE.TorusGeometry(0.74, 0.02, 6, 40).rotateX(Math.PI / 2).translate(0, 1.44, RING_Z), IMAT.steel);
    cAdd(merge([cyl(0.04, 0.04, 0.012, 12, -0.05, 1.945, -0.9), new THREE.SphereGeometry(0.018, 10, 8).translate(-0.05, 1.93, -0.9)]), IMAT.bulb);
    // a radio and an intercom box on the back wall, cables along the roof
    cAdd(box(0.42, 0.22, 0.22, 0.05, 1.62, -1.32), IMAT.dark);
    cAdd(merge([0, 1, 2, 3].map((k) => cyl(0.012, 0.012, 0.02, 8, -0.08 + k * 0.08, 1.66, -1.205, 'z'))), IMAT.steel);
    cAdd(box(0.08, 0.04, 0.04, 0.12, 1.58, -1.205), IMAT.lampGreen);
    cAdd(merge([cyl(0.01, 0.01, 1.4, 6, 0.2, 1.93, -0.55, 'z'), cyl(0.01, 0.01, 1.4, 6, 0.24, 1.93, -0.55, 'z')]), IMAT.black);
  }
  // the commander's cupola opening above his head (a dark ring) and the
  // gunner's sight hanging from the roof, with its eyepiece and brow pad
  cAdd(new THREE.TorusGeometry(0.27, 0.025, 6, 30).rotateX(Math.PI / 2).translate(0.4, 1.94, tz - 0.32), IMAT.dark);
  cAdd(merge([box(0.15, 0.17, 0.26, -0.36, 1.86, tz + 0.2), cyl(0.035, 0.03, 0.12, 14, -0.36, 1.83, tz + 0.03, 'z')]), IMAT.dark);
  cAdd(cyl(0.045, 0.045, 0.04, 14, -0.36, 1.83, tz - 0.04, 'z'), IMAT.rubber);
  // the gunner's control handles: a box with two grips he twists
  cAdd(merge([box(0.22, 0.08, 0.1, -0.38, 1.46, tz + 0.07), box(0.04, 0.3, 0.04, -0.38, 1.6, tz + 0.12)]), IMAT.dark);
  const handles = new THREE.Group();
  handles.position.set(-0.38, 1.5, tz + 0.07);
  crew.add(handles);
  for (const x of [-0.11, 0.11]) handles.add(new THREE.Mesh(cyl(0.022, 0.022, 0.12, 10, x, 0.02, 0, 'x'), IMAT.rubber));
  handles.add(new THREE.Mesh(cyl(0.012, 0.012, 0.22, 8, 0, 0.02, 0, 'x'), IMAT.steel));

  // THE BREECH: the breech ring (two cheeks and a top, open underneath for
  // the block), the sliding block, the chamber, the opening crank; fixed to
  // the cradle behind it: the recoil cylinders and the recoil guard rails
  recoiling.add(new THREE.Mesh(merge([
    box(0.07, 0.3, 0.34, 0.125, 0, -0.37), box(0.07, 0.3, 0.34, -0.125, 0, -0.37),
    box(0.18, 0.08, 0.34, 0, 0.11, -0.37), box(0.18, 0.03, 0.34, 0, -0.135, -0.37),
    cyl(0.09, 0.09, 0.22, 20, 0, 0, -0.1, 'z'),                     // the end of the barrel
  ]), CMAT.gunSteel));
  const chamber = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20).rotateY(Math.PI).translate(0, 0, -0.4), IMAT.black);
  recoiling.add(chamber);
  const block = new THREE.Mesh(merge([box(0.18, 0.17, 0.1, 0, 0, -0.49), cyl(0.02, 0.02, 0.06, 10, 0, -0.04, -0.55, 'z')]), CMAT.gunSteel);
  recoiling.add(block);
  const crank = new THREE.Mesh(merge([box(0.03, 0.03, 0.2, 0.17, 0.06, -0.4), box(0.03, 0.12, 0.03, 0.17, 0.0, -0.5)]), IMAT.steel);
  recoiling.add(crank);
  cAdd(merge([
    cyl(0.04, 0.04, 0.5, 14, 0.1, 0.19, -0.12, 'z'), cyl(0.04, 0.04, 0.5, 14, -0.1, 0.19, -0.12, 'z'),   // recoil cylinders
    box(0.03, 0.03, 0.68, 0.21, -0.12, -0.78), box(0.03, 0.03, 0.68, -0.21, -0.12, -0.78),             // guard rails
    box(0.45, 0.03, 0.03, 0, -0.14, -1.12), box(0.03, 0.12, 0.03, 0.21, -0.07, -1.12), box(0.03, 0.12, 0.03, -0.21, -0.07, -1.12),
  ]), IMAT.steel, gunInside);
  cAdd(box(0.04, 0.04, 0.3, -0.21, -0.12, -0.6), IMAT.red, gunInside);   // a red danger strip on the guard

  // THE ROUNDS: brass case, olive shell with a black tip (base at 0, nose at +z)
  const roundGeo = { case: merge([cyl(0.048, 0.048, 0.5, 16, 0, 0, 0.25, 'z'), cyl(0.056, 0.056, 0.015, 16, 0, 0, 0.008, 'z')]),
    shell: merge([cyl(0.045, 0.045, 0.1, 16, 0, 0, 0.55, 'z'), new THREE.ConeGeometry(0.045, 0.16, 16).rotateX(Math.PI / 2).translate(0, 0, 0.68)]) };
  const makeRound = (parent, withShell = true) => {
    const r = new THREE.Group();
    r.add(new THREE.Mesh(roundGeo.case, CMAT.brass));
    if (withShell) r.add(new THREE.Mesh(roundGeo.shell, CMAT.olive));
    parent.add(r);
    return r;
  };
  // the ready rack on the left wall beside the commander: two by two, lying
  // pointing forward, held in clips
  const RACK = [[0.6, 1.6], [0.71, 1.6], [0.6, 1.49], [0.71, 1.49]];
  const RACK_Z = -0.48;
  const rackRounds = RACK.map(([x, y]) => { const r = makeRound(crew); r.position.set(x, y, RACK_Z); return r; });
  cAdd(merge([0.1, 0.45].flatMap((dz) => [box(0.26, 0.02, 0.03, 0.655, 1.43, RACK_Z + dz), box(0.03, 0.26, 0.03, 0.535, 1.55, RACK_Z + dz), box(0.26, 0.02, 0.03, 0.655, 1.545, RACK_Z + dz)])), IMAT.dark);
  // the round in the commander's hands, and the empty case flying out
  const carried = makeRound(crew);
  carried.visible = false;
  const spent = makeRound(crew, false);
  spent.visible = false;
  // the canvas bag on the floor behind the breech, filling up with cases
  const BAG = new THREE.Vector3(0.02, 1.43, -0.95);
  const bag = cAdd(new THREE.CylinderGeometry(0.17, 0.14, 0.24, 16, 1, true).translate(BAG.x, BAG.y + 0.12, BAG.z), new THREE.MeshStandardMaterial({ color: 0x6a6446, roughness: 1, side: THREE.DoubleSide }));
  cAdd(new THREE.TorusGeometry(0.17, 0.012, 6, 24).rotateX(Math.PI / 2).translate(BAG.x, BAG.y + 0.24, BAG.z), IMAT.dark);
  cAdd(new THREE.CircleGeometry(0.14, 16).rotateX(-Math.PI / 2).translate(BAG.x, BAG.y + 0.005, BAG.z), CMAT.canvas);
  const bagCases = [0, 1, 2, 3, 4, 5].map((k) => {
    const r = makeRound(crew, false);
    const a = k * 2.1;
    r.position.set(BAG.x + Math.cos(a) * 0.07, BAG.y + 0.02 + (k % 3) * 0.015, BAG.z + Math.sin(a) * 0.07);
    r.rotation.set(-Math.PI / 2 + (Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
    r.scale.setScalar(0.9);
    r.visible = false;
    return r;
  });

  // THE TWO MEN: coveralls, gloves, a headset over a beret
  const crewMesh = (geo, mat, parent) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
  const makeMan = (hips) => {
    const torso = new THREE.Group();
    torso.position.copy(hips);
    crew.add(torso);
    const chest = crewMesh(new THREE.CapsuleGeometry(0.15, 0.22, 6, 14), IMAT.khaki, torso);
    chest.position.y = 0.2; chest.scale.set(1.05, 1, 0.72);
    crewMesh(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 12).translate(0, 0.45, 0), CMAT.skin, torso);   // neck
    const head = new THREE.Group();
    head.position.set(0, 0.55, 0);
    torso.add(head);
    crewMesh(new THREE.SphereGeometry(0.095, 18, 14).scale(0.9, 1.05, 1), CMAT.skin, head);
    crewMesh(new THREE.SphereGeometry(0.1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.95, 0.7, 1.05).translate(0, 0.02, -0.005), IMAT.black, head);   // beret / cap
    for (const s of [1, -1]) crewMesh(cyl(0.045, 0.045, 0.035, 14, s * 0.09, 0, 0, 'x'), IMAT.black, head);   // headset ear cups
    crewMesh(new THREE.TorusGeometry(0.1, 0.008, 6, 20, Math.PI).rotateY(Math.PI / 2).translate(0, 0.02, 0), IMAT.black, head);
    const arms = [0, 1].map(() => ({
      upper: crewMesh(new THREE.CapsuleGeometry(0.045, 0.3, 6, 12), IMAT.khaki, crew),
      fore: crewMesh(new THREE.CapsuleGeometry(0.04, 0.28, 6, 12), IMAT.khaki, crew),
      hand: crewMesh(new THREE.SphereGeometry(0.045, 12, 10).scale(0.9, 0.8, 1.25), IMAT.glove, crew),
    }));
    return { torso, head, arms, shoulders: [new THREE.Vector3(-0.19, 0.38, 0), new THREE.Vector3(0.19, 0.38, 0)] };
  };
  const commander = makeMan(new THREE.Vector3(0.42, 1.32, tz - 0.3));
  const gunner = makeMan(new THREE.Vector3(-0.38, 1.31, tz - 0.36));
  gunner.torso.rotation.x = 0.42;        // leaning forward into his sight
  gunner.head.rotation.x = -0.25;
  const cv = { a: new THREE.Vector3(), d: new THREE.Vector3(), e: new THREE.Vector3(), p: new THREE.Vector3(), dir: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), s: new THREE.Vector3() };
  const setSeg = (m, a, b, len) => {
    cv.dir.subVectors(b, a);
    const l = cv.dir.length();
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(cv.up, cv.dir.divideScalar(l || 1));
    m.scale.set(1, l / len, 1);
  };
  // one arm from its shoulder to a hand target, bending at the elbow
  const reach = (man, i, target, pole) => {
    const U = 0.3, F = 0.28, arm = man.arms[i];
    man.torso.updateMatrixWorld(true);
    const sh = crew.worldToLocal(man.torso.localToWorld(cv.s.copy(man.shoulders[i])));
    cv.d.subVectors(target, sh);
    let len = cv.d.length();
    const maxLen = U + F - 0.005;
    if (len > maxLen) { cv.d.multiplyScalar(maxLen / len); len = maxLen; }
    const along = (U * U - F * F + len * len) / (2 * len);
    const lift = Math.sqrt(Math.max(0, U * U - along * along));
    cv.dir.copy(cv.d).normalize();
    cv.p.copy(pole).addScaledVector(cv.dir, -pole.dot(cv.dir)).normalize();
    const elbow = cv.e.copy(sh).addScaledVector(cv.dir, along).addScaledVector(cv.p, lift).clone();
    const hand = sh.clone().add(cv.d);
    setSeg(arm.upper, sh, elbow, U);
    setSeg(arm.fore, elbow, hand, F);
    arm.hand.position.copy(hand);
    arm.hand.quaternion.copy(arm.fore.quaternion);
  };

  // the loading drill, timed from the shot (seconds)
  const DRILL = { open: 0.75, ejectEnd: 1.3, reach: [1.4, 2.2], lift: [2.2, 3.3], ram: [3.3, 4.0], close: 4.05, back: [4.2, 5.0] };
  const drill = { t: 99, loaded: true, rounds: 34, slot: -1, cases: 0 };   // slot: which rack round this reload uses
  const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const phase = (t, [a, b]) => ease((t - a) / (b - a));
  const POLES = { cr: new THREE.Vector3(-0.3, -1, 0.2), cl: new THREE.Vector3(0.4, -1, 0.2), gr: new THREE.Vector3(-0.5, -1, 0), gl: new THREE.Vector3(0.5, -1, 0) };
  const REST = { r: new THREE.Vector3(0.3, 1.5, tz - 0.08), l: new THREE.Vector3(0.58, 1.5, tz - 0.05) };
  const tmpQ = new THREE.Quaternion(), qRack = new THREE.Quaternion(), qGun = new THREE.Quaternion(), qa = new THREE.Quaternion();
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), handR = new THREE.Vector3(), handL = new THREE.Vector3(), axis = new THREE.Vector3();
  // a point on the gun's line (gun-local z), in the turret's own space
  const onGun = (out, z, y = 0) => crew.worldToLocal(gun.localToWorld(out.set(0, y, z)));
  // the breech's slide back and run-out: 40 cm back almost instantly, back
  // out over about 0.7 s, and a little bounce at the end
  const recoilAt = (t) => {
    if (t < 0.05) return 0.4 * Math.sqrt(t / 0.05);
    if (t < 0.75) return 0.4 * (1 - ease((t - 0.05) / 0.7));
    if (t < 1.15) return 0.018 * Math.sin(Math.PI * (t - 0.75) / 0.2) * Math.exp(-(t - 0.75) * 6);
    return 0;
  };
  function updateCrew(dt, traverse, elevate) {
    const t = drill.t;
    // the breech block: down (open) from just after the shot until the new
    // round is rammed, then it slams up
    const open = drill.loaded ? 0 : Math.max(0, Math.min(1, (t - DRILL.open) / 0.12));
    block.position.y = -0.17 * open;
    crank.rotation.z = 0.6 * open;
    crew.updateMatrixWorld(true);
    gun.updateMatrixWorld(true);
    // the empty case flying back into the bag
    if (t >= DRILL.open && t < DRILL.ejectEnd) {
      const u = (t - DRILL.open) / (DRILL.ejectEnd - DRILL.open);
      onGun(pA, -0.4);
      pB.set(BAG.x, BAG.y + 0.3, BAG.z);
      spent.visible = true;
      if (u < 0.35) spent.position.copy(onGun(axis, -0.4 - 0.6 * (u / 0.35)));
      else spent.position.copy(onGun(axis, -1.0)).lerp(pB, (u - 0.35) / 0.65).y += Math.sin(Math.PI * (u - 0.35) / 0.65) * 0.05;
      gun.getWorldQuaternion(qGun); crew.getWorldQuaternion(qa); qGun.premultiply(qa.invert());
      spent.quaternion.copy(qGun).multiply(tmpQ.setFromAxisAngle(cv.up.set(1, 0, 0), Math.PI * 1.4 * u));
      cv.up.set(0, 1, 0);
    } else spent.visible = false;
    bagCases.forEach((c, k) => { c.visible = k < Math.min(6, drill.cases); });
    // the rack: what's still in it
    const inHand = drill.slot >= 0 && !drill.loaded && t >= DRILL.lift[0];
    const inRack = Math.min(4, Math.max(0, drill.rounds - (drill.loaded || inHand ? 1 : 0)));
    rackRounds.forEach((r, k) => { r.visible = k < inRack; });
    // the commander's drill
    let yaw = 0;
    handR.copy(REST.r); handL.copy(REST.l);
    carried.visible = false;
    if (drill.slot >= 0 && t >= DRILL.reach[0] && t < DRILL.back[1]) {
      const [sx, sy] = RACK[drill.slot];
      // where the round is: in the rack, swung across behind the breech, rammed in
      gun.getWorldQuaternion(qGun); crew.getWorldQuaternion(qa); qGun.premultiply(qa.invert());
      qRack.identity();
      const lift = phase(t, DRILL.lift), ram = phase(t, DRILL.ram);
      onGun(pB, -1.25 + 0.71 * ram);                       // its base on the gun's line
      // (swung across in front of his chest, lifted clear: a curve from the
      // rack to behind the breech)
      const u = lift, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      pA.set(sx * w0 + 0.3 * w1 + pB.x * w2, sy * w0 + 1.8 * w1 + pB.y * w2, RACK_Z * w0 + (tz + 0.02) * w1 + pB.z * w2);
      carried.position.copy(pA);
      carried.quaternion.copy(qRack).slerp(qGun, lift);
      carried.visible = t < DRILL.ram[1];
      axis.set(0, 0, 1).applyQuaternion(carried.quaternion);
      const reachIn = phase(t, DRILL.reach);
      // hands: right on the base of the case, left round the middle
      handR.lerp(cv.a.copy(pA).addScaledVector(axis, -0.03), reachIn);
      handL.lerp(cv.d.copy(pA).addScaledVector(axis, 0.3), reachIn);
      if (t > DRILL.ram[0]) handL.lerp(REST.l, phase(t, [DRILL.ram[0], DRILL.ram[0] + 0.4]));
      if (t > DRILL.ram[1]) handR.copy(cv.a.copy(onGun(pB, -0.57))).lerp(REST.r, phase(t, DRILL.back));
      yaw = 0.5 * reachIn - 1.0 * lift * (1 - phase(t, DRILL.back));
    }
    commander.torso.rotation.y += (yaw - commander.torso.rotation.y) * Math.min(1, dt * 10);
    // (he leans forward to push the round right in)
    const leanIn = drill.slot >= 0 ? phase(t, DRILL.ram) * (1 - phase(t, DRILL.back)) : 0;
    commander.torso.rotation.x = 0.45 * leanIn;
    commander.head.rotation.y = commander.torso.rotation.y * 0.4;
    reach(commander, 0, handR, POLES.cr);
    reach(commander, 1, handL, POLES.cl);
    // the gunner: twisting his handles to traverse and elevate
    handles.rotation.x += (-elevate * 0.35 - handles.rotation.x) * Math.min(1, dt * 12);
    handles.rotation.y += (traverse * 0.35 - handles.rotation.y) * Math.min(1, dt * 12);
    handles.updateMatrixWorld(true);
    reach(gunner, 0, crew.worldToLocal(handles.localToWorld(cv.a.set(-0.11, 0.03, -0.02))).clone(), POLES.gr);
    reach(gunner, 1, crew.worldToLocal(handles.localToWorld(cv.a.set(0.11, 0.03, -0.02))).clone(), POLES.gl);
  }
  const crewLamp = new THREE.PointLight(0xffe2b0, 0, 3, 2);
  crewLamp.position.set(-0.05, 1.88, -0.9);
  crew.add(crewLamp);

  group.visible = false;
  // where the exhaust pipe comes out (right side, front), for the smoke
  const exhaust = new THREE.Object3D();
  exhaust.position.set(-1.19, 1.0, 1.25);
  group.add(exhaust);
  let turretYaw = 0, gunPitch = 0;
  let driverIn = false, crewIn = false;
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
    // The coaxial machine gun's muzzle (beside the 90 mm, pointing the same
    // way as it, so it aims wherever the gunner aims)
    coaxMuzzle(posOut, dirOut) {
      group.updateMatrixWorld();
      gun.localToWorld(posOut.set(0.2, -0.04, 0.56));
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
      body.localToWorld(posOut.set(0.42, 1.25, 0.62));        // his eyes, just behind the periscope's window
      group.getWorldQuaternion(quatOut);
      return quatOut.multiply(DRIVER_TURN);
    },
    // The periscope's head, up on the roof in front of the hatch: where the
    // picture in its window is seen from (writes a camera's position and turn)
    periscopeView(posOut, quatOut) {
      group.updateMatrixWorld();
      body.localToWorld(posOut.set(0.42, 1.5, 1.0));
      group.getWorldQuaternion(quatOut);
      return quatOut.multiply(PERISCOPE_TURN);
    },
    // show this picture in the periscope's window
    setPeriscopePicture(texture) {
      periscopeScreen.material.map = texture;
      periscopeScreen.material.color.set(0xffffff);
      periscopeScreen.material.needsUpdate = true;
    },
    // show the inside of the driver's compartment (only from his seat), and
    // move his levers and dials
    setInterior(on, dt = 0, c = {}) {
      interior.visible = on;
      driverIn = on;
      driverHatch.visible = !on;
      lowerHullMesh.visible = !(driverIn || crewIn);
      lamp.intensity = on ? 1.4 : 0;
      if (on) updateInterior(dt, c.steer || 0, c.brake || 0, c.kmh || 0, c.rpm || 720, c.gear || 'N');
    },
    // A shot: the gun slams back 40 cm and runs out again, the breech opens
    // and throws out the case, and the commander loads the next round (if
    // there is one). roundsLeft: how many are left, counting the next one.
    fired(roundsLeft = 0) {
      drill.t = 0;
      drill.loaded = false;
      drill.cases++;
      drill.rounds = roundsLeft;
      drill.slot = roundsLeft > 0 ? Math.min(4, roundsLeft) - 1 : -1;
    },
    // The view from behind the gunner and commander in the turret (turns
    // with the turret). Writes a camera's position and turn.
    crewView(posOut, quatOut) {
      group.updateMatrixWorld();
      turret.localToWorld(posOut.set(-0.08, 1.85, tz - 0.83));
      turret.getWorldQuaternion(quatOut);
      return quatOut.multiply(CREW_TURN);
    },
    // show the inside of the turret (only in the crew view) and move the
    // men; traverse / elevate: how hard the gunner is turning his handles (-1..1)
    setCrew(on, dt = 0, traverse = 0, elevate = 0) {
      crew.visible = gunInside.visible = on;
      crewIn = on;
      lowerHullMesh.visible = !(driverIn || crewIn);
      crewLamp.intensity = on ? 1.6 : 0;
      if (on) updateCrew(dt, traverse, elevate);
    },
    // Turn the turret and lift the gun directly (the gunner's handles):
    // radians, within the turret's speed and the gun's stops
    turnBy(dYaw, dPitch) {
      turretYaw += dYaw;
      turretPivot.rotation.y = turretYaw;
      gunPitch = Math.max(-0.17, Math.min(0.61, gunPitch + dPitch));
      gun.rotation.x = -gunPitch;
    },
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
      // the loading drill's clock; the barrel and breech sliding back and out
      drill.t += dt;
      if (!drill.loaded && drill.slot >= 0 && drill.t >= DRILL.close) drill.loaded = true;
      if (drill.slot >= 0 && drill.t >= DRILL.back[1]) drill.slot = -1;
      const back = recoilAt(drill.t);
      barrel.position.z = barrelHome - back;
      recoiling.position.z = -back;
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
