import { h } from 'preact';

export function DexBrandMark({
  iconUrl = '',
  mode = 'header',
  opacity = 0.3,
  label = 'DexEnhance',
}) {
  if (!iconUrl) return null;

  if (mode === 'watermark') {
    return h('div', {
      class: 'dex-brandmark-watermark',
      'aria-hidden': 'true',
      style: `--dex-brandmark-opacity:${Math.max(0, Math.min(0.3, Number(opacity) || 0.3)).toFixed(2)};`,
    }, [
      h('img', {
        src: iconUrl,
        alt: '',
        class: 'dex-brandmark-watermark__img',
      }),
    ]);
  }

  return h('div', { class: 'dex-brandmark-header' }, [
    h('img', {
      src: iconUrl,
      alt: `${label} logo`,
      class: 'dex-brandmark-header__img',
    }),
    h('strong', { class: 'dex-brandmark-header__label' }, label),
  ]);
}
