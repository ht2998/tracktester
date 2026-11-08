// =====================================================================
// SOUND: the engine sound, gear shift sounds and echoes.
// Nothing here uses recorded sound files. The engine is built the way a
// real one makes noise: every cylinder firing sends a pulse of exhaust
// gas down the pipe, and the pipe rings at its own pitches. Each cylinder
// is slightly different, which gives an engine its burble. The sound
// follows the car's cylinder count, so a 4, 6, 10 or 12 all sound right.
// =====================================================================

import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------
// The engine "voice". This runs on the browser's audio thread so it can
// build the sound one sample at a time without slowing the game down.
// ---------------------------------------------------------------------
export const ENGINE_WORKLET = `
class EnginePulses extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 850, minValue: 0, maxValue: 12000, automationRate: 'k-rate' },
      { name: 'load', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'cylinders', defaultValue: 6, minValue: 1, maxValue: 12, automationRate: 'k-rate' },
      { name: 'limiter', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'knock', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'misfire', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.phase = 0;        // progress towards the next firing
    this.cyl = 0;          // which cylinder fires next
    this.pulse = 0;        // the current exhaust pulse, dying away
    this.hiss = 0;         // a little combustion noise on each pulse
    // Each cylinder is a bit stronger or weaker than the others
    this.cylStrength = [1.0, 0.84, 0.94, 0.89, 1.06, 0.86, 0.97, 0.9, 1.02, 0.84, 0.93, 0.99];
    // Exhaust pipe resonances: a deep body, a mid growl, and an upper rasp,
    // plus two that follow the engine: the firing hum and its second
    // harmonic (the "dual" rumble, 30 Hz + 60 Hz for a 4-cylinder at idle),
    // and one for the intake howl of the throttle bodies.
    this.res = [this.makeRes(), this.makeRes(), this.makeRes(),
                this.makeRes(), this.makeRes(), this.makeRes(),
                this.makeRes(),    // the 7th: valvetrain clatter
                this.makeRes(),    // the 8th: rod knock
                this.makeRes(),    // the 9th and 10th: the hollow body rumble
                this.makeRes()];
    this.tick = 0;         // the latest valve clatter, dying away
    this.knockHit = 0;     // the latest rod knock, dying away
    this.thud = 0;         // the latest hollow body thud, dying away
    this.lp = 0;           // gentle smoothing of the very top end
    this.cycle = 0;        // position in the engine cycle (two crank turns)
    this.cutClock = 0;     // rev limiter's on/off rhythm
  }

  makeRes() { return { b0: 0, b2: 0, a1: 0, a2: 0, x1: 0, x2: 0, y1: 0, y2: 0 }; }

  // Band-pass filter: lets through a band of pitches around "freq"
  tune(r, freq, q) {
    const w = 2 * Math.PI * freq / sampleRate;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    r.b0 = alpha / a0;
    r.b2 = -alpha / a0;
    r.a1 = (-2 * Math.cos(w)) / a0;
    r.a2 = (1 - alpha) / a0;
  }

  ring(r, x) {
    const y = r.b0 * x + r.b2 * r.x2 - r.a1 * r.y1 - r.a2 * r.y2;
    r.x2 = r.x1; r.x1 = x; r.y2 = r.y1; r.y1 = y;
    return y;
  }

  process(inputs, outputs, parameters) {
    const out = outputs[0];
    const left = out[0];
    if (!left) return true;
    const rpm = parameters.rpm[0];
    const load = parameters.load[0];
    const cylinders = Math.round(parameters.cylinders[0]);
    const limiter = parameters.limiter[0] > 0.5;
    const knock = parameters.knock[0];   // rod knock from oil starvation, 0-1
    const misfire = parameters.misfire[0];   // chance of a cylinder not firing (out of fuel)
    const firesPerSecond = (rpm / 60) * (cylinders / 2);   // four-stroke
    const cyclesPerSecond = rpm / 120;                     // one full engine cycle = 2 turns

    // Idle lope: near idle, firing strength swells and fades once per engine
    // cycle ("vr vr vr vr"), with a slight wobble in pitch. It fades out as
    // the revs rise and the engine smooths out.
    const idleness = Math.max(0, Math.min(1, 1 - (rpm - 900) / 1700));
    const lopeDepth = 0.75 * idleness;
    const idleBoost = 1 + 0.3 * idleness;   // idle pulses a little louder
    const unevenness = 0.12 + 0.14 * idleness;

    // The pipe's pitches rise a little with the revs
    this.tune(this.res[0], 75 + rpm * 0.006, 1.1);
    this.tune(this.res[1], 190 + rpm * 0.018, 1.8);
    this.tune(this.res[2], 620 + rpm * 0.05, 1.4);
    const nyq = sampleRate * 0.45;
    this.tune(this.res[3], Math.min(nyq, Math.max(20, firesPerSecond)), 3);       // firing hum
    this.tune(this.res[4], Math.min(nyq, Math.max(30, firesPerSecond * 2)), 3);   // second rumble
    this.tune(this.res[5], Math.min(nyq, 1100 + rpm * 0.12), 1.6);                // intake howl
    const rev = Math.min(1, rpm / 7600);
    const humAmount = 0.5 + 0.6 * idleness;
    const intakeAmount = load * (0.15 + 0.85 * rev) * 0.3;

    // Pulses are shorter at high revs so they don't smear together
    const pulseDecay = Math.exp(-1 / (sampleRate * (0.0045 - 0.0028 * Math.min(1, rpm / 8000))));
    const hissDecay = Math.exp(-1 / (sampleRate * 0.0012));
    const strength = 0.35 + 0.65 * load;              // harder pulses under throttle
    const rasp = 0.15 + 0.5 * load;
    const smooth = 0.5 + 0.3 * load;

    // Real engines are never perfectly regular: every combustion lands a
    // little early or late and a little stronger or weaker, the valves
    // clatter, and the exhaust adds grit. All of it grows under load.
    const rough = 0.35 + 0.65 * load;
    const timingJitter = 0.07 * rough;                         // ±3.5% spacing between firings
    const extraUneven = 0.16 * load * rev;                     // strength varies more when worked hard
    const hissAmount = 0.3 + 0.7 * load;                       // combustion roar in each pulse
    const hissDecayLoad = Math.exp(-1 / (sampleRate * (0.0012 + 0.0016 * load)));
    const clatter = 0.04 + 0.12 * rev;                         // valvetrain ticking
    const grit = 0.25 + 0.55 * load;                           // exhaust rasp (uneven distortion)
    this.tune(this.res[6], Math.min(nyq, 3200 + rpm * 0.15), 2.2);
    this.tune(this.res[7], 950, 6);   // a hollow, metallic knock
    // Body rumble: a rounder, lower version of the knock that every engine has
    this.tune(this.res[8], 430 + rpm * 0.02, 5);
    this.tune(this.res[9], 190 + rpm * 0.008, 3);
    const thudAmount = 0.55 + 0.45 * load;

    for (let i = 0; i < left.length; i++) {
      // The lope swells once every two engine cycles, so the pulses are spread out
      this.cycle = (this.cycle + (cyclesPerSecond * 0.5) / sampleRate) % 1;
      const lope = 1 + lopeDepth * Math.sin(2 * Math.PI * this.cycle);
      this.phase += (firesPerSecond / sampleRate) * (1 + 0.035 * idleness * Math.sin(2 * Math.PI * this.cycle));

      // Rev limiter: the ignition is cut in quick bursts, 40 ms off, 40 ms on
      this.cutClock = (this.cutClock + 1 / sampleRate) % 0.08;
      const cut = limiter && this.cutClock < 0.04;

      if (this.phase >= 1) {
        // The next firing lands slightly early or late
        this.phase -= 1 + (Math.random() - 0.5) * timingJitter;
        this.cyl = (this.cyl + 1) % cylinders;
        this.tick = 0.6 + Math.random() * 0.8;   // a valve clattering shut
        // Rod knock: a worn bearing hammers once per crank turn when oil runs low
        if (knock > 0 && this.cyl % 2 === 0) this.knockHit = 1 + Math.random() * 0.3;
        // Body rumble: a hollow thud once per crank turn, slightly uneven
        if (this.cyl % 2 === 0 && !cut) this.thud = 0.8 + Math.random() * 0.4;
        // Running out of fuel: some cylinders just don't fire (a sputter)
        const missed = misfire > 0 && Math.random() < misfire;
        if (!cut && !missed) {
          const spread = unevenness + extraUneven;
          const jitter = 1 - spread + Math.random() * 2 * spread;
          const kick = this.cylStrength[this.cyl] * jitter * lope * idleBoost * (limiter ? 1.15 : strength);
          this.pulse += kick;
          this.hiss += kick * (0.7 + Math.random() * 0.6);
        }
      }
      const noise = (Math.random() * 2 - 1) * this.hiss * hissAmount;
      const x = this.pulse + noise;
      this.pulse *= pulseDecay;
      this.hiss *= this.hiss > 0 ? hissDecayLoad : hissDecay;
      this.tick *= 0.9965;
      const clack = this.ring(this.res[6], (Math.random() * 2 - 1) * this.tick) * clatter;
      this.knockHit *= 0.9975;
      this.thud *= 0.9982;
      const thudIn = this.thud * (0.55 + 0.45 * (Math.random() * 2 - 1));
      const bodyRumble = thudAmount * (2.2 * this.ring(this.res[8], thudIn) + 1.6 * this.ring(this.res[9], thudIn));
      const rodKnock = knock * 7 * this.ring(this.res[7], this.knockHit * (Math.random() * 2 - 1) + this.knockHit * 0.4);

      // Intake: rushing air that throbs with each firing
      const intakeIn = (Math.random() * 2 - 1) * (0.35 + Math.min(1.5, this.pulse) * 0.8);

      let y = 1.0 * this.ring(this.res[0], x)
            + 0.55 * this.ring(this.res[1], x)
            + rasp * 0.3 * this.ring(this.res[2], x)
            + humAmount * (0.8 * this.ring(this.res[3], x) + 0.6 * this.ring(this.res[4], x))
            + intakeAmount * this.ring(this.res[5], intakeIn)
            + clack
            + rodKnock
            + bodyRumble;
      // Exhaust rasp: lopsided distortion adds the gritty edge real pipes have
      y = y + grit * 0.6 * y * Math.abs(y) - grit * 0.15 * y * y;
      this.lp += (y - this.lp) * smooth;   // take only the harshest edge off
      left[i] = this.lp * 1.05;
    }
    for (let ch = 1; ch < out.length; ch++) out[ch].set(left);
    return true;
  }
}
registerProcessor('engine-pulses', EnginePulses);
`;

