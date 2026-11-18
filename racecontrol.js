// =====================================================================
// RACE CONTROL: what happens when something goes wrong out on the track.
//   - The safety car (a silver long-bonnet GT with a light bar, a tribute,
//     no badges): out of the pit exit after a big incident in a race; the
//     field queues up behind it, no overtaking, until the track's clear,
//     then "SAFETY CAR IN THIS LAP" and it peels off into the pit lane.
//   - The virtual safety car (VSC): for a smaller incident, everyone held
//     to a slower pace everywhere, no safety car needed.
//   - The red flag: a car blown up, or wreckage burning on the track:
//     the race stops, and restarts from the grid in the order they were.
//   - The recovery crane: a compact 6.5 tonne wheeled crane, the kind used
//     to lift cars clear of the barriers. In memory of Jules Bianchi: the
//     crane only ever works under double yellows, a safety car or a VSC,
//     and double yellows mean a speed limit in that zone.
//   - The ambulance (a tall, boxy high-roof van, a tribute): out to any
//     big crash, waits beside the car, then carries on round.
//   - Fire marshals: run from the nearest post with extinguishers to a
//     burning car, wreck or engine block, put it out, and walk back.
//   - Sweepers: bits of car left lying on the track get picked up.
//   - The rules: overtaking under yellow or the safety car, speeding under
//     the VSC or double yellows, ignoring blue flags: time penalties.
// The game (rendering.js) tells it what's happening every frame; the
// computer drivers (ai.js) ask it how fast they may go (rules()).
// =====================================================================

import * as THREE from 'three';
import { Person, makeExtinguisher } from './pits.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

