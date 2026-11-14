// =====================================================================
// AI CARS: other Caterhams on the track, driven by the computer.
//
// Each one has its own driver with his own pace, his own habits and his
// own bad days: some brake a touch late, some lift early, some wander off
// the line, some are clumsy with the throttle, and every one of them now
// and then gets a corner wrong (too late on the brakes and runs wide,
// locks up, overcooks the exit). Their lap times are never quite the same
// twice.
//
// They drive with the same physics as your car (the same tyres, brakes,
// gearbox and damage) while they're near you. Far away, where you can't
// see them, they just move along the racing line at the pace they'd be
// doing, which costs almost nothing; when you get close again they become
// real cars again.
//
// The side panel's "AI cars" section: off / practice / race, how many,
// how many laps, and whether you can touch them.
//   Practice: they lap on their own, spread round the track.
//   Race: a grid on the start straight (you at the back), lights out, a
//   number of laps, positions and gaps on the screen, results at the end.
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

import * as THREE from 'three';
import { CarPhysics, CATERHAM } from './physics.js';

const DRIVERS = [
  { name: 'Hamid', colour: 0xc8202a, helmet: 0xffffff },
  { name: 'Lindqvist', colour: 0x1d4fbf, helmet: 0xffd400 },
  { name: 'Tan', colour: 0x1f8a3a, helmet: 0xffffff },
  { name: 'Moreau', colour: 0xf0f0ea, helmet: 0x1a1a1a },
  { name: 'Okafor', colour: 0xff7a00, helmet: 0x1d4fbf },
  { name: 'Novak', colour: 0x6b2c91, helmet: 0xe0e0e0 },
  { name: 'Sato', colour: 0xf2c400, helmet: 0xc8202a },
  { name: 'Rahman', colour: 0x101012, helmet: 0xff7a00 },
  { name: 'Costa', colour: 0x15a6b5, helmet: 0xffffff },
];
const SKY = { far: 250, farMobile: 150, hide: 650 };   // metres: real physics nearer than far; not drawn beyond hide
const CAR_R = 0.8;                                    // each car is three circles this size, front, middle, back
const CIRCLES = [-1.05, 0, 1.05];

// a smooth random wobble (for a driver wandering on the line, his pace
// coming and going): a few slow waves of random speed added together
const wobble = (seed) => {
  const f = [0.013, 0.031, 0.071].map((k, i) => ({ k: k * (0.7 + ((seed * (i + 3)) % 1) * 0.6), p: seed * 17.3 * (i + 1) }));
  return (s) => (Math.sin(s * f[0].k + f[0].p) * 0.55 + Math.sin(s * f[1].k + f[1].p) * 0.3 + Math.sin(s * f[2].k + f[2].p) * 0.15);
};
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const gauss = () => { let s = 0; for (let k = 0; k < 4; k++) s += Math.random(); return (s - 2) / 0.58; };

// ---------------------------------------------------------------------
// The AI car's look: a simple Caterham (body, nose, cycle wings, roll
// bar, screen, driver, four wheels), in the driver's colours
// ---------------------------------------------------------------------
function mergeGeos(geos) {
  const pos = [], nor = [], idx = [];
  let base = 0;
  for (const g of geos) {
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
const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
let SHARED = null;
function sharedParts() {
  if (SHARED) return SHARED;
  const R = CATERHAM.wheelRadius;
  const nose = new THREE.CylinderGeometry(0.2, 0.36, 1.05, 4, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).scale(1.15, 0.75, 1).translate(0, 0.5, 1.12);
  SHARED = {
    body: mergeGeos([
      bx(0.9, 0.42, 1.95, 0, 0.42, -0.35),               // the tub
      nose,                                               // the long nose
      bx(0.86, 0.05, 0.62, 0, 0.64, -0.98),                // rear deck
    ]),
    wings: mergeGeos([
      ...[1, -1].map((s) => new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.24, 14, 1, true, -1.2, 2.4).rotateZ(Math.PI / 2).translate(s * 0.68, 0.32, 1.13)),
      ...[1, -1].map((s) => bx(0.26, 0.04, 0.7, s * 0.6, 0.66, -1.12)),
    ]),
    black: mergeGeos([
      new THREE.TorusGeometry(0.33, 0.025, 6, 16, Math.PI).translate(0, 0.66, -0.98),   // roll bar
      bx(0.5, 0.24, 0.03, 0, 0.83, 0.3),                    // the screen frame (dark)
      bx(0.7, 0.06, 0.5, 0, 0.18, -1.55),                   // rear panel
      ...[1, -1].map((s) => bx(0.04, 0.04, 0.6, s * 0.4, 0.3, 1.13)),   // front suspension arms
    ]),
    lights: mergeGeos([1, -1].map((s) => new THREE.SphereGeometry(0.085, 10, 8).translate(s * 0.42, 0.58, 0.92))),
    helmet: new THREE.SphereGeometry(0.13, 14, 10).translate(0, 0.98, -0.55),
    shoulders: bx(0.42, 0.16, 0.22, 0, 0.8, -0.58),
    tyre: new THREE.CylinderGeometry(R, R, 0.2, 18).rotateZ(Math.PI / 2),
    rim: new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.205, 12).rotateZ(Math.PI / 2),
    mats: {
      black: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 }),
      tyre: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.9 }),
      rim: new THREE.MeshStandardMaterial({ color: 0xb7bcc2, roughness: 0.3, metalness: 0.85 }),
      lamp: new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.2, metalness: 0.6 }),
      suit: new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.85 }),
    },
  };
  return SHARED;
}
function buildAICar(driver) {
  const S = sharedParts();
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: driver.colour, roughness: 0.35, metalness: 0.25, transparent: true, opacity: 1 });
  const helmet = new THREE.MeshStandardMaterial({ color: driver.helmet, roughness: 0.3, transparent: true, opacity: 1 });
  const add = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; car.add(x); return x; };
  add(S.body, paint); add(S.wings, paint); add(S.black, S.mats.black); add(S.lights, S.mats.lamp);
  add(S.helmet, helmet); add(S.shoulders, S.mats.suit);
  const wheels = [[0.68, 1.13], [-0.68, 1.13], [0.68, -1.07], [-0.68, -1.07]].map(([x, z]) => {
    const steerer = new THREE.Group();
    steerer.position.set(x, CATERHAM.wheelRadius, z);
    car.add(steerer);
    const spin = new THREE.Group();
    steerer.add(spin);
    const t = new THREE.Mesh(S.tyre, S.mats.tyre); t.castShadow = true; spin.add(t);
    spin.add(new THREE.Mesh(S.rim, S.mats.rim));
    return { steerer, spin };
  });
  return { car, wheels, paint, helmet };
}

