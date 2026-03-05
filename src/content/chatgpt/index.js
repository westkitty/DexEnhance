// ChatGPT content script entry point
// Runs in ISOLATED world (default) and communicates with background via runtime messaging.

import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { ChatGPTAdapter } from './adapter.js';
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
import { QuickHubPanel } from '../../ui/components/QuickHubPanel.jsx';
import { WelcomeHandoffModal } from '../../ui/components/WelcomeHandoffModal.jsx';
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
  hudBackgroundPalette,
  hueToHudPalette,
  normalizeHudSettings,
  updatePanelInSettings,
  updatePanelVisibilityInSettings,
  updateThemeInSettings,
} from '../../lib/ui-settings.js';

const ONBOARDING_SEEN_KEY = 'onboardingSeenVersion';
const ONBOARDING_VERSION = '2026-03-04-onboarding-v1';

async function getEnabledFlag() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'enabled' });
  if (!response.ok) {
    console.error('[DexEnhance] ChatGPT failed to read enabled flag via background:', response.error);
    return true;
  }
  return response.data !== false;
}

async function logStorageRoundTrip() {
  const key = 'dex_phase2_probe_chatgpt';
  const value = `ok-${Date.now()}`;

  const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
    items: { [key]: value },
  });
  if (!setRes.ok) {
    console.error('[DexEnhance] ChatGPT storage probe set failed:', setRes.error);
    return;
  }

  const getRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key });
  if (!getRes.ok) {
    console.error('[DexEnhance] ChatGPT storage probe get failed:', getRes.error);
    return;
  }

  const removeRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: key });
  if (!removeRes.ok) {
    console.error('[DexEnhance] ChatGPT storage probe remove failed:', removeRes.error);
    return;
  }

  console.log('[DexEnhance] ChatGPT storage message round-trip ok:', getRes.data);
}

