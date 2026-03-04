import { h } from 'preact';
import { PanelFrame } from './PanelFrame.jsx';

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

  const actions = [
    { id: 'sidebar', label: 'Open Side Panel' },
    { id: 'tokens', label: 'Open Tokens Panel' },
    { id: 'prompts', label: 'Prompt Library' },
    { id: 'optimize', label: 'Prompt Optimizer' },
    { id: 'context', label: 'Inject Context' },
    { id: 'liveRender', label: 'Live Render Latest Code' },
    { id: 'settings', label: 'Window Management' },
    { id: 'tour', label: 'Feature Tour' },
    { id: 'export', label: 'Export' },
  ];

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
        h('p', { class: 'dex-folder-state' }, 'Quick Action is your anchor. Open only what you need.'),
        h('div', { class: 'dex-hub__actions' }, actions.map((action) =>
          h(
            'button',
            {
              key: action.id,
              type: 'button',
              class: 'dex-link-btn',
              onClick: () => onAction?.(action.id),
            },
            action.label
          )
        )),
      ]),
    ]
  );
}