// Short white-noise recording, made once and reused (for gear-shift clacks)
function makeNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Gravel grind: deep rumbling noise that swells and crunches unevenly, as
// stones shift and pack under the tyre (looped, sped up with road speed)
function makeGravelBuffer(ctx, seconds = 3) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sr * seconds, sr);
  const data = buffer.getChannelData(0);
  let brown = 0, env = 0.6, target = 0.6, crunch = 0;
  for (let i = 0; i < data.length; i++) {
    brown = (brown + 0.04 * (Math.random() * 2 - 1)) * 0.985;      // deep rumble
    if (Math.random() < 90 / sr) target = 0.15 + Math.random() * (Math.random() < 0.25 ? 1.5 : 0.8);
    env += (target - env) * 0.006;                                   // lumpy swells
    if (Math.random() < 260 / sr) crunch = 0.5 + Math.random() * 0.5; // stones packing
    crunch *= 0.996;
    data[i] = brown * 4 * env + (Math.random() * 2 - 1) * crunch * 0.35;
  }
  // Blend the end into the start so the loop has no click
  const fade = Math.floor(sr * 0.05);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] = data[i] * k + data[data.length - fade + i] * (1 - k);
  }
  return buffer;
}

// Gravel static: sparse sharp ticks of small stones pinging off the tyres
// and bodywork, over a faint crackly hiss
function makeCrackleBuffer(ctx, seconds = 2) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sr * seconds, sr);
  const data = buffer.getChannelData(0);
  let click = 0;
  const decay = Math.exp(-1 / (sr * 0.0004));
  for (let i = 0; i < data.length; i++) {
    if (Math.random() < 700 / sr) click = 0.3 + Math.random() * 0.7;
    click *= decay;
    data[i] = (Math.random() * 2 - 1) * (click + 0.06);
  }
  return buffer;
}

