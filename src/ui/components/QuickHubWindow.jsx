import { h } from 'preact';
import { WindowFrame } from './WindowFrame.jsx';

function statusTone(value) {
  switch (value) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    default:
      return 'neutral';
  }
}

export function QuickHubWindow({
  visible,
  panelState,
  collapsed = false,
  pinned = false,
  siteLabel = '',
  promptCount = 0,
  queueCount = 0,
  queueState = 'idle',
  semanticCount = 0,
  currentFolderLabel = '',
  tokenLabel = '',
  onPanelStateCommit,
  onToggleCollapse,
  onTogglePin,
  onClose,
  onOpenView,
  onQueueSendNext,
  onQueueClear,
  onOpenCanvas,
  onOpenTour,
}) {
  const queueTone = queueState === 'error' ? 'error' : queueState === 'sending' ? 'warning' : queueCount > 0 ? 'success' : 'neutral';
  return h(WindowFrame, {
    visible,
    panelId: 'quick-hub',
    title: 'DexEnhance Hub',
    subtitle: siteLabel ? `Active on ${siteLabel}` : '',
    panelState,
    collapsed,
    pinned,
    onPanelStateCommit,
    onToggleCollapse,
    onTogglePin,
    onClose,
  }, h('div', { class: 'dex-quickhub' }, [
    h('div', { class: 'dex-quickhub__grid' }, [
      h('article', { class: `dex-status-card dex-status-card--${statusTone(queueTone)}` }, [
        h('strong', null, 'Queue'),
        h('span', { class: 'dex-status-card__value' }, `${queueCount} pending`),
        h('p', { class: 'dex-folder-state' }, `State: ${queueState}`),
        h('div', { class: 'dex-folder-actions' }, [
          h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onOpenView?.('queue') }, 'Open Queue'),
          h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onQueueSendNext?.(), disabled: queueCount === 0 }, 'Send Next'),
          h('button', { type: 'button', class: 'dex-link-btn danger', onClick: () => onQueueClear?.(), disabled: queueCount === 0 }, 'Clear'),
        ]),
      ]),
      h('article', { class: 'dex-status-card dex-status-card--neutral' }, [
        h('strong', null, 'Prompts'),
        h('span', { class: 'dex-status-card__value' }, `${promptCount} templates`),
        h('p', { class: 'dex-folder-state' }, 'Prompt library, variables, queue, and send actions.'),
        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onOpenView?.('prompts') }, 'Open Prompts'),
      ]),
      h('article', { class: 'dex-status-card dex-status-card--neutral' }, [
        h('strong', null, 'Context'),
        h('span', { class: 'dex-status-card__value' }, `${semanticCount} chunks`),
        h('p', { class: 'dex-folder-state' }, semanticCount > 0 ? 'Semantic clipboard is ready for query and insert.' : 'Nothing ingested yet.'),
        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onOpenView?.('context') }, 'Open Context'),
      ]),
      h('article', { class: 'dex-status-card dex-status-card--neutral' }, [
        h('strong', null, 'Workspace'),
        h('span', { class: 'dex-status-card__value' }, currentFolderLabel || 'Unassigned'),
        h('p', { class: 'dex-folder-state' }, 'Current chat assignment, folder tree, trash, restore, and delete forever.'),
        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onOpenView?.('prompts', { promptSection: 'folders' }) }, 'Open Workspace'),
      ]),
    ]),
    h('div', { class: 'dex-quickhub__footer-actions' }, [
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenView?.('optimizer') }, 'Optimizer'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenView?.('export') }, 'Export'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenCanvas?.() }, 'Code Canvas'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenTour?.() }, 'Quick Tour'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenView?.('settings') }, 'Settings'),
      tokenLabel ? h('span', { class: 'dex-status-chip' }, tokenLabel) : null,
    ]),
  ]));
}
