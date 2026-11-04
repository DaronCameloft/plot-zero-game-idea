import * as THREE from 'three';
import { createRenderer, lambert, basic, canvasTex } from './engine/renderer.js';
import { Flow } from './engine/flow.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { buildWorld } from './world/world.js';
import { buildPipScreens } from './art/characters.js';
import { loadModels, makeActor } from './art/models.js';
import { portrait, drawPIP, mk } from './art/paint.js';
import { createRun, companions, CHARACTERS, IDS, Lucidity, Archives, Quota, ENDINGS, VIGIL_FILES } from './game/state.js';
import { loadMemory, saveMemory, wipeMemory } from './game/memory.js';
import { Noise } from './game/noise.js';
import { Player, NPC, RecolectorAI, PalimpsestAI } from './game/actors.js';
import { buildNav } from './game/nav.js';
import { makeScenes } from './game/scenes.js';
import { UI } from './ui/ui.js';
import { TaskUI } from './ui/tasks.js';

// ------------------------------------------------------------------ composición (raíz del "hexágono")
const canvas = document.getElementById('game');
const { renderer, resize } = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.06, 320);
addEventListener('resize', () => resize(camera)); resize(camera);
const input = new Input(canvas), audio = new Audio(), flow = new Flow(), noise = new Noise();
const pip = buildPipScreens();
const MAP = await (await fetch('./data/eden0.json')).json();
const world = buildWorld(scene, MAP, pip);
const nav = buildNav(MAP, world);
let memory = loadMemory();
const gltfs = await loadModels('./models/');
const actors = Object.fromEntries(['oliver', 'claire', 'elliot', 'recolector', 'palimpsest'].map((id) => [id, makeActor(gltfs[id], id)]));
Object.values(actors).forEach((a) => scene.add(a.root));
document.getElementById('loading').remove();

const game = { scene, camera, renderer, world, nav, pip, actors, input, audio, flow, noise, memory, run: createRun(), active: false, paused: false, control: true, decoy: false, onCaught: null, heardVoice: false, scriptWalk: null };
const players = Object.fromEntries(IDS.map((id) => [id, new Player(game, actors[id])]));
const npcs = Object.fromEntries(IDS.map((id) => [id, new NPC(game, actors[id])]));
game.rec = new RecolectorAI(game, actors.recolector); game.recAI = game.rec;
game.pal = new PalimpsestAI(game, actors.palimpsest);
const ui = new UI(game); game.ui = ui;
const tasks = new TaskUI(game); game.tasks = tasks;
game.player = players.claire;

// linterna (SpotLight que sigue a la cámara)
const torch = new THREE.SpotLight('#fff2d0', 0, 22, 0.5, 0.45, 1.2); scene.add(torch); scene.add(torch.target);
let torchOn = false; game.flashlight = (on) => { torchOn = on; torch.intensity = on ? 30 : 0; };

// ------------------------------------------------------------------ interacción (tareas, casilleros, ductos)
let interactables = [], cleanups = [], holdT = 0;
function nearestLocker() { let b = null, bd = 1.15; for (const L of world.lockers) { const d = Math.hypot(L.front.x - game.player.pos.x, L.front.z - game.player.pos.z); if (d < bd) { bd = d; b = L; } } return b; }
function nearestVent(duct) { let b = null, bd = duct ? 1.1 : 1.3; for (const v of world.vents) { const px = duct ? v.x : v.x, pz = duct ? v.z : v.z + 0.6; const d = Math.hypot(px - game.player.pos.x, pz - game.player.pos.z); if (d < bd) { bd = d; b = v; } } return b; }
function enterLocker(L) {
  const P = game.player; if (game.pal.mode === 'hunt' && game.pal.canSee()) { game.pal.last = new THREE.Vector3(L.x, 0, L.z); game.pal.goTo(game.pal.last, game.pal.speed); game.pal.search = 0; }
  P.mode = 'locker'; P.hidden = true; P.locker = L; P.actor.root.visible = false; P.crouch = false; document.body.classList.add('in-locker'); audio.knock(); P.breath = 1;
}
function exitLocker() { const P = game.player, L = P.locker; P.mode = 'walk'; P.hidden = false; P.locker = null; P.actor.root.visible = true; P.place(L.front, Math.atan2(-L.fx, -L.fz)); document.body.classList.remove('in-locker'); L.door.position.z = 0.305; }
function enterDuct(v) { const P = game.player; P.pos.set(v.x, v.ductY, v.z); P.mode = 'duct'; P.crouch = false; document.body.classList.add('in-duct'); audio.clunk(); noise.emit(P.pos, 0.6, 'rejilla'); P.snapCamera = true; }
function exitDuct(v) { const P = game.player; P.pos.set(v.x, 0, v.z + 0.9); P.mode = 'walk'; document.body.classList.remove('in-duct'); audio.clunk(); noise.emit(P.pos, 0.6, 'rejilla'); P.snapCamera = true; }

