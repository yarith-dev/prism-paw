/**
 * Nova's wardrobe: colours and shapes (pattern, ears, tail, outfit, back, shoes, eyewear, blaster,
 * hats), plus which ones each save has unlocked.
 * The chosen look is stored apart from the save (like settings), so "New game" keeps it;
 * pieces the current save hasn't unlocked yet fall back to the slot's first (free) option.
 */
import { GLOW } from '../voxel.js';

const swatch = (id, name, colors) => ({ id, name, colors });

export const WARDROBE = {
  fur: {
    label: 'Fur color',
    group: 'Body',
    options: [
      swatch('ginger', 'Ginger', { fur: '#f28c28', furDark: '#c45d16' }),
      swatch('midnight', 'Midnight', { fur: '#2d2a3a', furDark: '#4a4560' }),
      swatch('snow', 'Snow', { fur: '#f4efe6', furDark: '#d9cbb5' }),
      swatch('silver', 'Silver tabby', { fur: '#a7adbb', furDark: '#6b7080' }),
      swatch('cream', 'Cream', { fur: '#f3dcb0', furDark: '#c9a46e' }),
      swatch('cocoa', 'Cocoa', { fur: '#8a5a3b', furDark: '#5a3a24' }),
      swatch('lilac', 'Lilac', { fur: '#c6a8ff', furDark: '#9a7ad6' }),
      swatch('mint', 'Mint', { fur: '#7ef0c8', furDark: '#3fb59a' }),
    ],
  },
  eyes: {
    label: 'Eye color',
    group: 'Body',
    options: [
      swatch('green', 'Green', { iris: '#3be08f' }),
      swatch('blue', 'Blue', { iris: '#62a8ff' }),
      swatch('gold', 'Gold', { iris: '#ffd23f' }),
      swatch('amber', 'Amber', { iris: '#ff9a3d' }),
      swatch('pink', 'Pink', { iris: '#ff8fb1' }),
      swatch('violet', 'Violet', { iris: '#b48cff' }),
    ],
  },
  pattern: {
    label: 'Pattern',
    group: 'Body',
    items: true,
    options: [
      { id: 'tabby', name: 'Tabby stripes' },
      { id: 'plain', name: 'Plain' },
      { id: 'tuxedo', name: 'Tuxedo' },
      { id: 'calico', name: 'Calico' },
      { id: 'points', name: 'Colorpoint' },
      { id: 'spotted', name: 'Spotted' },
    ],
  },
  ears: {
    label: 'Ears',
    group: 'Body',
    items: true,
    options: [
      { id: 'pointy', name: 'Notched' },
      { id: 'neat', name: 'Pointy' },
      { id: 'round', name: 'Round' },
      { id: 'fold', name: 'Folded' },
      { id: 'lynx', name: 'Lynx tufts', unlock: '2-3', hint: 'Clear Firefly Night' },
      { id: 'long', name: 'Long ears', unlock: '4-2', hint: 'Clear the Static Storm' },
    ],
  },
  tail: {
    label: 'Tail',
    group: 'Body',
    items: true,
    options: [
      { id: 'curly', name: 'Curly' },
      { id: 'fluffy', name: 'Fluffy' },
      { id: 'long', name: 'Long' },
      { id: 'bob', name: 'Bobtail' },
      { id: 'zigzag', name: 'Lightning', unlock: '4-3', hint: 'Clear the Chroma Mine' },
      { id: 'twin', name: 'Twin tails', unlock: '5-4', hint: 'Beat the Curator' },
    ],
  },
  eyeShape: {
    label: 'Eye shape',
    group: 'Body',
    items: true,
    options: [
      { id: 'normal', name: 'Bright' },
      { id: 'sparkle', name: 'Sparkly' },
      { id: 'happy', name: 'Happy' },
      { id: 'sleepy', name: 'Sleepy' },
      { id: 'fierce', name: 'Fierce' },
    ],
  },
  top: {
    label: 'Top',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'jacket', name: 'Courier jacket' },
      { id: 'hoodie', name: 'Hoodie' },
      { id: 'vest', name: 'Vest & tee' },
      { id: 'sweater', name: 'Turtleneck' },
      { id: 'armor', name: 'Prism armor', unlock: '3-3', hint: 'Clear the Squall Deck' },
    ],
  },
  back: {
    label: 'Back',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'bag', name: 'Courier bag' },
      { id: 'none', name: 'Nothing' },
      { id: 'backpack', name: 'Backpack' },
      { id: 'cape', name: 'Hero cape', unlock: '1-3', hint: 'Clear Festival Square' },
      { id: 'jetpack', name: 'Jetpack', unlock: '3-1', hint: 'Clear the Harbor Gate' },
      { id: 'wings', name: 'Prism wings', unlock: '5-2', hint: 'Clear the Gallery of Color' },
    ],
  },
  shoes: {
    label: 'Shoes',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'boots', name: 'Boots' },
      { id: 'sneakers', name: 'Sneakers' },
      { id: 'bare', name: 'Bare paws' },
      { id: 'rainboots', name: 'Rain boots', unlock: '2-1', hint: 'Clear the Spore Trail' },
    ],
  },
  jacket: {
    label: 'Outfit color',
    group: 'Outfit',
    options: [
      swatch('violet', 'Courier violet', { jacket: '#6a4ce4', jacketDark: '#4b34b3' }),
      swatch('cherry', 'Cherry', { jacket: '#ff4f6d', jacketDark: '#c4304f' }),
      swatch('teal', 'Teal', { jacket: '#2fb5a2', jacketDark: '#1f7a6e' }),
      swatch('navy', 'Navy', { jacket: '#2f4aa8', jacketDark: '#1f2f70' }),
      swatch('tangerine', 'Tangerine', { jacket: '#ff8a3d', jacketDark: '#c45d16' }),
      swatch('bubblegum', 'Bubblegum', { jacket: '#ff8fb1', jacketDark: '#d6608a' }),
      swatch('forest', 'Forest', { jacket: '#3f9b4a', jacketDark: '#2a6b33' }),
      swatch('ink', 'Ink', { jacket: '#2d2a3a', jacketDark: '#1c1a33' }),
      swatch('cloud', 'Cloud', { jacket: '#e6ecf8', jacketDark: '#b9bec6' }),
    ],
  },
  trim: {
    label: 'Trim',
    group: 'Outfit',
    options: [
      swatch('sunflower', 'Sunflower', { trim: '#ffd23f' }),
      swatch('mint', 'Mint', { trim: '#7ef0c8' }),
      swatch('coral', 'Coral', { trim: '#ff7a59' }),
      swatch('sky', 'Sky', { trim: '#62a8ff' }),
      swatch('white', 'White', { trim: '#ffffff' }),
      swatch('black', 'Black', { trim: '#1c1a33' }),
    ],
  },
  lens: {
    label: 'Lens color',
    group: 'Head',
    options: [
      swatch('cyan', 'Cyan', { lens: '#62f4ff' }),
      swatch('pink', 'Pink', { lens: '#ff6ae0' }),
      swatch('gold', 'Gold', { lens: '#ffd94a' }),
      swatch('lime', 'Lime', { lens: '#9dff6e' }),
      swatch('violet', 'Violet', { lens: '#c9a7ff' }),
      swatch('red', 'Red', { lens: '#ff5a6e' }),
    ],
  },
  eyewear: {
    label: 'Eyewear',
    group: 'Head',
    items: true,
    options: [
      { id: 'goggles', name: 'Goggles' },
      { id: 'none', name: 'Nothing' },
      { id: 'round', name: 'Round glasses' },
      { id: 'shades', name: 'Shades' },
      { id: 'visor', name: 'Visor', unlock: '4-1', hint: 'Clear the Glass Dunes' },
      { id: 'eyepatch', name: 'Eyepatch', unlock: '1-1', hint: 'Clear the Market District' },
    ],
  },
  blaster: {
    label: 'Style',
    group: 'Blaster',
    items: true,
    options: [
      { id: 'prism', name: 'Prism Blaster' },
      { id: 'raygun', name: 'Ray gun', unlock: '1-1', hint: 'Clear the Market District' },
      { id: 'soaker', name: 'Paint soaker', unlock: '2-3', hint: 'Clear Firefly Night' },
      { id: 'crystal', name: 'Crystal blaster', unlock: '4-4', hint: 'Beat the Echo' },
      { id: 'paw', name: 'Paw cannon', unlock: 'seeds', hint: 'Find every Color Seed' },
    ],
  },
  glow: {
    label: 'Glow',
    group: 'Blaster',
    options: [
      swatch('pink', 'Pink', { glowPink: '#ff4fd8' }),
      swatch('cyan', 'Cyan', { glowPink: '#5ef0ff' }),
      swatch('gold', 'Gold', { glowPink: '#ffcf3a' }),
      swatch('lime', 'Lime', { glowPink: '#8eff6a' }),
      swatch('violet', 'Violet', { glowPink: '#b98cff' }),
      swatch('white', 'White', { glowPink: '#f6fbff' }),
    ],
  },
  hat: {
    label: 'Hat',
    group: 'Head',
    items: true,
    options: [
      { id: 'none', name: 'None' },
      { id: 'cap', name: 'Courier cap' },
      { id: 'beanie', name: 'Beanie', unlock: '1-4', hint: 'Beat the Street Sweeper' },
      { id: 'flowers', name: 'Flower crown', unlock: '2-4', hint: 'Beat the Weed Whacker' },
      { id: 'captain', name: "Captain's hat", unlock: '3-4', hint: 'Beat the Net Trawler' },
      { id: 'headphones', name: 'Headphones', unlock: '4-4', hint: 'Beat the Echo' },
      { id: 'party', name: 'Party hat', unlock: '5-4', hint: 'Beat the Curator' },
      { id: 'crown', name: 'Prism crown', unlock: 'seeds', hint: 'Find every Color Seed' },
    ],
  },
  neck: {
    label: 'Neck',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'none', name: 'None' },
      { id: 'scarf', name: 'Scarf' },
      { id: 'bandana', name: 'Bandana', unlock: '1-2', hint: 'Clear the Tram Yards' },
      { id: 'bowtie', name: 'Bow tie', unlock: '2-2', hint: 'Clear the Sunken Lab' },
      { id: 'bell', name: 'Bell collar', unlock: '3-2', hint: 'Clear Whale Watch' },
    ],
  },
};
for (const k of ['lens', 'glow']) for (const o of WARDROBE[k].options) Object.values(o.colors).forEach((c) => GLOW.add(c));

