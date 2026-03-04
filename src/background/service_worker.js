// Background service worker — Manifest V3
//
// RULES (do not violate in future edits):
// 1. All chrome.* event listeners MUST be registered synchronously at the top level.
// 2. Do NOT use localStorage — unavailable in service worker context.
// 3. Keep all cross-site extension state operations in this worker.

import { MESSAGE_ACTIONS } from '../lib/message-protocol.js';
import { DEFAULT_PROMPT_TEMPLATES, PROMPT_CATALOG_VERSION } from '../lib/default-prompts.js';
import { clearRules, updateRules } from './api_interceptor.js';

const storage = chrome.storage.local;
const STORAGE_KEYS = Object.freeze({
  FOLDERS: 'folders',
  CHAT_FOLDER_MAP: 'chatFolderMap',
  PROMPTS: 'prompts',
  PROMPT_CATALOG_VERSION: 'promptCatalogVersion',
});

function ok(data) {
  return data === undefined ? { ok: true } : { ok: true, data };
}

function fail(error) {
  return { ok: false, error };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `dex_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChatUrl(chatUrl) {
  if (typeof chatUrl !== 'string') return '';
  const trimmed = chatUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return trimmed;
  }
}

function parseVariablesFromPromptBody(body) {
  if (typeof body !== 'string') return [];
  const pattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
  const names = new Set();
  let match = pattern.exec(body);
  while (match) {
    if (match[1]) names.add(match[1]);
    match = pattern.exec(body);
  }
  return [...names];
}

function promptFingerprint(prompt) {
  const title = typeof prompt?.title === 'string' ? prompt.title.trim().toLowerCase() : '';
  const body = typeof prompt?.body === 'string' ? prompt.body.trim() : '';
  return `${title}::${body}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeOptimizerSite(site) {
  if (site === 'chatgpt' || site === 'gemini') return site;
  return '';
}

function getOptimizerSiteUrl(site) {
  if (site === 'chatgpt') return 'https://chatgpt.com/';
  if (site === 'gemini') return 'https://gemini.google.com/';
  return '';
}

async function waitForOptimizerWorkerReady(tabId, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    let tab;
    try {
      tab = await chrome.tabs.get(tabId);
    } catch {
      throw new Error('Hidden optimizer tab closed before becoming ready.');
    }

    if (tab.status === 'complete') {
      try {
        const ping = await chrome.tabs.sendMessage(tabId, {
          action: MESSAGE_ACTIONS.OPTIMIZER_WORKER_PING,
        });
        if (ping?.ok) return;
      } catch {
        // Content script may still be initializing. Retry.
      }
    }

    await sleep(500);
  }

  throw new Error('Timed out waiting for hidden-tab optimizer worker.');
}

async function runHiddenTabRefinement({ site, prompt }) {
  const normalizedSite = normalizeOptimizerSite(site);
  if (!normalizedSite) {
    throw new Error('OPTIMIZER_REFINE_HIDDEN_TAB requires site: "chatgpt" or "gemini".');
  }

  const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  if (!normalizedPrompt) {
    throw new Error('OPTIMIZER_REFINE_HIDDEN_TAB requires a non-empty prompt.');
  }

  const targetUrl = getOptimizerSiteUrl(normalizedSite);
  if (!targetUrl) {
    throw new Error(`Unsupported optimizer site: ${String(site)}`);
  }

  let tabId = null;
  try {
    const tab = await chrome.tabs.create({
      url: targetUrl,
      active: false,
    });

    if (!Number.isFinite(tab?.id)) {
      throw new Error('Failed to create hidden optimizer tab.');
    }

    tabId = Number(tab.id);
    await waitForOptimizerWorkerReady(tabId, 45000);

    const response = await chrome.tabs.sendMessage(tabId, {
      action: MESSAGE_ACTIONS.OPTIMIZER_WORKER_REFINE,
      prompt: normalizedPrompt,
      timeoutMs: 120000,
    });

    if (!response?.ok) {
      throw new Error(response?.error || 'Hidden-tab refinement failed.');
    }

    const refinedPrompt = typeof response.data?.refinedPrompt === 'string'
      ? response.data.refinedPrompt.trim()
      : '';
    if (!refinedPrompt) {
      throw new Error('Hidden-tab refinement returned empty text.');
    }

    return {
      refinedPrompt,
      mode: 'hidden_tab',
    };
  } finally {
    if (Number.isFinite(tabId)) {
      await chrome.tabs.remove(Number(tabId)).catch(() => {});
    }
  }
}

