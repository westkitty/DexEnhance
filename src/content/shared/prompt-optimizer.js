import { MESSAGE_ACTIONS } from '../../lib/message-protocol.js';
import { parseConversation } from './parser.js';
import { readTextFromInputElement, writeTextToInputElement } from './input-utils.js';

const REFINEMENT_OPEN_TAG = '<dex_optimized_prompt>';
const REFINEMENT_CLOSE_TAG = '</dex_optimized_prompt>';

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
}

function splitStatements(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toBulletList(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) return [`- ${fallback}`];
  return items.map((item) => `- ${item}`);
}

function detectFormatHints(text) {
  const lower = text.toLowerCase();
  const hints = [];
  if (/(^|\W)json(\W|$)/.test(lower)) hints.push('Return valid JSON only.');
  if (/(^|\W)table(\W|$)|spreadsheet|rows|columns/.test(lower)) hints.push('Return a markdown table with clear column headers.');
  if (/(^|\W)bullet(s)?(\W|$)|list/.test(lower)) hints.push('Use concise bullet points.');
  if (/markdown/.test(lower)) hints.push('Format output in markdown.');
  if (/sql/.test(lower)) hints.push('Include executable SQL and short rationale comments.');
  if (/python|javascript|typescript|code/.test(lower)) hints.push('Provide production-safe code blocks and a quick usage note.');
  if (hints.length === 0) hints.push('Use a clearly structured response with headings and concise bullets.');
  return hints;
}

function classifyStatements(statements) {
  const objective = statements[0] || 'Complete the requested task accurately and efficiently.';
  const requirements = [];
  const constraints = [];

  statements.slice(1).forEach((statement) => {
    const lower = statement.toLowerCase();
    if (/\b(must|should|avoid|without|never|do not|don't|cannot|can't|limit|only)\b/.test(lower)) {
      constraints.push(statement);
    } else {
      requirements.push(statement);
    }
  });

  return {
    objective,
    requirements,
    constraints,
  };
}

export function deterministicRewritePrompt(rawPrompt) {
  const normalized = normalizeWhitespace(rawPrompt);
  if (!normalized) return '';

  const statements = splitStatements(normalized);
  const { objective, requirements, constraints } = classifyStatements(statements);
  const formatHints = detectFormatHints(normalized);

  return [
    'Objective',
    objective,
    '',
    'Context',
    `User intent (verbatim): ${normalized}`,
    '',
    'Requirements',
    ...toBulletList(requirements, 'Infer practical requirements from the objective and execute directly.'),
    '',
    'Constraints',
    ...toBulletList(constraints, 'Do not invent facts. State assumptions when information is missing.'),
    '',
    'Output Requirements',
    ...toBulletList(formatHints, 'Return a clear, structured answer.'),
    '',
    'Quality Checks',
    '- Ensure accuracy before brevity.',
    '- Highlight assumptions explicitly.',
    '- Keep steps actionable and non-redundant.',
  ].join('\n').trim();
}

function createRefinementMetaPrompt(localPrompt) {
  return [
    'You are a prompt optimization engine.',
    'Rewrite the prompt below into the best possible single prompt for a high-quality model response.',
    'Preserve user intent. Remove ambiguity. Add explicit structure and constraints when helpful.',
    'Return ONLY the optimized prompt between tags with no other text.',
    `${REFINEMENT_OPEN_TAG}`,
    '[optimized prompt here]',
    `${REFINEMENT_CLOSE_TAG}`,
    '',
    'Prompt to optimize:',
    localPrompt,
  ].join('\n');
}

function extractOptimizedPrompt(responseText) {
  const raw = normalizeWhitespace(responseText);
  if (!raw) return '';

  const tagged = raw.match(/<dex_optimized_prompt>([\s\S]*?)<\/dex_optimized_prompt>/i);
  if (tagged?.[1]) return tagged[1].trim();

  const fenced = raw.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  return raw;
}

function captureAssistantSnapshot() {
  const turns = parseConversation();
  const assistants = turns.filter((turn) => turn.role === 'assistant' && typeof turn.content === 'string' && turn.content.trim());
  const lastAssistant = assistants.length > 0 ? assistants[assistants.length - 1].content.trim() : '';
  return {
    assistantCount: assistants.length,
    lastAssistant,
  };
}

function hasNewAssistant(before, after) {
  if (!after) return false;
  if (after.assistantCount > before.assistantCount) return true;
  if (after.assistantCount === before.assistantCount && after.lastAssistant && after.lastAssistant !== before.lastAssistant) return true;
  return false;
}

async function waitUntilIdle(adapter, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!adapter.isGenerating()) return;
    await sleep(300);
  }
  throw new Error('AI is still generating. Wait for completion and try again.');
}

export async function runAiRefinementInCurrentTab({ adapter, localPrompt, timeoutMs = 90000 }) {
  const normalized = normalizeWhitespace(localPrompt);
  if (!normalized) {
    throw new Error('No prompt provided for AI refinement.');
  }

  await waitUntilIdle(adapter, 15000);

  const inputEl = adapter.getTextarea();
  const submitButton = adapter.getSubmitButton();
  if (!(inputEl instanceof HTMLElement) || !(submitButton instanceof HTMLElement)) {
    throw new Error('Could not access the active prompt input or submit button.');
  }

  const before = captureAssistantSnapshot();
  const payload = createRefinementMetaPrompt(normalized);

  const wrote = writeTextToInputElement(inputEl, payload);
  if (!wrote) {
    throw new Error('Failed to write refinement payload into the prompt input.');
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  submitButton.click();

  const startedAt = Date.now();
  let observedGenerating = false;

  while (Date.now() - startedAt < timeoutMs) {
    if (adapter.isGenerating()) observedGenerating = true;

    const after = captureAssistantSnapshot();
    if (hasNewAssistant(before, after) && (!adapter.isGenerating() || observedGenerating)) {
      const refinedPrompt = extractOptimizedPrompt(after.lastAssistant);
      if (!refinedPrompt) {
        throw new Error('AI refinement returned an empty response.');
      }
      return {
        refinedPrompt,
        rawResponse: after.lastAssistant,
      };
    }

    await sleep(700);
  }

  throw new Error('Timed out while waiting for AI refinement.');
}

export function readCurrentComposerText(adapter) {
  const inputEl = adapter.getTextarea();
  return readTextFromInputElement(inputEl);
}

export function writeOptimizedComposerText(adapter, text) {
  const inputEl = adapter.getTextarea();
  return writeTextToInputElement(inputEl, text);
}

/**
 * Registers a handler so the background worker can execute hidden-tab refinements.
 * @param {{adapter: import('./chat-interface.js').ChatInterface}} options
 */
export function registerOptimizerWorkerListener({ adapter }) {
  const listener = (message, _sender, sendResponse) => {
    const action = message?.action;

    if (action === MESSAGE_ACTIONS.OPTIMIZER_WORKER_PING) {
      sendResponse({ ok: true, data: { status: 'ready' } });
      return false;
    }

    if (action === MESSAGE_ACTIONS.OPTIMIZER_WORKER_REFINE) {
      void runAiRefinementInCurrentTab({
        adapter,
        localPrompt: message.prompt,
        timeoutMs: Number.isFinite(Number(message.timeoutMs)) ? Number(message.timeoutMs) : 90000,
      })
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((error) => {
          sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
        });
      return true;
    }

    return false;
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
