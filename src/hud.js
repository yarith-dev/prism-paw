import { drawMap } from './minimap.js';
import { portrait, SPEAKER_PORTRAIT } from './portraits.js';
import { ITEMS, ITEM_ORDER } from './data/shop.js';

const $ = (sel, root = document) => root.querySelector(sel);

const SPEAKER_COLOR = {
  Nova: '#ff9a3d', Smudge: '#7ef0c8', Pip: '#ffd23f', 'Mrs. Biscuit': '#ff8fb1',
  'Conductor Mittens': '#9fb4ff', 'Old Tom': '#ffcf8f', Townscat: '#c6a8ff',
  'Ranger Fern': '#8cff7a', 'Professor Moss': '#ffe3b3', 'Old Wick': '#e8ff7a',
  'Captain Saffron': '#ff9a6b', Juno: '#7ef0c8', 'Bosun Gale': '#ffd000', Dockhand: '#c6a8ff',
  'Prospector Quartz': '#ffcf8f', Dot: '#ff9a3d',
  'The Curator': '#e6ecf8', Echo: '#b9bec6', Docent: '#ffe58a', Exhibit: '#c6a8ff',
};

/** In-game heads-up display. Menus and screens live in screens.js. */
export class Hud {
  constructor() {
    this.root = $('#hud');
    this.dialogue = $('.dialogue', this.root);
    this.mini = $('.minimap canvas', this.root);
    this.miniCtx = this.mini.getContext('2d');
    this.queue = [];
    this.lineTimer = 0;
    this.toastTimer = 0;
    this.handlers = {};
    // weapon button: tap cycles; press and hold opens a picker of every loaded weapon
    const wb = $('.weapon', this.root);
    let holdTimer = null, held = false;
    wb.addEventListener('pointerdown', () => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { held = true; this.openWeaponPicker(); }, 350);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) wb.addEventListener(ev, () => clearTimeout(holdTimer));
    wb.addEventListener('click', () => { if (held) { held = false; return; } this.closeWeaponPicker(); this.handlers.weapon?.(); });
    wb.addEventListener('contextmenu', (e) => e.preventDefault());
    $('.pause-btn', this.root).addEventListener('click', () => this.handlers.pause?.());
    $('.map-btn', this.root).addEventListener('click', () => this.handlers.map?.());
    $('.minimap', this.root).addEventListener('click', () => this.handlers.map?.()); // tap the minimap for the full map
    // compact (phone) HUD shows only the current objective; tap to see them all
    $('.objectives', this.root).addEventListener('click', (e) => e.currentTarget.classList.toggle('open'));
    $('.prompt', this.root).addEventListener('click', () => this.handlers.interact?.());
    this.dialogue.addEventListener('click', () => this.nextLine());
    const items = $('.items', this.root);
    for (const id of ITEM_ORDER) {
      const b = document.createElement('button');
      b.className = 'item';
      b.dataset.id = id;
      b.innerHTML = `<i class="icon-${id}"></i><b>0</b><small>${ITEMS[id].key}</small>`;
      b.title = `${ITEMS[id].name} (${ITEMS[id].key})`;
      b.addEventListener('click', () => this.handlers.item?.(id));
      items.appendChild(b);
    }
  }

  on(name, fn) { this.handlers[name] = fn; }

  /** A row of loaded weapons above the weapon button (from the `weaponList` handler). */
  openWeaponPicker() {
    const list = this.handlers.weaponList?.() || [];
    if (list.length < 2) return;
    this.closeWeaponPicker();
    const el = document.createElement('div');
    el.className = 'weapon-picker';
    for (const w of list) {
      const b = document.createElement('button');
      b.className = w.current ? 'on' : '';
      b.innerHTML = `<span class="dot" style="background:${w.color}"></span>${w.name}<small>${Number.isFinite(w.ammo) ? w.ammo : '∞'}</small>`;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.handlers.selectWeapon?.(w.id); this.closeWeaponPicker(); });
      el.appendChild(b);
    }
    $('.bottom-right', this.root).prepend(el);
    this.picker = el;
    this.pickerTimer = setTimeout(() => this.closeWeaponPicker(), 4000);
  }

  closeWeaponPicker() {
    clearTimeout(this.pickerTimer);
    this.picker?.remove();
    this.picker = null;
  }

  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }

  reset(isHub) {
    this.queue = [];
    this.lineTimer = 0;
    this.dialogue.classList.add('hidden');
    this.setCharge(null);
    this.setChannel(null);
    this.setPrompt(null);
    this.setBoss(null);
    this.root.classList.toggle('hub', !!isHub);
    this.show();
  }

  setLevel(name, place) {
    $('.level-name', this.root).textContent = name;
    $('.level-place', this.root).textContent = place;
  }

  setHealth(hp, max) {
    const t = Math.max(0, hp / max);
    const fill = $('.hp-fill', this.root);
    fill.style.width = `${t * 100}%`;
    fill.classList.toggle('low', t < 0.35);
    $('.hp-text', this.root).textContent = `${Math.ceil(hp)} / ${max}`;
  }

  setSparks(n) { $('.sparks b', this.root).textContent = n; }

  setSeeds(n, total) {
    const el = $('.seeds', this.root);
    el.classList.toggle('hidden', n === null);
    if (n !== null) $('b', el).textContent = `${n}/${total}`;
  }

  setWeapon(name, ammo, color, canSwap) {
    $('.wname', this.root).textContent = name;
    $('.ammo', this.root).textContent = Number.isFinite(ammo) ? ammo : '∞';
    $('.weapon .dot', this.root).style.background = color;
    $('.weapon', this.root).classList.toggle('can-swap', canSwap);
  }

  setItems(items, disabled) {
    for (const b of this.root.querySelectorAll('.item')) {
      const n = items[b.dataset.id] || 0;
      $('b', b).textContent = n;
      b.classList.toggle('empty', n <= 0 || disabled);
    }
  }

  setObjectives(list) {
    const ul = $('.objectives ul', this.root);
    const html = list.map(([t, d]) => `${d ? 1 : 0}${t}`).join('|');
    if (ul.dataset.v === html) return;
    ul.dataset.v = html;
    ul.replaceChildren(...list.map(([text, done]) => {
      const li = document.createElement('li');
      li.textContent = text;
      if (done) li.className = 'done';
      return li;
    }));
    ul.classList.remove('pulse');
    void ul.offsetWidth;
    ul.classList.add('pulse');
  }

  setCharge(t) {
    const el = $('.charge', this.root);
    el.classList.toggle('hidden', t === null);
    if (t !== null) $('.bar div', el).style.width = `${t * 100}%`;
  }

  /** Boss health bar with one pip per color tank; null hides it. */
  setBoss(name, frac = 0, tanks = [], gradient = null) {
    const el = $('.bossbar', this.root);
    el.classList.toggle('hidden', !name);
    if (!name) return;
    $('label', el).textContent = name;
    $('.bar div', el).style.width = `${Math.max(0, frac) * 100}%`;
    $('.bar div', el).style.background = gradient || '';
    $('.tanks', el).innerHTML = tanks.map((c) => `<i style="${c ? `background:${c};box-shadow:0 0 8px ${c}` : ''}"></i>`).join('');
  }

  setChannel(label, t = 0) {
    const el = $('.channel', this.root);
    el.classList.toggle('hidden', !label);
    if (label) {
      $('label', el).textContent = label;
      $('.bar div', el).style.width = `${Math.min(1, t) * 100}%`;
    }
  }

  setPrompt(label, touch) {
    const el = $('.prompt', this.root);
    if (!label) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const text = `${touch ? 'Tap' : 'E'} · ${label}`;
    if (el.textContent !== text) el.textContent = text;
  }

  drawMinimap(game) {
    const c = this.mini, dpr = Math.min(devicePixelRatio, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    this.miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap(this.miniCtx, game, w, h, { small: true });
  }

  say(lines) {
    this.queue.push(...lines);
    while (this.queue.length > 4) this.queue.shift();
    if (this.lineTimer <= 0) this.nextLine();
  }

  nextLine() {
    const line = this.queue.shift();
    if (!line) { this.dialogue.classList.add('hidden'); this.lineTimer = 0; return; }
    const [who, text] = line;
    const face = $('.face', this.dialogue);
    const key = SPEAKER_PORTRAIT[who];
    face.style.backgroundImage = key ? `url(${portrait(key)})` : '';
    face.classList.toggle('hidden', !key);
    $('.who', this.dialogue).textContent = who;
    $('.who', this.dialogue).style.color = SPEAKER_COLOR[who] || (who.startsWith('Grandpa') ? '#62f4ff' : '#ffffff');
    $('.text', this.dialogue).textContent = text;
    this.dialogue.classList.remove('hidden', 'pop');
    void this.dialogue.offsetWidth;
    this.dialogue.classList.add('pop');
    this.lineTimer = Math.max(2.4, text.length * 0.055);
  }

  clearDialogue() {
    this.queue = [];
    this.lineTimer = 0;
    this.dialogue.classList.add('hidden');
  }

  toast(text, seconds = 1.6) {
    const el = $('.toast', this.root);
    el.textContent = text;
    el.classList.add('show');
    this.toastTimer = seconds;
  }

  flashDamage() {
    const el = $('#damage');
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }

  update(dt) {
    if (this.lineTimer > 0) {
      this.lineTimer -= dt;
      if (this.lineTimer <= 0) this.nextLine();
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) $('.toast', this.root).classList.remove('show');
    }
  }
}
