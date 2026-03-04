# DexEnhance — Project State

## Current Position

- **Milestone:** 1 — Full-Featured Extension v1
- **Phase:** 10 — Brave Hardening & Private Distribution
- **Status:** Implemented (automated checks + Playwright verification complete)

## What's Been Done

- [x] Project architecture designed (MV3, Vite, Preact + Shadow DOM, adapter pattern)
- [x] GSD planning artifacts created (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, config.json)
- [x] Phase 1 plan executed: build pipeline, manifest, core lib modules, source stubs, icons
- [x] Phase 1 automated verification passed (`bun run build`, dist structure, IIFE validation)
- [x] Phase 1 checkpoint evidence captured from Brave console logs on chatgpt.com and gemini.google.com
- [x] Phase summary written: `.planning/phases/phase-1/phase-1-01-SUMMARY.md`
- [x] Phase 2 implemented:
- [x] Background typed message router (`STORAGE_*`, `API_RULES_*`, `PING`)
- [x] Content scripts now route storage through service worker (no direct storage reads)
- [x] `api_interceptor.js` now manages dynamic DNR rules (update + clear)
- [x] Build verified after Phase 2 changes (`bun run build`)
- [x] Phase 3 implemented:
- [x] `ChatInterface` contract upgraded with event registration and observer lifecycle
- [x] `ChatGPTAdapter` implemented (`getTextarea/getSubmitButton/getChatListContainer/isGenerating`)
- [x] `GeminiAdapter` implemented (`getTextarea/getSubmitButton/getChatListContainer/isGenerating`)
- [x] MutationObservers wired for generating-state and chat-list mutations on both sites
- [x] Content script entry points now instantiate adapters and log readiness/events
- [x] Phase 4 implemented:
- [x] Shadow DOM renderer added (`src/ui/shadow-renderer.js`)
- [x] Scoped theme variable system added (`src/ui/styles/theme.css`)
- [x] Preact components added (`Sidebar.jsx`, `FAB.jsx`)
- [x] ChatGPT and Gemini content scripts now render UI inside Shadow DOM
- [x] Phase 5 implemented:
- [x] Service worker folder model + CRUD + mapping actions
- [x] Folder tree UI added in sidebar (`FolderTree.jsx`)
- [x] Current chat URL assignment to folder persisted via background
- [x] Trash/restore/permanent-delete workflow implemented
- [x] Build verified after Phase 5 changes (`bun run build`)
- [x] Phase 6 implemented:
- [x] Queue interception controller added (`queue-controller.js`)
- [x] Enter/click interception queues messages when generating
- [x] Dequeue auto-send on generating-end observer signal
- [x] Queue size surfaced in sidebar UI
- [x] Build verified after Phase 6 changes (`bun run build`)
- [x] Phase 7 implemented:
- [x] Prompt CRUD protocol/actions in service worker
- [x] Prompt data model with variable extraction (`{{variable}}`)
- [x] Prompt Library UI with create/edit/delete/search/insert
- [x] FAB action opens Prompt Library on both sites
- [x] Prompt insertion routed through adapters (no raw selector writes)
- [x] Build verified after Phase 7 changes (`bun run build`)
- [x] Phase 8 implemented:
- [x] Conversation parser implementation for ChatGPT/Gemini (`parser.js`)
- [x] PDF export pipeline (`jspdf`) in content script context
- [x] DOCX export pipeline (`docx`) in content script context
- [x] Export dialog UI added and wired from FAB + Sidebar
- [x] Build verified after Phase 8 changes (`bun run build`)
- [x] Phase 9 implemented:
- [x] Main-world API bridge injection (`api-bridge.js`) for fetch/XHR interception
- [x] postMessage relay subscription path to content script
- [x] Token/model overlay UI component (`TokenOverlay.jsx`)
- [x] Overlay wired into both ChatGPT and Gemini content scripts
- [x] Build verified after Phase 9 changes (`bun run build`)
- [x] Phase 10 implemented:
- [x] Runtime source audit confirms no extension-initiated external CDN/resource fetch paths
- [x] Private package zip generated (`DexEnhance-v1-private.zip`)
- [x] Install/distribution guide written (`README.md`)
- [x] Build + package flow validated (`bun run build`, `bun run package:zip`)
- [x] Hardening report written (`.planning/phases/phase-10/phase-10-02-HARDENING-REPORT.md`)
- [x] Bundle-size + dynamic-code-token risks documented for follow-up
- [x] Deep bug sweep performed across adapter/queue/parser/API-bridge/packaging paths
- [x] Fixed false-positive generating-state detection in site adapters
- [x] Fixed export parser fallback ordering to preserve DOM chronology
- [x] Fixed input value writes for framework-controlled textareas/editors
- [x] Fixed API bridge CSP breakage by moving injection to web-accessible script file
- [x] Added icon assets from `/assets/DexEnhance_Icon_Prime.png` (16/48/128)
- [x] Added in-page top-right brand badge and icon treatment in sidebar/FAB/overlay/popup
- [x] Added Playwright verification script + report artifact + screenshots
- [x] Fixed zip packaging script to prevent stale `.DS_Store` entries
- [x] Deep-sweep follow-up fixed parser global-dedupe overreach (adjacent-only dedupe)
- [x] Service worker install version now sourced from manifest version
- [x] Popup now includes favicon metadata
- [x] Added 60-template prompt catalog seed/migration with versioned updates (`promptCatalogVersion`)
- [x] Added cross-site injected Feature Tour modal with examples and reopen actions (sidebar/FAB/top-right badge)
- [x] Added popup onboarding tour modal with first-run auto-open and persisted seen-state
- [x] Fixed popup script loading path bug (`/index.js` -> popup-scoped URL) so onboarding executes reliably
- [x] Fixed Feature Tour CTA layering bug (tour now closes before opening Prompt Library)
- [x] Expanded Playwright verifier to assert popup tour behavior and prompt catalog size/version
- [x] Added regression artifact `.planning/phases/phase-10/phase-10-05-UI-TOUR-PROMPT-SWEEP.md`
- [x] Added regression artifact `.planning/phases/phase-10/phase-10-05-playwright-verification.json`
- [x] Applied gray glassmorphic treatment to popup/modal windows with blur + transparent shells
- [x] Integrated full logo rendering in modal headers and popup tour brand row
- [x] Implemented watermark logo treatment at exact 30% opacity for popup/modal windows
- [x] Added high-performance modal/window entrance transitions and hover/focus interaction polish
- [x] Added artifact `.planning/phases/phase-10/phase-10-06-GLASSMORPHIC-UI-BRANDING.md`
- [x] Added artifact `.planning/phases/phase-10/phase-10-06-playwright-verification.json`
- [x] Added Hybrid Prompt Optimizer flow (local deterministic first + optional AI refinement toggle)
- [x] Added optimizer modes: `same_tab` default AI mode and explicit advanced `hidden_tab`
- [x] Added hidden-tab orchestration in service worker with tab lifecycle + worker readiness checks
- [x] Added optimizer UI modal and wired actions in Sidebar + FAB on both sites
- [x] Added artifact `.planning/phases/phase-10/phase-10-07-HYBRID-PROMPT-OPTIMIZER.md`
- [x] Added artifact `.planning/phases/phase-10/phase-10-07-playwright-verification.json`
- [x] Ran additional Phase 10 deep regression sweep after UI visibility request
- [x] Increased popup/modal logo watermark visibility and centered large watermark treatment
- [x] Increased modal action button transparency across injected and popup UI surfaces
- [x] Added feasibility assessment for reverse-alpha watermark-removal mechanism
- [x] Added artifact `.planning/phases/phase-10/phase-10-08-WATERMARK-VISIBILITY-AND-FEASIBILITY.md`
- [x] Added parallel Firefox target build output (`dist-firefox`) without changing Chromium `dist`
- [x] Added Firefox packaging flow (`DexEnhance-v1-firefox.zip`)
- [x] Added Firefox manifest transformation with gecko metadata and DNR permission removal
- [x] Updated README with Firefox temporary-load testing instructions
- [x] Added artifact `.planning/phases/phase-10/phase-10-09-FIREFOX-DIST-TARGET.md`
- [x] Refreshed GitHub README using DexDictate template style as reference
- [x] Added artifact `.planning/phases/phase-10/phase-10-10-README-TEMPLATE-REFRESH.md`
- [x] Unified ChatGPT + Gemini onto shared draggable/resizable/collapsible/pinnable panel system
- [x] Added centralized HUD settings model (`hudUiSettingsV1`) with per-panel min-size clamping
- [x] Added Dex Tokens compact collapsed bar behavior to reduce modal/button obstruction
- [x] Added per-panel opacity controls + FAB size control + reset actions in injected HUD settings panel
- [x] Added popup-level Settings button + modal with hue slider and layout/theme reset actions
- [x] Hardened same-tab prompt optimizer submission with click/Enter/form fallbacks
- [x] Expanded Playwright verifier to assert popup settings modal open path and controls
- [x] Added artifact `.planning/phases/phase-10/phase-10-11-HUD-MOBILITY-SETTINGS-PROMPT-HARDENING.md`
- [x] Added artifact `.planning/phases/phase-10/phase-10-11-playwright-verification.json`

