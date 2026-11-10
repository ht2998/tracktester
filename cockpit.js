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
export const BUILD = 2;

const DRIVER_X = -0.18;
// The steering wheel's centre and tilt
const WHEEL_CENTRE = new THREE.Vector3(DRIVER_X, 0.83, 0.02);
const WHEEL_TILT = 0.42;            // the top leans away from the driver
const WHEEL_R = 0.135;
const STEER_RATIO = 3.2;                 // steering-wheel turn per radian of front-wheel angle
// Where the driver's eyes are (the first-person camera)
export const EYE = new THREE.Vector3(DRIVER_X, 1.035, -0.39);
// Shoulders (left is +x: towards the middle of the car)
const SHOULDER_L = new THREE.Vector3(DRIVER_X + 0.165, 0.915, -0.47);
const SHOULDER_R = new THREE.Vector3(DRIVER_X - 0.165, 0.915, -0.47);
const UPPER_ARM = 0.3, FOREARM = 0.29;
// Levers on the tunnel between the seats
const STICK_BASE = new THREE.Vector3(0.0, 0.655, -0.12);
const STICK_LEN = 0.17;
const BRAKE_BASE = new THREE.Vector3(0.06, 0.655, -0.4);
const BRAKE_LEN = 0.2;
// Manual H pattern: [across (-1 = driver's left ... +1), forward (+1) / back (-1)]
const H_PATTERN = { '-1': [1.4, -1], 0: [0, 0], 1: [-1, 1], 2: [-1, -1], 3: [0, 1], 4: [0, -1], 5: [1, 1] };

