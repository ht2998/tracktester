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
import { GrassPatch } from './grass.js';
import { SkySystem, TIME_SPEEDS } from './sky.js';
import { EngineDebris } from './debris.js';
import { TouchControls, isTouchDevice } from './touch.js';
import { startUpdates, BUILD as UPDATES_BUILD } from './updates.js';
import { GodRays, BUILD as GODRAYS_BUILD } from './godrays.js';
import { RainSystem } from './rain.js';
import { Cockpit, EYE } from './cockpit.js';
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
const BUILD = 3;

// What's new + the old-file check. (A file too old to have a stamp counts as 0.)
const updateScreen = startUpdates({
  'rendering.js': BUILD, 'updates.js': UPDATES_BUILD, 'godrays.js': GODRAYS_BUILD,
  'input.js': inputFile.BUILD, 'physics.js': physicsFile.BUILD, 'sound.js': soundFile.BUILD,
  'smoke.js': smokeFile.BUILD, 'hud.js': hudFile.BUILD, 'oil.js': oilFile.BUILD,
  'skids.js': skidsFile.BUILD, 'scenery.js': sceneryFile.BUILD, 'grass.js': grassFile.BUILD,
  'sky.js': skyFile.BUILD, 'debris.js': debrisFile.BUILD, 'touch.js': touchFile.BUILD,
  'rain.js': rainFile.BUILD, 'effects.js': effectsFile.BUILD, 'cockpit.js': cockpitFile.BUILD,
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
const sky = new SkySystem(scene, { sun, hemi: hemiLight, isMobile });

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
// GROUND: a big tarmac area
// ---------------------------------------------------------------------
const GROUND_DRY = { roughness: 0.95, colour: new THREE.Color(0x4a4d50) };   // rain darkens it and makes it shiny
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid lines help you feel your speed and see where you're sliding
const grid = new THREE.GridHelper(600, 300, 0x5d6166, 0x56595d);
grid.position.y = 0.002;
scene.add(grid);

// ---------------------------------------------------------------------
// GRAVEL TRAP: a 5 x 5 square patch (10 m x 10 m) ahead and to the right
// of the start. Loose, slippery and draggy, and the stones can puncture a
// tyre. Dirt tyres cope with it best.
// ---------------------------------------------------------------------
const GRAVEL = { minX: -16, maxX: -6, minZ: 6, maxZ: 16 };
function inGravel(x, z) {
  return x > GRAVEL.minX && x < GRAVEL.maxX && z > GRAVEL.minZ && z < GRAVEL.maxZ;
}

function buildGravel() {
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
  const shades = ['#9c8158', '#c9b086', '#a88d61', '#d8c39c', '#8a7350', '#bfa476', '#b39769'];
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

  const w = GRAVEL.maxX - GRAVEL.minX, d = GRAVEL.maxZ - GRAVEL.minZ;
  const colourMap = new THREE.CanvasTexture(colour);
  colourMap.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(height);
  for (const t of [colourMap, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / 3.5, d / 3.5);      // each tile is 3.5 m: stones about 1-3 cm
    t.anisotropy = 4;
  }
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
buildGravel();

// GRASS: a 5 x 5 square patch (10 m x 10 m) just past the gravel trap.
// Slippery and a bit draggy (see SURFACES.grass in physics.js); tyres
// press it flat and leave dark brown tracks.
const GRASS = { minX: -16, maxX: -6, minZ: 16, maxZ: 26 };
const grass = new GrassPatch(scene, GRASS, { tufts: isMobile ? 4500 : 9000 });

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
buildCones();

// Buildings, walls, barriers and fences (scenery.js). Their surfaces are
// registered for echoes once the sound is set up, further down.
const echoSurfaces = buildScenery(scene);

// ---------------------------------------------------------------------
// RAIN (rain.js): falling rain, a wet track that dries out afterwards,
// puddles that form in random places on the tarmac, and mud on the grass
// (which takes longer to form). Puddle spots are picked fresh each time the
// game loads, kept off the gravel, grass, buildings and walls.
// ---------------------------------------------------------------------
function pickPuddleSpots(count) {
  const blocked = [
    [-21, 0, -5, 27],      // gravel trap, grass patch, tyre wall and fence
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
  spots: {
    puddles: pickPuddleSpots(isMobile ? 12 : 18),
    // Mud: low spots in the grass patch
    mud: [
      { x: -12 + Math.random() * 2, z: 19.5 + Math.random() * 2, r: 1.7, start: 0 },
      { x: -8.4, z: 23.6, r: 1.2, start: 0.2 },
      { x: -14.2, z: 24.6, r: 1.0, start: 0.4 },
    ],
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
  rim: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.25 }),
  spoke: new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.7, roughness: 0.35 }),
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

function buildCar() {
  const car = new THREE.Group();

  // --- Main body tub ---
  car.add(part(new THREE.BoxGeometry(0.9, 0.5, 1.9), MAT.paint, 0, 0.4, -0.35));

  // --- Long nose (aluminium, like a classic Seven) ---
  car.add(part(new THREE.BoxGeometry(0.62, 0.34, 0.9), MAT.aluminium, 0, 0.38, 1.05));
  // Grille at the very front
  car.add(part(new THREE.BoxGeometry(0.5, 0.26, 0.02), MAT.black, 0, 0.38, 1.505));

  // --- Bonnet top between cockpit and nose ---
  car.add(part(new THREE.BoxGeometry(0.62, 0.04, 0.5), MAT.aluminium, 0, 0.56, 0.5));

  // --- Cockpit opening and seats ---
  car.add(part(new THREE.BoxGeometry(0.76, 0.02, 0.85), MAT.interior, 0, 0.651, -0.25));
  // (the seats, steering wheel, levers, mirrors and the driver are in cockpit.js)

  // --- Windscreen ---
  const screen = part(new THREE.PlaneGeometry(0.82, 0.26), MAT.glass, 0, 0.78, 0.22);
  screen.rotation.x = -0.25;
  screen.castShadow = false;
  car.add(screen);

  // --- Roll bar behind the seats ---
  const barSide = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10);
  car.add(part(barSide, MAT.chrome, -0.33, 0.86, -0.75));
  car.add(part(barSide, MAT.chrome, 0.33, 0.86, -0.75));
  const barTop = part(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 10), MAT.chrome, 0, 1.07, -0.75);
  barTop.rotation.z = Math.PI / 2;
  car.add(barTop);

  // --- Rear wings (fenders over the back wheels) ---
  const rearWing = new THREE.BoxGeometry(0.3, 0.06, 0.8);
  car.add(part(rearWing, MAT.paint, -0.62, 0.64, -1.1));
  car.add(part(rearWing, MAT.paint, 0.62, 0.64, -1.1));
  const rearWingSide = new THREE.BoxGeometry(0.3, 0.25, 0.06);
  car.add(part(rearWingSide, MAT.paint, -0.62, 0.52, -1.48));
  car.add(part(rearWingSide, MAT.paint, 0.62, 0.52, -1.48));

  // --- Front cycle wings (curved fenders over the front wheels) ---
  const cycleWing = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 20, 1, true, 0.25, 2.3);
  cycleWing.rotateZ(Math.PI / 2);
  car.add(part(cycleWing, fenderMat, -TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE));
  car.add(part(cycleWing, fenderMat, TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE));

  // --- Headlights on stalks ---
  const lampBody = new THREE.SphereGeometry(0.09, 16, 12);
  const lampLens = new THREE.CircleGeometry(0.075, 16);
  const headLens = MAT.lens.clone();           // its own, so it can glow when switched on
  for (const side of [-1, 1]) {
    car.add(part(lampBody, MAT.chrome, side * 0.42, 0.64, 1.22));
    car.add(part(lampLens, headLens, side * 0.42, 0.64, 1.311));
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
  }

  // --- Side exhaust ---
  const exhaust = part(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12), MAT.chrome, 0.5, 0.3, -0.45);
  exhaust.rotation.x = Math.PI / 2;
  car.add(exhaust);

  // --- Suspension: double wishbones, uprights, dampers, tie rods, driveshafts ---
  // Every rod links a point on the body to a point on the wheel's upright,
  // so the wheels are properly attached instead of floating.
  const arms = [];
  const dampers = [];
  for (const s of [-1, 1]) {
    const F = FRONT_AXLE;
    const R = REAR_AXLE;

    // Front lower wishbone (two legs meeting at the upright)
    arms.push([[s * 0.30, 0.22, F + 0.18], [s * 0.56, 0.24, F], 0.014]);
    arms.push([[s * 0.30, 0.22, F - 0.18], [s * 0.56, 0.24, F], 0.014]);
    // Front upper wishbone
    arms.push([[s * 0.30, 0.47, F + 0.14], [s * 0.54, 0.42, F], 0.012]);
    arms.push([[s * 0.30, 0.47, F - 0.14], [s * 0.54, 0.42, F], 0.012]);
    // Front upright (joins the wishbone ends, carries the wheel)
    arms.push([[s * 0.56, 0.24, F], [s * 0.54, 0.42, F], 0.022]);
    // Steering tie rod
    arms.push([[s * 0.30, 0.30, F - 0.12], [s * 0.55, 0.31, F - 0.10], 0.010]);
    // Front coil-over damper (lower wishbone up to the chassis)
    dampers.push([[s * 0.48, 0.24, F + 0.02], [s * 0.31, 0.53, F + 0.08], 0.03]);

    // Rear lower wishbone
    arms.push([[s * 0.44, 0.20, R + 0.20], [s * 0.56, 0.22, R], 0.014]);
    arms.push([[s * 0.44, 0.20, R - 0.20], [s * 0.56, 0.22, R], 0.014]);
    // Rear upper wishbone
    arms.push([[s * 0.44, 0.45, R + 0.15], [s * 0.55, 0.42, R], 0.012]);
    arms.push([[s * 0.44, 0.45, R - 0.15], [s * 0.55, 0.42, R], 0.012]);
    // Rear upright
    arms.push([[s * 0.56, 0.22, R], [s * 0.55, 0.42, R], 0.022]);
    // Driveshaft from the differential to the wheel
    arms.push([[s * 0.40, 0.30, R], [s * 0.57, 0.30, R], 0.028]);
    // Rear coil-over damper
    dampers.push([[s * 0.52, 0.23, R + 0.06], [s * 0.45, 0.58, R + 0.12], 0.03]);
  }
  car.add(rodSet(arms, MAT.arm));
  car.add(rodSet(dampers, MAT.damper));

  // --- Wheels: drawn with INSTANCING ---
  // One tyre, rim and spoke model, each drawn several times in a single step.
  const tyreGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 28);
  tyreGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(WHEEL_RADIUS * 0.62, WHEEL_RADIUS * 0.62, WHEEL_WIDTH + 0.01, 20);
  rimGeo.rotateZ(Math.PI / 2);
  // Spokes across the rim, so you can see the wheels turning
  const spokeGeo = new THREE.BoxGeometry(WHEEL_WIDTH + 0.02, 0.035, WHEEL_RADIUS * 1.2);

  const tyres = new THREE.InstancedMesh(tyreGeo, MAT.tyre, 4);
  const rims = new THREE.InstancedMesh(rimGeo, MAT.rim, 4);
  const spokes = new THREE.InstancedMesh(spokeGeo, MAT.spoke, 8);
  for (const mesh of [tyres, rims, spokes]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // updated every frame
    car.add(mesh);
  }

  return { car, tyres, rims, spokes, headLens, beam, tailLens };
}

