import { portrait, renderNova, renderSmudge } from './portraits.js';
import { Stage } from './stage.js';
import { settings, TEXT_SPEEDS } from './settings.js';
import { THEMES } from './music.js';
import { WARDROBE, SLOTS, GROUPS, DEFAULT_LOOK, resolveLook, loadOutfits, storeOutfits } from './data/wardrobe.js';
import { novaMeshes, smudgeMesh } from './models.js';
import { drawMap, MAP_LEGEND } from './minimap.js';
import { WEAPONS, UPGRADES, ITEMS, ITEM_ORDER } from './data/shop.js';
import { WORLDS, COMICS, STORY_ORDER } from './data/story.js';

const MAP_ART = {
  purrville: `
    <rect width="100" height="70" fill="#4b34b3"/>
    <path d="M0 52 C 18 46, 30 60, 48 54 S 78 40, 100 46 L100 58 C 80 52, 62 66, 46 64 S 16 58, 0 62 Z" fill="#62a8ff" opacity=".85"/>
    <g fill="#6a4ce4"><rect x="22" y="30" width="22" height="18" rx="3"/><rect x="50" y="52" width="20" height="16" rx="3"/>
      <rect x="64" y="16" width="22" height="22" rx="3"/><rect x="6" y="60" width="20" height="9" rx="3"/><rect x="82" y="38" width="16" height="22" rx="3"/></g>
    <g fill="#5cc46a" opacity=".8"><circle cx="12" cy="20" r="6"/><circle cx="50" cy="12" r="5"/><circle cx="92" cy="12" r="5"/></g>`,
  jungle: `
    <rect width="100" height="70" fill="#0f3a36"/>
    <path d="M38 0 C 34 18, 46 30, 40 46 S 44 62, 40 70 L48 70 C 52 60, 48 50, 50 42 S 44 18, 46 0 Z" fill="#1f8fc4" opacity=".9"/>
    <g fill="#1f6b5a"><circle cx="14" cy="18" r="11"/><circle cx="72" cy="14" r="12"/><circle cx="86" cy="52" r="13"/><circle cx="20" cy="50" r="9"/><circle cx="64" cy="54" r="8"/></g>
    <g opacity=".9"><circle cx="10" cy="14" r="2.4" fill="#ff6fd8"/><circle cx="70" cy="10" r="2.6" fill="#62e0ff"/><circle cx="90" cy="48" r="2.4" fill="#b48cff"/>
      <circle cx="24" cy="52" r="2" fill="#ffb21f"/><circle cx="60" cy="56" r="2" fill="#ff6fd8"/><circle cx="78" cy="20" r="1.8" fill="#ffb21f"/></g>
    <g fill="#7a7fab" opacity=".85"><rect x="47" y="20" width="10" height="7" rx="1"/><rect x="50" y="17" width="4" height="3"/></g>`,
  docks: `
    <defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc6ff"/><stop offset="1" stop-color="#ffb3c8"/></linearGradient></defs>
    <rect width="100" height="70" fill="url(#dsky)"/>
    <g fill="#ffffff" opacity=".8"><ellipse cx="14" cy="14" rx="12" ry="4"/><ellipse cx="62" cy="8" rx="14" ry="4"/><ellipse cx="84" cy="64" rx="13" ry="4"/><ellipse cx="34" cy="62" rx="10" ry="3"/></g>
    <g fill="#d6996b"><rect x="14" y="34" width="22" height="16" rx="2"/><rect x="38" y="16" width="18" height="12" rx="2"/><rect x="60" y="38" width="20" height="14" rx="2"/><rect x="80" y="14" width="14" height="12" rx="2"/></g>
    <g stroke="#8a5a3b" stroke-width="1.2"><line x1="36" y1="40" x2="40" y2="26"/><line x1="56" y1="22" x2="62" y2="40"/><line x1="80" y1="44" x2="86" y2="26"/></g>
    <g fill="#ff7a59"><rect x="17" y="37" width="5" height="4"/><rect x="64" y="41" width="5" height="4"/></g><g fill="#3de0c8"><rect x="24" y="37" width="5" height="4"/><rect x="42" y="19" width="5" height="4"/></g>
    <path d="M48 56 q 8 -6 16 0 q -8 5 -16 0 z M46 56 l -4 -3 l 0 6 z" fill="#5f7fe0" opacity=".85"/>`,
  pale: `
    <rect width="100" height="70" fill="#0b0d1a"/>
    <g fill="#ffffff"><circle cx="8" cy="10" r=".5"/><circle cx="30" cy="6" r=".4"/><circle cx="62" cy="12" r=".6"/><circle cx="90" cy="8" r=".5"/><circle cx="76" cy="22" r=".4"/><circle cx="16" cy="30" r=".4"/></g>
    <circle cx="52" cy="78" r="46" fill="#d9dce4"/>
    <g fill="#b9bec6"><circle cx="30" cy="52" r="5"/><circle cx="70" cy="58" r="7"/><circle cx="52" cy="44" r="3"/><circle cx="80" cy="44" r="3.5"/></g>
    <path d="M78 30 h18 v10 h-18 z M80 30 l7 -8 l7 8" fill="#f4f7ff" stroke="#9dfbff" stroke-width=".5"/>
    <circle cx="87" cy="35" r="3" fill="none" stroke="#c9ced6" stroke-width="1.2"/>
    <circle cx="8" cy="62" r="5" fill="#62a8ff"/><path d="M6 60 q2 -1 4 1 q-1 2 -3 2 z" fill="#5cc46a"/>`,
  wastes: `
    <defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6878"/><stop offset="1" stop-color="#b7bcc8"/></linearGradient></defs>
    <rect width="100" height="70" fill="url(#wsky)"/>
    <path d="M0 50 L14 46 L30 52 L46 44 L62 50 L80 42 L100 48 L100 70 L0 70 Z" fill="#aeb3c0"/>
    <path d="M8 30 L22 64 M54 8 L42 40 L50 66 M78 20 L86 56" stroke="#16141f" stroke-width="1.6" fill="none"/>
    <g fill="#c9b8ff" opacity=".9"><path d="M18 40 l3 -12 l3 12 z"/><path d="M64 34 l2 -9 l2 9 z"/><path d="M36 24 l3 -10 l3 10 z"/><path d="M92 38 l2 -8 l2 8 z"/></g>
    <path d="M84 30 l6 -14 l6 14 l-6 6 z" fill="#9fe8ff" stroke="#9dfbff" stroke-width=".6"/>
    <g fill="#8cff7a"><circle cx="24" cy="58" r="1.6"/><circle cx="48" cy="40" r="1.4"/><circle cx="70" cy="56" r="1.6"/></g>`,
};
import { save } from './save.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtTime = (t) => { t = Math.round(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/** Full-screen overlays: one at a time inside #overlay. */
export class Screens {
  constructor(sfx) {
    this.el = $('#overlay');
    this.sfx = sfx;
    this.current = null;
    this.keyHandler = null;
    addEventListener('keydown', (e) => this.keyHandler?.(e));
  }

