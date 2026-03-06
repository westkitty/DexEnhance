import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ContextualHint } from './ContextualHint.jsx';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';

function formatTimestamp(value) {
  if (!Number.isFinite(Number(value))) return 'Unknown';
  const date = new Date(Number(value));
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function QueueManager({ queueController, siteLabel = '' }) {
  const [queueState, setQueueState] = useState(() => queueController?.getState?.() || {
    paused: false,
    items: [],
    lastProcessedItem: null,
    lastError: null,
  });
  const [expandedId, setExpandedId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editText, setEditText] = useState('');
  const lastErrorAtRef = useRef(0);

  useEffect(() => {
    if (!queueController?.subscribe) return undefined;
    return queueController.subscribe(setQueueState);
  }, [queueController]);

  useEffect(() => {
    const errorAt = Number(queueState?.lastError?.at || 0);
    if (!errorAt || errorAt === lastErrorAtRef.current) return;
    lastErrorAtRef.current = errorAt;
    const queueError = queueState.lastError;

    showDexToast({
      type: 'error',
      title: 'Queue processing failed',
      message: queueError.message || 'The queued prompt could not be sent.',
      details: `Operation: ${queueError.operation}\nItem: ${queueError.itemId || 'n/a'}\nTime: ${formatTimestamp(queueError.at)}`,
      diagnostics: buildDiagnostics({
        module: queueError.module || 'queue',
        operation: queueError.operation || 'queue.send',
        host: window.location.hostname,
        url: window.location.href,
        error: new Error(queueError.message || 'Queue processing failed'),
      }),
      actions: queueError.itemId
        ? [{
            label: 'Retry',
            onSelect: () => {
              queueController.retryItem(queueError.itemId);
              queueController.sendNow(queueError.itemId);
            },
          }]
        : [],
      durationMs: 12000,
    });
  }, [queueController, queueState?.lastError]);

  const items = Array.isArray(queueState?.items) ? queueState.items : [];
  const runningLabel = queueState?.paused ? 'Paused' : 'Running';

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) || null,
    [editingId, items]
  );

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text || '');
  };

  const commitEdit = () => {
    if (!editingItem) return;
    const nextText = editText.trim();
    if (!nextText) return;
    const didEdit = queueController.editItem(editingItem.id, nextText);
    if (didEdit) {
      showDexToast({ type: 'success', title: 'Queue item updated', message: 'Queued prompt text was updated.' });
    }
    setEditingId('');
    setEditText('');
  };

  const removeItemWithUndo = (itemId) => {
    const removed = queueController.removeItem(itemId);
    if (!removed) return;
    showDexToast({
      type: 'action',
      title: 'Queue item removed',
      message: 'Prompt removed from queue.',
      actions: [{
        label: 'Undo',
        onSelect: () => queueController.restoreItems([removed]),
      }],
      diagnostics: {
        module: 'queue-manager',
        operation: 'remove_item',
        itemId: removed.id,
        at: Date.now(),
      },
      durationMs: 6000,
    });
  };

  const clearAllWithUndo = () => {
    const removed = queueController.clearAll();
    if (!removed.length) return;
    showDexToast({
      type: 'action',
      title: 'Queue cleared',
      message: `${removed.length} queued item${removed.length === 1 ? '' : 's'} removed.`,
      actions: [{
        label: 'Undo',
        onSelect: () => queueController.restoreItems(removed),
      }],
      diagnostics: {
        module: 'queue-manager',
        operation: 'clear_all',
        removedCount: removed.length,
        at: Date.now(),
      },
      durationMs: 7000,
    });
  };

  return h('section', { class: 'dex-drawer-view dex-queue-manager', 'aria-label': 'Queue Manager' }, [
    h(ContextualHint, {
      hintId: 'queue-manager',
      visible: true,
      title: 'Queue hint',
      message: 'Pause queue processing before large edits. Use Send now to force immediate dispatch of a specific item.',
    }),
    h('div', { class: 'dex-queue-manager__head' }, [
      h('strong', null, 'Queue Manager'),
      h('span', { class: 'dex-folder-state' }, `${runningLabel} • ${items.length} queued • ${siteLabel}`),
    ]),
    queueState?.lastError
      ? h('div', { class: 'dex-inline-banner dex-inline-banner--error', role: 'alert' }, [
          h('strong', null, 'Most recent queue failure'),
          h('p', null, queueState.lastError.message || 'The queued prompt could not be sent.'),
          h('div', { class: 'dex-inline-banner__actions' }, [
            queueState.lastError.itemId
              ? h('button', {
                  type: 'button',
                  class: 'dex-link-btn',
                  onClick: () => {
                    queueController.retryItem(queueState.lastError.itemId);
                    queueController.sendNow(queueState.lastError.itemId);
                  },
                }, 'Retry')
              : null,
          ]),
        ])
      : null,
    h('div', { class: 'dex-folder-actions' }, [
      h('button', {
        type: 'button',
        class: `dex-link-btn${queueState?.paused ? ' dex-link-btn--accent' : ''}`,
        onClick: () => {
          const paused = queueController.togglePause();
          showDexToast({
            type: 'info',
            title: paused ? 'Queue paused' : 'Queue resumed',
            message: paused ? 'Queue processing is paused until resumed.' : 'Queue processing resumed.',
          });
        },
      }, queueState?.paused ? 'Resume' : 'Pause'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        disabled: items.length === 0,
        onClick: () => queueController.sendNow(),
      }, 'Send next'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn danger',
        disabled: items.length === 0,
        onClick: clearAllWithUndo,
      }, 'Clear all'),
    ]),
    items.length === 0
      ? h('p', { class: 'dex-folder-state' }, 'No queued prompts.')
      : h('div', { class: 'dex-queue-manager__list', role: 'list' },
          items.map((item, index) => h('article', {
            key: item.id,
            class: `dex-queue-item dex-queue-item--${item.status}`,
            role: 'listitem',
          }, [
            h('div', { class: 'dex-queue-item__head' }, [
              h('strong', null, `${index + 1}. ${item.type}`),
              h('span', { class: 'dex-folder-count' }, item.status),
            ]),
            h('div', { class: 'dex-folder-state' }, [
              `Origin: ${item.originModule} • Target: ${item.target} • ${siteLabel}`,
              h('br', null),
              `Queued: ${formatTimestamp(item.createdAt)}`,
            ]),
            editingId === item.id
              ? h('div', { class: 'dex-form' }, [
                  h('textarea', {
                    class: 'dex-textarea',
                    rows: 4,
                    value: editText,
                    onInput: (event) => setEditText(event.currentTarget.value),
                  }),
                  h('div', { class: 'dex-folder-actions' }, [
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn dex-link-btn--accent',
                      onClick: commitEdit,
                      disabled: !editText.trim(),
                    }, 'Save'),
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn',
                      onClick: () => {
                        setEditingId('');
                        setEditText('');
                      },
                    }, 'Cancel'),
                  ]),
                ])
              : h('p', { class: 'dex-prompt-card__body' }, item.text),
            h('div', { class: 'dex-folder-actions' }, [
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => setExpandedId(expandedId === item.id ? '' : item.id),
              }, expandedId === item.id ? 'Hide details' : 'Details'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => startEdit(item),
                disabled: item.status === 'sending',
              }, 'Edit'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => {
                  queueController.duplicateItem(item.id);
                  showDexToast({ type: 'success', title: 'Queue item duplicated', message: 'A duplicate queued item was added.' });
                },
              }, 'Duplicate'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => queueController.moveItem(item.id, 'up'),
                disabled: index === 0 || item.status === 'sending',
              }, 'Up'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => queueController.moveItem(item.id, 'down'),
                disabled: index === items.length - 1 || item.status === 'sending',
              }, 'Down'),
              item.status === 'failed'
                ? h('button', {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--accent',
                    onClick: () => {
                      queueController.retryItem(item.id);
                      queueController.sendNow(item.id);
                    },
                  }, 'Retry')
                : h('button', {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--accent',
                    onClick: () => queueController.sendNow(item.id),
                    disabled: queueState?.paused && item.status !== 'failed',
                  }, 'Send now'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn danger',
                onClick: () => removeItemWithUndo(item.id),
              }, 'Remove'),
            ]),
            expandedId === item.id ? h('pre', { class: 'dex-toast__details' }, JSON.stringify(item, null, 2)) : null,
          ]))
        ),
  ]);
}
