import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { clampPanelState, panelOpacityValue } from '../../lib/ui-settings.js';

function isPrimaryPointer(event) {
  return event.button === 0 || event.buttons === 1;
}

export function PanelFrame({
  panelId,
  title,
  iconUrl = '',
  panelState,
  defaultState,
  minWidth = 220,
  minHeight = 120,
  zIndex = 2147483646,
  onPanelStateChange,
  onClose,
  children,
  className = '',
  compactCollapsed = false,
  showClose = true,
  showPin = true,
  showOptions = true,
  allowResize = true,
}) {
  const state = useMemo(
    () => clampPanelState(panelState, { width: window.innerWidth, height: window.innerHeight }, minWidth, minHeight),
    [panelState, minHeight, minWidth]
  );

  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    if (!showOptions) return undefined;
    const closeOptions = (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(`[data-dex-panel-options="${panelId}"]`)) return;
      setOptionsOpen(false);
    };
    window.addEventListener('pointerdown', closeOptions);
    return () => window.removeEventListener('pointerdown', closeOptions);
  }, [panelId, showOptions]);

  function updatePanel(next) {
    const clamped = clampPanelState(next, { width: window.innerWidth, height: window.innerHeight }, minWidth, minHeight);
    onPanelStateChange?.(clamped);
  }

  function startDrag(event) {
    if (!isPrimaryPointer(event)) return;
    if (event.target instanceof Element && event.target.closest('button, input, select, textarea, a')) return;

    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...state };

    dragRef.current = true;

    const onMove = (moveEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updatePanel({
        ...initial,
        pinned: false,
        x: initial.x + dx,
        y: initial.y + dy,
      });
    };

    const onUp = () => {
      dragRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function startResize(event) {
    if (!allowResize || !isPrimaryPointer(event) || state.collapsed) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...state };
    resizeRef.current = true;

    const onMove = (moveEvent) => {
      if (!resizeRef.current) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updatePanel({
        ...initial,
        pinned: false,
        width: initial.width + dx,
        height: initial.height + dy,
      });
    };

    const onUp = () => {
      resizeRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const style = {
    left: `${state.x}px`,
    top: `${state.y}px`,
    width: `${state.width}px`,
    height: state.collapsed ? undefined : `${state.height}px`,
    opacity: panelOpacityValue(state.opacity),
    zIndex,
  };

  return h(
    'section',
    {
      class: `dex-panel-frame${state.collapsed ? ' is-collapsed' : ''}${state.pinned ? ' is-pinned' : ''}${compactCollapsed ? ' is-compact' : ''}${className ? ` ${className}` : ''}`,
      style,
      'data-dex-panel': panelId,
      'aria-label': title,
    },
    [
      h(
        'header',
        {
          class: 'dex-panel-frame__header',
          onPointerDown: startDrag,
        },
        [
          h('div', { class: 'dex-panel-frame__title' }, [
            iconUrl
              ? h('img', {
                  src: iconUrl,
                  alt: '',
                  class: 'dex-panel-frame__icon',
                })
              : null,
            h('span', null, title),
          ]),
          h('div', { class: 'dex-panel-frame__actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'dex-link-btn dex-link-btn--panel',
                onClick: () => updatePanel({ ...state, collapsed: !state.collapsed }),
                title: state.collapsed ? 'Expand panel' : 'Collapse panel',
              },
              state.collapsed ? 'Expand' : 'Collapse'
            ),
            showPin
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: `dex-link-btn dex-link-btn--panel${state.pinned ? ' dex-link-btn--accent' : ''}`,
                    onClick: () => {
                      if (!state.pinned) {
                        updatePanel({
                          ...defaultState,
                          pinned: true,
                          collapsed: false,
                          opacity: state.opacity,
                        });
                      } else {
                        updatePanel({ ...state, pinned: false });
                      }
                    },
                    title: state.pinned ? 'Unpin from HUD anchor' : 'Pin back to HUD anchor',
                  },
                  state.pinned ? 'Pinned' : 'Pin'
                )
              : null,
            showOptions
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--panel',
                    onClick: () => setOptionsOpen((value) => !value),
                    title: 'Panel options',
                  },
                  'Options'
                )
              : null,
            showClose && onClose
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--panel danger',
                    onClick: () => onClose?.(),
                    title: 'Close panel',
                  },
                  'Close'
                )
              : null,
          ]),
        ]
      ),
      showOptions && optionsOpen
        ? h('div', { class: 'dex-panel-frame__options', 'data-dex-panel-options': panelId }, [
            h('label', { class: 'dex-sidebar__label' }, 'Transparency'),
            h('input', {
              class: 'dex-panel-frame__slider',
              type: 'range',
              min: 0.08,
              max: 1,
              step: 0.02,
              value: panelOpacityValue(state.opacity),
              onInput: (event) => {
                updatePanel({
                  ...state,
                  opacity: Number(event.currentTarget.value),
                });
              },
            }),
            h('div', { class: 'dex-folder-state' }, `Opacity: ${Math.round(panelOpacityValue(state.opacity) * 100)}%`),
          ])
        : null,
      state.collapsed
        ? compactCollapsed
          ? h('div', { class: 'dex-panel-frame__body dex-panel-frame__body--compact' }, children)
          : h('div', { class: 'dex-panel-frame__collapsed' }, `${title} minimized`)
        : h('div', { class: 'dex-panel-frame__body' }, children),
      allowResize && !state.collapsed
        ? h('div', {
            class: 'dex-panel-frame__resize',
            onPointerDown: startResize,
            title: 'Resize panel',
          })
        : null,
    ]
  );
}
