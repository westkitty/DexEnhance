# File Tree and Module Contracts

This is the recommended **implementation target** for Codex inside the existing DexEnhance repo.

It preserves the real extension layout while upgrading the feature surfaces and module clarity.

## 1. Top-level tree

```text
DexEnhance/
├── BIBLE.md
├── package.json
├── bun.lockb
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       ├── icon1024.png
│       └── dex-logo-circle.svg
├── src/
│   ├── background/
│   │   ├── service_worker.js
│   │   ├── state_migrations.js
│   │   ├── message_router.js
│   │   ├── optimizer_hidden_tab.js
│   │   └── api_interceptor.js
│   ├── content/
│   │   ├── shared/
│   │   │   ├── chat-interface.js
│   │   │   ├── runtime_bridge.js
│   │   │   ├── queue.js
│   │   │   ├── parser.js
│   │   │   ├── semantic_clipboard.js
│   │   │   ├── prompt_compiler.js
│   │   │   ├── api_bridge_listener.js
│   │   │   └── code_canvas_detector.js
│   │   ├── chatgpt/
│   │   │   ├── index.js
│   │   │   └── adapter.js
│   │   └── gemini/
│   │       ├── index.js
│   │       └── adapter.js
│   ├── ui/
│   │   ├── shadow-renderer.js
│   │   ├── state/
│   │   │   ├── ui_store.js
│   │   │   └── selectors.js
│   │   ├── components/
│   │   │   ├── BrandLogo.jsx
│   │   │   ├── WelcomeSurface.jsx
│   │   │   ├── FloatingActionButton.jsx
│   │   │   ├── QuickHub.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── FolderTree.jsx
│   │   │   ├── QueueInspector.jsx
│   │   │   ├── PromptLibrary.jsx
│   │   │   ├── PromptVariableForm.jsx
│   │   │   ├── PromptOptimizer.jsx
│   │   │   ├── SemanticClipboardPanel.jsx
│   │   │   ├── ExportDialog.jsx
│   │   │   ├── TokenOverlay.jsx
│   │   │   ├── CodeCanvas.jsx
│   │   │   ├── SettingsPanel.jsx
│   │   │   ├── FeatureTour.jsx
│   │   │   ├── WindowFrame.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   └── ToastRegion.jsx
│   │   └── styles/
│   │       ├── theme.css
│   │       ├── utilities.css
│   │       └── motion.css
│   ├── popup/
│   │   ├── index.html
│   │   ├── index.js
│   │   └── PopupApp.jsx
│   └── lib/
│       ├── storage.js
│       ├── message_protocol.js
│       ├── state_schema.js
│       ├── utils.js
│       ├── logger.js
│       └── constants.js
├── scripts/
│   ├── verify_extension_playwright.cjs
│   └── package_private_zip.cjs
├── tests/
│   ├── unit/
│   └── e2e/
└── dist/
```

## 2. Module contracts

### `src/background/service_worker.js`

Owns:

- top-level runtime listeners
- storage bootstrapping
- state migrations
- message routing entry point
- cross-tab synchronization
- hidden-tab optimizer lifecycle

Must not own:

- DOM parsing
- blob download creation
- direct UI rendering

### `src/background/state_migrations.js`

Owns:

- schema version migrations
- onboarding and prompt catalog version migrations
- defensive normalization of legacy state

### `src/background/message_router.js`

Owns:

- typed action routing
- permission-safe response wrappers
- normalized `{ ok, data, error }` responses

Required actions:

- `PING`
- `STORAGE_GET`
- `STORAGE_GET_ONE`
- `STORAGE_SET`
- `STORAGE_REMOVE`
- `STORAGE_CLEAR`
- folder CRUD and assignment actions
- prompt CRUD actions
- optimizer hidden-tab actions
- settings and HUD actions
- export/logging support actions if needed

### `src/background/optimizer_hidden_tab.js`

Owns:

