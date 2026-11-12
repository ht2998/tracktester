// =====================================================================
// SCENERY: buildings, walls, barriers and fences around the test area.
// For now they're for looks and for sound: buildings and walls reflect
// the car's sound back as echoes. You can drive through them; crashes
// (with crush physics for both the car and the barriers) come later.
// Everything repeated (tyres, posts, wall blocks, rails) is drawn with
// instancing, so each kind of piece is a single draw call.
//
// buildScenery(scene) returns the echo surfaces: [{ min, max, reflect }]
//   reflect: how much sound bounces back (1 = solid building, 0.1 = mesh fence)
// and, on that same list:
//   .colliders: what the car can hit, as boxes seen from above
//     { minX, maxX, minZ, maxZ, kind, hit(point, normal, speed) }
//     kind: 'building' (solid), 'concrete' (cracks), 'armco' (dents),
//           'tyres' (squash back), 'fence' (bulges back)
//   .roofs: where rain can't fall: { minX, maxX, minZ, maxZ, height }
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 5;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// A repeating pattern painted on a canvas, used as a texture
function canvasTexture(w, h, paint, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

// Lay pieces along a straight line from (ax, az) to (bx, bz), every `step` metres
function along(ax, az, bx, bz, step) {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.round(len / step));
  const angle = Math.atan2(bx - ax, bz - az);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, angle, len: len / n });
  }
  return out;
}

// Everything the car can hit, and everything with a roof (filled in as the
// scenery is built)
let COLLIDERS = [];
let ROOFS = [];
function addCollider(minX, maxX, minZ, maxZ, kind, extra = {}) {
  const c = { minX, maxX, minZ, maxZ, kind, ...extra };
  COLLIDERS.push(c);
  return c;
}
// The box (seen from above) around a straight piece centred at (x, z),
// running along `angle`, `len` long and `thick` across
function pieceBox(c, x, z, angle, len, thick) {
  const ax = Math.sin(angle) * len / 2, az = Math.cos(angle) * len / 2;      // along
  const bx = Math.cos(angle) * thick / 2, bz = -Math.sin(angle) * thick / 2; // across
  const ex = Math.abs(ax) + Math.abs(bx), ez = Math.abs(az) + Math.abs(bz);
  c.minX = x - ex; c.maxX = x + ex; c.minZ = z - ez; c.maxZ = z + ez;
  return c;
}
const across = (angle) => ({ x: Math.cos(angle), z: -Math.sin(angle) });   // sideways to a run
// How far along a run a point is, and from the piece at (x, z)
const alongDist = (p, x, z, angle) => Math.abs((p.x - x) * Math.sin(angle) + (p.z - z) * Math.cos(angle));

const box = (minX, minY, minZ, maxX, maxY, maxZ, reflect) => ({
  min: new THREE.Vector3(minX, minY, minZ),
  max: new THREE.Vector3(maxX, maxY, maxZ),
  reflect,
});

// ---------------------------------------------------------------------
// BUILDINGS
// ---------------------------------------------------------------------

// A row of pit garages, built along the z axis with the open fronts facing
// -x (towards the start straight). Each bay has its roller door rolled up
// and is fitted out like a working garage: racking along the back wall
// with parts boxes and spare tyres, a red tool chest and a tool board on
// the wall, stacks of wheels, a trolley jack and axle stands, a parts
// trolley, an oil drum, and strip lights in the ceiling.
// Everything repeated is instanced, so the whole row is a few dozen draws.

