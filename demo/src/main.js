import * as THREE from 'three';
import { createRenderer, lambert, basic, canvasTex } from './engine/renderer.js';
import { Flow } from './engine/flow.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { buildWorld, POI } from './world/world.js';
import { buildPerson, buildRecolector, buildPipScreens } from './art/characters.js';
import { portrait, drawPIP, mk } from './art/paint.js';
import { createRun, companions, CHARACTERS, IDS, Lucidity, Archives, Quota, ENDINGS, VIGIL_FILES } from './game/state.js';
import { loadMemory, saveMemory, wipeMemory } from './game/memory.js';
import { Noise } from './game/noise.js';
import { Player, NPC, RecolectorAI } from './game/actors.js';
import { makeScenes } from './game/scenes.js';
import { UI } from './ui/ui.js';

// ------------------------------------------------------------------ composición (raíz del "hexágono")
const canvas = document.getElementById('game');
const { renderer, resize } = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.08, 260);
addEventListener('resize', () => resize(camera)); resize(camera);

const input = new Input(canvas);
const audio = new Audio();
const flow = new Flow();
const noise = new Noise();
const pip = buildPipScreens();
const world = buildWorld(scene, pip);
let memory = loadMemory();

const people = Object.fromEntries(IDS.map((id) => [id, buildPerson(id)]));
Object.values(people).forEach((p) => scene.add(p.root));
const recBadges = () => [{ name: 'Elliot Park', cycle: 4816 }, ...memory.badges.slice(-3).map((b) => ({ ...b, mine: true }))];
const rec = buildRecolector(recBadges);
scene.add(rec.root);

const game = { scene, camera, renderer, world, pip, people, input, audio, flow, noise, rec, memory, run: createRun(), active: false, paused: false, control: true, decoy: false, onCaught: null, heardVoice: false, scriptWalk: null };
const players = Object.fromEntries(IDS.map((id) => [id, new Player(game, people[id])]));
const npcs = Object.fromEntries(IDS.map((id) => [id, new NPC(game, people[id])]));
game.recAI = new RecolectorAI(game, rec);
const ui = new UI(game); game.ui = ui;
game.player = players.claire;

// ------------------------------------------------------------------ interacción
let interactables = [];
let cleanups = [];
let holdT = 0;
function updateInteractions(dt) {
  if (!game.control || ui.blocking) { ui.prompt(''); return; }
  let best = null, bd = 1e9;
  for (const it of interactables) {
    if (it.when && !it.when()) continue;
    const label = typeof it.label === 'function' ? it.label() : it.label; if (!label) continue;
    const d = Math.hypot(it.pos.x - game.player.pos.x, it.pos.z - game.player.pos.z);
    if (d < (it.r || 1.6) && d < bd) { bd = d; best = { it, label }; }
  }
  if (!best) { ui.prompt(''); holdT = 0; return; }
  if (best.it.hold) {
    if (input.down('KeyE')) { holdT += dt; if (holdT >= best.it.hold) { holdT = 0; audio.interact(); best.it.use(); } }
    else holdT = 0;
    ui.prompt(`[Mantén E] ${best.label}`, holdT / best.it.hold);
  } else {
    ui.prompt(`[E] ${best.label}`);
    if (input.pressed('KeyE')) { audio.interact(); best.it.use(); }
  }
}

// ------------------------------------------------------------------ cámara guionizada
let camTween = null;
function shot(pos, look, dur = 0) {
  game.player.camScripted = true;
  const to = pos.clone(), lookTo = look.clone();
  if (!dur) { camera.position.copy(to); camera.lookAt(lookTo); camTween = { to, lookTo, done: true, lookFrom: lookTo.clone() }; return; }
  const lookFrom = new THREE.Vector3(); camera.getWorldDirection(lookFrom); lookFrom.multiplyScalar(5).add(camera.position);
  camTween = { from: camera.position.clone(), to, lookFrom, lookTo, t: 0, dur };
}
function updateCamTween(dt) {
  if (!camTween || !game.player.camScripted) return;
  if (camTween.done) { camera.position.copy(camTween.to); camera.lookAt(camTween.lookTo); return; }
  camTween.t = Math.min(1, camTween.t + dt / camTween.dur);
  const k = camTween.t * camTween.t * (3 - 2 * camTween.t);
  camera.position.lerpVectors(camTween.from, camTween.to, k);
  camera.lookAt(new THREE.Vector3().lerpVectors(camTween.lookFrom, camTween.lookTo, k));
  if (camTween.t >= 1) camTween.done = true;
}

