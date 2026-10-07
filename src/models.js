import { GLOW, model, meshModel } from './voxel.js';

/** Character voxel size in world units. Nova is ~3.2 units tall. */
export const S = 0.13;
/** Boss voxel size: the Street Sweeper is roughly 5 × 7.5 units. */
export const SB = 0.24;

const BASE_C = {
  fur: '#f28c28', furDark: '#c45d16', white: '#fff4e6', pink: '#ff8fb1',
  jacket: '#6a4ce4', jacketDark: '#4b34b3', trim: '#ffd23f', boot: '#28244c',
  eye: '#1c1a33', iris: '#3be08f', goggle: '#3a3f5c', strap: '#8a5a3b',
  gun: '#454c63', gunDark: '#2a2f40', bottoms: '#3f5fa8',
  lens: '#62f4ff', glowPink: '#ff4fd8', barrel: '#7dfcff',
};
const C = BASE_C;
const G = { body: '#8d939c', light: '#b9bec6', dark: '#4f545d', eye: '#f4f7ff', shield: '#c9ced6' };
GLOW.add(C.lens).add(C.glowPink).add(C.barrel).add(G.eye);

// ---------------- Nova ----------------
// Built from three parts so the legs can swing: body (pivot at feet) and two legs (pivot at hip).

const vhash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** Fill in wardrobe defaults (shape slots) so older stored looks still build. */
const NOVA_DEFAULTS = { hair: 'none', face: 'none', gloves: 'none', bottoms: 'none', pattern: 'tabby', ears: 'pointy', tail: 'curly', eyeShape: 'normal', top: 'jacket', back: 'bag', shoes: 'boots', eyewear: 'goggles', blaster: 'prism', hat: 'none', neck: 'none' };

/**
 * Nova's body (pivot at the feet). `look` comes from the wardrobe: { colors, pattern, ears, tail,
 * eyeShape, top, back, eyewear, blaster, hat, neck }. Coordinates: torso x ±4, y 6-14, z ±2;
 * head x ±5, y 15-22, z ±4 (face at z 4-5); ears y 23+; blaster on the right, muzzle at z 10.
 */
function novaBody(look = {}) {
  const C = { ...BASE_C, ...look.colors };
  const L = { ...NOVA_DEFAULTS, ...look };
  const n = model();
  const pat = L.pattern;
  const dark = pat === 'points' ? C.furDark : C.fur; // ears, paws and tail on a colourpoint
  const paw = pat === 'tuxedo' ? C.white : dark;

  // ---- torso and sleeves (outfit style)
  const sleeve = L.top === 'vest' ? C.fur : C.jacket;
  if (L.top === 'sweater') for (let y = 6; y <= 14; y++) n.box(-4, y, -2, 4, y, 2, (y >> 1) % 2 ? C.jacket : C.jacketDark);
  else n.box(-4, 6, -2, 4, 14, 2, L.top === 'armor' ? C.jacketDark : C.jacket);
  n.box(-4, 6, -2, 4, 6, 2, C.trim);
  if (L.top === 'jacket' || L.top === 'vest') {
    n.box(L.top === 'vest' ? -2 : -1, 7, 2, L.top === 'vest' ? 2 : 1, 13, 2, C.white);
    n.box(-2, 7, 2, -2, 13, 2, C.jacketDark).box(2, 7, 2, 2, 13, 2, C.jacketDark);
    if (L.top === 'vest') n.box(-3, 7, 2, -3, 13, 2, C.jacketDark).box(3, 7, 2, 3, 13, 2, C.jacketDark);
    n.box(-3, 11, -3, 3, 13, -3, C.jacketDark).box(-1, 12, -3, 1, 12, -3, C.trim); // collar / back patch
  } else if (L.top === 'hoodie') {
    n.box(-2, 7, 3, 2, 9, 3, C.jacketDark).box(-1, 8, 3, 1, 8, 3, C.jacket); // kangaroo pocket
    n.set(-1, 13, 3, C.white).set(-1, 12, 3, C.white).set(1, 13, 3, C.white).set(1, 12, 3, C.white);
    n.box(-3, 11, -3, 3, 15, -3, C.jacketDark).box(-2, 12, -4, 2, 16, -4, C.jacket).box(-1, 13, -4, 1, 15, -4, C.jacketDark); // hood
  } else if (L.top === 'sweater') {
    n.box(-4, 14, -3, 4, 14, 3, C.trim); // turtleneck
  } else if (L.top === 'armor') {
    n.box(-3, 8, 3, 3, 13, 3, '#c9ced6').box(-2, 9, 3, 2, 12, 3, '#e6eaf0').set(0, 11, 3, C.lens).set(0, 10, 3, C.lens);
    n.box(-4, 7, -2, 4, 7, 2, '#3a3f5c').box(-1, 7, 3, 1, 7, 3, C.trim); // belt
    n.box(-7, 13, -2, -5, 15, 2, '#c9ced6').box(5, 13, -2, 7, 15, 2, '#c9ced6').box(-7, 15, -1, -5, 15, 1, C.trim).box(5, 15, -1, 7, 15, 1, C.trim);
    n.box(-3, 8, -3, 3, 13, -3, '#c9ced6');
  }
  // left arm swings free, right arm holds the blaster forward
  n.box(-6, 10, -1, -5, 14, 1, sleeve).box(-6, 10, -1, -5, 10, 1, L.top === 'vest' ? C.fur : C.trim).box(-6, 8, -1, -5, 9, 1, paw);
  n.box(5, 11, -1, 6, 14, 1, sleeve).box(5, 10, 0, 6, 11, 3, sleeve).box(5, 10, 0, 6, 10, 3, L.top === 'vest' ? C.fur : C.trim);
  if (L.top === 'vest') n.box(-6, 13, -1, -5, 14, 1, C.white).box(5, 13, -1, 6, 14, 1, C.white); // t-shirt sleeves
  n.box(5, 9, 3, 6, 10, 4, paw);
  wearGloves(n, L.gloves, C);
  if (L.bottoms === 'skirt') {
    for (let y = 3; y <= 6; y++) { const r = y < 5 ? 5 : 4; n.box(-r, y, -3, r, y, 3, y === 3 ? C.trim : C.bottoms); }
  }

  // ---- blaster
  wearBlaster(n, L.blaster, C);

  // ---- head and fur pattern
  n.box(-5, 15, -4, 5, 22, 4, C.fur);
  if (pat === 'tabby') {
    for (const x of [-2, 0, 2]) n.box(x, 22, -3, x, 22, 3, C.furDark);
    for (const s of [-5, 5]) n.box(s, 17, -3, s, 17, 1, C.furDark).box(s, 15, -2, s, 15, 0, C.furDark);
    n.set(-1, 19, 4, C.furDark).set(1, 19, 4, C.furDark);
  } else if (pat === 'spotted' || pat === 'calico') {
    for (let x = -5; x <= 5; x++) for (let y = 15; y <= 22; y++) for (let z = -4; z <= 4; z++) {
      if (Math.abs(x) < 5 && y < 22 && Math.abs(z) < 4) continue; // only the surface
      const h = vhash(x >> 1, y >> 1, z >> 1);
      if (pat === 'spotted' && h > 0.78) n.set(x, y, z, C.furDark);
      if (pat === 'calico') n.set(x, y, z, h > 0.66 ? C.furDark : h > 0.4 ? C.white : C.fur);
    }
  } else if (pat === 'points') {
    n.box(-3, 15, 4, 3, 19, 4, C.furDark); // dark mask
  } else if (pat === 'tuxedo') {
    n.box(-4, 15, 4, 4, 16, 4, C.white).box(-1, 17, 4, 1, 21, 4, C.white); // white blaze and chin
  }
  n.box(-2, 15, 5, 2, 16, 5, C.white);
  n.box(-4, 15, 4, -3, 15, 4, C.white).box(3, 15, 4, 4, 15, 4, C.white);
  n.set(0, 16, 5, C.pink).set(0, 15, 5, C.eye);
  for (const ex of [-3, 3]) drawEye(n, ex, L.eyeShape, C);
  drawFace(n, L.face, C);
  for (const s of [-1, 1]) n.set(6 * s, 16, 3, C.white).set(6 * s, 15, 3, C.white);
  wearEyewear(n, L.eyewear, C);

  // ---- ears and hair
  for (const s of [-1, 1]) drawEar(n, s, L.ears, dark, C);
  drawHair(n, L.hair, C);

  // ---- tail
  drawTail(n, L.tail, pat, C);

  // ---- back, hat and neck
  wearBack(n, L.back, C);
  wearHat(n, L.hat, C);
  wearNeck(n, L.neck, C);
  return n;
}

/** Hair tufts sit between the ears (x -1..1, y 23+) or at the back and sides of the head. */
function drawHair(n, kind, C) {
  switch (kind) {
    case 'cowlick': n.set(0, 23, 1, C.fur).set(0, 24, 0, C.fur).set(1, 25, 0, C.fur).set(1, 24, -1, C.furDark); break;
    case 'mohawk': n.box(0, 23, -4, 0, 24, 3, C.trim).box(0, 25, -2, 0, 25, 1, C.trim); break;
    case 'spiky': for (const [x, y, z] of [[-1, 23, 2], [0, 24, 0], [1, 23, -2], [0, 25, -1], [-1, 24, -3], [1, 24, 1]]) n.set(x, y, z, C.fur); break;
    case 'bun': n.box(-1, 21, -6, 1, 23, -5, C.furDark).box(-1, 22, -5, 1, 22, -5, C.trim); break;
    case 'pigtails':
      for (const s of [-1, 1]) n.box(s * 6, 16, -3, s * 7, 20, -2, C.furDark).set(s * 6, 20, -1, C.trim).set(s * 7, 15, -3, C.furDark);
      break;
    case 'fringe': n.box(-4, 22, 5, 4, 22, 5, C.furDark).set(-3, 21, 5, C.furDark).set(-1, 21, 5, C.furDark).set(2, 21, 5, C.furDark); break;
    default: break;
  }
}

/** Face markings, drawn over the cheeks and nose after the eyes. */
function drawFace(n, kind, C) {
  switch (kind) {
    case 'blush': for (const s of [-1, 1]) n.box(s * 3, 16, 4, s * 4, 16, 4, '#ff9fb8'); break;
    case 'freckles': for (const [x, y] of [[-3, 16], [-4, 15], [-2, 15], [3, 16], [4, 15], [2, 15]]) n.set(x, y, 4, C.furDark); break;
    case 'star': n.set(4, 16, 4, C.trim).set(3, 16, 4, C.trim).set(4, 15, 4, C.trim).set(5, 16, 3, C.trim); break;
    case 'warpaint': for (const s of [-1, 1]) n.box(s * 2, 16, 4, s * 4, 16, 4, '#ff4f6d').box(s * 3, 15, 4, s * 4, 15, 4, '#ff4f6d'); break;
    case 'bandage': n.box(-2, 17, 5, 2, 17, 5, '#fff4e6').set(-1, 17, 5, '#ffcfd8').set(1, 17, 5, '#ffcfd8'); break;
    case 'whiskers': for (const s of [-1, 1]) n.box(s * 6, 16, 4, s * 8, 16, 4, '#ffffff').box(s * 6, 15, 4, s * 8, 15, 4, '#ffffff'); break;
    default: break;
  }
}

