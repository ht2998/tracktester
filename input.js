// =====================================================================
// INPUT: reads the keyboard and turns it into driving controls.
//   W / Up arrow     = throttle
//   S / Down arrow   = brake, then reverse once stopped
//   A / Left arrow   = steer left
//   D / Right arrow  = steer right
//   Space            = handbrake
//   C                = switch camera (chase / showroom)
//   R                = reset the car
// =====================================================================

const held = new Set();      // keys being held down right now
const tapped = new Set();    // one-off presses waiting to be used (camera, reset)

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'KeyC', 'KeyR',
]);

window.addEventListener('keydown', (e) => {
  if (!GAME_KEYS.has(e.code)) return;
  e.preventDefault();                 // stop arrows and space scrolling the page
  if (!e.repeat) {
    if (e.code === 'KeyC') tapped.add('camera');
    if (e.code === 'KeyR') tapped.add('reset');
  }
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

// Returns true once for each tap of a one-off key ('camera' or 'reset')
export function wasTapped(name) {
  if (tapped.has(name)) {
    tapped.delete(name);
    return true;
  }
  return false;
}
