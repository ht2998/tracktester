// =====================================================================
// PIT STOPS (Sepang). The pit lane runs beside the start straight.
//
// Driving in: past the pit entry line the driver is on the limiter at
// 60 km/h and drives the car himself, down the lane and onto its marks,
// and afterwards back out to the end of the exit road (come over the line
// faster and it's a speeding penalty: five seconds standing still at your
// box before anyone touches the car). The menu, GT7's way: first the
// tyres (the crew wait at the box until you've picked), then any damage
// (repair or leave each part), then the fuel last: it fills up unless you
// say don't, and "Stop refuelling" ends it when you've enough.
//
// The stop: the front and rear jack men lift the car; at each wheel the
// gun man spins the centre nut off, the off man pulls the old wheel away,
// the on man pushes the new one on and the gun man tightens it and puts
// his hand up. The refueller comes in with the churn and tops up until
// it's full. A snapped mirror is ripped off and a new one bolted on; a
// broken wing is unbolted and carried away while a new one is held in
// place and bolted on; bent suspension is fixed at that corner with the
// wheel off. The lollipop man lifts his board when all's done: go.
//
// Arrive on fire and the nearest man jumps back in shock, runs into the
// garage for the extinguisher and puts it out first.
//
// Too badly hurt to fix (a blown engine, a wheel torn off, a split tank,
// a smashed radiator): the team retire the car. DNF on the standings, and
// they push it back into the garage.
// =====================================================================
export const BUILD = 7;

import * as THREE from 'three';

const LIMIT_KMH = 60;
const PENALTY_S = 5;
// Sepang's pit lane (see sepang.js): between the pit wall (x 12.2) and the
// garages (x 24), from z 175 (entry end; cars drive towards -z) to z -215
export const SEPANG_PIT = {
  laneX: 12.4, garageX: 24, z1: 175, z0: -215, entryZ: 245, exitZ: -265,
  box: { x: 20.6, z: 3, h: Math.PI },     // our box: in the working lane, in front of the garage at z 3
};

// ---- the crew: simple jointed people in team overalls ----
export const POSES = {
  STAND: {},
  KNEEL: { drop: 0.42, lean: 0.3, thL: 1.45, knL: 1.45, thR: 0, knR: 1.6, shL: 0.9, shR: 1.15, elL: 0.6, elR: 0.35 },
  KNEEL_UP: { drop: 0.42, lean: 0.1, thL: 1.45, knL: 1.45, thR: 0, knR: 1.6, shL: 0.9, shR: 3.0, elL: 0.6, elR: 0.1 },
  WORK: { drop: 0.42, lean: 0.45, thL: 1.45, knL: 1.45, thR: 0, knR: 1.6, shL: 1.25, shR: 1.25, elL: 0.5, elR: 0.5, work: 1 },
  REACH: { lean: 0.35, shL: 1.15, shR: 1.15, elL: 0.3, elR: 0.3, thL: 0.3, knL: 0.4 },
  CARRY: { shL: 0.85, shR: 0.85, elL: 1.0, elR: 1.0, lean: -0.05 },
  HOLD: { lean: 0.3, shL: 1.25, shR: 1.25, elL: 0.35, elR: 0.35, thL: 0.25, knL: 0.3, thR: 0.25, knR: 0.3, drop: 0.06 },
  PUSH: { lean: 0.55, shL: 1.45, shR: 1.45, elL: 0.25, elR: 0.25, thL: 0.5, knL: 0.6, drop: 0.08 },
  JACK: { lean: -0.2, shL: 0.75, shR: 0.75, elL: 0.15, elR: 0.15, thR: 0.35, knR: 0.25 },
  LOLLY: { shR: 1.45, elR: 0.05, shL: 0.1 },
  LOLLY_UP: { shR: 2.9, elR: 0.05, shL: 0.1 },
  SHOCK: { lean: -0.4, shL: 2.3, shR: 2.3, elL: 1.3, elR: 1.3, outL: 0.5, outR: 0.5, thL: 0.5, knL: 0.3 },
  SPRAY: { lean: 0.15, shL: 1.15, shR: 1.3, elL: 0.55, elR: 0.25, thL: 0.35, knL: 0.3 },
  REFUEL: { shL: 1.95, shR: 1.3, elL: 0.9, elR: 1.25, lean: 0.05 },
  RIP: { lean: -0.25, shR: 1.4, elR: 0.6, shL: 0.6, elL: 0.3, thR: 0.4, knR: 0.3 },
  BOLT: { lean: 0.3, shR: 1.5, elR: 0.6, shL: 1.2, elL: 0.6, work: 1 },
  // an extinguisher held across the body like a rifle: one hand on the
  // handle and trigger, the other under the can
  RIFLE: { lean: 0.2, shL: 0.75, shR: 0.55, elL: 1.25, elR: 1.45, outL: -0.25, outR: -0.35 },
  SPRAY_RIFLE: { lean: 0.3, shL: 0.95, shR: 0.75, elL: 1.05, elR: 1.25, outL: -0.25, outR: -0.35, thL: 0.45, knL: 0.35, thR: -0.1, drop: 0.08 },
};
const KEYS = ['drop', 'lean', 'shL', 'shR', 'elL', 'elR', 'outL', 'outR', 'thL', 'thR', 'knL', 'knR', 'work'];

const geoCache = {};
const G = (k, make) => geoCache[k] || (geoCache[k] = make());

export class Person {
  constructor(mats, colour) {
    const root = this.root = new THREE.Group();
    const suit = mats.suits[colour];
    const box = (w, h, d, mat, y = -h / 2) => { const m = new THREE.Mesh(G(`b${w},${h},${d},${y}`, () => new THREE.BoxGeometry(w, h, d).translate(0, y, 0)), mat); m.castShadow = true; return m; };
    const hips = this.hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
    hips.add(box(0.3, 0.16, 0.2, suit, 0));
    const torso = this.torso = new THREE.Group(); hips.add(torso);
    torso.add(box(0.36, 0.52, 0.22, suit, 0.27));
    const head = new THREE.Mesh(G('head', () => new THREE.SphereGeometry(0.135, 14, 10).scale(1, 1.08, 1.05)), mats.helmet);
    head.position.y = 0.69; head.castShadow = true; torso.add(head);
    const visor = new THREE.Mesh(G('visor', () => new THREE.SphereGeometry(0.137, 14, 8, -0.9 + Math.PI / 2, 1.8, 1.25, 0.45).scale(1, 1.08, 1.05)), mats.visor);
    visor.position.y = 0.69; torso.add(visor);
    const limb = (parent, x, y, len, thick, mat) => {
      const j = new THREE.Group(); j.position.set(x, y, 0); parent.add(j);
      j.add(box(thick, len, thick, mat));
      const k = new THREE.Group(); k.position.y = -len; j.add(k);
      return [j, k];
    };
    [this.shL, this.elL] = limb(torso, 0.23, 0.5, 0.29, 0.095, suit);
    [this.shR, this.elR] = limb(torso, -0.23, 0.5, 0.29, 0.095, suit);
    this.elL.add(box(0.085, 0.27, 0.085, suit)); this.elR.add(box(0.085, 0.27, 0.085, suit));
    // hands (gloves): what's held hangs from the right hand, or both
    this.handR = new THREE.Group(); this.handR.position.y = -0.3; this.elR.add(this.handR);
    this.handL = new THREE.Group(); this.handL.position.y = -0.3; this.elL.add(this.handL);
    this.handR.add(box(0.08, 0.08, 0.08, mats.glove, 0)); this.handL.add(box(0.08, 0.08, 0.08, mats.glove, 0));
    [this.thL, this.knL] = limb(hips, 0.1, -0.02, 0.45, 0.13, suit);
    [this.thR, this.knR] = limb(hips, -0.1, -0.02, 0.45, 0.13, suit);
    for (const k of [this.knL, this.knR]) { k.add(box(0.11, 0.44, 0.11, suit)); const f = box(0.11, 0.07, 0.24, mats.boot, -0.44); f.position.z = 0.05; k.add(f); }
    // the front of the body: where a carried wheel, wing or churn sits
    this.front = new THREE.Group(); this.front.position.set(0, 0.12, 0.42); torso.add(this.front);
    this.p = Object.fromEntries(KEYS.map((k) => [k, 0]));
    this.want = 'STAND';
    this.x = 0; this.z = 0; this.face = 0; this.moving = 0; this.phase = Math.random() * 6; this.t = 0;
    this.queue = []; this.held = []; this.follow = null; this.back = false;
  }
  place(x, z, face) { this.x = x; this.z = z; if (face != null) this.face = face; }
  run(list) { this.queue = list.slice(); this.follow = null; }
  then(list) { this.queue.push(...list); }
  get busy() { return this.queue.length > 0; }
  hold(obj, where = 'front') { (where === 'hand' ? this.handR : where === 'handL' ? this.handL : where === 'root' ? this.root : this.front).add(obj); this.held.push(obj); }
  release(obj) { this.held = this.held.filter((o) => o !== obj); }

