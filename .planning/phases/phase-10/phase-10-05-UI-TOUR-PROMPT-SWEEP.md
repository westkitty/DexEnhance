# Phase 10-05 — UI Tour + Prompt Catalog Deep Sweep

Date: 2026-03-04

## Scope

- Perform a detailed regression sweep across newly added UI/tour/prompt-catalog work.
- Validate icon prominence across all extension surfaces.
- Validate onboarding modal behavior in both injected UI and popup UI.
- Validate prompt-catalog minimum size requirement (>= 50 templates).

## Inputs Consulted

- `BIBLE.md` (workflow constraints + active state notes)
- `.planning/STATE.md` (authoritative current phase status)
- `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` (local mirror used: `/Users/andrew/Projects/ClaudeCode_Tools/ui-ux-pro-max-skill`)
- Existing UI standards reference: `/Users/andrew/.claude/get-shit-done/references/ui-brand.md`

## Issues Found

1. Popup tour logic not executing on first launch in extension context.
- Root cause: Vite popup build emitted `<script src="/index.js">` in `dist/popup/index.html`.
- Result: script resolved to `chrome-extension://<id>/index.js` (missing), causing `ERR_FILE_NOT_FOUND` and no modal auto-open.
- Fix: set popup build base to `/popup/` in `vite.config.popup.js`, resulting in `./index.js` script URL in output and proper script execution.

2. Tour CTA behavior conflict in injected content UIs.
- Root cause: “Open Prompt Library Now” action opened Prompt Library without closing Feature Tour.
- Result: prompt modal rendered behind active tour overlay.
- Fix: in both content entrypoints (`chatgpt` and `gemini`), CTA now closes tour, opens Prompt Library, and persists seen-state.

## Verification Additions

Updated `scripts/verify_extension_playwright.cjs` to include:

- popup page verification (`chrome-extension://<id>/popup/index.html`)
- popup icon presence check
- popup first-run modal auto-open check
- popup close behavior check
- prompt catalog count and catalog version check via service worker storage
- new report path: `.planning/phases/phase-10/phase-10-05-playwright-verification.json`

## Automated Validation Run

- Build: `bun run build` (pass)
- Browser regression: `node scripts/verify_extension_playwright.cjs` (pass)
- Packaging: `bun run package:zip` (pass)

Report artifact:
- `.planning/phases/phase-10/phase-10-05-playwright-verification.json`

## Outcome

- Popup onboarding modal now auto-opens correctly on first launch.
- In-page tour CTA now transitions correctly into Prompt Library.
- Prompt catalog is populated and verified at 60 templates.
- Icon rollout remains active across manifest/action/sidebar/FAB/overlay/badge/popup.
- No extension-origin CSP/resource-denial regressions detected in ChatGPT or Gemini runs.
