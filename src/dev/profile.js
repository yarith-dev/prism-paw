/**
 * Dev-only frame profiler (not in the build). The autoplay bot plays a level while this drives the
 * frames itself (so it also works in a hidden tab, where requestAnimationFrame stops) and records,
 * per frame: CPU time in game.update and game.render, GPU time (with
 * EXT_disjoint_timer_query_webgl2), draw calls, triangles and the enemy count.
 *
 *   const { profile } = await import('/src/dev/profile.js')
 *   await profile(prismPaw, '2-3', { frames: 900 })
 */
import { Bot, PAR } from './autoplay.js';
import { save } from '../save.js';

const DT = 1 / 60;
const pct = (list, p) => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const avg = (list) => list.reduce((a, b) => a + b, 0) / (list.length || 1);
const r2 = (n) => Math.round(n * 100) / 100;
/** Yield to the event loop without timer throttling (hidden tabs clamp setTimeout). */
const yieldNow = () => new Promise((res) => { const c = new MessageChannel(); c.port1.onmessage = res; c.port2.postMessage(0); });

export async function profile(api, id, { frames = 900, warmup = 180 } = {}) {
  const { game: g, renderer, playLevel } = api;
  const par = PAR[Number(id[0])] || PAR[5];
  save.data.upgrades = { armor: 0, speed: 0, power: 0, magnet: 0, zapper: 0, ...par.upgrades };
  for (const w of par.weapons) { save.data.weapons[w] = true; save.data.ammo[w] = 60; }
  for (const c of ['opening', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'boss-1-4', 'boss-2-4', 'boss-3-4', 'boss-4-4', 'boss-5-4']) save.data.seen[`comic:${c}`] = true;
  save.data.seen.smudge = id !== '1-1';
  await playLevel(id);
  api.screens.close();

  const bot = new Bot(g), inp = g.input;
  inp.move = () => bot.mv;
  inp.aimStick = () => bot.aim;
  inp.firing = () => bot.fire;
  inp.pressed = (...codes) => codes.some((c) => bot.press.has(c));
  g.killPlayer = () => { g.player.hp = g.maxHp; };
  // the page's own loop keeps running when visible: it does nothing to the game while this drives it
  const update = g.update.bind(g), render = g.render.bind(g);
  g.update = () => {};
  g.render = () => {};

  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const rows = [], pending = [], spikes = [];
  const collect = () => {
    while (pending.length && gl.getQueryParameter(pending[0].q, gl.QUERY_RESULT_AVAILABLE)) {
      const { q, row } = pending.shift();
      if (row && !gl.getParameter(ext.GPU_DISJOINT_EXT)) row.gpu = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(q);
    }
  };
  for (let i = 0; i < warmup + frames && g.state === 'play'; i++) {
    bot.think();
    let t = performance.now();
    update(DT);
    const row = { update: performance.now() - t };
    const q = ext && gl.createQuery();
    if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    t = performance.now();
    render();
    row.render = performance.now() - t;
    if (q) gl.endQuery(ext.TIME_ELAPSED_EXT);
    const mem = renderer.info.memory;
    Object.assign(row, { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, enemies: g.enemies.length, bullets: g.bullets.length, programs: renderer.info.programs.length, geometries: mem.geometries, textures: mem.textures, heap: performance.memory?.usedJSHeapSize ?? 0 });
    // a hitch: note what changed (new shader programs mean a compile on the spot; a smaller heap, a garbage collection)
    const prev = rows.at(-1) ?? row;
    if (i >= warmup && row.update + row.render > 25) spikes.push({ frame: i - warmup, update: r2(row.update), render: r2(row.render), programs: row.programs - prev.programs, geometries: row.geometries - prev.geometries, textures: row.textures - prev.textures, gcMB: r2(Math.max(0, prev.heap - row.heap) / 1e6), phase: `${g.phase}:${g.stageIdx}` });
    if (i >= warmup) rows.push(row);
    if (q) pending.push({ q, row: i >= warmup ? row : null });
    if (i % 4 === 3) { await yieldNow(); collect(); }
  }
  for (let k = 0; k < 50 && pending.length; k++) { await yieldNow(); collect(); }

  delete g.update; delete g.render; delete g.killPlayer;
  delete inp.move; delete inp.aimStick; delete inp.firing; delete inp.pressed;

  const col = (k) => rows.map((r) => r[k]).filter((v) => v !== undefined);
  const stat = (k) => ({ avg: r2(avg(col(k))), p95: r2(pct(col(k), 0.95)), max: r2(Math.max(...col(k))) });
  return {
    level: id, frames: rows.length, buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    updateMs: stat('update'), renderCpuMs: stat('render'), gpuMs: ext ? stat('gpu') : 'no timer query',
    calls: stat('calls'), tris: stat('tris'), enemies: stat('enemies'), bullets: stat('bullets'),
    spikes, programs: renderer.info.programs.length,
    // garbage made per second of play (heap growth between collections) and how many collections
    allocMBs: r2(rows.reduce((a, r, k) => a + (k && r.heap > rows[k - 1].heap ? r.heap - rows[k - 1].heap : 0), 0) / 1e6 / (rows.length * DT)),
    gcs: rows.filter((r, k) => k && r.heap < rows[k - 1].heap - 1e6).length,
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null,
  };
}
