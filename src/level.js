import * as THREE from 'three';
import { GLOW, model, meshModel } from './voxel.js';

export const TILE = 4;           // world units per map tile
const VOX = 0.5;                  // scenery voxel size
const PER = TILE / VOX;           // scenery voxels per tile edge (8)
const PX = 16;                    // ground texture pixels per world unit

export const SOLID = new Set(['#', 'B', 'L', 'W', 'Q', 'P', 'K', 'T', 'D', 'R', 'U', 'G', 'O', 'I', 'J', 'H', 'C']);
/** Shootable tiles: grey glass panes (G), Chroma geodes (O) and jars of stolen color (J). Drawn as separate meshes, not scenery. */
export const BREAKABLE = new Set(['G', 'O', 'J']);
/** Water blocks walking but not shots or sight. */
export const WATER = '~';
const blocksMove = (ch) => SOLID.has(ch) || ch === WATER;
const FLOOR = new Set(['.', '=', ':', '~']);
const PAINTS = ['#ff4f6d', '#ffd23f', '#7ef0c8', '#62a8ff', '#ff8fb1', '#c6a8ff', '#ff9a3d'];

const WALLS = ['#ff9ec7', '#8ff0cf', '#ffe27a', '#c6a8ff', '#ffbf8f', '#9fd2ff'];
const ROOFS = ['#e0528f', '#2fb58f', '#e8a92e', '#7d5be0', '#e8743d', '#4b8fe0'];
const GREY = new THREE.Color('#8e939b');
GLOW.add('#f4f7ff'); // barrier light bars

