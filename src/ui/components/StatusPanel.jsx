import { h } from 'preact';

function timeLabel(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Never';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function boolLabel(value) {
  return value ? 'Yes' : 'No';
}

export function StatusPanel({
  hostLabel = '',
  adapterHealth,
  workerHealth,
  queueState,
  tokenState,
  featureSettings,
  onCopyDiagnostics,
  onReinjectUi,
  onReloadAdapter,
}) {
  const modules = featureSettings?.modules || {};
  const checking = adapterHealth?.settled === false && adapterHealth?.healthy === false;
  const healthLabel = checking ? 'Checking' : (adapterHealth?.healthy ? 'Healthy' : 'Attention');
  const healthClass = checking ? ' warn' : (adapterHealth?.healthy ? '' : ' danger');
  const showBanner = !checking && adapterHealth?.healthy === false;
  const bannerText = 'Host adapter mismatch detected. Run diagnostics or re-inject UI.';

  return h('section', { class: 'dex-status-panel', 'aria-label': 'DexEnhance Status' }, [
    h('header', { class: 'dex-status-panel__head' }, [
      h('strong', null, 'Status'),
      h('span', { class: `dex-folder-count${healthClass}` }, healthLabel),
    ]),

    showBanner
      ? h('div', { class: 'dex-status-banner', role: 'status' }, bannerText)
      : null,

    h('div', { class: 'dex-status-grid' }, [
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Host'), h('strong', null, hostLabel || 'Unknown')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'UI injected'), h('strong', null, boolLabel(adapterHealth?.uiInjected))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Textarea selector'), h('strong', null, boolLabel(adapterHealth?.hasTextarea))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Submit selector'), h('strong', null, boolLabel(adapterHealth?.hasSubmitButton))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Chat list selector'), h('strong', null, boolLabel(adapterHealth?.hasChatList))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Adapter note'), h('strong', null, adapterHealth?.reason || 'None')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Adapter check'), h('strong', null, timeLabel(adapterHealth?.lastCheckedAt))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Worker ping'), h('strong', null, timeLabel(workerHealth?.lastPingAt))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Worker failure'), h('strong', null, timeLabel(workerHealth?.lastFailureAt))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Queue mode'), h('strong', null, queueState?.paused ? 'Paused' : 'Running')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Queue count'), h('strong', null, String(queueState?.items?.length || 0))]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Queue last item'), h('strong', null, queueState?.lastProcessedItem?.id || 'None')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Queue last error'), h('strong', null, queueState?.lastError?.message || 'None')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Token source'), h('strong', null, tokenState?.source || 'None')]),
      h('div', { class: 'dex-status-row' }, [h('span', null, 'Token refresh'), h('strong', null, timeLabel(tokenState?.updatedAt))]),
    ]),

    h('div', { class: 'dex-status-modules' }, [
      h('strong', null, 'Modules'),
      h('div', { class: 'dex-folder-state' },
        Object.entries(modules).map(([id, config]) => `${id}: ${config?.enabled === true ? 'on' : 'off'}`).join(' • ')
      ),
    ]),

    h('div', { class: 'dex-folder-actions' }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onCopyDiagnostics?.(),
      }, 'Copy diagnostics'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onReinjectUi?.(),
      }, 'Re-inject UI'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onReloadAdapter?.(),
      }, 'Reload adapter'),
    ]),
  ]);
}
