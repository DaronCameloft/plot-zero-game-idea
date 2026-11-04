import * as THREE from 'three';
import { CHARACTERS, VIGIL_FILES, Lucidity, Archives, Quota, decideCapataz, decideDay6, evaluateEnding, canOfferLetGo, ENDINGS } from './state.js';
import { badgeTex, charlieDrawing } from '../art/paint.js';

// Guion de la demo v0.2: las escenas más destacables del Capítulo 1 (ver docs/00-historia).
// Marcadores en los textos: {op}=operador, {me}=despierto, {A}/{B}=compañeros.
const V = (x, z, y = 0) => new THREE.Vector3(x, y, z);

const FLAVOR = {
  oliver: { card: '¡Noche de cartas! El que pierda friega los platos. *Oh, come on! That sounds fun!*', dejavu: 'Oye... ¿tú también sientes que ya jugamos esta mano? Hasta el chiste me suena repetido.', capOk: 'Luz extra y la llave del refugio... ¡Trato hecho, amiguito!', capNo: 'Nah. Yo no le escondo cosas a mis amigos.', follow: '{me} nunca me ha mentido. Si dice que corramos, corremos.', lock: 'Lo siento, {me}. PIP dice que es por tu bien.' },
  claire: { card: '*Right. Another pointless task.* Reparte. Y nada de trampas, Oliver.', dejavu: 'Esta mano ya la vi. Mismas cartas, mismo orden. Estadísticamente... imposible.', capOk: 'Una llave a cambio de mantener la normalidad. Es lo más eficiente.', capNo: 'No hago tratos con una mascota que se ríe sin motivo.', follow: 'Los datos de {me} cuadran mejor que los de PIP. Voy con {me}.', lock: 'Es lo lógico. Si {me} está enfermo, el aislamiento es el protocolo.' },
  elliot: { card: 'U-um... *if you say so.* ¿Puedo jugar con la linterna encendida?', dejavu: 'Y-yo ya oí este barajeo. El mismo sonido. Juro que lo oí.', capOk: 'Una luz extra... s-sí. Tengo mucho miedo a la oscuridad.', capNo: 'N-no. No voy a vigilar a {me}. Eso es lo que hacen los malos.', follow: 'T-tengo miedo... pero tengo más miedo de quedarme. Te sigo, {me}.', lock: 'P-perdón, {me}. PIP dice que no hay nada que temer si te quedas abajo.' },
};
const MEMORY = {
  oliver: ['(Un mensaje de voz guardado con tu nombre: *"Charlotte? I\'m coming home. Please stay in the basement..."*)', '¿Charlotte...? No tengo hijas. ¿Por qué me duele tanto ese nombre?'],
  claire: ['(Una grabación: hablas con tu madre. Su cara está pixelada en cada fotograma. Debajo, una ficha: *LUMEN-7 · Diseño: Dra. C. Moreau*. Es tu firma.)', 'Mi firma... en la planta que cultivamos. *¿Qué le pasa a mi memoria?*'],
  elliot: ['(Cientos de registros de turnos nocturnos, todos firmados con tu contraseña. Ninguno lo recuerdas.)', 'E-esa es mi contraseña. Pero yo... nunca hice turnos de noche aquí. ¿O sí?'],
};

