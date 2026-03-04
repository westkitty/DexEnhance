# DexEnhance

DexEnhance is a Brave/Chromium Manifest V3 extension that enhances ChatGPT and Gemini with shared productivity workflows.

## Features (v1 Scope)

- Cross-site state via background service worker + `chrome.storage.local`
- Folder and chat organization with trash/restore
- Smart message queue while model is generating
- Prompt Library with `{{variable}}` substitution
- Conversation export to PDF and DOCX
- API bridge metadata relay with token/model overlay
- Shadow DOM isolated injected UI (Sidebar + FAB + dialogs)

## Supported Sites

- `https://chatgpt.com/*`
- `https://gemini.google.com/*`

## Requirements

- macOS or another Chromium-compatible environment
- Brave Browser (recommended target)
- Bun (for build/package workflow)

## Build

```bash
cd /Users/andrew/Projects/DexEnhance
bun run build
```

Build output is generated in:

- `/Users/andrew/Projects/DexEnhance/dist`

## Load Unpacked in Brave

1. Open `brave://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `/Users/andrew/Projects/DexEnhance/dist`

## Private Zip Packaging

Create a private distributable zip:

```bash
cd /Users/andrew/Projects/DexEnhance
bun run build
bun run package:zip
```

Output archive:

- `/Users/andrew/Projects/DexEnhance/DexEnhance-v1-private.zip`

Recipients can unzip and load the extracted folder via `brave://extensions` (Load unpacked).

## Automated Verification (Playwright)

Run end-to-end extension checks (service worker, storage round-trip, ChatGPT/Gemini content-script load, Shadow DOM UI mount, screenshots, and JSON report):

```bash
cd /Users/andrew/Projects/DexEnhance
bun run build
node scripts/verify_extension_playwright.cjs
```

Verification report output:

- `/Users/andrew/Projects/DexEnhance/.planning/phases/phase-10/phase-10-03-playwright-verification.json`

Screenshots output:

- `/Users/andrew/Projects/DexEnhance/output/playwright/phase10-chatgpt.png`
- `/Users/andrew/Projects/DexEnhance/output/playwright/phase10-gemini.png`

## Security/Runtime Constraints

- Manifest V3 only
- No external CDN/runtime font dependencies
- Background and content bundles output as IIFE
- Service-worker listeners registered synchronously at top level
- DOM interactions routed through adapters (`ChatInterface`)

## Development

Watch mode:

```bash
cd /Users/andrew/Projects/DexEnhance
bun run watch
```

Important: use `bunx --bun vite` (already encoded in scripts).

## Troubleshooting

- `Cannot read properties of undefined (reading 'local')` when running `chrome.storage.local` in page DevTools:
  That command fails in normal page context. `chrome.storage` APIs are available in extension contexts (content script/service worker), and `scripts/verify_extension_playwright.cjs` validates this automatically via the extension service worker.
