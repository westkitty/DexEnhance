# Antigravity — 20 Extremely Useful Skills

This library provides actionable playbooks for 20 core Antigravity capabilities.

### 1. Spec-First Generation
**What it is:** Writing a detailed markdown specification before generating code.
**When to use:** Starting a new feature.
**Prompt:** "Create a technical spec in `implementation_plan.md` for [feature]. Do not write code yet."
**Artifacts:** `implementation_plan.md`
**Verification:** User review of the markdown file.

### 2. The Verification Loop
**What it is:** Running the build/test suite continuously after every file touched.
**When to use:** During execution of complex logic changes.
**Prompt:** "After every change to a file, run `bun run build && bun run test:all`. Only proceed if it passes."
**Artifacts:** None (terminal output).
**Verification:** Shell exit code 0.

### 3. Rubber Duck Debugging
**What it is:** Asking the agent to explain the control flow leading to an error without fixing it.
**When to use:** Tracing obscure bugs.
**Prompt:** "Explain how data flows from X to Y and where the disconnect is. Do not write a fix yet."
**Artifacts:** Agent markdown response.
**Verification:** Human developer understands the bug.

### 4. Sandbox Refactoring
**What it is:** Moving code to a temporary `/tmp/` file to test it in isolation.
**When to use:** Extracting pure functions or isolated utilities.
**Prompt:** "Extract `parseLogic()` to `/tmp/test.ts` and write a script to run it."
**Artifacts:** `/tmp/test.ts`
**Verification:** Temporary script runs successfully.

### 5. Automated Boilerplate Scaffolding
**What it is:** Generating the directory structure and empty files for a new component.
**When to use:** Starting a new UI page or module.
**Prompt:** "Scaffold the React component structure for `UserProfile` including `index.js`, `styles.css`, and `UserProfile.test.js`."
**Artifacts:** 3 new files.
**Verification:** Files exist and `bun run build` passes.

### 6. Dependency Impact Analysis
**What it is:** Checking what will break if a package is upgraded.
**When to use:** Before running `bun update`.
**Prompt:** "Search the codebase for usages of `playwright` before we upgrade it."
**Artifacts:** List of file paths.
**Verification:** Found paths match reality.

### 7. Contract-Based Mocks
**What it is:** Generating mock data that matches the exact TypeScript interfaces.
**When to use:** Writing frontend tests before the backend is ready.
**Prompt:** "Generate mock data arrays based on the `User` and `Session` types for testing."
**Artifacts:** `mocks.ts`
**Verification:** TypeScript compiler passes the mocks.

### 8. Context Window Optimization
**What it is:** Asking the agent to summarize and drop old context to save tokens.
**When to use:** Long conversations where the agent is hallucinating or lagging.
**Prompt:** "Summarize our progress into `STATE.md`, then I will start a new session."
**Artifacts:** `STATE.md`
**Verification:** `STATE.md` contains accurate current state.

### 9. Step-by-Step Security Audit
**What it is:** Scanning components explicitly for vulnerabilities.
**When to use:** Before a major release or when handling user input.
**Prompt:** "Audit `authenticate.ts` for timing attacks, injection flaws, and exposed secrets."
**Artifacts:** Bulleted list of findings.
**Verification:** Found issues are patched.

### 10. The Rollback Marker
**What it is:** Generating a specific commit or stash state before risky work.
**When to use:** Before massive refactors.
**Prompt:** "Run `git stash` and tag it as `pre-refactor` before we begin."
**Artifacts:** Git stash/branch.
**Verification:** `git branch` shows the marker.

### 11. Minimal Diff Generation
**What it is:** Forcing the agent to only output the changed lines.
**When to use:** Modifying large (1000+ line) files.
**Prompt:** "Use the `replace_file_content` tool to edit only the exact 5 lines needed in `large_file.ts`."
**Artifacts:** Edited file.
**Verification:** `git diff` shows exactly 5 lines changed.

### 12. Cross-File Structural Renaming
**What it is:** Renaming a variable safely across the entire repo.
**When to use:** Changing domain models.
**Prompt:** "Find all instances of `userId` in `src/` and replace with `accountIdentifier`."
**Artifacts:** Multiple edited files.
**Verification:** `bun run build` succeeds (no broken types).

### 13. Shadow PR Review
**What it is:** Asking the agent to critique a diff before committing.
**When to use:** Preparing a Pull Request.
**Prompt:** "Act as a senior engineer. Critique the uncommitted changes in my working tree."
**Artifacts:** Review comments.
**Verification:** Actionable feedback is provided.

### 14. Artifact-Driven UI
**What it is:** Generating an HTML page to visualize data/UI outside the app.
**When to use:** Testing a visual component quickly.
**Prompt:** "Generate a standalone `preview.html` file demonstrating the CSS grid layout."
**Artifacts:** `preview.html`
**Verification:** File opens correctly in browser.

### 15. Defensive Programming Prompts
**What it is:** Forcing the addition of bounds checking and error handling.
**When to use:** Parsing external data.
**Prompt:** "Wrap the API parsing logic in aggressive try-catch blocks and log bad payloads."
**Artifacts:** Modified logic with `try/catch`.
**Verification:** Tests pass.

### 16. Log-Driven Execution Tracker
**What it is:** Sprinkling `console.log` tracers to understand runtime path.
**When to use:** Code builds fine but fails silently at runtime.
**Prompt:** "Add `console.log('TRACE: <func_name>')` to every function in `auth.ts`."
**Artifacts:** Modified `auth.ts`
**Verification:** Console out reveals the execution path.

### 17. The "Assume Nothing" Prompt
**What it is:** Forcing the agent to explicitly list its assumptions.
**When to use:** Agent is producing broken code continuously.
**Prompt:** "Stop. List every assumption you are making about the `User` object structure."
**Artifacts:** Bulleted list.
**Verification:** Human corrects the bad assumption.

### 18. Walkthrough Proof-of-Work
**What it is:** Forcing the agent to document what it just accomplished.
**When to use:** After finishing a complex task.
**Prompt:** "Create `walkthrough.md` explaining how the new routing system works."
**Artifacts:** `walkthrough.md`
**Verification:** Markdown is highly readable and accurate.

### 19. Reverse Engineering Legacy Code
**What it is:** Decompiling dense, uncommented code into readable logic.
**When to use:** Touching code written by someone else years ago.
**Prompt:** "Add heavily descriptive JSDoc comments to `legacy_parser.js` explaining what it does."
**Artifacts:** Commented file.
**Verification:** Developers can now understand the file.

### 20. Automated E2E Test Generation
**What it is:** Generating Playwright tests based on the source code structure.
**When to use:** Increasing code coverage.
**Prompt:** "Read `LoginForm.tsx` and write a Playwright test script covering the sunny/rainy day paths."
**Artifacts:** `tests/e2e/login.spec.ts`
**Verification:** `bunx playwright test login.spec.ts` passes.
