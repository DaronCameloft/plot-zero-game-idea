import * as THREE from 'three';
import { Lucidity } from './state.js';

export function resolveCollisions(pos, r, colliders, bound = 68) {
  for (const c of colliders) {
    if (!c.on) continue;
    const cx = Math.max(c.x0, Math.min(pos.x, c.x1)), cz = Math.max(c.z0, Math.min(pos.z, c.z1));
    const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) { const d = Math.sqrt(d2); pos.x = cx + (dx / d) * r; pos.z = cz + (dz / d) * r; }
      else { // dentro del rectángulo: sacar por el lado más cercano
        const opts = [[pos.x - c.x0, -1, 0], [c.x1 - pos.x, 1, 0], [pos.z - c.z0, 0, -1], [c.z1 - pos.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
        if (opts[1]) pos.x = opts[1] < 0 ? c.x0 - r : c.x1 + r; else pos.z = opts[2] < 0 ? c.z0 - r : c.z1 + r;
      }
    }
  }
  const d = Math.hypot(pos.x, pos.z); if (d > bound) { pos.x *= bound / d; pos.z *= bound / d; }
}

const angleLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

// ---------------------------------------------------------------- jugador (el despierto)
export class Player {
  constructor(game, person) {
    this.g = game; this.person = person; this.pos = person.root.position;
    this.yaw = 0; this.pitch = 0.22; this.control = true; this.stepAcc = 0; this.moving = 0;
    this.hesitate = 0; this.camScripted = false; this.camPos = new THREE.Vector3(); this.lookAt = new THREE.Vector3();
  }
  place(v, yaw = 0) { this.pos.set(v.x, 0, v.z); this.yaw = yaw; this.person.root.rotation.y = yaw + Math.PI; this.snapCamera = true; }
  update(dt) {
    const { input, noise, audio, run } = this.g;
    const m = input.mouse();
    if (!this.camScripted) {
      this.yaw -= m.dx * 0.0032; this.pitch = Math.max(-0.25, Math.min(0.85, this.pitch + m.dy * 0.0026));
      if (input.down('ArrowLeft')) this.yaw += dt * 2; if (input.down('ArrowRight')) this.yaw -= dt * 2;
      if (input.down('ArrowUp')) this.pitch = Math.max(-0.25, this.pitch - dt); if (input.down('ArrowDown')) this.pitch = Math.min(0.85, this.pitch + dt);
    }
    let fx = 0, fz = 0;
    if (this.control) {
      if (input.down('KeyW')) fz -= 1; if (input.down('KeyS')) fz += 1;
      if (input.down('KeyA')) fx -= 1; if (input.down('KeyD')) fx += 1;
    }
    const len = Math.hypot(fx, fz);
    // Lucidez alta: el personaje a veces tarda en obedecer (efecto de "Disiente")
    if (len > 0 && this.moving === 0 && Lucidity.stage(run) !== 'cumple' && run.lucidity >= 50 && Math.random() < 0.18) { this.hesitate = 0.55; document.body.classList.add('hesitate'); }
    if (this.hesitate > 0) { this.hesitate -= dt; if (this.hesitate <= 0) document.body.classList.remove('hesitate'); }
    const run_ = input.down('ShiftLeft') || input.down('ShiftRight');
    const sneak = input.down('KeyC') || input.down('ControlLeft');
    let speed = 0;
    if (len > 0 && this.hesitate <= 0) {
      speed = run_ ? 5.2 : sneak ? 1.4 : 2.8;
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      const wx = (fx * cy + fz * sy) / len, wz = (-fx * sy + fz * cy) / len;
      this.pos.x += wx * speed * dt; this.pos.z += wz * speed * dt;
      this.person.root.rotation.y = angleLerp(this.person.root.rotation.y, Math.atan2(wx, wz), Math.min(1, dt * 12));
      this.stepAcc += speed * dt;
      const stride = run_ ? 1.0 : 0.75;
      if (this.stepAcc > stride) {
        this.stepAcc = 0;
        const amt = run_ ? 1 : sneak ? 0.1 : 0.4;
        audio.footstep(amt, this.g.world.isInside(this.pos) ? 'metal' : 'dirt');
        noise.emit(this.pos, amt, run_ ? 'correr' : sneak ? 'sigilo' : 'pasos');
      }
    }
    this.moving = speed;
    if (this.pos.y < 2) resolveCollisions(this.pos, 0.35, this.g.world.colliders);
    this.person.animate(dt, speed > 4 ? 2 : speed > 0 ? 1 : 0);
  }
  updateCamera(camera, dt) {
    if (this.camScripted) return;
    const inside = this.g.world.isInside(this.pos);
    const dist = inside ? 2.6 : 4.4;
    const h = 1.55;
    const cx = this.pos.x + Math.sin(this.yaw) * Math.cos(this.pitch) * dist;
    const cz = this.pos.z + Math.cos(this.yaw) * Math.cos(this.pitch) * dist;
    const cyy = Math.min(inside ? 3.2 : 30, this.pos.y + h + Math.sin(this.pitch) * dist);
    const target = new THREE.Vector3(cx, Math.max(0.4, cyy), cz);
    if (this.snapCamera) { camera.position.copy(target); this.snapCamera = false; }
    else camera.position.lerp(target, Math.min(1, dt * 10));
    this.lookAt.set(this.pos.x, this.pos.y + 1.45, this.pos.z);
    camera.lookAt(this.lookAt);
  }
  /** ¿La cámara está mirando hacia `p`? (para "mirar atrás" y el espantapájaros que se mueve si no lo miras) */
  looksAt(camera, p, cosMin = 0.8) {
    const d = new THREE.Vector3().subVectors(p, camera.position).setY(0).normalize();
    const f = new THREE.Vector3(); camera.getWorldDirection(f); f.setY(0).normalize();
    return d.dot(f) > cosMin;
  }
}

