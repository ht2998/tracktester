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
    this.wind = new THREE.Vector2(4, 1.6);       // metres per second, high up

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
  update(dt, centre, camera = null) {
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

    // --- A cloud drifting over the sun? (checked against each cloud's
    // direction from the car, so it matches what you see) ---
    let cover = 0;
    for (const s of this.clouds) {
      if (!s.visible) continue;
      const u = s.userData;
      const dx = u.x - centre.x, dy = u.y, dz = u.z - centre.z;
      const dist = Math.hypot(dx, dy, dz);
      const along = (dx * this.sunDir.x + dy * this.sunDir.y + dz * this.sunDir.z) / dist;   // cos of the angle
      const size = ((s.scale.x + s.scale.y) * 0.25) / dist;                                // its angular size
      const off = Math.sqrt(Math.max(0, 2 * (1 - along)));
      if (off < size) cover = Math.max(cover, s.material.opacity * (1 - off / size));
    }
    this.covered += (cover - this.covered) * Math.min(1, dt * 1.5);   // eases in and out as it passes
    const shade = 1 - 0.55 * this.covered;

    // --- Sunlight (or moonlight at night) ---
    const sunUp = el > -0.02;
    if (sunUp) {
      this.sun.color.copy(C.sunLow).lerp(C.sunHigh, smooth(0, 0.55, el));   // golden low down
      this.sun.intensity = 2.6 * smooth(-0.02, 0.4, el) * (1 - 0.72 * cloud) * shade;
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
    // One full turn a day, in step with the sun
    this.skyTurn.setFromAxisAngle(this.pole, -(this.hours / 24) * Math.PI * 2);
    this.stars.quaternion.copy(this.skyTurn);

    // The wind high up slowly swings round (a full circle every half hour or so)
    this.windAngle = (this.windAngle ?? 0.38) + dt * 0.0035 + Math.sin(performance.now() / 97000) * dt * 0.002;
    const windSpeed = 4.3;
    this.wind.set(Math.cos(this.windAngle) * windSpeed, Math.sin(this.windAngle) * windSpeed);

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
      const shown = 0.42 + 0.58 * cloud;        // share of clouds out (a fair few even on clear days)
      const opacity = u.rank < shown ? clamp((shown - u.rank) * 8, 0, 1) * (0.55 + 0.4 * cloud) : 0;
      s.material.opacity = opacity;
      s.visible = opacity > 0.01;
      s.material.color.copy(cloudLight).multiplyScalar(grey);
    }
    this.placeSunAndMoon(centre, camera);
  }

  // The sun and moon in the sky, and the glare. camera: to work out where
  // the sun is on screen
  placeSunAndMoon(centre, camera) {
    const el = this.sunDir.y;
    const cloud = this.cloud;
    // Sun: 400 m out along its path (inside the camera's view distance)
    const low = 1 - smooth(0.02, 0.35, el);                     // 1 near the horizon
    const sunCol = this._c.copy(C.sunHigh).lerp(C.sunLow, low);
    const sunVis = smooth(-0.06, 0.02, el) * (1 - 0.85 * cloud) * (1 - 0.7 * this.covered);
    this.sunPos.copy(this.sunDir).multiplyScalar(400).add(centre);
    this.sunDisc.position.copy(this.sunPos);
    this.sunHalo.position.copy(this.sunPos);
    const core = 22 + 10 * low;                                  // bigger low down
    this.sunDisc.scale.set(core, core, 1);
    this.sunHalo.scale.set(core * 6, core * 6, 1);
    this.sunDisc.material.color.copy(sunCol);
    this.sunHalo.material.color.copy(sunCol);
    this.sunDisc.material.opacity = sunVis;
    this.sunHalo.material.opacity = sunVis * (0.35 + 0.3 * low);
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