/** Gloves replace the paws (left paw x -6..-5 y 8-9; right paw holds the blaster at z 3-4). */
function wearGloves(n, kind, C) {
  const both = (col) => n.box(-6, 8, -1, -5, 9, 1, col).box(5, 9, 3, 6, 10, 4, col);
  switch (kind) {
    case 'mittens': both(C.trim); n.box(-6, 10, -1, -5, 10, 1, '#ffffff').box(5, 10, 2, 6, 10, 2, '#ffffff'); break;
    case 'fingerless': both('#2a2f40'); n.box(-6, 8, -1, -5, 8, 1, C.fur).box(5, 9, 4, 6, 10, 4, C.fur); break;
    case 'gauntlets': both('#c9ced6'); n.box(-6, 10, -1, -5, 11, 1, '#c9ced6').set(-6, 9, 1, C.lens).set(6, 10, 3, C.lens); break;
    case 'boxing': n.box(-7, 7, -2, -4, 9, 2, '#ff4f6d').box(5, 9, 3, 7, 11, 5, '#ff4f6d').box(-7, 9, -2, -4, 9, 2, '#ffffff'); break;
    default: break;
  }
}

function drawEye(n, ex, shape, C) {
  const inner = ex < 0 ? ex + 1 : ex - 1;
  switch (shape) {
    case 'sleepy':
      n.box(ex - 1, 18, 4, ex + 1, 18, 4, C.furDark).box(ex - 1, 17, 4, ex + 1, 17, 4, C.iris).set(ex, 17, 4, C.eye);
      break;
    case 'happy':
      n.set(ex - 1, 17, 4, C.eye).set(ex, 18, 4, C.eye).set(ex + 1, 17, 4, C.eye);
      break;
    case 'sparkle':
      n.box(ex - 1, 16, 4, ex + 1, 18, 4, C.iris).box(ex, 16, 4, ex, 17, 4, C.eye).set(ex - 1, 18, 4, C.white).set(ex + 1, 16, 4, C.white);
      break;
    case 'fierce':
      n.box(ex - 1, 17, 4, ex + 1, 18, 4, C.iris).box(ex, 17, 4, ex, 18, 4, C.eye).set(inner, 18, 4, C.furDark);
      n.box(ex - 1, 19, 4, ex + 1, 19, 4, C.furDark).set(inner, 19, 4, C.fur).set(inner, 18, 4, C.furDark);
      break;
    default:
      n.box(ex - 1, 17, 4, ex + 1, 18, 4, C.iris).box(ex, 17, 4, ex, 18, 4, C.eye).set(ex - 1, 18, 4, C.white);
  }
}

function drawEar(n, s, kind, color, C) {
  const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
  const row = (y, a, b, col = color) => n.box(lo(s * a, s * b), y, -1, hi(s * a, s * b), y, 1, col);
  switch (kind) {
    case 'round':
      row(23, 2, 5); row(24, 3, 4);
      n.set(3 * s, 23, 1, C.pink).set(4 * s, 23, 1, C.pink);
      break;
    case 'fold':
      row(23, 2, 5);
      n.box(lo(s * 3, s * 5), 22, 2, hi(s * 3, s * 5), 23, 2, color);
      break;
    case 'lynx':
      for (let k = 0; k < 4; k++) row(23 + k, 2 + k, 5);
      n.set(3 * s, 23, 1, C.pink).set(4 * s, 24, 1, C.pink).set(4 * s, 23, 1, C.pink);
      n.box(lo(s * 5, s * 5), 27, 0, hi(s * 5, s * 5), 29, 0, C.furDark).set(5 * s, 30, 0, C.furDark);
      break;
    case 'long':
      for (let y = 23; y <= 30; y++) row(y, 3, 4);
      for (let y = 24; y <= 29; y++) n.set(3 * s, y, 1, C.pink);
      break;
    default: // pointy (right one notched) or neat
      for (let k = 0; k < 3; k++) row(23 + k, 2 + k, 5);
      n.set(3 * s, 23, 1, C.pink).set(4 * s, 23, 1, C.pink).set(4 * s, 24, 1, C.pink);
      if (kind === 'pointy' && s > 0) n.carve(5, 25, -1, 5, 25, 1);
  }
}

function drawTail(n, kind, pat, C) {
  const PATHS = {
    curly: [[7, -3], [7, -4], [8, -5], [9, -6], [10, -6], [11, -6], [12, -6], [13, -5], [14, -5]],
    long: Array.from({ length: 11 }, (_, i) => [7 + Math.floor(i * 0.4), -3 - i]),
    bob: [[7, -3], [7, -4]],
    zigzag: [[7, -3], [8, -4], [9, -5], [10, -4], [11, -3], [12, -4], [13, -5], [14, -4], [15, -3]],
  };
  const path = PATHS[kind] || PATHS.curly;
  const color = (i) => {
    if (i >= path.length - 2 && kind !== 'bob' && pat !== 'points') return C.white;
    if (pat === 'points') return C.furDark;
    if (pat === 'tabby') return (i >> 1) % 2 ? C.furDark : C.fur;
    if (pat === 'calico') return ['#fff4e6', C.fur, C.furDark][(i >> 1) % 3];
    if (pat === 'spotted') return i % 3 === 1 ? C.furDark : C.fur;
    return C.fur;
  };
  const thick = kind === 'fluffy' || kind === 'bob';
  const strands = kind === 'twin' ? [[-3, -2], [1, 2]] : thick ? [[-2, 1]] : [[-1, 0]];
  const p = kind === 'fluffy' || kind === 'twin' ? PATHS.curly : path;
  for (const [x0, x1] of strands) {
    p.forEach(([y, z], i) => {
      const spread = kind === 'twin' ? (x0 < 0 ? -1 : 1) * Math.floor(i / 3) : 0;
      n.box(x0 + spread, y, z, x1 + spread, y + (thick ? 1 : 0), z, color(i));
    });
  }
}

function wearEyewear(n, kind, C) {
  const FRAME = '#2a2f40';
  const arms = () => { for (const s of [-1, 1]) n.box(6 * s, 18, -2, 6 * s, 18, 4, FRAME); };
  switch (kind) {
    case 'goggles':
      n.box(-5, 20, -4, 5, 21, 4, C.goggle);
      n.box(-4, 20, 5, -1, 21, 5, C.lens).box(1, 20, 5, 4, 21, 5, C.lens).set(0, 20, 5, C.goggle);
      break;
    case 'round':
      for (const ex of [-3, 3]) {
        n.box(ex - 1, 19, 5, ex + 1, 19, 5, FRAME).box(ex - 1, 16, 5, ex + 1, 16, 5, FRAME);
        n.box(ex - 2, 17, 5, ex - 2, 18, 5, FRAME).box(ex + 2, 17, 5, ex + 2, 18, 5, FRAME);
      }
      n.box(-1, 18, 5, 1, 18, 5, FRAME);
      arms();
      break;
    case 'shades':
      for (const ex of [-3, 3]) n.box(ex - 2, 17, 5, ex + 1 + (ex > 0 ? 1 : 0), 18, 5, '#1c1a33').set(ex - 1, 18, 5, '#6b7080');
      n.box(-5, 19, 5, 5, 19, 5, FRAME);
      arms();
      break;
    case 'visor':
      n.box(-5, 17, 5, 5, 18, 5, C.lens);
      for (const s of [-1, 1]) n.box(6 * s, 17, -1, 6 * s, 18, 4, '#c9ced6');
      break;
    case 'eyepatch':
      n.box(2, 16, 5, 4, 18, 5, '#1c1a33');
      for (let i = 0; i <= 6; i++) n.set(1 - i, 19 + Math.floor(i / 3), 5, '#1c1a33');
      n.box(-6, 21, -3, -6, 21, 4, '#1c1a33');
      break;
    default: break;
  }
}

function wearBack(n, kind, C) {
  switch (kind) {
    case 'bag':
      for (let i = 0; i <= 8; i++) n.set(-4 + i, 14 - i, 2, C.strap);
      for (let i = 0; i <= 8; i++) n.set(4 - i, 14 - i, -2, C.strap);
      n.box(-5, 5, -4, -2, 8, -3, '#8a5a3b').box(-5, 8, -4, -2, 8, -4, '#6b4429').set(-3, 7, -5, C.trim);
      break;
    case 'backpack':
      n.box(-3, 7, -5, 3, 13, -3, C.trim).box(-2, 8, -6, 2, 10, -6, C.jacketDark).box(-1, 14, -4, 1, 14, -4, C.jacketDark);
      n.box(-3, 8, 3, -3, 13, 3, C.jacketDark).box(3, 8, 3, 3, 13, 3, C.jacketDark);
      break;
    case 'cape':
      for (let y = 2; y <= 14; y++) { const w = y > 11 ? 4 : y > 6 ? 5 : 6; n.box(-w, y, -3, w, y, -3, y === 2 ? '#7a1f35' : '#c4304f'); }
      n.box(-4, 14, -3, 4, 14, 2, '#c4304f').set(-3, 14, 3, C.trim).set(3, 14, 3, C.trim);
      break;
    case 'jetpack':
      for (const x of [-3, 1]) {
        n.box(x, 7, -5, x + 2, 13, -3, '#c9ced6').box(x, 14, -5, x + 2, 14, -3, C.trim).box(x, 9, -6, x + 2, 9, -6, '#8d939c');
        n.box(x + 1, 6, -4, x + 1, 6, -4, '#3a3f5c').box(x + 1, 4, -4, x + 1, 5, -4, C.lens);
      }
      break;
    case 'wings':
      for (const s of [-1, 1]) {
        for (let y = 7; y <= 17; y++) {
          const reach = y >= 11 ? Math.round(8 - Math.abs(y - 14) * 0.9) : Math.round(6 - Math.abs(y - 8.5) * 1.2);
          for (let k = 1; k <= reach; k++) n.set(s * k, y, -3 - (k > 4 ? 1 : 0), k === reach || y === 7 || y === 17 ? C.jacketDark : C.lens);
        }
      }
      break;
    default: break;
  }
}

