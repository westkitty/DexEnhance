import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { FolderTree } from './FolderTree.jsx';
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

function fillPromptVariables(prompt, values) {
  let text = prompt.body;
  for (const key of Array.isArray(prompt.variables) ? prompt.variables : []) {
    const value = values[key] || '';
    const pattern = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
    text = text.replace(pattern, value);
  }
  return text;
}

export function PromptLibrary({
  visible,
  onClose,
  onInsert,
  currentChatUrl = '',
  initialSection = 'prompts',
}) {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(initialSection === 'folders' ? 'folders' : 'prompts');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [activeVariablePromptId, setActiveVariablePromptId] = useState('');
  const [variableValues, setVariableValues] = useState({});
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

  useEffect(() => () => {
    for (const pending of pendingDeletesRef.current.values()) {
      window.clearTimeout(pending.timerId);
    }
    pendingDeletesRef.current.clear();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCurrentSection(initialSection === 'folders' ? 'folders' : 'prompts');
  }, [initialSection, visible]);

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
      const haystack = `${prompt.title} ${prompt.body} ${tags.join(' ')}`.toLowerCase();
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
    setPrompts((current) => current.filter((item) => item.id !== id));

    const timerId = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(id);
      try {
        const response = await sendRuntimeMessage(MESSAGE_ACTIONS.PROMPT_DELETE, { id });
        if (!response.ok) throw new Error(response.error || 'Delete request failed');
      } catch (err) {
        setPrompts((current) => [prompt, ...current].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        setError(err instanceof Error ? err.message : String(err));
        notifyError('prompt_delete.commit', err);
        showDexToast({
          type: 'error',
          title: 'Delete rolled back',
          message: 'Prompt deletion failed and was restored.',
        });
      }
    }, 5000);

    pendingDeletesRef.current.set(id, { timerId, prompt });

    showDexToast({
      type: 'action',
      title: 'Prompt deleted',
      message: `"${prompt.title}" will commit in 5 seconds.`,
      actions: [{
        label: 'Undo',
        onSelect: () => {
          const pending = pendingDeletesRef.current.get(id);
          if (!pending) return;
          window.clearTimeout(pending.timerId);
          pendingDeletesRef.current.delete(id);
          setPrompts((current) => [pending.prompt, ...current].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
          showDexToast({ type: 'success', title: 'Deletion undone', message: 'Prompt restored.' });
        },
      }],
      durationMs: 5200,
    });
  }

  function startEdit(prompt) {
    setEditingId(prompt.id);
    setTitle(prompt.title || '');
    setBody(prompt.body || '');
    setTagsText(Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '');
    setShowForm(true);
    setCurrentSection('prompts');
  }

  function openVariableEditor(prompt) {
    const vars = Array.isArray(prompt.variables) ? prompt.variables : [];
    setActiveVariablePromptId(prompt.id);
    setVariableValues(Object.fromEntries(vars.map((value) => [value, ''])));
  }

  function insertPrompt(prompt) {
    const vars = Array.isArray(prompt.variables) ? prompt.variables : [];
    if (vars.length > 0) {
      openVariableEditor(prompt);
      return;
    }
    onInsert?.(prompt.body);
    onClose?.();
  }

  function submitVariablePrompt(prompt) {
    const text = fillPromptVariables(prompt, variableValues);
    setActiveVariablePromptId('');
    setVariableValues({});
    onInsert?.(text);
    onClose?.();
  }

  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-prompt-workspace', 'aria-label': 'Prompt workspace' }, [
    h('div', { class: 'dex-segmented' }, [
      h('button', {
        type: 'button',
        class: `dex-segmented__button${currentSection === 'prompts' ? ' is-active' : ''}`,
        onClick: () => setCurrentSection('prompts'),
      }, 'Prompt Library'),
      h('button', {
        type: 'button',
        class: `dex-segmented__button${currentSection === 'folders' ? ' is-active' : ''}`,
        onClick: () => setCurrentSection('folders'),
      }, 'Chat Organization'),
    ]),

    currentSection === 'folders'
      ? h('div', { class: 'dex-drawer-stack' }, [
          h(ContextualHint, {
            hintId: 'folder-workspace',
            visible: true,
            title: 'Chat organization',
            message: 'Assign the current conversation to a folder without leaving the active thread.',
          }),
          h(FolderTree, { currentChatUrl }),
        ])
      : h('div', { class: 'dex-drawer-stack' }, [
          h(ContextualHint, {
            hintId: 'prompt-library',
            visible: true,
            title: 'Prompt library',
            message: 'Reusable prompts stay keyboard-first here. Variable prompts expand inline before insertion.',
          }),
          h('div', { class: 'dex-command-row' }, [
            h('input', {
              class: 'dex-input dex-command-row__search',
              placeholder: 'Search prompts…',
              value: search,
              'aria-label': 'Search prompts',
              onInput: (event) => setSearch(event.currentTarget.value),
            }),
            h('button', {
              type: 'button',
              class: `dex-link-btn${showForm ? '' : ' dex-link-btn--accent'}`,
              onClick: () => {
                if (showForm) {
                  resetForm();
                  return;
                }
                setShowForm(true);
              },
            }, showForm && !editingId ? 'Hide Form' : editingId ? 'Editing Prompt' : '+ New Prompt'),
          ]),
          h('div', { class: 'dex-prompt-filter-row' },
            ['all', 'common', 'advanced', 'epic'].map((tier) => h('button', {
              key: tier,
              type: 'button',
              class: `dex-link-btn${tierFilter === tier ? ' dex-link-btn--accent' : ''}`,
              onClick: () => setTierFilter(tier),
            }, tier === 'all' ? `All (${tierCounts.all})` : `${tier.charAt(0).toUpperCase() + tier.slice(1)} (${tierCounts[tier]})`))
          ),
          showForm
            ? h('form', { class: 'dex-form', onSubmit: submitPrompt }, [
                h('input', {
                  class: 'dex-input',
                  placeholder: 'Prompt title',
                  value: title,
                  required: true,
                  'aria-label': 'Prompt title',
                  onInput: (event) => setTitle(event.currentTarget.value),
                }),
                h('textarea', {
                  class: 'dex-textarea',
                  placeholder: 'Prompt body (use {{variable}} for fill-in placeholders)',
                  value: body,
                  rows: 5,
                  'aria-label': 'Prompt body',
                  onInput: (event) => setBody(event.currentTarget.value),
                }),
                h('input', {
                  class: 'dex-input',
                  placeholder: 'Tags (comma separated)',
                  value: tagsText,
                  'aria-label': 'Prompt tags',
                  onInput: (event) => setTagsText(event.currentTarget.value),
                }),
                h('div', { class: 'dex-form__actions' }, [
                  h('button', { type: 'submit', class: 'dex-link-btn dex-link-btn--accent' }, editingId ? 'Update Prompt' : 'Save Prompt'),
                  h('button', { type: 'button', class: 'dex-link-btn', onClick: resetForm }, 'Cancel'),
                ]),
              ])
            : null,
          loading ? h('div', { class: 'dex-folder-state', role: 'status' }, 'Loading prompts…') : null,
          error ? h('div', { class: 'dex-folder-state error', role: 'alert' }, error) : null,
          h('p', { class: 'dex-folder-state' }, 'Use {{variable}} in prompt bodies. Variable inputs open inline beneath the selected prompt.'),
          !loading && filteredPrompts.length === 0
            ? h('div', { class: 'dex-folder-state' }, search ? `No prompts matching "${search}".` : 'No prompts in this tier yet.')
            : null,
          h('div', { class: 'dex-prompt-list' },
            filteredPrompts.map((prompt) => {
              const isVariablePrompt = activeVariablePromptId === prompt.id;
              const variables = Array.isArray(prompt.variables) ? prompt.variables : [];
              return h('article', { key: prompt.id, class: 'dex-prompt-card' }, [
                h('div', { class: 'dex-prompt-card__head' }, [
                  h('strong', null, prompt.title),
                  variables.length > 0 ? h('span', { class: 'dex-folder-count' }, `${variables.length} var${variables.length === 1 ? '' : 's'}`) : null,
                ]),
                h('p', { class: 'dex-prompt-card__body' }, prompt.body),
                h('div', { class: 'dex-prompt-tags' },
                  (prompt.tags || []).map((tag) => h('span', { class: 'dex-tag', key: `${prompt.id}-${tag}` }, tag))
                ),
                h('div', { class: 'dex-folder-actions' }, [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--accent',
                    onClick: () => insertPrompt(prompt),
                  }, variables.length > 0 ? 'Fill Variables' : 'Insert'),
                  h('button', { type: 'button', class: 'dex-link-btn', onClick: () => startEdit(prompt) }, 'Edit'),
                  h('button', { type: 'button', class: 'dex-link-btn danger', onClick: () => schedulePromptDelete(prompt.id) }, 'Delete'),
                ]),
                isVariablePrompt
                  ? h('div', { class: 'dex-inline-variable-form' }, [
                      h('strong', { class: 'dex-inline-variable-form__title' }, `Insert “${prompt.title}”`),
                      h('div', { class: 'dex-form' },
                        variables.map((variableName) => h('div', { key: variableName }, [
                          h('label', { class: 'dex-sidebar__label' }, variableName),
                          h('input', {
                            class: 'dex-input',
                            placeholder: `Value for ${variableName}`,
                            value: variableValues[variableName] || '',
                            onInput: (event) => setVariableValues((current) => ({ ...current, [variableName]: event.currentTarget.value })),
                          }),
                        ]))
                      ),
                      h('div', { class: 'dex-form__actions' }, [
                        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => submitVariablePrompt(prompt) }, 'Insert'),
                        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => { setActiveVariablePromptId(''); setVariableValues({}); } }, 'Cancel'),
                      ]),
                    ])
                  : null,
              ]);
            })
          ),
        ]),
  ]);
}