// Draw one shape many times: list of [x, y, z, turnY, sx, sy, sz] (and an
// optional colour per copy)
function many(scene, geo, mat, list, colours) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  list.forEach(([x, y, z, ry = 0, sx = 1, sy = 1, sz = 1], i) => {
    q.setFromAxisAngle(UP, ry);
    mesh.setMatrixAt(i, m4.compose(pos.set(x, y, z), q, scl.set(sx, sy, sz)));
    if (colours) mesh.setColorAt(i, new THREE.Color(colours[i % colours.length]));
  });
  mesh.count = list.length;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function buildGarages(scene, x, z0, z1, depth = 10, height = 5) {
  const len = z1 - z0;
  const bays = Math.floor(len / 6);
  const bayLen = len / bays;
  const OPEN_W = 4.4, OPEN_H = 3.6;            // each doorway
  const back = x + depth;                      // the back wall
  const wallMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#d9d6cf';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.06)';          // panel joints
      for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 2);
    }, 2, 1),
    roughness: 0.85,
  });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xe9e8e4, roughness: 0.9 });   // white painted inside
  const solid = (w, h, d, cx, cy, cz, mat = wallMat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(cx, cy, cz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    // anything standing on the ground is solid to the car
    if (cy - h / 2 < 0.5) addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, 'building');
    return m;
  };

  // --- The shell: back wall, end walls, walls between the bays, the
  // fascia above the doorways and the pillars between them ---
  solid(0.3, height, len, back - 0.15, height / 2, (z0 + z1) / 2);
  solid(depth, height, 0.3, x + depth / 2, height / 2, z0 + 0.15);
  solid(depth, height, 0.3, x + depth / 2, height / 2, z1 - 0.15);
  for (let i = 1; i < bays; i++) solid(depth - 0.3, height, 0.2, x + depth / 2, height / 2, z0 + i * bayLen, innerMat);
  solid(0.35, height - OPEN_H, len, x + 0.175, OPEN_H + (height - OPEN_H) / 2, (z0 + z1) / 2);
  const pillar = (bayLen - OPEN_W) / 2;
  for (let i = 0; i <= bays; i++) {
    const zc = z0 + i * bayLen;
    const w = i === 0 || i === bays ? pillar : pillar * 2;
    solid(0.35, OPEN_H, w, x + 0.175, OPEN_H / 2, i === 0 ? zc + w / 2 : i === bays ? zc - w / 2 : zc);
  }
  // Ceiling and roof slab (with an overhang over the doors)
  solid(depth, 0.1, len, x + depth / 2, height - 0.05, (z0 + z1) / 2, innerMat);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(depth + 2, 0.3, len + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.7 })
  );
  roof.position.set(x + depth / 2 - 1, height + 0.15, (z0 + z1) / 2);
  roof.castShadow = true;
  scene.add(roof);
  ROOFS.push({ minX: x - 2, maxX: x + depth, minZ: z0 - 0.3, maxZ: z1 + 0.3, height });
  // Floor: smooth grey epoxy with a yellow line across each doorway
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(depth - 0.3, len - 0.3),
    new THREE.MeshStandardMaterial({ color: 0x8d9196, roughness: 0.35, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(x + depth / 2, 0.012, (z0 + z1) / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // Per-bay pieces, gathered into lists and drawn instanced
  const L = {
    drum: [], upright: [], shelf: [], bin: [], binColour: [], shelfTyre: [], chest: [], chestTop: [],
    board: [], stackTyre: [], jackBody: [], jackHandle: [], stand: [], standTop: [], trolley: [],
    trolleyWheel: [], drum2: [], strip: [], line: [], lamp: [], lampPole: [],
  };
  const binColours = [0x2c64c8, 0xd23a2a, 0xe8b72c, 0x3f8f4a, 0x555a60];
  for (let i = 0; i < bays; i++) {
    const zc = z0 + (i + 0.5) * bayLen;
    // the inside faces of the bay's side walls (the end walls are thicker than the ones between bays)
    const zl = zc - bayLen / 2 + (i === 0 ? 0.3 : 0.1) + 0.03;
    const zr = zc + bayLen / 2 - (i === bays - 1 ? 0.3 : 0.1) - 0.03;
    // the rolled-up door at the top of the doorway
    L.drum.push([x + 0.45, OPEN_H - 0.2, zc, 0, 1, OPEN_W, 1]);
    // a yellow line across the doorway
    L.line.push([x + 0.6, 0.015, zc, 0, 0.08, 1, OPEN_W]);
    // Racking: two shelving units against the back wall
    for (const zs of [zc - 1.3, zc + 1.3]) {
      const rx = back - 0.6;
      addCollider(rx - 0.32, rx + 0.32, zs - 1.0, zs + 1.0, 'building');   // the racking
      for (const dz of [-0.95, 0.95]) for (const dx of [-0.28, 0.28]) L.upright.push([rx + dx, 1.25, zs + dz]);
      for (const h of [0.15, 0.85, 1.55, 2.25]) {
        L.shelf.push([rx, h, zs]);
        if (h < 0.5) {
          // spare tyres on the bottom shelf
          for (const t of [-0.6, 0, 0.6]) L.shelfTyre.push([rx, h + 0.32, zs + t]);
        } else {
          // parts boxes on the rest, in assorted colours and sizes
          for (let b = 0; b < 4; b++) {
            if (Math.random() < 0.2) continue;
            const s = 0.7 + Math.random() * 0.5;
            L.bin.push([rx + (Math.random() - 0.5) * 0.1, h + 0.13 * s, zs - 0.7 + b * 0.47, (Math.random() - 0.5) * 0.2, s, s, s]);
            L.binColour.push(binColours[(Math.random() * binColours.length) | 0]);
          }
        }
      }
    }
    // A red tool chest against one side wall, with a tool board above it
    const side = i % 2 ? 1 : -1;
    const wallZ = side > 0 ? zr : zl;
    // (turned so its back is against the wall: 0.55 m deep, 1 m wide)
    L.chest.push([x + 5.5, 0.55, wallZ - side * 0.3, side > 0 ? Math.PI / 2 : -Math.PI / 2]);
    L.chestTop.push([x + 5.5, 1.22, wallZ - side * 0.3, side > 0 ? Math.PI / 2 : -Math.PI / 2]);
    L.board.push([x + 5.5, 1.95, wallZ - side * 0.02, side > 0 ? Math.PI : 0]);
    addCollider(x + 5.0, x + 6.0, Math.min(wallZ, wallZ - side * 0.58), Math.max(wallZ, wallZ - side * 0.58), 'building');   // the tool chest
    // Stacks of wheels by the doorway on the other side
    const tyreZ = side > 0 ? zl + 0.45 : zr - 0.45;
    for (const sx of [x + 1.3, x + 2.1]) {
      const n = 2 + ((Math.random() * 3) | 0);
      for (let k = 0; k < n; k++) L.stackTyre.push([sx, 0.11 + k * 0.205, tyreZ, 0, 1, 1, 1]);
    }
    // A trolley jack and four axle stands in the middle, ready for a car
    L.jackBody.push([x + 3.4, 0.08, zc + 0.3, Math.PI / 2]);
    L.jackHandle.push([x + 4.15, 0.45, zc + 0.3, 0]);
    for (const [dx, dz] of [[-1.1, -0.75], [-1.1, 0.75], [1.1, -0.75], [1.1, 0.75]]) {
      L.stand.push([x + 5 + dx, 0.18, zc + dz]);
      L.standTop.push([x + 5 + dx, 0.4, zc + dz]);
    }
    // A parts trolley and an oil drum
    L.trolley.push([x + 7.4, 0.45, wallZ - side * 0.5, 0]);
    L.trolley.push([x + 7.4, 0.12, wallZ - side * 0.5, 0, 1, 0.4, 1]);
    for (const [dx, dz] of [[-0.3, -0.2], [-0.3, 0.2], [0.3, -0.2], [0.3, 0.2]]) L.trolleyWheel.push([x + 7.4 + dx, 0.04, wallZ - side * 0.5 + dz]);
    L.drum2.push([back - 1.6, 0.44, side > 0 ? zl + 0.5 : zr - 0.5]);
    { const dz = side > 0 ? zl + 0.5 : zr - 0.5; addCollider(back - 1.9, back - 1.3, dz - 0.3, dz + 0.3, 'building'); }   // the oil drum
    // Strip lights in the ceiling, and a work lamp on a stand
    for (const dx of [2.5, 6.5]) L.strip.push([x + dx, height - 0.14, zc]);
    L.lamp.push([x + 2.6, 1.55, zc - 1.6, -0.5]);
    L.lampPole.push([x + 2.6, 0.75, zc - 1.6]);
  }

  // Shapes and materials
  const steelBlue = new THREE.MeshStandardMaterial({ color: 0x2e5aa8, metalness: 0.5, roughness: 0.5 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
  const chestRed = new THREE.MeshStandardMaterial({
    map: canvasTexture(64, 128, (g, w, h) => {                      // drawers with handles
      g.fillStyle = '#c3221c';
      g.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 15) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, y + 12, w, 2);
        g.fillStyle = '#d8dadc';
        g.fillRect(8, y + 4, w - 16, 3);
      }
    }),
    metalness: 0.4, roughness: 0.4,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 128, (g, w, h) => {                     // pegboard with tool outlines
      g.fillStyle = '#5b6168';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      for (let y = 4; y < h; y += 8) for (let xx = 4; xx < w; xx += 8) g.fillRect(xx, y, 2, 2);
      g.fillStyle = '#c9ccd0';
      for (let k = 0; k < 9; k++) {                                // spanners, longest to shortest
        const sx = 12 + k * 12, len = 70 - k * 5;
        g.fillRect(sx, 20, 4, len);
        g.beginPath(); g.arc(sx + 2, 18, 5, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#d23a2a';                                      // screwdrivers
      for (let k = 0; k < 6; k++) g.fillRect(130 + k * 10, 24, 6, 22);
      g.fillStyle = '#c9ccd0';
      for (let k = 0; k < 6; k++) g.fillRect(132 + k * 10, 46, 2, 26);
      g.fillStyle = '#2b2b2b';                                      // a hammer and pliers
      g.fillRect(210, 20, 6, 60);
      g.fillStyle = '#9aa0a6';
      g.fillRect(200, 16, 26, 10);
      g.fillRect(232, 30, 4, 50);
      g.fillRect(240, 30, 4, 50);
    }),
    roughness: 0.8,
  });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f8ff, emissiveIntensity: 2.2 });
  const tyreGeo = new THREE.TorusGeometry(0.24, 0.1, 10, 24);
  tyreGeo.rotateX(Math.PI / 2);                                     // lying flat
  const sideTyreGeo = new THREE.TorusGeometry(0.24, 0.09, 10, 24);  // standing on the shelf
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8c22a, roughness: 0.6 });
  const doorTex = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#8f979f';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, w, 1); }
  }, 1, 6);
  const drumGeo = new THREE.CylinderGeometry(0.28, 0.28, 1, 16);
  drumGeo.rotateX(Math.PI / 2);                                     // along z, across the doorway

  many(scene, drumGeo, new THREE.MeshStandardMaterial({ map: doorTex, metalness: 0.4, roughness: 0.5 }), L.drum);
  many(scene, new THREE.BoxGeometry(1, 0.01, 1), yellow, L.line).castShadow = false;
  many(scene, new THREE.BoxGeometry(0.05, 2.5, 0.05), steelBlue, L.upright);
  many(scene, new THREE.BoxGeometry(0.6, 0.04, 1.95), steel, L.shelf);
  const bins = many(scene, new THREE.BoxGeometry(0.4, 0.26, 0.38), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), L.bin, L.binColour);
  bins.instanceColor.needsUpdate = true;
  many(scene, sideTyreGeo, black, L.shelfTyre);
  many(scene, new THREE.BoxGeometry(0.55, 1.0, 1.0), chestRed, L.chest);
  many(scene, new THREE.BoxGeometry(0.5, 0.34, 0.95), chestRed, L.chestTop);
  many(scene, new THREE.PlaneGeometry(2.2, 1.1), boardMat, L.board).castShadow = false;
  many(scene, tyreGeo, black, L.stackTyre);
  many(scene, new THREE.BoxGeometry(0.3, 0.12, 0.7), new THREE.MeshStandardMaterial({ color: 0xc3221c, metalness: 0.4, roughness: 0.45 }), L.jackBody);
  const handle = new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8);
  handle.rotateZ(1.0);
  many(scene, handle, steel, L.jackHandle);
  many(scene, new THREE.ConeGeometry(0.16, 0.36, 4), new THREE.MeshStandardMaterial({ color: 0xd23a2a, metalness: 0.4, roughness: 0.5 }), L.stand);
  many(scene, new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), steel, L.standTop);
  many(scene, new THREE.BoxGeometry(0.9, 0.05, 0.55), steel, L.trolley);
  many(scene, new THREE.SphereGeometry(0.04, 8, 6), black, L.trolleyWheel);
  many(scene, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), new THREE.MeshStandardMaterial({ color: 0x1d5fa8, metalness: 0.5, roughness: 0.45 }), L.drum2);
  many(scene, new THREE.BoxGeometry(1.4, 0.06, 0.18), lightMat, L.strip).castShadow = false;
  many(scene, new THREE.BoxGeometry(0.08, 0.22, 0.3), lightMat, L.lamp).castShadow = false;
  many(scene, new THREE.CylinderGeometry(0.02, 0.03, 1.5, 8), black, L.lampPole);

  return [box(x, 0, z0, x + depth, height, z1, 1)];
}

