import * as THREE from 'three';
import { instance, setFlash } from '../voxel.js';
import { MESH, SB, WHACKER } from '../models.js';
import { pick, GREYS, PLAYER_R } from '../util.js';
import { Boss } from './base.js';

const CORE_HP = 110;
const GREEN = ['#b8ff6a', '#8cff7a', '#5cc46a'];

/**
 * Weed Whacker (2-4): a walking garden machine with a long trimmer arm.
 * Its glowing core is armored except while it overheats after an attack.
 *   stalk  — walks at Nova sweeping the trimmer in front of it
 *   spin   — telegraphed 360° trimmer spin (hug the body or stay outside the red ring)
 *   seeds  — lobs seeds that sprout grey thorn brambles (shootable)
 *   overheat — shell lifts, core is exposed: shoot it!
 * Thirds of its health are phases: faster, more seeds, Smears join in.
 */
export class WeedWhacker extends Boss {
  constructor(game, x, z) {
    super(game, x, z, 'WEED WHACKER');
    this.r = 3.2;
    this.body = instance(MESH.whacker);
    this.group.add(this.body);
    this.core = instance(MESH.whackerCore);
    this.core.position.set(WHACKER.core.x * SB, WHACKER.core.y * SB, WHACKER.core.z * SB);
    this.group.add(this.core);
    this.shell = instance(MESH.whackerShell);
    this.shell.position.copy(this.core.position).add(new THREE.Vector3(0, 2.5 * SB, 0));
    this.shellHome = this.shell.position.clone();
    this.group.add(this.shell);
    // trimmer arm pivots around the body centre
    this.armPivot = new THREE.Group();
    this.armPivot.position.y = WHACKER.shoulder.y * SB;
    const arm = instance(MESH.whackerArm);
    arm.position.x = WHACKER.shoulder.x * SB;
    this.head = instance(MESH.whackerHead);
    this.head.position.set(WHACKER.headX * SB, -0.4, 0);
    this.armPivot.add(arm, this.head);
    this.group.add(this.armPivot);
    this.reach = WHACKER.headX * SB;
    this.armAngle = Math.PI / 2;
    // spin telegraph: a red ring where the blades will pass
    const ring = new THREE.RingGeometry(this.reach - 2.2, this.reach + 2.2, 56);
    ring.rotateX(-Math.PI / 2);
    this.tele = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.3, depthWrite: false }));
    this.tele.position.y = 0.07;
    this.tele.visible = false;
    this.group.add(this.tele);
    this.markGeo = new THREE.RingGeometry(1.3, 1.8, 24).rotateX(-Math.PI / 2);
    this.markMat = new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.5, depthWrite: false });
    this.seedGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    this.seedMat = new THREE.MeshLambertMaterial({ color: '#80868f' });
    Object.assign(this, {
      hp: CORE_HP, phase: 0, heatFor: 0, coreFlash: 0, spawnCd: 6, headCd: 0,
      brambles: [], seeds: [], last: null, saidHeat: false,
    });
  }

  onState(state) { this.tele.visible = state === 'spinWind'; }
  progress() { return { done: this.dead || this.state === 'dying' ? 3 : 3 - Math.ceil(this.hp / (CORE_HP / 3)), total: 3 }; }
  taskText(d, t) { return `Overheat the Weed Whacker, then smash its core (${d}/${t})`; }
  get exposed() { return this.state === 'overheat'; }

  syncHud() {
    const hud = this.game.hud;
    if (this.dead || this.state === 'idle' || this.state === 'dying') { hud.setBoss(null); return; }
    const third = CORE_HP / 3;
    hud.setBoss(this.name, Math.max(0, this.hp) / CORE_HP, [0, 1, 2].map((i) => (this.hp > third * i + 0.01 ? GREEN[0] : null)), 'linear-gradient(90deg, #3f9b4a, #8cff7a, #e8ff7a)');
  }

  headPos() { return this.local(Math.sin(this.armAngle) * this.reach, Math.cos(this.armAngle) * this.reach); }

  update(dt) {
    const g = this.game, pl = g.player;
    this.st += dt;
    this.headCd -= dt;
    const P = this.phase;
    const { dist } = this.toPlayer();
    this.flash = Math.max(0, this.flash - dt * 5);
    setFlash(this.body, this.flash);
    this.coreFlash = Math.max(0, this.coreFlash - dt * 6);
    setFlash(this.core, this.coreFlash);
    const headSpin = ['idle', 'dying', 'overheat'].includes(this.state) ? 4 : this.state === 'spin' ? 40 : 22;
    this.head.rotation.y += dt * headSpin;

    // the shell lifts off the core while overheating
    const open = this.exposed ? 1 : 0;
    this.shell.position.y += (this.shellHome.y + open * 1.6 - this.shell.position.y) * Math.min(1, dt * 8);
    this.shell.rotation.z += ((open ? 0.7 : 0) - this.shell.rotation.z) * Math.min(1, dt * 8);
    this.core.scale.setScalar(1 + (this.exposed ? Math.sin(this.st * 12) * 0.12 : 0));

    switch (this.state) {
      case 'idle':
        if (dist < 26 && !pl.dead) this.wake();
        break;
      case 'intro':
        this.turn(dt, 2);
        this.armAngle += dt * 3;
        if (this.st > 2.2) this.setState('stalk');
        break;
      case 'stalk': {
        this.turn(dt, 1.2 + P * 0.3);
        this.drive(dt, 3 + P * 0.9);
        this.armAngle += (Math.sin(this.st * (2.4 + P * 0.4)) * 1.15 - this.armAngle) * Math.min(1, dt * 6);
        this.body.position.y = Math.abs(Math.sin(this.st * 6)) * 0.12;
        this.headHits(12);
        if (this.st > 3.4 - P * 0.6) this.pickAttack();
        break;
      }
      case 'spinWind':
        this.turn(dt, 2);
        this.tele.material.opacity = 0.18 + Math.abs(Math.sin(this.st * 14)) * 0.32;
        this.armAngle += (Math.PI / 2 - this.armAngle) * Math.min(1, dt * 6);
        this.flash = 0.4 + Math.sin(this.st * 30) * 0.4;
        if (this.st > 1.0 - P * 0.12) { this.setState('spin'); g.sfx.rev(); }
        break;
      case 'spin':
        this.armAngle += dt * (6.5 + P * 1.2);
        if (Math.random() < dt * 40) {
          const h = this.headPos();
          g.burst(h.x, 0.6, h.z, 1, ['#5cc46a', '#c9ced6'], 4);
        }
        this.headHits(18);
        if (this.st > 2.4 + P * 0.5) this.overheat(3.6);
        break;
      case 'seeds':
        this.turn(dt, 2);
        if (this.st > 0.3 && this.volleyLeft > 0 && this.st > this.nextSeed) {
          this.nextSeed = this.st + 0.22;
          this.volleyLeft--;
          this.lobSeed();
        }
        if (this.volleyLeft <= 0 && this.st > 1.6) this.overheat(2.4);
        break;
      case 'overheat':
        if (Math.random() < dt * 20) {
          const c = this.local(0, WHACKER.core.z * SB);
          g.burst(c.x, 3.5, c.z, 1, ['#ffffff', '#b8ff6a'], 3);
        }
        this.body.position.y = 0;
        if (this.st > this.heatFor) this.setState('stalk');
        break;
      case 'dying':
        this.dyingFx(dt, 6, 6);
        this.armAngle += dt * 2;
        if (this.st > 2.2) { this.clearHazards(); this.explode(GREEN); }
        break;
      default: break;
    }
    this.group.rotation.y = this.yaw;
    this.armPivot.rotation.y = this.armAngle - Math.PI / 2;

    this.updateSeeds(dt);
    this.updateBrambles(dt);

    // Smears join in from the hopper once the first third is gone
    if (P >= 1 && !['dying', 'idle'].includes(this.state)) {
      this.spawnCd -= dt;
      if (this.spawnCd <= 0 && g.enemies.length < 8) {
        this.spawnCd = P >= 2 ? 7 : 10;
        for (const side of P >= 2 ? [-1.5, 0, 1.5] : [-1.2, 1.2]) {
          const p = this.local(side, -4.5);
          const e = g.spawnEnemy('smear', p.x, p.z, { aggro: true, fromVat: true });
          g.level.collide(e.pos, e.r);
          g.burst(p.x, 2, p.z, 6, GREYS, 4);
        }
      }
    }
  }

  headHits(dmg) {
    const g = this.game, pl = g.player;
    if (pl.dead || this.headCd > 0) return;
    const h = this.headPos();
    const dx = pl.pos.x - h.x, dz = pl.pos.z - h.z, d = Math.hypot(dx, dz);
    if (d > WHACKER.bladeR * SB + PLAYER_R) return;
    this.headCd = 0.7;
    g.hurtPlayer(dmg, dx / (d || 1), dz / (d || 1));
    pl.vel.x += dx / (d || 1) * 12; pl.vel.z += dz / (d || 1) * 12;
  }

  pickAttack() {
    const options = ['spin', 'seeds'];
    if (this.phase >= 1) options.push('spin', 'seeds');
    let next = pick(options);
    if (next === this.last && Math.random() < 0.65) next = next === 'spin' ? 'seeds' : 'spin';
    this.last = next;
    if (next === 'spin') { this.setState('spinWind'); this.game.sfx.beep(); }
    else { this.setState('seeds'); this.volleyLeft = 3 + this.phase; this.nextSeed = 0; }
  }

  overheat(secs) {
    const g = this.game;
    this.heatFor = secs;
    this.setState('overheat');
    g.sfx.slam();
    if (!this.saidHeat) { this.saidHeat = true; g.hud.say(g.def.lines.overheat || []); }
  }

  lobSeed() {
    const g = this.game, pl = g.player;
    let tx = pl.pos.x, tz = pl.pos.z;
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * 5;
      const x = pl.pos.x + Math.cos(a) * d, z = pl.pos.z + Math.sin(a) * d;
      if (g.level.walkableAt(x, z)) { tx = x; tz = z; break; }
    }
    const from = this.local(0, -2.2);
    const mesh = new THREE.Mesh(this.seedGeo, this.seedMat);
    mesh.position.set(from.x, 3.6, from.z);
    const mark = new THREE.Mesh(this.markGeo, this.markMat);
    mark.position.set(tx, 0.08, tz);
    g.scene.add(mesh, mark);
    this.seeds.push({ mesh, mark, fx: from.x, fz: from.z, tx, tz, t: 0, dur: 1.1 });
    g.sfx.spit();
  }

  updateSeeds(dt) {
    const g = this.game;
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      s.t += dt;
      const u = Math.min(1, s.t / s.dur);
      s.mesh.position.set(s.fx + (s.tx - s.fx) * u, 3.6 + Math.sin(Math.PI * u) * 7 - 3.3 * u, s.fz + (s.tz - s.fz) * u);
      s.mesh.rotation.x += dt * 8;
      s.mark.material.opacity = 0.3 + u * 0.4;
      if (u < 1) continue;
      g.scene.remove(s.mesh, s.mark);
      this.seeds.splice(i, 1);
      this.sprout(s.tx, s.tz);
    }
  }

  sprout(x, z) {
    const g = this.game;
    const group = instance(MESH.bramble);
    group.position.set(x, 0, z);
    group.scale.setScalar(0.2);
    group.rotation.y = Math.random() * Math.PI * 2;
    g.scene.add(group);
    this.brambles.push({ group, pos: group.position, hp: 3, t: 7 + Math.random() * 2, grow: 0, hurtCd: 0 });
    g.burst(x, 0.5, z, 10, GREYS, 5);
    g.level.splat(x, z, 1.3, '#80868f', 4);
    // landing on Nova hurts
    const pl = g.player;
    if (Math.hypot(pl.pos.x - x, pl.pos.z - z) < 1.8) g.hurtPlayer(8, 0, 0, 1);
  }

  updateBrambles(dt) {
    const g = this.game, pl = g.player;
    for (let i = this.brambles.length - 1; i >= 0; i--) {
      const b = this.brambles[i];
      b.t -= dt;
      b.hurtCd -= dt;
      b.grow = Math.min(1, b.grow + dt * 4);
      b.group.scale.setScalar(0.2 + 0.8 * b.grow);
      if (b.t <= 0 || b.hp <= 0) { this.killBramble(i); continue; }
      const d = Math.hypot(pl.pos.x - b.pos.x, pl.pos.z - b.pos.z);
      if (d < 1.5 + PLAYER_R && b.hurtCd <= 0 && !pl.dead) {
        b.hurtCd = 0.8;
        g.hurtPlayer(8, (pl.pos.x - b.pos.x) / (d || 1), (pl.pos.z - b.pos.z) / (d || 1), 1.2);
      }
    }
  }

  killBramble(i) {
    const g = this.game, b = this.brambles[i];
    g.scene.remove(b.group);
    b.group.userData.material?.dispose();
    g.burst(b.pos.x, 1, b.pos.z, 12, [...GREYS, '#8cff7a'], 5);
    this.brambles.splice(i, 1);
  }

  clearHazards() {
    for (let i = this.brambles.length - 1; i >= 0; i--) this.killBramble(i);
    for (const s of this.seeds) this.game.scene.remove(s.mesh, s.mark);
    this.seeds = [];
  }

  bulletHit(b) {
    const g = this.game;
    if (this.dead || this.state === 'dying') return false;
    for (const br of this.brambles) {
      if (Math.hypot(b.pos.x - br.pos.x, b.pos.z - br.pos.z) < 1.4) {
        br.hp -= b.dmg;
        g.burst(b.pos.x, 1, b.pos.z, 2, ['#c9ced6', b.color], 3);
        g.sfx.hit();
        return true;
      }
    }
    if (Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z) < this.r) {
      if (this.exposed) {
        this.damageCore(b.dmg);
        g.burst(b.pos.x, 3, b.pos.z, 2, ['#b8ff6a', b.color], 3);
        g.stats.hits++;
      } else {
        g.burst(b.pos.x, b.pos.y, b.pos.z, 2, ['#ffffff', '#c9ced6'], 4);
        g.sfx.block();
        this.wake();
      }
      return true;
    }
    return false;
  }

  blast(x, z, R, dmg = 14 * this.game.power) {
    if (this.dead) return;
    for (const br of this.brambles) if (Math.hypot(br.pos.x - x, br.pos.z - z) < R + 1) br.hp = 0;
    if (this.exposed && Math.hypot(this.pos.x - x, this.pos.z - z) < R + this.r) this.damageCore(dmg);
  }

  damageCore(dmg) {
    const g = this.game;
    const before = this.phase;
    this.hp -= dmg;
    this.coreFlash = 1;
    g.sfx.hit();
    this.phase = this.hp <= CORE_HP / 3 ? 2 : this.hp <= (CORE_HP * 2) / 3 ? 1 : 0;
    if (this.hp <= 0) {
      this.setState('dying');
      g.hud.setBoss(null);
      g.checkStages();
      return;
    }
    if (this.phase !== before) {
      // a third of the core breaks: green paint everywhere, back to work angrier
      const c = this.local(0, WHACKER.core.z * SB);
      g.burst(c.x, 3, c.z, 60, GREEN, 10);
      for (let k = 0; k < 4; k++) g.level.splat(c.x + (Math.random() - 0.5) * 8, c.z + (Math.random() - 0.5) * 8, 2.2, pick(GREEN));
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2;
        g.spawnPickup('spark', c.x, c.z, Math.cos(a) * 6, Math.sin(a) * 6);
      }
      g.shake = Math.max(g.shake, 1.2);
      g.sfx.bigPop();
      g.hud.say(g.def.lines[`phase_${this.phase}`] || []);
      this.setState('stalk');
      g.checkStages();
    }
    this.syncHud();
  }
}
