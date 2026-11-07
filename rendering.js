// =====================================================================
// RENDERING: sets up the 3D scene, lighting, camera and a test car.
// Track Tester - phase 1
// =====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------
// QUALITY SETTINGS
// Phones get lighter settings so they stay smooth and don't overheat.
// ---------------------------------------------------------------------
const isMobile = window.matchMedia('(pointer: coarse)').matches;

const QUALITY = {
  pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
  shadowMapSize: isMobile ? 1024 : 2048,
  antialias: !isMobile,
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
scene.fog = new THREE.Fog(0x9ec9ef, 30, 120);   // distant things fade into the sky

// Reflections: gives the car paint and metal something to reflect
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------------------------------------------------------------------
// CAMERA + CONTROLS
// ---------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(4.5, 2.2, 5.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;      // smooth, gliding movement
controls.enablePan = false;         // keep the camera always circling the car
controls.minDistance = 2.5;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.48; // stops the camera going under the ground
controls.update();

// ---------------------------------------------------------------------
// LIGHTING
// ---------------------------------------------------------------------
// Soft light from the sky above and the ground below
const hemiLight = new THREE.HemisphereLight(0xdbeeff, 0x5a5040, 0.6);
scene.add(hemiLight);

// The sun: bright, directional, and casts shadows
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
sun.position.set(6, 10, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize);
sun.shadow.camera.left = -6;
sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 30;
sun.shadow.bias = -0.0005;
scene.add(sun);

// ---------------------------------------------------------------------
// GROUND: a simple tarmac pad
// ---------------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Faint grid lines to help judge size and movement
const grid = new THREE.GridHelper(300, 150, 0x5d6166, 0x56595d);
grid.position.y = 0.002;
scene.add(grid);

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
// The front of the car points along +z.
// ---------------------------------------------------------------------
function part(geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildCar() {
  const car = new THREE.Group();

  // Size reference (metres)
  const WHEEL_RADIUS = 0.3;
  const WHEEL_WIDTH = 0.2;
  const TRACK_HALF = 0.68;   // half the distance between left and right wheels
  const FRONT_AXLE = 1.1;
  const REAR_AXLE = -1.1;

  // --- Main body tub ---
  car.add(part(new THREE.BoxGeometry(0.9, 0.5, 1.9), MAT.paint, 0, 0.4, -0.35));

  // --- Long nose (aluminium, like a classic Seven) ---
  const nose = part(new THREE.BoxGeometry(0.62, 0.34, 0.9), MAT.aluminium, 0, 0.38, 1.05);
  car.add(nose);
  // Grille at the very front
  car.add(part(new THREE.BoxGeometry(0.5, 0.26, 0.02), MAT.black, 0, 0.38, 1.505));

  // --- Bonnet top between cockpit and nose ---
  car.add(part(new THREE.BoxGeometry(0.62, 0.04, 0.5), MAT.aluminium, 0, 0.56, 0.5));

  // --- Cockpit opening and seats ---
  car.add(part(new THREE.BoxGeometry(0.76, 0.02, 0.85), MAT.interior, 0, 0.651, -0.25));
  car.add(part(new THREE.BoxGeometry(0.3, 0.35, 0.08), MAT.interior, -0.18, 0.8, -0.62)); // seat backs
  car.add(part(new THREE.BoxGeometry(0.3, 0.35, 0.08), MAT.interior, 0.18, 0.8, -0.62));

  // --- Small steering wheel ---
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

  // --- Wheels: drawn with INSTANCING ---
  // One tyre model and one rim model, each drawn 4 times in a single step,
  // instead of 8 separate objects. This is the Mecabricks-style trick that
  // keeps phones smooth, and we'll use it for cones, barriers, trees and crowds.
  const tyreGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 28);
  tyreGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(WHEEL_RADIUS * 0.62, WHEEL_RADIUS * 0.62, WHEEL_WIDTH + 0.01, 20);
  rimGeo.rotateZ(Math.PI / 2);

  const tyres = new THREE.InstancedMesh(tyreGeo, MAT.tyre, 4);
  const rims = new THREE.InstancedMesh(rimGeo, MAT.rim, 4);
  tyres.castShadow = rims.castShadow = true;
  tyres.receiveShadow = rims.receiveShadow = true;

  const wheelPositions = [
    [-TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE],
    [TRACK_HALF, WHEEL_RADIUS, FRONT_AXLE],
    [-TRACK_HALF, WHEEL_RADIUS, REAR_AXLE],
    [TRACK_HALF, WHEEL_RADIUS, REAR_AXLE],
  ];
  const m = new THREE.Matrix4();
  wheelPositions.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    tyres.setMatrixAt(i, m);
    rims.setMatrixAt(i, m);
  });
  car.add(tyres, rims);

  return car;
}

const car = buildCar();
scene.add(car);

// ---------------------------------------------------------------------
// KEEP IT FITTING THE SCREEN when the window resizes or the phone rotates
// ---------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------
// MAIN LOOP: redraws the scene about 60 times a second
// ---------------------------------------------------------------------
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
