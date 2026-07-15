import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    // Vite's dev server serves any .html file at the root by path already;
    // this is only needed so `vite build` bundles every page instead of just
    // index.html. Add a page here when you add one under src/pages/.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        componentDemo: resolve(__dirname, 'component-demo.html'),
      },
    },
  },
});
