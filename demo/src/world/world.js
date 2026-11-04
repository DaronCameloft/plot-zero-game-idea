import * as THREE from 'three';
import { lambert, basic, canvasTex } from '../engine/renderer.js';
import { soilTex, furrowTex, panelTex, signTex, plaqueTex, domeTex, quotaBoardTex, badgeTex, charlieDrawing, mk } from '../art/paint.js';

// Mapa del Capítulo 1 (puesto Eden-0). Coordenadas en metros. +Z = norte (hacia La Lente).
export const POI = {
  spawn: new THREE.Vector3(0, 0, -7.5),
  door: new THREE.Vector3(0, 0, -10),
  doorInside: new THREE.Vector3(0, 0, -11.6),
  window: new THREE.Vector3(5.5, 0, -11.2),
  kitchen: new THREE.Vector3(6, 0, -16),
  comms: new THREE.Vector3(-7, 0, -19.4),
  hatch: new THREE.Vector3(-8, 0, -13),
  fields: new THREE.Vector3(0, 0, 6),
  scarecrow: new THREE.Vector3(2, 0, 15),
  generator: new THREE.Vector3(-15.2, 0, 12),
  board: new THREE.Vector3(-14.4, 0, 9),
  tower: new THREE.Vector3(20.2, 0, 10),
  valve: new THREE.Vector3(19.6, 0, 8.2),
  compostGate: new THREE.Vector3(-22, 0, -18.4),
  compost: new THREE.Vector3(-22, 0, -24),
  lens: new THREE.Vector3(0, 0, 64),
};

const PHASES = {
  day: { sky: '#6f7f84', fog: [16, 78], hemi: [1.05, '#d6e6ea', '#3a332c'], dir: [0.85, '#fffbe8'], lumen: 0.5, panels: 1, field: 0, inner: 0.7 },
  dusk: { sky: '#6b3b30', fog: [10, 58], hemi: [0.55, '#ff9a6a', '#2a1a14'], dir: [0.45, '#ff8a50'], lumen: 0.8, panels: 0.4, field: 0.4, inner: 0.9 },
  night: { sky: '#04060a', fog: [3, 30], hemi: [0.22, '#4a6a80', '#050505'], dir: [0.05, '#8fb0ff'], lumen: 1, panels: 0, field: 1.6, inner: 0.9 },
  dawn: { sky: '#4e5868', fog: [14, 64], hemi: [0.75, '#e8c0c8', '#2a2a30'], dir: [0.5, '#ffd0c0'], lumen: 0.6, panels: 1, field: 0.2, inner: 0.6 },
  purge: { sky: '#2a0712', fog: [6, 44], hemi: [1.1, '#ff9aa8', '#3a1420'], dir: [0.35, '#ff3050'], lumen: 1, panels: 0, field: 1.8, inner: 0, alarm: true },
};

