import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { FolderTree } from './FolderTree.jsx';
import { DexBrandMark } from './DexBrandMark.jsx';
import { QueueManager } from './QueueManager.jsx';
import { StatusPanel } from './StatusPanel.jsx';
import { ContextualHint } from './ContextualHint.jsx';

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
  help: (size = 14) => h('svg', { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, [
    h('circle', { cx: '7', cy: '7', r: '5.5' }),
    h('path', { d: 'M5.6 5.4a1.6 1.6 0 113 1c0 .9-.9 1.2-1.3 1.6-.3.2-.4.4-.4.8' }),
    h('circle', { cx: '7', cy: '10.2', r: '.6', fill: 'currentColor', stroke: 'none' }),
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
  { id: 'help',      label: 'Help',              icon: 'help' },
];

export function Sidebar({
  site,
  currentChatUrl,
  queueSize = 0,
  onRequestExport,
  onRequestPrompts,
  onRequestOptimizer,
  onRequestSettings,
  onRequestContext,
  onRequestLiveRender,
  iconUrl = '',
  watermarkOpacity = 0.3,
  queueController = null,
  statusSnapshot = null,
  onCopyDiagnostics,
  onReinjectUi,
  onReloadAdapter,
}) {
  const [liveUrl, setLiveUrl] = useState(currentChatUrl || window.location.href);
  const [helpOpen, setHelpOpen] = useState(false);

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
    help:       () => setHelpOpen((value) => !value),
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
    h(DexBrandMark, {
      mode: 'watermark',
      iconUrl,
      opacity: watermarkOpacity,
    }),
    h('header', { class: 'dex-sidebar__header' }, [
      h('h2', { class: 'dex-sidebar__title' }, [
        h(DexBrandMark, {
          iconUrl,
          mode: 'header',
          label: 'DexEnhance',
        }),
        h('span', null, `Home • ${site}`),
      ]),
    ]),
    h('div', { class: 'dex-sidebar__body', style: 'position:relative;z-index:1;' }, [
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

      statusSnapshot
        ? h(StatusPanel, {
            hostLabel: statusSnapshot.hostLabel,
            adapterHealth: statusSnapshot.adapterHealth,
            workerHealth: statusSnapshot.workerHealth,
            queueState: statusSnapshot.queueState,
            tokenState: statusSnapshot.tokenState,
            featureSettings: statusSnapshot.featureSettings,
            onCopyDiagnostics,
            onReinjectUi,
            onReloadAdapter,
          })
        : null,

      h(ContextualHint, {
        hintId: 'semantic-clipboard',
        visible: true,
        title: 'Semantic Clipboard hint',
        message: 'Use Inject Context when your draft needs references from recent conversation state.',
      }),

      renderActionGroup('AI Tools', AI_ACTIONS),
      renderActionGroup('Utilities', UTIL_ACTIONS),

      helpOpen
        ? h('section', { class: 'dex-status-panel', 'aria-label': 'Help' }, [
            h('strong', null, 'Help'),
            h('p', { class: 'dex-folder-state' }, 'Prompt Library stores reusable templates. Prompt Optimizer restructures prompts before send.'),
            h('p', { class: 'dex-folder-state' }, 'Queue Manager controls queued prompts while hosts are generating. Export supports PDF and DOCX output.'),
            h('p', { class: 'dex-folder-state' }, 'Status shows adapter health, worker connectivity, queue state, and token refresh metadata.'),
          ])
        : null,

      queueController
        ? h(QueueManager, {
            queueController,
            siteLabel: site,
          })
        : null,

      h(FolderTree, { currentChatUrl: liveUrl }),
    ]),
  ]);
}
