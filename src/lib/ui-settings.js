export const HUD_SETTINGS_KEY = 'hudUiSettingsV1';

const SAFE_MARGIN = 8;
const MIN_DRAWER_WIDTH = 320;
const MAX_DRAWER_WIDTH = 720;
const MIN_LAUNCHER_SIZE = 54;
const MAX_LAUNCHER_SIZE = 92;
const VALID_THEME_PRESETS = new Set(['graphite', 'paper', 'oxide']);
const VALID_DRAWER_VIEWS = new Set(['overview', 'prompts', 'queue', 'optimizer', 'context', 'export', 'settings', 'tour']);
const VALID_TOKEN_OVERLAY_MODES = new Set(['compact', 'expanded']);
const VALID_FAB_BEHAVIORS = new Set(['quick_actions', 'hub_first']);

export const PANEL_IDS = Object.freeze([
  'welcome',
  'launcher',
  'quickHub',
  'tour',
  'drawer',
]);

export const DEFAULT_HUD_SETTINGS = Object.freeze({
  themePreset: 'graphite',
  accentHue: 202,
  transparency: 0.96,
  panels: {},
  visibility: {
    welcome: true,
    launcher: true,
    quickHub: false,
    tour: false,
  },
  drawer: {
    side: 'right',
    width: 420,
    lastView: 'overview',
  },
  fab: {
    behavior: 'quick_actions',
    expanded: false,
  },
  tokenOverlay: {
    enabled: true,
    mode: 'compact',
  },
});

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function viewportOrFallback(viewport) {
  const width = clamp(viewport?.width ?? window?.innerWidth ?? 1280, 800, 10000);
  const height = clamp(viewport?.height ?? window?.innerHeight ?? 760, 560, 10000);
  return { width, height };
}

function centerX(width, viewportWidth) {
  return Math.round((viewportWidth - width) / 2);
}

function centerY(height, viewportHeight) {
  return Math.round((viewportHeight - height) / 2);
}

function normalizeThemePreset(value) {
  return VALID_THEME_PRESETS.has(value) ? value : DEFAULT_HUD_SETTINGS.themePreset;
}

function normalizeDrawerView(value) {
  return VALID_DRAWER_VIEWS.has(value) ? value : DEFAULT_HUD_SETTINGS.drawer.lastView;
}

function normalizeDrawerSide(value) {
  return value === 'left' ? 'left' : DEFAULT_HUD_SETTINGS.drawer.side;
}

function normalizeFabBehavior(value) {
  return VALID_FAB_BEHAVIORS.has(value) ? value : DEFAULT_HUD_SETTINGS.fab.behavior;
}

export function normalizeTokenOverlayMode(value) {
  return VALID_TOKEN_OVERLAY_MODES.has(value) ? value : DEFAULT_HUD_SETTINGS.tokenOverlay.mode;
}

export function panelMinSize(panelId) {
  switch (panelId) {
    case 'welcome':
      return { minWidth: 316, minHeight: 364 };
    case 'launcher':
      return { minWidth: MIN_LAUNCHER_SIZE, minHeight: MIN_LAUNCHER_SIZE };
    case 'quickHub':
      return { minWidth: 300, minHeight: 260 };
    case 'tour':
      return { minWidth: 360, minHeight: 320 };
    case 'drawer':
      return { minWidth: MIN_DRAWER_WIDTH, minHeight: 320 };
    default:
      return { minWidth: 180, minHeight: 80 };
  }
}

