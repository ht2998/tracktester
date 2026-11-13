// =====================================================================
// PHYSICS: how the car moves, including the engine and gearbox.
// A "bicycle model": the two front tyres act as one, the two rear tyres
// act as one. Each tyre grips up to a limit, and past that limit it
// slides, so the car can understeer, oversteer and drift.
// This is the starting point; suspension, weight transfer, weather and
// tyre temperature get added on top later.
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 13;

const G = 9.81;   // gravity, m/s²
const RPM_PER_RADS = 60 / (2 * Math.PI);

// Test car: modelled on the Caterham Seven 420 (Ford Duratec 2.0 inline-4).
// Real figures: 210 bhp at 7,600 rpm, 203 Nm at 6,300 rpm, 560 kg,
// 5-speed manual, 195/50 R15 tyres, 0-60 mph in 3.8 s, 219 km/h top speed.
export const CATERHAM = {
  mass: 560,              // kg
  inertia: 680,           // how hard it is to spin the car (kg·m²)
  airInertia: { pitch: 620, yaw: 680, roll: 210 },   // the whole car tumbling end over end, spinning flat, and rolling over (kg·m²)
  cgToFront: 1.15,        // metres from the centre of mass to the front axle
  cgToRear: 1.05,         // metres from the centre of mass to the rear axle
  frontGrip: 1.40,        // tyre grip (1.0 = ordinary road tyre on dry tarmac): high so it feels planted (four-wheel model)
  rearGrip: 1.62,         // sticky track-day tyres; a bit more at the back keeps it stable
  maxPushShare: 0.92,     // most of the rear grip the engine can use for pushing
  cgHeight: 0.38,         // metres: weight shifts back when accelerating, forward when braking
  downforce: 0.3,         // N per (m/s)²: a Seven makes very little (the four tyres feel it directly now)
  downforceFront: 0.45,   // share of the downforce on the front axle
  yawDamping: 0.6,        // natural settling of a spin or wobble
  frontStiffness: 38000,  // how sharply the front tyres respond to steering
  rearStiffness: 42000,   // how sharply the rear tyres respond
  maxReverseSpeed: 6,     // m/s
  brakeForce: 9500,       // N
  brakeBias: 0.74,        // share of the braking done by the front tyres (more at the front keeps the light rear stable)
  handbrakeLockGrip: 0.85,// braking from locked rear tyres, as a share of their grip
  lockedBrakeGrip: 0.8,   // braking from locked (skidding) tyres, as a share of full grip
  handbrakeRearGrip: 0.35,// rear grip left while the handbrake is on
  drag: 0.56,             // air resistance (a Seven is a brick: tuned for 219 km/h)
  rollingBase: 85,        // N of tyre rolling resistance
  rolling: 2,             // extra rolling resistance per m/s
  maxSteer: 0.55,         // radians of steering lock at low speed
  steerSpeed: 2.6,        // how fast the wheels turn, radians per second
  wheelRadius: 0.288,     // metres (195/50 R15)
  trackHalf: 0.68,        // metres from the centre line to each wheel

  // --- Tyres ---
  tyreWearBase: 1 / 300000,  // wear per metre rolled in a straight line (Sports Medium)
  tyreWearCorner: 0.00002,   // extra wear per metre at the grip limit, scaled by the tyre's load
  tyreWearBrake: 0.000005,   // extra wear per metre braking at the limit, scaled by the tyre's load
  tyreWearSkid: 0.0024,      // wear per metre of tyre actually sliding over the road
  tyreWearFlat: 0.00003,     // extra wear per metre driving on a deflated tyre
  flatSink: 0.085,           // metres a fully deflated tyre lets that corner drop
  rimSink: 0.11,             // metres that corner drops once the tyre is gone (on the bare rim)
  shredTime: 30,             // seconds of driving before a blown tyre has flung itself off the rim
  blowWornRate: 0.025,       // blowouts per second for each fully worn tyre at normal load (much more when loaded)
  flatHeatTime: 12,          // seconds at 100 km/h on a flat before it overheats and bursts
  rimGrip: 0.3,              // a bare steel rim's grip, compared with a Sports Medium tyre
  rimWearDistance: 1400,     // metres of driving on a bare rim before it's ground down to the frame
  frameSink: 0.2,            // metres that corner drops with the wheel gone (the frame on the road)
  frameGrip: 0.22,           // the frame scraping along: barely any grip...
  frameDrag: 0.9,            // ...and a lot of drag (share of that corner's load)
  rollShareFront: 0.55,      // how much of the cornering weight shift the front takes
  // Brake discs heat up as they turn the car's speed into heat, and cool
  // in the air flowing past (faster when you're going faster). Too hot and
  // the pads start to fade: the same pedal stops you less.
  brakeDiscs: {
    heatFront: 1400, heatRear: 1100,   // J per °C to warm each disc (about 3 kg and 2.4 kg of iron)
    coolFront: 1.25, coolRear: 1,      // the fronts are vented: they shed heat quicker
    fadeStart: 600, fadeEnd: 950, fadeMin: 0.55,   // °C where fade starts, and where it's at its worst (55% of the grip)
  },
  handbrakeTorque: 1400,     // Nm on each rear wheel: plenty to lock them
  wheelInertiaFront: 0.9,    // kg·m²: how hard each wheel is to spin up or slow down
  wheelInertiaRear: 1.3,     // (the rears turn the driveshafts and diff too)
  // Limited-slip differential: lets the rear wheels turn at different
  // speeds round a corner, but pushes back against one spinning up alone
  lsdRate: 120,              // Nm per rad/s of difference
  lsdPreload: 40,            // Nm it always resists with
  lsdRamp: 0.3,              // and more the harder the engine pushes
  // Suspension (per corner, at the wheel). Springs hold the car up,
  // dampers stop it bouncing, anti-roll bars stiffen it against leaning.
  // Stiffer at the front than the back keeps it stable at the limit.
  suspension: {
    springFront: 28000, springRear: 26000,   // N per metre
    damperFront: 2600, damperRear: 2500,     // N per m/s (firm, so the body settles quickly)
    arbFront: 9000, arbRear: 0,              // N per metre of difference side to side (like the real car: none at the back, which keeps the inside rear tyre loaded)
    bumpStop: 0.055, bumpStopRate: 250000,   // the rubber stops at the end of the travel
    droop: 0.07,                             // how far a wheel can hang below its normal height (m) before the damper is fully stretched
    pitchInertia: 700, rollInertia: 150,     // kg·m² of the body on its springs
  },

  // --- Fuel ---
  fuelCapacity: 36,       // litres
  fuelDensity: 0.745,     // kg per litre of petrol
  fuelPerKwh: 0.27,       // kg of fuel burnt per kWh of work (a typical petrol engine)
  idleFuel: 0.8,          // litres per hour just to keep running
  fuelReserve: 1.5,       // litres: below this the engine starts to sputter

  // --- Oil ---
  oilLeakRate: 0.011,     // share of the oil lost per second when damaged (about 90 s to empty)
  oilPourRate: 0.05,      // share lost per second once the engine has blown
  starvationDamage: 0.008,// health lost per second at 0% oil and full revs

  // --- Engine: Duratec-style 2.0 inline-4, naturally aspirated ---
  cylinders: 4,
  idleRpm: 900,
  redline: 7600,          // rev limiter cuts in here (peak power)
  launchRpm: 4500,        // revs the engine flares to when pulling away
  clutchBite: 0.45,       // seconds for the clutch to take up the drive
  engineBraking: 38,      // Nm of drag when you lift off the throttle
  peakTorque: 203,
  cvtTargetRpm: 6600,     // where the CVT holds the revs at full throttle
  // Torque curve: [rpm, Nm]  (203 Nm at 6,300; 197 Nm = 210 bhp at 7,600)
  torqueCurve: [[800, 110], [1500, 138], [2500, 158], [3500, 172], [4500, 184],
                [5500, 195], [6300, 203], [7000, 201], [7600, 197], [8000, 120], [8300, 0]],

  // --- Gearbox: 5-speed manual ---
  gears: [3.136, 1.888, 1.33, 1.0, 0.814],
  reverseGear: 3.76,
  finalDrive: 3.62,
  driveEfficiency: 0.9,
  cvtRange: [2.9, 12],    // CVT's lowest and highest overall ratio
  // Automatic upshift speeds (km/h) at full throttle, 1->2, 2->3 ...
  // (just under where each gear hits 7,600 rpm: 73, 121, 171; 5th is a cruising gear)
  autoUpshiftKmh: [70, 117, 166, 232],
  shiftTime: { manual: 0.12, auto: 0.28 },     // seconds of power cut per shift
};

// Tyre compounds, GT7-style. grip: on dry tarmac compared with Sports Medium.
// wear: how fast they wear compared with Sports Medium. kind: what sort of
// tyre it is, which decides how it copes off the tarmac (see SURFACES).
// Intermediates and wets are slower on dry tarmac and wear fast there (they
// overheat); they're for rain, which comes with weather. Dirt and snow tyres
// are poor on tarmac and come into their own off it.
// TYRE TEMPERATURE: each tyre warms up as it works (cornering, braking,
// sliding, spinning) and cools in the passing air, much faster in the rain.
// Each kind grips best inside its own window (°C); colder it grips less
// (slicks most of all), hotter it grips a little less and wears faster.
export const AMBIENT_TEMP = 28;
export const TEMP_WINDOW = {
  slick: { lo: 85, hi: 110, cold: 0.2 },
  road: { lo: 60, hi: 95, cold: 0.08 },
  wet: { lo: 45, hi: 80, cold: 0.06 },
  dirt: { lo: 45, hi: 85, cold: 0.06 },
  snow: { lo: -5, hi: 45, cold: 0.03 },
};

export const TYRES = {
  CH: { name: 'Comfort Hard', group: 'Comfort', kind: 'road', grip: 0.78, wear: 0.4 },
  CM: { name: 'Comfort Medium', group: 'Comfort', kind: 'road', grip: 0.82, wear: 0.5 },
  CS: { name: 'Comfort Soft', group: 'Comfort', kind: 'road', grip: 0.86, wear: 0.65 },
  SH: { name: 'Sports Hard', group: 'Sports', kind: 'road', grip: 0.93, wear: 0.75 },
  SM: { name: 'Sports Medium', group: 'Sports', kind: 'road', grip: 1.0, wear: 1.0 },
  SS: { name: 'Sports Soft', group: 'Sports', kind: 'road', grip: 1.06, wear: 1.3 },
  RH: { name: 'Racing Hard', group: 'Racing', kind: 'slick', grip: 1.12, wear: 1.5 },
  RM: { name: 'Racing Medium', group: 'Racing', kind: 'slick', grip: 1.18, wear: 2.0 },
  RS: { name: 'Racing Soft', group: 'Racing', kind: 'slick', grip: 1.24, wear: 2.7 },
  IM: { name: 'Intermediate', group: 'Wet weather', kind: 'wet', grip: 1.0, wear: 2.4 },
  W: { name: 'Wet', group: 'Wet weather', kind: 'wet', grip: 0.9, wear: 3.4 },
  DIRT: { name: 'Dirt', group: 'Off-road', kind: 'dirt', grip: 0.72, wear: 1.4 },
  SNOW: { name: 'Snow', group: 'Off-road', kind: 'snow', grip: 0.6, wear: 2.2 },
};

// Surfaces off the tarmac. grip: how much of a tyre's tarmac grip is left,
// by kind of tyre. Smooth slicks are worst on loose ground; deep-treaded
// tyres cope better; dirt tyres' knobbly blocks dig in and actually grip
// better on dirt than they do on tarmac. drag: how hard the ground holds
// the tyres back (as a share of their load), less for narrow dirt tyres.
// The shape of each kind of tyre's grip curve: alpha = the slip angle
// (radians) and kappa = the slip ratio where grip peaks; cx/cy = how much
// grip is left once it's sliding (higher = drops off more: sin(c x 90°));
// loadSens = how much less grip per kg a heavily loaded tyre has.
export const TYRE_SHAPE = {
  road: { alpha: 0.11, kappa: 0.11, cx: 1.55, cy: 1.35, loadSens: 0.12 },
  slick: { alpha: 0.09, kappa: 0.09, cx: 1.6, cy: 1.45, loadSens: 0.1 },
  wet: { alpha: 0.12, kappa: 0.12, cx: 1.5, cy: 1.3, loadSens: 0.12 },
  dirt: { alpha: 0.16, kappa: 0.16, cx: 1.4, cy: 1.25, loadSens: 0.1 },
  snow: { alpha: 0.18, kappa: 0.18, cx: 1.35, cy: 1.2, loadSens: 0.08 },
};

export const SURFACES = {
  gravel: {
    grip: { road: 0.55, slick: 0.42, wet: 0.6, dirt: 0.95, snow: 0.75 },
    drag: 0.38, dirtTyreDrag: 0.26,
  },
  grass: {
    grip: { road: 0.5, slick: 0.38, wet: 0.56, dirt: 1.0, snow: 0.8 },
    drag: 0.12, dirtTyreDrag: 0.08,
  },
  soil: {
    grip: { road: 0.6, slick: 0.45, wet: 0.65, dirt: 1.15, snow: 0.82 },
    drag: 0.22, dirtTyreDrag: 0.14,
  },
};

