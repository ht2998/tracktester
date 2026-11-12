// =====================================================================
// UPDATES: the "What's new" screen, and the old-file check.
//
// WHAT'S NEW: one slide per feature, each with a picture drawn in code,
// swiped left and right (or dragged, or the arrow keys). The dots underneath
// show where you are: the current one big and orange in the middle, the
// ones either side smaller the further away they are. It opens by itself
// showing every update you've missed since your last visit (just the latest
// one on a first visit). "See all updates" (and the side panel) shows every
// update as a short scrollable list; tap one to see its slides.
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
export const BUILD = 24;

// Newest first. Each feature: [short title, what it does, picture]
// (the pictures are drawn in code: see PICTURES below)
export const UPDATES = [
  {
    id: 26, date: '12 Nov 2026', title: 'Dents, scratches, the dash HUD and grass to the horizon',
    items: [
      ['The body really dents', 'Crashes used to just slide and squash the nose as one solid block. Now every body panel is made of a fine mesh that gets pushed in around exactly where you hit, deepest in the middle and crumpled at the edges, and the dents add up hit after hit. Front, back and sides all dent, the grille, headlights and tail lights move with the metal around them, and Backspace straightens it all out', 'debris'],
      ['The car\'s dials are the HUD', 'The rev counter and speedo on the car\'s dashboard now show the very same dials as the on-screen HUD (needles, gear, shift and warning lights), all the time and from every camera. The screen above the wheel shows the whole HUD row and updates smoothly in every view. Only in the driver\'s view does the on-screen HUD go away', 'gauges'],
      ['Mirror on the windscreen', 'The windscreen has a thin frame now, and the rear-view mirror hangs from the middle of its top bar instead of floating in the air', 'cockpit'],
      ['Grass and gravel as far as you can see', 'At Sepang the 3D grass and loose gravel stones now fill everything the camera can see (about 70 m ahead on computers, 35 m on phones), thinning out with distance, instead of only a circle round the car', 'grass'],
      ['Scratches stay on the car', 'Scratches are shorter and always sit on the face of the panel they\'re on, clear of its rounded edges, instead of long lines sticking out past the end of the bodywork. They move with any dent under them too', 'sparks'],
    ],
  },
  {
    id: 25, date: '12 Nov 2026', title: 'Real grass and gravel at Sepang',
    items: [
      ['3D grass at Sepang', 'The same 3D grass as the test area now grows all round Sepang: short, medium and long tufts that sway in the wind and get pressed flat where you drive over them (and stay flat). It grows around the car and fades into the painted grass further away, so it stays smooth on phones too', 'grass'],
      ['Proper gravel traps', 'Sepang\'s gravel traps have the test area\'s gravel: bumpy stones that catch the light, with loose 3D stones scattered on top near the car. They sound the same too (the crunch on gravel and the swish on grass)', 'gravel'],
      ['Pit lane entry and exit', 'Fixed the pit lane entry and exit only appearing when you got close: they now show from any distance, like the rest of the track', 'car'],
    ],
  },
  {
    id: 24, date: '12 Nov 2026', title: 'No more googly eyes',
    items: [
      ['Proper headlights', 'The headlights were shiny chrome balls with a flat disc on the front, and the dark road reflecting in their bottoms made them look like eyes looking down. Now each is a real lamp: a satin chrome bowl, a domed glass front over a silver reflector, and a chrome rim. A crash knocks each one askew its own way', 'lights'],
    ],
  },
  {
    id: 23, date: '12 Nov 2026', title: 'Engine damage is a chance',
    items: [
      ['Second hits may hurt the engine', 'Hitting something nose-first again after holing the radiator no longer always damages the engine: it MAY. The harder the hit, the more likely, and how badly it gets damaged varies. Light knocks usually get away with it', 'debris'],
    ],
  },
  {
    id: 22, date: '12 Nov 2026', title: 'Hands on the wheel',
    items: [
      ['Always a hand on the wheel', 'Fixed the wheel turning with no hands on it when you sounded the horn while shifting: if the left hand is on the gear stick or handbrake, the right hand stays on the rim and presses the horn with its thumb', 'driver'],
    ],
  },
  {
    id: 21, date: '12 Nov 2026', title: 'The dashboard, on the dashboard',
    items: [
      ['Same dials in the car', 'In the driver\'s view, the screen on the car\'s dash now shows exactly the same dials as the on-screen dashboard: tyre bars, rev counter with the gear, speedo with the shift and warning lights, and the fuel and oil gauges', 'gauges'],
    ],
  },
  {
    id: 20, date: '12 Nov 2026', title: 'A proper cockpit and driver',
    items: [
      ['Legs and pedals', 'The cockpit now has a real footwell with clutch, brake and throttle pedals. The driver has legs: the right foot works the throttle and moves across to the brake, and the left foot rests on the floor until you press the clutch. You can see the knees move from the driver\'s seat', 'cockpit'],
      ['Horn', 'Press the horn and the driver\'s right hand presses the middle of the steering wheel, which has a horn button now', 'driver'],
      ['Gear stick and handbrake', 'The gear stick has a leather gaiter, a chrome collar and a knob with the gear pattern printed on top. The handbrake has a rubber grip, a release button and a ratchet', 'cockpit'],
      ['Smoother driver', 'Rounded arms and legs, a properly shaped body, hips, gloves with thumbs and racing boots', 'driver'],
      ['Smoother car', 'The body, nose and rear wings have rounded edges instead of sharp corners, and the cockpit is open and deep instead of a flat lid with the seats on top', 'car'],
    ],
  },
  {
    id: 19, date: '12 Nov 2026', title: 'Easier on phones',
    items: [
      ['Settings tab is easier to find', 'On phones and tablets the settings tab on the right edge is bigger, with an orange cog, and it glows gently until you open it the first time', 'phone'],
      ['Headlights button', 'A lights button beside the horn: tap it to switch between off, auto, on and main beam. It shows which one it\'s on (green when on, blue on main beam)', 'lights'],
    ],
  },
  {
    id: 18, date: '12 Nov 2026', title: 'Crash damage, fire, tyre temperatures and wind',
    items: [
      ['Crash damage depends on the hit', 'Nose first: the nose crumples and the radiator gets holed (steam, leaking coolant). Hit the front again, or very hard, and the engine behind it gets damaged. Backwards into a wall: the tail crumples and the fuel tank can split and leak. Side hits knock that wheel out of line, so the car pulls to one side, and a hard one can puncture the tyre. Soft tyre walls do less damage than concrete', 'debris'],
      ['Overheating', 'With a holed radiator the coolant runs out, the engine gets hotter (new temperature light: amber when hot, flashing red when boiling) and then cooks itself if you keep pushing', 'gauges'],
      ['Fire', 'A big hit on a badly damaged engine, or with fuel leaking, can set the engine bay alight: flames, black smoke and an orange glow. The fire wrecks the engine and burns out after a while. Backspace repairs everything', 'fire'],
      ['Scratches', 'Scrape along a wall and the side of the car gets scratched down to bare metal, where it touched', 'sparks'],
      ['Tyre temperatures', 'Tyres warm up as they work (cornering, braking, sliding) and cool in the air, and much faster in the rain. Each type grips best in its own range; cold or overheated tyres grip less, and hot ones wear faster. The tyre bars show each tyre\'s temperature: blue cold, green right, red hot', 'tyres'],
      ['Tyres last longer', 'Fixed tyres wearing out in under a lap: the front tyres were being worn as if they were sliding whenever they were near their grip limit. Wheelspin wears the rears less too', 'tyres'],
      ['Better tyres in the rain', 'Tyres wear less in the wet (it keeps them cool), wet tyres clear more water and grip better in it, and treaded tyres throw sheets of water out to the sides', 'aquaplane'],
      ['Easier to read dash in the driver\'s view', 'The dash screen is bigger and sits in a pod on top of the dash, straight ahead, seen through the top of the steering wheel, so the gear stick can\'t hide it. Each tyre shows its temperature and how much tread is left', 'cockpit'],
      ['Wind', 'It\'s breezy on a clear day and blows hard in a storm, in gusts: the rain slants, the clouds race across, the grass sways, and smoke, steam and dust blow away downwind', 'storm'],
      ['Bare rims and lost wheels', 'A bare rim now scores pale grey lines into the road instead of tyre marks, the flying bits are lighter metal flakes, and a corner with its wheel gone no longer throws sparks', 'wheeloff'],
      ['Rims stay inside the tyres', 'Fixed the rim sometimes poking through a squashed tyre', 'tread'],
      ['Oil runs out gradually', 'As the oil runs low the trail gets thinner and patchier, then only the odd drop', 'debris'],
      ['Update screen once', 'The update screen now only pops up once for each update, not every time you open or refresh the game', 'update'],
    ],
  },
  {
    id: 17, date: '12 Nov 2026', title: 'Sepang, and barriers that bend where you hit them',
    items: [
      ['Sepang', 'A flat mock-up of Sepang International Circuit: 5.5 km and 15 turns, traced from the real track outline. Pick it under Track in the side panel (the game reloads)', 'car'],
      ['Kerbs and run-off', 'Red and white kerbs on every corner, yellow sausage kerbs and orange bollards at the tightest apexes, green grass mesh, and gravel traps or painted run-off outside the corners', 'tyres'],
      ['Barriers round the track', 'Armco and tyre walls behind the run-off, kept well clear of the rest of the track', 'barriers'],
      ['Pit lane and grandstand', 'Pit lane with entry and exit, pit wall and catch fence, a long row of garages, and the main grandstand under a big roof (dry underneath in the rain)', 'garage'],
      ['Bollards fall over', 'Clip a bollard and it gets knocked flat without stopping the car', 'barriers'],
      ['Catch fences cave in', 'The wire mesh dents only where the car hits it: deepest at car height, wider and deeper the harder you hit. Posts lean only as far as the mesh pulls them, and the leaning top moves with them', 'barriers'],
      ['More grip', 'Every tyre grips about 20% more, and a bit of wheelspin no longer throws the back out. Sports Medium now corners at about 1.4 g, Racing Softs at about 1.75 g', 'tyres'],
      ['Warning lights', 'New lamps in the speedo: ABS (flashes while it works, steady when switched off), TCS (flashes while it cuts power, shows OFF when switched off), a skid light that flashes when the car slides, and a red handbrake light', 'gauges'],
      ['Fuel gauge', 'A petrol pump symbol with an arrow showing the fuel cap is on the car\'s left (there\'s a cap on the rear deck now too)', 'gauges'],
      ['Auto headlights', 'G (or the phone menu) now goes off, auto, dipped, main beam. Auto is the default: the lights come on by themselves at dusk, at night and in proper rain, with an A beside the light symbol', 'lights'],
      ['Stable under braking', 'The brakes now do most of their work at the front, and braking uses up some of each tyre\'s cornering grip. Braking hard into a corner (like Sepang turn 1) now gives a little understeer instead of spinning you round. You can still kick the back out with the throttle or handbrake', 'tyres'],
      ['Dirt tyres look right', 'They\'re round again, with a tread of big blocks and deep grooves painted on, instead of a lumpy shape', 'tread'],
      ['Armco bends', 'The rails bend in a smooth curve exactly where you hit, the bottom rail most, and the posts lean only as far as the rail is pushed', 'barriers'],
    ],
  },
  {
    id: 16, date: '10 Nov 2026', title: 'Crashes',
    items: [
      ['Solid buildings and barriers', 'You can no longer drive through the garages, race control, walls, Armco, tyre walls or fences. Hit one and the car stops, bounces back a little, and spins if you hit it off-centre', 'barriers'],
      ['Armco dents', 'Hit the Armco and the rails bend back around the impact and the posts lean over. Glancing hits slide you along it', 'barriers'],
      ['Tyre walls squash', 'The stacks squash back and get knocked askew, and they push you back out', 'barriers'],
      ['Catch fences bulge', 'The mesh stretches back and catches the car', 'barriers'],
      ['Concrete cracks', 'Concrete walls don\'t move, but a hit leaves cracks (bigger the harder you hit) and knocks off chips', 'barriers'],
      ['Garages are solid inside too', 'Drive into a bay and you\'ll hit the racking, the tool chests and the oil drums', 'garage'],
      ['No rain indoors', 'Rain stops at the roofs of the garages and race control, so it\'s dry inside', 'rain'],
    ],
  },
  {
    id: 15, date: '10 Nov 2026', title: 'Tyre looks, cockpit dash and a new update screen',
    items: [
      ['F1-style tyre colours', 'Racing tyres show a coloured band on the sidewall: Soft red, Medium yellow, Hard white. Intermediates are green and Wets are blue', 'tyres'],
      ['A tread for every tyre', 'Road tyres have grooves and blocks, Intermediates shallow grooves, Wets deep arrow-shaped grooves, and slicks are smooth. You can see the tread turning', 'tread'],
      ['Knobbly dirt tyres', 'Dirt tyres have big chunky blocks standing out of the tread', 'dirt'],
      ['Snow studs and chains', 'Snow tyres have zigzag sipes, metal studs, and snow chains wrapped round them', 'snow'],
      ['One slide per feature', 'New updates show each feature on its own slide with a picture. "See all updates" is now a short list you can scroll; tap an update to see its slides', 'update'],
      ['Easier on phones', 'Smaller text on phones, and you can drag up and down to scroll on any slide', 'phone'],
      ['Garage tool chests fixed', 'The red tool chests no longer poke into the garage walls', 'garage'],
      ['Driver in a race suit', 'Red race suit with white stripes, harness belts, a HANS collar and a striped helmet. He\'s a little shorter now too', 'driver'],
      ['Dash display in the cockpit', 'In the driver\'s-eye view the on-screen dials disappear and everything shows on a display in the dashboard: shift lights, gear, speed, revs, fuel, oil, tyres and warnings', 'cockpit'],
      ['New rain and thunder sounds', 'Light rain is soft separate taps on the car and road; thunder is a louder crack and rattle into a big rolling boom, louder the closer the strike', 'storm'],
      ['Grip in the wet depends on your tread', 'Each tyre can only clear so much water a second through its grooves. Go faster or hit deeper water than it can clear and it starts aquaplaning: slicks struggle even on a damp track, road tyres slide in puddles at speed, full wets cope with almost anything', 'aquaplane'],
      ['Puddles slow you down', 'Standing water always takes some grip, even at low speed, and you hear a "psssht" of spray as you go through', 'puddles'],
      ['Mud sound', 'A deeper splashing hiss with a breathy "pffff" as the tyres churn through mud', 'grass'],
      ['Spray and dust all the time', 'Spray on wet roads, dust on gravel, and grass clippings and dust on grass now fly whenever you drive, not just when sliding', 'rain'],
      ['Bigger grass patch', 'About five times bigger (19 m by 28 m), with six muddy spots when it rains', 'grass'],
      ['Driver sits up straight', 'Shoulders back against the seat and his head on top, not poking forward', 'driver'],
      ['Proper cockpit dials', 'The rev counter and speedo needles sweep the right way, with printed numbers, a red zone on the rev counter, and a row of shift lights along the top of the dash', 'gauges'],
      ['Closer cockpit view', 'The driver\'s-eye camera sits a little further forward, nearer the wheel', 'cockpit'],
    ],
  },
  {
    id: 14, date: '10 Nov 2026', title: 'Louder echoes',
    items: [
      ['Louder echoes', 'Engine echoes off buildings and walls are much more noticeable, carry further, and sound clearer', 'echo'],
    ],
  },
  {
    id: 13, date: '10 Nov 2026', title: 'Rain, open garages and the driver\'s seat',
    items: [
      ['Rain', 'Drizzle, light, moderate, heavy and thunderstorm (Weather menu). The track gets wet, then dries out afterwards, faster in sunshine', 'rain'],
      ['Wet grip', 'Wets and Intermediates grip best in the wet; slicks slide. Hit a puddle fast and you can aquaplane', 'aquaplane'],
      ['Puddles and mud', 'Puddles form in random spots on the tarmac; mud forms on the grass later and more slowly', 'puddles'],
      ['Splashes, spray and lightning', 'Raindrops splash and ripple in puddles, spray flies off the tyres (thicker through puddles), and storms bring lightning and rolling thunder', 'storm'],
      ['Rain sounds', 'Separate drops in light rain, a steady roar from moderate rain up; tyres swish on a wet road and slosh through puddles', 'rainsound'],
      ['Rain washes the track', 'Rubber marks fade away in the rain; oil spreads out wider as it fades', 'wash'],
      ['Grass and mud flying', 'Grass throws up clippings and brown dust; wet grass sprays brown, worse in mud', 'grass'],
      ['Wheels can come off', 'Bare rims drop glittery metal shavings and grind down until the wheel comes off and rolls away; the frame then scrapes along in sparks', 'wheeloff'],
      ['Thicker drift smoke', 'Tyre smoke gets thicker the harder you slide', 'drift'],
      ['Open pit garages', 'Roller doors up, with racks of parts, tool chests, wheel stacks, jacks and lights inside', 'garage'],
      ['Bigger engine failures', 'Up to 25 pieces fly out, including a rocker arm, a valve spring cap and a piece of the oil pan', 'debris'],
      ['New cameras', 'Close chase, a T-cam on the roll bar, and a driver\'s-eye cockpit view with working mirrors (C to cycle)', 'cockpit'],
      ['A driver in the car', 'He steers, shifts with the lever (manual) or paddles (automatic), and pulls the handbrake', 'driver'],
    ],
  },
  {
    id: 12, date: '9 Nov 2026', title: 'Sky, sun rays and bonnet camera',
    items: [
      ['Sun rays', 'Shafts of sunlight blocked by buildings, posts and the car, strongest with a low sun', 'sunrays'],
      ['Real-looking clouds', 'Soft heaps from small wisps to big clumps, and a full overcast when cloudy', 'clouds'],
      ['Cloud shadows', 'Subtle cloud shadows drift over the ground', 'clouds'],
      ['Stronger sunlight', 'Crisper, darker shadows', 'sunrays'],
      ['Bonnet camera', 'A view from the bonnet: drag to look around, even straight up at the sky', 'bonnet'],
      ['Lower showroom camera', 'The showroom camera can tilt low enough to look up past the car', 'car'],
      ['Grey cloudy skies', 'Cloudy skies turn properly grey, with darker clouds', 'clouds'],
    ],
  },
  {
    id: 11, date: '9 Nov 2026', title: 'This screen',
    items: [
      ['What\'s new', 'Shows every update you\'ve missed since your last visit', 'update'],
      ['Swipe between slides', 'Swipe or drag; the orange dot shows where you are', 'update'],
      ['File check', 'The game checks it loaded the newest copy of every file, refreshes old ones by itself, and tells you if any are still out of date', 'files'],
      ['Open it any time', 'From the side panel', 'update'],
    ],
  },
  {
    id: 10, date: '8 Nov 2026', title: 'Time of day and weather',
    items: [
      ['Moving sun', 'White at midday, then yellow, then orange as it sets', 'sunset'],
      ['Moon and stars', 'At night, with the stars slowly turning', 'night'],
      ['Weather', 'Clear or cloudy, set in the side panel, or changing by itself', 'clouds'],
      ['Time speed', '60x by default (a day in 24 minutes), and a lock time button', 'clock'],
      ['Headlights and shadows', 'Stronger headlights, and shadows that reach much further', 'lights'],
    ],
  },
  {
    id: 9, date: '8 Nov 2026', title: 'Horn, lights and taller barriers',
    items: [
      ['Horn and lights', 'Horn on F, headlights on G (off, dipped, main beam), plus tail and brake lights', 'lights'],
      ['Headlight lamp', 'Green or blue lamp on the rev counter', 'gauges'],
      ['Taller barriers', 'Concrete walls 25% taller, tyre walls four tyres high', 'barriers'],
      ['Leaning catch fences', 'They lean in over the track at the top', 'barriers'],
      ['Phone horn and lights', 'A horn button, and lights in the menu', 'phone'],
    ],
  },
  {
    id: 8, date: '8 Nov 2026', title: 'Scenery, grass and echoes',
    items: [
      ['Scenery', 'Pit garages, race control, a concrete wall, Armco, tyre walls and catch fences', 'barriers'],
      ['Echoes', 'Every car sound echoes off buildings, from the side they\'re on', 'echo'],
      ['Grass patch', 'Three lengths of grass, flattened by the tyres into brown tracks', 'grass'],
      ['Grass sound', 'A low grind with a slight squelch', 'grass'],
    ],
  },
  {
    id: 7, date: '8 Nov 2026', title: 'Blowouts',
    items: [
      ['Blowouts', 'Worn-out tyres, or flat ones driven fast, can burst with a bang', 'blowout'],
      ['Shredding', 'The tyre shreds for about 30 seconds, leaving a trail of rubber that adds a little grip', 'blowout'],
      ['Bare rim', 'Sparks, a sharp metal screech and poor steering', 'sparks'],
      ['Rim sparks fixed', 'Rim sparks now work properly', 'sparks'],
    ],
  },
  {
    id: 6, date: '8 Nov 2026', title: 'More tyres',
    items: [
      ['Wet weather tyres', 'Intermediates and Wets', 'tyres'],
      ['Dirt tyres', 'Grip best on gravel, grass and soil', 'dirt'],
      ['Tyre pressure', 'Shown in 5 colours around each wear bar, flashing red when nearly flat', 'gauges'],
      ['Phone tyre bars', 'Next to the rev counter; the side panel hides the controls', 'phone'],
    ],
  },
  {
    id: 5, date: '8 Nov 2026', title: 'Gravel trap',
    items: [
      ['Gravel trap', 'A 10 m gravel patch: slippery, draggy and bumpy-looking', 'gravel'],
      ['Punctures', '40% chance of a slow puncture each time you drive through it', 'gravel'],
      ['Dust and rumble', 'Tan dust, tan tyre tracks and a deep rumbling sound', 'gravel'],
    ],
  },
  {
    id: 4, date: '7 Nov 2026', title: 'Tyres',
    items: [
      ['Tyre wear', 'Wear for each wheel, with four wear bars next to the rev counter', 'gauges'],
      ['Slow punctures', 'From engine debris, with a hiss', 'debris'],
      ['Tyre menu', 'Comfort, Sports, Racing, Dirt and Snow', 'tyres'],
      ['Check engine light', 'Lights up when the engine is hurt', 'gauges'],
    ],
  },
  {
    id: 3, date: '7 Nov 2026', title: 'Assists and phone controls',
    items: [
      ['ABS and traction control', 'Levels 0 to 5, in the side panel', 'gauges'],
      ['Clutch', 'On X, for revving and launches', 'car'],
      ['Phone controls', 'Steering slider, pedals, shift buttons and a menu', 'phone'],
    ],
  },
  {
    id: 2, date: '7 Nov 2026', title: 'Damage and effects',
    items: [
      ['Engine damage', 'Over-revving can blow the engine: a clunk, smoke, an oil leak, flying debris and sparks', 'debris'],
      ['Oil and fuel gauges', 'Keep an eye on both', 'gauges'],
      ['Tyre smoke and skid marks', 'With squeal', 'drift'],
    ],
  },
  {
    id: 1, date: '7 Nov 2026', title: 'First drive',
    items: [
      ['The car', 'A Caterham-style car, with chase and showroom cameras', 'car'],
      ['Driving and sound', 'Driving physics, an engine sound built from scratch, and three gearboxes', 'car'],
      ['Gauges', 'Speedometer, rev counter and shift lights', 'gauges'],
    ],
  },
];

