// =====================================================================
// DEBRIS: what flies out when the engine blows.
//   - A shower of sparks that bounce off the tarmac and cool from
//     white-yellow to orange, plus a split-second orange flash
//   - Jagged chunks of metal that bounce and skitter to a stop
//   - A blown piston that lands on its side and rolls away
//   - A snapped piece of camshaft that tumbles on its lobes
// The metal stays where it lands until the car is reset.
// =====================================================================

import * as THREE from 'three';

const GRAVITY = 9.81;
const rand = (a, b) => a + Math.random() * (b - a);

// --- Sparks: tiny glowing points, added together so they glow ---
const sparkVertex = /* glsl */ `
  attribute float aSize;
  attribute float aHeat;
  uniform float uScale;
  varying float vHeat;
  void main() {
    vHeat = aHeat;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkFragment = /* glsl */ `
  varying float vHeat;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0 || vHeat <= 0.0) discard;
    // Hot sparks are white-yellow, cooling ones go orange then deep red
    vec3 hot = vec3(1.0, 0.95, 0.75);
    vec3 warm = vec3(1.0, 0.55, 0.12);
    vec3 cool = vec3(0.7, 0.12, 0.02);
    vec3 col = vHeat > 0.5 ? mix(warm, hot, (vHeat - 0.5) * 2.0) : mix(cool, warm, vHeat * 2.0);
    float glow = (1.0 - r) * (1.0 - r);
    gl_FragColor = vec4(col * glow * 1.6, glow * vHeat);
  }