export const SLOTS = Object.keys(WARDROBE);
export const GROUPS = ['Body', 'Outfit', 'Head', 'Blaster'];
export const DEFAULT_LOOK = Object.fromEntries(SLOTS.map((s) => [s, WARDROBE[s].options[0].id]));

/** @param save the save module (for cleared levels and seed count) */
export function isUnlocked(opt, save) {
  if (!opt.unlock) return true;
  if (opt.unlock === 'seeds') return save.totalSeeds() >= (save.seedGoal || Infinity);
  return !!save.data.cleared?.[opt.unlock];
}

const KEY = 'prism-paw-look-v1';
export function loadLook() {
  try { return { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULT_LOOK }; }
}
export function storeLook(look) {
  try { localStorage.setItem(KEY, JSON.stringify(look)); } catch { /* private mode */ }
}

/** Turn a stored look into what the model builder needs: merged colours plus worn accessories. */
export function resolveLook(look, save) {
  const colors = {};
  const out = { colors };
  for (const slot of SLOTS) {
    const opts = WARDROBE[slot].options;
    const opt = opts.find((o) => o.id === look[slot]) || opts[0];
    if (WARDROBE[slot].items) out[slot] = isUnlocked(opt, save) ? opt.id : opts[0].id;
    else Object.assign(colors, opt.colors);
  }
  return out;
}
