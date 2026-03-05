# Antigravity — 20 Power-User Tricks

### 1. Multi-Prompt Chaining
**Setup:** Use the workflow contract to strictly sequentially chain commands.
**Gate:** Output of Prompt A becomes the exact input for Prompt B.
**Failure Mode:** Prompt A drifts. Fix: Ask for a `STATE.md` dump.

### 2. Context Steering via Artifacts
**Setup:** Instead of chatting, ask the agent to rewrite a `spec.md` file over and over.
**Gate:** The file must compile cleanly to markdown and be concise.
**Failure Mode:** Agent deletes necessary old info.

### 3. Shell Exit Code Polling
**Setup:** Chain commands: `command || echo "FAIL"`.
**Gate:** Ensure the agent explicitly reads the `FAIL` output.
**Failure Mode:** Agent ignores failure. Fix: Prompt "If exit code != 0, stop."

### 4. Semantic Search Ping-Pong
**Setup:** Issue a `grep_search` and ask the agent to iteratively refine the search.
**Gate:** Must find exact file paths.
**Failure Mode:** Empty results. Fix: Ask for a broader regex.

### 5. Role-Playing Experts
**Setup:** "Act as an aggressive security auditor."
**Gate:** Review must contain vulnerabilities.
**Failure Mode:** Generic review. Fix: Force it to provide CVSS scores.

### 6. The "Verify Loop" Protocol
**Setup:** "Do not move on to step 3 until `bun test` passes."
**Gate:** Console output shows PASS.
**Failure Mode:** Agent ignores test failures.

### 7. Temporary Logging Shims
**Setup:** Inject temporary decorators/wrappers around slow functions.
**Gate:** Output prints timestamps.
**Failure Mode:** Side effects. Fix: Ensure shims only perform read operations.

### 8. Regex Code Sweeps
**Setup:** Apply a multi-replace tool across large codebases.
**Gate:** `git diff --stat`
**Failure Mode:** Malformed syntax.

### 9. Markdown Dependency Trees
**Setup:** "Draw a mermaid.js dependency graph of `src/`."
**Gate:** Mermaid compiles.
**Failure Mode:** Syntax error in mermaid.

### 10. Spec-to-Test-to-Code
**Setup:** 1. Write Spec. 2. Write Failing Test. 3. Write Code.
**Gate:** Tests pass.
**Failure Mode:** Agent writes trivial code.

### 11. Silent Patching
**Setup:** Edit configurations via `sed` or `jq` without human intervention.
**Gate:** `cat config.json` is clean.
**Failure Mode:** Corrupted JSON. Fix: Run `jq . config.json` to enforce format.

### 12. The "No Code, Just Logic" Prompt
**Setup:** "Draft the flow chart. DO NOT WRITE CODE."
**Gate:** Text representation of a flow chart.
**Failure Mode:** It gives code anyway.

### 13. State Snapshots
**Setup:** Zip the directory `/tmp/backup.zip` before a scary command.
**Gate:** the zip file exists.
**Failure Mode:** Zip ignores dotfiles.

### 14. Incremental Adoption
**Setup:** Introduce TypeScript to only one file at a time.
**Gate:** `tsc --noEmit` locally.
**Failure Mode:** Global types break.

### 15. The "Why?" Chain
**Setup:** "Why did you choose this Library? Why is X better than Y?"
**Gate:** Deep technical justification.
**Failure Mode:** Vague answers.

### 16. Fast-Forward Git Bisecting
**Setup:** Using the terminal to test `HEAD~1`, `HEAD~2` using automated testing.
**Gate:** Finds the exact commit where tests break.
**Failure Mode:** Build cache pollution.

### 17. Hardened Sandboxing
**Setup:** Run arbitrary python tests using `docker run --rm`.
**Gate:** Clean container state.
**Failure Mode:** Environment missing.

### 18. Explaining the Undocumented
**Setup:** Feed minified code to the agent to extract semantic intent.
**Gate:** Clean readable pseudocode string.
**Failure Mode:** Garbage in, garbage out.

### 19. Automated Readme Generation
**Setup:** Ask the agent to read all files and compile `README.md`.
**Gate:** README accurately reflects the codebase.
**Failure Mode:** Outdated structure.

### 20. Project Bible Extraction
**Setup:** Consolidate all architectural decisions into `BIBLE.md`.
**Gate:** User reviews for accuracy.
**Failure Mode:** Missing context.