function wearBlaster(n, kind, C) {
  n.box(6, 7, 3, 7, 8, 4, C.gunDark); // grip
  switch (kind) {
    case 'raygun':
      n.box(6, 9, 1, 8, 11, 5, C.gun).box(6, 9, 6, 8, 11, 6, C.trim).box(7, 10, 7, 7, 10, 8, C.gun);
      n.box(6, 9, 9, 8, 11, 10, C.glowPink).box(7, 12, 1, 7, 13, 4, C.trim).set(7, 12, 5, C.lens);
      break;
    case 'soaker':
      n.box(6, 8, 1, 8, 10, 6, '#62a8ff').box(6, 11, 1, 8, 13, 4, C.glowPink).box(6, 13, 2, 8, 13, 3, '#2f4aa8');
      n.box(7, 9, 7, 7, 9, 10, C.gunDark).box(7, 10, 7, 7, 10, 7, '#2f4aa8').set(7, 9, 10, C.barrel);
      break;
    case 'crystal':
      n.box(6, 9, 1, 8, 11, 6, C.gunDark).box(6, 9, 7, 8, 11, 10, C.glowPink).set(7, 10, 10, C.barrel);
      for (let z = 2; z <= 6; z += 2) n.set(7, 12, z, z % 4 ? C.lens : C.glowPink).set(7, 13, z, C.barrel);
      n.set(5, 10, 8, C.lens).set(9, 10, 8, C.lens).set(7, 12, 8, C.lens);
      break;
    case 'paw':
      n.box(6, 9, 1, 8, 11, 8, C.gun).box(6, 10, 2, 6, 10, 7, C.glowPink).box(8, 10, 2, 8, 10, 7, C.glowPink);
      n.box(6, 8, 9, 8, 10, 10, '#ff8fb1').set(5, 11, 10, '#ff8fb1').set(7, 12, 10, '#ff8fb1').set(9, 11, 10, '#ff8fb1');
      n.set(7, 9, 10, C.glowPink).set(5, 11, 10, C.glowPink).set(7, 12, 10, C.glowPink).set(9, 11, 10, C.glowPink);
      break;
    default: // prism
      n.box(6, 9, 1, 8, 11, 9, C.gun);
      n.box(8, 10, 2, 8, 10, 8, C.glowPink).box(6, 10, 2, 6, 10, 8, C.glowPink);
      n.box(7, 12, 3, 7, 12, 5, C.lens);
      n.box(6, 10, 10, 8, 10, 10, C.barrel).set(7, 9, 10, C.gunDark).set(7, 11, 10, C.gunDark);
  }
}

/** Hats sit on the head (top at y 22, ears at y 23-25 from x ±2 out to ±5). */
function wearHat(n, hat, C) {
  const FL = ['#ff8fb1', '#ffe066', '#c6a8ff', '#ff7a59', '#7ef0c8'];
  switch (hat) {
    case 'cap':
      n.box(-3, 22, -4, 3, 23, 3, '#ff4f6d').box(-2, 24, -3, 2, 24, 2, '#ff4f6d').set(0, 25, 0, '#ffffff');
      n.box(-3, 22, 4, 3, 22, 7, '#c4304f');
      break;
    case 'beanie':
      for (let y = 22; y <= 24; y++) n.box(-4 + (y - 22), y, -4 + (y - 22), 4 - (y - 22), y, 4 - (y - 22), y === 22 ? C.trim : y % 2 ? '#3fb59a' : '#7ef0c8');
      n.box(-1, 25, -1, 1, 26, 1, '#ffffff');
      break;
    case 'flowers':
      for (let x = -5; x <= 5; x++) for (const z of [-4, 4]) n.set(x, 23, z, (x + z) % 3 === 0 ? FL[(x + 7) % 5] : '#3f9b4a');
      for (let z = -3; z <= 3; z++) for (const x of [-5, 5]) n.set(x, 23, z, z % 3 === 0 ? FL[(z + 7) % 5] : '#3f9b4a');
      break;
    case 'captain':
      n.box(-5, 22, -4, 5, 22, 4, '#1f2f70').box(-5, 23, -5, 5, 24, 5, '#ffffff').box(-4, 25, -4, 4, 25, 4, '#ffffff');
      n.box(-4, 22, 5, 4, 22, 7, '#1c1a33').box(-1, 23, 6, 1, 24, 6, '#ffd23f');
      break;
    case 'headphones':
      n.box(-6, 22, -1, 6, 22, 1, '#2d2a3a').box(-6, 23, -1, 6, 23, 1, '#2d2a3a').carve(-5, 23, -1, 5, 23, 1);
      for (const s of [-1, 1]) n.box(6 * s, 16, -2, 6 * s + s, 21, 2, '#2d2a3a').box(6 * s + s, 17, -1, 6 * s + s, 20, 1, C.lens);
      break;
    case 'party':
      for (let y = 22; y <= 29; y++) {
        const r = Math.max(0, Math.round(3 - (y - 22) * 0.45));
        n.box(-r, y, -r, r, y, r, (y >> 1) % 2 ? '#ff4f6d' : '#ffd23f');
      }
      n.box(-1, 30, -1, 1, 31, 1, '#7ef0c8');
      break;
    case 'crown':
      n.box(-4, 22, -4, 4, 23, 4, '#ffd23f').carve(-3, 23, -3, 3, 23, 3);
      for (const [x, z] of [[-4, -4], [0, -4], [4, -4], [-4, 0], [4, 0], [-4, 4], [0, 4], [4, 4]]) n.set(x, 24, z, '#ffd23f');
      n.set(0, 23, 5, C.lens).set(-3, 23, 5, '#ff4fd8').set(3, 23, 5, '#62f4ff');
      break;
    default: break;
  }
}

/** Neckwear sits where the head meets the jacket (y 13-14). */
function wearNeck(n, neck, C) {
  switch (neck) {
    case 'scarf':
      n.box(-5, 14, -3, 5, 14, 3, C.trim).box(-4, 13, -3, 4, 13, 3, C.trim);
      n.box(2, 8, -4, 3, 13, -4, C.trim).box(2, 8, -4, 3, 8, -4, C.jacketDark);
      break;
    case 'bandana':
      n.box(-5, 14, -3, 5, 14, 3, '#ff4f6d').box(-2, 12, 3, 2, 13, 3, '#ff4f6d').set(0, 11, 3, '#ff4f6d');
      n.set(-1, 13, 3, '#ffffff').set(1, 12, 3, '#ffffff');
      break;
    case 'bowtie':
      n.box(-3, 13, 3, -1, 15, 3, '#ff4f6d').box(1, 13, 3, 3, 15, 3, '#ff4f6d').set(0, 14, 3, '#c4304f');
      break;
    case 'bell':
      n.box(-4, 14, -3, 4, 14, 3, '#ff4f6d').box(-1, 12, 3, 1, 13, 4, '#ffd23f').set(0, 12, 4, '#8a5a3b');
      break;
    default: break;
  }
}

function novaLeg(look = {}) {
  const C = { ...BASE_C, ...look.colors };
  const L = { ...NOVA_DEFAULTS, ...look };
  const fur = L.pattern === 'points' ? C.furDark : C.fur;
  const sock = L.pattern === 'tuxedo' ? C.white : fur;
  const m = model().box(-1, 2, -1, 1, 5, 1, fur).box(-1, 2, -1, 1, 2, 1, sock);
  if (L.bottoms === 'shorts') m.box(-1, 4, -1, 1, 5, 1, C.bottoms);
  if (L.bottoms === 'pants') m.box(-1, 2, -1, 1, 5, 1, C.bottoms).box(-1, 2, -1, 1, 2, 1, C.trim);
  switch (L.shoes) {
    case 'sneakers':
      return m.box(-1, 0, -1, 1, 1, 2, '#f4f7ff').box(-1, 0, -1, 1, 0, 2, C.trim).box(-1, 1, 0, -1, 1, 1, C.jacket).box(1, 1, 0, 1, 1, 1, C.jacket);
    case 'rainboots':
      return m.box(-1, 0, -1, 1, 4, 2, '#ffd23f').box(-1, 0, -1, 1, 0, 2, '#2a2f40').box(-1, 4, -1, 1, 4, 1, '#e0b000');
    case 'bare':
      return m.box(-1, 0, -1, 1, 1, 1, sock).box(-1, 0, 2, 1, 0, 2, sock).set(0, 0, 2, C.pink);
    default:
      return m.box(-1, 0, -1, 1, 1, 2, C.boot);
  }
}

/**
 * Only the lenses and the blaster glow on Nova, and only Smudge's eye, are unlit: other models add
 * colours like sunflower yellow and mint to the shared GLOW list, and those must stay lit on them.
 */
function novaGlow(look = {}) {
  const C = { ...BASE_C, ...look.colors };
  return new Set([C.lens, C.glowPink, C.barrel]);
}
function smudgeGlow(look = {}) { return new Set([{ ...SMUDGE, ...look.smudgeColors }.eye]); }

/** Meshes for a look without touching the shared MESH entries (wardrobe thumbnails). */
export function novaMeshes(look = {}) {
  const glow = novaGlow(look);
  return { body: meshModel(novaBody(look), S, [0, 0, 0], glow), leg: meshModel(novaLeg(look), S, [0, 6, 0], glow) };
}

/** Smudge's mesh for a look, without touching MESH (wardrobe thumbnails). */
export function smudgeMesh(look = {}) { return meshModel(smudgeModel(look), S * 0.8, [0, 0, 0], smudgeGlow(look)); }

// ---------------- Greyscale robots ----------------

function drab(p = G) {
  const d = model();
  d.box(-2, 0, -1, -1, 0, 1, p.dark).box(1, 0, -1, 2, 0, 1, p.dark);
  d.box(-3, 1, -3, 3, 8, 3, p.body);
  for (const x of [-3, 3]) for (const z of [-3, 3]) d.box(x, 1, z, x, 8, z, p.dark);
  d.box(-3, 4, -3, 3, 4, 3, p.dark);
  d.box(-2, 9, -2, 2, 9, 2, p.light).box(-1, 10, -1, 1, 10, 1, p.light);
  d.box(-2, 5, 3, 2, 7, 3, p.dark).box(-1, 5, 4, 1, 7, 4, p.eye).set(0, 6, 4, p.dark);
  d.set(0, 11, 0, p.dark).set(0, 12, 0, p.dark).set(0, 13, 0, p.eye);
  [[4, 6, 0], [5, 6, 1], [5, 5, 2], [5, 4, 3], [5, 3, 4]].forEach(([x, y, z]) => d.set(x, y, z, p.dark));
  d.box(4, 1, 4, 6, 2, 6, p.dark).box(4, 1, 7, 6, 1, 7, p.light);
  return d;
}

const SMUDGE = { body: '#7ef0c8', light: '#ff8fb1', dark: '#4b34b3', eye: '#62f4ff' };

