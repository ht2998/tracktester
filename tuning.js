// =====================================================================
// TUNING: the car's settings sheet, like GT7's. Tyres, suspension (ride
// height, anti-roll bars, damping, spring frequency, camber, toe), the
// limited-slip differential, aerodynamics, engine output and restrictor,
// ballast, brake balance and the gearbox. Opened from the garage, beside
// Change car. Saved for each car; a setting left alone stays exactly as
// the car was built, so a car nobody's tuned drives as it always did.
// =====================================================================
import { TYRES } from './physics.js';
export const BUILD = 2;

const KEY = 'tracktester-tune-';
export function loadTune(kind) {
  try { return JSON.parse(localStorage.getItem(KEY + kind) || 'null') || {}; } catch (e) { return {}; }
}
export function saveTune(kind, tune) {
  try { if (Object.keys(tune).length) localStorage.setItem(KEY + kind, JSON.stringify(tune)); else localStorage.removeItem(KEY + kind); } catch (e) { /* storage blocked */ }
}

// ---- what the car has as built, in the sheet's own units ----
const cornerMass = (s, front) => {
  const L = s.cgToFront + s.cgToRear;
  return s.mass * (front ? s.cgToRear : s.cgToFront) / L / 2;
};
const freqOf = (k, m) => Math.sqrt(k / m) / (2 * Math.PI);
// (the bars' range: as built, the stiffer of the two sits about halfway, at 5; 10 is a bit over twice that)
const arbMax = (s) => { const a = Math.max(s.suspension.arbFront, s.suspension.arbRear); return a > 0 ? a / 0.45 : 0.6 * (s.suspension.springFront + s.suspension.springRear) / 2; };
const peakPower = (curve) => { let w = 0; for (const [r, nm] of curve) w = Math.max(w, nm * r * Math.PI / 30); return w; };
// (camber: lateral grip gained (or lost) against none at all; best near 3°)
const camberLat = (deg) => 1 + 0.07 * (1 - ((deg - 3) / 3) ** 2);
const camberLong = (deg) => 1 - 0.014 * deg;

export function stockTune(s) {
  const su = s.suspension, mf = cornerMass(s, true), mr = cornerMass(s, false);
  const ratio = (c, k, m) => c / (2 * Math.sqrt(k * m)) * 100;
  return {
    heightF: s.rideHeightFront ?? (s.wings ? 40 : 110), heightR: s.rideHeightRear ?? (s.wings ? 60 : 120),
    arbF: Math.max(1, Math.min(10, Math.round(1 + 9 * su.arbFront / arbMax(s)))), arbR: Math.max(1, Math.min(10, Math.round(1 + 9 * su.arbRear / arbMax(s)))),
    compF: Math.round(ratio(su.damperFront, su.springFront, mf)), compR: Math.round(ratio(su.damperRear, su.springRear, mr)),
    rebF: Math.round(ratio(su.reboundFront ?? su.damperFront, su.springFront, mf)), rebR: Math.round(ratio(su.reboundRear ?? su.damperRear, su.springRear, mr)),
    freqF: +freqOf(su.springFront, mf).toFixed(2), freqR: +freqOf(su.springRear, mr).toFixed(2),
    camberF: s.camberFront ?? (s.wings ? 3.0 : 1.5), camberR: s.camberRear ?? (s.wings ? 1.5 : 1.0),
    toeF: 0, toeR: 0,
    lsdInit: 10, lsdAccel: 20, lsdBrake: 10,
    aeroF: s.wings ? Math.round(s.downforce * s.downforceFront * 55.6 * 55.6 / 9.81) : 0,
    aeroR: s.wings ? Math.round(s.downforce * (1 - s.downforceFront) * 55.6 * 55.6 / 9.81) : 0,
    ecu: 100, restrictor: 100, ballast: 0, ballastPos: 0, brakeBal: 0,
    gears: s.gears.slice(), finalDrive: s.finalDrive,
  };
}

