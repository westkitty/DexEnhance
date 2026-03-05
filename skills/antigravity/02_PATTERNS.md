# Code Patterns

1. **Single Source of Truth**: The active repo state is the source of truth. Do not invent requirements.
2. **Small Commits / Chunks**: Never make massive unverified changes. Change a single component, verify it, then move on.
3. **No Phantom Dependencies**: Only use what is declared in `package.json` or `bun.lock`. If a new dependency is needed, get user approval.
4. **Repeatable Verification**: Always ensure that there is a way to automatically or manually verify the component just built.
