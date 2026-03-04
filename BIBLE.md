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
| **Phase** | 10 — Brave Hardening & Private Distribution |
| **Phase Status** | Implemented — Deep regression + UI sweep complete |
| **Plan File** | Phase 10 execution artifacts under `.planning/phases/phase-10/` |
| **Last Session Terminated At** | Phase 10-07 hybrid prompt optimizer implementation complete. |
| **Blocking Issue** | None (manual authenticated UAT remains optional follow-up). |

### What Was Done Last Session

1. Implemented hybrid prompt optimizer with deterministic local rewrite as default path.
2. Added optional AI refinement toggle with same-tab default and hidden-tab advanced mode.
3. Added service-worker orchestration for hidden-tab AI refinement with safe tab cleanup.
4. Added optimizer modal UI and integrated actions in Sidebar/FAB across ChatGPT and Gemini.
5. Wrote Phase 10-07 implementation + verification artifacts under `.planning/phases/phase-10/`.

### What Needs to Happen Next

**Step 1:** Optional authenticated UAT on ChatGPT and Gemini with real accounts.

**Step 2:** Optional token-overlay fidelity sign-off against real model responses.

**Step 3:** Optional export dependency footprint optimization (bundle-size follow-up).

### Checkpoint: Where Code Last Left Off

Phase 10 implementation is complete with stabilization artifacts and private package output.
For current execution truth, use:
- `.planning/STATE.md`
- `.planning/phases/phase-10/phase-10-07-HYBRID-PROMPT-OPTIMIZER.md`
- `.planning/phases/phase-10/phase-10-07-playwright-verification.json`

### State Update (2026-03-03, additive)

- Phase 1 execution completed after this snapshot was written.
- Bun installed (`1.3.10`) and `bun run build` now succeeds.
- Phase 1 output summary written to:
  - `.planning/phases/phase-1/phase-1-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #2)

- Phase 2 implementation completed after this snapshot was written.
- Added typed runtime protocol and centralized storage routing through service worker.
- Added dynamic declarativeNetRequest rule manager scaffolding with live API calls.
- Phase 2 output summary written to:
  - `.planning/phases/phase-2/phase-2-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #3)

- Phase 3 implementation completed after this snapshot was written.
- Implemented both site adapters (`chatgpt`, `gemini`) for textarea/submit/chat-list/generating detection.
- Added shared observer/event lifecycle in `ChatInterface` for generating-state and chat-list mutation events.
- Wired adapters into content script entry points with readiness and event logging.
- Phase 3 output summary written to:
  - `.planning/phases/phase-3/phase-3-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #4)

- Phase 4 implementation completed after this snapshot was written.
- Added Shadow DOM renderer and scoped theme system for injected UI.
- Added Preact `Sidebar` and `FAB` component shells and mounted them on both target sites.
- Phase 4 output summary written to:
  - `.planning/phases/phase-4/phase-4-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #5)

- Phase 5 implementation completed after this snapshot was written.
- Added service-worker folder/chat organization state and CRUD message actions.
- Sidebar now renders a virtual folder tree with assign/trash/restore/permanent-delete flows.
- Phase 5 output summary written to:
  - `.planning/phases/phase-5/phase-5-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #6)

- Phase 6 implementation completed after this snapshot was written.
- Added shared queue interception controller and wired it into both content scripts.
- Queue now intercepts submit actions while generating and auto-sends on generating end.
- Sidebar now displays live queued-message count.
- Phase 6 output summary written to:
  - `.planning/phases/phase-6/phase-6-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #7)

- Phase 7 implementation completed after this snapshot was written.
- Added prompt CRUD protocol + storage model in service worker.
- Added Prompt Library modal UI with search, edit/delete, and `{{variable}}` substitution insert flow.
- FAB prompt action now opens Prompt Library on both sites.
- Phase 7 output summary written to:
  - `.planning/phases/phase-7/phase-7-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #8)

- Phase 8 implementation completed after this snapshot was written.
- Added conversation parser + PDF/DOCX export generation in content script context.
- Added export dialog UI and wired export triggers from FAB and Sidebar.
- Phase 8 output summary written to:
  - `.planning/phases/phase-8/phase-8-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #9)

- Phase 9 implementation completed after this snapshot was written.
- Added API bridge for main-world fetch/XHR interception and postMessage relay.
- Added token/model overlay in content UI for both target sites.
- Phase 9 output summary written to:
  - `.planning/phases/phase-9/phase-9-01-SUMMARY.md`
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #10)

- Phase 10 implementation completed for automated hardening + private packaging.
- Added README install/packaging guide and generated private zip artifact.
- Phase 10 output summary written to:
  - `.planning/phases/phase-10/phase-10-01-SUMMARY.md`
