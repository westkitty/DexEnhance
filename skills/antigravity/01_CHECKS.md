# Repository Checks

This file defines how to verify that the repository is in a healthy, runnable state.

## Automated Checks (The "Verify Path")
Run the following script from the root of the repository (`/Users/andrew/Projects/DexEnhance`):

```bash
bun run build && bun run test:all
```

**Expected Output:**
- Vite build completes successfully for bg, chatgpt, gemini, popup.
- Bun unit tests pass.
- Playwright E2E tests pass.

## Manual Checks
If you make a change that cannot be tested automatically:
1. Run `bun run build`.
2. Load the unpacked extension in Chrome/Firefox from `dist/` or `dist-firefox/`.
3. Manually verify the specific component touched according to the feature's specific UI tests.
