const frameEl = document.getElementById('render-frame');
const statusEl = document.getElementById('status');
const metaEl = document.getElementById('meta');
const reloadButton = document.getElementById('reload');

let sessionId = '';
let claimToken = '';
let currentRevision = 0;
let currentBundle = { html: '', css: '', js: '' };
let sessionPort = null;

function setStatus(text, isError = false) {
  if (!(statusEl instanceof HTMLElement)) return;
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function parseHash() {
  const hash = String(window.location.hash || '').replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return {
    sessionId: params.get('sid') || '',
    token: params.get('token') || '',
  };
}

function escapeForInlineScript(value) {
  return String(value || '').replace(/<\/script/gi, '<\\/script');
}

function buildSrcdoc(codeBundle) {
  const html = typeof codeBundle?.html === 'string' ? codeBundle.html : '';
  const css = typeof codeBundle?.css === 'string' ? codeBundle.css : '';
  const js = typeof codeBundle?.js === 'string' ? codeBundle.js : '';

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    "<meta charset=\"UTF-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none';\">",
    '<style>',
    'html, body { margin: 0; padding: 0; min-height: 100%; }',
    css,
    '</style>',
    '</head>',
    '<body>',
    html,
    '<script>',
    escapeForInlineScript(js),
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');
}

function applyCodeBundle(codeBundle, revision) {
  currentBundle = {
    html: typeof codeBundle?.html === 'string' ? codeBundle.html : '',
    css: typeof codeBundle?.css === 'string' ? codeBundle.css : '',
    js: typeof codeBundle?.js === 'string' ? codeBundle.js : '',
  };
  currentRevision = Number.isFinite(Number(revision)) ? Number(revision) : currentRevision;

  if (frameEl instanceof HTMLIFrameElement) {
    frameEl.srcdoc = buildSrcdoc(currentBundle);
  }
  if (metaEl instanceof HTMLElement) {
    metaEl.textContent = `Session ${sessionId || 'unknown'} • Revision ${currentRevision}`;
  }
  setStatus('Preview rendered');
}

async function claimSession() {
  const response = await chrome.runtime.sendMessage({
    action: 'CANVAS_SESSION_CLAIM',
    sessionId,
    token: claimToken,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Canvas session claim failed.');
  }

  const revision = Number(response.data?.revision || 1);
  const codeBundle = response.data?.codeBundle || {};
  applyCodeBundle(codeBundle, revision);
}

function attachSessionPort() {
  if (!sessionId) return;
  sessionPort = chrome.runtime.connect({ name: `dex_canvas_session:${sessionId}` });
  sessionPort.onMessage.addListener((message) => {
    if (message?.action !== 'CANVAS_APPLY_UPDATE') return;
    if (message?.sessionId !== sessionId) return;
    applyCodeBundle(message.codeBundle || {}, message.revision);
    setStatus('Preview updated from source tab');
  });
}

reloadButton?.addEventListener('click', () => {
  applyCodeBundle(currentBundle, currentRevision);
});

window.addEventListener('beforeunload', () => {
  try {
    sessionPort?.disconnect();
  } catch {}
  if (!sessionId) return;
  void chrome.runtime.sendMessage({
    action: 'CANVAS_SESSION_CLOSE',
    sessionId,
  });
});

(async function init() {
  const parsed = parseHash();
  sessionId = parsed.sessionId;
  claimToken = parsed.token;

  if (!sessionId || !claimToken) {
    setStatus('Missing canvas session credentials', true);
    return;
  }

  try {
    await claimSession();
    attachSessionPort();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  }
})();