- Remaining gap is manual Brave Shields aggressive-profile UAT verification.
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #11)

- Added dedicated hardening report:
  - `.planning/phases/phase-10/phase-10-02-HARDENING-REPORT.md`
- Report captures:
  - build/package audit results
  - bundle size footprint
  - dynamic-code token findings in transitive vendor bundle paths
- Remaining gaps are unchanged: manual Brave Shields aggressive-profile UAT + optional export-bundle optimization follow-up.
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #12)

- Performed post-hardening bug sweep + icon integration stabilization pass.
- Added Playwright extension verification script + report artifact:
  - `scripts/verify_extension_playwright.cjs`
  - `.planning/phases/phase-10/phase-10-03-playwright-verification.json`
- Resolved CSP breakage for API bridge by migrating injection from inline script to packaged web-accessible script.
- Integrated project icon asset across manifest, popup, and injected Shadow DOM surfaces (including top-right badge).
- Updated packaging script to rebuild zip cleanly and prevent stale `.DS_Store` entries.
- For latest state, prefer `.planning/STATE.md` plus Completion Log Section 13 entries dated 2026-03-03.

### State Update (2026-03-03, additive #13)

- Ran additional deep regression sweep after phase-10-03 fixes.
- Corrected export dedupe behavior to remove adjacent duplicates only (preserves legitimate repeated turns).
- Corrected install-time stored version to use `chrome.runtime.getManifest().version`.
- Added popup favicon metadata using bundled icon asset.
- Re-ran build + Playwright verification + packaging (all pass).
- Follow-up artifact added:
  - `.planning/phases/phase-10/phase-10-04-DEEP-SWEEP-FOLLOWUP.md`

### State Update (2026-03-04, additive #14)

- Completed phase-10 UI/tour/prompt-catalog deep sweep with expanded automation checks.
- Added 60-template prompt catalog versioning + migration wiring in service worker.
- Added guided Feature Tour modal (ChatGPT + Gemini) and popup onboarding tour (first-run auto-open).
- Fixed popup onboarding regression caused by absolute build asset path (`/index.js`).
- Fixed Feature Tour CTA layering issue by closing tour before opening Prompt Library.
- Expanded Playwright verifier to validate:
  - popup icon + first-run tour auto-open + close behavior
  - prompt catalog count/version assertions
- Added artifacts:
  - `.planning/phases/phase-10/phase-10-05-UI-TOUR-PROMPT-SWEEP.md`
  - `.planning/phases/phase-10/phase-10-05-playwright-verification.json`

### State Update (2026-03-04, additive #15)

- Applied gray transparent glassmorphic treatment to popup/modal windows (content UI + popup UI).
- Added full-logo branding blocks in modal headers and popup tour header.
- Added watermark logo rendering at exact `opacity: 0.3` in window surfaces.
- Upgraded motion system for overlays/windows with smoother transform+opacity transitions.
- Updated popup watermark asset resolution to runtime CSS-variable path (avoids build-time unresolved-asset warnings).
- Added artifacts:
  - `.planning/phases/phase-10/phase-10-06-GLASSMORPHIC-UI-BRANDING.md`
  - `.planning/phases/phase-10/phase-10-06-playwright-verification.json`

### State Update (2026-03-04, additive #16)

- Added hybrid prompt optimizer architecture:
  - deterministic local rewrite first
  - optional AI refinement toggle
  - same-tab default AI mode
  - hidden-tab explicit advanced mode
- Added hidden-tab orchestration in service worker using inactive tab lifecycle and worker readiness checks.
- Added optimizer UI modal with persisted settings (`optimizerSettings`) and wired entry points in Sidebar + FAB.
- Added runtime message actions:
  - `OPTIMIZER_REFINE_HIDDEN_TAB`
  - `OPTIMIZER_WORKER_PING`
  - `OPTIMIZER_WORKER_REFINE`
- Added `tabs` permission for advanced hidden-tab mode in manifest.
- Added artifacts:
  - `.planning/phases/phase-10/phase-10-07-HYBRID-PROMPT-OPTIMIZER.md`
  - `.planning/phases/phase-10/phase-10-07-playwright-verification.json`

### State Update (2026-03-04, additive #17)

- Completed cross-site HUD mobility + visibility hardening pass for ChatGPT and Gemini.
- Unified both site entrypoints on shared panel-state orchestration (`hudUiSettingsV1`) with:
  - draggable/resizable/collapsible/pinnable windows
  - per-panel transparency controls
  - spectrum accent-hue customization
  - FAB size customization
