// =====================================================================
// HUD: the dashboard on screen.
//   - Rev counter (tachometer) with the gear shown at the bottom
//   - Speedometer with shift-light dots in the centre
//   - A slide-out side panel (arrow on the right): gearbox and assists
// The dials' fixed parts (bezel, ticks, numbers) are drawn once and
// reused; only the needles and lights are redrawn each frame.
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 9;

const COLORS = {
  face: '#15181c',
  faceEdge: '#0e1013',
  chromeLight: '#d4d7db',
  chromeDark: '#5b5f66',
  ink: '#f2efe6',          // numerals and ticks
  inkSoft: 'rgba(242, 239, 230, 0.55)',
  needle: '#ff7a1a',
  redline: '#e0322b',
  ledGreen: '#3ddc5a',
  ledAmber: '#ffb020',
  ledRed: '#ff3b30',
  ledShift: '#3d7bff',
  ledOff: '#2a2e35',
};
const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';

const START = Math.PI * 0.75;   // dial starts bottom-left...
const SWEEP = Math.PI * 1.5;    // ...and sweeps 270° round to bottom-right

// ---------------------------------------------------------------------
// One analogue dial
// ---------------------------------------------------------------------
class Dial {
  constructor({ max, major, minor, labelEvery, labelScale = 1, redFrom = null, redBelow = null,
                caption = '', labels = null, labelSize = 0.17, captionSize = 0.11 }) {
    this.max = max;
    this.major = major;
    this.minor = minor;
    this.labelEvery = labelEvery;
    this.labelScale = labelScale;
    this.redFrom = redFrom;
    this.redBelow = redBelow;       // red zone at the low end instead (e.g. oil level)
    this.caption = caption;
    this.labels = labels;           // e.g. { 0: 'E', 100: 'F' } instead of numbers
    this.labelSize = labelSize;
    this.captionSize = captionSize;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.background = document.createElement('canvas');
    this.size = 0;
  }

  angle(v) {
    return START + SWEEP * Math.min(Math.max(v / this.max, 0), 1.02);
  }