function snapshot(pos, look, label) {
  const p = camera.position.clone(), q = camera.quaternion.clone();
  camera.position.copy(pos); camera.lookAt(look);
  renderer.render(scene, camera);
  const [c, g] = mk(320, 200); g.drawImage(renderer.domElement, 0, 0, 320, 200);
  camera.position.copy(p); camera.quaternion.copy(q);
  return { canvas: c, label };
}

// ------------------------------------------------------------------ contexto de escena
function fill(text) {
  const r = game.run, [a, b] = companions(r);
  return text.replaceAll('{op}', r.operator).replaceAll('{me}', CHARACTERS[r.awakened].short).replaceAll('{A}', CHARACTERS[a].short).replaceAll('{B}', CHARACTERS[b].short);
}
function makeCtx() {
  const f = flow.bind();
  const [A, B] = companions(game.run);
  const c = {
    ...f, A, B,
    npc: (id) => npcs[id],
    say: (spk, text, opts) => f.guard(ui.say(spk, fill(text), opts)),
    choose: (spk, text, choices) => f.guard(ui.say(spk, fill(text), { choices: choices.map(fill) })),
    fade: async (to, d = 1) => { ui.fade(to, d); await f.wait(d); },
    card: async (t, s, d = 2.2) => { ui.card(t, s); await f.wait(d); ui.hideCard(); },
    objective: (t) => ui.objective(t ? fill(t) : ''),
    day: (a, b) => ui.day(a, b),
    phase: (p) => world.setPhase(p),
    control: (on) => { game.control = on; },
    shot: (pos, look, dur) => shot(pos, look, dur),
    freeCam: () => { game.player.camScripted = false; game.player.snapCamera = true; },
    interact: (def) => { interactables.push(def); return def; },
    background: (fn) => { fn().catch((e) => console.error(e)); },
    flagOnce: (k) => { if (game.run.flags[k]) return true; game.run.flags[k] = true; return false; },
    onCleanup: (fn) => cleanups.push(fn),
    cctv: (pos, look, label) => snapshot(pos, look, label),
    useAt: (pos, label, r = 1.6) => new Promise((res) => { const d = { pos, r, label, use: () => { interactables = interactables.filter((x) => x !== d); ui.objective(''); res(); } }; interactables.push(d); }).then((v) => (f.alive() ? v : new Promise(() => {}))),
    holdAt: (pos, label, hold = 1.5, when) => new Promise((res) => { const d = { pos, r: 1.8, label, hold, when, use: () => { interactables = interactables.filter((x) => x !== d); ui.objective(''); res(); } }; interactables.push(d); }).then((v) => (f.alive() ? v : new Promise(() => {}))),
    useChoice: async (pos, label, spk, text, choices) => { await c.useAt(pos, label); c.control(false); const i = await c.choose(spk, text, choices); c.control(true); return i; },
    npcWalk: (id, target, speed) => { const n = npcs[id]; n.goTo(target, speed); game.scriptWalk = n; return f.until(() => n.arrived).then(() => { game.scriptWalk = null; }); },
  };
  return c;
}

// ------------------------------------------------------------------ ciclo de vida de escenas
const snapshots = {};
let currentScene = null;
let lastEnding = null;
const sceneApi = {
  game,
  start: (id, opts) => startScene(id, opts),
  finish: (E) => showEnding(E),
  officeScene: (c) => officeScene(c),
};
const SCENES = makeScenes(sceneApi);
let setup = { operator: memory.operator || 'Operador', awakened: memory.lastAwakened || 'claire' };

