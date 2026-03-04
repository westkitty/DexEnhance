import { h } from 'preact';
import { PanelFrame } from './PanelFrame.jsx';

// Simple inline SVG icons — no emoji, no external CDN
const ICONS = {
  prompts: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('rect', { x: '1', y: '2', width: '12', height: '2', rx: '1' }),
    h('rect', { x: '1', y: '6', width: '8', height: '2', rx: '1' }),
    h('rect', { x: '1', y: '10', width: '10', height: '2', rx: '1' }),
  ]),
  optimize: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('path', { d: 'M8 1L3 7.5h4l-1 5.5 5-7.5H7L8 1z' }),
  ]),
  context: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
    h('path', { d: 'M5.5 8a3 3 0 004.5 0l1-1a3 3 0 00-4.5-4.5L5.5 3.5' }),
    h('path', { d: 'M8.5 6a3 3 0 00-4.5 0L2.5 7a3 3 0 004.5 4.5L8.5 10' }),
  ]),
  render: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('path', { d: 'M3 2l9 5-9 5V2z' }),
  ]),
  sidebar: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'aria-hidden': 'true' }, [
    h('rect', { x: '1', y: '2', width: '12', height: '10', rx: '2' }),
    h('line', { x1: '5', y1: '2', x2: '5', y2: '12' }),
  ]),
  tokens: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'currentColor', 'aria-hidden': 'true' }, [
    h('rect', { x: '1', y: '7', width: '3', height: '6', rx: '1' }),
    h('rect', { x: '5.5', y: '4', width: '3', height: '9', rx: '1' }),
    h('rect', { x: '10', y: '5.5', width: '3', height: '7.5', rx: '1' }),
  ]),
  export: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
    h('path', { d: 'M7 9V2' }),
    h('path', { d: 'M4 5l3-3 3 3' }),
    h('path', { d: 'M2 11h10' }),
  ]),
  settings: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
    h('circle', { cx: '7', cy: '7', r: '2' }),
    h('path', { d: 'M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.4 3.4l.85.85M9.75 9.75l.85.85M3.4 10.6l.85-.85M9.75 4.25l.85-.85' }),
  ]),
  tour: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
    h('circle', { cx: '7', cy: '7', r: '5.5' }),
    h('path', { d: 'M7 4v3l2 2' }),
  ]),
};

const ACTION_GROUPS = [
  {
    label: 'AI Tools',
    actions: [
      { id: 'prompts',    label: 'Prompt Library',       icon: 'prompts',  accent: true },
      { id: 'optimize',   label: 'Optimize Prompt',      icon: 'optimize', accent: true },
      { id: 'context',    label: 'Inject Context',        icon: 'context'  },
      { id: 'liveRender', label: 'Live Render Code',     icon: 'render'   },
    ],
  },
  {
    label: 'Panels',
    actions: [
      { id: 'sidebar', label: 'Side Panel',    icon: 'sidebar' },
      { id: 'tokens',  label: 'Tokens Panel',  icon: 'tokens'  },
    ],
  },
  {
    label: 'Utilities',
    actions: [
      { id: 'export',    label: 'Export Conversation',  icon: 'export'   },
      { id: 'settings',  label: 'Window Management',    icon: 'settings' },
      { id: 'tour',      label: 'Feature Tour',         icon: 'tour'     },
    ],
  },
];

export function QuickHubPanel({
  visible,
  iconUrl = '',
  panelState,
  defaultPanelState,
  onPanelStateChange,
  onClose,
  onAction,
}) {
  if (!visible) return null;

  return h(
    PanelFrame,
    {
      panelId: 'hub',
      title: 'DexEnhance Hub',
      iconUrl,
      panelState,
      defaultState: defaultPanelState,
      onPanelStateChange,
      minWidth: 340,
      minHeight: 260,
      zIndex: 2147483646,
      onClose,
      showClose: true,
      showPin: true,
      allowResize: true,
    },
    [
      h('div', { class: 'dex-hub' }, [
        h('p', { class: 'dex-form__desc' }, 'Quick Action is your anchor. Open only what you need.'),
        ...ACTION_GROUPS.map((group) =>
          h('div', { key: group.label, class: 'dex-hub__group' }, [
            h('div', { class: 'dex-hub__group-label' }, group.label),
            h('div', { class: 'dex-hub__actions' },
              group.actions.map((action) =>
                h('button', {
                  key: action.id,
                  type: 'button',
                  class: `dex-link-btn dex-hub__action-btn${action.accent ? ' dex-hub__action-btn--primary' : ''}`,
                  onClick: () => onAction?.(action.id),
                }, [
                  ICONS[action.icon]?.(),
                  h('span', null, action.label),
                ])
              )
            ),
          ])
        ),
      ]),
    ]
  );
}
