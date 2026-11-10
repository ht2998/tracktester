// =====================================================================
// TYRE LOOKS: each kind of tyre looks different on the car
//   Racing slicks  - smooth tread; a coloured band on the sidewall like F1:
//                    Soft red, Medium yellow, Hard white
//   Intermediate   - green band, shallow grooves and sipes
//   Wet            - blue band, deep grooves cut in arrow shapes
//   Comfort/Sports - road tread: grooves round the tyre and blocks across
//   Dirt           - big knobbly blocks that stick out of the tyre
//   Snow           - zigzag sipes, metal studs, and snow chains round the tyre
// The tread is painted on canvases (a colour picture plus a bump picture,
// so the grooves catch the light) and turns with the wheel, so you can see
// it rolling. Dirt tyres use a lumpy tyre shape; snow tyres get a chain model
// that's drawn with each wheel.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

// Sidewall band colour by compound (null = plain black sidewall)
const BAND = {
  RS: '#e8262b', RM: '#f4d21f', RH: '#f2f2ee',
  IM: '#2fae49', W: '#2a6fe0',
  SS: null, SM: null, SH: null, CS: null, CM: null, CH: null, DIRT: null, SNOW: null,
};
// Which tread pattern each compound uses
const TREAD = {
  RS: 'slick', RM: 'slick', RH: 'slick', IM: 'inter', W: 'wet',
  SS: 'sport', SM: 'sport', SH: 'sport', CS: 'comfort', CM: 'comfort', CH: 'comfort',
  DIRT: 'dirt', SNOW: 'snow',
};