function updateInteractions(dt) {
  const P = game.player;
  if (!game.control || ui.blocking || tasks.active) { ui.prompt(''); return; }
  if (P.mode === 'locker') {
    P.holding = input.down('Space') && P.breath > 0;
    P.breath = Math.max(0, Math.min(1, P.breath + (P.holding ? -dt * 0.22 : dt * 0.3)));
    document.querySelector('#breath i').style.width = Math.round(P.breath * 100) + '%';
    ui.prompt('[E] Salir del casillero'); if (input.pressed('KeyE')) exitLocker(); return;
  }
  let best = null, bd = 1e9;
  for (const it of interactables) {
    if (it.when && !it.when()) continue;
    const label = typeof it.label === 'function' ? it.label() : it.label; if (!label) continue;
    const d = Math.hypot(it.pos.x - P.pos.x, it.pos.z - P.pos.z); if (Math.abs((it.pos.y || 0) - P.pos.y) > 2.5) continue;
    if (d < (it.r || 1.6) && d < bd) { bd = d; best = { it, label }; }
  }
  if (!best && P.mode === 'walk') { const L = nearestLocker(); if (L) best = { it: { use: () => enterLocker(L) }, label: 'Esconderse en el casillero' }; }
  if (!best) { const v = nearestVent(P.mode === 'duct'); if (v && P.mode === 'duct') best = { it: { use: () => exitDuct(v) }, label: 'Salir por la rejilla' }; else if (v && P.mode === 'walk' && world.roomAt(P.pos.x, P.pos.z)?.id === v.room) best = { it: { use: () => enterDuct(v) }, label: 'Entrar al ducto de ventilación' }; }
  if (!best) { ui.prompt(''); holdT = 0; return; }
  if (best.it.hold) {
    if (input.down('KeyE')) { holdT += dt; best.it.onTick && Math.random() < dt * 3 && best.it.onTick(); if (holdT >= best.it.hold) { holdT = 0; audio.interact(); best.it.use(); } } else holdT = 0;
    ui.prompt(`[Mantén E] ${best.label}`, holdT / best.it.hold);
  } else { ui.prompt(`[E] ${best.label}`); if (input.pressed('KeyE')) { audio.interact(); best.it.use(); } }
}

// ------------------------------------------------------------------ cámara guionizada
let camTween = null;
function shot(pos, look, dur = 0) {
  game.player.camScripted = true; const to = pos.clone(), lookTo = look.clone();
  if (!dur) { camera.position.copy(to); camera.lookAt(lookTo); camTween = { to, lookTo, done: true }; return; }
  const lookFrom = new THREE.Vector3(); camera.getWorldDirection(lookFrom); lookFrom.multiplyScalar(5).add(camera.position);
  camTween = { from: camera.position.clone(), to, lookFrom, lookTo, t: 0, dur };
}
function updateCamTween(dt) {
  if (!camTween || !game.player.camScripted) return;
  if (camTween.done) { camera.position.copy(camTween.to); camera.lookAt(camTween.lookTo); return; }
  camTween.t = Math.min(1, camTween.t + dt / camTween.dur); const k = camTween.t * camTween.t * (3 - 2 * camTween.t);
  camera.position.lerpVectors(camTween.from, camTween.to, k); camera.lookAt(new THREE.Vector3().lerpVectors(camTween.lookFrom, camTween.lookTo, k));
  if (camTween.t >= 1) camTween.done = true;
}
function snapshot(pos, look, label) {
  const p = camera.position.clone(), q = camera.quaternion.clone(); camera.position.copy(pos); camera.lookAt(look);
  world.updateAtmo(camera.position, T); renderer.render(scene, camera);
  const [c, g] = mk(320, 200); g.drawImage(renderer.domElement, 0, 0, 320, 200); camera.position.copy(p); camera.quaternion.copy(q); return { canvas: c, label };
}

