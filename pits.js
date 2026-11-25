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
// Too badly hurt to fix (a blown engine, a wheel torn off, a split fuel cell,
// a smashed radiator): the team retire the car. DNF on the standings, and
// they push it back into the garage.
// =====================================================================
export const BUILD = 24;

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
  // getting out of a car coming at you: the dive, then flat on the ground
  DIVE: { rate: 16, tilt: 1.05, lift: 0.3, shL: 2.7, shR: 2.7, elL: 0.2, elR: 0.2, thL: -0.35, thR: 0.25, knL: 0.5, knR: 0.2 },
  PRONE: { rate: 10, tilt: 1.5, lift: 0.13, shL: 2.6, shR: 2.4, elL: 0.9, elR: 1.0, outL: 0.3, outR: 0.3, thR: 0.12, knL: 0.25, knR: 0.35, head: -0.5 },
  // too close to dive: a duck, arms in round the head
  DUCK: { rate: 16, drop: 0.38, lean: 0.75, shL: 2.5, shR: 2.5, elL: 2.3, elR: 2.3, outL: -0.25, outR: -0.25, thL: 1.05, thR: 1.0, knL: 1.5, knR: 1.45, head: 0.4 },
  // pointing it out; waving others over (arm up, swinging)
  POINT: { shR: 1.55, elR: 0.05, shL: 0.15, lean: 0.05 },
  WAVE: { shR: 2.7, elR: 0.5, shL: 0.1, work: 0.8 },
  // the side vault: weight on one hand, hips up, legs tucked and swung across
  VAULT: { rate: 14, lean: 0.45, roll: 0.65, shL: 1.05, elL: 0.1, outL: 0.3, shR: 1.7, elR: 0.6, thL: 1.55, thR: 1.35, knL: 1.3, knR: 1.45 },
  // the driver out of the car: sat by the barrier getting his breath; head in his hands
  SIT: { rate: 6, drop: 0.79, lean: 0.3, thL: 1.5, thR: 1.42, knL: 1.05, knR: 1.3, shL: 0.55, shR: 0.65, elL: 0.95, elR: 0.85, head: 0.15 },
  SIT_HEAD: { rate: 4, drop: 0.79, lean: 0.62, thL: 1.5, thR: 1.42, knL: 1.3, knR: 1.4, shL: 1.25, shR: 1.25, elL: 2.35, elR: 2.35, outL: -0.2, outR: -0.2, head: 0.5 },
  // hurt: down on his back by the track; on the stretcher; doubled over
  // (arms gone limp: down flat on the ground beside him, palms down, one a little out from his side)
  // curled up on his side, knees drawn up, arms in round them
  CURL: { rate: 4, roll: 1.42, lift: 0.17, lean: 0.55, thL: 1.55, knL: 1.85, thR: 1.4, knR: 1.95, shL: 1.25, elL: 1.6, shR: 1.1, elR: 1.8, outL: -0.2, outR: -0.25, head: 0.55 },
  LIE: { rate: 5, tilt: -1.52, lift: 0.12, shL: -0.06, shR: -0.04, outL: 0.55, outR: 0.25, elL: 0.15, elR: 0.08, thL: 0.12, knL: 0.45, knR: 0.1, head: -0.15 },
  FALL: { rate: 4, tilt: -0.9, lift: 0.45, drop: 0.3, shL: 1.2, shR: 1.4, outL: 0.5, outR: 0.5, thL: 0.8, knL: 0.9, thR: 0.6, knR: 0.6 },
  HUNCH: { lean: 0.65, shL: 0.6, shR: 0.7, elL: 1.2, elR: 1.0, thL: 0.25, knL: 0.35, thR: 0.2, knR: 0.3, drop: 0.08, head: 0.3 },
  // a medic: down by him; lifting the stretcher; carrying it
  MEDIC: { drop: 0.45, lean: 0.55, thL: 1.45, knL: 1.45, thR: 0, knR: 1.6, shL: 1.0, shR: 1.1, elL: 0.6, elR: 0.5, head: 0.4 },
  STRETCH: { drop: 0.15, lean: 0.25, shL: 0.35, shR: 0.35, elL: 0.3, elR: 0.3, thL: 0.35, knL: 0.5, thR: 0.35, knR: 0.5 },
  STRETCH_UP: { lean: 0.02, shL: 0.25, shR: 0.25, elL: 0.35, elR: 0.35 },
  // a trophy held up high in one hand, the other fist clenched
  TROPHY: { rate: 6, shR: 2.95, elR: 0.25, outR: 0.12, shL: 0.7, elL: 1.6, outL: 0.25, head: -0.25 },
  // leaning in through a door, one arm reaching in
  LEANIN: { rate: 7, lean: 0.55, drop: 0.12, shR: 1.45, elR: 0.25, shL: 0.6, elL: 0.6, outL: 0.3, thL: 0.25, knL: 0.3, head: 0.2 },
  // behind a TV camera, hands on its handles
  CAMERA: { shL: 1.1, shR: 1.0, elL: 0.9, elR: 1.0, outL: -0.15, outR: -0.15, lean: 0.12, head: 0.05 },
};
const KEYS = ['drop', 'lean', 'shL', 'shR', 'elL', 'elR', 'outL', 'outR', 'thL', 'thR', 'knL', 'knR', 'work', 'tilt', 'roll', 'lift', 'head', 'hipRoll'];

const geoCache = {};
const G = (k, make) => geoCache[k] || (geoCache[k] = make());

