import { h } from 'preact';
import { useDraggable } from '../hooks/useDraggable.js';

export function FAB({ site, onAction, iconUrl = '', panelState, onPanelStateChange }) {
  const buttonSize = Math.max(52, Math.min(96, Number(panelState?.width || 62)));

  const drag = useDraggable({
    initialPosition: {
      x: Number(panelState?.x || 18),
      y: Number(panelState?.y || (window.innerHeight - 78)),
    },
    getBounds: () => ({
      minX: 8,
      maxX: Math.max(8, window.innerWidth - buttonSize - 8),
      minY: 8,
      maxY: Math.max(8, window.innerHeight - buttonSize - 8),
    }),
    onPositionCommit: (nextPosition) => {
      onPanelStateChange?.({
        ...panelState,
        pinned: false,
        x: nextPosition.x,
        y: nextPosition.y,
      });
    },
  });

  const style = {
    left: `${Math.round(drag.position.x)}px`,
    top: `${Math.round(drag.position.y)}px`,
    opacity: Number.isFinite(Number(panelState?.opacity)) ? Number(panelState.opacity) : 1,
  };

  return h('div', { class: 'dex-fab dex-fab--floating', style, 'aria-label': 'DexEnhance Quick Action' }, [
    h(
      'button',
      {
        type: 'button',
        class: 'dex-fab__drag',
        onPointerDown: drag.startDrag,
        title: 'Drag quick action button',
        'aria-label': 'Drag quick action button',
      },
      '⋮⋮'
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'dex-fab__button',
        style: `width:${buttonSize}px;height:${buttonSize}px;`,
        onClick: () => onAction?.('hub'),
        'aria-label': `Open DexEnhance quick hub on ${site}`,
      },
      iconUrl
        ? h('img', {
            src: iconUrl,
            alt: `${site} quick action`,
            class: 'dex-fab__icon',
            style: `width:${Math.max(24, Math.round(buttonSize * 0.5))}px;height:${Math.max(24, Math.round(buttonSize * 0.5))}px;`,
          })
        : '+'
    ),
  ]);
}
