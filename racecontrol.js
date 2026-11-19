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
export const BUILD = 7;

const std = (color, rough = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const boxAt = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function addMesh(parent, geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; parent.add(m); return m; }
// each wheel its own pair of groups: the outer turns to steer, the inner rolls
function wheelGroup(parent, x, z, r) {
  const steer = new THREE.Group(); steer.position.set(x, r, z); parent.add(steer);
  const spin = new THREE.Group(); steer.add(spin);
  (parent.userData.wheels || (parent.userData.wheels = [])).push({ steer, spin, r, front: z > 0 });
  return spin;
}
function wheels(parent, mat, rimMat, positions, r, w) {
  const geo = new THREE.CylinderGeometry(r, r, w, 18).rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.6, r * 0.6, w + 0.01, 14).rotateZ(Math.PI / 2);
  const spoke = new THREE.BoxGeometry(w + 0.02, r * 0.9, 0.05);
  for (const [x, z] of positions) { const s0 = wheelGroup(parent, x, z, r); addMesh(s0, geo, mat); addMesh(s0, rim, rimMat, false); addMesh(s0, spoke, mat, false); }
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
// a side profile (points along the length z, and up y) made solid across
// the width, with rounded edges: for van bodies and cabs
function profileBody(pts, width, bevel = 0.07) {
  const sh = new THREE.Shape();
  pts.forEach(([z, y], k) => (k ? sh.lineTo(-z, y) : sh.moveTo(-z, y)));
  sh.lineTo(-pts[0][0], pts[0][1]);
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
  g.rotateY(Math.PI / 2);                            // (the shape's x becomes -z, its depth becomes x)
  g.translate(-(width - bevel * 2) / 2, 0, 0);
  g.computeVertexNormals();
  return g;
}
// a box with rounded edges and corners
function roundBox(w, h, d, r, x = 0, y = 0, z = 0) {
  const sh = new THREE.Shape(), hw = w / 2 - r, hh = h / 2 - r;
  sh.moveTo(-hw, -h / 2); sh.lineTo(hw, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh); sh.lineTo(w / 2, hh);
  sh.quadraticCurveTo(w / 2, h / 2, hw, h / 2); sh.lineTo(-hw, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
  sh.lineTo(-w / 2, -hh); sh.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, d - r * 2), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 3, curveSegments: 4 });
  g.translate(x, y, z - (d - r * 2) / 2);
  g.computeVertexNormals();
  return g;
}
// proper road wheels: tyre with a rounded shoulder, a dished rim, a hub, and a dark arch above
function roadWheels(parent, positions, r, w, rimMat, { arch = null } = {}) {
  const tyreM = std(0x141414, 0.88), hubM = std(0x2b2d30, 0.4, { metalness: 0.6 });
  const tyre = new THREE.TorusGeometry(r - w * 0.28, w * 0.36, 8, 22).scale(1, 1, w / (w * 0.72)).rotateY(Math.PI / 2);
  const side = new THREE.CylinderGeometry(r * 0.66, r * 0.66, w * 0.9, 18).rotateZ(Math.PI / 2);
  const dish = new THREE.CylinderGeometry(r * 0.6, r * 0.5, 0.05, 14).rotateZ(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(r * 0.16, r * 0.18, 0.08, 10).rotateZ(Math.PI / 2);
  const lug = new THREE.BoxGeometry(0.03, r * 0.85, 0.06);
  for (const [x, z] of positions) {
    const o = Math.sign(x) * (w / 2);
    const s0 = wheelGroup(parent, x, z, r);
    addMesh(s0, tyre, tyreM);
    addMesh(s0, side, tyreM, false);
    addMesh(s0, dish.clone().translate(o * 0.9, 0, 0), rimMat, false);
    addMesh(s0, hub.clone().translate(o, 0, 0), hubM, false);
    addMesh(s0, lug.clone().translate(o * 0.95, 0, 0), hubM, false);          // (so you can see it roll)
    if (arch) addMesh(parent, new THREE.CylinderGeometry(r + 0.07, r + 0.07, w + 0.06, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).translate(x, r, z), arch, false);
  }
}
// the bright block pattern down the sides of an emergency vehicle
function blockStripe(c1, c2, w = 512, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let i = 0; i < w / 32; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? c1 : c2; g.fillRect(i * 32, j * 32, 32, 32); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, emissive: 0x111111 });
}

// --- THE AMBULANCE: a long-wheelbase high-roof van: the big box body
// with rounded edges, a short sloping bonnet and windscreen, cab windows,
// a high-visibility block pattern down each side, twin back doors with
// windows, a light bar front and back, mirrors, and proper wheels ---
function buildAmbulance() {
  const g = new THREE.Group();
  const white = std(0xf4f4f0, 0.35, { metalness: 0.15 }), black = std(0x17181b, 0.5), glass = std(0x1a2330, 0.08, { metalness: 0.5 });
  const trim = std(0x2a2c30, 0.6), rim = std(0xc2c6cc, 0.3, { metalness: 0.75 });
  // the body: one rounded profile from the back doors to the nose
  addMesh(g, profileBody([[-2.62, 0.42], [-2.62, 2.42], [-2.5, 2.52], [1.25, 2.52], [1.42, 2.4], [2.02, 1.32], [2.42, 1.12], [2.52, 0.86], [2.5, 0.42]], 1.9, 0.08), white);
  // windscreen and cab side windows
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 1.18), glass);
  ws.position.set(0, 1.86 + 0.05, 1.72 + 0.09); ws.rotation.x = -Math.atan2(0.6, 1.08); g.add(ws);   // (just proud of the rounded edge)
  for (const sx of [-1, 1]) {
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.55), glass); w1.position.set(sx * 0.962, 1.9, 1.1); w1.rotation.y = sx * Math.PI / 2; g.add(w1);
    // mirror
    addMesh(g, roundBox(0.09, 0.26, 0.17, 0.03, sx * 1.07, 1.82, 1.5), black, false);
    // the block pattern, and a red band above it
    const st = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 0.42), blockStripe('#0a5fd1', '#f2d21c'));
    st.position.set(sx * 0.962, 1.0, -0.2); st.rotation.y = sx * Math.PI / 2; g.add(st);
    const rb = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.14), std(0xc81e1e, 0.4)); rb.position.set(sx * 0.962, 1.33, -0.75); rb.rotation.y = sx * Math.PI / 2; g.add(rb);
    const word = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.32), label('AMBULANCE', 'transparent', '#c81e1e', 512, 64)); word.position.set(sx * 0.963, 1.72, -1.0); word.rotation.y = sx * Math.PI / 2; g.add(word);
    // the side door's line and a window in the back body
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), glass); bw.position.set(sx * 0.962, 1.95, -0.3); bw.rotation.y = sx * Math.PI / 2; g.add(bw);
    // wheel arches (dark mouldings)
    for (const z of [1.42, -1.62]) addMesh(g, new THREE.TorusGeometry(0.42, 0.05, 6, 16, Math.PI).rotateY(Math.PI / 2).translate(sx * 0.96, 0.36, z), trim, false);
  }
  // the back: twin doors with windows, a step, the block pattern
  for (const sx of [-0.47, 0.47]) { const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.55), glass); w2.position.set(sx, 1.92, -2.705); w2.rotation.y = Math.PI; g.add(w2); }
  addMesh(g, boxAt(0.02, 1.9, 0.01, 0, 1.45, -2.705), trim, false);
  const bs = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.32), blockStripe('#e3261c', '#f2d21c')); bs.position.set(0, 0.95, -2.706); bs.rotation.y = Math.PI; g.add(bs);
  addMesh(g, roundBox(1.7, 0.1, 0.3, 0.03, 0, 0.42, -2.75), trim);
  // bumpers, grille, headlights
  addMesh(g, roundBox(1.95, 0.24, 0.24, 0.07, 0, 0.5, 2.5), trim);
  addMesh(g, roundBox(1.0, 0.22, 0.05, 0.03, 0, 0.86, 2.52), black, false);
  for (const sx of [-0.68, 0.68]) addMesh(g, roundBox(0.34, 0.16, 0.06, 0.04, sx, 0.98, 2.44), std(0xe9eef4, 0.1, { emissive: 0x3a3a3a }), false);
  // light bars: on the front of the roof and at the back
  const beacons = [];
  for (const [z, w] of [[1.12, 1.5], [-2.45, 1.2]]) {
    addMesh(g, roundBox(w + 0.06, 0.08, 0.3, 0.03, 0, 2.56, z), trim, false);
    for (const sx of [-1, 1]) beacons.push(addMesh(g, roundBox(w / 2 - 0.05, 0.12, 0.26, 0.05, sx * w / 4, 2.66, z), std(0x3a0a0a, 0.2, { emissive: 0x000000, transparent: true, opacity: 0.92 }), false).material);
  }
  roadWheels(g, [[-0.84, 1.42], [0.84, 1.42], [-0.84, -1.62], [0.84, -1.62]], 0.36, 0.23, rim);
  // where the back doors are (medics come and go here)
  const doors = new THREE.Vector3(0, 0, -3.3);
  return { group: g, doors, flash: (t, on) => { beacons.forEach((m, k) => m.emissive.setHex(on && (Math.floor(t * 6) + k) % 2 ? (k % 2 ? 0x2a5cff : 0xff1a1a) : 0x000000)); } };
}

