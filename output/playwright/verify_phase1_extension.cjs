const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const extensionPath = path.resolve('dist');
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    throw new Error(`dist/manifest.json not found at ${extensionPath}`);
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dexenhance-pw-'));
  const results = {
    extensionPath,
    userDataDir,
    serviceWorkerFound: false,
    storageRoundTrip: null,
    chatgptLogSeen: false,
    geminiLogSeen: false,
    errors: [],
    notes: [],
  };

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1440, height: 900 },
  });

  try {
    let sw = context.serviceWorkers()[0] || null;
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null);
    }

    if (sw) {
      results.serviceWorkerFound = true;
      results.storageRoundTrip = await sw.evaluate(async () => {
        await chrome.storage.local.set({ dexTest: 'hello' });
        return await chrome.storage.local.get('dexTest');
      });
    } else {
      results.errors.push('Service worker not detected');
    }

    async function checkSite(url, expectedLog) {
      const page = await context.newPage();
      const logs = [];
      page.on('console', (msg) => {
        logs.push(msg.text());
      });

      page.on('pageerror', (err) => {
        results.notes.push(`[${url}] pageerror: ${String(err)}`);
      });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(6000);
      } catch (err) {
        results.notes.push(`[${url}] navigation issue: ${String(err)}`);
      }

      const saw = logs.some((t) => t.includes(expectedLog));
      if (url.includes('chatgpt.com')) results.chatgptLogSeen = saw;
      if (url.includes('gemini.google.com')) results.geminiLogSeen = saw;

      const dexErrors = logs.filter((t) => /DexEnhance/i.test(t) && /(error|uncaught|failed)/i.test(t));
      if (dexErrors.length) {
        results.errors.push(`[${url}] DexEnhance-related console errors: ${dexErrors.join(' | ')}`);
      }

      await page.close();
    }

    await checkSite('https://chatgpt.com/', '[DexEnhance] ChatGPT content script loaded');
    await checkSite('https://gemini.google.com/', '[DexEnhance] Gemini content script loaded');
  } finally {
    await context.close();
  }

  console.log(JSON.stringify(results, null, 2));
})();
