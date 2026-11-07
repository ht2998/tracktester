// =====================================================================
// PHYSICS: how the car moves, including the engine and gearbox.
// A "bicycle model": the two front tyres act as one, the two rear tyres
// act as one. Each tyre grips up to a limit, and past that limit it
// slides, so the car can understeer, oversteer and drift.
// This is the starting point; suspension, weight transfer, weather and
// tyre temperature get added on top later.
// =====================================================================

const G = 9.81;   // gravity, m/s²
const RPM_PER_RADS = 60 / (2 * Math.PI);

// Test car: a light, rear-wheel-drive Caterham-style car with a V6
export const CATERHAM = {
  mass: 600,              // kg
  inertia: 750,           // how hard it is to spin the car (kg·m²)
  cgToFront: 1.15,        // metres from the centre of mass to the front axle
  cgToRear: 1.05,         // metres from the centre of mass to the rear axle
  frontGrip: 1.10,        // tyre grip (1.0 = ordinary road tyre on dry tarmac)
  rearGrip: 1.25,         // a bit more at the back keeps the car stable
  maxPushShare: 0.75,     // most of the rear grip the engine can use for pushing
  cgHeight: 0.38,         // metres: weight shifts back when accelerating, forward when braking
  downforce: 0.55,        // N per (m/s)²: small, but presses the tyres down at speed
  downforceFront: 0.45,   // share of the downforce on the front axle
  yawDamping: 0.6,        // natural settling of a spin or wobble
  frontStiffness: 38000,  // how sharply the front tyres respond to steering
  rearStiffness: 42000,   // how sharply the rear tyres respond
  maxReverseSpeed: 6,     // m/s
  brakeForce: 8500,       // N
  handbrakeForce: 2500,   // N
  handbrakeRearGrip: 0.35,// rear grip left while the handbrake is on
  drag: 0.42,             // air resistance
  rolling: 15,            // rolling resistance
  maxSteer: 0.55,         // radians of steering lock at low speed
  steerSpeed: 2.6,        // how fast the wheels turn, radians per second
  wheelRadius: 0.3,       // metres

  // --- Engine: naturally aspirated V6, about 170 hp ---
  cylinders: 6,
  idleRpm: 850,
  redline: 7200,          // rev limiter cuts in here
  launchRpm: 3200,        // revs held while the clutch slips pulling away
  engineBraking: 40,      // Nm of drag when you lift off the throttle
  // Torque curve: [rpm, Nm]
  torqueCurve: [[800, 95], [1500, 140], [2500, 175], [3500, 198], [4500, 212],
                [5500, 205], [6500, 186], [7200, 168], [7600, 0]],

  // --- Gearbox ---
  gears: [3.3, 2.2, 1.65, 1.3, 1.08, 0.92],   // 6 forward gears
  reverseGear: 3.2,
  finalDrive: 4.1,
  driveEfficiency: 0.9,
  cvtRange: [3.2, 14],    // CVT's lowest and highest overall ratio
  // Automatic upshift speeds (km/h) at full throttle, 1->2, 2->3 ...
  autoUpshiftKmh: [50, 80, 108, 138, 165],
  shiftTime: { manual: 0.12, auto: 0.28 },     // seconds of power cut per shift
};

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

export class CarPhysics {
  constructor(spec = CATERHAM) {
    this.spec = spec;
    this.transmission = 'manual';
    this.reset();
  }

