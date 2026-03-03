---
phase: phase-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.background.js
  - vite.config.chatgpt.js
  - vite.config.gemini.js
  - vite.config.popup.js
  - public/manifest.json
  - public/icons/icon16.png
  - public/icons/icon48.png
  - public/icons/icon128.png
  - src/lib/storage.js
  - src/lib/utils.js
  - src/background/service_worker.js
  - src/background/api_interceptor.js
  - src/content/shared/chat-interface.js
  - src/content/shared/queue.js
  - src/content/shared/parser.js
  - src/content/shared/api-bridge.js
  - src/content/chatgpt/index.js
  - src/content/chatgpt/adapter.js
  - src/content/gemini/index.js
  - src/content/gemini/adapter.js
  - src/popup/index.html
  - src/popup/index.js
  - .gitignore
autonomous: false
requirements:
  - INFRA-01
  - INFRA-02
  - INFRA-03
  - INFRA-04
  - INFRA-05

must_haves:
  truths:
    - "`bun run build` completes with exit code 0 and no errors"
    - "dist/ contains all MV3-required files at correct paths"
    - "Extension loads in Brave via Load Unpacked with no errors in brave://extensions"
    - "No console errors from the extension on chatgpt.com"
    - "No console errors from the extension on gemini.google.com"
    - "chrome.storage.local round-trip (set + get) works from a content script"
    - "Zero external network requests at extension load time"
  artifacts:
    - path: "dist/background/service_worker.js"
      provides: "MV3 background service worker (IIFE)"
    - path: "dist/content/chatgpt/index.js"
      provides: "ChatGPT content script (IIFE)"
    - path: "dist/content/gemini/index.js"
      provides: "Gemini content script (IIFE)"
    - path: "dist/popup/index.html"
      provides: "Extension popup page"
    - path: "dist/manifest.json"
      provides: "MV3 manifest (copied from public/)"
    - path: "dist/icons/icon16.png"
      provides: "Extension icon"
    - path: "src/lib/storage.js"
      provides: "storageGet, storageGetOne, storageSet, storageRemove, storageClear, onStorageChange"
      exports: ["storageGet", "storageGetOne", "storageSet", "storageRemove", "storageClear", "onStorageChange"]
    - path: "src/lib/utils.js"
      provides: "sanitize, truncate, estimateTokens"
      exports: ["sanitize", "truncate", "estimateTokens"]
  key_links:
    - from: "public/manifest.json"
      to: "dist/manifest.json"
      via: "cp -r public/. dist/ in copy:public script"
      pattern: "copy:public"
    - from: "src/content/chatgpt/index.js"
      to: "src/lib/storage.js"
      via: "import { storageGetOne } from '../../lib/storage.js'"
      pattern: "storageGetOne"
    - from: "public/manifest.json background.service_worker"
      to: "dist/background/service_worker.js"
      via: "fixed fileName in vite.config.background.js"
      pattern: "service_worker.js"
---

<objective>
Scaffold the entire DexEnhance MV3 extension from a blank directory: install dependencies, configure four Vite build pipelines, write the manifest, implement the two core library modules (storage + utils), and create all source stubs. End state: `bun run build` succeeds and the extension loads cleanly in Brave with no errors on either target site.

Purpose: Every subsequent phase depends on this foundation. No feature code can be written until the build pipeline proves it can produce valid MV3 output.

Output:
- package.json with all scripts and dependencies
- 4 Vite config files (background, chatgpt, gemini, popup)
- public/manifest.json + placeholder icon PNGs
- src/lib/storage.js (full implementation)
- src/lib/utils.js (full implementation)
- All src/ entry points and stubs with correct import paths
- dist/ built output verified to load in Brave
</objective>

<execution_context>
Working directory: /Users/andrew/Projects/DexEnhance
Package manager: bun (use `bun` / `bunx --bun` — NOT npm/npx)
Build tool: Vite 5.x via bunx --bun vite
Shell: zsh on macOS Apple Silicon
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/phase-1/CONTEXT.md
@.planning/phases/phase-1/RESEARCH.md
</context>