// Wheel order used everywhere: front left, front right, rear left, rear right
export const WHEEL_ORDER = [
  { name: 'FL', front: true, side: 1 },
  { name: 'FR', front: true, side: -1 },
  { name: 'RL', front: false, side: 1 },
  { name: 'RR', front: false, side: -1 },
];

export const TRANSMISSIONS = ['manual', 'auto', 'cvt'];
export const TRANSMISSION_NAMES = { manual: 'Manual', auto: 'Automatic', cvt: 'CVT' };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function torqueAt(curve, rpm) {
  if (rpm <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [r1, t1] = curve[i];
    if (rpm <= r1) {
      const [r0, t0] = curve[i - 1];
      return t0 + ((t1 - t0) * (rpm - r0)) / (r1 - r0);
    }
  }
  return 0;
}

// --- Small 3D maths for the free body (vectors [x, y, z], quaternions [w, x, y, z]) ---
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const qmul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
const qaxis = (ax, ang) => { const sn = Math.sin(ang / 2); return [Math.cos(ang / 2), ax[0] * sn, ax[1] * sn, ax[2] * sn]; };
const qrot = (q, v) => {
  const [w, x, y, z] = q;
  const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
};
// The parts of the body that can touch the ground when it's tipped over or
// lands badly (x = left, y = up from the ground, z = forwards, metres):
// the nose, the front and rear wings, the scuttle, the roll bar, the
// cockpit sides, the tail and the corners of the floor
const BODY_POINTS = [
  [0, 0.3, 1.72], [0.25, 0.32, 1.6], [-0.25, 0.32, 1.6],
  [0.74, 0.62, 1.1], [-0.74, 0.62, 1.1], [0, 0.82, 0.55],
  [0.32, 1.08, -0.38], [-0.32, 1.08, -0.38], [0, 1.1, -0.38],
  [0.56, 0.74, 0.1], [-0.56, 0.74, 0.1], [0.72, 0.62, -1.15], [-0.72, 0.62, -1.15],
  [0.55, 0.45, -1.55], [-0.55, 0.45, -1.55],
  [0.48, 0.1, 1.3], [-0.48, 0.1, 1.3], [0.48, 0.1, -1.3], [-0.48, 0.1, -1.3],
];

export class CarPhysics {
  constructor(spec = CATERHAM) {
    this.spec = spec;
    this.transmission = 'manual';
    // Driver aids, switchable from the side panel. Both on by default.
    this.tyreCompound = 'SM';   // Sports Medium by default; survives a reset
    // Levels 0-5: 0 = off, 5 = strongest. Both start at 5.
    this.assists = { abs: 5, tcs: 5 };
    // How grippy the ground is at a point: 1 = normal tarmac. The game sets
    // this so that tyres rolling over oil (or later gravel, wet patches...)
    // lose grip.
    this.surfaceGrip = () => 1;
    // How much the ground holds the tyres back at a point, as a share of the
    // tyre's load: 0 = tarmac. Gravel is loose, so the tyres plough into it.
    this.surfaceDrag = () => 0;
    // How fast the tyres wear compared with normal (the rain sets this: wet
    // tyres last far longer on a wet track, everything runs cooler)
    this.wearScale = () => 1;
    this.trackWetness = 0;     // how wet the track is (0-1), set by the game: cools the tyres
    // The height of the road at a point (bumps, kerbs), set by the game
    this.roadHeight = () => 0;
    // The ground's hills and dips (metres at a point), set by the game
    this.groundHeight = () => 0;
    this.reset();
  }

  reset() {
    // The free 3D body (jumps, rolls, upside down): see airWheels/airStep
    this.air = false;
    this.fb = {
      p: [0, 0, 0], v: [0, 0, 0], q: [1, 0, 0, 0], w: [0, 0, 0],   // centre of mass position, speed, turn (w x y z), spin (all in the world)
      vf: [0, 0, 0, 0], vl: [0, 0, 0, 0], fx: [0, 0, 0, 0], fy: [0, 0, 0, 0], travel: [0, 0, 0, 0],
      N: [0, 0, 0, 0], acc: [0, 0], settle: 0, lift: 0, side: 0, end: 0, hitAt: -9, time: 0, sync: null, scrape: 0,
    };
    this.pose = { x: 0, y: 0, z: 0, q: [0, 0, 0, 1] };   // where to draw the car while it's flying (model origin, quaternion x y z w)
    this.airHeight = 0;    // how high the car's middle is above the ground (0 on its wheels)
    // The ground under the car: its height (at the car's middle), how much it
    // slopes forwards and to the left (rise per metre), and how fast the
    // ground under the car is rising and speeding up its rise (crests, dips)
    this.ground = { y: 0, slopeF: 0, slopeL: 0, rate: 0, accel: 0, synced: false };
    this.brakeTemp = [AMBIENT_TEMP, AMBIENT_TEMP, AMBIENT_TEMP, AMBIENT_TEMP];   // brake disc temperatures, °C
    this.brakeHeat = [0, 0, 0, 0];   // heat put into each disc since the last update (J)
    this.x = 0;           // world position
    this.z = 0;
    this.heading = 0;     // direction the car faces, radians (0 = +z)
    this.vx = 0;          // speed forwards (m/s), in the car's own frame
    this.vy = 0;          // speed sideways (m/s), positive = to the left
    this.yawRate = 0;     // how fast the car is turning, radians per second
    this.steer = 0;       // current front-wheel angle, radians
    this.wheelSpin = 0;   // wheel rotation, for drawing
    this.accelX = 0;      // forward acceleration, m/s² (for weight transfer)
    this.tyreSlip = { front: 0, rear: 0 };   // 0-1, drives the tyre smoke

    this.gear = 1;        // -1 = reverse, 1-6 = forward gears
    this.rpm = this.spec.idleRpm;
    this.shiftTimer = 0;  // > 0 while a shift is happening
    this.autoShiftCooldown = 0;
    this.cvtRatio = this.spec.cvtRange[1];
    this.throttleAmount = 0;  // for the engine sound
    this.engineLoad = 0;      // 0-1, how hard the engine is working
    this.limiter = false;     // on the rev limiter or over-revving (dash shows red)
    this.limiterCut = false;  // true during each ignition cut burst
    this.onLimiter = false;   // bouncing off the limiter with the throttle down
    this.overRevLock = 0;     // seconds left of rear-wheel lock from a bad downshift
    this.overRevSeverity = 0;
    this.lastRearSlide = 0;
    this.launchTime = -1;     // seconds since pulling away began (-1 = not launching)
    this.lastWheelspin = 0;
    this.latAccel = 0;        // sideways acceleration, for the weight shift onto the outer wheels
    this.freshTyres();
    this.tractionControl = false;   // true while traction control is cutting power
    this.absActive = false;         // true while ABS is easing the brakes
    this.absSteerLoss = 0;          // steering grip given up at lower ABS levels
    this.wheelsLocked = false;      // true while the brakes have locked the wheels
    this.engineHealth = 1;    // drops after big over-revs (1 = full power, 0 = blown)
    this.engineBlown = false;
    this.oilLevel = 1;        // engine oil, 1 = full. Drains while leaking.
    this.fuel = this.spec.fuelCapacity;   // litres in the tank (resets full)
    this.misfiring = false;   // sputtering on the last drops of fuel
    this.clutchIn = false;    // X held: engine disconnected from the wheels
    this.clutchPedal = 0;     // 0 = foot off the clutch, 1 = pedal to the floor
    this.clutchWasIn = false;
    this.clutchDump = 0;      // seconds left of a clutch-dump kick
    this.dumpStrength = 0;
    this.knock = 0;           // 0-1, rod knock from oil starvation (for the sound)
    this.limiterClock = 0;
    this.events = [];         // shift events for the sound to pick up
    // --- Crash damage (all repaired on reset) ---
    this.radiator = 1;        // 1 = intact, 0 = smashed (a nose-first hit)
    this.coolant = 1;         // coolant left in the system (leaks from a holed radiator)
    this.coolantTemp = 0.45;  // engine temperature gauge: ~0.45 normal, 1 = boiling
    this.fuelLeak = 0;        // litres per second leaking from a split tank (rear hits)
    this.wheelBend = [0, 0, 0, 0];   // each wheel knocked out of line, radians (+ = toe out to the left)
    this.noseCrush = 0;       // metres the nose has been pushed in
    this.tailCrush = 0;       // metres the back has been pushed in
    this.dryTime = 0;         // seconds the engine has run with (almost) no coolant
    this.oilSmoke = 0;        // 0-1: black smoke from oil cooking in an overheated engine
    this.overheatKnock = 0;   // 0-1: pre-ignition knock from a cooking engine
    this.oilMilky = 0;        // 0-1: coolant mixed into the oil (milky)
    this.distance = 0;        // metres driven since the last reset (the oil darkens with it)
    this.onFire = false;      // engine bay fire
    this.fireLevel = 0;       // 0-1, how big the flames are
    this.fireTime = 0;        // seconds since it caught
    // --- Four-wheel state ---
    this.w4 = {
      omega: [0, 0, 0, 0],      // each wheel's spin, rad/s
      angle: [0, 0, 0, 0],      // each wheel's rotation, for drawing
      kappa: [0, 0, 0, 0],      // each tyre's slip ratio
      slipAngle: [0, 0, 0, 0],  // each tyre's slip angle (radians)
      absK: [1, 1, 1, 1],       // ABS: how much brake each wheel is allowed
      tcsCut: 1,                // traction control: share of the power let through
      Fz: [0, 0, 0, 0], spring: [0, 0, 0, 0], comp: [0, 0, 0, 0], hanging: [false, false, false, false],
      road: [0, 0, 0, 0], roadRate: [0, 0, 0, 0], roadSet: false, at: new Float64Array(8),
      heave: 0, pitch: 0, roll: 0, heaveV: 0, pitchV: 0, rollV: 0, ax: 0, ay: 0,
      synced: false, lastVx: 0,
      kick: 0, kickV: 0,        // the steering being knocked by the road
    };
    // The body on its springs, for drawing: height (m), pitch (+ = nose
    // down) and roll (+ = leaning right), and how compressed each corner is
    this.body = { heave: 0, pitch: 0, roll: 0, travel: [0, 0, 0, 0] };
  }

  // --- Crash damage ---
  // A hit from the game's collisions. zone: 'front', 'rear', 'left' or
  // 'right' (which part of the car hit); speed: how fast that part was going
  // into the barrier (m/s); along: where along the car (+ = towards the
  // front, metres from the middle); across: + = left side.
  // What breaks depends on where and how hard:
  //   front: crumples the nose and holes the radiator; hit it again (or
  //          very hard) and the engine behind it gets damaged too
  //   rear:  crumples the tail and can split the fuel tank
  //   side:  bends the wheel on that corner out of line (the car pulls),
  //          and a hard one can puncture the tyre
  //   big hits on a damaged engine, or with fuel leaking, can start a fire
  crashHit({ zone, speed, along = 0, across = 0 }) {
    if (!(speed > 2.5)) return;
    const v = speed;
    const wheelNear = (front, left) => (front ? 0 : 2) + (left ? 0 : 1);
    const bend = (i, amount, dir) => {
      this.wheelBend[i] = clamp(this.wheelBend[i] + Math.min(0.03, amount) * dir, -0.06, 0.06);
    };
    if (zone === 'front') {
      const wasHoled = this.radiator < 0.75;
      this.noseCrush = Math.min(0.32, this.noseCrush + Math.max(0, v - 3) * 0.022);
      const radBefore = this.radiator;
      this.radiator = Math.max(0, this.radiator - Math.max(0, v - 3.5) / 14);
      // The cooling system is under pressure: a holed radiator doesn't just
      // seep, it bursts out in a pink spray (and steam) right away
      if (this.radiator < radBefore && this.coolant > 0.05) {
        this.events.push({ type: 'coolantBurst', strength: clamp((radBefore - this.radiator) * 2, 0.3, 1) });
        this.coolant = Math.max(0, this.coolant - (radBefore - this.radiator) * 0.25);
      }
      // a big one can crack the head: coolant gets into the oil
      if (v > 12) this.oilMilky = Math.min(1, this.oilMilky + (v - 12) * 0.03);
      // The engine sits right behind the radiator, so the next hit MAY reach
      // it (or a very hard first one): more likely the harder you hit, and
      // how badly varies. A light knock usually gets away with it.
      if (v > 6 && (wasHoled || v > 15)) {
        const chance = clamp((v - 6) / (wasHoled ? 16 : 24), 0, 0.85);
        if (Math.random() < chance) this.damageEngine((v - 6) / (wasHoled ? 14 : 22) * (0.4 + 0.9 * Math.random()));
      }
      // Off-centre: the front wheel on that side gets knocked back too
      if (Math.abs(across) > 0.5 && v > 5) bend(wheelNear(true, across > 0), (v - 5) * 0.0025, across > 0 ? 1 : -1);
    } else if (zone === 'rear') {
      this.tailCrush = Math.min(0.25, this.tailCrush + Math.max(0, v - 3) * 0.018);
      if (v > 7) this.fuelLeak = Math.min(0.6, this.fuelLeak + (v - 7) * 0.025);
      if (Math.abs(across) > 0.5 && v > 5) bend(wheelNear(false, across > 0), (v - 5) * 0.0025, across > 0 ? 1 : -1);
    } else {
      const left = zone === 'left';
      const front = along > -0.2;
      const i = wheelNear(front, left);
      bend(i, (v - 2.5) * 0.004, left ? -1 : 1);       // pushed in towards the car
      if (v > 8) this.puncture(i, 0.04 * (v - 8));
    }
    // Fire: a big hit on a badly damaged engine, or with fuel spilling out
    const fireChance = (this.engineHealth < 0.35 && v > 8 ? 0.35 : 0)
      + (this.fuelLeak > 0 && v > 10 ? 0.3 : 0) + (v > 25 ? 0.25 : 0);
    if (!this.onFire && Math.random() < fireChance) this.catchFire();
    this.events.push({ type: 'crash', zone, speed: v });
  }

