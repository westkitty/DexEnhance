// Conversation DOM parser (Phase 8)
// Extracts turn-by-turn messages from ChatGPT and Gemini DOM.

function cleanText(raw) {
  return String(raw || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textFromElement(element) {
  if (!(element instanceof HTMLElement)) return '';
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) return '';
  clone.querySelectorAll('script, style, noscript').forEach((node) => node.remove());
  return cleanText(clone.innerText || clone.textContent || '');
}

function compareDomOrder(a, b) {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

/**
 * @param {{selector:string, role:'user'|'assistant'}[]} candidates
 * @returns {{role:'user'|'assistant', node:HTMLElement}[]}
 */
function collectNodesByRole(candidates) {
  const picked = new Map();

  candidates.forEach((candidate, priority) => {
    document.querySelectorAll(candidate.selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const current = picked.get(node);
      if (!current || priority < current.priority) {
        picked.set(node, { role: candidate.role, priority });
      }
    });
  });

  return [...picked.entries()]
    .sort((a, b) => compareDomOrder(a[0], b[0]))
    .map(([node, value]) => ({ role: value.role, node }));
}

/**
 * @param {{role:'user'|'assistant', node:HTMLElement}[]} roleNodes
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
function extractMessages(roleNodes) {
  const messages = [];
  for (const item of roleNodes) {
    const content = textFromElement(item.node);
    if (!content) continue;
    messages.push({ role: item.role, content });
  }
  return messages;
}

/**
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
function parseChatGPTConversation() {
  const roleNodes = document.querySelectorAll('[data-message-author-role]');
  const explicit = [];
  for (const node of roleNodes) {
    if (!(node instanceof HTMLElement)) continue;
    const roleAttr = node.getAttribute('data-message-author-role');
    const role = roleAttr === 'user' ? 'user' : 'assistant';
    explicit.push({ role, node });
  }
  const messages = extractMessages(explicit);
  if (messages.length > 0) return messages;

  const fallback = collectNodesByRole([
    { selector: 'main [class*="user"]', role: 'user' },
    { selector: 'main [class*="assistant"]', role: 'assistant' },
    { selector: 'main [class*="markdown"]', role: 'assistant' },
  ]);
  return extractMessages(fallback);
}

/**
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
function parseGeminiConversation() {
  const matched = collectNodesByRole([
    { selector: '[data-test-id*="user"]', role: 'user' },
    { selector: '[class*="user-query"]', role: 'user' },
    { selector: '[class*="request"]', role: 'user' },
    { selector: '[class*="query-text"]', role: 'user' },
    { selector: '[data-test-id*="model"]', role: 'assistant' },
    { selector: '[class*="model-response"]', role: 'assistant' },
    { selector: '[class*="response-content"]', role: 'assistant' },
    { selector: '[class*="answer-content"]', role: 'assistant' },
  ]);
  return extractMessages(matched);
}

/**
 * Parse the current page's conversation into a structured array.
 * @returns {{ role: 'user'|'assistant', content: string }[]}
 */
export function parseConversation() {
  const host = window.location.hostname;
  const messages = host.includes('chatgpt.com') ? parseChatGPTConversation() : parseGeminiConversation();

  const deduped = [];
  let previousKey = null;
  for (const message of messages) {
    const key = `${message.role}:${message.content}`;
    // Host DOM can duplicate adjacent nodes for hydration/animation; keep only adjacent duplicates.
    if (key === previousKey) continue;
    previousKey = key;
    deduped.push(message);
  }
  return deduped;
}