// ---- the sheet's settings put onto the car's physics ----
export function withTune(s, tune) {
  if (!tune || !Object.keys(tune).length) return s;
  const st = stockTune(s), v = (k) => (tune[k] ?? st[k]);
  const out = { ...s, suspension: { ...s.suspension } }, su = out.suspension;
  // ballast first: it moves the weight, so everything that hangs off the weight follows
  if (tune.ballast) {
    const L = s.cgToFront + s.cgToRear, kg = tune.ballast;
    const at = L / 2 - (v('ballastPos') / 50) * (L / 2);        // (+50: over the front axle, -50: over the rear)
    const cgF = (s.mass * s.cgToFront + kg * at) / (s.mass + kg);
    out.mass = s.mass + kg; out.cgToFront = cgF; out.cgToRear = L - cgF;
    out.inertia = s.inertia + kg * (at - cgF) ** 2 + s.mass * (s.cgToFront - cgF) ** 2;
  }
  const mf = cornerMass(out, true), mr = cornerMass(out, false);
  // springs (natural frequency), then dampers as a share of critical
  const kF = tune.freqF != null || tune.ballast ? mf * (2 * Math.PI * v('freqF')) ** 2 : s.suspension.springFront;
  const kR = tune.freqR != null || tune.ballast ? mr * (2 * Math.PI * v('freqR')) ** 2 : s.suspension.springRear;
  su.springFront = kF; su.springRear = kR;
  const crit = (k, m) => 2 * Math.sqrt(k * m);
  const anyDamp = ['freqF', 'freqR', 'compF', 'compR', 'rebF', 'rebR', 'ballast'].some((k) => tune[k] != null);
  if (anyDamp) {
    su.damperFront = v('compF') / 100 * crit(kF, mf); su.damperRear = v('compR') / 100 * crit(kR, mr);
    su.reboundFront = v('rebF') / 100 * crit(kF, mf); su.reboundRear = v('rebR') / 100 * crit(kR, mr);
  }
  if (tune.arbF != null) su.arbFront = (tune.arbF - 1) / 9 * arbMax(s);
  if (tune.arbR != null) su.arbRear = (tune.arbR - 1) / 9 * arbMax(s);
  // ride height: lower, the weight's lower and the floor works harder (more
  // downforce), but there's less travel before it bottoms out; rake (the
  // nose lower than the tail) moves the downforce forward
  const dF = (v('heightF') - st.heightF) / 1000, dR = (v('heightR') - st.heightR) / 1000;
  if (dF || dR) {
    out.cgHeight = Math.max(0.05, s.cgHeight + (dF + dR) / 2 * 0.9);
    su.bumpStop = Math.max(0.012, su.bumpStop + Math.min(dF, dR) * 0.8);
    if (s.wings || s.downforce > 1) {
      out.downforce = (out.downforce ?? s.downforce) * (1 - (dF + dR) / 2 * 4);
      out.downforceFront = Math.min(0.75, Math.max(0.2, s.downforceFront + (dR - dF) * 2));
    }
  }
  // camber and toe (relative to how it was built: as built, nothing changes)
  if (tune.camberF != null || tune.camberR != null) {
    out.camberLat = [camberLat(v('camberF')) / camberLat(st.camberF), camberLat(v('camberR')) / camberLat(st.camberR)];
    out.camberLong = [camberLong(v('camberF')) / camberLong(st.camberF), camberLong(v('camberR')) / camberLong(st.camberR)];
  }
  if (tune.toeF || tune.toeR) { out.toeFront = (tune.toeF || 0) * Math.PI / 180; out.toeRear = (tune.toeR || 0) * Math.PI / 180; }
  // the differential
  if (tune.lsdInit != null) out.lsdPreload = s.lsdPreload * tune.lsdInit / 10;
  if (tune.lsdAccel != null) out.lsdRamp = s.lsdRamp * tune.lsdAccel / 20;
  if (tune.lsdBrake != null) out.lsdRampBrake = s.lsdRamp * tune.lsdBrake / 10;
  // aerodynamics (cars with wings)
  if (s.wings && (tune.aeroF != null || tune.aeroR != null)) {
    const base = out.downforce / s.downforce;          // (the ride height's share)
    const F = v('aeroF') * 9.81 / (55.6 * 55.6), R = v('aeroR') * 9.81 / (55.6 * 55.6);
    out.downforce = (F + R) * base; out.downforceFront = Math.min(0.75, Math.max(0.2, F / (F + R) + (out.downforceFront - s.downforceFront)));
    // (more wing, more drag: about a tenth of the downforce's own share)
    out.drag = s.drag * (1 + 0.35 * ((F + R) / s.downforce - 1));
  }
  // the engine: the computer turns it up or down; the restrictor caps its power
  if ((tune.ecu != null && tune.ecu !== 100) || (tune.restrictor != null && tune.restrictor !== 100)) {
    const k = v('ecu') / 100;
    let curve = s.torqueCurve.map(([r, nm]) => [r, nm * k]);
    if (v('restrictor') < 100) {
      const cap = peakPower(curve) * v('restrictor') / 100;
      curve = curve.map(([r, nm]) => [r, r > 0 ? Math.min(nm, cap / (r * Math.PI / 30)) : nm]);
    }
    out.torqueCurve = curve;
    out.peakTorque = Math.max(...curve.map(([, nm]) => nm));
  }
  // brakes: the balance moved a step at a time (each 1.5% of the braking)
  if (tune.brakeBal) out.brakeBias = Math.min(0.85, Math.max(0.45, s.brakeBias + tune.brakeBal * 0.015));
  // the gearbox: each ratio and the final drive; the automatic's change points follow
  if (tune.gears || tune.finalDrive != null) {
    out.gears = (tune.gears && tune.gears.length === s.gears.length ? tune.gears : s.gears).slice();
    out.finalDrive = v('finalDrive');
    const kmh = (g) => s.redline / (g * out.finalDrive) * 2 * Math.PI * s.wheelRadius / 60 * 3.6;
    out.autoUpshiftKmh = out.gears.slice(0, -1).map((g) => Math.round(kmh(g) * 0.96));
  }
  // (and how it looks: the body's height front and rear, the wheels' lean and
  // toe, against how it was built; the physics doesn't read these)
  out.look = { dF, dR, camF: (v('camberF') - st.camberF) * Math.PI / 180, camR: (v('camberR') - st.camberR) * Math.PI / 180, toeF: (tune.toeF || 0) * Math.PI / 180, toeR: (tune.toeR || 0) * Math.PI / 180 };
  out.tuned = true;
  return out;
}