export class Person {
  // mats: { suits[], helmet, visor, glove, boot, skin?, cap?, look? }
  //   look: 'crew' (pit crew: helmets), 'driver' (helmet), 'marshal' (face,
  //   cap, hi-vis bands), 'medic' (face, no cap), 'camera' (face, cap, headphones)
  constructor(mats, colour) {
    Person.all.add(this);
    const root = this.root = new THREE.Group();
    const suit = mats.suits[colour] || mats.suits[0];
    const look = mats.look || 'crew';
    const sk = skinMats(mats);
    const shad = (m) => { m.castShadow = true; return m; };
    const box = (w, h, d, mat, y = -h / 2) => shad(new THREE.Mesh(G(`b${w},${h},${d},${y}`, () => new THREE.BoxGeometry(w, h, d).translate(0, y, 0)), mat));
    // a rounded limb hanging from its joint: len long, r thick
    // (a limb: a turned shape, fuller near its top like a thigh or upper arm,
    // slimming toward the joint below, with a soft bulge partway (a calf or
    // forearm) and rounded ends)
    const cap = (r, len, mat, sx = 1, sz = 1, bulge = 0.35) => shad(new THREE.Mesh(G(`t${r},${len},${sx},${sz},${bulge}`, () => {
      const pts = [], N = 14;
      for (let k = 0; k <= N; k++) {
        const t = k / N, y = -t * len;
        const end = Math.sin(Math.min(1, Math.min(t, 1 - t) * len / (r * 1.1)) * Math.PI / 2);     // (rounded ends)
        const rad = r * (1.12 - 0.32 * t + 0.14 * Math.exp(-(((t - bulge) / 0.18) ** 2))) * (0.62 + 0.38 * end);
        pts.push(new THREE.Vector2(Math.max(0.002, rad), y));
      }
      return new THREE.LatheGeometry(pts, 12).scale(sx, 1, sz);
    }), mat));
    const hips = this.hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
    hips.add(shad(new THREE.Mesh(G('pelvis2', () => new THREE.CapsuleGeometry(0.115, 0.1, 4, 12).rotateZ(Math.PI / 2).scale(1, 0.95, 0.78).translate(0, -0.01, -0.01)), suit)));
    const torso = this.torso = new THREE.Group(); hips.add(torso);
    // chest and belly: one rounded shape, broader at the shoulders
    // (turned from a side-on outline: hips, a narrower waist, the ribcage
    // and chest filling out to the shoulders, which slope in to the neck;
    // wider than it is deep, the chest a little forward of the back)
    const chest = shad(new THREE.Mesh(G('chest2', () => {
      const prof = [[0.0, 0.01], [0.135, 0.0], [0.145, 0.06], [0.132, 0.17], [0.15, 0.27], [0.165, 0.37], [0.17, 0.45], [0.15, 0.51], [0.1, 0.555], [0.055, 0.575], [0.001, 0.58]];
      const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 18);
      const a = g.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const y = a.getY(i), x = a.getX(i), z = a.getZ(i);
        const wide = 1.08 + Math.max(0, (y - 0.3) / 0.2) * 0.32 * (y < 0.52 ? 1 : 0.6);      // (the shoulders' breadth)
        a.setX(i, x * wide);
        a.setZ(i, z * (z > 0 ? 0.68 + 0.08 * Math.exp(-(((y - 0.4) / 0.1) ** 2)) : 0.6));     // (the chest a touch fuller than the back)
      }
      g.computeVertexNormals();
      return g;
    }), suit));
    torso.add(chest);
    // the overalls: a collar round the neck, a zip down the front, a belt
    if (look !== 'driver') {
      torso.add(new THREE.Mesh(G('collar', () => new THREE.TorusGeometry(0.068, 0.018, 6, 16).rotateX(Math.PI / 2).scale(1.1, 1, 0.9).translate(0, 0.565, 0)), suit));
      torso.add(new THREE.Mesh(G('zip', () => new THREE.BoxGeometry(0.008, 0.36, 0.006).translate(0, 0.34, 0.118)), sk.dark));
      torso.add(new THREE.Mesh(G('belt', () => new THREE.CylinderGeometry(0.146, 0.146, 0.035, 18, 1, true).scale(1.08, 1, 0.62).translate(0, 0.05, 0)), sk.dark));
    }
    if (look === 'marshal' || look === 'medic') {
      // hi-vis bands round the chest
      const band = new THREE.Mesh(G('band', () => new THREE.CylinderGeometry(0.205, 0.2, 0.045, 16, 1, true).scale(1, 1, 0.74)), sk.reflect);
      band.position.y = 0.34; torso.add(band);
    }
    this.neck = shad(new THREE.Mesh(G('neck', () => new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10)), look === 'crew' || look === 'driver' ? suit : sk.skin));
    this.neck.position.y = 0.58; torso.add(this.neck);
    const head = this.head = new THREE.Group(); head.position.y = 0.63; torso.add(head);
    if (look === 'crew' || look === 'driver') {
      head.add(shad(new THREE.Mesh(G('helmet', () => new THREE.SphereGeometry(0.135, 16, 12).scale(1, 1.08, 1.05).translate(0, 0.06, 0)), mats.helmet)));
      const visor = new THREE.Mesh(G('visor', () => new THREE.SphereGeometry(0.137, 14, 8, -0.9 + Math.PI / 2, 1.8, 1.25, 0.45).scale(1, 1.08, 1.05).translate(0, 0.06, 0)), mats.visor);
      head.add(visor);
    } else {
      // a face: head, ears, nose, hair
      head.add(shad(new THREE.Mesh(G('skull', () => new THREE.SphereGeometry(0.105, 16, 12).scale(0.92, 1.12, 1).translate(0, 0.07, 0)), sk.skin)));
      head.add(new THREE.Mesh(G('jaw', () => new THREE.SphereGeometry(0.075, 12, 8).scale(1, 0.75, 1.05).translate(0, 0.012, 0.02)), sk.skin));
      for (const sx of [-1, 1]) head.add(new THREE.Mesh(G('brow' + sx, () => new THREE.BoxGeometry(0.035, 0.008, 0.01).rotateZ(sx * -0.12).translate(sx * 0.037, 0.107, 0.094)), sk.hair));
      head.add(new THREE.Mesh(G('mouth', () => new THREE.BoxGeometry(0.035, 0.006, 0.006).translate(0, 0.028, 0.094)), sk.eye));
      head.add(new THREE.Mesh(G('nose', () => new THREE.ConeGeometry(0.018, 0.04, 6).rotateX(Math.PI / 2).translate(0, 0.06, 0.105)), sk.skin));
      for (const sx of [-1, 1]) head.add(new THREE.Mesh(G('ear' + sx, () => new THREE.SphereGeometry(0.022, 8, 6).scale(0.5, 1, 0.8).translate(sx * 0.097, 0.07, 0)), sk.skin));
      head.add(new THREE.Mesh(G('hair', () => new THREE.SphereGeometry(0.108, 14, 8, 0, Math.PI * 2, 0, 1.35).scale(0.94, 1.1, 1.02).translate(0, 0.075, -0.008)), sk.hair));
      for (const sx of [-1, 1]) head.add(new THREE.Mesh(G('eye' + sx, () => new THREE.SphereGeometry(0.012, 6, 4).translate(sx * 0.036, 0.085, 0.092)), sk.eye));
      if (look === 'marshal' || look === 'camera') {
        head.add(shad(new THREE.Mesh(G('cap', () => new THREE.SphereGeometry(0.112, 14, 8, 0, Math.PI * 2, 0, 1.25).scale(0.96, 0.95, 1.02).translate(0, 0.095, 0)), mats.cap || sk.cap)));
        head.add(new THREE.Mesh(G('brim', () => new THREE.CylinderGeometry(0.09, 0.09, 0.012, 14, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, 0.9).translate(0, 0.12, 0.07)), mats.cap || sk.cap));
      }
      if (look === 'camera') {
        // headphones
        head.add(new THREE.Mesh(G('hband', () => new THREE.TorusGeometry(0.112, 0.01, 6, 14, Math.PI).translate(0, 0.07, 0)), sk.dark));
        for (const sx of [-1, 1]) head.add(new THREE.Mesh(G('cup' + sx, () => new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10).rotateZ(Math.PI / 2).translate(sx * 0.11, 0.07, 0)), sk.dark));
      }
    }
    // arms: shoulder, upper arm, elbow, forearm, glove with a thumb
    const limb = (parent, x, y, len, r, mat, sx, sz) => {
      // (just the joints: the arm or leg itself is one smooth skin over them, below)
      const j = new THREE.Group(); j.position.set(x, y, 0); parent.add(j);
      const k = new THREE.Group(); k.position.y = -len; j.add(k);
      return [j, k];
    };
    [this.shL, this.elL] = limb(torso, 0.235, 0.5, 0.29, 0.052, suit);
    [this.shR, this.elR] = limb(torso, -0.235, 0.5, 0.29, 0.052, suit);
    const hand = (side) => {
      const h = new THREE.Group(); h.position.y = -0.29;
      const gl = look === 'marshal' || look === 'camera' ? sk.skin : mats.glove;
      h.add(shad(new THREE.Mesh(G('palm', () => new THREE.BoxGeometry(0.075, 0.09, 0.035, 1, 1, 1).translate(0, -0.035, 0)), gl)));
      h.add(new THREE.Mesh(G('fing', () => new THREE.CapsuleGeometry(0.018, 0.05, 2, 6).translate(0, -0.095, 0.006).scale(1.9, 1, 1)), gl));
      h.add(new THREE.Mesh(G('thumb' + side, () => new THREE.CapsuleGeometry(0.014, 0.04, 2, 6).rotateZ(side * 0.5).translate(side * 0.042, -0.04, 0.02)), gl));
      return h;
    };
    this.handR = hand(-1); this.elR.add(this.handR);
    this.handL = hand(1); this.elL.add(this.handL);
    // legs: thigh, knee, shin, boot
    [this.thL, this.knL] = limb(hips, 0.1, -0.02, 0.45, 0.075, suit);
    [this.thR, this.knR] = limb(hips, -0.1, -0.02, 0.45, 0.075, suit);
    for (const k of [this.knL, this.knR]) {
      if (look === 'marshal' || look === 'medic') { const b = new THREE.Mesh(G('shinband', () => new THREE.CylinderGeometry(0.064, 0.062, 0.035, 12, 1, true).translate(0, -0.3, 0)), sk.reflect); k.add(b); }
      const f = shad(new THREE.Mesh(G('boot2', () => { const g = new THREE.CapsuleGeometry(0.048, 0.16, 4, 10).rotateX(Math.PI / 2).scale(1.05, 0.8, 1); return g.translate(0, -0.45, 0.06); }), mats.boot));
      k.add(f);
      k.add(new THREE.Mesh(G('sole', () => new THREE.BoxGeometry(0.1, 0.018, 0.26).translate(0, -0.488, 0.06)), sk.dark));
    }
    // THE ARMS AND LEGS: one smooth skin each, from the shoulder to the
    // wrist and from the hip to the ankle, bending softly at the elbow and
    // knee as the joints underneath move (no balls or seams at the joints)
    {
      root.updateMatrixWorld(true);
      const bones = [torso, this.shL, this.elL, this.shR, this.elR, hips, this.thL, this.knL, this.thR, this.knR];
      const geo = G('limbskin', () => {
        const pos = [], si = [], sw = [], idx = [], SEG = 12;
        // (a tube down from (x, y0): [drop, radius] keys; bone a above the bend at 'bend', b below it)
        const tube = (x, y0, keys, a, b, bend, sz) => {
          const R = (d) => { for (let k = 1; k < keys.length; k++) if (d <= keys[k][0]) { const [d0, r0] = keys[k - 1], [d1, r1] = keys[k], t = (d - d0) / (d1 - d0); return r0 + (r1 - r0) * (t * t * (3 - 2 * t)); } return keys[keys.length - 1][1]; };
          const total = keys[keys.length - 1][0], rows = 22, v0 = pos.length / 3;
          for (let i = 0; i <= rows; i++) {
            const d = total * i / rows, rr = R(d), end = i === 0 || i === rows ? 0.5 : 1;
            const w = Math.min(1, Math.max(0, (d - bend + 0.05) / 0.1)), wb = w * w * (3 - 2 * w);       // (blending across the bend)
            for (let k = 0; k < SEG; k++) {
              const ang = k / SEG * Math.PI * 2;
              pos.push(x + Math.cos(ang) * rr * end, y0 - d, Math.sin(ang) * rr * end * sz);
              si.push(a, b, 0, 0); sw.push(1 - wb, wb, 0, 0);
            }
          }
          for (let i = 0; i < rows; i++) for (let k = 0; k < SEG; k++) {
            const p0 = v0 + i * SEG + k, p1 = v0 + i * SEG + (k + 1) % SEG;
            idx.push(p0, p1, p0 + SEG, p1, p1 + SEG, p0 + SEG);
          }
        };
        const SH = 0.95 + 0.5, HIP = 0.95 - 0.02;
        // (arms: from inside the shoulder down past the wrist into the glove)
        const arm = [[0, 0.03], [0.04, 0.058], [0.12, 0.056], [0.25, 0.046], [0.29, 0.043], [0.36, 0.047], [0.5, 0.036], [0.61, 0.031]];
        tube(0.235, SH + 0.03, arm, 1, 2, 0.29 + 0.03, 0.9); tube(-0.235, SH + 0.03, arm, 3, 4, 0.32, 0.9);
        // (legs: from up inside the hip down to the ankle, in the boot)
        const leg = [[0, 0.06], [0.06, 0.094], [0.2, 0.085], [0.42, 0.064], [0.47, 0.06], [0.58, 0.067], [0.78, 0.048], [0.93, 0.042]];
        tube(0.1, HIP + 0.06, leg, 6, 7, 0.45 + 0.06, 0.92); tube(-0.1, HIP + 0.06, leg, 8, 9, 0.51, 0.92);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(si), 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      });
      const skin = new THREE.SkinnedMesh(geo, suit);
      skin.castShadow = true; skin.frustumCulled = false;
      root.add(skin);
      skin.bind(new THREE.Skeleton(bones));
      this.skin = skin;
    }
    // the front of the body: where a carried wheel, wing or churn sits
    this.front = new THREE.Group(); this.front.position.set(0, 0.12, 0.42); torso.add(this.front);
    this.p = Object.fromEntries(KEYS.map((k) => [k, 0]));
    this.want = 'STAND';
    this.x = 0; this.z = 0; this.face = 0; this.moving = 0; this.phase = Math.random() * 6; this.t = 0;
    this.queue = []; this.held = []; this.follow = null; this.back = false;
    this.anim = null; this.lookAt = null;
    // everyone moves a little differently: their own pace, stride, arm
    // swing and lean, so no two of them ever run in step
    const r = () => Math.random();
    this.gait = { spd: 0.9 + r() * 0.2, cad: 0.88 + r() * 0.24, arm: 0.8 + r() * 0.4, knee: 0.85 + r() * 0.3, lean: (r() - 0.5) * 0.1, bob: 0.7 + r() * 0.6 };
  }
  // the middle of his body on the ground (he's placed by his feet: lying on
  // his back, the rest of him is behind them)
  static all = new Set();          // (everyone, for blasts and the like to find)
  // THE CAR IN THE WAY: your car, in the world: { x, z, h (heading), L, W
  // (half its length and width) }, or null. Anyone walking steps round it
  // instead of marching into it and getting stuck
  static obstacle = null;
  // (a step from here, turned to go round the car if it would take him into it)
  steerRound(sx, sz, step, tx, tz) {
    const o = Person.obstacle, par = this.root.parent;
    if (!o || !par) return [sx, sz];
    const e = par.matrixWorld.elements;
    // into the world, then into the car's own frame (along it, across it)
    const toW = (x, z) => [e[0] * x + e[8] * z + e[12], e[2] * x + e[10] * z + e[14]];
    const fx = Math.sin(o.h), fz = Math.cos(o.h), car = (w) => { const dx = w[0] - o.x, dz = w[1] - o.z; return [dx * fx + dz * fz, dx * fz - dz * fx]; };
    const L = o.L + 0.45, W = o.W + 0.45;
    const now = car(toW(this.x, this.z)), next = car(toW(this.x + sx * step, this.z + sz * step));
    if (Math.abs(next[0]) > L || Math.abs(next[1]) > W) { this.roundWay = null; return [sx, sz]; }
    // (going to the car on purpose: a medic, a marshal, the crane's man)
    const goal = car(toW(tx, tz)); if (Math.abs(goal[0]) < L + 0.3 && Math.abs(goal[1]) < W + 0.3) return [sx, sz];
    // heading into it: walk along whichever face he's at, toward the nearer corner
    const dw = [toW(this.x + sx, this.z + sz)[0] - toW(this.x, this.z)[0], toW(this.x + sx, this.z + sz)[1] - toW(this.x, this.z)[1]];
    let ga = dw[0] * fx + dw[1] * fz, gb = dw[0] * fz - dw[1] * fx;          // (the way he wants to go, in the car's frame)
    // (which way round: chosen once, the shorter way, and kept till he's clear)
    const beside = Math.abs(now[1]) / W >= Math.abs(now[0]) / L;
    if (!this.roundWay || this.roundWay.beside !== beside) {
      const g = beside ? (Math.abs(ga) > 0.2 ? Math.sign(ga) : now[0] >= 0 ? 1 : -1) : (Math.abs(gb) > 0.2 ? Math.sign(gb) : now[1] >= 0 ? 1 : -1);
      this.roundWay = { beside, g };
    }
    if (beside) { gb = Math.sign(now[1]) * Math.max(0, gb * Math.sign(now[1])); ga = this.roundWay.g; }        // (along it)
    else { ga = Math.sign(now[0]) * Math.max(0, ga * Math.sign(now[0])); gb = this.roundWay.g; }               // (across its front or back)
    const wx = ga * fx + gb * fz, wz = ga * fz - gb * fx;                   // (back into the world)
    // and into his own surroundings' frame
    let lx = e[0] * wx + e[2] * wz, lz = e[8] * wx + e[10] * wz; const l = Math.hypot(lx, lz) || 1;
    return [lx / l, lz / l];
  }
  get bodyAt() {
    const lying = Math.min(1, Math.abs(this.p.tilt || 0) / 1.4), back = (this.p.tilt || 0) < 0 ? -1 : 1;
    return [this.x + Math.sin(this.face) * 0.85 * lying * back, this.z + Math.cos(this.face) * 0.85 * lying * back];
  }
  place(x, z, face) { this.x = x; this.z = z; if (face != null) this.face = face; }
  run(list) { this.queue = list.slice(); this.follow = null; this.anim = null; }
  then(list) { this.queue.push(...list); }
  get busy() { return this.queue.length > 0; }
  hold(obj, where = 'front') { (where === 'hand' ? this.handR : where === 'handL' ? this.handL : where === 'root' ? this.root : this.front).add(obj); this.held.push(obj); }
  release(obj) { this.held = this.held.filter((o) => o !== obj); }

  // KNOCKED FLYING (a blast, a hit): a ragdoll. Flung through the air
  // tumbling, arms and legs flailing, he lands, bounces, slides, and lies
  // there limp; after a while he gets himself back up and carries on with
  // whatever he was doing. (v: the push, in the world, m/s)
  // RIPPED APART: these limbs torn off (any of 'armL', 'armR', 'legL', 'legR'),
  // each taken out into the world (its part of the skin goes with it) and
  // handed back to be flung; the body carries on without them
  dismember(which, world) {
    const out = [];
    const swap = (key, kids) => {
      const g = this[key]; if (!g?.parent) return;
      world.attach(g);
      const d = new THREE.Group(); d.position.copy(g.position); out.push(g);
      // (a stand-in where it was, so his moving and falling don't touch the torn-off one)
      this[key] = d; for (const k of kids) this[k] = new THREE.Group();
      (key.startsWith('sh') ? this.torso : this.hips).add(d);
      // (the torn ends: raw red, on him and on it)
      const raw = Person.raw || (Person.raw = new THREE.MeshStandardMaterial({ color: 0x6e0c0c, roughness: 0.4 }));
      const r = key.startsWith('sh') ? 0.06 : 0.095;
      d.add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8).scale(1, 0.55, 1), raw));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.95, 10, 8).scale(1, 0.55, 1).translate(0, key.startsWith('sh') ? 0.02 : 0.05, 0), raw));
    };
    for (const w of which) {
      if (w === 'armL') swap('shL', ['elL', 'handL']); if (w === 'armR') swap('shR', ['elR', 'handR']);
      if (w === 'legL') swap('thL', ['knL']); if (w === 'legR') swap('thR', ['knR']);
    }
    this.torn = (this.torn || 0) + out.length;
    return out;
  }
  knock(vx, vy, vz) {
    const r = this.rag;
    if (r && r.up > 0) { r.up = 0; }
    const f = vx * Math.sin(this.face) + vz * Math.cos(this.face), s = vx * Math.cos(this.face) - vz * Math.sin(this.face);
    const R = Math.random;
    if (!r) {
      this.rag = { hx: this.x, hy: null, hz: this.z, ax: this.p.tilt || 0, az: this.p.roll || 0, vx, vy, vz, wx: f * 1.6 + (R() - 0.5) * 3, wz: -s * 1.6 + (R() - 0.5) * 3,
        t: 0, rest: 0, up: 0, seed: R() * 10, j: {} };
    } else { r.vx += vx; r.vy += vy; r.vz += vz; r.wx += f * 1.6; r.wz -= s * 1.6; r.rest = 0; r.t = 0; }
    this.anim = null;
  }
  get ragdolled() { return !!this.rag; }
  updateRag(dt, groundAt) {
    const r = this.rag, root = this.root;
    r.t += dt;
    const gy = groundAt(r.hx, r.hz);
    if (r.hy == null) r.hy = gy + 0.95 + (this.p.lift || 0);
    const lying = Math.abs(Math.sin(r.ax)) > 0.8 || Math.abs(Math.sin(r.az)) > 0.8;
    if (r.up > 0) {
      // getting up: rolls over, pushes up off the ground, stands
      r.up += dt / 1.6;
      const e = Math.min(1, r.up), ee = e * e * (3 - 2 * e);
      r.ax = r.ax0 * (1 - ee); r.az = r.az0 * (1 - ee); r.hy = r.hy0 + (0.95 - r.hy0) * ee;
      for (const [k, v] of Object.entries(r.j)) { const j = this[k]; j.rotation.set(v[0] * (1 - ee), 0, v[2] * (1 - ee)); }
      if (e >= 1) {
        this.rag = null; this.p.tilt = 0; this.p.roll = 0;
        return false;
      }
    } else {
      // the body: thrown, falling, tumbling, then on the ground
      r.vy -= 9.81 * dt;
      r.hx += r.vx * dt; r.hy += r.vy * dt; r.hz += r.vz * dt;
      r.ax += r.wx * dt; r.az += r.wz * dt;
      // the lowest of him: his feet, his head, or his hips if he's flat
      const feetY = r.hy - 0.95 * Math.cos(r.ax) * Math.cos(r.az), headY = r.hy + 0.8 * Math.cos(r.ax) * Math.cos(r.az);
      const low = Math.min(feetY, headY, r.hy - 0.12);
      if (low < gy) {
        r.hy += gy - low;
        if (r.vy < 0) r.vy = -r.vy * (r.vy < -4 ? 0.3 : 0);
        r.vx *= Math.exp(-dt * 6); r.vz *= Math.exp(-dt * 6);
        r.wx *= Math.exp(-dt * 5); r.wz *= Math.exp(-dt * 5);
        // gravity lays him down: on his back or front, whichever's nearer
        const onSide = Math.abs(Math.sin(r.az)) > 0.8;
        if (!onSide) {
          let tx = r.ax, best = Infinity;
          for (const c0 of [Math.PI / 2, -Math.PI / 2]) { const c1 = c0 + Math.round((r.ax - c0) / (2 * Math.PI)) * 2 * Math.PI; if (Math.abs(c1 - r.ax) < best) { best = Math.abs(c1 - r.ax); tx = c1; } }
          r.ax += (tx - r.ax) * Math.min(1, dt * 3);
          r.az += (Math.round(r.az / Math.PI) * Math.PI - r.az) * Math.min(1, dt * 3);
        }
        const slow = Math.hypot(r.vx, r.vz) < 0.3 && Math.abs(r.vy) < 0.5;
        if (slow && lying) r.rest += dt;
      }
      // the arms and legs: flailing in the air, flopping limp on the ground
      const air = low > gy + 0.05;
      const fl = (k, i) => Math.sin(r.t * (7 + i * 1.3) + r.seed + i * 2.1);
      const want = air ? {
        shL: [-1.2 + fl(0, 0) * 1.4, 0, 0.9 + fl(0, 1) * 0.6], shR: [-1.2 + fl(0, 2) * 1.4, 0, -0.9 + fl(0, 3) * 0.6],
        elL: [-0.6 - Math.abs(fl(0, 4)), 0, 0], elR: [-0.6 - Math.abs(fl(0, 5)), 0, 0],
        thL: [-0.6 + fl(0, 6) * 0.8, 0, 0.2], thR: [-0.4 + fl(0, 7) * 0.8, 0, -0.2], knL: [0.6 + Math.abs(fl(0, 8)), 0, 0], knR: [0.5 + Math.abs(fl(0, 9)), 0, 0],
        head: [fl(0, 10) * 0.5, 0, fl(0, 11) * 0.4],
      } : {
        shL: [-0.2 + Math.sin(r.seed) * 0.6, 0, 1.15 + Math.sin(r.seed * 2) * 0.3], shR: [-0.3 + Math.sin(r.seed * 3) * 0.6, 0, -1.1 - Math.sin(r.seed * 5) * 0.3],
        elL: [-0.3 - Math.abs(Math.sin(r.seed * 7)) * 0.6, 0, 0], elR: [-0.25 - Math.abs(Math.sin(r.seed * 11)) * 0.6, 0, 0],
        thL: [-0.15 - Math.abs(Math.sin(r.seed * 13)) * 0.4, 0, 0.18], thR: [0.05, 0, -0.12], knL: [0.25 + Math.abs(Math.sin(r.seed * 17)) * 0.6, 0, 0], knR: [0.1, 0, 0],
        head: [Math.sin(r.seed * 19) * 0.3, 0, Math.sin(r.seed * 23) * 0.6],
      };
      const k = Math.min(1, dt * (air ? 10 : 6));
      for (const [name, v] of Object.entries(want)) {
        const j = this[name], cur = r.j[name] || [j.rotation.x, 0, j.rotation.z];
        cur[0] += (v[0] - cur[0]) * k; cur[2] += (v[2] - cur[2]) * k; r.j[name] = cur;
        j.rotation.set(cur[0], 0, cur[2]);
      }
      this.torso.rotation.set(0, 0, 0); this.hips.rotation.set(0, 0, 0);
      // lain there a while: up he gets
      // (killed: he stays down. The pit crew are needed for the stops, so a
      // crewman who's been hit that hard is down a good while, then back to it)
      if (r.rest > (this.dead ? (this.role && !this.torn ? 25 : Infinity) : 3.5)) { r.up = 1e-6; r.ax0 = r.ax; r.az0 = r.az; r.hy0 = r.hy; this.dead = false; }
    }
    // placed by his hips: the feet are wherever the tilt puts them
    root.rotation.set(r.ax, this.face, r.az, 'YXZ');
    root.updateMatrix();
    const off = new THREE.Vector3(0, 0.95, 0).applyEuler(root.rotation);
    root.position.set(r.hx - off.x, r.hy - off.y, r.hz - off.z);
    this.x = root.position.x; this.z = root.position.z;
    this.moving = 0;
    return true;
  }

  update(dt, groundAt, ctx) {
    if (this.rag && this.updateRag(dt, groundAt)) return;
    this.t += dt;
    let speed = 0, lift = 0;
    // work through the list of things to do
    while (this.queue.length) {
      const a = this.queue[0];
      if (a.fn) { this.queue.shift(); a.fn(); continue; }
      if (a.pose) { this.want = a.pose; if (a.t == null) { this.queue.shift(); continue; } a.left = a.left ?? a.t; a.left -= dt; if (a.left > 0) break; this.queue.shift(); continue; }
      if (a.wait != null) { a.left = a.left ?? a.wait; a.left -= dt; if (a.left > 0) break; this.queue.shift(); continue; }
      if (a.until) { if (a.until()) { this.queue.shift(); continue; } break; }
      if (a.look !== undefined) { this.lookAt = a.look; this.queue.shift(); continue; }
      if (a.face != null) {
        const want = Array.isArray(a.face) ? Math.atan2(a.face[0] - this.x, a.face[1] - this.z) : a.face;
        let d = want - this.face; d = Math.atan2(Math.sin(d), Math.cos(d));
        const step = dt * (a.quick ? 12 : 6);
        if (Math.abs(d) <= step) { this.face = want; this.queue.shift(); continue; }
        this.face += Math.sign(d) * step; break;
      }
      // a move made of key poses (a vault, climbing out of a car): each key
      // has its time, the pose, where he is and how high he's lifted
      if (a.vault && !a.keys) { a.keys = vaultKeys([this.x, this.z], a.vault, a.h ?? 0.75); }
      if (a.keys) {
        if (a.k == null) { a.k = 0; a.from = [this.x, this.z]; for (const f of a.keys) if (!f.at) f.at = null; }
        a.k += dt;
        const K = a.keys, total = K[K.length - 1].t;
        let j = 0; while (j < K.length - 2 && a.k > K[j + 1].t) j++;
        const f0 = K[j], f1 = K[j + 1], u = Math.max(0, Math.min(1, (a.k - f0.t) / Math.max(1e-3, f1.t - f0.t))), e = u * u * (3 - 2 * u);
        const P0 = POSES[f0.pose] || f0.pose, P1 = POSES[f1.pose] || f1.pose;
        for (const key of KEYS) this.p[key] = (P0[key] || 0) + ((P1[key] || 0) - (P0[key] || 0)) * e;
        const a0 = f0.at || a.from, a1 = f1.at || a0;
        this.x = a0[0] + (a1[0] - a0[0]) * e; this.z = a0[1] + (a1[1] - a0[1]) * e;
        lift = (f0.lift || 0) + ((f1.lift || 0) - (f0.lift || 0)) * e;
        if (a.face2 != null) this.face = a.face2; else if (f1.at && (Math.abs(a1[0] - a0[0]) + Math.abs(a1[1] - a0[1]) > 0.05) && !f1.keepFace) { let df = Math.atan2(a1[0] - a0[0], a1[1] - a0[1]) - this.face; df = Math.atan2(Math.sin(df), Math.cos(df)); this.face += df * Math.min(1, dt * 8); }
        this.keyed = true;
        if (a.k >= total) { this.queue.shift(); this.want = a.after || 'STAND'; this.keyed = false; continue; }
        break;
      }
      // a dive out of a car's way
      if (a.dive) {
        const to = a.dive, T = a.t ?? 0.45;
        if (!a.from) { a.from = [this.x, this.z]; a.u = 0; this.want = 'DIVE'; this.face = Math.atan2(to[0] - this.x, to[1] - this.z); }
        a.u = Math.min(1, a.u + dt / T);
        const e = 1 - (1 - a.u) * (1 - a.u);
        this.x = a.from[0] + (to[0] - a.from[0]) * e; this.z = a.from[1] + (to[1] - a.from[1]) * e;
        lift = Math.sin(Math.PI * a.u) * 0.35;
        if (a.u >= 1) { this.queue.shift(); this.want = 'PRONE'; continue; }
        break;
      }
      if (a.go) {
        const [tx, tz] = a.go, dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
        // (a stumble: lurching steps, quick then nearly stopping, never a steady pace)
        const lurch = a.stagger ? Math.max(0, Math.sin(this.t * 3.3) + 0.35 * Math.sin(this.t * 7.9 + 1)) : 0;
        let v = (a.stagger ? 0.25 + 1.1 * lurch : a.panic ? 5.6 : a.run ? 4.6 : a.back ? 1.1 : (a.v || 1.6)) * this.gait.spd;
        // (limping: slow, and slower still each time his weight's on the bad leg)
        if (this.hurt?.limp) { const onBad = Math.max(0, (this.hurt.limp === 'L' ? -1 : 1) * Math.sin(this.phase)); v = Math.min(v, 0.9) * (0.35 + 0.65 * (1 - onBad)); }
        this.panic = !!a.panic; this.stagger = !!a.stagger;
        if (d < 0.04) { this.x = tx; this.z = tz; this.queue.shift(); continue; }
        const step = Math.min(d, v * dt);
        let sx = dx / d, sz = dz / d;
        if (a.stagger) { const w = Math.sin(this.t * 2.3) * 0.55 + Math.sin(this.t * 5.7) * 0.2; const c = Math.cos(w), s2 = Math.sin(w); [sx, sz] = [sx * c + sz * s2, -sx * s2 + sz * c]; }
        if (!a.through) [sx, sz] = this.steerRound(sx, sz, step, tx, tz);
        this.x += sx * step; this.z += sz * step;
        speed = v;
        this.back = !!a.back;
        if (!a.back && !a.sidestep) { let df = Math.atan2(sx, sz) - this.face; df = Math.atan2(Math.sin(df), Math.cos(df)); this.face += df * Math.min(1, dt * (a.panic ? 14 : 10)); }
        break;
      }
      this.queue.shift();
    }
    if (this.follow) { const f = this.follow(); this.x = f[0]; this.z = f[1]; this.face = f[2]; speed = f[3] || 0; }
    // the pose: eased towards what he's doing, with legs walking
    const P = POSES[this.want] || POSES.STAND, k = Math.min(1, dt * (P.rate || 9));
    if (!this.keyed) for (const key of KEYS) this.p[key] += ((P[key] || 0) - this.p[key]) * k;
    const walking = speed > 0 && !this.keyed;
    this.moving += ((walking ? 1 : 0) - this.moving) * Math.min(1, dt * 8);
    const fast = speed > 3;
    // (the stride keeps time with the speed, so the feet don't slide)
    this.phase += dt * this.gait.cad * (fast ? Math.min(13, 6 + speed * 1.15) : this.stagger ? 3 + speed * 2.5 : Math.min(8.5, 2.2 + speed * 3.4)) * (this.back ? -1 : 1);
    const sw = Math.sin(this.phase) * this.moving * (fast ? 0.8 : 0.42);
    const p = this.p, carrying = this.held.length > 0;
    if (!speed) { this.panic = false; this.stagger = false; }
    const runLean = fast ? (this.panic ? 0.2 : 0.16) : this.stagger ? 0.25 : 0;
    this.hips.position.y = 0.95 - p.drop * (1 - this.moving) + Math.abs(Math.cos(this.phase)) * (fast ? 0.05 : 0.025) * this.moving;
    this.torso.rotation.x = p.lean * (1 - this.moving * 0.6) + runLean;
    const wob = p.work ? Math.sin(this.t * 22) * 0.12 * p.work : 0;
    // arms: while walking or running (hands free), they come down from the
    // pose and swing forward and back, elbows bent more the faster he goes
    const free = carrying ? 0 : this.moving;
    const armSw = carrying ? 0 : sw * (fast ? 1.1 : 0.9);
    const bend = fast ? 1.45 : 0.35;
    this.shL.rotation.set(-(p.shL * (1 - free) + armSw + wob), 0, p.outL * (1 - free) + 0.08 * free);
    this.shR.rotation.set(-(p.shR * (1 - free) - armSw - wob), 0, -p.outR * (1 - free) - 0.08 * free);
    this.elL.rotation.x = -(p.elL * (1 - free) + bend * free + (fast ? Math.max(0, sw) * 0.4 : 0));
    this.elR.rotation.x = -(p.elR * (1 - free) + bend * free + (fast ? Math.max(0, -sw) * 0.4 : 0));
    const legK = 1 - this.moving;
    this.thL.rotation.x = -(p.thL * legK + sw); this.thR.rotation.x = -(p.thR * legK - sw);
    this.knL.rotation.x = p.knL * legK + Math.max(0, -Math.sin(this.phase)) * (fast ? 1.4 : 0.9) * this.moving;
    this.knR.rotation.x = p.knR * legK + Math.max(0, Math.sin(this.phase)) * (fast ? 1.4 : 0.9) * this.moving;
    // RUNNING FLAT OUT is its own movement, not a bigger walk: the knee
    // driven high in front, the heel kicked up behind as the leg comes
    // through, a push off the toes; arms pumping hard and opposite, elbows
    // at a right angle, hands from the hip to the chin; up on the balls of
    // the feet with both off the ground between strides
    if (fast && !carrying) {
      const M = this.moving, ph = this.phase, G = this.gait;
      const leg = (thigh, knee, f) => {
        thigh.rotation.x = thigh.rotation.x * (1 - M) - (0.22 + 0.72 * G.knee * Math.sin(f)) * M;             // (forward to about 0.95, back to -0.5)
        knee.rotation.x = knee.rotation.x * (1 - M) + (0.25 + 1.3 * G.knee * Math.pow(Math.max(0, Math.cos(f - 0.6)), 1.6)) * M;   // (heel up as it comes through)
      };
      leg(this.thL, this.knL, ph); leg(this.thR, this.knR, ph + Math.PI);
      const arm = (sh, el, f, sgn) => {
        sh.rotation.x = sh.rotation.x * (1 - M) - (0.05 + 0.62 * G.arm * Math.sin(f)) * M;              // (as far back as forward)
        el.rotation.x = el.rotation.x * (1 - M) - (1.35 + 0.15 * Math.sin(f)) * M;
        sh.rotation.z = sh.rotation.z * (1 - M) + sgn * 0.06 * M;
      };
      arm(this.shL, this.elL, ph + Math.PI, 1); arm(this.shR, this.elR, ph, -1);
      // (the bounce: up in the air between strides, down hard on each foot)
      this.hips.position.y = 0.95 + (Math.abs(Math.sin(ph)) * 0.035 * G.bob - 0.025) * M;
      this.torso.rotation.x = 0.16 + G.lean + Math.sin(ph * 2) * 0.012;
      this.hips.rotation.y = Math.sin(ph) * 0.06 * M;                // (hips and shoulders counter-rotating, a little)
    } else this.hips.rotation.y = 0;
    this.root.position.set(this.x, groundAt(this.x, this.z) + lift + p.lift, this.z);
    this.root.rotation.set(p.tilt, this.face, p.roll + (this.stagger ? Math.sin(this.t * 2.3) * 0.12 : 0), 'YXZ');
    // (in a panic: hunched, the body twisting with each stride, looking about)
    this.torso.rotation.y = 0;
    // stumbling: bent over, arms out wide for balance and grabbing at the
    // air, the knees buckling now and then, his head hanging and lolling
    this.stagK = (this.stagK || 0) + ((this.stagger ? 1 : 0) - (this.stagK || 0)) * Math.min(1, dt * 4);
    if (this.stagK > 0.01) {
      const S = this.stagK, t = this.t;
      const buckle = Math.max(0, Math.sin(t * 1.9 + 0.5) - 0.55) * 2.2;          // (every so often a knee goes)
      this.hips.position.y -= buckle * 0.14 * S;
      this.knL.rotation.x += buckle * 0.6 * S; this.thL.rotation.x -= buckle * 0.35 * S;
      this.torso.rotation.x += (0.28 + 0.15 * Math.sin(t * 2.7)) * S + buckle * 0.25 * S;
      this.torso.rotation.z = Math.sin(t * 2.3) * 0.16 * S;
      this.shL.rotation.z += (0.55 + 0.25 * Math.sin(t * 3.1)) * S; this.shR.rotation.z -= (0.5 + 0.25 * Math.sin(t * 2.6 + 1)) * S;
      this.shL.rotation.x -= (0.35 + buckle * 0.6) * S; this.shR.rotation.x -= (0.3 + buckle * 0.5) * S;     // (reaching out as he goes down)
      this.elL.rotation.x -= 0.4 * S; this.elR.rotation.x -= 0.35 * S;
    } else this.torso.rotation.z = 0;
    // HURT: how an injury shows as he moves. limp: the bad leg kept stiff
    // and the body dipping and rolling onto it each time it takes his
    // weight; arm: held across his chest by the other hand; neck: a hand
    // on the back of his neck, head held stiff; chest: both arms wrapped
    // round his ribs, bent over them
    if (this.hurt && !this.keyed) {
      const H = this.hurt, M = this.moving;
      if (H.limp) {
        const bad = H.limp === 'L', th = bad ? this.thL : this.thR, kn = bad ? this.knL : this.knR;
        const onBad = Math.max(0, (bad ? -1 : 1) * Math.sin(this.phase)) * M;
        kn.rotation.x *= 0.15; th.rotation.x *= 0.45;
        this.hips.position.y -= 0.06 * onBad;
        this.root.rotation.z += (bad ? 1 : -1) * 0.12 * onBad;
        this.torso.rotation.z -= (bad ? 1 : -1) * 0.1 * onBad;
      }
      if (H.arm) {
        const L = H.arm === 'L';
        (L ? this.shL : this.shR).rotation.set(-0.45, 0, (L ? -1 : 1) * 0.3); (L ? this.elL : this.elR).rotation.x = -1.95;     // (the hurt one, tucked in)
        (L ? this.shR : this.shL).rotation.set(-0.75, 0, (L ? 1 : -1) * 0.55); (L ? this.elR : this.elL).rotation.x = -1.7;     // (the good one holding it)
      }
      if (H.neck) { this.shR.rotation.set(-2.7, 0, -0.35); this.elR.rotation.x = -2.25; this.head.rotation.x = -0.05; this.head.rotation.z = 0.08; }
      if (H.chest) {
        this.shL.rotation.set(-0.85, 0, -0.5); this.elL.rotation.x = -1.95; this.shR.rotation.set(-0.8, 0, 0.55); this.elR.rotation.x = -1.9;
        this.torso.rotation.x += 0.3; this.head.rotation.x += 0.25;
      }
    }
    // breathing hard: panting, or hyperventilating in a panic: his chest
    // heaving fast, shoulders rising and falling with it
    if (this.hurt?.breathe) {
      const B = this.hurt.breathe, f = Math.sin(this.t * (B > 1 ? 11 : 6));
      this.torso.scale.set(1 + 0.025 * f * B, 1, 1 + 0.06 * f * B);
      this.shL.rotation.z += 0.07 * f * B; this.shR.rotation.z -= 0.07 * f * B;
      this.head.rotation.x -= 0.06 * f * B;
      if (B > 1) this.torso.rotation.x += 0.08 * Math.sin(this.t * 1.6);                   // (rocking)
    } else if (this.torso.scale.x !== 1) this.torso.scale.set(1, 1, 1);
    // (the legs swung out sideways from the hips, the body kept upright over the hands)
    this.hips.rotation.z = p.hipRoll || 0;
    this.torso.rotation.z -= (p.hipRoll || 0) * 0.9;
    // the head: looks at what he's watching, or about him in a panic
    let hy = 0;
    if (this.lookAt) { const a2 = Math.atan2(this.lookAt[0] - this.x, this.lookAt[1] - this.z) - this.face - this.torso.rotation.y; hy = Math.max(-1.2, Math.min(1.2, Math.atan2(Math.sin(a2), Math.cos(a2)))); }
    else if (this.panic) hy = Math.sin(this.t * 1.3) * 0.15;
    const S2 = this.stagK || 0;
    this.head.rotation.set((p.head || 0) - (fast ? 0.12 : 0) * this.moving - (0.35 + 0.15 * Math.sin(this.t * 1.7)) * S2, this.head.rotation.y + (hy - this.head.rotation.y) * Math.min(1, dt * 8), Math.sin(this.t * 1.3) * 0.2 * S2);
  }
}

