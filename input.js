// =====================================================================
// INPUT: reads the keyboard and turns it into driving controls.
//   W / Up arrow     = throttle
//   S / Down arrow   = brake
//   A / Left arrow   = steer left
//   D / Right arrow  = steer right
//   Space            = handbrake
//   X (hold)         = clutch: rev the engine freely, let go to dump it
//   F (hold)         = horn
//   G                = headlights: off / auto / dipped / main beam
//   Q / E  or  , / . = shift down / up (manual gearbox; Q from 1st = reverse)
//   R                = reverse on / off (automatic and CVT, when stopped)
//   T                = change gearbox (manual / automatic / CVT)
//   M                = mute
//   C                = switch camera (chase / showroom)
//   Backspace        = reset the car
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 5;

const held = new Set();      // keys being held down right now
const tapped = new Set();    // one-off presses waiting to be used

// One-off keys and the action each one triggers
const TAP_KEYS = {
  KeyC: 'camera',
  KeyR: 'reverse',
  Backspace: 'reset',
  KeyQ: 'shiftDown',
  KeyE: 'shiftUp',
  // Alternative shift keys for the right hand. Many keyboards can't detect
  // Q or E while W and A/D are held ("ghosting"), so these always work.
  Comma: 'shiftDown',
  Period: 'shiftUp',
  KeyT: 'transmission',
  KeyM: 'mute',
  KeyG: 'lights',
  KeyL: 'racingLine',
};

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'KeyX', 'KeyF', ...Object.keys(TAP_KEYS),
]);

window.addEventListener('keydown', (e) => {
  // A focused slider or dropdown (side panel) gets the arrow keys instead of the car
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  if (!GAME_KEYS.has(e.code)) return;
  e.preventDefault();                 // stop arrows and space scrolling the page
  if (!e.repeat && TAP_KEYS[e.code]) tapped.add(TAP_KEYS[e.code]);
  held.add(e.code);
});

window.addEventListener('keyup', (e) => {
  held.delete(e.code);
});

// If the window loses focus, let go of everything so the car doesn't drive off on its own
window.addEventListener('blur', () => held.clear());

const controls = { throttle: 0, brake: 0, steer: 0, handbrake: false, clutch: false, horn: false };

// On-screen touch controls write their state here (see touch.js)
const touch = { throttle: 0, brake: 0, steer: 0, handbrake: false, clutch: false, horn: false };
export function setTouch(values) {
  Object.assign(touch, values);
}
// A touch button's one-off action (shift, reverse, camera, reset, mute, lights)
export function tap(name) {
  tapped.add(name);
}

// Keys (and the phone's pedal buttons) are on or off, but a foot isn't: the throttle
// squeezes on over about a third of a second (instead of stamping it
// straight to full, which spins the rear tyres out of every corner) and
// comes off quickly; the brake comes on a little faster.
let keyThrottleNow = 0, keyBrakeNow = 0, lastRead = 0;
// (how long the throttle takes to squeeze full on: longer on a very
// powerful car, so the tyres can be felt starting to slip before it's wide open)
let throttleUp = 0.35;
export function setThrottleFeel(powerToWeight) {
  // bhp per tonne: the Caterham about 190 (a third of a second); the
  // TT-88's 900 horsepower turbo over 1,500 (about 0.8 s)
  throttleUp = 0.35 + 0.45 * Math.min(1, Math.max(0, (powerToWeight - 250) / 1100));
}
const ease = (now, target, upTime, downTime, dt) => {
  const rate = dt / (target > now ? upTime : downTime);
  return target > now ? Math.min(target, now + rate) : Math.max(target, now - rate);
};

// Called once per frame: returns the current driving controls
// (keyboard and touch combined, so either works)
export function readControls() {
  const t = performance.now();
  const dt = lastRead ? Math.min(0.1, (t - lastRead) / 1000) : 1 / 60;
  lastRead = t;
  const left = held.has('KeyA') || held.has('ArrowLeft');
  const right = held.has('KeyD') || held.has('ArrowRight');
  const keyThrottle = held.has('KeyW') || held.has('ArrowUp') ? 1 : 0;
  const keyBrake = held.has('KeyS') || held.has('ArrowDown') ? 1 : 0;
  const keySteer = (left ? 1 : 0) - (right ? 1 : 0);   // +1 = left, -1 = right
  // (the phone's pedal buttons are on or off too, so they're eased the same way)
  keyThrottleNow = ease(keyThrottleNow, Math.max(keyThrottle, touch.throttle), throttleUp, 0.08, dt);
  keyBrakeNow = ease(keyBrakeNow, Math.max(keyBrake, touch.brake), 0.15, 0.06, dt);
  controls.throttle = keyThrottleNow;
  controls.brake = keyBrakeNow;
  controls.steer = keySteer !== 0 ? keySteer : touch.steer;
  controls.handbrake = held.has('Space') || touch.handbrake;
  controls.clutch = held.has('KeyX') || touch.clutch;
  controls.horn = held.has('KeyF') || touch.horn;
  return controls;
}

// Returns true once for each tap of a one-off key (see TAP_KEYS)
export function wasTapped(name) {
  if (tapped.has(name)) {
    tapped.delete(name);
    return true;
  }
  return false;
}
