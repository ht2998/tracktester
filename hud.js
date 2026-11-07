// =====================================================================
// HUD: the dashboard on screen.
//   - Rev counter (tachometer) with the gear shown at the bottom
//   - Speedometer with shift-light dots in the centre
//   - A slide-out tab on the right to choose the gearbox
// The dials' fixed parts (bezel, ticks, numbers) are drawn once and
// reused; only the needles and lights are redrawn each frame.
// =====================================================================

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
// Styles for the dashboard and the gearbox tab
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

#gearbox {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(var(--gb-shift, 100%));
  display: flex;
  align-items: center;
  font-family: ${FONT};
  transition: transform 220ms ease;
  --gb-shift: calc(100% - 34px);
}
#gearbox.open { --gb-shift: 0px; }
@media (prefers-reduced-motion: reduce) { #gearbox { transition: none; } }

#gearbox .gb-handle {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  width: 34px;
  padding: 14px 0;
  border: none;
  border-radius: 0 10px 10px 0;
  background: #1d2127;
  color: ${COLORS.ink};
  font: 600 15px ${FONT};
  letter-spacing: 0.04em;
  cursor: pointer;
}
#gearbox .gb-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: rgba(21, 24, 28, 0.92);
  border-radius: 12px 0 0 12px;
}
#gearbox .gb-option {
  display: grid;
  grid-template-columns: 6px 1fr;
  column-gap: 10px;
  align-items: center;
  min-width: 170px;
  padding: 9px 12px 9px 8px;
  border: 1px solid #2c3139;
  border-radius: 8px;
  background: transparent;
  color: ${COLORS.ink};
  text-align: left;
  cursor: pointer;
  font-family: ${FONT};
}
#gearbox .gb-option::before {
  content: '';
  grid-row: span 2;
  width: 6px;
  height: 100%;
  border-radius: 3px;
  background: #2c3139;
}
#gearbox .gb-option.active { border-color: ${COLORS.needle}; }
#gearbox .gb-option.active::before { background: ${COLORS.needle}; }
#gearbox .gb-name { font-size: 18px; font-weight: 600; line-height: 1.1; }
#gearbox .gb-note { font-size: 14px; font-weight: 500; color: ${COLORS.inkSoft}; }
#gearbox button:focus-visible { outline: 2px solid ${COLORS.needle}; outline-offset: 2px; }
#gearbox .gb-option:hover { background: rgba(242, 239, 230, 0.05); }
`;

const GEARBOXES = [
  { id: 'manual', name: 'Manual', note: 'Shift with Q / E or , / .' },
  { id: 'auto', name: 'Automatic', note: 'Shifts for you' },
  { id: 'cvt', name: 'CVT', note: 'No gears, smooth revs' },
];

// ---------------------------------------------------------------------
// The dashboard
// ---------------------------------------------------------------------
export class Hud {
  constructor({ redline, maxSpeed = 240, onTransmission }) {
    this.redline = redline;
    this.onTransmission = onTransmission;

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
    // Small engine-oil gauge: empty to full, red below 30%
    this.oilGauge = new Dial({
      max: 100, major: 25, minor: 12.5, labelEvery: 100, redBelow: 30,
      labels: { 0: 'E', 100: 'F' }, labelSize: 0.3,
    });
    const dash = document.createElement('div');
    dash.id = 'dash';
    dash.append(this.tach.canvas, this.speedo.canvas, this.oilGauge.canvas);
    document.body.appendChild(dash);

    // Gearbox tab
    this.gearbox = document.createElement('div');
    this.gearbox.id = 'gearbox';
    const handle = document.createElement('button');
    handle.className = 'gb-handle';
    handle.type = 'button';
    handle.textContent = 'Gearbox';
    handle.setAttribute('aria-expanded', 'false');
    handle.addEventListener('click', () => {
      const open = this.gearbox.classList.toggle('open');
      handle.setAttribute('aria-expanded', String(open));
      handle.blur();   // so Space (handbrake) doesn't press it again
    });
    const panel = document.createElement('div');
    panel.className = 'gb-panel';
    panel.setAttribute('role', 'radiogroup');
    panel.setAttribute('aria-label', 'Gearbox');
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
      panel.appendChild(b);
      this.options[g.id] = b;
    }
    this.gearbox.append(handle, panel);
    document.body.appendChild(this.gearbox);

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
    const tachSize = Math.round(Math.min(200, Math.max(120, short * 0.3)));
    this.tach.resize(tachSize);
    this.speedo.resize(Math.round(tachSize * 0.82));
    this.oilGauge.resize(Math.round(tachSize * 0.42));
  }

  update({ speedKmh, rpm, gearLabel, limiter, transmission, engineHealth = 1, oilLevel = 1, time }) {
    // --- Rev counter, with the gear in the gap at the bottom ---
    const t = this.tach;
    t.beginFrame();
    const tg = t.ctx;
    const tR = t.size / 2;
    // Engine health, only shown once a bad over-rev has damaged it
    if (engineHealth < 0.995) {
      let text = `Engine ${Math.round(engineHealth * 100)}%`;
      if (engineHealth <= 0) text = 'Engine failure';
      else if (engineHealth < 0.1) text += ', oil leak';
      tg.fillStyle = engineHealth < 0.5 ? COLORS.redline : COLORS.ledAmber;
      tg.font = `600 ${Math.round(tR * 0.13)}px ${FONT}`;
      tg.textAlign = 'center';
      tg.textBaseline = 'middle';
      tg.fillText(text, tR, tR - tR * 0.28);
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
    sg.fillStyle = COLORS.ink;
    sg.font = `700 ${Math.round(sR * 0.34)}px ${FONT}`;
    sg.textAlign = 'center';
    sg.textBaseline = 'middle';
    sg.fillText(String(Math.round(speedKmh)), sR, sR + sR * 0.62);
    s.drawNeedle(speedKmh);

    // --- Oil gauge: needle turns red and the label flashes when critically low ---
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

    // --- Gearbox tab highlight ---
    for (const [id, b] of Object.entries(this.options)) {
      const active = id === transmission;
      b.classList.toggle('active', active);
      b.setAttribute('aria-checked', String(active));
    }
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
