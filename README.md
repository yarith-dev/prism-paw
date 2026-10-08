# Prism Paw

**Play it:** https://yarith-dev.github.io/prism-paw/

A top-down voxel horde shooter for the browser. Nova, a two-legged cat courier with a paint blaster, fights waves of grey robots to bring color back to the planet Kittara, and to get her grandpa back from the moon.

- 5 worlds, 20 levels and 5 bosses, with two endings (find all 60 Color Seeds for the true one)
- Staged 3D voxel comic cutscenes between levels
- A workshop hub with a shop, upgrades and a wardrobe (fur, patterns, ears, tails, outfits, capes, wings, glasses, hats and blasters)
- Procedural music with five soundtrack themes, all synthesized in the browser (no audio files)
- Mouse and keyboard, gamepad, or twin-stick touch on phones

The full design and story are in [STORY.md](STORY.md).

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | WASD | Left thumb |
| Aim and fire | Mouse | Right thumb |
| Talk / use | E | Tap the prompt |
| Switch weapon | Q | Weapon button |
| Sardine tin / Paint Bomb / Bubble Shield | H / G / B | Item buttons |
| Map | M | Map button |
| Pause | Esc or P | Pause button |

## Run it locally

Needs [Node.js](https://nodejs.org) 20.19+ or 22.12+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Build

```bash
pnpm build
```

The finished game goes in `dist/`: a static site with one HTML, one JS and one CSS file. Asset paths are relative, so `dist/` runs from any folder or host (Vercel, Netlify, GitHub Pages, itch.io).

## Deploy

**GitHub Pages (live):** `.github/workflows/pages.yml` builds the game and its gateway remote and publishes them on every push to `main`.

**Vercel:** import this repository on [vercel.com/new](https://vercel.com/new). Vercel detects Vite automatically (build command `pnpm build`, output `dist`). Every push to `main` redeploys.

**Anything else:** run `pnpm build` and upload the contents of `dist/`.

## Gaming Gateway

The game can also run inside the Gaming Gateway, a site that hosts several games, as a
[Module Federation](https://module-federation.io) remote. The remote exposes `./mount`
([src/gateway/mount.js](src/gateway/mount.js)), which starts the game inside an element on the gateway's page.

```bash
pnpm build                  # the site, in dist/
pnpm build:federation       # the remote, in .federation/public/mf/, then copied into dist/mf/
PORT=3101 node .federation/server/index.mjs   # serves http://localhost:3101/mf/remoteEntry.js
```

On GitHub Pages the remote is at https://yarith-dev.github.io/prism-paw/mf/remoteEntry.js, with
`mf/preload.json` (files to boot) and `mf/offline.json` (every file, for offline play) next to it.
The game's CSS is scoped to `#prism-paw-app`, and it sizes itself to that element, so the same code
fills the window on its own site and the gateway's element inside the gateway.

## Project layout

```
src/
  main.js        the game's own site: starts the game in the window
  app.js         game flow: title, hub, levels, comics, saving
  gateway/       the Gaming Gateway's mount() entry
  game.js        the game loop, player, enemies, weapons, missions
  level.js       tile maps → voxel scenery
  models.js      every voxel model (Nova, robots, bosses, props)
  stage.js       3D comic panels
  music.js       procedural soundtrack and themes
  audio.js       synthesized sound effects
  screens.js     menus, shop, wardrobe, settings, comics
  bosses/        the five boss fights
  levels/        the 20 levels and the workshop hub
  data/          story and comics, shop, wardrobe
  dev/autoplay.js  dev-only bot used for difficulty tuning (not in the build)
  dev/profile.js   dev-only frame profiler: the bot plays while it times each frame
gateway/         the gateway build's static server and finish step
```

Built with [three.js](https://threejs.org) and [Vite](https://vite.dev). No other runtime dependencies.
