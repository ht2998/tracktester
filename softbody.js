// =====================================================================
// THE CRUSH FRAME: a small version of the soft-body cars of BeamNG. The
// car's body is given a skeleton: a lattice of points through it, joined
// to their neighbours by beams, each as strong as that part of a real car
// is (the nose soft and made to crumple, the sidepods firmer, the cockpit
// tub as good as unbreakable: it's held still and everything crumples
// back onto it). In a crash the wall is driven into the lattice as far as
// the hit's energy takes it; the points it reaches are pushed with it,
// the beams bend (and stay bent past their limit), and snap past breaking.
// The body's skin follows the lattice: every point of it moved as the
// lattice around it was. Between crashes it sleeps and costs nothing.
// (Car's own space: x = left, y = up, z = forward.)
// =====================================================================
export const BUILD = 4;

export class CrushFrame {
  // box: { min: [x, y, z], max: [x, y, z] }, n: [nx, ny, nz] points along each;
  // rigid(x, y, z): true for points held still (the tub); soft(x, y, z): how
  // easily the beams there bend (1 = a crumple zone, ~0 = very stiff)
  // (steps / iters: how finely the crash is worked through; buckle: how far
  // squeezed metal folds sideways instead of just shortening, into creases)
  constructor({ min, max, n, rigid, soft, steps = 24, iters = 6, buckle = 0 }) {
    this.min = min; this.max = max; this.n = n; this.steps = steps; this.iters = iters; this.buckle = buckle;
    const [nx, ny, nz] = n, N = nx * ny * nz;
    this.rest = new Float32Array(N * 3);   // (where each point started)
    this.pos = new Float32Array(N * 3);    // (where it is now)
    this.fixed = new Uint8Array(N);
    this.give = new Float32Array(N);
    // (which way each point folds when it's squeezed: a gentle wave through
    // the car, so neighbours fold together into ridges and valleys a hand's
    // width apart, as metal concertinas, not each its own way into shards)
    this.fold = new Float32Array(N * 3);
    const at = (i, j, k) => (k * ny + j) * nx + i;
    this.at = at;
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = at(i, j, k), x = min[0] + (max[0] - min[0]) * i / (nx - 1), y = min[1] + (max[1] - min[1]) * j / (ny - 1), z = min[2] + (max[2] - min[2]) * k / (nz - 1);
      this.rest.set([x, y, z], p * 3); this.pos.set([x, y, z], p * 3);
      this.fixed[p] = rigid(x, y, z) ? 1 : 0; this.give[p] = soft(x, y, z);
      const fx = Math.sin(z * 18 + y * 3), fy = Math.sin(z * 14.4 + x * 18 + 1), fz = Math.sin(x * 18 + y * 6 + 2), fl = Math.hypot(fx, fy, fz) || 1;
      this.fold.set([fx / fl, fy / fl, fz / fl], p * 3);
    }
    // beams to every neighbour round about (along the edges, across the faces, through the middle)
    const b = [];
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      for (let dk = 0; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (dk === 0 && (dj < 0 || (dj === 0 && di <= 0))) continue;
        const i2 = i + di, j2 = j + dj, k2 = k + dk;
        if (i2 < 0 || j2 < 0 || k2 < 0 || i2 >= nx || j2 >= ny || k2 >= nz) continue;
        b.push(at(i, j, k), at(i2, j2, k2));
      }
    }
    this.beams = new Uint32Array(b);
    const M = b.length / 2;
    this.len = new Float32Array(M); this.broken = new Uint8Array(M);
    for (let m = 0; m < M; m++) this.len[m] = this.dist(this.beams[m * 2], this.beams[m * 2 + 1]);
    this.len0 = Float32Array.from(this.len);
    this.changed = false;
  }
  dist(a, c) { const P = this.pos; return Math.hypot(P[a * 3] - P[c * 3], P[a * 3 + 1] - P[c * 3 + 1], P[a * 3 + 2] - P[c * 3 + 2]); }

  // A HIT: the wall touched at (px, py, pz), pushing the car along (dx, dz)
  // (into it), at speed m/s. Returns how far it crushed in.
  impact(px, py, pz, dx, dz, speed) {
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    // how far the wall gets in: the energy, soaked up by the crumpling
    const depth = Math.min(1.5, 0.0013 * speed * speed);
    if (depth < 0.025) return 0;                                              // (a scrape: nothing to crush)
    const P = this.pos, N = this.fixed.length, M = this.len.length, B = this.beams;
    // the wall's plane starts where the car's outermost point along the push is, by the contact
    let start = Infinity;
    for (let p = 0; p < N; p++) {
      const ox = P[p * 3] - px, oz = P[p * 3 + 2] - pz;
      if (Math.abs(ox * dz - oz * dx) > 0.9) continue;                         // (only the part of the car it actually meets)
      start = Math.min(start, P[p * 3] * dx + P[p * 3 + 2] * dz);
    }
    if (!isFinite(start)) return 0;
    const steps = this.steps, F = this.fold, bk = this.buckle;
    // (only the part of the car the crash can reach is worked through: the
    // rest is held where it is, so a nose hit doesn't cost the whole car)
    const act = this._act || (this._act = new Uint8Array(N)), list = [];
    for (let p = 0; p < N; p++) {
      const ox = P[p * 3] - px, oz = P[p * 3 + 2] - pz;
      act[p] = !this.fixed[p] && P[p * 3] * dx + P[p * 3 + 2] * dz - start < depth + 0.9 && Math.abs(ox * dz - oz * dx) < 1.4 ? 1 : 0;
    }
    for (let m = 0; m < M; m++) if (!this.broken[m] && (act[B[m * 2]] || act[B[m * 2 + 1]])) list.push(m);
    for (let s = 1; s <= steps; s++) {
      const wall = start + depth * s / steps;
      // the points the wall has reached are pushed along with it (those in its width)
      for (let p = 0; p < N; p++) {
        if (!act[p]) continue;
        const ox = P[p * 3] - px, oz = P[p * 3 + 2] - pz, side = Math.abs(ox * dz - oz * dx);
        if (side > 0.9) continue;
        const d = P[p * 3] * dx + P[p * 3 + 2] * dz;
        if (d < wall) { const push = (wall - d) * (side < 0.6 ? 1 : (0.9 - side) / 0.3); P[p * 3] += dx * push; P[p * 3 + 2] += dz * push; }
      }
      // the beams pull back toward their lengths; past a little strain they stay bent; past a lot they snap
      for (let it = 0; it < this.iters; it++) for (let q = 0; q < list.length; q++) {
        const m = list[q];
        if (this.broken[m]) continue;
        const a = B[m * 2], c = B[m * 2 + 1], fa = !act[a], fc = !act[c];
        if (fa && fc) continue;
        const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
        const L = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-6, rest = this.len[m];
        const strain = (L - rest) / rest, soft = (this.give[a] + this.give[c]) / 2;
        // (bent for good: the beam's own length gives way to the squeeze, more so where it's soft)
        if (Math.abs(strain) > 0.04) {
          this.len[m] += (L - rest) * (0.25 + 0.6 * soft);
          // (squeezed: it folds out sideways too, each end its own way, into a crease)
          // (only across the beam: along it, it's just shorter)
          if (bk && strain < 0) {
            const f = bk * (rest - L) * soft, ux = vx / L, uy = vy / L, uz = vz / L;
            for (const [n, fixedN] of [[a, fa], [c, fc]]) {
              if (fixedN) continue;
              let gx = F[n * 3], gy = F[n * 3 + 1], gz = F[n * 3 + 2];
              const along = gx * ux + gy * uy + gz * uz; gx -= ux * along; gy -= uy * along; gz -= uz * along;
              P[n * 3] += gx * f; P[n * 3 + 1] += gy * f; P[n * 3 + 2] += gz * f;
            }
          }
        }
        if (strain > 0.9 || strain < -0.85) { this.broken[m] = 1; continue; }
        const corr = (L - this.len[m]) / L, wa = fa ? 0 : 1, wc = fc ? 0 : 1, w = wa + wc;
        const k = 0.5 * corr / w;
        P[a * 3] += vx * k * wa; P[a * 3 + 1] += vy * k * wa; P[a * 3 + 2] += vz * k * wa;
        P[c * 3] -= vx * k * wc; P[c * 3 + 1] -= vy * k * wc; P[c * 3 + 2] -= vz * k * wc;
      }
    }
    // (the part of the car that can have moved: the points worked through, and a lattice cell round them)
    const R = this.rest, cell = [0, 1, 2].map((d) => (this.max[d] - this.min[d]) / (this.n[d] - 1));
    const reach = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let p = 0; p < N; p++) if (act[p]) for (let d = 0; d < 3; d++) { reach[d] = Math.min(reach[d], R[p * 3 + d] - cell[d]); reach[d + 3] = Math.max(reach[d + 3], R[p * 3 + d] + cell[d]); }
    // (the frame's edges: what's past them follows the nearest points, so reach out to infinity there)
    for (let d = 0; d < 3; d++) { if (reach[d] <= this.min[d]) reach[d] = -Infinity; if (reach[d + 3] >= this.max[d]) reach[d + 3] = Infinity; }
    this.reach = reach;
    this.changed = true;
    return depth;
  }

  // How far the body at (x, y, z) has been moved: the lattice's moves round it, blended
  offset(x, y, z, out) {
    const [nx, ny, nz] = this.n, mn = this.min, mx = this.max;
    const fx = Math.max(0, Math.min(nx - 1.0001, (x - mn[0]) / (mx[0] - mn[0]) * (nx - 1)));
    const fy = Math.max(0, Math.min(ny - 1.0001, (y - mn[1]) / (mx[1] - mn[1]) * (ny - 1)));
    const fz = Math.max(0, Math.min(nz - 1.0001, (z - mn[2]) / (mx[2] - mn[2]) * (nz - 1)));
    const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), u = fx - i, v = fy - j, w = fz - k;
    let ox = 0, oy = 0, oz = 0;
    for (let c = 0; c < 8; c++) {
      const di = c & 1, dj = (c >> 1) & 1, dk = (c >> 2) & 1;
      const wt = (di ? u : 1 - u) * (dj ? v : 1 - v) * (dk ? w : 1 - w);
      if (wt === 0) continue;
      const p = this.at(i + di, j + dj, k + dk) * 3;
      ox += (this.pos[p] - this.rest[p]) * wt; oy += (this.pos[p + 1] - this.rest[p + 1]) * wt; oz += (this.pos[p + 2] - this.rest[p + 2]) * wt;
    }
    out.x += ox; out.y += oy; out.z += oz;
    return out;
  }
  // how badly the beams round a point are broken (0-1): for deciding what falls off
  brokenNear(x, y, z, r = 0.5) {
    let n = 0, b = 0;
    const B = this.beams, R = this.rest;
    for (let m = 0; m < this.len.length; m++) {
      const a = B[m * 2];
      if (Math.abs(R[a * 3] - x) > r || Math.abs(R[a * 3 + 1] - y) > r || Math.abs(R[a * 3 + 2] - z) > r) continue;
      n++; if (this.broken[m]) b++;
    }
    return n ? b / n : 0;
  }
  reset() { this.pos.set(this.rest); this.len.set(this.len0); this.broken.fill(0); this.changed = true; }
}

