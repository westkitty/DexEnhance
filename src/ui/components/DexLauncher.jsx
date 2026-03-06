import { h } from 'preact';

export function DexLauncher({
  site = '',
  iconUrl = '',
  panelState,
  queueSize = 0,
  onOpenPalette,
  onOpenLastView,
}) {
  const size = Math.max(54, Math.min(84, Number(panelState?.width || 64)));
  const style = {
    left: `${Math.round(Number(panelState?.x || (window.innerWidth - size - 18)))}px`,
    top: `${Math.round(Number(panelState?.y || (window.innerHeight - size - 18)))}px`,
    width: `${size}px`,
    height: `${size}px`,
  };

  return h('div', { class: 'dex-launcher', style }, [
    h('button', {
      type: 'button',
      class: 'dex-launcher__button',
      'aria-label': `Open DexEnhance command palette on ${site}`,
      title: 'Open DexEnhance command palette',
      onClick: (event) => {
        if (event.shiftKey) {
          onOpenLastView?.();
          return;
        }
        onOpenPalette?.();
      },
    }, [
      iconUrl
        ? h('img', {
            src: iconUrl,
            alt: 'DexEnhance',
            class: 'dex-launcher__icon',
          })
        : h('span', { class: 'dex-launcher__fallback', 'aria-hidden': 'true' }, 'D'),
      queueSize > 0
        ? h('span', { class: 'dex-launcher__badge', 'aria-label': `${queueSize} queued item${queueSize === 1 ? '' : 's'}` }, String(queueSize))
        : null,
    ]),
    h('button', {
      type: 'button',
      class: 'dex-launcher__peek',
      'aria-label': 'Open last drawer view',
      title: 'Open last drawer view',
      onClick: () => onOpenLastView?.(),
    }, 'Open'),
  ]);
}
