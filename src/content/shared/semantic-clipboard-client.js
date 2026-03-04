import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { writeTextToInputElement } from './input-utils.js';

function normalizeChunkText(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function chunkTextForSemanticClipboard(text, chunkSize = 680, overlap = 120) {
  const normalized = normalizeChunkText(text);
  if (!normalized) return [];

  const safeChunkSize = Math.max(280, Math.min(2200, Number(chunkSize) || 680));
  const safeOverlap = Math.max(0, Math.min(600, Number(overlap) || 120));

  const chunks = [];
  let offset = 0;

  while (offset < normalized.length) {
    const endOffset = Math.min(normalized.length, offset + safeChunkSize);
    const chunkText = normalized.slice(offset, endOffset).trim();
    if (chunkText) {
      chunks.push({
        chunkText,
        startOffset: offset,
        endOffset,
      });
    }

    if (endOffset >= normalized.length) break;
    offset = Math.max(offset + 1, endOffset - safeOverlap);
  }

  return chunks;
}

export async function ingestSemanticClipboardContext({
  sourceUrl,
  title,
  fullText,
  maxTrackedTabs,
}) {
  const chunks = chunkTextForSemanticClipboard(fullText);
  if (chunks.length === 0) {
    return { ok: false, error: 'No text available to ingest.' };
  }

  return sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_UPSERT_CONTEXT, {
    sourceUrl,
    title,
    chunks,
    maxTrackedTabs,
  });
}

export async function buildSemanticClipboardPreamble({ queryText, topK, maxTrackedTabs }) {
  return sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_BUILD_PREAMBLE, {
    queryText,
    topK,
    maxTrackedTabs,
  });
}

export function prependPreambleToComposer(adapter, preamble, originalText) {
  const input = adapter.getTextarea();
  if (!(input instanceof HTMLElement)) return false;

  const normalizedPreamble = String(preamble || '').trim();
  if (!normalizedPreamble) return false;

  const existing = String(originalText || '').trim();
  const combined = existing ? `${normalizedPreamble}\n\n${existing}` : normalizedPreamble;
  return writeTextToInputElement(input, combined);
}
