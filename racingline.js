// THE RACING LINE (Sepang): the fastest way round, like the driving line
// in Gran Turismo.
//
// 1. The line: starting from the middle of the track, it's pulled tight
//    over and over (each point moved towards the average of its
//    neighbours), staying inside the track edges with room for the car.
//    That straightens it out as much as the track allows: wide on the way
//    into a corner, clipping the inside at the apex, wide on the way out.
// 2. The speeds: how fast you can go round each bit of the line is set by
//    how tight it is and how much grip the tyres have. Then going forwards,
//    the car can only speed up as fast as the engine allows; going
//    backwards from each corner, it can only slow down as fast as the
//    brakes and tyres allow. Where those two meet is where you have to
//    start braking.
// 3. What you see: a yellow dotted line along it, with a red zone where to
//    brake. The braking zone ahead of you moves with YOUR speed: come in
//    faster than planned and it starts earlier, slower and it starts later
//    (or vanishes). Distance boards (150, 100, 50 m) stand before the big
//    stops, and a corner panel at the top of the screen shows the next
//    corner (which way and how sharp, its number, how far, the gear and
//    speed to take it at).
// 4. Old rubber: a race weekend's worth of black tyre marks laid down where
//    everyone brakes and turns in, and through the corners along the line.
//    Rubbered-in track grips a little better. Rain washes it away.
import * as THREE from 'three';

export const BUILD = 6;

const G = 9.81;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// A canvas texture
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// A flat ribbon along a path of points: { x, z, nx, nz } (n = left), from
// lateral offset a to b, at height y. Returns geometry with uv.x across and
// uv.y = metres along / uvLen; colours (rgba) one per point, two vertices each.
function ribbon(pts, a, b, y, uvLen, closed = true) {
  const n = pts.length + (closed ? 1 : 0);
  const pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), col = new Float32Array(n * 8);
  const index = [];
  let s = 0;
  for (let k = 0; k < n; k++) {
    const p = pts[k % pts.length];
    if (k > 0) { const q = pts[(k - 1) % pts.length]; s += Math.hypot(p.x - q.x, p.z - q.z); }
    const aa = typeof a === 'function' ? a(p, k) : a, bb = typeof b === 'function' ? b(p, k) : b;
    pos.set([p.x + p.nx * aa, y, p.z + p.nz * aa, p.x + p.nx * bb, y, p.z + p.nz * bb], k * 6);
    uv.set([0, s / uvLen, 1, s / uvLen], k * 4);
    col.set([1, 1, 1, 1, 1, 1, 1, 1], k * 8);
    if (k < n - 1) { const i = k * 2; index.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(index);
  g.computeVertexNormals?.();
  return g;
}

// Join many ribbons into one shape (one draw for all of them)
function mergeRibbons(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 4);
  const index = new Uint32Array(ni);
  let v = 0, i = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, v * 3);
    uv.set(g.attributes.uv.array, v * 2);
    col.set(g.attributes.color.array, v * 4);
    const src = g.index.array;
    for (let k = 0; k < src.length; k++) index[i + k] = src[k] + v;
    v += g.attributes.position.count; i += src.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 4));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  out.computeVertexNormals?.();
  return out;
}

