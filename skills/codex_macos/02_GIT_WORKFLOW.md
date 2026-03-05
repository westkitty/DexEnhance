# Codex macOS Git Workflow

## Objectives
- Keep parallel agent work isolated.
- Keep every chunk reversible.
- Merge only after artifact and verification gates pass.

## Branch Naming
Use `codex/` prefix for all new branches:
- `codex/<ticket>-<short-slug>`
- Example: `codex/skills-toolkit-phase4`

## When to Use Branches vs Worktrees
Use a branch when:
- change is small
- only one active stream of work
- same developer context is sufficient

Use a worktree when:
- two or more tasks run in parallel
- risky refactor should be isolated from hotfix work
- you want independent verify loops per task

## Safe Parallel Workflow (Recommended)
1. Create branch:
```bash
git checkout -b codex/<task-name>
```
2. For parallel work, create worktree:
```bash
git worktree add ../DexEnhance-<task-name> -b codex/<task-name>
```
3. Run implementation + verify only inside that branch/worktree.
4. Commit with scoped message:
```bash
git add <files>
git commit -m "docs(skills): <scope>"
```
5. Merge only if artifact gate and verify gate both pass.

## Artifact Gate Before Merge
Required outputs:
- focused `git diff`
- verification command output
- changed-file summary
- rollback command for touched files

## Merge Decision Rules
Merge only when all are true:
1. `bun run build && bun run test:all` passes in the branch/worktree.
2. No unrelated file churn in `git diff --stat`.
3. Requirements board entries are updated to Done.

## Cleanup
After merge:
```bash
git worktree list
git worktree remove ../DexEnhance-<task-name>
git branch -d codex/<task-name>
```

If branch is not merged but must be removed:
```bash
git branch -D codex/<task-name>
```
Use force delete only when changes are intentionally discarded.
