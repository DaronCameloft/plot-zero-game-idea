import * as THREE from 'three';
import { lambert, basic, canvasTex } from '../engine/renderer.js';
import { soilTex, furrowTex, panelTex, signTex, plaqueTex, domeTex, quotaBoardTex, badgeTex, charlieDrawing, mk } from '../art/paint.js';

// Eden-0 construido desde data/eden0.json (copia de content/mapa/eden0.json: la misma fuente que el plano y Blender).
// Unidades en metros; +X este, +Z norte.

const PHASES = {
  day:   { sky: '#6f7f84', fog: [14, 70], hemi: [0.95, '#d6e6ea', '#3a332c'], dir: 0.8, lumen: 0.55, panels: 1, inside: 1.0, fogIn: '#1d2524' },
  dusk:  { sky: '#6b3b30', fog: [10, 55], hemi: [0.5, '#ff9a6a', '#2a1a14'], dir: 0.4, lumen: 0.8, panels: 0.4, inside: 0.8, fogIn: '#1d1614' },
  night: { sky: '#04060a', fog: [3, 30], hemi: [0.12, '#4a6a80', '#050505'], dir: 0.03, lumen: 1, panels: 0, inside: 0.45, fogIn: '#030405' },
  dawn:  { sky: '#4e5868', fog: [12, 60], hemi: [0.7, '#e8c0c8', '#2a2a30'], dir: 0.5, lumen: 0.6, panels: 1, inside: 0.9, fogIn: '#1a1d22' },
  purge: { sky: '#1a0408', fog: [4, 34], hemi: [0.22, '#ff6070', '#100005'], dir: 0.05, lumen: 1, panels: 0, inside: 0.25, fogIn: '#120306', alarm: true },
};
const LIGHT = { warm: '#ffe2b8', cold: '#dfefff', screen: '#bfe8ff', lumen: '#7cf7d4', red: '#ff4a4a', amber: '#ffc070', stage: '#ffd84a' };
const WALLC = { room: '#8a9893', corridor: '#7b8a86', airlock: '#6f8f86', forbidden: '#7a4a48', sealed: '#5d4f6e' };

