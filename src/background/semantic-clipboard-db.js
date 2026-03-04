const DB_NAME = 'dexenhance_semantic_clipboard_v1';
const DB_VERSION = 1;

const STORE_TAB_CONTEXTS = 'tab_contexts';
const STORE_EMBEDDING_CHUNKS = 'embedding_chunks';
const STORE_QUERY_CACHE = 'query_cache';

const DEFAULT_EMBEDDING_MODEL = 'dex-local-hash-384';
const DEFAULT_EMBEDDING_DIM = 384;

let dbPromise = null;

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return Math.min(max, Math.max(min, rounded));
}

function normalizeSourceUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return trimmed;
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

function createStoreIfMissing(database, upgradeTransaction, storeName, options) {
  if (database.objectStoreNames.contains(storeName)) {
    return upgradeTransaction.objectStore(storeName);
  }
  return database.createObjectStore(storeName, options);
}

function setupIndexes(store, definitions) {
  for (const definition of definitions) {
    if (!store.indexNames.contains(definition.name)) {
      store.createIndex(definition.name, definition.keyPath, definition.options || undefined);
    }
  }
}

async function sha256Hex(value) {
  const input = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', input);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return `sha256:${hex}`;
}

function deterministicEmbedding(text, dimension) {
  const dim = clampInt(dimension, 32, 1536, DEFAULT_EMBEDDING_DIM);
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

function cosineSimilarity(lhsVector, lhsNorm, rhsVector, rhsNorm) {
  if (!Array.isArray(lhsVector) || !Array.isArray(rhsVector)) return 0;
  if (lhsVector.length === 0 || lhsVector.length !== rhsVector.length) return 0;

  const safeLhsNorm = Number.isFinite(lhsNorm) && lhsNorm > 0 ? lhsNorm : 1;
  const safeRhsNorm = Number.isFinite(rhsNorm) && rhsNorm > 0 ? rhsNorm : 1;

  let dot = 0;
  for (let i = 0; i < lhsVector.length; i += 1) {
    dot += Number(lhsVector[i] || 0) * Number(rhsVector[i] || 0);
  }

  const denominator = safeLhsNorm * safeRhsNorm;
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return dot / denominator;
}

function normalizeChunkInput(chunks) {
  if (!Array.isArray(chunks)) return [];

  return chunks
    .map((rawChunk, index) => {
      const asObject = typeof rawChunk === 'object' && rawChunk !== null
        ? rawChunk
        : { chunkText: String(rawChunk || '') };

      const chunkText = typeof asObject.chunkText === 'string' ? asObject.chunkText.trim() : '';
      if (!chunkText) return null;

      const startOffset = Number.isFinite(Number(asObject.startOffset)) ? Number(asObject.startOffset) : 0;
      const endFallback = startOffset + chunkText.length;
      const endOffset = Number.isFinite(Number(asObject.endOffset)) ? Number(asObject.endOffset) : endFallback;
      const timestamp = Number.isFinite(Number(asObject.timestamp)) ? Number(asObject.timestamp) : Date.now() + index;

      return {
        chunkText,
        startOffset,
        endOffset,
        timestamp,
      };
    })
    .filter(Boolean);
}

function truncateForPreamble(value, maxLength = 360) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      const upgradeTx = request.transaction;
      const tabContexts = createStoreIfMissing(db, upgradeTx, STORE_TAB_CONTEXTS, {
        keyPath: 'sourceUrl',
      });
      setupIndexes(tabContexts, [
        { name: 'by_last_active_at', keyPath: 'lastActiveAt' },
        { name: 'by_tab_id', keyPath: 'tabId' },
        { name: 'by_window_id', keyPath: 'windowId' },
        { name: 'by_last_embedded_at', keyPath: 'lastEmbeddedAt' },
      ]);

      const embeddingChunks = createStoreIfMissing(db, upgradeTx, STORE_EMBEDDING_CHUNKS, {
        keyPath: 'id',
      });
      setupIndexes(embeddingChunks, [
        { name: 'by_source_url', keyPath: 'sourceUrl' },
        { name: 'by_timestamp', keyPath: 'timestamp' },
        { name: 'by_source_url_timestamp', keyPath: ['sourceUrl', 'timestamp'] },
        { name: 'by_source_chunk_hash', keyPath: ['sourceUrl', 'chunkHash'], options: { unique: true } },
      ]);

      const queryCache = createStoreIfMissing(db, upgradeTx, STORE_QUERY_CACHE, {
        keyPath: 'queryHash',
      });
      setupIndexes(queryCache, [
        { name: 'by_created_at', keyPath: 'createdAt' },
      ]);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open semantic clipboard IndexedDB.'));
  });

  return dbPromise;
}

