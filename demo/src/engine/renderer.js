import * as THREE from 'three';

// Render a baja resolución (escalado "nearest" por CSS) + snapping de vértices estilo PS1.
const SNAP = new THREE.Vector2(200, 150);

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const resize = (camera) => {
    const w = innerWidth, h = innerHeight;
    const scale = w > 1600 ? 3.2 : w > 900 ? 2.6 : 2;
    const rw = Math.max(240, Math.floor(w / scale)), rh = Math.max(160, Math.floor(h / scale));
    renderer.setSize(rw, rh, false);
    SNAP.set(rw / 2, rh / 2);
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  };
  return { renderer, resize };
}

/** Parchea un material de Three para que sus vértices "tiemblen" como en PS1. */
export function psx(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnap = { value: SNAP };
    shader.vertexShader = 'uniform vec2 uSnap;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;`
    );
  };
  material.customProgramCacheKey = () => 'psx-' + material.type;
  return material;
}

export function canvasTex(canvas, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function lambert(opts) { return psx(new THREE.MeshLambertMaterial(opts)); }
export function basic(opts) { return psx(new THREE.MeshBasicMaterial(opts)); }
