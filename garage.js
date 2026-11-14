// =====================================================================
// THE GARAGE: a studio away from the track. Your car stands on a
// turntable under soft lights; drag to walk round it (pinch or scroll to
// step in and out). Its name and figures are at the side. "Change car"
// (the key) opens the collection: the kinds of car side by side, each
// dropping down to its cars by age, oldest at the top, with a decade that
// has several cars dropping down again. Pick one and it fires up: a
// couple of big revs, then it settles to idle.
// =====================================================================
export const BUILD = 1;

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildF1Body, buildF1RimGeometry } from './f1.js';

// THE COLLECTION. kind: a car you can drive (the rest are coming soon).
// (made-up names, no real makes)
export const COLLECTION = [
  { cat: 'Formula', cars: [
    { name: 'TT-88', year: 1988, kind: 'f1', blurb: 'Turbo era, 1.5 V6' },
    { name: 'TT-94', year: 1994, blurb: 'V12 screamer' },
    { name: 'TT-03', year: 2003, blurb: '19,000 rpm V10' },
    { name: 'TT-14', year: 2014, blurb: 'Hybrid turbo V6' },
  ] },
  { cat: 'GT3', cars: [
    { name: 'GT3 Coupé R', year: 2012, blurb: 'Front-engined V8' },
    { name: 'GT3 Berlinetta', year: 2016, blurb: 'Mid-engined V8 turbo' },
    { name: 'GT3 Evo', year: 2023, blurb: 'Flat-six' },
  ] },
  { cat: 'Rally', cars: [
    { name: 'Group B Turbo', year: 1985, blurb: '4WD, 500 bhp, gravel' },
    { name: 'Group A 4WD', year: 1995, blurb: 'Turbo four, anti-lag' },
    { name: 'Rally1 Hybrid', year: 2022, blurb: 'Hybrid boost' },
  ] },
  { cat: 'Prototype', cars: [
    { name: 'Group C', year: 1987, blurb: 'Ground-effect endurance' },
    { name: 'LMP1', year: 2009, blurb: 'Diesel V12' },
    { name: 'Hypercar', year: 2023, blurb: 'Hybrid V6' },
  ] },
  { cat: 'Touring', cars: [
    { name: 'Super Touring', year: 1997, blurb: '2.0 saloon' },
    { name: 'TCR', year: 2019, blurb: 'Front-drive turbo' },
  ] },
  { cat: 'Road', cars: [
    { name: 'Roadster 60', year: 1962, blurb: 'Lightweight sports car' },
    { name: 'Caterham Seven', year: 2015, kind: 'caterham', blurb: 'The test car', hidden: true },
    { name: 'Hot Hatch', year: 1986, blurb: 'Front-drive, 1.6' },
  ] },
];
export const CAR_INFO = {
  f1: { name: 'TT-88', year: 1988, cat: 'Formula', drive: 'Rear-wheel drive' },
  caterham: { name: 'Caterham Seven', year: 2015, cat: 'Road', drive: 'Rear-wheel drive' },
};

const KEY_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="12" r="4"/><circle cx="7.5" cy="12" r="1.2"/><path d="M11.5 12H21M17.5 12v3M20.5 12v2.4"/></svg>';
const CAR_SILHOUETTE = '<svg viewBox="0 0 160 100" width="100%" height="100%"><path d="M18 66c6-12 22-20 40-22l18-12c8-5 26-6 40-2 10 3 18 10 24 18 6 1 12 5 13 11v8c0 3-2 5-5 5H24c-4 0-7-3-6-6z" fill="rgba(255,255,255,0.08)"/><circle cx="48" cy="72" r="10" fill="rgba(255,255,255,0.1)"/><circle cx="122" cy="72" r="10" fill="rgba(255,255,255,0.1)"/></svg>';