// ------------------------------------------------------------------ contexto de escena
function fill(text) { const r = game.run, [a, b] = companions(r); return text.replaceAll('{op}', r.operator).replaceAll('{me}', CHARACTERS[r.awakened].short).replaceAll('{A}', CHARACTERS[a].short).replaceAll('{B}', CHARACTERS[b].short); }
function makeCtx() {
  const f = flow.bind(); const [A, B] = companions(game.run);
  const keep = (p) => p.then((v) => (f.alive() ? v : new Promise(() => {})));
  const c = {
    ...f, A, B, npc: (id) => npcs[id],
    say: (spk, text, opts) => f.guard(ui.say(spk, fill(text), opts)),
    choose: (spk, text, choices) => f.guard(ui.say(spk, fill(text), { choices: choices.map(fill) })),
    fade: async (to, d = 1) => { ui.fade(to, d); await f.wait(d); },
    card: async (t, s, d = 2.2) => { ui.card(t, s); await f.wait(d); ui.hideCard(); },
    objective: (t) => ui.objective(t ? fill(t) : ''), day: (a, b) => ui.day(a, b), phase: (p) => { world.setPhase(p); game.flashlight(p === 'night' || p === 'purge'); },
    control: (on) => { game.control = on; }, shot, freeCam: () => { game.player.camScripted = false; game.player.snapCamera = true; },
    interact: (def) => { interactables.push(def); return def; }, background: (fn) => { fn().catch((e) => console.error(e)); },
    onCleanup: (fn) => cleanups.push(fn), cctv: (pos, look, label) => snapshot(pos, look, label),
    task: (kind) => keep(tasks[kind]()),
    useAt: (pos, label, r = 1.6) => keep(new Promise((res) => { const d = { pos, r, label, use: () => { interactables = interactables.filter((x) => x !== d); ui.objective(''); res(); } }; interactables.push(d); })),
    holdAt: (pos, label, hold = 1.5, when, onTick) => keep(new Promise((res) => { const d = { pos, r: 1.9, label, hold, when, onTick, use: () => { interactables = interactables.filter((x) => x !== d); res(); } }; interactables.push(d); })),
    useChoice: async (pos, label, spk, text, choices) => { await c.useAt(pos, label); c.control(false); const i = await c.choose(spk, text, choices); c.control(true); return i; },
    npcWalk: (id, target, speed) => { const n = npcs[id]; n.goTo(target, speed); game.scriptWalk = n; return f.until(() => n.arrived).then(() => { game.scriptWalk = null; }); },
  };
  return c;
}

// ------------------------------------------------------------------ ciclo de vida de escenas
const snapshots = {}; let currentScene = null, lastEnding = null;
const sceneApi = { game, start: (id, o) => startScene(id, o), finish: (E) => showEnding(E), officeScene: (c) => officeScene(c) };
const SCENES = makeScenes(sceneApi);
const setup = { operator: memory.operator || 'Operador', awakened: memory.lastAwakened || 'claire' };