// THE SIDE VAULT: run up, both hands planted on the top of the barrier,
// weight onto the arms as the hips come up and the legs swing over to one
// side, tucked; then down on the far side, knees bending, and away
function vaultKeys(from, to, h) {
  const dx = to[0] - from[0], dz = to[1] - from[1], d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
  const mid = [from[0] + dx * 0.5, from[1] + dz * 0.5];
  const at = (m) => [mid[0] + ux * m, mid[1] + uz * m];
  const reach = 0.35 + h * 0.55;                     // (arms down to the top of it)
  return [
    { t: 0, pose: 'STAND', at: from },
    // the plant: leaning in, both hands down on the top rail, knees bent ready
    { t: 0.16, pose: { lean: 0.55, drop: 0.12, hipRoll: 0.15, shL: reach + 0.35, shR: reach + 0.35, elL: 0.15, elR: 0.15, outL: -0.1, outR: -0.1, thL: 0.4, knL: 0.6, thR: 0.4, knR: 0.6, head: 0.2 }, at: at(-0.42) },
    // up on the arms: hips lifting, the legs swinging out to the side, tucked
    { t: 0.36, pose: { lean: 0.35, hipRoll: 1.15, shL: reach * 0.75, shR: reach * 0.75, elL: 0.05, elR: 0.05, outL: -0.15, outR: -0.15, thL: 1.5, knL: 1.45, thR: 1.3, knR: 1.6, head: 0.15 }, at: at(-0.12), lift: h * 0.66 },
    // over the top: legs across to the far side, the hands pushing off
    { t: 0.52, pose: { lean: 0.2, hipRoll: 0.95, shL: 0.45, shR: 0.55, elL: 0.0, elR: 0.05, outL: 0.1, outR: 0.15, thL: 1.1, knL: 0.8, thR: 0.9, knR: 0.7 }, at: at(0.22), lift: h * 0.66 },
    // down on the far side, landing on bent knees, arms out for balance
    { t: 0.7, pose: { lean: 0.25, drop: 0.2, roll: 0.1, shL: 0.9, shR: 0.7, elL: 0.4, elR: 0.5, outL: 0.45, outR: 0.4, thL: 0.55, knL: 0.95, thR: 0.35, knR: 0.7 }, at: at(0.5), lift: 0 },
    { t: 0.85, pose: { lean: 0.3, shL: 0.4, shR: 0.2, elL: 1.2, elR: 1.2, thL: 0.2, knL: 0.3 }, at: at(0.7) },
  ];
}
// CLIMBING OUT OF THE CAR: sat in it, hands on the sides of the cockpit,
// pushed up to stand on the seat, one leg over the side, then the other,
// and down beside it. seat: [x, z], out: [x, z] (beside the car, on the
// side he's getting out), hipY: how high the seat is, hurry: 0 (dazed) - 1 (on fire)
// A marshal's axe, to cut a trapped driver free: a long handle, a red head
export function makeAxe() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.8 }), red = new THREE.MeshStandardMaterial({ color: 0xc81d25, roughness: 0.5, metalness: 0.4 }), steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.9 });
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.85, 8).translate(0, -0.3, 0), wood); h.castShadow = true; g.add(h);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.16).translate(0, -0.72, 0.06), red); head.castShadow = true; g.add(head);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.1, 0.04).translate(0, -0.72, 0.15), steel));
  return g;
}

