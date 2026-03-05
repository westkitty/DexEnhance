# Codex macOS Skills Toolkit Runbook

## Purpose
Install and operate a repo-local Codex toolkit that is repeatable, verifiable, and reversible.

## Open the Correct Folder (Repo Root Detection)
Open this exact folder in Codex:
`/Users/andrew/Projects/DexEnhance`

Detection rules:
1. Confirm `.git/` exists.
2. Confirm at least one dependency manifest exists (`package.json` for this repository).
3. If you are inside a subfolder, walk upward until both checks are true.

Copy/paste root check:
```bash
cd /Users/andrew/Projects/DexEnhance
test -d .git && echo ".git present"
test -f package.json && echo "package.json present"
```

## Fastest Prompt Feeding Pattern in Codex
1. Split work into small chunks (one chunk per thread).
2. Start a new task thread for each chunk using this pattern:
   - Thread title: `<area>: <single goal>`
   - Prompt body: `Inputs -> Constraints -> Output artifacts -> Verify command -> Rollback plan`
3. Keep one thread focused on one mergeable outcome.
4. Require artifacts in every thread:
   - `git diff` output
   - command output for verify
   - concise summary of touched files

Template prompt:
```text
Goal: <single deliverable>
Inputs: <spec/log/context files>
Constraints: small reversible edits, no unrelated files
Artifacts required: unified diff + verify output + rollback command
Verify: bun run build && bun run test:all
Rollback: git restore --worktree --staged <files>
```

## Review Diffs Before Apply/Merge
Run from repo root:
```bash
git status -sb
git diff -- skills/codex_macos
git diff --stat
```

For targeted review:
```bash
git diff -- skills/codex_macos/05_SKILLS_LIBRARY.md
git diff -- skills/codex_macos/06_TRICKS_LIBRARY.md
```

## Run Verify (From Repo Root)
Primary verify path:
```bash
bun run build && bun run test
```

End-to-end (E2E) verify path:
```bash
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

See `03_CHECKS.md` for expected outcomes and manual fallback validation.

## Rollback via Git
Quick file rollback:
```bash
git restore --worktree --staged skills/codex_macos/<file>.md
```

Rollback all toolkit files:
```bash
git restore --worktree --staged skills/codex_macos
```

Soft full-repo rollback to last commit state:
```bash
git reset --merge
```

Detailed scenarios are in `08_ROLLBACK.md`.
