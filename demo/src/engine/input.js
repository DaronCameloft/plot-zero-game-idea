// Entrada: teclado + ratón (pointer lock con respaldo de arrastre).
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedSet = new Set();
    this.dx = 0; this.dy = 0;
    this.dragging = false;
    this.lastInput = performance.now();
    this.enabled = true;

    const typing = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    addEventListener('keydown', (e) => {
      if (typing(e)) return;
      this.lastInput = performance.now();
      if (!this.keys.has(e.code)) this.pressedSet.add(e.code);
      this.keys.add(e.code);
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F2'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      this.lastInput = performance.now();
      this.dragging = true;
      if (this.wantsLock && canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch { /* sin pointer lock */ }
      }
      e.preventDefault();
    });
    addEventListener('mouseup', () => { this.dragging = false; });
    addEventListener('mousemove', (e) => {
      const locked = document.pointerLockElement === canvas;
      if (locked || this.dragging) {
        this.dx += e.movementX || 0; this.dy += e.movementY || 0;
        this.lastInput = performance.now();
      }
    });
    this.wantsLock = true;
  }

  down(code) { return this.enabled && this.keys.has(code); }
  pressed(code) { return this.enabled && this.pressedSet.has(code); }
  /** Pulsación ignorando `enabled` (para diálogos y menús). */
  rawPressed(code) { return this.pressedSet.has(code); }
  mouse() { const m = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return m; }
  idleSeconds() { return (performance.now() - this.lastInput) / 1000; }
  endFrame() { this.pressedSet.clear(); }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }
}