async function collectMostRecentSourceUrls(tabStore, maxTrackedTabs) {
  const limit = clampInt(maxTrackedTabs, 1, 20, 5);
  const sourceUrls = [];
  const index = tabStore.index('by_last_active_at');
  let cursor = await requestToPromise(index.openCursor(null, 'prev'));

  while (cursor && sourceUrls.length < limit) {
    const sourceUrl = normalizeSourceUrl(cursor.value?.sourceUrl);
    if (sourceUrl && !sourceUrls.includes(sourceUrl)) {
      sourceUrls.push(sourceUrl);
    }
    cursor = await requestToPromise(cursor.continue());
  }

  return sourceUrls;
}

async function pruneExcessSources(tabStore, chunkStore, maxTrackedTabs) {
  const keepUrls = new Set(await collectMostRecentSourceUrls(tabStore, maxTrackedTabs));
  const allUrls = [];
  let tabCursor = await requestToPromise(tabStore.openCursor());

  while (tabCursor) {
    const sourceUrl = normalizeSourceUrl(tabCursor.value?.sourceUrl);
    if (sourceUrl) allUrls.push(sourceUrl);
    tabCursor = await requestToPromise(tabCursor.continue());
  }

  for (const sourceUrl of allUrls) {
    if (keepUrls.has(sourceUrl)) continue;

    tabStore.delete(sourceUrl);

    const chunkIndex = chunkStore.index('by_source_url');
    let chunkCursor = await requestToPromise(chunkIndex.openCursor(IDBKeyRange.only(sourceUrl)));
    while (chunkCursor) {
      chunkStore.delete(chunkCursor.primaryKey);
      chunkCursor = await requestToPromise(chunkCursor.continue());
    }
  }
}

async function writeQueryCache(queryStore, entry) {
  queryStore.put(entry);

  const maxCacheEntries = 64;
  const createdIndex = queryStore.index('by_created_at');
  let cursor = await requestToPromise(createdIndex.openCursor(null, 'prev'));
  let seen = 0;

  while (cursor) {
    seen += 1;
    if (seen > maxCacheEntries) {
      queryStore.delete(cursor.primaryKey);
    }
    cursor = await requestToPromise(cursor.continue());
  }
}

