import * as THREE from 'three';
import { instance } from './voxel.js';
import { MESH } from './models.js';
import { TILE } from './level.js';

const SKY_GREY = new THREE.Color('#9aa6b8');

/** Drained version of a vertex color array (luminance, nudged toward a cool grey). */
function toGrey(full) {
  const out = new Float32Array(full.length);
  for (let i = 0; i < full.length; i += 3) {
    const l = full[i] * 0.3 + full[i + 1] * 0.59 + full[i + 2] * 0.11;
    out[i] = 0.3 + l * 0.42; out[i + 1] = 0.31 + l * 0.42; out[i + 2] = 0.34 + l * 0.42;
  }
  return out;
}
const SKY_BLUE = new THREE.Color('#86c8ff');

/** Turn off shadows on a background instance (it sits far below the deck). */
const noShadow = (group) => { group.traverse((o) => { o.castShadow = false; o.receiveShadow = false; }); return group; };

/**
 * The open sky under the Coral Sky Docks: drifting clouds and greyed sky-whales,
 * seen through the gaps between the piers. Purely decorative.
 */
export class Sky {
  constructor(scene, level) {
    this.scene = scene;
    this.W = level.width;
    this.D = level.depth;
    scene.background = SKY_GREY.clone();
    scene.fog = new THREE.Fog(SKY_GREY.clone(), 70, 125);
    this.clouds = [];
    for (let i = 0; i < 40; i++) {
      const g = noShadow(instance(MESH.clouds[i % MESH.clouds.length]));
      g.position.set(Math.random() * (this.W + 80) - 40, -30 - Math.random() * 16, Math.random() * (this.D + 60) - 30);
      g.rotation.y = Math.random() * Math.PI * 2;
      g.scale.set(0.6 + Math.random() * 0.5, 0.45 + Math.random() * 0.3, 0.6 + Math.random() * 0.5);
      scene.add(g);
      this.clouds.push({ g, v: 0.8 + Math.random() * 1.2 });
    }
    this.whales = [];
    for (let i = 0; i < 3; i++) {
      const g = noShadow(instance(MESH.skyWhaleGrey));
      const dir = i % 2 ? -1 : 1;
      g.position.set(Math.random() * this.W, -14 - i * 5, this.D * (0.2 + i * 0.3));
      g.rotation.y = dir * Math.PI / 2;
      g.scale.setScalar(1.2 + i * 0.2);
      scene.add(g);
      this.whales.push({ g, dir, v: 2 + Math.random(), t: Math.random() * 9 });
    }
    this.toColor = 0;
  }

  update(dt) {
    const wrapX = (p, pad) => { if (p.x > this.W + pad) p.x = -pad; else if (p.x < -pad) p.x = this.W + pad; };
    for (const c of this.clouds) { c.g.position.x += c.v * dt; wrapX(c.g.position, 50); }
    for (const w of this.whales) {
      w.t += dt;
      w.g.position.x += w.dir * w.v * dt;
      w.g.position.y += Math.sin(w.t * 0.7) * dt * 0.5;
      w.g.rotation.z = Math.sin(w.t * 0.7) * 0.05;
      wrapX(w.g.position, 30);
    }
    if (this.toColor > 0 && this.toColor < 1) {
      this.toColor = Math.min(1, this.toColor + dt * 0.5);
      this.scene.background.lerpColors(SKY_GREY, SKY_BLUE, this.toColor);
      this.scene.fog.color.copy(this.scene.background);
    }
  }

  /** The colour wave reached the sky: blue it up and wake the whales. */
  colorize() {
    if (this.toColor > 0) return;
    this.toColor = 0.01;
    for (const w of this.whales) {
      const g = noShadow(instance(MESH.skyWhale));
      g.position.copy(w.g.position);
      g.rotation.copy(w.g.rotation);
      g.scale.copy(w.g.scale);
      this.scene.remove(w.g);
      this.scene.add(g);
      w.g = g;
      w.v *= 1.6;
    }
  }
}

/**
 * A greyed sky-whale swimming back and forth along a sky lane (3-2's mission).
 * Hits fill `paint`; its colours fill in from nose to tail.
 */