// Grass squelch: short, wet "blobs" as the tyres press into soft earth and
// sap. Each is a quick downward sweep of a muffled tone that dies away
// (looped, sped up with road speed so faster = more squelches)
function makeSquelchBuffer(ctx, seconds = 3) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sr * seconds, sr);
  const data = buffer.getChannelData(0);
  let t = 0;
  while (t < seconds - 0.2) {
    const start = Math.floor(t * sr);
    const length = 0.05 + Math.random() * 0.09;
    const f0 = 650 + Math.random() * 500, f1 = 160 + Math.random() * 140;
    const amp = 0.35 + Math.random() * 0.65;
    let phase = 0;
    const n = Math.floor(length * sr);
    for (let i = 0; i < n; i++) {
      const k = i / n;
      const f = f0 * Math.pow(f1 / f0, k);              // sweeps down: "schlp"
      phase += (2 * Math.PI * f) / sr;
      const env = Math.sin(Math.PI * Math.min(1, k * 4)) * Math.pow(1 - k, 1.6);
      // a muffled tone with a little noise, like mud
      data[start + i] += amp * env * (Math.sin(phase) * 0.8 + (Math.random() * 2 - 1) * 0.25);
    }
    t += 0.06 + Math.random() * 0.16;                    // irregular spacing
  }
  return buffer;
}

// Growl: a gritty saturation that roughens the rumble
function makeGrowlCurve() {
  const n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 3) * 0.8 + 0.2 * Math.sign(x) * Math.min(1, Math.abs(x) * 6) * 0.5;
  }
  return curve;
}

// Soft saturation: a little warmth, and keeps peaks from getting harsh
function makeWarmthCurve(amount = 1.4) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

// Speaker protection: leaves normal levels completely untouched, and only
// rounds off peaks above 70% so nothing ever goes past the speakers' limit
function makeKneeCurve(knee = 0.7, ceiling = 0.97) {
  const n = 2048;
  const curve = new Float32Array(n);
  const room = ceiling - knee;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= knee ? a : knee + room * Math.tanh((a - knee) / room));
  }
  return curve;
}

// =====================================================================
// ECHO SYSTEM
// Big, hard surfaces (buildings, walls) reflect the car's sound back.
// The further away a surface is, the later the echo arrives, the more
// muffled it is, and the more it spreads out into a wash of sound.
// Echoes come from the side the surface is on (stereo), solid buildings
// reflect strongly while barriers and fences only faintly, and as you
// drive towards or away from a wall its echo slides in pitch, like a
// real one does.
// =====================================================================
export class EchoSystem {
  constructor({ channels = 4, minSize = 4, maxDistance = 190 } = {}) {
    this.reflectors = [];          // { box, size, reflect }
    this.channelCount = channels;  // how many echoes can be heard at once
    this.minSize = minSize;        // metres: anything smaller doesn't echo
    this.maxDistance = maxDistance;
    this.channels = [];
    this.ctx = null;
  }

  // Register an object (building, hill, wall...). Returns false if it's too small.
  addReflector(object3D, reflect = 1) {
    const box = new THREE.Box3().setFromObject(object3D);
    const dims = box.getSize(new THREE.Vector3());
    const size = Math.max(dims.x, dims.y, dims.z);
    if (size < this.minSize || dims.y < 2) return false;   // must be big and stand up
    this.reflectors.push({ box, size, reflect });
    return true;
  }

  // Register a surface by its corners. reflect: 1 = solid building, down to
  // about 0.1 for a mesh fence (most sound goes straight through)
  addBox(min, max, reflect = 1) {
    const box = new THREE.Box3(min.clone(), max.clone());
    const dims = box.getSize(new THREE.Vector3());
    const size = Math.max(dims.x, dims.z);
    if (size < this.minSize) return false;
    // Low walls reflect less: much of the sound passes over the top
    const heightFactor = Math.min(1, 0.35 + dims.y / 3);
    this.reflectors.push({ box, size, reflect: reflect * heightFactor });
    return true;
  }

  clear() {
    this.reflectors.length = 0;
  }

  // Called once the audio has started
  connect(ctx, input, output) {
    this.ctx = ctx;

    // Shared "spread-out" reverb, used more for distant echoes
    const diffuser = ctx.createConvolver();
    const seconds = 1.6;
    const ir = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-3.2 * t);
      }
    }
    diffuser.buffer = ir;
    diffuser.connect(output);

    // A small pool of echo paths, handed to whichever surfaces are nearest
    for (let i = 0; i < this.channelCount; i++) {
      const delay = ctx.createDelay(1.2);
      const muffle = ctx.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.Q.value = 0.5;
      const sharp = ctx.createGain();
      const spread = ctx.createGain();
      sharp.gain.value = 0;
      spread.gain.value = 0;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      input.connect(delay);
      delay.connect(muffle);
      muffle.connect(sharp);
      muffle.connect(spread);
      if (pan) sharp.connect(pan).connect(output);
      else sharp.connect(output);
      spread.connect(diffuser);
      this.channels.push({ delay, muffle, sharp, spread, pan, owner: null, level: 0 });
    }
  }

  // listener = THREE.Vector3 (the car's position), heading = which way the
  // car faces (radians), so echoes can come from the left or right
  update(listener, heading = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // The nearest surfaces, louder ones first
    const nearby = [];
    for (const r of this.reflectors) {
      const d = r.box.distanceToPoint(listener);
      if (d <= this.maxDistance) nearby.push({ r, d: Math.max(d, 1) });
    }
    nearby.sort((a, b) => a.d / a.r.reflect - b.d / b.r.reflect);
    const wanted = nearby.slice(0, this.channelCount);

    // Keep each surface on the same channel while it stays nearby, so its
    // echo glides smoothly. A channel only takes a new surface once its old
    // echo has faded out (no sudden jumps or pitch glitches).
    const taken = new Set(this.channels.map((c) => c.owner).filter(Boolean));
    const waiting = wanted.filter((w) => !taken.has(w.r));
    for (const ch of this.channels) {
      const hit = wanted.find((w) => w.r === ch.owner);
      if (hit) {
        this.steer(ch, hit, listener, heading, t, false);
      } else if (ch.owner && ch.level > 0.005) {
        this.fade(ch, t);                       // let the old echo die away first
      } else if (waiting.length) {
        ch.owner = waiting.shift().r;
        const hitNew = wanted.find((w) => w.r === ch.owner);
        this.steer(ch, hitNew, listener, heading, t, true);
      } else {
        ch.owner = null;
        this.fade(ch, t);
      }
    }
  }

  fade(ch, t) {
    ch.level *= 0.85;
    ch.sharp.gain.setTargetAtTime(0, t, 0.12);
    ch.spread.gain.setTargetAtTime(0, t, 0.12);
  }

  steer(ch, { r, d }, listener, heading, t, fresh) {
    const delaySeconds = clamp((2 * d) / 343, 0.005, 1.15);          // there and back at the speed of sound
    const cutoff = clamp(5000 / (1 + d / 12), 250, 5000);            // further = more muffled
    const strength = Math.min(0.6, clamp(r.size / 25, 0.3, 1) * 0.9 * (18 / (18 + d)) * r.reflect);   // bigger, closer, harder = louder
    const dispersion = clamp(0.15 + d / 90, 0.15, 0.9);              // further = more spread out
    ch.level = strength;

    // A new surface: jump straight to its distance (it's silent at that moment)
    if (fresh) ch.delay.delayTime.setValueAtTime(delaySeconds, t);
    else ch.delay.delayTime.setTargetAtTime(delaySeconds, t, 0.2);
    ch.muffle.frequency.setTargetAtTime(cutoff, t, 0.15);
    ch.sharp.gain.setTargetAtTime(strength * (1 - dispersion), t, fresh ? 0.3 : 0.15);
    ch.spread.gain.setTargetAtTime(strength * dispersion, t, fresh ? 0.3 : 0.15);

    // Which side it's on: the nearest point of the surface, compared with
    // the direction the car faces (left = -1, right = +1)
    if (ch.pan) {
      const p = r.box.clampPoint(listener, this._pt || (this._pt = new THREE.Vector3()));
      const dx = p.x - listener.x, dz = p.z - listener.z;
      const len = Math.hypot(dx, dz) || 1;
      const leftness = (dx * Math.cos(heading) - dz * Math.sin(heading)) / len;
      ch.pan.pan.setTargetAtTime(clamp(-leftness * 0.85, -1, 1), t, 0.15);
    }
  }
}

