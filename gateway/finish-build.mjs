#!/usr/bin/env node
// After the gateway build (`pnpm build:federation`): reports how much the gateway downloads to
// start the game (gzip), then copies .federation/public/mf into the site's build (dist/mf), so one
// GitHub Pages deploy serves both the game and its gateway remote.
//
// The site lives at https://yarith-dev.github.io/prism-paw/, so the copy's offline.json lists
// /prism-paw/mf/... paths (SITE_BASE overrides that). The local server serves /mf/... as built.
//
//   node gateway/finish-build.mjs [--no-copy]
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const source = '.federation/public/mf';
const site = 'dist';
const base = (process.env.SITE_BASE ?? '/prism-paw/').replace(/\/?$/, '/');
if (!existsSync(join(source, 'remoteEntry.js'))) {
  console.error(`No gateway build in ${source}: run the federation build first.`);
  process.exit(1);
}
// build statistics for tooling, not for browsers
rmSync(join(source, 'mf-stats.json'), { force: true });
rmSync('.federation/public/.vite', { recursive: true, force: true });

const kb = (bytes) => Math.round(bytes / 102.4) / 10;
const { js, css } = JSON.parse(readFileSync(join(source, 'preload.json'), 'utf8'));
const gz = (files) => kb(files.reduce((total, file) => total + gzipSync(readFileSync(join(source, file))).length, 0));
console.log(`Gateway remote, to boot (gzip): ${JSON.stringify({ remoteEntryKB: gz(['remoteEntry.js']), jsKB: gz(js), cssKB: gz(css) })}`);

if (process.argv.includes('--no-copy')) process.exit(0);
if (!existsSync(join(site, 'index.html'))) {
  console.log(`No site build in ${site}, so nothing to copy into (run \`pnpm build\` first to deploy).`);
  process.exit(0);
}
const target = join(site, 'mf');
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
const offline = JSON.parse(readFileSync(join(target, 'offline.json'), 'utf8'));
offline.files = offline.files.map((file) => base.replace(/\/$/, '') + file);
writeFileSync(join(target, 'offline.json'), JSON.stringify(offline));
console.log(`Copied ${source} → ${target} (offline.json paths under ${base})`);
