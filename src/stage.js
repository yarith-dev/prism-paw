import * as THREE from 'three';
import { GLOW, model, meshModel, instance } from './voxel.js';
import { MESH, NPC, S, SB, SWEEPER, CURATOR, WHACKER, TRAWLER, PAINT_JARS } from './models.js';

/**
 * Comic stage: renders each story panel as a small lit voxel diorama (a set, a cast,
 * a camera shot) with a slow camera push and idle motion, behind the CSS fx layers.
 *
 * Panel fields: set, shot, cast, mood?, grey?
 *   set   street | festival | workshop | jungle | ruins | lab | docks | wastes | meadow | mine | heart
 *         | vault | gallery | moon | core | sky | none
 *   shot  wide | solo | two | group | close | threat | low | high
 *   cast  tokens `name[:mod…][*count][@x,z[,yaw]]`; mods: grey holo float up raise big small back left right on color
 *         Tokens without @ are laid out by the shot; with @ they stand exactly there.
 *   mood  day | dusk | night | grey | warm | cold (defaults per set; grey sets also grey the scenery)
 *   cam   optional [x, y, z] direction from the subject to the camera, overriding the shot's angle
 *   spin  turn the focused cast slowly (a turntable, used by the wardrobe preview)
 */

const V = 0.5; // scenery voxel size, same as level scenery
const WIN = '#ffe9a6', RUNE = '#7ff6ff', CAPG = ['#ff7fe0', '#6fe8ff', '#c39bff', '#ffbd3f'], CRACK = '#eaf6ff', STAR = '#fffdf2';
const FLOWER = ['#ff8fb1', '#ffe066', '#c6a8ff', '#7ef0c8', '#ff7a59'];
[WIN, RUNE, CRACK, STAR, ...CAPG].forEach((c) => GLOW.add(c));

const lum = (hex) => { const c = new THREE.Color(hex); return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; };
const hex = (r, g, b) => '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const greyOf = (c) => { const l = lum(c); return hex(80 + l * 120, 84 + l * 120, 94 + l * 120); };
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------ scenery models

/** Build a voxel model through a color filter (identity or grey) and cache its mesh. */
const meshCache = {};
function piece(name, grey, build, pivot) {
  const id = `${name}:${grey ? 'g' : 'c'}`;
  if (!meshCache[id]) {
    const m = model();
    const paint = grey ? (c) => (GLOW.has(c) ? '#d9dce4' : greyOf(c)) : (c) => c;
    build({ set: (x, y, z, c) => m.set(x, y, z, paint(c)), box: (a, b, c, d, e, f, col) => m.box(a, b, c, d, e, f, paint(col)) });
    meshCache[id] = meshModel(m, V, pivot);
  }
  return meshCache[id];
}

const HOUSES = [['#ff9ab8', '#c4456f'], ['#7ef0c8', '#2f9e86'], ['#ffd76a', '#e07a3f'], ['#a8b8ff', '#5a5fd6'], ['#ffb38a', '#c45d16']];
function house(v, grey) {
  const [wall, roof] = HOUSES[v % HOUSES.length];
  const w = 10, d = 8, h = 9 + (v % 3) * 3;
  return piece(`house${v}`, grey, (m) => {
    m.box(0, 0, 0, w - 1, h - 1, d - 1, wall);
    m.box(0, 0, d - 1, w - 1, 0, d - 1, '#8a5a3b');
    for (let i = 0; i < 6; i++) m.box(-1 + i, h + i, -1, w - i, h + i, d, roof);
    m.box(w - 3, h + 1, 3, w - 2, h + 6, 4, '#8d6a5a'); // chimney
    for (let y = 3; y < h - 1; y += 4) for (const x of [1, 6]) {
      m.box(x, y, d, x + 2, y + 2, d, '#5a3a24');
      m.box(x + 1, y + 1, d, x + 1, y + 1, d, WIN);
      m.box(x, y + 1, d, x, y + 1, d, WIN); m.box(x + 2, y + 1, d, x + 2, y + 1, d, WIN);
    }
    m.box(4, 0, d, 5, 2, d, '#5a3a24');
    for (let x = 0; x < w; x++) m.set(x, 3, d + 1, x % 2 ? '#ffffff' : roof); // awning
  }, [w / 2, 0, d / 2]);
}

const lampPost = (grey) => piece('lamp', grey, (m) => {
  m.box(0, 0, 0, 0, 9, 0, '#3a3f5c'); m.box(-1, 10, -1, 1, 11, 1, WIN); m.box(-1, 12, -1, 1, 12, 1, '#3a3f5c');
});

const bunting = (grey) => piece('bunting', grey, (m) => {
  for (let x = 0; x <= 36; x++) {
    const y = 14 - Math.round(Math.sin((x / 36) * Math.PI) * 3);
    m.set(x, y, 0, '#ffffff');
    if (x % 3 === 1) m.box(x, y - 2, 0, x, y - 1, 0, FLOWER[(x / 3 | 0) % FLOWER.length]);
  }
}, [18, 0, 0]);

