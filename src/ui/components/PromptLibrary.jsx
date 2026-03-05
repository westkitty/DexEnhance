import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { PanelFrame } from './PanelFrame.jsx';
import { DexDialog } from './DexDialog.jsx';
import { ContextualHint } from './ContextualHint.jsx';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';

async function callAction(action, payload = {}) {
  const response = await sendRuntimeMessage(action, payload);
  if (!response.ok) throw new Error(response.error || action);
  return response.data;
}

function normalizeTags(input) {
  if (typeof input !== 'string') return [];
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

/** Collect variable values via inline form — no window.prompt */
function VariableForm({ prompt, onInsert, onCancel }) {
  const vars = Array.isArray(prompt.variables) ? prompt.variables : [];
  const [values, setValues] = useState(() =>
    Object.fromEntries(vars.map((v) => [v, '']))
  );

  function handleInsert() {
    let text = prompt.body;
    for (const key of vars) {
      const val = values[key] || '';
      const pattern = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      text = text.replace(pattern, val);
    }
    onInsert(text);
  }

  return h('div', { class: 'dex-var-form' }, [
    h('p', { class: 'dex-var-form__title' }, `Insert: "${prompt.title}"`),
    h('p', { class: 'dex-folder-state' }, 'Fill in the variables below, then click Insert.'),
    h('div', { class: 'dex-form' },
      vars.map((varName) =>
        h('div', { key: varName }, [
          h('label', { class: 'dex-sidebar__label' }, varName),
          h('input', {
            class: 'dex-input',
            placeholder: `Value for ${varName}`,
            value: values[varName] || '',
            onInput: (e) => setValues((prev) => ({ ...prev, [varName]: e.currentTarget.value })),
          }),
        ])
      )
    ),
    h('div', { class: 'dex-form__actions' }, [
      h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: handleInsert }, 'Insert'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: onCancel }, 'Cancel'),
    ]),
  ]);
}