// An office block / race control tower: windows in bands
function buildOffice(scene, x0, z0, x1, z1, height) {
  const w = x1 - x0, d = z1 - z0;
  const floors = Math.round(height / 3.2);
  const facade = canvasTexture(256, 256, (g, cw, ch) => {
    g.fillStyle = '#c9c4b8';
    g.fillRect(0, 0, cw, ch);
    // One floor per texture repeat: a band of windows with frames
    g.fillStyle = '#2b3a48';
    g.fillRect(0, ch * 0.3, cw, ch * 0.45);
    g.fillStyle = 'rgba(150,190,220,0.35)';      // sky reflected in the glass
    g.fillRect(0, ch * 0.3, cw, ch * 0.12);
    g.fillStyle = '#c9c4b8';
    for (let x = 0; x < cw; x += 64) g.fillRect(x, ch * 0.3, 5, ch * 0.45);
  }, 1, floors);
  const mat = new THREE.MeshStandardMaterial({ map: facade, roughness: 0.75 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), mat);
  // Stretch the window pattern to the building's width on each side
  facade.repeat.set(Math.max(1, Math.round(Math.max(w, d) / 4)), floors);
  block.position.set((x0 + x1) / 2, height / 2, (z0 + z1) / 2);
  block.castShadow = block.receiveShadow = true;
  scene.add(block);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.8 })
  );
  roof.position.set((x0 + x1) / 2, height + 0.2, (z0 + z1) / 2);
  scene.add(roof);
  addCollider(x0, x1, z0, z1, 'building');
  ROOFS.push({ minX: x0 - 0.2, maxX: x1 + 0.2, minZ: z0 - 0.2, maxZ: z1 + 0.2, height });
  return [box(x0, 0, z0, x1, height, z1, 1)];
}

