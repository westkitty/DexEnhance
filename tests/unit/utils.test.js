import { test, expect, describe } from 'bun:test';
import { sanitize, truncate, estimateTokens } from '../../src/lib/utils.js';

// Phase 1: src/lib/utils.js — pure string/token utility functions

describe('sanitize', () => {
  test('strips HTML tags', () => {
    expect(sanitize('<p>hello</p>')).toBe('hello');
  });

  test('strips nested tags', () => {
    expect(sanitize('<b><i>text</i></b>')).toBe('text');
  });

  test('replaces HTML entities with spaces', () => {
    expect(sanitize('a&amp;b')).toBe('a b');
  });

  test('collapses multiple whitespace characters', () => {
    expect(sanitize('a   b')).toBe('a b');
  });

  test('trims leading and trailing whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  test('combines tag-stripping and whitespace collapsing', () => {
    expect(sanitize('  <em>  hello  </em>  world  ')).toBe('hello world');
  });

  test('returns empty string for non-string input (null)', () => {
    expect(sanitize(null)).toBe('');
  });

  test('returns empty string for non-string input (number)', () => {
    expect(sanitize(42)).toBe('');
  });

  test('returns empty string for non-string input (undefined)', () => {
    expect(sanitize(undefined)).toBe('');
  });

  test('returns empty string for empty string input', () => {
    expect(sanitize('')).toBe('');
  });
});

describe('truncate', () => {
  test('returns original string when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('returns original string when exactly equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  test('truncates and appends default ... suffix', () => {
    // 'hello world' = 11 chars; maxLength=8 → slice(0, 5) + '...' = 'hello...'
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  test('truncates with a custom suffix', () => {
    // 'hello world' = 11 chars; maxLength=9, suffix='!' → slice(0, 8) + '!' = 'hello wo!'
    expect(truncate('hello world', 9, '!')).toBe('hello wo!');
  });

  test('suffix length is included in maxLength budget', () => {
    // maxLength=8, suffix='...' (3 chars), slice 0 to 5 chars + '...' = 8 chars total
    const result = truncate('hello world', 8);
    expect(result.length).toBe(8);
    expect(result.endsWith('...')).toBe(true);
  });

  test('returns empty string for non-string input (null)', () => {
    expect(truncate(null, 10)).toBe('');
  });

  test('returns empty string for non-string input (undefined)', () => {
    expect(truncate(undefined, 10)).toBe('');
  });
});

describe('estimateTokens', () => {
  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('returns 0 for non-string input (null)', () => {
    expect(estimateTokens(null)).toBe(0);
  });

  test('returns 0 for non-string input (undefined)', () => {
    expect(estimateTokens(undefined)).toBe(0);
  });

  test('returns 0 for non-string input (number)', () => {
    expect(estimateTokens(42)).toBe(0);
  });

  test('returns 1 for exactly 4 characters (one token)', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  test('rounds up: 5 characters → 2 tokens', () => {
    expect(estimateTokens('abcde')).toBe(2);
  });

  test('returns 25 for 100 characters', () => {
    expect(estimateTokens('a'.repeat(100))).toBe(25);
  });

  test('returns 1 for 1 character (ceil of 0.25)', () => {
    expect(estimateTokens('a')).toBe(1);
  });
});
