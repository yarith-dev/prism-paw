import { defineConfig } from 'vite';

// relative asset paths, so the build runs from any folder (itch.io, GitHub Pages, a USB stick)
export default defineConfig({ base: './' });
