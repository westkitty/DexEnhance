# Phase 1 Context: Foundation & Build Pipeline

## Phase Goal

Establish a working Manifest V3 extension skeleton that loads in Brave Browser without errors, with a correctly configured Vite build pipeline, proper manifest, and foundational utility modules.

## Why This Phase Exists

DexEnhance is a greenfield project. Before any feature code can be written, the build infrastructure must be in place. MV3 extensions have strict output format requirements (background as IIFE service worker, content scripts as modules, popup as self-contained bundle). Vite can handle all of this but requires careful multi-entry configuration. The storage wrapper and utils lib are foundational — every subsequent phase depends on them.

## What "Done" Looks Like

- `bun run build` produces a `dist/` directory with all required MV3 assets
- Loading `dist/` as an unpacked extension in Brave shows no errors
- Visiting `chatgpt.com` and `gemini.google.com` shows no console errors from the extension
- `lib/storage.js` can be called from a content script and successfully reads/writes `chrome.storage.local`
- All `src/` module stubs exist with correct import paths (no broken imports)

## Requirements in Scope

- **INFRA-01:** Vite build pipeline outputting MV3-compliant background script (IIFE), per-site content scripts, and popup assets into `dist/`
- **INFRA-02:** `manifest.json` (MV3) with `host_permissions`, `content_scripts`, `background.service_worker`, icons
- **INFRA-03:** `lib/storage.js` — typed Promise wrapper for `chrome.storage.local` (get/set/remove)
- **INFRA-04:** `lib/utils.js` — string sanitizer, truncate, token count estimator (char-based heuristic)
- **INFRA-05:** Zero external CDN — all assets bundled locally

## Technical Context

### Project Constraints
- **Package manager:** Bun (Apple Silicon optimized)
- **Build tool:** Vite 5.x
- **Extension API:** Manifest V3 (Chrome/Brave)
- **Target sites:** `https://chatgpt.com/*` and `https://gemini.google.com/*`
- **UI framework:** Preact (will be set up in Phase 4, but dependency should be added now)
- **Language:** JavaScript (ESM), no TypeScript required
- **Distribution:** Local load via `brave://extensions` (Load Unpacked)

### MV3 Build Requirements
Vite needs multi-entry configuration to produce:
1. `dist/background/service_worker.js` — IIFE format (not ESM, MV3 service workers can't be ESM modules with imports)
2. `dist/content/gemini/index.js` — content script (IIFE or self-executing)
3. `dist/content/chatgpt/index.js` — content script (IIFE or self-executing)
4. `dist/popup/index.html` + JS — popup page
5. Static assets copied: `manifest.json`, icons

### Directory Structure to Scaffold
```
src/
├── background/
│   ├── service_worker.js       # Phase 2 will implement; stub only
│   └── api_interceptor.js      # Phase 2; stub only
├── content/
│   ├── shared/
│   │   ├── chat-interface.js   # Phase 3; stub
│   │   ├── queue.js            # Phase 6; stub
│   │   ├── parser.js           # Phase 8; stub
│   │   └── api-bridge.js       # Phase 9; stub
│   ├── gemini/
│   │   ├── index.js            # Gemini content script entry
│   │   └── adapter.js          # Phase 3; stub
│   └── chatgpt/
│       ├── index.js            # ChatGPT content script entry
│       └── adapter.js          # Phase 3; stub
├── ui/
│   ├── components/             # Phase 4+; empty dir
│   └── styles/                 # Phase 4+; empty dir
├── lib/
│   ├── storage.js              # THIS PHASE — implement fully
│   └── utils.js                # THIS PHASE — implement fully
└── popup/
    ├── index.html
    └── index.js
```

## UAT Criteria

- [ ] `bun run build` exits with code 0, no errors
- [ ] `dist/` contains all required files for a valid MV3 extension
- [ ] Extension loads in Brave via "Load unpacked" pointing at `dist/` with no errors shown in `brave://extensions`
- [ ] Visiting `chatgpt.com`: no red extension errors in DevTools console
- [ ] Visiting `gemini.google.com`: no red extension errors in DevTools console
- [ ] `chrome.storage.local` round-trip (set + get) works when called from a content script (verify via console)
- [ ] No network requests to external domains made at extension load time

## Key Risks

1. **Vite + MV3 IIFE output:** Default Vite ESM output breaks service workers. Need `build.rollupOptions` with explicit `format: 'iife'` for background.
2. **Content script module format:** Content scripts injected by the browser can be ESM in MV3 if `"type": "module"` in manifest, but this has quirks — IIFE is safer and more compatible.
3. **Hot reload:** Vite HMR doesn't work with extensions. Use `--watch` with manual Brave reload.
4. **`@crxjs/vite-plugin`:** A popular plugin that handles MV3 Vite complexity — worth evaluating vs. manual config.