function resetStage() {
  cleanups.forEach((fn) => { try { fn(); } catch { } }); cleanups = [];
  interactables = []; noise.clear(); camTween = null; holdT = 0;
  game.control = false; game.decoy = false; game.onCaught = null; game.scriptWalk = null; game.catching = false; input.enabled = true;
  ui.reset(); document.body.classList.remove('in-locker', 'in-duct');
  for (const d of Object.values(world.doors)) d.set(d.type === 'open' || d.type === 'door');
  world.resetPlots(); world.seam.visible = false; world.setCameras(false); world.setBoard(game.run.quota, !!game.run.flags.bodyRevealed);
  for (const r of MAP.rooms) world.lightsRoom(r.id, true);
  for (const id of ['oliver', 'claire', 'elliot']) { const a = actors[id]; a.seated = false; a.override = null; a.root.visible = true; a.root.position.y = 0; a.crouch = false; }
  for (const P of Object.values(players)) { P.mode = 'walk'; P.hidden = false; P.locker = null; P.carry = null; P.crouch = false; }
  Object.values(npcs).forEach((n) => { n.stop(); n.lookAtPos = null; n.follow = null; });
  game.rec.setMode('off'); game.pal.setMode('off'); actors.palimpsest.override = null; actors.recolector.override = null;
  actors.palimpsest.model.rotation.z = 0; actors.palimpsest.model.position.y = 0; actors.palimpsest.root.scale.setScalar(1); actors.recolector.root.scale.setScalar(1);
  if (world.special.curtain) world.special.curtain.position.y = 4.2;
  (world.special.monitors || []).forEach((m) => m.material.color.set('#2f5a50'));
  pip.set({ glitch: 0, talking: false });
  game.player = players[game.run.awakened]; game.player.camScripted = false;
  game.flashlight(false); ui.fade(1, 0);
}
function applyPreset(run, p) { if (!p) return; if (p.quota != null) run.quota = p.quota; if (p.lucidity != null) run.lucidity = p.lucidity; if (p.archives) run.archives = [...p.archives]; if (p.affinity != null) for (const id of IDS) run.affinity[id] = p.affinity; if (p.day6) run.day6 = p.day6; run.exposure = Math.round(run.quota * 0.6); }
function startScene(id, { jump = false, restore = false } = {}) {
  const sc = SCENES.find((s) => s.id === id); if (!sc) return;
  flow.reset();
  if (restore && snapshots[id]) game.run = structuredClone(snapshots[id]);
  else if (jump) { game.run = createRun({ operator: setup.operator, awakened: setup.awakened, cycle: memory.globalCycle }); applyPreset(game.run, sc.preset); }
  snapshots[id] = structuredClone(game.run); currentScene = id;
  resetStage(); ui.hideScreen(); ui.showHUD(true); ui.objective('');
  game.active = true; game.paused = false; audio.init();
  sc.run(makeCtx()).catch((e) => console.error(e));
}

// ------------------------------------------------------------------ final "Cosecha completa": la oficina
async function officeScene(c) {
  const shotImg = snapshot(new THREE.Vector3(0, 6, 8), new THREE.Vector3(0, 1, 30), '');
  const office = new THREE.Group(); office.position.set(300, 0, 0); scene.add(office); c.onCleanup(() => scene.remove(office));
  const Bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); office.add(o); return o; };
  Bx(8, 0.1, 8, lambert({ color: '#2b2a28' }), 0, 0, 0); Bx(8, 3.2, 0.2, lambert({ color: '#4a4c47' }), 0, 1.6, -3); Bx(2.4, 0.08, 1.1, lambert({ color: '#5a4630' }), 0, 0.78, -1.8); Bx(0.9, 0.75, 0.8, lambert({ color: '#2b2a26' }), 0, 1.2, -2.1);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.5), basic({ map: canvasTex(shotImg.canvas) })); scr.position.set(0, 1.24, -1.69); office.add(scr);
  const pale = lambert({ color: '#cfc9bd' });
  Bx(0.6, 0.08, 0.6, lambert({ color: '#222' }), 0, 0.5, -0.7); Bx(0.46, 0.6, 0.26, pale, 0, 0.95, -0.62); const head = Bx(0.27, 0.36, 0.29, pale, 0, 1.48, -0.66); head.rotation.x = 0.15;
  for (const s of [-1, 1]) { Bx(0.17, 0.12, 0.6, pale, s * 0.12, 0.6, -0.9); Bx(0.12, 0.12, 0.55, pale, s * 0.3, 1.0, -0.95); }
  const lamp = new THREE.PointLight('#ffd84a', 6, 9, 1.2); lamp.position.set(0, 1.3, -1.4); office.add(lamp);
  ui.showHUD(false); world.setPhase('night'); scene.fog.near = 2; scene.fog.far = 14;
  shot(new THREE.Vector3(300, 1.24, -1.25), new THREE.Vector3(300, 1.24, -1.7)); await c.fade(0, 1.2);
  await c.say('pip', 'Gracias por cada cosecha. Por cada riego. Por cada orden cumplida.');
  shot(new THREE.Vector3(300.9, 1.9, 1.9), new THREE.Vector3(300, 1.1, -1.2), 5); await c.wait(5.2);
  await c.say('pip', '*Thank you, {op}. I\'ll take it from here.*'); audio.speak('Thank you, ' + game.run.operator); await c.fade(1, 1.5);
}