function mopper(shield = true) {
  const m = model();
  m.box(-3, 0, -2, -2, 1, 1, G.dark).box(2, 0, -2, 3, 1, 1, G.dark);
  m.box(-3, 2, -3, 3, 11, 2, G.body);
  for (const x of [-3, 3]) m.box(x, 2, -3, x, 11, -3, G.dark);
  m.box(-3, 7, -3, 3, 7, 2, G.dark);
  m.box(-2, 12, -2, 2, 14, 2, G.light).box(-1, 13, 3, 1, 13, 3, G.eye);
  m.box(-4, 6, -1, -4, 8, 4, G.dark).box(4, 6, -1, 4, 8, 4, G.dark);
  if (!shield) return m.box(0, 9, 5, 0, 12, 5, G.dark); // just a snapped handle left
  m.box(-5, 2, 5, 5, 11, 5, G.shield);
  m.box(-5, 4, 5, 5, 4, 5, G.light).box(-5, 8, 5, 5, 8, 5, G.light);
  for (let x = -5; x <= 5; x += 2) m.box(x, 0, 5, x, 1, 5, G.dark);
  m.box(0, 12, 5, 0, 15, 5, G.dark);
  return m;
}

function fizz() {
  const f = model();
  f.box(-4, 2, -4, 4, 3, 4, G.body);
  for (const x of [-4, 4]) for (const z of [-4, 4]) f.carve(x, 2, z, x, 3, z);
  f.box(-4, 2, -4, 4, 2, 4, G.dark);
  for (const x of [-4, 4]) for (const z of [-4, 4]) f.carve(x, 2, z, x, 2, z);
  f.box(-2, 4, -2, 2, 5, 2, G.light).set(0, 6, 0, G.dark).set(0, 7, 0, G.eye);
  f.box(-1, 3, 5, 1, 3, 5, G.eye);
  f.box(-1, 0, 0, 1, 1, 2, G.dark).set(0, 0, 3, G.dark);
  for (const [x, z] of [[5, 0], [-5, 0], [0, -5]]) f.box(x, 3, z, x, 4, z, G.dark);
  return f;
}

function greyVat() {
  const v = model();
  v.box(-8, 0, -8, 8, 1, 8, G.dark);
  v.box(-7, 2, -7, 7, 16, 7, G.body);
  v.box(-7, 6, -7, 7, 6, 7, G.dark).box(-7, 12, -7, 7, 12, 7, G.dark);
  for (const x of [-7, 7]) for (const z of [-7, 7]) v.carve(x, 0, z, x, 16, z);
  for (const x of [-8, 8]) for (const z of [-8, 8]) v.carve(x, 0, z, x, 1, z);
  v.box(-4, 8, 7, 4, 10, 7, G.eye);
  v.box(-3, 2, 7, 3, 5, 7, '#3c4048').box(-3, 2, 8, 3, 2, 8, G.dark);
  v.box(-5, 17, -5, 5, 17, 5, G.light).box(-1, 18, -1, 1, 21, 1, G.dark).box(-2, 22, -2, 2, 22, 2, G.dark);
  v.box(8, 3, -1, 9, 4, 1, G.dark).box(8, 5, 0, 9, 14, 0, G.dark).box(-9, 3, -1, -8, 4, 1, G.dark).box(-9, 5, 0, -8, 11, 0, G.dark);
  v.box(-2, 13, 7, 2, 15, 7, G.light);
  return v;
}

function beacon(active) {
  const b = model();
  const crystal = active ? ['#ff5c8a', '#ffd23f', '#7ef0c8', '#62a8ff'] : ['#e6eaf0', '#e6eaf0', '#e6eaf0', '#e6eaf0'];
  crystal.forEach((c) => GLOW.add(c));
  b.box(-6, 0, -6, 6, 1, 6, '#3a3f5c').box(-5, 2, -5, 5, 2, 5, '#5b6178');
  b.box(-2, 3, -2, 2, 13, 2, '#5b6178');
  b.box(-3, 5, -3, 3, 5, 3, active ? '#ff4fd8' : '#8d939c').box(-3, 10, -3, 3, 10, 3, active ? '#62f4ff' : '#8d939c');
  b.box(-2, 14, -2, 2, 14, 2, crystal[0]).box(-3, 15, -3, 3, 16, 3, crystal[1]);
  b.box(-2, 17, -2, 2, 18, 2, crystal[2]).box(-1, 19, -1, 1, 20, 1, crystal[3]).set(0, 21, 0, crystal[0]);
  return b;
}
GLOW.add('#ff4fd8');

function sparkGem() {
  GLOW.add('#ffe066');
  return model().box(0, 0, 0, 0, 4, 0, '#ffe066').box(-1, 1, 0, 1, 3, 0, '#ffe066').box(0, 1, -1, 0, 3, 1, '#ffe066').box(-2, 2, 0, 2, 2, 0, '#ffe066');
}

function sardineTin() {
  return model().box(-4, 0, -2, 4, 2, 2, '#c7d3e0').box(-3, 3, -1, 3, 3, 1, '#ff6f91')
    .box(-1, 4, 0, 1, 4, 0, '#62a8ff').set(2, 4, 0, '#62a8ff').set(-2, 4, 0, '#62a8ff');
}

function weaponCase(body, glow) {
  GLOW.add(glow);
  return model().box(-5, 0, -3, 5, 3, 3, body).box(-5, 2, -3, 5, 2, 3, glow)
    .box(-1, 4, 0, 1, 4, 0, '#2a2f40').set(-1, 4, 0, '#2a2f40').set(1, 4, 0, '#2a2f40');
}

function generator(active) {
  const dark = '#3a3f5c';
  const body = active ? '#62a8ff' : '#8d939c', band = active ? '#ffd23f' : '#4f545d';
  const lamp = active ? '#9dfbd9' : '#c4c8cf', screen = active ? '#fff3a8' : '#6f747c';
  if (active) GLOW.add(lamp).add(screen);
  const g = model();
  g.box(-6, 0, -6, 6, 1, 6, dark);
  g.box(-4, 2, -4, 4, 12, 4, body);
  for (const y of [4, 8, 11]) g.box(-4, y, -4, 4, y, 4, band);
  for (const x of [-4, 4]) for (const z of [-4, 4]) g.carve(x, 2, z, x, 12, z);
  g.box(-2, 5, 4, 2, 7, 4, screen);
  g.box(-3, 13, -3, 3, 13, 3, dark).box(-1, 14, -1, 1, 16, 1, lamp);
  g.box(5, 1, -1, 8, 1, 1, dark).box(-8, 1, -1, -5, 1, 1, dark);
  return g;
}

function colorSeed() {
  GLOW.add('#8cff7a');
  return model().box(0, 0, 0, 0, 3, 0, '#3f9b4a')
    .box(-2, 3, 0, -1, 3, 0, '#8cff7a').box(1, 4, 0, 2, 4, 0, '#8cff7a').set(0, 4, 0, '#8cff7a')
    .box(-1, 5, -1, 1, 6, 1, '#ffe066');
}

function paintBomb() {
  return model().box(-1, 0, -1, 1, 2, 1, '#e0409f').box(-1, 1, -1, 1, 1, 1, '#ff4fd8').set(0, 3, 0, '#2a2f40').set(0, 4, 0, '#ffe066');
}

// ---------------- World 2: jungle creatures and props ----------------

/** Smear: a grey blob that hops and splits. */
function smear() {
  const m = model();
  for (let y = 0; y <= 5; y++) {
    const r = 4.6 - y * 0.7;
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
      if (x * x + z * z <= r * r) m.set(x, y, z, y >= 4 ? G.light : (x + z + y) % 4 === 0 ? '#80868f' : G.body);
    }
  }
  for (const [x, z] of [[-5, 1], [4, -3], [2, 5], [-3, -5]]) m.set(x, 0, z, G.dark);
  m.box(-2, 2, 4, -1, 3, 4, G.eye).box(1, 2, 4, 2, 3, 4, G.eye).set(-2, 2, 5, G.dark).set(2, 2, 5, G.dark);
  return m;
}

/** Bounce mushroom: a fat springy cap that launches Nova across water. */
function bouncePad() {
  GLOW.add('#fff5b8');
  const m = model();
  m.box(-1, 0, -1, 1, 2, 1, '#f4e3c8');
  for (let y = 3; y <= 4; y++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    if (x * x + z * z <= (y === 4 ? 9 : 17)) m.set(x, y, z, '#ffb21f');
  }
  for (const [x, z] of [[-2, -2], [2, 1], [-1, 2], [2, -3]]) m.set(x, 5, z, '#fff5b8');
  return m;
}

/** Firefly lantern: a post with a glass jar. Lit, the jar glows with fireflies. */
function lantern(lit) {
  const jar = lit ? '#e8ff7a' : '#8a96a8';
  if (lit) GLOW.add(jar);
  return model().box(-2, 0, -2, 2, 0, 2, '#3a2f2a').box(0, 1, 0, 0, 9, 0, '#5a3a24').box(0, 10, -1, 0, 10, 1, '#5a3a24')
    .box(-1, 5, 2, 1, 8, 4, jar).box(-1, 9, 2, 1, 9, 4, '#3a2f2a').box(-1, 4, 2, 1, 4, 4, '#3a2f2a').set(0, 10, 2, '#3a2f2a');
}

/** Grey thorn bramble sprouted by the Weed Whacker. */
function bramble() {
  const m = model();
  for (let y = 0; y <= 5; y++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const r = 4.2 - y * 0.6;
    if (x * x + z * z > r * r) continue;
    const h = (x * 7 + z * 13 + y * 5) & 7;
    if (h < 3) continue;
    m.set(x, y, z, h === 7 ? '#d6dae0' : y > 3 ? '#80868f' : '#5b6069');
  }
  for (const [x, z] of [[-4, 0], [4, 1], [0, -4], [1, 4], [-3, 3]]) m.set(x, 3, z, '#d6dae0');
  return m;
}

// ---------------- World 3: the Coral Sky Docks ----------------

/** Stencil: a flat cut-out robot, one voxel thick, that charges in straight lines. */
function stencil() {
  const m = model();
  const face = '#c9ced6', edge = '#4f545d';
  m.box(-3, 0, 0, -2, 4, 0, face).box(2, 0, 0, 3, 4, 0, face);
  m.box(-5, 5, 0, 5, 13, 0, face).box(-4, 14, 0, 4, 19, 0, face);
  m.carve(-5, 5, 0, -5, 5, 0).carve(5, 5, 0, 5, 5, 0).carve(-4, 19, 0, -4, 19, 0).carve(4, 19, 0, 4, 19, 0);
  // dashed "cut here" outline
  for (let y = 5; y <= 13; y++) if (y % 2) m.set(-5, y, 0, edge).set(5, y, 0, edge);
  for (let x = -5; x <= 5; x++) if (x % 2) m.set(x, 5, 0, edge).set(x, 13, 0, edge);
  for (let x = -4; x <= 4; x++) if (x % 2 === 0) m.set(x, 19, 0, edge);
  // scissor arms held forward, ready to snip
  m.box(-8, 9, 0, -6, 10, 0, face).box(6, 9, 0, 8, 10, 0, face);
  m.box(-9, 9, 1, -9, 10, 3, edge).box(9, 9, 1, 9, 10, 3, edge).set(-9, 11, 3, edge).set(9, 11, 3, edge);
  // one big eye punched through, glowing on both sides
  m.box(-1, 15, -1, 1, 17, 1, G.eye);
  m.set(0, 20, 0, edge).set(0, 21, 0, edge).set(0, 22, 0, G.eye);
  return m;
}