/**
 * @param {any} prompt
 * @returns {{id:string,title:string,body:string,tags:string[],variables:string[],createdAt:number}}
 */
function normalizePrompt(prompt) {
  const id = typeof prompt?.id === 'string' && prompt.id ? prompt.id : createId();
  const title = typeof prompt?.title === 'string' && prompt.title.trim() ? prompt.title.trim() : 'Untitled Prompt';
  const body = typeof prompt?.body === 'string' ? prompt.body : '';
  const tags = Array.isArray(prompt?.tags)
    ? [...new Set(prompt.tags.map((tag) => String(tag).trim()).filter(Boolean))]
    : [];
  const createdAt = Number.isFinite(prompt?.createdAt) ? Number(prompt.createdAt) : Date.now();
  const variables = parseVariablesFromPromptBody(body);
  return { id, title, body, tags, variables, createdAt };
}

/**
 * @param {any} folder
 * @returns {{id:string,name:string,parentId:string|null,chatUrls:string[],createdAt:number,deletedAt:number|null}}
 */
function normalizeFolder(folder) {
  const id = typeof folder?.id === 'string' && folder.id ? folder.id : createId();
  const name = typeof folder?.name === 'string' && folder.name.trim() ? folder.name.trim() : 'Untitled Folder';
  const parentId = typeof folder?.parentId === 'string' && folder.parentId ? folder.parentId : null;
  const createdAt = Number.isFinite(folder?.createdAt) ? Number(folder.createdAt) : Date.now();
  const deletedAt = Number.isFinite(folder?.deletedAt) ? Number(folder.deletedAt) : null;

  const urls = Array.isArray(folder?.chatUrls) ? folder.chatUrls : [];
  const chatUrls = [...new Set(urls.map((url) => normalizeChatUrl(url)).filter(Boolean))];

  return { id, name, parentId, chatUrls, createdAt, deletedAt };
}

async function loadFolderState() {
  const state = await storage.get([STORAGE_KEYS.FOLDERS, STORAGE_KEYS.CHAT_FOLDER_MAP]);
  const folders = Array.isArray(state[STORAGE_KEYS.FOLDERS]) ? state[STORAGE_KEYS.FOLDERS].map(normalizeFolder) : [];
  const rawMap = isRecord(state[STORAGE_KEYS.CHAT_FOLDER_MAP]) ? state[STORAGE_KEYS.CHAT_FOLDER_MAP] : {};
  const chatFolderMap = {};

  for (const [rawUrl, rawFolderId] of Object.entries(rawMap)) {
    if (typeof rawFolderId !== 'string' || !rawFolderId) continue;
    const url = normalizeChatUrl(rawUrl);
    if (!url) continue;
    chatFolderMap[url] = rawFolderId;
  }

  return { folders, chatFolderMap };
}

async function loadPromptState() {
  const state = await storage.get([STORAGE_KEYS.PROMPTS, STORAGE_KEYS.PROMPT_CATALOG_VERSION]);
  const prompts = Array.isArray(state[STORAGE_KEYS.PROMPTS]) ? state[STORAGE_KEYS.PROMPTS].map(normalizePrompt) : [];
  const catalogVersion = typeof state[STORAGE_KEYS.PROMPT_CATALOG_VERSION] === 'string'
    ? state[STORAGE_KEYS.PROMPT_CATALOG_VERSION]
    : '';

  if (catalogVersion !== PROMPT_CATALOG_VERSION) {
    const merged = [...prompts];
    const seen = new Set(merged.map(promptFingerprint));
    let createdAt = Date.now();

    for (const template of DEFAULT_PROMPT_TEMPLATES) {
      const key = promptFingerprint(template);
      if (seen.has(key)) continue;
      merged.push(normalizePrompt({
        id: createId(),
        title: template.title,
        body: template.body,
        tags: template.tags,
        createdAt,
      }));
      seen.add(key);
      createdAt += 1;
    }

    await storage.set({
      [STORAGE_KEYS.PROMPTS]: merged,
      [STORAGE_KEYS.PROMPT_CATALOG_VERSION]: PROMPT_CATALOG_VERSION,
    });
    merged.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return merged;
  }

  prompts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return prompts;
}

