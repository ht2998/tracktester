// =====================================================================
// UPDATES: the "What's new" screen, and the old-file check.
//
// WHAT'S NEW: one card per update, swiped left and right (or dragged, or
// the arrow keys). The dots underneath show where you are: the current one
// big and orange in the middle, the ones either side smaller the further
// away they are. It opens by itself showing every update you've missed
// since your last visit (just the latest one on a first visit), and from
// the side panel any time.
//
// OLD-FILE CHECK: every file has a BUILD number. versions.json lists the
// latest number for each, and is always fetched fresh (never from the
// browser's saved copies). If any file the game loaded is older, the game
// fetches fresh copies and reloads once; if that doesn't fix it, the card
// says exactly which files are out of date.
//
// ADDING AN UPDATE: put a new entry at the TOP of UPDATES, and bump the
// BUILD number of every changed file (in the file and in versions.json).
// =====================================================================

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see below)
export const BUILD = 3;

// Newest first
export const UPDATES = [
  {
    id: 12, date: '9 Nov 2026', title: 'Sky, sun rays and bonnet camera',
    items: [
      'Sun rays: shafts of sunlight blocked by buildings, posts and the car, strongest with a low sun',
      'Real-looking clouds: soft heaps from small wisps to big clumps, and a full overcast when cloudy',
      'Subtle cloud shadows drifting over the ground',
      'Stronger sunlight and crisper, darker shadows',
      'Bonnet camera (C cycles chase, bonnet, showroom): drag to look around, even straight up at the sky',
      'The showroom camera can now tilt low enough to look up past the car',
      'Cloudy skies turn properly grey, with darker clouds',
    ],
  },
  {
    id: 11, date: '9 Nov 2026', title: 'This screen',
    items: [
      'A "What\'s new" card that shows every update you\'ve missed since your last visit',
      'Swipe or drag between updates; the orange dot shows where you are',
      'The game checks it loaded the newest copy of every file, refreshes old ones by itself, and tells you if any are still out of date',
      'Open it any time from the side panel',
    ],
  },
  {
    id: 10, date: '8 Nov 2026', title: 'Time of day and weather',
    items: [
      'The sun moves across the sky: white at midday, then yellow, then orange as it sets',
      'Moon and stars at night, with the stars slowly turning',
      'Clear or cloudy, set in the side panel, or changing by itself',
      'Time speed (60x by default, a day in 24 minutes) and a lock time button',
      'Stronger headlights, and shadows that reach much further',
    ],
  },
  {
    id: 9, date: '8 Nov 2026', title: 'Horn, lights and taller barriers',
    items: [
      'Horn on F, headlights on G (off, dipped, main beam), plus tail and brake lights',
      'Green or blue headlight lamp on the rev counter',
      'Concrete walls 25% taller, tyre walls four tyres high',
      'Catch fences lean in over the track at the top',
      'Phone: horn button and lights in the menu',
    ],
  },
  {
    id: 8, date: '8 Nov 2026', title: 'Scenery, grass and echoes',
    items: [
      'Pit garages, race control, a concrete wall, Armco, tyre walls and catch fences',
      'Every car sound echoes off buildings, from the side they\'re on',
      'A grass patch: three lengths of grass, flattened by the tyres into brown tracks',
      'Grass sound: a low grind with a slight squelch',
    ],
  },
  {
    id: 7, date: '8 Nov 2026', title: 'Blowouts',
    items: [
      'Worn-out tyres, or flat ones driven fast, can burst with a bang',
      'The tyre shreds for about 30 seconds, leaving a trail of rubber that adds a little grip',
      'Then it\'s down to the bare rim: sparks, a sharp metal screech and poor steering',
      'Rim sparks now work properly',
    ],
  },
  {
    id: 6, date: '8 Nov 2026', title: 'More tyres',
    items: [
      'Intermediate and wet tyres (for rain, coming later)',
      'Dirt tyres grip best on gravel, grass and soil',
      'Tyre pressure shown in 5 colours around each wear bar, flashing red when nearly flat',
      'Phone: tyre bars next to the rev counter, and the side panel hides the controls',
    ],
  },
  {
    id: 5, date: '8 Nov 2026', title: 'Gravel trap',
    items: [
      'A 10 m gravel patch: slippery, draggy and bumpy-looking',
      '40% chance of a slow puncture each time you drive through it',
      'Tan dust, tan tyre tracks and a deep rumbling sound',
    ],
  },
  {
    id: 4, date: '7 Nov 2026', title: 'Tyres',
    items: [
      'Tyre wear for each wheel, with four wear bars next to the rev counter',
      'Slow punctures from engine debris, with a hiss',
      'Tyre menu: Comfort, Sports, Racing, Dirt and Snow',
      'Check engine light',
    ],
  },
  {
    id: 3, date: '7 Nov 2026', title: 'Assists and phone controls',
    items: [
      'ABS and traction control, levels 0 to 5, in the side panel',
      'Clutch on X for revving and launches',
      'Phone controls: steering slider, pedals, shift buttons and a menu',
    ],
  },
  {
    id: 2, date: '7 Nov 2026', title: 'Damage and effects',
    items: [
      'Engine damage from over-revving: a clunk, smoke, an oil leak, flying debris and sparks',
      'Oil and fuel gauges',
      'Tyre smoke, squeal and skid marks',
    ],
  },
  {
    id: 1, date: '7 Nov 2026', title: 'First drive',
    items: [
      'The Caterham-style car, with chase and showroom cameras',
      'Driving physics, an engine sound built from scratch, and three gearboxes',
      'Speedometer, rev counter and shift lights',
    ],
  },
];

