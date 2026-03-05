const MAX_TOASTS = 5;
const DEDUPE_WINDOW_MS = 1800;

let nextToastId = 1;
const listeners = new Set();
const actionHandlers = new Map();
const dedupeMap = new Map();
let toasts = [];
const runtimeGlobal = typeof window !== 'undefined' ? window : globalThis;

function now() {
  return Date.now();
}

function emit() {
  const snapshot = toasts.slice();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[DexEnhance] Toast listener error:', error);
    }
  }
}

function sanitizeToastType(value) {
  if (value === 'success' || value === 'warning' || value === 'error' || value === 'action') {
    return value;
  }
  return 'info';
}

function stableToastKey(toast) {
  const title = typeof toast.title === 'string' ? toast.title : '';
  const message = typeof toast.message === 'string' ? toast.message : '';
  const type = sanitizeToastType(toast.type);
  return `${type}::${title}::${message}`;
}

function normalizedDurationMs(type, durationMs) {
  if (Number.isFinite(Number(durationMs))) {
    return Math.max(1500, Math.min(15000, Number(durationMs)));
  }
  if (type === 'error') return 9000;
  if (type === 'warning') return 7000;
  return 5000;
}

function clearActionsForToast(toastId) {
  for (const key of actionHandlers.keys()) {
    if (key.startsWith(`${toastId}:`)) actionHandlers.delete(key);
  }
}

function nextId() {
  const id = `dex-toast-${nextToastId}`;
  nextToastId += 1;
  return id;
}

function normalizeActions(toastId, actions) {
  if (!Array.isArray(actions)) return [];
  return actions
    .map((action, index) => {
      if (!action || typeof action !== 'object') return null;
      const label = typeof action.label === 'string' ? action.label.trim() : '';
      if (!label) return null;
      const actionId = `${toastId}:${index}`;
      if (typeof action.onSelect === 'function') {
        actionHandlers.set(actionId, action.onSelect);
      }
      return {
        id: actionId,
        label,
        closeOnSelect: action.closeOnSelect !== false,
      };
    })
    .filter(Boolean);
}

function toClipboardText(diagnostics) {
  if (!diagnostics) return '';
  try {
    return JSON.stringify(diagnostics, null, 2);
  } catch {
    return String(diagnostics);
  }
}

export function buildDiagnostics({ module, operation, host, url, version, error }) {
  const runtimeLocation = runtimeGlobal?.location || {};
  const runtimeChrome = runtimeGlobal?.chrome;
  return {
    module: module || 'unknown',
    operation: operation || 'unknown',
    host: host || runtimeLocation.hostname || 'unknown',
    url: url || runtimeLocation.href || '',
    version: version || runtimeChrome?.runtime?.getManifest?.()?.version || 'unknown',
    error: error?.message || String(error || 'unknown error'),
    stack: error?.stack || '',
    at: new Date().toISOString(),
  };
}

export async function copyDiagnosticsToClipboard(diagnostics) {
  const text = toClipboardText(diagnostics);
  if (!text) return false;
  const clipboard = runtimeGlobal?.navigator?.clipboard;
  if (!clipboard?.writeText) return false;
  await clipboard.writeText(text);
  return true;
}

export function showDexToast(input) {
  const toast = typeof input === 'object' && input !== null ? input : { message: String(input || '') };
  const type = sanitizeToastType(toast.type);
  const title = typeof toast.title === 'string' ? toast.title : '';
  const message = typeof toast.message === 'string' ? toast.message : '';
  const dedupeKey = stableToastKey({ type, title, message });
  const existing = dedupeMap.get(dedupeKey);
  const ts = now();

  if (existing && ts - existing < DEDUPE_WINDOW_MS) {
    return null;
  }
  dedupeMap.set(dedupeKey, ts);

  const id = nextId();
  const record = {
    id,
    type,
    title,
    message,
    details: typeof toast.details === 'string' ? toast.details : '',
    diagnostics: toast.diagnostics || null,
    createdAt: ts,
    durationMs: normalizedDurationMs(type, toast.durationMs),
  };

  record.actions = normalizeActions(id, toast.actions);

  toasts = [record, ...toasts].slice(0, MAX_TOASTS);
  emit();

  runtimeGlobal.setTimeout(() => {
    dismissDexToast(id);
  }, record.durationMs);

  return id;
}

export function dismissDexToast(id) {
  const before = toasts.length;
  if (!id) {
    toasts = [];
    actionHandlers.clear();
    emit();
    return;
  }
  toasts = toasts.filter((toast) => toast.id !== id);
  if (toasts.length === before) return;
  clearActionsForToast(id);
  emit();
}

export function selectDexToastAction(toastId, actionId) {
  const toast = toasts.find((item) => item.id === toastId);
  const action = toast?.actions?.find((item) => item.id === actionId);
  const handler = actionHandlers.get(actionId);

  if (typeof handler === 'function') {
    try {
      handler({ toastId, actionId, toast });
    } catch (error) {
      console.error('[DexEnhance] Toast action callback failed:', error);
    }
  }

  if (action?.closeOnSelect !== false) {
    dismissDexToast(toastId);
  }
}

export function subscribeDexToasts(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  listener(toasts.slice());
  return () => listeners.delete(listener);
}

export function relayToastFromRuntimeMessage(payload) {
  const source = typeof payload === 'object' && payload !== null ? payload : {};
  const actions = Array.isArray(source.actions)
    ? source.actions.map((action) => ({
        label: action?.label || '',
        closeOnSelect: action?.closeOnSelect !== false,
      }))
    : [];

  showDexToast({
    type: source.type,
    title: source.title,
    message: source.message,
    details: source.details,
    diagnostics: source.diagnostics,
    actions,
    durationMs: source.durationMs,
  });
}
