// =====================================================================
// THE TT-88: an original late-1980s turbo-era Formula 1 car (a design of
// our own, in the style of the time: no real team's car and no labels).
// Very low and flat, the driver lying almost flat with just his helmet
// showing, a low flat nose with its front wing on the nose sides, long
// flat sidepods pinched in at the back ("coke bottle"), a low engine cover
// with the roll hoop and airbox behind his head, exhausts poking out at the
// back, a big rear wing with a small beam wing under it, a flat floor with
// a diffuser, round mirrors on stalks, huge slick tyres on plain rims, thin
// steel wishbones out to the wheels, a red rain light. Glossy two-tone
// paint: deep blue with a bright yellow nose and stripes.
//
// Its physics (F1_SPEC) starts from the Caterham's and changes what makes
// it an F1 car: light, long and wide, slicks, lots of downforce, big
// brakes, and the 1.5-litre turbo V6 with its lag.
//
// ENGINE SWAP (the secret menu): any engine in any car. Each one brings its
// own power, revs, weight and sound; the gearing is worked out again to
// suit it.
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 12;

import * as THREE from 'three';
import { CATERHAM } from './physics.js';

// ---------------------------------------------------------------------
// ENGINES. torqueCurve: [rpm, Nm] (at full boost for a turbo). turbo: the
// boost comes in between onRpm and fullRpm, takes `lag` seconds to build,
// and without it the engine makes `base` of its torque.
// ---------------------------------------------------------------------
export const ENGINES = {
  duratec: { name: '2.0 inline-4 (Caterham)', cylinders: 4, idleRpm: 900, redline: 7600, launchRpm: 4500, engineBraking: 38, peakTorque: 203, massDelta: 0,
    torqueCurve: CATERHAM.torqueCurve, turbo: null },
  turboV6: { sound: { tone: 1.15, bass: 1, drive: 1.25, vol: 1.1 }, name: '1.5 turbo V6 (race boost)', cylinders: 6, idleRpm: 3200, redline: 12500, launchRpm: 8500, engineBraking: 60, peakTorque: 420, massDelta: 0,
    torqueCurve: [[2500, 230], [4000, 280], [6000, 330], [8000, 390], [9500, 415], [10500, 420], [11500, 405], [12500, 385], [13000, 160], [13300, 0]],
    turbo: { onRpm: 4500, fullRpm: 8000, lag: 0.6, base: 0.55 } },
  quali: { sound: { tone: 1.2, bass: 1, drive: 1.35, vol: 1.2 }, name: '1.5 turbo V6 (qualifying boost)', cylinders: 6, idleRpm: 3200, redline: 12800, launchRpm: 9000, engineBraking: 60, peakTorque: 640, massDelta: 0,
    torqueCurve: [[2500, 300], [4000, 360], [6000, 450], [8000, 570], [9500, 630], [10500, 640], [11500, 610], [12800, 560], [13200, 200], [13500, 0]],
    turbo: { onRpm: 5000, fullRpm: 8800, lag: 0.85, base: 0.45 }, wear: 4 },
  v10: { sound: { tone: 1.3, bass: 1, drive: 1.3, vol: 1.25 }, name: '3.5 V10', cylinders: 10, idleRpm: 3500, redline: 14000, launchRpm: 9500, engineBraking: 75, peakTorque: 385, massDelta: 15,
    torqueCurve: [[2500, 170], [5000, 260], [8000, 330], [10000, 365], [11500, 385], [13000, 370], [14000, 350], [14500, 140], [14800, 0]], turbo: null },
  // an early-2000s F1 V10, on the figures BMW published for theirs: 3.0
  // litres, 90 degrees, idling at 4,000, a 19,200 limit, over 900 bhp,
  // under 90 kg (the short-stroke shape of Cosworth's: 95 x 42.3 mm)
  // (seven gears, like the real cars of 2005: each change up lands a little higher)
  v10x: { name: '3.0 V10 (2003 F1-style, 19,200 rpm)', voice: 'v10', shiftAt: [17800 / 19200, 18000 / 19200, 18150 / 19200, 18300 / 19200, 18500 / 19200, 18650 / 19200], landAt: [14000, 14500, 15000, 15500, 16000, 16400], cylinders: 10, idleRpm: 4000, redline: 19200, launchRpm: 12000, engineBraking: 90, peakTorque: 365, massDelta: -10,
    torqueCurve: [[3000, 150], [6000, 220], [9000, 280], [12000, 320], [15000, 352], [17000, 365], [18500, 357], [19200, 345], [19500, 150], [19800, 0]], turbo: null },
  v12: { sound: { tone: 1.4, bass: 0, drive: 1.15, vol: 1.25 }, name: '3.5 V12', cylinders: 12, idleRpm: 3800, redline: 13500, launchRpm: 9000, engineBraking: 80, peakTorque: 360, massDelta: 30,
    torqueCurve: [[2500, 160], [5000, 240], [8000, 310], [10000, 345], [11500, 360], [12800, 350], [13500, 335], [14000, 130], [14300, 0]], turbo: null },
  v8: { sound: { tone: 0.8, bass: 6, drive: 1.7, vol: 1.2 }, name: '5.0 V8 (muscle)', cylinders: 8, idleRpm: 750, redline: 7000, launchRpm: 3800, engineBraking: 70, peakTorque: 560, massDelta: 90,
    torqueCurve: [[700, 300], [1500, 400], [2500, 480], [3500, 540], [4800, 560], [5800, 530], [6500, 490], [7000, 460], [7300, 180], [7500, 0]], turbo: null },
  diesel: { sound: { tone: 0.6, bass: 6, drive: 1.8, vol: 1.1 }, name: '4.2 six-cylinder diesel (from the secret)', cylinders: 6, idleRpm: 720, redline: 2700, launchRpm: 1400, engineBraking: 90, peakTorque: 640, massDelta: 380,
    torqueCurve: [[600, 380], [1000, 520], [1500, 620], [1800, 640], [2200, 600], [2700, 520], [2800, 200], [2900, 0]], turbo: { onRpm: 1000, fullRpm: 1700, lag: 1.4, base: 0.55 } },
};

