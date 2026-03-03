# DexEnhance — Master Project Bible & State-Sync Manifest

> **STANDING INSTRUCTION FOR ALL AI INSTANCES:**
> This document is an append-only living record. As you complete work, add entries to the relevant sections — NEVER delete or modify existing entries. Future AI instances will read this to inherit full context. Write in the additive log sections using the format: `[DATE] [PHASE] — [what was done]`. If you make an architectural decision that changes or supersedes a prior one, add a new dated entry explaining the change and why — do not erase the original.

---

## CONTEXT INJECTION HEADER
*Paste this block into any fresh LLM session to bypass cold-start and establish full project context.*

```
PROJECT: DexEnhance
TYPE: Brave Browser Extension (Manifest V3)
REPO: /Users/andrew/Projects/DexEnhance/
BIBLE: /Users/andrew/Projects/DexEnhance/BIBLE.md  ← READ THIS FIRST
PLANNING: /Users/andrew/Projects/DexEnhance/.planning/

You are continuing development on DexEnhance — a Manifest V3 browser extension
that enhances ChatGPT (chatgpt.com) and Google Gemini (gemini.google.com) with
cross-site productivity features. All state is in chrome.storage.local via a
service worker. No external servers. Brave Shields must not be triggered.

WORKFLOW SYSTEM: This project uses the GSD (Get Shit Done) agentic workflow.
All planning artifacts are in .planning/. Read BIBLE.md Section 5 ("GSD Workflow
Explained") before taking any action. The current phase and task state are in
.planning/STATE.md and this BIBLE's "Active Sprint State" section.

CRITICAL CONSTRAINTS (never violate):
1. Manifest V3 only — no MV2 APIs
2. IIFE bundle format for background service worker and content scripts
3. Background service worker event listeners registered synchronously at top level
4. No external CDN, no remote fonts, no cross-origin asset fetches
5. All state via chrome.storage.local through service_worker.js (cross-domain)
6. DOM interaction only through ChatInterface adapters — never raw selectors
7. Use bunx --bun vite (NOT bunx vite) — Bun requires --bun flag for Vite

BEFORE WRITING ANY CODE: Read .planning/phases/phase-N/PLAN.md for the active
phase. Each task has exact file contents to create. Follow the plan exactly.
```

---

## 1. SYSTEM ARCHITECTURE & TECH STACK

### 1.1 Hardware

| Machine | Chip | RAM | Role |
|---|---|---|---|
| MacBook Air | Apple M1 | (unknown) | Primary development machine |

*Note: The CLAUDE.md mentions a "Big Mac M4" as a secondary machine. SSH alias `westcat` → `ssh andrew@100.67.12.66` connects to a secondary machine.*

### 1.2 Operating System & Shell

| Item | Value |
|---|---|
| OS | macOS 26.3 (Build 25D125) |
| Architecture | arm64 (Apple Silicon) |
| Shell | zsh |
| Python | 3.14.3 |
| Node.js | v25.7.0 (via Homebrew at `/opt/homebrew/bin/node`) |
| Git | 2.53.0 |
| Homebrew | 5.0.16 |

### 1.3 Package Manager & Build Tools

| Tool | Version | Status | Install Path |
|---|---|---|---|
| **Bun** | TBD | **NOT YET INSTALLED** — must install before Phase 1 | `~/.bun/bin/bun` (expected after install) |
| Vite | ^5.4.0 | Will be installed via Bun in Phase 1 | `node_modules/.bin/vite` |
| Concurrently | ^9.0.0 | Will be installed via Bun in Phase 1 | dev dependency |

> **ACTION REQUIRED BEFORE PHASE 1:** Install Bun.
> Run: `curl -fsSL https://bun.sh/install | bash`
> Then reload your shell or run: `source ~/.zshrc`
> Verify: `bun --version`

### 1.4 Extension Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Extension API | Manifest V3 | MV3 | Chrome/Brave extension standard |
| UI Framework | Preact | ^10.24.0 | Lightweight React-compatible (bundled, no CDN) |
| UI Isolation | Shadow DOM | Native browser | CSS isolation from host pages |
| Build Tool | Vite | ^5.4.0 | Multi-entry MV3 build pipeline |
| State Storage | chrome.storage.local | Native MV3 API | Cross-domain persistent state |
| Language | JavaScript (ESM modules) | ES2022+ | No TypeScript in v1 |

### 1.5 Target Sites

| Site | URL Pattern | Content Script |
|---|---|---|
| ChatGPT | `https://chatgpt.com/*` | `src/content/chatgpt/index.js` |
| Google Gemini | `https://gemini.google.com/*` | `src/content/gemini/index.js` |