const CSS = `
body.in-garage > *:not(#garage):not(#game):not(canvas):not(style):not(script) { visibility: hidden !important; }
#garage { position: fixed; inset: 0; z-index: 90; display: none; pointer-events: none; color: #eef0f3;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
#garage.on { display: block; }
#garage button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
#garage .g-title { position: absolute; left: 32px; top: 26px; pointer-events: none; }
#garage .g-eyebrow { font-size: 11px; letter-spacing: 0.32em; color: #8d96a3; }
#garage .g-name { font-size: 46px; font-weight: 300; letter-spacing: 0.02em; line-height: 1.05; margin-top: 6px; }
#garage .g-sub { font-size: 13px; color: #aab2bd; margin-top: 6px; letter-spacing: 0.06em; }
#garage .g-rule { width: 54px; height: 2px; background: #e5b53d; margin-top: 12px; }
#garage .g-stats { position: absolute; right: 26px; top: 50%; transform: translateY(-50%); width: 250px; pointer-events: auto;
  padding: 16px 18px; border-radius: 14px; background: rgba(14, 17, 22, 0.62); border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
#garage .g-stats h3 { margin: 0 0 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.28em; color: #8d96a3; }
#garage .g-row { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
#garage .g-row span:first-child { color: #9aa3ae; }
#garage .g-row span:last-child { font-variant-numeric: tabular-nums; text-align: right; }
#garage .g-curve { margin-top: 10px; }
#garage .g-curve svg { display: block; width: 100%; height: 56px; }
#garage .g-curve small { font-size: 10px; letter-spacing: 0.2em; color: #79828e; }
#garage .g-bar { position: absolute; left: 32px; right: 32px; bottom: 26px; display: flex; gap: 12px; justify-content: space-between; pointer-events: none; }
#garage .g-btn { pointer-events: auto; display: inline-flex; align-items: center; gap: 10px; padding: 13px 20px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14); background: rgba(18, 22, 28, 0.72); font-size: 14px; font-weight: 600; letter-spacing: 0.06em;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: background 150ms, border-color 150ms; }
#garage .g-btn:hover { background: rgba(34, 40, 50, 0.85); border-color: rgba(255,255,255,0.3); }
#garage .g-btn.go { background: #e5b53d; color: #15171a; border-color: #e5b53d; }
#garage .g-btn.go:hover { background: #f0c552; }
#garage .g-hint { position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%); font-size: 11px; letter-spacing: 0.2em; color: #7b8490; pointer-events: none; }
/* the collection */
#garage .g-pick { position: absolute; inset: 0; display: none; flex-direction: column; pointer-events: auto;
  background: linear-gradient(180deg, rgba(8,10,13,0.92), rgba(8,10,13,0.97)); }
#garage .g-pick.on { display: flex; }
#garage .g-pick-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 32px 10px; }
#garage .g-pick-head h2 { margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 0.04em; display: flex; gap: 12px; align-items: center; }
#garage .g-close { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.16); background: transparent; font-size: 20px; }
#garage .g-cats { flex: 1; min-height: 0; display: flex; gap: 14px; overflow-x: auto; overflow-y: hidden; padding: 10px 32px 26px;
  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
#garage .g-col { flex: 0 0 270px; display: flex; flex-direction: column; min-height: 0; scroll-snap-align: start; }
#garage .g-cat { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); font-size: 15px; font-weight: 600; letter-spacing: 0.08em; text-align: left; }
#garage .g-cat small { font-weight: 400; color: #8d96a3; letter-spacing: 0.04em; margin-left: 8px; }
#garage .g-chev { transition: transform 200ms; color: #8d96a3; }
#garage .open > .g-cat .g-chev, #garage .open > .g-dec .g-chev { transform: rotate(180deg); }
#garage .g-list { display: none; flex-direction: column; gap: 10px; overflow-y: auto; min-height: 0; padding: 10px 2px 4px; }
#garage .open > .g-list { display: flex; }
#garage .g-dec { display: flex; align-items: center; justify-content: space-between; padding: 8px 6px; border: 0; background: none;
  font-size: 12px; letter-spacing: 0.24em; color: #aab2bd; text-align: left; }
#garage .g-declabel { font-size: 12px; letter-spacing: 0.24em; color: #aab2bd; padding: 8px 6px 0; }
#garage .g-sublist { display: none; flex-direction: column; gap: 10px; }
#garage .open > .g-sublist { display: flex; }
#garage .g-card { display: block; padding: 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);
  background: #14181e; text-align: left; transition: border-color 150ms, transform 150ms; }
#garage .g-card.live:hover { border-color: #e5b53d; transform: translateY(-1px); }
#garage .g-card.soon { cursor: default; opacity: 0.62; }
#garage .g-thumb { position: relative; aspect-ratio: 16 / 10; background: radial-gradient(ellipse at 50% 85%, #3a414c 0%, #1b1f26 62%, #121519 100%); }
#garage .g-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
#garage .g-badge { position: absolute; right: 8px; top: 8px; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
  background: rgba(0,0,0,0.55); color: #c9ced6; }
#garage .g-badge.mine { background: #e5b53d; color: #15171a; }
#garage .g-meta { padding: 10px 12px 12px; }
#garage .g-meta b { display: block; font-size: 15px; font-weight: 600; }
#garage .g-meta span { font-size: 12px; color: #8d96a3; }
@media (max-width: 760px), (max-height: 520px) {
  #garage .g-title { left: 16px; top: 14px; }
  #garage .g-name { font-size: 30px; }
  #garage .g-stats { right: 12px; top: auto; bottom: 76px; transform: none; width: auto; left: 12px; padding: 10px 12px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 12px; }
  #garage .g-stats h3, #garage .g-curve { display: none; }
  #garage .g-row { flex-direction: column; gap: 1px; padding: 4px 0; font-size: 12px; border-top: 0; }
  #garage .g-row span:last-child { text-align: left; }
  #garage .g-bar { left: 12px; right: 12px; bottom: 14px; }
  #garage .g-btn { padding: 11px 14px; font-size: 13px; }
  #garage .g-hint { display: none; }
  #garage .g-pick-head { padding: 14px 16px 6px; }
  #garage .g-cats { padding: 8px 16px 16px; }
  #garage .g-col { flex-basis: 220px; }
}
@media (max-height: 520px) { #garage .g-stats { display: none; } }
`;