const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';
const SEEN_KEY = 'tracktester-last-update';
const RETRY_KEY = 'tracktester-refreshed';

const store = {
  get(k, area = 'localStorage') { try { return window[area].getItem(k); } catch { return null; } },
  set(k, v, area = 'localStorage') { try { window[area].setItem(k, v); } catch { /* private mode etc. */ } },
  remove(k, area = 'localStorage') { try { window[area].removeItem(k); } catch { /* ignore */ } },
};

// ---------------------------------------------------------------------
// OLD-FILE CHECK
// loaded: { 'sound.js': 3, ... } = the BUILD of each file the game is running
// ---------------------------------------------------------------------
export async function checkFiles(loaded) {
  let latest;
  try {
    const r = await fetch('versions.json', { cache: 'no-store' });
    if (!r.ok) return { known: false, stale: [] };
    latest = (await r.json()).files || {};
  } catch {
    return { known: false, stale: [] };
  }
  const stale = Object.entries(latest)
    .filter(([file, v]) => (loaded[file] ?? 0) < v)
    .map(([file, v]) => ({ file, have: loaded[file] ?? 0, latest: v }));
  return { known: true, stale };
}

// Fetch fresh copies of the old files into the browser's cache, then reload
// once. (If it's still old afterwards, we don't loop: the card explains.)
async function refreshOnce(stale) {
  if (store.get(RETRY_KEY, 'sessionStorage')) return false;
  store.set(RETRY_KEY, '1', 'sessionStorage');
  try {
    await Promise.all(stale.map((s) => fetch(s.file, { cache: 'reload' })));
  } catch { /* offline: just reload */ }
  location.reload();
  return true;
}

// ---------------------------------------------------------------------
// THE SCREEN
// ---------------------------------------------------------------------
const STYLE = `
#updates { position: fixed; inset: 0; z-index: 60; display: none; place-items: center;
  background: rgba(8, 10, 12, 0.55); font-family: ${FONT}; color: #f2efe6; padding: 12px; box-sizing: border-box; }
#updates.open { display: grid; }
#updates * { box-sizing: border-box; }
#updates .up-card { width: min(460px, 100%); max-height: min(560px, 100%); display: flex; flex-direction: column;
  background: #15181c; border: 1px solid rgba(242, 239, 230, 0.14); border-radius: 16px; overflow: hidden;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); }
#updates .up-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 16px 18px 4px; }
#updates .up-title { font-size: 24px; font-weight: 700; letter-spacing: 0.01em; }
#updates .up-close { background: none; border: 0; color: rgba(242, 239, 230, 0.6); font: 600 26px ${FONT}; line-height: 1;
  cursor: pointer; padding: 0 2px; }
#updates .up-close:hover { color: #f2efe6; }
#updates .up-sub { padding: 0 18px; color: rgba(242, 239, 230, 0.6); font-size: 15px; }
#updates .up-status { margin: 10px 18px 0; padding: 7px 10px; border-radius: 8px; font-size: 14px; font-weight: 600;
  background: rgba(57, 200, 106, 0.12); color: #7fe0a0; }
#updates .up-status.warn { background: rgba(255, 122, 26, 0.14); color: #ffa45c; }
#updates .up-status.unknown { background: rgba(242, 239, 230, 0.06); color: rgba(242, 239, 230, 0.55); }
#updates .up-view { position: relative; overflow: hidden; margin-top: 12px; flex: 1; min-height: 0; touch-action: pan-y; cursor: grab; }
#updates .up-view.dragging { cursor: grabbing; }
#updates .up-track { display: flex; height: 100%; transition: transform 300ms cubic-bezier(.2,.8,.2,1); }
#updates .up-view.dragging .up-track { transition: none; }
#updates .up-slide { flex: 0 0 100%; padding: 2px 18px 6px; overflow-y: auto; user-select: none; -webkit-user-select: none; }
#updates .up-meta { color: #ff7a1a; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
#updates .up-name { font-size: 22px; font-weight: 700; margin: 2px 0 8px; }
#updates .up-list { margin: 0; padding-left: 18px; font: 400 16px system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.4;
  color: rgba(242, 239, 230, 0.88); }
#updates .up-list li { margin: 0 0 6px; }
#updates .up-dots { position: relative; width: 98px; height: 16px; margin: 10px auto 0; overflow: hidden; }
#updates .up-dotrow { position: absolute; left: 0; top: 0; height: 16px; display: flex; transition: transform 280ms ease; }
#updates .up-dot { flex: 0 0 14px; height: 16px; display: grid; place-items: center; cursor: pointer; }
#updates .up-dot i { display: block; border-radius: 50%; background: rgba(242, 239, 230, 0.45);
  transition: width 260ms ease, height 260ms ease, background-color 260ms ease, opacity 260ms ease; }
#updates .up-dot.on i { background: #ff7a1a; }
#updates .up-count { text-align: center; color: rgba(242, 239, 230, 0.5); font-size: 13px; margin-top: 2px; }
#updates .up-foot { display: flex; gap: 10px; justify-content: space-between; align-items: center; padding: 12px 18px 16px; }
#updates .up-btn { font: 600 16px ${FONT}; border-radius: 10px; padding: 8px 16px; cursor: pointer; letter-spacing: 0.02em; }
#updates .up-all { background: none; border: 1px solid rgba(242, 239, 230, 0.22); color: #f2efe6; }
#updates .up-all[hidden] { display: none; }
#updates .up-ok { background: #ff7a1a; border: 1px solid #ff7a1a; color: #15181c; margin-left: auto; }
#updates .up-btn:focus-visible, #updates .up-close:focus-visible { outline: 2px solid #ff7a1a; outline-offset: 2px; }
`;

