# DexEnhance — Requirements

## v1 Requirements

### INFRA — Infrastructure & Build

| ID | Requirement | Status |
|---|---|---|
| INFRA-01 | Vite build pipeline outputting MV3-compliant background script (IIFE), per-site content scripts, and popup assets into `dist/` | Pending |
| INFRA-02 | `manifest.json` (MV3) with correct `host_permissions` for `chatgpt.com` and `gemini.google.com`, `content_scripts` entries, and `background.service_worker` | Pending |
| INFRA-03 | `lib/storage.js` wrapper with typed `get(key)`, `set(key, value)`, `remove(key)` over `chrome.storage.local` with Promise-based error handling | Pending |
| INFRA-04 | `lib/utils.js` with string parsers (sanitize, truncate) and basic token estimation utility (char-count heuristic) | Pending |
| INFRA-05 | Zero external CDN resources — all JS, CSS, and font assets bundled at build time; `vite.config.js` enforces local-only output | Pending |

### CORE — Service Worker & Messaging

| ID | Requirement | Status |
|---|---|---|
| CORE-01 | `background/service_worker.js` acts as single source of truth for all cross-site state; registers message listener on install | Pending |
| CORE-02 | Typed message protocol with `action` discriminator (`STORAGE_GET`, `STORAGE_SET`, `STORAGE_REMOVE`, domain-specific actions) for content script → background communication | Pending |
| CORE-03 | Background handles all `chrome.storage.local` reads/writes on behalf of content scripts; responds via `sendResponse` | Pending |
| CORE-04 | `background/api_interceptor.js` skeleton with `chrome.declarativeNetRequest` rule management functions (updateRules, clearRules) | Pending |

### ADAPT — DOM Adapter Layer

| ID | Requirement | Status |
|---|---|---|
| ADAPT-01 | `content/shared/chat-interface.js` defining the `ChatInterface` contract with methods: `getTextarea()`, `getSubmitButton()`, `getChatListContainer()`, `isGenerating()` | Pending |
| ADAPT-02 | `content/gemini/adapter.js` implementing `ChatInterface` using Gemini's DOM selectors (`.ql-editor`, submit button, conversation container) | Pending |
| ADAPT-03 | `content/chatgpt/adapter.js` implementing `ChatInterface` using ChatGPT's DOM selectors (prompt textarea, send button, nav sidebar) | Pending |
| ADAPT-04 | `MutationObserver` watching submit button `disabled` attribute on both sites; fires `onGeneratingStart` / `onGeneratingEnd` events | Pending |
| ADAPT-05 | `MutationObserver` watching chat list container for new conversation nodes; fires `onNewChat` event | Pending |

### UI — Shadow DOM Injection Framework

| ID | Requirement | Status |
|---|---|---|
| UI-01 | `ui/shadow-renderer.js` factory: creates host `div`, attaches `#shadow-root`, injects scoped CSS link/style into shadow root, returns root for Preact rendering | Pending |
| UI-02 | Preact render function that mounts components into the Shadow DOM root; works within content script context | Pending |
| UI-03 | CSS variable system in `ui/styles/theme.css`: detects host page light/dark state via `prefers-color-scheme` and host body class, maps to `--dex-*` custom properties | Pending |
| UI-04 | `ui/components/Sidebar.jsx` — collapsible panel component that replaces/overlays the native chat sidebar; contains slot for folder tree | Pending |
| UI-05 | `ui/components/FAB.jsx` — Floating Action Button with expandable menu for quick access to Prompt Library and Export | Pending |

### FEAT — Feature Implementations

