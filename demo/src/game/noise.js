// Contexto "Ruido": cada acción emite ruido; el Recolector va al ruido reciente más fuerte.
export class Noise {
  constructor() { this.events = []; this.t = 0; }
  emit(pos, amount, label = '') { this.events.push({ x: pos.x, z: pos.z, a: amount, t: this.t, label }); if (this.events.length > 80) this.events.shift(); }
  update(dt) { this.t += dt; this.events = this.events.filter((e) => this.t - e.t < 4); }
  clear() { this.events = []; }
  /** Evento más "audible" desde `from` (decae con el tiempo y la distancia). */
  loudest(from, range = 45) {
    let best = null, bs = 0.05;
    for (const e of this.events) {
      const d = Math.hypot(e.x - from.x, e.z - from.z); if (d > range) continue;
      const s = e.a * (1 - (this.t - e.t) / 4) * (1 - d / range);
      if (s > bs) { bs = s; best = e; }
    }
    return best;
  }
  recent(sec = 2) { return this.events.filter((e) => this.t - e.t < sec).map((e) => ({ ...e, age: this.t - e.t })); }
}