// ---------------------------------------------------------------------
// BARRIERS
// ---------------------------------------------------------------------

// Concrete wall: 2 m blocks (1.375 m tall) with joints, red and white kerb-style paint
// along the bottom. Each run is [ax, az, bx, bz].
function buildConcreteWalls(scene, runs) {
  const H = 1.375, T = 0.5, STEP = 2;
  const pieces = runs.flatMap(([ax, az, bx, bz]) => along(ax, az, bx, bz, STEP).slice(0, -1).map((p, i, arr) => {
    // centre each block between this point and the next
    const t = (i + 0.5) / arr.length;
    return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, angle: p.angle, len: p.len, i };
  }));
  const concrete = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = '#b8b5ae';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) {               // speckle
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    g.fillStyle = 'rgba(0,0,0,0.25)';             // the joint at each block's end
    g.fillRect(0, 0, 2, h);
  });
  const walls = new THREE.InstancedMesh(
    new THREE.BoxGeometry(T, H, STEP - 0.02),
    new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.9 }),
    pieces.length
  );
  // A painted stripe along the bottom, alternating red and white per block
  const stripe = new THREE.InstancedMesh(
    new THREE.BoxGeometry(T + 0.02, 0.25, STEP - 0.02),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    pieces.length
  );
  const red = new THREE.Color(0xc8282a), white = new THREE.Color(0xf2f2ee);
  pieces.forEach((p, i) => {
    q.setFromAxisAngle(UP, p.angle);
    walls.setMatrixAt(i, m4.compose(pos.set(p.x, H / 2, p.z), q, scl.set(1, 1, p.len / STEP)));
    stripe.setMatrixAt(i, m4.compose(pos.set(p.x, 0.125, p.z), q, scl.set(1, 1, p.len / STEP)));
    stripe.setColorAt(i, i % 2 ? red : white);
  });
  walls.castShadow = walls.receiveShadow = true;
  scene.add(walls, stripe);

  // Cracks: a hit leaves a crack pattern on the wall (bigger the harder the
  // hit) and knocks off a few chips of concrete. The wall itself doesn't move.
  const crackTex = [0, 1, 2].map(() => canvasTexture(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const branch = (x, y, a, len, width) => {
      if (len < 6 || width < 0.4) return;
      let cx = x, cy = y;
      g.strokeStyle = 'rgba(25,24,22,0.85)';
      g.lineWidth = width;
      g.beginPath(); g.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) {
        a += (Math.random() - 0.5) * 0.7;
        cx += Math.cos(a) * len / 5; cy += Math.sin(a) * len / 5;
        g.lineTo(cx, cy);
        if (Math.random() < 0.35) branch(cx, cy, a + (Math.random() < 0.5 ? 0.8 : -0.8), len * 0.5, width * 0.6);
      }
      g.stroke();
    };
    for (let k = 0; k < 7; k++) branch(w / 2, h / 2, (k / 7) * Math.PI * 2 + Math.random() * 0.5, 70 + Math.random() * 50, 3);
    g.fillStyle = 'rgba(40,38,35,0.55)';           // the crushed spot in the middle
    g.beginPath(); g.arc(w / 2, h / 2, 10, 0, Math.PI * 2); g.fill();
  }));
  const crackGeo = new THREE.PlaneGeometry(1, 1);
  const crackMats = crackTex.map((t) => new THREE.MeshStandardMaterial({
    map: t, transparent: true, depthWrite: false, roughness: 0.95,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  const cracks = [];
  const crackAt = (point, normal, speed) => {
    if (speed < 2) return null;
    const size = Math.min(1.5, 0.35 + speed * 0.05);
    const m = new THREE.Mesh(crackGeo, crackMats[(Math.random() * 3) | 0]);
    m.position.set(point.x + normal.x * 0.012, Math.min(H - size / 2, Math.max(size / 2, 0.45 + Math.random() * 0.2)), point.z + normal.z * 0.012);
    m.rotation.set(0, Math.atan2(normal.x, normal.z), Math.random() * Math.PI * 2);
    m.scale.setScalar(size);
    scene.add(m);
    cracks.push(m);
    if (cracks.length > 40) scene.remove(cracks.shift());
    return { chips: Math.min(14, Math.round(speed * 0.8)) };
  };
  // one hit box per block, so walls at any angle fit snugly
  for (const p of pieces) pieceBox(addCollider(0, 0, 0, 0, 'concrete', { hit: crackAt }), p.x, p.z, p.angle, p.len, T);
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - T / 2, 0, Math.min(az, bz) - T / 2,
    Math.max(ax, bx) + T / 2, H, Math.max(az, bz) + T / 2, 0.55));
}

