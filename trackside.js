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

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

export const FLAG_NAMES = {
  green: 'GREEN FLAG', yellow: 'YELLOW FLAG', yellow2: 'DOUBLE YELLOW', red: 'RED FLAG', blue: 'BLUE FLAG',
  white: 'WHITE FLAG', oil: 'SLIPPERY TRACK', black: 'BLACK FLAG', bw: 'BLACK AND WHITE FLAG',
  meatball: 'MEATBALL FLAG', chequered: 'CHEQUERED FLAG',
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
    case 'chequered': for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) fill((i + j) % 2 ? '#121212' : '#f4f4f0', (i * w) / 6, (j * h) / 4, w / 6 + 0.5, h / 4 + 0.5); break;
    default: fill('#1a1c1f');
  }
}

const FLAGS = ['green', 'yellow', 'yellow2', 'red', 'blue', 'white', 'oil', 'black', 'bw', 'meatball', 'chequered'];
// which flags the marshals wave (the rest just hold them out still)
const WAVED = new Set(['yellow', 'yellow2', 'blue', 'red', 'chequered', 'oil']);
// which flags blink on the light panels
const BLINK = new Set(['yellow', 'yellow2', 'red', 'blue']);

export function buildTrackside(scene, { line, kerb, surfaceAt, colliders, corners, startI, heightAt = () => 0, isMobile = false }) {
  const groundAt = heightAt;
  const m = line.length;
  const P = (i) => line[((i % m) + m) % m];
  const edgeOf = (p) => p.width / 2 + kerb;
  const group = new THREE.Group();
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
  part('body', cylGeo(0.2, 0.17, 1.42, 8), orange);
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
  part('opBody', cylGeo(0.19, 0.17, 1.35, 8), khaki);
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
  const clothGeo = new THREE.PlaneGeometry(0.9, 0.62);
  clothGeo.translate(0.45, 0.31, 0);                 // (hangs from the tip of the pole, along it)
  const poleGeo = cylGeo(0.015, 0.015, 1.1, 4, -1.1);   // (carries on past the hand)
  const armGeo = cylGeo(0.055, 0.05, 0.62, 6, -0.62);
  const panelFaceGeo = new THREE.PlaneGeometry(1.16, 0.86);

  // one marshal: the static body (instanced), and his arm with a flag (his own meshes)
  const addMarshal = (x, z, ry, y0) => {
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
    flag.add(pole, cloth);
    shoulder.add(arm, flag);
    group.add(shoulder);
    return { shoulder, flag, cloth, phase: Math.random() * 6 };
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
  let umb = 0;
  const cameraTower = (spot) => {
    const y = groundAt(spot.x, spot.z), ry = towardTrack(spot.x, spot.z, spot.i);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put('scaffLeg', spot.x + ax, y, spot.z + az);
    for (const h of [1.6, 3.3]) { put('scaffBrace', spot.x - 1, y + h, spot.z, 0); put('scaffBrace', spot.x + 1, y + h, spot.z, 0); put('scaffBrace', spot.x, y + h, spot.z - 1, Math.PI / 2); put('scaffBrace', spot.x, y + h, spot.z + 1, Math.PI / 2); }
    put('scaffDeck', spot.x, y, spot.z);
    const cx = spot.x + Math.sin(ry) * 0.4, cz = spot.z + Math.cos(ry) * 0.4;
    put('tripod', cx, y + 5.1, cz); put('camBody', cx, y + 6.4, cz, ry); put('camLens', cx, y + 6.4, cz, ry);
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
    umbrellas.forEach(([x, y, z, c], k) => { mesh.setMatrixAt(k, mm.makeTranslation(x, y, z)); mesh.setColorAt?.(k, col.setHex(c)); });
    mesh.castShadow = true;
    group.add(mesh);
  }

  // --- Distance boards before the big stops: 300, 200, 100 ---
  const boardMats = {};
  for (const d of [300, 200, 100]) {
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
  for (const n of [1, 2, 4, 9, 14, 15]) {
    const c = byNumber(n);
    if (!c) continue;
    const side = -c.side;
    for (const d of [300, 200, 100]) {
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
        hit: () => { b.visible = false; col.minX = col.maxX = col.minZ = col.maxZ = 1e6; return { absorb: 0.9 }; },
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
    for (const k of [-3.5, 3.5]) {
      const lx = spot.x + Math.cos(ry) * k, lz = spot.z - Math.sin(ry) * k;
      put('billLeg', lx, y, lz);
      addSolid(lx - 0.15, lx + 0.15, lz - 0.15, lz + 0.15, 'building');
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
    result.flag = state.player.flag && !state.red ? state.player.flag : posts[ks].flag;
    // show them (only the posts near the camera wave: no one sees the rest)
    const cx = camera ? camera.position.x : state.player.x, cz = camera ? camera.position.z : state.player.z;
    for (const post of posts) {
      const near = (post.x - cx) ** 2 + (post.z - cz) ** 2 < 450 * 450;
      const f = post.flag;
      const blinkOff = f && BLINK.has(f) && Math.floor(time * 2.5) % 2 === 1;
      const want = !f || blinkOff ? panelMats.off : panelMats[f];
      if (post.panel.material !== want) post.panel.material = want;
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
    return result;
  }

  return { group, posts, cameras, boards, bills, update, setStartLights, sectorOf, nearestLine, result };
}
