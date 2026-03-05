# Codex macOS Task Templates

## Template A: Plan-Only Thread
```text
Goal: Produce implementation plan only.
Inputs: <spec/logs/design>
Constraints: no code edits
Output: implementation_plan.md with risks/assumptions/verify plan
Done when: plan reviewed and approved
```

## Template B: Single-Chunk Implementation Thread
```text
Goal: Implement <one small change>.
Inputs: <plan section + exact files>
Constraints: touch only listed files, keep diff minimal
Output artifacts: code diff + test output + summary
Verify: bun run build && bun run test:all
Rollback: git restore --worktree --staged <touched files>
```

## Template C: Verification Thread
```text
Goal: Validate existing implementation.
Inputs: changed files + expected behavior
Constraints: no refactors unless bug is proven
Output artifacts: pass/fail report + repro steps + command output
Verify commands: bun run build; bun run test; bun run test:e2e
Rollback: not applicable unless fixes were applied
```

## Template D: Review Thread (Shadow Pull Request)
```text
Goal: Review uncommitted diff as senior reviewer.
Inputs: git diff + intent of change
Constraints: findings first, ordered by severity
Output artifacts: issue list with file references
Verify: map each issue to concrete command/test
Rollback: patch-by-patch restore if needed
```

## Template E: Worktree Task Thread
```text
Goal: Execute isolated task in separate worktree.
Inputs: branch name + target files
Constraints: no edits in main worktree
Output artifacts: isolated commit(s) + verify logs + merge plan
Verify: run full verify inside worktree
Rollback: remove worktree and delete branch
```
