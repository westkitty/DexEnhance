import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../lib/message-protocol.js';
import { FEATURE_SETTINGS_KEY, normalizeFeatureSettings } from '../lib/feature-settings.js';
import { DEFAULT_HUD_SETTINGS, HUD_SETTINGS_KEY, defaultPanelState, normalizeHudSettings, updateThemeInSettings } from '../lib/ui-settings.js';

const ONBOARDING_SEEN_KEY = 'onboardingSeenVersion';
const TOUR_SEEN_KEY = 'tourSeenVersion';

const settingsModalEl = document.getElementById('settings-modal');
const openSettingsButton = document.getElementById('open-settings');
const openHomeButton = document.getElementById('open-home');
const closeSettingsButton = document.getElementById('settings-close');
const settingsStatusEl = document.getElementById('settings-status');
const popupStatusSummaryEl = document.getElementById('popup-status-summary');
const themePresetEls = Array.from(document.querySelectorAll('[data-theme-preset]'));
const surfaceButtons = Array.from(document.querySelectorAll('[data-open-surface]'));
const resetLayoutButton = document.getElementById('reset-layout');
const resetThemeButton = document.getElementById('reset-theme');
const recoverUiButton = document.getElementById('recover-ui');
const relaunchOnboardingButton = document.getElementById('relaunch-onboarding');
const relaunchTourButton = document.getElementById('relaunch-tour');
const accentHueEl = document.getElementById('accent-hue');
const transparencyEl = document.getElementById('transparency');
const fabSizeEl = document.getElementById('fab-size');
const fabBehaviorEl = document.getElementById('fab-behavior');
const tokenOverlayModeEl = document.getElementById('token-overlay-mode');
const chromeApi = globalThis.chrome;
const hasChromeRuntimeApi = Boolean(chromeApi?.runtime?.sendMessage && chromeApi?.runtime?.getManifest);
const hasChromeTabsApi = Boolean(chromeApi?.tabs?.query);

const featureToggleEls = {
  semanticClipboard: document.getElementById('feature-semanticClipboard'),
  popoutCanvas: document.getElementById('feature-popoutCanvas'),
  tokenOverlay: document.getElementById('feature-tokenOverlay'),
};

const backupExportButton = document.getElementById('backup-export');
const backupImportButton = document.getElementById('backup-import');
const backupFileInput = document.getElementById('backup-file-input');
const quotaStatusEl = document.getElementById('quota-status');
const quotaBarEl = document.getElementById('quota-bar');
const safeModeToggleEl = document.getElementById('safe-mode-toggle');
const downloadDiagnosticsButton = document.getElementById('download-diagnostics');

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

function paintHudControls() {
  if (accentHueEl) accentHueEl.value = String(Math.round(Number(hudSettings.accentHue || DEFAULT_HUD_SETTINGS.accentHue)));
  if (transparencyEl) transparencyEl.value = String(Number(hudSettings.transparency || DEFAULT_HUD_SETTINGS.transparency));
  if (fabSizeEl) fabSizeEl.value = String(Math.round(Number(hudSettings.panels?.launcher?.width || 64)));
  if (fabBehaviorEl) fabBehaviorEl.value = hudSettings.fab?.behavior || DEFAULT_HUD_SETTINGS.fab.behavior;
  if (tokenOverlayModeEl) tokenOverlayModeEl.value = hudSettings.tokenOverlay?.mode || DEFAULT_HUD_SETTINGS.tokenOverlay.mode;
  paintThemePresets();
}

function paintFeatureToggles() {
  for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
    if (!(inputEl instanceof HTMLInputElement)) continue;
    inputEl.checked = featureSettings.modules[moduleId]?.enabled === true;
  }
}

async function persistHudSettings(next, message = 'Saved launcher settings.') {
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
  paintHudControls();
  setStatus(message);
  return true;
}

async function loadHudSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: HUD_SETTINGS_KEY });
  hudSettings = response.ok ? normalizeHudSettings(response.data, { width: 1280, height: 760 }) : normalizeHudSettings({}, { width: 1280, height: 760 });
  paintHudControls();
  setStatus('Popup settings sync to ChatGPT and Gemini instantly.');
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

