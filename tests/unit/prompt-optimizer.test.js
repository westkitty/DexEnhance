import { test, expect, describe } from 'bun:test';
import { deterministicRewritePrompt } from '../../src/content/shared/prompt-optimizer.js';

// Phase 10: src/content/shared/prompt-optimizer.js — deterministic prompt rewriter

describe('deterministicRewritePrompt', () => {
  test('returns empty string for empty input', () => {
    expect(deterministicRewritePrompt('')).toBe('');
  });

  test('returns empty string for whitespace-only input', () => {
    expect(deterministicRewritePrompt('   ')).toBe('');
    expect(deterministicRewritePrompt('\n\n')).toBe('');
  });

  test('output contains all required section headers', () => {
    const result = deterministicRewritePrompt('Write me a poem about the ocean');
    expect(result).toContain('Objective');
    expect(result).toContain('Context');
    expect(result).toContain('Requirements');
    expect(result).toContain('Constraints');
    expect(result).toContain('Output Requirements');
    expect(result).toContain('Quality Checks');
  });

  test('preserves user intent verbatim in Context section', () => {
    const prompt = 'Summarize this article in 5 bullet points';
    const result = deterministicRewritePrompt(prompt);
    expect(result).toContain(`User intent (verbatim): ${prompt}`);
  });

  test('single sentence becomes the Objective', () => {
    const result = deterministicRewritePrompt('Explain how TCP handshakes work');
    // The first statement should be the objective line
    expect(result).toContain('Explain how TCP handshakes work');
    expect(result).toContain('Objective');
  });

  test('constraint keywords route statement to Constraints section', () => {
    const prompt = 'Write a product description.\nYou must avoid buzzwords.\nDo not exceed 100 words.';
    const result = deterministicRewritePrompt(prompt);
    // Constraint indicators: "must", "avoid", "do not"
    expect(result).toContain('avoid buzzwords');
    expect(result).toContain('not exceed 100 words');
  });

  test('non-constraint additional sentences route to Requirements section', () => {
    const prompt = 'Analyze this dataset.\nFocus on trends over time.\nHighlight seasonal patterns.';
    const result = deterministicRewritePrompt(prompt);
    expect(result).toContain('Focus on trends over time');
    expect(result).toContain('Highlight seasonal patterns');
  });

  test('JSON keyword triggers JSON format hint', () => {
    const result = deterministicRewritePrompt('Parse this response into JSON format');
    expect(result).toContain('Return valid JSON only.');
  });

  test('table keyword triggers markdown table hint', () => {
    const result = deterministicRewritePrompt('Create a table with columns for name and revenue');
    expect(result).toContain('markdown table');
  });

  test('bullet/list keyword triggers bullet format hint', () => {
    const result = deterministicRewritePrompt('Give me a bullet list of action items');
    expect(result).toContain('concise bullet points');
  });

  test('Python keyword triggers code block hint', () => {
    const result = deterministicRewritePrompt('Write a Python script to process CSV files');
    expect(result).toContain('production-safe code blocks');
  });

  test('SQL keyword triggers SQL format hint', () => {
    const result = deterministicRewritePrompt('Write a SQL query to find duplicate records');
    expect(result).toContain('executable SQL');
  });

  test('normalizes Windows-style CRLF line endings', () => {
    const result = deterministicRewritePrompt('First line\r\nSecond line\r\nThird line');
    expect(result).toContain('Objective');
    expect(result).not.toContain('\r');
  });

  test('always contains quality check items', () => {
    const result = deterministicRewritePrompt('Help me brainstorm ideas');
    expect(result).toContain('Ensure accuracy before brevity');
    expect(result).toContain('Highlight assumptions explicitly');
    expect(result).toContain('Keep steps actionable and non-redundant');
  });

  test('output is trimmed (no leading/trailing whitespace)', () => {
    const result = deterministicRewritePrompt('Generate a marketing email');
    expect(result.trimStart()).toBe(result);
    expect(result.trimEnd()).toBe(result);
  });
});
