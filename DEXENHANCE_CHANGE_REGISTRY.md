## Discovery Summary (2026-04-12)
- **Workspace Confirmed:** /Users/andrew/Projects/DexEnhance
- **Git Status:** Repository is active, tracking changes.
- **Architecture:** Confirmed MV3, local-first, Shadow DOM, Preact/Vite/Bun stack.
- **Key Components:** Dedicated adapters for ChatGPT and Gemini. State is managed via `chrome.storage.local`.
- **Build Process:** Multi-config build pipeline using `bun run build` (Chromium) and `bun run build:firefox` (Firefox).
- **Testing:** Primary verification uses Playwright (`node scripts/verify_extension_playwright.cjs`).
- **Documentation:** `README.md` provides excellent, detailed architectural overview. `CLAUDE.md` provides operational context.
- **State:** The project appears highly structured and adheres to strict architectural preservation rules. No immediate blockers found; ready for feature enhancement passes.