## What's Next

Optional follow-up pass:
- Authenticated end-to-end walkthrough on chatgpt.com and gemini.google.com (real account flows)
- Final sign-off on token overlay accuracy against live provider responses under authenticated requests
- Optional: replace/segment export dependencies to reduce content bundle size and remove dynamic-code vendor paths
- Optional: clean generated Playwright session profile artifacts if policy/tooling permits recursive delete

## Key Context for Future Sessions

- **Package manager:** Bun
- **Build tool:** Vite with multi-entry MV3 output
- **UI:** Preact (bundled, no CDN) rendered into Shadow DOM
- **State:** All via `chrome.storage.local` through service worker message passing
- **Target sites:** `https://chatgpt.com/*` and `https://gemini.google.com/*`
- **DOM approach:** Adapter pattern — all features use `ChatInterface`, never raw selectors
- **Distribution:** Private `.zip` for Load Unpacked — no Web Store

## Decisions Log

| Date | Decision | Context |
|---|---|---|
| 2026-03-03 | All v1 features in scope (no phased MVP cuts) | User confirmed all 4 feature areas for v1 |
| 2026-03-03 | Private distribution only | No Web Store submission for v1 |
| 2026-03-03 | Bun as package manager | Apple Silicon performance |
| 2026-03-03 | Phase 1 execution accepted from user-run Brave evidence + automated build checks | Avoided additional user friction while preserving required validation signals |
| 2026-03-03 | Storage access moved behind background message protocol in content scripts | Enforces cross-site single-source state management before feature phases |
| 2026-03-03 | Adapter observers centralized in `ChatInterface` base class | Keeps per-site selectors in adapter files while reusing event mechanics |
| 2026-03-03 | Injected UI now always mounts in Shadow DOM host via `createShadowRenderer` | Prevents host-page CSS from mutating extension UI |
| 2026-03-03 | Folder/chat organization state modeled in service worker with soft-delete semantics | Enables cross-site persistent folder tree and trash restore workflows |
| 2026-03-03 | Queue interception moved into shared controller wired to adapter generating events | Keeps queue behavior consistent across ChatGPT and Gemini while preserving adapter boundaries |
| 2026-03-03 | Prompt library storage and substitution kept background-routed + adapter-inserted | Preserves cross-site consistency and DOM abstraction boundaries |
| 2026-03-03 | Export generation runs in content script context using Blob downloads | Ensures browser download prompts work under MV3 constraints |
| 2026-03-03 | API interception implemented via main-world bridge script + postMessage | Preserves MV3 isolation while surfacing token/model metadata in content UI |
| 2026-03-03 | Private distribution standardized on `DexEnhance-v1-private.zip` built from `dist/` | Provides repeatable handoff/install artifact for non-store deployment |
| 2026-03-04 | Popup Vite build base set to `/popup/` | Prevents absolute `/index.js` output path regression in extension popup |
| 2026-03-04 | Prompt defaults are versioned with merge-on-upgrade | Enables non-destructive catalog expansion without overwriting user prompts |
| 2026-03-04 | Feature Tour CTA closes tour before opening Prompt Library | Prevents modal layering conflicts and preserves clear flow |
| 2026-03-04 | Modal/window watermark is rendered through CSS variable channel | Keeps runtime icon path extension-safe while enforcing 30% opacity target |
| 2026-03-04 | Hybrid optimizer defaults to local rewrite with optional AI refinement | Prioritizes reliability and speed while keeping advanced hidden-tab path explicit |
| 2026-03-04 | Modal watermark visibility increased and centered for stronger branding pass | Aligns with latest visual direction while preserving glassmorphic readability and interaction contrast |
| 2026-03-04 | Reverse-alpha watermark removal evaluated as feasible-but-not-recommended | High brittleness and product/compliance risk for DexEnhance scope |
| 2026-03-04 | Firefox target is produced from Chromium build output via manifest transform | Preserves single code pipeline while enabling parallel browser-specific packaging |
| 2026-03-04 | README structure now follows DexDictate-style GitHub presentation | Improves discoverability and onboarding while preserving exact DexEnhance build/test steps |
| 2026-03-04 | HUD state now uses panel-specific min-size clamping + unified cross-site layout model | Prevents small-surface regressions (FAB/token bar) and keeps draggable/resizable controls consistent on ChatGPT and Gemini |
