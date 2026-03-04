import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../lib/message-protocol.js';
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

let stepIndex = 0;

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

function setModalOpen(isOpen) {
  modalEl.classList.toggle('is-open', isOpen);
  modalEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
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
    setModalOpen(true);
  }
}

openTourButton?.addEventListener('click', () => {
  stepIndex = 0;
  renderStep();
  setModalOpen(true);
});

closeTourButton?.addEventListener('click', () => {
  setModalOpen(false);
  void markTourSeen();
});

backButton?.addEventListener('click', () => {
  stepIndex = Math.max(stepIndex - 1, 0);
  renderStep();
});

nextButton?.addEventListener('click', () => {
  if (stepIndex >= TOUR_STEPS.length - 1) {
    setModalOpen(false);
    void markTourSeen();
    return;
  }
  stepIndex = Math.min(stepIndex + 1, TOUR_STEPS.length - 1);
  renderStep();
});

modalEl?.addEventListener('click', (event) => {
  if (event.target === modalEl) {
    setModalOpen(false);
    void markTourSeen();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalEl?.classList.contains('is-open')) {
    setModalOpen(false);
    void markTourSeen();
  }
});

renderStep();
void maybeAutoOpenTour();

console.log('[DexEnhance] Popup loaded');