  // Damage the engine directly (crash, overheating). Blows at zero.
  // How well each brake grips for its temperature (1 = full)
  brakeFade(i) {
    const d = this.spec.brakeDiscs;
    const t = this.brakeTemp[i];
    if (t <= d.fadeStart) return 1;
    return 1 - (1 - d.fadeMin) * clamp((t - d.fadeStart) / (d.fadeEnd - d.fadeStart), 0, 1);
  }

  // Brake discs: warmed by braking, cooled by the air (and glowing when
  // they're really hot, which also sheds heat by itself)
  updateBrakes(dt) {
    const d = this.spec.brakeDiscs;
    const v = Math.hypot(this.vx, this.vy);
    for (let i = 0; i < 4; i++) {
      const front = i < 2;
      const cap = front ? d.heatFront : d.heatRear;
      let t = this.brakeTemp[i] + this.brakeHeat[i] * 0.9 / cap;   // (most of the heat goes into the disc; the rest into the pads)
      this.brakeHeat[i] = 0;
      const air = (6 + 1.1 * v) * (front ? d.coolFront : d.coolRear) * (1 + 0.4 * this.trackWetness);   // W per °C (spray off a wet track cools them too)
      const K = t + 273, A = AMBIENT_TEMP + 273;
      const glow = 0.6 * 5.67e-8 * 0.1 * (K * K * K * K - A * A * A * A);
      t -= (air * (t - AMBIENT_TEMP) + glow) * dt / cap;
      this.brakeTemp[i] = Math.max(AMBIENT_TEMP, Math.min(1100, t));
      if (this.tyres[i]) this.tyres[i].brakeTemp = this.brakeTemp[i];
    }
  }

  // =====================================================================
  // JUMPS AND ROLLOVERS: a free 3D body
  // Most of the time the car drives on the ground model above (fast, and
  // tuned to feel right). When all four wheels leave the ground, or it
  // tips up onto two wheels, it becomes a free body: it flies, spins and
  // tumbles under gravity, lands on its wheels (their springs and tyres
  // still work) or on its bodywork (the nose, the roll bar, the wings,
  // the tail), which scrapes, sparks and gets damaged. Once it's back on
  // four wheels and settled, it hands back to the ground model.
  // Axes: x = the car's left, y = up, z = forwards.
  // =====================================================================
  airAxes() {
    const q = this.fb.q;
    return { X: qrot(q, [1, 0, 0]), Y: qrot(q, [0, 1, 0]), Z: qrot(q, [0, 0, 1]) };
  }

  // Hand over from the ground model: same place, speed, tilt and spin
  enterAir(launch = null) {
    const s = this.spec, W4 = this.w4, GR = this.ground, F = this.fb;
    const L = launch || { y: GR.y, rate: GR.rate, slopeF: GR.slopeF, slopeL: GR.slopeL };
    const pitch = W4.pitch - Math.atan(L.slopeF), roll = W4.roll + Math.atan(L.slopeL);
    F.q = qmul(qmul(qaxis([0, 1, 0], this.heading), qaxis([1, 0, 0], pitch)), qaxis([0, 0, 1], roll));
    const { X, Y, Z } = this.airAxes();
    const oy = L.y + W4.heave;
    F.p = [this.x + Y[0] * s.cgHeight, oy + Y[1] * s.cgHeight, this.z + Y[2] * s.cgHeight];
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    F.v = [fx * this.vx + fz * this.vy, L.rate + W4.heaveV, fz * this.vx - fx * this.vy];
    F.w = [X[0] * W4.pitchV + Z[0] * W4.rollV, this.yawRate + X[1] * W4.pitchV + Z[1] * W4.rollV, X[2] * W4.pitchV + Z[2] * W4.rollV];
    F.settle = 0; F.time = 0;
    this.air = true;
    this.airSyncOut();
    this.events.push({ type: 'airborne' });
  }

  // Hand back to the ground model once it's settled on its wheels
  leaveAir() {
    const s = this.spec, W4 = this.w4, F = this.fb;
    const { Y, Z } = this.airAxes();
    this.air = false;
    this.x = F.p[0] - Y[0] * s.cgHeight; this.z = F.p[2] - Y[2] * s.cgHeight;
    this.heading = Math.atan2(Z[0], Z[2]);
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    this.vx = F.v[0] * fx + F.v[2] * fz;
    this.vy = F.v[0] * fz - F.v[2] * fx;
    this.yawRate = F.w[1];
    // the body's own tilt and bounce on top of the slope (kept small: it's settled)
    const GR = this.ground;
    const oy = F.p[1] - Y[1] * s.cgHeight;
    W4.heave = clamp(oy - GR.y, -0.06, 0.06);
    W4.pitch = clamp(-Math.asin(clamp(Z[1], -1, 1)) + Math.atan(GR.slopeF), -0.05, 0.05);
    const Xv = qrot(F.q, [1, 0, 0]);
    W4.roll = clamp(Math.asin(clamp(Xv[1], -1, 1)) - Math.atan(GR.slopeL), -0.05, 0.05);
    W4.heaveV = clamp(F.v[1] - GR.rate, -1, 1); W4.pitchV = 0; W4.rollV = 0;
    GR.synced = false;
    this.airHeight = 0;
    this.events.push({ type: 'landed' });
  }

  // While on the ground: should it take off, or tip over?
  checkTakeOff(h, Fz) {
    const F = this.fb, W4 = this.w4;
    const all = W4.hanging[0] && W4.hanging[1] && W4.hanging[2] && W4.hanging[3];
    F.lift = all ? F.lift + h : 0;
    // two wheels on one side off the ground (or both fronts / both rears)
    const sideUp = (Fz[0] + Fz[2] < 1) || (Fz[1] + Fz[3] < 1);
    const endUp = (Fz[0] + Fz[1] < 1) || (Fz[2] + Fz[3] < 1);
    F.side = sideUp ? F.side + h : 0;
    F.end = endUp ? F.end + h : 0;
    if (F.lift > 0.025 || F.side > 0.12 || F.end > 0.15) { F.lift = F.side = F.end = 0; this.enterAir(); }
  }

  // While free: back on all four wheels, upright and calm?
  checkLanding(h, Fz) {
    const F = this.fb;
    const { X, Y, Z } = this.airAxes();
    const allDown = Fz[0] > 60 && Fz[1] > 60 && Fz[2] > 60 && Fz[3] > 60;
    const pitchRate = Math.abs(F.w[0] * X[0] + F.w[1] * X[1] + F.w[2] * X[2]);
    const rollRate = Math.abs(F.w[0] * Z[0] + F.w[1] * Z[1] + F.w[2] * Z[2]);
    const calm = Y[1] > 0.93 && pitchRate < 0.7 && rollRate < 0.7 && Math.abs(F.v[1]) < 1.2;
    F.settle = allDown && calm ? F.settle + h : 0;
    if (F.settle > 0.12) { F.settle = 0; this.leaveAir(); }
  }

  // Someone else moved the car (a wall pushed it, the game reset it): pass
  // that on to the free body
  airSyncIn() {
    const F = this.fb, S = F.sync;
    if (!S) return;
    if (this.x !== S.x || this.z !== S.z) { F.p[0] += this.x - S.x; F.p[2] += this.z - S.z; }
    if (this.vx !== S.vx || this.vy !== S.vy || this.yawRate !== S.yaw) {
      const fx = Math.sin(S.h), fz = Math.cos(S.h);
      const dvx = this.vx - S.vx, dvy = this.vy - S.vy;
      F.v[0] += fx * dvx + fz * dvy; F.v[2] += fz * dvx - fx * dvy;
      F.w[1] += this.yawRate - S.yaw;
    }
  }

  // Share the free body's state with the rest of the game (and the 2D view
  // of it: where it is, which way it points, how fast)
  airSyncOut() {
    const s = this.spec, F = this.fb;
    const { Y, Z } = this.airAxes();
    this.x = F.p[0]; this.z = F.p[2];
    if (Math.hypot(Z[0], Z[2]) > 0.15) this.heading = Math.atan2(Z[0], Z[2]);
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    this.vx = F.v[0] * fx + F.v[2] * fz;
    this.vy = F.v[0] * fz - F.v[2] * fx;
    this.yawRate = F.w[1];
    F.sync = { x: this.x, z: this.z, vx: this.vx, vy: this.vy, yaw: this.yawRate, h: this.heading };
    // the model's origin (on the ground under the middle when it's upright)
    this.pose.x = F.p[0] - Y[0] * s.cgHeight; this.pose.y = F.p[1] - Y[1] * s.cgHeight; this.pose.z = F.p[2] - Y[2] * s.cgHeight;
    this.pose.q[0] = F.q[1]; this.pose.q[1] = F.q[2]; this.pose.q[2] = F.q[3]; this.pose.q[3] = F.q[0];
    this.airHeight = this.pose.y - this.groundHeight(this.pose.x, this.pose.z);
  }

  // Each small step while free: how hard each wheel's spring presses on
  // the ground, and how fast each tyre is moving over it (for the tyres)
  airWheels(Fz, staticF, staticR) {
    const s = this.spec, F = this.fb, susp = s.suspension;
    const { X, Y, Z } = this.airAxes();
    const cg = s.cgHeight;
    for (let i = 0; i < 4; i++) {
      const w = WHEEL_ORDER[i];
      const a = w.front ? s.cgToFront : -s.cgToRear, b = w.side * s.trackHalf;
      // where the tyre touches (at rest) in the world, from the centre of mass
      const r = [X[0] * b - Y[0] * cg + Z[0] * a, X[1] * b - Y[1] * cg + Z[1] * a, X[2] * b - Y[2] * cg + Z[2] * a];
      const c = [F.p[0] + r[0], F.p[1] + r[1], F.p[2] + r[2]];
      const vc = add3(F.v, cross3(F.w, r));
      const ground = this.groundHeight(c[0], c[2]) + this.roadHeight(c[0], c[2]) - this.tyreSink[i];
      // how far the spring is squashed (along the strut, which points up the car)
      const up = Math.max(0, Y[1]);
      const comp = (ground - c[1]) * up;
      const rate = -vc[1] * up;
      const hanging = comp < -susp.droop || up < 0.35;
      F.travel[i] = clamp(comp, -susp.droop, susp.bumpStop + 0.03);
      if (hanging) { Fz[i] = 0; F.N[i] = 0; }
      else {
        const knee = 0.3, dv = rate;
        const damp = Math.abs(dv) < knee ? dv : Math.sign(dv) * (knee + 0.5 * (Math.abs(dv) - knee));
        let f = (i < 2 ? staticF : staticR) + (i < 2 ? susp.springFront : susp.springRear) * comp + (i < 2 ? susp.damperFront : susp.damperRear) * damp;
        if (comp > susp.bumpStop) f += susp.bumpStopRate * (comp - susp.bumpStop);
        // (a tyre and its bump rubber can only push so hard: it squashes)
        Fz[i] = clamp(f, 0, 16000);
        F.N[i] = Fz[i];
      }
      F.r = F.r || [[], [], [], []];
      F.r[i] = r;
      // the tyre's speed over the ground, in the car's own directions
      F.vf[i] = vc[0] * Z[0] + vc[1] * Z[1] + vc[2] * Z[2];
      F.vl[i] = vc[0] * X[0] + vc[1] * X[1] + vc[2] * X[2];
    }
  }

