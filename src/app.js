import * as THREE from 'three';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { Screens } from './screens.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { PAINT } from './util.js';
import { Music, trackFor } from './music.js';
import { settings } from './settings.js';
import { applyNovaLook } from './models.js';
import { clearPortrait, portrait, SPEAKER_PORTRAIT } from './portraits.js';
import { warmStage } from './stage.js';
import { Loading, nextFrame } from './loading.js';
import { loadLook, storeLook, resolveLook, isUnlocked, WARDROBE } from './data/wardrobe.js';
import { save } from './save.js';
import { MARKUP } from './markup.js';
import { listen, endListeners } from './life.js';
import { COMICS, WORLD, GRANDPA_LINES, MURALS } from './data/story.js';
import { level5 } from './levels/level5.js';
import { level6 } from './levels/level6.js';
import { level7 } from './levels/level7.js';
import { level8 } from './levels/level8.js';
import { level9 } from './levels/level9.js';
import { level10 } from './levels/level10.js';
import { level11 } from './levels/level11.js';
import { level12 } from './levels/level12.js';
import { level13 } from './levels/level13.js';
import { level14 } from './levels/level14.js';
import { level15 } from './levels/level15.js';
import { level16 } from './levels/level16.js';
import { level17 } from './levels/level17.js';
import { level18 } from './levels/level18.js';
import { level19 } from './levels/level19.js';
import { level20 } from './levels/level20.js';
import { level1 } from './levels/level1.js';
import { level2 } from './levels/level2.js';
import { level3 } from './levels/level3.js';
import { level4 } from './levels/level4.js';
import { hub } from './levels/hub.js';

const LEVELS = { hub, '1-1': level1, '1-2': level2, '1-3': level3, '1-4': level4, '2-1': level5, '2-2': level6, '2-3': level7, '2-4': level8,
  '3-1': level9, '3-2': level10, '3-3': level11, '3-4': level12,
  '4-1': level13, '4-2': level14, '4-3': level15, '4-4': level16,
  '5-1': level17, '5-2': level18, '5-3': level19, '5-4': level20 };
const CAMPAIGN = ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2', '2-3', '2-4', '3-1', '3-2', '3-3', '3-4', '4-1', '4-2', '4-3', '4-4', '5-1', '5-2', '5-3', '5-4'];
/** Every hidden Color Seed in the campaign: finding them all unlocks the true ending. */
const TOTAL_SEEDS = CAMPAIGN.reduce((n, id) => n + LEVELS[id].map.join('').split('*').length - 1, 0);

const isUnlockedFor = (opt) => isUnlocked(opt, save);

/**
 * Starts the game inside `root` (an empty element that sets the game's size).
 * `gateway` is set when the game runs inside the gaming gateway: { onExit } for its "All games" button.
 * Returns stop(), which ends the loop, the sound and every window listener.
 */
