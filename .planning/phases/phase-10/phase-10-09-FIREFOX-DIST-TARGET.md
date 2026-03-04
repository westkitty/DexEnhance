# Phase 10-09 — Firefox Distribution Target (Parallel to Brave)

Date: 2026-03-04

## Objective

Add a Firefox extension target alongside the existing Brave/Chromium target without changing or breaking the current `dist/` workflow.

## Scope

1. Keep current Brave/Chromium build output unchanged (`dist/`).
2. Add Firefox-specific build output (`dist-firefox/`) with Firefox-specific manifest adjustments.
3. Add Firefox zip packaging command.
4. Document Firefox test/load workflow.

## Implementation

### 1. Firefox dist generator script

Added script:
- `scripts/build_firefox_dist.cjs`

Behavior:
- Reads existing Chromium build output from `dist/`.
- Copies it to `dist-firefox/`.
- Rewrites only `dist-firefox/manifest.json` with Firefox-specific compatibility metadata.
- Preserves all current code bundles and assets unchanged.

Firefox manifest adjustments applied:
- Adds:
  - `browser_specific_settings.gecko.id = "dexenhance@andrew-private"`
  - `browser_specific_settings.gecko.strict_min_version = "128.0"`
- Removes unsupported/high-risk permission for Firefox target:
  - `declarativeNetRequest`

### 2. Package scripts

Updated `package.json` scripts:
- `build:firefox`
  - `bun run build && node scripts/build_firefox_dist.cjs`
- `package:zip:firefox`
  - `bun run build:firefox && cd dist-firefox && ... -> DexEnhance-v1-firefox.zip`

### 3. Documentation

Updated `README.md` with:
- Firefox build instructions (`bun run build:firefox`)
- Firefox zip packaging instructions (`bun run package:zip:firefox`)
- Firefox temporary-load instructions via:
  - `about:debugging#/runtime/this-firefox`
  - Load `dist-firefox/manifest.json`

## Validation

- `bun run build:firefox` — pass
- `bun run package:zip:firefox` — pass

## Outputs

- Firefox dist folder:
  - `/Users/andrew/Projects/DexEnhance/dist-firefox`
- Firefox package zip:
  - `/Users/andrew/Projects/DexEnhance/DexEnhance-v1-firefox.zip`

## Outcome

DexEnhance now has a parallel Firefox extension target without altering the primary Brave/Chromium build and package flow.
