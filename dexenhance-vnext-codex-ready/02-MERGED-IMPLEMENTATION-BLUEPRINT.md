# DexEnhance VNext — Merged Implementation Blueprint

## 1. Product intent

DexEnhance is a local-first Manifest V3 browser extension for ChatGPT and Google Gemini. It augments both sites with a shared productivity layer that runs entirely client-side, persists through `chrome.storage.local`, avoids all external runtime dependencies, and remains compatible with Brave Shields aggressive mode.

This next version must merge two things without compromising either:

- the **real extension architecture** already chosen in the repo
- the **stronger product/UX system** from the polished control-center concept

The result must feel like one coherent product, not an engineering diagram with a skin pasted on top.

## 2. Non-negotiable constraints

### Runtime constraints

- Manifest V3 only
- Bun + Vite multi-config build
- IIFE output for background and content scripts
- service worker listeners registered synchronously at top level
- Shadow DOM for injected UI isolation
- no external CDN, no remote font, no runtime asset fetches
- all persistent state in `chrome.storage.local` via the service worker
- all DOM interaction through site adapters, never ad hoc selectors inside feature modules
- all download blob generation in the content script context
- all network interception performed in the page main world and relayed back safely

### UX constraints

- logo is the first impression and stays visually prominent
- every feature is visible and reachable
- no hidden-only capability islands
- onboarding must be intentional, branded, and readable
- glassmorphic surfaces must remain legible and non-obstructive
- the HUD must be configurable, movable, collapsible, and recoverable
- empty, loading, success, and error states are mandatory for every feature surface

## 3. Merge strategy

### What to preserve from the real extension architecture

- service worker as the single source of truth
- cross-site state sync via runtime messages
- site-specific `ChatInterface` adapters
- main-world interception bridge for token/model visibility
- content-script-side export execution
- hidden-tab prompt optimization orchestration
- popup + in-page HUD split
- bundled-only asset policy

### What to preserve from the stronger frontend concept

- explicit information architecture
- consistent sectioned navigation
- polished branded welcome state
- stronger component hierarchy
- clearer state model
- formal empty/loading/error states
- better surface organization for prompts, queue, context, export, and settings
- modern visual design with accessible contrast

## 4. Final product model

DexEnhance VNext has **three user-facing surfaces**:

### 4.1 Popup

Purpose:

- launch and inspect the extension quickly
- access onboarding, settings, feature status, and shortcuts
- provide a safe non-injected control surface

### 4.2 In-page FAB and Quick Actions

Purpose:

- give fast access to the most common actions without opening a large panel
- expose quick tour, prompt library, optimizer, export, and quick hub entry points

### 4.3 In-page HUD / Hub windows

Purpose:

- provide the full working interface inside ChatGPT and Gemini
- display folders, prompts, optimizer, semantic clipboard, export, token overlay, settings, tour, and code canvas
- remain movable, resizable, pinnable, collapsible, and recoverable

## 5. Required features and how they must appear

Every listed feature must be both implemented and visible through at least one obvious UI entry point.

### 5.1 Onboarding and feature tour

Required behavior:

- first-run welcome surface must open with the circular logo as the focal element
- CTA stack must be directly associated with the logo
- onboarding completion must persist by version key
- onboarding must not randomly reappear due to stale cross-tab writes
- quick tour must be re-openable later from popup and in-page controls

Visible entry points:

- first-run welcome surface
- popup “Start Quick Tour”
- in-page quick tour button near FAB
- hub/settings relaunch action

### 5.2 Folder organization

Required behavior:

- virtual folder tree with nested folders
- assign chat to folder
- unassign chat
- soft-delete folder/chat to trash
- restore from trash
- permanently delete from trash
- current chat should visibly indicate its assigned folder

Visible entry points:

- sidebar/hub folder panel
- contextual action in current chat controls

### 5.3 Smart queue

Required behavior:

- while the host is generating, user submit attempts are intercepted and queued
- queued prompts send automatically when generation ends
- queue order remains FIFO
- queue is inspectable and clearable
- same-tab and cross-surface state stays in sync

Visible entry points:

- queue counter near sidebar/FAB
- queue inspector in hub
- quick clear action

### 5.4 Prompt library

Required behavior:

- create, read, update, delete templates
- search by title/tag/body
- preview before insertion
- extract `{{variable}}` placeholders
- render variable form dynamically
- compile final prompt and insert into the active site

Visible entry points:

- popup shortcut
- FAB action
- hub prompt panel
- tour CTA may land here

### 5.5 Prompt optimizer

Required behavior:

- deterministic local rewrite path always available
- optional AI refine toggle
- AI refine same-tab path
- AI refine hidden-tab path
- hidden-tab path must create, use, and clean up the worker tab safely
- optimizer settings persist
- optimized result can insert into composer or replace draft

