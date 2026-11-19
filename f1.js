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
// ENGINE SWAP (the side panel's Engine list): any engine in any car. Each one brings its
// own power, revs, weight and sound; the gearing is worked out again to
// suit it.
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 31;

import * as THREE from 'three';
import { CATERHAM } from './physics.js';

// ---------------------------------------------------------------------
// ENGINES. torqueCurve: [rpm, Nm] (at full boost for a turbo). turbo: the
// boost comes in between onRpm and fullRpm, takes `lag` seconds to build,
// and without it the engine makes `base` of its torque.
// ---------------------------------------------------------------------
export const ENGINES = {
  duratec: { engineInertia: 0.12, name: '2.0 inline-4 (Caterham)', cylinders: 4, idleRpm: 900, redline: 7600, launchRpm: 4500, engineBraking: 38, peakTorque: 203, massDelta: 0,
    torqueCurve: CATERHAM.torqueCurve, turbo: null },
  turboV6: { engineInertia: 0.08, sound: { tone: 1.15, bass: 1, drive: 1.25, vol: 1.1 }, name: '1.5 turbo V6 (race boost)', cylinders: 6, idleRpm: 3200, redline: 12500, launchRpm: 8500, engineBraking: 60, peakTorque: 420, massDelta: 0,
    torqueCurve: [[2500, 230], [4000, 280], [6000, 330], [8000, 390], [9500, 415], [10500, 420], [11500, 405], [12500, 385], [13000, 160], [13300, 0]],
    turbo: { onRpm: 4500, fullRpm: 8000, lag: 0.6, base: 0.55 } },
  quali: { engineInertia: 0.08, sound: { tone: 1.2, bass: 1, drive: 1.35, vol: 1.2 }, name: '1.5 turbo V6 (qualifying boost)', cylinders: 6, idleRpm: 3200, redline: 12800, launchRpm: 9000, engineBraking: 60, peakTorque: 640, massDelta: 0,
    torqueCurve: [[2500, 300], [4000, 360], [6000, 450], [8000, 570], [9500, 630], [10500, 640], [11500, 610], [12800, 560], [13200, 200], [13500, 0]],
    turbo: { onRpm: 5000, fullRpm: 8800, lag: 0.85, base: 0.45 }, wear: 4 },
  v10: { engineInertia: 0.06, sound: { tone: 1.3, bass: 1, drive: 1.3, vol: 1.25 }, name: '3.5 V10', cylinders: 10, idleRpm: 3500, redline: 14000, launchRpm: 9500, engineBraking: 75, peakTorque: 385, massDelta: 15,
    torqueCurve: [[2500, 170], [5000, 260], [8000, 330], [10000, 365], [11500, 385], [13000, 370], [14000, 350], [14500, 140], [14800, 0]], turbo: null },
  // an early-2000s F1 V10, on the figures BMW published for theirs: 3.0
  // litres, 90 degrees, idling at 4,000, a 19,200 limit, over 900 bhp,
  // under 90 kg (the short-stroke shape of Cosworth's: 95 x 42.3 mm)
  // (seven gears, like the real cars of 2005: each change up lands a little higher)
  v10x: { engineInertia: 0.055, name: '3.0 V10 (19,200 rpm)', voice: 'v10', shiftAt: [17800 / 19200, 18000 / 19200, 18150 / 19200, 18300 / 19200, 18500 / 19200, 18650 / 19200], landAt: [14000, 14500, 15000, 15500, 16000, 16400], autoDownRpm: 16500, cylinders: 10, idleRpm: 4000, redline: 19200, launchRpm: 12000, engineBraking: 90, peakTorque: 365, massDelta: -10,
    torqueCurve: [[3000, 150], [6000, 220], [9000, 280], [12000, 320], [15000, 352], [17000, 365], [18500, 357], [19200, 345], [19500, 150], [19800, 0]], turbo: null },
  // (the 3.5 V12 of 1994, the most powerful of the decade's V12s: about
  // 830 hp at 15,800 rpm, revving to 16,000)
  v12: { engineInertia: 0.07, voice: 'v12', shiftAt: [15300 / 16000, 15400 / 16000, 15500 / 16000, 15600 / 16000, 15700 / 16000], landAt: [11700, 12100, 12500, 12900, 13300], sound: { tone: 1.4, bass: 0, drive: 1.15, vol: 1.25 }, name: '3.5 V12', cylinders: 12, idleRpm: 4000, redline: 16000, launchRpm: 10500, engineBraking: 82, peakTorque: 382, massDelta: 30,
    torqueCurve: [[2500, 150], [5000, 230], [8000, 300], [10000, 340], [12000, 368], [13500, 382], [14800, 380], [15800, 374], [16000, 365], [16400, 140], [16700, 0]], turbo: null },
  v8f: { engineInertia: 0.055, name: '2.4 V8 flat-plane (2006 F1-style, 19,000 rpm)', voice: 'v8f', shiftAt: [17600 / 19000, 17800 / 19000, 17950 / 19000, 18100 / 19000, 18300 / 19000, 18450 / 19000], landAt: [13800, 14300, 14800, 15300, 15800, 16200], cylinders: 8, idleRpm: 4000, redline: 19000, launchRpm: 12000, engineBraking: 85, peakTorque: 290, massDelta: -15,
    torqueCurve: [[3000, 120], [6000, 175], [9000, 225], [12000, 260], [15000, 282], [17000, 290], [18300, 284], [19000, 272], [19300, 120], [19600, 0]], turbo: null },
  v8: { engineInertia: 0.22, sound: { tone: 0.8, bass: 6, drive: 1.7, vol: 1.2 }, name: '5.0 V8 (muscle)', cylinders: 8, idleRpm: 750, redline: 7000, launchRpm: 3800, engineBraking: 70, peakTorque: 560, massDelta: 90,
    torqueCurve: [[700, 300], [1500, 400], [2500, 480], [3500, 540], [4800, 560], [5800, 530], [6500, 490], [7000, 460], [7300, 180], [7500, 0]], turbo: null },
  diesel: { engineInertia: 0.5, sound: { tone: 0.6, bass: 6, drive: 1.8, vol: 1.1 }, name: '4.2 six-cylinder diesel', cylinders: 6, idleRpm: 720, redline: 2700, launchRpm: 1400, engineBraking: 90, peakTorque: 640, massDelta: 380,
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
  antiStall: true,          // (anti-stall: the clutch opens itself before the engine dies)
  radiatorSides: true,      // (its radiators are in the sidepods, not the nose)
  engineRear: true,         // (mid-engined: behind the driver)
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
// THE TT-05: an original mid-2000s V10 Formula 1 car (a tribute to the
// cars of 2005: no real make, badges or livery). Long, low and narrow,
// 3.1 m between the axles, about 605 kg with the driver, a raised nose,
// waisted sidepods, high cockpit sides, grooved tyres; lots more
// downforce than the TT-88 and a little less mechanical grip
export const F05_CAR = {
  ...F1_CAR,
  name: 'TT-05',
  body: 'f05',
  grooved: true,
  stockEngine: 'v10x',
  baseMass: 615,                     // (605 kg once the V10's fitted)
  inertia: 960,
  airInertia: { pitch: 1000, yaw: 1030, roll: 250 },
  cgToFront: 1.67, cgToRear: 1.43,   // 3.1 m between the axles, a little more weight on the back
  trackHalf: 0.73,                   // (1.46 m: narrow, under the 1.8 m width limit)
  wheelRadius: 0.33,
  frontGrip: 1.38, rearGrip: 1.52,   // (grooved tyres: a little less grip than the TT-88's slicks)
  cgHeight: 0.25,
  downforce: 1.95,                   // about 2.5 times its weight at 300 km/h
  downforceFront: 0.44,
  drag: 0.66,
  brakeForce: 26000, brakeBias: 0.58,
  maxSteer: 0.33, steerSpeed: 3.4,
  frontStiffness: 76000, rearStiffness: 88000,
  suspension: { ...F1_CAR.suspension, springFront: 190000, springRear: 205000, damperFront: 9800, damperRear: 10400 },
  shiftTime: { manual: 0.05, auto: 0.12 },
  fuelCapacity: 140,
};
// THE TT-94: an original 1994 V12 Formula 1 car (a tribute to the cars of
// that year: no real make, badges or livery). On slicks, with the
// stepped floor, a raised nose and a drooping front wing, big sidepods,
// a tall airbox, the 3.5 V12 at 16,000 rpm through six gears on paddles.
// More downforce than the TT-88, a lot less than the TT-05; more grip
// than either (slicks, and wide)
export const F94_CAR = {
  ...F1_CAR,
  name: 'TT-94',
  body: 'f94',
  stockEngine: 'v12',
  baseMass: 570,                     // (about 600 kg with the V12 and the driver)
  inertia: 930,
  airInertia: { pitch: 980, yaw: 1000, roll: 270 },
  cgToFront: 1.62, cgToRear: 1.33,   // 2.95 m between the axles
  trackHalf: 0.83,
  wheelRadius: 0.33,
  frontGrip: 1.5, rearGrip: 1.64,    // (wide slicks)
  cgHeight: 0.27,
  downforce: 1.6,
  downforceFront: 0.43,
  drag: 0.7,
  brakeForce: 24000, brakeBias: 0.59,
  maxSteer: 0.34, steerSpeed: 3.3,
  frontStiffness: 74000, rearStiffness: 86000,
  shiftTime: { manual: 0.06, auto: 0.14 },
  fuelCapacity: 200,
};
export const STOCK_ENGINE = { caterham: 'duratec', f1: 'turboV6', f05: 'v10x', f94: 'v12' };
export const specForKind = (kind) => (kind === 'f05' ? F05_CAR : kind === 'f94' ? F94_CAR : kind === 'f1' ? F1_CAR : CATERHAM_CAR);
// where each single-seater's wheels are: [x, z, width] (left, right; front then back)
export const WHEEL_LAYOUT = {
  f1: [[0.88, 1.62, 0.3], [-0.88, 1.62, 0.3], [0.88, -1.28, 0.42], [-0.88, -1.28, 0.42]],
  f05: [[0.73, 1.67, 0.28], [-0.73, 1.67, 0.28], [0.73, -1.43, 0.35], [-0.73, -1.43, 0.35]],
  f94: [[0.83, 1.62, 0.3], [-0.83, 1.62, 0.3], [0.83, -1.33, 0.39], [-0.83, -1.33, 0.39]],
};

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
// The same rounded-box sections as loft(), with the top cut open between
// ±open(z) (the cockpit: where he sits). inset: a skin that much inside
// (the tub's inner wall and floor); flip: facing inwards.
function loftOpen(sections0, round, steps, open, inset = 0, flip = false) {
  const sections = [];
  for (let i = 0; i < sections0.length - 1; i++) {
    const a = sections0[i], b = sections0[i + 1];
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      sections.push({ z: a.z + (b.z - a.z) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t, y: a.y + (b.y - a.y) * t, top: (a.top ?? 1) + ((b.top ?? 1) - (a.top ?? 1)) * t });
    }
  }
  sections.push(sections0[sections0.length - 1]);
  const e = 2 / (1 + round * 3), N = 40;
  const pt = (s, a) => {
    const c = Math.cos(a), si = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), e) * (s.w / 2 - inset);
    const y = Math.sign(si) * Math.pow(Math.abs(si), e) * (s.h / 2 - inset);
    const lean = y > 0 ? 1 - (1 - (s.top ?? 1)) * (y / (s.h / 2)) : 1;
    return [x * lean, y + s.y + s.h / 2, s.z];
  };
  // (where each ring meets the opening: the angle at which it's open(z) out from the middle)
  const edge = (s) => {
    const ow = open(s.z);
    let lo = Math.PI / 2, hi = Math.PI;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (-pt(s, m)[0] < ow) lo = m; else hi = m; }
    return lo;
  };
  const pos = [], idx = [];
  for (const sec of sections) {
    const a1 = edge(sec), span = 3 * Math.PI - 2 * a1;
    for (let j = 0; j < N; j++) pos.push(...pt(sec, a1 + span * j / (N - 1)));
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < N - 1; j++) {
      const a = i * N + j, b = i * N + j + 1, c = (i + 1) * N + j, d = (i + 1) * N + j + 1;
      if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.edge = (z) => { const s = sections.reduce((b, x) => (Math.abs(x.z - z) < Math.abs(b.z - z) ? x : b)); return pt(s, edge(s)); };
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
  MAT.seat = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 });   // (the seat and the cockpit's padded rim)
  MAT.suit = new THREE.MeshStandardMaterial({ color: 0x1d2c6e, roughness: 0.8 });   // (the driver's overalls)
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
    { z: 0.62, w: 0.606, h: 0.439, y: 0.072, top: 0.81 },
  ];
  add(loft(tub, BOXY, 24, 3, false), MAT.blue);
  // the cockpit: the tub open on top where he sits, its inside in black,
  // a moulded seat, his legs running forward under the scuttle
  const pit = [
    { z: 0.62, w: 0.606, h: 0.439, y: 0.072, top: 0.81 },
    { z: 0.45, w: 0.64, h: 0.46, y: 0.07, top: 0.8 },
    { z: 0.0, w: 0.68, h: 0.46, y: 0.07, top: 0.8 },
    { z: -0.12, w: 0.68, h: 0.47, y: 0.07, top: 0.8 },
  ];
  const opening = (z) => (z > 0.35 ? 0.18 + (0.62 - z) / 0.27 * 0.04 : 0.22);
  const shell = loftOpen(pit, BOXY, 3, opening);
  add(shell, MAT.blue);
  add(loftOpen(pit, BOXY, 3, opening, 0.025, true), MAT.carbon, false);
  add(loft([{ z: -0.12, w: 0.68, h: 0.47, y: 0.07, top: 0.8 }, { z: -0.25, w: 0.68, h: 0.48, y: 0.07, top: 0.8 }], BOXY, 24, 1, false), MAT.blue);
  // (the padded rim round the opening)
  const rimZ = [0.62, 0.5, 0.35, 0.15, 0, -0.12];
  for (const sx of [1, -1]) for (let i = 0; i < rimZ.length - 1; i++) {
    const a = shell.userData.edge(rimZ[i]), b = shell.userData.edge(rimZ[i + 1]);
    add(rod([sx * -a[0], a[1], a[2]], [sx * -b[0], b[1], b[2]], 0.022), MAT.seat, false);
  }
  for (const z of [0.62, -0.12]) { const a = shell.userData.edge(z); add(rod([a[0], a[1], z], [-a[0], a[1], z], 0.022), MAT.seat, false); }
  // the seat: a moulded shell, low down, its back leaning well back
  add(box(0.34, 0.05, 0.36, 0, 0.12, 0.1), MAT.seat, false);
  add(box(0.36, 0.42, 0.05, 0, 0.32, -0.07, -0.32), MAT.seat, false);
  for (const sx of [1, -1]) add(box(0.04, 0.16, 0.36, sx * 0.17, 0.2, 0.08), MAT.seat, false);
  // his legs, forward and a little raised, under the scuttle (always there)
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.2, 0.02], [sx * 0.09, 0.3, 0.55], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.3, 0.55], [sx * 0.07, 0.22, 1.0], 0.045), MAT.suit, false);
  }
  // his body, arms and a wheel (the computer drivers' and the Garage's cars;
  // the player's car has its own moving ones in the cockpit, so the game hides this)
  const driver = new THREE.Group();
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.46, -0.02), MAT.suit);
  for (const sx of [1, -1]) {
    dAdd(rod([sx * 0.17, 0.49, 0], [sx * 0.15, 0.4, 0.22], 0.04), MAT.suit);
    dAdd(rod([sx * 0.15, 0.4, 0.22], [sx * 0.12, 0.5, 0.4], 0.035), MAT.suit);
  }
  dAdd(new THREE.TorusGeometry(0.13, 0.016, 6, 20).rotateX(-0.45).translate(0, 0.52, 0.44), MAT.carbon);
  // a yellow nose tip and a yellow stripe along the top of the tub
  add(loft([
    { z: 2.52, w: 0.155, h: 0.085, y: 0.108, top: 0.9 }, { z: 2.25, w: 0.265, h: 0.145, y: 0.098, top: 0.88 }, { z: 1.95, w: 0.345, h: 0.215, y: 0.088, top: 0.87 },
  ], BOXY, 24, 3, false), MAT.yellow);
  add(box(0.16, 0.01, 1.25, 0, 0.462, 1.25, -0.11), MAT.yellow);
  // the cockpit opening (dark) with a squared-off rim, the little smoked screen
  const screen = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 8, 1, true, -0.9, 1.8).rotateX(-0.35).translate(0, 0.57, 0.48);
  add(screen, MAT.glass, false);
  // the driver: a helmet with a dark visor, his shoulders just below the rim
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.visor);
  // (a blue and yellow helmet stripe)
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.yellow);
  // mirrors: squared-off pods on stalks at the cockpit sides (each pod
  // can be knocked off, leaving its stalk; the pit crew fit a new one)
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.31, 0.5, 0.55], [s * 0.42, 0.6, 0.56], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(box(0.12, 0.07, 0.05, s * 0.45, 0.62, 0.56), MAT.blue));   // (add puts it on the car; the pod takes it from there)
    pod.add(add(new THREE.PlaneGeometry(0.105, 0.058).rotateY(Math.PI).translate(s * 0.45, 0.62, 0.534), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.45, 0.62, 0.56] };
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

  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}

