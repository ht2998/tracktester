// =====================================================================
// SKY: time of day and weather.
//
// TIME OF DAY: the sun rises at 6:00, peaks at midday and sets at 18:00.
// Its height sets the colour and strength of the sunlight, the sky
// colour, the soft light from the sky, and how much the car's paint and
// metal reflect (so nothing glows in the dark). At night a dim, cool
// moonlight takes over and the stars come out. Time runs faster than
// real life (60x by default: a full day in 24 minutes, like GT7), at any
// speed you like, or locked so it stays put.
//
// WEATHER: clear or cloudy. Clouds dim and soften the sunlight, grey the
// sky and fill it with cloud. Either fixed as you set it, or changing by
// itself, drifting between clear and overcast every few minutes. Even on
// clear days a few clouds drift by, and one passing over the sun dims the
// sunlight and softens the shadows for a moment.
//
// THE SKY TURNS: the stars wheel slowly around the pole through the night
// (one turn a day, east to west like the sun), and the wind high up slowly
// swings round, so the clouds change direction over time.
//
// SUN AND MOON: a glowing sun disc on the same path as the light (bigger
// and orange low down), a pale moon opposite it at night, and a soft glare
// when you look towards a low sun.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 6;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Weather choices: cloud cover, and how gloomy the light gets (rain)
export const WEATHER = {
  clear: { cloud: 0.08, gloom: 0, label: 'Clear' },
  cloudy: { cloud: 0.85, gloom: 0, label: 'Cloudy' },
  drizzle: { cloud: 0.82, gloom: 0.06, rain: true, label: 'Drizzle' },
  light: { cloud: 0.9, gloom: 0.14, rain: true, label: 'Light rain' },
  moderate: { cloud: 0.95, gloom: 0.24, rain: true, label: 'Moderate rain' },
  heavy: { cloud: 0.98, gloom: 0.36, rain: true, label: 'Heavy rain' },
  storm: { cloud: 1, gloom: 0.5, rain: true, label: 'Thunderstorm' },
};

// Time speeds offered in the side panel (game seconds per real second)
export const TIME_SPEEDS = [1, 10, 30, 60, 120, 300, 600];
export const DEFAULT_SPEED = 60;

// Sky colours: night, deep twilight, sunrise/sunset glow, day, overcast
const C = {
  night: new THREE.Color(0x070b18),
  dusk: new THREE.Color(0x2a3358),
  glow: new THREE.Color(0xff9a4c),      // the sky around a setting sun
  day: new THREE.Color(0x9ec9ef),
  overcast: new THREE.Color(0x9a9ea2),   // a flat, neutral grey
  overcastNight: new THREE.Color(0x0b0d12),
  sunLow: new THREE.Color(0xffa060),
  sunHigh: new THREE.Color(0xfff2dd),
  moon: new THREE.Color(0x9fb4ff),
  hemiDay: new THREE.Color(0xdbeeff),
  hemiNight: new THREE.Color(0x26324f),
  groundDay: new THREE.Color(0x5a5040),
  groundNight: new THREE.Color(0x0e0d0b),
  white: new THREE.Color(0xffffff),
};

// The sun's colour by its height: white high up, then yellow, then orange,
// then deep orange as it sinks below the horizon
const SUN_RAMP = [
  [-0.05, new THREE.Color(0xff5a14)],
  [0.03, new THREE.Color(0xff7a24)],
  [0.1, new THREE.Color(0xffa040)],
  [0.22, new THREE.Color(0xffd36e)],
  [0.38, new THREE.Color(0xfff0c8)],
  [0.55, new THREE.Color(0xfff6ea)],
];
// The (clear) sky's colour by the sun's height: blue by day, pale gold as
// the sun gets low, orange as it touches the horizon, then purple, deep
// blue and night. (Its own sequence, so it never mixes blue and orange
// into a muddy brown.)
const SKY_RAMP = [
  [-0.45, new THREE.Color(0x070b18)],
  [-0.22, new THREE.Color(0x182046)],
  [-0.1, new THREE.Color(0x433761)],
  [-0.03, new THREE.Color(0xc8603a)],
  [0.03, new THREE.Color(0xf28c45)],
  [0.1, new THREE.Color(0xf5b56c)],
  [0.18, new THREE.Color(0xe9d6b0)],
  [0.3, new THREE.Color(0x9ec9ef)],
];
function ramp(table, el, out) {
  if (el <= table[0][0]) return out.copy(table[0][1]);
  for (let i = 1; i < table.length; i++) {
    const [h, c] = table[i];
    if (el <= h) {
      const [h0, c0] = table[i - 1];
      return out.copy(c0).lerp(c, (el - h0) / (h - h0));
    }
  }
  return out.copy(table[table.length - 1][1]);
}
const sunColour = (el, out) => ramp(SUN_RAMP, el, out);

