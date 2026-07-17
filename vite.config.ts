import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Vite's dev server serves any .html file at the root by path already; this
// map is only needed so `vite build` knows every page to bundle. Add a page
// here (and a matching build:<name> script in package.json) when you add one
// under src/pages/.
const PAGES: Record<string, string> = {
  intro: 'src/pages/intro/intro.html',
  main: 'src/pages/index/index.html',
  componentDemo: 'src/pages/component-demo/component-demo.html',
};

// vite-plugin-singlefile inlines a build's JS/CSS into one self-contained
// HTML file (so pages open directly via file://, no server needed) but only
// supports a single entry point per build. `npm run build` therefore invokes
// `vite build` once per page with PAGE set, each pass building just that
// page's entry; with PAGE unset (dev server, or a raw `vite build`) it falls
// back to bundling every page in the normal multi-entry way.
const page = process.env.PAGE;

// Each page's html lives next to its content ts under src/pages/<name>/, so
// Vite writes build output at that same nested path. Flatten it back to one
// html file per page at dist's root -- these are meant to be opened/hosted
// directly, not served from a path mirroring the source layout.
function flattenPageHtml(): Plugin {
  return {
    name: 'flatten-page-html',
    closeBundle() {
      const entries = page ? { [page]: PAGES[page] } : PAGES;
      for (const relPath of Object.values(entries)) {
        const from = resolve(__dirname, 'dist', relPath);
        const to = resolve(__dirname, 'dist', relPath.split('/').pop()!);
        if (existsSync(from)) renameSync(from, to);
      }
      const distSrc = resolve(__dirname, 'dist/src');
      if (existsSync(distSrc)) rmSync(distSrc, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [viteSingleFile(), flattenPageHtml()],
  build: {
    // Cleared once up front by the build script, not per-page here, since
    // emptying it before every single-page pass would wipe prior pages' output.
    emptyOutDir: false,
    rollupOptions: {
      input: page
        ? { [page]: resolve(__dirname, PAGES[page]) }
        : Object.fromEntries(
            Object.entries(PAGES).map(([name, file]) => [name, resolve(__dirname, file)])
          ),
    },
  },
});