const carModel = buildCar();
// The cockpit and the driver (cockpit.js)
const cockpit = new Cockpit(carModel.car, MAT, { isMobile });

// HEADLIGHTS: G cycles off -> dipped -> main beam. Dipped lights the road
// close ahead; main beam reaches much further.
let lightsMode = 0;
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

// Which physics tyre (FL, FR, RL, RR) each drawn wheel is (+x is the car's left)
const physicsWheel = (x, isFront) => (isFront ? 0 : 2) + (x > 0 ? 0 : 1);
const tyreSquash = [1, 1, 1, 1];   // per physics tyre: 1 = round, lower = squashed flat
const squashMatrix = new THREE.Matrix4();
const spinMatrix = new THREE.Matrix4();

function updateWheels(steer, spin) {
  WHEELS.forEach(([x, y, z, isFront], i) => {
    wheelPos.set(x, y, z);
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
      carModel.tyres.setMatrixAt(i, HIDDEN);
      carModel.rims.setMatrixAt(i, HIDDEN);
      carModel.spokes.setMatrixAt(i * 2, HIDDEN);
      carModel.spokes.setMatrixAt(i * 2 + 1, HIDDEN);
      return;
    }
    // A bare rim grinds down: smaller and smaller as it wears
    const pi = physicsWheel(x, isFront);
    const rimScale = tyre.rim ? Math.min(1, (WHEEL_RADIUS - physics.tyreSink[pi]) / (WHEEL_RADIUS * 0.62)) : 1;
    wheelScale.set(1, rimScale, rimScale);
    for (let k = 0; k < 2; k++) {
      wheelEuler.set(spin + k * Math.PI / 2, isFront ? steer : 0, 0);
      wheelRot.setFromEuler(wheelEuler);
      wheelMatrix.compose(wheelPos, wheelRot, wheelScale);
      if (k === 0) {
        spinMatrix.makeRotationFromQuaternion(wheelRot);
        squashMatrix.makeScale((1 + bulge * 0.35) * (tyre.blown ? 1 + (Math.random() - 0.5) * 0.15 : 1),
          sy * shrink, (1 + bulge * 0.6) * shrink).multiply(spinMatrix);
        squashMatrix.setPosition(x, y + WHEEL_RADIUS * (1 - sy * shrink), z);
        carModel.tyres.setMatrixAt(i, squashMatrix);
        carModel.rims.setMatrixAt(i, wheelMatrix);
      }
      carModel.spokes.setMatrixAt(i * 2 + k, wheelMatrix);
    }
  });
  carModel.tyres.instanceMatrix.needsUpdate = true;
  carModel.rims.instanceMatrix.needsUpdate = true;
  carModel.spokes.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------------