export async function upsertSemanticClipboardContext({
  sourceUrl,
  title = '',
  tabId = null,
  windowId = null,
  chunks,
  embeddingModel = DEFAULT_EMBEDDING_MODEL,
  embeddingDim = DEFAULT_EMBEDDING_DIM,
  maxTrackedTabs = 5,
}) {
  const normalizedSourceUrl = normalizeSourceUrl(sourceUrl);
  if (!normalizedSourceUrl) {
    throw new Error('SEMANTIC_CLIPBOARD_UPSERT_CONTEXT requires a valid sourceUrl.');
  }

  const normalizedChunks = normalizeChunkInput(chunks);
  if (normalizedChunks.length === 0) {
    throw new Error('SEMANTIC_CLIPBOARD_UPSERT_CONTEXT requires non-empty chunks.');
  }

  const safeEmbeddingDim = clampInt(embeddingDim, 32, 1536, DEFAULT_EMBEDDING_DIM);
  const now = Date.now();

  const preparedChunks = [];
  for (const chunk of normalizedChunks) {
    const chunkHash = await sha256Hex(chunk.chunkText);
    const embedding = deterministicEmbedding(chunk.chunkText, safeEmbeddingDim);
    preparedChunks.push({
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `dex_chunk_${now}_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: chunk.timestamp,
      sourceUrl: normalizedSourceUrl,
      chunkText: chunk.chunkText,
      chunkHash,
      embeddingVector: embedding.embeddingVector,
      vectorNorm: embedding.vectorNorm,
      tokenCount: Math.max(1, Math.ceil(chunk.chunkText.length / 4)),
      startOffset: chunk.startOffset,
      endOffset: chunk.endOffset,
    });
  }

  const contentHash = await sha256Hex(preparedChunks.map((chunk) => chunk.chunkHash).join('|'));
  const db = await getDb();
  const transaction = db.transaction([STORE_TAB_CONTEXTS, STORE_EMBEDDING_CHUNKS], 'readwrite');
  const tabStore = transaction.objectStore(STORE_TAB_CONTEXTS);
  const chunkStore = transaction.objectStore(STORE_EMBEDDING_CHUNKS);
  const sourceChunkIndex = chunkStore.index('by_source_chunk_hash');

  for (const chunk of preparedChunks) {
    const existing = await requestToPromise(sourceChunkIndex.get([chunk.sourceUrl, chunk.chunkHash]));
    if (existing && typeof existing === 'object') {
      chunk.id = existing.id;
    }
    chunkStore.put(chunk);
  }

  tabStore.put({
    sourceUrl: normalizedSourceUrl,
    tabId: Number.isFinite(Number(tabId)) ? Number(tabId) : null,
    windowId: Number.isFinite(Number(windowId)) ? Number(windowId) : null,
    title: typeof title === 'string' ? title : '',
    lastActiveAt: now,
    lastEmbeddedAt: now,
    embeddingModel: typeof embeddingModel === 'string' && embeddingModel.trim()
      ? embeddingModel.trim()
      : DEFAULT_EMBEDDING_MODEL,
    embeddingDim: safeEmbeddingDim,
    chunkCount: preparedChunks.length,
    contentHash,
  });

  await pruneExcessSources(tabStore, chunkStore, maxTrackedTabs);
  await transactionDone(transaction);

  return {
    sourceUrl: normalizedSourceUrl,
    chunkCount: preparedChunks.length,
    contentHash,
  };
}

export async function querySemanticClipboard({
  queryText,
  topK = 8,
  maxTrackedTabs = 5,
}) {
  const normalizedQuery = typeof queryText === 'string' ? queryText.trim() : '';
  if (!normalizedQuery) {
    throw new Error('SEMANTIC_CLIPBOARD_QUERY requires a non-empty queryText.');
  }

  const safeTopK = clampInt(topK, 1, 20, 8);
  const safeMaxTrackedTabs = clampInt(maxTrackedTabs, 1, 20, 5);

  const db = await getDb();
  const transaction = db.transaction([STORE_TAB_CONTEXTS, STORE_EMBEDDING_CHUNKS, STORE_QUERY_CACHE], 'readwrite');
  const tabStore = transaction.objectStore(STORE_TAB_CONTEXTS);
  const chunkStore = transaction.objectStore(STORE_EMBEDDING_CHUNKS);
  const queryStore = transaction.objectStore(STORE_QUERY_CACHE);

  const sourceUrls = await collectMostRecentSourceUrls(tabStore, safeMaxTrackedTabs);
  if (sourceUrls.length === 0) {
    await transactionDone(transaction);
    return {
      sourceUrls: [],
      matches: [],
    };
  }

  const queryHash = await sha256Hex(normalizedQuery);
  const cachedQuery = await requestToPromise(queryStore.get(queryHash));
  const queryEmbedding = cachedQuery && Array.isArray(cachedQuery.embeddingVector)
    ? {
        embeddingVector: cachedQuery.embeddingVector,
        vectorNorm: Number.isFinite(Number(cachedQuery.vectorNorm)) ? Number(cachedQuery.vectorNorm) : 1,
      }
    : deterministicEmbedding(normalizedQuery, DEFAULT_EMBEDDING_DIM);

  await writeQueryCache(queryStore, {
    queryHash,
    queryText: normalizedQuery,
    embeddingVector: queryEmbedding.embeddingVector,
    vectorNorm: queryEmbedding.vectorNorm,
    createdAt: Date.now(),
  });

  const bySource = chunkStore.index('by_source_url');
  const matches = [];

  for (const sourceUrl of sourceUrls) {
    let cursor = await requestToPromise(bySource.openCursor(IDBKeyRange.only(sourceUrl)));
    while (cursor) {
      const chunk = cursor.value;
      const score = cosineSimilarity(
        queryEmbedding.embeddingVector,
        queryEmbedding.vectorNorm,
        chunk.embeddingVector,
        chunk.vectorNorm
      );

      matches.push({
        id: chunk.id,
        sourceUrl: chunk.sourceUrl,
        chunkText: chunk.chunkText,
        score,
        timestamp: chunk.timestamp,
        tokenCount: chunk.tokenCount,
      });

      cursor = await requestToPromise(cursor.continue());
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  await transactionDone(transaction);

  return {
    sourceUrls,
    matches: matches.slice(0, safeTopK),
  };
}

export async function buildSemanticClipboardPreamble({
  queryText,
  topK = 8,
  maxTrackedTabs = 5,
}) {
  const result = await querySemanticClipboard({ queryText, topK, maxTrackedTabs });
  if (!Array.isArray(result.matches) || result.matches.length === 0) {
    return {
      preamble: '',
      matches: [],
      sourceUrls: result.sourceUrls || [],
    };
  }

  const lines = ['Relevant context from your local Semantic Clipboard:'];
  result.matches.forEach((match, index) => {
    const score = Number.isFinite(match.score) ? match.score.toFixed(4) : '0.0000';
    lines.push(`[${index + 1}] (${score}) ${match.sourceUrl}`);
    lines.push(truncateForPreamble(match.chunkText, 360));
  });

  return {
    preamble: `${lines.join('\n')}\n`,
    matches: result.matches,
    sourceUrls: result.sourceUrls || [],
  };
}

export async function getSemanticClipboardStats() {
  const db = await getDb();
  const transaction = db.transaction([STORE_TAB_CONTEXTS, STORE_EMBEDDING_CHUNKS, STORE_QUERY_CACHE], 'readonly');
  const tabStore = transaction.objectStore(STORE_TAB_CONTEXTS);
  const chunkStore = transaction.objectStore(STORE_EMBEDDING_CHUNKS);
  const queryStore = transaction.objectStore(STORE_QUERY_CACHE);

  const [sourceCount, chunkCount, cacheCount] = await Promise.all([
    requestToPromise(tabStore.count()),
    requestToPromise(chunkStore.count()),
    requestToPromise(queryStore.count()),
  ]);

  await transactionDone(transaction);

  return {
    sourceCount,
    chunkCount,
    queryCacheCount: cacheCount,
  };
}