  // Move the free body one small step: gravity, air, the wheels, and any
  // part of the bodywork touching the ground
  airStep(h) {
    const s = this.spec, F = this.fb;
    const m = s.mass + (this.fuel - s.fuelCapacity / 2) * s.fuelDensity;
    const { X, Y, Z } = this.airAxes();
    const force = [0, -m * G, 0], torque = [0, 0, 0];
    const push = (f, r) => { force[0] += f[0]; force[1] += f[1]; force[2] += f[2]; const t = cross3(r, f); torque[0] += t[0]; torque[1] += t[1]; torque[2] += t[2]; };
    // air resistance
    const sp = Math.hypot(F.v[0], F.v[1], F.v[2]);
    force[0] -= s.drag * sp * F.v[0]; force[1] -= s.drag * sp * F.v[1]; force[2] -= s.drag * sp * F.v[2];
    // the wheels: the spring pushes up the car, the tyre pushes along the ground
    for (let i = 0; i < 4; i++) {
      if (!F.N[i] && !F.fx[i] && !F.fy[i]) continue;
      const r = F.r[i];
      push([Y[0] * F.N[i] + Z[0] * F.fx[i] + X[0] * F.fy[i], Y[1] * F.N[i] + Z[1] * F.fx[i] + X[1] * F.fy[i], Y[2] * F.N[i] + Z[2] * F.fx[i] + X[2] * F.fy[i]], r);
    }
    // the bodywork touching the ground: pushed back out, sliding with friction
    let scrape = 0, hardest = 0, hitPt = null;
    for (const pt of BODY_POINTS) {
      const r = [X[0] * pt[0] + Y[0] * (pt[1] - s.cgHeight) + Z[0] * pt[2], X[1] * pt[0] + Y[1] * (pt[1] - s.cgHeight) + Z[1] * pt[2], X[2] * pt[0] + Y[2] * (pt[1] - s.cgHeight) + Z[2] * pt[2]];
      const wp = [F.p[0] + r[0], F.p[1] + r[1], F.p[2] + r[2]];
      const gy = this.groundHeight(wp[0], wp[2]);
      const pen = gy - wp[1];
      if (pen <= 0) continue;
      const n = this.groundNormal(wp[0], wp[2]);
      const vp = add3(F.v, cross3(F.w, r));
      const vn = vp[0] * n[0] + vp[1] * n[1] + vp[2] * n[2];
      const fn = Math.max(0, 90000 * Math.min(pen, 0.25) - 5000 * vn);
      if (-vn > hardest) { hardest = -vn; hitPt = pt; }
      const vt = [vp[0] - n[0] * vn, vp[1] - n[1] * vn, vp[2] - n[2] * vn];
      const vts = Math.hypot(vt[0], vt[1], vt[2]);
      const mu = 0.55 * this.surfaceGrip(wp[0], wp[2]);
      const ft = vts > 1e-4 ? Math.min(mu * fn, vts * 4000) / vts : 0;
      push([n[0] * fn - vt[0] * ft, n[1] * fn - vt[1] * ft, n[2] * fn - vt[2] * ft], r);
      scrape = Math.max(scrape, vts * Math.min(1, fn / 3000));
      if (pen > 0.02 && fn > 0) F.scrapeAt = wp;
    }
    F.scrape = scrape;
    // a hard landing on the bodywork: damage (front, back or sides)
    F.time += h;
    if (hardest > 4 && F.time - F.hitAt > 0.4 && hitPt) {
      F.hitAt = F.time;
      const zone = hitPt[2] > 1.0 ? 'front' : hitPt[2] < -1.0 ? 'rear' : hitPt[0] > 0 ? 'left' : 'right';
      // (bottoming out on the floor after a jump only hurts if it's really hard)
      const floor = hitPt[1] < 0.2;
      if (!floor || hardest > 7) this.crashHit({ zone, speed: hardest * (floor ? 0.45 : 0.8), along: hitPt[2], across: hitPt[0] });
      if (!floor) this.events.push({ type: 'bodyHit', zone, speed: hardest, local: hitPt });
    }
    // move
    const a = [force[0] / m, force[1] / m, force[2] / m];
    F.v[0] += a[0] * h; F.v[1] += a[1] * h; F.v[2] += a[2] * h;
    // spin: worked out in the car's own axes, where the inertia is simple
    const I = [s.airInertia.pitch, s.airInertia.yaw, s.airInertia.roll];
    const tb = [dot3(torque, X), dot3(torque, Y), dot3(torque, Z)];
    const wb = [dot3(F.w, X), dot3(F.w, Y), dot3(F.w, Z)];
    const Iw = [I[0] * wb[0], I[1] * wb[1], I[2] * wb[2]];
    const gyro = cross3(wb, Iw);
    for (let k = 0; k < 3; k++) wb[k] += ((tb[k] - gyro[k]) / I[k]) * h;
    // (a little damping from the air and the suspension soaking up the spin)
    wb[0] *= 1 - 0.4 * h; wb[2] *= 1 - 0.4 * h; wb[1] *= 1 - 0.2 * h;
    F.w = [X[0] * wb[0] + Y[0] * wb[1] + Z[0] * wb[2], X[1] * wb[0] + Y[1] * wb[1] + Z[1] * wb[2], X[2] * wb[0] + Y[2] * wb[1] + Z[2] * wb[2]];
    F.p[0] += F.v[0] * h; F.p[1] += F.v[1] * h; F.p[2] += F.v[2] * h;
    // turn the body by its spin
    const dq = qmul([0, F.w[0], F.w[1], F.w[2]], F.q);
    F.q = qnorm([F.q[0] + 0.5 * dq[0] * h, F.q[1] + 0.5 * dq[1] * h, F.q[2] + 0.5 * dq[2] * h, F.q[3] + 0.5 * dq[3] * h]);
    // never through the ground (a safety net for very hard landings)
    const lowest = this.groundHeight(F.p[0], F.p[2]) + 0.12;
    if (F.p[1] < lowest) { F.p[1] = lowest; if (F.v[1] < 0) F.v[1] = 0; }
    // what the car "feels" (for the g-meter and the sounds)
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    F.acc[0] = (a[0] * fx + a[2] * fz) / 8; F.acc[1] = (a[0] * fz - a[2] * fx) / 8;
    this.airSyncOut();
  }

  // Which way the ground faces at a point (for bodywork landing on a slope)
  groundNormal(x, z) {
    const e = 0.5;
    const dx = (this.groundHeight(x + e, z) - this.groundHeight(x - e, z)) / (2 * e);
    const dz = (this.groundHeight(x, z + e) - this.groundHeight(x, z - e)) / (2 * e);
    const l = Math.hypot(dx, 1, dz);
    return [-dx / l, 1 / l, -dz / l];
  }

  damageEngine(amount) {
    if (this.engineBlown || !(amount > 0)) return;
    this.engineHealth = Math.max(0, this.engineHealth - amount);
    if (this.engineHealth <= 0) this.blowEngine();
  }

  catchFire() {
    if (this.onFire) return;
    this.onFire = true;
    this.fireTime = 0;
    this.events.push({ type: 'fire' });
  }

