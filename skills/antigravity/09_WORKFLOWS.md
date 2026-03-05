# Anti-Gravity Specific Operational Guidance

### 1. Agent Swarm Debugging
**Concept:** Use the prompt to split responsibility between two virtual agents (or real agent instances).
**Flow:**
1. Agent 1 (The Explorer): Uses `grep_search` and `run_command` to find all error logs, outputs them to `/tmp/logs.txt`.
2. Agent 2 (The Analyst): Reads `/tmp/logs.txt` and drafts a fix in `implementation_plan.md`.
**Artifact Gate:** Wait for human approval of the fix plan before any patching begins.

### 2. Spec-First Coding
**Concept:** Never code without a blueprint.
**Flow:** 
1. Gather requirements.
2. Draft `[Feature]_SPEC.md`.
3. Stop and block on human approval.
4. Implement strictly to the spec.
**Verification:** Does the implementation precisely cover what is written in `[Feature]_SPEC.md` and nothing more?

### 3. Agent Critique Loops
**Concept:** Self-hosting a Red Team against the agent's own code.
**Flow:**
1. Writer Agent generates `auth.js`.
2. Prompt Writer: "Now act as a hostile security reviewer. Find exactly 3 flaws in the code you just wrote."
3. Red Team Agent identifies flaws.
4. Writer Agent patches them.
**Gate:** The review must uncover actionable issues.

### 4. Continuous Agent Supervision
**Concept:** Long-running tasks require guardrails to stop hallucination cascades.
**Flow:**
1. Before a multi-file refactor, the agent generates a `task.md` checklist.
2. After touching *every single file*, the agent natively executes `bun run build`.
3. If the command fails, the agent immediately halts and invokes the rollback marker (from `05_ROLLBACK.md`) or notifies the user to fix the error.
**Gate:** Halts execution completely when `exit != 0`.