// =====================================================================
// ENGINE SOUND
// =====================================================================
export class EngineSound {
  constructor(spec) {
    this.spec = spec;
    this.ctx = null;
    this.voice = null;      // the engine pulse generator, once loaded
    this.muted = false;
    this.echo = new EchoSystem();   // objects can be registered before sound starts
  }

  get started() {
    return this.ctx !== null;
  }

  // Browsers only allow sound after the player presses a key or taps,
  // so this is called from the first key press or tap.
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    this.ctx = ctx;
    this.noise = makeNoiseBuffer(ctx);

    // --- Output chain: everything -> compressor -> master volume -> speakers ---
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    // Final safety: rounds off any peak before it reaches the speakers, so
    // loud moments get fuller instead of crackling
    const clipper = ctx.createWaveShaper();
    clipper.curve = makeKneeCurve();
    clipper.oversample = 'none';   // (smoothing filters here would overshoot the ceiling)
    this.master.connect(clipper).connect(ctx.destination);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    // The engine sits a little below full volume, leaving headroom so big
    // events (like the engine failure) can be clearly louder than revving
    const engineBus = ctx.createGain();
    engineBus.gain.value = 0.85;
    compressor.connect(engineBus).connect(this.master);
    this.out = compressor;
    // Everything the car makes goes through here, so it all echoes off walls
    // (the echoes themselves go straight to the output, not back in here)
    this.carBus = ctx.createGain();
    this.carBus.connect(this.out);
    // Big one-off events (engine failure) skip the engine's levelling so they
    // can be much louder than the engine; a limiter just stops them clipping
    // (a soft clipper squeezes the sharp hits so the event can be loud and
    // dense without crackling)
    const fxDrive = ctx.createGain();
    fxDrive.gain.value = 4.2;
    const fxClip = ctx.createWaveShaper();
    fxClip.curve = makeWarmthCurve(2.4);
    fxClip.oversample = '4x';
    const fxLevel = ctx.createGain();
    fxLevel.gain.value = 0.92;
    fxDrive.connect(fxClip).connect(fxLevel).connect(this.master);
    this.fxOut = fxDrive;

    // --- Engine tone shaping: warmth, then a filter that opens with revs and throttle ---
    const warmth = ctx.createWaveShaper();
    warmth.curve = makeWarmthCurve();
    warmth.oversample = '2x';
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.Q.value = 0.7;
    this.body = ctx.createBiquadFilter();   // a little extra low-end weight
    this.body.type = 'lowshelf';
    this.body.frequency.value = 160;
    this.body.gain.value = 5;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineInput = warmth;
    warmth.connect(this.body).connect(this.tone).connect(this.engineGain).connect(this.carBus);

    // Echoes are fed from the engine sound
    this.echo.connect(ctx, this.carBus, this.out);

    // --- Tyre squeal: rubber sliding on tarmac ---
    // A narrow band of noise plus a faint wavering whine, which together give
    // the slightly tonal, shrieking texture of a sliding tyre
    const squealNoise = ctx.createBufferSource();
    squealNoise.buffer = this.noise;
    squealNoise.loop = true;
    this.squealBand = ctx.createBiquadFilter();
    this.squealBand.type = 'bandpass';
    this.squealBand.frequency.value = 1000;
    this.squealBand.Q.value = 14;
    const squealNoiseGain = ctx.createGain();
    squealNoiseGain.gain.value = 13;   // (a narrow band of noise is quiet, so it needs a big boost)
    this.squealTone = ctx.createOscillator();
    this.squealTone.type = 'sine';
    this.squealTone.frequency.value = 1000;
    const wobble = ctx.createOscillator();      // the tyre's shriek wavers
    wobble.frequency.value = 7;
    const wobbleDepth = ctx.createGain();
    wobbleDepth.gain.value = 35;
    wobble.connect(wobbleDepth).connect(this.squealTone.frequency);
    const squealToneGain = ctx.createGain();
    squealToneGain.gain.value = 0.35;
    this.squealGain = ctx.createGain();
    this.squealGain.gain.value = 0;
    squealNoise.connect(this.squealBand).connect(squealNoiseGain).connect(this.squealGain);
    this.squealTone.connect(squealToneGain).connect(this.squealGain);
    this.squealGain.connect(this.carBus);

    // --- Puncture hiss: air escaping from a tyre (quiet; the engine covers it) ---
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = this.noise;
    hissSrc.loop = true;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3800;
    this.hissGain = ctx.createGain();
    this.hissGain.gain.value = 0;
    hissSrc.connect(hissFilter).connect(this.hissGain).connect(this.carBus);
    hissSrc.start(ctx.currentTime);