- Added popup-level `Settings` entry with HUD hue + reset controls that write into shared HUD storage.
- Tuned Dex Tokens behavior into compact collapsed bar mode to reduce obstruction of modal action controls.
- Hardened same-tab prompt optimizer submission with layered fallbacks (button click, Enter-key dispatch, form submit path).
- Expanded Playwright verification to assert popup settings modal open path and hue-control presence.
- Added artifacts:
  - `.planning/phases/phase-10/phase-10-11-HUD-MOBILITY-SETTINGS-PROMPT-HARDENING.md`
  - `.planning/phases/phase-10/phase-10-11-playwright-verification.json`

---

## 4. COMPLETE REQUIREMENTS REGISTER

*24 checkable v1 requirements. Updated here as phases complete.*

### INFRA — Infrastructure & Build
| ID | Requirement | Phase | Status |
|---|---|---|---|
| INFRA-01 | Vite build pipeline (4 configs, sequential) outputting MV3-compliant IIFE scripts | 1 | ✅ Complete |
| INFRA-02 | `manifest.json` (MV3) with host_permissions, content_scripts, service_worker, icons | 1 | ✅ Complete |
| INFRA-03 | `lib/storage.js` wrapper over `chrome.storage.local` | 1 | ✅ Complete |
| INFRA-04 | `lib/utils.js`: sanitize, truncate, estimateTokens | 1 | ✅ Complete |
| INFRA-05 | Zero external CDN resources — all bundled | 1 | ✅ Complete |

### CORE — Service Worker & Messaging
| ID | Requirement | Phase | Status |
|---|---|---|---|
| CORE-01 | `service_worker.js` as single source of truth for cross-site state | 2 | ✅ Complete |
| CORE-02 | Typed message protocol (action-discriminated) for content→background | 2 | ✅ Complete |
| CORE-03 | Background handles all chrome.storage.local ops on behalf of content scripts | 2 | ✅ Complete |
| CORE-04 | `api_interceptor.js` with `declarativeNetRequest` rule management | 2 | ✅ Complete |

### ADAPT — DOM Adapter Layer
| ID | Requirement | Phase | Status |
|---|---|---|---|
| ADAPT-01 | `ChatInterface` abstract contract (getTextarea, getSubmitButton, getChatListContainer, isGenerating) | 3 | ✅ Complete |
| ADAPT-02 | `content/gemini/adapter.js` implementing ChatInterface | 3 | ✅ Complete |
| ADAPT-03 | `content/chatgpt/adapter.js` implementing ChatInterface | 3 | ✅ Complete |
| ADAPT-04 | MutationObserver watching submit button `disabled` → generating state events | 3 | ✅ Complete |
| ADAPT-05 | MutationObserver watching chat list container → `onNewChat` events | 3 | ✅ Complete |

