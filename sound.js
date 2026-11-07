// =====================================================================
// SOUND: the engine sound, gear shift sounds and echoes.
// Nothing here uses recorded sound files. The engine is generated live
// from the RPM, throttle and load, so it idles, cruises, revs and bounces
// off the limiter exactly as the physics does.
// =====================================================================

import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Short white-noise recording, made once and reused (for intake roar and clunks)
function makeNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Soft distortion: adds grit and stops the sound getting harsh when loud
function makeDriveCurve(amount = 2.2) {
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
    this._point = new THREE.Vector3();
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
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(this.master);
    this.out = compressor;

    // --- Engine voice ---
    this.mix = ctx.createGain();

    // Main tone: the exhaust pulses. A V6 fires 3 times per crank turn.
    const n = 24;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      imag[k] = (1 / Math.pow(k, 1.15)) * (k % 3 === 0 ? 1.5 : 1) * (k === 1 ? 0.8 : 1);
    }
    this.oscMain = ctx.createOscillator();
    this.oscMain.setPeriodicWave(ctx.createPeriodicWave(real, imag));
    this.gainMain = ctx.createGain();
    this.gainMain.gain.value = 0.5;

    // Half-order tone: the uneven, burbly V6 character
    this.oscHalf = ctx.createOscillator();
    this.oscHalf.type = 'sawtooth';
    this.gainHalf = ctx.createGain();
    this.gainHalf.gain.value = 0.2;

    // Crank tone: the low rumble underneath
    this.oscCrank = ctx.createOscillator();
    this.oscCrank.type = 'triangle';
    this.gainCrank = ctx.createGain();
    this.gainCrank.gain.value = 0.3;

    // Intake and exhaust roar: filtered noise that grows with throttle
    this.noiseSrc = ctx.createBufferSource();
    this.noiseSrc.buffer = this.noise;
    this.noiseSrc.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.Q.value = 0.8;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.05;

    this.oscMain.connect(this.gainMain).connect(this.mix);
    this.oscHalf.connect(this.gainHalf).connect(this.mix);
    this.oscCrank.connect(this.gainCrank).connect(this.mix);
    this.noiseSrc.connect(this.noiseFilter).connect(this.noiseGain).connect(this.mix);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDriveCurve();
    shaper.oversample = '2x';

    this.tone = ctx.createBiquadFilter();   // opens up as the revs and throttle rise
    this.tone.type = 'lowpass';
    this.tone.Q.value = 0.9;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.mix.connect(shaper).connect(this.tone).connect(this.engineGain).connect(this.out);

    // Echoes are fed from the engine sound
    this.echo.connect(ctx, this.engineGain, this.out);

    const now = ctx.currentTime;
    this.oscMain.start(now);
    this.oscHalf.start(now);
    this.oscCrank.start(now);
    this.noiseSrc.start(now);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  // Called every frame with the car's physics
  update(car, listenerPos) {
    if (!this.ctx) return;
    const s = this.spec;
    const t = this.ctx.currentTime;
    const rpm = car.rpm;
    const rev = clamp(rpm / s.redline, 0, 1);
    const firing = (rpm / 60) * (s.cylinders / 2);   // exhaust pulses per second
    const load = car.engineLoad;

    // Idle is a little lumpy; the lumpiness smooths out as the revs rise
    const lumpy = 1 - clamp((rpm - s.idleRpm) / 2500, 0, 1);
    const wobble = 1 + (Math.random() - 0.5) * 0.035 * lumpy;

    this.oscMain.frequency.setTargetAtTime(firing * wobble, t, 0.012);
    this.oscHalf.frequency.setTargetAtTime(firing / 2, t, 0.012);
    this.oscCrank.frequency.setTargetAtTime(rpm / 60, t, 0.012);
    this.gainHalf.gain.setTargetAtTime(0.12 + 0.18 * (1 - rev), t, 0.05);   // more burble low down

    this.noiseFilter.frequency.setTargetAtTime(clamp(firing * 4, 200, 4000), t, 0.03);
    this.noiseGain.gain.setTargetAtTime(0.03 + 0.2 * load * rev + 0.03 * rev, t, 0.04);

    // Brighter and louder under load, duller on the overrun
    this.tone.frequency.setTargetAtTime(350 + rpm * 0.3 + load * 2400, t, 0.04);
    this.mix.gain.setTargetAtTime(0.6 + 0.8 * load, t, 0.04);

    let volume = 0.16 + 0.12 * rev + 0.32 * load;
    if (car.shiftTimer > 0) volume *= 0.5;   // ignition cut during a shift
    if (car.limiter) volume *= 0.7;          // stutter on the rev limiter
    this.engineGain.gain.setTargetAtTime(volume, t, 0.02);

    this.echo.update(listenerPos);
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
      clackGain.gain.exponentialRampToValueAtTime(0.5, t + 0.003);
      clackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      clack.connect(band).connect(clackGain).connect(this.out);
      clack.start(t, Math.random());
      clack.stop(t + 0.1);

      thump.frequency.setValueAtTime(140, t);
      thump.frequency.exponentialRampToValueAtTime(55, t + 0.09);
      thumpGain.gain.setValueAtTime(0.45, t);
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