  reset() {
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
    this.limiter = false;     // bouncing off the rev limiter
    this.events = [];         // shift events for the sound to pick up
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

  // --- Reverse (R): only engages when the car is almost stopped ---
  toggleReverse() {
    if (Math.abs(this.vx) > 1) return false;
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
    if (this.transmission !== 'manual' || this.gear <= 1) return;
    // Refuse a downshift that would over-rev the engine
    const newRpm = this.wheelRpm() * this.spec.gears[this.gear - 2] * this.spec.finalDrive;
    if (newRpm > this.spec.redline + 300) return;
    this.startShift(this.gear - 1, 'down');
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
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(controls, h);
  }

  step(c, h) {
    const s = this.spec;
    const m = s.mass;
    const L = s.cgToFront + s.cgToRear;

    // --- Steering: less lock at high speed, and the wheels turn smoothly ---
    // At speed the wheels also turn in more gradually, like a driver easing
    // the wheel instead of yanking it, but still straighten up quickly.
    const speedFactor = 1 + Math.abs(this.vx) / 9;
    const steerLimit = s.maxSteer / speedFactor;
    const target = c.steer * steerLimit;
    const turningIn = Math.abs(target) > Math.abs(this.steer) && Math.sign(target) === Math.sign(this.steer || target);
    const rate = turningIn ? s.steerSpeed / Math.pow(speedFactor, 1.5) : s.steerSpeed;
    this.steer += clamp(target - this.steer, -rate * h, rate * h);
    const d = this.steer;

    // --- How much weight sits on each axle, and the grip that gives ---
    // Accelerating shifts weight onto the rear tyres, braking onto the fronts,
    // and downforce presses both down harder as speed rises.
    const transfer = clamp((m * this.accelX * s.cgHeight) / L, -0.4 * m * G, 0.4 * m * G);
    const aero = s.downforce * this.vx * this.vx;
    const loadFront = (m * G * s.cgToRear) / L - transfer + aero * s.downforceFront;
    const loadRear = (m * G * s.cgToFront) / L + transfer + aero * (1 - s.downforceFront);
    const maxFront = s.frontGrip * loadFront;
    const maxRear = s.rearGrip * loadRear;

    // W is always the accelerator and S always the brake, in any gear
    const throttle = c.throttle;
    const brakePedal = c.brake;

    // --- Automatic gear changes ---
    this.autoShiftCooldown -= h;
    if (this.transmission === 'auto' && this.gear > 0 && this.shiftTimer <= 0 && this.autoShiftCooldown <= 0) {
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
      const targetRpm = s.idleRpm + 300 + throttle * (5600 - s.idleRpm);
      const wanted = clamp(targetRpm / Math.max(this.wheelRpm(), 1), s.cvtRange[0], s.cvtRange[1]);
      this.cvtRatio += (wanted - this.cvtRatio) * Math.min(1, 4 * h);
      ratio = this.cvtRatio;
    } else {
      ratio = s.gears[this.gear - 1] * s.finalDrive;
    }

    const coupledRpm = this.wheelRpm() * ratio;
    // The clutch (or torque converter) slips when pulling away. A manual
    // only does this in 1st and 2nd; in a high gear at low speed it bogs down.
    const canSlip = this.transmission !== 'manual' || this.gear <= 2;
    let targetRpm = Math.max(coupledRpm, s.idleRpm);
    if (canSlip && throttle) {
      const slipRpm = this.transmission === 'cvt'
        ? s.idleRpm + 300 + throttle * (5600 - s.idleRpm)
        : s.launchRpm;
      targetRpm = Math.max(coupledRpm, slipRpm);
    }
    this.rpm += (targetRpm - this.rpm) * Math.min(1, 18 * h);

    // Rev limiter: cuts the power above the redline, so the revs bounce
    if (this.rpm >= s.redline) this.limiter = true;
    else if (this.rpm < s.redline - 150) this.limiter = false;

    let engineTorque = 0;
    if (this.shiftTimer > 0) {
      this.shiftTimer -= h;
      // Power is cut during a shift (an automatic keeps a little)
      engineTorque = this.transmission === 'auto' ? 0.4 * throttle * torqueAt(s.torqueCurve, this.rpm) : 0;
    } else if (throttle && !this.limiter) {
      engineTorque = throttle * torqueAt(s.torqueCurve, this.rpm);
    } else if (!throttle && coupledRpm > s.idleRpm + 200) {
      engineTorque = -s.engineBraking * (this.rpm / s.redline);   // engine braking
    }
    if (this.gear === -1 && this.vx < -s.maxReverseSpeed) engineTorque = Math.min(engineTorque, 0);

    let drive = (engineTorque * ratio * s.driveEfficiency) / s.wheelRadius;
    if (this.gear === -1) drive = -drive;

    this.throttleAmount = throttle;
    this.engineLoad = clamp(engineTorque / 212, 0, 1);

    const brake = brakePedal * s.brakeForce + (c.handbrake ? s.handbrakeForce : 0);

    // The rear tyres share their grip between pushing the car and holding
    // the corner, so too much throttle in a corner makes the back step out.
    const requestedPush = Math.abs(drive);   // before grip limits it (for wheelspin smoke)
    const rearPush = Math.min(Math.abs(drive), maxRear * s.maxPushShare);
    drive = Math.sign(drive) * rearPush;
    let maxRearSide = Math.sqrt(Math.max(0, maxRear * maxRear - rearPush * rearPush));
    if (c.handbrake) maxRearSide *= s.handbrakeRearGrip;
    // When the engine overpowers the rear tyres (low gears, full throttle) they
    // spin, and spinning tyres lose most of their sideways grip: that's what
    // lets the car swing round into a donut. At high speed in a tall gear the
    // engine can't overpower them, so fast corners stay stable.
    const wheelspinAmount = clamp((requestedPush / maxRear - 1) / 0.8, 0, 1);
    maxRearSide *= 1 - 0.65 * wheelspinAmount;

    // Air and rolling resistance
    const resist = s.drag * this.vx * Math.abs(this.vx) + s.rolling * this.vx;
    const forceX = drive - resist;

    let slideFront = 0;   // how far past their grip limit the tyres are, 0-1
    let slideRear = 0;

    if (this.vx > 3) {
      // --- Moving forwards at speed: full tyre model ---
      const slipFront = Math.atan2(this.vy + s.cgToFront * this.yawRate, this.vx) - d;
      const slipRear = Math.atan2(this.vy - s.cgToRear * this.yawRate, this.vx);
      const sideFront = clamp(-s.frontStiffness * slipFront, -maxFront, maxFront);
      const sideRear = clamp(-s.rearStiffness * slipRear, -maxRearSide, maxRearSide);

      // Past the grip limit the tyres slide sideways (and smoke)
      const peakFront = maxFront / s.frontStiffness;
      const peakRear = maxRearSide / s.rearStiffness;
      slideFront = clamp((Math.abs(slipFront) - peakFront) / 0.2, 0, 1);
      slideRear = clamp((Math.abs(slipRear) - peakRear) / 0.12, 0, 1);

      const ax = forceX / m - (sideFront * Math.sin(d)) / m + this.vy * this.yawRate;
      const ay = (sideFront * Math.cos(d) + sideRear) / m - this.vx * this.yawRate;
      const yawAccel = (s.cgToFront * sideFront * Math.cos(d) - s.cgToRear * sideRear) / s.inertia
        - s.yawDamping * this.yawRate;

      this.vx += ax * h;
      this.vy += ay * h;
      this.yawRate += yawAccel * h;
    } else {
      // --- Slow or reversing: simple steering geometry, no sliding ---
      this.vx += (forceX / m) * h;
      const settle = Math.min(1, 10 * h);
      const turnRate = (this.vx * Math.tan(d)) / L;
      this.yawRate += (turnRate - this.yawRate) * settle;
      this.vy -= this.vy * settle;
    }

    // --- Brakes slow the car down but never push it backwards ---
    const vxBeforeBrake = this.vx;
    const brakeDv = (brake / m) * h;
    if (Math.abs(this.vx) <= brakeDv) this.vx = 0;
    else this.vx -= Math.sign(this.vx) * brakeDv;

    // Remember the acceleration for next step's weight transfer (smoothed,
    // like the car's body settling on its springs)
    const accelNow = forceX / m - (vxBeforeBrake - this.vx) / h;
    this.accelX += (accelNow - this.accelX) * Math.min(1, 8 * h);

    // Come to a full stop instead of creeping forever
    if (!c.throttle && !c.brake && Math.abs(this.vx) < 0.05) {
      this.vx = 0;
      this.vy = 0;
      this.yawRate = 0;
    }

    // --- Move the car in the world ---
    this.heading += this.yawRate * h;
    const sin = Math.sin(this.heading);
    const cos = Math.cos(this.heading);
    // forward = (sin, cos), left = (cos, -sin) in world x/z
    this.x += (sin * this.vx + cos * this.vy) * h;
    this.z += (cos * this.vx - sin * this.vy) * h;

    this.wheelSpin += (this.vx / s.wheelRadius) * h;

    // --- Tyre smoke: how hard each axle is losing traction ---
    // Rear: sliding sideways, spinning up under power, or locked by the handbrake.
    const wheelspin = wheelspinAmount * 0.35;   // a straight-line launch only smokes lightly
    const locked = c.handbrake && Math.abs(this.vx) > 2 ? 0.7 : 0;
    const rearTarget = Math.max(slideRear, wheelspin, locked);
    const frontTarget = slideFront * 0.4;   // understeer scrub: much lighter
    const smooth = Math.min(1, 10 * h);
    this.tyreSlip.rear += (rearTarget - this.tyreSlip.rear) * smooth;
    this.tyreSlip.front += (frontTarget - this.tyreSlip.front) * smooth;
  }
}