<tasks>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 0 — Project Setup
     Initialize bun project, install deps, create directory skeleton,
     add .gitignore. Everything else depends on this.
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 1: Initialize project, install dependencies, create directory structure</name>
  <files>
    package.json
    .gitignore
    src/background/.gitkeep
    src/content/shared/.gitkeep
    src/content/chatgpt/.gitkeep
    src/content/gemini/.gitkeep
    src/ui/components/.gitkeep
    src/ui/styles/.gitkeep
    src/lib/.gitkeep
    src/popup/.gitkeep
    public/icons/.gitkeep
  </files>
  <action>
Run the following commands in sequence from /Users/andrew/Projects/DexEnhance:

STEP 1 — Initialize bun project (accept all defaults):
```
bun init -y
```

STEP 2 — Install dependencies:
```
bun add -D vite concurrently
bun add preact
```

STEP 3 — Replace the auto-generated package.json with exactly this content:
```json
{
  "name": "dex-enhance",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "bun run build:bg && bun run build:chatgpt && bun run build:gemini && bun run build:popup && bun run copy:public",
    "build:bg": "bunx --bun vite build --config vite.config.background.js",
    "build:chatgpt": "bunx --bun vite build --config vite.config.chatgpt.js",
    "build:gemini": "bunx --bun vite build --config vite.config.gemini.js",
    "build:popup": "bunx --bun vite build --config vite.config.popup.js",
    "copy:public": "cp -r public/. dist/",
    "watch": "concurrently \"bun run watch:bg\" \"bun run watch:chatgpt\" \"bun run watch:gemini\" \"bun run watch:popup\"",
    "watch:bg": "bunx --bun vite build --config vite.config.background.js --watch",
    "watch:chatgpt": "bunx --bun vite build --config vite.config.chatgpt.js --watch",
    "watch:gemini": "bunx --bun vite build --config vite.config.gemini.js --watch",
    "watch:popup": "bunx --bun vite build --config vite.config.popup.js --watch"
  },
  "dependencies": {
    "preact": "^10.24.0"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "vite": "^5.4.0"
  }
}
```

NOTE: After running `bun add`, bun will have written its own package.json with resolved versions. Keep those resolved versions (from bun.lock) but ensure the scripts block matches exactly what is shown above. The versions shown are minimums — use whatever bun resolved.

STEP 4 — Create .gitignore:
```
node_modules/
dist/
bun.lockb
*.DS_Store
```

STEP 5 — Create required directory placeholders (bun and git need files to track empty dirs). Use `mkdir -p` for all directories, then touch a .gitkeep in each leaf directory that will remain empty through Phase 1:
```
mkdir -p src/background src/content/shared src/content/chatgpt src/content/gemini
mkdir -p src/ui/components src/ui/styles src/lib src/popup public/icons
touch src/ui/components/.gitkeep src/ui/styles/.gitkeep
```

