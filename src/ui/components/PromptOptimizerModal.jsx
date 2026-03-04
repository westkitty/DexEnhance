import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

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
}) {
  const [sourcePrompt, setSourcePrompt] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [methodUsed, setMethodUsed] = useState('local_only');

  useEffect(() => {
    if (!visible) return;
    setSourcePrompt(initialPrompt || '');
    setError('');
    setWarning('');
    setLocalPrompt('');
    setFinalPrompt('');
    setMethodUsed('local_only');

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
      console.warn('[DexEnhance] Failed to persist optimizer settings:', response.error);
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

  if (!visible) return null;

  return h('div', { class: 'dex-modal-overlay' }, [
    h('section', {
      class: 'dex-modal dex-optimizer',
      'aria-label': 'Hybrid Prompt Optimizer',
      style: iconUrl ? `--dex-watermark-url:url("${iconUrl}")` : undefined,
    }, [
      h('header', { class: 'dex-modal__header' }, [
        h('div', { class: 'dex-modal__brand' }, [
          iconUrl
            ? h('img', {
                src: iconUrl,
                alt: 'DexEnhance logo',
                class: 'dex-modal__logo',
              })
            : null,
          h('div', null, [
            h('h3', { class: 'dex-modal__title' }, 'Hybrid Prompt Optimizer'),
            h('div', { class: 'dex-tour__eyebrow' }, `Local first • ${site}`),
          ]),
        ]),
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onClose?.() }, 'Close'),
      ]),

      h('div', { class: 'dex-form' }, [
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
                { class: 'dex-folder-state' },
                settings.refinementMode === 'same_tab'
                  ? 'Same-tab mode is simpler and faster, but the optimization request appears in your current thread.'
                  : 'Hidden-tab mode isolates context and closes automatically, but is more brittle and may fail if UI changes.'
              ),
            ])
          : h('p', { class: 'dex-folder-state' }, 'Local deterministic rewrite only. No AI call is made.'),

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
              class: 'dex-link-btn',
              disabled: !(finalPrompt || localPrompt),
              onClick: applyPrompt,
            },
            'Use Optimized Prompt'
          ),
        ]),

        error ? h('div', { class: 'dex-folder-state error' }, error) : null,
        warning ? h('div', { class: 'dex-folder-state' }, warning) : null,

        localPrompt
          ? h('div', { class: 'dex-optimizer__result' }, [
              h('strong', null, 'Deterministic Rewrite'),
              h('pre', { class: 'dex-optimizer__pre' }, localPrompt),
            ])
          : null,

        finalPrompt
          ? h('div', { class: 'dex-optimizer__result' }, [
              h('strong', null, `Final Output (${methodUsed})`),
              h('pre', { class: 'dex-optimizer__pre' }, finalPrompt),
            ])
          : null,
      ]),
    ]),
  ]);
}
