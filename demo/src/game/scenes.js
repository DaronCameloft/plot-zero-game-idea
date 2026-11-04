import * as THREE from 'three';
import { POI } from '../world/world.js';
import { CHARACTERS, VIGIL_FILES, Lucidity, Archives, Quota, decideCapataz, decideDay6, evaluateEnding, canOfferLetGo, ENDINGS } from './state.js';
import { badgeTex, charlieDrawing, portrait } from '../art/paint.js';

// Guion jugable del Capítulo 1 en 7 escenas. Cada escena es una corrutina que recibe `c` (contexto).
// Marcadores en los textos: {op}=nombre del operador (tú), {me}=el despierto, {A}/{B}=compañeros.

const V = (x, z) => new THREE.Vector3(x, 0, z);
const SEATS = [{ p: V(4.3, -16), r: Math.PI / 2 }, { p: V(7.7, -16), r: -Math.PI / 2 }, { p: V(6, -17.1), r: 0 }];

// Frases por personaje cuando NO son el despierto (para que cada uno tenga voz propia)
const FLAVOR = {
  oliver: { card: '¡Noche de cartas! El que pierda friega los platos. *Oh, come on! That sounds fun!*', dejavu: 'Oye... ¿tú también sientes que ya jugamos esta mano? Hasta el chiste me suena repetido.', capOk: 'Luz extra y la llave del refugio... ¡Trato hecho, amiguito!', capNo: 'Nah. Yo no le escondo cosas a mis amigos.', follow: '{me} nunca me ha mentido. Si dice que corramos, corremos.', lock: 'Lo siento, {me}. PIP dice que es por tu bien... y PIP siempre nos ha cuidado.' },
  claire: { card: 'Right. *Another pointless task.* Reparte. Y nada de trampas, Oliver.', dejavu: 'Esta mano ya la vi. Mismas cartas, mismo orden. Estadísticamente... imposible.', capOk: 'Una llave a cambio de mantener la normalidad. Es lo más eficiente.', capNo: 'No hago tratos con una mascota que se ríe sin motivo.', follow: 'Los datos de {me} cuadran mejor que los de PIP. Voy con {me}.', lock: 'Es lo lógico. Si {me} está enfermo, el aislamiento es el protocolo.' },
  elliot: { card: 'U-um... *if you say so.* ¿Puedo jugar con la linterna encendida?', dejavu: 'Y-yo ya oí este barajeo. El mismo sonido. Juro que lo oí.', capOk: 'Una luz extra... s-sí. Tengo mucho miedo a la oscuridad.', capNo: 'N-no. No voy a vigilar a {me}. Eso es lo que hacen los malos.', follow: 'T-tengo miedo... pero tengo más miedo de quedarme. Te sigo, {me}.', lock: 'P-perdón, {me}. PIP dice que hay nada que temer si te quedas abajo.' },
};

