# Artifact Gates

Certain phases of work are blocked until specific artifacts are produced:

- **Before Execution**: `implementation_plan.md` MUST exist and be approved by the user for any non-trivial task.
- **Before Completion**: The verification command (`bun run build && bun run test:all`) MUST pass and be proven to pass in the conversation.
- **After Completion**: `walkthrough.md` SHOULD exist to summarize the work done and prove it with screenshots/logs, especially for UI or architectural changes.