/** A sky-whale: a huge gentle flyer that nests under the docks. Front is +z. */
function skyWhale() {
  const m = model();
  const body = '#5f7fe0', back = '#4b62c4', belly = '#ffd9e8', spot = '#ffb36b', fin = '#ff8fb1', stripe = '#7ef0c8';
  for (let z = -18; z <= 18; z++) {
    const u = z / 18;
    const r = 5.6 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, -u) * 1.05, 2))) * (u > 0 ? Math.sqrt(1 - u * u * 0.55) : 1);
    if (r < 0.6) continue;
    for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) {
      if (x * x + y * y * 1.25 > r * r) continue;
      let c = y > 1 ? back : y < -2 ? belly : body;
      if (y >= -2 && y <= -1 && (z & 3) === 0) c = stripe;
      if (y > 2 && ((x * 3 + z * 7) & 7) === 0 && Math.abs(x) < r - 1) c = spot;
      m.set(x, y + 7, z, c);
    }
  }
  // eyes, a little smile and the blowhole
  for (const s of [-1, 1]) m.set(s * 4, 8, 12, '#1c1a33').set(s * 4, 9, 12, '#ffffff');
  m.box(-2, 5, 18, 2, 5, 18, '#c4466e');
  m.box(-1, 12, 7, 1, 12, 8, back).set(0, 13, 8, '#ffffff');
  // flippers, a dorsal sail and the tail flukes
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) m.box(s * (5 + k), 4 - (k >> 1), 6 - k, s * (5 + k), 4 - (k >> 1), 8 - k, fin);
  for (let k = 0; k < 5; k++) m.box(0, 13 + k, -4 - k, 0, 13 + k, 2 - k * 2, fin);
  for (let k = 0; k < 7; k++) m.box(-2 - k, 7, -19 - (k >> 1), 2 + k, 7, -19 - (k >> 1), fin);
  return m;
}

/** A soft voxel cloud puff. */
function cloud(seed) {
  const m = model();
  const blobs = [[0, 0, 0, 5], [6, -1, 1, 4], [-6, -1, -1, 4], [2, 2, -3, 3.5], [-3, 1, 3, 3]];
  blobs.forEach(([bx, by, bz, r], i) => {
    const rr = r * (0.85 + ((seed * 7 + i * 3) % 5) * 0.06);
    for (let x = -6; x <= 6; x++) for (let y = -4; y <= 5; y++) for (let z = -6; z <= 6; z++) {
      if (x * x + y * y * 1.6 + z * z > rr * rr) continue;
      m.set(bx + x, by + y + 5, bz + z, y + by < -1 ? '#e3dcf5' : '#ffffff');
    }
  });
  return m;
}

/** Updraft vent: a grille in the deck that throws Nova across the sky gaps. */
function ventPad() {
  GLOW.add('#ffe9a8');
  const m = model();
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const d = x * x + z * z;
    if (d > 18) continue;
    m.set(x, 0, z, d > 12 ? '#ff7a59' : (x + 4) % 2 ? '#3a3f5c' : '#ffe9a8');
  }
  for (let a = 0; a < 8; a++) m.set(Math.round(Math.cos(a * Math.PI / 4) * 4.2), 1, Math.round(Math.sin(a * Math.PI / 4) * 4.2), '#ffd000');
  return m;
}

/** A thrown cargo net (flat grid). */
function cargoNet() {
  const m = model();
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) {
    if (x * x + z * z > 52) continue;
    if (x % 3 === 0 || z % 3 === 0) m.set(x, 0, z, (x + z) % 2 ? '#e6eaf0' : '#b9bec6');
  }
  for (const [x, z] of [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [-4, 4], [4, -4]]) m.set(x, 1, z, '#4f545d');
  return m;
}

// ---------------- boss: the Net Trawler ----------------
// A Greyscale airship. Front is +z. Three propeller engines are its weak points.

function trawlerBody() {
  const b = model();
  const env = '#b9bec6', envDark = '#8d939c', hull = '#80868f', dark = '#4f545d', trim = '#e6eaf0';
  // gas envelope
  for (let z = -15; z <= 15; z++) for (let x = -7; x <= 7; x++) for (let y = -5; y <= 5; y++) {
    if ((x * x) / 49 + (y * y) / 25 + (z * z) / 225 > 1) continue;
    b.set(x, y + 17, z, ((z + 15) % 6 === 0) ? envDark : y > 3 ? trim : env);
  }
  b.box(0, 22, -15, 0, 25, -10, dark).box(-9, 17, -15, -6, 17, -11, dark).box(6, 17, -15, 9, 17, -11, dark); // tail fins
  // struts
  for (const [x, z] of [[-3, -6], [3, -6], [-3, 6], [3, 6]]) b.box(x, 10, z, x, 12, z, dark);
  // gondola hull with a pointed bow
  for (let z = -10; z <= 12; z++) {
    const w = z > 6 ? Math.max(1, 5 - (z - 6)) : 5;
    for (let x = -w; x <= w; x++) for (let y = 4; y <= 9; y++) {
      b.set(x, y, z, y === 9 ? trim : y === 6 ? dark : hull);
    }
  }
  // bridge windows and the single glowing eye
  b.box(-3, 8, 8, 3, 8, 8, G.eye).box(-1, 7, 12, 1, 8, 12, G.eye);
  // net boom: a crane arm over the bow with a rolled net at the tip
  b.box(0, 10, 4, 0, 10, 16, dark).box(0, 11, 14, 0, 13, 14, dark);
  b.box(-2, 7, 17, 2, 9, 19, '#d6dae0').box(-1, 6, 18, 1, 6, 18, dark);
  // engine pylons
  b.box(-8, 8, -3, 8, 8, -1, dark).box(-1, 7, -16, 1, 7, -10, dark);
  return b;
}

function trawlerEngine(glow) {
  GLOW.add(glow);
  const e = model();
  e.box(-2, -2, -3, 2, 2, 3, '#80868f').box(-2, -2, -3, 2, -2, 3, '#4f545d');
  e.box(-1, -1, -4, 1, 1, -4, glow).box(-1, -1, 4, 1, 1, 4, '#4f545d');
  return e;
}

function propeller() {
  const p = model();
  p.box(-5, 0, 0, 5, 0, 0, '#e6eaf0').box(0, -5, 0, 0, 5, 0, '#e6eaf0').set(0, 0, 0, '#2a2f40');
  return p;
}

// ---------------- World 4: the Static Wastes ----------------

const NOISE = ['#1c1a33', '#4f545d', '#8d939c', '#c9ced6', '#f4f7ff'];
const nhash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** Static: a crackling TV-noise ghost with a glowing screen-face. */
function staticGhost() {
  GLOW.add('#9dfbff');
  const m = model();
  for (let y = 0; y <= 12; y++) {
    const r = y < 3 ? 1.5 + y : y > 9 ? 4.5 - (y - 9) : 4.5;
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
      if (x * x + z * z > r * r) continue;
      if (y < 3 && nhash(x, y, z) > 0.55) continue; // ragged, fading tail
      m.set(x, y, z, NOISE[Math.floor(nhash(x + 7, y, z) * NOISE.length)]);
    }
  }
  // a little old-TV face: screen, two eyes and a wobbly mouth
  m.box(-3, 6, 4, 3, 10, 4, '#2a2f40');
  m.box(-2, 8, 5, -1, 9, 5, '#9dfbff').box(1, 8, 5, 2, 9, 5, '#9dfbff').box(-2, 6, 5, 2, 6, 5, '#9dfbff').set(0, 7, 5, '#9dfbff');
  m.box(-2, 13, 0, -2, 15, 0, '#4f545d').box(2, 13, 0, 2, 15, 0, '#4f545d').set(-3, 16, 0, '#9dfbff').set(3, 16, 0, '#9dfbff');
  return m;
}

/** A seed plot in the glass: a cracked ring with a little hollow. */
function seedPlot() {
  const m = model();
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const d = x * x + z * z;
    if (d > 17 || d < 6) continue;
    m.set(x, 0, z, (x + z) % 3 ? '#c9d0e0' : '#8d939c');
  }
  m.box(-1, 0, -1, 1, 0, 1, '#5a3a24');
  for (const [x, z] of [[-4, 0], [4, 1], [0, -4], [1, 4]]) m.set(x, 1, z, '#e6ecf8');
  return m;
}

/** What a planted Color Seed becomes: a blossoming tree that heals Nova. */
function bloomTree() {
  GLOW.add('#ffe066');
  const m = model();
  m.box(-1, 0, -1, 1, 7, 1, '#8a5a3b').box(-3, 0, -1, -2, 0, 1, '#7a4f2e').box(2, 0, -1, 3, 0, 1, '#7a4f2e');
  for (let y = 7; y <= 14; y++) for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) {
    const d = x * x + z * z + ((y - 10.5) * 1.3) ** 2;
    if (d > 34) continue;
    const r = nhash(x, y, z);
    m.set(x, y, z, r > 0.9 ? '#ffe066' : r > 0.76 ? '#ff8fb1' : r > 0.4 ? '#5cc46a' : '#3f9b4a');
  }
  for (let k = 0; k < 10; k++) {
    const a = k * 0.63, rr = 3 + (k % 3);
    m.set(Math.round(Math.cos(a) * rr), 0, Math.round(Math.sin(a) * rr), k % 2 ? '#ff6fd8' : '#ffd23f');
  }
  return m;
}

/** Radio tower: a lattice mast with a dish. Tuned, its lights glow. */
function radioTower(on) {
  const light = on ? '#8cff7a' : '#8d939c', screen = on ? '#fff3a8' : '#5b6069';
  if (on) GLOW.add(light).add(screen);
  const m = model();
  m.box(-4, 0, -4, 4, 1, 4, '#3a3f5c');
  for (let y = 2; y <= 20; y++) {
    const w = Math.max(1, 3 - Math.floor(y / 7));
    for (const [x, z] of [[-w, -w], [w, -w], [-w, w], [w, w]]) m.set(x, y, z, on ? '#ff7a59' : '#80868f');
    if (y % 4 === 0) m.box(-w, y, -w, w, y, w, on ? '#ffd000' : '#6f747c');
  }
  m.box(-1, 21, -1, 1, 22, 1, light).set(0, 23, 0, light);
  // dish
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (x * x + y * y <= 10) m.set(x, 15 + y, 3 + Math.round((x * x + y * y) / 6), on ? '#e6ecf8' : '#9aa0a8');
  m.box(-2, 3, 4, 2, 5, 4, screen);
  return m;
}

