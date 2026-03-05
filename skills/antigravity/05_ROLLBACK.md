# Rollback Instructions

If a chunk of work fails or breaks the repo, use the following steps to revert to a clean state:

### 1. Undo Uncommitted Changes
Discards any unstaged or staged text edits:
```bash
git reset --hard HEAD
git clean -fd
```

### 2. Re-install Dependencies
If `package.json` or `bun.lock` was touched and the app refuses to build:
```bash
bun install --force
```

### 3. Clean Build Artifacts
Clear out intermediate build files:
```bash
rm -rf dist/ dist-firefox/ node_modules/.vite/ output/
```
