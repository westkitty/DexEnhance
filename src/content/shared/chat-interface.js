// ChatInterface contract — implemented by per-site adapters (Phase 3)
//
// All feature code interacts with sites through this interface.
// Never use raw DOM selectors outside of adapter.js files.

export class ChatInterface {
  constructor() {
    this._handlers = {
      generatingStart: new Set(),
      generatingEnd: new Set(),
      newChat: new Set(),
    };

    this._buttonObserver = null;
    this._buttonHostObserver = null;
    this._chatObserver = null;
    this._chatHostObserver = null;
    this._lastSubmitButton = null;
    this._lastChatContainer = null;
    this._lastGeneratingState = null;
  }

  /** @returns {HTMLElement|null} The active text input / textarea */
  getTextarea() { return null; }

  /** @returns {HTMLElement|null} The submit / send button */
  getSubmitButton() { return null; }

  /** @returns {HTMLElement|null} The chat list / conversation history container */
  getChatListContainer() { return null; }

  /** @returns {boolean} True if the AI is currently generating a response */
  isGenerating() { return false; }

  /**
   * Register callback for generating-start event.
   * @param {(payload: {isGenerating: true}) => void} callback
   * @returns {() => void} unsubscribe
   */
  onGeneratingStart(callback) {
    this._handlers.generatingStart.add(callback);
    return () => this._handlers.generatingStart.delete(callback);
  }

  /**
   * Register callback for generating-end event.
   * @param {(payload: {isGenerating: false}) => void} callback
   * @returns {() => void} unsubscribe
   */
  onGeneratingEnd(callback) {
    this._handlers.generatingEnd.add(callback);
    return () => this._handlers.generatingEnd.delete(callback);
  }

  /**
   * Register callback for new-chat-list mutation event.
   * @param {(payload: {mutationCount: number, at: number}) => void} callback
   * @returns {() => void} unsubscribe
   */
  onNewChat(callback) {
    this._handlers.newChat.add(callback);
    return () => this._handlers.newChat.delete(callback);
  }

  startObservers() {
    this.stopObservers();

    const evaluateGenerating = () => {
      const current = this.isGenerating();
      if (this._lastGeneratingState === null) {
        this._lastGeneratingState = current;
        return;
      }
      if (current === this._lastGeneratingState) return;
      this._lastGeneratingState = current;
      if (current) {
        this._emit('generatingStart', { isGenerating: true });
      } else {
        this._emit('generatingEnd', { isGenerating: false });
      }
    };

    const attachButtonObserver = () => {
      const submitButton = this.getSubmitButton();
      if (!submitButton || submitButton === this._lastSubmitButton) return;

      this._lastSubmitButton = submitButton;
      this._buttonObserver?.disconnect();

      this._buttonObserver = new MutationObserver(() => {
        evaluateGenerating();
      });

      this._buttonObserver.observe(submitButton, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled', 'aria-label'],
      });

      evaluateGenerating();
    };

    const attachChatObserver = () => {
      const chatContainer = this.getChatListContainer();
      if (!chatContainer || chatContainer === this._lastChatContainer) return;

      this._lastChatContainer = chatContainer;
      this._chatObserver?.disconnect();

      this._chatObserver = new MutationObserver((mutations) => {
        if (mutations.length === 0) return;
        this._emit('newChat', {
          mutationCount: mutations.length,
          at: Date.now(),
        });
      });

      this._chatObserver.observe(chatContainer, {
        childList: true,
        subtree: true,
      });
    };

    attachButtonObserver();
    attachChatObserver();

    if (document.body) {
      this._buttonHostObserver = new MutationObserver(() => {
        attachButtonObserver();
      });
      this._buttonHostObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this._chatHostObserver = new MutationObserver(() => {
        attachChatObserver();
      });
      this._chatHostObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  stopObservers() {
    this._buttonObserver?.disconnect();
    this._buttonHostObserver?.disconnect();
    this._chatObserver?.disconnect();
    this._chatHostObserver?.disconnect();

    this._buttonObserver = null;
    this._buttonHostObserver = null;
    this._chatObserver = null;
    this._chatHostObserver = null;
    this._lastSubmitButton = null;
    this._lastChatContainer = null;
    this._lastGeneratingState = null;
  }

  _emit(eventName, payload) {
    for (const handler of this._handlers[eventName]) {
      try {
        handler(payload);
      } catch (error) {
        console.error('[DexEnhance] ChatInterface handler error:', error);
      }
    }
  }
}