export function buildWorld(scene, MAP, pip) {
  const colliders = [];
  const addCol = (x0, x1, z0, z1, y0 = 0, y1 = 3.4, id) => { const c = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1, id, on: true }; colliders.push(c); return c; };
  const B = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const T = 0.3;
  const rooms = Object.fromEntries(MAP.rooms.map((r) => [r.id, r]));

  // ---------------- materiales
  const wallMat = {}; const floorMat = {};
  for (const [k, c] of Object.entries(WALLC)) {
    wallMat[k] = lambert({ map: canvasTex(panelTex(c, { rust: k === 'forbidden' ? 1.4 : 0.6, seed: c.length }), [2, 1]) });
    floorMat[k] = lambert({ map: canvasTex(panelTex(k === 'forbidden' ? '#3a2626' : k === 'sealed' ? '#2e2838' : '#3d4442', { rust: 0.1, seed: 9 }), [6, 6]) });
  }
  const ceilMat = lambert({ color: '#2c3231' });
  const wood = lambert({ color: '#6a5038' });
  const steel = lambert({ color: '#4d5653' });
  const dark = lambert({ color: '#1f2322' });

  // ---------------- luces
  const hemi = new THREE.HemisphereLight('#d6e6ea', '#3a332c', 1); scene.add(hemi);
  const dir = new THREE.DirectionalLight('#fffbe8', 0.8); dir.position.set(-20, 60, 30); scene.add(dir);
  const pool = Array.from({ length: 6 }, () => { const l = new THREE.PointLight('#ffffff', 0, 14, 1.3); scene.add(l); return l; });
  const alarm = new THREE.PointLight('#ff2040', 0, 30, 1.2); scene.add(alarm);
  scene.fog = new THREE.Fog('#6f7f84', 14, 70);
  const anchors = []; // {x,y,z,color,room,mesh}

  // ---------------- salas: suelo, techo, muros con huecos de puerta, lámparas
  const doorsOn = (axis, c, a0, a1) => MAP.doors.filter((d) => d.axis === axis && Math.abs((axis === 'x' ? d.z : d.x) - c) < 0.6 && (axis === 'x' ? d.x : d.z) > a0 - 1 && (axis === 'x' ? d.x : d.z) < a1 + 1)
    .map((d) => { const p = axis === 'x' ? d.x : d.z; return [p - d.w / 2, p + d.w / 2]; }).sort((a, b) => a[0] - b[0]);
  const segs = (a0, a1, gaps) => { const out = []; let cur = a0; for (const [g0, g1] of gaps) { if (g0 > cur) out.push([cur, Math.min(g0, a1)]); cur = Math.max(cur, g1); } if (cur < a1) out.push([cur, a1]); return out.filter((s) => s[1] - s[0] > 0.05); };
  const panelOn = basic({ color: '#f4f6ee' });
  for (const r of MAP.rooms) {
    const { x0, x1, z0, z1, h, kind } = r; const W = x1 - x0, D = z1 - z0;
    B(W, 0.1, D, floorMat[kind], (x0 + x1) / 2, -0.05, (z0 + z1) / 2);
    if (r.id !== 'INV') B(W, 0.12, D, ceilMat, (x0 + x1) / 2, h + 0.06, (z0 + z1) / 2);
    const wm = wallMat[kind];
    for (const [axis, wc, a0, a1, off] of [['x', z0, x0, x1, T / 2], ['x', z1, x0, x1, -T / 2], ['z', x0, z0, z1, T / 2], ['z', x1, z0, z1, -T / 2]]) {
      const gaps = doorsOn(axis, wc, a0, a1); const c = wc + off;
      for (const [s0, s1] of segs(a0, a1, gaps)) {
        if (axis === 'x') { B(s1 - s0, h, T, wm, (s0 + s1) / 2, h / 2, c); addCol(s0, s1, c - T / 2, c + T / 2, 0, h); }
        else { B(T, h, s1 - s0, wm, c, h / 2, (s0 + s1) / 2); addCol(c - T / 2, c + T / 2, s0, s1, 0, h); }
      }
      for (const [g0, g1] of gaps) if (h > 2.5) { if (axis === 'x') B(g1 - g0, h - 2.5, T, wm, (g0 + g1) / 2, 2.5 + (h - 2.5) / 2, c); else B(T, h - 2.5, g1 - g0, wm, c, 2.5 + (h - 2.5) / 2, (g0 + g1) / 2); }
    }
    // lámparas de techo (anclas de luz)
    const col = LIGHT[r.light] || '#ffffff';
    const step = r.kind === 'corridor' ? 8 : 7;
    const nx = Math.max(1, Math.round(W / step)), nz = Math.max(1, Math.round(D / step));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = x0 + (i + 0.5) * W / nx, z = z0 + (j + 0.5) * D / nz;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.4), basic({ color: col })); m.position.set(x, h - 0.03, z); scene.add(m);
      anchors.push({ x, y: h - 0.4, z, color: col, room: r.id, mesh: m, on: true, base: col });
    }
    // rótulo
    if (r.kind !== 'corridor') {
      const red = r.kind === 'forbidden', vio = r.kind === 'sealed';
      const t = signTex([r.name.toUpperCase(), red ? 'ACCESO RESTRINGIDO' : vio ? 'SELLADO' : 'EDEN-0'], { w: 512, h: 96, bg: red ? '#c9b458' : vio ? '#b9a6d0' : '#d9d4c4', font: 'bold 22px monospace' });
      r._sign = t;
    }
  }

  // ---------------- puertas (paneles con estado)
  const doors = {};
  const doorCol = { door: '#566b67', locked: '#a8862a', sealed: '#6a4a8a', forbidden: '#8a2626', airlock: '#3d6b62' };
  for (const d of MAP.doors) {
    const ent = { ...d, open: d.type === 'open' || d.type === 'door', mesh: null, col: null };
    if (d.type !== 'open') {
      const g = new THREE.Group(); g.position.set(d.x, 0, d.z); scene.add(g);
      const panel = B(d.axis === 'x' ? d.w : 0.14, 2.45, d.axis === 'x' ? 0.14 : d.w, lambert({ color: doorCol[d.type] }), 0, 1.22, 0, g);
      if (d.type !== 'door') { const strip = B(d.axis === 'x' ? d.w * 0.9 : 0.16, 0.12, d.axis === 'x' ? 0.16 : d.w * 0.9, basic({ color: d.type === 'forbidden' ? '#ff3b3b' : d.type === 'sealed' ? '#b07cf7' : d.type === 'airlock' ? '#7cf7d4' : '#ffd84a' }), 0, 0.88, 0, panel); ent.strip = strip; }
      ent.mesh = g; ent.panel = panel;
      ent.col = d.axis === 'x' ? addCol(d.x - d.w / 2, d.x + d.w / 2, d.z - 0.15, d.z + 0.15, 0, 2.5, 'door:' + d.id) : addCol(d.x - 0.15, d.x + 0.15, d.z - d.w / 2, d.z + d.w / 2, 0, 2.5, 'door:' + d.id);
    }
    ent.set = (open) => { ent.open = open; if (ent.col) ent.col.on = !open; if (ent.panel) { ent.panel.position.y = open ? 3.7 : 1.22; ent.panel.visible = !open || (rooms[d.link[0]]?.h || 3.2) > 3.8; } };
    ent.set(ent.open);
    doors[d.id] = ent;
  }
  // rótulos sobre las puertas principales de cada sala
  for (const r of MAP.rooms) if (r._sign) {
    const d = MAP.doors.find((x) => x.link.includes(r.id) && x.link.some((l) => l === 'C1' || l === 'C2'));
    if (!d) continue;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.64), basic({ map: canvasTex(r._sign) }));
    const out = d.link[0] === r.id ? d.link[1] : d.link[0]; const ro = rooms[out];
    if (d.axis === 'x') { const dirz = (ro.z0 + ro.z1) / 2 > d.z ? 1 : -1; s.position.set(d.x, 2.85, d.z + dirz * 0.32); s.rotation.y = dirz > 0 ? 0 : Math.PI; }
    else { const dirx = (ro.x0 + ro.x1) / 2 > d.x ? 1 : -1; s.position.set(d.x + dirx * 0.32, 2.85, d.z); s.rotation.y = dirx > 0 ? Math.PI / 2 : -Math.PI / 2; }
    scene.add(s);
  }

  // ---------------- ductos (túneles a y=3.5) y rejillas
  const ductMat = lambert({ map: canvasTex(panelTex('#5f6866', { rust: 0.3, seed: 33 }), [1, 4]), side: THREE.DoubleSide });
  const vents = [];
  for (const du of MAP.ducts) {
    const y = du.y, w = du.w / 2, hh = du.h;
    for (let i = 0; i < du.pts.length - 1; i++) {
      const [ax, az] = du.pts[i], [bx, bz] = du.pts[i + 1];
      const x0 = Math.min(ax, bx) - w, x1 = Math.max(ax, bx) + w, z0 = Math.min(az, bz) - w, z1 = Math.max(az, bz) + w;
      B(x1 - x0, 0.06, z1 - z0, ductMat, (x0 + x1) / 2, y - 0.03, (z0 + z1) / 2);
      B(x1 - x0, 0.06, z1 - z0, ductMat, (x0 + x1) / 2, y + hh, (z0 + z1) / 2);
      if (ax === bx) { for (const s of [-1, 1]) { B(0.06, hh, z1 - z0, ductMat, ax + s * w, y + hh / 2, (z0 + z1) / 2); addCol(ax + s * w - 0.05, ax + s * w + 0.05, z0, z1, y - 0.1, y + hh); } }
      else { for (const s of [-1, 1]) { B(x1 - x0, hh, 0.06, ductMat, (x0 + x1) / 2, y + hh / 2, az + s * w); addCol(x0, x1, az + s * w - 0.05, az + s * w + 0.05, y - 0.1, y + hh); } }
    }
    // tapas en los extremos
    for (const [px, pz] of [du.pts[0], du.pts[du.pts.length - 1]]) {
      const [qx, qz] = du.pts[0][0] === px && du.pts[0][1] === pz ? du.pts[1] : du.pts[du.pts.length - 2];
      const dx = Math.sign(px - qx), dz = Math.sign(pz - qz);
      addCol(px + dx * w - 0.1 + (dx ? 0 : -w), px + dx * w + 0.1 + (dx ? 0 : w), pz + dz * w - 0.1 + (dz ? 0 : -w), pz + dz * w + 0.1 + (dz ? 0 : w), y - 0.1, y + hh);
    }
    for (const [vx, vz, room] of du.vents) {
      const grate = B(1.1, 0.05, 1.1, lambert({ color: '#9aa39f', wireframe: false }), vx, rooms[room].h - 0.02, vz);
      for (let k = -2; k <= 2; k++) B(1.0, 0.04, 0.05, dark, vx, rooms[room].h - 0.06, vz + k * 0.2);
      const ladder = B(0.5, rooms[room].h, 0.08, steel, vx, rooms[room].h / 2, vz + 0.6);
      vents.push({ duct: du.id, x: vx, z: vz, room, grate, floorY: 0, ductY: y });
    }
  }

  // ---------------- casilleros
  const lockerTex = (() => { const [c, g] = mk(32, 64); g.fillStyle = '#7b8a86'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#2a2f2e'; for (let y = 6; y < 22; y += 3) g.fillRect(6, y, 20, 1.5); g.fillStyle = '#c9b458'; g.fillRect(24, 30, 3, 8); g.strokeStyle = '#3a403e'; g.strokeRect(1, 1, 30, 62); return c; })();
  const lockerMat = lambert({ map: canvasTex(lockerTex) });
  const lockers = [];
  for (const L of MAP.lockers) {
    const n = Math.max(1, Math.round((L.x1 - L.x0) / L.step) + 1);
    const rot = { n: 0, s: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[L.face];
    const fdir = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] }[L.face];
    for (let i = 0; i < n; i++) {
      const x = L.x0 + i * L.step, z = L.z;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
      B(0.9, 2.0, 0.6, steel, 0, 1.0, 0, g);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.9), lockerMat); door.position.set(0, 1.0, 0.305); g.add(door);
      addCol(x - 0.45, x + 0.45, z - 0.3, z + 0.3, 0, 2.0, 'locker');
      lockers.push({ x, z, fx: fdir[0], fz: fdir[1], room: L.room, group: g, door, inside: { x: x, z: z }, front: new THREE.Vector3(x + fdir[0] * 0.9, 0, z + fdir[1] * 0.9) });
    }
  }

  // ---------------- cámaras de seguridad (ojos de Palimpsest en la Purga)
  const cameras = MAP.cameras.map((c) => {
    const g = new THREE.Group(); g.position.set(...c.pos); scene.add(g);
    B(0.25, 0.2, 0.4, dark, 0, 0, 0, g);
    const lamp = B(0.08, 0.08, 0.08, basic({ color: '#331010' }), 0, 0.12, -0.18, g);
    g.lookAt(c.look[0], c.pos[1] - 1.5, c.look[1]);
    return { ...c, group: g, lamp, active: false, disabled: 0 };
  });

  // ---------------- props
  const crtScreens = [];
  const crt = (x, y, z, rot, scale = 1) => { const m = pip.makeCRT(); m.position.set(x, y, z); m.rotation.y = rot; m.scale.setScalar(scale); scene.add(m); crtScreens.push(m); return m; };
  const deg = (d) => (d || 0) * Math.PI / 180;
  const special = {};
  const [boardC, boardG] = mk(128, 72); const boardTex = canvasTex(boardC);
  for (const p of MAP.props) {
    const { x, z } = p; const R = deg(p.rot);
    switch (p.type) {
      case 'bunk': B(1.0, 0.35, 2.1, steel, x, 0.3, z); B(1.0, 0.1, 2.1, lambert({ color: '#cfd6cf' }), x, 0.52, z); B(1.0, 0.35, 2.1, steel, x, 1.55, z); B(1.0, 0.1, 2.1, lambert({ color: '#cfd6cf' }), x, 1.77, z); addCol(x - 0.55, x + 0.55, z - 1.1, z + 1.1, 0, 2); break;
      case 'crt': crt(x, 1.4, z, R); B(0.6, 0.06, 0.5, steel, x, 1.12, z); break;
      case 'pipcrt': crt(x, 1.6, z, R, 2.4); special.pipBig = { x, z }; break;
      case 'table': { B(2.6, 0.08, 1.3, wood, x, 0.8, z); for (const [a, b] of [[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]]) B(0.08, 0.8, 0.08, wood, x + a, 0.4, z + b); addCol(x - 1.3, x + 1.3, z - 0.65, z + 0.65, 0, 1);
        for (const [a, b, r] of [[-1.7, 0, Math.PI / 2], [1.7, 0, -Math.PI / 2], [0, -1.1, 0]]) { B(0.5, 0.06, 0.5, wood, x + a, 0.48, z + b); }
        special.seats = [[x - 1.7, z, Math.PI / 2], [x + 1.7, z, -Math.PI / 2], [x, z - 1.1, 0]]; special.table = { x, z };
        for (let i = 0; i < 7; i++) { const c = B(0.12, 0.01, 0.17, basic({ color: i % 3 ? '#e9e4d4' : '#c94b4b' }), x - 0.6 + Math.random() * 1.2, 0.85, z - 0.3 + Math.random() * 0.6); c.rotation.y = Math.random() * 3; } break; }
      case 'counter': B(6, 0.95, 0.8, lambert({ color: '#9aa39f' }), x, 0.47, z); addCol(x - 3, x + 3, z - 0.4, z + 0.4, 0, 1); break;
      case 'fridge': B(1, 2, 0.8, lambert({ color: '#cfd6cf' }), x, 1, z); addCol(x - 0.5, x + 0.5, z - 0.4, z + 0.4, 0, 2); break;
      case 'sofa': B(3, 0.5, 1, lambert({ color: '#5a4a3a' }), x, 0.25, z); B(3, 0.6, 0.25, lambert({ color: '#5a4a3a' }), x, 0.7, z + 0.4); addCol(x - 1.5, x + 1.5, z - 0.5, z + 0.5, 0, 1); break;
      case 'stalls': for (let i = 0; i < 3; i++) { B(0.08, 2, 1.6, steel, x + i * 1.4, 1, z); B(1.3, 2, 0.08, lambert({ color: '#7b8a86' }), x + i * 1.4 + 0.7, 1, z - 0.8); } break;
      case 'hatch': B(1.2, 0.04, 1.2, dark, x, 0.02, z); B(0.4, 0.05, 0.08, basic({ color: '#c9b458' }), x, 0.06, z + 0.4); special.hatch = { x, z }; break;
      case 'monitorwall': { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { const m = B(1.0, 0.7, 0.2, dark, x - 3.5 + i * 1.0, 1.0 + j * 0.8, z); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), basic({ color: '#2f5a50' })); s.position.set(x - 3.5 + i * 1.0, 1.0 + j * 0.8, z + 0.11); scene.add(s); (special.monitors ||= []).push(s); } B(8.5, 0.8, 1, dark, x, 0.4, z + 0.8); addCol(x - 4.3, x + 4.3, z - 0.3, z + 1.3, 0, 2); special.monitorWall = { x, z: z + 1.6 }; break; }
      case 'radio': B(0.6, 0.35, 0.35, lambert({ color: '#4b4a3a' }), x, 1.0, z); B(1.4, 0.8, 0.8, dark, x, 0.4, z); B(0.02, 0.6, 0.02, dark, x + 0.2, 1.45, z); addCol(x - 0.7, x + 0.7, z - 0.4, z + 0.4, 0, 1.2); special.radio = { x, z }; break;
      case 'fusebox': B(0.2, 1.2, 1.4, lambert({ color: '#5d635d' }), x, 1.3, z); for (let i = 0; i < 4; i++) B(0.05, 0.12, 0.2, basic({ color: ['#c94b4b', '#2a5bd7', '#e8c547', '#4f8a3a'][i] }), x - 0.12, 1.0 + i * 0.18, z); special.fusebox = { x: x - 1.0, z }; break;
      case 'bench': B(4, 0.9, 1.2, lambert({ color: '#cfd6cf' }), x, 0.45, z); for (let i = 0; i < 5; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6), basic({ color: '#7cf7d4' })); j.position.set(x - 1.6 + i * 0.8, 1.05, z); scene.add(j); } addCol(x - 2, x + 2, z - 0.6, z + 0.6, 0, 1); break;
      case 'scanner': B(1, 1.6, 1, lambert({ color: '#9aa39f' }), x, 0.8, z); B(0.7, 0.4, 0.05, basic({ color: '#7cf7d4' }), x, 1.3, z - 0.51); special.scanner = { x, z: z - 1.2 }; addCol(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 0, 2); break;
      case 'filter': B(2, 2.2, 0.8, lambert({ color: '#7b8a86' }), x, 1.1, z); B(1.6, 1.6, 0.05, lambert({ color: '#3a4a3a' }), x, 1.2, z - 0.42); special.filter = { x, z: z - 1.3 }; addCol(x - 1, x + 1, z - 0.4, z + 0.4, 0, 2.2); break;
      case 'racks': { const rk = lambert({ color: '#4d5653' }); for (let i = 0; i < 4; i++) { const xx = x - 9 + i * 6; B(1, 2.4, 22, rk, xx, 1.2, z); addCol(xx - 0.5, xx + 0.5, z - 11, z + 11, 0, 2.4); } break; }
      case 'bioreactor': { const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4.6, 12, 1, true), lambert({ color: '#7cf7d4', transparent: true, opacity: 0.35, side: THREE.DoubleSide })); t.position.set(x, 2.3, z); scene.add(t); B(6.4, 0.3, 6.4, steel, x, 0.15, z); B(6.4, 0.3, 6.4, steel, x, 4.75, z); addCol(x - 3, x + 3, z - 3, z + 3, 0, 5); special.bioreactor = { x, z, mesh: t }; break; }
      case 'uniformpile': { const colors = ['#2f6066', '#5a5d45', '#e7e3d8', '#de6c2a']; for (let i = 0; i < 28; i++) { const m = B(0.9, 0.18, 0.7, lambert({ color: colors[i % 4] }), x + (Math.random() - 0.5) * 3.5, 0.1 + Math.random() * 1.2 * (1 - Math.abs(i - 14) / 14), z + (Math.random() - 0.5) * 3.5); m.rotation.set(Math.random() * 0.4, Math.random() * 3, Math.random() * 0.4); } special.pile = { x, z }; break; }
      case 'terminal': { B(0.8, 1.3, 0.5, dark, x, 0.65, z); const [c, g] = mk(128, 72); quotaBoardTex(c, g, 71, true); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), basic({ map: canvasTex(c) })); s.position.set(x - 0.26, 1.1, z); s.rotation.y = -Math.PI / 2; scene.add(s); special.compTerminal = { x: x - 1.0, z, c, g, s }; break; }
      case 'generator': { const g = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5, 12), lambert({ map: canvasTex(panelTex('#5d635d', { stripe: true, seed: 3 }), [3, 1]) })); g.rotation.z = Math.PI / 2; g.position.set(x, 3, z); scene.add(g); addCol(x - 2.5, x + 2.5, z - 3, z + 3, 0, 6); special.generator = { x, z }; break; }
      case 'converter': { B(3, 2.4, 2.4, lambert({ color: '#7b6a3a' }), x, 1.2, z); B(1, 0.4, 0.6, basic({ color: '#7cf7d4' }), x, 2.0, z - 1.21); addCol(x - 1.5, x + 1.5, z - 1.2, z + 1.2, 0, 2.4); special.converter = { x, z: z - 2.0 };
        const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.24), basic({ map: boardTex })); board.position.set(x + 2.6, 2.6, z - 1.0); scene.add(board); break; }
      case 'dials': { B(3, 1.6, 0.4, dark, x, 1.2, z); for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), basic({ color: '#e9e4d4' })); d.position.set(x - 0.9 + i * 0.9, 1.35, z + 0.21); scene.add(d); } special.dials = { x, z: z + 1.2 }; break; }
      case 'silo': { const s = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 7, 12), lambert({ color: '#7d837d' })); s.position.set(x, 3.5, z); scene.add(s); addCol(x - 3, x + 3, z - 3, z + 3, 0, 7); break; }
      case 'benches': B(14, 0.45, 0.6, wood, x, 0.25, z); addCol(x - 7, x + 7, z - 0.3, z + 0.3, 0, 0.5); break;
      case 'shelves': for (let i = 0; i < 3; i++) { B(0.6, 2.4, 3, steel, x + i * 1.6, 1.2, z); addCol(x + i * 1.6 - 0.3, x + i * 1.6 + 0.3, z - 1.5, z + 1.5, 0, 2.4); } break;
      case 'pipes': for (let i = 0; i < 4; i++) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 18, 6), steel); p2.rotation.z = Math.PI / 2; p2.position.set(x - 3, 0.5 + i * 0.6, z + 0.3); scene.add(p2); } break;
      case 'stage': { B(14, 1.2, 6, lambert({ color: '#3a2a4a' }), x, 0.6, z); addCol(x - 7, x + 7, z - 3, z + 3, 0, 1.2);
        const curtain = B(14, 6, 0.2, lambert({ color: '#7a1e2e' }), x, 4.2, z + 3.2); special.curtain = curtain;
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), basic({ map: canvasTex(signTex(['¡BIENVENIDOS, FUTUROS PASANTES!'], { w: 512, h: 64, bg: '#e8c547', font: 'bold 24px monospace' })) })); sign.position.set(x, 7.2, z + 3.3); scene.add(sign);
        special.stage = { x, z }; break; }
      case 'seats': { for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) { B(1.0, 0.5, 0.8, lambert({ color: '#5a2a3a' }), x - 6 + j * 1.7, 0.25, z - 4 + i * 1.8); B(1.0, 0.8, 0.15, lambert({ color: '#5a2a3a' }), x - 6 + j * 1.7, 0.7, z - 3.6 + i * 1.8); } break; }
      case 'drawings': { for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.68), basic({ map: canvasTex(charlieDrawing(4800 + i * 3)) })); d.position.set(x + 0.05, 1.6 + (i % 2) * 0.9, z - 5 + i * 2); d.rotation.y = Math.PI / 2; scene.add(d); } special.drawings = { x: x + 1.2, z: z - 1 }; break; }
      case 'animatronic': special.animatronic = { x, z }; break;
      case 'servers': { const rk = lambert({ map: canvasTex((() => { const [c, g] = mk(32, 64); g.fillStyle = '#1f2322'; g.fillRect(0, 0, 32, 64); for (let y = 2; y < 64; y += 4) { g.fillStyle = '#2a3030'; g.fillRect(2, y, 28, 3); g.fillStyle = Math.random() < 0.3 ? '#ff3b3b' : '#7cf7d4'; g.fillRect(24, y + 1, 2, 1); } return c; })(), [3, 1]) });
        const rows = [[-7, -36], [-2.5, -36], [2.5, -36], [7, -36]];
        for (const [dx] of rows) { const xx = x + dx; B(1.1, 2.6, 16, rk, xx, 1.3, -36); addCol(xx - 0.55, xx + 0.55, -44, -28, 0, 2.6); }
        special.servers = { x, z }; break; }
      case 'cabinet': { B(1.6, 2, 0.8, lambert({ color: '#6b3a3a' }), x, 1, z); B(0.08, 1.6, 0.6, basic({ color: '#ff6b6b' }), x - 0.81, 1, z); addCol(x - 0.8, x + 0.8, z - 0.4, z + 0.4, 0, 2); special[p.id] = { x: x - 1.4, z }; break; }
      case 'core': { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.6, 10), lambert({ color: '#3a1416' })); c.position.set(x, 1.3, z); scene.add(c); const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 4, 16), basic({ color: '#ff3b3b' })); ring.rotation.x = Math.PI / 2; ring.position.set(x, 1.6, z); scene.add(ring); addCol(x - 1, x + 1, z - 1, z + 1, 0, 2.6); special[p.id] = { x, z: z + 2.0, ring }; break; }
      case 'valve': { const v = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 4, 10), basic({ color: '#c94b4b' })); v.position.set(x, 1.2, z); v.rotation.y = Math.PI / 2; scene.add(v); B(0.2, 1.2, 0.2, steel, x + 0.2, 0.6, z); special.valve = { x: x - 0.9, z, mesh: v }; break; }
    }
  }
  const setBoard = (v, body) => { quotaBoardTex(boardC, boardG, v, body); boardTex.needsUpdate = true; };
  setBoard(0, false);

  // ---------------- exterior: suelo, campos, torre, Límite y La Lente, domo
  const O = MAP.outdoor;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(MAP.dome.radius + 5, 32), lambert({ map: canvasTex(soilTex(), [60, 60]) }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.11; scene.add(ground);
  const domeMat = new THREE.MeshBasicMaterial({ map: canvasTex(domeTex(), [8, 4]), side: THREE.BackSide, fog: false, color: '#6f7f84' });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(MAP.dome.radius, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat));
  const panelMat = new THREE.MeshBasicMaterial({ color: '#fffbe8', fog: false, side: THREE.DoubleSide }), panelOff = new THREE.MeshBasicMaterial({ color: '#111', fog: false, side: THREE.DoubleSide });
  const skyPanels = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, el = 1.0, R = MAP.dome.radius - 1; const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), panelMat); p.position.set(Math.cos(a) * R * Math.cos(el), R * Math.sin(el), Math.sin(a) * R * Math.cos(el)); p.lookAt(0, 0, 0); scene.add(p); skyPanels.push(p); }
  const seam = new THREE.Mesh(new THREE.TorusGeometry(MAP.dome.radius * 0.72, 0.3, 3, 80), new THREE.MeshBasicMaterial({ color: '#7cf7d4', fog: false }));
  seam.rotation.x = Math.PI / 2; seam.position.y = MAP.dome.radius * 0.69; seam.visible = false; scene.add(seam);
  const furrowMat = lambert({ map: canvasTex(furrowTex(), [1, 10]) });
  const F = O.furrows; const rowsX = [];
  for (let x = F.x0; x <= F.x1; x += F.step) if (!(x >= F.skip[0] && x <= F.skip[1])) { rowsX.push(x); B(1.3, 0.25, F.z1 - F.z0, furrowMat, x, 0.12, (F.z0 + F.z1) / 2); }
  const bulbGeo = new THREE.IcosahedronGeometry(0.17, 0); const bulbMat = new THREE.MeshBasicMaterial({ color: '#7cf7d4' }); const stemMat = lambert({ color: '#2f5a3a' });
  const per = Math.floor((F.z1 - F.z0) / 2.6); const n = rowsX.length * per;
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, n), stems = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), stemMat, n);
  const m4 = new THREE.Matrix4(); let k = 0;
  for (const x of rowsX) for (let i = 0; i < per; i++) { const z = F.z0 + 1 + i * 2.6; m4.makeTranslation(x, 0.5, z); stems.setMatrixAt(k, m4); m4.makeTranslation(x, 0.85, z); bulbs.setMatrixAt(k, m4); k++; }
  scene.add(bulbs, stems);
  const plots = O.plots.map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    B(2.2, 0.12, 2.2, lambert({ color: '#3a2c20' }), 0, 0.06, 0, g);
    for (const [a, b] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) B(0.08, 0.5, 0.08, wood, a, 0.25, b, g);
    const sprout = B(0.06, 0.4, 0.06, stemMat, 0, 0.3, 0, g); sprout.visible = false;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat); bulb.position.y = 0.75; bulb.visible = false; g.add(bulb);
    const wet = B(2.0, 0.02, 2.0, lambert({ color: '#1d1a2a' }), 0, 0.13, 0, g); wet.visible = false;
    return { group: g, pos: new THREE.Vector3(x, 0, z), state: 'empty', grow: 0, sprout, bulb, wet };
  });
  const plaques = [['TRIPULACIÓN · CICLO 3.902', 'M. OKAFOR · D. REYES', 'S. LINDQVIST'], ['TRIPULACIÓN · CICLO 4.410', 'J. NAKAMURA · P. ROSSI', 'A. BELLAMY'], ['TRIPULACIÓN · CICLO 4.816', 'O. HALE · C. MOREAU', 'E. PARK'], ['EQUIPO ARCADIADEVS', '"gracias por jugar"', 'CICLO 0']];
  plaques.forEach((lines, i) => { const x = rowsX[i * 3] ?? 0; B(0.1, 0.9, 0.1, wood, x, 0.45, O.plaques.z); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), basic({ map: canvasTex(plaqueTex(lines)) })); pl.position.set(x, 0.95, O.plaques.z - 0.06); pl.rotation.y = Math.PI; scene.add(pl); });
  // torre de riego
  const Tw = O.tower;
  for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) B(0.2, Tw.h, 0.2, steel, Tw.x + dx, Tw.h / 2, Tw.z + dz);
  for (let y = 2; y < Tw.h; y += 3) { B(2.8, 0.1, 0.1, steel, Tw.x, y, Tw.z - 1.3); B(2.8, 0.1, 0.1, steel, Tw.x, y, Tw.z + 1.3); }
  B(3.8, 0.2, 3.8, steel, Tw.x, Tw.h - 1.5, Tw.z); const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 8), lambert({ color: '#66706c' })); tank.position.set(Tw.x, Tw.h, Tw.z); scene.add(tank);
  for (let y = 0.4; y < Tw.h - 1.5; y += 0.45) B(0.7, 0.05, 0.08, steel, Tw.x - 1.45, y, Tw.z);
  const antTip = B(0.25, 0.25, 0.25, basic({ color: '#ff3b3b' }), Tw.x + 1.3, Tw.h + 3, Tw.z + 1.3); B(0.06, 3, 0.06, steel, Tw.x + 1.3, Tw.h + 1.5, Tw.z + 1.3);
  addCol(Tw.x - 1.4, Tw.x + 1.4, Tw.z - 1.4, Tw.z + 1.4, 0, Tw.h);
  // El Límite: rocas y árboles muertos; La Lente
  const rock = lambert({ color: '#3a3836' });
  for (let i = 0; i < 40; i++) { const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 1.6, 0), rock); const x = (Math.random() - 0.5) * 80, z = O.limit.z0 + Math.random() * (O.limit.z1 - O.limit.z0); if (Math.abs(x) < 5) continue; r2.position.set(x, 0.3, z); scene.add(r2); }
  for (let i = 0; i < 24; i++) { const g = new THREE.Group(); const x = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 30), z = O.limit.z0 + Math.random() * 30; g.position.set(x, 0, z); B(0.25, 4 + Math.random() * 3, 0.25, lambert({ color: '#2a2420' }), 0, 2.5, 0, g); const br = B(0.12, 2, 0.12, lambert({ color: '#2a2420' }), 0.5, 3.6, 0, g); br.rotation.z = -0.8; scene.add(g); }
  const lens = new THREE.Group(); lens.position.set(O.lens.x, O.lens.y, O.lens.z); lens.rotation.y = Math.PI; scene.add(lens);
  lens.add(new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.9, 6, 18), basic({ color: '#202426' })));
  const glass = new THREE.Mesh(new THREE.CircleGeometry(5.1, 18), basic({ color: '#05080a' })); glass.position.z = 0.05; lens.add(glass);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(1.6, 14), basic({ color: '#ff2040' })); iris.position.z = 0.1; lens.add(iris);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.45, 8), basic({ color: '#ffffff' })); glint.position.set(-1.8, 1.8, 0.12); lens.add(glint);
  const vp = O.vigilPlate; B(1.2, 1.0, 0.15, lambert({ color: '#3a1416' }), vp.x, 0.9, vp.z); B(1.0, 0.1, 0.16, basic({ color: '#ff3b3b' }), vp.x, 1.3, vp.z);
  const boundR = MAP.dome.radius - 6;

  // ---------------- API
  let phaseName = 'day'; let insideK = 1;
  const roomAt = (x, z) => { for (const r of MAP.rooms) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return r; return null; };
  const api = {
    MAP, rooms, colliders, doors, vents, lockers, cameras, plots, special, anchors, crtScreens, seam, skyPanels, lens, iris, setBoard, boundR,
    get phase() { return phaseName; },
    roomAt, isInside: (p) => !!roomAt(p.x, p.z),
    setPhase(name) {
      const p = PHASES[name]; phaseName = name; insideK = p.inside;
      api._p = p;
      scene.background = new THREE.Color(p.sky); domeMat.color.set(p.sky);
      hemi.intensity = p.hemi[0]; hemi.color.set(p.hemi[1]); hemi.groundColor.set(p.hemi[2]); dir.intensity = p.dir;
      bulbMat.color.set('#7cf7d4').multiplyScalar(p.lumen);
      skyPanels.forEach((pn, i) => (pn.material = (p.panels === 1 || (p.panels > 0 && i % 3 === 0)) ? panelMat : panelOff));
      for (const a of anchors) { a.mesh.material.color.set(name === 'purge' ? (a.room === 'C1' || a.room === 'C2' ? '#ff3040' : a.base) : a.base).multiplyScalar(Math.max(0.15, p.inside)); }
    },
    async skyOff(audio, wait) { for (let i = 0; i < skyPanels.length; i++) { skyPanels[i].material = panelOff; if (i % 3 === 0) audio.clunk(); await wait(0.15); } },
    /** Atmósfera según si la cámara está dentro o fuera. */
    updateAtmo(cam, t) {
      const p = api._p; const inside = !!roomAt(cam.x, cam.z) || cam.y > 3.3 && cam.y < 5;
      scene.fog.color.set(inside ? p.fogIn : p.sky);
      scene.fog.near = inside ? (phaseName === 'day' || phaseName === 'dawn' ? 10 : 3) : p.fog[0];
      scene.fog.far = inside ? (phaseName === 'day' || phaseName === 'dawn' ? 48 : 26) : p.fog[1];
      hemi.intensity = inside ? Math.max(0.1, p.hemi[0] * 0.55) : p.hemi[0];
      // reparto de las 6 luces del pool entre las lámparas más cercanas
      const near = anchors.filter((a) => a.on).map((a) => [a, (a.x - cam.x) ** 2 + (a.z - cam.z) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, pool.length);
      pool.forEach((l, i) => {
        const e = near[i]; if (!e) { l.intensity = 0; return; }
        const a = e[0]; l.position.set(a.x, a.y, a.z); l.color.set(phaseName === 'purge' && (a.room === 'C1' || a.room === 'C2') ? '#ff3040' : a.color);
        let k2 = 7 * insideK; if (phaseName === 'night' || phaseName === 'purge') k2 *= (Math.sin(t * 13 + i * 7) > 0.96 ? 0.1 : 1);
        l.intensity = k2;
      });
      if (phaseName === 'purge') { alarm.position.set(cam.x, 3, cam.z); alarm.intensity = Math.sin(t * 5) > 0 ? 6 : 0.5; } else alarm.intensity = 0;
    },
    setCameras(on) { for (const c of cameras) { c.active = on; c.lamp.material.color.set(on ? '#ff2030' : '#331010'); } },
    lightsRoom(id, on) { for (const a of anchors) if (a.room === id) { a.on = on; a.mesh.visible = on; } },
    update(dt, t) {
      for (const c of cameras) { if (c.disabled > 0) { c.disabled -= dt; c.lamp.material.color.set('#111'); } else if (c.active) c.lamp.material.color.set(Math.sin(t * 6) > 0 ? '#ff2030' : '#661018'); }
      iris.scale.setScalar(1 + Math.sin(t * 1.3) * 0.08); antTip.material.color.set(Math.sin(t * 4) > 0 ? '#ff3b3b' : '#330000');
      for (const p of plots) if (p.state === 'growing') { p.grow = Math.min(1, p.grow + dt / 3); p.sprout.scale.y = 0.4 + p.grow * 1.6; p.sprout.position.y = 0.12 + p.sprout.scale.y * 0.2; if (p.grow >= 1) { p.state = 'ripe'; p.bulb.visible = true; } }
      if (special.bioreactor) special.bioreactor.mesh.material.opacity = 0.3 + Math.sin(t * 2) * 0.08;
    },
    resetPlots() { for (const p of plots) { p.state = 'empty'; p.grow = 0; p.sprout.visible = false; p.bulb.visible = false; p.wet.visible = false; p.sprout.scale.y = 1; } },
  };
  api.setPhase('day');
  return api;
}
