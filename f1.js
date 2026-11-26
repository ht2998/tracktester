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
export const BUILD = 92;

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
  // (the TTF-20's: a 1.6 turbo V6 with its electric motors, the turbo spun up by one
  // too, so next to no lag; about 1,000 bhp together, rev-limited at 15,000)
  hybridV6: { engineInertia: 0.06, sound: { tone: 1.3, bass: 0.9, drive: 1.3, vol: 1.1 }, name: '1.6 turbo V6 hybrid', cylinders: 6, idleRpm: 4000, redline: 15000, launchRpm: 10000, engineBraking: 70, peakTorque: 640, massDelta: 0,
    torqueCurve: [[3000, 350], [5000, 480], [7000, 560], [9000, 620], [10500, 640], [11500, 630], [12500, 600], [13500, 520], [14500, 220], [15000, 0]],
    turbo: { onRpm: 3000, fullRpm: 6000, lag: 0.1, base: 0.85 } },
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
// THE TTF-20: an original 2020 hybrid Formula 1 car (a tribute to the cars of
// that year: no real make, badges or livery). Very long (3.7 m between the
// axles) and wide (2 m), heavy (746 kg), wide slicks on 13-inch wheels, the
// halo over the cockpit, tiny sidepods, a huge floor and front wing: more
// downforce and grip than any of the others, the 1.6 turbo V6 hybrid
export const F20_CAR = {
  ...F05_CAR,
  name: 'TTF-20',
  body: 'f20',
  grooved: false,
  stockEngine: 'hybridV6',
  baseMass: 746,
  inertia: 1250,
  airInertia: { pitch: 1400, yaw: 1450, roll: 300 },
  cgToFront: 2.04, cgToRear: 1.675,  // 3.715 m between the axles, a little more weight on the back
  trackHalf: 0.79,
  wheelRadius: 0.33,
  frontGrip: 1.62, rearGrip: 1.78,   // (wide slicks)
  cgHeight: 0.26,
  downforce: 3.4,
  downforceFront: 0.45,
  drag: 0.78,
  brakeForce: 30000, brakeBias: 0.57,
  maxSteer: 0.3, steerSpeed: 3.4,
  frontStiffness: 82000, rearStiffness: 95000,
  shiftTime: { manual: 0.03, auto: 0.08 },
  fuelCapacity: 110,
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
export const STOCK_ENGINE = { caterham: 'duratec', f1: 'turboV6', f20: 'hybridV6', f05: 'v10x', f94: 'v12', p70: 'flat12', p91: 'rotary4' };
export const specForKind = (kind) => ({ f20: F20_CAR, f05: F05_CAR, f94: F94_CAR, p70: P70_CAR, p91: P91_CAR, f1: F1_CAR }[kind] || CATERHAM_CAR);
// where each single-seater's wheels are: [x, z, width] (left, right; front then back)
// THE DRIVERS' RACE SUITS: in each team's colours (suit, and the trim on
// his helmet): white and red for the TTF-88, red and white for the TTF-94,
// light blue and yellow for the TTF-05
export const DRIVER_SUITS = {
  f1: { suit: 0xf2f2ee, trim: 0xe0231b },
  f94: { suit: 0xc8141c, trim: 0xf4f4f0 },
  f05: { suit: 0x2f9be0, trim: 0xf2c200 },
  f20: { suit: 0x16171a, trim: 0x00a19b },
};
export const WHEEL_LAYOUT = {
  f1: [[0.88, 1.62, 0.3], [-0.88, 1.62, 0.3], [0.88, -1.28, 0.42], [-0.88, -1.28, 0.42]],
  f05: [[0.73, 1.67, 0.28], [-0.73, 1.67, 0.28], [0.73, -1.43, 0.35], [-0.73, -1.43, 0.35]],
  f20: [[0.805, 2.04, 0.305], [-0.805, 2.04, 0.305], [0.771, -1.675, 0.405], [-0.771, -1.675, 0.405]],
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
// how much further forward the TTF-88's driver sits than he used to (as the real car has him, lying well back)
export const F88_DRIVER_DZ = 0.35;
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
  const edgeY = (z) => 0.4 - (0.7 - z) * 0.2;
  // (measured off a reference of the real car: 350 slices, 100 down the nose to the
  // pods' mouths and 250 from there back; eight points a slice: the middle of the top,
  // three down the cover, the flat pod's top edge, its side, its foot, the floor)
  const F88NZ = [2.5,2.483,2.465,2.448,2.43,2.413,2.395,2.378,2.36,2.343,2.325,2.308,2.29,2.273,2.255,2.238,2.22,2.203,2.185,2.168,2.151,2.133,2.116,2.098,2.081,2.063,2.046,2.028,2.011,1.993,1.976,1.958,1.941,1.923,1.906,1.888,1.871,1.853,1.836,1.818,1.801,1.784,1.766,1.749,1.731,1.714,1.696,1.679,1.661,1.644,1.626,1.609,1.591,1.574,1.556,1.539,1.521,1.504,1.486,1.469,1.452,1.434,1.417,1.399,1.382,1.364,1.347,1.329,1.312,1.294,1.277,1.259,1.242,1.224,1.207,1.189,1.172,1.154,1.137,1.119,1.102,1.085,1.067,1.05,1.032,1.015,0.997,0.98,0.962,0.945,0.927,0.91,0.892,0.875,0.857,0.84,0.822,0.805,0.787,0.77];
  const F88BZ = [0.75,0.7414,0.7327,0.7241,0.7155,0.7068,0.6982,0.6896,0.6809,0.6723,0.6637,0.655,0.6464,0.6378,0.6291,0.6205,0.6118,0.6032,0.5946,0.5859,0.5773,0.5687,0.56,0.5514,0.5428,0.5341,0.5255,0.5169,0.5082,0.4996,0.491,0.4823,0.4737,0.4651,0.4564,0.4478,0.4392,0.4305,0.4219,0.4133,0.4046,0.396,0.3873,0.3787,0.3701,0.3614,0.3528,0.3442,0.3355,0.3269,0.3183,0.3096,0.301,0.2924,0.2837,0.2751,0.2665,0.2578,0.2492,0.2406,0.2319,0.2233,0.2147,0.206,0.1974,0.1888,0.1801,0.1715,0.1629,0.1542,0.1456,0.1369,0.1283,0.1197,0.111,0.1024,0.0938,0.0851,0.0765,0.0679,0.0592,0.0506,0.042,0.0333,0.0247,0.0161,0.0074,-0.0012,-0.0098,-0.0185,-0.0271,-0.0357,-0.0444,-0.053,-0.0616,-0.0703,-0.0789,-0.0876,-0.0962,-0.1048,-0.1135,-0.1221,-0.1307,-0.1394,-0.148,-0.1566,-0.1653,-0.1739,-0.1825,-0.1912,-0.1998,-0.2084,-0.2171,-0.2257,-0.2343,-0.243,-0.2516,-0.2602,-0.2689,-0.2775,-0.2861,-0.2948,-0.3034,-0.312,-0.3207,-0.3293,-0.338,-0.3466,-0.3552,-0.3639,-0.3725,-0.3811,-0.3898,-0.3984,-0.407,-0.4157,-0.4243,-0.4329,-0.4416,-0.4502,-0.4588,-0.4675,-0.4761,-0.4847,-0.4934,-0.502,-0.5106,-0.5193,-0.5279,-0.5365,-0.5452,-0.5538,-0.5624,-0.5711,-0.5797,-0.5884,-0.597,-0.6056,-0.6143,-0.6229,-0.6315,-0.6402,-0.6488,-0.6574,-0.6661,-0.6747,-0.6833,-0.692,-0.7006,-0.7092,-0.7179,-0.7265,-0.7351,-0.7438,-0.7524,-0.761,-0.7697,-0.7783,-0.7869,-0.7956,-0.8042,-0.8129,-0.8215,-0.8301,-0.8388,-0.8474,-0.856,-0.8647,-0.8733,-0.8819,-0.8906,-0.8992,-0.9078,-0.9165,-0.9251,-0.9337,-0.9424,-0.951,-0.9596,-0.9683,-0.9769,-0.9855,-0.9942,-1.0028,-1.0114,-1.0201,-1.0287,-1.0373,-1.046,-1.0546,-1.0633,-1.0719,-1.0805,-1.0892,-1.0978,-1.1064,-1.1151,-1.1237,-1.1323,-1.141,-1.1496,-1.1582,-1.1669,-1.1755,-1.1841,-1.1928,-1.2014,-1.21,-1.2187,-1.2273,-1.2359,-1.2446,-1.2532,-1.2618,-1.2705,-1.2791,-1.2878,-1.2964,-1.305,-1.3137,-1.3223,-1.3309,-1.3396,-1.3482,-1.3568,-1.3655,-1.3741,-1.3827,-1.3914,-1.4];
  const F88A = { x0: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0001,0.0002,0.0004,0.0008,0.0016,0.0031,0.0056,0.0095,0.0156,0.0241,0.0354,0.0496,0.0663,0.085,0.1046,0.124,0.1423,0.1587,0.1726,0.184,0.1931,0.2002,0.2056,0.2099,0.2132,0.2158,0.2179,0.2196,0.2209], y0: [0.19,0.1938,0.1982,0.2032,0.2087,0.2146,0.2208,0.2271,0.2335,0.24,0.2465,0.253,0.2594,0.2659,0.2723,0.2787,0.2851,0.2915,0.2978,0.3041,0.3104,0.3167,0.323,0.3292,0.3354,0.3415,0.3477,0.3538,0.3598,0.3659,0.3719,0.3778,0.3837,0.3896,0.3954,0.4011,0.4068,0.4124,0.4179,0.4233,0.4286,0.4339,0.4391,0.4444,0.4495,0.4547,0.4599,0.465,0.4702,0.4753,0.4803,0.4853,0.4902,0.4949,0.4993,0.5035,0.5073,0.5108,0.5138,0.5164,0.5187,0.5208,0.5226,0.5243,0.5261,0.528,0.53,0.5322,0.5346,0.5373,0.54,0.5429,0.5458,0.5488,0.5517,0.5545,0.5571,0.5593,0.5612,0.5624,0.563,0.5629,0.5619,0.5601,0.5577,0.5547,0.5512,0.5475,0.5436,0.5397,0.5358,0.5322,0.5287,0.5255,0.5226,0.52,0.5179,0.5161,0.5146,0.5135], x1: [0.0164,0.0171,0.0179,0.0189,0.02,0.0213,0.0226,0.024,0.0254,0.0268,0.0281,0.0295,0.0308,0.032,0.0333,0.0345,0.0357,0.0369,0.038,0.039,0.0399,0.0407,0.0415,0.0421,0.0427,0.0432,0.0437,0.0442,0.0446,0.0451,0.0454,0.0458,0.0462,0.0467,0.0473,0.0479,0.0487,0.0495,0.0504,0.0514,0.0524,0.0535,0.0545,0.0555,0.0566,0.0576,0.0585,0.0595,0.0604,0.0613,0.0622,0.0631,0.064,0.0649,0.0658,0.0666,0.0673,0.068,0.0686,0.0692,0.0697,0.0702,0.0708,0.0714,0.0721,0.0729,0.0738,0.0747,0.0757,0.0767,0.0776,0.0786,0.0794,0.0803,0.0813,0.0824,0.084,0.0862,0.0893,0.0938,0.0999,0.1079,0.1177,0.1293,0.1422,0.1557,0.1692,0.182,0.1936,0.2037,0.2122,0.2193,0.225,0.2298,0.2338,0.2372,0.2402,0.2429,0.2452,0.2471], y1: [0.1867,0.1898,0.1936,0.1981,0.2034,0.2092,0.2156,0.2222,0.2291,0.2359,0.2427,0.2494,0.2559,0.2623,0.2686,0.2747,0.2808,0.2869,0.293,0.2991,0.3053,0.3115,0.3177,0.3239,0.3301,0.3362,0.3423,0.3483,0.3543,0.3602,0.3661,0.3719,0.3777,0.3835,0.3892,0.3948,0.4003,0.4058,0.4112,0.4165,0.4217,0.4269,0.432,0.4371,0.4421,0.4471,0.452,0.4569,0.4618,0.4666,0.4714,0.4762,0.481,0.4857,0.4903,0.4949,0.4993,0.5035,0.5075,0.5111,0.5142,0.5168,0.5188,0.5203,0.5212,0.5217,0.5219,0.5221,0.5225,0.5231,0.5241,0.5256,0.5276,0.53,0.5328,0.5358,0.5389,0.542,0.5451,0.5479,0.5504,0.5526,0.5542,0.5552,0.5553,0.5545,0.5525,0.5492,0.5448,0.5393,0.533,0.5263,0.5196,0.5132,0.5074,0.5023,0.4981,0.4947,0.492,0.49], x2: [0.0358,0.0377,0.04,0.0426,0.0453,0.0482,0.0509,0.0536,0.056,0.0581,0.0601,0.0619,0.0637,0.0654,0.0671,0.0689,0.0708,0.0726,0.0745,0.0763,0.0779,0.0794,0.0807,0.0818,0.0829,0.0838,0.0846,0.0853,0.086,0.0866,0.0873,0.0879,0.0886,0.0894,0.0904,0.0915,0.0929,0.0944,0.096,0.0977,0.0994,0.1012,0.1029,0.1046,0.1063,0.1079,0.1095,0.1111,0.1126,0.1142,0.1157,0.1172,0.1188,0.1203,0.1217,0.1232,0.1245,0.1258,0.127,0.128,0.1289,0.1298,0.1305,0.1312,0.1319,0.1326,0.1333,0.1342,0.1352,0.1363,0.1376,0.1391,0.1407,0.1426,0.1447,0.1472,0.15,0.1532,0.1571,0.1616,0.167,0.1733,0.1804,0.1882,0.1966,0.2052,0.2136,0.2216,0.229,0.2355,0.2412,0.2461,0.2505,0.2543,0.2578,0.2611,0.2642,0.2671,0.2698,0.2722], y2: [0.1853,0.189,0.1933,0.1982,0.2035,0.2092,0.215,0.221,0.2269,0.2327,0.2384,0.2438,0.2491,0.2542,0.2591,0.264,0.269,0.274,0.2792,0.2847,0.2904,0.2963,0.3022,0.3083,0.3142,0.3201,0.3259,0.3316,0.3373,0.3428,0.3484,0.3539,0.3593,0.3646,0.3698,0.3749,0.3798,0.3845,0.3891,0.3936,0.3981,0.4024,0.4067,0.4109,0.415,0.419,0.423,0.427,0.4309,0.4349,0.4388,0.4428,0.4467,0.4506,0.4545,0.4584,0.4623,0.4662,0.4703,0.4744,0.4786,0.4829,0.4873,0.4917,0.4961,0.5005,0.5048,0.509,0.5131,0.5169,0.5206,0.524,0.5272,0.5301,0.5326,0.5348,0.5367,0.5383,0.5397,0.5409,0.5421,0.5434,0.5445,0.5456,0.5462,0.5461,0.5449,0.5423,0.5379,0.5319,0.5245,0.5161,0.5072,0.4986,0.4905,0.4835,0.4775,0.4726,0.4687,0.4657], x3: [0.0669,0.0703,0.0739,0.0776,0.0811,0.0843,0.0869,0.089,0.0906,0.0918,0.0928,0.0937,0.0946,0.0958,0.0973,0.0991,0.1013,0.1036,0.1062,0.1087,0.1111,0.1133,0.1154,0.1171,0.1187,0.12,0.1212,0.1222,0.1232,0.124,0.1248,0.1256,0.1265,0.1275,0.1287,0.1302,0.1319,0.1339,0.136,0.1383,0.1406,0.1429,0.1452,0.1475,0.1497,0.1518,0.1539,0.1561,0.1581,0.1602,0.1623,0.1644,0.1666,0.1688,0.171,0.1732,0.1754,0.1775,0.1796,0.1815,0.1833,0.1849,0.1865,0.188,0.1894,0.1908,0.1922,0.1937,0.1952,0.1967,0.1983,0.2,0.2017,0.2036,0.2056,0.2078,0.2102,0.2129,0.216,0.2194,0.2232,0.2274,0.232,0.2369,0.2419,0.247,0.252,0.2568,0.2613,0.2654,0.2691,0.2726,0.2759,0.2791,0.2822,0.2855,0.2887,0.2919,0.295,0.2979], y3: [0.1818,0.1841,0.1869,0.1903,0.1942,0.1986,0.2035,0.2088,0.2143,0.2199,0.2255,0.231,0.2362,0.2412,0.2459,0.2504,0.2547,0.259,0.2634,0.268,0.2727,0.2775,0.2825,0.2874,0.2924,0.2974,0.3023,0.3072,0.3122,0.3171,0.322,0.3269,0.3317,0.3364,0.3409,0.3452,0.3493,0.3532,0.3569,0.3605,0.364,0.3675,0.3709,0.3742,0.3774,0.3806,0.3838,0.3869,0.39,0.3931,0.3962,0.3993,0.4024,0.4055,0.4086,0.4117,0.4148,0.4179,0.4212,0.4245,0.4279,0.4313,0.4349,0.4385,0.4421,0.4457,0.4492,0.4527,0.4561,0.4594,0.4626,0.4657,0.4686,0.4713,0.4737,0.476,0.4781,0.4802,0.4822,0.4845,0.4871,0.4904,0.4943,0.4989,0.5038,0.5085,0.5122,0.5143,0.5141,0.5112,0.5059,0.4985,0.4897,0.4804,0.4714,0.4631,0.456,0.45,0.4451,0.4413], x4: [0.1003,0.1036,0.1068,0.1097,0.1122,0.1141,0.1155,0.1165,0.1172,0.1177,0.1182,0.1189,0.1198,0.121,0.1226,0.1246,0.127,0.1296,0.1323,0.1351,0.1378,0.1403,0.1426,0.1448,0.1467,0.1486,0.1503,0.152,0.1536,0.1551,0.1565,0.158,0.1594,0.1609,0.1625,0.1643,0.1663,0.1684,0.1708,0.1732,0.1758,0.1783,0.181,0.1836,0.1863,0.1889,0.1916,0.1943,0.197,0.1997,0.2023,0.205,0.2077,0.2104,0.2131,0.2158,0.2185,0.2212,0.2238,0.2264,0.229,0.2315,0.234,0.2364,0.2389,0.2412,0.2436,0.246,0.2484,0.2507,0.2531,0.2555,0.2579,0.2604,0.2628,0.2654,0.2679,0.2705,0.273,0.2756,0.2781,0.2805,0.2828,0.2849,0.2869,0.2887,0.2905,0.2921,0.2937,0.2952,0.2969,0.2988,0.3009,0.3035,0.3065,0.31,0.3139,0.318,0.3223,0.3264], y4: [0.1641,0.1657,0.1676,0.17,0.1729,0.1763,0.1802,0.1847,0.1897,0.1949,0.2003,0.2057,0.2109,0.2158,0.2205,0.225,0.2293,0.2335,0.2377,0.2418,0.2459,0.25,0.2541,0.2582,0.2622,0.2663,0.2705,0.2747,0.2791,0.2836,0.2881,0.2926,0.2971,0.3013,0.3053,0.3089,0.3123,0.3154,0.3183,0.3211,0.3239,0.3267,0.3295,0.3323,0.335,0.3376,0.3401,0.3425,0.3448,0.347,0.3491,0.3513,0.3533,0.3554,0.3574,0.3595,0.3616,0.3637,0.366,0.3683,0.3709,0.3735,0.3763,0.3791,0.382,0.385,0.388,0.3909,0.3939,0.3968,0.3997,0.4025,0.4052,0.4078,0.4102,0.4125,0.4147,0.4169,0.4194,0.4223,0.4261,0.431,0.4373,0.4448,0.4534,0.4624,0.4707,0.4773,0.4813,0.4821,0.4796,0.4742,0.4667,0.4582,0.4496,0.4415,0.4346,0.429,0.4246,0.4212], x5: [0.1015,0.1047,0.1079,0.1107,0.1132,0.1152,0.1167,0.1177,0.1185,0.119,0.1194,0.12,0.1209,0.1223,0.1244,0.1271,0.1305,0.1343,0.1383,0.1422,0.1457,0.1486,0.1507,0.1521,0.153,0.1534,0.1535,0.1536,0.1538,0.1541,0.1547,0.1556,0.1568,0.1583,0.1602,0.1623,0.1648,0.1675,0.1704,0.1735,0.1766,0.1797,0.1827,0.1856,0.1883,0.1909,0.1934,0.1958,0.1982,0.2005,0.2028,0.2051,0.2074,0.2096,0.2119,0.2142,0.2165,0.2189,0.2212,0.2236,0.2261,0.2286,0.2311,0.2336,0.2362,0.2387,0.2411,0.2435,0.2458,0.248,0.2501,0.2521,0.2541,0.256,0.2579,0.2598,0.2618,0.2639,0.2661,0.2684,0.2709,0.2735,0.2762,0.2789,0.2816,0.2841,0.2863,0.2883,0.2898,0.291,0.2919,0.2927,0.2937,0.2948,0.2965,0.2986,0.3011,0.3039,0.3068,0.3096], y5: [0.1329,0.1329,0.1331,0.1335,0.1343,0.1357,0.1378,0.1409,0.1449,0.1499,0.1558,0.1622,0.1688,0.1751,0.1808,0.1855,0.1893,0.1923,0.1948,0.1974,0.2003,0.204,0.2085,0.2136,0.219,0.2244,0.2293,0.2334,0.2365,0.2388,0.2403,0.2412,0.2417,0.2422,0.2426,0.2432,0.2441,0.2451,0.2463,0.2476,0.249,0.2505,0.2519,0.2533,0.2545,0.2557,0.2568,0.2579,0.2589,0.2598,0.2608,0.2618,0.2627,0.2638,0.2648,0.2658,0.2669,0.2681,0.2692,0.2703,0.2714,0.2725,0.2736,0.2747,0.2758,0.277,0.2782,0.2795,0.2809,0.2824,0.2839,0.2854,0.2868,0.2881,0.2892,0.2902,0.291,0.2917,0.2922,0.2926,0.2928,0.293,0.2931,0.2932,0.2933,0.2935,0.2937,0.2939,0.2938,0.2934,0.2922,0.2901,0.2869,0.2823,0.2764,0.2695,0.2618,0.2538,0.2461,0.239], x6: [0.0803,0.0836,0.0869,0.0898,0.0923,0.0943,0.0959,0.0971,0.0981,0.0991,0.1003,0.1016,0.1033,0.1052,0.1075,0.1098,0.1123,0.1147,0.1169,0.119,0.1209,0.1226,0.1242,0.1257,0.1272,0.1287,0.1304,0.1322,0.1342,0.1363,0.1387,0.1412,0.1439,0.1468,0.1498,0.1529,0.1561,0.1594,0.1627,0.166,0.1693,0.1726,0.1758,0.1789,0.182,0.1849,0.1879,0.1908,0.1936,0.1964,0.1992,0.2019,0.2045,0.2071,0.2095,0.2119,0.2141,0.2161,0.2181,0.2199,0.2216,0.2232,0.2248,0.2262,0.2276,0.229,0.2304,0.2317,0.2331,0.2345,0.236,0.2375,0.239,0.2406,0.2421,0.2436,0.2451,0.2466,0.2483,0.2502,0.2525,0.2552,0.2584,0.2621,0.2661,0.2703,0.2745,0.2785,0.2822,0.2856,0.2887,0.2914,0.2941,0.2967,0.2994,0.3021,0.3048,0.3075,0.31,0.3123], y6: [0.0701,0.0701,0.0703,0.0706,0.0711,0.072,0.0734,0.0754,0.0782,0.0817,0.0857,0.09,0.0941,0.0975,0.0998,0.1009,0.1008,0.1,0.099,0.0986,0.0993,0.1015,0.1051,0.1097,0.1146,0.1192,0.1227,0.1246,0.1249,0.1237,0.1214,0.1183,0.1152,0.1122,0.1097,0.1078,0.1064,0.1054,0.1048,0.1044,0.1042,0.1039,0.1037,0.1036,0.1034,0.1033,0.1031,0.103,0.1029,0.1028,0.1028,0.1027,0.1027,0.1028,0.1029,0.103,0.1032,0.1035,0.1038,0.1041,0.1043,0.1045,0.1047,0.1048,0.1049,0.105,0.1051,0.1053,0.1055,0.1058,0.1061,0.1063,0.1065,0.1065,0.1065,0.1063,0.1061,0.1059,0.1056,0.1054,0.1053,0.1053,0.1054,0.1056,0.1058,0.106,0.1063,0.1066,0.107,0.1074,0.108,0.1088,0.1099,0.1113,0.1132,0.1153,0.1178,0.1203,0.1229,0.1252], x7: [0,0,0,0,0,0.0001,0.0001,0.0002,0.0003,0.0004,0.0005,0.0007,0.0009,0.0011,0.0013,0.0015,0.0016,0.0017,0.0018,0.0019,0.0019,0.002,0.002,0.002,0.0019,0.0019,0.0018,0.0017,0.0016,0.0015,0.0013,0.0011,0.0009,0.0007,0.0005,0.0004,0.0003,0.0002,0.0001,0.0001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0001,0.0001,0.0002,0.0003,0.0005,0.0008,0.0011,0.0015,0.002,0.0025,0.003,0.0034,0.0036,0.0037,0.0037,0.0035,0.0032,0.0028,0.0025,0.0023,0.0023,0.0024,0.0026,0.003,0.0034,0.0039,0.0044,0.0047,0.005,0.0051,0.0052,0.0051,0.005,0.0048,0.0047,0.0045,0.0044,0.0043], y7: [0.1,0.1004,0.1009,0.1015,0.1023,0.103,0.1038,0.1044,0.1048,0.1051,0.1052,0.105,0.1047,0.1043,0.1039,0.1033,0.1028,0.1022,0.1016,0.1009,0.1003,0.0996,0.0988,0.0979,0.0969,0.0957,0.0942,0.0925,0.0906,0.0884,0.086,0.0836,0.0812,0.0788,0.0767,0.0748,0.0732,0.0718,0.0706,0.0696,0.0687,0.0679,0.0672,0.0665,0.0658,0.0652,0.0646,0.064,0.0634,0.0629,0.0624,0.0618,0.0613,0.0608,0.0604,0.0599,0.0595,0.0591,0.0588,0.0585,0.0582,0.058,0.0577,0.0575,0.0573,0.0571,0.0569,0.0568,0.0567,0.0566,0.0566,0.0567,0.0568,0.057,0.0572,0.0575,0.0578,0.0581,0.0584,0.0587,0.059,0.0592,0.0594,0.0596,0.0597,0.0598,0.0598,0.0598,0.0598,0.0597,0.0596,0.0595,0.0594,0.0594,0.0593,0.0592,0.0591,0.0591,0.0591,0.059] };
  const F88B = { x0: [0.2279,0.2286,0.2293,0.23,0.2307,0.2313,0.2318,0.2322,0.2326,0.2329,0.2331,0.2333,0.2335,0.2336,0.2337,0.2338,0.2338,0.2339,0.2339,0.2339,0.2339,0.2339,0.2339,0.2338,0.2338,0.2337,0.2336,0.2335,0.2335,0.2334,0.2333,0.2332,0.2332,0.2331,0.2331,0.2331,0.233,0.233,0.233,0.2331,0.2331,0.2331,0.2331,0.2332,0.2332,0.2332,0.2332,0.2331,0.2329,0.2324,0.2318,0.2308,0.2295,0.2277,0.2254,0.2225,0.219,0.215,0.2105,0.2055,0.2002,0.1945,0.1886,0.1825,0.1764,0.1701,0.1639,0.1576,0.1513,0.145,0.1387,0.1324,0.126,0.1197,0.1134,0.1071,0.1008,0.0945,0.0882,0.0819,0.0757,0.0694,0.0632,0.057,0.0508,0.0448,0.039,0.0334,0.0281,0.0232,0.0187,0.0147,0.0113,0.0084,0.0061,0.0043,0.0029,0.0019,0.0012,0.0007,0.0004,0.0002,0.0001,0.0001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0001,0.0001,0.0002,0.0003,0.0004,0.0006,0.0009,0.0012,0.0015,0.0018,0.0022,0.0025,0.0028], y0: [0.508,0.5077,0.5075,0.5073,0.5071,0.5069,0.5068,0.5067,0.5066,0.5065,0.5064,0.5064,0.5063,0.5062,0.5062,0.5061,0.5061,0.5061,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.506,0.5061,0.5062,0.5063,0.5065,0.5068,0.5073,0.508,0.509,0.5103,0.512,0.5142,0.5168,0.52,0.5237,0.5279,0.5325,0.5376,0.5429,0.5486,0.5545,0.5605,0.5666,0.5728,0.5791,0.5854,0.5917,0.598,0.6044,0.6107,0.617,0.6233,0.6297,0.636,0.6423,0.6487,0.655,0.6613,0.6675,0.6737,0.6799,0.6859,0.6917,0.6973,0.7025,0.7074,0.7118,0.7157,0.719,0.7217,0.7239,0.7255,0.7267,0.7274,0.7278,0.7279,0.7278,0.7276,0.7272,0.7268,0.7263,0.7258,0.7252,0.7246,0.724,0.7234,0.7228,0.7222,0.7215,0.7208,0.7201,0.7194,0.7186,0.7178,0.7171,0.7162,0.7154,0.7145,0.7137,0.7127,0.7118,0.7109,0.7099,0.7089,0.7079,0.7069,0.7059,0.7048,0.7037,0.7026,0.7015,0.7003,0.6991,0.6979,0.6967,0.6954,0.6941,0.6928,0.6915,0.6901,0.6888,0.6874,0.6859,0.6845,0.683,0.6814,0.6799,0.6783,0.6767,0.675,0.6734,0.6716,0.6699,0.6681,0.6663,0.6645,0.6626,0.6607,0.6588,0.6568,0.6549,0.6529,0.6508,0.6488,0.6467,0.6446,0.6425,0.6403,0.6382,0.636,0.6337,0.6315,0.6292,0.627,0.6247,0.6223,0.62,0.6176,0.6152,0.6128,0.6104,0.6079,0.6054,0.6029,0.6004,0.5978,0.5952,0.5926,0.5899,0.5872,0.5845,0.5818,0.579,0.5762,0.5733,0.5704,0.5675,0.5645,0.5615,0.5585,0.5554,0.5523,0.5491,0.546,0.5428,0.5397,0.5365,0.5333,0.53,0.5268,0.5236,0.5204,0.5171,0.5139,0.5107,0.5075,0.5042,0.501,0.4978,0.4945,0.4913,0.488,0.4848,0.4815,0.4783,0.475,0.4717,0.4685,0.4652,0.462,0.4588,0.4558,0.4528,0.4501,0.4477,0.4456,0.4441,0.4431,0.4427,0.4431,0.444,0.4455,0.4475,0.4497,0.452,0.4543], x1: [0.2996,0.3023,0.3051,0.3081,0.3109,0.3136,0.3162,0.3185,0.3207,0.3226,0.3243,0.3259,0.3273,0.3286,0.3298,0.3309,0.3318,0.3327,0.3335,0.3342,0.3348,0.3353,0.3358,0.3363,0.3367,0.3371,0.3374,0.3377,0.338,0.3382,0.3384,0.3386,0.3387,0.3388,0.3389,0.3389,0.339,0.339,0.3391,0.3391,0.3391,0.3392,0.3393,0.3393,0.3394,0.3394,0.3393,0.3392,0.3389,0.3385,0.3379,0.3369,0.3356,0.3339,0.3318,0.3291,0.326,0.3224,0.3184,0.3139,0.3091,0.304,0.2988,0.2934,0.2879,0.2823,0.2768,0.2712,0.2655,0.2599,0.2543,0.2487,0.2431,0.2375,0.2319,0.2263,0.2207,0.2151,0.2095,0.2039,0.1983,0.1927,0.1872,0.1817,0.1762,0.1709,0.1657,0.1607,0.156,0.1516,0.1476,0.1441,0.1411,0.1385,0.1365,0.1349,0.1338,0.133,0.1324,0.1321,0.1319,0.1319,0.1319,0.132,0.132,0.1321,0.1323,0.1324,0.1325,0.1327,0.1328,0.133,0.1332,0.1335,0.1337,0.134,0.1343,0.1346,0.135,0.1354,0.1357,0.1361,0.1365,0.137,0.1374,0.1378,0.1382,0.1386,0.139,0.1394,0.1398,0.1403,0.1407,0.1412,0.1418,0.1424,0.143,0.1436,0.1443,0.145,0.1456,0.1462,0.1468,0.1472,0.1476,0.1479,0.1481,0.1482,0.1482,0.1481,0.1478,0.1475,0.1471,0.1466,0.146,0.1452,0.1445,0.1436,0.1427,0.1417,0.1407,0.1396,0.1386,0.1375,0.1364,0.1353,0.1341,0.133,0.1318,0.1306,0.1294,0.1282,0.1269,0.1257,0.1244,0.123,0.1217,0.1203,0.1189,0.1175,0.116,0.1145,0.113,0.1115,0.1099,0.1083,0.1067,0.1051,0.1035,0.1019,0.1004,0.0988,0.0973,0.0959,0.0945,0.0932,0.0919,0.0907,0.0896,0.0885,0.0875,0.0865,0.0855,0.0846,0.0838,0.083,0.0822,0.0815,0.0808,0.0801,0.0794,0.0788,0.0782,0.0777,0.0772,0.0768,0.0764,0.076,0.0757,0.0754,0.0751,0.0748,0.0745,0.0743,0.074,0.0738,0.0735,0.0733,0.0731,0.0728,0.0726,0.0724,0.0723,0.0721,0.0721,0.072,0.0721,0.0723,0.0725,0.0729,0.0733,0.0739,0.0745,0.0752,0.0759,0.0766,0.0773,0.0779,0.0784,0.0789], y1: [0.4468,0.4459,0.4451,0.4444,0.444,0.4438,0.4438,0.4441,0.4446,0.4453,0.4461,0.447,0.448,0.449,0.45,0.451,0.4519,0.4528,0.4537,0.4545,0.4552,0.4559,0.4566,0.4572,0.4577,0.4582,0.4587,0.4591,0.4594,0.4598,0.46,0.4603,0.4606,0.4608,0.461,0.4612,0.4613,0.4614,0.4616,0.4617,0.4618,0.4618,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.462,0.4621,0.4624,0.4628,0.4634,0.4643,0.4655,0.467,0.469,0.4713,0.4741,0.4772,0.4806,0.4843,0.4882,0.4923,0.4965,0.5007,0.505,0.5094,0.5138,0.5181,0.5225,0.5269,0.5313,0.5357,0.5401,0.5445,0.5489,0.5532,0.5576,0.5619,0.5662,0.5703,0.5744,0.5783,0.582,0.5854,0.5884,0.5911,0.5933,0.5952,0.5965,0.5975,0.598,0.5983,0.5982,0.5979,0.5975,0.5969,0.5962,0.5955,0.5948,0.594,0.5933,0.5925,0.5918,0.591,0.5903,0.5896,0.5889,0.5882,0.5875,0.5868,0.5861,0.5854,0.5848,0.5841,0.5835,0.5828,0.5822,0.5816,0.581,0.5805,0.58,0.5795,0.579,0.5785,0.5781,0.5777,0.5773,0.5768,0.5763,0.5759,0.5754,0.5748,0.5743,0.5737,0.5732,0.5727,0.5722,0.5718,0.5714,0.5711,0.5709,0.5707,0.5707,0.5707,0.5708,0.571,0.5712,0.5716,0.572,0.5726,0.5731,0.5738,0.5745,0.5752,0.576,0.5767,0.5775,0.5782,0.579,0.5797,0.5804,0.581,0.5816,0.5822,0.5827,0.5831,0.5835,0.5838,0.584,0.5842,0.5843,0.5844,0.5843,0.5842,0.584,0.5837,0.5833,0.5828,0.5821,0.5813,0.5804,0.5794,0.5782,0.5768,0.5753,0.5737,0.5719,0.57,0.568,0.5659,0.5637,0.5613,0.5589,0.5564,0.5538,0.5512,0.5484,0.5457,0.5429,0.54,0.5372,0.5343,0.5314,0.5285,0.5256,0.5227,0.5198,0.5168,0.5139,0.5109,0.5079,0.5049,0.5019,0.4989,0.4958,0.4928,0.4897,0.4867,0.4836,0.4806,0.4775,0.4745,0.4714,0.4684,0.4653,0.4623,0.4593,0.4563,0.4533,0.4504,0.4477,0.4451,0.4427,0.4406,0.439,0.4379,0.4374,0.4375,0.4384,0.4399,0.4419,0.4444,0.4472,0.45,0.4527], x2: [0.3908,0.3964,0.4021,0.4079,0.4134,0.4186,0.4233,0.4276,0.4313,0.4346,0.4374,0.4399,0.4421,0.4441,0.4459,0.4474,0.4489,0.4502,0.4513,0.4524,0.4534,0.4542,0.455,0.4557,0.4563,0.4569,0.4574,0.4579,0.4583,0.4587,0.459,0.4592,0.4594,0.4596,0.4597,0.4598,0.4599,0.4599,0.46,0.46,0.46,0.46,0.46,0.46,0.4599,0.4599,0.4598,0.4597,0.4595,0.4592,0.4587,0.4581,0.4572,0.456,0.4544,0.4525,0.4501,0.4473,0.4441,0.4406,0.4367,0.4325,0.4281,0.4235,0.4188,0.414,0.4091,0.4042,0.3992,0.3943,0.3893,0.3844,0.3794,0.3744,0.3694,0.3645,0.3595,0.3545,0.3496,0.3446,0.3397,0.3347,0.3298,0.325,0.3202,0.3155,0.311,0.3067,0.3026,0.2989,0.2956,0.2927,0.2902,0.2882,0.2867,0.2855,0.2848,0.2843,0.2841,0.2841,0.2842,0.2844,0.2847,0.285,0.2854,0.2857,0.2861,0.2864,0.2868,0.2871,0.2874,0.2878,0.2881,0.2885,0.2889,0.2892,0.2896,0.29,0.2904,0.2908,0.2912,0.2915,0.2919,0.2921,0.2923,0.2924,0.2924,0.2923,0.2922,0.2921,0.292,0.2919,0.2919,0.2919,0.2921,0.2923,0.2926,0.2929,0.2933,0.2937,0.2939,0.2941,0.2941,0.2939,0.2935,0.2929,0.2919,0.2907,0.2892,0.2874,0.2853,0.2829,0.2803,0.2775,0.2745,0.2714,0.2682,0.2649,0.2617,0.2584,0.2552,0.2521,0.2491,0.2463,0.2435,0.2408,0.2382,0.2356,0.2332,0.2307,0.2284,0.2261,0.2238,0.2215,0.2192,0.217,0.2147,0.2125,0.2102,0.2079,0.2056,0.2033,0.2009,0.1985,0.1962,0.1938,0.1914,0.189,0.1866,0.1843,0.182,0.1798,0.1776,0.1755,0.1735,0.1715,0.1696,0.1677,0.1659,0.1642,0.1626,0.1611,0.1596,0.1582,0.1569,0.1556,0.1543,0.1531,0.1519,0.1508,0.1497,0.1486,0.1476,0.1467,0.1458,0.145,0.1442,0.1435,0.1429,0.1424,0.1419,0.1415,0.1412,0.1409,0.1407,0.1405,0.1404,0.1404,0.1404,0.1404,0.1405,0.1406,0.1407,0.1409,0.141,0.1412,0.1414,0.1416,0.1418,0.142,0.1422,0.1425,0.1428,0.1431,0.1435,0.1439,0.1444,0.1448,0.1452,0.1456], y2: [0.4299,0.431,0.4323,0.4337,0.4352,0.4368,0.4384,0.44,0.4416,0.4432,0.4446,0.4461,0.4474,0.4486,0.4498,0.4509,0.4519,0.4529,0.4537,0.4545,0.4553,0.456,0.4566,0.4572,0.4577,0.4582,0.4587,0.4591,0.4594,0.4598,0.46,0.4603,0.4606,0.4608,0.461,0.4612,0.4613,0.4614,0.4616,0.4617,0.4618,0.4618,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4618,0.4618,0.4617,0.4616,0.4615,0.4614,0.4613,0.4612,0.4612,0.4611,0.461,0.4609,0.4609,0.4608,0.4607,0.4607,0.4606,0.4606,0.4605,0.4605,0.4604,0.4603,0.4603,0.4602,0.4602,0.4601,0.46,0.46,0.4599,0.4598,0.4598,0.4597,0.4597,0.4596,0.4595,0.4594,0.4594,0.4593,0.4591,0.459,0.4588,0.4586,0.4584,0.4581,0.4578,0.4575,0.4571,0.4567,0.4564,0.456,0.4556,0.4553,0.4549,0.4545,0.4542,0.4538,0.4534,0.453,0.4526,0.4522,0.4519,0.4515,0.4511,0.4507,0.4504,0.45,0.4497,0.4494,0.4491,0.4488,0.4486,0.4484,0.4482,0.448,0.4478,0.4476,0.4475,0.4473,0.4471,0.4469,0.4466,0.4464,0.4461,0.4458,0.4456,0.4453,0.445,0.4447,0.4445,0.4443,0.444,0.4438,0.4436,0.4434,0.4432,0.4431,0.4429,0.4428,0.4427,0.4426,0.4426,0.4427,0.4429,0.4433,0.4437,0.4444,0.4453,0.4464,0.4477,0.4492,0.451,0.4529,0.455,0.4572,0.4596,0.4621,0.4646,0.4672,0.4698,0.4725,0.4751,0.4778,0.4804,0.4829,0.4855,0.488,0.4904,0.4927,0.495,0.4972,0.4993,0.5013,0.5031,0.5048,0.5063,0.5077,0.5089,0.5099,0.5108,0.5114,0.5119,0.5122,0.5123,0.5123,0.512,0.5116,0.511,0.5102,0.5092,0.508,0.5067,0.5052,0.5035,0.5017,0.4998,0.4977,0.4955,0.4933,0.4909,0.4885,0.486,0.4835,0.4809,0.4783,0.4756,0.4729,0.4702,0.4675,0.4647,0.462,0.4592,0.4565,0.4539,0.4514,0.4489,0.4466,0.4444,0.4424,0.4407,0.4391,0.4378,0.4367,0.4358,0.4352,0.4347,0.4345,0.4346,0.4348,0.4352,0.4359,0.4367,0.4378,0.439,0.4403,0.4418,0.4433,0.4448,0.4462,0.4474,0.4485,0.4495], x3: [0.4866,0.4944,0.5023,0.5102,0.5179,0.525,0.5314,0.5372,0.5423,0.5467,0.5505,0.5539,0.5569,0.5595,0.5618,0.5639,0.5659,0.5676,0.5691,0.5706,0.5718,0.573,0.5741,0.575,0.5759,0.5766,0.5773,0.578,0.5785,0.579,0.5794,0.5798,0.5801,0.5804,0.5805,0.5807,0.5808,0.5809,0.5809,0.581,0.581,0.581,0.581,0.581,0.581,0.5809,0.5809,0.5808,0.5807,0.5805,0.5802,0.5798,0.5793,0.5787,0.5779,0.5769,0.5758,0.5744,0.5728,0.5711,0.5692,0.5671,0.5649,0.5627,0.5603,0.5579,0.5555,0.5531,0.5506,0.5481,0.5457,0.5432,0.5407,0.5382,0.5357,0.5332,0.5308,0.5283,0.5258,0.5233,0.5208,0.5184,0.5159,0.5135,0.5111,0.5088,0.5066,0.5045,0.5025,0.5007,0.4991,0.4977,0.4966,0.4957,0.495,0.4945,0.4941,0.4939,0.4939,0.4939,0.494,0.4942,0.4944,0.4946,0.4948,0.4951,0.4953,0.4956,0.4958,0.4961,0.4963,0.4966,0.4968,0.4971,0.4973,0.4976,0.4979,0.4982,0.4985,0.4987,0.499,0.4991,0.4993,0.4993,0.4992,0.4989,0.4986,0.4981,0.4975,0.4969,0.4963,0.4957,0.4952,0.4949,0.4947,0.4946,0.4947,0.4948,0.4949,0.495,0.495,0.4948,0.4944,0.4937,0.4927,0.4912,0.4893,0.487,0.4842,0.4809,0.4772,0.473,0.4684,0.4634,0.458,0.4523,0.4464,0.4402,0.4338,0.4273,0.4208,0.4142,0.4076,0.401,0.3944,0.3879,0.3814,0.375,0.3686,0.3623,0.356,0.3498,0.3437,0.3376,0.3316,0.3256,0.3197,0.3138,0.308,0.3023,0.2967,0.2911,0.2857,0.2803,0.2752,0.2701,0.2653,0.2606,0.2562,0.252,0.248,0.2442,0.2408,0.2375,0.2345,0.2318,0.2293,0.227,0.2249,0.223,0.2212,0.2197,0.2183,0.2171,0.216,0.215,0.2141,0.2133,0.2126,0.212,0.2115,0.2111,0.2107,0.2104,0.2103,0.2102,0.2102,0.2102,0.2103,0.2105,0.2107,0.2109,0.2112,0.2114,0.2117,0.2119,0.2122,0.2124,0.2125,0.2127,0.2127,0.2128,0.2128,0.2128,0.2128,0.2127,0.2126,0.2125,0.2123,0.212,0.2118,0.2115,0.2112,0.2108,0.2105,0.2102,0.2099,0.2097,0.2095,0.2094], y3: [0.4288,0.43,0.4313,0.4328,0.4344,0.436,0.4377,0.4395,0.4411,0.4428,0.4443,0.4458,0.4472,0.4485,0.4497,0.4508,0.4519,0.4528,0.4537,0.4545,0.4553,0.456,0.4566,0.4572,0.4577,0.4582,0.4587,0.4591,0.4594,0.4598,0.46,0.4603,0.4606,0.4608,0.461,0.4612,0.4613,0.4614,0.4616,0.4617,0.4618,0.4618,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4619,0.4618,0.4618,0.4617,0.4616,0.4615,0.4614,0.4613,0.4611,0.461,0.4609,0.4607,0.4606,0.4604,0.4602,0.4601,0.4599,0.4597,0.4595,0.4593,0.4591,0.4589,0.4587,0.4585,0.4582,0.458,0.4578,0.4576,0.4574,0.4572,0.457,0.4568,0.4565,0.4563,0.4561,0.4559,0.4557,0.4555,0.4553,0.455,0.4548,0.4546,0.4544,0.4541,0.4539,0.4536,0.4534,0.4531,0.4529,0.4526,0.4524,0.4522,0.4519,0.4517,0.4515,0.4512,0.451,0.4508,0.4506,0.4504,0.4502,0.45,0.4498,0.4495,0.4493,0.4491,0.4489,0.4487,0.4485,0.4482,0.448,0.4478,0.4476,0.4474,0.4472,0.447,0.4468,0.4466,0.4464,0.4462,0.446,0.4458,0.4456,0.4454,0.4452,0.445,0.4448,0.4446,0.4444,0.4442,0.444,0.4438,0.4435,0.4433,0.4431,0.4429,0.4427,0.4425,0.4422,0.442,0.4418,0.4416,0.4414,0.4412,0.441,0.4408,0.4406,0.4404,0.4402,0.44,0.4398,0.4396,0.4394,0.4392,0.439,0.4388,0.4386,0.4384,0.4382,0.438,0.4378,0.4376,0.4374,0.4372,0.437,0.4368,0.4366,0.4364,0.4362,0.436,0.4358,0.4356,0.4355,0.4354,0.4353,0.4353,0.4353,0.4354,0.4355,0.4357,0.4359,0.4362,0.4365,0.4368,0.4372,0.4376,0.4379,0.4382,0.4385,0.4387,0.4387,0.4387,0.4386,0.4384,0.438,0.4376,0.4372,0.4367,0.4362,0.4357,0.4353,0.4349,0.4345,0.4342,0.4339,0.4337,0.4335,0.4333,0.4332,0.4332,0.4331,0.4331,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433,0.433], x4: [0.5798,0.5893,0.5991,0.6088,0.6182,0.6269,0.6348,0.6419,0.6481,0.6535,0.6583,0.6624,0.6661,0.6693,0.6723,0.6749,0.6773,0.6795,0.6815,0.6833,0.6849,0.6864,0.6878,0.689,0.6901,0.6911,0.6919,0.6927,0.6933,0.6939,0.6944,0.6948,0.6951,0.6954,0.6956,0.6957,0.6958,0.6959,0.6959,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.6961,0.6961,0.6961,0.6961,0.6961,0.6961,0.6961,0.696,0.6959,0.6957,0.6955,0.6953,0.695,0.6948,0.6945,0.6944,0.6943,0.6943,0.6945,0.6946,0.6949,0.6951,0.6954,0.6957,0.696,0.6961,0.6963,0.6964,0.6964,0.6964,0.6964,0.6963,0.6963,0.6962,0.6962,0.6961,0.6961,0.6961,0.696,0.696,0.6961,0.6961,0.6961,0.6962,0.6962,0.6963,0.6964,0.6965,0.6965,0.6966,0.6967,0.6968,0.6968,0.6969,0.6969,0.697,0.697,0.697,0.697,0.697,0.697,0.697,0.6969,0.6969,0.6968,0.6966,0.6965,0.6962,0.6959,0.6956,0.6952,0.6949,0.6945,0.6941,0.6938,0.6936,0.6934,0.6933,0.6932,0.693,0.6929,0.6925,0.692,0.6913,0.6901,0.6886,0.6865,0.6839,0.6806,0.6767,0.6721,0.6669,0.661,0.6546,0.6476,0.6402,0.6325,0.6244,0.616,0.6075,0.5988,0.59,0.5812,0.5723,0.5634,0.5545,0.5457,0.5368,0.528,0.5193,0.5106,0.5019,0.4933,0.4847,0.4762,0.4678,0.4594,0.4511,0.4428,0.4346,0.4266,0.4186,0.4107,0.403,0.3954,0.388,0.3807,0.3737,0.3669,0.3604,0.3541,0.3481,0.3423,0.3369,0.3317,0.3269,0.3223,0.318,0.314,0.3103,0.3068,0.3036,0.3007,0.298,0.2955,0.2933,0.2912,0.2894,0.2877,0.2862,0.2848,0.2836,0.2824,0.2815,0.2806,0.2799,0.2792,0.2787,0.2783,0.2779,0.2777,0.2774,0.2773,0.2772,0.2771,0.277,0.277,0.277,0.2769,0.2768,0.2768,0.2767,0.2766,0.2765,0.2765,0.2764,0.2763,0.2762,0.2762,0.2761,0.2761,0.276,0.276,0.276,0.276,0.276,0.276,0.276,0.276,0.276,0.276,0.276], y4: [0.4191,0.4195,0.4201,0.4208,0.4217,0.4227,0.4237,0.4249,0.4261,0.4274,0.4287,0.4299,0.4311,0.4322,0.4333,0.4342,0.4352,0.436,0.4368,0.4375,0.4382,0.4388,0.4393,0.4398,0.4403,0.4407,0.441,0.4414,0.4417,0.4419,0.4422,0.4424,0.4426,0.4428,0.443,0.4432,0.4434,0.4435,0.4437,0.4438,0.4438,0.4439,0.4439,0.444,0.444,0.444,0.444,0.444,0.444,0.444,0.444,0.444,0.444,0.4439,0.4439,0.4438,0.4437,0.4435,0.4434,0.4431,0.4428,0.4425,0.4422,0.4418,0.4416,0.4414,0.4413,0.4413,0.4415,0.4418,0.4421,0.4425,0.4427,0.4429,0.4429,0.4427,0.4424,0.4419,0.4413,0.4405,0.4398,0.439,0.4383,0.4376,0.4371,0.4366,0.4361,0.4358,0.4355,0.4352,0.4349,0.4347,0.4344,0.4342,0.434,0.4337,0.4335,0.4332,0.433,0.4327,0.4324,0.4321,0.4317,0.4314,0.431,0.4306,0.4302,0.4298,0.4294,0.4289,0.4285,0.4281,0.4276,0.4272,0.4267,0.4263,0.4258,0.4254,0.4249,0.4245,0.4242,0.4239,0.4237,0.4236,0.4237,0.424,0.4244,0.425,0.4257,0.4265,0.4274,0.4281,0.4288,0.4293,0.4296,0.4297,0.4296,0.4294,0.429,0.4285,0.4279,0.4272,0.4264,0.4256,0.4248,0.4239,0.423,0.422,0.421,0.42,0.419,0.4181,0.4172,0.4164,0.4157,0.4152,0.4148,0.4145,0.4144,0.4143,0.4144,0.4145,0.4147,0.4148,0.4149,0.415,0.415,0.415,0.4149,0.4147,0.4145,0.4142,0.4138,0.4134,0.413,0.4126,0.4123,0.4119,0.4116,0.4113,0.4111,0.411,0.4109,0.4108,0.4108,0.4108,0.4109,0.4109,0.4109,0.411,0.411,0.411,0.411,0.411,0.411,0.411,0.4109,0.4109,0.4108,0.4107,0.4106,0.4105,0.4104,0.4102,0.41,0.4099,0.4098,0.4097,0.4096,0.4096,0.4095,0.4096,0.4096,0.4096,0.4097,0.4097,0.4097,0.4097,0.4097,0.4097,0.4096,0.4096,0.4095,0.4095,0.4094,0.4094,0.4095,0.4095,0.4095,0.4096,0.4097,0.4098,0.4099,0.41,0.4101,0.4102,0.4103,0.4104,0.4105,0.4106,0.4107,0.4108,0.4108,0.4109,0.4109,0.411,0.411,0.411,0.411,0.411], x5: [0.6162,0.6185,0.6212,0.6246,0.6284,0.6326,0.6371,0.6418,0.6466,0.6513,0.6558,0.6601,0.664,0.6676,0.6708,0.6737,0.6762,0.6785,0.6806,0.6825,0.6842,0.6858,0.6872,0.6884,0.6895,0.6906,0.6914,0.6922,0.6929,0.6935,0.694,0.6945,0.6948,0.6951,0.6953,0.6955,0.6957,0.6958,0.6958,0.6959,0.6959,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.696,0.6961,0.6961,0.6961,0.6961,0.696,0.696,0.6959,0.6958,0.6957,0.6956,0.6954,0.6952,0.6951,0.6949,0.6948,0.6947,0.6946,0.6947,0.6947,0.6949,0.695,0.6952,0.6954,0.6956,0.6958,0.696,0.6961,0.6962,0.6962,0.6963,0.6963,0.6963,0.6962,0.6962,0.6962,0.6961,0.6961,0.6961,0.6961,0.6961,0.6961,0.6961,0.6962,0.6962,0.6963,0.6963,0.6964,0.6965,0.6965,0.6966,0.6967,0.6967,0.6968,0.6968,0.6969,0.6969,0.6969,0.6969,0.6969,0.6969,0.6969,0.6969,0.6968,0.6967,0.6966,0.6964,0.6963,0.696,0.6958,0.6955,0.6952,0.6949,0.6946,0.6943,0.694,0.6938,0.6935,0.6933,0.693,0.6926,0.6922,0.6916,0.6907,0.6896,0.6881,0.6861,0.6835,0.6805,0.6767,0.6724,0.6675,0.6621,0.6561,0.6497,0.643,0.6359,0.6285,0.621,0.6132,0.6053,0.5973,0.5892,0.581,0.5727,0.5643,0.5559,0.5474,0.5389,0.5304,0.5219,0.5134,0.5049,0.4964,0.488,0.4797,0.4714,0.4632,0.455,0.447,0.4391,0.4313,0.4236,0.4161,0.4087,0.4015,0.3944,0.3876,0.3809,0.3745,0.3683,0.3623,0.3565,0.351,0.3457,0.3407,0.3359,0.3313,0.3271,0.323,0.3192,0.3156,0.3123,0.3092,0.3063,0.3037,0.3012,0.299,0.297,0.2952,0.2936,0.2922,0.2911,0.2901,0.2894,0.2888,0.2886,0.2885,0.2887,0.2892,0.2899,0.2909,0.2921,0.2935,0.2952,0.297,0.2991,0.3012,0.3034,0.3057,0.3081,0.3103,0.3126,0.3147,0.3167,0.3185,0.3202,0.3217,0.323,0.3242,0.3252,0.326,0.3267,0.3273,0.3278,0.3281,0.3284,0.3287,0.3289,0.329,0.3291,0.3292,0.3292], y5: [0.1628,0.1666,0.1719,0.1785,0.1863,0.1951,0.2043,0.2136,0.2223,0.23,0.2365,0.2416,0.2454,0.2482,0.25,0.2513,0.2521,0.2527,0.2532,0.2536,0.254,0.2543,0.2546,0.2548,0.255,0.2552,0.2554,0.2556,0.2558,0.2559,0.256,0.2562,0.2563,0.2564,0.2565,0.2566,0.2567,0.2567,0.2568,0.2568,0.2569,0.2569,0.2569,0.257,0.257,0.257,0.257,0.257,0.257,0.257,0.257,0.257,0.2569,0.2569,0.2569,0.2568,0.2568,0.2567,0.2566,0.2565,0.2564,0.2562,0.2561,0.256,0.2559,0.2559,0.2559,0.2559,0.2559,0.256,0.256,0.2561,0.2562,0.2562,0.2561,0.256,0.2559,0.2557,0.2555,0.2552,0.2549,0.2546,0.2542,0.2539,0.2537,0.2534,0.2532,0.253,0.2528,0.2526,0.2525,0.2524,0.2522,0.2521,0.252,0.2519,0.2517,0.2516,0.2514,0.2513,0.2512,0.251,0.2508,0.2506,0.2505,0.2503,0.2501,0.2499,0.2497,0.2495,0.2492,0.249,0.2488,0.2486,0.2484,0.2482,0.2479,0.2477,0.2476,0.2474,0.2473,0.2472,0.2471,0.2471,0.2472,0.2473,0.2475,0.2477,0.248,0.2483,0.2486,0.2489,0.2491,0.2493,0.2494,0.2495,0.2495,0.2494,0.2492,0.2489,0.2484,0.2477,0.2466,0.245,0.2428,0.2398,0.236,0.2314,0.226,0.2202,0.2139,0.2074,0.2009,0.1945,0.1885,0.183,0.1784,0.1749,0.1726,0.1718,0.1723,0.174,0.1769,0.1805,0.1848,0.1894,0.1942,0.1991,0.2038,0.2084,0.2127,0.2166,0.2202,0.2234,0.2261,0.2285,0.2305,0.2321,0.2334,0.2345,0.2353,0.236,0.2366,0.2371,0.2376,0.238,0.2384,0.2389,0.2394,0.2398,0.2403,0.2408,0.2411,0.2415,0.2417,0.2417,0.2417,0.2414,0.2409,0.2403,0.2394,0.2384,0.2372,0.2358,0.2342,0.2326,0.2308,0.229,0.2272,0.2254,0.2235,0.2217,0.2199,0.2181,0.2164,0.2146,0.2128,0.2111,0.2093,0.2074,0.2056,0.2036,0.2017,0.1998,0.1979,0.196,0.1942,0.1924,0.1908,0.1894,0.1881,0.187,0.1861,0.1854,0.1849,0.1845,0.1844,0.1844,0.1846,0.1849,0.1853,0.1858,0.1863,0.1869,0.1875,0.188,0.1886,0.1891,0.1895,0.1898], x6: [0.5687,0.5716,0.5754,0.5803,0.5861,0.5928,0.6001,0.6079,0.6156,0.6232,0.6301,0.6363,0.6417,0.6463,0.6501,0.6533,0.6561,0.6585,0.6606,0.6625,0.6642,0.6658,0.6672,0.6684,0.6695,0.6706,0.6714,0.6722,0.6729,0.6735,0.674,0.6745,0.6748,0.6751,0.6753,0.6755,0.6757,0.6758,0.6758,0.6759,0.6759,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.676,0.6761,0.6761,0.6761,0.6761,0.676,0.676,0.6759,0.6758,0.6757,0.6756,0.6754,0.6752,0.6751,0.6749,0.6748,0.6747,0.6746,0.6747,0.6747,0.6749,0.675,0.6752,0.6754,0.6756,0.6758,0.676,0.6761,0.6762,0.6762,0.6763,0.6763,0.6763,0.6762,0.6762,0.6762,0.6761,0.6761,0.6761,0.6761,0.6761,0.6761,0.6761,0.6762,0.6762,0.6763,0.6763,0.6764,0.6765,0.6765,0.6766,0.6767,0.6767,0.6768,0.6768,0.6769,0.6769,0.6769,0.6769,0.6769,0.6769,0.6769,0.6769,0.6768,0.6767,0.6766,0.6764,0.6763,0.676,0.6758,0.6755,0.6752,0.6749,0.6746,0.6743,0.674,0.6738,0.6735,0.6733,0.673,0.6726,0.6722,0.6715,0.6706,0.6694,0.6676,0.6653,0.6622,0.6584,0.6538,0.6485,0.6423,0.6356,0.6283,0.6205,0.6123,0.6038,0.5951,0.5863,0.5773,0.5684,0.5594,0.5506,0.5418,0.5332,0.5246,0.516,0.5075,0.4989,0.4904,0.4819,0.4734,0.4649,0.4564,0.448,0.4397,0.4314,0.4232,0.415,0.407,0.3991,0.3913,0.3836,0.3761,0.3688,0.3616,0.3546,0.3479,0.3414,0.3351,0.3291,0.3234,0.3181,0.313,0.3084,0.3041,0.3002,0.2967,0.2936,0.291,0.2888,0.287,0.2856,0.2847,0.284,0.2838,0.2838,0.2841,0.2845,0.2852,0.286,0.2868,0.2877,0.2885,0.2893,0.29,0.2905,0.291,0.2912,0.2913,0.2912,0.2909,0.2905,0.2899,0.2891,0.2882,0.2872,0.2861,0.2849,0.2837,0.2824,0.2811,0.2799,0.2786,0.2774,0.2763,0.2753,0.2743,0.2734,0.2726,0.2719,0.2713,0.2707,0.2703,0.2699,0.2695,0.2692,0.269,0.2688,0.2687,0.2685,0.2684,0.2684], y6: [0.0907,0.0907,0.0904,0.0898,0.0887,0.0871,0.085,0.0826,0.0801,0.0777,0.0755,0.0737,0.0723,0.0713,0.0707,0.0703,0.0702,0.0701,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.07,0.0701,0.0702,0.0704,0.0707,0.0712,0.0721,0.0732,0.0746,0.0764,0.0785,0.0808,0.0832,0.0859,0.0887,0.0916,0.0947,0.0978,0.1011,0.1043,0.1075,0.1105,0.1134,0.1161,0.1188,0.1214,0.1241,0.1268,0.1295,0.1323,0.1352,0.1381,0.141,0.144,0.1469,0.1499,0.1528,0.1557,0.1586,0.1614,0.1641,0.1668,0.1694,0.1719,0.1743,0.1766,0.1788,0.1808,0.1827,0.1844,0.1859,0.1873,0.1884,0.1893,0.19,0.1904,0.1905,0.1902,0.1897,0.1887,0.1875,0.1858,0.1838,0.1814,0.1787,0.1758,0.1727,0.1694,0.166,0.1625,0.1592,0.1559,0.1527,0.1498,0.1471,0.1445,0.1422,0.1402,0.1382,0.1365,0.1348,0.1333,0.1317,0.1302,0.1287,0.1272,0.1257,0.1241,0.1225,0.1209,0.1193,0.1177,0.1162,0.1147,0.1133,0.1121,0.1109,0.1098,0.1089,0.1081,0.1073,0.1067,0.1062,0.1057,0.1053,0.105,0.1047,0.1045,0.1043,0.1041,0.104,0.1039], x7: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], y7: [0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05] };
  const sec88 = measuredSecs(F88NZ, F88A, F88BZ, F88B);
  const sk = sweptSkin(car, addPanel, add, PAINT, {
    nose: sec88.nose,
    body: { z: F88BZ, yb: 0.05 },
    secA: sec88.secA, secB: sec88.secB, rows: [100, 250], weld: true,
    open: [[1.6, 0], [1.294, 0], [1.251, 0.06], [1.208, 0.076], [1.165, 0.089], [1.122, 0.102], [1.078, 0], [1.035, 0.157], [0.992, 0.171], [0.949, 0.19], [0.906, 0.2], [0.863, 0.208], [0.82, 0.214], [0.8, 0.219], [0.763, 0.22], [0.725, 0.223], [0.688, 0.225], [0.651, 0.226], [0.614, 0.227], [0.576, 0.227], [0.539, 0.227], [0.502, 0.227], [0.464, 0.227], [0.427, 0.227], [0.39, 0.227], [0.353, 0.225], [0.315, 0.219], [0.278, 0.187], [0.241, 0.132], [0.203, 0.063], [0.166, 0], [-0.6, 0]], RIM: 0.5,
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
      const z = 0.78 - i / 70 * 2.16, u = sk.upper(z).slice(3 * S, 6 * S + 1), ey = edgeY(z);
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
  // (all of him, the seat and the cockpit's bits sat further forward, as the real car has him: DZ)
  const DZ = F88_DRIVER_DZ;
  add(box(0.34, 0.05, 0.36, 0, 0.1, 0.1 + DZ), MAT.seat, false);
  add(box(0.36, 0.42, 0.05, 0, 0.3, -0.07 + DZ, -0.32), MAT.seat, false);
  for (const sx of [1, -1]) add(box(0.04, 0.16, 0.36, sx * 0.17, 0.18, 0.08 + DZ), MAT.seat, false);
  // his legs, forward and a little raised, under the scuttle (always there)
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.18, 0.02 + DZ], [sx * 0.09, 0.28, 0.55 + DZ], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.28, 0.55 + DZ], [sx * 0.07, 0.2, 1.0 + DZ], 0.045), MAT.suit, false);
  }
  // his body, arms and a wheel (the computer drivers' and the Garage's cars;
  // the player's car has its own moving ones in the cockpit, so the game hides this)
  const driver = new THREE.Group(); driver.position.set(0, -0.02, DZ);
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.46, -0.02), MAT.suit);
  for (const sx of [1, -1]) {
    dAdd(rod([sx * 0.17, 0.49, 0], [sx * 0.15, 0.4, 0.22], 0.04), MAT.suit);
    dAdd(rod([sx * 0.15, 0.4, 0.22], [sx * 0.12, 0.5, 0.4], 0.035), MAT.suit);
  }
  dAdd(new THREE.TorusGeometry(0.13, 0.016, 6, 20).rotateX(-0.45).translate(0, 0.52, 0.44), MAT.carbon);
  // the little smoked screen at the front of the opening
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10, 1, true, -0.9, 1.8).rotateX(-0.35).translate(0, 0.57, 1.15), MAT.glass, false);
  // the driver: a helmet with a dark visor, his shoulders just below the rim
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.645, -0.06 + DZ), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.645, -0.06 + DZ), MAT.visor);
  // (a red and white helmet stripe)
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.645, -0.06 + DZ), MAT.blue);
  // mirrors: pods on stalks at the cockpit sides (each pod can be knocked
  // off, leaving its stalk; the pit crew fit a new one)
  const mirrors = {};
  for (const s of [1, -1]) {
    const mz = 0.9;
    const stalk = add(rod([s * 0.3, 0.5, mz - 0.01], [s * 0.42, 0.6, mz], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: mz + 0.03, w: 0.12, h: 0.065, y: 0.585, x: s * 0.45 }, { z: mz - 0.03, w: 0.13, h: 0.072, y: 0.582, x: s * 0.45 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.105, 0.058).rotateY(Math.PI).translate(s * 0.45, 0.62, mz - 0.036), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.45, 0.62, mz] };
  }
  // --- the low engine cover rises over the roll hoop behind his head (part of the skin);
  // the roll hoop's little intake, dark, in its face
  add(new THREE.CircleGeometry(0.06, 20).scale(1.2, 0.8, 1).translate(0, 0.66, 0.13), MAT.dark, false);
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
    const red = '#d2111c', main = fitDecal('VESPERO', red), fuel = fitDecal('TORRIN', '#1a1c20');
    for (const sx of [1, -1]) {
      decalOnSkin(car, addPanel, sk, sk.secB, 0.42, -0.28, 4 * S + 2, 5 * S + 3, main, sx);        // (the white of the pod's side)
      decalOnSkin(car, addPanel, sk, sk.secA, 1.6, 1.0, 3 * S, 4 * S + 2, fuel, sx);               // (the nose's white side)
      decalOnSkin(car, addPanel, sk, sk.secB, -0.85, -1.15, 2 * S, 3 * S, fitDecal('VELTRIS', '#ffffff', { name: false }), sx);   // (small ones on the cover)
      decalOnSkin(car, addPanel, sk, sk.secB, 0.55, 0.36, S, 2 * S - 1, fitDecal('KORVANE', '#ffffff', { name: false }), sx);     // (and by the cockpit)
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

// SHARED SHADING across separate pieces of one surface: every vertex sitting
// at the same spot as others gets the average of their normals (only those
// within about 60 degrees of its own, so a real edge stays crisp)
function weldNormals(geos, minDot = 0.5) {
  const map = new Map(), q = (v) => Math.round(v * 2e4);
  geos.forEach((g) => {
    const p = g.attributes.position?.array, n = g.attributes.normal?.array; if (!p || !n) return;
    for (let i = 0; i < p.length; i += 3) { const k = q(p[i]) + ',' + q(p[i + 1]) + ',' + q(p[i + 2]); let l = map.get(k); if (!l) map.set(k, l = []); l.push([n, i]); }
  });
  for (const l of map.values()) {
    if (l.length < 2) continue;
    const own = l.map(([n, i]) => [n[i], n[i + 1], n[i + 2]]);
    l.forEach(([n, i], a) => {
      let x = 0, y = 0, z = 0;
      for (const o of own) if (o[0] * own[a][0] + o[1] * own[a][1] + o[2] * own[a][2] >= minDot) { x += o[0]; y += o[1]; z += o[2]; }
      const d = Math.hypot(x, y, z) || 1; n[i] = x / d; n[i + 1] = y / d; n[i + 2] = z / d;
    });
  }
  for (const g of geos) if (g.attributes.normal) g.attributes.normal.needsUpdate = true;
}

// MEASURED SECTIONS for sweptSkin: eight points a slice ({ x0..x7, y0..y7 }
// at each z, for the nose (A) and the body (B)), smoothed along the car. The
// cockpit's opening (o) is cut into the top. Gives sweptSkin its nose, secA, secB
function measuredSecs(NZ, A, BZ, B) {
  const curves = (zs, D) => { const c = {}; for (const k in D) c[k] = curveAny(zs.map((z, i) => [z, D[k][i]])); return c; };
  const cA = curves(NZ, A), cB = curves(BZ, B);
  const sec = (c) => (z, o = 0) => {
    const p = []; for (let k = 0; k < 8; k++) p.push([c['x' + k](z), c['y' + k](z)]);
    p[0][0] = o > 0.02 ? o : 0;
    p[1][0] = Math.max(p[1][0], p[0][0] + 0.02);
    p[7][0] = 0;
    return p;
  };
  const hw = A.x4.map((x, i) => Math.max(x, A.x5[i]));
  return { secA: sec(cA), secB: sec(cB), nose: { z: NZ, hw, yb: A.y7, yt: A.y0 } };
}

// =====================================================================
function sweptSkin(car, addPanel, add, PAINT, cfg) {
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  const N = cfg.nose, B = cfg.body, keys = (zs, v) => curveAny(zs.map((z, i) => [z, v[i]]));
  const hwA = keys(N.z, N.hw), ybA = keys(N.z, N.yb), ytA = keys(N.z, N.yt);
  const bk = (k) => (B[k] ? keys(B.z, B[k]) : () => 0);
  const yTop = bk('yTop'), CW = bk('CW'), xc = bk('xc'), yc = bk('yc'), xo = bk('xo'), yo = bk('yo');
  const ZJ = N.z[N.z.length - 1], ZB0 = B.z[0], ZB1 = B.z[B.z.length - 1], yFloor = B.yb ?? 0.11;
  const OWc = curveAny(cfg.open), oz = cfg.open.filter((p) => p[1] > 0).map((p) => p[0]), oFront = Math.max(...oz) + 0.035, oBack = Math.min(...oz) - 0.07;
  const OW = (z) => (z > oFront || z < oBack ? 0 : Math.max(0, OWc(z)));
  const RIM = cfg.RIM;
  const secA = cfg.secA ? (z) => cfg.secA(z, OW(z)) : (z) => {
    const hw = hwA(z), yb = ybA(z), yt = ytA(z), h = yt - yb, o = OW(z);
    return [[o, yt], [Math.max(o + 0.02, hw * 0.55), yt - 0.008], [hw * 0.86, yt - h * 0.12], [hw * 0.98, yt - h * 0.35], [hw, yb + h * 0.5], [hw * 0.96, yb + h * 0.2], [hw * 0.75, yb + 0.004], [0, yb]];
  };
  const secB = cfg.secB ? (z) => cfg.secB(z, OW(z)) : (z) => {
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
  const [nA, nB] = cfg.rows || [40, 64];
  for (let i = 0; i <= nA; i++) { const z = N.z[0] + (ZJ - N.z[0]) * i / nA; rowsA.push({ z, pts: sample(secA(z)) }); }
  for (let i = 0; i <= nB; i++) { const z = ZB0 + (ZB1 - ZB0) * i / nB; rowsB.push({ z, pts: sample(secB(z)) }); }
  const MX = cfg.mouthX, sheet = [];
  for (const s of [1, -1]) {
    for (const [rows, part] of [[rowsA, 'nose'], [rowsB, 'body'], [[rowsA[rowsA.length - 1], rowsB[0]], 'join']]) {
      const g = mirrorX(skin(rows, part), s); sheet.push(g);
      const m = new THREE.Mesh(g, PAINT); m.castShadow = true; m.receiveShadow = true; car.add(m); addPanel(m);
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
  // (one sheet: where the pieces meet (the two halves down the middle, the nose, the
  // join and the body), their shading is shared, so no seam shows; sharp edges stay sharp)
  if (cfg.weld) weldNormals(sheet, 0.5);
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
// (a sponsor to be drawn at the shape of the patch it ends up on: aspect = the patch's length / its height)
const fitDecal = (text, ink, opts) => (aspect) => sponsorDecal(text, ink, Math.round(256 * Math.min(8, Math.max(1, aspect))), 256, opts);
function decalOnSkin(car, addPanel, sk, secOf, z0, z1, k0, k1, mat, sx) {
  const pos = [], uv = [], idx = [], NZ = 16, NK = k1 - k0;
  if (typeof mat === 'function') {       // (drawn to the patch's own proportions, so nothing on it is stretched)
    const u = sk.sample(secOf((z0 + z1) / 2)); let arc = 0;
    for (let k = k0; k < k1; k++) arc += Math.hypot(u[k + 1][0] - u[k][0], u[k + 1][1] - u[k][1]);
    mat = mat(Math.abs(z1 - z0) / Math.max(0.01, arc));
  }
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
    // the main sponsor's name along the nose's blue top band, reading from the front back to its badge
    // (its picture drawn at the band's own length to width, so the letters keep their shape)
    { const hw = 0.065, z1 = 0.945, z0 = z1 + 1.144;        // (30% bigger than it was, ending right against the badge)
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

// how much further forward the TTF-20's driver sits than the older cars' (as on the real car)
export const F20_DRIVER_DZ = 0.58;
export function buildF20Body(car, addPanel) {
  // THE TTF-20: black all over, a field of small silver stars across the
  // engine cover and the pods, thickest at the back and fading out toward
  // the front; thin teal lines along the nose and the cover; a red star on
  // the halo. No sponsors (yet)
  const MAT = {
    blue: new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.3, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }),     // (the black paint)
    yellow: new THREE.MeshPhysicalMaterial({ color: 0x00a19b, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),  // (the teal)
    silver: new THREE.MeshPhysicalMaterial({ color: 0xb9bdc3, roughness: 0.25, metalness: 0.8, clearcoat: 1 }),
    red: new THREE.MeshPhysicalMaterial({ color: 0xd2141e, roughness: 0.3, clearcoat: 1 }),
    carbon: new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.4, metalness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8d9096, roughness: 0.35, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }),
    helmet: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.2, clearcoat: 1 }),
    visor: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.05, metalness: 0.8 }),
    exhaust: new THREE.MeshStandardMaterial({ color: 0x5a4a40, roughness: 0.5, metalness: 0.8, emissive: 0xff5a10, emissiveIntensity: 0 }),
    rain: new THREE.MeshStandardMaterial({ color: 0x4a0a0a, emissive: 0xff1a10, emissiveIntensity: 0 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.9 }),
    suit: new THREE.MeshStandardMaterial({ color: DRIVER_SUITS.f20.suit, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8 }),
  };
  const add = (geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; car.add(m);
    if (mat === MAT.blue || mat === MAT.yellow) addPanel(m);
    return m;
  };
  const PAINT = [MAT.blue, MAT.yellow, MAT.carbon, MAT.dark];
  // --- ONE SKIN, NOSE TO GEARBOX, measured off a reference of the real car: 40
  // slices from the nose's tip to just behind the sidepods' inlets, 60 from there to
  // the end of the engine cover; behind the inlets each slice is eight points of its
  // own (the middle of the top, three down the cover's sweep, the pod's top edge, its
  // side, its deeply tucked-in foot, the floor). The airbox is part of the one skin
  const NZ = [2.93, 2.872, 2.814, 2.755, 2.697, 2.639, 2.581, 2.523, 2.464, 2.406, 2.348, 2.29, 2.232, 2.173, 2.115, 2.057, 1.999, 1.941, 1.882, 1.824, 1.766, 1.708, 1.649, 1.591, 1.533, 1.475, 1.417, 1.358, 1.3, 1.242, 1.184, 1.126, 1.067, 1.009, 0.951, 0.893, 0.835, 0.776, 0.718, 0.66];
  const BZ = [0.62, 0.582, 0.544, 0.506, 0.468, 0.43, 0.392, 0.354, 0.316, 0.278, 0.24, 0.202, 0.164, 0.126, 0.088, 0.051, 0.013, -0.025, -0.063, -0.101, -0.139, -0.177, -0.215, -0.253, -0.291, -0.329, -0.367, -0.405, -0.443, -0.481, -0.519, -0.557, -0.595, -0.633, -0.671, -0.709, -0.747, -0.785, -0.823, -0.861, -0.899, -0.937, -0.975, -1.013, -1.051, -1.088, -1.126, -1.164, -1.202, -1.24, -1.278, -1.316, -1.354, -1.392, -1.43, -1.468, -1.506, -1.544, -1.582, -1.62];
  const M = {
    o: [0.16, 0.159, 0.158, 0.158, 0.157, 0.154, 0.141, 0.118, 0.087, 0.055, 0.026, 0.008, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    x0: [0.16, 0.159, 0.159, 0.159, 0.158, 0.156, 0.143, 0.121, 0.09, 0.059, 0.03, 0.012, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004, 0.004],
    y0: [0.666, 0.671, 0.681, 0.701, 0.714, 0.727, 0.738, 0.756, 0.79, 0.848, 0.93, 1.006, 1.073, 1.111, 1.131, 1.122, 1.11, 1.096, 1.087, 1.078, 1.075, 1.075, 1.074, 1.073, 1.071, 1.068, 1.063, 1.056, 1.048, 1.038, 1.027, 1.014, 1.001, 0.986, 0.971, 0.955, 0.939, 0.923, 0.908, 0.892, 0.877, 0.861, 0.846, 0.83, 0.815, 0.799, 0.785, 0.771, 0.76, 0.749, 0.739, 0.73, 0.721, 0.713, 0.705, 0.699, 0.693, 0.689, 0.686, 0.684],
    x1: [0.284, 0.282, 0.28, 0.28, 0.277, 0.272, 0.261, 0.248, 0.224, 0.199, 0.17, 0.15, 0.135, 0.129, 0.132, 0.146, 0.16, 0.166, 0.166, 0.159, 0.145, 0.132, 0.126, 0.126, 0.127, 0.126, 0.124, 0.122, 0.118, 0.113, 0.109, 0.105, 0.102, 0.1, 0.099, 0.098, 0.097, 0.096, 0.094, 0.093, 0.092, 0.091, 0.09, 0.089, 0.089, 0.089, 0.089, 0.089, 0.089, 0.087, 0.084, 0.084, 0.085, 0.089, 0.086, 0.08, 0.066, 0.051, 0.035, 0.028],
    y1: [0.871, 0.867, 0.857, 0.853, 0.844, 0.837, 0.829, 0.822, 0.818, 0.831, 0.872, 0.929, 0.996, 1.047, 1.078, 1.076, 1.052, 1.012, 0.975, 0.943, 0.919, 0.904, 0.894, 0.891, 0.888, 0.885, 0.881, 0.879, 0.877, 0.876, 0.874, 0.87, 0.865, 0.857, 0.848, 0.838, 0.828, 0.818, 0.808, 0.798, 0.788, 0.777, 0.765, 0.753, 0.742, 0.731, 0.722, 0.713, 0.704, 0.694, 0.681, 0.663, 0.642, 0.62, 0.608, 0.605, 0.615, 0.628, 0.648, 0.656],
    x2: [0.42, 0.41, 0.392, 0.376, 0.357, 0.342, 0.335, 0.338, 0.336, 0.321, 0.291, 0.253, 0.218, 0.194, 0.187, 0.195, 0.213, 0.23, 0.242, 0.246, 0.251, 0.254, 0.255, 0.256, 0.256, 0.255, 0.253, 0.248, 0.241, 0.231, 0.222, 0.213, 0.206, 0.201, 0.197, 0.193, 0.189, 0.185, 0.181, 0.177, 0.173, 0.17, 0.166, 0.164, 0.16, 0.157, 0.152, 0.149, 0.145, 0.143, 0.141, 0.145, 0.154, 0.169, 0.172, 0.164, 0.139, 0.113, 0.077, 0.061],
    y2: [0.717, 0.72, 0.727, 0.729, 0.733, 0.734, 0.739, 0.744, 0.757, 0.768, 0.783, 0.793, 0.809, 0.822, 0.833, 0.828, 0.815, 0.791, 0.765, 0.739, 0.724, 0.715, 0.708, 0.704, 0.701, 0.7, 0.699, 0.702, 0.708, 0.715, 0.722, 0.725, 0.726, 0.724, 0.718, 0.712, 0.706, 0.7, 0.693, 0.687, 0.681, 0.674, 0.666, 0.658, 0.65, 0.641, 0.634, 0.626, 0.618, 0.608, 0.599, 0.581, 0.562, 0.543, 0.541, 0.55, 0.575, 0.602, 0.632, 0.643],
    x3: [0.636, 0.622, 0.591, 0.564, 0.537, 0.519, 0.509, 0.505, 0.497, 0.481, 0.458, 0.434, 0.412, 0.395, 0.384, 0.386, 0.393, 0.403, 0.41, 0.415, 0.415, 0.413, 0.41, 0.406, 0.403, 0.399, 0.394, 0.385, 0.372, 0.356, 0.34, 0.325, 0.313, 0.304, 0.297, 0.292, 0.286, 0.28, 0.274, 0.268, 0.263, 0.259, 0.256, 0.253, 0.25, 0.246, 0.242, 0.239, 0.236, 0.236, 0.236, 0.24, 0.243, 0.246, 0.233, 0.208, 0.168, 0.132, 0.093, 0.077],
    y3: [0.592, 0.605, 0.621, 0.639, 0.661, 0.681, 0.686, 0.675, 0.665, 0.658, 0.657, 0.659, 0.662, 0.663, 0.658, 0.644, 0.624, 0.602, 0.581, 0.562, 0.549, 0.539, 0.532, 0.527, 0.523, 0.523, 0.525, 0.533, 0.545, 0.559, 0.572, 0.583, 0.589, 0.591, 0.59, 0.589, 0.587, 0.586, 0.584, 0.583, 0.581, 0.58, 0.578, 0.575, 0.573, 0.571, 0.569, 0.568, 0.566, 0.563, 0.561, 0.55, 0.528, 0.497, 0.482, 0.484, 0.509, 0.543, 0.589, 0.612],
    x4: [0.772, 0.756, 0.723, 0.693, 0.661, 0.639, 0.629, 0.629, 0.629, 0.627, 0.625, 0.621, 0.616, 0.61, 0.604, 0.598, 0.591, 0.585, 0.578, 0.57, 0.561, 0.55, 0.538, 0.524, 0.509, 0.493, 0.475, 0.458, 0.442, 0.428, 0.417, 0.407, 0.398, 0.39, 0.382, 0.374, 0.365, 0.356, 0.348, 0.34, 0.333, 0.327, 0.321, 0.317, 0.313, 0.31, 0.307, 0.306, 0.305, 0.305, 0.305, 0.306, 0.307, 0.309, 0.294, 0.262, 0.213, 0.167, 0.117, 0.094],
    y4: [0.616, 0.613, 0.612, 0.61, 0.598, 0.582, 0.568, 0.558, 0.544, 0.533, 0.523, 0.512, 0.498, 0.483, 0.467, 0.449, 0.429, 0.41, 0.392, 0.375, 0.36, 0.347, 0.336, 0.327, 0.32, 0.317, 0.318, 0.33, 0.35, 0.377, 0.404, 0.426, 0.443, 0.452, 0.455, 0.457, 0.46, 0.462, 0.465, 0.468, 0.471, 0.473, 0.475, 0.476, 0.479, 0.482, 0.486, 0.49, 0.492, 0.492, 0.491, 0.489, 0.487, 0.484, 0.492, 0.509, 0.537, 0.561, 0.59, 0.602],
    xs: [0.769, 0.754, 0.722, 0.693, 0.661, 0.639, 0.628, 0.627, 0.624, 0.622, 0.618, 0.613, 0.607, 0.602, 0.596, 0.59, 0.585, 0.579, 0.573, 0.565, 0.557, 0.547, 0.532, 0.513, 0.489, 0.464, 0.442, 0.425, 0.416, 0.412, 0.409, 0.405, 0.398, 0.389, 0.379, 0.369, 0.359, 0.35, 0.341, 0.333, 0.325, 0.317, 0.31, 0.305, 0.301, 0.299, 0.299, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.285, 0.252, 0.204, 0.159, 0.11, 0.087],
    ys: [0.408, 0.407, 0.406, 0.405, 0.399, 0.391, 0.384, 0.379, 0.372, 0.367, 0.361, 0.356, 0.349, 0.341, 0.334, 0.324, 0.315, 0.305, 0.296, 0.287, 0.28, 0.274, 0.268, 0.263, 0.26, 0.258, 0.259, 0.265, 0.275, 0.289, 0.302, 0.313, 0.321, 0.326, 0.327, 0.329, 0.33, 0.331, 0.332, 0.334, 0.336, 0.336, 0.337, 0.338, 0.339, 0.341, 0.343, 0.345, 0.346, 0.346, 0.346, 0.344, 0.344, 0.342, 0.346, 0.355, 0.368, 0.381, 0.395, 0.401],
    xb: [0.727, 0.702, 0.649, 0.602, 0.553, 0.524, 0.514, 0.523, 0.531, 0.539, 0.546, 0.552, 0.556, 0.56, 0.562, 0.564, 0.565, 0.565, 0.563, 0.559, 0.554, 0.547, 0.538, 0.526, 0.512, 0.497, 0.48, 0.463, 0.446, 0.429, 0.411, 0.391, 0.37, 0.35, 0.332, 0.317, 0.305, 0.297, 0.29, 0.283, 0.276, 0.269, 0.263, 0.259, 0.256, 0.254, 0.254, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.255, 0.242, 0.215, 0.173, 0.135, 0.093, 0.074],
  };
  const MK = {}; for (const k in M) MK[k] = curveAny(BZ.map((z, i) => [z, M[k][i]]));
  const secB20 = (z) => {
    const v = (k) => MK[k](z), o = v('o') > 0.05 ? v('o') : 0, xs = v('xs');
    return [[o, v('y0')], [Math.max(v('x1'), o + 0.02), v('y1')], [v('x2'), v('y2')], [v('x3'), v('y3')], [v('x4'), v('y4')],
      [xs, v('ys')], [Math.min(v('xb'), xs) - 0.03, 0.2], [0, 0.17]];
  };
  const sk = sweptSkin(car, addPanel, add, PAINT, {
    nose: { z: NZ, hw: [0.111, 0.11, 0.109, 0.108, 0.107, 0.107, 0.107, 0.108, 0.109, 0.11, 0.11, 0.112, 0.117, 0.126, 0.139, 0.152, 0.166, 0.177, 0.185, 0.189, 0.193, 0.196, 0.198, 0.201, 0.203, 0.205, 0.208, 0.212, 0.217, 0.222, 0.228, 0.236, 0.244, 0.254, 0.262, 0.269, 0.273, 0.276, 0.276, 0.277],
      yb: [0.206, 0.211, 0.22, 0.229, 0.239, 0.245, 0.247, 0.244, 0.239, 0.234, 0.229, 0.226, 0.223, 0.221, 0.219, 0.218, 0.219, 0.223, 0.23, 0.236, 0.24, 0.238, 0.23, 0.22, 0.21, 0.203, 0.194, 0.182, 0.163, 0.145, 0.127, 0.115, 0.11, 0.111, 0.112, 0.112, 0.113, 0.113, 0.113, 0.113],
      yt: [0.376, 0.381, 0.392, 0.408, 0.426, 0.444, 0.463, 0.482, 0.501, 0.52, 0.539, 0.558, 0.578, 0.598, 0.62, 0.645, 0.672, 0.694, 0.709, 0.718, 0.725, 0.728, 0.73, 0.731, 0.731, 0.731, 0.731, 0.736, 0.749, 0.772, 0.795, 0.801, 0.787, 0.754, 0.724, 0.704, 0.697, 0.696, 0.695, 0.695] },
    body: { z: BZ, yb: 0.17 },
    secB: secB20,
    open: [[1.4, 0], [1.067, 0], [1.009, 0.16], [0.951, 0.16], [0.893, 0.171], [0.835, 0.166], [0.776, 0.159], [0.718, 0.159], [0.66, 0.159], [0.62, 0.159], [0.582, 0.16], [0.544, 0.16], [0.506, 0.157], [0.468, 0.156], [0.43, 0.157], [0.392, 0.156], [0.354, 0.144], [0.316, 0.091], [0.278, 0], [-0.6, 0]], RIM: 0.72,
    paint: (part, seg) => (part === 'join' ? 3 : seg === 6 ? 2 : 0), mouthX: 0.3, duct: 0.28,
  });
  const { surfY, S } = sk;
  const DZ = F20_DRIVER_DZ;
  // the teal: a thin line down each side of the nose's top, and along each shoulder of the engine cover
  sk.strip(2.85, 1.15, (z) => sk.hwA(z) * 0.8, () => 0.007, MAT.yellow);
  sk.strip(-0.1, -1.55, (z) => MK.x1(z) + 0.01, () => 0.006, MAT.yellow);
  // THE STARS: a field of small five-pointed silver stars over the engine cover's flanks
  // and the pods, packed at the back and thinning out toward the front
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const star = (x, y, r) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    for (let i = 0; i < 900; i++) {
      const u = rnd(), v = rnd();                      // (u: 0 at the back of the patch, 1 at its front)
      if (rnd() > Math.pow(1 - u, 1.6)) continue;      // (fewer of them toward the front)
      g.fillStyle = `rgba(200,205,212,${0.55 + 0.45 * (1 - u)})`; star(u * c.width, v * c.height, 6 + 14 * (1 - u) * rnd());
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const stars = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.3, roughness: 0.25, metalness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
    for (const sx of [1, -1]) decalOnSkin(car, addPanel, sk, sk.secB, -1.6, 0.3, 1, 6 * S - 1, stars, sx);
  }
  // the cockpit: the little screen at the front of it, his seat, his legs down into the nose
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12, 1, true, -0.8, 1.6).rotateX(-0.3).translate(0, 0.77, 1.06), MAT.glass, false);
  add(box(0.3, 0.05, 0.34, 0, 0.18, 0.08 + DZ), MAT.seat, false);
  add(box(0.32, 0.4, 0.05, 0, 0.38, -0.12 + DZ, -0.36), MAT.seat, false);
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.24, 0.02 + DZ], [sx * 0.09, 0.34, 0.55 + DZ], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.34, 0.55 + DZ], [sx * 0.07, 0.3, 1.02 + DZ], 0.045), MAT.suit, false);
  }
  const driver = new THREE.Group(); driver.position.set(0, 0.04, DZ);
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.04), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([sx * 0.17, 0.51, -0.02], [sx * 0.15, 0.43, 0.22], 0.04), MAT.suit); dAdd(rod([sx * 0.15, 0.43, 0.22], [sx * 0.12, 0.54, 0.42], 0.035), MAT.suit); }
  dAdd(new THREE.BoxGeometry(0.27, 0.13, 0.03).translate(0, 0.58, 0.44), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.78, -0.03 + DZ), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.78, -0.03 + DZ), MAT.visor);
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.78, -0.03 + DZ), MAT.yellow);
  // THE HALO: the titanium hoop over his head, from its two mounts behind him up and round
  // in front of his face, and the centre pillar down onto the tub ahead of him; painted black
  { const P = (a) => a.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const hoop = new THREE.CatmullRomCurve3(P([[0.29, 0.7, 0.36], [0.29, 0.86, 0.5], [0.26, 0.92, 0.7], [0.16, 0.935, 0.9], [0, 0.94, 0.98], [-0.16, 0.935, 0.9], [-0.26, 0.92, 0.7], [-0.29, 0.86, 0.5], [-0.29, 0.7, 0.36]]));
    add(new THREE.TubeGeometry(hoop, 60, 0.024, 10, false), MAT.blue);
    const pillar = new THREE.CatmullRomCurve3(P([[0, 0.94, 0.97], [0, 0.88, 1.06], [0, 0.78, 1.12], [0, 0.73, 1.15]]));
    add(new THREE.TubeGeometry(pillar, 16, 0.028, 10, false), MAT.blue);
    // the red star on its top, in front of his face (the tribute)
    const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.017 : 0.04; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (k) sh.lineTo(x, y); else sh.moveTo(x, y); }
    add(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, 0.966, 0.93), MAT.red, false); }
  // mirrors: out on the sidepods' inlets, on stalks, ahead of him
  const mirrors = {};
  for (const s of [1, -1]) {
    const mz = 0.92;
    const stalk = add(rod([s * 0.4, 0.68, mz - 0.05], [s * 0.5, 0.75, mz], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: mz + 0.04, w: 0.13, h: 0.05, y: 0.745, x: s * 0.505 }, { z: mz - 0.02, w: 0.14, h: 0.06, y: 0.74, x: s * 0.505 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.12, 0.045).rotateY(Math.PI).translate(s * 0.505, 0.77, mz - 0.025), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.505, 0.77, mz] };
  }
  // the airbox's mouth: dark, in the face of the skin's rise right over his head; the T-cam on top
  add(new THREE.CircleGeometry(0.085, 24).scale(1.1, 0.8, 1).translate(0, 1.0, 0.3), MAT.dark, false);
  add(box(0.09, 0.05, 0.14, 0, 1.17, 0.12), MAT.carbon).name = 'tcamPod';
  // the bargeboards: a cluster of curved vertical vanes between the front wheels and the pods
  for (const s of [1, -1]) {
    for (let k = 0; k < 4; k++) add(box(0.01, 0.3 - k * 0.04, 0.4, s * (0.38 + k * 0.06), 0.32 - k * 0.015, 1.2 - k * 0.07, 0, s * (0.1 + k * 0.05)), MAT.carbon);
    add(box(0.32, 0.01, 0.16, s * 0.52, 0.56, 1.05, 0.15, 0, -s * 0.2), MAT.carbon);                 // (the boomerang over them)
    add(box(0.012, 0.14, 0.5, s * 0.78, 0.25, 0.6, 0, s * 0.05), MAT.carbon);                      // (the floor's edge vane)
  }
  // --- THE FLOOR: huge, flat, out to the full width between the wheels, slots cut
  // along its edges ahead of the rear wheels; the plank under it; the diffuser behind
  add(box(1.58, 0.02, 2.9, 0, 0.12, -0.2), MAT.carbon);
  add(box(0.3, 0.012, 3.2, 0, 0.1, -0.1), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));
  for (const s of [1, -1]) for (let k = 0; k < 6; k++) add(box(0.05, 0.022, 0.012, s * 0.76, 0.125, -1.0 - k * 0.07), MAT.dark, false);
  add(box(1.0, 0.02, 0.75, 0, 0.24, -2.05, -0.32), MAT.carbon);
  for (const x of [-0.42, -0.25, -0.08, 0.08, 0.25, 0.42]) add(box(0.01, 0.2, 0.7, x, 0.21, -2.05), MAT.carbon);
  // the gearbox and the crash structure behind it, the rain light, the exhaust out in the middle
  add(box(0.24, 0.24, 0.9, 0, 0.36, -2.05), MAT.carbon);
  add(box(0.12, 0.12, 0.35, 0, 0.42, -2.55), MAT.carbon);
  add(box(0.1, 0.05, 0.03, 0, 0.4, -2.74), MAT.rain);
  add(new THREE.CylinderGeometry(0.055, 0.06, 0.24, 14, 1, true).rotateX(Math.PI / 2 - 0.12).translate(0, 0.55, -2.33), MAT.exhaust);
  // --- THE FRONT WING: two metres wide, slung straight under the nose's tip on two
  // pylons; a flat neutral middle, then the main plane and three flaps stacked behind
  // it, curling up toward the endplates; small outboard flicks on the endplates
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) add(box(0.012, 0.15, 0.22, s * 0.05, 0.2, 2.84), MAT.carbon);
  add(box(0.5, 0.02, 0.4, 0, 0.1, 2.9), MAT.carbon);
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.76, 0.022, 0.34, s * 0.62, 0.095, 2.92, 0.05, 0, -s * 0.04), MAT.blue);           // the main plane
    for (let k = 0; k < 3; k++) addTo(g, box(0.72 - k * 0.04, 0.014, 0.14, s * (0.63 + k * 0.01), 0.13 + k * 0.045, 2.75 - k * 0.09, 0.45 + k * 0.2, 0, -s * (0.06 + k * 0.04)), k === 0 ? MAT.blue : MAT.carbon);
    addTo(g, box(0.014, 0.3, 0.6, s * 0.99, 0.21, 2.78), MAT.blue);                                  // the endplate
    addTo(g, box(0.1, 0.012, 0.2, s * 0.95, 0.34, 2.62, 0.3), MAT.carbon);                          // (a flick on it)
    addTo(g, box(0.5, 0.004, 0.03, s * 0.62, 0.108, 3.05, 0.05, 0, -s * 0.04), MAT.yellow);         // (a teal line along its leading edge)
  }
  // --- THE REAR WING: narrow-ish and tall, its endplates with their louvres, the main
  // plane and the flap above it (the DRS slot between); the beam wing low behind the diffuser
  for (const s of [1, -1]) addTo(wings.rear, plate94([[-2.0, 0.42], [-2.0, 1.03], [-2.6, 1.03], [-2.62, 0.75], [-2.4, 0.42]], s * 0.53), MAT.blue);
  for (const s of [1, -1]) for (let k = 0; k < 5; k++) addTo(wings.rear, box(0.016, 0.01, 0.16, s * 0.53, 0.5 + k * 0.05, -2.22, 0.4), MAT.dark);
  addTo(wings.rear, box(1.04, 0.024, 0.3, 0, 0.84, -2.18, 0.12), MAT.blue);
  addTo(wings.rear, box(1.04, 0.018, 0.2, 0, 0.97, -2.42, 0.42), MAT.blue);
  addTo(wings.rear, box(1.04, 0.004, 0.02, 0, 0.985, -2.31, 0.42), MAT.red);                       // (the red edge on the flap)
  add(box(0.9, 0.018, 0.16, 0, 0.5, -2.45, 0.2), MAT.carbon);
  for (const s of [1, -1]) addTo(wings.rear, box(0.03, 0.4, 0.08, s * 0.08, 0.66, -2.3, -0.2), MAT.carbon);   // (its twin pillars)
  return { helmet: [helmet, visor, stripe], rainMat: MAT.rain, exhaustMat: MAT.exhaust, mats: MAT, wings, mirrors, driver };
}
// (a flat plate cut to an outline drawn from the side: [z, y] points; at x across)
function plate94(pts, x, t = 0.014) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]);
  return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -t / 2).rotateY(-Math.PI / 2).translate(x, 0, 0);
}
// how much further forward the TTF-94's driver sits than the older cars' (as on the real car)
export const F94_DRIVER_DZ = 0.45;
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
  // (measured off a reference of the real car: 350 slices, 100 down the nose to the
  // pods' mouths and 250 from there to the gearbox, eight points a slice: the middle
  // of the top, three down the top's sweep, the top's outer edge (the pod's, behind
  // the mouths), the side, the foot, the middle underneath. The reference is wider
  // than the real car, so its widths are taken at 0.84 (its front track onto the
  // real 1.69 m). The airbox is part of the one skin, as on the real car)
  const F94NZ = [2.6,2.581,2.563,2.544,2.525,2.507,2.488,2.469,2.451,2.432,2.413,2.394,2.376,2.357,2.338,2.32,2.301,2.282,2.264,2.245,2.226,2.208,2.189,2.17,2.152,2.133,2.114,2.095,2.077,2.058,2.039,2.021,2.002,1.983,1.965,1.946,1.927,1.909,1.89,1.871,1.853,1.834,1.815,1.796,1.778,1.759,1.74,1.722,1.703,1.684,1.666,1.647,1.628,1.61,1.591,1.572,1.554,1.535,1.516,1.497,1.479,1.46,1.441,1.423,1.404,1.385,1.367,1.348,1.329,1.311,1.292,1.273,1.255,1.236,1.217,1.198,1.18,1.161,1.142,1.124,1.105,1.086,1.068,1.049,1.03,1.012,0.993,0.974,0.956,0.937,0.918,0.899,0.881,0.862,0.843,0.825,0.806,0.787,0.769,0.75];
  const F94BZ = [0.72,0.7113,0.7027,0.694,0.6853,0.6766,0.668,0.6593,0.6506,0.6419,0.6333,0.6246,0.6159,0.6072,0.5986,0.5899,0.5812,0.5725,0.5639,0.5552,0.5465,0.5378,0.5292,0.5205,0.5118,0.5031,0.4945,0.4858,0.4771,0.4684,0.4598,0.4511,0.4424,0.4337,0.4251,0.4164,0.4077,0.399,0.3904,0.3817,0.373,0.3643,0.3557,0.347,0.3383,0.3296,0.321,0.3123,0.3036,0.2949,0.2863,0.2776,0.2689,0.2602,0.2516,0.2429,0.2342,0.2255,0.2169,0.2082,0.1995,0.1908,0.1822,0.1735,0.1648,0.1561,0.1475,0.1388,0.1301,0.1214,0.1128,0.1041,0.0954,0.0867,0.0781,0.0694,0.0607,0.052,0.0434,0.0347,0.026,0.0173,0.0087,0,-0.0087,-0.0173,-0.026,-0.0347,-0.0434,-0.052,-0.0607,-0.0694,-0.0781,-0.0867,-0.0954,-0.1041,-0.1128,-0.1214,-0.1301,-0.1388,-0.1475,-0.1561,-0.1648,-0.1735,-0.1822,-0.1908,-0.1995,-0.2082,-0.2169,-0.2255,-0.2342,-0.2429,-0.2516,-0.2602,-0.2689,-0.2776,-0.2863,-0.2949,-0.3036,-0.3123,-0.321,-0.3296,-0.3383,-0.347,-0.3557,-0.3643,-0.373,-0.3817,-0.3904,-0.399,-0.4077,-0.4164,-0.4251,-0.4337,-0.4424,-0.4511,-0.4598,-0.4684,-0.4771,-0.4858,-0.4945,-0.5031,-0.5118,-0.5205,-0.5292,-0.5378,-0.5465,-0.5552,-0.5639,-0.5725,-0.5812,-0.5899,-0.5986,-0.6072,-0.6159,-0.6246,-0.6333,-0.6419,-0.6506,-0.6593,-0.668,-0.6766,-0.6853,-0.694,-0.7027,-0.7113,-0.72,-0.7287,-0.7373,-0.746,-0.7547,-0.7634,-0.772,-0.7807,-0.7894,-0.7981,-0.8067,-0.8154,-0.8241,-0.8328,-0.8414,-0.8501,-0.8588,-0.8675,-0.8761,-0.8848,-0.8935,-0.9022,-0.9108,-0.9195,-0.9282,-0.9369,-0.9455,-0.9542,-0.9629,-0.9716,-0.9802,-0.9889,-0.9976,-1.0063,-1.0149,-1.0236,-1.0323,-1.041,-1.0496,-1.0583,-1.067,-1.0757,-1.0843,-1.093,-1.1017,-1.1104,-1.119,-1.1277,-1.1364,-1.1451,-1.1537,-1.1624,-1.1711,-1.1798,-1.1884,-1.1971,-1.2058,-1.2145,-1.2231,-1.2318,-1.2405,-1.2492,-1.2578,-1.2665,-1.2752,-1.2839,-1.2925,-1.3012,-1.3099,-1.3186,-1.3272,-1.3359,-1.3446,-1.3533,-1.3619,-1.3706,-1.3793,-1.388,-1.3966,-1.4053,-1.414,-1.4227,-1.4313,-1.44];
  const F94A = { x0: [0.0007,0.0006,0.0005,0.0005,0.0005,0.0005,0.0005,0.0006,0.0006,0.0007,0.0008,0.0009,0.0011,0.0012,0.0013,0.0014,0.0016,0.0017,0.0018,0.0019,0.0021,0.0021,0.0022,0.0023,0.0023,0.0023,0.0023,0.0023,0.0023,0.0023,0.0024,0.0024,0.0025,0.0026,0.0027,0.0027,0.0028,0.0029,0.0029,0.003,0.003,0.0031,0.0031,0.0032,0.0033,0.0034,0.0034,0.0035,0.0036,0.0037,0.0038,0.0039,0.0039,0.0039,0.004,0.004,0.004,0.004,0.004,0.004,0.0041,0.0041,0.0041,0.0042,0.0043,0.0044,0.0045,0.0046,0.0047,0.0048,0.0048,0.0049,0.005,0.0051,0.0053,0.0055,0.0058,0.0063,0.0071,0.0084,0.0104,0.0133,0.0173,0.0225,0.0291,0.0369,0.0458,0.0554,0.0653,0.0752,0.0847,0.0936,0.1017,0.1091,0.1156,0.1214,0.1265,0.1309,0.1345,0.1376], y0: [0.4292,0.4333,0.4382,0.4436,0.4497,0.4561,0.4628,0.4697,0.4767,0.4837,0.4908,0.4979,0.505,0.512,0.519,0.5259,0.5329,0.5397,0.5466,0.5533,0.56,0.5665,0.573,0.5793,0.5856,0.5916,0.5975,0.6033,0.6089,0.6143,0.6195,0.6245,0.6294,0.6341,0.6387,0.6432,0.6475,0.6517,0.6559,0.6599,0.6639,0.6677,0.6715,0.6752,0.6788,0.6823,0.6856,0.6888,0.6919,0.6948,0.6974,0.7,0.7023,0.7044,0.7064,0.7083,0.71,0.7116,0.7132,0.7147,0.7161,0.7175,0.7188,0.7201,0.7214,0.7226,0.7239,0.7251,0.7263,0.7276,0.7288,0.7301,0.7315,0.7329,0.7344,0.736,0.7377,0.7394,0.7414,0.7433,0.7454,0.7474,0.7493,0.7509,0.7523,0.7531,0.7534,0.753,0.7519,0.75,0.7475,0.7444,0.7408,0.7368,0.7327,0.7284,0.7243,0.7205,0.717,0.714], x1: [0.0219,0.0225,0.0233,0.0241,0.025,0.0259,0.0268,0.0276,0.0285,0.0292,0.0299,0.0306,0.0312,0.0318,0.0324,0.033,0.0335,0.034,0.0345,0.035,0.0355,0.0359,0.0363,0.0367,0.0371,0.0375,0.0379,0.0383,0.0388,0.0392,0.0397,0.0401,0.0406,0.0411,0.0416,0.042,0.0424,0.0428,0.0432,0.0435,0.0439,0.0442,0.0446,0.045,0.0454,0.0459,0.0463,0.0468,0.0473,0.0477,0.0482,0.0486,0.049,0.0494,0.0497,0.0501,0.0506,0.051,0.0515,0.052,0.0526,0.0532,0.0538,0.0544,0.055,0.0556,0.0561,0.0566,0.0571,0.0575,0.0579,0.0583,0.0587,0.059,0.0594,0.0599,0.0605,0.0614,0.0626,0.0644,0.0668,0.0701,0.0744,0.0797,0.086,0.0932,0.101,0.1093,0.1178,0.1264,0.1348,0.1431,0.1511,0.1589,0.1663,0.1733,0.1797,0.1856,0.1906,0.1949], y1: [0.4287,0.4326,0.4372,0.4426,0.4485,0.455,0.4618,0.4689,0.476,0.4833,0.4905,0.4976,0.5047,0.5118,0.5187,0.5257,0.5325,0.5394,0.5461,0.5528,0.5594,0.5659,0.5722,0.5785,0.5847,0.5907,0.5965,0.6022,0.6077,0.6131,0.6182,0.6231,0.6279,0.6325,0.637,0.6413,0.6455,0.6497,0.6537,0.6577,0.6616,0.6654,0.6691,0.6728,0.6763,0.6797,0.683,0.6861,0.689,0.6918,0.6943,0.6967,0.6989,0.701,0.7028,0.7045,0.7061,0.7075,0.7089,0.7101,0.7113,0.7124,0.7135,0.7146,0.7156,0.7167,0.7177,0.7188,0.7199,0.7211,0.7222,0.7234,0.7247,0.726,0.7275,0.7289,0.7304,0.732,0.7334,0.7348,0.7359,0.7367,0.7371,0.7371,0.7365,0.7354,0.7337,0.7314,0.7286,0.7252,0.7212,0.7168,0.7119,0.7066,0.7012,0.6958,0.6905,0.6855,0.6811,0.6772], x2: [0.045,0.0459,0.0469,0.0481,0.0495,0.051,0.0526,0.0541,0.0557,0.0571,0.0585,0.0597,0.0609,0.062,0.0631,0.0641,0.065,0.0659,0.0667,0.0675,0.0683,0.069,0.0697,0.0704,0.0711,0.0718,0.0724,0.0731,0.0738,0.0745,0.0753,0.076,0.0768,0.0775,0.0782,0.0789,0.0796,0.0802,0.0808,0.0814,0.0821,0.0827,0.0834,0.0841,0.0848,0.0856,0.0864,0.0872,0.088,0.0888,0.0896,0.0903,0.091,0.0917,0.0924,0.0931,0.0939,0.0947,0.0955,0.0965,0.0975,0.0985,0.0996,0.1007,0.1017,0.1026,0.1035,0.1043,0.1051,0.1057,0.1064,0.1069,0.1075,0.1081,0.1087,0.1094,0.1102,0.1114,0.113,0.1152,0.1182,0.1222,0.1273,0.1335,0.1407,0.1487,0.1571,0.1657,0.1742,0.1822,0.1896,0.1963,0.2023,0.2077,0.2126,0.2169,0.2206,0.2239,0.2267,0.2289], y2: [0.4269,0.4307,0.4352,0.4404,0.446,0.4521,0.4585,0.4651,0.4718,0.4786,0.4854,0.4922,0.499,0.5057,0.5124,0.5191,0.5257,0.5323,0.5388,0.5453,0.5517,0.558,0.5642,0.5702,0.5762,0.582,0.5876,0.593,0.5983,0.6033,0.6082,0.6128,0.6172,0.6215,0.6257,0.6297,0.6336,0.6375,0.6412,0.6449,0.6485,0.652,0.6555,0.6588,0.662,0.6651,0.6681,0.6709,0.6736,0.6761,0.6784,0.6806,0.6825,0.6843,0.6859,0.6873,0.6885,0.6896,0.6905,0.6913,0.692,0.6927,0.6933,0.6939,0.6945,0.6952,0.6959,0.6966,0.6974,0.6982,0.6991,0.7001,0.7012,0.7024,0.7036,0.7049,0.7061,0.7072,0.708,0.7083,0.708,0.7069,0.7048,0.7017,0.6975,0.6923,0.6864,0.6798,0.6728,0.6656,0.6581,0.6505,0.6427,0.6349,0.6271,0.6195,0.6122,0.6054,0.5994,0.5941], x3: [0.0643,0.0663,0.0684,0.0708,0.0732,0.0757,0.0781,0.0803,0.0825,0.0844,0.0862,0.0878,0.0893,0.0907,0.0921,0.0934,0.0946,0.0957,0.0969,0.0979,0.0989,0.0999,0.1008,0.1017,0.1025,0.1034,0.1042,0.105,0.1059,0.1067,0.1076,0.1085,0.1095,0.1104,0.1113,0.1122,0.1131,0.1139,0.1147,0.1156,0.1164,0.1173,0.1182,0.1191,0.1201,0.1212,0.1223,0.1234,0.1246,0.1258,0.127,0.1281,0.1292,0.1304,0.1315,0.1326,0.1337,0.1349,0.1361,0.1374,0.1388,0.1402,0.1416,0.143,0.1444,0.1456,0.1468,0.1478,0.1487,0.1496,0.1504,0.1511,0.1518,0.1524,0.1531,0.1539,0.1547,0.1559,0.1574,0.1595,0.1622,0.1658,0.1702,0.1755,0.1814,0.188,0.1949,0.2019,0.2087,0.2155,0.222,0.2284,0.2347,0.2412,0.2478,0.2544,0.261,0.2674,0.2734,0.2786], y3: [0.4229,0.4262,0.4303,0.4349,0.4401,0.4456,0.4514,0.4574,0.4636,0.4698,0.476,0.4823,0.4886,0.4949,0.5012,0.5075,0.5138,0.52,0.5262,0.5323,0.5383,0.5442,0.55,0.5557,0.5612,0.5665,0.5717,0.5766,0.5813,0.5858,0.5901,0.5942,0.5982,0.602,0.6057,0.6093,0.6128,0.6163,0.6197,0.6231,0.6264,0.6297,0.6328,0.6359,0.6389,0.6418,0.6445,0.6472,0.6497,0.6521,0.6543,0.6563,0.6581,0.6597,0.6611,0.6622,0.6632,0.664,0.6646,0.6651,0.6655,0.6658,0.666,0.6662,0.6664,0.6666,0.6669,0.6671,0.6675,0.6679,0.6683,0.6689,0.6696,0.6704,0.6712,0.6721,0.6728,0.6733,0.6732,0.6723,0.6702,0.6666,0.6614,0.6544,0.6459,0.636,0.6253,0.6141,0.6032,0.5927,0.5831,0.5744,0.5667,0.5601,0.5544,0.5497,0.5458,0.5427,0.5403,0.5385], x4: [0.0894,0.0911,0.0929,0.0948,0.0968,0.0988,0.1007,0.1026,0.1044,0.1061,0.1077,0.1092,0.1107,0.1122,0.1135,0.1148,0.116,0.1171,0.1181,0.1191,0.12,0.1209,0.1217,0.1225,0.1233,0.1241,0.125,0.1258,0.1267,0.1276,0.1286,0.1295,0.1305,0.1316,0.1326,0.1336,0.1346,0.1356,0.1365,0.1375,0.1386,0.1396,0.1407,0.1419,0.1432,0.1445,0.146,0.1475,0.149,0.1506,0.1522,0.1538,0.1554,0.157,0.1585,0.16,0.1614,0.1628,0.1642,0.1656,0.1669,0.1682,0.1695,0.1708,0.172,0.1731,0.1741,0.175,0.1759,0.1766,0.1774,0.178,0.1787,0.1794,0.1801,0.1809,0.182,0.1834,0.1853,0.1878,0.1911,0.1955,0.2009,0.2076,0.2154,0.2243,0.234,0.2443,0.255,0.2658,0.2767,0.2874,0.298,0.3084,0.3185,0.3282,0.3373,0.3457,0.3531,0.3594], y4: [0.4112,0.4138,0.4169,0.4205,0.4245,0.429,0.4339,0.439,0.4444,0.45,0.4558,0.4616,0.4675,0.4734,0.4792,0.485,0.4907,0.4964,0.502,0.5076,0.5131,0.5185,0.5237,0.5289,0.5339,0.5387,0.5434,0.5478,0.5521,0.5562,0.5601,0.5638,0.5673,0.5708,0.5741,0.5774,0.5807,0.5839,0.5871,0.5903,0.5933,0.5963,0.5993,0.6021,0.6048,0.6074,0.6098,0.6122,0.6144,0.6166,0.6185,0.6203,0.6219,0.6234,0.6246,0.6256,0.6263,0.6269,0.6271,0.6271,0.6269,0.6265,0.6259,0.6253,0.6247,0.624,0.6235,0.6231,0.6228,0.6226,0.6226,0.6227,0.623,0.6235,0.624,0.6246,0.625,0.6249,0.6242,0.6223,0.6189,0.6138,0.6067,0.5978,0.5872,0.5756,0.5636,0.552,0.5415,0.5324,0.5251,0.5196,0.5155,0.5127,0.5109,0.5098,0.509,0.5086,0.5083,0.5082], x5: [0.0917,0.0934,0.0954,0.0975,0.0997,0.102,0.1042,0.1065,0.1086,0.1107,0.1127,0.1146,0.1164,0.1182,0.1198,0.1214,0.1228,0.1242,0.1254,0.1265,0.1276,0.1286,0.1296,0.1306,0.1315,0.1325,0.1335,0.1345,0.1355,0.1366,0.1377,0.1389,0.14,0.1412,0.1423,0.1435,0.1447,0.1458,0.1469,0.1481,0.1493,0.1505,0.1517,0.153,0.1543,0.1557,0.1572,0.1587,0.1604,0.1621,0.1639,0.1657,0.1675,0.1694,0.1712,0.1729,0.1745,0.1761,0.1776,0.1789,0.1803,0.1815,0.1827,0.1838,0.1849,0.1859,0.187,0.188,0.1891,0.1902,0.1913,0.1925,0.1937,0.1951,0.1965,0.198,0.1997,0.2016,0.2037,0.2061,0.2088,0.2119,0.2155,0.2195,0.2239,0.2287,0.2337,0.2387,0.2435,0.2479,0.2517,0.2547,0.2567,0.2578,0.2579,0.2571,0.2555,0.2534,0.251,0.2485], y5: [0.3868,0.3872,0.3878,0.3885,0.3894,0.3905,0.3919,0.3934,0.3952,0.3973,0.3995,0.402,0.4047,0.4075,0.4104,0.4134,0.4165,0.4196,0.4227,0.4259,0.4291,0.4324,0.4357,0.439,0.4423,0.4456,0.4487,0.4517,0.4545,0.457,0.4592,0.4612,0.463,0.4645,0.466,0.4673,0.4686,0.4699,0.4711,0.4724,0.4736,0.4748,0.476,0.4771,0.4781,0.4791,0.4799,0.4806,0.4811,0.4815,0.4817,0.4817,0.4815,0.4812,0.4808,0.4802,0.4795,0.4786,0.4776,0.4764,0.475,0.4735,0.4717,0.4698,0.4678,0.4656,0.4634,0.4612,0.4589,0.4565,0.454,0.4515,0.4487,0.4458,0.4425,0.4388,0.4344,0.4292,0.4228,0.4149,0.4051,0.3933,0.3796,0.364,0.3473,0.3303,0.3139,0.2989,0.2861,0.2759,0.2684,0.2636,0.2609,0.2601,0.2607,0.2623,0.2645,0.2671,0.2697,0.2722], x6: [0.0559,0.0571,0.0583,0.0597,0.0611,0.0625,0.0639,0.0653,0.0665,0.0678,0.069,0.0702,0.0713,0.0724,0.0735,0.0745,0.0754,0.0763,0.0772,0.0779,0.0786,0.0792,0.0798,0.0804,0.081,0.0816,0.0822,0.0828,0.0835,0.0842,0.0849,0.0857,0.0864,0.0872,0.0879,0.0887,0.0894,0.0902,0.0909,0.0917,0.0925,0.0934,0.0942,0.0951,0.096,0.0969,0.0979,0.0989,0.1,0.101,0.1022,0.1033,0.1044,0.1055,0.1066,0.1077,0.1087,0.1096,0.1105,0.1113,0.1121,0.1128,0.1135,0.1141,0.1147,0.1153,0.1158,0.1164,0.117,0.1176,0.1183,0.1192,0.1201,0.1213,0.1228,0.1248,0.1273,0.1308,0.1353,0.1413,0.1489,0.1582,0.1692,0.1818,0.1955,0.2099,0.2247,0.2394,0.2537,0.2675,0.2808,0.2934,0.3054,0.3167,0.3275,0.3375,0.3468,0.3551,0.3623,0.3684], y6: [0.334,0.3321,0.3299,0.3274,0.3249,0.3224,0.3199,0.3176,0.3155,0.3136,0.312,0.3105,0.3093,0.3083,0.3074,0.3066,0.306,0.3054,0.305,0.3046,0.3042,0.3039,0.3036,0.3033,0.303,0.3027,0.3024,0.3021,0.3017,0.3013,0.3008,0.3003,0.2997,0.2992,0.2985,0.2979,0.2973,0.2966,0.2959,0.2952,0.2945,0.2937,0.2929,0.2921,0.2913,0.2904,0.2894,0.2883,0.2872,0.2859,0.2846,0.2832,0.2817,0.2801,0.2784,0.2765,0.2746,0.2726,0.2706,0.2684,0.2661,0.2637,0.2611,0.2584,0.2556,0.2525,0.2492,0.2456,0.2417,0.2376,0.2331,0.2283,0.2232,0.2176,0.2116,0.2053,0.1985,0.1913,0.1839,0.1761,0.1683,0.1604,0.1527,0.1453,0.1385,0.1324,0.127,0.1226,0.1189,0.1161,0.114,0.1124,0.1113,0.1105,0.1099,0.1094,0.1091,0.1088,0.1086,0.1085], x7: [0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.0011,0.0011,0.0011,0.0012,0.0013,0.0014,0.0015,0.0016,0.0017,0.0019,0.002,0.0021,0.0023,0.0024,0.0025,0.0026,0.0027,0.0028,0.0029,0.0029,0.0029,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0031,0.0031,0.0031,0.0032,0.0033,0.0034,0.0034,0.0035,0.0036,0.0037,0.0038,0.0038,0.0038,0.0038,0.0038,0.0037,0.0037,0.0036,0.0036,0.0035,0.0035,0.0036,0.0037,0.0038,0.004,0.0041,0.0043,0.0045,0.0046,0.0047,0.0048,0.0048,0.0049,0.0049,0.0049,0.0049,0.005,0.0051,0.0051,0.0052,0.0053,0.0054,0.0055,0.0055,0.0055,0.0054,0.0054,0.0053,0.0052,0.0052,0.0051,0.0051,0.0051,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005], y7: [0.3337,0.3317,0.3294,0.327,0.3244,0.3218,0.3192,0.3168,0.3146,0.3127,0.3109,0.3094,0.308,0.3069,0.3058,0.3049,0.3041,0.3034,0.3027,0.3021,0.3016,0.3011,0.3006,0.3001,0.2997,0.2992,0.2988,0.2983,0.2978,0.2973,0.2967,0.2961,0.2954,0.2947,0.294,0.2932,0.2925,0.2917,0.2909,0.29,0.2892,0.2883,0.2874,0.2865,0.2856,0.2846,0.2835,0.2824,0.2811,0.2798,0.2784,0.2769,0.2753,0.2736,0.2717,0.2698,0.2677,0.2656,0.2633,0.2609,0.2584,0.2557,0.2529,0.25,0.2469,0.2436,0.2401,0.2364,0.2323,0.228,0.2233,0.2183,0.213,0.2074,0.2016,0.1957,0.1898,0.1841,0.1788,0.1742,0.1703,0.1674,0.1654,0.1645,0.1646,0.1654,0.1668,0.1684,0.1701,0.1714,0.1723,0.1725,0.1721,0.171,0.1694,0.1673,0.165,0.1625,0.1602,0.158] };
  const F94B = { x0: [0.1573,0.1582,0.1593,0.1604,0.1617,0.163,0.1642,0.1655,0.1667,0.1679,0.1689,0.1699,0.1708,0.1715,0.1722,0.1728,0.1734,0.1738,0.1742,0.1746,0.1749,0.1751,0.1753,0.1755,0.1756,0.1757,0.1758,0.1758,0.1758,0.1758,0.1757,0.1755,0.1754,0.1751,0.1748,0.1743,0.1736,0.1728,0.1716,0.17,0.1679,0.165,0.1611,0.1559,0.1493,0.141,0.131,0.1194,0.1066,0.0929,0.0791,0.0657,0.0534,0.0426,0.0335,0.0263,0.0208,0.0169,0.0141,0.0123,0.0112,0.0105,0.0101,0.0099,0.0097,0.0096,0.0095,0.0094,0.0094,0.0093,0.0093,0.0093,0.0094,0.0094,0.0095,0.0095,0.0096,0.0097,0.0097,0.0098,0.0098,0.0098,0.0098,0.0097,0.0097,0.0097,0.0097,0.0096,0.0096,0.0096,0.0096,0.0097,0.0097,0.0097,0.0097,0.0097,0.0098,0.0097,0.0097,0.0097,0.0097,0.0096,0.0095,0.0095,0.0094,0.0093,0.0092,0.0092,0.0091,0.0091,0.009,0.009,0.009,0.0089,0.0089,0.0088,0.0088,0.0087,0.0086,0.0085,0.0085,0.0084,0.0083,0.0082,0.0082,0.0081,0.0081,0.0081,0.008,0.008,0.008,0.008,0.008,0.0081,0.0081,0.0082,0.0082,0.0083,0.0084,0.0084,0.0085,0.0085,0.0086,0.0086,0.0085,0.0085,0.0084,0.0083,0.0082,0.0081,0.0079,0.0079,0.0078,0.0078,0.0078,0.0078,0.0078,0.0078,0.0079,0.0079,0.0079,0.0079,0.0079,0.0078,0.0078,0.0077,0.0076,0.0075,0.0075,0.0074,0.0073,0.0073,0.0072,0.0072,0.0072,0.0072,0.0072,0.0071,0.0071,0.0071,0.0071,0.007,0.0069,0.0067,0.0065,0.0063,0.0061,0.0058,0.0056,0.0053,0.005,0.0048,0.0046,0.0044,0.0043,0.0041,0.004,0.0039,0.0038,0.0037,0.0036,0.0036,0.0035,0.0034,0.0033,0.0032,0.0032,0.0031,0.0031,0.0031,0.003,0.003,0.003,0.003,0.0029,0.0029,0.0028,0.0028,0.0027,0.0026,0.0025,0.0025,0.0024,0.0023,0.0022,0.0022,0.0022,0.0022,0.0022,0.0023,0.0024,0.0026,0.0027,0.0029,0.0031,0.0033,0.0035,0.0037,0.0038,0.0039,0.0039,0.0038,0.0036,0.0034,0.003,0.0026,0.0022,0.0018,0.0014,0.0011], y0: [0.6911,0.6897,0.688,0.6861,0.6841,0.682,0.6799,0.6777,0.6756,0.6735,0.6715,0.6697,0.668,0.6664,0.6649,0.6636,0.6623,0.6612,0.6603,0.6594,0.6586,0.6578,0.6572,0.6567,0.6562,0.6557,0.6554,0.655,0.6548,0.6545,0.6543,0.6542,0.654,0.654,0.6539,0.654,0.6541,0.6544,0.6548,0.6555,0.6565,0.6581,0.6605,0.6643,0.6699,0.6781,0.6897,0.7054,0.7257,0.7509,0.7806,0.8141,0.85,0.8866,0.9223,0.9553,0.9843,1.0086,1.0278,1.0422,1.0524,1.059,1.063,1.065,1.0657,1.0654,1.0647,1.0636,1.0624,1.061,1.0596,1.0581,1.0567,1.0552,1.0537,1.0522,1.0507,1.0492,1.0477,1.0462,1.0446,1.0431,1.0415,1.04,1.0384,1.0368,1.0352,1.0337,1.0321,1.0305,1.0288,1.0272,1.0256,1.0239,1.0223,1.0206,1.0189,1.0172,1.0155,1.0138,1.0121,1.0104,1.0087,1.0069,1.0052,1.0034,1.0017,0.9999,0.9981,0.9964,0.9946,0.9928,0.9909,0.9891,0.9873,0.9854,0.9836,0.9817,0.9797,0.9778,0.9759,0.9739,0.9719,0.9699,0.9679,0.9659,0.9638,0.9617,0.9596,0.9575,0.9553,0.9531,0.9509,0.9486,0.9464,0.944,0.9417,0.9393,0.9369,0.9344,0.9319,0.9293,0.9267,0.9241,0.9214,0.9187,0.916,0.9132,0.9104,0.9075,0.9046,0.9017,0.8988,0.8959,0.8929,0.8899,0.8869,0.8839,0.8809,0.8779,0.8748,0.8718,0.8687,0.8656,0.8625,0.8594,0.8562,0.8531,0.8499,0.8467,0.8436,0.8404,0.8372,0.834,0.8308,0.8276,0.8243,0.8211,0.8177,0.8144,0.811,0.8076,0.8041,0.8005,0.7969,0.7933,0.7895,0.7857,0.7818,0.7778,0.7738,0.7698,0.7656,0.7615,0.7573,0.753,0.7487,0.7443,0.7399,0.7355,0.731,0.7264,0.7217,0.717,0.7122,0.7073,0.7024,0.6973,0.6922,0.687,0.6818,0.6765,0.6711,0.6657,0.6602,0.6547,0.6492,0.6436,0.638,0.6324,0.6267,0.621,0.6153,0.6096,0.604,0.5985,0.5931,0.5879,0.5829,0.5781,0.5737,0.5696,0.5657,0.562,0.5586,0.5551,0.5516,0.5477,0.5433,0.5382,0.5322,0.5251,0.5168,0.5075,0.4972,0.4863,0.4751,0.4642,0.4539,0.4447], x1: [0.2205,0.2218,0.2233,0.2249,0.2266,0.2284,0.2302,0.2321,0.2339,0.2357,0.2374,0.239,0.2406,0.2421,0.2436,0.2449,0.2463,0.2476,0.2488,0.25,0.2512,0.2524,0.2535,0.2546,0.2557,0.2567,0.2577,0.2587,0.2596,0.2605,0.2612,0.2619,0.2626,0.2631,0.2636,0.2639,0.2641,0.264,0.2637,0.2631,0.262,0.2603,0.2577,0.2541,0.2492,0.2428,0.2347,0.2249,0.2134,0.2007,0.187,0.1731,0.1594,0.1465,0.135,0.1251,0.1171,0.1107,0.106,0.1027,0.1006,0.0992,0.0985,0.0983,0.0983,0.0985,0.0989,0.0993,0.0998,0.1004,0.101,0.1016,0.1022,0.1028,0.1034,0.1039,0.1045,0.105,0.1055,0.106,0.1064,0.1068,0.1072,0.1075,0.1078,0.1081,0.1084,0.1086,0.1088,0.109,0.1092,0.1093,0.1095,0.1096,0.1097,0.1098,0.1098,0.1099,0.1099,0.1099,0.11,0.11,0.11,0.11,0.11,0.11,0.1099,0.1099,0.1098,0.1098,0.1097,0.1096,0.1095,0.1094,0.1093,0.1092,0.109,0.1089,0.1088,0.1087,0.1085,0.1084,0.1082,0.108,0.1078,0.1077,0.1075,0.1073,0.107,0.1068,0.1065,0.1063,0.106,0.1057,0.1054,0.1051,0.1047,0.1043,0.1039,0.1035,0.103,0.1025,0.102,0.1014,0.1008,0.1002,0.0996,0.0989,0.0982,0.0974,0.0967,0.0959,0.0951,0.0943,0.0935,0.0927,0.0918,0.091,0.0901,0.0892,0.0884,0.0875,0.0866,0.0857,0.0848,0.0838,0.0829,0.0819,0.081,0.08,0.079,0.078,0.077,0.076,0.075,0.074,0.073,0.072,0.071,0.07,0.069,0.068,0.0669,0.0659,0.0649,0.0638,0.0627,0.0617,0.0606,0.0596,0.0585,0.0575,0.0565,0.0555,0.0545,0.0536,0.0527,0.0518,0.0509,0.0501,0.0492,0.0483,0.0475,0.0466,0.0456,0.0447,0.0438,0.0429,0.042,0.0412,0.0405,0.0398,0.0391,0.0386,0.038,0.0376,0.0371,0.0367,0.0362,0.0358,0.0353,0.0348,0.0343,0.0338,0.0333,0.0328,0.0323,0.0318,0.0314,0.0309,0.0304,0.0298,0.0292,0.0285,0.0278,0.027,0.0261,0.0253,0.0246,0.0241,0.024,0.0244,0.0254,0.027,0.0291,0.0319,0.035,0.0384,0.0419,0.0452], y1: [0.6496,0.6481,0.6463,0.6442,0.6421,0.6398,0.6374,0.6351,0.6327,0.6304,0.6282,0.626,0.624,0.6221,0.6203,0.6186,0.617,0.6155,0.614,0.6127,0.6113,0.61,0.6087,0.6074,0.6062,0.6049,0.6037,0.6025,0.6013,0.6002,0.599,0.5979,0.5969,0.5958,0.5948,0.5939,0.5931,0.5924,0.592,0.5918,0.5921,0.593,0.5948,0.5978,0.6024,0.6089,0.6178,0.6293,0.6435,0.6605,0.6798,0.7009,0.7229,0.7451,0.7664,0.7862,0.8037,0.8186,0.8308,0.8403,0.8476,0.8528,0.8564,0.8588,0.8602,0.861,0.8612,0.8611,0.8608,0.8602,0.8596,0.8588,0.858,0.8571,0.8561,0.8552,0.8542,0.8531,0.8521,0.851,0.8499,0.8488,0.8476,0.8464,0.8452,0.8439,0.8427,0.8414,0.8401,0.8387,0.8374,0.836,0.8347,0.8333,0.8319,0.8305,0.829,0.8275,0.8261,0.8246,0.823,0.8215,0.8199,0.8184,0.8167,0.8151,0.8134,0.8118,0.8101,0.8084,0.8067,0.805,0.8034,0.8017,0.8001,0.7985,0.797,0.7955,0.794,0.7925,0.791,0.7895,0.788,0.7864,0.7848,0.783,0.7812,0.7793,0.7774,0.7753,0.7732,0.771,0.7688,0.7665,0.7641,0.7617,0.7592,0.7567,0.7541,0.7515,0.7488,0.7461,0.7433,0.7406,0.7377,0.7349,0.732,0.7291,0.7262,0.7232,0.7202,0.7172,0.7142,0.7111,0.7081,0.705,0.7019,0.6988,0.6956,0.6925,0.6893,0.6862,0.683,0.6799,0.6768,0.6737,0.6706,0.6676,0.6645,0.6616,0.6587,0.6558,0.6529,0.6502,0.6475,0.6448,0.6423,0.6398,0.6374,0.6351,0.6328,0.6307,0.6287,0.6269,0.6251,0.6234,0.6219,0.6204,0.6189,0.6174,0.6159,0.6143,0.6125,0.6106,0.6086,0.6064,0.604,0.6014,0.5987,0.5959,0.593,0.59,0.587,0.5839,0.5808,0.5778,0.575,0.5722,0.5696,0.5672,0.5649,0.5628,0.5608,0.5589,0.5572,0.5556,0.5542,0.5529,0.5517,0.5506,0.5497,0.5488,0.5479,0.5471,0.5463,0.5454,0.5444,0.5431,0.5416,0.5397,0.5374,0.5345,0.5309,0.5267,0.5219,0.5164,0.5105,0.5042,0.4977,0.4911,0.4845,0.4779,0.4716,0.4654,0.4593,0.4534,0.4477,0.4422,0.437,0.4322], x2: [0.2433,0.2445,0.246,0.2478,0.2499,0.2523,0.255,0.258,0.2612,0.2647,0.2683,0.272,0.2759,0.2798,0.2837,0.2877,0.2917,0.2957,0.2997,0.3038,0.3078,0.3119,0.3159,0.3199,0.3239,0.3278,0.3317,0.3354,0.3391,0.3427,0.3462,0.3497,0.3531,0.3564,0.3597,0.3628,0.3658,0.3685,0.3708,0.3726,0.3737,0.374,0.3732,0.371,0.3672,0.3615,0.3537,0.3437,0.3317,0.3179,0.3029,0.2872,0.2716,0.2568,0.2435,0.2321,0.2229,0.2157,0.2106,0.2071,0.2049,0.2036,0.203,0.2027,0.2027,0.2027,0.2028,0.203,0.2031,0.2034,0.2036,0.2039,0.2042,0.2045,0.2048,0.2051,0.2055,0.2058,0.2061,0.2064,0.2067,0.2069,0.2072,0.2074,0.2076,0.2078,0.208,0.2082,0.2083,0.2085,0.2086,0.2087,0.2088,0.2089,0.209,0.209,0.2091,0.2092,0.2093,0.2094,0.2095,0.2095,0.2096,0.2097,0.2098,0.2098,0.2099,0.2099,0.2099,0.2099,0.2099,0.2098,0.2097,0.2095,0.2092,0.2089,0.2085,0.2079,0.2073,0.2066,0.2059,0.2051,0.2044,0.2037,0.2031,0.2025,0.2021,0.2018,0.2015,0.2013,0.2012,0.2011,0.2011,0.201,0.201,0.201,0.201,0.2009,0.2009,0.2008,0.2008,0.2006,0.2005,0.2003,0.2001,0.1998,0.1995,0.1991,0.1986,0.1981,0.1976,0.197,0.1964,0.1957,0.195,0.1942,0.1934,0.1926,0.1918,0.191,0.1901,0.1892,0.1883,0.1873,0.1862,0.1851,0.184,0.1827,0.1814,0.1801,0.1786,0.177,0.1754,0.1737,0.1719,0.1701,0.1681,0.1662,0.1642,0.1622,0.1602,0.1583,0.1564,0.1546,0.153,0.1514,0.15,0.1486,0.1472,0.1458,0.1443,0.1425,0.1405,0.1381,0.1352,0.1318,0.128,0.1236,0.1188,0.1135,0.108,0.1021,0.0961,0.09,0.0841,0.0784,0.0731,0.0682,0.0639,0.0601,0.0568,0.054,0.0516,0.0496,0.0479,0.0464,0.045,0.0439,0.0428,0.0419,0.041,0.0403,0.0397,0.0394,0.0392,0.0393,0.0396,0.0402,0.0409,0.0417,0.0425,0.0433,0.0439,0.0442,0.0443,0.0441,0.0436,0.0428,0.0421,0.0416,0.0414,0.042,0.0435,0.0461,0.05,0.0552,0.0614,0.0684,0.0759,0.0833], y2: [0.5601,0.5585,0.5567,0.5549,0.5531,0.5514,0.5498,0.5484,0.5472,0.5464,0.5458,0.5454,0.5453,0.5454,0.5457,0.5461,0.5466,0.5472,0.5479,0.5486,0.5493,0.5501,0.5508,0.5516,0.5524,0.5531,0.5539,0.5546,0.5554,0.5561,0.5568,0.5574,0.5581,0.5587,0.5593,0.5599,0.5604,0.561,0.5615,0.5621,0.5627,0.5634,0.5642,0.5654,0.567,0.5692,0.5721,0.5761,0.581,0.5871,0.5941,0.6018,0.6099,0.6179,0.6254,0.632,0.6374,0.6416,0.6445,0.6463,0.6472,0.6475,0.6474,0.6471,0.6466,0.6462,0.6457,0.6451,0.6446,0.6441,0.6434,0.6428,0.6421,0.6413,0.6405,0.6397,0.6389,0.638,0.6371,0.6362,0.6353,0.6344,0.6335,0.6325,0.6316,0.6306,0.6296,0.6286,0.6276,0.6265,0.6254,0.6243,0.6232,0.622,0.6208,0.6196,0.6183,0.617,0.6157,0.6144,0.613,0.6116,0.6101,0.6087,0.6072,0.6057,0.6042,0.6026,0.6011,0.5995,0.598,0.5965,0.595,0.5935,0.5921,0.5908,0.5895,0.5882,0.587,0.5858,0.5845,0.5833,0.5821,0.5808,0.5794,0.578,0.5764,0.5748,0.5731,0.5714,0.5696,0.5677,0.5658,0.5638,0.5618,0.5597,0.5576,0.5555,0.5533,0.5512,0.5489,0.5467,0.5444,0.5421,0.5398,0.5374,0.5351,0.5327,0.5303,0.528,0.5256,0.5232,0.5208,0.5183,0.5159,0.5134,0.5109,0.5084,0.5058,0.5032,0.5006,0.4979,0.4953,0.4926,0.49,0.4873,0.4847,0.4821,0.4796,0.4771,0.4747,0.4723,0.47,0.4678,0.4656,0.4635,0.4615,0.4597,0.4581,0.4568,0.4558,0.4553,0.4555,0.4564,0.4581,0.4607,0.4642,0.4683,0.473,0.4781,0.4832,0.4881,0.4925,0.4965,0.4998,0.5025,0.5046,0.5063,0.5075,0.5084,0.5092,0.5097,0.5102,0.5105,0.5108,0.511,0.5111,0.5111,0.511,0.5109,0.5106,0.5103,0.5098,0.5092,0.5085,0.5076,0.5064,0.5051,0.5034,0.5015,0.4993,0.4968,0.494,0.491,0.4878,0.4845,0.4812,0.478,0.4748,0.4718,0.4689,0.4663,0.4638,0.4616,0.4595,0.4576,0.4558,0.454,0.4521,0.4501,0.4478,0.4453,0.4425,0.4395,0.4363,0.433,0.4296,0.4265,0.4235,0.4209], x3: [0.3208,0.3235,0.3267,0.3302,0.3342,0.3384,0.3429,0.3475,0.3523,0.3572,0.3621,0.367,0.3719,0.3767,0.3816,0.3865,0.3914,0.3964,0.4014,0.4064,0.4114,0.4165,0.4217,0.4268,0.4319,0.4369,0.4419,0.4469,0.4517,0.4565,0.4613,0.466,0.4707,0.4754,0.4801,0.4846,0.4891,0.4932,0.497,0.5003,0.503,0.505,0.5062,0.5064,0.5055,0.5034,0.5,0.4952,0.4892,0.4821,0.4742,0.4658,0.4573,0.4493,0.442,0.4357,0.4306,0.4266,0.4237,0.4216,0.4202,0.4192,0.4184,0.4177,0.4171,0.4165,0.416,0.4156,0.4153,0.4151,0.4151,0.4152,0.4154,0.4157,0.416,0.4164,0.4168,0.4173,0.4177,0.4182,0.4187,0.4192,0.4197,0.4203,0.4208,0.4214,0.422,0.4226,0.4232,0.4237,0.4242,0.4247,0.4251,0.4255,0.4258,0.4261,0.4263,0.4266,0.4268,0.427,0.4272,0.4274,0.4275,0.4276,0.4277,0.4278,0.4278,0.4278,0.4277,0.4277,0.4275,0.4274,0.4271,0.4267,0.4263,0.4256,0.4248,0.4239,0.4228,0.4216,0.4202,0.4189,0.4176,0.4165,0.4154,0.4146,0.4139,0.4135,0.4132,0.413,0.4129,0.4129,0.4129,0.4129,0.4129,0.4129,0.4129,0.4129,0.4128,0.4127,0.4126,0.4125,0.4123,0.4121,0.4118,0.4115,0.4111,0.4107,0.4102,0.4097,0.4091,0.4085,0.4077,0.407,0.4061,0.4053,0.4044,0.4035,0.4026,0.4016,0.4006,0.3996,0.3985,0.3974,0.3962,0.3949,0.3934,0.3919,0.3903,0.3885,0.3865,0.3845,0.3822,0.3799,0.3774,0.3748,0.3721,0.3693,0.3664,0.3634,0.3604,0.3574,0.3543,0.3512,0.3481,0.345,0.3418,0.3386,0.3353,0.332,0.3285,0.3248,0.321,0.3169,0.3126,0.3079,0.303,0.2978,0.2922,0.2864,0.2804,0.2742,0.268,0.2617,0.2556,0.2495,0.2436,0.2379,0.2325,0.2272,0.2221,0.2172,0.2124,0.2079,0.2035,0.1994,0.1955,0.1919,0.1886,0.1855,0.1827,0.1802,0.1779,0.1759,0.1741,0.1725,0.1712,0.1701,0.1691,0.1683,0.1676,0.1669,0.1662,0.1654,0.1645,0.1634,0.1623,0.1611,0.1599,0.1588,0.1578,0.1571,0.1568,0.157,0.1577,0.1588,0.1604,0.1623,0.1644,0.1666], y3: [0.5373,0.5377,0.5381,0.5385,0.5391,0.5396,0.5402,0.5408,0.5414,0.5421,0.5427,0.5433,0.544,0.5447,0.5453,0.5459,0.5466,0.5472,0.5478,0.5484,0.549,0.5496,0.5501,0.5506,0.5511,0.5516,0.552,0.5523,0.5526,0.5529,0.5531,0.5533,0.5534,0.5534,0.5534,0.5533,0.5533,0.5532,0.5531,0.5531,0.5531,0.5531,0.5533,0.5536,0.554,0.5546,0.5552,0.5561,0.557,0.5581,0.5592,0.5603,0.5613,0.5623,0.5631,0.5637,0.5642,0.5644,0.5645,0.5644,0.5642,0.5639,0.5636,0.5631,0.5626,0.5621,0.5615,0.5609,0.5602,0.5596,0.5589,0.5581,0.5574,0.5566,0.5559,0.5551,0.5544,0.5537,0.553,0.5524,0.5518,0.5513,0.5508,0.5505,0.5503,0.5501,0.55,0.5499,0.5498,0.5497,0.5496,0.5494,0.5491,0.5487,0.5482,0.5476,0.5469,0.5462,0.5454,0.5445,0.5436,0.5425,0.5414,0.5403,0.539,0.5375,0.536,0.5344,0.5327,0.5309,0.5291,0.5273,0.5256,0.524,0.5225,0.5211,0.5198,0.5187,0.5176,0.5165,0.5155,0.5145,0.5136,0.5126,0.5116,0.5106,0.5095,0.5084,0.5073,0.5061,0.505,0.5038,0.5025,0.5013,0.5,0.4986,0.4972,0.4958,0.4942,0.4925,0.4906,0.4887,0.4866,0.4843,0.482,0.4797,0.4773,0.475,0.4728,0.4707,0.4687,0.4668,0.4649,0.4632,0.4614,0.4597,0.458,0.4563,0.4545,0.4528,0.4511,0.4493,0.4476,0.4459,0.4442,0.4425,0.4408,0.4392,0.4376,0.436,0.4346,0.4332,0.4319,0.4306,0.4296,0.4286,0.4278,0.4271,0.4265,0.4262,0.426,0.426,0.4263,0.4268,0.4277,0.4288,0.4302,0.4319,0.4338,0.4357,0.4377,0.4395,0.4412,0.4427,0.444,0.445,0.4458,0.4464,0.4468,0.4471,0.4473,0.4474,0.4474,0.4473,0.4471,0.4468,0.4465,0.4461,0.4456,0.445,0.4445,0.4439,0.4432,0.4425,0.4418,0.4411,0.4403,0.4395,0.4387,0.4378,0.4368,0.4359,0.4348,0.4337,0.4325,0.4313,0.4301,0.4288,0.4276,0.4264,0.4253,0.4242,0.4232,0.4223,0.4215,0.4207,0.4201,0.4195,0.419,0.4185,0.418,0.4174,0.4168,0.4162,0.4154,0.4146,0.4138,0.4129,0.4121,0.4113], x4: [0.4056,0.4085,0.4118,0.4156,0.4197,0.4242,0.4288,0.4337,0.4387,0.4439,0.449,0.4543,0.4595,0.4648,0.4701,0.4754,0.4807,0.4861,0.4914,0.4968,0.5021,0.5075,0.5129,0.5182,0.5236,0.5289,0.5342,0.5395,0.5448,0.5501,0.5554,0.5606,0.5658,0.5709,0.576,0.581,0.5857,0.5903,0.5947,0.5987,0.6024,0.6058,0.6089,0.6116,0.614,0.6161,0.618,0.6197,0.6213,0.6227,0.624,0.6252,0.6263,0.6274,0.6283,0.6292,0.6299,0.6304,0.6308,0.631,0.6311,0.631,0.6308,0.6306,0.6303,0.63,0.6297,0.6295,0.6293,0.6292,0.6292,0.6292,0.6293,0.6294,0.6295,0.6297,0.6298,0.6299,0.63,0.6301,0.6302,0.6302,0.6303,0.6304,0.6305,0.6306,0.6306,0.6307,0.6307,0.6307,0.6306,0.6306,0.6305,0.6304,0.6304,0.6303,0.6302,0.6302,0.6301,0.6301,0.63,0.63,0.63,0.63,0.63,0.63,0.63,0.63,0.63,0.63,0.6299,0.6299,0.6298,0.6297,0.6296,0.6293,0.6291,0.6287,0.6283,0.6278,0.6273,0.6268,0.6263,0.6258,0.6255,0.6252,0.625,0.6248,0.6247,0.6247,0.6247,0.6248,0.6248,0.6248,0.6248,0.6248,0.6248,0.6248,0.6247,0.6246,0.6244,0.6243,0.6241,0.6238,0.6235,0.6232,0.6229,0.6225,0.6221,0.6217,0.6213,0.6208,0.6204,0.6199,0.6193,0.6187,0.6181,0.6174,0.6166,0.6157,0.6147,0.6136,0.6123,0.6109,0.6094,0.6077,0.6058,0.6038,0.6016,0.5991,0.5965,0.5937,0.5907,0.5875,0.5841,0.5805,0.5767,0.5728,0.5687,0.5645,0.56,0.5555,0.5508,0.546,0.541,0.536,0.5308,0.5255,0.5202,0.5148,0.5093,0.5037,0.4981,0.4924,0.4866,0.4808,0.4749,0.469,0.4631,0.4571,0.4511,0.4451,0.4391,0.4331,0.4271,0.4211,0.4151,0.409,0.403,0.397,0.3911,0.3851,0.3792,0.3733,0.3674,0.3615,0.3558,0.3501,0.3444,0.3389,0.3335,0.3283,0.3232,0.3182,0.3135,0.309,0.3047,0.3007,0.297,0.2935,0.2903,0.2874,0.2848,0.2824,0.2802,0.2782,0.2764,0.2746,0.2728,0.2709,0.2689,0.2667,0.2643,0.2616,0.2587,0.2557,0.2525,0.2493,0.2462,0.2433], y4: [0.5112,0.5115,0.5119,0.5123,0.5127,0.5131,0.5135,0.5139,0.5142,0.5145,0.5148,0.515,0.5151,0.5152,0.5151,0.515,0.5148,0.5144,0.5139,0.5134,0.5127,0.5118,0.5109,0.5099,0.5089,0.5077,0.5065,0.5052,0.5037,0.5022,0.5006,0.4989,0.497,0.4951,0.493,0.4909,0.4889,0.4869,0.4852,0.4836,0.4823,0.4812,0.4805,0.4799,0.4796,0.4794,0.4792,0.4791,0.4788,0.4785,0.478,0.4774,0.4767,0.476,0.4752,0.4746,0.4741,0.4738,0.4737,0.4739,0.4744,0.4751,0.4759,0.4768,0.4778,0.4787,0.4795,0.4801,0.4805,0.4807,0.4806,0.4804,0.4799,0.4794,0.4788,0.478,0.4773,0.4765,0.4757,0.4749,0.4741,0.4733,0.4724,0.4716,0.4708,0.4699,0.4691,0.4682,0.4674,0.4666,0.4657,0.4649,0.4641,0.4632,0.4624,0.4615,0.4607,0.4598,0.4589,0.458,0.4571,0.4562,0.4553,0.4544,0.4534,0.4525,0.4515,0.4506,0.4497,0.4488,0.448,0.4473,0.4467,0.4462,0.4458,0.4457,0.4457,0.446,0.4464,0.447,0.4476,0.4483,0.4489,0.4494,0.4497,0.4499,0.4499,0.4496,0.4492,0.4486,0.4479,0.4471,0.4461,0.4451,0.4441,0.443,0.4419,0.4407,0.4395,0.4383,0.437,0.4358,0.4346,0.4334,0.4322,0.431,0.4299,0.4289,0.4279,0.427,0.4261,0.4253,0.4246,0.4238,0.4231,0.4224,0.4216,0.4207,0.4198,0.4188,0.4177,0.4165,0.4152,0.4139,0.4126,0.4111,0.4097,0.4083,0.4068,0.4054,0.404,0.4027,0.4013,0.4001,0.3988,0.3976,0.3965,0.3955,0.3945,0.3935,0.3926,0.3918,0.391,0.3902,0.3895,0.3888,0.3882,0.3875,0.387,0.3864,0.3859,0.3853,0.3848,0.3844,0.3839,0.3834,0.383,0.3826,0.3822,0.3818,0.3815,0.3811,0.3808,0.3805,0.3802,0.3799,0.3796,0.3793,0.379,0.3788,0.3785,0.3782,0.378,0.3777,0.3775,0.3773,0.3771,0.3769,0.3767,0.3765,0.3763,0.3761,0.376,0.3758,0.3757,0.3756,0.3756,0.3756,0.3756,0.3757,0.3758,0.376,0.3763,0.3766,0.377,0.3774,0.378,0.3786,0.3792,0.3799,0.3806,0.3814,0.3822,0.383,0.3839,0.3846,0.3854,0.3861,0.3867,0.3872], x5: [0.4194,0.4218,0.4246,0.4276,0.431,0.4346,0.4385,0.4427,0.4472,0.4518,0.4567,0.4617,0.4669,0.4722,0.4777,0.4832,0.4887,0.4943,0.4999,0.5055,0.5111,0.5167,0.5223,0.5277,0.5332,0.5385,0.5438,0.549,0.554,0.559,0.5638,0.5684,0.573,0.5773,0.5815,0.5856,0.5894,0.5931,0.5966,0.5999,0.6031,0.606,0.6088,0.6114,0.6138,0.616,0.6181,0.62,0.6218,0.6234,0.6249,0.6262,0.6274,0.6285,0.6295,0.6304,0.6312,0.6319,0.6325,0.633,0.6335,0.6339,0.6342,0.6345,0.6348,0.635,0.6352,0.6353,0.6354,0.6355,0.6356,0.6356,0.6356,0.6356,0.6356,0.6356,0.6356,0.6355,0.6355,0.6354,0.6353,0.6352,0.6352,0.6351,0.635,0.6349,0.6348,0.6347,0.6345,0.6344,0.6343,0.6342,0.6341,0.634,0.6339,0.6338,0.6337,0.6336,0.6335,0.6334,0.6333,0.6332,0.6331,0.633,0.6329,0.6328,0.6326,0.6325,0.6324,0.6322,0.6321,0.6319,0.6317,0.6315,0.6312,0.6309,0.6306,0.6303,0.6299,0.6294,0.6289,0.6283,0.6277,0.627,0.6262,0.6254,0.6244,0.6234,0.6223,0.6211,0.6199,0.6185,0.6171,0.6157,0.6143,0.6128,0.6113,0.6099,0.6086,0.6073,0.6062,0.6052,0.6043,0.6037,0.6032,0.6028,0.6027,0.6027,0.6029,0.6032,0.6037,0.6042,0.6047,0.6052,0.6057,0.6062,0.6065,0.6067,0.6068,0.6066,0.6063,0.6057,0.6048,0.6036,0.6021,0.6003,0.5981,0.5954,0.5922,0.5885,0.5842,0.5792,0.5734,0.5668,0.5592,0.5506,0.5409,0.5301,0.5182,0.5051,0.4909,0.4757,0.4595,0.4426,0.4251,0.4072,0.3891,0.3711,0.3534,0.3362,0.3198,0.3043,0.2898,0.2765,0.2645,0.2537,0.2443,0.236,0.229,0.2231,0.2181,0.214,0.2108,0.2081,0.2061,0.2045,0.2033,0.2023,0.2017,0.2012,0.2008,0.2005,0.2004,0.2002,0.2002,0.2001,0.2001,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2], y5: [0.1617,0.1616,0.1615,0.1615,0.1614,0.1613,0.1612,0.1611,0.1611,0.1611,0.1611,0.1612,0.1613,0.1616,0.1619,0.1623,0.1629,0.1637,0.1646,0.1657,0.1671,0.1687,0.1705,0.1726,0.1749,0.1775,0.1802,0.1832,0.1863,0.1894,0.1927,0.1959,0.1991,0.2022,0.2052,0.208,0.2106,0.2131,0.2152,0.2172,0.2189,0.2204,0.2216,0.2227,0.2236,0.2244,0.225,0.2255,0.226,0.2263,0.2266,0.2268,0.227,0.2271,0.2272,0.2273,0.2273,0.2274,0.2274,0.2274,0.2275,0.2275,0.2276,0.2277,0.2278,0.2279,0.2281,0.2283,0.2286,0.2288,0.2292,0.2295,0.2298,0.2301,0.2304,0.2307,0.231,0.2312,0.2313,0.2314,0.2314,0.2314,0.2313,0.2311,0.2308,0.2305,0.2301,0.2297,0.2293,0.2288,0.2283,0.2278,0.2272,0.2267,0.2263,0.2258,0.2254,0.2251,0.2248,0.2245,0.2243,0.2242,0.2241,0.2241,0.2242,0.2243,0.2244,0.2245,0.2247,0.2249,0.225,0.2252,0.2253,0.2254,0.2255,0.2255,0.2254,0.2253,0.2252,0.225,0.2248,0.2245,0.2243,0.224,0.2237,0.2234,0.2231,0.2228,0.2227,0.2225,0.2225,0.2225,0.2227,0.2229,0.2233,0.2239,0.2247,0.2256,0.2267,0.228,0.2295,0.2312,0.2331,0.2351,0.2372,0.2395,0.2418,0.2441,0.2465,0.2488,0.251,0.2531,0.2551,0.2569,0.2585,0.2599,0.2611,0.2621,0.263,0.2636,0.2641,0.2644,0.2646,0.2646,0.2646,0.2645,0.2644,0.2642,0.2641,0.264,0.264,0.2641,0.2643,0.2646,0.2651,0.2658,0.2667,0.2679,0.2693,0.271,0.2729,0.2751,0.2775,0.2801,0.2829,0.2858,0.2888,0.2918,0.2948,0.2978,0.3006,0.3033,0.3058,0.3081,0.3101,0.3119,0.3135,0.3149,0.316,0.3169,0.3176,0.3181,0.3185,0.3187,0.3189,0.3189,0.3189,0.3189,0.3188,0.3186,0.3185,0.3183,0.3181,0.3179,0.3177,0.3175,0.3173,0.3172,0.317,0.3169,0.3168,0.3167,0.3166,0.3166,0.3165,0.3165,0.3166,0.3167,0.3168,0.3169,0.3171,0.3174,0.3176,0.3179,0.3183,0.3187,0.3191,0.3196,0.3201,0.3206,0.3211,0.3216,0.3221,0.3227,0.3232,0.3237,0.3241,0.3246,0.325,0.3253], x6: [0.3841,0.3866,0.3893,0.3923,0.3956,0.3992,0.4031,0.4073,0.4117,0.4163,0.4211,0.426,0.4311,0.4363,0.4416,0.4469,0.4523,0.4577,0.4631,0.4685,0.4739,0.4793,0.4846,0.4898,0.495,0.5001,0.505,0.5099,0.5147,0.5194,0.5239,0.5283,0.5325,0.5366,0.5406,0.5444,0.548,0.5514,0.5547,0.5579,0.5608,0.5636,0.5662,0.5687,0.571,0.5731,0.5751,0.5769,0.5786,0.5802,0.5816,0.5829,0.5841,0.5852,0.5861,0.587,0.5878,0.5885,0.5891,0.5897,0.5902,0.5906,0.591,0.5913,0.5916,0.5918,0.592,0.5922,0.5923,0.5924,0.5925,0.5925,0.5926,0.5926,0.5926,0.5926,0.5926,0.5925,0.5925,0.5924,0.5924,0.5923,0.5922,0.5922,0.5921,0.592,0.5919,0.5918,0.5917,0.5916,0.5915,0.5914,0.5913,0.5913,0.5912,0.5911,0.591,0.5909,0.5908,0.5907,0.5906,0.5905,0.5903,0.5902,0.5901,0.59,0.5899,0.5897,0.5895,0.5894,0.5892,0.589,0.5887,0.5884,0.5881,0.5878,0.5874,0.587,0.5865,0.5859,0.5853,0.5846,0.5839,0.583,0.5821,0.5811,0.5799,0.5787,0.5774,0.576,0.5745,0.5729,0.5713,0.5696,0.5679,0.5662,0.5645,0.563,0.5616,0.5603,0.5592,0.5584,0.5579,0.5576,0.5576,0.558,0.5587,0.5597,0.561,0.5626,0.5643,0.5662,0.5682,0.5702,0.5722,0.574,0.5758,0.5773,0.5786,0.5796,0.5803,0.5806,0.5806,0.5801,0.5792,0.5779,0.5761,0.5738,0.5708,0.5673,0.5631,0.5581,0.5522,0.5454,0.5376,0.5288,0.5187,0.5075,0.495,0.4814,0.4665,0.4506,0.4336,0.4159,0.3975,0.3786,0.3596,0.3406,0.322,0.3039,0.2865,0.2701,0.2549,0.2409,0.2282,0.2168,0.2068,0.1981,0.1907,0.1844,0.1792,0.1749,0.1714,0.1686,0.1664,0.1647,0.1634,0.1625,0.1618,0.1612,0.1608,0.1606,0.1604,0.1603,0.1602,0.1601,0.1601,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16], y6: [0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.12,0.1201,0.1201,0.1201,0.1202,0.1203,0.1204,0.1205,0.1207,0.1209,0.1212,0.1216,0.1221,0.1227,0.1233,0.1241,0.1251,0.1261,0.1273,0.1287,0.1302,0.1318,0.1335,0.1353,0.1371,0.139,0.141,0.1429,0.1447,0.1465,0.1482,0.1498,0.1513,0.1527,0.1539,0.1549,0.1559,0.1567,0.1573,0.1579,0.1584,0.1588,0.1591,0.1593,0.1595,0.1596,0.1597,0.1598,0.1599,0.1599,0.1599,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16,0.16], x7: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], y7: [0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11,0.11] };
  const sec94 = measuredSecs(F94NZ, F94A, F94BZ, F94B);
  const sk = sweptSkin(car, addPanel, add, PAINT, {
    nose: sec94.nose,
    body: { z: F94BZ, yb: 0.11 },
    secA: sec94.secA, secB: sec94.secB, rows: [100, 250], weld: true,
    open: [[1.2, 0], [1.035, 0], [0.987, 0.069], [0.94, 0.113], [0.892, 0.137], [0.845, 0.154], [0.797, 0.17], [0.75, 0.186], [0.72, 0.2], [0.683, 0.204], [0.647, 0.212], [0.61, 0.216], [0.574, 0.219], [0.537, 0.22], [0.5, 0.219], [0.464, 0.218], [0.427, 0.217], [0.391, 0.214], [0.354, 0.21], [0.317, 0.139], [0.281, 0.068], [0.244, 0], [-0.6, 0]], RIM: 0.68,
    // (the red all over; underneath dark; and the pods' raked mouths, where the top's edge reaches
    // out over the side ahead of the full pod, dark: the opening into the radiator)
    paint: (part, seg, z, x, y) => (part === 'join' ? 3 : seg === 6 ? 2 : (seg === 4 || seg === 5) && z > 0.42 && z < 0.95 ? 3 : 0),
    mouthX: 0.3, duct: 0.25,
  });
  const { surfY, S } = sk;
  // (all red, as the real one: no flashes; the sponsors give it its white)
  // HIM, AND THE COCKPIT ROUND HIM: sat well forward, as the reference car has him, his
  // head just ahead of the airbox (DZ: how much further forward than the older cars)
  const DZ = F94_DRIVER_DZ;
  // the little wraparound screen at the front of the opening
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12, 1, true, -0.95, 1.9).rotateX(-0.3).translate(0, 0.79, 0.93), MAT.glass, false);
  add(box(0.32, 0.05, 0.34, 0, 0.13, 0.08 + DZ), MAT.seat, false);
  add(box(0.34, 0.4, 0.05, 0, 0.33, -0.12 + DZ, -0.36), MAT.seat, false);
  for (const sx of [1, -1]) {
    add(rod([sx * 0.08, 0.2, 0.02 + DZ], [sx * 0.09, 0.3, 0.55 + DZ], 0.055), MAT.suit, false);
    add(rod([sx * 0.09, 0.3, 0.55 + DZ], [sx * 0.07, 0.24, 1.02 + DZ], 0.045), MAT.suit, false);
  }
  const driver = new THREE.Group(); driver.position.z = DZ;
  car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.12, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.7, 0.8).translate(0, 0.48, -0.04), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([sx * 0.17, 0.51, -0.02], [sx * 0.15, 0.43, 0.22], 0.04), MAT.suit); dAdd(rod([sx * 0.15, 0.43, 0.22], [sx * 0.12, 0.54, 0.42], 0.035), MAT.suit); }
  dAdd(new THREE.BoxGeometry(0.25, 0.12, 0.03).rotateX(-0.45).translate(0, 0.56, 0.46), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(0, 0.73, -0.03 + DZ), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(0, 0.73, -0.03 + DZ), MAT.visor);
  const stripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(0, 0.73, -0.03 + DZ), MAT.yellow);   // (white, like his suit's trim)
  const mirrors = {};
  for (const s of [1, -1]) {
    const mz = 0.82;                                                       // (out of the cockpit's sides, by his hands)
    const stalk = add(rod([s * 0.3, 0.7, mz], [s * 0.44, 0.76, mz + 0.02], 0.01), MAT.carbon);
    const pod = new THREE.Group();
    car.add(pod);
    pod.add(add(loft([{ z: mz + 0.05, w: 0.13, h: 0.065, y: 0.735, x: s * 0.47 }, { z: mz - 0.01, w: 0.14, h: 0.075, y: 0.73, x: s * 0.47 }], 0.9, 16, 1, false), MAT.blue));
    pod.add(add(new THREE.PlaneGeometry(0.115, 0.06).rotateY(Math.PI).translate(s * 0.47, 0.768, mz - 0.015), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.47, 0.77, mz + 0.02] };
  }
  // --- THE AIRBOX: the skin itself rises into it right behind his head; its
  // mouth, dark, in the face of that rise, over his helmet
  add(new THREE.CircleGeometry(0.1, 24).scale(1.05, 0.75, 1).translate(0, 0.86, 0.262), MAT.dark, false);
  for (const s of [1, -1]) add(box(0.012, 0.3, 0.38, s * 0.47, 0.18, 0.72, 0, s * 0.15), MAT.carbon);           // bargeboards, ahead of the pods
  // the gearbox, the rain light, exhausts out low at the back over the diffuser
  add(box(0.22, 0.2, 0.42, 0, 0.22, -1.92), MAT.carbon);
  add(box(0.07, 0.04, 0.03, 0, 0.3, -2.14), MAT.rain);
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 12, 1, true).rotateX(Math.PI / 2 - 0.1).translate(s * 0.2, 0.2, -1.95), MAT.exhaust);
  // --- the floor (stepped, the plank) and the diffuser
  add(box(1.32, 0.02, 2.2, 0, 0.045, -0.1), MAT.carbon);                // (just wider than the pods)
  add(box(0.3, 0.012, 2.6, 0, 0.03, -0.1), new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 }));
  add(box(0.95, 0.02, 0.62, 0, 0.13, -1.8, -0.32), MAT.carbon);
  for (const x of [-0.34, -0.12, 0.12, 0.34]) add(box(0.01, 0.15, 0.56, x, 0.12, -1.8), MAT.carbon);

  // --- the front wing: wide, drooping down from the middle under the
  // raised nose on two pylons; a main plane and a flap; big endplates
  const wings = { fl: new THREE.Group(), fr: new THREE.Group(), rear: new THREE.Group() };
  const WING_YELLOW = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.35 });
  for (const g of Object.values(wings)) car.add(g);
  const addTo = (g, geo, mat) => { const m = add(geo, mat); g.add(m); return m; };
  for (const s of [1, -1]) add(box(0.015, 0.15, 0.18, s * 0.06, 0.18, 2.42, 0.2), MAT.carbon);
  add(box(0.24, 0.02, 0.36, 0, 0.13, 2.48, 0.05), MAT.blue);
  for (const s of [1, -1]) {
    const g = s > 0 ? wings.fl : wings.fr;
    addTo(g, box(0.62, 0.022, 0.36, s * 0.43, 0.1, 2.44, 0.05, -s * 0.03, -s * 0.07), MAT.carbon);     // main plane, drooping outward (black)
    addTo(g, box(0.56, 0.015, 0.18, s * 0.46, 0.15, 2.26, 0.4, -s * 0.03, -s * 0.07), MAT.carbon);   // the flap
    addTo(g, box(0.5, 0.004, 0.05, s * 0.45, 0.113, 2.5, 0.05, -s * 0.03, -s * 0.07), WING_YELLOW);   // (a yellow strip along the main plane)
    addTo(g, box(0.015, 0.22, 0.58, s * 0.775, 0.13, 2.38), MAT.carbon);                            // endplate
  }
  // --- the rear wing: tall, three elements between big endplates; a beam wing below
  // (its endplates white over their top half, where the sponsors go, black below)
  for (const s of [1, -1]) addTo(wings.rear, box(0.02, 0.36, 0.64, s * 0.5, 0.89, -2.0), MAT.yellow);
  for (const s of [1, -1]) addTo(wings.rear, box(0.02, 0.3, 0.64, s * 0.5, 0.56, -2.0), MAT.carbon);
  addTo(wings.rear, box(0.98, 0.024, 0.26, 0, 0.86, -1.9, 0.14), MAT.carbon);
  addTo(wings.rear, box(0.98, 0.02, 0.2, 0, 0.95, -2.08, 0.42), MAT.carbon);
  addTo(wings.rear, box(0.98, 0.018, 0.14, 0, 1.01, -2.22, 0.7), MAT.carbon);
  add(box(0.8, 0.02, 0.16, 0, 0.46, -1.95, 0.18), MAT.carbon);
  addTo(wings.rear, box(0.035, 0.45, 0.06, 0, 0.63, -1.98), MAT.carbon);
  // THE SPONSORS: the tobacco brand (shared with the TTF-88) big on the
  // pods' sides and across the rear wing, the fuel on the nose, the tyres
  // and a few small ones as badges alone
  if (typeof document !== 'undefined') {
    const main = fitDecal('VESPERO', '#ffffff'), fuel = fitDecal('SOLVARA', '#ffffff');
    for (const sx of [1, -1]) {
      decalOnSkin(car, addPanel, sk, sk.secB, 0.16, -0.82, S + 2, 2 * S + 3, main, sx);           // (big, along the engine cover's flank behind him)
      decalOnSkin(car, addPanel, sk, sk.secB, -0.5, -0.85, 4 * S, 5 * S + 2, fuel, sx);           // (the fuel, low on the pod's side)
      decalOnSkin(car, addPanel, sk, sk.secA, 1.72, 1.12, 3 * S - 1, 4 * S + 1, fuel, sx);        // (and on the nose's side)
      decalOnSkin(car, addPanel, sk, sk.secB, 0.2, -0.3, 4 * S, 5 * S + 2, fitDecal('ARDENTA', '#ffffff'), sx);   // (the pod's side, ahead of it)
      decalOnSkin(car, addPanel, sk, sk.secB, 0.62, 0.4, S, 2 * S, fitDecal('NOVIK', '#ffffff', { name: false }), sx);         // (by the cockpit)
      const ep = flatDecal(0.36, 0.18, sx * 0.512, 0.94, -2.0, sponsorDecal('SOLVARA', '#1a1c20', 512, 256)); wings.rear.add(ep);
      const tp = flatDecal(0.3, 0.1, sx * 0.512, 0.79, -2.02, sponsorDecal('VALCOR', '#1a1c20', 768, 256)); wings.rear.add(tp);
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
// how much further forward the TTP-70's driver sits than he used to (under the high front of the roof)
export const P70_DRIVER_DZ = 0.4;
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
  const LAMP_AT = [0, 0.38, 1.95];          // (where the headlights shine from)
  const arch = (z, base) => { let b = base; for (const wz of [FZ, RZ]) { const d = z - wz, r = WR + 0.05; if (Math.abs(d) < r) b = Math.max(b, WR + Math.sqrt(r * r - d * d)); } return b; };
  // --- the main body: a low wedge, wide, the middle of the bonnet low
  // between the fenders, the tail cut off square. (Its widths and heights
  // measured off a reference of the real car, every 4 cm along it, and
  // smoothed: the reference is built of little blocks)
  const W = curve([[-2.0, 1.82], [-1.66, 1.92], [-1.09, 1.9], [-0.52, 1.89], [0, 1.83], [0.63, 1.82], [1.25, 1.82], [1.77, 1.8], [2.13, 1.66]]);
  const TOP = curve([[-2.0, 0.66], [-1.66, 0.68], [-1.09, 0.65], [-0.8, 0.66], [-0.4, 0.66], [0.6, 0.72], [0.91, 0.75], [1.2, 0.63], [1.49, 0.45], [1.77, 0.3], [2.13, 0.17]]);
  const BOT = (z) => arch(z, z > 1.8 ? 0.12 + (z - 1.8) * 0.15 : 0.12);
  add(smoothBody(-2.0, 2.13, 80, (z) => ({ w: W(z), top: TOP(z), bot: BOT(z), tuck: 0.12, sq: 6 })), MAT.blue);
  add(new THREE.BoxGeometry(1.2, 0.08, 3.6).translate(0, 0.14, 0.05), MAT.carbon);           // the floor (no seeing through)
  for (const wz of [FZ, RZ]) for (const s of [1, -1]) add(new THREE.CylinderGeometry(WR + 0.05, WR + 0.05, 0.4, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.72, WR, wz), MAT.dark, false);
  // the front fenders standing up either side of the low bonnet, swelling over the wheels
  const FT = curve([[0.55, 0.62], [0.91, 0.64], [1.25, 0.68], [1.49, 0.6], [1.77, 0.46], [2.05, 0.32]]);
  // (each swelling grows smoothly out of the body and back into it: no ends sticking out)
  const ease = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  for (const s of [1, -1]) add(smoothBody(0.45, 2.08, 34, (z) => { const e = ease((z - 0.45) / 0.45); return { x: s * (0.72 - 0.12 * (1 - e)), w: (0.56 - Math.max(0, z - 1.7) * 0.4) * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (FT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.3 + 0.12 * (1 - e)), tuck: 0.3, sq: 3 }; }), MAT.blue);
  // the rear fenders, swelling up over the back wheels and running into the fins
  const RT = curve([[-0.5, 0.67], [-0.8, 0.7], [-1.09, 0.75], [-1.38, 0.78], [-1.66, 0.8], [-2.0, 0.83]]);
  for (const s of [1, -1]) add(smoothBody(-2.0, -0.35, 34, (z) => { const e = ease((-0.35 - z) / 0.45); return { x: s * (0.74 - 0.12 * (1 - e)), w: 0.54 * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (RT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.32 + 0.12 * (1 - e)), tuck: 0.35, sq: 3 }; }), MAT.blue);
  // the broad orange stripe down the middle: nose, roof, tail, edged in blue
  const stripe = (z0, z1, topFn, w) => add(smoothBody(z0, z1, 40, (z) => ({ w, top: topFn(z) + 0.006, bot: topFn(z) - 0.02, sq: 2.4 })), MAT.yellow);
  stripe(0.7, 2.11, TOP, 0.62);
  // --- the cockpit: a small bubble, a wraparound screen, the roof, the window frames
  // (the cabin: its roof high and level well forward, then the steep screen down onto the cowl)
  const CT = curve([[-0.75, 0.66], [-0.52, 0.69], [-0.23, 0.79], [0.05, 0.87], [0.4, 0.875], [0.62, 0.85], [0.8, 0.76], [0.9, 0.73]]);
  const CW = curve([[-0.75, 1.0], [-0.23, 1.04], [0.35, 1.08], [0.9, 1.14]]);
  add(smoothBody(-0.75, 0.9, 34, (z) => ({ w: CW(z), top: CT(z), bot: 0.55, tuck: 0.35, sq: 2.6 })), MAT.glass, false);
  { const roof = add(smoothBody(-0.7, 0.18, 20, (z) => ({ w: CW(z) * 0.86, top: CT(z) + 0.01, bot: CT(z) - 0.06, tuck: 0.25, sq: 2.6 })), roofMat); roof.castShadow = false; addPanel(roof); }
  stripe(-0.7, 0.18, (z) => CT(z) + 0.012, 0.42);
  add(smoothBody(-1.98, -0.72, 30, (z) => ({ w: 0.62, top: TOP(z) + 0.006, bot: TOP(z) - 0.02, sq: 2.4 })), MAT.yellow);
  for (const s of [1, -1]) add(rod([s * 0.56, 0.72, 0.9], [s * 0.46, 0.86, 0.55], 0.025), MAT.blue);        // the screen's pillars
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
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16).rotateX(Math.PI / 2 - 0.5).translate(s * 0.7, FT(1.88) - 0.05, 1.88), MAT.lamp);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16).rotateX(Math.PI / 2 - 0.5).translate(s * 0.52, FT(1.95) - 0.06, 1.95), MAT.lamp);
    add(smoothBody(1.78, 2.02, 6, (z) => ({ x: s * 0.62, w: 0.36, top: FT(z) + 0.01, bot: FT(z) - 0.12, sq: 2.5 })), MAT.lens, false);
  }
  add(new THREE.BoxGeometry(0.7, 0.08, 0.02).translate(0, 0.2, 2.1), MAT.dark, false);
  // mirrors: little round ones on the front fenders
  const mirrors = {};
  for (const s of [1, -1]) {
    const stalk = add(rod([s * 0.72, 0.66, 0.85], [s * 0.74, 0.72, 0.85], 0.012), MAT.carbon);
    const pod = new THREE.Group(); car.add(pod);
    pod.add(add(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16).rotateX(Math.PI / 2).translate(s * 0.74, 0.76, 0.85), MAT.blue));
    pod.add(add(new THREE.CircleGeometry(0.048, 16).rotateY(Math.PI).translate(s * 0.74, 0.76, 0.824), MAT.visor));
    mirrors[s > 0 ? 'l' : 'r'] = { stalk, pod, at: [s * 0.74, 0.76, 0.85] };
  }
  // --- the tail: the deck's cooling grille over the flat-12 (the big fan
  // under it), the two fins, the mesh across the back, the lights, the exhausts
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24).translate(0, TOP(-1.0) + 0.006, -1.0), MAT.dark, false);
  for (let k = -3; k <= 3; k++) add(new THREE.BoxGeometry(0.46, 0.012, 0.02).translate(0, TOP(-1.0) + 0.017, -1.0 + k * 0.06), MAT.carbon, false);
  add(new THREE.PlaneGeometry(1.5, 0.42).rotateY(Math.PI).translate(0, 0.42, -2.005), MAT.dark, false);
  for (const s of [1, -1]) {
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14).rotateX(Math.PI / 2).translate(s * 0.72, 0.62, -2.01), MAT.rain);
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.16, 12, 1, true).rotateX(Math.PI / 2).translate(s * 0.25, 0.24, -2.02), MAT.exhaust);
  }
  // the driver (on the right), his helmet, his body and the wheel (the
  // computer drivers' and the Garage's; the player's has its own cockpit)
  // (sat under the high front of the roof, as the real car has him: DZ further forward than he was)
  const DX = -0.27, DZ = P70_DRIVER_DZ;
  add(new THREE.BoxGeometry(0.42, 0.06, 0.42).translate(DX, 0.22, -0.15 + DZ), MAT.seat, false);
  add(new THREE.BoxGeometry(0.42, 0.5, 0.06).rotateX(-0.3).translate(DX, 0.45, -0.4 + DZ), MAT.seat, false);
  const driver = new THREE.Group(); driver.position.z = DZ; car.add(driver);
  const dAdd = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = false; driver.add(m); return m; };
  dAdd(new THREE.CapsuleGeometry(0.15, 0.14, 4, 10).rotateZ(Math.PI / 2).scale(1, 0.75, 0.8).translate(DX, 0.56, -0.25), MAT.suit);
  for (const sx of [1, -1]) { dAdd(rod([DX + sx * 0.17, 0.6, -0.22], [DX + sx * 0.15, 0.5, 0.02], 0.04), MAT.suit); dAdd(rod([DX + sx * 0.15, 0.5, 0.02], [DX + sx * 0.12, 0.62, 0.22], 0.035), MAT.suit); }
  dAdd(new THREE.TorusGeometry(0.17, 0.016, 6, 20).rotateX(-0.6).translate(DX, 0.62, 0.26), MAT.carbon);
  const helmet = add(new THREE.SphereGeometry(0.135, 20, 16).scale(1, 1.05, 1.1).translate(DX, 0.74, -0.25 + DZ), MAT.helmet);
  const visor = add(new THREE.SphereGeometry(0.137, 20, 10, -0.9 + Math.PI / 2, 1.8, 1.1, 0.5).scale(1, 1.05, 1.1).translate(DX, 0.74, -0.25 + DZ), MAT.visor);
  const hstripe = add(new THREE.TorusGeometry(0.135, 0.012, 6, 24, Math.PI).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 1.05, 1.1).translate(DX, 0.74, -0.25 + DZ), MAT.yellow);
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
  const LAMP_AT = [0, 0.36, 2.05];          // (where the headlights shine from)
  // (the front wheels have open arches; the back ones are skirted)
  const arch = (z, base) => { const d = z - FZ, r = WR + 0.05; return Math.abs(d) < r ? Math.max(base, WR + Math.sqrt(r * r - d * d)) : base; };
  // (its widths and heights measured off a reference of the real car, every 5 cm along it, smoothed)
  const W = curve([[-2.45, 1.9], [-1.58, 1.95], [-0.7, 1.96], [0, 1.9], [0.76, 1.92], [1.34, 1.92], [1.92, 1.78], [2.36, 1.45]]);
  const TOP = curve([[-2.45, 0.84], [-1.8, 0.74], [-1.28, 0.78], [-1.0, 0.74], [-0.6, 0.72], [0.6, 0.78], [0.76, 0.82], [1.05, 0.75], [1.34, 0.62], [1.63, 0.41], [2.0, 0.28], [2.36, 0.18]]);
  const BOT = (z) => arch(z, z > 2.0 ? 0.1 + (z - 2.0) * 0.12 : 0.1);
  add((smoothBody(-2.45, 2.36, 140, (z) => ({ w: W(z), top: TOP(z), bot: BOT(z), tuck: 0.12, sq: 7 }), 64)), MAT.blue);
  add(new THREE.BoxGeometry(1.3, 0.06, 4.2).translate(0, 0.12, -0.05), MAT.carbon);
  for (const s of [1, -1]) add(new THREE.CylinderGeometry(WR + 0.05, WR + 0.05, 0.42, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(s * 0.73, WR, FZ), MAT.dark, false);
  // the front fenders swelling up either side of the low nose (and back into the body)
  const FT = curve([[0.55, 0.62], [0.76, 0.66], [1.05, 0.73], [1.34, 0.8], [1.63, 0.6], [1.92, 0.42], [2.22, 0.24]]);
  for (const s of [1, -1]) add((smoothBody(0.5, 2.22, 50, (z) => { const e = ease((z - 0.5) / 0.45); return { x: s * (0.73 - 0.12 * (1 - e)), w: (0.54 - Math.max(0, z - 1.8) * 0.5) * (0.3 + 0.7 * e), top: TOP(z) - 0.03 + (FT(z) - TOP(z) + 0.03) * e, bot: Math.max(BOT(z), 0.3 + 0.12 * (1 - e)), tuck: 0.3, sq: 3 }; }, 40)), MAT.blue);
  // the cockpit: small, a wraparound screen, the roof (green), its pillars
  // (its roof high well forward, then the steep screen down onto the cowl)
  const CT = curve([[-0.85, 0.78], [-0.51, 0.925], [-0.12, 0.98], [0.15, 1.0], [0.3, 0.99], [0.47, 0.915], [0.66, 0.76], [0.8, 0.72]]);
  const CW = curve([[-0.85, 1.02], [-0.2, 1.08], [0.35, 1.1], [0.8, 1.18]]);
  add(smoothBody(-0.85, 0.8, 34, (z) => ({ w: CW(z), top: CT(z), bot: 0.55, tuck: 0.35, sq: 2.6 })), MAT.glass, false);
  { const roof = add((smoothBody(-0.8, 0.36, 30, (z) => ({ w: CW(z) * 0.86, top: CT(z) + 0.01, bot: CT(z) - 0.06, tuck: 0.25, sq: 2.6 }), 40)), roofMat); roof.castShadow = false; }
  for (const s of [1, -1]) add(rod([s * 0.58, 0.7, 0.8], [s * 0.48, 0.98, 0.38], 0.025), MAT.green);
  // the long tail: the deck, the fins rising either side, the big wing between them
  const FinT = curve([[-0.9, 0.77], [-1.28, 0.79], [-1.6, 0.76], [-1.87, 0.74], [-2.16, 0.81], [-2.45, 0.85]]);
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
    add(new THREE.BoxGeometry(0.22, 0.06, 0.02).rotateX(-0.9).translate(s * 0.6, FT(1.98) - 0.04, 1.98), MAT.lamp);
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
export const bodyForKind = (kind) => ({ f20: buildF20Body, f05: buildF05Body, f94: buildF94Body, p70: buildP70Body, p91: buildP91Body }[kind] || buildF1Body);

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
  f20: { pattern: 'split', spokes: 5, color: 0x1a1b1e },
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
