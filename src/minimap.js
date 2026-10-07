import { TILE } from './level.js';

const COLORS = {
  void: '#120c2c', wall: '#4b3d8a', floor: '#8e86c4', floorColor: '#c6a8ff', crate: '#6b5aa8',
  barrier: '#f4f7ff', rail: '#a99fd8', water: '#2f8fd6', sky: '#5f9fe8', rift: '#2a2640', whale: '#62a8ff', bridge: '#b07a4f', pad: '#ffb21f', player: '#ff9a3d', smudge: '#7ef0c8', enemy: '#ff4f6d',
  vat: '#ff4f6d', beacon: '#ffd23f', npc: '#7ef0c8', objective: '#62f4ff', done: '#8cff7a', prop: '#ffd23f',
};

/**
 * Draws the level layout with fog of war plus live markers. Used for the corner
 * minimap (whole level, small) and the full-screen map (whole level, large).
 */
export function drawMap(ctx, game, w, h, opts = {}) {
  const lv = game.level;
  if (!lv) return;
  const scale = Math.min(w / lv.w, h / lv.h);
  const ox = (w - lv.w * scale) / 2, oy = (h - lv.h * scale) / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, w, h);
  for (let ty = 0; ty < lv.h; ty++) for (let tx = 0; tx < lv.w; tx++) {
    if (!lv.explored[ty * lv.w + tx]) continue;
    const ch = lv.grid[ty][tx];
    ctx.fillStyle = ch === '#' || ch === 'D' ? COLORS.wall
      : ch === 'W' ? COLORS.barrier
      : ch === '=' ? COLORS.rail
      : ch === '~' ? (lv.theme === 'docks' ? COLORS.sky : lv.theme === 'wastes' ? COLORS.rift : COLORS.water)
      : ch === ':' ? COLORS.bridge
      : ch === 'O' ? COLORS.objective
      : 'BQPKTLRUGI'.includes(ch) ? COLORS.crate
      : lv.colorful ? COLORS.floorColor : COLORS.floor;
    ctx.fillRect(ox + tx * scale, oy + ty * scale, Math.ceil(scale), Math.ceil(scale));
  }
  const toMap = (x, z) => [ox + (x / TILE) * scale, oy + (z / TILE) * scale];
  const seen = (x, z) => lv.explored[Math.floor(z / TILE) * lv.w + Math.floor(x / TILE)];
  const dot = (x, z, r, color, shape = 'circle') => {
    const [mx, my] = toMap(x, z);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shape === 'square') ctx.rect(mx - r, my - r, r * 2, r * 2);
    else if (shape === 'diamond') { ctx.moveTo(mx, my - r); ctx.lineTo(mx + r, my); ctx.lineTo(mx, my + r); ctx.lineTo(mx - r, my); }
    else ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const blink = Math.sin(performance.now() / 180) > -0.2;
  const s = Math.max(1.6, scale * 0.45);

  for (const p of lv.props) dot(p.x, p.z, s * 1.1, COLORS.prop, 'diamond');
  for (const e of game.enemies || []) {
    if (!seen(e.pos.x, e.pos.z)) continue;
    if (e.type === 'vat') dot(e.pos.x, e.pos.z, s * 1.5, COLORS.vat, 'square');
    else dot(e.pos.x, e.pos.z, s * 0.7, COLORS.enemy);
  }
  for (const st of game.stations || []) {
    if (st.done) dot(st.pos.x, st.pos.z, s, COLORS.done, 'diamond');
    else if (blink || !opts.small) dot(st.pos.x, st.pos.z, s * 1.2, COLORS.objective, 'diamond');
  }
  for (const n of game.npcs || []) dot(n.pos.x, n.pos.z, s, COLORS.npc);
  for (const pad of game.pads || []) if (seen(pad.pos.x, pad.pos.z)) dot(pad.pos.x, pad.pos.z, s * 0.8, COLORS.pad);
  for (const m of game.murals || []) {
    if (m.read) dot(m.pos.x, m.pos.z, s, COLORS.done, 'diamond');
    else if (blink || !opts.small) dot(m.pos.x, m.pos.z, s * 1.2, COLORS.objective, 'diamond');
  }
  for (const w of game.whales || []) {
    if (w.done) dot(w.pos.x, w.pos.z, s * 1.3, COLORS.done, 'diamond');
    else if (blink || !opts.small) dot(w.pos.x, w.pos.z, s * 1.6, COLORS.objective, 'diamond');
  }
  if (game.boss && !game.boss.dead) dot(game.boss.pos.x, game.boss.pos.z, s * 3, COLORS.vat, 'square');
  if (game.beacon) dot(game.beacon.pos.x, game.beacon.pos.z, s * 1.6, COLORS.beacon, 'diamond');
  if (game.smudge) dot(game.smudge.pos.x, game.smudge.pos.z, s * 0.8, COLORS.smudge);
  if (game.surge > 0.05) {
    // a static surge scrambles the map
    for (let k = 0; k < 500 * game.surge; k++) {
      const v = Math.random() * 255 | 0;
      ctx.fillStyle = `rgba(${v},${v},${v},${0.9 * game.surge})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    }
  }
  const pl = game.player;
  if (pl && !pl.dead) {
    const [mx, my] = toMap(pl.pos.x, pl.pos.z), r = s * 2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(-pl.yaw + Math.PI);
    ctx.fillStyle = COLORS.player;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.75, r * 0.8); ctx.lineTo(0, r * 0.35); ctx.lineTo(-r * 0.75, r * 0.8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

export const MAP_LEGEND = [
  ['You', COLORS.player], ['Smudge', COLORS.smudge], ['Robots', COLORS.enemy], ['Grey Vat / Boss', COLORS.vat],
  ['Objective', COLORS.objective], ['Townscat', COLORS.npc], ['Beacon', COLORS.beacon], ['Barrier', COLORS.barrier],
];
