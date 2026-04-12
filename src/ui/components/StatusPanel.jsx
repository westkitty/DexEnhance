import { h } from 'preact';
import { PersonaAvatar } from './PersonaAvatar.jsx';

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
  model = 'dex',
  isGenerating = false,
}) {
  const modules = featureSettings?.modules || {};
  const checking = adapterHealth?.settled === false && adapterHealth?.healthy === false;
  const healthLabel = checking ? 'Checking' : (adapterHealth?.healthy ? 'Healthy' : 'Attention');
  const healthClass = checking ? ' warn' : (adapterHealth?.healthy ? '' : ' danger');
  const showBanner = !checking && adapterHealth?.healthy === false;
  const bannerText = 'Host adapter mismatch detected. Run diagnostics or re-inject UI.';

  return h('section', { class: 'dex-status-panel', 'aria-label': 'DexEnhance Status' }, [
    h('header', { class: 'dex-status-panel__head', style: { marginBottom: '24px' } }, [
      h('div', { class: 'dex-status-panel__persona' }, [
        h(PersonaAvatar, { model, isGenerating, size: 'large' }),
        h('div', null, [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
            h('strong', { style: { fontSize: '18px' } }, model.toUpperCase()),
            h('span', { class: `dex-tag ${adapterHealth?.healthy ? 'dex-tag--success' : 'dex-tag--warn'}` }, healthLabel),
          ]),
          h('div', { class: 'dex-form__hint' }, isGenerating ? 'Computing responses…' : 'Awaiting your command.'),
        ]),
      ]),
    ]),

    showBanner && h('div', { class: 'dex-toast dex-toast--warning', style: { marginBottom: '16px' } }, [
      h('div', { class: 'dex-toast__message' }, bannerText),
    ]),

    h('div', { class: 'dex-status-card-grid' }, [
      h('div', { class: 'dex-status-card dex-status-card--glow' }, [
        h('span', { class: 'dex-status-card__label' }, 'Host System'),
        h('strong', { class: 'dex-status-card__value' }, hostLabel || 'Unknown'),
      ]),
      h('div', { class: 'dex-status-card' }, [
        h('span', { class: 'dex-status-card__label' }, 'UI Sync'),
        h('strong', { class: 'dex-status-card__value' }, adapterHealth?.uiInjected ? '✅ Linked' : '❌ Failed'),
      ]),
      h('div', { class: 'dex-status-card' }, [
        h('span', { class: 'dex-status-card__label' }, 'Prompt Queue'),
        h('strong', { class: 'dex-status-card__value' }, `${queueState?.items?.length || 0} active`),
      ]),
      h('div', { class: 'dex-status-card' }, [
        h('span', { class: 'dex-status-card__label' }, 'Tokens Cached'),
        h('strong', { class: 'dex-status-card__value' }, tokenState?.count != null ? `🪙 ${tokenState.count}` : '---'),
      ]),
    ]),

    h('div', { class: 'dex-status-modules', style: { marginTop: '24px' } }, [
      h('label', { class: 'dex-sidebar__label' }, 'Active Modules'),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' } },
        Object.entries(modules).map(([id, config]) => 
          h('span', { 
            class: `dex-tag ${config?.enabled === true ? 'is-active' : ''}`, 
            style: { opacity: config?.enabled === true ? 1 : 0.4 } 
          }, id)
        )
      ),
    ]),

    h('div', { class: 'dex-folder-actions', style: { marginTop: '24px' } }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        onClick: () => onCopyDiagnostics?.(),
      }, 'Export Diagnostics'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onReinjectUi?.(),
      }, 'Refresh Bridge'),
    ]),
  ]);
}
