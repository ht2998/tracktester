// =====================================================================
// SUN RAYS: beams of light streaming from the sun, blocked by buildings,
// walls, the car and anything else in the way, so you see shafts of light
// with dark gaps behind each object (the look ray tracing gives, done the
// way games do it on any device):
//   1. draw a small picture with the sun white and everything else black
//   2. smear that picture outwards from the sun, so bright gaps become rays
//   3. add the rays over the finished picture, in the sun's colour
// It only runs while the sun is on (or near) the screen, so it costs
// nothing when you're facing away.
// =====================================================================

import * as THREE from 'three';

// Version stamp: goes up by one every time this file changes, so the game
// can tell if your browser loaded an old saved copy (see updates.js)
export const BUILD = 1;

const QUAD_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Step 2: march from each pixel towards the sun, adding up the light
// along the way, fainter the further it travels
const BLUR_FRAG = (samples) => `
uniform sampler2D tOcc;
uniform vec2 sunUv;
uniform float density, weight, decay;
varying vec2 vUv;
void main() {
  vec2 delta = (vUv - sunUv) * density / float(${samples});
  vec2 uv = vUv;
  float light = 1.0;
  float sum = 0.0;
  for (int i = 0; i < ${samples}; i++) {
    uv -= delta;
    sum += texture2D(tOcc, clamp(uv, 0.0, 1.0)).r * light * weight;
    light *= decay;
  }
  gl_FragColor = vec4(vec3(sum), 1.0);
}`;

// Step 3: add the rays on top, tinted with the sun's colour
const ADD_FRAG = `
uniform sampler2D tRays;
uniform vec3 tint;
uniform float strength;
varying vec2 vUv;
void main() {
  // A contrast curve: bright shafts stay bright, the haze between them
  // drops away, so you see beams rather than a glow
  float r = texture2D(tRays, vUv).r;
  r = pow(r, 1.6) * 2.2;
  gl_FragColor = vec4(tint * r * strength, 1.0);
}`;

export class GodRays {
  constructor(renderer, scene, camera, { isMobile = false } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.scale = isMobile ? 0.25 : 0.34;           // the ray pictures are small: rays are soft anyway
    const samples = isMobile ? 28 : 48;

    const opts = { depthBuffer: true, stencilBuffer: false };
    this.occRT = new THREE.WebGLRenderTarget(4, 4, opts);
    this.rayRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false });
    this.resize();

    // Step 1: everything solid is drawn plain black...
    this.black = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
    // ...over the sun and the bright glow around it, drawn first in its own
    // little scene (the glow matters: it's what lights up the gaps between
    // buildings into long shafts, as in real life)
    this.sunScene = new THREE.Scene();
    this.sunScene.background = new THREE.Color(0x000000);
    const glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const g = glow.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.16, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    this.sunMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glow), transparent: true, fog: false, depthWrite: false })
    );
    this.sunScene.add(this.sunMesh);

    // Full-screen passes
    const quad = new THREE.PlaneGeometry(2, 2);
    this.blurMat = new THREE.ShaderMaterial({
      uniforms: {
        tOcc: { value: this.occRT.texture }, sunUv: { value: new THREE.Vector2(0.5, 0.5) },
        density: { value: 1.0 }, weight: { value: 0.034 }, decay: { value: 0.98 },
      },
      vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG(samples), depthTest: false, depthWrite: false,
    });
    this.addMat = new THREE.ShaderMaterial({
      uniforms: { tRays: { value: this.rayRT.texture }, tint: { value: new THREE.Color() }, strength: { value: 0 } },
      vertexShader: QUAD_VERT, fragmentShader: ADD_FRAG,
      blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false,
    });
    this.blurScene = new THREE.Scene();
    this.blurScene.add(new THREE.Mesh(quad, this.blurMat));
    this.addScene = new THREE.Scene();
    this.addScene.add(new THREE.Mesh(quad, this.addMat));
    this.flatCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this._v = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
    this._bg = null;
  }

  resize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const w = Math.max(16, Math.round(size.x * this.scale)), h = Math.max(16, Math.round(size.y * this.scale));
    this.occRT.setSize(w, h);
    this.rayRT.setSize(w, h);
  }

  // Called after the main picture is drawn. sun: { dir (Vector3), colour,
  // strength 0-1 }. Skips everything when the rays wouldn't be seen.
  render({ dir, colour, strength }) {
    if (!(strength > 0.01)) return;
    const cam = this.camera;
    cam.getWorldDirection(this._fwd);
    const facing = this._fwd.dot(dir);
    if (facing < 0.25) return;                     // sun well off to the side or behind
    // Where the sun is on screen (0-1)
    const p = this._v.copy(dir).multiplyScalar(400).add(cam.position).project(cam);
    const sx = (p.x + 1) / 2, sy = (p.y + 1) / 2;
    const offScreen = Math.max(0, Math.abs(p.x) - 1, Math.abs(p.y) - 1);
    const fade = strength * THREE.MathUtils.smoothstep(facing, 0.25, 0.7) * Math.max(0, 1 - offScreen * 1.2);
    if (fade < 0.01) return;

    const r = this.renderer;
    const keepTarget = r.getRenderTarget();
    const keepAutoClear = r.autoClear;
    const keepTone = r.toneMapping;
    const keepShadows = r.shadowMap.autoUpdate;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.autoUpdate = false;                // the shadows were already worked out this frame

    // 1. White sun disc on black, then everything in the world drawn black over it
    this.sunMesh.position.copy(cam.position).addScaledVector(dir, 400);
    this.sunMesh.quaternion.copy(cam.quaternion);  // face the camera
    this.sunMesh.scale.setScalar(120);        // the core is about the sun's size; the rest is its glow
    r.setRenderTarget(this.occRT);
    r.autoClear = true;
    r.render(this.sunScene, cam);
    r.autoClear = false;
    r.clearDepth();
    const keepBg = this.scene.background, keepFog = this.scene.fog;
    this.scene.background = null;
    this.scene.fog = null;
    this.scene.overrideMaterial = this.black;
    const keepMask = cam.layers.mask;
    cam.layers.set(0);                             // the world only: no sky, clouds, sun or stars
    r.render(this.scene, cam);
    cam.layers.mask = keepMask;
    this.scene.overrideMaterial = null;
    this.scene.background = keepBg;
    this.scene.fog = keepFog;

    // 2. Smear outwards from the sun into rays
    this.blurMat.uniforms.sunUv.value.set(sx, sy);
    r.setRenderTarget(this.rayRT);
    r.autoClear = true;
    r.render(this.blurScene, this.flatCam);

    // 3. Add them over the picture on screen
    this.addMat.uniforms.tint.value.copy(colour);
    this.addMat.uniforms.strength.value = fade;
    r.setRenderTarget(keepTarget);
    r.autoClear = false;
    r.render(this.addScene, this.flatCam);

    r.autoClear = keepAutoClear;
    r.toneMapping = keepTone;
    r.shadowMap.autoUpdate = keepShadows;
  }
}
