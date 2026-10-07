import * as THREE from 'three';
import { instance, setFlash } from '../voxel.js';
import { MESH, CURATOR, PAINT_JARS } from '../models.js';
import { pick, PAINT, GREYS, PLAYER_R } from '../util.js';
import { Boss } from './base.js';

const JAR_HP = 30;
const EYE_HP = 200;
const RING_Y = 5.5;

/**
 * The Curator (5-4), in three phases:
 *   1 The Collection — six jars of stolen color orbit the ring and fire it at Nova.
 *                      Every jar smashed sends its color home and recolors the room.
 *   2 The Order      — lights out, "NEVER LET THE COLOR RUN OUT" on loop, search beams
 *                      sweep the vault and the eye is exposed.
 *   3 Smudge         — Nova runs dry. She has to hold on against the pull while Smudge
 *                      flies into the core; the Curator sees a machine changed, not emptied.
 */
export class Curator extends Boss {
  constructor(game, x, z) {
    super(game, x, z, 'THE CURATOR');
    this.r = 3.2;
    this.yaw = 0;
    this.group.rotation.y = 0;
    this.center = { x, z };
    // the ring stands tipped toward the camera, with the eye at its centre
    this.pivot = new THREE.Group();
    this.pivot.position.y = RING_Y;
    this.pivot.rotation.x = -1.0;
    this.ring = instance(MESH.curatorRing);
    this.ring.position.y = -CURATOR.eyeY;
    this.ringSpin = new THREE.Group();
    this.ringSpin.add(this.ring);
    this.eye = instance(MESH.curatorEye);
    this.pivot.add(this.ringSpin, this.eye);
    this.group.add(this.pivot);
    this.jars = PAINT_JARS.map((color, i) => {
      const g = instance(MESH.jars[i]);
      g.scale.setScalar(0.75);
      game.scene.add(g);
      return { group: g, pos: g.position, color, hp: JAR_HP, flash: 0, angle: (i / 6) * Math.PI * 2, alive: true };
    });
    this.beams = [];
    Object.assign(this, { stage: 0, eyeHp: EYE_HP, fireCd: 2, burstCd: 6, jarTurn: 0, spawnCd: 8, flipCd: 8, beamSpeed: 0.45, light: 1, hurtCd: 0, boltCd: 0, spiral: 0 });
    document.getElementById('order')?.remove();
    this.banner = document.createElement('div');
    this.banner.id = 'order';
    this.banner.textContent = 'NEVER LET THE COLOR RUN OUT';
    document.getElementById('hud').appendChild(this.banner);
    this.placeJars(0);
  }

  get aliveJars() { return this.jars.filter((j) => j.alive); }

  progress() { return { done: this.dead ? 3 : this.stage, total: 3 }; }
  taskText() {
    if (this.stage === 0) return `Smash the Curator's jars of stolen color (${6 - this.aliveJars.length}/6)`;
    if (this.stage === 1) return 'Strike the Curator’s eye in the dark';
    if (this.stage === 2) return 'Hold on! Smudge is flying into the core';
    return 'The Curator is listening';
  }

  syncHud() {
    const hud = this.game.hud;
    if (this.dead || this.state === 'idle') { hud.setBoss(null); return; }
    if (this.stage === 0) {
      const hp = this.jars.reduce((n, j) => n + Math.max(0, j.hp), 0);
      hud.setBoss(this.name, hp / (JAR_HP * 6), this.jars.map((j) => (j.alive ? j.color : null)), 'linear-gradient(90deg, #ff4f6d, #ffd23f, #7ef0c8, #62a8ff, #c6a8ff)');
    } else if (this.stage === 1) {
      hud.setBoss(this.name, this.eyeHp / EYE_HP, [], 'linear-gradient(90deg, #c9ced6, #f4f7ff, #9dfbff)');
    } else {
      const s = this.game.smudge, d = s ? Math.hypot(s.pos.x - this.center.x, s.pos.z - this.center.z) : 0;
      hud.setBoss('SMUDGE', 1 - Math.min(1, d / (this.smudgeStart || 1)), [], 'linear-gradient(90deg, #7ef0c8, #ff8fb1, #ffd23f)');
    }
  }