  // Set the on-screen size (CSS pixels) and redraw the fixed parts
  resize(cssSize) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.size = cssSize;
    this.dpr = dpr;
    for (const c of [this.canvas, this.background]) {
      c.width = Math.round(cssSize * dpr);
      c.height = Math.round(cssSize * dpr);
    }
    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
    this.drawBackground();
  }

  drawBackground() {
    const g = this.background.getContext('2d');
    const s = this.size;
    const c = s / 2;
    const R = s / 2;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, s, s);

    // Chrome bezel
    const bezel = g.createLinearGradient(0, 0, s, s);
    bezel.addColorStop(0, COLORS.chromeLight);
    bezel.addColorStop(0.5, COLORS.chromeDark);
    bezel.addColorStop(1, COLORS.chromeLight);
    g.beginPath();
    g.arc(c, c, R - 1, 0, Math.PI * 2);
    g.fillStyle = bezel;
    g.fill();

    // Face
    const face = g.createRadialGradient(c, c * 0.8, R * 0.1, c, c, R * 0.92);
    face.addColorStop(0, COLORS.face);
    face.addColorStop(1, COLORS.faceEdge);
    g.beginPath();
    g.arc(c, c, R * 0.9, 0, Math.PI * 2);
    g.fillStyle = face;
    g.fill();

    // Redline zone
    if (this.redFrom !== null || this.redBelow !== null) {
      g.beginPath();
      if (this.redFrom !== null) g.arc(c, c, R * 0.8, this.angle(this.redFrom), this.angle(this.max));
      else g.arc(c, c, R * 0.8, this.angle(0), this.angle(this.redBelow));
      g.strokeStyle = COLORS.redline;
      g.lineWidth = R * 0.07;
      g.stroke();
    }

    // Ticks
    g.lineCap = 'round';
    for (let v = 0; v <= this.max + 1e-6; v += this.minor) {
      const isMajor = Math.abs(v / this.major - Math.round(v / this.major)) < 1e-6;
      const a = this.angle(v);
      const outer = R * 0.84;
      const inner = isMajor ? R * 0.7 : R * 0.77;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
      g.lineTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
      const inRed = (this.redFrom !== null && v >= this.redFrom) || (this.redBelow !== null && v <= this.redBelow);
      g.strokeStyle = inRed ? COLORS.redline : COLORS.ink;
      g.lineWidth = isMajor ? Math.max(1.5, R * 0.025) : Math.max(1, R * 0.012);
      g.stroke();
    }

    // Numbers
    g.fillStyle = COLORS.ink;
    g.font = `600 ${Math.round(R * this.labelSize)}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (this.labels) {
      for (const [v, text] of Object.entries(this.labels)) {
        const a = this.angle(Number(v));
        const r = R * 0.5;
        g.fillText(text, c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
    } else {
      for (let v = 0; v <= this.max + 1e-6; v += this.labelEvery) {
        const a = this.angle(v);
        const r = R * 0.56;
        g.fillText(String(Math.round(v * this.labelScale)), c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
    }

    // Small caption in the lower face
    g.fillStyle = COLORS.inkSoft;
    g.font = `500 ${Math.round(R * this.captionSize)}px ${FONT}`;
    if (this.caption) g.fillText(this.caption, c, c + R * 0.3);
  }

  drawNeedle(value, color = COLORS.needle) {
    const g = this.ctx;
    const R = this.size / 2;
    const c = R;
    const a = this.angle(value);
    g.save();
    g.translate(c, c);
    g.rotate(a);
    g.beginPath();
    g.moveTo(-R * 0.14, -R * 0.025);
    g.lineTo(R * 0.8, -R * 0.008);
    g.lineTo(R * 0.8, R * 0.008);
    g.lineTo(-R * 0.14, R * 0.025);
    g.closePath();
    g.fillStyle = color;
    g.shadowColor = 'rgba(0,0,0,0.5)';
    g.shadowBlur = R * 0.04;
    g.fill();
    g.restore();

    // Centre cap
    g.beginPath();
    g.arc(c, c, R * 0.075, 0, Math.PI * 2);
    g.fillStyle = COLORS.chromeDark;
    g.fill();
    g.beginPath();
    g.arc(c, c, R * 0.045, 0, Math.PI * 2);
    g.fillStyle = COLORS.face;
    g.fill();
  }

  beginFrame() {
    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.drawImage(this.background, 0, 0);
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
}

// ---------------------------------------------------------------------
// Styles for the dashboard and the side panel
// ---------------------------------------------------------------------
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&display=swap');

#dash {
  position: fixed;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
}
#dash canvas { display: block; }
/* Phones and tablets: a mini cluster at the top, out of the way of the road */
#dash.compact { top: calc(6px + env(safe-area-inset-top)); bottom: auto; align-items: flex-start; gap: 6px; }
/* (the tyre wear bars sit level with the middle of the rev counter) */
#dash.compact .tyre-bars { align-self: center; }

/* Tiny clutch status line */
#clutch-status {
  position: fixed;
  left: 50%;
  top: 6px;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(14, 16, 19, 0.45);
  color: rgba(242, 239, 230, 0.75);
  font: 600 13px ${FONT};
  pointer-events: none;
  white-space: nowrap;
}
#clutch-status.out { color: ${COLORS.needle}; background: rgba(14, 16, 19, 0.7); }

/* Side panel: a slim arrow on the right edge that slides out the settings */
#sidepanel {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(var(--sp-shift));
  display: flex;
  align-items: center;
  font-family: ${FONT};
  transition: transform 220ms ease;
  --sp-shift: calc(100% - 26px);
}
#sidepanel.open { --sp-shift: 0px; }
@media (prefers-reduced-motion: reduce) { #sidepanel { transition: none; } }

#sidepanel .sp-handle {
  width: 26px;
  height: 64px;
  padding: 0;
  border: none;
  border-radius: 10px 0 0 10px;
  background: #1d2127;
  color: ${COLORS.ink};
  cursor: pointer;
  display: grid;
  place-items: center;
}
#sidepanel .sp-handle svg { transition: transform 220ms ease; }
#sidepanel.open .sp-handle .sp-arrow { transform: rotate(180deg); }
#sidepanel .sp-handle .sp-gear { display: none; }
/* Phones and tablets: a bigger tab with a settings cog and a label, so
   it's easy to spot and to hit with a thumb */
#sidepanel.compact { --sp-shift: calc(100% - 34px); }
#sidepanel.compact.open { --sp-shift: 0px; }
#sidepanel.compact .sp-handle {
  width: 34px; height: 84px; gap: 4px;
  grid-template-rows: auto auto;
  place-content: center;
  border: 1.5px solid ${COLORS.needle};
  border-right: none;
  color: ${COLORS.needle};
}
#sidepanel.compact .sp-handle .sp-gear { display: block; }
#sidepanel.compact .sp-handle .sp-arrow { width: 10px; height: 16px; }
/* Until it's been opened once, the tab gently pulses so people notice it */
@keyframes sp-hint {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 122, 26, 0); }
  50% { box-shadow: -2px 0 14px 3px rgba(255, 122, 26, 0.55); }
}
#sidepanel.hint:not(.open) .sp-handle { animation: sp-hint 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { #sidepanel.hint:not(.open) .sp-handle { animation: none; } }
#sidepanel .sp-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(21, 24, 28, 0.94);
  border-radius: 12px 0 0 12px;
  max-height: 86vh;
  overflow-y: auto;
}
#sidepanel .sp-heading {
  margin: 4px 2px 2px;
  color: ${COLORS.inkSoft};
  font-size: 15px;
  font-weight: 600;
}
#sidepanel .sp-heading:not(:first-child) { margin-top: 12px; }
#sidepanel .gb-option {
  display: grid;
  grid-template-columns: 6px 1fr;
  column-gap: 10px;
  align-items: center;
  min-width: 190px;
  padding: 9px 12px 9px 8px;
  border: 1px solid #2c3139;
  border-radius: 8px;
  background: transparent;
  color: ${COLORS.ink};
  text-align: left;
  cursor: pointer;
  font-family: ${FONT};
}
#sidepanel .gb-option::before {
  content: '';
  grid-row: span 2;
  width: 6px;
  height: 100%;
  border-radius: 3px;
  background: #2c3139;
}
#sidepanel .gb-option.active { border-color: ${COLORS.needle}; }
#sidepanel .gb-option.active::before { background: ${COLORS.needle}; }
#sidepanel .gb-name { font-size: 18px; font-weight: 600; line-height: 1.1; }
#sidepanel .gb-note { font-size: 14px; font-weight: 500; color: ${COLORS.inkSoft}; }
#sidepanel .gb-option:hover { background: rgba(242, 239, 230, 0.05); }

/* Level sliders for the driver aids: 0 = off, 5 = strongest */
#sidepanel .tyre-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 190px;
  padding: 9px 12px 11px;
  border: 1px solid #2c3139;
  border-radius: 8px;
}
#sidepanel select {
  width: 100%;
  padding: 7px 8px;
  border: 1px solid #3a404a;
  border-radius: 6px;
  background: #15181c;
  color: ${COLORS.ink};
  font: 600 16px ${FONT};
  cursor: pointer;
}
#sidepanel select:focus-visible { outline: 2px solid ${COLORS.needle}; outline-offset: 2px; }
#sidepanel .tyre-fresh {
  align-self: flex-start;
  padding: 5px 10px;
  border: 1px solid #3a404a;
  border-radius: 6px;
  background: transparent;
  color: ${COLORS.ink};
  font: 600 14px ${FONT};
  cursor: pointer;
}
#sidepanel .tyre-fresh:hover { background: rgba(242, 239, 230, 0.05); }
#sidepanel .assist {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  row-gap: 6px;
  min-width: 190px;
  padding: 9px 12px 11px;
  border: 1px solid #2c3139;
  border-radius: 8px;
  color: ${COLORS.ink};
  font-family: ${FONT};
}
#sidepanel .assist .gb-note { grid-column: 1 / -1; }
#sidepanel .assist-level { font-size: 16px; font-weight: 600; color: ${COLORS.needle}; }
#sidepanel .assist-level.off { color: ${COLORS.inkSoft}; }
#sidepanel .assist input[type=range] {
  grid-column: 1 / -1;
  width: 100%;
  margin: 2px 0 0;
  accent-color: ${COLORS.needle};
  cursor: pointer;
}
#sidepanel .assist .scale {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${COLORS.inkSoft};
}
#sidepanel input[type=range]:focus-visible { outline: 2px solid ${COLORS.needle}; outline-offset: 3px; }

/* Time and weather */
#clock {
  position: fixed;
  right: calc(10px + env(safe-area-inset-right));
  top: calc(6px + env(safe-area-inset-top));
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(14, 16, 19, 0.45);
  color: rgba(242, 239, 230, 0.85);
  font: 600 14px ${FONT};
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  white-space: nowrap;
}
#sidepanel .tw-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
#sidepanel .tw-clock { font-size: 24px; font-weight: 600; color: ${COLORS.ink}; font-variant-numeric: tabular-nums; }
#sidepanel .tw-lock[aria-pressed="true"] { border-color: ${COLORS.needle}; color: ${COLORS.needle}; }
#sidepanel .tw-row { display: flex; justify-content: space-between; align-items: baseline; color: ${COLORS.ink}; font-size: 15px; font-weight: 600; margin-top: 4px; }
#sidepanel .tw-value { color: ${COLORS.needle}; font-size: 15px; font-weight: 600; }
#sidepanel .tyre-box input[type=range] { width: 100%; margin: 0; accent-color: ${COLORS.needle}; cursor: pointer; }
#sidepanel .tw-check { display: flex; align-items: center; gap: 8px; color: ${COLORS.ink}; font-size: 15px; font-weight: 600; cursor: pointer; }
#sidepanel .tw-check input { width: 18px; height: 18px; accent-color: ${COLORS.needle}; margin: 0; }
#sidepanel button:focus-visible { outline: 2px solid ${COLORS.needle}; outline-offset: 2px; }
`;