async function withActiveSupportedTab(action) {
  if (!hasChromeRuntimeApi || !hasChromeTabsApi) {
    setPopupSummary('Preview mode: extension APIs unavailable outside Chrome extension context.');
    return null;
  }
  const [activeTab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  const tabId = Number(activeTab?.id);
  const tabUrl = String(activeTab?.url || '');
  const supported = tabUrl.includes('chatgpt.com') || tabUrl.includes('gemini.google.com');
  if (!Number.isFinite(tabId) || !supported) {
    setPopupSummary('Open ChatGPT or Gemini in the active tab, then try again.');
    return null;
  }
  return action(tabId, tabUrl);
}

async function checkQuota() {
  if (!hasChromeRuntimeApi) return;
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_QUOTA_CHECK);
  if (response.ok && quotaStatusEl && quotaBarEl) {
    const { usageLabel, quotaLabel, usagePercent, status } = response.data;
    quotaStatusEl.textContent = `Storage usage: ${usageLabel} / ${quotaLabel}`;
    quotaBarEl.style.width = `${Math.min(100, usagePercent)}%`;
    quotaBarEl.style.background = status === 'critical' ? 'var(--dex-danger)' : status === 'warning' ? 'var(--dex-warning)' : 'var(--dex-accent)';
  }
}

async function exportBackup() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.BACKUP_EXPORT);
  if (response.ok) {
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dexenhance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Backup exported successfully.');
  } else {
    setStatus(`Export failed: ${response.error || 'unknown error'}`);
  }
}

async function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const payload = JSON.parse(String(e.target.result || '{}'));
      const response = await sendRuntimeMessage(MESSAGE_ACTIONS.BACKUP_IMPORT, { payload });
      if (response.ok) {
        setStatus('Backup imported successfully. Refreshing...');
        await Promise.all([loadHudSettings(), loadFeatureSettings(), checkQuota()]);
      } else {
        setStatus(`Import failed: ${response.error || 'unknown error'}`);
      }
    } catch (err) {
      setStatus('Import failed: Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

async function loadSafeMode() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SAFE_MODE_GET);
  if (response.ok && safeModeToggleEl) {
    safeModeToggleEl.checked = response.data.active === true;
  }
}

async function toggleSafeMode(active) {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SAFE_MODE_TOGGLE, { active });
  if (response.ok) {
    setStatus(`Safe Mode ${active ? 'enabled' : 'disabled'}. Reload host tabs to apply.`);
  } else {
    setStatus(`Safe Mode toggle failed: ${response.error || 'unknown error'}`);
  }
}

async function downloadDiagnostics() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.DIAGNOSTICS_GET);
  if (response.ok) {
    const log = response.data || [];
    const blob = new Blob([JSON.stringify({
      version: chrome.runtime.getManifest().version,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      log
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dexenhance-diagnostics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Diagnostics log exported.');
  } else {
    setStatus(`Diagnostics export failed: ${response.error || 'unknown error'}`);
  }
}

async function openSurface(surface) {
  return withActiveSupportedTab(async (tabId) => {
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.UI_OPEN_SURFACE, { tabId, surface });
    if (!response.ok) {
      setPopupSummary(`Open ${surface} failed: ${response.error || 'unknown error'}`);
      return;
    }
    setPopupSummary(`Opening ${surface} in the active tab…`);
    window.close();
  });
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

openHomeButton?.addEventListener('click', () => {
  void openSurface('hub');
});

surfaceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    void openSurface(button.getAttribute('data-open-surface') || 'hub');
  });
});

openSettingsButton?.addEventListener('click', () => {
  setModalOpen(settingsModalEl, true);
  void Promise.all([loadHudSettings(), loadFeatureSettings(), checkQuota(), loadSafeMode()]);
});

closeSettingsButton?.addEventListener('click', () => {
  setModalOpen(settingsModalEl, false);
});

themePresetEls.forEach((button) => {
  button.addEventListener('click', () => {
    const themePreset = button.getAttribute('data-theme-preset') || DEFAULT_HUD_SETTINGS.themePreset;
    void persistHudSettings(updateThemeInSettings(hudSettings, { themePreset }, { width: 1280, height: 760 }), `Saved theme preset: ${themePreset}`);
  });
});

accentHueEl?.addEventListener('input', (event) => {
  void persistHudSettings(updateThemeInSettings(hudSettings, { accentHue: Number(event.currentTarget.value) }, { width: 1280, height: 760 }), 'Saved accent hue.');
});

