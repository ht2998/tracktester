// =====================================================================
// RENDERING: sets up the 3D scene, lighting, cameras and the test car,
// and runs the main loop that drives everything each frame.
// Track Tester - phase 1
// =====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { readControls, wasTapped } from './input.js';
import { CarPhysics, CATERHAM, TRANSMISSIONS, TYRES } from './physics.js';
import { EngineSound } from './sound.js';
import { TyreSmoke } from './smoke.js';
import { Hud } from './hud.js';
import { OilSlicks } from './oil.js';
import { SkidMarks, TyreShreds } from './skids.js';
import { buildScenery } from './scenery.js';
import { GrassPatch, GrassField, StoneField } from './grass.js';
import { SkySystem, TIME_SPEEDS } from './sky.js';
import { EngineDebris } from './debris.js';
import { TouchControls, isTouchDevice } from './touch.js';
import { startUpdates, BUILD as UPDATES_BUILD } from './updates.js';
import { GodRays, BUILD as GODRAYS_BUILD } from './godrays.js';
import { RainSystem } from './rain.js';
import { buildSepang } from './sepang.js';
import * as sepangFile from './sepang.js';
import { buildFlora } from './flora.js';
import { RacingLine, LapTimer, TrackMap } from './racingline.js';
import * as racingLineFile from './racingline.js';
import * as floraFile from './flora.js';
import { Cockpit, EYE } from './cockpit.js';
import { TyreLooks } from './tyres.js';
import { setGround, groundAt } from './ground.js';
import { buildScorpion, TANK_EYE, TankPhysics } from './tank.js';
import * as tankFile from './tank.js';
import * as groundFile from './ground.js';
import * as tyresFile from './tyres.js';
import * as cockpitFile from './cockpit.js';
import { FlyingBits, MetalFlakes, LooseWheel } from './effects.js';
import * as rainFile from './rain.js';
import * as effectsFile from './effects.js';
// Every file's version stamp, for the old-file check (see updates.js)
import * as inputFile from './input.js';
import * as physicsFile from './physics.js';
import * as soundFile from './sound.js';
import * as smokeFile from './smoke.js';
import * as hudFile from './hud.js';
import * as oilFile from './oil.js';
import * as skidsFile from './skids.js';
import * as sceneryFile from './scenery.js';
import * as grassFile from './grass.js';
import * as skyFile from './sky.js';
import * as debrisFile from './debris.js';
import * as touchFile from './touch.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
const BUILD = 30;

// What's new + the old-file check. (A file too old to have a stamp counts as 0.)
const updateScreen = startUpdates({
  'rendering.js': BUILD, 'updates.js': UPDATES_BUILD, 'godrays.js': GODRAYS_BUILD,
  'input.js': inputFile.BUILD, 'physics.js': physicsFile.BUILD, 'sound.js': soundFile.BUILD,
  'smoke.js': smokeFile.BUILD, 'hud.js': hudFile.BUILD, 'oil.js': oilFile.BUILD,
  'skids.js': skidsFile.BUILD, 'scenery.js': sceneryFile.BUILD, 'grass.js': grassFile.BUILD,
  'sky.js': skyFile.BUILD, 'debris.js': debrisFile.BUILD, 'touch.js': touchFile.BUILD,
  'rain.js': rainFile.BUILD, 'effects.js': effectsFile.BUILD, 'cockpit.js': cockpitFile.BUILD, 'tyres.js': tyresFile.BUILD, 'sepang.js': sepangFile.BUILD, 'flora.js': floraFile.BUILD, 'racingline.js': racingLineFile.BUILD, 'ground.js': groundFile.BUILD, 'tank.js': tankFile.BUILD,
});

// ---------------------------------------------------------------------
// QUALITY SETTINGS
// Phones get lighter settings so they stay smooth and don't overheat.
// ---------------------------------------------------------------------
const isMobile = window.matchMedia('(pointer: coarse)').matches;

const QUALITY = {
  pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
  shadowMapSize: isMobile ? 1024 : 2048,
  antialias: !isMobile,
  smokeParticles: isMobile ? 200 : 400,
  smokeRate: isMobile ? 18 : 30,
};

// ---------------------------------------------------------------------
// RENDERER: the part that actually draws to the screen
// ---------------------------------------------------------------------
const container = document.getElementById('game');

const renderer = new THREE.WebGLRenderer({ antialias: QUALITY.antialias });
renderer.setPixelRatio(QUALITY.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // more natural, film-like colours
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// ---------------------------------------------------------------------
// SCENE: the 3D world everything lives in
// ---------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9ef);   // sky blue
scene.fog = new THREE.Fog(0x9ec9ef, 40, 160);   // distant things fade into the sky

// WHICH PLACE TO DRIVE: the test area (gravel trap, grass, slalom, cones,
// garages and barriers) or Sepang (a flat mock-up of the real circuit).
// Picked in the side panel; the page reloads to build the other one.
const TRACK_KEY = 'tracktester-track';
let TRACK = 'test';
try { if (localStorage.getItem(TRACK_KEY) === 'sepang') TRACK = 'sepang'; } catch (e) { /* storage blocked: use the test area */ }
const SEPANG = TRACK === 'sepang';

// Reflections: gives the car paint and metal something to reflect
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------------------------------------------------------------------
// CAMERA + SHOWROOM CONTROLS
// ---------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2.4, -6.5);
camera.layers.enable(1);   // layer 1 = the sky (clouds, sun, stars): seen, but doesn't block sun rays

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;      // smooth, gliding movement
controls.enablePan = false;         // keep the camera always circling the car
controls.minDistance = 2.5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.6;  // can tilt low enough to look up past the car at the sky
                                         // (kept above the ground in updateCamera)
controls.enabled = false;           // starts in chase mode
controls.update();

// ---------------------------------------------------------------------
// LIGHTING
// ---------------------------------------------------------------------
// Soft light from the sky above and the ground below
const hemiLight = new THREE.HemisphereLight(0xdbeeff, 0x5a5040, 0.6);
scene.add(hemiLight);

// The sun: bright, directional, and casts shadows. It follows the car
// so the shadows stay sharp wherever you drive.
const SUN_OFFSET = new THREE.Vector3(6, 10, 4);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
sun.position.copy(SUN_OFFSET);
sun.castShadow = true;
sun.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize);
// The shadows cover a big square (72 m across, 56 m on phones), pushed
// ahead of the car towards where you're looking, so buildings cast their
// shadows long before you reach them instead of popping in up close
const SHADOW_HALF = isMobile ? 28 : 36;
sun.shadow.camera.left = -SHADOW_HALF;
sun.shadow.camera.right = SHADOW_HALF;
sun.shadow.camera.top = SHADOW_HALF;
sun.shadow.camera.bottom = -SHADOW_HALF;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;   // (stops speckled "shadow acne" on surfaces facing the sun)
scene.add(sun);
scene.add(sun.target);

// Time of day and weather (sky.js): moves the sun, colours the sky and
// light, brings out the stars at night and the clouds when it's cloudy
// (the sun follows its real path for where the track is: Sepang, Malaysia;
// the test area uses Singapore. North is -z in both.)
const sky = new SkySystem(scene, { sun, hemi: hemiLight, isMobile,
  place: SEPANG ? { lat: 2.76, solarNoon: 13.15, north: { x: 0, z: -1 } } : { lat: 1.35, solarNoon: 13.05, north: { x: 0, z: -1 } } });

// Moves the sun's shadow square: centred about 14 m ahead of the car (the
// way the camera looks), and snapped to the shadow map's own pixel grid so
// shadows don't shimmer or crawl as you drive
const carSpot = new THREE.Vector3();
const shadowCentre = new THREE.Vector3();
const lightRight = new THREE.Vector3();
const lightUp = new THREE.Vector3();
const lookAhead = new THREE.Vector3();
function placeShadows() {
  camera.getWorldDirection(lookAhead);
  lookAhead.y = 0;
  if (lookAhead.lengthSq() < 1e-6) lookAhead.set(0, 0, 1);
  lookAhead.normalize();
  shadowCentre.copy(carSpot).addScaledVector(lookAhead, SHADOW_HALF * 0.4);
  const dir = sky.lightDir;
  lightRight.set(dir.z, 0, -dir.x);                       // across the light, level
  if (lightRight.lengthSq() < 1e-6) lightRight.set(1, 0, 0);
  lightRight.normalize();
  lightUp.crossVectors(dir, lightRight).normalize();
  const texel = (2 * SHADOW_HALF) / QUALITY.shadowMapSize;
  const a = shadowCentre.dot(lightRight), b = shadowCentre.dot(lightUp);
  shadowCentre.addScaledVector(lightRight, Math.round(a / texel) * texel - a)
    .addScaledVector(lightUp, Math.round(b / texel) * texel - b);
  sun.target.position.copy(shadowCentre);
  sun.position.copy(shadowCentre).addScaledVector(dir, 100);   // the sun (or moon), far off in its direction
}

// ---------------------------------------------------------------------
// HILLS: things built flat (the track, kerbs, barriers, buildings, trees,
// the racing line) are moved up onto the ground's real height. Big shapes
// (the track surface, long barriers) bend to follow it point by point;
// small things (a post, a tree, a sign) just move up as a whole, so they
// stay upright.
// ---------------------------------------------------------------------
function liftOntoGround(objects) {
  const v = new THREE.Vector3(), m4 = new THREE.Matrix4(), inv = new THREE.Matrix4();
  const shared = new Map();
  const count = (o) => o.traverse((c) => { if (c.isMesh && c.geometry) shared.set(c.geometry, (shared.get(c.geometry) || 0) + 1); });
  objects.forEach(count);
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const refresh = (o) => { if (o.updateWorldMatrix) o.updateWorldMatrix(true, false); else o.updateMatrixWorld(true); };
  const liftWhole = (o) => {
    o.getWorldPosition(v);
    o.position.y += groundAt(v.x, v.z);
    o.updateMatrixWorld(true);
  };
  const visit = (o) => {
    if (o.isInstancedMesh) {
      refresh(o);
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m4);
        m4.decompose(pos, q, sc);
        v.copy(pos).applyMatrix4(o.matrixWorld);
        pos.y += groundAt(v.x, v.z);
        m4.compose(pos, q, sc);
        o.setMatrixAt(i, m4);
      }
      o.instanceMatrix.needsUpdate = true;
      o.computeBoundingSphere?.();
      return;
    }
    if (o.isMesh && o.geometry?.attributes?.position) {
      const g = o.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const big = g.boundingSphere && g.boundingSphere.radius * Math.max(o.scale.x, o.scale.z) > 4;
      if (!big || shared.get(g) > 1) { liftWhole(o); return; }
      // bend it: each corner moved up by the ground's height under it
      refresh(o);
      inv.copy(o.matrixWorld).invert();
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
        v.y += groundAt(v.x, v.z);
        v.applyMatrix4(inv);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      p.needsUpdate = true;
      g.computeBoundingSphere();
      g.computeBoundingBox?.();
      o.children.forEach(visit);   // (anything fixed to it still needs lifting)
      return;
    }
    if (o.children && o.children.length && !o.isLight) { o.children.forEach(visit); return; }
    if (!o.isLight) liftWhole(o);
  };
  objects.forEach(visit);
}

// ---------------------------------------------------------------------
// GROUND: a big tarmac area
// ---------------------------------------------------------------------
// (at Sepang the ground is grass, and the track is laid on top of it)
const GROUND_DRY = SEPANG
  ? { roughness: 1, colour: new THREE.Color(0xffffff) }
  : { roughness: 0.95, colour: new THREE.Color(0x4a4d50) };   // rain darkens it and makes it shiny
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(SEPANG ? 3000 : 2000, SEPANG ? 3000 : 2000),
  new THREE.MeshStandardMaterial({ color: GROUND_DRY.colour.getHex(), roughness: GROUND_DRY.roughness })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid lines help you feel your speed and see where you're sliding
const grid = new THREE.GridHelper(600, 300, 0x5d6166, 0x56595d);
grid.position.y = 0.002;
if (!SEPANG) scene.add(grid);

// SEPANG (sepang.js): the whole circuit, its buildings and barriers
// (gravel stone colours, for the textures and the loose stones)
const GRAVEL_SHADES = ['#9c8158', '#c9b086', '#a88d61', '#d8c39c', '#8a7350', '#bfa476', '#b39769'];
const beforeTrack = new Set(scene.children);
const sepang = SEPANG ? buildSepang(scene, { isMobile, gravelMaps: makeGravelMaps() }) : null;
// The ground's hills and dips, for everything that sits on it (ground.js)
if (sepang) setGround(sepang.heightAt);
// The racing line, braking zones, corner panel, distance boards and old
// rubber on the track (racingline.js). On by default; L (or the phone
// menu) switches the line and the corner panel off and on.
const racing = sepang ? new RacingLine(scene, { line: sepang.line, corners: sepang.cornerList || [], car: CATERHAM, isMobile }) : null;
let racingLineOn = true;
try { racingLineOn = localStorage.getItem('tracktester-racingline') !== 'off'; } catch (e) { /* storage blocked */ }
racing?.setVisible(racingLineOn);
// Lap and sector timing, and the track map in the corner
const lapTimer = racing ? new LapTimer(racing, { onTrack: (x, z) => { const s = sepang.surfaceAt(x, z); return s === 'tarmac' || s === 'kerb'; } }) : null;
const trackMap = racing ? new TrackMap(racing, lapTimer.cuts) : null;
// Lay the circuit, its barriers, buildings and the racing line onto the hills
if (sepang) liftOntoGround([...scene.children].filter((o) => !beforeTrack.has(o)));
if (sepang) {
  sepang.grassTexture.repeat.set(3000 / 6, 3000 / 6);
  ground.material.map = sepang.grassTexture;
  ground.position.y = sepang.groundY + sepang.terrain.base - 0.06;   // the open plain beyond: below the lowest point, so it's never above the ground
  // the rolling grass round the circuit (the same texture, lined up)
  const hills = new THREE.Mesh(sepang.terrain.geometry(sepang.groundY, 3000), ground.material);
  hills.receiveShadow = true;
  scene.add(hills);
  ground.material.needsUpdate = true;
  // see much further: it's a big place
  scene.fog.near = sepang.view.fogNear;
  scene.fog.far = sepang.view.fogFar;
  camera.far = sepang.view.far;
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------------
// GRAVEL TRAP: a 5 x 5 square patch (10 m x 10 m) ahead and to the right
// of the start. Loose, slippery and draggy, and the stones can puncture a
// tyre. Dirt tyres cope with it best.
// ---------------------------------------------------------------------
const GRAVEL = { minX: -16, maxX: -6, minZ: 6, maxZ: 16 };
function inGravel(x, z) {
  if (sepang) return sepang.surfaceAt(x, z) === 'gravel';
  return x > GRAVEL.minX && x < GRAVEL.maxX && z > GRAVEL.minZ && z < GRAVEL.maxZ;
}

// The gravel's look: a colour map and a bumpy normal map, each tile 3.5 m
// across (stones about 1-3 cm). Used for the test area's gravel trap and
// Sepang's gravel traps.
function makeGravelMaps() {
  // Paint the stones twice: once in colour, and once as a height map (each
  // pebble a little dome) that becomes a normal map, so the light catches
  // every stone and the surface looks bumpy rather than printed flat.
  const size = 512;
  const colour = document.createElement('canvas');
  const height = document.createElement('canvas');
  colour.width = colour.height = height.width = height.height = size;
  const c = colour.getContext('2d');
  const h = height.getContext('2d');
  c.fillStyle = '#a88c5f';
  c.fillRect(0, 0, size, size);
  h.fillStyle = '#000';
  h.fillRect(0, 0, size, size);
  const shades = GRAVEL_SHADES;
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 1.6 + Math.random() * 3.2;
    const squash = 0.6 + Math.random() * 0.4, angle = Math.random() * Math.PI;
    const shade = shades[(Math.random() * shades.length) | 0];
    // Drawn again across each edge so the texture tiles without seams
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const px = x + ox, py = y + oy;
      if (px < -8 || px > size + 8 || py < -8 || py > size + 8) continue;
      c.fillStyle = shade;
      c.beginPath();
      c.ellipse(px, py, r, r * squash, angle, 0, Math.PI * 2);
      c.fill();
      const dome = h.createRadialGradient(px - r * 0.2, py - r * 0.2, 0, px, py, r);
      dome.addColorStop(0, 'rgba(255,255,255,1)');
      dome.addColorStop(1, 'rgba(255,255,255,0)');
      h.fillStyle = dome;
      h.beginPath();
      h.ellipse(px, py, r, r * squash, angle, 0, Math.PI * 2);
      h.fill();
    }
  }
  // Height map -> normal map (the slope of the height at each pixel)
  const hp = h.getImageData(0, 0, size, size).data;
  const normal = h.createImageData(size, size);
  const at = (x, y) => hp[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.5;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.5;
      const len = Math.hypot(dx, dy, 1);
      const k = (y * size + x) * 4;
      normal.data[k] = (-dx / len * 0.5 + 0.5) * 255;
      normal.data[k + 1] = (dy / len * 0.5 + 0.5) * 255;
      normal.data[k + 2] = (1 / len * 0.5 + 0.5) * 255;
      normal.data[k + 3] = 255;
    }
  }
  h.putImageData(normal, 0, 0);
  const colourMap = new THREE.CanvasTexture(colour);
  colourMap.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(height);
  for (const t of [colourMap, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }
  return { colourMap, normalMap };
}

function buildGravel() {
  const shades = GRAVEL_SHADES;
  const { colourMap, normalMap } = makeGravelMaps();
  const w = GRAVEL.maxX - GRAVEL.minX, d = GRAVEL.maxZ - GRAVEL.minZ;
  for (const t of [colourMap, normalMap]) t.repeat.set(w / 3.5, d / 3.5);   // each tile is 3.5 m: stones about 1-3 cm
  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: colourMap, normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 1 })
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set((GRAVEL.minX + GRAVEL.maxX) / 2, 0.004, (GRAVEL.minZ + GRAVEL.maxZ) / 2);
  patch.receiveShadow = true;
  scene.add(patch);

  // A scattering of real 3D stones on top, half sunk in (one draw call)
  const count = isMobile ? 350 : 700;
  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }),
    count
  );
  stones.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const tint = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 0.012 + Math.random() * Math.random() * 0.035;
    p.set(GRAVEL.minX + 0.05 + Math.random() * (w - 0.1), r * 0.25, GRAVEL.minZ + 0.05 + Math.random() * (d - 0.1));
    q.setFromEuler(e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    sc.set(r * (0.8 + Math.random() * 0.5), r * (0.5 + Math.random() * 0.3), r * (0.8 + Math.random() * 0.5));
    stones.setMatrixAt(i, m.compose(p, q, sc));
    stones.setColorAt(i, tint.set(shades[(Math.random() * shades.length) | 0]));
  }
  scene.add(stones);
}
if (!SEPANG) buildGravel();

