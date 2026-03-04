
## General Behavior

- Always proceed autonomously unless explicitly told to pause. Do not ask for confirmation on intermediate steps. If a task has multiple phases, continue through all of them without stopping.
- When asked about an issue, always investigate thoroughly before responding. Never give dismissive or surface-level answers. If you don't know, say so and dig deeper.

## Build & Debugging

- When encountering build errors, fix ALL errors in a single pass before re-running the build. Do not fix one error, rebuild, fix the next, rebuild, etc.
- When debugging, investigate the root cause before applying fixes. Do not apply surface-level patches (e.g., adding logging) when the real issue is architectural. Explain your hypothesis before coding.
- Build command: `bun run build` (runs all 4 bundles: bg, chatgpt, gemini, popup). Always verify with a clean build after any multi-file change set.

## Tech Stack

- **Browser:** Brave (Chromium-based, MV3). Never assume Chrome DevTools or chrome:// URLs — use Brave equivalents.
- **Package manager:** Bun (not npm/yarn/pnpm)
- **Build:** Vite multi-entry (vite.config.background.js, vite.config.chatgpt.js, vite.config.gemini.js, vite.config.popup.js)
- **UI:** Preact + Shadow DOM (no React, no CDN imports)
- **Language:** JavaScript/JSX throughout (no TypeScript)
- Primary languages for the broader workspace: TypeScript, JavaScript, Python. Also HTML/CSS and Swift for macOS apps.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
