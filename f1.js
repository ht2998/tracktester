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
export const BUILD = 5;

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
  turboV6: { name: '1.5 turbo V6 (race boost)', cylinders: 6, idleRpm: 3200, redline: 12500, launchRpm: 8500, engineBraking: 60, peakTorque: 420, massDelta: 0,
    torqueCurve: [[2500, 230], [4000, 280], [6000, 330], [8000, 390], [9500, 415], [10500, 420], [11500, 405], [12500, 385], [13000, 160], [13300, 0]],
    turbo: { onRpm: 4500, fullRpm: 8000, lag: 0.6, base: 0.55 } },
  quali: { name: '1.5 turbo V6 (qualifying boost)', cylinders: 6, idleRpm: 3200, redline: 12800, launchRpm: 9000, engineBraking: 60, peakTorque: 640, massDelta: 0,
    torqueCurve: [[2500, 300], [4000, 360], [6000, 450], [8000, 570], [9500, 630], [10500, 640], [11500, 610], [12800, 560], [13200, 200], [13500, 0]],
    turbo: { onRpm: 5000, fullRpm: 8800, lag: 0.85, base: 0.45 }, wear: 4 },
  v10: { name: '3.5 V10', cylinders: 10, idleRpm: 3500, redline: 14000, launchRpm: 9500, engineBraking: 75, peakTorque: 385, massDelta: 15,
    torqueCurve: [[2500, 170], [5000, 260], [8000, 330], [10000, 365], [11500, 385], [13000, 370], [14000, 350], [14500, 140], [14800, 0]], turbo: null },
  // an early-2000s F1 V10, on the figures BMW published for theirs: 3.0
  // litres, 90 degrees, idling at 4,000, a 19,200 limit, over 900 bhp,
  // under 90 kg (the short-stroke shape of Cosworth's: 95 x 42.3 mm)
  v10x: { name: '3.0 V10 (2003 F1-style, 19,200 rpm)', voice: 'v10', cylinders: 10, idleRpm: 4000, redline: 19200, launchRpm: 12000, engineBraking: 90, peakTorque: 365, massDelta: -10,
    torqueCurve: [[3000, 150], [6000, 220], [9000, 280], [12000, 320], [15000, 352], [17000, 365], [18500, 357], [19200, 345], [19500, 150], [19800, 0]], turbo: null },
  v12: { name: '3.5 V12', cylinders: 12, idleRpm: 3800, redline: 13500, launchRpm: 9000, engineBraking: 80, peakTorque: 360, massDelta: 30,
    torqueCurve: [[2500, 160], [5000, 240], [8000, 310], [10000, 345], [11500, 360], [12800, 350], [13500, 335], [14000, 130], [14300, 0]], turbo: null },
  v8: { name: '5.0 V8 (muscle)', cylinders: 8, idleRpm: 750, redline: 7000, launchRpm: 3800, engineBraking: 70, peakTorque: 560, massDelta: 90,
    torqueCurve: [[700, 300], [1500, 400], [2500, 480], [3500, 540], [4800, 560], [5800, 530], [6500, 490], [7000, 460], [7300, 180], [7500, 0]], turbo: null },
  diesel: { name: '4.2 six-cylinder diesel (from the secret)', cylinders: 6, idleRpm: 720, redline: 2700, launchRpm: 1400, engineBraking: 90, peakTorque: 640, massDelta: 380,
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
  if (!(car.keepGears && key === car.stockEngine)) {
    const n = car.gears.length;
    const firstShare = clamp(0.24 + 0.14 * (e.idleRpm / e.redline), 0.24, 0.42);
    const top = 1;
    const first = top / firstShare;
    s.gears = [];
    for (let i = 0; i < n; i++) s.gears.push(+(first * Math.pow(top / first, Math.pow(i / (n - 1), 0.88))).toFixed(3));
  }
  const top = s.gears[s.gears.length - 1];
  s.finalDrive = (e.redline * Math.PI / 30) * car.wheelRadius / (vTop * top);
  s.autoUpshiftKmh = s.gears.slice(0, -1).map((g) => Math.round((e.redline * 0.97 * Math.PI / 30) * car.wheelRadius / (g * s.finalDrive) * 3.6));
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
  baseMass: 600,              // kg with the driver and some fuel
  inertia: 900,
  airInertia: { pitch: 950, yaw: 980, roll: 260 },
  cgToFront: 1.62, cgToRear: 1.28,     // a long car (2.9 m between the axles)
  trackHalf: 0.88,
  wheelRadius: 0.33,
  frontGrip: 1.75, rearGrip: 1.95,     // slicks
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
    springFront: 95000, springRear: 115000, damperFront: 6000, damperRear: 6800,
    arbFront: 30000, arbRear: 14000, bumpStop: 0.03, bumpStopRate: 400000, droop: 0.04,
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
function loft(sections, round = 0.5, around = 16) {
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
      pts.push([x + (s.x || 0), y + s.y + s.h / 2, s.z]);
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
