import * as THREE from 'three';
import { lambert, basic, canvasTex } from '../engine/renderer.js';
import { faceCrop, suitTex, burlapTex, sackFaceTex, badgeTex, mk, drawPIP } from './paint.js';

// Personajes low-poly con cara pintada (misma pintura que el retrato de diálogo).
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

const LOOKS = {
  oliver: { skin: '#d6a383', suit: '#2f6066', hair: '#b3592b', top: '#d9692a', patch: '#d9692a' },
  claire: { skin: '#e2bfa3', suit: '#2f6066', hair: '#33221b', top: '#33221b', coat: '#cbc6b4' },
  elliot: { skin: '#8c5c42', suit: '#2f6066', hair: '#15100e', top: '#15100e', coat: '#5a5d45' },
};

export function buildPerson(id) {
  const L = LOOKS[id];
  const root = new THREE.Group(); root.name = id;
  const body = new THREE.Group(); root.add(body);
  const skin = lambert({ color: L.skin });
  const suit = lambert({ map: canvasTex(suitTex(L.suit, { patch: L.patch })) });
  const suitPlain = lambert({ color: L.suit });
  const dark = lambert({ color: '#1c1f1e' });

  // piernas (pivote en la cadera)
  const legs = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(0.12 * s, 0.86, 0);
    const leg = box(0.17, 0.78, 0.2, suitPlain); leg.position.y = -0.41; pivot.add(leg);
    const boot = box(0.19, 0.12, 0.28, dark); boot.position.set(0, -0.8, 0.04); pivot.add(boot);
    body.add(pivot); return pivot;
  });
  // torso
  const torso = box(0.48, 0.62, 0.27, [suitPlain, suitPlain, suitPlain, suitPlain, suit, suitPlain]);
  torso.position.y = 1.17; body.add(torso);
  // brazos (pivote en el hombro)
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(0.31 * s, 1.44, 0);
    const arm = box(0.13, 0.6, 0.15, suitPlain); arm.position.y = -0.3; pivot.add(arm);
    const hand = box(0.1, 0.12, 0.1, skin); hand.position.y = -0.66; pivot.add(hand);
    body.add(pivot); return pivot;
  });
  // cuello + cabeza (cara pintada en la cara frontal)
  const neck = box(0.12, 0.1, 0.12, skin); neck.position.y = 1.51; body.add(neck);
  const faceMat = lambert({ map: canvasTex(faceCrop(id)) });
  const hairMat = lambert({ color: L.hair });
  const topMat = lambert({ color: L.top });
  const head = new THREE.Group(); head.position.y = 1.72; body.add(head);
  const skull = box(0.27, 0.36, 0.29, [skin, skin, topMat, skin, faceMat, hairMat]);
  head.add(skull);
  const back = box(0.29, 0.3, 0.06, hairMat); back.position.set(0, 0.03, -0.14); head.add(back);

  // accesorios = silueta reconocible desde lejos
  if (id === 'oliver') {
    const vest = box(0.52, 0.42, 0.31, lambert({ color: '#2b4746' })); vest.position.y = 1.25; body.add(vest);
    for (const [x, y, c] of [[-0.12, 1.32, '#d9692a'], [0.14, 1.2, '#e8c547'], [0.05, 1.38, '#c94b4b']]) { const p = box(0.08, 0.06, 0.02, basic({ color: c })); p.position.set(x, y, 0.16); body.add(p); }
    const beanie = box(0.3, 0.14, 0.31, lambert({ color: '#d9692a' })); beanie.position.y = 0.14; head.add(beanie);
    // casco lleno de stickers colgado del cinturón
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: '#e8c547' }));
    helmet.position.set(-0.3, 0.92, 0.05); helmet.rotation.z = 1.2; body.add(helmet);
  }
  if (id === 'claire') {
    const coat = box(0.52, 0.9, 0.3, lambert({ color: L.coat })); coat.position.y = 1.0; body.add(coat);
    const inner = box(0.16, 0.5, 0.02, suitPlain); inner.position.set(0, 1.2, 0.155); body.add(inner);
    arms.forEach((a) => { a.children[0].material = lambert({ color: L.coat }); });
    const glasses = box(0.25, 0.06, 0.02, basic({ color: '#111' })); glasses.position.set(0, 0.02, 0.15); head.add(glasses);
    const pony = box(0.08, 0.28, 0.08, hairMat); pony.position.set(0, -0.08, -0.2); pony.rotation.x = 0.3; head.add(pony);
    const clip = box(0.22, 0.3, 0.02, lambert({ color: '#7a5a3a' })); clip.position.set(0, -0.6, 0.1); clip.rotation.x = -0.4; arms[1].add(clip);
  }
  if (id === 'elliot') {
    const coat = box(0.6, 0.8, 0.34, lambert({ color: L.coat })); coat.position.y = 1.08; body.add(coat);
    arms.forEach((a) => { a.children[0].material = lambert({ color: L.coat }); a.children[0].scale.set(1.25, 1.12, 1.2); a.children[1].position.y = -0.7; });
    const torch = box(0.1, 0.1, 0.16, dark); torch.position.set(-0.1, 1.3, 0.2); body.add(torch);
    const lens = box(0.08, 0.08, 0.02, basic({ color: '#fff2b0' })); lens.position.set(-0.1, 1.3, 0.29); body.add(lens);
    const phones = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 4, 8), dark); phones.rotation.x = Math.PI / 2; phones.position.y = 1.52; body.add(phones);
    const fringe = box(0.28, 0.1, 0.05, hairMat); fringe.position.set(0, 0.12, 0.14); head.add(fringe);
    const mop = box(0.31, 0.1, 0.31, hairMat); mop.position.y = 0.2; head.add(mop);
  }

  let phase = 0;
  const api = {
    id, root, body, head, arms, legs,
    /** speed: 0 quieto, 1 caminar, 2 correr */
    seated: false,
    animate(dt, speed) {
      if (api.seated) { legs.forEach((l) => (l.rotation.x = -1.45)); arms.forEach((a) => (a.rotation.x = -0.7)); body.position.y = -0.42; return; }
      phase += dt * (speed > 1.5 ? 11 : 7) * (speed > 0.05 ? 1 : 0);
      const amp = speed > 1.5 ? 0.8 : speed > 0.05 ? 0.45 : 0;
      const s = Math.sin(phase) * amp;
      legs[0].rotation.x = s; legs[1].rotation.x = -s;
      arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
      body.position.y = Math.abs(Math.cos(phase)) * amp * 0.05;
      if (amp === 0) { legs.forEach((l) => (l.rotation.x *= 0.8)); }
    },
  };
  root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return api;
}

