# Antigravity Workflow Contract

Every agent interaction inside this repository MUST follow this sequence:

1. **Plan**: Understand the goal, read the source of truth, and formulate a plan (e.g., in `implementation_plan.md` or a local temporary file). If the change is significant, block on user approval.
2. **Patch**: Apply changes in small, incremental, and reversible chunks. Stop if the repo enters a broken state.
3. **Verify**: Prove the change worked. Run `bun run build && bun run test:all` or the appropriate script defined in `01_CHECKS.md`.
4. **Summarize**: Report the outcome (pass/fail, what was touched, rollback instructions).
