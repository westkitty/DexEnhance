import {
  clearTextInInputElement,
  readTextFromInputElement,
  writeTextToInputElement,
} from './input-utils.js';

const SEND_ACK_TIMEOUT_MS = 2600;
const runtimeGlobal = typeof window !== 'undefined' ? window : globalThis;

function isElementLike(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof HTMLElement !== 'undefined') {
    return value instanceof HTMLElement;
  }
  return typeof value.addEventListener === 'function' && typeof value.removeEventListener === 'function';
}

function scheduleAnimationFrame(callback) {
  const raf = runtimeGlobal.requestAnimationFrame;
  if (typeof raf === 'function') {
    raf(callback);
    return;
  }
  runtimeGlobal.setTimeout(callback, 0);
}

function createQueueItem({ text, siteLabel, originModule = 'composer', target = 'chat-composer' }) {
  return {
    id: `dex-queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    type: 'message',
    originModule,
    target,
    siteLabel,
    createdAt: Date.now(),
    status: 'queued',
    attempts: 0,
    lastError: '',
    lastErrorAt: null,
  };
}

function cloneState(state) {
  return {
    ...state,
    items: state.items.map((item) => ({ ...item })),
    lastProcessedItem: state.lastProcessedItem ? { ...state.lastProcessedItem } : null,
    lastError: state.lastError ? { ...state.lastError } : null,
  };
}

function reorderByIndex(items, fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Wire queue interception and dequeue lifecycle to a chat adapter.
 * @param {{
 *  adapter: import('./chat-interface.js').ChatInterface,
 *  siteLabel: string,
 *  onQueueSizeChange?: (size: number) => void,
 *  onStateChange?: (state: ReturnType<setupQueueController['getState']>) => void,
 *  onQueueError?: (error: {module:string,operation:string,message:string,itemId?:string,at:number}) => void
 * }} options
 */
export function setupQueueController({ adapter, siteLabel, onQueueSizeChange, onStateChange, onQueueError }) {
  let generating = adapter.isGenerating();
  let paused = false;
  let textareaEl = null;
  let submitButtonEl = null;
  let items = [];
  let currentSendingId = '';
  let sendAckTimer = null;
  let lastProcessedItem = null;
  let lastError = null;
  const listeners = new Set();

  function clearSendAckTimer() {
    if (!sendAckTimer) return;
    runtimeGlobal.clearTimeout(sendAckTimer);
    sendAckTimer = null;
  }

  function getQueueSize() {
    return items.length;
  }

  function getState() {
    return cloneState({
      generating,
      paused,
      currentSendingId,
      items,
      lastProcessedItem,
      lastError,
    });
  }

  function emit() {
    const state = getState();
    if (typeof onQueueSizeChange === 'function') {
      onQueueSizeChange(state.items.length);
    }
    if (typeof onStateChange === 'function') {
      onStateChange(state);
    }
    for (const listener of listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error('[DexEnhance] Queue listener failed:', error);
      }
    }
  }

  function publishError(operation, message, itemId = '') {
    lastError = {
      module: `queue-controller:${siteLabel}`,
      operation,
      message,
      itemId,
      at: Date.now(),
    };
    if (typeof onQueueError === 'function') {
      onQueueError({ ...lastError });
    }
    emit();
  }

  function bindElements() {
    const nextTextarea = adapter.getTextarea();
    const nextSubmitButton = adapter.getSubmitButton();
    if (!isElementLike(nextTextarea) || !isElementLike(nextSubmitButton)) return;

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

  function enqueueText(text, originModule = 'composer') {
    const message = typeof text === 'string' ? text.trim() : '';
    if (!message) return null;
    const item = createQueueItem({
      text: message,
      siteLabel,
      originModule,
    });
    items = [...items, item];
    emit();
    return item;
  }

  function queueCurrentMessage() {
    if (!textareaEl) return false;
    const message = readTextFromInputElement(textareaEl);
    if (!message) return false;

    const item = enqueueText(message, 'composer_intercept');
    if (!item) return false;
    clearTextInInputElement(textareaEl);
    console.log(`[DexEnhance] ${siteLabel} queued message (${items.length} pending)`);
    return true;
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

  function markItemFailed(itemId, message) {
    items = items.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status: 'failed',
        attempts: (item.attempts || 0) + 1,
        lastError: message,
        lastErrorAt: Date.now(),
      };
    });
    currentSendingId = '';
    publishError('queue.send', message, itemId);
  }

  function completeSendingItem(itemId) {
    const sent = items.find((item) => item.id === itemId);
    if (!sent) {
      currentSendingId = '';
      emit();
      return;
    }
    lastProcessedItem = {
      ...sent,
      status: 'sent',
      sentAt: Date.now(),
    };
    items = items.filter((item) => item.id !== itemId);
    currentSendingId = '';
    emit();
  }

  function beginSending(item) {
    bindElements();
    if (!textareaEl || !submitButtonEl) {
      markItemFailed(item.id, 'Prompt input or submit control is not available.');
      return false;
    }

    const wrote = writeTextToInputElement(textareaEl, item.text);
    if (!wrote) {
      markItemFailed(item.id, 'Failed to write queued prompt into composer.');
      return false;
    }

    currentSendingId = item.id;
    items = items.map((value) => value.id === item.id
      ? { ...value, status: 'sending' }
      : value
    );
    emit();

    scheduleAnimationFrame(() => {
      submitButtonEl?.click();
      clearSendAckTimer();
      sendAckTimer = runtimeGlobal.setTimeout(() => {
        if (currentSendingId !== item.id) return;
        if (adapter.isGenerating()) return;
        markItemFailed(item.id, 'Send timeout: host did not enter generating state.');
      }, SEND_ACK_TIMEOUT_MS);
    });
    return true;
  }

  function pickNextItem(preferredItemId = '') {
    if (preferredItemId) {
      const preferred = items.find((item) => item.id === preferredItemId);
      if (preferred && (preferred.status === 'queued' || preferred.status === 'failed')) {
        return preferred;
      }
    }
    return items.find((item) => item.status === 'queued' || item.status === 'failed') || null;
  }

  function flushQueue({ force = false, itemId = '' } = {}) {
    if (generating) return;
    if (!force && paused) return;
    if (currentSendingId) return;

    const next = pickNextItem(itemId);
    if (!next) return;
    beginSending(next);
  }

  adapter.onGeneratingStart(() => {
    generating = true;
    clearSendAckTimer();
    if (currentSendingId) {
      completeSendingItem(currentSendingId);
    } else {
      emit();
    }
  });

  adapter.onGeneratingEnd(() => {
    generating = false;
    emit();
    flushQueue();
  });

  bindElements();
  emit();

  const rebindTimer = runtimeGlobal.setInterval(() => {
    bindElements();
  }, 1000);

  return {
    getQueueSize,
    getState,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      listener(getState());
      return () => listeners.delete(listener);
    },
    enqueue(text, originModule = 'manual') {
      return enqueueText(text, originModule);
    },
    editItem(id, nextText) {
      const message = typeof nextText === 'string' ? nextText.trim() : '';
      if (!message) return false;
      let updated = false;
      items = items.map((item) => {
        if (item.id !== id || item.status === 'sending') return item;
        updated = true;
        return {
          ...item,
          text: message,
          status: 'queued',
        };
      });
      if (updated) emit();
      return updated;
    },
    duplicateItem(id, nextText = '') {
      const source = items.find((item) => item.id === id);
      if (!source) return null;
      const text = typeof nextText === 'string' && nextText.trim() ? nextText.trim() : source.text;
      return enqueueText(text, source.originModule || 'duplicate');
    },
    moveItem(id, direction) {
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) return false;
      const delta = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      if (!delta) return false;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= items.length) return false;
      if (items[index].status === 'sending' || items[nextIndex].status === 'sending') return false;
      items = reorderByIndex(items, index, nextIndex);
      emit();
      return true;
    },
    removeItem(id) {
      const removed = items.find((item) => item.id === id);
      if (!removed) return null;
      if (currentSendingId === id) {
        clearSendAckTimer();
        currentSendingId = '';
      }
      items = items.filter((item) => item.id !== id);
      emit();
      return removed;
    },
    clearAll() {
      const removed = items.slice();
      items = [];
      currentSendingId = '';
      clearSendAckTimer();
      emit();
      return removed;
    },
    restoreItems(restoredItems) {
      if (!Array.isArray(restoredItems) || restoredItems.length === 0) return;
      const normalized = restoredItems
        .filter((item) => item && typeof item === 'object' && typeof item.text === 'string')
        .map((item) => ({
          ...item,
          status: 'queued',
          lastError: '',
          lastErrorAt: null,
          attempts: Number.isFinite(Number(item.attempts)) ? Number(item.attempts) : 0,
        }));
      if (normalized.length === 0) return;
      items = [...normalized, ...items];
      emit();
    },
    pause() {
      paused = true;
      emit();
    },
    resume() {
      paused = false;
      emit();
      flushQueue();
    },
    togglePause() {
      paused = !paused;
      emit();
      if (!paused) flushQueue();
      return paused;
    },
    retryItem(id) {
      const exists = items.some((item) => item.id === id);
      if (!exists) return false;
      items = items.map((item) => {
        if (item.id !== id || item.status === 'sending') return item;
        return {
          ...item,
          status: 'queued',
          lastError: '',
          lastErrorAt: null,
        };
      });
      emit();
      flushQueue({ itemId: id });
      return true;
    },
    sendNow(id = '') {
      flushQueue({ force: true, itemId: id });
    },
    flushQueue,
    destroy() {
      runtimeGlobal.clearInterval(rebindTimer);
      clearSendAckTimer();
      if (textareaEl) textareaEl.removeEventListener('keydown', onTextareaKeydown, true);
      if (submitButtonEl) submitButtonEl.removeEventListener('click', onSubmitClick, true);
      listeners.clear();
    },
  };
}
