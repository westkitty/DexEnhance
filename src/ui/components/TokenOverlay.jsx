import { h } from 'preact';

export function TokenOverlay({ site, model, tokens, source, iconUrl = '', updatedAt = null }) {
  const sourceLabel = source || '—';
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return h('div', { class: 'dex-token-overlay', 'aria-label': 'DexEnhance Token Overlay' }, [
    h('div', { class: 'dex-token-overlay__title' }, [
      iconUrl
        ? h('img', {
            src: iconUrl,
            alt: 'DexEnhance',
            class: 'dex-token-overlay__icon',
          })
        : null,
      h('span', null, `Dex Tokens • ${site}`),
    ]),
    h('div', { class: 'dex-token-overlay__row' }, [
      h('span', { class: 'dex-sidebar__label' }, 'Model'),
      h('span', { class: 'dex-token-overlay__value' }, model || 'Unknown'),
    ]),
    h('div', { class: 'dex-token-overlay__row' }, [
      h('span', { class: 'dex-sidebar__label' }, 'Tokens'),
      h('span', { class: 'dex-token-overlay__value' }, tokens != null ? String(tokens) : '—'),
    ]),
    h('div', { class: 'dex-token-overlay__row' }, [
      h('span', { class: 'dex-sidebar__label' }, 'Source'),
      h('span', { class: 'dex-token-overlay__value' }, sourceLabel),
    ]),
    h('div', { class: 'dex-token-overlay__row' }, [
      h('span', { class: 'dex-sidebar__label' }, 'Updated'),
      h('span', { class: 'dex-token-overlay__value' }, updatedLabel),
    ]),
  ]);
}
