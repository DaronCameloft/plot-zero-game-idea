// Pintura procedural (Canvas 2D). Retratos inspirados en el estilo de "Mouthwashing":
// rostros alargados y demacrados, ojeras marcadas, párpados pesados, pupilas pequeñas sin brillo,
// piel con luz lateral plana y paleta apagada; después se baja la resolución y se posteriza (look PS1).
// Personajes, logos y textos son ORIGINALES de PLOT ZERO.

export function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Baja resolución + posterizado + grano: el "acabado" PS1 de todas las texturas pintadas. */
export function crunch(src, w, h, { levels = 22, grain = 10, seed = 7 } = {}) {
  const [c, g] = mk(w, h);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  const img = g.getImageData(0, 0, w, h); const d = img.data; const r = rnd(seed);
  const step = 255 / levels;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * grain;
    for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round((d[i + k] + n) / step) * step));
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ---------------------------------------------------------------- rostro base
function headPath(g, cx, cy) {
  g.beginPath();
  g.moveTo(cx, cy - 58);
  g.bezierCurveTo(cx + 30, cy - 58, cx + 42, cy - 36, cx + 41, cy - 8);
  g.bezierCurveTo(cx + 40, cy + 18, cx + 32, cy + 40, cx + 16, cy + 52);
  g.bezierCurveTo(cx + 8, cy + 58, cx - 8, cy + 58, cx - 16, cy + 52);
  g.bezierCurveTo(cx - 32, cy + 40, cx - 40, cy + 18, cx - 41, cy - 8);
  g.bezierCurveTo(cx - 42, cy - 36, cx - 30, cy - 58, cx, cy - 58);
  g.closePath();
}

