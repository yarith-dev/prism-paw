/**
 * Exposed to the gaming gateway as `./mount` (Module Federation): starts the whole game inside an
 * element on the gateway's page. The gateway and every game share this contract (version 1):
 * mount({ el, basePath, locale, apiBase, onExit }). One mount per page load.
 *
 * Prism Paw is English only, has no server and no pages of its own, so `locale`, `apiBase` and
 * `basePath` aren't needed: the URL is left alone.
 */
import css from '../style.css?inline';
import fredoka500 from '@fontsource/fredoka/files/fredoka-latin-500-normal.woff2?url';
import fredoka700 from '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2?url';
import silkscreen400 from '@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff2?url';
import { start } from '../app.js';

export const contract = 1;

let mounted = false;

/** The game's fonts, from its own site (the game's site links them from Google Fonts instead). */
function loadFonts() {
  const faces = [['Fredoka', fredoka500, '500'], ['Fredoka', fredoka700, '700'], ['Silkscreen', silkscreen400, '400']];
  for (const [family, url, weight] of faces) {
    const face = new FontFace(family, `url(${url}) format('woff2')`, { weight, display: 'swap' });
    document.fonts.add(face);
    face.load().catch(() => {}); // without the font the text falls back to system-ui
  }
}

/** @param {{ el: HTMLElement, basePath: string, locale: string, apiBase?: string, onExit: () => void }} options */
export async function mount(options) {
  if (mounted) throw new Error('prism-paw is already mounted on this page');
  mounted = true;
  loadFonts();

  // all of the game's CSS is scoped to #prism-paw-app
  const style = document.createElement('style');
  style.textContent = css;
  const root = document.createElement('div');
  root.id = 'prism-paw-app';
  options.el.append(style, root);
  // the game fills the gateway's element; one with no height of its own gets the screen's
  if (!root.clientHeight) root.style.height = '100dvh';

  start(root, { gateway: { onExit: options.onExit } });
}
