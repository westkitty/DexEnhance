# Codex macOS Requirements Board

| Requirement | Files | Verification | Status |
|---|---|---|---|
| Deliverable file: 00_RUNBOOK.md exists and documents repo-root/open-thread/diff/verify/rollback flow | `skills/codex_macos/00_RUNBOOK.md` | `rg -n "Open the Correct Folder|new task thread|Run Verify|Rollback" skills/codex_macos/00_RUNBOOK.md` | Done |
| Deliverable file: 01_TASK_TEMPLATES.md exists | `skills/codex_macos/01_TASK_TEMPLATES.md` | `test -f skills/codex_macos/01_TASK_TEMPLATES.md` | Done |
| Deliverable file: 02_GIT_WORKFLOW.md exists and covers branch/worktree safety | `skills/codex_macos/02_GIT_WORKFLOW.md` | `rg -n "worktree|branches|Artifact Gate" skills/codex_macos/02_GIT_WORKFLOW.md` | Done |
| Deliverable file: 03_CHECKS.md exists and documents verify path from repo root | `skills/codex_macos/03_CHECKS.md` | `rg -n "bun run build && bun run test|port 5179|Root path" skills/codex_macos/03_CHECKS.md` | Done |
| Deliverable file: 04_REQUIREMENTS_BOARD.md exists with required columns | `skills/codex_macos/04_REQUIREMENTS_BOARD.md` | table header contains `[Requirement] [Files] [Verification] [Status]` equivalents | Done |
| Deliverable file: 05_SKILLS_LIBRARY.md exists with 20 skills | `skills/codex_macos/05_SKILLS_LIBRARY.md` | `rg -n "^## [0-9]+\. " skills/codex_macos/05_SKILLS_LIBRARY.md | wc -l` equals `20` | Done |
| Deliverable file: 06_TRICKS_LIBRARY.md exists with 20 tricks | `skills/codex_macos/06_TRICKS_LIBRARY.md` | `rg -n "^## [0-9]+\. " skills/codex_macos/06_TRICKS_LIBRARY.md | wc -l` equals `20` | Done |
| Deliverable file: 07_WORKFLOWS.md exists with required 4 workflows | `skills/codex_macos/07_WORKFLOWS.md` | `rg -n "Task Batching|Worktree Isolation|Spec-to-Pull-Request|Multi-Agent Competition" skills/codex_macos/07_WORKFLOWS.md` | Done |
| Deliverable file: 08_ROLLBACK.md exists | `skills/codex_macos/08_ROLLBACK.md` | `test -f skills/codex_macos/08_ROLLBACK.md` | Done |
| Skill 1: Spec-First Generation expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 1. Spec-First Generation` has all five required bullets | Done |
| Skill 2: The Verification Loop expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 2. The Verification Loop` has all five required bullets | Done |
| Skill 3: Rubber Duck Debugging expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 3. Rubber Duck Debugging` has all five required bullets | Done |
| Skill 4: Sandbox Refactoring expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 4. Sandbox Refactoring` has all five required bullets | Done |
| Skill 5: Automated Boilerplate Scaffolding expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 5. Automated Boilerplate Scaffolding` has all five required bullets | Done |
| Skill 6: Dependency Impact Analysis expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 6. Dependency Impact Analysis` has all five required bullets | Done |
| Skill 7: Contract-Based Mocks expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 7. Contract-Based Mocks` has all five required bullets | Done |
| Skill 8: Context Window Optimization expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 8. Context Window Optimization` has all five required bullets | Done |
| Skill 9: Step-by-Step Security Audit expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 9. Step-by-Step Security Audit` has all five required bullets | Done |
| Skill 10: The Rollback Marker expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 10. The Rollback Marker` has all five required bullets | Done |
| Skill 11: Minimal Diff Generation expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 11. Minimal Diff Generation` has all five required bullets | Done |
| Skill 12: Cross-File Structural Renaming expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 12. Cross-File Structural Renaming` has all five required bullets | Done |
| Skill 13: Shadow PR Review expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 13. Shadow Pull Request Review` has all five required bullets | Done |
| Skill 14: Artifact-Driven UI expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 14. Artifact-Driven User Interface (UI)` has all five required bullets | Done |
| Skill 15: Defensive Programming Prompts expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 15. Defensive Programming Prompts` has all five required bullets | Done |
| Skill 16: Log-Driven Execution Tracker expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 16. Log-Driven Execution Tracker` has all five required bullets | Done |
| Skill 17: The "Assume Nothing" Prompt expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 17. The "Assume Nothing" Prompt` has all five required bullets | Done |
| Skill 18: Walkthrough Proof-of-Work expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 18. Walkthrough Proof-of-Work` has all five required bullets | Done |
| Skill 19: Reverse Engineering Legacy Code expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 19. Reverse Engineering Legacy Code` has all five required bullets | Done |
| Skill 20: Automated E2E Test Generation expanded with required fields | `skills/codex_macos/05_SKILLS_LIBRARY.md` | Verify section `## 20. Automated End-to-End (E2E) Test Generation` has all five required bullets | Done |
| Trick 1: Multi-Prompt Chaining expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 1. Multi-Prompt Chaining` has setup/isolation/gate/failure+recovery | Done |
| Trick 2: Context Steering via Artifacts expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 2. Context Steering via Artifacts` has setup/isolation/gate/failure+recovery | Done |
| Trick 3: Shell Exit Code Polling expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 3. Shell Exit Code Polling` has setup/isolation/gate/failure+recovery | Done |
| Trick 4: Semantic Search Ping-Pong expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 4. Semantic Search Ping-Pong` has setup/isolation/gate/failure+recovery | Done |
| Trick 5: Role-Playing Experts expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 5. Role-Playing Experts` has setup/isolation/gate/failure+recovery | Done |
| Trick 6: The "Verify Loop" Protocol expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 6. The "Verify Loop" Protocol` has setup/isolation/gate/failure+recovery | Done |
| Trick 7: Temporary Logging Shims expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 7. Temporary Logging Shims` has setup/isolation/gate/failure+recovery | Done |
| Trick 8: Regex Code Sweeps expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 8. Regex Code Sweeps` has setup/isolation/gate/failure+recovery | Done |
| Trick 9: Markdown Dependency Trees expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 9. Markdown Dependency Trees` has setup/isolation/gate/failure+recovery | Done |
| Trick 10: Spec-to-Test-to-Code expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 10. Spec-to-Test-to-Code` has setup/isolation/gate/failure+recovery | Done |
| Trick 11: Silent Patching expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 11. Silent Patching` has setup/isolation/gate/failure+recovery | Done |
| Trick 12: The "No Code, Just Logic" Prompt expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 12. The "No Code, Just Logic" Prompt` has setup/isolation/gate/failure+recovery | Done |
| Trick 13: State Snapshots expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 13. State Snapshots` has setup/isolation/gate/failure+recovery | Done |
| Trick 14: Incremental Adoption expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 14. Incremental Adoption` has setup/isolation/gate/failure+recovery | Done |
| Trick 15: The "Why?" Chain expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 15. The "Why?" Chain` has setup/isolation/gate/failure+recovery | Done |
| Trick 16: Fast-Forward Git Bisecting expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 16. Fast-Forward Git Bisecting` has setup/isolation/gate/failure+recovery | Done |
| Trick 17: Hardened Sandboxing expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 17. Hardened Sandboxing` has setup/isolation/gate/failure+recovery | Done |
| Trick 18: Explaining the Undocumented expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 18. Explaining the Undocumented` has setup/isolation/gate/failure+recovery | Done |
| Trick 19: Automated Readme Generation expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 19. Automated Readme Generation` has setup/isolation/gate/failure+recovery | Done |
| Trick 20: Project Bible Extraction expanded with required fields | `skills/codex_macos/06_TRICKS_LIBRARY.md` | Verify section `## 20. Project Bible Extraction` has setup/isolation/gate/failure+recovery | Done |
