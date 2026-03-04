// ChatGPT DOM adapter (Phase 3)
// Implements ChatInterface using ChatGPT selectors only in this module.

import { ChatInterface } from '../shared/chat-interface.js';

export class ChatGPTAdapter extends ChatInterface {
  _textFromNode(node) {
    if (!(node instanceof HTMLElement)) return '';
    const clone = node.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return '';
    clone.querySelectorAll('script, style, noscript').forEach((item) => item.remove());
    return String(clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  _hashText(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(16)}`;
  }

  _getLatestAssistantNode() {
    const explicit = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (explicit.length > 0) {
      const node = explicit[explicit.length - 1];
      return node instanceof HTMLElement ? node : null;
    }

    const fallbackSelectors = [
      'main [class*="assistant"]',
      'main [class*="markdown"]',
      'article[data-testid*="assistant"]',
    ];

    for (const selector of fallbackSelectors) {
      const matches = document.querySelectorAll(selector);
      if (matches.length === 0) continue;
      const node = matches[matches.length - 1];
      if (node instanceof HTMLElement) return node;
    }

    return null;
  }

  /** @returns {HTMLElement|null} */
  getTextarea() {
    const selectors = [
      '#prompt-textarea',
      'form textarea',
      'main textarea',
      'div[contenteditable="true"][role="textbox"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) return el;
    }
    return null;
  }

  /** @returns {HTMLElement|null} */
  getSubmitButton() {
    const selectors = [
      '[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'form button[type="submit"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) return el;
    }
    return null;
  }

  /** @returns {HTMLElement|null} */
  getChatListContainer() {
    const selectors = [
      'nav[aria-label*="Chat history"]',
      'nav[aria-label*="History"]',
      'aside nav',
      'nav',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) return el;
    }
    return null;
  }

  /** @returns {boolean} */
  isGenerating() {
    const stopButton = document.querySelector(
      '[data-testid="stop-button"], button[aria-label*="Stop"], button[data-testid*="stop"]'
    );
    if (stopButton instanceof HTMLElement) return true;

    const submitButton = this.getSubmitButton();
    if (!(submitButton instanceof HTMLElement)) return false;
    const label = `${submitButton.getAttribute('aria-label') || ''} ${submitButton.textContent || ''}`.toLowerCase();
    return label.includes('stop');
  }

  /** @returns {string} */
  getLatestAssistantTurnText() {
    return this._textFromNode(this._getLatestAssistantNode());
  }

  /** @returns {string} */
  getLatestAssistantTurnId() {
    const node = this._getLatestAssistantNode();
    if (!(node instanceof HTMLElement)) return '';

    const fromAttrs = node.getAttribute('data-message-id')
      || node.getAttribute('data-testid')
      || node.getAttribute('id')
      || '';
    if (fromAttrs) return fromAttrs;

    const text = this._textFromNode(node);
    if (!text) return '';
    return this._hashText(text.slice(0, 2048));
  }
}