transparencyEl?.addEventListener('input', (event) => {
  void persistHudSettings(updateThemeInSettings(hudSettings, { transparency: Number(event.currentTarget.value) }, { width: 1280, height: 760 }), 'Saved transparency.');
});

fabSizeEl?.addEventListener('input', (event) => {
  const size = Number(event.currentTarget.value);
  void persistHudSettings({
    ...hudSettings,
    panels: {
      ...hudSettings.panels,
      launcher: {
        ...hudSettings.panels.launcher,
        width: size,
        height: size,
      },
    },
  }, 'Saved FAB size.');
});

fabBehaviorEl?.addEventListener('change', (event) => {
  void persistHudSettings(updateThemeInSettings(hudSettings, {
    fab: {
      ...hudSettings.fab,
      behavior: event.currentTarget.value === 'hub_first' ? 'hub_first' : 'quick_actions',
    },
  }, { width: 1280, height: 760 }), 'Saved FAB behavior.');
});

tokenOverlayModeEl?.addEventListener('change', (event) => {
  void persistHudSettings(updateThemeInSettings(hudSettings, {
    tokenOverlay: {
      ...hudSettings.tokenOverlay,
      mode: event.currentTarget.value === 'expanded' ? 'expanded' : 'compact',
    },
  }, { width: 1280, height: 760 }), 'Saved token overlay mode.');
});

resetLayoutButton?.addEventListener('click', () => {
  void persistHudSettings({
    ...hudSettings,
    panels: {
      welcome: defaultPanelState('welcome', { width: 1280, height: 760 }),
      launcher: defaultPanelState('launcher', { width: 1280, height: 760 }),
      quickHub: defaultPanelState('quickHub', { width: 1280, height: 760 }),
      tour: defaultPanelState('tour', { width: 1280, height: 760 }),
      drawer: defaultPanelState('drawer', { width: 1280, height: 760 }),
    },
  }, 'Launcher, hub, tour, and drawer layout reset.');
});

recoverUiButton?.addEventListener('click', () => {
  void persistHudSettings({
    ...hudSettings,
    visibility: {
      ...hudSettings.visibility,
      launcher: true,
      quickHub: true,
    },
    panels: {
      ...hudSettings.panels,
      launcher: defaultPanelState('launcher', { width: 1280, height: 760 }),
      quickHub: defaultPanelState('quickHub', { width: 1280, height: 760 }),
      tour: defaultPanelState('tour', { width: 1280, height: 760 }),
    },
  }, 'Recovered launcher, hub, and tour positions.');
});

resetThemeButton?.addEventListener('click', () => {
  void persistHudSettings(updateThemeInSettings(hudSettings, {
    themePreset: DEFAULT_HUD_SETTINGS.themePreset,
    accentHue: DEFAULT_HUD_SETTINGS.accentHue,
    transparency: DEFAULT_HUD_SETTINGS.transparency,
    tokenOverlay: DEFAULT_HUD_SETTINGS.tokenOverlay,
    fab: DEFAULT_HUD_SETTINGS.fab,
  }, { width: 1280, height: 760 }), 'Theme reset to default.');
});

relaunchOnboardingButton?.addEventListener('click', async () => {
  await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: ONBOARDING_SEEN_KEY });
  setStatus('Onboarding flag cleared. Open Hub in a host tab to relaunch.');
  await openSurface('settings');
});

relaunchTourButton?.addEventListener('click', async () => {
  await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: TOUR_SEEN_KEY });
  setStatus('Quick tour flag cleared.');
  await openSurface('tour');
});
for (const [moduleId, inputEl] of Object.entries(featureToggleEls)) {
  inputEl?.addEventListener('change', (event) => {
    void updateFeatureToggle(moduleId, event.currentTarget.checked === true);
  });
}

backupExportButton?.addEventListener('click', () => {
  void exportBackup();
});

backupImportButton?.addEventListener('click', () => {
  backupFileInput?.click();
});

backupFileInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) void importBackup(file);
});

safeModeToggleEl?.addEventListener('change', (event) => {
  void toggleSafeMode(event.currentTarget.checked === true);
});

downloadDiagnosticsButton?.addEventListener('click', () => {
  void downloadDiagnostics();
});

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