// ---------------------------------------------------------------- compañeros en "piloto automático"
// Se mueven demasiado perfecto: velocidad constante, giros instantáneos, repiten frases.
export class NPC {
  constructor(game, person) {
    this.g = game; this.person = person; this.pos = person.root.position;
    this.target = null; this.follow = null; this.speed = 2.6; this.arrived = true; this.visible = true; this.lookAtPos = null;
  }
  place(v, yaw = 0) { this.pos.set(v.x, 0, v.z); this.person.root.rotation.y = yaw; this.target = null; this.arrived = true; }
  goTo(v, speed = 2.6) { this.target = new THREE.Vector3(v.x, 0, v.z); this.speed = speed; this.arrived = false; this.follow = null; }
  followTarget(obj, dist = 2.4) { this.follow = { obj, dist }; this.target = null; }
  stop() { this.target = null; this.follow = null; this.arrived = true; }
  update(dt) {
    let tgt = this.target, stopAt = 0.15;
    if (this.follow) { tgt = this.follow.obj.pos; stopAt = this.follow.dist; }
    let moving = 0;
    if (tgt) {
      const dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > stopAt) {
        const s = Math.min(d, this.speed * dt);
        this.pos.x += (dx / d) * s; this.pos.z += (dz / d) * s;
        this.person.root.rotation.y = Math.atan2(dx, dz); // giro instantáneo: "demasiado perfecto"
        moving = this.speed;
      } else if (this.target) { this.arrived = true; this.target = null; }
    }
    if (!moving && this.lookAtPos) this.person.root.rotation.y = angleLerp(this.person.root.rotation.y, Math.atan2(this.lookAtPos.x - this.pos.x, this.lookAtPos.z - this.pos.z), Math.min(1, dt * 4));
    resolveCollisions(this.pos, 0.35, this.g.world.colliders);
    this.person.animate(dt, moving > 4 ? 2 : moving > 0 ? 1 : 0);
  }
}

// ---------------------------------------------------------------- El Recolector
export class RecolectorAI {
  constructor(game, rec) {
    this.g = game; this.rec = rec; this.pos = rec.root.position;
    this.mode = 'scarecrow'; this.speed = 2.2; this.creep = false; this.unseen = 0; this.catchR = 1.3;
    this.wander = null; this.beat = 0; this.lastHeard = null; this.maxCreep = 4; this.crept = 0;
  }
  setMode(mode, { speed, scale = 1, creep = false } = {}) {
    this.mode = mode; this.creep = creep; this.crept = 0;
    if (speed) this.speed = speed;
    this.rec.root.scale.setScalar(scale); this.catchR = 1.3 * scale;
    this.rec.setMode(mode === 'scarecrow' ? 'scarecrow' : 'walk');
    this.rec.root.visible = mode !== 'off';
  }
  place(v) { this.pos.set(v.x, 0, v.z); }
  update(dt) {
    const { player, camera, noise, audio } = this.g;
    if (this.mode === 'off') return;
    const toP = new THREE.Vector3().subVectors(player.pos, this.pos).setY(0); const dP = toP.length();
    if (this.mode === 'scarecrow') {
      // "Cambia de lugar cuando nadie lo mira"
      if (this.creep) {
        const seen = player.looksAt(camera, this.pos, 0.55);
        this.unseen = seen ? 0 : this.unseen + dt;
        if (this.unseen > 2.5 && this.crept < this.maxCreep && dP > 6) { this.pos.addScaledVector(toP.normalize(), 1.6); this.crept++; this.unseen = 0; this.rec.root.rotation.y = Math.atan2(toP.x, toP.z); audio.creak(); }
      }
      this.rec.animate(dt, 0, false);
      return;
    }
    let target = null;
    const heard = noise.loudest(this.pos, this.mode === 'chase' ? 70 : 40);
    if (heard) { target = new THREE.Vector3(heard.x, 0, heard.z); this.lastHeard = target; }
    else if (this.mode === 'chase') target = player.pos.clone(); // en la Purga "huele" al despierto
    else if (this.lastHeard) target = this.lastHeard;
    else { if (!this.wander || this.pos.distanceTo(this.wander) < 1) this.wander = new THREE.Vector3((Math.random() - 0.5) * 24, 0, 2 + Math.random() * 22); target = this.wander; }
    let sp = 0;
    if (target) {
      const dv = new THREE.Vector3().subVectors(target, this.pos).setY(0); const d = dv.length();
      if (d > 0.3) { sp = this.speed * (this.mode === 'chase' && !heard ? 0.75 : 1); this.pos.addScaledVector(dv.normalize(), Math.min(d, sp * dt)); this.rec.root.rotation.y = Math.atan2(dv.x, dv.z); }
      else if (target === this.lastHeard) this.lastHeard = null;
    }
    resolveCollisions(this.pos, 0.5 * this.rec.root.scale.x, this.g.world.colliders, 70);
    this.rec.animate(dt, sp, true);
    // latido cuando está cerca (se oye antes de verse)
    this.beat -= dt;
    if (dP < 14 && this.beat <= 0) { audio.heartbeat(); this.beat = 0.4 + dP / 14; }
    if (dP < this.catchR && this.g.onCaught) this.g.onCaught();
  }
}