// The car's spec with an engine fitted: its power, weight and revs, and
// gearing worked out to suit it (each gear tops out just under the
// limiter; top gear a little past the car's top speed)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function withEngine(car, key) {
  const e = ENGINES[key] || ENGINES.duratec;
  const s = { ...car, voice: null, ...e, name: car.name, engineName: e.name, engineKey: key, mass: car.baseMass + e.massDelta };
  // top speed: where the power runs out against the drag (P = drag·v³)
  let peakW = 0;
  for (const [rpm, nm] of e.torqueCurve) peakW = Math.max(peakW, nm * rpm * Math.PI / 30);
  const vTop = Math.cbrt((peakW * car.driveEfficiency) / car.drag) * 1.01;
  // The gears, spaced to suit this engine: first tops out at about a third
  // of the top speed (lower for an engine with a narrow, peaky power band),
  // the rest closing up gently towards the top, as racing gearboxes do.
  // (The Caterham with its own engine keeps its real gearbox.)
  if (e.landAt && e.shiftAt) {
    // gears set by where each change up lands: each gear's ratio is the
    // last one's times (landing revs / change-up revs)
    s.gears = [1];
    for (let i = 0; i < e.landAt.length; i++) s.gears.push(s.gears[i] * e.landAt[i] / (e.shiftAt[i] * e.redline));
    s.gears = s.gears.map((g) => +(g / s.gears[s.gears.length - 1]).toFixed(3));
  } else if (!(car.keepGears && key === car.stockEngine)) {
    const n = car.gears.length;
    const firstShare = clamp(0.24 + 0.14 * (e.idleRpm / e.redline), 0.24, 0.42);
    const top = 1;
    const first = top / firstShare;
    s.gears = [];
    for (let i = 0; i < n; i++) s.gears.push(+(first * Math.pow(top / first, Math.pow(i / (n - 1), 0.88))).toFixed(3));
  }
  const top = s.gears[s.gears.length - 1];
  s.finalDrive = (e.redline * Math.PI / 30) * car.wheelRadius / (vTop * top);
  // where the automatic changes up: just under the limit, unless the
  // engine says otherwise (shiftAt: share of the limit, gear by gear)
  s.autoUpshiftKmh = s.gears.slice(0, -1).map((g, i) => Math.round((e.redline * (e.shiftAt?.[i] ?? 0.97) * Math.PI / 30) * car.wheelRadius / (g * s.finalDrive) * 3.6));
  s.cvtTargetRpm = e.redline * 0.87;
  s.cvtRange = [s.finalDrive * top * 0.9, s.finalDrive * s.gears[0] * 1.3];
  s.oilLeakRate = car.oilLeakRate * (e.wear || 1);
  return s;
}

// The TT-88's own physics (with the turbo V6 fitted)
export const F1_CAR = {
  ...CATERHAM,
  name: 'TT-88',
  stockEngine: 'turboV6',
  wings: true,                // (its wings can be crushed and snap off)
  baseMass: 600,              // kg with the driver and some fuel
  inertia: 900,
  airInertia: { pitch: 950, yaw: 980, roll: 260 },
  cgToFront: 1.62, cgToRear: 1.28,     // a long car (2.9 m between the axles)
  trackHalf: 0.88,
  wheelRadius: 0.33,
  frontGrip: 1.45, rearGrip: 1.6,      // (times the racing slicks it runs on: about 1.7 and 1.9)
  maxPushShare: 0.9,
  cgHeight: 0.27,
  downforce: 1.3,                      // about 1.5 times its weight at 300 km/h
  downforceFront: 0.42,
  drag: 0.64,
  brakeForce: 22000, brakeBias: 0.6,
  maxSteer: 0.36, steerSpeed: 3.2,
  frontStiffness: 70000, rearStiffness: 82000,
  yawDamping: 0.8,
  suspension: {
    // very stiff, very little travel: the floor runs a few centimetres off
    // the road and touches it over bumps, kerbs and under braking
    springFront: 170000, springRear: 190000, damperFront: 9000, damperRear: 9800,
    arbFront: 45000, arbRear: 22000, bumpStop: 0.018, bumpStopRate: 600000, droop: 0.022,
    pitchInertia: 850, rollInertia: 220,
  },
  brakeDiscs: { heatFront: 900, heatRear: 700, coolFront: 2.2, coolRear: 1.8, fadeStart: 900, fadeEnd: 1300, fadeMin: 0.6 },   // carbon brakes: they like it hot
  gears: [2.92, 2.14, 1.72, 1.43, 1.22, 1.06],
  clutchBite: 0.9,            // (a long slip off the line keeps the revs up, on the boost)
  shiftTime: { manual: 0.08, auto: 0.18 },
  fuelCapacity: 150, idleFuel: 2.5, fuelPerKwh: 0.3,
  tyreWearBase: 1 / 160000,
};
export const CATERHAM_CAR = { ...CATERHAM, name: 'Caterham Seven', baseMass: CATERHAM.mass, stockEngine: 'duratec', keepGears: true };
// the engine each car comes with
export const STOCK_ENGINE = { caterham: 'duratec', f1: 'turboV6' };

