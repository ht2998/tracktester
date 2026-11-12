// =====================================================================
// SEPANG: a flat mock-up of Sepang International Circuit (Malaysia),
// 5.5 km, 15 turns, driven clockwise. No hills: everything is at ground
// level. Built around the real track outline:
//   - the track: tarmac, white edge lines, start/finish line and grid boxes
//   - kerbs on every corner (red and white), yellow sausage kerbs and
//     orange bollards at the tightest apexes, green grass-protection mesh
//   - run-off outside the corners: gravel traps at some, painted tarmac at
//     others, then tyre walls and Armco behind them
//   - the pit lane, pit wall and catch fence, the pit garages, and the big
//     main grandstand across the start straight
// Everything you can hit is in the same hit-box list as the test area
// (scenery.js), and surfaceAt(x, z) says what's underfoot.
//
// The track outline (the OUTLINE points below) comes from the f1-circuits
// project by Tomislav Bacinger, used under its MIT licence:
//   Copyright (c) 2019-2025 Tomislav Bacinger
//   Permission is hereby granted, free of charge, to any person obtaining a
//   copy of this software and associated documentation files (the
//   "Software"), to deal in the Software without restriction, including
//   without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to
//   permit persons to whom the Software is furnished to do so, subject to
//   the following conditions: The above copyright notice and this
//   permission notice shall be included in all copies or substantial
//   portions of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// (Converted from map coordinates to metres, turned so the start straight
// runs along -z, with the start/finish line at (0, 0).)
// =====================================================================

import * as THREE from 'three';
import {
  startScenery, finishScenery, buildGarages, buildConcreteWalls, buildArmco, buildTyreWalls, buildFences,
  addCollider, addRoof, canvasTexture, echoBox,
} from './scenery.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 3;

// [x, z] in metres, in driving order (clockwise from the start/finish line)
const OUTLINE = [[0.0,0.0],[-1.1,-301.1],[1.1,-314.8],[8.2,-326.7],[17.8,-334.5],[30.3,-338.2],[44.0,-337.7],[57.9,-331.6],[67.8,-319.1],[71.6,-303.0],[66.5,-284.9],[51.7,-251.7],[52.7,-240.1],[61.4,-229.8],[72.7,-225.7],[88.2,-227.7],[104.4,-236.7],[134.6,-257.7],[152.7,-266.2],[173.7,-271.1],[194.5,-272.6],[217.9,-270.7],[275.0,-260.6],[301.3,-249.4],[327.7,-232.9],[344.4,-217.1],[362.6,-193.4],[376.0,-169.0],[383.0,-143.9],[416.7,-3.4],[448.9,102.3],[473.0,173.2],[489.5,219.0],[494.5,234.8],[493.2,246.2],[486.2,255.5],[473.6,258.1],[366.4,268.9],[311.1,276.3],[243.7,287.6],[217.3,297.6],[198.1,309.6],[178.0,331.2],[164.1,353.1],[156.7,375.4],[154.0,397.6],[155.8,423.3],[163.8,450.0],[175.5,469.4],[211.0,508.3],[220.2,526.8],[227.5,555.2],[226.4,578.9],[221.5,601.9],[212.3,620.2],[197.7,636.0],[-46.0,819.4],[-57.2,819.6],[-69.5,814.0],[-143.2,773.8],[-149.6,762.9],[-151.5,750.5],[-147.8,566.0],[-154.4,391.9],[-162.4,296.1],[-169.0,286.6],[-180.8,282.8],[-194.9,289.7],[-237.2,354.2],[-253.1,367.8],[-275.7,376.4],[-298.8,379.9],[-331.2,376.5],[-358.1,370.0],[-384.2,361.8],[-416.9,343.1],[-449.7,316.3],[-456.9,302.5],[-458.0,289.7],[-454.3,275.6],[-446.0,264.8],[-257.0,67.5],[-250.5,53.2],[-247.9,34.3],[-251.5,13.2],[-284.6,-66.7],[-289.4,-87.7],[-290.8,-112.4],[-288.9,-133.7],[-278.6,-173.1],[-265.4,-199.4],[-250.1,-215.9],[-217.4,-237.1],[-193.6,-243.6],[-179.4,-243.8],[-164.3,-232.6],[-157.2,-210.8],[-69.8,636.8],[-60.2,649.6],[-40.9,660.0],[-23.8,656.8],[-6.9,642.9],[-1.1,618.2]];

