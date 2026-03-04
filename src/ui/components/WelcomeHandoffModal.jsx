import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import { panelOpacityValue } from '../../lib/ui-settings.js';
import { useDraggable } from '../hooks/useDraggable.js';

export function WelcomeHandoffModal({
  visible,
  zipping = false,
  iconUrl = '',
  panelState,
  zipTarget,
  onPanelStateCommit,
  onGetStarted,
  onZipTransitionEnd,
}) {
  const drag = useDraggable({
    initialPosition: {
      x: Number(panelState?.x || 220),
      y: Number(panelState?.y || 120),
    },
    disabled: zipping,
    getBounds: () => ({
      minX: 8,
      maxX: Math.max(8, window.innerWidth - Number(panelState?.width || 320) - 8),
      minY: 8,
      maxY: Math.max(8, window.innerHeight - Number(panelState?.height || 190) - 8),
    }),
    onPositionCommit: (nextPosition) => {
      onPanelStateCommit?.({
        ...panelState,
        x: nextPosition.x,
        y: nextPosition.y,
      });
    },
  });

  const zipStyle = useMemo(() => {
    if (!zipping) return '';
    const width = Math.max(240, Number(panelState?.width || 320));
    const height = Math.max(150, Number(panelState?.height || 190));
    const targetX = Number.isFinite(Number(zipTarget?.x)) ? Number(zipTarget.x) : drag.position.x;
    const targetY = Number.isFinite(Number(zipTarget?.y)) ? Number(zipTarget.y) : drag.position.y;
    const targetSize = Math.max(40, Number(zipTarget?.size || 62));
    const dx = targetX - drag.position.x + ((targetSize - width) / 2);
    const dy = targetY - drag.position.y + ((targetSize - height) / 2);
    const scale = Math.max(0.14, Math.min(1, targetSize / width));
    return `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${scale.toFixed(3)})`;
  }, [zipping, panelState?.width, panelState?.height, zipTarget?.x, zipTarget?.y, zipTarget?.size, drag.position.x, drag.position.y]);

  if (!visible) return null;

  return h('section', {
    class: `dex-welcome${zipping ? ' is-zipping' : ''}`,
    style: {
      left: `${Math.round(drag.position.x)}px`,
      top: `${Math.round(drag.position.y)}px`,
      width: `${Math.max(240, Number(panelState?.width || 320))}px`,
      minHeight: `${Math.max(150, Number(panelState?.height || 190))}px`,
      opacity: panelOpacityValue(panelState?.opacity ?? 0.98),
      transform: zipStyle || undefined,
      zIndex: 2147483647,
    },
    onTransitionEnd: (event) => {
      if (!zipping) return;
      if (event?.propertyName !== 'transform') return;
      onZipTransitionEnd?.();
    },
  }, [
    h('header', {
      class: 'dex-welcome__header',
      onPointerDown: drag.startDrag,
    }, [
      h('span', { class: 'dex-welcome__title' }, 'DexEnhance'),
      h('span', { class: 'dex-welcome__drag' }, 'Drag'),
    ]),
    h('div', { class: 'dex-welcome__body' }, [
      iconUrl
        ? h('img', {
            src: iconUrl,
            alt: 'DexEnhance',
            class: 'dex-welcome__logo',
          })
        : null,
      h('p', { class: 'dex-welcome__copy' }, 'DexEnhance starts unobtrusive. Use Quick Action as your primary anchor.'),
      h(
        'button',
        {
          type: 'button',
          class: 'dex-link-btn dex-link-btn--accent dex-welcome__cta',
          disabled: zipping,
          onClick: () => onGetStarted?.(),
        },
        'Get Started'
      ),
    ]),
  ]);
}