- creating hidden/inactive worker tab
- waiting for worker readiness
- sending refine request
- capturing result
- closing worker tab safely
- timeout and cleanup handling

### `src/background/api_interceptor.js`

Owns:

- declarativeNetRequest rule helpers if the current implementation still uses them
- any dynamic rule management required by runtime hardening

### `src/content/shared/chat-interface.js`

This is the core contract every site adapter must implement.

Required methods:

- `getTextarea()`
- `getSubmitButton()`
- `getChatListContainer()`
- `getCurrentChatReference()`
- `isGenerating()`
- `setComposerValue(text)`
- `submitComposer()`
- `clearComposer()`
- `mountAnchor()` or equivalent window-safe anchor method

Required events:

- `onGeneratingStart`
- `onGeneratingEnd`
- `onNewChat`
- `onChatChanged`
- `onComposerReady`

### `src/content/shared/runtime_bridge.js`

Owns:

- bootstrapping for each site entrypoint
- adapter startup
- storage sync subscription
- mounting the shadow renderer
- wiring queue, overlay, and hub state together

### `src/content/shared/queue.js`

Owns:

- queue enqueue/dequeue/peek/clear
- submit interception while generating
- auto-send sequencing when generation ends
- serialized send attempts with guard rails

### `src/content/shared/parser.js`

Owns:

- DOM extraction of normalized conversation turns
- adjacent duplicate turn cleanup
- per-site parser branches kept behind adapter-driven helpers where possible

Output contract:

```ts
[{ role: 'user' | 'assistant' | 'system' | 'tool', content: string }]
```

### `src/content/shared/semantic_clipboard.js`

Owns:

- text chunking
- deterministic local embedding projection
- cosine similarity ranking
- preamble generation for insertion

### `src/content/shared/prompt_compiler.js`

Owns:

- extracting `{{variable}}` names
- deduplicating variable names
- compiling prompt bodies from values
- safe insertion into the active composer

### `src/content/shared/api_bridge_listener.js`

Owns:

- listening for namespaced `window.postMessage` payloads from the main-world bridge
- validating event shape
- transforming to UI-facing overlay state

### `src/content/shared/code_canvas_detector.js`

Owns:

- detecting runnable HTML/CSS/JS bundles
- extracting code blocks
- producing a normalized canvas payload

### `src/content/chatgpt/adapter.js`

Owns:

- ChatGPT-specific selectors and heuristics only
- never exports unrelated feature logic

### `src/content/gemini/adapter.js`

Owns:

- Gemini-specific selectors and heuristics only
- never exports unrelated feature logic

### `src/ui/shadow-renderer.js`

Owns:

- creating the host element
- attaching the ShadowRoot
- injecting bundled styles
- mounting the root Preact app
- teardown/recovery as needed

### `src/ui/state/ui_store.js`

Owns:

- local reactive UI state for the mounted surface
- view/window registry
- derived visibility and z-order state
- hydration from shared stored settings

Must not replace the service worker as the source of truth for persisted state.

### `src/ui/components/BrandLogo.jsx`

Owns:

- rendering the circular logo cleanly
- welcome flow usage
- modal header branding usage
- watermark usage in controlled opacity mode

### `src/ui/components/WelcomeSurface.jsx`

Owns:

- first-run welcome state
- circular-logo-first composition
- `Get Started` primary CTA
- optional quick tour follow-up CTA
- onboarding completion persistence trigger

### `src/ui/components/FloatingActionButton.jsx`

Owns:

- compact always-available launcher
- high-frequency shortcuts
- quick tour CTA visibility rules
- minimal obstruction behavior

### `src/ui/components/QuickHub.jsx`

Owns:

- sectioned access to all major modules
- collapsible groups
- fast module launchers

### `src/ui/components/Sidebar.jsx`

Owns:

- persistent workspace/navigation window
- folder tree access
- queue status
- shortcut actions

