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
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 3;

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
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - T / 2, 0, Math.min(az, bz) - T / 2,
    Math.max(ax, bx) + T / 2, H, Math.max(az, bz) + T / 2, 0.55));
}

// Armco: two W-profile steel rails on posts every 2 m
function buildArmco(scene, runs) {
  const STEP = 2;
  const posts = runs.flatMap(([ax, az, bx, bz]) => along(ax, az, bx, bz, STEP));
  const rails = runs.flatMap(([ax, az, bx, bz]) => along(ax, az, bx, bz, STEP).slice(0, -1).map((p, i, arr) => {
    const t = (i + 0.5) / arr.length;
    return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, angle: p.angle, len: p.len };
  }));
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c6, roughness: 0.35, metalness: 0.8 });
  const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.6, metalness: 0.5 }), posts.length);
  posts.forEach((p, i) => {
    q.setFromAxisAngle(UP, p.angle);
    postMesh.setMatrixAt(i, m4.compose(pos.set(p.x, 0.425, p.z), q, scl.set(1, 1, 1)));
  });
  // The W profile: three thin strips at slight angles make it catch the light
  const railGeo = new THREE.BoxGeometry(0.04, 0.31, STEP);
  const railMesh = new THREE.InstancedMesh(railGeo, steel, rails.length * 2);
  rails.forEach((p, i) => {
    q.setFromAxisAngle(UP, p.angle);
    for (const [k, y] of [[0, 0.55], [1, 0.82]]) {
      railMesh.setMatrixAt(i * 2 + k, m4.compose(pos.set(p.x, y, p.z), q, scl.set(1, 1, p.len / STEP)));
    }
  });
  postMesh.castShadow = railMesh.castShadow = true;
  scene.add(postMesh, railMesh);
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - 0.1, 0, Math.min(az, bz) - 0.1,
    Math.max(ax, bx) + 0.1, 1, Math.max(az, bz) + 0.1, 0.35));
}

