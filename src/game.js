import * as THREE from 'three';
import { instance, setFlash, glowMaterial } from './voxel.js';
import { MESH, MUZZLE, S, NPC, CITIZENS, PAINT_JARS } from './models.js';
import { angleTo, pick, PAINT, GREYS, PLAYER_R } from './util.js';
import { BOSSES } from './bosses/index.js';
import { Sky, PaintWhale } from './sky.js';
import { Level, TILE, BREAKABLE } from './level.js';
import { WEAPONS, WEAPON_ORDER, ITEMS } from './data/shop.js';
import { THAW_LINES, PIP_LINES, MURALS } from './data/story.js';
import { save } from './save.js';
import { settings } from './settings.js';


const ENEMY = {
  drab: { hp: 3, speed: 4.4, r: 0.75, dmg: 6, sparks: 1, heal: 0.05, splat: 1.5, mesh: 'drab' },
  mopper: { hp: 14, speed: 2.6, r: 1.1, dmg: 12, sparks: 3, heal: 0.2, splat: 2.2, mesh: 'mopper' },
  fizz: { hp: 4, speed: 5.2, r: 0.8, dmg: 0, sparks: 2, heal: 0.08, splat: 1.5, mesh: 'fizz' },
  vat: { hp: 60, speed: 0, r: 2.2, dmg: 0, sparks: 10, heal: 1, splat: 5, mesh: 'vat' },
  smudge: { hp: 1, speed: 1.6, r: 0.75, dmg: 0, sparks: 0, heal: 0, splat: 0, mesh: 'drab' },
  smear: { hp: 5, speed: 3.6, r: 0.95, dmg: 7, sparks: 2, heal: 0.1, splat: 2.2, mesh: 'smear' },
  smearMini: { hp: 1.6, speed: 4.4, r: 0.6, dmg: 4, sparks: 1, heal: 0.03, splat: 1.2, mesh: 'smearMini' },
  stencil: { hp: 4, speed: 3.4, r: 0.8, dmg: 14, sparks: 2, heal: 0.08, splat: 1.6, mesh: 'stencil' },
  static: { hp: 4, speed: 3.6, r: 0.8, dmg: 8, sparks: 2, heal: 0.08, splat: 1.5, mesh: 'static' },
  archivist: { hp: 14, speed: 3.1, r: 1.0, dmg: 6, sparks: 4, heal: 0.25, splat: 2.2, mesh: 'archivist' },
};

const TASK_TEXT = {
  smudge: () => 'Investigate the rattling down the street',
  vats: (d, t) => `Destroy the Grey Vats (${d}/${t})`,
  generators: (d, t) => `Restart the tram generators (${d}/${t})`,
  murals: (d, t) => `Read the ancient murals (${d}/${t})`,
  lanterns: (d, t) => `Relight the firefly lanterns (${d}/${t})`,
  rescue: (d, t, def) => `${def.rescueLabel || 'Thaw the frozen townscats'} (${d}/${t})`,
  whales: (d, t) => `Paint the greyed sky-whales (${d}/${t})`,
  blooms: (d, t) => `Plant Color Seeds in the glass (${d}/${t})`,
  towers: (d, t) => `Tune the radio towers (${d}/${t})`,
  geodes: (d, t) => `Crack the Chroma geodes (${d}/${t})`,
  jars: (d, t) => `Smash the jars of stolen color (${d}/${t})`,
  mirrors: (d, t) => `Aim the color mirrors at Kittara (${d}/${t})`,
};

const STATION = {
  gen: { time: 3, r: 1.6, label: 'Restarting generator…', fx: ['#ffd23f', '#62f4ff'] },
  thaw: { time: 2.2, r: 0.9, label: 'Thawing townscat…', fx: ['#ff9a3d', '#ff8fb1'] },
  lantern: { time: 2, r: 0.7, label: 'Lighting the lantern…', fx: ['#e8ff7a'] },
  bloom: { time: 2.5, r: 0.6, label: 'Planting a Color Seed…', fx: ['#8cff7a', '#ffe066'] },
  tower: { time: 3, r: 1.2, label: 'Tuning the radio tower…', fx: ['#9dfbff', '#ffd000'] },
  mirror: { time: 3, r: 1.2, label: 'Aiming the color mirror…', fx: ['#fff3a8', '#ff8fd8', '#62f4ff'] },
};

/** Paint hits needed to recolor one sky-whale (blaster bolts deal 1). */
const WHALE_PAINT = 32;
const WIND_ARROW = { '1,0': '→', '-1,0': '←', '0,1': '↓', '0,-1': '↑' };

const AGGRO = 24;
/**
 * Robots get tougher world by world to keep pace with the upgrades a player has bought
 * by then (armor, damage). hp: robot health · dmg: damage to Nova · spawn: Vat and
 * beacon-wave pace. Tuned with the autoplay bot in src/dev/autoplay.js.
 */
const THREAT = {
  1: { hp: 1, dmg: 1, spawn: 1 },
  2: { hp: 1.15, dmg: 1.15, spawn: 1.08 },
  3: { hp: 1.3, dmg: 1.3, spawn: 1.16 },
  4: { hp: 1.45, dmg: 1.45, spawn: 1.24 },
  5: { hp: 1.6, dmg: 1.6, spawn: 1.32 },
};
const VAT_RANGE = 32;
const HEAVY = new Set(['mopper', 'archivist']);
const HEAVY_CAP = 3;
/** Blocked shots a Mopper's mop can take before it snaps (blaster bolts deal 1). */
const MOP_HP = 10;
const tmp = { x: 0, z: 0 };