const crate = (v, grey) => piece(`crate${v}`, grey, (m) => {
  const c = ['#c08a57', '#ff7a59', '#3de0c8', '#8f7bff'][v % 4];
  m.box(0, 0, 0, 3, 3, 3, c); m.box(0, 3, 0, 3, 3, 3, '#5a3a24'); m.box(1, 1, 4, 2, 2, 4, '#5a3a24');
}, [2, 0, 2]);

const workshopWall = (grey) => piece('wwall', grey, (m) => {
  m.box(0, 0, 0, 39, 17, 0, '#8a5a3b');
  for (let x = 0; x < 40; x += 5) m.box(x, 0, 1, x, 17, 1, '#6b4429');
  for (const y of [6, 11]) {
    m.box(2, y, 1, 15, y, 3, '#c08a57');
    for (let x = 3; x < 15; x += 2) m.box(x, y + 1, 2, x, y + 1 + (x % 3), 2, PAINT_JARS[x % PAINT_JARS.length]);
  }
  m.box(24, 6, 1, 35, 13, 1, '#2a2f40'); // blueprint board
  for (let i = 0; i < 9; i++) m.set(25 + i, 8 + (i % 3), 1, RUNE);
  m.box(26, 11, 1, 33, 11, 1, RUNE);
  m.box(0, 15, 1, 39, 15, 2, '#c9ced6'); // pipe
  m.box(18, 0, 1, 19, 15, 2, '#c9ced6');
  m.box(18, 9, 3, 19, 10, 3, '#ff4f6d');
}, [20, 0, 0]);

const bench = (grey) => piece('bench', grey, (m) => {
  m.box(0, 4, 0, 11, 4, 4, '#c08a57'); for (const [x, z] of [[0, 0], [11, 0], [0, 4], [11, 4]]) m.box(x, 0, z, x, 3, z, '#6b4429');
  m.box(2, 5, 1, 4, 6, 2, '#454c63'); m.box(5, 5, 1, 9, 5, 3, '#2a2f40'); m.set(7, 6, 2, '#ff4fd8'); m.box(9, 5, 1, 9, 7, 1, WIN);
}, [6, 0, 2]);

function mushroom(v, grey) {
  const cap = CAPG[v % CAPG.length], stem = 4 + (v % 3) * 3, r = 3 + (v % 2) * 1.5;
  return piece(`mush${v}`, grey, (m) => {
    m.box(0, 0, 0, 1, stem, 1, '#f4e3c8');
    for (let y = stem; y <= stem + 2; y++) {
      const rr = y === stem + 2 ? r - 1.3 : r;
      for (let x = -5; x <= 6; x++) for (let z = -5; z <= 6; z++) {
        if ((x - 0.5) ** 2 + (z - 0.5) ** 2 > rr * rr) continue;
        m.set(x, y, z, y === stem + 2 && rnd(x * 7 + z * 13 + v) > 0.75 ? '#fff5b8' : cap);
      }
    }
  }, [0.5, 0, 0.5]);
}

const jungleTree = (v, grey) => piece(`jtree${v}`, grey, (m) => {
  const h = 12 + (v % 3) * 3;
  m.box(0, 0, 0, 1, h, 1, '#5a3a24');
  for (let y = h - 2; y <= h + 3; y++) for (let x = -4; x <= 5; x++) for (let z = -4; z <= 5; z++) {
    const r = 5 - Math.abs(y - h - 0.5) * 0.7;
    if ((x - 0.5) ** 2 + (z - 0.5) ** 2 < r * r && rnd(x * 3 + y * 5 + z * 7 + v) > 0.12) m.set(x, y, z, rnd(x + y + z + v) > 0.5 ? '#145a4f' : '#1f7a5c');
  }
}, [0.5, 0, 0.5]);

const fern = (v, grey) => piece(`fern${v}`, grey, (m) => {
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; for (let k = 0; k < 3; k++) m.set(Math.round(Math.cos(a) * k), Math.max(0, 2 - Math.floor(k / 2)), Math.round(Math.sin(a) * k), k === 2 ? '#2fb58f' : '#1f7a5c'); }
});

const pillar = (v, grey) => piece(`pillar${v}`, grey, (m) => {
  const h = 8 + (v % 3) * 4;
  m.box(0, 0, 0, 3, h, 3, '#5a5f8a'); m.box(-1, 0, -1, 4, 0, 4, '#4a4f78'); if (v % 2) m.box(-1, h + 1, -1, 4, h + 1, 4, '#7a7fab');
  for (let y = 2; y < h - 1; y += 3) m.box(1, y, 4, 2, y + 1, 4, RUNE);
}, [1.5, 0, 1.5]);

