/** Tiny synthesized sound effects (no audio files). */
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};
    this.volume = 0.8;
    this.onUnlock = null;
  }

  /** Sound-effect volume, 0..1. */
  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(0.44 * v, this.ctx.currentTime, 0.05);
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      // out: everything; master: sound effects (music has its own bus into out)
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.44 * this.volume;
      this.master.connect(this.out);
      this.onUnlock?.();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** Rate-limit a sound so hordes don't clip the mix. */
  ok(name, gap) {
    const t = performance.now();
    if (this.muted || !this.ctx || t - (this.last[name] || 0) < gap) return false;
    this.last[name] = t;
    return true;
  }

  tone(type, f0, f1, dur, vol = 0.3) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur);
  }

  noise(dur, vol = 0.3, hp = 800) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp;
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  shoot() { if (this.ok('shoot', 60)) this.tone('square', 880, 320, 0.08, 0.12); }
  splatter() { if (this.ok('splat', 80)) { this.noise(0.18, 0.35, 400); this.tone('sawtooth', 300, 90, 0.15, 0.15); } }
  hit() { if (this.ok('hit', 40)) this.tone('triangle', 500, 700, 0.05, 0.12); }
  block() { if (this.ok('block', 70)) this.tone('square', 1400, 1200, 0.05, 0.08); }
  pop() { if (this.ok('pop', 45)) { this.tone('sine', 300, 1100, 0.12, 0.25); this.noise(0.08, 0.15, 2000); } }
  bigPop() { this.noise(0.5, 0.45, 200); this.tone('sine', 120, 600, 0.4, 0.35); }
  hurt() { if (this.ok('hurt', 120)) this.tone('sawtooth', 220, 80, 0.2, 0.22); }
  pickup() { if (this.ok('pick', 50)) this.tone('sine', 900, 1600, 0.09, 0.18); }
  heal() { this.tone('sine', 500, 1000, 0.25, 0.2); }
  beep() { if (this.ok('beep', 150)) { this.tone('square', 1200, 1250, 0.06, 0.08); setTimeout(() => this.ctx && this.tone('square', 1600, 1650, 0.06, 0.08), 90); } }
  spit() { if (this.ok('spit', 120)) this.tone('sine', 260, 120, 0.15, 0.15); }
  rev() { if (this.ok('rev', 300)) { this.tone('sawtooth', 60, 180, 0.7, 0.22); this.tone('square', 90, 240, 0.6, 0.08); } }
  slam() { if (!this.ok('slam', 120)) return; this.noise(0.6, 0.5, 120); this.tone('sine', 90, 40, 0.5, 0.4); }
  ping() { if (this.ok('ping', 50)) this.tone('triangle', 1800, 2400, 0.06, 0.1); }
  snip() { if (this.ok('snip', 120)) { this.tone('square', 2200, 1400, 0.04, 0.08); setTimeout(() => this.ctx && this.tone('square', 2200, 1400, 0.04, 0.08), 70); } }
  gust() { if (this.ok('gust', 500)) { this.noise(1.4, 0.18, 300); this.tone('sine', 140, 90, 1.2, 0.06); } }
  zap() { if (this.ok('zap', 120)) { this.noise(0.12, 0.2, 3000); this.tone('square', 1400, 300, 0.12, 0.08); } }
  crackle() { if (this.ok('crackle', 300)) this.noise(0.5, 0.14, 2500); }
  shatter() { if (this.ok('shatter', 90)) { this.noise(0.35, 0.3, 3500); this.tone('triangle', 2600, 1800, 0.2, 0.1); } }
  vine() { if (this.ok('vine', 90)) { this.tone('sine', 180, 420, 0.18, 0.2); this.noise(0.15, 0.12, 900); } }
  hum() { if (this.ok('hum', 90)) this.tone('sine', 520 + Math.random() * 200, 700, 0.12, 0.05); }
  vacuum() { if (this.ok('vac', 260)) this.noise(0.3, 0.12, 1800); }
  chime() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.ctx && this.tone('sine', f, f, 0.6, 0.18), i * 140));
  }
}