export class RacingLine {
  // track: { line (centre points, 2 m apart, in driving order), corners,
  // halfWidth(p) }. car: the physics spec (for the engine and gears).
  constructor(scene, { line, corners, car, isMobile = false }) {
    this.scene = scene;
    this.car = car;
    this.isMobile = isMobile;
    const m = line.length;
    this.m = m;

    // --- 1. The line: pull it tight inside the track ---
    const margin = 1.5;                                  // half the car and a bit
    const room = line.map((p) => Math.max(0.5, p.width / 2 - margin));
    const off = new Float64Array(m);
    const P = (i) => { const p = line[(i + m) % m]; const o = off[(i + m) % m]; return [p.x + p.lx * o, p.z + p.lz * o]; };
    // Each pass moves every point to where it would make the line bend as
    // evenly as possible with its neighbours (two either side), which is
    // what makes a racing line: the least, smoothest turning, so the highest
    // speeds. (Pulling it tight instead would just hug the insides.) Long
    // strides first so whole corners settle, then short ones for detail.
    const LX = Float64Array.from(line, (p) => p.lx), LZ = Float64Array.from(line, (p) => p.lz);
    const BX = Float64Array.from(line, (p) => p.x), BZ = Float64Array.from(line, (p) => p.z);
    const px = (i) => BX[i] + LX[i] * off[i], pz = (i) => BZ[i] + LZ[i] * off[i];
    for (let it = 0; it < 3000; it++) {
      const k = it < 1200 ? 8 : it < 2200 ? 3 : 1;
      for (let i = 0; i < m; i++) {
        const a2 = (i - 2 * k + 2 * m) % m, a1 = (i - k + m) % m, b1 = (i + k) % m, b2 = (i + 2 * k) % m;
        const tx = (4 * (px(a1) + px(b1)) - (px(a2) + px(b2))) / 6 - px(i);
        const tz = (4 * (pz(a1) + pz(b1)) - (pz(a2) + pz(b2))) / 6 - pz(i);
        const o = off[i] + 0.5 * (tx * LX[i] + tz * LZ[i]);
        off[i] = o < -room[i] ? -room[i] : o > room[i] ? room[i] : o;
      }
    }
    // points, directions and left normals along it
    this.pts = [];
    for (let i = 0; i < m; i++) { const [x, z] = P(i); this.pts.push({ x, z, i, off: off[i] }); }
    for (let i = 0; i < m; i++) {
      const a = this.pts[(i - 1 + m) % m], b = this.pts[(i + 1) % m], p = this.pts[i];
      const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      p.fx = dx / l; p.fz = dz / l;
      p.nx = p.fz; p.nz = -p.fx;                         // left
      p.ds = Math.hypot(b.x - p.x, b.z - p.z) || 2;      // (forward step, roughly)
    }
    // how tight it is: the circle through points 6 either side (12 m),
    // then smoothed over 20 m (so small kinks don't look like hairpins)
    for (let i = 0; i < m; i++) {
      const a = this.pts[(i - 6 + m) % m], b = this.pts[i], c = this.pts[(i + 6) % m];
      const ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z), ca = Math.hypot(a.x - c.x, a.z - c.z);
      const cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      b.curve = (ab * bc * ca) > 1e-6 ? (2 * cross) / (ab * bc * ca) : 0;     // 1/radius (signed)
    }
    const raw = this.pts.map((p) => p.curve);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let k = -5; k <= 5; k++) sum += raw[(i + k + m) % m];
      this.pts[i].curve = sum / 11;
    }
    for (let i = 0; i < m; i++) this.pts[i].s = i === 0 ? 0 : this.pts[i - 1].s + Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].z - this.pts[i - 1].z);
    this.length = this.pts[m - 1].s + Math.hypot(this.pts[0].x - this.pts[m - 1].x, this.pts[0].z - this.pts[m - 1].z);

    // Corners, numbered in driving order from the start line (T1, T2 ...)
    this.corners = corners.map((c) => ({ ...c, apexRaw: c.apex, apex: ((c.apex % m) + m) % m }))
      .sort((p, q) => p.apex - q.apex)
      .map((c, k) => {
        let turn = 0;                                     // how far it turns, in total (radians)
        for (let i = c.a; i <= c.b; i++) { const p = this.pts[((i % m) + m) % m]; turn += p.curve * p.ds; }
        return { ...c, number: c.number ?? k + 1, turn };
      });

    // --- 2. Speeds (worked out again whenever the grip changes) ---
    this.vMax = new Float64Array(m);
    this.vPlan = new Float64Array(m);
    this.brakeHard = new Float64Array(m);                // 0-1: how hard to brake here (plan)
    this.grip = 0;
    this.plan(1.3);

    // --- 3. What you see ---
    // the dotted yellow line (bright at night too), with each point's colour set every frame
    const dash = canvasTex(32, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#fff';
      g.fillRect(4, 0, w - 8, h * 0.58);
    });
    this.lineGeo = ribbon(this.pts, -0.11, 0.11, 0.004, 2.2);
    this.lineMat = new THREE.MeshBasicMaterial({ map: dash, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    this.lineMesh = new THREE.Mesh(this.lineGeo, this.lineMat);
    this.lineMesh.renderOrder = 3;
    scene.add(this.lineMesh);
    // the red braking zone under it: a wide soft band
    const soft = canvasTex(64, 8, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.9)');
      gr.addColorStop(0.75, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    this.zoneGeo = ribbon(this.pts, -1.7, 1.7, 0.0035, 8);
    this.zoneMat = new THREE.MeshBasicMaterial({ map: soft, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.zoneMesh = new THREE.Mesh(this.zoneGeo, this.zoneMat);
    this.zoneMesh.renderOrder = 2;
    scene.add(this.zoneMesh);
    this.paintStatic();

    // brake boards before the big stops, and the corner panel
    this.buildBoards(line);
    this.panel = new CornerPanel();

    // --- 4. Old rubber ---
    this.rubberGrid = new Map();       // 2 m squares -> how rubbered-in (0-1)
    this.washLeft = 1;                 // 1 = all there, 0 = washed away by rain
    this.buildRubber();

    this.visible = true;
    this.near = 0;                     // the car's place on the line
  }

  // The fastest speed at each point for this much grip (g), then braking
  // and accelerating limits
  plan(grip) {
    if (Math.abs(grip - this.grip) < 0.02) return;
    this.grip = grip;
    this.speedsFor(this.car, grip, this.vPlan, this.vMax, this.brakeHard);
    if (this.zoneGeo) this.paintStatic();
  }
  // A different car (a faster one is planned faster, braking later)
  setCar(car) { this.car = car; this.grip = -1; }

  // The speeds a car could do round the line: as fast as its grip allows
  // in each corner (more with its downforce, the faster it goes), as fast
  // as its engine accelerates between them, braking just in time.
  // Writes v (the plan), vMax (each corner's limit) and brakeHard.
  speedsFor(car, grip, v = new Float32Array(this.m), vMax = new Float32Array(this.m), brakeHard = new Float32Array(this.m)) {
    const m = this.m, pts = this.pts;
    const mass = car.mass + 70;                            // (and a driver)
    // its power at the wheels (roughly: its peak, less losses)
    let peakW = 150000;
    if (car.torqueCurve) { peakW = 0; for (const [rpm, nm] of car.torqueCurve) peakW = Math.max(peakW, nm * rpm * Math.PI / 30); peakW *= 0.88; }
    const df = (car.downforce || 0) / mass;                // extra grip per (m/s)², per kg
    const vCap = Math.min(100, Math.cbrt(peakW / Math.max(0.2, car.drag)));
    const gripAt = (vv) => grip * (G + df * vv * vv);     // how hard it can corner or brake (m/s²) at a speed
    for (let i = 0; i < m; i++) {
      const c = Math.max(1e-4, Math.abs(pts[i].curve));
      const den = c - grip * df;
      vMax[i] = den > 1e-6 ? Math.min(vCap, Math.sqrt(grip * G / den)) : vCap;
    }
    for (let i = 0; i < m; i++) v[i] = vMax[i];
    for (let pass = 0; pass < 3; pass++) {
      // accelerating: as fast as the engine (and grip) allows
      for (let k = 1; k <= m; k++) {
        const i = k % m, j = k - 1;
        const vj = v[j];
        const lat = vj * vj * Math.abs(pts[j].curve);
        const gripLeft = Math.sqrt(Math.max(0, gripAt(vj) ** 2 - lat * lat));
        const engine = peakW / (mass * Math.max(vj, 4)) - (car.drag * vj * vj) / mass;
        const a = Math.max(0, Math.min(gripLeft, engine));
        v[i] = Math.min(v[i], Math.sqrt(vj * vj + 2 * a * pts[j].ds));
      }
      // braking: work backwards from each corner
      for (let k = m - 1; k >= 0; k--) {
        const i = k, j = (k + 1) % m;
        const vj = v[j];
        const lat = vj * vj * Math.abs(pts[j].curve);
        const brake = Math.sqrt(Math.max(0, (1.15 * gripAt(vj)) ** 2 - lat * lat)) + (car.drag * vj * vj) / mass;
        v[i] = Math.min(v[i], Math.sqrt(vj * vj + 2 * brake * pts[i].ds));
      }
    }
    // where the plan brakes: speed dropping from here to the next point
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      const decel = (v[i] * v[i] - v[j] * v[j]) / (2 * pts[i].ds);
      brakeHard[i] = decel > 2 ? clamp(decel / (1.1 * gripAt(v[i])), 0, 1) : 0;
    }
    // (ignore little lifts shorter than 10 m: they're not real braking zones)
    for (let i = 0; i < m; i++) {
      if (brakeHard[i] > 0 && brakeHard[(i - 1 + m) % m] === 0) {
        let n = 0;
        while (n < m && brakeHard[(i + n) % m] > 0) n++;
        if (n < 5) for (let k = 0; k < n; k++) brakeHard[(i + k) % m] = 0;
      }
    }
    return { v, vMax, brakeHard };
  }

  // Colour the whole line from the plan (the stretch ahead of the car is
  // painted again every frame from its real speed)
  paintStatic() {
    const lc = this.lineGeo.attributes.color, zc = this.zoneGeo.attributes.color;
    if (!lc?.array || !zc?.array) return;
    const m = this.m;
    for (let k = 0; k <= m; k++) this.paintPoint(k, 0);
    // each braking run of the plan gets a zone
    for (let i = 0; i < m; i++) {
      if (this.brakeHard[i] > 0 && this.brakeHard[(i - 1 + m) % m] === 0) {
        let n = 0;
        while (n < m && this.brakeHard[(i + n) % m] > 0) n++;
        this.paintZone(i, n, true, false);
      }
    }
    // (remembered, to put back where the car's own zones were painted)
    this.staticZone = Float32Array.from({ length: m }, (_, i) => zc.array[i * 8 + 3]);
    lc.needsUpdate = true; zc.needsUpdate = true;
  }

  // Like Gran Turismo: the line itself always stays the same yellow; the
  // braking zone is its own red patch on the track, starting with a bright
  // red bar where to hit the brakes, then fading out towards the corner.
  paintPoint(k, zoneAlpha) {
    const lc = this.lineGeo.attributes.color.array, zc = this.zoneGeo.attributes.color.array;
    const line = [1, 0.84, 0.16, 0.95, 1, 0.84, 0.16, 0.95];
    const zone = [0.95, 0.12, 0.08, zoneAlpha, 0.95, 0.12, 0.08, zoneAlpha];
    lc.set(line, k * 8);
    zc.set(zone, k * 8);
    if (k === 0) { lc.set(line, this.m * 8); zc.set(zone, this.m * 8); }
  }

  // A braking zone from point `from`, n points long. withStart: draw the
  // bright bar at its start (not when the car is already inside it).
  paintZone(from, n, withStart, live = true) {
    const m = this.m;
    for (let r = 0; r < n; r++) {
      const t = n > 1 ? r / (n - 1) : 1;
      let a = 0.42 - 0.28 * t;                          // fades towards the corner
      if (withStart && r < 1) a = 0.9;                  // the brake point
      if (r >= n - 2) a *= 0.5;                         // soft end
      const i = (from + r) % m;
      this.paintPoint(i, a);
      if (live) this.dynamicPainted?.add(i);
    }
  }

  // Distance boards: 150, 100 and 50 m before the turn-in of each big stop,
  // on the outside of the approach
  buildBoards(line) {
    const m = this.m;
    const boards = { 150: [], 100: [], 50: [] };
    for (const c of this.corners) {
      // find where the plan's braking for this corner ends (the slowest point) and how much speed it loses
      let lo = ((c.apex % m) + m) % m;
      let hi = lo;
      for (let k = 1; k < 200; k++) { const i = (lo - k + m) % m; if (this.vPlan[i] >= this.vPlan[hi]) hi = i; else if (this.vPlan[i] < this.vPlan[hi] - 1) break; }
      const drop = this.vPlan[hi] - this.vPlan[lo];
      if (drop < 12) continue;                              // not a big stop
      const turnIn = (((c.a % m) + m) % m);
      for (const dist of [150, 100, 50]) {
        const i = (turnIn - Math.round(dist / 2) + m) % m;
        const p = line[i];
        const o = -c.side * (p.width / 2 + 3.5);            // outside of the coming corner
        boards[dist].push({ x: p.x + p.lx * o, z: p.z + p.lz * o, heading: p.heading });
      }
    }
    const post = new THREE.MeshStandardMaterial({ color: 0x9a9da1, metalness: 0.6, roughness: 0.4 });
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6);
    postGeo.translate(0, 0.7, 0);
    const boardGeo = new THREE.BoxGeometry(0.9, 0.6, 0.04);
    boardGeo.translate(0, 1.6, 0);
    const allPosts = Object.values(boards).flat();
    const posts = new THREE.InstancedMesh(postGeo, post, Math.max(1, allPosts.length * 2));
    let n = 0;
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
    for (const [dist, list] of Object.entries(boards)) {
      const tex = canvasTex(128, 84, (g, w, h) => {
        g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
        g.fillStyle = '#111'; g.font = 'bold 54px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(dist, w / 2, h / 2 + 3);
      });
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const mats = [post, post, post, post, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })];
      const mesh = new THREE.InstancedMesh(boardGeo, mats, Math.max(1, list.length));
      list.forEach((b, k) => {
        // facing the oncoming cars
        q.setFromAxisAngle(up, b.heading + Math.PI);
        mtx.compose(new THREE.Vector3(b.x, 0, b.z), q, one);
        mesh.setMatrixAt(k, mtx);
        for (const dx of [-0.35, 0.35]) {
          const side = new THREE.Vector3(dx, 0, 0).applyQuaternion(q);
          mtx.compose(new THREE.Vector3(b.x + side.x, 0, b.z + side.z), q, one);
          posts.setMatrixAt(n++, mtx);
        }
      });
      mesh.count = list.length;
      mesh.castShadow = true;
      this.scene.add(mesh);
    }
    posts.count = n;
    posts.castShadow = true;
    this.scene.add(posts);
    this.boardCount = allPosts.length;
  }

  // Old rubber: streaks from many cars, two per car (the left and right
  // wheels), wandering a little either side of the racing line, from where
  // they brake to the corner exit. Darkest where they brake (black lines),
  // fainter through the corner.
  buildRubber() {
    const m = this.m, pts = this.pts, rand = seeded(2024);
    const streakTex = canvasTex(32, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let k = 0; k < 40; k++) {                 // fine lengthwise streaks
        const x = rand() * w, a = 0.25 + rand() * 0.6;
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.fillRect(x, 0, 1 + rand() * 3, h);
      }
      g.globalCompositeOperation = 'destination-in';  // soft edges
      const gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, 'rgba(0,0,0,1)'); gr.addColorStop(0.7, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    this.rubberMat = new THREE.MeshBasicMaterial({ color: 0x26272a,   // worn-in grey-black, not ink
      map: streakTex, alphaMap: null, vertexColors: true, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    // (the streak texture's brightness is used as its see-through-ness)
    this.rubberMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWash = this.washUniform = { value: 1 };
      shader.fragmentShader = 'uniform float uWash;\n' + shader.fragmentShader.replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 streak = texture2D( map, vMapUv );
          diffuseColor.a *= streak.r * uWash;
        #endif`);
    };
    const cars = this.isMobile ? 6 : 10;
    const strips = [];
    const add = (i0, i1, strength) => {
      // one strip per wheel per car
      for (let car = 0; car < cars; car++) {
        const wander = (rand() - 0.5) * 1.2, wobble = rand() * 6, len = i1 - i0;
        const lateStart = Math.floor(rand() * len * 0.25);     // some brake later than others
        for (const side of [-0.68, 0.68]) {
          const seg = [];
          for (let k = i0 + lateStart; k <= i1; k++) seg.push(pts[((k % m) + m) % m]);
          if (seg.length < 3) continue;
          const w = 0.07 + rand() * 0.05;                     // (half-width: thin streaks)
          const g = ribbon(seg, (p, k) => side + wander + 0.25 * Math.sin(k * 0.05 + wobble) - w, (p, k) => side + wander + 0.25 * Math.sin(k * 0.05 + wobble) + w, 0.0012, 6, false);
          const c = g.attributes.color;
          if (c?.array) {
            for (let k = 0; k < seg.length; k++) {
              const t = k / (seg.length - 1);
              const fade = Math.min(1, t * 6, (1 - t) * 4);                // fade in and out at the ends
              const a = strength(k + i0 + lateStart) * fade * (0.08 + 0.14 * rand());   // faded: you see them where many overlap
              c.array.set([1, 1, 1, a, 1, 1, 1, a], k * 8);
              // remember how rubbered-in this bit of track is
              const p = seg[k];
              for (const o of [side + wander - 0.2, side + wander + 0.2]) {
                const key = `${Math.floor((p.x + p.nx * o) / 2)},${Math.floor((p.z + p.nz * o) / 2)}`;
                this.rubberGrid.set(key, Math.min(1, (this.rubberGrid.get(key) || 0) + a * 0.8));   // (the grip stays the same however faint they look)
              }
            }
          }
          strips.push(g);
        }
      }
    };
    for (const c of this.corners) {
      // from where the plan starts braking to a little past the apex
      const apex = ((c.apex % m) + m) % m;
      let start = apex;
      for (let k = 1; k < 220; k++) { const i = (apex - k + m) % m; if (this.brakeHard[i] > 0.05 || this.vPlan[i] < this.vPlan[(i + 1) % m] + 0.2) start = i; else break; }
      const startK = apex - ((apex - start + m) % m);
      const endK = apex + Math.round((c.b - c.apexRaw) * 0.8) + 10;
      add(startK, endK, (k) => {
        const i = ((k % m) + m) % m;
        return 0.35 + 0.65 * this.brakeHard[i];                    // braking: darkest
      });
    }
    if (strips.length && strips[0].index?.array) {
      const mesh = new THREE.Mesh(mergeRibbons(strips), this.rubberMat);
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
  }

  // How much grip the old rubber adds here (1 = none), less as rain washes it off
  rubberGrip(x, z) {
    const r = this.rubberGrid.get(`${Math.floor(x / 2)},${Math.floor(z / 2)}`);
    return r ? 1 + 0.035 * r * this.washLeft : 1;
  }

  setVisible(on) {
    this.visible = on;
    this.lineMesh.visible = this.zoneMesh.visible = on;
    this.panel.setVisible(on);
  }

  // Every frame: the car's position, heading and speed (m/s); the grip
  // (for the speed plan) and how hard it's raining (washes the rubber off)
  update(dt, x, z, heading, speed, grip, rain) {
    // rain washes the old rubber away (a few minutes of heavy rain clears it)
    if (rain > 0.05) this.washLeft = Math.max(0, this.washLeft - rain * dt / 180);
    if (this.washUniform) this.washUniform.value = this.washLeft;
    this.plan(grip);
    if (!this.visible) return;
    const m = this.m, pts = this.pts;
    // where the car is on the line (searched near the last place)
    let best = this.near, bestD = Infinity;
    const span = this.found ? 30 : m;
    for (let k = -span; k <= span; k++) {
      const i = ((this.near + k) % m + m) % m;
      const d = (pts[i].x - x) ** 2 + (pts[i].z - z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (bestD > 60 * 60) this.found = false;              // lost (reset somewhere else): search everywhere next time
    else { this.found = true; this.near = best; }
    // --- The braking zone ahead, from the car's real speed ---
    // Going on at this speed (or speeding up), where would it need to
    // start braking to make the next corners? Red from there.
    const ahead = Math.min(m - 1, 260);
    let v = speed;
    const mass = this.car.mass + 70, g = this.grip;
    if (!this.dynamicPainted) this.dynamicPainted = new Set();
    // (put back the plan's colours where the car's own were painted last frame)
    for (const k of this.dynamicPainted) this.paintPoint(k, this.staticZone ? this.staticZone[k % m] : 0);
    this.dynamicPainted.clear();
    // Speed the car could carry if it keeps its foot down from its real
    // speed; wherever that's more than the plan allows, it has to be
    // braking from there down to the corner's slowest point. Then it carries
    // on from the corner's speed.
    const accelOn = (vv, i) => {
      const engine = 150000 / (mass * Math.max(vv, 4)) - (this.car.drag * vv * vv) / mass;
      return Math.min(61, Math.sqrt(vv * vv + 2 * Math.max(0, engine) * pts[i].ds));
    };
    // Still braking for a stop that's already showing? Keep it showing
    // (without the start bar) until its end, so it doesn't flicker on and
    // off as your speed follows the braking curve.
    let k = 0;
    if (this.latch != null) {
      const remain = (this.latch - best + m) % m;
      if (remain > 0 && remain < 260) {
        this.paintZone(best, remain + 1, false);
        v = this.vPlan[this.latch];
        k = remain + 1;
      } else {
        this.latch = null;
      }
    }
    while (k <= ahead) {
      const i = (best + k) % m;
      // (on the plan's own speed, its braking zone shows as planned)
      if (v > this.vPlan[i] + 0.3 || (this.brakeHard[i] > 0 && v > this.vPlan[i] - 1.5)) {
        let q = k;
        while (q < ahead && this.vPlan[(best + q + 1) % m] <= this.vPlan[(best + q) % m] + 0.05) q++;
        // (a start that's only wobbled a few metres since last frame stays put)
        const end = (best + q) % m;
        this.zoneStart ??= new Map();
        let from = i;
        const was = this.zoneStart.get(end);
        if (was != null && Math.abs(((was - i + m + m / 2) % m) - m / 2) <= 3 && ((end - was + m) % m) <= q) from = was;
        this.zoneStart.set(end, from);
        this.paintZone(from, ((end - from + m) % m) + 1, true);
        if (k <= 2) this.latch = end;                      // reached the brake point: hold this zone
        v = this.vPlan[(best + q) % m];
        k = q + 1;
        continue;
      }
      this.paintPoint(i, 0);
      this.dynamicPainted.add(i);
      v = Math.min(this.vPlan[i] + 40, accelOn(v, i));
      k++;
    }
    this.lineGeo.attributes.color.needsUpdate = true;
    this.zoneGeo.attributes.color.needsUpdate = true;

    // --- The corner panel: the next corner ahead ---
    let next = null, dist = Infinity;
    for (const c of this.corners) {
      const turnIn = ((c.a % m) + m) % m, apex = ((c.apex % m) + m) % m;
      const toTurnIn = ((turnIn - best + m) % m) * 2, toApex = ((apex - best + m) % m) * 2;
      // still coming up (or we're in it, before the apex)
      const d = toApex < toTurnIn ? 0 : toTurnIn;
      if (toApex < 600 && d < dist) { dist = d; next = c; }
    }
    if (next && dist < 450) {
      const apex = ((next.apex % m) + m) % m;
      const vApex = this.vPlan[apex];
      const braking = this.brakeHard[best] > 0.05 || speed > this.vPlan[best] + 0.5;
      this.panel.show({ number: next.number, side: next.side, turn: next.turn, dist, kmh: vApex * 3.6, gear: this.gearFor(vApex), braking });
    } else {
      this.panel.hide();
    }
  }

  // The gear to take a corner in: the highest that still keeps the engine
  // in its strong range (about 4,300 rpm and up) for the drive out
  gearFor(v) {
    const car = this.car, w = v / car.wheelRadius * 60 / (2 * Math.PI);
    for (let g = car.gears.length; g >= 1; g--) {
      const rpm = w * car.gears[g - 1] * car.finalDrive;
      if (rpm >= 4300 && rpm < car.redline * 0.95) return g;
    }
    return 1;
  }
}

// The corner panel at the top of the screen (like Gran Turismo's): an
// arrow bent the way the corner goes (sharper for tighter corners), the
// corner's number, how far away it is, and the gear and speed to take it
// at. It flashes BRAKE in red when you should be braking.
class CornerPanel {
  constructor() {
    const el = document.createElement('div');
    el.id = 'corner-panel';
    el.innerHTML = '<canvas width="120" height="120"></canvas><div class="cp-text"><div class="cp-turn"></div><div class="cp-dist"></div><div class="cp-gear"></div></div>';
    const style = document.createElement('style');
    style.textContent = `
      #corner-panel { position: fixed; top: max(10px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%);
        display: none; align-items: center; gap: 10px; padding: 6px 14px 6px 8px; border-radius: 10px;
        background: rgba(8, 10, 14, 0.62); color: #f2f2f2; font: 600 15px "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
        pointer-events: none; z-index: 30; border: 1.5px solid rgba(255, 210, 60, 0.75); letter-spacing: 0.03em; }
      #corner-panel canvas { width: 54px; height: 54px; }
      #corner-panel .cp-turn { font-size: 21px; color: #ffd23c; line-height: 1; }
      #corner-panel .cp-dist { font-size: 15px; opacity: 0.9; }
      #corner-panel .cp-gear { font-size: 14px; opacity: 0.85; }
      #corner-panel.brake { border-color: #ff3b30; background: rgba(90, 8, 8, 0.7); }
      #corner-panel.brake .cp-turn { color: #ff6b5e; }
      @media (max-width: 700px), (max-height: 500px) {
        #corner-panel { padding: 4px 10px 4px 6px; gap: 6px; font-size: 13px; }
        #corner-panel canvas { width: 40px; height: 40px; }
        #corner-panel .cp-turn { font-size: 17px; }
        #corner-panel .cp-dist, #corner-panel .cp-gear { font-size: 12px; }
      }`;
    document.head.appendChild(style);
    document.body.appendChild(el);
    this.el = el;
    this.cv = el.querySelector('canvas');
    this.turnEl = el.querySelector('.cp-turn');
    this.distEl = el.querySelector('.cp-dist');
    this.gearEl = el.querySelector('.cp-gear');
    this.on = true;
    this.lastKey = '';
  }

  setVisible(on) { this.on = on; if (!on) this.hide(); }
  hide() { if (this.el.style.display !== 'none') this.el.style.display = 'none'; }

  show({ number, side, turn, dist, kmh, gear, braking }) {
    if (!this.on) return;
    if (this.el.style.display !== 'flex') this.el.style.display = 'flex';
    const flash = braking && (performance.now() % 400) < 250;
    this.el.classList.toggle('brake', flash);
    const key = `${number}`;
    if (key !== this.lastKey) { this.lastKey = key; this.drawArrow(side, Math.abs(turn)); }
    this.turnEl.textContent = braking ? `T${number}  BRAKE` : `T${number}`;
    this.distEl.textContent = dist < 5 ? 'now' : `${Math.round(dist / 10) * 10} m`;
    const ord = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'][gear] || `${gear}th`;
    this.gearEl.textContent = `${ord} · ${Math.round(kmh / 5) * 5} km/h`;
  }

  // An arrow that comes up from the bottom and bends round by the corner's angle
  drawArrow(side, turn) {
    const g = this.cv.getContext('2d'), W = 120;
    g.clearRect(0, 0, W, W);
    const ang = Math.min(Math.PI * 0.95, turn);           // how far it bends
    const dir = side > 0 ? -1 : 1;                         // left corners bend left on screen
    const r = 22 + 30 * (1 - ang / Math.PI);               // tighter corners: tighter arc
    g.lineWidth = 11; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#ffd23c'; g.fillStyle = '#ffd23c';
    // straight lead-in, then an arc of `ang`
    const x0 = W / 2 - dir * r * 0.5, y0 = W - 12, y1 = 70;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1);
    const cx = x0 + dir * r, cy = y1;
    const a0 = dir > 0 ? Math.PI : 0;
    const a1 = a0 + (dir > 0 ? ang : -ang);
    g.arc(cx, cy, r, a0, a1, dir < 0);
    g.stroke();
    // the arrow head, pointing along the end of the arc
    const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1);
    const tx = -Math.sin(a1) * (dir > 0 ? 1 : -1), ty = Math.cos(a1) * (dir > 0 ? 1 : -1);
    const hx = ex + tx * 14, hy = ey + ty * 14;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(ex - ty * 13, ey + tx * 13);
    g.lineTo(ex + ty * 13, ey - tx * 13);
    g.closePath(); g.fill();
  }
}

// =====================================================================
// LAP AND SECTOR TIMING. The lap is split into three sectors like the real
// circuit's timing: S1 from the line to the straight between T4 and T5, S2
// on to the straight between T11 and T12, S3 back to the line. The timer
// starts when you first cross the line. Each sector's time shows as you
// finish it: purple for your best ever, yellow if slower. The live gap to
// your best lap shows as you go (green ahead, red behind). Leave the track
// (all four wheels off it, more or less) and the lap is invalid: it's
// still timed but won't count as a best. Bests are remembered.
// =====================================================================
export class LapTimer {
  constructor(racing, { onTrack, storeKey = 'tracktester-sepang-best-v2' }) {
    this.r = racing;
    this.onTrack = onTrack;          // (x, z) -> is that on the track (tarmac or kerb)?
    this.storeKey = storeKey;
    const m = racing.m;
    // the sector lines: midway along the straights after T4 and T11
    const between = (a, b) => {
      const byNo = (n) => racing.corners.filter((c) => c.number === n);
      const ca = byNo(a).pop(), cb = byNo(b)[0];   // (the end of the one, the start of the next)
      if (!ca || !cb) return Math.round(m * (a < 8 ? 0.33 : 0.66));
      const end = ((ca.b % m) + m) % m, start = ((cb.a % m) + m) % m;
      const gap = (start - end + m) % m;
      if (gap > m / 2) return Math.round((start + end) / 2) % m;   // (the two corners run into each other)
      return (end + Math.round(gap / 2)) % m;
    };
    this.cuts = [between(4, 5), between(11, 12), 0];          // where S1, S2 and S3 end
    this.best = { lap: null, sectors: [null, null, null], splits: null };
    try { Object.assign(this.best, JSON.parse(localStorage.getItem(storeKey) || '{}')); } catch (e) { /* storage blocked */ }
    this.running = false;
    this.lap = 0;
    this.t = 0;
    this.sector = 0;
    this.sectorStart = 0;
    this.sectorTimes = [null, null, null];
    this.sectorState = ['', '', ''];
    this.valid = true;
    this.offFor = 0;
    this.last = null;
    this.lastIdx = null;
    this.splits = new Float64Array(Math.ceil(m / 10) + 1).fill(-1);   // time at every 20 m (for the live gap)
    this.flash = 0;
    this.buildPanel();
  }

  buildPanel() {
    // (built piece by piece)
    const make = (tag, cls, parent, text = '') => { const e = document.createElement(tag); e.className = cls; e.textContent = text; parent.appendChild(e); return e; };
    const el = document.createElement('div');
    el.id = 'lap-panel';
    const main = make('div', 'lp-row lp-main', el);
    this.lapEl = make('span', 'lp-lap', main, 'LAP –');
    this.timeEl = make('span', 'lp-time', main, '0:00.000');
    this.deltaEl = make('div', 'lp-row lp-delta', el);
    const secs = make('div', 'lp-sectors', el);
    this.sEls = [1, 2, 3].map((k) => make('span', 'lp-s', secs, `S${k} –`));
    const small = make('div', 'lp-row lp-small', el);
    this.lastEl = make('span', 'lp-last', small, 'LAST –');
    this.bestEl = make('span', 'lp-best', small, 'BEST –');
    const style = document.createElement('style');
    style.textContent = `
      #lap-panel { position: fixed; left: calc(10px + env(safe-area-inset-left)); top: calc(10px + env(safe-area-inset-top));
        min-width: 190px; padding: 6px 10px 7px; border-radius: 9px; background: rgba(8, 10, 14, 0.6); color: #f2f2f2;
        font: 600 14px "Barlow Condensed", "Arial Narrow", Arial, sans-serif; pointer-events: none; z-index: 30; letter-spacing: 0.03em; }
      #lap-panel .lp-row { display: flex; justify-content: space-between; gap: 12px; }
      #lap-panel .lp-main { font-size: 22px; line-height: 1.1; }
      #lap-panel .lp-lap { opacity: 0.75; font-size: 16px; align-self: center; }
      #lap-panel .lp-time { font-variant-numeric: tabular-nums; }
      #lap-panel.invalid .lp-time { color: #9a9a9a; text-decoration: line-through; }
      #lap-panel .lp-delta { font-size: 15px; justify-content: flex-end; min-height: 17px; font-variant-numeric: tabular-nums; }
      #lap-panel .lp-delta.ahead { color: #34d058; }
      #lap-panel .lp-delta.behind { color: #ff5a4e; }
      #lap-panel .lp-sectors { display: flex; gap: 4px; margin: 3px 0; }
      #lap-panel .lp-s { flex: 1; text-align: center; padding: 1px 3px; border-radius: 4px; background: rgba(255,255,255,0.08); font-size: 13px; font-variant-numeric: tabular-nums; }
      #lap-panel .lp-s.purple { background: #8a3ad6; color: #fff; }
      #lap-panel .lp-s.yellow { background: #d8b11c; color: #111; }
      #lap-panel .lp-s.current { outline: 1.5px solid rgba(255,255,255,0.6); }
      #lap-panel .lp-small { font-size: 13px; opacity: 0.85; font-variant-numeric: tabular-nums; }
      @media (max-width: 700px), (max-height: 500px) {
        #lap-panel { top: calc(60px + env(safe-area-inset-top)); min-width: 150px; padding: 4px 8px 5px; font-size: 12px; }
        #lap-panel .lp-main { font-size: 17px; }
        #lap-panel .lp-lap { font-size: 13px; }
        #lap-panel .lp-delta { font-size: 12px; min-height: 14px; }
        #lap-panel .lp-s { font-size: 11px; }
        #lap-panel .lp-small { font-size: 11px; }
      }`;
    document.head.appendChild(style);
    document.body.appendChild(el);
    this.el = el;
  }

  // Back to the start (the car was reset): the lap in progress is dropped
  abort() {
    this.running = false;
    this.lastIdx = null;
    this.sectorTimes = [null, null, null];
    this.sectorState = ['', '', ''];
  }

  save() {
    try { localStorage.setItem(this.storeKey, JSON.stringify({ lap: this.best.lap, sectors: this.best.sectors, splits: this.best.splits })); } catch (e) { /* storage blocked */ }
  }

  // Every frame, after the racing line has found the car (racing.near)
  update(dt, x, z) {
    const m = this.r.m, idx = this.r.near;
    if (this.running) this.t += dt;
    const prev = this.lastIdx;
    this.lastIdx = idx;
    // off the track? (more than half a second with the middle of the car off it)
    if (this.running) {
      this.offFor = this.onTrack(x, z) ? 0 : this.offFor + dt;
      if (this.offFor > 0.5) this.valid = false;
      const slot = Math.floor(idx / 10);
      if (this.splits[slot] < 0) this.splits[slot] = this.t;
    }
    if (prev != null) {
      const step = (idx - prev + m) % m;
      if (step > 0 && step < 60) {                     // moving forwards along the track
        const crossed = (cut) => ((cut - prev + m) % m) > 0 && ((cut - prev + m) % m) <= step;
        // the line: start, or finish a lap
        if (crossed(0)) {
          if (this.running && this.sector === 2) this.finishSector(2, true);
          this.startLap();
        } else if (this.running && this.sector < 2 && crossed(this.cuts[this.sector])) {
          this.finishSector(this.sector, false);
        }
      }
    }
    this.draw();
  }

  startLap() {
    this.running = true;
    this.lap += 1;
    this.t = 0;
    this.sector = 0;
    this.sectorStart = 0;
    this.sectorTimes = [null, null, null];
    this.sectorState = ['', '', ''];
    this.valid = true;
    this.offFor = 0;
    this.splits.fill(-1);
    this.splits[0] = 0;
  }

  finishSector(k, lapDone) {
    const time = this.t - this.sectorStart;
    this.sectorTimes[k] = time;
    const bestS = this.best.sectors[k];
    if (this.valid && (bestS == null || time < bestS)) { this.best.sectors[k] = time; this.sectorState[k] = 'purple'; }
    else this.sectorState[k] = 'yellow';
    this.sectorStart = this.t;
    this.sector = k + 1;
    if (lapDone) {
      this.last = { time: this.t, valid: this.valid };
      if (this.valid && (this.best.lap == null || this.t < this.best.lap)) {
        this.best.lap = this.t;
        this.best.splits = Array.from(this.splits);
      }
      this.save();
      this.flash = 4;      // show the finished lap's sectors for a few seconds
      this.finishedSectors = [...this.sectorTimes];
      this.finishedStates = [...this.sectorState];
    } else {
      this.save();
    }
  }

  draw() {
    const fmt = (t) => t == null ? '–' : `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, '0')}`;
    const short = (t) => t == null ? '–' : t < 60 ? t.toFixed(2) : fmt(t);
    this.flash = Math.max(0, this.flash - 1 / 60);
    const showDone = this.flash > 0 && this.finishedSectors;
    this.lapEl.textContent = this.running ? `LAP ${this.lap}` : 'OUT LAP';
    this.timeEl.textContent = this.running ? fmt(this.t) : '–:––.–––';
    this.el.classList.toggle('invalid', this.running && !this.valid);
    // the gap to the best lap at this point
    const slot = Math.floor(this.r.near / 10);
    const ref = this.best.splits?.[slot];
    if (this.running && ref != null && ref >= 0 && this.splits[slot] >= 0) {
      const d = this.splits[slot] - ref;
      this.deltaEl.textContent = `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}`;
      this.deltaEl.className = `lp-row lp-delta ${d < 0 ? 'ahead' : 'behind'}`;
    } else {
      this.deltaEl.textContent = '';
    }
    for (let k = 0; k < 3; k++) {
      const t = showDone ? this.finishedSectors[k] : this.sectorTimes[k];
      const st = showDone ? this.finishedStates[k] : this.sectorState[k];
      const txt = `S${k + 1} ${short(t)}`;
      if (this.sEls[k].textContent !== txt) this.sEls[k].textContent = txt;
      this.sEls[k].className = `lp-s ${st}${!showDone && this.running && this.sector === k ? ' current' : ''}`;
    }
    this.lastEl.textContent = `LAST ${this.last ? fmt(this.last.time) + (this.last.valid ? '' : '*') : '–'}`;
    this.bestEl.textContent = `BEST ${fmt(this.best.lap)}`;
  }
}

// =====================================================================
// TRACK MAP in the corner: the whole circuit from above (north up), the
// three sectors in slightly different shades, the start line, and a dot
// for the car (with a little arrow showing which way it's going).
// =====================================================================
export class TrackMap {
  constructor(racing, cuts) {
    this.r = racing;
    const cv = document.createElement('canvas');
    cv.id = 'track-map';
    const style = document.createElement('style');
    style.textContent = `
      #track-map { position: fixed; right: calc(10px + env(safe-area-inset-right)); top: calc(36px + env(safe-area-inset-top));
        width: 124px; height: 124px; pointer-events: none; z-index: 30; border-radius: 10px; background: rgba(8, 10, 14, 0.45); }
      @media (max-width: 700px), (max-height: 500px) { #track-map { width: 80px; height: 80px; top: calc(32px + env(safe-area-inset-top)); } }`;
    document.head.appendChild(style);
    document.body.appendChild(cv);
    this.cv = cv;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.height = Math.round(150 * dpr);
    // the circuit scaled into the square
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of racing.pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    const W = cv.width, pad = W * 0.09;
    const scale = (W - 2 * pad) / Math.max(maxX - minX, maxZ - minZ);
    const ox = (W - (maxX - minX) * scale) / 2, oz = (W - (maxZ - minZ) * scale) / 2;
    this.map = (x, z) => [ox + (x - minX) * scale, oz + (z - minZ) * scale];     // north (-z) up
    // the track, drawn once
    this.base = document.createElement('canvas');
    this.base.width = this.base.height = W;
    const g = this.base.getContext('2d');
    const m = racing.m;
    const shades = ['#e8e8e8', '#bfc3c8', '#e8e8e8'];
    const sectorOf = (i) => (i < cuts[0] ? 0 : i < cuts[1] ? 1 : 2);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = W * 0.035; g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    racing.pts.forEach((p, i) => { const [a, b] = this.map(p.x, p.z); if (i) g.lineTo(a, b); else g.moveTo(a, b); });
    g.closePath(); g.stroke();
    g.lineWidth = W * 0.018;
    for (let s = 0; s < 3; s++) {
      g.strokeStyle = shades[s];
      g.beginPath();
      let started = false;
      for (let i = 0; i <= m; i++) {
        const p = racing.pts[i % m];
        if (sectorOf(i % m) !== s && !(i === m && s === 2)) { started = false; continue; }
        const [a, b] = this.map(p.x, p.z);
        if (!started) { g.moveTo(a, b); started = true; } else g.lineTo(a, b);
      }
      g.stroke();
    }
    // start line and sector marks
    const mark = (i, colour) => {
      const p = racing.pts[i];
      const [a, b] = this.map(p.x, p.z);
      g.strokeStyle = colour; g.lineWidth = W * 0.012;
      g.beginPath(); g.moveTo(a - p.nx * W * 0.04, b - p.nz * W * 0.04); g.lineTo(a + p.nx * W * 0.04, b + p.nz * W * 0.04); g.stroke();
    };
    mark(0, '#ff3b30');
    mark(cuts[0], '#ffd23c');
    mark(cuts[1], '#ffd23c');
  }

  update(x, z, heading) {
    const g = this.cv.getContext('2d'), W = this.cv.width;
    g.clearRect(0, 0, W, W);
    g.drawImage(this.base, 0, 0);
    const [a, b] = this.map(x, z);
    const fx = Math.sin(heading), fz = Math.cos(heading);
    g.fillStyle = '#ffd23c'; g.strokeStyle = '#111'; g.lineWidth = W * 0.01;
    g.beginPath();
    const s = W * 0.045;
    g.moveTo(a + fx * s, b + fz * s);
    g.lineTo(a - fx * s * 0.6 + fz * s * 0.6, b - fz * s * 0.6 - fx * s * 0.6);
    g.lineTo(a - fx * s * 0.6 - fz * s * 0.6, b - fz * s * 0.6 + fx * s * 0.6);
    g.closePath(); g.fill(); g.stroke();
  }
}