// ---------------------------------------------------------------------
// THE MODEL
// ---------------------------------------------------------------------
// A smooth body made of cross-sections along the car (each a rounded box:
// width, height, bottom), joined up: the nose, tub, sidepods and so on
function loft(sections0, round = 0.5, around = 24, steps = 4, smooth = true) {
  // (in-between sections added, so the body is smooth and has enough
  // points to dent where it's hit)
  const sections = [];
  for (let i = 0; i < sections0.length - 1; i++) {
    const a = sections0[i], b = sections0[i + 1];
    for (let k = 0; k < steps; k++) {
      const t = k / steps, u = smooth ? t * t * (3 - 2 * t) * 0.5 + t * 0.5 : t;   // (straight between sections: flat panels)
      sections.push({ z: a.z + (b.z - a.z) * t, w: a.w + (b.w - a.w) * u, h: a.h + (b.h - a.h) * u, y: a.y + (b.y - a.y) * u, x: (a.x || 0) + ((b.x || 0) - (a.x || 0)) * u, top: (a.top ?? 1) + ((b.top ?? 1) - (a.top ?? 1)) * u });
    }
  }
  sections.push(sections0[sections0.length - 1]);
  const pos = [], idx = [];
  const ring = (s) => {
    const pts = [];
    for (let k = 0; k < around; k++) {
      const a = (k / around) * Math.PI * 2;
      const c = Math.cos(a), si = Math.sin(a);
      // a superellipse: squarer with smaller `round`
      const e = 2 / (1 + round * 3);
      const x = Math.sign(c) * Math.pow(Math.abs(c), e) * s.w / 2;
      const y = Math.sign(si) * Math.pow(Math.abs(si), e) * s.h / 2;
      // (narrower towards the top, if the section says so: sides leaning in)
      const lean = y > 0 ? 1 - (1 - (s.top ?? 1)) * (y / (s.h / 2)) : 1;
      pts.push([x * lean + (s.x || 0), y + s.y + s.h / 2, s.z]);
    }
    return pts;
  };
  sections.forEach((s) => ring(s).forEach((p) => pos.push(...p)));
  for (let i = 0; i < sections.length - 1; i++) {
    for (let k = 0; k < around; k++) {
      const a = i * around + k, b = i * around + (k + 1) % around, c = (i + 1) * around + k, d = (i + 1) * around + (k + 1) % around;
      idx.push(a, c, b, b, c, d);
    }
  }
  // caps at both ends
  const cap = (i, flip) => {
    const centre = pos.length / 3;
    const s = sections[i];
    pos.push(s.x || 0, s.y + s.h / 2, s.z);
    for (let k = 0; k < around; k++) {
      const a = i * around + k, b = i * around + (k + 1) % around;
      if (flip) idx.push(centre, b, a); else idx.push(centre, a, b);
    }
  };
  cap(0, false);
  cap(sections.length - 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function mergeAll(geos) {
  const pos = [], nor = [], idx = [];
  let base = 0;
  for (const g0 of geos) {
    const g = g0.index ? g0 : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    const ix = g.index ? Array.from(g.index.array) : [...Array(p.count).keys()];
    for (const v of ix) idx.push(v + base);
    base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}
const box = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
};
const rod = (a, b, r = 0.012) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, 6);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q);
  const m = A.add(B).multiplyScalar(0.5);
  return g.translate(m.x, m.y, m.z);
};