function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Level {
  constructor(def, scene) {
    this.def = def;
    this.scene = scene;
    this.rows = def.map;
    this.h = this.rows.length;
    this.w = this.rows[0].length;
    this.rows.forEach((r, i) => {
      if (r.length !== this.w) throw new Error(`map row ${i} has length ${r.length}, expected ${this.w}`);
    });
    this.grid = this.rows.map((r) => r.split(''));
    this.width = this.w * TILE;
    this.depth = this.h * TILE;
    this.theme = def.theme || 'street';
    this.colorful = !!def.colorful;
    this.spawns = [];
    this.props = [];
    this.grid.forEach((row, ty) => row.forEach((ch, tx) => {
      const at = { ch, x: (tx + 0.5) * TILE, z: (ty + 0.5) * TILE, tx, ty };
      if (ch === 'T' || ch === 'D' || ch === 'U' || ch === 'C') this.props.push(at);
      else if (!SOLID.has(ch) && !FLOOR.has(ch)) this.spawns.push(at);
    }));
    this.flow = new Int32Array(this.w * this.h);
    this.flowFrom = -1;
    this.explored = new Uint8Array(this.w * this.h);
    if (def.hub) this.explored.fill(1);
    this.buildGround();
    this.buildScenery();
    this.buildBarrier();
    if (this.theme === 'wastes') this.buildRifts();
  }

  // ---------- queries ----------

  tileAt(x, z) {
    const tx = Math.floor(x / TILE), ty = Math.floor(z / TILE);
    if (!(tx >= 0 && ty >= 0 && tx < this.w && ty < this.h)) return '#'; // also catches NaN
    return this.grid[ty][tx];
  }

  solidAt(x, z) { return SOLID.has(this.tileAt(x, z)); }

  /** Can something walk on this spot? (False for walls, props and water.) */
  walkableAt(x, z) { return !blocksMove(this.tileAt(x, z)); }

  /** Mark tiles around (x, z) as explored for the minimap. */
  reveal(x, z, r = 7) {
    const cx = Math.floor(x / TILE), cy = Math.floor(z / TILE);
    for (let ty = Math.max(0, cy - r); ty <= Math.min(this.h - 1, cy + r); ty++) {
      for (let tx = Math.max(0, cx - r); tx <= Math.min(this.w - 1, cx + r); tx++) {
        if ((tx - cx) ** 2 + (ty - cy) ** 2 <= r * r) this.explored[ty * this.w + tx] = 1;
      }
    }
  }

  /** Push a circle out of solid tiles. Mutates pos. */
  collide(pos, r) {
    const tx0 = Math.floor((pos.x - r) / TILE), tx1 = Math.floor((pos.x + r) / TILE);
    const ty0 = Math.floor((pos.z - r) / TILE), ty1 = Math.floor((pos.z + r) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const ch = (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) ? '#' : this.grid[ty][tx];
      if (!blocksMove(ch)) continue;
      // lamps are thin posts: collide with a small circle instead of the whole tile
      if (ch === 'L') {
        const cx = (tx + 0.5) * TILE, cz = (ty + 0.5) * TILE;
        const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz), min = r + 0.5;
        if (d < min && d > 1e-4) { pos.x = cx + dx / d * min; pos.z = cz + dz / d * min; }
        continue;
      }
      const minX = tx * TILE, maxX = minX + TILE, minZ = ty * TILE, maxZ = minZ + TILE;
      const nx = Math.max(minX, Math.min(pos.x, maxX)), nz = Math.max(minZ, Math.min(pos.z, maxZ));
      const dx = pos.x - nx, dz = pos.z - nz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x = nx + dx / d * r; pos.z = nz + dz / d * r;
      } else {
        // centre inside the tile: push out along the shallowest axis
        const pushes = [[pos.x - minX + r, -1, 0], [maxX - pos.x + r, 1, 0], [pos.z - minZ + r, 0, -1], [maxZ - pos.z + r, 0, 1]];
        pushes.sort((a, b) => a[0] - b[0]);
        pos.x += pushes[0][1] * pushes[0][0]; pos.z += pushes[0][2] * pushes[0][0];
      }
    }
  }

  /** True if the straight segment between two points crosses no solid tile (sampled). */
  lineOfSight(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), steps = Math.ceil(d / (TILE * 0.4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const ch = this.tileAt(ax + (bx - ax) * t, az + (bz - az) * t);
      if (SOLID.has(ch) && ch !== 'L') return false;
    }
    return true;
  }

  /** BFS distance field toward the target tile, recomputed when the target changes tile. */
  updateFlow(x, z) {
    const tx = Math.floor(x / TILE), ty = Math.floor(z / TILE), idx = ty * this.w + tx;
    if (idx === this.flowFrom) return;
    this.flowFrom = idx;
    const f = this.flow;
    f.fill(-1);
    const q = new Int32Array(this.w * this.h);
    let head = 0, tail = 0;
    f[idx] = 0; q[tail++] = idx;
    while (head < tail) {
      const i = q[head++], cx = i % this.w, cy = (i / this.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
        const ni = ny * this.w + nx;
        if (f[ni] !== -1 || blocksMove(this.grid[ny][nx])) continue;
        f[ni] = f[i] + 1; q[tail++] = ni;
      }
    }
  }

  /** Direction (unit x/z) an enemy at (x, z) should walk to reach the flow target. */
  flowDir(x, z, out) {
    const tx = Math.floor(x / TILE), ty = Math.floor(z / TILE);
    const here = this.flow[ty * this.w + tx];
    let best = here < 0 ? 1e9 : here, bx = 0, bz = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
      const v = this.flow[ny * this.w + nx];
      if (v < 0) continue;
      // diagonals only if both orthogonal neighbours are open (no corner cutting)
      if (dx && dy && (this.flow[ty * this.w + nx] < 0 || this.flow[ny * this.w + tx] < 0)) continue;
      if (v < best) { best = v; bx = (nx + 0.5) * TILE - x; bz = (ny + 0.5) * TILE - z; }
    }
    const d = Math.hypot(bx, bz);
    if (d < 1e-4) { out.x = 0; out.z = 0; return out; }
    out.x = bx / d; out.z = bz / d;
    return out;
  }

  // ---------- ground: a canvas we can paint on ----------

  buildGround() {
    const cw = this.width * PX, ch = this.depth * PX;
    const make = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
    this.groundGrey = make();
    this.groundColor = make();
    this.paintTiles(this.groundGrey.getContext('2d'), false);
    this.paintTiles(this.groundColor.getContext('2d'), true);
    this.ground = make();
    this.groundCtx = this.ground.getContext('2d');
    this.groundCtx.drawImage(this.colorful ? this.groundColor : this.groundGrey, 0, 0);
    this.groundTex = new THREE.CanvasTexture(this.ground);
    this.groundTex.colorSpace = THREE.SRGBColorSpace;
    this.groundTex.anisotropy = 4;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.depth),
      // the docks float: sky gaps are transparent holes in the ground texture
      new THREE.MeshLambertMaterial({ map: this.groundTex, alphaTest: this.theme === 'docks' ? 0.5 : 0 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.width / 2, 0, this.depth / 2);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.groundMesh = mesh;
  }

  paintTiles(ctx, colorful) {
    const T = TILE * PX;
    if (this.theme === 'indoor') { this.paintIndoor(ctx); return; }
    if (this.theme === 'docks') { this.paintDocks(ctx, colorful); return; }
    if (this.theme === 'wastes') { this.paintWastes(ctx, colorful); return; }
    if (this.theme === 'vault' || this.theme === 'moon') { this.paintPale(ctx, colorful); return; }
    const PAL = {
      street: { street: ['#5b4fc4', '#6a5ad6'], walk: ['#ff9ec7', '#8ff0cf', '#ffe27a', '#9fd2ff'] },
      yard: { street: ['#d9825b', '#e3916b'], walk: ['#ffe27a', '#ffcf8f'] },
      festival: { street: ['#ffcf8f', '#ffe3b3'], walk: ['#ff9ec7', '#c6a8ff', '#8ff0cf', '#9fd2ff'] },
      jungle: { street: ['#1f6b5a', '#237563'], walk: ['#2f8a5f', '#36996a'] },
      ruins: { street: ['#5a5f8a', '#646a96'], walk: ['#3f7a6a', '#478a76'] },
    }[this.theme];
    const street = colorful ? PAL.street : ['#6f747c', '#7a7f87'];
    const walk = colorful ? PAL.walk : ['#a3a8b0', '#b0b5bc'];
    const nature = this.theme === 'jungle' || this.theme === 'ruins';
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      // sidewalk tiles next to buildings, street everywhere else
      const nearWall = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.grid[ty + dy]?.[tx + dx] === '#');
      const sub = 2;
      for (let sy = 0; sy < sub; sy++) for (let sx = 0; sx < sub; sx++) {
        const pal = nearWall ? walk : street;
        ctx.fillStyle = pal[(tx * sub + sx + ty * sub + sy + (nearWall ? (tx + ty) : 0)) % pal.length];
        ctx.fillRect(tx * T + sx * T / sub, ty * T + sy * T / sub, T / sub, T / sub);
      }
      ctx.strokeStyle = colorful ? 'rgba(40,20,90,.25)' : 'rgba(40,40,50,.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx * T + 1, ty * T + 1, T - 2, T - 2);
    }
    // painted lane dashes along long open rows
    ctx.fillStyle = colorful ? '#ffd23f' : '#c9ced6';
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx += 2) {
      if (this.theme === 'street' && this.grid[ty][tx] === '.' && this.grid[ty - 1]?.[tx] === '.' && this.grid[ty + 1]?.[tx] === '.' && (tx + ty) % 4 === 0)
        ctx.fillRect(tx * T + T * 0.3, ty * T + T * 0.47, T * 0.4, T * 0.06);
    }
    // festival: painted diamond inlays on the square
    if (this.theme === 'festival') {
      for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
        if ((tx + ty * 3) % 5 !== 0 || this.grid[ty][tx] === '#') continue;
        ctx.fillStyle = colorful ? PAINTS[(tx + ty) % PAINTS.length] : '#c9ced6';
        const cx = (tx + 0.5) * T, cy = (ty + 0.5) * T, r = T * 0.22;
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.fill();
      }
    }
    if (nature) {
      for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
        const ch = this.grid[ty][tx];
        const x0 = tx * T, y0 = ty * T;
        if (ch === '~') {
          ctx.fillStyle = colorful ? '#1f8fc4' : '#4a576e';
          ctx.fillRect(x0, y0, T, T);
          ctx.fillStyle = colorful ? 'rgba(160, 240, 255, .55)' : 'rgba(205,218,238,.5)';
          for (let k = 0; k < 3; k++) ctx.fillRect(x0 + ((tx * 13 + k * 23 + ty * 7) % 40) / 64 * T, y0 + (k + 0.5) * T / 3, T * 0.28, T * 0.04);
        } else if (ch === ':') {
          ctx.fillStyle = colorful ? '#8a5a3b' : '#7a7d84';
          ctx.fillRect(x0, y0, T, T);
          ctx.fillStyle = colorful ? '#5a3a24' : '#5b5e65';
          for (let k = 0; k < 4; k++) ctx.fillRect(x0 + k * T / 4, y0, 3, T);
        } else if (!SOLID.has(ch) && hash(tx * 3, ty * 5) > 0.55) {
          // glowing moss and spore specks
          for (let k = 0; k < 4; k++) {
            const r = hash(tx * 7 + k, ty * 11 + k);
            ctx.fillStyle = colorful ? ['#62f4ff', '#ff6fd8', '#b8ff6a', '#ffe066'][k] : '#c4c8cf';
            ctx.beginPath();
            ctx.arc(x0 + r * T, y0 + hash(tx + k * 5, ty) * T, 2 + r * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    // rail tracks: sleepers and two rails
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      if (this.grid[ty][tx] !== '=') continue;
      const x0 = tx * T, y0 = ty * T;
      ctx.fillStyle = colorful ? '#5a3a24' : '#55585e';
      for (let k = 0; k < 4; k++) ctx.fillRect(x0 + k * T / 4 + T * 0.06, y0 + T * 0.18, T * 0.12, T * 0.64);
      ctx.fillStyle = colorful ? '#eef2f8' : '#b9bec6';
      ctx.fillRect(x0, y0 + T * 0.28, T, T * 0.06);
      ctx.fillRect(x0, y0 + T * 0.66, T, T * 0.06);
    }
  }

  paintIndoor(ctx) {
    const T = TILE * PX;
    const planks = ['#c48a5a', '#b97b4b', '#cf9666', '#bd8253'];
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = planks[(ty * 4 + k + (tx >> 1)) % planks.length];
        ctx.fillRect(tx * T, ty * T + k * T / 4, T, T / 4);
        ctx.fillStyle = 'rgba(70,40,20,.35)';
        ctx.fillRect(tx * T, ty * T + k * T / 4, T, 2);
        if ((tx + k + ty) % 3 === 0) ctx.fillRect(tx * T + T * 0.5, ty * T + k * T / 4, 2, T / 4);
      }
    }
    for (const rug of this.def.rugs || []) {
      rug.colors.forEach((c, i) => {
        ctx.fillStyle = c;
        const inset = i * T * 0.35;
        ctx.fillRect(rug.x * T + inset, rug.y * T + inset, rug.w * T - inset * 2, rug.h * T - inset * 2);
      });
    }
  }

  /** Sky docks: sun-bleached planks, hazard paint along the edges, holes where the sky shows through. */
  paintDocks(ctx, colorful) {
    const T = TILE * PX;
    const planks = colorful ? ['#e0a77a', '#d6996b', '#e8b48a', '#cf9063'] : ['#8f949c', '#868b93', '#989da5', '#81868e'];
    const stripe = colorful ? ['#ff7a59', '#fff4e6'] : ['#6f747c', '#c4c8cf'];
    const isGap = (x, y) => x < 0 || y < 0 || x >= this.w || y >= this.h || this.grid[y][x] === WATER;
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.grid[ty][tx], x0 = tx * T, y0 = ty * T;
      if (ch === WATER) { ctx.clearRect(x0, y0, T, T); continue; }
      if (ch === ':') {
        // gangplank: crosswise boards with rope along the open sides
        const across = isGap(tx, ty - 1) && isGap(tx, ty + 1);
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = colorful ? (k % 2 ? '#a8723f' : '#bd8253') : (k % 2 ? '#74787f' : '#7f838a');
          if (across) ctx.fillRect(x0 + k * T / 6, y0 + T * 0.12, T / 6 - 2, T * 0.76);
          else ctx.fillRect(x0 + T * 0.12, y0 + k * T / 6, T * 0.76, T / 6 - 2);
        }
        ctx.clearRect(...(across ? [x0, y0, T, T * 0.12] : [x0, y0, T * 0.12, T]));
        ctx.clearRect(...(across ? [x0, y0 + T * 0.88, T, T * 0.12] : [x0 + T * 0.88, y0, T * 0.12, T]));
        ctx.fillStyle = colorful ? '#f4e3c8' : '#c4c8cf';
        if (across) { ctx.fillRect(x0, y0 + T * 0.12, T, 3); ctx.fillRect(x0, y0 + T * 0.85, T, 3); }
        else { ctx.fillRect(x0 + T * 0.12, y0, 3, T); ctx.fillRect(x0 + T * 0.85, y0, 3, T); }
        continue;
      }
      // long planks running east-west, staggered seams
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = planks[(ty * 4 + k + tx * 3) % planks.length];
        ctx.fillRect(x0, y0 + k * T / 4, T, T / 4);
        ctx.fillStyle = colorful ? 'rgba(90,50,30,.35)' : 'rgba(40,40,50,.3)';
        ctx.fillRect(x0, y0 + k * T / 4, T, 2);
        if ((tx + k * 3 + ty) % 4 === 0) ctx.fillRect(x0 + T * 0.5, y0 + k * T / 4, 2, T / 4);
        ctx.fillStyle = colorful ? 'rgba(60,30,20,.5)' : 'rgba(30,30,40,.4)';
        ctx.fillRect(x0 + T * 0.1 + ((k * 13 + tx) % 3) * T * 0.3, y0 + k * T / 4 + T / 8 - 1, 3, 3);
      }
      // hazard paint where the deck drops away into the sky
      const band = T * 0.12;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!isGap(tx + dx, ty + dy)) continue;
        for (let k = 0; k < 8; k++) {
          ctx.fillStyle = stripe[k % 2];
          const a = k * T / 8;
          if (dx) ctx.fillRect(dx > 0 ? x0 + T - band : x0, y0 + a, band, T / 8);
          else ctx.fillRect(x0 + a, dy > 0 ? y0 + T - band : y0, T / 8, band);
        }
      }
    }
    // painted cargo markings on big open deck areas
    if (colorful) {
      for (let ty = 1; ty < this.h - 1; ty++) for (let tx = 1; tx < this.w - 1; tx++) {
        if ((tx * 5 + ty * 3) % 11 !== 0 || this.grid[ty][tx] !== '.') continue;
        const cx = (tx + 0.5) * T, cy = (ty + 0.5) * T;
        ctx.strokeStyle = PAINTS[(tx + ty) % PAINTS.length];
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(cx, cy, T * 0.26, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - T * 0.14, cy); ctx.lineTo(cx + T * 0.14, cy); ctx.moveTo(cx, cy - T * 0.14); ctx.lineTo(cx, cy + T * 0.14); ctx.stroke();
      }
    }
  }

  /** Static Wastes: cracked grey glass. Colored, it blooms into a meadow; rifts become Hue Lines. */
  paintWastes(ctx, colorful) {
    const T = TILE * PX;
    const ground = colorful ? ['#5cc46a', '#54b862', '#62cc70', '#4fae5c'] : ['#b7bcc8', '#aeb3c0', '#c1c6d2', '#a9aebb'];
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.grid[ty][tx], x0 = tx * T, y0 = ty * T;
      if (ch === WATER) {
        if (colorful) {
          const g = ctx.createLinearGradient(x0, y0, x0 + T, y0 + T);
          g.addColorStop(0, '#62f4ff'); g.addColorStop(0.5, '#c6a8ff'); g.addColorStop(1, '#ff8fd8');
          ctx.fillStyle = g;
        } else ctx.fillStyle = '#16141f';
        ctx.fillRect(x0, y0, T, T);
        ctx.fillStyle = colorful ? 'rgba(255,255,255,.7)' : 'rgba(200,205,220,.35)';
        for (let k = 0; k < 6; k++) ctx.fillRect(x0 + hash(tx * 9 + k, ty) * T, y0 + hash(tx, ty * 7 + k) * T, 3, 3);
        continue;
      }
      if (ch === ':') {
        ctx.fillStyle = colorful ? '#c08a57' : '#d6dae6';
        ctx.fillRect(x0, y0, T, T);
        ctx.fillStyle = colorful ? '#8a5a3b' : '#9aa0b0';
        for (let k = 0; k < 4; k++) ctx.fillRect(x0 + k * T / 4, y0, 3, T);
        continue;
      }
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        ctx.fillStyle = ground[(tx * 2 + sx + (ty * 2 + sy) * 3) % ground.length];
        ctx.fillRect(x0 + sx * T / 2, y0 + sy * T / 2, T / 2, T / 2);
      }
      if (colorful) {
        // grass tufts and flowers
        for (let k = 0; k < 5; k++) {
          const r = hash(tx * 13 + k, ty * 7 - k);
          ctx.fillStyle = r > 0.75 ? PAINTS[(tx + ty + k) % PAINTS.length] : r > 0.4 ? '#3f9b4a' : '#7ad46f';
          ctx.fillRect(x0 + hash(tx + k * 3, ty * 5) * T, y0 + hash(tx * 5, ty + k * 3) * T, r > 0.75 ? 6 : 3, r > 0.75 ? 6 : 8);
        }
      } else {
        // glass cracks and glints
        ctx.strokeStyle = 'rgba(70,74,92,.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let x = x0 + hash(tx, ty * 3) * T, y = y0;
        ctx.moveTo(x, y);
        for (let k = 1; k <= 4; k++) { x += (hash(tx * 5 + k, ty) - 0.5) * T * 0.5; y += T / 4; ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        if (hash(tx * 3, ty * 11) > 0.6) ctx.fillRect(x0 + T * 0.7, y0 + T * 0.2, 4, 4);
      }
    }
  }

  /** Pale: white marble in the vault, grey dust on the far side; colored, both turn pastel. */
  paintPale(ctx, colorful) {
    const T = TILE * PX, moon = this.theme === 'moon';
    const PASTEL = ['#ffe3f1', '#e3f1ff', '#e9ffe3', '#fff6d6', '#efe3ff'];
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.grid[ty][tx], x0 = tx * T, y0 = ty * T;
      if (ch === WATER) {
        // a window onto space (vault) or a deep crater (moon)
        ctx.fillStyle = '#07081a';
        ctx.fillRect(x0, y0, T, T);
        ctx.fillStyle = colorful ? '#ffe9ff' : '#c4c8d8';
        for (let k = 0; k < 5; k++) ctx.fillRect(x0 + hash(tx * 7 + k, ty) * T, y0 + hash(tx, ty * 9 + k) * T, 2 + (k % 2) * 2, 2 + (k % 2) * 2);
        continue;
      }
      if (moon) {
        ctx.fillStyle = colorful ? PASTEL[Math.floor(hash(tx >> 1, ty >> 1) * PASTEL.length)] : ['#9a9ca6', '#90929c', '#a3a5af'][(tx * 3 + ty * 5) % 3];
        ctx.fillRect(x0, y0, T, T);
        if (hash(tx * 5, ty * 3) > 0.7) {
          // little craters
          const cx = x0 + T * (0.3 + hash(tx, ty * 2) * 0.4), cy = y0 + T * (0.3 + hash(tx * 2, ty) * 0.4), r = T * (0.12 + hash(tx * 3, ty * 3) * 0.14);
          ctx.fillStyle = colorful ? 'rgba(120,90,170,.25)' : 'rgba(60,62,72,.35)';
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = colorful ? 'rgba(255,255,255,.6)' : 'rgba(220,222,230,.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx - 1, cy - 1, r, Math.PI * 0.9, Math.PI * 1.7); ctx.stroke();
        }
        continue;
      }
      // marble tiles with veins
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        ctx.fillStyle = colorful ? PASTEL[(tx * 2 + sx + (ty * 2 + sy)) % PASTEL.length] : ((sx + sy) % 2 ? '#d9dce4' : '#e4e6ec');
        ctx.fillRect(x0 + sx * T / 2, y0 + sy * T / 2, T / 2, T / 2);
      }
      ctx.strokeStyle = colorful ? 'rgba(232,176,60,.6)' : 'rgba(150,154,168,.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + hash(tx, ty) * T);
      ctx.bezierCurveTo(x0 + T * 0.3, y0 + hash(tx + 1, ty) * T, x0 + T * 0.6, y0 + hash(tx, ty + 3) * T, x0 + T, y0 + hash(tx + 2, ty + 1) * T);
      ctx.stroke();
      ctx.strokeStyle = colorful ? '#e8b03c' : '#b9bec6';
      ctx.strokeRect(x0 + 1, y0 + 1, T - 2, T - 2);
    }
  }

  /** Splat paint on the ground at world (x, z). */
  splat(x, z, radius, color, blobs = 7) {
    const ctx = this.groundCtx;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.globalCompositeOperation = 'source-atop'; // never paint over the sky gaps
    for (let i = 0; i < blobs; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * radius * 0.9;
      const r = radius * (0.25 + Math.random() * 0.45) * (i === 0 ? 1.8 : 1);
      ctx.beginPath();
      ctx.arc((x + Math.cos(a) * d * (i ? 1 : 0)) * PX, (z + Math.sin(a) * d * (i ? 1 : 0)) * PX, r * PX, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this.markGround(x, z, radius * 2.2);
  }

  /**
   * Note a changed square of ground (world units) so only that patch is re-uploaded to the GPU.
   * `dirtyRects` (canvas pixels) keeps separate patches apart and merges ones that overlap;
   * past 12 patches they collapse into one. The game uploads and clears them.
   */
  markGround(x, z, half) {
    const w = this.ground.width, h = this.ground.height;
    const x0 = Math.max(0, Math.floor((x - half) * PX) - 2), x1 = Math.min(w, Math.ceil((x + half) * PX) + 2);
    const y0 = Math.max(0, Math.floor((z - half) * PX) - 2), y1 = Math.min(h, Math.ceil((z + half) * PX) + 2);
    if (x1 <= x0 || y1 <= y0) return;
    const rects = (this.dirtyRects ||= []);
    let r = { x0, y0, x1, y1 };
    for (let i = rects.length - 1; i >= 0; i--) {
      const o = rects[i];
      if (o.x0 <= r.x1 && r.x0 <= o.x1 && o.y0 <= r.y1 && r.y0 <= o.y1) {
        r = { x0: Math.min(o.x0, r.x0), y0: Math.min(o.y0, r.y0), x1: Math.max(o.x1, r.x1), y1: Math.max(o.y1, r.y1) };
        rects.splice(i, 1);
      }
    }
    rects.push(r);
    if (rects.length > 12) {
      const u = rects.reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }));
      rects.length = 0;
      rects.push(u);
    }
    this.groundDirty = true;
  }

  // ---------- scenery: voxel buildings, crates, lamps ----------

  natureHeight(tx, ty) { return 6 + Math.floor(hash(tx, ty) * 3) * 2; }

  /** Container stacks are one or two boxes high, chosen per 2×2 block. */
  dockHeight(tx, ty) { return hash(Math.floor(tx / 2) + 5, Math.floor(ty / 2) + 9) > 0.55 ? 16 : 8; }

  /** The deck's wooden edge and hull paint, hanging below wherever it meets open sky. */
  dockRim(m, tx, ty, ox, oz, ch) {
    const gap = (x, y) => x < 0 || y < 0 || x >= this.w || y >= this.h || this.grid[y][x] === WATER;
    const plank = ch === ':';
    const depth = plank ? 1 : 7;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!gap(tx + dx, ty + dy)) continue;
      for (let l = 0; l < PER; l++) {
        const lx = dx > 0 ? PER - 1 : dx < 0 ? 0 : l, lz = dy > 0 ? PER - 1 : dy < 0 ? 0 : l;
        for (let y = 1; y <= depth; y++) {
          const c = plank ? '#8a5a3b' : y === depth ? '#5a3a24' : y === 3 ? '#ff7a59' : y === 5 ? '#3de0c8' : (l + y) % 3 === 0 ? '#7a4f2e' : '#8a5a3b';
          m.set(ox + lx, -y, oz + lz, c);
        }
        if (!plank) continue;
        // gangplank rope rail on posts
        if (l === 0 || l === PER - 1) for (let y = 0; y < 2; y++) m.set(ox + lx, y, oz + lz, '#7a4f2e');
        m.set(ox + lx, 2, oz + lz, '#f4e3c8');
      }
    }
  }

  tileHeight(tx, ty) {
    if (this.def.wallHeight) return this.def.wallHeight;
    return 12 + Math.floor(hash(tx, ty) * 3) * 4;
  }

  buildScenery() {
    const m = model();
    const isB = (x, y) => this.grid[y]?.[x] === '#' || this.grid[y]?.[x] === 'D';
    const indoor = this.theme === 'indoor';
    const nature = this.theme === 'jungle' || this.theme === 'ruins';
    const docks = this.theme === 'docks';
    const wastes = this.theme === 'wastes';
    const vault = this.theme === 'vault', moon = this.theme === 'moon';
    const PRISM = ['#c9b8ff', '#9fe8ff', '#ffc2e0', '#fff0a8', '#b8ffd8'];
    // the Prism Heart: one big crystal spread over every I tile
    const heartTiles = [];
    this.grid.forEach((row, ty) => row.forEach((ch, tx) => { if (ch === 'I') heartTiles.push([tx, ty]); }));
    const hcx = heartTiles.reduce((n, t) => n + t[0] + 0.5, 0) / (heartTiles.length || 1) * PER;
    const hcz = heartTiles.reduce((n, t) => n + t[1] + 0.5, 0) / (heartTiles.length || 1) * PER;
    if (heartTiles.length) this.heart = { x: hcx * VOX, z: hcz * VOX };
    const BOXES = [['#ff7a59', '#e0603f'], ['#3de0c8', '#24b8a2'], ['#ffd000', '#e0b000'], ['#8f7bff', '#7260e0'], ['#ff8fb1', '#e06f93'], ['#62a8ff', '#3f88e0']];
    const CAPS = ['#ff6fd8', '#62e0ff', '#b48cff', '#ffb21f'];
    const mushroom = (cx, cz, y0, stemH, r, cap) => {
      for (let y = y0; y < y0 + stemH; y++) m.box(cx, y, cz, cx + 1, y, cz + 1, '#f4e3c8');
      for (let y = y0 + stemH; y <= y0 + stemH + 2; y++) {
        const rr = y === y0 + stemH + 2 ? r - 1.4 : r;
        for (let x = -Math.ceil(r); x <= Math.ceil(r) + 1; x++) for (let z = -Math.ceil(r); z <= Math.ceil(r) + 1; z++) {
          if ((x - 0.5) ** 2 + (z - 0.5) ** 2 > rr * rr) continue;
          const spot = y === y0 + stemH + 2 && hash(cx * 3 + x, cz * 5 + z) > 0.78;
          m.set(cx + x, y, cz + z, spot ? '#fff5b8' : cap);
        }
      }
    };
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.grid[ty][tx];
      const ox = tx * PER, oz = ty * PER;
      if (ch === 'H') {
        // Nova's rocket, borrowed from the Net Trawler, standing on its fins
        for (let y = 0; y < 26; y++) {
          const r = y < 3 ? 2 : y > 20 ? Math.max(0, 2.6 - (y - 20) * 0.5) : 2.6;
          for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
            const d = Math.hypot(lx - 3.5, lz - 3.5);
            if (d > r) continue;
            m.set(ox + lx, y, oz + lz, y > 23 ? '#ff4f6d' : y % 6 === 0 ? '#ff4f6d' : y === 14 && lz > 4 ? '#8cff7a' : '#f4f7ff');
          }
        }
        for (const [fx, fz] of [[0, 3], [7, 4], [3, 0], [4, 7]]) m.box(ox + fx, 0, oz + fz, ox + fx, 5, oz + fz, '#ff4f6d');
        continue;
      }
      if (ch === '#' && vault) {
        // white museum wall with columns, a cornice and framed paintings
        const hgt = 12;
        const isW = (x, y) => this.grid[y]?.[x] === '#';
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          const edgeE = lx === PER - 1 && !isW(tx + 1, ty), edgeW = lx === 0 && !isW(tx - 1, ty);
          const edgeS = lz === PER - 1 && !isW(tx, ty + 1), edgeN = lz === 0 && !isW(tx, ty - 1);
          const face = edgeE || edgeW || edgeS || edgeN;
          for (let y = face ? 0 : hgt - 1; y < hgt; y++) {
            const along = edgeE || edgeW ? lz : lx;
            let c = y === hgt - 1 ? '#f4f4f8' : y >= hgt - 3 ? '#d9dce4' : y < 1 ? '#c9ced6' : '#eef0f5';
            if (face && (along === 0 || along === PER - 1) && y < hgt - 3) c = '#ffffff';
            if (face && y >= 4 && y <= 8 && along >= 2 && along <= 5) {
              const frame = y === 4 || y === 8 || along === 2 || along === 5;
              c = frame ? '#c4a35a' : PAINTS[Math.floor(hash(tx * 3 + along, ty * 5 + y) * PAINTS.length)];
            }
            m.set(ox + lx, y, oz + lz, c);
          }
        }
        continue;
      }
      if (ch === '#' && moon) {
        // lumpy moon rock
        const hgt = 5 + Math.floor(hash(tx, ty) * 6);
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          const top = hgt - Math.round(Math.abs(lx - 3.5) * 0.5 + Math.abs(lz - 3.5) * 0.5 * hash(tx + lx, ty));
          for (let y = 0; y < Math.max(2, top); y++) m.set(ox + lx, y, oz + lz, hash(ox + lx, oz + lz + y * 7) > 0.75 ? '#a898c8' : y > top - 2 ? '#c4b8e0' : '#9a8cbc');
        }
        continue;
      }
      if (ch === 'I') {
        // the cracked Prism Heart
        const BANDS = ['#ff5c8a', '#ffd23f', '#7ef0c8', '#62a8ff', '#c6a8ff'];
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          const dx = ox + lx + 0.5 - hcx, dz = oz + lz + 0.5 - hcz;
          const ax = Math.abs(dx), az = Math.abs(dz), metric = (ax + az) * 0.7 + Math.max(ax, az) * 0.3;
          for (let y = 0; y < 32; y++) {
            const r = y < 10 ? 7 + y * 0.45 : 11.5 - (y - 10) * 0.52;
            if (metric > r) continue;
            const crack = Math.abs(dx - Math.round(Math.sin(y * 0.45) * 3)) < 0.8 || Math.abs(dz + Math.round(Math.cos(y * 0.3) * 4)) < 0.6;
            const band = BANDS[Math.floor((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2) * 5 + y / 9) % 5];
            m.set(ox + lx, y, oz + lz, crack && metric > r - 1.5 ? '#9dfbff' : y < 2 ? '#5a5f8a' : metric > r - 1 && (y % 5 === 0) ? '#ffffff' : band);
          }
        }
        continue;
      }
      if (ch === '#' && wastes) {
        // glass spires on a glassy base
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) for (let y = 0; y < 3; y++) m.set(ox + lx, y, oz + lz, y === 2 ? '#d8d0f0' : '#b7a8d8');
        for (let k = 0; k < 3; k++) {
          const sx = 1 + Math.floor(hash(tx * 7 + k, ty) * 5), sz = 1 + Math.floor(hash(tx, ty * 7 + k) * 5);
          const hgt = 7 + Math.floor(hash(tx * 3 + k, ty * 5 - k) * 12);
          const col = PRISM[Math.floor(hash(tx + k * 11, ty * 3) * PRISM.length)];
          for (let y = 3; y < 3 + hgt; y++) {
            const r = y > hgt - 1 ? 0 : y > hgt - 3 ? 0.6 : 1.3;
            for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
              if (Math.abs(x) + Math.abs(z) > r * 1.6 + 0.2 || Math.max(Math.abs(x), Math.abs(z)) > r + 0.2) continue;
              const px = ox + sx + x, pz = oz + sz + z;
              if (px < ox || pz < oz || px >= ox + PER || pz >= oz + PER) continue;
              m.set(px, y, pz, x === -1 || z === 1 ? '#ffffff' : col);
            }
          }
        }
        continue;
      }
      if (docks && ch !== WATER) this.dockRim(m, tx, ty, ox, oz, ch);
      if (ch === '#' && docks) {
        // stacked cargo containers with corrugated sides
        const [c1, c2] = BOXES[Math.floor(hash(Math.floor(tx / 2) + 11, Math.floor(ty / 3)) * BOXES.length)];
        const hgt = this.dockHeight(tx, ty);
        const nb = (dx, dy) => (this.grid[ty + dy]?.[tx + dx] === '#' ? this.dockHeight(tx + dx, ty + dy) : 0);
        const fe = nb(1, 0), fw = nb(-1, 0), fs = nb(0, 1), fn = nb(0, -1);
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          let from = hgt;
          if (lx === PER - 1) from = Math.min(from, fe);
          if (lx === 0) from = Math.min(from, fw);
          if (lz === PER - 1) from = Math.min(from, fs);
          if (lz === 0) from = Math.min(from, fn);
          for (let y = from; y < hgt; y++) {
            const edgeX = lx === 0 || lx === PER - 1, edgeZ = lz === 0 || lz === PER - 1;
            const along = edgeX && !edgeZ ? lz : lx;
            m.set(ox + lx, y, oz + lz, y % 8 === 0 || y % 8 === 7 ? '#4f545d' : along % 2 ? c2 : c1);
          }
          m.set(ox + lx, hgt - 1, oz + lz, (lx + lz * 3) % 7 === 0 ? '#4f545d' : c1);
        }
        continue;
      }
      if ((ch === '#' || ch === 'D') && indoor) {
        const hgt = this.tileHeight(tx, ty);
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          for (let y = 0; y < hgt; y++) m.set(ox + lx, y, oz + lz, y === hgt - 1 ? '#7a4f2e' : y < 2 ? '#c08a57' : '#f6e7d0');
        }
        if (ch === 'D') {
          // the front door, facing into the room (north face)
          m.box(ox + 1, 0, oz, ox + 6, 5, oz, '#5a3a24').box(ox + 2, 0, oz, ox + 5, 4, oz, '#8a5a3b');
          m.set(ox + 5, 2, oz - 1, '#ffd23f').box(ox + 2, 6, oz, ox + 5, 6, oz, '#ffb36b');
        }
        continue;
      }
      if (ch === '#' && nature) {
        // rock cliffs; jungle tops grow glowshrooms, ruins carry glowing runes
        const jungle = this.theme === 'jungle';
        const hgt = this.natureHeight(tx, ty);
        const rock = jungle ? ['#4a3f6b', '#54497a', '#5e5288'] : ['#6b6f99', '#767ba6', '#61658c'];
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (this.grid[ty + dy]?.[tx + dx] === '#' ? this.natureHeight(tx + dx, ty + dy) : 0));
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          let from = hgt - 1;
          if (lx === PER - 1) from = Math.min(from, nb[0]);
          if (lx === 0) from = Math.min(from, nb[1]);
          if (lz === PER - 1) from = Math.min(from, nb[2]);
          if (lz === 0) from = Math.min(from, nb[3]);
          for (let y = from; y < hgt; y++) {
            const r = hash(ox + lx + y * 31, oz + lz + y * 17);
            const edge = lx === 0 || lz === 0 || lx === PER - 1 || lz === PER - 1;
            let c = rock[Math.floor(r * rock.length)];
            if (y === hgt - 1) c = jungle ? (r > 0.3 ? '#3f9b4a' : '#5cc46a') : (r > 0.75 ? '#478a76' : c);
            else if (!jungle && edge && y === 3 && (lx + lz) % 3 === 0) c = '#62f4ff';
            else if (jungle && edge && y === hgt - 2 && r > 0.6) c = '#3f9b4a';
            m.set(ox + lx, y, oz + lz, c);
          }
        }
        if (jungle && hash(tx * 5, ty * 3) > 0.62) mushroom(ox + 3, oz + 3, hgt, 2 + Math.floor(hash(tx, ty * 9) * 3), 3.2, CAPS[Math.floor(hash(tx * 2, ty) * CAPS.length)]);
        continue;
      }
      if (ch === '#') {
        // colour by block so neighbouring tiles of one building match
        const pick = Math.floor(hash(Math.floor(tx / 3), Math.floor(ty / 2) + 7) * WALLS.length);
        const wall = WALLS[pick], roof = ROOFS[pick];
        const hgt = this.tileHeight(tx, ty);
        const nb = { e: [1, 0], w: [-1, 0], s: [0, 1], n: [0, -1] };
        const floorOf = {};
        for (const [k, [dx, dy]] of Object.entries(nb)) floorOf[k] = isB(tx + dx, ty + dy) ? this.tileHeight(tx + dx, ty + dy) : 0;
        for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          let from = hgt;
          if (lx === PER - 1) from = Math.min(from, floorOf.e);
          if (lx === 0) from = Math.min(from, floorOf.w);
          if (lz === PER - 1) from = Math.min(from, floorOf.s);
          if (lz === 0) from = Math.min(from, floorOf.n);
          for (let y = from; y < hgt; y++) {
            const edgeX = lx === 0 || lx === PER - 1, edgeZ = lz === 0 || lz === PER - 1;
            const along = edgeX && !edgeZ ? lz : lx;
            const isWindow = (edgeX !== edgeZ) && (along === 2 || along === 5 || along === 3 || along === 6)
              && (y % 6 === 3 || y % 6 === 4) && y < hgt - 3 && y > 1;
            const frame = (edgeX !== edgeZ) && y % 6 === 2 && y > 1 && y < hgt - 3 && along > 1 && along < 7;
            m.set(ox + lx, y, oz + lz, isWindow ? '#ffe58a' : frame ? '#ffffff' : y === hgt - 1 ? roof : wall);
          }
          if (from === hgt) m.set(ox + lx, hgt - 1, oz + lz, roof);
        }
        // parapet rim on the roof edge facing the street
        for (let l = 0; l < PER; l++) {
          if (!isB(tx, ty - 1)) m.set(ox + l, hgt, oz, roof);
          if (!isB(tx, ty + 1)) m.set(ox + l, hgt, oz + PER - 1, roof);
          if (!isB(tx - 1, ty)) m.set(ox, hgt, oz + l, roof);
          if (!isB(tx + 1, ty)) m.set(ox + PER - 1, hgt, oz + l, roof);
        }
      } else if (ch === 'B' && nature) {
        // tree stump with growth rings
        for (let y = 0; y < 4; y++) for (let lz = 1; lz < 7; lz++) for (let lx = 1; lx < 7; lx++) {
          const d = Math.hypot(lx - 3.5, lz - 3.5);
          if (d > 3) continue;
          m.set(ox + lx, y, oz + lz, y === 3 ? (Math.round(d) % 2 ? '#c08a57' : '#a8723f') : d > 2.3 ? '#5a3a24' : '#7a4f2e');
        }
        m.set(ox + 1, 4, oz + 3, '#3f9b4a').set(ox + 6, 3, oz + 5, '#3f9b4a');
      } else if (ch === 'B' && vault) {
        // a glass display case with a tiny artifact inside
        m.box(ox + 1, 0, oz + 1, ox + 6, 3, oz + 6, '#c9ced6').box(ox + 1, 4, oz + 1, ox + 6, 7, oz + 6, '#eef4ff');
        m.carve(ox + 2, 4, oz + 2, ox + 5, 6, oz + 5).box(ox + 3, 4, oz + 3, ox + 4, 5, oz + 4, PAINTS[Math.floor(hash(tx, ty) * PAINTS.length)]);
      } else if (ch === 'B' && moon) {
        for (let y = 0; y < 5; y++) for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          if ((lx - 3.5) ** 2 + (lz - 3.5) ** 2 + (y * 1.3) ** 2 > 12) continue;
          m.set(ox + lx, y, oz + lz, hash(lx + ox, lz + oz + y) > 0.7 ? '#c4b8e0' : '#9a8cbc');
        }
      } else if (ch === 'B' && wastes) {
        // a rounded boulder of grey glass
        for (let y = 0; y < 5; y++) for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          if ((lx - 3.5) ** 2 + (lz - 3.5) ** 2 + ((y - 1) * 1.4) ** 2 > 11) continue;
          m.set(ox + lx, y, oz + lz, hash(lx + ox, lz * y + oz) > 0.8 ? '#ffffff' : y > 2 ? '#c9b8ff' : '#9fe8ff');
        }
      } else if (ch === 'B' && docks && hash(tx * 3, ty * 7) > 0.45) {
        // paint barrels
        for (const [bx, bz, c] of [[2, 2, '#ff7a59'], [5, 3, '#3de0c8'], [3, 5, '#ffd000']]) {
          for (let y = 0; y < 6; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
            if (x * x + z * z > 5) continue;
            m.set(ox + bx + x, y, oz + bz + z, y === 1 || y === 4 ? '#4f545d' : y === 5 ? '#c08a57' : c);
          }
        }
      } else if (ch === 'B') {
        for (let y = 0; y < 6; y++) for (let lz = 1; lz < 7; lz++) for (let lx = 1; lx < 7; lx++) {
          const edge = (lx === 1 || lx === 6) + (lz === 1 || lz === 6) + (y === 0 || y === 5) >= 2;
          m.set(ox + lx, y, oz + lz, edge ? '#7a4f2e' : '#c08a57');
        }
      } else if (ch === 'L') {
        for (let y = 0; y < 9; y++) m.set(ox + 4, y, oz + 4, '#3a3f5c');
        m.box(ox + 3, 9, oz + 3, ox + 5, 9, oz + 5, '#3a3f5c').box(ox + 3, 8, oz + 3, ox + 5, 8, oz + 5, '#ffe58a');
        m.set(ox + 4, 8, oz + 4, '#3a3f5c');
      } else if (ch === 'Q') {
        // festival stall with a striped awning
        const stripe = PAINTS[Math.floor(hash(tx, ty) * PAINTS.length)];
        m.box(ox + 1, 0, oz + 3, ox + 6, 3, oz + 6, '#c08a57').box(ox + 1, 4, oz + 3, ox + 6, 4, oz + 6, '#e8c39a');
        for (const [px, pz] of [[1, 1], [6, 1], [1, 6], [6, 6]]) m.box(ox + px, 0, oz + pz, ox + px, 9, oz + pz, '#7a4f2e');
        for (let lx = 0; lx < PER; lx++) {
          const c = lx % 2 ? '#ffffff' : stripe;
          m.box(ox + lx, 10, oz, ox + lx, 10, oz + 7, c);
          if (lx > 0 && lx < 7) m.box(ox + lx, 11, oz + 1, ox + lx, 11, oz + 6, c);
        }
        for (let k = 0; k < 4; k++) m.set(ox + 2 + k, 5, oz + 4 + (k % 2), PAINTS[(k + tx) % PAINTS.length]);
      } else if (ch === 'P' && nature) {
        // glowshroom tree
        mushroom(ox + 3, oz + 3, 0, 9, 3.9, CAPS[Math.floor(hash(tx * 7, ty * 3) * CAPS.length)]);
      } else if (ch === 'P' && vault) {
        // marble statue of a famous cat on a plinth
        m.box(ox + 1, 0, oz + 1, ox + 6, 3, oz + 6, '#d9dce4').box(ox + 2, 4, oz + 2, ox + 5, 9, oz + 5, '#f4f4f8');
        m.box(ox + 2, 10, oz + 2, ox + 5, 13, oz + 5, '#f4f4f8').set(ox + 2, 14, oz + 3, '#f4f4f8').set(ox + 5, 14, oz + 3, '#f4f4f8');
        m.box(ox + 1, 2, oz + 6, ox + 6, 2, oz + 6, '#c4a35a');
      } else if (ch === 'P' && moon) {
        // an old Curator antenna
        m.box(ox + 2, 0, oz + 2, ox + 5, 1, oz + 5, '#80868f').box(ox + 3, 2, oz + 3, ox + 4, 16, oz + 4, '#b9bec6');
        m.box(ox + 1, 12, oz + 3, ox + 6, 12, oz + 4, '#b9bec6').box(ox + 3, 17, oz + 3, ox + 4, 17, oz + 4, '#f4f7ff');
      } else if (ch === 'R' && (vault || moon)) {
        // a fluted white column
        m.box(ox + 1, 0, oz + 1, ox + 6, 1, oz + 6, '#d9dce4').box(ox + 1, 15, oz + 1, ox + 6, 16, oz + 6, '#d9dce4');
        for (let y = 2; y < 15; y++) for (let lz = 1; lz < 7; lz++) for (let lx = 1; lx < 7; lx++) {
          const d = Math.hypot(lx - 3.5, lz - 3.5);
          if (d > 2.6) continue;
          m.set(ox + lx, y, oz + lz, d > 2 && (lx + lz) % 2 ? '#d9dce4' : '#f4f4f8');
        }
      } else if (ch === 'P' && wastes) {
        // a glass tree: bare and grey now, in leaf and blossom once the color comes back
        m.box(ox + 3, 0, oz + 3, ox + 4, 7, oz + 4, '#8a5a3b').box(ox + 1, 5, oz + 3, ox + 2, 6, oz + 3, '#8a5a3b').box(ox + 5, 6, oz + 4, ox + 6, 7, oz + 4, '#8a5a3b');
        for (let y = 8; y <= 12; y++) for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          if ((lx - 3.5) ** 2 + (lz - 3.5) ** 2 + ((y - 10) * 1.3) ** 2 > 12) continue;
          const r = hash(ox + lx * 5 + y, oz + lz * 3);
          m.set(ox + lx, y, oz + lz, r > 0.85 ? '#ff8fb1' : r > 0.75 ? '#ffe066' : r > 0.4 ? '#5cc46a' : '#3f9b4a');
        }
      } else if (ch === 'R' && wastes) {
        // a rusted drill rig from before the Bleach, its bit still sunk in the glass
        m.box(ox + 1, 0, oz + 1, ox + 6, 1, oz + 6, '#5a4a4a');
        for (let y = 2; y <= 16; y++) for (const [px, pz] of [[1, 1], [6, 1], [1, 6], [6, 6]]) if (y < 16 - (px > 3 ? 2 : 0)) m.set(ox + px, y, oz + pz, '#8a5a3b');
        m.box(ox + 1, 16, oz + 1, ox + 6, 16, oz + 6, '#7a4f2e').box(ox + 3, 2, oz + 3, ox + 4, 15, oz + 4, '#b9bec6').box(ox + 2, 10, oz + 2, ox + 5, 12, oz + 5, '#ff9a3d');
      } else if (ch === 'P' && docks) {
        // ship mast with a furled sail and a pennant
        m.box(ox + 2, 0, oz + 2, ox + 5, 1, oz + 5, '#7a4f2e').box(ox + 3, 2, oz + 3, ox + 4, 21, oz + 4, '#8a5a3b');
        m.box(ox, 15, oz + 3, ox + 7, 15, oz + 4, '#5a3a24').box(ox + 1, 13, oz + 3, ox + 6, 14, oz + 4, '#fff4e6');
        m.box(ox + 5, 19, oz + 4, ox + 8, 21, oz + 4, '#ff7a59').set(ox + 9, 20, oz + 4, '#ff7a59');
      } else if (ch === 'R' && docks) {
        // cargo crane: lattice tower, jib, counterweight and a hook
        m.box(ox + 1, 0, oz + 1, ox + 6, 2, oz + 6, '#4f545d');
        for (let y = 3; y <= 18; y++) for (const [px, pz] of [[2, 2], [5, 2], [2, 5], [5, 5]]) m.set(ox + px, y, oz + pz, '#ffd000');
        for (let y = 5; y <= 17; y += 4) m.box(ox + 2, y, oz + 2, ox + 5, y, oz + 5, '#e0b000');
        m.box(ox + 2, 15, oz + 6, ox + 5, 18, oz + 7, '#ff7a59').box(ox + 3, 16, oz + 8, ox + 4, 17, oz + 8, '#bfe9ff');
        m.box(ox - 6, 19, oz + 3, ox + 15, 20, oz + 4, '#ffd000').box(ox - 6, 17, oz + 2, ox - 3, 18, oz + 5, '#4f545d');
        m.box(ox + 14, 10, oz + 3, ox + 14, 18, oz + 3, '#3a3f5c').box(ox + 13, 8, oz + 2, ox + 15, 9, oz + 4, '#ff7a59');
      } else if (ch === 'R') {
        // ancient rune pillar
        m.box(ox + 1, 0, oz + 1, ox + 6, 1, oz + 6, '#61658c').box(ox + 2, 2, oz + 2, ox + 5, 11, oz + 5, '#7a7fab');
        m.box(ox + 2, 6, oz + 2, ox + 5, 6, oz + 5, '#62f4ff').box(ox + 1, 12, oz + 1, ox + 6, 12, oz + 6, '#61658c');
        if (hash(tx, ty) > 0.5) m.carve(ox + 5, 9, oz + 2, ox + 5, 12, oz + 3);
        if (this.theme === 'ruins') m.box(ox + 2, 12, oz + 2, ox + 4, 12, oz + 3, '#3f9b4a');
      } else if (ch === 'U') {
        // mural slab: an ancient painting on its south face
        m.box(ox, 0, oz + 3, ox + 7, 10, oz + 4, '#8a8fb8').box(ox, 11, oz + 3, ox + 7, 11, oz + 4, '#61658c');
        for (let y = 2; y <= 8; y++) for (let lx = 1; lx <= 6; lx++) {
          const edge = y === 2 || y === 8 || lx === 1 || lx === 6;
          m.set(ox + lx, y, oz + 5, edge ? '#fff5b8' : PAINTS[Math.floor(hash(tx * 9 + lx, ty * 4 + y) * PAINTS.length)]);
        }
      } else if (ch === 'P') {
        // planter tree
        m.box(ox + 2, 0, oz + 2, ox + 5, 2, oz + 5, '#d9825b').box(ox + 2, 2, oz + 2, ox + 5, 2, oz + 5, '#b8643e');
        m.box(ox + 3, 3, oz + 3, ox + 4, 6, oz + 4, '#7a4f2e');
        for (let y = 7; y <= 12; y++) for (let lz = 0; lz < PER; lz++) for (let lx = 0; lx < PER; lx++) {
          const d = (lx - 3.5) ** 2 + (lz - 3.5) ** 2 + ((y - 9.5) * 1.2) ** 2;
          if (d > 11.5) continue;
          const r = hash(ox + lx * 7 + y, oz + lz * 13);
          m.set(ox + lx, y, oz + lz, r > 0.9 ? '#ff8fb1' : r > 0.5 ? '#5cc46a' : '#3f9b4a');
        }
      } else if (ch === 'K') {
        // workbench with gadgets
        m.box(ox, 4, oz + 1, ox + 7, 4, oz + 6, '#c08a57');
        for (const [px, pz] of [[0, 1], [7, 1], [0, 6], [7, 6]]) m.box(ox + px, 0, oz + pz, ox + px, 3, oz + pz, '#7a4f2e');
        m.box(ox + 1, 5, oz + 2, ox + 3, 5, oz + 4, '#9fd2ff').box(ox + 5, 5, oz + 2, ox + 6, 7, oz + 3, '#4f545d').set(ox + 5, 8, oz + 2, '#62f4ff');
      } else if (ch === 'C') {
        // wardrobe with a tall mirror and a jacket on a hook
        m.box(ox + 1, 0, oz + 1, ox + 6, 12, oz + 3, '#8a5a3b').box(ox + 1, 12, oz + 1, ox + 6, 12, oz + 3, '#6b4429');
        m.box(ox + 2, 2, oz + 4, ox + 5, 10, oz + 4, '#c08a57').box(ox + 3, 3, oz + 4, ox + 4, 9, oz + 4, '#cfe8ff').set(ox + 3, 8, oz + 4, '#ffffff');
        m.box(ox + 1, 0, oz + 4, ox + 1, 1, oz + 5, '#6b4429').box(ox + 6, 0, oz + 4, ox + 6, 1, oz + 5, '#6b4429');
        m.box(ox + 7, 6, oz + 2, ox + 7, 9, oz + 3, '#6a4ce4').set(ox + 7, 10, oz + 2, '#ffd23f');
      } else if (ch === 'T') {
        // map table with Purrville spread out on it
        m.box(ox + 1, 4, oz + 1, ox + 6, 4, oz + 6, '#7a4f2e');
        for (const [px, pz] of [[1, 1], [6, 1], [1, 6], [6, 6]]) m.box(ox + px, 0, oz + pz, ox + px, 3, oz + pz, '#5a3a24');
        m.box(ox + 2, 5, oz + 2, ox + 5, 5, oz + 5, '#f4e3b5').set(ox + 3, 5, oz + 3, '#ff4f6d').set(ox + 4, 5, oz + 4, '#62a8ff').set(ox + 4, 6, oz + 3, '#ff4fd8');
      }
    }
    const meshed = meshModel(m, VOX);
    const geo = meshed.solid;
    // voxel (x,y,z) was meshed centred on x/z; shift so voxel (0,0) covers world [0, VOX]
    geo.translate(VOX / 2, 0, VOX / 2);
    const greyOf = (g) => {
      const full = g.getAttribute('color').array.slice();
      const grey = new Float32Array(full.length);
      const c = new THREE.Color();
      for (let i = 0; i < full.length; i += 3) {
        c.setRGB(full[i], full[i + 1], full[i + 2]);
        const lum = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
        c.setRGB(lum, lum, lum).lerp(GREY, 0.45);
        // keep a hint of the original hue: drained, not dead
        grey[i] = c.r * 0.8 + full[i] * 0.2; grey[i + 1] = c.g * 0.8 + full[i + 1] * 0.2; grey[i + 2] = c.b * 0.8 + full[i + 2] * 0.2;
      }
      if (!this.colorful) g.getAttribute('color').array.set(grey);
      return { full, grey, pos: g.getAttribute('position').array, attr: g.getAttribute('color'), t: new Float32Array(full.length / 3) };
    };
    if (meshed.glow) {
      meshed.glow.translate(VOX / 2, 0, VOX / 2);
      this.glowColors = greyOf(meshed.glow);
      this.sceneryGlow = new THREE.Mesh(meshed.glow, new THREE.MeshBasicMaterial({ vertexColors: true }));
      this.scene.add(this.sceneryGlow);
    }
    this.sceneryColors = greyOf(geo);
    this.scenery = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.scenery.castShadow = true;
    this.scenery.receiveShadow = true;
    this.scene.add(this.scenery);
  }

  buildBarrier() {
    const m = model();
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      if (this.grid[ty][tx] !== 'W') continue;
      const ox = tx * PER, oz = ty * PER;
      const horiz = this.grid[ty][tx - 1] === 'W' || this.grid[ty][tx + 1] === 'W';
      for (let l = 0; l < PER; l++) {
        const x = horiz ? ox + l : ox + 4, z = horiz ? oz + 4 : oz + l;
        if (l === 0) for (let y = 0; y < 7; y++) m.set(x, y, z, '#4f545d');
        else for (const y of [2, 4, 6]) m.set(x, y, z, '#f4f7ff');
      }
    }
    const meshed = meshModel(m, VOX);
    this.barrier = new THREE.Group();
    for (const g of [meshed.solid, meshed.glow]) {
      if (!g) continue;
      g.translate(VOX / 2, 0, VOX / 2);
      this.barrier.add(new THREE.Mesh(g, g === meshed.glow ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true })));
    }
    this.scene.add(this.barrier);
  }

  /** A shattered glass pane or geode becomes floor. */
  breakTile(tx, ty) {
    this.grid[ty][tx] = '.';
    this.flowFrom = -1;
  }

  /** Static rifts crackle: a noise texture over every rift tile, jittered each frame. */
  buildRifts() {
    const pos = [], uv = [];
    this.grid.forEach((row, ty) => row.forEach((ch, tx) => {
      if (ch !== WATER) return;
      const x0 = tx * TILE, z0 = ty * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
      pos.push(x0, 0.04, z0, x0, 0.04, z1, x1, 0.04, z1, x0, 0.04, z0, x1, 0.04, z1, x1, 0.04, z0);
      uv.push(tx, ty, tx, ty + 1, tx + 1, ty + 1, tx, ty, tx + 1, ty + 1, tx + 1, ty);
    }));
    if (!pos.length) return;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.82 ? '#ffffff' : v > 0.6 ? '#9aa0b8' : v > 0.4 ? '#4b4f66' : 'rgba(0,0,0,0)';
      ctx.fillRect(x, y, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    tex.repeat.set(0.5, 0.5);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    this.rift = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false }));
    this.scene.add(this.rift);
  }

  updateRift() {
    if (this.rift) this.rift.material.map.offset.set(Math.random(), Math.random());
  }

  /** Remove the barrier from collision; returns the opened tile centres. */
  openBarrier() {
    const opened = [];
    this.grid.forEach((row, ty) => row.forEach((ch, tx) => {
      if (ch !== 'W') return;
      row[tx] = '.';
      opened.push({ x: (tx + 0.5) * TILE, z: (ty + 0.5) * TILE });
    }));
    this.flowFrom = -1;
    return opened;
  }

  dispose() {
    for (const obj of [this.groundMesh, this.scenery, this.sceneryGlow, this.rift, ...this.barrier.children]) {
      if (!obj) continue;
      obj.geometry.dispose();
      obj.material.dispose();
    }
    this.groundTex.dispose();
  }

  // ---------- the colour wave ending ----------

  /** Bring the color back to one round patch for good (a smashed jar of stolen color). */
  colorSpot(cx, cz, radius) {
    this.colorWave(cx, cz, radius, 4);
    const ctx = this.groundCtx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx * PX, cz * PX, radius * PX, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.75; // the wave still has something left to finish
    ctx.drawImage(this.groundColor, 0, 0);
    ctx.restore();
    this.markGround(cx, cz, radius);
  }

  /** Recolour everything within `radius` of (cx, cz). Call each frame while the wave grows. */
  colorWave(cx, cz, radius, band = 10) {
    for (const set of [this.sceneryColors, this.glowColors]) {
      if (!set) continue;
      const { full, grey, pos, attr, t: tt } = set;
      const arr = attr.array, r2 = radius * radius;
      let changed = false;
      for (let i = 0, v = 0; i < pos.length; i += 3, v++) {
        if (tt[v] >= 1) continue; // already fully coloured
        const dx = pos[i] - cx, dz = pos[i + 2] - cz, d2 = dx * dx + dz * dz;
        if (d2 > r2) continue;
        const t = Math.max(tt[v], Math.min(1, (radius - Math.sqrt(d2)) / band));
        if (t === tt[v]) continue;
        tt[v] = t;
        changed = true;
        arr[i] = grey[i] + (full[i] - grey[i]) * t;
        arr[i + 1] = grey[i + 1] + (full[i + 1] - grey[i + 1]) * t;
        arr[i + 2] = grey[i + 2] + (full[i + 2] - grey[i + 2]) * t;
      }
      if (changed) attr.needsUpdate = true;
    }
    const ctx = this.groundCtx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx * PX, cz * PX, radius * PX, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(this.groundColor, 0, 0);
    ctx.restore();
    this.markGround(cx, cz, radius);
  }
}