// A round glow painted on a canvas: a bright core fading out softly
function glowTexture(core = 0.18) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(core, 'rgba(255,255,255,0.95)');
  grad.addColorStop(core + 0.04, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// The moon's face: a pale disc with a few darker grey patches
function moonTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = '#e8ecf2';
  g.beginPath();
  g.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(150,160,175,0.45)';
  for (const [x, y, r] of [[0.38, 0.4, 0.12], [0.6, 0.35, 0.08], [0.55, 0.6, 0.14], [0.35, 0.65, 0.07], [0.66, 0.55, 0.06]]) {
    g.beginPath();
    g.arc(size * x, size * y, size * r, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// One soft cloud puff: a round, slightly lumpy blob (many of these piled
// together make a cloud)
function puffTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = size * (0.32 + Math.random() * 0.36), y = size * (0.32 + Math.random() * 0.36);
    const r = size * (0.18 + Math.random() * 0.2);
    const blob = g.createRadialGradient(x, y, 0, x, y, r);
    blob.addColorStop(0, 'rgba(255,255,255,0.32)');
    blob.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    blob.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = blob;
    g.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

// A tiling sheet of soft blotches: used for the overcast layer and for the
// cloud shadows drifting over the ground. dark = black blotches (shadows)
function blotchTexture(dark) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const col = dark ? '0,0,0' : '255,255,255';
  for (let i = 0; i < (dark ? 14 : 70); i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = size * (dark ? 0.06 + Math.random() * 0.12 : 0.05 + Math.random() * 0.12);
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const blob = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      blob.addColorStop(0, `rgba(${col},${dark ? 0.9 : 0.5})`);
      blob.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = blob;
      g.fillRect(0, 0, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Cloud puffs, all drawn together: each puff always faces the camera, is
// lit on top and shaded underneath, and fades with its cloud
const CLOUD_VERT = `
attribute vec3 aCentre;
attribute vec3 aLocal;
attribute float aSize;
attribute float aShade;
attribute float aAlpha;
varying vec2 vUv;
varying float vShade;
varying float vAlpha;
void main() {
  vUv = uv;
  vShade = aShade;
  vAlpha = aAlpha;
  vec4 mv = viewMatrix * vec4(aCentre + aLocal, 1.0);
  mv.xy += position.xy * aSize;
  gl_Position = projectionMatrix * mv;
}`;
const CLOUD_FRAG = `
uniform sampler2D map;
uniform vec3 lit;
uniform vec3 shadow;
varying vec2 vUv;
varying float vShade;
varying float vAlpha;
void main() {
  float a = texture2D(map, vUv).a * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(shadow, lit, vShade), a);
}`;

export class SkySystem {
  // sun: the shadow-casting DirectionalLight, hemi: the HemisphereLight
  // place: where on Earth this is, for the sun's path:
  //   lat: latitude (degrees, + = north)
  //   solarNoon: the clock time the sun is highest (Malaysia's clocks run
  //     about an hour ahead of the sun, so it's about 13:10 there)
  //   north: which way north is in the game (a direction on the ground)
  constructor(scene, { sun, hemi, isMobile = false, place = {} }) {
    this.place = { lat: 2.76, solarNoon: 13.15, north: { x: 0, z: -1 }, ...place };
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;

    // Time and weather settings
    this.hours = 10.5;                 // start mid-morning
    this.daylight = 1;                 // 0 at night, 1 in full day
    this.speed = DEFAULT_SPEED;
    this.locked = false;
    this.weather = 'clear';            // 'clear' or 'cloudy'
    this.changing = false;             // weather drifts by itself
    this.cloud = 0.08;                 // how cloudy it is right now (0-1)
    this.cloudTarget = 0.08;
    this.nextChange = 60;              // real seconds until the weather picks a new direction

    this.sunDir = new THREE.Vector3();
    this.skyColour = new THREE.Color();
    this._c = new THREE.Color();
    this.envFactor = 1;
    this.lastEnv = -1;
    this.materials = [];
    this.lastScan = -99;

    // --- Stars: points on a huge sphere around the car. The whole sphere,
    // since it turns: stars set below the horizon (hidden by the ground) and
    // rise again ---
    const starCount = isMobile ? 1000 : 1800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      starPos.set([Math.cos(a) * r * 420, u * 420, Math.sin(a) * r * 420], i * 3);
    }
    // The pole the sky turns around: tilted north (-z), opposite the midday sun
    this.pole = new THREE.Vector3(0, Math.cos(0.6), -Math.sin(0.6));
    this.skyTurn = new THREE.Quaternion();
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: isMobile ? 1.6 : 1.8, sizeAttenuation: false,
      transparent: true, opacity: 0, depthWrite: false, fog: false,
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -2;
    scene.add(this.stars);

    // --- Clouds: cumulus, each a cluster of soft puffs heaped into a dome
    // over a flatter base. Sizes range from small wisps to big piled-up
    // clumps, scattered with gaps of sky between. All the puffs are drawn
    // in one go ---
    const clusterCount = isMobile ? 22 : 34;
    this.clouds = [];
    const puffs = [];
    for (let i = 0; i < clusterCount; i++) {
      const big = Math.pow(Math.random(), 1.6);            // mostly small and medium, a few huge
      const R = 25 + 115 * big;                            // footprint radius, metres
      const cluster = {
        x: (Math.random() - 0.5) * 900, z: (Math.random() - 0.5) * 900,
        y: 120 + Math.random() * 70, R, rank: Math.random(), alpha: 0, first: puffs.length,
      };
      const n = 6 + Math.round(big * 22);
      for (let k = 0; k < n; k++) {
        const ang = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * R * 0.85;
        const heap = 1 - (d / R) ** 2;                     // piles up in the middle
        const up = Math.random() * R * 0.42 * heap;
        puffs.push({
          cluster: i,
          local: [Math.cos(ang) * d, up, Math.sin(ang) * d * 0.7],
          size: (26 + 70 * big) * (0.75 + 0.5 * Math.random()) * (0.8 + 0.5 * heap),
          shade: clamp(0.35 + 0.65 * (up / (R * 0.42 + 1)) + Math.random() * 0.15, 0, 1),   // lit on top
        });
      }
      cluster.count = n;
      this.clouds.push(cluster);
    }
    const plane = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.getAttribute('position'));
    geo.setAttribute('uv', plane.getAttribute('uv'));
    const attr = (size, fill) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * size), size);
      puffs.forEach((p, i) => fill(a.array, i, p));
      return a;
    };
    this.puffCentre = attr(3, () => {});
    this.puffCentre.setUsage(THREE.DynamicDrawUsage);
    this.puffAlpha = attr(1, () => {});
    this.puffAlpha.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aCentre', this.puffCentre);
    geo.setAttribute('aLocal', attr(3, (arr, i, p) => arr.set(p.local, i * 3)));
    geo.setAttribute('aSize', attr(1, (arr, i, p) => { arr[i] = p.size; }));
    geo.setAttribute('aShade', attr(1, (arr, i, p) => { arr[i] = p.shade; }));
    geo.setAttribute('aAlpha', this.puffAlpha);
    geo.instanceCount = puffs.length;
    this.puffs = puffs;
    this.cloudMat = new THREE.ShaderMaterial({
      uniforms: { map: { value: puffTexture() }, lit: { value: new THREE.Color() }, shadow: { value: new THREE.Color() } },
      vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
      transparent: true, depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(geo, this.cloudMat);
    this.cloudMesh.frustumCulled = false;
    this.cloudMesh.renderOrder = -1;
    scene.add(this.cloudMesh);

    // --- Overcast: a grey sheet across the whole sky when it's cloudy ---
    this.sheetTex = blotchTexture(false);
    this.sheetTex.repeat.set(3, 3);
    this.sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(1500, 1500),
      new THREE.MeshBasicMaterial({ map: this.sheetTex, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide })
    );
    this.sheet.rotation.x = Math.PI / 2;
    this.sheet.renderOrder = -1;
    scene.add(this.sheet);

    // --- Cloud shadows: soft dark patches drifting over the ground ---
    this.shadowTex = blotchTexture(true);
    this.shadowTile = 180;                      // metres per repeat of the pattern
    this.shadowTex.repeat.set(360 / this.shadowTile, 360 / this.shadowTile);
    this.groundShade = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 360),
      new THREE.MeshBasicMaterial({ color: 0x000000, map: this.shadowTex, transparent: true, opacity: 0, depthWrite: false, fog: false })
    );
    this.groundShade.rotation.x = -Math.PI / 2;
    this.groundShade.position.y = 0.03;
    scene.add(this.groundShade);

    this.wind = new THREE.Vector2(4, 1.6);       // metres per second, high up
    this.drift = new THREE.Vector2();            // how far the wind has carried things so far

    // --- Sun: a bright core with a wide soft glow, far out on the sun's path ---
    const glow = glowTexture(0.18);
    const sprite = (map, opacity = 1, additive = true) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map, transparent: true, opacity, depthWrite: false, fog: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }));
      sp.renderOrder = -3;                       // behind the clouds
      scene.add(sp);
      return sp;
    };
    this.sunDisc = sprite(glow);
    this.sunHalo = sprite(glowTexture(0.02), 0.5);
    // --- Moon ---
    this.moonDisc = sprite(moonTexture(), 1, false);
    this.moonHalo = sprite(glowTexture(0.02), 0.25);
    this.sunPos = new THREE.Vector3();
    this.covered = 0;                            // how much a cloud is over the sun right now

    // --- Glare: a soft glow over the screen when looking towards a low sun ---
    this.glare = document.createElement('div');
    this.glare.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen';
    // right after the 3D view, so it sits over the road but under the dashboard
    const view = document.getElementById('game');
    if (view) view.after(this.glare); else document.body.prepend(this.glare);
    this.lastGlare = '';
    this.skyLayer();
  }

  // For the sun rays (godrays.js): which way the sun is, its colour, and
  // how strong the rays should be (strongest low down on a clear day)
  get rays() {
    const el = this.sunDir.y;
    const low = 1 - smooth(0.05, 0.5, el);
    this._rayCol = this._rayCol || new THREE.Color();
    sunColour(el, this._rayCol);
    const vis = smooth(-0.04, 0.04, el) * (1 - 0.9 * this.cloud) * (1 - 0.6 * this.covered);
    return { dir: this.sunDir, colour: this._rayCol, strength: vis * (0.3 + 0.5 * low) };
  }

  // Sky things go on layer 1: seen by the camera, but they don't block the
  // sun rays (only solid things in the world do)
  skyLayer() {
    for (const o of [this.stars, this.cloudMesh, this.sheet, this.groundShade, this.sunDisc, this.sunHalo, this.moonDisc, this.moonHalo]) {
      o.layers.set(1);
    }
  }

  // Set by the side panel
  setTime(hours) { this.hours = ((hours % 24) + 24) % 24; }
  setSpeed(speed) { this.speed = speed; }
  setLocked(locked) { this.locked = locked; }
  setWeather(type) {
    const w = WEATHER[type] || WEATHER.clear;
    this.weather = WEATHER[type] ? type : 'clear';
    this.cloudTarget = w.cloud;
    this.gloomTarget = w.gloom;
  }

  // The rain level right now ('drizzle' ... 'storm'), or null when dry
  get rainLevel() {
    return WEATHER[this.weather]?.rain ? this.weather : null;
  }
  setChanging(on) {
    this.changing = on;
    this.nextChange = 20 + Math.random() * 40;
    if (!on) this.setWeather(this.weather);
  }

  // "14:05"
  get clock() {
    const m = Math.floor(this.hours * 60) % (24 * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  // What the weather looks like right now (for the panel): clear, cloudy or in between
  get weatherNow() {
    if (this.rainLevel) return WEATHER[this.weather].label.toLowerCase();
    return this.cloud < 0.3 ? 'clear' : this.cloud > 0.6 ? 'cloudy' : 'partly cloudy';
  }

  // Called every frame. centre: where the car is (the sky follows it)
  update(dt, centre, camera = null) {
    // --- Time ---
    if (!this.locked) this.hours = (this.hours + (dt * this.speed) / 3600) % 24;

    // --- Weather ---
    if (this.changing) {
      this.nextChange -= dt;
      if (this.nextChange <= 0) {
        // Somewhere between clear and overcast, often a big change, and
        // sometimes a shower (rarely a thunderstorm)
        const r = Math.random();
        const shower = r < 0.05 ? 'storm' : r < 0.3 ? ['drizzle', 'light', 'moderate', 'heavy'][(Math.random() * 4) | 0] : null;
        if (shower) {
          this.showers = shower;
          this.cloudTarget = WEATHER[shower].cloud;
          this.gloomTarget = WEATHER[shower].gloom;
        } else {
          this.showers = null;
          this.cloudTarget = Math.random() < 0.5 ? Math.random() * 0.35 : 0.45 + Math.random() * 0.5;
          this.gloomTarget = 0;
        }
        this.nextChange = 50 + Math.random() * 70;
      }
      this.cloud += clamp(this.cloudTarget - this.cloud, -0.008 * dt, 0.008 * dt);   // drifts over a minute or two
      // the shower only starts once the sky has clouded over
      this.weather = this.showers && this.cloud > 0.75 ? this.showers : this.cloud > 0.45 ? 'cloudy' : 'clear';
    } else {
      this.cloud += clamp(this.cloudTarget - this.cloud, -0.25 * dt, 0.25 * dt);     // quick when you pick it
    }
    this.gloom = (this.gloom ?? 0) + clamp((this.rainLevel ? this.gloomTarget ?? 0 : 0) - (this.gloom ?? 0), -0.05 * dt, 0.05 * dt);
    this.flash = Math.max(0, (this.flash ?? 0) - dt * 5);
    const cloud = this.cloud;

    // --- The sun's real path for this place and today's date: it rises in
    // the east, crosses the sky (near the equator it passes almost straight
    // overhead, a little to the south or north depending on the time of
    // year) and sets in the west ---
    const pl = this.place, rad = Math.PI / 180;
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const dec = -23.44 * rad * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));     // how far north or south of the equator the sun is today
    const lat = pl.lat * rad;
    const H = (this.hours - pl.solarNoon) * 15 * rad;                                 // the sun's angle from its midday point
    const sinEl = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
    const elev = Math.asin(clamp(sinEl, -1, 1));
    const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(H));   // from north, clockwise (east = 90°)
    const nx = pl.north.x, nz = pl.north.z, ex = -nz, ez = nx;                         // north and east on the ground
    const north = Math.cos(elev) * Math.cos(az), east = Math.cos(elev) * Math.sin(az);
    this.sunDir.set(north * nx + east * ex, Math.sin(elev), north * nz + east * ez).normalize();
    const el = this.sunDir.y;                       // sun's height: 1 = overhead, below 0 = night
    const day = smooth(-0.22, 0.3, el);             // 0 at night, 1 in full day (dawn and dusk take a while)
    this.daylight = day;

    // --- A cloud drifting over the sun? (checked against each cloud's
    // direction from the car, so it matches what you see) ---
    let cover = 0;
    for (const c of this.clouds) {
      if (c.alpha < 0.02) continue;
      const dx = c.x - centre.x, dy = c.y + c.R * 0.15, dz = c.z - centre.z;
      const dist = Math.hypot(dx, dy, dz);
      const along = (dx * this.sunDir.x + dy * this.sunDir.y + dz * this.sunDir.z) / dist;   // cos of the angle
      const size = (c.R * 0.8) / dist;                                                     // its angular size
      const off = Math.sqrt(Math.max(0, 2 * (1 - along)));
      if (off < size) cover = Math.max(cover, c.alpha * (1 - off / size));
    }
    this.covered += (cover - this.covered) * Math.min(1, dt * 1.5);   // eases in and out as it passes
    const shade = 1 - 0.55 * this.covered;

    // --- Sunlight (or moonlight at night) ---
    const sunUp = el > -0.02;
    if (sunUp) {
      sunColour(el, this.sun.color).lerp(C.white, 0.15);   // white -> yellow -> orange as it sinks
      this.sun.intensity = 3.1 * smooth(-0.02, 0.4, el) * (1 - 0.75 * cloud) * shade * (1 - 0.6 * this.gloom);   // strong, for crisp shadows
      this.lightDir = this.sunDir;
    } else {
      // The moon: opposite the sun, dim and cool
      this.sun.color.copy(C.moon);
      this.sun.intensity = 0.22 * smooth(-0.02, -0.35, el) * (1 - 0.8 * cloud);
      this._moonDir = this._moonDir || new THREE.Vector3();
      this._moonDir.copy(this.sunDir).multiplyScalar(-1);
      this._moonDir.y = Math.max(0.25, this._moonDir.y);
      this._moonDir.normalize();
      this.lightDir = this._moonDir;
    }

    // --- Soft light from the sky: brighter (and does more of the lighting) when cloudy ---
    this.hemi.color.copy(C.hemiNight).lerp(C.hemiDay, day);
    this.hemi.groundColor.copy(C.groundNight).lerp(C.groundDay, day);
    this.hemi.intensity = (0.1 + day * (0.36 + 0.5 * cloud)) * (1 - 0.45 * this.gloom)   // less fill on clear days = darker shadows; gloomy in rain
      + 2.2 * this.flash;                                                              // lightning lights up everything

    // --- Sky colour (also the fog, so the distance fades into it) ---
    const sky = ramp(SKY_RAMP, el, this.skyColour);
    this._c.copy(C.overcastNight).lerp(C.overcast, day);
    sky.lerp(this._c, smooth(0.1, 0.75, cloud));   // fully grey once it's properly cloudy
    sky.multiplyScalar(1 - 0.55 * this.gloom);                      // heavy rain: a dark, gloomy sky
    if (this.flash > 0) sky.lerp(C.white, Math.min(0.85, this.flash * 0.8));   // lightning
    this.scene.background.copy(sky);
    if (this.scene.fog) this.scene.fog.color.copy(sky);

    // --- Reflections: the paint and metal reflect a bright studio, which
    // must fade at night or the car would glow ---
    this.envFactor = 0.08 + 0.72 * day * (1 - 0.2 * cloud);
    this.applyReflections();

    // --- Stars: out at night, hidden by cloud ---
    this.starMat.opacity = (1 - smooth(-0.35, -0.08, el)) * (1 - cloud) * 0.9;
    this.stars.visible = this.starMat.opacity > 0.01;
    this.stars.position.set(centre.x, 0, centre.z);
    // One full turn a day, in step with the sun
    this.skyTurn.setFromAxisAngle(this.pole, -(this.hours / 24) * Math.PI * 2);
    this.stars.quaternion.copy(this.skyTurn);

    // The wind high up slowly swings round (a full circle every half hour or so)
    this.windAngle = (this.windAngle ?? 0.38) + dt * 0.0035 + Math.sin(performance.now() / 97000) * dt * 0.002;
    const windSpeed = 4.3 + 9 * (this.gloom ?? 0);   // much windier in rain and storms: the clouds race over
    this.wind.set(Math.cos(this.windAngle) * windSpeed, Math.sin(this.windAngle) * windSpeed);

    // --- Clouds: more of them the cloudier it is, lit by the sun ---
    const cloudLight = this._c.copy(C.night).lerp(C.dusk, smooth(-0.45, -0.1, el)).lerp(sunColour(el, this._c3 || (this._c3 = new THREE.Color())), smooth(-0.15, 0.1, el))
      .lerp(C.white, day * smooth(0.05, 0.45, el));
    const grey = (1 - 0.92 * cloud) * (1 - 0.5 * this.gloom);   // overcast clouds are greyer and darker than the sky; rain clouds darker still
    // (the cloud shader writes straight to the screen, so its colours are given in screen terms)
    this.cloudMat.uniforms.lit.value.copy(cloudLight).multiplyScalar(grey).convertLinearToSRGB();
    this.cloudMat.uniforms.shadow.value.copy(cloudLight).multiplyScalar(grey * (0.55 + 0.15 * day)).lerp(this.skyColour, 0.25).convertLinearToSRGB();
    this.drift.x += this.wind.x * dt;
    this.drift.y += this.wind.y * dt;
    const shown = 0.4 + 0.6 * cloud;        // share of clouds out (plenty even on clear days)
    const cen = this.puffCentre.array, alp = this.puffAlpha.array;
    for (const c of this.clouds) {
      c.x += this.wind.x * dt;
      c.z += this.wind.y * dt;
      // keep them in a big square around the car
      if (c.x - centre.x > 450) c.x -= 900; else if (c.x - centre.x < -450) c.x += 900;
      if (c.z - centre.z > 450) c.z -= 900; else if (c.z - centre.z < -450) c.z += 900;
      const target = c.rank < shown ? clamp((shown - c.rank) * 6, 0, 1) * (0.8 + 0.2 * cloud) : 0;
      c.alpha += (target - c.alpha) * Math.min(1, dt * 0.5);          // clouds build and melt away slowly
      for (let k = c.first; k < c.first + c.count; k++) {
        cen[k * 3] = c.x; cen[k * 3 + 1] = c.y; cen[k * 3 + 2] = c.z;
        alp[k] = c.alpha;
      }
    }
    this.puffCentre.needsUpdate = true;
    this.puffAlpha.needsUpdate = true;

    // Overcast sheet: fades in as it clouds over
    this.sheet.position.set(centre.x, 230, centre.z);
    this.sheet.material.opacity = smooth(0.35, 0.85, cloud) * 0.92;
    this.sheet.visible = this.sheet.material.opacity > 0.01;
    this.sheet.material.color.copy(cloudLight).multiplyScalar((0.12 + 0.15 * day) * (1 - 0.55 * this.gloom));   // a shade darker than the grey sky
    this.sheetTex.offset.set((centre.x - this.drift.x) / 500, -(centre.z - this.drift.y) / 500);

    // Cloud shadows on the ground: subtle, only with sun and broken cloud
    // (under a full overcast there are no separate shadows)
    this.groundShade.position.set(centre.x, 0.03, centre.z);
    this.shadowTex.offset.set((centre.x - this.drift.x) / this.shadowTile, -(centre.z - this.drift.y) / this.shadowTile);
    const broken = 1 - smooth(0.6, 0.9, cloud);
    this.groundShade.material.opacity = 0.16 * broken * smooth(0.05, 0.3, el);
    this.groundShade.visible = this.groundShade.material.opacity > 0.005;

    this.placeSunAndMoon(centre, camera);
  }

  // The sun and moon in the sky, and the glare. camera: to work out where
  // the sun is on screen
  placeSunAndMoon(centre, camera) {
    const el = this.sunDir.y;
    const cloud = this.cloud;
    // Sun: 400 m out along its path (inside the camera's view distance)
    const low = 1 - smooth(0.02, 0.35, el);                     // 1 near the horizon
    const sunCol = sunColour(el, this._c);
    const sunVis = smooth(-0.06, 0.02, el) * (1 - 0.85 * cloud) * (1 - 0.7 * this.covered);
    this.sunPos.copy(this.sunDir).multiplyScalar(400).add(centre);
    this.sunDisc.position.copy(this.sunPos);
    this.sunHalo.position.copy(this.sunPos);
    const core = 22 + 10 * low;                                  // bigger low down
    this.sunDisc.scale.set(core, core, 1);
    this.sunHalo.scale.set(core * (6 + 3 * low), core * (6 + 3 * low), 1);
    this.sunDisc.material.color.copy(sunCol);
    this.sunHalo.material.color.copy(sunCol);
    this.sunDisc.material.opacity = sunVis;
    this.sunHalo.material.opacity = sunVis * (0.35 + 0.45 * low);   // a bigger, warmer glow low down
    this.sunDisc.visible = this.sunHalo.visible = sunVis > 0.01;

    // Moon: opposite the sun, out once the sun has gone down
    const moonVis = (1 - smooth(-0.1, 0.05, el)) * (1 - 0.8 * cloud);
    if (this._moonDir) {
      const mp = this._c2 || (this._c2 = new THREE.Vector3());
      mp.copy(this._moonDir).multiplyScalar(400).add(centre);
      this.moonDisc.position.copy(mp);
      this.moonHalo.position.copy(mp);
    }
    this.moonDisc.scale.set(16, 16, 1);
    this.moonHalo.scale.set(70, 70, 1);
    this.moonDisc.material.opacity = moonVis;
    this.moonHalo.material.opacity = moonVis * 0.25;
    this.moonHalo.material.color.copy(C.moon);
    this.moonDisc.visible = this.moonHalo.visible = moonVis > 0.01 && !!this._moonDir;

    // Glare: strongest looking straight at a low sun on a clear day
    let glare = 0, sx = 0.5, sy = 0.3;
    if (camera && sunVis > 0.05) {
      const fwd = this._fwd || (this._fwd = new THREE.Vector3());
      camera.getWorldDirection(fwd);
      const facing = fwd.x * this.sunDir.x + fwd.y * this.sunDir.y + fwd.z * this.sunDir.z;   // 1 = straight at it
      if (facing > 0.6) {
        const p = this._proj || (this._proj = new THREE.Vector3());
        p.copy(this.sunPos).project(camera);
        sx = (p.x + 1) / 2;
        sy = (1 - p.y) / 2;
        glare = smooth(0.6, 0.97, facing) * sunVis * (0.25 + 0.75 * low) * 0.6;
      }
    }
    const g = Math.round(glare * 100) / 100;
    const key = `${g}|${Math.round(sx * 100)}|${Math.round(sy * 100)}`;
    if (key !== this.lastGlare) {
      this.lastGlare = key;
      this.glare.style.opacity = String(g);
      this.glare.style.background = `radial-gradient(circle at ${(sx * 100).toFixed(1)}% ${(sy * 100).toFixed(1)}%, `
        + `rgba(255,236,200,0.9) 0%, rgba(255,200,140,0.35) 18%, rgba(255,180,120,0.08) 45%, rgba(0,0,0,0) 70%)`;
    }
  }

  // Sets every material's reflection strength (only when it changes, and
  // re-checks for new materials every few seconds)
  applyReflections() {
    const now = performance.now() / 1000;
    let rescanned = false;
    if (now - this.lastScan > 3) {
      this.lastScan = now;
      const seen = new Set();
      this.scene.traverse((o) => {
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) if ('envMapIntensity' in m && !seen.has(m)) seen.add(m);
      });
      this.materials = [...seen];
      rescanned = true;
    }
    if (!rescanned && Math.abs(this.envFactor - this.lastEnv) < 0.01) return;
    this.lastEnv = this.envFactor;
    for (const m of this.materials) {
      if (m.userData.baseEnv === undefined) m.userData.baseEnv = m.envMapIntensity;
      m.envMapIntensity = m.userData.baseEnv * this.envFactor;
    }
  }
}