// --- THE RECOVERY CRANE: a compact wheeled crane, about 6.5 tonnes:
// a low yellow chassis on four big wheels, the cab off to one side, a
// turntable and a short telescopic boom with a hook, outriggers, and an
// amber beacon ---
// --- THE FLATBED: a recovery truck: a cab-over cab, a long flat steel
// bed with low sides and a ramp end, winch, beacons, twin rear wheels.
// The crane puts the wreck on it, and it takes it back to the pits ---
function buildFlatbed() {
  const g = new THREE.Group();
  const white = std(0xf1f1ec, 0.4, { metalness: 0.15 }), dark = std(0x24262a, 0.5), glass = std(0x1d2733, 0.08, { metalness: 0.5 });
  const steel = std(0x8d9298, 0.35, { metalness: 0.8 }), orange = std(0xf07b1a, 0.45), rim = std(0xc8ccd2, 0.3, { metalness: 0.7 });
  // chassis rails
  addMesh(g, roundBox(1.0, 0.3, 6.4, 0.05, 0, 0.75, -0.5), dark);
  // the cab, set over the front wheels
  addMesh(g, profileBody([[1.55, 0.6], [1.55, 2.45], [1.7, 2.6], [2.55, 2.6], [2.75, 2.35], [2.85, 1.2], [2.85, 0.6]], 2.2, 0.09), white);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.85), glass); ws.position.set(0, 2.0, 2.83); ws.rotation.x = -0.12; g.add(ws);
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.7), glass); w.position.set(sx * 1.112, 2.05, 2.25); w.rotation.y = sx * Math.PI / 2; g.add(w); addMesh(g, roundBox(0.09, 0.32, 0.18, 0.03, sx * 1.2, 2.0, 2.65), dark, false); }
  addMesh(g, roundBox(2.25, 0.28, 0.25, 0.06, 0, 0.62, 2.9), dark);
  for (const sx of [-0.75, 0.75]) addMesh(g, roundBox(0.32, 0.16, 0.06, 0.04, sx, 0.95, 2.9), std(0xe9eef4, 0.1, { emissive: 0x3a3a3a }), false);
  // the bed: long and flat, slightly tilted at the back like a ramp
  const BED_Y = 1.08;
  addMesh(g, roundBox(2.3, 0.12, 5.3, 0.03, 0, BED_Y - 0.06, -1.25), steel);
  for (const sx of [-1.16, 1.16]) addMesh(g, roundBox(0.06, 0.16, 5.3, 0.02, sx, BED_Y + 0.06, -1.25), orange, false);
  addMesh(g, roundBox(2.3, 0.08, 0.9, 0.02, 0, BED_Y - 0.25, -4.25).rotateX(0), steel);                 // the ramp end
  addMesh(g, roundBox(2.3, 0.5, 0.1, 0.03, 0, BED_Y + 0.25, 1.38), orange);                           // headboard
  addMesh(g, new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12).rotateZ(Math.PI / 2).translate(0, BED_Y + 0.12, 1.15), dark, false);   // winch
  // beacons on the cab roof
  const beacons = [];
  for (const sx of [-0.7, 0.7]) beacons.push(addMesh(g, new THREE.CylinderGeometry(0.09, 0.1, 0.16, 12).translate(sx, 2.7, 2.1), std(0x3a2a08, 0.2, { emissive: 0x000000 }), false).material);
  // the side stripe
  for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.2), blockStripe('#f07b1a', '#f2f2ec', 256, 32)); st.position.set(sx * 1.112, 1.25, 2.2); st.rotation.y = sx * Math.PI / 2; g.add(st); }
  roadWheels(g, [[-0.98, 2.1], [0.98, 2.1], [-0.98, -2.35], [0.98, -2.35], [-0.98, -3.25], [0.98, -3.25]], 0.48, 0.32, rim);
  return { group: g, bedY: BED_Y, bedAt: new THREE.Vector3(0, BED_Y, -1.3),
    flash: (t, on) => beacons.forEach((m, k) => m.emissive.setHex(on && (Math.floor(t * 3) + k) % 2 ? 0xffa010 : 0x000000)) };
}

