# Codex (macOS App) — 20 Extremely Useful Skills

Each skill below is expanded into a Codex-executable playbook.

## 1. Spec-First Generation
- What it is: Write implementation specs before code changes.
- When to use it: New features, high-risk refactors, ambiguous requirements.
- How to invoke it inside Codex (task/thread/agent pattern): Create a planning thread named `spec/<feature>`, ask agent to produce `<feature>_SPEC.md`, and block coding threads until approved.
- Expected artifacts: spec markdown file, assumptions list, acceptance criteria.
- Verification step: Confirm spec maps to requested scope and has explicit verify/rollback commands.

## 2. The Verification Loop
- What it is: Enforce verify commands after every meaningful patch chunk.
- When to use it: Multi-file edits or bugfixes with regression risk.
- How to invoke it inside Codex (task/thread/agent pattern): In each implementation thread, include `Do not continue if verify fails` and require command output per chunk.
- Expected artifacts: terminal logs for `bun run build && bun run test:all`, failure snippets when broken.
- Verification step: Exit code is zero for the required verify command.

## 3. Rubber Duck Debugging
- What it is: Structured explanation of control flow before proposing a fix.
- When to use it: Bugs with unclear root cause.
- How to invoke it inside Codex (task/thread/agent pattern): Create a diagnostics thread with `Explain only, no edits`, then open separate fix thread after root cause is clear.
- Expected artifacts: root-cause narrative, call path summary, suspect files list.
- Verification step: Human can map explanation to concrete failing behavior.

## 4. Sandbox Refactoring
- What it is: Isolate logic into temporary files for safe experimentation.
- When to use it: Extracting complex parsers, transformers, pure functions.
- How to invoke it inside Codex (task/thread/agent pattern): Use a sandbox thread that writes prototypes under temporary paths, then port approved logic into repo files.
- Expected artifacts: temp prototype file, before/after function signatures, final minimal diff.
- Verification step: Prototype behavior matches expectations and final repo build passes.

## 5. Automated Boilerplate Scaffolding
- What it is: Generate consistent module skeletons quickly.
- When to use it: New component/page/service creation.
- How to invoke it inside Codex (task/thread/agent pattern): Create a scaffolding thread, specify directory/file contract, then run verify before filling business logic.
- Expected artifacts: new file tree, stub exports, baseline tests.
- Verification step: Repo builds and imports resolve without runtime errors.

## 6. Dependency Impact Analysis
- What it is: Audit call sites and behavior before dependency changes.
- When to use it: Upgrades, deprecations, security patches.
- How to invoke it inside Codex (task/thread/agent pattern): Create an analysis thread to enumerate usage paths and breakage risks, then a separate upgrade thread.
- Expected artifacts: impacted files table, risk notes, migration checklist.
- Verification step: Every impacted path has test or manual validation coverage.

## 7. Contract-Based Mocks
- What it is: Generate mocks aligned to declared type/interface contracts.
- When to use it: Frontend-first development and test bootstrapping.
- How to invoke it inside Codex (task/thread/agent pattern): In a testing thread, request mocks generated directly from interfaces and require strict type checks.
- Expected artifacts: mock data files, fixture factories, test updates.
- Verification step: Type checks/tests pass with generated mocks.

## 8. Context Window Optimization
- What it is: Periodically compress session state into durable artifacts.
- When to use it: Long-running threads that risk context drift.
- How to invoke it inside Codex (task/thread/agent pattern): End a long thread with `Summarize state into STATE.md`, then start next thread with that file as input.
- Expected artifacts: `STATE.md`, pending tasks list, known blockers.
- Verification step: New thread can continue work without re-deriving old context.

## 9. Step-by-Step Security Audit
- What it is: Focused code security review against explicit attack classes.
- When to use it: Auth changes, input parsing, sensitive data paths.
- How to invoke it inside Codex (task/thread/agent pattern): Create a security-review thread with fixed checklist categories and require finding severity levels.
- Expected artifacts: findings list, affected lines, mitigation recommendations.
- Verification step: High and medium findings are resolved or accepted with rationale.

## 10. The Rollback Marker
- What it is: Establish recovery point before risky work.
- When to use it: Large refactor or sweeping replacements.
- How to invoke it inside Codex (task/thread/agent pattern): First thread creates/records rollback point (branch, tag, or clean commit hash), second thread executes changes.
- Expected artifacts: rollback command, marker hash, pre-change status snapshot.
- Verification step: Team can restore prior state in one command.

