# Phase 1: Foundation & Build Pipeline — Research

**Researched:** 2026-03-03
**Domain:** Manifest V3 Browser Extension, Vite, Bun, Chrome Extension APIs
**Confidence:** HIGH (core findings verified against official Chrome docs and Vite docs; Bun/Vite interaction MEDIUM due to limited official extension-specific guidance)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Package manager: Bun (Apple Silicon optimized)
- Build tool: Vite 5.x
- Extension API: Manifest V3 (Chrome/Brave)
- Target sites: `https://chatgpt.com/*` and `https://gemini.google.com/*`
- UI framework: Preact (Phase 4+, but add dependency now)
- Language: JavaScript (ESM), no TypeScript
- Distribution: Local load via `brave://extensions` (Load Unpacked)
- Zero external CDN — all assets bundled
- Output must include:
  1. `dist/background/service_worker.js` — IIFE format
  2. `dist/content/gemini/index.js` — IIFE
  3. `dist/content/chatgpt/index.js` — IIFE
  4. `dist/popup/index.html` + JS
  5. `manifest.json`, icons (static copy)

### Claude's Discretion
- Whether to use `@crxjs/vite-plugin` vs manual Rollup config
- Dev workflow / hot-reload tooling
- Exact storage wrapper API shape
- Whether to use `npm-run-all` / `concurrently` for multi-build orchestration

### Deferred Ideas (OUT OF SCOPE)
- TypeScript migration (Phase 1 is JS only)
- Automated testing infrastructure
- Publish to Chrome Web Store
- Any Phase 2+ feature code
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Vite build pipeline outputting MV3-compliant background script (IIFE), per-site content scripts, and popup assets into `dist/` | Multi-config Vite approach; Rollup IIFE limitation requires separate config runs |
| INFRA-02 | `manifest.json` (MV3) with `host_permissions`, `content_scripts`, `background.service_worker`, icons | Official Chrome docs match patterns; permissions list verified |
| INFRA-03 | `lib/storage.js` — Promise wrapper for `chrome.storage.local` (get/set/remove) | Native Promise support confirmed in Chrome APIs (MV3); no polyfill needed |
| INFRA-04 | `lib/utils.js` — string sanitizer, truncate, token count estimator | Pure JS; no library required |
| INFRA-05 | Zero external CDN — all assets bundled locally | Vite bundles all imports; confirm no CDN leaks in final rollup output |
</phase_requirements>

---

## Summary

Phase 1 establishes the complete build pipeline for a Manifest V3 Brave/Chrome extension using Bun and Vite 5. The core architectural challenge is that Vite's default ESM output format is incompatible with both MV3 background service workers and content scripts — both require IIFE bundles. Additionally, Rollup (Vite's underlying bundler) does not support multiple entry points with IIFE format in a single build invocation. The recommended solution is **three separate Vite build configurations** run sequentially using `bun run` scripts, each producing a single IIFE entry: one for the background service worker, one for the ChatGPT content script, and one for the Gemini content script. The popup is a standard HTML-entry build.

The `@crxjs/vite-plugin` is NOT recommended for this project. While newly stabilized at v2.0 (June 2025), it has a three-year history of instability, active CSP-breaking bugs on Chrome 130+, and adds unnecessary complexity for a project whose primary constraint is IIFE output — which manual Rollup config handles cleanly. The manual approach is transparent, has no plugin black boxes, and is easier to debug.

**Primary recommendation:** Use four sequential `vite build --config` calls (background, chatgpt content, gemini content, popup), coordinated by a single `bun run build` script. Use `vite build --watch` for development with manual extension reload in Brave.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ^5.4 | Build tool, rollup orchestration | Project constraint; excellent Rollup integration |
| preact | ^10.24 | UI framework (popup, Phase 4+) | Project constraint; smaller than React, same API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-extension-reloader | ^0.2 | Auto-reloads extension in browser during dev | Dev only; pairs with `vite --watch` |
| concurrently | ^9.x | Run multiple `vite --watch` processes in parallel | Dev watch mode for all entries simultaneously |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual Rollup config | `@crxjs/vite-plugin` v2.0 | CRXJS adds HMR magic but has Chrome 130+ CSP bugs, plugin history of instability; manual config is transparent and sufficient |
| Manual Rollup config | `vite-plugin-web-extension` (samrum) | Samrum's plugin uses ESM for content scripts, not IIFE; project wants IIFE |
| `concurrently` watch | WXT framework | WXT is the 2025 market leader but is a full framework rewrite — too opinionated for greenfield vanilla JS project |
| Sequential builds | Single Vite config | Rollup does not support IIFE format with multiple entries; single-config approach produces ESM or requires code-splitting which is incompatible with IIFE |

