// Gemini DOM adapter (Phase 3)
// Implements ChatInterface using Gemini selectors only in this module.

import { ChatInterface } from '../shared/chat-interface.js';

export class GeminiAdapter extends ChatInterface {
  /** @returns {HTMLElement|null} */
  getTextarea() {
    const selectors = [
      '.ql-editor[contenteditable="true"]',
      'rich-textarea .ql-editor',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
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
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button.send-button',
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
      'nav[aria-label*="Chats"]',
      'nav[aria-label*="Recent"]',
      'aside nav',
      'div[role="navigation"]',
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
      'button[aria-label*="Stop"], button[aria-label*="Cancel"], button[data-test-id*="stop"]'
    );
    if (stopButton instanceof HTMLElement) return true;

    const submitButton = this.getSubmitButton();
    if (!(submitButton instanceof HTMLElement)) return false;
    const label = `${submitButton.getAttribute('aria-label') || ''} ${submitButton.textContent || ''}`.toLowerCase();
    return label.includes('stop') || label.includes('cancel');
  }
}
