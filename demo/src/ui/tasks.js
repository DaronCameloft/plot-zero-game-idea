// Minijuegos de tareas (vistazo rápido de las mecánicas del día): calibrar agujas y conectar fusibles.
// Cada uno devuelve una promesa que se resuelve al completarse. El bucle principal llama a update(dt).
export class TaskUI {
  constructor(game) {
    this.g = game; this.cur = null;
    this.el = document.createElement('div'); this.el.id = 'task'; this.el.className = 'hidden';
    this.el.innerHTML = '<div class="task-head"><b></b><span></span></div><canvas width="480" height="220"></canvas><div class="task-help"></div>';
    document.body.appendChild(this.el);
    this.cv = this.el.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.cv.addEventListener('mousedown', (e) => { if (this.cur && this.cur.click) { const r = this.cv.getBoundingClientRect(); this.cur.click((e.clientX - r.left) * 480 / r.width, (e.clientY - r.top) * 220 / r.height); } });
  }
  get active() { return !!this.cur; }
  open(title, sub, help, impl) {
    this.el.querySelector('b').textContent = title; this.el.querySelector('span').textContent = sub; this.el.querySelector('.task-help').textContent = help;
    this.el.classList.remove('hidden'); this.g.input.releaseLock();
    return new Promise((res) => { this.cur = { ...impl, done: (v) => { this.cur = null; this.el.classList.add('hidden'); res(v); } }; });
  }
  update(dt) { if (this.cur) { this.cur.tick(dt); this.cur.draw(this.ctx); } }

  /** Calibrar el generador: detener 3 agujas en la franja verde (E / Espacio / clic). */
  dials() {
    const g = this.g; const S = { i: 0, a: 0, dir: 1, zones: [0, 1, 2].map(() => 0.25 + Math.random() * 0.45), flash: 0, ok: [false, false, false] };
    const hit = () => {
      const z = S.zones[S.i];
      if (S.a > z && S.a < z + 0.16) { S.ok[S.i] = true; g.audio.interact(); S.i++; S.flash = 0.25; if (S.i >= 3) setTimeout(() => S.done(true), 350); }
      else { g.audio.spark(); g.noise.emit(g.player.pos, 1.2, 'chispazo'); g.ui.toast('¡Chispazo! (ruido alto)', 'vigil'); S.flash = -0.4; }
    };
    const impl = {
      tick(dt) { if (S.i >= 3) return; S.a += S.dir * dt * (0.55 + S.i * 0.25); if (S.a > 1) { S.a = 1; S.dir = -1; } if (S.a < 0) { S.a = 0; S.dir = 1; } if (g.input.rawPressed('KeyE') || g.input.rawPressed('Space')) hit(); S.flash = Math.max(-1, S.flash - dt * Math.sign(S.flash || 1)); },
      click() { if (S.i < 3) hit(); },
      draw(c) {
        c.fillStyle = '#0b0f0e'; c.fillRect(0, 0, 480, 220);
        for (let k = 0; k < 3; k++) {
          const cx = 90 + k * 150, cy = 150, r = 70;
          c.strokeStyle = '#3a4a46'; c.lineWidth = 14; c.beginPath(); c.arc(cx, cy, r, Math.PI, 2 * Math.PI); c.stroke();
          c.strokeStyle = S.ok[k] ? '#7cf7d4' : '#3fbf6a'; c.beginPath(); c.arc(cx, cy, r, Math.PI + S.zones[k] * Math.PI, Math.PI + (S.zones[k] + 0.16) * Math.PI); c.stroke();
          const a = k < S.i ? S.zones[k] + 0.08 : k === S.i ? S.a : 0;
          c.strokeStyle = k === S.i ? '#ffd84a' : '#e9e4d4'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - Math.cos(a * Math.PI) * (r - 6), cy - Math.sin(a * Math.PI) * (r - 6)); c.stroke();
          c.fillStyle = '#9aa39f'; c.font = '14px monospace'; c.textAlign = 'center'; c.fillText(['TENSIÓN', 'PRESIÓN', 'LUMEN'][k], cx, cy + 22);
        }
        if (S.flash < 0) { c.fillStyle = `rgba(255,59,59,${-S.flash * 0.6})`; c.fillRect(0, 0, 480, 220); }
      },
    };
    const p = this.open('CALIBRAR EL GENERADOR', 'Planta de Energía · tarea de Oliver', 'Pulsa E / Espacio / clic cuando la aguja esté en la franja verde. Fallar hace ruido.', impl);
    S.done = (v) => this.cur && this.cur.done(v);
    return p;
  }

  /** Reparar fusibles: unir cada cable con el borne de su color (clic izquierda → derecha, o teclas 1-4). */
  wires() {
    const g = this.g; const C = ['#c94b4b', '#2a5bd7', '#e8c547', '#4f8a3a'];
    const right = [0, 1, 2, 3].sort(() => Math.random() - 0.5); const S = { sel: null, links: {}, };
    const pick = (side, idx) => {
      if (side === 'L') { S.sel = idx; g.audio.blip(1.2); return; }
      if (S.sel === null) return;
      if (right[idx] === S.sel) { S.links[S.sel] = idx; g.audio.interact(); if (Object.keys(S.links).length === 4) setTimeout(() => S.done(true), 300); }
      else { g.audio.spark(); g.ui.toast('Cable equivocado: la zona parpadea', 'vigil'); }
      S.sel = null;
    };
    const impl = {
      tick() { for (let i = 0; i < 4; i++) if (g.input.rawPressed('Digit' + (i + 1))) pick(S.sel === null ? 'L' : 'R', i); },
      click(x, y) { const i = Math.floor((y - 20) / 48); if (i < 0 || i > 3) return; if (x < 140) pick('L', i); else if (x > 340) pick('R', i); },
      draw(c) {
        c.fillStyle = '#0b0f0e'; c.fillRect(0, 0, 480, 220);
        for (let i = 0; i < 4; i++) {
          c.fillStyle = C[i]; c.fillRect(40, 30 + i * 48, 80, 18); if (S.sel === i) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(36, 26 + i * 48, 88, 26); }
          c.fillStyle = C[right[i]]; c.fillRect(360, 30 + i * 48, 80, 18);
          c.fillStyle = '#9aa39f'; c.font = '12px monospace'; c.fillText(String(i + 1), 24, 44 + i * 48); c.fillText(String(i + 1), 450, 44 + i * 48);
        }
        c.lineWidth = 6; for (const [l, r] of Object.entries(S.links)) { c.strokeStyle = C[l]; c.beginPath(); c.moveTo(120, 39 + l * 48); c.bezierCurveTo(240, 39 + l * 48, 240, 39 + r * 48, 360, 39 + r * 48); c.stroke(); }
      },
    };
    const p = this.open('REPARAR FUSIBLES', 'Centro de Control · tarea de Claire', 'Clic en un cable de la izquierda y luego en el borne del mismo color (o teclas 1-4).', impl);
    S.done = (v) => this.cur && this.cur.done(v);
    return p;
  }
}