Visible entry points:

- popup action
- FAB action
- hub optimizer panel

### 5.6 Semantic clipboard

Required behavior:

- ingest pasted text locally
- chunk the text deterministically
- derive deterministic embeddings locally
- query by cosine similarity
- show matched chunks and generated preamble
- insert generated context into the current composer
- allow clearing the semantic store

Visible entry points:

- hub semantic clipboard panel
- popup launch shortcut

### 5.7 Conversation export

Required behavior:

- parse both ChatGPT and Gemini threads reliably
- normalize adjacent duplicate turns correctly
- export PDF
- export DOCX
- show progress / success / failure state
- file names must be deterministic and branded

Visible entry points:

- FAB action
- sidebar button
- popup export shortcut

### 5.8 Token and model overlay

Required behavior:

- intercept relevant response metadata through main-world bridge
- relay to content script
- display compact overlay near the composer/input area
- collapsed mode must reduce obstruction
- model name and token count must be readable
- graceful fallback when metadata cannot be extracted

Visible entry points:

- always-available in-page overlay when enabled
- popup toggle and settings surface

### 5.9 Pop-out code canvas

Required behavior:

- detect runnable HTML/CSS/JS bundles in assistant output
- extract code blocks safely
- render in sandboxed iframe/srcdoc canvas
- allow reopen/close
- surface parse errors cleanly

Visible entry points:

- “Open in Canvas” action from detected eligible message
- hub utilities section

### 5.10 HUD customization and recovery

Required behavior:

- move windows
- resize windows
- collapse windows
- pin windows
- adjust transparency
- adjust accent hue
- adjust FAB size
- restore defaults
- recover off-screen panels

Visible entry points:

- settings panel
- popup settings entry
- per-window controls where relevant

## 6. Information architecture

The in-page hub is organized into these primary sections:

1. Overview
2. Workspace
3. Prompts
4. Optimizer
5. Context
6. Export
7. Tokens
8. Settings
9. Tour

### Overview

Shows:

- welcome / brand state
- current site
- queue count
- prompt count
- semantic store status
- export shortcuts
- tokens/model status
- quick links to all major tools

### Workspace

Shows:

- folder tree
- current chat assignment
- trash and restore controls
- queue inspector

### Prompts

Shows:

- prompt library list
- search
- editor
- tags
- variable preview
- insert CTA

### Optimizer

Shows:

- source prompt
- mode selection
- AI refine controls
- result preview
- replace/insert actions

### Context

Shows:

- source text ingestion
- chunk count
- semantic query
- result list
- generated preamble
- insert action

### Export

Shows:

- current conversation detection state
- PDF export button
- DOCX export button
- status feedback

### Tokens

Shows:

- live model name
- input/output/estimated total tokens
- compact/expanded mode toggle
- fallback state explanation

### Settings

Shows:

- panel management
- hue/transparency
- FAB controls
- module toggles
- onboarding/tour relaunch
- reset/recover actions

## 7. Final component hierarchy

```text
RootContentController
├── RuntimeBridge
│   ├── AdapterBootstrap
│   ├── MessageSync
│   ├── ApiBridgeRelay
│   └── WindowRegistry
├── ShadowRenderer
│   └── DexAppShell
│       ├── WelcomeSurface
│       ├── FloatingActionButton
│       ├── QuickHubWindow
│       ├── SidebarWindow
│       ├── PromptLibraryWindow
│       ├── OptimizerWindow
│       ├── SemanticClipboardWindow
│       ├── ExportWindow
│       ├── SettingsWindow
│       ├── FeatureTourWindow
│       ├── TokenOverlay
│       └── CodeCanvasWindow
└── PopupApp
    ├── PopupBrandHeader
    ├── PopupOverview
    ├── PopupShortcuts
    ├── PopupSettings
    └── PopupTourLauncher
```

## 8. Shared state model

```ts
interface DexState {
  version: string;
  onboardingSeenVersion: string | null;
  tourSeenVersion: string | null;

  ui: {
    activeSite: 'chatgpt' | 'gemini';
    welcomeVisible: boolean;
    fabVisible: boolean;
    hubVisible: boolean;
    compactTokens: boolean;
    hudUiSettingsV1: HudUiSettings;
  };

  folders: FolderNode[];
  chats: ChatReference[];
  trash: TrashEntry[];

  queue: {
    isGenerating: boolean;
    pending: QueuedMessage[];
  };

  prompts: {
    catalogVersion: string;
    items: PromptTemplate[];
    optimizerSettings: OptimizerSettings;
  };

  semanticClipboard: {
    chunks: SemanticChunk[];
    lastIngestedAt: number | null;
  };

  overlays: {
    tokenOverlayEnabled: boolean;
    currentModel: string | null;
    estimatedTokens: number | null;
  };

  runtime: {
    lastActiveChat: ChatReference | null;
    lastExportStatus: ExportStatus | null;
    lastError: DexError | null;
  };
}
```