// =====================================================================
// TORN OFF IN CHUNKS: where the bodywork has been crushed too far (moved
// more than `far` from where it was built, or stretched or squashed by
// more than `strain` along any edge), its triangles are torn out of the
// panel (left in the index as nothing, so the colours' ranges still hold)
// and handed back gathered into chunks about `cell` across, each with the
// colour (material) it was painted, in the car's own space. The panel keeps
// a hole where they were. Undo with mendPanel.
// m: the panel mesh; orig: its points as built (in its own frame)
// =====================================================================
export function tearPanel(m, orig, { far = 0.42, strain = 0.55, cell = 0.16 } = {}) {
  const g = m.geometry, pos = g.attributes.position, idx = g.index;
  if (!pos || !pos.array || !idx || !idx.array || !orig) return [];
  const a = pos.array, ix = idx.array, sx = m.scale.x || 1, sy = m.scale.y || 1, sz = m.scale.z || 1;
  g.userData.whole ??= Array.from(ix);                       // (as built: for the repair)
  const groups = (g.groups || []).slice().sort((p, q) => p.start - q.start);
  const matAt = (t) => { for (const gr of groups) if (t >= gr.start && t < gr.start + gr.count) return gr.materialIndex; return 0; };
  const P = (i, src) => [m.position.x + src[i * 3] * sx, m.position.y + src[i * 3 + 1] * sy, m.position.z + src[i * 3 + 2] * sz];
  const chunks = new Map();
  let torn = 0;
  for (let t = 0; t < ix.length; t += 3) {
    const i0 = ix[t], i1 = ix[t + 1], i2 = ix[t + 2];
    if (i0 === i1 && i1 === i2) continue;                     // (already gone)
    const c = [P(i0, a), P(i1, a), P(i2, a)], o = [P(i0, orig), P(i1, orig), P(i2, orig)];
    let moved = 0, stretch = 0;
    for (let k = 0; k < 3; k++) {
      moved = Math.max(moved, Math.hypot(c[k][0] - o[k][0], c[k][1] - o[k][1], c[k][2] - o[k][2]));
      const n = (k + 1) % 3, lo = Math.hypot(o[n][0] - o[k][0], o[n][1] - o[k][1], o[n][2] - o[k][2]), lc = Math.hypot(c[n][0] - c[k][0], c[n][1] - c[k][1], c[n][2] - c[k][2]);
      if (lo > 0.004) stretch = Math.max(stretch, Math.abs(lc / lo - 1));
    }
    if (moved < far && stretch < strain) continue;
    // torn out: into the chunk for where it was on the car, and its colour
    const mi = matAt(t), cx = (o[0][0] + o[1][0] + o[2][0]) / 3, cy = (o[0][1] + o[1][1] + o[2][1]) / 3, cz = (o[0][2] + o[1][2] + o[2][2]) / 3;
    const key = `${mi}|${Math.floor(cx / cell)}|${Math.floor(cy / cell)}|${Math.floor(cz / cell)}`;
    let ch = chunks.get(key);
    if (!ch) chunks.set(key, ch = { mat: Array.isArray(m.material) ? m.material[mi] : m.material, tris: [] });
    ch.tris.push(...c[0], ...c[1], ...c[2]);
    ix[t + 1] = i0; ix[t + 2] = i0;
    torn++;
  }
  if (torn) idx.needsUpdate = true;
  return [...chunks.values()];
}
// (the panel whole again, as built)
export function mendPanel(m) {
  const g = m.geometry, w = g.userData.whole, idx = g.index;
  if (!w || !idx || !idx.array) return;
  for (let i = 0; i < w.length; i++) idx.array[i] = w[i];
  idx.needsUpdate = true;
}