const UP = new THREE.Vector3(0, 1, 0);

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export class Cockpit {
  // mats: { interior, black, chrome, paint }
  constructor(car, mats, { isMobile = false } = {}) {
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
      g.add(seat);
    }

    // --- Dashboard: a padded panel across the front of the cockpit, with
    // a rev counter and speedo in front of the driver ---
    const dash = mesh(new THREE.BoxGeometry(0.78, 0.1, 0.08), leather, 0, 0.7, 0.19);
    g.add(dash);
    this.needles = [];
    for (const [dx, r] of [[-0.075, 0.042], [0.045, 0.036]]) {
      const face = mesh(new THREE.CircleGeometry(r, 24), dialFace, DRIVER_X + dx, 0.705, 0.148);
      face.rotation.y = Math.PI;                // facing the driver
      face.castShadow = false;
      g.add(face);
      const needle = new THREE.Group();
      needle.position.set(DRIVER_X + dx, 0.705, 0.146);
      const stick = mesh(new THREE.BoxGeometry(0.004, r * 0.85, 0.002), needleMat, 0, r * 0.4, 0);
      stick.castShadow = false;
      needle.add(stick);
      g.add(needle);
      this.needles.push(needle);
    }

    // --- Digital display in the middle of the dash: in the driver's-eye
    // view the on-screen dials go away and everything shows here instead:
    // shift lights, gear, speed, revs, fuel, oil, the four tyres, warnings
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 256;
    this.screenCanvas.height = 128;
    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085),
      new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false }));
    screen.position.set(0.07, 0.712, 0.147);
    screen.rotation.set(-0.25, Math.PI - 0.25, 0, 'YXZ');      // facing the driver, tipped up a little
    g.add(screen);
    const bezel = mesh(new THREE.BoxGeometry(0.185, 0.1, 0.012), mats.black, 0.07, 0.712, 0.154);
    bezel.rotation.copy(screen.rotation);
    g.add(bezel);
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
    this.stick = new THREE.Group();
    this.stick.position.copy(STICK_BASE);
    this.stick.add(mesh(new THREE.CylinderGeometry(0.008, 0.01, STICK_LEN, 8), mats.chrome, 0, STICK_LEN / 2, 0));
    this.stick.add(mesh(new THREE.SphereGeometry(0.022, 14, 10), mats.black, 0, STICK_LEN, 0));
    g.add(this.stick);
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.02, 12), leather, STICK_BASE.x, 0.66, STICK_BASE.z));   // the gaiter
    this.brake = new THREE.Group();
    this.brake.position.copy(BRAKE_BASE);
    this.brake.add(mesh(new THREE.BoxGeometry(0.02, 0.02, BRAKE_LEN), mats.chrome, 0, 0, BRAKE_LEN / 2));
    this.brake.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 10), mats.black, 0, 0, BRAKE_LEN - 0.03));
    this.brake.children[1].rotation.x = Math.PI / 2;
    g.add(this.brake);
    this.stickAt = { across: 0, fore: 0 };
    this.brakeUp = 0;

    // --- The driver ---
    this.driver = new THREE.Group();
    g.add(this.driver);
    const torso = mesh(new THREE.CylinderGeometry(0.155, 0.135, 0.33, 14), suit, DRIVER_X, 0.8, -0.52);
    torso.scale.z = 0.65;
    torso.rotation.x = -0.2;
    this.driver.add(torso);
    this.driver.add(mesh(new THREE.SphereGeometry(0.072, 12, 10), suitPlain, DRIVER_X, 0.94, -0.49));   // shoulders/collar
    for (const s of [SHOULDER_L, SHOULDER_R]) this.driver.add(mesh(new THREE.SphereGeometry(0.053, 12, 10), suitPlain, s.x, s.y, s.z));
    // Harness: two shoulder belts and a lap belt, with the buckle in the middle
    for (const sx of [-0.07, 0.07]) {
      const belt = mesh(new THREE.BoxGeometry(0.045, 0.3, 0.012), strap, DRIVER_X + sx, 0.8, -0.415);
      belt.rotation.x = -0.2;
      this.driver.add(belt);
    }
    this.driver.add(mesh(new THREE.BoxGeometry(0.3, 0.045, 0.012), strap, DRIVER_X, 0.68, -0.44));
    const clasp = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), buckle, DRIVER_X, 0.69, -0.433);
    clasp.rotation.x = Math.PI / 2;
    this.driver.add(clasp);
    // Head: the helmet and visor (hidden in the driver's-eye view). The car
    // faces +z, so the visor is centred on +z
    this.head = new THREE.Group();
    this.head.position.set(DRIVER_X, 1.045, -0.44);
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
    // Arms: upper arm and forearm each a stretched cylinder, placed every frame
    const limbGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
    limbGeo.translate(0, 0.5, 0);
    this.arms = ['left', 'right'].map(() => {
      const upper = mesh(limbGeo, suit);
      const fore = mesh(limbGeo, suit);
      const elbow = mesh(new THREE.SphereGeometry(0.042, 10, 8), suit);
      const hand = mesh(new THREE.SphereGeometry(0.035, 10, 8), glove);
      hand.scale.set(1, 0.8, 1.3);
      this.driver.add(upper, fore, elbow, hand);
      return { upper, fore, elbow, hand, blend: 0, target: new THREE.Vector3() };
    });

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
      const stalkLen = m.pos.x === 0 ? 0.05 : 0.14;
      g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, stalkLen, 8), mats.chrome, m.pos.x * 0.92, m.pos.y - stalkLen / 2 - 0.03, m.pos.z + 0.02));
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
    this.setLimb(arm.upper, shoulder, elbow, 0.045);
    this.setLimb(arm.fore, elbow, hand, 0.038);
    arm.elbow.position.copy(elbow);
    arm.hand.position.copy(hand);
    arm.hand.quaternion.copy(arm.fore.quaternion);
  }

  setLimb(m, a, b, r) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    m.position.copy(a);
    m.quaternion.setFromUnitVectors(UP, dir.divideScalar(len || 1));
    m.scale.set(r, len, r);
  }

  // Every frame. state: { steer, gear, transmission, handbrake, rpm, redline, speedKmh, lean }
  update(dt, st) {
    // Steering wheel
    const turn = st.steer * STEER_RATIO;
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
    this.needles[0].rotation.z = 2.2 - 4.2 * Math.min(1.05, st.rpm / (st.redline * 1.1));
    this.needles[1].rotation.z = 2.2 - 4.2 * Math.min(1, st.speedKmh / 240);
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
    const handL = away ? onWheelL.lerp(away, left.blend) : onWheelL.lerp(left.target, left.blend);
    if (away) left.target.copy(away);
    // (an automatic's paddle pull: the fingers reach back a touch)
    const pull = Math.max(this.paddles.up.t, this.paddles.down.t) * 0.12;
    onWheelR.z -= pull;
    this.placeArm(left, SHOULDER_L, handL, 1);
    this.placeArm(right, SHOULDER_R, onWheelR, -1);
  }

  // Redraw the dash display. st: { speedKmh, rpm, redline, gearLabel, limiter,
  // fuel, oil, tyres, health }. Often in the driver's view, rarely otherwise.
  drawScreen(dt, st) {
    this.screenClock -= dt;
    if (this.screenClock > 0) return;
    this.screenClock = this.firstPerson ? 1 / 15 : 0.5;
    const c = this.screenCanvas.getContext('2d');
    const W = 256, H = 128;
    c.fillStyle = '#05070a';
    c.fillRect(0, 0, W, H);
    // Shift lights: green, then red, then blue at the redline (all flash on the limiter)
    const n = 10;
    const lit = Math.max(0, Math.min(1, (st.rpm - st.redline * 0.7) / (st.redline * 0.3))) * n;
    const flash = st.limiter && (performance.now() % 160) < 80;
    for (let i = 0; i < n; i++) {
      const on = flash || i < lit;
      const col = i < 4 ? '#2bdc4a' : i < 7 ? '#ff2a2a' : '#3a8bff';
      c.fillStyle = on ? (flash ? '#3a8bff' : col) : '#1b1f25';
      c.beginPath(); c.arc(24 + i * 23.2, 12, 7, 0, Math.PI * 2); c.fill();
    }
    // Gear in the middle, speed on the left, revs on the right
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffffff';
    c.font = 'bold 58px "Arial Narrow", Arial, sans-serif';
    c.fillText(st.gearLabel, W / 2, 58);
    c.font = 'bold 30px "Arial Narrow", Arial, sans-serif';
    c.fillText(String(Math.round(st.speedKmh)), 42, 52);
    c.fillText(String(Math.round(st.rpm / 100) * 100), W - 46, 52);
    c.font = '13px Arial, sans-serif';
    c.fillStyle = '#8a929c';
    c.fillText('KM/H', 42, 76);
    c.fillText('RPM', W - 46, 76);
    // Fuel and oil bars (red when low)
    const bar = (y, label, v, low) => {
      c.fillStyle = '#8a929c';
      c.textAlign = 'left';
      c.fillText(label, 8, y + 6);
      c.fillStyle = '#1b1f25';
      c.fillRect(40, y, 56, 12);
      c.fillStyle = v < low ? '#ff3b30' : '#e8e8e8';
      c.fillRect(40, y, 56 * Math.max(0, Math.min(1, v)), 12);
    };
    bar(94, 'FUEL', st.fuel, 0.12);
    bar(111, 'OIL', st.oil, 0.3);
    // The four tyres as seen from the seat (fronts on top; the car's left on
    // the left): green when fresh, then yellow, then red; orange when low on
    // air; flashing red once burst or gone
    (st.tyres || []).forEach((t, i) => {
      const px = W - 64 + (i % 2 === 0 ? 0 : 28);
      const y = 94 + (i < 2 ? 0 : 18);
      const life = 1 - Math.min(1, t.wear || 0);
      let col = life > 0.5 ? '#2bdc4a' : life > 0.25 ? '#ffd23a' : '#ff3b30';
      if (t.pressure < 0.6) col = '#ff7a1a';
      if (t.blown || t.detached) col = (performance.now() % 400) < 200 ? '#ff3b30' : '#1b1f25';
      c.fillStyle = col;
      c.fillRect(px, y, 20, 14);
    });
    // Check engine
    if (st.health < 0.5) {
      c.fillStyle = st.health < 0.2 && (performance.now() % 500) < 250 ? '#1b1f25' : '#ffb02e';
      c.textAlign = 'center';
      c.font = 'bold 12px Arial, sans-serif';
      c.fillText('CHECK ENGINE', W / 2, 98);
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