function resetStage() {
  cleanups.forEach((fn) => { try { fn(); } catch { } }); cleanups = [];
  interactables = []; noise.clear(); camTween = null; holdT = 0;
  game.control = false; game.decoy = false; game.onCaught = null; game.scriptWalk = null; input.enabled = true;
  ui.reset();
  world.setDoor(true); world.setBarricade(false); world.setGate(false); world.resetPlots();
  world.anomalies.visible = false; world.crates.visible = true; world.seam.visible = false; world.seamZip.visible = false; world.drawing.visible = false;
  world.setBoard(game.run.quota, !!game.run.flags.bodyRevealed);
  Object.values(people).forEach((p) => { p.seated = false; p.root.visible = true; p.root.position.y = 0; p.arms.forEach((a) => (a.rotation.x = 0)); });
  Object.values(npcs).forEach((n) => { n.stop(); n.lookAtPos = null; });
  rec.setBadges(recBadges());
  game.recAI.setMode('scarecrow'); game.recAI.place(POI.scarecrow);
  pip.set({ glitch: 0, talking: false });
  game.player = players[game.run.awakened]; game.player.camScripted = false;
  ui.fade(1, 0);
}

function applyPreset(run, p) {
  if (!p) return;
  if (p.quota != null) run.quota = p.quota;
  if (p.lucidity != null) run.lucidity = p.lucidity;
  if (p.archives) run.archives = [...p.archives];
  if (p.affinity != null) for (const id of IDS) run.affinity[id] = p.affinity;
  if (p.day6) run.day6 = p.day6;
  run.exposure = Math.round(run.quota * 0.6);
  run.log.push('preset de escena aplicado');
}

function startScene(id, { jump = false, restore = false } = {}) {
  const sc = SCENES.find((s) => s.id === id); if (!sc) return;
  flow.reset();
  if (restore && snapshots[id]) game.run = structuredClone(snapshots[id]);
  else if (jump) { game.run = createRun({ operator: setup.operator, awakened: setup.awakened, cycle: memory.globalCycle }); applyPreset(game.run, sc.preset); }
  snapshots[id] = structuredClone(game.run);
  currentScene = id;
  resetStage();
  ui.hideScreen(); ui.showHUD(true); ui.objective('');
  game.active = true; game.paused = false;
  audio.init();
  sc.run(makeCtx()).catch((e) => console.error(e));
}

// ------------------------------------------------------------------ final "Cosecha completa": la oficina
async function officeScene(c) {
  const shotImg = snapshot(new THREE.Vector3(0, 6, -4), new THREE.Vector3(0, 1, 14), '');
  const office = new THREE.Group(); office.position.set(300, 0, 0); scene.add(office); c.onCleanup(() => scene.remove(office));
  const B = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); office.add(o); return o; };
  B(8, 0.1, 8, lambert({ color: '#2b2a28' }), 0, 0, 0); B(8, 3.2, 0.2, lambert({ color: '#4a4c47' }), 0, 1.6, -3);
  B(2.4, 0.08, 1.1, lambert({ color: '#5a4630' }), 0, 0.78, -1.8);
  B(0.9, 0.75, 0.8, lambert({ color: '#2b2a26' }), 0, 1.2, -2.1);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.5), basic({ map: canvasTex(shotImg.canvas) })); scr.position.set(0, 1.24, -1.69); office.add(scr);
  B(0.6, 0.08, 0.6, lambert({ color: '#222' }), 0, 0.5, -0.7); B(0.6, 0.9, 0.08, lambert({ color: '#222' }), 0, 0.95, -0.4);
  // el cuerpo terminado: un maniquí pálido, sin rostro, sentado frente al monitor
  const pale = lambert({ color: '#cfc9bd' });
  B(0.46, 0.6, 0.26, pale, 0, 0.95, -0.62); const head = B(0.27, 0.36, 0.29, pale, 0, 1.48, -0.66); head.rotation.x = 0.15;
  B(0.17, 0.12, 0.6, pale, -0.12, 0.6, -0.9); B(0.17, 0.12, 0.6, pale, 0.12, 0.6, -0.9);
  B(0.12, 0.12, 0.55, pale, -0.3, 1.0, -0.95); B(0.12, 0.12, 0.55, pale, 0.3, 1.0, -0.95);
  const lamp = new THREE.PointLight('#ffd84a', 6, 9, 1.2); lamp.position.set(0, 1.3, -1.4); office.add(lamp);
  ui.showHUD(false); world.setPhase('night'); scene.fog.near = 2; scene.fog.far = 14;
  shot(new THREE.Vector3(300, 1.24, -1.25), new THREE.Vector3(300, 1.24, -1.7));
  await c.fade(0, 1.2);
  await c.say('pip', 'Gracias por cada cosecha. Por cada riego. Por cada orden cumplida.');
  shot(new THREE.Vector3(300.9, 1.9, 1.9), new THREE.Vector3(300, 1.1, -1.2), 5);
  await c.wait(5.2);
  await c.say('pip', '*Thank you, {op}. I\'ll take it from here.*');
  audio.speak('Thank you, ' + game.run.operator);
  await c.fade(1, 1.5);
}

