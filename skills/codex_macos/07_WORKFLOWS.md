# Codex macOS Workflows

## 1. Task Batching Workflow
### Inputs
- feature or bug specification
- current repository state (`git status -sb`)
- verification command set from `03_CHECKS.md`

### Procedure
1. Split work into mergeable chunks (one chunk per Codex task thread).
2. Define each chunk with bounded files, artifacts, verify command, and rollback command.
3. Execute chunks sequentially: plan -> patch -> verify -> summarize.
4. Merge only verified chunks; carry unresolved items to next thread.

### Output artifacts
- chunk checklist
- per-chunk `git diff`
- verify logs
- short pull request (PR) summary

### Verify step
Run from repo root after each chunk:
```bash
bun run build && bun run test
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

### Rollback step
```bash
git restore --worktree --staged <chunk-files>
```

## 2. Worktree Isolation Workflow
### Inputs
- task identifier and branch name
- baseline branch (for example `main`)
- required verify commands

### Procedure
1. Create isolated branch and worktree for the task.
2. Run all edits and verification inside the isolated worktree.
3. Produce branch-local artifacts and commit history.
4. Merge only after artifact gate and verify gate pass.

### Output artifacts
- isolated worktree path
- task-specific branch commit(s)
- verify logs from isolated environment

### Verify step
Inside the worktree root:
```bash
bun run build && bun run test
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

### Rollback step
```bash
git worktree remove ../DexEnhance-<task-name>
git branch -D codex/<task-name>
```

## 3. Spec-to-Pull-Request (PR) Pipeline Workflow
### Inputs
- approved specification markdown
- acceptance criteria
- test plan

### Procedure
1. Draft and approve spec.
2. Implement only what spec describes.
3. Run automated verify path.
4. Prepare PR summary: scope, tests, risks, rollback.

### Output artifacts
- approved spec document
- implementation diff
- verify logs
- pull request summary with risk notes

### Verify step
```bash
bun run build && bun run test
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

### Rollback step
```bash
git restore --worktree --staged <spec-related-files>
```

## 4. Multi-Agent Competition Workflow
### Inputs
- one shared problem statement
- objective scoring criteria (correctness, diff size, verify success)
- same baseline branch for all contenders

### Procedure
1. Create one branch or worktree per contender approach.
2. Ask each agent thread to produce an independent solution with identical constraints.
3. Score outputs by objective gate checks.
4. Merge the winning approach; archive runner-up branches/worktrees.

### Output artifacts
- competing diffs
- per-approach verify logs
- scoring table
- selected winner rationale

### Verify step
For each contender:
```bash
bun run build && bun run test
bunx --bun vite preview --port 5179 >/tmp/dexenhance-preview.log 2>&1 &
PREVIEW_PID=$!
bun run test:e2e
kill "$PREVIEW_PID"
```

### Rollback step
```bash
git branch -D codex/<losing-approach>
git worktree remove ../DexEnhance-<losing-approach>
```