// ---------------------------------------------------------------------
// The field
// ---------------------------------------------------------------------
export class AIField {
  // racing: the racing line (racingline.js), with its points and speed plan
  // track: the centre line (sepang.line), for the track's width
  // start: { x, z, heading } the start line
  // hooks: the ground and surface functions the player's car uses
  // colliders: the walls, barriers and buildings
  // onPlacePlayer(x, z, heading): put the player's car somewhere (the grid)
  constructor(scene, { racing, track, start, hooks, colliders, isMobile = false, onPlacePlayer, sound }) {
    this.scene = scene;
    this.racing = racing;
    this.track = track;
    this.hooks = hooks;
    this.isMobile = isMobile;
    this.onPlacePlayer = onPlacePlayer;
    this.sound = sound;
    this.cars = [];
    this.mode = 'off';          // 'off', 'practice', 'race'
    this.count = 5;
    this.laps = 5;
    this.contact = true;
    this.holdPlayer = false;    // (on the grid, waiting for the lights)
    this.race = null;
    this.player = { lap: 0, s: 0, near: -1, last: 0 };
    const m = racing.pts.length;
    this.m = m;
    // where the start line is on the racing line
    let best = 0, bd = Infinity;
    for (let i = 0; i < m; i++) { const p = racing.pts[i]; const d = (p.x - start.x) ** 2 + (p.z - start.z) ** 2; if (d < bd) { bd = d; best = i; } }
    this.startIndex = best;
    // the walls, sorted into 10 m squares so each car only checks the ones near it
    this.grid = new Map();
    for (const c of colliders) {
      if (c.kind === 'tree' && c.maxX - c.minX < 0.5) continue;
      for (let gx = Math.floor(c.minX / 10); gx <= Math.floor(c.maxX / 10); gx++) {
        for (let gz = Math.floor(c.minZ / 10); gz <= Math.floor(c.maxZ / 10); gz++) {
          const k = gx * 100000 + gz;
          if (!this.grid.has(k)) this.grid.set(k, []);
          this.grid.get(k).push(c);
        }
      }
    }
    this.load();
    this.buildPanel();
    this.buildBoard();
    if (this.mode === 'practice') this.startPractice();   // (as you left it last time)
  }