// ---------------------------------------------------------------- El Recolector
export function buildRecolector(getBadgeName) {
  const root = new THREE.Group(); root.name = 'recolector';
  const pole = lambert({ color: '#4a3a26' });
  const burlap = lambert({ map: canvasTex(burlapTex()) });
  const face = lambert({ map: canvasTex(sackFaceTex()) });
  const coatMat = lambert({ color: '#3f3a2c' });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 5), pole); post.position.y = 1.2; root.add(post);
  const bar = new THREE.Group(); bar.position.y = 1.85; root.add(bar);
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 5), pole); crossbar.rotation.z = Math.PI / 2; bar.add(crossbar);
  // abrigo de uniformes viejos (parches de colores de las tripulaciones)
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 1.3, 6, 1, true), coatMat); coat.position.y = 1.25; root.add(coat);
  for (const [x, y, c] of [[0.2, 1.3, '#2f6066'], [-0.25, 1.0, '#5a5d45'], [0.05, 0.85, '#cbc6b4'], [-0.1, 1.5, '#d9692a']]) {
    const patch = box(0.22, 0.2, 0.04, lambert({ color: c })); patch.position.set(x, y, 0.42 - Math.abs(y - 1.2) * 0.2); root.add(patch);
  }
  const sleeves = [-1, 1].map((s) => { const m = box(0.7, 0.2, 0.2, coatMat); m.position.x = 0.5 * s; bar.add(m); const h = box(0.12, 0.18, 0.12, lambert({ color: '#2a2218' })); h.position.set(0.9 * s, -0.05, 0); bar.add(h); return m; });
  // cabezas: un saco de semillas por cada tripulación absorbida
  const heads = new THREE.Group(); heads.position.y = 2.25; root.add(heads);
  const sack = (r, y, x, mat) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat); m.position.set(x, y, 0); m.scale.y = 1.25; heads.add(m); return m; };
  sack(0.28, 0, 0, burlap);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), face); f.position.set(0, 0.0, 0.27); heads.add(f);
  sack(0.2, 0.32, 0.14, burlap); sack(0.17, 0.2, -0.22, burlap);
  // gafetes colgando
  const badges = new THREE.Group(); badges.position.set(0, 1.5, 0.45); root.add(badges);
  const setBadges = (list) => {
    badges.clear();
    list.slice(0, 4).forEach((b, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.13), basic({ map: canvasTex(badgeTex(b.name, b.cycle, { mine: b.mine })) })); m.position.set(-0.24 + i * 0.16, -i * 0.07, 0.01 * i); m.rotation.z = (i % 2 ? 0.2 : -0.15); badges.add(m); });
  };
  setBadges(getBadgeName ? getBadgeName() : [{ name: 'Elliot Park', cycle: 4816 }]);
  // piernas: aparecen de noche (de día es "solo" un espantapájaros)
  const legs = [-1, 1].map((s) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 1.1, 4), pole); l.position.set(0.15 * s, 0.55, 0); l.visible = false; root.add(l); return l; });

  let t = 0;
  return {
    root, heads, bar, setBadges,
    setMode(mode) { post.visible = mode === 'scarecrow'; legs.forEach((l) => (l.visible = mode !== 'scarecrow')); bar.rotation.z = 0; sleeves.forEach((s) => (s.rotation.z = 0)); },
    animate(dt, speed, hunting) {
      t += dt;
      if (speed > 0.05) {
        const s = Math.sin(t * 6);
        legs[0].rotation.x = s * 0.5; legs[1].rotation.x = -s * 0.5;
        root.children[0].position.y = 1.2;
        heads.rotation.z = Math.sin(t * 3) * 0.15;
        heads.position.y = 2.25 + Math.abs(s) * 0.06;
      }
      // tic de cabeza: "escucha"
      if (hunting) heads.rotation.y = Math.sin(t * 9) * 0.25 * (Math.sin(t * 0.7) > 0.6 ? 1 : 0.1);
    },
  };
}

// ---------------------------------------------------------------- monitores CRT con PIP
export function buildPipScreens() {
  const [c, g] = mk(64, 48);
  const tex = canvasTex(c);
  const mat = basic({ map: tex });
  let acc = 0; let glitch = 0; let talking = false;
  return {
    mat,
    set(opts) { if ('glitch' in opts) glitch = opts.glitch; if ('talking' in opts) talking = opts.talking; },
    update(dt, t) { acc += dt; if (acc < 0.08) return; acc = 0; drawPIP(g, 64, 48, t, { glitch, talking }); tex.needsUpdate = true; },
    makeCRT() {
      const grp = new THREE.Group();
      const casing = box(0.55, 0.45, 0.45, lambert({ color: '#2b2a26' })); grp.add(casing);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.33), mat); scr.position.z = 0.226; grp.add(scr);
      return grp;
    },
  };
}
