import { h } from 'preact';
import { useDraggable } from '../hooks/useDraggable.js';

function GripIcon() {
  return h('svg', {
    width: '14',
    height: '14',
    viewBox: '0 0 14 14',
    fill: 'currentColor',
    'aria-hidden': 'true',
    style: 'display:block;',
  }, [
    h('circle', { cx: '4', cy: '3', r: '1.2' }),
    h('circle', { cx: '4', cy: '7', r: '1.2' }),
    h('circle', { cx: '4', cy: '11', r: '1.2' }),
    h('circle', { cx: '10', cy: '3', r: '1.2' }),
    h('circle', { cx: '10', cy: '7', r: '1.2' }),
    h('circle', { cx: '10', cy: '11', r: '1.2' }),
  ]);
}

export function FAB({
  site,
  onAction,
  iconUrl = '',
  panelState,
  onPanelStateChange,
}) {
  const buttonSize = Math.max(46, Math.min(84, Number(panelState?.width || 56)));

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
        title: 'Drag to reposition',
        'aria-label': 'Drag to reposition DexEnhance button',
      },
      h(GripIcon, null)
    ),
    h('div', { class: 'dex-fab__dock' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'dex-fab__button',
          style: `width:${buttonSize}px;height:${buttonSize}px;`,
          onClick: () => onAction?.('home'),
          'aria-label': `Open DexEnhance Home on ${site}`,
        },
        iconUrl
          ? h('img', {
              src: iconUrl,
              alt: `${site} quick action`,
              class: 'dex-fab__icon',
              style: `width:${Math.max(20, Math.round(buttonSize * 0.48))}px;height:${Math.max(20, Math.round(buttonSize * 0.48))}px;`,
            })
          : h('svg', {
              width: '22', height: '22', viewBox: '0 0 24 24',
              fill: 'none', stroke: '#fff', 'stroke-width': '2.5',
              'stroke-linecap': 'round', 'aria-hidden': 'true',
            }, [
              h('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
              h('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
            ])
      ),
    ]),
  ]);
}
