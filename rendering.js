// =====================================================================
// RENDERING: sets up the 3D scene, lighting, cameras and the test car,
// and runs the main loop that drives everything each frame.
// Track Tester - phase 1
// =====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { readControls, wasTapped } from './input.js';
import { CarPhysics, CATERHAM, TRANSMISSIONS } from './physics.js';
import { EngineSound } from './sound.js';
import { TyreSmoke } from './smoke.js';
import { Hud } from './hud.js';
import { OilSlicks } from './oil.js';

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;      // smooth, gliding movement
controls.enablePan = false;         // keep the camera always circling the car
controls.minDistance = 2.5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.48; // stops the camera going under the ground
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
sun.shadow.camera.left = -8;
sun.shadow.camera.right = 8;
sun.shadow.camera.top = 8;
sun.shadow.camera.bottom = -8;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 30;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(sun.target);

// ---------------------------------------------------------------------
// GROUND: a big tarmac area
// ---------------------------------------------------------------------
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
  car.add(part(new THREE.BoxGeometry(0.3, 0.35, 0.08), MAT.interior, -0.18, 0.8, -0.62)); // seat backs
  car.add(part(new THREE.BoxGeometry(0.3, 0.35, 0.08), MAT.interior, 0.18, 0.8, -0.62));

  // --- Small steering wheel (right-hand drive) ---
  const steering = part(new THREE.TorusGeometry(0.13, 0.015, 8, 24), MAT.black, -0.18, 0.82, 0.05);
  steering.rotation.x = -0.35;
  car.add(steering);

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
  for (const side of [-1, 1]) {
    car.add(part(lampBody, MAT.chrome, side * 0.42, 0.64, 1.22));
    car.add(part(lampLens, MAT.lens, side * 0.42, 0.64, 1.311));
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

  return { car, tyres, rims, spokes };
}

const carModel = buildCar();
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
const ONE = new THREE.Vector3(1, 1, 1);