const WIDTH = 16;            // track width (m); the start straight is wider
const STRAIGHT_WIDTH = 22;
const KERB = 1.3;            // kerb width
const STEP = 2;              // metres between points along the smoothed centre line

// ---------------------------------------------------------------------
// The centre line: the outline smoothed into a point every 2 m, each with
// its direction, its left side, and how sharply the track turns there
// ---------------------------------------------------------------------
function centreLine() {
  const n = OUTLINE.length;
  const P = (i) => OUTLINE[((i % n) + n) % n];
  const raw = [];
  for (let i = 0; i < n; i++) {
    // A smooth curve through each pair of outline points ("centripetal"
    // Catmull-Rom: it doesn't overshoot or loop where long straights meet
    // tight corners)
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(1, Math.round(len / STEP));
    const knot = (a, b) => Math.sqrt(Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1])));
    const t0 = 0, t1 = t0 + knot(p0, p1), t2 = t1 + knot(p1, p2), t3 = t2 + knot(p2, p3);
    for (let k = 0; k < steps; k++) {
      const t = t1 + (t2 - t1) * (k / steps);
      const pt = [0, 1].map((c) => {
        const A1 = ((t1 - t) * p0[c] + (t - t0) * p1[c]) / (t1 - t0);
        const A2 = ((t2 - t) * p1[c] + (t - t1) * p2[c]) / (t2 - t1);
        const A3 = ((t3 - t) * p2[c] + (t - t2) * p3[c]) / (t3 - t2);
        const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0);
        const B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
        return ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
      });
      raw.push({ x: pt[0], z: pt[1] });
    }
  }
  const m = raw.length;
  let s = 0;
  raw.forEach((p, i) => {
    const a = raw[(i - 1 + m) % m], b = raw[(i + 1) % m];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    p.ux = dx / l; p.uz = dz / l;          // along
    p.lx = p.uz; p.lz = -p.ux;             // to the left
    p.heading = Math.atan2(p.ux, p.uz);
    if (i > 0) s += Math.hypot(p.x - raw[i - 1].x, p.z - raw[i - 1].z);
    p.s = s;
  });
  // How sharply it turns (1 / radius; + = to the left), smoothed over ~20 m
  const bend = raw.map((p, i) => {
    const a = raw[(i - 3 + m) % m], b = raw[(i + 3) % m];
    let d = b.heading - a.heading;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d / Math.max(1, Math.hypot(b.x - a.x, b.z - a.z));
  });
  raw.forEach((p, i) => {
    let sum = 0;
    for (let k = -5; k <= 5; k++) sum += bend[(i + k + m) % m];
    p.curve = sum / 11;
    // the start straight (from the last turn to turn 1) is wider
    p.width = Math.abs(p.x) < 30 && p.z > -270 && p.z < 300 ? STRAIGHT_WIDTH : WIDTH;
  });
  // Ease the width change in and out
  const w = raw.map((p) => p.width);
  raw.forEach((p, i) => {
    let sum = 0;
    for (let k = -10; k <= 10; k++) sum += w[(i + k + m) % m];
    p.width = sum / 21;
  });
  return raw;
}

// Corners: stretches where the track turns tighter than a 400 m radius
// (widened a little either side), with which way they turn
function findCorners(line) {
  const m = line.length;
  const inCorner = line.map((p) => Math.abs(p.curve) > 1 / 400);
  const corners = [];
  let i = 0;
  // start from a point on a straight so no corner wraps round the start
  const start = inCorner.findIndex((c) => !c);
  for (let k = 0; k < m; k++) {
    const idx = (start + k) % m;
    if (inCorner[idx] && (!corners.length || corners[corners.length - 1].open === false || corners[corners.length - 1].end !== (idx - 1 + m) % m)) {
      corners.push({ startI: idx, end: idx, open: true });
    } else if (inCorner[idx]) {
      corners[corners.length - 1].end = idx;
    } else if (corners.length) corners[corners.length - 1].open = false;
  }
  return corners.map((c) => {
    const pad = 6;
    const a = c.startI - pad, b = (c.end < c.startI ? c.end + m : c.end) + pad;
    let sum = 0, peak = 0, apex = c.startI;
    for (let k = c.startI; k <= (c.end < c.startI ? c.end + m : c.end); k++) {
      const v = line[k % m].curve;
      sum += v;
      if (Math.abs(v) > Math.abs(peak)) { peak = v; apex = k % m; }
    }
    return { a, b, side: Math.sign(sum), radius: 1 / Math.abs(peak), apex };
  }).filter((c) => c.b - c.a > 14);
}