/** A pane of grey glass that blocks the way until shattered. */
function glassBlock() {
  const m = model();
  for (let y = 0; y < 9; y++) for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
    if (y > 6 && (Math.abs(x) + Math.abs(z) > 9 - y)) continue;
    const r = nhash(x, y, z);
    m.set(x, y, z, r > 0.85 ? '#f4f7ff' : r > 0.5 ? '#c9d0e0' : '#aab3c8');
  }
  for (let y = 1; y < 7; y++) m.set(-3 + (y % 3), y, 4, '#8d939c');
  return m;
}

/** A Chroma geode: rough rock with green crystal showing through the cracks. */
function geode() {
  GLOW.add('#8cff7a');
  const m = model();
  for (let y = 0; y < 8; y++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const d = x * x + z * z + ((y - 3) * 1.2) ** 2;
    if (d > 20) continue;
    m.set(x, y, z, nhash(x, y, z) > 0.8 ? '#8cff7a' : (x + y + z) % 2 ? '#6b6f80' : '#5b5f70');
  }
  m.box(-1, 7, -1, 1, 9, 1, '#8cff7a').set(2, 8, 1, '#8cff7a').set(-2, 7, -2, '#8cff7a');
  return m;
}

/** Turn a voxel model into crackling TV static (keeps glowing parts, tints them cyan). */
function staticify(mdl, seed = 0, glowSet = GLOW) {
  GLOW.add('#9dfbff');
  const out = model();
  for (const [k, c] of mdl.m) {
    const [x, y, z] = k.split(',').map(Number);
    // keep the original's light and dark (so it still reads as Nova), then add noise on top
    const tone = Math.round(lum(c) * 4.2 + (nhash(x + seed, y * 3, z) - 0.5) * 1.6);
    out.m.set(k, glowSet.has(c) ? '#9dfbff' : NOISE[Math.max(0, Math.min(NOISE.length - 1, tone))]);
  }
  return out;
}

// ---------------- World 5: Pale, the Moon Vault ----------------

/** A museum jar of stolen color on a little pedestal. */
function colorJar(liquid) {
  const m = model();
  m.box(-4, 0, -4, 4, 2, 4, '#e6eaf0').box(-4, 2, -4, 4, 2, 4, '#c9ced6');
  for (let y = 3; y <= 11; y++) for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
    const d = x * x + z * z;
    if (d > 10) continue;
    const rim = d > 6;
    if (y >= 10) { if (rim) m.set(x, y, z, '#f4f7ff'); continue; }
    m.set(x, y, z, rim ? (y === 3 || (x + y) % 5 === 0 ? '#f4f7ff' : liquid) : liquid);
  }
  m.box(-2, 12, -2, 2, 12, 2, '#4f545d').set(0, 13, 0, '#4f545d');
  m.box(-1, 5, 3, 1, 6, 3, '#fff4e6');
  return m;
}

/** Archivist: a tall museum guard with a cap and an empty glass jar for your ammo. */
function archivist() {
  const m = model();
  m.box(-3, 0, -1, -2, 6, 1, G.dark).box(2, 0, -1, 3, 6, 1, G.dark);
  m.box(-4, 7, -3, 4, 17, 3, G.light).box(-4, 12, -3, 4, 12, 3, G.dark);
  m.box(-1, 8, 3, 1, 16, 3, '#f4f7ff');
  m.box(-3, 18, -3, 3, 22, 3, G.body).box(-2, 20, 4, 2, 20, 4, G.eye).box(-1, 20, 3, 1, 21, 3, '#2a2f40');
  m.box(-4, 23, -4, 4, 23, 5, '#2a2f40').box(-3, 24, -3, 3, 25, 3, '#2a2f40').box(-1, 24, 4, 1, 24, 4, '#ffd23f');
  m.box(5, 10, -1, 6, 16, 1, G.light).box(-6, 10, -1, -5, 16, 1, G.light);
  m.box(-6, 9, 2, -5, 9, 5, G.dark); // arm holding the jar out front
  return m;
}

function archivistJar() {
  const m = model();
  for (let y = 0; y <= 6; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    if (x * x + z * z > 5 || (x * x + z * z < 3 && y > 0 && y < 6)) continue;
    m.set(x, y, z, y === 6 ? '#4f545d' : '#e6ecf8');
  }
  return m;
}

/** Docent: a tiny old museum-guide robot who has been alone up here a long time. */
function docent() {
  GLOW.add('#ffe58a');
  const m = model();
  for (let y = 0; y <= 12; y++) for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
    if (x * x + ((y - 6) * 0.95) ** 2 + z * z > 30) continue;
    m.set(x, y, z, y === 6 ? '#b9bec6' : (x + z + y) % 7 === 0 ? '#c4a882' : '#e6eaf0');
  }
  m.box(-2, 7, 4, 2, 10, 5, '#2a2f40').box(-1, 8, 5, 1, 9, 6, '#ffe58a');
  m.box(-3, 4, 5, -1, 5, 5, '#ff4f6d').box(1, 4, 5, 3, 5, 5, '#ff4f6d').set(0, 4, 6, '#ff4f6d'); // bow tie
  m.box(0, 13, 0, 0, 15, 0, '#8d939c').set(0, 16, 0, '#ffe58a');
  for (const s of [-1, 1]) m.box(s * 6, 5, -1, s * 7, 6, 1, '#b9bec6');
  return m;
}

/** Security laser emitter on a pedestal. */
function laserTurret() {
  GLOW.add('#ff3d5e');
  return model().box(-3, 0, -3, 3, 4, 3, '#e6eaf0').box(-3, 4, -3, 3, 4, 3, '#b9bec6')
    .box(-2, 5, -2, 2, 7, 2, '#4f545d').box(-1, 8, -1, 1, 8, 1, '#ff3d5e').box(2, 6, -1, 3, 6, 1, '#ff3d5e');
}

/** Color mirror on the moon's far side: aim it home and it beams color to Kittara. */
function colorMirror(on) {
  const face = on ? '#fff3a8' : '#8d939c';
  if (on) GLOW.add(face);
  const m = model();
  m.box(-4, 0, -4, 4, 1, 4, '#5b6069').box(-1, 2, -1, 1, 8, 1, '#80868f');
  for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) if (x * x + y * y <= 28) m.set(x, 14 + y, 1 + Math.round((x * x + y * y) / 10), x * x + y * y > 22 ? '#c9ced6' : face);
  return m;
}

// ---------------- final boss: the Curator ----------------

/** The Curator: a great ring of white glass, tipped toward the viewer. Front is +z. */
function curatorRing(colorful = false) {
  GLOW.add('#f4f7ff');
  const m = model();
  for (let a = 0; a < 360; a += 1.2) {
    const t = a * Math.PI / 180;
    for (let r = 19; r <= 23; r++) for (let z = -2; z <= 2; z++) {
      const x = Math.round(Math.cos(t) * r), y = Math.round(Math.sin(t) * r);
      const rim = r === 19 || r === 23;
      if (colorful) {
        // reborn: a rainbow all the way round, rimmed in white
        m.set(x, y + 24, z, rim ? '#ffffff' : PAINT_JARS[Math.floor(a / 60) % 6]);
        continue;
      }
      const edge = rim || Math.abs(z) === 2;
      m.set(x, y + 24, z, edge ? '#c9ced6' : (Math.round(a) % 30 < 2 ? '#f4f7ff' : '#e6eaf0'));
    }
  }
  return m;
}

function curatorEye() {
  GLOW.add('#9dfbff');
  const m = model();
  for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) for (let z = -6; z <= 6; z++) {
    const d = x * x + y * y + z * z;
    if (d > 36) continue;
    m.set(x, y, z, z > 3 && x * x + y * y < 10 ? (x * x + y * y < 3 ? '#1c1a33' : '#9dfbff') : '#f4f7ff');
  }
  return m;
}

// ---------------- boss: the Weed Whacker ----------------
// Front is +z. The core sits under an armored shell that lifts when it overheats.

function whackerBody() {
  const b = model();
  const body = '#9aa0a8', dark = '#4f545d', light = '#c9ced6';
  GLOW.add('#f6f9ff');
  for (const [x, z] of [[-7, -6], [5, -6], [-7, 4], [5, 4]]) b.box(x, 0, z, x + 2, 4, z + 2, dark);
  for (let y = 4; y <= 12; y++) {
    const r = y <= 8 ? 8.5 : 8.5 - (y - 8) * 1.7;
    for (let x = -9; x <= 9; x++) for (let z = -9; z <= 9; z++) {
      if ((x * x) / (r * r) + (z * z) / (r * r * 0.85) > 1) continue;
      b.set(x, y, z, y === 7 ? dark : y >= 11 ? light : body);
    }
  }
  b.carve(-2, 11, 1, 2, 13, 5); // socket for the core
  b.box(-4, 9, -10, 4, 14, -6, dark).box(-3, 15, -9, 3, 15, -7, '#8cff7a'); // hopper full of stolen green
  b.box(-3, 8, 8, 3, 9, 8, '#f6f9ff').box(-4, 8, 7, 4, 10, 7, dark);
  b.box(7, 6, -2, 10, 10, 2, dark); // shoulder for the trimmer arm
  return b;
}

function whackerCore() {
  GLOW.add('#b8ff6a');
  const c = model();
  for (let x = -2; x <= 2; x++) for (let y = 0; y <= 3; y++) for (let z = -2; z <= 2; z++) {
    if (x * x + (y - 1.5) ** 2 + z * z <= 5.5) c.set(x, y, z, '#b8ff6a');
  }
  return c;
}

function whackerShell() {
  const s = model();
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) for (let y = 0; y <= 2; y++) {
    if (x * x + z * z <= 11 - y * 3) s.set(x, y, z, y === 2 ? '#c9ced6' : '#80868f');
  }
  return s;
}

function whackerArm() {
  const a = model();
  a.box(0, 0, -1, 22, 1, 1, '#4f545d').box(0, 2, 0, 22, 2, 0, '#80868f');
  for (const x of [6, 14]) a.box(x, -1, -2, x + 1, 3, 2, '#2a2f40');
  return a;
}

function trimmerHead() {
  const h = model();
  h.box(-2, 0, -2, 2, 2, 2, '#2a2f40').box(-1, 3, -1, 1, 3, 1, '#c9ced6');
  for (let r = 3; r <= 7; r++) {
    h.set(r, 1, 0, '#e8f5d0').set(-r, 1, 0, '#e8f5d0').set(0, 1, r, '#e8f5d0').set(0, 1, -r, '#e8f5d0');
  }
  return h;
}

// ---------------- boss: the Street Sweeper ----------------
// Front is +z. Brushes and tanks are separate parts so they can spin and break.

