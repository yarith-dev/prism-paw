/**
 * Procedural music: a small step sequencer playing synthesized instruments (no audio files).
 * Each track is data: key, scale, chord progression, tempo and which layers play.
 * The lead melody is generated from a seed, so every track has its own tune that loops the same way.
 * Arrangement over loops: intro (no lead) → full → every fourth loop a lighter breakdown.
 * `setIntensity(1)` thickens the drums and lifts the arpeggio (beacon defense).
 */

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
};

// drum patterns, 16 steps per bar: x = hit, o = soft hit
const DRUMS = {
  pop: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  lofi: { kick: 'x......x..x.....', snare: '....o.......o...', hat: 'o.o.o.o.o.o.o.o.' },
  soft: { kick: 'x.......x.......', snare: '............o...', hat: '..o...o...o...o.' },
  tribal: { kick: 'x.....x...x.....', tom: '..o.x.....o.x.o.', shaker: 'oooooooooooooooo' },
  shuffle: { kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x..ox..ox..ox..o' },
  glitch: { kick: 'x.........x.....', snare: '........o.......', hat: 'o..o.o..o...oo.o' },
  drive: { kick: 'x...x...x...x...', snare: '....x.......x..o', hat: 'xoxoxoxoxoxoxoxo' },
  march: { kick: 'x..x..x.x..x..x.', snare: '....x..o....x.oo', hat: 'x.x.x.x.x.x.x.x.' },
  pulse: { kick: 'x.......x.......' },
};

// bass patterns: r = chord root, f = fifth, 8 = octave, - = hold
const BASS = {
  bounce: 'r.8.r.8.r.8.f.8.',
  walk: 'r...f...8...f...',
  drive: 'r.r.r.r.r.r.f.8.',
  long: 'r-------f-------',
  pump: 'r..r..r.r..r..f.',
  soft: 'r.......f.......',
};

const TRACKS = {
  title: { bpm: 100, root: 62, scale: 'major', prog: [0, 4, 5, 3], drums: 'soft', bass: 'walk', pad: 'warm', arp: { wave: 'triangle', rate: 2, shape: 'up' }, lead: { wave: 'bell', seed: 3, density: 0.55 } },
  hub: { bpm: 84, root: 65, scale: 'major', prog: [0, 5, 1, 4], sevenths: true, swing: 0.18, drums: 'lofi', bass: 'soft', pad: 'keys', lead: { wave: 'keys', seed: 7, density: 0.35 } },
  purrville: { bpm: 124, root: 60, scale: 'major', prog: [0, 0, 3, 4, 0, 5, 3, 4], drums: 'pop', bass: 'bounce', arp: { wave: 'square', rate: 2, shape: 'updown' }, lead: { wave: 'square', seed: 11, density: 0.6 } },
  jungle: { bpm: 104, root: 57, scale: 'dorian', prog: [0, 3, 0, 6], drums: 'tribal', bass: 'pump', pad: 'warm', arp: { wave: 'marimba', rate: 2, shape: 'random' }, lead: { wave: 'flute', seed: 19, density: 0.45 } },
  docks: { bpm: 112, root: 55, scale: 'mixolydian', prog: [0, 6, 3, 0], swing: 0.12, drums: 'shuffle', bass: 'walk', pad: 'air', arp: { wave: 'triangle', rate: 2, shape: 'updown' }, lead: { wave: 'flute', seed: 23, density: 0.55 } },
  wastes: { bpm: 92, root: 52, scale: 'phrygian', prog: [0, 1, 0, 6], drums: 'glitch', bass: 'long', pad: 'air', arp: { wave: 'square', rate: 1, shape: 'random', quiet: true }, lead: { wave: 'bell', seed: 29, density: 0.3 } },
  pale: { bpm: 76, root: 63, scale: 'lydian', prog: [0, 1, 4, 3], drums: 'pulse', bass: 'long', pad: 'air', arp: { wave: 'bell', rate: 2, shape: 'up' }, lead: { wave: 'bell', seed: 31, density: 0.35 } },
  'boss-1': { bpm: 140, root: 60, scale: 'minor', prog: [0, 5, 3, 4], drums: 'drive', bass: 'drive', arp: { wave: 'square', rate: 1, shape: 'up' }, lead: { wave: 'saw', seed: 41, density: 0.65 } },
  'boss-2': { bpm: 132, root: 57, scale: 'dorian', prog: [0, 6, 3, 4], drums: 'march', bass: 'drive', arp: { wave: 'marimba', rate: 1, shape: 'updown' }, lead: { wave: 'saw', seed: 43, density: 0.6 } },
  'boss-3': { bpm: 138, root: 55, scale: 'minor', prog: [0, 6, 5, 4], swing: 0.08, drums: 'drive', bass: 'drive', pad: 'air', arp: { wave: 'square', rate: 1, shape: 'updown' }, lead: { wave: 'saw', seed: 47, density: 0.6 } },
  'boss-4': { bpm: 130, root: 52, scale: 'phrygian', prog: [0, 1, 6, 1], drums: 'drive', bass: 'drive', arp: { wave: 'square', rate: 1, shape: 'random' }, lead: { wave: 'saw', seed: 53, density: 0.55 } },
  'boss-5': { bpm: 126, root: 60, scale: 'harmonic', prog: [0, 5, 3, 4, 0, 5, 1, 4], drums: 'march', bass: 'pump', pad: 'organ', arp: { wave: 'bell', rate: 1, shape: 'up' }, lead: { wave: 'saw', seed: 59, density: 0.5 } },
  ending: { bpm: 80, root: 65, scale: 'major', prog: [0, 4, 5, 3, 1, 4, 0, 0], drums: 'soft', bass: 'soft', pad: 'warm', arp: { wave: 'bell', rate: 2, shape: 'up' }, lead: { wave: 'flute', seed: 61, density: 0.4 } },
};

/**
 * Music themes: alternative soundtracks. Every theme keeps each track's instruments (the same
 * pad, arpeggio, lead and drum kit) but writes a different song for it: new key, tempo,
 * chord progression, bass line, drum groove, arpeggio shape and a freshly seeded melody.
 * Choices are picked per track from the theme's pools with a fixed hash, so a theme always
 * plays the same songs.
 */
const kitFamily = (drums) => (drums === 'tribal' ? 'tribal' : drums === 'pulse' ? 'pulse' : drums ? 'standard' : null);
const MINORISH = new Set(['minor', 'dorian', 'phrygian', 'harmonic']);

export const THEMES = {
  original: { label: 'Original' },
  sunny: {
    label: 'Sunny Side', shift: 2, tempo: 1.08, seed: 101, density: 0.12, arp: 'up', bass: 'r.8.f.8.r.8.f.8.',
    progs: { major: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 3, 0, 4, 0, 3, 4, 4]], minor: [[0, 6, 5, 6], [0, 3, 6, 4]] },
    drums: {
      standard: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx' },
      tribal: { kick: 'x...x...x...x...', tom: '..x...x...x.o.x.', shaker: 'o.o.o.o.o.o.o.o.' },
      pulse: { kick: 'x...x...x...x...' },
    },
  },
  moonlit: {
    label: 'Moonlit', shift: -3, tempo: 0.86, seed: 202, density: -0.15, arp: 'updown', bass: 'r-----f-r-----8-',
    progs: { major: [[5, 3, 0, 4], [5, 1, 4, 0], [0, 5, 1, 4, 0, 5, 3, 4]], minor: [[0, 5, 3, 4], [0, 1, 0, 6], [0, 3, 0, 5]] },
    drums: {
      standard: { kick: 'x.......x..x....', snare: '........x.......', hat: 'o...o...o...o...' },
      tribal: { kick: 'x.......x.......', tom: '......o.......o.', shaker: 'o...o...o...o...' },
      pulse: { kick: 'x...............' },
    },
    boss: { kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' },
  },
  groove: {
    label: 'Groove', shift: 5, tempo: 0.97, swing: 0.14, seed: 303, density: 0, arp: 'random', bass: 'r..r..r.r..r.f8.',
    progs: { major: [[1, 4, 0, 5], [0, 1, 3, 4], [1, 4, 0, 0]], minor: [[0, 3, 0, 3], [0, 6, 3, 4], [0, 4, 3, 6]] },
    drums: {
      standard: { kick: 'x..x..x...x..x..', snare: '....x..o....x...', hat: 'xoxoxoxoxoxoxoxo' },
      tribal: { kick: 'x..x..x...x.....', tom: '..o.x..o..o.x...', shaker: 'oooooooooooooooo' },
      pulse: { kick: 'x..x....x..x....' },
    },
  },
  epic: {
    label: 'Epic', shift: 7, tempo: 1.12, seed: 404, density: 0.05, arp: 'up', bass: 'r.rr.rr.r.rr.f8.',
    progs: { major: [[0, 5, 3, 4], [3, 4, 0, 0], [0, 4, 5, 3, 0, 4, 3, 4]], minor: [[0, 5, 6, 0], [0, 6, 5, 4], [0, 3, 4, 4, 0, 5, 6, 4]] },
    drums: {
      standard: { kick: 'x.x.x...x.x.x...', snare: '....x.......x.xx', hat: 'x.x.x.x.x.x.x.x.' },
      tribal: { kick: 'x.x.x.x.x.x.x.x.', tom: 'x...x.o.x...x.oo', shaker: 'o.o.o.o.o.o.o.o.' },
      pulse: { kick: 'x.x.x.x.x.x.x.x.' },
    },
  },
};

