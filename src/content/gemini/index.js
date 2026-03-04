// Gemini content script entry point
// Runs in ISOLATED world (default) and communicates with background via runtime messaging.

import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { GeminiAdapter } from './adapter.js';
import { h, render } from 'preact';
import { createShadowRenderer } from '../../ui/shadow-renderer.js';
import { Sidebar } from '../../ui/components/Sidebar.jsx';
import { FAB } from '../../ui/components/FAB.jsx';
import { setupQueueController } from '../shared/queue-controller.js';
import { PromptLibrary } from '../../ui/components/PromptLibrary.jsx';
import { insertTextThroughAdapter } from '../shared/input-utils.js';
import { ExportDialog } from '../../ui/components/ExportDialog.jsx';
import { parseConversation } from '../shared/parser.js';
import { exportToDocx, exportToPdf } from '../shared/exporter.js';
import { injectApiBridge, subscribeToApiBridge } from '../shared/api-bridge.js';
import { TokenOverlay } from '../../ui/components/TokenOverlay.jsx';
import { BrandBadge } from '../../ui/components/BrandBadge.jsx';
import { FeatureTourModal } from '../../ui/components/FeatureTourModal.jsx';
import { TOUR_VERSION } from '../../ui/tour-content.js';
import {
  deterministicRewritePrompt,
  readCurrentComposerText,
  registerOptimizerWorkerListener,
  runAiRefinementInCurrentTab,
  writeOptimizedComposerText,
} from '../shared/prompt-optimizer.js';
import { PromptOptimizerModal } from '../../ui/components/PromptOptimizerModal.jsx';

async function getEnabledFlag() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'enabled' });
  if (!response.ok) {
    console.error('[DexEnhance] Gemini failed to read enabled flag via background:', response.error);
    // Fail-open so extension remains available even if messaging has a transient issue.
    return true;
  }
  return response.data !== false;
}

async function logStorageRoundTrip() {
  const key = 'dex_phase2_probe_gemini';
  const value = `ok-${Date.now()}`;

  const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
    items: { [key]: value },
  });
  if (!setRes.ok) {
    console.error('[DexEnhance] Gemini storage probe set failed:', setRes.error);
    return;
  }

  const getRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key });
  if (!getRes.ok) {
    console.error('[DexEnhance] Gemini storage probe get failed:', getRes.error);
    return;
  }

  const removeRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: key });
  if (!removeRes.ok) {
    console.error('[DexEnhance] Gemini storage probe remove failed:', removeRes.error);
    return;
  }

  console.log('[DexEnhance] Gemini storage message round-trip ok:', getRes.data);
}

