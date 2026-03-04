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
  const panelWidth = 316;
  const panelHeight = 364;

  const drag = useDraggable({
    initialPosition: {
      x: Number(panelState?.x || 220),
      y: Number(panelState?.y || 120),
    },
    disabled: zipping,
    getBounds: () => ({
      minX: 8,
      maxX: Math.max(8, window.innerWidth - panelWidth - 8),
      minY: 8,
      maxY: Math.max(8, window.innerHeight - panelHeight - 8),
    }),
    onPositionCommit: (nextPosition) => {
      onPanelStateCommit?.({
        ...panelState,
        x: nextPosition.x,
        y: nextPosition.y,
        width: panelWidth,
        height: panelHeight,
      });
    },
  });

  const zipStyle = useMemo(() => {
    if (!zipping) return '';
    const width = panelWidth;
    const height = panelHeight;
    const targetX = Number.isFinite(Number(zipTarget?.x)) ? Number(zipTarget.x) : drag.position.x;
    const targetY = Number.isFinite(Number(zipTarget?.y)) ? Number(zipTarget.y) : drag.position.y;
    const targetSize = Math.max(40, Number(zipTarget?.size || 62));
    const dx = targetX - drag.position.x + ((targetSize - width) / 2);
    const dy = targetY - drag.position.y + ((targetSize - height) / 2);
    const scale = Math.max(0.14, Math.min(1, targetSize / width));
    return `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${scale.toFixed(3)})`;
  }, [zipping, panelWidth, panelHeight, zipTarget?.x, zipTarget?.y, zipTarget?.size, drag.position.x, drag.position.y]);

  if (!visible) return null;

  const startDrag = (event) => {
    if (event?.button != null && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, input, select, textarea, a')) return;
    drag.startDrag(event);
  };

  return h('section', {
    class: `dex-welcome${zipping ? ' is-zipping' : ''}`,
    role: 'dialog',
    'aria-label': 'DexEnhance welcome',
    style: {
      left: `${Math.round(drag.position.x)}px`,
      top: `${Math.round(drag.position.y)}px`,
      width: `${panelWidth}px`,
      height: `${panelHeight}px`,
      opacity: panelOpacityValue(panelState?.opacity ?? 0.98),
      transform: zipStyle || undefined,
      zIndex: 2147483647,
    },
    onPointerDown: startDrag,
    onTransitionEnd: (event) => {
      if (!zipping) return;
      if (event?.propertyName !== 'transform') return;
      onZipTransitionEnd?.();
    },
  }, [
    h('div', { class: 'dex-welcome__body' }, [
      iconUrl
        ? h('div', { class: 'dex-welcome__logo-circle' }, [
            h('img', {
              src: iconUrl,
              alt: 'DexEnhance logo',
              class: 'dex-welcome__logo',
            }),
          ])
        : null,
      h('div', { class: 'dex-welcome__info' }, [
        h('strong', { class: 'dex-welcome__name' }, 'DexEnhance'),
        h('span', { class: 'dex-welcome__tagline' }, 'AI workflow assistant for ChatGPT + Gemini'),
      ]),
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
