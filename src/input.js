/**
 * Unified input: keyboard + mouse, gamepad, and twin virtual sticks on touch screens.
 * World axes: screen-up is -z, screen-right is +x.
 */

/** Virtual stick radius (px) and dead zone (fraction of the radius). */
const STICK_R = 56, DEAD = 0.12;
export class Input {
  constructor(canvas, stickLayer) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedOnce = new Set();
    this.mouse = { x: 0, y: 0, down: false, seen: false };
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.sticks = { left: null, right: null };
    this.stickLayer = stickLayer;
    this.usingTouch = false;
    this.usingPad = false;

    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) && !document.querySelector('#overlay.show')) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressedOnce.add(e.code);
      this.keys.add(e.code);
      this.usingTouch = false;
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; });

    canvas.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.seen = true; this.usingPad = false; });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; this.usingTouch = false; });
    addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('wheel', (e) => this.pressedOnce.add(e.deltaY > 0 ? 'WheelDown' : 'WheelUp'), { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const opts = { passive: false };
    canvas.addEventListener('touchstart', (e) => this.onTouch(e, 'start'), opts);
    canvas.addEventListener('touchmove', (e) => this.onTouch(e, 'move'), opts);
    canvas.addEventListener('touchend', (e) => this.onTouch(e, 'end'), opts);
    canvas.addEventListener('touchcancel', (e) => this.onTouch(e, 'end'), opts);
  }

  onTouch(e, phase) {
    e.preventDefault();
    this.usingTouch = true;
    for (const t of e.changedTouches) {
      if (phase === 'start') {
        const side = t.clientX < innerWidth / 2 ? 'left' : 'right';
        if (this.sticks[side]) continue;
        this.sticks[side] = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0, el: this.makeStick(t.clientX, t.clientY) };
      } else {
        for (const side of ['left', 'right']) {
          const s = this.sticks[side];
          if (!s || s.id !== t.identifier) continue;
          if (phase === 'end') { s.el.remove(); this.sticks[side] = null; continue; }
          let dx = t.clientX - s.ox, dy = t.clientY - s.oy, d = Math.hypot(dx, dy);
          // the base follows a thumb that drifts past the rim, so it never has to slide back
          if (d > STICK_R * 1.25) {
            const k = (d - STICK_R * 1.25) / d;
            s.ox += dx * k; s.oy += dy * k;
            s.el.style.left = `${s.ox}px`; s.el.style.top = `${s.oy}px`;
            dx = t.clientX - s.ox; dy = t.clientY - s.oy; d = Math.hypot(dx, dy);
          }
          // a small dead zone, then the full 0..1 range
          const m = Math.min(1, d / STICK_R), mag = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD);
          s.x = d ? (dx / d) * mag : 0; s.y = d ? (dy / d) * mag : 0;
          const kx = d ? (dx / d) * m * STICK_R : 0, ky = d ? (dy / d) * m * STICK_R : 0;
          s.el.lastChild.style.transform = `translate(${kx}px, ${ky}px)`;
        }
      }
    }
  }

  makeStick(x, y) {
    const el = document.createElement('div');
    el.className = 'stick';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.appendChild(document.createElement('div'));
    this.stickLayer.appendChild(el);
    return el;
  }

  pad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  /** Movement vector (x, z), length <= 1. */
  move() {
    let x = 0, z = 0;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) z -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) z += 1;
    if (this.sticks.left) { x = this.sticks.left.x; z = this.sticks.left.y; }
    const p = this.pad();
    if (p && Math.hypot(p.axes[0], p.axes[1]) > 0.2) { x = p.axes[0]; z = p.axes[1]; this.usingPad = true; }
    const d = Math.hypot(x, z);
    if (d > 1) { x /= d; z /= d; }
    return { x, z };
  }

  /** Stick-based aim direction (touch or gamepad), or null when aiming with the mouse. */
  aimStick() {
    const s = this.sticks.right;
    if (s && Math.hypot(s.x, s.y) > 0.25) return { x: s.x, z: s.y };
    const p = this.pad();
    if (p && Math.hypot(p.axes[2], p.axes[3]) > 0.3) { this.usingPad = true; return { x: p.axes[2], z: p.axes[3] }; }
    return null;
  }

  firing() {
    if (this.sticks.right) return Math.hypot(this.sticks.right.x, this.sticks.right.y) > 0.35;
    const p = this.pad();
    if (p && ((p.buttons[7] && p.buttons[7].value > 0.3) || Math.hypot(p.axes[2], p.axes[3]) > 0.5)) return true;
    return this.mouse.down || this.keys.has('Space');
  }

  /** Edge-triggered action: true once per press. */
  pressed(...codes) {
    for (const c of codes) if (this.pressedOnce.has(c)) return true;
    return false;
  }

  /** Call at the end of each frame. Also folds gamepad buttons into edge events. */
  endFrame() {
    this.pressedOnce.clear();
    const p = this.pad();
    const prev = this.padPrev || [];
    if (p) {
      const now = p.buttons.map((b) => b.pressed);
      if (now[4] && !prev[4]) this.pressedOnce.add('PadPrev');
      if (now[5] && !prev[5]) this.pressedOnce.add('PadNext');
      if (now[9] && !prev[9]) this.pressedOnce.add('PadStart');
      ['PadA', 'PadB', 'PadX', 'PadY'].forEach((name, i) => { if (now[i] && !prev[i]) this.pressedOnce.add(name); });
      this.padPrev = now;
    }
  }

  clearSticks() {
    for (const side of ['left', 'right']) { this.sticks[side]?.el.remove(); this.sticks[side] = null; }
  }
}
