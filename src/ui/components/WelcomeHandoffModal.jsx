import { h } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
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
  const ctaRef = useRef(null);

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

  useEffect(() => {
    if (!visible || zipping) return;
    window.setTimeout(() => ctaRef.current?.focus(), 0);
  }, [visible, zipping]);

  const zipStyle = useMemo(() => {
    if (!zipping) return '';
    const targetX = Number.isFinite(Number(zipTarget?.x)) ? Number(zipTarget.x) : drag.position.x;
    const targetY = Number.isFinite(Number(zipTarget?.y)) ? Number(zipTarget.y) : drag.position.y;
    const targetSize = Math.max(40, Number(zipTarget?.size || 64));
    const dx = targetX - drag.position.x + ((targetSize - panelWidth) / 2);
    const dy = targetY - drag.position.y + ((targetSize - panelHeight) / 2);
    const scale = Math.max(0.14, Math.min(1, targetSize / panelWidth));
    return `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${scale.toFixed(3)})`;
  }, [drag.position.x, drag.position.y, zipTarget?.size, zipTarget?.x, zipTarget?.y, zipping]);

  if (!visible) return null;

  const startDrag = (event) => {
    if (event?.button != null && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, input, select, textarea, a')) return;
    drag.startDrag(event);
  };

  return h('section', {
    class: `dex-welcome${zipping ? ' is-zipping' : ''}`,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'DexEnhance welcome',
    style: {
      left: `${Math.round(drag.position.x)}px`,
      top: `${Math.round(drag.position.y)}px`,
      width: `${panelWidth}px`,
      height: `${panelHeight}px`,
      opacity: panelOpacityValue(panelState?.opacity ?? 1),
      transform: zipStyle || undefined,
      zIndex: 2147483647,
    },
    onPointerDown: startDrag,
    onTransitionEnd: (event) => {
      if (!zipping || event?.propertyName !== 'transform') return;
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
        h('span', { class: 'dex-welcome__tagline' }, [
          h('span', { class: 'dex-welcome__tagline-line' }, 'AI workflow assistant for'),
          h('span', { class: 'dex-welcome__tagline-line is-strong' }, 'ChatGPT + Gemini'),
        ]),
      ]),
      h('p', { class: 'dex-welcome__copy' }, 'Run everything through one command surface. No floating clutter. No context loss.'),
      h('button', {
        ref: ctaRef,
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent dex-welcome__cta',
        disabled: zipping,
        onClick: () => onGetStarted?.(),
      }, 'Get Started'),
    ]),
  ]);
}