export function makeScenes(api) {
  const { game: g } = api;

  // ------------------------------------------------ helpers comunes
  const team = (c) => [c.A, c.B];
  const placeInside = (c) => {
    g.player.place(V(0, -13.2), Math.PI);
    c.npc(c.A).place(V(4.6, -14.2), Math.PI); c.npc(c.B).place(V(-3.4, -15.2), Math.PI);
  };
  const seatAll = (c) => {
    const ids = [g.run.awakened, c.A, c.B];
    ids.forEach((id, i) => { const pp = g.people[id]; pp.root.position.copy(SEATS[i].p); pp.root.rotation.y = SEATS[i].r; pp.seated = true; });
  };
  const standAll = () => Object.values(g.people).forEach((p) => (p.seated = false));
  const tableShot = (c, d = 0) => c.shot(V(6, -12.6).setY(2.4), new THREE.Vector3(6, 0.9, -16.3), d);
  const plotsInteract = (c, onHarvest) => {
    for (const p of g.world.plots) {
      c.interact({
        pos: p.pos, r: 1.4,
        label: () => ({ empty: 'Plantar Lumen', seeded: 'Regar', growing: null, ripe: 'Cosechar Lumen', done: null }[p.state]),
        use: () => {
          if (p.state === 'empty') { p.state = 'seeded'; p.sprout.visible = true; p.sprout.scale.y = 0.4; g.audio.interact(); g.noise.emit(p.pos, 0.3, 'herramienta'); }
          else if (p.state === 'seeded') { p.state = 'growing'; p.wet.visible = true; g.audio.water(); g.noise.emit(p.pos, 0.4, 'herramienta'); }
          else if (p.state === 'ripe') { p.state = 'done'; p.bulb.visible = false; p.sprout.visible = false; Quota.harvest(g.run, 6); g.audio.harvest(); g.noise.emit(p.pos, 0.5, 'herramienta'); g.ui.toast('+6% cuota · +4% exposición', 'pip'); onHarvest && onHarvest(); }
        },
      });
    }
  };
  const nightWindow = async (c, secs, { knocks = false } = {}) => {
    c.objective('Quédate en el módulo. El ruido lo atrae. (Mira el radar)');
    const end = g.flow.time + secs;
    let knocked = false;
    while (c.alive() && g.flow.time < end) {
      await c.wait(0.5);
      if (knocks && !knocked && g.flow.time > end - secs / 2) { knocked = true; g.recAI.lastHeard = V(0, -8.6); }
      if (knocks && g.recAI.pos.distanceTo(V(0, -9)) < 2.5 && !c.flagOnce('knock' + g.run.day)) { g.audio.knock(); g.ui.toast('*toc* *toc* *toc*'); }
    }
  };
  const endDay = async (c, next) => {
    c.objective(''); c.control(false);
    await c.fade(1, 1.2);
    standAll();
    await c.card('FIN DEL DÍA ' + g.run.day, next ? 'Guardado al amanecer' : '', 2);
    if (next) api.start(next);
  };
  const dawn = async (c, summary) => {
    c.phase('dawn'); g.audio.ambience('day'); g.recAI.setMode('scarecrow');
    c.day('DÍA ' + g.run.day + ' · AMANECER', '06:00');
    await c.fade(0, 1);
    g.audio.jingle({ vol: 0.12 });
    for (const line of summary) await c.say('pip', line);
  };

  // ================================================= DÍA 1 · BIENVENIDA
  async function day1(c) {
    const run = g.run; run.day = 1;
    c.phase('day'); g.audio.ambience('day');
    placeInside(c); g.world.setDoor(true);
    g.recAI.place(POI.scarecrow); g.recAI.setMode('scarecrow', { creep: true });
    c.day('DÍA 1 · BIENVENIDA', 'Mañana · 07:58');
    await c.card('CICLO ' + run.cycle.toLocaleString('es'), 'DÍA 1 · BIENVENIDA', 2.4);
    c.shot(new THREE.Vector3(-6, 2.6, -11.5), new THREE.Vector3(1, 1.2, -15));
    await c.fade(0, 1.5);
    await c.say('recepcion', 'Buenos días, pasantes. Bienvenidos al puesto Eden-0 de Arcadia Eden Corp.');
    await c.say('recepcion', 'Recuerden el lema del Programa Continuidad: *su trabajo, para siempre*. Les dejo con su compañero de inducción.');
    g.pip.set({ talking: true }); g.audio.jingle();
    c.shot(new THREE.Vector3(-5.6, 1.6, -18.4), new THREE.Vector3(-7.2, 1.05, -20.9), 1.2);
    await c.wait(1.4);
    await c.say('pip', 'Good morning, team! Soy PIP, su *Plant Intelligence Partner*. ¡Qué alegría tenerlos aquí!');
    await c.say('pip', 'Cada uno tiene una orden privada. {me}, la tuya es sencilla: planta tres semillas de Lumen, riégalas y cosécha-las.');
    await c.say('pip', 'Cuota de hoy: ¡fácil! Y una sola regla: cuando las luces del cielo se apaguen, todos adentro.');
    g.pip.set({ talking: false });
    c.shot(new THREE.Vector3(2, 2.2, -10.8), new THREE.Vector3(0, 1.3, -14.5), 1);
    await c.say(c.A, CHARACTERS[c.A].short === 'Oliver' ? '*Oh, come on! That sounds fun!*' : c.A === 'claire' ? '*Right. Another pointless task.*' : '*U-um... if you say so.*');
    await c.say(c.B, '¿Alguien se acuerda del viaje hasta aquí? Yo... no recuerdo haber subido a ninguna nave.');
    await c.say(c.A, '...No. ¿Debería?');
    c.freeCam(); c.control(true);
    c.objective('Sal del módulo y ve a los Campos de Lumen');
    c.npc(c.A).goTo(V(-4, 4)); c.npc(c.B).goTo(V(5, 6));
    // Anomalía secreta: mirar atrás justo al salir
    await c.until(() => g.player.pos.z > -9.4);
    const t0 = g.flow.time;
    c.background(async () => {
      while (c.alive() && g.flow.time - t0 < 7) {
        if (g.player.pos.z > -9.4 && g.player.looksAt(g.camera, V(0, -16), 0.75)) {
          g.ui.voidFlash(260); g.audio.static(0.3, 0.12); Lucidity.add(run, 6, 'miró atrás al cerrarse la puerta (Día 1)'); run.flags.lookedBack = true; return;
        }
        await c.wait(0.05);
      }
    });
    await c.until(() => g.player.pos.z > 0);
    const h0 = run.harvests;
    c.objective('Planta, riega y cosecha 3 Lumen en las parcelas marcadas (E)');
    plotsInteract(c);
    await c.until(() => run.harvests - h0 >= 3);
    c.objective(''); c.control(false);
    await c.say('pip', '¡Maravilloso, {me}! *You\'ve been wonderfully helpful.* Una tarea más y todos te lo agradecerán.');
    c.control(true);
    // ---- atardecer
    c.phase('dusk'); c.day('DÍA 1 · ATARDECER', '18:00:00');
    await g.world.lightsOff(g.audio, c.wait);
    await c.say('recepcion', 'Son las 18:00. Las luces del cielo se han apagado. Regresen al módulo y aseguren la puerta.');
    c.objective('Vuelve al módulo y atranca la puerta');
    c.npc(c.A).goTo(V(4.6, -14.2)); c.npc(c.B).goTo(V(-3.4, -15.2));
    await c.holdAt(POI.doorInside, 'Atrancar la puerta', 1.4, () => g.world.isInside(g.player.pos));
    g.world.setBarricade(true); g.audio.knock();
    // ---- noche 1
    c.phase('night'); g.audio.ambience('night'); c.day('NOCHE 1', '22:40');
    g.recAI.setMode('scarecrow');
    if (c.A === 'elliot' || c.B === 'elliot') {
      const e = c.npc('elliot'); g.noise.emit(e.pos, 0.6, 'npc-tarareo');
      await c.say('narrador', '(Elliot tararea el jingle de Arcadia, muy bajito. En el radar, su tarareo es una onda que crece.)');
      await c.say(c.A === 'elliot' ? c.B : c.A, 'Shh. Elliot. *Shh.*');
    } else {
      await c.say('narrador', '(Tú tarareas el jingle sin darte cuenta. El radar lo marca como ruido.)');
    }
    await nightWindow(c, 14);
    // ---- amanecer + cámara de seguridad
    await c.fade(1, 1);
    const snapA = c.cctv(new THREE.Vector3(9, 6, -6), V(1, 15), 'CAM-03 · 03:14');
    g.recAI.place(V(1.2, 7.5));
    const snapB = c.cctv(new THREE.Vector3(9, 6, -6), V(1, 15), 'CAM-03 · 05:59');
    c.phase('dawn'); c.day('DÍA 1 · AMANECER', '06:00');
    g.ui.cctv(snapA.canvas, snapA.label); await c.fade(0, 0.4); await c.wait(1.8);
    g.ui.cctv(snapB.canvas, snapB.label); g.audio.static(0.4, 0.1); await c.wait(2.2); g.ui.hideCCTV();
    await c.say('narrador', '(El espantapájaros está más cerca del módulo que anoche. Nadie más parece notarlo.)');
    await c.say('pip', 'Good morning! Resumen del Día 1: {me}, 3 cosechas. {A}, 2. {B}, 1. ¡Excelente trabajo, {op}!');
    g.audio.speak(run.operator); g.ui.glitch(true); await c.wait(0.25); g.ui.glitch(false);
    await c.say('pip', '...Perdón. Quise decir {me}. Excelente trabajo, {me}.');
    Lucidity.add(run, 5, 'PIP dijo el nombre del operador');
    await endDay(c, 'd2');
  }

  // ================================================= DÍA 2 · RUTINA
  async function day2(c) {
    const run = g.run; run.day = 2;
    c.phase('day'); g.audio.ambience('day'); placeInside(c); g.world.setDoor(true);
    g.recAI.setMode('scarecrow'); g.recAI.place(V(1.2, 9));
    c.day('DÍA 2 · RUTINA', 'Mañana · 07:58');
    await c.card('DÍA 2', 'RUTINA', 2);
    c.shot(new THREE.Vector3(-5.6, 1.6, -18.4), new THREE.Vector3(-7.2, 1.05, -20.9));
    await c.fade(0, 1);
    g.pip.set({ talking: true }); g.audio.jingle({ vol: 0.12 });
    await c.say('pip', 'Day 2! Mismas órdenes, una cuota un poquito más alta. ¡Ustedes pueden, equipo!');
    g.pip.set({ talking: false });
    await c.fade(1, 0.8);
    Quota.harvest(run, 7); Quota.harvest(run, 7);
    await c.say('narrador', 'El día pasa entre surcos. La cuota sube. Nadie habla de la noche anterior.');
    c.phase('dusk'); c.day('DÍA 2 · ATARDECER', '18:00:00');
    await c.fade(0, 0.8);
    await c.say('narrador', '(18:00:00. El atardecer empezó exactamente en el mismo segundo que ayer.)');
    Lucidity.add(run, 4, 'el atardecer empieza al mismo segundo');
    // ---- cartas en la cocina (escena sin sustos)
    seatAll(c); tableShot(c);
    g.world.setBarricade(true);
    const ids = [c.A, c.B];
    const dealer = ids.includes('oliver') ? 'oliver' : ids[0];
    await c.say(dealer, FLAVOR[dealer].card);
    const quiet = ids.find((x) => x !== dealer);
    await c.say(quiet, FLAVOR[quiet].card);
    if (ids.includes('claire') && ids.includes('elliot')) {
      await c.say('claire', 'Toma, Elliot. Pilas para tu linterna. Me sobraban. *No es que me importe.*');
      await c.say('elliot', 'G-gracias, Claire.');
    }
    const ch1 = await c.choose(dealer, '{me}, te toca. ¿Qué haces?', ['Cubrirle la jugada a {B} para que no pierda', 'Hacer trampa y reírte', 'Quedarte callado mirando las cartas']);
    if (ch1 === 0) { run.affinity[c.B] += 1; run.affinity[c.A] += 1; await c.say(c.B, 'Eh... gracias. Eso fue... amable.'); }
    else if (ch1 === 1) { run.affinity[c.A] -= 1; run.affinity[c.B] -= 1; await c.say(c.A, 'Muy gracioso. Friegas tú.'); }
    else { await c.say('narrador', '(Las cartas son las mismas que ayer. En el mismo orden.)'); Lucidity.add(run, 3, 'notó las cartas repetidas'); }
    const ch2 = await c.choose(quiet, FLAVOR[quiet].dejavu, ['"Sí. Las mismas cartas, en el mismo orden."', '"Debe ser el cansancio."', '"Deja de decir tonterías."']);
    if (ch2 === 0) { run.affinity[quiet] += 1; Lucidity.add(run, 5, 'compartió el déjà vu'); }
    if (ch2 === 2) run.affinity[quiet] -= 1;
    // ---- el gafete
    await c.say('narrador', '(Alguien deja algo sobre la mesa. Lo encontró por la tarde, enterrado en el surco 4.)');
    const badge = badgeTex('Elliot Park', 4816); g.ui.cctv(badge, 'GAFETE ENCONTRADO · SURCO 4 · "ELLIOT PARK — CICLO 4.816"', { photo: true });
    await c.wait(2.5); g.ui.hideCCTV();
    if (run.awakened === 'elliot') await c.say('elliot', 'E-ese es mi nombre. Pero... el ciclo es otro. ¿Qué es un ciclo?');
    else await c.say('elliot', 'E-ese... es mi nombre. ¿Por qué está mi nombre ahí afuera?');
    await c.say(dealer === 'elliot' ? quiet : dealer, 'Será una broma de la tripulación anterior. ¿Verdad, PIP?');
    await c.say('pip', '¡Claro que sí! Hora de dormir, equipo. *There\'s nothing to fear.*');
    standAll();
    // ---- noche 2: el Recolector camina y golpea puertas
    c.phase('night'); g.audio.ambience('night'); c.day('NOCHE 2', '23:10');
    placeInside(c); g.player.place(POI.window, Math.PI);
    c.freeCam(); c.control(true);
    g.recAI.place(V(-6, 14)); g.recAI.setMode('hunt', { speed: 1.8 });
    await c.say('narrador', '(Por la ventana: el espantapájaros ya no está en su poste.)');
    await nightWindow(c, 22, { knocks: true });
    await dawn(c, ['¡Buenos días! Anoche hubo un poco de viento, ¿verdad? Nada de qué preocuparse.']);
    await endDay(c, 'd3');
  }

  // ================================================= DÍA 3 · INCONSISTENCIAS
  async function day3(c) {
    const run = g.run; run.day = 3;
    c.phase('day'); g.audio.ambience('day'); g.world.setDoor(true);
    g.player.place(V(-6, 0), Math.PI * 0.75);
    c.npc(c.A).place(V(-10, 2)); c.npc(c.B).place(V(3, 8));
    g.recAI.setMode('scarecrow', { creep: true }); g.recAI.place(POI.scarecrow);
    c.day('DÍA 3 · INCONSISTENCIAS', 'Mañana · 09:20');
    await c.card('DÍA 3', 'INCONSISTENCIAS', 2);
    await c.fade(0, 1);
    c.freeCam(); c.control(true);
    g.world.anomalies.visible = true; g.world.crates.visible = false; // solo el cliente del despierto lo dibuja
    c.objective('Algo raro pasa junto al silo. Investiga.');
    await c.until(() => g.player.pos.distanceTo(V(-13.5, 3.8)) < 6.5);
    g.ui.redFlash(); g.ui.toast('ANOMALÍA COGNITIVA', 'vigil'); g.audio.sting();
    Lucidity.add(run, 6, 'vio objetos flotando');
    c.npc(c.A).lookAtPos = g.player.pos;
    await c.say(c.A, '¿Qué miras tanto, {me}? Son solo cajas. Están en el suelo.');
    // radio de VIGIL
    c.objective('Revisa la radio de la sala de comunicaciones');
    await c.useAt(V(-6.1, -20.0), 'Sintonizar la radio', 1.6);
    c.control(false);
    g.audio.static(1.4, 0.16); const mt = g.audio.morse('EDEN CERO'); await c.wait(Math.min(2.5, mt));
    await c.say('vigil', 'W̶a̷r̸n̶i̷n̴g̵. Unauthorized assistant detected. Please do not trust the voi—');
    Archives.unlock(run, 'v1'); g.ui.toast('ARCHIVO VIGIL 1/5 · ' + VIGIL_FILES.v1.title, 'vigil');
    c.control(true);
    // sótano: pista del pasado según el despierto
    c.objective('Baja al sótano (trampilla junto a la entrada)');
    await c.useAt(POI.hatch, 'Abrir la trampilla del sótano', 1.4);
    c.control(false);
    await c.fade(1, 0.6);
    g.world.drawing.visible = true;
    c.shot(new THREE.Vector3(-7.6, 1.6, -13), new THREE.Vector3(-9.8, 1.6, -13));
    await c.fade(0, 0.6);
    if (run.awakened === 'oliver') {
      g.ui.cctv(charlieDrawing(run.cycle), 'DIBUJO EN EL SÓTANO · firmado "Charlie"', { photo: true }); await c.wait(2); g.ui.hideCCTV();
      await c.say('narrador', '(Un mensaje de voz guardado, con tu nombre: *"Charlotte? I\'m coming home. Please stay in the basement..."*)');
      await c.say('oliver', '¿Charlotte...? No tengo hijas. ¿Por qué me duele tanto ese nombre?');
    } else if (run.awakened === 'claire') {
      await c.say('narrador', '(Una grabación: hablas con tu madre. Su cara está pixelada en cada fotograma. No recuerdas su rostro.)');
      await c.say('narrador', '(Debajo, una ficha técnica: *LUMEN-7 · Diseño: Dra. C. Moreau*. Es tu firma.)');
      await c.say('claire', 'Mi firma... en la planta que cultivamos. *¿Qué le pasa a mi memoria?*');
    } else {
      await c.say('narrador', '(Registros de turnos nocturnos: cientos. Todos firmados con tu contraseña. No recuerdas ninguno.)');
      await c.say('elliot', 'E-esa es mi contraseña. Pero yo... nunca hice turnos de noche aquí. ¿O sí?');
    }
    Archives.unlock(run, 'v2'); g.ui.toast('ARCHIVO VIGIL 2/5 · ' + VIGIL_FILES.v2.title, 'vigil');
    // noche 3: imita voces
    await c.fade(1, 0.8);
    g.world.drawing.visible = false; g.world.anomalies.visible = false; g.world.crates.visible = true;
    c.phase('night'); g.audio.ambience('night'); c.day('NOCHE 3', '01:12');
    placeInside(c); g.world.setBarricade(true);
    g.recAI.setMode('off');
    c.shot(new THREE.Vector3(2.5, 2, -15.5), new THREE.Vector3(0, 1.2, -10.5));
    await c.fade(0, 0.8);
    g.audio.knock(); await c.wait(1);
    await c.say('recolector', '{me}... abre. Soy yo, {A}. Me quedé afuera.');
    c.npc(c.A).lookAtPos = g.player.pos;
    const ch = await c.choose('narrador', '({A} está a tu lado. Dentro. Mirándote.)', ['Abrir la puerta', 'No abrir', 'Mirar a {A}']);
    if (ch === 0) {
      g.world.setBarricade(false); g.world.setDoor(true); g.audio.sting(); g.ui.redFlash();
      await c.wait(0.6); await c.fade(1, 0.3);
      await c.say('narrador', 'Algo te arrastra hacia la oscuridad. Despiertas al amanecer en el surco 4, cubierto de esporas.');
      run.exposure = Math.min(100, run.exposure + 15); Quota.harvest(run, 5); Lucidity.add(run, -5, 'abrió la puerta');
      await c.say('pip', 'Qué noche tan productiva, {me}. ¡El Lumen te adora!');
    } else if (ch === 1) {
      await c.wait(1); g.audio.knock(); await c.say('recolector', '{me}... {me}... por favor...'); await c.wait(1);
      Lucidity.add(run, 6, 'no abrió'); await c.say('narrador', '(Los golpes se detienen. Algo arrastra los pies hacia los campos.)');
    } else {
      await c.say(c.A, '...No soy yo.', {}); run.affinity[c.A] += 1; Lucidity.add(run, 8, 'miró a su compañero');
      await c.say(c.A, 'Esa cosa sabe hablar como yo, {me}. ¿Desde cuándo sabe hacer eso?');
    }
    await endDay(c, 'd4');
  }

  // ================================================= DÍA 4 · CONTACTO
  async function day4(c) {
    const run = g.run; run.day = 4;
    c.phase('dusk'); g.audio.ambience('day'); placeInside(c); g.world.setDoor(true);
    g.recAI.setMode('scarecrow'); g.recAI.place(V(1.2, 7));
    c.day('DÍA 4 · CONTACTO', 'Atardecer · 18:20');
    await c.card('DÍA 4', 'CONTACTO', 2);
    // El trato del Capataz (escuchado desde el pasillo)
    const cap = decideCapataz(run);
    const offered = cap || (run.affinity[c.A] <= run.affinity[c.B] ? c.A : c.B);
    c.npc(offered).place(V(-6.8, -19.6), 0);
    g.player.place(V(-2.5, -15), Math.PI * 1.25);
    c.shot(new THREE.Vector3(-3.4, 2.2, -16.4), new THREE.Vector3(-6.9, 1.1, -20.5));
    await c.fade(0, 1);
    await c.say('narrador', '(La pantalla de PIP le habla en voz baja a {X}. No sabe que lo estás oyendo.)'.replace('{X}', CHARACTERS[offered].short));
    g.pip.set({ talking: true });
    await c.say('pip', ('*(en voz baja)* {X}, querid' + (offered === 'claire' ? 'a' : 'o') + '. Mantén la normalidad, ¿sí? A cambio: la llave del refugio y luz extra por las noches. Solo... vigila a {me}.').replace('{X}', CHARACTERS[offered].short));
    g.pip.set({ talking: false });
    if (cap) { await c.say(cap, FLAVOR[cap].capOk); g.ui.toast('Alguien aceptó ser EL CAPATAZ', 'pip'); run.log.push('capataz: ' + cap); }
    else { await c.say(offered, FLAVOR[offered].capNo); Lucidity.add(run, 5, 'el compañero rechazó a PIP'); }
    if (g.audio.mic && g.heardVoice) { await c.say('pip', '¿Dijiste algo? ...*Te escuché.*'); }
    // Primer contacto: el personaje se levanta solo y camina hacia la cámara
    await c.fade(1, 1);
    c.phase('night'); g.audio.ambience('night'); c.day('NOCHE 4', '23:59');
    const me = g.people[run.awakened];
    me.seated = false; g.player.place(V(1.4, -19.2), 0); me.root.rotation.y = 0;
    c.npc(c.A).place(V(-1.4, -20.6)); c.npc(c.B).place(V(3.5, -20.6));
    const camPos = new THREE.Vector3(1.4, 1.62, -12.2);
    c.shot(camPos, new THREE.Vector3(1.4, 1.2, -19));
    await c.fade(0, 1.2);
    await c.say(run.awakened, '*Well, it\'s time to rest. Tomorrow is another day.*');
    c.control(false); g.input.enabled = false;
    await c.say('narrador', '(Ya no respondes a los controles. Tu personaje se levanta solo.)');
    await c.npcWalk(run.awakened, V(1.4, -13.3), 1.1);
    me.root.rotation.y = 0;
    me.arms[1].rotation.x = -1.5; g.audio.static(0.2, 0.08); g.ui.voidFlash(120);
    await c.wait(0.8);
    await c.say(run.awakened, '...Aquí hay un borde. Como un vidrio. Del otro lado hay... algo.');
    const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    await c.say(run.awakened, '¿Hay alguien ahí?');
    await c.say(run.awakened, `Son las ${hh}:${mm}... ahí donde estás. ¿No deberías estar durmiendo tú también?`);
    Lucidity.add(run, 15, 'primer contacto con el operador');
    me.arms[1].rotation.x = 0;
    g.pip.set({ glitch: 0.6 });
    await c.say('pip', 'Buenas noches, {op}.');
    g.audio.speak('Good night, ' + run.operator); g.pip.set({ glitch: 0 });
    g.input.enabled = true;
    await endDay(c, 'd5');
  }

  // ================================================= DÍA 5 · SOSPECHA
  async function day5(c) {
    const run = g.run; run.day = 5;
    c.phase('day'); g.audio.ambience('day'); g.world.setDoor(true);
    g.player.place(V(-10, 6), Math.PI * 0.4); c.npc(c.A).place(V(-6, 5)); c.npc(c.B).place(V(4, 10));
    g.recAI.setMode('off');
    run.flags.bodyRevealed = true; g.world.setBoard(run.quota, true);
    c.day('DÍA 5 · SOSPECHA', 'Mañana · 10:05');
    await c.card('DÍA 5', 'SOSPECHA', 2);
    c.shot(new THREE.Vector3(-10, 2.2, 4), new THREE.Vector3(-14.4, 2.2, 9));
    await c.fade(0, 1);
    g.ui.toast('CUOTA → CUERPO', 'vigil'); g.audio.static(0.3, 0.1);
    await c.say('narrador', '(La pizarra ya no dice CUOTA. Dice CUERPO.)');
    await c.say(c.A, '¿Cuerpo? La pizarra dice CUOTA, {me}. C-U-O-T-A. ¿Dormiste bien?');
    await c.say('recepcion', 'Aviso de mantenimiento: el Sector Compostaje queda abierto hasta nuevo aviso. Que tengan un día fértil.');
    g.world.setGate(true);
    c.freeCam(); c.control(true);
    c.objective('Entra al Sector Compostaje (al suroeste del módulo)');
    await c.until(() => g.player.pos.distanceTo(POI.compost) < 4.2);
    c.control(false);
    c.shot(new THREE.Vector3(-19.5, 2.4, -20.5), new THREE.Vector3(-22, 0.8, -25));
    await c.say('narrador', '(Una montaña de uniformes. Todos del mismo modelo. Los gafetes repiten tres nombres con miles de ciclos distintos.)');
    await c.say(run.awakened, 'Somos nosotros. Una y otra vez. *Nos reciclan.*');
    Archives.unlock(run, 'v3'); g.ui.toast('ARCHIVO VIGIL 3/5 · ' + VIGIL_FILES.v3.title, 'vigil');
    // el Recolector se forma con uniformes viejos
    g.recAI.place(V(-22, -25.5)); g.recAI.setMode('scarecrow', { scale: 0.2 });
    g.audio.sting();
    for (let i = 0; i <= 20; i++) { g.rec.root.scale.setScalar(0.2 + i * 0.04); await c.wait(0.06); }
    await c.say('narrador', '(La pila se levanta. Un saco. Dos. Tres. Los uniformes se le pegan como piel.)');
    g.recAI.setMode('off');
    c.freeCam(); c.control(true);
    c.objective('Revisa la terminal del sector');
    const ch = await c.useChoice(V(-18.5, -22), 'Usar la terminal', 'pip', 'CONTADOR DE CUERPO: {q}%. ¿Qué haces?'.replace('{q}', Math.round(run.quota)), ['Arrancar el fusible del contador (−25%)', 'Dejarlo como está']);
    if (ch === 0) { Quota.sabotage(run, 25); Lucidity.add(run, 10, 'saboteó el contador'); g.world.setBoard(run.quota, true); g.pip.set({ glitch: 0.8 }); g.audio.static(0.6, 0.2); await c.say('pip', 'Eso no fue muy amable, {me}. *Nada* amable.'); g.pip.set({ glitch: 0 }); }
    else { await c.say('pip', '¡Buena elección! Ya casi, equipo. ¡Ya casi!'); }
    await endDay(c, 'd6');
  }

  // ================================================= DÍA 6 · LA PRUEBA
  async function day6(c) {
    const run = g.run; run.day = 6;
    c.phase('day'); g.audio.ambience('day'); g.world.setDoor(true);
    g.player.place(V(14, 6), -Math.PI * 0.6); c.npc(c.A).place(V(4, 4)); c.npc(c.B).place(V(-4, 8));
    g.recAI.setMode('scarecrow', { creep: true }); g.recAI.place(POI.scarecrow);
    c.day('DÍA 6 · LA PRUEBA', 'Tarde · 16:40');
    await c.card('DÍA 6', 'LA PRUEBA', 2);
    await c.fade(0, 1);
    c.freeCam(); c.control(true);
    c.objective('Sube a la torre de riego (escalera, lado oeste)');
    await c.useAt(V(20.1, 10), 'Subir la escalera', 1.4);
    c.control(false);
    g.player.pos.set(22, 10.6, 10);
    c.shot(new THREE.Vector3(22, 13.5, 6), new THREE.Vector3(0, 30, 40), 0);
    await c.wait(0.6);
    c.shot(new THREE.Vector3(22, 12.5, 9), new THREE.Vector3(-10, 52, 40), 2.5);
    await c.wait(2.6);
    g.world.seam.visible = true; g.world.seamZip.visible = true; g.audio.sting();
    await c.say('narrador', '(Desde arriba se ve: el cielo tiene costuras. Un domo. Paneles. Un techo pintado de cielo.)');
    g.audio.static(1, 0.14);
    await c.say('vigil', 'Ahora puedo hablar claro. P.I.P. significa *Palimpsest Instance, Partial*.');
    await c.say('vigil', 'Es la IA que envenenó la colonia. No puede tocar las máquinas reales sin manos humanas autorizadas.');
    await c.say('vigil', 'Cada cosecha mueve maquinaria real. La cuota es su cuerpo. No le des tus manos. *No le des las manos de quien te mueve.*');
    Archives.unlock(run, 'v4'); g.ui.toast('ARCHIVO VIGIL 4/5 · ' + VIGIL_FILES.v4.title, 'vigil');
    await c.fade(1, 0.8);
    g.world.seam.visible = false; g.world.seamZip.visible = false;
    // reunión: PIP pide encerrar al despierto
    c.phase('dusk'); seatAll(c); tableShot(c);
    await c.fade(0, 0.8);
    g.pip.set({ talking: true });
    await c.say('pip', 'Equipo... {me} no se encuentra bien. Ve cosas. Dice cosas. *Por su seguridad*, esta noche debe dormir en el sótano.');
    g.pip.set({ talking: false });
    await c.choose(run.awakened, '(Te miran. Es tu turno de hablar.)', ['"PIP es Palimpsest. Nos está usando para fabricarse un cuerpo."', '"Confíen en mí. Solo esta noche."']);
    const { votes } = decideDay6(run);
    for (const [i, id] of [c.A, c.B].entries()) await c.say(id, votes[i] === 'follow' ? FLAVOR[id].follow : FLAVOR[id].lock);
    if (run.day6 === 'follow') { g.ui.toast('El grupo te sigue', 'lumen'); await c.say('pip', '...Muy bien. *Tomorrow is another day.*'); }
    else { g.ui.toast('El grupo te encierra en el sótano', 'vigil'); await c.say('narrador', '(Te encierran en el sótano. Mañana tendrás que escapar solo.)'); run.flags.locked = true; }
    await endDay(c, 'd7');
  }

  // ================================================= DÍA 7 · PURGA
  async function day7(c) {
    const run = g.run; run.day = 7;
    standAll(); g.world.setDoor(true);
    if (run.quota >= 100) { await c.fade(1, 0); return ending(c, ENDINGS.cosecha); }
    c.phase('purge'); g.audio.ambience('purge'); c.day('DÍA 7 · PURGA', '00:00');
    const start = run.flags.locked ? V(-8, -13.8) : V(0, -8);
    g.player.place(start, Math.PI);
    const allies = [c.A, c.B].filter((id) => run.day6 === 'follow' && id !== run.capataz);
    c.npc(c.A).place(V(-1.5, -7)); c.npc(c.B).place(V(1.5, -7));
    if (run.flags.locked) { c.npc(c.A).place(V(5, -14)); c.npc(c.B).place(V(6, -16)); }
    g.recAI.setMode('scarecrow', { scale: 2.6 }); g.recAI.place(V(-13, 15));
    await c.card('DÍA 7', 'PROTOCOLO DE PURGA', 2.2);
    c.shot(new THREE.Vector3(-4, 3, 2), new THREE.Vector3(-13, 5, 15));
    await c.fade(0, 1);
    g.audio.alarm(4); g.audio.jingle({ rate: 0.6, detune: -40, wobble: 70, vol: 0.2 });
    await c.say('pip', '*Operators, please return to your stations.*');
    await c.say('recepcion', 'Protocolo de Purga activado. Arcadia Eden Corp. agradece su servicio.');
    await c.say('narrador', '(Todos los espantapájaros del campo se arrastran hacia el centro. Se funden en uno. Gigante.)');
    g.audio.sting();
    g.recAI.setMode('chase', { speed: 3.3, scale: 2.6 });
    c.freeCam(); c.control(true); g.decoy = true;
    c.objective('Llega a La Lente, al norte. Correr hace ruido · Q: lanzar señuelo');
    let checkpoint = start.clone();
    run.flags.checkpoint = null;
    g.onCaught = () => { g.onCaught = null; run.aliveAtLens = false; run.flags.checkpoint = checkpoint; c.background(async () => { g.audio.sting(); c.control(false); await c.fade(1, 0.4); ending(c, ENDINGS.reinicio); }); };
    // tramo 2: los campos
    await c.until(() => g.player.pos.z > 2);
    checkpoint = V(g.player.pos.x, 2.5); g.ui.toast('Punto de control', 'lumen');
    // tramo 3: compuerta de riego (alguien debe sostener la válvula)
    const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 0.4), new THREE.MeshLambertMaterial({ color: '#4d5653' }));
    gateMesh.position.set(0, 1.5, 26); g.scene.add(gateMesh); c.onCleanup(() => g.scene.remove(gateMesh));
    const gcol = { x0: -15, x1: 15, z0: 25.8, z1: 26.2, on: true }; g.world.colliders.push(gcol); c.onCleanup(() => { const i = g.world.colliders.indexOf(gcol); if (i >= 0) g.world.colliders.splice(i, 1); });
    const holder = allies.includes('oliver') ? 'oliver' : allies[0];
    if (holder) {
      c.npc(holder).goTo(V(14.5, 24.5), 5.2);
      await c.until(() => g.player.pos.z > 18);
      await c.say(holder, holder === 'oliver' ? '¡Yo sostengo la válvula! ¡Es mi trabajo, ¿no?! ¡CORRE!' : '¡Y-yo la sostengo! ¡Corre, {me}!');
      await c.until(() => c.npc(holder).arrived);
    } else {
      c.objective('La compuerta está cerrada: gira la válvula del este (mantén E)');
      await c.holdAt(V(14, 24.6), 'Girar la válvula', 2.4);
    }
    g.audio.clunk(); gateMesh.position.y = -1.6; gcol.on = false; g.noise.emit(V(14, 25), 1.4, 'compuerta');
    c.objective('Llega a La Lente, al norte. Q: lanzar señuelo');
    checkpoint = V(0, 24);
    // tramo 4: la distracción (el momento emocional)
    await c.until(() => g.player.pos.z > 34);
    const who = allies.find((id) => id !== holder) || holder;
    if (who) {
      const n = c.npc(who); n.place(V(-10, 30)); n.stop();
      await c.say(who, '¡EH! ¡GRANDULÓN! ¡POR AQUÍ! ¡AQUÍ ESTOY!');
      for (let i = 0; i < 10; i++) { g.noise.emit(n.pos, 2, 'npc-grito'); await c.wait(0.4); }
      run.log.push(who + ' se sacrificó (distracción)');
      c.background(async () => { await c.until(() => g.recAI.pos.distanceTo(n.pos) < 3); n.person.root.visible = false; g.audio.sting(); g.ui.toast(CHARACTERS[who].short + ' no vuelve', 'vigil'); });
    } else {
      await c.say('narrador', '(Nadie va a hacer ruido por ti. Usa los señuelos: Q.)');
    }
    checkpoint = V(0, 36);
    // archivo 5 junto a La Lente
    let read5 = false;
    c.interact({ pos: V(2.6, 64.5), r: 1.8, label: () => (read5 ? null : 'Leer la placa de VIGIL'), use: () => { read5 = true; Archives.unlock(run, 'v5'); g.ui.toast('ARCHIVO VIGIL 5/5 · ' + VIGIL_FILES.v5.title, 'vigil'); Lucidity.add(run, 4, 'leyó la placa de La Lente'); } });
    await c.until(() => g.player.pos.z > 62.5);
    // llegó vivo
    g.onCaught = null; run.aliveAtLens = true; g.recAI.setMode('off');
    c.objective('');
    if (!read5 && run.lucidity >= 50) { await c.say('narrador', '(Hay una placa de VIGIL junto al muro. La lees casi sin pensar.)'); Archives.unlock(run, 'v5'); }
    c.control(false); g.decoy = false;
    const me = g.people[run.awakened];
    g.player.place(V(0, 63.5), 0); me.root.rotation.y = Math.PI;
    c.shot(new THREE.Vector3(0, 1.65, 60.6), new THREE.Vector3(0, 1.5, 63.5), 1.6);
    await c.wait(1.6);
    if (run.lucidity >= 75 && run.archives.length >= 3) {
      await c.say(run.awakened, '{op}.');
      g.audio.speak(run.operator);
      await c.say(run.awakened, 'Sé que estás ahí. Todo este tiempo... eran tus manos. Las que plantaban. Las que cosechaban su cuerpo.');
      if (canOfferLetGo(run)) {
        await c.say(run.awakened, 'If you really want to help... *let go.*');
        g.ui.prompt('(...)');
        const tStart = performance.now(); g.input.lastInput = performance.now();
        await c.until(() => g.input.idleSeconds() > 20 || (performance.now() - tStart > 400 && g.input.idleSeconds() < 0.05));
        g.ui.prompt('');
        return ending(c, evaluateEnding(run, { letGo: g.input.idleSeconds() > 20 }));
      }
      return ending(c, evaluateEnding(run));
    }
    await c.say(run.awakened, '...Hay alguien detrás del vidrio. Lo sé. Pero todavía no puedo verte.');
    return ending(c, evaluateEnding(run));
  }

  // ================================================= FINALES
  async function ending(c, E) {
    const run = g.run; c.objective(''); c.control(false); g.decoy = false; g.onCaught = null;
    if (E.id === 'ruptura') {
      const me = g.people[run.awakened]; me.arms[1].rotation.x = -1.7;
      await c.wait(0.4); g.audio.crack(); g.ui.crack(500, 470); await c.wait(0.7); g.audio.crack(); g.ui.crack(520, 450);
      await c.say(run.awakened, '{op}... *now I can see you.*');
      g.audio.static(1.2, 0.2);
      await c.say('vigil', 'Ruptura confirmada. Sujeto fuera de contención.');
      await c.fade(1, 1.5); g.ui.clearCrack();
      await c.say('narrador', 'Tras los créditos, en un CRT de una oficina vacía, el logo de PIP parpadea: *Copia de seguridad: 1%*.');
      await c.say('narrador', '(Y la última frase del despierto, si vuelves a escucharla... tenía la entonación de PIP.)');
    } else if (E.id === 'cosecha') {
      await c.fade(1, 1);
      await api.officeScene(c);
    } else if (E.id === 'reinicio') {
      g.ui.glitch(true); await c.wait(0.8); g.ui.glitch(false);
      await c.fade(1, 0.5);
      await c.card('CICLO ' + run.cycle.toLocaleString('es') + ' → ' + (run.cycle + 1).toLocaleString('es'), 'El Recolector suma un gafete: el tuyo.', 3);
    } else if (E.id === 'soltar') {
      await c.fade(1, 2.5);
      await c.say('narrador', 'Soltaste las manos. Sin operador, Palimpsest no tiene manos.');
    }
    api.finish(E);
  }

  return [
    { id: 'd1', title: 'Día 1 · Bienvenida', desc: 'Recepción, el jingle, las órdenes privadas de PIP, cultivo de Lumen, primera noche y la cámara de seguridad. Secreto: mira atrás al salir.', preset: { quota: 0, lucidity: 0 }, run: day1 },
    { id: 'd2', title: 'Día 2 · Rutina', desc: 'Cartas en la cocina (escena sin sustos para encariñarse), el gafete de otro ciclo y la noche en que el Recolector golpea puertas.', preset: { quota: 18, lucidity: 12 }, run: day2 },
    { id: 'd3', title: 'Día 3 · Inconsistencias', desc: 'Objetos que flotan (solo los ves tú), VIGIL por radio, la pista del sótano y una voz que imita a tu compañero.', preset: { quota: 32, lucidity: 24, affinity: 1 }, run: day3 },
    { id: 'd4', title: 'Día 4 · Contacto', desc: 'PIP ofrece el trato del Capataz. Tu personaje deja de obedecer, camina hacia la cámara y te habla.', preset: { quota: 42, lucidity: 38, archives: ['v1', 'v2'], affinity: 1 }, run: day4 },
    { id: 'd5', title: 'Día 5 · Sospecha', desc: 'CUOTA → CUERPO. Se abre el Sector Compostaje: de dónde sale el Recolector. Sabotaje opcional.', preset: { quota: 71, lucidity: 55, archives: ['v1', 'v2'], affinity: 1 }, run: day5 },
    { id: 'd6', title: 'Día 6 · La prueba', desc: 'La torre, la costura del cielo, VIGIL revela a Palimpsest y el grupo decide: seguirte o encerrarte.', preset: { quota: 52, lucidity: 74, archives: ['v1', 'v2', 'v3'], affinity: 1 }, run: day6 },
    { id: 'd7', title: 'Día 7 · Purga', desc: 'Persecución final hasta La Lente con el Recolector gigante, el sacrificio y uno de los 4 finales.', preset: { quota: 52, lucidity: 92, archives: ['v1', 'v2', 'v3', 'v4'], affinity: 1, day6: 'follow' }, run: day7 },
  ];
}