const pier = (grey) => piece('pier', grey, (m) => {
  for (let x = 0; x < 48; x++) { if (x % 6 === 0) m.box(x, 0, 0, x, 4, 0, '#6b4429'); m.set(x, 4, 0, '#8a5a3b'); m.set(x, 2, 0, x % 2 ? '#8a5a3b' : '#6b4429'); }
}, [24, 0, 0]);

const mast = (grey) => piece('mast', grey, (m) => {
  m.box(0, 0, 0, 0, 26, 0, '#6b4429');
  m.box(-8, 22, 0, 8, 22, 0, '#6b4429');
  for (let y = 10; y < 22; y++) { const half = 7 - Math.round((22 - y) * 0.25); m.box(-half, y, 1, half, y, 1, y % 4 < 2 ? '#fff4e6' : '#ff7a59'); }
  m.box(1, 26, 0, 4, 27, 0, '#ffd23f');
});

const spire = (v, grey) => piece(`spire${v}`, grey, (m) => {
  const h = 10 + (v % 4) * 5;
  for (let y = 0; y < h; y++) {
    const r = Math.max(0.6, 2.6 - y / h * 2.4);
    for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) if (x * x + z * z <= r * r) m.set(x + (y > h * 0.6 ? v % 2 : 0), y, z, (x + y + z + v) % 7 === 0 ? CRACK : y % 5 === 0 ? '#9aa0b4' : '#b7bcc8');
  }
});

const kittara = (grey) => piece('kittara', grey, (m) => {
  const R = 9;
  for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) for (let z = -R; z <= R; z++) {
    const d = Math.hypot(x, y, z); if (d > R || d < R - 1.6) continue;
    const land = rnd(Math.floor(x / 3) * 11 + Math.floor(y / 3) * 7 + Math.floor(z / 3) * 3) > 0.62;
    m.set(x, y, z, Math.abs(y) > R - 2 ? '#ffffff' : land ? (y > 0 ? '#8cdc7a' : '#ff9ab8') : '#4f8dff');
  }
}, [0, -9, 0]);

const rocket = (grey) => piece('rocket', grey, (m) => {
  for (let y = 0; y < 26; y++) {
    const r = y < 3 ? 2 : y > 20 ? Math.max(0, 2.6 - (y - 20) * 0.5) : 2.6;
    for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) if (Math.hypot(x, z) <= r) m.set(x, y, z, y > 23 || y % 6 === 0 ? '#ff4f6d' : y === 14 && z > 1 ? '#8cff7a' : '#f4f7ff');
  }
  for (const [x, z] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) m.box(x, 0, z, x, 5, z, '#ff4f6d');
});

const column = (grey) => piece('column', grey, (m) => {
  m.box(-1, 0, -1, 2, 0, 2, '#c9ced6'); m.box(-1, 15, -1, 2, 15, 2, '#c9ced6');
  for (let y = 1; y < 15; y++) m.box(0, y, 0, 1, y, 1, '#f4f4f8');
});

const vaultWall = (grey) => piece('vwall', grey, (m) => {
  m.box(0, 0, 0, 47, 15, 0, '#eef0f5');
  m.box(0, 15, 0, 47, 15, 1, '#d9dce4'); m.box(0, 0, 1, 47, 0, 1, '#c9ced6');
  for (const x0 of [4, 20, 36]) { // arched windows onto space
    for (let y = 3; y <= 11; y++) for (let x = x0; x <= x0 + 7; x++) {
      const top = y > 9 && Math.abs(x - x0 - 3.5) > 12 - y; if (top) continue;
      m.set(x, y, 0, rnd(x * 13 + y * 7) > 0.93 ? STAR : '#0b0d1a');
    }
  }
}, [24, 0, 0]);

const pedestal = (grey) => piece('pedestal', grey, (m) => { m.box(0, 0, 0, 3, 3, 3, '#f4f4f8'); m.box(-1, 4, -1, 4, 4, 4, '#d9dce4'); m.box(1, 2, 4, 2, 2, 4, '#c4a35a'); }, [1.5, 0, 1.5]);

const crater = (v, grey) => piece(`crater${v}`, grey, (m) => {
  const R = 3 + v % 3;
  for (let x = -R - 1; x <= R + 1; x++) for (let z = -R - 1; z <= R + 1; z++) { const d = Math.hypot(x, z); if (d > R - 0.7 && d < R + 0.7) m.set(x, 0, z, '#9aa0ae'); }
});

const mineWall = (grey) => piece('mwall', grey, (m) => {
  for (let x = 0; x < 48; x++) { const h = 10 + Math.round(rnd(x) * 5); m.box(x, 0, 0, x, h, 1, rnd(x * 3) > 0.5 ? '#3d3a5c' : '#4b4868'); if (rnd(x * 5) > 0.85) m.set(x, 4 + (x % 5), 2, '#8cff7a'); }
}, [24, 0, 0]);