| ID | Requirement | Status |
|---|---|---|
| FEAT-01 | Folder data model: `{ id: uuid, name: string, parentId: string\|null, chatUrls: string[], createdAt: number, deletedAt: number\|null }` stored via service worker | Pending |
| FEAT-02 | `ui/components/FolderTree.jsx` — virtual folder tree rendered in Shadow DOM sidebar; recursively renders nested folders and chat items | Pending |
| FEAT-03 | Chat URL → folder ID mapping: when user navigates to a chat URL, sidebar highlights the assigned folder | Pending |
| FEAT-04 | Trash / soft-delete: folders and chat mappings set `deletedAt` timestamp; Trash view lists deleted items with restore and permanent-delete options | Pending |
| FEAT-05 | `content/shared/queue.js` — FIFO smart message queue: `enqueue(str)`, `dequeue()`, `peek()`, `isEmpty()`, `size()` | Pending |
| FEAT-06 | Event interception on textarea: captures `keydown` (Enter without Shift) and submit button `click`; calls `preventDefault()` and enqueues if `isGenerating()` is true | Pending |
| FEAT-07 | MutationObserver dequeue trigger: when submit button transitions from disabled → enabled, dequeues next message, populates textarea, dispatches synthetic click | Pending |
| FEAT-08 | Prompt Library data model: `{ id: uuid, title: string, body: string, tags: string[], variables: string[], createdAt: number }` stored cross-site via service worker | Pending |
| FEAT-09 | `ui/components/PromptLibrary.jsx` — browse/search UI for prompts; click-to-insert populates textarea; supports `{{variableName}}` placeholder substitution with inline fill dialog | Pending |
| FEAT-10 | Conversation DOM parser (`content/shared/parser.js`): extracts turn-by-turn messages from both sites into `[{ role: 'user'\|'assistant', content: string }]` array | Pending |
| FEAT-11 | PDF export: uses `jspdf` (bundled) to render parsed conversation; blob generated in content script context; triggers browser download via `URL.createObjectURL` | Pending |
| FEAT-12 | DOCX export: uses `docx` library (bundled) to render parsed conversation with basic heading/paragraph styles; blob generated in content script context | Pending |
| FEAT-13 | Export trigger UI: FAB menu item and sidebar button open export dialog (format selector: PDF / DOCX / Markdown); kicks off export pipeline | Pending |

### API — API Interception

| ID | Requirement | Status |
|---|---|---|
| API-01 | `content/shared/api-bridge.js`: injects inline `<script>` into `document.head` with `world: "MAIN"` to monkey-patch `window.fetch` and `XMLHttpRequest` on both sites | Pending |
| API-02 | Monkey-patched fetch/XHR posts intercepted response metadata (token usage, model name, request URL) to content script via `window.postMessage` with a DexEnhance-namespaced message type | Pending |
| API-03 | Token usage overlay `ui/components/TokenOverlay.jsx`: unobtrusive badge near input area showing tokens used / estimated limit; updates after each message | Pending |

---

## v2 Requirements (Deferred)

- Prompt import/export as JSON file
- Conversation search across all locally cached chat content
- Keyboard shortcut customization (override defaults per-site)
- Multi-model A/B prompt testing (send same prompt to both sites)
- Chrome Web Store submission packaging and listing
- `chrome.storage.sync` for settings backup (not chat data)

---

## Out of Scope

| Item | Reason |
|---|---|
| External server or backend | All data stays local; no accounts or cloud sync |
| Firefox / Safari support | MV3 API differences; out of scope for v1 |
| Mobile browser support | Extensions not supported on mobile Brave |
| Web Store public listing | Private distribution only for v1 |
| Real-time token counting via API | Requires server-side auth; estimation is sufficient |

---

## Traceability

| Requirement | Phase |
|---|---|
| INFRA-01–05 | Phase 1 |
| CORE-01–04 | Phase 2 |
| ADAPT-01–05 | Phase 3 |
| UI-01–05 | Phase 4 |
| FEAT-01–04 | Phase 5 |
| FEAT-05–07 | Phase 6 |
| FEAT-08–09 | Phase 7 |
| FEAT-10–13 | Phase 8 |
| API-01–03 | Phase 9 |
| (all) Brave hardening | Phase 10 |
