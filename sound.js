// =====================================================================
// SOUND: the engine sound, gear shift sounds and echoes.
// Nothing here uses recorded sound files. The engine is built the way a
// real one makes noise: every cylinder firing sends a pulse of exhaust
// gas down the pipe, and the pipe rings at its own pitches. Each cylinder
// is slightly different, which gives an engine its burble. The sound
// follows the car's cylinder count, so a 4, 6, 10 or 12 all sound right.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 16;

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

// ---------------------------------------------------------------------
// The heavy vehicle's engine (the secret one): a 6-cylinder turbo-diesel
// (idle about 720 rpm, governed at 2,700), three firings per turn, each
// one uneven, with a sharp diesel clatter as the fuel lights, a turbo that
// whistles up a beat after the throttle, a low uneven burble in the
// exhaust, a soft deep tap at idle, the hull booming, a deep sub-rumble,
// and the tracks clanking and roaring. Built the same way as the preview
// that was approved: each sound is a set of ringing tones struck by each
// event.
// ---------------------------------------------------------------------
class HeavyEngine extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 720, minValue: 0, maxValue: 4000, automationRate: 'k-rate' },
      { name: 'load', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'speed', defaultValue: 0, minValue: 0, maxValue: 40, automationRate: 'k-rate' },
    ];
  }
  constructor() {
    super();
    // a ringing tone: [freq, decay seconds, amplitude]
    const bank = (modes) => modes.map(([f, d, a]) => ({ f, d, a, y1: 0, y2: 0 }));
    this.dark = bank([[70, 0.030, 1.0], [140, 0.020, 0.6], [260, 0.010, 0.3]]);
    this.bright = bank([[200, 0.012, 0.5], [450, 0.006, 0.35], [950, 0.003, 0.2]]);
    this.lug = bank([[62, 0.035, 1.0], [118, 0.02, 0.7], [380, 0.006, 0.3]]);
    this.knockB = bank([[1250, 0.0025, 0.6], [2300, 0.0016, 0.5], [3600, 0.0011, 0.4]]);
    this.burbleB = bank([[95, 0.045, 1.0], [150, 0.03, 0.7], [230, 0.018, 0.35]]);
    this.hull = bank([[34, 0.09, 1.0], [52, 0.06, 0.6]]);
    this.tapB = bank([[420, 0.007, 0.8], [780, 0.005, 0.6], [1300, 0.003, 0.25]]);
    this.thudB = bank([[70, 0.02, 1.0], [120, 0.012, 0.5]]);
    this.clankB = bank([[1700, 0.004, 0.5], [2600, 0.003, 0.4], [3900, 0.002, 0.3]]);
    for (const b of [this.dark, this.bright, this.lug, this.knockB, this.burbleB, this.hull, this.tapB, this.thudB, this.clankB]) {
      for (const m of b) {
        const w = 2 * Math.PI * m.f / sampleRate, r = Math.exp(-1 / (sampleRate * m.d));
        m.c1 = 2 * r * Math.cos(w); m.c2 = -r * r; m.gain = m.a * Math.sin(w);
      }
    }
    this.gain = [1.0, 0.93, 1.06, 0.97, 1.03, 0.9];   // each cylinder a touch different
    this.cyl = 0; this.phase = 0; this.tickPhase = 0; this.linkPhase = 0; this.whinePhase = 0;
    this.burblePhase = 0; this.burbleWait = -1; this.burbleSize = 0; this.wobble = 0;
    this.boost = 0; this.turboPhase = 0;
    this.burstB = 0; this.burstL = 0; this.burstK = 0; this.burstU = 0; this.burstT = 0; this.burstC = 0;
    this.subA = 0; this.subB = 0; this.subC = 0; this.subD = 0;
    this.inA = 0; this.inB = 0; this.roarA = 0; this.roarB = 0; this.blA = 0; this.blB = 0;
    this.decay4 = Math.exp(-1 / (sampleRate * 0.004));
    this.norm = 0.85 / 5.14;   // the preview's loudness, so it sounds the same
  }
  run(bank, x) {
    let out = 0;
    for (const m of bank) {
      const y = m.c1 * m.y1 + m.c2 * m.y2 + x * m.gain;
      m.y2 = m.y1; m.y1 = y; out += y;
    }
    return out;
  }
  gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 2; }
  process(inputs, outputs, parameters) {
    const out = outputs[0][0];
    if (!out) return true;
    const rpm = parameters.rpm[0], load = parameters.load[0], spd = parameters.speed[0];
    const lugAmt = Math.max(0, Math.min(1, load * (1.15 - rpm / 2700)));
    const fires = rpm / 60 * 3, ticks = rpm / 120, links = spd / 0.135;
    const clatterAmt = 0.55 + 0.25 * load + 0.35 * Math.max(0, Math.min(1, (1100 - rpm) / 400));
    const tapAmt = Math.max(0, Math.min(1, (1400 - rpm) / 700));
    const subLevel = (0.35 + 0.65 * rpm / 2700) * 2.2;
    const roarLevel = Math.pow(spd / 22, 1.2) * 0.5;
    const whineLevel = 0.015 * spd / 22;
    const linkHit = Math.min(1, spd / 3);
    const boostWant = load * Math.min(1, rpm / 2700);
    const kUp = 1 - Math.exp(-1 / (sampleRate * 0.7)), kDown = 1 - Math.exp(-1 / (sampleRate * 0.35));
    const kSub = 1 - Math.exp(-2 * Math.PI * 45 / sampleRate);
    const kInLo = 1 - Math.exp(-2 * Math.PI * 900 / sampleRate), kInHi = 1 - Math.exp(-2 * Math.PI * 3200 / sampleRate);
    const kRoLo = 1 - Math.exp(-2 * Math.PI * 60 / sampleRate), kRoHi = 1 - Math.exp(-2 * Math.PI * 400 / sampleRate);
    const kBl = 1 - Math.exp(-2 * Math.PI * 400 / sampleRate);
    const lugBoost = 1 + 0.3 * lugAmt;
    for (let i = 0; i < out.length; i++) {
      let pd = 0, pb = 0, pl = 0, pk = 0, tk = 0, lk = 0, bu = 0;
      // a firing: uneven strength and timing, the odd weak one, and its diesel knock
      this.phase += fires / sampleRate;
      if (this.phase >= 1) {
        this.phase -= 1 + this.gauss() * 0.035;
        this.cyl = (this.cyl + 1) % 6;
        let g = this.gain[this.cyl] * (0.8 + 0.2 * load) * (1 + 0.16 * this.gauss());
        if (Math.random() < 0.025) g *= 0.45;
        pd = g; pb = g * load; pl = g * lugAmt;
        pk = (0.8 + 0.4 * Math.random()) * clatterAmt;
        this.burstB += pb * 0.12; this.burstL += pl * 0.4; this.burstK += pk * 0.5;
      }
      // the burble: soft, uneven pops in the exhaust (about every other turn)
      this.wobble += 0.7 / sampleRate;
      this.burblePhase += (rpm / 60 * 0.75 * (1 + 0.3 * Math.sin(2 * Math.PI * this.wobble))) / sampleRate;
      if (this.burblePhase >= 1) {
        this.burblePhase -= 1;
        if (Math.random() >= 0.25) {
          this.burbleWait = Math.max(0, Math.round(this.gauss() * 0.012 * sampleRate + 0.03 * sampleRate));
          this.burbleSize = (0.5 + 0.8 * Math.random()) * (0.6 + 0.6 * (1 - load));
        }
      }
      if (this.burbleWait >= 0 && this.burbleWait-- === 0) { bu = this.burbleSize; this.burstU += bu * 0.15; }
      // the idle tap, once per camshaft turn
      this.tickPhase += ticks / sampleRate;
      if (this.tickPhase >= 1) { this.tickPhase -= 1 + this.gauss() * 0.01; tk = (0.7 + 0.3 * Math.random()) * tapAmt; this.burstT += tk * 0.12; }
      // a track link slapping down
      this.linkPhase += links / sampleRate;
      if (this.linkPhase >= 1) { this.linkPhase -= 1; lk = (0.5 + 0.5 * Math.random()) * linkHit; this.burstC += lk * 0.3; }
      // exhaust, clear even when it's labouring
      const engine = (this.run(this.dark, pd) + 0.8 * (this.run(this.bright, pb) + this.burstB * this.gauss())
        + 1.1 * (this.run(this.lug, pl) + this.burstL * this.gauss())) * lugBoost;
      const clatter = this.run(this.knockB, pk) + this.burstK * this.gauss();
      // turbo: the boost lags the throttle, the whistle rises with it
      this.boost += (boostWant - this.boost) * (boostWant > this.boost ? kUp : kDown);
      this.turboPhase = (this.turboPhase + (2600 + 4200 * this.boost) / sampleRate) % 1;
      const whistle = 0.022 * this.boost * Math.sin(2 * Math.PI * this.turboPhase);
      const nn = this.gauss();
      this.inA += (nn - this.inA) * kInHi; this.inB += (this.inA - this.inB) * kInLo;
      const intake = (this.inA - this.inB) * Math.pow(this.boost, 1.3) * 0.07 * 1.6;
      // burble, kept soft and low
      const bRaw = this.run(this.burbleB, bu) + this.burstU * this.gauss();
      this.blA += (bRaw - this.blA) * kBl; this.blB += (this.blA - this.blB) * kBl;
      const burble = this.blB;
      const hull = 0.9 * this.run(this.hull, pd);
      this.subA += (this.gauss() - this.subA) * kSub; this.subB += (this.subA - this.subB) * kSub;
      this.subC += (this.subB - this.subC) * kSub; this.subD += (this.subC - this.subD) * kSub;
      const sub = this.subD * subLevel * 6;
      const tap = this.run(this.tapB, tk) + this.burstT * this.gauss();
      const thud = this.run(this.thudB, lk);
      const clank = this.run(this.clankB, lk) + this.burstC * this.gauss();
      this.roarA += (this.gauss() - this.roarA) * kRoHi; this.roarB += (this.roarA - this.roarB) * kRoLo;
      const roar = (this.roarA - this.roarB) * roarLevel * 1.2;
      this.whinePhase = (this.whinePhase + spd * 38 / sampleRate) % 1;
      const whine = whineLevel * Math.sin(2 * Math.PI * this.whinePhase);
      this.burstB *= this.decay4; this.burstL *= this.decay4; this.burstK *= this.decay4; this.burstU *= this.decay4; this.burstT *= this.decay4; this.burstC *= this.decay4;
      const mix = 1.2 * (engine + intake + hull + 0.5 * sub + 0.32 * clatter + whistle + 0.45 * burble)
        + 0.2 * tap + 0.55 * thud + 0.12 * clank + 0.25 * roar + whine;
      out[i] = Math.tanh(mix * this.norm) * 0.92;
    }
    for (let ch = 1; ch < outputs[0].length; ch++) outputs[0][ch].set(out);
    return true;
  }
}
registerProcessor('heavy-engine', HeavyEngine);

