// Grafo de navegación generado desde el mapa: centros de sala, puntos de pasillo, ambos lados de cada puerta,
// la red de ductos (a y=3.5) con sus rejillas y una rejilla del campo exterior. A* sobre el grafo.
export function buildNav(MAP, world) {
  const nodes = []; const add = (x, z, room, y = 0, tag = '') => { nodes.push({ id: nodes.length, x, z, y, room, tag, edges: [] }); return nodes.length - 1; };
  const link = (a, b, kind = 'walk', door) => { const A = nodes[a], B = nodes[b]; const c = Math.hypot(A.x - B.x, A.z - B.z) + Math.abs(A.y - B.y) * 2; A.edges.push({ to: b, c, kind, door }); B.edges.push({ to: a, c, kind, door }); };
  const byRoom = {};
  for (const r of MAP.rooms) {
    const ids = []; const W = r.x1 - r.x0, D = r.z1 - r.z0;
    if (r.kind === 'corridor' || r.kind === 'airlock') {
      const long = W > D; const L = long ? W : D; const n = Math.max(1, Math.round(L / 6));
      for (let i = 0; i <= n; i++) { const t = 0.08 + 0.84 * i / n; ids.push(add(long ? r.x0 + W * t : (r.x0 + r.x1) / 2, long ? (r.z0 + r.z1) / 2 : r.z0 + D * t, r.id)); }
      for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i]);
    } else {
      const nx = W > 16 ? 2 : 1, nz = D > 16 ? 2 : 1;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ids.push(add(r.x0 + W * (i + 0.5) / nx, r.z0 + D * (j + 0.5) / nz, r.id));
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) link(ids[i], ids[j]);
    }
    byRoom[r.id] = ids;
  }
  // campo exterior
  const F = MAP.outdoor.farm; const farm = [];
  for (let x = F.x0 + 6; x < F.x1; x += 12) for (let z = F.z0 + 4; z < MAP.outdoor.limit.z1; z += 12) farm.push(add(x, z, 'FARM'));
  farm.push(add(0, MAP.outdoor.lens.z - 6, 'FARM', 0, 'lens'));
  for (let i = 0; i < farm.length; i++) for (let j = i + 1; j < farm.length; j++) { const A = nodes[farm[i]], B = nodes[farm[j]]; if (Math.hypot(A.x - B.x, A.z - B.z) < 17.5) link(farm[i], farm[j]); }
  byRoom.FARM = farm;
  // puertas: un nodo a cada lado, unido a los nodos de su sala
  for (const d of MAP.doors) {
    const sides = d.axis === 'x' ? [[d.x, d.z - 1.0], [d.x, d.z + 1.0]] : [[d.x - 1.0, d.z], [d.x + 1.0, d.z]];
    const pair = sides.map(([x, z]) => { const r = world.roomAt(x, z); const id = add(x, z, r ? r.id : 'FARM', 0, 'door'); (byRoom[r ? r.id : 'FARM'] || []).forEach((o) => link(id, o)); return id; });
    link(pair[0], pair[1], 'door', d.id);
  }
  // ductos
  for (const du of MAP.ducts) {
    const ids = du.pts.map(([x, z]) => add(x, z, 'DUCT:' + du.id, du.y, 'duct'));
    for (let i = 1; i < ids.length; i++) link(ids[i - 1], ids[i], 'duct');
    for (const [vx, vz, room] of du.vents) {
      let best = null, bd = 1e9; for (const id of ids) { const n = nodes[id]; const dd = Math.hypot(n.x - vx, n.z - vz); if (dd < bd) { bd = dd; best = id; } }
      const top = add(vx, vz, 'DUCT:' + du.id, du.y, 'vent'); if (bd > 0.1) link(top, best, 'duct');
      for (const id of ids) { const n = nodes[id]; if (id !== best && Math.abs(n.x - vx) < 0.01 + (n.x === vx ? 99 : 0) && Math.abs(n.z - vz) < 0.01 + (n.z === vz ? 99 : 0)) { /* tramo colineal ya enlazado */ } }
      const bottom = add(vx, vz + 0.8, room, 0, 'ventfloor'); (byRoom[room] || []).forEach((o) => link(bottom, o)); link(bottom, top, 'vent');
    }
  }
  // inserción de rejillas que caen dentro de un tramo: partir el tramo
  for (const du of MAP.ducts) {
    const tops = nodes.filter((n) => n.room === 'DUCT:' + du.id);
    for (const a of tops) for (const b of tops) if (a !== b && (a.x === b.x || a.z === b.z) && !a.edges.some((e) => e.to === b.id) && Math.hypot(a.x - b.x, a.z - b.z) < 40) {
      // enlaza solo si no hay otro nodo del mismo ducto entre ambos (vecinos colineales)
      const between = tops.some((c) => c !== a && c !== b && (a.x === b.x ? c.x === a.x && (c.z - a.z) * (c.z - b.z) < 0 : c.z === a.z && (c.x - a.x) * (c.x - b.x) < 0));
      if (!between) link(a.id, b.id, 'duct');
    }
  }
  const nearest = (x, z, y = 0, filter) => {
    const inDuct = y > 2.5; const r = inDuct ? null : world.roomAt(x, z); const pool = inDuct ? nodes.filter((n) => n.y > 2.5) : (r ? (byRoom[r.id] || []).map((i) => nodes[i]).concat(nodes.filter((n) => n.room === r.id && n.tag)) : farm.map((i) => nodes[i]));
    let best = null, bd = 1e9; for (const n of pool) { if (filter && !filter(n)) continue; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = n; } }
    return best;
  };
  function path(from, to, { canDuct = true, doors = world.doors } = {}) {
    const a = nearest(from.x, from.z, from.y), b = nearest(to.x, to.z, to.y); if (!a || !b) return [];
    const open = new Map([[a.id, 0]]), came = {}, g = { [a.id]: 0 }; const h = (n) => Math.hypot(n.x - b.x, n.z - b.z);
    const f = { [a.id]: h(a) }; let guard = 0;
    while (open.size && guard++ < 4000) {
      let cur = null, cf = 1e9; for (const [id] of open) if (f[id] < cf) { cf = f[id]; cur = id; }
      if (cur === b.id) break; open.delete(cur);
      for (const e of nodes[cur].edges) {
        if (e.kind === 'door' && doors[e.door] && !doors[e.door].open) continue;
        if (!canDuct && (e.kind === 'duct' || e.kind === 'vent')) continue;
        const ng = g[cur] + e.c; if (ng < (g[e.to] ?? 1e9)) { g[e.to] = ng; came[e.to] = cur; f[e.to] = ng + h(nodes[e.to]); open.set(e.to, 1); }
      }
    }
    if (!(b.id in g)) return [];
    const out = [b]; let c = b.id; while (came[c] !== undefined) { c = came[c]; out.unshift(nodes[c]); }
    return out;
  }
  return { nodes, byRoom, path, nearest };
}