export function defaultPanelState(panelId, viewport) {
  const { width, height } = viewportOrFallback(viewport);

  switch (panelId) {
    case 'welcome': {
      const panelWidth = 316;
      const panelHeight = 364;
      return {
        x: centerX(panelWidth, width),
        y: Math.max(48, centerY(panelHeight, height) - 6),
        width: panelWidth,
        height: panelHeight,
        opacity: 1,
      };
    }
    case 'launcher': {
      const size = 64;
      return {
        x: Math.max(SAFE_MARGIN, width - size - 18),
        y: Math.max(SAFE_MARGIN, height - size - 18),
        width: size,
        height: size,
        opacity: 1,
      };
    }
    case 'quickHub': {
      const panelWidth = Math.min(380, Math.max(320, Math.round(width * 0.28)));
      const panelHeight = 360;
      return {
        x: Math.max(SAFE_MARGIN, width - panelWidth - 104),
        y: Math.max(40, height - panelHeight - 100),
        width: panelWidth,
        height: panelHeight,
        opacity: 1,
      };
    }
    case 'tour': {
      const panelWidth = Math.min(420, width - SAFE_MARGIN * 4);
      const panelHeight = 390;
      return {
        x: centerX(panelWidth, width),
        y: Math.max(40, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 1,
      };
    }
    case 'drawer': {
      const drawerWidth = Math.min(460, Math.max(MIN_DRAWER_WIDTH, Math.round(width * 0.34)));
      return {
        x: Math.max(SAFE_MARGIN, width - drawerWidth),
        y: 0,
        width: drawerWidth,
        height,
        opacity: 1,
      };
    }
    default:
      return {
        x: SAFE_MARGIN,
        y: SAFE_MARGIN,
        width: 420,
        height: 320,
        opacity: 1,
      };
  }
}

export function clampPanelState(panelState, viewport, minWidth = 180, minHeight = 80, panelId = 'unknown') {
  const { width: vw, height: vh } = viewportOrFallback(viewport);

  if (panelId === 'launcher') {
    const size = clamp(panelState?.width ?? panelState?.height, MIN_LAUNCHER_SIZE, MAX_LAUNCHER_SIZE);
    return {
      x: clamp(panelState?.x, SAFE_MARGIN, Math.max(SAFE_MARGIN, vw - size - SAFE_MARGIN)),
      y: clamp(panelState?.y, SAFE_MARGIN, Math.max(SAFE_MARGIN, vh - size - SAFE_MARGIN)),
      width: size,
      height: size,
      opacity: 1,
    };
  }

  if (panelId === 'drawer') {
    const width = clamp(panelState?.width, MIN_DRAWER_WIDTH, Math.min(MAX_DRAWER_WIDTH, vw - SAFE_MARGIN * 2));
    return {
      x: Math.max(SAFE_MARGIN, vw - width),
      y: 0,
      width,
      height: vh,
      opacity: 1,
    };
  }

  const width = clamp(panelState?.width, minWidth, Math.max(minWidth, vw - SAFE_MARGIN * 2));
  const height = clamp(panelState?.height, minHeight, Math.max(minHeight, vh - SAFE_MARGIN * 2));

  return {
    x: clamp(panelState?.x, SAFE_MARGIN, Math.max(SAFE_MARGIN, vw - width - SAFE_MARGIN)),
    y: clamp(panelState?.y, SAFE_MARGIN, Math.max(SAFE_MARGIN, vh - height - SAFE_MARGIN)),
    width,
    height,
    opacity: clamp(panelState?.opacity, 0.74, 1),
  };
}

function migrateLegacyPanel(sourcePanels, panelId, viewport) {
  if (panelId === 'launcher') {
    return sourcePanels?.launcher || sourcePanels?.fab || defaultPanelState('launcher', viewport);
  }
  if (panelId === 'quickHub') {
    return sourcePanels?.quickHub || sourcePanels?.sidebar || defaultPanelState('quickHub', viewport);
  }
  if (panelId === 'tour') {
    return sourcePanels?.tour || sourcePanels?.welcome || defaultPanelState('tour', viewport);
  }
  if (panelId === 'drawer') {
    const legacySource = sourcePanels?.drawer || sourcePanels?.promptLibrary || sourcePanels?.sidebar || sourcePanels?.settings || null;
    if (!legacySource) return defaultPanelState('drawer', viewport);
    return {
      ...defaultPanelState('drawer', viewport),
      width: legacySource.width,
    };
  }
  return sourcePanels?.welcome || defaultPanelState('welcome', viewport);
}

export function normalizePanelState(rawPanel, fallback, viewport, panelId = 'unknown') {
  const base = typeof fallback === 'object' && fallback !== null ? fallback : defaultPanelState(panelId, viewport);
  const source = typeof rawPanel === 'object' && rawPanel !== null ? rawPanel : {};
  const merged = {
    x: source.x ?? base.x,
    y: source.y ?? base.y,
    width: source.width ?? base.width,
    height: source.height ?? base.height,
    opacity: source.opacity ?? base.opacity,
  };
  const { minWidth, minHeight } = panelMinSize(panelId);
  return clampPanelState(merged, viewport, minWidth, minHeight, panelId);
}

function normalizeVisibility(source = {}) {
  return {
    welcome: source.welcome === true,
    launcher: source.launcher === true || source.fab === true || source.launcher == null,
    quickHub: source.quickHub === true,
    tour: source.tour === true,
  };
}

export function normalizeHudSettings(rawSettings, viewport) {
  const source = typeof rawSettings === 'object' && rawSettings !== null ? rawSettings : {};
  const sourcePanels = typeof source.panels === 'object' && source.panels !== null ? source.panels : {};
  const normalized = {
    themePreset: normalizeThemePreset(source.themePreset),
    accentHue: clamp(source.accentHue, 0, 360, DEFAULT_HUD_SETTINGS.accentHue),
    transparency: clamp(source.transparency, 0.74, 1, DEFAULT_HUD_SETTINGS.transparency),
    panels: {},
    visibility: normalizeVisibility(source.visibility),
    drawer: {
      side: normalizeDrawerSide(source.drawer?.side),
      width: clamp(
        source.drawer?.width ?? sourcePanels?.drawer?.width ?? sourcePanels?.promptLibrary?.width,
        MIN_DRAWER_WIDTH,
        MAX_DRAWER_WIDTH
      ),
      lastView: normalizeDrawerView(source.drawer?.lastView),
    },
    fab: {
      behavior: normalizeFabBehavior(source.fab?.behavior),
      expanded: source.fab?.expanded === true,
    },
    tokenOverlay: {
      enabled: source.tokenOverlay?.enabled !== false,
      mode: normalizeTokenOverlayMode(source.tokenOverlay?.mode),
    },
  };

  for (const panelId of PANEL_IDS) {
    const fallback = defaultPanelState(panelId, viewport);
    normalized.panels[panelId] = normalizePanelState(
      sourcePanels[panelId] ?? migrateLegacyPanel(sourcePanels, panelId, viewport),
      fallback,
      viewport,
      panelId
    );
  }

  normalized.panels.drawer.width = normalized.drawer.width;
  normalized.panels.drawer.height = viewportOrFallback(viewport).height;
  normalized.panels.drawer.x = Math.max(SAFE_MARGIN, viewportOrFallback(viewport).width - normalized.drawer.width);
  normalized.panels.drawer.y = 0;

  return normalized;
}

export function updatePanelInSettings(settings, panelId, patch, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  if (!PANEL_IDS.includes(panelId)) return current;
  const nextPanel = normalizePanelState(
    {
      ...current.panels[panelId],
      ...(typeof patch === 'object' && patch !== null ? patch : {}),
    },
    defaultPanelState(panelId, viewport),
    viewport,
    panelId
  );

  const next = {
    ...current,
    panels: {
      ...current.panels,
      [panelId]: nextPanel,
    },
  };

  if (panelId === 'drawer') {
    next.drawer = {
      ...current.drawer,
      width: nextPanel.width,
    };
  }

  return next;
}

export function updatePanelVisibilityInSettings(settings, panelId, isOpen, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  if (!['welcome', 'launcher', 'quickHub', 'tour'].includes(panelId)) return current;
  return {
    ...current,
    visibility: {
      ...current.visibility,
      [panelId]: isOpen === true,
    },
  };
}

export function updateThemeInSettings(settings, patch, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  const sourcePatch = typeof patch === 'object' && patch !== null ? patch : {};
  return normalizeHudSettings({
    ...current,
    ...sourcePatch,
    tokenOverlay: {
      ...current.tokenOverlay,
      ...(typeof sourcePatch.tokenOverlay === 'object' && sourcePatch.tokenOverlay !== null ? sourcePatch.tokenOverlay : {}),
    },
    fab: {
      ...current.fab,
      ...(typeof sourcePatch.fab === 'object' && sourcePatch.fab !== null ? sourcePatch.fab : {}),
    },
  }, viewport);
}

export function resetPanelInSettings(settings, panelId, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  if (!PANEL_IDS.includes(panelId)) return current;
  const next = {
    ...current,
    panels: {
      ...current.panels,
      [panelId]: defaultPanelState(panelId, viewport),
    },
  };
  if (panelId === 'drawer') {
    next.drawer = {
      ...current.drawer,
      width: next.panels.drawer.width,
    };
  }
  return next;
}

export function panelOpacityValue(value) {
  return clamp(value, 0.74, 1);
}

export function themePresetTokens(preset) {
  switch (normalizeThemePreset(preset)) {
    case 'paper':
      return {
        accent: '#0f6cbd',
        accent2: '#0a8f72',
        cta: '#b44d12',
        surface: '#f3f1eb',
        surfaceRaised: '#fcfbf7',
        surfaceContrast: '#ffffff',
        surfaceSubtle: '#e7e2d8',
        border: '#c4b8a2',
        borderStrong: '#8c7758',
        text: '#1b222c',
        textMuted: '#4f5b6d',
        danger: '#b43737',
        success: '#197a43',
        warning: '#94640d',
        shadowDrawer: '0 0 0 1px rgba(56, 43, 20, 0.10), -18px 0 42px rgba(34, 29, 22, 0.24)',
      };
    case 'oxide':
      return {
        accent: '#4ea1ff',
        accent2: '#27b38f',
        cta: '#e08a2e',
        surface: '#1f252d',
        surfaceRaised: '#2a313b',
        surfaceContrast: '#313a47',
        surfaceSubtle: '#171d24',
        border: '#4a5666',
        borderStrong: '#7d8ca3',
        text: '#edf3fb',
        textMuted: '#b3c0d0',
        danger: '#ff6b6b',
        success: '#3bc37d',
        warning: '#e9b44c',
        shadowDrawer: '0 0 0 1px rgba(255, 255, 255, 0.04), -18px 0 42px rgba(0, 0, 0, 0.38)',
      };
    case 'graphite':
    default:
      return {
        accent: '#7cc2ff',
        accent2: '#35c0a1',
        cta: '#f38b3d',
        surface: '#10151c',
        surfaceRaised: '#171d26',
        surfaceContrast: '#202833',
        surfaceSubtle: '#0a0f15',
        border: '#2f3947',
        borderStrong: '#5f7085',
        text: '#f3f7fc',
        textMuted: '#b7c3d2',
        danger: '#ff6b6b',
        success: '#39c57a',
        warning: '#e8b34d',
        shadowDrawer: '0 0 0 1px rgba(255, 255, 255, 0.04), -18px 0 42px rgba(0, 0, 0, 0.46)',
      };
  }
}
