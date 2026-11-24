// =====================================================================
// TRACKSIDE: everything around Sepang that makes it look and work like a
// real circuit.
//   - Marshal posts every ~240 m: a small hut, an LED flag light panel on
//     a pole, and two marshals with flags. Each post looks after the
//     stretch of track up to the next one (its "sector").
//   - Watchtowers at the big corners (raised cabins on legs)
//   - The start gantry over the line: five columns of red lights (lit one
//     by one, then out to start the race), green when the track's open
//   - TV camera towers where the broadcast cameras sit (outside the big
//     braking zones and hairpins, on the straights), and low cameras on
//     tripods at the apexes. Sepang's hot, so the operators have umbrellas.
//   - Distance boards (300, 200, 100) before the big stops
//   - Advertising boards along the straights (made-up sponsors)
//
// FLAGS (shown by the marshals and on the light panels):
//   green          the danger's over (the post after a yellow), or track open
//   yellow         danger ahead: a car stopped off the track. Slow down
//   double yellow  a car stopped ON the track. Be ready to stop
//   red            session stopped (a car on fire on the track, or wreckage)
//   blue           a faster car is about to lap you: let it by
//   white          a slow car on the track ahead
//   red/yellow     oil or coolant on the track: slippery
//   black          disqualified
//   black/white    a warning (track limits)
//   meatball       your car is damaged (leaking, bits hanging off): pit now
//   chequered      the finish
// The game (rendering.js) works out what's happening on track and hands
// it to update(); this works out which flag every post shows.
// =====================================================================

import * as THREE from 'three';
import { addCollider, canvasTexture } from './scenery.js';
import { Person } from './pits.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 7;

export const FLAG_NAMES = {
  green: 'GREEN FLAG', yellow: 'YELLOW FLAG', yellow2: 'DOUBLE YELLOW', red: 'RED FLAG', blue: 'BLUE FLAG',
  white: 'WHITE FLAG', oil: 'SLIPPERY TRACK', black: 'BLACK FLAG', bw: 'BLACK AND WHITE FLAG',
  meatball: 'MEATBALL FLAG', chequered: 'CHEQUERED FLAG', sc: 'SAFETY CAR', vsc: 'VIRTUAL SAFETY CAR',
};