  // --- settings (remembered between visits) ---
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('tracktester-ai') || '{}');
      if (['off', 'practice', 'race'].includes(s.mode)) this.mode = s.mode === 'race' ? 'off' : s.mode;
      if (s.count >= 1 && s.count <= 9) this.count = s.count;
      if (s.laps >= 1 && s.laps <= 20) this.laps = s.laps;
      if (typeof s.contact === 'boolean') this.contact = s.contact;
    } catch (e) { /* storage blocked */ }
  }
  save() {
    try { localStorage.setItem('tracktester-ai', JSON.stringify({ mode: this.mode, count: this.count, laps: this.laps, contact: this.contact })); } catch (e) { /* storage blocked */ }
  }

  // --- the side panel section ---
  buildPanel() {
    const box = document.createElement('div');
    box.className = 'tyre-box';
    box.innerHTML = `
      <label class="tw-row" for="ai-mode"><span>Mode</span></label>
      <select id="ai-mode"><option value="off">Off</option><option value="practice">Practice</option><option value="race">Race</option></select>
      <label class="tw-row" for="ai-count"><span>Cars</span><span class="tw-value ai-count-label"></span></label>
      <input id="ai-count" type="range" min="1" max="9" step="1">
      <label class="tw-row ai-laps-row" for="ai-laps"><span>Laps</span><span class="tw-value ai-laps-label"></span></label>
      <input id="ai-laps" class="ai-laps-row" type="range" min="1" max="20" step="1">
      <label class="tw-check"><input type="checkbox" class="ai-contact"> Contact (you can hit each other)</label>
      <button type="button" class="tyre-fresh ai-go">Start race</button>
      <span class="gb-note ai-note"></span>`;
    const q = (s) => box.querySelector(s);
    this.ui = { mode: q('#ai-mode'), count: q('#ai-count'), countLabel: q('.ai-count-label'), laps: q('#ai-laps'), lapsLabel: q('.ai-laps-label'), contact: q('.ai-contact'), go: q('.ai-go'), note: q('.ai-note'), lapRows: box.querySelectorAll('.ai-laps-row') };
    const letGo = (el) => { el.addEventListener('change', () => el.blur()); if (el.tagName !== 'SELECT') el.addEventListener('pointerup', () => el.blur()); };
    [this.ui.mode, this.ui.count, this.ui.laps, this.ui.contact].forEach(letGo);
    this.ui.mode.addEventListener('change', () => { this.setMode(this.ui.mode.value); });
    this.ui.count.addEventListener('input', () => { this.count = Number(this.ui.count.value); this.refreshPanel(); });
    this.ui.count.addEventListener('change', () => { this.save(); if (this.mode === 'practice') this.startPractice(); });
    this.ui.laps.addEventListener('input', () => { this.laps = Number(this.ui.laps.value); this.refreshPanel(); this.save(); });
    this.ui.contact.addEventListener('change', () => { this.contact = this.ui.contact.checked; this.save(); this.applyGhost(); });
    this.ui.go.addEventListener('click', () => { this.ui.go.blur(); this.startRace(); });
    const heading = document.createElement('div');
    heading.className = 'sp-heading';
    heading.textContent = 'AI cars';
    // into the side panel, after the track picker
    const tryInsert = () => {
      const panel = document.querySelector('#sidepanel .sp-panel');
      if (!panel) return false;
      const after = panel.children[1] || null;
      panel.insertBefore(box, after ? after.nextSibling : null);
      panel.insertBefore(heading, box);
      return true;
    };
    if (!tryInsert()) setTimeout(tryInsert, 0);
    this.refreshPanel();
  }
  refreshPanel() {
    const u = this.ui;
    u.mode.value = this.mode;
    u.count.value = String(this.count);
    u.countLabel.textContent = String(this.count);
    u.laps.value = String(this.laps);
    u.lapsLabel.textContent = String(this.laps);
    u.contact.checked = this.contact;
    const racing = this.mode === 'race';
    u.lapRows.forEach((el) => { el.style.display = racing ? '' : 'none'; });
    u.go.style.display = racing ? '' : 'none';
    u.go.textContent = this.race && !this.race.done ? 'Restart race' : 'Start race';
    u.note.textContent = this.mode === 'off' ? '' : this.mode === 'practice'
      ? 'They lap on their own, spread round the track.' : 'You start at the back of the grid. Wait for the lights.';
  }

  // --- the race board on screen: lap, position, the order and gaps ---
  buildBoard() {
    this.board = document.createElement('div');
    this.board.style.cssText = 'position:fixed;left:calc(10px + env(safe-area-inset-left));top:42%;min-width:150px;padding:6px 10px;border-radius:10px;background:rgba(14,16,19,0.62);color:#f2efe6;font:600 13px system-ui,sans-serif;pointer-events:none;display:none;z-index:14;font-variant-numeric:tabular-nums';
    document.body.appendChild(this.board);
    this.lights = document.createElement('div');
    this.lights.style.cssText = 'position:fixed;left:50%;top:16%;transform:translateX(-50%);display:none;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(10,10,10,0.8);z-index:25;pointer-events:none';
    this.lights.innerHTML = [0, 1, 2, 3, 4].map(() => '<div style="width:26px;height:26px;border-radius:50%;background:#2a1414"></div>').join('');
    document.body.appendChild(this.lights);
    this.banner = document.createElement('div');
    this.banner.style.cssText = 'position:fixed;left:50%;top:24%;transform:translateX(-50%);padding:12px 20px;border-radius:12px;background:rgba(14,16,19,0.85);color:#f2efe6;font:600 15px system-ui,sans-serif;display:none;z-index:25;white-space:pre;text-align:left;pointer-events:none';
    document.body.appendChild(this.banner);
  }

  setMode(mode) {
    this.mode = mode;
    this.save();
    this.race = null;
    this.holdPlayer = false;
    this.lights.style.display = 'none';
    this.banner.style.display = 'none';
    if (mode === 'off') this.clear();
    else if (mode === 'practice') this.startPractice();
    else this.clear();          // (a race starts with the button)
    this.refreshPanel();
  }

  clear() {
    for (const c of this.cars) { this.scene.remove(c.model.car); c.voice?.stop(); }
    this.cars = [];
  }

  // a fresh driver: his pace and his habits
  makeDriver(k) {
    const d = DRIVERS[k % DRIVERS.length];
    const skill = 0.9 + Math.random() * 0.075;            // share of the planned speed he carries
    return {
      ...d,
      skill,
      consistency: 0.4 + Math.random() * 0.6,             // 1 = very steady lap to lap
      brakeLate: (Math.random() - 0.4) * 3,               // points (2 m each) later (+) or earlier (-) than the plan
      wander: 0.15 + Math.random() * 0.55,                // metres he drifts off the line
      mistakes: 0.03 + Math.random() * 0.1,               // chance of getting each braking zone wrong
      throttle: 0.75 + Math.random() * 0.25,              // how smooth he is out of corners (1 = smooth)
      seed: Math.random(),
    };
  }
  addCar(k, index, lateral, speed) {
    const driver = this.makeDriver(k);
    const model = buildAICar(driver);
    this.scene.add(model.car);
    const physics = new CarPhysics(CATERHAM);
    physics.setTransmission('auto');
    physics.assists.abs = Math.random() < 0.3 ? 3 : 5;     // (some drivers lock up more)
    physics.assists.tcs = Math.random() < 0.35 ? 2 : 4;    // (and some spin the wheels more out of corners)
    for (const h of ['surfaceGrip', 'surfaceDrag', 'groundHeight', 'roadHeight', 'wearScale']) if (this.hooks[h]) physics[h] = this.hooks[h];
    const car = {
      driver, model, physics,
      full: false,                 // real physics now (near) or just following the line (far)
      near: index, lap: 0, s: 0, last: index, frac: 0,
      lateral, speed,              // (for following the line while far away)
      lapPace: driver.skill,
      mistake: null,               // the braking zone he's getting wrong, if any
      wide: 0,                     // how far he's run off his line (m)
      stuck: 0, finished: false, finishTime: 0,
      wob: wobble(driver.seed), steer: 0, spin: 0,
    };
    this.placeOnLine(car, index, lateral, speed);
    this.cars.push(car);
    this.applyGhost();
    return car;
  }
  // put a car on the line at a point, a little to one side, at a speed
  placeOnLine(car, index, lateral, speed) {
    const p = this.racing.pts[(index % this.m + this.m) % this.m];
    const P = car.physics;
    P.x = p.x + p.nx * lateral; P.z = p.z + p.nz * lateral;
    P.heading = Math.atan2(p.fx, p.fz);
    P.vx = speed; P.vy = 0; P.yawRate = 0; P.steer = 0;
    P.air = false;
    P.ground.synced = false;
    car.near = (index % this.m + this.m) % this.m;
    car.frac = 0;
    car.lateral = lateral; car.speed = speed;
  }

  startPractice() {
    this.clear();
    const m = this.m;
    for (let k = 0; k < this.count; k++) {
      const i = Math.round(this.startIndex + 60 + (k + 0.5) * (m / this.count)) % m;
      this.addCar(k, i, 0, this.racing.vPlan[i] * 0.85);
    }
  }

  // --- the race ---
  startRace() {
    if (this.mode !== 'race') return;
    this.clear();
    const m = this.m, pts = this.racing.pts;
    // the grid: two by two behind the line, 8 m apart, you at the back
    const slot = (k) => {
      const i = ((this.startIndex - 3 - 4 * k) % m + m) % m;
      const p = pts[i];
      const side = (k % 2 ? -1 : 1) * 1.8 - (p.off || 0);     // (either side of the track's middle)
      return { i, side, x: p.x + p.nx * side, z: p.z + p.nz * side, heading: Math.atan2(p.fx, p.fz) };
    };
    for (let k = 0; k < this.count; k++) { const g = slot(k); const c = this.addCar(k, g.i, g.side, 0); c.lap = -1; }   // (behind the line: lap 1 starts as they cross it)
    const me = slot(this.count);
    this.onPlacePlayer?.(me.x, me.z, me.heading);
    this.player = { lap: -1, s: 0, near: me.i, last: me.i, finished: false };
    this.race = { t: 0, phase: 'grid', lightsOut: 3.2 + Math.random() * 1.4, done: false, order: [] };
    this.holdPlayer = true;
    this.banner.style.display = 'none';
    this.refreshPanel();
  }

  applyGhost() {
    for (const c of this.cars) {
      const o = this.contact ? 1 : 0.45;
      c.model.paint.opacity = c.model.helmet.opacity = o;
      c.model.paint.depthWrite = c.model.helmet.depthWrite = o === 1;
    }
  }

  // where a point is on the line, searched near where it was last time
  nearest(x, z, near) {
    const pts = this.racing.pts, m = this.m;
    let best = near, bd = Infinity;
    const span = near < 0 ? m : 25;
    for (let k = -span; k <= span; k++) {
      const i = (((near < 0 ? 0 : near) + k) % m + m) % m;
      const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (near >= 0 && bd > 900) return this.nearest(x, z, -1);
    return best;
  }
  // count laps as a car passes the start line
  passLine(t, i) {
    const m = this.m, rel = (i - this.startIndex + m) % m, relLast = (t.last - this.startIndex + m) % m;
    if (relLast > m - 40 && rel < 40) t.lap++;
    else if (rel > m - 40 && relLast < 40) t.lap--;      // (backwards over it)
    t.last = i;
    t.s = rel;
  }

  // ---------------------------------------------------------------------
  // Every frame. player: the player's car physics; camera: where you're
  // looking from; playerMass: 560 for the car, much more for the tank
  // ---------------------------------------------------------------------
  update(dt, { player, camera, playerMass = 560, wetness = 0 }) {
    if (!this.cars.length && !this.race) return;
    const racing = this.racing, pts = racing.pts, m = this.m;
    // the player's place on the line (for the race order)
    const pi = this.player.near = this.nearest(player.x, player.z, this.player.near ?? -1);
    this.passLine(this.player, pi);
    // the race's lights
    const race = this.race;
    if (race) {
      race.t += dt;
      if (race.phase === 'grid') {
        const lit = Math.min(5, Math.floor(race.t / 0.6));
        this.lights.style.display = 'flex';
        [...this.lights.children].forEach((el, k) => { el.style.background = k < lit ? '#ff2a1a' : '#2a1414'; el.style.boxShadow = k < lit ? '0 0 12px #ff2a1a' : 'none'; });
        if (race.t >= race.lightsOut) {
          race.phase = 'racing'; race.start = race.t; this.holdPlayer = false;
          [...this.lights.children].forEach((el) => { el.style.background = '#2a1414'; el.style.boxShadow = 'none'; });
          setTimeout(() => { this.lights.style.display = 'none'; }, 900);
        }
      }
    }
    const holding = race && race.phase === 'grid';
    // which cars get real physics: the nearest few to the camera
    const maxFull = this.isMobile ? 3 : 9;
    const far = this.isMobile ? SKY.farMobile : SKY.far;
    const byDist = this.cars.map((c) => ({ c, d: Math.hypot(c.physics.x - camera.position.x, c.physics.z - camera.position.z) })).sort((a, b) => a.d - b.d);
    byDist.forEach(({ c, d }, k) => {
      const want = (d < far && k < maxFull) || holding;
      if (want && !c.full) {
        // coming close: a real car again, where the line-follower had it
        this.placeOnLine(c, c.near, c.lateral, c.speed);
      } else if (!want && c.full) {
        c.speed = Math.max(0, c.physics.vx);
        const p = pts[c.near];
        c.lateral = clamp((c.physics.x - p.x) * p.nx + (c.physics.z - p.z) * p.nz, -4, 4);
      }
      c.full = want;
      c.dist = d;
    });
    for (const c of this.cars) {
      if (c.full) this.drive(c, dt, holding, wetness);
      else this.glide(c, dt);
      this.passLine(c, c.near);
      if (race && race.phase === 'racing' && !c.finished && c.lap >= this.laps) { c.finished = true; c.finishTime = race.t - race.start; }
    }
    if (this.contact) this.touch(player, playerMass);
    for (const c of this.cars) this.pose(c, dt);
    this.voices(camera);
    this.updateBoard(player);
  }

  // A car far away: just moves along the line at the pace he'd be doing
  glide(c, dt) {
    const pts = this.racing.pts, m = this.m;
    const target = this.racing.vPlan[c.near] * c.lapPace;
    c.speed += clamp(target - c.speed, -9 * dt, 4 * dt);
    c.frac += Math.max(0, c.speed) * dt;
    while (c.frac >= (pts[c.near].ds || 2)) { c.frac -= pts[c.near].ds || 2; c.near = (c.near + 1) % m; }
    const p = pts[c.near], q = pts[(c.near + 1) % m], f = c.frac / (p.ds || 2);
    c.lateral *= 1 - Math.min(1, dt * 0.3);
    const P = c.physics;
    P.x = p.x + (q.x - p.x) * f + p.nx * c.lateral;
    P.z = p.z + (q.z - p.z) * f + p.nz * c.lateral;
    P.heading = Math.atan2(p.fx, p.fz);
    P.vx = c.speed; P.vy = 0; P.yawRate = 0;
    P.ground.y = this.hooks.groundHeight ? this.hooks.groundHeight(P.x, P.z) : 0;
    P.ground.slopeF = P.ground.slopeL = 0;
  }

  // A car near you: a driver at the wheel of a real car
  drive(c, dt, holding, wetness) {
    const P = c.physics, racing = this.racing, pts = racing.pts, m = this.m, D = c.driver;
    const prev = c.near;
    c.near = this.nearest(P.x, P.z, c.near);
    const v = P.vx;
    const p = pts[c.near];
    // a new lap: his pace for this one (never quite the same)
    if (c.near < prev - m / 2) c.lapPace = clamp(D.skill * (1 + gauss() * 0.012 * (1.2 - D.consistency)), 0.85, 0.985);
    // a new braking zone: does he get this one right?
    const bh = racing.brakeHard;
    if (bh[c.near] > 0 && bh[prev] === 0 && !c.mistake && Math.random() < D.mistakes * (1 + wetness)) {
      const kinds = ['late', 'late', 'early', 'wide', 'lock'];
      c.mistake = { kind: kinds[(Math.random() * kinds.length) | 0], left: 70, side: Math.sign(pts[(c.near + 25) % m].curve) || 1 };
    }
    // (a mistake lasts for that corner: about 140 m)
    if (c.mistake) { c.mistake.left -= (c.near - prev + m) % m; if (c.mistake.left <= 0 || c.mistake.left > 200) c.mistake = null; }
    const mk = c.mistake?.kind;
    // where he's aiming: a point ahead on the line (further the faster he's
    // going), off it by his wander, any overtaking move, and running wide
    const look = 6 + Math.max(0, v) * 0.42;
    let j = c.near, ahead = 0;
    while (ahead < look) { ahead += pts[j].ds || 2; j = (j + 1) % m; }
    const w = this.track[j] ? this.track[j].width / 2 - 1.1 : 4;
    if (mk === 'wide') c.wide += (c.mistake.side * 2.2 - c.wide) * Math.min(1, dt * 1.5);
    else c.wide *= 1 - Math.min(1, dt * 0.8);
    const wantLat = clamp(c.wob(p.s) * D.wander + (c.pass || 0) + c.wide, -w - (pts[j].off || 0), w - (pts[j].off || 0));
    const tx = pts[j].x + pts[j].nx * wantLat - P.x, tz = pts[j].z + pts[j].nz * wantLat - P.z;
    const fx = Math.sin(P.heading), fz = Math.cos(P.heading), lx = Math.cos(P.heading), lz = -Math.sin(P.heading);
    const alpha = Math.atan2(tx * lx + tz * lz, tx * fx + tz * fz);
    const wheel = Math.atan(2 * 2.2 * Math.sin(alpha) / Math.max(4, Math.hypot(tx, tz)));
    const limit = CATERHAM.maxSteer / (1 + Math.abs(v) / 14);
    // (catching a slide: steer into it)
    const slide = Math.atan2(P.vy, Math.max(3, Math.abs(v)));
    let steer = clamp((wheel + slide * 0.6) / limit, -1, 1);
    c.steer += (steer - c.steer) * Math.min(1, dt * 12);
    // how fast: the plan's speed a little ahead (when he'd react), at his pace
    let lead = Math.round((Math.max(0, v) * 0.32 + 3) / 2 + D.brakeLate * -1);
    if (mk === 'late') lead -= 5;
    let target = racing.vPlan[(c.near + Math.max(1, lead)) % m] * c.lapPace;
    if (mk === 'late') target *= 1.05;
    if (mk === 'early') target *= 0.9;
    // don't drive into the car ahead: follow it, or pull out to pass
    c.pass = (c.pass || 0) * (1 - Math.min(1, dt * 0.5));
    for (const o of this.others(c)) {
      const gap = o.ahead;
      if (gap <= 0 || gap > 30 || Math.abs(o.lat - (wantLat)) > 2.4) continue;
      if (v > o.v + 0.5) {
        // room on the other side? pull out
        const side = o.lat > 0 ? -1 : 1;
        c.pass = clamp((c.pass || 0) + side * dt * 2, -2.5, 2.5);
        if (gap < 12) target = Math.min(target, o.v + (gap - 6) * 0.6);
      }
    }
    let throttle = 0, brake = 0;
    const err = target - v;
    if (err > 0) throttle = clamp(err * 0.5 + 0.15, 0, 1) * (Math.abs(P.vy) > 1.5 ? D.throttle * 0.6 : 1);
    else if (err < -0.6) brake = clamp(-err * 0.28, 0, 1);
    if (mk === 'lock' && bh[c.near] > 0.3) brake = 1;
    if (holding) { throttle = 0; brake = 1; }
    // stuck (spun, in the gravel, nose in a wall): after a while, back on
    // the track (only when you're not watching closely)
    if (!holding && Math.abs(v) < 1.5) c.stuck += dt; else c.stuck = Math.max(0, c.stuck - dt);
    if (c.stuck > 5 && c.dist > 25) {
      c.stuck = 0;
      this.placeOnLine(c, c.near, 0, 0);
      return;
    }
    const controls = { throttle, brake, steer: c.steer, handbrake: false, clutch: false, horn: false };
    const steps = Math.min(4, Math.max(1, Math.ceil(Math.abs(v) * dt / 0.3)));
    for (let k = 0; k < steps; k++) {
      P.update(controls, dt / steps);
      this.walls(c);
    }
    P.events.length = 0;
    P.trackWetness = wetness;
    c.brakeLight = brake > 0.05;
  }

  // the other cars as he sees them: how far ahead along the line, how far to the side, how fast
  others(c) {
    const out = [];
    const pts = this.racing.pts, m = this.m;
    for (const o of this.cars) {
      if (o === c) continue;
      let ahead = pts[o.near].s - pts[c.near].s;
      if (ahead < -this.racing.length / 2) ahead += this.racing.length;
      if (ahead > this.racing.length / 2) ahead -= this.racing.length;
      const p = pts[o.near];
      out.push({ ahead, lat: (o.physics.x - p.x) * p.nx + (o.physics.z - p.z) * p.nz, v: o.physics.vx });
    }
    return out;
  }

  // walls and barriers: pushed back out, slowed, damaged; the barrier dents
  walls(c) {
    const P = c.physics;
    const fx = Math.sin(P.heading), fz = Math.cos(P.heading);
    for (const off of [-1.3, 1.3]) {
      const px = P.x + fx * off, pz = P.z + fz * off;
      const list = this.grid.get(Math.floor(px / 10) * 100000 + Math.floor(pz / 10));
      if (!list) continue;
      for (const w of list) {
        if (px < w.minX - 0.7 || px > w.maxX + 0.7 || pz < w.minZ - 0.7 || pz > w.maxZ + 0.7) continue;
        if (w.kind === 'bollard') { w.hit?.({ x: px, z: pz }, { x: -fx, z: -fz }, Math.abs(P.vx)); continue; }
        // push out the shortest way
        const dl = px - (w.minX - 0.7), dr = (w.maxX + 0.7) - px, dd = pz - (w.minZ - 0.7), du = (w.maxZ + 0.7) - pz;
        const mn = Math.min(dl, dr, dd, du);
        let nx = 0, nz = 0;
        if (mn === dl) nx = -1; else if (mn === dr) nx = 1; else if (mn === dd) nz = -1; else nz = 1;
        P.x += nx * mn; P.z += nz * mn;
        const lx = Math.cos(P.heading), lz = -Math.sin(P.heading);
        const vxw = fx * P.vx + lx * P.vy, vzw = fz * P.vx + lz * P.vy;
        const vn = vxw * nx + vzw * nz;
        if (vn >= 0) continue;
        const nvx = vxw - 1.3 * vn * nx, nvz = vzw - 1.3 * vn * nz;
        P.vx = (nvx * fx + nvz * fz) * 0.8; P.vy = (nvx * lx + nvz * lz) * 0.8;
        P.yawRate += (Math.random() - 0.5) * Math.min(2, -vn * 0.15);
        const nf = nx * fx + nz * fz, nl = nx * lx + nz * lz;
        const zone = nf < -0.6 ? 'front' : nf > 0.6 ? 'rear' : nl > 0 ? 'right' : 'left';
        if (-vn > 2.5) {
          P.crashHit({ zone, speed: -vn, along: off, across: 0 });
          w.hit?.({ x: px, z: pz }, { x: nx, z: nz }, -vn);
        }
      }
    }
  }

  // cars touching: pushed apart, bounced off each other, spun, damaged
  touch(player, playerMass) {
    const bodies = this.cars.filter((c) => c.full).map((c) => ({ P: c.physics, mass: 560, ai: true }));
    bodies.push({ P: player, mass: playerMass, ai: false });
    for (let a = 0; a < bodies.length; a++) {
      for (let b = a + 1; b < bodies.length; b++) {
        const A = bodies[a], B = bodies[b];
        if ((A.P.x - B.P.x) ** 2 + (A.P.z - B.P.z) ** 2 > 25) continue;
        this.collidePair(A, B);
      }
    }
  }
  collidePair(A, B) {
    const pa = A.P, pb = B.P;
    const fa = [Math.sin(pa.heading), Math.cos(pa.heading)], fb = [Math.sin(pb.heading), Math.cos(pb.heading)];
    let best = null;
    for (const oa of CIRCLES) for (const ob of CIRCLES) {
      const ax = pa.x + fa[0] * oa, az = pa.z + fa[1] * oa, bxp = pb.x + fb[0] * ob, bzp = pb.z + fb[1] * ob;
      const dx = ax - bxp, dz = az - bzp, d = Math.hypot(dx, dz);
      const depth = 2 * CAR_R - d;
      if (depth > 0 && (!best || depth > best.depth)) best = { depth, nx: dx / (d || 1), nz: dz / (d || 1), px: (ax + bxp) / 2, pz: (az + bzp) / 2 };
    }
    if (!best) return;
    const { nx, nz } = best;
    const wa = A.mass, wb = B.mass, inv = 1 / wa + 1 / wb;
    // pushed apart (the heavier one moves less)
    pa.x += nx * best.depth * (1 / wa) / inv; pa.z += nz * best.depth * (1 / wa) / inv;
    pb.x -= nx * best.depth * (1 / wb) / inv; pb.z -= nz * best.depth * (1 / wb) / inv;
    const world = (P) => { const fx = Math.sin(P.heading), fz = Math.cos(P.heading), lx = Math.cos(P.heading), lz = -Math.sin(P.heading); return { fx, fz, lx, lz, vx: fx * P.vx + lx * P.vy, vz: fz * P.vx + lz * P.vy }; };
    const WA = world(pa), WB = world(pb);
    const vn = (WA.vx - WB.vx) * nx + (WA.vz - WB.vz) * nz;
    if (vn >= 0) return;
    const J = -(1 + 0.25) * vn / inv;
    const set = (P, W, sign, mass, body) => {
      const vx = W.vx + sign * J * nx / mass, vz = W.vz + sign * J * nz / mass;
      P.vx = vx * W.fx + vz * W.fz; P.vy = vx * W.lx + vz * W.lz;
      // a knock off-centre spins it
      const rx = best.px - P.x, rz = best.pz - P.z;
      P.yawRate += sign * (rx * nz - rz * nx) * J / (mass * 1.2) * 0.6;
      const hit = Math.abs(J / mass);
      if (hit > 2.5 && body.mass < 2000) {
        const nf = (-sign * nx) * W.fx + (-sign * nz) * W.fz, nl = (-sign * nx) * W.lx + (-sign * nz) * W.lz;
        const zone = nf > 0.6 ? 'front' : nf < -0.6 ? 'rear' : nl > 0 ? 'left' : 'right';
        P.crashHit?.({ zone, speed: hit, along: rx * W.fx + rz * W.fz, across: rx * W.lx + rz * W.lz });
      }
    };
    set(pa, WA, 1, wa, A);
    set(pb, WB, -1, wb, B);
  }

  // where the car is drawn
  pose(c, dt) {
    const P = c.physics, M = c.model;
    const show = c.dist < SKY.hide;
    M.car.visible = show;
    if (!show) return;
    const G = P.ground;
    if (c.full && P.air) {
      M.car.position.set(P.pose.x, P.pose.y, P.pose.z);
      M.car.quaternion.set(P.pose.q[0], P.pose.q[1], P.pose.q[2], P.pose.q[3]);
    } else {
      M.car.position.set(P.x, G.y, P.z);
      M.car.rotation.set(-Math.atan(G.slopeF || 0), P.heading, Math.atan(G.slopeL || 0), 'YXZ');
    }
    c.spin += (Math.max(-80, Math.min(80, P.vx / CATERHAM.wheelRadius))) * dt;
    M.wheels.forEach((w, k) => {
      w.spin.rotation.x = c.spin;
      if (k < 2) w.steerer.rotation.y = c.full ? P.steer : 0;
    });
  }

  // the engines of the nearest two cars: a rough, revving buzz from where
  // each car is (louder the closer)
  voices(camera) {
    const ctx = this.sound?.ctx;
    if (!ctx || !this.sound.master) return;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const near = this.cars.filter((c) => c.dist < 120).sort((a, b) => a.dist - b.dist).slice(0, 2);
    for (const c of this.cars) {
      const want = near.includes(c);
      if (want && !c.voice) {
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
        o1.type = 'sawtooth'; o2.type = 'square';
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 2;
        const g = ctx.createGain(); g.gain.value = 0;
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const g2 = ctx.createGain(); g2.gain.value = 0.35;
        o1.connect(f); o2.connect(g2).connect(f); f.connect(g);
        if (pan) g.connect(pan).connect(this.sound.master); else g.connect(this.sound.master);
        o1.start(); o2.start();
        c.voice = { o1, o2, f, g, pan, stop: () => { try { o1.stop(); o2.stop(); g.disconnect(); } catch (e) { /* already stopped */ } } };
      } else if (!want && c.voice) { c.voice.stop(); c.voice = null; }
      if (!c.voice) continue;
      const rpm = c.full ? (c.physics.rpm || 1000) : 2500 + c.speed * 90;
      const fire = rpm / 60 * 2;                           // four cylinders: two firings a turn
      const t = ctx.currentTime;
      c.voice.o1.frequency.setTargetAtTime(fire, t, 0.03);
      c.voice.o2.frequency.setTargetAtTime(fire * 0.5, t, 0.03);
      c.voice.f.frequency.setTargetAtTime(500 + rpm * 0.25, t, 0.05);
      c.voice.g.gain.setTargetAtTime(0.16 / (1 + c.dist / 7), t, 0.05);
      if (c.voice.pan) {
        const dx = c.physics.x - camera.position.x, dz = c.physics.z - camera.position.z, d = Math.hypot(dx, dz) || 1;
        c.voice.pan.pan.setTargetAtTime(clamp((dx * right.x + dz * right.z) / d, -1, 1) * 0.8, t, 0.05);
      }
    }
  }

  // positions, laps and gaps (race only), and the results at the end
  updateBoard(player) {
    const race = this.race;
    if (!race || race.phase === 'grid') { this.board.style.display = 'none'; return; }
    const L = this.racing.length, pts = this.racing.pts;
    const progress = (t, near) => t.lap * L + ((pts[near].s - pts[this.startIndex].s + L) % L);
    const field = this.cars.map((c) => ({ name: c.driver.name, colour: c.driver.colour, p: c.finished ? 1e9 - c.finishTime : progress(c, c.near), lap: c.lap, me: false }));
    field.push({ name: 'You', colour: 0xffd76a, p: this.player.finished ? 1e9 - this.player.finishTime : progress(this.player, this.player.near), lap: this.player.lap, me: true });
    field.sort((a, b) => b.p - a.p);
    const myPos = field.findIndex((f) => f.me) + 1;
    const lap = Math.min(this.laps, Math.max(1, this.player.lap + 1));
    // you finish when you've done the laps
    if (!this.player.finished && this.player.lap >= this.laps) {
      this.player.finished = true;
      this.player.finishTime = race.t - race.start;
      race.done = true;
      this.banner.textContent = `FINISHED  P${myPos} of ${field.length}\n\n` + field.map((f, k) => `${String(k + 1).padStart(2)}.  ${f.name}`).join('\n');
      this.banner.style.display = 'block';
      setTimeout(() => { this.banner.style.display = 'none'; }, 9000);
      this.refreshPanel();
    }
    const lead = field[0].p;
    const hex = (c) => '#' + c.toString(16).padStart(6, '0');
    const rows = field.slice(0, 10).map((f, k) => {
      const gap = k === 0 ? '' : f.p > 1e8 ? '' : `+${Math.max(0, (lead > 1e8 ? 0 : lead - f.p) / 45).toFixed(1)}`;
      return `<div style="display:flex;gap:6px;align-items:center;${f.me ? 'color:#ffd76a' : ''}"><span style="width:16px;text-align:right">${k + 1}</span><span style="width:8px;height:8px;border-radius:2px;background:${hex(f.colour)}"></span><span style="flex:1">${f.name}</span><span style="opacity:0.7">${gap}</span></div>`;
    }).join('');
    this.board.innerHTML = `<div style="font-size:12px;letter-spacing:0.08em;opacity:0.8;margin-bottom:3px">${this.player.finished ? 'FINISHED' : `LAP ${lap}/${this.laps}`} · P${myPos}/${field.length}</div>${rows}`;
    this.board.style.display = 'block';
  }
}