function updateWheels(steer, spin) {
  WHEELS.forEach(([x, y, z, isFront], i) => {
    wheelPos.set(x, y, z);
    for (let k = 0; k < 2; k++) {
      wheelEuler.set(spin + k * Math.PI / 2, isFront ? steer : 0, 0);
      wheelRot.setFromEuler(wheelEuler);
      wheelMatrix.compose(wheelPos, wheelRot, ONE);
      if (k === 0) {
        carModel.tyres.setMatrixAt(i, wheelMatrix);
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
// DRIVING
// ---------------------------------------------------------------------
const physics = new CarPhysics();

// Oil dripped by a badly damaged engine. Tyres on oil lose grip.
const oil = new OilSlicks(scene);
physics.surfaceGrip = (x, z) => oil.gripAt(x, z);

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
const ENGINE_BAY = new THREE.Vector3(0, 0.62, 0.95);
const engineBayWorld = new THREE.Vector3();

const SMOKE_POINTS = [
  { id: 'rl', local: new THREE.Vector3(-TRACK_HALF, 0.12, REAR_AXLE), axle: 'rear' },
  { id: 'rr', local: new THREE.Vector3(TRACK_HALF, 0.12, REAR_AXLE), axle: 'rear' },
  { id: 'fl', local: new THREE.Vector3(-TRACK_HALF, 0.12, FRONT_AXLE), axle: 'front' },
  { id: 'fr', local: new THREE.Vector3(TRACK_HALF, 0.12, FRONT_AXLE), axle: 'front' },
];
const smokeWorld = new THREE.Vector3();
const carVelocity = new THREE.Vector3();

function updateSmoke(dt) {
  const sin = Math.sin(physics.heading);
  const cos = Math.cos(physics.heading);
  carVelocity.set(sin * physics.vx + cos * physics.vy, 0, cos * physics.vx - sin * physics.vy);
  carModel.car.updateMatrixWorld();
  for (const p of SMOKE_POINTS) {
    smokeWorld.copy(p.local);
    carModel.car.localToWorld(smokeWorld);
    smoke.emitFrom(p.id, smokeWorld, physics.tyreSlip[p.axle], carVelocity, dt);
  }
  smoke.update(dt);

  // Engine smoke: pours out once blown
  engineBayWorld.copy(ENGINE_BAY);
  carModel.car.localToWorld(engineBayWorld);
  engineSmoke.emitFrom('engine', engineBayWorld, physics.engineBlown ? 1 : 0, carVelocity, dt);
  engineSmoke.update(dt);

  // Oil: drips below 10% health, pours once the engine has blown
  // (stops once the oil has all run out: there's nothing left to leak)
  const leakRate = !physics.leakingOil ? 0 : physics.engineBlown ? 2 : 1;
  oil.update(dt, physics.x, physics.z, physics.heading, physics.vx, leakRate);
}

// ---------------------------------------------------------------------
// SOUND
// Browsers block sound until the player interacts, so it starts on the
// first key press or tap. Big scenery is registered for echoes with
// engineSound.echo.addReflector(object) once tracks have buildings.
// ---------------------------------------------------------------------
const engineSound = new EngineSound(CATERHAM);
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
  'Space: handbrake · Q / E or , / . : shift down / up<br>' +
  'Reverse: Q from 1st (manual), R (auto, CVT)<br>' +
  'T: gearbox<br>' +
  'M: mute · C: camera · Backspace: reset<br>' +
  '<span id="soundhint" style="color:#ffd76a">Press any key or tap for sound</span>';
const soundHint = document.getElementById('soundhint');

// Dashboard: rev counter, speedometer with shift lights, gearbox tab
const hud = new Hud({
  redline: CATERHAM.redline,
  onTransmission: (name) => physics.setTransmission(name),
});

// ---------------------------------------------------------------------
// CAMERAS: chase camera behind the car, or showroom orbit (press C)
// ---------------------------------------------------------------------
let cameraMode = 'chase';
const carPos = new THREE.Vector3();
const lastCarPos = new THREE.Vector3();
const forward = new THREE.Vector3();
const desiredCam = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function updateCamera(dt) {
  carPos.set(physics.x, 0, physics.z);
  forward.set(Math.sin(physics.heading), 0, Math.cos(physics.heading));

  if (cameraMode === 'chase') {
    // Sit behind and above the car, catching up smoothly
    desiredCam.copy(carPos).addScaledVector(forward, -6.5);
    desiredCam.y = 2.4;
    camera.position.lerp(desiredCam, 1 - Math.exp(-6 * dt));
    lookTarget.copy(carPos).addScaledVector(forward, 2.5);
    lookTarget.y = 0.7;
    camera.lookAt(lookTarget);
  } else {
    // Showroom: orbit around the car and move along with it
    camera.position.add(carPos).sub(lastCarPos);
    controls.target.set(carPos.x, 0.45, carPos.z);
    controls.update();
  }
  lastCarPos.copy(carPos);
}

function switchCamera() {
  cameraMode = cameraMode === 'chase' ? 'showroom' : 'chase';
  controls.enabled = cameraMode === 'showroom';
  if (controls.enabled) {
    controls.target.set(physics.x, 0.45, physics.z);
    controls.update();
  }
}

// ---------------------------------------------------------------------
// KEEP IT FITTING THE SCREEN when the window resizes or the phone rotates
// ---------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  smoke.setViewport(renderer.domElement.height, camera.fov);
  engineSmoke.setViewport(renderer.domElement.height, camera.fov);
});

// ---------------------------------------------------------------------
// MAIN LOOP: runs about 60 times a second
// read controls -> move the car -> update visuals -> draw
// ---------------------------------------------------------------------
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);   // avoid huge jumps after a pause

  if (wasTapped('camera')) switchCamera();
  if (wasTapped('reset')) {
    physics.reset();   // also repairs the engine
    oil.clear();
  }
  if (wasTapped('reverse')) physics.toggleReverse();
  if (wasTapped('shiftUp')) physics.shiftUp();
  if (wasTapped('shiftDown')) physics.shiftDown();
  if (wasTapped('mute')) engineSound.setMuted(!engineSound.muted);
  if (wasTapped('transmission')) {
    const next = TRANSMISSIONS[(TRANSMISSIONS.indexOf(physics.transmission) + 1) % TRANSMISSIONS.length];
    physics.setTransmission(next);
  }

  physics.update(readControls(), dt);

  // Gear change sounds
  while (physics.events.length) {
    const e = physics.events.shift();
    if (e.type === 'shift') engineSound.playShift(physics.transmission === 'cvt' ? 'cvt' : e.style);
    if (e.type === 'grind') engineSound.playGrind();
    if (e.type === 'blown') engineSound.playClunk();
  }

  // Move the car model to where the physics says it is
  carModel.car.position.set(physics.x, 0, physics.z);
  carModel.car.rotation.y = physics.heading;
  updateWheels(physics.steer, physics.wheelSpin);
  updateSmoke(dt);

  // Keep the sun's shadow area centred on the car
  sun.target.position.set(physics.x, 0, physics.z);
  sun.position.set(physics.x, 0, physics.z).add(SUN_OFFSET);

  updateCamera(dt);
  engineSound.update(physics, carPos);

  hud.update({
    speedKmh: physics.speedKmh,
    rpm: physics.rpm,
    gearLabel: physics.gearLabel,
    limiter: physics.limiter,
    transmission: physics.transmission,
    engineHealth: physics.engineHealth,
    oilLevel: physics.oilLevel,
    time: clock.elapsedTime,
  });

  renderer.render(scene, camera);
});
