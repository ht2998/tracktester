// =====================================================================
// TOUCH: on-screen controls for phones and tablets.
//   Left thumb:  steering slider (drag left/right, springs back to centre)
//   Right thumb: brake and gas, with small - / + shift buttons beside the
//                gas (manual) or an R button (automatic and CVT), plus small
//                clutch and handbrake buttons above
//   Above the steering: a small horn button
//   Top left:    menu with camera, lights, reset and sound
// Only shown on touch screens (or add ?touch to the address to test).
// Every control tracks its own finger, so you can steer, brake and shift
// at the same time.
// =====================================================================

import { setTouch, tap } from './input.js';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches
    || new URLSearchParams(location.search).has('touch');
}

const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';

const STYLE = `
#touch, #touch * {
  box-sizing: border-box;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
#touch {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font-family: ${FONT};
  color: #f2efe6;
  z-index: 5;
}
#touch .t-btn {
  pointer-events: auto;
  touch-action: none;
  display: grid;
  place-items: center;
  border: 1px solid rgba(242, 239, 230, 0.22);
  border-radius: 14px;
  background: rgba(21, 24, 28, 0.55);
  color: #f2efe6;
  font: 600 17px ${FONT};
  letter-spacing: 0.02em;
}
#touch .t-btn.down { background: rgba(255, 122, 26, 0.55); border-color: #ff7a1a; }
#touch .t-btn.small { font-size: 15px; border-radius: 10px; }
#touch .t-btn.active { border-color: #ff7a1a; color: #ff7a1a; }

/* Steering slider, bottom left */
#touch .t-steer {
  position: absolute;
  left: calc(18px + env(safe-area-inset-left));
  bottom: calc(22px + env(safe-area-inset-bottom));
  width: min(42vw, 380px);
  height: 72px;
  pointer-events: auto;
  touch-action: none;
}
#touch .t-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 10px;
  margin-top: -5px;
  border-radius: 5px;
  background: rgba(21, 24, 28, 0.55);
  border: 1px solid rgba(242, 239, 230, 0.22);
}
#touch .t-centre {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 22px;
  margin: -11px 0 0 -1px;
  background: rgba(242, 239, 230, 0.4);
}
#touch .t-knob {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border-radius: 50%;
  background: rgba(21, 24, 28, 0.7);
  border: 2px solid rgba(242, 239, 230, 0.55);
  transition: transform 140ms ease-out;
}
#touch .t-steer.held .t-knob { transition: none; border-color: #ff7a1a; }

/* Pedals and shift buttons, bottom right */
#touch .t-right {
  position: absolute;
  right: calc(14px + env(safe-area-inset-right));
  bottom: calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
#touch .t-row { display: flex; align-items: center; gap: 8px; }
#touch .t-row.top { gap: 8px; margin-right: 36px; }   /* clears the side panel arrow */
/* While the settings panel is open, the right-hand controls step aside */
#touch.panel-open .t-right { visibility: hidden; pointer-events: none; }
#touch .t-brake { width: 76px; height: 104px; }
#touch .t-gas { width: 80px; height: 124px; }
#touch .t-shift { width: 44px; height: 44px; font-size: 22px; }
#touch .t-shift.hidden { visibility: hidden; }
#touch .t-hand { width: 92px; height: 40px; }
#touch .t-clutch { width: 76px; height: 40px; }

/* Horn, just above the steering slider on the left */
#touch .t-horn {
  position: absolute;
  left: calc(18px + env(safe-area-inset-left));
  bottom: calc(104px + env(safe-area-inset-bottom));
  width: 64px;
  height: 38px;
}

/* Menu, top left */
#touch .t-menu {
  position: absolute;
  left: calc(12px + env(safe-area-inset-left));
  top: calc(10px + env(safe-area-inset-top));
  width: 42px;
  height: 42px;
}
#touch .t-menu svg { display: block; }
#touch .t-sheet {
  position: absolute;
  left: calc(12px + env(safe-area-inset-left));
  top: calc(60px + env(safe-area-inset-top));
  display: none;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(21, 24, 28, 0.92);
  pointer-events: auto;
}
#touch .t-sheet.open { display: flex; }
#touch .t-sheet .t-btn { width: 140px; height: 42px; justify-items: start; padding: 0 14px; background: transparent; }

/* Portrait: ask to turn the phone */
#touch .t-rotate {
  position: absolute;
  inset: 0;
  display: none;
  place-items: center;
  padding: 24px;
  background: rgba(14, 16, 19, 0.92);
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  pointer-events: auto;
}
@media (orientation: portrait) { #touch .t-rotate { display: grid; } }
`;

