import { h } from 'preact';

export function DexLauncher({
  site = '',
  iconUrl = '',
  panelState,
  queueSize = 0,
  expanded = false,
  fabBehavior = 'quick_actions',
  quickActions = [],
  onToggleExpanded,
  onOpenHub,
  onOpenPalette,
  onOpenLastView,
}) {
  const size = Math.max(54, Math.min(92, Number(panelState?.width || 64)));
  const style = {
    left: `${Math.round(Number(panelState?.x || (window.innerWidth - size - 18)))}px`,
    top: `${Math.round(Number(panelState?.y || (window.innerHeight - size - 18)))}px`,
    width: `${size}px`,
    height: `${size}px`,
  };

  return h('div', { class: `dex-launcher${expanded ? ' is-expanded' : ''}`, style }, [
    expanded
      ? h('div', { class: 'dex-launcher__rail', role: 'toolbar', 'aria-label': 'DexEnhance quick actions' },
          quickActions.map((action) => h('button', {
            key: action.id,
            type: 'button',
            class: 'dex-launcher__action',
            title: action.label,
            'aria-label': action.label,
            onClick: () => {
              action.onClick?.();
              onToggleExpanded?.();
            },
          }, action.label))
        )
      : null,
    h('button', {
      type: 'button',
      class: 'dex-launcher__button',
      'aria-label': fabBehavior === 'hub_first'
        ? `Open DexEnhance hub on ${site}`
        : `Toggle DexEnhance quick actions on ${site}`,
      title: fabBehavior === 'hub_first' ? 'Open DexEnhance hub' : 'Toggle DexEnhance quick actions',
      onClick: () => {
        if (fabBehavior === 'hub_first') {
          onOpenHub?.();
          return;
        }
        onToggleExpanded?.();
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
    h('div', { class: 'dex-launcher__secondary' }, [
      h('button', {
        type: 'button',
        class: 'dex-launcher__peek',
        'aria-label': 'Open DexEnhance hub',
        title: 'Open DexEnhance hub',
        onClick: () => onOpenHub?.(),
      }, 'Hub'),
      h('button', {
        type: 'button',
        class: 'dex-launcher__peek',
        'aria-label': 'Open last drawer view',
        title: 'Open last drawer view',
        onClick: () => onOpenLastView?.(),
      }, 'Last'),
      h('button', {
        type: 'button',
        class: 'dex-launcher__peek',
        'aria-label': 'Open command palette',
        title: 'Open command palette',
        onClick: () => onOpenPalette?.(),
      }, 'Cmd'),
    ]),
  ]);
}
