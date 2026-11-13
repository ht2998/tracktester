// =====================================================================
// GROUND HEIGHT: how high the ground is at any point (x, z), shared by
// everything that sits on it or lands on it: skid marks, oil, puddles,
// debris, grass tufts, loose wheels, the camera. At Sepang the game hands
// over the circuit's hills (sepang.js); the test area is flat (0).
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

import * as THREE from 'three';

let heightFn = () => 0;
let flat = true;
const UP = new THREE.Vector3(0, 1, 0);
const _n = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();

// Set the ground's shape: fn(x, z) -> height in metres
export function setGround(fn) {
  heightFn = typeof fn === 'function' ? fn : () => 0;
  flat = typeof fn !== 'function';
}

// The ground's height at (x, z)
export function groundAt(x, z) {
  return heightFn(x, z);
}

// A flat thing lying on the ground at (x, z) (a puddle, a mark), turned
// by `yaw` round the upright: tilted to lie along the slope there.
// Writes the turn into `out` (a Quaternion) and returns it.
export function lieOnGround(out, x, z, yaw = 0) {
  _qb.setFromAxisAngle(UP, yaw);
  if (flat) return out.copy(_qb);
  const e = 0.5;
  const dx = (heightFn(x + e, z) - heightFn(x - e, z)) / (2 * e);
  const dz = (heightFn(x, z + e) - heightFn(x, z - e)) / (2 * e);
  _n.set(-dx, 1, -dz).normalize();
  _qa.setFromUnitVectors(UP, _n);
  return out.copy(_qa).multiply(_qb);
}