  get open() { return this.el.classList.contains('show'); }

  mount(kind, html) {
    this.el.className = `show kind-${kind}`;
    this.el.innerHTML = html;
    this.current = kind;
    this.keyHandler = null;
    return this.el;
  }

  close() {
    this.el.className = '';
    this.el.innerHTML = '';
    this.current = null;
    this.keyHandler = null;
  }

  buttons(box, list) {
    for (const [label, fn, primary] of list) {
      const b = document.createElement('button');
      b.textContent = label;
      if (primary) b.className = 'primary';
      b.addEventListener('click', () => { this.sfx.pickup(); fn(); });
      box.appendChild(b);
    }
    box.querySelector('button')?.focus();
  }

  // ---------------------------------------------------------------- title

  title({ hasSave, touch, onContinue, onNew }) {
    const controls = touch
      ? '<p class="controls"><b>Left thumb</b> move · <b>Right thumb</b> aim &amp; fire · tap buttons for items</p>'
      : '<p class="controls"><b>WASD</b> move · <b>Mouse</b> aim/fire · <b>E</b> talk · <b>Q</b> weapon · <b>H G B</b> items · <b>M</b> map</p>';
    const el = this.mount('title', `
      <div class="panel">
        <div class="logo"><span>PRISM</span><span>PAW</span></div>
        <p class="tag">The Curator's robots have drained Purrville grey.<br>Grandpa has been carried off to the moon. Grab the blaster. Bring him home.</p>
        <div class="level-card"><small>STORY MODE</small><b>${save.data.cleared['5-4'] ? 'All worlds clear · Hunt the Color Seeds' : save.data.unlocked.includes('5-1') ? 'Chapter 5 · Pale, the Moon Vault' : save.data.unlocked.includes('4-1') ? 'Chapter 4 · The Static Wastes' : save.data.unlocked.includes('3-1') ? 'Chapter 3 · Coral Sky Docks' : save.data.unlocked.includes('2-1') ? 'Chapter 2 · Glowshroom Jungle' : 'Chapter 1 · Purrville'}</b></div>
        ${controls}
        <div class="buttons"></div>
      </div>`);
    const list = hasSave
      ? [['Continue', onContinue, true], ['New game', () => this.confirm('Start over? Your Sparks, upgrades and progress will be erased.', onNew, () => this.title({ hasSave, touch, onContinue, onNew }))]]
      : [['Story mode', onNew, true]];
    const back = () => this.title({ hasSave, touch, onContinue, onNew });
    if (STORY_ORDER.some(([id]) => save.data.seen?.[`comic:${id}`])) list.push(['Story so far', () => this.storyBook(back)]);
    list.push(['Settings', () => this.settings(back)]);
    this.buttons($('.buttons', el), list);
  }