// =====================================================================
// THE TT-05 AS THE PLAYER'S CAR (and the computer drivers', and the
// Garage's): the body. A tribute to the 2005 cars: a high, narrow nose
// with the front wing slung under it on two pylons (a spoon in the
// middle, flaps, tall endplates), bargeboards behind the front wheels,
// a narrow tub with high cockpit sides round the driver's head, tall
// waisted sidepods with undercut mouths and a tight coke-bottle taper
// to the back, chimneys and little flip-ups on them, the exhausts out
// through the top, the airbox over his head, a narrow rear wing moved
// forward with a beam wing below. In blue and yellow, our own design.
// addPanel(mesh): a painted panel that can be dented.
// =====================================================================
export function buildF05Body(car, addPanel) {
  const MAT = {
    // (French racing blue, the bright azure it should be (like the toy-brick
    // Dark Azure). Painted, not metallic, so the light shows its colour)
    blue: new THREE.MeshPhysicalMaterial({ color: 0x078bc9, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf4c419, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2f3f0, roughness: 0.25, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.4, metalness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: 0x1a3a8a, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow || mat === MAT.white) addPanel(m);
    return m;
  };
  const SMOOTH = 0.85;

  // --- the nose: high and narrow, sloping down to a rounded tip, its
  // underside well up off the ground (the air goes under it), then the tub
  const nose = [
    { z: 2.74, w: 0.1, h: 0.09, y: 0.31 },
    { z: 2.6, w: 0.16, h: 0.14, y: 0.31 },
    { z: 2.3, w: 0.23, h: 0.2, y: 0.32 },
    { z: 1.95, w: 0.29, h: 0.26, y: 0.33 },
    { z: 1.55, w: 0.36, h: 0.31, y: 0.32 },
    { z: 1.2, w: 0.46, h: 0.39, y: 0.25, top: 0.86 },
    { z: 0.9, w: 0.56, h: 0.47, y: 0.16, top: 0.8 },
    { z: 0.72, w: 0.62, h: 0.49, y: 0.13, top: 0.78 },
  ];
  add(loft(nose, SMOOTH, 28, 4, true), MAT.blue);
  // the yellow tip and a yellow band down the top of the nose, a white pinstripe
  add(loft([{ z: 2.755, w: 0.105, h: 0.095, y: 0.308 }, { z: 2.6, w: 0.165, h: 0.145, y: 0.308 }, { z: 2.42, w: 0.205, h: 0.18, y: 0.313 }], SMOOTH, 28, 4, true), MAT.yellow);
  add(loft([{ z: 2.4, w: 0.12, h: 0.02, y: 0.505 }, { z: 1.95, w: 0.16, h: 0.02, y: 0.58 }, { z: 1.4, w: 0.2, h: 0.02, y: 0.635 }, { z: 0.95, w: 0.22, h: 0.02, y: 0.625 }], 0.4, 16, 3, true), MAT.yellow);
  for (const sx of [1, -1]) add(rod([sx * 0.07, 0.51, 2.38], [sx * 0.11, 0.64, 1.0], 0.005), MAT.white, false);
  // --- the cockpit: high sides round his head, padded headrest wings,
  // the tub open on top where he sits, its inside in black
  const pit = [
    { z: 0.72, w: 0.62, h: 0.49, y: 0.13, top: 0.78 },
    { z: 0.45, w: 0.68, h: 0.53, y: 0.11, top: 0.76 },
    { z: 0.0, w: 0.72, h: 0.55, y: 0.1, top: 0.74 },
    { z: -0.2, w: 0.72, h: 0.56, y: 0.1, top: 0.74 },
  ];
  const opening = (z) => (z > 0.4 ? 0.15 + (0.72 - z) / 0.32 * 0.05 : 0.2);
  const shell = loftOpen(pit, SMOOTH, 3, opening);
  add(shell, MAT.blue);
  add(loftOpen(pit, SMOOTH, 3, opening, 0.025, true), MAT.carbon, false);
  // the padded rim and the headrest round the back of his head
  const rimZ = [0.72, 0.55, 0.35, 0.15, 0, -0.2];
  for (const sx of [1, -1]) for (let i = 0; i < rimZ.length - 1; i++) {
    const a = shell.userData.edge(rimZ[i]), b = shell.userData.edge(rimZ[i + 1]);
    add(rod([sx * -a[0], a[1], a[2]], [sx * -b[0], b[1], b[2]], 0.02), MAT.seat, false);
  }
  for (const sx of [1, -1]) add(box(0.06, 0.13, 0.4, sx * 0.17, 0.66, -0.06), MAT.seat, false);
  add(box(0.36, 0.14, 0.08, 0, 0.66, -0.2), MAT.seat, false);
  // the seat, his legs, his body and the wheel (the computer drivers' and
  // the Garage's: the player's car has its own moving cockpit)
  add(box(0.32, 0.05, 0.34, 0, 0.13, 0.08), MAT.seat, false);
  add(box(0.34, 0.4, 0.05, 0, 0.33, -0.12, -0.38), MAT.seat, false);
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.2, 0.02], [sx * 0.09, 0.32, 0.6], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.32, 0.6], [sx * 0.07, 0.3, 1.1], 0.045), MAT.suit, false);
  }
  const driver = new THREE.Group();
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.04), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([sx * 0.17, 0.51, -0.02], [sx * 0.15, 0.44, 0.22], 0.04), MAT.suit); dAdd(rod([sx * 0.15, 0.44, 0.22], [sx * 0.12, 0.55, 0.42], 0.035), MAT.suit); }
  dAdd(new THREE.BoxGeometry(0.26, 0.13, 0.03).rotateX(-0.45).translate(0, 0.57, 0.46), MAT.carbon);       // (a squared-off wheel, as they had by then)
  // his helmet, just showing over the high sides
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.73, -0.02), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.73, -0.02), MAT.visor);
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.73, -0.02), MAT.yellow);
  // mirrors: on stalks off the cockpit sides, out over the sidepods
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.32, 0.6, 0.48], [s * 0.47, 0.66, 0.5], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: 0.53, w: 0.13, h: 0.06, y: 0.635, x: s * 0.5 }, { z: 0.47, w: 0.14, h: 0.07, y: 0.63, x: s * 0.5 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.115, 0.055).rotateY(Math.PI).translate(s * 0.5, 0.665, 0.465), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.5, 0.665, 0.5] };
  }

  // --- sidepods: tall, with undercut mouths (cut away low down at the
  // front), then waisted in hard to the back: the coke bottle
  for (const s of [1, -1]) {
    const pod = [
      { z: 0.64, w: 0.3, h: 0.3, y: 0.24, x: s * 0.56, top: 0.9 },
      { z: 0.48, w: 0.38, h: 0.37, y: 0.15, x: s * 0.58, top: 0.85 },
      { z: 0.05, w: 0.4, h: 0.4, y: 0.11, x: s * 0.57, top: 0.78 },
      { z: -0.4, w: 0.34, h: 0.35, y: 0.11, x: s * 0.51, top: 0.75 },
      { z: -0.8, w: 0.22, h: 0.27, y: 0.11, x: s * 0.4, top: 0.75 },
      { z: -1.12, w: 0.12, h: 0.18, y: 0.11, x: s * 0.3, top: 0.8 },
    ];
    add(loft(pod, 1.0, 28, 4, true), MAT.blue);
    // yellow along the top of each pod, a white pinstripe below it
    add(loft(pod.map((p) => ({ ...p, w: p.w * 0.72, h: 0.035, y: p.y + p.h - 0.02 })), 0.8, 20, 4, true), MAT.yellow);
    // the radiator mouth: a dark rounded opening, with its lip
    add(loft([{ z: 0.66, w: 0.25, h: 0.25, y: 0.265, x: s * 0.56 }, { z: 0.6, w: 0.25, h: 0.25, y: 0.265, x: s * 0.56 }], 1.1, 20, 1, false), MAT.dark, false);
    // a chimney on top (hot air out), and the exhaust coming up through the pod's top
    add(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12, 1, true).translate(s * 0.53, 0.56, -0.38), MAT.blue);
    add(new THREE.CircleGeometry(0.044, 12).rotateX(-Math.PI / 2).translate(s * 0.53, 0.615, -0.38), MAT.dark, false);
    add(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 12, 1, true).rotateX(-0.6).translate(s * 0.3, 0.44, -1.05), MAT.exhaust);
    add(new THREE.CircleGeometry(0.052, 12).rotateX(-Math.PI / 2 - 0.6).translate(s * 0.3, 0.48, -1.08), MAT.dark, false);
    // the flip-ups in front of the back wheels, and a little "horn" winglet by the cockpit
    add(box(0.16, 0.012, 0.12, s * 0.52, 0.42, -0.98, -0.25), MAT.carbon);
    add(box(0.012, 0.12, 0.16, s * 0.6, 0.38, -0.98), MAT.carbon);
    add(box(0.1, 0.01, 0.08, s * 0.4, 0.66, 0.24, -0.35, 0, -s * 0.4), MAT.carbon);
    // bargeboards: tall curved carbon panels behind the front wheels, ahead of the pods
    add(box(0.012, 0.3, 0.42, s * 0.46, 0.2, 0.98, 0, s * 0.18), MAT.carbon);
    add(box(0.012, 0.18, 0.2, s * 0.38, 0.16, 1.25, 0, s * 0.3), MAT.carbon);
  }
  // --- engine cover: the airbox over his head (the roll hoop), then down
  // in a long smooth slope, narrowing tight to the gearbox
  const cover = [
    { z: -0.18, w: 0.6, h: 0.56, y: 0.1, top: 0.7 },
    { z: -0.3, w: 0.38, h: 0.98, y: 0.1, top: 0.35 },
    { z: -0.55, w: 0.42, h: 0.84, y: 0.1, top: 0.42 },
    { z: -0.95, w: 0.44, h: 0.56, y: 0.1, top: 0.6 },
    { z: -1.35, w: 0.32, h: 0.38, y: 0.12, top: 0.72 },
    { z: -1.72, w: 0.2, h: 0.24, y: 0.15, top: 0.8 },
  ];
  add(loft(cover, SMOOTH, 28, 4, true), MAT.yellow);
  // a blue spine down the middle, the airbox mouth, little camera pods
  add(loft(cover.slice(1).map((p) => ({ ...p, w: 0.12, h: 0.03, y: p.y + p.h - 0.015 })), 0.5, 16, 4, true), MAT.blue);
  add(loft([{ z: -0.27, w: 0.17, h: 0.13, y: 0.94 }, { z: -0.31, w: 0.17, h: 0.13, y: 0.94 }], 1.2, 20, 1, false), MAT.dark, false);
  for (const s of [1, -1]) add(box(0.05, 0.05, 0.12, s * 0.12, 1.04, -0.36), MAT.carbon);
  // the gearbox at the back, its rain light, the diffuser and its fences
  add(box(0.2, 0.18, 0.4, 0, 0.22, -1.88), MAT.carbon);
  add(box(0.07, 0.04, 0.03, 0, 0.27, -2.1), MAT.rain);
  // --- the floor (the stepped flat bottom, the plank under it) and the diffuser
  add(box(1.36, 0.02, 2.0, 0, 0.045, -0.15), MAT.carbon);
  add(box(0.3, 0.012, 2.6, 0, 0.03, -0.1), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));
  add(box(0.86, 0.02, 0.6, 0, 0.12, -1.75, -0.3), MAT.carbon);
  for (const x of [-0.32, -0.12, 0.12, 0.32]) add(box(0.01, 0.14, 0.55, x, 0.11, -1.75), MAT.carbon);

  // --- the front wing: slung under the nose on two pylons; a spoon in
  // the middle, a main plane and a flap each side, tall endplates. Each
  // side, and the rear wing, is its own piece (it can snap off)
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) add(box(0.015, 0.22, 0.16, s * 0.06, 0.22, 2.5, 0.2), MAT.carbon);       // the pylons
  add(loft([{ z: 2.7, w: 0.3, h: 0.02, y: 0.13 }, { z: 2.42, w: 0.3, h: 0.02, y: 0.15 }], 0.3, 12, 2, false), MAT.blue);   // the spoon (middle, raised)
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.56, 0.02, 0.34, s * 0.43, 0.095, 2.55, 0.06, -s * 0.03), MAT.blue);                 // main plane
    addTo(g, box(0.5, 0.014, 0.17, s * 0.45, 0.16, 2.38, 0.42, -s * 0.05), MAT.yellow);               // the flap above it
    addTo(g, box(0.36, 0.012, 0.11, s * 0.5, 0.2, 2.27, 0.7, -s * 0.05), MAT.white);                 // a second flap
    addTo(g, box(0.015, 0.24, 0.52, s * 0.71, 0.17, 2.48, 0, 0, 0), MAT.yellow);                     // endplate
    addTo(g, box(0.06, 0.012, 0.36, s * 0.69, 0.06, 2.48), MAT.carbon);                              // its foot
  }
  // --- the rear wing: narrow, set forward, two elements between tall
  // endplates; the beam wing below; a pillar down to the gearbox
  for (const s of [1, -1]) addTo(wings.rear, box(0.018, 0.58, 0.5, s * 0.45, 0.72, -1.95), MAT.yellow);
  for (const s of [1, -1]) addTo(wings.rear, box(0.02, 0.06, 0.5, s * 0.452, 0.98, -1.95), MAT.blue);
  addTo(wings.rear, box(0.88, 0.024, 0.26, 0, 0.82, -1.86, 0.18), MAT.blue);
  addTo(wings.rear, box(0.88, 0.018, 0.2, 0, 0.92, -2.06, 0.5), MAT.blue);
  addTo(wings.rear, box(0.88, 0.006, 0.02, 0, 0.94, -2.16, 0), MAT.white);
  add(box(0.72, 0.02, 0.16, 0, 0.44, -1.92, 0.2), MAT.carbon);                // the beam wing (stays)
  addTo(wings.rear, box(0.035, 0.42, 0.06, 0, 0.62, -1.96), MAT.carbon);
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}

