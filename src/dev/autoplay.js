/**
 * Dev-only balance harness: a simple bot plays levels at accelerated speed and reports
 * deaths, damage taken (by source), time and Sparks. Not imported by the game.
 *
 * From the browser console (dev server):
 *   const { balance } = await import('/src/dev/autoplay.js');
 *   await balance(['1-1', '1-2']);          // one run each, prints a table
 *
 * The bot is deliberately ordinary: it walks to objectives, shoots the nearest threat,
 * backs off from melee, heals at low health and uses the Splatter on crowds. A careful
 * human should do better, so treat its numbers as "a so-so player", and compare levels
 * against each other rather than reading them as absolutes.
 */
import { SOLID, BREAKABLE, TILE } from '../level.js';
import { SB } from '../models.js';
import { save } from '../save.js';

const DT = 1 / 60;

/** The loadout a player has typically bought by each world (upgrades, weapons, ammo). */
export const PAR = {
  1: { upgrades: {}, weapons: [], items: { sardine: 1, bomb: 0, shield: 0 } },
  2: { upgrades: { armor: 1, power: 1 }, weapons: ['splatter'], items: { sardine: 2, bomb: 1, shield: 0 } },
  3: { upgrades: { armor: 2, power: 1, speed: 1, magnet: 1 }, weapons: ['splatter', 'bubble'], items: { sardine: 2, bomb: 1, shield: 1 } },
  4: { upgrades: { armor: 2, power: 2, speed: 1, magnet: 1, zapper: 1 }, weapons: ['splatter', 'bubble', 'ricochet'], items: { sardine: 3, bomb: 1, shield: 1 } },
  5: { upgrades: { armor: 3, power: 2, speed: 2, magnet: 2, zapper: 1 }, weapons: ['splatter', 'bubble', 'ricochet', 'mortar'], items: { sardine: 3, bomb: 2, shield: 1 } },
};

const walkable = (ch) => !SOLID.has(ch) && ch !== '~';

class Bot {
  constructor(game) {
    this.g = game;
    this.mv = { x: 0, z: 0 };
    this.aim = null;
    this.fire = false;
    this.press = new Set();
    this.path = null;
    this.pathT = 0;
    this.goalKey = '';
    this.side = 1;
  }

  // ------------------------------------------------------------ geometry helpers

  tileOf(x, z) { return [Math.floor(x / TILE), Math.floor(z / TILE)]; }
  center(tx, ty) { return { x: (tx + 0.5) * TILE, z: (ty + 0.5) * TILE }; }

  /** Nearest walkable tile to a world point (for targets over sky, water or solid props). */
  standNear(x, z, minD = 0) {
    const lv = this.g.level, [cx, cy] = this.tileOf(x, z);
    let best = null, bd = Infinity;
    for (let r = 0; r < 8 && !best; r++) {
      for (let ty = cy - r; ty <= cy + r; ty++) for (let tx = cx - r; tx <= cx + r; tx++) {
        if (!walkable(lv.grid[ty]?.[tx] ?? '#')) continue;
        const c = this.center(tx, ty), d = Math.hypot(c.x - x, c.z - z);
        if (d >= minD && d < bd) { bd = d; best = c; }
      }
    }
    return best;
  }

