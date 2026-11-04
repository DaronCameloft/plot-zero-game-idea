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
  // cuello
  g.fillStyle = shade(o.skin, -0.32); g.fillRect(cx - 16, cy + 36, 32, 60);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - 16, cy + 40, 32, 10);
  // orejas
  g.fillStyle = shade(o.skin, -0.12);
  g.beginPath(); g.ellipse(cx - 41, cy + 2, 6, 11, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = shade(o.skin, -0.35);
  g.beginPath(); g.ellipse(cx + 41, cy + 2, 6, 11, 0, 0, Math.PI * 2); g.fill();
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
const PAINTERS = {
  oliver(g) {
    background(g, '#3a2a20', '#0d0907');
    shoulders(g, '#2f5f66', { collar: '#244a50' });
    // chaleco con parches
    g.fillStyle = '#2b4746'; g.fillRect(30, 196, 46, 50); g.fillRect(116, 196, 50, 50);
    g.fillStyle = '#d9692a'; g.fillRect(40, 206, 14, 10); g.fillStyle = '#e8c547'; g.fillRect(132, 212, 12, 12);
    g.fillStyle = '#c94b4b'; g.fillRect(150, 204, 8, 8);
    arcadiaLogo(g, 58, 226, 7);
    paintFace(g, { skin: '#d6a383', iris: '#4f6a3c', bags: 0.75, mouth: 'smile', browUp: 3, browTilt: -1, brow: '#7a3a1c', lid: 0.42, age: 0.6 });
    // barba de varios días + pecas
    const r = rnd(3);
    for (let i = 0; i < 260; i++) { const a = r() * Math.PI, rr = 30 + r() * 22; const x = 96 + Math.cos(a) * rr * 0.9, y = 120 + Math.sin(a) * rr * 0.75; if (y > 128) { g.fillStyle = `rgba(140,70,35,${0.25 + r() * 0.25})`; g.fillRect(x, y, 1.5, 1.5); } }
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(150,80,50,.45)'; g.fillRect(70 + r() * 52, 104 + r() * 16, 2, 2); }
    // mechones pelirrojos
    g.strokeStyle = '#b3592b'; g.lineWidth = 4;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(96 + s * 38, 70); g.lineTo(96 + s * 44, 92); g.stroke(); g.beginPath(); g.moveTo(96 + s * 34, 72); g.lineTo(96 + s * 38, 96); g.stroke(); }
    // gorro naranja
    g.fillStyle = '#d9692a';
    g.beginPath(); g.moveTo(52, 78); g.bezierCurveTo(50, 30, 142, 30, 140, 78); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,45,15,.6)'; g.lineWidth = 2;
    for (let x = 58; x < 138; x += 7) { g.beginPath(); g.moveTo(x, 76); g.lineTo(x + (x - 96) * 0.15, 44); g.stroke(); }
    g.fillStyle = '#c45a20'; g.fillRect(50, 70, 92, 14);
    g.strokeStyle = 'rgba(90,30,10,.6)'; for (let x = 52; x < 142; x += 4) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 84); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(50, 82, 92, 3);
  },
  claire(g) {
    background(g, '#26313a', '#07090b');
    // coleta detrás
    g.fillStyle = '#2e1f19'; g.beginPath(); g.ellipse(150, 150, 14, 46, -0.25, 0, Math.PI * 2); g.fill();
    shoulders(g, '#cbc6b4', { collar: '#2f5f66' });
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(70, 182); g.lineTo(84, 240); g.moveTo(122, 182); g.lineTo(108, 240); g.stroke();
    g.fillStyle = '#2f5f66'; g.fillRect(84, 200, 24, 40);
    // portapapeles
    g.fillStyle = '#7a5a3a'; g.fillRect(140, 210, 50, 40); g.fillStyle = '#e9e4d4'; g.fillRect(146, 218, 40, 30); g.fillStyle = '#888'; g.fillRect(158, 206, 16, 6);
    paintFace(g, { skin: '#e2bfa3', iris: '#3c4e62', bags: 0.95, mouth: 'flat', browUp: -1, browTilt: 1, brow: '#2a1c16', lid: 0.6, age: 1 });
    // pelo recogido con raya al medio
    g.fillStyle = '#33221b';
    g.beginPath(); g.moveTo(54, 96); g.bezierCurveTo(48, 36, 144, 36, 138, 96); g.bezierCurveTo(132, 66, 108, 58, 97, 56); g.bezierCurveTo(84, 58, 60, 66, 54, 96); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(96, 46); g.lineTo(97, 57); g.stroke();
    g.strokeStyle = '#3e2a21'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(96, 50); g.quadraticCurveTo(70 - i * 2, 54 + i * 3, 56 - i, 80 + i * 3); g.stroke(); g.beginPath(); g.moveTo(98, 50); g.quadraticCurveTo(122 + i * 2, 54 + i * 3, 136 + i, 80 + i * 3); g.stroke(); }
    // gafas: una luna rota
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 2.2;
    g.strokeRect(65, 90, 26, 18); g.strokeRect(101, 90, 26, 18);
    g.beginPath(); g.moveTo(91, 96); g.lineTo(101, 96); g.moveTo(65, 96); g.lineTo(55, 94); g.moveTo(127, 96); g.lineTo(137, 94); g.stroke();
    g.fillStyle = 'rgba(200,220,235,.12)'; g.fillRect(66, 91, 24, 16); g.fillRect(102, 91, 24, 16);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 0.9;
    const px = 118, py = 95;
    for (const [dx, dy] of [[-16, 10], [8, 12], [9, -5], [-10, -5], [-4, 12], [9, 3]]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx, py + dy); g.stroke(); }
  },
  elliot(g) {
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
    paintFace(g, { skin: '#8c5c42', iris: '#2c1d15', bags: 0.7, mouth: 'tremble', browUp: 4, browTilt: 5, brow: '#120c0a', lid: 0.25, eyeW: 9, eyeH: 5.2, shine: true, look: -1 });
    g.strokeStyle = '#1e1e22'; g.lineWidth = 5; g.beginPath(); g.moveTo(70, 166); g.quadraticCurveTo(96, 182, 122, 166); g.stroke();
    // pelo negro revuelto con flequillo
    g.fillStyle = '#15100e';
    g.beginPath(); g.moveTo(50, 92); g.bezierCurveTo(40, 30, 150, 26, 142, 92); g.lineTo(136, 70); g.lineTo(126, 86); g.lineTo(120, 66); g.lineTo(108, 84); g.lineTo(100, 64); g.lineTo(90, 86); g.lineTo(80, 66); g.lineTo(70, 86); g.lineTo(60, 70); g.closePath(); g.fill();
    g.strokeStyle = '#2a201b'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(60 + i * 9, 44); g.lineTo(58 + i * 10, 80); g.stroke(); }
  },
  recolector(g) {
    background(g, '#1a1410', '#030202');
    shoulders(g, '#3f3a2c', { wide: 8 });
    // abrigo hecho de uniformes viejos
    g.fillStyle = '#2f5f66'; g.fillRect(40, 200, 28, 40); g.fillStyle = '#5a5d45'; g.fillRect(124, 196, 30, 44); g.fillStyle = '#cbc6b4'; g.fillRect(84, 210, 22, 30);
    // saco de semillas como cabeza
    const r = rnd(9);
    g.fillStyle = '#8c7448';
    g.beginPath(); g.moveTo(60, 160); g.bezierCurveTo(40, 110, 50, 40, 96, 38); g.bezierCurveTo(142, 40, 152, 110, 132, 160); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,45,25,.45)'; g.lineWidth = 1;
    for (let y = 40; y < 162; y += 4) { g.beginPath(); g.moveTo(48, y); g.lineTo(146, y + (r() - 0.5) * 3); g.stroke(); }
    for (let x = 50; x < 146; x += 4) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + (r() - 0.5) * 3, 160); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(124, 100, 18, 50, 0, 0, Math.PI * 2); g.fill();
    // ojos cosidos (es ciego)
    g.strokeStyle = '#1a120a'; g.lineWidth = 3;
    for (const x of [76, 116]) { g.beginPath(); g.moveTo(x - 8, 88); g.lineTo(x + 8, 98); g.moveTo(x + 8, 88); g.lineTo(x - 8, 98); g.stroke(); }
    g.lineWidth = 2; g.beginPath(); g.moveTo(70, 130); g.lineTo(122, 128); g.stroke();
    for (let x = 72; x < 122; x += 6) { g.beginPath(); g.moveTo(x, 124); g.lineTo(x + 2, 134); g.stroke(); }
    // logo de Arcadia desteñido en el saco
    g.globalAlpha = 0.5; arcadiaLogo(g, 96, 62, 10); g.globalAlpha = 1;
    // cuerda al cuello
    g.strokeStyle = '#5e4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(62, 156); g.quadraticCurveTo(96, 170, 130, 156); g.stroke();
    // gafete colgando
    g.fillStyle = '#e9e4d4'; g.fillRect(98, 196, 40, 26); g.fillStyle = '#555'; g.fillRect(101, 199, 10, 12);
    g.fillStyle = '#222'; g.fillRect(114, 200, 20, 2); g.fillRect(114, 205, 16, 2); g.fillRect(101, 214, 34, 2);
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