    // --- Gravel: a deep growling rumble with a staticky crackle on top ---
    this.gravelSrc = ctx.createBufferSource();
    this.gravelSrc.buffer = makeGravelBuffer(ctx);
    this.gravelSrc.loop = true;
    this.gravelTone = ctx.createBiquadFilter();     // opens up with speed
    this.gravelTone.type = 'lowpass';
    this.gravelTone.frequency.value = 300;
    this.gravelTone.Q.value = 1.2;
    const growl = ctx.createWaveShaper();
    growl.curve = makeGrowlCurve();
    const growlLevel = ctx.createGain();
    growlLevel.gain.value = 1.1;
    this.crackleSrc = ctx.createBufferSource();
    this.crackleSrc.buffer = makeCrackleBuffer(ctx);
    this.crackleSrc.loop = true;
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 2200;
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0;
    this.gravelGain = ctx.createGain();
    this.gravelGain.gain.value = 0;
    // After the grit: round off the fizz and add weight, so it's a deep rumble
    this.gravelDepth = ctx.createBiquadFilter();
    this.gravelDepth.type = 'lowpass';
    this.gravelDepth.frequency.value = 260;
    this.gravelDepth.Q.value = 0.8;
    const gravelWeight = ctx.createBiquadFilter();
    gravelWeight.type = 'lowshelf';
    gravelWeight.frequency.value = 110;
    gravelWeight.gain.value = 7;
    this.gravelSrc.connect(this.gravelTone).connect(growl).connect(this.gravelDepth)
      .connect(gravelWeight).connect(growlLevel).connect(this.gravelGain);
    this.gravelGain.connect(this.carBus);
    this.crackleSrc.connect(crackleFilter).connect(this.crackleGain).connect(this.carBus);
    this.gravelSrc.start(ctx.currentTime);
    this.crackleSrc.start(ctx.currentTime);

    // --- Blown tyre: a subtle grinding as the shredded tyre and the rim's
    // edge drag on the road (no flapping). Two bands of noise: a low, rough
    // grind and a dry mid-range rasp.
    const grindSrc = ctx.createBufferSource();
    grindSrc.buffer = this.noise;
    grindSrc.loop = true;
    const grindLow = ctx.createBiquadFilter();
    grindLow.type = 'bandpass';
    grindLow.frequency.value = 260;
    grindLow.Q.value = 1.1;
    this.grindMid = ctx.createBiquadFilter();
    this.grindMid.type = 'bandpass';
    this.grindMid.frequency.value = 1300;
    this.grindMid.Q.value = 2;
    const grindLowLevel = ctx.createGain();
    grindLowLevel.gain.value = 3.5;
    const grindMidLevel = ctx.createGain();
    grindMidLevel.gain.value = 1.6;
    const grindShape = ctx.createWaveShaper();   // a little grit
    grindShape.curve = makeGrowlCurve();
    this.flapGain = ctx.createGain();
    this.flapGain.gain.value = 0;
    grindSrc.connect(grindLow).connect(grindLowLevel).connect(grindShape);
    grindSrc.connect(this.grindMid).connect(grindMidLevel).connect(grindShape);
    grindShape.connect(this.flapGain).connect(this.carBus);

    // --- Bare rim on tarmac: a sharp, piercing metal SCREECH ---
    // Clashing metallic tones (not a rubbery squeal) plus a
    // thin, hissing "tsss" of metal grinding on stone. No low rumble under it:
    // it's meant to be harsh and grating. It shrieks louder and higher the
    // harder the rim slides.
    const rimSrc = ctx.createBufferSource();
    rimSrc.buffer = this.noise;
    rimSrc.loop = true;
    this.screechA = ctx.createBiquadFilter();
    this.screechA.type = 'bandpass';
    this.screechA.frequency.value = 3300;
    this.screechA.Q.value = 30;
    this.screechB = ctx.createBiquadFilter();      // an off-key partner: metal, not music
    this.screechB.type = 'bandpass';
    this.screechB.frequency.value = 3300 * 1.53;
    this.screechB.Q.value = 30;
    const screechBoost = ctx.createGain();
    screechBoost.gain.value = 26;                  // (very narrow bands of noise are quiet)
    this.screechGain = ctx.createGain();
    this.screechGain.gain.value = 0;
    const sizzle = ctx.createBiquadFilter();       // the "tsss"
    sizzle.type = 'highpass';
    sizzle.frequency.value = 6500;
    sizzle.Q.value = 0.9;
    const sizzleLevel = ctx.createGain();
    sizzleLevel.gain.value = 0.5;
    this.rimRough = ctx.createGain();              // steady: a constant screech, no chopping
    this.rimRough.gain.value = 0.75;
    this.rimGain = ctx.createGain();
    this.rimGain.gain.value = 0;
    rimSrc.connect(this.screechA).connect(screechBoost);
    rimSrc.connect(this.screechB).connect(screechBoost);
    screechBoost.connect(this.screechGain).connect(this.rimRough);
    rimSrc.connect(sizzle).connect(sizzleLevel).connect(this.rimRough);
    // The piercing core: three pure, clashing tones (off-key to each other,
    // like struck metal), with a fast nervous waver from the rim
    // stick-slipping on the road. Pure tones cut through the engine far
    // more clearly than noise does.
    this.screechTones = [1, 1.53, 2.31].map((ratio, k) => {
      const osc = ctx.createOscillator();
      osc.type = k === 0 ? 'triangle' : 'sine';  // the main tone a little edgy
      osc.frequency.value = 3300 * ratio;
      const g = ctx.createGain();
      g.gain.value = [0.9, 0.55, 0.3][k];
      osc.connect(g).connect(this.screechGain);
      return { osc, ratio };
    });
    const waver = ctx.createOscillator();
    waver.frequency.value = 17;
    const waverDepth = ctx.createGain();
    waverDepth.gain.value = 22;                    // cents
    waver.connect(waverDepth);
    for (const { osc } of this.screechTones) waverDepth.connect(osc.detune);
    this.screechStarters = [waver, ...this.screechTones.map((tn) => tn.osc)];
    this.rimRough.connect(this.rimGain).connect(this.carBus);
    for (const n of [grindSrc, rimSrc, ...this.screechStarters]) n.start(ctx.currentTime);