const flowers = (grey) => piece('flowers', grey, (m) => {
  for (let i = 0; i < 90; i++) { const x = Math.round((rnd(i) - 0.5) * 60), z = Math.round((rnd(i + 99) - 0.5) * 40); m.set(x, 0, z, '#3f9b4a'); m.set(x, 1, z, FLOWER[i % FLOWER.length]); }
});

const glowWeeds = (grey) => piece('weeds', grey, (m) => {
  for (let i = 0; i < 70; i++) { const x = Math.round((rnd(i) - 0.5) * 60), z = Math.round((rnd(i + 51) - 0.5) * 40); m.box(x, 0, z, x, (i % 3), z, '#1f7a5c'); if (i % 4 === 0) m.set(x, 1 + (i % 3), z, CAPG[i % 4]); }
});

// ------------------------------------------------------------------ ground

function groundTex(base, line, step = 32, mode = 'tiles') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = line; g.lineWidth = 2;
  if (mode === 'planks') for (let y = 0; y < 128; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); g.beginPath(); g.moveTo((y * 37) % 128, y); g.lineTo((y * 37) % 128, y + 16); g.stroke(); }
  else if (mode === 'cracks') for (let i = 0; i < 9; i++) { g.beginPath(); let x = rnd(i) * 128, y = rnd(i + 9) * 128; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd(i * 4 + k) - 0.5) * 60; y += (rnd(i * 7 + k) - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  else if (mode === 'specks') for (let i = 0; i < 160; i++) { g.fillStyle = rnd(i) > 0.5 ? line : base; g.fillRect(rnd(i + 3) * 128, rnd(i + 7) * 128, 3, 3); }
  else for (let y = 0; y < 128; y += step) for (let x = 0; x < 128; x += step) g.strokeRect(x + ((y / step) % 2) * step / 2, y, step, step);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 14);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ sets

