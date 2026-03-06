import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export function FAB({
  site,
  onAction,
  actions = [],
  iconUrl = '',
  panelState,
}) {
  const buttonSize = Math.max(46, Math.min(84, Number(panelState?.width || 56)));
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (rootRef.current && path.includes(rootRef.current)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [menuOpen]);

  const style = {
    left: `${Math.round(Number(panelState?.x || 18))}px`,
    top: `${Math.round(Number(panelState?.y || (window.innerHeight - 78)))}px`,
    opacity: Number.isFinite(Number(panelState?.opacity)) ? Number(panelState.opacity) : 1,
  };

  return h('div', { class: 'dex-fab dex-fab--floating', style, 'aria-label': 'DexEnhance Quick Action', ref: rootRef }, [
    h('div', { class: 'dex-fab__dock' }, [
      menuOpen && actions.length > 0
        ? h('div', { id: 'dex-fab-actions', class: 'dex-fab__menu', role: 'menu', 'aria-label': 'DexEnhance quick actions' },
            actions.map((action) =>
              h('button', {
                key: action.id,
                type: 'button',
                class: 'dex-fab__action',
                role: 'menuitem',
                onClick: () => {
                  setMenuOpen(false);
                  onAction?.(action.id);
                },
              }, action.label)
            )
          )
        : null,
      h(
        'button',
        {
          type: 'button',
          class: 'dex-fab__button dex-fab__button--icon',
          style: `width:${buttonSize}px;height:${buttonSize}px;`,
          onClick: () => setMenuOpen((current) => !current),
          'aria-label': `Open DexEnhance actions on ${site}`,
          'aria-expanded': menuOpen ? 'true' : 'false',
          'aria-controls': 'dex-fab-actions',
        },
        iconUrl
          ? h('img', {
              src: iconUrl,
              alt: `${site} quick action hub`,
              class: 'dex-fab__icon',
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
