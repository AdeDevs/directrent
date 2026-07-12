#!/usr/bin/env node
// scripts/prerender.mjs — run AFTER `vite build` (dist/index.html is the template).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('✖ dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Middleware-mode server only to transform + SSR-load our TS modules.
  // hmr:false + watch:null kill the file watcher / HMR socket so no handle keeps Node alive.
  const vite = await createServer({
    mode: 'production',
    server: { middlewareMode: true, hmr: { port: 24680 }, watch: null },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
    logLevel: 'warn',
  });

  try {
    const { prerenderRoutes } = await vite.ssrLoadModule('/src/prerender/routes.tsx');
    const { renderRoute, injectIntoTemplate } = await vite.ssrLoadModule('/src/prerender/render.tsx');

    let written = 0;
    for (const route of prerenderRoutes) {
      try {
        if (route.path.includes(':')) {
          const items = route.getData ? await route.getData() : [];
          for (const item of items) {
            const routePath = route.path.replace(':slug', item.slug);
            const { bodyHtml, headHtml } = await renderRoute({
              path: routePath, Component: route.Component,
              routePattern: route.path, preloaded: item.preloaded,
            });
            writeRoute(injectIntoTemplate(template, { headHtml, bodyHtml, preloaded: item.preloaded }), routePath);
            written++;
          }
        } else {
          const { bodyHtml, headHtml } = await renderRoute({
            path: route.path, Component: route.Component, props: route.props,
          });
          writeRoute(injectIntoTemplate(template, { headHtml, bodyHtml }), route.path);
          written++;
        }
      } catch (err) {
        // Log and continue — the SPA fallback still serves this route client-side.
        console.warn(`⚠ prerender skipped ${route.path}:`, err);
      }
    }
    console.log(`✔ prerendered ${written} routes`);
  } finally {
    await vite.close();
  }
}

function writeRoute(html, routePath) {
  const rel = routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\//, ''), 'index.html');
  const outPath = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
}

main()
  .then(() => process.exit(0)) // force clean exit; esbuild/worker handles can otherwise hang the build
  .catch((err) => { console.error('✖ prerender failed:', err); process.exit(1); });
