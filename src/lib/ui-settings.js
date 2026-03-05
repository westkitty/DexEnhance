export const HUD_SETTINGS_KEY = 'hudUiSettingsV1';

const SAFE_MARGIN = 8;

export const PANEL_IDS = Object.freeze([
  'welcome',
  'hub',
  'sidebar',
  'tokens',
  'fab',
  'promptLibrary',
  'optimizer',
  'tour',
  'export',
  'settings',
]);

export const DEFAULT_HUD_SETTINGS = Object.freeze({
  accentHue: 202,
  bgBaseHue: 214,
  bgBaseSaturation: 24,
  bgBaseLightness: 93,
  bgGlassHue: 214,
  bgGlassSaturation: 18,
  bgGlassLightness: 86,
  bgGlassAlpha: 0.78,
  panels: {},
  visibility: {
    welcome: false,
    hub: false,
    sidebar: false,
    tokens: false,
    fab: true,
    promptLibrary: false,
    optimizer: false,
    tour: false,
    export: false,
    settings: false,
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

export function panelMinSize(panelId) {
  switch (panelId) {
    case 'welcome':
      return { minWidth: 316, minHeight: 364 };
    case 'hub':
      return { minWidth: 300, minHeight: 220 };
    case 'sidebar':
      return { minWidth: 240, minHeight: 220 };
    case 'tokens':
      return { minWidth: 160, minHeight: 44 };
    case 'fab':
      return { minWidth: 46, minHeight: 46 };
    case 'promptLibrary':
      return { minWidth: 460, minHeight: 280 };
    case 'optimizer':
      return { minWidth: 460, minHeight: 280 };
    case 'tour':
      return { minWidth: 500, minHeight: 300 };
    case 'export':
      return { minWidth: 320, minHeight: 200 };
    case 'settings':
      return { minWidth: 360, minHeight: 280 };
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
        collapsed: false,
        pinned: false,
      };
    }
    case 'hub': {
      const panelWidth = Math.min(440, Math.max(320, Math.round(width * 0.3)));
      const panelHeight = Math.min(520, Math.max(300, Math.round(height * 0.48)));
      return {
        x: centerX(panelWidth, width),
        y: Math.max(38, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.98,
        collapsed: false,
        pinned: false,
      };
    }
    case 'sidebar': {
      const panelWidth = Math.min(300, Math.max(240, Math.round(width * 0.24)));
      const panelHeight = Math.min(560, Math.max(300, Math.round(height * 0.6)));
      return {
        x: 14,
        y: 74,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.96,
        collapsed: false,
        pinned: false,
      };
    }
    case 'tokens':
      return {
        x: Math.max(SAFE_MARGIN, width - 206),
        y: Math.max(SAFE_MARGIN, height - 60),
        width: 176,
        height: 48,
        opacity: 0.94,
        collapsed: false,
        pinned: false,
      };
    case 'fab':
      return {
        x: Math.max(SAFE_MARGIN, width - 72),
        y: Math.max(SAFE_MARGIN, height - 72),
        width: 56,
        height: 56,
        opacity: 1,
        collapsed: false,
        pinned: false,
      };
    case 'promptLibrary': {
      const panelWidth = Math.min(760, Math.max(500, Math.round(width * 0.56)));
      const panelHeight = Math.min(620, Math.max(360, Math.round(height * 0.68)));
      return {
        x: centerX(panelWidth, width),
        y: Math.max(26, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: false,
      };
    }
    case 'optimizer': {
      const panelWidth = Math.min(780, Math.max(500, Math.round(width * 0.58)));
      const panelHeight = Math.min(620, Math.max(360, Math.round(height * 0.68)));
      return {
        x: centerX(panelWidth, width),
        y: Math.max(24, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: false,
      };
    }
    case 'tour': {
      const panelWidth = Math.min(700, Math.max(500, Math.round(width * 0.58)));
      const panelHeight = Math.min(500, Math.max(320, Math.round(panelWidth * 0.56)));
      return {
        x: centerX(panelWidth, width),
        y: Math.max(30, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.98,
        collapsed: false,
        pinned: false,
      };
    }
    case 'export': {
      const panelWidth = Math.min(460, Math.max(320, Math.round(width * 0.32)));
      const panelHeight = Math.min(340, Math.max(210, Math.round(height * 0.32)));
      return {
        x: centerX(panelWidth, width),
        y: centerY(panelHeight, height),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: false,
      };
    }
    case 'settings': {
      const panelWidth = Math.min(500, Math.max(380, Math.round(width * 0.36)));
      const panelHeight = Math.min(680, Math.max(420, Math.round(height * 0.65)));
      return {
        x: centerX(panelWidth, width),
        y: Math.max(24, centerY(panelHeight, height)),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.98,
        collapsed: false,
        pinned: false,
      };
    }
    default:
      return {
        x: 40,
        y: 90,
        width: 420,
        height: 320,
        opacity: 0.96,
        collapsed: false,
        pinned: false,
      };
  }
}

export function clampPanelState(panelState, viewport, minWidth = 180, minHeight = 80) {
  const { width: vw, height: vh } = viewportOrFallback(viewport);
  const width = clamp(panelState?.width, minWidth, Math.max(minWidth, vw - SAFE_MARGIN * 2));
  const height = clamp(panelState?.height, minHeight, Math.max(minHeight, vh - SAFE_MARGIN * 2));

  const maxX = Math.max(SAFE_MARGIN, vw - width - SAFE_MARGIN);
  const maxY = Math.max(SAFE_MARGIN, vh - (panelState?.collapsed ? 44 : height) - SAFE_MARGIN);

  return {
    x: clamp(panelState?.x, SAFE_MARGIN, maxX),
    y: clamp(panelState?.y, SAFE_MARGIN, maxY),
    width,
    height,
    opacity: clamp(panelState?.opacity, 0.28, 1),
    collapsed: panelState?.collapsed === true,
    pinned: panelState?.pinned === true,
  };
}

export function normalizePanelState(rawPanel, fallback, viewport, panelId = 'unknown') {
  const source = typeof rawPanel === 'object' && rawPanel !== null ? rawPanel : {};
  const base = typeof fallback === 'object' && fallback !== null ? fallback : defaultPanelState('unknown', viewport);
  const merged = {
    x: source.x ?? base.x,
    y: source.y ?? base.y,
    width: source.width ?? base.width,
    height: source.height ?? base.height,
    opacity: source.opacity ?? base.opacity,
    collapsed: source.collapsed ?? base.collapsed,
    pinned: source.pinned ?? base.pinned,
  };
  const { minWidth, minHeight } = panelMinSize(panelId);
  return clampPanelState(merged, viewport, minWidth, minHeight);
}

function normalizeVisibility(rawVisibility) {
  const source = typeof rawVisibility === 'object' && rawVisibility !== null ? rawVisibility : {};
  const normalized = {};
  for (const panelId of PANEL_IDS) {
    const fallback = DEFAULT_HUD_SETTINGS.visibility[panelId] === true;
    normalized[panelId] = source[panelId] === true ? true : fallback;
  }
  return normalized;
}

export function normalizeHudSettings(rawSettings, viewport) {
  const source = typeof rawSettings === 'object' && rawSettings !== null ? rawSettings : {};
  const sourcePanels = typeof source.panels === 'object' && source.panels !== null ? source.panels : {};
  const normalized = {
    accentHue: clamp(source.accentHue ?? DEFAULT_HUD_SETTINGS.accentHue, 0, 360),
    bgBaseHue: clamp(source.bgBaseHue ?? DEFAULT_HUD_SETTINGS.bgBaseHue, 0, 360),
    bgBaseSaturation: clamp(source.bgBaseSaturation ?? DEFAULT_HUD_SETTINGS.bgBaseSaturation, 0, 100),
    bgBaseLightness: clamp(source.bgBaseLightness ?? DEFAULT_HUD_SETTINGS.bgBaseLightness, 0, 100),
    bgGlassHue: clamp(source.bgGlassHue ?? DEFAULT_HUD_SETTINGS.bgGlassHue, 0, 360),
    bgGlassSaturation: clamp(source.bgGlassSaturation ?? DEFAULT_HUD_SETTINGS.bgGlassSaturation, 0, 100),
    bgGlassLightness: clamp(source.bgGlassLightness ?? DEFAULT_HUD_SETTINGS.bgGlassLightness, 0, 100),
    bgGlassAlpha: clamp(source.bgGlassAlpha ?? DEFAULT_HUD_SETTINGS.bgGlassAlpha, 0.18, 0.9),
    panels: {},
    visibility: normalizeVisibility(source.visibility),
  };

  for (const panelId of PANEL_IDS) {
    const fallback = defaultPanelState(panelId, viewport);
    normalized.panels[panelId] = normalizePanelState(sourcePanels[panelId], fallback, viewport, panelId);
  }

  return normalized;
}

export function updatePanelInSettings(settings, panelId, patch, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  const nextPanel = normalizePanelState(
    {
      ...current.panels[panelId],
      ...(typeof patch === 'object' && patch !== null ? patch : {}),
    },
    defaultPanelState(panelId, viewport),
    viewport,
    panelId
  );

  return {
    ...current,
    panels: {
      ...current.panels,
      [panelId]: nextPanel,
    },
  };
}

export function updatePanelVisibilityInSettings(settings, panelId, isOpen, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  if (!PANEL_IDS.includes(panelId)) return current;
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
  }, viewport);
}

export function resetPanelInSettings(settings, panelId, viewport) {
  const current = normalizeHudSettings(settings, viewport);
  return {
    ...current,
    panels: {
      ...current.panels,
      [panelId]: defaultPanelState(panelId, viewport),
    },
  };
}

export function panelOpacityValue(value) {
  return clamp(value, 0.28, 1);
}

export function hueToHudPalette(hue) {
  const safeHue = clamp(hue, 0, 360);
  return {
    accent: `hsl(${safeHue} 82% 58%)`,
    accent2: `hsl(${(safeHue + 42) % 360} 78% 50%)`,
    cta: `hsl(${(safeHue + 320) % 360} 88% 58%)`,
  };
}

export function hudBackgroundPalette(settings) {
  const normalized = normalizeHudSettings(settings, { width: 1280, height: 760 });
  return {
    bgBase: `hsl(${Math.round(normalized.bgBaseHue)} ${Math.round(normalized.bgBaseSaturation)}% ${Math.round(normalized.bgBaseLightness)}%)`,
    bgGlass: `hsla(${Math.round(normalized.bgGlassHue)} ${Math.round(normalized.bgGlassSaturation)}% ${Math.round(normalized.bgGlassLightness)}% / ${normalized.bgGlassAlpha.toFixed(2)})`,
  };
}