const SETS = {
  street: { mood: 'day', ground: ['#e7b3c8', '#c98aa6'], build: (add, g) => {
    [-17, -6, 5, 16].forEach((x, i) => add(house(i, g), x, -10, 0));
    add(house(4, g), -24, -2, Math.PI / 2); add(house(1, g), 24, -3, -Math.PI / 2);
    add(lampPost(g), -6, -3); add(lampPost(g), 8, -3);
  } },
  festival: { mood: 'day', ground: ['#ffd6a8', '#e0a878'], build: (add, g) => {
    [-15, -4, 7, 18].forEach((x, i) => add(house(i + 1, g), x, -11, 0));
    add(bunting(g), 0, -6); add(bunting(g), 0, -3.5);
    add(lampPost(g), -10, -4); add(lampPost(g), 11, -4);
    add(crate(1, g), -7, -5); add(crate(2, g), -5.6, -5.4, 0.4);
  } },
  workshop: { mood: 'warm', ground: ['#a8744a', '#8a5a3b', 0, 'planks'], build: (add, g) => {
    add(workshopWall(g), 0, -6); add(bench(g), 5.5, -4.2); add(crate(0, g), -8, -4.5); add(crate(3, g), -6.4, -4.8, 0.3);
  } },
  jungle: { mood: 'night', ground: ['#145a4f', '#0b2a2a', 0, 'specks'], build: (add, g) => {
    [[-12, -9, 0], [-4, -12, 1], [7, -10, 2], [15, -7, 3], [-17, -3, 4]].forEach(([x, z, v]) => add(jungleTree(v, g), x, z));
    [[-8, -5, 0], [4, -6, 1], [11, -4, 2], [-3, -8, 3], [16, -12, 1]].forEach(([x, z, v]) => add(mushroom(v, g), x, z));
    add(glowWeeds(g), 0, 0); add(fern(0, g), -5, -2); add(fern(1, g), 6, -2);
  } },
  ruins: { mood: 'cold', ground: ['#4a4f78', '#3d3a5c'], build: (add, g) => {
    [-12, -6, 6, 12].forEach((x, i) => add(pillar(i, g), x, -8 - (i % 2) * 2));
    add(mushroom(1, g), -2, -11); add(jungleTree(2, g), 16, -12); add(glowWeeds(g), 0, 0);
  } },
  lab: { mood: 'cold', ground: ['#3d3a5c', '#5a5f8a'], build: (add, g) => {
    [-9, -3, 3, 9].forEach((x, i) => add(pillar(i + 1, g), x, -7));
    add(mineWall(g), 0, -10);
  } },
  docks: { mood: 'day', ground: ['#a8744a', '#8a5a3b', 0, 'planks'], groundW: 30, build: (add, g, extra) => {
    add(pier(g), 0, -7); add(mast(g), -9, -9); add(mast(g), 12, -12);
    add(crate(1, g), 7, -5); add(crate(2, g), 8.6, -5.6, 0.3); add(crate(3, g), 7.8, -5.3, 0, 2);
    extra.clouds = true;
  } },
  sky: { mood: 'day', ground: null, build: (add, g, extra) => { extra.clouds = true; } },
  wastes: { mood: 'grey', ground: ['#8d93a8', '#6b6878', 0, 'cracks'], build: (add, g) => {
    [[-14, -9, 0], [-6, -13, 1], [5, -11, 2], [13, -8, 3], [19, -14, 1], [-20, -6, 2]].forEach(([x, z, v]) => add(spire(v, g), x, z));
  } },
  heart: { mood: 'grey', ground: ['#8d93a8', '#6b6878', 0, 'cracks'], build: (add, g) => {
    [[-10, -8, 3], [10, -9, 1], [-16, -12, 0], [16, -13, 2]].forEach(([x, z, v]) => add(spire(v, g), x, z));
    add(spire(3, g), 0, -10, 0, 1.8);
  } },
  meadow: { mood: 'dusk', ground: ['#8cdc7a', '#6bbf5a', 0, 'specks'], build: (add, g) => {
    add(flowers(g), 0, 0);
    [[-10, -8], [8, -10], [16, -6], [-17, -12]].forEach(([x, z]) => add(MESH.bloomTree, x, z, 0, 1.4));
    add(spire(1, g), 2, -14);
  } },
  mine: { mood: 'cold', ground: ['#3d3a5c', '#2a2840', 0, 'specks'], build: (add, g) => {
    add(mineWall(g), 0, -8);
    [[-8, -6], [4, -6.5], [10, -5]].forEach(([x, z]) => add(MESH.geode, x, z));
  } },
  vault: { mood: 'cold', ground: ['#f4f4f8', '#d9dce4', 40], build: (add, g) => {
    add(vaultWall(g), 0, -9);
    [-14, -5, 5, 14].forEach((x) => add(column(g), x, -7.5));
    [[-9.5, -6.5], [0, -7], [9.5, -6.5]].forEach(([x, z], i) => { add(pedestal(g), x, z); add(MESH.jars[i * 2 % 6], x, z, 0, 1, 2.5); });
  } },
  gallery: { mood: 'cold', ground: ['#f4f4f8', '#d9dce4', 40], build: (add, g) => {
    add(vaultWall(g), 0, -10);
    [-12, 12].forEach((x) => add(column(g), x, -8));
    [[-9, -6, 'cit0'], [9, -6, 'cit3']].forEach(([x, z, c]) => { add(pedestal(g), x, z); add(NPC[c].grey, x, z, 0, 1, 2.5); });
  } },
  moon: { mood: 'night', ground: ['#b7bcc8', '#9aa0ae', 0, 'specks'], build: (add, g) => {
    [[-8, -6, 0], [6, -9, 1], [14, -4, 2], [-15, -11, 1]].forEach(([x, z, v]) => add(crater(v, g), x, z));
    add(kittara(g), -16, -48, 0, 1.6, 8);
  } },
  core: { mood: 'night', ground: ['#1a1d33', '#2a2f4a', 40], build: (add, g) => {
    [-11, 11].forEach((x) => add(column(g), x, -8));
    [-13, -7, 7, 13].forEach((x, i) => { add(pedestal(g), x, -4); add(MESH.jars[i], x, -4, 0, 1, 2.5); });
  } },
  none: { mood: 'day', ground: null, build: () => {} },
};

const MOODS = {
  day: ['#ffffff', '#7d5be0', 1.5, '#fff1d6', 2.3, [6, 12, 8]],
  dusk: ['#ffd0e8', '#4b2a7a', 1.3, '#ffb36b', 2.2, [-8, 7, 6]],
  night: ['#8fa0ff', '#1a1040', 1.0, '#c8d4ff', 1.4, [5, 10, 4]],
  grey: ['#e6eaf0', '#4f545d', 1.35, '#ffffff', 1.3, [4, 12, 6]],
  warm: ['#ffe3c0', '#4b2a1a', 1.4, '#ffd8a0', 1.9, [-5, 10, 7]],
  cold: ['#e6ecff', '#3d3a5c', 1.3, '#d6e4ff', 1.7, [5, 11, 7]],
};

// ------------------------------------------------------------------ actors

const ROBOT = { drab: MESH.drab, mopper: MESH.mopper, fizz: MESH.fizz, vat: MESH.vat, stencil: MESH.stencil, static: MESH.static, archivist: MESH.archivist, smear: MESH.smear, whacker: MESH.whacker, trawler: MESH.trawler, whale: MESH.skyWhale, whaleGrey: MESH.skyWhaleGrey, geode: MESH.geode, tree: MESH.bloomTree, plot: MESH.seedPlot, seed: MESH.seed, sardine: MESH.sardine, spark: MESH.spark, net: MESH.net, glass: MESH.glass };
const FLOATERS = new Set(['smudge', 'fizz', 'static', 'whale', 'whaleGrey', 'trawler', 'seed', 'spark']);

