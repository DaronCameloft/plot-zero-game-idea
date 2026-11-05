// Corrutinas sobre el reloj del juego. Cada escena recibe un contexto "generacional":
// al cambiar de escena se incrementa `gen` y todo lo pendiente de la escena anterior queda muerto.
const NEVER = new Promise(() => {});

export class Flow {
  constructor() { this.waiters = []; this.gen = 0; this.time = 0; }

  reset() { this.waiters = []; this.gen++; }

  update(dt) {
    this.time += dt;
    const list = this.waiters;
    this.waiters = [];
    for (const w of list) {
      if (w.gen !== this.gen) continue;
      if (w.check(this.time)) w.resolve();
      else this.waiters.push(w);
    }
  }

  _add(gen, check) {
    if (gen !== this.gen) return NEVER;
    return new Promise((resolve) => this.waiters.push({ gen, check, resolve }));
  }

  /** Devuelve helpers atados a la generación actual. */
  bind() {
    const gen = this.gen;
    return {
      gen,
      alive: () => gen === this.gen,
      wait: (sec) => { const end = this.time + sec; return this._add(gen, (t) => t >= end); },
      until: (fn) => this._add(gen, () => !!fn()),
      guard: (promise) => promise.then((v) => (gen === this.gen ? v : NEVER)),
    };
  }
}
