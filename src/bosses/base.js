import * as THREE from 'three';
import { angleTo, pick, PAINT, GREYS } from '../util.js';

/**
 * Shared boss plumbing. A boss owns a THREE.Group at `pos`, faces `yaw` (+z forward)
 * and runs a small state machine. The game talks to it only through:
 *   update(dt) · bulletHit(bullet) → bool · blast(x, z, radius, dmg) · progress() → {done,total}
 *   taskText(done, total) · pos · r · dead
 */
export class Boss {
  constructor(game, x, z, name) {
    this.game = game;
    this.name = name;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.pos = this.group.position;
    this.yaw = Math.PI;
    this.group.rotation.y = this.yaw;
    this.state = 'idle';
    this.st = 0;
    this.dead = false;
    this.contactCd = 0;
    this.flash = 0;
    this.r = 3;
    game.scene.add(this.group);
  }

  /** Boss-local offset (world units, +z forward) → world x/z. */
  local(lx, lz) {
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    return { x: this.pos.x + lx * c + lz * s, z: this.pos.z - lx * s + lz * c };
  }

  setState(state) {
    this.state = state;
    this.st = 0;
    this.onState?.(state);
  }

  toPlayer() {
    const pl = this.game.player;
    const dx = pl.pos.x - this.pos.x, dz = pl.pos.z - this.pos.z;
    return { dx, dz, dist: Math.hypot(dx, dz) || 0.001 };
  }

  turn(dt, rate) {
    const { dx, dz } = this.toPlayer();
    this.yaw = angleTo(this.yaw, Math.atan2(dx, dz), rate * dt);
  }

  /** Move forward; returns true if a wall or prop stopped us. Right after hitting Nova it backs off instead. */
  drive(dt, speed) {
    if (this.bumpT > 0) {
      // just bumped Nova: reverse a little so she can't get pinned against a wall
      this.bumpT -= dt;
      speed = -3;
    }
    const wantX = this.pos.x + Math.sin(this.yaw) * speed * dt, wantZ = this.pos.z + Math.cos(this.yaw) * speed * dt;
    this.pos.x = wantX; this.pos.z = wantZ;
    this.game.level.collide(this.pos, this.r);
    return Math.hypot(this.pos.x - wantX, this.pos.z - wantZ) > Math.abs(speed * dt) * 0.35;
  }

  /** Idle → intro when Nova gets close or shoots first. */
  wake() {
    if (this.state !== 'idle') return;
    const g = this.game;
    this.setState('intro');
    g.hud.say(g.def.lines.bossIntro || []);
    g.sfx.rev();
    g.shake = Math.max(g.shake, 0.8);
    this.syncHud();
  }

  syncHud() {}

  /** Shudder and pop out paint while dying; call each frame in the 'dying' state. */
  dyingFx(dt, w = 5, l = 7) {
    const g = this.game;
    this.group.rotation.z = Math.sin(this.st * 40) * 0.05;
    g.shake = Math.max(g.shake, 0.6);
    if (Math.random() < dt * 14) {
      const p = this.local((Math.random() - 0.5) * w, (Math.random() - 0.5) * l);
      g.burst(p.x, 2 + Math.random() * 2, p.z, 10, PAINT, 6);
      g.sfx.pop();
    }
  }

  /** Final explosion: paint everywhere, prizes, then the colour wave. */
  explode(colors = PAINT) {
    const g = this.game;
    this.dead = true;
    g.scene.remove(this.group);
    for (const c of colors) g.burst(this.pos.x, 3, this.pos.z, 40, [c], 14);
    g.burst(this.pos.x, 2, this.pos.z, 120, PAINT, 16);
    g.burst(this.pos.x, 2, this.pos.z, 40, GREYS, 10);
    for (let k = 0; k < 10; k++) g.level.splat(this.pos.x + (Math.random() - 0.5) * 14, this.pos.z + (Math.random() - 0.5) * 14, 3, pick(PAINT));
    const at = this.dropAt || this.pos; // flying bosses drop their prizes on the deck
    for (let k = 0; k < 4; k++) g.spawnPickup('sardine', at.x + (Math.random() - 0.5) * 6, at.z + (Math.random() - 0.5) * 6);
    g.shake = 1.8;
    g.sfx.bigPop();
    g.stats.pops++;
    g.hud.setBoss(null);
    g.hud.say(g.def.lines.bossDown || []);
    g.startWave(this.pos);
  }

  /** Brushes, blades and bumpers: knock Nova back on touch. */
  contact(dmg, reach) {
    const g = this.game, pl = g.player;
    const { dx, dz, dist } = this.toPlayer();
    if (pl.dead || this.contactCd > 0 || dist > reach) return;
    this.contactCd = 0.8;
    this.bumpT = 0.5;
    g.hurtPlayer(dmg, dx / dist, dz / dist);
    pl.vel.x += dx / dist * 10; pl.vel.z += dz / dist * 10;
  }
}
