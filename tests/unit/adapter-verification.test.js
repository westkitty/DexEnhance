import { describe, expect, test, beforeAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatGPTAdapter } from '../../src/content/chatgpt/adapter.js';
import { GeminiAdapter } from '../../src/content/gemini/adapter.js';

const FIXTURES_DIR = join(import.meta.dir, '../fixtures');

function setupDOM(html) {
  const dom = new JSDOM(html, { url: 'https://chatgpt.com/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.Event = dom.window.Event;
  global.MutationObserver = dom.window.MutationObserver;
}

describe('ChatGPT Adapter Offline Verification', () => {
  test('detects idle state correctly', () => {
    const html = readFileSync(join(FIXTURES_DIR, 'chatgpt-idle.html'), 'utf-8');
    setupDOM(html);
    
    const adapter = new ChatGPTAdapter();
    expect(adapter.getTextarea()).not.toBeNull();
    expect(adapter.getSubmitButton()).not.toBeNull();
    expect(adapter.isGenerating()).toBe(false);
    expect(adapter.getLatestAssistantTurnText()).toBe('Hi there, how can I help?');
    expect(adapter.getLatestAssistantTurnId()).toBe('msg1');
  });

  test('detects generating state correctly', () => {
    const html = readFileSync(join(FIXTURES_DIR, 'chatgpt-generating.html'), 'utf-8');
    setupDOM(html);
    
    const adapter = new ChatGPTAdapter();
    expect(adapter.isGenerating()).toBe(true);
    expect(adapter.getLatestAssistantTurnText()).toBe('Generating...');
  });
});

describe('Gemini Adapter Offline Verification', () => {
  test('detects idle state correctly', () => {
    const html = readFileSync(join(FIXTURES_DIR, 'gemini-idle.html'), 'utf-8');
    setupDOM(html);
    // Adjust URL for Gemini context
    global.window.location.href = 'https://gemini.google.com/app';
    
    const adapter = new GeminiAdapter();
    expect(adapter.getTextarea()).not.toBeNull();
    expect(adapter.getSubmitButton()).not.toBeNull();
    expect(adapter.isGenerating()).toBe(false);
    expect(adapter.getLatestAssistantTurnText()).toContain('Quantum physics');
  });
});