(The non-empty dirs — background, content/*, lib, popup, public/icons — will get real files in later tasks. Do not touch .gitkeep in those.)
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && bun --version && ls package.json bun.lockb node_modules/.bin/vite && node_modules/.bin/vite --version</automated>
  </verify>
  <done>
- package.json exists with correct scripts block
- node_modules/ contains vite and concurrently
- bun.lockb exists
- Directory tree src/ and public/ created
- .gitignore exists
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 1 — Vite Config Files
     Four config files that define the build pipeline.
     All are independent of each other and of source files.
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 2: Create all four Vite config files</name>
  <files>
    vite.config.background.js
    vite.config.chatgpt.js
    vite.config.gemini.js
    vite.config.popup.js
  </files>
  <action>
Create each file with the EXACT content shown below. No modifications.

CRITICAL rules encoded in these configs (do NOT alter):
- `formats: ['iife']` — MV3 requires IIFE, not ESM, for service worker and content scripts
- `inlineDynamicImports: true` — Rollup cannot code-split with IIFE; this collapses everything into one file
- `fileName: () => 'service_worker.js'` — function form prevents Vite from appending content hash (would break manifest.json reference)
- `publicDir: false` on background/content configs — only popup config (or copy:public script) copies public/ to dist/
- `minify: 'esbuild'` — safe for MV3 (no eval, no new Function)
- Do NOT add `@crxjs/vite-plugin` — it has a Chrome 130+ CSP bug

---

FILE: /Users/andrew/Projects/DexEnhance/vite.config.background.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
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
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
```

---

FILE: /Users/andrew/Projects/DexEnhance/vite.config.chatgpt.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
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

---

FILE: /Users/andrew/Projects/DexEnhance/vite.config.gemini.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
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

---

FILE: /Users/andrew/Projects/DexEnhance/vite.config.popup.js
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // publicDir defaults to 'public' — popup config does NOT copy public/ here.
  // Instead, the `copy:public` npm script runs after all builds: cp -r public/. dist/
  // This avoids race conditions between emptyOutDir and the copy step.
  publicDir: false,
  root: resolve(__dirname, 'src/popup'),
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
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && ls vite.config.background.js vite.config.chatgpt.js vite.config.gemini.js vite.config.popup.js</automated>
  </verify>
  <done>
All four vite config files exist at the project root with the exact content specified. No hash patterns in fileName, inlineDynamicImports: true on all IIFE configs, publicDir: false on all four configs.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 2 — Core Files
     manifest.json, lib/storage.js, lib/utils.js
     These are independent of each other. They must exist before
     source stubs can reference them.
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 3: Create manifest.json and lib modules (storage + utils)</name>
  <files>
    public/manifest.json
    src/lib/storage.js
    src/lib/utils.js
  </files>
  <action>
Create the three files below with EXACT content. Do not modify.

---

FILE: /Users/andrew/Projects/DexEnhance/public/manifest.json

CRITICAL manifest rules (do NOT alter):
- `"manifest_version": 3` — required for Brave MV3
- `"background"` has NO `"type": "module"` field — adding it disables dynamic imports in the service worker, which breaks Vite's bundling
- `"content_scripts"` uses NO `"type": "module"` — IIFE bundles do not need it and it causes issues in Brave
- `"run_at": "document_idle"` — content scripts inject after DOM is ready
- Both `content_scripts.matches` AND `host_permissions` are required: matches controls injection, host_permissions grants elevated cross-origin fetch from background

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

---

FILE: /Users/andrew/Projects/DexEnhance/src/lib/storage.js

NOTE: chrome.storage.local natively returns Promises in MV3 — no manual promisification needed. This module is a thin API surface for consistent access patterns.

```javascript
// src/lib/storage.js
// Chrome MV3: chrome.storage.local is natively Promise-based.
// No callbacks, no polyfills required.
// Available in both content scripts and service worker contexts.

const storage = chrome.storage.local;

/**
 * Get one or more values from chrome.storage.local.
 * @param {string|string[]|null} keys - Key(s) to retrieve. Pass null to get all.
 * @returns {Promise<Record<string, any>>}
 */
export async function storageGet(keys) {
  return storage.get(keys);
}

/**
 * Get a single value by key. Returns undefined if the key does not exist.
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
 * Clear ALL data from chrome.storage.local.
 * Use with caution — this wipes all extension data for the user.
 * @returns {Promise<void>}
 */
export async function storageClear() {
  return storage.clear();
}

/**
 * Subscribe to storage change events.
 * Fires whenever any key changes in chrome.storage.local.
 * @param {function} callback - (changes: {[key]: {oldValue, newValue}}, areaName: string) => void
 */
export function onStorageChange(callback) {
  chrome.storage.onChanged.addListener(callback);
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/lib/utils.js

```javascript
// src/lib/utils.js
// Pure utility functions — no external dependencies.

/**
 * Strip HTML tags and normalize whitespace from a string.
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/&[a-z]+;/gi, ' ')    // replace HTML entities with space
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

/**
 * Truncate a string to maxLength characters, appending suffix if truncated.
 * @param {string} str
 * @param {number} maxLength - Maximum length of the returned string including suffix
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
 * Rule of thumb: ~4 characters per token (GPT/Claude convention).
 * Sufficient for UI hints; not a replacement for a real tokenizer.
 * @param {string} str
 * @returns {number}
 */
export function estimateTokens(str) {
  if (typeof str !== 'string' || str.length === 0) return 0;
  return Math.ceil(str.length / 4);
}
```
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && ls public/manifest.json src/lib/storage.js src/lib/utils.js && node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('public/manifest.json','utf8')); if(m.manifest_version!==3) throw new Error('bad manifest'); if(m.background.type) throw new Error('background must not have type:module'); console.log('manifest OK');"</automated>
  </verify>
  <done>
- public/manifest.json is valid MV3 JSON with no "type" field in background
- src/lib/storage.js exports: storageGet, storageGetOne, storageSet, storageRemove, storageClear, onStorageChange
- src/lib/utils.js exports: sanitize, truncate, estimateTokens
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 3 — Source Files
     All entry points and stubs. Content scripts import from lib/,
     so lib/ must exist first (handled in Task 3).
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 4: Create all source entry points and stub modules</name>
  <files>
    src/background/service_worker.js
    src/background/api_interceptor.js
    src/content/shared/chat-interface.js
    src/content/shared/queue.js
    src/content/shared/parser.js
    src/content/shared/api-bridge.js
    src/content/chatgpt/index.js
    src/content/chatgpt/adapter.js
    src/content/gemini/index.js
    src/content/gemini/adapter.js
    src/popup/index.html
    src/popup/index.js
  </files>
  <action>
Create each file with the EXACT content shown. These are the skeleton files that Phase 2+ will fill in. The Phase 1 goal is: correct import paths, no broken references, no runtime errors.

CRITICAL service worker rules (baked in below):
- All chrome.* event listeners MUST be registered synchronously at top level
- No async code before listener registration
- Do NOT use localStorage — not available in service workers; use chrome.storage.local

---

FILE: /Users/andrew/Projects/DexEnhance/src/background/service_worker.js
```javascript
// Background service worker — Manifest V3
//
// RULES (do not violate in future edits):
// 1. All chrome.* event listeners MUST be registered synchronously at the top level.
//    Never register them inside a Promise, setTimeout, or async function.
//    Chrome fires events immediately on service worker startup; async registration = missed events.
// 2. Do NOT use localStorage — unavailable in service worker context.
//    Use chrome.storage.local instead.
// 3. Do NOT add "type": "module" to manifest.json background declaration.
//    This file is compiled to IIFE by Vite and must stay that way.

// ─── Event: Extension Installed / Updated ────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[DexEnhance] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Set default storage values on first install
    chrome.storage.local.set({
      enabled: true,
      version: '0.1.0',
    });
  }
});

// ─── Event: Messages from Content Scripts ────────────────────────────────────
// Phase 2 will replace this stub with the full message router.
// The listener must be registered here, synchronously, at top level.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[DexEnhance] Message from content script:', message, 'tab:', sender.tab?.id);
  // Stub: acknowledge all messages. Phase 2 will route by message.action.
  sendResponse({ ok: true });
  // Return false = synchronous response (no async sendResponse needed yet).
  return false;
});
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/background/api_interceptor.js
```javascript
// API interceptor — stub for Phase 2 / Phase 9
// Will manage chrome.declarativeNetRequest rules for API interception.

/**
 * Add or update declarativeNetRequest rules.
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 * @returns {Promise<void>}
 */
export async function updateRules(rules) {
  // TODO (Phase 9): implement rule management
  console.log('[DexEnhance] api_interceptor.updateRules stub called', rules);
}

/**
 * Remove all active declarativeNetRequest rules.
 * @returns {Promise<void>}
 */
export async function clearRules() {
  // TODO (Phase 9): implement rule clearing
  console.log('[DexEnhance] api_interceptor.clearRules stub called');
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/shared/chat-interface.js
```javascript
// ChatInterface contract — implemented by per-site adapters (Phase 3)
//
// All feature code interacts with sites through this interface.
// Never use raw DOM selectors outside of adapter.js files.

/**
 * @interface ChatInterface
 *
 * Adapters implementing this contract:
 *   - src/content/chatgpt/adapter.js
 *   - src/content/gemini/adapter.js
 */
export class ChatInterface {
  /** @returns {HTMLElement|null} The active text input / textarea */
  getTextarea() { return null; }

  /** @returns {HTMLElement|null} The submit / send button */
  getSubmitButton() { return null; }

  /** @returns {HTMLElement|null} The chat list / conversation history container */
  getChatListContainer() { return null; }

  /** @returns {boolean} True if the AI is currently generating a response */
  isGenerating() { return false; }
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/shared/queue.js
```javascript
// Smart message queue — stub for Phase 6
// FIFO queue used to hold messages while AI is generating.

/**
 * @returns {object} A new queue instance
 */
export function createQueue() {
  const items = [];
  return {
    /** @param {string} message */
    enqueue(message) { items.push(message); },
    /** @returns {string|undefined} */
    dequeue() { return items.shift(); },
    /** @returns {string|undefined} */
    peek() { return items[0]; },
    /** @returns {boolean} */
    isEmpty() { return items.length === 0; },
    /** @returns {number} */
    size() { return items.length; },
  };
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/shared/parser.js
```javascript
// Conversation DOM parser — stub for Phase 8
// Extracts turn-by-turn messages from ChatGPT and Gemini DOM.

/**
 * Parse the current page's conversation into a structured array.
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
export function parseConversation() {
  // TODO (Phase 8): implement per-site conversation extraction
  console.warn('[DexEnhance] parser.parseConversation is a stub');
  return [];
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/shared/api-bridge.js
```javascript
// API bridge — stub for Phase 9
// Injects a main-world script to intercept window.fetch and XMLHttpRequest,
// then relays token/model metadata to the content script via postMessage.

/**
 * Inject the main-world interceptor script into document.head.
 * Must be called from a content script with world: "MAIN" or via scripting API.
 */
export function injectApiBridge() {
  // TODO (Phase 9): inject inline script that monkey-patches window.fetch + XHR
  console.warn('[DexEnhance] api-bridge.injectApiBridge is a stub');
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/chatgpt/index.js
```javascript
// ChatGPT content script entry point
// Runs in ISOLATED world (default) — cannot access the page's window JS context.
// Compiled to IIFE by vite.config.chatgpt.js.

import { storageGetOne } from '../../lib/storage.js';

(async function init() {
  // Guard: allow disabling extension without uninstalling
  const enabled = await storageGetOne('enabled');
  if (enabled === false) return;

  console.log('[DexEnhance] ChatGPT content script loaded');
  // Phase 3 will wire up ChatGPTAdapter here.
  // Phase 4 will mount Shadow DOM UI here.
})();
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/chatgpt/adapter.js
```javascript
// ChatGPT DOM adapter — stub for Phase 3
// Implements ChatInterface using ChatGPT's current DOM selectors.

import { ChatInterface } from '../shared/chat-interface.js';

export class ChatGPTAdapter extends ChatInterface {
  // TODO (Phase 3): implement all ChatInterface methods using ChatGPT selectors
  // Selectors to target (verify against live DOM in Phase 3):
  //   textarea: #prompt-textarea or [data-testid="send-button"] sibling
  //   submit button: [data-testid="send-button"]
  //   chat list: nav element containing conversation history
  //   isGenerating: submit button disabled attribute
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/gemini/index.js
```javascript
// Gemini content script entry point
// Runs in ISOLATED world (default) — cannot access the page's window JS context.
// Compiled to IIFE by vite.config.gemini.js.

import { storageGetOne } from '../../lib/storage.js';

(async function init() {
  // Guard: allow disabling extension without uninstalling
  const enabled = await storageGetOne('enabled');
  if (enabled === false) return;

  console.log('[DexEnhance] Gemini content script loaded');
  // Phase 3 will wire up GeminiAdapter here.
  // Phase 4 will mount Shadow DOM UI here.
})();
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/content/gemini/adapter.js
```javascript
// Gemini DOM adapter — stub for Phase 3
// Implements ChatInterface using Gemini's current DOM selectors.

import { ChatInterface } from '../shared/chat-interface.js';

export class GeminiAdapter extends ChatInterface {
  // TODO (Phase 3): implement all ChatInterface methods using Gemini selectors
  // Selectors to target (verify against live DOM in Phase 3):
  //   textarea: .ql-editor (Quill-based rich text editor)
  //   submit button: button[aria-label="Send message"] or equivalent
  //   chat list: conversation history container
  //   isGenerating: submit button disabled attribute
}
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/popup/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DexEnhance</title>
  <style>
    body {
      margin: 0;
      min-width: 280px;
      min-height: 120px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1a1a2e;
      color: #e8e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      padding: 20px;
      text-align: center;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    p {
      font-size: 13px;
      color: #9999bb;
      margin: 0;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="container">
      <h1>DexEnhance</h1>
      <p>Phase 4 will add the full UI here.</p>
    </div>
  </div>
  <script type="module" src="./index.js"></script>
</body>
</html>
```

---

FILE: /Users/andrew/Projects/DexEnhance/src/popup/index.js
```javascript
// Popup entry point
// Phase 4 will mount a Preact component tree here.
// For now, the static HTML in index.html is sufficient.

console.log('[DexEnhance] Popup loaded');
```
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && ls src/background/service_worker.js src/background/api_interceptor.js src/content/shared/chat-interface.js src/content/shared/queue.js src/content/shared/parser.js src/content/shared/api-bridge.js src/content/chatgpt/index.js src/content/chatgpt/adapter.js src/content/gemini/index.js src/content/gemini/adapter.js src/popup/index.html src/popup/index.js</automated>
  </verify>
  <done>
All 12 source files exist. Content script entry points import from ../../lib/storage.js. Service worker registers all listeners synchronously at top level. No broken import paths.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 4 — Icons
     Placeholder PNG files required by manifest.json.
     Brave will refuse to load the extension without them.
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 5: Generate placeholder icon PNGs</name>
  <files>
    public/icons/icon16.png
    public/icons/icon48.png
    public/icons/icon128.png
  </files>
  <action>
Generate minimal valid PNG files for each icon size. The extension will not load in Brave without icon files referenced in manifest.json.

Use this Python script to generate minimal valid PNGs. Run it from /Users/andrew/Projects/DexEnhance:

```bash
python3 - <<'PYEOF'
import struct, zlib, os

def make_png(size, color=(99, 102, 241)):
    """Create a minimal valid PNG of `size` x `size` pixels filled with `color` (RGB)."""
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(c[4:]) & 0xffffffff)

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    # IDAT: one scanline per row, filter byte 0 + RGB pixels
    raw_rows = b''
    row = b'\x00' + bytes(color) * size
    for _ in range(size):
        raw_rows += row
    idat_data = zlib.compress(raw_rows)
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', ihdr_data)
        + chunk(b'IDAT', idat_data)
        + chunk(b'IEND', b'')
    )

os.makedirs('public/icons', exist_ok=True)
for size in [16, 48, 128]:
    with open(f'public/icons/icon{size}.png', 'wb') as f:
        f.write(make_png(size))
    print(f'Created public/icons/icon{size}.png ({size}x{size}px)')

print('Done.')
PYEOF
```

This creates three valid PNG files: a solid indigo square (color #6366F1 ≈ RGB 99,102,241) at 16×16, 48×48, and 128×128 pixels. These are real PNGs, not empty files — Brave validates PNG headers when loading icons.

If python3 is unavailable (unlikely on macOS), use this alternative approach with ImageMagick (if installed):
```bash
magick -size 16x16 xc:'#6366f1' public/icons/icon16.png
magick -size 48x48 xc:'#6366f1' public/icons/icon48.png
magick -size 128x128 xc:'#6366f1' public/icons/icon128.png
```

Verify the files are real PNGs (not zero bytes) after creation.
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && python3 -c "
import struct
for size in [16, 48, 128]:
    with open(f'public/icons/icon{size}.png', 'rb') as f:
        header = f.read(8)
    assert header == b'\x89PNG\r\n\x1a\n', f'icon{size}.png is not a valid PNG'
    print(f'icon{size}.png: valid PNG header')
print('All icons valid.')
"</automated>
  </verify>
  <done>
public/icons/icon16.png, icon48.png, and icon128.png exist and are valid PNG files (not empty, not placeholder text). Brave can load them without errors.
  </done>
</task>

<!-- ═══════════════════════════════════════════════════════════════
     WAVE 5 — Build Validation
     Run the build, verify dist/ structure, then load in Brave.
     ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task 6: Run build and verify dist/ output structure</name>
  <files>
    dist/background/service_worker.js
    dist/content/chatgpt/index.js
    dist/content/gemini/index.js
    dist/popup/index.html
    dist/popup/index.js
    dist/manifest.json
    dist/icons/icon16.png
    dist/icons/icon48.png
    dist/icons/icon128.png
  </files>
  <action>
Run the full build from /Users/andrew/Projects/DexEnhance and verify all expected output files are present.

STEP 1 — Run the build:
```bash
cd /Users/andrew/Projects/DexEnhance && bun run build
```

Expected output: four sequential Vite builds followed by `cp -r public/. dist/`. Each build should print "vite ... built in Xms" with no error messages. Exit code must be 0.

STEP 2 — Verify dist/ structure:
```bash
ls dist/background/service_worker.js \
   dist/content/chatgpt/index.js \
   dist/content/gemini/index.js \
   dist/popup/index.html \
   dist/manifest.json \
   dist/icons/icon16.png \
   dist/icons/icon48.png \
   dist/icons/icon128.png
```

All files must exist. If any are missing, diagnose which build step failed.

STEP 3 — Verify no hash in filenames (common failure mode):
```bash
ls dist/background/
# Must show: service_worker.js  (NOT service_worker-abc123.js)
ls dist/content/chatgpt/
# Must show: index.js  (NOT index-abc123.js)
ls dist/content/gemini/
# Must show: index.js
```

STEP 4 — Verify service worker is IIFE format (not ESM):
```bash
head -1 dist/background/service_worker.js
# Must start with: var DexEnhanceBackground=function(){  (or similar IIFE wrapper)
# Must NOT start with: import  or  export
```

STEP 5 — Spot-check manifest copied correctly:
```bash
node -e "const m=require('./dist/manifest.json'); console.log('MV:', m.manifest_version, 'SW:', m.background.service_worker, 'OK');"
```

If the build fails, common causes:
- Missing source file → check all files from Task 4 exist
- "IIFE + code-splitting" error → check vite config has inlineDynamicImports: true
- Hash in filename → check fileName: () => 'service_worker.js' in config (function form, not string)
- "name is required for iife" → check name: 'DexEnhanceBackground' is in lib config
  </action>
  <verify>
    <automated>cd /Users/andrew/Projects/DexEnhance && bun run build && ls dist/background/service_worker.js dist/content/chatgpt/index.js dist/content/gemini/index.js dist/popup/index.html dist/manifest.json dist/icons/icon16.png && echo "BUILD OK"</automated>
  </verify>
  <done>
- `bun run build` exits code 0
- All required dist/ files present with correct (non-hashed) filenames
- dist/background/service_worker.js begins with IIFE wrapper (var ... = function(){})
- dist/manifest.json is present and valid
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete MV3 extension skeleton built to dist/. The extension has:
- A background service worker (IIFE, no errors)
- Content scripts for chatgpt.com and gemini.google.com (IIFE, minimal init)
- A popup page
- Valid manifest.json with icons

All automated build checks passed.
  </what-built>
  <how-to-verify>
STEP 1 — Load the extension in Brave:
1. Open Brave Browser
2. Go to brave://extensions
3. Enable "Developer mode" (toggle, top right)
4. Click "Load unpacked"
5. Navigate to /Users/andrew/Projects/DexEnhance/dist
6. Click "Select" / "Open"

Expected: Extension card appears showing "DexEnhance" with no red error badge.

STEP 2 — Check the service worker:
In brave://extensions, find DexEnhance and click "service worker" (blue link).
Expected: DevTools opens on the service worker. Console should show:
  "[DexEnhance] Extension installed/updated: install"
No red errors.

STEP 3 — Verify chatgpt.com:
1. Visit https://chatgpt.com
2. Open DevTools (Cmd+Option+I) → Console tab
3. Check for any red [DexEnhance] errors
Expected: You should see "[DexEnhance] ChatGPT content script loaded"
No red errors from the extension.

STEP 4 — Verify gemini.google.com:
1. Visit https://gemini.google.com
2. Open DevTools → Console tab
Expected: You should see "[DexEnhance] Gemini content script loaded"
No red errors from the extension.

STEP 5 — Verify chrome.storage.local round-trip (on either site):
In the DevTools console (on chatgpt.com or gemini.google.com), run:
```javascript
await chrome.storage.local.set({ dexTest: 'hello' });
const r = await chrome.storage.local.get('dexTest');
console.log(r); // should print: {dexTest: 'hello'}
```
Expected: {dexTest: 'hello'} printed. No errors.

STEP 6 — Check for external network requests:
In DevTools → Network tab, reload the page.
Filter by "Extension" or look for any requests to external domains.
Expected: No network requests originating from the DexEnhance extension.
  </how-to-verify>
  <resume-signal>
Type "approved" if all 6 steps pass.
If any step fails, describe the error you see (e.g., "step 3 fails: Uncaught SyntaxError in content script") and the executor will diagnose and fix before re-verifying.
  </resume-signal>
</task>

</tasks>

<verification>
Automated checks (run after Task 6):
```bash
cd /Users/andrew/Projects/DexEnhance

# 1. Build succeeds
bun run build

# 2. Required files exist
ls dist/background/service_worker.js \
   dist/content/chatgpt/index.js \
   dist/content/gemini/index.js \
   dist/popup/index.html \
   dist/manifest.json \
   dist/icons/icon16.png

# 3. No hashes in filenames
[[ $(ls dist/background/ | grep -v service_worker.js | wc -l) -eq 0 ]] && echo "No extra files in dist/background"

# 4. IIFE format (must not start with import/export)
head -1 dist/background/service_worker.js | grep -v "^import\|^export" && echo "IIFE format confirmed"

# 5. Manifest is valid JSON with correct MV version
node -e "const m=require('./dist/manifest.json'); console.assert(m.manifest_version===3); console.assert(!m.background.type); console.log('Manifest OK');"

# 6. Icons are real PNGs
python3 -c "
for s in [16,48,128]:
    with open(f'dist/icons/icon{s}.png','rb') as f:
        assert f.read(8)==b'\x89PNG\r\n\x1a\n',f'icon{s} not PNG'
print('Icons OK')
"
```

Manual UAT (checkpoint:human-verify, Task 7):
- Extension loads in Brave with no errors
- Console log visible on chatgpt.com and gemini.google.com
- chrome.storage.local round-trip works
- No external network requests
</verification>

<success_criteria>
Phase 1 is complete when:
- [ ] `bun run build` exits code 0, no errors in terminal
- [ ] dist/ contains all 9 required files (service_worker.js, chatgpt/index.js, gemini/index.js, popup/index.html, popup/index.js, manifest.json, icon16/48/128.png) with exact non-hashed filenames
- [ ] No file in dist/ has a content-hash suffix (e.g., no index-B3fK2pLm.js)
- [ ] dist/background/service_worker.js is IIFE format (not ESM)
- [ ] Extension loads in Brave with no error badge in brave://extensions
- [ ] "[DexEnhance] ChatGPT content script loaded" visible in chatgpt.com console
- [ ] "[DexEnhance] Gemini content script loaded" visible in gemini.google.com console
- [ ] chrome.storage.local set+get round-trip returns expected value
- [ ] Zero external network requests from extension on page load
</success_criteria>

<output>
After checkpoint approval, create /Users/andrew/Projects/DexEnhance/.planning/phases/phase-1/phase-1-01-SUMMARY.md with:
- What was built (files created, build pipeline established)
- Key decisions made (confirmed: separate Vite configs, IIFE format, no @crxjs, bunx --bun)
- Patterns established (import paths: ../../lib/storage.js from content scripts)
- Any deviations from the plan and why
- Confirmation of all UAT criteria passing
</output>