const ASSISTS = [
  { id: 'abs', name: 'ABS', note: 'Higher: steer while braking hard. 0: wheels lock' },
  { id: 'tcs', name: 'TCS', note: 'Higher: less wheelspin and sliding. 0: raw power' },
];

const GEARBOXES = [
  { id: 'manual', name: 'Manual', note: 'Shift with Q / E or , / .' },
  { id: 'auto', name: 'Automatic', note: 'Shifts for you' },
  { id: 'cvt', name: 'CVT', note: 'No gears, smooth revs' },
];

// The classic check engine symbol: an engine block seen from the side
// Headlight warning lamp, like a real dash: a lamp shape with beam lines.
// Dipped = green, beams angled down; main beam = blue, beams straight out.
function drawHeadlightLamp(g, cx, cy, size, main) {
  const color = main ? '#3b8cff' : '#39c86a';
  const u = size / 24;
  g.save();
  g.translate(cx - 12 * u, cy - 8 * u);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 2 * u;
  g.lineCap = 'round';
  // the lamp: a "D" facing left (light shines out to the left)
  g.beginPath();
  g.moveTo(14 * u, 1 * u);
  g.quadraticCurveTo(24 * u, 1 * u, 24 * u, 8 * u);
  g.quadraticCurveTo(24 * u, 15 * u, 14 * u, 15 * u);
  g.closePath();
  g.fill();
  // the beam lines
  for (let k = 0; k < 4; k++) {
    const y = 2 * u + k * 4 * u;
    g.beginPath();
    g.moveTo(11 * u, y);
    g.lineTo(2 * u, main ? y : y + 3 * u);
    g.stroke();
  }
  g.restore();
}

