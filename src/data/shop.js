/** Grandpa's Workshop catalog. Prices are in Sparks. */
export const WEAPONS = {
  blaster: { name: 'Prism Blaster', color: '#ff4f6d', cd: 0.11, pellets: 1, spread: 0.05, speed: 44, life: 0.65, dmg: 1, desc: 'Rapid paint bolts. Never runs dry.' },
  splatter: { name: 'Splatter', color: '#ff9a3d', cd: 0.6, pellets: 8, spread: 0.55, speed: 34, life: 0.36, dmg: 1, desc: 'Shotgun spray. Pops whole packs up close.', price: 60, ammoPrice: 15, ammoPack: 30 },
  bubble: { name: 'Bubble Gun', color: '#3d8bff', cd: 0.32, pellets: 1, spread: 0.04, speed: 22, life: 0.85, dmg: 0.5, trap: 2.8, desc: 'Traps robots in floating bubbles for a few seconds.', price: 90, ammoPrice: 15, ammoPack: 30, world: 2 },
  ricochet: { name: 'Ricochet', color: '#ffd000', cd: 0.16, pellets: 1, spread: 0.04, speed: 38, life: 0.9, dmg: 1.3, bounce: 3, desc: 'Yellow sparks that bounce off walls up to three times.', price: 110, ammoPrice: 18, ammoPack: 60, world: 3 },
  mortar: { name: 'Seed Mortar', color: '#8cff7a', cd: 0.6, pellets: 1, spread: 0, lob: true, dmg: 2.2, radius: 2.8, snare: 2, desc: 'Lobs seeds that burst into vine snares. Hits ghosts, glass and crowds.', price: 130, ammoPrice: 20, ammoPack: 24, world: 4 },
  beam: { name: 'Rainbow Beam', color: '#ff8fd8', cd: 0.1, pellets: 1, spread: 0, beam: true, dps: 10, range: 22, dmg: 1, desc: 'A continuous rainbow that pierces everything in its path.', price: 220, ammoPrice: 25, ammoPack: 100, world: 5 },
  hose: { name: 'Hue Hose', color: '#62f4ff', cd: 0.05, pellets: 1, spread: 0.22, speed: 36, life: 0.45, dmg: 0.6, desc: 'A rapid stream of paint. Melts Moppers.', price: 120, ammoPrice: 20, ammoPack: 150 },
};
export const WEAPON_ORDER = ['blaster', 'splatter', 'hose', 'bubble', 'ricochet', 'mortar', 'beam'];

export const UPGRADES = {
  armor: { name: 'Armor Plating', desc: '+25 max health per level', prices: [30, 60, 100], icon: '🛡️' },
  speed: { name: 'Sneaker Boosters', desc: '+8% run speed per level', prices: [25, 50, 90], icon: '👟' },
  power: { name: 'Color Capacitor', desc: '+20% damage per level', prices: [40, 80, 130], icon: '⚡' },
  magnet: { name: 'Magnet Collar', desc: 'Pull Sparks in from further away', prices: [15, 30, 50], icon: '🧲' },
  zapper: { name: 'Smudge Zapper', desc: 'Smudge zaps nearby robots (faster at level 2)', prices: [50, 100], icon: '🤖' },
};

export const ITEMS = {
  sardine: { name: 'Sardine Tin', desc: 'Restore 40 health.', key: 'H', price: 12, max: 5, color: '#c7d3e0' },
  bomb: { name: 'Paint Bomb', desc: 'Throw a huge paint blast.', key: 'G', price: 18, max: 5, color: '#ff4fd8' },
  shield: { name: 'Bubble Shield', desc: 'Five seconds of total safety.', key: 'B', price: 25, max: 3, color: '#62f4ff' },
};
export const ITEM_ORDER = ['sardine', 'bomb', 'shield'];
