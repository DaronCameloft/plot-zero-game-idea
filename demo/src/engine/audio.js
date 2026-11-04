// Audio 100% procedural (WebAudio): jingle corporativo, ambiente, pasos, estática de VIGIL, golpes...
// En producción todo esto se sustituye por audio grabado (ver docs/02-diseno). Aquí sirve para fijar el tono.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// Jingle de Arcadia: alegre, en Do mayor, 2 compases. Sus notas al revés esconden un mensaje (easter egg).
export const JINGLE = [
  [72, .25], [76, .25], [79, .25], [84, .5], [81, .25], [79, .25], [76, .5],
  [77, .25], [76, .25], [74, .25], [72, .75],
];

export class Audio {
  constructor() { this.ctx = null; this.amb = null; this.mic = null; this.ttsOn = false; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  get ok() { return !!this.ctx; }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.005, release = 0.08, when = 0, dest, detune = 0, glide } = {}) {
    if (!this.ctx) return;
    const t = this.now + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur, { freq = 1000, q = 1, type = 'bandpass', vol = 0.2, when = 0, attack = 0.005, dest } = {}) {
    if (!this.ctx) return;
    const t = this.now + when;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  /** rate < 1 = lento; detune en cents con "wobble" para la versión desafinada de la Purga. */
  jingle({ rate = 1, detune = 0, wobble = 0, vol = 0.16 } = {}) {
    if (!this.ctx) return 0;
    let t = 0;
    for (const [n, d] of JINGLE) {
      const dd = d / rate;
      const dt = detune + (wobble ? (Math.random() * 2 - 1) * wobble : 0);
      this.tone(NOTE(n), dd * 0.95, { type: 'triangle', vol, when: t, dest: this.music, detune: dt });
      this.tone(NOTE(n + 12), dd * 0.5, { type: 'sine', vol: vol * 0.35, when: t, dest: this.music, detune: dt });
      t += dd;
    }
    return t;
  }

  footstep(intensity = 0.5, surface = 'dirt') {
    const f = surface === 'metal' ? 2200 : 700;
    this.noise(0.09, { freq: f + Math.random() * 200, q: 1.4, vol: 0.05 + intensity * 0.12 });
  }
  knock() { for (let i = 0; i < 3; i++) { this.tone(70, 0.18, { type: 'sine', vol: 0.5, when: i * 0.32, glide: 45 }); this.noise(0.12, { freq: 300, vol: 0.25, when: i * 0.32 }); } }
  clunk() { this.tone(55, 0.5, { type: 'square', vol: 0.18, glide: 30 }); this.noise(0.3, { freq: 200, vol: 0.3 }); }
  interact() { this.tone(660, 0.07, { type: 'square', vol: 0.05 }); this.tone(990, 0.07, { type: 'square', vol: 0.04, when: 0.06 }); }
  harvest() { [72, 76, 79].forEach((n, i) => this.tone(NOTE(n + 12), 0.15, { type: 'sine', vol: 0.08, when: i * 0.07 })); }
  water() { this.noise(0.8, { freq: 3000, q: 0.5, type: 'highpass', vol: 0.08, attack: 0.1 }); }
  blip(pitch = 1, voice = 'square') { this.tone(220 * pitch * (0.95 + Math.random() * 0.1), 0.035, { type: voice, vol: 0.03 }); }
  static(dur = 0.6, vol = 0.18) { this.noise(dur, { freq: 2400, q: 0.3, vol, attack: 0.02 }); for (let i = 0; i < 6; i++) this.noise(0.03, { freq: 5000, vol: vol * 1.4, when: Math.random() * dur }); }
  morse(text = 'SOS') {
    const M = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
    let t = 0; const u = 0.07;
    for (const ch of text.toUpperCase()) {
      if (ch === ' ') { t += u * 4; continue; }
      for (const s of (M[ch] || '')) { const d = s === '.' ? u : u * 3; this.tone(760, d, { type: 'sine', vol: 0.06, when: t }); t += d + u; }
      t += u * 2;
    }
    return t;
  }
  heartbeat() { this.tone(50, 0.12, { vol: 0.5, glide: 35 }); this.tone(48, 0.12, { vol: 0.35, when: 0.22, glide: 34 }); }
  crack() { this.noise(0.5, { freq: 4000, q: 0.7, vol: 0.5 }); this.tone(120, 0.3, { type: 'square', vol: 0.2, glide: 40 }); }
  alarm(times = 4) { for (let i = 0; i < times; i++) { this.tone(880, 0.35, { type: 'sawtooth', vol: 0.05, when: i * 0.8, glide: 440 }); } }
  sting() { this.tone(NOTE(37), 1.6, { type: 'sawtooth', vol: 0.12, glide: NOTE(36) }); this.noise(1.2, { freq: 180, vol: 0.2, attack: 0.02 }); }
  creak() { this.tone(140, 0.7, { type: 'sawtooth', vol: 0.04, glide: 95 }); }

  /** Ambientes en bucle: 'day' | 'night' | 'purge' | 'none'. */
  ambience(kind) {
    if (!this.ctx) return;
    if (this.amb) { const old = this.amb; old.g.gain.linearRampToValueAtTime(0, this.now + 1.2); setTimeout(() => old.nodes.forEach((n) => { try { n.stop(); } catch { } }), 1500); this.amb = null; }
    if (kind === 'none') return;
    const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.master);
    const nodes = [];
    const cfg = { day: [[55, 0.025], [82.4, 0.015]], night: [[41.2, 0.05], [43.6, 0.04]], purge: [[36.7, 0.06], [38.9, 0.06], [73.4, 0.03]] }[kind] || [];
    for (const [f, v] of cfg) {
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'day' ? 300 : 180;
      const og = this.ctx.createGain(); og.gain.value = v;
      o.connect(lp); lp.connect(og); og.connect(g); o.start(); nodes.push(o);
    }
    const w = this.ctx.createBufferSource(); w.buffer = this.noiseBuf; w.loop = true;
    const wf = this.ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = kind === 'day' ? 500 : 260; wf.Q.value = 0.6;
    const wg = this.ctx.createGain(); wg.gain.value = kind === 'day' ? 0.03 : 0.05;
    w.connect(wf); wf.connect(wg); wg.connect(g); w.start(); nodes.push(w);
    g.gain.linearRampToValueAtTime(1, this.now + 2);
    this.amb = { g, nodes };
  }

  // --- Micrófono opcional: solo volumen (como AudioAnalyzer en Roblox) ---
  async enableMic() {
    this.init();
    if (!this.ctx || !navigator.mediaDevices) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = this.ctx.createMediaStreamSource(stream);
      const an = this.ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
      this.mic = { an, buf: new Float32Array(an.fftSize) };
      return true;
    } catch { return false; }
  }
  micLevel() {
    if (!this.mic) return 0;
    this.mic.an.getFloatTimeDomainData(this.mic.buf);
    let s = 0; for (const v of this.mic.buf) s += v * v;
    return Math.min(1, Math.sqrt(s / this.mic.buf.length) * 6);
  }

  // --- "Voz de sistema" (equivale a AudioTextToSpeech solo para el nombre) ---
  speak(text, { pitch = 0.6, rate = 0.85 } = {}) {
    if (!this.ttsOn || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = pitch; u.rate = rate; u.volume = 0.8;
      const en = speechSynthesis.getVoices().find((v) => /en-GB/i.test(v.lang));
      if (en) u.voice = en;
      speechSynthesis.speak(u);
    } catch { /* sin TTS */ }
  }
}
