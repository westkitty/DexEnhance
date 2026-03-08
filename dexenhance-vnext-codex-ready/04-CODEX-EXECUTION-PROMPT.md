# Codex Execution Prompt

Use the following prompt with GPT Codex on macOS.

---

You are implementing the next production-ready version of **DexEnhance** inside the **existing repo**, not creating a separate demo app.

## Mission

Merge the best elements of:

1. the real DexEnhance extension architecture already used in the repo, and
2. the stronger polished UX/component system from the design handoff.

Your output must remain a **working Manifest V3 browser extension** for **ChatGPT** and **Google Gemini**, compatible with **Brave Shields aggressive mode**.

## Hard constraints

Do not violate any of these:

- Keep **Manifest V3**.
- Keep **Bun + Vite multi-config** build architecture.
- Keep **IIFE output** for background and content scripts.
- Keep **service worker** as the single source of truth for persistent state.
- Keep **`chrome.storage.local`** as the only persistent store.
- Keep **Preact + Shadow DOM** for injected UI unless there is an extremely small safe change that does not alter the runtime architecture.
- Do **not** rewrite the project into a standalone React SPA.
- Do **not** add any CDN, remote font, remote image, or sync backend.
- Do **not** use raw DOM selectors inside feature modules; use the site adapters.
- Do **not** register service worker listeners asynchronously.
- Do **not** break the existing logo-first onboarding requirements.

## Required product outcome

Every feature in DexEnhance must be:

1. implemented,
2. user-visible,
3. reachable from an obvious UI path,
4. functional end-to-end.

No hidden-only features. No “logic exists but UI is missing.”

## Required surfaces

Implement and reconcile these surfaces so they feel like one product:

- popup surface
- in-page floating action button
- in-page quick hub / sidebar / panels
- token overlay
- welcome surface and quick tour

## Required features

All of the following must work:

- first-run welcome with the real circular logo as the focal point
- quick tour relaunch path
- virtual folder tree
- assign / unassign chat to folders
- trash / restore / permanent delete flows
- smart queue with FIFO auto-send after generation completes
- prompt library CRUD
- `{{variable}}` substitution UI and prompt insertion
- deterministic local prompt optimizer
- optional AI refine in same tab
- optional AI refine in hidden tab with safe cleanup
- semantic clipboard ingest / query / preamble insertion
- conversation export to PDF and DOCX
- token and model overlay via main-world interception bridge
- pop-out code canvas for runnable HTML/CSS/JS bundles
- HUD mobility: drag / resize / collapse / pin / recover / reset
- accent hue + transparency controls
- popup-level settings and feature launchers

## UX requirements

- The logo must be the welcoming part of the product.
- The logo must remain prominent throughout the extension.
- Modal and popup branding should preserve the current full-logo/watermark language where appropriate.
- Welcome composition should stay circle-first, not a generic rectangle card.
- Glassmorphic surfaces must be readable, not washed out.
- Empty, loading, success, and error states are required for every major surface.
- Panels must not become unrecoverable if moved off-screen.
- Compact overlay behavior must reduce obstruction near host controls.

## Architecture requirements

- Use the service worker for persistent shared state and migration logic.
- Use content scripts only for host integration, UI mount, export blob generation, and adapter-mediated interactions.
- Use a main-world injected bridge for fetch/XHR interception and relay data back via namespaced `window.postMessage`.
- Use adapter contracts for both ChatGPT and Gemini. Centralize selectors there.
- Keep build outputs deterministic and non-hashed where the manifest depends on them.

## What to read first

Read these local handoff files before changing code:

- `01-ASSUMPTIONS.md`
- `02-MERGED-IMPLEMENTATION-BLUEPRINT.md`
- `03-FILE-TREE-AND-MODULE-CONTRACTS.md`
- `05-FEATURE-VISIBILITY-MATRIX-AND-UAT.md`

Then inspect the existing repo and align with it.

## How to work

1. Audit the existing repo and identify what already exists.
2. Preserve the existing architecture and only refactor where necessary.
3. Reconcile duplicated or competing UI patterns into one consistent design system.
4. Implement missing visibility or missing functionality gaps.
5. Do not stop at “build passes.” Continue until the feature/UAT matrix passes.

## Required outputs from you

You must produce all of the following inside the repo:

- updated source code
- updated build-safe manifest/config where needed
- updated tests or Playwright verification where needed
- updated README/install notes if behavior changes
- a concise implementation log stating:
  - what was preserved
  - what was changed
  - what was hardened
  - which acceptance items now pass

## Validation bar

Before declaring done, verify:

- `bun run build` passes
- extension loads unpacked in Brave without red error badge
- popup loads correctly
- ChatGPT content script loads correctly
- Gemini content script loads correctly
- logo-first welcome flow is correct
- every feature has an obvious UI entry path
- PDF export works
- DOCX export works
- queue works while generation is active
- optimizer works in local, same-tab, and hidden-tab modes
- semantic clipboard works locally
- token/model overlay works or degrades gracefully
- no external runtime resources are requested
- Playwright verification passes or is updated to pass with the new behavior

## Anti-failure rules

- Do not replace working repo code with a clean-room abstraction unless necessary.
- Do not introduce framework churn for its own sake.
- Do not leave any feature reachable only by debug flag or hidden dev toggle.
- Do not remove onboarding/logo fidelity to simplify implementation.
- Do not claim completion while any major feature is missing UI access.

When in doubt, prefer the path most likely to keep the real extension working in Brave.

---
