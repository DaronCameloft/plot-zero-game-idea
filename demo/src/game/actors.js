import * as THREE from 'three';
import { Lucidity } from './state.js';

// Colisiones AABB con rango vertical (suelo vs. ductos).
export function resolveCollisions(pos, r, colliders, bound = 112, y0 = pos.y, y1 = pos.y + 1.6) {
  for (const c of colliders) {
    if (!c.on || c.y1 <= y0 || c.y0 >= y1) continue;
    const cx = Math.max(c.x0, Math.min(pos.x, c.x1)), cz = Math.max(c.z0, Math.min(pos.z, c.z1));
    const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); pos.x = cx + (dx / d) * r; pos.z = cz + (dz / d) * r; }
      else { const o = [[pos.x - c.x0, -1, 0], [c.x1 - pos.x, 1, 0], [pos.z - c.z0, 0, -1], [c.z1 - pos.z, 0, 1]].sort((a, b) => a[0] - b[0])[0]; if (o[1]) pos.x = o[1] < 0 ? c.x0 - r : c.x1 + r; else pos.z = o[2] < 0 ? c.z0 - r : c.z1 + r; }
    }
  }
  const d = Math.hypot(pos.x, pos.z); if (d > bound) { pos.x *= bound / d; pos.z *= bound / d; }
}
export function pointBlocked(x, y, z, colliders) { for (const c of colliders) if (c.on && y > c.y0 && y < c.y1 && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return true; return false; }
const angleLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

// ---------------------------------------------------------------- jugador (el despierto)
export class Player {
  constructor(game, actor) {
    this.g = game; this.actor = actor; this.pos = actor.root.position;
    this.yaw = 0; this.pitch = 0.2; this.control = true; this.stepAcc = 0; this.moving = 0;
    this.hesitate = 0; this.camScripted = false; this.lookAt = new THREE.Vector3();
    this.mode = 'walk'; this.crouch = false; this.hidden = false; this.locker = null; this.carry = null; this.breath = 1; this.holding = false;
  }
  place(v, yaw = 0) { this.pos.set(v.x, v.y || 0, v.z); this.yaw = yaw; this.actor.root.rotation.y = yaw + Math.PI; this.snapCamera = true; this.mode = this.pos.y > 2.5 && this.pos.y < 5 ? 'duct' : 'walk'; }
  update(dt) {
    const { input, noise, audio, run } = this.g;
    const m = input.mouse();
    if (!this.camScripted) {
      this.yaw -= m.dx * 0.0032; this.pitch = Math.max(-0.3, Math.min(0.85, this.pitch + m.dy * 0.0026));
      if (input.down('ArrowLeft')) this.yaw += dt * 2; if (input.down('ArrowRight')) this.yaw -= dt * 2;
      if (input.down('ArrowUp')) this.pitch = Math.max(-0.3, this.pitch - dt); if (input.down('ArrowDown')) this.pitch = Math.min(0.85, this.pitch + dt);
    }
    if (this.mode === 'locker') { this.actor.animate(dt, 0); return; }
    if (this.control && input.pressed('KeyC') && this.mode === 'walk') this.crouch = !this.crouch;
    let fx = 0, fz = 0;
    if (this.control) { if (input.down('KeyW')) fz -= 1; if (input.down('KeyS')) fz += 1; if (input.down('KeyA')) fx -= 1; if (input.down('KeyD')) fx += 1; }
    const len = Math.hypot(fx, fz);
    if (len > 0 && this.moving === 0 && run.lucidity >= 50 && Lucidity.stage(run) !== 'cumple' && Math.random() < 0.12) { this.hesitate = 0.5; document.body.classList.add('hesitate'); }
    if (this.hesitate > 0) { this.hesitate -= dt; if (this.hesitate <= 0) document.body.classList.remove('hesitate'); }
    const duct = this.mode === 'duct';
    const running = !duct && !this.crouch && !this.carry && (input.down('ShiftLeft') || input.down('ShiftRight'));
    let speed = 0;
    if (len > 0 && this.hesitate <= 0) {
      speed = duct ? 1.7 : this.crouch ? 1.5 : running ? 5.2 : this.carry ? 2.0 : 2.8;
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      const wx = (fx * cy + fz * sy) / len, wz = (-fx * sy + fz * cy) / len;
      this.pos.x += wx * speed * dt; this.pos.z += wz * speed * dt;
      this.actor.root.rotation.y = angleLerp(this.actor.root.rotation.y, Math.atan2(wx, wz), Math.min(1, dt * 12));
      this.stepAcc += speed * dt;
      if (this.stepAcc > (running ? 1.0 : 0.75)) {
        this.stepAcc = 0;
        const amt = duct ? 0.35 : running ? 1 : this.crouch ? 0.08 : this.carry ? 0.6 : 0.4;
        audio.footstep(amt, duct || this.g.world.isInside(this.pos) ? 'metal' : 'dirt');
        noise.emit(this.pos, amt, duct ? 'ducto' : running ? 'correr' : this.crouch ? 'sigilo' : 'pasos');
      }
    }
    this.moving = speed;
    if (this.pos.y < 9) resolveCollisions(this.pos, duct ? 0.3 : 0.35, this.g.world.colliders, this.g.world.boundR, this.pos.y + 0.05, this.pos.y + (duct ? 1.1 : 1.6));
    this.actor.crouch = this.crouch || duct; this.actor.root.visible = !duct && this.mode !== 'locker';
    this.actor.animate(dt, speed > 4 ? 2 : speed > 0 ? 1 : 0);
    if (this.carry) this.carry.position.set(this.pos.x, this.pos.y + 1.2, this.pos.z).addScaledVector(new THREE.Vector3(Math.sin(this.actor.root.rotation.y), 0, Math.cos(this.actor.root.rotation.y)), 0.35);
  }
  updateCamera(camera, dt) {
    if (this.camScripted) return;
    const W = this.g.world;
    if (this.mode === 'locker' && this.locker) {
      const L = this.locker; camera.position.set(L.x + L.fx * 0.05, 1.6, L.z + L.fz * 0.05);
      camera.lookAt(L.x + L.fx * 5 + Math.sin(this.yaw) * 2, 1.4, L.z + L.fz * 5 + Math.cos(this.yaw) * 2); return;
    }
    const duct = this.mode === 'duct'; const inside = W.isInside(this.pos) || duct;
    if (duct) { // vista en primera persona dentro del ducto (más claustrofóbica)
      const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      camera.position.set(this.pos.x, this.pos.y + 0.7, this.pos.z).addScaledVector(f, 0.2);
      camera.lookAt(this.pos.x + f.x * 4, this.pos.y + 0.55 - this.pitch * 0.8, this.pos.z + f.z * 4); this.snapCamera = false; return;
    }
    const dist = duct ? 1.3 : inside ? 3.0 : 4.6; const h = duct ? 0.7 : this.crouch ? 1.05 : 1.55;
    const head = new THREE.Vector3(this.pos.x, this.pos.y + h, this.pos.z);
    const dirv = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), duct ? 0.12 : Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    let d = dist; for (let s = 0.2; s <= dist; s += 0.2) { const p = head.clone().addScaledVector(dirv, s); if (pointBlocked(p.x, p.y, p.z, W.colliders) || (inside && !duct && p.y > 3.0)) { d = Math.max(0.3, s - 0.3); break; } }
    const target = head.clone().addScaledVector(dirv, d);
    if (duct) target.y = Math.min(target.y, this.pos.y + 1.15);
    if (this.snapCamera) { camera.position.copy(target); this.snapCamera = false; } else camera.position.lerp(target, Math.min(1, dt * 12));
    this.lookAt.set(this.pos.x, this.pos.y + h - (duct ? 0.1 : 0.1), this.pos.z); camera.lookAt(this.lookAt);
  }
  looksAt(camera, p, cosMin = 0.8) { const d = new THREE.Vector3().subVectors(p, camera.position).setY(0).normalize(); const f = new THREE.Vector3(); camera.getWorldDirection(f); f.setY(0).normalize(); return d.dot(f) > cosMin; }
}

