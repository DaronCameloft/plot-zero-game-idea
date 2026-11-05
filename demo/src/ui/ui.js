import { portrait, drawPIP, vigilFrame } from '../art/paint.js';
import { CHARACTERS, Lucidity } from '../game/state.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fmt = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

const SPEAKERS = {
  oliver: { name: 'Oliver', blip: 0.9 },
  claire: { name: 'Claire', blip: 1.25 },
  elliot: { name: 'Elliot', blip: 1.45 },
  pip: { name: 'PIP', cls: 'spk-pip', blip: 1.8, voice: 'square' },
  vigil: { name: 'VIGIL', cls: 'spk-vigil', blip: 0.6, voice: 'sawtooth' },
  recepcion: { name: 'Recepción · altavoces', cls: 'spk-recepcion', blip: 1.1, voice: 'sine' },
  recolector: { name: '???', cls: 'spk-recolector', blip: 0.5, voice: 'sawtooth' },
  narrador: { name: '', cls: 'spk-narrador', blip: 0, portrait: false },
};

export class UI {
  constructor(game) {
    this.g = game;
    this.dlg = null; this.toastBox = $('toasts');
    this.pctx = $('portrait').getContext('2d');
    this.radar = $('radar').getContext('2d');
    this.t = 0;
    $('dialogue').addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') this.advance(); });
  }

