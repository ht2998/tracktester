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
//   - Nothing pops up out of thin air: the safety car and the ambulance
//     wait in the pit lane at the exit end and drive out and back; the
//     cranes are parked at recovery points (turns 1, 4, 9 and 15) and go
//     back there; marshals come out from behind their huts.
//   - A barrier badly hit: a safety car (or a red flag if it's wrecked),
//     and a repair crew from the nearest post fixing it.
//   - The rules: overtaking under yellow or the safety car, speeding under
//     the VSC or double yellows, ignoring blue flags: time penalties.
// The game (rendering.js) tells it what's happening every frame; the
// computer drivers (ai.js) ask it how fast they may go (rules()).
// =====================================================================

import * as THREE from 'three';
import { Person, makeExtinguisher } from './pits.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 2;

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
  constructor(scene, { line, trackside, aiField, groundAt, hooks = {}, isMobile = false, pit, corners = [] }) {
    this.scene = scene; this.line = line; this.m = line.length; this.trackside = trackside;
    this.ai = aiField; this.groundAt = groundAt; this.hooks = hooks; this.isMobile = isMobile; this.pit = pit;
    this.phase = 'green';            // green | vsc | sc | red
    this.t = 0;
    this.phaseT = 0;
    this.crane = null; this.ambulance = null; this.sc = null;
    this.repairs = [];               // barriers being fixed
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
    // ---- the vehicles, parked and waiting ----
    // the safety car and the ambulance: in the pit lane, at the exit end,
    // in front of the last garages, facing the way out
    this.parkSC = { x: pit.garageX - 3.2, z: pit.z0 + 22 };
    this.parkAmb = { x: pit.garageX - 3.2, z: pit.z0 + 32 };
    this.sc = { ...buildSafetyCar(), x: this.parkSC.x, z: this.parkSC.z, heading: Math.PI, v: 0, i: 0, lat: 0, state: 'parked', mode: 'free', route: [] };
    this.ambulance = { ...buildAmbulance(), x: this.parkAmb.x, z: this.parkAmb.z, heading: Math.PI, v: 0, i: 0, lat: 2.5, state: 'parked', mode: 'free', route: [] };
    for (const v of [this.sc, this.ambulance]) { scene.add(v.group); this.place(v); v.flash(0, false); }
    // the cranes: one at each recovery point, beside the marshal post there
    this.cranes = [];
    const want = [0, 3, 8, 14].map((k) => corners[Math.min(k, corners.length - 1)]).filter(Boolean);
    const used = new Set();
    const circ = (a, b) => Math.abs(((a - b) % this.m + this.m * 1.5) % this.m - this.m / 2);
    const spots = [];
    for (const cn of want) {
      const apex = cn.apex ?? cn.a;
      let best = null, bd = Infinity;
      for (const p of trackside.posts) {
        if (used.has(p) || p.i == null) continue;
        const d = circ(p.i, apex);
        if (d < bd) { bd = d; best = p; }
      }
      if (best) { used.add(best); spots.push(best); }
    }
    // (and more round the lap, so one's never too far away: no post more
    // than ~500 m from a crane, ~700 m on a phone)
    const reach = (isMobile ? 700 : 500) / 2;
    for (const p of trackside.posts) {
      if (p.i == null || used.has(p) || p.i === 0) continue;
      if (spots.every((q) => circ(q.i, p.i) > reach)) { used.add(p); spots.push(p); }
    }
    for (const best of spots) {
      const lp = line[best.i], ax = best.x - lp.x, az = best.z - lp.z, ad = Math.hypot(ax, az) || 1;
      const tx = Math.sin(lp.heading), tz = Math.cos(lp.heading);
      const park = { x: best.x + tx * 6 + ax / ad * 1.5, z: best.z + tz * 6 + az / ad * 1.5 };
      const c = { ...buildCrane(), x: park.x, z: park.z, heading: Math.atan2(-ax, -az), park, parkHeading: Math.atan2(-ax, -az), state: 'parked', t: 0, lift: 0, post: best };
      c.setDrop(0.6);
      scene.add(c.group); this.place(c); c.flash(0, false);
      this.cranes.push(c);
    }
  }
  get busySC() { return this.sc && this.sc.state !== 'parked'; }

  // ---- for the computer drivers ----
  // the fastest he may go at racing-line point i (Infinity: as fast as he likes)
  cap(c, i, plan) {
    const race = this.ai.race;
    if (!race || race.phase !== 'racing') return Infinity;
    let cap = Infinity;
    if (this.phase === 'red') cap = 20;
    if (this.phase === 'vsc') cap = plan * 0.62;
    if (this.phase === 'sc' && (this.sc.state === 'out' || this.sc.state === 'lastLap')) {
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
  // the way out: down the lane, out of the exit road, onto the track
  exitRoute() { const P = this.pit; return [[P.laneX + 1, P.z0 + 8], [P.laneX, P.z0 - 10], [P.laneX - 1, P.exitZ + 15]]; }
  // the way back in: the entry road, the lane, then the parking spot
  entryRoute(park) { const P = this.pit; return [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, park.z + 14], [park.x, park.z + 4], [park.x, park.z]]; }
  sendSafetyCar() {
    const sc = this.sc;
    if (sc.state !== 'parked') return;
    sc.state = 'leaving'; sc.mode = 'free'; sc.route = this.exitRoute(); sc.v = 0; sc.lat = 0;
  }
  sendAmbulance(at) {
    const a = this.ambulance;
    if (!at || a.state !== 'parked') return;
    const target = this.trackside.nearestLine(at.x, at.z, 80);
    if (target < 0) return;
    // (pulls up on the side of the track the car's on)
    const p = this.line[target], side = ((at.x - p.x) * p.lx + (at.z - p.z) * p.lz) >= 0 ? 1 : -1;
    a.target = target; a.side = side; a.at = { x: at.x, z: at.z };
    a.state = 'leaving'; a.mode = 'free'; a.route = this.exitRoute(); a.v = 0; a.lat = 0; a.wait = 0;
  }
  // the medical car for any big crash (no red flag by itself)
  medical(at) { this.sendAmbulance(at); }
  // off the road (in the pit lane and its roads): drive through a list of points
  followRoute(v, dt, speed) {
    if (!v.route.length) return true;
    const [tx, tz] = v.route[0], last = v.route.length === 1;
    v.v += Math.max(-6 * dt, Math.min(3 * dt, speed - v.v));
    if (last) v.v = Math.min(v.v, 1 + Math.hypot(tx - v.x, tz - v.z) * 0.8);
    if (this.steerTo(v, tx, tz, Math.max(1, v.v), dt, last ? 0 : 2.5, 2.2)) { v.route.shift(); if (last) { v.v = 0; return true; } }
    return false;
  }
  // from the end of the exit road onto the track itself
  joinTrack(v, lat) {
    v.mode = 'line'; v.i = this.trackside.nearestLine(v.x, v.z, 80); if (v.i < 0) v.i = this.exitI;
    v.lat = lat;
  }
  // off the track at the entry, then down the lane home
  headHome(v, park) {
    v.mode = 'free'; v.route = this.entryRoute(park); v.heading = v.group.rotation.y;
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
        if (this.phaseT > 20 && !needs.onTrackWreck && !this.crane && !this.repairs.length) this.restart();
      } else if (needs.onTrackWreck || needs.fireOnTrack || this.repairs.some((r) => !r.done)) this.setPhase('sc');
      else if (needs.offTrackWreck) { if (this.phase === 'green') this.setPhase('vsc'); }
      else if (this.phase === 'vsc' && this.phaseT > 4 && !this.crane) this.setPhase('green');
    }
    // the crane, for the first wreck in the queue (only under a safety car,
    // a VSC or a red flag in a race; any time in practice)
    const craneOK = !racing || this.phase !== 'green';
    if (!this.crane && craneOK && needs.wrecks.length) this.sendCrane(needs.wrecks[0]);
    if (this.crane) this.updateCrane(dt, S, this.crane);
    if (this.phase === 'sc' && this.sc.state === 'parked') this.sendSafetyCar();
    this.updateSafetyCar(dt, needs);
    this.updateAmbulance(dt);
    for (const c of this.cranes) if (c !== this.crane && c.state !== 'parked') this.updateCrane(dt, S, c);
    this.updateRepairs(dt);
    // fire marshals and sweepers
    for (const f of needs.fires) if (!this.jobs.has(f.key)) this.sendFireMarshals(f);
    if (needs.debris.length && !this.runners.some((r) => r.job === 'sweep')) this.sendSweeper(needs.debris[0]);
    for (const r of this.runners) r.person.update(dt, this.groundAt);
    this.runners = this.runners.filter((r) => { if (r.done) { this.scene.remove(r.person.root); return false; } return true; });
    // nothing solid gets driven through
    this.bump(S.physics, [...this.cranes, this.ambulance, this.sc].filter(Boolean));
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
    const sc = this.sc, clear = !needs.onTrackWreck && !needs.fireOnTrack && !this.crane && !this.repairs.some((r) => !r.done);
    if (sc.state === 'parked') return;
    sc.flash(this.t, sc.state !== 'home');
    sc.green(sc.state === 'out' && this.phaseT < 6);       // (the cars ahead of it may pass for a moment, to join the back)
    if (sc.state === 'leaving') {
      // down the pit lane (at the limit) and out of the exit road
      if (this.followRoute(sc, dt, sc.route.length > 1 ? 16 : 24)) { this.joinTrack(sc, 0); sc.state = 'out'; }
    } else if (sc.state === 'out') {
      this.drive(sc, dt, 34);
      if (clear && this.phaseT > 15) { sc.state = 'lastLap'; this.hooks.toast?.('SAFETY CAR IN THIS LAP'); }
    } else if (sc.state === 'lastLap') {
      // into the pit lane at the entry
      this.drive(sc, dt, 34);
      const left = ((this.entryI - sc.i) % this.m + this.m) % this.m;
      if (left < 6) { sc.state = 'home'; this.setPhase('green'); this.headHome(sc, this.parkSC); }
    } else if (sc.state === 'home') {
      // in at the entry, down the lane, and parked back where it was
      if (this.followRoute(sc, dt, 16)) { sc.state = 'parked'; sc.heading = Math.PI; this.place(sc); sc.flash(0, false); sc.green(false); }
    }
  }

  // ---- the ambulance ----
  updateAmbulance(dt) {
    const a = this.ambulance;
    if (a.state === 'parked') return;
    a.flash(this.t, a.state !== 'home');
    if (a.state === 'leaving') { if (this.followRoute(a, dt, a.route.length > 1 ? 16 : 22)) { this.joinTrack(a, 2.5 * a.side); a.state = 'out'; } }
    else if (a.state === 'out') { a.lat += (4.5 * a.side - a.lat) * Math.min(1, dt * 0.5); if (this.drive(a, dt, 40, a.target)) { a.state = 'wait'; a.wait = 0; } }
    else if (a.state === 'wait') { a.wait += dt; if (a.wait > (this.hooks.driverWaiting?.() ? 25 : 14)) { a.state = 'away'; this.hooks.medicsDone?.(); } }
    else if (a.state === 'away') {
      // on round to the pit entry, then in
      a.lat += (0 - a.lat) * Math.min(1, dt * 0.5);
      this.drive(a, dt, 30);
      const left = ((this.entryI - a.i) % this.m + this.m) % this.m;
      if (left < 6) { a.state = 'home'; this.headHome(a, this.parkAmb); }
    } else if (a.state === 'home') {
      if (this.followRoute(a, dt, 16)) { a.state = 'parked'; a.heading = Math.PI; this.place(a); a.flash(0, false); }
    }
  }

  // ---- the recovery crane ----
  sendCrane(w) {
    // the nearest crane that's free, from its recovery point
    let best = null, bd = Infinity;
    for (const c of this.cranes) { if (c.state !== 'parked') continue; const d = (c.x - w.x) ** 2 + (c.z - w.z) ** 2; if (d < bd) { bd = d; best = c; } }
    if (!best) return;
    const c = this.crane = best;
    // it puts the wreck down off the road, just past its own spot
    const lp = this.line[c.post.i], tx = Math.sin(lp.heading), tz = Math.cos(lp.heading);
    // it puts the wreck down behind the barrier, at the nearest marshal post to it
    const post = this.nearestPost(w.x, w.z) || c.post;
    const pl = this.line[post.i ?? 0] || lp, ax = post.x - pl.x, az = post.z - pl.z, ad = Math.hypot(ax, az) || 1;
    const ptx = Math.sin(pl.heading || 0), ptz = Math.cos(pl.heading || 0);
    Object.assign(c, { w, home: { x: post.x + ptx * 6 + ax / ad * 2, z: post.z + ptz * 6 + az / ad * 2 }, state: 'go', t: 0, lift: 0, offset: null });
    this.hooks.toast?.(w.kind === 'player' ? 'RECOVERY CRANE ON ITS WAY' : null);
  }
  place(v) { v.group.position.set(v.x, this.groundAt(v.x, v.z), v.z); v.group.rotation.y = v.heading; }
  steerTo(v, tx, tz, speed, dt, stopShort = 0, turn = 0.9) {
    const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
    if (d <= stopShort + 0.2) return true;
    const want = Math.atan2(dx, dz);
    let df = want - v.heading; df = Math.atan2(Math.sin(df), Math.cos(df));
    v.heading += Math.max(-dt * turn, Math.min(dt * turn, df));
    const step = Math.min(d - stopShort, speed * dt * Math.max(0.2, Math.cos(df)));
    v.x += Math.sin(v.heading) * step; v.z += Math.cos(v.heading) * step;
    this.place(v);
    return false;
  }
  updateCrane(dt, S, c) {
    const w = c.w;
    c.flash(this.t, c.state !== 'parked');
    c.t += dt;
    if (c.state === 'back') {
      // boom down, and back to its spot
      c.turntable.rotation.y *= 1 - Math.min(1, dt * 1.5); c.boom.rotation.x *= 1 - Math.min(1, dt * 1.5); c.setDrop(0.6);
      if (this.steerTo(c, c.park.x, c.park.z, Math.min(11, 1 + Math.hypot(c.park.x - c.x, c.park.z - c.z) * 0.3), dt, 0.3, 1.4)) { c.state = 'parked'; c.flash(0, false); c.heading = c.parkHeading; c.turntable.rotation.y = 0; c.boom.rotation.x = 0; this.place(c); }
      return;
    }
    const obj = w.obj;
    if (c.state === 'go') {
      // drive up beside it (nose to it, 3.5 m short)
      if (this.steerTo(c, w.x, w.z, Math.min(11, 2 + Math.hypot(w.x - c.x, w.z - c.z) * 0.3), dt, 3.6, 1.4)) { c.state = 'reach'; c.t = 0; }
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
      if (this.steerTo(c, c.home.x, c.home.z, Math.min(5, 1.5 + c.t), dt, 1, 1.2)) { c.state = 'drop'; c.t = 0; }
    } else if (c.state === 'drop') {
      c.lift = Math.max(0, 1.6 - c.t);
      if (c.t > 1.6) {
        // done: the wreck's dealt with
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; }
        else if (w.kind === 'block') this.hooks.removeBlock?.();
        c.state = 'back'; c.t = 0; c.lift = 0; c.w = null;
        if (this.crane === c) this.crane = null;
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
  // a marshal comes out from behind his hut (and goes back behind it when done)
  hutPath(post) {
    const lp = this.line[post.i ?? 0] || { x: post.x - 5, z: post.z, heading: 0 };
    const ax = post.x - lp.x, az = post.z - lp.z, ad = Math.hypot(ax, az) || 1;
    const tx = Math.sin(lp.heading ?? 0), tz = Math.cos(lp.heading ?? 0), side = Math.random() < 0.5 ? 1 : -1;
    return { behind: [post.x + ax / ad * 2.2, post.z + az / ad * 2.2], corner: [post.x + tx * 2 * side + ax / ad * 0.4, post.z + tz * 2 * side + az / ad * 0.4] };
  }
  newRunner(post, job) {
    const person = new Person(this.mats, 0);
    const h = this.hutPath(post);
    person.place(h.behind[0] + (Math.random() - 0.5), h.behind[1] + (Math.random() - 0.5), 0);
    this.scene.add(person.root);
    const r = { person, job, done: false, hut: h };
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
      // held across the body like a rifle: one hand on the handle, the other under the can
      ext.rotation.x = Math.PI / 2 - 0.25; ext.position.set(0, -0.05, -0.2);
      r.person.hold(ext, 'front');
      const a = (k ? 1 : -1) * 0.9 + Math.atan2(post.x - f.x, post.z - f.z);
      const sx = f.x + Math.sin(a) * 2.6, sz = f.z + Math.cos(a) * 2.6;
      r.person.run([
        { wait: k * 0.4 },
        { pose: 'RIFLE' },
        { go: r.hut.corner, run: true, panic: true },
        { go: [sx, sz], run: true, panic: true },
        { face: [f.x, f.z] },
        { pose: 'SPRAY_RIFLE' },
        { fn: () => { r.spraying = true; } },
        { wait: 4.5 },
        { fn: () => { r.spraying = false; if (k === 0) { this.hooks.extinguish?.(f.kind); setTimeout(() => this.jobs.delete(f.key), 8000); } } },
        { pose: 'STAND' },
        { wait: 2 },
        { pose: 'RIFLE' },
        { go: r.hut.corner },
        { go: r.hut.behind },
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
      { go: r.hut.corner, run: true },
      { go: at, run: true },
      { pose: 'REACH', t: 0.6 },
      { fn: () => { this.hooks.removeDebris?.(d); } },
      { pose: 'CARRY' },
      { go: r.hut.corner },
      { go: r.hut.behind },
      { fn: () => { r.done = true; } },
    ]);
  }
  // ---- a barrier hit hard: called by the game with the speed into it ----
  barrierHit(at, v, kind) {
    if (v < 18 || !at) return;
    // (one repair per stretch of barrier)
    if (this.repairs.some((r) => Math.hypot(r.x - at.x, r.z - at.z) < 12)) return;
    const severe = v >= 28;
    const rep = { x: at.x, z: at.z, kind, done: false, t: 0, need: severe ? 40 : 22, crew: [] };
    this.repairs.push(rep);
    const race = this.ai.race, racing = race && race.phase === 'racing';
    if (racing) {
      if (severe) { this.setPhase('red'); this.hooks.toast?.(kind === 'tyres' ? 'RED FLAG: THE TYRE WALL NEEDS REBUILDING' : 'RED FLAG: BARRIER REPAIRS'); }
      else if (this.phase === 'green') this.setPhase('sc');
    } else this.hooks.toast?.('BARRIER DAMAGED: REPAIR CREW ON ITS WAY');
    // the crew: three from the nearest post, to work along the damaged bit
    const post = this.nearestPost(at.x, at.z);
    if (!post) return;
    const i = this.trackside.nearestLine(at.x, at.z, 40), lp = this.line[Math.max(0, i)];
    const tx = Math.sin(lp?.heading || 0), tz = Math.cos(lp?.heading || 0);
    for (let k = 0; k < 3; k++) {
      const r = this.newRunner(post, 'repair');
      const off = (k - 1) * 1.6;
      r.person.run([
        { wait: k * 0.5 },
        { go: r.hut.corner, run: true },
        { go: [at.x + tx * off, at.z + tz * off], run: true },
        { face: [at.x + tx * off + (lp ? lp.x - at.x : 0), at.z + tz * off + (lp ? lp.z - at.z : 0)] },
        { pose: k === 1 ? 'BOLT' : 'WORK' },
        { until: () => rep.done },
        { pose: 'STAND' },
        { go: r.hut.corner },
        { go: r.hut.behind },
        { fn: () => { r.done = true; } },
      ]);
      rep.crew.push(r);
    }
  }
  updateRepairs(dt) {
    for (const rep of this.repairs) {
      if (rep.done) continue;
      // (they start once they're all there)
      if (rep.crew.every((r) => r.person.want === 'WORK' || r.person.want === 'BOLT' || r.done)) rep.t += dt;
      if (rep.t > rep.need) { rep.done = true; this.hooks.barrierFixed?.(rep); this.hooks.toast?.('BARRIER REPAIRED'); }
    }
    this.repairs = this.repairs.filter((r) => !r.done || r.crew.some((c) => !c.done));
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
    // (the safety car and the ambulance, back in the pit lane)
    for (const [v, park] of [[this.sc, this.parkSC], [this.ambulance, this.parkAmb]]) {
      v.state = 'parked'; v.mode = 'free'; v.route = []; v.v = 0; v.x = park.x; v.z = park.z; v.heading = Math.PI; this.place(v); v.flash(0, false);
    }
    this.sc.green(false);
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
