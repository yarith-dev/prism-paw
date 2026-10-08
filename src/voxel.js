import * as THREE from 'three';

/** Colors listed here render unlit (they "glow"). */
export const GLOW = new Set();

const KB = 1024, KS = 2048;
/** A voxel's key in a model: x, y and z (each -1024..1023) packed into one number. */
export const vkey = (x, y, z) => ((x + KB) * KS + (y + KB)) * KS + (z + KB);
/** [x, y, z] back from a key. */
export function unkey(k) {
  const z = k % KS, r = (k - z) / KS, y = r % KS;
  return [(r - y) / KS - KB, y - KB, z - KB];
}

/** A sparse voxel model: integer x/y/z -> hex color. +z is the model's front. */
export function model() {
  const m = new Map();
  const api = {
    m,
    set(x, y, z, c) { m.set(vkey(x, y, z), c); return api; },
    del(x, y, z) { m.delete(vkey(x, y, z)); return api; },
    box(x0, y0, z0, x1, y1, z1, c) {
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) api.set(x, y, z, c);
      return api;
    },
    /** Clear a box (for carving notches and rounding corners). */
    carve(x0, y0, z0, x1, y1, z1) {
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) api.del(x, y, z);
      return api;
    },
  };
  return api;
}

/** Two triangles per face: quad corners 0-1-2 and 0-2-3. */
const TRI = [0, 1, 2, 0, 2, 3];
const POPCOUNT = Array.from({ length: 64 }, (_, b) => b.toString(2).split('1').length - 1);

