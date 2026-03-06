import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../lib/message-protocol.js';
import { DEFAULT_HUD_SETTINGS, HUD_SETTINGS_KEY } from '../lib/ui-settings.js';
import { normalizeFeatureSettings } from '../lib/feature-settings.js';

const settingsModalEl = document.getElementById('settings-modal');
const openSettingsButton = document.getElementById('open-settings');
const openHomeButton = document.getElementById('open-home');
const closeSettingsButton = document.getElementById('settings-close');
const hueInput = document.getElementById('hud-hue');
const hueValueEl = document.getElementById('hud-hue-value');
const resetLayoutButton = document.getElementById('reset-layout');
const resetThemeButton = document.getElementById('reset-theme');
const settingsStatusEl = document.getElementById('settings-status');
const popupStatusSummaryEl = document.getElementById('popup-status-summary');
const chromeApi = globalThis.chrome;
const hasChromeRuntimeApi = Boolean(chromeApi?.runtime?.sendMessage && chromeApi?.runtime?.getManifest);
const hasChromeTabsApi = Boolean(chromeApi?.tabs?.query);

const featureToggleEls = {
  ghostOverlay: document.getElementById('feature-ghostOverlay'),
  observerAgent: document.getElementById('feature-observerAgent'),
  semanticClipboard: document.getElementById('feature-semanticClipboard'),
  popoutCanvas: document.getElementById('feature-popoutCanvas'),
  macroRecorder: document.getElementById('feature-macroRecorder'),
  conversationMapper: document.getElementById('feature-conversationMapper'),
  promptUnitTesting: document.getElementById('feature-promptUnitTesting'),
};

let hudSettings = {};
let featureSettings = normalizeFeatureSettings({});
let hueSaveTimer = null;

document.documentElement.style.setProperty('--dex-popup-logo-url', 'url("../icons/icon128.png")');

function setModalOpen(target, isOpen) {
  if (!(target instanceof HTMLElement)) return;
  target.classList.toggle('is-open', isOpen);
  target.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function setStatus(message) {
  if (!settingsStatusEl) return;
  settingsStatusEl.textContent = message;
}

function setPopupSummary(message) {
  if (!popupStatusSummaryEl) return;
  popupStatusSummaryEl.textContent = message;
}

function applyHueValue(value) {
  const safe = Math.max(0, Math.min(360, Number(value) || DEFAULT_HUD_SETTINGS.accentHue));
  if (hueInput instanceof HTMLInputElement) {
    hueInput.value = String(Math.round(safe));
  }
  if (hueValueEl) {
    hueValueEl.textContent = `${Math.round(safe)}°`;
  }
}

async function persistHudSettings(next, message = 'Saved HUD settings.') {
  hudSettings = typeof next === 'object' && next !== null ? next : {};
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
    items: {
      [HUD_SETTINGS_KEY]: hudSettings,
    },
  });
  if (!response.ok) {
    setStatus(`Save failed: ${response.error || 'unknown error'}`);
    return false;
  }
  setStatus(message);
  return true;
}

async function loadHudSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, {
    key: HUD_SETTINGS_KEY,
  });

  if (!response.ok) {
    hudSettings = {};
    applyHueValue(DEFAULT_HUD_SETTINGS.accentHue);
    setStatus('Could not read HUD settings; using defaults.');
    return;
  }

  hudSettings = typeof response.data === 'object' && response.data !== null ? response.data : {};
  applyHueValue(hudSettings.accentHue ?? DEFAULT_HUD_SETTINGS.accentHue);
  setStatus('Changes sync to ChatGPT and Gemini HUD instantly.');
}

function paintFeatureToggles() {
  for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
    if (!(inputEl instanceof HTMLInputElement)) continue;
    inputEl.checked = featureSettings.modules[moduleId]?.enabled === true;
  }
}

async function loadFeatureSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_GET, {});
  if (!response.ok) {
    featureSettings = normalizeFeatureSettings({});
    paintFeatureToggles();
    setStatus('Could not load feature toggles; defaults applied.');
    return;
  }

  featureSettings = normalizeFeatureSettings(response.data);
  paintFeatureToggles();
}

