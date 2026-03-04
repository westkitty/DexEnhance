// Static file server for verifying dist/ UI
// Serves from dist/ root so that Vite-generated absolute paths (e.g. /popup/index.js,
// /icons/icon48.png) resolve correctly — matching the extension's chrome-extension:// URL layout.
import { join } from 'path';

const ROOT = join(import.meta.dir, 'dist');

Bun.serve({
  port: 5179,
  fetch(req) {
    const url = new URL(req.url);
    const filePath = join(ROOT, url.pathname === '/' ? 'popup/index.html' : url.pathname);
    const file = Bun.file(filePath);
    return new Response(file);
  },
});

console.log('Preview server running at http://localhost:5179');
