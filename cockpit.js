// =====================================================================
// COCKPIT: the inside of the car and the driver
//   - two bucket seats, a dashboard with dials, a proper steering wheel
//     (rim, spokes, hub, column) with gear paddles behind it
//   - a gear lever on the tunnel and a handbrake lever beside it
//   - the driver: helmet, body and arms. The hands hold the wheel and turn
//     it with the steering. A manual is shifted with the lever (the left
//     hand goes over and moves it through the H pattern); an automatic is
//     shifted with the paddles; pulling the handbrake, the left hand goes
//     to the lever and pulls it up.
//   - three working mirrors (one on the windscreen, one on each side),
//     each a little camera looking backwards, shown in the mirror glass.
//     They only update in the driver's-eye view, to save effort.
// Everything is built in the car's own space (+x = the car's left, +z =
// forwards, y = up). The car is right-hand drive: the driver sits on the
// right (x = -0.18).
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 11;

const DRIVER_X = -0.18;
// The steering wheel's centre and tilt
const WHEEL_CENTRE = new THREE.Vector3(DRIVER_X, 0.83, 0.02);
const WHEEL_TILT = 0.42;            // the top leans away from the driver
const WHEEL_R = 0.135;
const STEER_RATIO = 3.2;                 // steering-wheel turn per radian of front-wheel angle
// Where the driver's eyes are (the first-person camera)
export const EYE = new THREE.Vector3(DRIVER_X, 1.035, -0.39);
// Shoulders (left is +x: towards the middle of the car)
const SHOULDER_L = new THREE.Vector3(DRIVER_X + 0.165, 0.92, -0.52);
const SHOULDER_R = new THREE.Vector3(DRIVER_X - 0.165, 0.92, -0.52);
const UPPER_ARM = 0.3, FOREARM = 0.29;
// Levers on the tunnel between the seats
const STICK_BASE = new THREE.Vector3(0.0, 0.655, -0.12);
const STICK_LEN = 0.17;
const BRAKE_BASE = new THREE.Vector3(0.035, 0.675, -0.4);
const BRAKE_LEN = 0.22;
// Floor of the cockpit (the top of the lower tub in rendering.js)
const FLOOR_Y = 0.472;
// Hips, and the legs: thigh and shin lengths
const HIP_L = new THREE.Vector3(DRIVER_X + 0.085, 0.665, -0.5);
const HIP_R = new THREE.Vector3(DRIVER_X - 0.085, 0.665, -0.5);
const THIGH = 0.38, SHIN = 0.47;     // (the shin includes the height of the boot)
// Pedals, left to right as the driver sees them (the driver's left is +x).
// Each hangs from a pivot at the top; travel = how far it swings when pressed
const PEDALS = {
  clutch: { x: DRIVER_X + 0.085, travel: 0.42 },
  brake: { x: DRIVER_X - 0.005, travel: 0.16 },
  throttle: { x: DRIVER_X - 0.085, travel: 0.34 },
};
const PEDAL_PIVOT_Y = 0.63, PEDAL_PIVOT_Z = 0.42, PEDAL_ARM = 0.13;
// Where the left foot rests when it's not on the clutch
const FOOTREST = new THREE.Vector3(DRIVER_X + 0.1, FLOOR_Y + 0.045, 0.38);
// Manual H pattern: [across (-1 = driver's left ... +1), forward (+1) / back (-1)]
const H_PATTERN = { '-1': [1.4, -1], 0: [0, 0], 1: [-1, 1], 2: [-1, -1], 3: [0, 1], 4: [0, -1], 5: [1, 1] };

const UP = new THREE.Vector3(0, 1, 0);
// Dial needles: start 2.2 rad anticlockwise from straight up (bottom left)
// and sweep 4.2 rad clockwise (to bottom right)
const SWEEP_START = 2.2, SWEEP = 4.2;