async function updateFeatureToggle(moduleId, enabled) {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_UPDATE_MODULE, {
    moduleId,
    patch: { enabled },
  });
  if (!response.ok) {
    setStatus(`Feature toggle failed: ${response.error || 'unknown error'}`);
    paintFeatureToggles();
    return;
  }

  featureSettings = normalizeFeatureSettings(response.data);
  paintFeatureToggles();
  setStatus(`Saved feature toggle: ${moduleId}`);
}

async function refreshPopupStatus() {
  if (!hasChromeRuntimeApi || !hasChromeTabsApi) {
    setPopupSummary('Preview mode: extension APIs unavailable outside Chrome extension context.');
    return;
  }

  const enabledRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'enabled' });
  const [activeTab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  const tabUrl = String(activeTab?.url || '');
  const host = tabUrl.includes('chatgpt.com')
    ? 'ChatGPT'
    : tabUrl.includes('gemini.google.com')
      ? 'Gemini'
      : 'Unsupported tab';
  const enabledLabel = enabledRes.ok ? (enabledRes.data === false ? 'disabled' : 'enabled') : 'unknown';
  const version = chromeApi.runtime.getManifest()?.version || 'unknown';
  setPopupSummary(`DexEnhance ${enabledLabel} • Host: ${host} • v${version}`);
}

async function openHomeInActiveTab() {
  if (!hasChromeRuntimeApi || !hasChromeTabsApi) {
    setPopupSummary('Preview mode: Open Home is available only in extension context.');
    return;
  }

  const [activeTab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  const tabId = Number(activeTab?.id);
  const tabUrl = String(activeTab?.url || '');
  const supported = tabUrl.includes('chatgpt.com') || tabUrl.includes('gemini.google.com');

  if (!Number.isFinite(tabId) || !supported) {
    setPopupSummary('Open ChatGPT or Gemini in the active tab, then try again.');
    return;
  }

  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.UI_OPEN_HOME, { tabId });
  if (!response.ok) {
    setPopupSummary(`Open Home failed: ${response.error || 'unknown error'}`);
    return;
  }
  setPopupSummary('Opening DexEnhance Home in active tab...');
  window.close();
}

openHomeButton?.addEventListener('click', () => {
  void openHomeInActiveTab();
});

openSettingsButton?.addEventListener('click', () => {
  setModalOpen(settingsModalEl, true);
  void Promise.all([loadHudSettings(), loadFeatureSettings()]);
});

closeSettingsButton?.addEventListener('click', () => {
  setModalOpen(settingsModalEl, false);
});

hueInput?.addEventListener('input', (event) => {
  const nextHue = Math.max(0, Math.min(360, Number(event.currentTarget.value) || DEFAULT_HUD_SETTINGS.accentHue));
  applyHueValue(nextHue);

  if (hueSaveTimer) window.clearTimeout(hueSaveTimer);
  hueSaveTimer = window.setTimeout(() => {
    void persistHudSettings(
      {
        ...hudSettings,
        accentHue: nextHue,
      },
      `Saved accent hue: ${Math.round(nextHue)}°`
    );
  }, 180);
});

resetLayoutButton?.addEventListener('click', () => {
  void persistHudSettings(
    {
      ...hudSettings,
      panels: {},
    },
    'Window layout reset. Reload active chat tabs if needed.'
  );
});

resetThemeButton?.addEventListener('click', () => {
  applyHueValue(DEFAULT_HUD_SETTINGS.accentHue);
  void persistHudSettings(
    {
      accentHue: DEFAULT_HUD_SETTINGS.accentHue,
      panels: {},
    },
    'Theme and opacity reset to defaults.'
  );
});

for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
  inputEl?.addEventListener('change', (event) => {
    const nextEnabled = event.currentTarget.checked === true;
    void updateFeatureToggle(moduleId, nextEnabled);
  });
}

settingsModalEl?.addEventListener('click', (event) => {
  if (event.target === settingsModalEl) {
    setModalOpen(settingsModalEl, false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && settingsModalEl?.classList.contains('is-open')) {
    setModalOpen(settingsModalEl, false);
  }
});

void refreshPopupStatus();
console.log('[DexEnhance] Popup loaded');