// ------------------------------------------------------------------ pantallas
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function putCanvas(el, src) { const c = el; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height); }
function memoryLine() {
  const ends = Object.entries(memory.endings).map(([k, v]) => `${ENDINGS[k]?.title || k} ×${v}`).join(' · ') || 'ninguno';
  return `Ciclo global: <b>${memory.globalCycle.toLocaleString('es')}</b> · Partidas terminadas: <b>${memory.runs}</b> · Finales vistos: ${esc(ends)}${memory.badges.length ? ` · Gafetes que lleva el Recolector: <b>${memory.badges.length}</b>` : ''}`;
}

function titleScreen() {
  game.active = false; ui.showHUD(false); ui.reset(); ui.fade(0, 0.6); input.releaseLock();
  world.setPhase('night'); shot(new THREE.Vector3(-3, 2.2, -2), new THREE.Vector3(2, 2.6, 15));
  game.recAI.setMode('scarecrow', { scale: 1 }); game.recAI.place(POI.scarecrow);
  const let_go = memory.endings.soltar;
  const s = ui.screen(`<div class="wrap">
    <div class="corp">ARCADIA EDEN CORP. · PROGRAMA CONTINUIDAD · <i>tu trabajo, para siempre</i></div>
    <h1 class="logo">PLOT ZERO</h1>
    <div class="logo-sub">CULTIVO CERO · CAPÍTULO 1 · DEMO VERTICAL</div>
    <div class="row">
      <canvas class="pip-crt" id="title-pip" width="160" height="128"></canvas>
      <div style="flex:1;min-width:260px;max-width:560px">
        <p style="margin-top:0;line-height:1.6;color:var(--ink-dim)">Tres pasantes de Arcadia Eden Corp. cultivan una planta luminosa durante siete días en un planeta oscuro, guiados por PIP, la simpática mascota de la empresa. Cada noche, algo camina entre los cultivos. Uno de los tres empieza a notar que el cielo tiene costuras, que la mascota miente… y que alguien, al otro lado de la pantalla, le mueve las manos.</p>
        <label class="field" for="op">Nombre de operador (el juego lo usará)</label>
        <input type="text" id="op" maxlength="16" value="${esc(setup.operator)}" autocomplete="off">
      </div>
    </div>
    <label class="field">¿Quién despierta? · en solitario tú siempre eres el despierto; los otros dos van en “piloto automático”</label>
    <div class="chars">${let_go ? '<p style="grid-column:1/-1;color:var(--ink-dim)">(vacío) · Soltaste las manos. Aquí ya no hay nadie a quien mover.</p>' : IDS.map((id) => `
      <button class="charcard" data-id="${id}" aria-pressed="${id === setup.awakened}">
        <canvas width="96" height="120" data-portrait="${id}"></canvas>
        <h3>${CHARACTERS[id].name}</h3>
        <p>${CHARACTERS[id].job} · ${CHARACTERS[id].stat}<br><i>“${esc(CHARACTERS[id].line)}”</i><br>Ruta al despertar: ${CHARACTERS[id].route}</p>
      </button>`).join('')}</div>
    <div class="toggles">
      <label><input type="checkbox" id="tts" ${audio.ttsOn ? 'checked' : ''}> Voz de sistema (dice tu nombre en voz alta)</label>
      <label><input type="checkbox" id="mic"> Dejar que el juego te escuche (micrófono, solo volumen)</label>
    </div>
    <div class="actions">
      <button class="btn" id="play">EMPEZAR CICLO</button>
      <button class="btn ghost" id="scenes">ESCENAS</button>
      <button class="btn ghost" id="gallery">PERSONAJES Y ESTILO</button>
      <button class="btn ghost" id="wipe" title="Borra la memoria del operador guardada en este navegador">OLVIDAR</button>
    </div>
    <div class="memory">${memoryLine()}</div>
  </div>`);
  s.querySelectorAll('canvas[data-portrait]').forEach((c) => putCanvas(c, portrait(c.dataset.portrait)));
  s.querySelectorAll('.charcard').forEach((b) => (b.onclick = () => { setup.awakened = b.dataset.id; s.querySelectorAll('.charcard').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
  const readSetup = () => {
    setup.operator = (s.querySelector('#op').value || 'Operador').trim().slice(0, 16) || 'Operador';
    audio.ttsOn = s.querySelector('#tts').checked;
    if (s.querySelector('#mic').checked) audio.enableMic();
    memory.operator = setup.operator; memory.lastAwakened = setup.awakened; saveMemory(memory);
    audio.init();
  };
  s.querySelector('#play').onclick = () => { readSetup(); startScene('d1', { jump: true }); };
  s.querySelector('#scenes').onclick = () => { readSetup(); scenesScreen(); };
  s.querySelector('#gallery').onclick = () => { readSetup(); galleryScreen(); };
  s.querySelector('#wipe').onclick = () => { memory = wipeMemory(); game.memory = memory; titleScreen(); };
  if (lastEnding === 'ruptura') { ui.crack(300, 300); }
}

function scenesScreen() {
  game.active = false; ui.showHUD(false);
  const s = ui.screen(`<div class="wrap">
    <div class="corp">SELECTOR DE ESCENAS · para el equipo de desarrollo</div>
    <h2 class="sec">LOS SIETE DÍAS</h2>
    <p style="color:var(--ink-dim);font-size:13px;max-width:720px">Cada escena arranca con un estado coherente (Lucidez, archivos, cuota) para poder probarla sola. Despierto: <b>${CHARACTERS[setup.awakened].name}</b> · Operador: <b>${esc(setup.operator)}</b>. F2 abre el panel con el estado oculto y atajos para forzar finales.</p>
    <div class="scenes">${SCENES.map((sc) => `<button class="scene-btn" data-id="${sc.id}"><b>${sc.title}</b><span>${sc.desc}</span></button>`).join('')}
      <button class="scene-btn" data-end="cosecha"><b>Final · Cosecha completa</b><span>Cuota al 100%: la oficina de Arcadia y el cuerpo terminado.</span></button>
      <button class="scene-btn" data-end="soltar"><b>Final · Soltar (secreto)</b><span>Día 7 con 5 archivos y Lucidez 100: no toques nada durante 20 s cuando te lo pida.</span></button>
    </div>
    <div class="actions"><button class="btn ghost" id="back">VOLVER</button></div></div>`);
  s.querySelectorAll('[data-id]').forEach((b) => (b.onclick = () => startScene(b.dataset.id, { jump: true })));
  s.querySelector('[data-end=cosecha]').onclick = () => { startScene('d7', { jump: true }); game.run.quota = 100; snapshots.d7 = structuredClone(game.run); flow.reset(); startScene('d7', { restore: true }); };
  s.querySelector('[data-end=soltar]').onclick = () => { startScene('d7', { jump: true }); Object.assign(game.run, { lucidity: 100, archives: ['v1', 'v2', 'v3', 'v4', 'v5'], capataz: null, day6: 'follow', quota: 40 }); snapshots.d7 = structuredClone(game.run); startScene('d7', { restore: true }); };
  s.querySelector('#back').onclick = titleScreen;
}

function galleryScreen() {
  const G = [
    ['oliver', 'Oliver Hale — el alegre', 'Fuerza · técnico de energía', 'Gorro naranja tejido, chaleco de Arcadia con parches de colores y un casco amarillo lleno de stickers colgado del cinturón. Barba de varios días y pecas. Sonrisa forzada sobre ojeras profundas: usa el humor para no pensar.', 'Elogios y premios para el grupo.'],
    ['claire', 'Claire Moreau — la escéptica', 'Intelecto · analista de laboratorio', 'Bata de laboratorio sobre el mono teal, coleta tirante con raya al medio, gafas rectangulares con UNA luna rota y portapapeles. Habla bajo y cuenta todo. Las ojeras más marcadas del grupo.', 'Eficiencia y lógica.'],
    ['elliot', 'Elliot Park — el temeroso', 'Percepción · vigía nocturno', 'Abrigo verde oliva dos tallas más grande, linterna atada al pecho, auriculares viejos al cuello y flequillo negro revuelto. Ojos más abiertos (con brillo: aún tiene esperanza). Tararea el jingle cuando tiene miedo.', 'Seguridad y apoyo, con una dulzura sospechosa.'],
    ['pip', 'PIP / Palimpsest — narrador y antagonista', 'Plant Intelligence Partner · Palimpsest Instance, Partial', 'Una semilla sonriente con una hoja, animada en monitores CRT de fósforo amarillo. Voz británica amable. Con Lucidez ≥ 50 su logo aparece con estática y su nombre se corrompe.', 'Habla en privado con cada jugador y ofrece tratos.'],
    ['recolector', 'El Recolector — la amenaza', 'Espantapájaros de día · cazador ciego de noche', 'Un poste con abrigo hecho de uniformes viejos; un saco de semillas de Arcadia por cabeza (uno por tripulación absorbida), ojos cosidos y gafetes colgando. Si ya jugaste, uno de los gafetes es el tuyo.', 'Caza por sonido e imita voces.'],
    ['vigil', 'VIGIL — el aliado que no puede hablar bien', 'Sistema de seguridad original', 'Estática roja, forma de onda y mensajes cortados. Se vuelve legible a medida que sube la Lucidez.', 'Solo puede tocar un expediente por ciclo.'],
    ['recepcion', 'Recepción — la voz institucional', 'Altavoces del puesto Eden-0', 'Voz femenina estadounidense, calmada y corporativa. Cree de verdad que PIP es legítimo. Aporta contraste y humor negro.', '—'],
  ];
  const s = ui.screen(`<div class="wrap"><div class="corp">BIBLIA VISUAL · referencia rápida para arte</div>
    <h2 class="sec">PERSONAJES Y ESTILO</h2>
    <p style="color:var(--ink-dim);font-size:13px;max-width:760px">Dirección de arte: retratos pintados de rostro alargado y demacrado, ojeras marcadas, párpados pesados, pupilas pequeñas sin brillo y luz lateral plana; modelos low-poly con la cara pintada en una sola textura, resolución baja y vértices que “tiemblan” (look PS1). La silueta de cada pasante se reconoce desde lejos por un objeto propio.</p>
    <div class="gallery">${G.map(([id, n, r, d, m]) => `<div class="gcard"><canvas width="96" height="120" data-portrait="${id}"></canvas><div><h3>${n}</h3><p><b>${r}</b></p><p>${d}</p><p><b>Manipulación:</b> ${m}</p></div></div>`).join('')}</div>
    <div class="actions"><button class="btn ghost" id="back">VOLVER</button></div></div>`);
  s.querySelectorAll('canvas[data-portrait]').forEach((c) => { const id = c.dataset.portrait; if (id === 'vigil') { const g = c.getContext('2d'); import('./art/paint.js').then((m) => m.vigilFrame(g, 1)); } else putCanvas(c, portrait(id)); });
  s.querySelector('#back').onclick = titleScreen;
}

function pauseScreen() {
  game.paused = true; input.releaseLock();
  const s = ui.screen(`<div class="wrap"><div class="corp">PAUSA</div><h1 class="logo" style="font-size:64px">PLOT ZERO</h1>
    <div class="actions"><button class="btn" id="cont">CONTINUAR</button><button class="btn ghost" id="restart">REINICIAR ESCENA</button><button class="btn ghost" id="scn">ESCENAS</button><button class="btn ghost" id="ttl">TÍTULO</button></div>
    <p style="color:var(--ink-dim);font-size:13px;margin-top:20px">WASD mover · Shift correr (ruido) · C sigilo · E interactuar · clic + ratón o flechas: cámara · Q señuelo (Día 7) · F2 panel de equipo</p></div>`);
  s.querySelector('#cont').onclick = () => { ui.hideScreen(); game.paused = false; };
  s.querySelector('#restart').onclick = () => startScene(currentScene, { restore: true });
  s.querySelector('#scn').onclick = scenesScreen;
  s.querySelector('#ttl').onclick = titleScreen;
}

function showEnding(E) {
  const r = game.run;
  game.active = false; ui.showHUD(false); input.releaseLock();
  memory.globalCycle += 1; memory.runs += 1;
  memory.endings[E.id] = (memory.endings[E.id] || 0) + 1;
  if (E.id === 'reinicio') memory.badges.push({ name: r.operator, cycle: r.cycle });
  saveMemory(memory); lastEnding = E.id;
  const canRetry = E.id === 'reinicio' && snapshots.d7;
  const s = ui.screen(`<div class="wrap ending">
    <div class="tag ${E.tone}">${E.tag}</div>
    <h1>${E.title}</h1>
    <p>${esc(E.blurb)}</p>
    ${E.id === 'ruptura' ? `<p style="color:var(--pip);font-family:var(--crt);font-size:24px">Copia de seguridad: 1%</p>` : ''}
    ${E.id === 'soltar' ? `<p style="color:var(--lumen)">Insignia desbloqueada: <b>Soltaste las manos</b>. Vuelve al título.</p>` : ''}
    ${E.id === 'reinicio' ? `<p>El Recolector ahora lleva un gafete con tu nombre: <b>${esc(r.operator)} — CICLO ${r.cycle}</b>.</p>` : ''}
    <div class="stats">Lucidez ${r.lucidity} · Archivos VIGIL ${r.archives.length}/5 · Cuerpo ${Math.round(r.quota)}% · Capataz: ${r.capataz ? CHARACTERS[r.capataz].short : 'nadie'} · Día 6: ${r.day6 === 'follow' ? 'te siguieron' : r.day6 === 'lock' ? 'te encerraron' : '—'}</div>
    <p style="font-size:13px">Regla del canon comunitario: el final que más jugadores alcancen en el primer mes define el inicio del Capítulo 2.</p>
    <div class="actions">${canRetry ? '<button class="btn" id="retry">REINTENTAR DÍA 7</button>' : ''}<button class="btn ${canRetry ? 'ghost' : ''}" id="title">TÍTULO</button><button class="btn ghost" id="scn">ESCENAS</button></div>
    <div class="memory">${memoryLine()}</div></div>`);
  s.querySelector('#title').onclick = titleScreen;
  s.querySelector('#scn').onclick = scenesScreen;
  if (canRetry) s.querySelector('#retry').onclick = () => startScene('d7', { restore: true });
}

// ------------------------------------------------------------------ panel de equipo (F2)
let debugOn = false;
const debugActions = [
  ['+25 Lucidez', () => Lucidity.add(game.run, 25, 'panel')],
  ['+1 archivo', () => { const next = Object.keys(VIGIL_FILES).find((k) => !game.run.archives.includes(k)); if (next) Archives.unlock(game.run, next); }],
  ['Cuota +20', () => Quota.set(game.run, game.run.quota + 20)],
  ['Cuota −20', () => Quota.set(game.run, game.run.quota - 20)],
  ['Capataz on/off', () => { game.run.capataz = game.run.capataz ? null : companions(game.run)[0]; }],
  ['Siguiente escena', () => { const i = SCENES.findIndex((s) => s.id === currentScene); if (SCENES[i + 1]) startScene(SCENES[i + 1].id); }],
  ['Final: Ruptura', () => { game.run.aliveAtLens = true; showEnding(ENDINGS.ruptura); }],
  ['Final: Cosecha', () => { game.run.quota = 100; startScene('d7'); }],
  ['Noche ↔ día', () => world.setPhase(world.phase === 'night' ? 'day' : 'night')],
];

// ------------------------------------------------------------------ señuelo (Q)
const decoys = []; let decoyCd = 0;
function throwDecoy() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.4), lambert({ color: '#9aa39f' }));
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.setY(0).normalize();
  m.position.copy(game.player.pos).add(new THREE.Vector3(0, 1.4, 0));
  scene.add(m); decoys.push({ m, v: dir.multiplyScalar(9).add(new THREE.Vector3(0, 5, 0)), t: 0, landed: false });
  ui.toast('Señuelo lanzado', 'lumen');
}
function updateDecoys(dt) {
  decoyCd = Math.max(0, decoyCd - dt);
  for (const d of decoys) {
    d.t += dt;
    if (!d.landed) { d.v.y -= 15 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.x += dt * 12; if (d.m.position.y <= 0.05) { d.landed = true; d.m.position.y = 0.05; audio.clunk(); for (let i = 0; i < 3; i++) noise.emit(d.m.position, 1.7, 'señuelo'); } }
  }
  for (let i = decoys.length - 1; i >= 0; i--) if (decoys[i].t > 5) { scene.remove(decoys[i].m); decoys.splice(i, 1); }
}

