# Codex (macOS App) — 20 Power-User Tricks

Each trick is codified as a repeatable workflow with setup, isolation strategy, gate, and recovery.

## 1. Multi-Prompt Chaining
- Setup steps: Define Prompt A/B/C outputs in advance; require each prompt to write a file artifact consumed by the next prompt.
- When to use worktrees vs branches: Use a branch for a linear single-feature chain; use a worktree when two chains run in parallel.
- Artifact gate: `STATE.md` plus per-step output files must exist before advancing.
- Failure modes + recovery: Chain drift or missing handoff artifacts; recover by regenerating the missing artifact and restarting from last valid step.

## 2. Context Steering via Artifacts
- Setup steps: Replace long chat context with maintained `spec.md`, `STATE.md`, and checklist files.
- When to use worktrees vs branches: Branch for single-stream context control; worktree for competing implementation approaches.
- Artifact gate: Latest artifact revision timestamp and explicit unresolved items section.
- Failure modes + recovery: Important details dropped during summarization; recover using git history on artifact files and reintroduce omitted constraints.

## 3. Shell Exit Code Polling
- Setup steps: Require command blocks with explicit stop-on-failure behavior.
- When to use worktrees vs branches: Branch for routine checks; worktree for unstable experiments likely to fail often.
- Artifact gate: Command log includes success or failure exit code and next action.
- Failure modes + recovery: Agent continues after failure; recover by enforcing a hard rule: no further edits until failing command is fixed.

## 4. Semantic Search Ping-Pong
- Setup steps: Alternate broad and narrow searches to converge on exact code locations.
- When to use worktrees vs branches: Branch for ordinary bug triage; worktree for deep repository archaeology that may diverge from current task.
- Artifact gate: Confirmed file/line hit list and updated hypothesis.
- Failure modes + recovery: False negatives from narrow search; recover by widening search scope and validating with secondary patterns.

## 5. Role-Playing Experts
- Setup steps: Assign explicit review persona (security, performance, architecture) with concrete output format.
- When to use worktrees vs branches: Branch when review leads to small patches; worktree when review can trigger large redesign.
- Artifact gate: Findings list with severity and file references.
- Failure modes + recovery: Generic advice without actionable detail; recover by requiring minimum finding count and concrete remediation steps.

## 6. The "Verify Loop" Protocol
- Setup steps: Insert verify gate after each patch block in prompt instructions.
- When to use worktrees vs branches: Branch for incremental tasks; worktree when repeated verify failures could destabilize main branch.
- Artifact gate: Latest verify command output with pass status.
- Failure modes + recovery: Verify skipped or deferred; recover by rejecting merge until verify output is attached.

## 7. Temporary Logging Shims
- Setup steps: Add scoped trace wrappers around suspect paths and timestamp outputs.
- When to use worktrees vs branches: Branch for short-lived tracing; worktree for invasive instrumentation that touches many files.
- Artifact gate: Trace log proving problematic path and follow-up cleanup diff.
- Failure modes + recovery: Instrumentation changes behavior or remains in production code; recover by isolating shim behind flags and removing before merge.

## 8. Regex Code Sweeps
- Setup steps: Preview match set, perform constrained replacements, run build/test immediately.
- When to use worktrees vs branches: Branch for small targeted sweeps; worktree for broad renames across modules.
- Artifact gate: `git diff --stat` and sample diff inspection.
- Failure modes + recovery: Overmatching and syntax breakage; recover by restoring affected files and rerunning with tighter expression.

## 9. Markdown Dependency Trees
- Setup steps: Generate a markdown or mermaid dependency graph from key modules.
- When to use worktrees vs branches: Branch when graph informs immediate patch; worktree when exploration is substantial and separate from delivery.
- Artifact gate: Renderable dependency diagram committed or attached.
- Failure modes + recovery: Invalid graph syntax or outdated links; recover by validating graph output and regenerating from current sources.

## 10. Spec-to-Test-to-Code
- Setup steps: Write spec, then failing tests, then implementation.
- When to use worktrees vs branches: Branch for routine feature work; worktree for parallel solution strategies to same spec.
- Artifact gate: spec file, failing test evidence, passing test evidence.
- Failure modes + recovery: Implementation precedes tests; recover by rolling back code to pre-implementation point and reinstating sequence.