/** Build one cast member as a group whose origin is at its feet. */
function actor(name, mods) {
  const opt = mods.has('holo') ? { holo: true } : {};
  const grey = mods.has('grey');
  const g = new THREE.Group();
  const add = (meshed, x = 0, y = 0, z = 0) => { const m = instance(meshed, opt); m.position.set(x, y, z); g.add(m); return m; };
  if (name === 'nova' || name === 'echo') {
    const echo = name === 'echo';
    add(echo ? MESH.echoBody : MESH.novaBody);
    const k = echo ? 1.9 : 1;
    add(echo ? MESH.echoLeg : MESH.novaLeg, -2 * S * k, 6 * S * k, 0);
    add(echo ? MESH.echoLeg : MESH.novaLeg, 2 * S * k, 6 * S * k, 0);
  } else if (name === 'smudge') add(MESH.smudge);
  else if (NPC[name]) add(grey ? NPC[name].grey : mods.has('holo') ? NPC[name].holo : NPC[name].color);
  else if (name === 'sweeper') {
    add(MESH.sweeper);
    SWEEPER.tanks.forEach((t, i) => add(MESH.sweeperTanks[i], t.x * SB, t.y * SB, t.z * SB));
    SWEEPER.brushes.forEach((b) => add(MESH.sweeperBrush, b.x * SB, b.y * SB, b.z * SB));
  } else if (name === 'whacker') {
    add(MESH.whacker); add(MESH.whackerShell, WHACKER.core.x * SB, WHACKER.core.y * SB, WHACKER.core.z * SB);
  } else if (name === 'trawler') {
    add(MESH.trawler);
    TRAWLER.engines.forEach((e, i) => add(MESH.trawlerEngines[i], e.x * SB, e.y * SB, e.z * SB));
  } else if (name === 'curator' || name === 'ring') {
    add(mods.has('color') ? MESH.curatorRingColor : MESH.curatorRing);
    if (name === 'curator') add(MESH.curatorEye, 0, CURATOR.eyeY, 0);
  } else if (name === 'jar' || name === 'jars') add(MESH.jars[Math.floor(Math.random() * 6)]);
  else if (name === 'beacon') add(mods.has('on') ? MESH.beaconOn : MESH.beaconOff);
  else if (name === 'lantern') add(mods.has('on') ? MESH.lanternOn : MESH.lanternOff);
  else if (name === 'tower') add(mods.has('on') ? MESH.towerOn : MESH.towerOff);
  else if (name === 'mirror') add(mods.has('on') ? MESH.mirrorOn : MESH.mirrorOff);
  else if (name === 'generator') add(mods.has('on') ? MESH.generatorOn : MESH.generatorOff);
  else if (name === 'rocket') {
    add(rocket(grey));
    if (mods.has('launch')) { // exhaust plume
      const flame = new THREE.Mesh(new THREE.ConeGeometry(1.4, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      flame.rotation.x = Math.PI;
      flame.position.y = -3.4;
      g.add(flame);
      g.userData.launch = true;
    }
  }
  else if (name === 'pedestal') add(pedestal(grey));
  else if (name === 'crate') add(crate(1, grey));
  else if (name === 'blaster') add(MESH.weapon_splatter);
  else if (name === 'beam') {
    // white Harvester beam, or a colored light beam with a paint index mod (beam:0 … beam:5)
    const paint = [...mods].map(Number).find((n) => !Number.isNaN(n));
    const thin = paint !== undefined;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(thin ? 0.35 : 1.3, thin ? 0.5 : 2.2, 40, 16, 1, true), new THREE.MeshBasicMaterial({ color: thin ? PAINT_JARS[paint % 6] : '#ffffff', transparent: true, opacity: thin ? 0.55 : 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 20;
    g.add(beam);
    g.userData.beam = true;
  } else if (ROBOT[name]) add(grey && name === 'whale' ? MESH.skyWhaleGrey : ROBOT[name]);
  else return null;
  if (mods.has('big')) g.scale.setScalar(1.7);
  if (mods.has('huge')) g.scale.setScalar(2.6);
  if (mods.has('small')) g.scale.setScalar(0.6);
  return g;
}

function parse(token) {
  const [head, at] = token.split('@');
  const [nameMods, count] = head.split('*');
  const [name, ...mods] = nameMods.split(':');
  const pos = at ? at.split(',').map(Number) : null;
  return { name, mods: new Set(mods), count: Number(count) || 1, pos };
}

// ------------------------------------------------------------------ shots

/** Auto-layout for cast members without an explicit position. Returns [x, z, yaw]. */
function layout(shot, i, n) {
  const toCam = 0;
  if (shot === 'threat') {
    // the big one looms at the back; the heroes stand off to the right, facing it
    if (i === 0) return [0, -4.5, 0.3];
    const x = 3.4 + (i - 1) * 1.9, z = 2.2 - (i - 1) * 0.6;
    return [x, z, Math.atan2(-x, -4.5 - z)];
  }
  if (shot === 'two' || shot === 'close') {
    if (n === 1) return [0, 0, toCam];
    if (i === 0) return [-1.9, 0, 0.75];
    if (i === 1) return [1.9, 0, -0.75];
    return [(i % 2 ? 1 : -1) * 4.2, -2.5, (i % 2 ? -0.5 : 0.5)];
  }
  // solo, group, wide, low, high: a shallow arc facing camera
  const spread = shot === 'wide' ? 3.2 : 2.6;
  const x = (i - (n - 1) / 2) * spread;
  return [x, -Math.abs(x) * 0.18, -x * 0.07];
}

const SHOTS = {
  wide: { dir: [0.12, 0.42, 1], pad: 1.0, minW: 20 },
  group: { dir: [0.1, 0.28, 1], pad: 1.08, minW: 9 },
  solo: { dir: [0.18, 0.22, 1], pad: 1.2, minW: 5 },
  two: { dir: [0.12, 0.22, 1], pad: 1.1, minW: 7 },
  close: { dir: [0.18, 0.12, 1], pad: 1.0, minW: 2.6, head: true },
  threat: { dir: [-0.42, 0.2, 1], pad: 1.08, minW: 9 },
  low: { dir: [0.22, -0.02, 1], pad: 1.25, minW: 6, lift: 0.45 },
  high: { dir: [0.05, 1.3, 1], pad: 1.15, minW: 8 },
  turntable: { dir: [0, 0.22, 1], pad: 1.25, minW: 3.5 },
};

// ------------------------------------------------------------------ stage

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
    this.texCache = {};
    this.tick = this.tick.bind(this);
  }

  /** Stage a panel. Returns false when the panel has no stage (title cards, murals). */
  show(p) {
    if (!p.set && !p.cast) return false;
    this.scene = new THREE.Scene();
    const set = SETS[p.set || 'none'];
    const mood = MOODS[p.mood || (p.grey ? 'grey' : set.mood)];
    const [sky, gnd, hi, sun, si, sp] = mood;
    this.scene.add(new THREE.HemisphereLight(sky, gnd, hi));
    const key = new THREE.DirectionalLight(sun, si);
    key.position.set(...sp);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 0.5, far: 80 });
    key.shadow.bias = -0.0015;
    this.scene.add(key);
    const grey = !!p.grey;
    const extra = {};
    // ground
    if (set.ground) {
      const [base, line, step, mode] = set.ground;
      const id = `${p.set}:${grey}`;
      const tex = this.texCache[id] ||= groundTex(grey ? greyOf(base) : base, grey ? greyOf(line) : line, step || 32, mode);
      const w = set.groundW || 120;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, 120), new THREE.MeshLambertMaterial({ map: tex }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }
    const add = (meshed, x, z, yaw = 0, scale = 1, y = 0) => {
      const m = instance(meshed);
      m.position.set(x, y, z); m.rotation.y = yaw; m.scale.setScalar(scale);
      m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.scene.add(m);
      return m;
    };
    set.build(add, grey, extra);
    if (extra.clouds) {
      for (let i = 0; i < 9; i++) {
        const c = instance(MESH.clouds[i % 3]);
        c.position.set((rnd(i) - 0.5) * 70, -6 - rnd(i + 3) * 8, -14 - rnd(i + 5) * 30);
        this.scene.add(c);
      }
    }
    // cast
    this.actors = [];
    const shot = p.shot || 'solo';
    const toks = (p.cast || []).map(parse);
    const auto = toks.filter((t) => !t.pos);
    let ai = 0;
    for (const t of toks) {
      for (let k = 0; k < t.count; k++) {
        const g = actor(t.name, t.mods);
        if (!g) continue;
        let x, z, yaw;
        if (t.pos) {
          [x, z, yaw = 0] = t.pos;
          if (t.count > 1) { x += (rnd(k * 3 + x) - 0.5) * 7; z += (rnd(k * 5 + z) - 0.5) * 4 - k * 0.3; yaw = (rnd(k) - 0.5) * 0.8; }
        } else {
          [x, z, yaw] = layout(shot, ai, auto.length);
          if (t.count > 1) { x += (k - (t.count - 1) / 2) * 2.2; z -= (k % 2) * 1.2; }
        }
        if (k === t.count - 1 && !t.pos) ai++;
        if (t.mods.has('back')) yaw = Math.PI;
        if (t.mods.has('left')) yaw = -1.1;
        if (t.mods.has('right')) yaw = 1.1;
        const floats = t.mods.has('float') || FLOATERS.has(t.name);
        let baseY = floats ? (t.name === 'smudge' ? 1.6 : t.name.startsWith('whale') ? 6 : t.name === 'trawler' ? 5 : 2.2) : 0;
        if (t.mods.has('raise')) baseY += 2.5; // standing on a pedestal
        if (t.mods.has('up')) baseY += 3.5;
        if (t.mods.has('launch')) baseY += 7;
        g.position.set(x, baseY, z);
        g.rotation.y = yaw;
        g.traverse((o) => { if (o.isMesh && !g.userData.beam) o.castShadow = true; });
        this.scene.add(g);
        this.actors.push({ g, name: t.name, baseY, floats, yaw0: yaw, phase: rnd(this.actors.length + 1) * 6, focus: !t.pos || t.mods.has('focus'), x0: x });
      }
    }
    // camera: fit the shot around the focused cast
    const pool = this.actors.filter((a) => !a.g.userData.beam);
    const focus = pool.filter((a) => a.focus);
    const box = new THREE.Box3();
    (focus.length ? focus : pool).forEach((a) => box.expandByObject(a.g));
    if (box.isEmpty()) box.set(new THREE.Vector3(-4, 0, -2), new THREE.Vector3(4, 4, 2));
    const s = SHOTS[shot] || SHOTS.solo;
    if (s.head && focus[0]) { // tight on the first speaker's head and shoulders
      const hb = new THREE.Box3().setFromObject(focus[0].g);
      const h = hb.max.y - hb.min.y;
      box.set(new THREE.Vector3(hb.min.x - 0.6, hb.max.y - Math.min(h, 3.4) * 0.62, hb.min.z), new THREE.Vector3(hb.max.x + 0.6, hb.max.y + 0.45, hb.max.z));
    }
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    if (shot === 'threat') center.y = size.y * 0.42;
    if (s.lift) center.y = box.min.y + size.y * (0.5 + s.lift * 0.3);
    const dir = new THREE.Vector3(...(p.cam || s.dir)).normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).sub(center));
    corners.push(right.clone().multiplyScalar(s.minW / 2), right.clone().multiplyScalar(-s.minW / 2));
    this.fit = { center, corners, dir, right, up: dir.clone().cross(right), pad: s.pad };
    this.t = this.keepTime && this.spin && p.spin ? this.t : 0;
    this.spin = !!p.spin;
    this.shake = p.shake ? 1 : 0;
    this.resize();
    this.render(0);
    return true;
  }

  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    if (this.canvas.width !== Math.round(w * this.renderer.getPixelRatio()) || this.canvas.height !== Math.round(h * this.renderer.getPixelRatio())) this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(dt) {
    if (!this.scene) return;
    this.t += dt;
    const t = this.t, f = this.fit, cam = this.camera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    // the nearest distance along `dir` at which every corner of the subject box fits in view
    const tanH = tanV * cam.aspect;
    let dist = 4;
    for (const r of f.corners) dist = Math.max(dist, r.dot(f.dir) + f.pad * Math.max(Math.abs(r.dot(f.right)) / tanH, Math.abs(r.dot(f.up)) / tanV));
    const push = 1 - 0.07 * (1 - Math.exp(-t / 4)); // slow push-in
    cam.position.copy(f.center).addScaledVector(f.dir, dist * push).addScaledVector(f.right, Math.sin(t * 0.35) * dist * 0.012);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.6);
      cam.position.x += (Math.random() - 0.5) * this.shake * 0.5;
      cam.position.y += (Math.random() - 0.5) * this.shake * 0.5;
    }
    cam.lookAt(f.center);
    for (const a of this.actors) {
      const ph = t * 2.2 + a.phase;
      if (a.g.userData.beam) { a.g.position.x = a.x0 + Math.sin(t * 0.8 + a.phase) * 1.5; continue; }
      if (a.floats) a.g.position.y = a.baseY + Math.sin(ph) * 0.18;
      else a.g.children[0].scale.y = 1 + Math.sin(ph * 1.4) * 0.012;
      if (a.name === 'curator' || a.name === 'ring') a.g.children[0].rotation.y = t * 0.3;
      if (a.name.startsWith('whale')) a.g.position.x = a.x0 + Math.sin(t * 0.25) * 1.2;
      if (this.spin && a.focus) a.g.rotation.y = a.yaw0 + t * 0.7;
      if (a.g.userData.launch) { a.g.position.y = a.baseY + t * 1.2; a.g.children[1].scale.y = 1 + Math.sin(t * 30) * 0.12; }
    }
    this.renderer.render(this.scene, cam);
  }

  tick(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    this.resize();
    this.render(dt);
    requestAnimationFrame(this.tick);
  }

  start() { if (!this.running) { this.running = true; this.last = 0; requestAnimationFrame(this.tick); } }
  stop() { this.running = false; }

  dispose() {
    this.stop();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
  }
}