const strHash = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/** A track rewritten for a theme (same instruments, different song). */
function themed(name, theme) {
  const def = TRACKS[name], th = THEMES[theme];
  if (!th || !th.progs) return def;
  const h = strHash(`${name}:${theme}`);
  const pool = th.progs[MINORISH.has(def.scale) ? 'minor' : 'major'];
  let root = def.root + th.shift;
  while (root > 68) root -= 12;
  while (root < 50) root += 12;
  const boss = name.startsWith('boss');
  const family = kitFamily(def.drums);
  const drums = !family ? null : boss && th.boss ? th.boss : th.drums[family];
  return {
    ...def,
    root,
    bpm: Math.round(def.bpm * th.tempo),
    swing: th.swing ?? def.swing,
    prog: pool[h % pool.length],
    bass: def.bass && (boss ? 'drive' : th.bass),
    drums,
    arp: def.arp && { ...def.arp, shape: th.arp },
    lead: def.lead && { ...def.lead, seed: def.lead.seed + th.seed, density: Math.max(0.2, Math.min(0.8, def.lead.density + th.density)) },
  };
}

/** Track for a level: world theme, or its boss theme. */
export const WORLD_TRACKS = ['purrville', 'purrville', 'jungle', 'docks', 'wastes', 'pale'];
export function trackFor(def) {
  if (!def || def.id === 'hub') return 'hub';
  const w = Number(def.id?.[0]) || 1;
  return def.boss ? `boss-${w}` : WORLD_TRACKS[w];
}

