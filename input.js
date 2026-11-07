// =====================================================================
// INPUT: reads the keyboard and turns it into driving controls.
//   W / Up arrow     = throttle
//   S / Down arrow   = brake
//   A / Left arrow   = steer left
//   D / Right arrow  = steer right
//   Space            = handbrake
//   Q / E            = shift down / up (manual gearbox)
//   R                = reverse gear on / off (when stopped)
//   T                = change gearbox (manual / automatic / CVT)
//   M                = mute
//   C                = switch camera (chase / showroom)
//   Backspace        = reset the car
// =====================================================================

const held = new Set();      // keys being held down right now
const tapped = new Set();    // one-off presses waiting to be used

// One-off keys and the action each one triggers
const TAP_KEYS = {
  KeyC: 'camera',
  KeyR: 'reverse',
  Backspace: 'reset',
  KeyQ: 'shiftDown',
  KeyE: 'shiftUp',
  KeyT: 'transmission',
  KeyM: 'mute',
};

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', ...Object.keys(TAP_KEYS),
]);

window.addEventListener('keydown', (e) => {
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

const controls = { throttle: 0, brake: 0, steer: 0, handbrake: false };

// Called once per frame: returns the current driving controls
export function readControls() {
  const left = held.has('KeyA') || held.has('ArrowLeft');
  const right = held.has('KeyD') || held.has('ArrowRight');
  controls.throttle = held.has('KeyW') || held.has('ArrowUp') ? 1 : 0;
  controls.brake = held.has('KeyS') || held.has('ArrowDown') ? 1 : 0;
  controls.steer = (left ? 1 : 0) - (right ? 1 : 0);   // +1 = left, -1 = right
  controls.handbrake = held.has('Space');
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