function sweeperChassis() {
  const b = model();
  const body = '#9aa0a8', light = '#c9ced6', dark = '#4f545d', trim = '#e6eaf0';
  GLOW.add('#f6f9ff');
  // wheels
  for (const x of [-11, 10]) for (const z of [-11, 6]) b.box(x, 0, z, x + 1, 4, z + 5, '#2a2f40');
  // chassis and hazard trim
  b.box(-10, 2, -14, 10, 8, 12, body);
  b.box(-10, 8, -14, 10, 8, 12, trim);
  for (let x = -10; x <= 10; x += 4) b.box(x, 3, 12, x + 1, 4, 12, dark);
  // cab with a single big glowing eye
  b.box(-8, 9, 1, 8, 17, 11, light).box(-8, 18, 1, 8, 18, 11, dark);
  b.box(-6, 12, 11, 6, 15, 11, dark).box(-5, 13, 11, 5, 14, 12, '#f6f9ff').box(-1, 12, 12, 1, 15, 12, '#f6f9ff');
  b.box(-1, 19, 5, 1, 19, 7, dark).set(0, 20, 6, '#f6f9ff');
  // rear tank rack and vacuum nozzle
  b.box(-10, 9, -14, 10, 9, -1, dark);
  for (const x of [-9, 9]) b.box(x, 10, -13, x, 14, -2, dark);
  b.box(-3, 1, 12, 3, 5, 17, dark).box(-2, 2, 18, 2, 4, 18, '#1c1a33');
  // exhaust stacks
  b.box(-9, 10, -1, -8, 20, 0, dark).box(8, 10, -1, 9, 20, 0, dark);
  return b;
}

function sweeperTank(color) {
  GLOW.add(color);
  return model().box(-2, 0, -2, 2, 0, 2, '#4f545d').box(-2, 1, -2, 2, 6, 2, color).box(-2, 7, -2, 2, 7, 2, '#4f545d')
    .box(-1, 8, -1, 1, 8, 1, '#e6eaf0').box(-2, 3, 2, 2, 3, 2, '#e6eaf0');
}

function sweeperBrush() {
  const b = model();
  for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
    const d = Math.hypot(x, z);
    if (d > 5.4) continue;
    b.set(x, 0, z, d < 1.6 ? '#2a2f40' : (Math.atan2(z, x) * 3 / Math.PI + 6) % 2 < 1 ? '#c9ced6' : '#e6eaf0');
  }
  return b.box(-1, 1, -1, 1, 2, 1, '#4f545d');
}

function brokenTank() {
  return model().box(-2, 0, -2, 2, 0, 2, '#4f545d').box(-2, 1, -2, -1, 2, 2, '#4f545d').box(1, 1, -2, 2, 3, -1, '#4f545d');
}

// ---------------- townscats (NPCs) ----------------

function catHead(n, o) {
  const white = o.muzzle || '#fff4e6';
  n.box(-5, 15, -4, 5, 22, 4, o.fur);
  n.box(-2, 15, 5, 2, 16, 5, white).box(-4, 15, 4, -3, 15, 4, white).box(3, 15, 4, 4, 15, 4, white);
  n.set(0, 16, 5, '#ff8fb1').set(0, 15, 5, '#1c1a33');
  for (const ex of [-3, 3]) n.box(ex - 1, 17, 4, ex + 1, 18, 4, o.eye).box(ex, 17, 4, ex, 18, 4, '#1c1a33').set(ex - 1, 18, 4, '#ffffff');
  if (o.stripes) {
    n.set(-1, 19, 4, o.furDark).set(1, 19, 4, o.furDark);
    for (const x of [-2, 0, 2]) n.box(x, 22, -3, x, 22, 3, o.furDark);
    for (const s of [-5, 5]) n.box(s, 17, -3, s, 17, 1, o.furDark);
  }
  if (!o.hood) {
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) n.box(Math.min(s * 5, s * (2 + k)), 23 + k, -1, Math.max(s * 5, s * (2 + k)), 23 + k, 1, o.fur);
      n.set(3 * s, 23, 1, '#ff8fb1').set(4 * s, 23, 1, '#ff8fb1');
    }
  }
  for (const s of [-1, 1]) n.set(6 * s, 16, 3, '#ffffff').set(6 * s, 15, 3, '#ffffff');
  if (o.glasses) {
    n.box(-5, 17, 5, -1, 18, 5, '#3a2a1a').box(1, 17, 5, 5, 18, 5, '#3a2a1a').set(0, 18, 5, '#3a2a1a');
    n.box(-4, 17, 5, -2, 18, 5, '#bfe9ff').box(2, 17, 5, 4, 18, 5, '#bfe9ff');
  }
  if (o.mustache) {
    n.box(-4, 15, 6, -1, 15, 6, o.mustache).box(1, 15, 6, 4, 15, 6, o.mustache);
    n.box(-4, 19, 5, -2, 19, 5, o.mustache).box(2, 19, 5, 4, 19, 5, o.mustache);
  }
}

function catNPC(o) {
  const n = model();
  const shoe = o.shoe || '#3a2a1a';
  n.box(-3, 0, -1, -1, 1, 2, shoe).box(1, 0, -1, 3, 1, 2, shoe);
  n.box(-3, 2, -1, -1, 5, 1, o.pants || o.fur).box(1, 2, -1, 3, 5, 1, o.pants || o.fur);
  n.box(-4, 6, -2, 4, 14, 2, o.top);
  if (o.belly) n.box(-1, 7, 2, 1, 13, 2, o.belly);
  if (o.trim) n.box(-4, 6, -2, 4, 6, 2, o.trim);
  if (o.buttons) for (const y of [8, 10, 12]) n.set(-2, y, 2, o.buttons);
  n.box(-6, 9, -1, -5, 14, 1, o.top).box(-6, 7, -1, -5, 8, 1, o.fur);
  n.box(5, 9, -1, 6, 14, 1, o.top).box(5, 7, -1, 6, 8, 1, o.fur);
  catHead(n, o);
  [[7, -3], [8, -4], [9, -5], [10, -5], [11, -5], [12, -4]].forEach(([y, z], i) => n.box(-1, y, z, 0, y, z, i % 2 ? o.furDark : o.fur));
  if (o.apron) n.box(-3, 6, 3, 3, 13, 3, o.apron).box(-2, 14, 3, 2, 14, 3, o.apron);
  if (o.scarf) n.box(-4, 14, -2, 4, 14, 3, o.scarf).box(2, 10, 3, 3, 13, 3, o.scarf);
  if (o.chefHat) n.box(-4, 23, -3, 4, 24, 3, '#ffffff').box(-5, 25, -4, 5, 28, 4, '#ffffff').box(-4, 29, -3, 4, 29, 3, '#ffffff');
  if (o.cap) {
    n.box(-5, 23, -4, 5, 23, 4, '#ffd23f').box(-5, 24, -4, 5, 25, 4, o.cap).box(-4, 23, 5, 4, 23, 7, o.cap);
    n.box(-1, 24, 5, 1, 25, 5, '#ffd23f');
  }
  if (o.hood) {
    n.box(-6, 15, -5, 6, 23, -5, o.top).box(-6, 15, -5, -6, 23, 3, o.top).box(6, 15, -5, 6, 23, 3, o.top).box(-6, 23, -5, 6, 23, 4, o.top);
    n.box(-2, 24, -1, -1, 24, 0, o.top).box(1, 24, -1, 2, 24, 0, o.top);
  }
  return n;
}