  placeJars(dt) {
    for (const j of this.jars) {
      if (!j.alive) continue;
      j.angle += dt * 0.35;
      j.pos.set(this.center.x + Math.cos(j.angle) * 8.5, 1.2 + Math.sin(this.st * 2 + j.angle * 3) * 0.3, this.center.z + Math.sin(j.angle) * 8.5);
      j.group.rotation.y += dt;
      j.flash = Math.max(0, j.flash - dt * 6);
      setFlash(j.group, j.flash);
    }
  }

  update(dt) {
    const g = this.game, pl = g.player;
    this.st += dt;
    this.hurtCd -= dt;
    const { dist } = this.toPlayer();
    this.flash = Math.max(0, this.flash - dt * 5);
    setFlash(this.eye, this.flash);
    this.ringSpin.rotation.z += dt * (this.stage === 1 ? 1.2 : 0.3);
    this.pivot.position.y = RING_Y + Math.sin(this.st * 1.2) * 0.3;
    this.placeJars(dt);
    this.updateLights(dt);

    switch (this.state) {
      case 'idle':
        if (dist < 26 && !pl.dead) this.wake();
        break;
      case 'intro':
        if (this.st > 3) this.setState('fight');
        break;
      case 'fight':
        if (this.stage === 0) this.collection(dt);
        else if (this.stage === 1) this.order(dt);
        else this.smudgePhase(dt);
        break;
      case 'reboot':
        this.reboot(dt);
        break;
      default: break;
    }
    if (this.stage < 2 && this.state !== 'idle') this.contact(10, this.r + PLAYER_R + 0.2);
    this.contactCd -= dt;
  }

  // ---------------------------------------------------------------- 1: the collection

  collection(dt) {
    const g = this.game, pl = g.player;
    const alive = this.aliveJars;
    this.fireCd -= dt;
    if (this.fireCd <= 0 && alive.length && !pl.dead) {
      // the jars take turns throwing their color back at Nova
      this.fireCd = 0.6 + alive.length * 0.22;
      const j = alive[this.jarTurn++ % alive.length];
      const a = Math.atan2(pl.pos.x - j.pos.x, pl.pos.z - j.pos.z);
      for (let k = -2; k <= 2; k++) this.bolt(j.pos.x, j.pos.z, a + k * 0.16, 15, 6, j.color);
      j.flash = 1;
      g.sfx.spit();
    }
    this.burstCd -= dt;
    if (this.burstCd <= 0) {
      this.burstCd = 7;
      const off = Math.random() * Math.PI;
      for (let k = 0; k < 20; k++) this.bolt(this.center.x, this.center.z, off + (k / 20) * Math.PI * 2, 11, 6, PAINT_JARS[k % 6]);
      this.flash = 1;
      g.sfx.chime();
    }
  }

