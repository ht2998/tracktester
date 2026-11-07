// =====================================================================
// PHYSICS: how the car moves.
// A "bicycle model": the two front tyres act as one, the two rear tyres
// act as one. Each tyre grips up to a limit, and past that limit it
// slides, so the car can understeer, oversteer and drift.
// This is the starting point; suspension, weight transfer, weather and
// tyre temperature get added on top later.
// =====================================================================

const G = 9.81;   // gravity, m/s²

// Test car: a light, rear-wheel-drive Caterham-style car
export const CATERHAM = {
  mass: 600,              // kg
  inertia: 750,           // how hard it is to spin the car (kg·m²)
  cgToFront: 1.15,        // metres from the centre of mass to the front axle
  cgToRear: 1.05,         // metres from the centre of mass to the rear axle
  frontGrip: 1.10,        // tyre grip (1.0 = ordinary road tyre on dry tarmac)
  rearGrip: 1.25,         // a bit more at the back keeps the car stable
  maxPushShare: 0.8,      // most of the rear grip the engine can use for pushing
  yawDamping: 0.6,        // natural settling of a spin or wobble
  frontStiffness: 38000,  // how sharply the front tyres respond to steering
  rearStiffness: 42000,   // how sharply the rear tyres respond
  power: 115000,          // engine power, watts (about 155 hp)
  maxDriveForce: 4200,    // most push the engine can give in first gear, N
  reverseForce: 1800,     // N
  maxReverseSpeed: 6,     // m/s
  brakeForce: 8500,       // N
  handbrakeForce: 2500,   // N
  handbrakeRearGrip: 0.35,// rear grip left while the handbrake is on
  drag: 0.42,             // air resistance
  rolling: 15,            // rolling resistance
  maxSteer: 0.55,         // radians of steering lock at low speed
  steerSpeed: 2.6,        // how fast the wheels turn, radians per second
  wheelRadius: 0.3,       // metres
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class CarPhysics {
  constructor(spec = CATERHAM) {
    this.spec = spec;
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
  }

  // Total speed in km/h, for the display
  get speedKmh() {
    return Math.hypot(this.vx, this.vy) * 3.6;
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
    const steerLimit = s.maxSteer / (1 + Math.abs(this.vx) / 12);
    const target = c.steer * steerLimit;
    this.steer += clamp(target - this.steer, -s.steerSpeed * h, s.steerSpeed * h);
    const d = this.steer;

    // --- How much weight sits on each axle, and the grip that gives ---
    const loadFront = (m * G * s.cgToRear) / L;
    const loadRear = (m * G * s.cgToFront) / L;
    const maxFront = s.frontGrip * loadFront;
    const maxRear = s.rearGrip * loadRear;

    // --- Throttle, brake and reverse ---
    let drive = 0;
    let brake = 0;
    if (c.throttle) {
      if (this.vx > -0.5) drive = Math.min(s.maxDriveForce, s.power / Math.max(this.vx, 1));
      else brake += s.brakeForce;                     // rolling backwards: W brakes first
    }
    if (c.brake) {
      if (this.vx > 0.5) brake += s.brakeForce;
      else if (this.vx > -s.maxReverseSpeed) drive = -s.reverseForce;
    }
    if (c.handbrake) brake += s.handbrakeForce;

    // The rear tyres share their grip between pushing the car and holding
    // the corner, so too much throttle in a corner makes the back step out.
    const rearPush = Math.min(Math.abs(drive), maxRear * s.maxPushShare);
    drive = Math.sign(drive) * rearPush;
    let maxRearSide = Math.sqrt(Math.max(0, maxRear * maxRear - rearPush * rearPush));
    if (c.handbrake) maxRearSide *= s.handbrakeRearGrip;

    // Air and rolling resistance
    const resist = s.drag * this.vx * Math.abs(this.vx) + s.rolling * this.vx;
    const forceX = drive - resist;

    if (this.vx > 3) {
      // --- Moving forwards at speed: full tyre model ---
      const slipFront = Math.atan2(this.vy + s.cgToFront * this.yawRate, this.vx) - d;
      const slipRear = Math.atan2(this.vy - s.cgToRear * this.yawRate, this.vx);
      const sideFront = clamp(-s.frontStiffness * slipFront, -maxFront, maxFront);
      const sideRear = clamp(-s.rearStiffness * slipRear, -maxRearSide, maxRearSide);

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
    const brakeDv = (brake / m) * h;
    if (Math.abs(this.vx) <= brakeDv) this.vx = 0;
    else this.vx -= Math.sign(this.vx) * brakeDv;

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
  }
}
