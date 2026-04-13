/**
 * GhostManager
 * Scans the DOM for code blocks and injects context-aware AI action buttons.
 */
export class GhostManager {
  constructor({ onAction }) {
    this.onAction = onAction;
    this.processedBlocks = new WeakSet();
    this.observer = null;
    
    // Exhaustive selectors for code blocks
    this.selectors = [
      'pre code',                    // Generic markdown
      '.blob-code-content',          // GitHub blob
      '.blob-code-inner',            // GitHub diff
      '.highlight pre',              // GitHub / generic highlighters
      'div.code-block',              // Generic
      '.markdown-body pre',          // GitHub / generic markdown
      '[data-message-author-role="assistant"] pre', // ChatGPT / Gemini
      'main article pre',            // Gemini / generic
      '.code-font pre',              // Generic
    ];
  }

  start() {
    this.scan();
    this.observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) this.scan();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  stop() {
    if (this.observer) this.observer.disconnect();
  }

  scan() {
    for (const selector of this.selectors) {
      const blocks = document.querySelectorAll(selector);
      for (const block of blocks) {
        if (this.processedBlocks.has(block)) continue;
        if (block.querySelector('.dex-ghost-trigger-container')) continue;
        
        this.injectGhost(block);
        this.processedBlocks.add(block);
      }
    }
  }

  injectGhost(block) {
    if (!(block instanceof HTMLElement)) return;

    // Detect if we're inside a container that shouldn't have ghosts (e.g. the composer itself)
    if (block.closest('.dex-app') || block.closest('form')) return;

    // Ensure parent is relative for absolute positioning of ghost
    let targetParent = block;
    // For GitHub blobs, we want the button at the top right of the whole block, not every line
    if (block.closest('.blob-wrapper')) targetParent = block.closest('.blob-wrapper');
    if (block.closest('.highlight')) targetParent = block.closest('.highlight');

    if (getComputedStyle(targetParent).position === 'static') {
      targetParent.style.position = 'relative';
    }

    const container = document.createElement('div');
    container.className = 'dex-ghost-trigger-container';
    
    // Create Sparkle Toggle
    const btn = document.createElement('button');
    btn.className = 'dex-ghost-btn';
    btn.innerHTML = '✨';
    btn.title = 'AI Actions';
    
    const menu = document.createElement('div');
    menu.className = 'dex-ghost-menu';
    menu.style.display = 'none';

    const actions = [
      { id: 'explain', label: 'Explain' },
      { id: 'optimize', label: 'Optimize' },
      { id: 'test', label: 'Add Tests' },
    ];

    actions.forEach(action => {
      const actionBtn = document.createElement('button');
      actionBtn.innerText = action.label;
      actionBtn.className = 'dex-ghost-action-btn';
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        const code = this.extractCode(block);
        this.onAction(action.id, code);
        menu.style.display = 'none';
      };
      menu.appendChild(actionBtn);
    });

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    };

    // Close menu on click outside
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    }, { once: true });

    container.appendChild(btn);
    container.appendChild(menu);
    targetParent.appendChild(container);

    this.ensureStyles();
  }

  extractCode(block) {
    return block.innerText || block.textContent || '';
  }

  ensureStyles() {
    if (document.getElementById('dex-ghost-styles')) return;
    const style = document.createElement('style');
    style.id = 'dex-ghost-styles';
    style.textContent = `
      .dex-ghost-trigger-container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .dex-ghost-btn {
        background: rgba(124, 194, 255, 0.15);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(124, 194, 255, 0.3);
        border-radius: 8px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 16px;
        color: #7cc2ff;
        padding: 0;
      }
      .dex-ghost-btn:hover {
        background: rgba(124, 194, 255, 0.3);
        transform: scale(1.05);
      }
      .dex-ghost-menu {
        background: rgba(20, 25, 30, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        min-width: 100px;
      }
      .dex-ghost-action-btn {
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.8);
        padding: 6px 12px;
        text-align: left;
        font-size: 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .dex-ghost-action-btn:hover {
        background: rgba(124, 194, 255, 0.1);
        color: #7cc2ff;
      }
    `;
    document.head.appendChild(style);
  }
}