  update(dt, groundAt, ctx) {
    this.t += dt;
    let speed = 0;
    // work through the list of things to do
    while (this.queue.length) {
      const a = this.queue[0];
      if (a.fn) { this.queue.shift(); a.fn(); continue; }
      if (a.pose) { this.want = a.pose; if (a.t == null) { this.queue.shift(); continue; } a.left = a.left ?? a.t; a.left -= dt; if (a.left > 0) break; this.queue.shift(); continue; }
      if (a.wait != null) { a.left = a.left ?? a.wait; a.left -= dt; if (a.left > 0) break; this.queue.shift(); continue; }
      if (a.until) { if (a.until()) { this.queue.shift(); continue; } break; }
      if (a.face != null) {
        const want = Array.isArray(a.face) ? Math.atan2(a.face[0] - this.x, a.face[1] - this.z) : a.face;
        let d = want - this.face; d = Math.atan2(Math.sin(d), Math.cos(d));
        const step = dt * 6;
        if (Math.abs(d) <= step) { this.face = want; this.queue.shift(); continue; }
        this.face += Math.sign(d) * step; break;
      }
      if (a.go) {
        const [tx, tz] = a.go, dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
        const v = a.panic ? 5.4 : a.run ? 4.6 : a.back ? 1.1 : 1.6;
        this.panic = !!a.panic;
        if (d < 0.04) { this.x = tx; this.z = tz; this.queue.shift(); continue; }
        const step = Math.min(d, v * dt);
        this.x += dx / d * step; this.z += dz / d * step;
        speed = v;
        this.back = !!a.back;
        if (!a.back && !a.sidestep) { let df = Math.atan2(dx, dz) - this.face; df = Math.atan2(Math.sin(df), Math.cos(df)); this.face += df * Math.min(1, dt * 10); }
        break;
      }
      this.queue.shift();
    }
    if (this.follow) { const f = this.follow(); this.x = f[0]; this.z = f[1]; this.face = f[2]; speed = f[3] || 0; }
    // the pose: eased towards what he's doing, with legs walking
    const P = POSES[this.want] || POSES.STAND, k = Math.min(1, dt * 9);
    for (const key of KEYS) this.p[key] += ((P[key] || 0) - this.p[key]) * k;
    this.moving += ((speed > 0 ? 1 : 0) - this.moving) * Math.min(1, dt * 8);
    this.phase += dt * (speed > 3 ? 11 : 7.5) * (this.back ? -1 : 1);
    const sw = Math.sin(this.phase) * this.moving * (speed > 3 ? 0.75 : 0.42);
    const p = this.p, carrying = this.held.length > 0;
    if (!speed) this.panic = false;
    const runLean = speed > 3 ? (this.panic ? 0.42 : 0.25) : 0;
    this.hips.position.y = 0.95 - p.drop * (1 - this.moving) + Math.abs(Math.cos(this.phase)) * 0.03 * this.moving;
    this.torso.rotation.x = p.lean * (1 - this.moving * 0.5) + runLean;
    const wob = p.work ? Math.sin(this.t * 22) * 0.12 * p.work : 0;
    const armSw = carrying ? 0 : sw * 0.9;
    this.shL.rotation.set(-(p.shL + armSw + wob), 0, p.outL);
    this.shR.rotation.set(-(p.shR - armSw - wob), 0, -p.outR);
    this.elL.rotation.x = -p.elL - (carrying ? 0 : this.moving * 0.3);
    this.elR.rotation.x = -p.elR - (carrying ? 0 : this.moving * 0.3);
    const legK = 1 - this.moving;
    this.thL.rotation.x = -(p.thL * legK + sw); this.thR.rotation.x = -(p.thR * legK - sw);
    this.knL.rotation.x = p.knL * legK + Math.max(0, -Math.sin(this.phase)) * 0.9 * this.moving;
    this.knR.rotation.x = p.knR * legK + Math.max(0, Math.sin(this.phase)) * 0.9 * this.moving;
    this.root.position.set(this.x, groundAt(this.x, this.z), this.z);
    this.root.rotation.y = this.face;
    // (in a panic: hunched, the body twisting with each stride, looking about)
    this.torso.rotation.y = this.panic ? Math.sin(this.phase) * 0.22 + Math.sin(this.t * 3.1) * 0.12 : 0;
  }
}

// ---- props ----
function makeWheel(r, w, mats) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(G(`ty${r},${w}`, () => new THREE.CylinderGeometry(r, r, w, 28).rotateX(Math.PI / 2)), mats.tyre);
  const rim = new THREE.Mesh(G(`rm${r},${w}`, () => new THREE.CylinderGeometry(r * 0.6, r * 0.6, w + 0.012, 20).rotateX(Math.PI / 2)), mats.rim);
  tyre.castShadow = true;
  g.add(tyre, rim);
  return g;   // (its axle along its own z)
}
function makeNut(mats) {
  const m = new THREE.Mesh(G('nut', () => new THREE.CylinderGeometry(0.045, 0.045, 0.05, 6).rotateX(Math.PI / 2)), mats.nut);
  return m;
}
function makeGun(mats) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(G('gunb', () => new THREE.BoxGeometry(0.08, 0.1, 0.24).translate(0, -0.02, 0.08)), mats.gun);
  const grip = new THREE.Mesh(G('gung', () => new THREE.BoxGeometry(0.05, 0.13, 0.06).translate(0, -0.1, 0)), mats.black);
  const sock = new THREE.Mesh(G('guns', () => new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10).rotateX(Math.PI / 2).translate(0, -0.02, 0.24)), mats.steel);
  g.add(body, grip, sock);
  g.rotation.x = Math.PI / 2;   // (held pointing the way the forearm points)
  return g;
}
function makeLolly(mats) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(G('lpole', () => new THREE.CylinderGeometry(0.015, 0.015, 1.25, 6).translate(0, -0.6, 0)), mats.black);
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#d6261c'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BRAKES', 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.CircleGeometry(0.21, 24), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 }));
  board.position.y = -1.25; board.rotation.x = Math.PI / 2;   // (the board faces the driver down the pole)
  g.add(pole, board);   // (the pole runs on down the arm, the board at its end)
  return g;
}
function makeJack(mats) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(G('jbase', () => new THREE.BoxGeometry(0.28, 0.1, 0.4)), mats.jack);
  base.position.set(0, 0.06, 1.25);
  const handle = new THREE.Mesh(G('jhand', () => new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6)), mats.steel);
  handle.position.set(0, 0.5, 0.68); handle.rotation.x = 1.0;
  const bar = new THREE.Mesh(G('jbar', () => new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6).rotateZ(Math.PI / 2)), mats.steel);
  bar.position.set(0, 0.88, 0.2);
  g.add(base, handle, bar);
  return g;   // (stands on the ground in front of the jack man)
}
function makeChurn(mats) {
  const g = new THREE.Group();
  const can = new THREE.Mesh(G('churn', () => new THREE.CylinderGeometry(0.15, 0.15, 0.5, 14)), mats.steel);
  const hose = new THREE.Mesh(G('chose', () => new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8).rotateX(Math.PI / 2).translate(0, 0.2, 0.3)), mats.black);
  can.castShadow = true;
  g.add(can, hose);
  return g;
}
export function makeExtinguisher(mats) {
  const g = new THREE.Group();
  const can = new THREE.Mesh(G('ext', () => new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12).translate(0, 0.25, 0)), mats.red);
  const top = new THREE.Mesh(G('exttop', () => new THREE.CylinderGeometry(0.03, 0.05, 0.08, 8).translate(0, 0.54, 0)), mats.black);
  const nozzle = new THREE.Mesh(G('extn', () => new THREE.CylinderGeometry(0.025, 0.035, 0.18, 8).rotateX(Math.PI / 2).translate(0, 0.52, 0.12)), mats.black);
  can.castShadow = true;
  g.add(can, top, nozzle);
  return g;
}

