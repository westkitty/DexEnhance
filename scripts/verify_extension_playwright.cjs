const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseExtensionId(url) {
  const match = typeof url === 'string' ? url.match(/^chrome-extension:\/\/([^/]+)\//) : null;
  return match?.[1] || '';
}

async function verifySite(context, site) {
  const url = site === 'chatgpt' ? 'https://chatgpt.com/' : 'https://gemini.google.com/';
  const expectedLog =
    site === 'chatgpt'
      ? '[DexEnhance] ChatGPT content script loaded'
      : '[DexEnhance] Gemini content script loaded';
  const hostId = `dex-enhance-root-${site}`;
  const screenshotPath = path.resolve('output/playwright', `phase10-${site}.png`);
  const logs = [];
  const errors = [];

  const page = await context.newPage();
  page.on('console', (message) => {
    logs.push({
      type: message.type(),
      text: message.text(),
    });
  });
  page.on('pageerror', (error) => {
    errors.push(String(error));
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(7000);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    const ui = await page.evaluate((id) => {
      const host = document.getElementById(id);
      const root = host?.shadowRoot || null;
      return {
        hostPresent: Boolean(host),
        shadowPresent: Boolean(root),
        sidebarPresent: Boolean(root?.querySelector('.dex-sidebar')),
        fabPresent: Boolean(root?.querySelector('.dex-fab')),
        overlayPresent: Boolean(root?.querySelector('.dex-token-overlay')),
        badgePresent: Boolean(root?.querySelector('.dex-brand-badge')),
        sidebarIconPresent: Boolean(root?.querySelector('.dex-sidebar__icon')),
        fabIconPresent: Boolean(root?.querySelector('.dex-fab__icon')),
        overlayIconPresent: Boolean(root?.querySelector('.dex-token-overlay__icon')),
      };
    }, hostId);

    return {
      site,
      url,
      expectedLogSeen: logs.some((entry) => entry.text.includes(expectedLog)),
      dexEnhanceErrors: logs.filter(
        (entry) =>
          /DexEnhance/i.test(entry.text) &&
          /(error|uncaught|failed|exception)/i.test(entry.text)
      ),
      extensionInlineCspErrors: logs.filter(
        (entry) =>
          entry.type === 'error' &&
          /executing inline script violates/i.test(entry.text) &&
          /chrome-extension:\/\//i.test(entry.text)
      ),
      extensionResourceDeniedErrors: logs.filter(
        (entry) =>
          entry.type === 'error' &&
          /denying load of chrome-extension:\/\//i.test(entry.text) &&
          /resources must be listed in the web_accessible_resources/i.test(entry.text)
      ),
      pageErrors: errors,
      ui,
      screenshotPath,
      sampleLogs: logs.slice(0, 30),
    };
  } finally {
    await page.close();
  }
}

async function verifyPopup(context, extensionId) {
  const url = `chrome-extension://${extensionId}/popup/index.html`;
  const screenshotPath = path.resolve('output/playwright', 'phase10-popup.png');
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(800);

    const initial = await page.evaluate(() => {
      const modal = document.getElementById('tour-modal');
      const icon = document.querySelector('.brand img');
      const openButton = document.getElementById('open-tour');
      return {
        modalOpen: Boolean(modal?.classList.contains('is-open')),
        iconPresent: Boolean(icon),
        iconSource: icon?.getAttribute('src') || '',
        openTourButtonPresent: Boolean(openButton),
      };
    });

    await page.click('#tour-close').catch(() => {});
    await page.waitForTimeout(300);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    const closed = await page.evaluate(() => {
      const modal = document.getElementById('tour-modal');
      return {
        modalOpen: Boolean(modal?.classList.contains('is-open')),
        progressText: document.getElementById('tour-progress')?.textContent || '',
      };
    });

    return {
      url,
      screenshotPath,
      initial,
      closed,
    };
  } finally {
    await page.close();
  }
}

(async () => {
  const projectRoot = process.cwd();
  const extensionPath = path.resolve(projectRoot, 'dist');
  const reportPath = path.resolve(
    projectRoot,
    '.planning/phases/phase-10/phase-10-05-playwright-verification.json'
  );
  const outputDir = path.resolve(projectRoot, 'output/playwright');

  ensureDir(path.dirname(reportPath));
  ensureDir(outputDir);

  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    throw new Error(`dist/manifest.json not found at ${extensionPath}. Run build first.`);
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dexenhance-pw-'));
  const headless = process.env.DEX_PW_HEADLESS === '1';
  const result = {
    at: new Date().toISOString(),
    extensionPath,
    reportPath,
    userDataDir,
    headless,
    serviceWorkerFound: false,
    storageRoundTrip: null,
    promptCatalog: null,
    popup: null,
    chatgpt: null,
    gemini: null,
    errors: [],
  };

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1440, height: 900 },
  });

  try {
    let worker = context.serviceWorkers()[0] || null;
    if (!worker) {
      worker = await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null);
    }

    if (worker) {
      result.serviceWorkerFound = true;
      result.storageRoundTrip = await worker.evaluate(async () => {
        await chrome.storage.local.set({ dexPlaywrightProbe: 'ok' });
        const data = await chrome.storage.local.get('dexPlaywrightProbe');
        await chrome.storage.local.remove('dexPlaywrightProbe');
        return data;
      });
      result.promptCatalog = await worker.evaluate(async () => {
        await chrome.storage.local.remove(['popupTourSeenVersion']);
        const state = await chrome.storage.local.get(['prompts', 'promptCatalogVersion']);
        return {
          promptCount: Array.isArray(state.prompts) ? state.prompts.length : 0,
          catalogVersion: typeof state.promptCatalogVersion === 'string' ? state.promptCatalogVersion : '',
        };
      });
    } else {
      result.errors.push('Extension service worker not detected.');
    }

    const extensionId = parseExtensionId(worker?.url?.() || '');
    if (extensionId) {
      result.popup = await verifyPopup(context, extensionId);
    } else {
      result.errors.push('Could not determine extension ID for popup verification.');
    }

    result.chatgpt = await verifySite(context, 'chatgpt');
    result.gemini = await verifySite(context, 'gemini');

    if (!result.chatgpt.expectedLogSeen) {
      result.errors.push('Expected ChatGPT content-script log was not seen.');
    }
    if (!result.gemini.expectedLogSeen) {
      result.errors.push('Expected Gemini content-script log was not seen.');
    }
    if ((result.chatgpt.extensionInlineCspErrors || []).length > 0) {
      result.errors.push('ChatGPT reported extension inline-script CSP violations.');
    }
    if ((result.gemini.extensionInlineCspErrors || []).length > 0) {
      result.errors.push('Gemini reported extension inline-script CSP violations.');
    }
    if ((result.chatgpt.extensionResourceDeniedErrors || []).length > 0) {
      result.errors.push('ChatGPT reported denied extension resource loads.');
    }
    if ((result.gemini.extensionResourceDeniedErrors || []).length > 0) {
      result.errors.push('Gemini reported denied extension resource loads.');
    }
    if (!result.chatgpt.ui.hostPresent || !result.gemini.ui.hostPresent) {
      result.errors.push('Shadow host was not detected on one or more target sites.');
    }
    if ((result.promptCatalog?.promptCount || 0) < 50) {
      result.errors.push('Prompt catalog contains fewer than 50 templates.');
    }
    if (!result.popup?.initial?.iconPresent) {
      result.errors.push('Popup icon was not detected.');
    }
    if (!result.popup?.initial?.modalOpen) {
      result.errors.push('Popup tour did not auto-open on first launch.');
    }
    if (result.popup?.closed?.modalOpen) {
      result.errors.push('Popup tour did not close when requested.');
    }
  } finally {
    await context.close();
  }

  result.pass = result.errors.length === 0;
  fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
})();