function eye(g, x, y, o, side) {
  // cuenca + ojeras (la firma del estilo)
  g.fillStyle = `rgba(70,35,55,${0.22 + o.bags * 0.15})`;
  g.beginPath(); g.ellipse(x, y + 1, 14, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = `rgba(85,40,70,${0.25 + o.bags * 0.3})`;
  g.beginPath(); g.ellipse(x + side * 1, y + 7, 11, 6.5, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = `rgba(50,22,40,${0.35 + o.bags * 0.35})`; g.lineWidth = 1.4;
  g.beginPath(); g.ellipse(x, y + 5, 9.5, 6, 0, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.beginPath(); g.ellipse(x, y + 9, 9, 5, 0, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  // blanco del ojo
  const ew = o.eyeW || 8.5, eh = o.eyeH || 4.4;
  g.save();
  g.beginPath(); g.ellipse(x, y, ew, eh, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#e4d9c2'; g.fillRect(x - 12, y - 8, 24, 16);
  // iris pequeño y pupila: mirada fija, sin vida
  const ix = x + (o.look || 0);
  g.fillStyle = o.iris; g.beginPath(); g.arc(ix, y + 0.6, o.irisR || 3.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0a0808'; g.beginPath(); g.arc(ix, y + 0.6, (o.irisR || 3.4) * 0.5, 0, Math.PI * 2); g.fill();
  if (o.shine) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(ix - 1.6, y - 1.4, 1.4, 1.4); }
  // párpado pesado
  g.fillStyle = shade(o.skin, -0.18);
  g.fillRect(x - 12, y - 8, 24, 8 * (o.lid ?? 0.55) - 1);
  g.restore();
  g.strokeStyle = '#2a1715'; g.lineWidth = 2.2;
  g.beginPath(); g.ellipse(x, y + 0.5, ew + 0.6, eh + 0.4, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.strokeStyle = 'rgba(90,45,40,.45)'; g.lineWidth = 1.2;
  g.beginPath(); g.ellipse(x, y - 2, ew + 1, eh + 2.5, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
}

export function paintFace(g, o) {
  const cx = 96, cy = 104;
  if (!o.noNeck) {
    g.fillStyle = shade(o.skin, -0.32); g.fillRect(cx - 16, cy + 36, 32, 60);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - 16, cy + 40, 32, 10);
    g.fillStyle = shade(o.skin, -0.12);
    g.beginPath(); g.ellipse(cx - 41, cy + 2, 6, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = shade(o.skin, -0.35);
    g.beginPath(); g.ellipse(cx + 41, cy + 2, 6, 11, 0, 0, Math.PI * 2); g.fill();
  }
  // cabeza
  headPath(g, cx, cy);
  const grad = g.createLinearGradient(cx - 42, 0, cx + 42, 0);
  grad.addColorStop(0, shade(o.skin, 0.06)); grad.addColorStop(0.42, o.skin); grad.addColorStop(0.78, shade(o.skin, -0.22)); grad.addColorStop(1, shade(o.skin, -0.42));
  g.fillStyle = grad; g.fill();
  g.save(); headPath(g, cx, cy); g.clip();
  // mejillas hundidas y mandíbula
  g.fillStyle = 'rgba(70,30,30,.16)';
  g.beginPath(); g.ellipse(cx - 25, cy + 22, 10, 15, 0.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx + 25, cy + 22, 10, 15, -0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(40,20,20,.18)'; g.fillRect(cx - 50, cy + 44, 100, 20);
  // frente: líneas de edad
  if (o.age) { g.strokeStyle = `rgba(90,50,40,${0.12 * o.age})`; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - 18, cy - 34 + i * 5); g.quadraticCurveTo(cx, cy - 37 + i * 5, cx + 18, cy - 34 + i * 5); g.stroke(); } }
  g.restore();
  // ojos
  eye(g, cx - 17, cy - 4, o, -1);
  eye(g, cx + 17, cy - 4, o, 1);
  // cejas
  g.strokeStyle = o.brow || '#2b1d18'; g.lineWidth = 3.2; g.lineCap = 'round';
  const bt = o.browTilt || 0, by = cy - 16 - (o.browUp || 0);
  g.beginPath(); g.moveTo(cx - 28, by + 1); g.quadraticCurveTo(cx - 18, by - 3 + bt * 0.3, cx - 8, by - bt); g.stroke();
  g.beginPath(); g.moveTo(cx + 28, by + 1); g.quadraticCurveTo(cx + 18, by - 3 + bt * 0.3, cx + 8, by - bt); g.stroke();
  // nariz
  g.strokeStyle = 'rgba(95,50,40,.42)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx + 3, cy - 2); g.quadraticCurveTo(cx + 6, cy + 12, cx + 5, cy + 21); g.stroke();
  g.fillStyle = shade(o.skin, 0.08); g.beginPath(); g.ellipse(cx - 1, cy + 21, 6, 3.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(60,25,20,.7)'; g.fillRect(cx - 5, cy + 23, 3, 2); g.fillRect(cx + 3, cy + 23, 3, 2);
  // surcos nasogenianos
  g.strokeStyle = 'rgba(90,45,40,.22)'; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(cx - 9, cy + 24); g.quadraticCurveTo(cx - 15, cy + 31, cx - 14, cy + 39); g.stroke();
  g.beginPath(); g.moveTo(cx + 9, cy + 24); g.quadraticCurveTo(cx + 15, cy + 31, cx + 14, cy + 39); g.stroke();
  // boca
  const my = cy + 37;
  g.fillStyle = shade(o.skin, -0.28);
  g.beginPath(); g.ellipse(cx, my + 3, 10, 3, 0, 0, Math.PI); g.fill();
  g.strokeStyle = '#3a1c18'; g.lineWidth = 2;
  g.beginPath();
  if (o.mouth === 'smile') { g.moveTo(cx - 13, my - 3); g.quadraticCurveTo(cx, my + 4, cx + 13, my - 3); }
  else if (o.mouth === 'frown') { g.moveTo(cx - 11, my + 2); g.quadraticCurveTo(cx, my - 2, cx + 11, my + 2); }
  else if (o.mouth === 'tremble') { g.moveTo(cx - 9, my); g.lineTo(cx - 4, my - 1); g.lineTo(cx, my + 1); g.lineTo(cx + 4, my - 1); g.lineTo(cx + 9, my); }
  else { g.moveTo(cx - 11, my + 1); g.lineTo(cx + 11, my + 1); }
  g.stroke();
}

function background(g, a, b) {
  const gr = g.createRadialGradient(96, 90, 10, 96, 120, 170);
  gr.addColorStop(0, a); gr.addColorStop(1, b);
  g.fillStyle = gr; g.fillRect(0, 0, 192, 240);
}

function shoulders(g, color, { wide = 0, collar } = {}) {
  g.fillStyle = color;
  g.beginPath(); g.moveTo(-10, 240); g.lineTo(12 - wide, 196); g.quadraticCurveTo(50, 168, 96, 172); g.quadraticCurveTo(142, 168, 180 + wide, 196); g.lineTo(202, 240); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(120, 240); g.lineTo(140, 180); g.quadraticCurveTo(170, 185, 190 + wide, 200); g.lineTo(202, 240); g.fill();
  if (collar) { g.fillStyle = collar; g.beginPath(); g.moveTo(66, 176); g.lineTo(96, 214); g.lineTo(126, 176); g.lineTo(112, 172); g.lineTo(96, 196); g.lineTo(80, 172); g.closePath(); g.fill(); }
}

export function arcadiaLogo(g, x, y, r) {
  g.fillStyle = '#2f8f7a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e9e4d4';
  g.beginPath(); g.ellipse(x, y, r * 0.35, r * 0.7, 0.6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2f8f7a'; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.moveTo(x - r * 0.4, y + r * 0.5); g.lineTo(x + r * 0.35, y - r * 0.45); g.stroke();
}

// ---------------------------------------------------------------- personajes
// ---------------------------------------------------------------- rostro "suave" (v0.1.0: Claire y Oliver)
// Ojos almendrados con la línea de pestañas pintada (lenguaje visual del género), iris grandes con brillo,
// rubor, labios con forma; sin ojeras. Elliot conserva el rostro demacrado (paintFace).
function softHeadPath(g, cx, cy, jaw) {
  const sq = jaw === 'square';
  g.beginPath();
  g.moveTo(cx, cy - 58);
  g.bezierCurveTo(cx + 31, cy - 58, cx + 42, cy - 36, cx + 41, cy - 6);
  if (sq) { g.bezierCurveTo(cx + 41, cy + 22, cx + 36, cy + 42, cx + 22, cy + 52); g.bezierCurveTo(cx + 12, cy + 58, cx - 12, cy + 58, cx - 22, cy + 52); g.bezierCurveTo(cx - 36, cy + 42, cx - 41, cy + 22, cx - 41, cy - 6); }
  else { g.bezierCurveTo(cx + 40, cy + 20, cx + 30, cy + 40, cx + 13, cy + 53); g.bezierCurveTo(cx + 6, cy + 58, cx - 6, cy + 58, cx - 13, cy + 53); g.bezierCurveTo(cx - 30, cy + 40, cx - 40, cy + 20, cx - 41, cy - 6); }
  g.bezierCurveTo(cx - 42, cy - 36, cx - 31, cy - 58, cx, cy - 58);
  g.closePath();
}
function almondEye(g, x, y, o, side) {
  const w = o.eyeW || 10.5, h = o.eyeH || 5.8;
  const ix = x - side * w, ox = x + side * w;
  const path = () => { g.beginPath(); g.moveTo(ix, y + 1); g.quadraticCurveTo(x - side * 1, y - h * 1.55, ox, y - 0.8); g.quadraticCurveTo(x + side * 1, y + h * 1.15, ix, y + 1); g.closePath(); };
  // sombra suave de la cuenca (no ojeras)
  g.fillStyle = 'rgba(150,90,80,.16)'; g.beginPath(); g.ellipse(x, y - 3, w + 3, h + 3, 0, Math.PI, Math.PI * 2); g.fill();
  g.save(); path(); g.clip();
  g.fillStyle = '#f2ebe0'; g.fillRect(x - 14, y - 10, 28, 20);
  const cx = x + (o.look || 0), r = o.irisR || 5.2;
  const ir = g.createRadialGradient(cx, y, 1, cx, y, r);
  ir.addColorStop(0, shade(o.iris, 0.35)); ir.addColorStop(0.7, o.iris); ir.addColorStop(1, shade(o.iris, -0.55));
  g.fillStyle = ir; g.beginPath(); g.arc(cx, y + 0.4, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0b0807'; g.beginPath(); g.arc(cx, y + 0.4, r * 0.42, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(cx - r * 0.38, y - r * 0.35, r * 0.24, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(cx + r * 0.35, y + r * 0.35, r * 0.12, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(60,30,25,.28)'; g.fillRect(x - 14, y - 10, 28, h * 0.55 + 4);
  g.restore();
  // línea de pestañas superior gruesa, con "ala" en el extremo exterior
  g.strokeStyle = '#1b1210'; g.lineWidth = o.lash || 3; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(ix + side * 0.5, y + 0.6); g.quadraticCurveTo(x - side * 1, y - h * 1.55, ox, y - 0.8); g.lineTo(ox + side * 3, y - 3.2); g.stroke();
  if (o.lashes) {
    g.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) { const t = 0.45 + i * 0.15; const px = ix + (ox - ix) * t, py = y - h * 1.1 * Math.sin(Math.PI * t) + 0.5; g.beginPath(); g.moveTo(px, py); g.lineTo(px + side * 3, py - 3.2); g.stroke(); }
  }
  // línea inferior fina
  g.strokeStyle = 'rgba(70,35,30,.55)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - side * w * 0.2, y + h * 0.95); g.quadraticCurveTo(x + side * w * 0.6, y + h * 0.75, ox, y - 0.5); g.stroke();
  // pliegue del párpado
  g.strokeStyle = 'rgba(120,65,55,.5)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(ix + side * 2, y - h * 0.9); g.quadraticCurveTo(x, y - h * 2.1, ox + side * 1, y - h * 0.9); g.stroke();
}
export function paintFaceSoft(g, o) {
  const cx = 96, cy = 104;
  if (!o.noNeck) {
    g.fillStyle = shade(o.skin, -0.25); g.fillRect(cx - (o.jaw === 'square' ? 19 : 14), cy + 34, o.jaw === 'square' ? 38 : 28, 62);
    g.fillStyle = 'rgba(60,25,20,.22)'; g.fillRect(cx - 19, cy + 40, 38, 9);
    g.fillStyle = shade(o.skin, -0.08); g.beginPath(); g.ellipse(cx - 40, cy + 2, 6, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = shade(o.skin, -0.28); g.beginPath(); g.ellipse(cx + 40, cy + 2, 6, 10, 0, 0, Math.PI * 2); g.fill();
  }
  softHeadPath(g, cx, cy, o.jaw);
  const grad = g.createLinearGradient(cx - 42, 0, cx + 42, 0);
  grad.addColorStop(0, shade(o.skin, 0.1)); grad.addColorStop(0.45, o.skin); grad.addColorStop(0.85, shade(o.skin, -0.14)); grad.addColorStop(1, shade(o.skin, -0.3));
  g.fillStyle = grad; g.fill();
  g.save(); softHeadPath(g, cx, cy, o.jaw); g.clip();
  if (o.blush) for (const s of [-1, 1]) { const bl = g.createRadialGradient(cx + s * 23, cy + 15, 1, cx + s * 23, cy + 15, 15); bl.addColorStop(0, `rgba(225,105,105,${o.blush})`); bl.addColorStop(1, 'rgba(225,105,105,0)'); g.fillStyle = bl; g.fillRect(cx - 50, cy - 10, 100, 50); }
  g.fillStyle = 'rgba(90,40,30,.12)'; g.fillRect(cx - 50, cy + 47, 100, 14);
  if (o.freckles) { const r = rnd(11); for (let i = 0; i < o.freckles; i++) { g.fillStyle = `rgba(150,80,55,${0.25 + r() * 0.2})`; g.fillRect(cx - 28 + r() * 56, cy + 4 + r() * 14, 1.6, 1.6); } }
  g.restore();
  almondEye(g, cx - 17, cy - 3, o, -1);
  almondEye(g, cx + 17, cy - 3, o, 1);
  // cejas: finas y arqueadas (Claire) o pobladas (Oliver)
  g.strokeStyle = o.brow; g.lineWidth = o.browW || 2.4; g.lineCap = 'round';
  const by = cy - 17 - (o.browUp || 0);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 8, by + 2); g.quadraticCurveTo(cx + s * 19, by - 4, cx + s * 29, by + 2.5); g.stroke(); }
  // nariz pequeña
  g.strokeStyle = 'rgba(140,70,55,.38)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(cx + 3, cy + 2); g.quadraticCurveTo(cx + 5.5, cy + 12, cx + 4.5, cy + 18); g.stroke();
  g.fillStyle = shade(o.skin, 0.16); g.beginPath(); g.ellipse(cx - 0.5, cy + 18.5, o.nose || 4.5, 2.6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(110,50,40,.55)'; g.beginPath(); g.ellipse(cx - 3.5, cy + 21, 1.6, 1, 0, 0, Math.PI * 2); g.ellipse(cx + 3.5, cy + 21, 1.6, 1, 0, 0, Math.PI * 2); g.fill();
  // labios
  const my = cy + 33, mw = o.mouthW || 11, sm = o.smile || 0;
  g.fillStyle = o.lips;
  g.beginPath(); g.moveTo(cx - mw, my - sm * 2); g.quadraticCurveTo(cx - mw * 0.5, my - 4.2, cx, my - 2.6); g.quadraticCurveTo(cx + mw * 0.5, my - 4.2, cx + mw, my - sm * 2); g.quadraticCurveTo(cx, my + 0.5, cx - mw, my - sm * 2); g.fill();
  g.fillStyle = shade(o.lips, 0.15);
  g.beginPath(); g.moveTo(cx - mw + 1, my - sm * 2 + 0.4); g.quadraticCurveTo(cx, my + 7.5 + sm, cx + mw - 1, my - sm * 2 + 0.4); g.quadraticCurveTo(cx, my + 1.5, cx - mw + 1, my - sm * 2 + 0.4); g.fill();
  if (o.teeth) { g.fillStyle = '#f2ece2'; g.beginPath(); g.moveTo(cx - mw + 3, my - sm * 1.6); g.quadraticCurveTo(cx, my + 3.2, cx + mw - 3, my - sm * 1.6); g.quadraticCurveTo(cx, my + 0.4, cx - mw + 3, my - sm * 1.6); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - 2, my + 3.4 + sm * 0.5, 3, 1, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(90,30,30,.7)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(cx - mw, my - sm * 2); g.quadraticCurveTo(cx, my + 1 + sm * 1.4, cx + mw, my - sm * 2); g.stroke();
  if (sm > 0.4) { g.strokeStyle = 'rgba(120,60,50,.3)'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * (mw + 1), my - sm * 2 - 1); g.quadraticCurveTo(cx + s * (mw + 4), my - 2, cx + s * (mw + 2), my + 3); g.stroke(); } }
}

const PAINTERS = {
  oliver(g, face) {
    const F = { skin: '#e2b08b', jaw: 'square', iris: '#6b4527', eyeW: 9.6, eyeH: 5.2, irisR: 4.6, lash: 2, brow: '#8e4220', browW: 3.8, browUp: 2, nose: 5.5, lips: '#b8705c', smile: 0.9, mouthW: 12.5, teeth: true, blush: 0.14, freckles: 34, noNeck: face };
    const beard = () => {
      g.save(); softHeadPath(g, 96, 104, 'square'); g.clip();
      const r = rnd(5);
      g.fillStyle = 'rgba(160,78,38,.62)';
      g.beginPath(); g.moveTo(56, 116); g.quadraticCurveTo(60, 154, 96, 164); g.quadraticCurveTo(132, 154, 136, 116); g.lineTo(130, 120); g.quadraticCurveTo(124, 132, 110, 133); g.quadraticCurveTo(96, 128, 82, 133); g.quadraticCurveTo(68, 132, 62, 120); g.closePath(); g.fill();
      for (let i = 0; i < 420; i++) { const x = 56 + r() * 80, y = 122 + r() * 42; if (Math.abs(x - 96) < 20 && y < 134) continue; g.fillStyle = `rgba(${110 + r() * 60},${50 + r() * 25},20,${0.3 + r() * 0.3})`; g.fillRect(x, y, 1.2, 1.8); }
      g.restore();
      g.fillStyle = 'rgba(150,72,34,.85)'; g.beginPath(); g.moveTo(82, 131); g.quadraticCurveTo(96, 124, 110, 131); g.quadraticCurveTo(96, 129, 82, 131); g.fill();
      // los labios por encima de la barba
      g.fillStyle = '#b8705c'; g.beginPath(); g.ellipse(96, 138.5, 9, 2.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2ece2'; g.beginPath(); g.ellipse(96, 137.6, 8, 1.6, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(90,30,30,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(84, 135); g.quadraticCurveTo(96, 141, 108, 135); g.stroke();
    };
    if (face) { paintFaceSoft(g, F); beard(); return; }
    background(g, '#3e2c20', '#0e0907');
    shoulders(g, '#2f6066', { wide: 10, collar: '#244a50' });
    g.fillStyle = '#2a4442'; g.fillRect(26, 194, 50, 52); g.fillRect(116, 194, 54, 52);
    g.fillStyle = '#d9692a'; g.fillRect(36, 204, 14, 10); g.fillStyle = '#e8c547'; g.fillRect(134, 210, 12, 12); g.fillStyle = '#c94b4b'; g.fillRect(152, 202, 8, 8);
    arcadiaLogo(g, 58, 226, 7);
    paintFaceSoft(g, F); beard();
    // patillas pelirrojas
    g.fillStyle = '#9c4a22'; g.fillRect(55, 82, 6, 26); g.fillRect(131, 82, 6, 26);
    // gorro naranja tejido con parche
    g.fillStyle = '#de6c2a'; g.beginPath(); g.moveTo(52, 80); g.bezierCurveTo(48, 28, 144, 28, 140, 80); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,45,15,.55)'; g.lineWidth = 2; for (let x = 58; x < 138; x += 6) { g.beginPath(); g.moveTo(x, 78); g.lineTo(x + (x - 96) * 0.12, 42); g.stroke(); }
    g.fillStyle = '#c85b22'; g.fillRect(49, 70, 94, 15);
    g.strokeStyle = 'rgba(90,30,10,.55)'; for (let x = 51; x < 143; x += 4) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 85); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(49, 83, 94, 3);
    arcadiaLogo(g, 120, 77, 5);
  },
  claire(g, face) {
    const F = { skin: '#f1cfb6', iris: '#7d5a30', eyeW: 11, eyeH: 6.2, irisR: 5.6, lash: 3.2, lashes: true, brow: '#4a2a1d', browW: 2, browUp: 1, nose: 4, lips: '#cf6f6c', smile: 0.25, mouthW: 10, blush: 0.32, freckles: 12, noNeck: face };
    if (face) { paintFaceSoft(g, F); return; }
    const HAIR = '#5b3324', HL = '#7e4a33';
    background(g, '#2b3542', '#090b0f');
    // masa de pelo por detrás
    g.fillStyle = shade(HAIR, -0.25); g.beginPath(); g.ellipse(96, 112, 54, 66, 0, 0, Math.PI * 2); g.fill();
    // bata blanca + mono teal + gafete
    shoulders(g, '#e7e3d8', { collar: '#2f6066' });
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(70, 182); g.lineTo(84, 240); g.moveTo(122, 182); g.lineTo(108, 240); g.stroke();
    g.fillStyle = '#2f6066'; g.fillRect(85, 198, 22, 42);
    g.fillStyle = '#fafafa'; g.fillRect(126, 214, 22, 14); g.fillStyle = '#2f6066'; g.fillRect(126, 214, 22, 4); g.fillStyle = '#888'; g.fillRect(128, 220, 6, 6);
    g.fillStyle = '#2a5bd7'; g.fillRect(60, 208, 2, 14);
    paintFaceSoft(g, F);
    // flequillo de lado y mechones que enmarcan la cara
    g.fillStyle = HAIR;
    g.beginPath(); g.moveTo(50, 108); g.bezierCurveTo(36, 18, 156, 14, 144, 104); g.lineTo(138, 96); g.bezierCurveTo(136, 72, 124, 60, 106, 56);
    g.bezierCurveTo(92, 72, 74, 84, 58, 88); g.lineTo(54, 104); g.closePath(); g.fill();
    g.fillStyle = HL; g.beginPath(); g.ellipse(80, 44, 18, 5, -0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = HAIR;
    g.strokeStyle = HL; g.lineWidth = 2; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(104 - i * 3, 50 + i); g.quadraticCurveTo(84 - i * 4, 66 + i * 2, 60 - i, 84 + i); g.stroke(); }
    g.fillStyle = HAIR;
    g.beginPath(); g.moveTo(56, 88); g.quadraticCurveTo(48, 128, 58, 156); g.quadraticCurveTo(58, 128, 62, 96); g.fill();
    g.beginPath(); g.moveTo(138, 84); g.quadraticCurveTo(146, 124, 136, 150); g.quadraticCurveTo(138, 120, 132, 92); g.fill();
    // coleta baja sobre el hombro
    g.fillStyle = HAIR; g.beginPath(); g.moveTo(132, 140); g.bezierCurveTo(158, 156, 162, 200, 146, 236); g.bezierCurveTo(150, 200, 140, 170, 124, 156); g.fill();
    g.strokeStyle = HL; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(134 + i * 3, 150); g.quadraticCurveTo(152 + i, 186, 146 + i * 2, 228); g.stroke(); }
    g.fillStyle = '#2f6066'; g.fillRect(130, 144, 10, 7);
    // gafas redondeadas: una luna rota
    g.strokeStyle = '#2a1d17'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(79, 101, 14, 11.5, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(113, 101, 14, 11.5, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(93, 99); g.quadraticCurveTo(96, 96, 99, 99); g.moveTo(65, 99); g.lineTo(56, 97); g.moveTo(127, 99); g.lineTo(136, 97); g.stroke();
    g.fillStyle = 'rgba(210,230,245,.10)'; g.beginPath(); g.ellipse(79, 101, 13, 10.5, 0, 0, Math.PI * 2); g.ellipse(113, 101, 13, 10.5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 0.8;
    for (const [dx, dy] of [[-12, 7], [7, 9], [9, -6], [-9, -7], [-3, 10], [10, 2]]) { g.beginPath(); g.moveTo(117, 98); g.lineTo(117 + dx, 98 + dy); g.stroke(); }
  },
  elliot(g, face) {
    const F = { skin: '#8c5c42', iris: '#2c1d15', bags: 0.7, mouth: 'tremble', browUp: 4, browTilt: 5, brow: '#120c0a', lid: 0.25, eyeW: 9, eyeH: 5.2, shine: true, look: -1, noNeck: face };
    if (face) { paintFace(g, F); return; }
    background(g, '#1d2a22', '#050806');
    shoulders(g, '#5a5d45', { wide: 14, collar: '#2f5f66' });
    // cuello del abrigo levantado
    g.fillStyle = '#4b4e39'; g.beginPath(); g.moveTo(52, 178); g.lineTo(70, 150); g.lineTo(80, 186); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(140, 178); g.lineTo(122, 150); g.lineTo(112, 186); g.closePath(); g.fill();
    // correa + linterna en el pecho
    g.strokeStyle = '#2a2a24'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 190); g.lineTo(150, 240); g.stroke();
    g.fillStyle = '#333'; g.fillRect(56, 208, 30, 16); g.fillStyle = '#fff2b0'; g.beginPath(); g.arc(88, 216, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,240,170,.25)'; g.beginPath(); g.arc(88, 216, 16, 0, Math.PI * 2); g.fill();
    // auriculares en el cuello
    g.fillStyle = '#26262a'; g.beginPath(); g.ellipse(70, 160, 9, 12, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(122, 160, 9, 12, 0, 0, Math.PI * 2); g.fill();
    paintFace(g, F);
    g.strokeStyle = '#1e1e22'; g.lineWidth = 5; g.beginPath(); g.moveTo(70, 166); g.quadraticCurveTo(96, 182, 122, 166); g.stroke();
    // pelo negro revuelto con flequillo
    g.fillStyle = '#15100e';
    g.beginPath(); g.moveTo(50, 92); g.bezierCurveTo(40, 30, 150, 26, 142, 92); g.lineTo(136, 70); g.lineTo(126, 86); g.lineTo(120, 66); g.lineTo(108, 84); g.lineTo(100, 64); g.lineTo(90, 86); g.lineTo(80, 66); g.lineTo(70, 86); g.lineTo(60, 70); g.closePath(); g.fill();
    g.strokeStyle = '#2a201b'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(60 + i * 9, 44); g.lineTo(58 + i * 10, 80); g.stroke(); }
  },
  recolector(g) {
    // Tres medios rostros superpuestos que "saltan" como un archivo corrupto; ojos tapados por estática.
    background(g, '#1a1214', '#030202');
    const r = rnd(21);
    g.fillStyle = '#3c3a30'; g.beginPath(); g.moveTo(-10, 240); g.lineTo(20, 176); g.quadraticCurveTo(96, 150, 172, 176); g.lineTo(202, 240); g.fill();
    for (const [x, y, w, h, c] of [[28, 196, 40, 44, '#2f6066'], [124, 190, 46, 50, '#5a5d45'], [80, 206, 30, 34, '#e7e3d8'], [60, 186, 22, 18, '#de6c2a']]) { g.fillStyle = c; g.fillRect(x, y, w, h); }
    g.strokeStyle = '#7a6a3a'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(20 + i * 36, 182 + (i % 2) * 8); g.lineTo(34 + i * 36, 238); g.stroke(); }
    const faces = ['oliver', 'claire', 'elliot'].map((id) => faceTexture(id, 96, 136));
    for (let k = 0; k < 3; k++) {
      const ox = [-12, 10, 0][k], oy = [4, -2, 8][k];
      for (let y = 0; y < 136; y += 6) {
        const sh = (r() - 0.5) * (r() < 0.3 ? 30 : 6);
        g.globalAlpha = k === 2 ? 0.85 : 0.5;
        g.drawImage(faces[k], 0, y, 96, 6, 48 + ox + sh, 36 + oy + y, 96, 6);
      }
    }
    g.globalAlpha = 1;
    // banda de estática sobre los ojos (es ciego)
    for (let i = 0; i < 700; i++) { const v = 80 + r() * 175 | 0; g.fillStyle = `rgba(${v},${v},${v},${0.55 + r() * 0.4})`; g.fillRect(40 + r() * 112, 80 + r() * 24, 2, 2); }
    // ranura de la boca
    g.fillStyle = '#080404'; g.fillRect(70, 146, 54, 5);
    // costuras de manguera
    g.strokeStyle = '#6b8a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(48, 60); g.quadraticCurveTo(96, 40, 146, 66); g.stroke();
    // bloques de píxeles rotos
    for (let i = 0; i < 14; i++) { g.fillStyle = ['#ff3b3b', '#7cf7d4', '#ffd84a', '#000'][i % 4]; g.globalAlpha = 0.5; g.fillRect(40 + r() * 112, 40 + r() * 130, 4 + r() * 14, 2 + r() * 4); }
    g.globalAlpha = 1;
  },
  palimpsest(g) {
    // Forma de Cosecha: cabeza del animatrónico de PIP, carcasa rota con un CRT dentro, ojos-cámara.
    background(g, '#1a0b0e', '#020102');
    g.strokeStyle = '#3a3532'; g.lineWidth = 8; g.beginPath(); g.moveTo(96, 240); g.quadraticCurveTo(90, 200, 96, 176); g.stroke();
    g.strokeStyle = '#6b8a5a'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 240); g.quadraticCurveTo(86, 206, 92, 180); g.moveTo(112, 240); g.quadraticCurveTo(104, 206, 100, 180); g.stroke();
    // cabeza-semilla de plástico crema
    const sh = g.createLinearGradient(40, 0, 160, 0); sh.addColorStop(0, '#f3e9cf'); sh.addColorStop(0.55, '#d9ccab'); sh.addColorStop(1, '#8a7c62');
    g.fillStyle = sh; g.beginPath(); g.moveTo(96, 22); g.bezierCurveTo(168, 50, 168, 170, 96, 182); g.bezierCurveTo(24, 170, 24, 50, 96, 22); g.fill();
    // hoja y sombrerito ladeado
    g.fillStyle = '#4f8a3a'; g.beginPath(); g.ellipse(120, 20, 22, 9, -0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1d2a2a'; g.fillRect(60, 28, 34, 6); g.fillRect(66, 8, 22, 22); g.fillStyle = '#c94b4b'; g.fillRect(66, 24, 22, 4);
    // grieta: dentro, un CRT con la cara de dibujos glitcheando
    g.fillStyle = '#0b0900'; g.beginPath(); g.moveTo(78, 40); g.lineTo(122, 44); g.lineTo(116, 72); g.lineTo(126, 96); g.lineTo(84, 100); g.lineTo(90, 74); g.closePath(); g.fill();
    const [cc, cg] = mk(48, 56); drawPIP(cg, 48, 56, 2.3, { glitch: 1 }); g.save(); g.beginPath(); g.moveTo(78, 40); g.lineTo(122, 44); g.lineTo(116, 72); g.lineTo(126, 96); g.lineTo(84, 100); g.lineTo(90, 74); g.closePath(); g.clip(); g.drawImage(cc, 78, 40, 48, 60); g.restore();
    g.strokeStyle = '#5a4c3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(78, 40); g.lineTo(122, 44); g.lineTo(116, 72); g.lineTo(126, 96); g.lineTo(84, 100); g.lineTo(90, 74); g.closePath(); g.stroke();
    // ojos: lentes de cámara con anillo rojo
    for (const x of [62, 134]) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x, 92, 14, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#ff2b3b'; g.lineWidth = 3; g.beginPath(); g.arc(x, 92, 10, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#ff2b3b'; g.beginPath(); g.arc(x, 92, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 6, 86, 3, 3); }
    // sonrisa desencajada con demasiados dientes
    g.fillStyle = '#1a0606'; g.beginPath(); g.moveTo(44, 120); g.quadraticCurveTo(96, 196, 150, 118); g.quadraticCurveTo(96, 150, 44, 120); g.fill();
    g.fillStyle = '#efe6cf';
    for (let i = 0; i < 15; i++) { const t = i / 14, x = 48 + t * 98, yb = 122 + Math.sin(t * Math.PI) * 24; g.beginPath(); g.moveTo(x - 3, yb - 4); g.lineTo(x + 3, yb - 4); g.lineTo(x, yb + 7); g.fill(); }
    for (let i = 0; i < 13; i++) { const t = i / 12, x = 54 + t * 86, yb = 128 + Math.sin(t * Math.PI) * 40; g.beginPath(); g.moveTo(x - 3, yb + 4); g.lineTo(x + 3, yb + 4); g.lineTo(x, yb - 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(132, 120, 26, 60, 0, 0, Math.PI * 2); g.fill();
    // cartel colgado
    g.fillStyle = '#e8c547'; g.fillRect(56, 196, 80, 22); g.fillStyle = '#1d2a2a'; g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('¡BIENVENIDOS,', 96, 205); g.fillText('FUTUROS PASANTES!', 96, 215);
  },
  vigil(g, t = 0) {
    g.fillStyle = '#080000'; g.fillRect(0, 0, 192, 240);
    const r = rnd(Math.floor(t * 20) + 5);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,${40 + r() * 40},${40 + r() * 40},${r() * 0.25})`; g.fillRect(r() * 192, r() * 240, 2, 2); }
    g.strokeStyle = '#ff3b3b'; g.lineWidth = 3; g.beginPath();
    for (let x = 10; x < 182; x += 4) { const y = 120 + Math.sin(x * 0.12 + t * 8) * 18 * r() + (r() - 0.5) * 10; x === 10 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    g.fillStyle = '#ff3b3b'; g.font = 'bold 30px monospace'; g.textAlign = 'center'; g.fillText('VIGIL', 96, 60);
    g.font = '13px monospace'; g.fillText('SEGURIDAD · EDEN', 96, 200);
  },
  recepcion(g) {
    background(g, '#1c2433', '#05070b');
    g.fillStyle = '#3b4658'; g.beginPath(); g.arc(96, 110, 64, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#151b26'; for (let y = -50; y <= 50; y += 10) for (let x = -50; x <= 50; x += 10) if (x * x + y * y < 2600) { g.beginPath(); g.arc(96 + x, 110 + y, 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9fc3ff'; g.font = '16px monospace'; g.textAlign = 'center'; g.fillText('RECEPCIÓN', 96, 210);
  },
};

const cache = new Map();
/** Retrato 96×120 listo para mostrar (pixelado). */
export function portrait(id) {
  if (cache.has(id)) return cache.get(id);
  if (id === 'pip') { const [c, g] = mk(96, 120); drawPIP(g, 96, 120, 1, {}); cache.set(id, c); return c; }
  const painter = PAINTERS[id]; if (!painter) return null;
  const [big, g] = mk(192, 240); painter(g);
  // encuadre más cerrado (plano medio-corto, como los retratos de diálogo del género)
  const [zoom, zg] = mk(192, 240); zg.drawImage(big, 14, 12, 164, 205, 0, 0, 192, 240);
  const out = crunch(zoom, 96, 120, { levels: 20, grain: 12, seed: id.length * 31 });
  cache.set(id, out); cache.set(id + ':hi', big);
  return out;
}
export function portraitHi(id) { portrait(id); return cache.get(id + ':hi'); }
export function vigilFrame(g, t) { const [big, bg] = mk(192, 240); PAINTERS.vigil(bg, t); g.clearRect(0, 0, 96, 120); g.drawImage(crunch(big, 96, 120, { levels: 12, grain: 30, seed: Math.floor(t * 10) }), 0, 0); }

const SKIN = { oliver: '#e2b08b', claire: '#f1cfb6', elliot: '#8c5c42' };
/** Textura frontal de la cara (sin pelo) para proyectarla en la cabeza 3D (Blender y demo). */
export function faceTexture(id, w = 168, h = 240) {
  const [big, g] = mk(192, 240); g.fillStyle = SKIN[id]; g.fillRect(0, 0, 192, 240); PAINTERS[id](g, true);
  const [c, cg] = mk(w, h); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high'; cg.drawImage(big, 54, 44, 84, 120, 0, 0, w, h);
  return c;
}
/** Recorte de la cara del retrato para la cabeza 3D (mismo arte en diálogo y en el mundo). */
export function faceCrop(id) {
  const big = portraitHi(id);
  const [c, g] = mk(48, 64); g.imageSmoothingEnabled = true;
  g.drawImage(big, 50, 40, 92, 124, 0, 0, 48, 64);
  return crunch(c, 48, 64, { levels: 18, grain: 8 });
}

// ---------------------------------------------------------------- PIP (CRT amarillo)
export function drawPIP(g, w, h, t, { glitch = 0, talking = false, text } = {}) {
  g.fillStyle = '#0b0900'; g.fillRect(0, 0, w, h);
  const Y = (a) => `rgba(255,216,74,${a})`;
  const cx = w / 2 + Math.sin(t * 2) * w * 0.02, cy = h * (text ? 0.42 : 0.55) + Math.sin(t * 3) * h * 0.015;
  const s = Math.min(w, h) * (text ? 0.26 : 0.32);
  g.save();
  if (glitch > 0 && Math.random() < glitch) g.translate((Math.random() - 0.5) * w * 0.15, 0);
  // hoja
  g.fillStyle = Y(0.9); g.beginPath(); g.ellipse(cx + s * 0.35, cy - s * 1.25, s * 0.38, s * 0.18, -0.6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = Y(0.9); g.lineWidth = Math.max(1, s * 0.07); g.beginPath(); g.moveTo(cx, cy - s * 0.95); g.quadraticCurveTo(cx + s * 0.05, cy - s * 1.2, cx + s * 0.2, cy - s * 1.2); g.stroke();
  // semilla
  g.fillStyle = Y(0.22); g.strokeStyle = Y(1); g.lineWidth = Math.max(1, s * 0.08);
  g.beginPath(); g.moveTo(cx, cy - s); g.bezierCurveTo(cx + s * 0.9, cy - s * 0.4, cx + s * 0.85, cy + s * 0.9, cx, cy + s * 0.9); g.bezierCurveTo(cx - s * 0.85, cy + s * 0.9, cx - s * 0.9, cy - s * 0.4, cx, cy - s); g.fill(); g.stroke();
  // cara
  const blink = (t % 3.2) < 0.12;
  g.fillStyle = Y(1);
  if (glitch > 0.5) { g.fillRect(cx - s * 0.42, cy - s * 0.1, s * 0.2, s * 0.2); g.fillRect(cx + s * 0.22, cy - s * 0.1, s * 0.2, s * 0.2); }
  else if (blink) { g.fillRect(cx - s * 0.42, cy, s * 0.2, s * 0.05); g.fillRect(cx + s * 0.22, cy, s * 0.2, s * 0.05); }
  else { g.beginPath(); g.ellipse(cx - s * 0.3, cy, s * 0.08, s * 0.14, 0, 0, Math.PI * 2); g.ellipse(cx + s * 0.3, cy, s * 0.08, s * 0.14, 0, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.lineWidth = Math.max(1, s * 0.08);
  const mo = talking ? Math.abs(Math.sin(t * 14)) * s * 0.18 : 0;
  g.moveTo(cx - s * 0.35, cy + s * 0.32); g.quadraticCurveTo(cx, cy + s * 0.62 + mo, cx + s * 0.35, cy + s * 0.32); g.stroke();
  g.restore();
  if (text) { g.fillStyle = Y(1); g.font = `${Math.round(h * 0.11)}px VT323, monospace`; g.textAlign = 'center'; g.fillText(text, w / 2, h * 0.9); }
  // líneas de barrido CRT
  g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1);
  if (glitch > 0) { g.fillStyle = `rgba(255,40,40,${glitch * 0.35})`; g.fillRect(0, Math.random() * h, w, h * 0.08); }
}

// ---------------------------------------------------------------- texturas del mundo
export function soilTex(base = '#2a2521', seed = 1) {
  const [c, g] = mk(64, 64); const r = rnd(seed);
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,240,220,.05)' : 'rgba(0,0,0,.18)'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1 + (r() * 2 | 0), 1); }
  return c;
}
export function furrowTex() {
  const [c, g] = mk(32, 64); const r = rnd(4);
  g.fillStyle = '#3a2c20'; g.fillRect(0, 0, 32, 64);
  for (let y = 0; y < 64; y += 4) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y, 32, 1); }
  for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(255,230,200,.06)'; g.fillRect(r() * 32, r() * 64, 1, 1); }
  return c;
}
export function panelTex(base = '#7b8a86', { rust = 0.5, seed = 2, stripe } = {}) {
  const [c, g] = mk(64, 64); const r = rnd(seed);
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 16) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 1, 64); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 1, 0, 1, 64); }
  for (let x = 4; x < 64; x += 16) for (const y of [3, 60]) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, y, 2, 2); }
  for (let i = 0; i < 9 * rust; i++) { const x = r() * 64, y = r() * 20; const gr = g.createLinearGradient(0, y, 0, y + 30 + r() * 30); gr.addColorStop(0, 'rgba(120,60,30,.45)'); gr.addColorStop(1, 'rgba(120,60,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 1 + r() * 3, 60); }
  if (stripe) { for (let x = -64; x < 64; x += 12) { g.fillStyle = '#d8b02a'; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 6, 64); g.lineTo(x + 30, 40); g.lineTo(x + 24, 40); g.fill(); } g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 38, 64, 2); }
  return c;
}
export function signTex(lines, { w = 256, h = 64, bg = '#d9d4c4', fg = '#1d2b2a', logo = true, font = 'bold 20px monospace' } = {}) {
  const [c, g] = mk(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
  if (logo) arcadiaLogo(g, h / 2, h / 2, h * 0.32);
  g.fillStyle = fg; g.font = font; g.textAlign = 'left'; g.textBaseline = 'middle';
  const x0 = logo ? h : 10;
  lines.forEach((l, i) => g.fillText(l, x0, h / 2 + (i - (lines.length - 1) / 2) * (h / (lines.length + 0.6))));
  return crunch(c, w / 2, h / 2, { levels: 16, grain: 14 });
}
export function suitTex(color, { logo = true, belt = true, patch } = {}) {
  const [c, g] = mk(64, 64);
  g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(31, 0, 2, 64);
  g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 4; y < 60; y += 4) g.fillRect(31, y, 2, 1);
  if (belt) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 50, 64, 6); g.fillStyle = '#8a8a7a'; g.fillRect(28, 50, 8, 6); }
  if (logo) arcadiaLogo(g, 46, 16, 5);
  if (patch) { g.fillStyle = patch; g.fillRect(10, 12, 10, 8); }
  return crunch(c, 32, 32, { levels: 20, grain: 10 });
}
export function burlapTex(seed = 6) {
  const [c, g] = mk(32, 32); const r = rnd(seed);
  g.fillStyle = '#8c7448'; g.fillRect(0, 0, 32, 32);
  g.fillStyle = 'rgba(50,35,15,.35)';
  for (let i = 0; i < 32; i += 2) { g.fillRect(0, i, 32, 1); g.fillRect(i, 0, 1, 32); }
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(r() * 32, r() * 32, 2, 1); }
  return c;
}
export function sackFaceTex() {
  const [c, g] = mk(32, 32); g.drawImage(burlapTex(8), 0, 0);
  g.strokeStyle = '#1a120a'; g.lineWidth = 1.5;
  for (const x of [10, 22]) { g.beginPath(); g.moveTo(x - 3, 11); g.lineTo(x + 3, 15); g.moveTo(x + 3, 11); g.lineTo(x - 3, 15); g.stroke(); }
  g.beginPath(); g.moveTo(8, 23); g.lineTo(24, 22); g.stroke();
  for (let x = 9; x < 24; x += 3) { g.beginPath(); g.moveTo(x, 21); g.lineTo(x + 1, 25); g.stroke(); }
  return c;
}
export function badgeTex(name, cycle, { mine = false } = {}) {
  const [c, g] = mk(128, 80);
  g.fillStyle = mine ? '#f2e6b8' : '#e9e4d4'; g.fillRect(0, 0, 128, 80);
  g.fillStyle = '#2f5f66'; g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#e9e4d4'; g.font = 'bold 11px monospace'; g.fillText('ARCADIA EDEN CORP.', 6, 12);
  g.fillStyle = '#6a6a6a'; g.fillRect(6, 22, 30, 36);
  g.fillStyle = '#111'; g.font = 'bold 11px monospace'; g.fillText(name.toUpperCase().slice(0, 13), 42, 34);
  g.font = '10px monospace'; g.fillText('CICLO ' + cycle, 42, 50); g.fillText('PASANTE', 42, 64);
  g.fillStyle = '#111'; for (let x = 6; x < 120; x += 3) g.fillRect(x, 70, (x * 7) % 2 + 1, 6);
  return crunch(c, 64, 40, { levels: 14, grain: 16 });
}
export function plaqueTex(lines) {
  const [c, g] = mk(128, 64);
  g.fillStyle = '#5d5a3c'; g.fillRect(0, 0, 128, 64);
  g.strokeStyle = '#2b2a1c'; g.lineWidth = 4; g.strokeRect(2, 2, 124, 60);
  g.fillStyle = '#e8dfb0'; g.font = 'bold 10px monospace'; g.textAlign = 'center';
  lines.forEach((l, i) => g.fillText(l, 64, 16 + i * 13));
  return crunch(c, 64, 32, { levels: 12, grain: 18 });
}
export function domeTex() {
  const [c, g] = mk(256, 128);
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#bfbfbf');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1;
  for (let y = 0; y < 128; y += 8) for (let x = (y / 8) % 2 * 8; x < 256; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 4); g.lineTo(x + 8, y + 12); g.stroke(); }
  return c;
}
export function quotaBoardTex(c, g, value, body) {
  g.fillStyle = '#060a08'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = body ? '#ff3b3b' : '#7cf7d4'; g.font = 'bold 18px monospace'; g.textAlign = 'center';
  g.fillText(body ? 'CUERPO' : 'CUOTA DEL CICLO', c.width / 2, 22);
  g.font = 'bold 34px monospace'; g.fillText(Math.round(value) + '%', c.width / 2, 58);
  g.fillStyle = 'rgba(0,0,0,.4)'; for (let y = 0; y < c.height; y += 2) g.fillRect(0, y, c.width, 1);
}
/** "Dibujo de Charlie" en el sótano: cambia por servidor (seed) → mapa del Cap. 2 entre comunidades. */
export function charlieDrawing(seed = 1) {
  const [c, g] = mk(128, 96); const r = rnd(seed);
  g.fillStyle = '#efe8d6'; g.fillRect(0, 0, 128, 96);
  g.lineWidth = 2; g.lineCap = 'round';
  g.strokeStyle = '#e0a020'; g.beginPath(); g.arc(104, 18, 9, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#c03030'; g.strokeRect(14, 44, 34, 28); g.beginPath(); g.moveTo(10, 46); g.lineTo(31, 28); g.lineTo(52, 46); g.stroke();
  g.strokeStyle = '#2050a0'; for (const x of [70, 88]) { g.beginPath(); g.arc(x, 50, 5, 0, Math.PI * 2); g.moveTo(x, 55); g.lineTo(x, 72); g.moveTo(x - 6, 62); g.lineTo(x + 6, 62); g.moveTo(x, 72); g.lineTo(x - 5, 84); g.moveTo(x, 72); g.lineTo(x + 5, 84); g.stroke(); }
  g.strokeStyle = '#30a050'; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(8 + r() * 110, 88); g.lineTo(10 + r() * 110, 80 - r() * 6); } g.stroke();
  g.strokeStyle = 'rgba(40,40,40,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(54, 30); for (let i = 0; i < 4; i++) g.lineTo(54 + r() * 60, 20 + r() * 20); g.stroke();
  g.fillStyle = '#333'; g.font = '12px "Comic Sans MS", cursive'; g.fillText('Charlie', 12, 92);
  return crunch(c, 96, 72, { levels: 16, grain: 10 });
}
