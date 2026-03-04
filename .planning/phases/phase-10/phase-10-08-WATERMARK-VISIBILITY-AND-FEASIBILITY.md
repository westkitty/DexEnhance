# Phase 10-08 — Watermark Visibility Refresh + Mechanism Feasibility Review

Date: 2026-03-04

## Objective

1. Perform another deep regression sweep focused on current modal/tour/popup surfaces.
2. Increase brand watermark visibility to match stronger in-window branding direction.
3. Make modal action buttons more transparent while preserving readability.
4. Evaluate feasibility of reverse-alpha visible-watermark removal in DexEnhance.

## Bug Sweep Scope

- Build pipeline and bundle integrity:
  - `bun run build`
- End-to-end extension verification (service worker, storage path, popup onboarding, injected UI):
  - `node scripts/verify_extension_playwright.cjs`
- Architectural guard checks:
  - No direct content-script storage bypasses from feature modules.
  - No new extension-initiated external runtime fetches.
  - DOM interactions still constrained to adapters/shared parser paths.

## Findings

1. No new DexEnhance runtime regressions were found in this pass.
2. One transient Playwright run reported missing ChatGPT host injection; immediate rerun passed with full ChatGPT and Gemini UI detection. This was treated as site-load flake, not code regression.
3. Console warnings observed on Gemini/ChatGPT remained host-page CSP/telemetry noise and not extension errors.

## Implemented UI Changes

### Injected UI (`src/ui/styles/theme.css`)

- Increased modal watermark visibility:
  - `--dex-watermark-opacity` from `0.3` -> `0.48`.
  - Watermark moved from small bottom-right stamp to centered/larger treatment (`.dex-modal::after`).
- Increased modal button transparency:
  - `.dex-link-btn` background now semi-transparent + blur.
  - `.dex-link-btn--accent` and `.dex-tour__next` gradient fills now semi-transparent with visible borders.

### Popup UI (`src/popup/index.html`)

- Increased watermark visibility:
  - `--dex-watermark-opacity` from `0.3` -> `0.48`.
  - Popup panel and popup tour watermark moved to centered/larger treatment.
- Increased button transparency:
  - `.tour-btn` changed to semi-transparent gradient + border + blur.
  - `.btn` neutral fill reduced opacity.
  - `.btn.primary` gradient fill reduced opacity and given border.

## Feasibility Verdict — Reverse-Alpha Visible Watermark Removal

### Technical feasibility

- It is technically feasible to implement a client-side reverse-alpha reconstruction pipeline in an extension using Canvas when all of the following are true:
  - The exact watermark bitmap is known.
  - The exact alpha map and compositing math are stable.
  - Pixel-space location/scale rules are stable across output variants.

### Practical risk for DexEnhance

- High maintenance risk:
  - Gemini DOM/layout/export behaviors and watermark rendering strategy can change without notice, making this brittle.
- Quality risk:
  - Compression, color conversion, resampling, and quantization make inversion near-lossless only in narrow cases.
- Product/compliance risk:
  - Shipping an explicit watermark-removal capability is likely to create policy and trust issues for a productivity extension.

### Recommendation

- Do not integrate watermark-removal flow into DexEnhance v1.
- If image post-processing is needed, prefer neutral, user-controlled utilities (format conversion, crop, resize, metadata visibility) that are not designed to bypass provenance marks.

## Validation

- `bun run build` — pass
- `node scripts/verify_extension_playwright.cjs` — pass

## Outcome

- Branding is visibly stronger and closer to the requested reference style.
- Modal action buttons are more transparent while remaining legible.
- Project remains in a green state under automated build + Playwright checks.