async function savePromptState(prompts) {
  await storage.set({
    [STORAGE_KEYS.PROMPTS]: prompts,
  });
}

async function saveFolderState({ folders, chatFolderMap }) {
  await storage.set({
    [STORAGE_KEYS.FOLDERS]: folders,
    [STORAGE_KEYS.CHAT_FOLDER_MAP]: chatFolderMap,
  });
}

function collectDescendantIds(folders, rootId) {
  const byParent = new Map();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const bucket = byParent.get(folder.parentId) || [];
    bucket.push(folder.id);
    byParent.set(folder.parentId, bucket);
  }

  const visited = new Set();
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const children = byParent.get(current) || [];
    for (const childId of children) queue.push(childId);
  }
  return visited;
}

async function getFolderTree(includeDeleted) {
  const state = await loadFolderState();
  const folders = includeDeleted ? state.folders : state.folders.filter((folder) => folder.deletedAt === null);
  return { folders, chatFolderMap: state.chatFolderMap };
}

async function createFolder(name, parentId) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    throw new Error('FOLDER_CREATE requires a non-empty name.');
  }

  const state = await loadFolderState();
  const normalizedParentId = typeof parentId === 'string' && parentId ? parentId : null;
  if (normalizedParentId) {
    const parent = state.folders.find((folder) => folder.id === normalizedParentId);
    if (!parent || parent.deletedAt !== null) {
      throw new Error('Parent folder not found or deleted.');
    }
  }

  const folder = normalizeFolder({
    id: createId(),
    name: trimmedName,
    parentId: normalizedParentId,
    chatUrls: [],
    createdAt: Date.now(),
    deletedAt: null,
  });
  state.folders.push(folder);
  await saveFolderState(state);
  return folder;
}

async function renameFolder(id, name) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (typeof id !== 'string' || !id) throw new Error('FOLDER_RENAME requires id.');
  if (!trimmedName) throw new Error('FOLDER_RENAME requires a non-empty name.');

  const state = await loadFolderState();
  const folder = state.folders.find((item) => item.id === id);
  if (!folder) throw new Error('Folder not found.');

  folder.name = trimmedName;
  await saveFolderState(state);
  return folder;
}

async function softDeleteFolder(id) {
  if (typeof id !== 'string' || !id) throw new Error('FOLDER_DELETE requires id.');

  const state = await loadFolderState();
  if (!state.folders.some((folder) => folder.id === id)) throw new Error('Folder not found.');
  const ids = collectDescendantIds(state.folders, id);

  const now = Date.now();
  for (const folder of state.folders) {
    if (ids.has(folder.id) && folder.deletedAt === null) {
      folder.deletedAt = now;
    }
  }

  await saveFolderState(state);
  return { deletedCount: ids.size };
}

async function restoreFolder(id) {
  if (typeof id !== 'string' || !id) throw new Error('FOLDER_RESTORE requires id.');

  const state = await loadFolderState();
  if (!state.folders.some((folder) => folder.id === id)) throw new Error('Folder not found.');
  const ids = collectDescendantIds(state.folders, id);

  for (const folder of state.folders) {
    if (ids.has(folder.id)) {
      folder.deletedAt = null;
      if (folder.parentId && !state.folders.some((item) => item.id === folder.parentId)) {
        folder.parentId = null;
      }
    }
  }

  await saveFolderState(state);
  return { restoredCount: ids.size };
}

async function permanentlyDeleteFolder(id) {
  if (typeof id !== 'string' || !id) throw new Error('FOLDER_DELETE_PERMANENT requires id.');

  const state = await loadFolderState();
  if (!state.folders.some((folder) => folder.id === id)) throw new Error('Folder not found.');
  const ids = collectDescendantIds(state.folders, id);

  state.folders = state.folders.filter((folder) => !ids.has(folder.id));

  for (const [url, folderId] of Object.entries(state.chatFolderMap)) {
    if (ids.has(folderId)) delete state.chatFolderMap[url];
  }

  await saveFolderState(state);
  return { removedCount: ids.size };
}

