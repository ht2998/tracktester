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
// itself, drifting between clear and overcast every few minutes.
// =====================================================================

import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Time speeds offered in the side panel (game seconds per real second)
export const TIME_SPEEDS = [1, 10, 30, 60, 120, 300, 600];
export const DEFAULT_SPEED = 60;

// Sky colours: night, deep twilight, sunrise/sunset glow, day, overcast
const C = {
  night: new THREE.Color(0x070b18),
  dusk: new THREE.Color(0x2a3358),
  glow: new THREE.Color(0xe8946a),
  day: new THREE.Color(0x9ec9ef),
  overcast: new THREE.Color(0xa9b2ba),
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

// A soft, lumpy cloud painted on a canvas
function cloudTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const x = size * (0.2 + Math.random() * 0.6);
    const y = size * (0.35 + Math.random() * 0.3);
    const r = size * (0.08 + Math.random() * 0.16);
    const puff = g.createRadialGradient(x, y, 0, x, y, r);
    puff.addColorStop(0, 'rgba(255,255,255,0.55)');
    puff.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = puff;
    g.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class SkySystem {
  // sun: the shadow-casting DirectionalLight, hemi: the HemisphereLight
  constructor(scene, { sun, hemi, isMobile = false }) {
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;

    // Time and weather settings
    this.hours = 10.5;                 // start mid-morning
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

    // --- Stars: points on a huge sphere around the car ---
    const starCount = isMobile ? 500 : 900;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      // only the upper sky (a few just under the horizon get hidden by the ground)
      starPos.set([Math.cos(a) * r * 420, Math.abs(u) * 420 + 10, Math.sin(a) * r * 420], i * 3);
    }
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

    // --- Clouds: soft sprites high above, drifting with the wind ---
    const cloudTex = cloudTexture();
    this.clouds = [];
    const cloudCount = isMobile ? 26 : 40;
    for (let i = 0; i < cloudCount; i++) {
      const mat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const sprite = new THREE.Sprite(mat);
      const size = 90 + Math.random() * 120;
      sprite.scale.set(size, size * 0.45, 1);
      sprite.renderOrder = -1;
      sprite.userData = {
        x: (Math.random() - 0.5) * 900, z: (Math.random() - 0.5) * 900,
        y: 110 + Math.random() * 90, rank: Math.random(),   // low rank = shows even on clear days
      };
      scene.add(sprite);
      this.clouds.push(sprite);
    }
    this.wind = new THREE.Vector2(2.2, 0.9);     // metres per second, high up
  }

  // Set by the side panel
  setTime(hours) { this.hours = ((hours % 24) + 24) % 24; }
  setSpeed(speed) { this.speed = speed; }
  setLocked(locked) { this.locked = locked; }
  setWeather(type) {
    this.weather = type;
    this.cloudTarget = type === 'cloudy' ? 0.85 : 0.08;
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
    return this.cloud < 0.3 ? 'clear' : this.cloud > 0.6 ? 'cloudy' : 'partly cloudy';
  }

  // Called every frame. centre: where the car is (the sky follows it)
  update(dt, centre) {
    // --- Time ---
    if (!this.locked) this.hours = (this.hours + (dt * this.speed) / 3600) % 24;

    // --- Weather ---
    if (this.changing) {
      this.nextChange -= dt;
      if (this.nextChange <= 0) {
        // Somewhere between clear and overcast, often a big change
        this.cloudTarget = Math.random() < 0.5 ? Math.random() * 0.35 : 0.45 + Math.random() * 0.5;
        this.nextChange = 50 + Math.random() * 70;
      }
      this.cloud += clamp(this.cloudTarget - this.cloud, -0.008 * dt, 0.008 * dt);   // drifts over a minute or two
      this.weather = this.cloud > 0.45 ? 'cloudy' : 'clear';
    } else {
      this.cloud += clamp(this.cloudTarget - this.cloud, -0.25 * dt, 0.25 * dt);     // quick when you pick it
    }
    const cloud = this.cloud;

    // --- The sun's path: rises in the east (+x) at 6:00, high in the south
    // (+z) at midday, sets in the west at 18:00 ---
    const a = ((this.hours - 6) / 12) * Math.PI;
    this.sunDir.set(Math.cos(a), Math.sin(a) * 0.93, Math.sin(a) * 0.37).normalize();
    const el = this.sunDir.y;                       // sun's height: 1 = overhead, below 0 = night
    const day = smooth(-0.22, 0.3, el);             // 0 at night, 1 in full day (dawn and dusk take a while)
    const twilight = Math.exp(-((el / 0.2) ** 2));  // strongest with the sun on the horizon

    // --- Sunlight (or moonlight at night) ---
    const sunUp = el > -0.02;
    if (sunUp) {
      this.sun.color.copy(C.sunLow).lerp(C.sunHigh, smooth(0, 0.55, el));   // golden low down
      this.sun.intensity = 2.6 * smooth(-0.02, 0.4, el) * (1 - 0.72 * cloud);
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
    this.hemi.intensity = 0.1 + day * (0.5 + 0.35 * cloud);

    // --- Sky colour (also the fog, so the distance fades into it) ---
    const sky = this.skyColour.copy(C.night).lerp(C.dusk, smooth(-0.45, -0.1, el)).lerp(C.day, day);
    sky.lerp(C.glow, 0.5 * twilight * (1 - cloud));
    this._c.copy(C.overcastNight).lerp(C.overcast, day);
    sky.lerp(this._c, cloud * 0.85);
    this.scene.background.copy(sky);
    if (this.scene.fog) this.scene.fog.color.copy(sky);

    // --- Reflections: the paint and metal reflect a bright studio, which
    // must fade at night or the car would glow ---
    this.envFactor = 0.08 + 0.92 * day * (1 - 0.3 * cloud);
    this.applyReflections();

    // --- Stars: out at night, hidden by cloud ---
    this.starMat.opacity = (1 - smooth(-0.35, -0.08, el)) * (1 - cloud) * 0.9;
    this.stars.visible = this.starMat.opacity > 0.01;
    this.stars.position.set(centre.x, 0, centre.z);

    // --- Clouds: more of them the cloudier it is, lit by the sun ---
    const cloudLight = this._c.copy(C.night).lerp(C.dusk, smooth(-0.45, -0.1, el)).lerp(C.sunLow, smooth(-0.15, 0.1, el))
      .lerp(C.white, day * smooth(0.05, 0.45, el));
    const grey = 1 - 0.35 * cloud;   // overcast clouds are greyer
    for (const s of this.clouds) {
      const u = s.userData;
      u.x += this.wind.x * dt;
      u.z += this.wind.y * dt;
      // keep them in a big square around the car
      if (u.x - centre.x > 450) u.x -= 900; else if (u.x - centre.x < -450) u.x += 900;
      if (u.z - centre.z > 450) u.z -= 900; else if (u.z - centre.z < -450) u.z += 900;
      s.position.set(u.x, u.y, u.z);
      const shown = 0.18 + 0.82 * cloud;        // share of clouds out
      const opacity = u.rank < shown ? clamp((shown - u.rank) * 8, 0, 1) * (0.55 + 0.4 * cloud) : 0;
      s.material.opacity = opacity;
      s.visible = opacity > 0.01;
      s.material.color.copy(cloudLight).multiplyScalar(grey);
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
