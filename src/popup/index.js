import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../lib/message-protocol.js';
import { DEFAULT_HUD_SETTINGS, HUD_SETTINGS_KEY, normalizeHudSettings } from '../lib/ui-settings.js';
import { normalizeFeatureSettings } from '../lib/feature-settings.js';

const settingsModalEl = document.getElementById('settings-modal');
const openSettingsButton = document.getElementById('open-settings');
const openHomeButton = document.getElementById('open-home');
const closeSettingsButton = document.getElementById('settings-close');
const settingsStatusEl = document.getElementById('settings-status');
const popupStatusSummaryEl = document.getElementById('popup-status-summary');
const themePresetEls = Array.from(document.querySelectorAll('[data-theme-preset]'));
const resetLayoutButton = document.getElementById('reset-layout');
const resetThemeButton = document.getElementById('reset-theme');
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

let hudSettings = normalizeHudSettings({}, { width: 1280, height: 760 });
let featureSettings = normalizeFeatureSettings({});

function setModalOpen(target, isOpen) {
  if (!(target instanceof HTMLElement)) return;
  target.classList.toggle('is-open', isOpen);
  target.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function setStatus(message) {
  if (settingsStatusEl) settingsStatusEl.textContent = message;
}

function setPopupSummary(message) {
  if (popupStatusSummaryEl) popupStatusSummaryEl.textContent = message;
}

function paintThemePresets() {
  for (const button of themePresetEls) {
    const preset = button.getAttribute('data-theme-preset');
    button.classList.toggle('is-active', preset === hudSettings.themePreset);
  }
}

async function persistHudSettings(next, message = 'Saved shell settings.') {
  hudSettings = normalizeHudSettings(next, { width: 1280, height: 760 });
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
    items: {
      [HUD_SETTINGS_KEY]: hudSettings,
    },
  });
  if (!response.ok) {
    setStatus(`Save failed: ${response.error || 'unknown error'}`);
    return false;
  }
  paintThemePresets();
  setStatus(message);
  return true;
}

async function loadHudSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: HUD_SETTINGS_KEY });
  hudSettings = response.ok ? normalizeHudSettings(response.data, { width: 1280, height: 760 }) : normalizeHudSettings({}, { width: 1280, height: 760 });
  paintThemePresets();
  setStatus('Settings sync to ChatGPT and Gemini instantly.');
}

function paintFeatureToggles() {
  for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
    if (!(inputEl instanceof HTMLInputElement)) continue;
    inputEl.checked = featureSettings.modules[moduleId]?.enabled === true;
  }
}

async function loadFeatureSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_GET, {});
  featureSettings = response.ok ? normalizeFeatureSettings(response.data) : normalizeFeatureSettings({});
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
  const host = tabUrl.includes('chatgpt.com') ? 'ChatGPT' : tabUrl.includes('gemini.google.com') ? 'Gemini' : 'Unsupported tab';
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
  setPopupSummary('Opening DexEnhance command palette in active tab...');
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

themePresetEls.forEach((button) => {
  button.addEventListener('click', () => {
    const themePreset = button.getAttribute('data-theme-preset') || DEFAULT_HUD_SETTINGS.themePreset;
    void persistHudSettings({
      ...hudSettings,
      themePreset,
    }, `Saved theme preset: ${themePreset}`);
  });
});

resetLayoutButton?.addEventListener('click', () => {
  const defaults = normalizeHudSettings(DEFAULT_HUD_SETTINGS, { width: 1280, height: 760 });
  void persistHudSettings({
    ...hudSettings,
    panels: defaults.panels,
    drawer: defaults.drawer,
  }, 'Launcher and drawer layout reset.');
});

resetThemeButton?.addEventListener('click', () => {
  void persistHudSettings({
    ...hudSettings,
    themePreset: DEFAULT_HUD_SETTINGS.themePreset,
  }, 'Theme preset reset to default.');
});

for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
  inputEl?.addEventListener('change', (event) => {
    void updateFeatureToggle(moduleId, event.currentTarget.checked === true);
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
