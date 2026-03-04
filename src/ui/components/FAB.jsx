import { h } from 'preact';
import { useState } from 'preact/hooks';

function isPrimaryPointer(event) {
  return event.button === 0 || event.buttons === 1;
}

export function FAB({ site, onAction, iconUrl = '', panelState, onPanelStateChange }) {
  const [open, setOpen] = useState(false);
  const buttonSize = Math.max(52, Math.min(96, Number(panelState?.width || 62)));

  const style = {
    left: `${Math.round(panelState?.x || 18)}px`,
    top: `${Math.round(panelState?.y || (window.innerHeight - 78))}px`,
    opacity: Number.isFinite(Number(panelState?.opacity)) ? Number(panelState.opacity) : 1,
  };

  function startDrag(event) {
    if (!isPrimaryPointer(event)) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = Number(panelState?.x || 18);
    const initialY = Number(panelState?.y || (window.innerHeight - 78));
    const edgePadding = Math.round(buttonSize + 8);

    const onMove = (moveEvent) => {
      const nextX = Math.max(8, Math.min(window.innerWidth - edgePadding, initialX + (moveEvent.clientX - startX)));
      const nextY = Math.max(8, Math.min(window.innerHeight - edgePadding, initialY + (moveEvent.clientY - startY)));
      onPanelStateChange?.({
        ...panelState,
        pinned: false,
        x: nextX,
        y: nextY,
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return h('div', { class: 'dex-fab dex-fab--floating', style, 'aria-label': 'DexEnhance Quick Actions' }, [
    h(
      'button',
      {
        type: 'button',
        class: 'dex-fab__drag',
        onPointerDown: startDrag,
        title: 'Drag quick actions',
        'aria-label': 'Drag quick actions',
      },
      '⋮⋮'
    ),
    open
      ? h('div', { class: 'dex-fab__menu' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('tour');
                setOpen(false);
              },
            },
            'Feature Tour'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('optimize');
                setOpen(false);
              },
            },
            'Optimize Prompt'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('prompts');
                setOpen(false);
              },
            },
            'Prompt Library'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('context');
                setOpen(false);
              },
            },
            'Inject Context'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('liveRender');
                setOpen(false);
              },
            },
            'Live Render'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('settings');
                setOpen(false);
              },
            },
            'HUD Settings'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('export');
                setOpen(false);
              },
            },
            'Export'
          ),
        ])
      : null,
    h(
      'button',
      {
        type: 'button',
        class: 'dex-fab__button',
        style: `width:${buttonSize}px;height:${buttonSize}px;`,
        onClick: () => setOpen((value) => !value),
        'aria-label': open ? 'Close quick actions' : 'Open quick actions',
      },
      open
        ? '×'
        : iconUrl
          ? h('img', {
              src: iconUrl,
              alt: `${site} quick actions`,
              class: 'dex-fab__icon',
              style: `width:${Math.max(24, Math.round(buttonSize * 0.5))}px;height:${Math.max(24, Math.round(buttonSize * 0.5))}px;`,
            })
          : '+'
    ),
  ]);
}