export class Game {
  constructor(renderer, hud, input, sfx) {
    this.renderer = renderer;
    this.hud = hud;
    this.input = input;
    this.sfx = sfx;
    this.camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 1, 400);
    this.raycaster = new THREE.Raycaster();
    this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -MUZZLE.y);
    this.boltGeo = new THREE.BoxGeometry(0.24, 0.24, 1.0);
    this.pelletGeo = new THREE.BoxGeometry(0.3, 0.3, 0.5);
    this.globGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    this.bubbleGeo = new THREE.SphereGeometry(0.38, 12, 8);
    this.trapGeo = new THREE.SphereGeometry(1, 18, 12);
    this.trapMat = new THREE.MeshBasicMaterial({ color: '#7fb3ff', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
    this.vineMat = new THREE.MeshBasicMaterial({ color: '#8cff7a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true });
    this.staticFx = document.createElement('div');
    this.staticFx.id = 'static';
    {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = Math.random() * 255 | 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 1, 1); }
      this.staticFx.style.backgroundImage = `url(${c.toDataURL()})`;
    }
    document.getElementById('app').appendChild(this.staticFx);
    {
      // Rainbow Beam: a stretched box with a scrolling rainbow texture, plus a white core
      const c = document.createElement('canvas');
      c.width = 64; c.height = 4;
      const ctx = c.getContext('2d');
      PAINT.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(i * 64 / PAINT.length, 0, 64 / PAINT.length + 1, 4); });
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.BoxGeometry(1, 0.5, 1).translate(0, 0, 0.5);
      this.beamTex = tex;
      this.beamMesh = new THREE.Group();
      // stripes run along the beam (the texture spans its width), drawn solid so they read on white marble
      this.beamMesh.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, depthWrite: false })));
      const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.scale.set(0.16, 1.1, 1);
      this.beamMesh.add(core);
    }
    this.teleGeo = new THREE.PlaneGeometry(0.8, 16).rotateX(-Math.PI / 2).translate(0, 0, 8);
    this.teleMat = new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.35, depthWrite: false });
    this.mats = {};
    this.state = 'idle';
    this.events = {};
    this.mouseWorld = null;
  }

  mat(color) {
    return this.mats[color] || (this.mats[color] = new THREE.MeshBasicMaterial({ color }));
  }

  // ------------------------------------------------------------------ setup

  /**
   * Push painted ground to the GPU. Only the changed rectangle is copied (a full upload of a
   * big level's ground canvas costs several ms); before the texture's first upload, or when
   * most of it changed, the whole canvas goes up.
   */
  uploadGround() {
    const lv = this.level, tex = lv.groundTex, rects = lv.dirtyRects || [];
    lv.groundDirty = false;
    lv.dirtyRects = [];
    const W = tex.image.width, H = tex.image.height;
    const ready = !!this.renderer.properties.get(tex).__webglTexture;
    const area = rects.reduce((a, r) => a + (r.x1 - r.x0) * (r.y1 - r.y0), 0);
    if (!rects.length || !ready || area > W * H * 0.5) { tex.needsUpdate = true; return; }
    this.groundRegion ||= new THREE.Box2();
    this.groundDst ||= new THREE.Vector2();
    const mips = tex.generateMipmaps;
    rects.forEach((r, i) => {
      // rebuild mipmaps once, after the last patch; the texture is stored flipped (rows from the bottom)
      tex.generateMipmaps = mips && i === rects.length - 1;
      const y = H - r.y1;
      this.groundRegion.min.set(r.x0, y);
      this.groundRegion.max.set(r.x1, y + (r.y1 - r.y0));
      this.groundDst.set(r.x0, y);
      this.renderer.copyTextureToTexture(tex, tex, this.groundRegion, this.groundDst);
    });
    tex.generateMipmaps = mips;
  }

  /**
   * Free the previous level's GPU resources: per-level geometry, every per-instance material,
   * level textures and the sun's shadow map. Shared voxel models, the cached flat-colour
   * materials and the constructor's bullet/beam assets are kept for the next level.
   */
  disposeScene(scene) {
    const keep = new Set([glowMaterial, this.boltGeo, this.pelletGeo, this.globGeo, this.bubbleGeo, this.trapGeo, this.trapMat, this.vineMat, this.teleGeo, this.teleMat, this.beamTex, ...Object.values(this.mats)]);
    this.beamMesh.traverse((o) => { if (o.isMesh) keep.add(o.geometry).add(o.material); });
    const shared = (meshed) => { if (meshed?.solid) keep.add(meshed.solid); if (meshed?.glow) keep.add(meshed.glow); };
    for (const v of Object.values(MESH)) (Array.isArray(v) ? v : [v]).forEach(shared);
    for (const v of Object.values(NPC)) { shared(v.color); shared(v.grey); shared(v.holo); }
    scene.traverse((o) => {
      if (o.isLight && o.shadow?.map) { o.shadow.map.dispose(); o.shadow.map = null; }
      if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) {
        if (keep.has(m)) continue;
        for (const k of ['map', 'alphaMap', 'emissiveMap']) if (m[k] && !keep.has(m[k])) m[k].dispose();
        m.dispose();
      }
    });
  }

  load(def) {
    this.def = def;
    this.isHub = !!def.hub;
    if (this.scene) this.disposeScene(this.scene);
    if (this.level) this.level.dispose();
    const scene = (this.scene = new THREE.Scene());
    const nature = def.theme === 'jungle' || def.theme === 'ruins';
    const docks = def.theme === 'docks';
    const wastes = def.theme === 'wastes';
    const pale = def.theme === 'vault' || def.theme === 'moon';
    scene.background = new THREE.Color(this.isHub ? '#1c1230' : nature ? '#0b2424' : '#2a1d5c');
    scene.fog = new THREE.Fog(scene.background, 60, 120);
    this.hemi = pale ? new THREE.HemisphereLight('#ffffff', '#9aa0c8', def.theme === 'moon' ? 1.2 : 1.5)
      : wastes ? new THREE.HemisphereLight('#fff0e6', '#6b6878', 1.35)
      : docks ? new THREE.HemisphereLight('#fff4fb', '#7a8fc4', 1.45)
      : nature ? new THREE.HemisphereLight('#c8fff0', '#1d3a52', 1.25) : new THREE.HemisphereLight('#ffe3f6', '#4a3a8a', this.isHub ? 1.8 : 1.5);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(nature ? '#d8fff4' : docks ? '#fff4e0' : wastes ? '#ffe6c8' : pale ? '#f4f7ff' : '#fff1d6', nature ? 1.5 : 2.0);
    this.dark = !!def.dark;
    this.dayLight = { hemi: this.hemi.intensity, sun: this.sun.intensity };
    if (this.dark) {
      // night: a little moonlight; Nova, lanterns and paint provide the rest
      scene.background = new THREE.Color('#03080c');
      scene.fog = new THREE.Fog('#03080c', 55, 110);
      this.hemi.intensity = 0.05;
      this.sun.intensity = 0.13;
      this.sun.color.set('#7f9cff');
    }
    this.sun.castShadow = true;
    const shadowSize = settings.graphics === 'fast' ? 1024 : 2048;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(this.sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 });
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun, this.sun.target);

    this.level = new Level(def, scene);
    this.sky = docks ? new Sky(scene, this.level) : null;
    this.bgTo = null;
    if (wastes) {
      // a dusky, colorless sky that warms into a sunset when the wave comes
      scene.background = new THREE.Color('#6b6878');
      scene.fog = new THREE.Fog('#6b6878', 60, 120);
      this.bgTo = new THREE.Color('#ffb38a');
    }
    if (pale) {
      // the black of space; color turns it into a pastel night
      scene.background = new THREE.Color(def.theme === 'moon' ? '#05060f' : '#0b0d1a');
      scene.fog = new THREE.Fog(scene.background, 70, 130);
      this.bgTo = new THREE.Color('#3b2a7a');
    }
    this.gravity = def.lowGravity ? 9 : 24;
    this.noFire = false;
    this.smudgeTarget = null;
    this.turrets = [];
    this.skyBeams = [];
    this.beamOn = 0;
    this.scene.add(this.beamMesh);
    this.beamMesh.visible = false;
    this.fogBase = { near: scene.fog.near, far: scene.fog.far };
    this.storm = def.storm ? { t: def.storm.first ?? 10, warn: 0, on: 0, level: 0 } : null;
    this.surge = 0;
    this.staticFx.classList.remove('on');
    document.getElementById('order')?.remove(); // the Curator's banner, if a fight was left halfway
    this.breakables = [];
    this.level.grid.forEach((row, ty) => row.forEach((ch, tx) => {
      if (!BREAKABLE.has(ch)) return;
      const color = ch === 'J' ? pick(PAINT_JARS) : null;
      const group = instance(ch === 'O' ? MESH.geode : ch === 'J' ? MESH.jars[PAINT_JARS.indexOf(color)] : MESH.glass);
      group.position.set((tx + 0.5) * TILE, 0, (ty + 0.5) * TILE);
      group.rotation.y = ch === 'O' ? Math.random() * Math.PI * 2 : 0;
      scene.add(group);
      this.breakables.push({ ch, tx, ty, group, pos: group.position, hp: ch === 'O' ? 10 : ch === 'J' ? 5 : 6, flash: 0, broken: false, color });
    }));
    this.whales = (def.whales || []).map((lane) => new PaintWhale(scene, lane));
    this.whaleFocus = null;
    this.whaleFocusT = 0;
    this.wind = def.wind ? { t: def.wind.first ?? 8, warn: 0, gust: 0, dir: { x: 1, z: 0 }, n: 0 } : null;
    this.fallers = [];
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    this.vats = [];
    this.npcs = [];
    this.stations = [];
    this.bombs = [];
    this.pads = [];
    this.murals = [];
    this.interactables = [];
    this.smudge = null;
    this.beacon = null;
    this.boss = null;
    this.beam = null;
    this.buildParticles();

    const up = save.data.upgrades;
    this.maxHp = 100 + 25 * up.armor;
    this.speedMul = 1 + 0.08 * up.speed;
    this.power = 1 + 0.2 * up.power;
    this.magnet = 5 + 3 * up.magnet;
    this.zapper = up.zapper;

    this.stats = { pops: 0, sparks: 0, shots: 0, hits: 0, time: 0, seeds: 0 };
    this.threat = THREAT[Number(def.id?.[0])] || THREAT[1];
    this.phase = this.isHub ? 'hub' : 'stages';
    this.stageIdx = 0;
    this.flags = {};
    this.shake = 0;
    this.groundTimer = 0;
    this.mapTimer = 0;
    this.pipLine = 0;

    this.lights = [];
    let npcIdx = 0, seedIdx = 0;
    for (const s of this.level.spawns) {
      switch (s.ch) {
        case 'S': this.spawnPlayer(s.x, s.z); break;
        case 's': if (!save.data.seen.smudge) this.spawnEnemy('smudge', s.x, s.z); break;
        case 'd': this.spawnEnemy('drab', s.x, s.z); break;
        case 'm': this.spawnEnemy('mopper', s.x, s.z); break;
        case 'f': this.spawnEnemy('fizz', s.x, s.z); break;
        case 'V': this.vats.push(this.spawnEnemy('vat', s.x, s.z)); break;
        case 'E': this.spawnBeacon(s.x, s.z); break;
        case 'h': this.spawnPickup('sardine', s.x, s.z); break;
        case 'w': if (def.weaponCase) this.spawnPickup('weapon', s.x, s.z, 0, 0, { weapon: def.weaponCase }); break;
        case '*': {
          const idx = seedIdx++;
          if (!(save.data.seeds[def.id] || []).includes(idx)) this.spawnPickup('seed', s.x, s.z, 0, 0, { idx });
          break;
        }
        case 'N': this.spawnNpc(def.npcs[npcIdx++], s.x, s.z); break;
        case 'c': this.spawnStation('thaw', s.x, s.z); break;
        case 'g': this.spawnStation('gen', s.x, s.z); break;
        case 'F': this.spawnStation('lantern', s.x, s.z); break;
        case 'X': this.boss = new BOSSES[def.boss](this, s.x, s.z); break;
        case 'z': this.spawnEnemy('smear', s.x, s.z); break;
        case 't': this.spawnEnemy('stencil', s.x, s.z); break;
        case 'n': this.spawnEnemy('static', s.x, s.z); break;
        case 'a': this.spawnEnemy('archivist', s.x, s.z); break;
        case 'k': this.spawnStation('mirror', s.x, s.z); break;
        case 'Z': this.spawnTurret(s.x, s.z); break;
        case 'Y': this.spawnStation('bloom', s.x, s.z); break;
        case 'A': this.spawnStation('tower', s.x, s.z); break;
        case 'M': {
          const group = instance(docks || wastes || pale ? MESH.ventPad : MESH.bouncePad);
          group.position.set(s.x, 0, s.z);
          this.scene.add(group);
          this.pads.push({ pos: group.position, group, squash: 0 });
          break;
        }
        default: break;
      }
    }
    for (const p of this.level.props) {
      if (p.ch === 'U') {
        const mural = { pos: new THREE.Vector3(p.x, 0, p.z), idx: this.murals.length, read: false };
        this.murals.push(mural);
        this.interactables.push({ pos: new THREE.Vector3(p.x, 0, p.z + 2), range: 4.4, label: 'Read the ancient mural', run: () => this.readMural(mural) });
        continue;
      }
      if (p.ch === 'C') {
        this.interactables.push({ pos: new THREE.Vector3(p.x, 0, p.z), range: 4.4, label: 'Change your look', run: () => this.events.action?.('wardrobe') });
        continue;
      }
      this.interactables.push({ pos: new THREE.Vector3(p.x, 0, p.z), range: 4.8, label: p.ch === 'T' ? 'Open the world map' : 'Head out on a mission', run: () => this.events.action?.('map') });
    }
    if (save.data.seen.smudge) this.spawnSmudge(this.player.pos.x - 2, this.player.pos.z + 1);
    this.vatsTotal = this.vats.length;
    this.openTiles = [];
    this.level.grid.forEach((row, ty) => row.forEach((ch, tx) => {
      if ('.=:dfmztna'.includes(ch)) this.openTiles.push({ x: (tx + 0.5) * TILE, z: (ty + 0.5) * TILE });
    }));
    if (def.lightsOut) {
      // created dark up front so switching it on later never recompiles shaders
      this.playerLight = new THREE.PointLight('#ffe2c0', 0, 26, 1.25);
      this.playerLight.position.y = 5;
      this.player.root.add(this.playerLight);
    }
    if (this.dark) {
      this.playerLight = new THREE.PointLight('#ffe2c0', 42, 26, 1.25);
      this.playerLight.position.y = 5;
      this.player.root.add(this.playerLight);
      this.buildFireflies();
    }

    this.camTarget = this.player.pos.clone();
    this.resize();
    this.hud.reset(this.isHub);
    this.hud.setLevel(this.isHub ? def.title : `${def.id} · ${def.title}`, def.place);
    this.hud.setSparks(save.data.sparks);
    this.hud.setSeeds(this.isHub ? null : save.seedCount(def.id), 3);
    this.syncItemsHud();
    this.syncWeaponHud();
    if (def.lines?.intro) this.hud.say(def.lines.intro);
    this.checkStages(true);
    this.updateObjective();
    this.state = 'play';
  }

  spawnPlayer(x, z) {
    const root = new THREE.Group();
    const body = instance(MESH.novaBody);
    const legL = instance(MESH.novaLeg);
    const legR = instance(MESH.novaLeg);
    legL.position.set(-2 * S, 6 * S, 0);
    legR.position.set(2 * S, 6 * S, 0);
    root.add(body, legL, legR);
    root.position.set(x, 0, z);
    this.scene.add(root);
    // x-ray silhouette: drawn only where a building hides Nova
    const xray = new THREE.MeshBasicMaterial({ color: '#ffb36b', transparent: true, opacity: 0.5, depthFunc: THREE.GreaterDepth, depthWrite: false });
    for (const part of [body, legL, legR]) {
      const ghost = new THREE.Mesh(part.children[0].geometry, xray);
      ghost.renderOrder = 5;
      part.add(ghost);
    }
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 20, 14),
      new THREE.MeshBasicMaterial({ color: '#62f4ff', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    bubble.position.y = 1.6;
    bubble.visible = false;
    root.add(bubble);
    this.player = {
      pos: root.position, vel: new THREE.Vector3(), hp: this.maxHp, yaw: 0,
      aim: new THREE.Vector3(0, 0, 1), weapon: 'blaster', fireCd: 0, shield: 0,
      hurtFlash: 0, slow: 0, snare: 0, walk: 0, root, body, legL, legR, bubble, dead: false,
    };
    this.hud.setHealth(this.player.hp, this.maxHp);
  }

  /** Swap Nova's meshes after a wardrobe change (keeps position, materials and x-ray ghosts). */
  restylePlayer() {
    const pl = this.player;
    if (!pl) return;
    for (const [part, meshed] of [[pl.body, MESH.novaBody], [pl.legL, MESH.novaLeg], [pl.legR, MESH.novaLeg]]) {
      const [solid, glow, ghost] = part.children;
      solid.geometry = meshed.solid;
      if (glow && meshed.glow) glow.geometry = meshed.glow;
      if (ghost) ghost.geometry = meshed.solid;
    }
  }

  spawnEnemy(type, x, z, opts = {}) {
    const def = ENEMY[type];
    const group = instance(MESH[def.mesh]);
    group.position.set(x, 0, z);
    this.scene.add(group);
    const e = {
      type, def, group, pos: group.position, vel: new THREE.Vector3(), hp: def.hp * (this.threat?.hp || 1), r: def.r,
      yaw: Math.random() * Math.PI * 2, flash: 0, atkCd: 1 + Math.random(), aggro: !!opts.aggro,
      spawnT: opts.fromVat ? 0 : 1, parent: opts.parent || null, children: 0, spawnCd: 2,
      pattern: 0, strafe: Math.random() < 0.5 ? -1 : 1, home: { x, z }, wander: 0, t: Math.random() * 10,
    };
    if (type === 'vat') e.yaw = 0;
    if (type === 'stencil') { group.userData.material.transparent = true; e.mode = 'sneak'; e.modeT = 0; }
    if (type === 'archivist') {
      e.mode = 'hunt'; e.modeT = 0; e.stealCd = 1; e.loot = { ammo: {}, sparks: 0 };
      const jar = instance(MESH.archivistJar);
      jar.position.set(-5.5 * S, 10 * S, 4 * S);
      const fill = new THREE.Mesh(new THREE.BoxGeometry(3 * S, 5 * S, 3 * S).translate(0, 2.5 * S, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      fill.position.y = 0.6 * S;
      fill.scale.y = 0.01;
      fill.visible = false;
      jar.add(fill);
      group.add(jar);
      e.fill = fill;
    }
    if (type === 'static') { group.userData.material.transparent = true; e.mode = 'on'; e.modeT = 0; e.onFor = 1 + Math.random() * 1.5; }
    group.rotation.y = e.yaw;
    this.enemies.push(e);
    return e;
  }

  spawnBeacon(x, z) {
    const group = instance(MESH.beaconOff);
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.beacon = { pos: group.position, group, charge: 0, r: 1.6 };
  }

  spawnPickup(kind, x, z, vx = 0, vz = 0, extra = {}) {
    const mesh = kind === 'weapon' ? MESH[`weapon_${extra.weapon}`] : { spark: MESH.spark, sardine: MESH.sardine, seed: MESH.seed }[kind];
    const group = instance(mesh);
    group.position.set(x, 0.3, z);
    this.scene.add(group);
    this.pickups.push({ kind, group, pos: group.position, vx, vz, t: Math.random() * 6, age: 0, ...extra });
  }

  spawnNpc(def, x, z) {
    const look = NPC[def.model];
    const group = instance(def.holo ? look.holo : look.color, { holo: def.holo });
    group.position.set(x, def.holo ? 0.4 : 0, z);
    group.rotation.y = Math.PI * 0.1;
    this.scene.add(group);
    const npc = { def, group, pos: group.position, yaw: group.rotation.y, r: 0.9, t: Math.random() * 5 };
    this.npcs.push(npc);
    const label = def.action === 'shop' ? "Shop at Grandpa's hologram" : `Talk to ${def.name}`;
    this.interactables.push({ pos: npc.pos, range: 3.4, label, run: () => this.talkTo(npc) });
  }

  spawnStation(kind, x, z) {
    let group, look, light = null;
    if (kind === 'gen') group = instance(MESH.generatorOff);
    else if (kind === 'bloom') group = instance(MESH.seedPlot);
    else if (kind === 'tower') group = instance(MESH.towerOff);
    else if (kind === 'mirror') group = instance(MESH.mirrorOff);
    else if (kind === 'lantern') {
      group = instance(MESH.lanternOff);
      // lights are created up front (dark) so lighting one never recompiles shaders
      light = new THREE.PointLight('#d8ff7a', 0, 30, 1.15);
      light.position.set(x, 4.5, z);
      this.scene.add(light);
    } else {
      look = pick(CITIZENS);
      group = instance(NPC[look].grey);
      group.rotation.y = Math.random() * Math.PI * 2;
    }
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.stations.push({ kind, look, light, group, pos: group.position, done: false, progress: 0, r: STATION[kind].r, t: 0 });
  }

  spawnSmudge(x, z) {
    const group = instance(MESH.smudge);
    group.position.set(x, 1.6, z);
    this.scene.add(group);
    this.smudge = { group, pos: group.position, t: 0, yaw: 0, zapCd: 1 };
  }

  buildParticles() {
    const N = 900;
    this.pN = N;
    this.pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.MeshLambertMaterial(), N);
    this.pMesh.frustumCulled = false;
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) this.pMesh.setColorAt(i, c.set('#ffffff'));
    this.p = {
      x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N),
      vx: new Float32Array(N), vy: new Float32Array(N), vz: new Float32Array(N),
      life: new Float32Array(N), max: new Float32Array(N), next: 0,
    };
    this.scene.add(this.pMesh);
    this.pMat = new THREE.Matrix4();
  }

  burst(x, y, z, count, colors, speed = 7) {
    const p = this.p, c = new THREE.Color();
    for (let k = 0; k < count; k++) {
      const i = p.next;
      p.next = (p.next + 1) % this.pN;
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      p.x[i] = x; p.y[i] = y; p.z[i] = z;
      p.vx[i] = Math.cos(a) * s; p.vz[i] = Math.sin(a) * s; p.vy[i] = 4 + Math.random() * 8;
      p.life[i] = p.max[i] = 0.7 + Math.random() * 0.6;
      this.pMesh.setColorAt(i, c.set(pick(colors)));
    }
    this.pMesh.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ frame

  update(dt) {
    const pl = this.player;
    this.stats.time += dt;
    if (!pl.dead) this.updatePlayer(dt);
    if (!this.isHub) this.level.reveal(pl.pos.x, pl.pos.z, this.dark ? 4 : 7);
    if (this.fireflies) this.updateFireflies(dt);
    if (this.sky) this.sky.update(dt);
    if (this.whales.length) this.updateWhales(dt);
    if (this.wind) this.updateWind(dt);
    if (this.fallers.length) this.updateFallers(dt);
    if (this.breakables.length) this.updateBreakables(dt);
    if (this.storm) this.updateStorm(dt);
    if (this.turrets.length) this.updateTurrets(dt);
    if (this.skyBeams.length) this.updateSkyBeams(dt);
    this.updateBeam(dt);
    this.level.updateRift();
    this.level.updateFlow(pl.pos.x, pl.pos.z);
    this.updateEnemies(dt);
    if (this.boss && !this.boss.dead) this.boss.update(dt);
    this.updateBullets(dt);
    this.updateBombs(dt);
    this.updatePads(dt);
    this.updatePickups(dt);
    this.updateSmudge(dt);
    this.updateNpcs(dt);
    this.updateStations(dt);
    this.updateInteract();
    this.updateMission(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);
    this.groundTimer += dt;
    if (this.level.groundDirty && this.groundTimer > 0.1) {
      this.uploadGround();
      this.groundTimer = 0;
    }
    this.mapTimer -= dt;
    if (this.mapTimer <= 0) { this.mapTimer = 0.1; this.hud.drawMinimap(this); }
  }

  updatePlayer(dt) {
    const pl = this.player, inp = this.input;
    if (inp.pressed('KeyQ', 'WheelDown', 'WheelUp', 'PadNext', 'PadPrev')) this.cycleWeapon();
    WEAPON_ORDER.forEach((id, i) => { if (inp.pressed(`Digit${i + 1}`)) this.selectWeapon(id); });
    if (inp.pressed('KeyH', 'PadX')) this.useItem('sardine');
    if (inp.pressed('KeyG', 'PadB')) this.useItem('bomb');
    if (inp.pressed('KeyB', 'PadY')) this.useItem('shield');
    if (inp.pressed('KeyE', 'Enter', 'PadA')) this.interact();

    if (pl.snare > 0) {
      pl.snare -= dt;
      if (pl.snare <= 0 && pl.net) pl.net.visible = false;
    }
    const mv = pl.snare > 0 ? { x: 0, z: 0 } : inp.move();
    if (pl.jump) {
      // mid-bounce: fly along the arc, no walking or collisions
      const j = pl.jump;
      j.t += dt;
      const u = Math.min(1, j.t / j.dur);
      pl.pos.x = j.fx + (j.tx - j.fx) * u;
      pl.pos.z = j.fz + (j.tz - j.fz) * u;
      pl.pos.y = Math.sin(Math.PI * u) * j.h;
      if (u >= 1) {
        pl.jump = null;
        pl.pos.y = 0;
        // landing on another mushroom shouldn't fire it until Nova steps off
        pl.onPad = this.pads.find((pad) => Math.hypot(pl.pos.x - pad.pos.x, pl.pos.z - pad.pos.z) < 1.3) || null;
        this.burst(pl.pos.x, 0.3, pl.pos.z, 10, ['#ffb21f', '#fff5b8', '#8cff7a'], 4);
        this.shake = Math.max(this.shake, 0.3);
        this.sfx.hit();
      }
    } else {
      const speed = 9 * this.speedMul * (pl.slow > 0 ? 0.55 : 1);
      const k = 1 - Math.exp(-(this.def.lowGravity ? 5 : 14) * dt); // the moon is slippery
      pl.vel.x += (mv.x * speed - pl.vel.x) * k;
      pl.vel.z += (mv.z * speed - pl.vel.z) * k;
      pl.pos.x += pl.vel.x * dt;
      pl.pos.z += pl.vel.z * dt;
      this.level.collide(pl.pos, PLAYER_R);
      this.pushFromObstacles(pl.pos, PLAYER_R);
      this.checkPads(mv);
    }
    pl.slow = Math.max(0, pl.slow - dt);

    // aim
    this.mouseWorld = null;
    const stick = inp.aimStick();
    if (stick) {
      pl.aim.set(stick.x, 0, stick.z).normalize();
      if (inp.usingTouch) this.aimAssist(pl.aim);
    } else if (inp.mouse.seen && !inp.usingTouch && !inp.usingPad) {
      const ndc = new THREE.Vector2((inp.mouse.x / innerWidth) * 2 - 1, -(inp.mouse.y / innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.aimPlane, hit)) {
        this.mouseWorld = hit;
        const dx = hit.x - pl.pos.x, dz = hit.z - pl.pos.z;
        if (dx * dx + dz * dz > 0.25) pl.aim.set(dx, 0, dz).normalize();
      }
    } else if (Math.hypot(mv.x, mv.z) > 0.2) {
      pl.aim.set(mv.x, 0, mv.z).normalize();
    }
    pl.yaw = angleTo(pl.yaw, Math.atan2(pl.aim.x, pl.aim.z), 20 * dt);
    pl.root.rotation.y = pl.yaw;

    const moving = Math.hypot(pl.vel.x, pl.vel.z);
    pl.walk += dt * moving * 1.6;
    const swing = Math.min(1, moving / 6) * 0.7;
    pl.legL.rotation.x = Math.sin(pl.walk) * swing;
    pl.legR.rotation.x = -Math.sin(pl.walk) * swing;
    pl.body.position.y = Math.abs(Math.sin(pl.walk)) * 0.12 * Math.min(1, moving / 6);

    pl.fireCd -= dt;
    if (!this.isHub && inp.firing() && pl.fireCd <= 0) {
      if (this.noFire) {
        // out of paint: the blaster only coughs
        pl.fireCd = 0.4;
        this.burst(this.muzzle().x, MUZZLE.y, this.muzzle().z, 2, GREYS, 2);
        this.sfx.block();
      } else this.fire();
    }

    pl.shield = Math.max(0, pl.shield - dt);
    pl.bubble.visible = pl.shield > 0 && (pl.shield > 1 || Math.sin(pl.shield * 30) > 0);
    pl.body.position.z *= Math.exp(-20 * dt);
    pl.hurtFlash = Math.max(0, pl.hurtFlash - dt * 4);
    setFlash(pl.body, pl.hurtFlash);
  }

  /** Running onto a bounce mushroom launches Nova the way she is moving. */
  checkPads(mv) {
    const pl = this.player;
    let on = null;
    for (const pad of this.pads) if (Math.hypot(pl.pos.x - pad.pos.x, pl.pos.z - pad.pos.z) < 1.3) on = pad;
    if (!on) { pl.onPad = null; return; }
    if (pl.onPad === on) return; // must step off before it fires again
    pl.onPad = on;
    let dx = mv.x, dz = mv.z;
    if (Math.hypot(dx, dz) < 0.3) { dx = pl.aim.x; dz = pl.aim.z; }
    // snap to the main axis so jumps line up with the rivers
    if (Math.abs(dx) > Math.abs(dz)) { dx = Math.sign(dx); dz = 0; } else { dz = Math.sign(dz); dx = 0; }
    for (const d of [3, 4, 5, 2, 6]) {
      const tx = on.pos.x + dx * d * TILE, tz = on.pos.z + dz * d * TILE;
      if (!this.level.walkableAt(tx, tz)) continue;
      const lowG = this.def.lowGravity ? 1.7 : 1;
      pl.jump = { t: 0, dur: (0.45 + d * 0.07) * lowG, fx: pl.pos.x, fz: pl.pos.z, tx, tz, h: (2.5 + d * 0.6) * lowG };
      pl.vel.set(0, 0, 0);
      on.squash = 1;
      this.sfx.rev();
      this.burst(on.pos.x, 1, on.pos.z, 12, ['#ffb21f', '#fff5b8'], 5);
      return;
    }
  }

  readMural(mural) {
    if (!mural.read) {
      mural.read = true;
      const n = this.murals.filter((m) => m.read).length;
      this.hud.say(this.def.lines[`murals_${n}`] || []);
      this.checkStages();
    }
    this.events.action?.('mural', MURALS[mural.idx % MURALS.length]);
  }

  updatePads(dt) {
    for (const pad of this.pads) {
      pad.squash = Math.max(0, pad.squash - dt * 3);
      const s = pad.squash;
      pad.group.scale.set(1 + s * 0.35, 1 - s * 0.5 + Math.sin(s * 12) * s * 0.2, 1 + s * 0.35);
      if (this.sky && Math.random() < 0.05) this.burst(pad.pos.x + (Math.random() - 0.5), 0.3, pad.pos.z + (Math.random() - 0.5), 1, ['#ffffff', '#fff4e6'], 0.8);
    }
  }

  pushFromObstacles(pos, r) {
    for (const e of this.vats) if (this.enemies.includes(e)) this.pushOut(pos, r, e.pos, e.r);
    for (const s of this.stations) this.pushOut(pos, r, s.pos, s.r);
    for (const n of this.npcs) this.pushOut(pos, r, n.pos, n.r);
    if (this.beacon) this.pushOut(pos, r, this.beacon.pos, this.beacon.r);
    if (this.boss && !this.boss.dead) this.pushOut(pos, r, this.boss.pos, this.boss.r);
    for (const t of this.turrets) if (!t.dead) this.pushOut(pos, r, t.pos, 1.1);
  }

  aimAssist(aim) {
    let best = null, bestScore = 0.9;
    for (const e of this.enemies) {
      const dx = e.pos.x - this.player.pos.x, dz = e.pos.z - this.player.pos.z, d = Math.hypot(dx, dz);
      if (d > 18 || d < 0.1) continue;
      const dot = (dx * aim.x + dz * aim.z) / d;
      if (dot > bestScore) { bestScore = dot; best = { x: dx / d, z: dz / d }; }
    }
    if (best) aim.set(best.x, 0, best.z);
  }

  muzzle() {
    const pl = this.player, s = Math.sin(pl.yaw), c = Math.cos(pl.yaw);
    return new THREE.Vector3(pl.pos.x + c * MUZZLE.x + s * MUZZLE.z, MUZZLE.y, pl.pos.z - s * MUZZLE.x + c * MUZZLE.z);
  }

  // ------------------------------------------------------------------ weapons & items

  ammoOf(id) { return id === 'blaster' ? Infinity : save.data.ammo[id] || 0; }

  fire() {
    const pl = this.player, w = WEAPONS[pl.weapon];
    if (this.ammoOf(pl.weapon) <= 0) { this.selectWeapon('blaster'); return; }
    pl.fireCd = w.cd;
    if (w.beam) {
      // the beam itself is drawn and applied every frame in updateBeam
      this.beamOn = w.cd + 0.05;
      save.data.ammo[pl.weapon]--;
      if (save.data.ammo[pl.weapon] <= 0) this.selectWeapon('blaster');
      this.syncWeaponHud();
      if (Math.random() < 0.3) this.sfx.hum();
      return;
    }
    if (w.lob) {
      this.lob('seed');
      this.stats.shots++;
      save.data.ammo[pl.weapon]--;
      if (save.data.ammo[pl.weapon] <= 0) this.selectWeapon('blaster');
      this.syncWeaponHud();
      return;
    }
    const from = this.muzzle();
    const base = Math.atan2(pl.aim.x, pl.aim.z);
    for (let i = 0; i < w.pellets; i++) {
      const a = base + (w.pellets > 1 ? (i / (w.pellets - 1) - 0.5) * w.spread : 0) + (Math.random() - 0.5) * w.spread * 0.4;
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const geo = w.trap ? this.bubbleGeo : w.pellets > 1 ? this.pelletGeo : this.boltGeo;
      this.addBullet(from, dir, w.speed * (0.92 + Math.random() * 0.16), w.life, w.dmg * this.power, w.color, 'player', geo, w.trap || 0, w.bounce || 0);
    }
    this.stats.shots++;
    if (pl.weapon !== 'blaster') {
      save.data.ammo[pl.weapon]--;
      if (save.data.ammo[pl.weapon] <= 0) this.selectWeapon('blaster');
    }
    this.syncWeaponHud();
    if (w.pellets > 1) { this.sfx.splatter(); this.shake = Math.max(this.shake, 0.25); } else this.sfx.shoot();
    pl.body.position.z = -0.1;
  }

  addBullet(from, dir, speed, life, dmg, color, owner, geo, trap = 0, bounce = 0) {
    const mesh = new THREE.Mesh(geo, this.mat(color));
    mesh.position.copy(from);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    this.scene.add(mesh);
    this.bullets.push({ mesh, pos: mesh.position, vel: dir.multiplyScalar(speed), life, dmg, color, owner, trap, bounce });
  }

  ownedWeapons() { return WEAPON_ORDER.filter((id) => save.data.weapons[id]); }

  cycleWeapon() {
    const list = this.ownedWeapons().filter((id) => this.ammoOf(id) > 0);
    const i = list.indexOf(this.player.weapon);
    this.selectWeapon(list[(i + 1) % list.length]);
  }

  selectWeapon(id) {
    if (!save.data.weapons[id] || this.ammoOf(id) <= 0) return;
    this.player.weapon = id;
    this.syncWeaponHud();
  }

  syncWeaponHud() {
    const id = this.player.weapon, w = WEAPONS[id];
    const swappable = this.ownedWeapons().filter((x) => this.ammoOf(x) > 0).length > 1;
    this.hud.setWeapon(w.name, this.ammoOf(id), w.color, swappable && !this.isHub);
  }

  syncItemsHud() { this.hud.setItems(save.data.items, this.isHub); }

  /** Loaded weapons for the touch weapon picker. */
  weaponList() {
    return this.ownedWeapons().filter((id) => this.ammoOf(id) > 0)
      .map((id) => ({ id, name: WEAPONS[id].name, color: WEAPONS[id].color, ammo: this.ammoOf(id), current: id === this.player.weapon }));
  }

  useItem(id) {
    const pl = this.player;
    if (this.isHub || pl.dead || this.state !== 'play' || !(save.data.items[id] > 0)) return;
    if (id === 'bomb' && this.noFire) return;
    if (id === 'sardine') {
      if (pl.hp >= this.maxHp) { this.hud.toast('Already full health'); return; }
      pl.hp = Math.min(this.maxHp, pl.hp + 40);
      this.hud.setHealth(pl.hp, this.maxHp);
      this.sfx.heal();
      this.burst(pl.pos.x, 2, pl.pos.z, 10, ['#8cff7a', '#ffffff'], 4);
      if (pl.hp >= 35) this.flags.lowHealth = false;
    } else if (id === 'bomb') {
      this.throwBomb();
    } else if (id === 'shield') {
      pl.shield = 5;
      this.sfx.chime();
    }
    save.data.items[id]--;
    this.syncItemsHud();
  }

  throwBomb() { this.lob('bomb'); }

  /** Lob a Paint Bomb or a Seed Mortar shell toward the cursor (or straight ahead). */
  lob(kind) {
    const pl = this.player, from = this.muzzle();
    const far = kind === 'seed' ? 13 : 11;
    let dist = kind === 'seed' ? 10 : 8;
    if (this.mouseWorld) dist = Math.min(far, Math.max(3, Math.hypot(this.mouseWorld.x - pl.pos.x, this.mouseWorld.z - pl.pos.z)));
    else if (kind === 'seed') dist = this.autoLobDist(dist);
    const tx = pl.pos.x + pl.aim.x * dist, tz = pl.pos.z + pl.aim.z * dist;
    const T = kind === 'seed' ? 0.5 : 0.6, g = 30;
    const group = instance(kind === 'seed' ? MESH.seed : MESH.bomb);
    group.position.copy(from);
    this.scene.add(group);
    this.bombs.push({ kind, group, pos: group.position, vx: (tx - from.x) / T, vz: (tz - from.z) / T, vy: (0.3 - from.y + 0.5 * g * T * T) / T, t: T, g });
    this.sfx.spit();
  }

  /** Without a mouse, aim the mortar at the nearest robot roughly in front of Nova. */
  autoLobDist(fallback) {
    const pl = this.player;
    let best = fallback, bs = 0.8;
    for (const e of this.enemies) {
      const dx = e.pos.x - pl.pos.x, dz = e.pos.z - pl.pos.z, d = Math.hypot(dx, dz);
      if (d < 3 || d > 13) continue;
      const dot = (dx * pl.aim.x + dz * pl.aim.z) / d;
      if (dot > bs) { bs = dot; best = d; }
    }
    return best;
  }

  /** Seed Mortar shell lands: a burst of vines that snares and stings everything nearby. */
  vineBurst(x, z) {
    const R = WEAPONS.mortar.radius, dmg = WEAPONS.mortar.dmg * this.power;
    this.burst(x, 0.8, z, 30, ['#8cff7a', '#5cc46a', '#3f9b4a', '#ffe066'], 7);
    for (let k = 0; k < 3; k++) this.level.splat(x + (Math.random() - 0.5) * 3, z + (Math.random() - 0.5) * 3, 1.4, pick(['#5cc46a', '#8cff7a', '#3f9b4a']));
    this.sfx.vine();
    for (const e of [...this.enemies]) {
      const d = Math.hypot(e.pos.x - x, e.pos.z - z);
      if (d > R + e.r) continue;
      if (e.type === 'static' && e.ghost) continue;
      this.damageEnemy(e, dmg, { x: (e.pos.x - x) / (d || 1), z: (e.pos.z - z) / (d || 1) });
      if (this.enemies.includes(e)) this.trap(e, WEAPONS.mortar.snare, this.vineMat);
    }
    this.blastBreakables(x, z, R, dmg);
    if (this.boss && !this.boss.dead) this.boss.blast(x, z, R, dmg * 1.5);
  }

  updateBombs(dt) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.t -= dt;
      b.vy -= b.g * dt;
      b.pos.x += b.vx * dt; b.pos.y += b.vy * dt; b.pos.z += b.vz * dt;
      b.group.rotation.x += dt * 10;
      if (this.level.solidAt(b.pos.x, b.pos.z)) { b.pos.x -= b.vx * dt; b.pos.z -= b.vz * dt; b.vx = b.vz = 0; }
      if (b.t > 0) continue;
      this.scene.remove(b.group);
      this.bombs.splice(i, 1);
      if (b.kind === 'seed') this.vineBurst(b.pos.x, b.pos.z);
      else this.explode(b.pos.x, b.pos.z);
    }
  }

  explode(x, z) {
    const R = 5.5;
    this.burst(x, 1, z, 70, PAINT, 12);
    for (let k = 0; k < 4; k++) this.level.splat(x + (Math.random() - 0.5) * 4, z + (Math.random() - 0.5) * 4, 2.6, pick(PAINT));
    this.shake = Math.max(this.shake, 0.9);
    this.sfx.bigPop();
    for (const e of [...this.enemies]) {
      const d = Math.hypot(e.pos.x - x, e.pos.z - z);
      if (d > R + e.r) continue;
      const dir = { x: (e.pos.x - x) / (d || 1), z: (e.pos.z - z) / (d || 1) };
      this.damageEnemy(e, (e.type === 'vat' ? 14 : 7) * this.power, dir);
    }
    this.blastBreakables(x, z, R, 10);
    if (this.boss && !this.boss.dead) this.boss.blast(x, z, R, 14 * this.power);
  }

  pushOut(pos, r, center, cr) {
    const dx = pos.x - center.x, dz = pos.z - center.z, d = Math.hypot(dx, dz), min = r + cr;
    if (d < min && d > 1e-4) { pos.x = center.x + dx / d * min; pos.z = center.z + dz / d * min; }
  }

  // ------------------------------------------------------------------ enemies

  updateEnemies(dt) {
    const pl = this.player;
    for (const e of this.enemies) {
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt * 6);
      setFlash(e.group, e.flash);
      if (e.spawnT < 1) {
        e.spawnT = Math.min(1, e.spawnT + dt * 3);
        e.group.scale.setScalar(0.2 + 0.8 * e.spawnT);
      }
      const dx = pl.pos.x - e.pos.x, dz = pl.pos.z - e.pos.z, dist = Math.hypot(dx, dz) || 0.001;
      if (!e.aggro && dist < AGGRO && e.type !== 'smudge' && e.type !== 'vat') e.aggro = true;
      if (pl.dead) e.aggro = false;

      if (e.type === 'vat') { this.updateVat(e, dt, dist); continue; }
      if (e.type === 'smudge') { this.updateSmudgeDrab(e, dt, dist); continue; }
      if (e.trapped > 0) {
        e.trapped -= dt;
        e.vel.set(0, 0, 0);
        e.bubble.position.y = e.r + 0.5 + Math.sin(e.t * 4) * 0.15;
        e.group.children[0].position.y = 0.6 + Math.sin(e.t * 4) * 0.15;
        e.group.rotation.y += dt * 1.5;
        if (e.trapped <= 0) this.popTrap(e);
        continue;
      }
      if (e.type === 'smear' || e.type === 'smearMini') { this.updateSmear(e, dt, dx, dz, dist); continue; }
      if (e.type === 'stencil') { this.updateStencil(e, dt, dx, dz, dist); continue; }
      if (e.type === 'static') { this.updateStatic(e, dt, dx, dz, dist); continue; }
      if (e.type === 'archivist') { this.updateArchivist(e, dt, dx, dz, dist); continue; }

      let want = { x: 0, z: 0 };
      const speed = e.def.speed;
      if (e.aggro) {
        const los = dist < 14 && this.level.lineOfSight(e.pos.x, e.pos.z, pl.pos.x, pl.pos.z);
        const toward = los ? { x: dx / dist, z: dz / dist } : this.level.flowDir(e.pos.x, e.pos.z, tmp);
        if (e.type === 'fizz') {
          if (!los || dist > 13) want = { x: toward.x, z: toward.z };
          else if (dist < 8) want = { x: -dx / dist, z: -dz / dist };
          else want = { x: -dz / dist * e.strafe, z: dx / dist * e.strafe };
          if (Math.random() < dt * 0.3) e.strafe *= -1;
          e.atkCd -= dt;
          if (los && dist < 17 && e.atkCd <= 0) {
            e.atkCd = 1.8 + Math.random() * 1.2;
            this.addBullet(new THREE.Vector3(e.pos.x, 1.6, e.pos.z), new THREE.Vector3(dx / dist, 0, dz / dist), 13, 2, 6, '#b9bec6', 'enemy', this.globGeo);
            this.sfx.spit();
          }
        } else {
          want = { x: toward.x, z: toward.z };
        }
      } else {
        e.wander -= dt;
        if (e.wander <= 0) { e.wander = 1 + Math.random() * 2; e.wx = Math.random() * 2 - 1; e.wz = Math.random() * 2 - 1; }
        want = { x: e.wx * 0.3, z: e.wz * 0.3 };
      }
      const k = 1 - Math.exp(-8 * dt);
      e.vel.x += (want.x * speed - e.vel.x) * k;
      e.vel.z += (want.z * speed - e.vel.z) * k;
      e.pos.x += e.vel.x * dt;
      e.pos.z += e.vel.z * dt;

      const faceTarget = (e.type === 'mopper' || e.type === 'fizz') && e.aggro && dist < 16 ? Math.atan2(dx, dz) : Math.atan2(e.vel.x, e.vel.z);
      if (Math.hypot(e.vel.x, e.vel.z) > 0.3 || e.type !== 'drab') e.yaw = angleTo(e.yaw, faceTarget, (e.type === 'mopper' ? 2.2 : 8) * dt);
      e.group.rotation.y = e.yaw;
      if (e.type === 'fizz') e.pos.y = 1.4 + Math.sin(e.t * 3) * 0.25;
      else e.group.rotation.z = Math.sin(e.t * 12) * 0.06 * Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 2);

      if (e.def.dmg && e.aggro) {
        e.atkCd -= dt;
        if (dist < e.r + PLAYER_R + 0.25 && e.atkCd <= 0) {
          e.atkCd = 0.9;
          this.hurtPlayer(e.def.dmg, dx / dist, dz / dist);
        }
      }
    }

    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.type === 'vat') continue;
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const b = list[j];
        const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, min = a.r + b.r, d2 = dx * dx + dz * dz;
        if (d2 >= min * min || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), push = (min - d) * (b.type === 'vat' ? 1 : 0.5);
        a.pos.x += dx / d * push; a.pos.z += dz / d * push;
      }
      for (const s of this.stations) this.pushOut(a.pos, a.r, s.pos, s.r);
      for (const n of this.npcs) this.pushOut(a.pos, a.r, n.pos, n.r);
      // robots crowd up to Nova but never stand inside her (she can still walk through them)
      if (!pl.dead && !pl.jump && a.type !== 'smudge') this.pushOut(a.pos, a.r, pl.pos, PLAYER_R * 0.8);
      if (this.beacon) this.pushOut(a.pos, a.r, this.beacon.pos, this.beacon.r);
      if (this.boss && !this.boss.dead) this.pushOut(a.pos, a.r, this.boss.pos, this.boss.r);
      this.level.collide(a.pos, a.r);
    }
  }

  updateSmear(e, dt, dx, dz, dist) {
    // hop toward Nova, slide, squash on landing
    e.hopCd = (e.hopCd ?? Math.random()) - dt;
    if (e.aggro && e.hopCd <= 0) {
      e.hopCd = e.type === 'smear' ? 0.75 : 0.5;
      const toward = dist < 14 && this.level.lineOfSight(e.pos.x, e.pos.z, this.player.pos.x, this.player.pos.z)
        ? { x: dx / dist, z: dz / dist } : this.level.flowDir(e.pos.x, e.pos.z, tmp);
      e.vel.x = toward.x * e.def.speed * 2.3;
      e.vel.z = toward.z * e.def.speed * 2.3;
      e.hopT = 0;
    }
    e.hopT = (e.hopT ?? 1) + dt;
    e.vel.multiplyScalar(Math.exp(-4 * dt));
    e.pos.x += e.vel.x * dt;
    e.pos.z += e.vel.z * dt;
    const h = Math.max(0, Math.sin(Math.min(1, e.hopT / 0.45) * Math.PI));
    e.group.children[0].position.y = h * 0.8;
    e.group.scale.set(1 + (1 - h) * 0.12, 1 - (1 - h) * 0.15 + h * 0.15, 1 + (1 - h) * 0.12);
    if (Math.hypot(e.vel.x, e.vel.z) > 0.5) e.yaw = angleTo(e.yaw, Math.atan2(e.vel.x, e.vel.z), 8 * dt);
    e.group.rotation.y = e.yaw;
    e.atkCd -= dt;
    if (e.aggro && dist < e.r + PLAYER_R + 0.25 && e.atkCd <= 0) {
      e.atkCd = 0.9;
      this.hurtPlayer(e.def.dmg, dx / dist, dz / dist);
    }
  }

  /**
   * Stencil: creeps in almost invisible, stops, paints a red line at Nova, then
   * charges along it. Running into a wall leaves it dizzy.
   */
  updateStencil(e, dt, dx, dz, dist) {
    const pl = this.player, mat = e.group.userData.material;
    e.modeT += dt;
    const to = (mode) => { e.mode = mode; e.modeT = 0; };
    let opacity = 1;
    if (e.mode === 'sneak') {
      const los = dist < 15 && this.level.lineOfSight(e.pos.x, e.pos.z, pl.pos.x, pl.pos.z);
      let want = { x: 0, z: 0 };
      if (e.aggro) want = los ? { x: dx / dist, z: dz / dist } : this.level.flowDir(e.pos.x, e.pos.z, tmp);
      else {
        e.wander -= dt;
        if (e.wander <= 0) { e.wander = 1 + Math.random() * 2; e.wx = Math.random() * 2 - 1; e.wz = Math.random() * 2 - 1; }
        want = { x: e.wx * 0.3, z: e.wz * 0.3 };
      }
      const k = 1 - Math.exp(-8 * dt);
      e.vel.x += (want.x * e.def.speed - e.vel.x) * k;
      e.vel.z += (want.z * e.def.speed - e.vel.z) * k;
      e.pos.x += e.vel.x * dt;
      e.pos.z += e.vel.z * dt;
      if (Math.hypot(e.vel.x, e.vel.z) > 0.3) e.yaw = angleTo(e.yaw, Math.atan2(e.vel.x, e.vel.z), 6 * dt);
      e.group.rotation.z = Math.sin(e.t * 10) * 0.05;
      opacity = dist > 11 ? 0.22 : 0.22 + (11 - dist) / 5;
      e.atkCd -= dt;
      if (e.aggro && los && dist < 13 && e.atkCd <= 0 && !pl.dead) {
        to('aim');
        e.dash = { x: dx / dist, z: dz / dist };
        e.tele = new THREE.Mesh(this.teleGeo, this.teleMat);
        e.tele.position.set(e.pos.x, 0.09, e.pos.z);
        e.tele.rotation.y = Math.atan2(e.dash.x, e.dash.z);
        this.scene.add(e.tele);
        this.sfx.snip();
        if (!this.flags.stencil) { this.flags.stencil = true; this.hud.say(this.def.lines.stencil || []); }
      }
    } else if (e.mode === 'aim') {
      e.vel.set(0, 0, 0);
      e.yaw = angleTo(e.yaw, Math.atan2(e.dash.x, e.dash.z), 14 * dt);
      e.flash = Math.max(e.flash, 0.5 + Math.sin(e.modeT * 30) * 0.4);
      e.group.rotation.z = Math.sin(e.modeT * 40) * 0.08;
      if (e.modeT > 0.7) { to('dash'); e.dashHit = false; this.sfx.rev(); }
    } else if (e.mode === 'dash') {
      const step = 26 * dt, bx = e.pos.x, bz = e.pos.z;
      e.pos.x += e.dash.x * step;
      e.pos.z += e.dash.z * step;
      this.level.collide(e.pos, e.r);
      e.group.rotation.z = 0;
      if (Math.random() < dt * 30) this.burst(e.pos.x, 1.2, e.pos.z, 1, ['#ffffff', '#c9ced6'], 2);
      if (!e.dashHit && dist < e.r + PLAYER_R + 0.4) { e.dashHit = true; this.hurtPlayer(e.def.dmg, e.dash.x, e.dash.z); }
      const blocked = Math.hypot(e.pos.x - bx, e.pos.z - bz) < step * 0.4;
      if (blocked) { to('dizzy'); this.burst(e.pos.x, 2, e.pos.z, 8, ['#ffffff', '#ffd23f'], 4); this.sfx.block(); }
      else if (e.modeT > 0.6) to('recover');
      if (e.mode !== 'dash' && e.tele) { this.scene.remove(e.tele); e.tele = null; }
    } else {
      // dizzy after a wall, or just catching its breath
      e.vel.set(0, 0, 0);
      e.group.rotation.z = Math.sin(e.modeT * (e.mode === 'dizzy' ? 14 : 6)) * (e.mode === 'dizzy' ? 0.25 : 0.06);
      if (e.mode === 'dizzy' && Math.random() < dt * 8) this.burst(e.pos.x, 3.2, e.pos.z, 1, ['#ffd23f'], 1);
      if (e.modeT > (e.mode === 'dizzy' ? 1.4 : 0.6)) { to('sneak'); e.atkCd = 1.4 + Math.random() * 1.2; }
    }
    mat.opacity += (Math.min(1, opacity) - mat.opacity) * Math.min(1, dt * 6);
    mat.depthWrite = mat.opacity > 0.9;
    e.group.rotation.y = e.yaw;
  }

  /**
   * Static: drifts toward Nova, zaps up close, and every couple of seconds blinks
   * out (intangible) and hops to a new spot. Only hittable while it is visible.
   */
  updateStatic(e, dt, dx, dz, dist) {
    const pl = this.player, mat = e.group.userData.material;
    e.modeT += dt;
    e.pos.y = 0.6 + Math.sin(e.t * 3) * 0.25;
    if (e.mode === 'on') {
      e.ghost = false;
      let want = { x: 0, z: 0 };
      if (e.aggro) {
        const los = dist < 15 && this.level.lineOfSight(e.pos.x, e.pos.z, pl.pos.x, pl.pos.z);
        want = los ? { x: dx / dist, z: dz / dist } : this.level.flowDir(e.pos.x, e.pos.z, tmp);
      }
      const k = 1 - Math.exp(-6 * dt);
      e.vel.x += (want.x * e.def.speed - e.vel.x) * k;
      e.vel.z += (want.z * e.def.speed - e.vel.z) * k;
      e.pos.x += e.vel.x * dt;
      e.pos.z += e.vel.z * dt;
      e.yaw = angleTo(e.yaw, Math.atan2(dx, dz), 6 * dt);
      mat.opacity = 0.7 + Math.random() * 0.3;
      e.group.scale.set(1 + (Math.random() - 0.5) * 0.12, 1, 1);
      e.group.children[0].position.x = (Math.random() - 0.5) * 0.15; // jitter the picture, not the robot
      e.atkCd -= dt;
      if (e.aggro && dist < e.r + PLAYER_R + 0.8 && e.atkCd <= 0 && !pl.dead) {
        e.atkCd = 1.1;
        this.hurtPlayer(e.def.dmg, dx / dist, dz / dist, 1);
        this.burst(pl.pos.x, 1.6, pl.pos.z, 8, ['#9dfbff', '#ffffff'], 4);
        this.sfx.zap();
      }
      if (e.modeT > e.onFor && e.aggro) { e.mode = 'out'; e.modeT = 0; this.sfx.crackle(); }
    } else if (e.mode === 'out') {
      // switching off like an old TV
      e.ghost = true;
      const u = Math.min(1, e.modeT / 0.3);
      e.group.scale.set(1 + u * 0.8, Math.max(0.05, 1 - u), 1 + u * 0.8);
      mat.opacity = 1 - u;
      if (u >= 1) {
        for (let tries = 0; tries < 10; tries++) {
          const a = Math.random() * Math.PI * 2, d = 3.5 + Math.random() * 4;
          const x = pl.pos.x + Math.cos(a) * d, z = pl.pos.z + Math.sin(a) * d;
          if (this.level.walkableAt(x, z) && Math.hypot(x - e.pos.x, z - e.pos.z) < 16) { e.pos.x = x; e.pos.z = z; break; }
        }
        e.mode = 'in'; e.modeT = 0;
        this.burst(e.pos.x, 1.5, e.pos.z, 6, ['#ffffff', '#4f545d', '#9dfbff'], 3);
      }
    } else {
      e.ghost = true;
      const u = Math.min(1, e.modeT / 0.3);
      e.group.scale.set(1.8 - u * 0.8, Math.max(0.05, u), 1.8 - u * 0.8);
      mat.opacity = u;
      if (u >= 1) { e.mode = 'on'; e.modeT = 0; e.onFor = 1.2 + Math.random() * 1.2; e.atkCd = Math.min(e.atkCd, 0.4); }
    }
    mat.depthWrite = mat.opacity > 0.9;
    e.group.rotation.y = e.yaw;
  }

  /** A Mopper's mop snaps after enough hits: from then on it's an ordinary robot. */
  breakMop(e) {
    e.bare = true;
    for (const c of [...e.group.children]) if (c !== e.bubble) e.group.remove(c);
    e.group.userData.material?.dispose();
    const fresh = instance(MESH.mopperBare);
    for (const c of [...fresh.children]) e.group.add(c);
    e.group.userData.material = fresh.userData.material;
    this.burst(e.pos.x + Math.sin(e.yaw) * 1.2, 1.2, e.pos.z + Math.cos(e.yaw) * 1.2, 16, ['#c9ced6', '#ffffff', '#8d939c'], 6);
    this.sfx.shatter();
    if (!this.flags.mopBroken) { this.flags.mopBroken = true; this.hud.toast('Mop broken! Now it’s open.'); }
  }

  trap(e, secs, mat = this.trapMat) {
    if (e.type === 'vat' || e.type === 'smudge') return;
    if (e.bubble) e.bubble.material = mat;
    else {
      e.bubble = new THREE.Mesh(this.trapGeo, mat);
      e.bubble.scale.setScalar(e.r * 1.7 + 0.4);
      e.group.add(e.bubble);
    }
    e.trapped = Math.max(e.trapped || 0, secs);
    if (e.type === 'stencil') { e.mode = 'recover'; e.modeT = 0; if (e.tele) { this.scene.remove(e.tele); e.tele = null; } }
  }

  popTrap(e) {
    e.trapped = 0;
    if (e.bubble) { e.group.remove(e.bubble); e.bubble = null; }
    if (e.group.children[0]) e.group.children[0].position.y = 0;
    this.burst(e.pos.x, 1.2, e.pos.z, 8, ['#7fb3ff', '#ffffff'], 4);
  }

  updateVat(e, dt, dist) {
    e.group.scale.y = 1 + Math.max(0, Math.sin(e.t * 9)) * (e.spawnCd < 0.5 ? 0.06 : 0);
    // only Vats near Nova pump (a far-off Vat used to fill the map while she was busy elsewhere)
    if (dist > VAT_RANGE || this.player.dead) return;
    e.spawnCd -= dt;
    if (e.spawnCd <= 0 && e.children < 6) {
      e.spawnCd = 3.2 / this.threat.spawn;
      let type = this.def.vatPattern[e.pattern++ % this.def.vatPattern.length];
      // tough robots linger, so they would slowly take over the Vats' quota: cap them
      if (HEAVY.has(type) && this.enemies.filter((x) => x.type === type).length >= HEAVY_CAP) type = 'drab';
      const a = Math.atan2(this.player.pos.x - e.pos.x, this.player.pos.z - e.pos.z);
      const child = this.spawnEnemy(type, e.pos.x + Math.sin(a) * (e.r + 1.2), e.pos.z + Math.cos(a) * (e.r + 1.2), { aggro: true, fromVat: true, parent: e });
      e.children++;
      child.yaw = a;
      this.burst(child.pos.x, 1, child.pos.z, 6, GREYS, 4);
    }
  }

  updateSmudgeDrab(e, dt, dist) {
    e.wander -= dt;
    if (e.wander <= 0) { e.wander = 1.2 + Math.random(); const a = Math.random() * Math.PI * 2; e.wx = Math.cos(a); e.wz = Math.sin(a); }
    const hx = e.home.x - e.pos.x, hz = e.home.z - e.pos.z, hd = Math.hypot(hx, hz);
    const back = hd > 5;
    e.vel.x = (back ? hx / hd : e.wx) * e.def.speed;
    e.vel.z = (back ? hz / hd : e.wz) * e.def.speed;
    e.pos.x += e.vel.x * dt;
    e.pos.z += e.vel.z * dt;
    e.yaw = angleTo(e.yaw, Math.atan2(e.vel.x, e.vel.z), 4 * dt);
    e.group.rotation.y = e.yaw;
    e.group.rotation.z = Math.sin(e.t * 12) * 0.05;
    if (!this.flags.spotted && dist < 16 && this.level.lineOfSight(e.pos.x, e.pos.z, this.player.pos.x, this.player.pos.z)) {
      this.flags.spotted = true;
      this.hud.say(this.def.lines.spotSmudge || []);
    }
    if (dist < PLAYER_R + e.r + 0.4) this.convertSmudge(e);
  }

  convertSmudge(e) {
    this.removeEnemy(e);
    this.spawnSmudge(e.pos.x, e.pos.z);
    this.burst(e.pos.x, 1.2, e.pos.z, 24, PAINT, 6);
    this.level.splat(e.pos.x, e.pos.z, 1.6, pick(PAINT));
    this.sfx.beep();
    save.data.seen.smudge = true;
    save.write();
    this.hud.say(this.def.lines.smudgeJoins || []);
    this.checkStages();
  }

  updateSmudge(dt) {
    const s = this.smudge;
    if (!s) return;
    s.t += dt;
    const pl = this.player;
    if (this.smudgeTarget) {
      // the finale: Smudge flies off on its own
      const t = this.smudgeTarget, dx = t.x - s.pos.x, dz = t.z - s.pos.z, d = Math.hypot(dx, dz);
      const step = Math.min(d, t.speed * dt);
      if (d > 0.01) { s.pos.x += dx / d * step; s.pos.z += dz / d * step; s.yaw = Math.atan2(dx, dz); }
      s.pos.y += ((t.y ?? 2.1) - s.pos.y) * Math.min(1, dt * 2);
      s.group.rotation.y = s.yaw;
      if (Math.random() < dt * 20) this.burst(s.pos.x, s.pos.y, s.pos.z, 1, PAINT, 2);
      return;
    }
    const tx = pl.pos.x - Math.sin(pl.yaw + 0.9) * 2.2, tz = pl.pos.z - Math.cos(pl.yaw + 0.9) * 2.2;
    const k = 1 - Math.exp(-4 * dt);
    s.pos.x += (tx - s.pos.x) * k;
    s.pos.z += (tz - s.pos.z) * k;
    s.pos.y = 2.1 + Math.sin(s.t * 3) * 0.2;
    s.yaw = angleTo(s.yaw, pl.yaw, 5 * dt);
    s.group.rotation.y = s.yaw;
    // Smudge Zapper upgrade
    if (!this.zapper || this.isHub || pl.dead) return;
    s.zapCd -= dt;
    if (s.zapCd > 0) return;
    let best = null, bd = 13;
    for (const e of this.enemies) {
      const d = Math.hypot(e.pos.x - s.pos.x, e.pos.z - s.pos.z);
      if (d < bd && this.level.lineOfSight(s.pos.x, s.pos.z, e.pos.x, e.pos.z)) { bd = d; best = e; }
    }
    if (!best) return;
    s.zapCd = this.zapper >= 2 ? 0.7 : 1.2;
    const dir = new THREE.Vector3(best.pos.x - s.pos.x, 0, best.pos.z - s.pos.z).normalize();
    s.yaw = Math.atan2(dir.x, dir.z);
    this.addBullet(new THREE.Vector3(s.pos.x, 1.4, s.pos.z), dir, 40, 0.5, 1 * this.power, '#7ef0c8', 'player', this.boltGeo);
    this.sfx.shoot();
  }

  // ------------------------------------------------------------------ night: fireflies

  buildFireflies() {
    const N = 120;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: '#e8ff7a' }), N);
    mesh.frustumCulled = false;
    const flies = [];
    // a few drift freely in the dark; each lantern hides a swarm that wakes when lit
    for (let i = 0; i < 36; i++) {
      const t = pick(this.openTiles.length ? this.openTiles : [{ x: 10, z: 10 }]);
      flies.push({ x: t.x, z: t.z, y: 1 + Math.random() * 3, r: 1 + Math.random() * 3, ph: Math.random() * 9, sp: 0.4 + Math.random() * 0.8, on: 1, owner: null });
    }
    for (const s of this.stations.filter((x) => x.kind === 'lantern')) {
      for (let i = 0; i < 14; i++) flies.push({ x: s.pos.x, z: s.pos.z, y: 1.5 + Math.random() * 4, r: 1.5 + Math.random() * 4.5, ph: Math.random() * 9, sp: 0.6 + Math.random(), on: 0, owner: s });
    }
    this.fireflies = { mesh, flies: flies.slice(0, N), m: new THREE.Matrix4() };
    this.scene.add(mesh);
  }

  wakeFireflies(station) {
    for (const f of this.fireflies?.flies || []) if (f.owner === station) f.on = 0.01;
  }

  updateFireflies(dt) {
    const F = this.fireflies, t = this.stats.time;
    F.flies.forEach((f, i) => {
      if (f.on > 0 && f.on < 1) f.on = Math.min(1, f.on + dt);
      const a = t * f.sp + f.ph;
      const blink = 0.55 + 0.45 * Math.sin(t * 3 + f.ph * 3);
      const sc = f.on * blink;
      F.m.makeScale(sc, sc, sc).setPosition(f.x + Math.cos(a) * f.r, f.y + Math.sin(a * 1.7) * 0.6, f.z + Math.sin(a) * f.r);
      F.mesh.setMatrixAt(i, F.m);
    });
    F.mesh.instanceMatrix.needsUpdate = true;
  }

  /** A particle that flies from (x, z) toward (tx, tz): the vacuum's suction. */
  stream(x, z, tx, tz, color) {
    const p = this.p, i = p.next;
    p.next = (p.next + 1) % this.pN;
    const d = Math.hypot(tx - x, tz - z) || 1, s = 16;
    p.x[i] = x; p.y[i] = 0.6 + Math.random(); p.z[i] = z;
    p.vx[i] = (tx - x) / d * s; p.vz[i] = (tz - z) / d * s; p.vy[i] = 4;
    p.life[i] = p.max[i] = Math.min(1.2, d / s);
    this.pMesh.setColorAt(i, new THREE.Color(color));
    this.pMesh.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ sky docks: whales, wind, nets

  updateWhales(dt) {
    for (const w of this.whales) w.update(dt);
    this.whaleFocusT -= dt;
  }

  whaleHit(b) {
    for (const w of this.whales) {
      if (w.done || w.distTo(b.pos.x, b.pos.z) > w.r) continue;
      w.paint = Math.min(1, w.paint + b.dmg / WHALE_PAINT);
      w.flash = 0.6;
      this.burst(b.pos.x, 1.6, b.pos.z, 2, [b.color, pick(PAINT)], 3);
      this.whaleFocus = w;
      this.whaleFocusT = 1.2;
      this.stats.hits++;
      if (w.paint >= 1) this.finishWhale(w);
      return true;
    }
    return false;
  }

  finishWhale(w) {
    w.done = true;
    this.burst(w.pos.x, 2, w.pos.z, 90, PAINT, 12);
    this.shake = Math.max(this.shake, 0.6);
    this.sfx.chime();
    // a grateful whale shakes Sparks onto the deck
    for (let k = 0; k < 8; k++) {
      const spot = this.spotNear(w.pos, 3, 16);
      if (spot) this.spawnPickup('spark', spot.x + (Math.random() - 0.5) * 2, spot.z + (Math.random() - 0.5) * 2);
    }
    const n = this.whales.filter((x) => x.done).length;
    this.hud.say(this.def.lines[`whales_${n}`] || []);
    this.checkStages();
  }

  /** Squall Deck: gusts shove everything sideways and blow robots off the edge. */
  updateWind(dt) {
    const w = this.wind, cfg = this.def.wind, pl = this.player;
    this.updateWindFx(dt);
    if (this.phase === 'wave' || this.state !== 'play') return;
    if (w.gust > 0) {
      w.gust -= dt;
      if (!pl.dead && !pl.jump) {
        pl.pos.x += w.dir.x * cfg.force * 0.55 * dt;
        pl.pos.z += w.dir.z * cfg.force * 0.55 * dt;
        this.level.collide(pl.pos, PLAYER_R);
      }
      for (const e of [...this.enemies]) {
        if (e.type === 'vat' || e.type === 'smudge') continue;
        const k = e.type === 'mopper' ? 0.4 : 1;
        e.pos.x += w.dir.x * cfg.force * k * dt;
        e.pos.z += w.dir.z * cfg.force * k * dt;
        // pressed against an open edge: collision holds it one radius away, so probe just past that
        if (this.level.tileAt(e.pos.x + w.dir.x * (e.r + 0.35), e.pos.z + w.dir.z * (e.r + 0.35)) === '~') this.blowOverboard(e);
      }
      this.windStreaks(dt * 70);
      if (w.gust <= 0) w.t = cfg.every[0] + Math.random() * (cfg.every[1] - cfg.every[0]);
    } else if (w.warn > 0) {
      w.warn -= dt;
      this.windStreaks(dt * 12);
      if (w.warn <= 0) { w.gust = cfg.dur; this.sfx.gust(); this.shake = Math.max(this.shake, 0.3); }
    } else {
      w.t -= dt;
      if (w.t > 0) return;
      const [x, z] = cfg.dirs[w.n++ % cfg.dirs.length];
      w.dir = { x, z };
      w.warn = 1.5;
      this.hud.toast(`Gust incoming ${WIND_ARROW[`${x},${z}`]}`);
      if (w.n === 1) this.hud.say(this.def.lines.gust || []);
    }
  }

  /** Long white streaks that fly with the gust (their own instanced mesh, so they can stretch). */
  windStreaks(rate) {
    const w = this.wind, pl = this.player;
    if (!w.fx) {
      const N = 140;
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 2.4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }), N);
      mesh.frustumCulled = false;
      w.fx = { mesh, N, next: 0, x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), life: new Float32Array(N), m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), sc: new THREE.Vector3() };
      this.scene.add(mesh);
    }
    const F = w.fx;
    let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    while (n-- > 0) {
      const i = F.next;
      F.next = (F.next + 1) % F.N;
      F.x[i] = pl.pos.x - w.dir.x * 26 + (Math.random() - 0.5) * (w.dir.z ? 60 : 20);
      F.z[i] = pl.pos.z - w.dir.z * 22 + (Math.random() - 0.5) * (w.dir.x ? 44 : 20);
      F.y[i] = 0.6 + Math.random() * 5;
      F.life[i] = 1.4;
    }
  }

  updateWindFx(dt) {
    const F = this.wind.fx, w = this.wind;
    if (!F) return;
    F.q.setFromAxisAngle(F.v.set(0, 1, 0), Math.atan2(w.dir.x, w.dir.z));
    for (let i = 0; i < F.N; i++) {
      if (F.life[i] > 0) {
        F.life[i] -= dt;
        F.x[i] += w.dir.x * 38 * dt;
        F.z[i] += w.dir.z * 38 * dt;
      }
      const s = F.life[i] > 0 ? Math.min(1, F.life[i] * 2) : 0;
      F.m.compose(F.v.set(F.x[i], F.y[i], F.z[i]), F.q, F.sc.set(s, s, s));
      F.mesh.setMatrixAt(i, F.m);
    }
    F.mesh.instanceMatrix.needsUpdate = true;
  }

  blowOverboard(e) {
    const i = this.enemies.indexOf(e);
    if (i < 0) return;
    this.enemies.splice(i, 1);
    if (e.parent) e.parent.children--;
    if (e.tele) { this.scene.remove(e.tele); e.tele = null; }
    this.fallers.push({ group: e.group, vy: 3, spin: (Math.random() - 0.5) * 8, t: 0, dir: { ...this.wind.dir } });
    this.stats.pops++;
    this.burst(e.pos.x, 1.2, e.pos.z, 8, GREYS, 4);
    this.sfx.pop();
    // its Sparks scatter back onto the deck it flew off
    const bx = e.pos.x - this.wind.dir.x * 2.5, bz = e.pos.z - this.wind.dir.z * 2.5;
    for (let k = 0; k < e.def.sparks; k++) this.spawnPickup('spark', bx, bz, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    if (!this.flags.overboard) { this.flags.overboard = true; this.hud.say(this.def.lines.overboard || []); }
  }

  updateFallers(dt) {
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i];
      f.t += dt;
      f.vy -= 22 * dt;
      f.group.position.y += f.vy * dt;
      f.group.position.x += f.dir.x * 6 * dt;
      f.group.position.z += f.dir.z * 6 * dt;
      f.group.rotation.x += f.spin * dt;
      f.group.rotation.z += f.spin * 0.7 * dt;
      if (f.t > 2.2) {
        this.scene.remove(f.group);
        f.group.userData.material?.dispose();
        this.fallers.splice(i, 1);
      }
    }
  }

  /** Caught in a cargo net: Nova can still shoot but cannot move for a moment. */
  snare(secs) {
    const pl = this.player;
    if (pl.dead || pl.shield > 0) return;
    pl.snare = Math.max(pl.snare, secs);
    if (!pl.net) {
      pl.net = instance(MESH.net);
      pl.net.scale.setScalar(0.4);
      pl.net.position.y = 1.4;
      pl.root.add(pl.net);
    }
    pl.net.visible = true;
  }

  // ------------------------------------------------------------------ static wastes: glass, geodes, surges

  hitBreakable(tx, ty, dmg) {
    const b = this.breakables.find((x) => !x.broken && x.tx === tx && x.ty === ty);
    if (!b) return;
    b.hp -= dmg;
    b.flash = 1;
    this.sfx.ping();
    if (b.hp <= 0) this.shatter(b);
  }

  blastBreakables(x, z, R, dmg) {
    for (const b of this.breakables) if (!b.broken && Math.hypot(b.pos.x - x, b.pos.z - z) < R + 2) this.hitBreakable(b.tx, b.ty, dmg);
  }

  shatter(b) {
    b.broken = true;
    this.scene.remove(b.group);
    b.group.userData.material?.dispose();
    this.level.breakTile(b.tx, b.ty);
    this.sfx.shatter();
    this.shake = Math.max(this.shake, 0.4);
    if (b.ch === 'J') {
      // a jar of stolen color: it pours back into the room around it
      this.burst(b.pos.x, 3, b.pos.z, 70, [b.color, '#ffffff', b.color], 11);
      this.level.colorSpot(b.pos.x, b.pos.z, 9);
      for (let k = 0; k < 3; k++) this.level.splat(b.pos.x + (Math.random() - 0.5) * 5, b.pos.z + (Math.random() - 0.5) * 5, 2, b.color);
      this.addSkyBeam(b.pos.x, b.pos.z, b.color, 2.5);
      for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2; this.spawnPickup('spark', b.pos.x, b.pos.z, Math.cos(a) * 5, Math.sin(a) * 5); }
      const n = this.breakables.filter((x) => x.ch === 'J' && x.broken).length;
      this.hud.say(this.def.lines[`jars_${n}`] || []);
      this.checkStages();
    } else if (b.ch === 'O') {
      // a Chroma geode: green light pours out
      this.burst(b.pos.x, 2, b.pos.z, 60, ['#8cff7a', '#b8ff6a', '#ffffff', '#5cc46a'], 10);
      this.level.splat(b.pos.x, b.pos.z, 2.6, '#8cff7a');
      for (let k = 0; k < 5; k++) { const a = Math.random() * Math.PI * 2; this.spawnPickup('spark', b.pos.x, b.pos.z, Math.cos(a) * 5, Math.sin(a) * 5); }
      const n = this.breakables.filter((x) => x.ch === 'O' && x.broken).length;
      this.hud.say(this.def.lines[`geodes_${n}`] || []);
      // the noise wakes up the neighbours
      for (let k = 0; k < 2; k++) {
        const spot = this.spotNear(b.pos, 10, 20);
        if (spot) this.spawnEnemy(k ? 'static' : 'drab', spot.x, spot.z, { aggro: true, fromVat: true });
      }
      this.checkStages();
    } else {
      this.burst(b.pos.x, 2, b.pos.z, 40, ['#ffffff', '#c9d0e0', '#aab3c8', '#e6ecf8'], 8);
    }
  }

  updateBreakables(dt) {
    for (const b of this.breakables) {
      if (b.broken || b.flash <= 0) continue;
      b.flash = Math.max(0, b.flash - dt * 6);
      setFlash(b.group, b.flash);
      b.group.position.x = (b.tx + 0.5) * TILE + (Math.random() - 0.5) * b.flash * 0.2;
    }
  }

  /** A Color Seed tree: Nova heals in its shade. */
  bloomAura(s, dt) {
    const pl = this.player;
    s.group.rotation.y += dt * 0.2;
    if (pl.dead || pl.hp >= this.maxHp || Math.hypot(pl.pos.x - s.pos.x, pl.pos.z - s.pos.z) > 5.5) return;
    pl.hp = Math.min(this.maxHp, pl.hp + dt * 8);
    this.hud.setHealth(pl.hp, this.maxHp);
    if (pl.hp >= 35) this.flags.lowHealth = false;
    if (Math.random() < dt * 8) this.burst(pl.pos.x, 2.5, pl.pos.z, 1, ['#8cff7a', '#ffe066'], 1.5);
  }

  /** Static Storm: surges roll in, close the view down to a few tiles and bring Statics. */
  updateStorm(dt) {
    const st = this.storm, cfg = this.def.storm, fog = this.scene.fog;
    const calm = this.phase === 'wave' || this.stations.filter((x) => x.kind === 'tower').every((x) => x.done);
    if (st.on > 0) {
      st.on -= dt;
      if (calm) st.on = Math.min(st.on, 0.01);
      if (st.on <= 0) { st.t = cfg.every[0] + Math.random() * (cfg.every[1] - cfg.every[0]); this.staticFx.classList.remove('on'); }
    } else if (st.warn > 0) {
      st.warn -= dt;
      if (st.warn <= 0) {
        st.on = cfg.dur;
        this.staticFx.classList.add('on');
        this.sfx.crackle();
        for (let k = 0; k < cfg.spawn; k++) {
          const spot = this.spotNear(this.player.pos, 8, 18);
          if (spot) this.spawnEnemy('static', spot.x, spot.z, { aggro: true, fromVat: true });
        }
        if (!this.flags.surge) { this.flags.surge = true; this.hud.say(this.def.lines.surge || []); }
      }
    } else if (!calm && this.state === 'play') {
      st.t -= dt;
      if (st.t <= 0) { st.warn = 2; this.hud.toast('Static surge incoming!'); this.sfx.crackle(); }
    }
    const target = st.on > 0 ? 1 : 0;
    st.level += (target - st.level) * Math.min(1, dt * 2);
    this.surge = st.level;
    // fog is measured from the camera: keep Nova's surroundings visible, swallow everything further off
    const D = Math.hypot(36, 11) * this.camDist;
    fog.near = this.fogBase.near + (D - 7 - this.fogBase.near) * st.level;
    fog.far = this.fogBase.far + (D + 13 - this.fogBase.far) * st.level;
  }

  // ------------------------------------------------------------------ Pale: archivists, lasers, beams

  /**
   * Archivist: walks up, holds out its jar and steals the ammo of whatever Nova is
   * holding (Sparks if it's the blaster), then runs. Popping it gives everything back.
   */
  updateArchivist(e, dt, dx, dz, dist) {
    const pl = this.player;
    e.modeT += dt;
    e.stealCd -= dt;
    let want = { x: 0, z: 0 }, speed = e.def.speed;
    if (e.mode === 'hunt') {
      if (e.aggro) {
        const los = dist < 14 && this.level.lineOfSight(e.pos.x, e.pos.z, pl.pos.x, pl.pos.z);
        want = los ? { x: dx / dist, z: dz / dist } : this.level.flowDir(e.pos.x, e.pos.z, tmp);
      }
      if (e.aggro && dist < 3.4 && e.stealCd <= 0 && !pl.dead) { e.mode = 'steal'; e.modeT = 0; this.sfx.vacuum(); }
    } else if (e.mode === 'steal') {
      // a tractor stream from Nova into the jar
      if (Math.random() < dt * 30) this.stream(pl.pos.x, pl.pos.z, e.pos.x, e.pos.z, WEAPONS[pl.weapon].color);
      if (dist > 5) { e.mode = 'hunt'; e.modeT = 0; e.stealCd = 0.8; }
      else if (e.modeT > 0.7) this.steal(e);
    } else {
      // fleeing with the goods
      want = dist < 16 ? { x: -dx / dist, z: -dz / dist } : { x: 0, z: 0 };
      speed = 5.4;
      if (e.modeT > 4.5) { e.mode = 'hunt'; e.modeT = 0; e.stealCd = 3; }
    }
    const k = 1 - Math.exp(-8 * dt);
    e.vel.x += (want.x * speed - e.vel.x) * k;
    e.vel.z += (want.z * speed - e.vel.z) * k;
    e.pos.x += e.vel.x * dt;
    e.pos.z += e.vel.z * dt;
    const face = e.mode === 'flee' ? Math.atan2(e.vel.x, e.vel.z) : Math.atan2(dx, dz);
    e.yaw = angleTo(e.yaw, face, 6 * dt);
    e.group.rotation.y = e.yaw;
    e.group.rotation.z = Math.sin(e.t * 9) * 0.04 * Math.min(1, Math.hypot(e.vel.x, e.vel.z) / 2);
    e.atkCd -= dt;
    if (e.aggro && dist < e.r + PLAYER_R + 0.2 && e.atkCd <= 0) { e.atkCd = 1; this.hurtPlayer(e.def.dmg, dx / dist, dz / dist); }
  }

  steal(e) {
    const pl = this.player, id = pl.weapon, have = this.ammoOf(id);
    let text;
    if (id !== 'blaster' && have > 0) {
      const n = Math.max(1, Math.min(have, Math.ceil(have * 0.5)));
      save.data.ammo[id] -= n;
      e.loot.ammo[id] = (e.loot.ammo[id] || 0) + n;
      if (save.data.ammo[id] <= 0) this.selectWeapon('blaster');
      this.syncWeaponHud();
      text = `An Archivist stole ${n} ${WEAPONS[id].name} paint!`;
    } else {
      const n = Math.min(save.data.sparks, 12);
      save.data.sparks -= n;
      e.loot.sparks += n;
      this.hud.setSparks(save.data.sparks);
      text = n ? `An Archivist stole ${n} Sparks!` : 'The Archivist’s jar comes up empty!';
    }
    this.hud.toast(text);
    e.fill.visible = true;
    e.fill.material.color.set(id === 'blaster' ? '#ffe066' : WEAPONS[id].color);
    e.fill.scale.y = Math.min(1, e.fill.scale.y + 0.5);
    e.mode = 'flee'; e.modeT = 0;
    this.sfx.spit();
    if (!this.flags.stolen) { this.flags.stolen = true; this.hud.say(this.def.lines.stolen || []); }
  }

  returnLoot(e) {
    const parts = [];
    for (const [id, n] of Object.entries(e.loot.ammo)) {
      save.data.ammo[id] = (save.data.ammo[id] || 0) + n;
      parts.push(`${n} ${WEAPONS[id].name}`);
    }
    if (e.loot.sparks) { save.data.sparks += e.loot.sparks; this.hud.setSparks(save.data.sparks); parts.push(`${e.loot.sparks} Sparks`); }
    if (!parts.length) return;
    e.loot = { ammo: {}, sparks: 0 };
    this.burst(e.pos.x, 2, e.pos.z, 30, [e.fill.material.color.getStyle(), '#ffffff'], 8);
    this.hud.toast(`Recovered ${parts.join(' + ')}!`);
    this.syncWeaponHud();
  }

  /** A column of light carrying color home to Kittara. */
  addSkyBeam(x, z, color = '#fff3a8', life = Infinity) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 70, 10, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    mesh.position.set(x, 35, z);
    this.scene.add(mesh);
    this.skyBeams.push({ mesh, life, t: 0 });
  }

  updateSkyBeams(dt) {
    for (let i = this.skyBeams.length - 1; i >= 0; i--) {
      const b = this.skyBeams[i];
      b.t += dt;
      b.mesh.scale.x = b.mesh.scale.z = 1 + Math.sin(b.t * 6) * 0.12;
      if (b.t > b.life) {
        b.mesh.material.opacity -= dt * 0.4;
        if (b.mesh.material.opacity <= 0) { this.scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); this.skyBeams.splice(i, 1); }
      }
    }
  }

  /** Security laser: sweeps a red beam around; touching it hurts and trips the alarm. */
  spawnTurret(x, z) {
    const group = instance(MESH.laserTurret);
    group.position.set(x, 0, z);
    this.scene.add(group);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1).translate(0, 0, 0.5), new THREE.MeshBasicMaterial({ color: '#ff3d5e', transparent: true, opacity: 0.85 }));
    beam.position.set(x, 1.6, z);
    this.scene.add(beam);
    this.turrets.push({ group, beam, pos: group.position, angle: Math.random() * Math.PI * 2, speed: (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 0.25), hp: 16, flash: 0, hurtCd: 0, dead: false });
  }

  updateTurrets(dt) {
    const pl = this.player;
    for (const t of this.turrets) {
      if (t.dead) continue;
      t.angle += t.speed * dt;
      t.hurtCd -= dt;
      t.flash = Math.max(0, t.flash - dt * 6);
      setFlash(t.group, t.flash);
      const dx = Math.sin(t.angle), dz = Math.cos(t.angle);
      let len = 1.5;
      while (len < 18 && !this.level.solidAt(t.pos.x + dx * len, t.pos.z + dz * len)) len += 0.5;
      t.beam.scale.z = len;
      t.beam.rotation.y = t.angle;
      t.beam.material.opacity = 0.65 + Math.random() * 0.3;
      if (pl.dead || pl.jump || t.hurtCd > 0) continue;
      const rx = pl.pos.x - t.pos.x, rz = pl.pos.z - t.pos.z, along = rx * dx + rz * dz;
      if (along < 0 || along > len || Math.abs(rx * dz - rz * dx) > 0.35 + PLAYER_R) continue;
      t.hurtCd = 1;
      this.hurtPlayer(12, dz * Math.sign(rx * dz - rz * dx), -dx * Math.sign(rx * dz - rz * dx));
      if ((this.flags.alarmT || 0) < this.stats.time) {
        // the alarm: guards come running
        this.flags.alarmT = this.stats.time + 8;
        this.hud.toast('ALARM! Archivists incoming!');
        this.sfx.beep();
        for (let k = 0; k < 2; k++) {
          const spot = this.spotNear(pl.pos, 9, 18);
          if (spot) this.spawnEnemy(k ? 'drab' : 'archivist', spot.x, spot.z, { aggro: true, fromVat: true });
        }
      }
    }
  }

  hitTurret(x, z, dmg) {
    for (const t of this.turrets) {
      if (t.dead || Math.hypot(x - t.pos.x, z - t.pos.z) > 1.3) continue;
      t.hp -= dmg;
      t.flash = 1;
      this.sfx.hit();
      if (t.hp <= 0) {
        t.dead = true;
        this.scene.remove(t.group, t.beam);
        this.burst(t.pos.x, 1.5, t.pos.z, 30, ['#ff3d5e', '#ffffff', ...GREYS], 7);
        this.sfx.bigPop();
      }
      return true;
    }
    return false;
  }

  /** Rainbow Beam: while held, a piercing beam that hurts everything along it. */
  updateBeam(dt) {
    const pl = this.player;
    this.beamOn -= dt;
    const on = this.beamOn > 0 && !pl.dead && this.state === 'play' && pl.weapon === 'beam';
    this.beamMesh.visible = on;
    if (!on) return;
    const w = WEAPONS.beam, from = this.muzzle(), dx = pl.aim.x, dz = pl.aim.z;
    let len = 0.5;
    while (len < w.range && !this.level.solidAt(from.x + dx * len, from.z + dz * len)) len += 0.4;
    const endX = from.x + dx * len, endZ = from.z + dz * len;
    this.beamMesh.position.copy(from);
    this.beamMesh.rotation.y = Math.atan2(dx, dz);
    this.beamMesh.scale.set(1 + Math.random() * 0.15, 1 + Math.random() * 0.15, len);
    this.beamTex.offset.x = Math.sin(this.stats.time * 9) * 0.04; // a little shimmer
    const dmg = w.dps * this.power * dt;
    for (const e of [...this.enemies]) {
      if (e.ghost) continue;
      const rx = e.pos.x - from.x, rz = e.pos.z - from.z, along = rx * dx + rz * dz;
      if (along < 0 || along > len || Math.abs(rx * dz - rz * dx) > e.r + 0.3) continue;
      this.damageEnemy(e, dmg, { x: dx * 0.1, z: dz * 0.1 });
      if (Math.random() < dt * 20) this.burst(e.pos.x, 1.4, e.pos.z, 1, PAINT, 3);
    }
    // the first boss weak point along the beam, the whales and the end of the beam
    const probe = { pos: new THREE.Vector3(), dmg, color: pick(PAINT), vel: new THREE.Vector3(dx, 0, dz) };
    for (let d = 0.5; d <= len; d += 0.8) {
      probe.pos.set(from.x + dx * d, MUZZLE.y, from.z + dz * d);
      if (this.boss && !this.boss.dead && this.boss.bulletHit(probe)) break;
    }
    for (let d = 0.5; d <= len; d += 1) {
      probe.pos.set(from.x + dx * d, MUZZLE.y, from.z + dz * d);
      if (this.whales.length && this.whaleHit(probe)) break;
      if (this.turrets.length && this.hitTurret(probe.pos.x, probe.pos.z, dmg)) break;
    }
    if (BREAKABLE.has(this.level.tileAt(endX + dx * 0.4, endZ + dz * 0.4))) this.hitBreakable(Math.floor((endX + dx * 0.4) / TILE), Math.floor((endZ + dz * 0.4) / TILE), dmg * 1.5);
    if (Math.random() < dt * 30) this.burst(endX, 1.2, endZ, 1, PAINT, 3);
    if (Math.random() < dt * 8) this.level.splat(endX, endZ, 0.5, pick(PAINT), 2);
  }

  // ------------------------------------------------------------------ NPCs, stations, interaction

  updateNpcs(dt) {
    const pl = this.player;
    for (const n of this.npcs) {
      n.t += dt;
      const dx = pl.pos.x - n.pos.x, dz = pl.pos.z - n.pos.z;
      const target = Math.hypot(dx, dz) < 9 ? Math.atan2(dx, dz) : n.yaw;
      n.group.rotation.y = angleTo(n.group.rotation.y, target, 4 * dt);
      n.group.position.y = (n.def.holo ? 0.4 + Math.sin(n.t * 2) * 0.12 : Math.abs(Math.sin(n.t * 2.4)) * 0.08);
      if (n.def.holo) n.group.children.forEach((c) => { c.material.opacity = 0.6 + Math.sin(n.t * 9) * 0.08; });
    }
  }

  updateStations(dt) {
    const pl = this.player;
    let channel = null;
    for (const s of this.stations) {
      s.t += dt;
      if (s.done) {
        if (s.kind === 'gen') s.group.children[0].rotation.y += dt * 2;
        else if (s.kind === 'tower') s.group.rotation.y += dt * 0.6;
        else if (s.kind === 'mirror') { /* it holds still, aimed at home */ }
        else if (s.kind === 'bloom') this.bloomAura(s, dt);
        else if (s.kind === 'lantern') s.light.intensity += (55 + Math.sin(s.t * 7) * 4 - s.light.intensity) * Math.min(1, dt * 3);
        else s.group.position.y = Math.abs(Math.sin(s.t * 6)) * 0.35;
        continue;
      }
      const d = Math.hypot(pl.pos.x - s.pos.x, pl.pos.z - s.pos.z);
      if (d < 3.6 && !pl.dead) {
        s.progress += dt / STATION[s.kind].time;
        channel = s;
        if (s.light) s.light.intensity = s.progress * 12;
        if (Math.random() < dt * 12) this.burst(s.pos.x, 1.5, s.pos.z, 1, STATION[s.kind].fx, 2);
        if (s.progress >= 1) this.completeStation(s);
      } else {
        s.progress = Math.max(0, s.progress - dt * 0.4);
        if (s.light) s.light.intensity = s.progress * 12;
      }
    }
    if (!channel && this.whaleFocusT > 0 && this.whaleFocus) this.hud.setChannel(this.whaleFocus.done ? null : 'Painting the sky-whale…', this.whaleFocus.paint);
    else this.hud.setChannel(channel && !channel.done ? STATION[channel.kind].label : null, channel ? channel.progress : 0);
  }

  completeStation(s) {
    s.done = true;
    this.scene.remove(s.group);
    const rot = s.group.rotation.y;
    s.group = instance({ gen: MESH.generatorOn, lantern: MESH.lanternOn, bloom: MESH.bloomTree, tower: MESH.towerOn, mirror: MESH.mirrorOn }[s.kind] || NPC[s.look].color);
    s.group.position.copy(s.pos);
    s.group.rotation.y = rot;
    s.pos = s.group.position;
    this.scene.add(s.group);
    this.burst(s.pos.x, 1.5, s.pos.z, 36, PAINT, 7);
    this.level.splat(s.pos.x, s.pos.z, 2.4, pick(PAINT));
    this.sfx.chime();
    if (s.kind === 'bloom') {
      const n = this.stations.filter((x) => x.kind === 'bloom' && x.done).length;
      this.hud.say(this.def.lines[`blooms_${n}`] || []);
      for (let k = 0; k < 6; k++) this.level.splat(s.pos.x + (Math.random() - 0.5) * 6, s.pos.z + (Math.random() - 0.5) * 6, 1.8, pick(['#5cc46a', '#8cff7a', '#ffe066', '#ff8fb1']));
      this.burst(s.pos.x, 3, s.pos.z, 50, ['#8cff7a', '#5cc46a', '#ffe066', '#ff8fb1'], 9);
      for (let k = 0; k < 3; k++) {
        const spot = this.spotNear(s.pos, 12, 22);
        if (spot) this.spawnEnemy(k === 2 ? 'stencil' : 'static', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    } else if (s.kind === 'mirror') {
      const n = this.stations.filter((x) => x.kind === 'mirror' && x.done).length;
      this.hud.say(this.def.lines[`mirrors_${n}`] || []);
      this.addSkyBeam(s.pos.x, s.pos.z);
      this.level.colorSpot(s.pos.x, s.pos.z, 8);
      for (let k = 0; k < 3; k++) {
        const spot = this.spotNear(s.pos, 12, 22);
        if (spot) this.spawnEnemy(k === 2 ? 'archivist' : 'drab', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    } else if (s.kind === 'tower') {
      const n = this.stations.filter((x) => x.kind === 'tower' && x.done).length;
      this.hud.say(this.def.lines[`towers_${n}`] || []);
      this.level.reveal(s.pos.x, s.pos.z, 10);
      // a clean signal pops every Static nearby
      for (const e of [...this.enemies]) if (e.type === 'static' && Math.hypot(e.pos.x - s.pos.x, e.pos.z - s.pos.z) < 16) this.killEnemy(e, true);
      this.burst(s.pos.x, 5, s.pos.z, 40, ['#9dfbff', '#ffd000', '#ffffff'], 10);
      if (this.surge > 0 && this.stations.filter((x) => x.kind === 'tower').every((x) => x.done)) this.storm.on = 0.01;
    } else if (s.kind === 'lantern') {
      const n = this.stations.filter((x) => x.kind === 'lantern' && x.done).length;
      this.hud.say(this.def.lines[`lanterns_${n}`] || []);
      this.level.reveal(s.pos.x, s.pos.z, 7);
      this.wakeFireflies(s);
      for (let k = 0; k < 3; k++) {
        const spot = this.spotNear(s.pos, 12, 22);
        if (spot) this.spawnEnemy(k === 2 ? 'smear' : 'drab', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    } else if (s.kind === 'gen') {
      const n = this.stations.filter((x) => x.kind === 'gen' && x.done).length;
      this.hud.say(this.def.lines[`gens_${n}`] || []);
      // the Greyscale notice: a small ambush
      for (let k = 0; k < 4; k++) {
        const spot = this.spotNear(s.pos, 12, 24);
        if (spot) this.spawnEnemy(k === 3 ? 'fizz' : 'drab', spot.x, spot.z, { aggro: true, fromVat: true });
      }
    } else {
      const n = this.stations.filter((x) => x.kind === 'thaw' && x.done).length;
      this.hud.say(this.def.lines[`rescue_${n}`] || [[this.def.rescueSpeaker || 'Townscat', pick(THAW_LINES)]]);
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * Math.PI * 2;
        this.spawnPickup('spark', s.pos.x, s.pos.z, Math.cos(a) * 4, Math.sin(a) * 4);
      }
    }
    this.checkStages();
  }

  updateInteract() {
    const pl = this.player;
    let best = null, bd = Infinity;
    if (!pl.dead) {
      for (const it of this.interactables) {
        const d = Math.hypot(pl.pos.x - it.pos.x, pl.pos.z - it.pos.z);
        if (d < it.range && d < bd) { bd = d; best = it; }
      }
    }
    this.focus = best;
    this.hud.setPrompt(best ? best.label : null, this.input.touch);
  }

  interact() {
    if (this.focus && this.state === 'play') this.focus.run();
  }

  talkTo(npc) {
    const d = npc.def;
    if (!this.flags[`talked_${d.id}`]) { this.flags[`talked_${d.id}`] = true; this.checkStages(); }
    if (d.action === 'shop') { this.events.action?.('shop'); return; }
    if (d.action === 'pip') {
      const pool = PIP_LINES.filter((p) => p.when(save.data)).flatMap((p) => p.lines);
      this.hud.say([pool[this.pipLine++ % pool.length]]);
      this.sfx.beep();
      return;
    }
    if (!save.data.talked[d.id] && d.reward) {
      save.data.talked[d.id] = true;
      this.hud.say(d.lines);
      const r = d.reward;
      for (const [id, n] of Object.entries(r.items || {})) save.data.items[id] = Math.min(ITEMS[id].max, (save.data.items[id] || 0) + n);
      if (r.sparks) { save.data.sparks += r.sparks; this.hud.setSparks(save.data.sparks); }
      this.syncItemsHud();
      this.hud.toast(d.rewardText);
      this.sfx.heal();
      save.write();
    } else {
      this.hud.say(d.after || d.lines);
    }
  }

  // ------------------------------------------------------------------ damage

  hurtPlayer(dmg, nx = 0, nz = 0, slow = 0) {
    const pl = this.player;
    if (pl.dead || this.state !== 'play' || pl.jump) return;
    if (pl.shield > 0) { this.burst(pl.pos.x, 1.6, pl.pos.z, 3, ['#62f4ff', '#ffffff'], 3); return; }
    pl.hp = Math.max(0, pl.hp - dmg * this.threat.dmg);
    if (this.input.usingTouch && settings.shake) navigator.vibrate?.(dmg >= 12 ? 45 : 20); // Android haptics
    pl.hurtFlash = 1;
    pl.vel.x += nx * 10; pl.vel.z += nz * 10;
    if (slow) pl.slow = Math.max(pl.slow, slow);
    this.shake = Math.max(this.shake, 0.5);
    this.sfx.hurt();
    this.hud.setHealth(pl.hp, this.maxHp);
    this.hud.flashDamage();
    if (pl.hp < 35 && !this.flags.lowHealth && this.def.lines?.lowHealth) { this.flags.lowHealth = true; this.hud.say(this.def.lines.lowHealth); }
    if (pl.hp <= 0) this.killPlayer();
  }

  killPlayer() {
    const pl = this.player;
    pl.dead = true;
    this.burst(pl.pos.x, 1.5, pl.pos.z, 40, ['#f28c28', '#6a4ce4', '#8d939c', '#b9bec6'], 8);
    pl.root.visible = false;
    this.state = 'dead';
    this.sfx.bigPop();
    save.write();
    setTimeout(() => this.events.dead?.(this.stats), 900);
  }

  damageEnemy(e, dmg, dir, trapSecs = 0) {
    if (e.type === 'smudge') { this.convertSmudge(e); return; }
    if (!this.enemies.includes(e)) return;
    if (trapSecs) this.trap(e, trapSecs);
    else if (e.trapped > 0) dmg *= 2; // popping a bubbled robot hits extra hard
    e.hp -= dmg;
    e.flash = 1;
    e.aggro = true;
    if (e.type !== 'vat' && !(e.trapped > 0)) { e.vel.x += dir.x * 3; e.vel.z += dir.z * 3; }
    this.stats.hits++;
    if (e.hp <= 0) this.killEnemy(e, true);
    else this.sfx.hit();
  }

  killEnemy(e, drops) {
    this.removeEnemy(e);
    if (e.loot) this.returnLoot(e);
    const d = e.def;
    const y = e.type === 'fizz' ? 1.5 : 1;
    const big = e.type === 'vat';
    this.burst(e.pos.x, y, e.pos.z, big ? 80 : 18, PAINT, big ? 11 : 7);
    this.burst(e.pos.x, y, e.pos.z, big ? 20 : 4, GREYS, big ? 8 : 5);
    for (let i = 0; i < (big ? 4 : 1); i++) {
      this.level.splat(e.pos.x + (Math.random() - 0.5) * (big ? 4 : 0), e.pos.z + (Math.random() - 0.5) * (big ? 4 : 0), d.splat, pick(PAINT));
    }
    this.stats.pops++;
    if (big) { this.sfx.bigPop(); this.shake = Math.max(this.shake, 1.1); } else this.sfx.pop();
    if (e.parent) e.parent.children--;
    if (e.type === 'smear' && drops) {
      for (const side of [-1, 1]) {
        const m = this.spawnEnemy('smearMini', e.pos.x + side * 0.9, e.pos.z, { aggro: true, fromVat: true });
        m.vel.set(side * 6, 0, (Math.random() - 0.5) * 4);
      }
    }
    if (drops) {
      for (let i = 0; i < d.sparks; i++) {
        const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 3;
        this.spawnPickup('spark', e.pos.x, e.pos.z, Math.cos(a) * s, Math.sin(a) * s);
      }
      if (Math.random() < d.heal) this.spawnPickup('sardine', e.pos.x + 0.5, e.pos.z);
    }
    if (big) {
      const done = this.vatsTotal - this.vats.filter((v) => this.enemies.includes(v)).length;
      if (done < this.vatsTotal) this.hud.say(this.def.lines[`vats_${done}`] || []);
      this.checkStages();
    }
  }

  removeEnemy(e) {
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    this.scene.remove(e.group);
    e.group.userData.material?.dispose();
    if (e.tele) { this.scene.remove(e.tele); e.tele = null; }
    e.group.userData.material?.dispose();
  }

  // ------------------------------------------------------------------ bullets & pickups

  updateBullets(dt) {
    const pl = this.player;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.z += b.vel.z * dt;
      b.life -= dt;
      if (this.wind?.gust > 0) { b.vel.x += this.wind.dir.x * this.def.wind.force * 1.2 * dt; b.vel.z += this.wind.dir.z * this.def.wind.force * 1.2 * dt; }
      let dead = b.life <= 0;
      if (!dead && BREAKABLE.has(this.level.tileAt(b.pos.x, b.pos.z))) {
        // glass and geodes take the hit
        dead = true;
        if (b.owner === 'player') this.hitBreakable(Math.floor(b.pos.x / TILE), Math.floor(b.pos.z / TILE), b.dmg);
        this.burst(b.pos.x, b.pos.y, b.pos.z, 2, ['#ffffff', '#c9d0e0'], 3);
      } else if (!dead && b.bounce > 0 && this.level.solidAt(b.pos.x, b.pos.z) && this.level.tileAt(b.pos.x, b.pos.z) !== 'L') {
        // Ricochet: step back out of the wall and reflect off whichever face we hit
        const px = b.pos.x - b.vel.x * dt, pz = b.pos.z - b.vel.z * dt;
        const hitX = this.level.solidAt(b.pos.x, pz), hitZ = this.level.solidAt(px, b.pos.z);
        if (hitX || !hitZ) b.vel.x *= -1;
        if (hitZ || !hitX) b.vel.z *= -1;
        b.pos.x = px; b.pos.z = pz;
        b.bounce--;
        b.life = Math.max(b.life, 0.4);
        b.mesh.rotation.y = Math.atan2(b.vel.x, b.vel.z);
        this.burst(px, b.pos.y, pz, 3, [b.color, '#ffffff'], 3);
        this.sfx.ping();
      } else if (!dead && this.level.solidAt(b.pos.x, b.pos.z) && this.level.tileAt(b.pos.x, b.pos.z) !== 'L') {
        dead = true;
        const back = b.vel.clone().normalize().multiplyScalar(-0.6);
        this.level.splat(b.pos.x + back.x, b.pos.z + back.z, 0.35, b.color, 3);
        this.burst(b.pos.x + back.x, b.pos.y, b.pos.z + back.z, 2, [b.color], 3);
      }
      if (!dead && b.owner === 'player' && this.boss && !this.boss.dead && this.boss.bulletHit(b)) dead = true;
      if (!dead && b.owner === 'player' && this.whales.length && this.whaleHit(b)) dead = true;
      if (!dead && b.owner === 'player' && this.turrets.length && this.hitTurret(b.pos.x, b.pos.z, b.dmg)) dead = true;
      if (!dead && b.owner === 'player') {
        for (const e of this.enemies) {
          if (e.ghost) continue; // a Static between hops is just noise: shots pass through
          const ex = b.pos.x - e.pos.x, ez = b.pos.z - e.pos.z, rr = e.r + 0.35;
          if (ex * ex + ez * ez > rr * rr) continue;
          dead = true;
          const dir = b.vel.clone().normalize();
          if (e.type === 'mopper' && !e.bare) {
            const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
            if (dir.x * fx + dir.z * fz < -0.55) {
              // the mop soaks it up, but every hit wears it down
              this.burst(b.pos.x, b.pos.y, b.pos.z, 3, ['#ffffff', '#c9ced6'], 4);
              this.sfx.block();
              e.mop = (e.mop ?? MOP_HP) - b.dmg;
              if (e.mop <= 0) this.breakMop(e);
              break;
            }
          }
          this.damageEnemy(e, b.dmg, dir, b.trap);
          this.burst(b.pos.x, b.pos.y, b.pos.z, 2, [b.color], 3);
          break;
        }
      } else if (!dead && b.owner === 'enemy' && !pl.dead) {
        const px = b.pos.x - pl.pos.x, pz = b.pos.z - pl.pos.z;
        if (px * px + pz * pz < 1.0) {
          dead = true;
          const d = b.vel.clone().normalize();
          this.hurtPlayer(b.dmg, d.x * 0.3, d.z * 0.3, 1.6);
          if (b.trap) this.snare(1.2); // the Echo's copied bubbles
          if (pl.shield <= 0) this.level.splat(pl.pos.x, pl.pos.z, 0.7, '#9aa0a8', 4);
        }
      }
      if (dead) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  updatePickups(dt) {
    const pl = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.t += dt; p.age += dt;
      p.pos.x += p.vx * dt; p.pos.z += p.vz * dt;
      p.vx *= Math.exp(-5 * dt); p.vz *= Math.exp(-5 * dt);
      this.level.collide(p.pos, 0.3);
      p.pos.y = 0.35 + Math.sin(p.t * 3) * 0.15;
      p.group.rotation.y += dt * 2;
      if (pl.dead) continue;
      const dx = pl.pos.x - p.pos.x, dz = pl.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (p.kind === 'spark' && d < this.magnet && d > 0.05 && p.age > 0.4) {
        const pull = (1 - d / this.magnet) * 24 * dt;
        p.pos.x += dx / d * pull; p.pos.z += dz / d * pull;
      }
      if (d > 1.4) continue;
      if (p.kind === 'spark') {
        save.data.sparks++;
        this.stats.sparks++;
        this.hud.setSparks(save.data.sparks);
        this.sfx.pickup();
      } else if (p.kind === 'sardine') {
        if (pl.hp >= this.maxHp) {
          if (save.data.items.sardine >= ITEMS.sardine.max) continue;
          save.data.items.sardine++;
          this.syncItemsHud();
          this.hud.toast('+1 Sardine Tin');
        } else {
          pl.hp = Math.min(this.maxHp, pl.hp + 35);
          this.hud.setHealth(pl.hp, this.maxHp);
          this.hud.toast('+35 health');
          if (pl.hp >= 35) this.flags.lowHealth = false;
        }
        this.sfx.heal();
      } else if (p.kind === 'seed') {
        const list = (save.data.seeds[this.def.id] ||= []);
        if (!list.includes(p.idx)) list.push(p.idx);
        this.stats.seeds++;
        this.hud.setSeeds(list.length, 3);
        this.hud.toast(`Color Seed found! (${list.length}/3)`);
        this.burst(p.pos.x, 1, p.pos.z, 20, ['#8cff7a', '#ffe066'], 5);
        this.sfx.chime();
        save.write();
      } else if (p.kind === 'weapon') {
        const w = WEAPONS[p.weapon];
        const isNew = !save.data.weapons[p.weapon];
        save.data.weapons[p.weapon] = true;
        save.data.ammo[p.weapon] = (save.data.ammo[p.weapon] || 0) + w.ammoPack + 10;
        this.selectWeapon(p.weapon);
        this.hud.toast(`${w.name} +${w.ammoPack + 10}`);
        this.sfx.heal();
        if (isNew) this.hud.say([['Nova', `Grandpa's ${w.name}! Now we're talking. (Q to swap)`]]);
        save.write();
      }
      this.scene.remove(p.group);
      p.group.userData.material?.dispose();
      this.pickups.splice(i, 1);
    }
  }

  updateParticles(dt) {
    const p = this.p, m = this.pMat;
    for (let i = 0; i < this.pN; i++) {
      if (p.life[i] <= 0) { m.makeScale(0, 0, 0); this.pMesh.setMatrixAt(i, m); continue; }
      p.life[i] -= dt;
      p.vy[i] -= this.gravity * dt;
      p.x[i] += p.vx[i] * dt; p.y[i] += p.vy[i] * dt; p.z[i] += p.vz[i] * dt;
      if (p.y[i] < 0.13) { p.y[i] = 0.13; p.vy[i] *= -0.35; p.vx[i] *= 0.6; p.vz[i] *= 0.6; }
      const s = Math.max(0, Math.min(1, (p.life[i] / p.max[i]) * 2.5));
      m.makeScale(s, s, s).setPosition(p.x[i], p.y[i], p.z[i]);
      this.pMesh.setMatrixAt(i, m);
    }
    this.pMesh.instanceMatrix.needsUpdate = true;
  }

  // ------------------------------------------------------------------ mission

  taskCount(type) {
    if (type === 'smudge') return { done: this.smudge ? 1 : 0, total: 1 };
    if (type === 'vats') return { done: this.vatsTotal - this.vats.filter((v) => this.enemies.includes(v)).length, total: this.vatsTotal };
    if (type === 'boss') return this.boss ? this.boss.progress() : { done: 0, total: 1 };
    if (type === 'talk') return { done: this.flags[`talked_${this.def.talkTarget}`] ? 1 : 0, total: 1 };
    if (type === 'murals') return { done: this.murals.filter((m) => m.read).length, total: this.murals.length };
    if (type === 'whales') return { done: this.whales.filter((w) => w.done).length, total: this.whales.length };
    if (type === 'jars') { const g = this.breakables.filter((b) => b.ch === 'J'); return { done: g.filter((b) => b.broken).length, total: g.length }; }
    if (type === 'geodes') { const g = this.breakables.filter((b) => b.ch === 'O'); return { done: g.filter((b) => b.broken).length, total: g.length }; }
    const kind = { generators: 'gen', lanterns: 'lantern', blooms: 'bloom', towers: 'tower', mirrors: 'mirror' }[type] || 'thaw';
    const list = this.stations.filter((s) => s.kind === kind);
    return { done: list.filter((s) => s.done).length, total: list.length };
  }

  checkStages(silent = false) {
    if (this.phase !== 'stages') { this.updateObjective(); return; }
    const stages = this.def.stages;
    while (this.stageIdx < stages.length && stages[this.stageIdx].tasks.every((t) => { const c = this.taskCount(t); return c.done >= c.total; })) this.stageIdx++;
    if (this.stageIdx >= stages.length) {
      if (!this.beacon) { this.phase = 'cleared'; this.updateObjective(); return; }
      this.phase = 'beacon';
      for (const t of this.level.openBarrier()) this.burst(t.x, 1.5, t.z, 5, ['#f4f7ff', ...PAINT], 5);
      this.scene.remove(this.level.barrier);
      if (!silent) this.hud.say(this.def.lines.stageClear || []);
    }
    this.updateObjective();
  }

  updateObjective() {
    if (this.isHub) {
      this.hud.setObjectives([
        ["Shop at Grandpa's hologram", false],
        ['Use the map table or the door to pick a mission', false],
      ]);
      return;
    }
    let obj;
    if (this.phase === 'stages') {
      obj = this.def.stages[this.stageIdx].tasks.map((t) => {
        const c = this.taskCount(t);
        const text = t === 'talk' ? this.def.talkLabel : t === 'boss' ? this.boss.taskText(c.done, c.total) : TASK_TEXT[t](c.done, c.total, this.def);
        return [text, c.done >= c.total];
      });
    } else if (this.phase === 'beacon') obj = [[`Reach the ${this.def.beaconName}`, false]];
    else if (this.phase === 'defend') obj = [[`Defend the ${this.def.beaconName} while it charges`, false]];
    else if (!this.beacon) { const c = this.boss.progress(); obj = [[this.boss.taskText(c.total, c.total), true]]; }
    else obj = [[`Light the ${this.def.beaconName}`, true]];
    this.hud.setObjectives(obj);
  }

  updateMission(dt) {
    const pl = this.player, b = this.beacon;
    if (b && this.phase === 'beacon' && Math.hypot(pl.pos.x - b.pos.x, pl.pos.z - b.pos.z) < 7) {
      this.phase = 'defend';
      this.defendSpawn = 1.5;
      this.hud.say(this.def.lines.beaconStart || []);
      this.sfx.beep();
      this.updateObjective();
    }
    if (b && this.phase === 'defend') {
      b.charge = Math.min(1, b.charge + dt / this.def.beaconChargeTime);
      b.group.rotation.y += dt * (0.5 + b.charge * 3);
      this.hud.setCharge(b.charge);
      this.defendSpawn -= dt;
      if (this.defendSpawn <= 0 && this.enemies.length < 45) {
        this.defendSpawn = Math.max(0.45, 1.3 - b.charge * 0.9) / this.threat.spawn;
        const spot = this.farSpot();
        if (spot) {
          const r = Math.random();
          const type = this.def.defendPool ? pick(this.def.defendPool) : r < 0.68 ? 'drab' : r < 0.84 ? 'fizz' : 'mopper';
          const e = this.spawnEnemy(type, spot.x, spot.z, { aggro: true, fromVat: true });
          this.burst(e.pos.x, 1, e.pos.z, 6, GREYS, 4);
        }
      }
      if (b.charge >= 1) this.startWave();
    }
    if (this.phase === 'wave') {
      const c = this.waveCenter;
      this.waveR += dt * 26;
      this.level.colorWave(c.x, c.z, this.waveR);
      for (const e of [...this.enemies]) {
        if (Math.hypot(e.pos.x - c.x, e.pos.z - c.z) < this.waveR) this.killEnemy(e, false);
      }
      for (const s of this.stations) if (!s.done && Math.hypot(s.pos.x - c.x, s.pos.z - c.z) < this.waveR) this.completeStation(s);
      if (this.beam) this.beam.scale.x = this.beam.scale.z = 1 + Math.sin(this.stats.time * 8) * 0.1;
      if (this.bgTo) {
        const k = Math.min(1, dt * 0.5);
        this.scene.background.lerp(this.bgTo, k);
        this.scene.fog.color.lerp(this.bgTo, k);
        if (this.level.rift) this.level.rift.material.opacity *= 1 - k;
      }
      if (this.dark) {
        // the wave brings the sunrise
        const k = Math.min(1, dt * 0.6);
        this.hemi.intensity += (this.dayLight.hemi - this.hemi.intensity) * k;
        this.sun.intensity += (this.dayLight.sun - this.sun.intensity) * k;
        this.sun.color.lerp(new THREE.Color('#d8fff4'), k);
        this.scene.background.lerp(new THREE.Color('#0b2424'), k);
      }
      if (this.waveR > Math.hypot(this.level.width, this.level.depth) + 10 && this.state === 'play') this.finishLevel();
    }
  }

  finishLevel() {
    this.state = 'complete';
    this.hud.setCharge(null);
    const id = this.def.id, prev = save.data.cleared[id];
    this.stats.firstClear = !prev;
    if (!prev || this.stats.time < prev.time) save.data.cleared[id] = { time: this.stats.time, pops: this.stats.pops };
    save.write();
    setTimeout(() => this.events.complete?.(this.stats), 600);
  }

  spotNear(pos, min, max) {
    for (let tries = 0; tries < 30; tries++) {
      const t = pick(this.openTiles), d = Math.hypot(t.x - pos.x, t.z - pos.z);
      if (d > min && d < max) return t;
    }
    return null;
  }

  farSpot() {
    const b = this.beacon, pl = this.player;
    for (let tries = 0; tries < 20; tries++) {
      const t = pick(this.openTiles);
      const db = Math.hypot(t.x - b.pos.x, t.z - b.pos.z), dp = Math.hypot(t.x - pl.pos.x, t.z - pl.pos.z);
      if (db > 24 && db < 64 && dp > 20) return t;
    }
    return null;
  }

  startWave(center) {
    const b = this.beacon;
    this.phase = 'wave';
    this.waveR = 0;
    this.sky?.colorize();
    for (const w of this.whales) w.paint = 1;
    if (!b) {
      this.waveCenter = { x: center.x, z: center.z };
      this.sfx.chime();
      this.updateObjective();
      return;
    }
    this.waveCenter = { x: b.pos.x, z: b.pos.z };
    this.scene.remove(b.group);
    b.group = instance(MESH.beaconOn);
    b.group.position.copy(b.pos);
    b.pos = b.group.position;
    this.scene.add(b.group);
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.6, 80, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffe8ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.beam.position.set(b.pos.x, 40, b.pos.z);
    this.scene.add(this.beam);
    this.burst(b.pos.x, 4, b.pos.z, 120, PAINT, 14);
    this.shake = 1.2;
    this.sfx.chime();
    this.hud.say(this.def.lines.beaconDone || []);
    this.hud.setCharge(1);
    this.updateObjective();
  }

  // ------------------------------------------------------------------ camera

  resize() {
    const aspect = innerWidth / innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.camDist = (aspect < 1 ? 1.4 : aspect < 1.4 ? 1.15 : 1) * (this.isHub ? 0.9 : 1);
  }

  updateCamera(dt) {
    const pl = this.player;
    const lead = this.input.usingTouch || this.isHub ? 1.5 : 3;
    const tx = pl.pos.x + pl.aim.x * lead, tz = pl.pos.z + pl.aim.z * lead;
    const k = 1 - Math.exp(-5 * dt);
    this.camTarget.x += (tx - this.camTarget.x) * k;
    this.camTarget.z += (tz - this.camTarget.z) * k;
    const hh = 36 * this.camDist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)), hw = hh * this.camera.aspect;
    const W = this.level.width, Dp = this.level.depth;
    this.camTarget.x = W > hw * 2 ? Math.min(W - hw, Math.max(hw, this.camTarget.x)) : W / 2;
    this.camTarget.z = Dp > hh * 2 ? Math.min(Dp - hh * 1.15, Math.max(hh * 0.85, this.camTarget.z)) : Dp / 2;
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const shake = settings.shake ? this.shake : 0;
    const sx = (Math.random() - 0.5) * shake, sz = (Math.random() - 0.5) * shake;
    const D = this.camDist;
    this.camera.position.set(this.camTarget.x + sx, 36 * D, this.camTarget.z + 11 * D + sz);
    this.camera.lookAt(this.camTarget.x + sx, 0, this.camTarget.z + sz);
    this.sun.position.set(pl.pos.x - 18, 45, pl.pos.z + 22);
    this.sun.target.position.set(pl.pos.x, 0, pl.pos.z);
  }

  render() {
    if (this.scene) this.renderer.render(this.scene, this.camera);
  }
}