// --- Warning lamps (drawn on a 24 x 16 grid, centred on cx, cy) ---
function lampStyle(g, color, u) {
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.1, 1.5 * u);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.shadowColor = color;
  g.shadowBlur = 5 * u;
}
// ABS: the letters in a circle, with a bracket either side (the brake drum)
function drawAbsLamp(g, cx, cy, width, color) {
  const u = width / 24;
  g.save();
  lampStyle(g, color, u);
  g.beginPath(); g.arc(cx, cy, 6.5 * u, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 9.5 * u, Math.PI * 0.72, Math.PI * 1.28); g.stroke();
  g.beginPath(); g.arc(cx, cy, 9.5 * u, -Math.PI * 0.28, Math.PI * 0.28); g.stroke();
  g.shadowBlur = 0;
  g.font = `700 ${Math.round(5.4 * u)}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('ABS', cx, cy + 0.4 * u);
  g.restore();
}
// Traction control: the letters TCS (with OFF under them when it's switched off)
function drawTcsLamp(g, cx, cy, width, color, off) {
  const u = width / 24;
  g.save();
  lampStyle(g, color, u);
  g.shadowBlur = 4 * u;
  g.font = `700 ${Math.round(7.5 * u)}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('TCS', cx, cy - (off ? 2.5 * u : 0));
  if (off) {
    g.font = `700 ${Math.round(5 * u)}px ${FONT}`;
    g.fillText('OFF', cx, cy + 5 * u);
  }
  g.restore();
}
// Skid: a car from behind with two wavy skid lines under it
function drawSkidLamp(g, cx, cy, width, color) {
  const u = width / 24;
  const x0 = cx - 12 * u, y0 = cy - 8 * u;
  const P = (x, y) => [x0 + x * u, y0 + y * u];
  g.save();
  lampStyle(g, color, u);
  g.beginPath();                        // the car
  [[6, 7], [8, 2], [16, 2], [18, 7], [19, 7], [19, 10], [5, 10], [5, 7]].forEach(([x, y], i) => (i ? g.lineTo(...P(x, y)) : g.moveTo(...P(x, y))));
  g.closePath();
  g.fill();
  for (const sx of [7, 15]) {           // the wavy skid lines
    g.beginPath();
    g.moveTo(...P(sx, 12));
    g.bezierCurveTo(...P(sx + 2, 13), ...P(sx - 1, 14.5), ...P(sx + 1.5, 16));
    g.stroke();
  }
  g.restore();
}
// Handbrake: a (!) in a circle, in red
// Engine temperature: a thermometer standing in waves (the usual coolant lamp)
function drawCoolantLamp(g, cx, cy, width, color) {
  const u = width / 24;
  g.save();
  lampStyle(g, color, u);
  g.beginPath(); g.moveTo(cx, cy - 9 * u); g.lineTo(cx, cy + 2 * u); g.stroke();      // stem
  g.beginPath(); g.arc(cx, cy + 4 * u, 2.6 * u, 0, Math.PI * 2); g.fill();             // bulb
  for (const k of [-6, -3]) { g.beginPath(); g.moveTo(cx, cy + k * u); g.lineTo(cx + 4 * u, cy + k * u); g.stroke(); }
  for (const dy of [7.5, 10.5]) {                                                       // waves
    g.beginPath();
    for (let i = 0; i <= 16; i++) {
      const x = cx - 10 * u + i * 1.25 * u;
      const y = cy + dy * u + Math.sin(i * 0.8) * 1.1 * u;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}
function drawHandbrakeLamp(g, cx, cy, width, color) {
  const u = width / 24;
  g.save();
  lampStyle(g, color, u);
  g.beginPath(); g.arc(cx, cy, 6.5 * u, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 9.5 * u, Math.PI * 0.72, Math.PI * 1.28); g.stroke();
  g.beginPath(); g.arc(cx, cy, 9.5 * u, -Math.PI * 0.28, Math.PI * 0.28); g.stroke();
  g.shadowBlur = 0;
  g.font = `800 ${Math.round(9 * u)}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('!', cx, cy + 0.5 * u);
  g.restore();
}
// Fuel: a petrol pump, and a little arrow pointing to the side of the car
// the filler cap is on (on this car, the left)
function drawFuelPump(g, cx, cy, width, color, side = -1) {
  const u = width / 24;
  const x0 = cx - 12 * u, y0 = cy - 8 * u;
  const P = (x, y) => [x0 + x * u, y0 + y * u];
  g.save();
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = Math.max(1, 1.4 * u);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();                        // the pump body, with its window cut out
  g.moveTo(...P(7, 2)); g.lineTo(...P(14, 2)); g.lineTo(...P(14, 15)); g.lineTo(...P(7, 15)); g.closePath();
  g.moveTo(...P(8.5, 3.5)); g.lineTo(...P(8.5, 7)); g.lineTo(...P(12.5, 7)); g.lineTo(...P(12.5, 3.5)); g.closePath();
  g.fill('evenodd');
  g.beginPath();                        // the hose and nozzle
  g.moveTo(...P(14, 5)); g.lineTo(...P(16.5, 5)); g.lineTo(...P(17.5, 7)); g.lineTo(...P(17.5, 12));
  g.quadraticCurveTo(...P(17.5, 13.5), ...P(16, 13)); g.lineTo(...P(15.5, 11));
  g.stroke();
  // the filler-side arrow
  const ax = side < 0 ? 2 : 22;
  g.beginPath();
  g.moveTo(...P(ax, 8.5));
  g.lineTo(...P(ax - side * 3, 6));
  g.lineTo(...P(ax - side * 3, 11));
  g.closePath();
  g.fill();
  g.restore();
}

function drawCheckEngine(g, cx, cy, width, color) {
  const u = width / 24;   // drawn on a 24 x 16 grid
  const x0 = cx - 12 * u, y0 = cy - 8 * u;
  const P = (x, y) => [x0 + x * u, y0 + y * u];
  g.save();
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.2, 1.6 * u);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.shadowColor = color;
  g.shadowBlur = 6 * u;
  g.beginPath();
  [[5, 5], [9, 5], [9, 3], [14, 3], [14, 5], [18, 5], [20, 7], [22, 7], [22, 12],
   [20, 12], [18, 14], [8, 14], [5, 11]].forEach(([x, y], i) => (i ? g.lineTo(...P(x, y)) : g.moveTo(...P(x, y))));
  g.closePath();
  g.fill();
  g.beginPath();                       // the bracket on the left
  g.moveTo(...P(2, 6)); g.lineTo(...P(2, 13));
  g.moveTo(...P(2, 9.5)); g.lineTo(...P(5, 9.5));
  g.stroke();
  g.restore();
}

// Tyre wear: four bars laid out like the car seen from above. Each starts
// white and fills red from the top as that tyre wears. The outline shows the
// tyre's pressure in five steps of 20%: green (80-100%), yellow, orange, red,
// and flashing red when it's below 20%. A tyre that has shredded off down to
// the rim shows as a grey bar. The number on each bar is its temperature:
// blue when cold, green in its working range, red when too hot.
export function tempColour(temp, win) {
  if (!win || temp == null) return '#e8e8e8';
  if (temp < win.lo) return '#4aa8ff';
  if (temp > win.hi) return '#ff3b30';
  return '#2bdc4a';
}
const PRESSURE_COLOURS = [COLORS.ledRed, '#ff3b30', '#ff8a1f', '#ffd23a', COLORS.ledGreen];
class TyreBars {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  resize(height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.round(height * 0.62);
    this.h = Math.round(height);
    this.dpr = dpr;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
  }

  draw(tyres, compound, time, win) {
    const g = this.ctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    const pad = this.h * 0.06;
    const labelH = this.h * 0.2;
    // Dark backing plate so the bars read over the sky or the road
    g.fillStyle = 'rgba(14, 16, 19, 0.72)';
    roundRect(g, 0, 0, this.w, this.h, this.h * 0.08);
    g.fill();
    const gapX = this.w * 0.16, gapY = this.h * 0.08;
    const bw = (this.w - 2 * pad - gapX) / 2;
    const bh = (this.h - 2 * pad - labelH - gapY) / 2;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([col, row], i) => {   // FL FR / RL RR
      const t = tyres?.[i] ?? { wear: 0, pressure: 1 };
      const x = pad + col * (bw + gapX);
      const y = pad + row * (bh + gapY);
      const worn = Math.max(0, Math.min(1, t.wear));
      if (t.rim) {
        g.fillStyle = COLORS.chromeDark;                 // no tyre left: just the rim
        g.fillRect(x, y, bw, bh);
      } else {
        g.fillStyle = COLORS.ink;                        // remaining tread
        g.fillRect(x, y, bw, bh);
        g.fillStyle = COLORS.redline;                    // worn away
        g.fillRect(x, y, bw, bh * worn);
      }
      // Pressure around the bar: one colour per 20% step
      const step = Math.min(4, Math.floor(Math.max(0, t.pressure ?? 1) * 5));
      let ring = PRESSURE_COLOURS[step];
      if (step === 0 && Math.floor(time * 4) % 2 === 1) ring = null;   // bottom 20%: flashing
      if (ring) {
        g.strokeStyle = ring;
        g.lineWidth = Math.max(1.5, this.h * 0.035);
        g.strokeRect(x - 1.5, y - 1.5, bw + 3, bh + 3);
      }
      // Temperature, on a dark tab across the middle of the bar
      if (!t.rim && t.temp != null) {
        const th = Math.min(bh * 0.42, bw * 0.62);
        g.fillStyle = 'rgba(8, 10, 12, 0.82)';
        g.fillRect(x, y + bh / 2 - th / 2, bw, th);
        g.fillStyle = tempColour(t.temp, win);
        g.font = `700 ${Math.round(th * 0.82)}px ${FONT}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(String(Math.round(t.temp)), x + bw / 2, y + bh / 2 + 0.5);
      }
    });
    g.fillStyle = COLORS.inkSoft;
    g.font = `600 ${Math.round(labelH * 0.72)}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(compound || 'Tyres', this.w / 2, this.h - pad - labelH / 2);
  }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------------------------------------------------------------------
// The dashboard
// ---------------------------------------------------------------------
export class Hud {
  constructor({ redline, maxSpeed = 240, onTransmission, onAssist, onTyres, tyreOptions = {}, compact = false,
                timeSpeeds = [60], onSky = {}, onWhatsNew = null, track = 'test', onTrack = null }) {
    this.timeSpeeds = timeSpeeds;
    this.onSky = onSky;
    this.onTyres = onTyres;
    this.tyreOptions = tyreOptions;
    this.compact = compact;   // mini gauges for phones and tablets
    this.redline = redline;
    this.onTransmission = onTransmission;
    this.onAssist = onAssist;

    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    // Dials
    const maxRpm = Math.ceil((redline + 800) / 1000) * 1000;
    this.tach = new Dial({
      max: maxRpm, major: 1000, minor: 250, labelEvery: 1000, labelScale: 0.001,
      redFrom: redline, caption: 'rpm × 1000',
    });
    this.speedo = new Dial({
      max: maxSpeed, major: 20, minor: 10, labelEvery: 40, caption: 'km/h',
    });
    // Small gauges, stacked: fuel on top (red below 12%), engine oil below (red below 30%)
    this.fuelGauge = new Dial({
      max: 100, major: 25, minor: 12.5, labelEvery: 100, redBelow: 12,
      labels: { 0: 'E', 100: 'F' }, labelSize: 0.3,
    });
    this.oilGauge = new Dial({
      max: 100, major: 25, minor: 12.5, labelEvery: 100, redBelow: 30,
      labels: { 0: 'E', 100: 'F' }, labelSize: 0.3,
    });
    const smallGauges = document.createElement('div');
    smallGauges.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    smallGauges.append(this.fuelGauge.canvas, this.oilGauge.canvas);
    const dash = document.createElement('div');
    dash.id = 'dash';
    if (compact) dash.classList.add('compact');
    this.dash = dash;
    this.tyreBars = new TyreBars();
    this.tyreBars.canvas.classList.add('tyre-bars');
    dash.append(this.tyreBars.canvas, this.tach.canvas, this.speedo.canvas, smallGauges);
    document.body.appendChild(dash);

    // (The old "Clutch engaged" line is gone: the clutch pedal in the
    // cockpit shows it now. Kept off-screen so nothing else has to change.)
    this.clutchText = document.createElement('div');
    this.clutchText.id = 'clutch-status';

    // Side panel: an arrow on the right edge opens Gearbox and Assists
    this.side = document.createElement('div');
    this.side.id = 'sidepanel';
    const handle = document.createElement('button');
    handle.className = 'sp-handle';
    handle.type = 'button';
    handle.setAttribute('aria-label', 'Car settings');
    handle.setAttribute('aria-expanded', 'false');
    handle.innerHTML = '<svg class="sp-gear" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>'
      + '<svg class="sp-arrow" width="12" height="20" viewBox="0 0 12 20" aria-hidden="true">'
      + '<path d="M9 3 L3 10 L9 17" fill="none" stroke="currentColor" stroke-width="2.4" '
      + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (compact) this.side.classList.add('compact');
    // Pulse the tab until the first time it's opened (remembered)
    let seen = false;
    try { seen = localStorage.getItem('tracktester-panel-seen') === '1'; } catch (e) { /* storage blocked */ }
    if (!seen) this.side.classList.add('hint');
    handle.addEventListener('click', () => {
      const open = this.side.classList.toggle('open');
      if (open && this.side.classList.contains('hint')) {
        this.side.classList.remove('hint');
        try { localStorage.setItem('tracktester-panel-seen', '1'); } catch (e) { /* storage blocked */ }
      }
      handle.setAttribute('aria-expanded', String(open));
      // Lets the touch controls step out of the way while the panel is open
      window.dispatchEvent(new CustomEvent('sidepanel', { detail: { open } }));
      handle.blur();   // so Space (handbrake) doesn't press it again
    });
    const panel = document.createElement('div');
    panel.className = 'sp-panel';

    // Gearbox: pick one
    const gearHeading = document.createElement('div');
    gearHeading.className = 'sp-heading';
    gearHeading.id = 'sp-gearbox';
    gearHeading.textContent = 'Gearbox';
    const gearGroup = document.createElement('div');
    gearGroup.setAttribute('role', 'radiogroup');
    gearGroup.setAttribute('aria-labelledby', 'sp-gearbox');
    gearGroup.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    this.options = {};
    for (const g of GEARBOXES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gb-option';
      b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="gb-name">${g.name}</span><span class="gb-note">${g.note}</span>`;
      b.addEventListener('click', () => {
        this.onTransmission?.(g.id);
        b.blur();
      });
      gearGroup.appendChild(b);
      this.options[g.id] = b;
    }

    // Assists: level sliders, 0 (off) to 5 (strongest)
    const assistHeading = document.createElement('div');
    assistHeading.className = 'sp-heading';
    assistHeading.textContent = 'Assists';
    this.sliders = {};
    const assistButtons = ASSISTS.map((a) => {
      const box = document.createElement('div');
      box.className = 'assist';
      const id = `assist-${a.id}`;
      box.innerHTML = `<label class="gb-name" for="${id}">${a.name}</label>`
        + `<span class="assist-level" aria-hidden="true"></span>`
        + `<span class="gb-note">${a.note}</span>`
        + `<input id="${id}" type="range" min="0" max="5" step="1">`
        + `<span class="scale" aria-hidden="true"><span>Off</span><span>5</span></span>`;
      const input = box.querySelector('input');
      input.addEventListener('input', () => this.onAssist?.(a.id, Number(input.value)));
      // Let go of the slider afterwards, so the arrow keys go back to steering
      const release = () => input.blur();
      input.addEventListener('change', release);
      input.addEventListener('pointerup', release);
      this.sliders[a.id] = { input, label: box.querySelector('.assist-level') };
      return box;
    });

    // Tyres: one dropdown (grouped by type) so the panel stays short
    const tyreHeading = document.createElement('div');
    tyreHeading.className = 'sp-heading';
    tyreHeading.textContent = 'Tyres';
    const tyreBox = document.createElement('div');
    tyreBox.className = 'tyre-box';
    const select = document.createElement('select');
    select.id = 'tyre-select';
    select.setAttribute('aria-label', 'Tyre compound');
    const groups = {};
    for (const [id, t] of Object.entries(this.tyreOptions)) {
      if (!groups[t.group]) {
        groups[t.group] = document.createElement('optgroup');
        groups[t.group].label = t.group;
        select.appendChild(groups[t.group]);
      }
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = t.name;
      groups[t.group].appendChild(opt);
    }
    select.addEventListener('change', () => {
      this.onTyres?.(select.value);
      select.blur();   // give the arrow keys back to steering
    });
    const note = document.createElement('span');
    note.className = 'gb-note';
    note.textContent = 'Changing fits a fresh set';
    const fresh = document.createElement('button');
    fresh.type = 'button';
    fresh.className = 'tyre-fresh';
    fresh.textContent = 'Fit a fresh set';
    fresh.addEventListener('click', () => {
      this.onTyres?.(select.value);
      fresh.blur();
    });
    tyreBox.append(select, note, fresh);
    this.tyreSelect = select;

    // Time and weather
    const skyHeading = document.createElement('div');
    skyHeading.className = 'sp-heading';
    skyHeading.textContent = 'Time & weather';
    const skyBox = document.createElement('div');
    skyBox.className = 'tyre-box';
    skyBox.innerHTML = `
      <div class="tw-top"><span class="tw-clock">--:--</span>
        <button type="button" class="tyre-fresh tw-lock" aria-pressed="false">Lock time</button></div>
      <label class="tw-row" for="tw-time"><span>Time of day</span></label>
      <input id="tw-time" type="range" min="0" max="24" step="0.25">
      <label class="tw-row" for="tw-speed"><span>Time speed</span><span class="tw-value tw-speed-label"></span></label>
      <input id="tw-speed" type="range" min="0" max="${this.timeSpeeds.length - 1}" step="1">
      <span class="gb-note tw-speed-note"></span>
      <label class="tw-row" for="tw-weather"><span>Weather</span></label>
      <select id="tw-weather">
        <option value="clear">Clear</option><option value="cloudy">Cloudy</option>
        <optgroup label="Rain"><option value="drizzle">Drizzle</option><option value="light">Light rain</option>
        <option value="moderate">Moderate rain</option><option value="heavy">Heavy rain</option>
        <option value="storm">Thunderstorm</option></optgroup>
      </select>
      <label class="tw-check"><input type="checkbox" class="tw-changing"> Changes by itself</label>
      <span class="gb-note tw-now"></span>`;
    const q = (sel) => skyBox.querySelector(sel);
    this.tw = {
      clock: q('.tw-clock'), lock: q('.tw-lock'), time: q('#tw-time'), speed: q('#tw-speed'),
      speedLabel: q('.tw-speed-label'), speedNote: q('.tw-speed-note'),
      weather: q('#tw-weather'), changing: q('.tw-changing'), now: q('.tw-now'),
    };
    // Let go of a control afterwards so the keys go back to driving. (A
    // dropdown only once something is picked: letting go on pointerup would
    // close its list the moment it opens.)
    const letGo = (el) => {
      el.addEventListener('change', () => el.blur());
      if (el.tagName !== 'SELECT') el.addEventListener('pointerup', () => el.blur());
    };
    this.tw.time.addEventListener('input', () => this.onSky.time?.(Number(this.tw.time.value)));
    this.tw.speed.addEventListener('input', () => this.onSky.speed?.(this.timeSpeeds[Number(this.tw.speed.value)]));
    this.tw.lock.addEventListener('click', () => {
      this.onSky.lock?.(this.tw.lock.getAttribute('aria-pressed') !== 'true');
      this.tw.lock.blur();
    });
    this.tw.weather.addEventListener('change', () => this.onSky.weather?.(this.tw.weather.value));
    this.tw.changing.addEventListener('change', () => this.onSky.changing?.(this.tw.changing.checked));
    [this.tw.time, this.tw.speed, this.tw.weather, this.tw.changing].forEach(letGo);

    // The clock in the corner of the screen
    this.clockText = document.createElement('div');
    this.clockText.id = 'clock';
    document.body.appendChild(this.clockText);

    // Where to drive: picking another place reloads the game to build it
    const trackHeading = document.createElement('div');
    trackHeading.className = 'sp-heading';
    trackHeading.textContent = 'Track';
    const trackBox = document.createElement('div');
    trackBox.className = 'tyre-box';
    const trackSel = document.createElement('select');
    trackSel.setAttribute('aria-label', 'Track');
    trackSel.innerHTML = '<option value="test">Test area</option><option value="sepang">Sepang (flat mock-up)</option>';
    trackSel.value = track;
    trackSel.addEventListener('change', () => { trackSel.blur(); onTrack?.(trackSel.value); });
    const trackNote = document.createElement('span');
    trackNote.className = 'gb-note';
    trackNote.textContent = 'Changing reloads the game';
    trackBox.append(trackSel, trackNote);

    // What's new: the update screen, any time
    const newsBtn = document.createElement('button');
    newsBtn.type = 'button';
    newsBtn.className = 'tyre-fresh';
    newsBtn.style.marginTop = '14px';
    newsBtn.textContent = "What's new";
    newsBtn.addEventListener('click', () => { newsBtn.blur(); onWhatsNew?.(); });

    panel.append(trackHeading, trackBox, gearHeading, gearGroup, assistHeading, ...assistButtons, tyreHeading, tyreBox, skyHeading, skyBox, newsBtn);
    this.side.append(handle, panel);
    document.body.appendChild(this.side);

    this.layout();
    window.addEventListener('resize', () => this.layout());
    // Redraw the dial faces once the dashboard font has loaded
    if (document.fonts?.load) {
      document.fonts.load(`600 20px "Barlow Condensed"`).then(() => this.layout()).catch(() => {});
    }
  }

  // Size the dials to the screen: smaller on phones
  layout() {
    const short = Math.min(window.innerWidth, window.innerHeight);
    const tachSize = this.compact
      ? Math.round(Math.min(120, Math.max(84, short * 0.24)))   // mini cluster
      : Math.round(Math.min(200, Math.max(120, short * 0.3)));
    // The clutch line sits just under the mini cluster, or at the very top
    this.clutchText.style.top = this.compact ? `calc(${tachSize + 12}px + env(safe-area-inset-top))` : '6px';
    this.tach.resize(tachSize);
    this.speedo.resize(Math.round(tachSize * 0.82));
    this.fuelGauge.resize(Math.round(tachSize * 0.42));
    this.oilGauge.resize(Math.round(tachSize * 0.42));
    this.tyreBars.resize(Math.round(tachSize * (this.compact ? 0.62 : 0.5)));   // a bit bigger on phones
  }

  // Time and weather: the corner clock and the side panel follow the game
  // (but never fight a control you're dragging)
  updateSky({ clock, hours, speed, locked, weather, changing, now }) {
    const lockedMark = locked ? ' (locked)' : '';
    if (this.clockText.textContent !== clock + lockedMark) this.clockText.textContent = clock + lockedMark;
    const tw = this.tw;
    if (tw.clock.textContent !== clock) tw.clock.textContent = clock;
    if (document.activeElement !== tw.time && Math.abs(Number(tw.time.value) - hours) > 0.2) tw.time.value = String(hours);
    const si = Math.max(0, this.timeSpeeds.indexOf(speed));
    if (document.activeElement !== tw.speed && tw.speed.value !== String(si)) tw.speed.value = String(si);
    const speedLabel = speed === 1 ? 'Real time' : `${speed}x`;
    if (tw.speedLabel.textContent !== speedLabel) {
      tw.speedLabel.textContent = speedLabel;
      const mins = (24 * 60) / speed;
      tw.speedNote.textContent = speed === 1 ? 'A day takes a day'
        : mins >= 60 ? `A day takes ${+(mins / 60).toFixed(1)} hours` : `A day takes ${Math.round(mins)} minutes`;
    }
    tw.lock.setAttribute('aria-pressed', String(locked));
    const lockText = locked ? 'Time locked' : 'Lock time';
    if (tw.lock.textContent !== lockText) tw.lock.textContent = lockText;
    if (document.activeElement !== tw.weather && tw.weather.value !== weather) tw.weather.value = weather;
    tw.weather.disabled = changing;           // it's in charge of itself while changing
    tw.changing.checked = changing;
    const nowText = changing ? `Now: ${now}` : '';
    if (tw.now.textContent !== nowText) tw.now.textContent = nowText;
  }

  // The dashboard's drawings, for the car's own dash screen to copy
  get parts() {
    return { tyres: this.tyreBars.canvas, tach: this.tach.canvas, speedo: this.speedo.canvas,
             fuel: this.fuelGauge.canvas, oil: this.oilGauge.canvas };
  }

  // In the driver's-eye view the dials are on the car's own dashboard, so
  // the on-screen ones are hidden
  setInCar(on) {
    this.dash.style.display = on ? 'none' : '';
  }

  update({ speedKmh, rpm, gearLabel, limiter, transmission, engineHealth = 1, oilLevel = 1,
           fuelLevel = 1, assists = {}, clutchIn = false, tyres = null, tyreCompound = 'SM', tyreWindow = null, lights = 0, lightsAuto = false, sky = null, time,
           warnings = {} }) {
    if (sky) this.updateSky(sky);
    this.tyreBars.draw(tyres, tyreCompound, time, tyreWindow);
    if (this.tyreSelect && document.activeElement !== this.tyreSelect && this.tyreSelect.value !== tyreCompound) {
      this.tyreSelect.value = tyreCompound;
    }
    // --- Clutch status ---
    const clutchWords = clutchIn ? 'Clutch disengaged' : 'Clutch engaged';
    if (this.clutchText.textContent !== clutchWords) {
      this.clutchText.textContent = clutchWords;
      this.clutchText.classList.toggle('out', clutchIn);
    }

    // --- Rev counter, with the gear in the gap at the bottom ---
    const t = this.tach;
    t.beginFrame();
    const tg = t.ctx;
    const tR = t.size / 2;
    // Engine health, only shown once a bad over-rev has damaged it
    if (fuelLevel <= 0 && engineHealth > 0) {
      tg.fillStyle = COLORS.redline;
      tg.font = `600 ${Math.round(tR * 0.13)}px ${FONT}`;
      tg.textAlign = 'center';
      tg.textBaseline = 'middle';
      tg.fillText('Out of fuel', tR, tR - tR * 0.28);
    } else if (engineHealth < 0.75) {
      // Check engine light: steady orange below 75%, flashing red below 20%
      const critical = engineHealth < 0.2;
      if (!critical || Math.floor(time * 3) % 2 === 0) {
        drawCheckEngine(tg, tR, tR - tR * 0.3, tR * 0.36, critical ? COLORS.redline : COLORS.ledAmber);
      }
    }
    // Headlights on: a small green (dipped) or blue (main beam) lamp, left of the needle hub
    if (lights) {
      drawHeadlightLamp(tg, tR - tR * 0.3, tR + tR * 0.08, tR * 0.28, lights === 2);
      if (lightsAuto) {                   // an A beside it: the lights are on automatically
        tg.fillStyle = lights === 2 ? '#3b8cff' : '#39c86a';
        tg.font = `700 ${Math.round(tR * 0.13)}px ${FONT}`;
        tg.textAlign = 'center';
        tg.textBaseline = 'middle';
        tg.fillText('A', tR - tR * 0.11, tR + tR * 0.1);
      }
    }
    tg.fillStyle = limiter ? COLORS.redline : COLORS.ink;
    tg.font = `700 ${Math.round(tR * 0.42)}px ${FONT}`;
    tg.textAlign = 'center';
    tg.textBaseline = 'middle';
    tg.fillText(gearLabel, tR, tR + tR * 0.62);
    t.drawNeedle(rpm);

    // --- Speedometer, with shift lights in the centre ---
    const s = this.speedo;
    s.beginFrame();
    const sg = s.ctx;
    const sR = s.size / 2;
    this.drawShiftLights(sg, sR, sR - sR * 0.18, sR, rpm, limiter, transmission, time);
    // Warning lamps in a row across the middle: only the ones that are on
    //   ABS:       flashes while it's stopping the wheels locking; steady if switched off
    //   TCS:       flashes while it's cutting power; steady (with OFF) if switched off
    //   skid:      flashes while the car is sliding sideways
    //   handbrake: red while it's pulled
    //   engine temperature: amber when hot, flashing red when boiling
    {
      const w = warnings;
      const flash = Math.floor(time * 6) % 2 === 0;
      const lamps = [];
      if (w.absWorking) { if (flash) lamps.push((x) => drawAbsLamp(sg, x, ly, lw, COLORS.ledAmber)); else lamps.push(null); }
      else if (w.absOff) lamps.push((x) => drawAbsLamp(sg, x, ly, lw, COLORS.ledAmber));
      if (w.tcsWorking) { if (flash) lamps.push((x) => drawTcsLamp(sg, x, ly, lw, COLORS.ledAmber, false)); else lamps.push(null); }
      else if (w.tcsOff) lamps.push((x) => drawTcsLamp(sg, x, ly, lw, COLORS.ledAmber, true));
      if (w.skid) { if (flash) lamps.push((x) => drawSkidLamp(sg, x, ly, lw, COLORS.ledAmber)); else lamps.push(null); }
      if (w.handbrake) lamps.push((x) => drawHandbrakeLamp(sg, x, ly, lw, COLORS.redline));
      if (w.coolant > 0.95) { if (flash) lamps.push((x) => drawCoolantLamp(sg, x, ly, lw, COLORS.redline)); else lamps.push(null); }
      else if (w.coolant > 0.8) lamps.push((x) => drawCoolantLamp(sg, x, ly, lw, COLORS.ledAmber));
      const lw = sR * 0.3, ly = sR + sR * 0.22, gap = sR * 0.34;
      lamps.forEach((draw, k) => draw?.(sR + (k - (lamps.length - 1) / 2) * gap));
    }
    sg.fillStyle = COLORS.ink;
    sg.font = `700 ${Math.round(sR * 0.34)}px ${FONT}`;
    sg.textAlign = 'center';
    sg.textBaseline = 'middle';
    sg.fillText(String(Math.round(speedKmh)), sR, sR + sR * 0.62);
    s.drawNeedle(speedKmh);

    // --- Small gauges: the needle turns red and the label flashes when low ---
    this.drawSmallGauge(this.fuelGauge, 'Fuel', fuelLevel, 0.1, time, true);
    const o = this.oilGauge;
    o.beginFrame();
    const og = o.ctx;
    const oR = o.size / 2;
    const lowOil = oilLevel < 0.3;
    if (!lowOil || Math.floor(time * 3) % 2 === 0) {
      og.fillStyle = lowOil ? COLORS.redline : COLORS.inkSoft;
      og.font = `600 ${Math.round(oR * 0.3)}px ${FONT}`;
      og.textAlign = 'center';
      og.textBaseline = 'middle';
      og.fillText('Oil', oR, oR - oR * 0.38);
    }
    o.drawNeedle(oilLevel * 100, lowOil ? COLORS.redline : COLORS.needle);

    // --- Side panel: show the current gearbox and assist switches ---
    for (const [id, b] of Object.entries(this.options)) {
      const active = id === transmission;
      b.classList.toggle('active', active);
      b.setAttribute('aria-checked', String(active));
    }
    for (const [id, { input, label }] of Object.entries(this.sliders)) {
      const level = assists[id] === true ? 5 : Number(assists[id]) || 0;
      if (document.activeElement !== input && Number(input.value) !== level) input.value = String(level);
      const text = level === 0 ? 'Off' : `Level ${level}`;
      if (label.textContent !== text) {
        label.textContent = text;
        label.classList.toggle('off', level === 0);
        input.setAttribute('aria-valuetext', text);
      }
    }
  }

  drawSmallGauge(dial, label, level, lowAt, time, pump = false) {
    dial.beginFrame();
    const g = dial.ctx;
    const R = dial.size / 2;
    const low = level < lowAt;
    if (pump) {
      // the fuel gauge shows a pump, with the filler-side arrow (flashes when low)
      if (!low || Math.floor(time * 3) % 2 === 0) drawFuelPump(g, R, R - R * 0.36, R * 0.62, low ? COLORS.redline : COLORS.inkSoft, -1);
    } else if (!low || Math.floor(time * 3) % 2 === 0) {
      g.fillStyle = low ? COLORS.redline : COLORS.inkSoft;
      g.font = `600 ${Math.round(R * 0.3)}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(label, R, R - R * 0.38);
    }
    dial.drawNeedle(level * 100, low ? COLORS.redline : COLORS.needle);
  }

  // Seven dots that fill up as the revs rise, then flash blue: time to shift
  drawShiftLights(g, cx, cy, R, rpm, limiter, transmission, time) {
    const count = 7;
    const from = this.redline * 0.7;
    const to = this.redline * 0.96;
    const lit = Math.max(0, Math.min(count, Math.floor(((rpm - from) / (to - from)) * count + 0.5)));
    const shiftNow = transmission === 'manual' && (rpm >= to || limiter);
    const flashOn = Math.floor(time * 8) % 2 === 0;
    const gap = R * 0.11;
    const dot = R * 0.045;
    const x0 = cx - (gap * (count - 1)) / 2;
    for (let i = 0; i < count; i++) {
      let color = COLORS.ledOff;
      if (shiftNow) color = flashOn ? COLORS.ledShift : COLORS.ledOff;
      else if (i < lit) color = i < 3 ? COLORS.ledGreen : i < 5 ? COLORS.ledAmber : COLORS.ledRed;
      g.beginPath();
      g.arc(x0 + i * gap, cy, dot, 0, Math.PI * 2);
      g.fillStyle = color;
      if (color !== COLORS.ledOff) {
        g.shadowColor = color;
        g.shadowBlur = dot * 2.5;
      }
      g.fill();
      g.shadowBlur = 0;
    }
  }
}