(async function init() {
  const enabled = await getEnabledFlag();
  if (!enabled) return;

  const adapter = new GeminiAdapter();
  adapter.onGeneratingStart(() => {
    console.log('[DexEnhance] Gemini generating started');
  });
  adapter.onGeneratingEnd(() => {
    console.log('[DexEnhance] Gemini generating ended');
  });
  adapter.onNewChat((payload) => {
    console.log('[DexEnhance] Gemini chat-list mutation observed:', payload);
  });
  adapter.startObservers();

  console.log('[DexEnhance] Gemini content script loaded');
  console.log('[DexEnhance] Gemini adapter ready:', {
    hasTextarea: Boolean(adapter.getTextarea()),
    hasSubmitButton: Boolean(adapter.getSubmitButton()),
    hasChatList: Boolean(adapter.getChatListContainer()),
    isGenerating: adapter.isGenerating(),
  });
  await logStorageRoundTrip();
  const ui = createShadowRenderer({ site: 'gemini' });
  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  let queueSizeState = 0;
  let promptLibraryOpen = false;
  let exportDialogOpen = false;
  let tourModalOpen = false;
  let optimizerOpen = false;
  let tokenModel = null;
  let tokenCount = null;
  let tokenSource = null;
  let tokenUpdatedAt = null;

  const markTourSeen = async () => {
    const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: { tourSeenVersion: TOUR_VERSION },
    });
    if (!setRes.ok) {
      console.warn('[DexEnhance] Gemini failed to persist tour seen state:', setRes.error);
    }
  };

  const handleExport = async (format) => {
    const turns = parseConversation();
    if (turns.length === 0) {
      throw new Error('No conversation messages were detected.');
    }
    if (format === 'docx') {
      await exportToDocx(turns, { siteLabel: 'Gemini' });
      return;
    }
    exportToPdf(turns, { siteLabel: 'Gemini' });
  };

  const runHybridOptimization = async ({ sourcePrompt, aiRefinementEnabled, refinementMode }) => {
    const normalizedSource = typeof sourcePrompt === 'string' ? sourcePrompt.trim() : '';
    if (!normalizedSource) {
      throw new Error('Enter a prompt before running optimization.');
    }

    const localPrompt = deterministicRewritePrompt(normalizedSource);
    if (!localPrompt) {
      throw new Error('Unable to produce deterministic rewrite.');
    }

    if (!aiRefinementEnabled) {
      return {
        localPrompt,
        finalPrompt: localPrompt,
        methodUsed: 'local_only',
      };
    }

    if (refinementMode === 'hidden_tab') {
      try {
        const response = await sendRuntimeMessage(MESSAGE_ACTIONS.OPTIMIZER_REFINE_HIDDEN_TAB, {
          site: 'gemini',
          prompt: localPrompt,
        });
        if (!response.ok) {
          throw new Error(response.error || 'Hidden-tab refinement failed.');
        }
        const refinedPrompt = typeof response.data?.refinedPrompt === 'string' ? response.data.refinedPrompt.trim() : '';
        if (!refinedPrompt) {
          throw new Error('Hidden-tab refinement returned empty text.');
        }
        return {
          localPrompt,
          finalPrompt: refinedPrompt,
          methodUsed: 'hidden_tab',
        };
      } catch (error) {
        return {
          localPrompt,
          finalPrompt: localPrompt,
          methodUsed: 'local_only',
          warning: `AI refinement fallback: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    try {
      const result = await runAiRefinementInCurrentTab({
        adapter,
        localPrompt,
      });
      return {
        localPrompt,
        finalPrompt: result.refinedPrompt,
        methodUsed: 'same_tab',
      };
    } catch (error) {
      return {
        localPrompt,
        finalPrompt: localPrompt,
        methodUsed: 'local_only',
        warning: `AI refinement fallback: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const renderUI = () => {
    render(
      h('div', null, [
        h(Sidebar, {
          site: 'Gemini',
          currentChatUrl: window.location.href,
          queueSize: queueSizeState,
          iconUrl,
          onRequestTour: () => {
            tourModalOpen = true;
            renderUI();
          },
          onRequestPrompts: () => {
            promptLibraryOpen = true;
            renderUI();
          },
          onRequestOptimizer: () => {
            optimizerOpen = true;
            renderUI();
          },
          onRequestExport: () => {
            exportDialogOpen = true;
            renderUI();
          },
        }),
        h(BrandBadge, {
          site: 'Gemini',
          iconUrl,
          onClick: () => {
            tourModalOpen = true;
            renderUI();
          },
        }),
        h(FAB, {
          site: 'Gemini',
          iconUrl,
          onAction: (action) => {
            if (action === 'tour') {
              tourModalOpen = true;
              renderUI();
            } else if (action === 'optimize') {
              optimizerOpen = true;
              renderUI();
            } else if (action === 'prompts') {
              promptLibraryOpen = true;
              renderUI();
            } else if (action === 'export') {
              exportDialogOpen = true;
              renderUI();
            }
          },
        }),
        h(PromptLibrary, {
          visible: promptLibraryOpen,
          iconUrl,
          onClose: () => {
            promptLibraryOpen = false;
            renderUI();
          },
          onInsert: (text) => {
            const inserted = insertTextThroughAdapter(adapter, text);
            if (!inserted) {
              console.warn('[DexEnhance] Gemini prompt insert failed: no textarea found');
            }
          },
        }),
        h(ExportDialog, {
          visible: exportDialogOpen,
          iconUrl,
          onClose: () => {
            exportDialogOpen = false;
            renderUI();
          },
          onExport: handleExport,
        }),
        h(PromptOptimizerModal, {
          visible: optimizerOpen,
          site: 'Gemini',
          iconUrl,
          initialPrompt: readCurrentComposerText(adapter),
          onClose: () => {
            optimizerOpen = false;
            renderUI();
          },
          onOptimize: runHybridOptimization,
          onApply: (text) => {
            const applied = writeOptimizedComposerText(adapter, text);
            if (!applied) {
              console.warn('[DexEnhance] Gemini optimizer apply failed: no textarea found');
            }
          },
        }),
        h(TokenOverlay, {
          site: 'Gemini',
          model: tokenModel,
          tokens: tokenCount,
          source: tokenSource,
          updatedAt: tokenUpdatedAt,
          iconUrl,
        }),
        h(FeatureTourModal, {
          visible: tourModalOpen,
          site: 'Gemini',
          iconUrl,
          onOpenPrompts: () => {
            tourModalOpen = false;
            promptLibraryOpen = true;
            renderUI();
            void markTourSeen();
          },
          onClose: () => {
            tourModalOpen = false;
            renderUI();
            void markTourSeen();
          },
          onComplete: () => {
            tourModalOpen = false;
            renderUI();
            void markTourSeen();
          },
        }),
      ]),
      ui.mountPoint
    );
  };

  injectApiBridge();
  registerOptimizerWorkerListener({ adapter });
  subscribeToApiBridge((payload) => {
    tokenModel = payload?.model || tokenModel;
    tokenCount = Number.isFinite(Number(payload?.tokens)) ? Number(payload.tokens) : tokenCount;
    tokenSource = payload?.source || tokenSource;
    tokenUpdatedAt = Number.isFinite(Number(payload?.at)) ? Number(payload.at) : Date.now();
    renderUI();
  });

  const tourState = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'tourSeenVersion' });
  if (!tourState.ok || tourState.data !== TOUR_VERSION) {
    tourModalOpen = true;
  }

  renderUI();
  const queueController = setupQueueController({
    adapter,
    siteLabel: 'Gemini',
    onQueueSizeChange: (size) => {
      queueSizeState = size;
      renderUI();
    },
  });
  queueSizeState = queueController.getQueueSize();
  renderUI();
  // Phase 4 will mount Shadow DOM UI here.
})();
