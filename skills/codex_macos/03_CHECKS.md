# Codex macOS Checks and Verify Path

## Repository Runtime Snapshot
- Runtime: Bun (JavaScript and TypeScript).
- Build system: Vite.
- End-to-end tests: Playwright.
- Root path for all commands: `/Users/andrew/Projects/DexEnhance`

## Primary Verify Path (Automated)
Run from repo root:
```bash
bun run build && bun run test
```

This uses existing repository scripts from `package.json`:
- `build`
- `test`

## End-to-End (E2E) Verify Path (Automated)
Playwright in this repository expects `http://localhost:5179` to be available.
Run:
```bash
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

If you prefer using the existing script:
```bash
bun run test:all
```
Note: it may fail with `ERR_CONNECTION_REFUSED` unless a local server is already running on port `5179`.

## Granular Verify Commands
Use when narrowing failures:
```bash
bun run build
bun run test
bun run test:e2e
bun run verify:playwright
```

## Expected Success Signals
- build emits dist artifacts for background/chatgpt/gemini/popup targets.
- unit tests pass (`bun test tests/unit/`).
- end-to-end tests pass (`bunx playwright test tests/e2e/`) while preview server is active.

## Manual Verify Fallback (If Automated Verify Is Blocked)
1. Run `bun run build`.
2. Load unpacked extension from `dist/` in the browser.
3. Validate changed workflow manually.
4. Capture proof artifacts:
   - command output
   - screenshot or reproduction note
   - exact rollback command

## Failure Handling
If any command exits non-zero:
1. Stop further edits.
2. Record failing command and error snippet.
3. Roll back changed files with `git restore`.
4. Re-run verify after fix.
