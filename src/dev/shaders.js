/**
 * Dev-only (not in the build): which shader programs does play compile after a level has loaded?
 * The bot plays each level to the end, rendering every few frames; every program that appears
 * mid-level is a hitch the loading screen should have taken. Lists them with what was being drawn.
 *
 *   const { lateShaders } = await import('/src/dev/shaders.js')
 *   await lateShaders(prismPaw, ['1-1', '1-2'])
 */
import { Bot, PAR } from './autoplay.js';
import { save } from '../save.js';

const DT = 1 / 60;
const yieldNow = () => new Promise((res) => { const c = new MessageChannel(); c.port1.onmessage = res; c.port2.postMessage(0); });

/** What the material that owns a program looks like (enough to recreate it for warming up). */
function describe(renderer, scene, cacheKey) {
  const out = new Set();
  scene.traverse((o) => {
    if (!o.material) return;
    for (const m of [].concat(o.material)) {
      const p = renderer.properties.get(m);
      if (p.currentProgram?.cacheKey !== cacheKey) continue;
      const parts = [m.type, o.isInstancedMesh ? `instanced${o.instanceColor ? '+color' : ''}` : o.isPoints ? 'points' : o.isLine ? 'line' : 'mesh'];
      for (const k of ['map', 'vertexColors', 'alphaTest', 'wireframe']) if (m[k]) parts.push(k);
      if (m.side !== 0) parts.push(`side${m.side}`);
      if (m.fog === false) parts.push('noFog');
      if (m.onBeforeCompile.toString() !== '() => {}' && m.customProgramCacheKey) parts.push(`custom:${m.customProgramCacheKey()}`);
      parts.push(`@${o.name || o.parent?.name || o.parent?.type || ''}`);
      out.add(parts.join(' '));
    }
  });
  return [...out];
}

export async function lateShaders(api, ids, { renderEvery = 3, limit = 400 } = {}) {
  const { game: g, renderer, playLevel } = api;
  const report = [];
  for (const id of ids) {
    const par = PAR[Number(id[0])] || PAR[5];
    save.data.upgrades = { armor: 0, speed: 0, power: 0, magnet: 0, zapper: 0, ...par.upgrades };
    for (const w of par.weapons) { save.data.weapons[w] = true; save.data.ammo[w] = 60; }
    for (const c of ['opening', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'boss-1-4', 'boss-2-4', 'boss-3-4', 'boss-4-4', 'boss-5-4']) save.data.seen[`comic:${c}`] = true;
    save.data.seen.smudge = id !== '1-1';
    await playLevel(id);
    api.screens.close();
    renderer.render(g.scene, g.camera);
    const known = new Set(renderer.info.programs.map((p) => p.cacheKey));
    const bot = new Bot(g), inp = g.input;
    inp.move = () => bot.mv; inp.aimStick = () => bot.aim; inp.firing = () => bot.fire;
    inp.pressed = (...codes) => codes.some((c) => bot.press.has(c));
    g.killPlayer = () => { g.player.hp = g.maxHp; };
    g.events.action = () => {};
    const update = g.update.bind(g), render = g.render.bind(g);
    g.update = () => {}; g.render = () => {};
    const late = [];
    for (let i = 0; i < limit / DT && g.state === 'play'; i++) {
      bot.think();
      update(DT);
      if (i % renderEvery === 0) {
        const t = performance.now();
        render();
        const ms = performance.now() - t;
        for (const p of renderer.info.programs) {
          if (known.has(p.cacheKey)) continue;
          known.add(p.cacheKey);
          late.push({ t: Math.round(i * DT), ms: Math.round(ms), phase: `${g.phase}:${g.stageIdx}`, what: describe(renderer, g.scene, p.cacheKey) });
        }
      }
      if (i % 600 === 0) await yieldNow();
    }
    delete g.update; delete g.render; delete g.killPlayer;
    delete inp.move; delete inp.aimStick; delete inp.firing; delete inp.pressed;
    report.push({ id, end: g.state, late });
  }
  return report;
}
