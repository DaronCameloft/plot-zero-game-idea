import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { psx } from '../engine/renderer.js';

// Carga los modelos v0.1.0 exportados desde Blender (art/models → demo/models) y los envuelve
// con un AnimationMixer y una API sencilla: play('Walk'), animate(dt, velocidad).
const loader = new GLTFLoader();

function toPS1(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const conv = mats.map((m) => {
      if (m.map) { m.map.magFilter = THREE.NearestFilter; m.map.minFilter = THREE.NearestFilter; m.map.generateMipmaps = false; m.map.needsUpdate = true; }
      const n = new THREE.MeshLambertMaterial({ map: m.map || null, color: m.color, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity ?? 1, emissiveMap: m.emissiveMap || null,
        transparent: m.transparent, opacity: m.opacity, side: THREE.DoubleSide, depthWrite: !m.transparent });
      n.name = m.name; return psx(n);
    });
    o.material = Array.isArray(o.material) ? conv : conv[0];
  });
}

export async function loadModels(base = './models/') {
  const ids = ['oliver', 'claire', 'elliot', 'recolector', 'palimpsest'];
  const out = {};
  await Promise.all(ids.map(async (id) => { out[id] = await loader.loadAsync(base + id + '.glb'); }));
  return out;
}

export function makeActor(gltf, id) {
  const root = new THREE.Group(); root.name = id;
  const model = gltf.scene; toPS1(model); root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
  for (const [n, a] of Object.entries(actions)) if (['Sit', 'Reach', 'Lunge'].includes(n)) { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
  const glitch = []; model.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (/Glitch|fantasma/i.test(m.name)) glitch.push(m); }); });
  let current = null; let t = 0;
  const api = {
    id, root, model, mixer, actions, seated: false, crouch: false, override: null, speedScale: 1,
    play(name, fade = 0.2) {
      const a = actions[name]; if (!a || current === a) return;
      a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
      if (current) current.crossFadeTo(a, fade, false);
      current = a; api.state = name;
    },
    /** speed: 0 quieto · 1 caminar · 2 correr. Los monstruos usan Walk/Crawl. */
    animate(dt, speed) {
      t += dt;
      let name;
      if (api.override) name = api.override;
      else if (api.seated) name = 'Sit';
      else if (id === 'palimpsest') name = speed > 0.05 ? 'Crawl' : 'Idle';
      else if (id === 'recolector') name = speed > 0.05 ? 'Walk' : 'Idle';
      else if (api.crouch) name = 'Crouch';
      else name = speed > 1.5 ? 'Run' : speed > 0.05 ? 'Walk' : 'Idle';
      api.play(name);
      if (current) current.timeScale = (name === 'Crouch' && speed < 0.05) ? 0 : api.speedScale;
      mixer.update(dt);
      // glitch del Recolector: esquirlas y cabezas fantasma que parpadean
      for (const m of glitch) m.opacity = Math.random() < 0.18 ? 0 : (0.25 + Math.random() * 0.6);
    },
  };
  api.play(id === 'palimpsest' || id === 'recolector' ? 'Idle' : 'Idle', 0);
  return api;
}