  // --- Cooling: a holed radiator leaks coolant; with too little coolant the
  // engine overheats (the gauge climbs, steam pours out) and then cooks
  // itself. Also the fire, and fuel leaking from a split tank. ---
  updateDamage(dt) {
    const effort = this.engineDead ? 0 : 0.25 + 0.75 * clamp(this.rpm / this.spec.redline, 0, 1) * (0.4 + 0.6 * this.throttleAmount);
    if (this.radiator < 1 && this.coolant > 0) {
      this.coolant = Math.max(0, this.coolant - (1 - this.radiator) * 0.035 * dt);
    }
    const cooling = (0.35 + 0.65 * this.radiator) * clamp(this.coolant / 0.5, 0, 1);
    const target = this.engineDead ? 0.25
      : 0.42 + 0.1 * effort + (1 - cooling) * (0.25 + 0.75 * effort);
    this.coolantTemp += (target - this.coolantTemp) * Math.min(1, (target > this.coolantTemp ? 0.07 : 0.03) * dt);
    // --- Running dry: with the coolant gone the engine cooks. The oil
    // thins and burns (black smoke pours out, starting about half a minute
    // in), the fuel goes off by itself before the spark (pre-ignition) and
    // it starts to knock, a metallic tapping, losing power; then it seizes
    // and dies, about a minute in. Working it hard makes it all faster;
    // idling slows it down. Overheating also lets coolant into the oil.
    if (!this.engineDead && this.coolant < 0.12) {
      this.dryTime += dt * (0.5 + 0.8 * effort);
    }
    this.oilSmoke = this.engineBlown ? 0 : clamp((this.dryTime - 24) / 14, 0, 1);
    this.overheatKnock = this.engineBlown ? 0 : clamp((this.dryTime - 38) / 8, 0, 1);
    if (this.oilSmoke > 0) this.oilLevel = Math.max(0, this.oilLevel - 0.004 * this.oilSmoke * dt);   // burning it off
    // (a cooking engine's head gasket lets coolant seep into the oil: it turns milky)
    if (this.coolantTemp > 1 || this.dryTime > 10) this.oilMilky = Math.min(1, this.oilMilky + (0.006 + 0.01 * Math.max(0, this.coolantTemp - 1)) * dt);
    if (this.dryTime > 20 && !this.engineBlown) {
      const wornTo = 1 - clamp((this.dryTime - 20) / 36, 0, 1);         // gone at about 56 s
      if (this.engineHealth > wornTo) this.damageEngine(this.engineHealth - wornTo);
      if (this.engineBlown && Math.random() < 0.3) this.catchFire();
    }
    // Fuel from a split tank (faster while the car is moving and sloshing it)
    if (this.fuelLeak > 0 && this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - this.fuelLeak * 0.12 * dt);
    }
    // Fire: grows quickly, eats the engine, then burns itself out once
    // there's nothing much left to burn
    if (this.onFire) {
      this.fireTime += dt;
      const fuelLeft = this.fuelLeak > 0 ? Math.min(1, this.fuel / 4) : 1;
      const dying = this.fireTime > 30 ? Math.max(0, 1 - (this.fireTime - 30) / 15) : 1;
      this.fireLevel = Math.min(1, this.fireTime / 2) * dying * (0.4 + 0.6 * fuelLeft);
      this.damageEngine(0.07 * this.fireLevel * dt);
      if (dying <= 0) { this.onFire = false; this.fireLevel = 0; }
    }
  }

  // How much steam is coming off the radiator (0-1): leaking or boiling
  get steam() {
    if (this.radiator >= 1 && this.coolantTemp < 0.95) return 0;
    const leaking = this.coolant > 0 ? (1 - this.radiator) * 0.6 : 0;
    const boiling = clamp((this.coolantTemp - 0.9) / 0.15, 0, 1);
    return clamp(leaking + boiling, 0, 1);
  }

  // --- Tyres ---
  // A fresh set of the current compound: no wear, normal pressure
  freshTyres() {
    // blown: burst, the rubber flapping and shredding off. shred: 0-1, how much
    // has gone. rim: nothing left, running on the bare rim. heat: how close a
    // flat tyre being driven on is to bursting (0-1).
    // rimWear: how far a bare rim has been ground down (0-1). detached: the
    // wheel has come off and that corner is scraping along on the frame
    this.tyres = WHEEL_ORDER.map(() => ({
      wear: 0, pressure: 1, leak: 0, blown: false, shred: 0, rim: false, heat: 0, rimWear: 0, detached: false,
      temp: AMBIENT_TEMP,   // tread temperature, °C
    }));
    this.wheelLoad = [0, 0, 0, 0];
    this.tyreSink = [0, 0, 0, 0];   // how far each corner sits lower (flat tyres), metres
    this.flatDrag = 0;
  }

  setTyres(id) {
    if (!TYRES[id]) return;
    this.tyreCompound = id;
    this.freshTyres();
  }

  // A sharp object went into this tyre: a slow puncture.
  // rate: share of the air lost per second at first (it slows as it empties)
  puncture(wheel, rate) {
    const t = this.tyres[wheel];
    if (!t || t.pressure <= 0 || t.blown) return;
    t.leak = Math.max(t.leak, rate);
    this.events.push({ type: 'puncture', wheel });
  }

  // On a surface off the tarmac: the share of tarmac grip left, and the drag,
  // for the tyres fitted now
  surfaceGripFor(surface) {
    const sf = SURFACES[surface];
    return sf ? sf.grip[TYRES[this.tyreCompound].kind] ?? 0.55 : 1;
  }

  surfaceDragFor(surface) {
    const sf = SURFACES[surface];
    if (!sf) return 0;
    return TYRES[this.tyreCompound].kind === 'dirt' ? sf.dirtTyreDrag : sf.drag;
  }

  // A tyre bursts: all the air goes at once, and the rubber starts to shred
  blowout(wheel) {
    const t = this.tyres[wheel];
    if (!t || t.blown) return;
    t.blown = true;
    t.pressure = 0;
    t.leak = 0;
    t.shred = 0;
    this.events.push({ type: 'blowout', wheel });
  }

  // How much grip one tyre has, from its compound, wear and pressure
  tyreGrip(i) {
    const t = this.tyres[i];
    if (t.detached) return this.spec.frameGrip;          // no wheel: the frame on the road
    if (t.rim) return this.spec.rimGrip;                 // steel on tarmac
    if (t.blown) return TYRES[this.tyreCompound].grip * 0.42 * (1 - 0.3 * t.shred);   // flapping rubber
    const compound = TYRES[this.tyreCompound];
    const wearGrip = 1 - 0.35 * Math.pow(t.wear, 1.4);          // worn tyres grip less
    const pressureGrip = 0.5 + 0.5 * Math.pow(t.pressure, 0.6);  // a flat still grips, badly
    return compound.grip * wearGrip * pressureGrip * this.tempGrip(t);
  }

  // The temperature range the fitted tyres work best in, °C { lo, hi }
  get tempWindow() {
    return TEMP_WINDOW[TYRES[this.tyreCompound].kind] || TEMP_WINDOW.road;
  }

  // How much of its grip a tyre has at its temperature (1 = in its window)
  tempGrip(t) {
    const w = TEMP_WINDOW[TYRES[this.tyreCompound].kind] || TEMP_WINDOW.road;
    if (t.temp < w.lo) return 1 - w.cold * Math.min(1, (w.lo - t.temp) / Math.max(10, w.lo - AMBIENT_TEMP));
    if (t.temp > w.hi) return 1 - Math.min(0.25, (t.temp - w.hi) / 60);
    return 1;
  }

  // An assist's level, 0 (off) to 5 (strongest)
  assistLevel(name) {
    const v = this.assists[name];
    if (v === true) return 5;
    if (!v) return 0;
    return clamp(Math.round(v), 0, 5);
  }

  // Total speed in km/h, for the display
  get speedKmh() {
    return Math.hypot(this.vx, this.vy) * 3.6;
  }

  get gearLabel() {
    if (this.gear === -1) return 'R';
    if (this.transmission === 'cvt') return 'D';
    return String(this.gear);
  }

  setTransmission(name) {
    this.transmission = name;
    if (this.gear > 0) this.gear = this.bestAutoGear(1);
  }

  // --- Reverse (R) for automatic and CVT: only when almost stopped ---
  // (a manual selects reverse by shifting down from 1st instead)
  toggleReverse() {
    if (this.transmission === 'manual' || Math.abs(this.vx) > 1) return false;
    const toReverse = this.gear !== -1;
    this.gear = toReverse ? -1 : 1;
    const style = this.transmission === 'manual' ? 'manual' : 'auto';
    this.shiftTimer = this.spec.shiftTime[style];
    this.events.push({ type: 'shift', style, direction: toReverse ? 'reverse' : 'forward' });
    return true;
  }

  // --- Manual shifting (Q / E) ---
  shiftUp() {
    if (this.transmission !== 'manual') return;
    if (this.gear === -1) {
      if (Math.abs(this.vx) <= 1) this.startShift(1, 'up');   // out of reverse only when stopped
    } else if (this.gear < this.spec.gears.length) this.startShift(this.gear + 1, 'up');
  }

  shiftDown() {
    if (this.transmission !== 'manual' || this.gear === -1) return;
    const s = this.spec;
    if (this.gear === 1) {
      // Down from 1st is reverse, but only when (almost) stopped.
      // Try it while rolling and the gears grind and refuse.
      if (Math.abs(this.vx) <= 1) this.startShift(-1, 'down');
      else this.events.push({ type: 'grind' });
      return;
    }
    // No protection: a downshift at too high a speed over-revs the engine
    const newRpm = this.wheelRpm() * s.gears[this.gear - 2] * s.finalDrive;
    this.startShift(this.gear - 1, 'down');
    if (newRpm > s.redline + 300) {
      // The sudden engine braking briefly locks the rear wheels
      const severity = clamp((newRpm - s.redline) / 2500, 0.15, 1);
      this.overRevLock = Math.max(this.overRevLock, 0.25 + 0.35 * severity);
      this.overRevSeverity = Math.max(this.overRevSeverity, severity);
      // Engine damage depends on how far past what the engine can take it was
      // forced: about 5% over is shrugged off, 10% over costs ~10% health,
      // 25% over ~33%, and double the redline destroys the engine outright.
      const overRatio = newRpm / s.redline;
      const damage = clamp((overRatio - 1.03) * 1.5, 0, 1);
      if (!this.engineBlown) {
        this.engineHealth = Math.max(0, this.engineHealth - damage);
        if (this.engineHealth <= 0) this.blowEngine();
      }
      this.events.push({ type: 'overrev', severity, damage });
    }
  }

  // Health hits zero: something lets go inside. No more power until reset.
  blowEngine() {
    this.engineHealth = 0;
    this.engineBlown = true;
    this.events.push({ type: 'blown' });
  }

  // Leaking oil once the engine is badly damaged
  get leakingOil() {
    return this.engineHealth < 0.1 && this.oilLevel > 0;
  }

  // --- Oil: drains while leaking; running low starves and wrecks the engine ---
  // Later, pit stops will be able to fix leaks and top the oil back up.
  updateOil(dt) {
    const s = this.spec;
    if (this.leakingOil) {
      // A cracked engine drips; a blown one pours
      // (slower as it runs low: less oil, less pressure pushing it out)
      const drain = (this.engineBlown ? s.oilPourRate : s.oilLeakRate) * (0.3 + 0.7 * Math.min(1, this.oilLevel / 0.25));
      this.oilLevel = Math.max(0, this.oilLevel - drain * dt);
    }
    if (this.engineBlown) {
      this.knock = 0;
      return;
    }
    // Below 30% oil the bearings start to starve. The lower the oil and the
    // harder the engine is worked, the faster it destroys itself. At 0% it's
    // a ticking time bomb: you can hear the rods knocking.
    const starvation = clamp((0.3 - this.oilLevel) / 0.3, 0, 1);
    this.knock = Math.max(starvation, this.overheatKnock);      // (or the knock of an overheated engine)
    if (starvation > 0) {
      const effort = 0.2 + 0.8 * clamp(this.rpm / s.redline, 0, 1);
      this.engineHealth -= starvation * effort * s.starvationDamage * dt;
      if (this.engineHealth <= 0) this.blowEngine();
    }
  }

  // The engine isn't running: blown up, or out of fuel
  get engineDead() {
    return this.engineBlown || this.fuel <= 0;
  }

  get fuelLevel() {
    return this.fuel / this.spec.fuelCapacity;
  }

  // How well the engine runs on the oil it has left (1 = fine)
  get oilFactor() {
    return 1 - 0.3 * clamp((0.3 - this.oilLevel) / 0.3, 0, 1);
  }

  startShift(newGear, direction) {
    this.gear = newGear;
    const type = this.transmission === 'manual' ? 'manual' : 'auto';
    this.shiftTimer = this.spec.shiftTime[type];
    this.events.push({ type: 'shift', style: type, direction });
  }

  wheelRpm() {
    return Math.abs(this.vx / this.spec.wheelRadius) * RPM_PER_RADS;
  }

  // Automatic: picks a gear from the speed, shifting earlier at light throttle
  bestAutoGear(throttle) {
    const kmh = Math.abs(this.vx) * 3.6;
    const ups = this.spec.autoUpshiftKmh;
    const upScale = throttle > 0.5 ? 1 : 0.65;
    const downScale = throttle > 0.5 ? 0.75 : 0.5;
    let g = clamp(this.gear, 1, ups.length + 1);
    if (g <= ups.length && kmh > ups[g - 1] * upScale) return g + 1;
    // Downshifts can skip gears, so hard braking doesn't leave it in too tall a gear
    while (g > 1 && kmh < ups[g - 2] * downScale) g -= 1;
    return g;
  }

  // Advance the simulation by dt seconds, in small steps for stability
  update(controls, dt) {
    if (!(dt > 0)) return;   // skip zero-length frames (the very first one can be 0)
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(controls, h);
    this.updateOil(dt);
    this.updateDamage(dt);
    this.updateBrakes(dt);
    // Safety net: if anything ever produces an invalid number, put the
    // car back at the start rather than letting it vanish
    if (!Number.isFinite(this.x + this.z + this.heading + this.vx + this.vy + this.yawRate + this.rpm)) {
      const transmission = this.transmission;
      this.reset();
      this.transmission = transmission;
    }
  }

  step(c, h) {
    const s = this.spec;
    // The car gets lighter as the fuel burns off (about 27 kg when full)
    const m = s.mass + (this.fuel - s.fuelCapacity / 2) * s.fuelDensity;
    const L = s.cgToFront + s.cgToRear;

    // --- Steering: less lock at high speed, and the wheels turn smoothly ---
    // At speed the wheels also turn in more gradually, like a driver easing
    // the wheel instead of yanking it, but still straighten up quickly.
    const speedFactor = 1 + Math.abs(this.vx) / 14;   // (four separate tyres need a bit more lock than the old single-axle model)
    let steerLimit = s.maxSteer / speedFactor;
    // Countersteer: steering against a slide gets extra lock (enough to point
    // the front wheels where the car is actually going) at full speed, so
    // slides can be caught. Turning into a corner stays gentle at speed.
    const countersteering = c.steer * this.yawRate < 0 && Math.abs(this.yawRate) > 0.05;
    if (countersteering) {
      const slideAngle = Math.abs(Math.atan2(this.vy, Math.max(Math.abs(this.vx), 1)));
      steerLimit = Math.min(s.maxSteer, steerLimit + slideAngle);
    }
    // A front wheel on its bare rim fights the steering: less lock, slower to
    // turn, and it chatters (the rim skipping over the road)
    const frontRims = (this.tyres[0].rim ? 1 : 0) + (this.tyres[1].rim ? 1 : 0);
    const frontGone = (this.tyres[0].detached ? 1 : 0) + (this.tyres[1].detached ? 1 : 0);
    steerLimit *= (1 - 0.18 * frontRims) * (1 - 0.35 * frontGone);   // a missing front wheel: hardly any steering
    // Bent wheels from a crash pull the car to one side (the driver has to
    // hold some opposite lock to go straight)
    const wb = this.wheelBend;
    const pull = 0.5 * (wb[0] + wb[1]) + 0.35 * (wb[2] + wb[3]);
    const target = c.steer * steerLimit + pull + (frontRims ? (Math.random() - 0.5) * 0.02 * frontRims : 0);
    const turningIn = !countersteering && Math.abs(target) > Math.abs(this.steer)
      && Math.sign(target) === Math.sign(this.steer || target);
    const rate = (turningIn ? s.steerSpeed / Math.pow(speedFactor, 1.5) : s.steerSpeed) * (1 - 0.35 * frontRims);
    this.steer += clamp(target - this.steer, -rate * h, rate * h);
    const d = this.steer;

    // =====================================================================
    // FOUR WHEELS. Each tyre works on its own: its own load (from the
    // suspension), its own slip angle (how far it's pointing away from where
    // it's actually rolling) and its own slip ratio (spinning faster or
    // slower than the road). Each wheel spins on its own too, so one can
    // lock, spin up or drop onto the grass by itself. The body sits on four
    // springs and dampers, so it dives under braking, squats when you
    // accelerate and leans in corners, and that moves the weight between
    // the tyres. The forces from all four add up to move and turn the car.
    // =====================================================================
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);   // forward
    const lx = fz, lz = -fx;                                            // left
    const W4 = this.w4;
    // If something else moved the car (a reset, a crash, the start line),
    // set the wheels turning at the road speed
    if (!W4.synced || Math.abs(this.vx - W4.lastVx) > 2.5) {
      for (let i = 0; i < 4; i++) W4.omega[i] = this.vx / s.wheelRadius;
      W4.synced = true;
    }

    // --- Hills: the ground's height under each wheel. The car sits on the
    // slope those four points make (it tilts with it); any twist left over
    // goes into the suspension like a bump. Gravity pulls the car down the
    // slope, and going over a crest or through a dip makes it lighter or
    // heavier on its springs. ---
    const GR = this.ground, gh = [0, 0, 0, 0];
    WHEEL_ORDER.forEach((w, i) => {
      const a = w.front ? s.cgToFront : -s.cgToRear, b = w.side * s.trackHalf;
      gh[i] = this.groundHeight(this.x + fx * a + lx * b, this.z + fz * a + lz * b);
    });
    let launch = null;
    {
      const hf = (gh[0] + gh[1]) / 2, hr = (gh[2] + gh[3]) / 2;
      const wb = s.cgToFront + s.cgToRear;
      const slopeF = (hf - hr) / wb;
      const slopeL = ((gh[0] + gh[2]) - (gh[1] + gh[3])) / 2 / (2 * s.trackHalf);
      const y = hr + (hf - hr) * s.cgToRear / wb;
      // (moved somewhere new, like a reset: just settle onto the ground there)
      const jumped = Math.hypot(this.x - (GR.px ?? this.x), this.z - (GR.pz ?? this.z)) > 5;
      if (!GR.synced || jumped) { GR.y = y; GR.rate = 0; GR.accel = 0; GR.rawRate = 0; GR.synced = true; GR.slopeF = slopeF; GR.slopeL = slopeL; }
      GR.px = this.x; GR.pz = this.z;
      // Leaving the ground: off the lip of a ramp or a ledge (the ground
      // drops away faster than the car could fall), or the ground under it
      // twisting suddenly (one side hits a ramp, a ridge or a high kerb)
      if (!this.air && Math.hypot(this.vx, this.vy) > 3) {
        const fall = GR.y + (GR.rawRate || 0) * h - 0.5 * G * h * h;
        const twist = Math.abs(slopeL - GR.slopeL) / h > 0.9 || Math.abs(slopeF - GR.slopeF) / h > 1.1;
        if (y < fall - 0.03 || twist) launch = { y: GR.y, rate: GR.rawRate || 0, slopeF: GR.slopeF, slopeL: GR.slopeL };
      }
      GR.slopeF = slopeF; GR.slopeL = slopeL;
      // (smoothed: the ground is made of small flat triangles)
      const rate = (y - GR.y) / h;
      GR.rawRate = rate;
      const newRate = GR.rate + (rate - GR.rate) * Math.min(1, h / 0.12);
      GR.accel += (clamp((newRate - GR.rate) / h, -12, 12) - GR.accel) * Math.min(1, h / 0.12);
      GR.rate = newRate;
      GR.y = y;
    }
    if (launch) this.enterAir(launch);
    const groundTwist = WHEEL_ORDER.map((w, i) => {
      const a = w.front ? s.cgToFront : -s.cgToRear, b = w.side * s.trackHalf;
      return gh[i] - (GR.y + GR.slopeF * a + GR.slopeL * b);
    });
    const slopePullF = -G * GR.slopeF / Math.sqrt(1 + GR.slopeF * GR.slopeF);   // gravity along the slope (m/s²)
    const slopePullL = -G * GR.slopeL / Math.sqrt(1 + GR.slopeL * GR.slopeL);

    // The ground and the tyre under each wheel
    const kind = TYRES[this.tyreCompound].kind;
    const shape = TYRE_SHAPE[kind] || TYRE_SHAPE.road;
    const mu = [0, 0, 0, 0], soft = [0, 0, 0, 0];
    const firm = (t) => (t.detached ? 0.25 : t.rim ? 0.6 : t.blown ? 0.3 : 0.35 + 0.65 * Math.pow(t.pressure, 0.8));
    WHEEL_ORDER.forEach((w, i) => {
      const a = w.front ? s.cgToFront : -s.cgToRear, b = w.side * s.trackHalf;
      const wx = this.x + fx * a + lx * b, wz = this.z + fz * a + lz * b;
      W4.at[i * 2] = wx; W4.at[i * 2 + 1] = wz;
      mu[i] = (w.front ? s.frontGrip : s.rearGrip) * this.surfaceGrip(wx, wz) * this.tyreGrip(i);
      soft[i] = firm(this.tyres[i]);
      // the road's height under the wheel (bumps, kerbs), less however far a
      // flat tyre or bare rim lets that corner drop. The tyre's own rubber
      // soaks up ripples shorter than its footprint, so what the suspension
      // feels is the road smoothed over the last ~40 cm rolled (without
      // this, tiny ripples at speed felt like hammer blows and kept
      // unloading the tyres)
      const raw = this.roadHeight(wx, wz) - this.tyreSink[i] + groundTwist[i];
      const rolled = Math.hypot(this.vx, this.vy) * h;
      const road = W4.roadSet ? W4.road[i] + (raw - W4.road[i]) * (1 - Math.exp(-rolled / 0.4 - h / 0.08)) : raw;
      W4.roadRate[i] = W4.roadSet ? clamp((road - W4.road[i]) / h, -1.5, 1.5) : 0;
      W4.road[i] = road;
    });
    W4.roadSet = true;

    // Loose ground and flat tyres drag the car back (and pull it towards
    // the side that's dragging)
    let flatDrag = 0, flatPull = 0;
    const ploughing = 0.3 + 0.7 * Math.min(1, Math.hypot(this.vx, this.vy) / 25);
    const loads = this.wheelLoad;
    WHEEL_ORDER.forEach((w, i) => {
      const t = this.tyres[i];
      let drag = (t.detached ? s.frameDrag : t.rim ? 0.07 + 0.08 * t.rimWear : t.blown ? 0.045 : 0.03 * Math.pow(1 - t.pressure, 1.5)) * loads[i];
      drag += this.surfaceDrag(W4.at[i * 2], W4.at[i * 2 + 1]) * ploughing * loads[i];
      flatDrag += drag;
      flatPull += drag * w.side * s.trackHalf;
    });
    this.flatDrag = flatDrag;
    // What each axle could grip right now (for the gearbox, traction control and the tyre bookkeeping)
    const maxFront = mu[0] * loads[0] + mu[1] * loads[1];
    const maxRear = mu[2] * loads[2] + mu[3] * loads[3];

    // W is always the accelerator and S always the brake, in any gear
    const throttle = c.throttle;
    this.handbrakeOn = c.handbrake;   // (rear tyres locked: for skid marks)
    const brakePedal = c.brake;

    // --- Automatic gear changes ---
    this.autoShiftCooldown -= h;
    if (this.transmission === 'auto' && this.gear > 0 && this.shiftTimer <= 0 && this.autoShiftCooldown <= 0 && !c.clutch) {
      const g = this.bestAutoGear(throttle);
      if (g !== this.gear) {
        const up = g > this.gear;
        this.startShift(g, up ? 'up' : 'down');
        this.autoShiftCooldown = up ? 0.6 : 0.3;
      }
    }

    // --- Engine and gearbox ---
    let ratio;
    if (this.gear === -1) {
      ratio = s.reverseGear * s.finalDrive;
    } else if (this.transmission === 'cvt') {
      // CVT: holds the revs where they're needed and slides the ratio
      const targetRpm = s.idleRpm + 300 + throttle * (s.cvtTargetRpm - s.idleRpm);
      const wanted = clamp(targetRpm / Math.max(this.wheelRpm(), 1), s.cvtRange[0], s.cvtRange[1]);
      this.cvtRatio += (wanted - this.cvtRatio) * Math.min(1, 4 * h);
      ratio = this.cvtRatio;
    } else {
      ratio = s.gears[this.gear - 1] * s.finalDrive;
    }

    // The engine is geared to the driven (rear) wheels: when they spin up,
    // the revs go up with them
    const drivenRpm = Math.abs((W4.omega[2] + W4.omega[3]) / 2) * RPM_PER_RADS;
    const coupledRpm = drivenRpm * ratio;
    // The clutch (or torque converter) slips when pulling away. A manual
    // only does this in 1st and 2nd; in a high gear at low speed it bogs down.
    const canSlip = this.transmission !== 'manual' || this.gear <= 2;
    let targetRpm = Math.max(coupledRpm, s.idleRpm);

    // Pulling away: the revs flare up, then sink smoothly as the clutch bites
    // and takes the load, then climb with the speed.
    const pullingAway = canSlip && throttle > 0 && coupledRpm < s.launchRpm;
    if (pullingAway) {
      if (this.launchTime < 0) this.launchTime = 0;   // a new launch starts
      this.launchTime += h;
    } else if (!throttle || coupledRpm >= s.launchRpm) {
      this.launchTime = -1;
    }
    let clutchSlipping = false;
    if (canSlip && throttle) {
      if (this.transmission === 'cvt') {
        const cvtRpm = s.idleRpm + 300 + throttle * (s.cvtTargetRpm - s.idleRpm);
        targetRpm = Math.max(coupledRpm, cvtRpm);
      } else if (this.launchTime >= 0) {
        const flare = s.launchRpm + 600 * throttle;          // the initial jump
        const bite = Math.exp(-this.launchTime / s.clutchBite);   // fades as the clutch grips
        targetRpm = Math.max(s.idleRpm, coupledRpm + (flare - coupledRpm) * bite);
        clutchSlipping = true;
      }
    }
    // --- Clutch (X): purely for fun ---
    // Held: the engine is disconnected, so it revs freely (rev battles!).
    // Released at high revs: the stored energy kicks the car forward.
    const dead = this.engineDead;
    const clutchIn = !!c.clutch && !dead;
    if (this.clutchWasIn && !clutchIn && !dead) {
      const gap = this.rpm - coupledRpm;
      if (gap > 800) {
        this.clutchDump = 0.35;
        this.dumpStrength = clamp(gap / 4000, 0, 1);
      }
    }
    this.clutchWasIn = clutchIn;
    this.clutchIn = clutchIn;
    // How far down the driver's left foot has the clutch pedal (for the
    // cockpit): all the way with X, a quick dip for each manual gear change,
    // and easing up as the clutch bites when pulling away
    this.clutchPedal = clutchIn ? 1
      : this.transmission === 'manual' && this.shiftTimer > 0 ? 1
      : clutchSlipping && this.transmission !== 'cvt' ? clamp(Math.exp(-Math.max(0, this.launchTime) / s.clutchBite) * 1.3, 0, 1) : 0;
    if (clutchIn) targetRpm = throttle ? s.redline + 300 : s.idleRpm;
    if (this.clutchDump > 0) {
      this.clutchDump -= h;
      // The revs drop towards road speed as the clutch grabs
      const k = Math.max(0, this.clutchDump / 0.35);
      targetRpm = Math.max(targetRpm, coupledRpm + (this.rpm - coupledRpm) * k);
    }

    // --- Rev limiter ---
    // At the top of a gear the limiter cuts the ignition in fast bursts:
    // the revs flicker just under the redline, the exhaust stutters
    // "v-v-v-v", and the car simply can't go any faster in that gear.
    // Well above the redline (a bad downshift) the engine is being dragged
    // round by the wheels: the limiter can't help, the fuel is simply cut.
    const overRevving = !clutchIn && coupledRpm > s.redline + 150;
    const atLimit = !dead && throttle > 0 && this.shiftTimer <= 0 && (clutchIn
      ? this.rpm >= s.redline - 20                                 // free-revving into the limiter
      : !overRevving && coupledRpm >= s.redline - 20);
    if (dead) targetRpm = 0;   // a blown or fuel-starved engine has stopped turning
    this.limiterClock = (this.limiterClock + h) % 0.08;
    this.limiterCut = atLimit && this.limiterClock < 0.04;   // 40 ms cut, 40 ms fire
    this.onLimiter = atLimit;
    if (atLimit) targetRpm = this.limiterCut ? s.redline - 220 : s.redline;
    targetRpm = Math.min(targetRpm, s.redline + 1900);
    this.rpm += (targetRpm - this.rpm) * Math.min(1, (atLimit ? 45 : 18) * h);
    // Shown in red on the dash: on the limiter, or over-revved by a bad downshift
    this.limiter = atLimit || this.rpm > s.redline + 50;

    // Air and rolling resistance (on the body)
    const resist = s.drag * this.vx * Math.abs(this.vx) + s.rolling * this.vx
      + Math.sign(this.vx) * Math.min(1, Math.abs(this.vx)) * (s.rollingBase + this.flatDrag);

    let engineTorque = 0;
    if (this.shiftTimer > 0) {
      this.shiftTimer -= h;
      // Power is cut during a shift (an automatic keeps a little)
      engineTorque = this.transmission === 'auto' ? 0.4 * throttle * torqueAt(s.torqueCurve, this.rpm) : 0;
    } else if (throttle && !overRevving) {
      // A damaged engine loses power: down to a quarter just before it dies
      engineTorque = throttle * torqueAt(s.torqueCurve, this.rpm) * (0.25 + 0.75 * this.engineHealth) * this.oilFactor;
    } else if (coupledRpm > s.idleRpm + 200) {
      engineTorque = -s.engineBraking * (this.rpm / s.redline);   // engine braking
    }
    if (c.handbrake) engineTorque = Math.min(engineTorque, 0);
    if (clutchIn) engineTorque = 0;
    // Clutch dump: the spinning engine's stored energy slams into the drivetrain
    if (this.clutchDump > 0 && engineTorque > 0) {
      engineTorque *= 1 + 1.4 * this.dumpStrength * (this.clutchDump / 0.35);
    }
    // Last drops of fuel: the engine sputters, cutting out now and then
    this.misfiring = !dead && (this.fuel < s.fuelReserve || this.overheatKnock > 0.3);
    if (!dead && this.overheatKnock > 0) engineTorque *= 1 - 0.45 * this.overheatKnock;   // knocking: losing power
    if (this.misfiring && Math.random() < 0.5 * (1 - this.fuel / s.fuelReserve)) engineTorque = Math.min(engineTorque, 0);
    if (dead) engineTorque = 0;
    if (this.gear === -1 && this.vx < -s.maxReverseSpeed) engineTorque = Math.min(engineTorque, 0);

    // --- Traction control (TCS, switchable): watches the driven wheels and
    // trims the power as soon as they spin up past what each level allows,
    // and harder if the rear starts sliding sideways ---
    this.tractionControl = false;
    const tcsLevel = this.assistLevel('tcs');
    if (tcsLevel > 0 && engineTorque > 0) {
      const slack = [0, 0.8, 0.65, 0.45, 0.22, 0][tcsLevel];          // extra wheelspin allowed
      const slideAllowance = [0, 0.9, 0.75, 0.5, 0.25, 0][tcsLevel]; // slide allowed before cutting
      const spinAllowed = shape.kappa * (1.1 + 3 * slack);
      const spin = Math.max(W4.kappa[2], W4.kappa[3]);
      const tooMuch = spin > spinAllowed || this.lastRearSlide > slideAllowance + 0.05;
      W4.tcsCut = tooMuch ? Math.max(0.08, W4.tcsCut - 9 * h) : Math.min(1, W4.tcsCut + 2.5 * h);
      if (W4.tcsCut < 0.97) this.tractionControl = true;
      engineTorque *= W4.tcsCut;
    } else {
      W4.tcsCut = 1;
    }

    let driveTorque = engineTorque * ratio * s.driveEfficiency;     // at the axle, Nm
    if (this.gear === -1) driveTorque = -driveTorque;
    if (atLimit) {
      // The limiter only lets through enough power to hold the speed
      const hold = Math.max(0, Math.abs(resist)) * s.wheelRadius;
      driveTorque = Math.sign(driveTorque) * Math.min(Math.abs(driveTorque), hold);
    }
    // While the clutch slips on a launch, the wheels only get what the
    // clutch passes on (the rest goes into the revs)
    if (clutchSlipping) driveTorque *= 0.92;

    this.throttleAmount = throttle;
    this.engineLoad = atLimit ? (this.limiterCut ? 0 : 0.6) : clamp(engineTorque / s.peakTorque, 0, 1);
    if (clutchIn && !atLimit) this.engineLoad = throttle * 0.7;   // free revving still sounds angry

    // --- Fuel: burnt in proportion to the work the engine does ---
    if (!dead) {
      const workKw = throttle * torqueAt(s.torqueCurve, this.rpm) * (this.rpm * Math.PI / 30) / 1000;
      const litresPerSecond = (workKw * s.fuelPerKwh) / 3600 / s.fuelDensity + s.idleFuel / 3600;
      this.fuel = Math.max(0, this.fuel - litresPerSecond * h);
    }

    // --- Brakes: the pedal squeezes all four (brakeBias to the fronts).
    // ABS (switchable) eases each wheel's brake on its own the moment that
    // wheel starts to lock; without it, ask too much and the wheel locks
    // (a locked front can't steer). The handbrake locks the rears. ---
    const brakeTorque = [0, 0, 0, 0];
    const perFront = brakePedal * s.brakeForce * s.brakeBias / 2 * s.wheelRadius;
    const perRear = brakePedal * s.brakeForce * (1 - s.brakeBias) / 2 * s.wheelRadius;
    brakeTorque[0] = brakeTorque[1] = perFront;
    brakeTorque[2] = brakeTorque[3] = perRear;
    if (c.handbrake) { brakeTorque[2] += s.handbrakeTorque; brakeTorque[3] += s.handbrakeTorque; }
    // hot discs fade: the pads grip them less
    for (let i = 0; i < 4; i++) brakeTorque[i] *= this.brakeFade(i);
    // A bad downshift briefly locks the rear wheels with engine braking
    if (this.overRevLock > 0) {
      this.overRevLock -= h;
      brakeTorque[2] += this.overRevSeverity * 700;
      brakeTorque[3] += this.overRevSeverity * 700;
      if (this.overRevLock <= 0) this.overRevSeverity = 0;
    }
    const absLevel = this.assistLevel('abs');
    const absThreshold = 0.85 + 0.06 * (5 - absLevel);       // share of the peak slip each level lets the tyre reach
    this.absActive = false;
    this.absSteerLoss = 0;

    // --- Step the wheels, the body and the suspension in small steps ---
    const N = 8, h2 = h / N;
    const Lr = s.cgToRear, Lf = s.cgToFront, tH = s.trackHalf, R = s.wheelRadius;
    const staticF = m * G * Lr / (Lf + Lr) / 2, staticR = m * G * Lf / (Lf + Lr) / 2;
    const aero = s.downforce * this.vx * this.vx;
    const aeroF = aero * s.downforceFront / 2, aeroR = aero * (1 - s.downforceFront) / 2;
    // Steering: the inside front wheel turns a little more (Ackermann)
    // plus any bend from a crash
    const ack = 0.12 * d * Math.abs(d) / Math.max(1e-3, s.maxSteer);
    // (and no power steering: bumps under one front wheel knock the steering
    // a little, a bit of which reaches the tyres)
    const bumpSteer = 0;      // (the kick shows on the steering wheel; feeding it to the tyres made the car nervous)
    const delta = [d + Math.max(0, ack) + wb[0] * 0.5 + bumpSteer, d + Math.min(0, ack) + wb[1] * 0.5 + bumpSteer, wb[2] * 0.35, wb[3] * 0.35];
    const cosD = delta.map(Math.cos), sinD = delta.map(Math.sin);
    const A = [Lf, Lf, -Lr, -Lr], B = [tH, -tH, tH, -tH];
    let sumUseF = 0, sumUseR = 0, sumSlideF = 0, sumSlideR = 0, spinMax = 0, lockAny = false, brkUseF = 0, brkUseR = 0;
    let axSum = 0, aySum = 0;
    const Fz = W4.Fz;

    const air = this.air, AIR = this.fb;
    for (let k = 0; k < N; k++) {
      if (air) {
        // In the air, tipping or upside down: the car moves as a free 3D
        // body (see airWheels / airStep). Each wheel's load comes from its
        // spring pressing on the ground, if it's touching it at all.
        this.airWheels(Fz, staticF, staticR);
      } else {
      // -- Suspension: each corner's spring and damper, from the body's
      // height, pitch and roll, and the road under that wheel --
      const susp = s.suspension;
      let heaveF = 0, pitchM = 0, rollM = 0;
      const comp = W4.comp;
      for (let i = 0; i < 4; i++) {
        const bodyAt = W4.heave - A[i] * W4.pitch + B[i] * W4.roll;
        const bodyVel = W4.heaveV - A[i] * W4.pitchV + B[i] * W4.rollV;
        comp[i] = W4.road[i] - bodyAt;
        // Fully stretched: the wheel can only drop so far below the body.
        // If the road falls away further (a crest, a jump, a ledge) the
        // wheel hangs at its limit, in the air, carrying nothing.
        const hanging = comp[i] < -susp.droop;
        if (hanging) comp[i] = -susp.droop;
        W4.hanging[i] = hanging;
        const front = i < 2;
        // (dampers go softer on fast, sharp bumps, like real ones do: the
        // force builds more slowly past about 0.3 m/s)
        const dv = W4.roadRate[i] - bodyVel, knee = 0.3;
        const damp = Math.abs(dv) < knee ? dv : Math.sign(dv) * (knee + 0.5 * (Math.abs(dv) - knee));
        let f = (front ? staticF + aeroF : staticR + aeroR)
          + (front ? susp.springFront : susp.springRear) * comp[i]
          + (front ? susp.damperFront : susp.damperRear) * damp;
        if (comp[i] > susp.bumpStop) f += susp.bumpStopRate * (comp[i] - susp.bumpStop);   // hitting the bump stops
        W4.spring[i] = f;
      }
      // anti-roll bars: share the load between the two sides of each axle
      const arbF = susp.arbFront * (comp[0] - comp[1]), arbR = susp.arbRear * (comp[2] - comp[3]);
      W4.spring[0] += arbF; W4.spring[1] -= arbF; W4.spring[2] += arbR; W4.spring[3] -= arbR;
      for (let i = 0; i < 4; i++) {
        Fz[i] = W4.hanging[i] ? 0 : Math.max(0, W4.spring[i]);   // a wheel in the air carries nothing
        const extra = Fz[i] - (i < 2 ? staticF : staticR);
        heaveF += extra;
        pitchM -= A[i] * extra;
        rollM += B[i] * extra;
      }
      // the body's own weight shifting as the car speeds up, slows and turns
      heaveF -= 2 * (aeroF + aeroR);
      heaveF -= m * GR.accel;                         // the ground rising faster (a dip) presses the car down on its springs; a crest lightens it
      pitchM += -m * W4.ax * s.cgHeight + 2 * (Lf * aeroF - Lr * aeroR);
      rollM += m * W4.ay * s.cgHeight;
      W4.heaveV += (heaveF / m) * h2;
      W4.pitchV += (pitchM / susp.pitchInertia) * h2;
      W4.rollV += (rollM / susp.rollInertia) * h2;
      W4.heave += W4.heaveV * h2;
      W4.pitch += W4.pitchV * h2;
      W4.roll += W4.rollV * h2;
      }

      // -- Tyres --
      let Fx = 0, Fy = 0, Mz = 0;
      for (let i = 0; i < 4; i++) {
        const vxi = air ? AIR.vf[i] : this.vx - this.yawRate * B[i];
        const vyi = air ? AIR.vl[i] : this.vy + this.yawRate * A[i];
        const vLong = vxi * cosD[i] + vyi * sinD[i];
        const vLat = -vxi * sinD[i] + vyi * cosD[i];
        const t = this.tyres[i];
        const gone = t.detached;
        const om = W4.omega[i];
        // slip ratio and slip angle (gently limited at walking pace so the
        // tyres don't jitter when the car is nearly stopped)
        const ref = Math.max(Math.abs(vLong), 2);
        const kappa = gone ? 0 : (om * R - vLong) / ref;
        const tanA = vLat / ref;
        const aPeak = shape.alpha / Math.max(0.35, soft[i]);       // a soft (deflated) tyre needs more angle to grip
        const sx = kappa / shape.kappa, sy = tanA / Math.tan(aPeak);
        const sig = Math.hypot(sx, sy);
        // load sensitivity: a heavily loaded tyre grips a bit less per kg
        const nominal = i < 2 ? staticF : staticR;
        const loadMu = mu[i] * clamp(1 - shape.loadSens * (Fz[i] / nominal - 1), 0.72, 1.15);
        const Fmax = loadMu * Fz[i];
        // the grip curve: builds, peaks at sig = 1, then fades as it slides
        const Cx = shape.cx, Cy = shape.cy;
        const blendC = sig > 1e-6 ? (Math.abs(sx) * Cx + Math.abs(sy) * Cy) / (Math.abs(sx) + Math.abs(sy)) : Cy;
        const Bn = Math.tan(Math.PI / (2 * blendC));
        const curve = Math.sin(blendC * Math.atan(Bn * sig));
        const per = sig > 1e-6 ? curve / sig : blendC * Bn;          // force per unit of normalised slip
        let fLong = Fmax * per * sx;
        let fLat = -Fmax * per * sy;
        if (gone) { fLong = -Math.sign(vLong) * Math.min(Math.abs(vLong) * 2000, Fz[i] * s.frameGrip); fLat = -Math.sign(vLat) * Math.min(Math.abs(vLat) * 2000, Fz[i] * s.frameGrip); }
        // -- this wheel's spin: driven by the engine (rears, through the
        // limited-slip differential), slowed by the road and the brakes --
        let drive = 0;
        if (i >= 2) {
          const lock = clamp(s.lsdRate * (W4.omega[2] - W4.omega[3]), -(s.lsdPreload + s.lsdRamp * Math.abs(driveTorque)), s.lsdPreload + s.lsdRamp * Math.abs(driveTorque));
          drive = driveTorque / 2 + (i === 2 ? -lock : lock);
        }
        const inertia = i < 2 ? s.wheelInertiaFront : s.wheelInertiaRear;
        // (worked out 'implicitly': the road pushes back on the wheel the
        // faster it spins, so this stays steady even at walking pace)
        const grab = gone ? 0 : Fmax * (blendC * Bn) * R / (shape.kappa * ref);
        let newOm = om + ((drive - fLong * R) / inertia) * h2 / (1 + (grab * R / inertia) * h2);
        // brakes (ABS eases each wheel on its own)
        let bt = brakeTorque[i];
        if (absLevel > 0 && bt > 0 && Math.abs(vLong) > 2) {
          // it watches the tyre's whole slip (braking AND turning), so when
          // you steer while braking it eases off enough to keep steering
          const lim = absThreshold * (i >= 2 ? 0.75 : 1);
          if (kappa < -0.02 && sig > lim && !(c.handbrake && i >= 2)) { W4.absK[i] = Math.max(0.15, W4.absK[i] - 30 * h2); this.absActive = true; }
          else W4.absK[i] = Math.min(1, W4.absK[i] + 5 * h2);
          if (!(c.handbrake && i >= 2)) bt *= W4.absK[i];
        } else {
          W4.absK[i] = 1;
        }
        const stop = (bt / inertia) * h2;
        if (Math.abs(newOm) <= stop) newOm = 0;                    // held still: locked
        else { newOm -= Math.sign(newOm) * stop; this.brakeHeat[i] += bt * Math.abs(newOm) * h2; }   // (the disc heats as it slows the wheel; a locked wheel's disc doesn't)
        if (gone) newOm = vLong / R;
        W4.omega[i] = newOm;
        W4.kappa[i] = kappa;
        // the force on the car, turned from the wheel's direction to the car's
        const fxC = fLong * cosD[i] - fLat * sinD[i];
        const fyC = fLong * sinD[i] + fLat * cosD[i];
        Fx += fxC; Fy += fyC;
        Mz += A[i] * fyC - B[i] * fxC;
        AIR.fx[i] = fxC; AIR.fy[i] = fyC;
        // bookkeeping for the smoke, marks, wear and temperatures
        if (k === N - 1) {
          const use = Fmax > 1 ? Math.abs(fLat) / Fmax : 0;
          const slide = clamp((Math.abs(sy) - 1.3) / 0.8, 0, 1) * (Fz[i] > 50 ? 1 : 0);   // (right at the peak it's working, not sliding yet)
          const brakeShare = Fmax > 1 ? Math.max(0, -fLong) / Fmax : 0;
          if (i < 2) { sumUseF += use * Fz[i]; sumSlideF += slide * Fz[i]; brkUseF += brakeShare * Fz[i]; }
          else { sumUseR += use * Fz[i]; sumSlideR += slide * Fz[i]; brkUseR += brakeShare * Fz[i]; spinMax = Math.max(spinMax, clamp((kappa - shape.kappa * 1.3) / 0.6, 0, 1)); }
          if (kappa < -0.45 && Math.abs(vLong) > 2) lockAny = true;
          W4.slipAngle[i] = Math.atan(tanA);
        }
      }
      if (air) { this.airStep(h2); axSum += AIR.acc[0]; aySum += AIR.acc[1]; continue; }
      // -- the body moves --
      const ax = (Fx - resist) / m;
      const ay = Fy / m;
      this.vx += (ax + slopePullF + this.vy * this.yawRate) * h2;   // (gravity on a slope moves the car, but isn't felt as weight shifting)
      this.vy += (ay + slopePullL - this.vx * this.yawRate) * h2;
      this.yawRate += ((Mz + flatPull) / s.inertia - s.yawDamping * 0.15 * this.yawRate) * h2;
      axSum += ax; aySum += ay;
      W4.ax += (ax - W4.ax) * Math.min(1, 30 * h2);
      W4.ay += (ay - W4.ay) * Math.min(1, 30 * h2);
      // move in the world
      this.heading += this.yawRate * h2;
      const sn = Math.sin(this.heading), cs = Math.cos(this.heading);
      this.x += (sn * this.vx + cs * this.vy) * h2;
      this.z += (cs * this.vx - sn * this.vy) * h2;
    }
    for (let i = 0; i < 4; i++) loads[i] = Fz[i];
    this.distance += Math.hypot(this.vx, this.vy) * h;

    // Come to a full stop instead of creeping forever
    // (with no brake on, a real slope still rolls the car away)
    const onSlope = Math.abs(this.ground.slopeF) > 0.02 || Math.abs(this.ground.slopeL) > 0.03;
    if (!air && !c.throttle && Math.abs(this.vx) < 0.15 && Math.abs(this.vy) < 0.15 && (c.brake || c.handbrake || (Math.abs(this.vx) < 0.05 && !onSlope))) {
      this.vx = 0;
      this.vy = 0;
      this.yawRate = 0;
      for (let i = 0; i < 4; i++) W4.omega[i] = 0;
    }

    // Shared with the rest of the game
    const sF = Fz[0] + Fz[1] + 1e-6, sR = Fz[2] + Fz[3] + 1e-6;
    const useFront = sumUseF / sF, useRear = sumUseR / sR;
    const slideFront = sumSlideF / sF, slideRear = sumSlideR / sR;
    const wheelspinAmount = throttle > 0 ? spinMax : 0;
    this.lastWheelspin = wheelspinAmount;
    this.wheelsLocked = lockAny && !c.handbrake;
    if (this.wheelsLocked && absLevel > 0) this.wheelsLocked = false;   // ABS lets go before that shows
    this.accelX += (axSum / N - this.accelX) * Math.min(1, 5 * h);
    this.latAccel += (aySum / N - this.latAccel) * Math.min(1, 8 * h);
    this.wheelSpin += ((W4.omega[2] + W4.omega[3]) / 2) * h;
    for (let i = 0; i < 4; i++) W4.angle[i] += W4.omega[i] * h;
    this.body.heave = W4.heave; this.body.pitch = W4.pitch; this.body.roll = W4.roll;
    // --- Steering feel: a Caterham has no power steering, so the wheel in
    // the driver's hands is kicked by every bump, kerb and rut under the
    // front tyres (one side more than the other twists it), and shakes on
    // gravel and grass. Sprung back to centre by the driver's grip. ---
    const kickPush = clamp((W4.roadRate[0] - W4.roadRate[1]) * 0.05 + (W4.comp[0] - W4.comp[1]) * 0.8, -0.12, 0.12)
      * Math.min(1, Math.abs(this.vx) / 4);
    W4.kickV += (kickPush * 400 - W4.kick * 900 - W4.kickV * 40) * h;
    W4.kick = clamp(W4.kick + W4.kickV * h, -0.15, 0.15);
    this.steerKick = W4.kick;                       // radians at the steering wheel
    for (let i = 0; i < 4; i++) this.body.travel[i] = air ? AIR.travel[i] : W4.comp[i];
    if (air) for (let i = 0; i < 4; i++) W4.comp[i] = AIR.travel[i];
    // Leaving the ground, or tipping up onto two wheels: hand over to the
    // free 3D body. Back on four wheels and settled: hand back.
    if (!air) this.checkTakeOff(h, Fz); else this.checkLanding(h, Fz);

    // --- Tyre smoke: how hard each axle is losing traction ---
    const wheelspin = wheelspinAmount * 0.35;   // a straight-line launch only smokes lightly
    const rearTarget = Math.max(slideRear, wheelspin);
    const frontTarget = slideFront * 0.4;   // understeer scrub: much lighter
    const smooth = Math.min(1, 10 * h);
    this.tyreSlip.rear += (rearTarget - this.tyreSlip.rear) * smooth;
    this.lastRearSlide = slideRear;   // traction control watches this
    this.tyreSlip.front += (frontTarget - this.tyreSlip.front) * smooth;
    const frontBrake = brkUseF / sF * Math.max(1, maxFront), rearBrake = brkUseR / sR * Math.max(1, maxRear);
    W4.lastVx = this.vx;

    this.updateTyres(h, { useFront, useRear, slideFront, slideRear, wheelspinAmount, handbrake: c.handbrake, m, L,
      brakeFront: frontBrake / Math.max(1, maxFront), brakeRear: rearBrake / Math.max(1, maxRear) });
  }

  // --- Tyre wear, pressure and how low each corner sits ---
  updateTyres(h, { useFront, useRear, slideFront, slideRear, wheelspinAmount, handbrake, m, L, brakeFront = 0, brakeRear = 0 }) {
    const s = this.spec;
    const compound = TYRES[this.tyreCompound];
    const speed = Math.hypot(this.vx, this.vy);
    const dist = speed * h;
    const staticFront = (m * G * s.cgToRear) / L / 2;
    const staticRear = (m * G * s.cgToFront) / L / 2;

    WHEEL_ORDER.forEach((w, i) => {
      const t = this.tyres[i];
      const loadShare = this.wheelLoad[i] / (w.front ? staticFront : staticRear);

      // How fast this tyre's rubber is sliding over the road
      // (understeer scrub at the front is much gentler than a sideways slide)
      let slip = speed * (w.front ? 0.05 * slideFront : slideRear);
      if (!w.front) slip = Math.max(slip, wheelspinAmount * 8);    // spinning up
      if (this.wheelsLocked) slip = Math.max(slip, speed * 0.3);    // brakes locked: flat-spotting
      if (handbrake && !w.front) slip = Math.max(slip, speed * 0.3); // handbrake: rears locked

      const use = w.front ? useFront : useRear;
      const braking = w.front ? brakeFront : brakeRear;              // share of its grip used for braking
      // --- Temperature: heated by the work it does, cooled by the air (and
      // much more by rain and spray) ---
      const work = 0.28 * loadShare * use * speed * (w.front ? 1.15 : 1)    // cornering (the steering fronts work hardest)
        + 0.1 * loadShare * braking * speed                                // braking
        + 1.2 * Math.sqrt(Math.max(loadShare, 0)) * slip                   // sliding or spinning
        + 0.04 * speed;                                                    // just rolling
      const heatUp = compound.kind === 'slick' ? 1.6 : 1;   // sticky slick rubber heats up more as it works
      const cooling = (0.03 + 0.005 * speed) * (1 + 3 * this.trackWetness);
      t.temp += (work * heatUp - cooling * (t.temp - AMBIENT_TEMP)) * 0.25 * h;
      const win = TEMP_WINDOW[compound.kind] || TEMP_WINDOW.road;
      const overheat = t.temp > win.hi ? Math.min(2.5, 1 + (t.temp - win.hi) / 25) : 1;   // too hot: wears faster

      let wear = (s.tyreWearBase * dist                             // straight line: all equal
        + s.tyreWearCorner * loadShare * use * use * dist * (w.front ? 1.25 : 1)   // cornering: the loaded outer (front) tyre most
        + s.tyreWearBrake * loadShare * braking * braking * dist)  // braking: the loaded fronts most
        + s.tyreWearSkid * Math.sqrt(Math.max(loadShare, 0)) * slip * h
        + s.tyreWearFlat * (1 - t.pressure) * (1 - t.pressure) * dist;   // driving on a flat chews it up
      wear += 0.004 * Math.abs(this.wheelBend[i]) * dist;    // a bent wheel scrubs along sideways
      t.wear = Math.min(1, t.wear + wear * compound.wear * this.wearScale() * overheat);

      // Slow puncture: air escapes, more slowly as the tyre empties
      if (t.leak > 0 && t.pressure > 0) {
        t.pressure -= t.leak * (0.3 + 0.7 * t.pressure) * h;
        if (t.pressure <= 0.02) { t.pressure = 0; t.leak = 0; }
      }

      // --- Blowouts ---
      if (!t.blown) {
        // Worn down to the cords: it can burst, far more likely when loaded up in a corner
        if (t.wear >= 0.98 && speed > 5) {
          const chance = s.blowWornRate * Math.pow(Math.max(loadShare, 0.2), 3) * h;
          if (Math.random() < chance) this.blowout(i);
        }
        // Driven fast on a flat: it overheats and bursts (cools off when slow)
        if (t.pressure < 0.1) {
          const fast = speed / 27.8;   // 1 = 100 km/h
          t.heat = clamp(t.heat + (fast * fast - 0.15) * h / s.flatHeatTime, 0, 1);
          if (t.heat >= 1) this.blowout(i);
        }
      } else if (!t.rim) {
        // A blown tyre flings off strips of rubber as it turns, until only the rim is left
        if (speed > 1.5) t.shred = Math.min(1, t.shred + (h / s.shredTime) * Math.min(1, speed / 8));
        if (t.shred >= 1) {
          t.rim = true;
          this.events.push({ type: 'rim', wheel: i });
        }
      } else if (!t.detached && speed > 0.5) {
        // The bare rim grinds down on the road (faster when it's loaded),
        // until the frame touches the ground and the wheel comes off
        t.rimWear = Math.min(1, t.rimWear + (speed * h / s.rimWearDistance) * (0.6 + 0.4 * clamp(loadShare, 0, 2)));
        if (t.rimWear >= 1) {
          t.detached = true;
          this.events.push({ type: 'wheelOff', wheel: i });
        }
      }
      if (t.blown) t.wear = 1;

      // A soft tyre lets its corner sit lower; on the bare rim, it's the
      // full drop. (Worked out from the car's settled weight, not the load
      // this instant, and eased in: the suspension now reacts to it, and
      // the two used to chase each other, making the wheel chatter.)
      const sinkTarget = t.detached ? s.frameSink
        : t.rim ? s.rimSink + (s.frameSink * 0.85 - s.rimSink) * t.rimWear
        : t.blown ? s.flatSink + (s.rimSink - s.flatSink) * t.shred
        : s.flatSink * Math.pow(1 - t.pressure, 1.2) * 0.9;
      const maxStep = 0.25 * h;                              // at most 25 cm a second
      this.tyreSink[i] += clamp(sinkTarget - this.tyreSink[i], -maxStep, maxStep);
    });
  }

  // How fast air is hissing out of the tyres right now (for the sound)
  // For the sound: how much rubber is flapping (0-1) and how many rims are scraping
  get tyreFlap() {
    return this.tyres.reduce((m, t) => Math.max(m, t.blown && !t.rim ? 1 - 0.6 * t.shred : 0), 0);
  }

  get rimsDown() {
    return this.tyres.reduce((n, t) => n + (t.rim && !t.detached ? 1 : 0), 0);
  }

  // Corners scraping along on the frame (wheel gone)
  get framesDown() {
    return this.tyres.reduce((n, t) => n + (t.detached ? 1 : 0), 0);
  }

  get tyreHiss() {
    return this.tyres.reduce((sum, t) => sum + (t.pressure > 0 ? t.leak * t.pressure : 0), 0);
  }
}
