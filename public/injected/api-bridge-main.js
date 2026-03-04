(() => {
  if (window.__dexEnhanceApiBridgeInstalled) return;
  window.__dexEnhanceApiBridgeInstalled = true;

  const TYPE = 'DEXENHANCE_API_INTERCEPT';

  const readUsage = (json) => {
    if (!json || typeof json !== 'object') return { model: null, tokens: null };
    const model =
      json.model ||
      json.model_name ||
      json?.metadata?.model ||
      json?.candidate?.model ||
      null;
    const tokens =
      json?.usage?.total_tokens ??
      json?.usage?.prompt_tokens ??
      json?.usage?.completion_tokens ??
      json?.usageMetadata?.totalTokenCount ??
      json?.usageMetadata?.promptTokenCount ??
      json?.usageMetadata?.candidatesTokenCount ??
      null;
    return { model, tokens: Number.isFinite(Number(tokens)) ? Number(tokens) : null };
  };

  const post = (payload) => {
    try {
      window.postMessage({ type: TYPE, payload }, '*');
    } catch {}
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = String(args?.[0]?.url || args?.[0] || response.url || '');
    try {
      const clone = response.clone();
      const contentType = clone.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await clone.json();
        const { model, tokens } = readUsage(json);
        if (model || tokens !== null) {
          post({
            source: 'fetch',
            url,
            model,
            tokens,
            status: response.status,
            at: Date.now(),
          });
        }
      }
    } catch {}
    return response;
  };

  const XHROpen = XMLHttpRequest.prototype.open;
  const XHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__dexEnhanceUrl = String(url || '');
    return XHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', () => {
      try {
        const contentType = this.getResponseHeader('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const text = typeof this.responseText === 'string' ? this.responseText : '';
        if (!text) return;
        const json = JSON.parse(text);
        const { model, tokens } = readUsage(json);
        if (model || tokens !== null) {
          post({
            source: 'xhr',
            url: this.__dexEnhanceUrl || '',
            model,
            tokens,
            status: this.status,
            at: Date.now(),
          });
        }
      } catch {}
    });
    return XHRSend.apply(this, args);
  };
})();
