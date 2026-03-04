import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { FolderTree } from './FolderTree.jsx';

// ── Icon set (filled/stroked, 14×14 viewBox) ─────────────────────
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

const AI_ACTIONS = [
  { id: 'prompts',    label: 'Prompt Library',   icon: 'prompts',  accent: true },
  { id: 'optimize',  label: 'Optimize Prompt',   icon: 'optimize', accent: true },
  { id: 'context',   label: 'Inject Context',    icon: 'context' },
  { id: 'liveRender',label: 'Live Render Code',  icon: 'render' },
];

const UTIL_ACTIONS = [
  { id: 'export',    label: 'Export Chat',       icon: 'export' },
  { id: 'settings',  label: 'HUD Settings',      icon: 'settings' },
];

export function Sidebar({
  site,
  currentChatUrl,
  queueSize = 0,
  onRequestExport,
  onRequestTour,
  onRequestPrompts,
  onRequestOptimizer,
  onRequestSettings,
  onRequestContext,
  onRequestLiveRender,
  iconUrl = '',
}) {
  const [liveUrl, setLiveUrl] = useState(currentChatUrl || window.location.href);

  useEffect(() => {
    setLiveUrl(currentChatUrl || window.location.href);
  }, [currentChatUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveUrl((previous) => (window.location.href !== previous ? window.location.href : previous));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ACTION_HANDLERS = {
    prompts:    () => onRequestPrompts?.(),
    optimize:   () => onRequestOptimizer?.(),
    context:    () => onRequestContext?.(),
    liveRender: () => onRequestLiveRender?.(),
    export:     () => onRequestExport?.(),
    settings:   () => onRequestSettings?.(),
  };

  function renderActionGroup(label, actions) {
    return h('div', { class: 'dex-sidebar__section' }, [
      h('span', { class: 'dex-sidebar__section-label' }, label),
      h('div', { class: 'dex-sidebar__section-actions' },
        actions.map((action) =>
          h('button', {
            key: action.id,
            type: 'button',
            class: `dex-link-btn dex-hub__action-btn${action.accent ? ' dex-hub__action-btn--primary' : ''}`,
            onClick: ACTION_HANDLERS[action.id],
          }, [
            ICONS[action.icon]?.(),
            h('span', null, action.label),
          ])
        )
      ),
    ]);
  }

  return h('aside', { class: 'dex-sidebar dex-sidebar--embedded', 'aria-label': 'DexEnhance Sidebar' }, [
    h('header', { class: 'dex-sidebar__header' }, [
      h('h2', { class: 'dex-sidebar__title' }, [
        iconUrl
          ? h('img', {
              src: iconUrl,
              alt: 'DexEnhance',
              class: 'dex-sidebar__icon',
            })
          : null,
        h('span', null, `DexEnhance • ${site}`),
      ]),
    ]),
    h('div', { class: 'dex-sidebar__body' }, [
      h('div', { class: 'dex-sidebar__meta' }, [
        h('span', { class: 'dex-sidebar__label' }, 'Current Chat'),
        h('span', { class: 'dex-sidebar__url', title: liveUrl || 'Unknown' }, liveUrl || 'Unknown'),
      ]),
      h('div', { class: 'dex-sidebar__meta' }, [
        h('span', { class: 'dex-sidebar__label' }, 'Queued Messages'),
        queueSize > 0
          ? h('span', { class: 'dex-sidebar__queue-badge' }, String(queueSize))
          : h('span', { class: 'dex-sidebar__url' }, '0'),
      ]),

      renderActionGroup('AI Tools', AI_ACTIONS),
      renderActionGroup('Utilities', UTIL_ACTIONS),

      h('div', { class: 'dex-sidebar__section' }, [
        h('button', {
          type: 'button',
          class: 'dex-link-btn dex-link-btn--accent dex-hub__action-btn',
          style: 'width: 100%;',
          onClick: () => onRequestTour?.(),
        }, [ICONS.tour(), h('span', null, 'Feature Tour')]),
      ]),

      h(FolderTree, { currentChatUrl: liveUrl }),
    ]),
  ]);
}
