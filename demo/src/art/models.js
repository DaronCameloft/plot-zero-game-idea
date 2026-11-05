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
  // 1) .glb directo · 2) versión web (glTF JSON + bytes + PNG) para hostings que no sirven .glb
  const load = async (id) => {
    try { const r = await fetch(base + id + '.glb'); if (r.ok && (r.headers.get('content-type') || '').indexOf('html') < 0) return await loader.parseAsync(await r.arrayBuffer(), base); } catch { /* sigue */ }
    const w = await (await fetch(base + 'web/' + id + '.json')).json();
    // reconstruye un GLB en memoria: JSON (con texturas por URI relativa) + BIN
    const enc = new TextEncoder(); let js = enc.encode(JSON.stringify(w.gltf)); const jp = (4 - (js.length % 4)) % 4;
    const bin = Uint8Array.from(w.bin); const bp = (4 - (bin.length % 4)) % 4;
    const total = 12 + 8 + js.length + jp + 8 + bin.length + bp; const buf = new ArrayBuffer(total); const dv = new DataView(buf); const u8 = new Uint8Array(buf);
    dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
    dv.setUint32(12, js.length + jp, true); dv.setUint32(16, 0x4e4f534a, true); u8.set(js, 20); u8.fill(0x20, 20 + js.length, 20 + js.length + jp);
    const o = 20 + js.length + jp; dv.setUint32(o, bin.length + bp, true); dv.setUint32(o + 4, 0x004e4942, true); u8.set(bin, o + 8);
    return loader.parseAsync(buf, base + 'web/');
  };
  await Promise.all(ids.map(async (id) => { out[id] = await load(id); }));
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