const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';
const SEEN_KEY = 'tracktester-last-update';
const STALE_KEY = 'tracktester-stale-shown';   // which old files we've already warned about
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
// PICTURES: a small drawing for each feature, painted in code on a
// canvas (no image files to upload). Drawn in a 320 x 150 space and
// scaled to fit. PICTURES[tag](c) paints one.
// ---------------------------------------------------------------------
const PW = 320, PH = 150;
const ORANGE = '#ff7a1a', GREEN = '#0f4d2c';

function sky(c, top, bottom, groundY = 112, ground = '#4a4d50') {
  const g = c.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, PW, groundY);
  c.fillStyle = ground;
  c.fillRect(0, groundY, PW, PH - groundY);
}
function circle(c, x, y, r, fill, stroke, lw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
function line(c, pts, colour, lw = 2) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.strokeStyle = colour;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}
function poly(c, pts, fill) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
// A tyre seen from the side: black rubber, an optional coloured band, a silver rim
function wheel(c, x, y, r, band = null, rim = true) {
  circle(c, x, y, r, '#151516');
  if (band) circle(c, x, y, r * 0.82, null, band, Math.max(1.5, r * 0.09));
  if (rim) {
    circle(c, x, y, r * 0.6, '#b8bcc2');
    circle(c, x, y, r * 0.18, '#3a3d42');
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.4;
      line(c, [x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55], '#3a3d42', r * 0.1);
    }
  }
}
// The car from the side, facing right. x = rear end, y = ground, s = scale
function car(c, x, y, s = 1, colour = GREEN) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  poly(c, [6, -14, 108, -14, 112, -24, 66, -26, 58, -34, 40, -34, 34, -28, 4, -28], colour);   // body tub and nose
  poly(c, [70, -26, 112, -24, 112, -15, 70, -15], '#c9ccd0');                                   // aluminium nose
  line(c, [30, -28, 30, -46, 38, -46, 38, -30], '#e8e8e8', 2.5);                                 // roll bar
  circle(c, 46, -40, 7, '#f2f2f2');                                                              // helmet
  poly(c, [47, -42, 53, -41, 53, -37, 47, -38], '#111418');                                      // visor
  poly(c, [62, -34, 66, -42, 68, -42, 64, -34], 'rgba(200,220,240,0.6)');                       // windscreen
  c.beginPath(); c.arc(94, -14, 15, Math.PI * 1.05, Math.PI * 1.95); c.fillStyle = colour; c.fill();   // front wing
  poly(c, [4, -28, 26, -28, 26, -22, 4, -22], colour);                                           // rear wing
  wheel(c, 16, -11, 11);
  wheel(c, 94, -11, 11);
  c.restore();
}
function building(c, x, y, w, h, colour = '#cfcbc2') {
  c.fillStyle = colour;
  c.fillRect(x, y - h, w, h);
  c.fillStyle = 'rgba(40,60,80,0.55)';
  for (let wy = y - h + 6; wy < y - 8; wy += 12) for (let wx = x + 5; wx < x + w - 8; wx += 12) c.fillRect(wx, wy, 7, 6);
}
function rainLines(c, n, colour = 'rgba(210,225,240,0.55)', len = 12) {
  for (let i = 0; i < n; i++) {
    const x = (i * 53) % PW, y = (i * 37) % PH;
    line(c, [x, y, x - 3, y + len], colour, 1);
  }
}
function puff(c, x, y, r, colour) {
  for (const [dx, dy, k] of [[0, 0, 1], [r * 0.7, -r * 0.3, 0.8], [-r * 0.7, -r * 0.2, 0.75], [r * 0.2, -r * 0.6, 0.7]]) circle(c, x + dx, y + dy, r * k, colour);
}
function dial(c, x, y, r, value, label) {
  circle(c, x, y, r, '#0b0d10', '#3a3f46', 2);
  for (let k = 0; k <= 8; k++) {
    const a = Math.PI * 0.75 + k / 8 * Math.PI * 1.5;
    line(c, [x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92], k > 6 ? '#ff3b30' : '#d8d8d8', 2);
  }
  const a = Math.PI * 0.75 + value * Math.PI * 1.5;
  line(c, [x, y, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], ORANGE, 3);
  circle(c, x, y, 4, '#d8d8d8');
  c.fillStyle = '#8a929c'; c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText(label, x, y + r * 0.55);
}
function steeringWheel(c, x, y, r) {
  circle(c, x, y, r, null, '#1d1d1f', r * 0.16);
  line(c, [x - r, y, x + r, y], '#c9ccd0', r * 0.1);
  line(c, [x, y, x, y + r], '#c9ccd0', r * 0.1);
  circle(c, x, y, r * 0.25, '#1d1d1f');
  line(c, [x, y - r - r * 0.05, x, y - r + r * 0.12], '#c81d25', r * 0.14);
}