export class Garage {
  // renderer: the game's; sound: the engine sound; env: an environment map
  // for reflections; getModel(): the car you're in, ready to copy;
  // kind / spec: what you're in; unlocked(kind): whether a hidden car shows;
  // onDrive(): back to the track; onPick(kind): fit another car
  constructor({ renderer, sound, env, getModel, kind, unlocked, onDrive, onPick, isMobile = false }) {
    Object.assign(this, { renderer, sound, getModel, kind, unlocked: unlocked || (() => false), onDrive, onPick, isMobile });
    this.isOpen = false;
    this.thumbs = {};
    this.time = 0;
    this.rpm = 0;
    this.revPlan = [];
    this.nextBlip = 6;
    this.boost = 0;
    this.buildStudio(env);
    this.buildUI();
  }

  // ---- the studio ----
  buildStudio(env) {
    const scene = this.scene = new THREE.Scene();
    scene.environment = env || null;
    // a dark backdrop fading up from the floor
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#07080a'); grad.addColorStop(0.55, '#15181d'); grad.addColorStop(1, '#22262c');
    g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
    const bg = new THREE.CanvasTexture(c); bg.colorSpace = THREE.SRGBColorSpace;
    scene.background = bg;
    scene.fog = new THREE.Fog(0x15181d, 14, 34);
    // the floor: polished concrete, with a turntable in it
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.42, metalness: 0.15 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.03, 96), new THREE.MeshStandardMaterial({ color: 0x34383f, roughness: 0.3, metalness: 0.35 }));
    table.position.y = 0.015; table.receiveShadow = true;
    scene.add(table);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.66, 128), new THREE.MeshBasicMaterial({ color: 0xe5b53d, transparent: true, opacity: 0.55 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.032;
    scene.add(ring);
    this.table = table;
    // the walls: a ring of tall light strips standing in the dark
    const strip = new THREE.MeshBasicMaterial({ color: 0xdfe6f0 });
    const stripGeo = new THREE.BoxGeometry(0.08, 4.2, 0.08);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, m = new THREE.Mesh(stripGeo, strip);
      m.position.set(Math.cos(a) * 15, 2.4, Math.sin(a) * 15);
      scene.add(m);
    }
    // a soft box overhead (it's what you see shining along the bodywork)
    const box = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    box.rotation.x = Math.PI / 2; box.position.y = 5.2;
    scene.add(box);
    // lights: a key from above and in front, a cool rim behind, a fill
    scene.add(new THREE.HemisphereLight(0xc8d2e0, 0x1a1c20, 0.55));
    const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
    key.position.set(3, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(this.isMobile ? 1024 : 2048, this.isMobile ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    scene.add(key);
    const rim = new THREE.SpotLight(0x9fc4ff, 30, 20, 0.6, 0.6, 1.5);
    rim.position.set(-4, 4, -5);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffe2c0, 8, 14, 1.6);
    fill.position.set(-4, 1.6, 4);
    scene.add(fill);
    // the camera you walk round with
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    this.camera.position.set(4.6, 1.5, 5.2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 3.4, maxDistance: 10,
      maxPolarAngle: 1.5, minPolarAngle: 0.25, autoRotate: true, autoRotateSpeed: 0.55, rotateSpeed: 0.6 });
    this.controls.target.set(0, 0.45, 0);
    this.controls.enabled = false;
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; clearTimeout(this.spinAgain); });
    this.controls.addEventListener('end', () => { clearTimeout(this.spinAgain); this.spinAgain = setTimeout(() => { this.controls.autoRotate = true; }, 6000); });
    this.carSpot = new THREE.Group();
    scene.add(this.carSpot);
  }

  // a copy of the car you're in, standing on the turntable
  placeCar() {
    if (this.model) this.carSpot.remove(this.model);
    const src = this.getModel();
    const m = src.clone(true);
    m.position.set(0, 0, 0);
    m.rotation.set(0, 0, 0);
    m.quaternion.identity();
    m.visible = true;
    m.traverse((o) => { if (o.isLight) o.visible = false; });
    this.carSpot.add(m);
    this.model = m;
    // the car's length decides how far back the camera stands
    const b = new THREE.Box3().setFromObject(m);
    const len = Math.max(b.max.z - b.min.z, b.max.x - b.min.x, 2);
    this.controls.minDistance = len * 0.85;
    this.controls.maxDistance = len * 2.6;
    this.controls.target.set(0, Math.min(0.6, (b.max.y + b.min.y) * 0.45), (b.max.z + b.min.z) / 2);
    this.carLength = len;
  }

  // a display TT-88 for its picture, when you're in another car
  buildF1Display() {
    const car = new THREE.Group();
    buildF1Body(car, () => {});
    const r = 0.33, tyre = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.85 });
    const rimM = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.85 });
    const rimGeo = buildF1RimGeometry(r * 0.6, 0.3);
    [[0.88, 1.62, 0.3], [-0.88, 1.62, 0.3], [0.88, -1.28, 0.42], [-0.88, -1.28, 0.42]].forEach(([x, z, w]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 32), tyre);
      t.rotation.z = Math.PI / 2; t.position.set(x, r, z); t.castShadow = true;
      const rm = new THREE.Mesh(rimGeo, rimM);
      rm.position.set(x, r, z); rm.scale.set(w / 0.36, 1, 1);
      if (x < 0) rm.rotation.y = Math.PI;
      car.add(t, rm);
    });
    car.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return car;
  }

  // a neat three-quarter picture of a car (front corner, a little above)
  shoot(model) {
    const R = this.renderer, cam = new THREE.PerspectiveCamera(26, 16 / 10, 0.1, 60);
    const keep = this.model;
    if (keep) keep.visible = false;
    this.carSpot.add(model);
    const b = new THREE.Box3().setFromObject(model), mid = b.getCenter(new THREE.Vector3());
    const len = Math.max(b.max.z - b.min.z, 2);
    cam.position.set(mid.x + len * 1.25, len * 0.55, mid.z + len * 1.75);
    cam.lookAt(mid.x, mid.y * 0.8, mid.z);
    const size = R.getSize(new THREE.Vector2());
    // (drawn on the game's canvas, the middle copied off at once, then
    // drawn over by the next frame)
    const w = Math.min(size.x, size.y * 1.6), h = w / 1.6;
    cam.aspect = size.x / size.y;
    cam.fov = 2 * Math.atan(Math.tan(13 * Math.PI / 180) * size.y / h) * 180 / Math.PI;
    cam.updateProjectionMatrix();
    R.render(this.scene, cam);
    const out = document.createElement('canvas'); out.width = 480; out.height = 300;
    const pr = R.getPixelRatio();
    out.getContext('2d').drawImage(R.domElement, (size.x - w) / 2 * pr, (size.y - h) / 2 * pr, w * pr, h * pr, 0, 0, 480, 300);
    this.carSpot.remove(model);
    if (keep) keep.visible = true;
    try { return out.toDataURL('image/jpeg', 0.85); } catch (e) { return null; }
  }

  thumbFor(kind) {
    if (this.thumbs[kind]) return this.thumbs[kind];
    let url = null;
    try { url = localStorage.getItem(THUMB_KEY + kind); } catch (e) { /* storage blocked */ }
    if (!url && kind === this.kind && this.model) url = this.shoot(this.model.clone(true));
    if (!url && kind === 'f1') url = this.shoot(this.buildF1Display());
    if (url) { this.thumbs[kind] = url; try { localStorage.setItem(THUMB_KEY + kind, url); } catch (e) { /* full */ } }
    return url;
  }

  // ---- the screens ----
  buildUI() {
    const css = document.createElement('style');
    css.textContent = CSS;
    document.head.appendChild(css);
    const root = this.root = document.createElement('div');
    root.id = 'garage';
    root.innerHTML = `
      <div class="g-title"><div class="g-eyebrow">GARAGE</div><div class="g-name"></div><div class="g-sub"></div><div class="g-rule"></div></div>
      <div class="g-stats"></div>
      <div class="g-hint">DRAG TO LOOK AROUND</div>
      <div class="g-bar"><button class="g-btn g-change" type="button">${KEY_ICON}Change car</button><button class="g-btn go g-drive" type="button">Drive &#9656;</button></div>
      <div class="g-pick"><div class="g-pick-head"><h2>${KEY_ICON}Change car</h2><button class="g-close" type="button" aria-label="Close">&times;</button></div><div class="g-cats"></div></div>`;
    document.body.appendChild(root);
    root.querySelector('.g-change').addEventListener('click', () => this.openPicker());
    root.querySelector('.g-drive').addEventListener('click', () => this.onDrive?.());
    root.querySelector('.g-close').addEventListener('click', () => this.closePicker());
  }

  showCar(spec) {
    this.spec = spec;
    const info = CAR_INFO[this.kind] || { name: spec.name, year: '', cat: '' };
    this.root.querySelector('.g-name').textContent = info.name;
    this.root.querySelector('.g-sub').textContent = `${info.year} · ${info.cat}`;
    // its figures, from its physics
    let peakW = 0, peakNm = 0;
    for (const [rpm, nm] of spec.torqueCurve) { peakW = Math.max(peakW, nm * rpm * Math.PI / 30); peakNm = Math.max(peakNm, nm); }
    const bhp = peakW / 745.7, vTop = Math.cbrt((peakW * (spec.driveEfficiency || 0.9)) / spec.drag) * 3.6;
    const fmt = (n) => Math.round(n).toLocaleString('en-GB');
    const rows = [
      ['Engine', spec.engineName || spec.name],
      ['Power', `${fmt(bhp)} bhp`],
      ['Torque', `${fmt(peakNm)} Nm`],
      ['Weight', `${fmt(spec.mass)} kg`],
      ['Power / weight', `${fmt(bhp / spec.mass * 1000)} bhp/t`],
      ['Top speed', `${fmt(vTop)} km/h`],
      ['Redline', `${fmt(spec.redline)} rpm`],
      ['Gearbox', `${spec.gears.length}-speed`],
      ['Drive', (CAR_INFO[this.kind] || {}).drive || 'Rear-wheel drive'],
    ];
    // the power curve, drawn small
    const pts = spec.torqueCurve.map(([r, nm]) => [r / spec.torqueCurve[spec.torqueCurve.length - 1][0], nm * r * Math.PI / 30 / peakW]);
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 230).toFixed(1)},${(54 - y * 50).toFixed(1)}`).join('');
    this.root.querySelector('.g-stats').innerHTML = '<h3>SPECIFICATIONS</h3>'
      + rows.map(([k, v]) => `<div class="g-row"><span>${k}</span><span>${v}</span></div>`).join('')
      + `<div class="g-curve"><small>POWER CURVE</small><svg viewBox="0 0 230 56" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#e5b53d" stroke-width="2"/><path d="${path}L230,56L0,56Z" fill="rgba(229,181,61,0.12)"/></svg></div>`;
  }

  openPicker() {
    const cats = this.root.querySelector('.g-cats');
    cats.innerHTML = '';
    for (const group of COLLECTION) {
      const cars = group.cars.filter((c) => !c.hidden || this.unlocked(c.kind) || c.kind === this.kind).sort((a, b) => a.year - b.year);
      if (!cars.length) continue;
      const col = document.createElement('div');
      col.className = 'g-col' + (cars.some((c) => c.kind === this.kind) ? ' open' : '');
      const head = document.createElement('button');
      head.type = 'button'; head.className = 'g-cat';
      head.innerHTML = `<span>${group.cat.toUpperCase()}<small>${cars.length}</small></span><span class="g-chev">&#9662;</span>`;
      head.addEventListener('click', () => col.classList.toggle('open'));
      const list = document.createElement('div');
      list.className = 'g-list';
      // by decade, oldest first; a decade with several cars drops down again
      const decades = new Map();
      for (const c of cars) { const d = Math.floor(c.year / 10) * 10; if (!decades.has(d)) decades.set(d, []); decades.get(d).push(c); }
      for (const [d, inDec] of decades) {
        const label = `${d}s`;
        if (inDec.length > 1) {
          const wrap = document.createElement('div');
          wrap.className = inDec.some((c) => c.kind) ? 'open' : '';
          const dh = document.createElement('button');
          dh.type = 'button'; dh.className = 'g-dec';
          dh.innerHTML = `<span>${label} · ${inDec.length}</span><span class="g-chev">&#9662;</span>`;
          dh.addEventListener('click', () => wrap.classList.toggle('open'));
          const sub = document.createElement('div');
          sub.className = 'g-sublist';
          for (const c of inDec) sub.appendChild(this.card(c));
          wrap.append(dh, sub);
          list.appendChild(wrap);
        } else {
          const lab = document.createElement('div');
          lab.className = 'g-declabel'; lab.textContent = label;
          list.append(lab, this.card(inDec[0]));
        }
      }
      col.append(head, list);
      cats.appendChild(col);
    }
    this.root.querySelector('.g-pick').classList.add('on');
  }
  closePicker() { this.root.querySelector('.g-pick').classList.remove('on'); }

  card(c) {
    const b = document.createElement('button');
    b.type = 'button';
    const live = !!c.kind, mine = c.kind === this.kind;
    b.className = 'g-card ' + (live ? 'live' : 'soon');
    const url = live ? this.thumbFor(c.kind) : null;
    b.innerHTML = `<div class="g-thumb">${url ? `<img alt="" src="${url}">` : CAR_SILHOUETTE}${mine ? '<span class="g-badge mine">IN USE</span>' : live ? '' : '<span class="g-badge">COMING SOON</span>'}</div>`
      + `<div class="g-meta"><b>${c.name}</b><span>${c.year} · ${c.blurb}</span></div>`;
    if (live) b.addEventListener('click', () => {
      this.closePicker();
      if (mine) this.rev();
      else this.onPick?.(c.kind);
    });
    else b.disabled = true;
    return b;
  }

  // ---- in and out ----
  open(spec, { rev = false } = {}) {
    this.isOpen = true;
    this.root.classList.add('on');
    document.body.classList.add('in-garage');
    this.controls.enabled = true;
    this.controls.autoRotate = true;
    this.placeCar();
    this.showCar(spec);
    this.rpm = spec.idleRpm;
    this.revPlan = [];
    this.nextBlip = 5 + Math.random() * 4;
    this.time = 0;
    // (the revs wait until the sound is on: a browser keeps quiet until
    // you've tapped or pressed something)
    this.pendingRev = rev;
  }
  close() {
    this.isOpen = false;
    this.closePicker();
    this.root.classList.remove('on');
    document.body.classList.remove('in-garage');
    this.controls.enabled = false;
  }

  // firing up on being picked: "vroooom... vrooooooooom", then idle
  rev() {
    const t = this.time;
    this.revPlan = [[t + 0.25, t + 0.55], [t + 1.05, t + 2.0]];
    this.nextBlip = t + 9 + Math.random() * 5;
  }

  // every frame while it's open: the car revs now and then, the camera
  // drifts round, the studio is drawn
  frame(dt) {
    const s = this.spec;
    this.time += dt;
    if (this.pendingRev && this.sound?.ctx && this.sound.ctx.state === 'running') { this.pendingRev = false; this.rev(); }
    // now and then a little blip of the throttle, as if someone's sat in it
    if (this.time > this.nextBlip) {
      const len = 0.12 + Math.random() * 0.22;
      this.revPlan.push([this.time, this.time + len]);
      this.nextBlip = this.time + 6 + Math.random() * 7;
    }
    this.revPlan = this.revPlan.filter(([, b]) => b > this.time - 0.01);
    const on = this.revPlan.some(([a, b]) => this.time >= a && this.time < b);
    // the revs: a high-revving engine spins up faster
    const top = s.redline * 0.97, pick = 2.1 + s.redline / 6000;
    if (on) this.rpm += (top - this.rpm) * (1 - Math.exp(-pick * dt));
    else this.rpm += (s.idleRpm - this.rpm) * (1 - Math.exp(-1.7 * dt));
    this.rpm = Math.min(s.redline, Math.max(s.idleRpm * 0.97, this.rpm + (Math.random() - 0.5) * s.idleRpm * 0.01));
    if (s.turbo) {
      const want = on ? Math.min(1, Math.max(0, (this.rpm - s.turbo.onRpm) / (s.turbo.fullRpm - s.turbo.onRpm))) : 0;
      this.boost += (want - this.boost) * Math.min(1, dt * 3);
    }
    this.sound?.update({
      rpm: this.rpm, engineLoad: on ? 1 : 0.04, throttleAmount: on ? 1 : 0, boost: this.boost, onLimiter: false,
      shiftTimer: 0, engineDead: false, misfiring: false, knock: 0, fuel: 50, vx: 0, heading: 0,
    }, FAR);
    // the car rocks a touch on its springs as it revs (the engine's twist)
    if (this.model) this.model.rotation.z = on ? Math.sin(this.time * 40) * 0.0015 + 0.004 : this.model.rotation.z * 0.9;
    // fit the camera to the screen
    const size = this.renderer.getSize(SIZE);
    const aspect = size.x / Math.max(1, size.y);
    if (Math.abs(this.camera.aspect - aspect) > 1e-3) {
      this.camera.aspect = aspect;
      // (a tall phone screen stands further back to fit the car in)
      this.camera.fov = aspect < 1 ? 52 : 34;
      this.camera.updateProjectionMatrix();
    }
    this.controls.update();
    this.renderer.toneMappingExposure = 1;
    this.renderer.render(this.scene, this.camera);
  }
}
const THUMB_KEY = 'tracktester-thumb-1-';   // (a new number when a car's looks change)
const FAR = new THREE.Vector3(1e5, 0, 1e5);
const SIZE = new THREE.Vector2();