**Installation:**
```bash
bun add -D vite concurrently
bun add preact
# Optional dev-time reload:
bun add -D vite-plugin-extension-reloader
```

---

## Architecture Patterns

### Recommended Project Structure
```
DexEnhance/
├── src/
│   ├── background/
│   │   ├── service_worker.js        # Entry for background build
│   │   └── api_interceptor.js       # Phase 2 stub
│   ├── content/
│   │   ├── shared/
│   │   │   ├── chat-interface.js    # Phase 3 stub
│   │   │   ├── queue.js             # Phase 6 stub
│   │   │   ├── parser.js            # Phase 8 stub
│   │   │   └── api-bridge.js        # Phase 9 stub
│   │   ├── gemini/
│   │   │   ├── index.js             # Entry for gemini content build
│   │   │   └── adapter.js           # Phase 3 stub
│   │   └── chatgpt/
│   │       ├── index.js             # Entry for chatgpt content build
│   │       └── adapter.js           # Phase 3 stub
│   ├── ui/
│   │   ├── components/              # Phase 4+ empty dir
│   │   └── styles/                  # Phase 4+ empty dir
│   ├── lib/
│   │   ├── storage.js               # INFRA-03: implement fully
│   │   └── utils.js                 # INFRA-04: implement fully
│   └── popup/
│       ├── index.html
│       └── index.js
├── public/
│   ├── manifest.json                # Copied verbatim to dist/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                            # Build output (gitignored)
│   ├── background/
│   │   └── service_worker.js
│   ├── content/
│   │   ├── chatgpt/
│   │   │   └── index.js
│   │   └── gemini/
│   │       └── index.js
│   ├── popup/
│   │   ├── index.html
│   │   └── index.js
│   ├── icons/
│   └── manifest.json
├── vite.config.background.js
├── vite.config.chatgpt.js
├── vite.config.gemini.js
├── vite.config.popup.js
└── package.json
```

---

### Pattern 1: Separate Vite Configs per Entry (Recommended)

**What:** Each IIFE bundle requires its own `vite build --config` invocation because Rollup cannot code-split with IIFE format. Four config files handle four entry types: background, chatgpt content, gemini content, popup.

**When to use:** Any time you need IIFE format for multiple independent extension scripts.

**Example — `vite.config.background.js`:**
```javascript
// Source: Verified against https://vite.dev/config/build-options
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/background',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/background/service_worker.js'),
      formats: ['iife'],
      name: 'DexEnhanceBackground',
      fileName: () => 'service_worker.js',
    },
    rollupOptions: {
      output: {
        // Prevent any code splitting — IIFE must be a single file
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
```

**Example — `vite.config.chatgpt.js`:**
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/content/chatgpt',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content/chatgpt/index.js'),
      formats: ['iife'],
      name: 'DexEnhanceChatGPT',
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
```

**Example — `vite.config.gemini.js`:**
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/content/gemini',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content/gemini/index.js'),
      formats: ['iife'],
      name: 'DexEnhanceGemini',
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
```