    // --- Grass: the same kind of low grind and dry rasp as the blown tyre
    // (soil and stalks under the tyre), with a slight wet squelch over it ---
    const turfSrc = ctx.createBufferSource();
    turfSrc.buffer = this.noise;
    turfSrc.loop = true;
    const turfLow = ctx.createBiquadFilter();
    turfLow.type = 'bandpass';
    turfLow.frequency.value = 230;
    turfLow.Q.value = 1.1;
    this.turfMid = ctx.createBiquadFilter();
    this.turfMid.type = 'bandpass';
    this.turfMid.frequency.value = 1100;
    this.turfMid.Q.value = 2;
    const turfLowLevel = ctx.createGain();
    turfLowLevel.gain.value = 3.5;
    const turfMidLevel = ctx.createGain();
    turfMidLevel.gain.value = 1.2;
    const turfShape = ctx.createWaveShaper();
    turfShape.curve = makeGrowlCurve();
    this.turfGain = ctx.createGain();
    this.turfGain.gain.value = 0;
    turfSrc.connect(turfLow).connect(turfLowLevel).connect(turfShape);
    turfSrc.connect(this.turfMid).connect(turfMidLevel).connect(turfShape);
    turfShape.connect(this.turfGain).connect(this.carBus);
    this.squelchSrc = ctx.createBufferSource();
    this.squelchSrc.buffer = makeSquelchBuffer(ctx);
    this.squelchSrc.loop = true;
    const squelchTone = ctx.createBiquadFilter();       // soft and muffled
    squelchTone.type = 'lowpass';
    squelchTone.frequency.value = 1400;
    this.squelchGain = ctx.createGain();
    this.squelchGain.gain.value = 0;
    this.squelchSrc.connect(squelchTone).connect(this.squelchGain).connect(this.carBus);
    turfSrc.start(ctx.currentTime);
    this.squelchSrc.start(ctx.currentTime);
    const startAt = ctx.currentTime;
    squealNoise.start(startAt);
    this.squealTone.start(startAt);
    wobble.start(startAt);

    // Load the pulse generator onto the audio thread
    if (ctx.audioWorklet) {
      const url = URL.createObjectURL(new Blob([ENGINE_WORKLET], { type: 'application/javascript' }));
      ctx.audioWorklet.addModule(url).then(() => {
        this.voice = new AudioWorkletNode(ctx, 'engine-pulses', { outputChannelCount: [1] });
        this.voice.parameters.get('cylinders').value = this.spec.cylinders;
        this.voice.connect(this.engineInput);
      }).catch((err) => console.warn('Engine sound could not start:', err));
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  // Called every frame with the car's physics
  update(car, listenerPos) {
    if (!this.ctx) return;
    const s = this.spec;
    const t = this.ctx.currentTime;
    const rpm = car.rpm;
    const rev = clamp(rpm / s.redline, 0, 1);
    // Throttle matters even before the engine is fully loaded, so blend both
    const load = clamp(Math.max(car.engineLoad, car.throttleAmount * 0.6), 0, 1);

    // Ease into and out of throttle rather than switching instantly: getting
    // on the power swells in over ~0.15 s, lifting off fades over ~0.25 s
    const rising = load > (this.lastLoad ?? 0);
    this.lastLoad = load;
    const loadEase = rising ? 0.15 : 0.25;

    if (this.voice) {
      this.voice.parameters.get('rpm').setTargetAtTime(rpm, t, 0.03);
      this.voice.parameters.get('load').setTargetAtTime(load, t, loadEase);
      this.voice.parameters.get('limiter').setValueAtTime(car.onLimiter ? 1 : 0, t);
      this.voice.parameters.get('knock').setTargetAtTime(car.knock ?? 0, t, 0.3);
      const sputter = car.misfiring ? 0.25 + 0.6 * (1 - car.fuel / this.spec.fuelReserve) : 0;
      this.voice.parameters.get('misfire').setValueAtTime(Math.min(0.9, sputter), t);
    }

    // Brighter under load, darker and softer on the overrun
    this.tone.frequency.setTargetAtTime(500 + rpm * 0.32 + load * 1600, t, loadEase);

    let volume = 0.5 + 0.25 * rev + 0.35 * load;
    const shifting = car.shiftTimer > 0;
    if (shifting) volume *= 0.55;             // ignition cut during a shift
    if (car.engineDead) volume = 0;           // blown or out of fuel: silence
    // (the limiter's stutter is made by the pulses themselves)
    // Shifts and the engine dying stay quick; everything else eases
    this.engineGain.gain.setTargetAtTime(volume, t, shifting || car.engineBlown ? 0.03 : car.engineDead ? 0.4 : loadEase);

    this.echo.update(listenerPos, car.heading);
  }

  // Horn, called every frame: on while the horn key or button is held.
  // A small car's little electric horn: two buzzy tones a bit apart, a
  // slightly comical "meep". It echoes off buildings like everything else.
  setHorn(on) {
    if (!this.ctx) return;
    if (!this.hornGain) {
      const ctx = this.ctx;
      this.hornGain = ctx.createGain();
      this.hornGain.gain.value = 0;
      const body = ctx.createBiquadFilter();    // the horn's small trumpet
      body.type = 'bandpass';
      body.frequency.value = 1150;
      body.Q.value = 1.1;
      const buzz = ctx.createWaveShaper();      // the diaphragm's rasp
      buzz.curve = makeWarmthCurve(3);
      for (const [freq, level] of [[415, 0.5], [498, 0.4]]) {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = level;
        osc.connect(g).connect(buzz);
        osc.start();
      }
      const level = ctx.createGain();
      level.gain.value = 0.9;
      buzz.connect(body).connect(level).connect(this.hornGain).connect(this.carBus);
    }
    const t = this.ctx.currentTime;
    const target = on ? 0.32 : 0;
    if (target !== this.hornTarget) {
      this.hornTarget = target;
      this.hornGain.gain.setTargetAtTime(target, t, on ? 0.008 : 0.02);   // snaps on, stops quickly
    }
  }

  // Puncture hiss, called every frame with how fast air is escaping
  setHiss(amount) {
    if (!this.ctx || !this.hissGain) return;
    const level = Math.min(0.055, amount * 1.3);   // (soft: the engine covers it)
    this.hissGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.2);
  }

