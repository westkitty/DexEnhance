import { h } from 'preact';

function formatUpdatedAt(value) {
  if (!Number.isFinite(Number(value))) return 'No recent update';
  return new Date(Number(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TokenOverlay({
  visible,
  model = '',
  tokens = null,
  source = '',
  updatedAt = 0,
  mode = 'compact',
  hasData = false,
  onToggleMode,
}) {
  if (!visible) return null;

  const compact = mode !== 'expanded';

  return h('aside', {
    class: `dex-token-overlay${compact ? ' is-compact' : ''}`,
    role: 'status',
    'aria-live': 'polite',
    'aria-label': 'DexEnhance token and model overlay',
  }, [
    h('div', { class: 'dex-token-overlay__head' }, [
      h('strong', null, 'Tokens'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onToggleMode?.(compact ? 'expanded' : 'compact'),
        'aria-label': compact ? 'Expand token overlay' : 'Collapse token overlay',
      }, compact ? 'Expand' : 'Compact'),
    ]),
    hasData
      ? h('div', { class: 'dex-token-overlay__body' }, [
          h('div', { class: 'dex-status-row' }, [h('span', null, 'Model'), h('strong', null, model || 'Unknown')]),
          h('div', { class: 'dex-status-row' }, [h('span', null, 'Tokens'), h('strong', null, tokens != null ? String(tokens) : 'Estimating…')]),
          compact ? null : h('div', { class: 'dex-status-row' }, [h('span', null, 'Source'), h('strong', null, source || 'Bridge')]),
          compact ? null : h('div', { class: 'dex-status-row' }, [h('span', null, 'Updated'), h('strong', null, formatUpdatedAt(updatedAt))]),
        ])
      : h('p', { class: 'dex-folder-state' }, 'No token metadata yet. DexEnhance will show model and counts when the host exposes them.'),
  ]);
}
