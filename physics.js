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

// Test car: modelled on the Caterham Seven 420 (Ford Duratec 2.0 inline-4).
// Real figures: 210 bhp at 7,600 rpm, 203 Nm at 6,300 rpm, 560 kg,
// 5-speed manual, 195/50 R15 tyres, 0-60 mph in 3.8 s, 219 km/h top speed.
export const CATERHAM = {
  mass: 560,              // kg
  inertia: 680,           // how hard it is to spin the car (kg·m²)
  cgToFront: 1.15,        // metres from the centre of mass to the front axle
  cgToRear: 1.05,         // metres from the centre of mass to the rear axle
  frontGrip: 1.15,        // tyre grip (1.0 = ordinary road tyre on dry tarmac)
  rearGrip: 1.32,         // sticky track-day tyres; a bit more at the back keeps it stable
  maxPushShare: 0.92,     // most of the rear grip the engine can use for pushing
  cgHeight: 0.38,         // metres: weight shifts back when accelerating, forward when braking
  downforce: 0.55,        // N per (m/s)²: small, but presses the tyres down at speed
  downforceFront: 0.45,   // share of the downforce on the front axle
  yawDamping: 0.6,        // natural settling of a spin or wobble
  frontStiffness: 38000,  // how sharply the front tyres respond to steering
  rearStiffness: 42000,   // how sharply the rear tyres respond
  maxReverseSpeed: 6,     // m/s
  brakeForce: 8500,       // N
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
    // Driver aids, switchable from the side panel. Both on by default.
    // Levels 0-5: 0 = off, 5 = strongest. Both start at 5.
    this.assists = { abs: 5, tcs: 5 };
    // How grippy the ground is at a point: 1 = normal tarmac. The game sets
    // this so that tyres rolling over oil (or later gravel, wet patches...)
    // lose grip.
    this.surfaceGrip = () => 1;
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
    this.limiter = false;     // on the rev limiter or over-revving (dash shows red)
    this.limiterCut = false;  // true during each ignition cut burst
    this.onLimiter = false;   // bouncing off the limiter with the throttle down
    this.overRevLock = 0;     // seconds left of rear-wheel lock from a bad downshift
    this.overRevSeverity = 0;
    this.lastRearSlide = 0;
    this.launchTime = -1;     // seconds since pulling away began (-1 = not launching)
    this.lastWheelspin = 0;
    this.tractionControl = false;   // true while traction control is cutting power
    this.absActive = false;         // true while ABS is easing the brakes
    this.absSteerLoss = 0;          // steering grip given up at lower ABS levels
    this.wheelsLocked = false;      // true while the brakes have locked the wheels
    this.engineHealth = 1;    // drops after big over-revs (1 = full power, 0 = blown)
    this.engineBlown = false;
    this.oilLevel = 1;        // engine oil, 1 = full. Drains while leaking.
    this.knock = 0;           // 0-1, rod knock from oil starvation (for the sound)
    this.limiterClock = 0;
    this.events = [];         // shift events for the sound to pick up
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
      const drain = this.engineBlown ? s.oilPourRate : s.oilLeakRate;
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
    this.knock = starvation;
    if (starvation > 0) {
      const effort = 0.2 + 0.8 * clamp(this.rpm / s.redline, 0, 1);
      this.engineHealth -= starvation * effort * s.starvationDamage * dt;
      if (this.engineHealth <= 0) this.blowEngine();
    }
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
    const m = s.mass;
    const L = s.cgToFront + s.cgToRear;

    // --- Steering: less lock at high speed, and the wheels turn smoothly ---
    // At speed the wheels also turn in more gradually, like a driver easing
    // the wheel instead of yanking it, but still straighten up quickly.
    const speedFactor = 1 + Math.abs(this.vx) / 9;
    let steerLimit = s.maxSteer / speedFactor;
    // Countersteer: steering against a slide gets extra lock (enough to point
    // the front wheels where the car is actually going) at full speed, so
    // slides can be caught. Turning into a corner stays gentle at speed.
    const countersteering = c.steer * this.yawRate < 0 && Math.abs(this.yawRate) > 0.05;
    if (countersteering) {
      const slideAngle = Math.abs(Math.atan2(this.vy, Math.max(Math.abs(this.vx), 1)));
      steerLimit = Math.min(s.maxSteer, steerLimit + slideAngle);
    }
    const target = c.steer * steerLimit;
    const turningIn = !countersteering && Math.abs(target) > Math.abs(this.steer)
      && Math.sign(target) === Math.sign(this.steer || target);
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
    // The ground under each tyre (oil spots make it slippery)
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);   // forward
    const lx = fz, lz = -fx;                                            // left
    const t = s.trackHalf;
    const fxA = this.x + fx * s.cgToFront, fzA = this.z + fz * s.cgToFront;
    const rxA = this.x - fx * s.cgToRear, rzA = this.z - fz * s.cgToRear;
    const groundFront = (this.surfaceGrip(fxA + lx * t, fzA + lz * t) + this.surfaceGrip(fxA - lx * t, fzA - lz * t)) / 2;
    const groundRear = (this.surfaceGrip(rxA + lx * t, rzA + lz * t) + this.surfaceGrip(rxA - lx * t, rzA - lz * t)) / 2;

    const maxFront = s.frontGrip * loadFront * groundFront;
    const maxRear = s.rearGrip * loadRear * groundRear;

    // W is always the accelerator and S always the brake, in any gear
    const throttle = c.throttle;
    this.handbrakeOn = c.handbrake;   // (rear tyres locked: for skid marks)
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
      const targetRpm = s.idleRpm + 300 + throttle * (s.cvtTargetRpm - s.idleRpm);
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

    // Pulling away: the revs flare up, then sink smoothly as the clutch bites
    // and takes the load, then climb with the speed.
    const pullingAway = canSlip && throttle > 0 && coupledRpm < s.launchRpm;
    if (pullingAway) {
      if (this.launchTime < 0) this.launchTime = 0;   // a new launch starts
      this.launchTime += h;
    } else if (!throttle || coupledRpm >= s.launchRpm) {
      this.launchTime = -1;
    }

    if (canSlip && throttle) {
      if (this.transmission === 'cvt') {
        const cvtRpm = s.idleRpm + 300 + throttle * (s.cvtTargetRpm - s.idleRpm);
        targetRpm = Math.max(coupledRpm, cvtRpm);
      } else if (this.launchTime >= 0) {
        const flare = s.launchRpm + 600 * throttle;          // the initial jump
        const bite = Math.exp(-this.launchTime / s.clutchBite);   // fades as the clutch grips
        targetRpm = Math.max(s.idleRpm, coupledRpm + (flare - coupledRpm) * bite);
      }
    }
    // Spinning rear tyres (burnouts, donuts) let the engine rev up freely
    if (this.lastWheelspin > 0.05) {
      targetRpm = Math.max(targetRpm, Math.min(s.redline - 60, coupledRpm + this.lastWheelspin * 3500));
    }
    // --- Rev limiter ---
    // At the top of a gear the limiter cuts the ignition in fast bursts:
    // the revs flicker just under the redline, the exhaust stutters
    // "v-v-v-v", and the car simply can't go any faster in that gear.
    // Well above the redline (a bad downshift) the engine is being dragged
    // round by the wheels: the limiter can't help, the fuel is simply cut.
    const overRevving = coupledRpm > s.redline + 150;
    const atLimit = !this.engineBlown && throttle > 0 && this.shiftTimer <= 0 && !overRevving
      && coupledRpm >= s.redline - 20;
    if (this.engineBlown) targetRpm = 0;   // a blown engine has stopped turning
    this.limiterClock = (this.limiterClock + h) % 0.08;
    this.limiterCut = atLimit && this.limiterClock < 0.04;   // 40 ms cut, 40 ms fire
    this.onLimiter = atLimit;
    if (atLimit) targetRpm = this.limiterCut ? s.redline - 220 : s.redline;
    // Past about 1,900 rpm over the redline the locked rear tyres skid instead
    // of turning the engine any faster
    targetRpm = Math.min(targetRpm, s.redline + 1900);
    this.rpm += (targetRpm - this.rpm) * Math.min(1, (atLimit ? 45 : 18) * h);
    // Shown in red on the dash: on the limiter, or over-revved by a bad downshift
    this.limiter = atLimit || this.rpm > s.redline + 50;

    // Air and rolling resistance
    const resist = s.drag * this.vx * Math.abs(this.vx) + s.rolling * this.vx
      + Math.sign(this.vx) * Math.min(1, Math.abs(this.vx)) * s.rollingBase;

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
    // Handbrake: the rear wheels are locked, so the engine can't drive them
    if (c.handbrake) engineTorque = 0;
    // Blown engine: no power at all, the car just coasts
    if (this.engineBlown) engineTorque = 0;
    if (this.gear === -1 && this.vx < -s.maxReverseSpeed) engineTorque = Math.min(engineTorque, 0);

    let drive = (engineTorque * ratio * s.driveEfficiency) / s.wheelRadius;
    if (this.gear === -1) drive = -drive;

    if (atLimit) {
      // The limiter only lets through enough power to hold the speed
      const hold = Math.max(0, Math.abs(resist));
      drive = Math.sign(drive) * Math.min(Math.abs(drive), hold);
    }

    this.throttleAmount = throttle;
    this.engineLoad = atLimit ? (this.limiterCut ? 0 : 0.6) : clamp(engineTorque / s.peakTorque, 0, 1);

    // Handbrake: locked rear tyres skid, which slows the car about as hard as
    // the rear tyres can grip (they're sliding, so a bit less than full grip)
    // Footbrake: the tyres can only take so much braking. Ask for more than
    // they can grip and the wheels lock: a locked tyre slides (less braking)
    // and a locked front tyre can't steer. ABS stops just short of locking.
    const brakeGrip = maxFront + maxRear;          // most braking the tyres can give
    const brakeDemand = brakePedal * s.brakeForce;
    let footBrake = brakeDemand;
    this.wheelsLocked = false;
    this.absActive = false;
    if (brakeDemand > 0 && Math.abs(this.vx) > 1.5) {
      const absLevel = this.assistLevel('abs');
      if (absLevel > 0) {
        // Lower ABS levels let the tyres slip closer to locking: a touch
        // more stopping power, but less grip left over for steering
        const allowed = (0.95 + 0.01 * (5 - absLevel)) * brakeGrip;
        if (brakeDemand > allowed) {
          footBrake = allowed;
          this.absActive = true;
          this.absSteerLoss = 0.12 * (5 - absLevel);   // level 5: none, level 1: about half
        }
      } else if (brakeDemand > brakeGrip) {
        footBrake = s.lockedBrakeGrip * brakeGrip;
        this.wheelsLocked = true;
      }
    }
    if (!this.absActive) this.absSteerLoss = 0;
    let brake = footBrake + (c.handbrake ? s.handbrakeLockGrip * maxRear : 0);
    // Locked tyres have almost no sideways grip: the car goes straight on
    let maxFrontSide = this.wheelsLocked ? maxFront * 0.12 : maxFront * (1 - this.absSteerLoss);

    // A bad downshift briefly locks the rear wheels with engine braking
    let lockGripLoss = 0;
    if (this.overRevLock > 0) {
      this.overRevLock -= h;
      brake += this.overRevSeverity * 0.35 * maxRear;
      lockGripLoss = 0.18 * this.overRevSeverity;
      if (this.overRevLock <= 0) this.overRevSeverity = 0;
    }

    // The rear tyres share their grip between pushing the car and holding
    // the corner, so too much throttle in a corner makes the back step out.
    // Traction control (TCS, switchable): never send more power than the rear
    // tyres can use, and cut it back further if the rear starts to slide.
    this.tractionControl = false;
    const tcsLevel = this.assistLevel('tcs');
    if (tcsLevel > 0 && drive > 0) {
      // Each level allows some wheelspin and some slide before stepping in.
      // Past its slide allowance it cuts the power hard to catch the car,
      // so lower levels let you play with the tail, and 5 keeps it planted.
      const slack = [0, 0.8, 0.65, 0.45, 0.22, 0][tcsLevel];          // extra wheelspin allowed
      const slideAllowance = [0, 0.9, 0.75, 0.5, 0.25, 0][tcsLevel]; // slide allowed before cutting
      const overSlide = clamp((this.lastRearSlide - slideAllowance) / 0.2, 0, 1);
      const share = (0.9 + slack - 0.3 * Math.abs(c.steer)) * (1 - 0.85 * overSlide);
      const tcLimit = maxRear * Math.max(0.12, share);
      if (drive > tcLimit) {
        drive = tcLimit;
        this.tractionControl = true;
      }
    }

    const requestedPush = Math.abs(drive);   // before grip limits it (for wheelspin smoke)
    const rearPush = Math.min(Math.abs(drive), maxRear * s.maxPushShare);
    drive = Math.sign(drive) * rearPush;
    let maxRearSide = Math.sqrt(Math.max(0, maxRear * maxRear - rearPush * rearPush));
    if (c.handbrake) maxRearSide *= s.handbrakeRearGrip;   // like driving on ice
    if (this.wheelsLocked) maxRearSide *= 0.3;
    maxRearSide *= 1 - lockGripLoss;
    // When the engine overpowers the rear tyres (low gears, full throttle) they
    // spin, and spinning tyres lose most of their sideways grip: that's what
    // lets the car swing round into a donut. At high speed in a tall gear the
    // engine can't overpower them, so fast corners stay stable.
    const wheelspinAmount = clamp((requestedPush / maxRear - 1) / 0.8, 0, 1);
    maxRearSide *= 1 - 0.65 * wheelspinAmount;
    this.lastWheelspin = throttle > 0 ? wheelspinAmount : 0;   // for the revs next step

    const forceX = drive - resist;

    let slideFront = 0;   // how far past their grip limit the tyres are, 0-1
    let slideRear = 0;

    if (this.vx > 3) {
      // --- Moving forwards at speed: full tyre model ---
      const slipFront = Math.atan2(this.vy + s.cgToFront * this.yawRate, this.vx) - d;
      const slipRear = Math.atan2(this.vy - s.cgToRear * this.yawRate, this.vx);
      const sideFront = clamp(-s.frontStiffness * slipFront, -maxFrontSide, maxFrontSide);
      const sideRear = clamp(-s.rearStiffness * slipRear, -maxRearSide, maxRearSide);

      // Past the grip limit the tyres slide sideways (and smoke)
      const peakFront = maxFrontSide / s.frontStiffness;
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
    if (Number.isFinite(accelNow)) this.accelX += (accelNow - this.accelX) * Math.min(1, 8 * h);

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
    // Only when the tyres actually skid: sliding sideways, or spinning up under
    // power. A straight-line handbrake stop doesn't smoke.
    const wheelspin = wheelspinAmount * 0.35;   // a straight-line launch only smokes lightly
    const rearTarget = Math.max(slideRear, wheelspin);
    const frontTarget = slideFront * 0.4;   // understeer scrub: much lighter
    const smooth = Math.min(1, 10 * h);
    this.tyreSlip.rear += (rearTarget - this.tyreSlip.rear) * smooth;
    this.lastRearSlide = slideRear;   // traction control watches this
    this.tyreSlip.front += (frontTarget - this.tyreSlip.front) * smooth;
  }
}
