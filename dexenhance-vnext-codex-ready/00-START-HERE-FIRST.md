# START HERE FIRST

This package is ordered for **GPT Codex on macOS**.

## Read in this exact order

1. `00-START-HERE-FIRST.md`
2. `01-ASSUMPTIONS.md`
3. `02-MERGED-IMPLEMENTATION-BLUEPRINT.md`
4. `03-FILE-TREE-AND-MODULE-CONTRACTS.md`
5. `04-CODEX-EXECUTION-PROMPT.md`
6. `05-FEATURE-VISIBILITY-MATRIX-AND-UAT.md`

## What to give Codex first

Give Codex these files together:

- `04-CODEX-EXECUTION-PROMPT.md`
- `02-MERGED-IMPLEMENTATION-BLUEPRINT.md`
- `03-FILE-TREE-AND-MODULE-CONTRACTS.md`
- `05-FEATURE-VISIBILITY-MATRIX-AND-UAT.md`
- `01-ASSUMPTIONS.md`

## What this package is

This is **not** a replacement demo app.
It is a continuation handoff for the **existing DexEnhance repo**.

It is designed so Codex can:

- preserve the working MV3 extension architecture
- preserve Bun + Vite multi-config build behavior
- preserve Preact + Shadow DOM runtime behavior
- preserve `chrome.storage.local` as the persistent source of truth
- preserve the logo-first welcome flow and visible branding
- make every listed feature both **functional** and **visibly reachable**

## Non-negotiable outcome

Codex should not stop when the build passes.
Codex should stop only when:

- the extension still builds and loads
- each feature is visible and reachable
- each feature works end to end
- the UAT checklist in `05-FEATURE-VISIBILITY-MATRIX-AND-UAT.md` is green

## Final instruction

Have Codex implement **inside the existing repo on macOS**.
Do not let it create a separate greenfield project.