export function buildWorld(scene, pip) {
  const colliders = []; // {x0,x1,z0,z1,id?,on}
  const addCol = (x0, x1, z0, z1, id) => { const c = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), id, on: true }; colliders.push(c); return c; };
  const B = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };

  // ---------------- luces
  const hemi = new THREE.HemisphereLight('#d6e6ea', '#3a332c', 1); scene.add(hemi);
  const dir = new THREE.DirectionalLight('#fffbe8', 0.8); dir.position.set(-10, 30, 10); scene.add(dir);
  const fieldLights = [new THREE.PointLight('#7cf7d4', 0, 22, 1.6), new THREE.PointLight('#7cf7d4', 0, 22, 1.6)];
  fieldLights[0].position.set(-6, 1.5, 8); fieldLights[1].position.set(6, 1.5, 16); fieldLights.forEach((l) => scene.add(l));
  const inner = new THREE.PointLight('#e8f0ff', 0.7, 16, 1.4); inner.position.set(0, 3, -16); scene.add(inner);
  const alarm = new THREE.PointLight('#ff2040', 0, 70, 1); alarm.position.set(0, 4.5, -8); scene.add(alarm);
  scene.fog = new THREE.Fog('#6f7f84', 16, 78);
  // luz "de personaje" (linterna/brillo de Lumen): mantiene legible al despierto en noches y Purga
  const lamp = new THREE.PointLight('#ffe2c0', 0, 10, 1.3); scene.add(lamp);

  // ---------------- suelo + domo (el "cielo")
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 24), lambert({ map: canvasTex(soilTex(), [40, 40]) }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const domeMat = new THREE.MeshBasicMaterial({ map: canvasTex(domeTex(), [6, 3]), side: THREE.BackSide, fog: false, color: '#6f7f84' });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(74, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat); scene.add(dome);
  // "luces del cielo": paneles que se apagan siempre a la misma hora
  const panelMat = new THREE.MeshBasicMaterial({ color: '#fffbe8', fog: false, side: THREE.DoubleSide });
  const panelOffMat = new THREE.MeshBasicMaterial({ color: '#111', fog: false, side: THREE.DoubleSide });
  const panels = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, el = 0.95;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), panelMat);
    p.position.set(Math.cos(a) * 72 * Math.cos(el), 72 * Math.sin(el), Math.sin(a) * 72 * Math.cos(el));
    p.lookAt(0, 0, 0); scene.add(p); panels.push(p);
  }
  // costura del cielo (solo la ve el despierto)
  const seam = new THREE.Mesh(new THREE.TorusGeometry(52, 0.25, 3, 64), new THREE.MeshBasicMaterial({ color: '#7cf7d4', fog: false }));
  seam.rotation.x = Math.PI / 2; seam.position.y = 52; seam.visible = false; scene.add(seam);
  const seamZip = new THREE.Group(); scene.add(seamZip); seamZip.visible = false;
  for (let i = 0; i < 40; i++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3), seam.material); const a = (i / 40) * Math.PI * 2; t.position.set(Math.cos(a) * 52, 52, Math.sin(a) * 52); t.lookAt(0, 52, 0); seamZip.add(t); }

  // ---------------- módulo habitacional
  const wallMat = lambert({ map: canvasTex(panelTex('#8a9893', { rust: 0.8 }), [1, 1]) });
  const wallIn = lambert({ map: canvasTex(panelTex('#b9c2b6', { rust: 0.2, seed: 5 }), [1, 1]) });
  const floorMat = lambert({ map: canvasTex(panelTex('#4a4f4c', { rust: 0.1, seed: 9 }), [8, 4]) });
  const H = 3.6, T = 0.3;
  B(20, 0.1, 12, floorMat, 0, 0.05, -16);
  B(20.4, 0.25, 12.4, lambert({ color: '#5c6663' }), 0, H + 0.12, -16); // techo
  B(20, H, T, wallMat, 0, H / 2, -22); addCol(-10, 10, -22.2, -21.8);
  B(T, H, 12, wallMat, -10, H / 2, -16); addCol(-10.2, -9.8, -22, -10);
  B(T, H, 12, wallMat, 10, H / 2, -16); addCol(9.8, 10.2, -22, -10);
  // fachada con ventanas y puerta
  const seg = (x0, x1, y0, y1) => B(x1 - x0, y1 - y0, T, wallMat, (x0 + x1) / 2, (y0 + y1) / 2, -10);
  seg(-10, -7, 0, H); seg(-7, -4, 0, 1.1); seg(-7, -4, 2.3, H); seg(-4, -1, 0, H); seg(-1, 1, 2.4, H);
  seg(1, 4, 0, H); seg(4, 7, 0, 1.1); seg(4, 7, 2.3, H); seg(7, 10, 0, H);
  addCol(-10, -1, -10.2, -9.8); addCol(1, 10, -10.2, -9.8);
  const doorCol = addCol(-1, 1, -10.2, -9.8, 'door'); doorCol.on = false;
  const door = new THREE.Group(); door.position.set(-1, 0, -10); scene.add(door);
  B(2, 2.4, 0.12, lambert({ color: '#566b67' }), 1, 1.2, 0, door);
  B(0.1, 0.3, 0.1, lambert({ color: '#c9b458' }), 1.75, 1.2, 0.1, door);
  door.rotation.y = -1.6; // abierta
  const barricade = new THREE.Group(); scene.add(barricade); barricade.visible = false;
  for (const [y, r] of [[0.8, 0.25], [1.6, -0.2], [1.2, 0.05]]) { const pl = B(2.6, 0.22, 0.12, lambert({ color: '#6b4f33' }), 0, y, -10.25, barricade); pl.rotation.z = r; }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), basic({ map: canvasTex(signTex(['EDEN-0 · MÓDULO HABITACIONAL'], { w: 512, h: 64, font: 'bold 26px monospace' })) }));
  sign.position.set(0, 3.0, -9.82); scene.add(sign);
  const pipOutside = pip.makeCRT(); pipOutside.position.set(2.4, 1.7, -9.6); scene.add(pipOutside);
  // interior: cocina, comunicaciones, literas, sótano
  for (const z of [-16]) { B(0.05, H, 12, wallIn, -9.8, H / 2, z); B(0.05, H, 12, wallIn, 9.8, H / 2, z); }
  B(20, H, 0.05, wallIn, 0, H / 2, -21.8);
  const wood = lambert({ color: '#6a5038' });
  B(2.6, 0.08, 1.3, wood, 6, 0.8, -16); for (const [x, z] of [[4.9, -15.5], [7.1, -15.5], [4.9, -16.5], [7.1, -16.5]]) B(0.08, 0.8, 0.08, wood, x, 0.4, z);
  addCol(4.7, 7.3, -16.65, -15.35);
  for (const [x, z] of [[4.3, -16], [7.7, -16], [6, -17.1]]) { B(0.5, 0.06, 0.5, wood, x, 0.48, z); B(0.5, 0.6, 0.06, wood, x, 0.8, z + (z < -16.5 ? -0.25 : 0)); }
  const cards = new THREE.Group(); scene.add(cards);
  for (let i = 0; i < 7; i++) { const c = B(0.12, 0.01, 0.17, basic({ color: i % 3 ? '#e9e4d4' : '#c94b4b' }), 5.4 + Math.random() * 1.2, 0.85, -16.3 + Math.random() * 0.6, cards); c.rotation.y = Math.random() * 3; }
  B(2.2, 0.8, 0.9, lambert({ color: '#3c403e' }), -7, 0.4, -20.9); addCol(-8.1, -5.9, -21.4, -20.4);
  const pipInside = pip.makeCRT(); pipInside.position.set(-7.2, 1.05, -20.9); scene.add(pipInside);
  const radio = B(0.5, 0.3, 0.3, lambert({ color: '#4b4a3a' }), -6.1, 0.95, -20.8); B(0.02, 0.5, 0.02, basic({ color: '#222' }), -5.95, 1.3, -20.8);
  for (const x of [-1.4, 1.4]) { B(1.1, 0.4, 2.1, lambert({ color: '#6c7a75' }), x, 0.3, -20.6); B(1.1, 0.12, 2.1, lambert({ color: '#cfd6cf' }), x, 0.55, -20.6); B(1.1, 0.4, 2.1, lambert({ color: '#6c7a75' }), x, 1.6, -20.6); addCol(x - 0.6, x + 0.6, -21.7, -19.5); }
  const hatch = B(1.2, 0.04, 1.2, lambert({ color: '#2a2c2a' }), POI.hatch.x, 0.11, POI.hatch.z); B(0.4, 0.05, 0.08, basic({ color: '#c9b458' }), POI.hatch.x, 0.15, POI.hatch.z + 0.4);
  const drawing = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.68), basic({ map: canvasTex(charlieDrawing(4817)) })); drawing.position.set(-9.75, 1.6, -13); drawing.rotation.y = Math.PI / 2; drawing.visible = false; scene.add(drawing);

  // ---------------- campos de Lumen
  const furrowMat = lambert({ map: canvasTex(furrowTex(), [1, 8]) });
  const rows = [-12, -8, -4, 4, 8, 12];
  for (const x of rows) B(1.3, 0.25, 22, furrowMat, x, 0.12, 13);
  // Lumen decorativo (instanciado: 1 draw call)
  const bulbGeo = new THREE.IcosahedronGeometry(0.16, 0);
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#7cf7d4' });
  const stemMat = lambert({ color: '#2f5a3a' });
  const n = rows.length * 10;
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, n);
  const stems = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), stemMat, n);
  const m4 = new THREE.Matrix4(); let k = 0;
  for (const x of rows) for (let i = 0; i < 10; i++) { const z = 3.5 + i * 2.1; m4.makeTranslation(x + (i % 2 ? 0.25 : -0.25), 0.5, z); stems.setMatrixAt(k, m4); m4.makeTranslation(x + (i % 2 ? 0.25 : -0.25), 0.85, z); bulbs.setMatrixAt(k, m4); k++; }
  scene.add(bulbs, stems);
  // parcelas jugables
  const plots = [];
  const plotPos = [[-1.6, 3], [1.6, 3], [-1.6, 6.5], [1.6, 6.5], [-1.6, 10], [1.6, 10]];
  for (const [x, z] of plotPos) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    B(1.6, 0.12, 1.6, lambert({ color: '#3a2c20' }), 0, 0.06, 0, g);
    for (const [px, pz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) B(0.08, 0.4, 0.08, wood, px, 0.2, pz, g);
    const sprout = B(0.06, 0.4, 0.06, stemMat, 0, 0.3, 0, g); sprout.visible = false;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat); bulb.position.y = 0.75; bulb.visible = false; g.add(bulb);
    const wet = B(1.5, 0.02, 1.5, lambert({ color: '#1d1a2a' }), 0, 0.13, 0, g); wet.visible = false;
    plots.push({ group: g, pos: new THREE.Vector3(x, 0, z), state: 'empty', grow: 0, sprout, bulb, wet });
  }
  // placas con tripulaciones anteriores (incluye cameos de ArcadiaDevs)
  const plaques = [
    ['TRIPULACIÓN · CICLO 3.902', 'M. OKAFOR · D. REYES', 'S. LINDQVIST'],
    ['TRIPULACIÓN · CICLO 4.410', 'J. NAKAMURA · P. ROSSI', 'A. BELLAMY'],
    ['TRIPULACIÓN · CICLO 4.816', 'O. HALE · C. MOREAU', 'E. PARK'],
    ['EQUIPO ARCADIADEVS', '"gracias por jugar"', 'CICLO 0'],
  ];
  plaques.forEach((lines, i) => {
    const x = rows[i] ?? 12; const pst = B(0.1, 0.9, 0.1, wood, x, 0.45, 1.6);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), basic({ map: canvasTex(plaqueTex(lines)) })); pl.position.set(x, 0.95, 1.66); pl.rotation.x = -0.3; scene.add(pl);
  });

  // ---------------- silo, generador y pizarra de cuota
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 9, 10), lambert({ map: canvasTex(panelTex('#7d837d', { rust: 1.2, seed: 11 }), [3, 2]) }));
  silo.position.set(-22, 4.5, 6); scene.add(silo); addCol(-25, -19, 3, 9);
  const siloTop = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2, 10), lambert({ color: '#5d635d' })); siloTop.position.set(-22, 10, 6); scene.add(siloTop);
  const gen = B(3, 2, 2.2, lambert({ map: canvasTex(panelTex('#5d635d', { stripe: true, seed: 3 })) }), -17.5, 1, 12); addCol(-19, -16, 10.9, 13.1);
  const genLight = B(0.3, 0.3, 0.3, basic({ color: '#7cf7d4' }), -17.5, 2.2, 12);
  const [boardC, boardG] = mk(128, 72); const boardTex = canvasTex(boardC);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.24), basic({ map: boardTex })); board.position.set(-14.4, 2.2, 9); board.rotation.y = Math.PI / 2; scene.add(board);
  B(0.12, 1.6, 0.12, lambert({ color: '#333' }), -14.5, 0.8, 9);
  const setBoard = (v, body) => { quotaBoardTex(boardC, boardG, v, body); boardTex.needsUpdate = true; };
  setBoard(0, false);
  // anomalía: cajas que flotan
  const anomalies = new THREE.Group(); anomalies.visible = false; scene.add(anomalies);
  const crateMat = lambert({ color: '#7a5a3a' });
  for (let i = 0; i < 5; i++) B(0.8, 0.8, 0.8, crateMat, -14 + (i % 3) * 1.2, 1.2 + i * 0.5, 3 + (i % 2) * 1.5, anomalies);
  const crates = new THREE.Group(); scene.add(crates);
  for (let i = 0; i < 4; i++) B(0.8, 0.8, 0.8, crateMat, -14 + (i % 2) * 1.0, 0.4, 3 + Math.floor(i / 2) * 1.0, crates);

  // ---------------- torre de riego
  const steel = lambert({ color: '#4d5653' });
  for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) B(0.18, 11, 0.18, steel, 22 + dx, 5.5, 10 + dz);
  for (let y = 2; y < 11; y += 3) { B(2.6, 0.1, 0.1, steel, 22, y, 8.8); B(2.6, 0.1, 0.1, steel, 22, y, 11.2); B(0.1, 0.1, 2.6, steel, 20.8, y, 10); B(0.1, 0.1, 2.6, steel, 23.2, y, 10); }
  B(3.6, 0.2, 3.6, steel, 22, 10.5, 10);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2, 8), lambert({ color: '#66706c' })); tank.position.set(22, 11.8, 10); scene.add(tank);
  const antenna = B(0.06, 4, 0.06, steel, 23.3, 14, 11.3); const antTip = B(0.2, 0.2, 0.2, basic({ color: '#ff3b3b' }), 23.3, 16, 11.3);
  for (let y = 0.4; y < 10.5; y += 0.4) B(0.7, 0.05, 0.08, steel, 20.65, y, 10);
  addCol(20.7, 23.3, 8.7, 11.3);
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 4, 8), basic({ color: '#c94b4b' })); valve.position.set(19.7, 1, 8.6); valve.rotation.y = Math.PI / 2; scene.add(valve);
  B(0.15, 1, 0.15, steel, 19.75, 0.5, 8.6);

  // ---------------- sector compostaje (restringido)
  const fenceMat = lambert({ color: '#444a46' });
  const cx = -22, cz = -24;
  for (let i = -5; i <= 5; i++) { B(0.12, 2.2, 0.12, fenceMat, cx + i, 1.1, cz - 5); B(0.12, 2.2, 0.12, fenceMat, cx - 5, 1.1, cz + i); B(0.12, 2.2, 0.12, fenceMat, cx + 5, 1.1, cz + i); if (Math.abs(i) > 1) B(0.12, 2.2, 0.12, fenceMat, cx + i, 1.1, cz + 5); }
  for (const y of [0.6, 1.8]) { B(10, 0.08, 0.06, fenceMat, cx, y, cz - 5); B(0.06, 0.08, 10, fenceMat, cx - 5, y, cz); B(0.06, 0.08, 10, fenceMat, cx + 5, y, cz); B(3.5, 0.08, 0.06, fenceMat, cx - 3.25, y, cz + 5); B(3.5, 0.08, 0.06, fenceMat, cx + 3.25, y, cz + 5); }
  addCol(cx - 5.2, cx + 5.2, cz - 5.2, cz - 4.8); addCol(cx - 5.2, cx - 4.8, cz - 5, cz + 5); addCol(cx + 4.8, cx + 5.2, cz - 5, cz + 5); addCol(cx - 5, cx - 1.5, cz + 4.8, cz + 5.2); addCol(cx + 1.5, cx + 5, cz + 4.8, cz + 5.2);
  const gate = B(3, 2, 0.1, lambert({ color: '#6b2a2a' }), cx, 1, cz + 5);
  const gateCol = addCol(cx - 1.5, cx + 1.5, cz + 4.8, cz + 5.2, 'gate');
  const compostSign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), basic({ map: canvasTex(signTex(['SECTOR COMPOSTAJE', 'ACCESO RESTRINGIDO'], { w: 256, h: 64, bg: '#c9b458', font: 'bold 16px monospace' })) }));
  compostSign.position.set(cx, 2.5, cz + 5.1); scene.add(compostSign);
  const heap = new THREE.Group(); heap.position.set(cx, 0, cz - 1); scene.add(heap);
  const colors = ['#2f6066', '#5a5d45', '#cbc6b4', '#2f6066', '#d9692a', '#2f6066'];
  for (let i = 0; i < 26; i++) { const m = B(0.9, 0.18, 0.7, lambert({ color: colors[i % colors.length] }), (Math.random() - 0.5) * 3, 0.1 + Math.random() * 1.1 * (1 - Math.abs(i - 13) / 13), (Math.random() - 0.5) * 3, heap); m.rotation.set(Math.random() * 0.4, Math.random() * 3, Math.random() * 0.4); }
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), basic({ map: canvasTex(badgeTex(['Oliver Hale', 'Claire Moreau', 'Elliot Park'][i % 3], 4810 + i)), side: THREE.DoubleSide })); b.position.set((Math.random() - 0.5) * 3, 1.25, 1.6); b.rotation.x = -1.2; b.rotation.z = Math.random(); heap.add(b); }
  const compTerm = B(0.8, 1.3, 0.5, lambert({ color: '#2b2e2c' }), cx + 3.5, 0.65, cz + 2);
  const [ctc, ctg] = mk(128, 72); const ctTex = canvasTex(ctc); quotaBoardTex(ctc, ctg, 71, true);
  const ctScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), basic({ map: ctTex })); ctScreen.position.set(cx + 3.5, 1.1, cz + 2.26); scene.add(ctScreen);

  // ---------------- El Límite y La Lente
  const rock = lambert({ color: '#3a3836' });
  for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 1.4, 0), rock); const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 36; r.position.set(Math.cos(a) * d, 0.3, Math.sin(a) * d); if (Math.abs(r.position.x) < 4 && r.position.z > 20) r.position.x += 8; scene.add(r); }
  for (let i = 0; i < 14; i++) { const t = new THREE.Group(); const x = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 18), z = 28 + Math.random() * 30; t.position.set(x, 0, z); B(0.25, 4 + Math.random() * 3, 0.25, lambert({ color: '#2a2420' }), 0, 2.5, 0, t); const br = B(0.12, 2, 0.12, lambert({ color: '#2a2420' }), 0.5, 3.6, 0, t); br.rotation.z = -0.8; scene.add(t); }
  const lens = new THREE.Group(); lens.position.set(0, 5.6, 70.5); scene.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.8, 6, 16), basic({ color: '#202426' })); lens.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(4.6, 16), basic({ color: '#05080a' })); glass.position.z = 0.05; lens.add(glass);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(1.4, 12), new THREE.MeshBasicMaterial({ color: '#ff2040' })); iris.position.z = 0.1; lens.add(iris);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.4, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); glint.position.set(-1.6, 1.6, 0.12); lens.add(glint);
  lens.rotation.set(0, Math.PI, 0);
  const lensPad = B(6, 0.1, 3, lambert({ color: '#3d4441' }), 0, 0.05, 66.5);

  // ---------------- API
  let phaseName = 'day';
  const lumenColor = new THREE.Color('#7cf7d4');
  const api = {
    colliders, plots, door, doorCol, barricade, gateCol, gate, seam, seamZip, panels, anomalies, crates, drawing, hatch, heap, lens, iris, antTip, genLight, ctScreen, valve, radio, pipInside, pipOutside,
    setBoard,
    get phase() { return phaseName; },
    setPhase(name) {
      const p = PHASES[name]; phaseName = name;
      scene.fog.color.set(p.sky); scene.fog.near = p.fog[0]; scene.fog.far = p.fog[1];
      scene.background = new THREE.Color(p.sky); domeMat.color.set(p.sky);
      hemi.intensity = p.hemi[0]; hemi.color.set(p.hemi[1]); hemi.groundColor.set(p.hemi[2]);
      dir.intensity = p.dir[0]; dir.color.set(p.dir[1]);
      bulbMat.color.copy(lumenColor).multiplyScalar(p.lumen);
      panels.forEach((pn, i) => (pn.material = (p.panels === 1 || (p.panels > 0 && i % 3 === 0)) ? panelMat : panelOffMat));
      fieldLights.forEach((l) => (l.intensity = p.field * 5));
      inner.intensity = p.inner * 5; alarm.intensity = 0;
      lamp.intensity = { night: 7, purge: 9, dusk: 2.5 }[name] || 0;
    },
    /** Apaga los paneles uno a uno (atardecer). */
    async lightsOff(audio, waitFn) {
      for (let i = 0; i < panels.length; i++) { panels[i].material = panelOffMat; if (i % 3 === 0) audio.clunk(); await waitFn(0.18); }
    },
    setDoor(open) { door.rotation.y = open ? -1.6 : 0; doorCol.on = !open; },
    setBarricade(on) { barricade.visible = on; if (on) { door.rotation.y = 0; doorCol.on = true; } },
    setGate(open) { gate.visible = !open; gateCol.on = !open; },
    isInside(p) { return p.x > -10 && p.x < 10 && p.z > -22 && p.z < -10; },
    followLamp(p, cam) { const dx = cam.x - p.x, dz = cam.z - p.z, d = Math.hypot(dx, dz) || 1; lamp.position.set(p.x + (dx / d) * 1.6, 2.3, p.z + (dz / d) * 1.6); },
    update(dt, t) {
      if (phaseName === 'purge') alarm.intensity = (Math.sin(t * 6) > 0 ? 14 : 1);
      else if (phaseName === 'night') inner.intensity = 4.5 * (Math.random() < 0.03 ? 0.2 : 1);
      if (anomalies.visible) anomalies.children.forEach((c, i) => { c.position.y = 1.2 + i * 0.5 + Math.sin(t * 0.8 + i) * 0.3; c.rotation.y += dt * 0.2; c.rotation.x += dt * 0.1; });
      iris.scale.setScalar(1 + Math.sin(t * 1.3) * 0.08);
      antTip.material.color.set(Math.sin(t * 4) > 0 ? '#ff3b3b' : '#330000');
      for (const p of plots) if (p.state === 'growing') { p.grow = Math.min(1, p.grow + dt / 4); p.sprout.scale.y = 0.4 + p.grow * 1.6; p.sprout.position.y = 0.12 + p.sprout.scale.y * 0.2; if (p.grow >= 1) { p.state = 'ripe'; p.bulb.visible = true; } }
      for (const p of plots) if (p.state === 'ripe') { p.bulb.scale.setScalar(1 + Math.sin(t * 3) * 0.1); }
    },
    resetPlots() { for (const p of plots) { p.state = 'empty'; p.grow = 0; p.sprout.visible = false; p.bulb.visible = false; p.wet.visible = false; p.sprout.scale.y = 1; } },
  };
  api.setPhase('day');
  return api;
}
