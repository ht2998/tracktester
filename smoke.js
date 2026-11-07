// =====================================================================
// SMOKE: tyre smoke when the tyres lose traction.
// All smoke puffs are drawn in ONE go as soft round points, and a fixed
// pool of puffs is reused (the oldest is recycled), so it stays cheap on
// phones no matter how long you do donuts for.
// =====================================================================

import * as THREE from 'three';

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(-mv.z, 0.1);   // bigger when closer
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float soft = 1.0 - r * r;      // fades to nothing at the edge
    gl_FragColor = vec4(uColor, vAlpha * soft * soft);
  }
`;

export class TyreSmoke {
  // The same system makes light tyre smoke and thick engine smoke:
  //   color      - smoke colour
  //   thickness  - how opaque each puff is (1 = light tyre smoke)
  //   sizeScale  - how big the puffs grow
  //   rise       - how fast puffs float upwards
  //   lifeScale  - how long puffs hang around
  constructor(scene, {
    maxParticles = 400, puffsPerSecond = 30, color = 0xdcdcdc,
    thickness = 1, sizeScale = 1, rise = 1, lifeScale = 1,
  } = {}) {
    this.max = maxParticles;
    this.rate = puffsPerSecond;   // per source, at full strength
    this.next = 0;                // next pool slot to reuse
    this.thickness = thickness;
    this.sizeScale = sizeScale;
    this.rise = rise;
    this.lifeScale = lifeScale;

    this.pos = new Float32Array(this.max * 3);
    this.size = new Float32Array(this.max);
    this.alpha = new Float32Array(this.max);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max).fill(1);
    this.maxLife = new Float32Array(this.max).fill(1);
    this.startSize = new Float32Array(this.max);
    this.endSize = new Float32Array(this.max);
    this.startAlpha = new Float32Array(this.max);

    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr = new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('aSize', this.sizeAttr);
    geo.setAttribute('aAlpha', this.alphaAttr);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uScale: { value: 500 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this.emitters = new Map();   // leftover fractions of a puff per tyre
  }

  // Keeps puffs the right size on screen; call on start and on resize
  setViewport(heightPixels, fovDegrees) {
    this.material.uniforms.uScale.value = heightPixels / (2 * Math.tan((fovDegrees * Math.PI) / 360));
  }

  // Call every frame for each tyre. strength 0-1; velocity = car's world velocity
  emitFrom(id, position, strength, velocity, dt) {
    let acc = this.emitters.get(id) || 0;
    if (strength < 0.05) {
      this.emitters.set(id, 0);
      return;
    }
    acc += this.rate * strength * dt;
    while (acc >= 1) {
      this.spawn(position, strength, velocity);
      acc -= 1;
    }
    this.emitters.set(id, acc);
  }

  spawn(p, strength, v) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    const r = () => Math.random() - 0.5;

    this.pos[i * 3] = p.x + r() * 0.3;
    this.pos[i * 3 + 1] = p.y;
    this.pos[i * 3 + 2] = p.z + r() * 0.3;
    // Smoke is left behind: it keeps only a little of the car's speed
    this.vel[i * 3] = v.x * 0.12 + r() * 0.8;
    this.vel[i * 3 + 1] = (0.3 + Math.random() * 0.35) * this.rise;
    this.vel[i * 3 + 2] = v.z * 0.12 + r() * 0.8;

    this.life[i] = 0;
    this.maxLife[i] = (1.6 + Math.random() * 1.2) * this.lifeScale;      // seconds
    this.startSize[i] = (0.4 + Math.random() * 0.3) * this.sizeScale;    // metres
    this.endSize[i] = (2.6 + Math.random() * 1.6) * this.sizeScale;
    this.startAlpha[i] = Math.min(0.95, (0.22 * strength + 0.04) * this.thickness);
  }

  update(dt) {
    const drag = Math.max(0, 1 - 1.6 * dt);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] >= this.maxLife[i]) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] += dt;
      const t = Math.min(1, this.life[i] / this.maxLife[i]);

      this.vel[i * 3] *= drag;
      this.vel[i * 3 + 2] *= drag;
      this.vel[i * 3 + 1] *= Math.max(0, 1 - 0.5 * dt);
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;

      // Grows quickly then slowly, fades in fast and out gently
      const grow = 1 - (1 - t) * (1 - t);
      this.size[i] = this.startSize[i] + (this.endSize[i] - this.startSize[i]) * grow;
      const fadeIn = Math.min(1, t / 0.08);
      this.alpha[i] = this.startAlpha[i] * fadeIn * Math.pow(1 - t, 1.5);
    }
    this.posAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
  }
}