const PICTURES = {
  car(c) { sky(c, '#7fb6ea', '#cfe4f5'); car(c, 100, 124, 1.15); },
  fire(c) {
    sky(c, '#2a2f3a', '#5a5f66');
    car(c, 100, 124, 1.15);
    for (let k = 0; k < 9; k++) circle(c, 190 + (k % 3) * 9 - 9, 40 - k * 3, 22 - k * 1.5, `rgba(40, 40, 42, ${0.55 - k * 0.05})`);   // smoke
    for (let k = 0; k < 7; k++) circle(c, 186 + Math.sin(k * 2.1) * 9, 96 - k * 7, 12 - k * 1.3, k < 3 ? '#ff6a1a' : '#ffc640');   // flames
  },
  gauges(c) {
    c.fillStyle = '#15181c'; c.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 10; i++) circle(c, 70 + i * 20, 18, 6, i < 4 ? '#2bdc4a' : i < 7 ? '#ff2a2a' : '#1b1f25');
    dial(c, 110, 88, 50, 0.72, 'rpm');
    dial(c, 220, 88, 42, 0.45, 'km/h');
  },
  update(c) {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, PW, PH);
    c.fillStyle = '#15181c'; c.fillRect(80, 14, 160, 122);
    c.fillStyle = '#3a4048'; c.fillRect(92, 26, 136, 52);
    c.fillStyle = '#f2efe6'; c.fillRect(92, 86, 90, 8);
    c.fillStyle = '#8a929c'; c.fillRect(92, 100, 120, 5); c.fillRect(92, 110, 100, 5);
    [3, 5, 9, 5, 3].forEach((r, k) => circle(c, 140 + k * 10, 125, r / 2 + 1, k === 2 ? ORANGE : '#8a929c'));
  },
  phone(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    c.fillStyle = '#111'; c.beginPath(); c.roundRect(40, 30, 240, 100, 14); c.fill();
    c.fillStyle = '#6fa7dd'; c.fillRect(50, 38, 220, 84);
    car(c, 120, 110, 0.55);
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(60, 104, 70, 8); circle(c, 95, 108, 7, ORANGE);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(230, 80, 26, 34); c.fillRect(198, 92, 26, 22);
  },
  clouds(c) {
    sky(c, '#8fb9e3', '#dde9f3', 112, '#4a4d50');
    puff(c, 80, 50, 22, '#f4f6f8'); puff(c, 210, 36, 28, '#eef1f4'); puff(c, 280, 70, 14, '#f4f6f8');
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.beginPath(); c.ellipse(90, 126, 50, 7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(220, 134, 60, 8, 0, 0, Math.PI * 2); c.fill();
  },
  tyres(c) {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, PW, PH);
    ['#e8262b', '#f4d21f', '#f2f2ee', '#2fae49', '#2a6fe0'].forEach((b, k) => wheel(c, 40 + k * 60, 72, 27, b));
    c.fillStyle = '#c9ccd0'; c.font = '12px sans-serif'; c.textAlign = 'center';
    ['Soft', 'Medium', 'Hard', 'Inter', 'Wet'].forEach((t, k) => c.fillText(t, 40 + k * 60, 120));
  },
  tread(c) {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, PW, PH);
    const strip = (x, draw) => { c.save(); c.beginPath(); c.rect(x, 18, 70, 114); c.clip(); c.fillStyle = '#1b1b1c'; c.fillRect(x, 18, 70, 114); draw(x); c.restore(); };
    strip(20, () => {});                                                                       // slick
    strip(95, (x) => { for (let y = 14; y < 140; y += 16) { line(c, [x + 8, y, x + 30, y + 10], '#060606', 4); line(c, [x + 62, y, x + 40, y + 10], '#060606', 4); } });   // wet arrows
    strip(170, (x) => { line(c, [x + 23, 18, x + 23, 132], '#060606', 5); line(c, [x + 47, 18, x + 47, 132], '#060606', 5); for (let y = 22; y < 132; y += 14) line(c, [x, y, x + 18, y + 3], '#060606', 3); });   // road
    strip(245, (x) => { for (let y = 22; y < 132; y += 18) for (const dx of [6, 40]) { c.fillStyle = '#2a2a2b'; c.fillRect(x + dx + ((y / 18) % 2) * 12, y, 22, 12); } });   // knobbly
  },
  dirt(c) {
    sky(c, '#b9c9d6', '#e7dccb', 112, '#8c6c48');
    circle(c, 160, 72, 52, '#151516');
    for (let k = 0; k < 20; k++) {
      const a = k / 20 * Math.PI * 2;
      c.save(); c.translate(160 + Math.cos(a) * 54, 72 + Math.sin(a) * 54); c.rotate(a);
      c.fillStyle = '#2c2c2e'; c.fillRect(-6, -8, 11, 16); c.restore();
    }
    circle(c, 160, 72, 30, '#b8bcc2'); circle(c, 160, 72, 9, '#3a3d42');
    puff(c, 230, 116, 14, 'rgba(160,125,85,0.6)');
  },
  snow(c) {
    sky(c, '#c9d6e2', '#eef3f7', 112, '#f4f7fa');
    wheel(c, 160, 72, 52);
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * Math.PI * 2;
      line(c, [160 + Math.cos(a) * 44, 72 + Math.sin(a) * 44, 160 + Math.cos(a + 0.18) * 54, 72 + Math.sin(a + 0.18) * 54], '#c9ccd0', 3);
      circle(c, 160 + Math.cos(a + 0.3) * 48, 72 + Math.sin(a + 0.3) * 48, 2, '#e8ecef');
    }
    circle(c, 160, 72, 47, null, '#aeb4ba', 2);
    for (let i = 0; i < 25; i++) circle(c, (i * 71) % PW, (i * 29) % 110, 2, '#ffffff');
  },
  gravel(c) {
    sky(c, '#7fb6ea', '#cfe4f5', 112, '#a88c5f');
    for (let i = 0; i < 160; i++) circle(c, (i * 37) % PW, 114 + (i * 13) % 34, 1.5, i % 3 ? '#c4a87a' : '#7d6646');
    car(c, 110, 124, 1);
    puff(c, 95, 112, 18, 'rgba(196,168,122,0.7)'); puff(c, 70, 104, 14, 'rgba(196,168,122,0.5)');
  },
  grass(c) {
    sky(c, '#7fb6ea', '#cfe4f5', 112, '#4f7a2c');
    for (let x = 0; x < PW; x += 4) line(c, [x, 150, x + 2, 140 - (x * 7) % 12], '#5d8a33', 1.5);
    car(c, 120, 124, 1);
    puff(c, 105, 112, 16, 'rgba(140,108,72,0.6)');
    for (let i = 0; i < 14; i++) { const x = 70 + (i * 17) % 50, y = 90 + (i * 11) % 24; line(c, [x, y, x + 4, y - 2], '#6e9440', 2); }
  },
  debris(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    c.fillStyle = '#b9bcc0'; c.fillRect(60, 118, 22, 16); circle(c, 71, 118, 11, '#b9bcc0');   // piston
    line(c, [120, 126, 124, 118, 128, 128, 132, 118, 136, 128, 140, 118], '#8a8f96', 2);        // spring
    line(c, [170, 128, 200, 120], '#6a6f76', 4); circle(c, 168, 129, 4, '#6a6f76');             // con rod
    for (const [x, y] of [[220, 128], [240, 132], [260, 126], [95, 134], [150, 136]]) c.fillRect(x, y, 7, 5);
    for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.15 + 0.7 * ((i * 0.37) % 1)); line(c, [160, 70, 160 + Math.cos(a) * (30 + i * 3), 70 + Math.sin(a) * (30 + i * 3)], i % 2 ? '#ffd27a' : ORANGE, 2); }
    puff(c, 160, 60, 16, 'rgba(58,58,60,0.75)');
  },
  barriers(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    c.fillStyle = '#b8b5ae'; for (let x = 0; x < 140; x += 24) c.fillRect(x + 1, 80, 22, 32);
    for (let x = 160; x < 250; x += 18) for (let y = 0; y < 4; y++) circle(c, x, 104 - y * 9, 8, '#1a1a1a');
    line(c, [265, 112, 265, 48, 300, 40], '#8a8f96', 2); line(c, [300, 112, 300, 40], '#8a8f96', 2);
    c.fillStyle = 'rgba(160,170,180,0.35)'; c.fillRect(265, 50, 35, 62);
  },
  sunrays(c) {
    sky(c, '#f2b46a', '#ffe2b0', 112, '#3c3f42');
    circle(c, 160, 84, 18, '#fff4d0');
    c.fillStyle = 'rgba(255,240,200,0.35)';
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(160, 84); c.lineTo(160 + k * 60 - 14, 150); c.lineTo(160 + k * 60 + 14, 150); c.fill(); }
    building(c, 110, 112, 40, 60, '#2c2f33'); building(c, 175, 112, 60, 40, '#2c2f33');
  },
  sparks(c) {
    sky(c, '#3a4048', '#5d6670', 112, '#2a2c2f');
    wheel(c, 150, 92, 20, null, true);
    for (let i = 0; i < 26; i++) { const a = Math.PI * (0.92 + 0.22 * ((i * 0.41) % 1)); const l = 30 + (i * 7) % 50; line(c, [140, 112, 140 + Math.cos(a) * l, 112 + Math.sin(a) * l * 0.3], i % 3 ? ORANGE : '#ffe08a', 1.5); }
  },
  lights(c) {
    sky(c, '#0b1426', '#1d2a44', 112, '#1d1f22');
    c.fillStyle = 'rgba(255,240,200,0.28)'; c.beginPath(); c.moveTo(205, 92); c.lineTo(320, 70); c.lineTo(320, 140); c.fill();
    car(c, 90, 124, 1);
    circle(c, 205, 92, 4, '#fff4d0');
    circle(c, 92, 96, 3, '#ff2a2a');
  },
  garage(c) {
    c.fillStyle = '#d9d6cf'; c.fillRect(0, 0, PW, 120);
    c.fillStyle = '#3b4046'; c.fillRect(0, 0, PW, 12);
    for (const x of [20, 170]) {
      c.fillStyle = '#e9e8e4'; c.fillRect(x, 26, 130, 94);
      c.fillStyle = '#8f979f'; c.fillRect(x, 26, 130, 8);                       // rolled-up door
      c.fillStyle = '#2e5aa8'; for (const rx of [x + 6, x + 52]) { c.fillRect(rx, 40, 3, 76); c.fillRect(rx + 40, 40, 3, 76); for (let y = 52; y < 116; y += 20) c.fillRect(rx, y, 43, 3); }
      ['#2c64c8', '#d23a2a', '#e8b72c'].forEach((col, k) => { c.fillStyle = col; c.fillRect(x + 10 + k * 12, 42, 10, 9); });
      c.fillStyle = '#c3221c'; c.fillRect(x + 100, 88, 24, 30);                  // tool chest
      for (let y = 92; y < 116; y += 6) { c.fillStyle = '#d8dadc'; c.fillRect(x + 104, y, 16, 1.5); }
      for (let k = 0; k < 3; k++) circle(c, x + 108, 112 - k * 7, 7, '#1a1a1a');
    }
    c.fillStyle = '#8d9196'; c.fillRect(0, 120, PW, 30);
  },
  echo(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    building(c, 230, 112, 80, 80);
    car(c, 40, 124, 0.9);
    for (let k = 1; k <= 4; k++) { c.beginPath(); c.arc(150, 92, k * 18, -0.6, 0.6); c.strokeStyle = `rgba(255,122,26,${1 - k * 0.2})`; c.lineWidth = 2.5; c.stroke(); }
    for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(228, 92, k * 16, Math.PI - 0.5, Math.PI + 0.5); c.strokeStyle = `rgba(255,255,255,${0.9 - k * 0.25})`; c.lineWidth = 2; c.stroke(); }
  },
  drift(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    line(c, [0, 140, 120, 128], '#222', 5); line(c, [0, 132, 110, 122], '#222', 5);
    c.save(); c.translate(160, 100); c.rotate(-0.12); car(c, -50, 24, 1); c.restore();
    puff(c, 100, 104, 22, 'rgba(235,235,235,0.85)'); puff(c, 60, 96, 28, 'rgba(235,235,235,0.6)'); puff(c, 20, 90, 30, 'rgba(235,235,235,0.35)');
  },
  blowout(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    wheel(c, 150, 92, 26, null);
    c.fillStyle = '#7fb6ea'; c.beginPath(); c.moveTo(150, 92); c.arc(150, 92, 27, -0.9, -0.2); c.fill();
    poly(c, [196, 50, 204, 66, 222, 62, 208, 76, 220, 90, 200, 84, 192, 100, 188, 82, 170, 80, 186, 70], '#ffd23a');
    for (const [x, y, a] of [[110, 60, 0.4], [96, 80, -0.3], [120, 44, 1]]) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#151516'; c.fillRect(-10, -3, 20, 6); c.restore(); }
  },
  wheeloff(c) {
    sky(c, '#7fb6ea', '#cfe4f5');
    c.save(); c.translate(60, 124); c.rotate(0.06); car(c, 0, 0, 0.95); c.restore();
    for (let i = 0; i < 14; i++) line(c, [150, 124, 150 - 20 - i * 3, 112 + (i % 4) * 3], i % 2 ? ORANGE : '#ffe08a', 1.5);
    wheel(c, 250, 108, 14, null);
    line(c, [200, 124, 236, 124], 'rgba(255,255,255,0.6)', 2);
  },
  wash(c) {
    sky(c, '#7d8590', '#a9b0b8');
    rainLines(c, 50);
    c.fillStyle = 'rgba(10,10,10,0.5)'; c.fillRect(20, 124, 120, 5); c.fillStyle = 'rgba(10,10,10,0.25)'; c.fillRect(20, 134, 120, 5);
    c.fillStyle = 'rgba(40,36,30,0.35)'; c.beginPath(); c.ellipse(230, 132, 70, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(80,120,160,0.35)'; c.beginPath(); c.ellipse(230, 132, 40, 6, 0, 0, Math.PI * 2); c.fill();
  },
  sunset(c) {
    sky(c, '#3a2a5c', '#ff9a3c', 112, '#2a2c2f');
    circle(c, 160, 112, 26, '#ffcf6a');
    c.fillStyle = '#2a2c2f'; c.fillRect(0, 112, PW, 38);
  },
  storm(c) {
    sky(c, '#2c3138', '#55606b');
    puff(c, 90, 30, 30, '#3a4048'); puff(c, 230, 26, 34, '#3a4048');
    poly(c, [170, 30, 150, 74, 166, 74, 148, 112, 186, 62, 168, 62, 184, 30], '#fffbe0');
    rainLines(c, 70);
    c.strokeStyle = 'rgba(220,230,240,0.7)'; c.lineWidth = 1.5;
    for (const x of [60, 250]) { c.beginPath(); c.ellipse(x, 132, 14, 3, 0, 0, Math.PI * 2); c.stroke(); }
  },
  rain(c) {
    sky(c, '#7d8590', '#a9b0b8', 112, '#2f3236');
    rainLines(c, 70);
    car(c, 110, 124, 1);
    puff(c, 100, 116, 16, 'rgba(220,228,236,0.6)'); puff(c, 70, 110, 14, 'rgba(220,228,236,0.4)');
    c.fillStyle = 'rgba(160,180,200,0.4)'; c.beginPath(); c.ellipse(250, 134, 36, 5, 0, 0, Math.PI * 2); c.fill();
  },
  rainsound(c) {
    sky(c, '#7d8590', '#a9b0b8', 150);
    rainLines(c, 50);
    poly(c, [110, 60, 128, 60, 150, 42, 150, 108, 128, 90, 110, 90], '#15181c');
    for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(150, 75, k * 18, -0.7, 0.7); c.strokeStyle = ORANGE; c.lineWidth = 3; c.stroke(); }
  },
  puddles(c) {
    sky(c, '#8b939c', '#b3bac2', 100, '#2f3236');
    c.fillStyle = '#4f7a2c'; c.fillRect(200, 100, 120, 50);
    c.fillStyle = 'rgba(160,180,200,0.45)'; c.beginPath(); c.ellipse(70, 124, 44, 8, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(150, 140, 30, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3b2a1a'; c.beginPath(); c.ellipse(260, 128, 40, 10, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(230,236,242,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(70, 124, 10, 2, 0, 0, Math.PI * 2); c.stroke();
  },
  aquaplane(c) {
    sky(c, '#7d8590', '#a9b0b8', 112, '#2f3236');
    c.fillStyle = 'rgba(150,175,200,0.7)'; c.fillRect(0, 108, PW, 6);
    wheel(c, 160, 72, 38);
    poly(c, [196, 110, 230, 92, 260, 70, 250, 100, 220, 112], 'rgba(220,232,244,0.8)');
    line(c, [110, 114, 200, 114], 'rgba(255,255,255,0.8)', 1.5);
    c.fillStyle = '#ffd23a'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText('riding on water', 160, 136);
  },
  night(c) {
    sky(c, '#060b18', '#16223a', 112, '#15171a');
    for (let i = 0; i < 40; i++) circle(c, (i * 83) % PW, (i * 31) % 100, i % 5 ? 1 : 1.6, '#ffffff');
    circle(c, 250, 34, 14, '#eef0e6'); circle(c, 256, 30, 12, '#16223a');
  },
  files(c) {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, PW, PH);
    for (let k = 0; k < 4; k++) {
      const x = 50 + k * 60;
      poly(c, [x, 40, x + 30, 40, x + 42, 52, x + 42, 104, x, 104], '#e8e6df');
      line(c, [x + 10, 76, x + 18, 86, x + 32, 64], '#2bdc4a', 4);
    }
  },
  driver(c) {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, PW, PH);
    c.fillStyle = '#c81d25'; c.beginPath(); c.ellipse(160, 160, 80, 60, 0, Math.PI, 0); c.fill();   // shoulders in the race suit
    c.fillStyle = '#f4f4f2'; c.fillRect(104, 112, 8, 40); c.fillRect(208, 112, 8, 40);
    c.fillStyle = '#2a2c30'; c.fillRect(132, 100, 12, 50); c.fillRect(176, 100, 12, 50);     // harness
    circle(c, 160, 62, 40, '#f2f2f2');
    poly(c, [126, 56, 194, 56, 190, 78, 130, 78], '#111418');
    line(c, [160, 22, 160, 40], '#c81d25', 6);
  },
  cockpit(c) {
    sky(c, '#7fb6ea', '#cfe4f5', 80, '#4a4d50');
    c.fillStyle = '#1d1d1f'; c.fillRect(0, 96, PW, 54);
    c.fillStyle = '#0b0d10'; c.fillRect(196, 104, 70, 34);
    c.fillStyle = '#2bdc4a'; for (let i = 0; i < 5; i++) c.fillRect(202 + i * 12, 107, 8, 4);
    c.fillStyle = '#ffffff'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('3', 231, 132);
    c.fillStyle = '#111'; c.fillRect(120, 10, 80, 22); c.fillStyle = '#9db7cf'; c.fillRect(123, 13, 74, 16);   // rear-view mirror
    steeringWheel(c, 110, 120, 40);
    c.fillStyle = '#151515'; circle(c, 76, 112, 9, '#151515'); circle(c, 144, 112, 9, '#151515');   // gloves
  },
  clock(c) {
    sky(c, '#7fb6ea', '#cfe4f5', 150);
    circle(c, 160, 75, 48, '#f4f2ea', '#15181c', 4);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; line(c, [160 + Math.cos(a) * 40, 75 + Math.sin(a) * 40, 160 + Math.cos(a) * 46, 75 + Math.sin(a) * 46], '#15181c', 2); }
    line(c, [160, 75, 160, 45], '#15181c', 3); line(c, [160, 75, 184, 86], ORANGE, 3);
    circle(c, 250, 40, 14, '#ffd86a');
  },
  bonnet(c) {
    sky(c, '#5f9fe0', '#cfe4f5', 112, '#4a4d50');
    puff(c, 230, 40, 20, '#f4f6f8');
    poly(c, [40, 150, 120, 104, 200, 104, 280, 150], '#c9ccd0');
    poly(c, [0, 150, 40, 150, 70, 126, 0, 126], GREEN); poly(c, [320, 150, 280, 150, 250, 126, 320, 126], GREEN);
    line(c, [160, 60, 160, 20], 'rgba(255,255,255,0.8)', 2); poly(c, [152, 28, 160, 16, 168, 28], 'rgba(255,255,255,0.8)');
  },
};

