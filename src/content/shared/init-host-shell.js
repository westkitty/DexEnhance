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

const ONBOARDING_SEEN_KEY = 'onboardingSeenVersion';
const ONBOARDING_VERSION = '2026-03-06-shell-v1';
const DRAWER_TABS = [
  { id: 'prompts', label: 'Prompts' },
  { id: 'queue', label: 'Queue' },
  { id: 'optimizer', label: 'Optimize' },
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
  let welcomeVisible = false;
  let welcomeZipping = false;
  let welcomeZipFallbackTimer = null;
  let paletteOpen = false;
  let drawerOpen = false;
  let activeDrawerView = 'prompts';
  let promptWorkspaceSection = 'prompts';
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

  const openDrawer = (view, options = {}) => {
    if (view === 'prompts') {
      promptWorkspaceSection = options.promptSection === 'folders' ? 'folders' : 'prompts';
    }
    activeDrawerView = DRAWER_TABS.some((tab) => tab.id === view) ? view : 'prompts';
    paletteOpen = false;
    drawerOpen = true;
    setHudSettings({
      ...hudSettings,
      drawer: {
        ...hudSettings.drawer,
        lastView: activeDrawerView,
      },
    });
  };

  const openLastDrawerView = () => {
    openDrawer(hudSettings.drawer?.lastView || activeDrawerView || 'prompts');
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
    await markOnboardingSeen();
    openPalette();
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
      });
    }, 900);
  };

  adapter.onNewChat(() => {
    void popoutCanvasController.maybeAutoOpenFromLatestTurn();
    scheduleSemanticClipboardIngest();
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
      id: 'open-prompts',
      group: 'Navigate',
      title: 'Open Prompt Library',
      subtitle: 'Saved prompts and prompt CRUD',
      keywords: ['prompt library templates prompts'],
      shortcut: 'Cmd/Ctrl+1',
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
      shortcut: 'Cmd/Ctrl+2',
      action: () => openDrawer('queue'),
    },
    {
      id: 'open-optimizer',
      group: 'Navigate',
      title: 'Open Prompt Optimizer',
      subtitle: 'Deterministic rewrite and AI refinement',
      keywords: ['optimizer refine rewrite'],
      shortcut: 'Cmd/Ctrl+3',
      action: () => openDrawer('optimizer'),
    },
    {
      id: 'open-export',
      group: 'Navigate',
      title: 'Open Export',
      subtitle: 'PDF and DOCX output',
      keywords: ['export pdf docx'],
      shortcut: 'Cmd/Ctrl+4',
      action: () => openDrawer('export'),
    },
    {
      id: 'open-settings',
      group: 'Navigate',
      title: 'Open Settings',
      subtitle: 'Theme preset and shell layout',
      keywords: ['settings theme layout drawer launcher'],
      shortcut: 'Cmd/Ctrl+5',
      action: () => openDrawer('settings'),
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
      case 'queue': return 'Queue Manager';
      case 'optimizer': return 'Prompt Optimizer';
      case 'export': return 'Export Conversation';
      case 'settings': return 'DexEnhance Settings';
      case 'prompts':
      default:
        return promptWorkspaceSection === 'folders' ? 'Chat Organization' : 'Prompt Library';
    }
  };

  const renderDrawerBody = () => {
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
    if (activeDrawerView === 'settings') {
      return h(HUDSettingsPanel, {
        visible: true,
        themePreset: hudSettings.themePreset,
        onThemePresetChange: (themePreset) => setHudSettings(updateThemeInSettings(hudSettings, { themePreset }, getViewport())),
        launcherSize: panelState('launcher').width,
        onLauncherSizeChange: (size) => setPanel('launcher', { ...panelState('launcher'), width: size, height: size }),
        drawerWidth: hudSettings.drawer.width,
        onDrawerWidthChange: (width) => setPanel('drawer', { ...panelState('drawer'), width }),
        onResetLayout: () => setHudSettings({
          ...hudSettings,
          panels: {
            welcome: defaultPanelState('welcome', getViewport()),
            launcher: defaultPanelState('launcher', getViewport()),
            drawer: defaultPanelState('drawer', getViewport()),
          },
          drawer: {
            ...hudSettings.drawer,
            width: defaultPanelState('drawer', getViewport()).width,
          },
        }),
        onResetTheme: () => setHudSettings(updateThemeInSettings(hudSettings, { themePreset: DEFAULT_HUD_SETTINGS.themePreset }, getViewport())),
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
            onOpenPalette: openPalette,
            onOpenLastView: openLastDrawerView,
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
          tokenCount,
          tokenSource,
          tokenUpdatedAt,
          adapterHealthy: adapterHealthState.healthy !== false,
          workerHealthy: !workerHealthState.lastError,
        }),
      }, renderDrawerBody()),
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

    if (metaCombo && /^[1-5]$/.test(event.key)) {
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
      drawerOpen = false;
      openPalette();
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
  welcomeVisible = !hasSeenOnboarding;
  welcomeZipping = false;
  if (!hasSeenOnboarding) {
    hudSettings = updatePanelVisibilityInSettings(hudSettings, 'launcher', false, getViewport());
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

  scheduleAdapterHealthCheck({ notify: false });
  void pingServiceWorker({ notifyOnFailure: false });
  window.setInterval(() => {
    void pingServiceWorker({ notifyOnFailure: false });
    scheduleAdapterHealthCheck({ notify: false });
  }, 45000);

  renderUI();
}
