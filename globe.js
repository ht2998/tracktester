// THE GLOBE: picking where to drive by its place on the Earth, a pin for each
// circuit (no names: a pin and the region it's in). Drag to turn it, tap a pin.
export const BUILD = 1;

// Rough coastlines (longitude, latitude), enough to know where you are
const LAND = [
  // Europe and Asia
  [[-9,43],[-9,37],[-6,36],[0,39],[3,42],[8,44],[12,44],[16,41],[18,40],[13,45],[19,42],[24,38],[26,40],[29,41],[36,36],[35,32],[33,31],[35,28],[39,22],[43,13],[45,12.5],[52,16],[57,19],[59,22],[56,26],[51,24],[50,27],[48,30],[52,28],[57,25],[62,25],[67,24],[70,21],[73,17],[75,12],[77,8],[80,10],[80,15],[86,20],[89,22],[92,22],[94,17],[97,16],[98,12],[99,8],[100,6],[101,3],[103.5,1.3],[104,2],[103,5],[102,6.5],[100.5,8],[100,12],[100.5,13.5],[102,12],[105,9],[106.5,10.5],[109,12],[109,15],[106,19],[108,21.5],[111,21],[114,22.3],[117,23.5],[120,27],[122,30],[121,32],[119,35],[122,37],[118,38],[118,39],[121,40],[122,39],[124,40],[126,37],[126.5,35],[129,35],[129.5,37],[128,39],[130,42.5],[133,43],[136,45],[140,48],[141,52],[137,54],[142,59],[150,59],[156,57],[156,51],[160,54],[163,60],[170,60],[180,65],[180,69],[170,70],[160,70],[150,72],[140,72],[130,71],[125,73],[113,74],[106,77],[100,77],[90,76],[80,73],[72,72],[68,69],[60,69],[55,68],[44,68],[40,66],[33,69],[25,71],[18,70],[13,67],[8,63],[5,59],[8,58],[11,59],[12,56],[10,54],[8,54],[5,53],[3,51],[-1,49],[-4,48],[-1,46],[-2,43.5]],
  // Africa
  [[-6,36],[-10,30],[-17,21],[-17,15],[-15,11],[-12,7],[-8,4.5],[-3,5],[3,6],[9,4],[10,0],[12,-5],[13,-12],[12,-17],[15,-27],[18,-34],[22,-34],[27,-33.5],[32,-28],[35,-24],[35,-19],[40,-15],[40,-10],[39,-5],[42,-1],[47,4],[51,11],[43,12],[39,18],[37,22],[35,28],[32,31],[25,32],[20,31],[15,32],[10,34],[10,37],[3,37]],
  // North America
  [[-168,66],[-162,60],[-158,57],[-152,59],[-146,61],[-138,59],[-131,55],[-125,49],[-124,42],[-121,35],[-117,32.5],[-114,30],[-110,24],[-106,23],[-104,19],[-97,16],[-92,15],[-88,13],[-85,11],[-83,8.5],[-79,9],[-77,8],[-80,7.5],[-83,10],[-84,15],[-88,16],[-87,21],[-90,21],[-91,19],[-95,18.5],[-97,22],[-97,27],[-94,29.5],[-89,30],[-84,30],[-82,26],[-80,25],[-80,31],[-76,35],[-74,40],[-70,42],[-66,44],[-61,45.5],[-60,47],[-64,49],[-56,52],[-61,56],[-64,60],[-70,59],[-78,62],[-80,57],[-80,52],[-88,55],[-94,59],[-94,61],[-87,64],[-82,67],[-86,70],[-97,68],[-108,68],[-115,69],[-125,70],[-135,69],[-142,70],[-156,71],[-166,68]],
  // South America
  [[-77,8],[-72,12],[-62,11],[-56,6],[-51,4],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-14],[-40,-21],[-44,-23],[-48,-26],[-53,-34],[-58,-35],[-57,-38],[-62,-39],[-65,-42],[-67,-46],[-69,-51],[-68,-55],[-72,-54],[-75,-49],[-73,-41],[-73,-35],[-71,-28],[-70,-18],[-76,-14],[-81,-6],[-80,-2],[-79,2],[-78,7]],
  // Australia
  [[114,-22],[114,-27],[115,-34],[118,-35],[123,-34],[129,-32],[132,-32],[135,-35],[138,-35],[140,-38],[146,-39],[150,-37.5],[153,-32],[153,-26],[150,-22],[146,-19],[145,-15],[143,-11],[142,-14],[141,-17],[138,-16],[136,-12],[132,-11],[130,-13],[127,-14],[125,-15],[122,-18],[119,-20]],
  // Greenland
  [[-45,60],[-50,64],[-54,67],[-56,72],[-66,76],[-73,78],[-62,82],[-40,83],[-22,82],[-18,77],[-20,72],[-24,69],[-33,67],[-40,65]],
  // Japan
  [[130,31],[131.5,31.5],[132,33.5],[131,34],[133,34.3],[135,33.6],[136,34.2],[137,34.6],[139,34.8],[140,35.1],[140.8,36],[141,38],[142,39.5],[141.4,41.4],[140,40.7],[140,39],[139.5,38],[138,37.2],[136.8,37.3],[136,35.6],[133,35.5],[131,34.5],[129.8,33.4]],
  [[140,41.5],[141.2,41.8],[143,42],[145.5,43.3],[145,44.2],[142,45.4],[141.6,44],[141.4,43],[140.3,43.2]],
  // Britain and Ireland
  [[-5.5,50],[1.4,51.2],[1.7,52.7],[0,53.5],[-2,55.8],[-1.8,57.6],[-3,58.6],[-5,58.6],[-6,56.5],[-5,55],[-3,54.7],[-3.2,53.3],[-4.7,52.8],[-5.2,51.7]],
  [[-6,52],[-6,54],[-7.5,55.2],[-10,54],[-10,51.6]],
  // Sumatra, Borneo, Java, Sulawesi, New Guinea, the Philippines, Taiwan, Sri Lanka, Madagascar, New Zealand
  [[95.3,5.6],[97.5,5.2],[100,2.2],[104,-1],[106,-3],[105.8,-5.8],[104.5,-5.9],[102,-4],[100.5,-1],[98.6,1.7]],
  [[109,1.8],[111,2.7],[113,3.2],[115.5,5.2],[117,7],[119,5.2],[118,3.5],[117.8,1],[116.5,-1.5],[116,-3.5],[114.5,-4],[111,-3],[110,-1.5],[109,0]],
  [[105.5,-6.8],[108,-6.4],[111,-6.4],[114.5,-7.7],[114.5,-8.7],[111,-8.2],[106,-7.4]],
  [[119.5,-5.5],[120.4,-5.6],[120.8,-2.8],[121.6,-4.8],[123,-4],[122,-1.5],[123.5,-0.8],[125,1.5],[121,1.2],[119.8,-0.5]],
  [[131,-1.2],[135,-3.3],[138,-1.6],[141,-2.6],[145.7,-5],[148,-8],[150.5,-10.6],[147,-10],[144,-7.6],[141,-9],[138,-8.3],[137.6,-5],[133,-4],[132,-2.8]],
  [[120,18.5],[122.2,18.5],[122,16],[121.6,14],[124,12.5],[125.5,9.5],[126.5,7],[125.3,5.6],[123.5,7.8],[122,7],[122.8,10],[121.4,12.5],[120,14.5]],
  [[120.1,23],[121,25.2],[122,25],[120.8,22]],
  [[79.8,6],[80.1,9.8],[81.9,7.4],[81.2,6.2]],
  [[44,-25],[47,-25],[50.5,-15.5],[49.3,-12],[47,-15.5],[44,-17],[43.3,-22]],
  [[172.7,-34.4],[174.6,-36.8],[178.5,-37.7],[177,-39.5],[174.8,-41.4],[172.7,-40.5],[174.3,-39.1],[173.8,-36.8]],
  [[172.7,-40.6],[174.3,-41.7],[172.7,-43.6],[171.2,-44.5],[169.4,-46.6],[166.5,-46],[168.3,-44],[171.4,-41.8]],
];