// A rounded limb segment of radius r and length len, from its base (at the
// origin) up the y axis: stretched a little per frame if needed
function limbGeometry(r, len) {
  const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 14);
  g.translate(0, len / 2, 0);
  return g;
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export class Cockpit {
  // mats: { interior, black, chrome, paint }
  constructor(car, mats, { isMobile = false, redline = 7600 } = {}) {
    this.group = new THREE.Group();
    car.add(this.group);
    this.car = car;
    this.isMobile = isMobile;
    const leather = new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.75 });
    const stitch = new THREE.MeshStandardMaterial({ color: 0x7a2020, roughness: 0.7 });
    // Race suit: red with white stripes down the arms and sides, like a
    // proper fireproof overall
    const suitTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g2 = cv.getContext('2d');
      g2.fillStyle = '#c81d25';
      g2.fillRect(0, 0, 64, 64);
      g2.fillStyle = '#f4f4f2';
      g2.fillRect(14, 0, 6, 64);                       // a stripe down one side...
      g2.fillRect(44, 0, 6, 64);                       // ...and the other
      g2.fillStyle = 'rgba(0,0,0,0.18)';
      g2.fillRect(16, 0, 2, 64);
      g2.fillRect(46, 0, 2, 64);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const suit = new THREE.MeshStandardMaterial({ map: suitTex, roughness: 0.85 });
    const suitPlain = new THREE.MeshStandardMaterial({ color: 0xc81d25, roughness: 0.85 });
    const strap = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.7 });   // harness belts
    const buckle = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.9, roughness: 0.3 });
    const glove = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 });
    const helmetMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: 0.25, clearcoat: 1 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x111418, metalness: 0.6, roughness: 0.1 });
    const dialFace = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.4, emissive: 0x111111 });
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, emissive: 0xff3a00, emissiveIntensity: 0.6 });
    const g = this.group;

    // --- Seats: a bucket each, with a slightly reclined back and side bolsters ---
    for (const sx of [-0.18, 0.18]) {
      const seat = new THREE.Group();
      seat.position.set(sx, 0.655, -0.66);
      const back = mesh(new THREE.BoxGeometry(0.34, 0.42, 0.06), leather, 0, 0.2, -0.02);
      back.rotation.x = -0.22;
      seat.add(back);
      for (const side of [-1, 1]) {
        const bolster = mesh(new THREE.BoxGeometry(0.05, 0.36, 0.12), leather, side * 0.17, 0.17, 0.02);
        bolster.rotation.x = -0.22;
        seat.add(bolster);
      }
      const seam = mesh(new THREE.BoxGeometry(0.02, 0.4, 0.062), stitch, 0, 0.2, -0.018);   // red stitching down the middle
      seam.rotation.x = -0.22;
      seat.add(seam);
      const headrest = mesh(new THREE.BoxGeometry(0.2, 0.12, 0.06), leather, 0, 0.44, -0.08);
      headrest.rotation.x = -0.22;
      seat.add(headrest);
      // the cushion, on a shell down to the floor
      seat.add(mesh(new THREE.BoxGeometry(0.32, 0.05, 0.44), leather, 0, -0.015, 0.12));
      seat.add(mesh(new THREE.BoxGeometry(0.3, 0.655 - FLOOR_Y - 0.04, 0.4), mats.black, 0, -(0.655 - FLOOR_Y) / 2 - 0.02, 0.1));
      g.add(seat);
    }

    // --- The cockpit itself: a floor running forward into the footwell,
    // a transmission tunnel between the seats, and trimmed sides ---
    const trim = new THREE.MeshStandardMaterial({ color: 0x232427, roughness: 0.9 });
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.006, 1.92), trim, 0, FLOOR_Y + 0.003, -0.32));          // floor mat
    const tunnel = mesh(new THREE.BoxGeometry(0.12, 0.655 - FLOOR_Y + 0.02, 1.15), leather, 0, (0.655 + FLOOR_Y) / 2 + 0.01, -0.2);
    g.add(tunnel);
    for (const side of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(0.006, 0.19, 1.86), trim, side * 0.406, FLOOR_Y + 0.1, -0.35));   // side trim
    }
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.19, 0.006), trim, 0, FLOOR_Y + 0.1, 0.556));               // footwell front

    // --- Pedals: clutch, brake and throttle, hanging from a box under the
    // scuttle. The driver's feet press them (see update) ---
    const pedalMetal = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.35 });
    const padGrip = new THREE.MeshStandardMaterial({ color: 0x2b2d31, metalness: 0.4, roughness: 0.6 });
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.03, 0.1), mats.black, DRIVER_X, PEDAL_PIVOT_Y + 0.015, PEDAL_PIVOT_Z + 0.02));   // pedal box
    this.pedals = {};
    for (const [name, p] of Object.entries(PEDALS)) {
      const pivot = new THREE.Group();
      pivot.position.set(p.x, PEDAL_PIVOT_Y, PEDAL_PIVOT_Z);
      pivot.add(mesh(new THREE.BoxGeometry(0.012, PEDAL_ARM, 0.012), pedalMetal, 0, -PEDAL_ARM / 2, 0));
      const pad = mesh(new THREE.BoxGeometry(name === 'throttle' ? 0.045 : 0.06, name === 'throttle' ? 0.08 : 0.055, 0.01),
        padGrip, 0, -PEDAL_ARM, -0.008);
      pad.rotation.x = 0.35;                     // tipped back towards the driver's foot
      pivot.add(pad);
      g.add(pivot);
      this.pedals[name] = { pivot, travel: p.travel, at: 0 };
    }
    const rest = mesh(new THREE.BoxGeometry(0.07, 0.01, 0.1), padGrip, FOOTREST.x, FLOOR_Y + 0.012, FOOTREST.z + 0.03);   // rubber heel pad
    g.add(rest);

    // --- Dashboard: a padded panel across the front of the cockpit, with
    // a rev counter and speedo in front of the driver ---
    const dash = mesh(new THREE.BoxGeometry(0.78, 0.1, 0.08), leather, 0, 0.7, 0.19);
    g.add(dash);
    // Each dial has a printed face: tick marks, numbers and a red zone. The
    // needles sweep clockwise from bottom left to bottom right, like real ones.
    this.redline = redline;
    this.tachMax = Math.ceil((redline + 800) / 1000) * 1000;
    this.needles = [];
    const dials = [
      { dx: -0.078, r: 0.05, max: this.tachMax, step: 1000, label: (v) => String(v / 1000), red: redline, caption: 'RPM x1000' },
      { dx: 0.05, r: 0.044, max: 240, step: 20, labelEvery: 40, label: (v) => String(v), red: null, caption: 'KM/H' },
    ];
    for (const d of dials) {
      const faceMat = new THREE.MeshBasicMaterial({ map: this.dialTexture(d), toneMapped: false });
      const face = mesh(new THREE.CircleGeometry(d.r, 32), faceMat, DRIVER_X + d.dx, 0.705, 0.148);
      (this.dialFaces ||= []).push(face);
      face.rotation.y = Math.PI;                // facing the driver
      face.castShadow = false;
      g.add(face);
      const rim = mesh(new THREE.TorusGeometry(d.r, 0.004, 6, 32), mats.chrome, DRIVER_X + d.dx, 0.705, 0.147);
      rim.castShadow = false;
      g.add(rim);
      const needle = new THREE.Group();
      needle.position.set(DRIVER_X + d.dx, 0.705, 0.145);
      const stick = mesh(new THREE.BoxGeometry(0.0035, d.r * 0.85, 0.002), needleMat, 0, d.r * 0.4, 0);
      stick.castShadow = false;
      needle.add(stick);
      g.add(needle);
      this.needles.push(needle);
    }
    // Shift lights: a row of ten bright lamps along the top of the dash, above
    // the rev counter: green, then red, then blue at the redline. All flash
    // on the rev limiter.
    this.leds = [];
    const ledGeo = new THREE.SphereGeometry(0.0055, 10, 8);
    for (let i = 0; i < 10; i++) {
      const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false }));
      led.position.set(DRIVER_X + 0.072 - i * 0.016, 0.757, 0.15);   // left to right as the driver sees it
      g.add(led);
      this.leds.push(led);
    }
    this.ledOn = [0x2bdc4a, 0x2bdc4a, 0x2bdc4a, 0x2bdc4a, 0xff2a2a, 0xff2a2a, 0xff2a2a, 0x3a8bff, 0x3a8bff, 0x3a8bff]
      .map((c) => new THREE.Color(c).multiplyScalar(2.2));
    this.ledOff = new THREE.Color(0x141414);

    // --- Digital display in a pod on top of the dash, straight ahead of the
    // driver and seen through the top of the steering wheel (so the gear
    // stick and the driver's arms never cover it). In the driver's-eye view
    // the on-screen dials go away and everything shows here instead:
    // shift lights, gear, speed, revs, fuel, oil, the four tyres, warnings
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 680;
    this.screenCanvas.height = 264;
    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenTex.anisotropy = 4;
    const SCREEN_H = 0.09, SCREEN_W = SCREEN_H * (680 / 264);   // (about 23 cm across)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false }));
    screen.position.set(DRIVER_X, 0.85, 0.14);         // (just in front of the windscreen and its frame)
    screen.rotation.set(-0.3, Math.PI, 0, 'YXZ');      // facing the driver, tipped back towards their eyes
    g.add(screen);
    const pod = mesh(new THREE.BoxGeometry(SCREEN_W + 0.016, SCREEN_H + 0.014, 0.035), mats.black, 0, 0, 0.018);
    pod.castShadow = false;
    const podHolder = new THREE.Group();
    podHolder.position.copy(screen.position);
    podHolder.rotation.copy(screen.rotation);
    podHolder.add(pod);
    const hood = mesh(new THREE.BoxGeometry(SCREEN_W + 0.03, 0.006, 0.07), mats.black, 0, SCREEN_H / 2 + 0.01, -0.012);
    hood.rotation.x = -0.12;                             // a little sun visor over the top
    podHolder.add(hood);
    g.add(podHolder);
    const podStem = mesh(new THREE.BoxGeometry(0.08, 0.07, 0.05), mats.black, DRIVER_X, 0.775, 0.165);
    g.add(podStem);
    this.screenClock = 0;

    // --- Steering: column, then the wheel (tilted towards the driver).
    // `wheelSpin` turns with the steering; the paddles turn with it.
    const column = mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 10), mats.black, DRIVER_X, 0.77, 0.16);
    column.rotation.x = Math.PI / 2 + WHEEL_TILT;
    g.add(column);
    this.wheelPivot = new THREE.Group();
    this.wheelPivot.position.copy(WHEEL_CENTRE);
    this.wheelPivot.rotation.x = WHEEL_TILT;
    this.wheelPivot.rotation.y = Math.PI;      // the face of the wheel towards the driver
    g.add(this.wheelPivot);
    this.wheelSpin = new THREE.Group();
    this.wheelPivot.add(this.wheelSpin);
    const rim = mesh(new THREE.TorusGeometry(WHEEL_R, 0.014, 10, 40), leather);
    this.wheelSpin.add(rim);
    const hub = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 18), mats.black, 0, 0, 0.01);
    hub.rotation.x = Math.PI / 2;
    this.wheelSpin.add(hub);
    this.hub = hub;                    // the horn pad: pressed in while the horn sounds
    const hornMark = mesh(new THREE.CircleGeometry(0.018, 18), mats.chrome, 0, 0.0155, 0);
    hornMark.rotation.x = -Math.PI / 2;
    hub.add(hornMark);
    for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI]) {          // three spokes: left, right, bottom
      const spoke = mesh(new THREE.BoxGeometry(0.018, WHEEL_R, 0.008), mats.chrome, Math.sin(a) * WHEEL_R / 2, Math.cos(a) * WHEEL_R / 2, 0.004);
      spoke.rotation.z = -a;
      this.wheelSpin.add(spoke);
    }
    const marker = mesh(new THREE.BoxGeometry(0.016, 0.03, 0.03), stitch, 0, WHEEL_R, 0);   // the top-centre stripe
    this.wheelSpin.add(marker);
    // Paddles behind the wheel: + on the right (shift up), - on the left (shift down)
    this.paddles = {};
    for (const [name, side] of [['up', -1], ['down', 1]]) {   // the driver's right is -x
      const pivot = new THREE.Group();
      pivot.position.set(-side * 0.055, 0.01, -0.03);    // (the wheel is turned to face the driver, so x is mirrored)
      const paddle = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.006), mats.chrome, -side * 0.035, 0, 0);
      pivot.add(paddle);
      this.wheelSpin.add(pivot);
      this.paddles[name] = { pivot, t: 0 };
    }

    // --- Gear lever and handbrake on the tunnel ---
    // Gear lever: a chrome shaft with a collar, a leather gaiter round its
    // base, and a round knob with the shift pattern printed on top
    this.stick = new THREE.Group();
    this.stick.position.copy(STICK_BASE);
    this.stick.add(mesh(new THREE.CylinderGeometry(0.0075, 0.011, STICK_LEN, 12), mats.chrome, 0, STICK_LEN / 2, 0));
    this.stick.add(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 14), mats.chrome, 0, STICK_LEN * 0.62, 0));   // collar
    const knob = mesh(new THREE.SphereGeometry(0.024, 20, 14), mats.black, 0, STICK_LEN, 0);
    knob.scale.set(1, 0.9, 1);
    this.stick.add(knob);
    const pattern = new THREE.Mesh(new THREE.CircleGeometry(0.017, 24),
      new THREE.MeshStandardMaterial({ map: this.shiftPatternTexture(), roughness: 0.4, transparent: true }));
    pattern.position.set(0, STICK_LEN + 0.0205, 0);
    pattern.rotation.set(-Math.PI / 2, 0, Math.PI);       // flat on top, readable from the seat
    this.stick.add(pattern);
    g.add(this.stick);
    const gaiter = mesh(new THREE.CylinderGeometry(0.016, 0.05, 0.06, 16, 3), leather, STICK_BASE.x, STICK_BASE.y + 0.03, STICK_BASE.z);
    g.add(gaiter);
    g.add(mesh(new THREE.BoxGeometry(0.12, 0.008, 0.12), mats.chrome, STICK_BASE.x, STICK_BASE.y + 0.002, STICK_BASE.z));   // trim ring
    // Handbrake: a ratchet housing on the tunnel, the lever pivoting on it,
    // a rubber grip and the release button on the end
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.12), mats.black, BRAKE_BASE.x, BRAKE_BASE.y - 0.012, BRAKE_BASE.z + 0.04));
    this.brake = new THREE.Group();
    this.brake.position.copy(BRAKE_BASE);
    this.brake.add(mesh(new THREE.BoxGeometry(0.018, 0.024, BRAKE_LEN), mats.chrome, 0, 0, BRAKE_LEN / 2));
    const hbGrip = mesh(new THREE.CapsuleGeometry(0.016, 0.08, 6, 14), mats.black, 0, 0, BRAKE_LEN - 0.05);
    hbGrip.rotation.x = Math.PI / 2;
    this.brake.add(hbGrip);
    const button = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.016, 12), mats.chrome, 0, 0, BRAKE_LEN + 0.006);
    button.rotation.x = Math.PI / 2;
    this.brake.add(button);
    const quadrant = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 20, 1, false, 0, Math.PI / 2), mats.chrome, 0, 0, 0.005);
    quadrant.rotation.set(0, 0, Math.PI / 2);            // the toothed ratchet plate on the side
    this.brake.add(quadrant);
    g.add(this.brake);
    this.stickAt = { across: 0, fore: 0 };
    this.brakeUp = 0;

    // --- The driver ---
    this.driver = new THREE.Group();
    g.add(this.driver);
    // (sitting up straight against the seat: shoulders over the hips, head on top)
    // Torso: a smooth turned shape, waist to shoulders, flattened front to back
    const torsoProfile = [[0.001, -0.17], [0.125, -0.165], [0.135, -0.1], [0.145, 0], [0.158, 0.08], [0.155, 0.13], [0.125, 0.165], [0.06, 0.185], [0.001, 0.19]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const torso = mesh(new THREE.LatheGeometry(torsoProfile, 24), suit, DRIVER_X, 0.8, -0.535);
    torso.scale.z = 0.66;
    torso.rotation.x = -0.1;
    this.driver.add(torso);
    // Hips and seat of the pants, sitting in the cushion
    const pelvis = mesh(new THREE.SphereGeometry(0.15, 20, 14), suitPlain, DRIVER_X, 0.665, -0.53);
    pelvis.scale.set(1, 0.5, 0.75);
    this.driver.add(pelvis);
    for (const s of [SHOULDER_L, SHOULDER_R]) this.driver.add(mesh(new THREE.SphereGeometry(0.055, 16, 12), suitPlain, s.x, s.y, s.z));
    // Harness: two shoulder belts and a lap belt, with the buckle in the middle
    for (const sx of [-0.07, 0.07]) {
      const belt = mesh(new THREE.BoxGeometry(0.045, 0.3, 0.012), strap, DRIVER_X + sx, 0.8, -0.44);
      belt.rotation.x = -0.1;
      this.driver.add(belt);
    }
    this.driver.add(mesh(new THREE.BoxGeometry(0.3, 0.045, 0.012), strap, DRIVER_X, 0.68, -0.455));
    const clasp = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), buckle, DRIVER_X, 0.69, -0.448);
    clasp.rotation.x = Math.PI / 2;
    this.driver.add(clasp);
    // Head: the helmet and visor (hidden in the driver's-eye view). The car
    // faces +z, so the visor is centred on +z
    this.head = new THREE.Group();
    this.head.position.set(DRIVER_X, 1.06, -0.54);              // right above the shoulders, not poking forward
    this.head.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 10), suitPlain, 0, -0.08, 0));   // neck
    // HANS device: the black collar that sits on the shoulders behind the helmet
    const hans = mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 20, Math.PI * 1.2), strap, 0, -0.1, -0.01);
    hans.rotation.set(Math.PI / 2, 0, Math.PI * 0.9);   // open at the front
    this.head.add(hans);
    const helmet = mesh(new THREE.SphereGeometry(0.12, 20, 16), helmetMat);
    helmet.scale.set(1, 1.05, 1.12);
    this.head.add(helmet);
    const stripe = mesh(new THREE.TorusGeometry(0.122, 0.014, 6, 24, Math.PI), suitPlain);   // a red stripe over the top, front to back
    stripe.rotation.y = Math.PI / 2;
    stripe.scale.set(1, 1.05, 1.12);
    this.head.add(stripe);
    const visor = mesh(new THREE.SphereGeometry(0.123, 20, 12, Math.PI / 2 - 0.85, 1.7, 1.2, 0.55), visorMat);
    visor.scale.copy(helmet.scale);
    this.head.add(visor);
    this.driver.add(this.head);
    // Arms: rounded upper arm and forearm, placed every frame. Gloved hands
    // with a thumb.
    const upperGeo = limbGeometry(0.046, UPPER_ARM), foreGeo = limbGeometry(0.039, FOREARM);
    upperGeo.userData.len = UPPER_ARM; foreGeo.userData.len = FOREARM;
    this.arms = ['left', 'right'].map((side) => {
      const upper = mesh(upperGeo, suit);
      const fore = mesh(foreGeo, suit);
      const elbow = mesh(new THREE.SphereGeometry(0.043, 14, 10), suit);
      const hand = new THREE.Group();
      const palm = mesh(new THREE.SphereGeometry(0.036, 16, 12), glove);
      palm.scale.set(1, 0.75, 1.35);
      const thumb = mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 10), glove, (side === 'left' ? -1 : 1) * 0.03, 0.01, 0.01);
      thumb.rotation.z = (side === 'left' ? 1 : -1) * 0.9;
      hand.add(palm, thumb);
      const cuff = mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.03, 14), glove, 0, -0.035, 0);
      hand.add(cuff);
      this.driver.add(upper, fore, elbow, hand);
      return { upper, fore, elbow, hand, blend: 0, target: new THREE.Vector3(), horn: 0 };
    });
    // Legs: thigh and shin to a racing boot on each pedal
    const thighGeo = limbGeometry(0.064, THIGH), shinGeo = limbGeometry(0.048, SHIN);
    thighGeo.userData.len = THIGH; shinGeo.userData.len = SHIN;
    const boot = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.6 });
    this.legs = ['left', 'right'].map(() => {
      const thigh = mesh(thighGeo, suit);
      const shin = mesh(shinGeo, suit);
      const knee = mesh(new THREE.SphereGeometry(0.056, 14, 10), suit);
      const foot = new THREE.Group();
      const sole = mesh(new THREE.CapsuleGeometry(0.035, 0.15, 4, 12), boot, 0, 0, 0.07);
      sole.rotation.x = Math.PI / 2;                 // lying along the foot, toe forward
      sole.scale.set(1.05, 1, 0.8);
      foot.add(sole);
      foot.add(mesh(new THREE.CylinderGeometry(0.042, 0.045, 0.07, 14), boot, 0, 0.03, 0));   // ankle of the boot
      this.driver.add(thigh, shin, knee, foot);
      return { thigh, shin, knee, foot, at: new THREE.Vector3() };
    });
    this.hornPress = 0;

    // --- Mirrors: a centre one on top of the windscreen, and one on each side ---
    const s = isMobile ? 0.5 : 1;
    const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true };
    this.mirrors = [
      { pos: new THREE.Vector3(0, 0.95, 0.16), size: [0.22, 0.065], px: [Math.round(384 * s), Math.round(112 * s)], fov: 16, yaw: 0, pitch: -0.03 },
      { pos: new THREE.Vector3(0.5, 0.79, 0.32), size: [0.12, 0.08], px: [Math.round(176 * s), Math.round(118 * s)], fov: 22, yaw: -0.2, pitch: -0.05 },
      { pos: new THREE.Vector3(-0.5, 0.79, 0.32), size: [0.12, 0.08], px: [Math.round(176 * s), Math.round(118 * s)], fov: 22, yaw: 0.2, pitch: -0.05 },
    ];
    const housing = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 });
    for (const m of this.mirrors) {
      m.rt = new THREE.WebGLRenderTarget(m.px[0], m.px[1], rtOpts);
      m.rt.texture.repeat.x = -1;      // a mirror shows things the other way round
      m.rt.texture.offset.x = 1;
      m.cam = new THREE.PerspectiveCamera(m.fov, m.size[0] / m.size[1], 0.2, 300);
      m.cam.position.copy(m.pos).add(new THREE.Vector3(0, 0, -0.03));
      m.cam.rotation.set(m.pitch, m.yaw, 0, 'YXZ');       // cameras look along -z: backwards
      m.cam.layers.enable(1);
      g.add(m.cam);
      const back = mesh(new THREE.BoxGeometry(m.size[0] + 0.02, m.size[1] + 0.02, 0.025), housing, m.pos.x, m.pos.y, m.pos.z + 0.014);
      back.rotation.y = -m.yaw;
      g.add(back);
      m.glass = new THREE.Mesh(new THREE.PlaneGeometry(m.size[0], m.size[1]),
        new THREE.MeshBasicMaterial({ map: m.rt.texture, fog: false }));
      m.glass.position.copy(m.pos);
      m.glass.rotation.y = Math.PI - m.yaw;             // facing backwards, angled towards the driver
      g.add(m.glass);
      // stalk down to the body (side mirrors) or up from the screen frame (centre)
      if (m.pos.x === 0) {
        // the centre one hangs on a short arm from the top of the windscreen frame
        const A = new THREE.Vector3(0, 0.908, 0.19), B = new THREE.Vector3(0, m.pos.y - m.size[1] / 2 + 0.01, m.pos.z + 0.022);
        const arm = mesh(new THREE.CylinderGeometry(0.007, 0.007, A.distanceTo(B), 8), mats.chrome, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
        arm.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
        g.add(arm);
        g.add(mesh(new THREE.BoxGeometry(0.04, 0.018, 0.02), mats.black, 0, 0.912, 0.19));   // the clamp on the frame
      } else {
        const stalkLen = 0.14;
        g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, stalkLen, 8), mats.chrome, m.pos.x * 0.92, m.pos.y - stalkLen / 2 - 0.03, m.pos.z + 0.02));
      }
    }
    this.mirrorFrame = 0;

    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this._d = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this.shiftHold = 0;
    this.firstPerson = false;
  }

  // A printed dial face. Angles: from straight up, clockwise as the driver
  // sees it, from -SWEEP_START (bottom left) through SWEEP radians.
  dialTexture({ max, step, labelEvery = step, label, red, caption }) {
    const S = 256, c0 = S / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = '#0a0b0d';
    g.fillRect(0, 0, S, S);
    const at = (v) => -SWEEP_START + SWEEP * (v / max);
    const pt = (a, r) => [c0 + Math.sin(a) * r, c0 - Math.cos(a) * r];
    if (red) {                                       // the red zone
      g.strokeStyle = '#e0261c';
      g.lineWidth = 16;
      g.beginPath();
      g.arc(c0, c0, S * 0.4, at(red) - Math.PI / 2, at(max) - Math.PI / 2);
      g.stroke();
    }
    for (let v = 0; v <= max + 1e-6; v += step / 2) {
      const major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      const [x0, y0] = pt(at(v), S * (major ? 0.36 : 0.4));
      const [x1, y1] = pt(at(v), S * 0.46);
      g.strokeStyle = red && v >= red ? '#ff4a3d' : '#f2efe6';
      g.lineWidth = major ? 5 : 2.5;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (major && Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6) {
        const [tx, ty] = pt(at(v), S * 0.26);
        g.fillStyle = red && v >= red ? '#ff4a3d' : '#f2efe6';
        g.font = `bold ${S * 0.12}px Arial, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(label(v), tx, ty);
      }
    }
    g.fillStyle = '#9aa0a8';
    g.font = `${S * 0.075}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.fillText(caption, c0, S * 0.74);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // The car's dials ARE the game's HUD: the rev counter and speedo on the
  // dashboard show the very same drawings as the on-screen dials (needles,
  // gear, shift and warning lights and all), so the printed faces, their
  // own needles and the separate row of shift lights aren't needed
  useHudDials(parts) {
    if (!parts?.tach || !this.dialFaces) return;
    this.hudDialTex = [parts.tach, parts.speedo].map((cv, i) => {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.dialFaces[i].material = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true });
      return t;
    });
    for (const n of this.needles) n.visible = false;
    for (const l of this.leds) l.visible = false;
  }

  // The shift pattern printed on top of the gear knob: R 1 3 5 / 2 4 6
  shiftPatternTexture() {
    const S = 128, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = '#111214';
    c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e8e8e8';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(28, 64); c.lineTo(100, 64);                         // across
    for (const x of [28, 52, 76, 100]) { c.moveTo(x, 64); c.lineTo(x, x === 28 ? 34 : 34); if (x !== 28) { c.moveTo(x, 64); c.lineTo(x, 94); } }
    c.stroke();
    c.fillStyle = '#e8e8e8';
    c.font = 'bold 20px Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    [['R', 28, 22], ['1', 52, 22], ['3', 76, 22], ['5', 100, 22], ['2', 52, 106], ['4', 76, 106], ['6', 100, 106]]
      .forEach(([t, x, y]) => c.fillText(t, x, y));
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Hide the helmet when looking out through it
  setFirstPerson(on) {
    this.firstPerson = on;
    this.head.visible = !on;
  }

  // A gear change happened (called from the game's events)
  onShift(transmission, direction) {
    if (transmission !== 'manual' && (direction === 'up' || direction === 'down')) {
      const p = this.paddles[direction === 'down' ? 'down' : 'up'];
      p.t = 0.2;
    } else {
      this.shiftHold = transmission === 'manual' ? 0.42 : 0.5;   // the hand goes to the lever
    }
  }

  // The middle of the steering wheel, just in front of the horn pad
  hubPoint(out) {
    out.set(0, 0, 0.05);
    this._e.set(WHEEL_TILT, Math.PI, 0);
    out.applyEuler(this._e);
    return out.add(WHEEL_CENTRE);
  }

  // A point on the steering wheel rim, at angle `a` (0 = top; + towards the
  // car's left as the driver sees it), with the wheel turned by `turn`
  rimPoint(a, turn, out) {
    // In the wheel's own space the face points at the driver and x is mirrored
    out.set(-Math.sin(a + turn) * WHEEL_R, Math.cos(a + turn) * WHEEL_R, 0.02);
    this._e.set(WHEEL_TILT, Math.PI, 0);
    out.applyEuler(this._e);
    return out.add(WHEEL_CENTRE);
  }

  // Place one arm from shoulder to hand, bending at the elbow (two-bone reach)
  placeArm(arm, shoulder, handAt, outward) {
    const d = this._a.subVectors(handAt, shoulder);
    let len = d.length();
    const maxLen = UPPER_ARM + FOREARM - 0.005;
    if (len > maxLen) { d.multiplyScalar(maxLen / len); len = maxLen; }
    const hand = this._b.copy(shoulder).add(d);
    const dir = d.clone().normalize();
    const along = (UPPER_ARM * UPPER_ARM - FOREARM * FOREARM + len * len) / (2 * len);
    const lift = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - along * along));
    // elbows bend outwards and down
    const pole = this._c.set(outward, -0.9, -0.2);
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const elbow = this._d.copy(shoulder).addScaledVector(dir, along).addScaledVector(pole, lift);
    this.setLimb(arm.upper, shoulder, elbow);
    this.setLimb(arm.fore, elbow, hand);
    arm.elbow.position.copy(elbow);
    arm.hand.position.copy(hand);
    arm.hand.quaternion.copy(arm.fore.quaternion);
  }

  // Point a limb segment from a to b (stretched or squashed a touch along
  // its length if they're not quite its own length apart)
  setLimb(m, a, b) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    m.position.copy(a);
    m.quaternion.setFromUnitVectors(UP, dir.divideScalar(len || 1));
    m.scale.set(1, len / (m.geometry.userData.len || 1), 1);
  }

  // Two-bone reach (an arm or a leg): from the root towards the target,
  // bending at the joint towards `pole`. Returns the joint and end points.
  reach(root, target, l1, l2, pole, jointOut, endOut) {
    const d = this._a.subVectors(target, root);
    let len = d.length();
    const maxLen = l1 + l2 - 0.005;
    if (len > maxLen) { d.multiplyScalar(maxLen / len); len = maxLen; }
    endOut.copy(root).add(d);
    const dir = d.normalize();
    const along = (l1 * l1 - l2 * l2 + len * len) / (2 * len);
    const lift = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const p = this._c.copy(pole);
    p.addScaledVector(dir, -p.dot(dir)).normalize();
    jointOut.copy(root).addScaledVector(dir, along).addScaledVector(p, lift);
  }

  // A pedal's pad, where the sole of the foot presses it (cockpit space)
  pedalPad(name, out) {
    const p = this.pedals[name];
    const ang = -p.at * p.travel;                       // pressing swings the pad forward
    return out.set(PEDALS[name].x, PEDAL_PIVOT_Y - Math.cos(ang) * PEDAL_ARM, PEDAL_PIVOT_Z + Math.sin(-ang) * PEDAL_ARM - 0.02);
  }

  // One leg from the hip to the foot (the boot's ball on `ballAt`)
  placeLeg(leg, hip, ballAt, outward) {
    // the ankle sits behind and below the ball of the foot
    const ankleTarget = this._b.copy(ballAt).add(this._d.set(0, -0.035, -0.11));
    const knee = new THREE.Vector3(), ankle = new THREE.Vector3();
    this.reach(hip, ankleTarget, THIGH, SHIN, this._d.set(outward * 0.1, 1, 0), knee, ankle);
    this.setLimb(leg.thigh, hip, knee);
    this.setLimb(leg.shin, knee, ankle);
    leg.knee.position.copy(knee);
    leg.foot.position.copy(ankle);
    // the boot points from the ankle to the ball of the foot
    leg.foot.lookAt(this._d.copy(ballAt).applyMatrix4(this.group.matrixWorld));
  }

  // Every frame. state: { steer, gear, transmission, handbrake, rpm, redline,
  // speedKmh, lean, throttle, brake, clutch, horn }
  update(dt, st) {
    // Steering wheel
    const turn = st.steer * STEER_RATIO + (st.kick || 0) * 4; // (+ the road knocking the wheel: no power steering)
    this.wheelSpin.rotation.z = turn;
    // Paddles flick back after a pull
    for (const p of Object.values(this.paddles)) {
      p.t = Math.max(0, p.t - dt);
      p.pivot.rotation.x = p.t > 0 ? -0.35 * Math.sin((p.t / 0.2) * Math.PI) : 0;
    }
    // Gear lever: towards the current gear's slot
    let target;
    if (st.transmission === 'manual') target = H_PATTERN[st.gear] || [0, 0];
    else target = st.gear === -1 ? [0, 1] : st.gear === 0 ? [0, 0.3] : [0, -1];   // R forward, D back
    const k = 1 - Math.exp(-dt / 0.06);
    this.stickAt.across += (target[0] - this.stickAt.across) * k;
    this.stickAt.fore += (target[1] - this.stickAt.fore) * k;
    this.stick.rotation.set(this.stickAt.fore * 0.32, 0, -this.stickAt.across * 0.28);
    // Handbrake lever
    this.brakeUp += ((st.handbrake ? 1 : 0) - this.brakeUp) * (1 - Math.exp(-dt / 0.05));
    this.brake.rotation.x = -0.15 - 0.5 * this.brakeUp;
    // Dials
    // (the face is turned to the driver, so a clockwise sweep as he sees it
    // is a growing angle here)
    this.needles[0].rotation.z = -SWEEP_START + SWEEP * Math.min(1.02, st.rpm / this.tachMax);
    this.needles[1].rotation.z = -SWEEP_START + SWEEP * Math.min(1, st.speedKmh / 240);
    // Shift lights
    const lit = Math.max(0, Math.min(1, (st.rpm - st.redline * 0.7) / (st.redline * 0.3))) * this.leds.length;
    const flash = st.limiter && (performance.now() % 160) < 80;
    this.leds.forEach((led, i) => led.material.color.copy(flash ? this.ledOn[9] : i < lit ? this.ledOn[i] : this.ledOff));
    // Head leans into the corners a little
    this.head.rotation.z = THREE.MathUtils.clamp(st.lean * 0.03, -0.18, 0.18);

    // Hands. Right hand always on the wheel; the left goes to the handbrake
    // or the gear lever when needed, otherwise back to the wheel
    this.shiftHold = Math.max(0, this.shiftHold - dt);
    const [left, right] = this.arms;
    const onWheelL = this.rimPoint(1.15, turn, new THREE.Vector3());
    const onWheelR = this.rimPoint(-1.15, turn, new THREE.Vector3());
    let away = null;
    if (st.handbrake || this.brakeUp > 0.3) {
      away = new THREE.Vector3(0, 0, BRAKE_LEN - 0.03).applyEuler(this.brake.rotation).add(BRAKE_BASE);
    } else if (this.shiftHold > 0) {
      away = new THREE.Vector3(0, STICK_LEN, 0).applyEuler(this.stick.rotation).add(STICK_BASE);
    }
    left.blend += ((away ? 1 : 0) - left.blend) * (1 - Math.exp(-dt / 0.07));
    // Horn: the right hand leaves the rim and presses the middle of the
    // wheel. But one hand always stays on the wheel: if the left one is busy
    // with the gear stick or handbrake, the right keeps hold of the rim and
    // just reaches in with its thumb
    const hornReach = !st.horn ? 0 : left.blend > 0.05 || away ? 0.3 : 1;
    right.horn += (hornReach - right.horn) * (1 - Math.exp(-dt / 0.06));
    this.hornPress = right.horn;
    this.hub.position.z = 0.01 - 0.006 * right.horn;     // the pad sinks in a little
    const handL = away ? onWheelL.lerp(away, left.blend) : onWheelL.lerp(left.target, left.blend);
    if (away) left.target.copy(away);
    // (an automatic's paddle pull: the fingers reach back a touch)
    const pull = Math.max(this.paddles.up.t, this.paddles.down.t) * 0.12;
    onWheelR.z -= pull;
    if (right.horn > 0.01) onWheelR.lerp(this.hubPoint(new THREE.Vector3()), right.horn);
    this.placeArm(left, SHOULDER_L, handL, 1);
    this.placeArm(right, SHOULDER_R, onWheelR, -1);

    // Pedals follow the controls (quickly, like a foot does)
    const pk = 1 - Math.exp(-dt / 0.05);
    const press = { clutch: Math.min(1, Math.max(0, +st.clutch || 0)), brake: Math.min(1, st.brake || 0), throttle: Math.min(1, st.throttle || 0) };
    for (const [name, p] of Object.entries(this.pedals)) {
      p.at += (press[name] - p.at) * pk;
      p.pivot.rotation.x = -p.at * p.travel;
    }
    // Feet: the right one covers the throttle, moving across to the brake
    // when braking; the left one rests on the footrest unless the clutch is in
    const [legL, legR] = this.legs;
    this.rightFoot = this.rightFoot ?? 0;               // 0 = throttle, 1 = brake
    this.rightFoot += ((press.brake > 0.02 ? 1 : 0) - this.rightFoot) * (1 - Math.exp(-dt / 0.06));
    const onThrottle = this.pedalPad('throttle', new THREE.Vector3());
    const onBrake = this.pedalPad('brake', new THREE.Vector3());
    const footR = onThrottle.lerp(onBrake, this.rightFoot);
    footR.z -= 0.04 * Math.sin(this.rightFoot * Math.PI);   // lifted off in between
    footR.y += 0.03 * Math.sin(this.rightFoot * Math.PI);
    this.leftFoot = this.leftFoot ?? 0;
    this.leftFoot += ((press.clutch > 0.02 || this.pedals.clutch.at > 0.05 ? 1 : 0) - this.leftFoot) * (1 - Math.exp(-dt / 0.06));
    const footL = new THREE.Vector3().copy(FOOTREST).lerp(this.pedalPad('clutch', new THREE.Vector3()), this.leftFoot);
    this.placeLeg(legL, HIP_L, footL, 1);
    this.placeLeg(legR, HIP_R, footR, -1);
  }

  // Redraw the dash display. st: { speedKmh, rpm, redline, gearLabel, limiter,
  // fuel, oil, tyres, health }. Often in the driver's view, rarely otherwise.
  drawScreen(dt, st) {
    this.screenClock -= dt;
    if (this.screenClock > 0) return;
    this.screenClock = this.firstPerson ? 1 / 20 : 1 / 12;
    if (this.hudDialTex) for (const t of this.hudDialTex) t.needsUpdate = true;
    if (st.hud?.tach) { this.drawHudScreen(st); return; }
    const c = this.screenCanvas.getContext('2d');
    const W = 512, H = 208;
    const now = performance.now();
    const font = (px, bold = true) => `${bold ? 'bold ' : ''}${px}px "Arial Narrow", Arial, sans-serif`;
    c.fillStyle = '#05070a';
    c.fillRect(0, 0, W, H);
    // Shift lights across the top: green, then red, then blue at the
    // redline (all flash blue on the limiter)
    const n = 12;
    const lit = Math.max(0, Math.min(1, (st.rpm - st.redline * 0.7) / (st.redline * 0.3))) * n;
    const flash = st.limiter && (now % 160) < 80;
    for (let i = 0; i < n; i++) {
      const on = flash || i < lit;
      const col = i < 5 ? '#2bdc4a' : i < 9 ? '#ff2a2a' : '#3a8bff';
      c.fillStyle = on ? (flash ? '#3a8bff' : col) : '#1b1f25';
      c.beginPath(); c.arc(36 + i * 40, 16, 11, 0, Math.PI * 2); c.fill();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    // Left: speed, with revs under it
    c.fillStyle = '#ffffff';
    c.font = font(64);
    c.fillText(String(Math.round(st.speedKmh)), 82, 70);
    c.font = font(17, false);
    c.fillStyle = '#8a929c';
    c.fillText('KM/H', 82, 105);
    c.fillStyle = st.rpm > st.redline ? '#ff3b30' : '#d8dce2';
    c.font = font(30);
    c.fillText(String(Math.round(st.rpm / 100) * 100), 82, 134);
    c.font = font(15, false);
    c.fillStyle = '#8a929c';
    c.fillText('RPM', 82, 156);
    // Middle: the gear, big
    c.fillStyle = '#ffffff';
    c.font = font(118);
    c.fillText(st.gearLabel, 214, 104);
    // Fuel and oil bars along the bottom left (red when low)
    const bar = (x, y, label, v, low) => {
      c.textAlign = 'left';
      c.font = font(16);
      c.fillStyle = '#8a929c';
      c.fillText(label, x, y + 8);
      c.fillStyle = '#1b1f25';
      c.fillRect(x + 42, y, 86, 16);
      c.fillStyle = v < low ? '#ff3b30' : '#e8e8e8';
      c.fillRect(x + 42, y, 86 * Math.max(0, Math.min(1, v)), 16);
    };
    bar(12, 178, 'FUEL', st.fuel, 0.12);
    bar(160, 178, 'OIL', st.oil, 0.3);
    // Right: the four tyres as seen from the seat (fronts on top; the car's
    // left on the left). Each block: temperature (blue cold, green right,
    // red hot) over how much tread is left. The outline turns orange when
    // it's low on air; the block flashes red once it's burst or gone.
    const win = st.tyreWindow;
    const bw = 78, bh = 66, gx = 10, gy = 10;
    const x0 = W - 12 - 2 * bw - gx, y0 = 40;
    (st.tyres || []).forEach((t, i) => {
      const x = x0 + (i % 2) * (bw + gx);
      const y = y0 + (i < 2 ? 0 : bh + gy);
      const life = 1 - Math.min(1, t.wear || 0);
      const gone = t.blown || t.detached || t.rim;
      c.fillStyle = '#12161b';
      c.fillRect(x, y, bw, bh);
      // tread left, as a bar up the inside edge
      c.fillStyle = life > 0.5 ? '#2bdc4a' : life > 0.25 ? '#ffd23a' : '#ff3b30';
      c.fillRect(x + 4, y + 4 + (bh - 8) * (1 - life), 8, (bh - 8) * life);
      if (gone) {
        c.fillStyle = (now % 400) < 200 ? '#ff3b30' : '#2a0c0c';
        c.fillRect(x, y, bw, bh);
      } else {
        c.textAlign = 'center';
        let tc = '#e8e8e8';
        if (win && t.temp != null) tc = t.temp < win.lo ? '#4aa8ff' : t.temp > win.hi ? '#ff3b30' : '#2bdc4a';
        c.fillStyle = tc;
        c.font = font(30);
        c.fillText(t.temp != null ? `${Math.round(t.temp)}°` : '--', x + bw / 2 + 6, y + 26);
        c.fillStyle = '#c4c9d0';
        c.font = font(17);
        c.fillText(`${Math.round(life * 100)}%`, x + bw / 2 + 6, y + 52);
      }
      if (!gone && t.pressure < 0.6) {
        c.strokeStyle = '#ff7a1a';
        c.lineWidth = 4;
        c.strokeRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    });
    // Warnings, in the strip above the fuel and oil bars
    const warn = [];
    if (st.health < 0.5) warn.push(['CHECK ENGINE', st.health < 0.2, '#ffb02e']);
    if (st.coolant != null && st.coolant > 0.8) warn.push(['ENGINE HOT', st.coolant > 0.95, '#ff3b30']);
    if (st.fire) warn.push(['FIRE', true, '#ff3b30']);
    if (warn.length) {                     // most serious first; one at a time
      const [text, blink, col] = warn[warn.length - 1];
      if (!blink || (now % 500) < 250) {
        c.fillStyle = col;
        c.textAlign = 'center';
        c.font = font(18);
        c.fillText(text, 214, 162);
      }
    }
    this.screenTex.needsUpdate = true;
  }

  // The screen as a copy of the on-screen dashboard: the same tyre bars,
  // rev counter (with the gear), speedo (with the shift and warning lights),
  // and fuel and oil gauges, laid out in a row like they are on screen
  drawHudScreen(st) {
    const c = this.screenCanvas.getContext('2d');
    const W = this.screenCanvas.width, H = this.screenCanvas.height;
    const h = st.hud;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#07090b';
    c.fillRect(0, 0, W, H);
    const pad = 10, gap = 10;
    const aspect = (cv) => (cv.height ? cv.width / cv.height : 1);
    // Sizes relative to the rev counter's (D), shrunk to fit the width
    const widthFor = (D) => D * 0.75 * aspect(h.tyres) + D + D * 0.82 + (D - 8) / 2 + 3 * gap;
    let D = H - 2 * pad;
    if (widthFor(D) > W - 2 * pad) D *= (W - 2 * pad - 3 * gap) / (widthFor(D) - 3 * gap);
    const tyreH = D * 0.75, tyreW = tyreH * aspect(h.tyres);   // tyre bars a bit bigger than on screen, to read at a glance
    const spD = D * 0.82, smallD = (D - 8) / 2;
    const top = (H - D) / 2;
    let x = (W - widthFor(D)) / 2;
    const draw = (cv, x0, y0, w, hh) => { if (cv && cv.width) c.drawImage(cv, x0, y0, w, hh); };
    draw(h.tyres, x, (H - tyreH) / 2, tyreW, tyreH); x += tyreW + gap;
    draw(h.tach, x, top, D, D); x += D + gap;
    draw(h.speedo, x, top + (D - spD) / 2, spD, spD); x += spD + gap;
    draw(h.fuel, x, top, smallD, smallD);
    draw(h.oil, x, top + smallD + 8, smallD, smallD);
    // A fire flashes a red border round the whole screen
    if (st.fire && (performance.now() % 500) < 250) {
      c.strokeStyle = '#ff3b30';
      c.lineWidth = 8;
      c.strokeRect(4, 4, W - 8, H - 8);
    }
    this.screenTex.needsUpdate = true;
  }

  // Draw what each mirror sees (only call this in the driver's-eye view).
  // Phones update one mirror per frame, in turn.
  renderMirrors(renderer, scene) {
    const keepTarget = renderer.getRenderTarget();
    const keepShadows = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;          // shadows were already worked out this frame
    for (const m of this.mirrors) m.glass.visible = false;   // (a mirror mustn't see its own picture)
    this.mirrorFrame++;
    this.mirrors.forEach((m, i) => {
      if (this.isMobile && this.mirrorFrame % this.mirrors.length !== i) return;
      renderer.setRenderTarget(m.rt);
      renderer.render(scene, m.cam);
    });
    for (const m of this.mirrors) m.glass.visible = true;
    renderer.setRenderTarget(keepTarget);
    renderer.shadowMap.autoUpdate = keepShadows;
  }
}
