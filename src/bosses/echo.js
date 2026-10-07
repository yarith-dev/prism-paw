import * as THREE from 'three';
import { instance, setFlash } from '../voxel.js';
import { MESH, S } from '../models.js';
import { angleTo, PAINT, PLAYER_R } from '../util.js';
import { WEAPONS } from '../data/shop.js';
import { Boss } from './base.js';

const HP = 320;
const ES = S * 1.9; // the Echo is Nova at almost twice her size
const NOISE = ['#f4f7ff', '#9dfbff', '#4f545d', '#c9ced6'];
const BOLT = '#d6dae0';

/**
 * The Echo (4-4): the Static Wastes' copy of Nova, made of TV noise.
 * It copies whatever weapon Nova is holding and fires it back at her.
 *   stalk → fire (copied weapon) → sometimes hop (blinks out; shots pass through)
 *   2nd third: leaves translucent decoys behind when it hops (decoys cast no shadow)
 *   last third: static rings that expand from it, with one gap to slip through
 */
export class Echo extends Boss {
  constructor(game, x, z) {
    super(game, x, z, 'THE ECHO');
    this.r = 1.5;
    this.rig = this.makeRig(false);
    this.group.add(this.rig.root);
    Object.assign(this, {
      hp: HP, phase: 0, strafe: 1, ghost: false, copied: new Set(), weapon: 'blaster',
      shots: 0, nextShot: 0, decoys: [], rings: [], shells: [], spawnCd: 10, walk: 0, attacks: 0,
    });
    this.ringGeo = new THREE.RingGeometry(0.93, 1, 72, 1, 0.35, Math.PI * 2 - 0.7).rotateX(-Math.PI / 2);
    this.markGeo = new THREE.RingGeometry(2.2, 2.7, 28).rotateX(-Math.PI / 2);
    this.markMat = new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.5, depthWrite: false });
    this.shellGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    this.shellMat = new THREE.MeshBasicMaterial({ color: '#9dfbff' });
  }

  /** Body + two swinging legs, like Nova. Decoys are translucent and cast no shadow. */
  makeRig(decoy) {
    const root = new THREE.Group();
    const body = instance(MESH.echoBody), legL = instance(MESH.echoLeg), legR = instance(MESH.echoLeg);
    legL.position.set(-2 * ES, 6 * ES, 0);
    legR.position.set(2 * ES, 6 * ES, 0);
    root.add(body, legL, legR);
    const mats = [body, legL, legR].map((g) => g.userData.material);
    for (const m of mats) m.transparent = true;
    if (decoy) root.traverse((o) => { o.castShadow = false; });
    return { root, body, legL, legR, mats };
  }

  progress() { return { done: this.dead || this.state === 'dying' ? 3 : 3 - Math.ceil(this.hp / (HP / 3)), total: 3 }; }
  taskText(d, t) { return `Break The Echo (${d}/${t})`; }

  syncHud() {
    const hud = this.game.hud;
    if (this.dead || this.state === 'idle' || this.state === 'dying') { hud.setBoss(null); return; }
    const third = HP / 3;
    hud.setBoss(this.name, Math.max(0, this.hp) / HP, [0, 1, 2].map((i) => (this.hp > third * i + 0.01 ? '#9dfbff' : null)), 'linear-gradient(90deg, #4f545d, #c9ced6, #9dfbff)');
  }

  setOpacity(rig, o) { for (const m of rig.mats) { m.opacity = o; m.depthWrite = o > 0.9; } }

  animateLegs(rig, speed, dt) {
    this.walk += dt * speed * 1.4;
    const sw = Math.min(1, speed / 5) * 0.7;
    rig.legL.rotation.x = Math.sin(this.walk) * sw;
    rig.legR.rotation.x = -Math.sin(this.walk) * sw;
  }

  update(dt) {
    const g = this.game, pl = g.player;
    this.st += dt;
    this.contactCd -= dt;
    const P = this.phase;
    const { dx, dz, dist } = this.toPlayer();
    this.flash = Math.max(0, this.flash - dt * 5);
    setFlash(this.rig.body, this.flash);
    // it never quite holds still: the picture jitters
    this.rig.body.position.x = (Math.random() - 0.5) * 0.12;
    let moving = 0;

    switch (this.state) {
      case 'idle':
        this.setOpacity(this.rig, 0.4 + Math.random() * 0.3);
        if (dist < 24 && !pl.dead) this.wake();
        break;
      case 'intro':
        this.turn(dt, 3);
        this.setOpacity(this.rig, Math.min(1, 0.4 + this.st * 0.3) * (Math.random() < 0.15 ? 0.3 : 1));
        if (this.st > 2.2) { this.setOpacity(this.rig, 1); this.setState('stalk'); }
        break;
      case 'stalk': {
        // circle Nova at about ten paces, facing her
        this.yaw = angleTo(this.yaw, Math.atan2(dx, dz), 6 * dt);
        if (Math.random() < dt * 0.4) this.strafe *= -1;
        const want = 10, rx = -dx / dist, rz = -dz / dist;
        const tx = pl.pos.x + (rx * Math.cos(0.5 * this.strafe) - rz * Math.sin(0.5 * this.strafe)) * want;
        const tz = pl.pos.z + (rx * Math.sin(0.5 * this.strafe) + rz * Math.cos(0.5 * this.strafe)) * want;
        const mx = tx - this.pos.x, mz = tz - this.pos.z, md = Math.hypot(mx, mz);
        const sp = Math.min(md * 2, 6 + P * 1.5);
        if (md > 0.3) {
          this.pos.x += mx / md * sp * dt;
          this.pos.z += mz / md * sp * dt;
          g.level.collide(this.pos, this.r);
          moving = sp;
        }
        this.contact(10, this.r + PLAYER_R + 0.2);
        if (this.st > 1.8 - P * 0.35) this.pickAttack();
        break;
      }
      case 'fire':
        this.yaw = angleTo(this.yaw, Math.atan2(dx, dz), 8 * dt);
        this.fireCopied(dt);
        break;
      case 'ringWind':
        this.flash = 0.4 + Math.sin(this.st * 30) * 0.4;
        if (Math.random() < dt * 30) g.burst(this.pos.x, 2, this.pos.z, 1, NOISE, 4);
        if (this.st > 0.8) { this.spawnRing(); this.setState('stalk'); }
        break;
      case 'out': {
        // blinks out like a TV switching off; shots pass straight through
        this.ghost = true;
        const u = Math.min(1, this.st / 0.35);
        this.rig.root.scale.set(1 + u, Math.max(0.03, 1 - u), 1 + u);
        this.setOpacity(this.rig, 1 - u);
        if (u >= 1) this.reappear();
        break;
      }
      case 'in': {
        const u = Math.min(1, this.st / 0.35);
        this.rig.root.scale.set(2 - u, Math.max(0.03, u), 2 - u);
        this.setOpacity(this.rig, u);
        if (u >= 1) { this.ghost = false; this.rig.root.scale.set(1, 1, 1); this.setState('stalk'); }
        break;
      }
      case 'dying':
        this.dyingFx(dt, 3, 3);
        this.setOpacity(this.rig, Math.random() < 0.5 ? 0.2 : 1);
        this.rig.root.scale.set(1 + Math.random() * 0.3, 1 - Math.random() * 0.3, 1);
        if (this.st > 2.2) { this.clearHazards(); this.explode([...NOISE, ...PAINT]); }
        break;
      default: break;
    }
    this.group.rotation.y = this.yaw;
    this.animateLegs(this.rig, moving, dt);
    this.updateDecoys(dt);
    this.updateRings(dt);
    this.updateShells(dt);

    // the last third calls in Statics
    if (P >= 2 && !['dying', 'idle'].includes(this.state)) {
      this.spawnCd -= dt;
      if (this.spawnCd <= 0 && g.enemies.length < 6) {
        this.spawnCd = 11;
        for (let k = 0; k < 2; k++) {
          const spot = g.spotNear(pl.pos, 7, 15);
          if (spot) g.spawnEnemy('static', spot.x, spot.z, { aggro: true, fromVat: true });
        }
      }
    }
  }

  pickAttack() {
    const g = this.game;
    this.attacks++;
    if (this.phase >= 2 && this.attacks % 3 === 0) { this.setState('ringWind'); g.sfx.crackle(); return; }
    if (this.attacks % 2 === 0 || (this.phase >= 1 && Math.random() < 0.4)) { this.setState('out'); g.sfx.crackle(); return; }
    // copy whatever Nova is holding right now
    this.weapon = g.player.weapon;
    if (!this.copied.has(this.weapon)) {
      this.copied.add(this.weapon);
      g.hud.toast(`The Echo copies your ${WEAPONS[this.weapon].name}!`);
      if (this.copied.size === 2) g.hud.say(g.def.lines.copy || []);
    }
    this.shots = 0;
    this.nextShot = 0.25;
    this.setState('fire');
  }

  muzzle() { return this.local(0.9, 1.6); }

  /** Fire a pattern based on the copied weapon, then go back to stalking. */
  fireCopied() {
    const g = this.game, pl = g.player, P = this.phase;
    if (this.st < this.nextShot) return;
    const from = this.muzzle(), base = Math.atan2(pl.pos.x - from.x, pl.pos.z - from.z);
    const shoot = (a, speed, life, dmg, geo, trap = 0, bounce = 0, color = BOLT) => {
      g.addBullet(new THREE.Vector3(from.x, 1.5, from.z), new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), speed, life, dmg, color, 'enemy', geo, trap, bounce);
    };
    const w = this.weapon;
    let done = false;
    if (w === 'splatter') {
      for (let i = 0; i < 7; i++) shoot(base + (i / 6 - 0.5) * 0.7, 24, 0.55, 4, g.pelletGeo);
      g.sfx.splatter();
      this.nextShot += 0.7;
      done = ++this.shots >= 2 + (P >= 1 ? 1 : 0);
    } else if (w === 'hose') {
      shoot(base + (Math.random() - 0.5) * 0.3, 26, 0.6, 2, g.boltGeo);
      g.sfx.shoot();
      this.nextShot += 0.06;
      done = ++this.shots >= 22;
    } else if (w === 'bubble') {
      shoot(base + (this.shots - 1) * 0.35, 13, 1.8, 4, g.bubbleGeo, 1, 0, '#9dfbff');
      g.sfx.spit();
      this.nextShot += 0.3;
      done = ++this.shots >= 3;
    } else if (w === 'ricochet') {
      shoot(base + (Math.random() - 0.5) * 0.5, 30, 1, 5, g.boltGeo, 0, 3);
      g.sfx.shoot();
      this.nextShot += 0.16;
      done = ++this.shots >= 6;
    } else if (w === 'mortar') {
      this.lobShell(this.shots === 0 ? 0 : 3.5);
      this.nextShot += 0.35;
      done = ++this.shots >= 3 + P;
    } else {
      shoot(base + (Math.random() - 0.5) * 0.08, 32, 0.9, 5, g.boltGeo);
      g.sfx.shoot();
      this.nextShot += 0.12;
      done = ++this.shots >= 6 + P * 2;
    }
    if (done) this.setState('stalk');
  }

  // ---------------------------------------------------------------- hops and decoys

  reappear() {
    const g = this.game, pl = g.player;
    const from = { x: this.pos.x, z: this.pos.z };
    for (let tries = 0; tries < 16; tries++) {
      const a = Math.random() * Math.PI * 2, d = 9 + Math.random() * 4;
      const x = pl.pos.x + Math.cos(a) * d, z = pl.pos.z + Math.sin(a) * d;
      if (!g.level.walkableAt(x, z) || !g.level.walkableAt(x + 1.5, z) || !g.level.walkableAt(x - 1.5, z) || !g.level.walkableAt(x, z + 1.5) || !g.level.walkableAt(x, z - 1.5)) continue;
      this.pos.x = x; this.pos.z = z;
      break;
    }
    g.burst(from.x, 2, from.z, 14, NOISE, 5);
    g.burst(this.pos.x, 2, this.pos.z, 14, NOISE, 5);
    this.yaw = Math.atan2(pl.pos.x - this.pos.x, pl.pos.z - this.pos.z);
    // from the second third on, it leaves copies of itself behind
    if (this.phase >= 1 && this.decoys.length < 2) {
      for (let k = this.decoys.length; k < 2; k++) this.spawnDecoy(k ? from : null);
    }
    this.setState('in');
  }

  spawnDecoy(at) {
    const g = this.game, pl = g.player;
    let x = at?.x, z = at?.z;
    if (!at) {
      const spot = g.spotNear(pl.pos, 8, 13);
      if (!spot) return;
      x = spot.x; z = spot.z;
    }
    const rig = this.makeRig(true);
    rig.root.position.set(x, 0, z);
    g.scene.add(rig.root);
    this.decoys.push({ rig, pos: rig.root.position, t: 0, life: 9, fireCd: 1 + Math.random(), yaw: 0 });
  }

  updateDecoys(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      const d = this.decoys[i];
      d.t += dt;
      const dx = pl.pos.x - d.pos.x, dz = pl.pos.z - d.pos.z, dist = Math.hypot(dx, dz) || 1;
      d.yaw = angleTo(d.yaw, Math.atan2(dx, dz), 6 * dt);
      d.rig.root.rotation.y = d.yaw;
      d.rig.body.position.x = (Math.random() - 0.5) * 0.2;
      this.setOpacity(d.rig, 0.45 + Math.random() * 0.25);
      d.fireCd -= dt;
      if (d.fireCd <= 0 && !pl.dead && this.state !== 'dying') {
        d.fireCd = 1.4;
        const a = Math.atan2(dx, dz);
        g.addBullet(new THREE.Vector3(d.pos.x, 1.5, d.pos.z), new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), 26, 0.9, 4, BOLT, 'enemy', g.boltGeo);
      }
      if (d.t > d.life || this.state === 'dying') this.popDecoy(i);
    }
  }

  popDecoy(i) {
    const g = this.game, d = this.decoys[i];
    g.scene.remove(d.rig.root);
    g.burst(d.pos.x, 2, d.pos.z, 20, NOISE, 6);
    g.sfx.pop();
    this.decoys.splice(i, 1);
  }

  // ---------------------------------------------------------------- static rings and shells

  spawnRing() {
    const g = this.game, pl = g.player;
    const mesh = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: '#9dfbff', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    // the gap opens a little to one side of Nova: she has to run for it
    const gap = Math.atan2(pl.pos.z - this.pos.z, pl.pos.x - this.pos.x) + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.4);
    mesh.rotation.y = -gap;
    mesh.position.set(this.pos.x, 0.3, this.pos.z);
    g.scene.add(mesh);
    this.rings.push({ mesh, x: this.pos.x, z: this.pos.z, R: 1.5, gap, hit: false });
    g.sfx.zap();
    g.shake = Math.max(g.shake, 0.5);
  }

  updateRings(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.R += dt * 9;
      r.mesh.scale.setScalar(r.R);
      r.mesh.material.opacity = 0.85 * Math.min(1, (40 - r.R) / 10);
      const dx = pl.pos.x - r.x, dz = pl.pos.z - r.z, d = Math.hypot(dx, dz);
      let diff = Math.atan2(dz, dx) - r.gap;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const inGap = Math.abs(diff) < 0.35 + 1.2 / Math.max(1, r.R);
      if (!r.hit && !pl.dead && !pl.jump && Math.abs(d - r.R) < 0.9 && !inGap) {
        r.hit = true;
        g.hurtPlayer(14, dx / (d || 1), dz / (d || 1), 1.2);
      }
      if (r.R > 40) { g.scene.remove(r.mesh); r.mesh.material.dispose(); this.rings.splice(i, 1); }
    }
  }

  lobShell(spread) {
    const g = this.game, pl = g.player;
    let tx = pl.pos.x, tz = pl.pos.z;
    for (let tries = 0; tries < 6 && spread; tries++) {
      const a = Math.random() * Math.PI * 2, x = tx + Math.cos(a) * spread, z = tz + Math.sin(a) * spread;
      if (g.level.walkableAt(x, z)) { tx = x; tz = z; break; }
    }
    const from = this.muzzle();
    const mesh = new THREE.Mesh(this.shellGeo, this.shellMat), mark = new THREE.Mesh(this.markGeo, this.markMat);
    mark.position.set(tx, 0.08, tz);
    g.scene.add(mesh, mark);
    this.shells.push({ mesh, mark, fx: from.x, fz: from.z, tx, tz, t: 0, dur: 1 });
    g.sfx.spit();
  }

  updateShells(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.t += dt;
      const u = Math.min(1, s.t / s.dur);
      s.mesh.position.set(s.fx + (s.tx - s.fx) * u, 2 + Math.sin(Math.PI * u) * 7 - 1.8 * u, s.fz + (s.tz - s.fz) * u);
      if (u < 1) continue;
      g.scene.remove(s.mesh, s.mark);
      this.shells.splice(i, 1);
      g.burst(s.tx, 0.8, s.tz, 24, NOISE, 6);
      g.sfx.crackle();
      if (Math.hypot(pl.pos.x - s.tx, pl.pos.z - s.tz) < 2.7) g.hurtPlayer(12, 0, 0, 1.4);
    }
  }

  clearHazards() {
    const g = this.game;
    for (let i = this.decoys.length - 1; i >= 0; i--) this.popDecoy(i);
    for (const r of this.rings) g.scene.remove(r.mesh);
    for (const s of this.shells) g.scene.remove(s.mesh, s.mark);
    this.rings = []; this.shells = [];
  }

  // ---------------------------------------------------------------- damage

  bulletHit(b) {
    const g = this.game;
    if (this.dead || this.state === 'dying') return false;
    for (let i = 0; i < this.decoys.length; i++) {
      const d = this.decoys[i];
      if (Math.hypot(b.pos.x - d.pos.x, b.pos.z - d.pos.z) < 1.3) { this.popDecoy(i); return true; }
    }
    if (this.ghost) return false;
    if (Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z) > this.r + 0.3) return false;
    if (this.state === 'idle') this.wake();
    this.damage(b.dmg);
    g.burst(b.pos.x, 2, b.pos.z, 2, [b.color, '#9dfbff'], 3);
    g.stats.hits++;
    return true;
  }

  blast(x, z, R, dmg = 14 * this.game.power) {
    if (this.dead || this.state === 'dying') return;
    for (let i = this.decoys.length - 1; i >= 0; i--) if (Math.hypot(this.decoys[i].pos.x - x, this.decoys[i].pos.z - z) < R + 1) this.popDecoy(i);
    if (!this.ghost && Math.hypot(this.pos.x - x, this.pos.z - z) < R + this.r) this.damage(dmg);
  }

  damage(dmg) {
    const g = this.game, before = this.phase;
    this.wake();
    this.hp -= dmg;
    this.flash = 1;
    g.sfx.hit();
    this.phase = this.hp <= HP / 3 ? 2 : this.hp <= (HP * 2) / 3 ? 1 : 0;
    if (this.hp <= 0) {
      this.setState('dying');
      this.ghost = false;
      this.rig.root.scale.set(1, 1, 1);
      g.hud.setBoss(null);
      g.checkStages();
      return;
    }
    if (this.phase !== before) {
      g.burst(this.pos.x, 3, this.pos.z, 60, [...NOISE, ...PAINT], 10);
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        g.spawnPickup('spark', this.pos.x, this.pos.z, Math.cos(a) * 6, Math.sin(a) * 6);
      }
      g.shake = Math.max(g.shake, 1.1);
      g.sfx.bigPop();
      g.hud.say(g.def.lines[`phase_${this.phase}`] || []);
      this.setState('out');
      g.checkStages();
    }
    this.syncHud();
  }
}