// ---- figures shown at the top of the sheet ----
export function figures(s) {
  const w = peakPower(s.torqueCurve), bhp = w / 745.7;
  const vAir = Math.cbrt(w * (s.driveEfficiency || 0.9) / s.drag) * 3.6;
  const vGear = s.redline / (s.gears[s.gears.length - 1] * s.finalDrive) * 2 * Math.PI * s.wheelRadius / 60 * 3.6;
  return { bhp, mass: s.mass, ratio: bhp / s.mass * 1000, top: Math.min(vAir, vGear), gearTop: vGear, wf: s.cgToRear / (s.cgToFront + s.cgToRear) * 100 };
}

// ---- the sheet itself ----
const CSS = `
#tune { position: fixed; inset: 0; z-index: 95; display: none; flex-direction: column; color: #eef0f3;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased;
  background: #0a0c10; }
#tune.on { display: flex; }
#tune button, #tune select { font: inherit; color: inherit; }
#tune .t-head { display: flex; align-items: center; gap: 16px; padding: 20px 32px 8px; flex-wrap: wrap; }
#tune .t-head h2 { margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 0.04em; flex: 1; }
#tune .t-head h2 small { font-size: 13px; color: #8d96a3; letter-spacing: 0.12em; margin-left: 10px; }
#tune .t-figs { display: flex; gap: 18px; padding: 4px 32px 12px; font-size: 12px; color: #9aa3ae; flex-wrap: wrap; }
#tune .t-figs b { color: #eef0f3; font-weight: 600; font-variant-numeric: tabular-nums; margin-left: 6px; }
#tune .t-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); background: rgba(18,22,28,0.8); cursor: pointer; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; }
#tune .t-btn.go { background: #e5b53d; color: #15171a; border-color: #e5b53d; }
#tune .t-body { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 32px 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 14px; align-content: start; }
#tune .t-sec { border-radius: 14px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); padding: 12px 16px 8px; }
#tune .t-sec h3 { margin: 0 0 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.26em; color: #e5b53d; display: flex; justify-content: space-between; }
#tune .t-sec h3 span { color: #79828e; letter-spacing: 0.2em; }
#tune .t-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; align-items: center; padding: 7px 0; border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
#tune .t-row.one { grid-template-columns: 1.2fr 2fr; }
#tune .t-row > span { color: #aab2bd; }
#tune .t-row > span small { display: block; color: #6f7883; font-size: 11px; margin-top: 1px; }
#tune .t-ctl { display: flex; align-items: center; gap: 6px; min-width: 0; }
#tune .t-ctl input[type=range] { flex: 1; min-width: 0; accent-color: #e5b53d; }
#tune .t-ctl output { min-width: 52px; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
#tune .t-ctl output.moved { color: #e5b53d; }
#tune .t-ctl select { flex: 1; padding: 6px 8px; border-radius: 8px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.18); }
#tune .t-cols { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; font-size: 10px; letter-spacing: 0.22em; color: #6f7883; padding: 2px 0 4px; }
#tune .t-note { font-size: 11px; color: #79828e; padding: 6px 0 4px; }
@media (max-width: 760px), (max-height: 520px) {
  #tune .t-head { padding: 12px 14px 4px; } #tune .t-head h2 { font-size: 20px; }
  #tune .t-figs { padding: 2px 14px 8px; gap: 10px; }
  #tune .t-body { padding: 4px 12px 18px; grid-template-columns: 1fr; }
  #tune .t-row { grid-template-columns: 1fr 1fr; } #tune .t-row > span { grid-column: 1 / -1; }
  #tune .t-row.one { grid-template-columns: 1fr; } #tune .t-cols { display: none; }
}
`;

