import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { PanelFrame } from './PanelFrame.jsx';
import { ContextualHint } from './ContextualHint.jsx';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';

const SETTINGS_KEY = 'optimizerSettings';
const DEFAULT_SETTINGS = Object.freeze({
  aiRefinementEnabled: false,
  refinementMode: 'same_tab',
});

function normalizeSettings(value) {
  const source = typeof value === 'object' && value !== null ? value : {};
  const refinementMode = source.refinementMode === 'hidden_tab' ? 'hidden_tab' : 'same_tab';
  return {
    aiRefinementEnabled: source.aiRefinementEnabled === true,
    refinementMode,
  };
}

export function PromptOptimizerModal({
  visible,
  iconUrl = '',
  site = '',
  initialPrompt = '',
  onClose,
  onOptimize,
  onApply,
  windowState,
  defaultWindowState,
  onWindowStateChange,
}) {
  const [sourcePrompt, setSourcePrompt] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [methodUsed, setMethodUsed] = useState('local_only');
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSourcePrompt(initialPrompt || '');
    setError('');
    setWarning('');
    setLocalPrompt('');
    setFinalPrompt('');
    setMethodUsed('local_only');
    setCopiedId('');

    void (async () => {
      const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key: SETTINGS_KEY });
      if (!response.ok) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }
      setSettings(normalizeSettings(response.data));
    })();
  }, [visible, initialPrompt]);

  async function persistSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
    setSettings(normalized);

    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        [SETTINGS_KEY]: normalized,
      },
    });
    if (!response.ok) {
      showDexToast({
        type: 'error',
        title: 'Optimizer settings not saved',
        message: response.error || 'Storage write failed.',
        diagnostics: buildDiagnostics({
          module: 'ui/PromptOptimizerModal',
          operation: 'optimizer_settings.persist',
          host: window.location.hostname,
          url: window.location.href,
          error: new Error(response.error || 'Storage write failed'),
        }),
      });
    }
  }

  async function runOptimization() {
    if (busy) return;
    setBusy(true);
    setError('');
    setWarning('');

    try {
      const result = await onOptimize?.({
        sourcePrompt,
        aiRefinementEnabled: settings.aiRefinementEnabled,
        refinementMode: settings.refinementMode,
      });

      const local = result?.localPrompt || '';
      const final = result?.finalPrompt || local;

      setLocalPrompt(local);
      setFinalPrompt(final);
      setWarning(result?.warning || '');
      setMethodUsed(result?.methodUsed || 'local_only');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      showDexToast({
        type: 'error',
        title: 'Prompt optimization failed',
        message: err instanceof Error ? err.message : String(err),
        diagnostics: buildDiagnostics({
          module: 'ui/PromptOptimizerModal',
          operation: 'optimizer.run',
          host: window.location.hostname,
          url: window.location.href,
          error: err,
        }),
      });
    } finally {
      setBusy(false);
    }
  }

  function applyPrompt() {
    const value = finalPrompt || localPrompt;
    if (!value) return;
    onApply?.(value);
    onClose?.();
  }

  function copyToClipboard(id, text) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 1800);
    });
  }

  if (!visible) return null;

  const hasResult = !!(localPrompt || finalPrompt);

  return h(
    PanelFrame,
    {
      panelId: 'optimizer',
      title: `Hybrid Prompt Optimizer • ${site}`,
      iconUrl,
      panelState: windowState,
      defaultState: defaultWindowState,
      onPanelStateChange: onWindowStateChange,
      onClose,
      minWidth: 460,
      minHeight: 280,
      zIndex: 2147483647,
      showPin: true,
      showClose: true,
      allowResize: true,
    },
    [
      h('div', { class: 'dex-form' }, [
        h(ContextualHint, {
          hintId: 'prompt-optimizer',
          visible: true,
          title: 'Optimizer hint',
          message: 'Start with local optimization first. Enable AI refinement only when you need model-specific wording.',
        }),
        h('label', { class: 'dex-sidebar__label' }, 'Source Prompt'),
        h('textarea', {
          class: 'dex-textarea',
          rows: 5,
          value: sourcePrompt,
          placeholder: 'Enter or paste the prompt to optimize',
          onInput: (event) => setSourcePrompt(event.currentTarget.value),
        }),

        h('label', { class: 'dex-optimizer__toggle' }, [
          h('input', {
            type: 'checkbox',
            checked: settings.aiRefinementEnabled,
            onChange: (event) => {
              void persistSettings({
                ...settings,
                aiRefinementEnabled: event.currentTarget.checked,
              });
            },
          }),
          h('span', null, 'Enable AI refinement (optional)'),
        ]),

        settings.aiRefinementEnabled
          ? h('div', { class: 'dex-form' }, [
              h('label', { class: 'dex-sidebar__label' }, 'AI refinement mode'),
              h(
                'select',
                {
                  class: 'dex-input',
                  value: settings.refinementMode,
                  onChange: (event) => {
                    void persistSettings({
                      ...settings,
                      refinementMode: event.currentTarget.value === 'hidden_tab' ? 'hidden_tab' : 'same_tab',
                    });
                  },
                },
                [
                  h('option', { value: 'same_tab' }, 'Same Tab (Default)'),
                  h('option', { value: 'hidden_tab' }, 'Hidden Tab (Advanced)'),
                ]
              ),
              h(
                'p',
                { class: 'dex-form__hint' },
                settings.refinementMode === 'same_tab'
                  ? 'Same-tab mode is simpler and faster, but the optimization request appears in your current thread.'
                  : 'Hidden-tab mode isolates context and closes automatically, but is more brittle and may fail if UI changes.'
              ),
            ])
          : h('p', { class: 'dex-form__hint' }, 'Local deterministic rewrite only. No AI call is made.'),

        h('div', { class: 'dex-form__actions' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'dex-link-btn dex-link-btn--accent',
              disabled: busy,
              onClick: runOptimization,
            },
            busy ? 'Optimizing...' : 'Run Hybrid Optimize'
          ),
          h(
            'button',
            {
              type: 'button',
              class: `dex-link-btn${hasResult ? ' dex-link-btn--accent' : ''}`,
              disabled: !hasResult,
              onClick: applyPrompt,
            },
            'Use Optimized Prompt'
          ),
        ]),

        error ? h('p', { class: 'dex-form__error' }, error) : null,
        warning ? h('p', { class: 'dex-form__warning' }, warning) : null,

        localPrompt
          ? h('div', { class: 'dex-optimizer__result' }, [
              h('div', { class: 'dex-optimizer__result-head' }, [
                h('strong', null, 'Deterministic Rewrite'),
                h('button', {
                  type: 'button',
                  class: 'dex-link-btn dex-optimizer__copy-btn',
                  onClick: () => copyToClipboard('local', localPrompt),
                }, copiedId === 'local' ? 'Copied!' : 'Copy'),
              ]),
              h('pre', { class: 'dex-optimizer__pre' }, localPrompt),
            ])
          : null,

        finalPrompt
          ? h('div', { class: 'dex-optimizer__result' }, [
              h('div', { class: 'dex-optimizer__result-head' }, [
                h('strong', null, `Final Output (${methodUsed})`),
                h('button', {
                  type: 'button',
                  class: 'dex-link-btn dex-optimizer__copy-btn',
                  onClick: () => copyToClipboard('final', finalPrompt),
                }, copiedId === 'final' ? 'Copied!' : 'Copy'),
              ]),
              h('pre', { class: 'dex-optimizer__pre' }, finalPrompt),
            ])
          : null,
      ]),
    ]
  );
}
