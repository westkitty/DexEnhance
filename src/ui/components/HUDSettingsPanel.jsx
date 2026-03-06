import { h } from 'preact';

const THEME_PRESETS = [
  {
    id: 'graphite',
    label: 'Graphite',
    description: 'High-contrast default for deep work.',
  },
  {
    id: 'paper',
    label: 'Paper',
    description: 'Bright solid surface for daylight use.',
  },
  {
    id: 'oxide',
    label: 'Oxide',
    description: 'Muted steel palette with softer contrast.',
  },
];

export function HUDSettingsPanel({
  visible,
  themePreset = 'graphite',
  onThemePresetChange,
  launcherSize = 64,
  onLauncherSizeChange,
  drawerWidth = 420,
  onDrawerWidthChange,
  onResetLayout,
  onResetTheme,
}) {
  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-settings-stack', 'aria-label': 'DexEnhance settings' }, [
    h('p', { class: 'dex-folder-state' }, 'Appearance is now curated and fully opaque. Layout favors one launcher, one palette, one drawer.'),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Theme preset'),
      h('div', { class: 'dex-theme-preset-grid' },
        THEME_PRESETS.map((preset) => h('button', {
          key: preset.id,
          type: 'button',
          class: `dex-theme-preset${themePreset === preset.id ? ' is-active' : ''}`,
          onClick: () => onThemePresetChange?.(preset.id),
        }, [
          h('strong', null, preset.label),
          h('span', null, preset.description),
        ]))
      ),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Launcher size'),
      h('label', { class: 'dex-sidebar__label' }, `Corner anchor size (${Math.round(Number(launcherSize) || 64)}px)`),
      h('input', {
        type: 'range',
        min: 54,
        max: 84,
        step: 1,
        value: Number.isFinite(Number(launcherSize)) ? Number(launcherSize) : 64,
        class: 'dex-panel-frame__slider',
        onInput: (event) => onLauncherSizeChange?.(Number(event.currentTarget.value)),
      }),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Drawer width'),
      h('label', { class: 'dex-sidebar__label' }, `Drawer width (${Math.round(Number(drawerWidth) || 420)}px)`),
      h('input', {
        type: 'range',
        min: 320,
        max: 720,
        step: 4,
        value: Number.isFinite(Number(drawerWidth)) ? Number(drawerWidth) : 420,
        class: 'dex-panel-frame__slider',
        onInput: (event) => onDrawerWidthChange?.(Number(event.currentTarget.value)),
      }),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Resets'),
      h('div', { class: 'dex-form__actions' }, [
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onResetLayout?.() }, 'Reset layout'),
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onResetTheme?.() }, 'Reset theme'),
      ]),
    ]),
  ]);
}