// [key, label, unit, min, max, step, decimals, note]
const PAIRS = [
  ['Suspension', [
    ['height', 'Body height', 'mm', -40, 40, 1, 0, 'Lower: steadier and more downforce, but it bottoms out', true],
    ['arb', 'Anti-roll bar', '', 1, 10, 1, 0, 'Stiffer: less lean. Front stiffer: understeer; rear: oversteer'],
    ['comp', 'Damping (compression)', '%', 10, 60, 1, 0, 'How fast it lets the spring squash'],
    ['reb', 'Damping (rebound)', '%', 10, 70, 1, 0, 'How fast it lets it spring back'],
    ['freq', 'Natural frequency', 'Hz', null, null, 0.05, 2, 'The springs: higher is stiffer'],
    ['camber', 'Negative camber', '°', 0, 6, 0.1, 1, 'Tilted in at the top: more grip in corners, less in a straight line'],
    ['toe', 'Toe', '°', -1, 1, 0.05, 2, 'In (+): steadier. Out (-): turns in sharper'],
  ]],
];

export class TuningSheet {
  // onChange(tune): the settings have changed (put them on the car)
  // onTyres(id): a tyre compound picked; tyre(): the one on now
  constructor({ onChange, onTyres, tyre }) {
    Object.assign(this, { onChange, onTyres, tyre });
    const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
    const root = this.root = document.createElement('div');
    root.id = 'tune';
    root.innerHTML = `<div class="t-head"><h2>Tuning<small></small></h2><button class="t-btn t-reset" type="button">Reset to stock</button><button class="t-btn go t-done" type="button">Done</button></div>
      <div class="t-figs"></div><div class="t-body"></div>`;
    document.body.appendChild(root);
    root.querySelector('.t-done').addEventListener('click', () => this.close());
    root.querySelector('.t-reset').addEventListener('click', () => { this.tune = {}; this.commit(); this.build(); });
  }
  get isOpen() { return this.root.classList.contains('on'); }
  // spec: the car as built with its engine (not tuned); kind, name: which car
  open(spec, kind, name) {
    this.spec = spec; this.kind = kind;
    this.tune = loadTune(kind);
    this.root.querySelector('.t-head small').textContent = name.toUpperCase();
    this.build();
    this.root.classList.add('on');
  }
  close() { this.root.classList.remove('on'); }
  commit() {
    // (only what's been moved off stock is kept)
    const st = stockTune(this.spec);
    for (const k of Object.keys(this.tune)) {
      const a = this.tune[k], b = st[k];
      if (Array.isArray(a) ? a.every((x, i) => Math.abs(x - b[i]) < 1e-6) : Math.abs(a - b) < 1e-6) delete this.tune[k];
    }
    saveTune(this.kind, this.tune);
    this.onChange?.(this.tune);
    this.showFigures();
  }
  showFigures() {
    const f = figures(withTune(this.spec, this.tune)), n = (x) => Math.round(x).toLocaleString('en-GB');
    this.root.querySelector('.t-figs').innerHTML = `<span>Power<b>${n(f.bhp)} bhp</b></span><span>Weight<b>${n(f.mass)} kg</b></span>`
      + `<span>Power / weight<b>${n(f.ratio)} bhp/t</b></span><span>Weight front<b>${f.wf.toFixed(1)}%</b></span><span>Top speed<b>${n(f.top)} km/h</b></span>`;
  }