function buildCrane() {
  const g = new THREE.Group();
  const yellow = std(0xe8b419, 0.42, { metalness: 0.2 }), dark = std(0x24262a, 0.5), glass = std(0x1d2733, 0.08, { metalness: 0.5 });
  const steel = std(0xa4a8ae, 0.3, { metalness: 0.85 }), chrome = std(0xd8dce2, 0.15, { metalness: 0.95 }), black = std(0x141414, 0.7);
  // the chassis: long and low with rounded edges, a counterweight at the back
  addMesh(g, roundBox(2.3, 0.7, 5.0, 0.12, 0, 1.02, 0), yellow);
  addMesh(g, roundBox(2.2, 0.62, 0.9, 0.14, 0, 1.15, -2.35), dark);
  // the chevrons on the back
  { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#e8b419'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#16171a'; for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 32, 64); x.lineTo(i * 32 + 16, 64); x.lineTo(i * 32 + 48, 0); x.lineTo(i * 32 + 32, 0); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 })); pl.position.set(0, 1.15, -2.81); pl.rotation.y = Math.PI; g.add(pl); }
  // the cab, off to the left: a rounded profile, lots of glass
  addMesh(g, profileBody([[0.85, 1.38], [0.85, 2.85], [1.0, 2.95], [1.75, 2.95], [1.98, 2.7], [2.15, 1.38]], 1.0, 0.06).translate(-0.62, 0, 0), yellow);
  for (const [w, h, x, y, z, ry] of [[0.82, 0.95, -0.62, 2.28, 2.09, 0], [0.9, 0.75, -1.125, 2.35, 1.4, -Math.PI / 2], [0.9, 0.75, -0.115, 2.35, 1.4, Math.PI / 2]]) {
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); w1.position.set(x, y, z); w1.rotation.y = ry; if (!ry) w1.rotation.x = -0.25; g.add(w1);
  }
  // steps and a grab rail by the cab door
  for (const y of [0.62, 0.95]) addMesh(g, boxAt(0.32, 0.04, 0.42, -1.2, y, 1.45), steel, false);
  addMesh(g, new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6).translate(-1.15, 1.95, 0.95), chrome, false);
  // outriggers: boxes across the chassis, with legs and pads at each corner
  for (const z of [1.85, -1.85]) {
    addMesh(g, roundBox(2.5, 0.22, 0.34, 0.05, 0, 0.82, z), dark);
    for (const sx of [-1.2, 1.2]) { addMesh(g, new THREE.CylinderGeometry(0.07, 0.07, 0.45, 8).translate(sx, 0.5, z), steel, false); addMesh(g, new THREE.CylinderGeometry(0.2, 0.22, 0.06, 12).translate(sx, 0.28, z), dark, false); }
  }
  // the turntable, the boom (three sections), the rams lifting it
  const turntable = new THREE.Group(); turntable.position.set(0.45, 1.45, -0.9); g.add(turntable);
  addMesh(turntable, new THREE.CylinderGeometry(0.72, 0.78, 0.32, 20).translate(0, 0.16, 0), dark);
  addMesh(turntable, roundBox(1.0, 0.75, 1.1, 0.1, 0, 0.62, -0.2), yellow);
  const boom = new THREE.Group(); boom.position.set(0, 0.85, -0.2); turntable.add(boom);
  addMesh(boom, roundBox(0.5, 0.52, 3.2, 0.06, 0, 0, 1.4), yellow);              // the base section (pointing forward, along +z)
  addMesh(boom, roundBox(0.4, 0.42, 2.0, 0.05, 0, 0, 3.4), yellow);              // the middle
  addMesh(boom, roundBox(0.31, 0.32, 1.25, 0.04, 0, 0, 4.6), yellow);            // the tip
  addMesh(boom, new THREE.CylinderGeometry(0.17, 0.17, 0.3, 14).rotateZ(Math.PI / 2).translate(0, -0.05, 5.15), dark, false);   // sheave at the end
  for (const sx of [-0.18, 0.18]) {
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.5, 10).rotateX(Math.PI / 2 - 0.55).translate(sx, -0.55, 0.95), steel); boom.add(ram);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8).rotateX(Math.PI / 2 - 0.55).translate(sx, -0.25, 1.5), chrome); boom.add(rod);
  }
  const hookAt = new THREE.Group(); hookAt.position.set(0, -0.15, 5.2); boom.add(hookAt);
  const cable = new THREE.Group(); hookAt.add(cable);
  for (const sx of [-0.05, 0.05]) addMesh(cable, new THREE.CylinderGeometry(0.012, 0.012, 1, 5).translate(sx, -0.5, 0), steel, false);
  const hook = new THREE.Group(); hookAt.add(hook);
  addMesh(hook, roundBox(0.28, 0.36, 0.2, 0.05, 0, -0.18, 0), std(0xd23c1a, 0.45));   // the hook block
  addMesh(hook, new THREE.TorusGeometry(0.1, 0.03, 6, 12, Math.PI * 1.4).rotateZ(Math.PI * 0.8).translate(0, -0.48, 0), steel, false);
  // slings hanging from the hook to lift the car
  const beacon = addMesh(g, new THREE.CylinderGeometry(0.09, 0.1, 0.18, 12).translate(-0.62, 3.05, 1.4), std(0x3a2a08, 0.2, { emissive: 0x000000, transparent: true, opacity: 0.9 }), false).material;
  const beacon2 = addMesh(g, new THREE.CylinderGeometry(0.08, 0.09, 0.16, 12).translate(0.9, 1.45, -2.4), std(0x3a2a08, 0.2, { emissive: 0x000000 }), false).material;
  roadWheels(g, [[-1.02, 1.55], [1.02, 1.55], [-1.02, -1.55], [1.02, -1.55]], 0.64, 0.5, std(0xe8b419, 0.45, { metalness: 0.3 }));
  return { group: g, turntable, boom, hookAt, cable, hook, flash: (t, on) => { const v = on && Math.floor(t * 3) % 2 ? 0xffa010 : 0x000000; beacon.emissive.setHex(v); beacon2.emissive.setHex(on && Math.floor(t * 3 + 1) % 2 ? 0xffa010 : 0); },
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
    this.parkTruck = { x: pit.garageX - 3.4, z: pit.z0 + 50 };
    this.truck = { ...buildFlatbed(), x: this.parkTruck.x, z: this.parkTruck.z, heading: Math.PI, v: 0, i: 0, lat: 0, state: 'parked', mode: 'free', route: [] };
    for (const v of [this.sc, this.ambulance, this.truck]) { scene.add(v.group); this.place(v); v.flash(0, false); }
    // their size (half width, half length, and how far the middle is from
    // the origin) and who gives way to whom (the higher goes first)
    Object.assign(this.sc, { hw: 0.98, hl: 2.4, mid: 0.1, pri: 4, wb: 2.8 });
    Object.assign(this.ambulance, { hw: 1.0, hl: 2.65, mid: 0, pri: 3, wb: 3.05 });
    Object.assign(this.truck, { hw: 1.2, hl: 3.7, mid: -0.55, pri: 2, wb: 4.9 });
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
      // its spot: on the verge between the track and the barrier (so it
      // never has to go through the barrier to get out), clear of
      // everything, as far off the tarmac as there's room for; or the
      // other side of the track; or, with no room either side, behind the post
      let park = null, side = 1;
      for (const sg of [1, -1]) {
        for (let k = 0; k < 7 && !park; k++) {
          const j = (best.i + k * 3 * (k % 2 ? 1 : -1) + this.m) % this.m, q = line[j];
          const sx = Math.sign((best.x - q.x) * q.lx + (best.z - q.z) * q.lz) * sg || sg;
          for (let off = 10; off >= 3.2; off -= 0.6) {
            const lat = sx * (q.width / 2 + off), px = q.x + q.lx * lat, pz = q.z + q.lz * lat;
            const edge = [q.x + q.lx * sx * q.width / 2, q.z + q.lz * sx * q.width / 2];
            if (this.hooks.blocked?.(px, pz, 2.2)) continue;
            if (!this.clearLine(edge, [px, pz], 1.6)) continue;
            park = { x: px, z: pz, i: j }; side = sx; break;
          }
        }
        if (park) break;
      }
      if (!park) park = { x: best.x + Math.sin(lp.heading) * 6 + ax / ad * 1.5, z: best.z + Math.cos(lp.heading) * 6 + az / ad * 1.5, i: best.i };
      // (parked along the track, facing the way the cars come)
      const ph = line[park.i].heading + Math.PI;
      const c = { ...buildCrane(), x: park.x, z: park.z, heading: ph, park, parkHeading: ph, state: 'parked', t: 0, lift: 0, post: best };
      c.setDrop(0.6);
      Object.assign(c, { hw: 1.25, hl: 2.6, mid: 0, pri: 1, wb: 3.1 });
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
  // (smoothly between the points of the line, not in 2 m jumps)
  placeOnLine(obj, i, lat) {
    const L = this.line, m = this.m, i0 = ((Math.floor(i) % m) + m) % m, f = i - Math.floor(i);
    const p = L[i0], q = L[(i0 + 1) % m];
    const px = p.x + (q.x - p.x) * f, pz = p.z + (q.z - p.z) * f;
    const lx = p.lx + (q.lx - p.lx) * f, lz = p.lz + (q.lz - p.lz) * f;
    let dh = q.heading - p.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const x = px + lx * lat, z = pz + lz * lat;
    obj.group.position.set(x, this.groundAt(x, z), z);
    // (the body turns smoothly too, and eases into lane changes)
    const want = p.heading + dh * f + (obj.latV || 0) * 0.08 * (obj.dir || 1) + ((obj.dir || 1) < 0 ? Math.PI : 0);
    obj.heading = obj.heading == null ? want : obj.heading + Math.atan2(Math.sin(want - obj.heading), Math.cos(want - obj.heading)) * 0.35;
    obj.group.rotation.y = obj.heading;
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
    v.mode = 'line'; const i = this.trackside.nearestLine(v.x, v.z, 80);
    v.i = i < 0 ? this.exitI : this.project(v.x, v.z, i).i;
    v.lat = i < 0 ? lat : this.project(v.x, v.z, i).lat;         // (from where it is, easing over to lat)
    v.latWant = lat;
  }
  // where a point is along the line (as a fractional point) and across it
  project(x, z, i) {
    const p = this.line[i], tx = Math.sin(p.heading), tz = Math.cos(p.heading);
    const along = (x - p.x) * tx + (z - p.z) * tz;
    return { i: ((i + along / 2) % this.m + this.m) % this.m, lat: (x - p.x) * p.lx + (z - p.z) * p.lz };
  }
  pointAt(i, lat) { const p = this.line[((Math.round(i) % this.m) + this.m) % this.m]; return [p.x + p.lx * lat, p.z + p.lz * lat]; }

  // ---- getting about without going through things ----
  // a path on foot: straight where it's clear, over a barrier (a vault),
  // round a fence, wall, hut or tree. opts: { run, panic, v }
  footPath(from, to, opts = {}, depth = 0) {
    const B = this.hooks.blocked;
    const go = (pt) => ({ go: pt, ...opts });
    if (!B || depth > 6) return [go(to)];
    const dx = to[0] - from[0], dz = to[1] - from[1], d = Math.hypot(dx, dz);
    if (d < 0.3) return [go(to)];
    const ux = dx / d, uz = dz / d, step = 0.25;
    for (let s0 = step; s0 < d; s0 += step) {
      const x = from[0] + ux * s0, z = from[1] + uz * s0;
      const c = B(x, z, 0.22);
      if (!c) continue;
      const entry = [from[0] + ux * Math.max(0, s0 - 0.45), from[1] + uz * Math.max(0, s0 - 0.45)];
      if (c.kind === 'armco' || c.kind === 'tyres' || c.kind === 'concrete' || c.kind === 'bollard') {
        // through it to the far side, and over
        let e = s0; while (e < d + 3 && B(from[0] + ux * e, from[1] + uz * e, 0.22)) e += step;
        const exit = [from[0] + ux * (e + 0.4), from[1] + uz * (e + 0.4)];
        const h = c.kind === 'concrete' ? 1.0 : c.kind === 'tyres' ? 0.9 : c.kind === 'bollard' ? 0.5 : 0.75;
        return [go(entry), { vault: exit, h, t: 0.55 + h * 0.3 }, ...this.footPath(exit, to, opts, depth + 1)];
      }
      // something not to climb: round the side of it (whichever way's clear first)
      const nx = -uz, nz = ux;
      for (const off of [1.5, 2.5, 4, 6, 9, 13, 18]) for (const sg of [1, -1]) {
        const mid = [x + nx * off * sg - ux * 0.5, z + nz * off * sg - uz * 0.5];
        if (B(mid[0], mid[1], 0.3)) continue;
        if (this.clearLine(from, mid, 0.22, true)) return [go(entry), ...this.footPath(entry, mid, opts, depth + 1), ...this.footPath(mid, to, opts, depth + 1)];
      }
      return [go(to)];
    }
    return [go(to)];
  }
  // is the straight line from a to b clear (barriers allowed, if vaultable)?
  clearLine(a, b, r, climbOK = false) {
    const B = this.hooks.blocked; if (!B) return true;
    const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz);
    for (let s0 = 0.25; s0 < d; s0 += 0.3) {
      const c = B(a[0] + dx / d * s0, a[1] + dz / d * s0, r);
      if (c && !(climbOK && (c.kind === 'armco' || c.kind === 'tyres' || c.kind === 'concrete' || c.kind === 'bollard'))) return false;
    }
    return true;
  }
  // a vehicle's way from where it is to a point: off the verge onto the
  // track, along it (the way the cars go, unless it's a red flag or
  // nothing's racing and back is shorter), then off to the point
  planDrive(v, to, { latEnd = null, allowBack = false } = {}) {
    const i0 = this.trackside.nearestLine(v.x, v.z, 90), i1 = this.trackside.nearestLine(to[0], to[1], 90);
    if (i0 < 0 || i1 < 0) return [{ to }];
    const fwd = ((i1 - i0) % this.m + this.m) % this.m, back = this.m - fwd;
    if (Math.min(fwd, back) < 10) return [{ to }];
    const dir = allowBack && back < fwd ? -1 : 1;
    const half = (i) => this.line[((i % this.m) + this.m) % this.m].width / 2;
    // its own side of the track, on the edge of the tarmac
    const sideOf = (x, z, i) => Math.sign(this.project(x, z, i).lat) || 1;
    const s0 = sideOf(v.x, v.z, i0), s1 = latEnd != null ? Math.sign(latEnd) || 1 : sideOf(to[0], to[1], i1);
    const lat0 = s0 * (half(i0) - 1.4), lat1 = latEnd ?? s1 * (half(i1) - 1.4);
    const j0 = i0 + dir * 5, j1 = i1 - dir * 6;
    return [{ to: this.pointAt(j0, lat0) }, { line: ((j1 % this.m) + this.m) % this.m, dir, lat: lat1, lat0 }, { to }];
  }
  // driving the legs of a plan: true when it's got there
  driveLegs(v, dt, vLine, vOff) {
    const leg = v.legs?.[0];
    if (!leg) return true;
    if (leg.to) {
      const d = Math.hypot(leg.to[0] - v.x, leg.to[1] - v.z), last = v.legs.length === 1;
      v.v = Math.min(vOff, 0.6 + d * (last ? 0.45 : 0.8));
      if (this.steerTo(v, leg.to[0], leg.to[1], v.v, dt, last ? (leg.short || 0) : 1.2, 1.3)) { v.legs.shift(); if (!v.legs.length) { v.v = 0; return true; } if (v.legs[0].line != null) this.startLine(v, v.legs[0]); }
      return false;
    }
    // along the track
    if (v.mode !== 'line') this.startLine(v, leg);
    const left = ((leg.line - v.i) * leg.dir % this.m + this.m) % this.m * 2;
    const want = Math.min(vLine, this.vMax[Math.floor(v.i) % this.m] * 0.9, Math.sqrt(2 * 2.5 * Math.max(0, left - 2)) + 1) * (v.slow ?? 1);
    v.v += Math.max(-5 * dt, Math.min(2 * dt, want - v.v));
    v.i = ((v.i + leg.dir * v.v * dt / 2) % this.m + this.m) % this.m;
    v.latV = (leg.lat - v.lat) * Math.min(1, dt * 0.4) / Math.max(dt, 1e-3);
    v.lat += (leg.lat - v.lat) * Math.min(1, dt * 0.4);
    v.dir = leg.dir;
    this.placeOnLine(v, v.i, v.lat + (v.latBias || 0));
    if (left < 3) { v.legs.shift(); v.mode = 'free'; v.heading = v.group.rotation.y; v.dir = 1; }
    return false;
  }
  startLine(v, leg) {
    const i = this.trackside.nearestLine(v.x, v.z, 90);
    const pr = this.project(v.x, v.z, i < 0 ? 0 : i);
    v.mode = 'line'; v.i = pr.i; v.lat = pr.lat; v.dir = leg.dir;
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
    want *= veh.slow ?? 1;
    veh.v += Math.max(-8 * dt, Math.min(3.5 * dt, want - veh.v));
    veh.i = (veh.i + veh.v * dt / 2) % m;
    this.placeOnLine(veh, veh.i, veh.lat + (veh.latBias || 0));
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
    const needs = this.lastNeeds = this.survey(S);
    // the phase for a race: red (set by bigIncident) runs its course; a car
    // stopped on the track: the safety car; off it: the VSC
    if (racing) {
      if (this.phase === 'red') {
        // (once the track's clear; a crane still busy off the track holds it up for a minute and a half at most)
        if (this.phaseT > 20 && !needs.onTrackWreck && (!this.crane || this.phaseT > 90) && !this.repairs.length) this.restart();
      } else if (needs.onTrackWreck || needs.fireOnTrack || this.repairs.some((r) => !r.done)) this.setPhase('sc');
      else if (needs.offTrackWreck) { if (this.phase === 'green') this.setPhase('vsc'); }
      else if (this.phase === 'vsc' && this.phaseT > 4 && !this.crane) this.setPhase('green');
    }
    // the crane, for the first wreck in the queue (only under a safety car,
    // a VSC or a red flag in a race; any time in practice)
    const craneOK = !racing || this.phase !== 'green';
    if (!this.crane && craneOK && needs.wrecks.length) this.sendCrane(needs.wrecks[0]);
    if (this.crane?.state === 'go') { const nw = needs.wrecks.find((x) => x.key === this.crane.w.key); if (nw) { this.crane.w.x = nw.x; this.crane.w.z = nw.z; } }
    if (this.crane) this.updateCrane(dt, S, this.crane);
    if (this.phase === 'sc' && this.sc.state === 'parked') this.sendSafetyCar();
    this.avoid(dt, S);
    this.updateSafetyCar(dt, needs);
    this.updateAmbulance(dt);
    this.updateTruck(dt, S);
    for (const c of this.cranes) if (c !== this.crane && c.state !== 'parked') this.updateCrane(dt, S, c);
    this.updateRepairs(dt);
    // fire marshals and sweepers
    for (const f of needs.fires) if (!this.jobs.has(f.key)) this.sendFireMarshals(f);
    if (needs.debris.length && !this.runners.some((r) => r.job === 'sweep')) this.sendSweeper(needs.debris[0]);
    this.medics?.update?.(dt);
    for (const r of this.runners) r.person.update(dt, this.groundAt);
    this.runners = this.runners.filter((r) => { if (r.done) { this.scene.remove(r.person.root); return false; } return true; });
    // nothing solid gets driven through
    this.separate(S);
    for (const v of [this.sc, this.ambulance, this.truck, ...this.cranes]) if (v) this.rollWheels(v, dt);
    this.peopleClear(S);
    this.bump(S.physics, [...this.cranes, this.ambulance, this.sc, this.truck].filter(Boolean));
    // your penalties
    if (racing) this.judge(dt, S);
  }

  // ---- what's out there: wrecks to lift, fires to put out, bits to sweep ----
  survey(S) {
    const out = { wrecks: [], fires: [], debris: [], onTrackWreck: false, offTrackWreck: false, fireOnTrack: false };
    const onTrack = (x, z) => { const i = this.trackside.nearestLine(x, z, 30); if (i < 0) return false; const p = this.line[i]; return Math.hypot(p.x - x, p.z - z) < p.width / 2 + 1.5; };
    const near = (x, z) => this.trackside.nearestLine(x, z, 40) >= 0;
    // you: broken down out on the circuit
    if (S.playerBroken && S.playerStopped > 6 && !S.inPits && this.truck.load?.kind !== 'player' && near(S.physics.x, S.physics.z)) {
      const on = onTrack(S.physics.x, S.physics.z);
      out.wrecks.push({ key: 'player', kind: 'player', x: S.physics.x, z: S.physics.z, obj: S.playerModel, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the computer cars that are out of it
    for (const c of this.ai.cars) {
      if (c.parked || c.recovered || c.onTruck || !(c.dnf || c.wrecked)) continue;
      const on = onTrack(c.physics.x, c.physics.z);
      out.wrecks.push({ key: c, kind: 'ai', car: c, x: c.physics.x, z: c.physics.z, obj: c.model.car, on });
      if (on) out.onTrackWreck = true; else out.offTrackWreck = true;
    }
    // the engine block, once it's lying still
    const B = S.engineBlock;
    if (B?.obj?.parent && B.rest && near(B.obj.position.x, B.obj.position.z)) {
      const on = onTrack(B.obj.position.x, B.obj.position.z);
      // (your car first: while it's sat there near the block, the crane's for the car, not the bits)
      const carNear = S.physics && S.playerStopped > 0.5 && !S.inPits && this.truck.load?.kind !== 'player' && Math.hypot(S.physics.x - B.obj.position.x, S.physics.z - B.obj.position.z) < 35;
      if (!B.fire && !carNear) { out.wrecks.push({ key: 'block', kind: 'block', x: B.obj.position.x, z: B.obj.position.z, obj: B.obj, on }); if (on) out.onTrackWreck = true; }
      else if (on) out.onTrackWreck = true;
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
    else if (a.state === 'out') {
      const p = this.line[Math.floor(a.i) % this.m], edge = p.width / 2 + 0.5;
      const latWant = Math.max(-edge, Math.min(edge, 4.5)) * a.side;
      a.latV = (latWant - a.lat) * Math.min(1, dt * 0.5) / Math.max(dt, 1e-3);
      a.lat += (latWant - a.lat) * Math.min(1, dt * 0.5);
      if (this.drive(a, dt, 40, a.target)) { a.state = 'wait'; a.wait = 0; a.latV = 0; }
    }
    else if (a.state === 'wait') {
      a.wait += dt;
      // the medics: out of the back for the driver, if he's out of his car
      const cas = this.hooks.casualty?.();
      if (cas && !this.medics) this.sendMedics(cas);
      if (this.medics ? this.medics.done : a.wait > (this.hooks.driverWaiting?.() ? 25 : 14)) { a.state = 'away'; this.medics = null; this.hooks.medicsDone?.(); }
    }
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
    this.sendCraneTo(c, w);
    this.hooks.toast?.(w.kind === 'player' ? 'RECOVERY CRANE ON ITS WAY' : null);
  }
  sendCraneTo(c, w) {
    // where it stops: beside the wreck, on the track side of it
    const wi = this.trackside.nearestLine(w.x, w.z, 60), wp = this.line[Math.max(0, wi)];
    let sx = wp.x - w.x, sz = wp.z - w.z, sd = Math.hypot(sx, sz);
    if (sd < 2) { sx = -Math.sin(wp.heading); sz = -Math.cos(wp.heading); sd = 1; }     // (on the racing line: behind it)
    const stand = [w.x + sx / sd * 4.2, w.z + sz / sd * 4.2];
    const red = this.phase === 'red' || !(this.ai.race && this.ai.race.phase === 'racing');
    Object.assign(c, { w, stand, aimAt: [w.x, w.z], state: 'go', t: 0, lift: 0, offset: null, legs: this.planDrive(c, stand, { allowBack: red }), mode: 'free' });
    c.legs[c.legs.length - 1].short = 0.3;
  }
  place(v) { v.group.position.set(v.x, this.groundAt(v.x, v.z), v.z); v.group.rotation.y = v.heading; }
  steerTo(v, tx, tz, speed, dt, stopShort = 0, turn = 0.9) {
    speed *= v.slow ?? 1;
    const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
    if (d <= stopShort + 0.2) return true;
    const want = Math.atan2(dx, dz);
    let df = want - v.heading; df = Math.atan2(Math.sin(df), Math.cos(df));
    // (a real vehicle: it can only turn as it rolls, no tighter than full
    // lock lets it; it slows for a sharp turn rather than pivoting)
    const step = Math.min(d - stopShort, speed * dt * Math.max(0.35, Math.cos(df)));
    const L = v.wb || 3, lock = Math.tan(0.6) / L;
    // (a point inside its turning circle: after a few seconds going round, a
    // shunt: it gets some extra turn, the way a driver backs and fills)
    v.orbitT = Math.abs(df) > 1.0 && d < 2 / lock ? (v.orbitT || 0) + dt : 0;
    const extra = v.orbitT > 2.5 ? dt * 0.6 : 0;
    v.heading += Math.max(-step * lock - extra, Math.min(step * lock + extra, df));
    v.x += Math.sin(v.heading) * step; v.z += Math.cos(v.heading) * step;
    this.place(v);
    return false;
  }
  updateCrane(dt, S, c) {
    const w = c.w;
    c.flash(this.t, c.state !== 'parked');
    c.t += dt;
    if (c.state === 'home') {
      c.turntable.rotation.y *= 1 - Math.min(1, dt * 1.2); c.boom.rotation.x *= 1 - Math.min(1, dt * 1.2); c.setDrop(0.6);
      if (this.driveLegs(c, dt, 5.5, 2.2)) { c.state = 'back'; c.t = 0; }
      return;
    }
    if (c.state === 'back') {
      // boom down, and round to face the way it parks
      c.turntable.rotation.y *= 1 - Math.min(1, dt * 1.5); c.boom.rotation.x *= 1 - Math.min(1, dt * 1.5); c.setDrop(0.6);
      if (c.t > 2) { c.state = 'parked'; c.flash(0, false); c.turntable.rotation.y = 0; c.boom.rotation.x = 0; c.parkHeading = c.heading; }
      return;
    }
    const obj = w.obj;
    if (c.state === 'go') {
      // out at a crawl (20 km/h along the track, walking pace off it), and
      // it holds back 20 m off while there's still a fire there
      const fire = (this.lastNeeds?.fires || []).some((f) => Math.hypot(f.x - w.x, f.z - w.z) < 12);
      const d = Math.hypot(w.x - c.x, w.z - c.z);
      if (fire && d < 22) { c.v = 0; c.waiting = true; return; }
      c.waiting = false;
      // (the wreck's been moved since it set off: a new way there)
      if (Math.hypot(w.x - c.aimAt[0], w.z - c.aimAt[1]) > 4) { this.sendCraneTo(c, w); }
      if (this.driveLegs(c, dt, 7, 2.2)) { c.state = "reach"; c.t = 0; }
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
      // a car goes on the flatbed (called out now, if it's free); the engine
      // block, or with the truck busy, over the barrier
      if (c.useTruck == null) c.useTruck = (w.kind === 'player' || w.kind === 'ai') && this.sendTruck(c);
      const T = this.truck;
      if (c.useTruck) {
        c.lift = Math.min(2.2, c.lift + dt * 0.5);
        if (T.state !== 'waiting') return this.hang(c, w, obj, S);          // (holding it up, waiting for the truck)
        T.group.updateMatrixWorld(true);
        c.dropAt = T.bedAt.clone().applyMatrix4(T.group.matrixWorld);
      }
      // the boom swings round and lifts it over the barrier, off the track
      if (!c.dropAt) {
        const i = this.trackside.nearestLine(c.x, c.z, 60), lp = this.line[Math.max(0, i)];
        let ox = c.x - lp.x, oz = c.z - lp.z, od = Math.hypot(ox, oz);
        if (od < 0.5) { ox = lp.lx; oz = lp.lz; od = 1; }
        c.dropAt = new THREE.Vector3(c.x + ox / od * 5.2, 0, c.z + oz / od * 5.2);
      }
      const local = c.group.worldToLocal(new THREE.Vector3(c.dropAt.x, c.group.position.y, c.dropAt.z));
      const yaw = Math.atan2(local.x - c.turntable.position.x, local.z - c.turntable.position.z);
      const dy = Math.atan2(Math.sin(yaw - c.turntable.rotation.y), Math.cos(yaw - c.turntable.rotation.y));
      c.turntable.rotation.y += Math.max(-dt * 0.35, Math.min(dt * 0.35, dy));
      if (!c.useTruck) c.lift = 1.6 + 0.6 * Math.min(1, c.t / 2);   // (high enough to clear the barrier)
      // (and the boom out or in a little, so the hook's over the spot)
      const reach = Math.hypot(local.x - c.turntable.position.x, local.z - c.turntable.position.z);
      c.boom.rotation.x += ((reach > 4.9 ? -0.2 : -0.32 - (4.9 - reach) * 0.12) - c.boom.rotation.x) * Math.min(1, dt * 1.2);
      if (Math.abs(dy) < 0.03 && c.t > 2.5) { c.state = 'drop'; c.t = 0; }
    } else if (c.state === 'drop') {
      c.lift = Math.max(c.useTruck ? this.truck.bedY : 0, 2.2 - c.t * 1.2);
      if (c.t > 1.7 && c.useTruck) {
        this.hookLift = null;
        // on the bed: the truck takes it from here
        const T = this.truck;
        T.load = w; T.state = 'carry'; T.carryT = 0;
        if (w.kind === 'ai') w.car.onTruck = true;
        c.state = 'home'; c.t = 0; c.lift = 0; c.w = null; c.dropAt = null; c.useTruck = null;
        c.legs = this.planDrive(c, [c.park.x, c.park.z], { allowBack: true });
        if (this.crane === c) this.crane = null;
        return;
      }
      if (c.t > 1.6 && !c.useTruck) {
        // done: the wreck's dealt with
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; }
        else if (w.kind === 'block') this.hooks.removeBlock?.();
        // and home, empty
        c.state = 'home'; c.t = 0; c.lift = 0; c.w = null; c.dropAt = null; c.useTruck = null;
        c.legs = this.planDrive(c, [c.park.x, c.park.z], { allowBack: true });
        if (this.crane === c) this.crane = null;
        return;
      }
    }
    this.hang(c, w, obj, S);
  }
  // the wreck hanging from the hook
  hang(c, w, obj, S) {
    // the wreck hangs from the hook while it's lifted and carried
    if (c.state === 'lift' || c.state === 'carry' || c.state === 'drop') {
      c.hookAt.updateWorldMatrix(true, false);
      const h = c.hookAt.getWorldPosition(new THREE.Vector3());
      if (c.state === 'lift' && c.t < 0.1) c.offset = new THREE.Vector3(w.x - h.x, 0, w.z - h.z);
      const k = c.state === 'lift' ? 1 - Math.min(1, c.t / 2) : 0;
      let x = h.x + (c.offset?.x || 0) * k, z = h.z + (c.offset?.z || 0) * k, lift = c.lift;
      // lowering it onto the truck: guided across onto the middle of the bed
      // (the marshals steadying it), turned to lie along it, and set down
      if (c.state === 'drop' && c.useTruck) {
        const T = this.truck; T.group.updateMatrixWorld(true);
        const bed = T.bedAt.clone().applyMatrix4(T.group.matrixWorld);
        const e = Math.min(1, c.t / 1.4), ee = e * e * (3 - 2 * e);
        x += (bed.x - x) * ee; z += (bed.z - z) * ee;
        lift = (2.2 - (2.2 - T.bedY) * ee) + (this.groundAt(bed.x, bed.z) - this.groundAt(x, z)) * ee;
        const want = T.group.rotation.y, h0 = w.h0 ?? (w.h0 = (w.kind === 'player' ? S.physics?.heading : w.kind === 'ai' ? w.car.physics.heading : 0) ?? 0);
        const hh = h0 + Math.atan2(Math.sin(want - h0), Math.cos(want - h0)) * ee;
        if (w.kind === 'player' && S.physics) S.physics.heading = hh;
        if (w.kind === 'ai') { w.car.physics.heading = hh; if (obj) obj.rotation.y = hh; }
      }
      w.x = x; w.z = z;
      if (obj) { obj.position.x = x; obj.position.z = z; obj.position.y = this.groundAt(x, z) + lift; }
      if (w.kind === 'player' && S.physics) { S.physics.x = x; S.physics.z = z; S.physics.vx = S.physics.vy = 0; this.liftedPlayer = lift; this.hookLift = lift; }
      if (w.kind === 'ai') { w.car.physics.x = x; w.car.physics.z = z; w.car.lift = lift; }
    }
  }

  // ---- the flatbed: out of the pit lane to the crane, then the wreck back to the pits ----
  sendTruck(c) {
    const T = this.truck;
    if (T.state !== 'parked') return false;
    // where it waits: on the track beside the crane, nose the way the cars go
    const i = this.trackside.nearestLine(c.x, c.z, 60);
    if (i < 0) return false;
    const pr = this.project(c.x, c.z, i), half = this.line[i].width / 2;
    const lat = Math.sign(pr.lat || 1) * Math.max(0, Math.min(half - 1.6, Math.abs(pr.lat) - 3.6));
    T.spot = this.pointAt(i + 2, lat); T.spotI = i + 2;
    T.state = 'leaving'; T.mode = 'free'; T.route = this.exitRoute(); T.v = 0;
    this.hooks.toast?.(c.w?.kind === 'player' ? 'THE FLATBED\'S ON ITS WAY' : null);
    return true;
  }
  updateTruck(dt, S) {
    const T = this.truck;
    if (T.state === 'parked') return;
    T.flash(this.t, T.state !== 'home' && T.state !== 'unload');
    const red = this.phase === 'red' || !(this.ai.race && this.ai.race.phase === 'racing');
    if (T.state === 'leaving') {
      if (this.followRoute(T, dt, T.route.length > 1 ? 16 : 18)) { T.legs = this.planDrive(T, T.spot, { allowBack: red, latEnd: this.project(T.spot[0], T.spot[1], ((T.spotI % this.m) + this.m) % this.m).lat || 0.01 }); T.state = 'going'; }
    } else if (T.state === 'going') {
      if (this.driveLegs(T, dt, 16, 3)) { T.state = 'waiting'; T.v = 0; }
    } else if (T.state === 'carry') {
      // on round to the pit entry (the way the cars go), in, and to the box
      // (the short way back, against the way the cars go, only when nothing's racing or it's a red flag)
      if (!T.toPits) {
        const i = this.trackside.nearestLine(T.x, T.z, 60), fwd = ((this.entryI - i) % this.m + this.m) % this.m;
        const dir = red && this.m - fwd < fwd ? -1 : 1;
        T.legs = [{ line: dir > 0 ? this.entryI : (this.entryI + 4) % this.m, dir, lat: 0 }];
        T.toPits = 'track';
      }
      if (T.toPits === 'track') {
        if (this.driveLegs(T, dt, 22, 4)) {
          T.toPits = 'lane'; T.mode = 'free'; T.heading = T.group.rotation.y;
          const B = this.pit.box, P = this.pit;
          T.route = T.load.kind === 'player'
            ? [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, B.z + 16], [B.x, B.z + 7], [B.x, B.z + 2.5]]
            : [[P.laneX - 1, P.entryZ - 15], [P.laneX, P.z1 - 5], [P.laneX, P.z0 + 60], [this.parkTruck.x, this.parkTruck.z + 6]];
        }
      } else if (T.toPits === 'lane') {
        if (this.followRoute(T, dt, 16)) { T.state = 'unload'; T.t = 0; }
      }
    } else if (T.state === 'unload') {
      // off the back, and the car's dealt with
      T.t += dt;
      if (T.t > 2) {
        const w = T.load;
        if (w.kind === 'player') this.hooks.recoverPlayer?.();
        else if (w.kind === 'ai') { w.car.recovered = true; w.car.parked = true; w.car.onTruck = false; const k = this.ai.cars.indexOf(w.car); w.car.physics.x = 1e4 + k * 30; w.car.physics.z = 1e4; w.car.full = false; if (w.obj) w.obj.position.y = 0; }
        T.load = null; T.toPits = null; T.state = 'home';
        T.route = [[this.pit.laneX, T.z - 12], [this.pit.laneX, this.parkTruck.z + 14], [this.parkTruck.x, this.parkTruck.z + 4], [this.parkTruck.x, this.parkTruck.z]];
        return;
      }
    } else if (T.state === 'home') {
      if (this.followRoute(T, dt, 14)) { T.state = 'parked'; T.heading = Math.PI; this.place(T); T.flash(0, false); }
    }
    // the load rides on the bed
    if (T.load) {
      const w = T.load;
      T.group.updateMatrixWorld(true);
      const at = T.bedAt.clone().applyMatrix4(T.group.matrixWorld);
      w.x = at.x; w.z = at.z;
      const h = T.group.rotation.y;
      if (w.obj) { w.obj.position.set(at.x, at.y, at.z); if (w.kind === 'ai') w.obj.rotation.y = h; }
      if (w.kind === 'player' && S.physics) { S.physics.x = at.x; S.physics.z = at.z; S.physics.vx = S.physics.vy = 0; S.physics.heading = h; this.liftedPlayer = T.bedY; }
      if (w.kind === 'ai') { w.car.physics.x = at.x; w.car.physics.z = at.z; w.car.physics.heading = h; w.car.lift = this.groundAt(at.x, at.z) * 0 + T.bedY; }
    }
  }
  // how high your car is lifted (on the hook, or on the truck's bed)
  get playerLift() {
    if (this.truck?.load?.kind === 'player') return this.truck.bedY;
    if (this.crane?.w?.kind === 'player') return this.hookLift ?? this.crane.lift;
    return 0;
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
    return { behind: [post.x + ax / ad * 2.2, post.z + az / ad * 2.2], corner: [post.x + tx * 2.3 * side + ax / ad * 0.3, post.z + tz * 2.3 * side + az / ad * 0.3] };
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
    const job = { f, out: false, crew: [] };
    for (let k = 0; k < 2; k++) this.sendExtinguisher(job, post, k);
  }
  // one marshal with an extinguisher: out at a sprint, over the barrier,
  // then at the fire in bursts from the side away from the smoke, working
  // round it, until it's out (or his can's empty: then another comes)
  sendExtinguisher(job, post, k) {
    const f = job.f;
    const r = this.newRunner(post, 'fire');
    const ext = makeExtinguisher(this.mats);
    // held across the body like a rifle: one hand on the handle, the other under the can
    ext.rotation.x = Math.PI / 2 - 0.25; ext.position.set(0, -0.05, -0.2);
    r.person.hold(ext, 'front');
    r.can = 16;                                         // (seconds of spray in it)
    let ang = (k % 2 ? 1 : -1) * 0.9 + Math.atan2(post.x - f.x, post.z - f.z);
    const ring = f.kind === 'car' ? 2.4 : 2.0;
    const spot = () => [f.x + Math.sin(ang) * ring, f.z + Math.cos(ang) * ring];
    const out = () => (this.hooks.fireLeft?.(f.kind) ?? 0) <= 0 || job.out;
    const burst = () => [
      { face: [f.x, f.z], quick: true },
      { pose: 'SPRAY_RIFLE' },
      { fn: () => { r.spraying = true; } },
      { until: () => { r.burstT = (r.burstT || 0) + 1 / 60; return out() || r.burstT > 1.1 + Math.random() * 0.6 || r.can <= 0; } },
      { fn: () => { r.spraying = false; r.burstT = 0; } },
      { pose: 'RIFLE', t: 0.35 },
      // step round a little for the next one
      { fn: () => { if (!out() && r.can > 0) { ang += (k % 2 ? 1 : -1) * (0.25 + Math.random() * 0.25); r.person.then([{ go: spot(), v: 1.4 }, ...burst()]); } else r.person.then(after()); } },
    ];
    const after = () => {
      if (out()) {
        if (!job.out) { job.out = true; this.hooks.extinguish?.(f.kind); setTimeout(() => this.jobs.delete(f.key), 8000); }
        return [{ pose: 'STAND' }, { look: [f.x, f.z] }, { wait: 2.5 }, { look: null }, { pose: 'RIFLE' }, ...this.footPath(spot(), r.hut.corner), { go: r.hut.behind }, { fn: () => { r.done = true; } }];
      }
      // can's empty: back for another, and someone else comes with a full one
      this.sendExtinguisher(job, post, k + 2);
      return [{ pose: 'STAND' }, ...this.footPath(spot(), r.hut.corner), { go: r.hut.behind }, { fn: () => { r.done = true; } }];
    };
    r.person.run([
      { wait: (k % 2) * 0.35 },
      { pose: 'RIFLE' },
      { look: [f.x, f.z] },
      { go: r.hut.corner, run: true, panic: true },
      ...this.footPath(r.hut.corner, spot(), { run: true, panic: true }),
      { look: null },
      ...burst(),
    ]);
    // each burst knocks it down (two of them on it at once: twice as fast)
    r.sprayAt = () => {
      if (!r.spraying) return null;
      r.can -= 1 / 60;
      this.hooks.douse?.(f.kind, (f.kind === 'car' ? 0.075 : 0.06) / 60 * (0.9 + Math.random() * 0.2));
      return { x: r.person.x, z: r.person.z, tx: f.x, tz: f.z };
    };
    job.crew.push(r);
  }
  sendSweeper(d) {
    d.swept = true;
    const post = this.nearestPost(d.obj.position.x, d.obj.position.z);
    if (!post) return;
    const r = this.newRunner(post, 'sweep');
    const at = [d.obj.position.x, d.obj.position.z];
    r.person.run([
      { go: r.hut.corner, run: true },
      ...this.footPath(r.hut.corner, at, { run: true }),
      { pose: 'REACH', t: 0.6 },
      { fn: () => { this.hooks.removeDebris?.(d); } },
      { pose: 'CARRY' },
      ...this.footPath(at, r.hut.corner),
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
    // (they stand on the track side of it, just off it, facing it)
    let nx = lp ? lp.x - at.x : 1, nz = lp ? lp.z - at.z : 0; const nd = Math.hypot(nx, nz) || 1; nx /= nd; nz /= nd;
    for (let k = 0; k < 3; k++) {
      const r = this.newRunner(post, 'repair');
      const off = (k - 1) * 1.6;
      const on = [at.x + tx * off, at.z + tz * off], stand = [on[0] + nx * 0.85, on[1] + nz * 0.85];
      r.person.run([
        { wait: k * 0.5 },
        { go: r.hut.corner, run: true },
        ...this.footPath(r.hut.corner, stand, { run: true }),
        { face: on, quick: true }, { look: on },
        { pose: k === 1 ? 'BOLT' : 'WORK' },
        { until: () => rep.done },
        { pose: 'STAND' }, { look: null },
        ...this.footPath(stand, r.hut.corner),
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
      if (rep.crew.every((r) => r.person.want === 'WORK' || r.person.want === 'BOLT' || r.done)) {
        rep.t += dt;
        // (and it shows: the dents pulled out a bit at a time while they work)
        this.hooks.repairBarrier?.(rep, Math.min(1, dt * 3 / rep.need));
      }
      if (rep.t > rep.need) { rep.done = true; this.hooks.repairBarrier?.(rep, 1); this.hooks.barrierFixed?.(rep); this.hooks.toast?.('BARRIER REPAIRED'); }
    }
    this.repairs = this.repairs.filter((r) => !r.done || r.crew.some((c) => !c.done));
  }
  // white extinguisher clouds, for the game to draw (where, and at what)
  // ---- the medics: two out of the back of the ambulance ----
  // cas: { person (the driver), hurt (down: the stretcher) }
  sendMedics(cas) {
    const a = this.ambulance, M = this.medics = { done: false, crew: [], cas };
    if (!this.medicMats) {
      this.medicMats = { look: 'medic', suits: [std(0x1f6b3a, 0.8)], helmet: this.mats.helmet, visor: this.mats.visor, glove: std(0x3a6bd8, 0.6), boot: std(0x111111, 0.8) };
    }
    a.group.updateMatrixWorld(true);
    const back = a.doors.clone().applyMatrix4(a.group.matrixWorld), door = [back.x, back.z];
    const D = cas.person, body = D.bodyAt, at = () => body;
    // (one each side of him, halfway along, kneeling by his chest)
    const across = D.face + Math.PI / 2;
    const side = (k) => [body[0] + Math.sin(across) * (k ? 0.65 : -0.65), body[1] + Math.cos(across) * (k ? 0.65 : -0.65)];
    // the stretcher: a frame with a mattress, carried by its ends
    let stretcher = null;
    if (cas.hurt) {
      stretcher = new THREE.Group();
      addMesh(stretcher, roundBox(0.6, 0.08, 2.0, 0.03, 0, 0.0, 0), std(0xe8e8e2, 0.6));
      addMesh(stretcher, roundBox(0.56, 0.06, 1.9, 0.02, 0, 0.06, 0), std(0xd23a1f, 0.7));
      for (const sx of [-0.31, 0.31]) addMesh(stretcher, new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6).rotateX(Math.PI / 2).translate(sx, 0, 0), std(0xa4a8ae, 0.3, { metalness: 0.8 }), false);
      stretcher.visible = false; this.scene.add(stretcher);
    }
    let carried = false;
    const h0 = Math.atan2(door[0] - body[0], door[1] - body[1]);
    for (let k = 0; k < 2; k++) {
      const p = new Person(this.medicMats, 0);
      p.place(door[0] + (k - 0.5) * 0.7, door[1], a.heading + Math.PI);
      this.scene.add(p.root);
      const r = { person: p, job: 'medic', done: false };
      this.runners.push(r); M.crew.push(r);
      const there = side(k);
      const list = [
        { wait: 0.4 + k * 0.3 },
        ...this.footPath([p.x, p.z], there, { run: true }),
        { face: at() },
        { pose: 'MEDIC', t: cas.hurt ? 5 : 3.5 },
      ];
      if (cas.hurt) {
        // onto the stretcher, lifted, carried to the back doors and in
        list.push(
          { fn: () => { if (k === 0) { stretcher.visible = true; stretcher.position.set(body[0], this.groundAt(body[0], body[1]) + 0.28, body[1]); stretcher.rotation.y = h0; } } },
          { go: [body[0] + Math.sin(h0) * (k ? -1.15 : 1.15), body[1] + Math.cos(h0) * (k ? -1.15 : 1.15)] },
          { face: body },
          { pose: 'STRETCH', t: 1.2 },
          { fn: () => { if (k === 0) { carried = true; this.hooks.onStretcher?.(stretcher); } } },
          { pose: 'STRETCH_UP', t: 0.6 },
        );
      } else {
        list.push({ fn: () => { if (k === 0) this.hooks.helpUp?.(door); } }, { pose: 'STAND', t: 0.8 });
      }
      list.push(
        { until: () => carried || !cas.hurt },
        { fn: () => { if (cas.hurt) { r.person.follow = () => { const h = stretcher.rotation.y, e = k ? -1.15 : 1.15, sx = stretcher.position.x + Math.sin(h) * e, sz = stretcher.position.z + Math.cos(h) * e; return [sx, sz, h, M.moving ? 1.2 : 0]; }; } } },
        { until: () => M.loaded || !cas.hurt },
        { fn: () => { r.person.follow = null; } },
        ...(cas.hurt ? [] : this.footPath(there, door, { v: 1.4 })),
        { go: door },
        { fn: () => { r.done = true; r.person.root.visible = false; if (k === 1) M.done = true; } },
      );
      p.run(list);
    }
    // the stretcher's own trip to the doors once it's up
    M.update = (dt) => {
      if (!carried || M.loaded || !stretcher) return;
      const dx = door[0] - stretcher.position.x, dz = door[1] - stretcher.position.z, d = Math.hypot(dx, dz);
      M.moving = d > 0.6;
      if (d > 0.6) { const st = Math.min(d, 1.2 * dt); stretcher.position.x += dx / d * st; stretcher.position.z += dz / d * st; stretcher.position.y = this.groundAt(stretcher.position.x, stretcher.position.z) + 0.85; stretcher.rotation.y += Math.atan2(Math.sin(Math.atan2(dx, dz) - stretcher.rotation.y), Math.cos(Math.atan2(dx, dz) - stretcher.rotation.y)) * Math.min(1, dt * 2); }
      else { M.loaded = true; stretcher.visible = false; this.scene.remove(stretcher); this.hooks.loaded?.(); }
    };
  }
  sprays() { const out = []; for (const r of this.runners) { const s = r.sprayAt?.(); if (s) out.push(s); } return out; }

  // ---- solid vehicles: you don't drive through them ----
  // ---- keeping out of each other's way ----
  // each one looks ahead along its way: anything in its path (another of
  // them, a car) and it eases off, and (on the track) moves over to pass
  // it, the one lower down the order giving way. A stuck pair: the lower
  // one backs off and lets the other through.
  circles(v) {
    const h = v.group.rotation.y, fx = Math.sin(h), fz = Math.cos(h), out = [], r = v.hw + 0.05;
    const n = Math.max(2, Math.ceil(v.hl / v.hw));
    for (let k = 0; k < n; k++) { const a = v.mid - v.hl + r + (2 * (v.hl - r)) * k / (n - 1); out.push([v.group.position.x + fx * a, v.group.position.z + fz * a, r]); }
    return out;
  }
  avoid(dt, S) {
    const V = [this.sc, this.ambulance, this.truck, ...this.cranes].filter(Boolean);
    const others = [...V.map((v) => ({ x: v.group.position.x, z: v.group.position.z, hw: v.hw, hl: v.hl, pri: v.pri, v })),
      ...this.ai.cars.filter((c) => !c.parked).map((c) => ({ x: c.physics.x, z: c.physics.z, hw: 1, hl: 2.3, pri: 9 }))];
    if (S.physics) others.push({ x: S.physics.x, z: S.physics.z, hw: 1, hl: 2.3, pri: 9 });
    for (const A of V) {
      if (A.state === 'parked') { A.slow = 1; continue; }
      const h = A.group.rotation.y, fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
      let slow = 1, bias = 0;
      for (const B of others) {
        if (B.v === A) continue;
        const rx = B.x - A.group.position.x, rz = B.z - A.group.position.z;
        const ahead = rx * fx + rz * fz, side = rx * lx + rz * lz;
        const lane = A.hw + B.hw + 0.7;
        if (ahead <= 0 || ahead > 16 || Math.abs(side) > lane) continue;
        const gap = ahead - A.hl - B.hl - 0.8;
        // (a car, or one higher up the order, or one stopped: ease off for it)
        const yields = B.pri > A.pri || B.v?.state === 'parked' || (B.v && (B.v.v || 0) < 0.5);
        // (on the track it moves over and goes round, so it only slows to a
        // crawl, not a stop, unless it's already as far over as it can go)
        const canPass = A.mode === 'line' && Math.abs(A.latBias || 0) < 3.8;
        const floor = canPass ? 0.3 : 0;
        slow = Math.min(slow, yields ? Math.max(floor, Math.min(1, gap / 7)) : Math.max(0.35, Math.min(1, gap / 5)));
        bias += -(Math.sign(side) || 1) * (lane - Math.abs(side)) * Math.max(0, 1 - Math.max(0, gap) / 10);
      }
      // a pair stuck nose to nose for a while: the lower one goes anyway (round it)
      A.stuckT = slow < 0.05 ? (A.stuckT || 0) + dt : 0;
      if (A.stuckT > 3) { slow = 0.3; bias *= 1.5; }
      A.slow = (A.slow ?? 1) + (slow - (A.slow ?? 1)) * Math.min(1, dt * 6);
      // (moving over, on the track: the bias across it)
      if (A.mode === 'line') {
        const p = this.line[Math.floor(A.i) % this.m];
        const want = Math.max(-4, Math.min(4, bias * (lx * p.lx + lz * p.lz)));
        A.latBias = (A.latBias || 0) + (want - (A.latBias || 0)) * Math.min(1, dt * 1.5);
      } else A.latBias = (A.latBias || 0) * Math.max(0, 1 - dt * 2);
    }
  }
  // and nothing goes through anything: overlapping ones pushed apart (the
  // one lower down the order, or stopped, moves; one parked never does)
  separate(S) {
    const V = [this.sc, this.ambulance, this.truck, ...this.cranes].filter(Boolean);
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
      const A = V[i], B = V[j];
      if (A.state === 'parked' && B.state === 'parked') continue;
      if (Math.hypot(A.group.position.x - B.group.position.x, A.group.position.z - B.group.position.z) > A.hl + B.hl + 2) continue;
      let px = 0, pz = 0;
      for (const [ax, az, ar] of this.circles(A)) for (const [bx, bz, br] of this.circles(B)) {
        const dx = ax - bx, dz = az - bz, d = Math.hypot(dx, dz), o = ar + br - d;
        if (o > 0 && d > 1e-4) { px += dx / d * o; pz += dz / d * o; }
      }
      if (!px && !pz) continue;
      const aFixed = A.state === 'parked', bFixed = B.state === 'parked';
      const kA = aFixed ? 0 : bFixed ? 1 : A.pri < B.pri ? 1 : A.pri > B.pri ? 0 : 0.5;
      this.nudge(A, px * kA * 0.5, pz * kA * 0.5); this.nudge(B, -px * (1 - kA) * 0.5, -pz * (1 - kA) * 0.5);
    }
    // the computer cars out of them too
    for (const c of this.ai.cars) {
      if (c.parked || c.onTruck) continue;
      for (const v of V) for (const [cx, cz, r] of this.circles(v)) {
        const dx = c.physics.x - cx, dz = c.physics.z - cz, d = Math.hypot(dx, dz), o = r + 0.95 - d;
        if (o > 0 && d > 1e-4) { c.physics.x += dx / d * o; c.physics.z += dz / d * o; }
      }
    }
  }
  // nobody walks through a vehicle, a car, or anyone else: pushed back out
  // of them (not while being carried, or mid-vault)
  peopleClear(S) {
    const people = [...this.runners.map((r) => r.person), ...(this.hooks.people?.() || [])].filter((p) => p && p.root.visible && !p.follow && !p.keyed);
    const blobs = [];
    for (const v of [this.sc, this.ambulance, this.truck, ...this.cranes]) if (v) blobs.push(...this.circles(v));
    const car = (x, z, h) => { const fx = Math.sin(h), fz = Math.cos(h); for (const a of [-1.4, 0, 1.4]) blobs.push([x + fx * a, z + fz * a, 0.95]); };
    if (S.physics) car(S.physics.x, S.physics.z, S.physics.heading);
    for (const c of this.ai.cars) if (!c.parked) car(c.physics.x, c.physics.z, c.physics.heading);
    for (const p of people) {
      for (const [bx, bz, br] of blobs) {
        const dx = p.x - bx, dz = p.z - bz, d = Math.hypot(dx, dz), o = br + 0.3 - d;
        if (o > 0 && d > 1e-4) { p.x += dx / d * o; p.z += dz / d * o; }
      }
    }
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j], dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz), o = 0.55 - d;
      if (o > 0 && d > 1e-4) { a.x += dx / d * o / 2; a.z += dz / d * o / 2; b.x -= dx / d * o / 2; b.z -= dz / d * o / 2; }
    }
  }
  // the wheels: the front ones turned by how sharply it's turning, all of them rolling
  rollWheels(v, dt) {
    const W = v.group.userData.wheels; if (!W) return;
    const px = v.group.position.x, pz = v.group.position.z, h = v.group.rotation.y;
    if (v.lastP) {
      const dx = px - v.lastP[0], dz = pz - v.lastP[1];
      const along = dx * Math.sin(h) + dz * Math.cos(h);
      let dh = h - v.lastP[2]; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      const L = v.wb || 3;
      const want = Math.abs(along) > 1e-3 ? Math.max(-0.6, Math.min(0.6, Math.atan(dh * L / along))) : (v.steerA || 0);
      v.steerA = (v.steerA || 0) + (want - (v.steerA || 0)) * Math.min(1, dt * 6);
      for (const w of W) { if (w.front) w.steer.rotation.y = v.steerA; w.spin.rotation.x += along / w.r; }
    }
    v.lastP = [px, pz, h];
  }
  nudge(v, x, z) {
    if (!x && !z) return;
    if (v.mode === 'line') { const p = this.line[Math.floor(v.i) % this.m]; v.lat += x * p.lx + z * p.lz; this.placeOnLine(v, v.i, v.lat + (v.latBias || 0)); }
    else { v.x += x; v.z += z; v.group.position.x += x; v.group.position.z += z; }
  }

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
