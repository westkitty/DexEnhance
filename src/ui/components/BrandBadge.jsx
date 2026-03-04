import { h } from 'preact';

export function BrandBadge({ iconUrl = '', site = '', onClick }) {
  if (!iconUrl) return null;

  return h('button', {
    type: 'button',
    class: 'dex-brand-badge',
    title: site ? `DexEnhance active on ${site}` : 'DexEnhance active',
    'aria-label': 'DexEnhance status badge',
    onClick: () => onClick?.(),
  }, [
    h('img', {
      src: iconUrl,
      alt: 'DexEnhance',
      class: 'dex-brand-badge__img',
    }),
  ]);
}