### UI — Shadow DOM Framework
| ID | Requirement | Phase | Status |
|---|---|---|---|
| UI-01 | `ui/shadow-renderer.js` factory (host div → #shadow-root → scoped CSS) | 4 | ✅ Complete |
| UI-02 | Preact rendering within Shadow DOM boundary | 4 | ✅ Complete |
| UI-03 | CSS variable system (`--dex-*`) with site light/dark detection | 4 | ✅ Complete |
| UI-04 | `Sidebar.jsx` collapsible panel component | 4 | ✅ Complete |
| UI-05 | `FAB.jsx` floating action button with expandable menu | 4 | ✅ Complete |

### FEAT — Features
| ID | Requirement | Phase | Status |
|---|---|---|---|
| FEAT-01 | Folder data model `{id, name, parentId, chatUrls[]}` via service worker | 5 | ✅ Complete |
| FEAT-02 | Virtual folder tree view in Shadow DOM sidebar | 5 | ✅ Complete |
| FEAT-03 | Chat URL → folder ID mapping, persists across sessions | 5 | ✅ Complete |
| FEAT-04 | Trash/soft-delete with restore | 5 | ✅ Complete |
| FEAT-05 | `content/shared/queue.js` FIFO queue (enqueue/dequeue/peek/isEmpty/size) | 6 | ✅ Complete |
| FEAT-06 | Event interception (Enter/click → enqueue if isGenerating) | 6 | ✅ Complete |
| FEAT-07 | MutationObserver dequeue trigger (button re-enables → send next) | 6 | ✅ Complete |
| FEAT-08 | Prompt Library data model `{id, title, body, tags, variables[]}` | 7 | ✅ Complete |
| FEAT-09 | Prompt Library UI (browse/search/insert with `{{variable}}` substitution) | 7 | ✅ Complete |
| FEAT-10 | Conversation DOM parser → `[{role, content}]` for both sites | 8 | ✅ Complete |
| FEAT-11 | PDF export via jspdf (content script blob) | 8 | ✅ Complete |
| FEAT-12 | DOCX export via docx.js (content script blob) | 8 | ✅ Complete |
| FEAT-13 | Export trigger UI (FAB menu + sidebar button) | 8 | ✅ Complete |

### API — Interception
| ID | Requirement | Phase | Status |
|---|---|---|---|
| API-01 | Inline `<script>` injection into main world to monkey-patch `window.fetch` and `XMLHttpRequest` | 9 | ✅ Complete |
| API-02 | Intercepted data relayed to content script via namespaced `window.postMessage` | 9 | ✅ Complete |
| API-03 | Token usage overlay (`TokenOverlay.jsx`) near input area | 9 | ✅ Complete |

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

[2026-03-03] PHASE 1 EXECUTION — Foundation & Build Pipeline implemented.
  Created MV3 scaffold files per Phase 1 plan:
  - public/manifest.json + 3 PNG icons
  - src/lib/storage.js, src/lib/utils.js
  - src/background/* stubs
  - src/content/shared/* stubs
  - src/content/chatgpt/* and src/content/gemini/* entries/adapters
  - src/popup/index.html + src/popup/index.js
  Build verification:
  - `bun run build` exits 0
  - dist outputs present with fixed non-hashed filenames
  - background/service_worker.js output confirmed IIFE format
  - dist/manifest.json valid MV3
  - icon files validated as PNG headers
  Brave checkpoint evidence:
  - User-provided logs show `[DexEnhance] ChatGPT content script loaded`
  - User-provided logs show `[DexEnhance] Gemini content script loaded`
  Note:
  - `chrome.storage.local` error observed in page-console context is expected
    (extension APIs are not exposed in page world); extension content script
    storage path executed successfully (log emitted after storage guard).
  Summary artifact:
  - .planning/phases/phase-1/phase-1-01-SUMMARY.md

[2026-03-03] PHASE 2 EXECUTION — Service worker messaging and cross-site state routing implemented.
  Implemented typed protocol actions via src/lib/message-protocol.js:
  - PING, STORAGE_GET, STORAGE_GET_ONE, STORAGE_SET, STORAGE_REMOVE, STORAGE_CLEAR
  - API_RULES_UPDATE, API_RULES_CLEAR
  Replaced background stub in src/background/service_worker.js with:
  - async action router returning {ok,data?,error?}
  - centralized chrome.storage.local handling for content-script requests
  - top-level synchronous listener registration with async sendResponse path
  Upgraded src/background/api_interceptor.js:
  - updateRules(): validates/normalizes rule IDs and calls updateDynamicRules
  - clearRules(): removes all active dynamic rules
  Updated content entry points to use background protocol for storage:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Added per-site storage round-trip probe logs to validate message flow.
  Manifest updated to include declarativeNetRequest permission.
  Build verification:
  - `bun run build` exits 0 after Phase 2 changes.
  Summary artifact:
  - .planning/phases/phase-2/phase-2-01-SUMMARY.md

[2026-03-03] PHASE 3 EXECUTION — DOM adapter layer implemented.
  Upgraded src/content/shared/chat-interface.js with:
  - onGeneratingStart/onGeneratingEnd/onNewChat event registration
  - startObservers/stopObservers lifecycle
  - MutationObserver handling for submit-button state and chat-list mutations
  Implemented site adapters:
  - src/content/chatgpt/adapter.js
  - src/content/gemini/adapter.js
  Each adapter now implements:
  - getTextarea()
  - getSubmitButton()
  - getChatListContainer()
  - isGenerating()
  Wired adapters in content entry points:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Added adapter readiness and event logs for verification.
  Build verification:
  - `bun run build` exits 0 after Phase 3 changes.
  Summary artifact:
  - .planning/phases/phase-3/phase-3-01-SUMMARY.md

[2026-03-03] PHASE 4 EXECUTION — Shadow DOM UI framework implemented.
  Implemented UI mount infrastructure:
  - src/ui/shadow-renderer.js
  Implemented scoped UI theme system:
  - src/ui/styles/theme.css
  Implemented Preact component shells:
  - src/ui/components/Sidebar.jsx
  - src/ui/components/FAB.jsx
  Wired both target site entry points to render inside Shadow DOM:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Build verification:
  - `bun run build` exits 0 after Phase 4 changes.
  Summary artifact:
  - .planning/phases/phase-4/phase-4-01-SUMMARY.md

[2026-03-03] PHASE 5 EXECUTION — Folder and chat organization implemented.
  Extended typed protocol with folder actions:
  - FOLDER_TREE_GET, FOLDER_CREATE, FOLDER_RENAME
  - FOLDER_DELETE, FOLDER_RESTORE, FOLDER_DELETE_PERMANENT
  - FOLDER_ASSIGN_CHAT, FOLDER_UNASSIGN_CHAT, FOLDER_GET_BY_CHAT_URL
  Implemented service-worker folder state and operations in:
  - src/background/service_worker.js
  Added folder tree UI in:
  - src/ui/components/FolderTree.jsx
  Updated sidebar integration in:
  - src/ui/components/Sidebar.jsx
  Updated themed styles for folder UI in:
  - src/ui/styles/theme.css
  Current chat URL assignment wired from:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Build verification:
  - `bun run build` exits 0 after Phase 5 changes.
  Summary artifact:
  - .planning/phases/phase-5/phase-5-01-SUMMARY.md

[2026-03-03] PHASE 6 EXECUTION — Smart message queue implemented.
  Implemented shared queue controller in:
  - src/content/shared/queue-controller.js
  Wired queue controller in:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Queue behavior:
  - Intercepts Enter/click submits while generating and enqueues message text
  - Clears input after enqueue
  - Dequeues and auto-sends next item on generating-end observer event
  Sidebar update:
  - Queue count displayed in src/ui/components/Sidebar.jsx
  Build verification:
  - `bun run build` exits 0 after Phase 6 changes.
  Summary artifact:
  - .planning/phases/phase-6/phase-6-01-SUMMARY.md

[2026-03-03] PHASE 7 EXECUTION — Prompt Library implemented.
  Extended protocol with prompt actions:
  - PROMPT_LIST, PROMPT_CREATE, PROMPT_UPDATE, PROMPT_DELETE
  Implemented prompt model + CRUD in:
  - src/background/service_worker.js
  Added Prompt Library UI in:
  - src/ui/components/PromptLibrary.jsx
  FAB prompt action wiring:
  - src/ui/components/FAB.jsx
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Adapter-based prompt insertion helper:
  - src/content/shared/input-utils.js
  Added modal and prompt-card styles in:
  - src/ui/styles/theme.css
  Build verification:
  - `bun run build` exits 0 after Phase 7 changes.
  Summary artifact:
  - .planning/phases/phase-7/phase-7-01-SUMMARY.md

[2026-03-03] PHASE 8 EXECUTION — Universal export implemented.
  Added parser + export modules:
  - src/content/shared/parser.js
  - src/content/shared/exporter.js
  Added export dialog UI:
  - src/ui/components/ExportDialog.jsx
  Export trigger wiring from FAB/sidebar completed in:
  - src/ui/components/FAB.jsx
  - src/ui/components/Sidebar.jsx
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Local dependencies added:
  - jspdf
  - docx
  Build verification:
  - `bun run build` exits 0 after Phase 8 changes.
  Summary artifact:
  - .planning/phases/phase-8/phase-8-01-SUMMARY.md

[2026-03-03] PHASE 9 EXECUTION — API interception and token overlay implemented.
  Implemented API bridge in:
  - src/content/shared/api-bridge.js
  Implemented token overlay UI in:
  - src/ui/components/TokenOverlay.jsx
  Wired bridge + overlay in:
  - src/content/chatgpt/index.js
  - src/content/gemini/index.js
  Added token overlay styles in:
  - src/ui/styles/theme.css
  Build verification:
  - `bun run build` exits 0 after Phase 9 changes.
  Summary artifact:
  - .planning/phases/phase-9/phase-9-01-SUMMARY.md

[2026-03-03] PHASE 10 EXECUTION — Hardening automation + private packaging implemented.
  Added install/distribution documentation:
  - README.md
  Added zip packaging script:
  - package.json script `package:zip`
  Generated private artifact:
  - DexEnhance-v1-private.zip
  Automated checks completed:
  - `bun run build`
  - `bun run package:zip`
  - source audit for extension-owned external runtime resource fetches
  Manual-only remainder:
  - Brave Shields aggressive-profile end-to-end UAT
  Summary artifact:
  - .planning/phases/phase-10/phase-10-01-SUMMARY.md

[2026-03-03] PHASE 10 HARDENING REPORT — Post-build audit documented.
  Report artifact:
  - .planning/phases/phase-10/phase-10-02-HARDENING-REPORT.md
  Captured:
  - automated build/package verification
  - distribution zip artifact confirmation
  - bundle size footprint
  - dynamic-code token findings in transitive vendor bundles
  Follow-up status:
  - manual Brave Shields aggressive-profile UAT still required
  - optional export dependency optimization identified

[2026-03-03] PHASE 10 BUG SWEEP + ICON INTEGRATION — Exhaustive stabilization pass completed.
  Verified project state alignment against BIBLE + .planning/STATE.md.
  Implemented user-provided icon asset rollout from:
  - assets/DexEnhance_Icon_Prime.png
  Added icon placements across:
  - manifest/action icons (16/48/128)
  - in-page top-right brand badge
  - sidebar header, FAB, token overlay, popup
  Bug fixes completed:
  - fixed adapter generating false-positive behavior caused by disabled send controls
  - fixed parser fallback ordering to preserve conversation chronology
  - fixed input writing path for framework-controlled editors
  - fixed API bridge CSP breakage (inline script -> packaged web-accessible script)
  - fixed icon resource denial via web_accessible_resources entries
  - fixed package script stale .DS_Store retention in zip
  Automated verification completed:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  - `bun run package:zip`
  Report artifacts:
  - .planning/phases/phase-10/phase-10-03-BUG-SWEEP-ICON-INTEGRATION.md
  - .planning/phases/phase-10/phase-10-03-playwright-verification.json

[2026-03-03] PHASE 10 DEEP SWEEP FOLLOW-UP — Additional regression fixes completed.
  Added second-pass fixes:
  - parser dedupe narrowed to adjacent duplicates only (preserve valid repeated turns)
  - service worker install version now sourced from manifest version
  - popup favicon metadata added for icon consistency
  Re-validated:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  - `bun run package:zip`
  Follow-up artifact:
  - .planning/phases/phase-10/phase-10-04-DEEP-SWEEP-FOLLOWUP.md

[2026-03-04] PHASE 10 UI/TOUR/PROMPT SWEEP — Deep UX regression pass completed.
  Added prompt catalog seeding/migration versioning and verified 60 default templates.
  Added multi-step Feature Tour modal in injected UI and onboarding modal in popup UI.
  Fixed popup onboarding script regression (absolute `/index.js` output path).
  Fixed tour CTA modal layering by closing tour before opening Prompt Library.
  Expanded Playwright verification scope to include popup + prompt-catalog assertions.
  Re-validated:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  - `bun run package:zip`
  Artifacts:
  - .planning/phases/phase-10/phase-10-05-UI-TOUR-PROMPT-SWEEP.md
  - .planning/phases/phase-10/phase-10-05-playwright-verification.json

[2026-03-04] PHASE 10 GLASSMORPHIC UI BRANDING — Window system visual refinement completed.
  Applied gray transparent glassmorphism to popup/modal windows with backdrop blur.
  Added full-logo brand blocks to modal headers and popup tour intro.
  Added watermark logo treatment at exact 30% opacity across popup/modal surfaces.
  Improved modal/overlay motion with smooth high-performance transitions.
  Updated popup watermark asset path handling to runtime CSS variable (no build-time unresolved-asset warnings).
  Re-validated:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  Artifacts:
  - .planning/phases/phase-10/phase-10-06-GLASSMORPHIC-UI-BRANDING.md
  - .planning/phases/phase-10/phase-10-06-playwright-verification.json

[2026-03-04] PHASE 10 HYBRID OPTIMIZER — Local-first prompt optimization landed.
  Added shared prompt optimizer engine with deterministic rewrite + AI refinement orchestration.
  Added optional AI refinement toggle and mode selector (same-tab default, hidden-tab advanced).
  Added hidden-tab refinement execution path in service worker with tab lifecycle cleanup.
  Added optimizer worker messaging between background and hidden tab content scripts.
  Added optimizer modal UI and wired actions in Sidebar/FAB on ChatGPT and Gemini.
  Added `tabs` permission in manifest to support advanced hidden-tab mode.
  Re-validated:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  - `bun run package:zip`
  Artifacts:
  - .planning/phases/phase-10/phase-10-07-HYBRID-PROMPT-OPTIMIZER.md
  - .planning/phases/phase-10/phase-10-07-playwright-verification.json

[2026-03-04] PHASE 10 WATERMARK VISIBILITY + FEASIBILITY SWEEP — UI refinement and mechanism review completed.
  Ran additional deep regression sweep focused on popup/modal/tour surfaces and architecture constraints.
  Increased injected and popup modal watermark visibility from 30% to 48% and moved to centered larger treatment.
  Increased modal action button transparency across injected UI and popup tour buttons.
  Re-validated:
  - `bun run build`
  - `node scripts/verify_extension_playwright.cjs`
  Added feasibility review for reverse-alpha visible-watermark removal mechanism:
  - technically feasible in narrow controlled conditions
  - not recommended for DexEnhance due brittleness and product/compliance risk
  Artifact:
  - .planning/phases/phase-10/phase-10-08-WATERMARK-VISIBILITY-AND-FEASIBILITY.md

[2026-03-04] PHASE 10 FIREFOX TARGET — Parallel Firefox distribution flow added.
  Added Firefox dist build path that preserves existing Chromium/Brave dist flow:
  - `bun run build:firefox` => builds `dist/`, clones to `dist-firefox/`, rewrites Firefox manifest.
  Added Firefox package flow:
  - `bun run package:zip:firefox` => DexEnhance-v1-firefox.zip
  Added Firefox-specific manifest adjustments in generated `dist-firefox/manifest.json`:
  - browser_specific_settings.gecko metadata
  - removed declarativeNetRequest permission for compatibility
  Updated README with Firefox load/test instructions via about:debugging.
  Re-validated:
  - `bun run build:firefox`
  - `bun run package:zip:firefox`
  Artifact:
  - .planning/phases/phase-10/phase-10-09-FIREFOX-DIST-TARGET.md

[2026-03-04] PHASE 10 README REFRESH — GitHub presentation updated from DexDictate template reference.
  Consulted README style from:
  - https://github.com/westkitty/DexDictate_MacOS
  Reworked DexEnhance README to include:
  - centered icon + badge row
  - concise product positioning and key features
  - architecture snapshot
  - install/build/package/test flows for Brave/Chromium + Firefox
  - preserved constraints and troubleshooting details
  Artifact:
  - .planning/phases/phase-10/phase-10-10-README-TEMPLATE-REFRESH.md

[2026-03-04] PHASE 10 HUD MOBILITY + SETTINGS HARDENING — UI obstruction fixes and control-system unification completed.
  Unified ChatGPT and Gemini content scripts on shared panelized HUD state (`hudUiSettingsV1`).
  Added draggable/resizable/collapsible/pinnable behavior across injected windows and popouts.
  Added per-panel transparency controls + FAB size control + reset actions in HUD settings panel.
  Added popup main-view Settings button and settings modal with spectrum hue + layout/theme reset actions.
  Tuned Dex Tokens to compact collapsed-bar behavior to avoid blocking modal buttons and chat controls.
  Hardened same-tab prompt optimizer submission with button/Enter/form fallback chain.
  Expanded Playwright verifier to assert popup settings modal behavior.
  Re-validated:
  - `bun run build`
  - `bun run verify:playwright`
  Artifacts:
  - .planning/phases/phase-10/phase-10-11-HUD-MOBILITY-SETTINGS-PROMPT-HARDENING.md
  - .planning/phases/phase-10/phase-10-11-playwright-verification.json
```

---

## 14. CHANGE LOG
*Append-only. Document architectural changes, constraint updates, or scope changes.*

```
[2026-03-03] v0.1 — Initial project Bible created. No code exists yet.
  All 10 phases planned at roadmap level. Phase 1 fully planned (PLAN.md verified).

[2026-03-03] v0.2 — Phase 1 execution complete.
  Bun installed and build pipeline operational.
  Dist artifacts now exist and load as MV3 extension bundles.
  Phase output summary added under .planning/phases/phase-1/.

[2026-03-03] v0.3 — Phase 2 messaging architecture landed.
  Introduced typed background protocol and moved content-script storage access
  behind service-worker message routing.
  Added dynamic declarativeNetRequest rule manager scaffold with live API calls.
  Added Phase 2 summary artifact under .planning/phases/phase-2/.

[2026-03-03] v0.4 — Phase 3 adapter layer landed.
  Implemented concrete ChatGPT/Gemini adapter methods and centralized observer
  lifecycle in shared ChatInterface base class.
  Added Phase 3 summary artifact under .planning/phases/phase-3/.

[2026-03-03] v0.5 — Phase 4 Shadow DOM UI framework landed.
  Added Shadow DOM renderer, scoped theme variables, and initial Sidebar/FAB
  Preact components mounted on both ChatGPT and Gemini content entry points.
  Added Phase 4 summary artifact under .planning/phases/phase-4/.

[2026-03-03] v0.6 — Phase 5 folder organization landed.
  Added background folder/chat mapping state model with trash/restore/permanent
  delete operations and rendered virtual FolderTree in sidebar across both sites.
  Added Phase 5 summary artifact under .planning/phases/phase-5/.

[2026-03-03] v0.7 — Phase 6 smart queue landed.
  Added shared queue interception/dequeue controller integrated with adapter
  generating events and surfaced live queue count in sidebar UI.
  Added Phase 6 summary artifact under .planning/phases/phase-6/.

[2026-03-03] v0.8 — Phase 7 prompt library landed.
  Added prompt CRUD model in service worker and Prompt Library modal UI with
  search/edit/delete and `{{variable}}` substitution insertion flow from FAB.
  Added Phase 7 summary artifact under .planning/phases/phase-7/.

[2026-03-03] v0.9 — Phase 8 universal export landed.
  Added conversation parser plus PDF/DOCX export in content script context and
  wired export actions from both FAB and Sidebar UI surfaces.
  Added Phase 8 summary artifact under .planning/phases/phase-8/.

[2026-03-03] v1.0 — Phase 9 API bridge landed.
  Added main-world fetch/XHR interception bridge with postMessage relay and
  surfaced token/model metadata via TokenOverlay in both site integrations.
  Added Phase 9 summary artifact under .planning/phases/phase-9/.

[2026-03-03] v1.1 — Phase 10 packaging/hardening automation landed.
  Added README install guide and repeatable private zip packaging workflow.
  Created private distribution archive DexEnhance-v1-private.zip.
  Added Phase 10 summary artifact under .planning/phases/phase-10/.

[2026-03-03] v1.2 — Phase 10 hardening report landed.
  Added explicit audit artifact for bundle/runtime risk tracking and documented
  remaining manual UAT/optimization work under .planning/phases/phase-10/.

[2026-03-03] v1.3 — Phase 10 stabilization + branded icon rollout landed.
  Added exhaustive bug-fix pass across adapters, parser ordering, input writes,
  CSP-safe API bridge injection, manifest resource access, and zip packaging.
  Added persistent Playwright verification workflow and report artifact.
  Integrated DexEnhance_Icon_Prime branding in manifest, popup, and injected UI.

[2026-03-03] v1.4 — Phase 10 deep regression follow-up landed.
  Corrected parser dedupe logic to preserve non-adjacent repeated turns.
  Corrected install-time version initialization to track manifest version.
  Added popup favicon metadata and revalidated build/verify/package pass.

[2026-03-04] v1.5 — Phase 10 UX/onboarding stabilization landed.
  Added 60-template prompt catalog migration path with versioned seed updates.
  Added guided feature-tour flows in content UI + popup onboarding tour.
  Corrected popup build asset path so onboarding script executes in extension context.
  Expanded Playwright verification coverage for popup/tour/prompt catalog checks.

[2026-03-04] v1.6 — Phase 10 glassmorphic branding refresh landed.
  Re-styled popup/modal windows with neutral glass surfaces and blur layers.
  Added full-logo modal branding and watermark treatment at 30% opacity.
  Upgraded motion quality for overlays/windows while preserving reduced-motion support.
  Revalidated build and Playwright verification after UI refinements.

[2026-03-04] v1.7 — Phase 10 hybrid prompt optimizer landed.
  Added deterministic local-first prompt optimization with optional AI refinement.
  Defaulted AI refinement path to same-tab mode; added hidden-tab advanced mode.
  Added service-worker hidden-tab orchestration and optimizer worker messaging.
  Added optimizer modal UI with persisted user settings and action entrypoints in Sidebar/FAB.
  Revalidated build, Playwright verification, and private zip packaging.

[2026-03-04] v1.8 — Phase 10 watermark visibility + feasibility review landed.
  Updated injected + popup modal watermark treatment to stronger centered visual presence.
  Updated modal action button styling toward higher transparency while preserving legibility.
  Added technical feasibility review for reverse-alpha visible watermark removal and documented
  recommendation to avoid shipping this mechanism in DexEnhance v1.
  Revalidated build and Playwright verification.

[2026-03-04] v1.9 — Phase 10 Firefox parallel target landed.
  Added Firefox-specific dist generation alongside existing Brave/Chromium output.
  Added Firefox packaging script and output archive path.
  Added Firefox gecko metadata and removed DNR permission in generated Firefox manifest.
  Updated README with Firefox temporary-add-on load workflow.
  Revalidated Firefox build/package commands.

[2026-03-04] v1.10 — Phase 10 README template refresh landed.
  Updated README structure/style using DexDictate README as presentation reference.
  Added GitHub-facing hero, badges, feature framing, and clear install/package/verify docs.
  Preserved technical accuracy for DexEnhance-specific architecture and workflows.

[2026-03-04] v1.11 — Phase 10 HUD mobility/settings hardening landed.
  Unified cross-site HUD panel management for ChatGPT and Gemini with persisted panel-state settings.
  Added popup Settings entrypoint for HUD hue/layout control and synced it via storage.
  Added per-panel opacity controls, FAB sizing, and compact token-bar behavior to reduce UI obstruction.
  Hardened same-tab optimizer submission using multi-path fallback dispatch and revalidated build/Playwright.
```

---

*Document version: 0.1 | Created: 2026-03-03 | Next update: After next stabilization pass*
*This is a living document. All AI instances working on this project MUST update the Completion Log (Section 13) and Change Log (Section 14) as work progresses.*