  /** BFS over tiles (glass panes count as passable: the bot shoots through them; vents jump). */
  bfs(goal) {
    const lv = this.g.level, pl = this.g.player;
    const [sx, sy] = this.tileOf(pl.pos.x, pl.pos.z), [gx, gy] = this.tileOf(goal.x, goal.z);
    const W = lv.w, H = lv.h, inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    if (!inside(sx, sy) || !inside(gx, gy)) return null;
    const prev = new Int32Array(W * H).fill(-1), q = [sy * W + sx];
    prev[sy * W + sx] = sy * W + sx;
    const pass = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (walkable(lv.grid[y][x]) || lv.grid[y][x] === 'G');
    while (q.length) {
      const i = q.shift(), x = i % W, y = (i / W) | 0;
      if (x === gx && y === gy) break;
      const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]);
      if (lv.grid[y][x] === 'M') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (const d of [3, 4, 5, 2, 6]) if (pass(x + dx * d, y + dy * d) && lv.grid[y + dy * d][x + dx * d] !== 'G') { nbs.push([x + dx * d, y + dy * d]); break; }
      }
      for (const [nx, ny] of nbs) {
        if (!pass(nx, ny) || prev[ny * W + nx] !== -1) continue;
        prev[ny * W + nx] = i;
        q.push(ny * W + nx);
      }
    }
    if (prev[gy * W + gx] === -1) return null;
    const path = [];
    for (let i = gy * W + gx; i !== sy * W + sx; i = prev[i]) path.push(i);
    return path.reverse().map((i) => ({ tx: i % W, ty: (i / W) | 0 }));
  }

  // ------------------------------------------------------------ what to do next

  /** Returns { goal: {x,z}, shoot: {x,z} | null, press: code | null, stay: radius }. */
  plan() {
    const g = this.g, pl = g.player, def = g.def;
    if (g.phase === 'wave' || g.phase === 'cleared') return { goal: null };
    if (g.boss && !g.boss.dead) return this.bossPlan();
    if (g.phase === 'beacon' || g.phase === 'defend') return { goal: g.beacon.pos, stay: 4 };
    const tasks = def.stages[g.stageIdx].tasks.filter((t) => { const c = g.taskCount(t); return c.done < c.total; });
    const options = [];
    const add = (pos, extra) => options.push({ pos, d: Math.hypot(pos.x - pl.pos.x, pos.z - pl.pos.z), ...extra });
    for (const t of tasks) {
      if (t === 'smudge') { const s = g.enemies.find((e) => e.type === 'smudge'); if (s) add(s.pos, {}); }
      if (t === 'talk') { const n = g.npcs.find((x) => x.def.id === def.talkTarget); if (n) add(n.pos, { press: 'KeyE', reach: 2.5 }); }
      if (t === 'vats') for (const v of g.vats) if (g.enemies.includes(v)) add(v.pos, { shoot: v.pos, stand: 6 });
      if (t === 'murals') for (const m of g.murals) if (!m.read) add({ x: m.pos.x, z: m.pos.z + 2 }, { press: 'KeyE', reach: 2.5 });
      if (t === 'whales') for (const w of g.whales) if (!w.done) add(w.pos, { shoot: w.pos, stand: 3 });
      if (t === 'jars' || t === 'geodes') for (const b of g.breakables) if (!b.broken && b.ch === (t === 'jars' ? 'J' : 'O')) add(b.pos, { shoot: b.pos, stand: 5 });
      const kind = { generators: 'gen', rescue: 'thaw', lanterns: 'lantern', blooms: 'bloom', towers: 'tower', mirrors: 'mirror' }[t];
      if (kind) for (const s of g.stations) if (s.kind === kind && !s.done) add(s.pos, { reach: 2.4 });
    }
    if (!options.length) return { goal: null };
    // stick with the current target unless another is much closer
    options.sort((a, b) => a.d - b.d);
    const o = options.find((x) => `${Math.round(x.pos.x)},${Math.round(x.pos.z)}` === this.goalKey && x.d < options[0].d + 12) || options[0];
    this.goalKey = `${Math.round(o.pos.x)},${Math.round(o.pos.z)}`;
    const goal = o.stand ? this.standNear(o.pos.x, o.pos.z, 0) : o.pos;
    return { goal, shoot: o.shoot && o.d < 18 ? o.shoot : null, press: o.d < (o.reach || 2) ? o.press : null, stay: o.reach || o.stand || 1 };
  }

  bossPlan() {
    const g = this.g, b = g.boss, pl = g.player;
    const name = b.constructor.name;
    // keep about r from it by circling (never parking in a corner)
    const away = (from, r) => {
      const a = Math.atan2(pl.pos.z - from.z, pl.pos.x - from.x);
      for (let k = 0; k < 2; k++) {
        const t = a + 0.7 * this.side, x = from.x + Math.cos(t) * r, z = from.z + Math.sin(t) * r;
        if (walkable(g.level.tileAt(x, z))) return { x, z };
        this.side *= -1;
      }
      return this.standNear(from.x + Math.cos(a) * r, from.z + Math.sin(a) * r) || pl.pos;
    };
    if (name === 'StreetSweeper') {
      const t = b.tanks.find((x) => x.alive);
      const shoot = t ? b.local(t.local.x * SB, t.local.z * SB) : b.pos;
      // stunned: run round the back and unload into the tanks
      if (b.state === 'stunned') { const behind = b.local(0, -7); return { goal: this.standNear(behind.x, behind.z), shoot, stay: 2 }; }
      // charging: get off its line, sideways
      if (b.state === 'windup' || b.state === 'charge') { const side = b.local(this.side * 12, 0); return { goal: this.standNear(side.x, side.z), shoot, stay: 2 }; }
      // otherwise keep well away (and near something hard it might run into)
      return { goal: away(b.pos, 13), shoot, stay: 3 };
    }
    if (name === 'WeedWhacker') {
      const danger = b.state === 'spinWind' || b.state === 'spin';
      return { goal: away(b.pos, danger ? b.reach + 4 : 11), shoot: b.pos, stay: 2 };
    }
    if (name === 'NetTrawler') {
      const e = b.engines.find((x) => x.hp > 0);
      const p = e ? b.enginePos(e) : b.pos;
      return { goal: this.standNear(p.x, p.z), shoot: p, stay: 5 };
    }
    if (name === 'Echo') return { goal: away(b.pos, 10), shoot: b.ghost ? null : b.pos, stay: 3 };
    if (name === 'Curator') {
      if (b.stage === 0) {
        const j = b.aliveJars.sort((a, c) => Math.hypot(a.pos.x - pl.pos.x, a.pos.z - pl.pos.z) - Math.hypot(c.pos.x - pl.pos.x, c.pos.z - pl.pos.z))[0];
        return { goal: j ? away(j.pos, 6) : null, shoot: j ? j.pos : null, stay: 3 };
      }
      if (b.stage === 1) return { goal: away(b.center, 9), shoot: b.center, stay: 3 };
      return { goal: away(b.center, 16), shoot: null, stay: 1 }; // hold on: run from the pull
    }
    return { goal: away(b.pos, 10), shoot: b.pos, stay: 3 };
  }

  // ------------------------------------------------------------ one frame of decisions

  think() {
    const g = this.g, pl = g.player, lv = g.level;
    this.press.clear();
    this.fire = false;
    const p = this.plan();
    // threats: the nearest enemy we can see, and anything in our face
    let near = null, nd = Infinity, crowd = 0, melee = null, md = Infinity;
    for (const e of g.enemies) {
      if (e.type === 'vat' || e.type === 'smudge' || e.ghost) continue;
      const d = Math.hypot(e.pos.x - pl.pos.x, e.pos.z - pl.pos.z);
      if (d < 7) crowd++;
      if (d < md && e.type !== 'fizz') { md = d; melee = e; }
      // a Mopper facing us is a wall: shoot something else and work around to its back
      const shielded = e.type === 'mopper' && !e.bare && (Math.sin(e.yaw) * (pl.pos.x - e.pos.x) + Math.cos(e.yaw) * (pl.pos.z - e.pos.z)) / (d || 1) > 0.5;
      const score = d + (shielded ? 14 : 0) - (e.trapped > 0 ? 3 : 0);
      if (score < nd && d < 20 && lv.lineOfSight(pl.pos.x, pl.pos.z, e.pos.x, e.pos.z)) { nd = score; near = e; }
    }
    // aim: the objective when it's safe-ish, otherwise the closest threat
    let target = null;
    // a spawner in reach takes priority unless something is right on top of us
    const spawnerClose = p.shoot && g.vats.some((v) => v.pos === p.shoot) && Math.hypot(p.shoot.x - pl.pos.x, p.shoot.z - pl.pos.z) < 14;
    if (p.shoot && (!near || nd > 6 || (spawnerClose && md > 3))) target = p.shoot;
    else if (near) target = near.pos;
    else if (p.shoot) target = p.shoot;
    // walk the path toward the goal
    let mv = { x: 0, z: 0 };
    if (p.goal) {
      const key = `${Math.round(p.goal.x)},${Math.round(p.goal.z)}`;
      this.pathT -= DT;
      if (!this.path || this.pathT <= 0 || key !== this.pathKey) { this.path = this.bfs(p.goal); this.pathT = 0.3; this.pathKey = key; }
      const dGoal = Math.hypot(p.goal.x - pl.pos.x, p.goal.z - pl.pos.z);
      if (dGoal > (p.stay || 1)) {
        let step = this.path?.[0];
        if (step && step.tx === Math.floor(pl.pos.x / TILE) && step.ty === Math.floor(pl.pos.z / TILE)) { this.path.shift(); step = this.path[0]; }
        const c = step ? this.center(step.tx, step.ty) : p.goal;
        if (step && BREAKABLE.has(lv.grid[step.ty][step.tx])) target = c; // shoot the glass in the way
        const dx = c.x - pl.pos.x, dz = c.z - pl.pos.z, d = Math.hypot(dx, dz) || 1;
        mv = { x: dx / d, z: dz / d };
      }
    }
    // fight before walking on: hold ground while robots are close, back off (and strafe)
    // from anything about to reach us, prefer backing away along open floor
    if (melee && md < 7.5 && !g.noFire) {
      const ax = pl.pos.x - melee.pos.x, az = pl.pos.z - melee.pos.z, a = Math.hypot(ax, az) || 1;
      // Moppers: circle them (to reach the unshielded back) instead of backing straight off
      const circle = melee.type === 'mopper' ? 1.1 : 0.35;
      const urgency = md < 4 ? 1 : melee.type === 'mopper' ? 0.15 : 0.45;
      let bx = ax / a * urgency - az / a * circle * this.side, bz = az / a * urgency + ax / a * circle * this.side;
      // backed into a wall or the sky: take whichever open direction gets furthest from it
      if (!walkable(lv.tileAt(pl.pos.x + bx * 2.5, pl.pos.z + bz * 2.5))) {
        let best = -Infinity;
        for (let k = 0; k < 16; k++) {
          const t = (k / 16) * Math.PI * 2, dx = Math.cos(t), dz = Math.sin(t);
          if (!walkable(lv.tileAt(pl.pos.x + dx * 2.5, pl.pos.z + dz * 2.5))) continue;
          const score = Math.hypot(pl.pos.x + dx * 2 - melee.pos.x, pl.pos.z + dz * 2 - melee.pos.z);
          if (score > best) { best = score; bx = dx; bz = dz; }
        }
      }
      mv = { x: mv.x * 0.15 + bx, z: mv.z * 0.15 + bz };
    }
    // sidestep a Stencil's red line
    for (const e of g.enemies) {
      if (e.type !== 'stencil' || e.mode !== 'aim' || !e.dash) continue;
      const rx = pl.pos.x - e.pos.x, rz = pl.pos.z - e.pos.z, side = rx * e.dash.z - rz * e.dash.x;
      if (Math.abs(side) < 1.8 && rx * e.dash.x + rz * e.dash.z > 0) mv = { x: e.dash.z * Math.sign(side || 1), z: -e.dash.x * Math.sign(side || 1) };
    }
    // two or more Moppers closing in: they're slow, so lead them away instead of trading hits
    const moppers = g.enemies.filter((e) => e.type === 'mopper' && !e.bare && Math.hypot(e.pos.x - pl.pos.x, e.pos.z - pl.pos.z) < 6);
    if (moppers.length >= 2) {
      const cx = moppers.reduce((n, e) => n + e.pos.x, 0) / moppers.length, cz = moppers.reduce((n, e) => n + e.pos.z, 0) / moppers.length;
      let best = -Infinity;
      for (let k = 0; k < 16; k++) {
        const t = (k / 16) * Math.PI * 2, dx = Math.cos(t), dz = Math.sin(t);
        if (!walkable(lv.tileAt(pl.pos.x + dx * 3, pl.pos.z + dz * 3))) continue;
        const score = Math.hypot(pl.pos.x + dx * 3 - cx, pl.pos.z + dz * 3 - cz);
        if (score > best) { best = score; mv = { x: dx, z: dz }; }
      }
      if (moppers.length >= 3 && save.data.items.bomb > 0) this.press.add('KeyG');
    }
    // stuck against something (a Vat, a generator, a crowd)? try a fresh direction for a moment
    this.stuckT = (this.stuckT || 0) + DT;
    if (this.stuckT > 0.6) {
      const moved = this.last ? Math.hypot(pl.pos.x - this.last.x, pl.pos.z - this.last.z) : 9;
      this.last = { x: pl.pos.x, z: pl.pos.z };
      this.stuckT = 0;
      if (moved < 0.5 && Math.hypot(mv.x, mv.z) > 0.3 && !pl.snare) {
        const t = Math.random() * Math.PI * 2;
        this.unstick = { t: 0.7, x: Math.cos(t), z: Math.sin(t) };
      }
    }
    if (this.unstick && this.unstick.t > 0) { this.unstick.t -= DT; mv = { x: this.unstick.x, z: this.unstick.z }; }
    const ml = Math.hypot(mv.x, mv.z);
    this.mv = ml > 0.01 ? { x: mv.x / ml, z: mv.z / ml } : { x: 0, z: 0 };
    if (target) {
      const dx = target.x - pl.pos.x, dz = target.z - pl.pos.z, d = Math.hypot(dx, dz) || 1;
      this.aim = { x: dx / d, z: dz / d };
      this.fire = d < 24;
    } else this.aim = null;
    if (p.press) this.press.add(p.press);
    // items and weapons
    const hpf = pl.hp / g.maxHp;
    if (hpf < 0.4 && save.data.items.sardine > 0) this.press.add('KeyH');
    if (hpf < 0.25 && crowd >= 3 && save.data.items.shield > 0 && pl.shield <= 0) this.press.add('KeyB');
    if (crowd >= 6 && save.data.items.bomb > 0) this.press.add('KeyG');
    const want = crowd >= 3 && g.ammoOf('splatter') > 0 && md < 7 ? 'splatter' : 'blaster';
    if (pl.weapon !== want && !g.noFire) g.selectWeapon(want);
  }
}