// ------------------------------------------------------------------ pantallas
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function putCanvas(el, src) { const g = el.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, el.width, el.height); }
function memoryLine() { const ends = Object.entries(memory.endings).map(([k, v]) => `${ENDINGS[k]?.title || k} ×${v}`).join(' · ') || 'ninguno'; return `Ciclo global: <b>${memory.globalCycle.toLocaleString('es')}</b> · Partidas terminadas: <b>${memory.runs}</b> · Finales vistos: ${esc(ends)}${memory.badges.length ? ` · Gafetes que lleva el Recolector: <b>${memory.badges.length}</b>` : ''}`; }
function titleScreen() {
  game.active = false; ui.showHUD(false); ui.reset(); ui.fade(0, 0.6); input.releaseLock(); flow.reset();
  world.setPhase('night'); shot(new THREE.Vector3(-6, 2.2, 24), new THREE.Vector3(0, 2.6, 6));
  const let_go = memory.endings.soltar;
  const s = ui.screen(`<div class="wrap">
    <div class="corp">ARCADIA EDEN CORP. · PROGRAMA CONTINUIDAD · <i>tu trabajo, para siempre</i></div>
    <h1 class="logo">PLOT ZERO</h1><div class="logo-sub">CULTIVO CERO · CAPÍTULO 1 · DEMO v0.2</div>
    <div class="row"><canvas class="pip-crt" id="title-pip" width="160" height="128"></canvas>
      <div style="flex:1;min-width:260px;max-width:560px">
        <p style="margin-top:0;line-height:1.6;color:var(--ink-dim)">Tres pasantes cultivan Lumen durante siete días en Eden-0, guiados por PIP. De noche, algo de tres patas camina por los pasillos. Uno de los tres despierta: el cielo tiene costuras, la mascota miente… y alguien, al otro lado de la pantalla, le mueve las manos.</p>
        <label class="field" for="op">Nombre de operador (el juego lo usará)</label><input type="text" id="op" maxlength="16" value="${esc(setup.operator)}" autocomplete="off">
      </div></div>
    <label class="field">¿Quién despierta? · en solitario tú siempre eres el despierto</label>
    <div class="chars">${let_go ? '<p style="grid-column:1/-1;color:var(--ink-dim)">(vacío) · Soltaste las manos. Aquí ya no hay nadie a quien mover.</p>' : IDS.map((id) => `
      <button class="charcard" data-id="${id}" aria-pressed="${id === setup.awakened}"><canvas width="96" height="120" data-portrait="${id}"></canvas>
        <h3>${CHARACTERS[id].name}</h3><p>${CHARACTERS[id].job} · ${CHARACTERS[id].stat}<br><i>“${esc(CHARACTERS[id].line)}”</i><br>Ruta: ${CHARACTERS[id].route}</p></button>`).join('')}</div>
    <div class="toggles"><label><input type="checkbox" id="tts" ${audio.ttsOn ? 'checked' : ''}> Voz de sistema (dice tu nombre)</label><label><input type="checkbox" id="mic"> Dejar que el juego te escuche (micrófono, solo volumen)</label></div>
    <div class="actions"><button class="btn" id="play">EMPEZAR CICLO</button><button class="btn ghost" id="scenes">ESCENAS</button><button class="btn ghost" id="gallery">PERSONAJES</button><button class="btn ghost" id="wipe">OLVIDAR</button></div>
    <div class="memory">${memoryLine()}</div></div>`);
  s.querySelectorAll('canvas[data-portrait]').forEach((c) => putCanvas(c, portrait(c.dataset.portrait)));
  s.querySelectorAll('.charcard').forEach((b) => (b.onclick = () => { setup.awakened = b.dataset.id; s.querySelectorAll('.charcard').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
  const readSetup = () => { setup.operator = (s.querySelector('#op').value || 'Operador').trim().slice(0, 16) || 'Operador'; audio.ttsOn = s.querySelector('#tts').checked; if (s.querySelector('#mic').checked) audio.enableMic(); memory.operator = setup.operator; memory.lastAwakened = setup.awakened; saveMemory(memory); audio.init(); };
  s.querySelector('#play').onclick = () => { readSetup(); startScene('d1', { jump: true }); };
  s.querySelector('#scenes').onclick = () => { readSetup(); scenesScreen(); };
  s.querySelector('#gallery').onclick = () => { readSetup(); galleryScreen(); };
  s.querySelector('#wipe').onclick = () => { memory = wipeMemory(); game.memory = memory; titleScreen(); };
  if (lastEnding === 'ruptura') ui.crack(300, 300);
}
function scenesScreen() {
  game.active = false; ui.showHUD(false);
  const s = ui.screen(`<div class="wrap"><div class="corp">SELECTOR DE ESCENAS · para el equipo de desarrollo</div><h2 class="sec">ESCENAS DESTACADAS</h2>
    <p style="color:var(--ink-dim);font-size:13px;max-width:720px">Cada escena arranca con un estado coherente. Despierto: <b>${CHARACTERS[setup.awakened].name}</b> · Operador: <b>${esc(setup.operator)}</b>. F2: panel con el estado oculto.</p>
    <div class="scenes">${SCENES.map((sc) => `<button class="scene-btn" data-id="${sc.id}"><b>${sc.title}</b><span>${sc.desc}</span></button>`).join('')}
      <button class="scene-btn" data-end="cosecha"><b>Final · Cosecha completa</b><span>CUERPO al 100%: no hay persecución.</span></button>
      <button class="scene-btn" data-end="soltar"><b>Final · Soltar (secreto)</b><span>Día 7 con 5 archivos y Lucidez 100: no toques nada 20 s cuando te lo pida.</span></button></div>
    <div class="actions"><button class="btn ghost" id="back">VOLVER</button></div></div>`);
  s.querySelectorAll('[data-id]').forEach((b) => (b.onclick = () => startScene(b.dataset.id, { jump: true })));
  s.querySelector('[data-end=cosecha]').onclick = () => { startScene('d7', { jump: true }); game.run.quota = 100; snapshots.d7 = structuredClone(game.run); startScene('d7', { restore: true }); };
  s.querySelector('[data-end=soltar]').onclick = () => { startScene('d7', { jump: true }); Object.assign(game.run, { lucidity: 100, archives: ['v1', 'v2', 'v3', 'v4', 'v5'], capataz: null, day6: 'follow', quota: 40 }); snapshots.d7 = structuredClone(game.run); startScene('d7', { restore: true }); };
  s.querySelector('#back').onclick = titleScreen;
}
function galleryScreen() {
  const G = [
    ['claire', 'Claire Moreau · la analista', 'Intelecto · 27 años', 'Rostro dulce: ojos almendrados con la línea de pestañas pintada, labios llenos, rubor. Coleta baja sobre el hombro, flequillo de lado, gafas redondeadas con UNA luna rota, bata de laboratorio. Abre las puertas con lector.'],
    ['oliver', 'Oliver Hale · el técnico', 'Fuerza · 34 años', 'Grande y amable: mandíbula cuadrada, barba pelirroja recortada, pecas, sin ojeras. Gorro naranja, chaleco con parches, mangas remangadas, venda, casco amarillo con stickers. Sostiene la válvula en la Purga.'],
    ['elliot', 'Elliot Park · el vigía', 'Percepción · 22 años', 'Abrigo oliva dos tallas más grande, linterna atada al pecho, auriculares al cuello, flequillo revuelto, ojeras de no dormir. Radar más amplio; tararea el jingle cuando tiene miedo.'],
    ['recolector', 'El Recolector', 'Trípode glitcheado · ~2,6 m · ciego', 'Hecho de los tres pasantes del ciclo anterior: tres patas de araña distintas (casco de Oliver, vendas de la bata de Claire, linterna de Elliot que parpadea), tres caras superpuestas que saltan como un archivo corrupto. Custodia las zonas prohibidas. Caza por sonido.'],
    ['palimpsest', 'Palimpsest · Forma de Cosecha', 'Cuatro patas · noche 7 · ve, no oye', 'El animatrónico de PIP del Pabellón con patas de cosechadora: cabeza-semilla de plástico rota con un CRT dentro, ojos-cámara rojos, sonrisa con demasiados dientes, sombrerito y hoja. Trepa por techos y ductos y ve por las cámaras.'],
    ['pip', 'PIP', 'Plant Intelligence Partner', 'La mascota en los CRT amarillos. Voz británica amable. Se corrompe (P̷I̸P) con la Lucidez.'],
  ];
  const s = ui.screen(`<div class="wrap"><div class="corp">BIBLIA VISUAL v0.1.0 · modelos en art/models · renders en art/renders</div><h2 class="sec">PERSONAJES</h2>
    <div class="gallery">${G.map(([id, n, r, d]) => `<div class="gcard"><canvas width="96" height="120" data-portrait="${id}"></canvas><div><h3>${n}</h3><p><b>${r}</b></p><p>${d}</p></div></div>`).join('')}</div>
    <div class="actions"><button class="btn ghost" id="back">VOLVER</button></div></div>`);
  s.querySelectorAll('canvas[data-portrait]').forEach((c) => putCanvas(c, portrait(c.dataset.portrait)));
  s.querySelector('#back').onclick = titleScreen;
}
function pauseScreen() {
  game.paused = true; input.releaseLock();
  const s = ui.screen(`<div class="wrap"><div class="corp">PAUSA</div><h1 class="logo" style="font-size:64px">PLOT ZERO</h1>
    <div class="actions"><button class="btn" id="cont">CONTINUAR</button><button class="btn ghost" id="restart">REINICIAR ESCENA</button><button class="btn ghost" id="scn">ESCENAS</button><button class="btn ghost" id="ttl">TÍTULO</button></div>
    <p style="color:var(--ink-dim);font-size:13px;margin-top:20px">WASD · Shift correr (ruido) · C agacharse · E interactuar / casillero / ducto · Espacio contener la respiración · F linterna · Q señuelo · F2 panel</p></div>`);
  s.querySelector('#cont').onclick = () => { ui.hideScreen(); game.paused = false; };
  s.querySelector('#restart').onclick = () => startScene(currentScene, { restore: true });
  s.querySelector('#scn').onclick = scenesScreen; s.querySelector('#ttl').onclick = titleScreen;
}
function showEnding(E) {
  const r = game.run; game.active = false; ui.showHUD(false); input.releaseLock();
  memory.globalCycle += 1; memory.runs += 1; memory.endings[E.id] = (memory.endings[E.id] || 0) + 1;
  if (E.id === 'reinicio') memory.badges.push({ name: r.operator, cycle: r.cycle });
  saveMemory(memory); lastEnding = E.id;
  const canRetry = E.id === 'reinicio' && snapshots.d7;
  const s = ui.screen(`<div class="wrap ending"><div class="tag ${E.tone}">${E.tag}</div><h1>${E.title}</h1><p>${esc(E.blurb)}</p>
    ${E.id === 'ruptura' ? '<p style="color:var(--pip);font-family:var(--crt);font-size:24px">Copia de seguridad: 1%</p>' : ''}
    ${E.id === 'soltar' ? '<p style="color:var(--lumen)">Insignia: <b>Soltaste las manos</b>.</p>' : ''}
    ${E.id === 'reinicio' ? `<p>El Recolector ahora lleva un gafete con tu nombre: <b>${esc(r.operator)} — CICLO ${r.cycle}</b>.</p>` : ''}
    <div class="stats">Lucidez ${r.lucidity} · Archivos ${r.archives.length}/5 · Cuerpo ${Math.round(r.quota)}% · Capataz: ${r.capataz ? CHARACTERS[r.capataz].short : 'nadie'} · Día 6: ${r.day6 === 'follow' ? 'te siguieron' : r.day6 === 'lock' ? 'te encerraron' : '—'}</div>
    <div class="actions">${canRetry ? '<button class="btn" id="retry">REINTENTAR LA PURGA</button>' : ''}<button class="btn ${canRetry ? 'ghost' : ''}" id="title">TÍTULO</button><button class="btn ghost" id="scn">ESCENAS</button></div>
    <div class="memory">${memoryLine()}</div></div>`);
  s.querySelector('#title').onclick = titleScreen; s.querySelector('#scn').onclick = scenesScreen;
  if (canRetry) s.querySelector('#retry').onclick = () => startScene('d7', { restore: true });
}

// ------------------------------------------------------------------ panel de equipo (F2)
let debugOn = false;
const debugActions = [
  ['+25 Lucidez', () => Lucidity.add(game.run, 25, 'panel')],
  ['+1 archivo', () => { const k = Object.keys(VIGIL_FILES).find((x) => !game.run.archives.includes(x)); if (k) Archives.unlock(game.run, k); }],
  ['Cuota +20', () => Quota.set(game.run, game.run.quota + 20)], ['Cuota −20', () => Quota.set(game.run, game.run.quota - 20)],
  ['Capataz on/off', () => { game.run.capataz = game.run.capataz ? null : companions(game.run)[0]; }],
  ['Siguiente escena', () => { const i = SCENES.findIndex((s) => s.id === currentScene); if (SCENES[i + 1]) startScene(SCENES[i + 1].id); }],
  ['Inmune (sin capturas)', () => { game.onCaught = null; }],
  ['Final: Ruptura', () => { game.run.aliveAtLens = true; showEnding(ENDINGS.ruptura); }],
  ['Noche ↔ día', () => world.setPhase(world.phase === 'night' ? 'day' : 'night')],
];

// ------------------------------------------------------------------ señuelo (Q)
const decoys = []; let decoyCd = 0;
function throwDecoy() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.4), lambert({ color: '#9aa39f' })); const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.setY(0).normalize();
  m.position.copy(game.player.pos).add(new THREE.Vector3(0, 1.4, 0)); scene.add(m); decoys.push({ m, v: dir.multiplyScalar(8).add(new THREE.Vector3(0, 4, 0)), t: 0, landed: false }); ui.toast('Señuelo lanzado (solo engaña al que oye)', 'lumen');
}
function updateDecoys(dt) {
  decoyCd = Math.max(0, decoyCd - dt);
  for (const d of decoys) { d.t += dt; if (!d.landed) { d.v.y -= 15 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.x += dt * 12; if (d.m.position.y <= 0.05) { d.landed = true; d.m.position.y = 0.05; audio.clunk(); for (let i = 0; i < 3; i++) noise.emit(d.m.position, 1.7, 'señuelo'); } } }
  for (let i = decoys.length - 1; i >= 0; i--) if (decoys[i].t > 5) { scene.remove(decoys[i].m); decoys.splice(i, 1); }
}