// ---------------------------------------------------------------------
// The early-2000s F1 V10 (the engine swap's 3.0 V10): built the same way
// as the approved preview (take 8). Five exhaust bangs a turn, the two
// banks of five each with their own pipes; every cylinder a little
// different and every firing a touch early or late, which puts a lumpy
// rumble under the scream (stronger lower down the revs); a sharp push and
// suck-back in each bang, pipe resonances, a little combustion roar, rasp,
// crackle on the overrun, extra low end, the shrill top and the 'iiing'
// taken out.
// ---------------------------------------------------------------------
class V10Engine extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 4000, minValue: 0, maxValue: 22000, automationRate: 'k-rate' },
      { name: 'load', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }
  constructor() {
    super();
    const sr = sampleRate;
    this.sr = sr;
    this.phase = 0; this.lastFire = 0; this.gap = sr / 300;
    this.cylAmp = [];
    for (let k = 0; k < 10; k++) this.cylAmp.push(Math.max(0.35, 1 + this.gauss() * 0.28));
    this.pending = [];                 // bangs waiting for their (slightly late) moment
    this.banks = [0, 1].map(() => ({ a1: 0, a2: 0, d1: 0.9, d2: 0.97 }));
    // pipe resonances (constant 0 dB peak band-passes), per bank
    const peaks = [
      [[95, 1.5, 1.0], [170, 2, 1.1], [330, 2.5, 1.0], [800, 4, 0.45], [2200, 5, 0.18]],
      [[85, 1.5, 1.0], [150, 2, 1.1], [300, 2.5, 1.0], [720, 4, 0.45], [2500, 5, 0.15]],
    ];
    this.res = peaks.map((list) => list.map(([f, q, g]) => this.bp(f, q, g)));
    this.roarHP = 0; this.roarLP = 0; this.roarIn = 0; this.env = 0;
    this.crack = 0; this.crackT = 0; this.crLP = 0; this.crHP = 0; this.crIn = 0;
    this.low1 = 0; this.low2 = 0; this.top1 = 0; this.top2 = 0; this.hp = 0; this.hpIn = 0;
    this.mid = this.bp(1900, 1.3, 1);
  }
  gauss() { let s = 0; for (let k = 0; k < 4; k++) s += Math.random(); return (s - 2) / 0.58; }
  bp(f, q, g) {
    const w = 2 * Math.PI * f / this.sr, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    return { b0: al / a0 * g, b2: -al / a0 * g, a1: -2 * Math.cos(w) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
  }
  run(f, x) {
    const y = f.b0 * x + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
    f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
    return y;
  }
  process(inputs, outputs, parameters) {
    const out = outputs[0][0];
    if (!out) return true;
    const sr = this.sr;
    const rpm = Math.max(0, parameters.rpm[0]), load = Math.min(1, Math.max(0, parameters.load[0]));
    const bright = Math.min(1, Math.max(0, (rpm - 6000) / 13200)), lowRev = 1 - bright;
    const turnsPerSample = rpm / 60 / sr;
    const lp = (fc) => 1 - Math.exp(-2 * Math.PI * fc / sr);
    const kRoarHP = lp(500), kRoarLP = lp(9000), kLow = lp(350), kTop = lp(5200), kHP = lp(35), kCrLP = lp(4000), kCrHP = lp(400), kEnv = 0.02;
    const T = Math.tanh(0.3);
    for (let n = 0; n < out.length; n++) {
      this.phase += turnsPerSample;
      // a firing: five a turn; each a touch late (up to a few % of the gap)
      const fireNo = Math.floor(this.phase * 5);
      if (fireNo !== this.lastFire) {
        this.gap = turnsPerSample > 0 ? 1 / (5 * turnsPerSample) : this.gap;
        this.lastFire = fireNo;
        const cyl = ((fireNo % 10) + 10) % 10;
        const delay = Math.max(0, Math.abs(this.gauss()) * 0.035 * this.gap);
        const a = (0.35 + 0.65 * load) * this.cylAmp[cyl] * (1 + this.gauss() * (0.14 + 0.12 * lowRev)) * (cyl % 2 === 0 ? 1.32 : 0.72);
        const tau = (0.00032 + 0.0006 * lowRev) * sr * (0.75 + 0.5 * Math.random());
        this.pending.push({ at: delay, a, tau, bank: cyl % 2 });
      }
      for (let k = this.pending.length - 1; k >= 0; k--) {
        const p = this.pending[k];
        p.at -= 1;
        if (p.at <= 0) {
          const B = this.banks[p.bank];
          B.a1 += p.a; B.a2 += p.a * 0.35;
          B.d1 = Math.exp(-1 / p.tau); B.d2 = Math.exp(-1 / (p.tau * 3));
          this.pending.splice(k, 1);
        }
      }
      // the bangs through each bank's pipes
      let x = 0, raw = 0;
      for (let b = 0; b < 2; b++) {
        const B = this.banks[b];
        const pulse = B.a1 - B.a2;
        B.a1 *= B.d1; B.a2 *= B.d2;
        raw += pulse;
        let r = 0.5 * pulse;
        for (const f of this.res[b]) r += this.run(f, pulse);
        x += r;
      }
      // combustion roar, pulsing with the bangs
      this.env += (Math.abs(raw) - this.env) * kEnv;
      const nz = Math.random() * 2 - 1;
      this.roarLP += (nz - this.roarLP) * kRoarLP;
      this.roarHP += (this.roarLP - this.roarHP) * kRoarHP;
      const roar = (this.roarLP - this.roarHP) * this.env * (0.3 + 0.4 * bright) * 0.5 * 2.2;
      // the lumpy beat of the uneven cylinders (every engine cycle and every turn)
      const ph = this.phase * 2 * Math.PI;
      const cyc = Math.sin(ph * 0.5) * 0.35 + Math.sin(ph) * 0.25;
      x *= 1 + (0.35 + 0.45 * lowRev) * cyc;
      let y = Math.tanh((x * 2.0 + roar * 0.6) * 2.4 + 0.3) - T;
      // crackle on the overrun
      if (load < 0.2 && rpm > 8000) {
        this.crackT -= 1;
        if (this.crackT <= 0) { this.crackT = sr * 0.03; if (Math.random() < 0.55) this.crack = 0.9; }
      }
      const cn = (Math.random() * 2 - 1) * this.crack;
      this.crack *= Math.exp(-1 / (sr * 0.004));
      this.crLP += (cn - this.crLP) * kCrLP;
      this.crHP += (this.crLP - this.crHP) * kCrHP;
      y += this.crLP - this.crHP;
      // more low end (more lower down the revs)
      this.low1 += (y - this.low1) * kLow; this.low2 += (this.low1 - this.low2) * kLow;
      y += (1.6 + 1.8 * lowRev) * this.low2;
      // the shrill top off, and the 'iiing' (1.3-2.6 kHz) dipped
      this.top1 += (y - this.top1) * kTop; this.top2 += (this.top1 - this.top2) * kTop;
      y = this.top2;
      y -= 0.55 * this.run(this.mid, y);
      this.hp += (y - this.hp) * kHP;
      out[n] = (y - this.hp) * 0.42;
    }
    for (let ch = 1; ch < outputs[0].length; ch++) outputs[0][ch].set(out);
    return true;
  }
}
registerProcessor('v10-engine', V10Engine);
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
// Rain patter: separate drops ticking on the car and the road, "tck tck
// tck". Each drop is a tiny dry click (a millisecond or two of hiss with a
// hard edge), some brighter (on the bodywork), some duller (on the road).
// Looped; played faster for more drops.
function makePatterBuffer(ctx, seconds = 4) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sr * seconds, sr);
  const data = buffer.getChannelData(0);
  // A faint wash of far-off drops underneath, so it isn't too clean
  let soft = 0;
  for (let i = 0; i < data.length; i++) {
    soft += ((Math.random() * 2 - 1) - soft) * 0.35;
    data[i] = soft * 0.035 * (0.7 + 0.3 * Math.sin(i / sr * 1.7));
  }
  const tick = (start, onCar, scale) => {
    const decay = (onCar ? 0.0016 : 0.0024) + Math.random() * 0.0014;   // seconds: short, but a soft tap rather than a click
    const amp = (onCar ? 0.9 : 0.6) * (0.35 + Math.random() * 0.65);
    const ring = onCar ? 1800 + Math.random() * 1400 : 900 + Math.random() * 900;   // the "t" of the tap
    const n = Math.floor(decay * 7 * sr);
    let phase = 0, smooth = 0;
    for (let i = 0; i < n && start + i < data.length; i++) {
      const env = Math.min(1, i / (sr * 0.0004)) * Math.exp(-i / (decay * sr));   // a soft edge, not a hard click
      phase += (2 * Math.PI * ring) / sr;
      const noise = Math.random() * 2 - 1;
      smooth += (noise - smooth) * 0.45;                          // takes the sharp fizz off
      data[start + i] += scale * amp * env * (0.6 * smooth + 0.4 * Math.sin(phase));
    }
  };
  let t = 0.01;
  while (t < seconds - 0.03) {
    const start = Math.floor(t * sr);
    const onCar = Math.random() < 0.4;
    tick(start, onCar, 1);
    // some drops splatter: a second, smaller tick just after the first
    if (Math.random() < 0.3) tick(start + Math.floor(sr * (0.003 + Math.random() * 0.008)), onCar, 0.4 + Math.random() * 0.3);
    // now and then a dull, softer drop (on the tyre or the seat)
    if (Math.random() < 0.15) tick(start + Math.floor(sr * (0.01 + Math.random() * 0.03)), false, 0.5);
    // uneven gaps, sometimes in little clusters: real rain never keeps time
    t += Math.random() < 0.2 ? 0.008 + Math.random() * 0.02 : 0.03 + Math.random() * 0.11;
  }
  return buffer;
}