  bolt(x, z, a, speed, dmg, color) {
    const g = this.game;
    g.addBullet(new THREE.Vector3(x + Math.sin(a) * 1.2, 1.5, z + Math.cos(a) * 1.2), new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), speed, 2.6, dmg, color, 'enemy', g.globGeo);
  }

  breakJar(j) {
    const g = this.game;
    j.alive = false;
    g.scene.remove(j.group);
    g.burst(j.pos.x, 2, j.pos.z, 80, [j.color, '#ffffff'], 11);
    g.level.colorSpot(j.pos.x, j.pos.z, 9);
    for (let k = 0; k < 3; k++) g.level.splat(j.pos.x + (Math.random() - 0.5) * 5, j.pos.z + (Math.random() - 0.5) * 5, 2.2, j.color);
    g.addSkyBeam(j.pos.x, j.pos.z, j.color, 3);
    g.shake = Math.max(g.shake, 0.8);
    g.sfx.bigPop();
    const n = 6 - this.aliveJars.length;
    g.hud.say(g.def.lines[`jar_${n}`] || []);
    if (n === 2 || n === 4) {
      for (let k = 0; k < 2; k++) {
        const spot = g.spotNear(g.player.pos, 7, 15);
        if (spot) g.spawnEnemy('archivist', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    }
    if (!this.aliveJars.length) this.startOrder();
    g.checkStages();
    this.syncHud();
  }

  // ---------------------------------------------------------------- 2: the order

  startOrder() {
    const g = this.game;
    this.stage = 1;
    this.light = 0.05;
    this.banner.classList.add('on');
    g.hud.say(g.def.lines.order || []);
    g.sfx.slam();
    for (let k = 0; k < 3; k++) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1).translate(0, 0, 0.5), new THREE.MeshBasicMaterial({ color: '#f4f7ff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.position.set(this.center.x, 1.4, this.center.z);
      g.scene.add(mesh);
      this.beams.push({ mesh, angle: (k / 3) * Math.PI * 2 });
    }
  }

  order(dt) {
    const g = this.game, pl = g.player;
    const frac = this.eyeHp / EYE_HP;
    this.flipCd -= dt;
    if (this.flipCd <= 0) { this.flipCd = 6 + Math.random() * 4; this.beamSpeed *= -1; g.sfx.beep(); }
    const speed = this.beamSpeed * (1 + (1 - frac) * 0.9);
    for (const b of this.beams) {
      b.angle += speed * dt;
      const dx = Math.sin(b.angle), dz = Math.cos(b.angle);
      let len = this.r;
      while (len < 40 && !g.level.solidAt(this.center.x + dx * len, this.center.z + dz * len)) len += 0.5;
      b.mesh.scale.z = len;
      b.mesh.rotation.y = b.angle;
      b.mesh.material.opacity = 0.6 + Math.random() * 0.3;
      if (pl.dead || pl.jump || this.hurtCd > 0) continue;
      const rx = pl.pos.x - this.center.x, rz = pl.pos.z - this.center.z, along = rx * dx + rz * dz;
      if (along < 0 || along > len || Math.abs(rx * dz - rz * dx) > 0.35 + PLAYER_R) continue;
      this.hurtCd = 0.9;
      g.hurtPlayer(10, rx / (Math.hypot(rx, rz) || 1), rz / (Math.hypot(rx, rz) || 1));
    }
    // the eye flickers between calm and panic
    this.eye.scale.setScalar(1 + Math.sin(this.st * 9) * 0.06);
    if (Math.random() < 0.02) this.banner.classList.toggle('glitch');
    this.spawnCd -= dt;
    if (this.spawnCd <= 0 && g.enemies.length < 6) {
      this.spawnCd = 12;
      for (let k = 0; k < 2; k++) {
        const spot = g.spotNear(pl.pos, 8, 16);
        if (spot) g.spawnEnemy(k ? 'drab' : 'archivist', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    }
  }

  // ---------------------------------------------------------------- 3: smudge

  startSmudge() {
    const g = this.game, pl = g.player;
    this.stage = 2;
    this.light = 0.45;
    this.banner.classList.remove('on');
    for (const b of this.beams) g.scene.remove(b.mesh);
    this.beams = [];
    g.noFire = true;
    g.selectWeapon('blaster');
    g.hud.toast('Out of paint!');
    g.hud.say(g.def.lines.dry || []);
    if (!g.smudge) g.spawnSmudge(pl.pos.x - 2, pl.pos.z + 1);
    // Smudge flies in slowly from wherever it is
    g.smudgeTarget = { x: this.center.x, z: this.center.z, y: RING_Y, speed: 1.15 };
    this.smudgeStart = Math.hypot(g.smudge.pos.x - this.center.x, g.smudge.pos.z - this.center.z) || 1;
    for (const e of [...g.enemies]) g.killEnemy(e, false);
    g.checkStages();
    this.syncHud();
  }

  smudgePhase(dt) {
    const g = this.game, pl = g.player, s = g.smudge;
    // the Curator tries to collect Nova: a steady pull toward the core
    const { dx, dz, dist } = this.toPlayer();
    if (!pl.dead && !pl.jump) {
      pl.pos.x -= dx / dist * 4.6 * dt;
      pl.pos.z -= dz / dist * 4.6 * dt;
      if (Math.random() < dt * 25) g.stream(pl.pos.x, pl.pos.z, this.center.x, this.center.z, pick(GREYS));
      if (dist < this.r + PLAYER_R + 0.4 && this.hurtCd <= 0) {
        this.hurtCd = 0.8;
        g.hurtPlayer(8, dx / dist, dz / dist);
        pl.vel.x += dx / dist * 12; pl.vel.z += dz / dist * 12;
      }
    }
    // and keeps throwing grey at her in a slow spiral
    this.boltCd -= dt;
    if (this.boltCd <= 0) {
      this.boltCd = 0.32;
      this.spiral += 0.55;
      for (let k = 0; k < 2; k++) this.bolt(this.center.x, this.center.z, this.spiral + k * Math.PI, 9, 5, '#b9bec6');
    }
    if (Math.random() < 0.1) g.sfx.vacuum();
    this.syncHud();
    if (s && Math.hypot(s.pos.x - this.center.x, s.pos.z - this.center.z) < 0.3) {
      this.setState('reboot');
      g.hud.say(g.def.lines.reboot || []);
      g.sfx.beep();
    }
  }

  reboot(dt) {
    const g = this.game;
    // the ring flickers through every color it ever collected
    this.flash = 0.5 + Math.sin(this.st * 20) * 0.5;
    if (Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2;
      g.burst(this.center.x + Math.cos(a) * 5, RING_Y, this.center.z + Math.sin(a) * 5, 4, PAINT, 6);
    }
    if (this.st > 3 && !this.dead) {
      this.dead = true;
      this.pivot.remove(this.ringSpin);
      const ring = instance(MESH.curatorRingColor);
      ring.position.y = -CURATOR.eyeY;
      this.ringSpin = new THREE.Group();
      this.ringSpin.add(ring);
      this.pivot.add(this.ringSpin);
      g.noFire = false;
      g.smudgeTarget = null;
      this.light = 1;
      this.lightNow = 1;
      g.hemi.intensity = g.dayLight.hemi;
      g.sun.intensity = g.dayLight.sun;
      if (g.playerLight) g.playerLight.intensity = 0;
      g.burst(this.center.x, RING_Y, this.center.z, 160, PAINT, 16);
      g.shake = 1.5;
      g.sfx.chime();
      g.hud.setBoss(null);
      g.checkStages();
      g.startWave(this.center);
    }
  }

  // ---------------------------------------------------------------- lights

  updateLights(dt) {
    const g = this.game;
    this.lightNow = this.lightNow ?? 1;
    this.lightNow += (this.light - this.lightNow) * Math.min(1, dt * 1.5);
    g.hemi.intensity = g.dayLight.hemi * this.lightNow;
    g.sun.intensity = g.dayLight.sun * this.lightNow;
    if (g.playerLight) g.playerLight.intensity = (1 - this.lightNow) * 45;
  }

  // ---------------------------------------------------------------- damage

  bulletHit(b) {
    const g = this.game;
    if (this.dead || this.state === 'reboot') return false;
    if (this.stage === 0) {
      for (const j of this.jars) {
        if (!j.alive || Math.hypot(b.pos.x - j.pos.x, b.pos.z - j.pos.z) > 1.4) continue;
        this.wake();
        j.hp -= b.dmg;
        j.flash = 1;
        g.sfx.hit();
        g.stats.hits++;
        if (j.hp <= 0) this.breakJar(j);
        else this.syncHud();
        return true;
      }
    }
    if (Math.hypot(b.pos.x - this.center.x, b.pos.z - this.center.z) > this.r) return false;
    if (this.stage === 1 && this.state === 'fight') {
      this.eyeHp -= b.dmg;
      this.flash = 1;
      g.burst(b.pos.x, 3, b.pos.z, 2, ['#9dfbff', b.color], 3);
      g.sfx.hit();
      g.stats.hits++;
      if (this.eyeHp <= 0) this.startSmudge();
      else this.syncHud();
      return true;
    }
    // the white glass shrugs it off
    g.burst(b.pos.x, 2.5, b.pos.z, 2, ['#ffffff', '#c9ced6'], 4);
    g.sfx.block();
    this.wake();
    return true;
  }

  blast(x, z, R, dmg = 14 * this.game.power) {
    if (this.dead || this.state !== 'fight') return;
    if (this.stage === 0) {
      for (const j of this.jars) {
        if (!j.alive || Math.hypot(j.pos.x - x, j.pos.z - z) > R + 1) continue;
        j.hp -= dmg;
        j.flash = 1;
        if (j.hp <= 0) this.breakJar(j);
      }
      this.syncHud();
    } else if (this.stage === 1 && Math.hypot(this.center.x - x, this.center.z - z) < R + this.r) {
      this.eyeHp -= dmg;
      this.flash = 1;
      if (this.eyeHp <= 0) this.startSmudge();
      else this.syncHud();
    }
  }
}