export class PaintWhale {
  constructor(scene, lane) {
    // the solid and glowing parts each get their own copy of the colors to fade
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.group = new THREE.Group();
    this.parts = [];
    let zmin = Infinity, zmax = -Infinity;
    for (const src of [MESH.skyWhale.solid, MESH.skyWhale.glow]) {
      if (!src) continue;
      const geo = src.clone();
      const pos = geo.getAttribute('position').array;
      for (let i = 2; i < pos.length; i += 3) { zmin = Math.min(zmin, pos[i]); zmax = Math.max(zmax, pos[i]); }
      const attr = geo.getAttribute('color'), full = attr.array.slice(), grey = toGrey(full);
      attr.array.set(grey);
      const mesh = new THREE.Mesh(geo, src === MESH.skyWhale.solid ? this.mat : new THREE.MeshBasicMaterial({ vertexColors: true }));
      mesh.castShadow = true;
      this.group.add(mesh);
      this.parts.push({ attr, full, grey, pos });
    }
    // how far along the body each vertex is (0 nose → 1 tail), for the fill-in
    for (const p of this.parts) {
      p.u = new Float32Array(p.pos.length / 3);
      for (let i = 0; i < p.u.length; i++) p.u[i] = (zmax - p.pos[i * 3 + 2]) / (zmax - zmin);
    }
    this.group.userData.material = this.mat;
    scene.add(this.group);
    this.a = { x: (lane[0] + 0.5) * TILE, z: (lane[1] + 0.5) * TILE };
    this.b = { x: (lane[2] + 0.5) * TILE, z: (lane[3] + 0.5) * TILE };
    this.len = Math.hypot(this.b.x - this.a.x, this.b.z - this.a.z);
    this.ph = Math.random() * Math.PI * 2;
    this.yaw = 0;
    this.t = Math.random() * 9;
    this.paint = 0;
    this.shown = 0;
    this.done = false;
    this.flash = 0;
    this.half = 3.9;   // half body length (world units)
    this.r = 1.5;      // body radius for hits
    this.pos = this.group.position;
    this.place(0);
  }

  place(dt) {
    // ease back and forth along the lane; turn around at the ends
    this.ph += dt * (this.done ? 9 : 6) / this.len;
    const s = (1 - Math.cos(this.ph)) / 2;
    const px = this.pos.x, pz = this.pos.z;
    this.pos.set(this.a.x + (this.b.x - this.a.x) * s, -0.9 + Math.sin(this.t * 1.3) * 0.35, this.a.z + (this.b.z - this.a.z) * s);
    const dx = this.pos.x - px, dz = this.pos.z - pz;
    if (dt > 0 && Math.hypot(dx, dz) > 1e-4) {
      let d = Math.atan2(dx, dz) - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += Math.max(-dt * 2.2, Math.min(dt * 2.2, d));
    }
    this.group.rotation.y = this.yaw;
    this.group.rotation.z = Math.sin(this.t * 1.3) * 0.06;
  }

  update(dt) {
    this.t += dt;
    this.place(dt);
    this.flash = Math.max(0, this.flash - dt * 5);
    this.mat.emissive.setScalar(this.flash * 0.5);
    if (Math.abs(this.shown - this.paint) > 0.003) {
      this.shown += (this.paint - this.shown) * Math.min(1, dt * 6);
      const k = this.shown * 1.35;
      for (const { attr, full, grey, u } of this.parts) {
        const arr = attr.array;
        for (let i = 0; i < u.length; i++) {
          const t = Math.max(0, Math.min(1, (k - u[i]) / 0.35));
          for (let c = 0; c < 3; c++) arr[i * 3 + c] = grey[i * 3 + c] + (full[i * 3 + c] - grey[i * 3 + c]) * t;
        }
        attr.needsUpdate = true;
      }
    }
  }

  /** Distance from (x, z) to the whale's spine. */
  distTo(x, z) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = x - this.pos.x, rz = z - this.pos.z;
    const along = Math.max(-this.half, Math.min(this.half, rx * fx + rz * fz));
    return Math.hypot(rx - fx * along, rz - fz * along);
  }
}
