// =====================================================================
// OIL: a leaking engine drips oil onto the track.
// Each drip is a small dark, glossy spot. A tyre rolling over a spot
// loses most of its grip for that moment. All spots are one instanced
// object (drawn in a single go), and the oldest is reused once the pool
// is full, so a long leak never slows the game down.
// =====================================================================

import * as THREE from 'three';

export class OilSlicks {
  constructor(scene, { maxSpots = 400, slickGrip = 0.35 } = {}) {
    this.max = maxSpots;
    this.slickGrip = slickGrip;   // grip left on oil (1 = clean tarmac)
    this.spots = [];              // { x, z, r }
    this.next = 0;
    this.distanceSinceDrip = 0;
    this.timeSinceDrip = 0;

    const geo = new THREE.CircleGeometry(1, 20);
    geo.rotateX(-Math.PI / 2);   // lie flat on the ground
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0d0c0b,
      roughness: 0.12,           // wet and shiny
      metalness: 0.4,
      transparent: true,
      opacity: 0.88,
      polygonOffset: true,       // sits on the tarmac without flickering
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.max);
    this.mesh.count = 0;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  // Call every frame. carX/carZ/heading place the drip under the engine.
  // rate: 0 = no leak, 1 = damaged and dripping, 2 = blown and pouring
  update(dt, carX, carZ, heading, speed, rate) {
    if (rate <= 0) return;
    this.distanceSinceDrip += Math.abs(speed) * dt;
    this.timeSinceDrip += dt;
    const everyMetres = rate >= 2 ? 0.6 : 1.4;
    const everySeconds = rate >= 2 ? 0.9 : 2.5;   // still drips while stopped, pooling up
    if (this.distanceSinceDrip >= everyMetres || this.timeSinceDrip >= everySeconds) {
      this.distanceSinceDrip = 0;
      this.timeSinceDrip = 0;
      // Drips fall from under the front of the car (the engine), a little spread out
      const fx = Math.sin(heading), fz = Math.cos(heading);
      const side = (Math.random() - 0.5) * 0.5;
      const x = carX + fx * 0.6 + fz * side;
      const z = carZ + fz * 0.6 - fx * side;
      const r = (rate >= 2 ? 0.22 : 0.15) + Math.random() * 0.12;
      this.addSpot(x, z, r);
    }
  }

  addSpot(x, z, r) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    this.spots[i] = { x, z, r };
    // Slightly oval and randomly turned, so it looks like a splash, not a coin
    this._p.set(x, 0.004, z);
    this._q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
    this._s.set(r, 1, r * (0.65 + Math.random() * 0.35));
    this._m.compose(this._p, this._q, this._s);
    this.mesh.setMatrixAt(i, this._m);
    this.mesh.count = Math.max(this.mesh.count, i + 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // Grip at a point on the ground: low on oil, normal everywhere else
  gripAt(x, z) {
    for (let i = 0; i < this.spots.length; i++) {
      const s = this.spots[i];
      const dx = x - s.x;
      const dz = z - s.z;
      const reach = s.r + 0.1;   // the tyre's contact patch has some width too
      if (dx * dx + dz * dz < reach * reach) return this.slickGrip;
    }
    return 1;
  }

  clear() {
    this.spots.length = 0;
    this.next = 0;
    this.mesh.count = 0;
    this.distanceSinceDrip = 0;
    this.timeSinceDrip = 0;
  }
}
