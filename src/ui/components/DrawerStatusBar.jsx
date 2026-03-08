import { h } from 'preact';

function formatTime(value) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return 'Never';
  return new Date(Number(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DrawerStatusBar({
  hostLabel = '',
  queueCount = 0,
  queuePaused = false,
  currentSendingId = '',
  tokenCount = null,
  tokenModel = '',
  tokenSource = '',
  tokenUpdatedAt = 0,
  adapterHealthy = true,
  workerHealthy = true,
}) {
  return h('footer', { class: 'dex-drawer-status', 'aria-label': 'DexEnhance status bar' }, [
    h('span', { class: 'dex-drawer-status__item' }, `Host: ${hostLabel || 'Unknown'}`),
    h('span', { class: 'dex-drawer-status__item' }, `Queue: ${currentSendingId ? 'Sending' : queuePaused ? 'Paused' : 'Running'} • ${queueCount}`),
    h('span', { class: 'dex-drawer-status__item' }, `Model: ${tokenModel || '—'}`),
    h('span', { class: 'dex-drawer-status__item' }, `Tokens: ${tokenCount != null ? tokenCount : '—'}`),
    h('span', { class: 'dex-drawer-status__item' }, `Source: ${tokenSource || '—'}`),
    h('span', { class: 'dex-drawer-status__item' }, `Updated: ${formatTime(tokenUpdatedAt)}`),
    h('span', { class: `dex-drawer-status__item${adapterHealthy && workerHealthy ? '' : ' is-warning'}` }, `Health: ${adapterHealthy && workerHealthy ? 'Nominal' : 'Attention'}`),
  ]);
}