// Thunder: a big bang that rolls away into a rumble.
// Made once, then played louder or softer (and more muffled) by distance.
function makeThunderBuffer(ctx, seconds = 6) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(2, sr * seconds, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buffer.getChannelData(ch);
    // The bang: a huge low boom that swells in fast and rolls away
    let low = 0, low2 = 0;
    const k1 = 1 - Math.exp(-2 * Math.PI * 240 / sr);
    const k2 = 1 - Math.exp(-2 * Math.PI * 70 / sr);
    for (let i = 0; i < d.length; i++) {
      const tt = i / sr;
      const env = Math.min(1, tt / 0.06) * (0.55 * Math.exp(-tt / 0.5) + 0.45 * Math.exp(-tt / 2.2));
      // rolling: the rumble surges a few times as it fades
      const roll = 0.75 + 0.25 * Math.sin(tt * 5.3 + ch) * Math.sin(tt * 2.1);
      const n = Math.random() * 2 - 1;
      low += (n - low) * k1;
      low2 += (low - low2) * k2;
      // (plus a burst of raw crash at the start of the bang)
      d[i] += env * roll * (low * 3.2 + low2 * 6) + n * 0.4 * Math.min(1, tt / 0.02) * Math.exp(-tt / 0.18);
    }
  }
  // Keep it inside the speaker's range
  let peak = 0;
  for (let ch = 0; ch < 2; ch++) for (const v of buffer.getChannelData(ch)) peak = Math.max(peak, Math.abs(v));
  for (let ch = 0; ch < 2; ch++) { const d = buffer.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] /= peak; }
  return buffer;
}

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
    const cutoff = clamp(6500 / (1 + d / 20), 350, 6500);            // further = more muffled
    const strength = Math.min(0.9, clamp(r.size / 25, 0.4, 1) * 1.4 * (26 / (26 + d)) * r.reflect);   // bigger, closer, harder = louder
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

    // --- Rain: separate pitter-patter drops in drizzle and light rain;
    // from moderate rain up, a steady white-noise roar ---
    this.patterSrc = ctx.createBufferSource();
    this.patterSrc.buffer = makePatterBuffer(ctx);
    this.patterSrc.loop = true;
    this.patterGain = ctx.createGain();
    this.patterGain.gain.value = 0;
    this.patterSrc.connect(this.patterGain).connect(this.out);   // not the car's echo bus: it's all around
    const roarSrc = ctx.createBufferSource();
    roarSrc.buffer = this.noise;
    roarSrc.loop = true;
    const roarShape = ctx.createBiquadFilter();
    roarShape.type = 'bandpass';
    roarShape.frequency.value = 2600;
    roarShape.Q.value = 0.45;
    const roarLow = ctx.createBiquadFilter();                  // heavy rain drumming on the car
    roarLow.type = 'lowpass';
    roarLow.frequency.value = 380;
    this.roarLowGain = ctx.createGain();
    this.roarLowGain.gain.value = 0;
    this.roarGain = ctx.createGain();
    this.roarGain.gain.value = 0;
    roarSrc.connect(roarShape).connect(this.roarGain).connect(this.out);
    roarSrc.connect(roarLow).connect(this.roarLowGain).connect(this.out);

    // --- Wet tyres: a swish on a wet road, uneven and sloshy in puddles ---
    const swishSrc = ctx.createBufferSource();
    swishSrc.buffer = this.noise;
    swishSrc.loop = true;
    const swishBand = ctx.createBiquadFilter();
    swishBand.type = 'bandpass';
    swishBand.frequency.value = 1300;
    swishBand.Q.value = 0.8;
    this.swishGain = ctx.createGain();
    this.swishGain.gain.value = 0;
    swishSrc.connect(swishBand).connect(this.swishGain).connect(this.carBus);
    this.sloshSrc = ctx.createBufferSource();
    this.sloshSrc.buffer = makeSquelchBuffer(ctx);
    this.sloshSrc.loop = true;
    this.sloshSrc.playbackRate.value = 1.6;                   // quicker, splashier than the grass squelch
    const sloshTone = ctx.createBiquadFilter();
    sloshTone.type = 'lowpass';
    sloshTone.frequency.value = 2400;
    this.sloshGain = ctx.createGain();
    this.sloshGain.gain.value = 0;
    this.sloshSrc.connect(sloshTone).connect(this.sloshGain).connect(this.carBus);
    // ...and the "psssht": water sheeting off the tyres in a hissing spray
    const psshSrc = ctx.createBufferSource();
    psshSrc.buffer = this.noise;
    psshSrc.loop = true;
    const psshBand = ctx.createBiquadFilter();
    psshBand.type = 'bandpass';
    psshBand.frequency.value = 3800;
    psshBand.Q.value = 0.6;
    const psshAir = ctx.createBiquadFilter();
    psshAir.type = 'highshelf';
    psshAir.frequency.value = 6000;
    psshAir.gain.value = 6;
    this.psshGain = ctx.createGain();
    this.psshGain.gain.value = 0;
    this.psshBand = psshBand;
    psshSrc.connect(psshBand).connect(psshAir).connect(this.psshGain).connect(this.carBus);
    this.lastPuddle = 0;
    this.psshLevel = 0;

    // --- Mud: the puddle "psssht", a little deeper, plus a breathy
    // "pfffff" like the air rushing out of a burst tyre ---
    const mudHissSrc = ctx.createBufferSource();
    mudHissSrc.buffer = this.noise;
    mudHissSrc.loop = true;
    const mudBand = ctx.createBiquadFilter();
    mudBand.type = 'bandpass';
    mudBand.frequency.value = 2200;
    mudBand.Q.value = 0.6;
    this.mudBand = mudBand;
    this.mudGain = ctx.createGain();
    this.mudGain.gain.value = 0;
    mudHissSrc.connect(mudBand).connect(this.mudGain).connect(this.carBus);
    this.mudSrc = ctx.createBufferSource();
    this.mudSrc.buffer = this.noise;
    this.mudSrc.loop = true;
    const pff = ctx.createBiquadFilter();                      // the same shape as a blowout's rush of air
    pff.type = 'bandpass';
    pff.frequency.value = 1600;
    pff.Q.value = 0.9;
    this.mudPffGain = ctx.createGain();
    this.mudPffGain.gain.value = 0;
    this.mudSrc.connect(pff).connect(this.mudPffGain).connect(this.carBus);

    // --- Frame scraping along the road (a wheel has come off) ---
    const frameSrc = ctx.createBufferSource();
    frameSrc.buffer = this.noise;
    frameSrc.loop = true;
    const frameLow = ctx.createBiquadFilter();
    frameLow.type = 'bandpass';
    frameLow.frequency.value = 520;
    frameLow.Q.value = 1.4;
    const frameHigh = ctx.createBiquadFilter();
    frameHigh.type = 'bandpass';
    frameHigh.frequency.value = 2300;
    frameHigh.Q.value = 3;
    const frameLowLevel = ctx.createGain();
    frameLowLevel.gain.value = 3;
    const frameHighLevel = ctx.createGain();
    frameHighLevel.gain.value = 2;
    const frameGrit = ctx.createWaveShaper();
    frameGrit.curve = makeGrowlCurve();
    this.frameGain = ctx.createGain();
    this.frameGain.gain.value = 0;
    frameSrc.connect(frameLow).connect(frameLowLevel).connect(frameGrit);
    frameSrc.connect(frameHigh).connect(frameHighLevel).connect(frameGrit);
    frameGrit.connect(this.frameGain).connect(this.carBus);

    for (const n of [this.patterSrc, roarSrc, swishSrc, this.sloshSrc, psshSrc, mudHissSrc, this.mudSrc, frameSrc]) n.start(ctx.currentTime);
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
        this.carVoiceGain = ctx.createGain();
        this.voice.connect(this.carVoiceGain).connect(this.engineInput);
        // the heavy vehicle's own engine and tracks (silent until it's used)
        this.heavy = new AudioWorkletNode(ctx, 'heavy-engine', { outputChannelCount: [1] });
        this.heavyGain = ctx.createGain();
        this.heavyGain.gain.value = 0;
        this.heavyPan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
        this.heavy.connect(this.heavyPan).connect(this.heavyGain).connect(this.carBus);
        // the swappable F1 V10's own voice (silent unless it's fitted)
        this.v10 = new AudioWorkletNode(ctx, 'v10-engine', { outputChannelCount: [1] });
        this.v10Gain = ctx.createGain();
        this.v10Gain.gain.value = 0;
        // (straight out, not through the car engine's warm, closing filter, so
        // it isn't muffled; the game's own compressor and peak limiter keep it
        // from clipping)
        this.v10.connect(this.v10Gain).connect(this.carBus);
        this.setHeavy(this.heavyOn);
      }).catch((err) => console.warn('Engine sound could not start:', err));
    }
  }

  // Swap between the car's engine and the heavy vehicle's
  setHeavy(on) {
    this.heavyOn = !!on;
    if (!this.ctx || !this.heavyGain) return;
    const t = this.ctx.currentTime;
    this.heavyGain.gain.setTargetAtTime(on ? 0.85 * (this.driverEar ? 1.35 : 1) : 0, t, 0.1);
    const v10 = !on && this.spec.voice === 'v10';
    this.carVoiceGain.gain.setTargetAtTime(on || v10 ? 0 : 1, t, 0.1);
    if (!v10) this.v10Gain?.gain.setTargetAtTime(0, t, 0.1);
  }

  // Sitting in the driver's seat: the engine is right beside you, on your
  // right, so it's louder and comes from that side
  setDriverEar(on) {
    if (this.driverEar === !!on) return;
    this.driverEar = !!on;
    if (!this.ctx || !this.heavyPan) return;
    const t = this.ctx.currentTime;
    if (this.heavyPan.pan) this.heavyPan.pan.setTargetAtTime(on ? 0.55 : 0, t, 0.1);
    this.setHeavy(this.heavyOn);
  }

  // The 90 mm gun firing: a deep, round bang ringing on for two seconds, a
  // huge boom you feel in your chest with a long roll dragging after it,
  // the breech clanging open and the empty case dropping out (it echoes
  // off buildings like everything else)
  playCannon() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime, out = this.carBus;
    const burst = (at, length, type, freq, q, peak, attack = 0.001) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0006, at + length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random() * 1.5);
      src.stop(at + length + 0.05);
    };
    const thump = (at, freq, length, peak) => {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(freq * 1.6, at);
      o.frequency.exponentialRampToValueAtTime(freq, at + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0006, at + length);
      o.connect(g).connect(out);
      o.start(at); o.stop(at + length + 0.05);
    };
    // (as approved in the preview, take 4, then 50% louder)
    const L = 1.5;
    burst(t0, 2.0, 'lowpass', 520, 0.7, 6.0 * L, 0.002);       // the shot: deep and round, ringing on for 2 s
    thump(t0, 62, 0.9, 4.0 * L);                               // its round punch
    burst(t0, 1.8, 'lowpass', 85, 0.9, 8.0 * L, 0.003);        // the boom
    thump(t0, 34, 1.1, 3.6 * L);                               // the chest thump
    burst(t0 + 0.05, 2.6, 'lowpass', 380, 0.7, 0.9 * L, 0.05); // the rumble rolling away
    burst(t0 + 0.1, 4.8, 'lowpass', 170, 0.8, 2.0 * L, 0.25);  // the boom dragging on: a long, low roll
    burst(t0 + 0.42, 0.09, 'bandpass', 2600, 4, 0.9 * L);     // the breech clanging open
    burst(t0 + 0.47, 0.12, 'bandpass', 900, 3, 0.7 * L);
    burst(t0 + 0.95, 0.06, 'bandpass', 3400, 6, 0.5 * L);     // the empty case hitting the floor
    burst(t0 + 1.05, 0.05, 'bandpass', 3000, 6, 0.3 * L);
  }

  // One round from the coaxial machine gun: a sharp crack, a short punchy
  // thump and a ring of the action (a little different every time)
  // A different car or engine: its cylinders and revs (the engine note
  // follows from those)
  setSpec(spec) {
    this.spec = spec;
    if (this.voice) this.voice.parameters.get('cylinders').value = spec.cylinders;
    this.setHeavy(this.heavyOn);          // (which voice is speaking)
  }

  // A turbo popping on the overrun: a sharp crack and a thump from the exhaust
  playPop(size = 1) {
    if (!this.ctx || !this.noise) return;
    const ctx = this.ctx, t0 = ctx.currentTime, out = this.carBus;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const at = t0 + k * (0.05 + Math.random() * 0.07);
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500 + Math.random() * 700; f.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(1.2 * size, at + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0004, at + 0.09);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random()); src.stop(at + 0.12);
    }
  }

  playMG() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime, out = this.carBus;
    const v = 0.85 + Math.random() * 0.3;
    const burst = (at, length, type, freq, q, peak) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0004, at + length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random() * 1.5);
      src.stop(at + length + 0.03);
    };
    burst(t0, 0.05, 'bandpass', 1900 * v, 0.8, 1.6);     // the crack
    burst(t0, 0.16, 'lowpass', 420 * v, 0.7, 2.2);       // the punch
    burst(t0, 0.35, 'lowpass', 160, 0.8, 0.8);           // a short roll after it
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150 * v, t0);
    o.frequency.exponentialRampToValueAtTime(70, t0 + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1.2, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.12);
    o.connect(g).connect(out);
    o.start(t0); o.stop(t0 + 0.15);
    burst(t0 + 0.03, 0.03, 'bandpass', 3800, 5, 0.35);    // the bolt cycling
  }

  // A shell landing: a deep boom with a long roll after it (later, quieter
  // and duller the further away it is)
  playExplosion(distance) {
    if (!this.ctx) return;
    const ctx = this.ctx, out = this.master;
    const t0 = ctx.currentTime + Math.min(3, distance / 343);   // sound takes time to arrive
    const near = 1 / (1 + distance / 45);
    const dull = Math.max(250, 4000 / (1 + distance / 60));     // far away, the high end is lost
    const burst = (at, length, type, freq, q, peak, attack = 0.002) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), at + attack);
      g.gain.exponentialRampToValueAtTime(0.0006, at + length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random() * 1.5);
      src.stop(at + length + 0.05);
    };
    burst(t0, 2.2, 'lowpass', 110, 0.9, 5.2 * near, 0.004);           // the boom
    burst(t0 + 0.1, 4.0, 'lowpass', 150, 0.8, 1.6 * near, 0.3);       // its long roll
    burst(t0, 0.18, 'lowpass', dull, 0.7, 3.0 * near);                // the blast
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
    // the turbo's whistle, rising with the boost
    if (!this.whistle && this.carBus) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
      o.type = 'sine'; f.type = 'bandpass'; f.Q.value = 4; g.gain.value = 0;
      o.connect(f).connect(g).connect(this.carBus);
      o.start();
      this.whistle = { o, g, f };
    }
    if (this.whistle) {
      const boost = Number.isFinite(car.boost) ? car.boost : 0;
      const on = s.turbo && !this.heavyOn ? boost : 0;
      this.whistle.o.frequency.setTargetAtTime(1600 + 5200 * boost, t, 0.05);
      this.whistle.f.frequency.setTargetAtTime(1600 + 5200 * boost, t, 0.05);
      this.whistle.g.gain.setTargetAtTime(0.045 * on * on, t, 0.08);
    }
    // (anything not a proper number is treated as idle / nothing, so one bad
    // value can never stop the sound)
    const num = (v, d) => (Number.isFinite(v) ? v : d);
    const rpm = num(car.rpm, 800);
    const rev = clamp(rpm / s.redline, 0, 1);
    // Throttle matters even before the engine is fully loaded, so blend both
    const load = clamp(Math.max(num(car.engineLoad, 0), num(car.throttleAmount, 0) * 0.6), 0, 1);

    // Ease into and out of throttle rather than switching instantly: getting
    // on the power swells in over ~0.15 s, lifting off fades over ~0.25 s
    const rising = load > (this.lastLoad ?? 0);
    this.lastLoad = load;
    const loadEase = rising ? 0.15 : 0.25;

    if (this.heavy && this.heavyOn) {
      this.heavy.parameters.get('rpm').setTargetAtTime(rpm, t, 0.08);
      this.heavy.parameters.get('load').setTargetAtTime(clamp(num(car.engineLoad, 0), 0, 1), t, loadEase);
      this.heavy.parameters.get('speed').setTargetAtTime(Math.min(40, Math.abs(num(car.vx, 0))), t, 0.1);
    }
    if (this.v10 && this.spec.voice === 'v10') {
      this.v10.parameters.get('rpm').setTargetAtTime(rpm, t, 0.03);
      this.v10.parameters.get('load').setTargetAtTime(load, t, loadEase);
    }
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
    // the V10 (its own path): the loudest engine in the game, cut in a shift
    if (this.v10Gain && this.spec.voice === 'v10' && !this.heavyOn) {
      const v = (car.engineDead ? 0 : 3.2) * (shifting ? 0.5 : 1) * (0.8 + 0.2 * load);
      this.v10Gain.gain.setTargetAtTime(v, t, shifting ? 0.02 : car.engineDead ? 0.4 : 0.06);
    }

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
    const out = this.master;                       // straight out: thunder is all around, not part of the car
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

  // Rain and wet tyres, called every frame. rain: how hard it's raining
  // (0-1), wet: how wet the track is (0-1), speed: m/s, puddle: how much
  // standing water the tyres are in (0-1)
  setRain(rain, wet, speed, puddle) {
    if (!this.ctx || !this.patterGain) return;
    const t = this.ctx.currentTime;
    const roar = Math.max(0, (rain - 0.4) / 0.6);              // moderate rain upwards
    // Patter: on its own in light rain, fading under the roar in heavy rain
    this.patterGain.gain.setTargetAtTime(rain > 0.01 ? (0.22 + 0.9 * Math.min(rain, 0.5)) * (1 - 0.6 * roar) : 0, t, 0.3);
    this.patterSrc.playbackRate.setTargetAtTime(0.7 + 1.6 * Math.min(rain, 0.5), t, 0.3);   // more drops
    this.roarGain.gain.setTargetAtTime(0.32 * Math.pow(roar, 0.8), t, 0.4);
    this.roarLowGain.gain.setTargetAtTime(0.4 * roar * roar, t, 0.4);
    // Wet road: the tyres swish (more the faster and wetter)
    const moving = Math.min(1, speed / 25);
    this.swishGain.gain.setTargetAtTime(0.16 * wet * moving, t, 0.15);
    // Puddles: a hissing "psssht" of spray (a burst as you hit the water,
    // then a steady hiss while you're in it), with an uneven slosh underneath
    const inWater = puddle * Math.min(1, speed / 6);
    const hit = Math.max(0, puddle - this.lastPuddle) * Math.min(1, speed / 6);
    this.lastPuddle = puddle;
    const hiss = Math.min(1.2, 0.75 * inWater * (0.5 + 0.5 * Math.min(1, speed / 25)) + 0.8 * hit);
    this.psshGain.gain.setTargetAtTime(0.55 * hiss, t, hiss > this.psshLevel ? 0.07 : 0.15);   // swells in smoothly
    this.psshLevel = hiss;
    this.psshBand.frequency.setTargetAtTime(2600 + 2200 * Math.min(1, speed / 30), t, 0.1);
    const slosh = inWater * (0.45 + Math.random() * 0.55);
    this.sloshGain.gain.setTargetAtTime(0.25 * slosh, t, 0.05);
    this.sloshSrc.playbackRate.setTargetAtTime(1.1 + 1.2 * moving + Math.random() * 0.3, t, 0.08);
  }

  // Mud: amount 0-1 (how much the tyres are churning through it), speed m/s
  setMud(amount, speed) {
    if (!this.ctx || !this.mudGain) return;
    const t = this.ctx.currentTime;
    const level = amount * Math.min(1, speed / 4);
    // the psssht, a little deeper than in a puddle (and smooth to start)
    this.mudGain.gain.setTargetAtTime(0.45 * level * (0.6 + 0.4 * Math.min(1, speed / 20)), t, level > (this.mudLevel || 0) ? 0.07 : 0.15);
    this.mudBand.frequency.setTargetAtTime(1900 + 1500 * Math.min(1, speed / 30), t, 0.1);
    // the pfffff, breathing a little unevenly
    this.mudPffGain.gain.setTargetAtTime(0.5 * level * (0.75 + Math.random() * 0.25), t, 0.09);
    this.mudLevel = level;
  }

  // A corner scraping along on its frame (the wheel has come off)
  setFrameScrape(frames, speed) {
    if (!this.ctx || !this.frameGain) return;
    const t = this.ctx.currentTime;
    const level = frames ? Math.min(1, speed / 4) * (0.22 + 0.15 * Math.min(1, speed / 25)) * (0.85 + Math.random() * 0.3) : 0;
    this.frameGain.gain.setTargetAtTime(level, t, 0.05);
  }

  // Thunder. strength 0-1: a close strike is loud and sharp; a far
  // one is quieter and muffled (the crack and rattle don't carry, only the rumble)
  playThunder(strength) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.thunderBuffer = this.thunderBuffer || makeThunderBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = this.thunderBuffer;
    src.playbackRate.value = 0.92 + Math.random() * 0.16;          // each strike a little different
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 400 + 9000 * strength * strength;        // far away = muffled
    const g = ctx.createGain();
    g.gain.value = 1.6 * Math.pow(Math.max(0.2, strength), 0.75);    // loud, and louder the closer it is
    src.connect(tone).connect(g).connect(this.master);              // straight out: thunder is all around
    src.start();
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
    const out = this.master;                       // straight out: thunder is all around, not part of the car   // louder than the engine

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