  /** Nova's wardrobe: a turntable preview, group and slot tabs, swatches or 3D thumbnails, saved outfits. */
  wardrobe({ look, isUnlocked, onChange, onClose }) {
    look = { ...look };
    let group = 'Body', tab = 'fur', saving = false;
    let outfits = loadOutfits();
    const el = this.mount('wardrobe', `
      <div class="wardrobe">
        <div class="wr-preview"><canvas class="stage"></canvas><b></b></div>
        <div class="wr-panel">
          <h2>Wardrobe</h2>
          <div class="wr-groups">${GROUPS.map((g) => `<button data-group="${g}">${g}</button>`).join('')}</div>
          <div class="wr-tabs"></div>
          <div class="wr-options"></div>
          <p class="wr-hint"></p>
          <div class="wr-outfits"></div>
          <div class="buttons"></div>
        </div>
      </div>`);
    const stage = new Stage($('canvas.stage', el));
    stage.keepTime = true;
    const restage = () => {
      const smudge = group === 'Smudge';
      $('.wr-preview > b', el).textContent = smudge ? 'Smudge' : 'Nova';
      stage.show({ set: 'workshop', shot: 'turntable', mood: 'warm', spin: true, cast: [smudge ? 'smudge' : 'nova'] });
      stage.start();
    };
    // how each slot's thumbnails frame Nova: [framing, yaw]
    const VIEW = { pattern: ['head', 0.5], tail: ['lower', 2.1], back: ['full', 2.5], blaster: ['lower', -1.25], top: ['full', -0.35], neck: ['full', -0.35], shoes: ['lower', -0.35], bottoms: ['lower', -0.35], gloves: ['lower', -0.9], ears: ['face', -0.5], eyeShape: ['face', 0], eyewear: ['face', -0.3], hat: ['face', -0.4], hair: ['face', -0.7], face: ['face', 0] };
    let thumbJob = 0;
    const thumbs = () => {
      const job = ++thumbJob, slot = tab;
      const [framing, yaw] = VIEW[slot] || ['head', -0.35];
      const imgs = [...el.querySelectorAll('.wr-options img[data-id]')];
      const step = () => {
        if (job !== thumbJob || !imgs.length || !el.isConnected) return;
        const img = imgs.shift();
        const trial = resolveLook({ ...look, [slot]: img.dataset.id }, save);
        const key = JSON.stringify(trial);
        img.src = WARDROBE[slot].target === 'smudge' ? renderSmudge(`wrs:${key}`, smudgeMesh(trial)) : renderNova(`wr:${key}:${framing}:${yaw}`, novaMeshes(trial), framing, yaw);
        setTimeout(step, 0);
      };
      step();
    };
    const apply = () => { onChange({ ...look }); restage(); draw(); };
    const swatchBg = (o) => {
      const c = Object.values(o.colors);
      if (c.length === 1) return c[0];
      if (c.length === 2) return `linear-gradient(135deg, ${c[0]} 55%, ${c[1]} 55%)`;
      return `linear-gradient(135deg, ${c.map((x, i) => `${x} ${(i * 100) / c.length}% ${((i + 1) * 100) / c.length}%`).join(', ')})`;
    };
    const chips = (o) => Object.values(o.colors).map((c) => `<i style="background:${c}"></i>`).join('') || '<i class="none"></i>';
    const drawOutfits = () => {
      $('.wr-outfits', el).innerHTML = `<span>Outfits</span>${outfits.map((o, i) => `<button data-slot="${i}" class="${saving ? 'saving' : ''}">${saving ? `Save to ${i + 1}` : o ? `Wear ${i + 1}` : `Empty ${i + 1}`}</button>`).join('')}<button class="save ${saving ? 'on' : ''}">${saving ? 'Cancel' : 'Save…'}</button>`;
    };
    const draw = () => {
      el.querySelectorAll('.wr-groups button').forEach((b) => b.classList.toggle('on', b.dataset.group === group));
      const slots = SLOTS.filter((s) => WARDROBE[s].group === group);
      $('.wr-tabs', el).innerHTML = slots.map((s) => `<button data-slot="${s}" class="${s === tab ? 'on' : ''}">${esc(WARDROBE[s].label)}</button>`).join('');
      const slot = WARDROBE[tab];
      const box = $('.wr-options', el);
      box.className = `wr-options ${slot.items ? 'items' : 'swatches'}`;
      box.innerHTML = slot.options.map((o) => {
        const open = isUnlocked(o);
        const on = look[tab] === o.id;
        if (!slot.items) return `<button class="${on ? 'on' : ''}" data-id="${o.id}" title="${esc(o.name)}" style="background:${swatchBg(o)}" ${open ? '' : 'disabled'}></button>`;
        const pic = !open ? '<i class="lock"></i>' : slot.chips ? `<span class="chips">${chips(o)}</span>` : `<img alt="" data-id="${o.id}">`;
        return `<button class="${on ? 'on' : ''}" data-id="${o.id}" ${open ? '' : 'disabled'}>${pic}<span>${open ? esc(o.name) : 'Locked'}</span><small>${open ? '' : esc(o.hint)}</small></button>`;
      }).join('');
      const cur = slot.options.find((o) => o.id === look[tab]) || slot.options[0];
      $('.wr-hint', el).textContent = `${slot.label}: ${cur.name}${slot.chips ? ' (shows while you run)' : tab === 'palette' ? ' (the color of every paint splat)' : ''}`;
      drawOutfits();
      if (slot.items && !slot.chips) thumbs();
    };
    el.querySelector('.wr-groups').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this.sfx.pickup();
      const wasSmudge = group === 'Smudge';
      group = b.dataset.group;
      tab = SLOTS.find((s) => WARDROBE[s].group === group);
      draw();
      if (wasSmudge !== (group === 'Smudge')) restage();
    });
    el.querySelector('.wr-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this.sfx.pickup();
      tab = b.dataset.slot;
      draw();
    });
    $('.wr-options', el).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      this.sfx.pickup();
      look[tab] = b.dataset.id;
      apply();
    });
    $('.wr-outfits', el).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this.sfx.pickup();
      if (b.classList.contains('save')) { saving = !saving; drawOutfits(); return; }
      const i = Number(b.dataset.slot);
      if (saving) { outfits[i] = { ...look }; storeOutfits(outfits); saving = false; drawOutfits(); return; }
      if (outfits[i]) { look = { ...DEFAULT_LOOK, ...outfits[i] }; apply(); }
    });
    const done = () => { thumbJob++; stage.dispose(); this.close(); onClose(); };
    this.buttons($('.buttons', el), [
      ['Done', done, true],
      ['Surprise me', () => {
        for (const s of SLOTS) {
          const open = WARDROBE[s].options.filter(isUnlocked);
          look[s] = open[Math.floor(Math.random() * open.length)].id;
        }
        apply();
      }],
      ['Reset', () => { look = { ...DEFAULT_LOOK }; apply(); }],
    ]);
    this.keyHandler = (e) => { if (e.code === 'Escape') { e.preventDefault(); done(); } };
    draw();
    restage();
  }

  /** Volume, screen shake and comic text speed. */
  settings(onBack) {
    const pct = (v) => `${Math.round(v * 100)}%`;
    const el = this.mount('menu', `
      <div class="panel settings">
        <h2>Settings</h2>
        <label class="setting"><span>Music</span><input type="range" min="0" max="1" step="0.05" data-key="music"><b></b></label>
        <div class="setting"><span>Music theme</span><div class="seg" data-key="musicTheme">${Object.entries(THEMES).map(([k, s]) => `<button data-v="${k}">${s.label}</button>`).join('')}</div></div>
        <label class="setting"><span>Sound effects</span><input type="range" min="0" max="1" step="0.05" data-key="sfx"><b></b></label>
        <div class="setting"><span>Graphics</span><div class="seg" data-key="graphics"><button data-v="auto">Auto</button><button data-v="sharp">Sharp</button><button data-v="fast">Fast</button></div></div>
        <div class="setting"><span>Screen shake</span><div class="seg" data-key="shake"><button data-v="on">On</button><button data-v="off">Off</button></div></div>
        <div class="setting"><span>Comic text</span><div class="seg" data-key="textSpeed">${Object.keys(TEXT_SPEEDS).map((k) => `<button data-v="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
        <div class="buttons"></div>
      </div>`);
    for (const input of el.querySelectorAll('input[type=range]')) {
      const key = input.dataset.key, out = input.nextElementSibling;
      input.value = settings[key];
      out.textContent = pct(settings[key]);
      input.addEventListener('input', () => { settings.set(key, Number(input.value)); out.textContent = pct(settings[key]); });
      if (key === 'sfx') input.addEventListener('change', () => this.sfx.pickup());
    }
    for (const seg of el.querySelectorAll('.seg')) {
      const key = seg.dataset.key;
      const sync = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', key === 'shake' ? (b.dataset.v === 'on') === settings.shake : b.dataset.v === settings[key]));
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        this.sfx.pickup();
        settings.set(key, key === 'shake' ? b.dataset.v === 'on' : b.dataset.v);
        sync();
      });
      sync();
    }
    this.buttons($('.buttons', el), [['Back', onBack, true]]);
  }

  /** Replay any comic the player has already seen. */
  storyBook(onBack) {
    const el = this.mount('menu', '<div class="panel story-book"><h2>Story so far</h2><div class="story-list"></div><div class="buttons"></div></div>');
    const box = $('.story-list', el);
    for (const [id, label] of STORY_ORDER) {
      const seen = !!save.data.seen?.[`comic:${id}`];
      if (!seen && id === 'ending-true') continue;
      const b = document.createElement('button');
      b.textContent = seen ? label : '? ? ?';
      b.disabled = !seen;
      b.addEventListener('click', () => { this.sfx.pickup(); this.comic(COMICS[id], () => this.storyBook(onBack)); });
      box.appendChild(b);
    }
    this.buttons($('.buttons', el), [['Back', onBack, true]]);
  }

  confirm(text, yes, no) {
    const el = this.mount('menu', `<div class="panel"><h2>Are you sure?</h2><p class="tag">${esc(text)}</p><div class="buttons"></div></div>`);
    this.buttons($('.buttons', el), [['Yes, start over', yes, true], ['Cancel', no]]);
  }

  // ---------------------------------------------------------------- comic

  comic(panels, onDone) {
    let i = 0, typing = null;
    const el = this.mount('comic', `
      <div class="comic-frame"><div class="fx"></div><canvas class="stage"></canvas><div class="art"></div><div class="fx front"></div><b class="comic-sfx"></b></div>
      <div class="comic-caption"><b class="speaker"></b><p></p></div>
      <div class="comic-nav"><div class="dots"></div><button class="skip">Skip</button><button class="primary next">Next ▸</button></div>`);
    const dots = $('.dots', el);
    dots.innerHTML = panels.map(() => '<i></i>').join('');
    const text = $('.comic-caption p', el);
    const stage = new Stage($('canvas.stage', el));
    const FRONT = ['confetti', 'beams', 'static', 'wind', 'spores', 'bloom', 'holo'];
    // the caption types itself out; a click first finishes the line, the next one turns the page
    const finish = () => { clearInterval(typing); typing = null; text.textContent = panels[i].caption; };
    const render = () => {
      const p = panels[i];
      const frame = $('.comic-frame', el);
      frame.style.background = p.bg;
      const staged = stage.show(p);
      frame.classList.toggle('staged', staged);
      frame.classList.toggle('titled', !!p.title);
      // with a 3D stage, weather-like fx draw over the scene and sky-like fx behind it
      $('.fx', el).className = `fx ${staged && FRONT.includes(p.fx) ? '' : p.fx || ''}`;
      $('.fx.front', el).className = `fx front ${staged && FRONT.includes(p.fx) ? p.fx : ''}`;
      if (staged) stage.start(); else stage.stop();
      $('.art', el).innerHTML = p.title || !staged ? (p.title
        ? `<div class="comic-title"><small>${esc(p.title[0])}</small><b>${esc(p.title[1])}</b></div>`
        : p.art.map((k) => {
          const robot = ['drab', 'vat', 'mopper', 'fizz', 'smudge', 'whacker', 'sweeper', 'trawler', 'stencil', 'whale', 'whaleGrey', 'static', 'echo', 'curator', 'archivist', 'docent'].includes(k);
          return `<img alt="" src="${portrait(k, robot ? 'full' : 'head')}">`;
        }).join('')) : '';
      frame.classList.toggle('mural', !!p.mural);
      const sfxEl = $('.comic-sfx', el);
      sfxEl.textContent = p.sfx || '';
      sfxEl.style.setProperty('--tilt', `${(i % 2 ? 1 : -1) * (6 + (i * 7) % 6)}deg`);
      const who = p.speaker || '';
      $('.speaker', el).textContent = who;
      $('.comic-caption', el).className = `comic-caption ${who === 'The Curator' ? 'curator' : who === 'Echo' ? 'echo' : /recording|Recording/.test(who) ? 'recording' : ''}`;
      clearInterval(typing);
      text.textContent = '';
      let n = 0;
      const speed = TEXT_SPEEDS[settings.textSpeed] ?? 2;
      if (!speed) { typing = -1; finish(); }
      else typing = setInterval(() => {
        n += speed;
        text.textContent = p.caption.slice(0, n);
        if (n >= p.caption.length) finish();
      }, 22);
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j <= i));
      $('.next', el).textContent = i === panels.length - 1 ? 'Continue ▸' : 'Next ▸';
      frame.classList.remove('in', 'shake', 'boom'); void frame.offsetWidth;
      frame.classList.add(p.shake ? 'shake' : 'in');
      if (p.sfx) frame.classList.add('boom');
      if (p.shake) this.sfx.slam?.();
    };
    const next = () => {
      if (typing) { finish(); return; }
      this.sfx.pickup();
      if (++i >= panels.length) { stage.dispose(); this.close(); onDone(); } else render();
    };
    const done = () => { clearInterval(typing); stage.dispose(); this.close(); onDone(); };
    $('.next', el).addEventListener('click', next);
    $('.comic-frame', el).addEventListener('click', next);
    $('.comic-caption', el).addEventListener('click', next);
    $('.skip', el).addEventListener('click', done);
    this.keyHandler = (e) => { if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) { e.preventDefault(); next(); } };
    render();
    $('.next', el).focus();
  }

  // ---------------------------------------------------------------- world map

  worldMap({ onDeploy, onWorkshop, onClose, world }) {
    const s = save.data;
    const isOpen = (n) => n.id === 'hub' || (!n.locked && s.unlocked.includes(n.id));
    const worlds = WORLDS.filter((w) => s.unlocked.includes(w.opens));
    // default tab: the world holding the next uncleared mission
    const current = world || (worlds.slice().reverse().find((w) => w.nodes.some((n) => isOpen(n) && n.id !== 'hub' && !s.cleared[n.id])) || worlds[worlds.length - 1]).id;
    const W = WORLDS.find((w) => w.id === current);
    const el = this.mount('world', `
      <div class="world">
        <header>
          <h2>${esc(W.name)}</h2>
          ${worlds.length > 1 ? `<nav class="world-tabs">${worlds.map((w) => `<button data-world="${w.id}" class="${w.id === current ? 'on' : ''}">${esc(w.name)}</button>`).join('')}</nav>` : ''}
          <span class="pill">✦ ${s.sparks} Sparks</span><span class="pill seed">🌱 ${save.totalSeeds()}${save.seedGoal ? `/${save.seedGoal}` : ''} Seeds</span>${onClose ? '<button class="close">✕</button>' : ''}
        </header>
        <div class="world-map ${W.id}">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">${MAP_ART[W.id]}
            <path d="${W.nodes.map((n, i) => `${i ? 'L' : 'M'}${n.x} ${n.y * 0.7}`).join(' ')}" fill="none" stroke="#ffd23f" stroke-width=".8" stroke-dasharray="2 1.5"/>
          </svg>
          ${W.nodes.map((n) => {
            const cleared = !!s.cleared[n.id], open = isOpen(n);
            const cls = n.kind === 'home' ? 'home' : !open ? 'locked' : cleared ? 'cleared' : 'open';
            return `<button class="node ${cls}" data-id="${n.id}" style="left:${n.x}%;top:${n.y}%"><span>${n.kind === 'home' ? '⌂' : !open ? '🔒' : cleared ? '✓' : n.kind === 'boss' ? '!' : n.id}</span><em>${esc(n.name)}</em></button>`;
          }).join('')}
        </div>
        <aside class="card"></aside>
      </div>`);
    const card = $('.card', el);
    const select = (id) => {
      const n = W.nodes.find((w) => w.id === id);
      el.querySelectorAll('.node').forEach((b) => b.classList.toggle('sel', b.dataset.id === id));
      const open = isOpen(n);
      const best = s.cleared[n.id];
      card.innerHTML = `
        <small>${n.id === 'hub' ? 'HOME BASE' : n.kind === 'boss' ? `BOSS · ${n.id}` : `LEVEL ${n.id}`}</small>
        <h3>${esc(n.name)}</h3>
        <p>${esc(n.brief)}</p>
        ${n.id !== 'hub' && n.kind !== 'boss' && !n.locked ? `<div class="meta"><span>🌱 ${save.seedCount(n.id)}/3 seeds</span><span>${best ? `⏱ best ${fmtTime(best.time)}` : open ? 'Not cleared yet' : 'Locked'}</span></div>` : ''}
        <div class="buttons"></div>`;
      const btns = [];
      if (n.id === 'hub') btns.push(['Enter workshop', onWorkshop, true]);
      else if (open) btns.push([best ? 'Replay mission' : 'Deploy!', () => onDeploy(n.id), true]);
      this.buttons($('.buttons', card), btns);
    };
    el.querySelectorAll('.node').forEach((b) => b.addEventListener('click', () => { this.sfx.pickup(); select(b.dataset.id); }));
    el.querySelectorAll('.world-tabs button').forEach((b) => b.addEventListener('click', () => {
      this.sfx.pickup();
      this.worldMap({ onDeploy, onWorkshop, onClose, world: b.dataset.world });
    }));
    $('.close', el)?.addEventListener('click', onClose);
    const firstNew = W.nodes.find((n) => n.id !== 'hub' && isOpen(n) && !s.cleared[n.id]);
    select(firstNew ? firstNew.id : W.nodes.find((n) => isOpen(n) && n.id !== 'hub') ? W.nodes.filter((n) => isOpen(n) && n.id !== 'hub').pop().id : 'hub');
    this.keyHandler = (e) => { if (e.code === 'Escape' && onClose) onClose(); };
  }

  // ---------------------------------------------------------------- shop

  shop({ greeting, onClose, onChange }) {
    let tab = 'weapons';
    const el = this.mount('shop', `
      <div class="shop">
        <header>
          <img class="holo" alt="" src="${portrait('grandpaHolo')}">
          <div><small>GRANDPA'S WORKSHOP</small><p class="greet">${esc(greeting)}</p></div>
          <span class="pill sparks-pill"></span>
          <button class="close">✕</button>
        </header>
        <nav><button data-tab="weapons">Weapons</button><button data-tab="upgrades">Upgrades</button><button data-tab="items">Items</button></nav>
        <div class="grid"></div>
      </div>`);
    const grid = $('.grid', el);
    const buy = (price, apply) => {
      if (save.data.sparks < price) { this.sfx.block(); return; }
      save.data.sparks -= price;
      apply();
      save.write();
      this.sfx.chime();
      onChange?.();
      render();
    };
    const card = (title, desc, status, label, price, enabled, apply, extra = '') => {
      const d = document.createElement('div');
      d.className = 'shop-card';
      d.innerHTML = `<h4>${esc(title)}</h4><p>${esc(desc)}</p>${extra}<div class="status">${esc(status)}</div>`;
      const b = document.createElement('button');
      b.className = 'primary';
      b.innerHTML = price ? `${esc(label)} · ✦${price}` : esc(label);
      b.disabled = !enabled || save.data.sparks < price;
      b.addEventListener('click', () => buy(price, apply));
      d.appendChild(b);
      grid.appendChild(d);
    };
    const render = () => {
      $('.sparks-pill', el).textContent = `✦ ${save.data.sparks} Sparks`;
      el.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      grid.innerHTML = '';
      const s = save.data;
      if (tab === 'weapons') {
        card(WEAPONS.blaster.name, WEAPONS.blaster.desc, 'Owned · infinite paint', 'Owned', 0, false, () => {}, '<i class="swatch" style="background:#ff4f6d"></i>');
        for (const id of ['splatter', 'hose', 'bubble', 'ricochet', 'mortar', 'beam']) {
          const w = WEAPONS[id], owned = s.weapons[id];
          if (w.world && !owned && !s.unlocked.includes(`${w.world}-1`)) continue;
          const sw = `<i class="swatch" style="background:${w.color}"></i>`;
          if (!owned) card(w.name, w.desc, 'Not built yet', 'Build', w.price, true, () => { s.weapons[id] = true; s.ammo[id] = (s.ammo[id] || 0) + w.ammoPack; }, sw);
          else card(`${w.name} ammo`, w.desc, `Owned · ${s.ammo[id] || 0} paint`, `+${w.ammoPack}`, w.ammoPrice, true, () => { s.ammo[id] = (s.ammo[id] || 0) + w.ammoPack; }, sw);
        }
      } else if (tab === 'upgrades') {
        for (const [id, u] of Object.entries(UPGRADES)) {
          const lvl = s.upgrades[id] || 0, max = u.prices.length;
          const pips = `<div class="pips">${u.prices.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
          const needsSmudge = id === 'zapper' && !s.seen.smudge;
          card(`${u.icon} ${u.name}`, u.desc, lvl >= max ? 'Maxed out' : needsSmudge ? 'Needs Smudge' : `Level ${lvl}/${max}`,
            lvl >= max ? 'Max' : 'Upgrade', lvl >= max ? 0 : u.prices[lvl], lvl < max && !needsSmudge, () => { s.upgrades[id] = lvl + 1; }, pips);
        }
      } else {
        for (const id of ITEM_ORDER) {
          const it = ITEMS[id], n = s.items[id] || 0;
          card(it.name, `${it.desc} Press ${it.key}.`, `Carrying ${n}/${it.max}`, n >= it.max ? 'Full' : 'Buy', n >= it.max ? 0 : it.price, n < it.max,
            () => { s.items[id] = n + 1; }, `<i class="swatch item-${id}" style="background:${it.color}"></i>`);
        }
      }
    };
    el.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; this.sfx.pickup(); render(); }));
    $('.close', el).addEventListener('click', onClose);
    this.keyHandler = (e) => { if (e.code === 'Escape' || e.code === 'KeyE') onClose(); };
    render();
    $('.close', el).focus();
  }

  // ---------------------------------------------------------------- full map

  fullMap(game, onClose) {
    const el = this.mount('menu', `
      <div class="fullmap">
        <header><h2>${esc(game.def.title)}</h2><button class="close">✕</button></header>
        <canvas></canvas>
        <ul class="legend">${MAP_LEGEND.map(([n, c]) => `<li><i style="background:${c}"></i>${n}</li>`).join('')}</ul>
        <ul class="obj">${[...document.querySelectorAll('#hud .objectives li')].map((li) => `<li class="${li.className}">${esc(li.textContent)}</li>`).join('')}</ul>
      </div>`);
    const canvas = $('canvas', el);
    const draw = () => {
      if (this.current !== 'menu' || !canvas.isConnected) return;
      const dpr = Math.min(devicePixelRatio, 2), w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(ctx, game, w, h);
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    $('.close', el).addEventListener('click', onClose);
    this.keyHandler = (e) => { if (['Escape', 'KeyM', 'Tab'].includes(e.code)) { e.preventDefault(); onClose(); } };
  }

  // ---------------------------------------------------------------- pause / end screens

  pause({ isHub, onResume, onRestart, onWorkshop, onTitle }) {
    const el = this.mount('menu', '<div class="panel"><h2>Paused</h2><div class="buttons col"></div></div>');
    const list = [['Resume', onResume, true]];
    if (!isHub) list.push(['Restart mission', onRestart], ['Return to workshop', onWorkshop]);
    list.push(['Settings', () => this.settings(() => this.pause({ isHub, onResume, onRestart, onWorkshop, onTitle }))]);
    // phones and tablets: fullscreen hides the browser bars (not available on iPhone Safari)
    if (document.body.classList.contains('touch') && document.fullscreenEnabled) {
      const full = !!document.fullscreenElement;
      list.push([full ? 'Exit fullscreen' : 'Fullscreen', async () => {
        try {
          if (full) await document.exitFullscreen();
          else { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); await screen.orientation?.lock?.('landscape').catch(() => {}); }
        } catch { /* refused */ }
        onResume();
      }]);
    }
    list.push(['Title screen', onTitle]);
    this.buttons($('.buttons', el), list);
  }

  gameOver({ stats, onRetry, onWorkshop }) {
    const el = this.mount('menu', `
      <div class="panel">
        <h2>Nova got greyed!</h2>
        <p class="tag">Smudge is beeping very worriedly. You keep the ${stats.sparks} Sparks you collected.</p>
        <div class="buttons"></div>
      </div>`);
    this.buttons($('.buttons', el), [['Try again', onRetry, true], ['Back to workshop', onWorkshop]]);
  }

  results({ def, stats, unlocks = [], onContinue, onReplay }) {
    const acc = stats.shots ? Math.round(Math.min(1, stats.hits / stats.shots) * 100) : 0;
    const el = this.mount('menu', `
      <div class="panel">
        <small class="kicker">${def.boss ? 'BOSS DEFEATED' : `LEVEL ${esc(def.id)} COMPLETE`}</small>
        <h2 class="rainbow">${def.boss ? esc(def.bossTitle || 'Boss popped!') : 'Color restored!'}</h2>
        <p class="tag">${def.boss ? esc(def.bossWin || 'The Harvester is scrap, and the color is back.') : `The ${esc(def.beaconName)} is shining again.`}</p>
        <div class="stats">
          <div><b>${stats.pops}</b><small>robots popped</small></div>
          <div><b>+${stats.sparks}</b><small>sparks</small></div>
          <div><b>${fmtTime(stats.time)}</b><small>time</small></div>
          <div><b>${acc}%</b><small>accuracy</small></div>
          <div><b>${save.seedCount(def.id)}/3</b><small>color seeds</small></div>
        </div>
        ${unlocks.length ? `<p class="unlock">New in the wardrobe: <b>${unlocks.map(esc).join(', ')}</b></p>` : ''}
        <div class="buttons"></div>
      </div>`);
    this.buttons($('.buttons', el), [['Continue', onContinue, true], ['Replay', onReplay]]);
  }
}
