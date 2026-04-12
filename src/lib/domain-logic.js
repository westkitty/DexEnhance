import { createId, normalizeChatUrl } from './utils.js';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {any} prompt
 * @returns {{id:string,title:string,body:string,tags:string[],variables:string[],version:number,parentVersionId:string|null,createdAt:number,updatedAt:number}}
 */
export function normalizePrompt(prompt) {
  if (!isRecord(prompt)) prompt = {};
  const body = typeof prompt.body === 'string' ? prompt.body : '';
  const variables = parseVariablesFromPromptBody(body);
  
  return {
    id: typeof prompt.id === 'string' && prompt.id ? prompt.id : createId(),
    title: typeof prompt.title === 'string' && prompt.title.trim() ? prompt.title.trim() : 'New Prompt',
    body,
    tags: Array.isArray(prompt.tags) ? prompt.tags.filter((t) => typeof t === 'string') : [],
    variables,
    version: typeof prompt.version === 'number' ? prompt.version : 1,
    parentVersionId: typeof prompt.parentVersionId === 'string' ? prompt.parentVersionId : null,
    createdAt: typeof prompt.createdAt === 'number' ? prompt.createdAt : Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * @param {string} body
 * @returns {string[]}
 */
export function parseVariablesFromPromptBody(body) {
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

/**
 * Basic keyword search for prompts.
 * @param {any[]} prompts 
 * @param {string} query 
 */
export function searchPrompts(prompts, query) {
  if (!query?.trim()) return prompts;
  const q = query.toLowerCase().trim();
  return prompts.filter((p) => 
    p.title?.toLowerCase().includes(q) || 
    p.body?.toLowerCase().includes(q) ||
    p.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Basic keyword search for folders.
 * @param {any[]} folders 
 * @param {string} query 
 */
export function searchFolders(folders, query) {
  if (!query?.trim()) return folders;
  const q = query.toLowerCase().trim();
  return folders.filter((f) => f.name?.toLowerCase().includes(q));
}

/**
 * Get the known context window limit for common models.
 * @param {string} modelName 
 * @returns {number} Defaulting to 128k for modern models.
 */
export function getModelContextLimit(modelName) {
  const name = String(modelName || '').toLowerCase();
  if (name.includes('gpt-4-32k')) return 32768;
  if (name.includes('gpt-4')) return 128000;
  if (name.includes('gpt-3.5-turbo-16k')) return 16384;
  if (name.includes('gpt-3.5')) return 4096;
  if (name.includes('claude-3')) return 200000;
  if (name.includes('gemini-1.5')) return 1000000;
  if (name.includes('gemini-1.0')) return 32768;
  return 128000; // General modern default
}

/**
 * Rough estimate of context usage based on token count.
 * @param {number} tokens 
 * @param {string} modelName 
 */
export function estimateContextUsage(tokens, modelName) {
  const limit = getModelContextLimit(modelName);
  const percent = (tokens / limit) * 100;
  return {
    tokens,
    limit,
    percent: Math.min(100, percent),
    status: percent > 90 ? 'critical' : percent > 70 ? 'warning' : 'healthy'
  };
}

/**
 * @param {any} prompt
 * @returns {string}
 */
export function promptFingerprint(prompt) {
  const title = typeof prompt?.title === 'string' ? prompt.title.trim().toLowerCase() : '';
  const body = typeof prompt?.body === 'string' ? prompt.body.trim() : '';
  return `${title}::${body}`;
}

/**
 * @param {any} folder
 * @returns {{id:string,name:string,parentId:string|null,chatUrls:string[],createdAt:number,deletedAt:number|null}}
 */
export function normalizeFolder(folder) {
  const id = typeof folder?.id === 'string' && folder.id ? folder.id : createId();
  const name = typeof folder?.name === 'string' && folder.name.trim() ? folder.name.trim() : 'Untitled Folder';
  const parentId = typeof folder?.parentId === 'string' && folder.parentId ? folder.parentId : null;
  const createdAt = Number.isFinite(folder?.createdAt) ? Number(folder.createdAt) : Date.now();
  const deletedAt = Number.isFinite(folder?.deletedAt) ? Number(folder.deletedAt) : null;

  const urls = Array.isArray(folder?.chatUrls) ? folder.chatUrls : [];
  const chatUrls = [...new Set(urls.map((url) => normalizeChatUrl(url)).filter(Boolean))];

  return { id, name, parentId, chatUrls, createdAt, deletedAt };
}

/**
 * @param {Array<{id: string, parentId: string|null}>} folders
 * @param {string} rootId
 * @returns {Set<string>}
 */
export function collectDescendantIds(folders, rootId) {
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