  // Gravel, called every frame. share: how many tyres are in it (0-1),
  // speed: m/s, slide: how hard the tyres are sliding (0-1)
  setGravel(share, speed, slide) {
    if (!this.ctx || !this.gravelGain) return;
    const t = this.ctx.currentTime;
    const move = Math.min(1, speed / 25);
    const rolling = Math.min(1, speed / 1.5);             // silent when stopped
    const harsh = 1 + 0.7 * Math.min(1, slide);
    const growl = share * rolling * (0.06 + 0.3 * Math.sqrt(move)) * harsh;
    const crackle = share * rolling * (0.011 + 0.06 * move) * harsh;
    // Fades in as tyres roll into the stones and out as they leave
    const ease = growl > this.gravelGain.gain.value ? 0.08 : 0.15;
    this.gravelGain.gain.setTargetAtTime(growl, t, ease);
    this.crackleGain.gain.setTargetAtTime(crackle, t, ease);
    // Faster: a busier, higher grind and more stones pinging
    // (kept low: it deepens and rolls faster rather than getting shrill)
    const sliding = Math.min(1, slide);
    this.gravelSrc.playbackRate.setTargetAtTime(0.35 + 0.5 * move + 0.2 * sliding, t, 0.1);
    this.crackleSrc.playbackRate.setTargetAtTime(0.4 + 1.1 * move, t, 0.1);
    this.gravelTone.frequency.setTargetAtTime(120 + 380 * move + 250 * sliding, t, 0.1);
    this.gravelDepth.frequency.setTargetAtTime(200 + 260 * move + 150 * sliding, t, 0.1);
  }

  // Blown tyre grinding, called every frame. amount: 0-1 (grows as the
  // rubber shreds away and the rim gets closer to the road), speed: m/s
  setTyreFlap(amount, speed) {
    if (!this.ctx || !this.flapGain) return;
    const t = this.ctx.currentTime;
    const rolling = Math.min(1, speed / 4);
    const level = amount * rolling * (0.035 + 0.045 * Math.min(1, speed / 25));   // subtle
    this.flapGain.gain.setTargetAtTime(level, t, 0.15);
    this.grindMid.frequency.setTargetAtTime(1000 + 900 * Math.min(1, speed / 25), t, 0.1);
  }

  // Bare rims on the road, called every frame. rims: how many, speed: m/s,
  // slide: how hard the rims are sliding (0-1)
  setRimScrape(rims, speed, slide = 0) {
    if (!this.ctx || !this.rimGain) return;
    const t = this.ctx.currentTime;
    const moving = Math.min(1, speed / 5);
    const level = rims ? moving * (0.22 + 0.18 * Math.min(1, speed / 25)) * Math.min(1.6, 0.8 + 0.4 * rims) : 0;
    this.rimGain.gain.setTargetAtTime(level, t, level > this.rimGain.gain.value ? 0.05 : 0.12);
    // Metal always screeches a little on tarmac, and shrieks when it slides
    const sliding = Math.min(1, Math.max(0, slide));
    this.screechGain.gain.setTargetAtTime(0.3 + 1.0 * sliding, t, 0.05);
    this.screechDrift = Math.max(-1, Math.min(1, (this.screechDrift || 0) + (Math.random() - 0.5) * 0.25));
    const pitch = 3200 + 1400 * sliding + 200 * this.screechDrift;
    this.screechA.frequency.setTargetAtTime(pitch, t, 0.05);
    this.screechB.frequency.setTargetAtTime(pitch * 1.53, t, 0.05);
    for (const { osc, ratio } of this.screechTones) osc.frequency.setTargetAtTime(pitch * ratio, t, 0.05);
  }