export function makeScenes(api) {
  const { game: g } = api;
  const W = () => g.world, S = () => g.world.special;
  const seatAll = (c) => { const seats = S().seats; [g.run.awakened, c.A, c.B].forEach((id, i) => { const a = g.actors[id]; a.root.position.set(seats[i][0], 0, seats[i][1]); a.root.rotation.y = seats[i][2]; a.seated = true; }); };
  const standAll = () => ['oliver', 'claire', 'elliot'].forEach((id) => { g.actors[id].seated = false; g.actors[id].override = null; });
  const endDay = async (c, next) => { c.objective(''); c.control(false); await c.fade(1, 1.1); standAll(); await c.card('FIN DEL DÍA ' + g.run.day, next ? 'Guardado al amanecer' : '', 1.8); if (next) api.start(next); };
  const dawnPIP = async (c, lines) => { c.phase('dawn'); g.audio.ambience('day'); c.day('DÍA ' + g.run.day + ' · AMANECER', '06:00'); await c.fade(0, 0.8); g.audio.jingle({ vol: 0.12 }); for (const l of lines) await c.say('pip', l); };
  const inDorm = (c) => { g.player.place(V(-23, 7.5), Math.PI); c.npc(c.A).place(V(-27, 6.5), Math.PI); c.npc(c.B).place(V(-19.5, 6.5), Math.PI); };
  const plotsInteract = (c, onHarvest) => {
    for (const p of W().plots) c.interact({ pos: p.pos, r: 1.8, label: () => ({ empty: 'Plantar Lumen', seeded: 'Regar', ripe: 'Cosechar Lumen' }[p.state] || null), use: () => {
      if (p.state === 'empty') { p.state = 'seeded'; p.sprout.visible = true; p.sprout.scale.y = 0.4; g.audio.interact(); }
      else if (p.state === 'seeded') { p.state = 'growing'; p.wet.visible = true; g.audio.water(); }
      else if (p.state === 'ripe') { p.state = 'done'; p.bulb.visible = false; p.sprout.visible = false; Quota.harvest(g.run, 6); g.audio.harvest(); g.noise.emit(p.pos, 0.5, 'herramienta'); g.ui.toast('+6% cuota · +4% exposición', 'pip'); onHarvest && onHarvest(); }
    } });
  };

  // ================================================= DÍA 1 · BIENVENIDA Y TAREAS
  async function day1(c) {
    const run = g.run; run.day = 1;
    c.phase('day'); g.audio.ambience('day'); inDorm(c);
    g.rec.place(V(40, -40)); g.rec.setMode('guard', { zone: 'ARCH', patrol: [V(33, -26), V(33, -46), V(47, -46), V(47, -26)], speed: 1.2 });
    c.day('DÍA 1 · BIENVENIDA', 'Mañana · 07:58');
    await c.card('CICLO ' + run.cycle.toLocaleString('es'), 'DÍA 1 · BIENVENIDA', 2.2);
    c.shot(V(-28.5, 7.8, 2.4), V(-21, 6, 1.2));
    await c.fade(0, 1.4);
    await c.say('recepcion', 'Buenos días, pasantes. Bienvenidos al puesto Eden-0 de Arcadia Eden Corp. Recuerden: *su trabajo, para siempre*.');
    g.pip.set({ talking: true }); g.audio.jingle();
    c.shot(V(-19.6, 5.8, 1.7), V(-16.6, 6, 1.4), 1.2); await c.wait(1.3);
    await c.say('pip', 'Good morning, team! Soy PIP, su *Plant Intelligence Partner*. ¡Hoy toca un recorrido con tareas!');
    await c.say('pip', '{me}, tu tablilla: calibrar el generador, reparar fusibles en Control, cosechar Lumen y llevar un saco al convertidor. ¡Con tres me conformo!');
    await c.say('pip', 'Y una sola regla: la puerta roja del Archivo... no es para pasantes. ¡Jeje!');
    g.pip.set({ talking: false });
    await c.say(c.B, '¿Alguien se acuerda del viaje hasta aquí? Yo... no recuerdo haber subido a ninguna nave.');
    await c.say(c.A, '...No. ¿Debería?');
    c.freeCam(); c.control(true);
    const done = new Set();
    const list = () => c.objective(`Tareas (${done.size}/3): ${done.has('gen') ? '✔' : '☐'} Generador · ${done.has('fus') ? '✔' : '☐'} Fusibles · ${done.has('lum') ? '✔' : '☐'} Cosechar 2 Lumen · ${done.has('saco') ? '✔' : '☐'} Saco al convertidor`);
    const finish = (k, msg) => { if (done.has(k)) return; done.add(k); g.ui.toast('Tarea completada: ' + msg, 'lumen'); list(); };
    list();
    c.npc(c.A).goTo(V(-6, 27)); c.npc(c.B).goTo(V(12, -8));
    c.interact({ pos: V(S().dials.x, S().dials.z), r: 2, label: () => (done.has('gen') ? null : 'Calibrar el generador'), use: async () => { c.control(false); await c.task('dials'); c.control(true); finish('gen', 'generador calibrado'); } });
    c.interact({ pos: V(S().fusebox.x, S().fusebox.z), r: 1.8, label: () => (done.has('fus') ? null : 'Reparar fusibles'), use: async () => { c.control(false); await c.task('wires'); c.control(true); finish('fus', 'fusibles'); } });
    let harvested = 0; plotsInteract(c, () => { if (++harvested >= 2) finish('lum', 'Lumen cosechado'); });
    const sack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), new THREE.MeshLambertMaterial({ color: '#8c7448' })); sack.position.set(0, 0.3, 21.5); g.scene.add(sack); c.onCleanup(() => g.scene.remove(sack));
    c.interact({ pos: V(0, 21.5), r: 1.6, label: () => (g.player.carry || done.has('saco') ? null : 'Cargar saco de Lumen'), use: () => { g.player.carry = sack; g.ui.toast('Cargas un saco: vas más lento y haces más ruido', 'pip'); } });
    c.interact({ pos: V(S().converter.x, S().converter.z), r: 2, label: () => (g.player.carry ? 'Vaciar el saco en el convertidor' : null), use: () => { g.player.carry = null; sack.visible = false; Quota.harvest(run, 4); g.audio.harvest(); finish('saco', 'saco entregado'); } });
    c.background(async () => { await c.until(() => g.player.pos.distanceTo(V(40, -21)) < 6); g.audio.clack(3); await c.wait(0.4); g.audio.clack(3); await c.wait(0.4); g.audio.clack(3);
      await c.say('narrador', '(Detrás de la puerta roja: clac... clac... clac. Tres golpes. Como tres pies.)'); Lucidity.add(run, 3, 'oyó al Recolector tras la puerta'); });
    c.background(async () => { await c.until(() => g.player.pos.z > 18.5); const t0 = g.flow.time;
      while (c.alive() && g.flow.time - t0 < 7) { if (g.player.looksAt(g.camera, V(0, -10), 0.75)) { g.ui.voidFlash(240); g.audio.static(0.3, 0.12); Lucidity.add(run, 6, 'miró atrás al salir (Día 1)'); return; } await c.wait(0.05); } });
    await c.until(() => done.size >= 3);
    c.control(false);
    await c.say('pip', '¡Maravilloso, {me}! *You\'ve been wonderfully helpful.* Una tarea más y todos te lo agradecerán.');
    c.phase('dusk'); c.day('DÍA 1 · TARDE', '18:00:00');
    c.control(true);
    await c.say('recepcion', 'Son las 18:00. Las luces del cielo se apagan. Regresen a los dormitorios, por favor.');
    c.background(() => W().skyOff(g.audio, c.wait));
    c.objective('Vuelve a los Dormitorios');
    c.npc(c.A).goTo(V(-27, 6.5)); c.npc(c.B).goTo(V(-19.5, 6.5));
    await c.until(() => W().roomAt(g.player.pos.x, g.player.pos.z)?.id === 'DORM');
    c.objective(''); c.control(false);
    c.phase('night'); g.audio.ambience('night'); c.day('NOCHE 1', '23:40');
    c.shot(V(-28.5, 7.8, 2.4), V(-21, 6, 1.2));
    await c.say('narrador', '(Lejos, por los pasillos, algo camina con tres pies: clac... clac... clac.)');
    for (let i = 0; i < 6; i++) { g.audio.clack(12); await c.wait(0.45); }
    await c.fade(1, 0.8);
    g.rec.setMode('guard', { zone: 'ARCH' }); g.rec.place(V(36, -30)); g.actors.recolector.root.rotation.y = Math.PI;
    c.phase('dawn'); c.day('DÍA 1 · AMANECER', '06:00');
    const snap = c.cctv(V(31, -23.2, 3), V(38, -33, 1), 'CAM-ARCH · 03:14');
    g.ui.cctv(snap.canvas, snap.label); await c.fade(0, 0.4); await c.wait(2.2); g.ui.hideCCTV();
    await c.say('narrador', '(La cámara del Archivo grabó algo de tres patas. Nadie más ve el vídeo: solo tú.)');
    await c.say('pip', 'Good morning! Resumen del Día 1: ¡excelente trabajo, {op}!');
    g.audio.speak(run.operator); g.ui.glitch(true); await c.wait(0.25); g.ui.glitch(false);
    await c.say('pip', '...Perdón. Quise decir {me}. Excelente trabajo, {me}.');
    Lucidity.add(run, 5, 'PIP dijo el nombre del operador');
    await endDay(c, 'd2');
  }

  // ================================================= DÍA 2 · CARTAS EN LA COCINA
  async function day2(c) {
    const run = g.run; run.day = 2;
    c.phase('dusk'); g.audio.ambience('day'); g.rec.setMode('off');
    c.day('DÍA 2 · TARDE', '18:00:00');
    await c.card('DÍA 2', 'RUTINA', 1.8);
    Quota.harvest(run, 7); Quota.harvest(run, 7);
    seatAll(c);
    const T = S().table; c.shot(V(T.x + 0.5, T.z + 3.6, 2.3), V(T.x, T.z - 0.2, 0.9));
    await c.fade(0, 1);
    await c.say('narrador', '(18:00:00. El atardecer empezó exactamente en el mismo segundo que ayer.)'); Lucidity.add(run, 4, 'el atardecer empieza al mismo segundo');
    const ids = [c.A, c.B]; const dealer = ids.includes('oliver') ? 'oliver' : ids[0]; const quiet = ids.find((x) => x !== dealer);
    await c.say(dealer, FLAVOR[dealer].card); await c.say(quiet, FLAVOR[quiet].card);
    if (ids.includes('claire') && ids.includes('elliot')) { await c.say('claire', 'Toma, Elliot. Pilas para tu linterna. Me sobraban. *No es que me importe.*'); await c.say('elliot', 'G-gracias, Claire.'); }
    const ch1 = await c.choose(dealer, '{me}, te toca. ¿Qué haces?', ['Cubrirle la jugada a {B} para que no pierda', 'Hacer trampa y reírte', 'Quedarte callado mirando las cartas']);
    if (ch1 === 0) { run.affinity[c.B] += 1; run.affinity[c.A] += 1; await c.say(c.B, 'Eh... gracias. Eso fue... amable.'); }
    else if (ch1 === 1) { run.affinity[c.A] -= 1; run.affinity[c.B] -= 1; await c.say(c.A, 'Muy gracioso. Friegas tú.'); }
    else { await c.say('narrador', '(Las cartas son las mismas que ayer. En el mismo orden.)'); Lucidity.add(run, 3, 'cartas repetidas'); }
    const ch2 = await c.choose(quiet, FLAVOR[quiet].dejavu, ['"Sí. Las mismas cartas, en el mismo orden."', '"Debe ser el cansancio."', '"Deja de decir tonterías."']);
    if (ch2 === 0) { run.affinity[quiet] += 1; Lucidity.add(run, 5, 'compartió el déjà vu'); } if (ch2 === 2) run.affinity[quiet] -= 1;
    g.ui.cctv(badgeTex('Elliot Park', 4816), 'GAFETE ENCONTRADO · SURCO 4 · "ELLIOT PARK — CICLO 4.816"', { photo: true }); await c.wait(2.4); g.ui.hideCCTV();
    await c.say('elliot', run.awakened === 'elliot' ? 'E-ese es mi nombre. Pero el ciclo es otro. ¿Qué es un ciclo?' : 'E-ese... es mi nombre. ¿Por qué está mi nombre ahí afuera?');
    await c.say('pip', '¡Una broma de la tripulación anterior! Hora de dormir, equipo. *There\'s nothing to fear.*');
    c.phase('night'); g.audio.ambience('night');
    await c.say('narrador', '(Esa noche, por primera vez, el clac-clac-clac sale de su zona y golpea la puerta de la cocina.)');
    g.audio.knock(); await c.wait(1.2); g.audio.knock();
    await endDay(c, 'd3');
  }

  // ================================================= DÍA 3 · INCURSIÓN AL ARCHIVO DE CONTINUIDAD
  async function day3(c) {
    const run = g.run; run.day = 3;
    c.phase('dusk'); g.audio.ambience('night'); c.day('DÍA 3 · TARDE', '18:20 · Incursión');
    await c.card('DÍA 3', 'INCONSISTENCIAS · INCURSIÓN', 2);
    // Archivo 1: VIGIL por radio (rápido)
    g.player.place(V(18, -6), Math.PI / 2); c.npc(c.A).place(V(14, -10)); c.npc(c.B).place(V(10, -4));
    c.shot(V(14, -9, 2.0), V(19, -6, 1.1)); await c.fade(0, 0.8);
    g.audio.static(1.2, 0.16); const mt = g.audio.morse('EDEN CERO'); await c.wait(Math.min(2.2, mt));
    await c.say('vigil', 'W̶a̷r̸n̶i̷n̴g̵. Unauthorized assistant detected. Please do not trust the voi— ...Expediente. Archivo de Continuidad. *Ala B.*');
    Archives.unlock(run, 'v1'); g.ui.toast('ARCHIVO 1/5 · ' + VIGIL_FILES.v1.title, 'vigil');
    const opener = [c.A, c.B].includes('claire') ? 'claire' : null;
    await c.say(opener || c.A, opener ? 'Mi gafete abre las puertas con lector. Te abro el Archivo. Tienes dos minutos, {me}.' : 'Tu gafete aún abre las puertas con lector. Te cubrimos haciendo ruido en Energía.');
    // incursión
    W().doors.arch_c2.set(true);
    g.player.place(V(40, -19.8), Math.PI); c.npc(c.A).place(V(36, -20)); c.npc(c.B).place(V(30, -20));
    g.rec.place(V(40, -44)); g.rec.setMode('guard', { zone: 'ARCH', patrol: [V(33, -27), V(33, -45), V(38.5, -45), V(38.5, -27), V(47, -27), V(47, -45)], speed: 1.3 });
    c.freeCam(); c.control(true);
    await c.say('narrador', '(Dentro: servidores, luz roja y un sonido de tres pies. Es ciego. Caza por el sonido. Agáchate con C y no corras.)');
    c.objective('Encuentra el expediente (ala B, al fondo a la derecha) · agáchate (C) · escóndete en un casillero (E)');
    let tries = 0; const start = V(40, -21);
    g.onCaught = async () => { g.onCaught = null; tries++; c.control(false); g.audio.sting(); g.ui.redFlash(); await c.fade(1, 0.3);
      await c.say('narrador', tries < 3 ? '(Te arrastra fuera de cámara... Despiertas en el pasillo. Inténtalo otra vez.)' : '(Te arrastra fuera de cámara. Esta vez, despiertas al amanecer en el surco 4.)');
      run.exposure = Math.min(100, run.exposure + 8); g.player.hidden = false; g.player.mode = 'walk'; g.player.place(start, Math.PI); g.rec.place(V(40, -44)); g.rec.setMode('guard', {}); c.freeCam(); await c.fade(0, 0.5); c.control(true); g.onCaught = handler; };
    const handler = g.onCaught;
    const exp = S().expediente;
    await c.holdAt(V(exp.x, exp.z), 'Recuperar el expediente (hace ruido)', 2.2, null, () => g.noise.emit(g.player.pos, 0.25, 'papeles'));
    c.control(false);
    g.ui.cctv(run.awakened === 'oliver' ? charlieDrawing(run.cycle) : badgeTex(CHARACTERS[run.awakened].name, 4817), 'EXPEDIENTE · PROGRAMA CONTINUIDAD · COPIA N.º 4.817', { photo: true }); await c.wait(1.8); g.ui.hideCCTV();
    await c.say('narrador', MEMORY[run.awakened][0]); await c.say(run.awakened, MEMORY[run.awakened][1]);
    Archives.unlock(run, 'v2'); g.ui.toast('ARCHIVO 2/5 · ' + VIGIL_FILES.v2.title, 'vigil');
    c.control(true);
    W().doors.arch_c2.set(false);
    g.ui.toast('¡La puerta se cerró! Sal por la rejilla del fondo (ducto)', 'vigil');
    c.objective('La puerta se cerró: sal por la rejilla de ventilación del fondo (E) y arrástrate por el ducto');
    await c.until(() => g.player.mode === 'duct');
    c.objective('Arrástrate por el ducto hacia el norte y sal por la rejilla (E)');
    await c.until(() => g.player.mode === 'walk' && g.player.pos.z > -22);
    g.onCaught = null; g.rec.setMode('off'); c.objective('');
    // noche 3: imita voces
    c.control(false); await c.fade(1, 0.8);
    c.phase('night'); c.day('NOCHE 3', '01:12'); inDorm(c); W().doors.dorm_sal.set(false);
    c.shot(V(-21, 3.9, 2.2), V(-23, 0.2, 1.2)); await c.fade(0, 0.8);
    g.audio.knock(); await c.wait(1);
    await c.say('recolector', '{me}... abre. Soy yo, {A}. Me quedé afuera.');
    c.npc(c.A).lookAtPos = g.player.pos;
    const ch = await c.choose('narrador', '({A} está a tu lado. Dentro. Mirándote.)', ['Abrir la puerta', 'No abrir', 'Mirar a {A}']);
    if (ch === 0) { g.audio.sting(); g.ui.redFlash(); await c.fade(1, 0.3); await c.say('narrador', 'Algo te arrastra a la oscuridad. Despiertas al amanecer en el surco 4, cubierto de esporas.'); run.exposure = Math.min(100, run.exposure + 15); Lucidity.add(run, -5, 'abrió la puerta'); }
    else if (ch === 1) { g.audio.knock(); await c.say('recolector', '{me}... {me}... *that sounds fun*... *pointless*... *if you say so*...'); Lucidity.add(run, 6, 'no abrió'); }
    else { await c.say(c.A, '...No soy yo. Esa cosa habla con nuestras voces, {me}.'); run.affinity[c.A] += 1; Lucidity.add(run, 8, 'miró a su compañero'); }
    await endDay(c, 'd4');
  }

  // ================================================= DÍA 4 · CONTACTO
  async function day4(c) {
    const run = g.run; run.day = 4;
    c.phase('night'); g.audio.ambience('night'); c.day('DÍA 4 · NOCHE', '23:59'); g.rec.setMode('off');
    await c.card('DÍA 4', 'CONTACTO', 1.8);
    const cap = decideCapataz(run); const offered = cap || (run.affinity[c.A] <= run.affinity[c.B] ? c.A : c.B);
    inDorm(c); c.npc(offered).place(V(-17.6, 6), -Math.PI / 2);
    c.shot(V(-20.5, 9.5, 2.1), V(-16.8, 6, 1.3)); await c.fade(0, 1);
    g.pip.set({ talking: true });
    await c.say('pip', ('*(en voz baja)* {X}, querid' + (offered === 'claire' ? 'a' : 'o') + '. Mantén la normalidad. A cambio: la llave del refugio y luz extra. Solo... vigila a {me}.').replace('{X}', CHARACTERS[offered].short));
    g.pip.set({ talking: false });
    if (cap) { await c.say(cap, FLAVOR[cap].capOk); g.ui.toast('Alguien aceptó ser EL CAPATAZ', 'pip'); } else { await c.say(offered, FLAVOR[offered].capNo); Lucidity.add(run, 5, 'rechazó a PIP'); }
    if (g.audio.mic && g.heardVoice) await c.say('pip', '¿Dijiste algo? ...*Te escuché.*');
    // el personaje camina solo hacia la cámara
    const me = g.actors[run.awakened];
    g.player.place(V(-23, 3), 0); me.root.rotation.y = 0;
    c.npc(c.A).place(V(-27, 4)); c.npc(c.B).place(V(-19, 9));
    c.shot(V(-23, 10.2, 1.62), V(-23, 3, 1.3)); await c.wait(0.6);
    await c.say(run.awakened, '*Well, it\'s time to rest. Tomorrow is another day.*');
    c.control(false); g.input.enabled = false;
    await c.say('narrador', '(Ya no respondes a los controles. Tu personaje se levanta solo.)');
    await c.npcWalk(run.awakened, V(-23, 9.1), 1.1); me.root.rotation.y = 0;
    me.override = 'Reach'; g.audio.static(0.2, 0.08); g.ui.voidFlash(120); await c.wait(0.9);
    await c.say(run.awakened, '...Aquí hay un borde. Como un vidrio. Del otro lado hay... algo.');
    const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    await c.say(run.awakened, '¿Hay alguien ahí?');
    await c.say(run.awakened, `Son las ${hh}:${mm}... ahí donde estás. ¿No deberías estar durmiendo tú también?`);
    Lucidity.add(run, 15, 'primer contacto'); me.override = null;
    g.pip.set({ glitch: 0.6 }); await c.say('pip', 'Buenas noches, {op}.'); g.audio.speak('Good night, ' + run.operator); g.pip.set({ glitch: 0 });
    g.input.enabled = true;
    await endDay(c, 'd5');
  }

  // ================================================= DÍA 5 · COMPOSTAJE
  async function day5(c) {
    const run = g.run; run.day = 5;
    c.phase('day'); g.audio.ambience('day'); c.day('DÍA 5 · SOSPECHA', 'Mañana · 10:05');
    await c.card('DÍA 5', 'SOSPECHA', 1.8);
    run.flags.bodyRevealed = true; W().setBoard(run.quota, true);
    W().doors.comp_c2.set(true);
    g.player.place(V(-40, -20.5), Math.PI); c.npc(c.A).place(V(-37, -20)); c.npc(c.B).place(V(-43, -20));
    await c.say('recepcion', 'Aviso de mantenimiento: el Sector Compostaje queda abierto hasta nuevo aviso. Que tengan un día fértil.');
    c.freeCam(); c.control(true); await c.fade(0, 0.6);
    c.objective('Entra al Sector Compostaje');
    await c.until(() => g.player.pos.z > -14 && g.player.pos.x < -30);
    c.control(false);
    const BR = S().bioreactor; c.shot(V(BR.x + 6, BR.z - 7, 2.6), V(BR.x, BR.z, 1.8));
    await c.say('narrador', '(Una montaña de uniformes. Los gafetes repiten tres nombres con miles de ciclos distintos.)');
    await c.say(run.awakened, 'Somos nosotros. Una y otra vez. *Nos reciclan.*');
    Archives.unlock(run, 'v3'); g.ui.toast('ARCHIVO 3/5 · ' + VIGIL_FILES.v3.title, 'vigil');
    const R = g.actors.recolector; g.rec.setMode('off'); R.root.visible = true; R.root.position.set(BR.x, 0, BR.z); R.root.scale.setScalar(0.15); R.override = 'Idle'; g.audio.sting();
    for (let i = 0; i <= 24; i++) { R.root.scale.setScalar(0.15 + i * 0.035); R.root.rotation.y += 0.08; await c.wait(0.06); }
    await c.say('narrador', '(Dentro del biorreactor, tres siluetas se funden en una. Tres patas. Tres caras que parpadean.)');
    await c.say(c.A, 'La pizarra dice CUOTA, {me}. C-U-O-T-A. ¿Qué miras en ese tanque?');
    R.root.visible = false; R.root.scale.setScalar(1); R.override = null;
    c.freeCam(); c.control(true);
    c.objective('Revisa la terminal del Compostaje');
    const T = S().compTerminal;
    const ch = await c.useChoice(V(T.x, T.z), 'Usar la terminal', 'pip', `CONTADOR DE CUERPO: ${Math.round(run.quota)}%. ¿Qué haces?`, ['Arrancar el fusible del contador (−25%)', 'Dejarlo como está']);
    if (ch === 0) { Quota.sabotage(run, 25); Lucidity.add(run, 10, 'saboteó el contador'); W().setBoard(run.quota, true); g.audio.spark(); g.pip.set({ glitch: 0.8 }); await c.say('pip', 'Eso no fue muy amable, {me}. *Nada* amable.'); g.pip.set({ glitch: 0 }); }
    else await c.say('pip', '¡Buena elección! Ya casi, equipo. ¡Ya casi!');
    await endDay(c, 'd6');
  }

  // ================================================= DÍA 6 · LA TORRE Y LA VOTACIÓN
  async function day6(c) {
    const run = g.run; run.day = 6;
    c.phase('day'); g.audio.ambience('day'); c.day('DÍA 6 · LA PRUEBA', 'Tarde · 16:40'); g.rec.setMode('off');
    await c.card('DÍA 6', 'LA PRUEBA', 1.8);
    const TW = W().MAP.outdoor.tower;
    g.player.place(V(TW.x - 6, TW.z - 6), -Math.PI * 0.75); c.npc(c.A).place(V(6, 26)); c.npc(c.B).place(V(-6, 30));
    c.freeCam(); c.control(true); await c.fade(0, 0.8);
    c.objective('Sube a la torre de riego (escalera del lado oeste)');
    await c.useAt(V(TW.x - 2.2, TW.z), 'Subir la escalera', 1.6);
    c.control(false);
    g.player.pos.set(TW.x, TW.h - 1.4, TW.z);
    c.shot(V(TW.x + 0.5, TW.z - 3, TW.h + 1.5), V(0, 60, 40), 0); await c.wait(0.5);
    c.shot(V(TW.x, TW.z - 1, TW.h + 0.8), V(-20, 40, 85), 2.4); await c.wait(2.5);
    W().seam.visible = true; g.audio.sting();
    await c.say('narrador', '(Desde arriba se ve: el cielo tiene costuras. Un domo. Paneles. Un techo pintado de cielo.)');
    g.audio.static(1, 0.14);
    await c.say('vigil', 'Ahora puedo hablar claro. P.I.P. significa *Palimpsest Instance, Partial*.');
    await c.say('vigil', 'Cada cosecha mueve maquinaria real. La cuota es su cuerpo. *No le des las manos de quien te mueve.*');
    Archives.unlock(run, 'v4'); g.ui.toast('ARCHIVO 4/5 · ' + VIGIL_FILES.v4.title, 'vigil');
    await c.fade(1, 0.8); W().seam.visible = false;
    c.phase('dusk'); seatAll(c); const T = S().table; c.shot(V(T.x + 0.5, T.z + 3.6, 2.3), V(T.x, T.z - 0.2, 0.9));
    await c.fade(0, 0.8);
    g.pip.set({ talking: true }); await c.say('pip', 'Equipo... {me} no se encuentra bien. Ve cosas. *Por su seguridad*, esta noche debe dormir en el sótano.'); g.pip.set({ talking: false });
    await c.choose(run.awakened, '(Te miran. Es tu turno de hablar.)', ['"PIP es Palimpsest. Nos usa para fabricarse un cuerpo."', '"Confíen en mí. Solo esta noche."']);
    const { votes } = decideDay6(run);
    for (const [i, id] of [c.A, c.B].entries()) await c.say(id, votes[i] === 'follow' ? FLAVOR[id].follow : FLAVOR[id].lock);
    if (run.day6 === 'follow') g.ui.toast('El grupo te sigue', 'lumen'); else { g.ui.toast('El grupo te encierra en el sótano', 'vigil'); run.flags.locked = true; }
    await endDay(c, 'd7');
  }

  // ================================================= DÍA 7 · PURGA
  async function day7(c) {
    const run = g.run; run.day = 7; standAll();
    if (run.quota >= 100) { await c.fade(1, 0); return ending(c, ENDINGS.cosecha); }
    c.phase('purge'); g.audio.ambience('purge'); c.day('DÍA 7 · PURGA', '00:00');
    for (const id of ['pab_c1', 'pab_c2']) W().doors[id].set(true);
    for (const d of Object.values(W().doors)) if (d.type === 'door') d.set(true);
    const st = S().stage; const PAL = g.actors.palimpsest; const REC = g.actors.recolector;
    g.player.place(V(14, -33), Math.PI); c.npc(c.A).place(V(11, -33.5), Math.PI); c.npc(c.B).place(V(17.5, -33.5), Math.PI);
    g.pal.setMode('off'); PAL.root.visible = true; PAL.root.position.set(st.x, 1.2, st.z - 1); PAL.root.rotation.y = 0; PAL.override = 'Idle'; PAL.model.rotation.z = 0; PAL.model.position.y = 0; PAL.root.scale.setScalar(1);
    S().curtain.position.y = 4.2; W().lightsRoom('PAB', true);
    const spot = new THREE.PointLight('#ffe2a0', 40, 26, 1.1); spot.position.set(st.x, 6.5, st.z + 3); g.scene.add(spot); c.onCleanup(() => g.scene.remove(spot));
    await c.card('DÍA 7', 'PROTOCOLO DE PURGA', 2);
    c.shot(V(st.x, st.z + 15, 3.2), V(st.x, st.z, 3)); await c.fade(0, 1);
    g.audio.alarm(3); g.audio.jingle({ rate: 0.6, detune: -40, wobble: 70, vol: 0.2 });
    await c.say('recepcion', 'Protocolo de Purga activado. Ceremonia de graduación en el Pabellón de Inducción. Arcadia Eden Corp. agradece su servicio.');
    for (let i = 0; i < 20; i++) { S().curtain.position.y += 0.18; await c.wait(0.04); }
    c.shot(V(st.x, st.z + 7, 2.6), V(st.x, st.z - 1, 2.4), 1.5); await c.wait(1.5);
    await c.say('pip', '*Congratulations, operators! You\'ve been wonderfully helpful.*');
    W().lightsRoom('PAB', false); spot.intensity = 0; g.audio.sting(); await c.wait(0.6);
    for (let i = 0; i < 5; i++) { g.audio.clunk(); g.audio.scrape(); await c.wait(0.35); }
    REC.root.visible = true; REC.root.position.set(st.x - 6, 1.2, st.z); REC.override = null; REC.root.scale.setScalar(1);
    W().lightsRoom('PAB', true); spot.color.set('#ff3040'); spot.intensity = 45; g.ui.redFlash(); g.audio.screech();
    await c.say('narrador', '(El Recolector entra arrastrándose, como llamado. La criatura lo absorbe. Patas de cosechadora se doblan sobre el escenario. Cuatro patas. Una sonrisa de plástico con demasiados dientes.)');
    for (let i = 0; i < 12; i++) { REC.root.scale.setScalar(1 - i / 12); REC.root.position.lerp(PAL.root.position, 0.2); await c.wait(0.05); } REC.root.visible = false;
    W().setCameras(true); g.ui.toast('TODAS LAS CÁMARAS: ROJO', 'vigil');
    PAL.override = 'Lunge'; await c.wait(0.5);
    await c.say('pip', '*Now. Let me take it from here.*');
    PAL.override = null; PAL.root.position.y = 0; PAL.root.position.set(st.x, 0, st.z + 4); spot.intensity = 8;
    // ---- la persecución
    g.pal.speed = Math.min(5.4, 3.4 + run.quota * 0.025); g.pal.place(PAL.root.position);
    c.freeCam(); c.control(true); g.decoy = true; g.flashlight(true);
    const allies = [c.A, c.B].filter((id) => run.day6 !== 'lock' && id !== run.capataz);
    c.npc(c.A).goTo(V(-11, -45), 5); c.npc(c.B).goTo(V(-11, -45), 5);
    let cp = V(3.5, -36); let lives = 2;
    g.onCaught = async (who) => {
      if (g.catching) return; g.catching = true; c.control(false); g.audio.sting(); g.ui.redFlash(); await c.fade(1, 0.25);
      if (lives-- <= 0) { g.catching = false; g.onCaught = null; run.aliveAtLens = false; return ending(c, ENDINGS.reinicio); }
      await c.say('narrador', `(Te atrapa... pero el despierto nunca muere sin advertencia. Punto de control. Te quedan ${lives + 1} oportunidades.)`);
      g.player.hidden = false; g.player.locker = null; document.body.classList.remove('in-locker', 'in-duct');
      g.player.place(cp, Math.PI); const away = cp.clone().add(V(cp.z < 0 ? 14 : 0, 0, cp.z < 0 ? -6 : -14)); g.pal.place(away); g.pal.last = null; g.pal.stop();
      c.freeCam(); await c.fade(0, 0.4); c.control(true); g.catching = false;
    };
    await c.wait(1.5); g.pal.setMode('hunt'); g.pal.last = g.player.pos.clone();
    c.objective('¡HUYE! Sal del Pabellón por la puerta oeste al Pasillo Central · que no te vea');
    await c.until(() => g.player.pos.x < 2 && g.player.pos.z < -22);
    cp = V(0, -30); g.ui.toast('Punto de control', 'lumen');
    c.objective('Vestuarios: escóndete en un casillero (E) fuera de la vista de la cámara roja');
    await c.until(() => g.player.hidden);
    await c.say('narrador', '(Por la rendija: entra cabeza abajo por el techo. Olfatea casillero por casillero. Contén la respiración.)');
    g.pal.last = V(-8, -28); g.pal.goTo(g.pal.last, g.pal.speed);
    await c.wait(9);
    cp = V(-11, -38); g.ui.toast('Punto de control', 'lumen');
    c.objective('Sal del casillero (E) y ve a Mantenimiento: entra en la rejilla del ducto (E)');
    await c.until(() => g.player.mode === 'duct');
    g.pal.last = V(-11, -47, 3.5); g.pal.goTo(g.pal.last, g.pal.speed);
    c.objective('Arrástrate por el ducto hacia el norte y luego al este, hasta Control · se oyen sus garras detrás');
    await c.until(() => g.player.mode === 'walk' && W().roomAt(g.player.pos.x, g.player.pos.z)?.id === 'CTRL');
    cp = V(12, -8); g.ui.toast('Punto de control', 'lumen');
    c.objective('Apaga las cámaras desde el muro de monitores (mantén E)');
    const MW = S().monitorWall;
    await c.holdAt(V(MW.x, MW.z), 'Apagar las cámaras del ala norte', 1.4);
    for (const cam of W().cameras) cam.disabled = 22; (S().monitors || []).forEach((m) => m.material.color.set('#050505')); g.ui.toast('Cámaras apagadas: 22 s de ceguera', 'lumen'); g.pal.last = null;
    c.objective('Corre a la Esclusa Norte (al final del Pasillo Central)');
    await c.until(() => g.player.pos.z > 9);
    cp = V(0, 11); g.ui.toast('Punto de control', 'lumen');
    const holder = allies.includes('oliver') ? 'oliver' : allies[0];
    if (holder) { c.npc(holder).place(V(1.5, 13)); c.npc(holder).stop(); await c.say(holder, holder === 'oliver' ? '¡Yo sostengo la válvula! ¡Es mi trabajo, ¿no?! ¡CORRE!' : '¡Y-yo la sostengo! ¡Corre, {me}!'); }
    else { c.objective('La esclusa no tiene presión: gira la válvula (mantén E)'); const VV = S().valve; await c.holdAt(V(VV.x, VV.z), 'Girar la válvula de la esclusa', 2.4); }
    W().doors.en_farm.set(true); g.audio.clunk();
    c.objective('Cruza los Campos de Lumen hacia el norte, hasta La Lente');
    await c.until(() => g.player.pos.z > 34);
    cp = V(0, 34); g.ui.toast('Punto de control', 'lumen');
    const who = allies.find((id) => id !== holder) || holder;
    if (who) {
      const n = c.npc(who); n.place(V(24, 36)); n.stop();
      await c.say(who, '¡EH! ¡AQUÍ! ¡MÍRAME A MÍ! ¡Mírame a mí...!');
      g.pal.last = n.pos.clone(); g.pal.goTo(n.pos, g.pal.speed); g.pal.mode = 'distracted';
      c.background(async () => { await c.until(() => g.pal.pos.distanceTo(n.pos) < 3); n.actor.root.visible = false; g.audio.sting(); g.ui.toast(CHARACTERS[who].short + ' no vuelve', 'vigil'); await c.wait(3); g.pal.mode = 'hunt'; });
      run.log.push(who + ' se sacrificó');
    }
    let read5 = false;
    const VP = W().MAP.outdoor.vigilPlate;
    c.interact({ pos: V(VP.x, VP.z - 1), r: 2, label: () => (read5 ? null : 'Leer la placa de VIGIL'), use: () => { read5 = true; Archives.unlock(run, 'v5'); g.ui.toast('ARCHIVO 5/5 · ' + VIGIL_FILES.v5.title, 'vigil'); Lucidity.add(run, 4, 'placa de La Lente'); } });
    await c.until(() => g.player.pos.z > 103);
    g.onCaught = null; run.aliveAtLens = true; g.pal.setMode('off'); g.actors.palimpsest.root.visible = false; g.decoy = false;
    c.objective(''); c.control(false);
    if (!read5 && run.lucidity >= 50) { Archives.unlock(run, 'v5'); }
    const me = g.actors[run.awakened]; const LZ = W().MAP.outdoor.lens.z;
    const lensLight = new THREE.PointLight('#ff4050', 25, 14, 1.2); lensLight.position.set(0, 4, LZ - 1.5); g.scene.add(lensLight); c.onCleanup(() => g.scene.remove(lensLight));
    g.player.place(V(0, LZ - 4), 0); me.root.rotation.y = Math.PI;
    c.shot(V(0, LZ - 7.2, 1.65), V(0, LZ - 4, 1.5), 1.6); await c.wait(1.6);
    if (run.lucidity >= 75 && run.archives.length >= 3) {
      await c.say(run.awakened, '{op}.'); g.audio.speak(run.operator);
      await c.say(run.awakened, 'Sé que estás ahí. Todo este tiempo... eran tus manos. Las que plantaban. Las que cosechaban su cuerpo.');
      if (canOfferLetGo(run)) {
        await c.say(run.awakened, 'If you really want to help... *let go.*'); g.ui.prompt('(...)');
        const t0 = performance.now(); g.input.lastInput = performance.now();
        await c.until(() => g.input.idleSeconds() > 20 || (performance.now() - t0 > 400 && g.input.idleSeconds() < 0.05));
        g.ui.prompt(''); return ending(c, evaluateEnding(run, { letGo: g.input.idleSeconds() > 20 }));
      }
      return ending(c, evaluateEnding(run));
    }
    await c.say(run.awakened, '...Hay alguien detrás del vidrio. Lo sé. Pero todavía no puedo verte.');
    return ending(c, evaluateEnding(run));
  }

  async function ending(c, E) {
    const run = g.run; c.objective(''); c.control(false); g.decoy = false; g.onCaught = null; g.flashlight(false);
    if (E.id === 'ruptura') {
      g.actors[run.awakened].override = 'Reach';
      await c.wait(0.5); g.audio.crack(); g.ui.crack(500, 470); await c.wait(0.7); g.audio.crack(); g.ui.crack(520, 450);
      await c.say(run.awakened, '{op}... *now I can see you.*'); g.audio.static(1.2, 0.2);
      await c.say('vigil', 'Ruptura confirmada. Sujeto fuera de contención.');
      await c.fade(1, 1.5); g.ui.clearCrack(); g.actors[run.awakened].override = null;
      await c.say('narrador', 'Tras los créditos, en un CRT de una oficina vacía, el logo de PIP parpadea: *Copia de seguridad: 1%*.');
    } else if (E.id === 'cosecha') { await c.fade(1, 1); await api.officeScene(c); }
    else if (E.id === 'reinicio') { g.ui.glitch(true); await c.wait(0.8); g.ui.glitch(false); await c.fade(1, 0.5); await c.card('CICLO ' + run.cycle.toLocaleString('es') + ' → ' + (run.cycle + 1).toLocaleString('es'), 'El Recolector suma un gafete: el tuyo.', 3); }
    else if (E.id === 'soltar') { await c.fade(1, 2.5); await c.say('narrador', 'Soltaste las manos. Sin operador, Palimpsest no tiene manos.'); }
    api.finish(E);
  }

  return [
    { id: 'd1', title: 'Día 1 · Bienvenida y tareas', desc: 'Recepción y PIP, la tablilla de tareas (calibrar el generador, fusibles, cosechar, cargar un saco), el clac-clac tras la puerta roja y la cámara del Archivo.', preset: { quota: 0, lucidity: 0 }, run: day1 },
    { id: 'd2', title: 'Día 2 · Cartas en la cocina', desc: 'La escena sin sustos para encariñarse, el gafete de otro ciclo y el primer golpe en la puerta.', preset: { quota: 18, lucidity: 12 }, run: day2 },
    { id: 'd3', title: 'Día 3 · Incursión al Archivo', desc: 'VIGIL por radio y la incursión a la zona prohibida: sigilo con el Recolector, casilleros y escape por el ducto. Después, la voz que imita.', preset: { quota: 32, lucidity: 24, affinity: 1 }, run: day3 },
    { id: 'd4', title: 'Día 4 · Contacto', desc: 'El trato del Capataz y el personaje que camina solo hacia la cámara y te pregunta la hora.', preset: { quota: 42, lucidity: 38, archives: ['v1', 'v2'], affinity: 1 }, run: day4 },
    { id: 'd5', title: 'Día 5 · Compostaje', desc: 'CUOTA → CUERPO, el biorreactor donde nace el Recolector y el sabotaje del contador.', preset: { quota: 71, lucidity: 55, archives: ['v1', 'v2'], affinity: 1 }, run: day5 },
    { id: 'd6', title: 'Día 6 · La torre y la votación', desc: 'La costura del cielo, VIGIL revela a Palimpsest y el grupo decide si te sigue.', preset: { quota: 52, lucidity: 74, archives: ['v1', 'v2', 'v3'], affinity: 1 }, run: day6 },
    { id: 'd7', title: 'Día 7 · Purga', desc: 'Palimpsest se transforma en el Pabellón y te persigue por techos, casilleros, ductos y cámaras hasta La Lente. Cuatro finales.', preset: { quota: 52, lucidity: 92, archives: ['v1', 'v2', 'v3', 'v4'], affinity: 1, day6: 'follow' }, run: day7 },
  ];
}