### 1.6 Build Architecture — IIFE Multi-Config Pattern

**Why 4 separate Vite configs:** Rollup (Vite's bundler) cannot produce IIFE format with multiple entry points. Each IIFE bundle requires its own `vite build --config` invocation.

| Config File | Entry | Output | Format |
|---|---|---|---|
| `vite.config.background.js` | `src/background/service_worker.js` | `dist/background/service_worker.js` | IIFE |
| `vite.config.chatgpt.js` | `src/content/chatgpt/index.js` | `dist/content/chatgpt/index.js` | IIFE |
| `vite.config.gemini.js` | `src/content/gemini/index.js` | `dist/content/gemini/index.js` | IIFE |
| `vite.config.popup.js` | `src/popup/index.html` | `dist/popup/` | Standard HTML bundle |

**Build command:** `bun run build` chains all four sequentially then copies `public/` to `dist/`.

**Watch mode:** `bun run watch` runs all four concurrently via `concurrently`.

**Anti-pattern to avoid:** Do NOT use `@crxjs/vite-plugin` — confirmed Chrome 130+ CSP bug as of 2025.

---

## 2. DIRECTORY STRUCTURE

```
/Users/andrew/Projects/DexEnhance/
├── BIBLE.md                          ← YOU ARE HERE
├── .planning/                        ← GSD planning artifacts (all read-only during execution)
│   ├── PROJECT.md                    ← Project context, constraints, key decisions
│   ├── REQUIREMENTS.md               ← 24 checkable v1 requirements (INFRA/CORE/ADAPT/UI/FEAT/API)
│   ├── ROADMAP.md                    ← 10-phase breakdown with UAT criteria
│   ├── STATE.md                      ← Current phase position and context
│   ├── config.json                   ← GSD workflow config (interactive mode, balanced profile)
│   └── phases/
│       └── phase-1/
│           ├── CONTEXT.md            ← Phase 1 context and goal (what "done" looks like)
│           ├── RESEARCH.md           ← Phase 1 technical research (774 lines, verified patterns)
│           └── PLAN.md               ← EXECUTABLE phase plan (1,184 lines, 7 tasks, VERIFIED ✓)
├── .claude/
│   └── launch.json                   ← Dev server configurations (bun run watch configs)
│
│ ─────────── BELOW: Created by Phase 1 execution ───────────
│
├── package.json                      ← (Phase 1) Bun project manifest
├── bun.lockb                         ← (Phase 1) Lockfile
├── .gitignore                        ← (Phase 1)
├── vite.config.background.js         ← (Phase 1) Background IIFE build config
├── vite.config.chatgpt.js            ← (Phase 1) ChatGPT content script IIFE config
├── vite.config.gemini.js             ← (Phase 1) Gemini content script IIFE config
├── vite.config.popup.js              ← (Phase 1) Popup HTML build config
├── public/
│   ├── manifest.json                 ← (Phase 1) MV3 manifest (copied to dist/ by build)
│   └── icons/
│       ├── icon16.png                ← (Phase 1) Placeholder icon (indigo, valid PNG)
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── background/
│   │   ├── service_worker.js         ← (Phase 1 stub → Phase 2 full impl) Central state manager
│   │   └── api_interceptor.js        ← (Phase 9) declarativeNetRequest rules
│   ├── content/
│   │   ├── shared/
│   │   │   ├── chat-interface.js     ← (Phase 3) ChatInterface abstract contract
│   │   │   ├── queue.js              ← (Phase 6) FIFO smart message queue
│   │   │   ├── parser.js             ← (Phase 8) Conversation DOM extractor
│   │   │   └── api-bridge.js         ← (Phase 9) fetch/XHR main-world interceptor
│   │   ├── chatgpt/
│   │   │   ├── index.js              ← (Phase 1 stub) ChatGPT content script entry
│   │   │   └── adapter.js            ← (Phase 3) ChatInterface impl for ChatGPT DOM
│   │   └── gemini/
│   │       ├── index.js              ← (Phase 1 stub) Gemini content script entry
│   │       └── adapter.js            ← (Phase 3) ChatInterface impl for Gemini DOM
│   ├── ui/
│   │   ├── components/               ← (Phase 4+) Preact components (Sidebar, FAB, etc.)
│   │   └── styles/                   ← (Phase 4+) CSS variables, theme system
│   ├── lib/
│   │   ├── storage.js                ← (Phase 1) chrome.storage.local wrapper
│   │   └── utils.js                  ← (Phase 1) sanitize, truncate, estimateTokens
│   └── popup/
│       ├── index.html                ← (Phase 1 stub → Phase 4 full UI)
│       └── index.js                  ← (Phase 1 stub)
└── dist/                             ← (Phase 1+) Built output — Load Unpacked this in Brave
    ├── manifest.json
    ├── icons/
    ├── background/service_worker.js
    ├── content/
    │   ├── chatgpt/index.js
    │   └── gemini/index.js
    └── popup/
```

---

## 3. ACTIVE SPRINT STATE

### Current Position

| Field | Value |
|---|---|
| **Milestone** | 1 — Full-Featured Extension v1 |
| **Phase** | 1 — Foundation & Build Pipeline |
| **Phase Status** | PLANNED & VERIFIED — Ready to Execute |
| **Plan File** | `.planning/phases/phase-1/PLAN.md` |
| **Last Session Terminated At** | Phase 1 planning complete. No code written yet. |
| **Blocking Issue** | Bun not installed. Install before running `bun run build`. |

### What Was Done Last Session

1. GSD new-project initialization: created `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`
2. Phase 1 planning: ran researcher → planner → checker agents
3. Phase 1 PLAN.md written (1,184 lines) and checker-verified (PASS, all 8 dimensions)
4. `.claude/launch.json` pre-configured with `bun run watch` commands

### What Needs to Happen Next

**Step 1:** Install Bun if not present: `curl -fsSL https://bun.sh/install | bash`

**Step 2:** Execute Phase 1: Run `/gsd:execute-phase 1` in Claude Code, OR follow the tasks in `.planning/phases/phase-1/PLAN.md` manually.

**Step 3:** Human checkpoint (Task 7 in PLAN.md) — load `dist/` in Brave, verify console logs on both sites.

### Checkpoint: Where Code Last Left Off

No code exists yet. The project directory contains only:
- `.planning/` (GSD planning artifacts)
- `.claude/launch.json` (dev server configs, non-functional until Phase 1 executes)

---

## 4. COMPLETE REQUIREMENTS REGISTER

*24 checkable v1 requirements. Updated here as phases complete.*

### INFRA — Infrastructure & Build
| ID | Requirement | Phase | Status |
|---|---|---|---|
| INFRA-01 | Vite build pipeline (4 configs, sequential) outputting MV3-compliant IIFE scripts | 1 | ○ Pending |
| INFRA-02 | `manifest.json` (MV3) with host_permissions, content_scripts, service_worker, icons | 1 | ○ Pending |
| INFRA-03 | `lib/storage.js` wrapper over `chrome.storage.local` | 1 | ○ Pending |
| INFRA-04 | `lib/utils.js`: sanitize, truncate, estimateTokens | 1 | ○ Pending |
| INFRA-05 | Zero external CDN resources — all bundled | 1 | ○ Pending |

### CORE — Service Worker & Messaging
| ID | Requirement | Phase | Status |
|---|---|---|---|
| CORE-01 | `service_worker.js` as single source of truth for cross-site state | 2 | ○ Pending |
| CORE-02 | Typed message protocol (action-discriminated) for content→background | 2 | ○ Pending |
| CORE-03 | Background handles all chrome.storage.local ops on behalf of content scripts | 2 | ○ Pending |
| CORE-04 | `api_interceptor.js` with `declarativeNetRequest` rule management | 2 | ○ Pending |

### ADAPT — DOM Adapter Layer
| ID | Requirement | Phase | Status |
|---|---|---|---|
| ADAPT-01 | `ChatInterface` abstract contract (getTextarea, getSubmitButton, getChatListContainer, isGenerating) | 3 | ○ Pending |
| ADAPT-02 | `content/gemini/adapter.js` implementing ChatInterface | 3 | ○ Pending |
| ADAPT-03 | `content/chatgpt/adapter.js` implementing ChatInterface | 3 | ○ Pending |
| ADAPT-04 | MutationObserver watching submit button `disabled` → generating state events | 3 | ○ Pending |
| ADAPT-05 | MutationObserver watching chat list container → `onNewChat` events | 3 | ○ Pending |

### UI — Shadow DOM Framework
| ID | Requirement | Phase | Status |
|---|---|---|---|
| UI-01 | `ui/shadow-renderer.js` factory (host div → #shadow-root → scoped CSS) | 4 | ○ Pending |
| UI-02 | Preact rendering within Shadow DOM boundary | 4 | ○ Pending |
| UI-03 | CSS variable system (`--dex-*`) with site light/dark detection | 4 | ○ Pending |
| UI-04 | `Sidebar.jsx` collapsible panel component | 4 | ○ Pending |
| UI-05 | `FAB.jsx` floating action button with expandable menu | 4 | ○ Pending |

### FEAT — Features
| ID | Requirement | Phase | Status |
|---|---|---|---|
| FEAT-01 | Folder data model `{id, name, parentId, chatUrls[]}` via service worker | 5 | ○ Pending |
| FEAT-02 | Virtual folder tree view in Shadow DOM sidebar | 5 | ○ Pending |
| FEAT-03 | Chat URL → folder ID mapping, persists across sessions | 5 | ○ Pending |
| FEAT-04 | Trash/soft-delete with restore | 5 | ○ Pending |
| FEAT-05 | `content/shared/queue.js` FIFO queue (enqueue/dequeue/peek/isEmpty/size) | 6 | ○ Pending |
| FEAT-06 | Event interception (Enter/click → enqueue if isGenerating) | 6 | ○ Pending |
| FEAT-07 | MutationObserver dequeue trigger (button re-enables → send next) | 6 | ○ Pending |
| FEAT-08 | Prompt Library data model `{id, title, body, tags, variables[]}` | 7 | ○ Pending |
| FEAT-09 | Prompt Library UI (browse/search/insert with `{{variable}}` substitution) | 7 | ○ Pending |
| FEAT-10 | Conversation DOM parser → `[{role, content}]` for both sites | 8 | ○ Pending |
| FEAT-11 | PDF export via jspdf (content script blob) | 8 | ○ Pending |
| FEAT-12 | DOCX export via docx.js (content script blob) | 8 | ○ Pending |
| FEAT-13 | Export trigger UI (FAB menu + sidebar button) | 8 | ○ Pending |

### API — Interception
| ID | Requirement | Phase | Status |
|---|---|---|---|
| API-01 | Inline `<script>` injection into main world to monkey-patch `window.fetch` and `XMLHttpRequest` | 9 | ○ Pending |
| API-02 | Intercepted data relayed to content script via namespaced `window.postMessage` | 9 | ○ Pending |
| API-03 | Token usage overlay (`TokenOverlay.jsx`) near input area | 9 | ○ Pending |

---

## 5. GSD WORKFLOW EXPLAINED
*For AI instances that do not have GSD context: what it is, how it works, and where to find everything.*

### 5.1 What GSD Is

GSD ("Get Shit Done") is an agentic planning and execution framework that lives at `/Users/andrew/.claude/get-shit-done/`. It uses Claude Code as the orchestrator and spawns specialized sub-agents for research, planning, verification, and execution. It is NOT a general-purpose CLI tool — it is a set of Claude Code slash commands and workflow files.

### 5.2 GSD Slash Commands Relevant to DexEnhance

| Command | What It Does |
|---|---|
| `/gsd:new-project` | Initialize project — creates `.planning/` directory with all artifacts *(already done)* |
| `/gsd:plan-phase N` | Research + plan a specific phase → produces `PLAN.md` in `.planning/phases/phase-N/` |
| `/gsd:execute-phase N` | Execute all tasks in a phase's PLAN.md files with atomic commits and checkpointing |
| `/gsd:verify-work` | Conversational UAT verification against a phase's success criteria |
| `/gsd:progress` | Show current project state and route to the next action |
| `/gsd:debug` | Systematic debugging with persistent state |

### 5.3 GSD Planning Artifacts — Where to Find Everything

| File | Location | Contents |
|---|---|---|
| Project context | `.planning/PROJECT.md` | What, why, constraints, key decisions |
| Requirements | `.planning/REQUIREMENTS.md` | All checkable v1 requirements |
| Roadmap | `.planning/ROADMAP.md` | All 10 phases with goals and UAT criteria |
| Project state | `.planning/STATE.md` | Current phase position, what's next |
| GSD config | `.planning/config.json` | Workflow mode (interactive), model profile (balanced) |
| Phase N context | `.planning/phases/phase-N/CONTEXT.md` | Goal, constraints, "done" definition for phase N |
| Phase N research | `.planning/phases/phase-N/RESEARCH.md` | Technical research findings for phase N |
| **Phase N plan** | `.planning/phases/phase-N/PLAN.md` | **EXECUTABLE plan with exact file contents** |
| Phase N summary | `.planning/phases/phase-N/phase-N-01-SUMMARY.md` | Written AFTER execution completes |

### 5.4 The Execution Flow for Each Phase

```
1. /gsd:plan-phase N
   ├─ Spawns gsd-phase-researcher  →  writes RESEARCH.md
   ├─ Spawns gsd-planner           →  writes PLAN.md
   └─ Spawns gsd-plan-checker      →  verifies PLAN.md (pass/fail)

2. /gsd:execute-phase N
   ├─ Reads PLAN.md
   ├─ Executes tasks in wave order (Wave 1, then Wave 2, etc.)
   ├─ Pauses at checkpoint:human-verify tasks for manual UAT
   └─ Writes SUMMARY.md on completion

3. /gsd:verify-work
   └─ Conversational verification against UAT criteria
```

### 5.5 Critical Rules for Executing Phases

- **Read the PLAN.md FIRST** before writing any code. It has exact file contents.
- **Follow task wave order** — each wave's tasks may depend on previous waves.
- **Do not modify RESEARCH.md or CONTEXT.md** during execution.
- **checkpoint:human-verify** tasks require a human to test in Brave before proceeding.
- After execution, update **STATE.md** with new phase position.
- After execution, add an entry to this BIBLE's "Completion Log" section.

### 5.6 GSD Workflow Files (for reference — do not modify)

| File | Location |
|---|---|
| New project workflow | `/Users/andrew/.claude/get-shit-done/workflows/new-project.md` |
| Plan phase workflow | `/Users/andrew/.claude/get-shit-done/workflows/plan-phase.md` |
| UI/brand standards | `/Users/andrew/.claude/get-shit-done/references/ui-brand.md` |
| Questioning guide | `/Users/andrew/.claude/get-shit-done/references/questioning.md` |

---

## 6. THE 10-PHASE ROADMAP (FULL DETAIL)

*Each phase is explained in detail so external AI instances understand what was built, what it depends on, and what comes next.*

### Phase 1: Foundation & Build Pipeline
**Status:** PLANNED ✓ — Ready to Execute
**Goal:** Working MV3 extension skeleton that loads in Brave with no errors.
**Key outputs:** `package.json`, 4 Vite configs, `manifest.json`, `lib/storage.js`, `lib/utils.js`, all source stubs
**Requirements:** INFRA-01 through INFRA-05
**Plan:** `.planning/phases/phase-1/PLAN.md` (1,184 lines, 7 tasks, checker-verified)
**Why it exists:** Every subsequent phase depends on the build pipeline. No feature code can be written until the IIFE build is proven to work.
**Critical decisions locked in:**
- 4 separate Vite configs (Rollup IIFE + multiple entries = fatal error)
- `bunx --bun vite` (Bun's shebang workaround)
- `publicDir: false` on all configs + explicit `copy:public` script
- No `@crxjs/vite-plugin` (Chrome 130+ CSP bug)
- `fileName: () => 'service_worker.js'` (prevents content-hash in filename)

### Phase 2: Service Worker & Cross-Site Messaging
**Status:** Pending (requires Phase 1 complete)
**Goal:** Reliable cross-domain state sharing via typed message protocol.
**Key outputs:** Full `service_worker.js` with message router, `api_interceptor.js` with declarativeNetRequest stubs
**Requirements:** CORE-01 through CORE-04
**What it enables:** All feature code (Phases 5-9) needs cross-domain state storage. Phase 2 provides the messaging infrastructure.
**Key architecture:** Content scripts send `{action: 'STORAGE_GET', key: '...'}` messages. Background routes by `action` and responds via `sendResponse`. No direct chrome.storage calls from content scripts after Phase 2.

### Phase 3: DOM Adapter Layer
**Status:** Pending (requires Phase 2)
**Goal:** Stable DOM interaction abstracted from brittle per-site selectors.
**Key outputs:** `ChatInterface` contract, `chatgpt/adapter.js`, `gemini/adapter.js`, MutationObserver system
**Requirements:** ADAPT-01 through ADAPT-05
**Why it exists:** Both ChatGPT and Gemini update their DOM frequently. All feature code must go through the adapter, never directly to DOM selectors. When a site updates their UI, only the adapter.js needs to change.
**Key events emitted:** `onGeneratingStart`, `onGeneratingEnd` (from submit button MutationObserver), `onNewChat` (from chat list observer)

### Phase 4: Shadow DOM UI Framework
**Status:** Pending (requires Phase 3)
**Goal:** Injected UI that is visually isolated from host page CSS.
**Key outputs:** `ui/shadow-renderer.js`, Preact setup in content script, `ui/styles/theme.css` with `--dex-*` vars, `Sidebar.jsx`, `FAB.jsx`
**Requirements:** UI-01 through UI-05
**Why Shadow DOM:** ChatGPT and Gemini have aggressive global CSS. Without Shadow DOM isolation, the injected sidebar and buttons would inherit broken styles.
**Theme detection:** Reads host page `prefers-color-scheme` and body class attributes to mirror light/dark mode.

### Phase 5: Folder & Chat Organization
**Status:** Pending (requires Phase 4)
**Goal:** Virtual folder tree for organizing chats across both sites.
**Key outputs:** Folder CRUD (service worker), `FolderTree.jsx`, sidebar replaces native chat list, chat URL→folder mapping, trash/restore
**Requirements:** FEAT-01 through FEAT-04
**Storage schema:** `{folders: [{id, name, parentId, chatUrls[], deletedAt}]}`
**Key UX:** Native sidebar list is hidden; DexEnhance's virtual tree replaces it. Folders persist across sessions.

### Phase 6: Smart Message Queue
**Status:** Pending (requires Phase 3 adapter MutationObserver)
**Goal:** Queue multiple messages while AI is generating; they auto-send in order.
**Key outputs:** `content/shared/queue.js` FIFO, event interception on textarea, MutationObserver dequeue trigger
**Requirements:** FEAT-05 through FEAT-07
**Mechanism:** On submit while generating → `preventDefault()` → push to queue. When submit button re-enables → dequeue → set textarea value → dispatch synthetic click.

### Phase 7: Prompt Library
**Status:** Pending (requires Phase 4 Shadow DOM framework)
**Goal:** Cross-site saved prompts with variable substitution.
**Key outputs:** Prompt CRUD (service worker), `PromptLibrary.jsx`, `{{variable}}` fill dialog, click-to-insert
**Requirements:** FEAT-08 through FEAT-09
**Cross-site:** Prompts stored in service worker (chrome.storage.local). Creating a prompt on ChatGPT makes it immediately available on Gemini and vice versa.

### Phase 8: Universal Export
**Status:** Pending (requires Phase 4 Shadow DOM framework)
**Goal:** Export any conversation to PDF or DOCX with one click.
**Key outputs:** `content/shared/parser.js`, `jspdf` integration, `docx.js` integration, `ExportDialog.jsx`
**Requirements:** FEAT-10 through FEAT-13
**Critical constraint:** Blob generation via `URL.createObjectURL` must happen in the content script context (not background service worker) — browser download prompt will not appear otherwise.

### Phase 9: API Interception & Token Display
**Status:** Pending (requires Phase 4 Shadow DOM framework)
**Goal:** Show token usage and model info from intercepted API calls.
**Key outputs:** `api-bridge.js` main-world injection, `window.postMessage` bridge, `TokenOverlay.jsx`
**Requirements:** API-01 through API-03
**MV3 limitation:** Content scripts cannot intercept response bodies. Solution: inject an inline `<script>` into `document.head` via `scripting.executeScript` with `world: "MAIN"`. This script monkey-patches `window.fetch` and `XMLHttpRequest`, then sends metadata to the content script via `window.postMessage` with a DexEnhance-namespaced type.

### Phase 10: Brave Hardening & Private Distribution
**Status:** Pending (requires all prior phases)
**Goal:** Production-ready for private sharing; all features pass with Brave Shields aggressive.
**Key outputs:** Bundle audit, `.zip` package, `README.md` install guide
**Brave Shields check:** Load the extension on a fresh Brave profile with Shields set to "Aggressive". All features must work. Zero external network requests.
**Distribution:** `.zip` file for Load Unpacked via `brave://extensions`. No Chrome Web Store.

---

## 7. CRITICAL ARCHITECTURAL DECISIONS REGISTER

*These decisions are LOCKED. Do not reverse them without adding a dated override entry below.*

| Decision | Choice | Reason | Phase Decided |
|---|---|---|---|
| Extension API | Manifest V3 only | Required for Brave; future-proof | Project init |
| Build tool | Vite 5.x | Fast ARM64; handles MV3 multi-entry | Project init |
| Package manager | Bun | Fastest on Apple Silicon | Project init |
| UI framework | Preact + Shadow DOM | ~3KB; CSS isolation from host pages | Project init |
| State store | `chrome.storage.local` via service worker | Cross-domain; persistent; Brave Shields safe | Project init |
| API interception | Main-world injection → postMessage | Only MV3-safe method for response body interception | Project init |
| DOM abstraction | Adapter pattern (ChatInterface) | Isolates feature code from brittle per-site selectors | Project init |
| Blob generation | Content script context | Background worker can't trigger download prompt | Project init |
| IIFE output | 4 separate Vite configs | Rollup cannot code-split in IIFE format | Phase 1 research |
| No @crxjs | Manual Rollup config | Chrome 130+ CSP bug confirmed; manual is transparent | Phase 1 research |
| `bunx --bun vite` | Always use `--bun` flag | Bun respects Node shebang without it | Phase 1 research |
| No `"type": "module"` in background | Absent from manifest | Chrome prohibits dynamic imports in module-type service workers | Phase 1 research |
| Fixed filenames | `fileName: () => '...'` | Content hashes break manifest.json references | Phase 1 research |
| publicDir copy | Explicit `copy:public` script runs last | Prevents `emptyOutDir` race condition across sequential builds | Phase 1 research |
| Service worker listeners | Always synchronous at top level | Chrome fires events on worker startup; async registration = missed events | Phase 1 research |

---

## 8. ANTI-PATTERNS NEVER DO LIST

*Common mistakes that will break the extension. Add to this list as new ones are discovered.*

1. **Never use ESM output (`format: 'esm'` or default) for background or content scripts.** Browser silently fails or throws "invalid JS". Use IIFE.
2. **Never add `"type": "module"` to manifest.json background declaration.** Disables dynamic imports → breaks Vite builds.
3. **Never put multiple entries in one Vite config with IIFE format.** Rollup throws: "IIFE and UMD are not supported for code-splitting builds."
4. **Never use `vite` dev server (`bunx --bun vite`) for extension work.** Dev server serves HTTP+ESM which extensions cannot consume. Use `--watch` instead.
5. **Never use `localStorage` in the service worker.** Does not exist in service worker context. Use `chrome.storage.local`.
6. **Never register `chrome.*` event listeners inside a Promise or async callback.** Service worker may restart; async-registered listeners are missed.
7. **Never allow Vite to append content hashes to filenames.** `manifest.json` references hardcoded filenames — hashed names break extension loading.
8. **Never import raw DOM selectors in feature modules.** All DOM access goes through `ChatInterface` adapter methods.
9. **Never load external resources at runtime** (CDN scripts, Google Fonts, remote images). Brave Shields blocks them.
10. **Never use `eval()`, `new Function()`, or dynamic code execution.** MV3 enforces `script-src 'self'` — no `'unsafe-eval'`.
11. **Never use `@crxjs/vite-plugin`.** Confirmed Chrome 130+ CSP bug. Use manual IIFE config.
12. **Never generate blobs for download in the background service worker.** `URL.createObjectURL` must run in content script context for the download prompt to appear.

---

## 9. OPERATIONAL DEPENDENCIES & RELATED PROJECTS

### 9.1 Dex Family Projects (Andrew's Ecosystem)

| Project | Location | Relevance to DexEnhance |
|---|---|---|
| DexGen | `~/Projects/DexGen/` | Andrew's AI content generation tool — potential future integration |
| DexCraft | `~/Projects/DexCraft/` | Unknown — check separately |
| DexHub | `~/Projects/DexHub/` | Portal/client/server architecture — potential future sync target |
| DexDictate | `~/Projects/DexDictate_MacOS/` | macOS menu-bar dictation app (Swift) — separate project, no dependency |
| DexStitch | `~/Projects/DexStitch/` | Unknown — check separately |
| DexEarth | `~/Projects/DexEarth/` | Unknown — check separately |

*DexEnhance has NO runtime dependencies on any other Dex project for v1. All data is local.*

### 9.2 Development Environment

| Tool | Location | Purpose |
|---|---|---|
| Claude Code | CLI | Primary AI development tool / GSD orchestrator |
| Brave Browser | `/Applications/Brave Browser.app` | Testing target — use `brave://extensions` for Load Unpacked |
| Obsidian Vault | `~/Projects/Obsidian_Vault/` | Notes — accessible via `/obsidian` Claude skill |

### 9.3 Claude Code Configuration

| File | Location | Contents |
|---|---|---|
| Project memory | `.claude/projects/-Users-andrew-Projects-DexEnhance/memory/MEMORY.md` | Persistent AI memory for DexEnhance sessions |
| GSD workflow | `~/.claude/get-shit-done/` | All GSD workflow files, skills, and templates |
| Launch config | `.claude/launch.json` | Dev server configurations (bun run watch commands) |

---

## 10. KEY CODE PATTERNS (Reference)

### 10.1 Cross-Site Message Passing (Phase 2+)

```javascript
// From content script — send message to background
const response = await chrome.runtime.sendMessage({
  action: 'STORAGE_GET',
  key: 'folders'
});

// In service_worker.js — route by action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // async response
});
```

### 10.2 Storage Access (Phase 1+)

```javascript
// CORRECT — via lib/storage.js wrapper
import { storageGetOne, storageSet } from '../../lib/storage.js';
const folders = await storageGetOne('folders');
await storageSet({ folders: updatedFolders });

// WRONG — never call chrome.storage directly from feature code
// (always route through service worker in Phase 2+)
```

### 10.3 Adapter Pattern (Phase 3+)

```javascript
// CORRECT — use adapter
const adapter = new ChatGPTAdapter();
const textarea = adapter.getTextarea();

// WRONG — raw selectors in feature code
const textarea = document.querySelector('#prompt-textarea');
```

### 10.4 Shadow DOM Mounting (Phase 4+)

```javascript
// CORRECT — all UI in shadow root
const { shadowRoot } = createShadowHost('#dex-sidebar');
render(h(Sidebar, { adapter }), shadowRoot);

// WRONG — inject directly into page DOM (host CSS bleeds in)
document.body.appendChild(sidebarElement);
```

### 10.5 API Bridge (Phase 9+)

```javascript
// In content script — listen for intercepted data
window.addEventListener('message', (event) => {
  if (event.data?.type !== 'DEXENHANCE_API_INTERCEPT') return;
  const { tokensUsed, model } = event.data.payload;
  // update token overlay
});

// In main-world injected script — intercept and relay
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  // extract token data from response clone
  window.postMessage({ type: 'DEXENHANCE_API_INTERCEPT', payload: {...} }, '*');
  return response;
};
```

---

## 11. HANDOFF PROTOCOL

### For Fresh Claude Code Sessions
1. Start any session with: *"Read BIBLE.md and continue DexEnhance development"*
2. Claude Code will read this file and have full context
3. The standing instruction in the header will remind it to add to the Bible additively

### For External AI Instances (Gemini CLI, VS Code Copilot, etc.)
1. Paste the entire **CONTEXT INJECTION HEADER** block (Section 0) into the system prompt
2. Additionally paste the relevant **Phase N Plan** from `.planning/phases/phase-N/PLAN.md`
3. The external AI should follow the plan's task list exactly — each task has full file contents

### For Manual Continuation
1. Check **Section 3 (Active Sprint State)** for exact checkpoint
2. Check the **Completion Log** (Section 13) for what has been done
3. Run `ls .planning/phases/` to see which phases have PLAN.md files
4. Run `ls dist/` to see what's been built

---

## 12. VALIDATION MANIFEST

*How to verify the project is in a healthy state at any point.*

### Phase 1 Health Check (after Phase 1 executes)
```bash
cd /Users/andrew/Projects/DexEnhance
bun run build                                              # Must exit 0
ls dist/background/service_worker.js                       # Must exist
ls dist/content/chatgpt/index.js                          # Must exist
ls dist/content/gemini/index.js                           # Must exist
ls dist/manifest.json dist/icons/icon16.png               # Must exist
head -1 dist/background/service_worker.js | grep -v import # Must be IIFE
node -e "const m=require('./dist/manifest.json'); console.assert(m.manifest_version===3)"
```

### Extension Health Check (requires Brave)
1. Go to `brave://extensions`
2. Load unpacked → `dist/` → no red error badge
3. Visit `chatgpt.com` → DevTools console → `[DexEnhance] ChatGPT content script loaded`
4. Visit `gemini.google.com` → DevTools console → `[DexEnhance] Gemini content script loaded`
5. Run in console: `await chrome.storage.local.set({t:1}); await chrome.storage.local.get('t')` → `{t: 1}`

---

## 13. COMPLETION LOG
*Append-only. One entry per completed task/phase. Never edit existing entries.*

```
[2026-03-03] INIT — GSD new-project initialized. Created .planning/ with
  PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json.
  Confirmed: all 4 v1 feature areas in scope; private distribution only.

[2026-03-03] PHASE 1 PLAN — Phase 1 planned and verified.
  Researcher ran (774-line RESEARCH.md, HIGH confidence).
  Planner produced PLAN.md (1,184 lines, 7 tasks).
  Checker verified: PASS (all 8 dimensions, zero blockers).
  Key finding: Bun NOT installed on system — must install before Phase 1 execution.
  Key finding: `bunx --bun vite` required (Bun Node shebang workaround).
  Key finding: Do NOT use @crxjs/vite-plugin (Chrome 130+ CSP bug).

[2026-03-03] BIBLE — This Master Project Bible created.
  Location: /Users/andrew/Projects/DexEnhance/BIBLE.md
  Purpose: Context injection for any AI continuing this project.
```

---

## 14. CHANGE LOG
*Append-only. Document architectural changes, constraint updates, or scope changes.*

```
[2026-03-03] v0.1 — Initial project Bible created. No code exists yet.
  All 10 phases planned at roadmap level. Phase 1 fully planned (PLAN.md verified).
```

---

*Document version: 0.1 | Created: 2026-03-03 | Next update: After Phase 1 execution completes*
*This is a living document. All AI instances working on this project MUST update the Completion Log (Section 13) and Change Log (Section 14) as work progresses.*