// A straight barrier run, cut into short stations so it can bend anywhere
// along its length: s = distance along, u = direction along, a = across
// (+a = to the left of someone walking from start to end)
function makeRun(ax, az, bx, bz, spacing) {
  const len = Math.hypot(bx - ax, bz - az);
  const angle = Math.atan2(bx - ax, bz - az);
  const n = Math.max(2, Math.round(len / spacing) + 1);
  const u = { x: Math.sin(angle), z: Math.cos(angle) };
  const a = across(angle);
  const s = Array.from({ length: n }, (_, i) => (i / (n - 1)) * len);
  return { ax, az, len, angle, n, u, a, s, ds: len / (n - 1) };
}
// Where a point is along a run (0..len), and whether it's on the run's left
const runPos = (r, p) => Math.max(0, Math.min(r.len, (p.x - r.ax) * r.u.x + (p.z - r.az) * r.u.z));
const gauss = (d, sigma) => Math.exp(-(d * d) / (2 * sigma * sigma));

// Armco: two W-profile steel rails on posts every 2 m. Each rail is one
// continuous strip with a bend point every 25 cm, so a hit bends it in a
// smooth curve exactly where (and as wide as) the car struck, deepest at
// the bottom rail (the height a car hits). Posts lean over only as far as
// the rail is pushed at that post.
function buildArmco(scene, runs) {
  const SP = 0.25, POST_EVERY = 8;                     // posts every 2 m
  const RAILS = [{ y: 0.55, give: 1 }, { y: 0.82, give: 0.6 }];
  // The W profile (across, up) of each rail, relative to its centre
  const PROFILE = [[0, 0.155], [0.035, 0.08], [0.005, 0], [0.035, -0.08], [0, -0.155]];
  const list = runs.map(([ax, az, bx, bz]) => makeRun(ax, az, bx, bz, SP));
  let verts = 0, posts = 0;
  for (const r of list) {
    r.v0 = verts;
    verts += r.n * RAILS.length * PROFILE.length;
    r.dent = RAILS.map(() => new Float32Array(r.n));
    r.posts = [];
    for (let i = 0; i < r.n; i += POST_EVERY) r.posts.push({ i, k: posts++ });
    if ((r.n - 1) % POST_EVERY) r.posts.push({ i: r.n - 1, k: posts++ });
  }
  const position = new Float32Array(verts * 3);
  const index = [];
  for (const r of list) {
    RAILS.forEach((_, k) => {
      const base = r.v0 + k * r.n * PROFILE.length;
      for (let i = 0; i < r.n - 1; i++) {
        for (let j = 0; j < PROFILE.length - 1; j++) {
          const p = base + i * PROFILE.length + j, q2 = p + PROFILE.length;
          index.push(p, q2, p + 1, p + 1, q2, q2 + 1);
        }
      }
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(index);
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c6, roughness: 0.35, metalness: 0.8, side: THREE.DoubleSide });
  const railMesh = new THREE.Mesh(geo, steel);
  railMesh.castShadow = railMesh.receiveShadow = true;
  railMesh.frustumCulled = false;
  const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.85, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.6, metalness: 0.5 }), posts);
  postMesh.castShadow = true;
  scene.add(railMesh, postMesh);

  const tilt = new THREE.Quaternion(), turn = new THREE.Quaternion(), axis = new THREE.Vector3();
  const draw = (r) => {
    RAILS.forEach((rail, k) => {
      const base = r.v0 + k * r.n * PROFILE.length;
      for (let i = 0; i < r.n; i++) {
        const d = r.dent[k][i];
        const cx = r.ax + r.u.x * r.s[i] + r.a.x * d, cz = r.az + r.u.z * r.s[i] + r.a.z * d;
        const sag = Math.abs(d) * 0.12;                 // a crushed rail sags a little
        PROFILE.forEach(([px, py], j) => {
          const o = (base + i * PROFILE.length + j) * 3;
          position[o] = cx + r.a.x * px;
          position[o + 1] = rail.y + py - sag;
          position[o + 2] = cz + r.a.z * px;
        });
      }
    });
    for (const p of r.posts) {
      const d = r.dent[0][p.i];
      // the post leans with the bottom rail (tilting about the run's own
      // direction moves its top across the run)
      axis.set(r.u.x, 0, r.u.z);
      const lean = Math.min(0.9, Math.abs(d) * 1.1) * Math.sign(d);
      tilt.setFromAxisAngle(axis, -lean);
      turn.setFromAxisAngle(UP, r.angle).premultiply(tilt);
      postMesh.setMatrixAt(p.k, m4.compose(pos.set(
        r.ax + r.u.x * r.s[p.i] + r.a.x * d * 0.5, 0.425 - Math.abs(d) * 0.05,
        r.az + r.u.z * r.s[p.i] + r.a.z * d * 0.5), turn, scl.set(1, 1, 1)));
    }
    // Hit boxes: a 1 m piece every 4 stations, where the bottom rail now is
    for (const c of r.boxes) {
      let d = 0;
      for (let i = c.i0; i <= c.i1; i++) if (Math.abs(r.dent[0][i]) > Math.abs(d)) d = r.dent[0][i];
      const sm = (r.s[c.i0] + r.s[c.i1]) / 2;
      pieceBox(c.collider, r.ax + r.u.x * sm + r.a.x * d, r.az + r.u.z * sm + r.a.z * d, r.angle, r.s[c.i1] - r.s[c.i0], 0.22);
    }
  };
  for (const r of list) {
    r.boxes = [];
    for (let i0 = 0; i0 < r.n - 1; i0 += 4) {
      const c = { i0, i1: Math.min(r.n - 1, i0 + 4) };
      c.collider = addCollider(0, 0, 0, 0, 'armco', { hit: (pt, nrm, v) => dentAt(r, pt, nrm, v) });
      r.boxes.push(c);
    }
    draw(r);
  }
  const finish = () => {
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    postMesh.instanceMatrix.needsUpdate = true;
  };
  finish();
  // A hit: the dent is deepest where the car struck and fades out either
  // side; harder hits push further and spread wider
  const dentAt = (r, point, normal, speed) => {
    if (speed < 1.5) return null;
    const s0 = runPos(r, point);
    const away = -Math.sign(normal.x * r.a.x + normal.z * r.a.z) || 1;
    const push = 0.045 * speed;
    const sigma = 0.7 + 0.015 * speed;
    RAILS.forEach((rail, k) => {
      const dent = r.dent[k];
      for (let i = 0; i < r.n; i++) {
        const f = gauss(r.s[i] - s0, sigma);
        if (f < 0.01) continue;
        const room = Math.max(0, 0.9 - Math.abs(dent[i]));
        dent[i] += away * Math.min(room, push * f * rail.give);
      }
    });
    draw(r);
    finish();
    return { absorb: 0.5 };
  };
  return list.map((r) => {
    const bx = r.ax + r.u.x * r.len, bz = r.az + r.u.z * r.len;
    return box(Math.min(r.ax, bx) - 0.1, 0, Math.min(r.az, bz) - 0.1, Math.max(r.ax, bx) + 0.1, 1, Math.max(r.az, bz) + 0.1, 0.35);
  });
}

