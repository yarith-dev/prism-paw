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
 */
export function meshModel(mdl, scale, pivot = [0, 0, 0]) {
  const buckets = { solid: { p: [], n: [], c: [] }, glow: { p: [], n: [], c: [] } };
  const col = new THREE.Color();
  for (const [key, hex] of mdl.m) {
    const [x, y, z] = key.split(',').map(Number);
    const b = GLOW.has(hex) ? buckets.glow : buckets.solid;
    col.set(hex);
    for (const f of FACES) {
      if (mdl.m.has(`${x + f.n[0]},${y + f.n[1]},${z + f.n[2]}`)) continue;
      const q = f.v.map(([vx, vy, vz]) => [
        (x - 0.5 + vx - pivot[0]) * scale,
        (y + vy - pivot[1]) * scale,
        (z - 0.5 + vz - pivot[2]) * scale,
      ]);
      for (const i of [0, 1, 2, 0, 2, 3]) {
        b.p.push(...q[i]);
        b.n.push(...f.n);
        b.c.push(col.r, col.g, col.b);
      }
    }
  }
  const toGeo = (b) => {
    if (!b.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
    g.computeBoundingSphere();
    return g;
  };
  return { solid: toGeo(buckets.solid), glow: toGeo(buckets.glow) };
}

const glowMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

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
