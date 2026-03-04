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
import { PanelFrame } from '../../ui/components/PanelFrame.jsx';
import { HUDSettingsPanel } from '../../ui/components/HUDSettingsPanel.jsx';
import { normalizeFeatureSettings } from '../../lib/feature-settings.js';
import { fetchFeatureSettings, watchFeatureSettings } from '../shared/feature-flags.js';
import { createPopoutCanvasController } from '../shared/popout-canvas-controller.js';
import {
  buildSemanticClipboardPreamble,
  ingestSemanticClipboardContext,
  prependPreambleToComposer,
} from '../shared/semantic-clipboard-client.js';
import {
  DEFAULT_HUD_SETTINGS,
  HUD_SETTINGS_KEY,
  defaultPanelState,
  hueToHudPalette,
  normalizeHudSettings,
  updatePanelInSettings,
} from '../../lib/ui-settings.js';

async function getEnabledFlag() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'enabled' });
  if (!response.ok) {
    console.error('[DexEnhance] Gemini failed to read enabled flag via background:', response.error);
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
  let settingsOpen = false;
  let tokenModel = null;
  let tokenCount = null;
  let tokenSource = null;
  let tokenUpdatedAt = null;
  let featureSettings = normalizeFeatureSettings({});
  let semanticIngestTimer = null;

  let hudSettings = normalizeHudSettings({}, { width: window.innerWidth, height: window.innerHeight });
  let persistHudTimer = null;

  const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  const panelState = (panelId) => hudSettings.panels[panelId] || defaultPanelState(panelId, getViewport());
  const panelDefault = (panelId) => defaultPanelState(panelId, getViewport());

  const applyHudPalette = () => {
    const palette = hueToHudPalette(hudSettings.accentHue);
    ui.mountPoint.style.setProperty('--dex-accent', palette.accent);
    ui.mountPoint.style.setProperty('--dex-accent-2', palette.accent2);
    ui.mountPoint.style.setProperty('--dex-cta', palette.cta);
  };

  const scheduleHudSettingsPersist = () => {
    if (persistHudTimer) window.clearTimeout(persistHudTimer);
    persistHudTimer = window.setTimeout(() => {
      void sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
        items: {
          [HUD_SETTINGS_KEY]: hudSettings,
        },
      });
    }, 220);
  };

  const setHudSettings = (nextSettings, { persist = true } = {}) => {
    hudSettings = normalizeHudSettings(nextSettings, getViewport());
    applyHudPalette();
    if (persist) scheduleHudSettingsPersist();
    renderUI();
  };

  const setPanel = (panelId, nextPanel) => {
    setHudSettings(updatePanelInSettings(hudSettings, panelId, nextPanel, getViewport()));
  };

  const openAnyModal = (panelName) => {
    if (panelName === 'prompts') promptLibraryOpen = true;
    if (panelName === 'export') exportDialogOpen = true;
    if (panelName === 'optimizer') optimizerOpen = true;
    if (panelName === 'tour') tourModalOpen = true;
    setPanel('tokens', {
      ...panelState('tokens'),
      collapsed: true,
      pinned: false,
      x: Math.max(8, window.innerWidth - 250),
      y: Math.max(8, window.innerHeight - 62),
      width: 220,
      height: 48,
    });
  };

  const popoutCanvasController = createPopoutCanvasController({
    adapter,
    site: 'gemini',
    getFeatureSettings: () => featureSettings,
  });

  const runSemanticClipboardInject = async () => {
    if (featureSettings.modules.semanticClipboard.enabled !== true) {
      console.warn('[DexEnhance] Semantic Clipboard is disabled in settings.');
      return;
    }

    const queryText = readCurrentComposerText(adapter) || adapter.getLatestAssistantTurnText();
    if (!queryText.trim()) {
      console.warn('[DexEnhance] Semantic Clipboard inject skipped: no prompt text detected.');
      return;
    }

    const response = await buildSemanticClipboardPreamble({
      queryText,
      topK: featureSettings.modules.semanticClipboard.topK,
      maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
    });

    if (!response.ok) {
      console.warn('[DexEnhance] Semantic Clipboard preamble request failed:', response.error);
      return;
    }

    const preamble = typeof response.data?.preamble === 'string' ? response.data.preamble : '';
    if (!preamble.trim()) {
      console.warn('[DexEnhance] Semantic Clipboard has no relevant context yet.');
      return;
    }

    const applied = prependPreambleToComposer(adapter, preamble, readCurrentComposerText(adapter));
    if (!applied) {
      console.warn('[DexEnhance] Semantic Clipboard inject failed: no composer detected.');
    }
  };

  const runPopoutCanvasOpenLatest = async () => {
    const response = await popoutCanvasController.openLatest();
    if (!response?.ok) {
      console.warn('[DexEnhance] Pop-Out Canvas open failed:', response?.error || 'unknown error');
    }
  };

  const scheduleSemanticClipboardIngest = () => {
    if (featureSettings.modules.semanticClipboard.enabled !== true) return;

    if (semanticIngestTimer) {
      window.clearTimeout(semanticIngestTimer);
    }

    semanticIngestTimer = window.setTimeout(() => {
      const latestAssistantText = adapter.getLatestAssistantTurnText();
      const currentComposerText = readCurrentComposerText(adapter);
      const mergedText = [
        latestAssistantText ? `ASSISTANT: ${latestAssistantText}` : '',
        currentComposerText ? `USER_DRAFT: ${currentComposerText}` : '',
      ].filter(Boolean).join('\n');
      if (!mergedText.trim()) return;

      void ingestSemanticClipboardContext({
        sourceUrl: window.location.href,
        title: document.title || 'Gemini Conversation',
        fullText: mergedText,
        maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
      });
    }, 900);
  };

  adapter.onNewChat((payload) => {
    console.log('[DexEnhance] Gemini chat-list mutation observed:', payload);
    void popoutCanvasController.maybeAutoOpenFromLatestTurn();
    scheduleSemanticClipboardIngest();
  });

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
    const tokenTitle = `Dex Tokens • Gemini${tokenCount != null ? ` • ${tokenCount}` : ''}`;

    render(
      h('div', null, [
        h(PanelFrame, {
          panelId: 'sidebar',
          title: 'DexEnhance • Gemini',
          iconUrl,
          panelState: panelState('sidebar'),
          defaultState: panelDefault('sidebar'),
          onPanelStateChange: (next) => setPanel('sidebar', next),
          minWidth: 280,
          minHeight: 280,
          zIndex: 2147483645,
          showClose: false,
          showPin: true,
          allowResize: true,
        }, [
          h(Sidebar, {
            site: 'Gemini',
            currentChatUrl: window.location.href,
            queueSize: queueSizeState,
            iconUrl,
            onRequestTour: () => openAnyModal('tour'),
            onRequestPrompts: () => openAnyModal('prompts'),
            onRequestOptimizer: () => openAnyModal('optimizer'),
            onRequestExport: () => openAnyModal('export'),
            onRequestSettings: () => {
              settingsOpen = true;
              renderUI();
            },
            onRequestContext: () => {
              void runSemanticClipboardInject();
            },
            onRequestLiveRender: () => {
              void runPopoutCanvasOpenLatest();
            },
          }),
        ]),

        h(PanelFrame, {
          panelId: 'tokens',
          title: tokenTitle,
          iconUrl,
          panelState: panelState('tokens'),
          defaultState: panelDefault('tokens'),
          onPanelStateChange: (next) => setPanel('tokens', next),
          minWidth: 180,
          minHeight: 48,
          zIndex: 2147483644,
          showClose: false,
          showPin: false,
          showOptions: false,
          allowResize: true,
          compactCollapsed: true,
        }, [
          h(TokenOverlay, {
            site: 'Gemini',
            model: tokenModel,
            tokens: tokenCount,
            source: tokenSource,
            updatedAt: tokenUpdatedAt,
            iconUrl,
            compact: panelState('tokens').collapsed,
          }),
        ]),

        h(BrandBadge, {
          site: 'Gemini',
          iconUrl,
          onClick: () => openAnyModal('tour'),
        }),
        h(FAB, {
          site: 'Gemini',
          iconUrl,
          panelState: panelState('fab'),
          onPanelStateChange: (next) => setPanel('fab', next),
          onAction: (action) => {
            if (action === 'tour') openAnyModal('tour');
            else if (action === 'optimize') openAnyModal('optimizer');
            else if (action === 'prompts') openAnyModal('prompts');
            else if (action === 'context') {
              void runSemanticClipboardInject();
            }
            else if (action === 'liveRender') {
              void runPopoutCanvasOpenLatest();
            }
            else if (action === 'settings') {
              settingsOpen = true;
              renderUI();
            } else if (action === 'export') openAnyModal('export');
            else renderUI();
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
          windowState: panelState('promptLibrary'),
          defaultWindowState: panelDefault('promptLibrary'),
          onWindowStateChange: (next) => setPanel('promptLibrary', next),
        }),
        h(ExportDialog, {
          visible: exportDialogOpen,
          iconUrl,
          onClose: () => {
            exportDialogOpen = false;
            renderUI();
          },
          onExport: handleExport,
          windowState: panelState('export'),
          defaultWindowState: panelDefault('export'),
          onWindowStateChange: (next) => setPanel('export', next),
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
          windowState: panelState('optimizer'),
          defaultWindowState: panelDefault('optimizer'),
          onWindowStateChange: (next) => setPanel('optimizer', next),
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
          windowState: panelState('tour'),
          defaultWindowState: panelDefault('tour'),
          onWindowStateChange: (next) => setPanel('tour', next),
        }),
        h(HUDSettingsPanel, {
          visible: settingsOpen,
          iconUrl,
          panelState: panelState('settings'),
          defaultPanelState: panelDefault('settings'),
          onPanelStateChange: (next) => setPanel('settings', next),
          accentHue: hudSettings.accentHue,
          onAccentHueChange: (hue) => {
            setHudSettings({
              ...hudSettings,
              accentHue: hue,
            });
          },
          panelOpacities: {
            sidebar: panelState('sidebar').opacity,
            tokens: panelState('tokens').opacity,
            fab: panelState('fab').opacity,
            promptLibrary: panelState('promptLibrary').opacity,
            optimizer: panelState('optimizer').opacity,
            tour: panelState('tour').opacity,
            export: panelState('export').opacity,
          },
          onPanelOpacityChange: (panelId, opacity) => {
            setPanel(panelId, {
              ...panelState(panelId),
              opacity,
            });
          },
          fabSize: panelState('fab').width,
          onFabSizeChange: (size) => {
            const safeSize = Math.max(52, Math.min(96, Number(size) || 62));
            setPanel('fab', {
              ...panelState('fab'),
              width: safeSize,
              height: safeSize,
            });
          },
          onResetLayout: () => {
            setHudSettings({
              ...hudSettings,
              panels: {},
            });
          },
          onResetTheme: () => {
            setHudSettings({
              accentHue: DEFAULT_HUD_SETTINGS.accentHue,
              panels: {},
            });
          },
          onClose: () => {
            settingsOpen = false;
            renderUI();
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

  const hudRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: HUD_SETTINGS_KEY });
  if (hudRes.ok) {
    hudSettings = normalizeHudSettings(hudRes.data, getViewport());
  }
  featureSettings = await fetchFeatureSettings();
  applyHudPalette();

  watchFeatureSettings((nextSettings) => {
    featureSettings = nextSettings;
    renderUI();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!changes[HUD_SETTINGS_KEY]) return;
    hudSettings = normalizeHudSettings(changes[HUD_SETTINGS_KEY].newValue, getViewport());
    applyHudPalette();
    renderUI();
  });

  window.addEventListener('resize', () => {
    hudSettings = normalizeHudSettings(hudSettings, getViewport());
    applyHudPalette();
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
})();