// GRASS: a big patch (19 m x 28 m) just past the gravel trap.
// Slippery and a bit draggy (see SURFACES.grass in physics.js); tyres
// press it flat and leave dark brown tracks.
const GRASS = { minX: -24, maxX: -5, minZ: 16, maxZ: 44 };
// At Sepang the grass is everywhere off the track, so the 3D tufts grow
// wherever the camera is looking (thinning out and fading into the painted
// grass far away), and the gravel traps get loose stones the same way.
// They keep a little away from the edges, and out of the buildings.
const surfaceClear = (want) => (x, z) => {
  const S = sepang.surfaceAt;
  return S(x, z) === want && S(x + 0.7, z) === want && S(x - 0.7, z) === want
    && S(x, z + 0.7) === want && S(x, z - 0.7) === want && !(rain.roofAt(x, z) > 0)
    && sepang.cleanly(want, x, z);   // (grass never on the gravel, gravel stones never on the grass)
};
const grass = SEPANG
  ? new GrassField(scene, surfaceClear('grass'), {
    groundY: sepang.groundY, near: isMobile ? 8 : 10, far: isMobile ? 35 : 70, density: isMobile ? 10 : 20, maxTufts: isMobile ? 16000 : 60000,
  })
  : new GrassPatch(scene, GRASS, { tufts: isMobile ? 9000 : 24000 });
const stones = SEPANG
  ? new StoneField(scene, surfaceClear('gravel'), { groundY: 0.0005, near: 10, far: isMobile ? 25 : 45, density: 7, maxStones: isMobile ? 2500 : 8000, shades: GRAVEL_SHADES })
  : null;

// ---------------------------------------------------------------------
// CONES: drawn with INSTANCING (one cone model, drawn many times at once)
// They're ghosts for now: you drive through them. Collisions come later.
// ---------------------------------------------------------------------
function buildCones() {
  const positions = [];
  // A slalom straight ahead
  for (let i = 0; i < 10; i++) positions.push([i % 2 === 0 ? -1.5 : 1.5, 25 + i * 14]);
  // A ring to drive circles and drift around
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    positions.push([-40 + Math.cos(a) * 15, 40 + Math.sin(a) * 15]);
  }

  const coneGeo = new THREE.ConeGeometry(0.16, 0.45, 16);
  coneGeo.translate(0, 0.225, 0);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6a13, roughness: 0.6 });
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, positions.length);
  cones.castShadow = true;
  const m = new THREE.Matrix4();
  positions.forEach(([x, z], i) => {
    m.makeTranslation(x, 0, z);
    cones.setMatrixAt(i, m);
  });
  scene.add(cones);
}
if (!SEPANG) buildCones();

// Buildings, walls, barriers and fences (scenery.js). Their surfaces are
// registered for echoes once the sound is set up, further down.
const echoSurfaces = sepang ? sepang.echoes : buildScenery(scene);

// GRASSY ISLANDS on the test area's open ground: round patches of grass
// (real grass to drive on) scattered round the middle, each with its own
// trees, bushes and long grass. The area round the start, the buildings
// and the gravel trap stays open tarmac for driving.
const ISLANDS = [];
if (!SEPANG) {
  let t = 777;
  const rnd = () => { t = (t * 16807) % 2147483647; return t / 2147483647; };
  const blocked = (x, z, r) => (echoSurfaces.colliders || []).some((c) => x + r > c.minX - 6 && x - r < c.maxX + 6 && z + r > c.minZ - 6 && z - r < c.maxZ + 6)
    || (echoSurfaces.roofs || []).some((c) => x + r > c.minX - 6 && x - r < c.maxX + 6 && z + r > c.minZ - 6 && z - r < c.maxZ + 6);
  for (let tries = 0; tries < 400 && ISLANDS.length < (isMobile ? 16 : 26); tries++) {
    const a = rnd() * Math.PI * 2, d = 95 + rnd() * 200, r = 10 + rnd() * 22;
    const x = Math.sin(a) * d, z = Math.cos(a) * d;
    if (Math.hypot(x, z) - r < 80) continue;                                  // keep the middle open
    if (ISLANDS.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 25)) continue;   // room to drive between them
    if (blocked(x, z, r)) continue;
    ISLANDS.push({ x, z, r });
  }
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x55743a, roughness: 1 });
  for (const isl of ISLANDS) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(isl.r, 40), islandMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(isl.x, 0.003, isl.z);
    disc.receiveShadow = true;
    scene.add(disc);
  }
}
const onIsland = (x, z, margin = 0) => ISLANDS.some((o) => Math.hypot(x - o.x, z - o.z) < o.r - margin);

// TREES, BUSHES AND TALL GRASS (flora.js): at Sepang a tropical mix all
// round the circuit, kept well back from the track, run-offs and buildings;
// at the test area, woods round the edges of the driving ground. The tree
// trunks are solid.
const beforeFlora = new Set(scene.children);
const flora = (() => {
  const colliders = echoSurfaces.colliders || (echoSurfaces.colliders = []);
  const roofs = echoSurfaces.roofs || [];
  // anything solid nearby? (sorted into 20 m squares so it's quick to check)
  const solid = new Map();
  for (const c of colliders) {
    for (let bx = Math.floor(c.minX / 20); bx <= Math.floor(c.maxX / 20); bx++) {
      for (let bz = Math.floor(c.minZ / 20); bz <= Math.floor(c.maxZ / 20); bz++) {
        const key = bx * 100003 + bz;
        if (!solid.has(key)) solid.set(key, []);
        solid.get(key).push(c);
      }
    }
  }
  const nearSolid = (x, z, r) => {
    for (let bx = Math.floor((x - r) / 20); bx <= Math.floor((x + r) / 20); bx++) {
      for (let bz = Math.floor((z - r) / 20); bz <= Math.floor((z + r) / 20); bz++) {
        for (const c of solid.get(bx * 100003 + bz) || []) {
          if (x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r) return true;
        }
      }
    }
    return false;
  };
  const underRoof = (x, z) => roofs.some((r) => x > r.minX - 3 && x < r.maxX + 3 && z > r.minZ - 3 && z < r.maxZ + 3);
  if (SEPANG) {
    const S = sepang.surfaceAt;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const pnt of sepang.line) { minX = Math.min(minX, pnt.x); maxX = Math.max(maxX, pnt.x); minZ = Math.min(minZ, pnt.z); maxZ = Math.max(maxZ, pnt.z); }
    const ring = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    // thick woods further out: lots of trees in simpler shapes, kept well
    // away from the track (you see them across the run-offs and beyond)
    const woods = buildFlora(scene, {
      isMobile, style: 'tropical', forest: true, groves: false, seed: 77,
      area: { minX: minX - 600, maxX: maxX + 600, minZ: minZ - 600, maxZ: maxZ + 600 },
      colliders,
      canPlace: (x, z) => {
        if (S(x, z) !== 'grass') return false;
        for (const [dx, dz] of ring) if (S(x + dx * 45, z + dz * 45) !== 'grass' || S(x + dx * 25, z + dz * 25) !== 'grass') return false;
        return !underRoof(x, z) && !nearSolid(x, z, 8);
      },
    });
    const near = buildFlora(scene, {
      isMobile, style: 'tropical',
      area: { minX: minX - 260, maxX: maxX + 260, minZ: minZ - 260, maxZ: maxZ + 260 },
      colliders,
      canPlace: (x, z, clear) => {
        if (S(x, z) !== 'grass') return false;
        for (const [dx, dz] of ring) {
          if (S(x + dx * clear, z + dz * clear) !== 'grass' || S(x + dx * clear * 0.5, z + dz * clear * 0.5) !== 'grass') return false;
        }
        return !underRoof(x, z) && !nearSolid(x, z, 3);
      },
    });
    return { count: near.count + woods.count, setWind(x, z, t) { near.setWind(x, z, t); woods.setWind(x, z, t); } };
  }
  // on the islands (trees a few metres in from the edge, so you can drive
  // round them), and woods beyond the far edges of the ground
  const onIslands = buildFlora(scene, {
    isMobile, style: 'temperate', seed: 99, density: 0.6, groves: false,
    area: { minX: -310, maxX: 310, minZ: -310, maxZ: 310 },
    colliders,
    canPlace: (x, z, clear, isTree) => onIsland(x, z, isTree ? 3 : 0.8) && !nearSolid(x, z, 2),
  });
  const woods = buildFlora(scene, {
    isMobile, style: 'temperate',
    area: { minX: -480, maxX: 480, minZ: -480, maxZ: 480 },
    colliders,
    canPlace: (x, z) => !(Math.abs(x) < 310 && Math.abs(z) < 310) && !underRoof(x, z) && !nearSolid(x, z, 4),
  });
  return {
    count: onIslands.count + woods.count,
    setWind(x, z, t) { onIslands.setWind(x, z, t); woods.setWind(x, z, t); },
  };
})();
// (the trees and bushes onto the hills)
if (sepang) liftOntoGround([...scene.children].filter((o) => !beforeFlora.has(o)));

// ---------------------------------------------------------------------
// RAIN (rain.js): falling rain, a wet track that dries out afterwards,
// puddles that form in random places on the tarmac, and mud on the grass
// (which takes longer to form). Puddle spots are picked fresh each time the
// game loads, kept off the gravel, grass, buildings and walls.
// ---------------------------------------------------------------------
function pickPuddleSpots(count) {
  const blocked = [
    [-25, 0, -4, 45],      // gravel trap, grass patch, tyre wall and fence
    [21, 39, 33, 83],      // pit garages
    [-31, 71, -15, 87],    // race control
    [8.5, 94, 11.5, 142],  // concrete wall
    [-12, 94, -8, 146],    // Armco and fence
  ];
  const spots = [];
  let tries = 0;
  while (spots.length < count && tries++ < 500) {
    const r = 1.2 + Math.random() * 2.2;
    const x = -60 + Math.random() * 90, z = -30 + Math.random() * 180;
    const hit = blocked.some(([x0, z0, x1, z1]) => x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r);
    const tooClose = spots.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 4);
    if (hit || tooClose) continue;
    spots.push({ x, z, r, start: Math.random() * 0.5 });   // some fill up later than others
  }
  // ...and always one or two near the start, so you meet them straight away
  spots.push({ x: 3 + Math.random() * 3, z: -10 - Math.random() * 6, r: 2.2, start: 0 });
  spots.push({ x: -2 - Math.random() * 3, z: 32 + Math.random() * 8, r: 1.8, start: 0.15 });
  return spots;
}
const rain = new RainSystem(scene, {
  isMobile,
  roofs: echoSurfaces.roofs || [],         // rain stops on the garage and race control roofs
  spots: {
    puddles: sepang ? sepang.puddles : pickPuddleSpots(isMobile ? 12 : 18),
    // Mud: low spots in the grass patch
    mud: sepang ? sepang.mud : Array.from({ length: 6 }, (_, i) => ({
      x: -21 + Math.random() * 13, z: 19 + (i / 6) * 22 + Math.random() * 3,
      r: 1.1 + Math.random() * 1.2, start: i === 0 ? 0 : Math.random() * 0.5,
    })),
  },
});

// ---------------------------------------------------------------------
// MATERIALS for the car
// ---------------------------------------------------------------------
const MAT = {
  paint: new THREE.MeshPhysicalMaterial({  // British racing green with a glossy clear coat
    color: 0x0f4d2c, metalness: 0.3, roughness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.08,
  }),
  aluminium: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1.0, roughness: 0.3 }),
  black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 }),
  interior: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 }),
  tyre: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }),
  spoke: new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.7, roughness: 0.35 }),
  // brake disc: bare iron, glowing red-orange when very hot (see updateWheels)
  disc: new THREE.MeshStandardMaterial({ color: 0x6d6e70, metalness: 0.75, roughness: 0.45, emissive: 0xff3a00, emissiveIntensity: 0 }),
  caliper: new THREE.MeshStandardMaterial({ color: 0xb3221c, metalness: 0.3, roughness: 0.45 }),
  arm: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, metalness: 0.6, roughness: 0.4 }),
  damper: new THREE.MeshStandardMaterial({ color: 0xd8262e, metalness: 0.3, roughness: 0.4 }),
  lens: new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0x332a10, roughness: 0.1 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.35,
  }),
};
// Fenders are open shapes, so draw both sides
const fenderMat = MAT.paint.clone();
fenderMat.side = THREE.DoubleSide;

// ---------------------------------------------------------------------
// TEST CAR: a simple Caterham-style car built from basic shapes
// The front of the car points along +z, and +x is the car's left side.
// ---------------------------------------------------------------------
const WHEEL_RADIUS = 0.288;   // 195/50 R15, same as the physics
const WHEEL_WIDTH = 0.2;
const TRACK_HALF = 0.68;   // half the distance between left and right wheels
const FRONT_AXLE = 1.1;
const REAR_AXLE = -1.1;

function part(geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Draws many rods between pairs of points as ONE instanced object.
// Each rod is [startPoint, endPoint, thickness].
// Joins several shapes into one (keeping each as its own group, so a tyre
// can have different materials for its tread and sidewalls)
function mergeGeos(geos, groups = false) {
  const out = new THREE.BufferGeometry();
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0, start = 0;
  geos.forEach((g, gi) => {
    const gg = g.index ? g : g;
    const p = gg.attributes.position, n = gg.attributes.normal, u = gg.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
    }
    const ix = gg.index ? Array.from(gg.index.array) : [...Array(p.count).keys()];
    for (const v of ix) idx.push(v + base);
    if (groups) out.addGroup(start, ix.length, gi);
    start += ix.length;
    base += p.count;
  });
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

// An open-spoked alloy rim (axle along x, the outer face towards +x):
// the barrel the tyre sits on, a lip round the outside, six pairs of thin
// split spokes dished out to the hub, and four wheel nuts round a centre cap
function buildRimGeometry(r, width) {
  const parts = [];
  // barrel and lips
  parts.push(new THREE.CylinderGeometry(r * 1.005, r * 1.005, width * 0.92, 32, 1, true).rotateZ(Math.PI / 2));
  parts.push(new THREE.TorusGeometry(r * 1.005, 0.008, 6, 32).rotateY(Math.PI / 2).translate(width * 0.5 + 0.002, 0, 0));
  parts.push(new THREE.TorusGeometry(r * 1.005, 0.006, 6, 32).rotateY(Math.PI / 2).translate(-width * 0.5 - 0.002, 0, 0));
  // spokes: from the hub (dished out towards the face) to the barrel
  const hubR = 0.045, faceX = width * 0.36, innerX = width * 0.26;
  for (let k = 0; k < 6; k++) {
    for (const split of [-0.13, 0.13]) {
      const a = (k / 6) * Math.PI * 2;
      const a0 = a + split * 0.35, a1 = a + split;            // the pair splits apart towards the rim
      const p0 = new THREE.Vector3(faceX + 0.01, Math.cos(a0) * hubR, Math.sin(a0) * hubR);
      const p1 = new THREE.Vector3(innerX + 0.02, Math.cos(a1) * r * 0.93, Math.sin(a1) * r * 0.93);
      const len = p0.distanceTo(p1);
      const spoke = new THREE.BoxGeometry(0.016, len, 0.014);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
      spoke.applyQuaternion(q);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      spoke.translate(mid.x, mid.y, mid.z);
      parts.push(spoke);
    }
  }
  // hub, centre cap and wheel nuts
  parts.push(new THREE.CylinderGeometry(hubR + 0.008, hubR + 0.012, 0.03, 20).rotateZ(Math.PI / 2).translate(faceX, 0, 0));
  parts.push(new THREE.CylinderGeometry(0.02, 0.022, 0.016, 16).rotateZ(Math.PI / 2).translate(faceX + 0.022, 0, 0));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    parts.push(new THREE.CylinderGeometry(0.0065, 0.0065, 0.018, 6).rotateZ(Math.PI / 2).translate(faceX + 0.018, Math.cos(a) * 0.032, Math.sin(a) * 0.032));
  }
  return mergeGeos(parts);
}

function rodSet(rods, material) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 8);   // scaled per rod
  const mesh = new THREE.InstancedMesh(geo, material, rods.length);
  mesh.castShadow = true;
  const up = new THREE.Vector3(0, 1, 0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const m = new THREE.Matrix4();
  rods.forEach(([p1, p2, radius], i) => {
    a.fromArray(p1);
    b.fromArray(p2);
    dir.subVectors(b, a);
    const length = dir.length();
    mid.addVectors(a, b).multiplyScalar(0.5);
    q.setFromUnitVectors(up, dir.normalize());
    scale.set(radius, length, radius);
    m.compose(mid, q, scale);
    mesh.setMatrixAt(i, m);
  });
  return mesh;
}