export function PromptLibrary({
  visible,
  onClose,
  onInsert,
  iconUrl = '',
  windowState,
  defaultWindowState,
  onWindowStateChange,
}) {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [varFormPrompt, setVarFormPrompt] = useState(null); // prompt object | null
  const pendingDeletesRef = useRef(new Map());

  const notifyError = (operation, err) => {
    showDexToast({
      type: 'error',
      title: 'Prompt Library error',
      message: err instanceof Error ? err.message : String(err),
      diagnostics: buildDiagnostics({
        module: 'ui/PromptLibrary',
        operation,
        host: window.location.hostname,
        url: window.location.href,
        error: err,
      }),
    });
  };

  useEffect(() => {
    return () => {
      for (const pending of pendingDeletesRef.current.values()) {
        window.clearTimeout(pending.timerId);
      }
      pendingDeletesRef.current.clear();
    };
  }, []);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await callAction(MESSAGE_ACTIONS.PROMPT_LIST);
      setPrompts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('prompt_list.refresh', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) void refresh();
  }, [visible]);

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
      const tierMatch = tierFilter === 'all' || tags.includes(tierFilter);
      if (!tierMatch) return false;
      if (!q) return true;
      const haystack = `${prompt.title} ${prompt.body} ${(prompt.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [prompts, search, tierFilter]);

  const tierCounts = useMemo(() => {
    const counts = { all: prompts.length, common: 0, advanced: 0, epic: 0 };
    for (const prompt of prompts) {
      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
      if (tags.includes('common')) counts.common += 1;
      if (tags.includes('advanced')) counts.advanced += 1;
      if (tags.includes('epic')) counts.epic += 1;
    }
    return counts;
  }, [prompts]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setTagsText('');
    setShowForm(false);
  }

  async function submitPrompt(event) {
    event.preventDefault();
    const prompt = { title: title.trim(), body, tags: normalizeTags(tagsText) };
    try {
      if (editingId) {
        await callAction(MESSAGE_ACTIONS.PROMPT_UPDATE, { prompt: { id: editingId, ...prompt } });
      } else {
        await callAction(MESSAGE_ACTIONS.PROMPT_CREATE, { prompt });
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError(editingId ? 'prompt_update' : 'prompt_create', err);
    }
  }

  function schedulePromptDelete(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    setConfirmDeleteId(null);
    setPrompts((current) => current.filter((item) => item.id !== id));

    const timerId = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(id);
      try {
        const response = await sendRuntimeMessage(MESSAGE_ACTIONS.PROMPT_DELETE, { id });
        if (!response.ok) {
          throw new Error(response.error || 'Delete request failed');
        }
      } catch (err) {
        setPrompts((current) => [prompt, ...current].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        setError(err instanceof Error ? err.message : String(err));
        notifyError('prompt_delete.commit', err);
        showDexToast({
          type: 'error',
          title: 'Delete rolled back',
          message: 'Prompt deletion failed and was restored.',
          diagnostics: buildDiagnostics({
            module: 'ui/PromptLibrary',
            operation: 'prompt_delete.rollback',
            host: window.location.hostname,
            url: window.location.href,
            error: err,
          }),
        });
      }
    }, 5000);

    pendingDeletesRef.current.set(id, { timerId, prompt });

    showDexToast({
      type: 'action',
      title: 'Prompt scheduled for deletion',
      message: `\"${prompt.title}\" will be deleted in 5 seconds.`,
      actions: [{
        label: 'Undo',
        onSelect: () => {
          const pending = pendingDeletesRef.current.get(id);
          if (!pending) return;
          window.clearTimeout(pending.timerId);
          pendingDeletesRef.current.delete(id);
          setPrompts((current) => [pending.prompt, ...current].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
          showDexToast({
            type: 'success',
            title: 'Deletion undone',
            message: 'Prompt restored.',
          });
        },
      }],
      diagnostics: {
        module: 'ui/PromptLibrary',
        operation: 'prompt_delete.schedule',
        promptId: id,
        at: Date.now(),
      },
      durationMs: 5500,
    });
  }

  function startEdit(prompt) {
    setEditingId(prompt.id);
    setTitle(prompt.title || '');
    setBody(prompt.body || '');
    setTagsText(Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '');
    setShowForm(true);
  }

  function insertPrompt(prompt) {
    const vars = Array.isArray(prompt.variables) ? prompt.variables : [];
    if (vars.length > 0) {
      // Show inline variable form instead of window.prompt
      setVarFormPrompt(prompt);
    } else {
      onInsert?.(prompt.body);
      onClose?.();
    }
  }

  if (!visible) return null;
  const confirmPrompt = prompts.find((item) => item.id === confirmDeleteId) || null;

  return h(
    PanelFrame,
    {
      panelId: 'promptLibrary',
      title: 'Prompt Library',
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
      // Variable fill-in form overlays the list when active
      varFormPrompt
        ? h(VariableForm, {
            prompt: varFormPrompt,
            onInsert: (text) => {
              setVarFormPrompt(null);
              onInsert?.(text);
              onClose?.();
            },
            onCancel: () => setVarFormPrompt(null),
          })
        : [
            h(ContextualHint, {
              key: 'hint-prompt-library',
              hintId: 'prompt-library',
              visible: true,
              title: 'Prompt Library hint',
              message: 'Insert uses current prompt text. Edit templates before deleting to avoid losing reusable variants.',
            }),
            // Search — at top for quick access
            h('input', {
              class: 'dex-input',
              placeholder: 'Search prompts…',
              value: search,
              'aria-label': 'Search prompts',
              onInput: (e) => setSearch(e.currentTarget.value),
            }),

            // Tier filter row
            h('div', { class: 'dex-prompt-filter-row' },
              ['all', 'common', 'advanced', 'epic'].map((tier) =>
                h('button', {
                  key: tier,
                  type: 'button',
                  class: `dex-link-btn${tierFilter === tier ? ' dex-link-btn--accent' : ''}`,
                  onClick: () => setTierFilter(tier),
                }, tier === 'all' ? `All (${tierCounts.all})` : `${tier.charAt(0).toUpperCase() + tier.slice(1)} (${tierCounts[tier]})`)
              )
            ),

            // New Prompt toggle
            h('div', { class: 'dex-form__actions' }, [
              h('button', {
                type: 'button',
                class: `dex-link-btn${showForm ? '' : ' dex-link-btn--accent'}`,
                onClick: () => {
                  if (showForm) { resetForm(); } else { setShowForm(true); }
                },
              }, showForm && !editingId ? 'Hide Form' : editingId ? 'Editing Prompt' : '+ New Prompt'),
            ]),

            // Create / edit form — only when visible
            showForm
              ? h('form', { class: 'dex-form', onSubmit: submitPrompt }, [
                  h('input', {
                    class: 'dex-input',
                    placeholder: 'Prompt title',
                    value: title,
                    required: true,
                    'aria-label': 'Prompt title',
                    onInput: (e) => setTitle(e.currentTarget.value),
                  }),
                  h('textarea', {
                    class: 'dex-textarea',
                    placeholder: 'Prompt body (use {{variable}} for fill-in placeholders)',
                    value: body,
                    rows: 4,
                    'aria-label': 'Prompt body',
                    onInput: (e) => setBody(e.currentTarget.value),
                  }),
                  h('input', {
                    class: 'dex-input',
                    placeholder: 'Tags (comma separated)',
                    value: tagsText,
                    'aria-label': 'Prompt tags',
                    onInput: (e) => setTagsText(e.currentTarget.value),
                  }),
                  h('div', { class: 'dex-form__actions' }, [
                    h('button', { type: 'submit', class: 'dex-link-btn dex-link-btn--accent' },
                      editingId ? 'Update Prompt' : 'Save Prompt'),
                    h('button', { type: 'button', class: 'dex-link-btn', onClick: resetForm }, 'Cancel'),
                  ]),
                ])
              : null,

            loading ? h('div', { class: 'dex-folder-state', role: 'status' }, 'Loading prompts…') : null,
            error ? h('div', { class: 'dex-folder-state error', role: 'alert' }, error) : null,

            h('p', { class: 'dex-folder-state' }, 'Tip: Use {{variable}} in prompt bodies — you\'ll be prompted to fill values before insertion.'),

            // Prompt list
            !loading && filteredPrompts.length === 0
              ? h('div', { class: 'dex-folder-state' },
                  search ? `No prompts matching "${search}".` : 'No prompts in this tier yet.')
              : null,

            h('div', { class: 'dex-prompt-list' },
              filteredPrompts.map((prompt) =>
                h('article', { key: prompt.id, class: 'dex-prompt-card' }, [
                  h('div', { class: 'dex-prompt-card__head' }, [
                    h('strong', null, prompt.title),
                    (prompt.variables || []).length > 0
                      ? h('span', { class: 'dex-folder-count', title: 'Variables' },
                          `${prompt.variables.length} var${prompt.variables.length !== 1 ? 's' : ''}`)
                      : null,
                  ]),
                  h('p', { class: 'dex-prompt-card__body' }, prompt.body),
                  h('div', { class: 'dex-prompt-tags' },
                    (prompt.tags || []).map((tag) =>
                      h('span', { class: 'dex-tag', key: `${prompt.id}-${tag}` }, tag)
                    )
                  ),
                  h('div', { class: 'dex-folder-actions' }, [
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn dex-link-btn--accent',
                      onClick: () => insertPrompt(prompt),
                    }, 'Insert'),
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn',
                      onClick: () => startEdit(prompt),
                    }, 'Edit'),
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn danger',
                      onClick: () => setConfirmDeleteId(prompt.id),
                    }, 'Delete'),
                  ]),
                ])
              )
            ),
            h(DexDialog, {
              open: Boolean(confirmPrompt),
              title: 'Delete prompt?',
              description: confirmPrompt
                ? `Delete \"${confirmPrompt.title}\" from your prompt library?`
                : '',
              confirmText: 'Delete',
              cancelText: 'Cancel',
              variant: 'alertdialog',
              danger: true,
              onConfirm: () => {
                if (!confirmPrompt?.id) return;
                schedulePromptDelete(confirmPrompt.id);
              },
              onCancel: () => setConfirmDeleteId(null),
            }),
          ],
    ]
  );
}
