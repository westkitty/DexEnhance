import { h } from 'preact';

const THEME_PRESETS = [
  { id: 'graphite', label: 'Graphite', description: 'High-contrast default for deep work.' },
  { id: 'paper', label: 'Paper', description: 'Bright solid surface for daylight use.' },
  { id: 'oxide', label: 'Oxide', description: 'Muted steel palette with softer contrast.' },
];

export function HUDSettingsPanel({
  visible,
  themePreset = 'graphite',
  onThemePresetChange,
  accentHue = 202,
  onAccentHueChange,
  transparency = 0.96,
  onTransparencyChange,
  launcherSize = 64,
  onLauncherSizeChange,
  fabBehavior = 'quick_actions',
  onFabBehaviorChange,
  drawerWidth = 420,
  onDrawerWidthChange,
  tokenOverlayEnabled = true,
  tokenOverlayMode = 'compact',
  onToggleTokenOverlay,
  onTokenOverlayModeChange,
  featureToggles = [],
  onToggleFeature,
  onRecoverWindows,
  onResetLayout,
  onResetTheme,
  onRelaunchOnboarding,
  onRelaunchTour,
}) {
  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-settings-stack', 'aria-label': 'DexEnhance settings' }, [
    h('p', { class: 'dex-folder-state' }, 'User-facing HUD controls live here: theme, hue, transparency, FAB behavior, token overlay mode, recovery, relaunch, and shipped-feature toggles.'),
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
      h('h3', { class: 'dex-settings-section__title' }, 'Accent hue'),
      h('label', { class: 'dex-sidebar__label' }, `Accent hue (${Math.round(Number(accentHue) || 202)}°)`),
      h('input', {
        type: 'range',
        min: 0,
        max: 360,
        step: 1,
        value: Number(accentHue) || 202,
        class: 'dex-panel-frame__slider',
        onInput: (event) => onAccentHueChange?.(Number(event.currentTarget.value)),
      }),
      h('label', { class: 'dex-sidebar__label' }, `Transparency (${Math.round((Number(transparency) || 0.96) * 100)}%)`),
      h('input', {
        type: 'range',
        min: 0.74,
        max: 1,
        step: 0.01,
        value: Number(transparency) || 0.96,
        class: 'dex-panel-frame__slider',
        onInput: (event) => onTransparencyChange?.(Number(event.currentTarget.value)),
      }),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Launcher and hub'),
      h('label', { class: 'dex-sidebar__label' }, `FAB size (${Math.round(Number(launcherSize) || 64)}px)`),
      h('input', {
        type: 'range',
        min: 54,
        max: 92,
        step: 1,
        value: Number.isFinite(Number(launcherSize)) ? Number(launcherSize) : 64,
        class: 'dex-panel-frame__slider',
        onInput: (event) => onLauncherSizeChange?.(Number(event.currentTarget.value)),
      }),
      h('label', { class: 'dex-sidebar__label' }, 'FAB behavior'),
      h('select', {
        class: 'dex-input',
        value: fabBehavior,
        onChange: (event) => onFabBehaviorChange?.(event.currentTarget.value === 'hub_first' ? 'hub_first' : 'quick_actions'),
      }, [
        h('option', { value: 'quick_actions' }, 'Quick actions first'),
        h('option', { value: 'hub_first' }, 'Hub first'),
      ]),
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
      h('h3', { class: 'dex-settings-section__title' }, 'Token overlay'),
      h('label', { class: 'dex-feature-toggle-row' }, [
        h('input', {
          type: 'checkbox',
          checked: tokenOverlayEnabled,
          onChange: (event) => onToggleTokenOverlay?.(event.currentTarget.checked),
        }),
        h('span', null, 'Enable token overlay'),
      ]),
      h('label', { class: 'dex-sidebar__label' }, 'Overlay mode'),
      h('select', {
        class: 'dex-input',
        value: tokenOverlayMode,
        onChange: (event) => onTokenOverlayModeChange?.(event.currentTarget.value === 'expanded' ? 'expanded' : 'compact'),
      }, [
        h('option', { value: 'compact' }, 'Compact'),
        h('option', { value: 'expanded' }, 'Expanded'),
      ]),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Required features'),
      h('div', { class: 'dex-settings-toggle-list' },
        featureToggles.map((toggle) => h('label', { key: toggle.id, class: 'dex-feature-toggle-row' }, [
          h('input', {
            type: 'checkbox',
            checked: toggle.enabled === true,
            onChange: (event) => onToggleFeature?.(toggle.id, event.currentTarget.checked),
          }),
          h('span', null, toggle.label),
        ]))
      ),
    ]),
    h('section', { class: 'dex-settings-section' }, [
      h('h3', { class: 'dex-settings-section__title' }, 'Recovery and relaunch'),
      h('div', { class: 'dex-form__actions' }, [
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onRecoverWindows?.() }, 'Recover windows'),
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onResetLayout?.() }, 'Reset layout'),
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onResetTheme?.() }, 'Reset theme'),
      ]),
      h('div', { class: 'dex-form__actions' }, [
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onRelaunchOnboarding?.() }, 'Relaunch onboarding'),
        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onRelaunchTour?.() }, 'Start quick tour'),
      ]),
    ]),
  ]);
}