export class TouchControls {
  constructor() {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.state = { throttle: 0, brake: 0, steer: 0, handbrake: false, clutch: false, horn: false };
    this.root = document.createElement('div');
    this.root.id = 'touch';

    // --- Steering slider ---
    this.steerBox = document.createElement('div');
    this.steerBox.className = 't-steer';
    this.steerBox.setAttribute('aria-label', 'Steering');
    this.steerBox.innerHTML = '<div class="t-track"></div><div class="t-centre"></div><div class="t-knob"></div>';
    this.knob = this.steerBox.querySelector('.t-knob');
    this.setupSteering();

    // --- Right-hand cluster ---
    const right = document.createElement('div');
    right.className = 't-right';
    const top = document.createElement('div');
    top.className = 't-row top';
    const clutch = this.holdButton('Clutch', 't-clutch small', 'clutch');
    const hand = this.holdButton('Handbrake', 't-hand small', 'handbrake');
    top.append(clutch, hand);

    const pedals = document.createElement('div');
    pedals.className = 't-row';
    const brake = this.holdButton('Brake', 't-brake', 'brake');
    this.downBtn = this.tapButton('−', 't-shift', 'shiftDown', 'Shift down');
    this.reverseBtn = this.tapButton('R', 't-shift', 'reverse', 'Reverse');
    const gas = this.holdButton('Gas', 't-gas', 'throttle');
    this.upBtn = this.tapButton('+', 't-shift', 'shiftUp', 'Shift up');
    pedals.append(brake, this.downBtn, this.reverseBtn, gas, this.upBtn);
    right.append(top, pedals);

    // --- Menu ---
    const menu = document.createElement('button');
    menu.type = 'button';
    menu.className = 't-btn t-menu';
    menu.setAttribute('aria-label', 'Menu');
    menu.setAttribute('aria-expanded', 'false');
    menu.innerHTML = '<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">'
      + '<path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    this.sheet = document.createElement('div');
    this.sheet.className = 't-sheet';
    menu.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const open = this.sheet.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    const item = (label, action) => {
      const b = this.tapButton(label, 'small', action, label);
      b.addEventListener('pointerup', () => {
        this.sheet.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
      return b;
    };
    this.soundItem = item('Sound: on', 'mute');
    this.lightsItem = item('Lights: off', 'lights');
    this.sheet.append(item('Switch camera', 'camera'), this.lightsItem, item('Reset car', 'reset'), this.soundItem);

    // --- Horn ---
    const horn = this.holdButton('Horn', 't-horn small', 'horn');

    // --- Portrait warning ---
    const rotate = document.createElement('div');
    rotate.className = 't-rotate';
    rotate.textContent = 'Turn your phone sideways to drive';

    this.root.append(this.steerBox, horn, right, menu, this.sheet, rotate);
    document.body.appendChild(this.root);

    // If the page loses focus, let go of everything
    const releaseAll = () => {
      Object.assign(this.state, { throttle: 0, brake: 0, steer: 0, handbrake: false, clutch: false, horn: false });
      setTouch(this.state);
      this.root.querySelectorAll('.down').forEach((el) => el.classList.remove('down'));
      this.knob.style.transform = '';
      this.steerBox.classList.remove('held');
    };
    window.addEventListener('blur', releaseAll);
    // The settings panel slides over the right-hand controls, so hide them
    // (and let go of anything held) while it's open
    window.addEventListener('sidepanel', (e) => {
      const open = !!(e.detail && e.detail.open);
      this.root.classList.toggle('panel-open', open);
      if (open) releaseAll();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  }

  // A button that's active while a finger is on it (gas, brake, handbrake, clutch, horn)
  holdButton(label, cls, key) {
    const b = document.createElement('div');
    b.className = `t-btn ${cls}`;
    b.textContent = label;
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', label);
    const on = typeof this.state[key] === 'boolean' ? true : 1;
    const off = typeof this.state[key] === 'boolean' ? false : 0;
    let finger = null;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      finger = e.pointerId;
      b.setPointerCapture(e.pointerId);
      b.classList.add('down');
      this.state[key] = on;
      setTouch(this.state);
    });
    const release = (e) => {
      if (e.pointerId !== finger) return;
      finger = null;
      b.classList.remove('down');
      this.state[key] = off;
      setTouch(this.state);
    };
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('lostpointercapture', release);
    return b;
  }

  // A button that does one thing per press (shift, reverse, menu items)
  tapButton(label, cls, action, name) {
    const b = document.createElement('div');
    b.className = `t-btn ${cls}`;
    b.textContent = label;
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', name);
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      tap(action);        // on press, not release, so shifts are instant
      b.classList.add('down');
    });
    const up = () => b.classList.remove('down');
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    return b;
  }

  setupSteering() {
    let finger = null;
    const move = (e) => {
      const rect = this.steerBox.getBoundingClientRect();
      const half = rect.width / 2;
      let v = (e.clientX - (rect.left + half)) / (half * 0.92);
      v = Math.max(-1, Math.min(1, v));
      if (Math.abs(v) < 0.04) v = 0;                      // a tiny dead zone in the middle
      this.knob.style.transform = `translateX(${v * half * 0.92}px)`;
      this.state.steer = -v;                              // the physics uses +1 = left
      setTouch(this.state);
    };
    this.steerBox.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      finger = e.pointerId;
      this.steerBox.setPointerCapture(e.pointerId);
      this.steerBox.classList.add('held');
      move(e);
    });
    this.steerBox.addEventListener('pointermove', (e) => {
      if (e.pointerId === finger) move(e);
    });
    const release = (e) => {
      if (e.pointerId !== finger) return;
      finger = null;
      this.steerBox.classList.remove('held');
      this.knob.style.transform = '';                     // springs back to the centre
      this.state.steer = 0;
      setTouch(this.state);
    };
    this.steerBox.addEventListener('pointerup', release);
    this.steerBox.addEventListener('pointercancel', release);
    this.steerBox.addEventListener('lostpointercapture', release);
  }

  // Called every frame: shows the right buttons for the current gearbox
  update({ transmission, gearLabel, muted, lights = 0 }) {
    const manual = transmission === 'manual';
    this.downBtn.style.display = manual ? '' : 'none';
    this.upBtn.classList.toggle('hidden', !manual);
    this.reverseBtn.style.display = manual ? 'none' : '';
    this.reverseBtn.classList.toggle('active', gearLabel === 'R');
    const soundText = muted ? 'Sound: off' : 'Sound: on';
    if (this.soundItem.textContent !== soundText) this.soundItem.textContent = soundText;
    const lightsText = ['Lights: off', 'Lights: dipped', 'Lights: main beam'][lights];
    if (this.lightsItem.textContent !== lightsText) this.lightsItem.textContent = lightsText;
  }
}