// ---------------------------------------------------------------------
// THE SCREEN
//   Slides: one slide per feature, each with its picture. Used for the
//   updates you've missed (or one update, tapped from the list).
//   List:   every update, each as a short scrollable list of its features.
// Drag sideways to change slide; drag up and down to scroll (done by hand,
// so it works even though the game stops the page scrolling on phones).
// ---------------------------------------------------------------------
const STYLE = `
#updates { position: fixed; inset: 0; z-index: 60; display: none; place-items: center;
  background: rgba(8, 10, 12, 0.55); font-family: ${FONT}; color: #f2efe6; padding: 12px; box-sizing: border-box; }
#updates.open { display: grid; }
#updates * { box-sizing: border-box; }
#updates .up-card { width: min(480px, 100%); max-height: min(620px, 100%); height: min(620px, 100%); display: flex; flex-direction: column;
  background: #15181c; border: 1px solid rgba(242, 239, 230, 0.14); border-radius: 16px; overflow: hidden;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); }
#updates .up-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 14px 18px 2px; }
#updates .up-title { font-size: 24px; font-weight: 700; letter-spacing: 0.01em; }
#updates .up-back { background: none; border: 0; color: #ff7a1a; font: 600 16px ${FONT}; cursor: pointer; padding: 0; margin-right: auto; }
#updates .up-back[hidden] { display: none; }
#updates .up-close { background: none; border: 0; color: rgba(242, 239, 230, 0.6); font: 600 26px ${FONT}; line-height: 1;
  cursor: pointer; padding: 0 2px; }
#updates .up-close:hover { color: #f2efe6; }
#updates .up-sub { padding: 0 18px; color: rgba(242, 239, 230, 0.6); font-size: 15px; }
#updates .up-status { margin: 8px 18px 0; padding: 6px 10px; border-radius: 8px; font-size: 14px; font-weight: 600;
  background: rgba(57, 200, 106, 0.12); color: #7fe0a0; }
#updates .up-status.warn { background: rgba(255, 122, 26, 0.14); color: #ffa45c; cursor: pointer;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
#updates .up-status.warn.full { display: block; }
#updates .up-status.unknown { background: rgba(242, 239, 230, 0.06); color: rgba(242, 239, 230, 0.55); }
#updates .up-view { position: relative; overflow: hidden; margin-top: 10px; flex: 1; min-height: 0; touch-action: none; cursor: grab; }
#updates .up-view.dragging { cursor: grabbing; }
#updates .up-track { display: flex; height: 100%; transition: transform 300ms cubic-bezier(.2,.8,.2,1); }
#updates .up-view.dragging .up-track { transition: none; }
#updates .up-slide { flex: 0 0 100%; height: 100%; padding: 2px 18px 6px; overflow-y: auto; user-select: none; -webkit-user-select: none;
  overscroll-behavior: contain; scrollbar-width: thin; }
#updates .up-pic { display: block; width: 100%; aspect-ratio: 320 / 150; border-radius: 10px; background: #20252b; margin-bottom: 10px; }
#updates .up-meta { color: #ff7a1a; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
#updates .up-name { font-size: 24px; font-weight: 700; margin: 2px 0 6px; }
#updates .up-text { margin: 0; font: 400 16px system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.45;
  color: rgba(242, 239, 230, 0.88); }
#updates .up-list { height: 100%; overflow-y: auto; padding: 0 18px 8px; user-select: none; -webkit-user-select: none;
  overscroll-behavior: contain; scrollbar-width: thin; }
#updates .up-group { padding: 10px 0 8px; border-top: 1px solid rgba(242, 239, 230, 0.1); cursor: pointer; }
#updates .up-group:first-child { border-top: 0; padding-top: 2px; }
#updates .up-group:hover .up-gname { color: #ff7a1a; }
#updates .up-gname { font-size: 19px; font-weight: 700; margin: 1px 0 3px; }
#updates .up-gname::after { content: ' ›'; color: #ff7a1a; }
#updates .up-bullets { margin: 0; padding-left: 18px; font: 400 14px system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.4;
  color: rgba(242, 239, 230, 0.8); }
#updates .up-dots { position: relative; width: 98px; height: 16px; margin: 8px auto 0; overflow: hidden; }
#updates .up-dots[hidden], #updates .up-count[hidden] { display: none; }
#updates .up-dotrow { position: absolute; left: 0; top: 0; height: 16px; display: flex; transition: transform 280ms ease; }
#updates .up-dot { flex: 0 0 14px; height: 16px; display: grid; place-items: center; cursor: pointer; }
#updates .up-dot i { display: block; border-radius: 50%; background: rgba(242, 239, 230, 0.45);
  transition: width 260ms ease, height 260ms ease, background-color 260ms ease, opacity 260ms ease; }
#updates .up-dot.on i { background: #ff7a1a; }
#updates .up-count { text-align: center; color: rgba(242, 239, 230, 0.5); font-size: 13px; margin-top: 2px; }
#updates .up-foot { display: flex; gap: 10px; justify-content: space-between; align-items: center; padding: 10px 18px 14px; }
#updates .up-btn { font: 600 16px ${FONT}; border-radius: 10px; padding: 8px 16px; cursor: pointer; letter-spacing: 0.02em; }
#updates .up-all { background: none; border: 1px solid rgba(242, 239, 230, 0.22); color: #f2efe6; }
#updates .up-all[hidden] { display: none; }
#updates .up-ok { background: #ff7a1a; border: 1px solid #ff7a1a; color: #15181c; margin-left: auto; }
#updates .up-btn:focus-visible, #updates .up-close:focus-visible, #updates .up-back:focus-visible { outline: 2px solid #ff7a1a; outline-offset: 2px; }
/* Phones: smaller text and pictures */
@media (max-width: 600px), (max-height: 560px) {
  #updates { padding: 8px; }
  #updates .up-card { border-radius: 12px; }
  #updates .up-head { padding: 10px 14px 0; }
  #updates .up-title { font-size: 19px; }
  #updates .up-sub { padding: 0 14px; font-size: 13px; }
  #updates .up-status { margin: 6px 14px 0; padding: 4px 8px; font-size: 12px; }
  #updates .up-status.warn { -webkit-line-clamp: 1; }
  #updates .up-view { margin-top: 6px; }
  #updates .up-slide { padding: 0 14px 4px; }
  #updates .up-list { padding: 0 14px 6px; }
  #updates .up-meta { font-size: 11px; }
  #updates .up-name { font-size: 18px; margin: 1px 0 3px; }
  #updates .up-text { font-size: 13px; line-height: 1.4; }
  #updates .up-gname { font-size: 16px; }
  #updates .up-bullets { font-size: 12px; }
  #updates .up-btn { font-size: 14px; padding: 6px 12px; }
  #updates .up-foot { padding: 6px 14px 10px; }
  #updates .up-dots { margin-top: 4px; }
  #updates .up-count { font-size: 11px; }
}
/* Phone on its side: picture on the left, words on the right */
@media (max-height: 560px) and (orientation: landscape) {
  #updates .up-card { width: min(640px, 100%); }
  #updates .up-slide { display: grid; grid-template-columns: 46% 1fr; gap: 12px; align-content: start; }
  #updates .up-pic { margin-bottom: 0; }
}
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
        <div class="up-head"><button type="button" class="up-back" hidden>‹ All updates</button>
          <span class="up-title">What's new</span>
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
    this.dots = q('.up-dots');
    this.dotrow = q('.up-dotrow');
    this.count = q('.up-count');
    this.allBtn = q('.up-all');
    this.backBtn = q('.up-back');

    q('.up-close').addEventListener('click', () => this.close());
    this.status.addEventListener('click', () => this.status.classList.toggle('full'));   // a long warning: tap to read it all
    q('.up-ok').addEventListener('click', () => this.close());
    this.allBtn.addEventListener('click', () => this.showList());
    this.backBtn.addEventListener('click', () => this.showList());
    this.root.addEventListener('pointerdown', (e) => { if (e.target === this.root) this.close(); });
    this.setupDrag();

    // While open, the keys work the screen instead of the car
    this.onKey = (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Tab') return;
      e.stopImmediatePropagation();
      if (e.type !== 'keydown') return;
      if (e.key === 'ArrowRight') this.go(this.index + 1);
      else if (e.key === 'ArrowLeft') this.go(this.index - 1);
      else if (e.key === 'ArrowDown') this.scroller()?.scrollBy({ top: 60, behavior: 'smooth' });
      else if (e.key === 'ArrowUp') this.scroller()?.scrollBy({ top: -60, behavior: 'smooth' });
      else if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); this.close(); }
    };
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('keyup', this.onKey, true);

    this.slides = [];
    this.index = 0;
    this.mode = 'slides';
    this.isOpen = false;
  }

  get open() { return this.isOpen; }

  openUp() {
    this.root.classList.add('open');
    this.isOpen = true;
    this.root.querySelector('.up-ok').focus({ preventScroll: true });
  }

  // One slide per feature of the given updates (newest first)
  show(list, subtitle, { fromList = false } = {}) {
    this.mode = 'slides';
    this.slides = [];
    for (const u of list) {
      u.items.forEach((item, k) => this.slides.push({ u, k, n: u.items.length, title: item[0], text: item[1], pic: item[2] }));
    }
    this.index = 0;
    this.sub.textContent = subtitle;
    this.allBtn.hidden = false;
    this.backBtn.hidden = !fromList;
    this.dots.hidden = this.count.hidden = false;
    this.track.innerHTML = '';
    this.dotrow.innerHTML = '';
    this.slides.forEach((s, i) => {
      const slide = document.createElement('div');
      slide.className = 'up-slide';
      slide.setAttribute('aria-roledescription', 'slide');
      slide.innerHTML = '<canvas class="up-pic" aria-hidden="true"></canvas><div><div class="up-meta"></div><div class="up-name"></div><p class="up-text"></p></div>';
      slide.querySelector('.up-meta').textContent = `Update ${s.u.id} · ${s.u.date}${s.n > 1 ? ` · ${s.k + 1} of ${s.n}` : ''}`;
      slide.querySelector('.up-name').textContent = s.title;
      slide.querySelector('.up-text').textContent = s.text;
      s.el = slide;
      s.drawn = false;
      this.track.appendChild(slide);
      const dot = document.createElement('span');
      dot.className = 'up-dot';
      dot.innerHTML = '<i></i>';
      dot.addEventListener('click', () => this.go(i));
      this.dotrow.appendChild(dot);
    });
    this.track.style.transition = 'none';
    this.openUp();
    this.go(0);
    void this.track.offsetWidth;
    this.track.style.transition = '';
  }

  // Every update as a short list; tap one to see its slides
  showList() {
    this.mode = 'list';
    this.slides = [];
    this.index = 0;
    this.sub.textContent = `Every update so far (${UPDATES.length}). Tap one to see it.`;
    this.allBtn.hidden = true;
    this.backBtn.hidden = true;
    this.dots.hidden = this.count.hidden = true;
    this.track.style.transform = '';
    this.track.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'up-list';
    for (const u of UPDATES) {
      const g = document.createElement('div');
      g.className = 'up-group';
      g.innerHTML = '<div class="up-meta"></div><div class="up-gname"></div><ul class="up-bullets"></ul>';
      g.querySelector('.up-meta').textContent = `Update ${u.id} · ${u.date}`;
      g.querySelector('.up-gname').textContent = u.title;
      const ul = g.querySelector('.up-bullets');
      for (const item of u.items) {
        const li = document.createElement('li');
        li.textContent = item[0];
        ul.appendChild(li);
      }
      g.addEventListener('click', () => { if (!this.dragMoved) this.show([u], `Update ${u.id}: ${u.title}`, { fromList: true }); });
      list.appendChild(g);
    }
    this.track.appendChild(list);
    this.listEl = list;
    this.openUp();
  }

  // The thing that scrolls up and down right now
  scroller() {
    return this.mode === 'list' ? this.listEl : this.slides[this.index]?.el;
  }

  // Slide to slide i, draw its picture (and the neighbours'), move the dots
  go(i) {
    if (this.mode !== 'slides') return;
    const n = this.slides.length;
    this.index = Math.max(0, Math.min(n - 1, i));
    this.track.style.transform = `translateX(${-this.index * 100}%)`;
    for (let k = this.index - 1; k <= this.index + 1; k++) this.drawPic(this.slides[k]);
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

  drawPic(s) {
    if (!s || s.drawn) return;
    s.drawn = true;
    const cv = s.el.querySelector('.up-pic');
    const scale = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
    cv.width = PW * scale;
    cv.height = PH * scale;
    const c = cv.getContext('2d');
    if (!c) return;
    c.scale(scale, scale);
    try {
      (PICTURES[s.pic] || PICTURES.car)(c);
    } catch (e) {
      console.warn('Picture failed:', s.pic, e);
    }
  }

  // Drag sideways to change slide, up and down to scroll (with a flick)
  setupDrag() {
    let startX = 0, startY = 0, lastY = 0, lastT = 0, vy = 0, dx = 0, axis = null, id = null, t0 = 0, coast = 0;
    const stopCoast = () => { cancelAnimationFrame(coast); coast = 0; };
    this.view.addEventListener('pointerdown', (e) => {
      stopCoast();
      id = e.pointerId; startX = e.clientX; startY = lastY = e.clientY; lastT = t0 = performance.now();
      dx = 0; vy = 0; axis = null; this.dragMoved = false;
    });
    this.view.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!axis) {
        if (Math.hypot(dx, dy) < 8) return;                    // still deciding
        axis = Math.abs(dx) > Math.abs(dy) && this.mode === 'slides' && this.slides.length > 1 ? 'x' : 'y';
        this.dragMoved = true;
        this.view.setPointerCapture(id);
        if (axis === 'x') this.view.classList.add('dragging');
      }
      if (axis === 'x') {
        const edge = (this.index === 0 && dx > 0) || (this.index === this.slides.length - 1 && dx < 0);
        const pull = edge ? dx * 0.3 : dx;                      // resists at the ends
        this.track.style.transform = `translateX(calc(${-this.index * 100}% + ${pull}px))`;
      } else {
        const now = performance.now();
        const step = e.clientY - lastY;
        this.scroller()?.scrollBy(0, -step);
        vy = 0.8 * vy + 0.2 * (step / Math.max(1, now - lastT));
        lastY = e.clientY; lastT = now;
      }
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      if (axis === 'x') {
        this.view.classList.remove('dragging');
        const fast = Math.abs(dx) / Math.max(1, performance.now() - t0) > 0.45;
        const far = Math.abs(dx) > this.view.clientWidth * 0.22;
        // swipe left (finger moves left) = next slide
        if ((fast || far) && dx < 0) this.go(this.index + 1);
        else if ((fast || far) && dx > 0) this.go(this.index - 1);
        else this.go(this.index);
      } else if (axis === 'y' && Math.abs(vy) > 0.05) {
        // a flick keeps scrolling and slows down
        const el = this.scroller();
        let v = vy * 16, prev = performance.now();
        const run = (now) => {
          const k = Math.min(3, (now - prev) / 16);
          prev = now;
          el?.scrollBy(0, -v * k);
          v *= Math.pow(0.94, k);
          coast = Math.abs(v) > 0.3 ? requestAnimationFrame(run) : 0;
        };
        coast = requestAnimationFrame(run);
      }
      axis = null;
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
    // Old copies loaded (after the automatic refresh tried): say so once for
    // that set of old files, not every time the page loads
    const stillOld = result.known && result.stale.length;
    const staleKey = stillOld ? result.stale.map((f) => `${f.file}:${f.have}`).sort().join(',') : '';
    const staleNew = stillOld && store.get(STALE_KEY) !== staleKey;
    if (stillOld) store.set(STALE_KEY, staleKey);
    if (missed.length || staleNew) {
      if (firstVisit) screen.show(UPDATES.slice(0, 1), 'The latest update');
      else if (missed.length) {
        screen.show(missed, missed.length === 1 ? '1 update since your last visit'
          : `${missed.length} updates since your last visit`);
      } else screen.show(UPDATES.slice(0, 1), 'Some files are out of date');
    }
    // It only opens by itself once per update: showing it counts as seen,
    // even if the page is reloaded without closing it
    if (missed.length) store.set(SEEN_KEY, String(UPDATES[0].id));
  });

  // From the side panel: the full list
  screen.openAll = () => screen.showList();
  return screen;
}