const PINS = [
  { track: 'sepang', lon: 101.74, lat: 2.76, region: 'West Malaysia' },
  { track: 'suzuka', lon: 136.54, lat: 34.84, region: 'Japan (Mie)' },
];

const RAD = Math.PI / 180;

// The globe screen: onPick(track) when a pin (or the test area) is chosen
export function openGlobe(current, onPick) {
  const wrap = document.createElement('div');
  wrap.id = 'globe-screen';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:200;background:radial-gradient(ellipse at center,#14202e 0%,#05080c 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font:600 15px system-ui,sans-serif;color:#eee;touch-action:none;user-select:none';
  const heading = document.createElement('div');
  heading.textContent = 'Where to drive';
  heading.style.cssText = 'font-size:20px;letter-spacing:0.06em';
  const cv = document.createElement('canvas');
  const size = Math.min(window.innerWidth * 0.92, window.innerHeight * 0.72, 620);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.style.width = cv.style.height = size + 'px';
  cv.width = cv.height = Math.round(size * dpr);
  cv.style.cursor = 'grab';
  const label = document.createElement('div');
  label.style.cssText = 'min-height:20px;opacity:0.85';
  label.textContent = 'Drag to turn the globe · tap a pin';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:10px';
  const btn = (text, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = text;
    b.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid #556;background:#1c2633;color:#eee;font:inherit;cursor:pointer';
    b.addEventListener('click', fn);
    return b;
  };
  const close = () => { wrap.remove(); window.removeEventListener('keydown', onKey, true); };
  const onKey = (e) => { if (e.key === 'Escape') close(); e.stopPropagation(); };
  window.addEventListener('keydown', onKey, true);
  row.append(btn('Test area', () => { close(); if (current !== 'test') onPick('test'); }), btn('Cancel', close));
  wrap.append(heading, cv, label, row);
  document.body.appendChild(wrap);

  // the view: the longitude and latitude at the centre (starts over Asia, or the current pin)
  const cur = PINS.find((p) => p.track === current);
  let lon0 = cur ? cur.lon : 118, lat0 = cur ? cur.lat : 20;
  const W = cv.width, R = W * 0.46, C = W / 2;
  const g = cv.getContext('2d');
  // a point on the Earth to the canvas (null when on the far side)
  const proj = (lon, lat) => {
    const l = (lon - lon0) * RAD, p = lat * RAD, p0 = lat0 * RAD;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    const x = Math.cos(p) * Math.sin(l);
    const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
    return { x: C + R * x, y: C - R * y, vis: cosc > 0 };
  };
  let hover = null, pulse = 0;
  const draw = () => {
    g.clearRect(0, 0, W, W);
    // the sea
    const sea = g.createRadialGradient(C - R * 0.3, C - R * 0.3, R * 0.1, C, C, R);
    sea.addColorStop(0, '#2d6fa8'); sea.addColorStop(1, '#0f2d4d');
    g.fillStyle = sea; g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.fill();
    // lines of longitude and latitude
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = dpr;
    const line = (pts) => { g.beginPath(); let on = false; for (const [lo, la] of pts) { const q = proj(lo, la); if (!q.vis) { on = false; continue; } if (on) g.lineTo(q.x, q.y); else { g.moveTo(q.x, q.y); on = true; } } g.stroke(); };
    for (let lo = -180; lo < 180; lo += 30) line(Array.from({ length: 37 }, (_, i) => [lo, -90 + i * 5]));
    for (let la = -60; la <= 60; la += 30) line(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, la]));
    // the land (each coast drawn densely, and the part round the back pinned to the rim)
    g.fillStyle = '#5c8a4a'; g.strokeStyle = '#3d6332'; g.lineWidth = dpr;
    for (const poly of LAND) {
      const pts = [];
      for (let i = 0; i < poly.length; i++) {
        const [a0, b0] = poly[i], [a1, b1] = poly[(i + 1) % poly.length];
        const steps = Math.max(1, Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 2));
        for (let s = 0; s < steps; s++) pts.push([a0 + (a1 - a0) * s / steps, b0 + (b1 - b0) * s / steps]);
      }
      const qs = pts.map(([lo, la]) => proj(lo, la));
      if (!qs.some((q) => q.vis)) continue;
      g.beginPath();
      qs.forEach((q, i) => {
        let { x, y } = q;
        if (!q.vis) { const d = Math.hypot(x - C, y - C) || 1; x = C + (x - C) / d * R; y = C + (y - C) / d * R; }
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      });
      g.closePath(); g.fill(); g.stroke();
    }
    // the rim
    g.strokeStyle = 'rgba(160,200,255,0.35)'; g.lineWidth = 2 * dpr;
    g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.stroke();
    // the pins
    for (const p of PINS) {
      const q = proj(p.lon, p.lat);
      if (!q.vis) continue;
      const big = p === hover ? 1.25 : 1, s = 9 * dpr * big;
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath(); g.ellipse(q.x, q.y, s * 0.5, s * 0.22, 0, 0, Math.PI * 2); g.fill();
      if (p.track === current) {
        g.strokeStyle = `rgba(255,210,60,${0.8 - (pulse % 1) * 0.8})`; g.lineWidth = 2 * dpr;
        g.beginPath(); g.arc(q.x, q.y, s * (0.6 + (pulse % 1) * 1.6), 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = p.track === current ? '#ffd23c' : '#ff3b30'; g.strokeStyle = '#111'; g.lineWidth = 1.5 * dpr;
      g.beginPath();
      g.moveTo(q.x, q.y);
      g.bezierCurveTo(q.x - s, q.y - s * 1.3, q.x - s, q.y - s * 2.6, q.x, q.y - s * 2.6);
      g.bezierCurveTo(q.x + s, q.y - s * 2.6, q.x + s, q.y - s * 1.3, q.x, q.y);
      g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y - s * 1.75, s * 0.32, 0, Math.PI * 2); g.fill();
    }
  };
  const pinAt = (ev) => {
    const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * W / r.width;
    let best = null, bd = 22 * dpr;
    for (const p of PINS) {
      const q = proj(p.lon, p.lat);
      if (!q.vis) continue;
      const d = Math.hypot(q.x - x, q.y - 15 * dpr - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  let drag = null, moved = 0;
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY }; moved = 0; cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', (e) => {
    if (drag) {
      const k = 180 / (Math.PI * R / dpr);
      lon0 -= (e.clientX - drag.x) * k; lat0 = Math.max(-80, Math.min(80, lat0 + (e.clientY - drag.y) * k));
      lon0 = ((lon0 + 540) % 360) - 180;
      moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
      drag = { x: e.clientX, y: e.clientY };
    }
    hover = pinAt(e);
    label.textContent = hover ? `${hover.region}${hover.track === current ? ' · driving here now' : ' · tap to drive here'}` : 'Drag to turn the globe · tap a pin';
    cv.style.cursor = drag ? 'grabbing' : hover ? 'pointer' : 'grab';
  });
  cv.addEventListener('pointerup', (e) => {
    drag = null; cv.style.cursor = 'grab';
    if (moved > 6) return;
    const p = pinAt(e);
    if (p) { close(); if (p.track !== current) onPick(p.track); }
  });
  const tick = () => { if (!wrap.isConnected) return; pulse += 0.012; draw(); requestAnimationFrame(tick); };
  tick();
}