// Tyre barrier: stacks of old tyres, bolted together, with a belt of
// conveyor rubber across the front (here: the stacks, 4 high, 2 deep)
function buildTyreWalls(scene, runs) {
  const R = 0.32, STEP = 0.62, HIGH = 4, ROWS = 2;
  const columns = [];
  const spots = runs.flatMap(([ax, az, bx, bz]) => {
    const pts = along(ax, az, bx, bz, STEP);
    const out = [];
    for (const p of pts) {
      const lx = Math.cos(p.angle), lz = -Math.sin(p.angle);   // across the run
      const col = { x: p.x, z: p.z, angle: p.angle, push: 0, tyres: [] };
      columns.push(col);
      for (let row = 0; row < ROWS; row++) {
        for (let level = 0; level < HIGH; level++) {
          const t = { x: p.x + lx * row * STEP, z: p.z + lz * row * STEP, y: 0.11 + level * 0.22, level, jx: 0, jz: 0, tilt: 0, spin: Math.random() * Math.PI, col };
          out.push(t);
          col.tyres.push(t);
        }
      }
    }
    return out;
  });
  const tyreGeo = new THREE.TorusGeometry(R - 0.09, 0.1, 8, 18);
  tyreGeo.rotateX(Math.PI / 2);
  const tyres = new THREE.InstancedMesh(tyreGeo, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.92 }), spots.length);
  const shade = new THREE.Color();
  spots.forEach((s, i) => {
    q.setFromAxisAngle(UP, s.spin);
    tyres.setMatrixAt(i, m4.compose(pos.set(s.x, s.y, s.z), q, scl.set(1, 1.15, 1)));
    // Some old tyres are painted white or red, like at real tracks
    const r = Math.random();
    tyres.setColorAt(i, shade.set(r < 0.12 ? 0xe9e6df : r < 0.2 ? 0xb42a24 : 0x2a2a2c));
  });
  tyres.castShadow = tyres.receiveShadow = true;
  scene.add(tyres);

  // Squashing back: a hit shoves the stacks near the impact back (the
  // front row squashes into the back row), and knocks the tyres askew,
  // the top ones most. Each column of stacks is its own hit box.
  const colBox = (c) => {
    const a = across(c.angle);
    const near = -R + c.push, far = STEP + R + c.push * 0.6;     // the back row moves less
    const xs = [c.x + a.x * near, c.x + a.x * far], zs = [c.z + a.z * near, c.z + a.z * far];
    const ax = Math.abs(Math.sin(c.angle)) * R, az = Math.abs(Math.cos(c.angle)) * R;
    c.collider.minX = Math.min(...xs) - ax; c.collider.maxX = Math.max(...xs) + ax;
    c.collider.minZ = Math.min(...zs) - az; c.collider.maxZ = Math.max(...zs) + az;
  };
  for (const c of columns) { c.collider = addCollider(0, 0, 0, 0, 'tyres', { hit: (pt, n, v) => squashAt(pt, n, v) }); colBox(c); }
  const squashAt = (point, normal, speed) => {
    if (speed < 1.5) return null;
    for (const c of columns) {
      const d = alongDist(point, c.x, c.z, c.angle);
      if (d > 1.6) continue;
      const fall = Math.pow(Math.cos((Math.PI / 2) * d / 1.6), 2);
      const a = across(c.angle);
      const away = -Math.sign(normal.x * a.x + normal.z * a.z);
      const room = 0.55 - Math.abs(c.push);
      const amount = Math.max(0, Math.min(room, 0.05 * speed * fall));
      c.push += away * amount;
      for (const t of c.tyres) {
        const loose = 0.5 + t.level * 0.35;                          // higher tyres get knocked about more
        t.jx += (Math.random() - 0.5) * 0.1 * amount * loose;
        t.jz += (Math.random() - 0.5) * 0.1 * amount * loose;
        t.tilt = Math.min(0.5, t.tilt + Math.random() * 0.3 * amount * loose);
      }
      colBox(c);
    }
    spots.forEach((t, i) => {
      const a = across(t.col.angle);
      const row = Math.hypot(t.x - t.col.x, t.z - t.col.z) > 0.1 ? 0.6 : 1;   // the back row moves less
      const shift = t.col.push * row;
      q.setFromAxisAngle(UP, t.spin).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.sin(t.col.angle), 0, Math.cos(t.col.angle)), t.tilt * Math.sign(t.col.push || 1)));
      tyres.setMatrixAt(i, m4.compose(pos.set(t.x + a.x * shift + t.jx, t.y, t.z + a.z * shift + t.jz), q, scl.set(1, 1.15 * (1 - Math.abs(shift) * 0.25 * row), 1)));
    });
    tyres.instanceMatrix.needsUpdate = true;
    return { absorb: 0.7 };
  };
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - R, 0, Math.min(az, bz) - R,
    Math.max(ax, bx) + R + STEP, HIGH * 0.22, Math.max(az, bz) + R + STEP, 0.2));
}