// ---------------------------------------------------------------- seguidor de rutas (NPC y monstruos)
class PathMover {
  constructor(game, actor) { this.g = game; this.actor = actor; this.pos = actor.root.position; this.path = []; this.target = null; this.speed = 2.6; this.arrived = true; this.repath = 0; }
  goTo(v, speed = this.speed) { this.target = new THREE.Vector3(v.x, v.y || 0, v.z); this.speed = speed; this.arrived = false; this.path = this.g.nav.path(this.pos, this.target, { canDuct: this.canDuct }); if (this.path.length) this.path.shift(); }
  stop() { this.path = []; this.target = null; this.arrived = true; }
  step(dt, speed) {
    if (!this.target) return 0;
    const next = this.path[0] || this.target;
    const dx = next.x - this.pos.x, dz = next.z - this.pos.z, dy = (next.y || 0) - this.pos.y, d = Math.hypot(dx, dz);
    if (d < 0.5 && Math.abs(dy) < 0.3) { if (this.path.length) this.path.shift(); else { this.arrived = true; this.target = null; } return 0; }
    if (Math.abs(dy) > 0.3 && d < 1.2) { this.pos.y += Math.sign(dy) * Math.min(Math.abs(dy), dt * 3); return 0.5; } // trepar a/desde un ducto
    const s = Math.min(d, speed * dt); this.pos.x += (dx / d) * s; this.pos.z += (dz / d) * s;
    this.actor.root.rotation.y = angleLerp(this.actor.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
    return speed;
  }
}

// ---------------------------------------------------------------- compañeros en "piloto automático"
export class NPC extends PathMover {
  constructor(game, actor) { super(game, actor); this.canDuct = false; this.lookAtPos = null; }
  place(v, yaw = 0) { this.pos.set(v.x, 0, v.z); this.actor.root.rotation.y = yaw; this.stop(); }
  followTarget(obj, dist = 2.4) { this.follow = { obj, dist }; }
  update(dt) {
    let sp = 0;
    if (this.follow) { const o = this.follow.obj.pos; if (this.pos.distanceTo(o) > this.follow.dist + 1.5 && (this.arrived || (this.repath -= dt) < 0)) { this.goTo(o, 3.0); this.repath = 1; } if (this.pos.distanceTo(o) < this.follow.dist) this.stop(); }
    sp = this.step(dt, this.speed);
    if (!sp && this.lookAtPos) this.actor.root.rotation.y = angleLerp(this.actor.root.rotation.y, Math.atan2(this.lookAtPos.x - this.pos.x, this.lookAtPos.z - this.pos.z), Math.min(1, dt * 4));
    if (this.pos.y < 2) resolveCollisions(this.pos, 0.3, this.g.world.colliders, this.g.world.boundR);
    this.actor.animate(dt, sp > 4 ? 2 : sp > 0 ? 1 : 0);
  }
}

// ---------------------------------------------------------------- El Recolector: ciego, caza por sonido
export class RecolectorAI extends PathMover {
  constructor(game, actor) { super(game, actor); this.mode = 'off'; this.canDuct = false; this.patrol = []; this.pi = 0; this.zone = null; this.beat = 0; this.glitchT = 0; this.catchR = 1.4; this.heard = null; this.cool = 0; }
  setMode(mode, { patrol, zone, speed } = {}) { this.mode = mode; if (patrol) { this.patrol = patrol; this.pi = 0; } if (zone !== undefined) this.zone = zone; if (speed) this.speed = speed; this.actor.root.visible = mode !== 'off'; this.stop(); }
  place(v) { this.pos.set(v.x, 0, v.z); }
  inZone(p) { const r = this.zone && this.g.world.rooms[this.zone]; return !r || (p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1); }
  update(dt) {
    if (this.mode === 'off') return;
    const { player, noise, audio } = this.g;
    // oído
    const e = noise.loudest(this.pos, 26);
    if (e && e.label !== 'recolector' && this.inZone(e) && (!this.heard || this.heard.t !== e.t)) { this.heard = e; this.goTo({ x: e.x, z: e.z }, e.a > 0.7 ? 3.2 : 2.2); this.mode = 'investigate'; audio.static(0.12, 0.05); }
    if (this.mode === 'investigate' && this.arrived) { this.cool = 2.5; this.mode = 'listen'; }
    if (this.mode === 'listen') { this.cool -= dt; if (this.cool <= 0) this.mode = 'guard'; }
    if (this.mode === 'guard' && this.arrived && this.patrol.length) { const p = this.patrol[this.pi++ % this.patrol.length]; this.goTo(p, 1.3); }
    const sp = this.mode === 'listen' ? 0 : this.step(dt, this.speed);
    if (this.pos.y < 2) resolveCollisions(this.pos, 0.5, this.g.world.colliders, this.g.world.boundR);
    // glitch: salta fotogramas
    this.glitchT -= dt; if (this.glitchT <= 0 && sp > 0) { this.glitchT = 1 + Math.random() * 2.5; const f = new THREE.Vector3(Math.sin(this.actor.root.rotation.y), 0, Math.cos(this.actor.root.rotation.y)); this.pos.addScaledVector(f, 0.35); this.actor.root.visible = false; setTimeout(() => (this.actor.root.visible = this.mode !== 'off'), 60); }
    this.actor.animate(dt, sp);
    // clac-clac-clac + latido (se oye antes de verse)
    const dP = this.pos.distanceTo(player.pos);
    this.beat -= dt;
    if (sp > 0 && this.beat <= 0) { this.beat = 0.42; audio.clack(dP); noise.emit(this.pos, 0.3, 'recolector'); }
    if (dP < 12 && Math.random() < dt * 0.6) audio.heartbeat();
    if (dP < this.catchR && Math.abs(this.pos.y - player.pos.y) < 1 && !player.hidden && this.g.onCaught) this.g.onCaught('recolector');
    // casilleros: si respiras cerca, abre la puerta
    if (player.hidden && player.locker && dP < 3.2 && !player.holding && Math.random() < dt * 1.5) { player.locker.door.position.z = 0.6; if (this.g.onCaught) this.g.onCaught('recolector'); }
  }
}

// ---------------------------------------------------------------- Palimpsest (Forma de Cosecha): ve por las cámaras, no oye
export class PalimpsestAI extends PathMover {
  constructor(game, actor) { super(game, actor); this.mode = 'off'; this.canDuct = true; this.last = null; this.seeT = 0; this.catchR = 1.9; this.stumble = 0; this.search = 0; this.visY = 0; this.flip = 0; this.sawEnter = false; this.screech = 0; }
  setMode(mode, { speed } = {}) { this.mode = mode; if (speed) this.speed = speed; this.actor.root.visible = mode !== 'off'; this.stop(); }
  place(v) { this.pos.set(v.x, v.y || 0, v.z); }
  canSee() {
    const { player, world } = this.g; if (player.hidden) return false;
    const P = player.pos; const pr = world.roomAt(P.x, P.z); const inDuct = P.y > 2.5 && P.y < 5;
    if (inDuct) return this.pos.y > 2.5 && this.pos.distanceTo(P) < 7;
    const me = world.roomAt(this.pos.x, this.pos.z);
    if (this.pos.y < 2.5 && ((me && pr && me.id === pr.id && this.pos.distanceTo(P) < 18) || this.pos.distanceTo(P) < 6)) return true;
    for (const c of world.cameras) {
      if (!c.active || c.disabled > 0) continue;
      const dx = P.x - c.pos[0], dz = P.z - c.pos[2], d = Math.hypot(dx, dz); if (d > 20) continue;
      const lx = c.look[0] - c.pos[0], lz = c.look[1] - c.pos[2], ll = Math.hypot(lx, lz);
      if ((dx * lx + dz * lz) / (d * ll) < 0.62) continue;
      const cr = world.roomAt(c.pos[0], c.pos[2]); if (cr && pr && cr.id !== pr.id) continue;
      return true;
    }
    return false;
  }
  update(dt, t) {
    if (this.mode === 'off') return;
    const { player, world, audio, run } = this.g;
    if (this.mode === 'hunt') {
      this.seeT -= dt;
      if (this.seeT <= 0) {
        this.seeT = 0.25;
        if (this.canSee()) { const fresh = !this.last; this.last = player.pos.clone(); this.goTo(this.last, this.speed); this.search = 0; if (fresh || this.screech <= 0) { audio.screech(); this.screech = 6; } }
        else if (this.arrived && this.last) { // llegó a donde te vio por última vez: revisa casilleros cercanos
          this.search++;
          const near = world.lockers.filter((l) => Math.hypot(l.x - this.last.x, l.z - this.last.z) < 4).sort(() => Math.random() - 0.5)[0];
          if (near && this.search < 3) { near.door.position.z = 0.6; setTimeout(() => (near.door.position.z = 0.305), 900); audio.knock(); if (player.locker === near) { this.g.onCaught && this.g.onCaught('palimpsest'); } }
          if (this.search >= 3) { this.last = null; const tgt = player.pos.clone(); tgt.x += (Math.random() - 0.5) * 20; tgt.z += (Math.random() - 0.5) * 20; this.goTo(tgt, this.speed * 0.6); }
        }
      }
    }
    this.screech -= dt;
    // cuerpo incompleto (CUERPO bajo) = tropieza
    if (this.stumble > 0) this.stumble -= dt; else if (run.quota < 60 && Math.random() < dt * 0.12) { this.stumble = 0.9; audio.clunk(); }
    const sp = this.stumble > 0 || this.mode === 'still' ? 0 : this.step(dt, this.speed * (this.pos.y > 2.5 ? 0.55 : 1));
    if (this.pos.y < 2.5) resolveCollisions(this.pos, 0.6, world.colliders, world.boundR);
    // visual: por el techo en los pasillos, encogido en los ductos
    const room = world.roomAt(this.pos.x, this.pos.z); const dP = this.pos.distanceTo(player.pos);
    const ceil = room && room.kind === 'corridor' && dP > 5 && this.pos.y < 2.5;
    this.flip += ((ceil ? 1 : 0) - this.flip) * Math.min(1, dt * 5);
    const duct = this.pos.y > 2.5;
    this.actor.model.rotation.z = this.flip * Math.PI; this.actor.model.position.y = this.flip * (room ? room.h - 0.15 : 3);
    this.actor.root.scale.setScalar(duct ? 0.42 : 1);
    this.actor.animate(dt, sp);
    if (dP < 16 && Math.random() < dt * 0.8) audio.scrape();
    if (dP < this.catchR * (duct ? 0.6 : 1) && Math.abs(this.pos.y - player.pos.y) < 1.2 && !player.hidden && this.g.onCaught) this.g.onCaught('palimpsest');
  }
}
