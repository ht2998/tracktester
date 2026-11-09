// =====================================================================
// EFFECTS: small bits that fly about or lie on the ground
//   FlyingBits  - grass clippings, mud clumps: flung up by the tyres,
//                 tumble, land and soon disappear
//   MetalFlakes - tiny glittery shavings ground off a bare rim, lying on
//                 the road and catching the light
//   LooseWheel  - a wheel that has come off: rolls away at the speed and in
//                 the direction the car was going, wobbles, slows and falls
// Each kind is one instanced object (or one small model), so it's cheap.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

const rand = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------------
// FLYING BITS
// ---------------------------------------------------------------------
export class FlyingBits {
  // colours: a few shades to pick from; size: [min, max] in metres
  constructor(scene, { max = 300, colours = [0x4f7a2c], size = [0.02, 0.05], flat = true } = {}) {
    this.max = max;
    this.items = [];
    this.next = 0;
    this.size = size;
    this.flat = flat;
    this.colours = colours.map((c) => new THREE.Color(c));
    const geo = flat ? new THREE.PlaneGeometry(1, 1) : new THREE.IcosahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide, flatShading: !flat });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = max;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) {
      this.mesh.setMatrixAt(i, zero);
      this.mesh.setColorAt(i, this.colours[0]);
    }
    scene.add(this.mesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this.carry = {};
  }

  // Throw bits from a tyre. rate: bits per second at full amount
  emit(id, pos, carVel, amount, rate, dt) {
    let acc = (this.carry[id] || 0) + rate * amount * dt;
    while (acc >= 1) {
      this.spawn(pos, carVel, amount);
      acc -= 1;
    }
    this.carry[id] = amount > 0.02 ? acc : 0;
  }

  spawn(pos, carVel, amount) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    const speed = Math.hypot(carVel.x, carVel.z);
    this.items[i] = {
      x: pos.x + rand(-0.1, 0.1), y: 0.05, z: pos.z + rand(-0.1, 0.1),
      // flung up and back off the tyre, keeping some of the car's speed
      vx: carVel.x * rand(0.2, 0.6) + rand(-1.2, 1.2),
      vy: rand(1, 3) * (0.5 + 0.5 * Math.min(1, speed / 15)) * (0.6 + 0.6 * amount),
      vz: carVel.z * rand(0.2, 0.6) + rand(-1.2, 1.2),
      rx: rand(0, 6), ry: rand(0, 6), rz: rand(0, 6), spin: rand(-12, 12),
      s: rand(this.size[0], this.size[1]), life: 0, maxLife: rand(1.6, 3.2), landed: false,
    };
    this.mesh.setColorAt(i, this.colours[(Math.random() * this.colours.length) | 0]);
    this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt) {
    let any = false;
    for (let i = 0; i < this.items.length; i++) {
      const b = this.items[i];
      if (!b) continue;
      any = true;
      b.life += dt;
      if (!b.landed) {
        b.vy -= 9.81 * dt;
        b.vx *= 1 - 1.5 * dt; b.vz *= 1 - 1.5 * dt;   // light bits get slowed by the air
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
        b.rx += b.spin * dt; b.rz += b.spin * 0.6 * dt;
        if (b.y <= 0.012) { b.y = 0.012; b.landed = true; b.rx = Math.PI / 2; b.rz = 0; }
      }
      // shrink away at the end of its life
      const fade = Math.min(1, (b.maxLife - b.life) / 0.6);
      if (fade <= 0) {
        this.items[i] = null;
        this.mesh.setMatrixAt(i, this._m.makeScale(0, 0, 0));
        continue;
      }
      this._e.set(b.rx, b.ry, b.rz);
      this._q.setFromEuler(this._e);
      const sz = b.s * fade;
      this._s.set(sz, this.flat ? sz * 0.5 : sz, sz);
      this.mesh.setMatrixAt(i, this._m.compose(this._p.set(b.x, b.y, b.z), this._q, this._s));
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i]) this.mesh.setMatrixAt(i, this._m.makeScale(0, 0, 0));
    }
    this.items.length = 0;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------
// METAL FLAKES: tiny shiny shavings left behind a bare rim. Each lies at
// its own slight tilt, so as you move some catch the light and glitter.
// ---------------------------------------------------------------------
export class MetalFlakes {
  constructor(scene, { max = 1500 } = {}) {
    this.max = max;
    this.next = 0;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xdfe3e8, metalness: 1, roughness: 0.18,
      emissive: 0x9aa3ad, emissiveIntensity: 0.15,   // a faint glint even in shade
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this.carry = {};
  }

