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
import { WelcomeHandoffModal } from '../../ui/components/WelcomeHandoffModal.jsx';
import { DexToastViewport } from '../../ui/components/DexToastViewport.jsx';
import { normalizeFeatureSettings } from '../../lib/feature-settings.js';
import { fetchFeatureSettings, watchFeatureSettings } from '../shared/feature-flags.js';
import { createPopoutCanvasController } from '../shared/popout-canvas-controller.js';
import {
  buildDiagnostics,
  copyDiagnosticsToClipboard,
  relayToastFromRuntimeMessage,
  showDexToast,
} from '../../ui/runtime/dex-toast-controller.js';
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
  const welcomeIconUrl = chrome.runtime.getURL('icons/icon1024.png');

  let queueSizeState = 0;
  let welcomeVisible = false;
  let tokenModel = null;
  let tokenCount = null;
  let tokenSource = null;
  let tokenUpdatedAt = null;
  let featureSettings = normalizeFeatureSettings({});
  let semanticIngestTimer = null;
  let queueController = null;
  let queueRuntimeState = null;
  let adapterHealthState = {
    healthy: true,
    degraded: false,
    uiInjected: true,
    hasTextarea: false,
    hasSubmitButton: false,
    hasChatList: false,
    lastCheckedAt: 0,
    reason: '',
  };
  let workerHealthState = {
    lastPingAt: 0,
    lastFailureAt: 0,
    lastError: '',
  };
  let lastAdapterHealthToastAt = 0;
  let adapterHealthFailCount = 0;
  const healthCheckStartedAt = Date.now();
  let healthCheckTimer = null;

  let hudSettings = normalizeHudSettings({}, { width: window.innerWidth, height: window.innerHeight });
  let persistHudTimer = null;

  const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  const toastFailure = ({
    operation,
    title = 'DexEnhance action failed',
    message,
    error,
    details = '',
    actions = [],
    type = 'error',
  }) => {
    showDexToast({
      type,
      title,
      message: message || (error instanceof Error ? error.message : String(error || 'Unknown error')),
      details,
      actions,
      diagnostics: buildDiagnostics({
        module: 'content/gemini',
        operation,
        host: window.location.hostname,
        url: window.location.href,
        error,
      }),
    });
  };

  const statusDiagnosticsPayload = (operation, error) => {
    const diagnostics = buildDiagnostics({
      module: 'content/gemini',
      operation,
      host: window.location.hostname,
      url: window.location.href,
      error,
    });
    if (error == null) {
      diagnostics.error = '';
      diagnostics.stack = '';
    }
    return {
      ...diagnostics,
      adapterHealth: adapterHealthState,
      workerHealth: workerHealthState,
      queue: {
        paused: queueRuntimeState?.paused === true,
        count: queueRuntimeState?.items?.length || 0,
        lastError: queueRuntimeState?.lastError || null,
      },
      token: {
        source: tokenSource || '',
        updatedAt: tokenUpdatedAt || 0,
      },
    };
  };

  const copyStatusDiagnostics = async () => {
    const payload = statusDiagnosticsPayload('status.copy_diagnostics', null);
    const copied = await copyDiagnosticsToClipboard(payload).catch(() => false);
    if (copied) {
      showDexToast({
        type: 'success',
        title: 'Diagnostics copied',
        message: 'Status diagnostics copied to your clipboard.',
      });
    } else {
      showDexToast({
        type: 'warning',
        title: 'Clipboard unavailable',
        message: 'DexEnhance could not access the clipboard.',
      });
    }
  };

  const runAdapterHealthCheck = ({ notify = false } = {}) => {
    const next = {
      uiInjected: ui.host?.isConnected === true,
      hasTextarea: Boolean(adapter.getTextarea()),
      hasSubmitButton: Boolean(adapter.getSubmitButton()),
      hasChatList: Boolean(adapter.getChatListContainer()),
      lastCheckedAt: Date.now(),
      reason: '',
      degraded: false,
      healthy: true,
    };
    const hasRequiredSelectors = next.uiInjected && next.hasTextarea && next.hasSubmitButton;
    next.degraded = hasRequiredSelectors && !next.hasChatList;
    next.healthy = hasRequiredSelectors;
    if (!next.healthy) {
      next.reason = 'Required selector mismatch or host UI drift detected.';
    } else if (next.degraded) {
      next.reason = 'Optional chat-list selector mismatch detected. Composer actions remain available.';
    }

    const becameUnhealthy = adapterHealthState.healthy !== false && next.healthy === false;
    if (next.healthy) {
      adapterHealthFailCount = 0;
    } else {
      adapterHealthFailCount += 1;
    }
    adapterHealthState = next;
    renderUI();

    if (notify && !next.healthy) {
      const ts = Date.now();
      const inStartupWindow = ts - healthCheckStartedAt < 4500;
      const unstable = adapterHealthFailCount < 3;
      if (!inStartupWindow && !unstable && (becameUnhealthy || ts - lastAdapterHealthToastAt > 60000)) {
        lastAdapterHealthToastAt = ts;
        showDexToast({
          type: 'error',
          title: 'Host adapter health check failed',
          message: 'DexEnhance could not find one or more required host selectors.',
          details: `uiInjected=${next.uiInjected}, textarea=${next.hasTextarea}, submit=${next.hasSubmitButton}, chatList=${next.hasChatList}`,
          diagnostics: statusDiagnosticsPayload('adapter.health_check', new Error(next.reason || 'Adapter unhealthy')),
          actions: [
            {
              label: 'Run diagnostics',
              onSelect: () => { void copyStatusDiagnostics(); },
            },
            {
              label: 'Attempt re-inject',
              onSelect: () => {
                const reinjected = injectApiBridge();
                adapter.startObservers();
                runAdapterHealthCheck({ notify: false });
                showDexToast({
                  type: reinjected ? 'info' : 'warning',
                  title: reinjected ? 'Re-inject attempted' : 'Re-inject skipped',
                  message: reinjected
                    ? 'UI re-injection attempted. Re-checking adapter health.'
                    : 'Could not re-inject API bridge script.',
                });
              },
            },
          ],
          durationMs: 12000,
        });
      }
    }
  };

  const scheduleAdapterHealthCheck = ({ notify = false } = {}) => {
    if (healthCheckTimer) window.clearTimeout(healthCheckTimer);
    healthCheckTimer = window.setTimeout(() => runAdapterHealthCheck({ notify }), 220);
  };

  const pingServiceWorker = async ({ notifyOnFailure = false } = {}) => {
    const ping = await sendRuntimeMessage(MESSAGE_ACTIONS.PING, {}, { timeoutMs: 3600 });
    if (ping.ok) {
      workerHealthState = {
        ...workerHealthState,
        lastPingAt: Date.now(),
        lastError: '',
      };
      renderUI();
      return;
    }

    workerHealthState = {
      ...workerHealthState,
      lastFailureAt: Date.now(),
      lastError: ping.error || 'Service worker ping failed.',
    };
    renderUI();

    if (notifyOnFailure) {
      showDexToast({
        type: 'warning',
        title: 'Service worker connection issue',
        message: workerHealthState.lastError,
        diagnostics: statusDiagnosticsPayload('service_worker.ping', new Error(workerHealthState.lastError)),
      });
    }
  };

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
    ui.mountPoint.style.setProperty('--dex-watermark-opacity', String(hudSettings.watermarkOpacity ?? 0.30));
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
      }).then((response) => {
        if (!response.ok) {
          toastFailure({
            operation: 'hud_settings.persist',
            title: 'Could not save HUD settings',
            error: new Error(response.error || 'Storage write failed'),
          });
        }
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

  const popoutCanvasController = createPopoutCanvasController({
    adapter,
    site: 'gemini',
    getFeatureSettings: () => featureSettings,
  });

  const runSemanticClipboardInject = async () => {
    if (featureSettings.modules.semanticClipboard.enabled !== true) {
      toastFailure({
        operation: 'semantic_clipboard.inject',
        title: 'Semantic Clipboard disabled',
        type: 'warning',
        message: 'Enable Semantic Clipboard in Settings to inject context.',
      });
      return;
    }

    const queryText = readCurrentComposerText(adapter) || adapter.getLatestAssistantTurnText();
    if (!queryText.trim()) {
      toastFailure({
        operation: 'semantic_clipboard.inject',
        title: 'No prompt text found',
        type: 'warning',
        message: 'DexEnhance could not find text in the current composer.',
      });
      return;
    }

    const response = await buildSemanticClipboardPreamble({
      queryText,
      topK: featureSettings.modules.semanticClipboard.topK,
      maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
    });

    if (!response.ok) {
      toastFailure({
        operation: 'semantic_clipboard.build_preamble',
        title: 'Context preamble failed',
        error: new Error(response.error || 'Preamble request failed'),
      });
      return;
    }

    const preamble = typeof response.data?.preamble === 'string' ? response.data.preamble : '';
    if (!preamble.trim()) {
      toastFailure({
        operation: 'semantic_clipboard.inject',
        title: 'No relevant context yet',
        type: 'info',
        message: 'Semantic Clipboard has not collected relevant context for this prompt yet.',
      });
      return;
    }

    const applied = prependPreambleToComposer(adapter, preamble, readCurrentComposerText(adapter));
    if (!applied) {
      toastFailure({
        operation: 'semantic_clipboard.inject',
        title: 'Prompt insertion failed',
        error: new Error('No composer detected'),
      });
    }
  };

  const runPopoutCanvasOpenLatest = async () => {
    const response = await popoutCanvasController.openLatest();
    if (!response?.ok) {
      toastFailure({
        operation: 'popout_canvas.open_latest',
        title: 'Pop-out canvas failed',
        error: new Error(response?.error || 'Unknown error'),
      });
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

  const markOnboardingSeen = async () => {
    welcomeVisible = false;
    const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        [ONBOARDING_SEEN_KEY]: ONBOARDING_VERSION,
      },
    });
    if (!setRes.ok) {
      toastFailure({
        operation: 'onboarding.persist_seen',
        title: 'Could not save onboarding state',
        error: new Error(setRes.error || 'Storage write failed'),
      });
    }
    renderUI();
  };

  const handleWelcomeGetStarted = () => {
    welcomeVisible = false;
    let next = updatePanelVisibilityInSettings(hudSettings, 'fab', true, getViewport());
    next = updatePanelVisibilityInSettings(next, 'sidebar', true, getViewport());
    next = updatePanelVisibilityInSettings(next, 'welcome', false, getViewport());
    setHudSettings(next);
    void markOnboardingSeen();
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

        isPanelOpen('sidebar')
          ? h(PanelFrame, {
              key: 'sidebar',
              panelId: 'sidebar',
              title: 'DexEnhance • Gemini',
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
                site: 'Gemini',
                currentChatUrl: window.location.href,
                queueSize: queueSizeState,
                iconUrl,
                watermarkOpacity: hudSettings.watermarkOpacity,
                queueController,
                statusSnapshot: {
                  hostLabel: 'Gemini',
                  adapterHealth: adapterHealthState,
                  workerHealth: workerHealthState,
                  queueState: queueRuntimeState || queueController?.getState?.() || { paused: false, items: [] },
                  tokenState: {
                    source: tokenSource,
                    updatedAt: tokenUpdatedAt,
                  },
                  featureSettings,
                },
                onCopyDiagnostics: () => {
                  void copyStatusDiagnostics();
                },
                onReinjectUi: () => {
                  const reinjected = injectApiBridge();
                  adapter.startObservers();
                  scheduleAdapterHealthCheck({ notify: true });
                  showDexToast({
                    type: reinjected ? 'info' : 'warning',
                    title: reinjected ? 'Re-inject attempted' : 'Re-inject failed',
                    message: reinjected
                      ? 'DexEnhance requested a fresh bridge injection.'
                      : 'Could not inject API bridge script.',
                  });
                },
                onReloadAdapter: () => {
                  adapter.startObservers();
                  scheduleAdapterHealthCheck({ notify: true });
                  showDexToast({
                    type: 'info',
                    title: 'Adapter reload requested',
                    message: 'Adapter observers restarted and health check queued.',
                  });
                },
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
                site: 'Gemini',
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
              site: 'Gemini',
              iconUrl,
              panelState: panelState('fab'),
              onPanelStateChange: (next) => setPanel('fab', next),
              onAction: (action) => {
                if (action === 'home') {
                  openWindow('sidebar');
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
              toastFailure({
                operation: 'prompt_library.insert',
                title: 'Prompt insertion failed',
                error: new Error('No composer textarea detected'),
              });
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
          site: 'Gemini',
          iconUrl,
          initialPrompt: readCurrentComposerText(adapter),
          onClose: () => {
            closeWindow('optimizer');
          },
          onOptimize: runHybridOptimization,
          onApply: (text) => {
            const applied = writeOptimizedComposerText(adapter, text);
            if (!applied) {
              toastFailure({
                operation: 'optimizer.apply',
                title: 'Could not apply optimized prompt',
                error: new Error('No composer textarea detected'),
              });
            }
          },
          windowState: panelState('optimizer'),
          defaultWindowState: panelDefault('optimizer'),
          onWindowStateChange: (next) => setPanel('optimizer', next),
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
          watermarkOpacity: hudSettings.watermarkOpacity,
          onWatermarkOpacityChange: (opacity) => {
            setHudSettings({
              ...hudSettings,
              watermarkOpacity: opacity,
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
            sidebar: panelState('sidebar').opacity,
            tokens: panelState('tokens').opacity,
            fab: panelState('fab').opacity,
            promptLibrary: panelState('promptLibrary').opacity,
            optimizer: panelState('optimizer').opacity,
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
          onResetLayout: () => {
            setHudSettings({
              ...hudSettings,
              panels: {},
            });
          },
          onResetTheme: () => {
              setHudSettings({
                accentHue: DEFAULT_HUD_SETTINGS.accentHue,
                watermarkOpacity: DEFAULT_HUD_SETTINGS.watermarkOpacity,
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
        h(DexToastViewport, {
          key: 'dex-toast-viewport',
        }),
      ]),
      ui.mountPoint
    );
  };

  const bridgeInjected = injectApiBridge();
  if (!bridgeInjected) {
    toastFailure({
      operation: 'api_bridge.inject',
      title: 'Token bridge injection failed',
      error: new Error('Could not inject API bridge script.'),
    });
  }
  registerOptimizerWorkerListener({ adapter });
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.action === MESSAGE_ACTIONS.UI_TOAST) {
      relayToastFromRuntimeMessage(message.payload);
      return false;
    }
    if (message?.action === MESSAGE_ACTIONS.UI_OPEN_HOME) {
      openWindow('sidebar');
      renderUI();
      return false;
    }
    return false;
  });
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
    scheduleAdapterHealthCheck({ notify: false });
    renderUI();
  });

  queueController = setupQueueController({
    adapter,
    siteLabel: 'Gemini',
    onQueueSizeChange: (size) => {
      queueSizeState = size;
      renderUI();
    },
    onStateChange: (nextState) => {
      queueRuntimeState = nextState;
      renderUI();
    },
    onQueueError: (queueError) => {
      toastFailure({
        operation: 'queue.processing',
        title: 'Queued prompt failed',
        message: queueError.message,
        error: new Error(queueError.message),
        details: `Operation: ${queueError.operation}\\nItem: ${queueError.itemId || 'n/a'}`,
        actions: queueError.itemId
          ? [{
              label: 'Retry',
              onSelect: () => {
                queueController?.retryItem(queueError.itemId);
                queueController?.sendNow(queueError.itemId);
              },
            }]
          : [],
      });
    },
  });
  queueSizeState = queueController.getQueueSize();
  queueRuntimeState = queueController.getState();

  if (document.body) {
    const observer = new MutationObserver(() => {
      scheduleAdapterHealthCheck({ notify: false });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  window.setInterval(() => {
    void pingServiceWorker({ notifyOnFailure: false });
  }, 20000);
  void pingServiceWorker({ notifyOnFailure: true });
  runAdapterHealthCheck({ notify: true });

  renderUI();
})();