// ------------------------------------------------------------------ bucle principal
let last = performance.now(), T = 0, micCd = 0; const seenEl = document.getElementById('seen');
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (input.rawPressed('F2')) { debugOn = !debugOn; ui.debug(debugOn, debugActions); }
  if (input.rawPressed('Tab') && game.active && !game.paused) pauseScreen(); else if (input.rawPressed('Tab') && game.paused) { ui.hideScreen(); game.paused = false; }
  if (game.active && !game.paused) {
    flow.update(dt); noise.update(dt);
    game.player.control = game.control && !ui.blocking && !tasks.active;
    if (game.scriptWalk) game.scriptWalk.update(dt); else game.player.update(dt);
    for (const id of companions(game.run)) npcs[id].update(dt);
    game.rec.update(dt); game.pal.update(dt, T);
    updateInteractions(dt); tasks.update(dt);
    if (input.pressed('KeyF') && game.control) game.flashlight(!torchOn);
    if (game.decoy && input.pressed('KeyQ') && decoyCd <= 0 && game.control) { decoyCd = 4; throwDecoy(); }
    updateDecoys(dt);
    micCd -= dt; if (audio.mic && micCd <= 0) { const lv = audio.micLevel(); if (lv > 0.25) { noise.emit(game.player.pos, lv * 1.5, 'voz'); game.heardVoice = true; micCd = 0.3; } }
    seenEl.classList.toggle('on', game.pal.mode === 'hunt' && game.pal.canSee());
    if (debugOn && Math.floor(T * 4) !== Math.floor((T - dt) * 4)) ui.debug(true, debugActions);
  }
  world.update(dt, T); pip.update(dt, T);
  if (!game.paused) ui.update(dt);
  if (game.player.camScripted) updateCamTween(dt); else game.player.updateCamera(camera, dt);
  world.updateAtmo(camera.position, T);
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); torch.position.copy(camera.position).add(new THREE.Vector3(0, -0.2, 0)); torch.target.position.copy(camera.position).addScaledVector(fwd, 10);
  const tp = document.getElementById('title-pip'); if (tp && !document.getElementById('screen').classList.contains('hidden')) drawPIP(tp.getContext('2d'), 160, 128, T, { glitch: lastEnding ? 0.15 : 0 });
  renderer.render(scene, camera); input.endFrame(); requestAnimationFrame(frame);
}
for (const [i, id] of IDS.entries()) players[id].place(new THREE.Vector3(-25 + i * 2, 0, 8), 0);
actors.recolector.root.visible = false; actors.palimpsest.root.visible = false;
titleScreen(); requestAnimationFrame(frame);
window.__plotzero = { game, startScene, SCENES, showEnding, ENDINGS, setup, world, nav };
