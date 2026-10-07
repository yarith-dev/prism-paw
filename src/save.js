/** Campaign progress, stored per browser. Every access is guarded: storage can be missing or blocked. */
const KEY = 'prism-paw-save-v1';

const fresh = () => ({
  started: false,
  sparks: 0,
  unlocked: ['1-1'],
  cleared: {},            // levelId -> { time, pops }
  seeds: {},              // levelId -> [seed indexes found]
  upgrades: { armor: 0, speed: 0, power: 0, magnet: 0, zapper: 0 },
  weapons: { blaster: true, splatter: false, hose: false, bubble: false, ricochet: false, mortar: false, beam: false },
  ammo: { splatter: 0, hose: 0, bubble: 0, ricochet: 0, mortar: 0, beam: 0 },
  items: { sardine: 1, bomb: 0, shield: 0 },
  talked: {},             // npc reward flags
  seen: {},               // story flags: comics, smudge, shop intro…
});

export const save = {
  data: fresh(),

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...fresh(), ...JSON.parse(raw) };
    } catch { /* private mode or blocked storage: play without saving */ }
    // saves from before the Street Sweeper existed: open the boss for anyone past Festival Square
    if (this.data.cleared['1-3'] && !this.data.unlocked.includes('1-4')) this.data.unlocked.push('1-4');
    if (this.data.cleared['1-4'] && !this.data.unlocked.includes('2-1')) this.data.unlocked.push('2-1');
    if (this.data.cleared['2-2'] && !this.data.unlocked.includes('2-3')) this.data.unlocked.push('2-3');
    if (this.data.cleared['2-4'] && !this.data.unlocked.includes('3-1')) this.data.unlocked.push('3-1');
    if (this.data.cleared['3-4'] && !this.data.unlocked.includes('4-1')) this.data.unlocked.push('4-1');
    if (this.data.cleared['4-4'] && !this.data.unlocked.includes('5-1')) this.data.unlocked.push('5-1');
    return this.data;
  },

  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
  },

  reset() {
    this.data = fresh();
    this.write();
  },

  get hasProgress() { return this.data.started; },

  seedCount(id) { return (this.data.seeds[id] || []).length; },
  totalSeeds() { return Object.values(this.data.seeds).reduce((n, s) => n + s.length, 0); },
};
