import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

function normalizeCodeBundle(value) {
  const source = typeof value === 'object' && value !== null ? value : {};
  return {
    html: typeof source.html === 'string' ? source.html.trim() : '',
    css: typeof source.css === 'string' ? source.css.trim() : '',
    js: typeof source.js === 'string' ? source.js.trim() : '',
  };
}

function isHtmlLanguage(language) {
  return ['html', 'htm', 'xml'].includes(language);
}

function isCssLanguage(language) {
  return ['css', 'scss', 'sass', 'less'].includes(language);
}

function isJavaScriptLanguage(language) {
  return ['js', 'javascript', 'ts', 'typescript'].includes(language);
}

function splitCodeFences(text) {
  const matches = [];
  const source = String(text || '');
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match = regex.exec(source);

  while (match) {
    matches.push({
      language: String(match[1] || '').trim().toLowerCase(),
      code: String(match[2] || '').trim(),
    });
    match = regex.exec(source);
  }

  return matches;
}

export function extractCodeBundleFromText(text) {
  const fences = splitCodeFences(text);
  if (fences.length === 0) {
    return normalizeCodeBundle({});
  }

  const bundle = { html: '', css: '', js: '' };

  for (const fence of fences) {
    if (!fence.code) continue;
    if (isHtmlLanguage(fence.language) && !bundle.html) bundle.html = fence.code;
    else if (isCssLanguage(fence.language) && !bundle.css) bundle.css = fence.code;
    else if (isJavaScriptLanguage(fence.language) && !bundle.js) bundle.js = fence.code;
    else if (!bundle.html && !fence.language) bundle.html = fence.code;
    else if (!bundle.js) bundle.js = fence.code;
  }

  return normalizeCodeBundle(bundle);
}

export function hasRunnableCodeBundle(codeBundle) {
  const bundle = normalizeCodeBundle(codeBundle);
  return Boolean(bundle.html || bundle.css || bundle.js);
}

export async function openPopoutCanvasFromLatestTurn({ adapter, site, chatUrl }) {
  const sourceTurnId = adapter.getLatestAssistantTurnId();
  const assistantText = adapter.getLatestAssistantTurnText();
  const codeBundle = extractCodeBundleFromText(assistantText);

  if (!hasRunnableCodeBundle(codeBundle)) {
    return {
      ok: false,
      error: 'No runnable code block found in latest assistant message.',
    };
  }

  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.CANVAS_OPEN_FROM_CHAT, {
    site,
    chatUrl,
    sourceTurnId,
    codeBundle,
  });

  return response;
}

export function createPopoutCanvasController({ adapter, site, getFeatureSettings }) {
  let lastAutoOpenedTurnId = '';
  let activeSessionId = '';

  function readLatestCodePayload() {
    const sourceTurnId = adapter.getLatestAssistantTurnId();
    const assistantText = adapter.getLatestAssistantTurnText();
    const codeBundle = extractCodeBundleFromText(assistantText);
    return { sourceTurnId, codeBundle };
  }

  async function openOrUpdateSessionFromLatestTurn() {
    const latest = readLatestCodePayload();
    if (!hasRunnableCodeBundle(latest.codeBundle)) {
      return {
        ok: false,
        error: 'No runnable code block found in latest assistant message.',
      };
    }

    if (activeSessionId) {
      const updateRes = await sendRuntimeMessage(MESSAGE_ACTIONS.CANVAS_SESSION_UPDATE, {
        sessionId: activeSessionId,
        codeBundle: latest.codeBundle,
      });
      if (updateRes?.ok) {
        return updateRes;
      }
      activeSessionId = '';
    }

    const openRes = await sendRuntimeMessage(MESSAGE_ACTIONS.CANVAS_OPEN_FROM_CHAT, {
      site,
      chatUrl: window.location.href,
      sourceTurnId: latest.sourceTurnId,
      codeBundle: latest.codeBundle,
    });
    if (openRes?.ok && typeof openRes.data?.sessionId === 'string') {
      activeSessionId = openRes.data.sessionId;
    }
    return openRes;
  }

  async function maybeAutoOpenFromLatestTurn() {
    const settings = getFeatureSettings?.();
    const enabled = settings?.modules?.popoutCanvas?.enabled === true;
    const autoOpen = settings?.modules?.popoutCanvas?.autoOpenOnCodeDetection === true;
    if (!enabled || !autoOpen) return;

    const turnId = adapter.getLatestAssistantTurnId();
    if (!turnId || turnId === lastAutoOpenedTurnId) return;

    const result = await openOrUpdateSessionFromLatestTurn();

    if (result?.ok) {
      lastAutoOpenedTurnId = turnId;
    }
  }

  async function openLatest() {
    const settings = getFeatureSettings?.();
    if (settings?.modules?.popoutCanvas?.enabled !== true) {
      return {
        ok: false,
        error: 'Pop-Out Canvas is disabled in settings.',
      };
    }

    return openOrUpdateSessionFromLatestTurn();
  }

  return {
    maybeAutoOpenFromLatestTurn,
    openLatest,
  };
}