// The flags' faces, painted on a canvas (the cloth and the light panels)
export function paintFlag(g, w, h, flag) {
  const fill = (c, x = 0, y = 0, ww = w, hh = h) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
  switch (flag) {
    case 'green': fill('#18a84a'); break;
    case 'yellow': case 'yellow2': fill('#ffd21a'); break;
    case 'red': fill('#e3221b'); break;
    case 'blue': fill('#1f6fe0'); break;
    case 'white': fill('#f4f4f0'); break;
    case 'black': fill('#121212'); break;
    case 'oil': fill('#ffd21a'); for (let k = 0; k < 6; k += 2) fill('#e3221b', (k * w) / 6, 0, w / 6, h); break;
    case 'bw': fill('#f4f4f0'); g.fillStyle = '#121212'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(0, h); g.closePath(); g.fill(); break;
    case 'meatball': fill('#121212'); g.fillStyle = '#ff7a12'; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2); g.fill(); break;
    case 'sc': case 'vsc': {
      fill('#f4f4f0'); g.strokeStyle = '#121212'; g.lineWidth = Math.max(2, w / 20); g.strokeRect(1, 1, w - 2, h - 2);
      g.fillStyle = '#121212'; g.font = `bold ${Math.round(h * (flag === 'sc' ? 0.62 : 0.5))}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(flag.toUpperCase(), w / 2, h / 2 + 1); break;
    }
    case 'chequered': for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) fill((i + j) % 2 ? '#121212' : '#f4f4f0', (i * w) / 6, (j * h) / 4, w / 6 + 0.5, h / 4 + 0.5); break;
    default: fill('#1a1c1f');
  }
}

const FLAGS = ['green', 'yellow', 'yellow2', 'red', 'blue', 'white', 'oil', 'black', 'bw', 'meatball', 'chequered', 'sc', 'vsc'];
// which flags the marshals wave (the rest just hold them out still)
const WAVED = new Set(['yellow', 'yellow2', 'blue', 'red', 'chequered', 'oil']);
// which flags blink on the light panels
const BLINK = new Set(['yellow', 'yellow2', 'red', 'blue', 'sc', 'vsc']);

export function buildTrackside(scene, { line, kerb, surfaceAt, colliders, corners, startI, heightAt = () => 0, isMobile = false }) {
  const groundAt = heightAt;
  const m = line.length;
  const P = (i) => line[((i % m) + m) % m];
  const edgeOf = (p) => p.width / 2 + kerb;
  const group = new THREE.Group();
  group.userData.noLift = true;   // (already built at the ground's height: the game mustn't lift it again)
  scene.add(group);

  // --- Finding clear spots beside the track ---
  // colliders in 10 m buckets, and the centre line in 16 m buckets
  const CB = 10, cBuckets = new Map();
  const cKey = (x, z) => Math.floor(x / CB) * 100003 + Math.floor(z / CB);
  const bucketCollider = (c) => {
    for (let bx = Math.floor(c.minX / CB); bx <= Math.floor(c.maxX / CB); bx++) for (let bz = Math.floor(c.minZ / CB); bz <= Math.floor(c.maxZ / CB); bz++) {
      const k = bx * 100003 + bz;
      if (!cBuckets.has(k)) cBuckets.set(k, []);
      cBuckets.get(k).push(c);
    }
  };
  for (const c of colliders) bucketCollider(c);
  // (our own solid bits go in the buckets too, so nothing's built on top of them)
  const addSolid = (...a) => { const c = addCollider(...a); bucketCollider(c); return c; };
  const solidNear = (x, z, r) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      for (const c of cBuckets.get(cKey(x + dx * CB, z + dz * CB)) || []) {
        if (x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r) return true;
      }
    }
    return false;
  };
  const LB = 16, lBuckets = new Map();
  line.forEach((p, i) => { const k = Math.floor(p.x / LB) * 100003 + Math.floor(p.z / LB); if (!lBuckets.has(k)) lBuckets.set(k, []); lBuckets.get(k).push(i); });
  // the nearest point of the centre line (index), within reach metres
  const nearestLine = (x, z, reach = 60) => {
    let best = -1, bd = reach * reach;
    const bx = Math.floor(x / LB), bz = Math.floor(z / LB), r = Math.ceil(reach / LB);
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      for (const i of lBuckets.get((bx + dx) * 100003 + (bz + dz)) || []) {
        const p = line[i], d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
    }
    return best;
  };
  // clear grass all round, and well away from every part of the track
  const clearAt = (x, z, r) => {
    for (let a = 0; a < 8; a++) if (surfaceAt(x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r) !== 'grass') return false;
    if (surfaceAt(x, z) !== 'grass' || solidNear(x, z, r + 0.5)) return false;
    const i = nearestLine(x, z, 40);
    if (i >= 0) { const p = line[i]; if (Math.hypot(p.x - x, p.z - z) < edgeOf(p) + 5 + r) return false; }
    return true;
  };
  // Walk out from the track at point i on one side: past any barrier,
  // to the first clear spot (at least minOff beyond the kerb)
  const placeOut = (i, side, minOff, r = 1.6) => {
    const p = P(i), edge = edgeOf(p);
    let barrier = null;
    for (let o = edge + 1; o < edge + 70; o += 0.5) {
      const x = p.x + p.lx * side * o, z = p.z + p.lz * side * o;
      if (barrier == null && solidNear(x, z, 0.2)) barrier = o;
      if (o < edge + minOff || (barrier != null && o < barrier + 2.5 + r)) continue;
      if (clearAt(x, z, r)) return { x, z, o, side, i };
    }
    return null;
  };
  const placeEither = (i, preferSide, minOff, r) => {
    const a = placeOut(i, preferSide, minOff, r), b = placeOut(i, -preferSide, minOff, r);
    if (a && b) return a.o <= b.o + 6 ? a : b;
    return a || b;
  };
  const cornerAt = (i) => corners.find((c) => ((i - c.a + m) % m) <= ((c.b - c.a + m) % m));
  const byNumber = (n) => corners.find((c) => c.number === n);
  // facing: the way from (x, z) back to the track at point i, as a y rotation
  const towardTrack = (x, z, i) => { const p = P(i); return Math.atan2(p.x - x, p.z - z); };
  const facingTraffic = (x, z, i) => { const p = P(i); const tx = p.x - x, tz = p.z - z, l = Math.hypot(tx, tz) || 1; return Math.atan2(tx / l * 0.6 - p.ux * 0.8, tz / l * 0.6 - p.uz * 0.8); };

  // --- Instanced parts (one draw each, however many there are) ---
  const parts = new Map();
  const part = (name, geo, mat, shadow = true) => { parts.set(name, { geo, mat, shadow, list: [] }); };
  const put = (name, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) => parts.get(name).list.push([x, y, z, ry, sx, sy, sz]);
  const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
  const boxGeo = (w, h, d, y0 = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y0 + h / 2, 0); return g; };
  const cylGeo = (r0, r1, h, seg = 8, y0 = 0) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(0, y0 + h / 2, 0); return g; };
  const white = std(0xe9e9e4), grey = std(0x77797c, 0.7), dark = std(0x26282b, 0.6), steel = std(0x9a9ea3, 0.45, { metalness: 0.6 });
  const orange = std(0xff7a12, 0.75), skin = std(0xc49a7a, 0.7), khaki = std(0x3b3f45, 0.8);
  part('hut', boxGeo(2.4, 2.2, 2.0), white);
  part('hutRoof', boxGeo(3.0, 0.14, 2.6, 2.2), grey);
  part('hutStripe', boxGeo(2.42, 0.25, 2.02, 1.5), std(0xff7a12, 0.6));
  part('panelPole', cylGeo(0.07, 0.07, 2.6, 6), steel);
  part('panelBox', boxGeo(1.3, 1.0, 0.18, 2.5), dark);
  // (a person's outline turned round: boots, legs, hips, chest, shoulders, neck)
  const figureGeo = (w) => { const pts = [[0, 0], [0.12, 0], [0.13, 0.08], [0.12, 0.5], [0.15, 0.82], [0.18, 0.92], [0.17, 1.05], [0.2, 1.25], [0.23 * w, 1.36], [0.18, 1.42], [0.06, 1.44], [0.055, 1.5], [0, 1.5]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 10).scale(1, 1, 0.72); };
  part('body', figureGeo(1), orange);
  part('head', (() => { const g = new THREE.SphereGeometry(0.12, 10, 8); g.translate(0, 1.55, 0); return g; })(), skin);
  part('cap', (() => { const g = new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(0, 1.58, 0); return g; })(), std(0xf2f2ee, 0.6));
  part('towerLeg', boxGeo(0.18, 4.2, 0.18), steel);
  part('towerCab', boxGeo(3.0, 2.3, 3.0, 4.2), white);
  part('towerGlass', boxGeo(3.05, 0.9, 3.05, 5.3), std(0x2b3f52, 0.15, { metalness: 0.3 }));
  part('towerRoof', boxGeo(3.6, 0.16, 3.6, 6.5), grey);
  part('scaffLeg', boxGeo(0.08, 5, 0.08), steel);
  part('scaffBrace', boxGeo(0.06, 0.06, 2.1, 0), steel);
  part('scaffDeck', boxGeo(2.2, 0.1, 2.2, 5), std(0x6a5a44, 0.9));
  part('camBody', boxGeo(0.32, 0.3, 0.7, 0), dark);
  part('camLens', (() => { const g = new THREE.CylinderGeometry(0.11, 0.13, 0.5, 10); g.rotateX(Math.PI / 2); g.translate(0, 0.15, 0.55); return g; })(), std(0x111214, 0.3));
  part('tripod', cylGeo(0.03, 0.03, 1.3, 5), dark);
  part('umbPole', cylGeo(0.025, 0.025, 2.2, 5), steel);
  part('umbrella', (() => { const g = new THREE.ConeGeometry(1.25, 0.45, 12, 1, true); g.translate(0, 2.2, 0); return g; })(), std(0xffffff, 0.8, { side: THREE.DoubleSide, vertexColors: false }));
  part('opBody', figureGeo(0.97).scale(1, 0.95, 1), khaki);
  part('boardPost', boxGeo(0.12, 1.9, 0.12), steel);
  part('billLeg', boxGeo(0.15, 1.3, 0.15), steel);

  const parked = [];   // things with their own meshes (boards, flags, lights)
  const posts = [];

  // --- Marshal posts: one at the line (the flag platform on the pit wall),
  // then every ~240 m round the lap ---
  const L = line[m - 1].s;
  const spacing = 240;
  const flagMats = {};
  const panelMats = {};
  for (const f of FLAGS) {
    const tex = canvasTexture(64, 48, (g, w, h) => paintFlag(g, w, h, f));
    flagMats[f] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
    const lit = canvasTexture(64, 48, (g, w, h) => {
      paintFlag(g, w, h, f);
      // (LED dots)
      g.fillStyle = 'rgba(0,0,0,0.35)';
      for (let y = 2; y < h; y += 4) for (let x = 2; x < w; x += 4) { g.fillRect(x - 1, y - 1, 1, 1); }
    });
    panelMats[f] = new THREE.MeshBasicMaterial({ map: lit, toneMapped: false });
  }
  panelMats.off = new THREE.MeshBasicMaterial({ color: 0x15171a });
  // the flag: real cloth, a sheet of points that ripples and flaps (the
  // far marshals' flags share one sheet; the near ones each have their own)
  const makeCloth = () => { const g = new THREE.PlaneGeometry(0.9, 0.62, 12, 7); g.translate(0.45, 0.31, 0); g.userData.rest = g.attributes.position.array.slice(); return g; };
  const clothGeo = makeCloth();                     // (hangs from the tip of the pole, along it)
  const rippleCloth = (g, t, wave, droop) => {
    const a = g.attributes.position, r = g.userData.rest;
    for (let i = 0; i < a.count; i++) {
      const x = r[i * 3], y = r[i * 3 + 1], u = x / 0.9;            // (u: 0 at the pole, 1 at the free end)
      const flap = Math.sin(x * 7 - t * (6 + wave * 6) + y * 2) * (0.04 + wave * 0.11) * u + Math.sin(x * 13 - t * 9) * 0.015 * u;
      a.setXYZ(i, x * (1 - droop * 0.25 * u), y - droop * u * u * 0.35, flap);
    }
    a.needsUpdate = true; g.computeVertexNormals();
  };
  const poleGeo = cylGeo(0.012, 0.016, 1.15, 6, -1.1);   // (carries on past the hand)
  const gripGeo = cylGeo(0.022, 0.022, 0.16, 8, -1.13);    // (a rubber grip where it's held)
  const armGeo = cylGeo(0.055, 0.05, 0.62, 6, -0.62);
  const panelFaceGeo = new THREE.PlaneGeometry(1.16, 0.86);

  // one marshal: the static body (instanced), and his arm with a flag (his own meshes)
  const addMarshal = (x, z, ry, y0) => {
    const idx = { body: parts.get('body').list.length, head: parts.get('head').list.length, cap: parts.get('cap').list.length };
    put('body', x, y0, z, ry); put('head', x, y0, z, ry); put('cap', x, y0, z, ry);
    const shoulder = new THREE.Group();
    shoulder.position.set(x + Math.cos(ry) * 0.24, y0 + 1.36, z - Math.sin(ry) * 0.24);
    shoulder.rotation.y = ry;
    const arm = new THREE.Mesh(armGeo, orange);
    const flag = new THREE.Group();
    flag.position.set(0, -0.6, 0);
    const pole = new THREE.Mesh(poleGeo, dark);
    const cloth = new THREE.Mesh(clothGeo, flagMats.yellow);
    cloth.position.set(0, -1.1, 0);
    flag.add(pole, new THREE.Mesh(gripGeo, dark), cloth);
    shoulder.add(arm, flag);
    group.add(shoulder);
    return { shoulder, flag, cloth, phase: Math.random() * 6, idx, x, z, ry, y0 };
  };
  const addPost = (spot, i, { platform = false } = {}) => {
    const y = groundAt(spot.x, spot.z);
    const face = facingTraffic(spot.x, spot.z, i);
    const toTrack = towardTrack(spot.x, spot.z, i);
    const post = { i, x: spot.x, z: spot.z, flag: null, shown: null, marshals: [] };
    const base = platform ? y + 1.2 : y;     // (the platform at the line stands on the pit wall)
    if (platform) {
      // the flag platform at the line, with a light panel beside it
      const p = P(i), px = spot.x - p.ux * 2, pz = spot.z - p.uz * 2;
      put('panelPole', px, base, pz, face); put('panelBox', px, base, pz, face);
      post.panelAt = [px, base, pz];
    } else {
      put('hut', spot.x, y, spot.z, toTrack); put('hutRoof', spot.x, y, spot.z, toTrack); put('hutStripe', spot.x, y, spot.z, toTrack);
      addSolid(spot.x - 1.5, spot.x + 1.5, spot.z - 1.5, spot.z + 1.5, 'building');
      // the light panel, on its pole between the hut and the track
      const tx = Math.sin(toTrack), tz = Math.cos(toTrack);
      const px = spot.x + tx * 1.8 - Math.cos(toTrack) * 0.9, pz = spot.z + tz * 1.8 + Math.sin(toTrack) * 0.9;
      put('panelPole', px, y, pz, face);
      put('panelBox', px, y, pz, face);
      post.panelAt = [px, y, pz];
      addSolid(px - 0.15, px + 0.15, pz - 0.15, pz + 0.15, 'building');
    }
    // the light panel's face
    const [px, py, pz] = post.panelAt;
    const panel = new THREE.Mesh(panelFaceGeo, panelMats.off);
    panel.position.set(px + Math.sin(face) * 0.1, py + 3.0, pz + Math.cos(face) * 0.1);
    panel.rotation.y = face;
    group.add(panel);
    post.panel = panel;
    // two marshals, in front of the hut, facing the oncoming cars
    const tx = Math.sin(toTrack), tz = Math.cos(toTrack);
    for (const k of platform ? [0] : [0, 1]) {
      const along = (k ? -1 : 1) * 0.7;
      const mx = spot.x + tx * (platform ? 0.3 : 1.5) + Math.cos(toTrack) * along, mz = spot.z + tz * (platform ? 0.3 : 1.5) - Math.sin(toTrack) * along;
      post.marshals.push(addMarshal(mx, mz, face, base));
    }
    posts.push(post);
    return post;
  };

  // the flag platform at the start/finish line, on the pit wall
  {
    const p = P(startI);
    const side = Math.sign(p.lx) > 0 ? 1 : -1;                // (the pit wall is on the +x side)
    const o = (12.45 - p.x) / (p.lx * side || 1);
    addPost({ x: p.x + p.lx * side * o, z: p.z + p.lz * side * o }, startI, { platform: true });
  }
  const startS = P(startI).s;
  for (let s = spacing; s < L - spacing * 0.6; s += spacing) {
    const target = (startS + s) % L;
    let i = line.findIndex((p) => p.s >= target);
    if (i < 0) i = 0;
    const c = cornerAt(i);
    const spot = placeEither(i, c ? -c.side : 1, 3, 1.6) || placeEither(i + 6, 1, 3, 1.6) || placeEither(i - 6, 1, 3, 1.6);
    if (spot) addPost(spot, spot.i);
  }
  posts.sort((a, b) => ((a.i - startI + m) % m) - ((b.i - startI + m) % m));
  // each post covers the track up to the next one
  posts.forEach((p, k) => { p.from = p.i; p.to = posts[(k + 1) % posts.length].i; });
  const sectorOf = (i) => {
    for (let k = posts.length - 1; k >= 0; k--) if (((i - startI + m) % m) >= ((posts[k].i - startI + m) % m)) return k;
    return 0;
  };

  // --- Watchtowers at the big corners ---
  for (const n of [1, 4, 9, 15]) {
    const c = byNumber(n);
    if (!c) continue;
    const spot = placeOut(c.apex - 8, -c.side, 8, 2.4);
    if (!spot) continue;
    const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
    for (const [ax, az] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) put('towerLeg', spot.x + ax, y, spot.z + az);
    put('towerCab', spot.x, y, spot.z, ry); put('towerGlass', spot.x, y, spot.z, ry); put('towerRoof', spot.x, y, spot.z, ry);
    addSolid(spot.x - 1.5, spot.x + 1.5, spot.z - 1.5, spot.z + 1.5, 'building');
  }

  // --- TV cameras: on scaffold towers outside the big stops and on the
  // straights, and low on tripods at the tightest apexes ---
  const umbrellaColours = [0xd8312a, 0x2a62c9, 0xf2c12e, 0x2b9a52, 0xf4f4f0];
  const ops = [];   // the camera operators (the near ones become real people)
  let umb = 0;
  const cameraTower = (spot) => {
    const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put('scaffLeg', spot.x + ax, y, spot.z + az);
    for (const h of [1.6, 3.3]) { put('scaffBrace', spot.x - 1, y + h, spot.z, 0); put('scaffBrace', spot.x + 1, y + h, spot.z, 0); put('scaffBrace', spot.x, y + h, spot.z - 1, Math.PI / 2); put('scaffBrace', spot.x, y + h, spot.z + 1, Math.PI / 2); }
    put('scaffDeck', spot.x, y, spot.z);
    const cx = spot.x + Math.sin(ry) * 0.4, cz = spot.z + Math.cos(ry) * 0.4;
    put('tripod', cx, y + 5.1, cz); put('camBody', cx, y + 6.4, cz, ry); put('camLens', cx, y + 6.4, cz, ry);
    ops.push({ x: spot.x - Math.sin(ry) * 0.4, y: y + 5.1, z: spot.z - Math.cos(ry) * 0.4, ry, idx: { opBody: parts.get('opBody').list.length, head: parts.get('head').list.length } });
    put('opBody', spot.x - Math.sin(ry) * 0.4, y + 5.1, spot.z - Math.cos(ry) * 0.4, ry);
    put('head', spot.x - Math.sin(ry) * 0.4, y + 5.05, spot.z - Math.cos(ry) * 0.4, ry);
    put('umbPole', spot.x, y + 5.1, spot.z); umbrellas.push([spot.x, y + 5.1, spot.z, umbrellaColours[umb++ % umbrellaColours.length]]);
    addSolid(spot.x - 1.1, spot.x + 1.1, spot.z - 1.1, spot.z + 1.1, 'building');
  };
  const umbrellas = [];
  const lowCamera = (spot) => {
    const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
    put('tripod', spot.x, y, spot.z); put('camBody', spot.x, y + 1.3, spot.z, ry); put('camLens', spot.x, y + 1.3, spot.z, ry);
    const ox = spot.x - Math.sin(ry) * 0.6, oz = spot.z - Math.cos(ry) * 0.6;
    ops.push({ x: ox, y, z: oz, ry, idx: { opBody: parts.get('opBody').list.length, head: parts.get('head').list.length } });
    put('opBody', ox, y, oz, ry); put('head', ox, y - 0.05, oz, ry);
    put('umbPole', ox + 0.4, y, oz); umbrellas.push([ox + 0.4, y, oz, umbrellaColours[umb++ % umbrellaColours.length]]);
    addSolid(spot.x - 0.5, spot.x + 0.5, spot.z - 0.5, spot.z + 0.5, 'building');
  };
  const cameras = [];
  for (const n of [1, 2, 4, 6, 9, 11, 14, 15]) {
    const c = byNumber(n);
    if (!c) continue;
    const spot = placeOut(c.a + 4, -c.side, 6, 1.4);
    if (spot) { cameraTower(spot); cameras.push({ n, x: spot.x, z: spot.z }); }
  }
  for (const n of [2, 9, 15]) {
    const c = byNumber(n);
    if (!c) continue;
    const spot = placeOut(c.apex, c.side, 4, 0.8);
    if (spot) { lowCamera(spot); cameras.push({ n, low: true, x: spot.x, z: spot.z }); }
  }
  // on the straights: halfway down the back straight and the main straight
  {
    const t15 = byNumber(15), t14 = byNumber(14);
    if (t14 && t15) {
      const mid = Math.round((t14.b + ((t15.a - t14.b + m) % m) / 2)) % m;
      const spot = placeEither(mid, 1, 10, 1.4);
      if (spot) { cameraTower(spot); cameras.push({ n: 'back straight', x: spot.x, z: spot.z }); }
    }
    const spot = placeOut(startI - 90, -1, 8, 1.4) || placeOut(startI + 120, -1, 8, 1.4);
    if (spot) { cameraTower(spot); cameras.push({ n: 'main straight', x: spot.x, z: spot.z }); }
  }
  // umbrellas: one instanced cone, coloured per instance
  if (umbrellas.length) {
    const g = parts.get('umbrella').geo;
    const mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), umbrellas.length);
    const mm = new THREE.Matrix4(), col = new THREE.Color();
    const at = new THREE.Vector3(), still = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    umbrellas.forEach(([x, y, z, c], k) => { mesh.setMatrixAt(k, mm.compose(at.set(x, y, z), still, one)); mesh.setColorAt?.(k, col.setHex(c)); });
    mesh.castShadow = true;
    group.add(mesh);
  }

  // --- Distance boards before the big stops: 300, 200, 100 ---
  const boardMats = {};
  for (const d of [300, 200]) {
    const tex = canvasTexture(64, 48, (g, w, h) => {
      g.fillStyle = '#1d4fa8'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = '#f4f4f0'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(d), w / 2, h / 2 + 1);
    });
    boardMats[d] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  }
  const boardGeo = new THREE.BoxGeometry(1.1, 0.8, 0.06);
  const boards = [];
  // (the racing line's own boards already stand at 150, 100 and 50 m)
  for (const n of [1, 2, 4, 9, 14, 15]) {
    const c = byNumber(n);
    if (!c) continue;
    const side = -c.side;
    for (const d of [300, 200]) {
      const i = c.a - Math.round(d / 2);
      const p = P(i);
      // (not if that's inside the corner before)
      const prev = cornerAt(i);
      if (prev && prev !== c) continue;
      const o = edgeOf(p) + 3;
      const x = p.x + p.lx * side * o, z = p.z + p.lz * side * o;
      if (surfaceAt(x, z) !== 'grass' || solidNear(x, z, 0.6)) continue;
      const y = groundAt(x, z);
      put('boardPost', x, y, z);
      const b = new THREE.Mesh(boardGeo, boardMats[d]);
      b.position.set(x, y + 1.6, z);
      b.rotation.y = Math.atan2(-p.ux, -p.uz);    // facing the oncoming cars
      b.castShadow = true;
      group.add(b);
      boards.push(b);
      // (knock one and it goes flying off its post)
      const col = addSolid(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 'bollard', {
        hit: () => { col.minX = col.maxX = col.minZ = col.maxZ = 1e6; return { absorb: 0.9, fling: b }; },
      });
    }
  }

  // --- Advertising boards along the straights (all made up) ---
  const SPONSORS = [
    ['TROPIKA FUEL', '#f2c12e', '#14361f'], ['HUTAN TYRES', '#1f6b3a', '#f4f4f0'], ['KOPI KUAT', '#4a2a17', '#f2d7a6'],
    ['SINAR ENERGY', '#e8501c', '#ffffff'], ['TEST TRACK RACING', '#15171a', '#e5b53d'], ['LANGIT AIRWAYS', '#1d4fa8', '#ffffff'],
    ['MERDU AUDIO', '#7c1f8f', '#ffffff'], ['KILAT WATCHES', '#f4f4f0', '#15171a'],
  ];
  const sponsorMats = SPONSORS.map(([name, bg, fg]) => new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `bold ${name.length > 12 ? 30 : 36}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(name, w / 2, h / 2 + 2);
  }) }));
  const billGeo = new THREE.BoxGeometry(9, 2.2, 0.12);
  let sp = 0;
  const bills = [];
  for (let i = 0; i < m; i += 45) {
    if (cornerAt(i) || cornerAt(i + 20) || cornerAt(i - 20)) continue;          // straights only
    if (Math.abs(P(i).x) < 40 && P(i).z > -260 && P(i).z < 260) continue;      // (not on the main straight: grandstand and pits)
    const side = (sp % 2) ? 1 : -1;
    const spot = placeOut(i, side, 6, 4.8);
    if (!spot) continue;
    const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
    const b = new THREE.Mesh(billGeo, sponsorMats[sp++ % sponsorMats.length]);
    b.position.set(spot.x, y + 1.3 + 1.1, spot.z);
    b.rotation.y = ry;
    b.castShadow = true;
    group.add(b);
    bills.push(b);
    // (its legs: hit one hard, or blast it, and the board's knocked off them)
    const legs = [];
    for (const k of [-3.5, 3.5]) {
      const lx = spot.x + Math.cos(ry) * k, lz = spot.z - Math.sin(ry) * k;
      put('billLeg', lx, y, lz);
      legs.push(addSolid(lx - 0.15, lx + 0.15, lz - 0.15, lz + 0.15, 'billboard', {
        hit: (pt, n, v) => { if (v < 8 || b.userData.flung) return { absorb: 0.1 }; return { absorb: 0.3, fling: b }; },
      }));
    }
  }

  // --- The start gantry: across the straight at the line ---
  const gantry = { reds: [], greens: [] };
  {
    const p = P(startI), half = p.width / 2 + 1.6;
    const g = new THREE.Group();
    g.position.set(p.x, groundAt(p.x, p.z), p.z);
    g.rotation.y = p.heading;     // (its x across the track, z along it)
    const frame = std(0x2a2d31, 0.5, { metalness: 0.4 });
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(boxGeo(0.5, 7.6, 0.5), frame);
      leg.position.x = sx * half;
      g.add(leg);
      const wx = p.x + Math.cos(p.heading) * sx * half, wz = p.z - Math.sin(p.heading) * sx * half;
      addSolid(wx - 0.3, wx + 0.3, wz - 0.3, wz + 0.3, 'building');
    }
    const beam = new THREE.Mesh(boxGeo(half * 2 + 0.6, 1.1, 0.6, 6.5), frame);
    g.add(beam);
    // the light housing, facing back down the grid: five columns
    const housing = new THREE.Mesh(boxGeo(4.4, 1.5, 0.5, 4.9), std(0x111214, 0.5));
    housing.position.z = -0.4;
    g.add(housing);
    const lampGeo = new THREE.CircleGeometry(0.17, 16);
    for (let k = 0; k < 5; k++) {
      const x = (k - 2) * 0.82;
      const red = new THREE.MeshBasicMaterial({ color: 0x2a0d0b, toneMapped: false });
      const green = new THREE.MeshBasicMaterial({ color: 0x0b2412, toneMapped: false });
      for (const [y, mat] of [[6.0, red], [5.55, red], [5.15, green]]) {
        const lamp = new THREE.Mesh(lampGeo, mat);
        lamp.position.set(x, y, -0.66);
        lamp.rotation.y = Math.PI;      // facing the grid
        g.add(lamp);
      }
      gantry.reds.push(red); gantry.greens.push(green);
    }
    // a board on the beam (both sides)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.9), new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTexture(256, 32, (g2, w, h) => {
      g2.fillStyle = '#15171a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#e5b53d'; g2.font = 'bold 22px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText('SEPANG · TEST TRACK', w / 2, h / 2 + 1);
    }) }));
    sign.position.set(0, 7.05, -0.31); sign.rotation.y = Math.PI;
    const sign2 = sign.clone(); sign2.position.z = 0.31; sign2.rotation.y = 0;
    g.add(sign, sign2);
    group.add(g);
  }
  // n red columns lit (0-5); mode 'grid' (counting down), 'open' (green: track open), 'off'
  let lightsKey = '';
  const setStartLights = (n, mode) => {
    const key = mode + n;
    if (key === lightsKey) return;
    lightsKey = key;
    gantry.reds.forEach((mat, k) => mat.color.setHex(mode === 'grid' && k < n ? 0xff2a1a : 0x2a0d0b));
    gantry.greens.forEach((mat) => mat.color.setHex(mode === 'open' ? 0x22ff66 : 0x0b2412));
  };
  setStartLights(0, 'open');

  // --- Build the instanced parts ---
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  for (const [name, p] of parts) {
    if (name === 'umbrella' || !p.list.length) continue;
    const mesh = new THREE.InstancedMesh(p.geo, p.mat, p.list.length);
    p.list.forEach(([x, y, z, ry, sx, sy, sz], k) => mesh.setMatrixAt(k, mm.compose(pos.set(x, y, z), q.setFromAxisAngle(yAxis, ry), scl.set(sx, sy, sz))));
    mesh.castShadow = p.shadow && !isMobile;
    mesh.receiveShadow = true;
    group.add(mesh);
    p.mesh = mesh;
  }

  // --- The flags: every frame, from what's happening on the track ---
  // state = {
  //   cars: [{ x, z, v, hazard: 0 none / 1 stopped off the track / 2 stopped on it, slow, fire }],
  //   slippery(x, z): oil or coolant there?   red: the session's stopped
  //   chequered: the race is over (the leader's finished)
  //   player: { x, z, flag: a flag just for you (blue, meatball, bw, black) or null }
  // }
  let time = 0, oilClock = 0;
  const oilSectors = new Set();
  const result = { flag: null, sector: 0 };
  function update(dt, state, camera) {
    time += dt;
    // (oil on the track: checked twice a second, it doesn't change fast)
    oilClock -= dt;
    if (oilClock <= 0 && state.slippery) {
      oilClock = 0.5;
      oilSectors.clear();
      for (let i = 0; i < m; i += 4) {
        const p = line[i];
        for (const o of [-4, 0, 4]) if (state.slippery(p.x + p.lx * o, p.z + p.lz * o)) { oilSectors.add(sectorOf(i)); break; }
      }
    }
    // what's in each sector
    const level = posts.map(() => 0);   // 0 clear, 1 slow car (white), 2 yellow, 3 double yellow
    for (const c of state.cars) {
      if (!c.hazard && !c.slow) continue;
      const i = nearestLine(c.x, c.z, 50);
      if (i < 0) continue;
      const k = sectorOf(i);
      level[k] = Math.max(level[k], c.hazard === 2 ? 3 : c.hazard === 1 ? 2 : 1);
      // (a stopped car right after a post: the post before warns too)
      if (c.hazard && ((i - posts[k].i + m) % m) < 30) { const kp = (k - 1 + posts.length) % posts.length; level[kp] = Math.max(level[kp], 2); }
    }
    for (let k = 0; k < posts.length; k++) {
      let flag = null;
      if (state.red) flag = 'red';
      else if (state.phase === 'sc') flag = level[k] >= 2 ? 'yellow2' : 'sc';
      else if (state.phase === 'vsc') flag = level[k] >= 2 ? 'yellow2' : 'vsc';
      else if (level[k] === 3) flag = 'yellow2';
      else if (level[k] === 2) flag = 'yellow';
      else if (oilSectors.has(k)) flag = 'oil';
      else if (level[k] === 1) flag = 'white';
      else if (level[(k - 1 + posts.length) % posts.length] >= 2) flag = 'green';   // (the danger's behind you)
      if (k === 0 && state.chequered) flag = 'chequered';
      posts[k].flag = flag;
    }
    // your own flags: shown at the post you're coming up to (and the one at the line)
    const pi = nearestLine(state.player.x, state.player.z, 60);
    const ks = pi >= 0 ? sectorOf(pi) : 0;
    result.sector = ks;
    const next = (ks + 1) % posts.length;
    if (state.player.flag && !state.red) {
      if (!posts[next].flag || state.player.flag === 'blue') posts[next].flag = state.player.flag;
      if (!posts[0].flag) posts[0].flag = state.player.flag;
    }
    result.flag = state.player.flag && !state.red ? state.player.flag
      : state.phase === 'sc' ? 'sc' : state.phase === 'vsc' ? 'vsc' : posts[ks].flag;
    // show them (only the posts near the camera wave: no one sees the rest)
    const cx = camera ? camera.position.x : state.player.x, cz = camera ? camera.position.z : state.player.z;
    for (const post of posts) {
      const near = (post.x - cx) ** 2 + (post.z - cz) ** 2 < 450 * 450;
      const f = post.flag;
      const blinkOff = f && BLINK.has(f) && Math.floor(time * 2.5) % 2 === 1;
      const want = !f || blinkOff ? panelMats.off : panelMats[f];
      if (post.panel.material !== want) post.panel.material = want;
      if (post.live) continue;    // (the near ones: real people, see below)
      post.marshals.forEach((mar, k) => {
        // (the second marshal only joins in for a double yellow)
        const flagNow = k === 1 && f !== 'yellow2' ? null : f;
        if (mar.cloth.material !== (flagMats[flagNow] || mar.cloth.material)) mar.cloth.material = flagMats[flagNow] || mar.cloth.material;
        mar.flag.visible = !!flagNow;
        mar.shoulder.visible = near;          // (too small to see from further away)
        if (!near) return;
        if (!flagNow) { mar.shoulder.rotation.z = 0; return; }
        // waving: the arm swings up and over; or held out still
        const t = time * 5.5 + mar.phase;
        mar.shoulder.rotation.z = WAVED.has(flagNow) ? 2.3 + Math.sin(t) * 0.75 : 1.6;
        mar.cloth.rotation.y = WAVED.has(flagNow) ? Math.sin(t * 1.7) * 0.4 : 0;
      });
    }
    updateLive(dt, state, cx, cz);
    updateCrowds(dt, state, cx, cz);
    return result;
  }

  // --- LIVE MARSHALS: the posts nearest you get real people (the pit
  // crew's jointed figures, in orange): they stand and watch the cars go
  // by, turn to follow them, raise and wave their flags, and step back
  // sharply when a car comes off the track near them. Further away the
  // simple standing figures do. ---
  const marshalMats = {
    look: 'marshal',
    suits: [new THREE.MeshStandardMaterial({ color: 0xff7a12, roughness: 0.75 })],
    helmet: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }),
    visor: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.8 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }),
  };
  const LIVE = isMobile ? 3 : 6;
  const pool = [];
  let liveClock = 0;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const setStatic = (mar, show) => {
    for (const name of ['body', 'head', 'cap']) {
      const P = parts.get(name); if (!P.mesh) continue;
      const [x, y, z, ry] = P.list[mar.idx[name]];
      P.mesh.setMatrixAt(mar.idx[name], show ? mm.compose(pos.set(x, y, z), q.setFromAxisAngle(yAxis, ry), scl.set(1, 1, 1)) : zero);
      P.mesh.instanceMatrix.needsUpdate = true;
    }
    mar.shoulder.visible = show;
  };
  const makeLive = () => {
    const person = new Person(marshalMats, 0);
    const flag = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, dark);
    const cloth = new THREE.Mesh(makeCloth(), flagMats.yellow);
    cloth.position.set(0, -1.1, 0);
    flag.add(pole, new THREE.Mesh(gripGeo, dark), cloth);
    flag.rotation.x = -0.4;
    person.handR.add(flag);
    group.add(person.root);
    return { person, flag, cloth, post: null, k: 0, flinch: 0, look: 0, calm: 0 };
  };
  let clothClock = 0;
  // --- CAMERA OPERATORS: the near ones are real people behind their
  // cameras, hands on the handles, following the cars round ---
  const opMats = {
    look: 'camera',
    suits: [new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.85 })],
    cap: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.8 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.8 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8 }),
  };
  const opPool = [];
  let opClock = 0;
  const setOpStatic = (op, show) => {
    for (const name of ['opBody', 'head']) {
      const P2 = parts.get(name); if (!P2.mesh) continue;
      const [x, y, z, ry] = P2.list[op.idx[name]];
      P2.mesh.setMatrixAt(op.idx[name], show ? mm.compose(pos.set(x, y, z), q.setFromAxisAngle(yAxis, ry), scl.set(1, 1, 1)) : zero);
      P2.mesh.instanceMatrix.needsUpdate = true;
    }
  };
  function updateOps(dt, state, cx, cz) {
    opClock -= dt;
    if (opClock <= 0) {
      opClock = 0.5;
      const want = ops.map((o) => ({ o, d: (o.x - cx) ** 2 + (o.z - cz) ** 2 })).filter((e) => e.d < 180 * 180).sort((a, b) => a.d - b.d).slice(0, isMobile ? 1 : 3).map((e) => e.o);
      for (const op of ops) {
        const on = want.includes(op);
        if (on === !!op.live) continue;
        op.live = on; setOpStatic(op, !on);
        if (on) {
          let L = opPool.find((l) => !l.op);
          if (!L) { L = { person: new Person(opMats, 0) }; group.add(L.person.root); opPool.push(L); }
          L.op = op; L.person.place(op.x, op.z, op.ry); L.person.want = 'CAMERA'; L.person.root.visible = true; L.ground = () => op.y;
        } else { const L = opPool.find((l) => l.op === op); if (L) { L.op = null; L.person.root.visible = false; } }
      }
    }
    for (const L of opPool) {
      if (!L.op) continue;
      const P2 = L.person, op = L.op;
      // following the nearest car, the whole body turning with the camera
      let tgt = null, best = 220;
      for (const c of state.movers || []) { const d = Math.hypot(c.x - op.x, c.z - op.z); if (d < best) { best = d; tgt = c; } }
      let d = tgt ? Math.atan2(Math.sin(Math.atan2(tgt.x - op.x, tgt.z - op.z) - op.ry), Math.cos(Math.atan2(tgt.x - op.x, tgt.z - op.z) - op.ry)) : 0;
      d = Math.max(-1.3, Math.min(1.3, d));
      P2.face += Math.atan2(Math.sin(op.ry + d - P2.face), Math.cos(op.ry + d - P2.face)) * Math.min(1, dt * 4);
      P2.lookAt = tgt ? [tgt.x, tgt.z] : null;
      P2.update(dt, L.ground);
    }
  }
  function updateLive(dt, state, cx, cz) {
    updateOps(dt, state, cx, cz);
    clothClock -= dt;
    if (clothClock <= 0) { clothClock = 1 / 20; rippleCloth(clothGeo, time, 0.6, 0.2); }
    liveClock -= dt;
    if (liveClock <= 0) {
      liveClock = 0.5;
      for (const p of posts) p.d2 = (p.x - cx) ** 2 + (p.z - cz) ** 2;
      const want = posts.slice(1).map((p) => ({ p, d: (p.x - cx) ** 2 + (p.z - cz) ** 2 })).filter((e) => e.d < 260 * 260)
        .sort((a, b) => a.d - b.d).slice(0, LIVE).map((e) => e.p);
      for (const post of posts) {
        const on = want.includes(post);
        if (on === !!post.live) continue;
        post.live = on;
        post.marshals.forEach((mar, k) => {
          setStatic(mar, !on);
          if (on) {
            const L = pool.find((l) => !l.post) || (pool.push(makeLive()), pool[pool.length - 1]);
            L.post = post; L.k = k; L.mar = mar;
            L.person.queue = []; L.person.want = 'STAND';
            L.person.place(mar.x, mar.z, mar.ry);
            L.person.root.visible = true;
          } else {
            const L = pool.find((l) => l.mar === mar);
            if (L) { L.post = null; L.mar = null; L.person.root.visible = false; }
          }
        });
      }
    }
    for (const L of pool) {
      if (!L.post) continue;
      const P = L.person, mar = L.mar, f = L.post.flag;
      const flagNow = L.k === 1 && f !== 'yellow2' ? null : f;
      // a car coming: where will it pass him, and when? Straight at him
      // and close: a dive out of its way (or, too late for that, a duck);
      // off and near: back, fast, watching it. A crash nearby: he points at
      // it and waves the others over. Then up, and back to his spot.
      L.calm -= dt;
      if (L.calm <= 0 && !(P.busy && P.reacting)) {
        let act = null;
        for (const c of state.movers || []) {
          const rx = mar.x - c.x, rz = mar.z - c.z, d = Math.hypot(rx, rz);
          if (d > 60) continue;
          const vx = c.vx ?? 0, vz = c.vz ?? 0, vv = vx * vx + vz * vz;
          const tHit = vv > 4 ? (rx * vx + rz * vz) / vv : -1;            // (when it's closest)
          const miss = tHit > 0 ? Math.hypot(rx - vx * tHit, rz - vz * tHit) : d;
          if (c.off && tHit > 0 && tHit < 1.6 && miss < 3.2) { act = { kind: tHit < 0.35 ? 'duck' : 'dive', c, vx, vz, miss, rx, rz }; break; }
          if (c.off && d < 16 && c.v > 10) act = act || { kind: 'back', c };
          else if (c.crash && d < 45) act = act || { kind: 'crash', c };
        }
        if (act) {
          const c = act.c;
          P.reacting = true; L.calm = 2.5;
          const done = { fn: () => { P.reacting = false; } };
          const home = [{ pose: 'STAND' }, { look: null }, { go: [mar.x, mar.z], run: true }, { face: mar.ry }, done];
          if (act.kind === 'dive' || act.kind === 'duck') {
            // (away from the car's path: to the side he's already on)
            const vl = Math.hypot(act.vx, act.vz) || 1, nx = -act.vz / vl, nz = act.vx / vl;
            const side = (act.rx * nx + act.rz * nz) >= 0 ? 1 : -1;
            const to = [mar.x + nx * side * 3.4, mar.z + nz * side * 3.4];
            P.run(act.kind === 'dive'
              ? [{ look: [c.x, c.z] }, { dive: to }, { wait: 0.9 + Math.random() * 0.6 }, { pose: 'KNEEL', t: 0.5 }, { pose: 'STAND', t: 0.3 }, { look: [c.x, c.z] }, { wait: 0.8 }, ...home]
              : [{ pose: 'DUCK', t: 1.2 }, { look: [c.x, c.z] }, { pose: 'SHOCK', t: 0.6 }, ...home]);
          } else if (act.kind === 'back') {
            const ax = mar.x - c.x, az = mar.z - c.z, ad = Math.hypot(ax, az) || 1;
            P.run([{ look: [c.x, c.z] }, { go: [mar.x + ax / ad * 3, mar.z + az / ad * 3], run: true, sidestep: true }, { face: [c.x, c.z], quick: true }, { pose: 'SHOCK', t: 0.5 }, { pose: 'STAND', t: 0.6 }, ...home]);
          } else {
            // a crash: straight on to it, pointing, then waving the others over
            P.run([{ face: [c.x, c.z], quick: true }, { look: [c.x, c.z] }, { pose: 'POINT', t: 1.0 }, { pose: 'WAVE', t: 1.6 }, { pose: 'STAND' }, { wait: 1.2 }, { look: null }, { face: mar.ry }, done]);
            L.calm = 5;
          }
        }
      }
      if (!P.busy) P.reacting = false;
      // watching: turn to follow the nearest car (when not busy with a flag or stepping back)
      if (!P.busy) {
        let tgt = null, best = 130;
        for (const c of state.movers || []) { const d = Math.hypot(c.x - mar.x, c.z - mar.z); if (d < best) { best = d; tgt = c; } }
        let want = flagNow ? mar.ry : tgt ? Math.atan2(tgt.x - mar.x, tgt.z - mar.z) : mar.ry;
        // (never round with his back to the track: a turn of the head and shoulders, up to 100 degrees)
        let d = Math.atan2(Math.sin(want - mar.ry), Math.cos(want - mar.ry));
        d = Math.max(-1.75, Math.min(1.75, d));
        const aim = mar.ry + d;
        let df = Math.atan2(Math.sin(aim - P.face), Math.cos(aim - P.face));
        P.face += df * Math.min(1, dt * 3);
        P.want = flagNow ? (WAVED.has(flagNow) ? 'LOLLY_UP' : 'LOLLY') : 'STAND';
      }
      L.flag.visible = !!flagNow && !P.reacting;
      if (flagNow && L.cloth.material !== flagMats[flagNow]) L.cloth.material = flagMats[flagNow];
      P.update(dt, groundAt);
      // waving: the arm swinging over his head, the flag flapping
      const waving = flagNow && WAVED.has(flagNow) && !P.busy;
      if (waving) {
        const t = time * 5.5 + mar.phase;
        P.shR.rotation.z = -Math.sin(t) * 0.6;
        L.cloth.rotation.y = Math.sin(t * 1.7 - 0.6) * 0.35;
      } else { P.shR.rotation.z = 0; L.cloth.rotation.y = 0; }
      // the cloth: flapping hard as it's waved, rippling in the breeze held still
      if (L.flag.visible && L.post.d2 < 120 * 120) rippleCloth(L.cloth.geometry, time + mar.phase, waving ? 1 : 0.15, waving ? 0.1 : 0.55);
    }
  }

  // --- GRANDSTANDS AND CROWDS: Sepang's big stands outside turns 1-2
  // and at the last hairpin, and people on the grass banks in between.
  // The crowd stands up and cheers as you go past. ---
  const crowds = [];
  {
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8c9096, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.6, side: THREE.DoubleSide });
    const steelM = new THREE.MeshStandardMaterial({ color: 0x9a9ea3, roughness: 0.45, metalness: 0.6 });
    const shirts = [0xd8312a, 0x2a62c9, 0xf2c12e, 0x2b9a52, 0xf4f4f0, 0x15171a, 0xff7a12, 0x7c1f8f];
    // (a seated fan, in two parts: his shirt and arms, tinted each his own
    // colour; and his head, hair, and legs in trousers, tinted his skin)
    const merge = (parts) => {
      const pos = [], nor = [], colr = [], c = new THREE.Color();
      for (const [geo, hex] of parts) {
        const g = geo.index ? geo.toNonIndexed() : geo; const P = g.attributes?.position, N = g.attributes?.normal;
        if (!P?.array) continue;
        c.setHex(hex);
        for (let i = 0; i < P.count; i++) { pos.push(P.array[i * 3], P.array[i * 3 + 1], P.array[i * 3 + 2]); if (N?.array) nor.push(N.array[i * 3], N.array[i * 3 + 1], N.array[i * 3 + 2]); colr.push(c.r, c.g, c.b); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (nor.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      return g;
    };
    const shirtGeo = merge([
      [new THREE.CylinderGeometry(0.17, 0.15, 0.46, 8).scale(1, 1, 0.62).translate(0, 0.52, -0.04), 0xffffff],                 // (his body)
      [new THREE.CylinderGeometry(0.05, 0.045, 0.3, 6).rotateZ(0.25).translate(0.2, 0.58, 0.0), 0xffffff],                     // (his arms, down to his lap)
      [new THREE.CylinderGeometry(0.05, 0.045, 0.3, 6).rotateZ(-0.25).translate(-0.2, 0.58, 0.0), 0xffffff],
    ]);
    const restGeo = merge([
      [new THREE.IcosahedronGeometry(0.105, 1).scale(0.92, 1.08, 1).translate(0, 0.9, -0.02), 0xffffff],                       // (his head)
      [new THREE.SphereGeometry(0.108, 8, 5, 0, Math.PI * 2, 0, 1.3).scale(0.95, 1.05, 1.02).translate(0, 0.915, -0.03), 0x3a2a1e],   // (hair)
      [new THREE.CylinderGeometry(0.045, 0.05, 0.08, 6).translate(0, 0.79, -0.03), 0xffffff],                                  // (neck)
      [new THREE.BoxGeometry(0.13, 0.12, 0.42).translate(0.09, 0.3, 0.14), 0x2e3440], [new THREE.BoxGeometry(0.13, 0.12, 0.42).translate(-0.09, 0.3, 0.14), 0x2e3440],   // (thighs, forward on the seat)
      [new THREE.BoxGeometry(0.11, 0.38, 0.12).translate(0.09, 0.08, 0.32), 0x2e3440], [new THREE.BoxGeometry(0.11, 0.38, 0.12).translate(-0.09, 0.08, 0.32), 0x2e3440],  // (shins, down to the step)
    ]);
    const skins = [0xd9a07a, 0xb57a52, 0x8a5a3a, 0xe8b896, 0xc68e64];
    const personGeo = shirtGeo;
    const stand = (spot, len, rows, roof) => {
      const g = new THREE.Group();
      const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
      g.position.set(spot.x, y, spot.z); g.rotation.y = ry;
      // the stepped seating, rising away from the track (its front faces +z: the track)
      for (let r = 0; r < rows; r++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(len, 0.45, 0.85), seatMat);
        step.position.set(0, 0.22 + r * 0.45, -r * 0.85); step.receiveShadow = true; g.add(step);
      }
      if (roof) {
        const top = new THREE.Mesh(new THREE.PlaneGeometry(len + 2, rows * 0.85 + 3), roofMat);
        top.rotation.x = -Math.PI / 2 + 0.12; top.position.set(0, rows * 0.45 + 3.2, -rows * 0.42); g.add(top);
        for (const sx of [-len / 2, 0, len / 2]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, rows * 0.45 + 3.2, 0.25).translate(0, (rows * 0.45 + 3.2) / 2, 0), steelM); post.position.set(sx, 0, -rows * 0.85); g.add(post); }
      }
      // the people: a crowd of simple figures in bright shirts
      const per = isMobile ? 0.35 : 0.8;
      const n = Math.floor(len * rows * per);
      const mesh = new THREE.InstancedMesh(personGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, vertexColors: true }), n);
      const rest = new THREE.InstancedMesh(restGeo, new THREE.MeshStandardMaterial({ roughness: 0.75, vertexColors: true }), n);
      const seats = [];
      const col = new THREE.Color();
      for (let k = 0; k < n; k++) {
        const r = Math.floor(Math.random() * rows), x = (Math.random() - 0.5) * (len - 1);
        seats.push([x, 0.45 + r * 0.45 - 0.245, -r * 0.85 + 0.1, Math.random() * 6]);   // (sat on the step, legs over its front)
        mesh.setColorAt?.(k, col.setHex(shirts[k % shirts.length]));
        rest.setColorAt?.(k, col.setHex(skins[k % skins.length]));
      }
      mesh.castShadow = rest.castShadow = !isMobile;
      g.add(mesh, rest);
      group.add(g);
      const C = { g, mesh, rest, seats, cheer: 0, x: spot.x, z: spot.z };
      setCrowd(C, 0, 0);
      crowds.push(C);
      // its hit box: the stand's own footprint, turned with it
      { const D = rows * 0.85 + 0.6, ax = Math.cos(ry), az = -Math.sin(ry), bx = Math.sin(ry), bz = Math.cos(ry);
        const cx = spot.x + bx * (0.4 - D / 2), cz = spot.z + bz * (0.4 - D / 2), hl = len / 2, hw = D / 2;
        const ex = Math.abs(ax) * hl + Math.abs(bx) * hw, ez = Math.abs(az) * hl + Math.abs(bz) * hw;
        const c = addSolid(cx - ex, cx + ex, cz - ez, cz + ez, 'building'); c.ob = { x: cx, z: cz, ux: ax, uz: az, hl, hw }; }
    };
    const S = [[1, 40, 10, true], [2, 30, 8, false], [4, 26, 6, false], [15, 46, 12, true]];
    for (const [n, len, rows, roof] of S) {
      const c = byNumber(n);
      if (!c) continue;
      const spot = placeOut(c.apex, -c.side, 14, len / 2 + 2);
      if (spot) stand(spot, len, rows, roof);
    }
  }
  function setCrowd(C, cheer, t) {
    const mm2 = new THREE.Matrix4(), p2 = new THREE.Vector3(), s2 = new THREE.Vector3(1, 1, 1), q2 = new THREE.Quaternion();
    C.seats.forEach(([x, y, z, ph], k) => {
      const up = cheer * (0.25 + 0.2 * Math.max(0, Math.sin(t * 9 + ph)));
      mm2.compose(p2.set(x, y + up, z), q2, s2.set(1, 1, 1));
      C.mesh.setMatrixAt(k, mm2); C.rest.setMatrixAt(k, mm2);
    });
    C.mesh.instanceMatrix.needsUpdate = true; C.rest.instanceMatrix.needsUpdate = true;
  }
  function updateCrowds(dt, state, cx, cz) {
    const P = state.player;
    for (const C of crowds) {
      const camNear = (C.x - cx) ** 2 + (C.z - cz) ** 2 < 300 * 300;
      const close = P && Math.hypot(P.x - C.x, P.z - C.z) < 90;
      const want = close ? 1 : 0;
      const before = C.cheer;
      C.cheer += (want - C.cheer) * Math.min(1, dt * (want ? 4 : 1));
      if (camNear && (C.cheer > 0.02 || before > 0.02)) setCrowd(C, C.cheer, time);
    }
  }

  // --- RACE CONTROL TOWER: on the pit building, by the line ---
  {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xdedfda, roughness: 0.6 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0x2b3f52, roughness: 0.12, metalness: 0.35 });
    const tx = 30, tz = 14, ty = groundAt(tx, tz) + 5;
    const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(tx, ty + y, tz); m.castShadow = !isMobile; group.add(m); return m; };
    add(new THREE.BoxGeometry(8, 2.6, 7).translate(0, 1.3, 0), towerMat, 0);
    add(new THREE.BoxGeometry(8.1, 2.2, 7.1).translate(0, 3.7, 0), glassM, 0);
    add(new THREE.BoxGeometry(9, 0.3, 8).translate(0, 4.95, 0), towerMat, 0);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTexture(256, 32, (g2, w, h) => {
      g2.fillStyle = '#15171a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#f4f4f0'; g2.font = 'bold 20px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText('RACE CONTROL', w / 2, h / 2 + 1);
    }) }));
    sign.position.set(tx - 4.06, ty + 2.2, tz); sign.rotation.y = -Math.PI / 2; group.add(sign);
  }

  // --- PIT EXIT LIGHTS: at the end of the pit lane, facing the cars
  // leaving: green when it's open, red when it's shut ---
  const pitLights = {};
  {
    const px = 16.8, pz = -245, py = groundAt(px, pz);     // (just off the exit road, on the garage side)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8).translate(0, 1.3, 0), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5 }));
    pole.position.set(px, py, pz); group.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.3), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.5 }));
    head.position.set(px, py + 2.9, pz); group.add(head);
    pitLights.red = new THREE.MeshBasicMaterial({ color: 0x2a0d0b, toneMapped: false });
    pitLights.green = new THREE.MeshBasicMaterial({ color: 0x22ff66, toneMapped: false });
    for (const [mat, dy] of [[pitLights.red, 0.22], [pitLights.green, -0.22]]) {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), mat);
      lamp.position.set(px, py + 2.9 + dy, pz + 0.16);       // (facing +z: the cars coming down the pit lane)
      group.add(lamp);
    }
    addSolid(px - 0.15, px + 0.15, pz - 0.15, pz + 0.15, 'building');
  }
  const setPitExit = (open) => { pitLights.red.color.setHex(open ? 0x2a0d0b : 0xff2a1a); pitLights.green.color.setHex(open ? 0x22ff66 : 0x0b2412); };

  return { group, posts, setPitExit, crowds, cameras, boards, bills, update, setStartLights, sectorOf, nearestLine, result };
}
