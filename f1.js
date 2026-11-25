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
export const BUILD = 84;

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
  // (the 1970 long-distance flat-12: 4.9 litres, air-cooled, about 600 hp
  // at 8,300 rpm and a huge spread of torque. Its own sound isn't made yet)
  flat12: { engineInertia: 0.13, name: '4.9 flat-12 (sound unfinished)', cylinders: 12, idleRpm: 1600, redline: 8400, launchRpm: 5000, engineBraking: 55, peakTorque: 570, massDelta: 0,
    torqueCurve: [[1000, 260], [2500, 400], [4000, 490], [5500, 545], [6400, 570], [7400, 545], [8300, 505], [8400, 490], [8700, 180], [8900, 0]], turbo: null },
  // (the first rotary in the game: a 2.6-litre four-rotor, peripheral
  // ports, about 700 hp at 9,000 rpm; four rotors fire like an eight, and
  // a rotary barely holds the car back off the throttle. Its own sound
  // isn't made yet)
  rotary4: { engineInertia: 0.1, name: '2.6 four-rotor (sound unfinished)', rotary: true, cylinders: 8, idleRpm: 2000, redline: 9500, launchRpm: 6500, engineBraking: 32, peakTorque: 610, massDelta: 0,
    torqueCurve: [[1500, 230], [3000, 330], [4500, 430], [6000, 520], [7500, 590], [8500, 610], [9000, 590], [9500, 555], [9800, 200], [10000, 0]], turbo: null },
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
  name: 'TTF-88',
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
  name: 'TTF-05',
  body: 'f05',
  grooved: true,
  stockEngine: 'v10x',
  baseMass: 615,                     // (605 kg once the V10's fitted)
  inertia: 960,
  airInertia: { pitch: 1000, yaw: 1030, roll: 250 },
  cgToFront: 1.67, cgToRear: 1.43,   // 3.1 m between the axles, a little more weight on the back
  trackHalf: 0.73,                   // (1.46 m: narrow, under the 1.8 m width limit)
  wheelRadius: 0.33,
  frontGrip: 1.5, rearGrip: 1.64,    // (grooved tyres, but the soft compounds of the tyre war: grippy)
  cgHeight: 0.25,
  downforce: 2.7,                    // about 3.2 times its weight at 300 km/h (the cars of 2005 cornered at 4 g)
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
  name: 'TTF-94',
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
// THE TTP-70: an original 1970 long-distance prototype (a tribute to the
// short-tail flat-12 cars of that year, in our own light blue and orange:
// no real make, badges or sponsor). Low, wide and short, a closed
// cockpit, the air-cooled flat-12 behind the driver, five gears on a
// lever, about 800 kg; little downforce, narrow-ish 1970 tyres, very fast
// in a straight line
export const P70_CAR = {
  ...F1_CAR,
  name: 'TTP-70',
  body: 'p70',
  closed: true,                      // (a roof: no open cockpit)
  rightHand: true,                   // (he sits on the right)
  wings: true,
  radiatorSides: false,              // (air-cooled: no radiators)
  stockEngine: 'flat12',
  baseMass: 800,
  inertia: 1250,
  airInertia: { pitch: 1300, yaw: 1350, roll: 420 },
  cgToFront: 1.25, cgToRear: 1.05,   // 2.3 m between the axles
  trackHalf: 0.78,
  wheelRadius: 0.33,
  frontGrip: 1.15, rearGrip: 1.28,   // (1970 racing tyres)
  maxPushShare: 0.85,
  cgHeight: 0.34,
  downforce: 0.38,
  downforceFront: 0.4,
  drag: 0.44,
  brakeForce: 15000, brakeBias: 0.57,
  maxSteer: 0.42, steerSpeed: 2.8,
  frontStiffness: 52000, rearStiffness: 62000,
  gears: [2.6, 1.8, 1.38, 1.13, 0.96],
  shiftTime: { manual: 0.14, auto: 0.3 },
  fuelCapacity: 120,
};
// THE TTP-91: an original 1991 Group C long-distance car (a tribute to
// the four-rotor winner of that year, in our own orange and green: no real
// make, badges or sponsor). Long, low and wide, the rear wheels skirted,
// a ground-effect floor, a big wing on the tail, the driver on the
// right, five gears on a lever, about 830 kg
export const P91_CAR = {
  ...P70_CAR,
  name: 'TTP-91',
  body: 'p91',
  stockEngine: 'rotary4',
  baseMass: 830,
  inertia: 1350,
  airInertia: { pitch: 1450, yaw: 1500, roll: 440 },
  cgToFront: 1.3, cgToRear: 1.36,    // 2.66 m between the axles
  trackHalf: 0.79,
  frontGrip: 1.42, rearGrip: 1.55,   // (1991 slicks)
  cgHeight: 0.31,
  downforce: 1.45,                   // (ground effect: about twice its weight at 300 km/h)
  downforceFront: 0.42,
  drag: 0.56,
  brakeForce: 21000, brakeBias: 0.58,
  maxSteer: 0.4, steerSpeed: 2.9,
  frontStiffness: 66000, rearStiffness: 78000,
  gears: [2.5, 1.78, 1.38, 1.14, 0.97],
  fuelCapacity: 100,
};
export const STOCK_ENGINE = { caterham: 'duratec', f1: 'turboV6', f05: 'v10x', f94: 'v12', p70: 'flat12', p91: 'rotary4' };
export const specForKind = (kind) => ({ f05: F05_CAR, f94: F94_CAR, p70: P70_CAR, p91: P91_CAR, f1: F1_CAR }[kind] || CATERHAM_CAR);
// where each single-seater's wheels are: [x, z, width] (left, right; front then back)
// THE DRIVERS' RACE SUITS: in each team's colours (suit, and the trim on
// his helmet): white and red for the TTF-88, red and white for the TTF-94,
// light blue and yellow for the TTF-05
export const DRIVER_SUITS = {
  f1: { suit: 0xf2f2ee, trim: 0xe0231b },
  f94: { suit: 0xc8141c, trim: 0xf4f4f0 },
  f05: { suit: 0x2f9be0, trim: 0xf2c200 },
};
export const WHEEL_LAYOUT = {
  f1: [[0.88, 1.62, 0.3], [-0.88, 1.62, 0.3], [0.88, -1.28, 0.42], [-0.88, -1.28, 0.42]],
  f05: [[0.73, 1.67, 0.28], [-0.73, 1.67, 0.28], [0.73, -1.43, 0.35], [-0.73, -1.43, 0.35]],
  f94: [[0.83, 1.62, 0.3], [-0.83, 1.62, 0.3], [0.83, -1.33, 0.39], [-0.83, -1.33, 0.39]],
  p70: [[0.78, 1.25, 0.26], [-0.78, 1.25, 0.26], [0.76, -1.05, 0.34], [-0.76, -1.05, 0.34]],
  p91: [[0.79, 1.3, 0.3], [-0.79, 1.3, 0.3], [0.77, -1.36, 0.36], [-0.77, -1.36, 0.36]],
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
// A box with its edges and corners rounded off (nothing on a real car has
// knife edges: a wing's leading edge, an endplate's rim, a mirror)
function roundedBox(w, h, d, r = Math.min(0.02, Math.min(w, h, d) * 0.4)) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3);
  const P = g.attributes.position, N = g.attributes.normal;
  if (!(P && P.count > 0)) return g;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, n = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const ix = Math.max(-hx, Math.min(hx, x)), iy = Math.max(-hy, Math.min(hy, y)), iz = Math.max(-hz, Math.min(hz, z));
    n.set(x - ix, y - iy, z - iz);
    if (n.lengthSq() < 1e-12) continue;
    n.normalize();
    P.setXYZ(i, ix + n.x * r, iy + n.y * r, iz + n.z * r);
    N.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}
// A TYRE as it really is: a rounded shoulder into a bulging sidewall, down
// to the rim, not a can. (Built round the x axis; r: its radius, w: its
// width, rimR: where the rim starts)
export function tyreGeometry(r, w, rimR = r * 0.62, seg = 40) {
  const sh = Math.min(w * 0.24, (r - rimR) * 0.45), hw = w / 2, prof = [];
  prof.push(new THREE.Vector2(rimR, -hw + 0.012));
  prof.push(new THREE.Vector2(rimR + (r - rimR) * 0.35, -hw - 0.004));
  prof.push(new THREE.Vector2(r - sh, -hw - 0.002));
  for (let k = 1; k <= 6; k++) { const a = -Math.PI / 2 + k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, -hw + sh + Math.sin(a) * sh)); }
  for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; prof.push(new THREE.Vector2(r - sh + Math.cos(a) * sh, hw - sh + Math.sin(a) * sh)); }
  prof.push(new THREE.Vector2(r - sh, hw + 0.002));
  prof.push(new THREE.Vector2(rimR + (r - rimR) * 0.35, hw + 0.004));
  prof.push(new THREE.Vector2(rimR, hw - 0.012));
  const g = new THREE.LatheGeometry(prof, seg).rotateZ(Math.PI / 2);
  // Three groups, as on a plain cylinder: the tread (with its shoulders),
  // then each sidewall. The tyre compounds paint them separately, and a
  // tyre without its groups isn't drawn at all
  const ix = g.index?.array, n = prof.length;
  if (ix && ix.length > 0) {
    const parts = [[], [], []];
    for (let t = 0; t < ix.length; t += 3) {
      const j = Math.min(ix[t] % n, ix[t + 1] % n, ix[t + 2] % n);
      parts[j >= 2 && j < n - 3 ? 0 : j < 2 ? 1 : 2].push(ix[t], ix[t + 1], ix[t + 2]);
    }
    // (UVs as on a plain cylinder: the tread round and across, each sidewall a disc)
    const P = g.attributes.position, uv = new Float32Array(P.count * 2);
    for (let v = 0; v < P.count; v++) {
      const j = v % n, x = P.getX(v), y = P.getY(v), z = P.getZ(v);
      if (j >= 2 && j <= n - 3) { uv[v * 2] = Math.floor(v / n) / seg; uv[v * 2 + 1] = Math.max(0, Math.min(1, x / w + 0.5)); }
      else { uv[v * 2] = y / (2 * r) + 0.5; uv[v * 2 + 1] = z / (2 * r) + 0.5; }
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const all = [].concat(...parts);
    g.setIndex(all); g.clearGroups();
    let at = 0; parts.forEach((q, m) => { g.addGroup(at, q.length, m); at += q.length; });
  }
  return g;
}
const box = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const g = roundedBox(w, h, d);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
};
const rod = (a, b, r = 0.012) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, 10);
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
    blue: new THREE.MeshPhysicalMaterial({ color: 0xe0231b, roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),      // (the red)
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),    // (the white)
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
  MAT.seat = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 });   // (the seat and the cockpit's padded rim)
  MAT.suit = new THREE.MeshStandardMaterial({ color: DRIVER_SUITS.f1.suit, roughness: 0.8 });   // (the driver's overalls: the team's)
  MAT.dark = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8, side: THREE.DoubleSide });
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };

  // --- ONE SKIN, NOSE TO GEARBOX (sweptSkin), as the later TTFs are made:
  // a very low car, the driver lying well back in it. A long low nose
  // swelling into the tub, low cockpit sides, low flat pods with their
  // mouths behind the front wheels, a low engine cover with a small
  // airbox over the roll hoop. The livery, our own: red over the top and
  // white below, a white arrowhead pointing forward down each side of the
  // pods and running out in a point at their front
  const PAINT = [MAT.blue, MAT.yellow, MAT.carbon, MAT.dark];
  // (the edge between red above and white below, along the pods: high at
  // the front, so the white comes to a point there, dropping toward the back)
  const edgeY = (z) => 0.4 - (0.48 - z) * 0.26;
  const sk = sweptSkin(car, addPanel, add, PAINT, {
    nose: { z: [2.5, 2.3, 2.0, 1.7, 1.35, 1.0, 0.8, 0.66, 0.62], hw: [0.075, 0.11, 0.15, 0.18, 0.22, 0.26, 0.29, 0.3, 0.303], yb: [0.1, 0.095, 0.09, 0.085, 0.08, 0.075, 0.072, 0.072, 0.072], yt: [0.19, 0.24, 0.3, 0.36, 0.42, 0.47, 0.5, 0.51, 0.51] },
    body: { z: [0.6, 0.3, 0.0, -0.3, -0.6, -1.0, -1.4, -1.88], yTop: [0.51, 0.5, 0.5, 0.6, 0.63, 0.56, 0.45, 0.32], CW: [0.3, 0.3, 0.29, 0.24, 0.22, 0.2, 0.15, 0.1],
      xc: [0.5, 0.58, 0.58, 0.55, 0.5, 0.4, 0.3, 0.15], yc: [0.36, 0.37, 0.37, 0.36, 0.34, 0.3, 0.26, 0.22], xo: [0.68, 0.74, 0.74, 0.72, 0.66, 0.52, 0.38, 0.2], yo: [0.2, 0.2, 0.2, 0.2, 0.2, 0.19, 0.18, 0.17], yb: 0.065 },
    open: [[0.8, 0], [0.64, 0], [0.6, 0.17], [0.4, 0.21], [-0.02, 0.21], [-0.1, 0.1], [-0.16, 0], [-0.5, 0]], RIM: 0.5,
    paint: (part, seg, z, x, y) => {
      if (part === 'join') return 3;
      if (seg === 6) return 2;
      if (part === 'nose') return seg <= 2 ? 0 : 1;                          // (the nose: red over the top, white down its sides)
      return seg <= 2 ? 0 : 1;                                                // (the cockpit's top and the cover red; the pods white, the red laid over them below)
    },
    mouthX: 0.33, duct: 0.3, tipPaint: 0,
  });
  const { S } = sk;
  // THE ARROWHEAD: the red over each pod, from its crown down to the edge,
  // laid on the skin and cut exactly along that line (so the white below
  // comes to a clean point at the front, not a staircase)
  for (const sx of [1, -1]) {
    const rows = [], M = 14;
    for (let i = 0; i <= 70; i++) {
      const z = 0.6 - i / 70 * 2.48, u = sk.upper(z).slice(3 * S, 6 * S + 1), ey = edgeY(z);
      // (along the section from the crown down, to where it crosses the edge)
      const len = [0]; for (let k = 1; k < u.length; k++) len.push(len[k - 1] + Math.hypot(u[k][0] - u[k - 1][0], u[k][1] - u[k - 1][1]));
      let L = u[0][1] <= ey ? 0 : len[len.length - 1];
      for (let k = 1; k < u.length; k++) if (u[k][1] <= ey && u[k - 1][1] > ey) { const t = (u[k - 1][1] - ey) / (u[k - 1][1] - u[k][1]); L = len[k - 1] + t * (len[k] - len[k - 1]); break; }
      const at = (d) => { let k = 1; while (k < u.length - 1 && len[k] < d) k++; const t = (d - len[k - 1]) / ((len[k] - len[k - 1]) || 1), a = u[k - 1], b = u[k]; const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [sx * (a[0] + tx * t - ty / l * 0.003), a[1] + ty * t + tx / l * 0.003, z]; };
      const row = []; for (let j = 0; j <= M; j++) row.push(at(L * j / M)); rows.push(row);
    }
    const m = new THREE.Mesh(sk.grid(rows, M, sx > 0), MAT.blue); m.castShadow = true; m.receiveShadow = true; car.add(m); addPanel(m);
  }
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
  // the little smoked screen at the front of the opening
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10, 1, true, -0.9, 1.8).rotateX(-0.35).translate(0, 0.55, 0.46), MAT.glass, false);
  // the driver: a helmet with a dark visor, his shoulders just below the rim
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.visor);
  // (a red and white helmet stripe)
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.665, -0.06), MAT.blue);
  // mirrors: pods on stalks at the cockpit sides (each pod can be knocked
  // off, leaving its stalk; the pit crew fit a new one)
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.31, 0.49, 0.55], [s * 0.42, 0.6, 0.56], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: 0.59, w: 0.12, h: 0.065, y: 0.585, x: s * 0.45 }, { z: 0.53, w: 0.13, h: 0.072, y: 0.582, x: s * 0.45 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.105, 0.058).rotateY(Math.PI).translate(s * 0.45, 0.62, 0.524), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.45, 0.62, 0.56] };
  }
  // --- the small airbox over the roll hoop, its mouth behind his head
  add(loft([{ z: -0.17, w: 0.24, h: 0.18, y: 0.46 }, { z: -0.32, w: 0.3, h: 0.27, y: 0.46 }, { z: -0.6, w: 0.32, h: 0.19, y: 0.48 }, { z: -0.95, w: 0.26, h: 0.06, y: 0.5 }], 1.0, 40, 8, true), MAT.blue);
  add(loft([{ z: -0.16, w: 0.14, h: 0.09, y: 0.53 }, { z: -0.21, w: 0.14, h: 0.09, y: 0.53 }], 1.2, 20, 1, false), MAT.dark, false);
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

  // THE SPONSORS: the tobacco brand (shared with the TTF-94) on the white
  // arrowhead down each pod and across the rear wing, the fuel on the
  // nose's white sides, the tyres on the endplates, small ones as badges
  if (typeof document !== 'undefined') {
    const red = '#d2111c', main = sponsorDecal('VESPERO', red), fuel = sponsorDecal('TORRIN', '#1a1c20', 768, 256);
    for (const sx of [1, -1]) {
      decalOnSkin(car, addPanel, sk, sk.secB, 0.42, -0.28, 4 * S + 2, 5 * S + 3, main, sx);        // (the white of the pod's side)
      decalOnSkin(car, addPanel, sk, sk.secA, 1.6, 1.0, 3 * S, 4 * S + 2, fuel, sx);               // (the nose's white side)
      decalOnSkin(car, addPanel, sk, sk.secB, -0.85, -1.15, 2 * S, 3 * S, sponsorBadge('VELTRIS', '#ffffff'), sx);   // (small ones on the cover)
      decalOnSkin(car, addPanel, sk, sk.secB, 0.55, 0.36, S, 2 * S - 1, sponsorBadge('KORVANE', '#ffffff'), sx);     // (and by the cockpit)
      wings.rear.add(flatDecal(0.36, 0.18, sx * 0.452, 0.82, -2.0, sponsorDecal('VESPERO', red, 512, 256)));
      wings.rear.add(flatDecal(0.3, 0.1, sx * 0.452, 0.6, -2.02, sponsorDecal('VALCOR', '#1a1c20', 768, 256)));
    }
    wings.rear.add(flatDecal(0.8, 0.16, 0, 1.013, -2.24, sponsorDecal('VESPERO', '#ffffff', 1280, 256), 'top', 0.7));
  }
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}