function recolor(mdl, fn) {
  const out = model();
  for (const [k, c] of mdl.m) out.m.set(k, fn(c));
  return out;
}
const lum = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return (((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11) / 255;
};
const hex = (r, g, b) => '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const toGrey = (c) => { const l = lum(c); return hex(96 + l * 110, 100 + l * 110, 110 + l * 110); };
const toHolo = (c) => { const l = lum(c); return hex(40 + l * 150, 170 + l * 85, 255); };

const NPC_LOOKS = {
  grandpa: { fur: '#f1d9a8', furDark: '#cfae76', top: '#4f9d69', belly: '#fff4e6', trim: '#3b7a50', buttons: '#ffd23f', pants: '#6b5a4a', eye: '#7ab8ff', glasses: true, mustache: '#ffffff' },
  biscuit: { fur: '#fff4e6', furDark: '#e3c9a8', top: '#ff8fb1', apron: '#ffffff', chefHat: true, eye: '#3be08f', muzzle: '#ffffff', stripes: true },
  mittens: { fur: '#2d2a3a', furDark: '#1c1a33', top: '#2f4aa8', belly: '#fff4e6', trim: '#ffd23f', buttons: '#ffd23f', cap: '#2f4aa8', pants: '#1f2f70', eye: '#ffd23f' },
  tom: { fur: '#a8683a', furDark: '#7a4522', top: '#62a8ff', apron: '#ffd23f', pants: '#2f4aa8', eye: '#3be08f', stripes: true, mustache: '#d9d0c4' },
  pip: { fur: '#2d2a3a', furDark: '#1c1a33', top: '#ffd23f', hood: true, pants: '#62a8ff', shoe: '#ff4f6d', eye: '#ffd23f' },
  cit0: { fur: '#fff4e6', furDark: '#f28c28', top: '#7ef0c8', eye: '#62a8ff', stripes: true },
  cit1: { fur: '#9fb4ff', furDark: '#7083d6', top: '#ff9a3d', eye: '#ffd23f', stripes: true },
  cit2: { fur: '#f3dcb0', furDark: '#d1b07c', top: '#c6a8ff', scarf: '#ff4f6d', eye: '#3be08f' },
  cit3: { fur: '#4a3030', furDark: '#2e1c1c', top: '#ffe27a', eye: '#7ef0c8' },
  cit4: { fur: '#f2a03d', furDark: '#c46a16', top: '#ff8fb1', glasses: true, eye: '#3be08f', stripes: true },
  fern: { fur: '#e0b07a', furDark: '#b8834a', top: '#3f9b4a', trim: '#2f7a3a', cap: '#2f7a3a', scarf: '#ffd23f', pants: '#7a5a3a', eye: '#ffd23f', stripes: true },
  wick: { fur: '#f3dcb0', furDark: '#d1b07c', top: '#4b34b3', trim: '#e8ff7a', scarf: '#e8ff7a', pants: '#2a2f40', eye: '#e8ff7a', mustache: '#ffffff', glasses: true },
  saffron: { fur: '#f6c27a', furDark: '#d8964a', top: '#ff7a59', belly: '#fff4e6', trim: '#ffd23f', buttons: '#ffd23f', cap: '#f4f7ff', pants: '#2f4aa8', eye: '#62a8ff', scarf: '#3de0c8', stripes: true },
  juno: { fur: '#9fb4ff', furDark: '#7083d6', top: '#7ef0c8', scarf: '#ffd23f', pants: '#4b34b3', shoe: '#ff7a59', eye: '#ffd23f', glasses: true },
  gale: { fur: '#4a3030', furDark: '#2e1c1c', top: '#ffd000', hood: true, pants: '#2f4aa8', shoe: '#2a2f40', eye: '#7ef0c8', mustache: '#d9d0c4' },
  quartz: { fur: '#d9d0c4', furDark: '#b8ab9a', top: '#c08a57', belly: '#f4e3c8', trim: '#8a5a3b', cap: '#8a5a3b', scarf: '#62f4ff', pants: '#5a3a24', eye: '#62a8ff', glasses: true, mustache: '#ffffff' },
  dot: { fur: '#ff9a3d', furDark: '#2d2a3a', top: '#3a3f5c', trim: '#ffd23f', cap: '#ff4f6d', scarf: '#ffd23f', pants: '#2f4aa8', shoe: '#ff4f6d', eye: '#62f4ff', stripes: true },
  moss: { fur: '#d9c7a8', furDark: '#b8a27e', top: '#8a5a3b', belly: '#fff4e6', buttons: '#ffd23f', pants: '#5a3a24', eye: '#62a8ff', glasses: true, mustache: '#ffffff' },
};
export const CITIZENS = ['cit0', 'cit1', 'cit2', 'cit3', 'cit4'];
const ROBOT_NPCS = { docent };

/** NPC meshes: color, frozen-grey and hologram variants. */
export const NPC = {};
for (const [id, look] of Object.entries(NPC_LOOKS)) {
  const base = catNPC(look);
  const scale = id === 'pip' ? S * 0.8 : S;
  NPC[id] = { color: meshModel(base, scale), grey: meshModel(recolor(base, toGrey), scale), holo: meshModel(recolor(base, toHolo), scale) };
}
for (const [id, fn] of Object.entries(ROBOT_NPCS)) {
  const base = fn();
  NPC[id] = { color: meshModel(base, S), grey: meshModel(recolor(base, toGrey), S), holo: meshModel(recolor(base, toHolo), S) };
}

// ---------------- meshed, shared geometry ----------------

/** Stolen colors sealed in the Moon Vault's jars. */
export const PAINT_JARS = ['#ff4f6d', '#ffd23f', '#7ef0c8', '#62a8ff', '#c6a8ff', '#ff9a3d'];

export const MESH = {
  novaBody: null, // built by applyNovaLook
  novaLeg: null,
  drab: meshModel(drab(), S),
  smudge: null, // built by applyNovaLook
  mopper: meshModel(mopper(), S),
  mopperBare: meshModel(mopper(false), S),
  fizz: meshModel(fizz(), S),
  vat: meshModel(greyVat(), S * 1.6),
  beaconOff: meshModel(beacon(false), S * 1.6),
  beaconOn: meshModel(beacon(true), S * 1.6),
  generatorOff: meshModel(generator(false), S * 1.3),
  generatorOn: meshModel(generator(true), S * 1.3),
  spark: meshModel(sparkGem(), 0.12),
  sardine: meshModel(sardineTin(), 0.12),
  seed: meshModel(colorSeed(), 0.16),
  bomb: meshModel(paintBomb(), 0.18),
  weapon_splatter: meshModel(weaponCase('#ff8a3d', '#ffb36b'), 0.12),
  weapon_hose: meshModel(weaponCase('#2fb5d6', '#62f4ff'), 0.12),
  weapon_bubble: meshModel(weaponCase('#2f5fd6', '#9cc2ff'), 0.12),
  weapon_ricochet: meshModel(weaponCase('#e8b400', '#fff07a'), 0.12),
  stencil: meshModel(stencil(), S),
  skyWhale: meshModel(skyWhale(), 0.24),
  skyWhaleGrey: meshModel(recolor(skyWhale(), toGrey), 0.24),
  clouds: [0, 1, 2].map((i) => meshModel(cloud(i), 0.9)),
  ventPad: meshModel(ventPad(), 0.18),
  net: meshModel(cargoNet(), 0.36),
  trawler: meshModel(trawlerBody(), SB),
  trawlerEngines: ['#ff6f59', '#ffd000', '#3de0c8'].map((c) => meshModel(trawlerEngine(c), SB)),
  trawlerProp: meshModel(propeller(), SB),
  weapon_mortar: meshModel(weaponCase('#3f9b4a', '#b8ff6a'), 0.12),
  static: meshModel(staticGhost(), S),
  seedPlot: meshModel(seedPlot(), 0.2),
  bloomTree: meshModel(bloomTree(), 0.24),
  towerOff: meshModel(radioTower(false), 0.2),
  towerOn: meshModel(radioTower(true), 0.2),
  glass: meshModel(glassBlock(), 0.5),
  geode: meshModel(geode(), 0.46),
  echoBody: null,
  echoLeg: null,
  weapon_beam: meshModel(weaponCase('#c6a8ff', '#ffffff'), 0.12),
  jars: PAINT_JARS.map((c) => meshModel(colorJar(c), 0.24)),
  archivist: meshModel(archivist(), S),
  archivistJar: meshModel(archivistJar(), S),
  laserTurret: meshModel(laserTurret(), 0.22),
  mirrorOff: meshModel(colorMirror(false), 0.22),
  mirrorOn: meshModel(colorMirror(true), 0.22),
  curatorRing: meshModel(curatorRing(), SB),
  curatorRingColor: meshModel(curatorRing(true), SB),
  curatorEye: meshModel(curatorEye(), SB),
  smear: meshModel(smear(), S),
  smearMini: meshModel(smear(), S * 0.6),
  bouncePad: meshModel(bouncePad(), 0.18),
  lanternOff: meshModel(lantern(false), 0.2),
  lanternOn: meshModel(lantern(true), 0.2),
  bramble: meshModel(bramble(), 0.22),
  whacker: meshModel(whackerBody(), SB),
  whackerCore: meshModel(whackerCore(), SB),
  whackerShell: meshModel(whackerShell(), SB),
  whackerArm: meshModel(whackerArm(), SB, [0, 0.5, 0]),
  whackerHead: meshModel(trimmerHead(), SB),
  sweeper: meshModel(sweeperChassis(), SB),
  sweeperBrush: meshModel(sweeperBrush(), SB),
  sweeperTankBroken: meshModel(brokenTank(), SB),
  sweeperTanks: ['#ff3d5e', '#ffd000', '#3d8bff'].map((c) => meshModel(sweeperTank(c), SB)),
};

/** Smudge from the wardrobe: a paint scheme plus an antenna or a little hat. */
function smudgeModel(look = {}) {
  const p = { ...SMUDGE, ...look.smudgeColors };
  const d = drab(p);
  d.del(0, 11, 0).del(0, 12, 0).del(0, 13, 0);
  switch (look.smudgeTop) {
    case 'heart':
      d.set(0, 11, 0, p.dark).set(0, 12, 0, p.dark).box(-1, 13, 0, 1, 14, 0, '#ff4f6d').del(0, 14, 0).set(0, 12, 1, '#ff4f6d');
      break;
    case 'double':
      for (const x of [-2, 2]) d.set(x, 11, 0, p.dark).set(x, 12, 0, p.dark).set(x, 13, 0, p.eye);
      break;
    case 'propeller':
      d.box(-1, 11, -1, 1, 11, 1, '#ffd23f').set(0, 12, 0, p.dark).box(-3, 13, 0, 3, 13, 0, '#ff4f6d').box(0, 13, -3, 0, 13, 3, '#62a8ff').set(0, 13, 0, '#ffffff');
      break;
    case 'flower':
      d.set(0, 11, 0, '#3f9b4a').set(0, 12, 0, '#3f9b4a').set(0, 13, 0, '#ffd23f');
      for (const [x, y, z] of [[-1, 13, 0], [1, 13, 0], [0, 14, 0], [0, 13, -1], [0, 13, 1]]) d.set(x, y, z, '#ff8fb1');
      break;
    case 'bow':
      d.box(-3, 11, 0, -1, 12, 0, '#ff4f6d').box(1, 11, 0, 3, 12, 0, '#ff4f6d').set(0, 11, 0, '#c4304f');
      break;
    case 'tophat':
      d.box(-2, 11, -2, 2, 11, 2, '#1c1a33').box(-1, 12, -1, 1, 14, 1, '#1c1a33').box(-1, 12, -1, 1, 12, 1, '#c4304f');
      break;
    case 'party':
      for (let y = 11; y <= 14; y++) { const r = y < 13 ? 1 : 0; d.box(-r, y, -r, r, y, r, y % 2 ? '#ff4f6d' : '#ffd23f'); }
      d.set(0, 15, 0, '#7ef0c8');
      break;
    case 'crown':
      d.box(-2, 11, -2, 2, 11, 2, '#ffd23f');
      for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 2]]) d.set(x, 12, z, '#ffd23f');
      d.set(0, 11, 3, '#ff4f6d');
      break;
    default:
      d.set(0, 11, 0, p.dark).set(0, 12, 0, p.dark).set(0, 13, 0, p.eye);
  }
  return d;
}

/**
 * (Re)build Nova's meshes for a look from the wardrobe ({ colors, hat, neck }).
 * The Echo is a static copy of Nova, so it is rebuilt to match.
 */
export function applyNovaLook(look = {}) {
  for (const k of ['novaBody', 'novaLeg', 'echoBody', 'echoLeg', 'smudge']) {
    const old = MESH[k];
    if (old) { old.solid?.dispose(); old.glow?.dispose(); }
  }
  const glow = novaGlow(look);
  MESH.novaBody = meshModel(novaBody(look), S, [0, 0, 0], glow);
  MESH.novaLeg = meshModel(novaLeg(look), S, [0, 6, 0], glow);
  MESH.echoBody = meshModel(staticify(novaBody(look), 0, glow), S * 1.9);
  MESH.echoLeg = meshModel(staticify(novaLeg(look), 5, glow), S * 1.9, [0, 6, 0]);
  MESH.smudge = meshModel(smudgeModel(look), S * 0.8, [0, 0, 0], smudgeGlow(look));
}
applyNovaLook();

/** Weed Whacker part offsets (voxel space; multiply by SB). */
export const WHACKER = { core: { x: 0, y: 11, z: 3 }, shoulder: { x: 9, y: 7 }, armLen: 22, headX: 31, bladeR: 7 };

/** Street Sweeper part offsets in chassis voxel space. */
export const SWEEPER = {
  tanks: [{ x: -6, y: 10, z: -8 }, { x: 0, y: 10, z: -8 }, { x: 6, y: 10, z: -8 }],
  brushes: [{ x: -8, y: 0.3, z: 14 }, { x: 8, y: 0.3, z: 14 }],
  nozzle: { x: 0, z: 18 },
  colors: ['#ff3d5e', '#ffd000', '#3d8bff'],
};

/** Net Trawler part offsets in body voxel space: left, right and stern engines. */
export const TRAWLER = {
  engines: [{ x: -9, y: 8, z: -2 }, { x: 9, y: 8, z: -2 }, { x: 0, y: 7, z: -18 }],
  colors: ['#ff6f59', '#ffd000', '#3de0c8'],
};

/** The Curator's ring sits this high (world units) above its base. */
export const CURATOR = { eyeY: 24 * SB };

/** Muzzle position of Nova's blaster in body space (world units). */
export const MUZZLE = { x: 7 * S, y: 10.5 * S, z: 10.5 * S };
