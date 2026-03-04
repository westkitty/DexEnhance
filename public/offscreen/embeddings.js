function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return Math.min(max, Math.max(min, rounded));
}

function deterministicEmbedding(text, dimension = 384) {
  const dim = clampInt(dimension, 32, 1536, 384);
  const vector = new Array(dim).fill(0);
  const input = String(text || '');

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    const a = (code * 31 + index * 17) % dim;
    const b = (code * 13 + index * 29 + 7) % dim;
    vector[a] += (code % 23) - 11;
    vector[b] -= (code % 19) - 9;
  }

  let vectorNorm = 0;
  for (const value of vector) {
    vectorNorm += value * value;
  }
  vectorNorm = Math.sqrt(vectorNorm);
  if (!Number.isFinite(vectorNorm) || vectorNorm <= 0) vectorNorm = 1;

  return {
    embeddingVector: vector,
    vectorNorm,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'SEMANTIC_EMBED_RUNTIME_PING') {
    sendResponse({ ok: true, data: { status: 'ready' } });
    return false;
  }

  if (message?.action === 'SEMANTIC_EMBED_TEXTS_RUNTIME') {
    const texts = Array.isArray(message.texts) ? message.texts : [];
    const dimension = clampInt(message.dimension, 32, 1536, 384);
    const embeddings = texts.map((text) => deterministicEmbedding(text, dimension));
    sendResponse({ ok: true, data: { embeddings, dimension } });
    return false;
  }

  return false;
});