## 11. Silent Patching
- Setup steps: Apply scripted config edits with strict syntax validation after each change.
- When to use worktrees vs branches: Branch for trusted scriptable edits; worktree for high-risk config changes across environments.
- Artifact gate: Clean parsed configuration and minimal diff.
- Failure modes + recovery: Broken syntax or hidden key drift; recover by validating parser output and restoring from git if malformed.

## 12. The "No Code, Just Logic" Prompt
- Setup steps: Ask for algorithms, state machines, or decision trees without code.
- When to use worktrees vs branches: Branch when logic output directly guides nearby edits; worktree when exploring multiple competing designs.
- Artifact gate: logic artifact file approved before coding begins.
- Failure modes + recovery: Agent emits code anyway; recover by rejecting output and reiterating logic-only constraint.

## 13. State Snapshots
- Setup steps: Capture working state before risky commands using commit, branch, or archive.
- When to use worktrees vs branches: Branch for light rollback needs; worktree for heavy experiments requiring disposable environments.
- Artifact gate: Snapshot identifier (commit hash/tag/archive path) recorded in thread.
- Failure modes + recovery: Snapshot incomplete (missing untracked files); recover by adding explicit untracked capture and re-snapshotting.

## 14. Incremental Adoption
- Setup steps: Adopt new tech one bounded slice at a time with narrow scope.
- When to use worktrees vs branches: Branch for one-file or one-module migrations; worktree for parallel migration spikes.
- Artifact gate: migration checklist with completed slice and verify result.
- Failure modes + recovery: Scope creep into repo-wide migration; recover by reverting unrelated files and re-scoping.

## 15. The "Why?" Chain
- Setup steps: Require explicit rationale for key architectural decisions.
- When to use worktrees vs branches: Branch for simple decision records; worktree when alternatives are implemented and benchmarked.
- Artifact gate: decision log with trade-offs and selected option.
- Failure modes + recovery: Hand-wavy justifications; recover by demanding measurable criteria and alternatives.

## 16. Fast-Forward Git Bisecting
- Setup steps: Use automated test command to binary-search failing commit range.
- When to use worktrees vs branches: Branch for local bisect in current line; worktree when bisecting while active development continues elsewhere.
- Artifact gate: identified first bad commit hash and reproduction command.
- Failure modes + recovery: Flaky tests produce false culprit; recover by rerunning candidate commits multiple times.

## 17. Hardened Sandboxing
- Setup steps: Run untrusted or heavy experiments in isolated containers or separate worktrees.
- When to use worktrees vs branches: Branch for low-risk local experimentation; worktree plus container for strict isolation.
- Artifact gate: clean sandbox run log and exported result artifact.
- Failure modes + recovery: Environment mismatch or missing dependencies; recover by pinning environment versions and rerunning.

## 18. Explaining the Undocumented
- Setup steps: Feed opaque code and request behavior summary plus invariants.
- When to use worktrees vs branches: Branch when explanation drives direct fix; worktree when reverse engineering spans unrelated subsystems.
- Artifact gate: explanation document with references to source files.
- Failure modes + recovery: Incorrect interpretation; recover by adding runtime traces/tests to validate assumptions.

## 19. Automated Readme Generation
- Setup steps: Gather module structure and commands, then generate/update `README.md`.
- When to use worktrees vs branches: Branch for small documentation refresh; worktree when documentation overhaul is broad.
- Artifact gate: README diff including setup, run, verify, and rollback sections.
- Failure modes + recovery: Stale or inaccurate docs; recover by cross-checking each command in terminal and patching inaccuracies.

## 20. Project Bible Extraction
- Setup steps: Consolidate architecture decisions, conventions, and workflows into a single canonical document.
- When to use worktrees vs branches: Branch for incremental updates; worktree when rebuilding documentation architecture from scratch.
- Artifact gate: comprehensive `BIBLE.md` update with dated decision entries.
- Failure modes + recovery: Missing critical context or contradictions; recover with targeted interviews of source files and changelog-backed corrections.
