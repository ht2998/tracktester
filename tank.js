// =====================================================================
// FV101 SCORPION-INSPIRED LIGHT TANK (secret: type FV101 on the keyboard)
// A model of the British light reconnaissance tank, to real proportions:
// hull 4.4 m long and 2.2 m wide, 2.1 m to the turret roof, aluminium
// hull with a long sloping front (engine front right, driver front left),
// a low faceted turret on the back half with a short 76 mm gun, the
// commander's cupola on the left, the gunner's sight on the right, four
// smoke dischargers on each front corner of the turret, a stowage basket
// on the back, and on each side five big rubber-tyred road wheels, the
// drive sprocket at the front and the idler at the back, with no return
// rollers: the top run of the track rests on the road wheels.
// For now it drives with the car's physics; the tracks, wheels and
// sprockets turn with the speed of each side.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

// Where the driver's eye would be if you look out of the commander's hatch
export const TANK_EYE = new THREE.Vector3(0.42, 2.32, -0.62);

const TRACK_X = 0.88;      // middle of each track from the centre line
const TRACK_W = 0.43;      // track width
const WHEEL_R = 0.27;      // road wheels (about 0.54 m across)
const WHEEL_Y = 0.30;      // road wheel axle height (wheel + track under it)
const WHEEL_Z = [1.12, 0.5, -0.12, -0.74, -1.36];   // five road wheels, front to back
const SPROCKET = { z: 1.78, y: 0.62, r: 0.25 };     // drive sprocket, at the front
const IDLER = { z: -1.9, y: 0.56, r: 0.24 };        // idler, at the back

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
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    group.add(m);
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
  const turret = new THREE.Group();
  group.add(turret);
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

  // The 76 mm gun: a short barrel with a slightly thicker base and muzzle,
  // and the coaxial machine gun beside it
  const gun = new THREE.Group();
  gun.position.set(0, 1.66, tz + 0.82);
  turret.add(gun);
  const gunGeo = merge([
    cyl(0.072, 0.072, 0.3, 20, 0, 0, 0.15, 'z'),       // the base, out of the mantlet
    cyl(0.055, 0.058, 1.85, 20, 0, 0, 1.2, 'z'),       // the barrel
    cyl(0.068, 0.068, 0.14, 20, 0, 0, 2.15, 'z'),      // the muzzle
  ]);
  const barrel = new THREE.Mesh(gunGeo, MAT.darkPaint);
  barrel.castShadow = true;
  gun.add(barrel);
  const coax = new THREE.Mesh(cyl(0.018, 0.018, 0.5, 8, 0.2, -0.04, 0.3, 'z'), MAT.metal);
  gun.add(coax);
  // Muzzle bore (dark)
  const bore = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  bore.position.set(0, 0, 2.225);
  gun.add(bore);

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

  group.visible = false;
  return {
    group, turret, gun,
    // speedLeft / speedRight: how fast each side of the tank is moving over
    // the ground (m/s), so each track runs at its own speed when turning
    update(dt, speedLeft, speedRight) {
      travel[0] += speedLeft * dt;
      travel[1] += speedRight * dt;
      place();
    },
    // the headlights glow when the car's lights are on
    setLights(on) { MAT.lamp.emissive.setHex(on ? 0xfff1d6 : 0x000000); MAT.lamp.emissiveIntensity = on ? 1.5 : 0; },
  };
}