// =====================================================================
// ONE SKIN, NOSE TO GEARBOX (the TTF cars' bodies): one cross-section at
// every point along the car, the same eight points round it each time
// (the middle of the top, the cover's edge, the fillet, the pod's crown,
// its shoulder, its widest, the floor's edge, the middle underneath),
// swept from the nose's tip to the back and mirrored; the pods' mouths
// left open, a dark duct and a radiator inside each. cfg:
//   nose: { z: [...], hw, yb, yt }   (the nose: keys from its tip back)
//   body: { z: [...], yTop, CW, xc, yc, xo, yo, yb }   (behind the nose)
//   open: [[z, half-width], ...], RIM: the cockpit rim's height
//   paint(part, seg, z, x, y): which of PAINT each strip is (-1: none)
//   mouthX: the tub's side (the mouth is outside it), duct: how deep
// Returns what's needed to put things on it (upper, surfY, sample, ...)
// =====================================================================
function sweptSkin(car, addPanel, add, PAINT, cfg) {
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  const N = cfg.nose, B = cfg.body, keys = (zs, v) => curveAny(zs.map((z, i) => [z, v[i]]));
  const hwA = keys(N.z, N.hw), ybA = keys(N.z, N.yb), ytA = keys(N.z, N.yt);
  const yTop = keys(B.z, B.yTop), CW = keys(B.z, B.CW), xc = keys(B.z, B.xc), yc = keys(B.z, B.yc), xo = keys(B.z, B.xo), yo = keys(B.z, B.yo);
  const ZJ = N.z[N.z.length - 1], ZB0 = B.z[0], ZB1 = B.z[B.z.length - 1], yFloor = B.yb ?? 0.11;
  const OWc = curveAny(cfg.open), oz = cfg.open.filter((p) => p[1] > 0).map((p) => p[0]), oFront = Math.max(...oz) + 0.035, oBack = Math.min(...oz) - 0.07;
  const OW = (z) => (z > oFront || z < oBack ? 0 : Math.max(0, OWc(z)));
  const RIM = cfg.RIM;
  const secA = (z) => {
    const hw = hwA(z), yb = ybA(z), yt = ytA(z), h = yt - yb, o = OW(z);
    return [[o, yt], [Math.max(o + 0.02, hw * 0.55), yt - 0.008], [hw * 0.86, yt - h * 0.12], [hw * 0.98, yt - h * 0.35], [hw, yb + h * 0.5], [hw * 0.96, yb + h * 0.2], [hw * 0.75, yb + 0.004], [0, yb]];
  };
  const secB = (z) => {
    const o = OW(z), k = Math.min(1, o / 0.2), yt = yTop(z) + (RIM - yTop(z)) * k, cw = Math.max(o + 0.03, CW(z));
    const fil = [Math.min(xc(z) - 0.05, cw + 0.07), Math.max(yc(z) + 0.03, yt - 0.12)];
    const sh = [(xc(z) + xo(z) * 2) / 3 + 0.01, (yc(z) + yo(z) * 2) / 3 + 0.05];
    return [[o, yt], [cw, yt - 0.03], fil, [xc(z), yc(z)], sh, [xo(z), yo(z)], [xo(z) - 0.05, yFloor + 0.01], [0, yFloor]];
  };
  const S = 5, NP = 7 * S;
  const sample = (P) => {
    const out = [], at = (i) => P[Math.max(0, Math.min(P.length - 1, i))];
    for (let k = 0; k <= NP; k++) {
      const seg = Math.min(6, Math.floor(k / S)), t = k / S - seg, a = at(seg - 1), b = at(seg), c = at(seg + 1), d = at(seg + 2);
      out.push([cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)]);
    }
    return out;
  };
  const upper = (z) => sample(z > ZJ ? secA(z) : secB(z)).map((p) => [p[0], p[1], z]);
  const surfY = (z, x) => {
    const u = upper(z);
    for (let i = 0; i < u.length - 1; i++) { const a = u[i], b = u[i + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
    return u[0][1];
  };
  const grid = (rows, m, flip = false) => {
    const pos = [], idx = [];
    for (const row of rows) for (const p of row) pos.push(p[0], p[1], p[2]);
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < m; k++) { const p0 = i * (m + 1) + k, p1 = p0 + m + 1; if (flip) idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); else idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.computeVertexNormals(); return g;
  };
  const mirrorX = (g, s) => { if (s > 0) return g; g.scale(-1, 1, 1); const ix = g.index?.array; if (!ix || !(ix.length > 0)) return g; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); return g; };
  const skin = (rows, part) => {
    const pos = [], lists = PAINT.map(() => []);
    for (const r of rows) for (const p of r.pts) pos.push(p[0], p[1], r.z);
    const W = NP + 1;
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < NP; k++) {
      const p0 = i * W + k, p1 = p0 + W, seg = Math.min(6, Math.floor(k / S)), q = rows[i].pts[k], q2 = rows[i + 1].pts[k + 1];
      const m = cfg.paint(part, seg, (rows[i].z + rows[i + 1].z) / 2, (q[0] + q2[0]) / 2, (q[1] + q2[1]) / 2); if (m < 0) continue;
      lists[m].push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1);
    }
    const g = new THREE.BufferGeometry(), idx = [];
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    lists.forEach((l, m) => { if (l.length) { g.addGroup?.(idx.length, l.length, m); for (const v of l) idx.push(v); } });
    g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const rowsA = [], rowsB = [];
  for (let i = 0; i <= 40; i++) { const z = N.z[0] + (ZJ - N.z[0]) * i / 40; rowsA.push({ z, pts: sample(secA(z)) }); }
  for (let i = 0; i <= 64; i++) { const z = ZB0 + (ZB1 - ZB0) * i / 64; rowsB.push({ z, pts: sample(secB(z)) }); }
  const MX = cfg.mouthX;
  for (const s of [1, -1]) {
    for (const [rows, part] of [[rowsA, 'nose'], [rowsB, 'body'], [[rowsA[rowsA.length - 1], rowsB[0]], 'join']]) {
      const m = new THREE.Mesh(mirrorX(skin(rows, part), s), PAINT); m.castShadow = true; m.receiveShadow = true; car.add(m); addPanel(m);
    }
    // the mouth: a dark duct back into the pod, the radiator at the back of it
    { const r = rowsB[0].pts, z0 = rowsB[0].z, z1 = z0 - (cfg.duct ?? 0.32);
      const loop = r.filter((p) => p[0] > MX).map((p) => [p[0], p[1]]);
      loop.push([MX + 0.002, Math.max(yFloor + 0.01, loop[loop.length - 1][1])], [MX + 0.002, loop[0][1]]);
      const cx = loop.reduce((a, p) => a + p[0], 0) / loop.length, cy = loop.reduce((a, p) => a + p[1], 0) / loop.length;
      const inset = (p, k) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k];
      const duct = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.85, side: THREE.DoubleSide });
      const rows = [loop.map((p) => [p[0], p[1], z0]), loop.map((p) => { const q = inset(p, 0.8); return [q[0], q[1], z1]; })];
      rows.forEach((row) => row.push(row[0]));
      car.add(new THREE.Mesh(mirrorX(grid(rows, loop.length), s), duct));
      const sh = new THREE.Shape(); loop.forEach((p, i) => { const q = inset(p, 0.8); if (i) sh.lineTo(q[0], q[1]); else sh.moveTo(q[0], q[1]); });
      add(mirrorX(new THREE.ShapeGeometry(sh).translate(0, 0, z1), s), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }), false); }
    // the back end closed off round the gearbox
    { const r = rowsB[rowsB.length - 1], sh = new THREE.Shape(); sh.moveTo(0, r.pts[0][1]); for (const p of r.pts) sh.lineTo(p[0], p[1]);
      add(mirrorX(new THREE.ShapeGeometry(sh).translate(0, 0, r.z), s), PAINT[3], false); }
  }
  // (the tip, closed)
  { const z = N.z[0], hw = hwA(z), yb = ybA(z), yt = ytA(z);
    add(loft([{ z: z + 0.005, w: hw * 2, h: yt - yb, y: yb }, { z: z - 0.04, w: hw * 2.05, h: yt - yb + 0.005, y: yb - 0.002 }], 0.8, 40, 6, true), PAINT[cfg.tipPaint ?? 0]); }
  // INSIDE THE COCKPIT: lined in black, so from his seat you see the inside of the tub
  { const liner = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide });
    for (const sx of [1, -1]) {
      const rows = [];
      for (let i = 0; i <= 40; i++) {
        const z = oFront - 0.01 - i / 40 * (oFront - oBack), o = Math.max(0.004, OW(z)), hw = Math.min(0.28, o + 0.1);
        rows.push([[o, RIM - 0.004], [o + 0.012, RIM - 0.05], [hw, RIM - 0.12], [hw, yFloor + 0.09], [hw * 0.7, yFloor + 0.02], [0, yFloor + 0.01]].map((q) => [sx * q[0], q[1], z]));
      }
      const m = new THREE.Mesh(grid(rows, 5), liner); m.receiveShadow = true; car.add(m);
    } }
  // (a strip laid on the skin: along z0..z1, across from x(z)-w to x(z)+w; for stripes and flashes)
  const strip = (z0, z1, xAt, wAt, mat, n = 30) => {
    for (const s of [1, -1]) {
      const rows = [];
      for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n, x = xAt(z), w = wAt(z); rows.push([x - w, x, x + w].map((xx) => [s * xx, surfY(z, xx) + 0.004, z])); }
      const mm = mat.userData.twoSided || (mat.userData.twoSided = Object.assign(mat.clone(), { side: THREE.DoubleSide }));   // (seen from either side, however it's wound)
      const m = new THREE.Mesh(grid(rows, 2), mm); m.renderOrder = 2; m.receiveShadow = true; car.add(m); addPanel(m);
    }
  };
  return { upper, surfY, sample, secA, secB, S, NP, OW, RIM, grid, mirrorX, strip, yTop, CW, xc, yc, xo, yo, hwA, ytA };
}