// Catch fence: tall posts every 3 m with chain-link mesh between them, and
// a top section that leans in over the track. The mesh is one continuous
// sheet per run with points every 25 cm along and 30 cm up, so a hit caves
// it in just where the car struck: deepest at car height, fading out above
// and to the sides, and wider and deeper for harder hits. The mesh stays
// tied to the posts; a post leans over only as much as the mesh pulls on
// it, and the leaning top section and its arms move with the posts and the
// top of the mesh. Each run is [ax, az, bx, bz, lean]: lean = which side
// the track is on (+1 = left of someone walking from a to b).
function buildFences(scene, runs) {
  const H = 3.6, POST = 3, SP = 0.25, ROW = 0.3;
  const TOP = 1.1, TILT = 0.75, TOP_ROWS = 4;        // the top section: 1.1 m long, ~43 degrees in
  const ROWS = Math.round(H / ROW) + 1;              // points up the main mesh
  const tex = canvasTexture(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,205,210,0.95)';
    g.lineWidth = 2;
    g.beginPath();                                  // diamond chain-link
    g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath();
    g.stroke();
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const list = runs.map(([ax, az, bx, bz, lean = 1]) => Object.assign(makeRun(ax, az, bx, bz, SP), { lean }));
  let verts = 0, topVerts = 0, posts = 0;
  for (const r of list) {
    r.v0 = verts; verts += r.n * ROWS;
    r.t0 = topVerts; topVerts += r.n * TOP_ROWS;
    r.raw = new Float32Array(r.n * ROWS);           // how far each point has been pushed (before the posts hold it)
    const every = Math.max(1, Math.round(POST / r.ds));
    r.posts = [];
    for (let i = 0; i < r.n; i += every) r.posts.push({ i, k: posts++, lean: 0 });
    if (r.posts[r.posts.length - 1].i !== r.n - 1) r.posts.push({ i: r.n - 1, k: posts++, lean: 0 });
  }
  // Main mesh and the leaning top: grids of points
  const grid = (count, rowsOf, startOf) => {
    const position = new Float32Array(count * 3), uv = new Float32Array(count * 2), index = [];
    for (const r of list) {
      const base = startOf(r), rows = rowsOf;
      for (let i = 0; i < r.n; i++) {
        for (let j = 0; j < rows; j++) {
          const v = base + i * rows + j;
          uv[v * 2] = r.s[i] / 0.12;                   // 12 cm diamonds
          uv[v * 2 + 1] = (rows === ROWS ? j * ROW : j * TOP / (TOP_ROWS - 1)) / 0.12;
          if (i < r.n - 1 && j < rows - 1) index.push(v, v + rows, v + 1, v + 1, v + rows, v + rows + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(index);
    return geo;
  };
  const meshGeo = grid(verts, ROWS, (r) => r.v0);
  const topGeo = grid(topVerts, TOP_ROWS, (r) => r.t0);
  const meshMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
  const sheet = new THREE.Mesh(meshGeo, meshMat);
  const topSheet = new THREE.Mesh(topGeo, meshMat);
  sheet.frustumCulled = topSheet.frustumCulled = false;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.6 });
  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, H + 0.3, 8);
  postGeo.translate(0, (H + 0.3) / 2, 0);            // pivot at the foot, so it leans from the ground
  const postMesh = new THREE.InstancedMesh(postGeo, postMat, posts);
  const armGeo = new THREE.CylinderGeometry(0.04, 0.04, TOP + 0.1, 8);
  armGeo.translate(0, (TOP + 0.1) / 2, 0);           // pivot at the post top
  const arms = new THREE.InstancedMesh(armGeo, postMat, posts);
  postMesh.castShadow = arms.castShadow = true;
  scene.add(sheet, topSheet, postMesh, arms);

  // How far the finished mesh is pushed at station i, row j: tied to the
  // posts (which lean as straight lines from the ground), free to bulge
  // most halfway between them
  const shape = (r, i, y, raw) => {
    let a = r.posts[0], b = r.posts[r.posts.length - 1];
    for (let k = 0; k < r.posts.length - 1; k++) if (i >= r.posts[k].i && i <= r.posts[k + 1].i) { a = r.posts[k]; b = r.posts[k + 1]; break; }
    const t = b.i > a.i ? (i - a.i) / (b.i - a.i) : 0;
    const held = (a.lean + (b.lean - a.lean) * t) * y;    // the line between the two posts
    return held + (raw - held) * Math.sin(Math.PI * t);
  };
  const v3 = new THREE.Vector3(), dir = new THREE.Vector3(), quat = new THREE.Quaternion();
  const draw = (r) => {
    // Posts lean with the mesh pulling on them at about car height
    const at = Math.round(1.0 / ROW);
    for (const p of r.posts) {
      p.lean = Math.max(-0.28, Math.min(0.28, 0.3 * r.raw[p.i * ROWS + at] / 1.0));   // (posts are stiff: they lean a little, the mesh between them bulges)
    }
    const P = meshGeo.attributes.position.array;
    for (let i = 0; i < r.n; i++) {
      const bx = r.ax + r.u.x * r.s[i], bz = r.az + r.u.z * r.s[i];
      for (let j = 0; j < ROWS; j++) {
        const y = j * ROW;
        const d = shape(r, i, y, r.raw[i * ROWS + j]);
        const o = (r.v0 + i * ROWS + j) * 3;
        P[o] = bx + r.a.x * d; P[o + 1] = y; P[o + 2] = bz + r.a.z * d;
      }
      // The leaning top carries on from the top of the mesh, tilted in over the track
      const topD = shape(r, i, H, r.raw[i * ROWS + ROWS - 1]);
      const T = topGeo.attributes.position.array;
      for (let j = 0; j < TOP_ROWS; j++) {
        const t = (j / (TOP_ROWS - 1)) * TOP;
        const out = Math.sin(TILT) * t * r.lean, up = Math.cos(TILT) * t;
        const o = (r.t0 + i * TOP_ROWS + j) * 3;
        T[o] = bx + r.a.x * (topD + out); T[o + 1] = H + up; T[o + 2] = bz + r.a.z * (topD + out);
      }
    }
    for (const p of r.posts) {
      const bx = r.ax + r.u.x * r.s[p.i], bz = r.az + r.u.z * r.s[p.i];
      // the post: from its foot towards (lean across, 1 up)
      dir.set(r.a.x * p.lean, 1, r.a.z * p.lean).normalize();
      quat.setFromUnitVectors(UP, dir);
      postMesh.setMatrixAt(p.k, m4.compose(pos.set(bx, 0, bz), quat, scl.set(1, 1, 1)));
      // the arm: from the post's top, the same tilt as the top mesh
      const topX = bx + r.a.x * p.lean * H, topZ = bz + r.a.z * p.lean * H;
      dir.set(r.a.x * Math.sin(TILT) * r.lean, Math.cos(TILT), r.a.z * Math.sin(TILT) * r.lean).normalize();
      quat.setFromUnitVectors(UP, dir);
      arms.setMatrixAt(p.k, m4.compose(pos.set(topX, H, topZ), quat, scl.set(1, 1, 1)));
    }
    // Hit boxes: half-metre pieces where the mesh now is at car height
    const row = Math.round(0.6 / ROW);
    for (const c of r.boxes) {
      let d = 0;
      for (let i = c.i0; i <= c.i1; i++) {
        const v = shape(r, i, row * ROW, r.raw[i * ROWS + row]);
        if (Math.abs(v) > Math.abs(d)) d = v;
      }
      const sm = (r.s[c.i0] + r.s[c.i1]) / 2;
      pieceBox(c.collider, r.ax + r.u.x * sm + r.a.x * d, r.az + r.u.z * sm + r.a.z * d, r.angle, r.s[c.i1] - r.s[c.i0], 0.12);
    }
  };
  const finish = () => {
    for (const g of [meshGeo, topGeo]) {
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
    }
    postMesh.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
  };
  for (const r of list) {
    r.boxes = [];
    for (let i0 = 0; i0 < r.n - 1; i0 += 2) {
      const c = { i0, i1: Math.min(r.n - 1, i0 + 2) };
      c.collider = addCollider(0, 0, 0, 0, 'fence', { hit: (pt, nrm, v) => caveAt(r, pt, nrm, v) });
      r.boxes.push(c);
    }
    draw(r);
  }
  finish();
  // A hit caves the mesh in around the impact
  const caveAt = (r, point, normal, speed) => {
    if (speed < 1.5) return null;
    const s0 = runPos(r, point);
    const away = -Math.sign(normal.x * r.a.x + normal.z * r.a.z) || 1;
    const push = 0.06 * speed;
    const sigma = 0.7 + 0.02 * speed;
    for (let i = 0; i < r.n; i++) {
      const f = gauss(r.s[i] - s0, sigma);
      if (f < 0.01) continue;
      for (let j = 0; j < ROWS; j++) {
        const y = j * ROW;
        const h = y <= 1.0 ? 1 : gauss(y - 1.0, 0.8);    // car height, fading above
        const k = i * ROWS + j;
        const room = Math.max(0, 1.3 - Math.abs(r.raw[k]));
        r.raw[k] += away * Math.min(room, push * f * h);
      }
    }
    draw(r);
    finish();
    return { absorb: 0.6 };
  };
  // Mesh lets most sound through: only a faint, rattly reflection
  return list.map((r) => {
    const bx = r.ax + r.u.x * r.len, bz = r.az + r.u.z * r.len;
    return box(Math.min(r.ax, bx) - 0.05, 0, Math.min(r.az, bz) - 0.05, Math.max(r.ax, bx) + 0.05, H + 0.8, Math.max(r.az, bz) + 0.05, 0.12);
  });
}

// ---------------------------------------------------------------------
// THE LAYOUT around the test area (the car starts at 0,0 facing +z;
// +x is to its left). Keeps clear of the slalom cones (x = +-1.5,
// z = 25-151), the cone ring (around -40, 40) and the gravel trap.
// ---------------------------------------------------------------------
// For other tracks (sepang.js): start a fresh list of hit boxes and roofs,
// build with the pieces above, then attach the lists to the echo surfaces
export function startScenery() {
  COLLIDERS = [];
  ROOFS = [];
}
export function finishScenery(echoes) {
  echoes.colliders = COLLIDERS;
  echoes.roofs = ROOFS;
  return echoes;
}
export function addRoof(minX, maxX, minZ, maxZ, height) { ROOFS.push({ minX, maxX, minZ, maxZ, height }); }
export { buildGarages, buildOffice, buildConcreteWalls, buildArmco, buildTyreWalls, buildFences, addCollider, canvasTexture, along, box as echoBox };

export function buildScenery(scene) {
  COLLIDERS = [];
  ROOFS = [];
  const echoes = [];
  // Pit garages along the left of the slalom straight, and race control
  // further up on the right
  echoes.push(...buildGarages(scene, 22, 40, 82));
  echoes.push(...buildOffice(scene, -30, 72, -16, 86, 9.5));
  // A concrete wall along the left further up the straight, and Armco on the right
  echoes.push(...buildConcreteWalls(scene, [[10, 95, 10, 141]]));
  echoes.push(...buildArmco(scene, [[-9, 95, -9, 145]]));
  // Behind the gravel trap: a tyre wall, then a catch fence
  echoes.push(...buildTyreWalls(scene, [[-17.2, 5, -17.2, 17]]));
  // (both lean towards +x, over the track side)
  echoes.push(...buildFences(scene, [[-20, 2, -20, 20, 1], [-11, 95, -11, 145, 1]]));
  echoes.colliders = COLLIDERS;
  echoes.roofs = ROOFS;
  return echoes;
}
