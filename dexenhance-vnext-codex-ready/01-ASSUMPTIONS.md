# Assumptions I Made

1. **The existing DexEnhance repo is the source of truth.**
   This handoff is for implementing the next version inside the existing project, not replacing it with a separate app.

2. **When there is a conflict between the earlier polished frontend prototype and the real DexEnhance repo architecture, the repo architecture wins.**
   That means:
   - Manifest V3 stays
   - Bun + Vite multi-config stays
   - IIFE background/content output stays
   - Preact + Shadow DOM stays
   - `chrome.storage.local` via the service worker stays

3. **The polished frontend contribution is treated as a UX and component-system upgrade, not as a demand to rewrite the extension runtime into a standalone React app.**

4. **TypeScript is optional, not mandatory, for this implementation pass.**
   The existing project Bible locked JavaScript for v1. A full TypeScript migration is possible later, but it is not the safest way to get to a working extension quickly.

5. **Tailwind may be used only if compiled locally into bundled CSS.**
   No CDN, no runtime stylesheet fetches, no host-page CSS dependence. If Tailwind complicates the existing build, use authored CSS variables and utility classes instead.

6. **Every feature listed in the product scope must be both functional and visibly reachable from the UI.**
   No “implemented but hidden” modules.

7. **The real DexEnhance logo is non-negotiable.**
   The welcome experience must start with the circular logo presentation, and branding must remain present in popup and injected surfaces.

8. **The implementation must be Codex-friendly on macOS.**
   That means the instructions must be explicit, phase-based, and executable without relying on unstated repo knowledge.

9. **Brave with aggressive Shields is the real compatibility bar.**
   If something works only in a soft environment, it does not count as done.

10. **Feature completeness matters more than framework purity.**
    A working Preact-based DexEnhance is better than a half-finished React rewrite.