async function assignChatToFolder(id, chatUrl) {
  if (typeof id !== 'string' || !id) throw new Error('FOLDER_ASSIGN_CHAT requires id.');
  const normalizedUrl = normalizeChatUrl(chatUrl);
  if (!normalizedUrl) throw new Error('FOLDER_ASSIGN_CHAT requires a valid chatUrl.');

  const state = await loadFolderState();
  const targetFolder = state.folders.find((folder) => folder.id === id && folder.deletedAt === null);
  if (!targetFolder) throw new Error('Target folder not found or deleted.');

  for (const folder of state.folders) {
    folder.chatUrls = folder.chatUrls.filter((url) => url !== normalizedUrl);
  }
  targetFolder.chatUrls.push(normalizedUrl);
  targetFolder.chatUrls = [...new Set(targetFolder.chatUrls)];
  state.chatFolderMap[normalizedUrl] = id;

  await saveFolderState(state);
  return { folderId: id, chatUrl: normalizedUrl };
}

async function unassignChat(chatUrl) {
  const normalizedUrl = normalizeChatUrl(chatUrl);
  if (!normalizedUrl) throw new Error('FOLDER_UNASSIGN_CHAT requires a valid chatUrl.');

  const state = await loadFolderState();
  for (const folder of state.folders) {
    folder.chatUrls = folder.chatUrls.filter((url) => url !== normalizedUrl);
  }
  delete state.chatFolderMap[normalizedUrl];

  await saveFolderState(state);
  return { chatUrl: normalizedUrl };
}

async function getFolderByChatUrl(chatUrl) {
  const normalizedUrl = normalizeChatUrl(chatUrl);
  if (!normalizedUrl) return { folderId: null, chatUrl: '' };

  const state = await loadFolderState();
  const mappedId = state.chatFolderMap[normalizedUrl];
  if (mappedId) {
    const mappedFolder = state.folders.find((folder) => folder.id === mappedId && folder.deletedAt === null);
    if (mappedFolder) return { folderId: mappedId, chatUrl: normalizedUrl };
  }

  const fallback = state.folders.find(
    (folder) => folder.deletedAt === null && Array.isArray(folder.chatUrls) && folder.chatUrls.includes(normalizedUrl)
  );
  return { folderId: fallback?.id || null, chatUrl: normalizedUrl };
}

async function listPrompts() {
  return loadPromptState();
}

async function createPrompt(data) {
  const title = typeof data?.title === 'string' ? data.title.trim() : '';
  const body = typeof data?.body === 'string' ? data.body : '';
  if (!title) throw new Error('PROMPT_CREATE requires title.');
  if (!body.trim()) throw new Error('PROMPT_CREATE requires body.');

  const prompts = await loadPromptState();
  const prompt = normalizePrompt({
    id: createId(),
    title,
    body,
    tags: Array.isArray(data?.tags) ? data.tags : [],
    createdAt: Date.now(),
  });
  prompts.push(prompt);
  await savePromptState(prompts);
  return prompt;
}

async function updatePrompt(data) {
  const id = typeof data?.id === 'string' ? data.id : '';
  if (!id) throw new Error('PROMPT_UPDATE requires id.');

  const prompts = await loadPromptState();
  const index = prompts.findIndex((prompt) => prompt.id === id);
  if (index < 0) throw new Error('Prompt not found.');

  const current = prompts[index];
  const next = normalizePrompt({
    ...current,
    title: typeof data?.title === 'string' ? data.title : current.title,
    body: typeof data?.body === 'string' ? data.body : current.body,
    tags: Array.isArray(data?.tags) ? data.tags : current.tags,
  });
  prompts[index] = next;
  await savePromptState(prompts);
  return next;
}

async function deletePrompt(id) {
  if (typeof id !== 'string' || !id) throw new Error('PROMPT_DELETE requires id.');
  const prompts = await loadPromptState();
  const next = prompts.filter((prompt) => prompt.id !== id);
  if (next.length === prompts.length) throw new Error('Prompt not found.');
  await savePromptState(next);
  return { removed: true, id };
}