// =====================================================================
// THE SPONSORS (all made up): each one's badge, drawn in a square of side
// d at (x, y) (its top left), in its own colours (ink: the lettering's
// colour on the panel it's on). Used by every TTF car
// =====================================================================
const LOGO = {
  // a mobile network: three swept arcs, like a signal on the wind
  ZEPHRA: (g, x, y, d, ink) => { g.lineCap = 'round'; [['#29c4f6', 0.18], [ink, 0.3], [ink, 0.42]].forEach(([c, r]) => { g.strokeStyle = c; g.lineWidth = d * 0.09; g.beginPath(); g.arc(x + d * 0.2, y + d * 0.8, d * r * 1.6, -1.25, -0.25); g.stroke(); }); g.fillStyle = '#29c4f6'; g.beginPath(); g.arc(x + d * 0.2, y + d * 0.8, d * 0.08, 0, 7); g.fill(); },
  // shipping: a slanted block with a K cut out of it, a wave under it
  KORVANE: (g, x, y, d, ink) => { g.fillStyle = '#e8462a'; g.beginPath(); g.moveTo(x + d * 0.25, y + d * 0.1); g.lineTo(x + d, y + d * 0.1); g.lineTo(x + d * 0.75, y + d * 0.72); g.lineTo(x, y + d * 0.72); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.font = `italic 900 ${d * 0.56}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('K', x + d * 0.5, y + d * 0.43); g.textAlign = 'left';
    g.strokeStyle = ink; g.lineWidth = d * 0.06; g.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20; g.lineTo(x + u * d, y + d * 0.88 + Math.sin(u * 12) * d * 0.04); } g.stroke(); },
  // fuel: a red drop with a flame of orange and yellow inside it
  ELX: (g, x, y, d) => { const drop = (s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x + d / 2, y + d * (0.5 - 0.48 * s)); g.bezierCurveTo(x + d / 2 + d * 0.42 * s, y + d * (0.5 - 0.05 * s), x + d / 2 + d * 0.38 * s, y + d * (0.52 + 0.45 * s), x + d / 2, y + d * (0.52 + 0.45 * s)); g.bezierCurveTo(x + d / 2 - d * 0.38 * s, y + d * (0.52 + 0.45 * s), x + d / 2 - d * 0.42 * s, y + d * (0.5 - 0.05 * s), x + d / 2, y + d * (0.5 - 0.48 * s)); g.fill(); };
    drop(1, '#d81e1e'); g.save(); g.translate(0, d * 0.12); drop(0.55, '#ff9a14'); drop(0.3, '#ffe14a'); g.restore(); },
  // electronics: a hexagon round a chevron
  VELTRIS: (g, x, y, d, ink) => { g.strokeStyle = ink; g.lineWidth = d * 0.08; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(x + d / 2 + Math.cos(a) * d * 0.44, y + d / 2 + Math.sin(a) * d * 0.44); } g.closePath(); g.stroke();
    g.fillStyle = '#1f8fd6'; g.beginPath(); g.moveTo(x + d * 0.27, y + d * 0.32); g.lineTo(x + d * 0.5, y + d * 0.72); g.lineTo(x + d * 0.73, y + d * 0.32); g.lineTo(x + d * 0.6, y + d * 0.32); g.lineTo(x + d * 0.5, y + d * 0.52); g.lineTo(x + d * 0.4, y + d * 0.32); g.closePath(); g.fill(); },
  // a bank: a globe, banded
  TERAVO: (g, x, y, d, ink) => { g.save(); g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.44, 0, 7); g.clip(); g.fillStyle = ink; g.fillRect(x, y, d, d); g.fillStyle = '#f6c51a'; for (let k = 0; k < 3; k++) g.fillRect(x, y + d * (0.27 + k * 0.2), d, d * 0.07); g.restore(); g.strokeStyle = '#f6c51a'; g.lineWidth = d * 0.05; g.beginPath(); g.ellipse(x + d / 2, y + d / 2, d * 0.16, d * 0.44, 0, 0, 7); g.stroke(); },
  // computing: a Q, a ring with a red square for its tail
  QUANTEX: (g, x, y, d, ink) => { g.strokeStyle = ink; g.lineWidth = d * 0.12; g.beginPath(); g.arc(x + d * 0.45, y + d * 0.45, d * 0.32, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#d8312a'; g.fillRect(x + d * 0.66, y + d * 0.66, d * 0.24, d * 0.24); },
  // watches: a four-pointed star in a ring
  NOVIK: (g, x, y, d, ink) => { g.strokeStyle = ink; g.lineWidth = d * 0.05; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.45, 0, 7); g.stroke(); g.fillStyle = ink; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? d * 0.1 : d * 0.36; g.lineTo(x + d / 2 + Math.cos(a) * r, y + d / 2 + Math.sin(a) * r); } g.closePath(); g.fill(); },
  // an energy drink: two flames, red over orange
  ARDENTA: (g, x, y, d) => { const f = (s, ox, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x + d * ox, y + d * 0.95); g.quadraticCurveTo(x + d * (ox - 0.3 * s), y + d * 0.5, x + d * (ox + 0.05), y + d * (1 - 0.95 * s)); g.quadraticCurveTo(x + d * (ox + 0.35 * s), y + d * 0.55, x + d * ox, y + d * 0.95); g.fill(); }; f(1, 0.45, '#ff9a14'); f(0.75, 0.55, '#d81e1e'); },
  // a satellite network: a tilted orbit round a planet
  // THE TEAM ITSELF (the carmaker's place on the TTF-05): a shield, a white chevron on it
  TTF: (g, x, y, d) => { g.fillStyle = '#f2c200'; g.strokeStyle = '#0b1a44'; g.lineWidth = d * 0.06; g.beginPath(); g.moveTo(x + d * 0.15, y + d * 0.1); g.lineTo(x + d * 0.85, y + d * 0.1); g.lineTo(x + d * 0.85, y + d * 0.55); g.quadraticCurveTo(x + d * 0.82, y + d * 0.82, x + d * 0.5, y + d * 0.95); g.quadraticCurveTo(x + d * 0.18, y + d * 0.82, x + d * 0.15, y + d * 0.55); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#0b1a44'; g.lineWidth = d * 0.11; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(x + d * 0.3, y + d * 0.35); g.lineTo(x + d * 0.5, y + d * 0.6); g.lineTo(x + d * 0.7, y + d * 0.35); g.stroke(); },
  // LEASING (the TTF-05's): an orange road curving off to the horizon
  LEASEWAY: (g, x, y, d) => { g.strokeStyle = '#f07a12'; g.lineCap = 'round'; g.lineWidth = d * 0.13; g.beginPath(); g.moveTo(x + d * 0.12, y + d * 0.86); g.quadraticCurveTo(x + d * 0.62, y + d * 0.72, x + d * 0.88, y + d * 0.2); g.stroke(); g.lineWidth = d * 0.05; g.beginPath(); g.moveTo(x + d * 0.36, y + d * 0.9); g.quadraticCurveTo(x + d * 0.78, y + d * 0.74, x + d * 0.94, y + d * 0.36); g.stroke(); },
  // FASHION (the TTF-05's): a white five-petal flower, yellow at its heart
  FLORO: (g, x, y, d) => { const cx = x + d / 2, cy = y + d / 2; g.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * d * 0.24, cy + Math.sin(a) * d * 0.24, d * 0.2, d * 0.13, a, 0, 7); g.fill(); } g.fillStyle = '#f2c200'; g.beginPath(); g.arc(cx, cy, d * 0.13, 0, 7); g.fill(); },
  // WATCHES (the TTF-05's): a dial, its hands at ten to two
  TEMPRA: (g, x, y, d, ink) => { const cx = x + d / 2, cy = y + d / 2; g.strokeStyle = ink; g.lineWidth = d * 0.07; g.beginPath(); g.arc(cx, cy, d * 0.4, 0, 7); g.stroke(); g.lineCap = 'round';
    for (const [a, l] of [[-2.25, 0.26], [-0.9, 0.32]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * d * l, cy + Math.sin(a) * d * l); g.stroke(); } g.fillStyle = '#e8462a'; g.beginPath(); g.arc(cx, cy, d * 0.06, 0, 7); g.fill(); },
  // PHONES (the TTF-05's): a lime speed-swoosh round a dot
  TELESPEED: (g, x, y, d) => { g.strokeStyle = '#c6f23a'; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { g.lineWidth = d * (0.1 - k * 0.025); g.beginPath(); g.arc(x + d * 0.42, y + d * 0.55, d * (0.2 + k * 0.13), -2.4, 0.3); g.stroke(); } g.fillStyle = '#c6f23a'; g.beginPath(); g.arc(x + d * 0.42, y + d * 0.55, d * 0.09, 0, 7); g.fill(); },
  ORBIXA: (g, x, y, d, ink) => { g.fillStyle = '#29c4f6'; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.22, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = d * 0.06; g.beginPath(); g.ellipse(x + d / 2, y + d / 2, d * 0.46, d * 0.17, -0.5, 0, 7); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x + d * 0.88, y + d * 0.3, d * 0.06, 0, 7); g.fill(); },
  // the tyres: a tread-ringed wheel, in yellow
  VALCOR: (g, x, y, d) => { g.strokeStyle = '#f6c51a'; g.lineWidth = d * 0.14; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.36, 0, 7); g.stroke(); g.fillStyle = '#f6c51a'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.save(); g.translate(x + d / 2 + Math.cos(a) * d * 0.45, y + d / 2 + Math.sin(a) * d * 0.45); g.rotate(a); g.fillRect(-d * 0.04, -d * 0.05, d * 0.08, d * 0.1); g.restore(); } g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.1, 0, 7); g.fill(); },
  // TOBACCO (the TTF-05's): three pale-blue curls rising in a ring
  'PURE SPIRIT': (g, x, y, d) => { g.fillStyle = '#7fd0f5'; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.44, 0, 7); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = d * 0.05; g.beginPath(); g.arc(x + d / 2, y + d / 2, d * 0.465, 0, 7); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = d * 0.07; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16; g.lineTo(x + d * (0.3 + k * 0.2) + Math.sin(u * 6 + k) * d * 0.06, y + d * (0.82 - u * 0.62)); } g.stroke(); } },
  // TOBACCO (the TTF-88's and TTF-94's): a gold crown over a red shield with a white V
  VESPERO: (g, x, y, d) => { g.fillStyle = '#d2111c'; g.beginPath(); g.moveTo(x + d * 0.18, y + d * 0.3); g.lineTo(x + d * 0.82, y + d * 0.3); g.lineTo(x + d * 0.82, y + d * 0.62); g.quadraticCurveTo(x + d * 0.8, y + d * 0.86, x + d * 0.5, y + d * 0.98); g.quadraticCurveTo(x + d * 0.2, y + d * 0.86, x + d * 0.18, y + d * 0.62); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + d * 0.32, y + d * 0.42); g.lineTo(x + d * 0.42, y + d * 0.42); g.lineTo(x + d * 0.5, y + d * 0.68); g.lineTo(x + d * 0.58, y + d * 0.42); g.lineTo(x + d * 0.68, y + d * 0.42); g.lineTo(x + d * 0.54, y + d * 0.82); g.lineTo(x + d * 0.46, y + d * 0.82); g.closePath(); g.fill();
    g.fillStyle = '#e8b43a'; g.beginPath(); g.moveTo(x + d * 0.24, y + d * 0.26); g.lineTo(x + d * 0.22, y + d * 0.04); g.lineTo(x + d * 0.36, y + d * 0.16); g.lineTo(x + d * 0.5, y + d * 0.02); g.lineTo(x + d * 0.64, y + d * 0.16); g.lineTo(x + d * 0.78, y + d * 0.04); g.lineTo(x + d * 0.76, y + d * 0.26); g.closePath(); g.fill(); },
  // FUEL (the TTF-94's): a yellow sun, a red flame rising through it
  SOLVARA: (g, x, y, d) => { g.fillStyle = '#ffd21a'; g.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, r = k % 2 ? d * 0.36 : d * 0.47; g.lineTo(x + d / 2 + Math.cos(a) * r, y + d / 2 + Math.sin(a) * r); } g.closePath(); g.fill();
    g.fillStyle = '#d2111c'; g.beginPath(); g.moveTo(x + d * 0.5, y + d * 0.84); g.quadraticCurveTo(x + d * 0.28, y + d * 0.6, x + d * 0.5, y + d * 0.18); g.quadraticCurveTo(x + d * 0.72, y + d * 0.6, x + d * 0.5, y + d * 0.84); g.fill(); },
  // FUEL (the TTF-88's): a green hexagon with a white drop and a wing
  TORRIN: (g, x, y, d) => { g.fillStyle = '#1f8a4c'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.lineTo(x + d / 2 + Math.cos(a) * d * 0.47, y + d / 2 + Math.sin(a) * d * 0.47); } g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + d * 0.45, y + d * 0.2); g.bezierCurveTo(x + d * 0.7, y + d * 0.5, x + d * 0.62, y + d * 0.8, x + d * 0.45, y + d * 0.8); g.bezierCurveTo(x + d * 0.28, y + d * 0.8, x + d * 0.2, y + d * 0.5, x + d * 0.45, y + d * 0.2); g.fill();
    g.fillStyle = '#ffd21a'; g.beginPath(); g.moveTo(x + d * 0.55, y + d * 0.52); g.lineTo(x + d * 0.9, y + d * 0.38); g.lineTo(x + d * 0.84, y + d * 0.5); g.lineTo(x + d * 0.92, y + d * 0.52); g.lineTo(x + d * 0.6, y + d * 0.62); g.closePath(); g.fill(); },
};
const SUB = { LEASEWAY: 'LEASING', ELX: 'PETROLEUM', KORVANE: 'LOGISTICS', VALCOR: 'TYRES', ZEPHRA: 'MOBILE', TERAVO: 'BANK', SOLVARA: 'FUELS', TORRIN: 'OIL' };
// a sponsor's decal: its badge and its name (and what it is, under it)
// (solid, not see-through: drawn with the car's own paint, so smoke, fire
// and dust in front hide it just as they hide the body; cut out where the
// picture's empty)
function sponsorMat(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, alphaToCoverage: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.3, side: THREE.DoubleSide });
}
function sponsorDecal(text, ink, w = 1024, h = 256, opts = {}) { return sponsorMat(sponsorCanvas(text, ink, w, h, opts)); }
function sponsorCanvas(text, ink, w = 1024, h = 256, { name = true, logo = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  // (the badge a true circle at the picture's height, the name after it at its natural
  // width, never squeezed or stretched; the pair centred along the picture)
  const d = h * 0.78, pad = h * 0.08, gap = logo ? h * 0.14 : 0, sub = SUB[text];
  let fs = h * (sub ? 0.52 : 0.62), tw = 0;
  const font = () => `italic 900 ${fs}px Arial, Helvetica, sans-serif`;
  if (name) {
    g.font = font(); const room = w - 2 * pad - (logo ? d + gap : 0);
    while (g.measureText(text).width > room && fs > 16) { fs -= 4; g.font = font(); }
    tw = g.measureText(text).width;
  }
  const total = (logo ? d : 0) + (name ? gap + tw : 0), x0 = Math.max(pad, (w - total) / 2);
  if (logo) (LOGO[text] || LOGO.NOVIK)(g, x0, (h - d) / 2, d, ink);
  if (name) {
    const tx = x0 + (logo ? d + gap : 0);
    g.font = font(); g.fillStyle = ink; g.textBaseline = 'middle';
    g.fillText(text, tx, h / 2 - (sub ? h * 0.1 : -h * 0.03));
    if (sub) { g.font = `700 ${h * 0.17}px Arial, Helvetica, sans-serif`; g.fillStyle = text === 'ELX' ? '#d81e1e' : ink; g.fillText(sub.split('').join(String.fromCharCode(8202)), tx + 4, h / 2 + h * 0.27); }
  }
  return c;
}
// a small sponsor: its badge alone, no name
function sponsorBadge(text, ink = '#ffffff', d = 256) {
  const c = document.createElement('canvas'); c.width = d; c.height = d; const g = c.getContext('2d');
  (LOGO[text] || LOGO.NOVIK)(g, d * 0.04, d * 0.04, d * 0.92, ink);
  return sponsorMat(c);
}
// A TEAM DRIVER'S SUIT, printed: the material for his chest (wrapped round
// it: across the picture is round his body, the front at its edges, the
// back in its middle; up the picture is up him). The TTF-05's: light blue,
// yellow stripes down the front beside each arm, the tobacco brand big on
// the chest and the back, the fuel and the title sponsor smaller on the front
export function suitTorsoMaterial(kind) {
  if (kind !== 'f05' || typeof document === 'undefined') return null;
  // (across the picture is round his body: the front at both edges, his sides at a
  // quarter and three quarters, the back in the middle; down the picture is down him,
  // the collar at the top, the hips at the bottom. A metre round him is wider in the
  // picture than a metre up him, so each name is drawn to come out the right shape)
  const W = 1024, H = 512, PXU = 1080, PXV = 880, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const SKY = '#2f9be0', NAVY = '#0b1a44', YEL = '#f2c200';
  const wrap = (fn) => { for (const off of [0, -W, W]) { g.save(); g.translate(off, 0); fn(); g.restore(); } };
  g.fillStyle = SKY; g.fillRect(0, 0, W, H);
  // a darker blue fading down the lower half, as the real one's dye runs darker toward the legs
  { const gr = g.createLinearGradient(0, H * 0.45, 0, H); gr.addColorStop(0, 'rgba(10,40,120,0)'); gr.addColorStop(1, 'rgba(10,40,120,0.45)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // the navy side panels: up each flank from the hips, curving out to the armpits
  g.fillStyle = NAVY;
  for (const u of [0.25, 0.75]) wrap(() => { const cx = u * W; g.beginPath(); g.moveTo(cx - 150, H); g.bezierCurveTo(cx - 140, H * 0.55, cx - 70, H * 0.3, cx - 50, H * 0.12); g.lineTo(cx + 50, H * 0.12); g.bezierCurveTo(cx + 70, H * 0.3, cx + 140, H * 0.55, cx + 150, H); g.closePath(); g.fill(); });
  // the collar, navy
  g.fillRect(0, 0, W, H * 0.045);
  // yellow panels on top of each shoulder at the front, a badge in each
  g.fillStyle = YEL;
  for (const u of [0.1, 0.9]) wrap(() => { g.fillRect(u * W - 46, H * 0.05, 92, H * 0.14); });
  // across the back: a broad yellow band, under a pale panel for his number
  g.fillRect(W * 0.5 - 200, H * 0.34, 400, H * 0.11);
  g.fillStyle = '#9fd4f4'; g.fillRect(W * 0.5 - 120, H * 0.08, 240, H * 0.22);
  g.fillStyle = '#ffffff'; g.font = `900 ${H * 0.13}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5', W * 0.5, H * 0.17); g.textAlign = 'left';
  // the belt, navy, round the waist
  g.fillStyle = NAVY; g.fillRect(0, H * 0.83, W, H * 0.07);
  // (a sponsor at u across (centre), y down (centre), wpx wide in the picture, h tall: drawn to that shape on him)
  const put = (name, u, y, wpx, hpx, ink, opts) => {
    const k = 128, cw = Math.round(k * (wpx / PXU) / (hpx / PXV));
    const t = sponsorCanvas(name, ink, Math.max(k, cw), k, opts);
    wrap(() => g.drawImage(t, u * W - wpx / 2, y - hpx / 2, wpx, hpx));
  };
  // the front: the phone company big across his belly, in lime; the fuel, the tyres and the shipping
  // line on his left breast; the team's own badge, the fashion house and the watchmaker on his right
  put('TELESPEED', 0, H * 0.7, 300, 64, '#c6f23a');
  put('ELX', 0.075, H * 0.3, 120, 34, '#ffffff');
  put('VALCOR', 0.075, H * 0.39, 120, 26, '#ffffff');
  put('KORVANE', 0.075, H * 0.47, 130, 28, '#ffffff');
  put('TTF', 0.925, H * 0.32, 110, 34, '#ffffff');
  put('FLORO', 0.925, H * 0.42, 110, 28, '#ffffff');
  put('TEMPRA', 0.925, H * 0.5, 110, 24, '#ffffff');
  for (const u of [0.1, 0.9]) put('TTF', u, H * 0.12, 70, 56, NAVY, { name: false });      // (the badges on the shoulders)
  // the back: the team's name in navy across the yellow band, the shipping line under it
  put('TTF', 0.5, H * 0.395, 260, 50, NAVY);
  put('KORVANE', 0.5, H * 0.58, 280, 56, '#ffffff');
  // the leasing firm on the belt
  put('LEASEWAY', 0.5, H * 0.865, 140, 26, '#ffffff');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
}
// A TEAM DRIVER'S HELMET, painted: the material for its shell (a sphere: round it
// across the picture, the left side at the left edge, the front a quarter of the
// way, the back three quarters; down the picture is down it, the crown at the top).
// The TTF-05's: a blue crown with the main sponsor across the brow on a pale blue
// band; a red band round the middle, a yellow stripe through it; pale blue below,
// in a chequer, down to a yellow rim
export function helmetMaterial(kind) {
  if (kind !== 'f05' || typeof document === 'undefined') return null;
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0 * H, W, (y1 - y0) * H); };
  band(0, 0.2, '#1b56c8');                 // the crown
  band(0.2, 0.36, '#43aaea');              // the pale blue band over the brow
  band(0.36, 0.6, '#d3202b');              // the red band
  band(0.455, 0.505, '#f2c200');           // the yellow stripe through it
  band(0.6, 0.74, '#43aaea');              // pale blue below
  g.fillStyle = '#2a82d6';                 // (its chequer)
  for (let x = 0; x < W; x += 24) for (let y = 0.6 * H; y < 0.74 * H; y += 24) if (((x / 24) + Math.round((y - 0.6 * H) / 24)) % 2 === 0) g.fillRect(x, y, 24, 24);
  band(0.74, 0.78, '#f2c200');             // the yellow rim
  band(0.78, 1, '#101216');                // (its underside, the lining)
  // the names: the main sponsor across the brow (and again round the back), the phone company low on the chin,
  // the leasing firm and the fashion house on each side
  const put = (name, u, y, w, h, ink, opts) => { const t = sponsorCanvas(name, ink, Math.round(128 * w / h), 128, opts); for (const off of [0, -W, W]) g.drawImage(t, u * W - w / 2 + off, y * H - h / 2, w, h); };
  put('PURE SPIRIT', 0.25, 0.28, 300, 52, '#0b1a44');
  put('PURE SPIRIT', 0.75, 0.28, 300, 52, '#0b1a44');
  put('TELESPEED', 0.25, 0.67, 200, 40, '#0b1a44');
  for (const u of [0.0, 0.5]) { put('LEASEWAY', u, 0.54, 150, 30, '#ffffff'); put('FLORO', u + 0.03, 0.67, 120, 30, '#ffffff'); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
}
// (a decal over part of a swept skin: rows along z0..z1, across the section's points k0..k1, lifted just off it)
function decalOnSkin(car, addPanel, sk, secOf, z0, z1, k0, k1, mat, sx) {
  const pos = [], uv = [], idx = [], NZ = 16, NK = k1 - k0;
  for (let i = 0; i <= NZ; i++) {
    const z = z0 + (z1 - z0) * i / NZ, u = sk.sample(secOf(z));
    for (let k = k0; k <= k1; k++) {
      const a = u[Math.max(0, k - 1)], b = u[Math.min(u.length - 1, k + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      pos.push(sx * (u[k][0] - ty / l * 0.006), u[k][1] + tx / l * 0.006, z);
      uv.push(sx > 0 ? i / NZ : 1 - i / NZ, 1 - (k - k0) / NK);
    }
  }
  for (let i = 0; i < NZ; i++) for (let k = 0; k < NK; k++) { const p0 = i * (NK + 1) + k, p1 = p0 + NK + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.renderOrder = 2; car.add(m); addPanel(m); return m;
}
// (a flat decal on a flat face: a plane w x h at (x, y, z), facing out along sx (its side), or up)
function flatDecal(w, h, x, y, z, mat, face = 'side', tilt = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  if (face === 'side') g.rotateY(Math.sign(x || 1) * Math.PI / 2);
  else { g.rotateZ(Math.PI).rotateX(-Math.PI / 2).rotateY(Math.PI); if (tilt) g.rotateX(tilt);   // (on top: read from the front)
    g.translate(0, Math.cos(tilt) * 0.012, Math.sin(tilt) * 0.012); }   // (just off the element's face)
  const m = new THREE.Mesh(g.translate(x, y, z), mat); m.renderOrder = 2; return m;
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
  // THE TTF-05, rebuilt from the real car: from the photos (the museum car
  // head on, the car on track in Canada) and the side and top drawings.
  // Yellow nose and tub with a navy stripe down the nose; light-blue
  // sidepods, engine cover and airbox as one big flowing body, navy along
  // its bottom; a wide light-blue front wing with big navy endplates; a
  // navy-endplated rear wing set well forward
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0x1272e8, roughness: 0.26, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),      // (the bright, deep sky blue)
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf2c200, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2f3f0, roughness: 0.25, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 }),
    navy: new THREE.MeshPhysicalMaterial({ color: 0x07102e, roughness: 0.26, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.4, metalness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: DRIVER_SUITS.f05.suit, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8, side: THREE.DoubleSide }),
    camera: new THREE.MeshStandardMaterial({ color: 0xe8461a, roughness: 0.4 }),
  };
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow || mat === MAT.white || mat === MAT.navy) addPanel(m);
    return m;
  };
  const SMOOTH = 0.85, wingDecals = [];
  // (a surface between lines along the car, and the same for the other side)
  const grid = (rows, m, flip = false) => {
    const pos = [], idx = [];
    for (const row of rows) for (const p of row) pos.push(p[0], p[1], p[2]);
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < m; k++) { const p0 = i * (m + 1) + k, p1 = p0 + m + 1; if (flip) idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); else idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.computeVertexNormals(); return g;
  };
  const mirrorX = (g, s) => { if (s > 0) return g; g.scale(-1, 1, 1); const ix = g.index?.array; if (!ix || !(ix.length > 0)) return g; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); return g; };
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };

  // --- ONE SKIN, NOSE TO GEARBOX. The real car's body is a single
  // surface: the nose swells into the tub, the tub's high walls run back
  // into the sidepods, the pods' tops roll over into the crease and drop
  // to the floor, and the whole lot pinches in to the gearbox. So it is
  // built that way: one cross-section at every point along the car, the
  // same eight points round it each time (the middle of the top, the
  // cover's edge, the fillet, the pod's crown, its shoulder, the crease,
  // the undercut, the middle underneath), swept from the nose's tip to
  // the back, then mirrored. Each strip of it painted as the real car
  const K = (vals) => curveAny(Z.map((z, i) => [z, vals[i]]));
  // (the shape measured off a reference of the real car, slice by slice, at 60
  // points from the pods' mouths back and 40 down the nose: see the notes)
  const Z = [0.5, 0.464, 0.429, 0.393, 0.358, 0.322, 0.286, 0.251, 0.215, 0.18, 0.144, 0.108, 0.073, 0.037, 0.002, -0.034, -0.069, -0.105, -0.141, -0.176, -0.212, -0.247, -0.283, -0.319, -0.354, -0.39, -0.425, -0.461, -0.497, -0.532, -0.568, -0.603, -0.639, -0.675, -0.71, -0.746, -0.781, -0.817, -0.853, -0.888, -0.924, -0.959, -0.995, -1.031, -1.066, -1.102, -1.137, -1.173, -1.208, -1.244, -1.28, -1.315, -1.351, -1.386, -1.422, -1.458, -1.493, -1.529, -1.564, -1.6];
  const yTop = K([0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.712, 0.711, 0.709, 0.707, 0.704, 0.699, 0.69, 0.683, 0.679, 0.677, 0.671, 0.66, 0.646, 0.628, 0.608, 0.585, 0.565, 0.549, 0.538, 0.528, 0.518, 0.509, 0.499, 0.49, 0.482, 0.472, 0.461, 0.45, 0.441, 0.435, 0.429, 0.424, 0.418, 0.413, 0.407, 0.402, 0.398, 0.395, 0.394, 0.392, 0.391, 0.39, 0.388, 0.387, 0.385, 0.384, 0.383, 0.381, 0.38]);
  const x1 = K([0.33, 0.33, 0.32, 0.3, 0.27, 0.22, 0.16, 0.09]), y1 = K([0.56, 0.57, 0.58, 0.64, 0.64, 0.56, 0.46, 0.33]);
  const CW = K([0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.253, 0.247, 0.237, 0.223, 0.213, 0.203, 0.19, 0.158, 0.128, 0.107, 0.11, 0.118, 0.137, 0.152, 0.172, 0.183, 0.19, 0.193, 0.19, 0.193, 0.198, 0.202, 0.207, 0.198, 0.205, 0.222, 0.238, 0.235, 0.212, 0.192, 0.178, 0.165, 0.15, 0.135, 0.124, 0.116, 0.112, 0.108, 0.105, 0.101, 0.097, 0.093, 0.091, 0.09, 0.09, 0.09, 0.09, 0.09]);        // (the tub's walls, then the engine cover's half-width)
  const xc = K([0.412, 0.416, 0.42, 0.425, 0.43, 0.436, 0.44, 0.443, 0.445, 0.447, 0.447, 0.447, 0.446, 0.442, 0.435, 0.427, 0.42, 0.413, 0.403, 0.384, 0.365, 0.35, 0.348, 0.348, 0.353, 0.356, 0.36, 0.359, 0.355, 0.348, 0.338, 0.33, 0.322, 0.317, 0.316, 0.309, 0.304, 0.302, 0.303, 0.294, 0.274, 0.253, 0.239, 0.227, 0.215, 0.202, 0.192, 0.184, 0.177, 0.171, 0.164, 0.158, 0.151, 0.145, 0.139, 0.134, 0.129, 0.124, 0.12, 0.115]), yc = K([0.543, 0.554, 0.563, 0.569, 0.572, 0.573, 0.574, 0.575, 0.575, 0.574, 0.571, 0.568, 0.564, 0.559, 0.555, 0.552, 0.548, 0.544, 0.535, 0.53, 0.52, 0.512, 0.501, 0.489, 0.476, 0.462, 0.45, 0.441, 0.433, 0.426, 0.418, 0.411, 0.403, 0.392, 0.372, 0.352, 0.329, 0.3, 0.27, 0.258, 0.26, 0.264, 0.261, 0.257, 0.255, 0.251, 0.25, 0.25, 0.252, 0.255, 0.257, 0.26, 0.262, 0.265, 0.267, 0.27, 0.272, 0.275, 0.277, 0.28]);
  const xo = K([0.569, 0.576, 0.584, 0.595, 0.606, 0.616, 0.625, 0.631, 0.636, 0.639, 0.64, 0.64, 0.639, 0.637, 0.634, 0.631, 0.627, 0.622, 0.616, 0.61, 0.602, 0.594, 0.586, 0.577, 0.569, 0.56, 0.548, 0.535, 0.519, 0.503, 0.485, 0.466, 0.445, 0.432, 0.426, 0.42, 0.403, 0.381, 0.368, 0.353, 0.337, 0.314, 0.3, 0.289, 0.279, 0.27, 0.261, 0.251, 0.242, 0.233, 0.224, 0.214, 0.205, 0.196, 0.186, 0.177, 0.168, 0.159, 0.149, 0.14]), ycr = K([0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.359, 0.354, 0.335, 0.314, 0.292, 0.282, 0.276, 0.268, 0.261, 0.251, 0.245, 0.239, 0.235, 0.232, 0.228, 0.229, 0.231, 0.226, 0.216, 0.204, 0.201, 0.201, 0.201, 0.2, 0.2, 0.2, 0.2, 0.2, 0.201, 0.203, 0.204, 0.205, 0.206, 0.208, 0.209, 0.21, 0.211, 0.213, 0.214, 0.215, 0.216, 0.218, 0.219, 0.22]);
  const xb = (z) => xo(z) - 0.006 - 0.07 * Math.max(0, Math.min(1, (z - 0.05) / 0.5));       // (the undercut under the pod's front)
  // the cockpit's opening: half its width along the car (closed ahead of it and behind the headrest)
  const OWc = curveAny([[0.9, 0], [0.74, 0], [0.7, 0.14], [0.5, 0.165], [-0.05, 0.165], [-0.2, 0.06], [-0.3, 0], [-0.5, 0]]);     // (narrower, as measured)
  const OW = (z) => (z > 0.735 || z < -0.24 ? 0 : Math.max(0, OWc(z)));
  const RIM = 0.64;                                                     // (the high walls: the rim round his shoulders)
  // the nose and the front of the tub: half-width, underside, top
  const ZA = [2.545, 2.493, 2.441, 2.389, 2.337, 2.285, 2.233, 2.182, 2.13, 2.078, 2.026, 1.974, 1.922, 1.87, 1.818, 1.766, 1.714, 1.662, 1.61, 1.558, 1.507, 1.455, 1.403, 1.351, 1.299, 1.247, 1.195, 1.143, 1.091, 1.039, 0.987, 0.935, 0.883, 0.832, 0.78, 0.728, 0.676, 0.624, 0.572, 0.52];
  const KA = (v) => curveAny(ZA.map((z, i) => [z, v[i]]));
  const hwA = KA([0.037, 0.052, 0.061, 0.066, 0.069, 0.073, 0.077, 0.082, 0.088, 0.096, 0.105, 0.115, 0.125, 0.135, 0.145, 0.152, 0.158, 0.162, 0.166, 0.169, 0.172, 0.176, 0.179, 0.183, 0.186, 0.19, 0.194, 0.198, 0.204, 0.21, 0.215, 0.221, 0.227, 0.233, 0.24, 0.246, 0.252, 0.258, 0.264, 0.27]);
  const ybA = KA([0.283, 0.275, 0.271, 0.27, 0.271, 0.273, 0.277, 0.283, 0.289, 0.295, 0.301, 0.306, 0.31, 0.313, 0.314, 0.313, 0.314, 0.313, 0.314, 0.31, 0.309, 0.306, 0.305, 0.299, 0.29, 0.28, 0.271, 0.266, 0.261, 0.257, 0.24, 0.203, 0.159, 0.126, 0.114, 0.11, 0.11, 0.11, 0.11, 0.11]);
  const ytA = KA([0.313, 0.342, 0.37, 0.395, 0.42, 0.442, 0.463, 0.484, 0.503, 0.522, 0.539, 0.555, 0.57, 0.583, 0.594, 0.604, 0.612, 0.618, 0.625, 0.63, 0.634, 0.637, 0.639, 0.641, 0.642, 0.643, 0.644, 0.644, 0.644, 0.644, 0.644, 0.644, 0.644, 0.639, 0.633, 0.626, 0.621, 0.618, 0.616, 0.615]);
  const secA = (z) => {
    const hw = hwA(z), yb = ybA(z), yt = ytA(z), h = yt - yb, o = OW(z);
    return [[o, yt], [Math.max(o + 0.02, hw * 0.6), yt - 0.006], [hw * 0.88, yt - h * 0.1], [hw * 0.98, yt - h * 0.3], [hw, yb + h * 0.5],
      [hw * 0.97, yb + h * 0.22], [hw * 0.8, yb + 0.004], [0, yb]];
  };
  const secB = (z) => {
    const o = OW(z), k = Math.min(1, o / 0.2), yt = yTop(z) + (RIM - yTop(z)) * k, cw = Math.max(o + 0.03, CW(z));
    const sh = [xo(z) - 0.035, ycr(z) + Math.min(0.13, (yc(z) - ycr(z)) * 0.65)];
    const fil = [Math.min(xc(z) - 0.04, cw + 0.08), Math.max(yc(z) + 0.025, yt - 0.2)];
    return [[o, yt], [cw, yt - 0.035], fil, [xc(z), yc(z)], sh, [xo(z), ycr(z)], [xb(z), 0.115], [0, 0.11]];
  };
  // (round a section: through its eight points, smoothly, S steps between each)
  const S = 5, NP = 7 * S;
  const sample = (P) => {
    const out = [], at = (i) => P[Math.max(0, Math.min(P.length - 1, i))];
    for (let k = 0; k <= NP; k++) {
      const seg = Math.min(6, Math.floor(k / S)), t = k / S - seg, a = at(seg - 1), b = at(seg), c = at(seg + 1), d = at(seg + 2);
      out.push([cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)]);
    }
    return out;
  };
  const upper = (z) => sample(z > 0.51 ? secA(z) : secB(z)).map((p) => [p[0], p[1], z]);
  // (the height of the skin's top at x across, at z along: so parts sit right on it)
  const surfY = (z, x) => {
    // (along the top of the section, middle outward, to where it passes over x)
    const u = upper(z);
    for (let i = 0; i < u.length - 1; i++) {
      const a = u[i], b = u[i + 1];
      if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    }
    return u[0][1];
  };
  // (a flat plate cut to an outline drawn from the side: [z, y] points; at x across)
  const plate = (pts, x, t = 0.012) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]);
    return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -t / 2).rotateY(-Math.PI / 2).translate(x, 0, 0); };
  // the paint of each strip: 0 yellow, 1 light blue, 2 navy, 3 carbon, 4 dark
  const PAINT = [MAT.yellow, MAT.blue, MAT.navy, MAT.carbon, MAT.dark];
  // (the nose: yellow down its sides, a blue band along the top carrying the main sponsor, navy underneath;
  // the body: blue over the top, a yellow band along each shoulder of the cover (the tub's whole side
  // ahead of the pods), the pods and airbox blue, the bottom edge navy)
  const paintA = (seg, z) => (seg === 6 ? 3 : seg === 5 ? 2 : seg === 0 && z < 2.38 ? 1 : 0);
  const paintB = (seg, z, x, y) => (seg === 0 ? 1 : seg === 1 ? 0 : seg === 2 ? (z > 0.12 ? 0 : 1) : seg === 6 ? 3 : seg === 5 ? (y < 0.17 ? 2 : 1) : 1);
  const skin = (rows, paint) => {
    const pos = [], lists = PAINT.map(() => []);
    for (const r of rows) for (const p of r.pts) pos.push(p[0], p[1], r.z);
    const W = NP + 1;
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < NP; k++) {
      const p0 = i * W + k, p1 = p0 + W, seg = Math.min(6, Math.floor(k / S));
      const m = paint(seg, (rows[i].z + rows[i + 1].z) / 2, rows[i].pts[k][0], (rows[i].pts[k][1] + rows[i].pts[k + 1][1]) / 2); if (m < 0) continue;       // (-1: left open)
      lists[m].push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1);
    }
    const g = new THREE.BufferGeometry(), idx = [];
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    lists.forEach((l, m) => { if (l.length) { g.addGroup?.(idx.length, l.length, m); for (const v of l) idx.push(v); } });
    g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const rowsA = [], rowsB = [];
  for (let i = 0; i <= 44; i++) { const z = 2.545 + (0.52 - 2.545) * i / 44; rowsA.push({ z, pts: sample(secA(z)) }); }
  for (let i = 0; i <= 80; i++) { const z = 0.5 + (-1.6 - 0.5) * i / 80; rowsB.push({ z, pts: sample(secB(z)) }); }
  for (const s of [1, -1]) {
    for (const [rows, paint] of [[rowsA, paintA], [rowsB, paintB], [[rowsA[rowsA.length - 1], rowsB[0]], (seg, z, x) => (x > 0.36 ? -1 : 4)]]) {     // (the pod's mouth itself left open: see the intakes)
      const m = new THREE.Mesh(mirrorX(skin(rows, paint), s), PAINT); m.castShadow = true; m.receiveShadow = true; car.add(m); addPanel(m);
    }
    // THE INTAKES: each pod's mouth is open, a dark duct running back into
    // it and narrowing a little, the radiator's fins at the back of it
    { const r = rowsB[0].pts, z0 = rowsB[0].z, z1 = 0.36;
      const loop = r.filter((p) => p[0] > 0.36).map((p) => [p[0], p[1]]);
      loop.push([0.362, Math.max(0.12, loop[loop.length - 1][1])], [0.362, loop[0][1]]);       // (closed along the tub's side)
      const cx = loop.reduce((a, p) => a + p[0], 0) / loop.length, cy = loop.reduce((a, p) => a + p[1], 0) / loop.length;
      const inset = (p, k) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k];
      const duct = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.85, side: THREE.DoubleSide });
      const rows = [loop.map((p) => [p[0], p[1], z0]), loop.map((p) => { const q = inset(p, 0.82); return [q[0], q[1], z1]; })];
      rows.forEach((row) => row.push(row[0]));
      const dm = new THREE.Mesh(mirrorX(grid(rows, loop.length), s), duct); car.add(dm);
      // the radiator: a dark face across the back of the duct, its fins in fine lines
      const sh = new THREE.Shape(); loop.forEach((p, i) => { const q = inset(p, 0.82); if (i) sh.lineTo(q[0], q[1]); else sh.moveTo(q[0], q[1]); });
      const rc = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      let rmat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide });
      if (rc) { rc.width = 64; rc.height = 64; const g = rc.getContext('2d'); g.fillStyle = '#22242a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#9aa0a8'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1.5);
        const t = new THREE.CanvasTexture(rc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); rmat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }); }
      const rg = new THREE.ShapeGeometry(sh).translate(0, 0, z1); add(mirrorX(rg, s), rmat, false); }
    // the back end closed off, dark, round the gearbox
    { const r = rowsB[rowsB.length - 1], sh = new THREE.Shape(); sh.moveTo(0, r.pts[0][1]); for (const p of r.pts) sh.lineTo(p[0], p[1]);
      add(mirrorX(new THREE.ShapeGeometry(sh).translate(0, 0, r.z), s), MAT.dark, false); }
  }
  add(loft([{ z: 2.55, w: 0.074, h: 0.03, y: 0.283 }, { z: 2.5, w: 0.1, h: 0.065, y: 0.276 }], SMOOTH, 40, 6, true), MAT.yellow);     // (the tip, closed)
  // INSIDE THE COCKPIT: lined in black carbon all round, so from his seat
  // you see the inside of the tub, not through it: the walls dropping
  // straight down from the rim, the floor, the front bulkhead closing it
  // off under the cowl ahead of the wheel, the bulkhead behind his back
  { const liner = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide });
    for (const sx of [1, -1]) {
      const rows = [];
      for (let i = 0; i <= 40; i++) {
        const z = 0.75 - i / 40 * 1.0, o = Math.max(0.004, OW(z)), hw = Math.min(0.28, o + 0.1);
        rows.push([[o, RIM - 0.004], [o + 0.012, RIM - 0.05], [hw, 0.5], [hw, 0.2], [hw * 0.7, 0.13], [0, 0.12]].map((q) => [sx * q[0], q[1], z]));
      }
      const m = new THREE.Mesh(grid(rows, 5), liner); m.receiveShadow = true; car.add(m);
    }
    // the dash: a padded cowl under the rim's front, with the wheel's column through it
    add(box(0.42, 0.06, 0.06, 0, 0.58, 0.69, 0.3), MAT.seat, false);
    add(rod([0, 0.5, 0.72], [0, 0.565, 0.5], 0.02), MAT.carbon);
  }
  for (const sx of [1, -1]) add(box(0.06, 0.13, 0.4, sx * 0.17, 0.66, -0.06), MAT.seat, false);
  add(box(0.36, 0.14, 0.08, 0, 0.66, -0.2), MAT.seat, false);
  add(box(0.32, 0.05, 0.34, 0, 0.13, 0.08), MAT.seat, false);
  add(box(0.34, 0.4, 0.05, 0, 0.33, -0.12, -0.38), MAT.seat, false);
  const driver = new THREE.Group();
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.04), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([sx * 0.17, 0.51, -0.02], [sx * 0.15, 0.44, 0.22], 0.04), MAT.suit); dAdd(rod([sx * 0.15, 0.44, 0.22], [sx * 0.12, 0.55, 0.42], 0.035), MAT.suit); }
  // the wheel: a carbon wheel cut flat top and bottom, rubber grips each
  // side, a little display in the middle with its rows of buttons, the
  // shift paddles behind
  { const W = (geo, mat) => dAdd(geo.rotateX(-0.45).translate(0, 0.57, 0.46), mat);
    W(new THREE.BoxGeometry(0.2, 0.1, 0.025), MAT.carbon);
    for (const sx of [1, -1]) { W(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8).translate(sx * 0.125, -0.005, 0), MAT.seat); W(new THREE.BoxGeometry(0.05, 0.006, 0.035).translate(sx * 0.1, 0.01, -0.03), MAT.steel); }
    W(new THREE.PlaneGeometry(0.07, 0.035).translate(0, 0.018, 0.0135), new THREE.MeshStandardMaterial({ color: 0x0a1a10, emissive: 0x30ff70, emissiveIntensity: 0.35 }));
    const btn = new THREE.MeshStandardMaterial({ color: 0xd03020, roughness: 0.5 });
    for (const [bx, by] of [[-0.06, -0.025], [0.06, -0.025], [-0.06, 0.025], [0.06, 0.025], [-0.025, -0.032], [0.025, -0.032]]) W(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 10).rotateX(Math.PI / 2).translate(bx, by, 0.014), btn); }
  // HIS HELMET: painted in his own colours (helmetMaterial), the shell a little longer
  // than it's wide, a chin guard jutting forward under the visor, a small lip on the back
  const hMat = helmetMaterial('f05') || MAT.helmet;
  MAT.visor.color.set(0x2c2412); MAT.visor.metalness = 0.95; MAT.visor.roughness = 0.08;      // (the visor: dark, tinted gold)
  const helmet = add(new THREE.SphereGeometry(0.135, 28, 20).scale(1, 1.05, 1.12).translate(0, 0.73, -0.02), hMat);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.12).translate(0, 0.73, -0.02), MAT.visor);
  const chinMat = new THREE.MeshPhysicalMaterial({ color: 0x43aaea, roughness: 0.2, clearcoat: 1 });
  const stripe = add(new THREE.SphereGeometry(0.1, 18, 10).scale(1.08, 0.62, 0.95).translate(0, 0.655, 0.045), chinMat);     // (the chin guard)
  { const lip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.012, 0.035).rotateX(-0.35).translate(0, 0.83, -0.165), MAT.navy); stripe.add(lip); }   // (the lip on the back)

  for (const s of [1, -1]) {
    // THE GILLS: a row of louvres down the upper rear of each pod, over its crown and
    // down its shoulder. Each one a blue lip pressed out of the bodywork: flush at its
    // front edge, lifted clear at its back, so it's a slit that opens up toward the
    // rear; dark inside, so you see into the slot
    { const lipMat = MAT.blue.clone(); lipMat.side = THREE.DoubleSide;
      const lift = (p, a, b, h) => { const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [p[0] - ty / l * h, p[1] + tx / l * h]; };
      for (let k = 0; k < 7; k++) {
        const z0 = -0.42 - k * 0.075, z1 = z0 - 0.05, h = 0.028 + 0.004 * k / 6;      // (front edge, back edge, how far the back stands open)
        const uf = upper(z0), ub = upper(z1), P = [], Q = [], R = [], P2 = [];
        for (let i = 3 * S; i <= 4 * S + 2; i++) {
          const nb = (u) => [u[Math.max(0, i - 1)], u[Math.min(u.length - 1, i + 1)]];
          const [a0, b0] = nb(uf), [a1, b1] = nb(ub);
          const f = lift(uf[i], a0, b0, 0.003), q = lift(ub[i], a1, b1, 0.003), r = lift(ub[i], a1, b1, h), f2 = lift(uf[i], a0, b0, 0.002);
          P.push([f[0], f[1], z0]); Q.push([q[0], q[1], z1]); R.push([r[0], r[1], z1]); P2.push([f2[0], f2[1], z0]);
        }
        const n = P.length - 1;
        add(mirrorX(grid([P, R], n), s), lipMat, false);                                 // (the lip)
        add(mirrorX(grid([Q, R], n), s), MAT.dark, false);                               // (the slot's open back)
        add(mirrorX(grid([P2, Q.map((q) => [q[0], q[1] - 0.001, q[2]])], n), s), MAT.dark, false);     // (the inside, under the lip)
        for (const e of [0, n]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...P[e], ...Q[e], ...R[e]], 3)); g.computeVertexNormals(); add(mirrorX(g, s), MAT.dark, false); }   // (its ends closed)
      } }
    // the exhaust out through the top, toward the back
    { const z = -1.12, x = (xc(z) + CW(z)) / 2, y = surfY(z, x) - 0.03;
      add(mirrorX(new THREE.CylinderGeometry(0.05, 0.058, 0.08, 14, 1, true).rotateX(-0.6).translate(x, y + 0.02, z), s), MAT.exhaust);
      add(mirrorX(new THREE.CircleGeometry(0.048, 14).rotateX(-Math.PI / 2 - 0.6).translate(x, y + 0.05, z - 0.02), s), MAT.dark, false); }
    // the flip-up: where the crease runs out, ahead of the back wheel
    { const z = -1.15, y = ycr(z);
      add(mirrorX(box(0.26, 0.012, 0.15, xo(z) + 0.11, y + 0.01, z, -0.25), s), MAT.blue);
      add(mirrorX(box(0.012, 0.17, 0.22, xo(z) + 0.24, y + 0.03, z - 0.02), s), MAT.blue);
      add(mirrorX(box(0.012, 0.09, 0.4, xo(z) + 0.004, y - 0.035, z + 0.18), s), MAT.blue); }
    // the winglet on the pod's top
    // (its pillar standing on the bodywork, a little into it; the wing across its top)
    { const z = -0.72, x = xc(-0.72) - 0.03, y = surfY(z, x);       // (right above the gills)
      add(mirrorX(plate([[z + 0.07, y - 0.02], [z + 0.05, y + 0.12], [z - 0.07, y + 0.13], [z - 0.08, y - 0.02]], x, 0.012), s), MAT.blue);
      add(mirrorX(box(0.16, 0.012, 0.11, x + 0.05, y + 0.13, z, -0.3, 0, -0.25), s), MAT.blue); }
    // bargeboards: tall curved carbon panels behind the front wheels, on the floor
    // (the big one: tall at the front, its top sweeping down and back to the pod's mouth, a slot cut in it)
    add(mirrorX(plate([[1.22, 0.11], [1.24, 0.3], [1.16, 0.4], [1.0, 0.43], [0.84, 0.36], [0.74, 0.22], [0.72, 0.11]], 0.46), s), MAT.carbon);
    add(mirrorX(box(0.016, 0.012, 0.22, 0.462, 0.27, 0.98, 0.35), s), MAT.dark, false);
    // (the smaller one ahead of it, under the nose)
    add(mirrorX(plate([[1.42, 0.11], [1.44, 0.22], [1.36, 0.28], [1.26, 0.24], [1.24, 0.11]], 0.3), s), MAT.carbon);
    // turning vanes, from the nose's underside down toward the floor
    add(mirrorX(box(0.008, 0.16, 0.34, 0.15, 0.25, 1.75, 0, 0.08, 0), s), MAT.carbon);
    // mirrors: on stalks off the cockpit's walls, out over the pods, a winglet on each stalk
  }
  const mirrors = {};
  for (const s of [1, -1]) {
    const sy = surfY(0.5, 0.37) - 0.01, stalk = add(rod([s * 0.37, sy, 0.5], [s * 0.5, 0.645, 0.5], 0.011), MAT.carbon);   // (out of the bodywork, up into the mirror)
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: 0.53, w: 0.14, h: 0.065, y: 0.672, x: s * 0.53 }, { z: 0.47, w: 0.15, h: 0.075, y: 0.668, x: s * 0.53 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.12, 0.058).rotateY(Math.PI).translate(s * 0.53, 0.705, 0.465), MAT.visor));
    add(box(0.1, 0.008, 0.06, s * 0.44, (sy + 0.645) / 2 + 0.01, 0.49, 0, 0, -s * Math.atan2(0.645 - sy, 0.13)), MAT.carbon);
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.53, 0.705, 0.5] };
  }
  // --- THE AIRBOX: rising out of the cover right over his head, its
  // mouth over his helmet, the roll hoop on top with the camera
  const airbox = [
    { z: -0.32, w: 0.24, h: 0.24, y: 0.72 },
    { z: -0.5, w: 0.3, h: 0.32, y: 0.7 },
    { z: -0.75, w: 0.34, h: 0.24, y: 0.7 },
    { z: -1.05, w: 0.3, h: 0.08, y: 0.6 },
  ];
  add(loft(airbox, 1.0, 40, 8, true), MAT.blue);
  // its base: solid down to the bodywork under the intake (no gap), and carried 30 cm
  // further forward than the intake itself, sloping down to finish just behind his helmet
  add(loft([
    { z: -0.5, w: 0.3, h: 0.24, y: 0.6 },
    { z: -0.36, w: 0.3, h: 0.22, y: 0.6 },
    { z: -0.24, w: 0.28, h: 0.17, y: 0.6 },
    { z: -0.14, w: 0.25, h: 0.09, y: 0.6 },
    { z: -0.06, w: 0.22, h: 0.03, y: 0.6 },
  ], 0.6, 32, 8, true), MAT.blue);
  add(loft([{ z: -0.3, w: 0.17, h: 0.13, y: 0.79 }, { z: -0.36, w: 0.17, h: 0.13, y: 0.79 }], 1.2, 20, 1, false), MAT.dark, false);
  add(box(0.1, 0.06, 0.16, 0, 1.05, -0.5), MAT.camera).name = 'tcamPod';      // (the camera pod: hidden in the T-cam's own view, as it's the camera)
  // THE SPINE: out of the back of the airbox and down the middle of the
  // engine cover to the gearbox, narrow and rounded, at the heights the
  // reference car's measured at (its top from 0.9 m behind the airbox down to 0.4 at the back)
  { const top = curveAny([[-0.6, 0.86], [-0.75, 0.78], [-0.98, 0.68], [-1.2, 0.58], [-1.4, 0.44], [-1.58, 0.39]]);
    const secs = [];
    for (let i = 0; i <= 10; i++) { const z = -0.6 - i / 10 * 0.98, b = yTop(z) - 0.03; secs.push({ z, w: 0.17 - 0.09 * i / 10, h: Math.max(0.02, top(z) - b), y: b }); }
    add(loft(secs, 1.1, 24, 10, true), MAT.blue); }
  // the yellow carried on from the tub: a line down each side of the
  // airbox and along the engine cover's edge to the back, laid on the skin
  { const stripe = MAT.yellow.clone(); stripe.side = THREE.DoubleSide;
    for (const sx of [1, -1]) {
      const rows = [];
      for (let i = 0; i <= 40; i++) {
        const k = i / 40, z = -0.08 - k * 1.52, x = 0.215 - 0.125 * k * k * (3 - 2 * k) - 0.02 * Math.max(0, 1 - i / 6), w = 0.03 - 0.014 * k, row = [];
        for (const t of [-1, 0, 1]) { const xx = x + t * w / 2; row.push([sx * xx, surfY(z, xx) + 0.008, z]); }
        rows.push(row);
      }
      const m = new THREE.Mesh(grid(rows, 2), stripe); m.receiveShadow = true; m.renderOrder = 2; car.add(m); addPanel(m);
    } }
  // the horns: a slanted winglet each side, rooted on the cover right
  // beside the airbox's mouth and rising diagonally up and out over the pod
  for (const sx of [1, -1]) {
    const z = -0.37, rx = 0.24, ry = surfY(z, rx) - 0.01, A = 0.6, L = 0.17;   // (low on the side, beside the airbox)
    add(mirrorX(box(L, 0.014, 0.15, rx + Math.cos(A) * L / 2, ry + Math.sin(A) * L / 2, z, 0, 0, A), sx), MAT.blue);
    add(mirrorX(box(0.008, 0.07, 0.12, rx + Math.cos(A) * L, ry + Math.sin(A) * L + 0.02, z), sx), MAT.blue);     // (a little plate on its tip)
  }
  // THE SPONSORS: made-up names and badges, painted on the car's own
  // surfaces (laid on the skin, following its curves): big on the pods'
  // navy flanks, on the nose's sides, the wings' endplates
  if (typeof document !== 'undefined') {
    const decal = (text, ink, badge, w = 1024, h = 256) => sponsorDecal(text, ink, w, h);
    // (a decal to be drawn later at the shape of the patch it goes on: aspect = its length / its height)
    const fit = (text, ink, opts) => (aspect) => sponsorDecal(text, ink, Math.round(256 * Math.min(8, Math.max(1, aspect))), 256, opts);
    // (a decal over part of the skin: rows along z0..z1, across the section's points k0..k1, lifted just off it)
    const onSkin = (secOf, z0, z1, k0, k1, mat, sx) => {
      const pos = [], uv = [], idx = [], NZ = 16, NK = k1 - k0;
      if (typeof mat === 'function') {       // (drawn to the patch's own length and height, so nothing on it is stretched)
        const u = sample(secOf((z0 + z1) / 2)); let arc = 0;
        for (let k = k0; k < k1; k++) arc += Math.hypot(u[k + 1][0] - u[k][0], u[k + 1][1] - u[k][1]);
        mat = mat(Math.abs(z1 - z0) / Math.max(0.01, arc));
      }
      for (let i = 0; i <= NZ; i++) {
        const z = z0 + (z1 - z0) * i / NZ, u = sample(secOf(z));
        for (let k = k0; k <= k1; k++) {
          const a = u[Math.max(0, k - 1)], b = u[Math.min(u.length - 1, k + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
          pos.push(sx * (u[k][0] - ty / l * 0.006), u[k][1] + tx / l * 0.006, z);
          uv.push(sx > 0 ? i / NZ : 1 - i / NZ, 1 - (k - k0) / NK);
        }
      }
      for (let i = 0; i < NZ; i++) for (let k = 0; k < NK; k++) { const p0 = i * (NK + 1) + k, p1 = p0 + NK + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat); m.renderOrder = 2; car.add(m); addPanel(m); return m;
    };
    const flank = fit('PURE SPIRIT', '#ffffff'), nose = fit('ELX', '#07102e'), plate = decal('PURE SPIRIT', '#ffffff', 'ring', 512, 256);
    for (const sx of [1, -1]) {
      onSkin(secB, 0.3, -0.4, 4 * S, 6 * S - 2, flank, sx);            // (the main sponsor, big, down the pod's blue side)
      onSkin(secA, 1.5, 0.95, 2 * S, 4 * S, nose, sx);                     // (the nose's yellow side: the fuel)
      // the wings' endplates, flat on their outsides
      const rp = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2).rotateY(sx * Math.PI / 2).translate(sx * 0.479, 0.74, -1.77), plate); rp.renderOrder = 2; wingDecals.push([rp, 'rear']);
      const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1).rotateY(sx * Math.PI / 2).translate(sx * 0.479, 0.5, -1.86), decal('VALCOR', '#ffffff', '', 768, 256)); tp.renderOrder = 2; wingDecals.push([tp, 'rear']);
      const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15).rotateY(sx * Math.PI / 2).translate(sx * 0.724, 0.22, 2.31), decal('TELESPEED', '#c6f23a', 'diamond', 512, 256)); fp.renderOrder = 2; wingDecals.push([fp, sx > 0 ? 'fl' : 'fr']);
    }
    // and the rest of them: the title sponsor along the engine cover and
    // across the rear wing, the others on the pods' tops, the nose, the
    // cockpit's sides, the airbox, the front wing
    const navyInk = '#07102e', title = fit('TTF', '#ffffff'), pods = fit('FLORO', '#ffffff');
    const noseTop = fit('KORVANE', navyInk), pit = fit('TEMPRA', navyInk), box2 = decal('PURE SPIRIT', '#ffffff', 'ring', 512, 160);
    for (const sx of [1, -1]) {
      onSkin(secB, -1.0, -1.58, 2 * S, 3 * S + 2, title, sx);           // (the cover's flank, behind the gills)
      onSkin(secB, 0.48, -0.2, 2 * S, 3 * S, pods, sx);                   // (the pod's top, ahead of the gills)
      onSkin(secA, 2.0, 1.45, S + 1, 2 * S, noseTop, sx);                 // (the nose's shoulders, on the yellow)
      onSkin(secB, 0.49, 0.18, S, 2 * S - 1, pit, sx);                    // (the cockpit's side)
      // the airbox's sides
      const ab = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.08).rotateY(sx * Math.PI / 2).translate(sx * 0.163, 0.9, -0.58), box2); ab.renderOrder = 2; car.add(ab);
      // the front wing's main plane, on top
      const fw = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.09).rotateX(-Math.PI / 2).rotateY(Math.PI).rotateX(0.06).translate(sx * 0.45, 0.138, 2.45), decal('PURE SPIRIT', '#ffffff', 'diamond', 512, 128));
      fw.renderOrder = 2; wingDecals.push([fw, sx > 0 ? 'fl' : 'fr']);
    }
    // (a patch laid on the top of the nose, z0 to z1 along it, half-width w(z) across, lifted just off it)
    const onNose = (z0, z1, w, tex, NZ = 24, NX = 8) => {
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= NZ; i++) { const z = z0 + (z1 - z0) * i / NZ, ww = w(z);
        for (let k = 0; k <= NX; k++) { const x = -ww + 2 * ww * k / NX; pos.push(x, surfY(z, Math.abs(x)) + 0.005, z); uv.push(i / NZ, 1 - k / NX); } }
      for (let i = 0; i < NZ; i++) for (let k = 0; k < NX; k++) { const p0 = i * (NX + 1) + k, p1 = p0 + NX + 1; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, tex); m.renderOrder = 2; car.add(m); addPanel(m); return m;
    };
    // the main sponsor's name along the nose's blue top band, reading from the front back
    // (its picture drawn at the band's own length to width, so the letters keep their shape)
    { const z0 = 2.0, z1 = 1.12, hw = 0.05;
      onNose(z0, z1, () => hw, sponsorDecal('PURE SPIRIT', '#ffffff', Math.round(256 * (z0 - z1) / (2 * hw)), 256, { logo: false })); }
    // and its badge, a true circle, on the top of the nose right in front of the driver
    { const r = 0.07, zc = 0.86; onNose(zc + r, zc - r, () => r, sponsorBadge('PURE SPIRIT'), 12, 12); }
    // the phone company across the rear wing's top flap, lime on navy, read from the front (as in the Garage)
    { const n = new THREE.Vector3(0, Math.cos(0.5), Math.sin(0.5)).multiplyScalar(0.011);
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.15).rotateZ(Math.PI).rotateX(-Math.PI / 2).rotateY(Math.PI).rotateX(0.5).translate(n.x, 0.82 + n.y, -1.85 + n.z), decal('TELESPEED', '#c6f23a', 'diamond', 1365, 256));
      rw.renderOrder = 2; wingDecals.push([rw, 'rear']); }
  }
  // the gearbox at the back, its rain light, the floor, the plank, the diffuser and its fences
  add(box(0.2, 0.18, 0.36, 0, 0.22, -1.9), MAT.carbon);
  add(box(0.07, 0.04, 0.03, 0, 0.27, -2.1), MAT.rain);
  // the floor: under the whole car, its edge following the pods' outline (stepped out a little), from behind the front wheels
  { const sh = new THREE.Shape(), pts = [];
    // (a flat rectangle from behind the front wheels to ahead of the back ones, stepping in round them to the gearbox)
    pts.push([0.3, 1.3], [0.7, 1.22], [0.7, -0.95], [0.46, -1.1], [0.42, -1.75], [0.3, -1.75]);
    sh.moveTo(0, 1.3); for (const q of pts) sh.lineTo(q[0], q[1]); for (const q of pts.slice().reverse()) sh.lineTo(-q[0], q[1]); sh.lineTo(0, 1.3);
    add(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.12, 0), MAT.carbon); }
  add(box(0.3, 0.012, 2.6, 0, 0.094, -0.15), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));   // (the plank, fixed right under the floor)
  add(box(0.86, 0.02, 0.6, 0, 0.12, -1.85, -0.3), MAT.carbon);
  for (const x of [-0.32, -0.12, 0.12, 0.32]) add(box(0.01, 0.14, 0.55, x, 0.11, -1.85), MAT.carbon);
  add(box(0.3, 0.012, 0.1, 0, 0.36, -2.1, 0.3), MAT.carbon);                  // the "monkey seat" over the diffuser

  // --- THE FRONT WING: wide light-blue planes slung under the nose on
  // two pylons, a navy spoon in the middle, big navy endplates
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  for (const [m, w] of wingDecals) wings[w].add(m);       // (the endplates' sponsors go with their wings)
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  // (moved to where the reference's are: 15 cm back with the shorter nose, and 3 cm higher)
  for (const s of [1, -1]) add(box(0.015, 0.22, 0.16, s * 0.07, 0.23, 2.39, 0.2), MAT.navy);
  add(loft([{ z: 2.57, w: 0.3, h: 0.025, y: 0.16 }, { z: 2.27, w: 0.3, h: 0.025, y: 0.185 }], 0.3, 12, 2, false), MAT.navy);
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.56, 0.022, 0.36, s * 0.43, 0.125, 2.4, 0.06, -s * 0.03), MAT.blue);
    addTo(g, box(0.5, 0.015, 0.18, s * 0.45, 0.19, 2.22, 0.42, -s * 0.05), MAT.blue);
    addTo(g, box(0.36, 0.012, 0.11, s * 0.5, 0.23, 2.12, 0.7, -s * 0.05), MAT.navy);
    addTo(g, plate([[2.61, 0.07], [2.63, 0.19], [2.57, 0.3], [2.45, 0.34], [2.23, 0.33], [2.09, 0.27], [2.05, 0.13], [2.09, 0.07]], s * 0.715, 0.014), MAT.navy);   // the big navy endplate
    addTo(g, box(0.06, 0.012, 0.4, s * 0.695, 0.08, 2.33), MAT.carbon);
  }
  // --- THE REAR WING: set well forward, navy endplates, dark planes,
  // a white lip on the top flap; the beam wing below; louvres in the plates
  // (the rear endplates: tall, square at the top, their front cut away low down over the tyre)
  for (const s of [1, -1]) addTo(wings.rear, plate([[-1.6, 0.56], [-1.55, 0.66], [-1.55, 0.86], [-1.6, 0.885], [-1.97, 0.885], [-1.99, 0.86], [-2.0, 0.13], [-1.82, 0.13], [-1.78, 0.3], [-1.7, 0.5]], s * 0.47, 0.014), MAT.navy);
  addTo(wings.rear, box(0.92, 0.024, 0.24, 0, 0.74, -1.66, 0.18), MAT.carbon);
  addTo(wings.rear, box(0.92, 0.018, 0.18, 0, 0.82, -1.85, 0.5), MAT.navy);
  addTo(wings.rear, box(0.92, 0.006, 0.02, 0, 0.845, -1.95, 0), MAT.white);
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) addTo(wings.rear, box(0.018, 0.012, 0.15, s * 0.47, 0.5 + k * 0.06, -1.82, 0.4), MAT.dark);
  add(box(0.72, 0.02, 0.16, 0, 0.44, -1.92, 0.2), MAT.carbon);
  addTo(wings.rear, box(0.035, 0.45, 0.06, 0, 0.525, -1.8), MAT.carbon);
  // THE ENGINE: a 3-litre V10, its two banks of five at 72 degrees, laid
  // in the bay behind his back under the cover. Modelled whole, but kept
  // out of sight for now (engine.visible): for later, when the cover comes
  // off or the engine gets thrown out of the car
  const engine = new THREE.Group();
  { const E = {
      alloy: new THREE.MeshStandardMaterial({ color: 0xa4a8ae, roughness: 0.5, metalness: 0.45 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe4e7ea, roughness: 0.12, metalness: 1, side: THREE.DoubleSide }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.5, metalness: 0.6 }),
      cam: new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.35, metalness: 0.4 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xf6c51a, roughness: 0.35 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0xb8a58a, roughness: 0.35, metalness: 0.9 }),
      carbon: MAT.carbon,
    };
    const e = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = false; engine.add(o); return o; };
    const Z0 = -0.3, Z1 = -0.92, L = Z0 - Z1, zc = (Z0 + Z1) / 2, cy = 0.2;     // (front and back of the block, the crank's height)
    const V = 36 * Math.PI / 180;                                                 // (each bank 36 degrees off upright)
    // the crankcase and sump, low in the car
    e(new THREE.BoxGeometry(0.26, 0.16, L).translate(0, cy - 0.02, zc), E.alloy);
    e(new THREE.BoxGeometry(0.2, 0.06, L * 0.9).translate(0, cy - 0.12, zc), E.dark);
    for (const sx of [1, -1]) {
      const a = sx * V, ux = Math.sin(a), uy = Math.cos(a);                       // (up along this bank)
      const at = (d) => [ux * d, cy + uy * d];
      // the bank: its block, then the head, then the cam cover on top with its yellow lettering strip
      let [x, y] = at(0.13); e(new THREE.BoxGeometry(0.13, 0.17, L).rotateZ(-a).translate(x, y, zc), E.alloy);
      [x, y] = at(0.25); e(new THREE.BoxGeometry(0.15, 0.08, L * 0.98).rotateZ(-a).translate(x, y, zc), E.dark);
      [x, y] = at(0.3); e(new THREE.BoxGeometry(0.11, 0.04, L * 0.94).rotateZ(-a).translate(x, y, zc), E.cam);
      [x, y] = at(0.322); e(new THREE.BoxGeometry(0.035, 0.006, L * 0.6).rotateZ(-a).translate(x, y, zc), E.yellow);
      for (let c = 0; c < 5; c++) {
        const z = Z0 - 0.06 - c * (L - 0.12) / 4;
        // a coil on each cylinder, through the cam cover
        [x, y] = at(0.33); e(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8).rotateZ(-a).translate(x, y, z), E.dark);
        // the intake trumpet, up into the V from the inner side of the head
        const ix = ux * 0.22 - sx * 0.07, iy = cy + uy * 0.22 + 0.05;
        e(new THREE.CylinderGeometry(0.026, 0.02, 0.14, 14, 1, true).translate(sx * 0.055, iy + 0.07, z), E.chrome);
        e(new THREE.TorusGeometry(0.03, 0.007, 8, 16).rotateX(Math.PI / 2).translate(sx * 0.055, iy + 0.14, z), E.chrome);      // (its flared lip)
        // the exhaust primary: out of the bank's outer side, curling down and back
        const ox = ux * 0.2 + sx * 0.09, oy = cy + uy * 0.2 - 0.02;
        const path = new THREE.CatmullRomCurve3([new THREE.Vector3(ox, oy, z), new THREE.Vector3(ox + sx * 0.06, oy - 0.08, z - 0.05), new THREE.Vector3(sx * 0.2, cy - 0.02, Z1 - 0.05), new THREE.Vector3(sx * 0.16, cy + 0.05, Z1 - 0.3)]);
        e(new THREE.TubeGeometry(path, 16, 0.018, 8, false), E.pipe);
      }
      // the collector, and the tail pipe on toward the exhaust's exit
      e(new THREE.CylinderGeometry(0.035, 0.04, 0.22, 12).rotateX(Math.PI / 2 - 0.2).translate(sx * 0.16, cy + 0.07, Z1 - 0.4), E.pipe);
    }
    // the plenum over the trumpets (the ten of them sit under it), fed by the airbox above
    e(new THREE.BoxGeometry(0.2, 0.08, L * 0.95).translate(0, cy + 0.31, zc), E.carbon);
    e(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 16).translate(0, cy + 0.42, Z0 - 0.08), E.carbon);
    // the front: the timing cover, the oil reservoir between it and his back, the pumps along the bottom
    e(new THREE.BoxGeometry(0.3, 0.26, 0.04).translate(0, cy + 0.06, Z0 + 0.02), E.dark);
    e(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16).translate(0, cy + 0.08, Z0 + 0.1), E.carbon);
    for (const sx of [1, -1]) e(new THREE.CylinderGeometry(0.03, 0.03, L * 0.7, 10).rotateX(Math.PI / 2).translate(sx * 0.11, cy - 0.08, zc), E.dark);
    // the bellhousing onto the gearbox
    e(new THREE.CylinderGeometry(0.12, 0.1, 0.18, 16).rotateX(Math.PI / 2).translate(0, cy, Z1 - 0.09), E.alloy);
  }
  engine.visible = false; engine.name = 'bay';
  car.add(engine);
  // (the bodywork's materials, tagged: the Garage can turn them clear to show what's inside)
  for (const k of ['blue', 'yellow', 'white', 'navy', 'carbon', 'dark', 'camera', 'glass']) if (MAT[k]) MAT[k].userData.shell = true;
  car.traverse((o) => { if (o.isMesh && o.renderOrder === 2 && !Array.isArray(o.material)) o.material.userData.shell = true; });
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver, engine };
}

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
    suit: new THREE.MeshStandardMaterial({ color: DRIVER_SUITS.f94.suit, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };
  const SMOOTH = 0.8;
  // --- ONE SKIN, NOSE TO GEARBOX (sweptSkin): the 1994 car's body is all
  // one smooth, rounded surface, a pebble shaped by the sea. A low, round
  // nose swelling into the tub; low cockpit sides, his shoulders showing
  // over them; long rounded sidepods, their mouths set back behind the
  // front wheels, no crease anywhere, tapering gently into the engine
  // cover and down to the gearbox. Red, with white flashes laid over it
  const PAINT = [MAT.blue, MAT.yellow, MAT.carbon, MAT.dark];
  const sk = sweptSkin(car, addPanel, add, PAINT, {
    nose: { z: [2.62, 2.45, 2.2, 1.9, 1.55, 1.2, 0.95, 0.8, 0.76], hw: [0.065, 0.1, 0.14, 0.17, 0.2, 0.24, 0.28, 0.3, 0.305], yb: [0.2, 0.2, 0.21, 0.22, 0.22, 0.18, 0.13, 0.11, 0.11], yt: [0.3, 0.35, 0.42, 0.49, 0.56, 0.62, 0.66, 0.68, 0.68] },
    body: { z: [0.74, 0.4, 0.0, -0.3, -0.6, -0.95, -1.3, -1.78], yTop: [0.68, 0.6, 0.6, 0.78, 0.8, 0.7, 0.55, 0.38], CW: [0.3, 0.3, 0.29, 0.22, 0.2, 0.18, 0.14, 0.09],
      xc: [0.56, 0.62, 0.62, 0.58, 0.5, 0.4, 0.28, 0.14], yc: [0.49, 0.5, 0.49, 0.46, 0.42, 0.37, 0.32, 0.27], xo: [0.72, 0.78, 0.78, 0.74, 0.65, 0.52, 0.36, 0.2], yo: [0.3, 0.3, 0.3, 0.3, 0.29, 0.28, 0.27, 0.24], yb: 0.11 },
    open: [[0.9, 0], [0.76, 0], [0.72, 0.16], [0.5, 0.21], [-0.05, 0.21], [-0.18, 0.08], [-0.25, 0], [-0.5, 0]], RIM: 0.6,
    paint: (part, seg) => (part === 'join' ? 3 : seg === 6 ? 2 : 0), mouthX: 0.33, duct: 0.32,
  });
  const { surfY, S } = sk;
  // the white flash along each pod's side, sweeping back; a white band over the nose's top
  sk.strip(0.6, -0.75, (z) => (sk.xc(z) + sk.xo(z)) / 2 - 0.01, () => 0.018, MAT.yellow);     // (over the pod's shoulder, above the sponsor)
  sk.strip(2.3, 0.95, () => 0, (z) => 0.05 + 0.1 * (2.3 - z) / 1.35, MAT.yellow);
  // the little wraparound screen at the front of the opening
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12, 1, true, -0.95, 1.9).rotateX(-0.3).translate(0, 0.66, 0.52), MAT.glass, false);
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
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.71, -0.03), MAT.yellow);   // (white, like his suit's trim)
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.32, 0.56, 0.5], [s * 0.46, 0.63, 0.52], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: 0.55, w: 0.13, h: 0.065, y: 0.605, x: s * 0.49 }, { z: 0.49, w: 0.14, h: 0.075, y: 0.6, x: s * 0.49 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.115, 0.06).rotateY(Math.PI).translate(s * 0.49, 0.638, 0.485), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.49, 0.64, 0.52] };
  }
  // --- THE AIRBOX: tall, over his head, its mouth above his helmet,
  // running back into the engine cover
  add(loft([{ z: -0.2, w: 0.3, h: 0.25, y: 0.66 }, { z: -0.36, w: 0.36, h: 0.32, y: 0.66 }, { z: -0.66, w: 0.38, h: 0.23, y: 0.67 }, { z: -1.05, w: 0.3, h: 0.06, y: 0.62 }], 1.0, 40, 8, true), MAT.blue);
  add(loft([{ z: -0.19, w: 0.2, h: 0.13, y: 0.75 }, { z: -0.25, w: 0.2, h: 0.13, y: 0.75 }], 1.2, 20, 1, false), MAT.dark, false);
  // a white line along the airbox's top, back down the cover
  add(loft([{ z: -0.24, w: 0.08, h: 0.02, y: 0.915 }, { z: -0.5, w: 0.08, h: 0.02, y: 0.968 }, { z: -0.8, w: 0.07, h: 0.02, y: 0.875 }, { z: -1.05, w: 0.05, h: 0.02, y: 0.67 }], 0.5, 12, 4, true), MAT.yellow);
  for (const s of [1, -1]) add(box(0.012, 0.3, 0.38, s * 0.47, 0.18, 1.0, 0, s * 0.15), MAT.carbon);           // bargeboards, ahead of the pods
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
  // THE SPONSORS: the tobacco brand (shared with the TTF-88) big on the
  // pods' sides and across the rear wing, the fuel on the nose, the tyres
  // and a few small ones as badges alone
  if (typeof document !== 'undefined') {
    const main = sponsorDecal('VESPERO', '#ffffff'), fuel = sponsorDecal('SOLVARA', '#ffffff', 768, 256);
    for (const sx of [1, -1]) {
      decalOnSkin(car, addPanel, sk, sk.secB, 0.32, -0.62, 4 * S + 1, 5 * S + 2, main, sx);       // (the pod's side, under the white flash)
      decalOnSkin(car, addPanel, sk, sk.secA, 1.72, 1.12, 3 * S - 1, 4 * S + 1, fuel, sx);        // (the nose's side)
      decalOnSkin(car, addPanel, sk, sk.secB, -0.95, -1.25, 2 * S, 3 * S, sponsorBadge('QUANTEX'), sx);   // (small ones on the cover's flank)
      decalOnSkin(car, addPanel, sk, sk.secB, 0.62, 0.42, S, 2 * S - 1, sponsorBadge('NOVIK'), sx);       // (and by the cockpit)
      const ep = flatDecal(0.36, 0.18, sx * 0.512, 0.8, -2.0, sponsorDecal('VESPERO', '#ffffff', 512, 256)); wings.rear.add(ep);
      const tp = flatDecal(0.3, 0.1, sx * 0.512, 0.6, -2.02, sponsorDecal('VALCOR', '#ffffff', 768, 256)); wings.rear.add(tp);
      const fe = flatDecal(0.16, 0.16, sx * 0.785, 0.14, 2.4, sponsorBadge('ORBIXA')); (sx > 0 ? wings.fl : wings.fr).add(fe);
    }
    // across the rear wing's top element, read from the front
    { const rw = flatDecal(0.84, 0.16, 0, 1.012, -2.22, sponsorDecal('VESPERO', '#ffffff', 1344, 256), 'top', 0.7); wings.rear.add(rw); }
  }
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}