/** Play one level with the bot. Deaths don't end the run: they're counted and Nova is restored. */
export function runLevel(api, id, { world = Number(id[0]), limit = 600 } = {}) {
  const { game: g, playLevel } = api;
  const par = PAR[world] || PAR[5];
  save.data.upgrades = { armor: 0, speed: 0, power: 0, magnet: 0, zapper: 0, ...par.upgrades };
  for (const w of Object.keys(save.data.weapons)) save.data.weapons[w] = w === 'blaster' || par.weapons.includes(w);
  for (const w of par.weapons) save.data.ammo[w] = 60;
  save.data.items = { ...par.items };
  save.data.seen.smudge = id !== '1-1';
  for (const c of ['opening', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'boss-1-4', 'boss-2-4', 'boss-3-4', 'boss-4-4', 'boss-5-4']) save.data.seen[`comic:${c}`] = true;
  playLevel(id);
  api.screens.close();
  const bot = new Bot(g);
  const inp = g.input;
  inp.move = () => bot.mv;
  inp.aimStick = () => bot.aim;
  inp.firing = () => bot.fire;
  inp.pressed = (...codes) => codes.some((c) => bot.press.has(c));
  const r = { id, deaths: 0, taken: 0, healed: 0, bySource: {}, time: 0, result: 'timeout', sparks: 0 };
  const hurt = Object.getPrototypeOf(g).hurtPlayer.bind(g);
  g.hurtPlayer = (dmg, ...rest) => {
    const before = g.player.hp;
    const caller = (new Error().stack.split('\n')[2] || '').trim().replace(/^at (\S+).*/, '$1').replace(/^(Game|[A-Z]\w+)\./, '$1.');
    hurt(dmg, ...rest);
    const lost = before - g.player.hp;
    if (lost > 0) { r.taken += lost; r.bySource[caller] = (r.bySource[caller] || 0) + lost; }
  };
  g.killPlayer = () => {
    r.deaths++;
    if (r.deaths === 4) r.snap = snapshot();
    g.player.hp = g.maxHp;
    g.hud.setHealth(g.player.hp, g.maxHp);
  };
  // where things went wrong, for tuning the bot itself
  const snapshot = () => {
      const pl = g.player, p = bot.plan();
      return {
        pos: [pl.pos.x.toFixed(1), pl.pos.z.toFixed(1)], tile: g.level.tileAt(pl.pos.x, pl.pos.z), stage: `${g.phase}:${g.stageIdx}`,
        goal: p.goal && [p.goal.x.toFixed(1), p.goal.z.toFixed(1)], mv: [bot.mv.x.toFixed(2), bot.mv.z.toFixed(2)], aim: bot.aim && [bot.aim.x.toFixed(2), bot.aim.z.toFixed(2)], fire: bot.fire, weapon: pl.weapon,
        near: g.enemies.filter((e) => Math.hypot(e.pos.x - pl.pos.x, e.pos.z - pl.pos.z) < 9).map((e) => `${e.type}@${Math.hypot(e.pos.x - pl.pos.x, e.pos.z - pl.pos.z).toFixed(1)} hp${e.hp.toFixed(1)} tr${(e.trapped || 0).toFixed(1)}`),
        tasks: g.def.stages[Math.min(g.stageIdx, g.def.stages.length - 1)].tasks.map((t) => `${t}:${g.taskCount(t).done}/${g.taskCount(t).total}`).join(' '),
        path: bot.path ? bot.path.length : null,
      };
  };
  g.events.action = () => {};
  const sardines = save.data.items.sardine;
  for (let step = 0; step < limit / DT; step++) {
    if (g.state !== 'play') break;
    bot.think();
    g.update(DT);
  }
  r.time = Math.round(g.stats.time);
  r.result = g.state === 'complete' ? 'clear' : g.phase === 'wave' ? 'clear' : 'timeout';
  if (r.result === 'timeout') r.snap = snapshot();
  r.sparks = g.stats.sparks;
  r.pops = g.stats.pops;
  r.sardines = sardines - save.data.items.sardine;
  r.maxHp = g.maxHp;
  r.stage = `${g.phase}:${g.stageIdx}`;
  delete inp.move; delete inp.aimStick; delete inp.firing; delete inp.pressed;
  delete g.hurtPlayer; delete g.killPlayer; // back to the real ones
  return r;
}

/** Run several levels (each `runs` times) and print a summary table. Stops the render loop while running. */
export async function balance(ids, { runs = 1 } = {}) {
  const api = window.prismPaw;
  api.renderer?.setAnimationLoop(null);
  const all = [];
  for (const id of ids) {
    for (let k = 0; k < runs; k++) {
      all.push(runLevel(api, id));
      await new Promise((res) => setTimeout(res, 0));
    }
  }
  const rows = all.map((r) => ({
    level: r.id, result: r.result, time: r.time, deaths: r.deaths, taken: Math.round(r.taken), maxHp: r.maxHp,
    sardines: r.sardines, sparks: r.sparks, pops: r.pops,
    top: Object.entries(r.bySource).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k.replace('Game.', '')}:${Math.round(v)}`).join(' '),
  }));
  console.table(rows);
  return rows;
}

