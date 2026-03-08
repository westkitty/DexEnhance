export const FEATURE_SETTINGS_KEY = 'featureSettingsV1';
export const FEATURE_SETTINGS_SCHEMA_VERSION = 1;

const DEFAULT_MODULE_SETTINGS = Object.freeze({
  ghostOverlay: Object.freeze({ enabled: false }),
  observerAgent: Object.freeze({ enabled: false, notificationsEnabled: true }),
  semanticClipboard: Object.freeze({ enabled: true, maxTrackedTabs: 5, topK: 8 }),
  popoutCanvas: Object.freeze({ enabled: true, autoOpenOnCodeDetection: false }),
  tokenOverlay: Object.freeze({ enabled: true, compactMode: true }),
  macroRecorder: Object.freeze({ enabled: false, captureKeystrokes: false }),
  conversationMapper: Object.freeze({ enabled: false, clusterMode: 'temporal' }),
  promptUnitTesting: Object.freeze({ enabled: false, maxBatchSize: 8 }),
});

export const DEFAULT_FEATURE_SETTINGS = Object.freeze({
  schemaVersion: FEATURE_SETTINGS_SCHEMA_VERSION,
  updatedAt: 0,
  modules: DEFAULT_MODULE_SETTINGS,
});

const MODULE_FIELD_ALLOWLIST = Object.freeze({
  ghostOverlay: ['enabled'],
  observerAgent: ['enabled', 'notificationsEnabled'],
  semanticClipboard: ['enabled', 'maxTrackedTabs', 'topK'],
  popoutCanvas: ['enabled', 'autoOpenOnCodeDetection'],
  tokenOverlay: ['enabled', 'compactMode'],
  macroRecorder: ['enabled', 'captureKeystrokes'],
  conversationMapper: ['enabled', 'clusterMode'],
  promptUnitTesting: ['enabled', 'maxBatchSize'],
});

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return Math.min(max, Math.max(min, rounded));
}

function normalizeModuleSettings(moduleId, value) {
  const source = typeof value === 'object' && value !== null ? value : {};

  switch (moduleId) {
    case 'ghostOverlay':
      return {
        enabled: source.enabled === true,
      };
    case 'observerAgent':
      return {
        enabled: source.enabled === true,
        notificationsEnabled: source.notificationsEnabled !== false,
      };
    case 'semanticClipboard':
      return {
        enabled: source.enabled == null ? true : source.enabled === true,
        maxTrackedTabs: clampInt(source.maxTrackedTabs, 1, 20, 5),
        topK: clampInt(source.topK, 1, 20, 8),
      };
    case 'popoutCanvas':
      return {
        enabled: source.enabled == null ? true : source.enabled === true,
        autoOpenOnCodeDetection: source.autoOpenOnCodeDetection === true,
      };
    case 'tokenOverlay':
      return {
        enabled: source.enabled !== false,
        compactMode: source.compactMode !== false,
      };
    case 'macroRecorder':
      return {
        enabled: source.enabled === true,
        captureKeystrokes: source.captureKeystrokes === true,
      };
    case 'conversationMapper':
      return {
        enabled: source.enabled === true,
        clusterMode: source.clusterMode === 'semantic' ? 'semantic' : 'temporal',
      };
    case 'promptUnitTesting':
      return {
        enabled: source.enabled === true,
        maxBatchSize: clampInt(source.maxBatchSize, 1, 32, 8),
      };
    default:
      return { enabled: false };
  }
}

function emptyModules() {
  return {
    ghostOverlay: normalizeModuleSettings('ghostOverlay', {}),
    observerAgent: normalizeModuleSettings('observerAgent', {}),
    semanticClipboard: normalizeModuleSettings('semanticClipboard', {}),
    popoutCanvas: normalizeModuleSettings('popoutCanvas', {}),
    tokenOverlay: normalizeModuleSettings('tokenOverlay', {}),
    macroRecorder: normalizeModuleSettings('macroRecorder', {}),
    conversationMapper: normalizeModuleSettings('conversationMapper', {}),
    promptUnitTesting: normalizeModuleSettings('promptUnitTesting', {}),
  };
}

export function normalizeFeatureSettings(value) {
  const source = typeof value === 'object' && value !== null ? value : {};
  const modules = typeof source.modules === 'object' && source.modules !== null ? source.modules : {};
  const normalizedModules = emptyModules();

  for (const moduleId of Object.keys(normalizedModules)) {
    normalizedModules[moduleId] = normalizeModuleSettings(moduleId, modules[moduleId]);
  }

  return {
    schemaVersion: FEATURE_SETTINGS_SCHEMA_VERSION,
    updatedAt: Number.isFinite(source.updatedAt) ? Number(source.updatedAt) : 0,
    modules: normalizedModules,
  };
}

export function featureModuleIds() {
  return Object.keys(MODULE_FIELD_ALLOWLIST);
}

export function updateFeatureModule(settings, moduleId, patch) {
  const validFields = MODULE_FIELD_ALLOWLIST[moduleId];
  if (!validFields) {
    throw new Error(`Unknown feature module: ${String(moduleId)}`);
  }

  const normalized = normalizeFeatureSettings(settings);
  const sourcePatch = typeof patch === 'object' && patch !== null ? patch : {};
  const safePatch = {};

  for (const field of validFields) {
    if (Object.prototype.hasOwnProperty.call(sourcePatch, field)) {
      safePatch[field] = sourcePatch[field];
    }
  }

  return {
    ...normalized,
    updatedAt: Date.now(),
    modules: {
      ...normalized.modules,
      [moduleId]: normalizeModuleSettings(moduleId, {
        ...normalized.modules[moduleId],
        ...safePatch,
      }),
    },
  };
}

export function replaceFeatureSettings(nextSettings) {
  const normalized = normalizeFeatureSettings(nextSettings);
  return {
    ...normalized,
    updatedAt: Date.now(),
  };
}