export class PitStop {
  // hooks (from the game): car (the car's model), wheels[pi] {x, z, r, w}
  // in the car's own frame, len {nose, tail}, mats {tyre, rim}, f1 (the
  // TT-88's body parts, or null), tyreChoices(), fitTyres(id, which),
  // repairWing(part), repairMirror(side), repairSusp(pi), repairRadiator(),
  // extinguish(), toast(text), invalidLap(), retire(), camera
  constructor(scene, { physics, groundAt, hooks, sound, isMobile = false, pit = SEPANG_PIT }) {
    Object.assign(this, { scene, physics, groundAt, hooks, sound, isMobile, pit });
    this.box = pit.box;
    this.phase = 'off';            // off, approach, guided, stopped, release, wheeling, retired
    this.holding = false;          // the game stops moving the car (on its marks, or being pushed)
    this.carPose = { x: 0, z: 0, h: 0 };
    this.lift = { f: 0, r: 0 };    // the jacks: how high each end is up
    this.liftWant = { f: 0, r: 0 };
    this.wheelGone = [false, false, false, false];
    this.choice = { tyres: null, fuel: true, repair: {}, through: false };
    this.mats = {
      suits: [new THREE.MeshStandardMaterial({ color: 0x1d2a66, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x2a3a86, roughness: 0.8 })],
      helmet: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.35 }),
      visor: new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.1, metalness: 0.6 }),
      glove: new THREE.MeshStandardMaterial({ color: 0xe8d23a, roughness: 0.7 }),
      boot: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }),
      gun: new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.4, metalness: 0.6 }),
      black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.35, metalness: 0.85 }),
      jack: new THREE.MeshStandardMaterial({ color: 0xe0b322, roughness: 0.5, metalness: 0.3 }),
      red: new THREE.MeshStandardMaterial({ color: 0xc81e14, roughness: 0.4, metalness: 0.2 }),
      nut: new THREE.MeshStandardMaterial({ color: 0xd8b33a, roughness: 0.3, metalness: 0.9 }),
      tyre: hooks.mats?.tyre || new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 }),
      rim: hooks.mats?.rim || new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.85 }),
    };
    this.group = new THREE.Group();
    scene.add(this.group);
    this.buildCrew();
    this.buildProps();
    this.buildPowder();
    this.buildUI();
    this.reset();
  }

  // ---- where things are ----
  // the car's own frame at the box (x: its left, z: forwards) to the world
  W(lx, lz, pose = this.box) { const c = Math.cos(pose.h), s = Math.sin(pose.h); return [pose.x + lx * c + lz * s, pose.z - lx * s + lz * c]; }
  W3(lx, ly, lz, pose = this.box) { const [x, z] = this.W(lx, lz, pose); return new THREE.Vector3(x, this.groundAt(x, z) + ly, z); }
  garage(dx, dz) { return [this.pit.garageX + dx, this.box.z + dz]; }
  inLane(x, z) {
    const P = this.pit;
    if (z <= P.z1 && z >= P.z0) return x > P.laneX && x < P.garageX;
    if (z > P.z1 && z < P.entryZ) return x > 9 + (P.entryZ - z) / (P.entryZ - P.z1) * 3.4;
    if (z < P.z0 && z > P.exitZ) return x > 9 + (z - P.exitZ) / (P.z0 - P.exitZ) * 3.4;
    return false;
  }
  inLimit(x, z) { return z <= this.pit.z1 && z >= this.pit.z0 && x > this.pit.laneX && x < this.pit.garageX; }

  buildCrew() {
    // per wheel (physics order FL FR RL RR): the gun man, the off man, the
    // on man; two jack men, the lollipop man, the refueller and two spare
    // mechanics (wings, mirrors, suspension, the fire)
    this.crew = [];
    const add = (role, colour = 0) => { const p = new Person(this.mats, colour); p.role = role; this.group.add(p.root); this.crew.push(p); return p; };
    this.gun = [], this.off = [], this.on = [];
    for (let i = 0; i < 4; i++) { this.gun.push(add('gun' + i)); this.off.push(add('off' + i, 1)); this.on.push(add('on' + i, 1)); }
    this.jackF = add('jackF'); this.jackR = add('jackR');
    this.lolly = add('lolly');
    this.fueller = add('fuel', 1);
    this.spare1 = add('spare1'); this.spare2 = add('spare2', 1);
  }

  buildProps() {
    const H = this.hooks;
    this.guns = this.gun.map(() => makeGun(this.mats));
    this.nuts = [0, 1, 2, 3].map(() => { const n = makeNut(this.mats); n.visible = false; this.group.add(n); return n; });
    this.newWheels = H.wheels.map((w) => makeWheel(w.r, w.w, this.mats));
    this.oldWheels = H.wheels.map((w) => makeWheel(w.r, w.w, this.mats));
    for (const w of [...this.newWheels, ...this.oldWheels]) this.group.add(w);
    this.jacks = [makeJack(this.mats), makeJack(this.mats)];
    this.lollyProp = makeLolly(this.mats);
    this.churn = makeChurn(this.mats);
    this.extinguisher = makeExtinguisher(this.mats);
    this.group.add(this.extinguisher);
    // the hose from the churn to the filler while refuelling
    this.hose = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 8).translate(0, 0.5, 0), this.mats.black);
    this.hose.visible = false;
    this.group.add(this.hose);
    // new wings and mirrors (copies of the car's own, carried in)
    const F = H.f1;
    this.spareParts = {};
    const copyPart = (groups) => {
      const wrap = new THREE.Group(), inner = new THREE.Group();
      wrap.add(inner);
      const b = new THREE.Box3();
      for (const g of groups) { const c = g.clone(true); c.position.set(0, 0, 0); c.quaternion.identity(); inner.add(c); }
      b.setFromObject(inner);
      const mid = b.getCenter(new THREE.Vector3());
      inner.position.copy(mid).multiplyScalar(-1);
      wrap.visible = false;
      this.group.add(wrap);
      return { wrap, mid };
    };
    if (F?.wings) {
      this.spareParts.front = copyPart([F.wings.fl, F.wings.fr]);
      this.spareParts.rear = copyPart([F.wings.rear]);
    }
    if (F?.mirrors) for (const s of ['l', 'r']) this.spareParts['mirror' + s] = copyPart([F.mirrors[s].pod]);
  }

  // the extinguisher's white cloud
  buildPowder() {
    const n = 220;
    const geo = new THREE.BufferGeometry();
    this.puffs = { pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), life: new Float32Array(n), n, next: 0 };
    geo.setAttribute('position', new THREE.BufferAttribute(this.puffs.pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const mat = new THREE.PointsMaterial({ size: 0.7, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.85 });
    this.powder = new THREE.Points(geo, mat);
    this.powder.frustumCulled = false;
    this.group.add(this.powder);
    for (let i = 0; i < n; i++) this.puffs.pos[i * 3 + 1] = -100;
  }
  spray(from, to, dt) {
    const P = this.puffs, k = Math.ceil(dt * 160);
    for (let j = 0; j < k; j++) {
      const i = P.next; P.next = (P.next + 1) % P.n;
      P.pos.set([from.x, from.y, from.z], i * 3);
      const d = to.clone().sub(from).normalize().multiplyScalar(5 + Math.random() * 2);
      P.vel.set([d.x + (Math.random() - 0.5) * 1.5, d.y + Math.random() * 0.8, d.z + (Math.random() - 0.5) * 1.5], i * 3);
      P.life[i] = 1.4;
    }
  }

  // ---- the menu on the way in ----
  buildUI() {
    const css = document.createElement('style');
    css.textContent = `
#pit-menu { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 45; width: min(760px, calc(100vw - 24px)); max-height: 70vh; overflow-y: auto; display: none;
  padding: 16px 18px 18px; border-radius: 16px; background: rgba(12, 15, 20, 0.9); color: #eef0f3; font: 15px system-ui, -apple-system, sans-serif; box-shadow: 0 10px 34px rgba(0,0,0,0.5); }
#pit-menu .pm-step { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
#pit-menu h4 { margin: 0; font-size: 13px; letter-spacing: 0.24em; color: #e5b53d; }
#pit-menu .pm-crumbs { font-size: 12px; letter-spacing: 0.16em; color: #6f7883; }
#pit-menu .pm-crumbs b { color: #eef0f3; }
#pit-menu button { font: inherit; color: inherit; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); border-radius: 12px; cursor: pointer;
  min-height: 58px; padding: 10px 16px; font-size: 17px; font-weight: 600; -webkit-tap-highlight-color: transparent; }
#pit-menu button:hover { border-color: rgba(255,255,255,0.4); }
#pit-menu button.on { background: #e5b53d; color: #15171a; border-color: #e5b53d; }
#pit-menu .pm-tyres { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 10px; }
#pit-menu .pm-tyre { display: flex; flex-direction: column; align-items: center; gap: 6px; min-height: 104px; }
#pit-menu .pm-tyre i { width: 38px; height: 38px; border-radius: 50%; border: 7px solid #222; box-shadow: inset 0 0 0 3px var(--c); display: block; }
#pit-menu .pm-tyre span { font-size: 13px; font-weight: 500; color: #c9ced6; }
#pit-menu .pm-wide { width: 100%; margin-top: 10px; }
#pit-menu .pm-row { display: grid; grid-template-columns: 1fr 120px 120px; gap: 10px; align-items: center; padding: 6px 0; }
#pit-menu .pm-row small { display: block; color: #8d96a3; font-size: 12px; font-weight: 400; }
#pit-menu .pm-bad { color: #ff7a6e; font-weight: 600; padding: 6px 0; }
#pit-menu .pm-gauge { height: 18px; border-radius: 9px; background: rgba(255,255,255,0.08); overflow: hidden; margin: 4px 0 6px; }
#pit-menu .pm-gauge div { height: 100%; background: linear-gradient(90deg, #c98d1c, #e5b53d); }
#pit-menu .pm-fuel { display: flex; justify-content: space-between; font-size: 14px; color: #c9ced6; font-variant-numeric: tabular-nums; }
#pit-menu .pm-note { color: #8d96a3; font-size: 13px; margin-top: 8px; }
body.pit-auto #touch > *:not(.t-menu):not(.t-sheet):not(.t-rotate) { visibility: hidden !important; }
#pit-limiter { position: fixed; left: 50%; top: 12%; transform: translateX(-50%); z-index: 44; display: none; padding: 5px 12px; border-radius: 8px;
  background: rgba(20, 60, 140, 0.85); color: #fff; font: 700 13px system-ui, sans-serif; letter-spacing: 0.14em; pointer-events: none; }
#pit-clock { position: fixed; left: 50%; top: 18%; transform: translateX(-50%); z-index: 44; display: none; padding: 8px 16px; border-radius: 10px;
  background: rgba(12, 15, 20, 0.82); color: #fff; font: 700 22px system-ui, sans-serif; font-variant-numeric: tabular-nums; pointer-events: none; text-align: center; }
#pit-clock small { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; color: #e5b53d; }
@media (max-width: 760px), (max-height: 520px) { #pit-menu { bottom: 8px; max-height: 62vh; padding: 12px; } #pit-menu button { min-height: 50px; font-size: 16px; } #pit-menu .pm-row { grid-template-columns: 1fr 96px 96px; } }`;
    document.head.appendChild(css);
    this.menu = document.createElement('div'); this.menu.id = 'pit-menu';
    this.menu.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.limiterEl = document.createElement('div'); this.limiterEl.id = 'pit-limiter'; this.limiterEl.textContent = `PIT LIMITER ${LIMIT_KMH}`;
    this.clockEl = document.createElement('div'); this.clockEl.id = 'pit-clock';
    document.body.append(this.menu, this.limiterEl, this.clockEl);
  }

  // what's wrong with the car, and what can be done about it
  damage() {
    const P = this.physics, F = this.hooks.f1, out = [];
    const corner = ['Front left', 'Front right', 'Rear left', 'Rear right'];
    if (P.engineBlown) out.push({ key: 'engine', name: 'Engine blown', serious: true });
    if (P.fuelLeak > 0) out.push({ key: 'tank', name: 'Fuel tank split', serious: true });
    if (P.radiator < 0.5) out.push({ key: 'rad', name: 'Radiator smashed', serious: true });
    else if (P.radiator < 0.999) out.push({ key: 'rad', kind: 'rad', name: 'Radiator holed (patch, top up)', time: 6 });
    if (P.sumpLeak > 0) out.push({ key: 'sump', kind: 'rad', name: 'Sump cracked (new sump, top up oil)', time: 8,
      fix: () => { P.sumpLeak = 0; P.oilLevel = 1; } });
    if (P.radiatorBlock > 0.15 || P.filterClog > 0.15) out.push({ key: 'clean', kind: 'rad', name: 'Radiator and air filter clogged (clean out)', time: 4,
      fix: () => { P.radiatorBlock = 0; P.filterClog = 0; } });
    P.suspDamage.forEach((d, pi) => {
      if (d >= 1) out.push({ key: 'susp' + pi, name: `${corner[pi]} wheel torn off`, serious: true });
      else if (d > 0.03 || Math.abs(P.wheelBend[pi]) > 0.004) out.push({ key: 'susp' + pi, kind: 'susp', pi, name: `${corner[pi]} suspension bent`, time: Math.round(4 + 8 * d) });
    });
    if (P.spec.wings) {
      const fw = Math.max(P.wingDamage.fl, P.wingDamage.fr);
      if (fw > 0.02) out.push({ key: 'wingF', kind: 'wing', part: 'front', name: fw >= 1 ? 'Front wing broken off' : 'Front wing damaged', time: 8 });
      if (P.wingDamage.rear > 0.02) out.push({ key: 'wingR', kind: 'wing', part: 'rear', name: P.wingDamage.rear >= 1 ? 'Rear wing broken off' : 'Rear wing damaged', time: 11 });
    }
    if (F?.mirrors) for (const s of ['l', 'r']) if (F.mirrors[s].off) out.push({ key: 'mir' + s, kind: 'mirror', side: s, name: `${s === 'l' ? 'Left' : 'Right'} mirror knocked off`, time: 3 });
    return out;
  }
  badTyres() { return this.physics.tyres.map((t, i) => (t.blown || t.rim || t.pressure < 0.85 || t.leak > 0) && !t.detached ? i : -1).filter((i) => i >= 0); }

  // THE MENU: three steps, like GT7's. 1 the tyres, 2 the damage (only
  // if there is any), 3 the fuel (live while it fills)
  showMenu(step = this.step) {
    this.step = step;
    const P = this.physics, ch = this.choice, dmg = this.damage();
    for (const d of dmg) if (!d.serious && ch.repair[d.key] == null) ch.repair[d.key] = true;
    const serious = dmg.filter((d) => d.serious), fixable = dmg.filter((d) => !d.serious);
    const hasDamage = dmg.length > 0;
    const crumbs = ['TYRES', ...(hasDamage ? ['DAMAGE'] : []), 'FUEL'].map((c) => (c.toLowerCase() === step ? `<b>${c}</b>` : c)).join(' · ');
    let html = `<div class="pm-step"><h4>PIT STOP${this.penalty ? ` · ${PENALTY_S} s PENALTY` : ''}</h4><span class="pm-crumbs">${crumbs}</span></div>`;
    if (step === 'tyres') {
      const COL = { slick: '#e8483b', wet: '#3b8de8', road: '#d8d8d8', dirt: '#b8874a', snow: '#9fd0e8' };
      html += '<div class="pm-tyres">' + this.hooks.tyreChoices().map(([id, name, kind]) =>
        `<button class="pm-tyre" data-t="${id}"><i style="--c:${COL[kind] || '#e5b53d'}"></i>${id}<span>${name}</span></button>`).join('') + '</div>';
      html += `<button class="pm-wide" data-t="">Don't change tyres</button>`;
      if (this.badTyres().length) html += '<div class="pm-note">Damaged tyres are changed anyway.</div>';
    } else if (step === 'damage') {
      if (serious.length) {
        html += '<div class="pm-bad">Too serious to fix: the team will retire the car</div>' + serious.map((d) => `<div class="pm-bad">${d.name}</div>`).join('');
      } else {
        html += fixable.map((d) => `<div class="pm-row"><span>${d.name}<small>${d.time} s to repair</small></span>`
          + `<button data-r="${d.key}" data-v="1" class="${ch.repair[d.key] ? 'on' : ''}">Repair</button><button data-r="${d.key}" data-v="0" class="${ch.repair[d.key] ? '' : 'on'}">Leave</button></div>`).join('');
        html += `<button class="pm-wide on" data-done="damage">Done</button>`;
      }
    } else if (step === 'fuel') {
      const cap = P.spec.fuelCapacity;
      html += `<div class="pm-fuel"><span>FUEL</span><span class="pm-litres">${P.fuel.toFixed(1)} / ${cap.toFixed(0)} L</span></div>`
        + `<div class="pm-gauge"><div class="pm-level" style="width:${(100 * P.fuel / cap).toFixed(1)}%"></div></div>`;
      if (!ch.fuel) html += '<div class="pm-note">No fuel this stop.</div>';
      else if (this.fuelling) html += `<button class="pm-wide on" data-f="stop">Stop refuelling</button>`;
      else if (this.flags?.fuelDone) html += '<div class="pm-note">Refuelled.</div>';
      else html += `<button class="pm-wide" data-f="no">Don't refuel</button><div class="pm-note">It fills up at the box unless you say not to.</div>`;
    }
    this.menu.innerHTML = html;
    this.menu.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      if (b.dataset.t != null) { ch.tyres = b.dataset.t || null; this.tyresPicked = true; this.showMenu(hasDamage ? 'damage' : 'fuel'); return; }
      if (b.dataset.r != null) { ch.repair[b.dataset.r] = b.dataset.v === '1'; this.showMenu(); return; }
      if (b.dataset.done === 'damage') { this.damageDone = true; this.showMenu('fuel'); return; }
      if (b.dataset.f === 'no' || b.dataset.f === 'stop') { this.stopFuel(); this.showMenu(); return; }
    }));
    this.menu.style.display = 'block';
  }
  get choicesDone() { return this.tyresPicked && (this.damageDone || !this.damage().some((d) => !d.serious)); }
  // "Don't refuel" / "Stop refuelling": the refueller pulls out now
  stopFuel() {
    this.choice.fuel = false;
    this.fuelStop = true;
    if (this.fuelling) { this.fuelling = false; this.glugStop?.(); }
    if (this.flags) this.flags.fuelDone = true;
  }
  estimate() {
    const P = this.physics, ch = this.choice, dmg = this.damage();
    let t = 0;
    const wheels = ch.tyres || this.badTyres().length;
    if (wheels) t = Math.max(t, 4.5);
    const fixes = dmg.filter((d) => !d.serious && ch.repair[d.key]);
    let mech = 0;
    for (const d of fixes) mech += d.time;
    t = Math.max(t, mech + (fixes.length ? 1.5 : 0));
    if (ch.fuel) t = Math.max(t, 2 + Math.max(0, P.spec.fuelCapacity - P.fuel) / this.fuelRate());
    return t + 1.5;
  }
  fuelRate() { return Math.max(4, this.physics.spec.fuelCapacity / 9); }   // (a full tank in about 9 s)

  clearLitter() { for (const l of this.litter || []) this.group.remove(l); this.litter = []; }
  reset() {
    this.clearLitter();
    this.phase = 'off';
    this.holding = false;
    this.penalty = false;
    this.lift.f = this.lift.r = this.liftWant.f = this.liftWant.r = 0;
    this.wheelGone.fill(false);
    this.choice = { tyres: null, fuel: true, repair: {} };
    this.tyresPicked = this.damageDone = this.fuelStop = this.serviceStarted = false;
    this.fuelling = false;
    this.step = 'tyres';
    this.menu.style.display = 'none';
    this.limiterEl.style.display = 'none';
    document.body.classList.remove('pit-auto');
    this.clockEl.style.display = 'none';
    this.hose.visible = false;
    for (const n of this.nuts) n.visible = false;
    for (const s of Object.values(this.spareParts)) { s.wrap.visible = false; this.group.add(s.wrap); }
    // everyone in the garage, the kit in its place
    this.crew.forEach((p, k) => {
      p.queue = []; p.follow = null; p.want = 'STAND';
      for (const h of p.held) this.group.add(h);
      p.held = [];
      const [x, z] = this.idleSpot(k);
      p.place(x, z, -Math.PI / 2);
    });
    this.newWheels.forEach((w, i) => { this.group.add(w); w.visible = true; const [x, z] = this.garage(4.5, -2 + i * 0.8); w.position.set(x, this.groundAt(x, z) + this.hooks.wheels[i].r, z); w.rotation.set(0, Math.PI / 2, 0); });
    this.oldWheels.forEach((w) => { this.group.add(w); w.visible = false; });
    { const [x, z] = this.garage(0.8, -2.6); this.extinguisher.position.set(x, this.groundAt(x, z), z); this.extinguisher.rotation.set(0, 0, 0); this.group.add(this.extinguisher); }
    for (const t of [...this.guns, ...this.jacks, this.lollyProp, this.churn]) { if (t.parent) t.parent.remove(t); }
  }
  idleSpot(k) {
    // a loose crowd inside the garage
    const col = k % 6, row = Math.floor(k / 6);
    return this.garage(1.6 + row * 1.4, -2.3 + col * 0.92);
  }

  // ---- every frame, before the car moves: the limiter, the driving ----
  control(input, dt) {
    const P = this.physics, x = P.x, z = P.z, kmh = Math.abs(P.vx) * 3.6;
    const inLane = this.inLane(x, z);
    const limit = this.inLimit(x, z);
    // over the pit entry line: the menu comes up, the crew come out, and
    // the driver takes it from here (going faster than the limit: a penalty)
    if (this.phase === 'off' && limit && !this.wasLimit && Math.cos(P.heading) < 0 && this.hooks.driveThrough?.()) {
      // a drive-through: down the lane at the limit and straight out again, no stop
      this.phase = 'out'; this.driveThrough = true;
      this.penalty = kmh > LIMIT_KMH + 3;
      if (this.penalty) this.hooks.toast?.(`PIT LANE SPEEDING`);
    } else if (this.phase === 'off' && limit && !this.wasLimit && Math.cos(P.heading) < 0) {
      this.phase = 'in';
      this.penalty = kmh > LIMIT_KMH + 3;
      if (this.penalty) { this.hooks.toast?.(`PIT LANE SPEEDING: ${PENALTY_S} s PENALTY`); this.hooks.invalidLap?.(); }
      this.choice = { tyres: null, fuel: true, repair: {} };
      this.tyresPicked = this.damageDone = this.fuelStop = this.serviceStarted = false;
      this.fuelling = false;
      this.showMenu('tyres');
      this.crewOut();
    }
    this.wasLimit = limit;
    // (pushed out of the lane some other way: hand back)
    if ((this.phase === 'in' || this.phase === 'out') && !inLane) this.leave();
    this.limiterEl.style.display = limit && !this.holding ? 'block' : 'none';
    document.body.classList.toggle('pit-auto', this.phase === 'in' || this.phase === 'out' || this.holding);
    if (limit && kmh > LIMIT_KMH) input.throttle = 0;   // (the limiter: the power cut, as the real ones do)
    if (this.phase === 'in' || this.phase === 'out') this.drive(input, dt);
    if (this.holding) { input.throttle = 0; input.brake = 1; input.steer = 0; input.handbrake = false; }
    return this.holding;
  }

  // The driver on his own: down the fast lane, across into the box and
  // onto his marks; then out, back across and up the exit road
  drive(input, dt) {
    const P = this.physics, B = this.box, x = P.x, z = P.z, v = P.vx;
    const FAST = 15.4, PIT = this.pit;
    const laneX = (zz) => {
      if (this.phase === 'in') return zz > B.z + 28 ? FAST : zz > B.z + 10 ? FAST + (B.x - FAST) * (1 - (zz - B.z - 10) / 18) : B.x;
      if (this.driveThrough) return zz > PIT.z0 ? FAST : FAST + (9 - FAST) * Math.min(1, (PIT.z0 - zz) / (PIT.z0 - PIT.exitZ));
      if (zz > B.z - 14) return B.x + (FAST - B.x) * Math.min(1, (B.z - zz) / 14);
      if (zz > PIT.z0) return FAST;
      return FAST + (9 - FAST) * Math.min(1, (PIT.z0 - zz) / (PIT.z0 - PIT.exitZ));   // (up the exit road, back to the track)
    };
    const look = 5 + Math.abs(v) * 0.35;
    const az = -look, ax = laneX(z - look) - x;
    const fx = Math.sin(P.heading), fz = Math.cos(P.heading), lx = Math.cos(P.heading), lz = -Math.sin(P.heading);
    const alpha = Math.atan2(ax * lx + az * lz, ax * fx + az * fz);
    const wb = (P.spec.cgToFront || 1.2) + (P.spec.cgToRear || 1.2);
    const wheel = Math.atan(2 * wb * Math.sin(alpha) / Math.hypot(ax, az));
    const lim = P.spec.maxSteer / (1 + Math.abs(v) / 14);
    input.steer = Math.max(-1, Math.min(1, wheel / lim));
    input.handbrake = false;
    let want;
    if (this.phase === 'in') {
      const dist = z - B.z;
      want = Math.min(LIMIT_KMH / 3.6 - 0.5, Math.sqrt(2 * 3 * Math.max(0, dist - 0.15)));
      if (dist < 0.7 && Math.abs(v) < 1.5) { this.arrive(); return; }
    } else {
      want = z > PIT.z0 ? LIMIT_KMH / 3.6 - 0.5 : 22;
      if (z < PIT.exitZ + 6) { this.leave(); return; }   // (back on the track: yours)
    }
    input.throttle = Math.max(0, Math.min(0.6, (want - v) * 0.5));
    input.brake = Math.max(0, Math.min(1, (v - want) * 0.6 + (this.phase === 'in' && z - B.z < 0.6 ? 0.6 : 0)));
    // (with a manual gearbox he changes gear himself too)
    if (P.transmission === 'manual' && !P.shiftTimer) {
      if (P.rpm > P.spec.redline * 0.85) P.shiftUp?.();
      else if (P.gear > 1 && P.rpm < P.spec.idleRpm * 1.6) P.shiftDown?.();
    }
  }

  // on the marks: what happens now
  arrive() {
    const P = this.physics;
    this.phase = 'stopped';
    this.holding = true;
    this.carPose = { x: P.x, z: P.z, h: P.heading };
    this.from = { ...this.carPose };
    this.settle = 0;
    this.stopTime = 0;
    this.clockEl.style.display = 'block';
    if (P.transmission === 'manual' && P.gear > 1) P.gear = 1;
    const dmg = this.damage();
    this.serious = dmg.some((d) => d.serious);
    this.flags = { fireOut: !(P.burning ?? P.onFire), served: !this.penalty, jackF: false, jackR: false, wheel: [null, null, null, null], suspDone: [true, true, true, true], jobsDone: false, fuelDone: false, dropped: false, go: false };
    this.penaltyLeft = this.penalty ? PENALTY_S : 0;
    this.wheelsOff = []; this.jobs = [];
    // (the fire, or the team retiring the car, start now; the work waits
    // until you've chosen your tyres and repairs)
    this.stage = 'arrive';
    this.scriptStop();
    if (this.serious) this.showMenu('damage');
  }
  startService() {
    const P = this.physics, dmg = this.damage();
    this.serviceStarted = true;
    this.jobs = dmg.filter((d) => !d.serious && this.choice.repair[d.key]);
    // which wheels come off: a tyre change (all four), damaged tyres,
    // and any corner having its suspension fixed
    const wheels = new Set();
    if (this.choice.tyres) [0, 1, 2, 3].forEach((i) => wheels.add(i));
    for (const i of this.badTyres()) wheels.add(i);
    for (const j of this.jobs) if (j.kind === 'susp') wheels.add(j.pi);
    this.wheelsOff = [...wheels];
    this.flags.fuelDone = !this.choice.fuel;
    for (const j of this.jobs) if (j.kind === 'susp') this.flags.suspDone[j.pi] = false;
    this.stage = 'service';
    this.scriptStop();
    if (this.step !== 'fuel') this.showMenu('fuel');
  }

  leave() {
    if (this.driveThrough) { this.driveThrough = false; this.hooks.served?.(); }
    this.phase = 'off';
    this.menu.style.display = 'none';
    this.limiterEl.style.display = 'none';
    document.body.classList.remove('pit-auto');
    this.crewHome();
  }

  // ---- the crew's work ----
  crewOut() {
    const H = this.hooks, B = this.box;
    this.clearLitter();
    const facing = (lx, lz) => this.W(lx, lz);   // a point on the car to look at
    H.wheels.forEach((w, i) => {
      const s = Math.sign(w.x), hw = w.w / 2;
      const g = this.gun[i], off = this.off[i], on = this.on[i];
      g.run([{ fn: () => g.hold(this.guns[i], 'hand') }, { go: this.W(w.x + s * (hw + 1.1), w.z) }, { face: facing(w.x, w.z) }, { pose: 'STAND' }]);
      off.run([{ go: this.W(w.x + s * (hw + 1.0), w.z + (i < 2 ? 0.95 : -0.95)) }, { face: facing(w.x, w.z) }]);
      on.run([{ go: [this.newWheels[i].position.x - 0.5, this.newWheels[i].position.z] }, { fn: () => { on.hold(this.newWheels[i]); this.newWheels[i].position.set(0, 0, 0); this.newWheels[i].rotation.set(0, 0, 0); } }, { pose: 'CARRY' },
        { go: this.W(w.x + s * (hw + 1.1), w.z + (i < 2 ? -0.95 : 0.95)) }, { face: facing(w.x, w.z) }]);
    });
    this.jackF.run([{ fn: () => this.jackF.hold(this.jacks[0], 'root') }, { go: this.W(0, H.len.nose + 2.6) }, { face: facing(0, 0) }]);
    this.jackR.run([{ fn: () => this.jackR.hold(this.jacks[1], 'root') }, { go: this.W(0, -H.len.tail - 2.6) }, { face: facing(0, 0) }]);
    this.lolly.run([{ fn: () => this.lolly.hold(this.lollyProp, 'hand') }, { go: this.W(-1.1, H.len.nose + 1.0) }, { face: facing(-0.2, H.len.nose - 0.4) }, { pose: 'LOLLY' }]);
    this.fueller.run([{ fn: () => this.fueller.hold(this.churn) }, { pose: 'CARRY' }, { go: this.W(1.9, -0.8) }, { face: facing(0.3, -0.35) }]);
    this.spare1.run([{ go: this.garage(-0.6, 0.8) }, { face: facing(0, 0) }]);
    this.spare2.run([{ go: this.garage(-0.6, -0.8) }, { face: facing(0, 0) }]);
  }

  crewHome() {
    this.crew.forEach((p, k) => {
      const list = [{ pose: 'STAND' }, { go: this.idleSpot(k) }, { face: -Math.PI / 2 }];
      // (kit put back where it lives)
      list.push({ fn: () => this.putAway(p) });
      p.run(list);
    });
  }
  putAway(p) {
    for (const h of p.held) {
      if (h === this.extinguisher) { const [x, z] = this.garage(0.8, -2.6); this.group.add(h); h.position.set(x, this.groundAt(x, z), z); h.rotation.set(0, 0, 0); continue; }
      const nw = this.newWheels.indexOf(h);
      if (nw >= 0) { this.group.add(h); const [x, z] = this.garage(4.5, -2 + nw * 0.8); h.position.set(x, this.groundAt(x, z) + this.hooks.wheels[nw].r, z); h.rotation.set(0, Math.PI / 2, 0); continue; }
      if (h.parent) h.parent.remove(h);
    }
    p.held = [];
  }

  // a wheel (or a part) moving smoothly from one place to another
  tween(obj, toPos, toQuat, secs, done) {
    this.group.attach(obj);   // (the group sits at the world's origin, unturned)
    (this.tweens ||= []).push({ obj, fromP: obj.position.clone(), fromQ: obj.quaternion.clone(), toP: toPos, toQ: toQuat, t: 0, secs, done });
  }

  hubWorld(i, out = new THREE.Vector3()) {
    const w = this.hooks.wheels[i], s = Math.sign(w.x);
    out.set(w.x, w.r + (i < 2 ? this.lift.f : this.lift.r), w.z);
    return this.hooks.car.localToWorld(out);
  }
  hubQuat() { return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.carPose.h + Math.PI / 2, 0)); }   // (a wheel's axle across the car)

  scriptStop() {
    const H = this.hooks, F = this.flags;
    const ready = () => F.fireOut && F.served && !this.serious;
    const facing = (lx, lz) => this.W(lx, lz, this.carPose);
    const Wc = (lx, lz) => this.W(lx, lz, this.carPose);
    // --- on fire: the nearest man jumps back, runs for the extinguisher ---
    if (!F.fireOut && this.stage === 'arrive') {
      const p = this.spare1, eng = H.firePoint?.() || H.enginePoint;
      p.run([
        { pose: 'SHOCK' }, { go: [p.x + 1.4, p.z + 0.4], back: true }, { wait: 0.35 }, { pose: 'STAND' },
        { go: this.garage(0.4, -2.2), run: true }, { fn: () => { p.hold(this.extinguisher, 'hand'); this.extinguisher.position.set(0, -0.02, 0); this.extinguisher.rotation.set(Math.PI, 0, 0); } },
        { go: Wc(1.9, eng[2]), run: true }, { face: facing(0, eng[2]) }, { pose: 'SPRAY' },
        { fn: () => { this.spraying = true; this.sprayLeft = 2.6; this.sound?.ctx && this.hiss(2.6); } },
        { until: () => F.fireOut }, { pose: 'STAND' }, { go: this.garage(0.6, -2.4) }, { fn: () => this.putAway(p) },
      ]);
      // everyone else steps back from the flames
      for (const q of this.crew) if (q !== p) q.queue.unshift({ go: [q.x + (q.x < this.carPose.x ? -0.8 : 0.8), q.z], back: true });
    }
    // --- retired: push it back into the garage ---
    if (this.serious) {
      // four of them, one at each corner, leaning on the car
      const pushers = [this.off[0], this.off[1], this.off[2], this.off[3]];
      const spots = [[1.35, H.len.nose - 0.9], [-1.35, H.len.nose - 0.9], [1.35, -H.len.tail + 0.9], [-1.35, -H.len.tail + 0.9]];
      pushers.forEach((p, k) => p.then([{ until: () => F.fireOut }, { pose: 'STAND' }, { go: Wc(...spots[k]) }, { fn: () => {
        p.want = 'PUSH';
        p.follow = () => {
          const [x, z] = this.W(spots[k][0], spots[k][1], this.carPose), [cx, cz] = this.W(0, spots[k][1], this.carPose);
          return [x, z, Math.atan2(cx - x, cz - z), this.pushing ? 1.2 : 0];
        };
      } }]));
      for (const q of this.crew) if (!pushers.includes(q) && q !== this.spare1) q.then([{ until: () => F.fireOut }, { pose: 'STAND' }]);
      this.lolly.then([{ until: () => F.fireOut }, { pose: 'STAND' }]);
      this.wheelingT = -1;
      return;
    }
    if (this.stage === 'arrive') return;   // (the work itself starts once you've chosen)
    // --- the jacks ---
    const needJacks = this.wheelsOff.length > 0 || this.jobs.some((j) => j.kind === 'wing' || j.kind === 'susp');
    if (!needJacks) { F.jackF = F.jackR = true; F.dropped = true; }
    const jackJob = (p, end, lz, prop) => p.then([
      { until: ready }, { go: Wc(0, lz) }, { face: facing(0, 0) }, { pose: 'JACK', t: 0.25 },
      { fn: () => { this.liftWant[end] = 0.075; this.clunk(); } }, { wait: 0.3 }, { fn: () => { F[end === 'f' ? 'jackF' : 'jackR'] = true; } },
      { until: () => this.allWorkDone() }, { fn: () => { this.liftWant[end] = 0; this.clunk(); } }, { wait: 0.3 },
      { fn: () => { F['clear' + end] = true; if (F.clearf && F.clearr) F.dropped = true; } },
      { pose: 'STAND' }, { go: Wc(0, lz + (end === 'f' ? 1.4 : -1.4)), back: true },
    ]);
    if (needJacks) { jackJob(this.jackF, 'f', H.len.nose + 1.5, this.jacks[0]); jackJob(this.jackR, 'r', -H.len.tail - 1.5, this.jacks[1]); }
    const jacked = () => F.jackF && F.jackR;
    // --- the wheels ---
    for (const i of this.wheelsOff) {
      const w = H.wheels[i], s = Math.sign(w.x), hw = w.w / 2, front = i < 2;
      const g = this.gun[i], off = this.off[i], on = this.on[i];
      const nut = this.nuts[i];
      const nutAt = (out) => { this.hubWorld(i, out); const side = new THREE.Vector3(s, 0, 0).applyQuaternion(H.car.quaternion); return out.addScaledVector(side, hw + 0.03); };
      g.then([
        { until: ready }, { go: Wc(w.x + s * (hw + 0.62), w.z) }, { face: facing(w.x, w.z) }, { pose: 'KNEEL' },
        { until: jacked },
        { fn: () => { this.gunSound(); nut.visible = true; this.nutSpin = this.nutSpin || [0, 0, 0, 0]; this.nutSpin[i] = 0.45; } }, { wait: 0.45 },
        { fn: () => { F.wheel[i] = 'loose'; } },
        { until: () => F.wheel[i] === 'fitted' },
        { fn: () => { this.gunSound(); this.nutSpin[i] = 0.45; } }, { wait: 0.45 },
        { fn: () => { F.wheel[i] = 'tight'; nut.visible = false; } }, { pose: 'KNEEL_UP', t: 0.35 },
        { until: () => F.dropped || this.flags.go }, { pose: 'STAND' }, { go: Wc(w.x + s * (hw + 1.5), w.z), back: true },
      ]);
      this.nutTrack = this.nutTrack || [];
      this.nutTrack[i] = nutAt;
      off.then([
        { until: ready }, { go: Wc(w.x + s * (hw + 0.55), w.z + (front ? 0.62 : -0.62)) }, { face: facing(w.x, w.z) },
        { until: () => F.wheel[i] === 'loose' }, { pose: 'REACH', t: 0.12 },
        { fn: () => {
          // (the old wheel slides off the hub into his hands)
          const ow = this.oldWheels[i];
          ow.visible = true;
          this.group.add(ow);
          this.hubWorld(i, ow.position); ow.quaternion.copy(this.hubQuat());
          this.wheelGone[i] = true;
          off.root.updateMatrixWorld(true);
          const end = new THREE.Vector3(); off.front.getWorldPosition(end);
          const q = new THREE.Quaternion(); off.front.getWorldQuaternion(q);
          this.tween(ow, end, q, 0.32, () => { off.front.attach(ow); off.held.push(ow); });
        } }, { wait: 0.33 }, { pose: 'CARRY' },
        { go: Wc(w.x + s * (hw + 1.6), w.z + (front ? 1.3 : -1.3)), back: true }, { fn: () => { F.wheel[i] = 'off'; } },
        { go: this.garage(3.2, -2.2 + i * 1.1) }, { fn: () => { const ow = this.oldWheels[i]; this.group.attach(ow); off.release(ow); const [x, z] = this.garage(3.6, -2.2 + i * 1.1); ow.position.set(x, this.groundAt(x, z) + 0.12, z); ow.rotation.set(Math.PI / 2, 0, 0); } },
        { pose: 'STAND' },
      ]);
      on.then([
        { until: ready }, { go: Wc(w.x + s * (hw + 0.62), w.z + (front ? -0.65 : 0.65)) }, { face: facing(w.x, w.z) },
        { until: () => F.wheel[i] === 'off' && F.suspDone[i] }, { pose: 'REACH', t: 0.1 },
        { fn: () => {
          const nw = this.newWheels[i];
          const end = new THREE.Vector3(); this.hubWorld(i, end);
          on.release(nw);
          this.tween(nw, end, this.hubQuat(), 0.3, () => {
            nw.visible = false;
            this.group.add(nw);
            this.wheelGone[i] = false;
            this.hooks.fitTyre(i, this.choice.tyres);
            F.wheel[i] = 'fitted';
          });
        } }, { wait: 0.35 }, { pose: 'STAND' }, { go: Wc(w.x + s * (hw + 1.4), w.z + (front ? -1.2 : 1.2)), back: true },
      ]);
    }
    // --- the mechanics: suspension, wings, mirrors, the radiator ---
    const s1 = this.spare1, s2 = this.spare2, jobs = this.jobs;
    const work = [], mirrorWork = [];
    for (const j of jobs) {
      if (j.kind === 'susp') {
        const w = H.wheels[j.pi], s = Math.sign(w.x), front = j.pi < 2;
        work.push({ go: Wc(w.x + s * (w.w / 2 + 0.6), w.z + (front ? -0.9 : 0.9)) }, { face: facing(w.x, w.z) },
          { until: () => F.wheel[j.pi] === 'off' }, { pose: 'WORK', t: j.time }, { fn: () => { H.repairSusp(j.pi); F.suspDone[j.pi] = true; } }, { pose: 'STAND' });
      } else if (j.kind === 'rad') {
        work.push({ go: Wc(1.1, 0.7) }, { face: facing(0.4, 0.7) }, { pose: 'BOLT', t: j.time }, { fn: () => (j.fix ? j.fix() : H.repairRadiator()) }, { pose: 'STAND' });
      } else if (j.kind === 'mirror') {
        // (the refueller does the mirrors, with a new one from the garage)
        const fp = this.fueller;
        const sp = this.spareParts['mirror' + j.side], m = H.f1.mirrors[j.side], sx = j.side === 'l' ? 1 : -1;
        mirrorWork.push({ go: this.garage(-0.3, 0.6) }, { fn: () => { fp.hold(sp.wrap, 'hand'); sp.wrap.visible = true; sp.wrap.position.set(0, -0.05, 0.05); } },
          { go: Wc(sx * 1.0, 0.56) }, { face: facing(sx * 0.4, 0.56) }, { pose: 'RIP', t: 0.35 }, { fn: () => { m.stalk.visible = false; this.clunk(0.5); } },
          { pose: 'BOLT', t: Math.max(1.2, j.time - 1) }, { fn: () => { sp.wrap.visible = false; fp.release(sp.wrap); this.group.add(sp.wrap); H.repairMirror(j.side); } }, { pose: 'STAND' });
      } else if (j.kind === 'wing') {
        const sp = this.spareParts[j.part], z = sp.mid.z, y = sp.mid.y;
        const groups = j.part === 'front' ? [H.f1.wings.fl, H.f1.wings.fr] : [H.f1.wings.rear];
        // he unbolts the old one and carries it off...
        work.push({ go: Wc(1.15, z) }, { face: facing(0, z) }, { until: jacked }, { pose: 'BOLT', t: 1.6 },
          { fn: () => {
            const held = new THREE.Group(); this.group.add(held);
            const pos = new THREE.Vector3(); s2.front.getWorldPosition(pos);
            held.position.copy(pos);
            let any = false;
            for (const g of groups) if (g.parent === H.car) { held.attach(g); any = true; }
            if (any) { s2.front.attach(held); s2.held.push(held); this.oldWing = held; }
            F.wingOff = j.part;
          } }, { pose: 'CARRY' },
          { go: Wc(2.7, z + 0.6), back: true }, { fn: () => {
            // (he puts the broken one down on the ground out of the way)
            if (this.oldWing) { s2.release(this.oldWing); this.group.attach(this.oldWing); const [gx, gz] = Wc(3.0, z + 0.6); this.oldWing.position.set(gx, this.groundAt(gx, gz) + 0.05, gz); }
          } }, { pose: 'STAND' },
          { go: Wc(1.15, z) }, { face: facing(0, z) }, { until: () => F.wingHeld === j.part },
          { pose: 'BOLT', t: Math.max(2, j.time - 5) }, { fn: () => {
            // (a copy of the broken one stays lying there; the car's own wing goes back on, as new)
            if (this.oldWing) { const left = this.oldWing.clone(true); this.group.add(left); this.litter.push(left); for (const g of [...this.oldWing.children]) this.group.attach(g); this.group.remove(this.oldWing); this.oldWing = null; }
            sp.wrap.visible = false; this.group.add(sp.wrap); s1.release(sp.wrap);
            H.repairWing(j.part);
            F.wingFitted = j.part; F.wingHeld = null;
          } }, { pose: 'STAND' });
        // ...while the other one brings the new one and holds it in place
        s1.then([{ until: () => F.fireOut }, { go: this.garage(-0.2, 1.2) }, { fn: () => { s1.hold(sp.wrap); sp.wrap.visible = true; sp.wrap.position.set(0, 0, 0.1); sp.wrap.rotation.set(0, Math.PI / 2, 0); } }, { pose: 'CARRY' },
          { go: Wc(-1.4, z) }, { face: facing(0, z) }, { until: () => F.wingOff === j.part },
          { go: Wc(-0.95, z) }, { fn: () => {
            const to = this.W3(0, y + (j.part === 'front' ? this.lift.f : this.lift.r), z, this.carPose);
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.carPose.h, 0));
            s1.release(sp.wrap);
            this.tween(sp.wrap, to, q, 0.45, () => { F.wingHeld = j.part; });
          } }, { pose: 'HOLD' }, { until: () => F.wingFitted === j.part }, { pose: 'STAND' }, { go: Wc(-1.6, z), back: true }]);
      }
    }
    F.mechDone = !work.length; F.mirrorsDone = !mirrorWork.length;
    s2.then([{ until: ready }, ...work, { fn: () => { F.mechDone = true; F.jobsDone = F.mirrorsDone; } }]);
    F.jobsDone = F.mechDone && F.mirrorsDone;
    // --- the fuel ---
    if (this.choice.fuel) {
      const fp = this.fueller, filler = H.fillerPoint;
      fp.then([{ until: ready }, { go: Wc(0.95, filler[2] - 0.15) }, { face: facing(0, filler[2]) }, { pose: 'REFUEL' },
        { fn: () => { if (!this.choice.fuel) { F.fuelDone = true; return; } this.fuelling = true; this.glug(); if (this.step === 'fuel') this.showMenu(); } },
        { until: () => this.fuelStop || !this.choice.fuel || this.physics.fuel >= this.physics.spec.fuelCapacity - 0.05 },
        { fn: () => { if (this.fuelling) this.glugStop?.(); this.fuelling = false; F.fuelDone = true; if (this.step === 'fuel') this.showMenu(); } }, { pose: 'CARRY' }, { go: Wc(2.0, filler[2] - 0.6), back: true }]);
    }
    if (mirrorWork.length) this.fueller.then([{ until: ready }, ...mirrorWork, { fn: () => { F.mirrorsDone = true; F.jobsDone = F.mechDone; } }]);
    // --- the lollipop: up when it's all done ---
    this.lolly.then([{ until: () => this.allWorkDone() && F.dropped && F.served && F.fireOut }, { wait: 0.25 }, { pose: 'LOLLY_UP', t: 0.25 },
      { fn: () => this.go() }]);
  }
  allWorkDone() {
    const F = this.flags;
    return F.jobsDone && F.fuelDone && this.wheelsOff.every((i) => F.wheel[i] === 'tight');
  }
  go() {
    this.flags.go = true;
    this.holding = false;
    this.phase = 'out';             // (he drives it out himself)
    this.menu.style.display = 'none';
    this.clockEl.innerHTML = `<small>PIT STOP</small>${this.stopTime.toFixed(1)} s`;
    setTimeout(() => { if (this.phase !== 'stopped') this.clockEl.style.display = 'none'; }, 2500);
    const P = this.physics;
    P.vx = P.vy = P.yawRate = 0;
    P.ground.synced = false;
    // everyone back once the car's gone
    this.crew.forEach((p, k) => p.then([{ until: () => this.phase !== 'out' || Math.hypot(P.x - this.box.x, P.z - this.box.z) > 9 }, { pose: 'STAND' }, { go: this.idleSpot(k) }, { face: -Math.PI / 2 }, { fn: () => this.putAway(p) }]));
  }

  // ---- every frame: the crew, the car on its marks, the clock ----
  update(dt, camera) {
    const P = this.physics;
    const near = Math.hypot(P.x - this.box.x, P.z - this.box.z) < 260 || this.phase !== 'off';
    P.noStall = this.phase !== 'off';   // (the crew don't let it stall while they're driving it)
    if (this.phase !== 'off' && P.stalled) P.restartEngine();
    this.group.visible = near;
    this.camera = camera;
    if (!near) return;
    // the car held on its marks (or wheeled in)
    if (this.holding) {
      if (this.phase === 'stopped') {
        this.settle = Math.min(1, this.settle + dt * 3);
        this.carPose.x = this.from.x + (this.box.x - this.from.x) * this.settle;
        this.carPose.z = this.from.z + (this.box.z - this.from.z) * this.settle;
        let dh = this.box.h - this.from.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        this.carPose.h = this.from.h + dh * this.settle;
        this.stopTime += dt;
        if (this.flags && !this.flags.go) {
          this.clockEl.innerHTML = `<small>${!this.flags.fireOut ? 'FIRE!' : this.penaltyLeft > 0 ? 'PENALTY' : this.serious ? 'RETIRING' : !this.serviceStarted ? 'CHOOSE YOUR TYRES' : 'PIT STOP'}</small>${this.stopTime.toFixed(1)} s`;
        }
        if (this.flags && this.flags.fireOut && this.penaltyLeft > 0) { this.penaltyLeft -= dt; if (this.penaltyLeft <= 0) this.flags.served = true; }
        if (!this.serious && !this.serviceStarted && this.choicesDone) this.startService();
        // (the fuel gauge, live)
        if (this.step === 'fuel' && this.menu.style.display !== 'none') {
          const cap = P.spec.fuelCapacity, l = this.menu.querySelector('.pm-litres'), g = this.menu.querySelector('.pm-level');
          if (l) l.textContent = `${P.fuel.toFixed(1)} / ${cap.toFixed(0)} L`;
          if (g) g.style.width = `${(100 * P.fuel / cap).toFixed(1)}%`;
        }
        if (this.serious && this.flags.fireOut && this.wheelingT < 0) {
          this.wheelingT = 0; this.phase = 'wheeling';
          this.hooks.retire?.();
          this.menu.style.display = 'none';
          this.clockEl.innerHTML = '<small>RETIRED</small>DNF';
        }
      }
      if (this.phase === 'wheeling') {
        // turned round in the lane, then pushed backwards into the garage
        const T = this.wheelingT += dt;
        const a = Math.min(1, Math.max(0, (T - 1) / 3)), b = Math.min(1, Math.max(0, (T - 4) / 5));
        const e = (u) => u * u * (3 - 2 * u);
        this.carPose.h = Math.PI + e(a) * Math.PI / 2;
        this.carPose.x = this.box.x + e(b) * (this.pit.garageX + 5.4 - this.box.x);
        this.carPose.z = this.box.z;
        this.pushing = T > 1 && T < 9;
        if (T > 9.5) {
          this.phase = 'retired';
          for (const p of this.off) { p.follow = null; p.want = 'STAND'; }
          this.hooks.toast?.('RETIRED: press R (or Reset) to start again');
          this.clockEl.style.display = 'none';
        }
      }
      P.x = this.carPose.x; P.z = this.carPose.z; P.heading = this.carPose.h;
      P.vx = P.vy = P.yawRate = 0;
      if (P.w4) P.w4.omega.fill(0);
      if (this.phase === 'wheeling' || this.phase === 'retired') { P.rpm = 0; P.engineLoad = 0; P.throttleAmount = 0; }
      else { P.rpm += ((P.engineDead ? 0 : P.spec.idleRpm) - P.rpm) * Math.min(1, dt * 4); P.engineLoad = 0; P.throttleAmount = 0; }
    }
    // the fire going out under the powder
    if (this.spraying) {
      const H = this.hooks, eng = H.firePoint?.() || H.enginePoint;
      const to = this.W3(eng[0], eng[1], eng[2], this.carPose);
      const from = new THREE.Vector3(); this.extinguisher.getWorldPosition(from); from.y += 0.5;
      this.spray(from, to, dt);
      this.sprayLeft -= dt;
      if (this.sprayLeft < 1.2 && !this.flags.fireOut) { H.extinguish(); }
      if (this.sprayLeft <= 0) { this.spraying = false; this.flags.fireOut = true; }
    }
    { const U = this.puffs, pos = U.pos;
      for (let i = 0; i < U.n; i++) {
        if (U.life[i] <= 0) continue;
        U.life[i] -= dt;
        pos[i * 3] += U.vel[i * 3] * dt; pos[i * 3 + 1] += U.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += U.vel[i * 3 + 2] * dt;
        U.vel[i * 3] *= 1 - dt * 2.5; U.vel[i * 3 + 1] = U.vel[i * 3 + 1] * (1 - dt * 2.5) + dt * 0.4; U.vel[i * 3 + 2] *= 1 - dt * 2.5;
        if (U.life[i] <= 0) pos[i * 3 + 1] = -100;
      }
      this.powder.geometry.attributes.position.needsUpdate = true; }
    // the jacks lifting and dropping
    for (const k of ['f', 'r']) this.lift[k] += (this.liftWant[k] - this.lift[k]) * Math.min(1, dt * (this.liftWant[k] > this.lift[k] ? 9 : 14));
    // refuelling
    if (this.fuelling) {
      P.fuel = Math.min(P.spec.fuelCapacity, P.fuel + this.fuelRate() * dt);
      const a = new THREE.Vector3(); this.churn.getWorldPosition(a); a.y += 0.25;
      const f = this.hooks.fillerPoint, b = this.W3(f[0], f[1] + this.lift.r * 0.5, f[2], this.carPose);
      const d = b.clone().sub(a);
      this.hose.visible = true;
      this.hose.position.copy(a);
      this.hose.scale.set(1, d.length(), 1);
      this.hose.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    } else this.hose.visible = false;
    // the nuts spinning on and off
    if (this.nutTrack) for (let i = 0; i < 4; i++) {
      const n = this.nuts[i];
      if (!n.visible || !this.nutTrack[i]) continue;
      this.nutTrack[i](n.position);
      n.quaternion.copy(this.hubQuat());
      if (this.nutSpin && this.nutSpin[i] > 0) { this.nutSpin[i] -= dt; this.nutAngle = (this.nutAngle || 0) + dt * 60; }
      n.rotateZ(this.nutAngle || 0);
    }
    this.t = (this.t || 0) + dt;
    // things being handed over
    if (this.tweens) {
      for (const tw of this.tweens) {
        tw.t += dt;
        const u = Math.min(1, tw.t / tw.secs), e = u * u * (3 - 2 * u);
        tw.obj.position.lerpVectors(tw.fromP, tw.toP, e);
        tw.obj.quaternion.slerpQuaternions(tw.fromQ, tw.toQ, e);
        if (u >= 1 && !tw.ended) { tw.ended = true; tw.done?.(); }
      }
      this.tweens = this.tweens.filter((tw) => !tw.ended);
    }
    for (const p of this.crew) p.update(dt, this.groundAt);
    // the jacks stand on the ground in front of their men
    for (const [k, p] of [[0, this.jackF], [1, this.jackR]]) {
      const j = this.jacks[k];
      if (!p.held.includes(j)) continue;
      if (j.parent !== p.root) p.root.add(j);
      j.position.set(0, 0, 0);
    }
    if (this.phase === 'off' && !this.crew.some((p) => p.busy)) this.limiterEl.style.display = 'none';
  }

  // ---- sounds (made on the spot: no recordings) ----
  out(gain, at) {
    const ctx = this.sound?.ctx, dest = this.sound?.master;
    if (!ctx || !dest) return null;
    const g = ctx.createGain();
    const d = this.camera ? this.camera.position.distanceTo(at || this.W3(0, 0.5, 0, this.carPose)) : 5;
    g.gain.value = gain / (1 + d / 5);
    g.connect(dest);
    return g;
  }
  noiseBuf() {
    const ctx = this.sound.ctx;
    if (this.nb) return this.nb;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (this.nb = b);
  }
  // the wheel gun: a hard, rattling "brrrrt" of air-hammer blows
  gunSound() {
    const o = this.out(0.9); if (!o) return;
    const ctx = this.sound.ctx, t = ctx.currentTime, len = 0.42;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.4;
    const am = ctx.createGain(); am.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 42;
    const lg = ctx.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(1, t + 0.02); env.gain.setValueAtTime(1, t + len - 0.06); env.gain.linearRampToValueAtTime(0, t + len);
    src.connect(bp).connect(am).connect(env).connect(o);
    // ...and the thud of each blow
    const thud = ctx.createOscillator(); thud.type = 'triangle'; thud.frequency.value = 140;
    const tg = ctx.createGain(); tg.gain.value = 0;
    const lg2 = ctx.createGain(); lg2.gain.value = 0.35; lfo.connect(lg2).connect(tg.gain);
    thud.connect(tg).connect(env);
    src.start(t, Math.random()); src.stop(t + len); lfo.start(t); lfo.stop(t + len); thud.start(t); thud.stop(t + len);
  }
  // a jack going up or down: a short sharp click (approved as "just the click")
  clunk(gain = 1) {
    const o = this.out(1.1 * gain); if (!o) return;
    const ctx = this.sound.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.setValueAtTime(1, t); g.gain.setTargetAtTime(0, t, 0.012);
    src.connect(hp).connect(g).connect(o); src.start(t, Math.random()); src.stop(t + 0.09);
  }
  // the extinguisher: a "PSSHH" as the valve opens, then a smooth roar of
  // powder that swells and fades in slow gentle waves, fading out at the end
  hiss(secs) {
    const o = this.out(0.8); if (!o) return;
    const ctx = this.sound.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf(); src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const hi = ctx.createBiquadFilter(); hi.type = 'highpass'; hi.frequency.value = 5000;
    const hiG = ctx.createGain(); hiG.gain.value = 0.35;
    const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 180;
    const loG = ctx.createGain(); loG.gain.value = 0.8;
    const level = ctx.createGain(); level.gain.value = 1;
    // (the slow waves: two gentle wobbles that drift in and out of step)
    const w1 = ctx.createOscillator(); w1.frequency.value = 1.7 + Math.random() * 0.4;
    const w2 = ctx.createOscillator(); w2.frequency.value = 2.6 + Math.random() * 0.4;
    const wg1 = ctx.createGain(); wg1.gain.value = 0.16; const wg2 = ctx.createGain(); wg2.gain.value = 0.12;
    w1.connect(wg1).connect(level.gain); w2.connect(wg2).connect(level.gain);
    const hiW = ctx.createOscillator(); hiW.frequency.value = 1.1; const hiWG = ctx.createGain(); hiWG.gain.value = 0.1;
    hiW.connect(hiWG).connect(hiG.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(2.6, t + 0.012);                 // (the valve opening)
    env.gain.setTargetAtTime(1, t + 0.012, 0.05);
    env.gain.setValueAtTime(1, t + Math.max(0.1, secs - 0.6));
    env.gain.linearRampToValueAtTime(0, t + secs);                     // (a smooth fade, no splutter)
    src.connect(hp).connect(lp).connect(level);
    src.connect(hi).connect(hiG).connect(level);
    src.connect(lo).connect(loG).connect(level);
    level.connect(env).connect(o);
    for (const n of [src, w1, w2, hiW]) { n.start(t); n.stop(t + secs + 0.05); }
  }
  // fuel pouring from the churn: a steady pour, with a glug of air bubbling
  // back up through it every third of a second or so
  glug() {
    const o = this.out(0.5); if (!o) return;
    const ctx = this.sound.ctx, t = ctx.currentTime, secs = 1 + Math.max(0, this.physics.spec.fuelCapacity - this.physics.fuel) / this.fuelRate();
    const top = ctx.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 3000;
    top.connect(o);
    this.glugStop = () => { try { o.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (e) { /* gone */ } };
    // the pour
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf(); src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 250;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const pg = ctx.createGain(); pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(0.35, t + 0.15);
    pg.gain.setValueAtTime(0.35, t + Math.max(0.2, secs - 0.3)); pg.gain.linearRampToValueAtTime(0, t + secs);
    const wob = ctx.createOscillator(); wob.frequency.value = 3; const wobG = ctx.createGain(); wobG.gain.value = 0.1;
    wob.connect(wobG).connect(pg.gain);
    src.connect(hp).connect(lp).connect(pg).connect(top);
    src.start(t); src.stop(t + secs); wob.start(t); wob.stop(t + secs);
    // the glugs: a bubble's note sweeping up, with the slosh of the can
    for (let at = 0.25; at < secs - 0.3; at += 0.32 + Math.random() * 0.14) {
      const s0 = t + at, f0 = 140 + Math.random() * 80, a = 0.7 + Math.random() * 0.4;
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, s0); osc.frequency.linearRampToValueAtTime(f0 * 3, s0 + 0.14);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, s0); g.gain.linearRampToValueAtTime(a, s0 + 0.012); g.gain.setTargetAtTime(0, s0 + 0.012, 0.05);
      osc.connect(g).connect(top); osc.start(s0); osc.stop(s0 + 0.16);
      const sl = ctx.createBufferSource(); sl.buffer = this.noiseBuf();
      const sb = ctx.createBiquadFilter(); sb.type = 'bandpass'; sb.frequency.value = 360; sb.Q.value = 0.8;
      const sg = ctx.createGain(); sg.gain.setValueAtTime(0.5, s0 + 0.01); sg.gain.setTargetAtTime(0, s0 + 0.01, 0.04);
      sl.connect(sb).connect(sg).connect(top); sl.start(s0 + 0.01, Math.random()); sl.stop(s0 + 0.14);
    }
  }
}
