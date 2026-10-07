import * as THREE from 'three';

/** Colors listed here render unlit (they "glow"). */
export const GLOW = new Set();

/** A sparse voxel model: integer x/y/z -> hex color. +z is the model's front. */
export function model() {
  const m = new Map();
  const api = {
    m,
    set(x, y, z, c) { m.set(`${x},${y},${z}`, c); return api; },
    del(x, y, z) { m.delete(`${x},${y},${z}`); return api; },
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

/**
 * Mesh a voxel model into geometry with only exposed faces and vertex colors.
 * Voxel (x, y, z) occupies [x-.5, x+.5] × [y, y+1] × [z-.5, z+.5] before scaling,
 * so a model's feet at y=0 stand on the ground. `pivot` is subtracted first.
 * `glowSet` picks the unlit colours (default: the shared GLOW list).
 */
export function meshModel(mdl, scale, pivot = [0, 0, 0], glowSet = GLOW) {
  // numeric voxel keys: string keys cost six allocations per voxel in the neighbour test
  const B = 1024, key = (x, y, z) => ((x + B) * 2048 + (y + B)) * 2048 + (z + B);
  const n = mdl.m.size;
  const X = new Int32Array(n), Y = new Int32Array(n), Z = new Int32Array(n), H = new Array(n);
  const filled = new Set();
  let k = 0;
  for (const [str, hex] of mdl.m) {
    const a = str.indexOf(','), b = str.indexOf(',', a + 1);
    const x = +str.slice(0, a), y = +str.slice(a + 1, b), z = +str.slice(b + 1);
    X[k] = x; Y[k] = y; Z[k] = z; H[k] = hex; k++;
    filled.add(key(x, y, z));
  }
  // pass 1: which faces are exposed (bit per face), and how many per bucket
  const mask = new Uint8Array(n), glow = new Uint8Array(n);
  const faces = [0, 0];
  for (let i = 0; i < n; i++) {
    let bits = 0;
    for (let f = 0; f < 6; f++) {
      const d = FACES[f].n;
      if (!filled.has(key(X[i] + d[0], Y[i] + d[1], Z[i] + d[2]))) bits |= 1 << f;
    }
    mask[i] = bits;
    glow[i] = glowSet.has(H[i]) ? 1 : 0;
    faces[glow[i]] += POPCOUNT[bits];
  }
  // pass 2: write straight into typed arrays (6 vertices per face)
  const out = faces.map((count) => ({ p: new Float32Array(count * 18), n: new Float32Array(count * 18), c: new Float32Array(count * 18), o: 0 }));
  const rgb = new Map(), col = new THREE.Color();
  const [px, py, pz] = pivot;
  for (let i = 0; i < n; i++) {
    const bits = mask[i];
    if (!bits) continue;
    let c = rgb.get(H[i]);
    if (!c) { col.set(H[i]); c = [col.r, col.g, col.b]; rgb.set(H[i], c); }
    const b = out[glow[i]], x = X[i], y = Y[i], z = Z[i];
    for (let f = 0; f < 6; f++) {
      if (!(bits & (1 << f))) continue;
      const F = FACES[f];
      for (const vi of TRI) {
        const v = F.v[vi], o = b.o;
        b.p[o] = (x - 0.5 + v[0] - px) * scale; b.p[o + 1] = (y + v[1] - py) * scale; b.p[o + 2] = (z - 0.5 + v[2] - pz) * scale;
        b.n[o] = F.n[0]; b.n[o + 1] = F.n[1]; b.n[o + 2] = F.n[2];
        b.c[o] = c[0]; b.c[o + 1] = c[1]; b.c[o + 2] = c[2];
        b.o = o + 3;
      }
    }
  }
  const toGeo = (b) => {
    if (!b.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(b.p, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(b.n, 3));
    g.setAttribute('color', new THREE.BufferAttribute(b.c, 3));
    g.computeBoundingSphere();
    return g;
  };
  const buckets = { solid: out[0], glow: out[1] };
  return { solid: toGeo(buckets.solid), glow: toGeo(buckets.glow) };
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