**Example — `vite.config.popup.js`:**
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/popup',
  build: {
    outDir: resolve(__dirname, 'dist/popup'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/popup/index.html'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
```

**Key insight:** `lib.formats: ['iife']` + `inlineDynamicImports: true` is the canonical pattern for a single-file IIFE bundle. The `name` field is required by Rollup when format is `iife` or `umd` — omitting it causes a build error.

---

### Pattern 2: `package.json` Scripts for Multi-Entry Builds

**What:** Orchestrate all four builds via sequential `bun run` script. No external orchestrator required for production build; `concurrently` used for watch mode.

```json
{
  "name": "dex-enhance",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "bun run build:bg && bun run build:chatgpt && bun run build:gemini && bun run build:popup",
    "build:bg": "bunx --bun vite build --config vite.config.background.js",
    "build:chatgpt": "bunx --bun vite build --config vite.config.chatgpt.js",
    "build:gemini": "bunx --bun vite build --config vite.config.gemini.js",
    "build:popup": "bunx --bun vite build --config vite.config.popup.js",
    "watch": "concurrently \"bun run watch:bg\" \"bun run watch:chatgpt\" \"bun run watch:gemini\" \"bun run watch:popup\"",
    "watch:bg": "bunx --bun vite build --config vite.config.background.js --watch",
    "watch:chatgpt": "bunx --bun vite build --config vite.config.chatgpt.js --watch",
    "watch:gemini": "bunx --bun vite build --config vite.config.gemini.js --watch",
    "watch:popup": "bunx --bun vite build --config vite.config.popup.js --watch"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "concurrently": "^9.0.0"
  },
  "dependencies": {
    "preact": "^10.24.0"
  }
}
```

**Note on `bunx --bun vite`:** Bun's official docs specify that the `--bun` flag is required to ensure Vite runs under Bun's runtime instead of Node.js (Bun respects the `#!/usr/bin/env node` shebang otherwise). Source: https://bun.sh/docs/guides/ecosystem/vite

---

### Pattern 3: Manifest V3 Structure

**What:** The `manifest.json` lives in `public/` and Vite copies it verbatim to `dist/` via the `publicDir` mechanism. Do NOT import it in JS — it is a static asset.

```json
{
  "manifest_version": 3,
  "name": "DexEnhance",
  "version": "0.1.0",
  "description": "AI assistant enhancement for ChatGPT and Gemini",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background/service_worker.js"
  },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*"],
      "js": ["content/chatgpt/index.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://gemini.google.com/*"],
      "js": ["content/gemini/index.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://gemini.google.com/*"
  ]
}
```

**Why both `content_scripts.matches` and `host_permissions`?**
- `content_scripts.matches` controls where the scripts inject.
- `host_permissions` grants the extension elevated cross-origin fetch access to those hosts from the background service worker. You need both for full functionality.

**Note on `"type": "module"` in background:** Do NOT add `"type": "module"` to the background declaration. Official Chrome docs state that `import()` (dynamic imports) is not supported in module-type service workers. Since Vite internally uses dynamic imports for code splitting, using ESM mode would break the build. Stick with IIFE (no `"type"` field in background). Source: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics

---

### Pattern 4: `lib/storage.js` — Promise Wrapper

**What:** Thin convenience wrappers over `chrome.storage.local`, which natively returns Promises in MV3 (no manual promisification needed). Verified: Chrome MV3 APIs are Promise-native. Source: https://developer.chrome.com/docs/extensions/reference/api/storage

```javascript
// src/lib/storage.js
// Chrome MV3 storage.local natively returns Promises — no wrapping needed.
// These helpers normalize the get() return shape and provide a clean API surface.

const storage = chrome.storage.local;

/**
 * Get one or more values from chrome.storage.local.
 * @param {string|string[]} keys
 * @returns {Promise<Record<string, any>>}
 */
export async function storageGet(keys) {
  return storage.get(keys);
}

/**
 * Get a single value by key, returning undefined if not set.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function storageGetOne(key) {
  const result = await storage.get(key);
  return result[key];
}

/**
 * Set one or more key-value pairs in chrome.storage.local.
 * @param {Record<string, any>} items
 * @returns {Promise<void>}
 */
export async function storageSet(items) {
  return storage.set(items);
}

/**
 * Remove one or more keys from chrome.storage.local.
 * @param {string|string[]} keys
 * @returns {Promise<void>}
 */
export async function storageRemove(keys) {
  return storage.remove(keys);
}

/**
 * Clear all data in chrome.storage.local.
 * @returns {Promise<void>}
 */
export async function storageClear() {
  return storage.clear();
}

/**
 * Subscribe to storage changes.
 * @param {function} callback  (changes: {[key]: {oldValue, newValue}}, areaName: string) => void
 */
export function onStorageChange(callback) {
  chrome.storage.onChanged.addListener(callback);
}
```

**Availability:** `chrome.storage.local` is accessible from content scripts by default. It is also available in the background service worker (unlike `localStorage` which is not available in service workers). Default quota: 10 MB (Chrome 114+). Source: https://developer.chrome.com/docs/extensions/reference/api/storage

---

### Pattern 5: `lib/utils.js` — String Utilities

**What:** Pure JS utilities with no library dependencies.

```javascript
// src/lib/utils.js

/**
 * Sanitize a string by removing HTML tags and normalizing whitespace.
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/&[a-z]+;/gi, ' ')    // replace HTML entities
    .replace(/\s+/g, ' ')          // normalize whitespace
    .trim();
}

/**
 * Truncate a string to maxLength, appending suffix if truncated.
 * @param {string} str
 * @param {number} maxLength
 * @param {string} [suffix='...']
 * @returns {string}
 */
export function truncate(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Estimate token count using character-based heuristic.
 * Rule of thumb: ~4 characters per token (OpenAI/GPT convention).
 * @param {string} str
 * @returns {number}
 */
export function estimateTokens(str) {
  if (typeof str !== 'string' || str.length === 0) return 0;
  return Math.ceil(str.length / 4);
}
```

---

### Anti-Patterns to Avoid

- **Using ESM output for background or content scripts without `"type": "module"` in manifest.** The browser will fail silently or throw "invalid JS" errors when loading the extension. Always use IIFE for built output.
- **Adding `"type": "module"` to the background manifest declaration.** This enables ESM in the service worker but disables `import()` (dynamic imports), which Vite uses internally. This causes Vite bundle failures.
- **Using a single Vite config with multiple rollup inputs and `format: 'iife'`.** Rollup does not support code-splitting in IIFE mode; it will error with "UMD and IIFE output formats are not supported for code-splitting builds."
- **Relying on Vite's dev server (`bunx --bun vite`) for extension development.** Vite's dev server serves modules via HTTP + ESM, which the extension runtime cannot consume. Always use `vite build --watch` for extension work.
- **Using `localStorage` in the background service worker.** It does not exist in service worker context. Use `chrome.storage.local` instead.
- **Registering event listeners asynchronously in the background service worker.** Listeners added inside a `Promise` or `setTimeout` callback may not fire because the service worker can be restarted. Always register listeners at the top level, synchronously.
- **Hashed filenames in dist output.** Vite appends content hashes by default (e.g., `service_worker-abc123.js`). This breaks `manifest.json` references. The `lib.fileName: () => 'service_worker.js'` pattern removes the hash.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-format bundle output | Custom Rollup plugins | Vite `build.lib` with `formats: ['iife']` | Rollup's built-in output handles format + minification correctly |
| Extension auto-reload in dev | WebSocket-based reloader script | `vite-plugin-extension-reloader` (or manual: go to `brave://extensions` and click reload) | Reload socket edge cases around service worker termination are complex |
| Token counting | ML-based tokenizer library | `str.length / 4` heuristic in `lib/utils.js` | Accurate tokenizers add large bundle weight; heuristic is sufficient for UI hints |
| Promise-based storage | Manual promisification | Native chrome.storage.local Promises (MV3) | Chrome's MV3 APIs are natively Promise-based; promisifying adds dead code |

**Key insight:** The biggest "don't hand-roll" trap is building a custom Vite plugin to handle multi-entry IIFE output. Multiple config files with sequential builds is simpler, more debuggable, and the established community pattern.

---

## Common Pitfalls

### Pitfall 1: Rollup IIFE + Multiple Inputs Fatal Error
**What goes wrong:** Developer puts all entries into one Vite config using `rollupOptions.input` with multiple files and sets `output.format: 'iife'`. Rollup throws `"Invalid value 'iife' for option 'output.format' — UMD and IIFE output formats are not supported for code-splitting builds."` and the build fails completely.

**Why it happens:** IIFE format is designed for single-file bundles with no module imports between chunks. Multiple entry points trigger Rollup's chunk-splitting logic which is incompatible with IIFE.

**How to avoid:** One entry per Vite config. Each config produces exactly one IIFE file.

**Warning signs:** Build error mentioning "code-splitting" and "IIFE" together.

---

### Pitfall 2: Content-Hashed Filenames Break manifest.json References
**What goes wrong:** Default Vite build produces `service_worker-B3fK2pLm.js`. The `manifest.json` references `background/service_worker.js`. The extension fails to load with "Service worker registration failed" in `brave://extensions`.

**Why it happens:** Vite appends content hashes by default for cache-busting, which is correct for web apps but wrong for extension manifests where filenames are hardcoded.

**How to avoid:** When using `build.lib` mode, use `fileName: () => 'service_worker.js'` (function form) to output a fixed name. For the popup HTML build, set `output.entryFileNames: '[name].js'` without `[hash]`.

**Warning signs:** Filenames in `dist/` have hex strings in them.

---

### Pitfall 3: Vite Dev Server Used Instead of Build Watch
**What goes wrong:** Developer runs `bunx --bun vite` (the dev server) expecting extension to work. Nothing loads; extension source is served as raw ESM modules over HTTP which the browser extension runtime cannot consume.

**Why it happens:** The standard Vite dev flow serves transformed modules via a local HTTP server. Browser extensions can only load files from the `dist/` directory on disk.

**How to avoid:** Always use `bunx --bun vite build --watch` for extension development. After each rebuild, reload the extension in `brave://extensions` (the reload icon next to the extension card).

**Warning signs:** Extension seems to show an old version even after code changes, or content scripts never inject.

---

### Pitfall 4: Event Listeners Registered Asynchronously in Service Worker
**What goes wrong:** Background code reads storage before registering an event listener:
```javascript
// BAD — this listener may never fire
chrome.storage.local.get('config').then(config => {
  chrome.runtime.onMessage.addListener((msg) => { /* ... */ });
});
```
The service worker wakes, starts executing, and Chrome fires the event before the async storage read completes. The listener misses the event.

**Why it happens:** MV3 service workers are ephemeral — they can terminate and restart at any time. Chrome fires events immediately when the worker restarts; any listener registered asynchronously may not be present when the event fires.

**How to avoid:** Register all listeners synchronously at top level. Use storage inside the listener callback, not before.

**Warning signs:** Message listeners and alarm listeners intermittently stop working, especially after browser idle period.

---

### Pitfall 5: Bun Shebang Issue with Vite
**What goes wrong:** Running `bun run build` and seeing Vite execute under Node.js (if installed) instead of Bun, causing potential compatibility discrepancies.

**Why it happens:** Vite's CLI has `#!/usr/bin/env node` at the top. Bun respects that shebang and runs it under Node.js by default.

**How to avoid:** Use `bunx --bun vite` (not just `bunx vite`) in all package.json scripts. The `--bun` flag tells Bun to ignore the shebang and use its own runtime. Source: https://bun.sh/docs/guides/ecosystem/vite

**Warning signs:** `bun --version` and node-related errors appearing during build.

---

### Pitfall 6: MV3 CSP Blocks Inline Scripts / Eval
**What goes wrong:** Extension popup or background script attempts to use `eval()`, `new Function()`, or inline event handlers. Brave/Chrome blocks execution silently or shows CSP violation in console.

**Why it happens:** MV3 enforces `script-src 'self'` with no escape hatch — `'unsafe-eval'` cannot be added to extension_pages CSP.

**How to avoid:** Vite's production build (using esbuild/rollup minification) does not inject eval — it is safe by default. Do not add any eval-based polyfills or libraries that use eval. The concern is a dev-time issue that goes away with the build-only workflow recommended here.

**Warning signs:** `Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script` in DevTools console.

---

### Pitfall 7: @crxjs/vite-plugin Chrome 130+ CSP Bug
**What goes wrong:** If `@crxjs/vite-plugin` is used anyway, content scripts may fail to load on Chrome/Brave 130+ due to a known CSP enforcement change in that Chromium version. Bug was open as of late 2024.

**Why it happens:** CRXJS injects script wrappers that trigger CSP violations in newer Chromium versions.

**How to avoid:** Do not use `@crxjs/vite-plugin` for this project. Manual IIFE config avoids the issue entirely.

---

## Code Examples

Verified patterns from official sources:

### Popup Entry (`src/popup/index.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DexEnhance</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./index.js"></script>
</body>
</html>
```

### Content Script Stub (`src/content/chatgpt/index.js`)
```javascript
// ChatGPT content script entry point
// Runs in ISOLATED world (default) — cannot access page's window/JS variables

import { storageGetOne } from '../../lib/storage.js';

(async function init() {
  const enabled = await storageGetOne('enabled');
  if (enabled === false) return;
  console.log('[DexEnhance] ChatGPT content script loaded');
  // Phase 3 will wire up adapter
})();
```

### Background Service Worker Stub (`src/background/service_worker.js`)
```javascript
// Background service worker — MV3
// IMPORTANT: All event listeners must be registered synchronously at top level

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[DexEnhance] Extension installed:', details.reason);
  // Initialize defaults on first install
  if (details.reason === 'install') {
    chrome.storage.local.set({ enabled: true });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[DexEnhance] Message received:', message);
  // Phase 2 will implement message routing
  sendResponse({ ok: true });
  return false; // synchronous response
});
```

### chrome.storage.local native Promise usage (MV3)
```javascript
// Source: https://developer.chrome.com/docs/extensions/reference/api/storage
// No promisification needed in MV3 — API is natively promise-based