const FACES = [
  { n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], v: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { n: [0, 0, -1], v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];

/** Largest dense occupancy grid (cells) before falling back to a hash set. */
const MAX_GRID = 1 << 26;

/**
 * Mesh a voxel model into geometry with only exposed faces and vertex colors.
 * Voxel (x, y, z) occupies [x-.5, x+.5] × [y, y+1] × [z-.5, z+.5] before scaling,
 * so a model's feet at y=0 stand on the ground. `pivot` is subtracted first.
 * `glowSet` picks the unlit colours (default: the shared GLOW list).
 * Each face is 4 vertices and 6 indices (whole levels run to a million vertices otherwise).
 *
 * With `chunk` (voxels), the result is split into square columns of that size on x/z instead:
 * an array of { solid, glow } (empty columns left out), so a whole level can be culled and
 * recoloured piece by piece. Faces between columns are still hidden as usual.
 */
export function meshModel(mdl, scale, pivot = [0, 0, 0], glowSet = GLOW, chunk = 0) {
  const n = mdl.m.size;
  const X = new Int32Array(n), Y = new Int32Array(n), Z = new Int32Array(n), H = new Array(n);
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  let k = 0;
  for (const [key, hex] of mdl.m) {
    const z = key % KS - KB, r = (key - z - KB) / KS, y = r % KS - KB, x = (r - y - KB) / KS - KB;
    X[k] = x; Y[k] = y; Z[k] = z; H[k] = hex; k++;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
    if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  // occupancy: a dense grid with a one-voxel empty border, or a set of numeric keys for huge sparse models
  const dy = y1 - y0 + 3, dz = z1 - z0 + 3, cells = (x1 - x0 + 3) * dy * dz;
  let isFilled;
  const cell = (x, y, z) => ((x - x0 + 1) * dy + (y - y0 + 1)) * dz + (z - z0 + 1);
  if (n && cells <= MAX_GRID) {
    const grid = new Uint8Array(cells);
    for (let i = 0; i < n; i++) grid[cell(X[i], Y[i], Z[i])] = 1;
    isFilled = (x, y, z) => grid[cell(x, y, z)] === 1;
  } else {
    isFilled = (x, y, z) => mdl.m.has(vkey(x, y, z));
  }
  // pass 1: which faces are exposed (bit per face), and how many per bucket
  // (a bucket is solid or glow, per chunk column when chunking)
  const cols = chunk ? Math.floor((z1 - z0) / chunk) + 1 : 1;
  const columns = chunk ? (Math.floor((x1 - x0) / chunk) + 1) * cols : 1;
  const mask = new Uint8Array(n), bucket = new Uint32Array(n);
  const faces = new Uint32Array(columns * 2);
  for (let i = 0; i < n; i++) {
    let bits = 0;
    for (let f = 0; f < 6; f++) {
      const d = FACES[f].n;
      if (!isFilled(X[i] + d[0], Y[i] + d[1], Z[i] + d[2])) bits |= 1 << f;
    }
    mask[i] = bits;
    const column = chunk ? Math.floor((X[i] - x0) / chunk) * cols + Math.floor((Z[i] - z0) / chunk) : 0;
    bucket[i] = column * 2 + (glowSet.has(H[i]) ? 1 : 0);
    faces[bucket[i]] += POPCOUNT[bits];
  }
  // pass 2: write straight into typed arrays (4 vertices and 6 indices per face)
  const out = Array.from(faces, (count) => count ? {
    p: new Float32Array(count * 12), n: new Float32Array(count * 12), c: new Float32Array(count * 12),
    idx: count * 4 > 65535 ? new Uint32Array(count * 6) : new Uint16Array(count * 6), o: 0, v: 0, ii: 0,
  } : null);
  const rgb = new Map(), col = new THREE.Color();
  const [px, py, pz] = pivot;
  for (let i = 0; i < n; i++) {
    const bits = mask[i];
    if (!bits) continue;
    let c = rgb.get(H[i]);
    if (!c) { col.set(H[i]); c = [col.r, col.g, col.b]; rgb.set(H[i], c); }
    const b = out[bucket[i]], x = X[i], y = Y[i], z = Z[i];
    for (let f = 0; f < 6; f++) {
      if (!(bits & (1 << f))) continue;
      const F = FACES[f];
      for (const t of TRI) b.idx[b.ii++] = b.v + t;
      for (let q = 0; q < 4; q++) {
        const v = F.v[q], o = b.o;
        b.p[o] = (x - 0.5 + v[0] - px) * scale; b.p[o + 1] = (y + v[1] - py) * scale; b.p[o + 2] = (z - 0.5 + v[2] - pz) * scale;
        b.n[o] = F.n[0]; b.n[o + 1] = F.n[1]; b.n[o + 2] = F.n[2];
        b.c[o] = c[0]; b.c[o + 1] = c[1]; b.c[o + 2] = c[2];
        b.o = o + 3;
      }
      b.v += 4;
    }
  }
  const toGeo = (b) => {
    if (!b) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(b.p, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(b.n, 3));
    g.setAttribute('color', new THREE.BufferAttribute(b.c, 3));
    g.setIndex(new THREE.BufferAttribute(b.idx, 1));
    g.computeBoundingSphere();
    return g;
  };
  if (!chunk) return { solid: toGeo(out[0]), glow: toGeo(out[1]) };
  const parts = [];
  for (let c = 0; c < columns; c++) if (out[c * 2] || out[c * 2 + 1]) parts.push({ solid: toGeo(out[c * 2]), glow: toGeo(out[c * 2 + 1]) });
  return parts;
}

/** Shared by every glowing voxel part (never disposed). */
export const glowMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

/**
 * Build a renderable group from meshed geometry. Each instance gets its own
 * solid material so it can flash on hit without affecting others.
 */
export function instance(meshed, opts = {}) {
  const group = new THREE.Group();
  if (opts.holo) {
    const holo = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false });
    for (const g of [meshed.solid, meshed.glow]) if (g) group.add(new THREE.Mesh(g, holo));
    group.userData.material = null;
    return group;
  }
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (meshed.solid) {
    const m = new THREE.Mesh(meshed.solid, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  if (meshed.glow) group.add(new THREE.Mesh(meshed.glow, glowMaterial));
  group.userData.material = mat;
  return group;
}

/** Flash an instance white (t = 0..1). */
export function setFlash(group, t) {
  const mat = group.userData.material;
  if (mat) mat.emissive.setScalar(t * 0.9);
}