// a smooth body from a function of z: f(z) gives { w, top, bot, tuck,
// sq (how square), x } (as the rescue vehicles' bodies are made)
function smoothBody(z0, z1, n, f, ring = 32) {
  const pos = [], idx = [], R = ring + 1;
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * i / n, sct = f(z);
    const hw = sct.w / 2, mid = (sct.top + sct.bot) / 2, hh = Math.max(0.001, (sct.top - sct.bot) / 2), e = 2 / (sct.sq ?? 4), ox = sct.x || 0;
    for (let k = 0; k <= ring; k++) {
      const a = -Math.PI / 2 + k / ring * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const yy = Math.sign(sn) * Math.pow(Math.abs(sn), e), xx = Math.sign(c) * Math.pow(Math.abs(c), e);
      pos.push(ox + xx * hw * (1 - (sct.tuck || 0) * Math.max(0, yy)), mid + yy * hh, z);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < ring; k++) { const a = i * R + k, b = a + R; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  for (const [i, dir] of [[0, -1], [n, 1]]) {
    let cx = 0, cy = 0;
    for (let k = 0; k < ring; k++) { cx += pos[(i * R + k) * 3]; cy += pos[(i * R + k) * 3 + 1]; }
    const base = pos.length / 3;
    pos.push(cx / ring, cy / ring, pos[i * R * 3 + 2]);
    for (let k = 0; k <= ring; k++) { const j = (i * R + k) * 3; pos.push(pos[j], pos[j + 1], pos[j + 2]); }
    for (let k = 0; k < ring; k++) dir > 0 ? idx.push(base, base + 1 + k, base + 2 + k) : idx.push(base, base + 2 + k, base + 1 + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// (the same, for keys given from the front of the car back)
const curveAny = (keys) => curve([...keys].sort((a, b) => a[0] - b[0]));
function curve(keys) {
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

// =====================================================================
// THE TTP-70 AS THE PLAYER'S CAR (and the computer drivers', and the
// Garage's): the body. A tribute to the 1970 short-tail long-distance
// cars: very low, wide and short; a long low nose with the front wheels'
// fenders standing up either side of it and the headlights under clear
// covers in them; a small bubble cockpit with a wraparound screen, the
// driver on the right; the rear fenders swelling up over the back
// wheels; the short tail swept up into two fins, a cooling grille on the
// deck over the flat-12, a mesh panel across the back. In light blue
// with a broad orange stripe down the middle, our own design (no
// sponsor, no badges), a white roundel with a number on each door.
// =====================================================================
export function buildP70Body(car, addPanel) {
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0x8cc4e8, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xf2701e, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.6, metalness: 0.2 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.5 }),
    lens: new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.2, metalness: 0.6, emissive: 0xfff3d0, emissiveIntensity: 0.2 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  // (seen from his seat too: the roof and the glass have an inside)
  MAT.glass.side = THREE.DoubleSide;
  const roofMat = MAT.blue.clone(); roofMat.side = THREE.DoubleSide;
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };
  const FZ = 1.25, RZ = -1.05, WR = 0.33;
  const LAMP_AT = [0, 0.6, 1.95];          // (where the headlights shine from)
  const arch = (z, base) => { let b = base; for (const wz of [FZ, RZ]) { const d = z - wz, r = WR + 0.05; if (Math.abs(d) < r) b = Math.max(b, WR + Math.sqrt(r * r - d * d)); } return b; };
  // --- the main body: a low wedge, wide, the middle of the bonnet low
  // between the fenders, the tail cut off square
  const W = curve([[-2.0, 1.84], [-1.6, 1.98], [-1.05, 2.02], [0, 1.9], [1.25, 2.0], [1.8, 1.92], [2.13, 1.66]]);
  const TOP = curve([[-2.0, 0.66], [-1.6, 0.7], [-0.9, 0.7], [-0.4, 0.66], [0.6, 0.6], [1.4, 0.54], [1.9, 0.44], [2.13, 0.3]]);
  const BOT = (z) => arch(z, z > 1.8 ? 0.12 + (z - 1.8) * 0.15 : 0.12);
  add(smoothBody(-2.0, 2.13, 80, (z) => ({ w: W(z), top: TOP(z), bot: BOT(z), tuck: 0.12, sq: 6 })), MAT.blue);
  add(new THREE.BoxGeometry(1.2, 0.08, 3.6).translate(0, 0.14, 0.05), MAT.carbon);           // the floor (no seeing through)
  for (const wz of [FZ, RZ]) for (const s of [1, -1]) add(new THREE.CylinderGeometry(WR + 0.05, WR + 0.05, 0.4, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.72, WR, wz), MAT.dark, false);
  // the front fenders standing up either side of the low bonnet, swelling over the wheels
  const FT = curve([[0.55, 0.6], [0.9, 0.72], [1.25, 0.78], [1.65, 0.72], [2.05, 0.46]]);
  // (each swelling grows smoothly out of the body and back into it: no ends sticking out)
  const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  for (const s of [1, -1]) add(smoothBody(0.45, 2.08, 34, (z) => { const e = ease((z - 0.45) / 0.45); return { x: s * (0.72 - 0.12 * (1 - e)), w: (0.56 - Math.max(0, z - 1.7) * 0.4) * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (FT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.3 + 0.12 * (1 - e)), tuck: 0.3, sq: 3 }; }), MAT.blue);
  // the rear fenders, swelling up over the back wheels and running into the fins
  const RT = curve([[-0.5, 0.66], [-1.05, 0.82], [-1.5, 0.86], [-1.85, 0.92], [-2.0, 0.94]]);
  for (const s of [1, -1]) add(smoothBody(-2.0, -0.35, 34, (z) => { const e = ease((-0.35 - z) / 0.45); return { x: s * (0.74 - 0.12 * (1 - e)), w: 0.54 * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (RT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.32 + 0.12 * (1 - e)), tuck: 0.35, sq: 3 }; }), MAT.blue);
  // the broad orange stripe down the middle: nose, roof, tail, edged in blue
  const stripe = (z0, z1, topFn, w) => add(smoothBody(z0, z1, 40, (z) => ({ w, top: topFn(z) + 0.006, bot: topFn(z) - 0.02, sq: 2.4 })), MAT.yellow);
  stripe(0.7, 2.11, TOP, 0.62);
  // --- the cockpit: a small bubble, a wraparound screen, the roof, the window frames
  const CT = curve([[-0.75, 0.66], [-0.45, 0.86], [-0.05, 0.93], [0.35, 0.88], [0.72, 0.62]]);
  const CW = curve([[-0.75, 1.1], [-0.2, 1.22], [0.35, 1.26], [0.72, 1.34]]);
  add(smoothBody(-0.75, 0.72, 30, (z) => ({ w: CW(z), top: CT(z), bot: 0.55, tuck: 0.35, sq: 2.6 })), MAT.glass, false);
  { const roof = add(smoothBody(-0.7, 0.18, 20, (z) => ({ w: CW(z) * 0.86, top: CT(z) + 0.01, bot: CT(z) - 0.06, tuck: 0.25, sq: 2.6 })), roofMat); roof.castShadow = false; addPanel(roof); }
  stripe(-0.7, 0.18, (z) => CT(z) + 0.012, 0.42);
  add(smoothBody(-1.98, -0.72, 30, (z) => ({ w: 0.62, top: TOP(z) + 0.006, bot: TOP(z) - 0.02, sq: 2.4 })), MAT.yellow);
  for (const s of [1, -1]) add(rod([s * 0.6, 0.6, 0.7], [s * 0.5, 0.88, 0.3], 0.025), MAT.blue);        // the screen's pillars
  // the doors' shut lines, and a white roundel with a number on each
  const roundel = new THREE.MeshStandardMaterial({ roughness: 0.4, alphaTest: 0.5, alphaToCoverage: true, map: (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 128); g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 74px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })() });
  for (const s of [1, -1]) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), roundel);
    d.position.set(s * (W(0) / 2 + 0.004), 0.42, 0.05); d.rotation.y = s * Math.PI / 2; car.add(d);
    for (const z of [0.72, -0.62]) add(new THREE.BoxGeometry(0.006, 0.36, 0.006).translate(s * (W(z) / 2 - 0.01), 0.45, z), MAT.dark, false);
  }
  // --- the nose: the headlights under clear covers in the fenders, a
  // low mouth for the oil cooler and the brakes
  for (const s of [1, -1]) {
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16).rotateX(Math.PI / 2 - 0.5).translate(s * 0.7, 0.62, 1.88), MAT.lamp);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16).rotateX(Math.PI / 2 - 0.5).translate(s * 0.52, 0.56, 1.95), MAT.lamp);
    add(smoothBody(1.78, 2.02, 6, (z) => ({ x: s * 0.62, w: 0.36, top: FT(z) + 0.01, bot: FT(z) - 0.12, sq: 2.5 })), MAT.lens, false);
  }
  add(new THREE.BoxGeometry(0.7, 0.08, 0.02).translate(0, 0.2, 2.1), MAT.dark, false);
  // mirrors: little round ones on the front fenders
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.72, 0.74, 0.85], [s * 0.74, 0.8, 0.85], 0.012), MAT.carbon);
    const pod = new THREE.Group(); car.add(pod);
    pod.add(add(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16).rotateX(Math.PI / 2).translate(s * 0.74, 0.84, 0.85), MAT.blue));
    pod.add(add(new THREE.CircleGeometry(0.048, 16).rotateY(Math.PI).translate(s * 0.74, 0.84, 0.824), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.74, 0.84, 0.85] };
  }
  // --- the tail: the deck's cooling grille over the flat-12 (the big fan
  // under it), the two fins, the mesh across the back, the lights, the exhausts
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24).translate(0, 0.705, -1.0), MAT.dark, false);
  for (let k = -3; k <= 3; k++) add(new THREE.BoxGeometry(0.46, 0.012, 0.02).translate(0, 0.716, -1.0 + k * 0.06), MAT.carbon, false);
  add(new THREE.PlaneGeometry(1.5, 0.42).rotateY(Math.PI).translate(0, 0.42, -2.005), MAT.dark, false);
  for (const s of [1, -1]) {
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14).rotateX(Math.PI / 2).translate(s * 0.72, 0.62, -2.01), MAT.rain);
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.16, 12, 1, true).rotateX(Math.PI / 2).translate(s * 0.25, 0.24, -2.02), MAT.exhaust);
  }
  // the driver (on the right), his helmet, his body and the wheel (the
  // computer drivers' and the Garage's; the player's has its own cockpit)
  const DX = -0.27;
  add(new THREE.BoxGeometry(0.42, 0.06, 0.42).translate(DX, 0.22, -0.15), MAT.seat, false);
  add(new THREE.BoxGeometry(0.42, 0.5, 0.06).rotateX(-0.3).translate(DX, 0.45, -0.4), MAT.seat, false);
  const driver = new THREE.Group(); car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.14, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.75, 0.8).translate(DX, 0.56, -0.25), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([DX + sx * 0.17, 0.6, -0.22], [DX + sx * 0.15, 0.5, 0.02], 0.04), MAT.suit); dAdd(rod([DX + sx * 0.15, 0.5, 0.02], [DX + sx * 0.12, 0.62, 0.22], 0.035), MAT.suit); }
  dAdd(new THREE.TorusGeometry(0.17, 0.016, 6, 20).rotateX(-0.6).translate(DX, 0.62, 0.26), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(DX, 0.78, -0.25), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(DX, 0.78, -0.25), MAT.visor);
  const hstripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(DX, 0.78, -0.25), MAT.yellow);
  // the "wings": little canards at the nose's corners, and the spoiler
  // lip across the tail between the fins (each can be knocked off)
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) addTo(s > 0 ? wings.fl : wings.fr, new THREE.BoxGeometry(0.18, 0.012, 0.12).rotateZ(-s * 0.15).translate(s * 0.86, 0.3, 1.95), MAT.carbon);
  addTo(wings.rear, new THREE.BoxGeometry(1.1, 0.012, 0.14).rotateX(0.35).translate(0, 0.74, -1.98), MAT.blue);
  return { helmet: [helmet, visor, hstripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver, lampMat: MAT.lamp, lampAt: LAMP_AT };
}

