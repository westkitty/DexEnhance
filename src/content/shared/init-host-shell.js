import { h, render } from 'preact';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { createShadowRenderer } from '../../ui/shadow-renderer.js';
import { PromptLibrary } from '../../ui/components/PromptLibrary.jsx';
import { QueueManager } from '../../ui/components/QueueManager.jsx';
import { ExportDialog } from '../../ui/components/ExportDialog.jsx';
import { parseConversation } from './parser.js';
import { exportToDocx, exportToPdf } from './exporter.js';
import { injectApiBridge, subscribeToApiBridge } from './api-bridge.js';
import {
  deterministicRewritePrompt,
  readCurrentComposerText,
  registerOptimizerWorkerListener,
  runAiRefinementInCurrentTab,
  writeOptimizedComposerText,
} from './prompt-optimizer.js';
import { PromptOptimizerModal } from '../../ui/components/PromptOptimizerModal.jsx';
import { HUDSettingsPanel } from '../../ui/components/HUDSettingsPanel.jsx';
import { WelcomeHandoffModal } from '../../ui/components/WelcomeHandoffModal.jsx';
import { DexToastViewport } from '../../ui/components/DexToastViewport.jsx';
import { normalizeFeatureSettings } from '../../lib/feature-settings.js';
import { fetchFeatureSettings, watchFeatureSettings } from './feature-flags.js';
import { createPopoutCanvasController } from './popout-canvas-controller.js';
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
} from './semantic-clipboard-client.js';
import {
  DEFAULT_HUD_SETTINGS,
  HUD_SETTINGS_KEY,
  defaultPanelState,
  normalizeHudSettings,
  themePresetTokens,
  updatePanelInSettings,
  updatePanelVisibilityInSettings,
  updateThemeInSettings,
} from '../../lib/ui-settings.js';
import { insertTextThroughAdapter } from './input-utils.js';
import { setupQueueController } from './queue-controller.js';
import { DexLauncher } from '../../ui/components/DexLauncher.jsx';
import { CommandPalette } from '../../ui/components/CommandPalette.jsx';
import { DexDrawer } from '../../ui/components/DexDrawer.jsx';
import { DrawerStatusBar } from '../../ui/components/DrawerStatusBar.jsx';
import { QuickHubWindow } from '../../ui/components/QuickHubWindow.jsx';
import { TokenOverlay } from '../../ui/components/TokenOverlay.jsx';
import { SemanticClipboardPanel } from '../../ui/components/SemanticClipboardPanel.jsx';
import { FeatureTour } from '../../ui/components/FeatureTour.jsx';
import { StatusPanel } from '../../ui/components/StatusPanel.jsx';

const ONBOARDING_SEEN_KEY = 'onboardingSeenVersion';
const ONBOARDING_VERSION = '2026-03-06-shell-v1';
const TOUR_SEEN_KEY = 'tourSeenVersion';
const TOUR_VERSION = '2026-03-08-vnext-tour';
const DRAWER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'queue', label: 'Queue' },
  { id: 'optimizer', label: 'Optimize' },
  { id: 'context', label: 'Context' },
  { id: 'export', label: 'Export' },
  { id: 'settings', label: 'Settings' },
];

function isEditableElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return element.isContentEditable === true;
}

async function getEnabledFlag(siteLabel) {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: 'enabled' });
  if (!response.ok) {
    console.error(`[DexEnhance] ${siteLabel} failed to read enabled flag via background:`, response.error);
    return true;
  }
  return response.data !== false;
}

async function logStorageRoundTrip(siteKey, siteLabel) {
  const key = `dex_phase2_probe_${siteKey}`;
  const value = `ok-${Date.now()}`;

  const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, { items: { [key]: value } });
  if (!setRes.ok) {
    console.error(`[DexEnhance] ${siteLabel} storage probe set failed:`, setRes.error);
    return;
  }

  const getRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key });
  if (!getRes.ok) {
    console.error(`[DexEnhance] ${siteLabel} storage probe get failed:`, getRes.error);
    return;
  }

  const removeRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: key });
  if (!removeRes.ok) {
    console.error(`[DexEnhance] ${siteLabel} storage probe remove failed:`, removeRes.error);
    return;
  }

  console.log(`[DexEnhance] ${siteLabel} storage message round-trip ok:`, getRes.data);
}

