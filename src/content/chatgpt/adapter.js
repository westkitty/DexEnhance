// ChatGPT DOM adapter (Phase 3)
// Implements ChatInterface using ChatGPT selectors only in this module.

import { ChatInterface } from '../shared/chat-interface.js';

export class ChatGPTAdapter extends ChatInterface {
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
}
