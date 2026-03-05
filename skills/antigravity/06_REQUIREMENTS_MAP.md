# Requirements Map

This map enumerates every deliverable file, tracking its location, verification method, and implementation status.

## Core Files
- `00_WORKFLOW_CONTRACT.md`
  - Location: `/skills/antigravity/00_WORKFLOW_CONTRACT.md`
  - Verification: `bun test` passes (no breakage) + user review.
  - Status: Done
- `01_CHECKS.md`
  - Location: `/skills/antigravity/01_CHECKS.md`
  - Verification: Exists and accurately details `bun run build` and `bun run test:all`.
  - Status: Done
- `02_PATTERNS.md`
  - Location: `/skills/antigravity/02_PATTERNS.md`
  - Verification: Exists.
  - Status: Done
- `03_TASK_TEMPLATES.md`
  - Location: `/skills/antigravity/03_TASK_TEMPLATES.md`
  - Verification: Exists.
  - Status: Done
- `04_ARTIFACT_GATES.md`
  - Location: `/skills/antigravity/04_ARTIFACT_GATES.md`
  - Verification: Exists.
  - Status: Done
- `05_ROLLBACK.md`
  - Location: `/skills/antigravity/05_ROLLBACK.md`
  - Verification: Exists and details clean git and bun commands.
  - Status: Done
- `06_REQUIREMENTS_MAP.md`
  - Location: `/skills/antigravity/06_REQUIREMENTS_MAP.md`
  - Verification: Exists.
  - Status: Done

## Expanded Playbooks
- 20 Skills Playbooks
  - Location: `/skills/antigravity/07_SKILLS_LIBRARY.md`
  - Verification: File contains 20 playbooks with "What it is", "When to use", "Prompt", "Artifact", and "Verification".
  - Status: Done

- 20 Power-User Tricks Playbooks
  - Location: `/skills/antigravity/08_TRICKS_LIBRARY.md`
  - Verification: File contains 20 workflow tricks with Setup, Gate, and Failure Modes.
  - Status: Done

- Operational Guidance Workflows
  - Location: `/skills/antigravity/09_WORKFLOWS.md`
  - Verification: File contains "Agent swarm", "Spec-first", "Critique loops", and "Supervision" playbooks.
  - Status: Done