// Dot size by how far it is from the current one (px); further = hidden
const DOT_SIZES = [10, 7, 5, 3.5];

export class UpdateScreen {
  constructor() {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'updates';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', "What's new");
    this.root.innerHTML = `
      <div class="up-card">
        <div class="up-head"><span class="up-title">What's new</span>
          <button type="button" class="up-close" aria-label="Close">×</button></div>
        <div class="up-sub"></div>
        <div class="up-status unknown">Checking your files…</div>
        <div class="up-view"><div class="up-track"></div></div>
        <div class="up-dots" aria-hidden="true"><div class="up-dotrow"></div></div>
        <div class="up-count"></div>
        <div class="up-foot">
          <button type="button" class="up-btn up-all">See all updates</button>
          <button type="button" class="up-btn up-ok">Got it</button>
        </div>
      </div>`;
    document.body.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    this.sub = q('.up-sub');
    this.status = q('.up-status');
    this.view = q('.up-view');
    this.track = q('.up-track');
    this.dotrow = q('.up-dotrow');
    this.count = q('.up-count');
    this.allBtn = q('.up-all');

    q('.up-close').addEventListener('click', () => this.close());
    q('.up-ok').addEventListener('click', () => this.close());
    this.allBtn.addEventListener('click', () => this.show(UPDATES, 'Every update so far'));
    this.root.addEventListener('pointerdown', (e) => { if (e.target === this.root) this.close(); });
    this.setupSwipe();

    // While open, the keys work the screen instead of the car
    this.onKey = (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Tab') return;
      e.stopImmediatePropagation();
      if (e.type !== 'keydown') return;
      if (e.key === 'ArrowRight') this.go(this.index + 1);
      else if (e.key === 'ArrowLeft') this.go(this.index - 1);
      else if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); this.close(); }
    };
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('keyup', this.onKey, true);

    this.items = [];
    this.index = 0;
    this.isOpen = false;
  }

  get open() { return this.isOpen; }

  // Shows a set of updates (newest first) in the carousel
  show(list, subtitle) {
    this.items = list;
    this.index = 0;
    this.sub.textContent = subtitle;
    this.allBtn.hidden = list.length >= UPDATES.length;
    this.track.innerHTML = '';
    this.dotrow.innerHTML = '';
    list.forEach((u, i) => {
      const slide = document.createElement('div');
      slide.className = 'up-slide';
      slide.setAttribute('aria-roledescription', 'slide');
      slide.innerHTML = `<div class="up-meta">Update ${u.id} · ${u.date}</div><div class="up-name"></div><ul class="up-list"></ul>`;
      slide.querySelector('.up-name').textContent = u.title;
      const ul = slide.querySelector('.up-list');
      for (const item of u.items) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      }
      this.track.appendChild(slide);
      const dot = document.createElement('span');
      dot.className = 'up-dot';
      dot.innerHTML = '<i></i>';
      dot.addEventListener('click', () => this.go(i));
      this.dotrow.appendChild(dot);
    });
    this.root.classList.add('open');
    this.isOpen = true;
    this.go(0);
    this.root.querySelector('.up-ok').focus({ preventScroll: true });
  }

  // Slide to card i, and slide the dots so the current one sits in the middle
  go(i) {
    const n = this.items.length;
    this.index = Math.max(0, Math.min(n - 1, i));
    this.track.style.transform = `translateX(${-this.index * 100}%)`;
    const SLOT = 14, WIDTH = 98;
    this.dotrow.style.transform = `translateX(${WIDTH / 2 - SLOT / 2 - this.index * SLOT}px)`;
    [...this.dotrow.children].forEach((dot, k) => {
      const d = Math.abs(k - this.index);
      const size = DOT_SIZES[d] ?? 0;
      const ball = dot.firstChild;
      ball.style.width = ball.style.height = `${size}px`;
      ball.style.opacity = size ? '1' : '0';
      dot.classList.toggle('on', d === 0);
    });
    this.count.textContent = n > 1 ? `${this.index + 1} of ${n}` : '';
  }

  // Drag or swipe sideways to move between cards
  setupSwipe() {
    let startX = 0, startY = 0, dx = 0, dragging = false, id = null, t0 = 0;
    this.view.addEventListener('pointerdown', (e) => {
      if (this.items.length < 2) return;
      dragging = true; id = e.pointerId; startX = e.clientX; startY = e.clientY; dx = 0; t0 = performance.now();
    });
    this.view.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== id) return;
      dx = e.clientX - startX;
      if (!this.view.classList.contains('dragging')) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - startY)) return;   // still deciding: scroll or swipe
        this.view.classList.add('dragging');
        this.view.setPointerCapture(id);
      }
      const edge = (this.index === 0 && dx > 0) || (this.index === this.items.length - 1 && dx < 0);
      const pull = edge ? dx * 0.3 : dx;   // resists at the ends
      this.track.style.transform = `translateX(calc(${-this.index * 100}% + ${pull}px))`;
    });
    const end = (e) => {
      if (!dragging || e.pointerId !== id) return;
      dragging = false;
      if (!this.view.classList.contains('dragging')) return;
      this.view.classList.remove('dragging');
      const fast = Math.abs(dx) / Math.max(1, performance.now() - t0) > 0.45;
      const far = Math.abs(dx) > this.view.clientWidth * 0.22;
      // swipe left (finger moves left) = next update
      if ((fast || far) && dx < 0) this.go(this.index + 1);
      else if ((fast || far) && dx > 0) this.go(this.index - 1);
      else this.go(this.index);
    };
    this.view.addEventListener('pointerup', end);
    this.view.addEventListener('pointercancel', end);
  }

  // The file-check line at the top of the card
  setStatus(result) {
    const s = this.status;
    s.classList.remove('warn', 'unknown');
    if (!result || !result.known) {
      s.classList.add('unknown');
      s.textContent = "Couldn't check your files (is versions.json uploaded?)";
    } else if (result.stale.length) {
      s.classList.add('warn');
      const list = result.stale.map((f) => `${f.file} (v${f.have}, newest v${f.latest})`).join(', ');
      s.textContent = `Old copies loaded: ${list}. Refresh the page, or open the game in a private window.`;
    } else {
      s.textContent = `All files up to date: update ${UPDATES[0].id}`;
    }
  }

  close() {
    this.root.classList.remove('open');
    this.isOpen = false;
    store.set(SEEN_KEY, String(UPDATES[0].id));
    if (document.activeElement && this.root.contains(document.activeElement)) document.activeElement.blur();
  }
}

