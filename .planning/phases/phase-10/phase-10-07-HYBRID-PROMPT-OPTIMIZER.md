# Phase 10-07 — Hybrid Prompt Optimizer (Local + Optional AI)

Date: 2026-03-04

## Objective

Implement a hybrid prompt optimizer with:
- deterministic local rewrite as the default path
- optional AI refinement mode with explicit user toggle
- same-tab refinement as default AI mode
- hidden-tab refinement as explicit advanced mode

## Implementation Summary

1. Added shared optimizer engine module.
- `src/content/shared/prompt-optimizer.js`
- Provides deterministic prompt structuring, AI refinement orchestration, and hidden-tab worker listener support.

2. Added optimizer UI modal with persisted settings.
- `src/ui/components/PromptOptimizerModal.jsx`
- Settings persisted through background-routed storage key `optimizerSettings`.
- Defaults:
  - `aiRefinementEnabled: false`
  - `refinementMode: same_tab`

3. Integrated optimizer entry points into main UI actions.
- Sidebar now includes `Optimize Prompt` action.
- FAB now includes `Optimize Prompt` action.
- Wired into both content scripts:
  - `src/content/chatgpt/index.js`
  - `src/content/gemini/index.js`

4. Added hidden-tab advanced orchestration in service worker.
- New message actions:
  - `OPTIMIZER_REFINE_HIDDEN_TAB`
  - `OPTIMIZER_WORKER_PING`
  - `OPTIMIZER_WORKER_REFINE`
- Service worker creates inactive tab, waits for content worker readiness, requests refinement, and closes tab.
- Implemented in `src/background/service_worker.js`.

5. Updated extension permissions for hidden-tab orchestration.
- Added `tabs` permission to manifest:
  - `public/manifest.json`

## Behavioral Flow

1. User opens Prompt Optimizer.
2. Extension runs deterministic local rewrite first.
3. If AI refinement toggle is enabled:
- default mode: same-tab refinement
- advanced mode: hidden-tab refinement
4. On AI failure, result gracefully falls back to deterministic rewrite with warning.

## Validation

- `bun run build` — pass
- `node scripts/verify_extension_playwright.cjs` — pass
- `bun run package:zip` — pass

Artifacts:
- `.planning/phases/phase-10/phase-10-07-playwright-verification.json`
