// =====================================================================
// GROUND HEIGHT: how high the ground is at any point (x, z), shared by
// everything that sits on it or lands on it: skid marks, oil, puddles,
// debris, grass tufts, loose wheels, the camera. At Sepang the game hands
// over the circuit's hills (sepang.js); the test area is flat (0).
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 2;

import * as THREE from 'three';

let heightFn = () => 0;
let flat = true;
const UP = new THREE.Vector3(0, 1, 0);
const _n = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();

// Set the ground's shape: fn(x, z) -> height in metres
export function setGround(fn, deckFn = null) {
  heightFn = typeof fn === 'function' ? fn : () => 0;
  flat = typeof fn !== 'function';
  deckAt = deckFn;
}
// (a bridge: deckAt(x, z) gives its road's height there, or null)
let deckAt = null;

// The ground's height at (x, z). Where a bridge crosses, there are two: give y (how high the
// thing asking is) and anything up near the deck or above it is on the deck, anything well
// below drives underneath on the ground. Without y: the ground (under the bridge)
export function groundAt(x, z, y) {
  const g = heightFn(x, z);
  if (deckAt && y !== undefined) { const d = deckAt(x, z); if (d !== null && y > d - 2.2) return d; }
  return g;
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