// ------------------------------------------------------------------ bucle principal
const titlePipCanvas = () => document.getElementById('title-pip');
let last = performance.now(), T = 0, micCd = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (input.rawPressed('F2')) { debugOn = !debugOn; ui.debug(debugOn, debugActions); }
  if (input.rawPressed('Tab') && game.active && !game.paused) pauseScreen();
  else if (input.rawPressed('Tab') && game.paused) { ui.hideScreen(); game.paused = false; }
  if (game.active && !game.paused) {
    flow.update(dt); noise.update(dt);
    game.player.control = game.control && !ui.blocking;
    if (game.scriptWalk) game.scriptWalk.update(dt);
    else game.player.update(dt);
    for (const id of companions(game.run)) npcs[id].update(dt);
    game.recAI.update(dt);
    updateInteractions(dt);
    if (game.decoy && input.pressed('KeyQ') && decoyCd <= 0 && game.control) { decoyCd = 5; throwDecoy(); }
    updateDecoys(dt);
    // micrófono opcional: solo un número de volumen → ruido
    micCd -= dt;
    if (audio.mic && micCd <= 0) { const lv = audio.micLevel(); if (lv > 0.25) { noise.emit(game.player.pos, lv * 1.5, 'voz'); game.heardVoice = true; micCd = 0.3; } }
    if (debugOn && Math.floor(T * 4) !== Math.floor((T - dt) * 4)) ui.debug(true, debugActions);
  }
  world.followLamp(game.player.pos, camera.position); world.update(dt, T); pip.update(dt, T);
  if (!game.paused) ui.update(dt);
  if (game.player.camScripted) updateCamTween(dt); else game.player.updateCamera(camera, dt);
  const tp = titlePipCanvas(); if (tp && !document.getElementById('screen').classList.contains('hidden')) drawPIP(tp.getContext('2d'), 160, 128, T, { glitch: lastEnding ? 0.15 : 0 });
  renderer.render(scene, camera);
  input.endFrame();
  requestAnimationFrame(frame);
}

// arranque
for (const id of IDS) { players[id].place(V0(id), 0); }
function V0(id) { return new THREE.Vector3(IDS.indexOf(id) * 1.5 - 1.5, 0, -6); }
titleScreen();
requestAnimationFrame(frame);
window.__plotzero = { game, startScene, SCENES, showEnding, ENDINGS, setup }; // para pruebas automatizadas