## 11. Minimal Diff Generation
- What it is: Constrain edits to smallest line footprint.
- When to use it: Large legacy files and surgical bug fixes.
- How to invoke it inside Codex (task/thread/agent pattern): Implementation thread includes `touch only targeted lines` and mandates diff review after each patch.
- Expected artifacts: compact unified diff, unchanged surrounding behavior.
- Verification step: `git diff --stat` remains tightly scoped and verify passes.

## 12. Cross-File Structural Renaming
- What it is: Safe semantic rename across code boundaries.
- When to use it: Domain model terminology updates.
- How to invoke it inside Codex (task/thread/agent pattern): Run search-only thread first, then rename thread with strict path scope and verify gate.
- Expected artifacts: path inventory, rename diff, migration note.
- Verification step: Build/test pass and no stale identifier remains in scoped paths.

## 13. Shadow Pull Request Review
- What it is: Pre-merge review from a critical reviewer persona.
- When to use it: Before commit or pull request (PR) handoff.
- How to invoke it inside Codex (task/thread/agent pattern): Open review-only thread and request findings first, severity-ordered, with file references.
- Expected artifacts: finding list, risk summary, follow-up patches.
- Verification step: All high-severity findings are fixed or explicitly deferred.

## 14. Artifact-Driven User Interface (UI)
- What it is: Produce standalone artifacts to validate user interface behavior outside app runtime.
- When to use it: Rapid visual checks, isolated layout debugging.
- How to invoke it inside Codex (task/thread/agent pattern): Create preview thread to generate standalone HTML/CSS demo, then port validated changes.
- Expected artifacts: preview file, screenshot, applied code diff.
- Verification step: Visual output matches target behavior and integrated build passes.

## 15. Defensive Programming Prompts
- What it is: Force explicit guardrails in unsafe or external-input code.
- When to use it: API parsing, file input, third-party payload handling.
- How to invoke it inside Codex (task/thread/agent pattern): In implementation thread, require explicit null/shape checks and clear error paths.
- Expected artifacts: added guards, error messages, tests for bad inputs.
- Verification step: Negative-path tests confirm controlled failure behavior.

## 16. Log-Driven Execution Tracker
- What it is: Temporary instrumentation to expose runtime path.
- When to use it: Non-deterministic failures or silent runtime exits.
- How to invoke it inside Codex (task/thread/agent pattern): Create instrumentation thread to insert trace logs, then cleanup thread to remove logs after diagnosis.
- Expected artifacts: trace output, pinpointed failing stage, cleanup commit.
- Verification step: Root cause is reproduced and logs are removed after fix.

## 17. The "Assume Nothing" Prompt
- What it is: Force agent to enumerate assumptions before coding.
- When to use it: Repeated failed attempts or underspecified inputs.
- How to invoke it inside Codex (task/thread/agent pattern): Start assumptions thread first; approve/correct assumptions; then launch implementation thread.
- Expected artifacts: explicit assumptions list, clarified requirements delta.
- Verification step: Implementation references approved assumptions only.

## 18. Walkthrough Proof-of-Work
- What it is: Document how the delivered solution works.
- When to use it: Complex architecture or handoff to another engineer.
- How to invoke it inside Codex (task/thread/agent pattern): Finalization thread asks for `walkthrough.md` or equivalent summary tied to changed files.
- Expected artifacts: walkthrough document, architecture notes, known limits.
- Verification step: Another engineer can reproduce reasoning and validate behavior.

## 19. Reverse Engineering Legacy Code
- What it is: Translate opaque legacy logic into understandable explanations.
- When to use it: Touching undocumented modules.
- How to invoke it inside Codex (task/thread/agent pattern): Analysis thread explains behavior and invariants first, implementation thread changes code second.
- Expected artifacts: annotated explanation, risk map, targeted refactor diff.
- Verification step: Behavior remains stable under existing tests and spot checks.

## 20. Automated End-to-End (E2E) Test Generation
- What it is: Generate end-to-end coverage from component behavior.
- When to use it: Adding features without existing high-level tests.
- How to invoke it inside Codex (task/thread/agent pattern): Test-first thread generates failing E2E tests, implementation thread makes them pass.
- Expected artifacts: new Playwright tests, test logs, pass report.
- Verification step: `bun run test:e2e` passes for new and existing suites.