// ---------------------------------------------------------------------
// Called once when the game starts. loaded = { file: BUILD } for every
// file the game is running. Returns the screen (so the side panel can
// open it again).
// ---------------------------------------------------------------------
export function startUpdates(loaded) {
  const screen = new UpdateScreen();
  const lastSeen = Number(store.get(SEEN_KEY) || 0);
  const missed = UPDATES.filter((u) => u.id > lastSeen);
  const firstVisit = !lastSeen;

  checkFiles(loaded).then(async (result) => {
    if (result.known && result.stale.length) {
      if (await refreshOnce(result.stale)) return;   // reloading with fresh files
    } else {
      store.remove(RETRY_KEY, 'sessionStorage');
    }
    screen.setStatus(result);
    const stillOld = result.known && result.stale.length;
    if (missed.length || stillOld) {
      if (firstVisit) screen.show(UPDATES.slice(0, 1), 'The latest update');
      else if (missed.length) {
        screen.show(missed, missed.length === 1 ? '1 update since your last visit'
          : `${missed.length} updates since your last visit`);
      } else screen.show(UPDATES.slice(0, 1), 'Some files are out of date');
    }
  });

  // From the side panel: everything, with the file check already filled in
  screen.openAll = () => screen.show(UPDATES, 'Every update so far');
  return screen;
}