export async function initHostShell({ siteKey, siteLabel, AdapterClass }) {
  const enabled = await getEnabledFlag(siteLabel);
  if (!enabled) return;

  const adapter = new AdapterClass();
  adapter.startObservers();

  console.log(`[DexEnhance] ${siteLabel} content script loaded`);
  console.log(`[DexEnhance] ${siteLabel} adapter ready:`, {
    hasTextarea: Boolean(adapter.getTextarea()),
    hasSubmitButton: Boolean(adapter.getSubmitButton()),
    hasChatList: Boolean(adapter.getChatListContainer()),
    isGenerating: adapter.isGenerating(),
  });
  await logStorageRoundTrip(siteKey, siteLabel);

  const ui = createShadowRenderer({ site: siteKey });
  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  const welcomeIconUrl = chrome.runtime.getURL('icons/icon1024.png');

  let queueSizeState = 0;
  let queueController = null;
  let queueRuntimeState = null;
  let promptCountState = 0;
  let semanticStatsState = { chunkCount: 0, sourceCount: 0, queryCacheCount: 0 };
  let currentFolderState = { folderId: null, folderName: '' };
  let welcomeVisible = false;
  let welcomeZipping = false;
  let welcomeZipFallbackTimer = null;
  let paletteOpen = false;
  let drawerOpen = false;
  let activeDrawerView = 'overview';
  let promptWorkspaceSection = 'prompts';
  let launcherExpanded = false;
  let quickHubCollapsed = false;
  let quickHubPinned = false;
  let tourCollapsed = false;
  let tourPinned = false;
  let tokenModel = null;
  let tokenCount = null;
  let tokenSource = null;
  let tokenUpdatedAt = null;
  let featureSettings = normalizeFeatureSettings({});
  let semanticIngestTimer = null;
  let adapterHealthState = {
    healthy: true,
    degraded: false,
    settled: false,
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
  let adapterHealthSettled = false;
  const healthCheckStartedAt = Date.now();
  let healthCheckTimer = null;
  let hudSettings = normalizeHudSettings({}, { width: window.innerWidth, height: window.innerHeight });
  let persistHudTimer = null;

  const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  const panelState = (panelId) => hudSettings.panels[panelId] || defaultPanelState(panelId, getViewport());

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
        module: `content/${siteKey}`,
        operation,
        host: window.location.hostname,
        url: window.location.href,
        error,
      }),
    });
  };

  const statusDiagnosticsPayload = (operation, error) => {
    const diagnostics = buildDiagnostics({
      module: `content/${siteKey}`,
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
    showDexToast({
      type: copied ? 'success' : 'warning',
      title: copied ? 'Diagnostics copied' : 'Clipboard unavailable',
      message: copied ? 'Status diagnostics copied to your clipboard.' : 'DexEnhance could not access the clipboard.',
    });
  };

  const applyThemePreset = () => {
    const tokens = themePresetTokens(hudSettings.themePreset);
    for (const [key, value] of Object.entries(tokens)) {
      ui.mountPoint.style.setProperty(`--dex-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`, String(value));
    }
    ui.mountPoint.style.setProperty('--dex-accent-hue', String(Math.round(Number(hudSettings.accentHue || 202))));
    ui.mountPoint.style.setProperty('--dex-surface-opacity', String(Number(hudSettings.transparency || 0.96).toFixed(2)));
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
            title: 'Could not save shell settings',
            error: new Error(response.error || 'Storage write failed'),
          });
        }
      });
    }, 220);
  };

  const setHudSettings = (nextSettings, { persist = true } = {}) => {
    hudSettings = normalizeHudSettings(nextSettings, getViewport());
    applyThemePreset();
    if (persist) scheduleHudSettingsPersist();
    renderUI();
  };

  const setPanel = (panelId, nextPanel) => {
    setHudSettings(updatePanelInSettings(hudSettings, panelId, nextPanel, getViewport()));
  };

  const setLauncherVisibility = (visible) => {
    setHudSettings(updatePanelVisibilityInSettings(hudSettings, 'launcher', visible, getViewport()));
  };

  const setQuickHubVisibility = (visible) => {
    setHudSettings(updatePanelVisibilityInSettings(hudSettings, 'quickHub', visible, getViewport()));
  };

  const setTourVisibility = (visible) => {
    setHudSettings(updatePanelVisibilityInSettings(hudSettings, 'tour', visible, getViewport()));
  };

  const runAdapterHealthCheck = ({ notify = false } = {}) => {
    const ts = Date.now();
    const next = {
      uiInjected: ui.host?.isConnected === true,
      hasTextarea: Boolean(adapter.getTextarea()),
      hasSubmitButton: Boolean(adapter.getSubmitButton()),
      hasChatList: Boolean(adapter.getChatListContainer()),
      lastCheckedAt: ts,
      reason: '',
      degraded: false,
      healthy: true,
      settled: false,
    };
    const hasRequiredSelectors = next.uiInjected && next.hasTextarea && next.hasSubmitButton;
    next.degraded = hasRequiredSelectors && !next.hasChatList;
    next.healthy = hasRequiredSelectors;
    if (!next.healthy) {
      next.reason = 'Required selector mismatch or host UI drift detected.';
    } else if (next.degraded) {
      next.reason = 'Optional chat-list selector mismatch detected. Composer actions remain available.';
    }

    const wasSettled = adapterHealthState.settled === true;
    const wasHealthy = adapterHealthState.healthy === true;
    if (next.healthy) {
      adapterHealthFailCount = 0;
      adapterHealthSettled = true;
    } else {
      adapterHealthFailCount += 1;
      const inStartupWindow = ts - healthCheckStartedAt < 10000;
      if (!inStartupWindow && adapterHealthFailCount >= 3) {
        adapterHealthSettled = true;
      }
    }
    next.settled = adapterHealthSettled;
    adapterHealthState = next;
    renderUI();

    if (notify && next.settled && !next.healthy) {
      const becameUnhealthy = wasSettled && wasHealthy && next.healthy === false;
      const becameSettledUnhealthy = !wasSettled && next.healthy === false;
      if (becameUnhealthy || becameSettledUnhealthy || ts - lastAdapterHealthToastAt > 60000) {
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
                  message: reinjected ? 'UI re-injection attempted. Re-checking adapter health.' : 'Could not re-inject API bridge script.',
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
      workerHealthState = { ...workerHealthState, lastPingAt: Date.now(), lastError: '' };
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

  const openPalette = () => {
    paletteOpen = true;
    renderUI();
  };

  const closePalette = () => {
    paletteOpen = false;
    renderUI();
  };

  const closeDrawer = () => {
    drawerOpen = false;
    renderUI();
  };

  const openQuickHub = () => {
    launcherExpanded = false;
    setQuickHubVisibility(true);
  };

  const closeQuickHub = () => {
    setQuickHubVisibility(false);
  };

  const openTour = () => {
    setTourVisibility(true);
  };

  const closeTour = () => {
    setTourVisibility(false);
  };

  const refreshPromptCount = async () => {
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.PROMPT_LIST, {});
    if (response.ok && Array.isArray(response.data)) {
      promptCountState = response.data.length;
      renderUI();
    }
  };

  const refreshSemanticStats = async () => {
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_STATS, {});
    if (response.ok) {
      semanticStatsState = response.data || semanticStatsState;
      renderUI();
    }
  };

  const refreshCurrentFolderState = async () => {
    const chatUrl = window.location.href;
    const [mappingRes, treeRes] = await Promise.all([
      sendRuntimeMessage(MESSAGE_ACTIONS.FOLDER_GET_BY_CHAT_URL, { chatUrl }),
      sendRuntimeMessage(MESSAGE_ACTIONS.FOLDER_TREE_GET, { includeDeleted: true }),
    ]);
    const folderId = mappingRes.ok ? mappingRes.data?.folderId || null : null;
    const folders = treeRes.ok && Array.isArray(treeRes.data?.folders) ? treeRes.data.folders : [];
    const folder = folders.find((item) => item.id === folderId) || null;
    currentFolderState = {
      folderId,
      folderName: folder?.name || '',
    };
    renderUI();
  };

  const openDrawer = (view, options = {}) => {
    if (view === 'prompts') {
      promptWorkspaceSection = options.promptSection === 'folders' ? 'folders' : 'prompts';
    }
    activeDrawerView = DRAWER_TABS.some((tab) => tab.id === view) ? view : 'overview';
    paletteOpen = false;
    drawerOpen = true;
    if (view === 'context') void refreshSemanticStats();
    if (view === 'prompts') {
      void Promise.all([refreshPromptCount(), refreshCurrentFolderState()]);
    }
    setHudSettings({
      ...hudSettings,
      drawer: {
        ...hudSettings.drawer,
        lastView: activeDrawerView,
      },
    });
  };

  const openLastDrawerView = () => {
    openDrawer(hudSettings.drawer?.lastView || activeDrawerView || 'overview');
  };

  const markTourSeen = async () => {
    const setRes = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        [TOUR_SEEN_KEY]: TOUR_VERSION,
      },
    });
    if (!setRes.ok) {
      toastFailure({
        operation: 'tour.persist_seen',
        title: 'Could not save quick tour state',
        error: new Error(setRes.error || 'Storage write failed'),
      });
    }
  };

  const completeTour = async () => {
    await markTourSeen();
    closeTour();
  };

  const openSurface = (surface, options = {}) => {
    switch (surface) {
      case 'home':
      case 'hub':
        openQuickHub();
        break;
      case 'palette':
        openPalette();
        break;
      case 'tour':
        openTour();
        break;
      case 'workspace':
        openDrawer('prompts', { promptSection: 'folders' });
        break;
      case 'prompts':
      case 'queue':
      case 'optimizer':
      case 'context':
      case 'export':
      case 'settings':
      case 'overview':
        openDrawer(surface, options);
        break;
      case 'canvas':
        void runPopoutCanvasOpenLatest();
        break;
      default:
        openQuickHub();
        break;
    }
  };

  const markOnboardingSeen = async () => {
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
  };

  const finalizeWelcomeHandoff = async () => {
    if (welcomeZipFallbackTimer) {
      window.clearTimeout(welcomeZipFallbackTimer);
      welcomeZipFallbackTimer = null;
    }
    welcomeVisible = false;
    welcomeZipping = false;
    setLauncherVisibility(true);
    setQuickHubVisibility(true);
    await markOnboardingSeen();
    renderUI();
  };

  const handleWelcomeGetStarted = () => {
    if (welcomeZipping) return;
    welcomeZipping = true;
    renderUI();
    welcomeZipFallbackTimer = window.setTimeout(() => {
      if (welcomeZipping) void finalizeWelcomeHandoff();
    }, 760);
  };

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
      return;
    }

    showDexToast({
      type: 'success',
      title: 'Context injected',
      message: 'Semantic Clipboard preamble inserted into the composer.',
    });
  };

  const popoutCanvasController = createPopoutCanvasController({
    adapter,
    site: siteKey,
    getFeatureSettings: () => featureSettings,
  });

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
    if (semanticIngestTimer) window.clearTimeout(semanticIngestTimer);

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
        title: document.title || `${siteLabel} Conversation`,
        fullText: mergedText,
        maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
      }).then(() => {
        void refreshSemanticStats();
      });
    }, 900);
  };

  adapter.onNewChat(() => {
    void popoutCanvasController.maybeAutoOpenFromLatestTurn();
    scheduleSemanticClipboardIngest();
    void refreshCurrentFolderState();
  });

  const handleExport = async (format) => {
    const turns = parseConversation();
    if (turns.length === 0) {
      throw new Error('No conversation messages were detected.');
    }
    if (format === 'docx') {
      await exportToDocx(turns, { siteLabel });
      return;
    }
    exportToPdf(turns, { siteLabel });
  };

  const runHybridOptimization = async ({ sourcePrompt, aiRefinementEnabled, refinementMode }) => {
    const normalizedSource = typeof sourcePrompt === 'string' ? sourcePrompt.trim() : '';
    if (!normalizedSource) throw new Error('Enter a prompt before running optimization.');

    const localPrompt = deterministicRewritePrompt(normalizedSource);
    if (!localPrompt) throw new Error('Unable to produce deterministic rewrite.');

    if (!aiRefinementEnabled) {
      return { localPrompt, finalPrompt: localPrompt, methodUsed: 'local_only' };
    }

    if (refinementMode === 'hidden_tab') {
      try {
        const response = await sendRuntimeMessage(MESSAGE_ACTIONS.OPTIMIZER_REFINE_HIDDEN_TAB, { site: siteKey, prompt: localPrompt });
        if (!response.ok) throw new Error(response.error || 'Hidden-tab refinement failed.');
        const refinedPrompt = typeof response.data?.refinedPrompt === 'string' ? response.data.refinedPrompt.trim() : '';
        if (!refinedPrompt) throw new Error('Hidden-tab refinement returned empty text.');
        return { localPrompt, finalPrompt: refinedPrompt, methodUsed: 'hidden_tab' };
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
      const result = await runAiRefinementInCurrentTab({ adapter, localPrompt });
      return { localPrompt, finalPrompt: result.refinedPrompt, methodUsed: 'same_tab' };
    } catch (error) {
      return {
        localPrompt,
        finalPrompt: localPrompt,
        methodUsed: 'local_only',
        warning: `AI refinement fallback: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const queuePromptText = (text, originModule = 'prompt_library') => {
    const normalized = typeof text === 'string' ? text.trim() : '';
    if (!normalized) {
      throw new Error('No prompt text available to queue.');
    }
    const item = queueController?.enqueue(normalized, originModule);
    if (!item) {
      throw new Error('Queue could not accept the prompt.');
    }
    showDexToast({
      type: 'success',
      title: 'Prompt queued',
      message: 'The prompt is now visible in Queue Manager.',
    });
    openDrawer('queue');
    return item;
  };

  const sendPromptText = (text) => {
    const normalized = typeof text === 'string' ? text.trim() : '';
    if (!normalized) {
      throw new Error('No prompt text available to send.');
    }
    const wrote = adapter.setComposerValue(normalized);
    if (!wrote) {
      throw new Error('No composer is available for direct send.');
    }
    if (adapter.isGenerating()) {
      adapter.clearComposer();
      queuePromptText(normalized, 'direct_send_fallback');
      return;
    }
    const submitted = adapter.submitComposer();
    if (!submitted) {
      throw new Error('DexEnhance could not submit the current composer.');
    }
    showDexToast({
      type: 'success',
      title: 'Prompt sent',
      message: 'The prompt was written into the composer and submitted.',
    });
  };

  const ingestCurrentContext = async () => {
    const latestAssistantText = adapter.getLatestAssistantTurnText();
    const currentComposerText = readCurrentComposerText(adapter);
    const mergedText = [
      latestAssistantText ? `ASSISTANT: ${latestAssistantText}` : '',
      currentComposerText ? `USER_DRAFT: ${currentComposerText}` : '',
    ].filter(Boolean).join('\n');
    if (!mergedText.trim()) {
      throw new Error('There is no current thread content available to ingest.');
    }
    const response = await ingestSemanticClipboardContext({
      sourceUrl: window.location.href,
      title: document.title || `${siteLabel} Conversation`,
      fullText: mergedText,
      maxTrackedTabs: featureSettings.modules.semanticClipboard.maxTrackedTabs,
    });
    if (!response.ok) {
      throw new Error(response.error || 'Semantic Clipboard ingest failed.');
    }
    await refreshSemanticStats();
    showDexToast({
      type: 'success',
      title: 'Context ingested',
      message: 'Semantic Clipboard updated its local context store.',
    });
  };

  const clearSemanticStore = async () => {
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_CLEAR, {});
    if (!response.ok) {
      throw new Error(response.error || 'Semantic Clipboard clear failed.');
    }
    await refreshSemanticStats();
    showDexToast({
      type: 'success',
      title: 'Semantic store cleared',
      message: 'DexEnhance removed the local semantic clipboard cache.',
    });
  };

  const reInjectUi = () => {
    const reinjected = injectApiBridge();
    adapter.startObservers();
    scheduleAdapterHealthCheck({ notify: true });
    showDexToast({
      type: reinjected ? 'info' : 'warning',
      title: reinjected ? 'Re-inject attempted' : 'Re-inject failed',
      message: reinjected ? 'DexEnhance requested a fresh bridge injection.' : 'Could not inject API bridge script.',
    });
  };

  const reloadAdapter = () => {
    adapter.startObservers();
    scheduleAdapterHealthCheck({ notify: true });
    showDexToast({
      type: 'info',
      title: 'Adapter reload requested',
      message: 'Adapter observers restarted and health check queued.',
    });
  };

  const buildCommands = () => [
    {
      id: 'open-overview',
      group: 'Navigate',
      title: 'Open Overview',
      subtitle: 'Hub summary, queue status, and current chat context',
      keywords: ['overview hub status'],
      shortcut: 'Cmd/Ctrl+1',
      action: () => openDrawer('overview'),
    },
    {
      id: 'open-prompts',
      group: 'Navigate',
      title: 'Open Prompt Library',
      subtitle: 'Saved prompts and prompt CRUD',
      keywords: ['prompt library templates prompts'],
      shortcut: 'Cmd/Ctrl+2',
      action: () => openDrawer('prompts', { promptSection: 'prompts' }),
    },
    {
      id: 'open-folders',
      group: 'Navigate',
      title: 'Open Chat Organization',
      subtitle: 'Folder tree and chat assignment',
      keywords: ['folders organize assign chat'],
      action: () => openDrawer('prompts', { promptSection: 'folders' }),
    },
    {
      id: 'open-queue',
      group: 'Navigate',
      title: 'Open Queue Manager',
      subtitle: 'Queued prompts, retries, and reordering',
      keywords: ['queue send retry reorder'],
      shortcut: 'Cmd/Ctrl+3',
      action: () => openDrawer('queue'),
    },
    {
      id: 'open-optimizer',
      group: 'Navigate',
      title: 'Open Prompt Optimizer',
      subtitle: 'Deterministic rewrite and AI refinement',
      keywords: ['optimizer refine rewrite'],
      shortcut: 'Cmd/Ctrl+4',
      action: () => openDrawer('optimizer'),
    },
    {
      id: 'open-context',
      group: 'Navigate',
      title: 'Open Semantic Clipboard',
      subtitle: 'Ingest, query, and inject local context',
      keywords: ['semantic clipboard context query'],
      shortcut: 'Cmd/Ctrl+5',
      action: () => openDrawer('context'),
    },
    {
      id: 'open-export',
      group: 'Navigate',
      title: 'Open Export',
      subtitle: 'PDF and DOCX output',
      keywords: ['export pdf docx'],
      shortcut: 'Cmd/Ctrl+6',
      action: () => openDrawer('export'),
    },
    {
      id: 'open-settings',
      group: 'Navigate',
      title: 'Open Settings',
      subtitle: 'Theme preset and shell layout',
      keywords: ['settings theme layout drawer launcher'],
      shortcut: 'Cmd/Ctrl+7',
      action: () => openDrawer('settings'),
    },
    {
      id: 'open-tour',
      group: 'Navigate',
      title: 'Start Quick Tour',
      subtitle: 'Walk through the visible DexEnhance features',
      keywords: ['tour onboarding help'],
      action: () => openTour(),
    },
    {
      id: 'inject-context',
      group: 'Actions',
      title: 'Inject Context',
      subtitle: 'Add Semantic Clipboard context to the composer',
      keywords: ['semantic clipboard context inject'],
      action: () => { void runSemanticClipboardInject(); closePalette(); },
    },
    {
      id: 'live-render',
      group: 'Actions',
      title: 'Live Render Code',
      subtitle: 'Open the latest canvas in a pop-out window',
      keywords: ['canvas render popout code'],
      action: () => { void runPopoutCanvasOpenLatest(); closePalette(); },
    },
    {
      id: 'copy-diagnostics',
      group: 'Diagnostics',
      title: 'Copy Diagnostics',
      subtitle: 'Copy adapter, worker, queue, and token state',
      keywords: ['diagnostics copy status health'],
      action: () => { void copyStatusDiagnostics(); closePalette(); },
    },
    {
      id: 'reinject-ui',
      group: 'Diagnostics',
      title: 'Re-inject UI',
      subtitle: 'Attempt a fresh host bridge injection',
      keywords: ['reinject ui bridge'],
      action: () => { reInjectUi(); closePalette(); },
    },
    {
      id: 'reload-adapter',
      group: 'Diagnostics',
      title: 'Reload Adapter',
      subtitle: 'Restart observers and re-check host selectors',
      keywords: ['reload adapter observers'],
      action: () => { reloadAdapter(); closePalette(); },
    },
    {
      id: 'close-drawer',
      group: 'Navigate',
      title: 'Close Drawer',
      subtitle: 'Hide the active drawer view',
      keywords: ['close drawer hide panel'],
      action: () => closeDrawer(),
    },
  ];

  const currentBanner = () => {
    if (adapterHealthState.settled && adapterHealthState.healthy === false) {
      return {
        type: 'error',
        title: 'Host adapter attention required',
        message: adapterHealthState.reason || 'DexEnhance could not find required host selectors.',
        actions: [
          { label: 'Copy diagnostics', onSelect: () => void copyStatusDiagnostics() },
          { label: 'Re-inject UI', onSelect: reInjectUi },
          { label: 'Reload adapter', onSelect: reloadAdapter },
        ],
      };
    }
    if (workerHealthState.lastError) {
      return {
        type: 'warning',
        title: 'Service worker connection issue',
        message: workerHealthState.lastError,
        actions: [{ label: 'Copy diagnostics', onSelect: () => void copyStatusDiagnostics() }],
      };
    }
    return null;
  };

  const activeDrawerTitle = () => {
    switch (activeDrawerView) {
      case 'overview': return 'Overview';
      case 'queue': return 'Queue Manager';
      case 'optimizer': return 'Prompt Optimizer';
      case 'context': return 'Semantic Clipboard';
      case 'export': return 'Export Conversation';
      case 'settings': return 'DexEnhance Settings';
      case 'prompts':
      default:
        return promptWorkspaceSection === 'folders' ? 'Chat Organization' : 'Prompt Library';
    }
  };

  const renderDrawerBody = () => {
    if (activeDrawerView === 'overview') {
      return h(StatusPanel, {
        hostLabel: siteLabel,
        adapterHealth: adapterHealthState,
        workerHealth: workerHealthState,
        queueState: queueRuntimeState,
        tokenState: {
          model: tokenModel,
          count: tokenCount,
          source: tokenSource,
          updatedAt: tokenUpdatedAt,
        },
        featureSettings,
        onCopyDiagnostics: copyStatusDiagnostics,
        onReinjectUi: reInjectUi,
        onReloadAdapter: reloadAdapter,
      });
    }
    if (activeDrawerView === 'queue') {
      return h(QueueManager, { queueController, siteLabel });
    }
    if (activeDrawerView === 'optimizer') {
      return h(PromptOptimizerModal, {
        visible: true,
        site: siteLabel,
        initialPrompt: readCurrentComposerText(adapter),
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
      });
    }
    if (activeDrawerView === 'export') {
      return h(ExportDialog, { visible: true, onExport: handleExport });
    }
    if (activeDrawerView === 'context') {
      return h(SemanticClipboardPanel, {
        visible: true,
        onIngestCurrentContext: ingestCurrentContext,
        onInsertPreamble: (text) => {
          const applied = prependPreambleToComposer(adapter, text, readCurrentComposerText(adapter));
          if (!applied) {
            toastFailure({
              operation: 'semantic_clipboard.insert',
              title: 'Could not insert Semantic Clipboard preamble',
              error: new Error('No composer textarea detected'),
            });
          }
        },
        onClearRequested: clearSemanticStore,
      });
    }
    if (activeDrawerView === 'settings') {
      return h(HUDSettingsPanel, {
        visible: true,
        themePreset: hudSettings.themePreset,
        onThemePresetChange: (themePreset) => setHudSettings(updateThemeInSettings(hudSettings, { themePreset }, getViewport())),
        accentHue: hudSettings.accentHue,
        onAccentHueChange: (accentHue) => setHudSettings(updateThemeInSettings(hudSettings, { accentHue }, getViewport())),
        transparency: hudSettings.transparency,
        onTransparencyChange: (transparency) => setHudSettings(updateThemeInSettings(hudSettings, { transparency }, getViewport())),
        launcherSize: panelState('launcher').width,
        onLauncherSizeChange: (size) => setPanel('launcher', { ...panelState('launcher'), width: size, height: size }),
        fabBehavior: hudSettings.fab?.behavior || 'quick_actions',
        onFabBehaviorChange: (behavior) => setHudSettings(updateThemeInSettings(hudSettings, { fab: { ...hudSettings.fab, behavior } }, getViewport())),
        drawerWidth: hudSettings.drawer.width,
        onDrawerWidthChange: (width) => setPanel('drawer', { ...panelState('drawer'), width }),
        tokenOverlayEnabled: featureSettings.modules.tokenOverlay?.enabled === true,
        tokenOverlayMode: hudSettings.tokenOverlay?.mode || 'compact',
        onToggleTokenOverlay: async (enabled) => {
          const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_UPDATE_MODULE, {
            moduleId: 'tokenOverlay',
            patch: { enabled },
          });
          if (response.ok) {
            featureSettings = normalizeFeatureSettings(response.data);
            renderUI();
          }
        },
        onTokenOverlayModeChange: (mode) => setHudSettings(updateThemeInSettings(hudSettings, { tokenOverlay: { ...hudSettings.tokenOverlay, mode } }, getViewport())),
        featureToggles: [
          { id: 'semanticClipboard', label: 'Semantic Clipboard', enabled: featureSettings.modules.semanticClipboard?.enabled === true },
          { id: 'popoutCanvas', label: 'Code Canvas', enabled: featureSettings.modules.popoutCanvas?.enabled === true },
          { id: 'tokenOverlay', label: 'Token Overlay', enabled: featureSettings.modules.tokenOverlay?.enabled === true },
        ],
        onToggleFeature: async (moduleId, enabled) => {
          const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_UPDATE_MODULE, {
            moduleId,
            patch: { enabled },
          });
          if (response.ok) {
            featureSettings = normalizeFeatureSettings(response.data);
            renderUI();
          }
        },
        onRecoverWindows: () => setHudSettings({
          ...hudSettings,
          panels: {
            ...hudSettings.panels,
            quickHub: defaultPanelState('quickHub', getViewport()),
            launcher: defaultPanelState('launcher', getViewport()),
            tour: defaultPanelState('tour', getViewport()),
          },
        }),
        onResetLayout: () => setHudSettings({
          ...hudSettings,
          panels: {
            welcome: defaultPanelState('welcome', getViewport()),
            launcher: defaultPanelState('launcher', getViewport()),
            quickHub: defaultPanelState('quickHub', getViewport()),
            tour: defaultPanelState('tour', getViewport()),
            drawer: defaultPanelState('drawer', getViewport()),
          },
          drawer: {
            ...hudSettings.drawer,
            width: defaultPanelState('drawer', getViewport()).width,
          },
        }),
        onResetTheme: () => setHudSettings(updateThemeInSettings(hudSettings, {
          themePreset: DEFAULT_HUD_SETTINGS.themePreset,
          accentHue: DEFAULT_HUD_SETTINGS.accentHue,
          transparency: DEFAULT_HUD_SETTINGS.transparency,
          tokenOverlay: DEFAULT_HUD_SETTINGS.tokenOverlay,
          fab: DEFAULT_HUD_SETTINGS.fab,
        }, getViewport())),
        onRelaunchOnboarding: async () => {
          await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: ONBOARDING_SEEN_KEY });
          welcomeVisible = true;
          welcomeZipping = false;
          setQuickHubVisibility(false);
          setLauncherVisibility(false);
          renderUI();
        },
        onRelaunchTour: async () => {
          await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_REMOVE, { keys: TOUR_SEEN_KEY });
          openTour();
        },
      });
    }
    return h(PromptLibrary, {
      visible: true,
      currentChatUrl: window.location.href,
      initialSection: promptWorkspaceSection,
      onClose: closeDrawer,
      onInsert: (text) => {
        const inserted = insertTextThroughAdapter(adapter, text);
        if (!inserted) {
          toastFailure({
            operation: 'prompt_library.insert',
            title: 'Prompt insertion failed',
            error: new Error('No composer textarea detected'),
          });
          return;
        }
        closeDrawer();
      },
      onQueue: (text) => {
        queuePromptText(text, 'prompt_library');
      },
      onSend: (text) => {
        sendPromptText(text);
      },
      currentFolderLabel: currentFolderState.folderName,
    });
  };

  const renderUI = () => {
    render(h('div', null, [
      h(WelcomeHandoffModal, {
        key: 'welcome',
        visible: welcomeVisible,
        zipping: welcomeZipping,
        iconUrl: welcomeIconUrl,
        panelState: panelState('welcome'),
        zipTarget: {
          x: panelState('launcher').x,
          y: panelState('launcher').y,
          size: panelState('launcher').width,
        },
        onPanelStateCommit: (next) => setPanel('welcome', next),
        onGetStarted: handleWelcomeGetStarted,
        onZipTransitionEnd: () => {
          if (welcomeZipping) void finalizeWelcomeHandoff();
        },
      }),
      !welcomeVisible && hudSettings.visibility.launcher !== false
        ? h(DexLauncher, {
            key: 'launcher',
            site: siteLabel,
            iconUrl,
            panelState: panelState('launcher'),
            queueSize: queueSizeState,
            expanded: launcherExpanded,
            fabBehavior: hudSettings.fab?.behavior || 'quick_actions',
            onToggleExpanded: () => {
              launcherExpanded = !launcherExpanded;
              renderUI();
            },
            onOpenHub: openQuickHub,
            onOpenPalette: openPalette,
            onOpenLastView: openLastDrawerView,
            quickActions: [
              { id: 'prompts', label: 'Prompts', onClick: () => openDrawer('prompts', { promptSection: 'prompts' }) },
              { id: 'queue', label: 'Queue', onClick: () => openDrawer('queue') },
              { id: 'optimizer', label: 'Optimize', onClick: () => openDrawer('optimizer') },
              { id: 'context', label: 'Context', onClick: () => openDrawer('context') },
              { id: 'export', label: 'Export', onClick: () => openDrawer('export') },
              { id: 'canvas', label: 'Canvas', onClick: () => { void runPopoutCanvasOpenLatest(); } },
              { id: 'tour', label: 'Tour', onClick: openTour },
            ],
          })
        : null,
      !welcomeVisible
        ? h(QuickHubWindow, {
            key: 'quick-hub',
            visible: hudSettings.visibility.quickHub === true,
            panelState: panelState('quickHub'),
            collapsed: quickHubCollapsed,
            pinned: quickHubPinned,
            siteLabel,
            promptCount: promptCountState,
            queueCount: queueRuntimeState?.items?.length || 0,
            queueState: queueRuntimeState?.currentSendingId ? 'sending' : queueRuntimeState?.paused ? 'paused' : queueRuntimeState?.lastError ? 'error' : 'idle',
            semanticCount: semanticStatsState?.chunkCount || 0,
            currentFolderLabel: currentFolderState.folderName || 'Unassigned',
            tokenLabel: tokenCount != null ? `${tokenCount} tokens` : '',
            onPanelStateCommit: (next) => setPanel('quickHub', next),
            onToggleCollapse: () => {
              quickHubCollapsed = !quickHubCollapsed;
              renderUI();
            },
            onTogglePin: () => {
              quickHubPinned = !quickHubPinned;
              renderUI();
            },
            onClose: closeQuickHub,
            onOpenView: openSurface,
            onQueueSendNext: () => queueController?.sendNow(),
            onQueueClear: () => queueController?.clearAll(),
            onOpenCanvas: () => { void runPopoutCanvasOpenLatest(); },
            onOpenTour: openTour,
          })
        : null,
      !welcomeVisible
        ? h(FeatureTour, {
            key: 'feature-tour',
            visible: hudSettings.visibility.tour === true,
            panelState: panelState('tour'),
            collapsed: tourCollapsed,
            pinned: tourPinned,
            onPanelStateCommit: (next) => setPanel('tour', next),
            onToggleCollapse: () => {
              tourCollapsed = !tourCollapsed;
              renderUI();
            },
            onTogglePin: () => {
              tourPinned = !tourPinned;
              renderUI();
            },
            onClose: closeTour,
            onComplete: () => { void completeTour(); },
            onOpenView: openSurface,
          })
        : null,
      h(CommandPalette, {
        key: 'command-palette',
        open: paletteOpen,
        hostLabel: siteLabel,
        commands: buildCommands(),
        onClose: closePalette,
        onExecute: (command) => command?.action?.(),
      }),
      h(DexDrawer, {
        key: 'drawer',
        open: drawerOpen,
        title: activeDrawerTitle(),
        hostLabel: siteLabel,
        activeView: activeDrawerView,
        viewTabs: DRAWER_TABS,
        width: hudSettings.drawer.width,
        banner: currentBanner(),
        onClose: closeDrawer,
        onSelectView: (viewId) => openDrawer(viewId),
        onWidthChange: (width) => setPanel('drawer', { ...panelState('drawer'), width }),
        statusBar: h(DrawerStatusBar, {
          hostLabel: siteLabel,
          queueCount: queueRuntimeState?.items?.length || 0,
          queuePaused: queueRuntimeState?.paused === true,
          currentSendingId: queueRuntimeState?.currentSendingId || '',
          tokenCount,
          tokenModel,
          tokenSource,
          tokenUpdatedAt,
          adapterHealthy: adapterHealthState.healthy !== false,
          workerHealthy: !workerHealthState.lastError,
        }),
      }, renderDrawerBody()),
      !welcomeVisible
        ? h('aside', { class: 'dex-current-chat-chip', role: 'status', 'aria-live': 'polite' }, [
            h('strong', null, 'Current chat'),
            h('span', null, currentFolderState.folderName || 'Unassigned'),
            h('div', { class: 'dex-folder-actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => openDrawer('prompts', { promptSection: 'folders' }) }, currentFolderState.folderName ? 'Change' : 'Assign'),
              currentFolderState.folderId
                ? h('button', {
                    type: 'button',
                    class: 'dex-link-btn danger',
                    onClick: async () => {
                      const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FOLDER_UNASSIGN_CHAT, { chatUrl: window.location.href });
                      if (response.ok) {
                        await refreshCurrentFolderState();
                      }
                    },
                  }, 'Unassign')
                : null,
            ]),
          ])
        : null,
      h(TokenOverlay, {
        key: 'token-overlay',
        visible: !welcomeVisible && featureSettings.modules.tokenOverlay?.enabled === true && hudSettings.tokenOverlay?.enabled !== false,
        model: tokenModel || '',
        tokens: tokenCount,
        source: tokenSource || '',
        updatedAt: tokenUpdatedAt || 0,
        mode: hudSettings.tokenOverlay?.mode || 'compact',
        hasData: Boolean(tokenModel || tokenCount != null),
        onToggleMode: (mode) => setHudSettings(updateThemeInSettings(hudSettings, { tokenOverlay: { ...hudSettings.tokenOverlay, mode } }, getViewport())),
      }),
      h(DexToastViewport, { key: 'dex-toast-viewport' }),
    ]), ui.mountPoint);
  };

  const onGlobalKeydown = (event) => {
    const metaCombo = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
    if (metaCombo && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      paletteOpen ? closePalette() : openPalette();
      return;
    }

    if (metaCombo && /^[1-7]$/.test(event.key)) {
      event.preventDefault();
      const index = Number(event.key) - 1;
      const tab = DRAWER_TABS[index];
      if (tab) openDrawer(tab.id);
      return;
    }

    if (event.key === 'Escape') {
      if (paletteOpen) {
        event.preventDefault();
        closePalette();
        return;
      }
      if (drawerOpen && !isEditableElement(document.activeElement)) {
        event.preventDefault();
        closeDrawer();
      }
    }
  };

  document.addEventListener('keydown', onGlobalKeydown, true);

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
      setLauncherVisibility(true);
      openQuickHub();
      return false;
    }
    if (message?.action === MESSAGE_ACTIONS.UI_OPEN_SURFACE) {
      setLauncherVisibility(true);
      openSurface(message.payload?.surface, message.payload?.options || {});
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
  activeDrawerView = hudSettings.drawer?.lastView || 'prompts';
  featureSettings = await fetchFeatureSettings();

  const onboardingState = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: ONBOARDING_SEEN_KEY });
  const hasSeenOnboarding = onboardingState.ok && onboardingState.data === ONBOARDING_VERSION;
  const tourState = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: TOUR_SEEN_KEY });
  const hasSeenTour = tourState.ok && tourState.data === TOUR_VERSION;
  welcomeVisible = !hasSeenOnboarding;
  welcomeZipping = false;
  if (!hasSeenOnboarding) {
    hudSettings = updatePanelVisibilityInSettings(hudSettings, 'launcher', false, getViewport());
  }
  if (!hasSeenTour) {
    hudSettings = updatePanelVisibilityInSettings(hudSettings, 'tour', true, getViewport());
  }
  applyThemePreset();

  watchFeatureSettings((nextSettings) => {
    featureSettings = nextSettings;
    renderUI();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[HUD_SETTINGS_KEY]) return;
    hudSettings = normalizeHudSettings(changes[HUD_SETTINGS_KEY].newValue, getViewport());
    applyThemePreset();
    renderUI();
  });

  window.addEventListener('resize', () => {
    hudSettings = normalizeHudSettings(hudSettings, getViewport());
    applyThemePreset();
    scheduleAdapterHealthCheck({ notify: false });
    renderUI();
  });

  queueController = setupQueueController({
    adapter,
    siteLabel,
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
        details: `Operation: ${queueError.operation}\nItem: ${queueError.itemId || 'n/a'}`,
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
  void Promise.all([
    refreshPromptCount(),
    refreshSemanticStats(),
    refreshCurrentFolderState(),
  ]);
  adapter.onChatChanged(() => {
    void refreshCurrentFolderState();
  });

  scheduleAdapterHealthCheck({ notify: false });
  void pingServiceWorker({ notifyOnFailure: false });
  window.setInterval(() => {
    void pingServiceWorker({ notifyOnFailure: false });
    scheduleAdapterHealthCheck({ notify: false });
  }, 45000);

  renderUI();
}
