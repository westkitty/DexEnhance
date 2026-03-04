import { h } from 'preact';
import { PanelFrame } from './PanelFrame.jsx';

export function HUDSettingsPanel({
  visible,
  iconUrl = '',
  panelState,
  defaultPanelState,
  onPanelStateChange,
  accentHue = 202,
  onAccentHueChange,
  panelOpacities = {},
  onPanelOpacityChange,
  fabSize = 62,
  onFabSizeChange,
  onResetLayout,
  onResetTheme,
  onClose,
}) {
  if (!visible) return null;

  const hueGradient = 'linear-gradient(90deg, #ff3b30 0%, #ff9500 16%, #ffcc00 32%, #34c759 48%, #00c7be 64%, #007aff 80%, #af52de 100%)';

  return h(
    PanelFrame,
    {
      panelId: 'settings',
      title: 'HUD Settings',
      iconUrl,
      panelState,
      defaultState: defaultPanelState,
      onPanelStateChange,
      minWidth: 320,
      minHeight: 220,
      zIndex: 2147483646,
      onClose,
      showClose: true,
      showPin: true,
      allowResize: true,
    },
    [
      h('div', { class: 'dex-form' }, [
        h('p', { class: 'dex-folder-state' }, 'Tune HUD color and visibility without blocking your chat controls.'),
        h('label', { class: 'dex-sidebar__label' }, 'HUD Accent Color (Spectrum)'),
        h('input', {
          type: 'range',
          min: 0,
          max: 360,
          step: 1,
          value: Number.isFinite(Number(accentHue)) ? Number(accentHue) : 202,
          class: 'dex-panel-frame__slider dex-panel-frame__slider--hue',
          style: `background:${hueGradient}`,
          onInput: (event) => onAccentHueChange?.(Number(event.currentTarget.value)),
        }),
        h('div', { class: 'dex-folder-state' }, `Hue: ${Math.round(Number(accentHue) || 202)}°`),
        h('label', { class: 'dex-sidebar__label' }, `Quick Actions Size (${Math.round(Number(fabSize) || 62)}px)`),
        h('input', {
          type: 'range',
          min: 52,
          max: 96,
          step: 1,
          value: Number.isFinite(Number(fabSize)) ? Number(fabSize) : 62,
          class: 'dex-panel-frame__slider',
          onInput: (event) => onFabSizeChange?.(Number(event.currentTarget.value)),
        }),
        h('label', { class: 'dex-sidebar__label' }, 'Panel Transparency'),
        h('div', { class: 'dex-hud-opacity-grid' }, [
          ['sidebar', 'Sidebar'],
          ['tokens', 'Dex Tokens'],
          ['fab', 'Quick Actions'],
          ['promptLibrary', 'Prompt Library'],
          ['optimizer', 'Optimizer'],
          ['tour', 'Feature Tour'],
          ['export', 'Export'],
        ].map(([panelId, label]) =>
          h('label', { class: 'dex-hud-opacity-row', key: panelId }, [
            h('span', null, label),
            h('input', {
              type: 'range',
              min: 0.08,
              max: 1,
              step: 0.02,
              value: Number.isFinite(Number(panelOpacities[panelId])) ? Number(panelOpacities[panelId]) : 0.96,
              class: 'dex-panel-frame__slider',
              onInput: (event) => onPanelOpacityChange?.(panelId, Number(event.currentTarget.value)),
            }),
            h('strong', null, `${Math.round((Number(panelOpacities[panelId]) || 0.96) * 100)}%`),
          ])
        )),
        h('div', { class: 'dex-form__actions' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'dex-link-btn',
              onClick: () => onResetLayout?.(),
            },
            'Reset Window Layout'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-link-btn',
              onClick: () => onResetTheme?.(),
            },
            'Reset Color + Opacity'
          ),
        ]),
      ]),
    ]
  );
}