// Smooth shading across a shape's seams: points in the same spot share one
// averaged normal (so rounded edges look round, not faceted)
function smoothNormals(g) {
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal;
  if (!pos || !nor || !pos.array || !nor.array) return;
  const P = pos.array, N = nor.array, groups = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(P[i * 3] * 2e3)},${Math.round(P[i * 3 + 1] * 2e3)},${Math.round(P[i * 3 + 2] * 2e3)}`;
    let list = groups.get(key);
    if (!list) groups.set(key, list = []);
    list.push(i);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    let x = 0, y = 0, z = 0;
    for (const i of list) { x += N[i * 3]; y += N[i * 3 + 1]; z += N[i * 3 + 2]; }
    const l = Math.hypot(x, y, z) || 1;
    for (const i of list) { N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l; }
  }
  nor.needsUpdate = true;
}

// A body panel that can be dented: a box made of a fine grid of points
// (more rows near the edges), with rounded edges and corners of radius r
function softBox(w, h, d, r, segs) {
  const sg = segs || [Math.max(2, Math.round(w / 0.07)), Math.max(1, Math.round(h / 0.07)), Math.max(1, Math.round(d / 0.07))];
  const g = new THREE.BoxGeometry(w, h, d, ...sg);
  const pos = g.attributes.position;
  if (!pos || !pos.array) return g;
  const half = [w / 2, h / 2, d / 2];
  r = Math.min(r, half[0] - 0.001, half[1] - 0.001, half[2] - 0.001);
  const v = [0, 0, 0], c = [0, 0, 0];
  for (let i = 0; i < pos.count; i++) {
    for (let k = 0; k < 3; k++) {
      const t = pos.array[i * 3 + k] / half[k];
      v[k] = half[k] * Math.sin(t * Math.PI / 2);          // rows bunch up near the edges
      c[k] = Math.max(-(half[k] - r), Math.min(half[k] - r, v[k]));
    }
    const dx = v[0] - c[0], dy = v[1] - c[1], dz = v[2] - c[2], l = Math.hypot(dx, dy, dz);
    if (l > 1e-9) { v[0] = c[0] + dx / l * r; v[1] = c[1] + dy / l * r; v[2] = c[2] + dz / l * r; }
    pos.array[i * 3] = v[0]; pos.array[i * 3 + 1] = v[1]; pos.array[i * 3 + 2] = v[2];
  }
  smoothNormals(g);
  return g;
}

function buildCar() {
  const car = new THREE.Group();

  // --- Main body tub: a solid lower half, then an open-topped cockpit with
  // a footwell running forward under the scuttle (the seats, pedals and
  // driver's legs are in cockpit.js). Rounded edges all round. ---
  // (every panel is made of a fine grid of points, so a crash can dent it
  // where it hit: see dentBody)
  const panels = [];
  const panel = (geo, mat, x, y, z) => { const m = part(geo, mat, x, y, z); car.add(m); panels.push(m); return m; };
  panel(softBox(0.9, 0.32, 1.9, 0.05), MAT.paint, 0, 0.31, -0.35);                       // lower tub (floor at 0.47)
  for (const side of [-1, 1]) {
    panel(softBox(0.04, 0.22, 1.9, 0.018), MAT.paint, side * 0.43, 0.56, -0.35);         // cockpit sides
  }
  panel(softBox(0.9, 0.22, 0.04, 0.018), MAT.paint, 0, 0.56, -1.28);                     // back of the cockpit
  panel(softBox(0.9, 0.04, 0.62, 0.018), MAT.paint, 0, 0.65, -0.98);                     // rear deck behind the seats
  panel(softBox(0.9, 0.04, 0.44, 0.018), MAT.paint, 0, 0.65, 0.39);                      // scuttle over the footwell
  panel(softBox(0.9, 0.22, 0.04, 0.018), MAT.paint, 0, 0.56, 0.58);                      // front bulkhead

  // --- Long nose (aluminium, like a classic Seven) ---
  const nose = part(softBox(0.62, 0.34, 0.9, 0.06, [12, 7, 16]), MAT.aluminium, 0, 0.38, 1.05);
  panels.push(nose);
  car.add(nose);
  // Grille at the very front
  const grille = part(new THREE.BoxGeometry(0.5, 0.26, 0.02), MAT.black, 0, 0.38, 1.505);
  car.add(grille);
  const crush = { panels, grille, lamps: [], tail: [] };   // parts that get dented or pushed in by crashes

  // --- Bonnet top between cockpit and nose ---
  panel(softBox(0.66, 0.04, 0.16, 0.015), MAT.aluminium, 0, 0.58, 0.66);

  // (the seats, floor, pedals, steering wheel, levers, mirrors and the
  // driver are in cockpit.js)

  // --- Windscreen ---
  const screen = part(new THREE.PlaneGeometry(0.82, 0.26), MAT.glass, 0, 0.78, 0.22);
  screen.rotation.x = -0.25;
  screen.castShadow = false;
  car.add(screen);
  // ...in a thin frame: a bar along the top and a post up each side (the
  // rear-view mirror hangs from the middle of the top bar: cockpit.js)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, metalness: 0.4, roughness: 0.5 });
  const rodBetween = (a, b, r) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = part(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 10), frameMat, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    car.add(m);
  };
  const TOP = [0.906, 0.188], BOTTOM = [0.654, 0.252];            // the glass's top and bottom edge (height, along)
  rodBetween([-0.42, TOP[0], TOP[1]], [0.42, TOP[0], TOP[1]], 0.012);
  for (const side of [-1, 1]) rodBetween([side * 0.42, BOTTOM[0], BOTTOM[1]], [side * 0.42, TOP[0], TOP[1]], 0.012);

  // --- Roll bar behind the seats ---
  const barSide = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10);
  car.add(part(barSide, MAT.chrome, -0.33, 0.86, -0.75));
  car.add(part(barSide, MAT.chrome, 0.33, 0.86, -0.75));
  const barTop = part(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 10), MAT.chrome, 0, 1.07, -0.75);
  barTop.rotation.z = Math.PI / 2;
  car.add(barTop);

  // --- Fuel filler cap: on the rear deck, on the car's left (the fuel
  // gauge's arrow points this way) ---
  const filler = part(new THREE.CylinderGeometry(0.055, 0.06, 0.03, 18), MAT.chrome, 0.3, 0.665, -1.12);
  car.add(filler);
  car.add(part(new THREE.BoxGeometry(0.07, 0.012, 0.016), MAT.chrome, 0.3, 0.684, -1.12));   // its flip handle

  // --- Rear wings (fenders over the back wheels) ---
  for (const side of [-1, 1]) {
    panel(softBox(0.3, 0.06, 0.8, 0.025, [5, 1, 12]), MAT.paint, side * 0.62, 0.64, -1.1);
    panel(softBox(0.3, 0.25, 0.06, 0.02, [5, 4, 1]), MAT.paint, side * 0.62, 0.52, -1.48);
  }

  // --- Front cycle wings (curved fenders over the front wheels) ---
  const cycleWing = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 20, 1, true, 0.25, 2.3);
  cycleWing.rotateZ(Math.PI / 2);
  car.add(part(cycleWing, fenderMat, -TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE));
  car.add(part(cycleWing, fenderMat, TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE));

  // --- Headlights: round lamps, each a chrome bowl at the back, a domed
  // glass front over a silver reflector, and a chrome rim where they meet ---
  const headLens = MAT.lens.clone();           // its own, so it can glow when switched on
  headLens.metalness = 0.35;                   // the reflector shows through the glass
  headLens.roughness = 0.08;
  const lampChrome = new THREE.MeshStandardMaterial({ color: 0xe8eaec, metalness: 0.9, roughness: 0.25 });   // satin, not a mirror
  const bowlGeo = new THREE.SphereGeometry(0.09, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  bowlGeo.rotateX(-Math.PI / 2);               // the half that faces backwards
  const domeGeo = new THREE.SphereGeometry(0.086, 22, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.rotateX(Math.PI / 2);                // the half that faces forwards
  const lampRimGeo = new THREE.TorusGeometry(0.09, 0.009, 8, 28);
  for (const side of [-1, 1]) {
    const lamp = new THREE.Group();
    lamp.position.set(side * 0.42, 0.64, 1.22);
    const bowl = part(bowlGeo, lampChrome, 0, 0, 0);
    bowl.scale.z = 0.9;
    const dome = part(domeGeo, headLens, 0, 0, 0.004);
    dome.scale.z = 0.45;                       // a shallow dome of glass
    dome.castShadow = false;
    const lampRim = part(lampRimGeo, lampChrome, 0, 0, 0.004);
    lamp.add(bowl, dome, lampRim);
    car.add(lamp);
    crush.lamps.push(lamp);
  }
  // The beam: one light between the two lamps (one is much cheaper than
  // two, and looks the same from the driver's seat). It's always there,
  // just at zero when off, so switching on doesn't stall the game.
  const beam = new THREE.SpotLight(0xfff1d6, 0, 60, 0.5, 0.5, 1.3);
  beam.position.set(0, 0.64, 1.32);
  beam.target.position.set(0, 0, 14);
  car.add(beam, beam.target);

  // --- Tail lights on the back of the rear wings: dim red with the lights
  // on, bright when braking ---
  const tailLens = new THREE.MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff1a10, emissiveIntensity: 0, roughness: 0.3 });
  const tailGeo = new THREE.CircleGeometry(0.045, 14);
  for (const side of [-1, 1]) {
    const tail = part(tailGeo, tailLens, side * 0.62, 0.55, -1.512);
    tail.rotation.y = Math.PI;                  // facing backwards
    tail.castShadow = false;
    car.add(tail);
    crush.tail.push(tail);
  }

  // --- Side exhaust ---
  const exhaust = part(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12), MAT.chrome, 0.5, 0.3, -0.45);
  exhaust.rotation.x = Math.PI / 2;
  car.add(exhaust);

  // --- Suspension: double wishbones, uprights, dampers, tie rods, driveshafts ---
  // Every rod links a point on the body to a point on the wheel's upright,
  // so the wheels are properly attached instead of floating.
  // Each end of a rod is either bolted to the body (it stays put) or moves
  // with a wheel: m = 1 rides fully with the upright, m = 0.6 sits 60% of
  // the way out along a wishbone, and t = true also swings round with the
  // steering. So when a wheel rises over a bump, the wishbones pivot up
  // with it, the damper squeezes, and the tie rod follows the steering.
  const arms = [];
  const dampers = [];
  // a rod: [inner point, outer point, radius, which wheel (0 FL 1 FR 2 RL 3 RR), m of each end, steer]
  const rod = (list, p1, p2, radius, w, m1, m2, steers = false) => list.push({ p1, p2, radius, w, m1, m2, steers });
  for (const s of [-1, 1]) {
    const F = FRONT_AXLE;
    const R = REAR_AXLE;
    const fw = s > 0 ? 0 : 1, rw = s > 0 ? 2 : 3;   // (+x is the car's left)

    // Front lower wishbone (two legs meeting at the upright)
    rod(arms, [s * 0.30, 0.22, F + 0.18], [s * 0.56, 0.24, F], 0.014, fw, 0, 1);
    rod(arms, [s * 0.30, 0.22, F - 0.18], [s * 0.56, 0.24, F], 0.014, fw, 0, 1);
    // Front upper wishbone
    rod(arms, [s * 0.30, 0.47, F + 0.14], [s * 0.54, 0.42, F], 0.012, fw, 0, 1);
    rod(arms, [s * 0.30, 0.47, F - 0.14], [s * 0.54, 0.42, F], 0.012, fw, 0, 1);
    // Front upright (joins the wishbone ends, carries the wheel)
    rod(arms, [s * 0.56, 0.24, F], [s * 0.54, 0.42, F], 0.022, fw, 1, 1);
    // Steering tie rod (its outer end swings round with the steering)
    rod(arms, [s * 0.30, 0.30, F - 0.12], [s * 0.55, 0.31, F - 0.10], 0.010, fw, 0, 1, true);
    // Front coil-over damper (lower wishbone up to the chassis)
    rod(dampers, [s * 0.48, 0.24, F + 0.02], [s * 0.31, 0.53, F + 0.08], 0.03, fw, 0.7, 0);

    // Rear lower wishbone
    rod(arms, [s * 0.44, 0.20, R + 0.20], [s * 0.56, 0.22, R], 0.014, rw, 0, 1);
    rod(arms, [s * 0.44, 0.20, R - 0.20], [s * 0.56, 0.22, R], 0.014, rw, 0, 1);
    // Rear upper wishbone
    rod(arms, [s * 0.44, 0.45, R + 0.15], [s * 0.55, 0.42, R], 0.012, rw, 0, 1);
    rod(arms, [s * 0.44, 0.45, R - 0.15], [s * 0.55, 0.42, R], 0.012, rw, 0, 1);
    // Rear upright
    rod(arms, [s * 0.56, 0.22, R], [s * 0.55, 0.42, R], 0.022, rw, 1, 1);
    // Driveshaft from the differential to the wheel
    rod(arms, [s * 0.40, 0.30, R], [s * 0.57, 0.30, R], 0.028, rw, 0, 1);
    // Rear coil-over damper
    rod(dampers, [s * 0.52, 0.23, R + 0.06], [s * 0.45, 0.58, R + 0.12], 0.03, rw, 0.85, 0);
  }
  const armMesh = rodSet(arms.map((r) => [r.p1, r.p2, r.radius]), MAT.arm);
  const damperMesh = rodSet(dampers.map((r) => [r.p1, r.p2, r.radius]), MAT.damper);
  for (const mesh of [armMesh, damperMesh]) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  car.add(armMesh, damperMesh);
  const linkage = { arms, dampers, armMesh, damperMesh };

  // --- Wheels: drawn with INSTANCING ---
  // One tyre, rim, disc and caliper model, each drawn four times in a
  // single step. The tyre is a ring (tread and two sidewalls) round an
  // open-spoked alloy rim, so you can see the brake disc and caliper
  // behind the spokes.
  const RIM_R = WHEEL_RADIUS * 0.66;          // 15-inch rim (the tyre's bead)
  const tyreGeo = mergeGeos([
    new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32, 1, true),   // tread
    new THREE.RingGeometry(RIM_R * 0.99, WHEEL_RADIUS, 32, 1).rotateX(-Math.PI / 2).translate(0, WHEEL_WIDTH / 2, 0),   // sidewalls
    new THREE.RingGeometry(RIM_R * 0.99, WHEEL_RADIUS, 32, 1).rotateX(Math.PI / 2).translate(0, -WHEEL_WIDTH / 2, 0),
  ], true);
  tyreGeo.rotateZ(Math.PI / 2);
  const rimGeo = buildRimGeometry(RIM_R, WHEEL_WIDTH);
  // (old spokes: kept but hidden, the rim has its own now)
  const spokeGeo = new THREE.BoxGeometry(0.001, 0.001, 0.001);

  const tyres = new THREE.InstancedMesh(tyreGeo, MAT.tyre, 4);
  const rims = new THREE.InstancedMesh(rimGeo, MAT.rim, 4);
  const spokes = new THREE.InstancedMesh(spokeGeo, MAT.spoke, 8);
  spokes.visible = false;
  for (const mesh of [tyres, rims]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // updated every frame
    car.add(mesh);
  }
  // Brake discs: one each (each glows on its own when it gets hot), with
  // the caliper gripping it at the back, fixed to the upright (it steers
  // with the wheel but doesn't spin)
  const discGeo = mergeGeos([
    new THREE.CylinderGeometry(RIM_R * 0.68, RIM_R * 0.68, 0.024, 36).rotateZ(Math.PI / 2),     // the disc
    new THREE.CylinderGeometry(RIM_R * 0.36, RIM_R * 0.36, 0.05, 24).rotateZ(Math.PI / 2).translate(0.02, 0, 0),   // its hat, out to the hub
  ]);
  const discs = [0, 1, 2, 3].map(() => {
    const m = new THREE.Mesh(discGeo, MAT.disc.clone());
    m.matrixAutoUpdate = false;
    m.castShadow = true;
    car.add(m);
    return m;
  });
  const caliperGeo = new THREE.BoxGeometry(0.05, 0.085, 0.045);
  caliperGeo.translate(0, RIM_R * 0.62, 0);
  caliperGeo.rotateX(-0.9);                    // at the back of the disc, a little above the middle
  const calipers = new THREE.InstancedMesh(caliperGeo, MAT.caliper, 4);
  calipers.castShadow = true;
  calipers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  car.add(calipers);

  return { car, tyres, rims, spokes, discs, calipers, headLens, beam, tailLens, crush, linkage };
}

const carModel = buildCar();
// The cockpit and the driver (cockpit.js)
const cockpit = new Cockpit(carModel.car, MAT, { isMobile, redline: CATERHAM.redline });

// SECRET: type F V 1 0 1 on the keyboard to swap the car for an FV101
// Scorpion-inspired light tank (tank.js), and again to swap back.
// (For now it drives with the car's physics.)
const tank = buildScorpion();
// Where the mouse is pointing (for the tank's turret): a spot on the
// ground under the pointer, or far off if it's pointing at the sky
const mouseAim = { x: 0, y: 0, moved: false };
window.addEventListener('mousemove', (e) => {
  mouseAim.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseAim.y = -(e.clientY / window.innerHeight) * 2 + 1;
  mouseAim.moved = true;
});
const aimRayEnd = new THREE.Vector3();
function aimPoint() {
  const from = camera.position;
  const dir = aimRayEnd.set(mouseAim.x, mouseAim.y, 0.5).unproject(camera).sub(from).normalize();
  const groundY = tankPhys.y;
  // where the ray meets the ground (within 400 m), else 400 m out
  let dist = dir.y < -0.01 ? (groundY - from.y) / dir.y : 400;
  if (!(dist > 0) || dist > 400) dist = 400;
  return from.clone().addScaledVector(dir, dist);
}
const tankPhys = new TankPhysics();
scene.add(tank.group);
let tankMode = false;
let secretKeys = '';
const toast = document.createElement('div');
toast.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);padding:10px 18px;border-radius:10px;background:rgba(20,24,16,0.85);color:#d8e2b8;font:700 18px system-ui,sans-serif;letter-spacing:0.08em;pointer-events:none;opacity:0;transition:opacity 0.4s;z-index:20';
document.body.appendChild(toast);
let toastTimer = null;
function showToast(text) {
  toast.textContent = text;
  toast.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}
window.addEventListener('keydown', (e) => {
  if (!e.key || e.key.length !== 1) return;
  secretKeys = (secretKeys + e.key.toUpperCase()).slice(-5);
  if (secretKeys === 'FV101') {
    secretKeys = '';
    tankMode = !tankMode;
    // hand over where you are, facing the same way, from a standstill
    if (tankMode) tankPhys.place(physics.x, physics.z, physics.heading);
    else {
      physics.x = tankPhys.x; physics.z = tankPhys.z; physics.heading = tankPhys.heading;
      physics.vx = physics.vy = physics.yawRate = 0;
      physics.air = false;
      physics.ground.synced = false;
    }
    setCrashBox(tankMode);
    engineSound.setHeavy?.(tankMode);   // its own engine and tracks
    carModel.car.visible = !tankMode;
    tank.group.visible = tankMode;
    showToast(tankMode ? 'FV101 SCORPION' : 'BACK IN THE CAR');
  }
});
// Each kind of tyre has its own look: F1-style coloured bands, tread
// patterns, knobbly dirt tyres, snow chains (tyres.js)
const tyreLooks = new TyreLooks(carModel.car, carModel.tyres, { radius: WHEEL_RADIUS, width: WHEEL_WIDTH });

// HEADLIGHTS: G cycles off -> auto -> dipped -> main beam. Dipped lights
// the road close ahead; main beam reaches much further. Auto (the default)
// switches the dipped lights on by itself at dusk, at night and in rain.
let lightsMode = 0;          // what the lights are doing now: 0 off, 1 dipped, 2 main beam
let lightsSetting = 1;       // the switch: 0 off, 1 auto, 2 dipped, 3 main beam
let autoLightsOn = false;
const LIGHTS = [
  { intensity: 0, distance: 60, angle: 0.5, aim: [0, 0, 14], glow: 0 },
  { intensity: 90, distance: 70, angle: 0.55, aim: [0, 0, 14], glow: 1.2 },       // dipped
  { intensity: 260, distance: 170, angle: 0.4, aim: [0, 0.35, 45], glow: 2.2 },   // main beam
];
function setLights(mode) {
  lightsMode = mode;
  const l = LIGHTS[mode];
  const { beam, headLens } = carModel;
  beam.intensity = l.intensity;
  beam.distance = l.distance;
  beam.angle = l.angle;
  beam.target.position.set(...l.aim);
  headLens.emissive.setHex(mode ? 0xfff1c8 : 0x332a10);
  headLens.emissiveIntensity = mode ? l.glow : 1;
}
scene.add(carModel.car);

// Where each wheel sits on the car: [x, y, z, isFront]
const WHEELS = [
  [-TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE, true],
  [TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE, true],
  [-TRACK_HALF, WHEEL_RADIUS, REAR_AXLE, false],
  [TRACK_HALF, WHEEL_RADIUS, REAR_AXLE, false],
];

// Turns the front wheels with the steering and spins all four
const wheelMatrix = new THREE.Matrix4();
const wheelPos = new THREE.Vector3();
const wheelRot = new THREE.Quaternion();
const wheelEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const wheelScale = new THREE.Vector3(1, 1, 1);
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);
const ONE = new THREE.Vector3(1, 1, 1);

// Which physics tyre (FL, FR, RL, RR) each drawn wheel is (+x is the car's left)
const physicsWheel = (x, isFront) => (isFront ? 0 : 2) + (x > 0 ? 0 : 1);
const tyreSquash = [1, 1, 1, 1];   // per physics tyre: 1 = round, lower = squashed flat
const tyreHub = [WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS];   // how high each hub is off the road
const squashMatrix = new THREE.Matrix4();
const spinMatrix = new THREE.Matrix4();

// Moves the suspension links to follow each wheel (see buildCar)
const linkA = new THREE.Vector3(), linkB = new THREE.Vector3(), linkDir = new THREE.Vector3(), linkMid = new THREE.Vector3();
const linkQ = new THREE.Quaternion(), linkS = new THREE.Vector3(), linkM = new THREE.Matrix4(), LINK_UP = new THREE.Vector3(0, 1, 0);
function placeLinkEnd(out, p, m, w, steersWith, steer) {
  out.fromArray(p);
  const tyre = physics.tyres[w];
  // a wheel that's come off leaves its links hanging down at full droop
  const lift = tyre.detached ? -0.08 : wheelLift[w];
  out.y += lift * m;
  if (steersWith && m > 0 && !tyre.detached) {
    // swing round the kingpin (the upright's line) with the steering
    const px = Math.sign(p[0]) * 0.55, pz = FRONT_AXLE;
    const dx = out.x - px, dz = out.z - pz, c = Math.cos(steer), s = Math.sin(steer);
    out.x = px + dx * c + dz * s;
    out.z = pz - dx * s + dz * c;
  }
  return out;
}
function updateLinks(list, mesh, steer) {
  list.forEach((r, i) => {
    const gone = physics.tyres[r.w].detached && r.m1 === 1;   // (the upright left with the wheel)
    if (gone) { mesh.setMatrixAt(i, HIDDEN); return; }
    placeLinkEnd(linkA, r.p1, r.m1, r.w, r.steers && r.m1 > 0, steer);
    placeLinkEnd(linkB, r.p2, r.m2, r.w, r.steers, steer);
    linkDir.subVectors(linkB, linkA);
    const length = linkDir.length();
    linkMid.addVectors(linkA, linkB).multiplyScalar(0.5);
    linkQ.setFromUnitVectors(LINK_UP, linkDir.divideScalar(length));
    linkS.set(r.radius, length, r.radius);
    linkM.compose(linkMid, linkQ, linkS);
    mesh.setMatrixAt(i, linkM);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function updateWheels(steer, spin) {
  const L = carModel.linkage;
  updateLinks(L.arms, L.armMesh, steer);
  updateLinks(L.dampers, L.damperMesh, steer);
  WHEELS.forEach(([x, y, z, isFront], i) => {
    wheelPos.set(x, y + wheelLift[physicsWheel(x, isFront)], z);
    // A deflated tyre: the top keeps its shape while the bottom squashes flat
    // and bulges out where it meets the road. The rim stays round.
    const tyre = physics.tyres[physicsWheel(x, isFront)];
    const sy = tyreSquash[physicsWheel(x, isFront)];
    const bulge = 1 - sy;
    // A blown tyre shrinks as it sheds rubber, and wobbles as the loose
    // strips flap. Once it's all gone, only the rim is left.
    const shrink = tyre.rim ? 0 : tyre.blown
      ? (1 - 0.25 * tyre.shred) * (1 + (Math.random() - 0.5) * 0.06) : 1;
    // Gone: the wheel has come off (it's rolling away on its own; see looseWheels)
    if (tyre.detached) {
      carModel.discs[i].visible = false;
      carModel.calipers.setMatrixAt(i, HIDDEN);
      carModel.tyres.setMatrixAt(i, HIDDEN);
      tyreLooks.setMatrixAt(i, HIDDEN);
      carModel.rims.setMatrixAt(i, HIDDEN);
      carModel.spokes.setMatrixAt(i * 2, HIDDEN);
      carModel.spokes.setMatrixAt(i * 2 + 1, HIDDEN);
      return;
    }
    // A bare rim grinds down: smaller and smaller as it wears
    const pi = physicsWheel(x, isFront);
    const rimScale = tyre.rim ? Math.min(1, (WHEEL_RADIUS - physics.tyreSink[pi]) / (WHEEL_RADIUS * 0.62)) : 1;
    wheelScale.set(1, rimScale, rimScale);
    // The rim's face (with its spokes and wheel nuts) points out on both
    // sides: the right-hand wheels are the same rim turned round
    const turnRound = x < 0;
    // the caliper: steers with the wheel, but doesn't spin
    wheelEuler.set(0, isFront ? steer : 0, 0);
    wheelRot.setFromEuler(wheelEuler);
    wheelMatrix.compose(wheelPos, wheelRot, ONE);
    carModel.calipers.setMatrixAt(i, wheelMatrix);
    for (let k = 0; k < 2; k++) {
      // (each wheel turns at its own speed: a locked wheel stops, a spinning one blurs)
      const turned = (physics.w4 ? physics.w4.angle[pi] : spin) + k * Math.PI / 2;
      wheelEuler.set(turnRound ? -turned : turned, (isFront ? steer : 0) + (turnRound ? Math.PI : 0), 0);
      wheelRot.setFromEuler(wheelEuler);
      wheelMatrix.compose(wheelPos, wheelRot, wheelScale);
      if (k === 0) {
        spinMatrix.makeRotationFromQuaternion(wheelRot);
        // The tyre reaches from the road up to its (possibly shrunken) top,
        // always round the hub, so the rim never pokes out of it: a
        // shredding tyre gets smaller all round, and the hub drops with it
        const outer = WHEEL_RADIUS * shrink;
        const hubUp = Math.max(WHEEL_RADIUS * 0.64, Math.min(outer, tyreHub[pi]));
        const tall = (hubUp + outer) / (2 * WHEEL_RADIUS);
        squashMatrix.makeScale((1 + bulge * 0.35) * (tyre.blown ? 1 + (Math.random() - 0.5) * 0.06 : 1),
          tall, (1 + bulge * 0.6) * shrink).multiply(spinMatrix);
        squashMatrix.setPosition(x, wheelPos.y + (outer - hubUp) / 2, z);
        carModel.tyres.setMatrixAt(i, squashMatrix);
        tyreLooks.setMatrixAt(i, squashMatrix);
        carModel.rims.setMatrixAt(i, wheelMatrix);
        // the brake disc turns with the wheel, and glows when it's very hot
        const disc = carModel.discs[i];
        disc.visible = true;
        disc.matrix.compose(wheelPos, wheelRot, ONE);
        const hot = Math.min(1, Math.max(0, ((physics.brakeTemp?.[pi] ?? 0) - 420) / 450));
        disc.material.emissiveIntensity = Math.pow(hot, 1.5) * 2.4;
        disc.material.emissive.setRGB(1, 0.12 + 0.35 * hot, 0.02 * hot);   // dull red, then orange
      }
      carModel.spokes.setMatrixAt(i * 2 + k, wheelMatrix);
    }
  });
  carModel.tyres.instanceMatrix.needsUpdate = true;
  tyreLooks.update();
  carModel.rims.instanceMatrix.needsUpdate = true;
  carModel.spokes.instanceMatrix.needsUpdate = true;
  carModel.calipers.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------------
// BODY LEAN on deflated tyres
// Each corner wants its hub at (tyre radius - how far that tyre has sunk).
// A rigid body can't follow four separate heights, so it settles on the
// best-fitting plane: the low corner drops, and the opposite wheel lifts.
// ---------------------------------------------------------------------
const bodyLean = { heave: 0, roll: 0, pitch: 0 };
const slopeView = { pitch: 0, roll: 0 };   // the slope the car is sitting on, as drawn
const HUB_X = [TRACK_HALF, -TRACK_HALF, TRACK_HALF, -TRACK_HALF];   // FL FR RL RR (+x = left)
const HUB_Z = [FRONT_AXLE, FRONT_AXLE, REAR_AXLE, REAR_AXLE];

// The car sits on its suspension (physics.js): the body rises, dips,
// pitches and leans on its springs, and each wheel moves up and down
// under it to stay on the road (over bumps and kerbs, or when a flat tyre
// lets that corner drop).
const wheelLift = [0, 0, 0, 0];
function fitBodyToTyres(dt) {
  const body = physics.body;
  bodyLean.heave = body.heave;
  bodyLean.pitch = body.pitch;
  bodyLean.roll = body.roll;
  for (let i = 0; i < 4; i++) {
    wheelLift[i] = body.travel[i];                     // how far the wheel has moved up into the body
    // how squashed each tyre must be to reach the road (flat tyres)
    const hubHeight = WHEEL_RADIUS - physics.tyreSink[i];
    tyreHub[i] = hubHeight;
    tyreSquash[i] = Math.max(0.62, Math.min(1, (hubHeight + WHEEL_RADIUS) / (2 * WHEEL_RADIUS)));
  }
}

// ---------------------------------------------------------------------
// PUNCTURES: running over sharp engine debris can puncture a tyre.
// Each piece gets one chance per tyre, and gets kicked away when hit.
// ---------------------------------------------------------------------
const PUNCTURE_CHANCE = { chunk: 0.45, part: 0.5, cam: 0.3, piston: 0.15 };
const tyreContact = new THREE.Vector3();

function checkDebrisPunctures() {
  if (!debris.pieces.length || Math.hypot(physics.vx, physics.vy) < 1) return;
  for (let i = 0; i < 4; i++) {
    tyreContact.set(HUB_X[i], 0, HUB_Z[i]);
    carModel.car.localToWorld(tyreContact);
    for (const piece of debris.pieces) {
      if (piece.pos.y > 0.25) continue;
      const reach = piece.radius + 0.1;
      const dx = piece.pos.x - tyreContact.x, dz = piece.pos.z - tyreContact.z;
      if (dx * dx + dz * dz > reach * reach) continue;
      piece.hitBy = piece.hitBy || new Set();
      if (piece.hitBy.has(i)) continue;
      piece.hitBy.add(i);
      if (Math.random() < (PUNCTURE_CHANCE[piece.kind] ?? 0.3)) {
        physics.puncture(i, 1 / (20 + Math.random() * 25));   // goes flat in roughly 30-60 s
      }
      // The tyre flicks the piece away
      piece.resting = false;
      piece.rolling = false;
      piece.settling = false;
      piece.vel.x += carVelocity.x * 0.3 + (Math.random() - 0.5) * 2;
      piece.vel.z += carVelocity.z * 0.3 + (Math.random() - 0.5) * 2;
      piece.vel.y = 1 + Math.random() * 1.5;
    }
  }
}

// ---------------------------------------------------------------------
// BLOWOUTS: a burst tyre bangs, puffs rubber smoke and flings strips of
// tread. While it flaps it drops a trail of rubber crumbs (1-5% extra grip
// where they lie). Once it has shredded off (about 30 s of driving), the
// bare rim sparks along the road.
// ---------------------------------------------------------------------
const blowoutPending = [];             // wheels that just burst
const crumbGap = [0, 0, 0, 0];         // metres until each tyre drops its next crumb
const shredClock = [0, 0, 0, 0];
const sparkCarry = [0, 0, 0, 0];
const behindWheel = new THREE.Vector3();
function updateBlownTyres(dt) {
  const speed = Math.hypot(physics.vx, physics.vy);
  let sparked = false;
  for (let i = 0; i < 4; i++) {
    const t = physics.tyres[i];
    // (end each road scratch once that corner stops grinding)
    if (!((t.rim || t.detached) && speed > 0.3)) gouges.update('g' + i, 0, 0, 0);
    if (!t.blown && !blowoutPending.includes(i)) continue;
    tyreContact.set(HUB_X[i], 0, HUB_Z[i]);
    carModel.car.localToWorld(tyreContact);
    tyreContact.y = 0;
    // Sparks come off the back of the wheel (it turns forwards at the top,
    // backwards where it meets the road)
    behindWheel.set(HUB_X[i], 0, HUB_Z[i] - WHEEL_RADIUS * 1.1);
    carModel.car.localToWorld(behindWheel);

    // The bang: a puff of rubber smoke and a handful of big strips of tread
    const just = blowoutPending.indexOf(i);
    if (just >= 0) {
      blowoutPending.splice(just, 1);
      for (let k = 0; k < 14; k++) smoke.spawn(tyreContact, 0.9, carVelocity);
      for (let k = 0; k < 6; k++) shreds.fling(tyreContact, carVelocity, 1);
      crumbGap[i] = 0.3;
    }

    if (!t.rim && speed > 1.5) {
      // Flapping: a trail of rubber crumbs, and now and then a strip flung off
      crumbGap[i] -= speed * dt;
      if (crumbGap[i] <= 0) {
        skids.addCrumb(tyreContact.x + (Math.random() - 0.5) * 0.15, tyreContact.z + (Math.random() - 0.5) * 0.15,
          0.06 + Math.random() * 0.1, 0.2 + Math.random() * 0.8);
        crumbGap[i] = 0.25 + Math.random() * 0.5;
      }
      shredClock[i] -= dt * Math.min(1, speed / 10) * (1 - 0.7 * t.shred);
      if (shredClock[i] <= 0) {
        shreds.fling(tyreContact, carVelocity, 0.3);
        shredClock[i] = 0.4 + Math.random() * 0.8;
      }
      // The rim edge starts catching the road through the thinning rubber:
      // the odd spark at first, more and more as the tyre wears away
      sparkCarry[i] += (4 + 26 * t.shred) * Math.min(1, speed / 12) * dt;
      while (sparkCarry[i] >= 1) {
        debris.spawnRimSpark(behindWheel, carVelocity, physics.heading);
        sparkCarry[i] -= 1;
        sparked = true;
      }
    } else if (t.detached) {
      // The wheel has come off: no more rim sparks. The bare frame grinds
      // along (you hear it), scoring a pale scrape into the road
      behindWheel.set(HUB_X[i] * 0.85, 0, HUB_Z[i] - 0.1);
      carModel.car.localToWorld(behindWheel);
      gouges.update('g' + i, behindWheel.x, behindWheel.z, speed > 0.3 ? 1 : 0);
    } else if (t.rim && speed > 0.3) {
      // A bare rim leaves no rubber: it scores a thin, pale scratch into the road
      gouges.update('g' + i, tyreContact.x, tyreContact.z, 1);
      // Glittery shavings ground off the rim, left lying on the road
      flakes.emit(i, tyreContact, speed, dt);
      // Bare rim: always a shower of sparks while it's moving, more the faster you go
      sparkCarry[i] += (20 + 60 * Math.min(1, speed / 15)) * (1 - 0.5 * rain.wetness) * dt;
      while (sparkCarry[i] >= 1) {
        debris.spawnRimSpark(behindWheel, carVelocity, physics.heading);
        sparkCarry[i] -= 1;
        sparked = true;
      }
    }
  }
  if (sparked) debris.sparks.geometry.attributes.aSize.needsUpdate = true;
  shreds.update(dt);
}

// Gravel: each trip into the gravel trap has a 40% chance that a sharp stone
// gets into one of the tyres in it (a slow puncture). Dirt tyres are tougher:
// a quarter of the chance. A trip ends once the car has been out of the
// gravel for a second and a half.
const GRAVEL_PUNCTURE_CHANCE = 0.4;
let gravelTrip = null;     // { strikeIn: metres until the stone gets in (Infinity = not this time) }
let outOfGravel = 99;      // seconds since any tyre was last in the gravel
function checkGravelPunctures(dt) {
  const speed = Math.hypot(physics.vx, physics.vy);
  const inside = [];
  for (let i = 0; i < 4; i++) {
    tyreContact.set(HUB_X[i], 0, HUB_Z[i]);
    carModel.car.localToWorld(tyreContact);
    if (inGravel(tyreContact.x, tyreContact.z)) inside.push(i);
  }
  if (!inside.length) {
    outOfGravel += dt;
    if (outOfGravel > 1.5) gravelTrip = null;
    return;
  }
  outOfGravel = 0;
  if (!gravelTrip) {
    const chance = GRAVEL_PUNCTURE_CHANCE * (dirtTyres() ? 0.25 : 1);
    // If it's going to happen, it happens within the first few metres
    gravelTrip = { strikeIn: Math.random() < chance ? 0.5 + Math.random() * 3.5 : Infinity };
  }
  gravelTrip.strikeIn -= speed * dt;
  if (gravelTrip.strikeIn <= 0) {
    gravelTrip.strikeIn = Infinity;   // one per trip
    const healthy = inside.filter((i) => physics.tyres[i].leak === 0 && physics.tyres[i].pressure > 0);
    if (healthy.length) {
      const wheel = healthy[Math.floor(Math.random() * healthy.length)];
      physics.puncture(wheel, 1 / (25 + Math.random() * 30));   // goes flat in roughly 30-60 s
    }
  }
}

// A WHEEL COMES OFF once its bare rim has ground down far enough for the
// frame to touch the road: it breaks free and rolls away in the direction
// and at the speed the car was going
const wheelOffPending = [];
const hubWorld = new THREE.Vector3();
function releaseWheels() {
  while (wheelOffPending.length) {
    const i = wheelOffPending.shift();
    hubWorld.set(HUB_X[i], WHEEL_RADIUS * 0.5, HUB_Z[i]);
    carModel.car.localToWorld(hubWorld);
    const worn = Math.min(1, (WHEEL_RADIUS - CATERHAM.frameSink * 0.85) / (WHEEL_RADIUS * 0.62));
    looseWheels[i].release(hubWorld, carVelocity, physics.heading, i % 2 === 0 ? 1 : -1, worn);
    // a burst of sparks as it tears free
    for (let k = 0; k < 30; k++) debris.spawnRimSpark(hubWorld, carVelocity, physics.heading);
    debris.sparks.geometry.attributes.aSize.needsUpdate = true;
    engineSound.playClunk();
  }
}

// ---------------------------------------------------------------------
// DRIVING
// ---------------------------------------------------------------------
const physics = new CarPhysics();
tyreLooks.apply(physics.tyreCompound);
// Where the car starts (and goes back to on reset): at Sepang, on the start straight
function placeAtStart() {
  if (!sepang) return;
  physics.x = sepang.start.x;
  physics.z = sepang.start.z;
  physics.heading = sepang.start.heading;
}
placeAtStart();

// Oil dripped by a badly damaged engine. Tyres on oil lose grip.
const oil = new OilSlicks(scene, { colour: 0xc4891f });   // (engine oil: honey-coloured when fresh, see below)
// Coolant: pink-red, watery, dripping from the radiator at the front
const coolant = new OilSlicks(scene, { colour: 0xe0336e, ahead: 1.45, slickGrip: 0.55, roughness: 0.05, metalness: 0.1, maxSegments: 900, maxPuddles: 60, flowSpeed: 6, flowTime: 15, amount: 0.6, evaporate: 0.012 });   // (runs like water; about 4.5 litres of it against 7 of oil, and it dries up in the heat)
// The engine oil's colour: honey-yellow when fresh, going brown then black
// the further you drive, and milky tan once coolant gets into it
const OIL_HONEY = new THREE.Color(0xc4891f), OIL_BROWN = new THREE.Color(0x4b2c12), OIL_BLACK = new THREE.Color(0x120e0b), OIL_MILKY = new THREE.Color(0xcbb08f);
function oilColourNow(out) {
  const km = physics.distance / 1000;
  out.copy(OIL_HONEY).lerp(OIL_BROWN, Math.min(1, Math.max(0, (km - 2) / 14)));
  if (km > 16) out.lerp(OIL_BLACK, Math.min(1, (km - 16) / 30));
  return out.lerp(OIL_MILKY, physics.oilMilky * 0.85);
}
// Rubber from skidding tyres. Oil wins if both are on the same spot.
const skids = new SkidMarks(scene);
// Tyre tracks in the gravel: the same marks, in the gravel dust's shade
const gravelTrails = new SkidMarks(scene, {
  maxSegments: isMobile ? 800 : 1600, tyreWidth: 0.17, rubberBonus: 0,
  threshold: 0.05, height: 0.006, base: 0xa88c5f, mark: 0x8a7049,
});
// ...and in the grass: dark brown, where the tyres have pressed it into the earth
const grassTrails = new SkidMarks(scene, {
  maxSegments: isMobile ? 800 : 1600, tyreWidth: 0.18, rubberBonus: 0,
  threshold: 0.05, height: 0.006, base: 0x4a3b28, mark: 0x33261a,
});
// Strips of tread flung off a blown tyre (they land as crumbs of rubber)
const shreds = new TyreShreds(scene, skids, { max: isMobile ? 40 : 60 });
// What's under a tyre: 'gravel', 'grass', 'soil' (see SURFACES in
// physics.js) or 'tarmac'. There's a gravel trap and a grass patch so far.
// (Sepang also has kerbs: grippy like tarmac when dry, slippery when wet)
const surfaceAt = sepang ? sepang.surfaceAt
  : (x, z) => (inGravel(x, z) ? 'gravel' : grass.contains(x, z) || onIsland(x, z) ? 'grass' : 'tarmac');
const dirtTyres = () => TYRES[physics.tyreCompound].kind === 'dirt';
// IN THE WET: grip depends on how much water each tyre can clear away.
// Every second, a tyre has to push aside (water depth x tyre width x speed)
// litres of water. Its tread grooves can clear DRAIN litres a second; if
// more water arrives than it can clear, the tyre starts riding up on the
// water (aquaplaning) and loses grip. So slicks (no grooves) only cope
// slowly on a damp track, road tyres handle a wet road but not deep
// puddles at speed, and full wets clear even big puddles.
// Also, rubber on a wet surface grips a little less anyway (WET_RUBBER).
const DRAIN = {                       // litres per second
  RS: 2.5, RM: 2.5, RH: 2.5,
  SS: 18, SM: 20, SH: 21, CS: 22, CM: 23, CH: 24,
  IM: 38, W: 68, DIRT: 22, SNOW: 25,
};
const WET_RUBBER = { slick: 0.22, road: 0.1, wet: 0.03, dirt: 0.1, snow: 0.07 };
const TYRE_WIDTH = 0.195;              // metres
const tyreKind = () => TYRES[physics.tyreCompound].kind;
// How deep the water is at a point, in metres
function waterDepth(x, z) {
  const film = (0.4 * rain.wetness + 0.3 * rain.intensity) / 1000;   // a thin film over the whole track
  const puddle = rain.puddleAt(x, z);
  return film + (puddle > 0 ? (2 + 6 * puddle) / 1000 : 0);           // puddles: 2-8 mm
}
// Share of grip left in the water at a point (1 = as good as dry)
function wetGrip(x, z) {
  const depth = waterDepth(x, z);
  if (depth <= 0) return 1;
  const speed = Math.hypot(physics.vx, physics.vy);
  const litres = depth * TYRE_WIDTH * speed * 1000;                    // water to clear each second
  const over = litres / (DRAIN[physics.tyreCompound] ?? 16);          // >1: more than the tread can clear
  const aquaplane = THREE.MathUtils.smoothstep(over, 0.5, 2.2);
  const deep = Math.min(1, rain.puddleAt(x, z) * 1.5);
  const rubber = 1 - WET_RUBBER[tyreKind()] * Math.min(1, rain.wetness + rain.puddleAt(x, z));
  // standing water always takes some grip, even slowly (the tyre has to wade through it)
  const wading = 1 - 0.18 * deep;
  return rubber * wading * (1 - (0.5 + 0.35 * deep) * aquaplane);
}
physics.surfaceGrip = (x, z) => {
  const surface = surfaceAt(x, z);
  const wet = rain.wetness;
  const kind = tyreKind();
  if (surface !== 'tarmac') {
    let g = physics.surfaceGripFor(surface) * (1 - 0.22 * wet);    // wet grass and gravel: slipperier
    if (surface === 'grass') {
      const mud = rain.mudAt(x, z);
      if (mud > 0) g *= kind === 'dirt' ? 1 - 0.25 * mud : 1 - 0.55 * mud;   // mud: like ice for slicks
    }
    return g;
  }
  const g = wetGrip(x, z);
  const onOil = Math.min(oil.gripAt(x, z), coolant.gripAt(x, z));   // (coolant is slippery too)
  return g * (onOil < 1 ? onOil : skids.gripAt(x, z)) * (racing ? racing.rubberGrip(x, z) : 1);   // (old rubber: a touch more grip)
};
// THE ROAD'S SHAPE under each wheel (for the suspension): tarmac isn't
// perfectly flat, so there are very gentle swells and small ripples a few
// millimetres high; kerbs stand 2-3 cm proud with a ripple you feel through
// the car; grass and gravel are lumpy; at Sepang the grass is 4 cm below
// the track, so dropping a wheel off the edge drops that corner; and
// sausage kerbs are 22 cm humps the wheels ride up over.
const ROAD_BUMP = (x, z) => 0.0035 * Math.sin(x * 0.83 + z * 0.37) * Math.sin(z * 0.91 - x * 0.21)
  + 0.0016 * Math.sin(x * 3.1 + 1.3) * Math.sin(z * 2.7 + 0.4) + 0.0007 * Math.sin(x * 9.7) * Math.sin(z * 8.3);
const sausageCells = new Map();
for (const sk of sepang?.sausages || []) {
  const key = `${Math.floor(sk.x / 2)},${Math.floor(sk.z / 2)}`;
  if (!sausageCells.has(key)) sausageCells.set(key, []);
  sausageCells.get(key).push({ x: sk.x, z: sk.z, fx: Math.sin(sk.heading), fz: Math.cos(sk.heading) });
}
function sausageHeight(x, z) {
  const cx = Math.floor(x / 2), cz = Math.floor(z / 2);
  let best = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const list = sausageCells.get(`${cx + dx},${cz + dz}`);
    if (!list) continue;
    for (const sk of list) {
      const rx = x - sk.x, rz = z - sk.z;
      const along = rx * sk.fx + rz * sk.fz, across = rx * sk.fz - rz * sk.fx;
      if (Math.abs(along) < 0.9 && Math.abs(across) < 0.22) best = Math.max(best, Math.sqrt(0.0484 - across * across));
    }
  }
  return best;
}
physics.groundHeight = groundAt;
physics.roadHeight = (x, z) => {
  const surface = surfaceAt(x, z);
  const bump = ROAD_BUMP(x, z);
  if (surface === 'kerb') return 0.025 + 0.006 * Math.sin((x + z) * 6) + bump + (sausageCells.size ? sausageHeight(x, z) : 0);
  if (surface === 'grass') return (SEPANG ? sepang.groundY : 0) + 4 * bump + 0.006 * Math.sin(x * 5.3) * Math.sin(z * 4.9) + (sausageCells.size ? sausageHeight(x, z) : 0);
  if (surface === 'gravel') return 3 * bump + 0.008 * Math.sin(x * 7.1 + z * 2) * Math.sin(z * 6.7);
  return bump + (sausageCells.size ? sausageHeight(x, z) : 0);
};
// Loose ground also drags the tyres back as they plough through it (mud
// most of all), and so does deep water
physics.surfaceDrag = (x, z) => {
  const surface = surfaceAt(x, z);
  let d = physics.surfaceDragFor(surface);
  if (surface === 'grass') d += 0.16 * rain.mudAt(x, z) + 0.03 * rain.wetness;
  if (surface === 'tarmac') d += 0.06 * rain.puddleAt(x, z);
  return d;
};
// Tyre wear in the wet: rain cools the tyres, so they all wear slower; wet
// tyres on a dry track overheat and wear much faster
// (and the rain cools them: see tyre temperatures in physics.js)
physics.wearScale = () => {
  const wet = rain.wetness;
  return tyreKind() === 'wet' ? 1 - 0.6 * wet : 1 - 0.55 * wet;
};

// Tyre smoke, puffed from each tyre's contact patch when it loses traction
const smoke = new TyreSmoke(scene, { maxParticles: QUALITY.smokeParticles, puffsPerSecond: QUALITY.smokeRate });
smoke.setViewport(renderer.domElement.height, camera.fov);

// Thick dark grey smoke pouring from the engine bay once the engine blows
// (small puffs that rise fast and drift off on a breeze, so a stopped car
// trails a column of smoke instead of sitting inside a cloud)
const engineSmoke = new TyreSmoke(scene, {
  maxParticles: isMobile ? 200 : 320, puffsPerSecond: isMobile ? 22 : 34,
  color: 0x3a3a3c, thickness: 2.2, sizeScale: 0.5, rise: 3.4, lifeScale: 1.5,
  wind: { x: 1.1, z: 0.6 },
});
engineSmoke.setViewport(renderer.domElement.height, camera.fov);
// The tank's diesel exhaust: a light grey haze at idle, and a thick black
// puff when you floor it (more fuel than the turbo has air for yet)
const dieselSmoke = new TyreSmoke(scene, {
  maxParticles: isMobile ? 160 : 260, puffsPerSecond: isMobile ? 26 : 40,
  color: 0x1b1b1c, thickness: 2.4, sizeScale: 0.42, rise: 1.6, lifeScale: 1.3,
  wind: { x: 1.1, z: 0.6 },
});
dieselSmoke.setViewport(renderer.domElement.height, camera.fov);
let dieselBoost = 0;              // how much air the turbo is giving (lags the throttle)
const exhaustWorld = new THREE.Vector3();

// --- Crash damage you can see: a crumpled nose and tail, scratches down
// the sides from scraping along walls, steam from a holed or boiling
// radiator, and fire ---
const steam = new TyreSmoke(scene, {
  maxParticles: isMobile ? 160 : 260, puffsPerSecond: isMobile ? 16 : 24,
  color: 0xeef1f4, thickness: 1.2, sizeScale: 0.4, rise: 2.4, lifeScale: 0.8,
  wind: { x: 1.1, z: 0.6 }, carry: 0.5,
});
steam.setViewport(renderer.domElement.height, camera.fov);
// Flames: bright puffs that add light, shoot up and shrink away, with a
// hotter yellow core
const flames = new TyreSmoke(scene, {
  maxParticles: isMobile ? 160 : 280, puffsPerSecond: isMobile ? 40 : 64,
  color: 0xff5a14, thickness: 2.4, sizeScale: 0.75, rise: 3.4, lifeScale: 0.24,
  wind: { x: 0.8, z: 0.4 }, carry: 0.7, glow: true, shrink: true,
});
flames.setViewport(renderer.domElement.height, camera.fov);
const flameCore = new TyreSmoke(scene, {
  maxParticles: isMobile ? 100 : 180, puffsPerSecond: isMobile ? 30 : 48,
  color: 0xffc640, thickness: 2.2, sizeScale: 0.42, rise: 2.6, lifeScale: 0.16,
  wind: { x: 0.8, z: 0.4 }, carry: 0.7, glow: true, shrink: true,
});
flameCore.setViewport(renderer.domElement.height, camera.fov);
// The fire's flickering orange glow on the car and the ground (not on
// phones: an extra light costs every surface some drawing time)
// Coolant bursting out of a holed radiator: a quick pink spray
const coolantMist = new TyreSmoke(scene, {
  maxParticles: isMobile ? 120 : 200, puffsPerSecond: isMobile ? 60 : 90,
  color: 0xf06090, thickness: 1.6, sizeScale: 0.32, rise: 0.6, lifeScale: 0.45,
  wind: { x: 0.8, z: 0.4 }, carry: 0.6,
});
coolantMist.setViewport(renderer.domElement.height, camera.fov);
let coolantBurst = 0;      // seconds of spray left
const fireLight = isMobile ? null : new THREE.PointLight(0xff7a2a, 0, 10, 2);
if (fireLight) scene.add(fireLight);
const RADIATOR = new THREE.Vector3(0, 0.42, 1.5);
const radiatorWorld = new THREE.Vector3();

// --- DENTS: each hit pushes the body in around where it struck, deepest
// in the middle and fading out (with a little wrinkling, like crumpled
// metal). The body keeps its original shape, and every panel is reshaped
// from it and the list of dents, so the dents add up and a reset undoes
// them. The grille, headlights and tail lights move with the metal
// around them. (Car's own space: x = left, z = forward.)
const dents = [];
const _off = new THREE.Vector3();
function dentOffset(x, y, z, out) {
  out.set(0, 0, 0);
  for (const d of dents) {
    const dx = x - d.x, dy = y - d.y, dz = z - d.z;
    const f = Math.exp(-(dx * dx + dy * dy + dz * dz) / (d.r * d.r));
    if (f < 0.01) continue;
    const wrinkle = 1 + 0.45 * Math.sin(x * 41 + d.seed) * Math.sin(y * 33 + d.seed * 1.7) * Math.sin(z * 37 + d.seed * 0.6);
    out.x += d.dx * d.depth * f * wrinkle;
    out.y += d.dy * d.depth * f * wrinkle - 0.25 * d.depth * f * f;      // the crumple sags a little
    out.z += d.dz * d.depth * f * wrinkle;
  }
  const l = out.length();
  if (l > 0.32) out.multiplyScalar(0.32 / l);                                 // metal only goes so far
  return out;
}
const bodyOriginals = new Map();
function reshapeBody() {
  for (const m of carModel.crush.panels) {
    const pos = m.geometry.attributes.position;
    if (!pos || !pos.array) continue;
    let orig = bodyOriginals.get(m);
    if (!orig) { orig = Float32Array.from(pos.array); bodyOriginals.set(m, orig); }
    const a = pos.array, sx = m.scale.x || 1, sy = m.scale.y || 1, sz = m.scale.z || 1;
    for (let i = 0; i < pos.count; i++) {
      const lx = orig[i * 3], ly = orig[i * 3 + 1], lz = orig[i * 3 + 2];
      dentOffset(m.position.x + lx * sx, m.position.y + ly * sy, m.position.z + lz * sz, _off);
      a[i * 3] = lx + _off.x / sx; a[i * 3 + 1] = ly + _off.y / sy; a[i * 3 + 2] = lz + _off.z / sz;
    }
    pos.needsUpdate = true;
    smoothNormals(m.geometry);
    m.geometry.computeBoundingSphere?.();
  }
  // Parts carried on the metal
  const c = carModel.crush;
  const carried = [c.grille, ...c.lamps, ...c.tail];
  for (const m of carried) {
    m.userData.base ??= m.position.clone();
    dentOffset(m.userData.base.x, m.userData.base.y, m.userData.base.z, _off);
    m.position.copy(m.userData.base).add(_off);
  }
  // the headlamps also get knocked askew, each its own way
  c.lamps.forEach((m, i) => {
    const side = i === 0 ? -1 : 1, n = Math.min(0.4, dentOffset(m.userData.base.x, m.userData.base.y, m.userData.base.z, _off).length());
    m.rotation.set(n * (0.9 + 0.6 * side), n * 1.4 * side, n * 0.5 * side);
  });
  c.grille.rotation.x = Math.min(0.5, dentOffset(0, 0.38, 1.5, _off).length() * 2);
  placeScratches();
}
// A hit at (x, y, z) on the car, pushing in along (dx, dz), depth in metres
function dentBody(x, y, z, dx, dz, depth, radius) {
  const l = Math.hypot(dx, dz) || 1;
  dents.push({ x, y, z, dx: dx / l, dy: 0, dz: dz / l, depth, r: radius, seed: Math.random() * 100 });
  if (dents.length > 40) dents.shift();
  reshapeBody();
}
function clearDents() {
  dents.length = 0;
  scratchList.length = 0;
  reshapeBody();
}

// Scratches: short, thin bright lines of bare metal where the side of the
// car scraped along a wall. Each sits on the face of the panel it's on
// (kept clear of its rounded edges) and moves with any dent there.
const SCRATCH_MAX = isMobile ? 120 : 240;
const scratches = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xcfd1d3, metalness: 0.75, roughness: 0.32 }), SCRATCH_MAX);
scratches.count = 0;
scratches.frustumCulled = false;
scratches.castShadow = false;
carModel.car.add(scratches);
const scratchList = [];
let lastScratchAt = -9;
let lastCrashAt = -9;
const scratchM = new THREE.Matrix4(), scratchQ = new THREE.Quaternion(), scratchE = new THREE.Euler();
const scratchP = new THREE.Vector3(), scratchS = new THREE.Vector3();
// The flat outside face of the body at a point along the car: how far out
// it is, and the heights and lengths it covers (inside its rounded edges)
function bodySideAt(z) {
  if (z > 0.68) return { x: 0.312, y0: 0.27, y1: 0.49, z0: 0.68, z1: 1.43 };     // nose
  if (z < -0.74) return { x: 0.772, y0: 0.625, y1: 0.655, z0: -1.47, z1: -0.74 }; // edge of the rear wing
  return { x: 0.452, y0: 0.2, y1: 0.62, z0: -1.25, z1: 0.55 };                   // the tub
}
function addScratch(along, left, strength) {
  const b = bodySideAt(along);
  const room = b.z1 - b.z0;
  const len = Math.min(room * 0.9, 0.05 + (0.06 + 0.16 * Math.random()) * strength);
  const z = Math.max(b.z0 + len / 2, Math.min(b.z1 - len / 2, along + (Math.random() - 0.5) * 0.1));
  const y = b.y0 + Math.random() * (b.y1 - b.y0);
  scratchList.push({ side: left ? 1 : -1, x: b.x, y, z, len, tilt: (Math.random() - 0.5) * 0.25, w: 0.0025 + 0.004 * Math.random() });
  if (scratchList.length > SCRATCH_MAX) scratchList.shift();
  placeScratches();
}
function placeScratches() {
  scratchList.forEach((sc, i) => {
    dentOffset(sc.side * sc.x, sc.y, sc.z, _off);
    scratchP.set(sc.side * (sc.x + 0.0015) + _off.x, sc.y + _off.y, sc.z + _off.z);
    scratchQ.setFromEuler(scratchE.set(sc.tilt, 0, 0));
    scratchS.set(0.003, sc.w, sc.len);
    scratchM.compose(scratchP, scratchQ, scratchS);
    scratches.setMatrixAt(i, scratchM);
  });
  scratches.count = scratchList.length;
  scratches.instanceMatrix.needsUpdate = true;
}
// WIND at ground level: blows the same way as the wind carrying the clouds,
// light on a clear day and much stronger in a storm, in gusts. It slants
// the rain, sways the grass and carries smoke, steam and dust away.
const groundWind = { x: 0, z: 0 };
const viewDir = new THREE.Vector3(), viewAt = new THREE.Vector3();   // where the camera is and which way it looks (for the grass)
const WIND_USERS = [];   // [smoke system, how much of the wind it feels]
function updateWind(t) {
  const storm = rain.intensity ?? 0;
  const gust = 0.7 + 0.3 * Math.sin(t * 0.83) * Math.sin(t * 0.31 + 1.3) + (0.15 + 0.25 * storm) * Math.sin(t * 2.1) * Math.sin(t * 0.57);
  const speed = (1.3 + 6.5 * storm) * Math.max(0.25, gust);
  const len = Math.hypot(sky.wind.x, sky.wind.y) || 1;
  groundWind.x = (sky.wind.x / len) * speed;
  groundWind.z = (sky.wind.y / len) * speed;
  rain.wind = groundWind;
  grass.setWind?.(groundWind.x, groundWind.z, t);
  flora.setWind(groundWind.x, groundWind.z, t);
  for (const [sys, k] of WIND_USERS) { sys.wind = { x: groundWind.x * k, z: groundWind.z * k }; }
}

// How hard each kind of barrier hits the car (soft tyre walls are kinder)
const CRASH_SOFT = { tyres: 0.55, fence: 0.7, armco: 0.85, concrete: 1, building: 1, tree: 0.95 };

// Tan dust kicked up by tyres rolling through the gravel (instead of tyre smoke)
const dust = new TyreSmoke(scene, {
  maxParticles: isMobile ? 160 : 260, puffsPerSecond: isMobile ? 18 : 28,
  color: 0xc4a87a, thickness: 1.3, sizeScale: 0.75, rise: 0.4, lifeScale: 0.75,
  wind: { x: 0.5, z: 0.3 },
});
dust.setViewport(renderer.domElement.height, camera.fov);

// Spray thrown up behind the tyres on a wet track (much thicker through
// puddles): pale, and carried along with the car
const spray = new TyreSmoke(scene, {
  maxParticles: isMobile ? 260 : 460, puffsPerSecond: isMobile ? 26 : 44,
  color: 0xd5dde4, thickness: 0.9, sizeScale: 0.85, rise: 0.15, lifeScale: 0.55, carry: 0.55,
});
spray.setViewport(renderer.domElement.height, camera.fov);
// ...and the water pumped out sideways by treaded tyres
const sideSpray = new TyreSmoke(scene, {
  maxParticles: isMobile ? 220 : 400, puffsPerSecond: isMobile ? 30 : 50,
  color: 0xdde4ea, thickness: 0.75, sizeScale: 0.5, rise: 0.25, lifeScale: 0.35, carry: 1,
});
sideSpray.setViewport(renderer.domElement.height, camera.fov);
const sideOut = new THREE.Vector3(), sideVel = new THREE.Vector3(), sidePos = new THREE.Vector3();
// Off the tarmac: brown dust from dry grass, brown muddy spray from wet grass
const grassDust = new TyreSmoke(scene, {
  maxParticles: isMobile ? 140 : 220, puffsPerSecond: isMobile ? 16 : 24,
  color: 0x8c6c48, thickness: 1.0, sizeScale: 0.7, rise: 0.35, lifeScale: 0.7, wind: { x: 0.5, z: 0.3 },
});
grassDust.setViewport(renderer.domElement.height, camera.fov);
const mudSpray = new TyreSmoke(scene, {
  maxParticles: isMobile ? 160 : 260, puffsPerSecond: isMobile ? 20 : 32,
  color: 0x5a4330, thickness: 1.3, sizeScale: 0.7, rise: 0.1, lifeScale: 0.5, carry: 0.45,
});
mudSpray.setViewport(renderer.domElement.height, camera.fov);
// How much of the ground wind each cloud of smoke or spray feels
WIND_USERS.push([smoke, 0.5], [engineSmoke, 0.6], [dieselSmoke, 0.6], [steam, 0.6], [flames, 0.3], [flameCore, 0.3],
  [dust, 0.4], [spray, 0.5], [sideSpray, 0.4], [grassDust, 0.4], [mudSpray, 0.2], [coolantMist, 0.5]);
// Bits flung by the tyres: grass clippings, and clumps of mud
const grassBits = new FlyingBits(scene, {
  max: isMobile ? 160 : 300, colours: [0x4f7a2c, 0x5d8a33, 0x3f6524, 0x6e9440], size: [0.025, 0.06], flat: true,
});
const mudClumps = new FlyingBits(scene, {
  max: isMobile ? 90 : 160, colours: [0x3b2a1a, 0x4a3522, 0x2f2215], size: [0.02, 0.05], flat: false,
});
// Glittery metal shavings ground off a bare rim
const flakes = new MetalFlakes(scene, { max: isMobile ? 900 : 1600 });
// Pale scratches scored into the road by a bare rim or a dragging frame
const gouges = new SkidMarks(scene, {
  maxSegments: isMobile ? 600 : 1200, tyreWidth: 0.035, rubberBonus: 0,
  threshold: 0.05, height: 0.0035, base: 0x4a4d50, mark: 0xb4b5b1,
});
// A wheel that has come off (one per corner)
const looseWheels = [0, 1, 2, 3].map(() => new LooseWheel(scene, {
  rimGeo: carModel.rims.geometry, spokeGeo: carModel.spokes.geometry,
  rimMat: carModel.rims.material, spokeMat: carModel.spokes.material,
  radius: WHEEL_RADIUS * 0.66,
}));
const ENGINE_BAY = new THREE.Vector3(0, 0.62, 0.95);

// Sparks and flying metal when the engine blows
const debris = new EngineDebris(scene, { maxSparks: isMobile ? 140 : 220, chunkCount: isMobile ? 8 : 12 });
debris.setViewport(renderer.domElement.height, camera.fov);
let debrisPending = false;
let bodySparks = 0;   // sparks owed from bodywork scraping the road   // set when the engine blows, fired once the engine bay position is known
const engineBayWorld = new THREE.Vector3();

const SMOKE_POINTS = [
  { id: 'rl', local: new THREE.Vector3(-TRACK_HALF, 0.12, REAR_AXLE), axle: 'rear' },
  { id: 'rr', local: new THREE.Vector3(TRACK_HALF, 0.12, REAR_AXLE), axle: 'rear' },
  { id: 'fl', local: new THREE.Vector3(-TRACK_HALF, 0.12, FRONT_AXLE), axle: 'front' },
  { id: 'fr', local: new THREE.Vector3(TRACK_HALF, 0.12, FRONT_AXLE), axle: 'front' },
];
const smokeWorld = new THREE.Vector3();
const skidWorld = new THREE.Vector3();
const carVelocity = new THREE.Vector3();
let puddleUnder = 0;   // how much standing water the tyres are in (0-1), for the sound
let mudUnder = 0;      // ...and how much mud they're churning through

function updateSmoke(dt) {
  const sin = Math.sin(physics.heading);
  const cos = Math.cos(physics.heading);
  carVelocity.set(sin * physics.vx + cos * physics.vy, 0, cos * physics.vx - sin * physics.vy);
  carModel.car.updateMatrixWorld();
  const speed = Math.hypot(physics.vx, physics.vy);
  const moving = Math.abs(physics.vx) > 1;
  const locked = physics.wheelsLocked ? 0.85 : 0;
  const rearSkid = Math.max(physics.tyreSlip.rear, locked, physics.handbrakeOn && moving ? 0.7 : 0);
  const frontSkid = Math.max(Math.min(1, physics.tyreSlip.front * 2.5), locked);

  // Tyre smoke on tarmac, tan dust in the gravel
  const smoothWet = THREE.MathUtils.smoothstep(rain.wetness, 0.05, 0.4);
  puddleUnder = 0;
  mudUnder = 0;
  let gravelWheels = 0;
  let grassWheels = 0;
  for (const p of SMOKE_POINTS) {
    smokeWorld.copy(p.local);
    carModel.car.localToWorld(smokeWorld);
    p.onGravel = inGravel(smokeWorld.x, smokeWorld.z);
    p.onGrass = grass.contains(smokeWorld.x, smokeWorld.z);
    if (p.onGravel) gravelWheels++;
    if (p.onGrass) grassWheels++;
    const wi = physicsWheel(p.local.x, p.axle === 'front');
    const tyre = physics.tyres[wi];
    const rubberOn = !tyre.rim && !tyre.detached;
    // (no tyre smoke from a bare rim or a missing wheel, and none in the wet)
    const slip = p.onGravel || p.onGrass || !rubberOn ? 0 : physics.tyreSlip[p.axle] * (1 - 0.8 * rain.wetness);
    smoke.emitFrom(p.id, smokeWorld, slip, carVelocity, dt);
    const skid = p.axle === 'rear' ? rearSkid : frontSkid;
    const kick = Math.min(1, Math.min(1, speed / 12) * 0.7 + skid * 0.8);   // dust whenever driving through it
    dust.emitFrom(p.id, smokeWorld, p.onGravel ? kick * (1 - 0.85 * rain.wetness) : 0, carVelocity, dt);
    // Wet tarmac: spray off the back of the tyre, much more through a puddle
    const puddle = p.onGravel || p.onGrass ? 0 : rain.puddleAt(smokeWorld.x, smokeWorld.z);
    puddleUnder += puddle / 4;
    // (whenever the car is moving on a wet road, not just when sliding: more
    // the faster you go)
    const fast = Math.min(1, speed / 14);
    const sprayAmount = p.onGravel || p.onGrass || tyre.detached || speed < 1 ? 0
      : Math.min(1, fast * (0.9 * smoothWet + 2 * puddle) + 0.3 * skid * rain.wetness);
    spray.emitFrom(p.id, smokeWorld, sprayAmount, carVelocity, dt);
    // Treaded tyres also pump water out sideways through their grooves:
    // a sheet of spray from each side of the tyre, strongest from full wets,
    // hardly any from slicks (they have no grooves to channel it)
    if (!p.onGravel && !p.onGrass && !tyre.detached && speed > 3 && rain.wetness > 0.05) {
      const channel = Math.min(1, (DRAIN[physics.tyreCompound] ?? 16) / 30);
      const sheet = Math.min(1, Math.min(1, speed / 14) * (0.6 * smoothWet + 2.2 * puddle)) * channel;
      const lx = Math.cos(physics.heading), lz = -Math.sin(physics.heading);
      for (const side of [-1, 1]) {
        sideOut.set(lx * side, 0, lz * side);
        sideVel.copy(carVelocity).multiplyScalar(0.55).addScaledVector(sideOut, 2.5 + speed * 0.12);
        sidePos.copy(smokeWorld).addScaledVector(sideOut, 0.12);
        sideSpray.emitFrom(p.id + side, sidePos, sheet, sideVel, dt);
      }
    }
    // Grass: clippings and brown dust when dry; brown spray when wet, worse in mud
    // (whenever the car is driving on it, more the faster, and more again when sliding)
    const churn = p.onGrass && !tyre.detached && speed > 0.4 ? Math.min(1, 0.45 + 0.55 * Math.min(1, speed / 10) + skid) : 0;
    const mud = p.onGrass ? rain.mudAt(smokeWorld.x, smokeWorld.z) : 0;
    grassDust.emitFrom(p.id, smokeWorld, churn * 0.8 * (1 - 0.7 * rain.wetness), carVelocity, dt);
    mudSpray.emitFrom(p.id, smokeWorld, Math.min(1, churn * (0.9 * rain.wetness + 1.2 * mud)), carVelocity, dt);
    mudUnder += mud * Math.min(1, churn * 2) / 4;
    grassBits.emit(p.id, smokeWorld, carVelocity, churn * (1 - 0.6 * mud), 40, dt);
    mudClumps.emit(p.id, smokeWorld, carVelocity, churn * Math.min(1, mud * 1.5 + 0.3 * rain.wetness), 30, dt);
  }
  smoke.update(dt);
  dust.update(dt);
  spray.update(dt);
  sideSpray.update(dt);
  grassDust.update(dt);
  mudSpray.update(dt);
  grassBits.update(dt);
  mudClumps.update(dt);
  chips.update(dt);

  // Skid marks: each tyre marks the tarmac while it slides, spins or locks
  // (not the gravel). Tyre squeal follows the same skid measure as the marks,
  // and gravel has its own grinding sound instead.
  const onTarmac = 1 - (gravelWheels + grassWheels) / 4;
  // (only tyres with rubber on them squeal: bare rims screech instead, see the sound section)
  const rubber = (a, b) => [a, b].filter((i) => !physics.tyres[i].blown).length / 2;
  engineSound.setSqueal(Math.max(rearSkid * rubber(2, 3), frontSkid * rubber(0, 1)) * onTarmac * (1 - 0.75 * rain.wetness), speed);
  engineSound.setGravel(gravelWheels / 4, speed, Math.max(rearSkid, frontSkid));
  engineSound.setGrass(grassWheels / 4, speed, Math.max(rearSkid, frontSkid));
  for (const p of SMOKE_POINTS) {
    skidWorld.set(p.local.x, 0, p.local.z);
    carModel.car.localToWorld(skidWorld);
    // (a bare rim or a missing wheel leaves no rubber; a wet track takes far less)
    const wt = physics.tyres[physicsWheel(p.local.x, p.axle === 'front')];
    const marks = p.onGravel || p.onGrass || wt.rim || wt.detached ? 0 : (p.axle === 'rear' ? rearSkid : frontSkid) * (1 - 0.6 * rain.wetness);
    skids.update(p.id, skidWorld.x, skidWorld.z, marks);
    // In the gravel every rolling tyre leaves a track, heavier when it slides
    const rolling = speed > 0.5 && inGravel(skidWorld.x, skidWorld.z);
    gravelTrails.update(p.id, skidWorld.x, skidWorld.z, rolling ? 0.45 + 0.55 * (p.axle === 'rear' ? rearSkid : frontSkid) : 0);
    // In the grass: the tyre presses the grass flat (it disappears) and
    // leaves a dark brown track in the earth
    const onGrass = speed > 0.3 && grass.contains(skidWorld.x, skidWorld.z);
    if (onGrass) grass.flatten(skidWorld.x, skidWorld.z, 0.11);
    grassTrails.update(p.id, skidWorld.x, skidWorld.z, onGrass ? 0.5 + 0.5 * (p.axle === 'rear' ? rearSkid : frontSkid) : 0);
  }

  // Engine smoke: pours out once blown
  engineBayWorld.copy(ENGINE_BAY);
  carModel.car.localToWorld(engineBayWorld);
  const fire = physics.fireLevel;
  engineSmoke.emitFrom('engine', engineBayWorld, Math.max(physics.engineBlown ? 1 : 0, fire * 0.9, physics.oilSmoke), carVelocity, dt);   // (black smoke: blown, burning, or cooking its oil)
  engineSmoke.update(dt);
  dieselSmoke.update(dt);
  // Steam from the radiator, flames from the engine bay
  radiatorWorld.set(RADIATOR.x, RADIATOR.y, RADIATOR.z - physics.noseCrush);
  carModel.car.localToWorld(radiatorWorld);
  // the pressurised coolant bursting out: a pink spray with a cloud of steam
  if (coolantBurst > 0) {
    coolantBurst -= dt;
    coolantMist.emitFrom('radiator', radiatorWorld, 1, carVelocity, dt);
  }
  coolantMist.update(dt);
  steam.emitFrom('radiator', radiatorWorld, coolantBurst > 0 ? 1 : physics.steam, carVelocity, dt);
  steam.update(dt);
  flames.emitFrom('fire', engineBayWorld, fire, carVelocity, dt);
  flameCore.emitFrom('fire', engineBayWorld, fire, carVelocity, dt);
  flames.update(dt);
  flameCore.update(dt);
  if (fireLight) {
    fireLight.position.copy(engineBayWorld);
    fireLight.position.y += 0.5;
    fireLight.intensity = fire > 0 ? fire * (4 + 2 * Math.sin(clock.elapsedTime * 23) + 1.5 * Math.random()) : 0;
  }

  if (debrisPending) {
    debris.burst(engineBayWorld, carVelocity, physics.heading);
    debrisPending = false;
  }
  debris.update(dt, engineBayWorld, carVelocity, physics.heading);
  checkDebrisPunctures();
  checkGravelPunctures(dt);
  updateBlownTyres(dt);

  // Oil: drips below 10% health, pours once the engine has blown
  // (stops once the oil has all run out: there's nothing left to leak)
  const leakRate = !physics.leakingOil ? 0 : physics.engineBlown ? 2 : 1;
  oilColourNow(oil.oilColour);
  oil.update(dt, physics.x, physics.z, physics.heading, physics.vx, leakRate, physics.oilLevel);   // (thins out as it runs low)
  // coolant: pours just after the radiator bursts, then drips while there's any left
  const coolantRate = physics.radiator < 1 && physics.coolant > 0.01 ? (coolantBurst > 0 ? 2 : 1) : 0;
  coolant.update(dt, physics.x, physics.z, physics.heading, physics.vx, coolantRate, physics.coolant);
}

// ---------------------------------------------------------------------
// CRASHES: the car against buildings, walls and barriers
// The car is a rectangle seen from above; everything it can hit is a box
// (scenery.js). Each step, find the deepest overlap, push the car back out,
// and bounce it off: the part of its motion into the wall is stopped (and a
// little sent back), the part along the wall is slowed by friction, and a
// hit off the car's centre sets it spinning, as in a real crash.
// Barriers give way: Armco dents, tyre walls squash back, fences bulge,
// concrete cracks (and throws chips). Buildings don't move.
// ---------------------------------------------------------------------
const COLLIDERS = echoSurfaces.colliders || [];
let CAR_FRONT = 1.53, CAR_REAR = 1.52, CAR_HALF_W = 0.8;
let CAR_MASS = CATERHAM.mass || 560;
let CAR_INERTIA = CAR_MASS * ((CAR_FRONT + CAR_REAR) ** 2 + (2 * CAR_HALF_W) ** 2) / 12;
// The tank (secret) is much bigger and heavier: walls push it about far less
function setCrashBox(isTank) {
  [CAR_FRONT, CAR_REAR, CAR_HALF_W, CAR_MASS] = isTank ? [2.25, 2.2, 1.1, 8000] : [1.53, 1.52, 0.8, CATERHAM.mass || 560];
  CAR_INERTIA = CAR_MASS * ((CAR_FRONT + CAR_REAR) ** 2 + (2 * CAR_HALF_W) ** 2) / 12;
}
// bounce: how much speed into the wall comes back out; grip: friction along it
const HIT = {
  building: { bounce: 0.15, grip: 0.5 },
  concrete: { bounce: 0.2, grip: 0.45 },
  armco: { bounce: 0.15, grip: 0.25 },      // you slide along it
  tyres: { bounce: 0.4, grip: 0.7 },        // springy, and grabby
  fence: { bounce: 0.05, grip: 0.6 },       // catches you
  tree: { bounce: 0.2, grip: 0.55 },        // a solid trunk
};
// Points round the edge of the car, every 30 cm or so (car's own space: x = left, z = forward)
const CAR_POINTS = [];
for (let x = -CAR_HALF_W; x <= CAR_HALF_W + 1e-6; x += CAR_HALF_W / 3) CAR_POINTS.push([x, CAR_FRONT], [x, -CAR_REAR]);
for (let z = -CAR_REAR + 0.3; z < CAR_FRONT - 0.1; z += 0.3) CAR_POINTS.push([CAR_HALF_W, z], [-CAR_HALF_W, z]);
const lastHit = new Map();
const chips = new FlyingBits(scene, { max: isMobile ? 80 : 140, colours: [0xb8b5ae, 0xa9a59c, 0xd0cdc5], size: [0.02, 0.06], flat: false });
const chipVel = new THREE.Vector3();

// Hit boxes sorted into 16 m squares, so only the ones near the car are
// checked (Sepang has thousands). Each box is filed under every square it
// could reach, allowing for barriers being pushed back a little.
const BUCKET = 16;
const buckets = new Map();
for (const c of COLLIDERS) {
  for (let bx = Math.floor((c.minX - 2) / BUCKET); bx <= Math.floor((c.maxX + 2) / BUCKET); bx++) {
    for (let bz = Math.floor((c.minZ - 2) / BUCKET); bz <= Math.floor((c.maxZ + 2) / BUCKET); bz++) {
      const key = bx * 100003 + bz;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(c);
    }
  }
}
const nearby = new Set();
function collidersNear(x, z) {
  nearby.clear();
  for (let bx = Math.floor((x - 2.5) / BUCKET); bx <= Math.floor((x + 2.5) / BUCKET); bx++) {
    for (let bz = Math.floor((z - 2.5) / BUCKET); bz <= Math.floor((z + 2.5) / BUCKET); bz++) {
      const list = buckets.get(bx * 100003 + bz);
      if (list) for (const c of list) nearby.add(c);
    }
  }
  return nearby;
}

function findContact() {
  const cx = physics.x, cz = physics.z, h = physics.heading;
  const fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
  let best = null;
  const consider = (depth, nx, nz, px, pz, c) => {
    if (depth > 0 && (!best || depth > best.depth)) best = { depth, nx, nz, px, pz, c };
  };
  for (const c of collidersNear(cx, cz)) {
    if (c.maxX < cx - 2.2 || c.minX > cx + 2.2 || c.maxZ < cz - 2.2 || c.minZ > cz + 2.2) continue;
    // Corners and edges of the car inside the box: pushed out through the
    // nearest face that's on the car's side of the box
    for (const [px, pz] of CAR_POINTS) {
      const wx = cx + fx * pz + lx * px, wz = cz + fz * pz + lz * px;
      if (wx <= c.minX || wx >= c.maxX || wz <= c.minZ || wz >= c.maxZ) continue;
      const faces = [
        [wx - c.minX, -1, 0, cx < c.minX], [c.maxX - wx, 1, 0, cx > c.maxX],
        [wz - c.minZ, 0, -1, cz < c.minZ], [c.maxZ - wz, 0, 1, cz > c.maxZ],
      ];
      const facing = faces.filter((f) => f[3]);
      const pick = (facing.length ? facing : faces).reduce((a, b) => (b[0] < a[0] ? b : a));
      consider(pick[0], pick[1], pick[2], wx, wz, c);
    }
    // Corners of the box inside the car (a post or the corner of a wall
    // poking into the car's side): the car is pushed off it
    for (const [bx, bz] of [[c.minX, c.minZ], [c.minX, c.maxZ], [c.maxX, c.minZ], [c.maxX, c.maxZ]]) {
      const rx = bx - cx, rz = bz - cz;
      const along = rx * fx + rz * fz, side = rx * lx + rz * lz;
      if (along >= CAR_FRONT || along <= -CAR_REAR || Math.abs(side) >= CAR_HALF_W) continue;
      const edges = [
        [CAR_FRONT - along, -fx, -fz], [along + CAR_REAR, fx, fz],
        [CAR_HALF_W - side, -lx, -lz], [side + CAR_HALF_W, lx, lz],
      ];
      const e = edges.reduce((a, b) => (b[0] < a[0] ? b : a));
      consider(e[0], e[1], e[2], bx, bz, c);
    }
  }
  return best;
}

// How high the car (or the tank) is sitting right now: the tank keeps its
// own height, as the car's physics isn't running while you drive it
function vehicleGroundY() {
  if (tankMode) return tankPhys.y;
  return physics.air ? physics.pose.y : physics.ground.y;
}

function collide(now) {
  if (physics.air && physics.airHeight > 0.9) return;   // flying over the barriers
  for (let iter = 0; iter < 4; iter++) {
    const k = findContact();
    if (!k) return;
    physics.x += k.nx * k.depth;
    physics.z += k.nz * k.depth;
    const h = physics.heading;
    const fx = Math.sin(h), fz = Math.cos(h), lx = Math.cos(h), lz = -Math.sin(h);
    let vx = fx * physics.vx + lx * physics.vy, vz = fz * physics.vx + lz * physics.vy;
    let w = physics.yawRate;
    const rx = k.px - physics.x, rz = k.pz - physics.z;
    const pvx = vx + w * rz, pvz = vz - w * rx;                     // how fast that part of the car is moving
    const vn = pvx * k.nx + pvz * k.nz;
    if (vn >= 0) continue;                                          // already moving away
    // A bollard just gets knocked flat: it doesn't stop the car
    if (k.c.kind === 'bollard') { k.c.hit?.({ x: k.px, z: k.pz }, { x: k.nx, z: k.nz }, -vn); continue; }
    const props = HIT[k.c.kind] || HIT.building;
    let bounce = props.bounce;
    // Which part of the car hit: the push from the wall in the car's own
    // terms (pushed backwards = a front hit, sideways = a side hit)
    const nf = k.nx * fx + k.nz * fz, nl = k.nx * lx + k.nz * lz;
    const zone = nf < -0.6 ? 'front' : nf > 0.6 ? 'rear' : nl > 0 ? 'right' : 'left';
    const along = rx * fx + rz * fz, across = rx * lx + rz * lz;
    const hitSpeed = -vn * (CRASH_SOFT[k.c.kind] ?? 1);
    if (hitSpeed > 2.5 && now - lastCrashAt > 0.3 && !tankMode) {   // (the tank barely notices)
      lastCrashAt = now;
      physics.crashHit({ zone, speed: hitSpeed, along, across });
      // Dent the body where it struck (on the bodywork, not the wheel
      // that may have touched first), pushed in the way the wall pushed
      if (hitSpeed > 3) {
        const depth = Math.min(0.22, (hitSpeed - 3) * 0.016);
        const radius = 0.2 + Math.min(0.25, hitSpeed * 0.01);
        if (zone === 'front') dentBody(Math.max(-0.28, Math.min(0.28, across)), 0.4, 1.5, nl, nf, depth, radius);
        else if (zone === 'rear') dentBody(Math.max(-0.7, Math.min(0.7, across)), 0.52, -1.5, nl, nf, depth * 0.9, radius);
        else dentBody(zone === 'left' ? 0.45 : -0.45, 0.42, Math.max(-1.3, Math.min(1.45, along)), nl, nf, depth * 0.7, radius);
      }
    }
    // A proper hit: the barrier reacts (dents, squashes, cracks)
    if (k.c.hit && -vn > 1.5 && now - (lastHit.get(k.c) ?? -9) > 0.25) {
      lastHit.set(k.c, now);
      const res = k.c.hit({ x: k.px, z: k.pz }, { x: k.nx, z: k.nz }, -vn);
      if (res?.absorb) bounce *= 1 - res.absorb;                    // a barrier that gives way bounces you back less
      if (res?.chips) {
        chipVel.set(k.nx * 3, 0, k.nz * 3).addScaledVector(carVelocity, 0.3);
        for (let i = 0; i < res.chips; i++) chips.spawn({ x: k.px, z: k.pz }, chipVel, 1);
      }
    }
    // Stop (and bounce) the motion into the wall
    const rn = rz * k.nx - rx * k.nz;
    const jn = -(1 + bounce) * vn / (1 / CAR_MASS + rn * rn / CAR_INERTIA);
    vx += jn * k.nx / CAR_MASS; vz += jn * k.nz / CAR_MASS; w += rn * jn / CAR_INERTIA;
    // Friction along the wall (no more than the push allows)
    const tx = -k.nz, tz = k.nx;
    const vt = (vx + w * rz) * tx + (vz - w * rx) * tz;
    // Sliding along it on the car's side: scratches
    if ((zone === 'left' || zone === 'right') && Math.abs(vt) > 2 && now - lastScratchAt > 0.05) {
      lastScratchAt = now;
      addScratch(along, zone === 'left', Math.min(1, Math.abs(vt) / 15));
    }
    const rt = rz * tx - rx * tz;
    let jt = -vt / (1 / CAR_MASS + rt * rt / CAR_INERTIA);
    jt = Math.max(-props.grip * jn, Math.min(props.grip * jn, jt));
    vx += jt * tx / CAR_MASS; vz += jt * tz / CAR_MASS; w += rt * jt / CAR_INERTIA;
    physics.vx = vx * fx + vz * fz;
    physics.vy = vx * lx + vz * lz;
    physics.yawRate = w;
  }
}

// ---------------------------------------------------------------------
// SOUND
// Browsers block sound until the player interacts, so it starts on the
// first key press or tap. Buildings and walls reflect the car's sound
// back as echoes (see EchoSystem in sound.js).
// ---------------------------------------------------------------------
const engineSound = new EngineSound(CATERHAM);
// (If the browser is still using an older saved sound.js, skip the echoes
// rather than stopping the game; they'll work after a refresh)
if (typeof engineSound.echo.addBox === 'function') {
  for (const e of echoSurfaces) engineSound.echo.addBox(e.min, e.max, e.reflect);
} else {
  console.warn('Echoes off: sound.js is an older version. Refresh to update it.');
}
const startSound = () => {
  engineSound.start();
  soundHint.style.display = 'none';
};
window.addEventListener('keydown', startSound);
window.addEventListener('pointerdown', startSound);

// Controls guide in the corner label
const info = document.getElementById('info');
info.innerHTML =
  '<b>Track Tester</b><br>' +
  'W / S: throttle, brake · A / D: steer<br>' +
  'Space: handbrake · X: clutch · Q / E or , / . : shift<br>' +
  'Reverse: Q from 1st (manual), R (auto, CVT)<br>' +
  'T: gearbox · arrow on the right: gearbox and assists<br>' +
  'F: horn · G: lights · M: mute · C: camera (drag to look around in the on-car views) · Backspace: reset<br>' +
  '<span id="soundhint" style="color:#ffd76a">Press any key or tap for sound</span>';
const soundHint = document.getElementById('soundhint');

// Phones and tablets: on-screen controls, and no keyboard guide
const touchMode = isTouchDevice();
const touchUI = touchMode ? new TouchControls() : null;
if (touchMode) info.style.display = 'none';

// Dashboard: rev counter, speedometer with shift lights, side panel
const hud = new Hud({
  redline: CATERHAM.redline,
  onTransmission: (name) => physics.setTransmission(name),
  onAssist: (name, on) => { physics.assists[name] = on; },
  onTyres: (id) => { physics.setTyres(id); tyreLooks.apply(id); },
  // Track picker: remember the choice and reload to build it
  track: TRACK,
  onTrack: (id) => {
    try { localStorage.setItem(TRACK_KEY, id); } catch (e) { /* storage blocked */ }
    location.reload();
  },
  tyreOptions: TYRES,
  compact: touchMode,   // mini gauges at the top on phones
  timeSpeeds: TIME_SPEEDS,
  onWhatsNew: () => updateScreen.openAll(),
  onSky: {
    time: (h) => sky.setTime(h),
    speed: (x) => sky.setSpeed(x),
    lock: (on) => sky.setLocked(on),
    weather: (w) => sky.setWeather(w),
    changing: (on) => sky.setChanging(on),
  },
});
// The car's own dashboard dials show the HUD's drawings (cockpit.js)
cockpit.useHudDials(hud.parts);

// ---------------------------------------------------------------------
// CAMERAS (press C to cycle):
//   chase     - behind and above the car
//   close     - a closer, lower chase
//   bonnet    - on the bonnet, looking ahead
//   cockpit   - the driver's eyes: wheel, hands, dials and mirrors
//   tcam      - on top of the roll bar, like a racing car's T-camera
//   showroom  - orbit around the car
// In the cameras fixed to the car (bonnet, cockpit, T-cam) you can drag to
// look around, even straight up at the sky.
// ---------------------------------------------------------------------
const CAMERA_MODES = ['chase', 'close', 'bonnet', 'cockpit', 'tcam', 'showroom'];
const CAMERA_FOV = { chase: 50, close: 58, bonnet: 66, cockpit: 70, tcam: 62, showroom: 50 };
// Cameras fixed to the car: where they sit, and how far they look down
const ON_CAR = {
  bonnet: { spot: new THREE.Vector3(0, 0.9, 0.42), pitch: 0, near: 0.05 },
  cockpit: { spot: EYE, pitch: -0.1, near: 0.02 },
  tcam: { spot: new THREE.Vector3(0, 1.2, -0.75), pitch: -0.08, near: 0.05 },
};
let cameraMode = 'chase';
const carPos = new THREE.Vector3();
const lastCarPos = new THREE.Vector3();
const forward = new THREE.Vector3();
const desiredCam = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const carTurn = new THREE.Quaternion();
const lookTurn = new THREE.Quaternion();
const lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');

// Free look: drag on the screen to look around; let go and it eases back
const look = { yaw: 0, pitch: 0, dragging: false, id: null, x: 0, y: 0, idle: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!ON_CAR[cameraMode]) return;
  look.dragging = true; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (!look.dragging || e.pointerId !== look.id) return;
  const k = 3 / Math.max(window.innerWidth, 1);           // a full-width drag turns about 170 degrees
  look.yaw = THREE.MathUtils.clamp(look.yaw - (e.clientX - look.x) * k, -2.6, 2.6);
  look.pitch = THREE.MathUtils.clamp(look.pitch + (e.clientY - look.y) * k, -0.45, 1.35);   // up to near straight up
  look.x = e.clientX; look.y = e.clientY;
  look.idle = 0;
});
const endLook = (e) => { if (e.pointerId === look.id) look.dragging = false; };
window.addEventListener('pointerup', endLook);
window.addEventListener('pointercancel', endLook);

function updateCamera(dt) {
  const gy = vehicleGroundY();   // (follows the car or tank over the hills and up into the air)
  carPos.set(physics.x, gy, physics.z);
  forward.set(Math.sin(physics.heading), 0, Math.cos(physics.heading));

  if (cameraMode === 'chase' || cameraMode === 'close') {
    // Sit behind and above the car, catching up smoothly
    const close = cameraMode === 'close';
    desiredCam.copy(carPos).addScaledVector(forward, close ? -4.1 : -6.5);
    // (above the ground under the camera, too, so it never dips into a hill behind)
    desiredCam.y = Math.max(gy, groundAt(desiredCam.x, desiredCam.z)) + (close ? 1.45 : 2.4);
    camera.position.lerp(desiredCam, 1 - Math.exp((close ? -9 : -6) * dt));
    lookTarget.copy(carPos).addScaledVector(forward, close ? 3 : 2.5);
    lookTarget.y = gy + (close ? 0.6 : 0.7);
    camera.lookAt(lookTarget);
  } else if (ON_CAR[cameraMode]) {
    // Fixed to the car (so it pitches and rolls with it), looking ahead
    // plus wherever you've dragged the view
    if (!look.dragging) {
      look.idle += dt;
      if (look.idle > 0.8) {                     // a moment after letting go, ease back to the front
        const ease = 1 - Math.exp(-3 * dt);
        look.yaw -= look.yaw * ease;
        look.pitch -= look.pitch * ease;
      }
    }
    carModel.car.updateMatrixWorld();
    const mount = ON_CAR[cameraMode];
    camera.position.copy(tankMode ? TANK_EYE : mount.spot);   // (in the tank: looking out of the commander's hatch)
    carModel.car.localToWorld(camera.position);
    carModel.car.getWorldQuaternion(carTurn);
    lookEuler.set(mount.pitch + look.pitch, Math.PI + look.yaw, 0);   // the camera looks along -z; the car faces +z
    camera.quaternion.copy(carTurn).multiply(lookTurn.setFromEuler(lookEuler));
  } else {
    // Showroom: orbit around the car and move along with it, never below the ground
    camera.position.add(carPos).sub(lastCarPos);
    controls.target.set(carPos.x, gy + 0.45, carPos.z);
    controls.update();
    const under = groundAt(camera.position.x, camera.position.z) + 0.15;
    if (camera.position.y < under) {
      camera.position.y = under;
      camera.lookAt(controls.target);
    }
  }
  lastCarPos.copy(carPos);
}

// Particles and the sun rays size themselves to the screen and the view angle
function fitViewport() {
  smoke.setViewport(renderer.domElement.height, camera.fov);
  engineSmoke.setViewport(renderer.domElement.height, camera.fov);
  dieselSmoke.setViewport(renderer.domElement.height, camera.fov);
  for (const f of [steam, flames, flameCore, coolantMist]) f.setViewport(renderer.domElement.height, camera.fov);
  dust.setViewport(renderer.domElement.height, camera.fov);
  for (const fx of [spray, sideSpray, grassDust, mudSpray]) fx.setViewport(renderer.domElement.height, camera.fov);
  debris.setViewport(renderer.domElement.height, camera.fov);
  godRays.resize();
}

function switchCamera() {
  cameraMode = CAMERA_MODES[(CAMERA_MODES.indexOf(cameraMode) + 1) % CAMERA_MODES.length];
  look.yaw = look.pitch = 0;
  camera.fov = CAMERA_FOV[cameraMode];
  camera.near = ON_CAR[cameraMode]?.near ?? 0.1;
  cockpit.setFirstPerson(cameraMode === 'cockpit');
  hud.setInCar?.(cameraMode === 'cockpit');
  camera.updateProjectionMatrix();
  fitViewport();
  controls.enabled = cameraMode === 'showroom';
  if (controls.enabled) {
    camera.position.set(physics.x, 0, physics.z).addScaledVector(forward, -6).setY(vehicleGroundY() + 2.2);
    controls.target.set(physics.x, vehicleGroundY() + 0.45, physics.z);
    controls.update();
  }
}

// SUN RAYS (godrays.js): shafts of sunlight, blocked by buildings and the car
const godRays = new GodRays(renderer, scene, camera, { isMobile });

// ---------------------------------------------------------------------
// KEEP IT FITTING THE SCREEN when the window resizes or the phone rotates
// ---------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fitViewport();
});

// ---------------------------------------------------------------------
// MAIN LOOP: runs about 60 times a second
// read controls -> move the car -> update visuals -> draw
// ---------------------------------------------------------------------
const clock = new THREE.Clock();

// Smoke, sparks, dust and other see-through effects go on layer 1 too:
// they shouldn't cast black blobs into the sun rays
let effectsLayered = false;
function layerEffects() {
  scene.traverse((o) => { if (o.isPoints || o.isSprite) o.layers.set(1); });
  effectsLayered = true;
}

renderer.setAnimationLoop(() => {
  if (!effectsLayered) layerEffects();
  const dt = Math.min(clock.getDelta(), 0.05);   // avoid huge jumps after a pause

  if (wasTapped('camera')) switchCamera();
  if (wasTapped('reset')) {
    physics.reset();   // also repairs the engine
    placeAtStart();
    oil.clear();
    coolant.clear();
    coolantBurst = 0;
    debris.clear();
    shreds.clear();
    blowoutPending.length = 0;
    wheelOffPending.length = 0;
    for (const w of looseWheels) w.clear();
    flakes.clear();
    grassBits.clear();
    mudClumps.clear();
    clearDents();             // the body's straightened out and the scratches polished away
  }
  if (wasTapped('reverse')) physics.toggleReverse();
  if (wasTapped('shiftUp')) physics.shiftUp();
  if (wasTapped('shiftDown')) physics.shiftDown();
  if (wasTapped('mute')) engineSound.setMuted(!engineSound.muted);
  if (wasTapped('lights')) lightsSetting = (lightsSetting + 1) % 4;
  if (wasTapped('racingLine') && racing) {
    racingLineOn = !racingLineOn;
    racing.setVisible(racingLineOn);
    try { localStorage.setItem('tracktester-racingline', racingLineOn ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
  }
  if (racing) {
    // the plan's grip: the tyres fitted, less in the wet
    const gripNow = 1.3 * TYRES[physics.tyreCompound].grip * (1 - 0.3 * rain.wetness);
    racing.update(dt, physics.x, physics.z, physics.heading, Math.hypot(physics.vx, physics.vy), gripNow, rain.intensity);
    lapTimer.update(dt, physics.x, physics.z);
    trackMap.update(physics.x, physics.z, physics.heading);
  }
  // Auto: on when it gets dark or rains properly (off again a little later,
  // so they don't flicker at the changeover)
  if (lightsSetting === 1) {
    const dark = sky.daylight < (autoLightsOn ? 0.42 : 0.35);
    const wet = rain.intensity > (autoLightsOn ? 0.35 : 0.45);
    autoLightsOn = dark || wet;
  }
  const wantLights = [0, autoLightsOn ? 1 : 0, 1, 2][lightsSetting];
  if (wantLights !== lightsMode) setLights(wantLights);
  if (wasTapped('transmission')) {
    const next = TRANSMISSIONS[(TRANSMISSIONS.indexOf(physics.transmission) + 1) % TRANSMISSIONS.length];
    physics.setTransmission(next);
  }

  const input = readControls();
  // Fast cars move in smaller steps, so they can't skip through a thin
  // barrier between one frame and the next
  const stepSpeed = Math.hypot(physics.vx, physics.vy);
  const steps = Math.min(6, Math.max(1, Math.ceil(stepSpeed * dt / 0.3)));
  for (let k = 0; k < steps; k++) {
    if (tankMode) {
      // the tank drives itself (tank.js); the rest of the game reads it
      // through the car's physics, and walls push it through that too
      tankPhys.update(dt / steps, input, (x, z) => physics.surfaceGrip(x, z));
      Object.assign(physics, { x: tankPhys.x, z: tankPhys.z, heading: tankPhys.heading, vx: tankPhys.vx, vy: tankPhys.vy, yawRate: tankPhys.yawRate, rpm: tankPhys.rpm, engineLoad: input.throttle });
      collide(clock.elapsedTime);
      Object.assign(tankPhys, { x: physics.x, z: physics.z, vx: physics.vx, vy: physics.vy, yawRate: physics.yawRate });
    } else {
      physics.update(input, dt / steps);
      collide(clock.elapsedTime);
    }
  }
  engineSound.setHorn(input.horn);
  // Brake lights: bright while braking, dim red with the lights on
  carModel.tailLens.emissiveIntensity = input.brake > 0.05 ? 2.2 : lightsMode ? 0.6 : 0;

  // Gear change sounds
  while (physics.events.length) {
    const e = physics.events.shift();
    if (e.type === 'shift') {
      engineSound.playShift(physics.transmission === 'cvt' ? 'cvt' : e.style);
      cockpit.onShift(physics.transmission, e.direction);
    }
    if (e.type === 'grind') engineSound.playGrind();
    if (e.type === 'blown') {
      engineSound.playClunk();
      debrisPending = true;
    }
    if (e.type === 'blowout') {
      engineSound.playBlowout();
      blowoutPending.push(e.wheel);
    }
    if (e.type === 'wheelOff') wheelOffPending.push(e.wheel);
    if (e.type === 'coolantBurst') coolantBurst = Math.max(coolantBurst, 0.7 * e.strength);
    // landing hard on the bodywork (a rollover, a bad landing): a dent where it struck
    if (e.type === 'bodyHit' && e.speed > 4.5) {
      const [lx, ly, lz] = e.local;
      const depth = Math.min(0.2, (e.speed - 4) * 0.02), radius = 0.22 + Math.min(0.2, e.speed * 0.01);
      dents.push({ x: lx, y: Math.min(ly, 0.8), z: lz, dx: -Math.sign(lx) * 0.4, dy: ly > 0.6 ? -0.9 : 0, dz: -Math.sign(lz) * 0.4 * (Math.abs(lz) > 1 ? 1 : 0), depth, r: radius, seed: Math.random() * 100 });
      if (dents.length > 40) dents.shift();
      reshapeBody();
    }
  }

  // Move the car model to where the physics says it is
  // Lean the body onto any corner whose tyre is going down. The body is
  // rigid, so dropping one corner lifts the diagonally opposite wheel a little.
  fitBodyToTyres(dt);
  // ...and tilt it with the slope it's on (uphill: nose up; across a
  // slope: leaning with it). Eased a touch, as the ground is made of small
  // flat triangles.
  const GRD = physics.ground;
  const ease = 1 - Math.exp(-dt / 0.06);
  slopeView.pitch += (-Math.atan(GRD.slopeF) - slopeView.pitch) * ease;
  slopeView.roll += (Math.atan(GRD.slopeL) - slopeView.roll) * ease;
  if (tankMode) {
    // the tank sits on the ground, tilted with it (the hidden car follows, for the effects)
    carModel.car.position.set(tankPhys.x, tankPhys.y, tankPhys.z);
    carModel.car.rotation.set(tankPhys.pitch, tankPhys.heading, tankPhys.roll, 'YXZ');
  } else if (physics.air) {
    // flying, tipping or upside down: drawn exactly as the free 3D body is
    const P = physics.pose;
    carModel.car.position.set(P.x, P.y, P.z);
    carModel.car.quaternion.set(P.q[0], P.q[1], P.q[2], P.q[3]);
    slopeView.pitch = -Math.atan(GRD.slopeF); slopeView.roll = Math.atan(GRD.slopeL);
  } else {
    carModel.car.position.set(physics.x, GRD.y + bodyLean.heave, physics.z);
    carModel.car.rotation.set(bodyLean.pitch + slopeView.pitch, physics.heading, bodyLean.roll + slopeView.roll, 'YXZ');
  }
  updateWheels(physics.steer, physics.wheelSpin);
  // The tank (secret): sits where the car is, each track running at the
  // speed of its own side
  if (tankMode) {
    tank.group.position.copy(carModel.car.position);
    tank.group.quaternion.copy(carModel.car.quaternion);
    tank.update(dt, physics.vx - physics.yawRate * 0.88, physics.vx + physics.yawRate * 0.88);
    tank.setLights(lightsMode > 0);
    // the turret turns to face the mouse pointer
    if (mouseAim.moved) tank.aimAt(aimPoint(), dt);
    // black smoke when the throttle runs ahead of the turbo
    const thr = input.throttle || 0;
    dieselBoost += (thr * Math.min(1, tankPhys.rpm / 2700) - dieselBoost) * Math.min(1, dt / (thr > dieselBoost ? 0.7 : 0.35));
    const sooty = 0.12 + 0.25 * thr + 1.4 * Math.max(0, thr - dieselBoost);
    dieselSmoke.emitFrom('exhaust', tank.exhaust.getWorldPosition(exhaustWorld), Math.min(1, sooty), carVelocity, dt);
  }
  cockpit.update(dt, {
    steer: physics.steer, kick: physics.steerKick || 0, gear: physics.gear, transmission: physics.transmission,
    handbrake: !!input.handbrake, rpm: physics.rpm, redline: CATERHAM.redline,
    speedKmh: physics.speedKmh, lean: physics.yawRate * physics.vx,
    throttle: input.throttle, brake: input.brake, clutch: physics.clutchPedal, horn: !!input.horn,
  });
  cockpit.drawScreen(dt, {
    speedKmh: physics.speedKmh, rpm: physics.rpm, redline: CATERHAM.redline, gearLabel: physics.gearLabel,
    limiter: physics.limiter, fuel: physics.fuelLevel, oil: physics.oilLevel, tyres: physics.tyres,
    health: physics.engineHealth, tyreWindow: physics.tempWindow,
    coolant: physics.coolantTemp, fire: physics.onFire,
    hud: hud.parts,                 // the on-screen dashboard, copied onto the car's dash screen
  });
  updateSmoke(dt);
  releaseWheels();
  for (const w of looseWheels) w.update(dt);

  // Rain: follows the weather setting; wets and dries the track, fills
  // puddles, washes oil and rubber away, and brings lightning in a storm
  rain.setLevel(sky.rainLevel);
  updateWind(clock.elapsedTime);
  // (Sepang: tufts and stones grow wherever the camera is looking)
  if (SEPANG) {
    camera.getWorldDirection(viewDir);
    camera.getWorldPosition(viewAt);
    const halfView = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
    grass.update(viewAt.x, viewAt.z, viewDir.x, viewDir.z, halfView);
    stones.update(viewAt.x, viewAt.z, viewDir.x, viewDir.z, halfView);
  }
  rain.update(dt, camera, carVelocity, sky.daylight);
  physics.trackWetness = rain.wetness;
  rain.wetLook(ground.material, GROUND_DRY);
  oil.weather(dt, rain.intensity);
  coolant.weather(dt, rain.intensity);
  skids.weather(dt, rain.intensity);
  if (rain.flash > 0) sky.flash = Math.max(sky.flash ?? 0, rain.flash);
  if (rain.thunderNow) engineSound.playThunder?.(rain.thunderNow.strength);

  // The sky follows the car; the sun's shadow area sits ahead of it
  carSpot.set(physics.x, vehicleGroundY(), physics.z);
  sky.update(dt, carSpot, camera);
  placeShadows();
  // Eyes adjust to the dark: a little brighter overall at night
  renderer.toneMappingExposure = 1 + 0.55 * (1 - sky.daylight);

  updateCamera(dt);
  engineSound.update(physics, carPos);
  engineSound.setHiss(physics.tyreHiss);
  const carSpeed = Math.hypot(physics.vx, physics.vy);
  // A blown tyre grinds, more as it shreds down towards the rim
  const grinding = physics.tyres.reduce((m, t) => Math.max(m, t.blown && !t.rim ? 0.4 + 0.6 * t.shred : 0), 0);
  engineSound.setTyreFlap(grinding, carSpeed);
  // How hard the bare rims are sliding (front rims slide with the fronts, rear with the rears)
  let rimSlide = 0;
  physics.tyres.forEach((t, i) => {
    if (t.rim) rimSlide = Math.max(rimSlide, i < 2 ? Math.min(1, physics.tyreSlip.front * 2.5) : physics.tyreSlip.rear);
  });
  engineSound.setRimScrape(physics.rimsDown, carSpeed, rimSlide);
  // (the bodywork scraping along the ground after a rollover sounds like a dragging frame)
  engineSound.setFrameScrape?.(Math.max(physics.framesDown || 0, physics.air ? Math.min(2, physics.fb.scrape / 3) : 0), carSpeed);
  // ...and throws sparks off the tarmac
  if (physics.air && physics.fb.scrape > 1.5 && physics.fb.scrapeAt && surfaceAt(physics.fb.scrapeAt[0], physics.fb.scrapeAt[2]) !== 'grass') {
    bodySparks += Math.min(60, physics.fb.scrape * 6) * dt;
    const at = { x: physics.fb.scrapeAt[0], y: physics.fb.scrapeAt[1] + 0.05, z: physics.fb.scrapeAt[2] };
    while (bodySparks >= 1) { debris.spawnRimSpark(at, carVelocity, physics.heading); bodySparks -= 1; }
    debris.sparks.geometry.attributes.aSize.needsUpdate = true;
  }
  engineSound.setRain?.(rain.intensity, rain.wetness, carSpeed, puddleUnder);
  engineSound.setMud?.(mudUnder, carSpeed);

  hud.update({
    sky: { clock: sky.clock, hours: sky.hours, speed: sky.speed, locked: sky.locked,
           weather: sky.weather, changing: sky.changing, now: sky.weatherNow },
    lights: lightsMode,
    lightsAuto: lightsSetting === 1,
    warnings: {
      absOff: physics.assistLevel('abs') === 0,
      absWorking: physics.absActive,
      tcsOff: physics.assistLevel('tcs') === 0,
      tcsWorking: physics.tractionControl,
      skid: carSpeed > 5 && (Math.abs(Math.atan2(physics.vy, Math.abs(physics.vx) + 0.1)) > 0.12
        || physics.tyreSlip.rear > 0.35 || physics.tyreSlip.front > 0.5),
      handbrake: !!input.handbrake,
      coolant: physics.coolantTemp,
    },
    speedKmh: physics.speedKmh,
    rpm: physics.rpm,
    gearLabel: physics.gearLabel,
    limiter: physics.limiter,
    transmission: physics.transmission,
    engineHealth: physics.engineHealth,
    oilLevel: physics.oilLevel,
    fuelLevel: physics.fuelLevel,
    assists: physics.assists,
    clutchIn: physics.clutchIn,
    tyres: physics.tyres,
    tyreCompound: physics.tyreCompound,
    tyreWindow: physics.tempWindow,
    time: clock.elapsedTime,
  });
  touchUI?.update({ transmission: physics.transmission, gearLabel: physics.gearLabel, muted: engineSound.muted, lights: lightsSetting, racingLine: racing ? racingLineOn : null });

  if (cameraMode === 'cockpit') cockpit.renderMirrors(renderer, scene);
  renderer.render(scene, camera);
  godRays.render(sky.rays);
});