// Tyre barrier: stacks of old tyres, bolted together, with a belt of
// conveyor rubber across the front (here: the stacks, 4 high, 2 deep)
function buildTyreWalls(scene, runs) {
  const R = 0.32, STEP = 0.62, HIGH = 4, ROWS = 2;
  const spots = runs.flatMap(([ax, az, bx, bz]) => {
    const pts = along(ax, az, bx, bz, STEP);
    const out = [];
    for (const p of pts) {
      const lx = Math.cos(p.angle), lz = -Math.sin(p.angle);   // across the run
      for (let row = 0; row < ROWS; row++) {
        for (let level = 0; level < HIGH; level++) {
          out.push({ x: p.x + lx * row * STEP, z: p.z + lz * row * STEP, y: 0.11 + level * 0.22 });
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
    q.setFromAxisAngle(UP, Math.random() * Math.PI);
    tyres.setMatrixAt(i, m4.compose(pos.set(s.x, s.y, s.z), q, scl.set(1, 1.15, 1)));
    // Some old tyres are painted white or red, like at real tracks
    const r = Math.random();
    tyres.setColorAt(i, shade.set(r < 0.12 ? 0xe9e6df : r < 0.2 ? 0xb42a24 : 0x2a2a2c));
  });
  tyres.castShadow = tyres.receiveShadow = true;
  scene.add(tyres);
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - R, 0, Math.min(az, bz) - R,
    Math.max(ax, bx) + R + STEP, HIGH * 0.22, Math.max(az, bz) + R + STEP, 0.2));
}

// Catch fence: tall steel posts with chain-link mesh between them, and a
// section at the top that leans in over the track (like the debris fences
// at street circuits such as Singapore). Each run is [ax, az, bx, bz, lean]:
// lean = which side of the fence the track is on, so the top leans over it.
// +1 = to the left of someone walking from a to b (towards +x for a run
// along +z), -1 = to their right.
function buildFences(scene, runs) {
  const H = 3.6, STEP = 3;
  const TOP = 1.1, TILT = 0.75;                     // the top section: 1.1 m long, ~43 degrees in
  const mesh = canvasTexture(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,205,210,0.95)';
    g.lineWidth = 2;
    g.beginPath();                                  // diamond chain-link
    g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath();
    g.stroke();
  });
  const panels = [];
  const posts = [];
  for (const [ax, az, bx, bz, lean = 1] of runs) {
    const pts = along(ax, az, bx, bz, STEP);
    posts.push(...pts.map((p) => ({ ...p, lean })));
    pts.slice(0, -1).forEach((p, i) => {
      const n = pts[i + 1];
      panels.push({ x: (p.x + n.x) / 2, z: (p.z + n.z) / 2, angle: p.angle, len: p.len, lean });
    });
  }
  // The leaning top: tipped about the line of the fence, towards the track
  const tilted = new THREE.Quaternion();
  const tilt = new THREE.Quaternion();
  const ACROSS = new THREE.Vector3(1, 0, 0);
  const topPose = (angle, lean) => {
    tilted.setFromAxisAngle(UP, angle + Math.PI / 2);
    tilt.setFromAxisAngle(ACROSS, TILT * lean);
    return tilted.multiply(tilt);
  };
  // Where the middle of the top section sits, relative to the top of a post
  const topOffset = (angle, lean) => {
    const out = Math.sin(TILT) * TOP / 2 * lean;     // across, towards the track
    return { x: Math.cos(angle) * out, y: H + Math.cos(TILT) * TOP / 2, z: -Math.sin(angle) * out };
  };
  mesh.repeat.set(STEP / 0.12, H / 0.12);          // 12 cm diamonds
  const panelMesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, H),
    new THREE.MeshStandardMaterial({ map: mesh, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }),
    panels.length
  );
  panels.forEach((p, i) => {
    q.setFromAxisAngle(UP, p.angle + Math.PI / 2);   // the plane faces across the run
    panelMesh.setMatrixAt(i, m4.compose(pos.set(p.x, H / 2, p.z), q, scl.set(p.len, 1, 1)));
  });
  const postMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.05, H + 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.6 }),
    posts.length
  );
  posts.forEach((p, i) => postMesh.setMatrixAt(i, m4.compose(pos.set(p.x, (H + 0.3) / 2, p.z), q.identity(), scl.set(1, 1, 1))));
  postMesh.castShadow = true;

  // The leaning top section: mesh panels plus an angled arm on every post
  const topMeshTex = mesh.clone();
  topMeshTex.needsUpdate = true;
  topMeshTex.repeat.set(STEP / 0.12, TOP / 0.12);
  const topPanels = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, TOP),
    new THREE.MeshStandardMaterial({ map: topMeshTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }),
    panels.length
  );
  panels.forEach((p, i) => {
    const o = topOffset(p.angle, p.lean);
    topPanels.setMatrixAt(i, m4.compose(pos.set(p.x + o.x, o.y, p.z + o.z), topPose(p.angle, p.lean), scl.set(p.len, 1, 1)));
  });
  const arms = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.04, 0.04, TOP + 0.1, 8),
    postMesh.material,
    posts.length
  );
  posts.forEach((p, i) => {
    const o = topOffset(p.angle, p.lean);
    arms.setMatrixAt(i, m4.compose(pos.set(p.x + o.x, o.y, p.z + o.z), topPose(p.angle, p.lean), scl.set(1, 1, 1)));
  });
  arms.castShadow = true;
  scene.add(panelMesh, postMesh, topPanels, arms);
  // Mesh lets most sound through: only a faint, rattly reflection
  return runs.map(([ax, az, bx, bz]) => box(Math.min(ax, bx) - 0.05, 0, Math.min(az, bz) - 0.05,
    Math.max(ax, bx) + 0.05, H + 0.8, Math.max(az, bz) + 0.05, 0.12));
}

// ---------------------------------------------------------------------
// THE LAYOUT around the test area (the car starts at 0,0 facing +z;
// +x is to its left). Keeps clear of the slalom cones (x = +-1.5,
// z = 25-151), the cone ring (around -40, 40) and the gravel trap.
// ---------------------------------------------------------------------
export function buildScenery(scene) {
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
  return echoes;
}
