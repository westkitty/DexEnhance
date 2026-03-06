import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { PanelFrame } from './PanelFrame.jsx';

const WINDOW_ROWS = [
  ['sidebar', 'Side Panel'],
  ['tokens', 'Tokens Panel'],
  ['promptLibrary', 'Prompt Library'],
  ['optimizer', 'Prompt Optimizer'],
  ['export', 'Export Dialog'],
];

export function HUDSettingsPanel({
  visible,
  iconUrl = '',
  panelState,
  defaultPanelState,
  onPanelStateChange,
  accentHue = 202,
  onAccentHueChange,
  watermarkOpacity = 0.30,
  onWatermarkOpacityChange,
  bgBaseHue = 214,
  bgBaseSaturation = 24,
  bgBaseLightness = 93,
  bgGlassHue = 214,
  bgGlassSaturation = 18,
  bgGlassLightness = 86,
  bgGlassAlpha = 0.88,
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
  const [sections, setSections] = useState({
    accent: true,
    base: false,
    glass: false,
    windows: true,
    quickAction: false,
    reset: false,
  });

  useEffect(() => {
    if (visible) return;
    setOpacityModes({});
    setSections({
      accent: true,
      base: false,
      glass: false,
      windows: true,
      quickAction: false,
      reset: false,
    });
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
      minWidth: 360,
      minHeight: 300,
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
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.accent ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, accent: !current.accent })),
            'aria-expanded': sections.accent ? 'true' : 'false',
          }, [
            h('span', null, 'HUD Accent Color'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.accent ? '▾' : '▸'),
          ]),
          sections.accent
            ? h('div', { class: 'dex-settings-accordion__body' }, [
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
                h('label', { class: 'dex-sidebar__label' }, `Brand Watermark Opacity (${Math.round((Number(watermarkOpacity) || 0) * 100)}%)`),
                h('input', {
                  type: 'range',
                  min: 0,
                  max: 0.3,
                  step: 0.01,
                  value: Number.isFinite(Number(watermarkOpacity)) ? Number(watermarkOpacity) : 0.3,
                  class: 'dex-panel-frame__slider',
                  'aria-label': 'Brand watermark opacity',
                  onInput: (event) => onWatermarkOpacityChange?.(Number(event.currentTarget.value)),
                }),
                h('div', { class: 'dex-folder-state' }, 'Set to 0 for high-contrast mode. Default is 30%.'),
              ])
            : null,
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.base ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, base: !current.base })),
            'aria-expanded': sections.base ? 'true' : 'false',
          }, [
            h('span', null, 'Structural Base Color'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.base ? '▾' : '▸'),
          ]),
          sections.base
            ? h('div', { class: 'dex-settings-accordion__body' }, [
                h('div', { class: 'dex-settings-section-head' }, [
                  h('label', { class: 'dex-sidebar__label' }, 'Structural Base Color'),
                  h('span', {
                    class: 'dex-settings-swatch',
                    style: `background:hsl(${Math.round(Number(bgBaseHue))},${Math.round(Number(bgBaseSaturation))}%,${Math.round(Number(bgBaseLightness))}%)`,
                    title: `hsl(${Math.round(Number(bgBaseHue))}, ${Math.round(Number(bgBaseSaturation))}%, ${Math.round(Number(bgBaseLightness))}%)`,
                  }),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Hue'),
                  h('input', {
                    type: 'range', min: 0, max: 360, step: 1,
                    value: Number(bgBaseHue),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Base hue',
                    onInput: (event) => onBackgroundChange?.({ bgBaseHue: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgBaseHue))}°`),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Saturation'),
                  h('input', {
                    type: 'range', min: 0, max: 100, step: 1,
                    value: Number(bgBaseSaturation),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Base saturation',
                    onInput: (event) => onBackgroundChange?.({ bgBaseSaturation: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgBaseSaturation))}%`),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Lightness'),
                  h('input', {
                    type: 'range', min: 0, max: 100, step: 1,
                    value: Number(bgBaseLightness),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Base lightness',
                    onInput: (event) => onBackgroundChange?.({ bgBaseLightness: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgBaseLightness))}%`),
                ]),
              ])
            : null,
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.glass ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, glass: !current.glass })),
            'aria-expanded': sections.glass ? 'true' : 'false',
          }, [
            h('span', null, 'Glass Overlay Color'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.glass ? '▾' : '▸'),
          ]),
          sections.glass
            ? h('div', { class: 'dex-settings-accordion__body' }, [
                h('div', { class: 'dex-settings-section-head' }, [
                  h('label', { class: 'dex-sidebar__label' }, 'Glass Overlay Color'),
                  h('span', {
                    class: 'dex-settings-swatch',
                    style: `background:hsla(${Math.round(Number(bgGlassHue))},${Math.round(Number(bgGlassSaturation))}%,${Math.round(Number(bgGlassLightness))}%,${Number(bgGlassAlpha).toFixed(2)})`,
                    title: `hsla(${Math.round(Number(bgGlassHue))}, ${Math.round(Number(bgGlassSaturation))}%, ${Math.round(Number(bgGlassLightness))}%, ${Number(bgGlassAlpha).toFixed(2)})`,
                  }),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Hue'),
                  h('input', {
                    type: 'range', min: 0, max: 360, step: 1,
                    value: Number(bgGlassHue),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Glass hue',
                    onInput: (event) => onBackgroundChange?.({ bgGlassHue: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgGlassHue))}°`),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Saturation'),
                  h('input', {
                    type: 'range', min: 0, max: 100, step: 1,
                    value: Number(bgGlassSaturation),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Glass saturation',
                    onInput: (event) => onBackgroundChange?.({ bgGlassSaturation: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgGlassSaturation))}%`),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Lightness'),
                  h('input', {
                    type: 'range', min: 0, max: 100, step: 1,
                    value: Number(bgGlassLightness),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Glass lightness',
                    onInput: (event) => onBackgroundChange?.({ bgGlassLightness: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, `${Math.round(Number(bgGlassLightness))}%`),
                ]),
                h('div', { class: 'dex-settings-slider-row' }, [
                  h('span', { class: 'dex-settings-slider-label' }, 'Alpha'),
                  h('input', {
                    type: 'range', min: 0.62, max: 0.9, step: 0.01,
                    value: Number(bgGlassAlpha),
                    class: 'dex-panel-frame__slider',
                    'aria-label': 'Glass alpha',
                    onInput: (event) => onBackgroundChange?.({ bgGlassAlpha: Number(event.currentTarget.value) }),
                  }),
                  h('span', { class: 'dex-settings-slider-val' }, Number(bgGlassAlpha).toFixed(2)),
                ]),
              ])
            : null,
        ]),

        h('section', { class: 'dex-settings-section dex-settings-section--windows' }, [
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.windows ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, windows: !current.windows })),
            'aria-expanded': sections.windows ? 'true' : 'false',
          }, [
            h('span', null, 'Window Visibility + Transparency'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.windows ? '▾' : '▸'),
          ]),
          sections.windows
            ? h('div', { class: 'dex-settings-accordion__body' }, [
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
                        min: 0.72,
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
              ])
            : null,
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.quickAction ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, quickAction: !current.quickAction })),
            'aria-expanded': sections.quickAction ? 'true' : 'false',
          }, [
            h('span', null, 'Quick Action'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.quickAction ? '▾' : '▸'),
          ]),
          sections.quickAction
            ? h('div', { class: 'dex-settings-accordion__body' }, [
                h('label', { class: 'dex-sidebar__label' }, `Quick Action Size (${Math.round(Number(fabSize) || 56)}px)`),
                h('input', {
                  type: 'range',
                  min: 46,
                  max: 84,
                  step: 1,
                  value: Number.isFinite(Number(fabSize)) ? Number(fabSize) : 56,
                  class: 'dex-panel-frame__slider',
                  onInput: (event) => onFabSizeChange?.(Number(event.currentTarget.value)),
                }),
              ])
            : null,
        ]),

        h('section', { class: 'dex-settings-section' }, [
          h('button', {
            type: 'button',
            class: `dex-settings-accordion__toggle${sections.reset ? ' is-open' : ''}`,
            onClick: () => setSections((current) => ({ ...current, reset: !current.reset })),
            'aria-expanded': sections.reset ? 'true' : 'false',
          }, [
            h('span', null, 'Reset Controls'),
            h('span', { class: 'dex-settings-accordion__caret', 'aria-hidden': 'true' }, sections.reset ? '▾' : '▸'),
          ]),
          sections.reset
            ? h('div', { class: 'dex-settings-accordion__body' }, [
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
              ])
            : null,
        ]),
      ]),
    ]
  );
}