const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export class Music {
  /** @param {import('./audio.js').Sfx} sfx shares its AudioContext */
  constructor(sfx) {
    this.sfx = sfx;
    this.want = null;
    this.current = null;
    this.intensity = 0;
    this.volume = 0.7;
    this.theme = 'original';
  }

  /** Called once the AudioContext exists (first user gesture). */
  attach() {
    const c = this.sfx.ctx;
    if (!c || this.bus) return;
    this.bus = c.createGain();
    this.bus.gain.value = this.volume * 0.42;
    // a gentle compressor glues the layers and keeps loud bars from clipping
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    this.bus.connect(comp).connect(this.sfx.out);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.timer = setInterval(() => this.schedule(), 30);
    if (this.want) { const w = this.want; this.want = null; this.play(w); }
  }

  setVolume(v) {
    this.volume = v;
    if (this.bus) this.bus.gain.setTargetAtTime(v * 0.42, this.sfx.ctx.currentTime, 0.05);
  }

  setIntensity(v) { this.intensity = v; }

  /** Switch soundtrack theme; the playing track restarts as that theme's song. */
  setTheme(theme) {
    if (!THEMES[theme] || theme === this.theme) return;
    this.theme = theme;
    if (this.current) this.play(this.current.name, true);
  }

  /** Cross-fade to a track by name (null fades to silence). */
  play(name, restart = false) {
    if (!this.bus) { this.want = name; return; }
    if (this.current?.name === name && !restart) return;
    const c = this.sfx.ctx, now = c.currentTime;
    if (this.current) {
      const old = this.current;
      old.out.gain.setTargetAtTime(0, now, 0.35);
      old.stopped = true;
      setTimeout(() => old.out.disconnect(), 2500);
    }
    this.current = null;
    if (!name || !TRACKS[name]) return;
    const def = themed(name, this.theme);
    const out = c.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.setTargetAtTime(1, now + 0.05, 0.4);
    out.connect(this.bus);
    this.current = { name, def, out, step: 0, next: now + 0.1, loop: 0, melody: this.compose(def) };
  }

  /** The chord (as scale degrees) for a bar. */
  chord(def, bar) {
    const d = def.prog[bar % def.prog.length];
    return def.sevenths ? [d, d + 2, d + 4, d + 6] : [d, d + 2, d + 4];
  }

  /** Scale degree → MIDI note (degrees wrap into octaves). */
  note(def, degree, octave = 0) {
    const s = SCALES[def.scale];
    const o = Math.floor(degree / 7);
    return def.root + s[((degree % 7) + 7) % 7] + 12 * (o + octave);
  }

  /** Build a looping lead melody: [{ step, degree, len }] over the whole progression. */
  compose(def) {
    if (!def.lead) return [];
    const r = rng(def.lead.seed * 9973 + 1);
    const bars = def.prog.length;
    // two-bar rhythm motif, reused with variations (A A' B A)
    const rhythm = () => {
      const out = [];
      for (let s = 0; s < 32;) {
        const strong = s % 8 === 0;
        if (strong || r() < def.lead.density) {
          const len = r() < 0.5 ? 2 : r() < 0.6 ? 4 : r() < 0.5 ? 1 : 6;
          out.push({ s, len: Math.min(len, 32 - s) });
          s += len;
        } else s += 2;
      }
      return out;
    };
    const A = rhythm(), B = rhythm();
    const melody = [];
    let deg = 4 + Math.floor(r() * 3);
    for (let b = 0; b < bars; b += 2) {
      const section = (b / 2) % 4 === 2 ? B : A;
      for (const n of section) {
        const bar = b + Math.floor(n.s / 16);
        if (bar >= bars) continue;
        const chord = this.chord(def, bar).map((x) => x % 7);
        if (n.s % 8 === 0) {
          // strong beat: land on the nearest chord tone
          let best = deg, bd = 99;
          for (let c = deg - 4; c <= deg + 4; c++) if (chord.includes(((c % 7) + 7) % 7) && Math.abs(c - deg) < bd) { bd = Math.abs(c - deg); best = c; }
          deg = best;
        } else deg += r() < 0.5 ? (r() < 0.5 ? 1 : -1) : (r() < 0.5 ? 2 : -2);
        deg = Math.max(0, Math.min(11, deg));
        melody.push({ step: b * 16 + n.s, degree: deg, len: n.len });
      }
      // phrase endings resolve toward the root
      if (melody.length && (b + 2) % 4 === 0) melody[melody.length - 1].degree = 7 * Math.round(melody[melody.length - 1].degree / 7);
    }
    return melody;
  }

  schedule() {
    const t = this.current;
    if (!t || t.stopped) return;
    const c = this.sfx.ctx;
    if (c.state !== 'running') return;
    const def = t.def, stepDur = 60 / def.bpm / 4;
    const total = def.prog.length * 16;
    if (t.next < c.currentTime - 0.5) t.next = c.currentTime + 0.05; // tab was asleep: don't burst
    while (t.next < c.currentTime + 0.15) {
      const swing = t.step % 2 ? (def.swing || 0) * stepDur : 0;
      this.playStep(t, t.step, t.next + swing, stepDur);
      t.next += stepDur;
      t.step = (t.step + 1) % total;
      if (t.step === 0) t.loop++;
    }
  }

  playStep(t, step, time, sd) {
    const def = t.def, bar = Math.floor(step / 16), s = step % 16;
    const chord = this.chord(def, bar);
    const hot = this.intensity > 0;
    const breakdown = t.loop % 4 === 3 && !hot;
    const intro = t.loop === 0;
    // drums
    const kit = typeof def.drums === 'string' ? DRUMS[def.drums] : def.drums;
    if (kit && !breakdown) {
      for (const [part, pat] of Object.entries(kit)) {
        let hit = pat[s];
        if (hot && part === 'hat' && hit === '.') hit = 'o';
        if (hot && part === 'kick' && s % 4 === 0) hit = 'x';
        if (intro && part !== 'kick' && part !== 'shaker' && bar < 2) hit = '.';
        if (hit !== '.') this.drum(part, time, hit === 'x' ? 1 : 0.55);
      }
    }
    // bass
    const bp = BASS[def.bass] || (def.bass?.length === 16 ? def.bass : null);
    if (bp) {
      const ch = bp[s];
      if (ch !== '.' && ch !== '-') {
        let len = 1;
        while (bp[(s + len) % 16] === '-' && len < 16) len++;
        const m = this.note(def, chord[0], -2) + (ch === 'f' ? 7 : ch === '8' ? 12 : 0);
        this.voice('bass', midiHz(m), time, Math.max(sd * 1.6, len * sd * 0.95), 0.55);
      }
    }
    // pad: one long chord per bar
    if (def.pad && s === 0) {
      chord.forEach((d, i) => this.voice(def.pad, midiHz(this.note(def, d, i === 0 ? -1 : 0)), time, sd * 16 * 1.02, breakdown ? 0.22 : 0.16));
    }
    // arpeggio
    if (def.arp && s % def.arp.rate === 0 && !(intro && bar === 0)) {
      const k = s / def.arp.rate;
      const tones = [...chord, chord[0] + 7];
      let idx;
      if (def.arp.shape === 'up') idx = k % tones.length;
      else if (def.arp.shape === 'updown') { const p = tones.length * 2 - 2; const q = k % p; idx = q < tones.length ? q : p - q; }
      else idx = Math.floor((Math.sin(step * 12.9898 + bar * 78.233) * 43758.5453 % 1 + 1) % 1 * tones.length);
      const m = this.note(def, tones[idx], hot ? 1 : 0);
      this.voice(def.arp.wave, midiHz(m), time, sd * def.arp.rate * 0.9, def.arp.quiet ? 0.12 : 0.2);
    }
    // lead (enters on the second loop, rests in breakdowns)
    if (def.lead && t.loop > 0 && !breakdown) {
      for (const n of t.melody) if (n.step === step) this.voice(def.lead.wave, midiHz(this.note(def, n.degree, 1)), time, n.len * sd * 0.92, 0.3);
    }
  }

  /** One synthesized note. */
  voice(kind, hz, time, dur, vol) {
    const c = this.sfx.ctx;
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    g.connect(this.current.out);
    f.connect(g);
    const osc = (type, mult = 1, det = 0) => {
      const o = c.createOscillator();
      o.type = type; o.frequency.value = hz * mult; o.detune.value = det;
      o.connect(f); o.start(time); o.stop(time + dur + 0.8);
      return o;
    };
    let a = 0.008, rel = 0.12, sus = 1, cut = 4000;
    switch (kind) {
      case 'bass': osc('triangle'); osc('square', 1, 0).frequency.value = hz; cut = 700; rel = 0.08; vol *= 0.9; break;
      case 'square': osc('square'); cut = 2600; vol *= 0.45; sus = 0.6; break;
      case 'saw': osc('sawtooth'); osc('sawtooth', 1, 9); cut = 2200; vol *= 0.35; break;
      case 'triangle': osc('triangle'); sus = 0.5; rel = 0.2; break;
      case 'marimba': osc('sine'); osc('sine', 4, 0).frequency.value = hz * 4; a = 0.002; sus = 0; rel = 0.25; vol *= 0.9; break;
      case 'bell': osc('sine'); osc('sine', 2.76); a = 0.003; sus = 0; rel = 0.9; vol *= 0.7; break;
      case 'flute': {
        const o = osc('triangle'); osc('sine', 2).detune.value = 3;
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 5.5; lg.gain.value = hz * 0.012;
        lfo.connect(lg).connect(o.frequency); lfo.start(time + 0.12); lfo.stop(time + dur + 0.8);
        a = 0.05; cut = 3000; vol *= 0.8; break;
      }
      case 'keys': osc('sine'); osc('triangle', 2); a = 0.004; sus = 0.35; rel = 0.5; cut = 2400; vol *= 0.8; break;
      case 'warm': osc('sawtooth', 1, -7); osc('sawtooth', 1, 7); a = 0.4; rel = 0.8; cut = 900; vol *= 0.5; break;
      case 'air': osc('triangle', 1, -5); osc('sine', 2, 5); a = 0.7; rel = 1.2; cut = 1800; vol *= 0.5; break;
      case 'organ': osc('square'); osc('sine', 2); osc('sine', 0.5); a = 0.05; rel = 0.3; cut = 1500; vol *= 0.4; break;
      default: osc('sine');
    }
    f.frequency.value = cut;
    const end = time + dur;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + a);
    if (sus < 1) g.gain.setTargetAtTime(vol * sus, time + a, dur * 0.3 + 0.02);
    g.gain.setTargetAtTime(0, Math.max(time + a, end - 0.01), rel / 3);
    setTimeout(() => g.disconnect(), (end - c.currentTime + rel + 1) * 1000);
  }

  drum(part, time, vel) {
    const c = this.sfx.ctx, out = this.current.out;
    const g = c.createGain();
    g.connect(out);
    if (part === 'kick' || part === 'tom') {
      const o = c.createOscillator();
      const f0 = part === 'kick' ? 150 : 220, f1 = part === 'kick' ? 42 : 110;
      o.frequency.setValueAtTime(f0, time);
      o.frequency.exponentialRampToValueAtTime(f1, time + 0.12);
      g.gain.setValueAtTime(0.7 * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + (part === 'kick' ? 0.3 : 0.25));
      o.connect(g); o.start(time); o.stop(time + 0.35);
    } else {
      const src = c.createBufferSource(), f = c.createBiquadFilter();
      src.buffer = this.noiseBuf;
      const [type, freq, dur, vol] = part === 'snare' ? ['bandpass', 1800, 0.16, 0.5] : part === 'shaker' ? ['highpass', 6000, 0.05, 0.12] : ['highpass', 7500, 0.045, 0.22];
      f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(vol * vel, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      src.connect(f).connect(g);
      src.start(time, Math.random() * 0.5, dur + 0.05);
      if (part === 'snare') {
        const o = c.createOscillator(), og = c.createGain();
        o.type = 'triangle'; o.frequency.value = 185;
        og.gain.setValueAtTime(0.25 * vel, time); og.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        o.connect(og).connect(out); o.start(time); o.stop(time + 0.1);
      }
    }
    setTimeout(() => g.disconnect(), (time - c.currentTime + 1) * 1000);
  }
}