// THE TT-88 AS THE PLAYER'S CAR: just the body (the game adds its own
// wheels, brakes, suspension, cockpit and damage, as for the Caterham).
// addPanel(mesh): a painted panel that can be dented.
export function buildF1Body(car, addPanel) {
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0x14215a, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf0d81e, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.45, metalness: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.85 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.85 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
  };
  // (flat shading: crisp edges between the flat panels, as the cars of the time had)
  MAT.blue.flatShading = MAT.yellow.flatShading = MAT.carbon.flatShading = true;
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };

  // --- the nose and tub: slab-sided and flat-topped, sharp edges, the
  // sides leaning in a little; the nose a flat-topped wedge to a square tip
  const BOXY = 2.6;                                  // (how square the corners are)
  const tub = [
    { z: 2.5, w: 0.15, h: 0.08, y: 0.11, top: 0.9 },
    { z: 2.25, w: 0.26, h: 0.14, y: 0.1, top: 0.88 },
    { z: 1.85, w: 0.36, h: 0.23, y: 0.09, top: 0.86 },
    { z: 1.35, w: 0.46, h: 0.32, y: 0.08, top: 0.84 },
    { z: 0.85, w: 0.56, h: 0.41, y: 0.075, top: 0.82 },
    { z: 0.45, w: 0.64, h: 0.46, y: 0.07, top: 0.8 },
    { z: 0.0, w: 0.68, h: 0.46, y: 0.07, top: 0.8 },
    { z: -0.25, w: 0.68, h: 0.48, y: 0.07, top: 0.8 },
  ];
  add(loft(tub, BOXY, 24, 3, false), MAT.blue);
  // a yellow nose tip and a yellow stripe along the top of the tub
  add(loft([
    { z: 2.52, w: 0.155, h: 0.085, y: 0.108, top: 0.9 }, { z: 2.25, w: 0.265, h: 0.145, y: 0.098, top: 0.88 }, { z: 1.95, w: 0.345, h: 0.215, y: 0.088, top: 0.87 },
  ], BOXY, 24, 3, false), MAT.yellow);
  add(box(0.16, 0.01, 1.25, 0, 0.462, 1.25, -0.11), MAT.yellow);
  // the cockpit opening (dark) with a squared-off rim, the little smoked screen
  add(loft([{ z: 0.62, w: 0.36, h: 0.04, y: 0.52 }, { z: 0.35, w: 0.44, h: 0.05, y: 0.515 }, { z: -0.12, w: 0.44, h: 0.05, y: 0.515 }], 2, 24, 3, false), MAT.carbon);
  const screen = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 8, 1, true, -0.9, 1.8).rotateX(-0.35).translate(0, 0.57, 0.48);
  add(screen, MAT.glass, false);
  // the driver: a helmet with a dark visor, his shoulders just below the rim
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.visor);
  // (a blue and yellow helmet stripe)
  add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.yellow);
  // mirrors: squared-off pods on stalks at the cockpit sides
  for (const s of [1, -1]) {
    add(rod([s * 0.31, 0.5, 0.55], [s * 0.42, 0.6, 0.56], 0.01), MAT.carbon);
    add(box(0.12, 0.07, 0.05, s * 0.45, 0.62, 0.56), MAT.blue);
    add(new THREE.PlaneGeometry(0.105, 0.058).rotateY(Math.PI).translate(s * 0.45, 0.62, 0.534), MAT.visor);
  }

  // --- sidepods: long flat slabs with flat tops and square edges, big
  // radiator mouths at the front, straight-tapered in towards the back wheels
  for (const s of [1, -1]) {
    const pod = [
      { z: 0.56, w: 0.4, h: 0.3, y: 0.055, x: s * 0.52 },
      { z: 0.25, w: 0.44, h: 0.31, y: 0.055, x: s * 0.54 },
      { z: -0.45, w: 0.42, h: 0.29, y: 0.055, x: s * 0.53 },
      { z: -0.95, w: 0.28, h: 0.23, y: 0.055, x: s * 0.44 },
      { z: -1.32, w: 0.16, h: 0.17, y: 0.055, x: s * 0.36 },
    ];
    add(loft(pod, 3.5, 24, 3, false), MAT.blue);
    // the radiator mouth (dark, square) and a yellow stripe along the top edge
    add(box(0.36, 0.25, 0.02, s * 0.52, 0.205, 0.575), MAT.carbon);
    add(box(0.08, 0.012, 1.3, s * 0.55, 0.372, -0.25, 0, -s * 0.11), MAT.yellow);
  }
  // --- engine cover: angular, flat-sided, rising to a tall triangular
  // airbox behind his head, then a straight taper to the gearbox
  add(loft([
    { z: -0.2, w: 0.52, h: 0.48, y: 0.07, top: 0.75 },
    { z: -0.32, w: 0.36, h: 0.72, y: 0.07, top: 0.4 },     // the roll hoop and airbox
    { z: -0.6, w: 0.4, h: 0.6, y: 0.07, top: 0.5 },
    { z: -1.0, w: 0.44, h: 0.42, y: 0.07, top: 0.7 },
    { z: -1.5, w: 0.32, h: 0.3, y: 0.08, top: 0.8 },
    { z: -1.85, w: 0.22, h: 0.2, y: 0.12, top: 0.85 },
  ], 2.2, 24, 3, false), MAT.blue);
  add(box(0.12, 0.08, 0.02, 0, 0.73, -0.3), MAT.carbon);                // the airbox mouth
  add(box(0.05, 0.012, 1.0, 0, 0.6, -0.95, 0.24), MAT.yellow);          // a yellow spine stripe
  // the gearbox at the very back, and the red rain light on it
  add(box(0.22, 0.18, 0.35, 0, 0.2, -2.0), MAT.carbon);
  const rainLight = add(box(0.08, 0.05, 0.03, 0, 0.26, -2.19), MAT.rain);
  // exhausts poking out either side of the gearbox, and the wastegate pipe
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 12, 1, true).rotateX(Math.PI / 2 - 0.25).translate(s * 0.2, 0.36, -1.82), MAT.exhaust);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 10, 1, true).rotateX(Math.PI / 2 - 0.4).translate(0, 0.5, -1.8), MAT.exhaust);

  // --- the flat floor and the diffuser under the back
  add(box(1.3, 0.02, 3.1, 0, 0.045, -0.2), MAT.carbon);
  add(box(0.3, 0.012, 2.6, 0, 0.03, -0.1), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));   // the wooden plank under it (what scrapes)
  add(box(0.9, 0.02, 0.55, 0, 0.13, -1.9, -0.32), MAT.carbon);
  for (const x of [-0.3, 0, 0.3]) add(box(0.012, 0.16, 0.5, x, 0.12, -1.9), MAT.carbon);   // its fences

  // --- front wing: on the sides of the nose, two flat planes each side
  // with flat endplates, swept a touch. Each side, and the rear wing, is
  // its own piece: crushed in a hit, it can snap off (see the game)
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.58, 0.02, 0.32, s * 0.42, 0.09, 2.2, 0.04, -s * 0.06), MAT.blue);
    addTo(g, box(0.5, 0.015, 0.16, s * 0.44, 0.15, 2.05, 0.35, -s * 0.06), MAT.yellow);
    addTo(g, box(0.015, 0.16, 0.44, s * 0.71, 0.13, 2.16), MAT.blue);
  }
  // --- rear wing: big and tall, three elements between tall flat
  // endplates, and the little beam wing low down over the gearbox
  for (const s of [1, -1]) addTo(wings.rear, box(0.02, 0.62, 0.62, s * 0.44, 0.72, -2.0), MAT.yellow);
  addTo(wings.rear, box(0.86, 0.025, 0.24, 0, 0.88, -1.94, 0.12), MAT.blue);
  addTo(wings.rear, box(0.86, 0.02, 0.18, 0, 0.96, -2.12, 0.42), MAT.blue);
  addTo(wings.rear, box(0.86, 0.018, 0.13, 0, 1.01, -2.24, 0.7), MAT.blue);
  add(box(0.7, 0.02, 0.15, 0, 0.42, -1.95, 0.15), MAT.carbon);                // the beam wing (stays)
  addTo(wings.rear, box(0.04, 0.4, 0.06, 0, 0.6, -1.95), MAT.carbon);         // its pillar

  return { helmet: [helmet, visor], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings };
}

