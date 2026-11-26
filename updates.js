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
export const BUILD = 179;

// Newest first. Each feature: [short title, what it does, picture]
// (the pictures are drawn in code: see PICTURES below)
export const UPDATES = [
  {
    id: 144, date: '26 Nov 2026', title: 'Smoother still, and taller chimneys',
    items: [
      ['One smooth sheet', 'The TTF-94 and TTF-88 are smoother again: their engine covers and sidepod tops now flow into each other as one surface, without the lumps', 'new'],
      ['The TTF-94\'s airbox', 'Taller and rounded on top, as on the real car: its face stands upright over the driver\'s helmet, with the dark intake in it, and its spine runs back down into the engine cover', 'new'],
      ['The TTF-94\'s sidepods, flat-fronted', 'Each sidepod now starts at a flat, upright front, with the radiator\'s inlet a real hole in it: big and round-cornered, toward the inner side, a dark duct behind it and the radiator at the back, so you can see into it', 'new'],
      ['The TTF-88\'s roll hoop', 'Back, as the real car has it: a slim blade rising behind the driver\'s head, open through the middle, its front edge upright and its back raked', 'new'],
      ['The TTF-88, whiter', 'The TTF-88\'s livery is now mostly white: red only over the top of the nose, the engine cover and the tops of the sidepods', 'new'],
    ],
  },
  {
    id: 143, date: '26 Nov 2026', title: 'Torn to pieces',
    items: [
      ['Bodywork rips off', 'Crush a car badly enough and the bodywork tears away: the crumpled part comes off as a shower of pieces, each one the very bit of skin that was there, in its own colours and shape, flung off with the car\'s speed, tumbling and skidding to a stop. The car is left with a hole where it was. A repair puts it all back. Every car', 'new'],
      ['Smoother bodies', 'The TTF-94 and TTF-88 no longer look sliced: their bodywork is one smooth, continuous sheet', 'new'],
      ['Out of sight', 'The drivers\' legs are no longer shown, in every car; in the Formula cars the pedals and the pedal floor are gone from view too', 'new'],
    ],
  },
  {
    id: 142, date: '26 Nov 2026', title: 'Two cars, measured closer',
    items: [
      ['The TTF-94, closer to the real car', 'The TTF-94 is now shaped from 350 measured slices instead of 100: 100 down the nose and 250 from the sidepods back, smoothed so the bodywork flows cleanly from one to the next. Our reference turned out to be about a fifth too wide, so the body is now set to the real car\'s proportions: slimmer sidepods sitting just inside the wheels, a slimmer nose, and the mouths raked back from the nose to the full width of the pods', 'new'],
      ['The TTF-88, closer too', 'The TTF-88 is now shaped from 350 measured slices as well, 250 of them from the sidepods back: straight, flat-sided pods, the nose measured all the way to its tip, square-cut fronts on the pods, and the engine cover and the back of the pods following the real car more closely', 'new'],
    ],
  },
  {
    id: 141, date: '25 Nov 2026', title: 'The TTF-20, and a new garage',
    items: [
      ['A new car: the TTF-20', 'A 2020-style hybrid Formula car, shaped from measurements of the real car at 100 points: very long and wide, tiny sidepods, the airbox rising over the driver, the halo over the cockpit, a two-metre front wing and a huge floor. Black, with a field of silver stars across the engine cover and pods, thin teal lines, and a red star on the halo. The 1.6 turbo V6 hybrid revs to 15,000 with next to no lag. No sponsors yet, and its own sound is coming', 'new'],
      ['The garage, rearranged', 'Change car now has three sections. By decade: formula, endurance, rally and touring, three cars a decade from the 1970s to the 2020s. Rivalries: five famous pairs. Honourable mentions: road cars known for their timeless design, Japanese legends, minivans and coaches. The cars still to come show as coming soon', 'new'],
      ['The TTF-88, measured', 'The TTF-88\'s body is now shaped from measurements of the real 1988 car at 100 points: very low, a long flat-topped pod each side, the engine cover rising over the roll hoop. The driver sits 35 cm further forward, lying well back, as in the real car, and the cameras have moved with him', 'new'],
      ['The prototypes, measured', 'The TTP-70 and TTP-91 have their widths, fenders, noses and cabins set from measurements of the real cars: lower fenders, steeper noses, narrower cabins with the roof high well forward and a steep screen. The TTP-70\'s driver sits 40 cm further forward, under the high part of the roof', 'new'],
    ],
  },
  {
    id: 140, date: '25 Nov 2026', title: 'The TTF-94, measured',
    items: [
      ['A truer shape', 'The TTF-94\'s body is now shaped from measurements of the real 1994 car, taken at 100 points from the nose to the gearbox: a taller nose, the cockpit set further forward, the airbox rising straight up behind the driver\'s head as part of the bodywork, and sidepods with flat tops and sharp edges that start further forward with raked, dark mouths, and tuck in underneath toward the back', 'new'],
      ['Sat further forward', 'The driver sits 45 cm further forward, where the real car has him: the in-car view, the T-cam and the bonnet camera have moved with him', 'new'],
      ['Its real colours', 'All red, as the real car: no white flashes. The front wing is black with a yellow stripe; the rear wing\'s endplates are white over black. VESPERO runs along the engine cover, SOLVARA is on the nose and low on the pods, ARDENTA on the pods\' sides', 'new'],
      ['Sponsors in shape', 'Sponsors laid on the bodywork of the TTF-94 and TTF-88 are now drawn to the shape of the panel they sit on, so none of them are stretched', 'new'],
    ],
  },
  {
    id: 139, date: '25 Nov 2026', title: 'TTF-05 suit and helmet',
    items: [
      ['A proper team suit', 'The TTF-05\'s driver wears a new suit, as you see when he climbs out: sky blue, dark navy down each side, yellow panels on the shoulders and a yellow band across the back under his number. TELESPEED is big across his belly; ELX, VALCOR and KORVANE are on one side of his chest, the team\'s own badge, FLORO and TEMPRA on the other; the team name and KORVANE are on his back', 'new'],
      ['His helmet', 'A rounder helmet with a chin guard and a little lip at the back, painted in his colours: a blue crown with PURE SPIRIT across the brow, a red band round the middle with a yellow stripe through it, a pale blue chequer below and a yellow rim. The visor is tinted gold', 'new'],
      ['New sponsors', 'Three new names: LEASEWAY (leasing), FLORO (fashion) and TEMPRA (watches). On the car, KORVANE is now on the nose, TEMPRA by the cockpit, FLORO on the pods, TELESPEED on the front wing\'s endplates, and the team\'s badge on the engine cover. PURE SPIRIT on the nose is bigger and runs right up to its badge', 'new'],
    ],
  },
  {
    id: 138, date: '25 Nov 2026', title: 'TTF-05 gills and winglets',
    items: [
      ['Real gills', 'The gills down the back of the TTF-05\'s sidepods are now proper louvres: seven blue lips pressed out of the bodywork, flush at the front and lifted open at the back, each a dark slot facing the rear', 'new'],
      ['Winglets in blue', 'The horn winglets beside the airbox, the winglets on the pods and the flip-ups ahead of the rear wheels are now painted in the car\'s blue instead of bare carbon', 'new'],
    ],
  },
  {
    id: 137, date: '25 Nov 2026', title: 'The TTF-05 repainted',
    items: [
      ['Its proper colours', 'The TTF-05 now wears its team\'s real colour layout: a deeper, brighter blue over the top, the pods and the airbox; yellow down the nose\'s sides and the tub, running back as a band along each shoulder of the engine cover; a blue band down the top of the nose; dark navy along the bottom edges and on the endplates', 'new'],
      ['New sponsor names', 'PURE SPIRIT is the main sponsor now, big on the pods, along the nose and on the front wing; ELX is the fuel, on the nose\'s sides; TELESPEED runs across the rear wing in lime green. The driver\'s suit has the new names too', 'new'],
      ['A longer airbox', 'The gap under the airbox\'s intake is filled: its base now sits right down on the bodywork and reaches 30 cm further forward, sloping down to finish just behind the driver\'s helmet', 'new'],
    ],
  },
  {
    id: 136, date: '25 Nov 2026', title: 'The TTF-05, measured',
    items: [
      ['A truer shape', 'The TTF-05\'s body is now shaped from measurements of the real 2005 car, taken at 100 points from the nose to the gearbox: a shorter nose (21 cm shorter) that drops to the tip, a narrower cockpit opening, sidepods that start further back and pull in tightly toward the rear, and a spine running from the airbox down the engine cover. The front wing sits a little further back and higher, under the new nose', 'new'],
    ],
  },
  {
    id: 135, date: '25 Nov 2026', title: 'The TTF-05 driver\'s suit',
    items: [
      ['Stripes and sponsors on his suit', 'The TTF-05\'s driver now wears a printed suit, as you see when he climbs out: light blue, a pair of yellow lines down the front beside each arm, a navy waistband, AZURA big on his chest and back, HALDEN and ZEPHRA smaller on the front', 'new'],
    ],
  },
  {
    id: 134, date: '25 Nov 2026', title: 'Wheels of their year',
    items: [
      ['Each TTF on its own rims', 'Thirteen-inch, in the style of each car\'s year: the TTF-88 on silver magnesium wheels with ten thin straight spokes, the TTF-94 on silver cross-spoked wheels (the spokes crossing in a lattice), the TTF-05 on dark anthracite wheels whose six spokes split in two at the rim', 'new'],
    ],
  },
  {
    id: 133, date: '25 Nov 2026', title: 'Team race suits',
    items: [
      ['Drivers in their team\'s colours', 'Each TTF\'s driver now wears his team\'s suit, in the cockpit, in the Garage and when he climbs out: white with red for the TTF-88, red with white for the TTF-94, light blue with yellow for the TTF-05', 'new'],
    ],
  },
  {
    id: 132, date: '25 Nov 2026', title: 'New liveries for the TTFs',
    items: [
      ['The TTF-88, smoothed and repainted', 'The TTF-88 is now one smooth body like the later cars: very low, a long low nose, low pods and a small airbox. In our own red and white: red over the top, white below, a white arrowhead running forward down each pod to a point. Sponsored by VESPERO (tobacco) and TORRIN oil', 'new'],
      ['Sponsors on the TTF-94', 'VESPERO, the same tobacco brand as the TTF-88, big on the pods and across the rear wing; SOLVARA fuels on the nose; the tyres on the endplates; small badges on the cover', 'new'],
      ['The TTF-05 repainted', 'More light blue on the nose (its front and lower sides), more yellow on the body (over the cockpit, along the engine cover and onto the pods\' tops), and a new main sponsor: AZURA, a tobacco brand, big on the pods and across the rear wing. HALDEN is still its fuel', 'new'],
    ],
  },
  {
    id: 131, date: '25 Nov 2026', title: 'The TTF-94, smoothed',
    items: [
      ['One smooth body', 'The TTF-94 is rebuilt the way the TTF-05 was: one flowing skin from the nose to the gearbox instead of separate pieces. A low, round nose, low cockpit sides with the driver\'s shoulders showing, long rounded sidepods with their mouths set back, no crease anywhere, tapering gently into the engine cover, and the tall airbox over his head. Red, with white flashes along the pods and over the nose. Every bit of it dents', 'new'],
    ],
  },
  {
    id: 130, date: '25 Nov 2026', title: 'Tuning',
    items: [
      ['Tuning, like GT7', 'A Tuning button in the Garage, beside Change car, opens the car\'s settings sheet: tyres; body height, anti-roll bars, compression and rebound damping, spring frequency, camber and toe, front and rear; the limited-slip diff (initial torque, acceleration and braking sensitivity); downforce front and rear on cars with wings; engine output and a power restrictor; ballast and where it sits; brake balance; and every gear ratio and the final gear. Changes go on the car at once, the power, weight and top speed shown as you go, and they\'re kept for each car. Reset to stock puts it back as built', 'new'],
    ],
  },
  {
    id: 129, date: '25 Nov 2026', title: 'Limp when knocked flying',
    items: [
      ['A real ragdoll', 'Someone knocked flying is no longer a stiff board with waving arms: every joint goes loose (neck, spine, shoulders, elbows, hips, knees), each part flung and falling on its own and flopping onto the ground however it lands. Elbows and knees still only fold the way they can. Getting up, he rolls round from however he lies', 'new'],
    ],
  },
  {
    id: 128, date: '25 Nov 2026', title: 'Wheels and tyres take damage',
    items: [
      ['Bent rims and cut tyres', 'A crash now hurts the wheel itself, not only what holds it on. A bent rim wobbles as it turns (you\'ll feel it in the steering on a front one), grips less, scrubs its tyre and lets air seep out; bend it far enough and it cracks and the tyre goes at once. The tyre can be cut too: a slash lets it down quickly, a gash bursts it. A new wheel at the pits fixes both', 'new'],
    ],
  },
  {
    id: 127, date: '25 Nov 2026', title: 'Detailed crush (a setting)',
    items: [
      ['Detailed crush', 'A new tickbox in the side panel on the TTF-05. Ticked: the full simulation, a fine frame through the whole car, so the metal creases and folds where it\'s hit and a nose concertinas. It\'s heavier, so a big crash may stutter for a moment on slower phones. Unticked (the default): the simple dents from before', 'new'],
    ],
  },
  {
    id: 126, date: '25 Nov 2026', title: 'What the crush tears off',
    items: [
      ['What the crush tears off', 'Where the frame\'s pushed too far, or its beams have snapped, what\'s fixed there comes away: a front wing half, the rear wing, a wheel, a mirror. And everything on the body goes with the crumpling metal (every winglet, gill and vane, and every sponsor\'s badge) instead of being left floating where it was', 'new'],
    ],
  },
  {
    id: 125, date: '25 Nov 2026', title: 'A crush frame (first try)',
    items: [
      ['The TTF-05 crumples for real', 'A first try at crashing the way BeamNG does it: the TTF-05 has a skeleton of points through its body joined by beams, each as strong as that part of a real car (the nose made to crumple, the sidepods firmer, the cockpit tub as good as unbreakable). A crash drives the wall into it as far as the hit takes it: the beams bend, stay bent and snap, and the body follows, so the nose folds back onto the tub, a side hit pushes the sidepod in, and no two crashes look alike', 'new'],
    ],
  },
  {
    id: 124, date: '25 Nov 2026', title: 'Out cold, and out of the car properly',
    items: [
      ['Out cold', 'Knocked out, the driver now slumps in his seat like a rag doll: head hanging over to one side and lolling, arms fallen limp, until the medics lift him out. He no longer sits up with his hands on the wheel', 'fix'],
      ['Never through the car', 'Climbing out of a single-seater or prototype, he steps up onto the sidepod, walks out along it and jumps down off its edge, instead of his legs passing through the bodywork', 'fix'],
    ],
  },
  {
    id: 123, date: '25 Nov 2026', title: 'Hit for real',
    items: [
      ['The car\'s real shape', 'Whether you hit someone now goes by where the car actually is: a single-seater\'s wheels, narrow nose, wide front wing, sidepods and rear wing, with the gaps between them, not a box round the whole car', 'fix'],
      ['What it does', 'Hit slowly, he gets up. Faster, he\'s knocked out cold or killed, lying there as a pool of blood spreads under him. Very fast, he\'s torn apart: arms and legs thrown off, bleeding as they fly', 'new'],
      ['Flying debris', 'A loose wheel, a torn-off suspension arm or a wing flying off can hit someone: hard enough, it knocks him out; a suspension arm going fast enough runs him through and stays in him. In an open cockpit the driver\'s head is exposed too: struck on the helmet he\'s knocked out, or the arm goes into his helmet, and the medics come for him', 'new'],
      ['Barrier heights', 'The concrete walls, steel barriers and tyre walls are as tall to hit as they are to look at, so you only clear one if you\'re really over it', 'fix'],
      ['Single-seaters\' radiators', 'They sit in the sidepods, well back, so a head-on no longer holes them (and leaves a cloud of coolant) unless it\'s enormous, over 100 km/h into a wall', 'fix'],
    ],
  },
  {
    id: 122, date: '24 Nov 2026', title: 'Real injuries',
    items: [
      ['What a crash does to him', 'After a big crash the driver can now be hurt in many different ways, depending on how hard the hit was and which way it came: knocked out cold, slumped in the seat until the medics get him out; a suspected back injury, not daring to move; trapped by the folded front, fighting to get out and unable to, until a marshal runs over with an axe and cuts him free; a hurt leg, limping and dipping onto it every step; a hurt arm, held across his chest; whiplash, a hand on the back of his neck; hurt ribs, arms wrapped round them, bent over, down on his knees; cut and shaken, out and a few steps before he drops to the ground; concussed, wandering unsteadily then sitting with his head in his hands; burnt, running from the fire, then down and rolling', 'new'],
      ['Thrown out, shock, panic', 'In the very biggest hits he can be flung out of the car as it hits: tumbling through the air, landing hard and sliding, then lying still. In shock, he gets out, goes a few steps and lies down on his side, curled up, breathing hard. Panicking, he gets out fast and sits hunched, rocking, hyperventilating', 'new'],
      ['The medics', 'They bring the stretcher for the badly hurt (and to the car for one still in it) and walk the others to the ambulance', 'update'],
      ['G-force and whiplash', 'The driver\'s head is thrown about on his neck: forward under braking, back under power, out to the side through corners, and snapped by a hit (worst from behind). You see it on his helmet, and the cockpit view tips with his head', 'new'],
    ],
  },
  {
    id: 121, date: '24 Nov 2026', title: 'Breaking properly',
    items: [
      ['Arms tear off whole', 'When a corner is torn off, its wishbones, pushrod and track rod rip away whole from their mountings and go flying, instead of snapping in half and leaving a stub on the car', 'update'],
      ['Wheels keep their tyres', 'A wheel torn off in a crash with its tyre still on keeps the tyre as it rolls and bounces away. How bouncy it is depends on the air left in it: a full tyre springs back up, a flat one thuds and drags. A wheel worn down to the rim still comes off bare', 'update'],
    ],
  },
  {
    id: 120, date: '24 Nov 2026', title: 'People, plants and barriers',
    items: [
      ['People, not robots', 'Marshals, mechanics, medics and photographers have smooth arms and legs now: one continuous skin from shoulder to wrist and hip to ankle that bends softly at the elbows and knees, with no balls or segments at the joints. Better shaped bodies too (a waist, shoulders, a chest), faces with a jaw, brows and a mouth, a collar, zip and belt on the overalls, and proper shoes with soles', 'update'],
      ['Trees and plants', 'Trees have roots flaring at the base, a trunk that kinks as it climbs, boughs reaching into a domed crown of leafy clumps in different greens; palm fronds hang their leaflets either side of the rib; bushes are fuller; clumps of grass have more blades that curve over', 'update'],
      ['Barriers', 'Concrete walls are cast to the real shape: a broad foot sloping in, a straight face, the top edge taken off, the red and white paint round the foot. The steel barrier\'s rails have a rounder W, on steel channel posts with caps', 'update'],
    ],
  },
  {
    id: 119, date: '24 Nov 2026', title: 'Fix: racing cars load again',
    items: [
      ['Racing cars wouldn\'t load', 'The last update checked the tyres before the car\'s physics existed, which stopped the single-seaters and prototypes from loading. Fixed: they load, and still start on racing slicks', 'fix'],
    ],
  },
  {
    id: 118, date: '24 Nov 2026', title: 'TTF-05 grips like a 2005 car',
    items: [
      ['Much more grip', 'The TTF-05 had far too little grip for a 2005 Formula car: about 2.2 g in fast corners where the real cars pulled 3 g and more, so it slid wide through the quick ones like Sepang\'s Turn 3. More downforce (about 3.2 times its weight at 300 km/h) and grippier tyres: around 2.7 g at 250 km/h now. Turn 3 goes at around 240 km/h; Turn 4 is still a big stop, as it was for the real cars', 'fix'],
      ['Racing tyres from the start', 'Racing cars now start on Racing Medium slicks instead of the road cars\' Sports Medium', 'fix'],
    ],
  },
  {
    id: 117, date: '24 Nov 2026', title: 'Tidier on phones',
    items: [
      ['Smaller menus and timing', 'On phones and tablets the settings panel, the lap timing, the Garage, the news and the pause screen are drawn about a quarter smaller, so they take less of the screen. The dash and the driving controls keep their size', 'update'],
      ['Steering slider', 'The steering slider is shorter and tucked in right by the left edge of the screen, with the horn and lights buttons just above it', 'update'],
    ],
  },
  {
    id: 116, date: '24 Nov 2026', title: 'Legs to the pedals',
    items: [
      ['The driver\'s legs', 'In the single-seaters the driver now has legs: from his hips in the seat, thighs and shins run down the footwell to his feet on the pedals, the knees bending a little as his feet press and lift, as in the Caterham', 'update'],
    ],
  },
  {
    id: 115, date: '24 Nov 2026', title: 'See inside the TTF-05',
    items: [
      ['Clear bodywork', 'In the Garage, with the TTF-05 on the turntable, a Clear tickbox turns its bodywork see-through: the paint, carbon and sponsors go clear and the V10 shows in its bay, so you can look at the chassis, the cockpit tub, the sidepod ducts and radiators and the engine. Untick it for the solid car. Only the Garage\'s car changes: the one you drive stays solid', 'new'],
    ],
  },
  {
    id: 114, date: '24 Nov 2026', title: 'Open intakes',
    items: [
      ['A V10 inside', 'The TTF-05 now has its engine modelled in the bay behind the driver: a 3-litre V10, two banks of five at 72 degrees, cam covers, ten polished intake trumpets under the plenum, the exhaust headers curling back, the oil reservoir and the bellhousing. It\'s hidden under the cover for now, ready for later', 'new'],
      ['Hollow sidepods', 'The TTF-05\'s sidepod mouths are open now: a dark duct runs back into each pod, narrowing as it goes, with the radiator\'s fins at the back of it, instead of a flat black panel', 'update'],
    ],
  },
  {
    id: 113, date: '24 Nov 2026', title: 'Sponsors with proper logos',
    items: [
      ['Real-looking logos', 'Every TTF-05 sponsor has its own badge now: ZEPHRA mobile\'s swept signal arcs, KORVANE logistics\' red K block over a wave, HALDEN petroleum\'s red fuel drop with a flame inside, VELTRIS\'s hexagon, TERAVO bank\'s banded globe, QUANTEX\'s Q, NOVIK\'s star, ARDENTA\'s twin flames, ORBIXA\'s orbit', 'update'],
      ['A tyre maker', 'VALCOR tyres: the name runs round every tyre\'s sidewall, and its yellow badge is on the TTF-05\'s rear wing endplates', 'new'],
    ],
  },
  {
    id: 112, date: '24 Nov 2026', title: 'Horns and sponsors',
    items: [
      ['Horn winglets', 'The TTF-05 has a short slanted winglet each side, set low on the bodywork beside the airbox\'s mouth and rising diagonally up and out over the sidepods', 'new'],
      ['Sponsors all over', 'Nine made-up sponsors painted on, following the bodywork\'s curves: the title sponsor along the engine cover and across the rear wing, others along the sidepods\' flanks and tops, on the nose, the cockpit\'s sides, the airbox, and both wings\' endplates and planes', 'new'],
    ],
  },
  {
    id: 111, date: '24 Nov 2026', title: 'TTF-05 cameras and fin',
    items: [
      ['Real camera spots', 'On the TTF-05 the T-cam now looks out from the orange camera pod on top of the airbox, and the bonnet camera sits on top of the nose in line with where the front suspension meets it', 'update'],
      ['Airbox further back', 'The TTF-05\'s airbox, with its camera pod (and the T-cam), sits 30 cm further back, behind the driver\'s head, the fin running on from it to the rear wing', 'update'],
      ['The fin, in navy', 'The fin is now navy like the rear wing it runs into, and a little taller, so you can actually see it standing up along the engine cover', 'fix'],
    ],
  },
  {
    id: 110, date: '24 Nov 2026', title: 'TTF-05 cockpit and underside',
    items: [
      ['A proper cockpit', 'The TTF-05\'s cockpit is lined in black carbon all round: from the driver\'s seat you see the inside of the tub, the padded dash and the bulkheads, instead of looking straight through the bodywork. The stray blue shapes in the footwell are gone, and the outside driver has a proper wheel with grips, a screen, buttons and paddles', 'update'],
      ['Floor and plank', 'The floor is a flat rectangle again, stepping in round the rear wheels, and the wooden plank is fixed right under it instead of hanging below', 'fix'],
      ['Mirrors on the car', 'The mirror stalks now come up out of the bodywork into the mirrors', 'fix'],
    ],
  },
  {
    id: 109, date: '24 Nov 2026', title: 'Mind the car',
    items: [
      ['People walk round your car', 'Marshals, crew, medics and drivers on foot now step round your car when it\'s in their way, going the shorter way round its nose or tail, instead of walking into it and getting stuck. Anyone actually going to your car (a medic, a marshal) still comes right up to it, and the crew still work on it in a stop', 'fix'],
    ],
  },
  {
    id: 108, date: '24 Nov 2026', title: 'TTF-05 fin and winglets',
    items: [
      ['A fin you can see', 'The TTF-05\'s fin now carries straight on from the top of the airbox, running back in one line to meet the rear wing', 'update'],
      ['Yellow lines to the back', 'A yellow line runs from the tub down each side of the airbox and along the engine cover to the rear', 'update'],
      ['Winglets where they belong', 'The winglets now stand on the sidepods right above the gills, their pillars set into the bodywork', 'fix'],
    ],
  },
  {
    id: 107, date: '24 Nov 2026', title: 'Watch where you drive',
    items: [
      ['Run people down', 'Drive into anyone (a marshal, a mechanic, a photographer) and they\'re knocked flying, thrown ahead of the car and tumbling as hard as you hit them', 'new'],
      ['It can kill', 'Hit someone slowly and they pick themselves up; the faster you are, the likelier they don\'t: a chance from 20 km/h, certain by 80. The dead stay down (pit crew are needed for the stops, so a crewman is down a good while, then back at it)', 'new'],
    ],
  },
  {
    id: 106, date: '24 Nov 2026', title: 'Grooves and gills',
    items: [
      ['Grooved tyres on the TTF-05', 'Four grooves round every tyre, as the rules of its era required; the other cars keep their slicks', 'update'],
      ['Wider rears', 'On the single-seaters the rear tyres are now drawn wider than the fronts, as on the real cars (they already were in the physics)', 'fix'],
      ['Tread patterns the right way round', 'The tread pattern of each tyre compound is laid round the tyre and across it properly again, on both sides of the car', 'fix'],
      ['Smooth crumples', 'Crash damage now dents the bodywork smoothly instead of raising a bed of little spikes, and a crushed nose folds in broad wrinkles', 'fix'],
      ['Gills that follow the body', 'The TTF-05\'s gills are cut along the curve of the sidepods instead of poking half into them; the stump on each sidepod is gone', 'update'],
    ],
  },
  {
    id: 105, date: '24 Nov 2026', title: 'Tyres are back',
    items: [
      ['Tyres fixed', 'Since the new tyre shapes went in, the cars showed only their rims: the tyres were there but weren\'t being drawn. They\'re back, tread and sidewalls, on every car', 'fix'],
      ['TTF-05 fit', 'Sidepods slimmed to sit inside the wheels as on the real car, the floor now follows the body instead of sticking out as a slab, and the rear wing\'s endplates reach down to the diffuser, its pillar down onto the gearbox', 'update'],
    ],
  },
  {
    id: 104, date: '24 Nov 2026', title: 'TTF-05 details',
    items: [
      ['Shaped wings', 'The front endplates are cut to the real curved outline, and the rear endplates are tall and square-topped with the front cut away over the tyre', 'update'],
      ['Bargeboards', 'Proper bargeboards behind the front wheels: tall at the front, sweeping down to the sidepod mouths, with a slot cut in them', 'update'],
      ['Raised-nose suspension', 'The front wishbones now start high on the sides of the nose and angle down to the wheels, like the real car', 'update'],
      ['Sitting on the body', 'The chimneys and exhausts now sit right on the bodywork instead of hovering above it', 'update'],
    ],
  },
  {
    id: 103, date: '24 Nov 2026', title: 'TTF-05: one body',
    items: [
      ['One continuous body', 'The TTF-05 is no longer a tub with sidepods stuck on: nose, tub, high cockpit walls, sidepods, engine cover and gearbox are now one smooth skin, swelling out into the pods and pinching in hard to the back like the real thing', 'update'],
      ['Shaped from the drawings', 'High raised nose with the navy stripe, big dark sidepod mouths, the light-blue top rolling over into a crease with navy below, and the yellow running back down the tub', 'update'],
    ],
  },
  {
    id: 102, date: '24 Nov 2026', title: 'TTF-05 rebuilt',
    items: [
      ['A whole new TTF-05', 'Rebuilt from the real car\'s blueprint and photos: one flowing rear body instead of separate parts, high cockpit walls, big sidepod mouths, a raised engine cover spine with the pods dropping away either side, gills on the upper rear, a strong coke-bottle squeeze to the gearbox, the centre crease running back into the winglets, and a tall airbox and fin', 'update'],
      ['The right colours', 'Yellow nose and tub with a navy stripe, light-blue body over a navy lower flank, big navy endplates and an orange camera pod', 'update'],
    ],
  },
  {
    id: 101, date: '24 Nov 2026', title: 'Closer to the real thing',
    items: [
      ['Real tyres', 'Every car\'s tyres are shaped like real ones now: rounded shoulders and bulging sidewalls instead of plain cylinders', 'update'],
      ['No more sharp edges', 'Wings, endplates, mirrors and all the small parts have rounded edges, and the bodies are smoother', 'update'],
      ['The TTF-05, to the blueprint', 'In light blue, yellow and navy, reshaped against the real car\'s drawings, with sidepods shaped as they were (a navy lower flank undercut at the front, a crisp crease along the middle running back into the flip-up, the top rolling over and sloping in beside the chimney), and every small part properly attached: the rear wing set further forward and lower, the airbox right over the driver, sculpted sidepods, slimmer endplates. And the details of the time: shark gills down the sidepods, a fin on the engine cover, winglets, turning vanes under the nose, louvred endplates, a monkey seat over the diffuser', 'update'],
    ],
  },
  {
    id: 100, date: '19 Nov 2026', title: 'Lights where there are lights',
    items: [
      ['Headlights on the long-distance cars', 'The TTP-70 and TTP-91\'s headlights work now: G (or the button) for auto, dipped and main beam, lighting the road ahead', 'fix'],
      ['No lights or horn on a single-seater', 'The Formula cars have no headlights and no horn, so the keys do nothing in them and the buttons aren\'t there on a phone. Their rain light still comes on in the wet', 'update'],
    ],
  },
  {
    id: 99, date: '19 Nov 2026', title: 'The TTP-91',
    items: [
      ['A 1991 Group C car', 'The TTP-91 is in the Garage, under Prototype: a 1991 long-distance car of our own, in bright orange and green swoops interlocking all over it. Long, low and wide, the back wheels skirted, a ground-effect floor, a big wing on the tail, and you on the right', 'new'],
      ['The first rotary', 'A new kind of engine: a 2.6 four-rotor, about 700 hp at 9,000 rpm, that barely holds the car back off the throttle. Its own sound isn\'t made yet: for now it uses the plain engine sound', 'new'],
    ],
  },
  {
    id: 98, date: '19 Nov 2026', title: 'The TTP-70',
    items: [
      ['A 1970 long-distance prototype', 'The TTP-70 is in the Garage, under Prototype: a short-tail 1970 endurance car of our own, in light blue with a broad orange stripe. Very low, wide and short, a long low nose with the headlights in the fenders, a bubble cockpit with you sitting on the right, the tail swept up into two fins', 'new'],
      ['A 4.9 flat-12', 'A new engine: the air-cooled 4.9 flat-12, about 600 hp at 8,300 rpm and a huge spread of pull, through five gears on a lever. Its own sound isn\'t made yet: for now it uses the plain engine sound', 'new'],
      ['More 1970s cars coming', 'Also coming: the TTF-75 (a 3.0 flat-12 world champion\'s Formula car) and the TT Coupé 72 (a front-engined V8 road car)', 'new'],
    ],
  },
  {
    id: 97, date: '19 Nov 2026', title: 'New names, and the 70s',
    items: [
      ['Every car named for the game', 'All the cars in the Garage carry the game\'s name now: TTF for Formula, TTG for GT3, TTR for Rally, TTP for Prototype, TTS for Touring, and TT and a word for road cars, each with its year', 'update'],
      ['The 1970s, coming', 'Coming soon: a 1978 ground-effect Formula car, a 1974 Group 4 rally car, a 1970 flat-12 long-distance prototype and a 1973 Group 2 touring coupé', 'new'],
    ],
  },
  {
    id: 96, date: '19 Nov 2026', title: 'TTF',
    items: [
      ['Formula cars renamed', 'The Formula cars are TTF now: the TTF-88, TTF-94, TTF-05 and (coming) TTF-14. TT for Track Tester, F for Formula, and the year', 'update'],
    ],
  },
  {
    id: 95, date: '19 Nov 2026', title: 'The TT-94',
    items: [
      ['A 1990s Formula car', 'The TT-94 is in the Garage, under Formula: a 1994 V12 car of our own, in racing red and white. A raised nose with a wide drooping front wing, long sidepods with big oval mouths, a tall airbox, a tall three-element rear wing, wide slicks, and paddles behind the wheel', 'new'],
      ['The 3.5 V12, retuned', 'The 3.5 V12 is retuned to the 1994 figures: about 830 hp at 15,800 rpm, revving to 16,000, through six gears. Same sound, higher up', 'update'],
    ],
  },
  {
    id: 94, date: '19 Nov 2026', title: 'French racing blue',
    items: [
      ['The TT-05 in French racing blue', 'The TT-05\'s blue is now French racing blue, a bright azure, still with its yellow. It\'s a painted finish, not a metallic one, so it stays bright in the light', 'update'],
    ],
  },
  {
    id: 93, date: '19 Nov 2026', title: 'Noses that fold',
    items: [
      ['Head-on, the nose concertinas', 'Hit something head on in an F1 car and the nose is pushed straight back, folding up in wrinkles behind the tip, bulging a little, down to the tub. Before, a front hit only dented it in from the sides', 'fix'],
    ],
  },
  {
    id: 92, date: '19 Nov 2026', title: 'Broken suspension',
    items: [
      ['The suspension breaks', 'Lose a wheel or blow the car up and the suspension goes with it: the wishbones, pushrods and track rods snap near the chassis, leaving jagged stubs, and the rest goes flying. No more arms hanging in the air where a wheel used to be. It\'s all new again after a repair', 'fix'],
    ],
  },
  {
    id: 91, date: '19 Nov 2026', title: 'Pedals',
    items: [
      ['Pedals in the F1 cars', 'Both F1 cars have pedals in the footwell now, with his feet on them, moving as you press. The TT-88 has three: his right foot goes across from the throttle to the brake. The TT-05 has two, braked with the left foot; its clutch is on the wheel', 'new'],
    ],
  },
  {
    id: 90, date: '19 Nov 2026', title: 'Paddles',
    items: [
      ['Paddle shifts in the TT-05', 'The TT-05 has no gear lever: it changes on paddles behind the wheel, the right one up and the left one down. His hands stay on the wheel and his fingers flick the paddle', 'fix'],
    ],
  },
  {
    id: 89, date: '19 Nov 2026', title: 'The TT-05',
    items: [
      ['A 2000s Formula car', 'The TT-05 is in the Garage, under Formula: a mid-2000s V10 car of our own, in blue and yellow. A high nose with the front wing slung under it, tall waisted sidepods with chimneys and flip-ups, high cockpit sides, a narrow rear wing, and grooved tyres', 'new'],
      ['2005 numbers', 'About 605 kg, the 3.0 V10 at 19,200 rpm through seven gears, far more downforce than the TT-88 and a little less grip from its grooved tyres. About 345 km/h flat out', 'new'],
      ['The V10\'s name', 'The 3.0 V10 is just the 3.0 V10 now', 'update'],
    ],
  },
  {
    id: 88, date: '19 Nov 2026', title: 'Recovery, rebuilt',
    items: [
      ['Detailed rescue vehicles', 'The safety car, the ambulance, the recovery crane and the flatbed are all rebuilt in far more detail: properly shaped bodies, real-looking wheels and brakes, lights, mirrors, handles and hinges, light bars with LED modules, and insides you can see through the glass', 'new'],
      ['A working crane', 'The crane puts its legs out before it lifts, its boom runs out in sections one after the other, and the hook always hangs straight down on its cables with slings to the car', 'new'],
      ['Right on the bed', 'The flatbed sets off from the pits the moment the crane does. If it\'s out of reach, the crane drives over to it with your car on the hook, sets up again, and lowers it exactly onto the middle of the bed, lined up with the truck', 'fix'],
      ['Knocked flying', 'Anyone caught by a blast is thrown off their feet, tumbles, lies there a moment and gets back up. A blast brings down trees and throws signs off their posts', 'new'],
    ],
  },
  {
    id: 87, date: '19 Nov 2026', title: 'No more crackle',
    items: [
      ['Clean engine sound', 'The V10 and V12 had been turned up so far they were hitting the ceiling of what the speakers can be sent, all the time, and crackled. They\'re brought back down to just under it: still the loudest engines in the game, but clean', 'fix'],
      ['More rumble', 'The deep rumble under the V10 and V12 is stronger, most of all low in the revs', 'update'],
    ],
  },
  {
    id: 86, date: '19 Nov 2026', title: 'Howling into corners',
    items: [
      ['V10 automatic changes down early', 'On the automatic, the V10 used to wait until the revs had dropped to about 8,000 before changing down. Now, lifting off or braking, it changes down a gear at a time as soon as the next one lands at about 15,000-16,000, so you hear it blip and howl all the way down into the corner', 'update'],
    ],
  },
  {
    id: 85, date: '19 Nov 2026', title: 'Glued down',
    items: [
      ['Never lets go', 'That rather different thing you can drive now never loses grip: it goes exactly where it\'s pointed, however fast, and turns much harder. Walls still stop it', 'update'],
    ],
  },
  {
    id: 84, date: '19 Nov 2026', title: 'Penalties on screen',
    items: [
      ['Penalties shown', 'Time and drive-through penalties now come up on screen when you get one. They were being given but the message never showed', 'fix'],
      ['A little something', 'Whatever you\'re driving, win a race and you might be in for a surprise', 'new'],
    ],
  },
  {
    id: 83, date: '19 Nov 2026', title: 'Laundry day',
    items: [
      ['A new code', 'There\'s a new code to find, and something rather different to drive. Try your luck', 'new'],
    ],
  },
  {
    id: 82, date: '19 Nov 2026', title: 'Smooth through lag',
    items: [
      ['No more choppy sound when it lags', 'When the game lagged, the engine sound broke up: the sound had too little made ahead to cover the gap, and the revs jumped and held between frames. Now it keeps more sound made ahead, and the revs glide across however long a frame takes, so a stutter on screen doesn\'t chop up the engine', 'fix'],
    ],
  },
  {
    id: 81, date: '19 Nov 2026', title: 'A smooth climb',
    items: [
      ['No more bouncing revs', 'Flat out in the low gears the traction control keeps cutting in and the rear wheels slip and grip, so the revs jumped about by hundreds and the V10 and V12 sounded like they were bouncing. Now the note climbs smoothly through it, and the shifts are still sharp', 'fix'],
    ],
  },
  {
    id: 80, date: '19 Nov 2026', title: 'The V12, rebuilt',
    items: [
      ['Built from its notes', 'The 3.5 V12 is rebuilt the same way as the V10: the firing note, the rumble an octave below from one bank, and, where the V10 has a major third, the V12\'s fifths and octaves: the fifth above (its wail), the octave above (the shriek) and the fifth below (warmth). Sweeter than the V10, more of a wail. It changes with where you hear it from, like the V10', 'update'],
      ['A lot louder', 'The V10 and the V12 are both a lot louder now, and fuller', 'update'],
    ],
  },
  {
    id: 79, date: '19 Nov 2026', title: 'The V10, rebuilt',
    items: [
      ['Built from its notes', 'The 3.0 V10 is rebuilt from the notes that make a real one: the firing note (the scream), the octave below from one bank (the rumble), the major third below (the harmony) and the fifth above (the sizzle), each at its own share of the sound. At idle the rumble leads; flat out the scream does. It\'s louder too', 'update'],
      ['Where you hear it from', 'Behind the exhaust the scream and sizzle are on top; from in front the rumble and harmony come through first; a long way off the low notes carry and the highs fade. It changes as the camera moves round the car and as it goes past', 'new'],
      ['Upshifts', 'A split chop as a few cylinders drop out, a split-second spark cut with the gearbox whine and a rasp from the exhaust through it, then a soft bang as the fuel that went in unburnt goes off when the sparks come back. Every shift a little different', 'new'],
      ['Downshifts', 'The engine dips through the shift as the revs rise to the lower gear, without the old gearbox thump and clack', 'update'],
    ],
  },
  {
    id: 78, date: '19 Nov 2026', title: 'Out of step',
    items: [
      ['Nobody in step', 'Every marshal, medic and driver now has their own way of moving: their own pace, stride length, arm swing, knee lift and lean. They also set off at slightly different moments, so they never run in sync', 'fix'],
    ],
  },
  {
    id: 77, date: '19 Nov 2026', title: 'The quickest way',
    items: [
      ['The quickest clear way', 'Marshals and medics now work out the quickest way to where they\'re going that doesn\'t go through anything: round huts, trees, fences, walls and the vehicles, and over a barrier only where vaulting it beats going round', 'update'],
      ['Limp arms', 'When the hurt driver collapses, his arms drop and lie flat on the ground beside him instead of staying up in the air', 'fix'],
    ],
  },
  {
    id: 76, date: '19 Nov 2026', title: 'Garage button',
    items: [
      ['Easier to read', 'The Garage button in the side panel now has white text, so it shows up against the dark button', 'fix'],
    ],
  },
  {
    id: 75, date: '19 Nov 2026', title: 'Marshal fixes',
    items: [
      ['Vehicles that steer', 'The safety car, ambulance, flatbed and cranes steer like real vehicles: front wheels that turn, a turning circle (no spinning on the spot), wheels that roll, and a shunt when a turn\'s too tight', 'update'],
      ['Nobody walks through anything', 'Marshals, medics and the driver can\'t walk through the vehicles, the cars or each other any more', 'fix'],
      ['No sliding, no jumps', 'Their steps now keep time with how fast they\'re going, so feet don\'t slide, and a vault no longer starts with a hop backwards', 'fix'],
      ['Medics at his side', 'The medics wait until the driver\'s settled, then kneel either side of his chest, not by his feet, and the stretcher goes under his body', 'fix'],
      ['A proper fall', 'The hurt driver\'s knees give way, he goes down onto them with his hands on the ground, sits back, and slowly lies back. No more half squat and jump', 'fix'],
      ['Back on Track after a blow-up', 'Back on Track after the car\'s exploded or burnt out gives you a fresh car with the fire out, instead of the wreck with the driver climbing out of it again', 'fix'],
      ['Getting past', 'Emergency vehicles stuck behind slow cars move over and get past instead of stopping dead behind them', 'fix'],
    ],
  },
  {
    id: 74, date: '19 Nov 2026', title: 'Onto the truck',
    items: [
      ['Really onto the flatbed', 'The crane was still dropping wrecks the old way and never handing them to the truck. Now it holds the car up until the flatbed\'s beside it, swings it across, turns it to lie along the bed and sets it down on it', 'fix'],
      ['Solid vehicles', 'The safety car, ambulance, flatbed and cranes are solid: they can\'t drive through each other or the cars, and each one looks ahead and eases off for anything in its way, moving over on the track to get round it. The lower one gives way (cranes to the flatbed, the flatbed to the ambulance, the ambulance to the safety car)', 'new'],
      ['Cranes on the verge', 'The cranes now park on the grass between the track and the barrier, clear of everything, so they never go through a barrier to get out', 'fix'],
      ['Barrier repairs you can see', 'The repair crew stand on the track side of the barrier, facing it, and while they work the dents in the armco straighten out, the tyre stacks go back into line and the fence pulls flat', 'fix'],
      ['Your car first', 'With your car sat broken near its knocked-out engine block, the crane could go for the loose block and leave your car. Now your car comes first, and the bits after', 'fix'],
      ['A calmer run', 'Toned the sprint down: a real athletic run, not a cartoon one. Less knee lift and heel kick, arms swinging as far back as forward, and no more twisting and looking about', 'fix'],
    ],
  },
  {
    id: 73, date: '19 Nov 2026', title: 'The flatbed',
    items: [
      ['Onto the flatbed', 'The recovery crane doesn\'t just drop a wrecked car behind the barrier any more. It holds it up while a flatbed truck comes out of the pit lane, swings it across, lowers it onto the bed, and the truck drives it back to the pits (your car to your box). With nothing racing, it takes the short way back', 'new'],
      ['Real sprinting', 'Running flat out is now its own movement: knees driven high, heels kicked up behind, arms pumping hard from hip to chin, a bounce between strides, hips and shoulders twisting against each other', 'update'],
    ],
  },
  {
    id: 72, date: '19 Nov 2026', title: 'Climbing out',
    items: [
      ['He climbs out', 'The driver climbs out of the car properly now: sat in it, hands onto the sides of the cockpit, pushes himself up to stand on the seat, one leg over the side, then the other, and down. Quick when it\'s on fire, slow when he\'s dazed', 'update'],
      ['A real vault', 'Marshals and drivers going over a barrier plant both hands on top of it, take their weight on their arms as their hips come up and their legs swing over to the side, then land on bent knees and run on', 'fix'],
      ['Stumbling', 'A hurt driver lurches rather than walks: quick steps then nearly stopping, bent over, arms out wide for balance, his head hanging, a knee giving way now and then. He stops with his hands on his knees, goes a few more steps, then down onto a knee and over', 'update'],
      ['Helmet left behind', 'Once he\'d got out of the TT-88, his helmet stayed showing in the cockpit. Fixed', 'fix'],
      ['The crane', 'If the wreck it\'s going to gets moved, it works out a new way there', 'fix'],
    ],
  },
  {
    id: 71, date: '19 Nov 2026', title: 'Real people',
    items: [
      ['Marshals who act like people', 'A car coming straight at them: they dive out of its way and get back up (too late to dive: they duck, arms round their heads). One off the track near them: back, fast, watching it. A crash nearby: they point at it and wave the others over. Fire marshals sprint out hunched, looking about', 'new'],
      ['Over the barrier', 'Marshals vault the barrier the way real ones do, a hand on it and their legs swung over to the side, and keep running. Fences, walls and huts they go round', 'new'],
      ['Fires smothered', 'Fires don\'t just switch off any more. The marshals spray in bursts, working round the car, knocking the flames down a bit each time while they creep back in between. A big fuel fire takes both of them, and an empty extinguisher brings another marshal with a full one', 'fire'],
      ['How the driver gets out', 'On fire: over the side and a sprint clear. A big hit: he climbs out, jogs clear and sits down by the barrier to get his breath back, like Leclerc at Monza; the medics walk him to the ambulance. A really big one: he staggers out and goes down by the track, and the medics jump out with a stretcher and carry him in', 'new'],
      ['Blown up with him in it', 'If the car explodes with the driver still in it, he doesn\'t make it: he\'s left slumped and still, and the screen goes grey. Reset to go again. And the driver no longer turns black with the car', 'fire'],
      ['Real people, real vehicles', 'Everyone has a proper body now: rounded arms and legs, hands with thumbs, faces and caps for the marshals, hi-vis bands. The camera operators near you are real people following the cars. The ambulance is a proper high-roof van and the crane a proper crane, with a three-part boom and rams', 'update'],
      ['Driving like real vehicles', 'The ambulance and safety car glide along instead of jumping every 2 m. The crane crawls along the track at about 20 km/h, waits back while there\'s a fire, then lifts the wreck over the barrier and drives home. No more driving through walls and trees', 'fix'],
      ['Flags made of cloth', 'The marshals\' flags ripple and flap as they\'re waved, and droop when held still', 'update'],
      ['The driver sits properly', 'The TT-88\'s driver sits back in the seat with his head up against the headrest, and his hand moves to the gear lever for each change', 'fix'],
      ['Codes on phones', 'There\'s a box in the side panel to type codes in, so they work on a phone too', 'new'],
    ],
  },
  {
    id: 70, date: '18 Nov 2026', title: 'Big crashes',
    items: [
      ['Fires that match the crash', 'Not every crash lights the engine any more. Most don\'t catch fire at all. A hard hit at the engine\'s end can light the engine bay, a big hit at the back can split the fuel cell and start a fuel fire (the big one, with thick black smoke), and a hard side hit can put oil on hot parts for a small fire. The harder the hit, the likelier and the bigger', 'fire'],
      ['The driver gets out', 'Stopped in a burning car, the driver unclips, climbs out and runs well clear of it, then turns to watch. The ambulance comes for him and takes him to the medical centre', 'new'],
      ['Broken in two', 'Stop dead from 180 km/h or more and the car splits in two inside a huge fireball, the back half thrown on down the road, both halves burning', 'fire'],
      ['Nothing out of thin air', 'The safety car and the ambulance wait in the pit lane at the exit end and drive out of the exit road, then come back in through the entry and park. The cranes are parked at the recovery points round the lap and drive back there. Marshals come out from behind their huts', 'update'],
      ['The ambulance', 'Out for any big crash, not just a fire: it pulls up beside the car and waits, then carries on round to the pits', 'new'],
      ['Barrier damage', 'Hit the armco, a tyre wall or a fence hard and a repair crew comes out to fix it. In a race that brings the safety car, or a red flag if it\'s badly wrecked', 'new'],
      ['Panicked marshals', 'Fire marshals sprint out hunched over, looking about, with the extinguisher held across the body like a rifle', 'update'],
      ['No more clipping through walls', 'A dented car could drive straight through tyre walls and barriers, even slowly. Fixed: whatever\'s dented, walls are solid', 'fix'],
      ['A calmer cockpit', 'No more earthquake shaking, and the driver doesn\'t fight the wheel when the car\'s stopped or crashed. The TT-88\'s driver now looks like the Caterham\'s: red suit, black gloves', 'fix'],
    ],
  },
  {
    id: 69, date: '18 Nov 2026', title: 'Race control',
    items: [
      ['The safety car', 'A car stopped on the track in a race brings out the safety car (silver, with its light bar flashing): the field queues behind it, no overtaking, until the track\'s clear. Then "SAFETY CAR IN THIS LAP", and it peels off into the pit lane', 'new'],
      ['The VSC', 'A car stopped off the track brings out the virtual safety car instead: everyone slows down everywhere. Speed under it, or through double yellows, and after warnings it costs 5 seconds', 'new'],
      ['Red flags that stop the race', 'A car going up stops the race: the ambulance comes out, the wreck is cleared, and everyone lines up on the grid again in the order they were for a fresh standing start', 'new'],
      ['The recovery crane', 'A compact wheeled crane comes out from behind the barrier, lifts the wreck clear and drives it away. It only works under double yellows, a safety car or a VSC, in memory of Jules Bianchi. In practice your car comes back to your pit box fixed; in a race you\'re out', 'new'],
      ['Marshals that move', 'The marshals near you are real people now: they watch the cars go by and turn to follow them, raise and wave their flags, and step back sharply when a car comes off near them. Fire marshals run out with extinguishers to a burning car or engine, and marshals pick up bits of car left on the track', 'new'],
      ['The rules', 'Overtaking under yellow, the VSC or the safety car, or ignoring blue flags: 5 seconds. A big jump start is now a drive-through: down the pit lane without stopping, within 3 laps, or the black flag. The computer drivers slow down under yellow, queue behind the safety car, and move over when you lap them', 'new'],
      ['Grandstands and crowds', 'Grandstands at turns 1, 2, 4 and the last hairpin, full of people who stand up and cheer as you go past. Race control\'s tower on the pit building, and pit exit lights', 'new'],
      ['TT-88 cockpit', 'A proper F1-style steering wheel: squared off, with grips, the screen on the wheel, knobs, buttons and paddles, sitting below your eye line', 'fix'],
      ['Coolant colours', 'The TT-88 runs water, like real racing cars, so its leaks are clear and less slippery. The Caterham\'s antifreeze is orange', 'fix'],
    ],
  },
  {
    id: 68, date: '18 Nov 2026', title: 'Up in flames',
    items: [
      ['The car can go up', 'Leave it burning for more than 45 seconds (you get a warning at 35) and the fuel goes up: a fireball, the panels and wheels blown off, the engine thrown out, and a burnt-out shell left smouldering. In a race, that\'s a DNF', 'fire'],
      ['Or stop it dead', 'Hit something solid hard enough to stop dead from 150 km/h or more and it goes up straight away. Scrapes and glancing hits don\'t count, and neither does Reset or Back on track', 'fire'],
      ['Only with damage on', 'With the Damage switch off, nothing catches fire, so nothing goes up', 'update'],
    ],
  },
  {
    id: 67, date: '18 Nov 2026', title: 'Engine swap in the side panel',
    items: [
      ['Engine list', 'Swap engines from the side panel now: the Engine list, under Tyres. Pick any engine for the car you\'re in, and you get a fresh car with it', 'update'],
    ],
  },
  {
    id: 66, date: '16 Nov 2026', title: 'Pit lane and garages sit properly on the ground',
    items: [
      ['No more grass in the pits', 'The pit entry and exit ramps, the pit lane and the garage floors now follow every rise and dip of Sepang\'s ground, so the grass no longer pokes through them. The grass is also drawn just behind everything laid on it, so it stops flickering through the track and run-offs from far away', 'fix'],
      ['Trackside at the right height', 'The marshal posts, cameras, boards and start gantry were being lifted onto the hills twice, so they floated (the start gantry about 6 m up in the air): fixed, they all stand on the ground now', 'fix'],
      ['Distance boards', 'The new trackside boards are now just 300 and 200 m, so they don\'t double up with the 150/100/50 m boards already there', 'fix'],
    ],
  },
  {
    id: 65, date: '16 Nov 2026', title: 'Sepang gets its trackside',
    items: [
      ['Marshal posts and flags', 'Marshals all round Sepang, with flags and LED light panels. Yellow (car stopped off the track), double yellow (stopped on it), green (all clear), red (a car or its engine burning on the track), blue (a faster car about to lap you), white (slow car ahead), red and yellow stripes (oil on the track). The flag that applies to you shows at the top of the screen', 'new'],
      ['Your own flags', 'Meatball: your car is leaking or broken, pit within a lap or you get the black flag (disqualified, DSQ on the standings). Track limits: three times off and you get the black and white flag, more and it costs 5 seconds. Chequered at the finish', 'new'],
      ['Start lights and jump starts', 'A start gantry over the line: five red lights, then lights out. On the grid, hold X (or the clutch button) and press the throttle to rev, and let go of the clutch when the lights go out. Move before that and it\'s a jump start: 5 seconds added to your race time (10 if you go well clear of your grid box)', 'new'],
      ['Watchtowers, TV cameras and more', 'Watchtowers at the big corners, TV camera towers (operators under umbrellas) outside the big stops and on the straights, low cameras at the hairpins, 300/200/100 boards before the braking zones, and advertising boards along the straights', 'new'],
    ],
  },
  {
    id: 64, date: '16 Nov 2026', title: 'Damage switch',
    items: [
      ['Damage on or off', 'A new Damage switch in the side panel (under the assists). Off: crashes only scratch and dent the car. Nothing breaks, leaks, catches fire or falls off, and the computer cars get the same. Your choice is remembered', 'new'],
    ],
  },
  {
    id: 63, date: '16 Nov 2026', title: 'More ways to hurt your engine',
    items: [
      ['Stalling', 'In a manual Caterham, stopping in 3rd or higher without holding the clutch (X) stalls the engine. Press I (or tap the button) to restart, in 1st. The TT-88 has anti-stall, like a real F1 car', 'new'],
      ['Lugging', 'Flooring it at very low revs in a high gear makes the engine shudder and knock, and slowly wears it. Change down!', 'new'],
      ['Cold engine', 'The engine starts cool and warms up over about a minute (a blue temperature lamp on the dash). Revving it hard while cold wears it', 'new'],
      ['Limiter abuse', 'Sitting on the rev limiter for more than a few seconds slowly wears the valves', 'new'],
      ['Needs air to cool', 'The radiator needs speed through it. Sitting still with the revs up slowly overheats the engine until the coolant boils away', 'new'],
      ['Grass and gravel', 'Driving through grass and gravel packs the radiator (runs hotter) and clogs the air filter (less power). The pit crew can clean them out', 'new'],
      ['Cracked sump', 'Landing a jump hard on the floor cracks the sump: oil drips out behind you until the pit crew fit a new one', 'new'],
      ['Running on fumes', 'Flooring it on the last drops of fuel makes the engine run lean and burns the pistons', 'new'],
    ],
  },
  {
    id: 62, date: '15 Nov 2026', title: 'Calmer power, and wrecks that look it',
    items: [
      ['TT-88 starts facing the right way', 'Starting the game in the TT-88 left it in the middle of the track facing backwards (and missed setting up its engine sound, racing line and tyres): fixed', 'fix'],
      ['Engine thrown out', 'Hit something hard enough (head on in the Caterham, backwards in the mid-engined TT-88) and the engine is torn out: a big black block tumbles down the road, burning for about half a minute', 'new'],
      ['Wheel arches and arms', 'The Caterham\'s front wheel arches now steer and move with their wheels, bend with a crash-bent corner, and fly off when the wheel is torn away. Torn-off wheels leave their suspension arms dangling on the road instead of floating in the air', 'fix'],
      ['TT-88 fire in the right place', 'The TT-88 burns and smokes from its engine behind the driver now, and steams from the radiators in its sidepods. Side hits are what hole its radiators; only a big front hit reaches them', 'fix'],
      ['Computer cars', 'Fixed computer cars sometimes sitting dead still after a spin or a reset. A computer car too broken to drive is fixed and sent back out in practice, and retires (DNF) in a race', 'fix'],
      ['Engines have weight', 'Each engine\'s flywheel and gears now have to spin up with the wheels, so when the tyres let go the revs climb two to three times slower, instead of flashing to the redline the moment you touch the throttle', 'fix'],
      ['Throttle that suits the car', 'On the keyboard and the phone\'s pedal, the throttle squeezes on more gently in a very powerful car (up to about 0.8 s in the TT-88, a third of a second in the Caterham), so you can feel the rear tyres start to slip before it\'s wide open', 'update'],
    ],
  },
  {
    id: 61, date: '15 Nov 2026', title: 'GT7-style pit stops',
    items: [
      ['The driver drives the pits', 'Over the pit entry line the driver takes it himself: down the lane on the limiter, onto his marks, and back out to the end of the exit road, where it\'s yours again', 'update'],
      ['A new pit menu', 'It comes up once you\'re in the pit lane, in steps, with big buttons: first your tyres (the crew wait at the box until you pick), then any damage (Repair or Leave each part), then fuel last: it fills up unless you press Don\'t refuel, and Stop refuelling ends it when you\'ve enough', 'new'],
    ],
  },
  {
    id: 60, date: '15 Nov 2026', title: 'Proper crashes, and brake fires',
    items: [
      ['Big crashes', 'Damage now grows with how hard you hit. A nudge dents the nose; at 100 km/h the front crumples in folds about 80 cm deep and the front suspension bends; at 150 km/h the whole front of the car goes, both front wheels come off and the engine usually goes with it. Big hits from behind fold the rear suspension too', 'update'],
      ['Tougher radiator', 'A tap into a wall at 15 or 20 km/h no longer holes the radiator: it sits back behind the nose', 'fix'],
      ['Brake fires', 'Brakes cooked well past fading can catch fire, flames at that wheel. Air through them at speed (or letting them cool) puts it out; left burning it cooks the tyre and spreads to the car. The pit crew put it out where it is', 'new'],
    ],
  },
  {
    id: 59, date: '15 Nov 2026', title: 'Pause on phones, and a proper cockpit',
    items: [
      ['Game paused', 'On a phone, opening the menu or the side panel now pauses the game: the screen dims and everything stops exactly where it is (your speed, your slide, the lot) until you tap Continue. Picking something from the menu carries on by itself. Switching away from the game pauses it too', 'new'],
      ['Phone menu', 'Back on track is at the top of the menu now, and on a short screen the menu sits in two columns (and scrolls if it still doesn\'t fit)', 'fix'],
      ['Computer cars', 'Fixed a computer car sometimes getting stuck dead still on the track, a long way from you, and being put back again and again', 'fix'],
      ['TT-88 cockpit', 'The cockpit is open now: you sit down inside the tub on a moulded seat, with your legs running forward under the nose, a padded rim round the opening and the inside in black. The computer drivers\' cars have their drivers sitting in them too', 'update'],
    ],
  },
  {
    id: 58, date: '15 Nov 2026', title: 'A flat-plane V8',
    items: [
      ['2.4 V8 flat-plane', 'A new engine in the engine swap: a 2006 F1-style V8 revving to 19,000 rpm, with the V10\'s voice made for it: just the crank\'s two octaves. Seven gears, each change up landing a little higher', 'new'],
      ['Less echo in the engines', 'The V8, V10 and V12 voices have half the echo built into their sound. The echo off walls and buildings is the same', 'update'],
    ],
  },
  {
    id: 57, date: '15 Nov 2026', title: 'Pit stops',
    items: [
      ['The pit lane', 'At Sepang, turn into the pit lane after the last corner. Past the line the limiter holds you to 60 km/h; cross it faster and it\'s a 5 second penalty, served standing still at your box', 'new'],
      ['Choose your stop', 'A menu comes up on the way in: which tyres to fit, fill up or not, which damage to repair (with how long each takes), or drive straight through. Near your box the team take over and guide you onto your marks', 'new'],
      ['The crew', 'Jack men lift the front and back. At each wheel the gun man spins the nut off, one man pulls the old wheel away, another pushes the new one on, the nut goes back on and his hand goes up. The refueller tops you up from the churn. The lollipop goes up when it\'s all done: go', 'new'],
      ['Repairs', 'A knocked-off mirror is ripped off and a new one bolted on (mirrors can now be knocked off the TT-88). A broken wing is unbolted and put down while a new one is held in place and bolted on. Bent suspension is fixed with the wheel off. A holed radiator is patched and topped up', 'new'],
      ['Fire!', 'Come in burning and the nearest man jumps back, runs into the garage for the extinguisher and puts it out before anyone touches the car', 'new'],
      ['Retired', 'A blown engine, a torn-off wheel, a split fuel cell or a smashed radiator is too much: the team retire the car (DNF on the race standings) and push it back into the garage. Reset to start again', 'new'],
      ['Pit sounds', 'The wheel guns, the click of the jacks, the extinguisher\'s smooth roar and the glug of fuel from the churn', 'new'],
      ['Computer TT-88s', 'In the TT-88, the computer drivers drive TT-88s too, in their own colours, and no longer spin off: they feel for the grip in the fast corners', 'new'],
    ],
  },
  {
    id: 56, date: '14 Nov 2026', title: 'The Garage, and a V12',
    items: [
      ['The Garage', 'Open it from the side panel (Car → Garage). Your car stands on a turntable in a studio: drag to walk round it, pinch or scroll to step in. Its figures and power curve are at the side, and it blips its throttle now and then', 'new'],
      ['Change car', 'The key button opens the collection: Formula, GT3, Rally and more side by side, each dropping down to its cars by age, oldest first, a busy decade dropping down again. Only the TT-88 is ready; the rest are coming soon', 'new'],
      ['Fire it up', 'Pick a car and it starts with a couple of big revs, then settles to idle. Drive takes you back to the track', 'new'],
      ['The V12', 'The 3.5 V12 in the engine swap now has its own voice: the crank\'s two octaves under the firing note, its fifth on top, the same way the V10 was made. Six gears, each change up landing a little higher', 'update'],
    ],
  },
  {
    id: 55, date: '14 Nov 2026', title: 'Wheels, wings and scratches',
    items: [
      ['Bent suspension', 'A hit near a wheel bends its suspension: the wheel is knocked out of line, leans over and sags, and that corner grips less', 'update'],
      ['Wheels that come off', 'A hard enough hit (or one too many on the same corner) tears the wheel off, tyre and all, with bits of suspension, and it rolls away. For every car', 'update'],
      ['Wings that snap', 'The TT-88\'s front wing (each side) and rear wing get crushed in hits, sag and twist, then snap off and tumble down the track. Without them it loses that end\'s downforce', 'update'],
      ['Scratch marks', 'Scrapes and hits leave pale scratches in the paint, on whichever panel touched, along the way you were sliding', 'update'],
    ],
  },
  {
    id: 54, date: '14 Nov 2026', title: 'The TT-88 goes boxy',
    items: [
      ['More 80s', 'Its body is boxier now: slab sides, flat tops and crisp edges, like the cars of the time', 'update'],
    ],
  },
  {
    id: 53, date: '14 Nov 2026', title: 'The TT-88, properly',
    items: [
      ['A real car now', 'The TT-88 now has everything the Caterham has: its own rims, brake discs that glow, calipers, suspension arms and pushrods that move, tyre wear and blowouts, wheels that can come off, and a body that dents', 'update'],
      ['Its own cockpit', 'Sit in it (the cockpit camera): a small steering wheel, a screen with shift lights, the gear lever on the right, and a driver fighting the car all the time, reaching for the lever at every change, his head thrown about', 'camera'],
      ['Stiff and low', 'Very stiff springs and very little travel: the floor runs a few centimetres off the road, and throws sparks when it touches over bumps, kerbs and under braking', 'update'],
      ['Picking a car', 'Changing car in the side panel now restarts the game, so everything is built for the car you picked. The racing line plans its speeds and braking points for your car', 'update'],
    ],
  },
  {
    id: 52, date: '14 Nov 2026', title: 'Engines with character',
    items: [
      ['Seven gears', 'The 19,200 rpm engine now has a seven-speed gearbox: every change up lands a little higher, from 14,000 rpm in second up to 16,400 in seventh', 'update'],
      ['A new voice', 'It also has a brand new sound: a rumbling idle and the major-third scream at the top, louder than anything else, echoing off what\'s around it', 'update'],
      ['Every engine its own voice', 'The engines under the bonnet (if you know where to look) now each have their own sound, built from the Caterham\'s: brighter or deeper, smoother or rougher, and no longer muffled at high revs', 'update'],
    ],
  },
  {
    id: 51, date: '14 Nov 2026', title: 'Louder, clearer',
    items: [
      ['Unmuffled', 'The 19,200 rpm engine (if you know where to find it) is now the loudest in the game, and no longer muffled', 'update'],
      ['Gears that fit', 'Every engine now gets its own gear spacing: first gear tops out at about a quarter to a third of the top speed and the gears close up towards the top, so you use the whole gearbox', 'update'],
    ],
  },
  {
    id: 50, date: '14 Nov 2026', title: 'One more under the bonnet',
    items: [
      ['Screaming', 'If you know where the engines are kept, there is a new one that revs to 19,200, with its own sound', 'update'],
    ],
  },
  {
    id: 49, date: '14 Nov 2026', title: 'New car: the TT-88',
    items: [
      ['A 1988-style turbo F1 car', 'Our own design of a late-80s turbo Formula 1 car: very low and flat, huge slicks, a big rear wing, and a 1.5-litre turbo V6 with lag, whistle and pops. Pick it in the side panel under "Car"', 'update'],
      ['Basic handling for now', 'It drives with lots of grip, downforce and big carbon brakes; the finer details come later', 'update'],
      ['Under the bonnet', 'There may be more than one engine to choose from, if you know where to look', 'update'],
    ],
  },
  {
    id: 48, date: '14 Nov 2026', title: 'Phone menus and Back on track',
    items: [
      ['Menus in front', 'On phones the side panel and the menu now sit in front of everything, and what is behind them is hidden while they are open', 'update'],
      ['Back on track', 'Stuck in the gravel or facing the wrong way? Press B (or Back on track in the phone menu) to go back onto the track where you are, facing the right way. Your damage stays', 'update'],
      ['Smaller map', 'The track map in the corner is a little smaller', 'update'],
    ],
  },
  {
    id: 46, date: '14 Nov 2026', title: 'AI cars at Sepang',
    items: [
      ['Other cars on track', 'Open the side panel (the arrow on the right): under "AI cars", pick Practice or Race and how many cars (1 to 9). They are Caterhams like yours, driven with the same physics', 'update'],
      ['Practice', 'They lap on their own, spread round the track: follow them, learn their lines, overtake them', 'update'],
      ['Race', 'Pick the laps and press Start race. You start at the back of the grid: wait for the five red lights to go out. Your position, the order and the gaps are on the left of the screen, with the results at the end', 'update'],
      ['They are human', 'Every driver has his own pace and habits. Some brake late, some wander off the line, and they all get a corner wrong now and then: locking up, running wide, or overcooking the exit', 'update'],
      ['Contact', 'Switch contact on to bump, spin and damage each other, or off to drive through them like ghosts', 'update'],
    ],
  },
  {
    id: 44, date: '14 Nov 2026', title: 'Fix: barriers vanishing',
    items: [
      ['Hit barriers stay put', 'On the hills at Sepang, hitting a barrier (armco, tyre wall, catch fence, a bollard) could make it vanish: it was being redrawn at ground level of the flat test area, under the hill. It now dents, squashes or caves in right where it stands, and cracks in concrete walls show up where they should', 'barriers'],
    ],
  },
  {
    id: 42, date: '14 Nov 2026', title: 'Fix: a sound error',
    items: [
      ['Sound error fixed', 'An error ("the provided float value is not finite") could stop part of the engine sound. Fixed, and the sound now ignores any bad value instead of stopping', 'echo'],
    ],
  },
  {
    id: 41, date: '14 Nov 2026', title: 'Fix: free camera on the hills',
    items: [
      ['Free camera follows you up and down', 'In the free (orbit) camera, the point it turns around could stay at the height where you started instead of following you over the hills. It now stays on your vehicle wherever you are, and the shadows follow too', 'camera'],
    ],
  },
  {
    id: 39, date: '13 Nov 2026', title: 'Jumps, rollovers, and things running downhill',
    items: [
      ['Jumps', 'Fly off the lip of a ramp or a ledge, or over a crest fast enough, and the car really leaves the ground: it flies, keeps its spin, and lands on its springs. Land badly and the nose, floor or tail hits the ground and gets damaged', 'car'],
      ['Rollovers', 'Clip a ramp or a ridge with one side of the car, or trip sideways into something, and it can tip onto two wheels, roll over, land on its roll bar and slide upside down, or barrel-roll back onto its wheels. The bodywork scrapes and throws sparks off the tarmac, and dents where it lands. Stuck on its roof or side? Backspace puts you back on track', 'barriers'],
      ['Flying over barriers', 'High enough in the air, the car clears the walls and barriers instead of hitting them', 'barriers'],
      ['Rolling back on hills', 'Without the brakes on, the car rolls back down a slope. Uphill is slower and downhill is faster, and braking downhill takes longer. This only happens on real slopes, never on the flat', 'tyres'],
      ['Puddles in the dips', 'Rain now collects where the track dips, deeper dips first and with the biggest pools. On level ground only a few small puddles form, and none on the slopes because the water runs off. Mud forms in the hollows of the grass', 'puddles'],
      ['Oil and coolant run downhill', 'A pool on a slope creeps downhill, leaving a thin streak. Oil goes slowly, like honey; coolant runs like water. On flat ground they stay put', 'puddles'],
      ['Less coolant than oil', 'The engine holds about 4.5 litres of coolant against 7 litres of oil, so coolant trails and pools are smaller now. They also dry up slowly in the heat', 'puddles'],
      ['Round debris rolls', 'Pistons and other round engine parts roll down slopes. Lumpy ones, flat parts and chunks stay where they land', 'debris'],
    ],
  },
  {
    id: 38, date: '13 Nov 2026', title: 'Fixes: grass blocking the view, grass and gravel mixing',
    items: [
      ['No more grass ceiling', 'Looking down from high up in the free camera at Sepang, a sheet of grass could cover the whole view. The open plain beyond the hills was sitting at the circuit\'s average height, which is above the lower parts of the track. It now sits below the lowest point, and the hills slope gently down to it', 'grass'],
      ['Grass and gravel never mix', 'Gravel stones no longer appear on grass, and grass tufts no longer grow in the gravel traps. They now go by the real edges of each gravel trap and run-off', 'gravel'],
      ['Run-offs follow the hills', 'The wide run-offs, gravel traps and the pit lane now bend with the ground across their whole width, so the grass can\'t poke through them on the slopes', 'gravel'],
    ],
  },
  {
    id: 37, date: '13 Nov 2026', title: 'Sepang has hills now',
    items: [
      ['Real elevation', 'Sepang isn\'t flat any more: there\'s about 22 m between the lowest point, round turn 3, and the highest, at turn 11. The track drops through the turn 1-2 hairpin, rises through turn 4, climbs gently through 7 and 8, goes uphill through turn 9 with a crest at the apex, on up past 10 to the top at 11, then drops through the 12-13 chicane and runs gently down the straights', 'car'],
      ['Rolling ground', 'The grass, gravel traps, kerbs, barriers, buildings, trees, the racing line and the boards all sit on the hills, and the ground rolls gently away from the track', 'grass'],
      ['Driving on slopes', 'Gravity pulls the car along the slope: it\'s slower up the hills, faster down them, and it takes longer to stop braking downhill. Let go of the brakes on a hill and it rolls back. Over a crest the car goes light on its springs; through a dip it squashes down. The car tilts with the slope, and the camera keeps above the ground', 'tyres'],
      ['Everything lands on the hills', 'Skid marks, oil and coolant, puddles, rain splashes, engine debris, sparks, shredded rubber and loose wheels all follow the ground\'s real height', 'debris'],
      ['Proper corner numbers', 'The corner panel now uses Sepang\'s real turn numbers (the long turn 3 has two apexes, so it shows up twice). The sectors split after turns 4 and 11. Best laps start fresh, because the hills change the lap times', 'clock'],
    ],
  },
  {
    id: 36, date: '13 Nov 2026', title: 'Proper rims, brake discs that get hot',
    items: [
      ['Proper alloy rims', 'The wheels are now open-spoked alloys: six pairs of thin split spokes dished out to the hub, four wheel nuts round a centre cap, and a lip round the edge. The tyre is a proper ring round the rim, and the spokes face outwards on both sides of the car', 'car'],
      ['Brake discs and calipers', 'Through the spokes you can see the brake disc spinning with the wheel, and the red caliper gripping it at the back, turning with the steering', 'car'],
      ['Brakes heat up', 'Every time you brake, the discs turn your speed into heat: a hard stop from 180 km/h warms the fronts by about 100 degrees. Air flowing past cools them, faster at speed. Brake hard again and again with no time to cool and they climb past 600 degrees, where the pads start to fade: the same pedal stops you less and less (down to about half at 950 degrees)', 'gauges'],
      ['Glowing discs', 'Past about 420 degrees the discs start to glow dull red, turning orange as they get hotter. Easiest to see at night', 'lights'],
      ['Brake temperatures on the HUD', 'A thin bar beside each tyre shows its brake: grey when cold, green when working, orange when hot, and flashing red when they\'re fading', 'gauges'],
    ],
  },
  {
    id: 35, date: '13 Nov 2026', title: 'Hands on the levers, thumb on the horn',
    items: [
      ['Handbrake and gear lever wait for the hand', 'Pulling the handbrake used to snap the lever up and the hand jumped straight onto it. Now the driver\'s left hand reaches over first, and the lever only moves once he\'s got hold of it: he pulls it up, holds it while it\'s on, and pushes it back down before his hand returns to the wheel. The gear lever works the same way: hand to the knob, then the lever moves into the next gear', 'cockpit'],
      ['Thumb on the horn', 'When the left hand is busy with a lever and you sound the horn, the right hand keeps hold of the wheel and presses the horn with its thumb. The thumb now points at the middle of the wheel and reaches the horn however far the wheel is turned, instead of only when it\'s straight', 'driver'],
    ],
  },
  {
    id: 34, date: '13 Nov 2026', title: 'Real coolant and oil, moving suspension, fixes',
    items: [
      ['Coolant bursts', 'The Caterham\'s coolant is pink-red and under pressure, so a hard hit to the nose now bursts the radiator in a pink spray and a cloud of steam. After that it keeps leaking: pink drips and a trail under the nose while it steams, until it runs dry. Coolant on the road is slippery too', 'puddles'],
      ['Running without coolant', 'With the coolant gone the engine overheats and starts cooking its oil: black smoke pours out after about half a minute of driving (sooner if you thrash it), then pre-ignition makes it knock and tap and lose power, and then the engine dies', 'fire'],
      ['Oil that ages', 'Fresh engine oil is honey-yellow. The further you drive, the browner and then blacker it gets, and any oil leak shows its current colour. If coolant gets into the oil (overheating or a big front hit) it turns milky tan', 'gauges'],
      ['Suspension that moves', 'The wishbones, uprights, dampers, tie rods and driveshafts now move with each wheel: they pivot up over bumps and kerbs, the dampers squeeze, and the front tie rods and uprights swing with the steering', 'car'],
      ['Wheels hang, not fall', 'A wheel can now only drop about 7 cm below its normal height, like the real car when its damper is fully stretched. Over a crest, a jump or a ledge it hangs at that limit in the air instead of stretching down to the ground', 'tyres'],
      ['No grass in the gravel', 'At Sepang, little patches inside the wide gravel traps were being counted as grass (so grass tufts grew there, and the car drove on them as grass). The gravel traps are now gravel all the way through', 'gravel'],
      ['No more zooming on phones', 'Double-tapping or pinching the screen could zoom the page in, sometimes with no way back out. Zooming is now blocked everywhere, and if the page ever does end up zoomed in it snaps straight back', 'phone'],
      ['Clutch pedal, no clutch text', 'The "Clutch engaged" line at the top of the screen is gone. Instead the clutch pedal in the cockpit goes down when you hold X, dips for every gear change in the manual gearbox, and eases up as you pull away', 'cockpit'],
    ],
  },
  {
    id: 33, date: '13 Nov 2026', title: 'Flat tyres, GT-style braking zones, fainter rubber',
    items: [
      ['No more chattering wheel', 'Fixed a wheel flicking up and down really fast after a puncture (or running over engine debris, which punctures tyres): how far a soft tyre lets the car drop used to depend on the weight on it that instant, and the new suspension and the tyre kept chasing each other. Now a flat tyre settles the corner down smoothly', 'tyres'],
      ['Braking zones like Gran Turismo', 'The racing line stays yellow all the way round. Braking zones are their own red patch on the track: a bright red bar where to hit the brakes, fading out towards the corner. Once you\'re in a zone it stays put until its end, and the brake point no longer wobbles as your speed changes', 'lights'],
      ['Fainter rubber', 'The old rubbered-in tyre marks are now thin, faded grey streaks you mostly notice where lots of them overlap, instead of thick black bands. They still give the same little bit of extra grip', 'drift'],
    ],
  },
  {
    id: 32, date: '12 Nov 2026', title: 'Better traction out of fast corners',
    items: [
      ['Inside tyres stay planted', 'Coming out of fast corners like Sepang\'s turn 4, the inside rear tyre was being lifted almost off the road, so it spun up the moment you touched the throttle. The suspension is now set up more like the real car (a softer anti-roll bar at the front and none at the back), so the inside tyres keep more weight and grip', 'tyres'],
      ['Settles quicker', 'Firmer dampers stop the body bouncing on after a corner, and the tyres soak up tiny ripples in the road instead of being jolted by them at speed', 'car'],
      ['Smoother pedals', 'Keyboard keys and phone pedal buttons are either on or off, so the throttle now squeezes on over about a third of a second, like a foot, instead of slamming to full and spinning the rear tyres. It still comes off straight away when you let go, and the brake comes on a little quicker', 'phone'],
      ['Steady steering', 'The steering wheel still visibly kicks over bumps and kerbs, but that kick no longer turns the front tyres, which was making the car twitchy at speed', 'cockpit'],
    ],
  },
  {
    id: 31, date: '12 Nov 2026', title: 'Lap timing, track map, real sun and thick jungle',
    items: [
      ['Lap and sector times', 'At Sepang a timing panel (top left) shows your lap time, the three sector times as you finish each (purple for a new best, yellow if slower), your last and best laps, and the live gap to your best lap (green ahead, red behind). Timing starts when you first cross the line. Leave the track and the lap goes grey and won\'t count as a best. Your bests are remembered', 'clock'],
      ['Track map', 'A map of the circuit in the top right corner, north up, with the start line, the sector lines and an arrow for your car', 'phone'],
      ['The real sun', 'The sun now follows its real path over Sepang for today\'s date: it rises in the east, passes high over the track (a little to the south at this time of year) and sets in the west around 7 pm, as it does in Malaysia (clocks there run about an hour ahead of the sun). The test area uses Singapore\'s sun', 'sunset'],
      ['Thick jungle', 'The land around Sepang is now thick with trees further out, like the oil palm plantations and jungle round the real circuit, while the planting near the track stays as it was', 'grass'],
    ],
  },
  {
    id: 30, date: '12 Nov 2026', title: 'Racing line and braking zones at Sepang',
    items: [
      ['Racing line', 'A yellow dotted line shows the fastest way round Sepang: wide into each corner, clipping the inside at the apex, wide on the way out. It\'s worked out from the track itself, as the line that turns the least, so you can carry the most speed', 'tyres'],
      ['Braking zones', 'The line turns red, with a red band under it, where you need to brake. The braking zone ahead of you follows YOUR speed: come in faster than planned and it starts earlier; slower, and it starts later or disappears. The speeds are worked out from your tyres\' grip (and the rain)', 'lights'],
      ['Corner panel', 'Like Gran Turismo: a panel at the top shows the next corner, with an arrow bent the way it goes (sharper for tighter corners), its number (T1 to T15), how far away it is, and the gear and speed to take it at. It flashes BRAKE in red when you should be braking', 'gauges'],
      ['Distance boards', '150, 100 and 50 m boards stand on the outside before every big stop', 'barriers'],
      ['Old rubber', 'The track has a race weekend\'s worth of black tyre marks where everyone brakes and turns in, and fainter ones through the corners along the racing line. Rubbered-in track grips a little better (about 3%). Rain washes it away: a few minutes of heavy rain clears it', 'drift'],
      ['Switching it off', 'L (or the phone menu) turns the racing line and the corner panel off and on. It remembers your choice', 'phone'],
    ],
  },
  {
    id: 29, date: '12 Nov 2026', title: 'Trees in the test area',
    items: [
      ['Grassy islands', 'The test area\'s open ground now has round islands of grass dotted around it (real grass to drive on), each with its own trees, bushes and long grass, so there\'s scenery to drive round and between. The area round the start, the buildings and the gravel trap stays open for driving, and the woods are still round the far edges', 'grass'],
    ],
  },
  {
    id: 28, date: '12 Nov 2026', title: 'Trees, bushes and tall grass',
    items: [
      ['A tropical Sepang', 'Sepang is surrounded by oil palms, broadleaf rainforest trees, bushes (some flowering pink, like bougainvillea) and clumps of tall grass, gathered into woods with clearings between, all kept well back from the track, the run-offs and the buildings', 'grass'],
      ['Woods round the test area', 'The test area has broadleaf trees, conifers, bushes and long grass round the edges of the driving ground', 'grass'],
      ['They sway in the wind', 'Tall grass bends and shivers a lot, bushes a little, and the trees just gently, in gusts that roll across the ground, stronger in a storm', 'storm'],
      ['Solid trunks', 'Drive off far enough to hit a tree and its trunk stops you (and dents the car) like a wall', 'debris'],
    ],
  },
  {
    id: 27, date: '12 Nov 2026', title: 'Four-wheel physics',
    items: [
      ['Four real tyres', 'The car used to be worked out like a bike: one front tyre and one rear tyre. Now each of the four tyres grips on its own, with its own load, slip angle and spin. Grip builds up, peaks and then fades as a tyre slides, so you can feel the limit coming. One wheel on the grass or a kerb now really upsets the car', 'tyres'],
      ['Suspension', 'The car sits on four springs and dampers with anti-roll bars: it dives when you brake, squats when you accelerate and leans in corners, and that weight moving around changes how much each tyre can grip. You can see the body move and the wheels ride up and down underneath it', 'car'],
      ['Wheels that spin and lock on their own', 'Each wheel has its own spin: one can lock under braking or spin up on its own. ABS now eases each wheel separately and lets off enough to keep you steering while braking, and traction control watches the rear wheels directly', 'tyres'],
      ['Limited-slip differential', 'The rear wheels can turn at different speeds round a corner, but the differential stops one from spinning up alone, like the real car', 'car'],
      ['Bumps and kerbs', 'The track has small bumps and ripples, kerbs stand 2-3 cm proud and shake the car, the grass at Sepang is 4 cm below the track (drop a wheel off and that corner drops), and the yellow sausage kerbs are real humps that throw the car up', 'grass'],
      ['No power steering', 'Like a real Caterham, bumps and kerbs knock the steering: you can see the wheel kick in the driver\'s hands, and a little of it reaches the tyres', 'cockpit'],
      ['Steering at speed', 'A bit more steering lock is allowed at speed, which the four-tyre car needs to get round fast corners', 'cockpit'],
    ],
  },
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
      ['Crash damage depends on the hit', 'Nose first: the nose crumples and the radiator gets holed (steam, leaking coolant). Hit the front again, or very hard, and the engine behind it gets damaged. Backwards into a wall: the tail crumples and the fuel cell can split and leak. Side hits knock that wheel out of line, so the car pulls to one side, and a hard one can puncture the tyre. Soft tyre walls do less damage than concrete', 'debris'],
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
