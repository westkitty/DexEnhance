export const HUD_SETTINGS_KEY = 'hudUiSettingsV1';

const SAFE_MARGIN = 8;

export const DEFAULT_HUD_SETTINGS = Object.freeze({
  accentHue: 202,
  panels: {},
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
    case 'sidebar':
      return { minWidth: 280, minHeight: 280 };
    case 'tokens':
      return { minWidth: 160, minHeight: 44 };
    case 'fab':
      return { minWidth: 52, minHeight: 52 };
    case 'promptLibrary':
      return { minWidth: 520, minHeight: 320 };
    case 'optimizer':
      return { minWidth: 520, minHeight: 300 };
    case 'tour':
      return { minWidth: 560, minHeight: 320 };
    case 'export':
      return { minWidth: 340, minHeight: 220 };
    case 'settings':
      return { minWidth: 320, minHeight: 220 };
    default:
      return { minWidth: 180, minHeight: 80 };
  }
}

export function defaultPanelState(panelId, viewport) {
  const { width, height } = viewportOrFallback(viewport);

  switch (panelId) {
    case 'sidebar': {
      const panelWidth = Math.min(360, Math.round(width * 0.32));
      const panelHeight = Math.min(640, Math.max(340, height - 140));
      return {
        x: 14,
        y: 74,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.96,
        collapsed: false,
        pinned: true,
      };
    }
    case 'tokens':
      return {
        x: Math.max(SAFE_MARGIN, width - 250),
        y: Math.max(SAFE_MARGIN, height - 62),
        width: 220,
        height: 48,
        opacity: 0.94,
        collapsed: true,
        pinned: true,
      };
    case 'fab':
      return {
        x: Math.max(SAFE_MARGIN, width - 78),
        y: Math.max(SAFE_MARGIN, height - 78),
        width: 62,
        height: 62,
        opacity: 1,
        collapsed: false,
        pinned: true,
      };
    case 'promptLibrary': {
      const panelWidth = Math.min(900, Math.max(560, Math.round(width * 0.66)));
      const panelHeight = Math.min(760, Math.max(420, Math.round(height * 0.8)));
      return {
        x: centerX(panelWidth, width),
        y: 36,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: true,
      };
    }
    case 'optimizer': {
      const panelWidth = Math.min(980, Math.max(620, Math.round(width * 0.72)));
      const panelHeight = Math.min(780, Math.max(420, Math.round(height * 0.82)));
      return {
        x: centerX(panelWidth, width),
        y: 34,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: true,
      };
    }
    case 'tour': {
      const panelWidth = Math.min(940, Math.max(620, Math.round(width * 0.7)));
      const panelHeight = Math.min(760, Math.max(420, Math.round(height * 0.78)));
      return {
        x: centerX(panelWidth, width),
        y: 30,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: true,
      };
    }
    case 'export': {
      const panelWidth = Math.min(560, Math.max(360, Math.round(width * 0.38)));
      const panelHeight = Math.min(420, Math.max(250, Math.round(height * 0.42)));
      return {
        x: centerX(panelWidth, width),
        y: centerY(panelHeight, height),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: true,
      };
    }
    case 'settings': {
      const panelWidth = Math.min(420, Math.max(320, Math.round(width * 0.32)));
      const panelHeight = Math.min(460, Math.max(260, Math.round(height * 0.48)));
      return {
        x: Math.max(SAFE_MARGIN, width - panelWidth - 20),
        y: 90,
        width: panelWidth,
        height: panelHeight,
        opacity: 0.97,
        collapsed: false,
        pinned: true,
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
    opacity: clamp(panelState?.opacity, 0.08, 1),
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

export function normalizeHudSettings(rawSettings, viewport) {
  const source = typeof rawSettings === 'object' && rawSettings !== null ? rawSettings : {};
  const sourcePanels = typeof source.panels === 'object' && source.panels !== null ? source.panels : {};
  const normalized = {
    accentHue: clamp(source.accentHue, 0, 360),
    panels: {},
  };

  const panelIds = ['sidebar', 'tokens', 'fab', 'promptLibrary', 'optimizer', 'tour', 'export', 'settings'];
  for (const panelId of panelIds) {
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
  return clamp(value, 0.08, 1);
}

export function hueToHudPalette(hue) {
  const safeHue = clamp(hue, 0, 360);
  return {
    accent: `hsl(${safeHue} 82% 58%)`,
    accent2: `hsl(${(safeHue + 42) % 360} 78% 50%)`,
    cta: `hsl(${(safeHue + 320) % 360} 88% 58%)`,
  };
}
