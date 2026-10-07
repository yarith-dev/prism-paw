import * as THREE from 'three';
import { instance, setFlash } from '../voxel.js';
import { MESH, SB, SWEEPER } from '../models.js';
import { pick, PAINT, GREYS, PLAYER_R } from '../util.js';
import { Boss } from './base.js';

/**
 * Street Sweeper (1-4): armored road-cleaner. Its three color tanks on the back are
 * the only weak points. Chase → telegraphed charge (stuns itself on walls) / vacuum /
 * goo spit (after tank 1). Drab reinforcements after tank 2.
 */
export class StreetSweeper extends Boss {
  constructor(game, x, z) {
    super(game, x, z, 'STREET SWEEPER');
    this.chassis = instance(MESH.sweeper);
    this.group.add(this.chassis);
    this.tanks = SWEEPER.tanks.map((t, i) => {
      const mesh = instance(MESH.sweeperTanks[i]);
      mesh.position.set(t.x * SB, t.y * SB, t.z * SB);
      this.group.add(mesh);
      return { mesh, local: t, hp: 30, max: 30, alive: true, color: SWEEPER.colors[i], flash: 0 };
    });
    this.brushes = SWEEPER.brushes.map((b) => {
      const mesh = instance(MESH.sweeperBrush);
      mesh.position.set(b.x * SB, b.y * SB, b.z * SB);
      this.group.add(mesh);
      return mesh;
    });
    // charge telegraph: a red stripe on the road ahead
    const geo = new THREE.PlaneGeometry(4.6, 30);
    geo.translate(0, -15, 0);
    geo.rotateX(-Math.PI / 2);
    this.tele = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.3, depthWrite: false }));
    this.tele.position.y = 0.06;
    this.tele.visible = false;
    this.group.add(this.tele);
    Object.assign(this, { phase: 0, popped: 0, spawnCd: 5, volleys: 0, volleyCd: 0, saidStun: false, last: null, stunFor: 0 });
  }

  onState(state) { this.tele.visible = state === 'windup'; }
  progress() { return { done: this.popped, total: 3 }; }
  taskText(d, t) { return `Pop the Street Sweeper's color tanks (${d}/${t})`; }

  syncHud() {
    const hud = this.game.hud;
    if (this.dead || this.state === 'idle' || this.state === 'dying') { hud.setBoss(null); return; }
    const hp = this.tanks.reduce((n, t) => n + Math.max(0, t.hp), 0), max = this.tanks.reduce((n, t) => n + t.max, 0);
    hud.setBoss(this.name, hp / max, this.tanks.map((t) => (t.alive ? t.color : null)));
  }

  update(dt) {
    const g = this.game, pl = g.player;
    this.st += dt;
    this.contactCd -= dt;
    const spin = ['stunned', 'dying', 'idle'].includes(this.state) ? 0 : this.state === 'charge' ? 24 : 10;
    this.brushes.forEach((m, i) => { m.rotation.y += dt * spin * (i ? -1 : 1); });
    this.flash = Math.max(0, this.flash - dt * 5);
    setFlash(this.chassis, this.flash);
    for (const t of this.tanks) if (t.alive) { t.flash = Math.max(0, t.flash - dt * 6); setFlash(t.mesh, t.flash); }
    const { dist } = this.toPlayer();
    const P = this.phase;

    switch (this.state) {
      case 'idle':
        if (dist < 30 && !pl.dead) this.wake();
        break;
      case 'intro':
        this.turn(dt, 2);
        this.group.position.y = Math.abs(Math.sin(this.st * 30)) * 0.08;
        if (this.st > 2.2) { this.group.position.y = 0; this.setState('chase'); }
        break;
      case 'chase':
        this.turn(dt, 1.3 + P * 0.35);
        this.drive(dt, 5 + P * 1);
        if (this.st > 3.2 - P * 0.5) this.pickAttack(dist);
        break;
      case 'windup':
        this.turn(dt, 5);
        this.flash = 0.5 + Math.sin(this.st * 30) * 0.5;
        this.tele.material.opacity = 0.18 + Math.abs(Math.sin(this.st * 14)) * 0.3;
        if (this.st > 0.95 - P * 0.12) { this.setState('charge'); g.sfx.rev(); }
        break;
      case 'charge': {
        const blocked = this.drive(dt, 21 + P * 2.5);
        if (Math.random() < dt * 30) g.burst(this.pos.x, 0.5, this.pos.z, 1, ['#c9ced6', '#e6eaf0'], 3);
        if (blocked) {
          this.setState('stunned');
          g.shake = Math.max(g.shake, 1.3);
          g.sfx.slam();
          const f = this.local(0, 3.6);
          g.burst(f.x, 1.5, f.z, 24, ['#8d939c', '#c9ced6', '#ffd23f'], 8);
          if (!this.saidStun) { this.saidStun = true; g.hud.say(g.def.lines.stunned || []); }
        } else if (this.st > 1.5) this.setState('chase');
        break;
      }
      case 'vacuum': {
        this.turn(dt, 0.8);
        const nz = this.local(0, SWEEPER.nozzle.z * SB);
        const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
        const ndx = pl.pos.x - nz.x, ndz = pl.pos.z - nz.z, nd = Math.hypot(ndx, ndz) || 0.001;
        if (!pl.dead && (ndx * fx + ndz * fz) / nd > 0.45 && nd < 20) {
          const pull = (8 - nd * 0.25) * dt;
          pl.pos.x -= ndx / nd * pull; pl.pos.z -= ndz / nd * pull;
          if (nd < 2.2 && this.contactCd <= 0) { this.contactCd = 0.7; g.hurtPlayer(12, ndx / nd, ndz / nd); }
        }
        for (let k = 0; k < 3; k++) {
          const a = this.yaw + (Math.random() - 0.5) * 1.6, d = 4 + Math.random() * 14;
          g.stream(nz.x + Math.sin(a) * d, nz.z + Math.cos(a) * d, nz.x, nz.z, Math.random() < 0.5 ? pick(PAINT) : '#b9bec6');
        }
        if (Math.random() < dt * 6) {
          const a = this.yaw + (Math.random() - 0.5) * 1.2, d = 3 + Math.random() * 10;
          g.level.splat(nz.x + Math.sin(a) * d, nz.z + Math.cos(a) * d, 1.1, '#8e939b', 3);
        }
        g.sfx.vacuum();
        if (this.st > 3.2) this.setState('chase');
        break;
      }
      case 'spit':
        this.turn(dt, 3);
        this.volleyCd -= dt;
        if (this.volleyCd <= 0 && this.volleys > 0) {
          this.volleyCd = 0.45;
          this.volleys--;
          const nz = this.local(0, SWEEPER.nozzle.z * SB);
          const base = Math.atan2(pl.pos.x - nz.x, pl.pos.z - nz.z);
          for (let k = -2; k <= 2; k++) {
            const a = base + k * 0.22;
            g.addBullet(new THREE.Vector3(nz.x, 1.6, nz.z), new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), 14, 2.2, 4, '#b9bec6', 'enemy', g.globGeo);
          }
          g.sfx.spit();
        }
        if (this.volleys <= 0 && this.volleyCd <= 0) this.setState('chase');
        break;
      case 'stunned':
        this.group.rotation.z = Math.sin(this.st * 18) * 0.03;
        if (Math.random() < dt * 5) {
          const p = this.local((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 5);
          g.burst(p.x, 3.5, p.z, 2, ['#ffd23f', '#ffffff'], 3);
        }
        if (this.st > (this.stunFor || 3)) { this.group.rotation.z = 0; this.stunFor = 0; this.setState('chase'); }
        break;
      case 'dying':
        this.dyingFx(dt);
        if (this.st > 2.2) this.explode(SWEEPER.colors);
        break;
      default: break;
    }
    this.group.rotation.y = this.yaw;

    if (['chase', 'charge', 'intro', 'spit', 'vacuum', 'windup'].includes(this.state)) {
      this.contact(this.state === 'charge' ? 18 : 8, this.r + PLAYER_R + 0.3);
    }

    // reinforcements once two tanks are gone
    if (P >= 2 && !['dying', 'idle'].includes(this.state)) {
      this.spawnCd -= dt;
      if (this.spawnCd <= 0 && g.enemies.length < 10) {
        this.spawnCd = 7;
        for (const side of [-1.6, 1.6]) {
          const p = this.local(side, -4.2);
          const e = g.spawnEnemy('drab', p.x, p.z, { aggro: true, fromVat: true });
          g.level.collide(e.pos, e.r);
          g.burst(p.x, 1, p.z, 6, GREYS, 4);
        }
      }
    }
  }

  pickAttack(dist) {
    const options = ['charge', 'charge', 'vacuum'];
    if (this.phase >= 1) options.push('spit', 'spit');
    if (dist > 20) options.push('charge');
    let next = pick(options);
    if (next === this.last && Math.random() < 0.6) next = pick(options);
    this.last = next;
    if (next === 'charge') { this.setState('windup'); this.game.sfx.beep(); }
    else if (next === 'spit') { this.setState('spit'); this.volleys = 2 + (this.phase >= 2 ? 1 : 0); this.volleyCd = 0.3; }
    else this.setState('vacuum');
  }

  bulletHit(b) {
    const g = this.game;
    if (this.dead || this.state === 'dying') return false;
    for (const t of this.tanks) {
      if (!t.alive) continue;
      const w = this.local(t.local.x * SB, t.local.z * SB);
      if (Math.hypot(b.pos.x - w.x, b.pos.z - w.z) < 0.95) {
        this.damageTank(t, b.dmg);
        g.burst(b.pos.x, 2.5, b.pos.z, 2, [t.color, b.color], 3);
        g.stats.hits++;
        return true;
      }
    }
    if (Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z) < this.r) {
      g.burst(b.pos.x, b.pos.y, b.pos.z, 2, ['#ffffff', '#c9ced6'], 4);
      g.sfx.block();
      return true;
    }
    return false;
  }

  blast(x, z, R, dmg = 14 * this.game.power) {
    if (this.dead) return;
    for (const t of this.tanks) {
      if (!t.alive) continue;
      const w = this.local(t.local.x * SB, t.local.z * SB);
      if (Math.hypot(w.x - x, w.z - z) < R + 0.6) this.damageTank(t, dmg);
    }
  }

  damageTank(t, dmg) {
    const g = this.game;
    if (!t.alive) return;
    t.hp -= dmg;
    t.flash = 1;
    this.flash = Math.max(this.flash, 0.3);
    g.sfx.hit();
    this.wake();
    if (t.hp <= 0) {
      t.alive = false;
      const at = t.mesh.position.clone();
      this.group.remove(t.mesh);
      t.mesh.userData.material?.dispose();
      t.mesh = instance(MESH.sweeperTankBroken);
      t.mesh.position.copy(at);
      this.group.add(t.mesh);
      const w = this.local(t.local.x * SB, t.local.z * SB);
      g.burst(w.x, 3, w.z, 70, [t.color, t.color, '#ffffff'], 11);
      for (let k = 0; k < 5; k++) g.level.splat(w.x + (Math.random() - 0.5) * 9, w.z + (Math.random() - 0.5) * 9, 2.4, t.color);
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        g.spawnPickup('spark', w.x, w.z, Math.cos(a) * 6, Math.sin(a) * 6);
      }
      g.shake = Math.max(g.shake, 1.2);
      g.sfx.bigPop();
      this.popped++;
      this.phase = this.popped;
      if (this.popped >= 3) {
        this.setState('dying');
      } else {
        this.stunFor = 1.4;
        this.setState('stunned');
        g.hud.say(g.def.lines[`tank_${this.popped}`] || []);
      }
      g.checkStages();
    }
    this.syncHud();
  }
}
