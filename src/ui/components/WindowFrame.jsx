import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { panelOpacityValue } from '../../lib/ui-settings.js';
import { useDraggable } from '../hooks/useDraggable.js';

export function WindowFrame({
  visible,
  panelId = 'window',
  title = 'DexEnhance',
  subtitle = '',
  panelState,
  collapsed = false,
  pinned = false,
  onPanelStateCommit,
  onClose,
  onToggleCollapse,
  onTogglePin,
  children,
  footer = null,
}) {
  const width = Math.max(280, Number(panelState?.width || 360));
  const height = Math.max(120, Number(panelState?.height || 280));
  const resizeRef = useRef(null);
  const [liveSize, setLiveSize] = useState({ width, height });

  const drag = useDraggable({
    initialPosition: {
      x: Number(panelState?.x || 48),
      y: Number(panelState?.y || 48),
    },
    disabled: pinned,
    getBounds: () => ({
      minX: 8,
      maxX: Math.max(8, window.innerWidth - liveSize.width - 8),
      minY: 8,
      maxY: Math.max(8, window.innerHeight - (collapsed ? 64 : liveSize.height) - 8),
    }),
    onPositionCommit: (nextPosition) => {
      onPanelStateCommit?.({
        ...panelState,
        ...liveSize,
        x: nextPosition.x,
        y: nextPosition.y,
      });
    },
  });

  useEffect(() => {
    setLiveSize({ width, height });
  }, [width, height]);

  useEffect(() => {
    if (!visible || !(resizeRef.current instanceof HTMLElement) || pinned) return undefined;
    const handle = resizeRef.current;

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = liveSize.width;
      const startHeight = liveSize.height;

      const onMove = (moveEvent) => {
        const nextWidth = Math.max(280, Math.min(window.innerWidth - drag.position.x - 8, startWidth + (moveEvent.clientX - startX)));
        const nextHeight = Math.max(160, Math.min(window.innerHeight - drag.position.y - 8, startHeight + (moveEvent.clientY - startY)));
        setLiveSize({
          width: nextWidth,
          height: nextHeight,
        });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);
        onPanelStateCommit?.({
          ...panelState,
          x: drag.position.x,
          y: drag.position.y,
          width: liveSize.width,
          height: liveSize.height,
        });
      };

      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
    };

    handle.addEventListener('pointerdown', onPointerDown);
    return () => handle.removeEventListener('pointerdown', onPointerDown);
  }, [drag.position.x, drag.position.y, liveSize.height, liveSize.width, onPanelStateCommit, panelState, pinned, visible]);

  if (!visible) return null;

  return h('section', {
    class: `dex-window-frame dex-window-frame--${panelId}${collapsed ? ' is-collapsed' : ''}${pinned ? ' is-pinned' : ''}`,
    role: 'dialog',
    'aria-label': title,
    style: {
      left: `${Math.round(drag.position.x)}px`,
      top: `${Math.round(drag.position.y)}px`,
      width: `${Math.round(liveSize.width)}px`,
      height: collapsed ? 'auto' : `${Math.round(liveSize.height)}px`,
      opacity: panelOpacityValue(panelState?.opacity ?? 1),
      zIndex: 2147483605,
    },
  }, [
    h('header', {
      class: 'dex-window-frame__header',
      onPointerDown: (event) => {
        if (event.target instanceof Element && event.target.closest('button')) return;
        drag.startDrag(event);
      },
    }, [
      h('div', { class: 'dex-window-frame__headings' }, [
        h('strong', { class: 'dex-window-frame__title' }, title),
        subtitle ? h('span', { class: 'dex-window-frame__subtitle' }, subtitle) : null,
      ]),
      h('div', { class: 'dex-window-frame__actions' }, [
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          'aria-label': pinned ? `Unpin ${title}` : `Pin ${title}`,
          onClick: () => onTogglePin?.(),
        }, pinned ? 'Unpin' : 'Pin'),
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          'aria-label': collapsed ? `Expand ${title}` : `Collapse ${title}`,
          onClick: () => onToggleCollapse?.(),
        }, collapsed ? 'Expand' : 'Collapse'),
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          'aria-label': `Close ${title}`,
          onClick: () => onClose?.(),
        }, 'Close'),
      ]),
    ]),
    collapsed
      ? null
      : h('div', { class: 'dex-window-frame__body' }, children),
    !collapsed && footer ? h('footer', { class: 'dex-window-frame__footer' }, footer) : null,
    !collapsed && !pinned
      ? h('button', {
          ref: resizeRef,
          type: 'button',
          class: 'dex-window-frame__resize',
          'aria-label': `Resize ${title}`,
        })
      : null,
  ]);
}