// =====================================================================
// THE TT-94 AS THE PLAYER'S CAR (and the computer drivers', and the
// Garage's): the body. A tribute to the 1994 V12 cars: a raised nose
// with the wide front wing drooping under it, a low wraparound screen
// and lower cockpit sides than later, long sidepods with big oval
// mouths, a tall airbox over his head and a long engine cover for the
// V12, a tall rear wing with big endplates, the exhausts low at the
// back. In racing red with white, our own design.
// (mats.blue is the main colour and mats.yellow the second, whatever
// they are: the computer drivers paint their own over them)
// =====================================================================
export function buildF94Body(car, addPanel) {
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0xd2111c, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf2f3f0, roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.4, metalness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: 0xb8121b, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };
  const SMOOTH = 0.8;
  // --- the nose: raised, broad and rounded, down to the tub
  const nose = [
    { z: 2.62, w: 0.13, h: 0.1, y: 0.22 },
    { z: 2.45, w: 0.2, h: 0.14, y: 0.22 },
    { z: 2.15, w: 0.27, h: 0.2, y: 0.24 },
    { z: 1.8, w: 0.33, h: 0.26, y: 0.25 },
    { z: 1.4, w: 0.42, h: 0.33, y: 0.21, top: 0.86 },
    { z: 1.05, w: 0.54, h: 0.42, y: 0.14, top: 0.8 },
    { z: 0.75, w: 0.62, h: 0.46, y: 0.12, top: 0.78 },
  ];
  add(loft(nose, SMOOTH, 28, 4, true), MAT.blue);
  // a white band over the nose, swept back along its sides
  add(loft([{ z: 2.2, w: 0.27, h: 0.02, y: 0.43 }, { z: 1.85, w: 0.3, h: 0.02, y: 0.505 }, { z: 1.5, w: 0.36, h: 0.02, y: 0.53 }], 0.5, 16, 3, true), MAT.yellow);
  // --- the cockpit: lower sides than later, the driver's shoulders
  // showing, a little wraparound screen at the front of the opening
  const pit = [
    { z: 0.75, w: 0.62, h: 0.46, y: 0.12, top: 0.78 },
    { z: 0.45, w: 0.68, h: 0.48, y: 0.11, top: 0.76 },
    { z: 0.0, w: 0.72, h: 0.49, y: 0.1, top: 0.74 },
    { z: -0.2, w: 0.72, h: 0.5, y: 0.1, top: 0.74 },
  ];
  const opening = (z) => (z > 0.4 ? 0.16 + (0.75 - z) / 0.35 * 0.05 : 0.21);
  const shell = loftOpen(pit, SMOOTH, 3, opening);
  add(shell, MAT.blue);
  add(loftOpen(pit, SMOOTH, 3, opening, 0.025, true), MAT.carbon, false);
  const rimZ = [0.75, 0.55, 0.35, 0.15, 0, -0.2];
  for (const sx of [1, -1]) for (let i = 0; i < rimZ.length - 1; i++) {
    const a = shell.userData.edge(rimZ[i]), b = shell.userData.edge(rimZ[i + 1]);
    add(rod([sx * -a[0], a[1], a[2]], [sx * -b[0], b[1], b[2]], 0.02), MAT.seat, false);
  }
  add(new THREE.CylinderGeometry(0.25, 0.25, 0.11, 12, 1, true, -0.95, 1.9).rotateX(-0.3).translate(0, 0.62, 0.5), MAT.glass, false);
  add(box(0.32, 0.05, 0.34, 0, 0.13, 0.08), MAT.seat, false);
  add(box(0.34, 0.4, 0.05, 0, 0.33, -0.12, -0.36), MAT.seat, false);
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.2, 0.02], [sx * 0.09, 0.3, 0.55], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.3, 0.55], [sx * 0.07, 0.24, 1.02], 0.045), MAT.suit, false);
  }
  const driver = new THREE.Group();
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.04), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([sx * 0.17, 0.51, -0.02], [sx * 0.15, 0.43, 0.22], 0.04), MAT.suit); dAdd(rod([sx * 0.15, 0.43, 0.22], [sx * 0.12, 0.54, 0.42], 0.035), MAT.suit); }
  dAdd(new THREE.BoxGeometry(0.25, 0.12, 0.03).rotateX(-0.45).translate(0, 0.56, 0.46), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.71, -0.03), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.71, -0.03), MAT.visor);
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.71, -0.03), MAT.blue);
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.32, 0.56, 0.5], [s * 0.46, 0.63, 0.52], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: 0.55, w: 0.13, h: 0.065, y: 0.605, x: s * 0.49 }, { z: 0.49, w: 0.14, h: 0.075, y: 0.6, x: s * 0.49 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.115, 0.06).rotateY(Math.PI).translate(s * 0.49, 0.638, 0.485), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.49, 0.64, 0.52] };
  }
  // --- sidepods: long, with big oval mouths, a gentle taper (the coke
  // bottle hadn't got tight yet), and a white flash along each
  for (const s of [1, -1]) {
    const pod = [
      { z: 0.7, w: 0.36, h: 0.32, y: 0.16, x: s * 0.6, top: 0.92 },
      { z: 0.5, w: 0.44, h: 0.37, y: 0.11, x: s * 0.61 },
      { z: -0.1, w: 0.44, h: 0.37, y: 0.1, x: s * 0.6, top: 0.82 },
      { z: -0.6, w: 0.38, h: 0.33, y: 0.1, x: s * 0.55, top: 0.8 },
      { z: -1.0, w: 0.26, h: 0.26, y: 0.1, x: s * 0.45, top: 0.8 },
      { z: -1.25, w: 0.16, h: 0.18, y: 0.1, x: s * 0.36, top: 0.85 },
    ];
    add(loft(pod, 1.1, 28, 4, true), MAT.blue);
    add(loft([{ z: 0.72, w: 0.3, h: 0.26, y: 0.185, x: s * 0.6 }, { z: 0.66, w: 0.3, h: 0.26, y: 0.185, x: s * 0.6 }], 1.3, 20, 1, false), MAT.dark, false);
    add(box(0.012, 0.06, 1.3, s * 0.835, 0.3, -0.2, 0, -s * 0.04), MAT.yellow);
    add(box(0.012, 0.3, 0.38, s * 0.47, 0.18, 1.0, 0, s * 0.15), MAT.carbon);           // bargeboards
  }
  // --- the engine cover: a tall airbox over his head, then a long slope over the V12
  const cover = [
    { z: -0.18, w: 0.6, h: 0.52, y: 0.1, top: 0.7 },
    { z: -0.3, w: 0.42, h: 0.93, y: 0.1, top: 0.38 },
    { z: -0.6, w: 0.46, h: 0.8, y: 0.1, top: 0.45 },
    { z: -1.05, w: 0.48, h: 0.56, y: 0.1, top: 0.62 },
    { z: -1.45, w: 0.34, h: 0.38, y: 0.12, top: 0.72 },
    { z: -1.78, w: 0.22, h: 0.24, y: 0.15, top: 0.8 },
  ];
  add(loft(cover, SMOOTH, 28, 4, true), MAT.blue);
  add(loft(cover.slice(1, 4).map((p) => ({ ...p, w: 0.1, h: 0.025, y: p.y + p.h - 0.012 })), 0.5, 16, 4, true), MAT.yellow);
  add(loft([{ z: -0.27, w: 0.2, h: 0.15, y: 0.86 }, { z: -0.31, w: 0.2, h: 0.15, y: 0.86 }], 1.3, 20, 1, false), MAT.dark, false);
  // the gearbox, the rain light, exhausts out low at the back over the diffuser
  add(box(0.22, 0.2, 0.42, 0, 0.22, -1.92), MAT.carbon);
  add(box(0.07, 0.04, 0.03, 0, 0.3, -2.14), MAT.rain);
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 12, 1, true).rotateX(Math.PI / 2 - 0.1).translate(s * 0.2, 0.2, -1.95), MAT.exhaust);
  // --- the floor (stepped, the plank) and the diffuser
  add(box(1.5, 0.02, 2.2, 0, 0.045, -0.1), MAT.carbon);
  add(box(0.3, 0.012, 2.6, 0, 0.03, -0.1), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));
  add(box(0.95, 0.02, 0.62, 0, 0.13, -1.8, -0.32), MAT.carbon);
  for (const x of [-0.34, -0.12, 0.12, 0.34]) add(box(0.01, 0.15, 0.56, x, 0.12, -1.8), MAT.carbon);

  // --- the front wing: wide, drooping down from the middle under the
  // raised nose on two pylons; a main plane and a flap; big endplates
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) add(box(0.015, 0.15, 0.18, s * 0.06, 0.18, 2.42, 0.2), MAT.carbon);
  add(box(0.24, 0.02, 0.36, 0, 0.13, 2.48, 0.05), MAT.blue);
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.62, 0.022, 0.36, s * 0.43, 0.1, 2.44, 0.05, -s * 0.03, -s * 0.07), MAT.blue);       // main plane, drooping outward
    addTo(g, box(0.56, 0.015, 0.18, s * 0.46, 0.15, 2.26, 0.4, -s * 0.03, -s * 0.07), MAT.yellow);     // the flap
    addTo(g, box(0.015, 0.22, 0.58, s * 0.775, 0.13, 2.38), MAT.blue);                              // endplate
  }
  // --- the rear wing: tall, three elements between big endplates; a beam wing below
  for (const s of [1, -1]) addTo(wings.rear, box(0.02, 0.66, 0.64, s * 0.5, 0.74, -2.0), MAT.blue);
  for (const s of [1, -1]) addTo(wings.rear, box(0.022, 0.06, 0.64, s * 0.502, 0.42, -2.0), MAT.yellow);
  addTo(wings.rear, box(0.98, 0.024, 0.26, 0, 0.86, -1.9, 0.14), MAT.carbon);
  addTo(wings.rear, box(0.98, 0.02, 0.2, 0, 0.95, -2.08, 0.42), MAT.carbon);
  addTo(wings.rear, box(0.98, 0.018, 0.14, 0, 1.01, -2.22, 0.7), MAT.carbon);
  add(box(0.8, 0.02, 0.16, 0, 0.46, -1.95, 0.18), MAT.carbon);
  addTo(wings.rear, box(0.035, 0.45, 0.06, 0, 0.63, -1.98), MAT.carbon);
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}
export const bodyForKind = (kind) => (kind === 'f05' ? buildF05Body : kind === 'f94' ? buildF94Body : buildF1Body);

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
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.visor);
  // (a blue and yellow helmet stripe)
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.yellow);
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
export function buildF1Cockpit(car, { paddles = false } = {}) {
  const group = new THREE.Group();
  car.add(group);
  const M = {
    carbon: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.45, metalness: 0.3 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x23252b, roughness: 0.95 }),
    // (dressed as the Caterham's driver: red race suit, black gloves)
    suit: new THREE.MeshStandardMaterial({ color: 0xc81d25, roughness: 0.85 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 }),
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
  // the steering column and the wheel: an F1-style one, not a round rim. A
  // flat carbon plate, squared off top and bottom, a rubber grip each side,
  // the screen in the middle (gear, speed, revs, shift lights), coloured
  // rotary knobs and buttons round it, and the gear paddles behind
  const column = new THREE.Group();
  column.position.set(0, 0.47, 0.45);
  column.rotation.x = -0.5;                        // tilted back towards him, below his eye line
  group.add(column);
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 10).rotateX(Math.PI / 2).translate(0, 0, 0.1), M.steel, column);
  const wheel = new THREE.Group();
  column.add(wheel);
  const paddleMeshes = [];                         // (right: up, left: down)
  {
    // the plate: a rounded rectangle, a little wider at the top
    const W = 0.135, Ht = 0.07, Hb = 0.06, r = 0.022;
    const sh = new THREE.Shape();
    sh.moveTo(-W + r, -Hb); sh.lineTo(W - r, -Hb); sh.quadraticCurveTo(W, -Hb, W, -Hb + r);
    sh.lineTo(W, Ht - r); sh.quadraticCurveTo(W, Ht, W - r, Ht); sh.lineTo(-W + r, Ht); sh.quadraticCurveTo(-W, Ht, -W, Ht - r);
    sh.lineTo(-W, -Hb + r); sh.quadraticCurveTo(-W, -Hb, -W + r, -Hb);
    add(new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false }).translate(0, 0, -0.011), M.carbon, wheel);
    // the grips: chunky rubber, a little proud of the plate at each side
    for (const sx of [1, -1]) add(new THREE.BoxGeometry(0.042, 0.115, 0.045).translate(sx * 0.125, -0.002, -0.004), M.grip, wheel);
    // the paddles behind (up on the right, down on the left)
    for (const sx of [1, -1]) paddleMeshes.push(add(new THREE.BoxGeometry(0.06, 0.05, 0.006).translate(sx * 0.075, 0.035, 0.022), M.steel, wheel));
    // rotary knobs and buttons round the screen
    const KNOBS = [[-0.075, -0.035, 0xd8312a], [0.075, -0.035, 0x2a62c9], [-0.045, -0.048, 0xf2c12e], [0.045, -0.048, 0x2b9a52]];
    for (const [x, y, c] of KNOBS) add(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 10).rotateX(Math.PI / 2).translate(x, y, -0.016), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), wheel);
    const BUTTONS = [[-0.085, 0.045, 0xf4f4f0], [0.085, 0.045, 0xf4f4f0], [-0.085, 0.015, 0xd8312a], [0.085, 0.015, 0x2b9a52]];
    for (const [x, y, c] of BUTTONS) add(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 10).rotateX(Math.PI / 2).translate(x, y, -0.014), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), wheel);
  }
  // the screen, on the wheel itself (facing him)
  const screen = add(new THREE.PlaneGeometry(0.1, 0.0375), new THREE.MeshBasicMaterial({ map: tex }), wheel);
  screen.position.set(0, 0.022, -0.0125); screen.rotation.set(0, Math.PI, 0);
  // the gear lever on the right (sequential: pull back to change up, push to change down)
  const lever = new THREE.Group();
  lever.position.set(-0.2, 0.42, 0.3);
  group.add(lever);
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8).translate(0, 0.07, 0), M.steel, lever);
  const knob = add(new THREE.SphereGeometry(0.022, 12, 10).translate(0, 0.145, 0), M.knob, lever);
  const gate = add(box(0.05, 0.02, 0.1, -0.2, 0.42, 0.3), M.carbon);              // its gate
  // (the TT-05 has none: it changes gear on paddles behind the wheel)
  if (paddles) lever.visible = gate.visible = false;
  // THE PEDALS, down in the footwell under the scuttle, his feet on them:
  // the TT-88 has three (clutch, brake, throttle: his right foot goes
  // across from the throttle to the brake); the TT-05 two (the left foot
  // brakes, the right one on the throttle; the clutch is on the wheel)
  const pedalZ = paddles ? 1.18 : 1.08, pedalY = paddles ? 0.27 : 0.19;
  const pedalAt = paddles ? { brake: 0.07, throttle: -0.07 } : { clutch: 0.1, brake: 0.0, throttle: -0.09 };
  const pedals = {};
  add(box(0.34, 0.02, 0.22, 0, pedalY - 0.05, pedalZ), M.carbon);                   // the pedal box floor
  for (const [k, x] of Object.entries(pedalAt)) {
    const pv = new THREE.Group(); pv.position.set(x, pedalY - 0.04, pedalZ); group.add(pv);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6).translate(0, 0.05, 0), M.steel, pv);
    add(new THREE.BoxGeometry(k === 'throttle' ? 0.05 : 0.065, 0.075, 0.012).translate(0, 0.1, 0.005), k === 'brake' ? M.steel : M.carbon, pv);
    pv.rotation.x = 0.35;                              // (leaning back toward his feet)
    pedals[k] = pv;
  }
  // his feet: racing boots, resting on the pedals
  const feet = [0, 1].map(() => { const f = add(new THREE.CapsuleGeometry(0.035, 0.11, 4, 10).rotateX(Math.PI / 2 - 0.35), M.boot || M.suit); return f; });
  const footPt = new THREE.Vector3();
  // the driver: shoulders and chest just under the rim, arms to the wheel
  // (sat back in the tub, not hunched over the wheel: his back against the
  // seat, leaning back, shoulders square and his head up against the headrest)
  const chest = add(new THREE.CapsuleGeometry(0.15, 0.12, 6, 12).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.475, -0.1), M.suit);
  const back = add(new THREE.CapsuleGeometry(0.13, 0.22, 6, 12).scale(1.05, 1, 0.75).rotateX(-0.55).translate(0, 0.36, -0.22), M.suit);
  const neck = add(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10).rotateX(-0.2).translate(0, 0.565, -0.075), M.suit);
  add(new THREE.CapsuleGeometry(0.07, 0.12, 4, 10).rotateZ(Math.PI / 2).translate(0, 0.62, -0.235), M.pad);   // the headrest
  // arms like the Caterham driver's: rounded, with elbows, gloved hands with a thumb and a cuff
  const arms = [0, 1].map((side) => {
    const hand = new THREE.Group(); group.add(hand);
    add(new THREE.SphereGeometry(0.036, 16, 12).scale(1, 0.75, 1.35), M.glove, hand);
    const thumb = add(new THREE.CapsuleGeometry(0.012, 0.03, 4, 10), M.glove, hand);
    thumb.position.set((side ? 1 : -1) * 0.03, 0.01, 0.01); thumb.rotation.z = (side ? -1 : 1) * 0.9;
    add(new THREE.CylinderGeometry(0.036, 0.04, 0.03, 14).translate(0, -0.035, 0), M.glove, hand);
    return {
      upper: add(new THREE.CapsuleGeometry(0.046, 0.24, 6, 12), M.suit),
      fore: add(new THREE.CapsuleGeometry(0.039, 0.23, 6, 12), M.suit),
      elbow: add(new THREE.SphereGeometry(0.043, 14, 10), M.suit),
      hand,
    };
  });
  const SH = [new THREE.Vector3(-0.17, 0.5, -0.08), new THREE.Vector3(0.17, 0.5, -0.08)];   // right, left shoulder
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
    arms[i].elbow.position.copy(elbow);
    arms[i].hand.position.copy(hand);
    arms[i].hand.quaternion.copy(arms[i].fore.quaternion);
  };
  const POLE = [new THREE.Vector3(-1, -0.6, -0.3), new THREE.Vector3(1, -0.6, -0.3)];
  const head = new THREE.Vector3();
  const pedalPress = { throttle: 0, brake: 0, clutch: 0, across: 0 };
  let t = 0, shift = 1, shiftDir = 0, fight = 0, panelClock = 0, wheelAngle = 0, bumpS = 0;
  const headV = new THREE.Vector3(), headAim = new THREE.Vector3();
  const gripPt = new THREE.Vector3(), knobPt = new THREE.Vector3();
  return {
    group,
    driverParts: [chest, back, neck, ...feet, ...arms.flatMap((a) => [a.upper, a.fore, a.elbow, a.hand])],   // (him, without the wheel: for climbing out)
    head,                                          // how far his head is thrown about (car's frame): add to the eye
    // a gear change: his right hand goes to the lever
    onShift(direction) { shift = 0; shiftDir = direction > 0 ? 1 : -1; },
    update(dt, { steer = 0, maxSteer = 0.36, speed = 0, slip = 0, bump = 0, gear = 'N', rpm = 0, redline = 12500, kmh = 0, limp = false, throttle = 0, brake = 0, clutch = 0 }) {
      t += dt;
      // the pedals pressed as far as he's pressing them, his feet on them
      // (the right foot across to the brake in the TT-88, back to the throttle after)
      if (limp) { throttle = 0; brake = 0; clutch = 0; }
      pedalPress.throttle += (throttle - pedalPress.throttle) * Math.min(1, dt * 18);
      pedalPress.brake += (brake - pedalPress.brake) * Math.min(1, dt * 18);
      pedalPress.clutch += (clutch - pedalPress.clutch) * Math.min(1, dt * 18);
      pedalPress.across += ((brake > 0.05 && !paddles ? 1 : 0) - pedalPress.across) * Math.min(1, dt * 10);
      for (const [k, pv] of Object.entries(pedals)) pv.rotation.x = 0.35 + 0.45 * pedalPress[k];
      for (let i = 0; i < 2; i++) {
        // i 0: right foot, 1: left foot
        const k = i === 1 ? (paddles ? 'brake' : 'clutch') : 'throttle';
        let x = pedalAt[k], press = pedalPress[k];
        if (i === 0 && !paddles) { x += (pedalAt.brake - pedalAt.throttle) * pedalPress.across; press = press * (1 - pedalPress.across) + pedalPress.brake * pedalPress.across; }
        const a = 0.35 + 0.45 * press;
        footPt.set(x, pedalY - 0.04 + Math.cos(a) * 0.1, pedalZ + Math.sin(a) * 0.1 - 0.06);
        feet[i].position.copy(footPt); feet[i].rotation.x = a - 0.35;
      }
      if (limp) { steer = 0; speed = 0; slip = 0; bump = 0; shift = 1; }
      // how hard he's fighting it: the speed, how much it's sliding, the bumps.
      // Only while it's moving: stopped (or wrecked and still), his hands just rest on the wheel
      const moving = Math.min(1, Math.max(0, Math.abs(speed) - 1) / 8);
      const want = (Math.min(1, Math.abs(speed) / 70) * 0.5 + Math.min(1, Math.abs(slip) / 3) * 0.8 + Math.min(1, bump * 25) * 0.6 + 0.15) * moving;
      fight += (want - fight) * Math.min(1, dt * 4);
      const jitter = fight * (Math.sin(t * 11.3) * 0.05 + Math.sin(t * 17.9 + 1) * 0.035 + Math.sin(t * 5.1 + 2) * 0.06);
      // the wheel: his steering (about a quarter turn either way at full lock) and the fight
      const target = (steer / maxSteer) * (Math.PI * 0.5) + jitter + slip * 0.04;
      wheelAngle += (target - wheelAngle) * Math.min(1, dt * 25);
      wheel.rotation.z = -wheelAngle;
      // his head moved about with it: on a neck with some weight to it (a
      // spring, not a jolt every frame), a few millimetres, and nothing at all stopped
      bumpS += (Math.min(0.4, bump) * moving - bumpS) * Math.min(1, dt * 5);
      headAim.set(fight * 0.006 * Math.sin(t * 9.7) + bumpS * 0.02 * Math.sin(t * 21.3),
        fight * 0.005 * Math.sin(t * 13.1 + 0.5) + bumpS * 0.035 * Math.sin(t * 17.7 + 1), 0);
      headV.addScaledVector(headAim.sub(head), Math.min(1, dt * 60)).multiplyScalar(Math.exp(-dt * 14));
      head.addScaledVector(headV, Math.min(1, dt * 30));
      { const l = head.length(); if (l > 0.02) head.multiplyScalar(0.02 / l); }
      // hands on the grips (the right one away to the lever during a change;
      // with paddles, his fingers just flick the paddle behind the wheel:
      // the right one up, the left one down, and the hands never leave it)
      group.updateMatrixWorld(true);
      if (paddles) {
        if (shift < 1) shift = Math.min(1, shift + dt / 0.18);
        const pull = shift < 1 ? Math.sin(Math.PI * shift) : 0;
        paddleMeshes.forEach((m, k) => { m.position.z = (k === 0) === (shiftDir > 0) ? -0.012 * pull : 0; });
      }
      for (let i = 0; i < 2; i++) {
        wheel.localToWorld(gripPt.set(i === 0 ? -0.125 : 0.125, 0, -0.03));
        group.worldToLocal(gripPt);
        if (paddles) {
          // (the hand on the side being pulled closes a little, toward the paddle)
          if (shift < 1 && (i === 0) === (shiftDir > 0)) { wheel.localToWorld(knobPt.set(i === 0 ? -0.1 : 0.1, 0.02, -0.005)); group.worldToLocal(knobPt); gripPt.lerp(knobPt, Math.sin(Math.PI * shift) * 0.6); }
        } else if (i === 0 && shift < 1) {
          shift = Math.min(1, shift + dt / 0.5);
          const out = shift < 0.3 ? shift / 0.3 : shift > 0.7 ? (1 - shift) / 0.3 : 1;
          const throwL = shift > 0.3 && shift < 0.7 ? Math.sin(Math.PI * (shift - 0.3) / 0.4) : 0;
          lever.rotation.x = -shiftDir * 0.35 * throwL;
          lever.updateMatrixWorld(true);
          knob.getWorldPosition(knobPt); group.worldToLocal(knobPt);
          gripPt.lerp(knobPt, Math.min(1, out));
        } else if (i === 0 && !paddles) lever.rotation.x = 0;
        if (limp) gripPt.set(i === 0 ? -0.1 : 0.1, 0.36, 0.12);          // (hands fallen off the wheel, into his lap)
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