// BODY LEAN on deflated tyres
// Each corner wants its hub at (tyre radius - how far that tyre has sunk).
// A rigid body can't follow four separate heights, so it settles on the
// best-fitting plane: the low corner drops, and the opposite wheel lifts.
// ---------------------------------------------------------------------
const bodyLean = { heave: 0, roll: 0, pitch: 0 };
const HUB_X = [TRACK_HALF, -TRACK_HALF, TRACK_HALF, -TRACK_HALF];   // FL FR RL RR (+x = left)
const HUB_Z = [FRONT_AXLE, FRONT_AXLE, REAR_AXLE, REAR_AXLE];

function fitBodyToTyres(dt) {
  const hub = physics.tyreSink.map((sink) => WHEEL_RADIUS - sink);
  const mean = hub.reduce((a, b) => a + b, 0) / 4;
  let sx = 0, sz = 0, xx = 0, zz = 0;
  for (let i = 0; i < 4; i++) {
    sx += hub[i] * HUB_X[i]; xx += HUB_X[i] * HUB_X[i];
    sz += (hub[i] - mean) * HUB_Z[i]; zz += HUB_Z[i] * HUB_Z[i];
  }
  const b = sx / xx;          // height change per metre to the left
  const c = sz / zz;          // height change per metre forwards
  const k = Math.min(1, 10 * dt);   // settle smoothly
  bodyLean.heave += (mean - WHEEL_RADIUS - bodyLean.heave) * k;
  bodyLean.roll += (Math.atan(b) - bodyLean.roll) * k;
  bodyLean.pitch += (-Math.atan(c) - bodyLean.pitch) * k;
  // Where each hub ends up, and so how squashed each tyre must be to reach the road
  for (let i = 0; i < 4; i++) {
    const hubHeight = mean + b * HUB_X[i] + c * HUB_Z[i];
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
      // The wheel has come off: that corner's frame scrapes along the road,
      // throwing a thick shower of sparks (fewer on a wet road)
      if (speed > 0.3) {
        behindWheel.set(HUB_X[i] * 0.85, 0, HUB_Z[i] - 0.1);
        carModel.car.localToWorld(behindWheel);
        sparkCarry[i] += (40 + 90 * Math.min(1, speed / 15)) * (1 - 0.5 * rain.wetness) * dt;
        while (sparkCarry[i] >= 1) {
          debris.spawnRimSpark(behindWheel, carVelocity, physics.heading);
          sparkCarry[i] -= 1;
          sparked = true;
        }
      }
    } else if (t.rim && speed > 0.3) {
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

// Oil dripped by a badly damaged engine. Tyres on oil lose grip.
const oil = new OilSlicks(scene);
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
const surfaceAt = (x, z) => (inGravel(x, z) ? 'gravel' : grass.contains(x, z) ? 'grass' : 'tarmac');
const dirtTyres = () => TYRES[physics.tyreCompound].kind === 'dirt';
// In the wet: how much grip each kind of tyre keeps on a soaked track, and
// how easily it aquaplanes in standing water (deep tread clears the water;
// smooth slicks float on it)
const WET_GRIP = { road: 0.7, slick: 0.5, wet: 0.88, dirt: 0.75, snow: 0.8 };
const AQUAPLANE = { road: 0.75, slick: 0.92, wet: 0.35, dirt: 0.55, snow: 0.5 };
const tyreKind = () => TYRES[physics.tyreCompound].kind;
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
  // Wet tarmac: full wet tyres (W) grip best of all; intermediates nearly as well
  let wetGrip = WET_GRIP[kind];
  if (physics.tyreCompound === 'W') wetGrip = 0.96;
  let g = 1 - (1 - wetGrip) * wet;
  // Aquaplaning: in a puddle at speed the tyre rides up on the water
  const puddle = rain.puddleAt(x, z);
  if (puddle > 0) {
    const speed = Math.hypot(physics.vx, physics.vy);
    const lift = puddle * THREE.MathUtils.smoothstep(speed, 12, 32) * (physics.tyreCompound === 'W' ? 0.22 : AQUAPLANE[kind]);
    g *= 1 - 0.85 * lift - 0.08 * puddle;
  }
  const onOil = oil.gripAt(x, z);
  return g * (onOil < 1 ? onOil : skids.gripAt(x, z));
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
physics.wearScale = () => {
  const wet = rain.wetness;
  return tyreKind() === 'wet' ? 1.4 - 1.0 * wet : 1 - 0.3 * wet;
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
// Bits flung by the tyres: grass clippings, and clumps of mud
const grassBits = new FlyingBits(scene, {
  max: isMobile ? 160 : 300, colours: [0x4f7a2c, 0x5d8a33, 0x3f6524, 0x6e9440], size: [0.025, 0.06], flat: true,
});
const mudClumps = new FlyingBits(scene, {
  max: isMobile ? 90 : 160, colours: [0x3b2a1a, 0x4a3522, 0x2f2215], size: [0.02, 0.05], flat: false,
});
// Glittery metal shavings ground off a bare rim
const flakes = new MetalFlakes(scene, { max: isMobile ? 900 : 1600 });
// A wheel that has come off (one per corner)
const looseWheels = [0, 1, 2, 3].map(() => new LooseWheel(scene, {
  rimGeo: carModel.rims.geometry, spokeGeo: carModel.spokes.geometry,
  rimMat: carModel.rims.material, spokeMat: carModel.spokes.material,
  radius: WHEEL_RADIUS * 0.62,
}));
const ENGINE_BAY = new THREE.Vector3(0, 0.62, 0.95);

// Sparks and flying metal when the engine blows
const debris = new EngineDebris(scene, { maxSparks: isMobile ? 140 : 220, chunkCount: isMobile ? 8 : 12 });
debris.setViewport(renderer.domElement.height, camera.fov);
let debrisPending = false;   // set when the engine blows, fired once the engine bay position is known
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
    const kick = Math.min(1, Math.min(1, speed / 18) * 0.45 + skid * 0.8);
    dust.emitFrom(p.id, smokeWorld, p.onGravel ? kick * (1 - 0.85 * rain.wetness) : 0, carVelocity, dt);
    // Wet tarmac: spray off the back of the tyre, much more through a puddle
    const puddle = p.onGravel || p.onGrass ? 0 : rain.puddleAt(smokeWorld.x, smokeWorld.z);
    puddleUnder += puddle / 4;
    const fast = Math.min(1, speed / 22);
    const sprayAmount = p.onGravel || p.onGrass || tyre.detached ? 0
      : Math.min(1, fast * (0.55 * rain.wetness * smoothWet + 1.6 * puddle) + 0.3 * skid * rain.wetness);
    spray.emitFrom(p.id, smokeWorld, sprayAmount, carVelocity, dt);
    // Grass: clippings and brown dust when dry; brown spray when wet, worse in mud
    const churn = p.onGrass && !tyre.detached ? Math.min(1, Math.min(1, speed / 15) * 0.5 + skid) : 0;
    const mud = p.onGrass ? rain.mudAt(smokeWorld.x, smokeWorld.z) : 0;
    grassDust.emitFrom(p.id, smokeWorld, churn * 0.8 * (1 - rain.wetness), carVelocity, dt);
    mudSpray.emitFrom(p.id, smokeWorld, Math.min(1, churn * (0.7 * rain.wetness + 1.2 * mud)), carVelocity, dt);
    grassBits.emit(p.id, smokeWorld, carVelocity, churn * (1 - 0.6 * mud), 40, dt);
    mudClumps.emit(p.id, smokeWorld, carVelocity, churn * Math.min(1, mud * 1.5 + 0.3 * rain.wetness), 30, dt);
  }
  smoke.update(dt);
  dust.update(dt);
  spray.update(dt);
  grassDust.update(dt);
  mudSpray.update(dt);
  grassBits.update(dt);
  mudClumps.update(dt);

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
  engineSmoke.emitFrom('engine', engineBayWorld, physics.engineBlown ? 1 : 0, carVelocity, dt);
  engineSmoke.update(dt);

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
  oil.update(dt, physics.x, physics.z, physics.heading, physics.vx, leakRate);
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
  onTyres: (id) => physics.setTyres(id),
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
  carPos.set(physics.x, 0, physics.z);
  forward.set(Math.sin(physics.heading), 0, Math.cos(physics.heading));

  if (cameraMode === 'chase' || cameraMode === 'close') {
    // Sit behind and above the car, catching up smoothly
    const close = cameraMode === 'close';
    desiredCam.copy(carPos).addScaledVector(forward, close ? -4.1 : -6.5);
    desiredCam.y = close ? 1.45 : 2.4;
    camera.position.lerp(desiredCam, 1 - Math.exp((close ? -9 : -6) * dt));
    lookTarget.copy(carPos).addScaledVector(forward, close ? 3 : 2.5);
    lookTarget.y = close ? 0.6 : 0.7;
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
    camera.position.copy(mount.spot);
    carModel.car.localToWorld(camera.position);
    carModel.car.getWorldQuaternion(carTurn);
    lookEuler.set(mount.pitch + look.pitch, Math.PI + look.yaw, 0);   // the camera looks along -z; the car faces +z
    camera.quaternion.copy(carTurn).multiply(lookTurn.setFromEuler(lookEuler));
  } else {
    // Showroom: orbit around the car and move along with it, never below the ground
    camera.position.add(carPos).sub(lastCarPos);
    controls.target.set(carPos.x, 0.45, carPos.z);
    controls.update();
    if (camera.position.y < 0.15) {
      camera.position.y = 0.15;
      camera.lookAt(controls.target);
    }
  }
  lastCarPos.copy(carPos);
}

// Particles and the sun rays size themselves to the screen and the view angle
function fitViewport() {
  smoke.setViewport(renderer.domElement.height, camera.fov);
  engineSmoke.setViewport(renderer.domElement.height, camera.fov);
  dust.setViewport(renderer.domElement.height, camera.fov);
  for (const fx of [spray, grassDust, mudSpray]) fx.setViewport(renderer.domElement.height, camera.fov);
  debris.setViewport(renderer.domElement.height, camera.fov);
  godRays.resize();
}

function switchCamera() {
  cameraMode = CAMERA_MODES[(CAMERA_MODES.indexOf(cameraMode) + 1) % CAMERA_MODES.length];
  look.yaw = look.pitch = 0;
  camera.fov = CAMERA_FOV[cameraMode];
  camera.near = ON_CAR[cameraMode]?.near ?? 0.1;
  cockpit.setFirstPerson(cameraMode === 'cockpit');
  camera.updateProjectionMatrix();
  fitViewport();
  controls.enabled = cameraMode === 'showroom';
  if (controls.enabled) {
    camera.position.set(physics.x, 0, physics.z).addScaledVector(forward, -6).setY(2.2);
    controls.target.set(physics.x, 0.45, physics.z);
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
    oil.clear();
    debris.clear();
    shreds.clear();
    blowoutPending.length = 0;
    wheelOffPending.length = 0;
    for (const w of looseWheels) w.clear();
    flakes.clear();
    grassBits.clear();
    mudClumps.clear();
  }
  if (wasTapped('reverse')) physics.toggleReverse();
  if (wasTapped('shiftUp')) physics.shiftUp();
  if (wasTapped('shiftDown')) physics.shiftDown();
  if (wasTapped('mute')) engineSound.setMuted(!engineSound.muted);
  if (wasTapped('lights')) setLights((lightsMode + 1) % 3);
  if (wasTapped('transmission')) {
    const next = TRANSMISSIONS[(TRANSMISSIONS.indexOf(physics.transmission) + 1) % TRANSMISSIONS.length];
    physics.setTransmission(next);
  }

  const input = readControls();
  physics.update(input, dt);
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
  }

  // Move the car model to where the physics says it is
  // Lean the body onto any corner whose tyre is going down. The body is
  // rigid, so dropping one corner lifts the diagonally opposite wheel a little.
  fitBodyToTyres(dt);
  carModel.car.position.set(physics.x, bodyLean.heave, physics.z);
  carModel.car.rotation.set(bodyLean.pitch, physics.heading, bodyLean.roll, 'YXZ');
  updateWheels(physics.steer, physics.wheelSpin);
  cockpit.update(dt, {
    steer: physics.steer, gear: physics.gear, transmission: physics.transmission,
    handbrake: !!input.handbrake, rpm: physics.rpm, redline: CATERHAM.redline,
    speedKmh: physics.speedKmh, lean: physics.yawRate * physics.vx,
  });
  updateSmoke(dt);
  releaseWheels();
  for (const w of looseWheels) w.update(dt);

  // Rain: follows the weather setting; wets and dries the track, fills
  // puddles, washes oil and rubber away, and brings lightning in a storm
  rain.setLevel(sky.rainLevel);
  rain.update(dt, camera, carVelocity, sky.daylight);
  rain.wetLook(ground.material, GROUND_DRY);
  oil.weather(dt, rain.intensity);
  skids.weather(dt, rain.intensity);
  if (rain.flash > 0) sky.flash = Math.max(sky.flash ?? 0, rain.flash);
  if (rain.thunderNow) engineSound.playThunder?.(rain.thunderNow.strength);

  // The sky follows the car; the sun's shadow area sits ahead of it
  carSpot.set(physics.x, 0, physics.z);
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
  engineSound.setFrameScrape?.(physics.framesDown, carSpeed);
  engineSound.setRain?.(rain.intensity, rain.wetness, carSpeed, puddleUnder);

  hud.update({
    sky: { clock: sky.clock, hours: sky.hours, speed: sky.speed, locked: sky.locked,
           weather: sky.weather, changing: sky.changing, now: sky.weatherNow },
    lights: lightsMode,
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
    time: clock.elapsedTime,
  });
  touchUI?.update({ transmission: physics.transmission, gearLabel: physics.gearLabel, muted: engineSound.muted, lights: lightsMode });

  if (cameraMode === 'cockpit') cockpit.renderMirrors(renderer, scene);
  renderer.render(scene, camera);
  godRays.render(sky.rays);
});