const TW = 1024, TH = 128;      // tread canvas: across = round the tyre, down = across the tread

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// Turn a height picture (white = high) into a normal map, so the shading
// shows the grooves
function toNormalMap(heightCanvas, strength = 2.5) {
  const w = heightCanvas.width, h = heightCanvas.height;
  const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const [out, g] = canvas(w, h);
  const img = g.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength;
      const dy = (H(x, y - 1) - H(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = (dx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return out;
}

// Paint a tread pattern. Returns { colour, height } canvases.
function paintTread(kind) {
  const [col, c] = canvas(TW, TH);
  const [hgt, h] = canvas(TW, TH);
  c.fillStyle = '#1b1b1c';
  c.fillRect(0, 0, TW, TH);
  h.fillStyle = '#ffffff';                     // the tread surface is "high"
  h.fillRect(0, 0, TW, TH);
  // A groove: dark in the colour picture, low in the height picture
  const groove = (draw, width, depth = 0) => {
    for (const [g, style] of [[c, '#0b0b0c'], [h, `rgb(${depth},${depth},${depth})`]]) {
      g.strokeStyle = style;
      g.lineWidth = width;
      g.lineCap = 'round';
      g.beginPath();
      draw(g);
      g.stroke();
    }
  };
  const around = (y, w, depth) => groove((g) => { g.moveTo(0, y); g.lineTo(TW, y); }, w, depth);
  const rubberNoise = (amount) => {
    for (let i = 0; i < 2500; i++) {
      c.fillStyle = `rgba(255,255,255,${Math.random() * amount})`;
      c.fillRect(Math.random() * TW, Math.random() * TH, 2, 1);
    }
  };

  if (kind === 'slick') {
    rubberNoise(0.035);                        // smooth, just a slightly scuffed surface
  } else if (kind === 'inter') {
    around(TH * 0.3, 5, 70);
    around(TH * 0.7, 5, 70);
    for (let x = 0; x < TW; x += 32) {         // short curved sipes across the shoulders
      groove((g) => { g.moveTo(x, 4); g.quadraticCurveTo(x + 10, TH * 0.15, x + 6, TH * 0.27); }, 3, 110);
      groove((g) => { g.moveTo(x + 16, TH - 4); g.quadraticCurveTo(x + 26, TH * 0.85, x + 22, TH * 0.73); }, 3, 110);
      groove((g) => { g.moveTo(x + 8, TH * 0.36); g.lineTo(x + 18, TH * 0.64); }, 2, 120);
    }
    rubberNoise(0.03);
  } else if (kind === 'wet') {
    around(TH * 0.5, 9, 0);
    for (let x = -40; x < TW + 40; x += 26) {  // deep grooves in arrow shapes, pointing the way it rolls
      groove((g) => { g.moveTo(x, TH * 0.5); g.lineTo(x - 26, 2); }, 6, 0);
      groove((g) => { g.moveTo(x, TH * 0.5); g.lineTo(x - 26, TH - 2); }, 6, 0);
    }
    rubberNoise(0.02);
  } else if (kind === 'sport' || kind === 'comfort') {
    const lanes = kind === 'sport' ? [0.33, 0.67] : [0.22, 0.42, 0.62, 0.8];
    for (const y of lanes) around(TH * y, kind === 'sport' ? 8 : 6, 20);
    const step = kind === 'sport' ? 44 : 22;
    for (let x = 0; x < TW; x += step) {
      // blocks across the shoulders (sports: big, few; comfort: small, many)
      groove((g) => { g.moveTo(x, 0); g.lineTo(x + 6, TH * lanes[0]); }, 4, 40);
      groove((g) => { g.moveTo(x + step / 2, TH); g.lineTo(x + step / 2 + 6, TH * lanes[lanes.length - 1]); }, 4, 40);
      if (kind === 'comfort') groove((g) => { g.moveTo(x + 4, TH * 0.44); g.lineTo(x + 8, TH * 0.6); }, 2, 90);
    }
    rubberNoise(0.03);
  } else if (kind === 'dirt') {
    // Knobs: the shape itself is lumpy; this paints the gaps between them
    c.fillStyle = '#0d0d0e';
    h.fillStyle = '#000000';
    for (let row = 0; row < 24; row++) {
      for (let lane = 0; lane < 3; lane++) {
        const x = (row + (lane % 2) * 0.5) * (TW / 24);
        const y = (lane / 3) * TH;
        c.fillRect(x + TW / 24 * 0.62, y, TW / 24 * 0.38, TH / 3);
        h.fillRect(x + TW / 24 * 0.62, y, TW / 24 * 0.38, TH / 3);
      }
    }
    for (let i = 0; i < 1400; i++) {            // caked-on dust
      c.fillStyle = `rgba(120,95,65,${Math.random() * 0.25})`;
      c.fillRect(Math.random() * TW, Math.random() * TH, 3, 2);
    }
  } else if (kind === 'snow') {
    // Zigzag sipes all over, and the metal studs
    for (let y = 14; y < TH; y += 20) {
      groove((g) => {
        g.moveTo(0, y);
        for (let x = 0; x <= TW; x += 12) g.lineTo(x, y + ((x / 12) % 2 ? 5 : -5));
      }, 2, 60);
    }
    for (let x = 0; x < TW; x += 40) {
      groove((g) => { g.moveTo(x, 0); g.lineTo(x + 10, TH); }, 6, 20);
    }
    for (let i = 0; i < 90; i++) {              // studs: little bright metal dots
      const x = (i * 97) % TW, y = 10 + ((i * 37) % (TH - 20));
      c.fillStyle = '#b9bec4';
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
      h.fillStyle = '#ffffff';
    }
    rubberNoise(0.03);
  }
  return { colour: col, height: hgt };
}

// The sidewall: black rubber, a coloured band near the edge (if any), and
// faint raised lettering round it
function paintSidewall(band) {
  const S = 256;
  const [cv, g] = canvas(S, S);
  g.fillStyle = '#1a1a1b';
  g.fillRect(0, 0, S, S);
  const R = S / 2;
  if (band) {
    g.strokeStyle = band;
    g.lineWidth = S * 0.06;
    g.beginPath(); g.arc(R, R, R * 0.86, 0, Math.PI * 2); g.stroke();
    // the brand-style text block in the band colour, twice round
    g.fillStyle = band;
    for (const a of [0, Math.PI]) {
      for (let k = 0; k < 7; k++) {
        const t = a - 0.45 + k * 0.13;
        g.save(); g.translate(R + Math.cos(t) * R * 0.75, R + Math.sin(t) * R * 0.75); g.rotate(t + Math.PI / 2);
        g.fillRect(-5, -6, 10, 12); g.restore();
      }
    }
  } else {
    // plain sidewall: grey lettering dashes
    g.fillStyle = 'rgba(200,200,200,0.22)';
    for (let k = 0; k < 40; k++) {
      const t = k / 40 * Math.PI * 2;
      if (k % 10 > 6) continue;
      g.save(); g.translate(R + Math.cos(t) * R * 0.8, R + Math.sin(t) * R * 0.8); g.rotate(t + Math.PI / 2);
      g.fillRect(-3, -5, 6, 10); g.restore();
    }
  }
  g.strokeStyle = 'rgba(255,255,255,0.06)';      // the rim line
  g.lineWidth = 3;
  g.beginPath(); g.arc(R, R, R * 0.66, 0, Math.PI * 2); g.stroke();
  return cv;
}

// A tyre shape with knobbly blocks standing out of the tread (dirt tyres)
function knobblyGeometry(radius, width) {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 144, 6);
  geo.rotateZ(Math.PI / 2);                     // axle along x
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.y, v.z);
    if (r < radius * 0.98 || Math.abs(v.x) > width / 2 - 1e-4 && r < radius * 0.999) continue;   // only the tread surface
    const a = (Math.atan2(v.z, v.y) + Math.PI) / (Math.PI * 2);   // 0-1 round the tyre
    const lane = Math.min(2, Math.floor((v.x / width + 0.5) * 3));
    const phase = (a * 24 + (lane % 2) * 0.5) % 1;
    const knob = phase < 0.62 ? 0.018 : -0.004;
    const edge = Math.abs(v.x) > width / 2 - 0.02 ? 0.5 : 1;    // knobs taper at the edges
    const s = (r + knob * edge) / r;
    pos.setY(i, v.y * s);
    pos.setZ(i, v.z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

// Snow chains: a ring of chain along each side of the tyre, joined by cross
// chains across the tread every so often
function chainGeometry(radius, width) {
  const parts = [];
  const ringR = radius * 0.93;
  for (const side of [-1, 1]) {
    const ring = new THREE.TorusGeometry(ringR, 0.006, 5, 48);
    ring.rotateY(Math.PI / 2);
    ring.translate(side * (width / 2 + 0.006), 0, 0);
    parts.push(ring);
  }
  const N = 10;
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    // a cross chain zigzags over the tread: two links, angled
    for (const [x0, x1, da] of [[-1, 0, 0.06], [0, 1, -0.06]]) {
      const link = new THREE.CylinderGeometry(0.006, 0.006, width / 2 + 0.02, 5);
      link.rotateZ(Math.PI / 2);
      link.translate((x0 + x1) / 2 * (width / 2), 0, 0);
      link.translate(0, Math.cos(a + da) * (radius + 0.004), Math.sin(a + da) * (radius + 0.004));
      parts.push(link);
    }
  }
  // Merge into one shape by hand (positions, normals, indices)
  let vCount = 0, iCount = 0;
  for (const p of parts) { vCount += p.attributes.position.count; iCount += p.index.count; }
  const position = new Float32Array(vCount * 3), normal = new Float32Array(vCount * 3);
  const index = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const p of parts) {
    position.set(p.attributes.position.array, vo * 3);
    normal.set(p.attributes.normal.array, vo * 3);
    for (let i = 0; i < p.index.count; i++) index[io + i] = p.index.array[i] + vo;
    vo += p.attributes.position.count;
    io += p.index.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

export class TyreLooks {
  // tyres: the car's InstancedMesh of 4 tyres (a cylinder along x)
  constructor(car, tyres, { radius, width }) {
    this.tyres = tyres;
    this.radius = radius;
    this.width = width;
    this.roundGeo = tyres.geometry;
    this.knobGeo = null;
    this.cache = {};
    // Snow chains, drawn with each wheel (hidden unless snow tyres are on)
    this.chains = new THREE.InstancedMesh(
      chainGeometry(radius, width),
      new THREE.MeshStandardMaterial({ color: 0xa7adb3, metalness: 0.9, roughness: 0.35 }),
      4
    );
    this.chains.castShadow = true;
    this.chains.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.chains.visible = false;
    this.chains.frustumCulled = false;
    car.add(this.chains);
  }

  // The tread, sidewall and inner-sidewall materials for a compound (made once)
  materials(id) {
    if (this.cache[id]) return this.cache[id];
    const kind = TREAD[id] || 'sport';
    const key = kind + (BAND[id] || '');
    if (this.cache[key]) return (this.cache[id] = this.cache[key]);
    const paint = paintTread(kind);
    const tex = (cv, srgb) => {
      const t = new THREE.CanvasTexture(cv);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const tread = new THREE.MeshStandardMaterial({
      map: tex(paint.colour, true),
      normalMap: tex(toNormalMap(paint.height, kind === 'dirt' ? 1.5 : 3)),
      normalScale: new THREE.Vector2(1, 1),
      roughness: kind === 'slick' ? 0.72 : 0.88,
    });
    const side = new THREE.MeshStandardMaterial({ map: tex(paintSidewall(BAND[id]), true), roughness: 0.8 });
    const set = [tread, side, side];               // cylinder: tread, then the two sidewalls
    this.cache[key] = set;
    this.cache[id] = set;
    return set;
  }

  // Put a compound's look on the car
  apply(id) {
    this.tyres.material = this.materials(id);
    if (TREAD[id] === 'dirt') {
      this.knobGeo = this.knobGeo || knobblyGeometry(this.radius, this.width);
      this.tyres.geometry = this.knobGeo;
    } else {
      this.tyres.geometry = this.roundGeo;
    }
    this.chains.visible = id === 'SNOW';
    this.current = id;
  }

  // Each frame, alongside the tyres: the chains follow wheel i
  setMatrixAt(i, matrix) {
    if (this.chains.visible) this.chains.setMatrixAt(i, matrix);
  }

  update() {
    if (this.chains.visible) this.chains.instanceMatrix.needsUpdate = true;
  }
}
