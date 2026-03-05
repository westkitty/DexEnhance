# Codex macOS Rollback Guide

## Scope
Rollback instructions for file-level, branch-level, and worktree-level recovery.

## File-Level Rollback
Revert specific files:
```bash
git restore --worktree --staged skills/codex_macos/<file>.md
```

Revert all toolkit files:
```bash
git restore --worktree --staged skills/codex_macos
```

## Commit-Level Rollback (Local, Not Pushed)
Undo last commit but keep changes unstaged:
```bash
git reset --mixed HEAD~1
```

Undo last commit and keep staged:
```bash
git reset --soft HEAD~1
```

## Branch-Level Rollback
Switch back to stable branch:
```bash
git checkout <stable-branch>
```

Delete failed feature branch:
```bash
git branch -D codex/<task-name>
```

## Worktree Rollback
List worktrees:
```bash
git worktree list
```

Remove failed worktree:
```bash
git worktree remove ../DexEnhance-<task-name>
```

Delete associated branch:
```bash
git branch -D codex/<task-name>
```

## Emergency Recovery
Find recoverable commits:
```bash
git reflog
```

Create rescue branch from reflog entry:
```bash
git checkout -b codex/rescue-<date> <reflog-hash>
```

## Rollback Proof Checklist
Before resuming work, confirm:
1. `git status -sb` is clean or intentionally scoped.
2. `bun run build` passes.
3. Any removed worktree path no longer appears in `git worktree list`.