export function start(root, { gateway = null } = {}) {
  root.innerHTML = `<main>${MARKUP}</main>`;
  const main = root.querySelector('main');
  /** The game's size: its root element (the window on the game's own site). */
  const width = () => root.clientWidth || innerWidth, height = () => root.clientHeight || innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(width(), height());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  main.prepend(renderer.domElement);

  save.load();
  save.seedGoal = TOTAL_SEEDS;
  /** Rebuild Nova from the stored wardrobe look (accessories the save hasn't unlocked are left off). */
  function dressNova(look = loadLook()) {
    const r = resolveLook(look, save);
    applyNovaLook(r);
    for (const k of ['nova', 'echo', 'smudge']) clearPortrait(k);
    PAINT.splice(0, PAINT.length, ...r.palette); // splats and paint bursts use the chosen palette
    const trail = WARDROBE.trail.options.find((o) => o.id === r.trail);
    game.setTrail(r.trail, Object.values(trail?.colors || {}));
  }
  const hud = new Hud(main);
  const sfx = new Sfx();
  const music = new Music(sfx);
  sfx.onUnlock = () => music.attach();
  sfx.setVolume(settings.sfx);
  music.setVolume(settings.music);
  music.setTheme(settings.musicTheme);
  settings.onChange((key, v) => { if (key === 'sfx') sfx.setVolume(v); if (key === 'music') music.setVolume(v); if (key === 'musicTheme') music.setTheme(v); });
  // browsers only allow audio after a user gesture: start it on the first one
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) listen(window, ev, () => sfx.unlock(), { once: true, capture: true });
  const screens = new Screens(sfx, main, root);
  const loading = new Loading(main);
  const input = new Input(renderer.domElement, main.querySelector('#sticks'), main.querySelector('#overlay'));
  main.classList.toggle('touch', input.touch); // thumb-sized buttons, no keyboard hints
  /** Phones get the compact HUD: one slim top row, a one-line objective, smaller panels. */
  const setCompact = () => main.classList.toggle('compact', input.touch && Math.min(width(), height()) <= 520);
  setCompact();
  const game = new Game(renderer, hud, input, sfx);
  dressNova();
  let last = performance.now();

  /** Drop key presses from the event that closed a menu, so E/Esc don't instantly reopen it. */
  const flushInput = () => setTimeout(() => input.pressedOnce.clear(), 0);

  // ------------------------------------------------------------------ flow

  /**
   * Load a level behind the loading screen. Building it is only the start: its shaders (and its
   * effects'), textures, portraits and very first frame are all prepared here too, so nothing
   * stalls once play begins. Resolves false if another load is already under way.
   */
  async function enter(def, title, extra = []) {
    if (loading.busy) return false;
    screens.close();
    input.clearSticks();
    await loading.run(title, [
      ...extra,
      ['Building the level', 5, () => game.load(def)],
      ['Compiling shaders', 4, () => game.compileLevel()],
      ['Uploading textures', 1, () => game.uploadLevel()],
      ['Drawing faces', 1, (progress) => warmPortraits(progress)],
      ['Setting the scene', 2, () => game.firstFrame()],
    ]);
    last = performance.now();
    flushInput();
    return true;
  }

  /** Every speaker's portrait (and the murals' art), drawn now rather than when first shown (~10 ms each). */
  async function warmPortraits(progress) {
    const keys = [...new Set([...Object.values(SPEAKER_PORTRAIT), ...MURALS.flatMap((m) => m.art)])];
    for (let i = 0; i < keys.length; i++) {
      portrait(keys[i]);
      if (i % 4 === 3) { progress(i / keys.length); await nextFrame(); }
    }
  }

  let rotateTipShown = false;
  async function playLevel(id) {
    sfx.unlock();
    music.play(trackFor(LEVELS[id]));
    const intro = LEVELS[id].introComic;
    if (intro && !save.data.seen[`comic:${intro}`]) { playComic(intro, () => playLevel(id)); return; }
    if (!await enter(LEVELS[id], `${id} · ${LEVELS[id].title}`)) return;
    game.state = 'play';
    if (input.touch && height() > width() && !rotateTipShown) {
      rotateTipShown = true;
      setTimeout(() => hud.toast('Tip: turn your phone sideways for a wider view', 4), 1500);
    }
  }

  async function toHub() {
    music.play('hub');
    if (!await enter(hub, hub.title)) return;
    game.state = 'play';
    if (!save.data.seen.hubTip) {
      save.data.seen.hubTip = true;
      save.write();
      hud.say([
        ['Nova', "Grandpa's workshop. Still smells like solder and sardines."],
        ['Smudge', "Beep! (it points at Grandpa's hologram, then the map table)"],
      ]);
    }
  }

  function playComic(id, then) {
    game.state = 'menu';
    hud.hide();
    save.data.seen[`comic:${id}`] = true;
    save.write();
    if (id.startsWith('ending')) music.play('ending');
    screens.comic(COMICS[id], then);
  }

  function newGame() {
    sfx.unlock();
    save.reset();
    save.data.started = true;
    save.write();
    dressNova();
    playComic('opening', () => playLevel('1-1'));
  }

  function continueGame() {
    sfx.unlock();
    toHub();
  }

  function resume() {
    screens.close();
    hud.show();
    if (game.state === 'menu' || game.state === 'paused') game.state = 'play';
    flushInput();
    last = performance.now();
  }

  function openWardrobe() {
    game.state = 'menu';
    input.clearSticks();
    screens.wardrobe({
      look: loadLook(),
      isUnlocked: (opt) => isUnlockedFor(opt),
      onChange: (look) => { storeLook(look); dressNova(look); game.restylePlayer(); },
      onClose: resume,
    });
  }

  function openShop() {
    game.state = 'menu';
    input.clearSticks();
    const greet = GRANDPA_LINES.filter((g) => g.when(save.data)).pop().lines[0][1];
    screens.shop({
      greeting: greet,
      onClose: resume,
      onChange: () => { hud.setSparks(save.data.sparks); game.syncItemsHud(); game.syncWeaponHud(); },
    });
  }

  function openWorld() {
    game.state = 'menu';
    input.clearSticks();
    screens.worldMap({
      onDeploy: playLevel,
      onWorkshop: () => (game.isHub ? resume() : toHub()),
      onClose: game.isHub ? resume : null,
    });
  }

  function openFullMap() {
    if (game.state !== 'play' || game.isHub) return;
    game.state = 'menu';
    input.clearSticks();
    screens.fullMap(game, resume);
  }

  function pause() {
    if (game.state !== 'play') return;
    game.state = 'paused';
    input.clearSticks();
    screens.pause({
      isHub: game.isHub,
      onResume: resume,
      onRestart: () => playLevel(game.def.id),
      onWorkshop: toHub,
      onTitle: showTitle,
      onExit: gateway && exitToGateway,
    });
  }

  let booted = false;
  async function showTitle() {
    music.play('title');
    // the first load also sets up the comic stage, so the opening comic starts straight away
    const extra = booted ? [] : [['Setting up the comics', 3, () => warmStage(COMICS.opening.filter((p) => p.set || p.cast))]];
    if (!await enter(level1, 'Prism Paw', extra)) return;
    booted = true;
    game.state = 'title';
    hud.hide();
    screens.title({ hasSave: save.hasProgress, touch: input.touch, onContinue: continueGame, onNew: newGame, onExit: gateway && exitToGateway });
  }

  game.events.action = (kind, data) => {
    if (kind === 'shop') openShop();
    else if (kind === 'wardrobe') openWardrobe();
    else if (kind === 'mural') openMural(data);
    else openWorld();
  };

  function openMural(panel) {
    game.state = 'menu';
    input.clearSticks();
    screens.comic([panel], resume);
  }

  game.events.dead = (stats) => {
    hud.hide();
    screens.gameOver({ stats, onRetry: () => playLevel(game.def.id), onWorkshop: toHub });
  };

  game.events.complete = (stats) => {
    const id = game.def.id;
    const next = CAMPAIGN[CAMPAIGN.indexOf(id) + 1];
    if (next && !save.data.unlocked.includes(next)) save.data.unlocked.push(next);
    save.write();
    dressNova(); // a chosen accessory that was locked until now goes on
    hud.hide();
    const unlocks = stats.firstClear ? Object.values(WARDROBE).filter((s) => s.items).flatMap((s) => s.options).filter((o) => o.unlock === id).map((o) => o.name) : [];
    screens.results({
      def: game.def,
      stats,
      unlocks,
      onContinue: () => {
        let comic = WORLD.find((w) => w.id === id)?.comicAfter;
        if (typeof comic === 'function') comic = comic(save.totalSeeds(), TOTAL_SEEDS);
        if (comic && !save.data.seen[`comic:${comic}`]) playComic(comic, toHub);
        else toHub();
      },
      onReplay: () => playLevel(id),
    });
  };

  hud.on('pause', pause);
  hud.on('map', () => (game.isHub ? openWorld() : openFullMap()));
  hud.on('weapon', () => game.state === 'play' && game.cycleWeapon());
  hud.on('weaponList', () => (game.state === 'play' && !game.isHub ? game.weaponList() : []));
  hud.on('selectWeapon', (id) => game.state === 'play' && game.selectWeapon(id));
  hud.on('item', (id) => game.useItem(id));
  hud.on('interact', () => game.interact());

  // the root's size follows the window on the game's own site, and the gateway's layout inside it
  const resized = new ResizeObserver(() => {
    renderer.setSize(width(), height());
    game.resize();
    setCompact();
  });
  resized.observe(root);
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { pause(); sfx.ctx?.suspend(); } else sfx.ctx?.resume();
  });

  /** The gateway's "All games" button. */
  function exitToGateway() {
    sfx.ctx?.suspend();
    gateway.onExit();
  }

  /** Ends the game for good: the loop, the sound, and every listener on window and document. */
  function stop() {
    renderer.setAnimationLoop(null);
    resized.disconnect();
    endListeners();
    music.stop();
    sfx.close();
  }

  showTitle();

  // ------------------------------------------------------------------ loop

  /**
   * Render resolution. "auto" starts at the screen's pixel ratio (max 2) and steps down by 0.25
   * when frames run long (under ~45 fps for a second), then back up after 8 s of headroom;
   * "sharp" keeps full resolution, "fast" renders at 1× with smaller shadows.
   */
  const MAX_DPR = Math.min(devicePixelRatio || 1, 2);
  let autoDpr = MAX_DPR, slowT = 0, fastT = 0;
  function applyResolution() {
    const want = settings.graphics === 'sharp' ? MAX_DPR : settings.graphics === 'fast' ? Math.min(1, MAX_DPR) : autoDpr;
    if (renderer.getPixelRatio() !== want) renderer.setPixelRatio(want);
  }
  function adaptResolution(raw) {
    if (settings.graphics !== 'auto' || game.state !== 'play' || raw > 0.25) return;
    if (raw > 1 / 45) { slowT += raw; fastT = 0; } else { slowT = Math.max(0, slowT - raw * 0.5); if (raw < 1 / 55) fastT += raw; }
    if (slowT > 1 && autoDpr > 0.75) { autoDpr = Math.max(0.75, autoDpr - 0.25); slowT = 0; applyResolution(); }
    else if (fastT > 8 && autoDpr < MAX_DPR) { autoDpr = Math.min(MAX_DPR, autoDpr + 0.25); fastT = 0; applyResolution(); }
  }
  settings.onChange((key) => { if (key === 'graphics') { autoDpr = MAX_DPR; applyResolution(); } });
  applyResolution();

  let titleT = 0;
  renderer.setAnimationLoop(() => {
    // the gateway took the game off its page (it went back to its catalog)
    if (!root.isConnected) { stop(); return; }
    // nothing is drawn while loading: drawing the new level would compile its shaders on the spot
    if (loading.busy) { input.endFrame(); last = performance.now(); return; }
    // performance.now() rather than the rAF timestamp: after a hidden tab resumes the
    // timestamp can be older than `last`, and a negative dt blows the physics up to NaN.
    const now = performance.now();
    adaptResolution((now - last) / 1000);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (input.pressed('Escape', 'KeyP', 'PadStart') && !screens.open) pause();
    else if (input.pressed('KeyM', 'Tab') && !screens.open) (game.isHub ? openWorld() : openFullMap());
    if (game.state === 'title') {
      titleT += dt;
      const pl = game.player;
      game.camTarget.set(pl.pos.x + 30 + Math.sin(titleT * 0.15) * 26, 0, pl.pos.z + 24 + Math.cos(titleT * 0.1) * 10);
      game.camera.position.set(game.camTarget.x, 36 * game.camDist, game.camTarget.z + 11 * game.camDist);
      game.camera.lookAt(game.camTarget);
    } else if (game.state === 'play' || game.state === 'dead' || game.state === 'complete') {
      game.update(dt);
      hud.update(dt);
    }
    music.setIntensity(game.state === 'play' && game.phase === 'defend' ? 1 : 0);
    game.render();
    input.endFrame();
  });

  // handy for debugging from the console (on the game's own site)
  if (!gateway) window.prismPaw = { loading, game, save, screens, playLevel, toHub, renderer, music, paint: PAINT, resolution: () => ({ dpr: renderer.getPixelRatio(), autoDpr, max: MAX_DPR }), adaptResolution };
  return stop;
}
