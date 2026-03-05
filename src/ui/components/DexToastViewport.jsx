import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  copyDiagnosticsToClipboard,
  dismissDexToast,
  selectDexToastAction,
  subscribeDexToasts,
} from '../runtime/dex-toast-controller.js';

function ariaLiveLevel(type) {
  return type === 'error' ? 'assertive' : 'polite';
}

export function DexToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeDexToasts(setToasts);
  }, []);

  if (!toasts.length) return null;

  return h('div', { class: 'dex-toast-viewport', 'aria-label': 'DexEnhance notifications' },
    toasts.map((toast) => h(DexToastCard, { key: toast.id, toast }))
  );
}

function DexToastCard({ toast }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copyState, setCopyState] = useState('');

  const handleCopyDiagnostics = async () => {
    if (!toast.diagnostics) return;
    try {
      const copied = await copyDiagnosticsToClipboard(toast.diagnostics);
      setCopyState(copied ? 'Copied diagnostics' : 'Clipboard unavailable');
    } catch {
      setCopyState('Copy failed');
    }
    window.setTimeout(() => setCopyState(''), 1800);
  };

  return h('section', {
    class: `dex-toast dex-toast--${toast.type}`,
    role: 'status',
    'aria-live': ariaLiveLevel(toast.type),
    'aria-atomic': 'true',
  }, [
    h('div', { class: 'dex-toast__head' }, [
      h('strong', { class: 'dex-toast__title' }, toast.title || 'DexEnhance'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--panel',
        onClick: () => dismissDexToast(toast.id),
        'aria-label': 'Dismiss notification',
      }, 'Dismiss'),
    ]),
    toast.message
      ? h('p', { class: 'dex-toast__message' }, toast.message)
      : null,
    toast.actions?.length
      ? h('div', { class: 'dex-toast__actions' },
          toast.actions.map((action) => h('button', {
            key: action.id,
            type: 'button',
            class: 'dex-link-btn dex-link-btn--accent',
            onClick: () => selectDexToastAction(toast.id, action.id),
          }, action.label))
        )
      : null,
    toast.details || toast.diagnostics
      ? h('div', { class: 'dex-toast__details-wrap' }, [
          h('button', {
            type: 'button',
            class: 'dex-link-btn',
            onClick: () => setDetailsOpen((value) => !value),
            'aria-expanded': detailsOpen ? 'true' : 'false',
          }, detailsOpen ? 'Hide details' : 'Details'),
          toast.diagnostics
            ? h('button', {
              type: 'button',
              class: 'dex-link-btn',
              onClick: handleCopyDiagnostics,
            }, copyState || 'Copy diagnostics')
            : null,
          detailsOpen
            ? h('pre', { class: 'dex-toast__details' }, toast.details || JSON.stringify(toast.diagnostics, null, 2))
            : null,
        ])
      : null,
  ]);
}