// =====================================================================
// THE TTP-91 AS THE PLAYER'S CAR (and the computer drivers', and the
// Garage's): the body. A tribute to the 1991 Group C cars: long, low and
// wide; a sharp low nose with the front wheels' fenders swelling up
// either side, the headlights under clear covers at its corners; a small
// cockpit with the driver on the right; long flanks with ducts ahead of
// the skirted back wheels; a long flat tail with a big wing between its
// fins. In our own bright orange and green, after the famous scheme of
// that winner (no sponsor, no names), a white number panel on each door.
// =====================================================================
export function buildP91Body(car, addPanel) {
  const MAT = {
    // (the paint: orange and green in sweeping bands: see chargePaint below)
    blue: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    green: new THREE.MeshPhysicalMaterial({ color: 0x2fb54a, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),   // (the small parts)
    yellow: new THREE.MeshPhysicalMaterial({ color: 0xff6a12, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),   // (the orange)
    carbon: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.6, metalness: 0.2 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    lens: new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.2, metalness: 0.6, emissive: 0xfff3d0, emissiveIntensity: 0.2 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: 0x2fb54a, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  const roofMat = MAT.blue.clone(); roofMat.side = THREE.DoubleSide;
  // THE SCHEME: orange and green, interlocking. Broad diagonal swoops
  // sweeping up from the nose and back over the body, each edge a little
  // wavy, so the two colours run into each other all over the car (drawn
  // on the surface itself, so the edges are clean however close you look)
  const GREEN = new THREE.Color(0x2fb54a), ORANGE = new THREE.Color(0xff6a12);
  const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
  const chargePaint = (mat) => {
    mat.customProgramCacheKey = () => 'charge-paint';
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vChargePos;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvChargePos = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vChargePos;').replace('#include <color_fragment>', `#include <color_fragment>
        {
          float ax = abs(vChargePos.x);
          float u = vChargePos.z * 0.62 + vChargePos.y * 1.45 + ax * 0.42 + 0.16 * sin(vChargePos.z * 2.3 + ax * 3.1) + 0.08 * sin(vChargePos.z * 5.1 - vChargePos.y * 4.0);
          float band = mod(floor(u / 0.62), 2.0);
          diffuseColor.rgb *= mix(${v3(GREEN)}, ${v3(ORANGE)}, band);
        }`);
    };
  };
  chargePaint(MAT.blue); chargePaint(roofMat);
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow || mat === roofMat) addPanel(m);
    return m;
  };
  const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  const FZ = 1.3, RZ = -1.36, WR = 0.33;
  const LAMP_AT = [0, 0.5, 2.05];          // (where the headlights shine from)
  // (the front wheels have open arches; the back ones are skirted)
  const arch = (z, base) => { const d = z - FZ, r = WR + 0.05; return Math.abs(d) < r ? Math.max(base, WR + Math.sqrt(r * r - d * d)) : base; };
  const W = curve([[-2.45, 1.92], [-1.36, 2.0], [-0.4, 1.94], [0.4, 1.92], [1.3, 2.0], [2.0, 1.92], [2.36, 1.72]]);
  const TOP = curve([[-2.45, 0.8], [-1.8, 0.78], [-1.0, 0.75], [-0.6, 0.72], [0.6, 0.6], [1.3, 0.56], [1.9, 0.42], [2.36, 0.2]]);
  const BOT = (z) => arch(z, z > 2.0 ? 0.1 + (z - 2.0) * 0.12 : 0.1);
  add((smoothBody(-2.45, 2.36, 140, (z) => ({ w: W(z), top: TOP(z), bot: BOT(z), tuck: 0.12, sq: 7 }), 64)), MAT.blue);
  add(new THREE.BoxGeometry(1.3, 0.06, 4.2).translate(0, 0.12, -0.05), MAT.carbon);
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(WR + 0.05, WR + 0.05, 0.42, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.73, WR, FZ), MAT.dark, false);
  // the front fenders swelling up either side of the low nose (and back into the body)
  const FT = curve([[0.55, 0.58], [0.95, 0.68], [1.3, 0.74], [1.75, 0.66], [2.2, 0.36]]);
  for (const s of [1, -1]) add((smoothBody(0.5, 2.22, 50, (z) => { const e = ease((z - 0.5) / 0.45); return { x: s * (0.73 - 0.12 * (1 - e)), w: (0.54 - Math.max(0, z - 1.8) * 0.5) * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (FT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.3 + 0.12 * (1 - e)), tuck: 0.3, sq: 3 }; }, 40)), MAT.blue);
  // the cockpit: small, a wraparound screen, the roof (green), its pillars
  const CT = curve([[-0.85, 0.72], [-0.5, 0.93], [-0.05, 0.99], [0.35, 0.93], [0.72, 0.6]]);
  const CW = curve([[-0.85, 1.1], [-0.2, 1.24], [0.35, 1.28], [0.72, 1.36]]);
  add(smoothBody(-0.85, 0.72, 30, (z) => ({ w: CW(z), top: CT(z), bot: 0.55, tuck: 0.35, sq: 2.6 })), MAT.glass, false);
  { const roof = add((smoothBody(-0.8, 0.2, 30, (z) => ({ w: CW(z) * 0.86, top: CT(z) + 0.01, bot: CT(z) - 0.06, tuck: 0.25, sq: 2.6 }), 40)), roofMat); roof.castShadow = false; }
  for (const s of [1, -1]) add(rod([s * 0.62, 0.6, 0.7], [s * 0.52, 0.93, 0.32], 0.025), MAT.green);
  // the long tail: the deck, the fins rising either side, the big wing between them
  const FinT = curve([[-0.9, 0.76], [-1.6, 0.86], [-2.1, 0.98], [-2.45, 1.02]]);
  for (const s of [1, -1]) add((smoothBody(-2.45, -0.85, 40, (z) => { const e = ease((-0.85 - z) / 0.5); return { x: s * (0.86 - 0.1 * (1 - e)), w: 0.2 * (0.4 + 0.6 * e), top: TOP(z) + (FinT(z) - TOP(z)) * e, bot: TOP(z) - 0.15, tuck: 0.2, sq: 3 }; })), MAT.blue);
  // the flanks: a duct ahead of each back wheel, the skirt's line
  for (const s of [1, -1]) {
    add(new THREE.PlaneGeometry(0.42, 0.16).rotateY(s * Math.PI / 2).translate(s * (W(-0.6) / 2 + 0.006), 0.48, -0.6), MAT.dark, false);
    add(new THREE.BoxGeometry(0.006, 0.005, 1.4).translate(s * (W(RZ) / 2 + 0.006), 0.2, RZ), MAT.dark, false);
  }
  // the white number panel on each door
  const numMat = new THREE.MeshStandardMaterial({ roughness: 0.4, map: (() => {
    const c = document.createElement('canvas'); c.width = 160; c.height = 112; const g = c.getContext('2d');
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 160, 112);
    g.fillStyle = '#111'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('15', 80, 62);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })() });
  for (const s of [1, -1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), numMat); d.position.set(s * (W(0) / 2 + 0.012), 0.5, 0.0); d.rotation.y = s * Math.PI / 2; car.add(d); }
  // the nose: the headlights at its corners under clear covers, a low mouth
  for (const s of [1, -1]) {
    add(new THREE.BoxGeometry(0.22, 0.06, 0.02).rotateX(-0.9).translate(s * 0.6, 0.5, 1.98), MAT.lamp);
    add(smoothBody(1.86, 2.12, 6, (z) => ({ x: s * 0.6, w: 0.3, top: FT(z) + 0.01, bot: FT(z) - 0.1, sq: 2.5 })), MAT.lens, false);
  }
  add(new THREE.BoxGeometry(0.9, 0.06, 0.02).translate(0, 0.15, 2.3), MAT.dark, false);
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.66, 0.62, 0.62], [s * 0.74, 0.72, 0.62], 0.012), MAT.carbon);
    const pod = new THREE.Group(); car.add(pod);
    pod.add(add(new THREE.BoxGeometry(0.14, 0.07, 0.05).translate(s * 0.78, 0.74, 0.62), MAT.green));
    pod.add(add(new THREE.PlaneGeometry(0.12, 0.055).rotateY(Math.PI).translate(s * 0.78, 0.74, 0.594), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.78, 0.74, 0.62] };
  }
  // the back: the mesh across it, the lights, the exhausts out in the middle
  add(new THREE.PlaneGeometry(1.7, 0.5).rotateY(Math.PI).translate(0, 0.45, -2.455), MAT.dark, false);
  for (const s of [1, -1]) add(new THREE.BoxGeometry(0.2, 0.06, 0.02).translate(s * 0.7, 0.66, -2.46), MAT.rain);
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.06, 0.065, 0.16, 12, 1, true).rotateX(Math.PI / 2).translate(s * 0.12, 0.36, -2.48), MAT.exhaust);
  // the driver (on the right)
  const DX = -0.27;
  add(new THREE.BoxGeometry(0.42, 0.06, 0.42).translate(DX, 0.22, -0.2), MAT.seat, false);
  add(new THREE.BoxGeometry(0.42, 0.5, 0.06).rotateX(-0.3).translate(DX, 0.45, -0.45), MAT.seat, false);
  const driver = new THREE.Group(); car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.14, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.75, 0.8).translate(DX, 0.56, -0.3), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([DX + sx * 0.17, 0.6, -0.27], [DX + sx * 0.15, 0.5, -0.03], 0.04), MAT.suit); dAdd(rod([DX + sx * 0.15, 0.5, -0.03], [DX + sx * 0.12, 0.62, 0.17], 0.035), MAT.suit); }
  dAdd(new THREE.TorusGeometry(0.16, 0.016, 6, 20).rotateX(-0.6).translate(DX, 0.62, 0.21), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(DX, 0.8, -0.3), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(DX, 0.8, -0.3), MAT.visor);
  const hstripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(DX, 0.8, -0.3), MAT.yellow);
  // "wings": dive planes at the nose's corners, and the big rear wing
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) addTo(s > 0 ? wings.fl : wings.fr, new THREE.BoxGeometry(0.2, 0.012, 0.16).rotateZ(-s * 0.2).translate(s * 0.88, 0.36, 2.0), MAT.carbon);
  addTo(wings.rear, new THREE.BoxGeometry(1.62, 0.03, 0.34).rotateX(0.18).translate(0, 1.0, -2.22), MAT.yellow);
  addTo(wings.rear, new THREE.BoxGeometry(1.62, 0.018, 0.14).rotateX(0.55).translate(0, 1.07, -2.42), MAT.green);
  for (const s of [1, -1]) addTo(wings.rear, new THREE.BoxGeometry(0.02, 0.36, 0.56).translate(s * 0.82, 0.98, -2.25), MAT.green);
  return { helmet: [helmet, visor, hstripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver, lampMat: MAT.lamp, lampAt: LAMP_AT };
}
export const bodyForKind = (kind) => ({ f05: buildF05Body, f94: buildF94Body, p70: buildP70Body, p91: buildP91Body }[kind] || buildF1Body);

// a plain F1 rim of the time: a shallow dish with six slim spokes and a
// big single centre nut (r: its radius, w: its width)
// EACH TTF'S WHEELS, in the style of its year's: thirteen-inch, as every
// car's was then. The TTF-88's after the 1988 magnesium wheels: silver,
// ten thin straight spokes. The TTF-94's after the 1994 cross-spoked ones:
// silver, its spokes crossing in a lattice. The TTF-05's: dark anthracite,
// six spokes, each splitting in two at the rim
export const RIM_STYLES = {
  f1: { pattern: 'straight', spokes: 10, color: 0xb9bcc1 },
  f94: { pattern: 'cross', spokes: 10, color: 0xc7c9cc },
  f05: { pattern: 'split', spokes: 6, color: 0x2e3035 },
};
export function buildF1RimGeometry(r, w, style = { pattern: 'straight', spokes: 6 }) {
  const parts = [
    new THREE.CylinderGeometry(r, r, w * 0.92, 28, 1, true).rotateZ(Math.PI / 2),                 // the barrel
    new THREE.TorusGeometry(r, 0.012, 6, 28).rotateY(Math.PI / 2).translate(w * 0.46, 0, 0),        // its lips
    new THREE.TorusGeometry(r, 0.012, 6, 28).rotateY(Math.PI / 2).translate(-w * 0.46, 0, 0),
    new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.05, 16).rotateZ(Math.PI / 2).translate(w * 0.18, 0, 0),   // the hub
    new THREE.CylinderGeometry(0.045, 0.05, 0.07, 6).rotateZ(Math.PI / 2).translate(w * 0.24, 0, 0),         // the centre nut
  ];
  // (a spoke from the hub at angle a0, radius r0 out to the rim at a1, r1; across the wheel's face, at x)
  const spoke = (a0, r0, a1, r1, t, d, x) => {
    const y0 = Math.cos(a0) * r0, z0 = Math.sin(a0) * r0, y1 = Math.cos(a1) * r1, z1 = Math.sin(a1) * r1;
    const L = Math.hypot(y1 - y0, z1 - z0);
    return new THREE.BoxGeometry(d, L, t).translate(0, L / 2, 0).rotateX(Math.atan2(z1 - z0, y1 - y0)).translate(x, y0, z0);
  };
  const n = style.spokes, x = w * 0.16;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    if (style.pattern === 'cross') {
      // (two crossing ways round: one layer leaning forward, one back, a touch apart, so they lattice)
      parts.push(spoke(a, r * 0.26, a + 0.42, r * 0.97, 0.018, 0.016, x + 0.006), spoke(a, r * 0.26, a - 0.42, r * 0.97, 0.018, 0.016, x - 0.006));
    } else if (style.pattern === 'split') {
      // (out from the hub as one, then forking into a Y at the rim)
      const m = r * 0.62;
      parts.push(spoke(a, r * 0.26, a, m, 0.04, 0.026, x), spoke(a, m, a + 0.2, r * 0.97, 0.022, 0.022, x), spoke(a, m, a - 0.2, r * 0.97, 0.022, 0.022, x));
    } else {
      parts.push(spoke(a, r * 0.26, a, r * 0.97, 0.018, 0.02, x));
    }
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
export function buildF1Cockpit(car, { paddles = false, wheelTilt = -0.5, suit = 0xc81d25 } = {}) {
  const group = new THREE.Group();
  car.add(group);
  const M = {
    carbon: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.45, metalness: 0.3 }),
    pad: new THREE.MeshStandardMaterial({ color: 0x23252b, roughness: 0.95 }),
    // (his race suit: the team's colours (red, as the Caterham's driver, if none), black gloves)
    suit: new THREE.MeshStandardMaterial({ color: suit, roughness: 0.85 }),
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
  column.rotation.x = wheelTilt;                   // tilted back towards him, below his eye line (the TT-05's stands straight up, facing him)
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
  // his legs, from his hips in the seat down the footwell to his feet on
  // the pedals: a thigh and a shin each, the knee bent up a little between
  // (worked out every frame, as his feet move on the pedals)
  const THIGH = 0.5, SHIN = 0.53, hipY = 0.2, hipZ = 0.08;
  const limb = new THREE.CylinderGeometry(1, 1, 1, 12).translate(0, 0.5, 0);
  const legs = [0, 1].map((i) => ({
    hip: new THREE.Vector3(i === 0 ? -0.09 : 0.09, hipY, hipZ),
    thigh: add(limb, M.suit), shin: add(limb, M.suit), knee: add(new THREE.SphereGeometry(0.055, 12, 10), M.suit),
  }));
  const _d = new THREE.Vector3(), _k = new THREE.Vector3(), _u = new THREE.Vector3(), _q = new THREE.Quaternion(), UPV = new THREE.Vector3(0, 1, 0);
  const bone = (m, a, b, r) => { _d.subVectors(b, a); const l = _d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(UPV, _d.normalize()); m.scale.set(r, l, r); };
  const placeLeg = (L, foot) => {
    const ankle = foot;
    _d.subVectors(ankle, L.hip); const d = Math.min(_d.length(), (THIGH + SHIN) * 0.995); _d.normalize();
    const a = (THIGH * THIGH - SHIN * SHIN + d * d) / (2 * d), h = Math.sqrt(Math.max(0, THIGH * THIGH - a * a));
    _u.copy(UPV).addScaledVector(_d, -UPV.dot(_d)).normalize();          // (the knee bends up)
    _k.copy(L.hip).addScaledVector(_d, a).addScaledVector(_u, h);
    bone(L.thigh, L.hip, _k, 0.065); bone(L.shin, _k, ankle, 0.048); L.knee.position.copy(_k);
  };
  legs.forEach((L, i) => placeLeg(L, new THREE.Vector3(i === 0 ? pedalAt.throttle : (paddles ? pedalAt.brake : pedalAt.clutch), pedalY + 0.06, pedalZ - 0.03)));   // (where they start)
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
    driverParts: [chest, back, neck, ...feet, ...legs.flatMap((l) => [l.thigh, l.shin, l.knee]), ...arms.flatMap((a) => [a.upper, a.fore, a.elbow, a.hand])],   // (him, without the wheel: for climbing out)
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
        placeLeg(legs[i], footPt);
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
