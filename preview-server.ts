// Temporary static file server for verifying dist/popup UI
import { join } from 'path';

const ROOT = join(import.meta.dir, 'dist/popup');

Bun.serve({
  port: 5179,
  fetch(req) {
    const url = new URL(req.url);
    const filePath = join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
    const file = Bun.file(filePath);
    return new Response(file);
  },
});

console.log('Preview server running at http://localhost:5179');