/**
 * Handle one protocol message.
 * @param {any} message
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
async function handleMessage(message) {
  const action = message?.action;

  switch (action) {
    case MESSAGE_ACTIONS.PING:
      return ok({ status: 'alive' });

    case MESSAGE_ACTIONS.STORAGE_GET: {
      const data = await storage.get(message.keys ?? null);
      return ok(data);
    }

    case MESSAGE_ACTIONS.STORAGE_GET_ONE: {
      const key = message.key;
      if (typeof key !== 'string' || key.length === 0) {
        return fail('STORAGE_GET_ONE requires a non-empty string key.');
      }
      const data = await storage.get(key);
      return ok(data[key]);
    }

    case MESSAGE_ACTIONS.STORAGE_SET: {
      const items = message.items;
      if (!isRecord(items)) {
        return fail('STORAGE_SET requires an items object.');
      }
      await storage.set(items);
      return ok();
    }

    case MESSAGE_ACTIONS.STORAGE_REMOVE: {
      const keys = message.keys;
      const valid = typeof keys === 'string' || (Array.isArray(keys) && keys.every((k) => typeof k === 'string'));
      if (!valid) {
        return fail('STORAGE_REMOVE requires a string key or string[] keys.');
      }
      await storage.remove(keys);
      return ok();
    }

    case MESSAGE_ACTIONS.STORAGE_CLEAR:
      await storage.clear();
      return ok();

    case MESSAGE_ACTIONS.FOLDER_TREE_GET:
      return ok(await getFolderTree(message.includeDeleted === true));

    case MESSAGE_ACTIONS.FOLDER_CREATE:
      return ok(await createFolder(message.name, message.parentId));

    case MESSAGE_ACTIONS.FOLDER_RENAME:
      return ok(await renameFolder(message.id, message.name));

    case MESSAGE_ACTIONS.FOLDER_DELETE:
      return ok(await softDeleteFolder(message.id));

    case MESSAGE_ACTIONS.FOLDER_RESTORE:
      return ok(await restoreFolder(message.id));

    case MESSAGE_ACTIONS.FOLDER_DELETE_PERMANENT:
      return ok(await permanentlyDeleteFolder(message.id));

    case MESSAGE_ACTIONS.FOLDER_ASSIGN_CHAT:
      return ok(await assignChatToFolder(message.id, message.chatUrl));

    case MESSAGE_ACTIONS.FOLDER_UNASSIGN_CHAT:
      return ok(await unassignChat(message.chatUrl));

    case MESSAGE_ACTIONS.FOLDER_GET_BY_CHAT_URL:
      return ok(await getFolderByChatUrl(message.chatUrl));

    case MESSAGE_ACTIONS.PROMPT_LIST:
      return ok(await listPrompts());

    case MESSAGE_ACTIONS.PROMPT_CREATE:
      return ok(await createPrompt(message.prompt));

    case MESSAGE_ACTIONS.PROMPT_UPDATE:
      return ok(await updatePrompt(message.prompt));

    case MESSAGE_ACTIONS.PROMPT_DELETE:
      return ok(await deletePrompt(message.id));

    case MESSAGE_ACTIONS.OPTIMIZER_REFINE_HIDDEN_TAB:
      return ok(await runHiddenTabRefinement({
        site: message.site,
        prompt: message.prompt,
      }));

    case MESSAGE_ACTIONS.API_RULES_UPDATE: {
      const rules = message.rules;
      if (!Array.isArray(rules)) {
        return fail('API_RULES_UPDATE requires a rules array.');
      }
      await updateRules(rules);
      return ok();
    }

    case MESSAGE_ACTIONS.API_RULES_CLEAR:
      await clearRules();
      return ok();

    default:
      return fail(`Unsupported action: ${String(action)}`);
  }
}

// ─── Event: Extension Installed / Updated ────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[DexEnhance] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    const manifestVersion = chrome.runtime.getManifest()?.version || '0.0.0';
    const createdAt = Date.now();
    const seededPrompts = DEFAULT_PROMPT_TEMPLATES.map((template, index) => normalizePrompt({
      id: createId(),
      title: template.title,
      body: template.body,
      tags: template.tags,
      createdAt: createdAt + index,
    }));
    void storage
      .set({
        enabled: true,
        version: manifestVersion,
        [STORAGE_KEYS.FOLDERS]: [],
        [STORAGE_KEYS.CHAT_FOLDER_MAP]: {},
        [STORAGE_KEYS.PROMPTS]: seededPrompts,
        [STORAGE_KEYS.PROMPT_CATALOG_VERSION]: PROMPT_CATALOG_VERSION,
      })
      .catch((error) => {
        console.error('[DexEnhance] Failed to write default install settings:', error);
      });
  }
});

// ─── Event: Messages from Content Scripts ────────────────────────────────────
// Registered synchronously at top level (MV3 requirement).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleMessage(message)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error('[DexEnhance] Message handling error:', error, 'tab:', sender.tab?.id);
      sendResponse(fail(error instanceof Error ? error.message : String(error)));
    });

  // Async response path.
  return true;
});