`;

// --- Shapes for the bigger pieces ---
function makePiston(material) {
  // A piston: the crown and skirt as one short cylinder, with the gudgeon
  // pin poking through the side. 87 mm across, like the real engine.
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0435, 0.0425, 0.065, 20), material);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.006, 20), material);
  crown.position.y = 0.033;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.095, 10), material);
  pin.rotation.z = Math.PI / 2;
  pin.position.y = -0.008;
  g.add(body, crown, pin);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

function makeCamshaftChunk(material) {
  // A snapped length of camshaft: a steel rod with egg-shaped lobes
  const g = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), material);
  g.add(rod);
  for (const [y, turn] of [[-0.06, 0], [-0.015, 1.9], [0.04, 3.7]]) {
    const lobe = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.016, 14), material);
    lobe.scale.set(1.4, 1, 1);                // egg-shaped
    lobe.position.set(Math.cos(turn) * 0.006, y, Math.sin(turn) * 0.006);
    lobe.rotation.y = turn;
    g.add(lobe);
  }
  // The jagged snapped end
  const snap = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.02, 6), material);
  snap.position.y = 0.11;
  g.add(snap);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

export class EngineDebris {
  constructor(scene, { maxSparks = 220, chunkCount = 12 } = {}) {
    this.scene = scene;
    this.maxSparks = maxSparks;

    // Sparks
    this.sparkPos = new Float32Array(maxSparks * 3);
    this.sparkVel = new Float32Array(maxSparks * 3);
    this.sparkHeat = new Float32Array(maxSparks);
    this.sparkSize = new Float32Array(maxSparks);
    this.sparkLife = new Float32Array(maxSparks);
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.sparkPos, 3).setUsage(THREE.DynamicDrawUsage);
    this.heatAttr = new THREE.BufferAttribute(this.sparkHeat, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('aHeat', this.heatAttr);
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sparkSize, 1));
    this.sparkMat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 } },
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(geo, this.sparkMat);
    this.sparks.frustumCulled = false;
    scene.add(this.sparks);

    // The flash: a brief orange light at the engine
    this.flash = new THREE.PointLight(0xff8a2a, 0, 9, 2);
    scene.add(this.flash);
    this.flashTime = 0;

    // Metal: jagged chunks (instanced), a piston and a camshaft piece
    const steel = new THREE.MeshStandardMaterial({ color: 0x55585e, metalness: 0.85, roughness: 0.45 });
    const scorched = new THREE.MeshStandardMaterial({ color: 0x3a3632, metalness: 0.7, roughness: 0.6 });
    const alloy = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 0.9, roughness: 0.3 });
    this.chunkCount = chunkCount;
    this.chunkMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), steel, chunkCount);
    this.chunkMesh.castShadow = true;
    this.chunkMesh.count = 0;
    this.chunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.chunkMesh);

    this.piston = makePiston(alloy);
    this.cam = makeCamshaftChunk(scorched);
    this.piston.visible = false;
    this.cam.visible = false;
    scene.add(this.piston, this.cam);

    this.pieces = [];   // every flying/rolling bit of metal
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._axis = new THREE.Vector3();
  }

  setViewport(heightPixels, fovDegrees) {
    this.sparkMat.uniforms.uScale.value = heightPixels / (2 * Math.tan((fovDegrees * Math.PI) / 360));
  }

  // The engine just blew. origin: engine bay (world), carVel: the car's velocity,
  // heading: which way the car faces
  burst(origin, carVel, heading) {
    const fx = Math.sin(heading), fz = Math.cos(heading);
    const lx = fz, lz = -fx;   // the car's left

    // Sparks: mostly out of the sides and down onto the road, some up
    for (let i = 0; i < this.maxSparks; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const out = rand(2, 9);
      this.sparkPos.set([origin.x + rand(-0.2, 0.2), origin.y - rand(0.1, 0.35), origin.z + rand(-0.2, 0.2)], i * 3);
      this.sparkVel.set([
        carVel.x * 0.9 + lx * side * out + fx * rand(-3, 3),
        rand(-1.5, 5.5),
        carVel.z * 0.9 + lz * side * out + fz * rand(-3, 3),
      ], i * 3);
      this.sparkLife[i] = rand(0.35, 1.1);
      this.sparkHeat[i] = 1;
      this.sparkSize[i] = rand(0.025, 0.06);
    }
    this.sparks.geometry.attributes.aSize.needsUpdate = true;

    this.flash.position.copy(origin);
    this.flashTime = 0.18;

    // Metal: flung out of the sides, up and forwards
    this.clearMetal();
    const fling = (speedOut, up) => {
      const side = Math.random() < 0.5 ? -1 : 1;
      return new THREE.Vector3(
        carVel.x * 0.85 + lx * side * speedOut + fx * rand(-1.5, 3),
        up,
        carVel.z * 0.85 + lz * side * speedOut + fz * rand(-1.5, 3),
      );
    };
    const spin = (n) => new THREE.Vector3(rand(-n, n), rand(-n, n), rand(-n, n));

    for (let i = 0; i < this.chunkCount; i++) {
      const size = rand(0.012, 0.035);
      this.pieces.push({
        kind: 'chunk', index: i, size, radius: size * 0.8,
        pos: new THREE.Vector3(origin.x, origin.y, origin.z),
        vel: fling(rand(2, 6), rand(2, 6)),
        rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6))),
        ang: spin(25), bounce: 0.35, rolls: false, resting: false,
        stretch: new THREE.Vector3(rand(0.7, 1.6), rand(0.5, 1), rand(0.7, 1.4)),   // jagged, uneven shapes
      });
    }
    this.chunkMesh.count = this.chunkCount;

    this.piston.visible = true;
    this.pieces.push({
      kind: 'piston', obj: this.piston, radius: 0.0435,
      pos: new THREE.Vector3(origin.x, origin.y, origin.z),
      vel: fling(rand(3.5, 5.5), rand(3, 5)),
      rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6))),
      ang: spin(18), bounce: 0.3, rolls: true, rollRadius: 0.0435,
      curve: rand(-0.6, 0.6),   // pistons roll in a gentle curve (slightly tapered)
      rolling: false, rollAngle: 0, resting: false,
    });

    this.cam.visible = true;
    this.pieces.push({
      kind: 'cam', obj: this.cam, radius: 0.02,
      pos: new THREE.Vector3(origin.x, origin.y, origin.z),
      vel: fling(rand(2.5, 4.5), rand(3.5, 6)),
      rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6))),
      ang: spin(22), bounce: 0.25, rolls: true, rollRadius: 0.02,
      lumpy: true,   // the lobes make it roll awkwardly
      curve: rand(-1.5, 1.5), rolling: false, rollAngle: 0, resting: false,
    });
  }

  update(dt) {
    // --- Sparks ---
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkHeat[i] <= 0) continue;
      const k = i * 3;
      this.sparkVel[k + 1] -= GRAVITY * dt;
      this.sparkVel[k] *= 1 - 0.8 * dt;
      this.sparkVel[k + 2] *= 1 - 0.8 * dt;
      this.sparkPos[k] += this.sparkVel[k] * dt;
      this.sparkPos[k + 1] += this.sparkVel[k + 1] * dt;
      this.sparkPos[k + 2] += this.sparkVel[k + 2] * dt;
      if (this.sparkPos[k + 1] < 0.01) {        // skip off the tarmac
        this.sparkPos[k + 1] = 0.01;
        this.sparkVel[k + 1] = Math.abs(this.sparkVel[k + 1]) * 0.35;
        this.sparkVel[k] *= 0.7;
        this.sparkVel[k + 2] *= 0.7;
      }
      this.sparkHeat[i] = Math.max(0, this.sparkHeat[i] - dt / this.sparkLife[i]);
    }
    this.posAttr.needsUpdate = true;
    this.heatAttr.needsUpdate = true;

    // --- Flash ---
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      this.flash.intensity = Math.max(0, this.flashTime / 0.18) * 40;
    } else if (this.flash.intensity !== 0) {
      this.flash.intensity = 0;
    }

    // --- Metal ---
    for (const p of this.pieces) {
      if (!p.resting) this.stepPiece(p, dt);
      this.drawPiece(p);
    }
    if (this.pieces.length) this.chunkMesh.instanceMatrix.needsUpdate = true;
  }

  stepPiece(p, dt) {
    const onGround = p.pos.y <= p.radius + 0.002;
    p.vel.y -= GRAVITY * dt;
    p.pos.addScaledVector(p.vel, dt);

    // Hit the ground: bounce, losing energy each time
    if (p.pos.y < p.radius) {
      p.pos.y = p.radius;
      if (p.vel.y < 0) {
        p.vel.y = -p.vel.y * p.bounce;
        // Each impact with the tarmac scrubs off some sideways speed too
        p.vel.x *= 0.7;
        p.vel.z *= 0.7;
      }
      if (Math.abs(p.vel.y) < 0.4) p.vel.y = 0;
      if (p.rolls) p.rolling = true;
    }

    if (p.rolling && p.vel.y === 0) {
      // Rolling along the ground on its side
      const speed = Math.hypot(p.vel.x, p.vel.z);
      // Gently curve, and slow down from rolling resistance (lumpy things far faster)
      const turn = p.curve * dt * Math.min(1, speed);
      const c = Math.cos(turn), s = Math.sin(turn);
      const vx = p.vel.x * c - p.vel.z * s;
      p.vel.z = p.vel.x * s + p.vel.z * c;
      p.vel.x = vx;
      const slow = (p.lumpy ? 3.2 : 1.3) * dt + 0.6 * dt * speed;
      const scale = speed > 0 ? Math.max(0, speed - slow) / speed : 0;
      p.vel.x *= scale;
      p.vel.z *= scale;
      p.rollAngle += (speed / p.rollRadius) * dt;
      if (speed < 0.03) { p.vel.set(0, 0, 0); p.resting = true; }
    } else if (onGround && p.vel.y === 0) {
      // Chunks: slide, scrape and tumble to a stop
      p.vel.x *= Math.max(0, 1 - 5 * dt);
      p.vel.z *= Math.max(0, 1 - 5 * dt);
      p.ang.multiplyScalar(Math.max(0, 1 - 6 * dt));
      if (Math.hypot(p.vel.x, p.vel.z) < 0.03 && p.ang.length() < 0.3) p.resting = true;
    }

    // Tumbling through the air
    if (!p.rolling || p.vel.y !== 0) {
      const w = p.ang.length();
      if (w > 0) {
        this._axis.copy(p.ang).divideScalar(w);
        this._q.setFromAxisAngle(this._axis, w * dt);
        p.rot.premultiply(this._q);
      }
    }
  }

  drawPiece(p) {
    if (p.kind === 'chunk') {
      this._m.compose(p.pos, p.rot, this._v.copy(p.stretch).multiplyScalar(p.size));
      this.chunkMesh.setMatrixAt(p.index, this._m);
      return;
    }
    if (p.rolling && (p.vel.y === 0 || p.resting)) {
      // Lying on its side: its axis across the direction it rolls, spinning about it
      const speed = Math.hypot(p.vel.x, p.vel.z);
      if (speed > 0.01) p.rollDir = Math.atan2(p.vel.x, p.vel.z);
      const dir = p.rollDir ?? 0;
      const lie = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);   // axis -> sideways
      const face = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dir);
      const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rollAngle);
      p.obj.quaternion.copy(face).multiply(lie).multiply(roll);
      // Lumpy parts bob up and down as the lobes come round
      const bob = p.lumpy ? Math.abs(Math.sin(p.rollAngle * 1.5)) * 0.006 : 0;
      p.obj.position.set(p.pos.x, p.radius + bob, p.pos.z);
    } else {
      p.obj.quaternion.copy(p.rot);
      p.obj.position.copy(p.pos);
    }
  }

  clearMetal() {
    this.pieces.length = 0;
    this.chunkMesh.count = 0;
    this.piston.visible = false;
    this.cam.visible = false;
  }

  clear() {
    this.clearMetal();
    this.sparkHeat.fill(0);
    this.heatAttr.needsUpdate = true;
    this.flashTime = 0;
    this.flash.intensity = 0;
  }
}