  // A tyre bursting: a sharp BANG, a deep thump through the car and a rush
  // of air. Louder than the engine, like the engine failure.
  playBlowout() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const out = this.fxOut;
    const burst = (at, length, type, freq, q, peak, attack = 0.001) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0008, at + length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random() * 1.5);
      src.stop(at + length + 0.05);
    };
    burst(t0, 0.06, 'highpass', 900, 0.7, 3.0);          // the crack of the bang
    burst(t0, 0.18, 'lowpass', 1400, 0.7, 2.6);          // its body
    burst(t0, 0.35, 'lowpass', 130, 0.8, 3.2, 0.002);    // the thump through the car
    burst(t0 + 0.02, 0.7, 'bandpass', 1600, 0.9, 0.9, 0.01);   // air rushing out
  }

  // Grass, called every frame. share: how many tyres are on it (0-1),
  // speed: m/s, slide: how hard the tyres are sliding (0-1)
  setGrass(share, speed, slide) {
    if (!this.ctx || !this.turfGain) return;
    const t = this.ctx.currentTime;
    const move = Math.min(1, speed / 25);
    const rolling = Math.min(1, speed / 1.5);
    const churn = 1 + 0.8 * Math.min(1, slide);          // sliding tears it up: louder, wetter
    const grind = share * rolling * (0.05 + 0.1 * Math.sqrt(move)) * churn;
    const squelch = share * rolling * (0.02 + 0.04 * Math.sqrt(move)) * churn;   // only a slight wet overlay
    const ease = grind > this.turfGain.gain.value ? 0.08 : 0.15;
    this.turfGain.gain.setTargetAtTime(grind, t, ease);
    this.squelchGain.gain.setTargetAtTime(squelch, t, ease);
    this.turfMid.frequency.setTargetAtTime(900 + 700 * move, t, 0.1);
    // Faster: more squelches, a touch higher
    this.squelchSrc.playbackRate.setTargetAtTime(0.6 + 0.9 * move + 0.4 * Math.min(1, slide), t, 0.1);
  }

  // Tyre squeal, called every frame. skid: how hard the tyres are skidding
  // (0-1, the same measure as the skid marks), speed: m/s
  setSqueal(skid, speed) {
    if (!this.ctx || !this.squealGain) return;
    const t = this.ctx.currentTime;
    // Same threshold as the skid marks: no marks, no squeal
    const amount = Math.max(0, (skid - 0.45) / 0.55);
    const moving = Math.min(1, Math.max(0, (speed - 2) / 8));   // fades out below ~35 km/h
    const level = 0.32 * Math.pow(amount, 0.8) * moving;
    this.squealGain.gain.setTargetAtTime(level, t, level > this.squealGain.gain.value ? 0.06 : 0.12);
    // A harder slide shrieks a little higher, with a slow random drift
    this.squealDrift = Math.max(-1, Math.min(1, (this.squealDrift || 0) + (Math.random() - 0.5) * 0.2));
    const pitch = 880 + 380 * amount + 60 * this.squealDrift;
    this.squealBand.frequency.setTargetAtTime(pitch, t, 0.08);
    this.squealTone.frequency.setTargetAtTime(pitch, t, 0.08);
  }

  // Engine failure, about 3 seconds. Everything here is built from noise
  // (no pure tones), so it sounds like metal breaking, not like music:
  //   a hard CLUNK -> broken parts clattering as the engine spins down
  //   -> grinding to a halt with a final clunk -> a hiss of oil and steam
  playClunk() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const out = this.fxOut;   // louder than the engine

    const env = (g, at, peak, attack, length) => {
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0008, at + length);
    };
    // A burst of noise shaped by a filter
    const burst = (at, length, type, freq, q, peak, attack = 0.002) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      env(g, at, peak, attack, length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random() * 1.5);
      src.stop(at + length + 0.05);
    };
    // A metal impact: a hard crack plus a cluster of narrow, clashing
    // resonances that ring briefly, like a heavy steel part striking the block
    const impact = (at, size) => {
      burst(at, 0.08 * size, 'highpass', 1800, 0.7, 2.2 * size, 0.001);    // the crack
      burst(at, 0.3 * size, 'lowpass', 1100, 0.8, 3.2 * size, 0.001);      // the weight of it
      burst(at, 0.45 * size, 'lowpass', 180, 0.7, 3.0 * size, 0.002);      // the thud through the chassis
      burst(at, 0.6 * size, 'bandpass', 420, 1.5, 1.6 * size, 0.003);      // the body of the car shaking
      for (const [freq, level, length] of [[620, 1.4, 0.5], [1130, 1.2, 0.42], [1710, 0.9, 0.34],
                                           [2480, 0.7, 0.28], [3390, 0.5, 0.22], [4650, 0.35, 0.16]]) {
        const f = freq * (0.94 + Math.random() * 0.12);
        burst(at, length * size, 'bandpass', f, 14, level * size, 0.001);
      }
    };

    // 1. The CLUNK: two hits a split second apart (something breaks, then slams)
    impact(t0, 1.0);
    impact(t0 + 0.045, 0.75);

    // 2. Broken parts clattering as the engine spins down: noisy metal
    //    clanks, fast at first, slowing and fading as it loses speed
    let at = t0 + 0.14;
    let gap = 0.03;
    let level = 1.4;
    while (at < t0 + 2.0 && level > 0.12) {
      burst(at, 0.035 + Math.random() * 0.03, 'bandpass', 900 + Math.random() * 2600, 6 + Math.random() * 10, level);
      if (Math.random() < 0.35) burst(at, 0.05, 'lowpass', 250, 0.8, level * 0.8);   // a heavier knock now and then
      at += gap * (0.75 + Math.random() * 0.5);
      gap *= 1.1;
      level *= 0.955;
    }

    // 3. Grinding to a halt: a rough, chunking rumble that slows down
    const grind = ctx.createBufferSource();
    grind.buffer = this.noise;
    grind.loop = true;
    const gf = ctx.createBiquadFilter();
    gf.type = 'bandpass';
    gf.frequency.setValueAtTime(700, t0 + 0.2);
    gf.frequency.exponentialRampToValueAtTime(220, t0 + 2.2);
    gf.Q.value = 1.2;
    const chunk = ctx.createGain();     // chopped on and off, slower and slower
    chunk.gain.value = 0;
    const chopper = ctx.createOscillator();
    chopper.type = 'square';
    chopper.frequency.setValueAtTime(28, t0 + 0.2);
    chopper.frequency.exponentialRampToValueAtTime(4, t0 + 2.2);
    const chopDepth = ctx.createGain();
    chopDepth.gain.value = 0.5;
    const chopBias = ctx.createConstantSource();
    chopBias.offset.value = 0.5;
    chopper.connect(chopDepth).connect(chunk.gain);
    chopBias.connect(chunk.gain);
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.0001, t0 + 0.15);
    gg.gain.exponentialRampToValueAtTime(0.9, t0 + 0.35);
    gg.gain.exponentialRampToValueAtTime(0.0008, t0 + 2.3);
    grind.connect(gf).connect(chunk).connect(gg).connect(out);
    for (const n of [grind, chopper, chopBias]) { n.start(t0 + 0.15); n.stop(t0 + 2.4); }

    // ...and the final seize: one last heavy clunk
    impact(t0 + 2.2, 0.8);

    // 4. Hiss of oil and steam escaping
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noise;
    hiss.loop = true;
    const hf = ctx.createBiquadFilter();
    hf.type = 'highpass';
    hf.frequency.value = 2500;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, t0 + 0.25);
    hg.gain.exponentialRampToValueAtTime(0.7, t0 + 0.6);
    hg.gain.exponentialRampToValueAtTime(0.0008, t0 + 3.4);
    hiss.connect(hf).connect(hg).connect(out);
    hiss.start(t0 + 0.25, Math.random());
    hiss.stop(t0 + 3.5);
  }

  // Gear grind: trying to select reverse while still rolling
  playGrind() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(2600, t);
    band.frequency.linearRampToValueAtTime(1800, t + 0.35);
    band.Q.value = 6;
    // Rapid chatter of gear teeth clashing
    const chatter = ctx.createGain();
    chatter.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 55;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth).connect(chatter.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
    env.gain.setValueAtTime(0.7, t + 0.25);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    src.connect(band).connect(chatter).connect(env).connect(this.carBus);
    src.start(t, Math.random());
    src.stop(t + 0.4);
    lfo.start(t);
    lfo.stop(t + 0.4);
  }

  // Gear change sound: a sharp mechanical clack for the manual (sequential),
  // a soft thump for the automatic, and nothing at all for the CVT.
  playShift(style) {
    if (!this.ctx || style === 'cvt') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';

    if (style === 'manual') {
      // Clack: a quick burst of filtered noise
      const clack = ctx.createBufferSource();
      clack.buffer = this.noise;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2200;
      band.Q.value = 2;
      const clackGain = ctx.createGain();
      clackGain.gain.setValueAtTime(0.0001, t);
      clackGain.gain.exponentialRampToValueAtTime(0.4, t + 0.003);
      clackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      clack.connect(band).connect(clackGain).connect(this.carBus);
      clack.start(t, Math.random());
      clack.stop(t + 0.1);

      thump.frequency.setValueAtTime(140, t);
      thump.frequency.exponentialRampToValueAtTime(55, t + 0.09);
      thumpGain.gain.setValueAtTime(0.4, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    } else {
      thump.frequency.setValueAtTime(90, t);
      thump.frequency.exponentialRampToValueAtTime(50, t + 0.15);
      thumpGain.gain.setValueAtTime(0.16, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    }
    thump.connect(thumpGain).connect(this.carBus);
    thump.start(t);
    thump.stop(t + 0.2);
  }
}