(async function init() {
  const enabled = await getEnabledFlag();
  if (!enabled) return;

  const adapter = new ChatGPTAdapter();
  adapter.onGeneratingStart(() => {
    console.log('[DexEnhance] ChatGPT generating started');
  });
  adapter.onGeneratingEnd(() => {
    console.log('[DexEnhance] ChatGPT generating ended');
  });
  adapter.startObservers();

  console.log('[DexEnhance] ChatGPT content script loaded');
  console.log('[DexEnhance] ChatGPT adapter ready:', {
    hasTextarea: Boolean(adapter.getTextarea()),
    hasSubmitButton: Boolean(adapter.getSubmitButton()),
    hasChatList: Boolean(adapter.getChatListContainer()),
    isGenerating: adapter.isGenerating(),
  });
  await logStorageRoundTrip();

  const ui = createShadowRenderer({ site: 'chatgpt' });
  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  const welcomeIconUrl = chrome.runtime.getURL('icons/icon1024-welcome.png');

  let queueSizeState = 0;
  let welcomeVisible = false;
  let quickTourPromptVisible = false;
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
  const isPanelOpen = (panelId) => hudSettings.visibility?.[panelId] === true;

  const enforceOnboardingVisibility = (settings) => {
    let next = normalizeHudSettings(settings, getViewport());
    next = updatePanelVisibilityInSettings(next, 'welcome', false, getViewport());
    return next;
  };

  const applyHudPalette = () => {
    const palette = hueToHudPalette(hudSettings.accentHue);
    const bgPalette = hudBackgroundPalette(hudSettings);
    ui.mountPoint.style.setProperty('--dex-accent', palette.accent);
    ui.mountPoint.style.setProperty('--dex-accent-2', palette.accent2);
    ui.mountPoint.style.setProperty('--dex-cta', palette.cta);
    ui.mountPoint.style.setProperty('--dex-bg-base', bgPalette.bgBase);
    ui.mountPoint.style.setProperty('--dex-bg-glass', bgPalette.bgGlass);
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
    let normalized = normalizeHudSettings(nextSettings, getViewport());
    normalized = enforceOnboardingVisibility(normalized);
    hudSettings = normalized;
    applyHudPalette();
    if (persist) scheduleHudSettingsPersist();
    renderUI();
  };

  const setPanel = (panelId, nextPanel) => {
    setHudSettings(updatePanelInSettings(hudSettings, panelId, nextPanel, getViewport()));
  };

  const setPanelVisibility = (panelId, nextOpen) => {
    setHudSettings(updatePanelVisibilityInSettings(hudSettings, panelId, nextOpen, getViewport()));
  };

  const openWindow = (panelId) => setPanelVisibility(panelId, true);
  const closeWindow = (panelId) => setPanelVisibility(panelId, false);
  const toggleWindow = (panelId) => setPanelVisibility(panelId, !isPanelOpen(panelId));

  const openHubAction = (action) => {
    if (action === 'sidebar') openWindow('sidebar');
    else if (action === 'tokens') openWindow('tokens');
    else if (action === 'prompts') openWindow('promptLibrary');
    else if (action === 'optimize') openWindow('optimizer');
    else if (action === 'settings') openWindow('settings');
    else if (action === 'tour') openWindow('tour');
    else if (action === 'export') openWindow('export');
    else if (action === 'context') {
      void runSemanticClipboardInject();
    }
    else if (action === 'liveRender') {
      void runPopoutCanvasOpenLatest();
    }
  };

  const popoutCanvasController = createPopoutCanvasController({
    adapter,
    site: 'chatgpt',
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
        title: document.title || 'ChatGPT Conversation',
        fullText: mergedText,
        maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
      });
    }, 900);
  };

  adapter.onNewChat((payload) => {
    console.log('[DexEnhance] ChatGPT chat-list mutation observed:', payload);
    void popoutCanvasController.maybeAutoOpenFromLatestTurn();
    scheduleSemanticClipboardIngest();
  });

  const markTourSeen = async () => {
    welcomeVisible = false;
    quickTourPromptVisible = false;
    const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        tourSeenVersion: TOUR_VERSION,
        [ONBOARDING_SEEN_KEY]: ONBOARDING_VERSION,
      },
    });
    if (!setRes.ok) {
      console.warn('[DexEnhance] ChatGPT failed to persist tour seen state:', setRes.error);
    }
    renderUI();
  };

  const markOnboardingSeen = async ({ hideQuickTour = true } = {}) => {
    welcomeVisible = false;
    if (hideQuickTour) quickTourPromptVisible = false;
    const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        [ONBOARDING_SEEN_KEY]: ONBOARDING_VERSION,
      },
    });
    if (!setRes.ok) {
      console.warn('[DexEnhance] ChatGPT failed to persist onboarding seen state:', setRes.error);
    }
    renderUI();
  };

  const handleWelcomeGetStarted = () => {
    welcomeVisible = false;
    quickTourPromptVisible = true;
    let next = updatePanelVisibilityInSettings(hudSettings, 'fab', true, getViewport());
    next = updatePanelVisibilityInSettings(next, 'welcome', false, getViewport());
    setHudSettings(next);
    void markOnboardingSeen({ hideQuickTour: false });
  };

  const applyPostTourLayout = ({ openPromptLibrary = false } = {}) => {
    let next = enforceOnboardingVisibility(hudSettings);
    next = updatePanelVisibilityInSettings(next, 'hub', false, getViewport());
    next = updatePanelVisibilityInSettings(next, 'tour', false, getViewport());
    if (openPromptLibrary) {
      next = updatePanelVisibilityInSettings(next, 'promptLibrary', true, getViewport());
    }
    setHudSettings(next);
  };

  const startQuickTour = () => {
    quickTourPromptVisible = false;
    openWindow('tour');
    void markOnboardingSeen();
    renderUI();
  };

  const handleExport = async (format) => {
    const turns = parseConversation();
    if (turns.length === 0) {
      throw new Error('No conversation messages were detected.');
    }
    if (format === 'docx') {
      await exportToDocx(turns, { siteLabel: 'ChatGPT' });
      return;
    }
    exportToPdf(turns, { siteLabel: 'ChatGPT' });
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
          site: 'chatgpt',
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
    const tokenTitle = `Dex Tokens • ChatGPT${tokenCount != null ? ` • ${tokenCount}` : ''}`;

    render(
      h('div', null, [
        h(WelcomeHandoffModal, {
          key: 'welcome',
          visible: welcomeVisible,
          zipping: false,
          iconUrl: welcomeIconUrl,
          panelState: panelState('welcome'),
          zipTarget: {
            x: panelState('fab').x,
            y: panelState('fab').y,
            size: panelState('fab').width,
          },
          onPanelStateCommit: (next) => setPanel('welcome', next),
          onGetStarted: handleWelcomeGetStarted,
          onZipTransitionEnd: () => {},
        }),

        isPanelOpen('hub')
          ? h(QuickHubPanel, {
              key: 'hub',
              visible: true,
              iconUrl,
              panelState: panelState('hub'),
              defaultPanelState: panelDefault('hub'),
              onPanelStateChange: (next) => setPanel('hub', next),
              onClose: () => closeWindow('hub'),
              onAction: (action) => {
                openHubAction(action);
                if (action !== 'context' && action !== 'liveRender') {
                  closeWindow('hub');
                }
              },
            })
          : null,

        isPanelOpen('sidebar')
          ? h(PanelFrame, {
              key: 'sidebar',
              panelId: 'sidebar',
              title: 'DexEnhance • ChatGPT',
              iconUrl,
              panelState: panelState('sidebar'),
              defaultState: panelDefault('sidebar'),
              onPanelStateChange: (next) => setPanel('sidebar', next),
              minWidth: 240,
              minHeight: 220,
              zIndex: 2147483645,
              showClose: true,
              showPin: true,
              allowResize: true,
              onClose: () => closeWindow('sidebar'),
            }, [
              h(Sidebar, {
                site: 'ChatGPT',
                currentChatUrl: window.location.href,
                queueSize: queueSizeState,
                iconUrl,
                onRequestTour: () => openWindow('tour'),
                onRequestPrompts: () => openWindow('promptLibrary'),
                onRequestOptimizer: () => openWindow('optimizer'),
                onRequestExport: () => openWindow('export'),
                onRequestSettings: () => openWindow('settings'),
                onRequestContext: () => {
                  void runSemanticClipboardInject();
                },
                onRequestLiveRender: () => {
                  void runPopoutCanvasOpenLatest();
                },
              }),
            ])
          : null,

        isPanelOpen('tokens')
          ? h(PanelFrame, {
              key: 'tokens',
              panelId: 'tokens',
              title: tokenTitle,
              iconUrl,
              panelState: panelState('tokens'),
              defaultState: panelDefault('tokens'),
              onPanelStateChange: (next) => setPanel('tokens', next),
              minWidth: 180,
              minHeight: 48,
              zIndex: 2147483644,
              showClose: true,
              onClose: () => closeWindow('tokens'),
              showPin: false,
              showOptions: false,
              allowResize: true,
              compactCollapsed: true,
            }, [
              h(TokenOverlay, {
                site: 'ChatGPT',
                model: tokenModel,
                tokens: tokenCount,
                source: tokenSource,
                updatedAt: tokenUpdatedAt,
                iconUrl,
                compact: panelState('tokens').collapsed,
              }),
            ])
          : null,

        isPanelOpen('fab')
          ? h(FAB, {
              key: 'fab',
              site: 'ChatGPT',
              iconUrl,
              panelState: panelState('fab'),
              onPanelStateChange: (next) => setPanel('fab', next),
              showQuickTourButton: quickTourPromptVisible,
              onStartQuickTour: startQuickTour,
              onAction: (action) => {
                if (action === 'hub') {
                  toggleWindow('hub');
                }
              },
            })
          : null,
        h(PromptLibrary, {
          key: 'promptLibrary',
          visible: isPanelOpen('promptLibrary'),
          iconUrl,
          onClose: () => {
            closeWindow('promptLibrary');
          },
          onInsert: (text) => {
            const inserted = insertTextThroughAdapter(adapter, text);
            if (!inserted) {
              console.warn('[DexEnhance] ChatGPT prompt insert failed: no textarea found');
            }
          },
          windowState: panelState('promptLibrary'),
          defaultWindowState: panelDefault('promptLibrary'),
          onWindowStateChange: (next) => setPanel('promptLibrary', next),
        }),
        h(ExportDialog, {
          key: 'export',
          visible: isPanelOpen('export'),
          iconUrl,
          onClose: () => {
            closeWindow('export');
          },
          onExport: handleExport,
          windowState: panelState('export'),
          defaultWindowState: panelDefault('export'),
          onWindowStateChange: (next) => setPanel('export', next),
        }),
        h(PromptOptimizerModal, {
          key: 'optimizer',
          visible: isPanelOpen('optimizer'),
          site: 'ChatGPT',
          iconUrl,
          initialPrompt: readCurrentComposerText(adapter),
          onClose: () => {
            closeWindow('optimizer');
          },
          onOptimize: runHybridOptimization,
          onApply: (text) => {
            const applied = writeOptimizedComposerText(adapter, text);
            if (!applied) {
              console.warn('[DexEnhance] ChatGPT optimizer apply failed: no textarea found');
            }
          },
          windowState: panelState('optimizer'),
          defaultWindowState: panelDefault('optimizer'),
          onWindowStateChange: (next) => setPanel('optimizer', next),
        }),
        h(FeatureTourModal, {
          key: 'tour',
          visible: isPanelOpen('tour'),
          site: 'ChatGPT',
          iconUrl,
          onOpenPrompts: () => {
            applyPostTourLayout({ openPromptLibrary: true });
            void markTourSeen();
          },
          onClose: () => {
            applyPostTourLayout();
            void markTourSeen();
          },
          onComplete: () => {
            applyPostTourLayout();
            void markTourSeen();
          },
          windowState: panelState('tour'),
          defaultWindowState: panelDefault('tour'),
          onWindowStateChange: (next) => setPanel('tour', next),
        }),
        h(HUDSettingsPanel, {
          key: 'settings',
          visible: isPanelOpen('settings'),
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
          bgBaseHue: hudSettings.bgBaseHue,
          bgBaseSaturation: hudSettings.bgBaseSaturation,
          bgBaseLightness: hudSettings.bgBaseLightness,
          bgGlassHue: hudSettings.bgGlassHue,
          bgGlassSaturation: hudSettings.bgGlassSaturation,
          bgGlassLightness: hudSettings.bgGlassLightness,
          bgGlassAlpha: hudSettings.bgGlassAlpha,
          onBackgroundChange: (patch) => {
            setHudSettings(updateThemeInSettings(hudSettings, patch, getViewport()));
          },
          panelVisibility: hudSettings.visibility,
          panelOpacities: {
            hub: panelState('hub').opacity,
            sidebar: panelState('sidebar').opacity,
            tokens: panelState('tokens').opacity,
            fab: panelState('fab').opacity,
            promptLibrary: panelState('promptLibrary').opacity,
            optimizer: panelState('optimizer').opacity,
            tour: panelState('tour').opacity,
            export: panelState('export').opacity,
          },
          onPanelVisibilityChange: (panelId, nextOpen) => {
            setPanelVisibility(panelId, nextOpen);
          },
          onPanelOpacityChange: (panelId, opacity) => {
            setPanel(panelId, {
              ...panelState(panelId),
              opacity,
            });
          },
          fabSize: panelState('fab').width,
          onFabSizeChange: (size) => {
            const safeSize = Math.max(46, Math.min(84, Number(size) || 56));
            setPanel('fab', {
              ...panelState('fab'),
              width: safeSize,
              height: safeSize,
            });
          },
          onStartQuickTour: startQuickTour,
          onResetLayout: () => {
            setHudSettings({
              ...hudSettings,
              panels: {},
            });
          },
          onResetTheme: () => {
            setHudSettings({
              accentHue: DEFAULT_HUD_SETTINGS.accentHue,
              bgBaseHue: DEFAULT_HUD_SETTINGS.bgBaseHue,
              bgBaseSaturation: DEFAULT_HUD_SETTINGS.bgBaseSaturation,
              bgBaseLightness: DEFAULT_HUD_SETTINGS.bgBaseLightness,
              bgGlassHue: DEFAULT_HUD_SETTINGS.bgGlassHue,
              bgGlassSaturation: DEFAULT_HUD_SETTINGS.bgGlassSaturation,
              bgGlassLightness: DEFAULT_HUD_SETTINGS.bgGlassLightness,
              bgGlassAlpha: DEFAULT_HUD_SETTINGS.bgGlassAlpha,
              panels: {},
            });
          },
          onClose: () => {
            closeWindow('settings');
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
  hudSettings = updatePanelVisibilityInSettings(hudSettings, 'sidebar', false, getViewport());
  hudSettings = updatePanelVisibilityInSettings(hudSettings, 'tokens', false, getViewport());
  featureSettings = await fetchFeatureSettings();

  const onboardingState = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: ONBOARDING_SEEN_KEY });
  const hasSeenOnboarding = onboardingState.ok && onboardingState.data === ONBOARDING_VERSION;
  welcomeVisible = !hasSeenOnboarding;
  quickTourPromptVisible = false;
  hudSettings = enforceOnboardingVisibility(hudSettings);
  applyHudPalette();

  watchFeatureSettings((nextSettings) => {
    featureSettings = nextSettings;
    renderUI();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!changes[HUD_SETTINGS_KEY]) return;
    hudSettings = normalizeHudSettings(changes[HUD_SETTINGS_KEY].newValue, getViewport());
    hudSettings = enforceOnboardingVisibility(hudSettings);
    applyHudPalette();
    renderUI();
  });

  window.addEventListener('resize', () => {
    hudSettings = normalizeHudSettings(hudSettings, getViewport());
    applyHudPalette();
    renderUI();
  });

  renderUI();
  const queueController = setupQueueController({
    adapter,
    siteLabel: 'ChatGPT',
    onQueueSizeChange: (size) => {
      queueSizeState = size;
      renderUI();
    },
  });
  queueSizeState = queueController.getQueueSize();
  renderUI();
})();
