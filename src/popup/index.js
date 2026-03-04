import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../lib/message-protocol.js';
import { DEFAULT_HUD_SETTINGS, HUD_SETTINGS_KEY } from '../lib/ui-settings.js';
import { TOUR_STEPS, TOUR_VERSION } from '../ui/tour-content.js';

const POPUP_TOUR_KEY = 'popupTourSeenVersion';

const modalEl = document.getElementById('tour-modal');
const openTourButton = document.getElementById('open-tour');
const closeTourButton = document.getElementById('tour-close');
const backButton = document.getElementById('tour-back');
const nextButton = document.getElementById('tour-next');
const progressEl = document.getElementById('tour-progress');
const titleEl = document.getElementById('tour-title');
const descEl = document.getElementById('tour-desc');
const exampleEl = document.getElementById('tour-example');
const settingsModalEl = document.getElementById('settings-modal');
const openSettingsButton = document.getElementById('open-settings');
const closeSettingsButton = document.getElementById('settings-close');
const hueInput = document.getElementById('hud-hue');
const hueValueEl = document.getElementById('hud-hue-value');
const resetLayoutButton = document.getElementById('reset-layout');
const resetThemeButton = document.getElementById('reset-theme');
const settingsStatusEl = document.getElementById('settings-status');

let stepIndex = 0;
let hudSettings = {};
let hueSaveTimer = null;

document.documentElement.style.setProperty('--dex-popup-logo-url', 'url("../icons/icon128.png")');

function renderStep() {
  const step = TOUR_STEPS[stepIndex] || TOUR_STEPS[0];
  if (!step) return;

  progressEl.textContent = `Step ${stepIndex + 1} of ${TOUR_STEPS.length}`;
  titleEl.textContent = step.title;
  descEl.textContent = step.description;
  exampleEl.textContent = step.example;

  backButton.disabled = stepIndex === 0;
  nextButton.textContent = stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next';
}

function setModalOpen(target, isOpen) {
  if (!(target instanceof HTMLElement)) return;
  target.classList.toggle('is-open', isOpen);
  target.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function setStatus(message) {
  if (!settingsStatusEl) return;
  settingsStatusEl.textContent = message;
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

async function markTourSeen() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
    items: {
      [POPUP_TOUR_KEY]: TOUR_VERSION,
    },
  });
  if (!response.ok) {
    console.warn('[DexEnhance] Popup tour state save failed:', response.error);
  }
}

async function maybeAutoOpenTour() {
  const state = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, {
    key: POPUP_TOUR_KEY,
  });

  if (!state.ok || state.data !== TOUR_VERSION) {
    stepIndex = 0;
    renderStep();
    setModalOpen(modalEl, true);
  }
}

openTourButton?.addEventListener('click', () => {
  setModalOpen(settingsModalEl, false);
  stepIndex = 0;
  renderStep();
  setModalOpen(modalEl, true);
});

closeTourButton?.addEventListener('click', () => {
  setModalOpen(modalEl, false);
  void markTourSeen();
});

backButton?.addEventListener('click', () => {
  stepIndex = Math.max(stepIndex - 1, 0);
  renderStep();
});

nextButton?.addEventListener('click', () => {
  if (stepIndex >= TOUR_STEPS.length - 1) {
    setModalOpen(modalEl, false);
    void markTourSeen();
    return;
  }
  stepIndex = Math.min(stepIndex + 1, TOUR_STEPS.length - 1);
  renderStep();
});

modalEl?.addEventListener('click', (event) => {
  if (event.target === modalEl) {
    setModalOpen(modalEl, false);
    void markTourSeen();
  }
});

openSettingsButton?.addEventListener('click', () => {
  setModalOpen(modalEl, false);
  setModalOpen(settingsModalEl, true);
  void loadHudSettings();
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

settingsModalEl?.addEventListener('click', (event) => {
  if (event.target === settingsModalEl) {
    setModalOpen(settingsModalEl, false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalEl?.classList.contains('is-open')) {
    setModalOpen(modalEl, false);
    void markTourSeen();
  }
  if (event.key === 'Escape' && settingsModalEl?.classList.contains('is-open')) {
    setModalOpen(settingsModalEl, false);
  }
});

renderStep();
void maybeAutoOpenTour();

console.log('[DexEnhance] Popup loaded');