// a plain F1 rim of the time: a shallow dish with six slim spokes and a
// big single centre nut (r: its radius, w: its width)
export function buildF1RimGeometry(r, w) {
  const parts = [
    new THREE.CylinderGeometry(r, r, w * 0.92, 28, 1, true).rotateZ(Math.PI / 2),                 // the barrel
    new THREE.TorusGeometry(r, 0.012, 6, 28).rotateY(Math.PI / 2).translate(w * 0.46, 0, 0),        // its lips
    new THREE.TorusGeometry(r, 0.012, 6, 28).rotateY(Math.PI / 2).translate(-w * 0.46, 0, 0),
    new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.05, 16).rotateZ(Math.PI / 2).translate(w * 0.18, 0, 0),   // the hub
    new THREE.CylinderGeometry(0.045, 0.05, 0.07, 6).rotateZ(Math.PI / 2).translate(w * 0.24, 0, 0),         // the centre nut
  ];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const sp = new THREE.BoxGeometry(0.02, r * 0.72, 0.03).translate(0, r * 0.62, 0).rotateX(a).translate(w * 0.16, 0, 0);
    parts.push(sp);
  }
  return mergeAll(parts.map((g) => g.index ? g.toNonIndexed() : g));
}

export function buildF1() {
  const group = new THREE.Group();
  group.visible = false;
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0x14215a, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf0d81e, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.45, metalness: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.85 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.85 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
  };
  const add = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; group.add(m); return m; };

  // --- the nose and tub: low and flat, narrow at the tip, the cockpit
  // opening in the top just ahead of the engine cover
  const tub = [
    { z: 2.5, w: 0.14, h: 0.09, y: 0.11 },
    { z: 2.3, w: 0.24, h: 0.15, y: 0.1 },
    { z: 1.9, w: 0.34, h: 0.24, y: 0.09 },
    { z: 1.4, w: 0.44, h: 0.33, y: 0.08 },
    { z: 0.9, w: 0.54, h: 0.42, y: 0.075 },
    { z: 0.45, w: 0.62, h: 0.47, y: 0.07 },
    { z: 0.0, w: 0.66, h: 0.47, y: 0.07 },
    { z: -0.25, w: 0.66, h: 0.5, y: 0.07 },
  ];
  add(loft(tub, 0.55), MAT.blue);
  // a yellow nose tip and a yellow stripe along the top of the tub
  add(loft([
    { z: 2.52, w: 0.145, h: 0.095, y: 0.108 }, { z: 2.3, w: 0.245, h: 0.155, y: 0.098 }, { z: 2.0, w: 0.325, h: 0.23, y: 0.088 },
  ], 0.55), MAT.yellow);
  add(box(0.16, 0.01, 1.25, 0, 0.47, 1.25, -0.11), MAT.yellow);
  // the cockpit opening (dark), its padded rim, the little smoked screen
  add(loft([{ z: 0.62, w: 0.36, h: 0.04, y: 0.53 }, { z: 0.35, w: 0.44, h: 0.05, y: 0.525 }, { z: -0.12, w: 0.44, h: 0.05, y: 0.525 }], 0.7), MAT.carbon);
  const screen = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16, 1, true, -0.9, 1.8).rotateX(-0.35).translate(0, 0.58, 0.48);
  add(screen, MAT.glass, false);
  // the steering wheel, just visible in the opening
  add(new THREE.TorusGeometry(0.11, 0.014, 6, 18).rotateX(-1.1).translate(0, 0.5, 0.38), MAT.carbon);
  // the driver: a helmet with a dark visor, his shoulders just below the rim
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.visor);
  // (a blue and yellow helmet stripe)
  add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.64, 0.08), MAT.yellow);
  // mirrors: round, on stalks, at the cockpit sides
  for (const s of [1, -1]) {
    add(rod([s * 0.31, 0.5, 0.55], [s * 0.42, 0.6, 0.56], 0.01), MAT.carbon);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16).rotateX(Math.PI / 2).translate(s * 0.44, 0.62, 0.56), MAT.blue);
    add(new THREE.CircleGeometry(0.052, 16).rotateY(Math.PI).translate(s * 0.44, 0.62, 0.538), MAT.visor);
  }

  // --- sidepods: long and flat, big radiator mouths at the front,
  // pinched in towards the back wheels (the coke bottle)
  for (const s of [1, -1]) {
    const pod = [
      { z: 0.55, w: 0.36, h: 0.3, y: 0.06, x: s * 0.5 },
      { z: 0.2, w: 0.42, h: 0.32, y: 0.06, x: s * 0.53 },
      { z: -0.4, w: 0.4, h: 0.3, y: 0.06, x: s * 0.52 },
      { z: -0.9, w: 0.28, h: 0.24, y: 0.06, x: s * 0.44 },
      { z: -1.3, w: 0.16, h: 0.18, y: 0.06, x: s * 0.36 },
    ];
    add(loft(pod, 0.35), MAT.blue);
    // the radiator mouth (dark) and a yellow stripe along the top
    add(box(0.32, 0.24, 0.02, s * 0.5, 0.21, 0.565), MAT.carbon);
    add(box(0.07, 0.012, 1.3, s * 0.53, 0.385, -0.25, 0, -s * 0.11), MAT.yellow);
  }
  // --- engine cover: low, over the turbo engine, rising to the roll hoop
  // and airbox behind his head, then tapering away to the gearbox
  add(loft([
    { z: -0.2, w: 0.5, h: 0.5, y: 0.07 },
    { z: -0.32, w: 0.34, h: 0.72, y: 0.07 },     // the roll hoop and airbox
    { z: -0.55, w: 0.38, h: 0.6, y: 0.07 },
    { z: -1.0, w: 0.42, h: 0.42, y: 0.07 },
    { z: -1.5, w: 0.3, h: 0.3, y: 0.08 },
    { z: -1.85, w: 0.2, h: 0.2, y: 0.12 },
  ], 0.5), MAT.blue);
  add(box(0.12, 0.08, 0.02, 0, 0.73, -0.3), MAT.carbon);                // the airbox mouth
  add(box(0.06, 0.012, 1.0, 0, 0.6, -0.95, 0.24), MAT.yellow);          // a yellow spine stripe
  // the gearbox at the very back, and the red rain light on it
  add(box(0.22, 0.18, 0.35, 0, 0.2, -2.0), MAT.carbon);
  const rainLight = add(box(0.08, 0.05, 0.03, 0, 0.26, -2.19), MAT.rain);
  // exhausts poking out either side of the gearbox, and the wastegate pipe
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 12, 1, true).rotateX(Math.PI / 2 - 0.25).translate(s * 0.2, 0.36, -1.82), MAT.exhaust);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 10, 1, true).rotateX(Math.PI / 2 - 0.4).translate(0, 0.5, -1.8), MAT.exhaust);

  // --- the flat floor and the diffuser under the back
  add(box(1.3, 0.02, 3.1, 0, 0.05, -0.2), MAT.carbon);
  add(box(0.9, 0.02, 0.55, 0, 0.13, -1.9, -0.32), MAT.carbon);
  for (const x of [-0.3, 0, 0.3]) add(box(0.012, 0.16, 0.5, x, 0.12, -1.9), MAT.carbon);   // its fences

  // --- front wing: on the sides of the nose, two flat planes each side
  // with flat endplates, swept a touch
  for (const s of [1, -1]) {
    add(box(0.58, 0.02, 0.32, s * 0.42, 0.09, 2.2, 0.04, -s * 0.06), MAT.blue);
    add(box(0.5, 0.015, 0.16, s * 0.44, 0.15, 2.05, 0.35, -s * 0.06), MAT.yellow);
    add(box(0.015, 0.16, 0.44, s * 0.71, 0.13, 2.16), MAT.blue);
  }
  // --- rear wing: big and tall, three elements between tall flat
  // endplates, and the little beam wing low down over the gearbox
  for (const s of [1, -1]) add(box(0.02, 0.62, 0.62, s * 0.44, 0.72, -2.0), MAT.yellow);
  add(box(0.86, 0.025, 0.24, 0, 0.88, -1.94, 0.12), MAT.blue);
  add(box(0.86, 0.02, 0.18, 0, 0.96, -2.12, 0.42), MAT.blue);
  add(box(0.86, 0.018, 0.13, 0, 1.01, -2.24, 0.7), MAT.blue);
  add(box(0.7, 0.02, 0.15, 0, 0.42, -1.95, 0.15), MAT.carbon);
  add(box(0.04, 0.4, 0.06, 0, 0.6, -1.95), MAT.carbon);                  // its pillar

  // --- suspension: thin steel wishbones from the tub out to each wheel,
  // pushrods, and brake ducts on the front uprights
  const W = { fz: 1.62, rz: -1.28, x: 0.88 };
  const arms = [];
  for (const s of [1, -1]) {
    const fx = s * (W.x - 0.12), rx = s * (W.x - 0.14);
    arms.push(rod([s * 0.2, 0.32, 1.85], [fx, 0.36, W.fz]), rod([s * 0.22, 0.3, 1.4], [fx, 0.36, W.fz]));     // upper front
    arms.push(rod([s * 0.18, 0.14, 1.85], [fx, 0.2, W.fz]), rod([s * 0.22, 0.13, 1.35], [fx, 0.2, W.fz]));    // lower front
    arms.push(rod([s * 0.2, 0.44, 1.6], [fx, 0.22, W.fz], 0.009));                                             // pushrod
    arms.push(rod([s * 0.2, 0.3, -1.55], [rx, 0.38, W.rz]), rod([s * 0.3, 0.3, -1.0], [rx, 0.38, W.rz]));     // upper rear
    arms.push(rod([s * 0.2, 0.12, -1.6], [rx, 0.18, W.rz]), rod([s * 0.32, 0.12, -0.95], [rx, 0.18, W.rz]));  // lower rear
    arms.push(rod([s * 0.12, 0.25, -1.75], [rx, 0.28, W.rz], 0.02));                                           // driveshaft
  }
  add(mergeAll(arms), MAT.steel);

  // --- the wheels: big slicks (much wider at the back), plain rims with
  // a single centre nut, carbon brakes that glow when they're hot
  const tyreGeo = (r, w) => {
    const prof = [];
    const side = 0.12 * r;
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI;
      prof.push(new THREE.Vector2(r - side + Math.sin(a) * side, -w / 2 + (1 - Math.cos(a)) / 2 * w));
    }
    prof.unshift(new THREE.Vector2(r * 0.62, -w / 2));
    prof.push(new THREE.Vector2(r * 0.62, w / 2));
    return new THREE.LatheGeometry(prof, 32).rotateZ(Math.PI / 2);
  };
  const rimGeo = (r, w) => mergeAll([
    new THREE.CylinderGeometry(r * 0.62, r * 0.62, w * 0.9, 24, 1, true).rotateZ(Math.PI / 2),
    new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.01, 24).rotateZ(Math.PI / 2),
    new THREE.CylinderGeometry(0.035, 0.035, w * 0.6, 8).rotateZ(Math.PI / 2),
  ]);
  const wheels = [
    { x: W.x, z: W.fz, r: 0.31, w: 0.3, front: true },
    { x: -W.x, z: W.fz, r: 0.31, w: 0.3, front: true },
    { x: W.x - 0.03, z: W.rz, r: 0.33, w: 0.42, front: false },
    { x: -(W.x - 0.03), z: W.rz, r: 0.33, w: 0.42, front: false },
  ].map((w) => {
    const steerer = new THREE.Group();
    steerer.position.set(w.x, w.r, w.z);
    group.add(steerer);
    const spin = new THREE.Group();
    steerer.add(spin);
    const t = new THREE.Mesh(tyreGeo(w.r, w.w), MAT.tyre); t.castShadow = true; spin.add(t);
    spin.add(new THREE.Mesh(rimGeo(w.r, w.w), MAT.rim));
    if (w.front) steerer.add(new THREE.Mesh(box(0.08, 0.12, 0.14, -Math.sign(w.x) * 0.18, 0, 0.05), MAT.blue));   // brake duct
    return { steerer, spin, ...w };
  });

  let spinAngle = 0;
  return {
    group,
    // where the cameras go on this car (car's own frame: +z forward)
    views: {
      bonnet: { spot: new THREE.Vector3(0, 0.62, 0.95), pitch: -0.06 },
      cockpit: { spot: new THREE.Vector3(0, 0.7, 0.12), pitch: -0.1 },
      tcam: { spot: new THREE.Vector3(0, 0.98, -0.32), pitch: -0.08 },
    },
    // in the driver's own view his helmet is hidden (the camera is in it)
    setFirstPerson(on) { helmet.visible = visor.visible = !on; },
    update(dt, { steer = 0, speed = 0, rpm = 0, boost = 0, braking = false, rain = 0, lights = false }) {
      spinAngle += Math.max(-120, Math.min(120, speed / 0.32)) * dt;
      wheels.forEach((w) => {
        w.spin.rotation.x = spinAngle;
        if (w.front) w.steerer.rotation.y = steer;
      });
      // exhausts glow with the revs and boost
      MAT.exhaust.emissiveIntensity = Math.max(0, (rpm / 12500 - 0.55)) * 3 * (0.5 + boost);
      MAT.rain.emissiveIntensity = (rain > 0.2 || lights) ? 2.5 : braking ? 1.2 : 0;
    },
  };
}