## 9. Core execution rules

### 9.1 Service worker rules

- must own storage reads/writes
- must own migrations
- must own cross-tab broadcasts
- must own hidden-tab optimizer orchestration
- must register listeners synchronously at top level

### 9.2 Content script rules

- one entry per host site
- initialize adapter first
- mount Shadow DOM UI only after adapter readiness
- never do direct feature storage writes; route to service worker
- never parse network responses directly unless through main-world relay path

### 9.3 Adapter rules

- feature modules may ask the adapter for:
  - textarea
  - submit button
  - chat list container
  - current chat identity
  - generating state
- feature modules may not hardcode site selectors on their own

### 9.4 UI rules

- all visible UI must live in Shadow DOM
- all panel positions and visibility live in shared HUD state
- every window must support close and recover
- every data-heavy surface must define empty/loading/error states

## 10. Edge cases that must be handled

### Cross-tab and storage

- stale storage writes reopening onboarding
- one tab changing HUD settings while another is open
- chat assignment changes from one site reflecting on the other

### Queue

- queue submit while input is empty
- host send button disabled for non-generation reasons
- manual stop generation should still resume queue logic correctly
- queue item should not duplicate on double interception

### Prompts

- duplicate variable names
- missing variable values
- empty prompt body
- insert target unavailable

### Optimizer

- hidden-tab creation blocked or missing permission
- same-tab refine cannot submit through normal button path
- optimizer returns no transformed content
- user closes optimizer mid-run

### Semantic clipboard

- large pasted corpus
- query against empty store
- repeated ingest of identical text
- punctuation/noise dominating simple embeddings

### Export

- host DOM changed and parser misses message nodes
- adjacent duplicate messages must be deduped without deleting legitimate repeated turns
- PDF or DOCX generation fails
- file download blocked until user gesture path is satisfied

### Token overlay

- response stream not readable
- metadata absent
- host fetch changes shape
- overlay obstructs modal actions

### Windows and onboarding

- panel off-screen after viewport change
- too many windows open at once
- opacity too low to remain readable
- welcome surface must not trap the user forever
- quick tour CTA must be re-openable even after onboarding is complete

## 11. Accessibility requirements

- keyboard-navigable popup and major in-page controls
- visible focus styles within Shadow DOM
- minimum readable contrast on glass surfaces
- logical heading structure
- aria labels for icon-only controls
- motion-reduced fallback for animated windows
- no reliance on color alone for status

## 12. Implementation order for Codex

### Wave 1 — Protect the architecture

- inspect the existing repo
- confirm the build still uses Bun + 4 Vite configs + MV3 manifest
- confirm packaged logo assets still exist and are referenced correctly
- do not rewrite the runtime stack

### Wave 2 — Formalize shared contracts

- message protocol
- storage schema
- UI state schema
- adapter event schema
- error/result types

### Wave 3 — Normalize cross-site foundations

- verify both adapters
- centralize host capability methods
- centralize generation-state observation
- centralize current chat identity extraction

### Wave 4 — Unify the visual system

- popup and injected windows share design tokens
- logo-first welcome surface
- glassmorphic surfaces with readable opacity floors
- motion, radius, spacing, and hierarchy consistency

### Wave 5 — Enforce feature visibility

- build or refine popup shortcuts
- build or refine FAB menu
- build or refine quick hub / sidebar
- ensure every feature can be reached without hidden debug paths

### Wave 6 — Harden each feature to done state

- folders
- queue
- prompts
- optimizer
- semantic clipboard
- export
- tokens/model overlay
- code canvas
- settings/window management

### Wave 7 — Validation

- build passes
- packaged extension loads unpacked
- Playwright feature checks updated
- manual Brave Shields aggressive UAT checklist executed

## 13. Definition of done

DexEnhance VNext is done only if all of the following are true:

- build succeeds cleanly
- extension loads in Brave with no red error badge
- popup works
- ChatGPT content script works
- Gemini content script works
- all major features are visible and reachable
- all listed features work end-to-end
- logo-first welcome flow is correct
- onboarding persistence is correct
- settings persist across tabs and sites
- export works for both PDF and DOCX
- prompt optimizer works in local, same-tab, and hidden-tab modes
- token/model overlay works or degrades gracefully
- no external resources are fetched at runtime
- Playwright checks pass
- manual Brave Shields aggressive verification passes