const std = (color, rough = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const boxAt = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function addMesh(parent, geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; parent.add(m); return m; }
function wheels(parent, mat, rimMat, positions, r, w) {
  const geo = new THREE.CylinderGeometry(r, r, w, 18).rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.6, r * 0.6, w + 0.01, 14).rotateZ(Math.PI / 2);
  for (const [x, z] of positions) { addMesh(parent, geo.clone().translate(x, r, z), mat); addMesh(parent, rim.clone().translate(x, r, z), rimMat, false); }
}
function label(text, bg, fg, w = 256, h = 48) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = `bold ${Math.round(h * 0.62)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, transparent: bg === 'transparent' });
}

// --- THE SAFETY CAR: long bonnet, cab set well back, a fastback, a big
// rear wing, and the light bar on the roof (orange flashing, green at the
// back for the cars to pass when it's time) ---
function buildSafetyCar() {
  const g = new THREE.Group();
  const silver = std(0xb9bec4, 0.28, { metalness: 0.75 }), black = std(0x15161a, 0.5), glass = std(0x1d2733, 0.1, { metalness: 0.4 });
  const tyre = std(0x161616, 0.85), rim = std(0x2a2c30, 0.3, { metalness: 0.8 });
  addMesh(g, boxAt(1.95, 0.42, 4.6, 0, 0.5, 0), silver);                    // body
  addMesh(g, boxAt(1.85, 0.16, 1.9, 0, 0.78, 1.15), silver);               // the long bonnet, rising to the screen
  addMesh(g, boxAt(1.6, 0.42, 1.55, 0, 0.92, -0.45), glass);               // the cab (glass all round)
  addMesh(g, boxAt(1.62, 0.08, 1.2, 0, 1.15, -0.5), silver);               // roof
  addMesh(g, boxAt(1.7, 0.3, 1.3, 0, 0.82, -1.55).rotateX(0), silver);     // fastback
  addMesh(g, boxAt(1.98, 0.12, 0.5, 0, 0.32, 2.35), black);                // splitter
  addMesh(g, boxAt(1.9, 0.05, 0.42, 0, 1.25, -2.15), black);               // the big rear wing
  for (const sx of [-0.75, 0.75]) addMesh(g, boxAt(0.05, 0.38, 0.2, sx, 1.03, -2.1), black);
  // lights: headlights, tail lights
  for (const sx of [-0.68, 0.68]) { addMesh(g, boxAt(0.36, 0.08, 0.05, sx, 0.66, 2.3), std(0xffffff, 0.2, { emissive: 0xffffff, emissiveIntensity: 0.8 }), false); addMesh(g, boxAt(0.4, 0.07, 0.05, sx, 0.68, -2.3), std(0xff2a1a, 0.3, { emissive: 0xff1a0a, emissiveIntensity: 1 }), false); }
  // the light bar: three lamps each side across the roof
  const amber = std(0x3a2a08, 0.3, { emissive: 0x000000 }), green = std(0x0a2a12, 0.3, { emissive: 0x000000 });
  addMesh(g, boxAt(1.3, 0.09, 0.22, 0, 1.24, -0.45), black);
  const lampsA = [], lampsB = [];
  for (let k = 0; k < 4; k++) { const m = addMesh(g, boxAt(0.22, 0.08, 0.16, -0.45 + k * 0.3, 1.32, -0.38), k % 2 ? amber.clone() : amber.clone(), false); (k % 2 ? lampsB : lampsA).push(m.material); }
  const greenLamp = addMesh(g, boxAt(0.6, 0.06, 0.08, 0, 1.32, -0.6), green, false).material;
  // SAFETY CAR down each side
  const words = label('SAFETY CAR', 'transparent', '#16181c', 512, 64);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.32), words); p.position.set(sx * 0.982, 0.52, -0.1); p.rotation.y = sx * Math.PI / 2; g.add(p); }
  wheels(g, tyre, rim, [[-0.88, 1.45], [0.88, 1.45], [-0.88, -1.35], [0.88, -1.35]], 0.34, 0.3);
  return { group: g, flash: (t, on) => {
    const a = on && Math.floor(t * 4) % 2 === 0, b = on && !a;
    for (const m of lampsA) m.emissive.setHex(a ? 0xffa010 : 0x000000);
    for (const m of lampsB) m.emissive.setHex(b ? 0xffa010 : 0x000000);
  }, green: (on) => greenLamp.emissive.setHex(on ? 0x20ff60 : 0x000000) };
}

// --- THE AMBULANCE: a tall boxy high-roof van, short sloping nose, white
// with a red stripe, red beacons, AMBULANCE on the sides ---
function buildAmbulance() {
  const g = new THREE.Group();
  const white = std(0xf2f2ee, 0.45), red = std(0xc81e1e, 0.45), black = std(0x15161a, 0.5), glass = std(0x1c2633, 0.1, { metalness: 0.4 });
  const tyre = std(0x161616, 0.85), rim = std(0xb8bcc2, 0.35, { metalness: 0.7 });
  addMesh(g, boxAt(1.88, 2.05, 4.1, 0, 1.38, -0.45), white);               // the high box body
  addMesh(g, boxAt(1.86, 0.95, 0.75, 0, 0.83, 1.95), white);               // the short nose
  addMesh(g, boxAt(1.78, 0.62, 0.08, 0, 1.55, 1.62).rotateX(-0.22), glass); // windscreen
  addMesh(g, boxAt(1.9, 0.22, 4.12, 0, 1.15, -0.45), red);                 // the stripe
  addMesh(g, boxAt(1.9, 0.22, 0.8, 0, 0.95, 1.95), red);
  for (const sx of [-0.951, 0.951]) addMesh(g, boxAt(0.02, 0.45, 0.95, sx, 1.65, 1.15), glass, false);   // cab windows
  addMesh(g, boxAt(1.9, 0.18, 0.2, 0, 0.42, 2.34), black);                 // bumper
  const beacons = [];
  for (const sx of [-0.6, 0.6]) beacons.push(addMesh(g, boxAt(0.4, 0.12, 0.22, sx, 2.47, 1.3), std(0x3a0808, 0.3, { emissive: 0x000000 }), false).material);
  const words = label('AMBULANCE', 'transparent', '#c81e1e', 512, 64);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.36), words); p.position.set(sx * 0.945, 1.75, -0.7); p.rotation.y = sx * Math.PI / 2; g.add(p); }
  wheels(g, tyre, rim, [[-0.8, 1.35], [0.8, 1.35], [-0.8, -1.6], [0.8, -1.6]], 0.34, 0.24);
  return { group: g, flash: (t, on) => { beacons.forEach((m, k) => m.emissive.setHex(on && (Math.floor(t * 5) + k) % 2 ? 0xff1a1a : 0x000000)); } };
}

// --- THE RECOVERY CRANE: a compact wheeled crane, about 6.5 tonnes:
// a low yellow chassis on four big wheels, the cab off to one side, a
// turntable and a short telescopic boom with a hook, outriggers, and an
// amber beacon ---
function buildCrane() {
  const g = new THREE.Group();
  const yellow = std(0xe8b419, 0.5), dark = std(0x26282c, 0.5), glass = std(0x1d2733, 0.1, { metalness: 0.4 }), steel = std(0x9ea2a8, 0.35, { metalness: 0.8 });
  const tyre = std(0x161616, 0.85), rim = std(0xe8b419, 0.5);
  addMesh(g, boxAt(2.2, 0.75, 4.6, 0, 1.0, 0), yellow);                    // chassis
  addMesh(g, boxAt(0.95, 1.3, 1.25, -0.55, 2.0, 1.4), yellow);             // cab, off to the left
  addMesh(g, boxAt(0.97, 0.7, 1.0, -0.55, 2.2, 1.5), glass, false);
  addMesh(g, boxAt(2.4, 0.18, 0.4, 0, 0.6, 2.1), dark);                    // outriggers
  addMesh(g, boxAt(2.4, 0.18, 0.4, 0, 0.6, -2.1), dark);
  const turntable = new THREE.Group(); turntable.position.set(0.45, 1.45, -0.9); g.add(turntable);
  addMesh(turntable, new THREE.CylinderGeometry(0.7, 0.75, 0.35, 16).translate(0, 0.17, 0), dark);
  const boom = new THREE.Group(); boom.position.set(0, 0.5, 0); turntable.add(boom);
  addMesh(boom, boxAt(0.42, 0.45, 4.2, 0, 0, 2.0), yellow);                 // the boom (pointing forward, along +z)
  addMesh(boom, boxAt(0.32, 0.35, 1.4, 0, 0, 4.6), yellow);                 // its telescopic end
  const hookAt = new THREE.Group(); hookAt.position.set(0, -0.1, 5.25); boom.add(hookAt);
  const cable = addMesh(hookAt, new THREE.CylinderGeometry(0.015, 0.015, 1, 6).translate(0, -0.5, 0), steel, false);
  const hook = new THREE.Group(); hookAt.add(hook);
  addMesh(hook, boxAt(0.25, 0.3, 0.25, 0, -0.15, 0), dark);
  const beacon = addMesh(g, new THREE.CylinderGeometry(0.1, 0.1, 0.16, 10).translate(-0.55, 2.75, 1.4), std(0x3a2a08, 0.3, { emissive: 0x000000 }), false).material;
  wheels(g, tyre, rim, [[-1.0, 1.55], [1.0, 1.55], [-1.0, -1.55], [1.0, -1.55]], 0.62, 0.48);
  return { group: g, turntable, boom, hookAt, cable, hook, flash: (t, on) => beacon.emissive.setHex(on && Math.floor(t * 3) % 2 ? 0xffa010 : 0x000000),
    // how far the hook hangs (m below the boom's end)
    setDrop(d) { cable.scale.y = Math.max(0.05, d); hook.position.y = -d; } };
}

export class RaceControl {
  // ctx: line (the track's centre line, 2 m apart), trackside, aiField,
  // groundAt(x, z), isMobile, pit (the pit lane's layout), hooks:
  //   toast(text), penalty(sec, why), extinguish(kind) ('car' | 'wreck' |
  //   'block'), removeDebris(obj), recoverPlayer(), playerModel()
  constructor(scene, { line, trackside, aiField, groundAt, hooks = {}, isMobile = false, pit }) {
    this.scene = scene; this.line = line; this.m = line.length; this.trackside = trackside;
    this.ai = aiField; this.groundAt = groundAt; this.hooks = hooks; this.isMobile = isMobile; this.pit = pit;
    this.phase = 'green';            // green | vsc | sc | red
    this.t = 0;
    this.phaseT = 0;
    this.crane = null; this.ambulance = null; this.sc = null;
    this.runners = [];               // fire marshals and sweepers out on the track
    this.jobs = new Set();           // what's being dealt with (so nothing's done twice)
    this.penaltyState = { overtakeOrder: null, vscOver: 0, vscWarn: 0, blueT: 0, blueCalm: 0, dyOver: 0 };
    this.mats = {
      suits: [std(0xff7a12, 0.75)], helmet: std(0xf2f2ee, 0.5), visor: std(0x111418, 0.1, { metalness: 0.6 }),
      glove: std(0x2a2c30, 0.8), boot: std(0x111111, 0.8), black: std(0x151515, 0.7), red: std(0xc81e14, 0.4),
    };
    // (the speed a car can take each bit of the track at, for the safety car)
    this.vMax = new Float32Array(this.m);
    for (let i = 0; i < this.m; i++) {
      const a = line[(i - 6 + this.m) % this.m], b = line[i], c = line[(i + 6) % this.m];
      const h1 = Math.atan2(b.x - a.x, b.z - a.z), h2 = Math.atan2(c.x - b.x, c.z - b.z);
      let d = Math.abs(Math.atan2(Math.sin(h2 - h1), Math.cos(h2 - h1)));
      const R = d > 1e-4 ? 12 / d : 1e4;
      this.vMax[i] = Math.min(42, Math.sqrt(1.15 * 9.81 * R));
    }
    // where the pit exit joins the track, and where the entry leaves it
    this.exitI = trackside.nearestLine(10, pit.exitZ + 10, 80);
    this.entryI = trackside.nearestLine(10, pit.entryZ - 10, 80);
    // the racing line's points by marshal sector (for the computer drivers)
    const pts = aiField.racing.pts;
    this.sectorOfPt = new Int16Array(pts.length);
    for (let k = 0; k < pts.length; k++) { const i = trackside.nearestLine(pts[k].x, pts[k].z, 60); this.sectorOfPt[k] = i >= 0 ? trackside.sectorOf(i) : 0; }
    aiField.rules = this;            // (ai.js asks rules: cap(), noPass(), moveOver())
  }

  // ---- for the computer drivers ----
  // the fastest he may go at racing-line point i (Infinity: as fast as he likes)
  cap(c, i, plan) {
    const race = this.ai.race;
    if (!race || race.phase !== 'racing') return Infinity;
    let cap = Infinity;
    if (this.phase === 'red') cap = 20;
    if (this.phase === 'vsc') cap = plan * 0.62;
    if (this.phase === 'sc' && this.sc) {
      // behind the safety car: hold station behind it
      const gap = this.gapAhead(c.physics.x, c.physics.z, c.near, this.sc.x, this.sc.z);
      if (gap >= 0 && gap < 120) cap = Math.min(cap, Math.max(6, this.sc.v + (gap - 18) * 0.45));
      cap = Math.min(cap, plan * 0.7);
    }
    const f = this.trackside.posts[this.sectorOfPt[i]]?.flag;
    if (f === 'yellow') cap = Math.min(cap, plan * 0.9);
    if (f === 'yellow2') cap = Math.min(cap, plan * 0.7, 26);
    return cap;
  }
  noPass(i) {
    if (this.phase !== 'green') return true;
    const f = this.trackside.posts[this.sectorOfPt[i]]?.flag;
    return f === 'yellow' || f === 'yellow2';
  }
  // a car about to be lapped by you: over to one side, and a little off the pace
  moveOver(c) {
    const P = this.playerRef;
    if (!P || !this.ai.race || this.ai.race.phase !== 'racing') return 0;
    const ahead = this.gapAhead(P.x, P.z, this.ai.player.near, c.physics.x, c.physics.z);
    if (ahead < 0 || ahead > 60) return 0;
    if (this.ai.player.lap <= c.lap) return 0;
    const p = this.ai.racing.pts[c.near];
    const side = ((P.x - p.x) * p.nx + (P.z - p.z) * p.nz) > 0 ? -1 : 1;
    return side * 3;
  }
  // how far ahead along the racing line (x2, z2) is from a car at (x1, z1)
  gapAhead(x1, z1, near1, x2, z2) {
    const pts = this.ai.racing.pts, m = pts.length;
    const n2 = this.ai.nearest(x2, z2, near1);
    const k = (n2 - near1 + m) % m;
    return k > m / 2 ? -1 : k * (pts[near1].ds || 2);
  }

  // ---- a big one: called by the game (a car going up) ----
  bigIncident(kind, at) {
    const race = this.ai.race;
    if (race && race.phase === 'racing') this.setPhase('red');
    this.sendAmbulance(at);
  }

  setPhase(p) {
    if (p === this.phase) return;
    const was = this.phase;
    this.phase = p; this.phaseT = 0;
    const H = this.hooks;
    if (p === 'sc') { H.toast?.('SAFETY CAR DEPLOYED'); this.sendSafetyCar(); }
    if (p === 'vsc') H.toast?.('VIRTUAL SAFETY CAR: SLOW DOWN');
    if (p === 'red') H.toast?.('RED FLAG: SESSION STOPPED. BACK TO THE PITS SLOWLY');
    if (p === 'green' && was !== 'green') H.toast?.(was === 'red' ? 'RACE RESUMING' : 'GREEN FLAG: RACING');
  }

  // ---- vehicles out on the track ----
  placeOnLine(obj, i, lat) {
    const L = this.line, p = L[((Math.floor(i) % this.m) + this.m) % this.m];
    const x = p.x + p.lx * lat, z = p.z + p.lz * lat;
    obj.group.position.set(x, this.groundAt(x, z), z);
    obj.group.rotation.y = p.heading;
    obj.x = x; obj.z = z;
  }
  sendSafetyCar() {
    if (this.sc) return;
    const sc = this.sc = { ...buildSafetyCar(), i: this.exitI, lat: 0, v: 0, x: 0, z: 0, state: 'out', laps: 0 };
    this.scene.add(sc.group);
    this.placeOnLine(sc, sc.i, 0);
  }
  sendAmbulance(at) {
    if (this.ambulance || !at) return;
    const target = this.trackside.nearestLine(at.x, at.z, 80);
    if (target < 0) return;
    const a = this.ambulance = { ...buildAmbulance(), i: this.exitI, lat: 2.5, v: 0, x: 0, z: 0, target, state: 'out', wait: 0 };
    this.scene.add(a.group);
    this.placeOnLine(a, a.i, a.lat);
  }
  // a vehicle driving round: speed by the corners, stop at a point
  drive(veh, dt, vWant, stopAt = null) {
    const m = this.m;
    let want = Math.min(vWant, this.vMax[Math.floor(veh.i) % m] * 0.95);
    if (stopAt != null) {
      const left = ((stopAt - veh.i) % m + m) % m * 2;
      want = Math.min(want, Math.sqrt(2 * 4 * Math.max(0, left - 1)));
      if (left < 2 && veh.v < 1) { veh.v = 0; return true; }
    }
    veh.v += Math.max(-8 * dt, Math.min(3.5 * dt, want - veh.v));
    veh.i = (veh.i + veh.v * dt / 2) % m;
    this.placeOnLine(veh, veh.i, veh.lat);
    return false;
  }

  // ---- every frame ----
  // S: { physics (yours), playerModel, playerBroken, playerOnTrack, playerFire,
  //      playerStopped (s), playerOut (a DNF), inPits, wreck {burning}, engineBlock
  //      {obj, fire}, debris [flying parts], camera }
  update(dt, S) {
    this.t += dt; this.phaseT += dt;
    this.playerRef = S.physics;
    const race = this.ai.race, racing = race && race.phase === 'racing';
    if (!race || race.phase === 'grid') { if (this.phase !== 'green') this.phase = 'green'; }
    // what needs dealing with
    const needs = this.survey(S);
    // the phase for a race: red (set by bigIncident) runs its course; a car
    // stopped on the track: the safety car; off it: the VSC
    if (racing) {
      if (this.phase === 'red') {
        if (this.phaseT > 20 && !needs.onTrackWreck && !this.crane) this.restart();
      } else if (needs.onTrackWreck || needs.fireOnTrack) this.setPhase('sc');
      else if (needs.offTrackWreck) { if (this.phase === 'green') this.setPhase('vsc'); }
      else if (this.phase === 'vsc' && this.phaseT > 4 && !this.crane) this.setPhase('green');
    }
    // the crane, for the first wreck in the queue (only under a safety car,
    // a VSC or a red flag in a race; any time in practice)
    const craneOK = !racing || this.phase !== 'green';
    if (!this.crane && craneOK && needs.wrecks.length) this.sendCrane(needs.wrecks[0]);
    if (this.crane) this.updateCrane(dt, S);
    if (this.sc) this.updateSafetyCar(dt, needs);
    if (this.ambulance) this.updateAmbulance(dt);
    // fire marshals and sweepers
    for (const f of needs.fires) if (!this.jobs.has(f.key)) this.sendFireMarshals(f);
    if (needs.debris.length && !this.runners.some((r) => r.job === 'sweep')) this.sendSweeper(needs.debris[0]);
    for (const r of this.runners) r.person.update(dt, this.groundAt);
    this.runners = this.runners.filter((r) => { if (r.done) { this.scene.remove(r.person.root); return false; } return true; });
    // nothing solid gets driven through
    this.bump(S.physics, [this.crane, this.ambulance, this.sc].filter(Boolean));
    // your penalties
    if (racing) this.judge(dt, S);
  }

  // ---- what's out there: wrecks to lift, fires to put out, bits to sweep ----
  survey(S) {
    const out = { wrecks: [], fires: [], debris: [], onTrackWreck: false, offTrackWreck: false, fireOnTrack: false };
    const onTrack = (x, z) => { const i = this.trackside.nearestLine(x, z, 30); if (i < 0) return false; const p = this.line[i]; return Math.hypot(p.x - x, p.z - z) < p.width / 2 + 1.5; };
    const near = (x, z) => this.trackside.nearestLine(x, z, 40) >= 0;
    // you: broken down out on the circuit
    if (S.playerBroken && S.playerStopped > 6 && !S.inPits && near(S.physics.x, S.physics.z)) {
      const on = onTrack(S.physics.x, S.physics.z);
      out.wrecks.push({ key: 'player', kind: 'player', x: S.physics.x, z: S.physics.z, obj: S.playerModel, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the computer cars that are out of it
    for (const c of this.ai.cars) {
      if (c.parked || c.recovered || !(c.dnf || c.wrecked)) continue;
      const on = onTrack(c.physics.x, c.physics.z);
      out.wrecks.push({ key: c, kind: 'ai', car: c, x: c.physics.x, z: c.physics.z, obj: c.model.car, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the engine block, once it's lying still
    const B = S.engineBlock;
    if (B?.obj?.parent && B.rest && near(B.obj.position.x, B.obj.position.z)) {
      const on = onTrack(B.obj.position.x, B.obj.position.z);
      if (!B.fire) { out.wrecks.push({ key: 'block', kind: 'block', x: B.obj.position.x, z: B.obj.position.z, obj: B.obj, on }); if (on) out.onTrackWreck = true; }
    }
    // fires: your car (stopped), the wreck, the block
    if (S.playerFire && S.playerStopped > 1.5 && !S.inPits) out.fires.push({ key: 'fire-car', kind: 'car', x: S.physics.x, z: S.physics.z });
    if (S.wreck?.burning) out.fires.push({ key: 'fire-wreck', kind: 'wreck', x: S.physics.x, z: S.physics.z });
    if (B?.obj?.parent && B.fire > 0 && B.rest) out.fires.push({ key: 'fire-block', kind: 'block', x: B.obj.position.x, z: B.obj.position.z });
    for (const f of out.fires) if (onTrack(f.x, f.z)) out.fireOnTrack = true;
    // bits lying on the track, still for a few seconds
    for (const d of S.debris || []) {
      if (!d.rest || d.obj === B?.obj || d.swept) continue;
      d.still = (d.still || 0) + 1 / 60;
      if (d.still > 5 && onTrack(d.obj.position.x, d.obj.position.z)) out.debris.push(d);
    }
    return out;
  }

  // ---- the safety car ----
  updateSafetyCar(dt, needs) {
    const sc = this.sc, clear = !needs.onTrackWreck && !needs.fireOnTrack && !this.crane;
    sc.flash(this.t, sc.state !== 'in');
    sc.green(sc.state === 'out' && this.phaseT < 6);       // (the cars ahead of it may pass for a moment, to join the back)
    if (sc.state === 'out') {
      this.drive(sc, dt, 34);
      if (clear && this.phaseT > 15) { sc.state = 'lastLap'; this.hooks.toast?.('SAFETY CAR IN THIS LAP'); }
    } else if (sc.state === 'lastLap') {
      // into the pit lane at the entry
      this.drive(sc, dt, 34);
      const left = ((this.entryI - sc.i) % this.m + this.m) % this.m;
      if (left < 6) { sc.state = 'in'; this.setPhase('green'); }
    } else {
      // peeling off down the pit lane, then gone
      sc.lat = Math.min(sc.lat + dt * 3, 16);
      this.drive(sc, dt, 20);
      if (sc.lat >= 16) { this.scene.remove(sc.group); this.sc = null; }
    }
  }

  // ---- the ambulance ----
  updateAmbulance(dt) {
    const a = this.ambulance;
    a.flash(this.t, true);
    if (a.state === 'out') { if (this.drive(a, dt, 30, a.target)) { a.state = 'wait'; a.wait = 0; } }
    else if (a.state === 'wait') { a.wait += dt; if (a.wait > 12) a.state = 'away'; }
    else {
      this.drive(a, dt, 30);
      const fromTarget = ((a.i - a.target) % this.m + this.m) % this.m;
      if (fromTarget > 250) { this.scene.remove(a.group); this.ambulance = null; }
    }
  }

  // ---- the recovery crane ----
  sendCrane(w) {
    // it comes from behind the barrier: the nearest marshal post
    const posts = this.trackside.posts;
    let best = posts[0], bd = Infinity;
    for (const p of posts) { const d = (p.x - w.x) ** 2 + (p.z - w.z) ** 2; if (d < bd) { bd = d; best = p; } }
    const c = this.crane = { ...buildCrane(), w, home: { x: best.x, z: best.z }, x: best.x, z: best.z, heading: 0, state: 'go', t: 0, lift: 0 };
    c.setDrop(0.6);
    this.scene.add(c.group);
    this.place(c);
    this.hooks.toast?.(w.kind === 'player' ? 'RECOVERY CRANE ON ITS WAY' : null);
  }
  place(v) { v.group.position.set(v.x, this.groundAt(v.x, v.z), v.z); v.group.rotation.y = v.heading; }
  steerTo(v, tx, tz, speed, dt, stopShort = 0) {
    const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
    if (d <= stopShort + 0.2) return true;
    const want = Math.atan2(dx, dz);
    let df = want - v.heading; df = Math.atan2(Math.sin(df), Math.cos(df));
    v.heading += Math.max(-dt * 0.9, Math.min(dt * 0.9, df));
    const step = Math.min(d - stopShort, speed * dt * Math.max(0.2, Math.cos(df)));
    v.x += Math.sin(v.heading) * step; v.z += Math.cos(v.heading) * step;
    this.place(v);
    return false;
  }
  updateCrane(dt, S) {
    const c = this.crane, w = c.w;
    c.flash(this.t, true);
    c.t += dt;
    const obj = w.obj;
    if (c.state === 'go') {
      // drive up beside it (nose to it, 3.5 m short)
      if (this.steerTo(c, w.x, w.z, 4.5, dt, 3.6)) { c.state = 'reach'; c.t = 0; }
    } else if (c.state === 'reach') {
      // swing the boom over it, lower the hook
      const local = c.group.worldToLocal(new THREE.Vector3(w.x, c.group.position.y, w.z));
      const yaw = Math.atan2(local.x - c.turntable.position.x, local.z - c.turntable.position.z);
      c.turntable.rotation.y += (yaw - c.turntable.rotation.y) * Math.min(1, dt * 1.5);
      c.boom.rotation.x = -0.32 * Math.min(1, c.t / 2);
      c.setDrop(0.6 + 1.6 * Math.min(1, c.t / 3));
      if (c.t > 3.5) { c.state = 'lift'; c.t = 0; c.hookWorld = new THREE.Vector3(); }
    } else if (c.state === 'lift') {
      // up it comes
      c.setDrop(2.2 - 1.4 * Math.min(1, c.t / 3));
      c.lift = 1.6 * Math.min(1, c.t / 3);
      if (c.t > 3.2) { c.state = 'carry'; c.t = 0; }
    } else if (c.state === 'carry') {
      if (this.steerTo(c, c.home.x, c.home.z, 3.5, dt, 1)) { c.state = 'drop'; c.t = 0; }
    } else if (c.state === 'drop') {
      c.lift = Math.max(0, 1.6 - c.t);
      if (c.t > 1.6) {
        // done: the wreck's dealt with
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; }
        else if (w.kind === 'block') this.hooks.removeBlock?.();
        this.scene.remove(c.group); this.crane = null;
        return;
      }
    }
    // the wreck hangs from the hook while it's lifted and carried
    if (c.state === 'lift' || c.state === 'carry' || c.state === 'drop') {
      c.hookAt.updateWorldMatrix(true, false);
      const h = c.hookAt.getWorldPosition(new THREE.Vector3());
      if (c.state === 'lift' && c.t < 0.1) c.offset = new THREE.Vector3(w.x - h.x, 0, w.z - h.z);
      const x = h.x + (c.offset?.x || 0) * (1 - Math.min(1, c.t / 2)), z = h.z + (c.offset?.z || 0) * (1 - Math.min(1, c.t / 2));
      w.x = x; w.z = z;
      if (obj) { obj.position.x = x; obj.position.z = z; obj.position.y = this.groundAt(x, z) + c.lift; }
      if (w.kind === 'player' && S.physics) { S.physics.x = x; S.physics.z = z; S.physics.vx = S.physics.vy = 0; this.liftedPlayer = c.lift; }
      if (w.kind === 'ai') { w.car.physics.x = x; w.car.physics.z = z; w.car.lift = c.lift; }
    }
  }

  // ---- fire marshals: two from the nearest post, at a run ----
  nearestPost(x, z) {
    let best = null, bd = Infinity;
    for (const p of this.trackside.posts) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  newRunner(post, job) {
    const person = new Person(this.mats, 0);
    person.place(post.x + (Math.random() - 0.5) * 2, post.z + (Math.random() - 0.5) * 2, 0);
    this.scene.add(person.root);
    const r = { person, job, done: false };
    this.runners.push(r);
    return r;
  }
  sendFireMarshals(f) {
    this.jobs.add(f.key);
    const post = this.nearestPost(f.x, f.z);
    if (!post) return;
    for (let k = 0; k < 2; k++) {
      const r = this.newRunner(post, 'fire');
      const ext = makeExtinguisher(this.mats);
      r.person.hold(ext, 'hand');
      const a = (k ? 1 : -1) * 0.9 + Math.atan2(post.x - f.x, post.z - f.z);
      const sx = f.x + Math.sin(a) * 2.6, sz = f.z + Math.cos(a) * 2.6;
      r.person.run([
        { wait: k * 0.4 },
        { go: [sx, sz], run: true },
        { face: [f.x, f.z] },
        { pose: 'SPRAY' },
        { fn: () => { r.spraying = true; } },
        { wait: 4.5 },
        { fn: () => { r.spraying = false; if (k === 0) { this.hooks.extinguish?.(f.kind); setTimeout(() => this.jobs.delete(f.key), 8000); } } },
        { pose: 'STAND' },
        { wait: 2 },
        { go: [post.x, post.z] },
        { fn: () => { r.done = true; } },
      ]);
      r.sprayAt = () => (r.spraying ? { x: sx, z: sz, tx: f.x, tz: f.z } : null);
    }
  }
  sendSweeper(d) {
    d.swept = true;
    const post = this.nearestPost(d.obj.position.x, d.obj.position.z);
    if (!post) return;
    const r = this.newRunner(post, 'sweep');
    const at = [d.obj.position.x, d.obj.position.z];
    r.person.run([
      { go: at, run: true },
      { pose: 'REACH', t: 0.6 },
      { fn: () => { this.hooks.removeDebris?.(d); } },
      { pose: 'CARRY' },
      { go: [post.x, post.z] },
      { fn: () => { r.done = true; } },
    ]);
  }
  // white extinguisher clouds, for the game to draw (where, and at what)
  sprays() { const out = []; for (const r of this.runners) { const s = r.sprayAt?.(); if (s) out.push(s); } return out; }

  // ---- solid vehicles: you don't drive through them ----
  bump(P, vehicles) {
    if (!P) return;
    for (const v of vehicles) {
      const R = v === this.sc ? 2.3 : 2.8;
      const dx = P.x - v.x, dz = P.z - v.z, d = Math.hypot(dx, dz);
      if (d >= R || d < 1e-3) continue;
      const nx = dx / d, nz = dz / d;
      P.x += nx * (R - d); P.z += nz * (R - d);
      const fx = Math.sin(P.heading), fz = Math.cos(P.heading), lx = Math.cos(P.heading), lz = -Math.sin(P.heading);
      const vx = fx * P.vx + lx * P.vy, vz = fz * P.vx + lz * P.vy;
      const vn = vx * nx + vz * nz;
      if (vn < 0) {
        const nvx = vx - 1.4 * vn * nx, nvz = vz - 1.4 * vn * nz;
        P.vx = nvx * fx + nvz * fz; P.vy = nvx * lx + nvz * lz;
        if (-vn > 3) P.crashHit?.({ zone: (nx * fx + nz * fz) < -0.5 ? 'front' : 'left', speed: -vn, along: 0, across: 0 });
      }
    }
  }

  // ---- the red flag: everyone back, then a standing restart in the order they were ----
  restart() {
    this.setPhase('green');
    if (this.sc) { this.scene.remove(this.sc.group); this.sc = null; }
    if (this.ambulance) { this.scene.remove(this.ambulance.group); this.ambulance = null; }
    this.ai.restartFromGrid?.();
    this.hooks.toast?.('RESTART: BACK ON THE GRID');
  }

  // ---- your penalties ----
  judge(dt, S) {
    const A = this.ai, st = this.penaltyState, P = S.physics, H = this.hooks;
    if (A.player.finished || A.player.dnf || S.inPits) { st.overtakeOrder = null; return; }
    const pts = A.racing.pts, L = A.racing.length, m = pts.length;
    const prog = (t) => t.lap * L + ((pts[t.near].s - pts[A.startIndex].s + L) % L);
    const me = prog(A.player);
    // overtaking under yellow or the safety car: who you've just passed
    const sector = this.sectorOfPt[A.player.near];
    const flag = this.trackside.posts[sector]?.flag;
    const noPass = this.phase === 'sc' || this.phase === 'vsc' || flag === 'yellow' || flag === 'yellow2';
    const order = new Map();
    for (const c of A.cars) if (!c.dnf && !c.parked && !c.wrecked) order.set(c, prog(c) - me);
    if (st.overtakeOrder && noPass) {
      for (const [c, gap] of order) {
        const was = st.overtakeOrder.get(c);
        if (was != null && was > 0 && was < 40 && gap <= 0 && gap > -40 && Math.abs(c.physics.vx) > 8) {
          H.penalty?.(5, this.phase === 'sc' ? 'OVERTAKING UNDER THE SAFETY CAR' : this.phase === 'vsc' ? 'OVERTAKING UNDER THE VSC' : 'OVERTAKING UNDER YELLOW');
        }
      }
    }
    st.overtakeOrder = order;
    // too fast under the VSC, or through a double yellow
    const plan = A.plan().v[A.player.near] || 30, v = Math.abs(P.vx);
    const limit = this.phase === 'vsc' ? plan * 0.62 * 1.12 : flag === 'yellow2' ? Math.min(plan * 0.7, 26) * 1.12 : Infinity;
    if (v > limit) {
      st.vscOver += dt;
      if (st.vscOver > 2) {
        st.vscOver = 0; st.vscWarn++;
        if (st.vscWarn >= 3) { st.vscWarn = 0; H.penalty?.(5, this.phase === 'vsc' ? 'SPEEDING UNDER THE VSC' : 'SPEEDING UNDER DOUBLE YELLOWS'); }
        else H.toast?.(this.phase === 'vsc' ? 'SLOW DOWN: VSC' : 'SLOW DOWN: DOUBLE YELLOW');
      }
    } else st.vscOver = Math.max(0, st.vscOver - dt);
    // ignoring blue flags: being caught by a car a lap up and not letting it by
    if (A.blueFlagFor()) { st.blueT += dt; st.blueCalm = 0; if (st.blueT > 15) { st.blueT = 0; H.penalty?.(5, 'IGNORING BLUE FLAGS'); } }
    else { st.blueCalm += dt; if (st.blueCalm > 6) st.blueT = 0; }
  }
}
