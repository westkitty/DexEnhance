# Phase 10 Deep Sweep Follow-Up

Date: 2026-03-03
Project: DexEnhance
Scope: Additional exhaustive regression sweep after phase-10-03 fixes

## Additional Bugs Found and Fixed

1. Export duplicate suppression overreach
- File:
  - `src/content/shared/parser.js`
- Issue:
  - Parser dedupe removed all repeated role/content pairs globally.
  - Legit repeated turns (same text sent twice) could be dropped from exports.
- Fix:
  - Changed dedupe to remove adjacent duplicates only (hydration/animation duplicates),
    preserving non-adjacent repeated turns.

2. Install metadata version hardcoded
- File:
  - `src/background/service_worker.js`
- Issue:
  - `onInstalled` wrote static version `0.1.0` regardless of manifest version.
- Fix:
  - Version now initialized from `chrome.runtime.getManifest().version`.

3. Popup icon metadata completeness
- File:
  - `src/popup/index.html`
- Issue:
  - Popup visually used icons but had no `<link rel="icon">`.
- Fix:
  - Added popup favicon link to `../icons/icon48.png`.

## Verification (Re-run)

- Build + verify + package:
  - `bun run build` PASS
  - `node scripts/verify_extension_playwright.cjs` PASS
  - `bun run package:zip` PASS
- Playwright report refreshed:
  - `.planning/phases/phase-10/phase-10-03-playwright-verification.json`
  - Result: `"pass": true`

## Notes

- Attempted cleanup of large generated Playwright session profile directory was blocked by runtime policy (`rm -rf ...` blocked).
- This does not affect extension runtime or packaging outputs.
