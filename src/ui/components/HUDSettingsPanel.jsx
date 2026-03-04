import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { PanelFrame } from './PanelFrame.jsx';

const WINDOW_ROWS = [
  ['sidebar', 'Side Panel'],
  ['tokens', 'Tokens Panel'],
  ['promptLibrary', 'Prompt Library'],
  ['optimizer', 'Prompt Optimizer'],
  ['tour', 'Feature Tour'],
  ['export', 'Export Dialog'],
  ['hub', 'Quick Hub'],
];

export function HUDSettingsPanel({
  visible,
  iconUrl = '',
  panelState,
  defaultPanelState,
  onPanelStateChange,
  accentHue = 202,
  onAccentHueChange,
  bgBaseHue = 214,
  bgBaseSaturation = 24,
  bgBaseLightness = 93,
  bgGlassHue = 214,
  bgGlassSaturation = 18,
  bgGlassLightness = 86,
  bgGlassAlpha = 0.78,
  onBackgroundChange,
  panelVisibility = {},
  panelOpacities = {},
  onPanelVisibilityChange,
  onPanelOpacityChange,
  fabSize = 62,
  onFabSizeChange,
  onResetLayout,
  onResetTheme,
  onClose,
}) {
  const [opacityModes, setOpacityModes] = useState({});

  useEffect(() => {
    if (visible) return;
    setOpacityModes({});
  }, [visible]);

  if (!visible) return null;

  const hueGradient = 'linear-gradient(90deg, #ff3b30 0%, #ff9500 16%, #ffcc00 32%, #34c759 48%, #00c7be 64%, #007aff 80%, #af52de 100%)';

  return h(
    PanelFrame,
    {
      panelId: 'settings',
      title: 'Window Management',
      iconUrl,
      panelState,
      defaultState: defaultPanelState,
      onPanelStateChange,
      minWidth: 420,
      minHeight: 360,
      zIndex: 2147483646,
      onClose,
      showClose: true,
      showPin: true,
      allowResize: true,
    },
    [
      h('div', { class: 'dex-settings-stack' }, [
        h('p', { class: 'dex-folder-state' }, 'Quick Action is the persistent anchor. Enable only the windows you want open.'),

        h('section', { class: 'dex-settings-section' }, [
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
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('label', { class: 'dex-sidebar__label' }, 'Structural Base Color'),
          h('input', {
            type: 'range',
            min: 0,
            max: 360,
            step: 1,
            value: Number(bgBaseHue),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgBaseHue: Number(event.currentTarget.value) }),
          }),
          h('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: Number(bgBaseSaturation),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgBaseSaturation: Number(event.currentTarget.value) }),
          }),
          h('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: Number(bgBaseLightness),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgBaseLightness: Number(event.currentTarget.value) }),
          }),
          h('div', { class: 'dex-folder-state' }, `Base H:${Math.round(Number(bgBaseHue))} S:${Math.round(Number(bgBaseSaturation))}% L:${Math.round(Number(bgBaseLightness))}%`),
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('label', { class: 'dex-sidebar__label' }, 'Glass Overlay Color'),
          h('input', {
            type: 'range',
            min: 0,
            max: 360,
            step: 1,
            value: Number(bgGlassHue),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgGlassHue: Number(event.currentTarget.value) }),
          }),
          h('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: Number(bgGlassSaturation),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgGlassSaturation: Number(event.currentTarget.value) }),
          }),
          h('input', {
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: Number(bgGlassLightness),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgGlassLightness: Number(event.currentTarget.value) }),
          }),
          h('input', {
            type: 'range',
            min: 0.18,
            max: 0.9,
            step: 0.01,
            value: Number(bgGlassAlpha),
            class: 'dex-panel-frame__slider',
            onInput: (event) => onBackgroundChange?.({ bgGlassAlpha: Number(event.currentTarget.value) }),
          }),
          h('div', { class: 'dex-folder-state' }, `Glass H:${Math.round(Number(bgGlassHue))} S:${Math.round(Number(bgGlassSaturation))}% L:${Math.round(Number(bgGlassLightness))}% A:${Number(bgGlassAlpha).toFixed(2)}`),
        ]),

        h('section', { class: 'dex-settings-section dex-settings-section--windows' }, [
          h('label', { class: 'dex-sidebar__label' }, 'Window Visibility + Transparency Mode'),
          h('div', { class: 'dex-settings-windows' }, WINDOW_ROWS.map(([panelId, label]) => {
            const visibleNow = panelVisibility?.[panelId] === true;
            const modeOn = opacityModes[panelId] === true;
            return h('div', { class: 'dex-window-row', key: panelId }, [
              h('div', { class: 'dex-window-row__line' }, [
                h('span', { class: 'dex-window-row__label' }, label),
                h('div', { class: 'dex-window-row__toggles' }, [
                  h('label', { class: 'dex-toggle-chip' }, [
                    h('input', {
                      type: 'checkbox',
                      checked: visibleNow,
                      onChange: (event) => onPanelVisibilityChange?.(panelId, event.currentTarget.checked),
                    }),
                    h('span', null, visibleNow ? 'On' : 'Off'),
                  ]),
                  h('label', { class: 'dex-toggle-chip dex-toggle-chip--secondary' }, [
                    h('input', {
                      type: 'checkbox',
                      checked: modeOn,
                      onChange: (event) => {
                        const next = event.currentTarget.checked;
                        setOpacityModes((current) => ({ ...current, [panelId]: next }));
                      },
                    }),
                    h('span', null, 'Transparency'),
                  ]),
                ]),
              ]),
              h('div', {
                class: `dex-window-row__opacity${modeOn ? ' is-open' : ''}`,
                'aria-hidden': modeOn ? 'false' : 'true',
                onPointerDown: (event) => event.stopPropagation(),
              }, [
                h('input', {
                  type: 'range',
                  min: 0.28,
                  max: 1,
                  step: 0.02,
                  value: Number.isFinite(Number(panelOpacities?.[panelId])) ? Number(panelOpacities[panelId]) : 0.96,
                  class: 'dex-panel-frame__slider',
                  disabled: !modeOn,
                  onInput: (event) => onPanelOpacityChange?.(panelId, Number(event.currentTarget.value)),
                }),
              ]),
            ]);
          })),
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('label', { class: 'dex-sidebar__label' }, `Quick Action Size (${Math.round(Number(fabSize) || 62)}px)`),
          h('input', {
            type: 'range',
            min: 52,
            max: 96,
            step: 1,
            value: Number.isFinite(Number(fabSize)) ? Number(fabSize) : 62,
            class: 'dex-panel-frame__slider',
            onInput: (event) => onFabSizeChange?.(Number(event.currentTarget.value)),
          }),
        ]),

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
            'Reset Theme Colors'
          ),
        ]),
      ]),
    ]
  );
}