### `src/ui/components/FolderTree.jsx`

Owns:

- folder rendering
- rename/create/delete/restore/permanent delete actions
- assign current chat controls

### `src/ui/components/QueueInspector.jsx`

Owns:

- queue list rendering
- remove one
- clear all
- queue size/status feedback

### `src/ui/components/PromptLibrary.jsx`

Owns:

- prompt list/search/tags
- edit/delete/create flow
- open variable form when needed
- insert result into host composer

### `src/ui/components/PromptVariableForm.jsx`

Owns:

- generated fields from extracted variables
- validation for missing values
- preview of compiled prompt

### `src/ui/components/PromptOptimizer.jsx`

Owns:

- source input
- deterministic local optimize action
- AI refine mode toggles
- same-tab and hidden-tab mode selection
- result preview and apply actions

### `src/ui/components/SemanticClipboardPanel.jsx`

Owns:

- ingest text
- show chunk stats
- query locally
- show ranked results
- show generated preamble
- insert preamble into composer

### `src/ui/components/ExportDialog.jsx`

Owns:

- export format choice
- loading status
- success/error reporting
- trigger content-script-side blob generation

### `src/ui/components/TokenOverlay.jsx`

Owns:

- compact and expanded overlay states
- model name display
- token estimate display
- graceful empty/fallback state

### `src/ui/components/CodeCanvas.jsx`

Owns:

- iframe sandbox display
- source extraction feedback
- parse/runtime error feedback
- open/close behavior

### `src/ui/components/SettingsPanel.jsx`

Owns:

- accent hue
- transparency floors
- panel recovery
- reset defaults
- FAB size
- module enable/disable toggles
- onboarding/tour relaunch actions

### `src/ui/components/FeatureTour.jsx`

Owns:

- step-based guided tour
- CTA routing to prompts/settings/hub
- completion persistence

### `src/ui/components/WindowFrame.jsx`

Owns:

- drag
- resize
- collapse
- pin
- close
- z-index management hooks
- accessibility of window controls

### `src/ui/components/EmptyState.jsx`

Required to exist because several surfaces need non-awkward empty states.

Used by:

- no prompts
- no queue
- no semantic chunks
- no exportable conversation
- no token data yet
- no folders yet

### `src/ui/components/LoadingState.jsx`

Used by:

- optimizer in progress
- export in progress
- hidden-tab refine waiting
- onboarding or popup initialization if needed

### `src/ui/components/ErrorState.jsx`

Used by:

- export failure
- optimizer failure
- bridge failure
- parser failure
- adapter not ready state

### `src/popup/PopupApp.jsx`

Popup requirements:

- must show brand/logo
- must expose feature launches and status
- must expose settings and tour relaunch
- must not become the only place a feature exists

### `src/lib/storage.js`

Owns:

- storage helper wrappers
- schema-safe get/set helpers
- normalized default fallback behavior

### `src/lib/message_protocol.js`

Owns:

- central action name definitions
- payload shapes in doc-comment or object-contract form
- response envelope shape

### `src/lib/state_schema.js`

Owns:

- canonical state defaults
- data normalization helpers
- versioned state constants

### `src/lib/utils.js`

Owns:

- sanitize
- truncate
- estimate tokens fallback
- date/id helpers
- file name helpers

### `scripts/verify_extension_playwright.cjs`

Must verify at minimum:

- popup loads
- logo asset appears
- welcome state rules
- quick tour visibility rules
- prompt library open path
- settings open path
- queue visible path
- export buttons visible path
- optimizer UI open path
- no fatal console errors on both sites during mount

## 3. Visibility rule

A feature counts as shipped only if all three are true:

1. the underlying logic exists
2. at least one obvious user-facing entry point exists
3. the feature state is recoverable if its window was closed or moved off-screen

## 4. Styling rule

No visual surface may rely on the host page’s CSS.

All extension surfaces must derive from bundled DexEnhance styles only.