  // ------------------------------------------------ diálogo
  get blocking() { return !!this.dlg; }
  say(spk, text, { choices, speed = 42 } = {}) {
    const S = SPEAKERS[spk] || { name: spk };
    const el = $('dialogue');
    el.className = S.cls || '';
    $('speaker').textContent = spk === 'pip' && this.g.run.lucidity >= 50 && Math.random() < 0.3 ? 'P̷I̸P' : S.name;
    const pc = $('portrait');
    if (S.portrait === false) pc.classList.add('none');
    else { pc.classList.remove('none'); const p = spk === 'pip' || spk === 'vigil' ? null : portrait(spk); this.pctx.clearRect(0, 0, 96, 120); if (p) this.pctx.drawImage(p, 0, 0); }
    $('line').innerHTML = ''; $('choices').innerHTML = ''; $('advance').style.visibility = 'hidden';
    return new Promise((resolve) => {
      this.dlg = { spk, S, text, shown: 0, speed, choices, resolve, done: false };
    });
  }
  advance() {
    const d = this.dlg; if (!d) return;
    if (!d.done) { d.shown = d.text.length; return; }
    if (d.choices) return;
    this.close(undefined);
  }
  close(v) { const d = this.dlg; this.dlg = null; $('dialogue').classList.add('hidden'); if (d) d.resolve(v); }
  _renderDialog(dt) {
    const d = this.dlg; if (!d) return;
    $('dialogue').classList.remove('hidden');
    const input = this.g.input;
    if (!d.done) {
      const before = Math.floor(d.shown);
      d.shown = Math.min(d.text.length, d.shown + d.speed * dt);
      const now = Math.floor(d.shown);
      if (now !== before && now % 2 === 0 && d.S.blip && d.text[now] !== ' ') this.g.audio.blip(d.S.blip, d.S.voice);
      $('line').innerHTML = fmt(d.text.slice(0, now));
      if (now >= d.text.length) {
        d.done = true; $('line').innerHTML = fmt(d.text);
        if (d.choices) {
          const box = $('choices');
          d.choices.forEach((c, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}. ${c}`; b.onclick = () => this.close(i); box.appendChild(b); });
        } else $('advance').style.visibility = 'visible';
      }
    }
    if (input.rawPressed('KeyE') || input.rawPressed('Space') || input.rawPressed('Enter')) this.advance();
    if (d.done && d.choices) for (let i = 0; i < d.choices.length; i++) if (input.rawPressed('Digit' + (i + 1))) { this.close(i); break; }
    if (d.spk === 'pip') { drawPIP(this.pctx, 96, 120, this.t, { talking: !d.done, glitch: this.g.run.lucidity >= 50 ? 0.25 : 0 }); }
    if (d.spk === 'vigil') vigilFrame(this.pctx, this.t);
  }

  reset() {
    this.dlg = null; $('dialogue').classList.add('hidden');
    this.objective(''); this.prompt(''); this.hideCard(); this.hideCCTV(); this.clearCrack(); this.glitch(false);
    $('fx-anomaly').className = ''; document.body.classList.remove('hesitate');
  }

  // ------------------------------------------------ HUD
  showHUD(on) { $('hud').classList.toggle('hidden', !on); }
  objective(t) { $('hud-objective').textContent = t || ''; }
  prompt(t, hold) { $('hud-prompt').innerHTML = t ? `${esc(t)}${hold != null ? `<span class="hold"><i style="width:${Math.round(hold * 100)}%"></i></span>` : ''}` : ''; }
  day(label, sub) { $('hud-day').innerHTML = `${esc(label)}<small>${esc(sub || '')}</small>`; }
  toast(text, kind = '') { const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = text; this.toastBox.appendChild(d); setTimeout(() => d.remove(), 4200); }
  card(title, sub = '') { const c = $('card'); c.querySelector('h1').textContent = title; c.querySelector('p').textContent = sub; c.classList.remove('hidden'); }
  hideCard() { $('card').classList.add('hidden'); }
  fade(to, dur = 1) { const f = $('fade'); f.style.transition = `opacity ${dur}s linear`; f.style.opacity = String(to); }

  // ------------------------------------------------ efectos
  voidFlash(ms = 260) {
    const a = $('fx-anomaly'); let code = '';
    for (let i = 0; i < 1400; i++) code += Math.random() < 0.08 ? ' ' : (Math.random() < 0.5 ? Math.floor(Math.random() * 16).toString(16) : '01'[i % 2]);
    a.dataset.code = 'EDEN-0 :: RENDER_BOUNDARY // NULL\n' + code;
    a.className = 'void'; setTimeout(() => (a.className = ''), ms);
  }
  redFlash() { const a = $('fx-anomaly'); a.className = 'red'; setTimeout(() => (a.className = ''), 900); }
  glitch(on) { document.body.classList.toggle('glitch', on); }
  crack(cx = 500, cy = 460) {
    const svg = $('fx-crack'); let d = '';
    for (let i = 0; i < 14; i++) {
      let x = cx, y = cy; const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3; d += `M${x},${y}`;
      const L = 120 + Math.random() * 420;
      for (let s = 0; s < 6; s++) { x += Math.cos(a + (Math.random() - 0.5) * 0.6) * L / 6; y += Math.sin(a + (Math.random() - 0.5) * 0.6) * L / 6; d += ` L${x.toFixed(0)},${y.toFixed(0)}`; }
    }
    for (let r = 30; r < 110; r += 40) { d += ` M${cx + r},${cy}`; for (let k = 1; k <= 12; k++) { const a = (k / 12) * Math.PI * 2; d += ` L${(cx + Math.cos(a) * r * (0.8 + Math.random() * 0.4)).toFixed(0)},${(cy + Math.sin(a) * r * (0.8 + Math.random() * 0.4)).toFixed(0)}`; } }
    svg.innerHTML += `<path d="${d}"/>`;
  }
  clearCrack() { $('fx-crack').innerHTML = ''; }
  lucidityClass(run) { const st = Lucidity.stage(run); document.body.classList.toggle('lucid-2', st === 'disiente'); document.body.classList.toggle('lucid-3', st === 'reconoce'); }

  cctv(sourceCanvas, label, { photo = false } = {}) {
    $('cctv').classList.toggle('photo', photo);
    const c = $('cctv-canvas').getContext('2d');
    c.imageSmoothingEnabled = false; c.drawImage(sourceCanvas, 0, 0, 320, 200);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < 200; y += 2) c.fillRect(0, y, 320, 1);
    if (!photo) { c.fillStyle = '#e33'; c.font = '12px monospace'; c.fillText('● REC', 8, 16); }
    $('cctv-label').textContent = label; $('cctv').classList.remove('hidden');
  }
  hideCCTV() { $('cctv').classList.add('hidden'); }

  screen(html) { const s = $('screen'); s.innerHTML = html; s.classList.remove('hidden'); s.scrollTop = 0; return s; }
  hideScreen() { $('screen').classList.add('hidden'); }

  // ------------------------------------------------ radar de ruido
  drawRadar() {
    const g = this.radar, W = 150, R = 72, { player, noise, recAI, run } = this.g;
    const range = run.awakened === 'elliot' ? 30 : 18; // Elliot: el radar más amplio
    g.clearRect(0, 0, W, W);
    g.strokeStyle = 'rgba(124,247,212,.25)'; g.lineWidth = 1;
    for (const r of [R / 3, (2 * R) / 3, R]) { g.beginPath(); g.arc(W / 2, W / 2, r, 0, Math.PI * 2); g.stroke(); }
    const yaw = player.yaw, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const proj = (x, z) => { const dx = x - player.pos.x, dz = z - player.pos.z; const rx = dx * cs - dz * sn, rz = dx * sn + dz * cs; return [W / 2 + (rx / range) * R, W / 2 + (rz / range) * R]; };
    for (const e of noise.recent(2)) {
      const [x, y] = proj(e.x, e.z); const r = 3 + e.age * 14 * e.a;
      if (Math.hypot(x - W / 2, y - W / 2) > R) continue;
      g.strokeStyle = `rgba(${e.label === 'recolector' ? '255,59,59' : e.label.startsWith('npc') ? '255,216,74' : '233,228,212'},${1 - e.age / 2})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    }
    if (recAI.mode !== 'scarecrow' && recAI.mode !== 'off') {
      const [x, y] = proj(recAI.pos.x, recAI.pos.z);
      if (Math.hypot(x - W / 2, y - W / 2) < R && Math.sin(this.t * 10) > -0.2) { g.fillStyle = '#ff3b3b'; g.fillRect(x - 3, y - 3, 6, 6); }
    }
    g.fillStyle = '#7cf7d4'; g.beginPath(); g.moveTo(W / 2, W / 2 - 6); g.lineTo(W / 2 - 4, W / 2 + 4); g.lineTo(W / 2 + 4, W / 2 + 4); g.fill();
    g.fillStyle = 'rgba(233,228,212,.6)'; g.font = '11px monospace'; g.fillText(`RUIDO · ${range}m`, 38, 146);
  }

  updateHUD() {
    const r = this.g.run;
    const body = r.flags.bodyRevealed;
    const lbl = $('quota-label'); lbl.textContent = body ? 'CUERPO' : 'CUOTA'; lbl.className = body ? 'body' : '';
    $('quota-fill').style.width = r.quota + '%'; $('quota-fill').style.background = body ? 'var(--vigil)' : 'var(--pip)';
    $('quota-val').textContent = Math.round(r.quota) + '%';
    $('exp-fill').style.width = r.exposure + '%';
  }

  update(dt) {
    this.t += dt;
    this._renderDialog(dt);
    if (!$('hud').classList.contains('hidden')) { this.drawRadar(); this.updateHUD(); }
    this.lucidityClass(this.g.run);
  }

  // ------------------------------------------------ panel de equipo (F2)
  debug(on, actions) {
    const el = $('debug'); el.classList.toggle('hidden', !on); if (!on) return;
    const r = this.g.run;
    el.innerHTML = `<h4>PANEL DE EQUIPO · estado oculto</h4>
      ${[['Despierto', CHARACTERS[r.awakened].name], ['Operador', r.operator], ['Día', r.day], ['Lucidez', `${r.lucidity} (${Lucidity.stage(r)})`], ['Archivos VIGIL', `${r.archives.length}/5`], ['Cuota/Cuerpo', r.quota + '%'], ['Exposición', r.exposure + '%'], ['Capataz', r.capataz || '—'], ['Decisión Día 6', r.day6 || '—'], ['Afinidad', Object.entries(r.affinity).map(([k, v]) => k[0].toUpperCase() + ':' + v).join(' ')], ['Ciclo', r.cycle]].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(String(v))}</b></div>`).join('')}
      <div>${actions.map((a, i) => `<button data-i="${i}">${a[0]}</button>`).join('')}</div>
      <pre>${esc(r.log.slice(-14).join('\n'))}</pre>`;
    el.querySelectorAll('button').forEach((b) => (b.onclick = () => { actions[+b.dataset.i][1](); this.debug(true, actions); }));
  }
}