  build() {
    const s = this.spec, st = stockTune(s), body = this.root.querySelector('.t-body');
    body.innerHTML = '';
    const val = (k) => this.tune[k] ?? st[k];
    const sec = (title, sub) => { const d = document.createElement('div'); d.className = 't-sec'; d.innerHTML = `<h3>${title}${sub ? `<span>${sub}</span>` : ''}</h3>`; body.appendChild(d); return d; };
    const fmt = (x, dec, unit) => `${(+x).toFixed(dec)}${unit ? (unit === '%' || unit === '°' ? unit : ' ' + unit) : ''}`;
    // one slider
    const slider = (key, min, max, step, dec, unit, get = () => val(key), set = (x) => { this.tune[key] = x; }, stockV = st[key]) => {
      const c = document.createElement('div'); c.className = 't-ctl';
      c.innerHTML = `<input type="range"><output></output>`;
      const r = c.querySelector('input'), o = c.querySelector('output');
      Object.assign(r, { min, max, step, value: get() });
      const show = () => { o.textContent = fmt(get(), dec, unit); o.classList.toggle('moved', Math.abs(get() - stockV) > step / 2); };
      r.addEventListener('input', () => { set(+(+r.value).toFixed(Math.max(dec, 3))); show(); this.commit(); });
      show();
      return c;
    };
    const row = (label, note, ...ctls) => {
      const d = document.createElement('div'); d.className = 't-row' + (ctls.length === 1 ? ' one' : '');
      d.innerHTML = `<span>${label}${note ? `<small>${note}</small>` : ''}</span>`;
      d.append(...ctls); return d;
    };
    const cols = () => { const d = document.createElement('div'); d.className = 't-cols'; d.innerHTML = '<span></span><span>FRONT</span><span>REAR</span>'; return d; };

    // TYRES
    {
      const S = sec('Tyres');
      const c = document.createElement('div'); c.className = 't-ctl';
      const sel = document.createElement('select');
      for (const [id, t] of Object.entries(TYRES)) { const o = document.createElement('option'); o.value = id; o.textContent = t.name; sel.appendChild(o); }
      sel.value = this.tyre?.() || 'SM';
      sel.addEventListener('change', () => { this.onTyres?.(sel.value); sel.blur(); });
      c.appendChild(sel);
      S.appendChild(row('Compound', 'Front and rear', c));
    }
    // SUSPENSION
    {
      const S = sec('Suspension', 'FULLY CUSTOMISABLE');
      S.appendChild(cols());
      for (const [k, label, unit, mn, mx, step, dec, note, rel] of PAIRS[0][1]) {
        const ctl = (end) => {
          const key = k + end;
          let lo = mn, hi = mx;
          if (k === 'freq') { lo = +(st[key] * 0.6).toFixed(2); hi = +(st[key] * 1.7).toFixed(2); }
          // (damping: round where the car's built, whatever that is)
          if (k === 'comp' || k === 'reb') { lo = Math.max(5, Math.min(mn, Math.round(Math.min(st[k + 'F'], st[k + 'R']) * 0.4))); hi = Math.min(200, Math.max(mx, Math.round(Math.max(st[k + 'F'], st[k + 'R']) * 1.5))); }
          if (rel) { lo = st[key] + mn; hi = st[key] + mx; }
          return slider(key, lo, hi, step, dec, unit);
        };
        S.appendChild(row(label, note, ctl('F'), ctl('R')));
      }
    }
    // DIFFERENTIAL
    {
      const S = sec('Differential gear', 'LIMITED-SLIP');
      S.appendChild(row('Initial torque', 'Locked all the time: steadier, but it pushes on in tight corners', slider('lsdInit', 5, 60, 1, 0, '')));
      S.appendChild(row('Acceleration sensitivity', 'Locks on the throttle: more drive out of corners, more understeer', slider('lsdAccel', 5, 60, 1, 0, '')));
      S.appendChild(row('Braking sensitivity', 'Locks off the throttle: steadier into corners, turns in less', slider('lsdBrake', 5, 60, 1, 0, '')));
    }
    // AERODYNAMICS
    {
      const S = sec('Aerodynamics', 'DOWNFORCE');
      if (s.wings) {
        S.appendChild(cols());
        const a = (key) => slider(key, Math.round(st[key] * 0.5), Math.round(st[key] * 1.5), 5, 0, 'kgf');
        S.appendChild(row('Downforce', 'At 200 km/h. More: more grip in fast corners, more drag', a('aeroF'), a('aeroR')));
      } else {
        S.insertAdjacentHTML('beforeend', '<div class="t-note">No wings to adjust on this car.</div>');
      }
    }
    // ENGINE
    {
      const S = sec('Engine', 'ECU · RESTRICTOR');
      S.appendChild(row('Output adjustment', 'The engine computer: more or less power everywhere', slider('ecu', 70, 120, 1, 0, '%')));
      S.appendChild(row('Power restrictor', 'Caps the peak power', slider('restrictor', 50, 100, 1, 0, '%')));
    }
    // BALLAST AND BRAKES
    {
      const S = sec('Ballast and brakes');
      S.appendChild(row('Ballast', 'Extra weight', slider('ballast', 0, 200, 5, 0, 'kg')));
      S.appendChild(row('Ballast position', '-50: over the rear axle, +50: over the front', slider('ballastPos', -50, 50, 1, 0, '')));
      S.appendChild(row('Brake balance', '+: more at the front (steadier); -: more at the rear (turns in, can spin)', slider('brakeBal', -5, 5, 1, 0, '')));
    }
    // GEARBOX
    {
      const S = sec('Transmission', 'FULLY CUSTOMISABLE');
      const gears = () => (this.tune.gears || st.gears);
      st.gears.forEach((g0, i) => {
        S.appendChild(row(`${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][i]}`, null,
          slider('gears', +(g0 * 0.6).toFixed(3), +(g0 * 1.5).toFixed(3), 0.001, 3, '',
            () => gears()[i], (x) => { const a = gears().slice(); a[i] = x; this.tune.gears = a; }, g0)));
      });
      S.appendChild(row('Final gear', 'Lower: higher top speed, slower to get there', slider('finalDrive', +(st.finalDrive * 0.6).toFixed(2), +(st.finalDrive * 1.5).toFixed(2), 0.01, 2, '')));
      const note = document.createElement('div'); note.className = 't-note'; S.appendChild(note);
      const upd = () => { const f = figures(withTune(this.spec, this.tune)); note.textContent = `Top gear tops out at ${Math.round(f.gearTop)} km/h at the redline.`; };
      S.addEventListener('input', upd); upd();
    }
    this.showFigures();
  }
}