// Set
await chrome.storage.local.set({ enabled: true, threshold: 0.8 });

// Get multiple keys
const result = await chrome.storage.local.get(['enabled', 'threshold']);
console.log(result.enabled, result.threshold);

// Get all
const all = await chrome.storage.local.get(null);

// Remove
await chrome.storage.local.remove('enabled');

// Clear
await chrome.storage.local.clear();
```

### publicDir Configuration (Copying manifest.json and icons)
Vite copies everything in `public/` to `dist/` automatically. No configuration needed. Just place `manifest.json` and `icons/` in `public/`.

If you want an explicit `publicDir` pointing away from the default:
```javascript
// In any vite config where you want public/ copied:
export default defineConfig({
  publicDir: resolve(__dirname, 'public'), // explicit, matches default
  build: { ... },
});
```

**Caution:** When using multiple Vite config runs, only ONE config should copy `public/` (or they will overwrite each other). Set `publicDir: false` in content script configs, and let the background or popup config handle the copy — or handle it with a separate `cp -r public dist` command.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MV2 background pages (persistent) | MV3 service workers (ephemeral) | Chrome 88+ (MV3 launch) | Service workers terminate after ~30s idle; no persistent state |
| `chrome.storage` callbacks | Native Promises in chrome APIs | Chrome 99+ (MV3) | No manual promisification needed |
| `@crxjs/vite-plugin` (beta) | Manual Rollup config OR WXT | 2024-2025 | CRXJS had 3-year beta instability; WXT is now preferred for full frameworks |
| Background `background_page` MV2 | `background.service_worker` MV3 | Chrome 88+ | Must use `chrome.storage` not `localStorage` |
| Rollup `format: 'esm'` for all | IIFE for content + background | MV3 launch | Browser cannot load ESM injection without type:module manifest flag |

**Deprecated/outdated:**
- `"type": "module"` in background service worker: Technically valid per spec but breaks Vite builds due to dynamic import restriction. Avoid.
- `background_scripts` (MV2): Not valid in MV3 manifests.
- `chrome.storage` callbacks: Still work but unnecessary in MV3; use `await chrome.storage.local.get(...)`.
- `vite-plugin-crx-hot-reload`: Archived May 2024, do not use.

---

## Open Questions

1. **publicDir and multiple Vite build invocations**
   - What we know: Each `vite build` invocation with `emptyOutDir: true` will wipe its own outDir. If all configs point to the same `publicDir`, files get copied multiple times (harmless but slow).
   - What's unclear: Whether `emptyOutDir: true` on a sub-directory config (e.g., `outDir: dist/background`) accidentally deletes `dist/manifest.json` placed by an earlier run.
   - Recommendation: Run the popup config LAST (it uses `dist/popup/` as outDir), and have only the popup config (or a dedicated copy step) handle `public/` → `dist/` for `manifest.json` and icons. Alternatively, add a `postbuild` script: `cp -r public/* dist/`.

2. **Brave extensions page URL**
   - What we know: Brave uses `brave://extensions` (not `chrome://extensions`) to manage unpacked extensions.
   - What's unclear: Whether any Brave-specific manifest fields exist for Brave-targeting.
   - Recommendation: No Brave-specific manifest fields were found in research. Treat as standard Chromium MV3. Brave is fully compatible with Chrome MV3 extensions.

3. **Service worker persistence during development**
   - What we know: MV3 service workers terminate after 30 seconds of inactivity. During development this means the background service worker may show as "inactive" in `brave://extensions`.
   - What's unclear: Whether this causes observable problems during Phase 1 verification (Phase 1 has a minimal service worker).
   - Recommendation: For Phase 1 verification, click the "service worker" link in `brave://extensions` to wake it before testing messages. In Phase 2+, use `chrome.alarms` to keep it alive if needed.

---

## Validation Architecture

Phase 1 is infrastructure scaffolding. There are no automated tests to run — validation is manual UAT against the criteria in CONTEXT.md.

### Manual Validation Checklist
| UAT Criteria | How to Verify |
|---|---|
| `bun run build` exits code 0 | Run in terminal; check exit code |
| `dist/` structure correct | `ls dist/` — must have `background/`, `content/chatgpt/`, `content/gemini/`, `popup/`, `manifest.json`, `icons/` |
| Loads in Brave no errors | `brave://extensions` → Load Unpacked → `dist/` → no errors shown |
| No console errors on chatgpt.com | Open DevTools console after visiting chatgpt.com; no red extension errors |
| No console errors on gemini.google.com | Same as above for gemini.google.com |
| storage round-trip works | In content script console: `await chrome.storage.local.set({x:1}); await chrome.storage.local.get('x')` → `{x: 1}` |
| No external network requests | DevTools Network tab → filter by extension origin → should be empty on load |

### Wave 0 Gaps
- No test framework needed for Phase 1. All verification is manual load-and-inspect.
- No CI setup required for Phase 1 (greenfield local project).

---

## Sources

### Primary (HIGH confidence)
- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics — Background service worker ESM restrictions, dynamic import prohibition
- https://developer.chrome.com/docs/extensions/reference/api/storage — chrome.storage.local native Promise support, 10MB limit, content script access
- https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts — matches patterns, run_at values, world field
- https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/ — MV3 CSP restrictions, no unsafe-eval in extension_pages
- https://bun.sh/docs/guides/ecosystem/vite — `bunx --bun vite` requirement, Bun + Vite compatibility
- https://vite.dev/config/build-options — build.lib formats, IIFE support, fileName option

### Secondary (MEDIUM confidence)
- https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/ — CRXJS 2025 state, WXT comparison
- https://github.com/vitejs/vite/issues/18585 — Confirmed: IIFE + code-splitting incompatibility in Vite/Rollup
- Bun official docs (ecosystem guide) — `bunx --bun` flag behavior

### Tertiary (LOW confidence — needs validation)
- Community consensus that `@crxjs/vite-plugin` has Chrome 130+ CSP bug — reported in GitHub issues but not officially documented by CRXJS team
- `publicDir` copy interaction across multiple `vite build` invocations — inferred from Vite docs, not tested against this specific multi-config pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vite, Bun, Preact are project constraints; versions from npm registry
- Architecture (IIFE multi-config): HIGH — Rollup IIFE limitation is documented in official Vite issues and confirmed by multiple sources
- MV3 manifest structure: HIGH — from official Chrome developer docs
- chrome.storage.local API: HIGH — from official Chrome developer reference
- Bun + Vite compatibility: MEDIUM — Bun's ecosystem guide covers it, but no extension-specific Bun+Vite testing found
- @crxjs pitfalls: MEDIUM — reported by community, not yet officially documented by maintainers
- publicDir multi-run behavior: LOW — logical inference; should be validated during Wave 0

**Research date:** 2026-03-03
**Valid until:** 2026-06-01 (stable APIs; Bun and Vite update frequently — re-verify if major version bumps occur)
