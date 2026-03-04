#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const firefoxDistDir = path.join(projectRoot, 'dist-firefox');
const baseManifestPath = path.join(projectRoot, 'public', 'manifest.json');

if (!fs.existsSync(distDir)) {
  throw new Error(`Base dist not found at ${distDir}. Run \"bun run build\" first.`);
}

if (!fs.existsSync(path.join(distDir, 'manifest.json'))) {
  throw new Error(`dist/manifest.json not found at ${distDir}. Run \"bun run build\" first.`);
}

const baseManifest = JSON.parse(fs.readFileSync(baseManifestPath, 'utf8'));

// Firefox MV3 target: keep runtime behavior aligned while avoiding unsupported
// DNR permission requirements.
const firefoxManifest = {
  ...baseManifest,
  permissions: Array.isArray(baseManifest.permissions)
    ? baseManifest.permissions.filter((permission) => permission !== 'declarativeNetRequest')
    : [],
  browser_specific_settings: {
    gecko: {
      id: 'dexenhance@andrew-private',
      strict_min_version: '128.0',
    },
  },
};

fs.rmSync(firefoxDistDir, { recursive: true, force: true });
fs.cpSync(distDir, firefoxDistDir, { recursive: true });

const firefoxManifestPath = path.join(firefoxDistDir, 'manifest.json');
fs.writeFileSync(firefoxManifestPath, `${JSON.stringify(firefoxManifest, null, 2)}\n`);

console.log(`Created Firefox distribution at ${firefoxDistDir}`);
console.log(`Wrote Firefox manifest at ${firefoxManifestPath}`);