// =====================================================================
// THE TT-88's COCKPIT (seen from the driver's seat): the tub's padded
// sides, a carbon dash with a little screen and shift lights, the small
// steering wheel on its column, the gear lever on the RIGHT, and the
// driver's arms: hands on the wheel, fighting it all the time (a stiff,
// twitchy car on slicks: little corrections every moment, more the faster
// and harder it's going and over bumps), the right hand going to the lever
// for every gear change. His head is shaken about with it (the camera).
// =====================================================================
export function buildF1Cockpit(car) {
  const group = new THREE.Group();
  car.add(group);
  const M = {
    carbon: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.45, metalness: 0.3 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x23252b, roughness: 0.95 }),
    suit: new THREE.MeshStandardMaterial({ color: 0x1d2c6e, roughness: 0.8 }),
    glove: new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.7 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9a9da3, roughness: 0.3, metalness: 0.9 }),
    knob: new THREE.MeshStandardMaterial({ color: 0xf0d81e, roughness: 0.3, metalness: 0.2 }),
  };
  const add = (geo, mat, parent = group) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; parent.add(m); return m; };
  // the tub's inside: padded sides either side of him, the dash in front
  add(box(0.04, 0.16, 0.7, 0.23, 0.44, 0.22), M.pad);
  add(box(0.04, 0.16, 0.7, -0.23, 0.44, 0.22), M.pad);
  add(box(0.42, 0.13, 0.05, 0, 0.47, 0.6, -0.5), M.carbon);
  // the screen: gear, revs, speed, and a row of shift lights over it
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 96;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = add(new THREE.PlaneGeometry(0.17, 0.064), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 0.49, 0.575); screen.rotation.set(-0.5, Math.PI, 0);
  // the steering column and wheel (a small one, with two grips)
  const column = new THREE.Group();
  column.position.set(0, 0.52, 0.42);
  column.rotation.x = -0.45;                       // tilted back towards him
  group.add(column);
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10).rotateX(Math.PI / 2).translate(0, 0, 0.1), M.steel, column);
  const wheel = new THREE.Group();
  column.add(wheel);
  add(new THREE.TorusGeometry(0.13, 0.016, 8, 28), M.carbon, wheel);
  for (const sx of [1, -1]) add(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 12).translate(sx * 0.13, 0, 0), M.grip, wheel);
  add(box(0.18, 0.05, 0.02, 0, 0, 0), M.carbon, wheel);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14).rotateX(Math.PI / 2), M.knob, wheel);   // the hub badge (plain yellow)
  // the gear lever on the right (sequential: pull back to change up, push to change down)
  const lever = new THREE.Group();
  lever.position.set(-0.2, 0.42, 0.3);
  group.add(lever);
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8).translate(0, 0.07, 0), M.steel, lever);
  const knob = add(new THREE.SphereGeometry(0.022, 12, 10).translate(0, 0.145, 0), M.knob, lever);
  add(box(0.05, 0.02, 0.1, -0.2, 0.42, 0.3), M.carbon);              // its gate
  // the driver: shoulders and chest just under the rim, arms to the wheel
  add(new THREE.CapsuleGeometry(0.15, 0.12, 6, 12).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.02), M.suit);
  const arms = [0, 1].map(() => ({
    upper: add(new THREE.CapsuleGeometry(0.04, 0.26, 6, 10), M.suit),
    fore: add(new THREE.CapsuleGeometry(0.035, 0.25, 6, 10), M.suit),
    hand: add(new THREE.SphereGeometry(0.035, 12, 10).scale(1, 0.85, 1.3), M.glove),
  }));
  const SH = [new THREE.Vector3(-0.17, 0.5, 0), new THREE.Vector3(0.17, 0.5, 0)];   // right, left shoulder
  const V = { a: new THREE.Vector3(), d: new THREE.Vector3(), e: new THREE.Vector3(), p: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), dir: new THREE.Vector3() };
  const seg = (m, a, b, len) => { V.dir.subVectors(b, a); const l = V.dir.length(); m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V.up, V.dir.divideScalar(l || 1)); m.scale.set(1, l / len, 1); };
  const reach = (i, target, pole) => {
    const U = 0.26, F = 0.25, sh = SH[i];
    V.d.subVectors(target, sh);
    let len = V.d.length();
    if (len > U + F - 0.005) { V.d.multiplyScalar((U + F - 0.005) / len); len = U + F - 0.005; }
    const along = (U * U - F * F + len * len) / (2 * len), lift = Math.sqrt(Math.max(0, U * U - along * along));
    V.dir.copy(V.d).normalize();
    V.p.copy(pole).addScaledVector(V.dir, -pole.dot(V.dir)).normalize();
    const elbow = V.e.copy(sh).addScaledVector(V.dir, along).addScaledVector(V.p, lift).clone();
    const hand = sh.clone().add(V.d);
    seg(arms[i].upper, sh, elbow, U); seg(arms[i].fore, elbow, hand, F);
    arms[i].hand.position.copy(hand);
  };
  const POLE = [new THREE.Vector3(-1, -0.6, -0.3), new THREE.Vector3(1, -0.6, -0.3)];
  const head = new THREE.Vector3();
  let t = 0, shift = 1, shiftDir = 0, fight = 0, panelClock = 0, wheelAngle = 0;
  const gripPt = new THREE.Vector3(), knobPt = new THREE.Vector3();
  return {
    group,
    head,                                          // how far his head is thrown about (car's frame): add to the eye
    // a gear change: his right hand goes to the lever
    onShift(direction) { shift = 0; shiftDir = direction > 0 ? 1 : -1; },
    update(dt, { steer = 0, maxSteer = 0.36, speed = 0, slip = 0, bump = 0, gear = 'N', rpm = 0, redline = 12500, kmh = 0 }) {
      t += dt;
      // how hard he's fighting it: the speed, how much it's sliding, the bumps
      const want = Math.min(1, Math.abs(speed) / 70) * 0.5 + Math.min(1, Math.abs(slip) / 3) * 0.8 + Math.min(1, bump * 25) * 0.6 + (Math.abs(speed) > 2 ? 0.15 : 0);
      fight += (want - fight) * Math.min(1, dt * 4);
      const jitter = fight * (Math.sin(t * 11.3) * 0.05 + Math.sin(t * 17.9 + 1) * 0.035 + Math.sin(t * 5.1 + 2) * 0.06 + (Math.random() - 0.5) * 0.05);
      // the wheel: his steering (about a quarter turn either way at full lock) and the fight
      const target = (steer / maxSteer) * (Math.PI * 0.5) + jitter + slip * 0.04;
      wheelAngle += (target - wheelAngle) * Math.min(1, dt * 25);
      wheel.rotation.z = -wheelAngle;
      // his head thrown about with it
      head.set(fight * 0.012 * Math.sin(t * 9.7) + bump * 0.2 * (Math.random() - 0.5), fight * 0.01 * Math.sin(t * 13.1 + 0.5) + bump * 0.3 * (Math.random() - 0.5), 0);
      // hands on the grips (the right one away to the lever during a change)
      group.updateMatrixWorld(true);
      for (let i = 0; i < 2; i++) {
        wheel.localToWorld(gripPt.set(i === 0 ? -0.13 : 0.13, 0, -0.02));
        group.worldToLocal(gripPt);
        if (i === 0 && shift < 1) {
          shift = Math.min(1, shift + dt / 0.38);
          const out = shift < 0.3 ? shift / 0.3 : shift > 0.7 ? (1 - shift) / 0.3 : 1;
          const throwL = shift > 0.3 && shift < 0.7 ? Math.sin(Math.PI * (shift - 0.3) / 0.4) : 0;
          lever.rotation.x = -shiftDir * 0.35 * throwL;
          lever.updateMatrixWorld(true);
          knob.getWorldPosition(knobPt); group.worldToLocal(knobPt);
          gripPt.lerp(knobPt, Math.min(1, out));
        } else if (i === 0) lever.rotation.x = 0;
        reach(i, gripPt, POLE[i]);
      }
      // the screen and shift lights, ten times a second
      panelClock -= dt;
      if (panelClock <= 0) {
        panelClock = 0.1;
        const g = cv.getContext('2d');
        g.fillStyle = '#05070a'; g.fillRect(0, 0, 256, 96);
        const lit = Math.max(0, Math.min(10, Math.round((rpm / redline - 0.75) / 0.025)));
        for (let k = 0; k < 10; k++) { g.fillStyle = k < lit ? (k < 4 ? '#2bd14a' : k < 8 ? '#ff3b2b' : '#3a7bff') : '#1a1c22'; g.fillRect(8 + k * 24.5, 6, 20, 12); }
        g.fillStyle = '#f2f2ea'; g.font = 'bold 48px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(gear, 128, 60);
        g.font = 'bold 20px sans-serif'; g.textAlign = 'left'; g.fillText(String(Math.round(kmh)), 10, 62);
        g.textAlign = 'right'; g.fillText(String(Math.round(rpm / 100) * 100), 248, 62);
        tex.needsUpdate = true;
      }
    },
  };
}