  // Drop flakes behind a grinding rim: more the faster it's turning
  emit(id, pos, speed, dt) {
    let acc = (this.carry[id] || 0) + 30 * Math.min(1, speed / 12) * dt;
    while (acc >= 1) {
      const i = this.next;
      this.next = (this.next + 1) % this.max;
      this._e.set(rand(-0.5, 0.5), rand(0, Math.PI * 2), rand(-0.5, 0.5));   // each tilted to catch the light differently
      this._q.setFromEuler(this._e);
      const s = rand(0.006, 0.018);
      this._p.set(pos.x + rand(-0.12, 0.12), 0.008, pos.z + rand(-0.12, 0.12));
      this.mesh.setMatrixAt(i, this._m.compose(this._p, this._q, this._s.set(s, 1, s * rand(0.4, 1))));
      this.mesh.count = Math.max(this.mesh.count, i + 1);
      this.mesh.instanceMatrix.needsUpdate = true;
      acc -= 1;
    }
    this.carry[id] = acc;
  }

  clear() {
    this.mesh.count = 0;
    this.next = 0;
  }
}

// ---------------------------------------------------------------------
// LOOSE WHEEL: a wheel (just the rim, after a blowout) that has come off.
// It keeps the car's velocity at the moment it broke free, plus a kick
// outwards, rolls along spinning, starts to wobble as it slows, then
// topples over and spins down flat on the ground.
// ---------------------------------------------------------------------
export class LooseWheel {
  // parts: { rimGeo, spokeGeo, rimMat, spokeMat, radius }
  constructor(scene, parts) {
    this.radius = parts.radius;
    this.group = new THREE.Group();
    this.spinner = new THREE.Group();          // the part that rolls
    const rim = new THREE.Mesh(parts.rimGeo, parts.rimMat);
    rim.castShadow = true;
    this.spinner.add(rim);
    for (let k = 0; k < 2; k++) {
      const spoke = new THREE.Mesh(parts.spokeGeo, parts.spokeMat);
      spoke.rotation.x = k * Math.PI / 2;
      spoke.castShadow = true;
      this.spinner.add(spoke);
    }
    this.group.add(this.spinner);
    this.group.visible = false;
    scene.add(this.group);
    this.active = false;
  }

  // Break free at pos (world), moving at carVel, the car facing heading.
  // side: +1 if it's on the car's left, -1 on the right (it flies outwards)
  release(pos, carVel, heading, side, scale = 1) {
    const out = rand(1.2, 2.6);
    const lx = Math.cos(heading), lz = -Math.sin(heading);   // the car's left
    this.x = pos.x; this.z = pos.z;
    this.vx = carVel.x * rand(0.9, 1.05) + lx * side * out;
    this.vz = carVel.z * rand(0.9, 1.05) + lz * side * out;
    this.y = this.radius * scale;
    this.vy = rand(0.5, 1.5);                  // it hops as it breaks away
    this.roll = 0;                             // how far it has turned
    this.lean = 0;                             // 0 = upright, PI/2 = flat on the ground
    this.leanSpeed = 0;
    this.wobble = 0;
    this.scale = scale;
    this.active = true;
    this.group.visible = true;
    this.group.scale.setScalar(scale);
  }

  update(dt) {
    if (!this.active) return;
    const speed = Math.hypot(this.vx, this.vz);
    const r = this.radius * this.scale;
    // Rolling resistance (much more once it's lying down)
    const down = this.lean / (Math.PI / 2);
    const slow = 1.9 + 6 * down * down;              // a loose wheel scrubs and wobbles: stops in about 100 m from 70 km/h
    const k = speed > 0 ? Math.max(0, speed - slow * dt) / speed : 0;
    this.vx *= k; this.vz *= k;
    this.x += this.vx * dt; this.z += this.vz * dt;
    // Hops and bounces
    this.vy -= 9.81 * dt;
    this.y += this.vy * dt;
    const restY = r * Math.cos(this.lean) + 0.1 * this.scale * Math.sin(this.lean);   // lying flat: half its width up
    if (this.y < restY) { this.y = restY; this.vy = Math.abs(this.vy) > 1 ? -this.vy * 0.35 : 0; }
    // A rolling wheel stays up while it's fast; slow, it starts to wobble and topples
    if (speed < 6 || this.lean > 0.05) {
      this.leanSpeed += (2.5 * Math.sin(this.lean + 0.08) - 0.6 * this.leanSpeed) * dt * (1 + down);
      this.lean = Math.min(Math.PI / 2, this.lean + this.leanSpeed * dt);
      if (this.lean >= Math.PI / 2) this.leanSpeed = 0;
    }
    this.wobble += dt * (6 + 10 * down);
    this.roll += (speed / r) * dt * (1 - down * 0.8);
    // Point it the way it's travelling (once moving)
    if (speed > 0.3) this.heading = Math.atan2(this.vx, this.vz);
    this.group.position.set(this.x, this.y, this.z);
    // facing: the axle across the direction of travel; lean tips it over
    this.group.rotation.set(0, this.heading ?? 0, this.lean + Math.sin(this.wobble) * 0.06 * Math.min(1, down * 4 + (speed < 4 ? 0.3 : 0)), 'YXZ');
    this.spinner.rotation.x = this.roll;
    if (speed < 0.05 && this.lean >= Math.PI / 2 - 0.01) this.vx = this.vz = 0;
  }

  clear() {
    this.active = false;
    this.group.visible = false;
  }
}
