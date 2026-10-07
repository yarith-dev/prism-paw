import * as THREE from 'three';
import { instance, setFlash } from '../voxel.js';
import { MESH, SB, TRAWLER } from '../models.js';
import { angleTo, pick, GREYS, PLAYER_R } from '../util.js';
import { TILE } from '../level.js';
import { Boss } from './base.js';

const ENGINE_HP = 70;
const ALT = 2.6;

/**
 * Net Trawler (3-4): a Greyscale airship that hunts color over the Sky Docks.
 * It flies between hover spots around three moored ships, so Nova has to chase it
 * across gangplanks and updraft vents. The armored gondola blocks shots; its three
 * propeller engines (port, starboard, stern) are the weak points.
 *   net    — throws cargo nets at Nova (red rings). Caught = stuck for a moment.
 *   trawl  — drags a net along a red lane straight at Nova (after the first engine)
 *   drop   — drops a crate of Stencils onto the deck (after the first engine)
 */
export class NetTrawler extends Boss {
  constructor(game, x, z) {
    super(game, x, z, 'NET TRAWLER');
    this.r = 0.01; // it flies: nothing on the deck bumps into it
    this.body = instance(MESH.trawler);
    this.group.add(this.body);
    this.engines = TRAWLER.engines.map((o, i) => {
      const g = instance(MESH.trawlerEngines[i]);
      g.position.set(o.x * SB, o.y * SB, o.z * SB);
      const prop = instance(MESH.trawlerProp);
      prop.position.z = 5 * SB;
      g.add(prop);
      this.group.add(g);
      return { group: g, prop, hp: ENGINE_HP, flash: 0, off: o, color: TRAWLER.colors[i] };
    });
    this.spots = (game.def.trawlerSpots || [[x / TILE, z / TILE]]).map(([tx, tz]) => ({ x: (tx + 0.5) * TILE, z: (tz + 0.5) * TILE }));
    this.spot = null;
    this.vel = new THREE.Vector3();
    this.phase = 0;
    this.attacks = 0;
    this.cd = 0;
    this.nets = [];
    this.trawls = [];
    this.saidSnare = false;
    // shared hazard geometry
    this.ringGeo = new THREE.RingGeometry(2.4, 2.9, 32).rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.5, depthWrite: false });
    this.wallGeo = new THREE.BoxGeometry(3.8, 2.2, 0.3);
    this.wallMat = new THREE.MeshBasicMaterial({ color: '#d6dae0', transparent: true, opacity: 0.75 });
    this.group.position.y = ALT;
  }

  get alive() { return this.engines.filter((e) => e.hp > 0); }

  progress() { return { done: this.dead || this.state === 'dying' ? 3 : 3 - this.alive.length, total: 3 }; }
  taskText(d, t) { return `Shoot down the Net Trawler's propellers (${d}/${t})`; }

  syncHud() {
    const hud = this.game.hud;
    if (this.dead || this.state === 'idle' || this.state === 'dying') { hud.setBoss(null); return; }
    const hp = this.engines.reduce((n, e) => n + Math.max(0, e.hp), 0);
    hud.setBoss(this.name, hp / (ENGINE_HP * 3), this.engines.map((e) => (e.hp > 0 ? e.color : null)), 'linear-gradient(90deg, #ff6f59, #ffd000, #3de0c8)');
  }

  enginePos(e) { return this.local(e.off.x * SB, e.off.z * SB); }

  update(dt) {
    const g = this.game, pl = g.player;
    this.st += dt;
    const P = this.phase;
    const { dx, dz, dist } = this.toPlayer();
    this.flash = Math.max(0, this.flash - dt * 5);
    setFlash(this.body, this.flash);
    for (const e of this.engines) {
      e.flash = Math.max(0, e.flash - dt * 6);
      setFlash(e.group, e.flash);
      e.prop.rotation.z += dt * (e.hp > 0 ? 30 : 0.6);
      if (e.hp <= 0 && Math.random() < dt * 8) {
        const p = this.enginePos(e);
        g.burst(p.x, ALT + 2, p.z, 1, GREYS, 2);
      }
    }
    if (this.state !== 'dying') this.group.position.y = ALT + Math.sin(this.st * 1.4) * 0.25;
    this.group.rotation.z = this.state === 'dying' ? this.group.rotation.z : Math.sin(this.st * 1.1) * 0.03;

    switch (this.state) {
      case 'idle':
        if (dist < 30 && !pl.dead) this.wake();
        break;
      case 'intro':
        this.turn(dt, 1.5);
        if (this.st > 2.4) this.flyTo(this.nextSpot());
        break;
      case 'fly': {
        const t = this.spot, tx = t.x - this.pos.x, tz = t.z - this.pos.z, d = Math.hypot(tx, tz);
        const vmax = 8 + P * 2;
        const k = 1 - Math.exp(-2 * dt);
        this.vel.x += ((d > 0.01 ? tx / d : 0) * Math.min(vmax, d * 1.5) - this.vel.x) * k;
        this.vel.z += ((d > 0.01 ? tz / d : 0) * Math.min(vmax, d * 1.5) - this.vel.z) * k;
        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;
        if (Math.hypot(this.vel.x, this.vel.z) > 1) this.yaw = angleTo(this.yaw, Math.atan2(this.vel.x, this.vel.z), 1.6 * dt);
        if (d < 1) { this.setState('hover'); this.attacks = 2 + P; this.cd = 0.8; }
        break;
      }
      case 'hover':
        this.yaw = angleTo(this.yaw, Math.atan2(dx, dz), 1.1 * dt);
        this.vel.multiplyScalar(Math.exp(-3 * dt));
        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;
        this.cd -= dt;
        if (this.cd <= 0 && !pl.dead) {
          if (this.attacks-- > 0) { this.attack(); this.cd = 2.5 - P * 0.4; }
          else this.flyTo(this.nextSpot());
        }
        break;
      case 'dying':
        this.dyingFx(dt, 4, 8);
        this.group.position.y -= dt * (2 + this.st * 4);
        this.group.rotation.z += dt * 0.35;
        this.group.rotation.x += dt * 0.2;
        if (this.st > 2.6) { this.clearHazards(); this.explode(TRAWLER.colors); }
        break;
      default: break;
    }
    this.group.rotation.y = this.yaw;
    this.updateNets(dt);
    this.updateTrawls(dt);
  }

  flyTo(spot) {
    this.spot = spot;
    this.setState('fly');
    this.game.sfx.rev();
  }

  /** A hover spot near Nova, but not the one it is already at. */
  nextSpot() {
    const pl = this.game.player;
    const options = this.spots.filter((s) => s !== this.spot)
      .sort((a, b) => Math.hypot(a.x - pl.pos.x, a.z - pl.pos.z) - Math.hypot(b.x - pl.pos.x, b.z - pl.pos.z));
    return pick(options.slice(0, 2)) || this.spots[0];
  }

  attack() {
    const g = this.game, P = this.phase;
    const options = ['net'];
    if (P >= 1) options.push('trawl', 'drop');
    if (P >= 2) options.push('trawl', 'net');
    let a = pick(options);
    if (a === 'drop' && g.enemies.length >= 8) a = 'net';
    if (a === 'net') {
      for (let k = 0; k <= P; k++) this.throwNet(k * 0.35, k === 0 ? 0 : 4.5);
    } else if (a === 'trawl') {
      this.startTrawl();
    } else {
      const pl = g.player;
      for (let k = 0; k < 1 + P; k++) {
        const spot = g.spotNear(pl.pos, 6, 15);
        if (!spot) continue;
        const e = g.spawnEnemy('stencil', spot.x, spot.z, { aggro: true, fromVat: true });
        g.burst(e.pos.x, 2, e.pos.z, 10, GREYS, 5);
      }
      g.sfx.spit();
    }
  }

  // ---------------------------------------------------------------- nets

  throwNet(delay, spread) {
    const g = this.game, pl = g.player;
    let tx = pl.pos.x + pl.vel.x * 0.3, tz = pl.pos.z + pl.vel.z * 0.3;
    for (let tries = 0; tries < 8; tries++) {
      const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.5);
      const x = tx + Math.cos(a) * d, z = tz + Math.sin(a) * d;
      if (g.level.walkableAt(x, z)) { tx = x; tz = z; break; }
    }
    const mark = new THREE.Mesh(this.ringGeo, this.ringMat);
    mark.position.set(tx, 0.08, tz);
    mark.visible = false;
    const net = instance(MESH.net);
    net.visible = false;
    g.scene.add(mark, net);
    const from = this.local(0, 4.4);
    this.nets.push({ mark, net, x: tx, z: tz, fx: from.x, fz: from.z, t: -delay, dur: 1.15, landed: 0 });
  }

  updateNets(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.nets.length - 1; i >= 0; i--) {
      const n = this.nets[i];
      n.t += dt;
      if (n.t < 0) continue;
      if (!n.landed) {
        if (!n.mark.visible) { n.mark.visible = n.net.visible = true; g.sfx.spit(); }
        const u = Math.min(1, n.t / n.dur);
        n.net.position.set(n.fx + (n.x - n.fx) * u, ALT + 3 + Math.sin(Math.PI * u) * 5 - (ALT + 3) * u, n.fz + (n.z - n.fz) * u);
        n.net.scale.setScalar(0.3 + u * 0.7);
        n.net.rotation.y += dt * 4;
        n.mark.material.opacity = 0.3 + u * 0.4;
        if (u >= 1) this.landNet(n);
        continue;
      }
      n.landed += dt;
      n.net.scale.setScalar(Math.max(0.01, 1 - Math.max(0, n.landed - 1) * 3));
      if (n.landed > 1.33) { g.scene.remove(n.mark, n.net); this.nets.splice(i, 1); }
    }
  }

  landNet(n) {
    const g = this.game, pl = g.player;
    n.landed = 0.001;
    n.mark.visible = false;
    n.net.position.y = 0.06;
    g.burst(n.x, 0.6, n.z, 12, ['#e6eaf0', '#b9bec6'], 5);
    for (const e of g.enemies) if (e.type !== 'vat' && Math.hypot(e.pos.x - n.x, e.pos.z - n.z) < 2.9) g.trap(e, 3);
    if (Math.hypot(pl.pos.x - n.x, pl.pos.z - n.z) < 2.6 + PLAYER_R * 0.5 && !pl.dead && !pl.jump && pl.shield <= 0) {
      g.hurtPlayer(10);
      g.snare(1.6);
      if (!this.saidSnare) { this.saidSnare = true; g.hud.say(g.def.lines.snared || []); }
    }
  }

  // ---------------------------------------------------------------- trawl

  startTrawl() {
    const g = this.game, pl = g.player;
    const ox = this.pos.x, oz = this.pos.z;
    const dx = pl.pos.x - ox, dz = pl.pos.z - oz, d = Math.hypot(dx, dz) || 1;
    const dir = { x: dx / d, z: dz / d }, len = d + 22;
    const geo = new THREE.PlaneGeometry(3.8, len).rotateX(-Math.PI / 2).translate(0, 0, len / 2);
    const band = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.25, depthWrite: false }));
    band.position.set(ox, 0.07, oz);
    band.rotation.y = Math.atan2(dir.x, dir.z);
    const wall = new THREE.Mesh(this.wallGeo, this.wallMat);
    wall.visible = false;
    wall.rotation.y = band.rotation.y;
    g.scene.add(band, wall);
    this.trawls.push({ band, wall, ox, oz, dir, len, t: 0, front: 0, hit: false });
    this.yaw = band.rotation.y;
    g.sfx.beep();
  }

  updateTrawls(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.trawls.length - 1; i >= 0; i--) {
      const tr = this.trawls[i];
      tr.t += dt;
      if (tr.t < 1.1) { tr.band.material.opacity = 0.15 + Math.abs(Math.sin(tr.t * 12)) * 0.3; continue; }
      if (!tr.wall.visible) { tr.wall.visible = true; g.sfx.vacuum(); }
      tr.front += dt * 30;
      const fx = tr.ox + tr.dir.x * tr.front, fz = tr.oz + tr.dir.z * tr.front;
      tr.wall.position.set(fx, 1.1, fz);
      if (Math.random() < dt * 30) g.burst(fx, 0.5, fz, 1, ['#e6eaf0', '#b9bec6'], 3);
      const inLane = (x, z) => {
        const rx = x - tr.ox, rz = z - tr.oz, along = rx * tr.dir.x + rz * tr.dir.z;
        return Math.abs(along - tr.front) < 1.6 && Math.abs(rx * tr.dir.z - rz * tr.dir.x) < 2.1;
      };
      if (!tr.hit && !pl.dead && !pl.jump && inLane(pl.pos.x, pl.pos.z)) {
        tr.hit = true;
        g.hurtPlayer(14, -tr.dir.x, -tr.dir.z);
        if (pl.shield <= 0) { pl.vel.x -= tr.dir.x * 14; pl.vel.z -= tr.dir.z * 14; g.snare(0.5); }
      }
      for (const e of g.enemies) if (e.type !== 'vat' && !(e.trapped > 0) && inLane(e.pos.x, e.pos.z)) g.trap(e, 2.5);
      if (tr.front > tr.len) { this.removeTrawl(i); }
    }
  }

  removeTrawl(i) {
    const tr = this.trawls[i];
    this.game.scene.remove(tr.band, tr.wall);
    tr.band.geometry.dispose();
    tr.band.material.dispose();
    this.trawls.splice(i, 1);
  }

  clearHazards() {
    for (const n of this.nets) this.game.scene.remove(n.mark, n.net);
    this.nets = [];
    for (let i = this.trawls.length - 1; i >= 0; i--) this.removeTrawl(i);
  }

  // ---------------------------------------------------------------- damage

  bulletHit(b) {
    const g = this.game;
    if (this.dead || this.state === 'dying') return false;
    for (const e of this.engines) {
      if (e.hp <= 0) continue;
      const p = this.enginePos(e);
      if (Math.hypot(b.pos.x - p.x, b.pos.z - p.z) < 1.5) {
        this.damageEngine(e, b.dmg);
        g.burst(b.pos.x, ALT + 1.5, b.pos.z, 2, [e.color, b.color], 3);
        g.stats.hits++;
        return true;
      }
    }
    // the armored gondola and envelope
    const rx = b.pos.x - this.pos.x, rz = b.pos.z - this.pos.z;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const lx = rx * c - rz * s, lz = rx * s + rz * c;
    if (Math.abs(lx) < 1.8 && lz > -3.8 && lz < 4.8) {
      g.burst(b.pos.x, 2.5, b.pos.z, 2, ['#ffffff', '#c9ced6'], 4);
      g.sfx.block();
      this.wake();
      return true;
    }
    return false;
  }

  blast(x, z, R, dmg = 14 * this.game.power) {
    if (this.dead || this.state === 'dying') return;
    for (const e of this.engines) {
      if (e.hp <= 0) continue;
      const p = this.enginePos(e);
      if (Math.hypot(p.x - x, p.z - z) < R + 1) this.damageEngine(e, dmg);
    }
  }

  damageEngine(e, dmg) {
    const g = this.game;
    this.wake();
    e.hp -= dmg;
    e.flash = 1;
    g.sfx.hit();
    if (e.hp <= 0) {
      // engine blown: its stolen color bursts out, sparks rain onto the deck
      const p = this.enginePos(e);
      e.group.remove(e.prop);
      g.burst(p.x, ALT + 1, p.z, 60, [e.color, '#ffffff'], 10);
      g.shake = Math.max(g.shake, 1.2);
      g.sfx.bigPop();
      const pl = g.player;
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        g.spawnPickup('spark', pl.pos.x + Math.cos(a) * 3, pl.pos.z + Math.sin(a) * 3, Math.cos(a) * 3, Math.sin(a) * 3);
      }
      this.phase = 3 - this.alive.length;
      if (!this.alive.length) {
        this.setState('dying');
        // the prizes land where Nova can reach them
        this.dropAt = g.spotNear(pl.pos, 0, 6) || pl.pos;
        g.hud.setBoss(null);
        g.checkStages();
        return;
      }
      g.hud.say(g.def.lines[`engine_${this.phase}`] || []);
      this.flyTo(this.nextSpot());
      g.checkStages();
    }
    this.syncHud();
  }
}