// A strip alongside the centre line from point i0 to i1 (may wrap), from
// lateral offset o0 to o1 (+ = left), at height y. uvScale: metres per texture repeat along.
function strip(line, i0, i1, o0, o1, y, uvAlong = 1, uvAcross = 1) {
  const m = line.length;
  const pos = [], uv = [], index = [];
  let k = 0;
  for (let i = i0; i <= i1; i++, k++) {
    const p = line[((i % m) + m) % m];
    const a = typeof o0 === 'function' ? o0(p) : o0, b = typeof o1 === 'function' ? o1(p) : o1;
    pos.push(p.x + p.lx * a, y, p.z + p.lz * a, p.x + p.lx * b, y, p.z + p.lz * b);
    const along = (i - i0) * STEP / uvAlong;
    uv.push(along, 0, along, Math.abs(b - a) / uvAcross);
    if (i < i1) {
      const v = k * 2;
      // (facing up whichever side is which)
      if (b > a) index.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
      else index.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------
// TEXTURES
// ---------------------------------------------------------------------
function asphaltTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#45484b';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {              // the stones in the asphalt
      const v = 40 + Math.random() * 60;
      g.fillStyle = `rgba(${v},${v + 2},${v + 4},${0.25 + Math.random() * 0.35})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  });
}
function kerbTexture() {
  // red and white blocks, 2 m each, with a shaded raised edge
  return canvasTexture(128, 32, (g, w, h) => {
    g.fillStyle = '#d42a24'; g.fillRect(0, 0, w / 2, h);
    g.fillStyle = '#f2f0ea'; g.fillRect(w / 2, 0, w / 2, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 4, w, 4);
  });
}
function gravelTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#b39a70';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) {
      const r = 0.6 + Math.random() * 1.6;
      const v = Math.random();
      g.fillStyle = v < 0.3 ? 'rgba(120,98,68,0.7)' : v < 0.6 ? 'rgba(212,194,158,0.7)' : 'rgba(150,130,96,0.6)';
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2); g.fill();
    }
  });
}
function grassTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#4c7a2f';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = Math.random();
      g.fillStyle = v < 0.5 ? 'rgba(70,112,42,0.6)' : 'rgba(96,140,58,0.5)';
      g.fillRect(Math.random() * w, Math.random() * h, 1, 3);
    }
    // mowing stripes
    g.fillStyle = 'rgba(255,255,255,0.035)';
    g.fillRect(0, 0, w / 2, h);
  });
}
function netTexture() {
  // green plastic grass-protection mesh: a grid of thin green strands
  return canvasTexture(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(40,150,70,0.9)';
    g.lineWidth = 3;
    for (let k = 0; k <= w; k += 16) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke();
      g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke();
    }
  });
}
function runoffTexture() {
  // painted run-off: grey tarmac with a broad green band and a blue one
  return canvasTexture(64, 256, (g, w, h) => {
    g.fillStyle = '#505457'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f7d45'; g.fillRect(0, 0, w, h * 0.45);
    g.fillStyle = '#2b5fa8'; g.fillRect(0, h * 0.45, w, h * 0.12);
  });
}

// ---------------------------------------------------------------------
// BUILD
// ---------------------------------------------------------------------
export function buildSepang(scene, { isMobile = false, gravelMaps = null } = {}) {
  startScenery();
  const line = centreLine();
  const m = line.length;
  const corners = findCorners(line);
  const echoes = [];

  // --- Surfaces, as a grid of 1 m squares (for the physics and the effects) ---
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of line) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  minX -= 80; maxX += 80; minZ -= 80; maxZ += 80;
  const GW = Math.ceil(maxX - minX), GH = Math.ceil(maxZ - minZ);
  const grid = new Uint8Array(GW * GH);        // 0 grass, 1 tarmac, 2 kerb, 3 gravel
  const trackOnly = new Uint8Array(GW * GH);   // just the track itself (to keep run-offs and barriers off other parts of it)
  const cell = (x, z) => {
    const gx = Math.floor(x - minX), gz = Math.floor(z - minZ);
    return gx < 0 || gz < 0 || gx >= GW || gz >= GH ? -1 : gz * GW + gx;
  };
  const paint = (x, z, type) => {
    const gx = Math.floor(x - minX), gz = Math.floor(z - minZ);
    if (gx < 0 || gz < 0 || gx >= GW || gz >= GH) return;
    const k = gz * GW + gx;
    if (type === 1 || grid[k] === 0 || (type === 2 && grid[k] === 3)) grid[k] = type;   // tarmac wins
  };
  const paintBand = (i0, i1, o0, o1, type) => {
    for (let i = i0; i <= i1; i++) {
      const p = line[((i % m) + m) % m];
      const a = typeof o0 === 'function' ? o0(p) : o0, b = typeof o1 === 'function' ? o1(p) : o1;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      for (let o = lo; o <= hi; o += 0.5) for (const ds of [-0.75, 0, 0.75]) paint(p.x + p.lx * o + p.ux * ds, p.z + p.lz * o + p.uz * ds, type);
    }
  };

  // --- Materials ---
  const asphalt = asphaltTexture();
  const trackMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92 });
  asphalt.repeat.set(1, 1);
  // (painted lines sit on the tarmac: pulled slightly towards the camera
  // so they never flicker against it, even far away)
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  // (the pit entry and exit sit 3 mm below the track, so the track wins
  // where they overlap, but still well above the grass: they used to be
  // pushed back by the graphics card instead, which at a distance pushed
  // them right under the grass so they only showed up close by)
  const wedgeMat = trackMat;
  const kerbMat = new THREE.MeshStandardMaterial({ map: kerbTexture(), roughness: 0.6 });
  // (the game hands over the test area's gravel look: stones with a bumpy
  // normal map, a tile every 3.5 m)
  const gravelMat = gravelMaps
    ? new THREE.MeshStandardMaterial({ map: gravelMaps.colourMap, normalMap: gravelMaps.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 1 })
    : new THREE.MeshStandardMaterial({ map: gravelTexture(), roughness: 1 });
  const runoffMat = new THREE.MeshStandardMaterial({ map: runoffTexture(), roughness: 0.85 });
  const netMat = new THREE.MeshStandardMaterial({ map: netTexture(), transparent: true, alphaTest: 0.3, roughness: 0.8 });
  const add = (geo, mat, receive = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = receive;
    scene.add(mesh);
    return mesh;
  };
  const half = (p) => p.width / 2;

  // The track itself, and its white edge lines
  add(strip(line, 0, m, (p) => -half(p), (p) => half(p), 0, 8, 8), trackMat);
  for (let i = 0; i < m; i++) {
    const p = line[i];
    for (let o = -half(p) - KERB; o <= half(p) + KERB; o += 0.5) {
      for (const ds of [-1, 0, 1]) { const k = cell(p.x + p.lx * o + p.ux * ds, p.z + p.lz * o + p.uz * ds); if (k >= 0) trackOnly[k] = 1; }
    }
  }
  // How much room there is outside point i on one side before another part
  // of the track (so run-offs and barriers never spill onto it)
  const roomOut = (i, side, max) => {
    const p = line[((i % m) + m) % m];
    for (let o = half(p) + KERB + 1.5; o <= half(p) + KERB + max + 4; o += 1) {
      for (const ds of [-1.5, 0, 1.5]) {
        const k = cell(p.x + p.lx * side * o + p.ux * ds, p.z + p.lz * side * o + p.uz * ds);
        if (k >= 0 && trackOnly[k]) return Math.max(0, o - (half(p) + KERB) - 9);   // keep barriers well clear of it
      }
    }
    return max;
  };
  add(strip(line, 0, m, (p) => half(p) - 0.45, (p) => half(p) - 0.2, 0.001), lineMat);
  add(strip(line, 0, m, (p) => -half(p) + 0.2, (p) => -half(p) + 0.45, 0.001), lineMat);
  paintBand(0, m, (p) => -half(p), (p) => half(p), 1);

  // Start/finish line, and the grid boxes behind it (two columns, staggered)
  const startI = line.reduce((best, p, i) => (Math.abs(p.z) < Math.abs(line[best].z) && Math.abs(p.x) < 30 ? i : best), 0);
  const sp = line[startI];
  const sfl = new THREE.Mesh(new THREE.PlaneGeometry(STRAIGHT_WIDTH - 1, 1.2), lineMat);
  sfl.rotation.set(-Math.PI / 2, 0, sp.heading);
  sfl.position.set(sp.x, 0.001, sp.z);
  scene.add(sfl);
  const gridBox = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.2, 0.25), lineMat, 24);
  for (let k = 0; k < 24; k++) {
    const p = line[(startI - 3 - k * 4 + m) % m];                  // every 8 m behind the line
    const side = k % 2 ? -1 : 1;
    const o = side * STRAIGHT_WIDTH / 4;
    const mm = new THREE.Matrix4().compose(
      new THREE.Vector3(p.x + p.lx * o - p.ux * (side > 0 ? 0 : 4), 0.001, p.z + p.lz * o - p.uz * (side > 0 ? 0 : 4)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, p.heading)),
      new THREE.Vector3(1, 1, 1));
    gridBox.setMatrixAt(k, mm);
  }
  scene.add(gridBox);

  // --- Corners: kerbs both sides, sausage kerbs and bollards at the
  // tightest apexes, grass mesh inside, run-off outside, then barriers ---
  const sausages = [], bollards = [];
  corners.forEach((c, ci) => {
    const armcoRuns = [], tyreRuns = [];
    const inside = c.side;                                     // + = left
    // kerbs: from the track edge out, on both sides
    for (const side of [1, -1]) {
      add(strip(line, c.a, c.b, (p) => side * half(p), (p) => side * (half(p) + KERB), 0.001, 4, 4), kerbMat);
      paintBand(c.a, c.b, (p) => side * half(p), (p) => side * (half(p) + KERB), 2);
    }
    // grass-protection mesh on the inside, beyond the kerb
    add(strip(line, c.a + 2, c.b - 2, (p) => inside * (half(p) + KERB), (p) => inside * (half(p) + KERB + 3), 0.002, 1.5, 1.5), netMat, false);
    // run-off outside: gravel at the tight corners (every other one), painted tarmac at the rest
    const wide = Math.min(26, Math.max(12, 3000 / c.radius));
    const gravel = c.radius < 140 && ci % 2 === 0;
    // the room at each point, smoothed so the edge doesn't zig-zag
    const room = new Map();
    for (let i = c.a - 6; i <= c.b + 6; i++) room.set(((i % m) + m) % m, roomOut(i, -inside, wide));
    const roomAt = (p) => {
      const i = line.indexOf(p);
      let r = wide;
      for (let k = -4; k <= 4; k++) r = Math.min(r, room.get(((i + k) % m + m) % m) ?? wide);
      return r;
    };
    const o0 = (p) => -inside * (half(p) + KERB), o1 = (p) => -inside * (half(p) + KERB + Math.max(0.5, roomAt(p)));
    add(strip(line, c.a, c.b, o0, o1, 0.0005, gravel ? 3.5 : 4, gravel ? 3.5 : wide), gravel ? gravelMat : runoffMat);
    paintBand(c.a, c.b, o0, o1, gravel ? 3 : 1);
    // barriers at the back of the run-off: Armco, with a tyre wall in front at the big stops
    // (only where there's proper room: none where another part of the track is close)
    const back = (p) => -inside * (half(p) + KERB + roomAt(p) + 3);
    const run = [];
    for (let i = c.a - 4; i <= c.b + 4; i += 4) {
      const p = line[((i % m) + m) % m];
      run.push(roomAt(p) >= 6 ? [p.x + p.lx * back(p), p.z + p.lz * back(p)] : null);
    }
    for (let k = 0; k < run.length - 1; k++) if (run[k] && run[k + 1]) armcoRuns.push([run[k][0], run[k][1], run[k + 1][0], run[k + 1][1]]);
    if (c.radius < 70) {
      const front = (p) => -inside * (half(p) + KERB + roomAt(p) + 1.6);
      const tr = [];
      for (let i = c.apex - 10; i <= c.apex + 22; i += 4) {
        const p = line[((i % m) + m) % m];
        tr.push(roomAt(p) >= 6 ? [p.x + p.lx * front(p), p.z + p.lz * front(p)] : null);
      }
      // (tyre walls are laid with their back row on the barrier side)
      for (let k = 0; k < tr.length - 1; k++) if (tr[k] && tr[k + 1]) tyreRuns.push(inside > 0 ? [tr[k + 1][0], tr[k + 1][1], tr[k][0], tr[k][1]] : [tr[k][0], tr[k][1], tr[k + 1][0], tr[k + 1][1]]);
    }
    // sausage kerbs and bollards at the tightest apexes
    if (c.radius < 90) {
      for (let i = c.apex - 5; i <= c.apex + 5; i++) {
        const p = line[((i % m) + m) % m];
        const o = inside * (half(p) + KERB + 0.7);
        sausages.push({ x: p.x + p.lx * o, z: p.z + p.lz * o, heading: p.heading });
        paintBand(i, i, inside * (half(p) + KERB), inside * (half(p) + KERB + 1.4), 2);
      }
      for (let i = c.apex - 6; i <= c.apex + 6; i += 2) {
        const p = line[((i % m) + m) % m];
        const o = inside * (half(p) + KERB + 4.5);
        bollards.push({ x: p.x + p.lx * o, z: p.z + p.lz * o });
      }
    }
    // (each corner's barriers are their own model, so denting one is quick)
    if (armcoRuns.length) echoes.push(...buildArmco(scene, armcoRuns));
    if (tyreRuns.length) echoes.push(...buildTyreWalls(scene, tyreRuns));
  });

  // Sausage kerbs: low yellow humps with black stripes
  const sausageGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.8, 14, 1, false, 0, Math.PI);
  sausageGeo.rotateZ(Math.PI / 2);
  sausageGeo.rotateY(Math.PI / 2);
  const sausageTex = canvasTexture(64, 16, (g, w, h) => {
    g.fillStyle = '#f1c40f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b'; g.fillRect(w * 0.42, 0, w * 0.16, h);
  });
  const sausageMesh = new THREE.InstancedMesh(sausageGeo, new THREE.MeshStandardMaterial({ map: sausageTex, roughness: 0.55 }), Math.max(1, sausages.length));
  sausages.forEach((s, i) => sausageMesh.setMatrixAt(i, new THREE.Matrix4().compose(
    new THREE.Vector3(s.x, 0, s.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.heading), new THREE.Vector3(1, 1, 1))));
  sausageMesh.count = sausages.length;
  sausageMesh.castShadow = sausageMesh.receiveShadow = true;
  scene.add(sausageMesh);

  // Bollards: orange posts with a white band. Knock one and it falls over.
  const bollardGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.9, 10);
  bollardGeo.translate(0, 0.45, 0);
  const bollardTex = canvasTexture(16, 64, (g, w, h) => {
    g.fillStyle = '#ff6a13'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f4f2'; g.fillRect(0, h * 0.15, w, h * 0.15);
  });
  const bollardMesh = new THREE.InstancedMesh(bollardGeo, new THREE.MeshStandardMaterial({ map: bollardTex, roughness: 0.5 }), Math.max(1, bollards.length));
  const bq = new THREE.Quaternion(), bp = new THREE.Vector3(), bs = new THREE.Vector3(1, 1, 1), bm = new THREE.Matrix4();
  bollards.forEach((b, i) => {
    bollardMesh.setMatrixAt(i, bm.compose(bp.set(b.x, 0, b.z), bq.identity(), bs));
    b.collider = addCollider(b.x - 0.1, b.x + 0.1, b.z - 0.1, b.z + 0.1, 'bollard', {
      hit: (point, normal) => {
        // tips over, away from the car, and no longer blocks anything
        const axis = new THREE.Vector3(normal.z, 0, -normal.x).normalize();
        bollardMesh.setMatrixAt(i, bm.compose(bp.set(b.x - normal.x * 0.3, 0.1, b.z - normal.z * 0.3), bq.setFromAxisAngle(axis, -Math.PI / 2 * 0.95), bs));
        bollardMesh.instanceMatrix.needsUpdate = true;
        b.collider.minX = b.collider.maxX = b.collider.minZ = b.collider.maxZ = 1e6;
        return { absorb: 0.9 };
      },
    });
  });
  bollardMesh.count = bollards.length;
  bollardMesh.castShadow = true;
  scene.add(bollardMesh);

  // --- The pit lane: alongside the start straight on the right (+x),
  // behind the pit wall, with the garages behind it ---
  const PIT = { x0: 13, x1: 24, z0: -215, z1: 175 };
  const pitGeo = new THREE.PlaneGeometry(PIT.x1 - PIT.x0, PIT.z1 - PIT.z0);
  pitGeo.rotateX(-Math.PI / 2);
  const pit = add(pitGeo, trackMat);
  pit.position.set((PIT.x0 + PIT.x1) / 2, 0, (PIT.z0 + PIT.z1) / 2);
  for (let x = PIT.x0; x <= PIT.x1; x += 0.5) for (let z = PIT.z0; z <= PIT.z1; z += 0.5) paint(x, z, 1);
  // pit entry (from the last corner) and exit (towards turn 1): wedges of tarmac
  const wedge = (pts) => {
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.003, 0);
    add(g, wedgeMat);
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.5) {
      for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.5) {
        // inside the polygon?
        let inPoly = false;
        for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
          if ((pts[a][1] > z) !== (pts[b][1] > z) && x < ((pts[b][0] - pts[a][0]) * (z - pts[a][1])) / (pts[b][1] - pts[a][1]) + pts[a][0]) inPoly = !inPoly;
        }
        if (inPoly) paint(x, z, 1);
      }
    }
  };
  wedge([[PIT.x0, PIT.z1], [PIT.x1, PIT.z1], [10, PIT.z1 + 70], [8, PIT.z1 + 70]]);
  wedge([[PIT.x0, PIT.z0], [PIT.x1, PIT.z0], [10, PIT.z0 - 50], [8, PIT.z0 - 50]]);
  // pit lane lines
  const pitLine = new THREE.Mesh(new THREE.PlaneGeometry(0.2, PIT.z1 - PIT.z0), lineMat);
  pitLine.rotation.x = -Math.PI / 2;
  pitLine.position.set(PIT.x0 + 4.5, 0.001, (PIT.z0 + PIT.z1) / 2);
  scene.add(pitLine);
  // Pit wall (concrete) with a catch fence behind it, then the garages
  echoes.push(...buildConcreteWalls(scene, [[12.2, PIT.z0 + 10, 12.2, PIT.z1 - 10]]));
  echoes.push(...buildFences(scene, [[12.7, PIT.z0 + 10, 12.7, PIT.z1 - 10, -1]]));
  echoes.push(...buildGarages(scene, PIT.x1, -186, 150));

  // --- The main grandstand, across the start straight (on the left) ---
  echoes.push(...buildGrandstand(scene, -34, -150, 150));
  // a catch fence in front of it
  echoes.push(...buildFences(scene, [[-14, -200, -14, 200, 1]]));

  // --- Puddles (on the track, in the low spots) and mud (on the grass) ---
  const puddles = [];
  for (let k = 0; k < (isMobile ? 16 : 26); k++) {
    const p = line[Math.floor(Math.random() * m)];
    const o = (Math.random() * 2 - 1) * (half(p) - 2.5);
    puddles.push({ x: p.x + p.lx * o, z: p.z + p.lz * o, r: 1.3 + Math.random() * 2, start: Math.random() * 0.5 });
  }
  const mud = [];
  for (let k = 0; k < 12; k++) {
    const p = line[Math.floor(Math.random() * m)];
    const side = Math.random() < 0.5 ? 1 : -1;
    const o = side * (half(p) + 10 + Math.random() * 12);
    const x = p.x + p.lx * o, z = p.z + p.lz * o;
    if (surface(x, z) === 'grass') mud.push({ x, z, r: 1.4 + Math.random() * 1.6, start: Math.random() * 0.5 });
  }

  function surface(x, z) {
    const gx = Math.floor(x - minX), gz = Math.floor(z - minZ);
    if (gx < 0 || gz < 0 || gx >= GW || gz >= GH) return 'grass';
    const t = grid[gz * GW + gx];
    return t === 1 ? 'tarmac' : t === 2 ? 'kerb' : t === 3 ? 'gravel' : 'grass';
  }

  // Where the car starts: on the start straight, 30 m behind the line, facing down it
  const startP = line[(startI + Math.round(30 / STEP) * -1 + m) % m];
  const start = { x: startP.x + startP.lx * 2.5, z: startP.z + startP.lz * 2.5, heading: startP.heading };

  return {
    echoes: finishScenery(echoes),
    surfaceAt: surface,
    start,
    puddles,
    mud,
    grassTexture: grassTexture(),
    view: { fogNear: 120, fogFar: 900, far: 1400 },
    groundY: -0.04,          // the grass sits just below the track, so they never flicker against each other
    lengthM: Math.round(line[m - 1].s),
    corners: corners.length,
    line,                    // the centre line (for testing and, later, AI drivers)
  };
}

// The main grandstand: tiers of seats rising away from the track (facing
// +x, towards the start straight), under a big curved roof. Solid to the
// car, and dry underneath when it rains.
function buildGrandstand(scene, x, z0, z1) {
  const TIERS = 14, DEPTH = 1.2, RISE = 0.6, len = z1 - z0;
  const concrete = new THREE.MeshStandardMaterial({ color: 0xc9c6bf, roughness: 0.9 });
  const seatTex = canvasTexture(64, 16, (g, w, h) => {
    // rows of seats in Sepang yellow, blue and red blocks
    g.fillStyle = '#e4b51c'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let k = 0; k < w; k += 4) g.fillRect(k, 0, 1, h);
  }, Math.round(len / 2), 1);
  const seats = new THREE.MeshStandardMaterial({ map: seatTex, roughness: 0.6 });
  const group = new THREE.Group();
  for (let t = 0; t < TIERS; t++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(DEPTH, RISE * (t + 1), len), concrete);
    step.position.set(x - t * DEPTH, RISE * (t + 1) / 2, (z0 + z1) / 2);
    step.castShadow = step.receiveShadow = true;
    group.add(step);
    const row = new THREE.Mesh(new THREE.BoxGeometry(DEPTH * 0.5, 0.35, len - 0.4), seats);
    row.position.set(x - t * DEPTH - DEPTH * 0.15, RISE * (t + 1) + 0.17, (z0 + z1) / 2);
    row.castShadow = true;
    group.add(row);
  }
  // the roof: a big curved canopy on columns, like Sepang's leaf-shaped roof
  const top = RISE * TIERS + 7;
  const back = x - TIERS * DEPTH;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(x - back + 12, 0.4, len + 10),
    new THREE.MeshStandardMaterial({ color: 0xe8e9ea, roughness: 0.5, metalness: 0.3 }));
  roof.position.set((x + back) / 2 + 3, top, (z0 + z1) / 2);
  roof.rotation.z = 0.08;                                   // rising towards the track
  roof.castShadow = true;
  group.add(roof);
  for (let z = z0; z <= z1; z += 15) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, top, 10), concrete);
    col.position.set(back - 0.5, top / 2, z);
    col.castShadow = true;
    group.add(col);
  }
  scene.add(group);
  addCollider(back - 1, x + DEPTH / 2, z0, z1, 'building');
  addRoof(back - 4, x + 6, z0 - 5, z1 + 5, top);
  return [echoBox(back - 1, 0, z0, x + DEPTH / 2, top, z1, 0.9)];
}
