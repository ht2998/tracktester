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
                this.makeRes()];   // the 8th: rod knock
    this.tick = 0;         // the latest valve clatter, dying away
    this.knockHit = 0;     // the latest rod knock, dying away
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
        if (!cut) {
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
      const rodKnock = knock * 7 * this.ring(this.res[7], this.knockHit * (Math.random() * 2 - 1) + this.knockHit * 0.4);

      // Intake: rushing air that throbs with each firing
      const intakeIn = (Math.random() * 2 - 1) * (0.35 + Math.min(1.5, this.pulse) * 0.8);

      let y = 1.0 * this.ring(this.res[0], x)
            + 0.55 * this.ring(this.res[1], x)
            + rasp * 0.3 * this.ring(this.res[2], x)
            + humAmount * (0.8 * this.ring(this.res[3], x) + 0.6 * this.ring(this.res[4], x))
            + intakeAmount * this.ring(this.res[5], intakeIn)
            + clack
            + rodKnock;
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

// =====================================================================
// ECHO SYSTEM
// Large objects (buildings, hills, walls) reflect the engine sound back.
// The further away an object is, the later the echo arrives, the more
// muffled it is, and the more it spreads out into a wash of sound.
// =====================================================================
export class EchoSystem {
  constructor({ channels = 3, minSize = 4, maxDistance = 190 } = {}) {
    this.reflectors = [];          // { box, size }
    this.channelCount = channels;  // how many echoes can be heard at once
    this.minSize = minSize;        // metres: anything smaller doesn't echo
    this.maxDistance = maxDistance;
    this.channels = [];
    this.ctx = null;
  }

  // Register an object (building, hill, wall...). Returns false if it's too small.
  addReflector(object3D) {
    const box = new THREE.Box3().setFromObject(object3D);
    const dims = box.getSize(new THREE.Vector3());
    const size = Math.max(dims.x, dims.y, dims.z);
    if (size < this.minSize || dims.y < 2) return false;   // must be big and stand up
    this.reflectors.push({ box, size });
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

    // A small pool of echo paths, reused for whichever objects are nearest
    for (let i = 0; i < this.channelCount; i++) {
      const delay = ctx.createDelay(1.2);
      const muffle = ctx.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.Q.value = 0.5;
      const sharp = ctx.createGain();
      const spread = ctx.createGain();
      sharp.gain.value = 0;
      spread.gain.value = 0;
      input.connect(delay);
      delay.connect(muffle);
      muffle.connect(sharp);
      muffle.connect(spread);
      sharp.connect(output);
      spread.connect(diffuser);
      this.channels.push({ delay, muffle, sharp, spread });
    }
  }

  // listener = THREE.Vector3 (the car's position)
  update(listener) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Find the nearest big objects
    const nearby = [];
    for (const r of this.reflectors) {
      const d = r.box.distanceToPoint(listener);
      if (d <= this.maxDistance) nearby.push({ d: Math.max(d, 1), size: r.size });
    }
    nearby.sort((a, b) => a.d - b.d);

    this.channels.forEach((ch, i) => {
      const hit = nearby[i];
      if (!hit) {
        ch.sharp.gain.setTargetAtTime(0, t, 0.2);
        ch.spread.gain.setTargetAtTime(0, t, 0.2);
        return;
      }
      const { d, size } = hit;
      const delaySeconds = clamp((2 * d) / 343, 0.005, 1.15);          // there and back at the speed of sound
      const cutoff = clamp(5000 / (1 + d / 12), 250, 5000);            // further = more muffled
      const strength = clamp(size / 25, 0.3, 1) * 0.55 * (12 / (12 + d)); // bigger and closer = louder
      const dispersion = clamp(0.15 + d / 90, 0.15, 0.9);              // further = more spread out

      ch.delay.delayTime.setTargetAtTime(delaySeconds, t, 0.2);
      ch.muffle.frequency.setTargetAtTime(cutoff, t, 0.15);
      ch.sharp.gain.setTargetAtTime(strength * (1 - dispersion), t, 0.15);
      ch.spread.gain.setTargetAtTime(strength * dispersion, t, 0.15);
    });
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
    this.master.connect(ctx.destination);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    compressor.connect(this.master);
    this.out = compressor;

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
    warmth.connect(this.body).connect(this.tone).connect(this.engineGain).connect(this.out);

    // Echoes are fed from the engine sound
    this.echo.connect(ctx, this.engineGain, this.out);

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
    }

    // Brighter under load, darker and softer on the overrun
    this.tone.frequency.setTargetAtTime(500 + rpm * 0.32 + load * 1600, t, loadEase);

    let volume = 0.5 + 0.25 * rev + 0.35 * load;
    const shifting = car.shiftTimer > 0;
    if (shifting) volume *= 0.55;             // ignition cut during a shift
    if (car.engineBlown) volume = 0;          // a dead engine makes no noise
    // (the limiter's stutter is made by the pulses themselves)
    // Shifts and the engine dying stay quick; everything else eases
    this.engineGain.gain.setTargetAtTime(volume, t, shifting || car.engineBlown ? 0.03 : loadEase);

    this.echo.update(listenerPos);
  }

  // Engine failure, about 2.5 seconds:
  //   BANG (something lets go) -> metal shattering -> broken parts thrashing
  //   about as the engine spins down, slower and slower -> a hiss of oil and
  //   steam -> one last thud as it seizes.
  playClunk() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const out = this.out;

    const env = (node, at, peak, attack, length) => {
      node.gain.setValueAtTime(0.0001, at);
      node.gain.exponentialRampToValueAtTime(peak, at + attack);
      node.gain.exponentialRampToValueAtTime(0.0008, at + length);
    };
    const noiseBurst = (at, length, freq, q, peak, type = 'bandpass') => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      env(g, at, peak, 0.004, length);
      src.connect(f).connect(g).connect(out);
      src.start(at, Math.random());
      src.stop(at + length + 0.05);
    };
    const tone = (at, freq, endFreq, length, peak, type = 'sine') => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, at);
      o.frequency.exponentialRampToValueAtTime(endFreq, at + length);
      const g = ctx.createGain();
      env(g, at, peak, 0.006, length);
      o.connect(g).connect(out);
      o.start(at);
      o.stop(at + length + 0.05);
    };

    // 1. The BANG: a deep hit and a sharp crack
    tone(t0, 110, 24, 0.9, 1.0);
    noiseBurst(t0, 0.22, 1400, 0.7, 0.9, 'lowpass');
    noiseBurst(t0, 0.08, 4000, 1.0, 0.5);

    // 2. Metal shattering: clashing tones that ring out unevenly
    for (const [freq, level, length] of [[287, 0.2, 1.3], [433, 0.16, 1.1], [612, 0.13, 0.9],
                                         [859, 0.1, 0.8], [1207, 0.07, 0.6], [1733, 0.05, 0.5]]) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(freq * 0.9, t0 + length);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq * 1.4;
      f.Q.value = 4;
      const g = ctx.createGain();
      env(g, t0, level, 0.004, length);
      o.connect(f).connect(g).connect(out);
      o.start(t0);
      o.stop(t0 + length + 0.05);
    }

    // 3. Broken parts thrashing as the engine spins down: clanks that start
    //    fast and slow to a stop, getting quieter as it dies
    let at = t0 + 0.12;
    let gap = 0.035;
    let level = 0.55;
    while (at < t0 + 2.1 && level > 0.04) {
      const freq = 700 + Math.random() * 1500;
      noiseBurst(at, 0.05 + Math.random() * 0.04, freq, 5, level * (0.6 + Math.random() * 0.4));
      if (Math.random() < 0.4) tone(at, 160 + Math.random() * 80, 70, 0.07, level * 0.5);
      at += gap * (0.8 + Math.random() * 0.4);
      gap *= 1.11;      // slowing down
      level *= 0.93;    // and fading
    }

    // 4. Hiss of oil and steam escaping
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noise;
    hiss.loop = true;
    const hf = ctx.createBiquadFilter();
    hf.type = 'highpass';
    hf.frequency.value = 2500;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, t0 + 0.2);
    hg.gain.exponentialRampToValueAtTime(0.18, t0 + 0.5);
    hg.gain.exponentialRampToValueAtTime(0.0008, t0 + 3.2);
    hiss.connect(hf).connect(hg).connect(out);
    hiss.start(t0 + 0.2, Math.random());
    hiss.stop(t0 + 3.3);

    // 5. The engine seizes: one last heavy thud
    tone(t0 + 2.15, 75, 30, 0.45, 0.6);
    noiseBurst(t0 + 2.15, 0.12, 900, 1, 0.35, 'lowpass');
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
    src.connect(band).connect(chatter).connect(env).connect(this.out);
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
      clack.connect(band).connect(clackGain).connect(this.out);
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
    thump.connect(thumpGain).connect(this.out);
    thump.start(t);
    thump.stop(t + 0.2);
  }
}
