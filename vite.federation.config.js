/**
 * The gaming gateway's build (`pnpm build:federation`): a Module Federation remote that exposes
 * `./mount` (src/gateway/mount.js) at mf/remoteEntry.js. The game's own site is built by
 * vite.config.js as before; gateway/finish-build.mjs then copies mf/ into it.
 *
 * Output: .federation/public/mf/ (remote entry, chunks in mf/assets/, mf-manifest.json,
 * preload.json, offline.json) and .federation/server/index.mjs (a static server for local use and
 * the gateway's checks).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

const OUT = '.federation/public';

/** Every file under a folder, as paths relative to it. */
function listFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`)
    : [`${prefix}${entry.name}`]).sort();
}

/** Writes mf/preload.json and mf/offline.json, and the static server. */
function gatewayFiles() {
  return {
    name: 'gateway-files',
    apply: 'build',
    writeBundle(_, bundle) {
      // preload.json: everything the game needs to boot, so the gateway fetches it all at once.
      // The remote entry loads the mount module with a dynamic import: follow those one level, then
      // static imports only.
      const js = new Set(), css = new Set();
      const visit = (file, deep) => {
        const chunk = bundle[file];
        if (!chunk || chunk.type !== 'chunk' || js.has(file)) return;
        js.add(file);
        for (const f of chunk.viteMetadata?.importedCss ?? []) css.add(f);
        for (const f of chunk.imports) visit(f, false);
        if (deep) for (const f of chunk.dynamicImports) visit(f, false);
      };
      visit('mf/remoteEntry.js', true);
      const rel = (f) => f.replace(/^mf\//, '');
      writeFileSync(join(OUT, 'mf/preload.json'), JSON.stringify({ js: [...js].map(rel), css: [...css].map(rel) }));

      // offline.json: every file the game can ask for (it has no public files: everything is drawn
      // and synthesized in code). The version changes whenever the file list does.
      const files = [
        ...['remoteEntry.js', 'mf-manifest.json', 'preload.json'].map((f) => `/mf/${f}`),
        ...listFiles(join(OUT, 'mf/assets')).filter((f) => !f.endsWith('.map')).map((f) => `/mf/assets/${f}`),
      ];
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      writeFileSync(join(OUT, 'mf/offline.json'), JSON.stringify({ version, files }));

      mkdirSync('.federation/server', { recursive: true });
      copyFileSync('gateway/server.mjs', '.federation/server/index.mjs');
    },
  };
}

export default defineConfig({
  // relative, so every chunk and font loads from the game's site even on the gateway's page
  base: './',
  build: {
    outDir: OUT,
    assetsDir: 'mf/assets',
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    // no page of its own: the remote entry (added by the plugin) and the mount module are the inputs
    rolldownOptions: { input: { mount: 'src/gateway/mount.js' } },
  },
  plugins: [
    federation({
      name: 'prism_paw',
      filename: 'mf/remoteEntry.js',
      manifest: { filePath: 'mf' },
      dts: false,
      exposes: { './mount': './src/gateway/mount.js' },
      shared: {},
    }),
    gatewayFiles(),
  ],
});