export function climbOutKeys(seat, out, hipY = 0.35, hurry = 0.5) {
  const s = 1.6 - hurry * 0.75;                      // (slower if he's dazed)
  const sx = out[0] - seat[0], sz = out[1] - seat[1];
  const p = (m) => [seat[0] + sx * m, seat[1] + sz * m];
  const sit = 0.95 - hipY;                            // (how far the hips drop to sit in it)
  const floor = Math.max(0, hipY - 0.32);            // (he stands on the floor of the tub)
  return [
    // sat in it, legs out ahead under the dash, hands on the wheel
    { t: 0, pose: { drop: sit, lean: -0.15, thL: 1.5, thR: 1.5, knL: 0.25, knR: 0.25, shL: 1.15, shR: 1.15, elL: 0.6, elR: 0.6 }, at: p(0) },
    // hands to the cockpit sides
    { t: 0.35 * s, pose: { drop: sit, lean: 0.05, thL: 1.5, thR: 1.5, knL: 0.6, knR: 0.6, shL: 0.25, shR: 0.25, outL: 0.55, outR: 0.55, elL: 0.35, elR: 0.35 }, at: p(0) },
    // pushing up on them, knees drawn in
    { t: 0.75 * s, pose: { drop: sit * 0.55, lean: 0.35, thL: 1.3, thR: 1.2, knL: 1.6, knR: 1.6, shL: 0.1, shR: 0.1, outL: 0.45, outR: 0.45, elL: 0.05, elR: 0.05 }, at: p(0.02), lift: floor * 0.5 },
    // up, stood on the seat
    { t: 1.05 * s, pose: { drop: 0.05, lean: 0.2, thL: 0.2, knL: 0.3, shL: 0.35, shR: 0.35, outL: 0.5, outR: 0.5, elL: 0.2, elR: 0.2 }, at: p(0.08), lift: floor },
    // the near leg up and over the side, a hand on the side for balance
    { t: 1.45 * s, pose: { lean: 0.15, roll: -0.35, thL: 1.55, knL: 1.3, thR: 0.05, knR: 0.1, shL: 0.6, outL: 0.9, shR: 0.3, outR: 0.4, elL: 0.3, elR: 0.25 }, at: p(0.4), lift: floor + 0.05, keepFace: true },
    // astride the side, then the other leg over
    { t: 1.8 * s, pose: { lean: 0.25, roll: 0.25, thL: 0.25, knL: 0.35, thR: 1.4, knR: 1.4, shL: 0.5, outL: 0.5, shR: 0.7, outR: 0.6, elL: 0.3, elR: 0.3 }, at: p(0.75), lift: floor * 0.6 + 0.1, keepFace: true },
    // down on the ground beside it
    { t: 2.1 * s, pose: { drop: 0.18, lean: 0.3, thL: 0.5, knL: 0.8, thR: 0.4, knR: 0.7, shL: 0.6, shR: 0.6, outL: 0.3, outR: 0.3, elL: 0.6, elR: 0.6 }, at: p(1), lift: 0, keepFace: true },
    { t: 2.3 * s, pose: 'STAND', at: p(1) },
  ];
}

// skin, hair and the like, shared by everyone
let SKIN = null;
function skinMats(mats) {
  if (!SKIN) {
    const std = (c, r = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    SKIN = {
      skins: [std(0xd9a07a, 0.6), std(0xb57a52, 0.6), std(0x8a5a3a, 0.6), std(0xe8b896, 0.6)],
      hair: std(0x2a1d14, 0.85), eye: std(0x15110d, 0.3), cap: std(0xf2f2ee, 0.8), dark: std(0x1a1b1e, 0.5),
      reflect: std(0xe9ece0, 0.3, { emissive: 0x2a2c26, side: THREE.DoubleSide }),
    };
  }
  return { ...SKIN, skin: mats.skin || SKIN.skins[Math.floor(Math.random() * SKIN.skins.length)] };
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
    if (P.fuelLeak > 0) out.push({ key: 'cell', name: 'Fuel cell split', serious: true });
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
  fuelRate() { return Math.max(4, this.physics.spec.fuelCapacity / 9); }   // (full in about 9 s)

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
