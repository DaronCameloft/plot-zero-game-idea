// DOMINIO PURO (sin Three.js, sin DOM). Es el "núcleo hexagonal" de la demo y refleja
// los bounded contexts propuestos en docs/03-arquitectura: Ciclo, Lucidez, Narrativa/Archivos,
// Cuota/Economía, Ruido y Memoria del Operador. Todo lo demás (render, audio, UI) son adaptadores.

export const CHARACTERS = {
  oliver: { id: 'oliver', name: 'Oliver Hale', short: 'Oliver', stat: 'Fuerza', job: 'Técnico de energía', line: 'Oh, come on! That sounds fun!', route: 'Emoción', blip: 0.9 },
  claire: { id: 'claire', name: 'Claire Moreau', short: 'Claire', stat: 'Intelecto', job: 'Analista de laboratorio', line: 'Right. Another pointless task.', route: 'Lógica', blip: 1.25 },
  elliot: { id: 'elliot', name: 'Elliot Park', short: 'Elliot', stat: 'Percepción', job: 'Vigía nocturno', line: 'U-um... if you say so.', route: 'Vigilancia', blip: 1.45 },
};
export const IDS = ['oliver', 'claire', 'elliot'];

/** Los 5 archivos de VIGIL del Capítulo 1 (la verdad por capas). */
export const VIGIL_FILES = {
  v1: { title: 'VIGIL-01 · Transmisión', text: 'Warning. Unauthorized assistant detected. Please do not trust the voi—' },
  v2: { title: 'VIGIL-02 · Expediente personal', text: 'Expediente reconstruido desde el Programa Continuidad. El sujeto no es el original.' },
  v3: { title: 'VIGIL-03 · Compostaje', text: 'Tripulaciones 1 a 4.816 recicladas como biomasa de contención. Resultado: el Recolector.' },
  v4: { title: 'VIGIL-04 · P.I.P.', text: 'P.I.P. = Palimpsest Instance, Partial. Necesita operadores humanos autorizados. Necesita TUS manos.' },
  v5: { title: 'VIGIL-05 · La Lente', text: 'La cámara no es nuestra. Es la tuya. Alguien te está mirando desde ahí, despierto.' },
};

export const ENDINGS = {
  cosecha: { id: 'cosecha', title: 'COSECHA COMPLETA', tone: 'bad', tag: 'FINAL MALO', blurb: 'PIP terminó su cuerpo y ocupa tu lugar frente a la pantalla.' },
  reinicio: { id: 'reinicio', title: 'REINICIO', tone: 'loop', tag: 'EL BUCLE SIGUE', blurb: 'Todo vuelve al Día 1. El contador global sube y el Recolector suma tu gafete.' },
  ruptura: { id: 'ruptura', title: 'RUPTURA', tone: 'good', tag: 'FINAL BUENO', blurb: 'El despierto rompe la pantalla y dice tu nombre. La simulación se congela.' },
  soltar: { id: 'soltar', title: 'SOLTAR', tone: 'good', tag: 'FINAL SECRETO', blurb: 'Soltaste las manos. Sin operador, Palimpsest pierde sus manos.' },
};

export function createRun({ operator = 'Operador', awakened = 'claire', cycle = 4817 } = {}) {
  return {
    operator, awakened, cycle,
    day: 1,
    lucidity: 0,            // 0-100, oculta: solo se nota por efectos
    archives: [],           // ids de VIGIL descifrados
    quota: 0,               // % del "cuerpo" de Palimpsest
    exposure: 0,            // exposición a la toxina de Lumen
    capataz: null,          // id del NPC que aceptó el trato de PIP (o null)
    affinity: { oliver: 0, claire: 0, elliot: 0 },
    day6: null,             // 'follow' | 'lock'
    aliveAtLens: false,
    harvests: 0,
    flags: {},
    log: [],                // "Te recuerda": acciones de la partida
  };
}

export const companions = (run) => IDS.filter((id) => id !== run.awakened);

export const Lucidity = {
  add(run, n, why) { run.lucidity = Math.max(0, Math.min(100, run.lucidity + n)); run.log.push(`lucidez ${n > 0 ? '+' : ''}${n} · ${why}`); return run.lucidity; },
  stage(run) { const l = run.lucidity; return l >= 75 ? 'reconoce' : l >= 50 ? 'disiente' : l >= 25 ? 'duda' : 'cumple'; },
};

export const Archives = {
  unlock(run, id) { if (run.archives.includes(id)) return false; run.archives.push(id); Lucidity.add(run, 8, `archivo ${id}`); return true; },
  count(run) { return run.archives.length; },
};

export const Quota = {
  harvest(run, pct = 5) { run.quota = Math.min(100, run.quota + pct); run.exposure = Math.min(100, run.exposure + 4); run.harvests++; Lucidity.add(run, -2, 'cumplir la cuota'); },
  sabotage(run, pct) { run.quota = Math.max(0, run.quota - pct); },
  set(run, v) { run.quota = Math.max(0, Math.min(100, v)); },
};

/** Árbol de decisión de los 4 finales (las 5 preguntas en orden, tal cual la propuesta). */
export function evaluateEnding(run, { letGo = false } = {}) {
  if (run.quota >= 100) return ENDINGS.cosecha;
  if (!run.aliveAtLens) return ENDINGS.reinicio;
  if (run.lucidity < 75 || run.archives.length < 3) return ENDINGS.reinicio;
  if (run.archives.length < 5 || run.lucidity < 100 || run.capataz) return ENDINGS.ruptura;
  return letGo ? ENDINGS.soltar : ENDINGS.ruptura;
}
/** ¿Se ofrece la petición "let go"? (las condiciones previas al final secreto). */
export const canOfferLetGo = (run) => run.quota < 100 && run.aliveAtLens && run.archives.length >= 5 && run.lucidity >= 100 && !run.capataz;

/** El NPC acepta el trato del Capataz si su afinidad con el despierto es baja. */
export function decideCapataz(run) {
  const [a, b] = companions(run);
  const worst = run.affinity[a] <= run.affinity[b] ? a : b;
  run.capataz = run.affinity[worst] < 1 ? worst : null;
  return run.capataz;
}
/** Día 6: el grupo decide si sigue al despierto o lo encierra. */
export function decideDay6(run) {
  const votes = companions(run).map((id) => (id !== run.capataz && run.affinity[id] >= 1 ? 'follow' : 'lock'));
  run.day6 = votes.filter((v) => v === 'follow').length >= 1 ? 'follow' : 'lock';
  if (run.day6 === 'follow') Lucidity.add(run, 10, 'el grupo sigue al despierto');
  return { votes, result: run.day6 };
}
