import { createQueue } from './queue.js';
import {
  clearTextInInputElement,
  readTextFromInputElement,
  writeTextToInputElement,
} from './input-utils.js';

/**
 * Wire queue interception and dequeue lifecycle to a chat adapter.
 * @param {{
 *  adapter: import('./chat-interface.js').ChatInterface,
 *  siteLabel: string,
 *  onQueueSizeChange?: (size: number) => void
 * }} options
 */
export function setupQueueController({ adapter, siteLabel, onQueueSizeChange }) {
  const queue = createQueue();
  let generating = adapter.isGenerating();
  let textareaEl = null;
  let submitButtonEl = null;

  function emitSize() {
    if (typeof onQueueSizeChange === 'function') {
      onQueueSizeChange(queue.size());
    }
  }

  function queueCurrentMessage() {
    if (!textareaEl) return false;
    const message = readTextFromInputElement(textareaEl);
    if (!message) return false;

    queue.enqueue(message);
    clearTextInInputElement(textareaEl);
    emitSize();
    console.log(`[DexEnhance] ${siteLabel} queued message (${queue.size()} pending)`);
    return true;
  }

  function bindElements() {
    const nextTextarea = adapter.getTextarea();
    const nextSubmitButton = adapter.getSubmitButton();
    if (!(nextTextarea instanceof HTMLElement) || !(nextSubmitButton instanceof HTMLElement)) return;

    if (textareaEl !== nextTextarea) {
      if (textareaEl) {
        textareaEl.removeEventListener('keydown', onTextareaKeydown, true);
      }
      textareaEl = nextTextarea;
      textareaEl.addEventListener('keydown', onTextareaKeydown, true);
    }

    if (submitButtonEl !== nextSubmitButton) {
      if (submitButtonEl) {
        submitButtonEl.removeEventListener('click', onSubmitClick, true);
      }
      submitButtonEl = nextSubmitButton;
      submitButtonEl.addEventListener('click', onSubmitClick, true);
    }
  }

  function onTextareaKeydown(event) {
    const shouldIntercept = event.key === 'Enter' && !event.shiftKey;
    if (!shouldIntercept || !generating) return;

    const didQueue = queueCurrentMessage();
    if (!didQueue) return;

    event.preventDefault();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    event.stopPropagation();
  }

  function onSubmitClick(event) {
    if (!generating) return;
    const didQueue = queueCurrentMessage();
    if (!didQueue) return;

    event.preventDefault();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    event.stopPropagation();
  }

  function flushQueue() {
    if (generating || queue.isEmpty()) return;
    bindElements();
    if (!textareaEl || !submitButtonEl) return;

    const nextMessage = queue.dequeue();
    if (!nextMessage) return;
    writeTextToInputElement(textareaEl, nextMessage);
    emitSize();

    requestAnimationFrame(() => {
      submitButtonEl?.click();
      console.log(`[DexEnhance] ${siteLabel} auto-sent queued message (${queue.size()} remaining)`);
    });
  }

  adapter.onGeneratingStart(() => {
    generating = true;
  });

  adapter.onGeneratingEnd(() => {
    generating = false;
    flushQueue();
  });

  bindElements();
  emitSize();

  const rebindTimer = window.setInterval(() => {
    bindElements();
  }, 1000);

  return {
    getQueueSize() {
      return queue.size();
    },
    flushQueue,
    destroy() {
      window.clearInterval(rebindTimer);
      if (textareaEl) textareaEl.removeEventListener('keydown', onTextareaKeydown, true);
      if (submitButtonEl) submitButtonEl.removeEventListener('click', onSubmitClick, true);
    },
  };
}
