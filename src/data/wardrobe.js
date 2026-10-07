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
  hair: {
    label: 'Hair',
    group: 'Head',
    items: true,
    options: [
      { id: 'none', name: 'None' },
      { id: 'cowlick', name: 'Cowlick' },
      { id: 'fringe', name: 'Fringe' },
      { id: 'bun', name: 'Bun' },
      { id: 'pigtails', name: 'Pigtails' },
      { id: 'spiky', name: 'Spiky', unlock: '1-2', hint: 'Clear the Tram Yards' },
      { id: 'mohawk', name: 'Mohawk', unlock: '3-3', hint: 'Clear the Squall Deck' },
    ],
  },
  face: {
    label: 'Face',
    group: 'Head',
    items: true,
    options: [
      { id: 'none', name: 'None' },
      { id: 'blush', name: 'Blush' },
      { id: 'freckles', name: 'Freckles' },
      { id: 'whiskers', name: 'Whiskers' },
      { id: 'bandage', name: 'Bandage' },
      { id: 'star', name: 'Star sticker', unlock: '2-1', hint: 'Clear the Spore Trail' },
      { id: 'warpaint', name: 'War paint', unlock: '4-4', hint: 'Beat the Echo' },
    ],
  },
  bottoms: {
    label: 'Bottoms',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'none', name: 'None' },
      { id: 'shorts', name: 'Shorts' },
      { id: 'pants', name: 'Pants' },
      { id: 'skirt', name: 'Skirt' },
    ],
  },
  bottomsColor: {
    label: 'Bottoms color',
    group: 'Outfit',
    options: [
      swatch('denim', 'Denim', { bottoms: '#3f5fa8' }),
      swatch('ink', 'Ink', { bottoms: '#2d2a3a' }),
      swatch('khaki', 'Khaki', { bottoms: '#c9a46e' }),
      swatch('cherry', 'Cherry', { bottoms: '#c4304f' }),
      swatch('forest', 'Forest', { bottoms: '#2a6b33' }),
      swatch('lilac', 'Lilac', { bottoms: '#9a7ad6' }),
      swatch('cloud', 'Cloud', { bottoms: '#e6ecf8' }),
    ],
  },
  gloves: {
    label: 'Gloves',
    group: 'Outfit',
    items: true,
    options: [
      { id: 'none', name: 'Bare paws' },
      { id: 'mittens', name: 'Mittens' },
      { id: 'fingerless', name: 'Fingerless' },
      { id: 'boxing', name: 'Boxing gloves', unlock: '1-4', hint: 'Beat the Street Sweeper' },
      { id: 'gauntlets', name: 'Gauntlets', unlock: '5-1', hint: 'Clear the Moon Gate' },
    ],
  },
  smudgePaint: {
    label: 'Paint',
    group: 'Smudge',
    target: 'smudge',
    options: [
      swatch('mint', 'Mint & pink', { body: '#7ef0c8', light: '#ff8fb1', dark: '#4b34b3', eye: '#62f4ff' }),
      swatch('sunny', 'Sunny', { body: '#ffd23f', light: '#ff9a3d', dark: '#8a5a3b', eye: '#fff3a1' }),
      swatch('sky', 'Sky', { body: '#62a8ff', light: '#ffffff', dark: '#1f2f70', eye: '#a8fff4' }),
      swatch('grape', 'Grape', { body: '#b48cff', light: '#ffd23f', dark: '#3a2a6b', eye: '#ffb3f5' }),
      swatch('cherry', 'Cherry', { body: '#ff4f6d', light: '#ffe0e6', dark: '#6b1f35', eye: '#fff3a1' }),
      swatch('midnight', 'Midnight', { body: '#2d2a3a', light: '#62f4ff', dark: '#1c1a33', eye: '#ff6ae0' }),
      swatch('chrome', 'Chrome', { body: '#c9ced6', light: '#ffffff', dark: '#4f545d', eye: '#9dff6e' }),
    ],
  },
  smudgeTop: {
    label: 'Topper',
    group: 'Smudge',
    target: 'smudge',
    items: true,
    options: [
      { id: 'classic', name: 'Antenna' },
      { id: 'heart', name: 'Heart antenna' },
      { id: 'double', name: 'Double antenna' },
      { id: 'flower', name: 'Flower' },
      { id: 'bow', name: 'Bow' },
      { id: 'propeller', name: 'Propeller cap', unlock: '3-2', hint: 'Clear Whale Watch' },
      { id: 'tophat', name: 'Top hat', unlock: '2-4', hint: 'Beat the Weed Whacker' },
      { id: 'party', name: 'Party hat', unlock: '5-4', hint: 'Beat the Curator' },
      { id: 'crown', name: 'Tiny crown', unlock: 'seeds', hint: 'Find every Color Seed' },
    ],
  },
  trail: {
    label: 'Trail',
    group: 'Effects',
    items: true,
    chips: true,
    options: [
      { id: 'none', name: 'None', colors: {} },
      { id: 'sparkles', name: 'Sparkles', colors: { a: '#ffffff', b: '#fff3a1' } },
      { id: 'hearts', name: 'Hearts', colors: { a: '#ff8fb1', b: '#ff4f6d' } },
      { id: 'bubbles', name: 'Bubbles', colors: { a: '#a8fff4', b: '#62a8ff' } },
      { id: 'paint', name: 'Paint steps', colors: { a: '#ff4f6d', b: '#ffd23f', c: '#7ef0c8', d: '#62a8ff' } },
      { id: 'embers', name: 'Embers', colors: { a: '#ffd23f', b: '#ff7a59', c: '#ff4f6d' }, unlock: '4-1', hint: 'Clear the Glass Dunes' },
      { id: 'stardust', name: 'Stardust', colors: { a: '#c9a7ff', b: '#ffffff', c: '#62f4ff' }, unlock: '5-3', hint: 'Clear the Far Side' },
    ],
  },
  palette: {
    label: 'Paint colors',
    group: 'Effects',
    target: 'fx',
    options: [
      swatch('rainbow', 'Rainbow', { a: '#ff4f6d', b: '#ffd23f', c: '#7ef0c8', d: '#62a8ff', e: '#ff8fb1', f: '#c6a8ff', g: '#ff9a3d' }),
      swatch('sunset', 'Sunset', { a: '#ff4f6d', b: '#ff7a59', c: '#ff9a3d', d: '#ffd23f', e: '#ff8fb1' }),
      swatch('ocean', 'Ocean', { a: '#62a8ff', b: '#3de0c8', c: '#7ef0c8', d: '#2f4aa8', e: '#a8fff4' }),
      swatch('candy', 'Candy', { a: '#ff8fb1', b: '#ffc2e0', c: '#c6a8ff', d: '#a8fff4', e: '#fff3a1' }),
      swatch('forest', 'Forest', { a: '#8cdc7a', b: '#3f9b4a', c: '#ffd23f', d: '#c08a57', e: '#b8ff6a' }),
      swatch('neon', 'Neon', { a: '#ff4fd8', b: '#62f4ff', c: '#9dff6e', d: '#fff07a' }),
      swatch('royal', 'Royal', { a: '#ffd23f', b: '#6a4ce4', c: '#ffffff', d: '#c4304f' }),
    ],
  },
};
for (const k of ['lens', 'glow']) for (const o of WARDROBE[k].options) Object.values(o.colors).forEach((c) => GLOW.add(c));
for (const o of WARDROBE.smudgePaint.options) GLOW.add(o.colors.eye); // Smudge's eye glows

export const SLOTS = Object.keys(WARDROBE);
export const GROUPS = ['Body', 'Outfit', 'Head', 'Blaster', 'Smudge', 'Effects'];
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
  const colors = {}, smudgeColors = {};
  const out = { colors, smudgeColors };
  for (const slot of SLOTS) {
    const def = WARDROBE[slot], opts = def.options;
    let opt = opts.find((o) => o.id === look[slot]) || opts[0];
    if (!isUnlocked(opt, save)) opt = opts[0];
    if (def.items) out[slot] = opt.id;
    else if (def.target === 'smudge') Object.assign(smudgeColors, opt.colors);
    else if (def.target === 'fx') out[slot] = Object.values(opt.colors);
    else Object.assign(colors, opt.colors);
  }
  return out;
}

/** Saved outfits: three slots of whole looks, stored next to the current look. */
const OUTFITS = 'prism-paw-outfits-v1';
export function loadOutfits() {
  try { const a = JSON.parse(localStorage.getItem(OUTFITS) || '[]'); return [0, 1, 2].map((i) => a[i] || null); } catch { return [null, null, null]; }
}
export function storeOutfits(list) {
  try { localStorage.setItem(OUTFITS, JSON.stringify(list)); } catch { /* private mode */ }
}
