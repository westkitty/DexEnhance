import { describe, expect, test } from 'bun:test';
import {
  normalizePrompt,
  normalizeFolder,
  collectDescendantIds,
  parseVariablesFromPromptBody,
} from '../../src/lib/domain-logic.js';

describe('Prompt Domain Logic', () => {
  test('normalizePrompt sets defaults and parses variables', () => {
    const raw = {
      title: ' Test ',
      body: 'Hello {{name}}',
    };
    const normalized = normalizePrompt(raw);
    expect(normalized.title).toBe('Test');
    expect(normalized.variables).toEqual(['name']);
    // createId() uses crypto.randomUUID if available, so it might be a UUID OR starts with dex_
    expect(normalized.id.length).toBeGreaterThan(10);
    expect(normalized.createdAt).toBeLessThanOrEqual(Date.now());
  });

  test('parseVariablesFromPromptBody finds multiple variables', () => {
    const body = '{{var1}} and {{var2}} with {{var1}} repeat';
    const vars = parseVariablesFromPromptBody(body);
    expect(vars).toEqual(['var1', 'var2']);
  });
});

describe('Folder Domain Logic', () => {
  test('normalizeFolder handles missing fields', () => {
    const normalized = normalizeFolder({});
    expect(normalized.name).toBe('Untitled Folder');
    expect(normalized.chatUrls).toEqual([]);
    expect(normalized.parentId).toBeNull();
  });

  test('normalizeFolder sanitizes chat URLs', () => {
    const raw = {
      chatUrls: [' https://chatgpt.com/c/123?q=abc#hash ', 'invalid-url'],
    };
    const normalized = normalizeFolder(raw);
    // normalizeChatUrl returns the string as-is if it fails to parse as a URL
    expect(normalized.chatUrls).toEqual(['https://chatgpt.com/c/123', 'invalid-url']);
  });

  test('collectDescendantIds finds all nested children', () => {
    const folders = [
      { id: 'f1', parentId: null },
      { id: 'f2', parentId: 'f1' },
      { id: 'f3', parentId: 'f2' },
      { id: 'f4', parentId: 'f1' },
      { id: 'f5', parentId: null },
    ];
    const descendants = collectDescendantIds(folders, 'f1');
    expect(descendants.has('f1')).toBe(true);
    expect(descendants.has('f2')).toBe(true);
    expect(descendants.has('f3')).toBe(true);
    expect(descendants.has('f4')).toBe(true);
    expect(descendants.has('f5')).toBe(false);
    expect(descendants.size).toBe(4);
  });
});
