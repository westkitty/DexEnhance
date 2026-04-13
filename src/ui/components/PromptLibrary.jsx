import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { FolderTree } from './FolderTree.jsx';
import { ContextualHint } from './ContextualHint.jsx';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';
import { scrubText } from '../../lib/PrivacyScrubber.js';

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
  onQueue,
  onSend,
  privacyScrubbing = false,
  currentChatUrl = '',
  initialSection = 'prompts',
  currentFolderLabel = '',
}) {
  const [prompts, setPrompts] = useState([]);
  const [chains, setChains] = useState([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(initialSection === 'folders' ? 'folders' : 'prompts');
  const [activeFolderContext, setActiveFolderContext] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [activeVariablePromptId, setActiveVariablePromptId] = useState('');
  const [activeChainId, setActiveChainId] = useState('');
  const [variableValues, setVariableValues] = useState({});
  const [actionStatus, setActionStatus] = useState({ tone: 'empty', message: 'No action run yet.' });
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

  async function refreshChains() {
    try {
      // Chains are currently stored in local storage or a dedicated message action
      const data = await callAction(MESSAGE_ACTIONS.PROMPT_LIST, { type: 'chain' });
      setChains(Array.isArray(data) ? data : []);
    } catch (err) {
      setChains([]);
    }
  }

  useEffect(() => {
    if (visible) {
      void refresh();
      void refreshChains();
    }
  }, [visible]);

  useEffect(() => {
    if (!currentChatUrl || !visible) {
      setActiveFolderContext('');
      return;
    }
    async function fetchActiveFolder() {
      try {
        const mapping = await callAction(MESSAGE_ACTIONS.FOLDER_GET_BY_CHAT_URL, { chatUrl: currentChatUrl });
        if (mapping?.folderId) {
          const tree = await callAction(MESSAGE_ACTIONS.FOLDER_TREE_GET, { includeDeleted: false });
          const folder = (tree.folders || []).find((f) => f.id === mapping.folderId);
          setActiveFolderContext(folder?.context || '');
        } else {
          setActiveFolderContext('');
        }
      } catch (e) {
        // Silent fallback
      }
    }
    void fetchActiveFolder();
  }, [currentChatUrl, visible, currentSection]);

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
    const counts = { all: prompts.length, common: 0, advanced: 0, epic: 0, 'image-gen': 0, apps: 0 };
    for (const prompt of prompts) {
      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
      if (tags.includes('common')) counts.common += 1;
      if (tags.includes('advanced')) counts.advanced += 1;
      if (tags.includes('epic')) counts.epic += 1;
      if (tags.includes('image-gen')) counts['image-gen'] += 1;
      if (tags.includes('apps')) counts.apps += 1;
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

  async function branchPrompt(prompt) {
    try {
      const newPrompt = {
        title: `${prompt.title} (v${(prompt.version || 1) + 1})`,
        body: prompt.body,
        tags: prompt.tags,
        version: (prompt.version || 1) + 1,
        parentVersionId: prompt.id,
      };
      await callAction(MESSAGE_ACTIONS.PROMPT_CREATE, { prompt: newPrompt });
      await refresh();
      showDexToast({ type: 'success', title: 'Prompt branched', message: `Created new version of "${prompt.title}".` });
    } catch (err) {
      notifyError('prompt_branch', err);
    }
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
    }
    let body = prompt.body;
    if (activeFolderContext) {
      body = `[[ CONTEXT FROM ${currentFolderLabel.toUpperCase()} ]]\n${activeFolderContext}\n\n[[ PROMPT ]]\n${body}`;
    }
    if (privacyScrubbing) {
      body = scrubText(body);
    }
    onInsert?.(body);
    setActionStatus({ tone: 'success', message: `Inserted "${prompt.title}" into the composer.` });
    onClose?.();
  }

  function resolveVariablePrompt(prompt) {
    let text = fillPromptVariables(prompt, variableValues);
    if (activeFolderContext) {
      text = `[[ CONTEXT FROM ${currentFolderLabel.toUpperCase()} ]]\n${activeFolderContext}\n\n[[ PROMPT ]]\n${text}`;
    }
    return text;
  }

  function runResolvedPrompt(prompt, mode = 'insert') {
    const text = resolveVariablePrompt(prompt);
    let final = text;
    if (privacyScrubbing) {
      final = scrubText(text);
    }
    if (!text.trim()) {
      setActionStatus({ tone: 'error', message: 'Resolved prompt is empty. Fill the variables first.' });
      return;
    }
    try {
      setActiveVariablePromptId('');
      setVariableValues({});
      if (mode === 'queue') {
        onQueue?.(final);
        setActionStatus({ tone: 'success', message: `Queued "${prompt.title}".` });
        return;
      }
      if (mode === 'send') {
        onSend?.(final);
        setActionStatus({ tone: 'success', message: `Sent "${prompt.title}".` });
        onClose?.();
        return;
      }
      onInsert?.(final);
      setActionStatus({ tone: 'success', message: `Inserted "${prompt.title}" into the composer.` });
      onClose?.();
    } catch (error) {
      setActionStatus({ tone: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-prompt-workspace', 'aria-label': 'Prompt workspace' }, [
    h('div', { class: 'dex-segmented' }, [
      h('button', {
        type: 'button',
        class: `dex-segmented__button${currentSection === 'prompts' ? ' is-active' : ''}`,
        onClick: () => setCurrentSection('prompts'),
      }, 'Prompts'),
      h('button', {
        type: 'button',
        class: `dex-segmented__button${currentSection === 'chains' ? ' is-active' : ''}`,
        onClick: () => setCurrentSection('chains'),
      }, 'Chains'),
      h('button', {
        type: 'button',
        class: `dex-segmented__button${currentSection === 'folders' ? ' is-active' : ''}`,
        onClick: () => setCurrentSection('folders'),
      }, 'Archive'),
    ]),

    currentSection === 'folders'
      ? h('div', { class: 'dex-drawer-stack' }, [
          h(ContextualHint, {
            hintId: 'folder-workspace',
            visible: true,
            title: 'Chat organization',
            message: currentFolderLabel
              ? `Current chat is assigned to "${currentFolderLabel}". Trash, restore, and permanent delete remain available here.`
              : 'Assign the current conversation to a folder without leaving the active thread.',
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
            ['all', 'common', 'advanced', 'epic', 'image-gen', 'apps'].map((tier) => h('button', {
              key: tier,
              type: 'button',
              class: `dex-link-btn\${tierFilter === tier ? ' dex-link-btn--accent' : ''}`,
              onClick: () => setTierFilter(tier),
            }, tier === 'all' ? `All (\${tierCounts.all})` : `\${tier.charAt(0).toUpperCase() + tier.slice(1).replace('-', '')} (\${tierCounts[tier]})`))
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
          h('div', { class: `dex-state-panel dex-state-panel--${actionStatus.tone}` }, [
            h('strong', null, 'Prompt action state'),
            h('p', { class: 'dex-folder-state' }, actionStatus.message),
          ]),
          h('p', { class: 'dex-folder-state' }, 'Use {{variable}} in prompt bodies. Variable prompts expose a visible form, resolved preview, insert, queue, and send actions.'),
          !loading && filteredPrompts.length === 0
            ? h('div', { class: 'dex-folder-state' }, search ? `No prompts matching "${search}".` : 'No prompts in this tier yet.')
            : null,
          h('div', { class: 'dex-prompt-list' },
            filteredPrompts.map((prompt) => {
              const isVariablePrompt = activeVariablePromptId === prompt.id;
              const variables = Array.isArray(prompt.variables) ? prompt.variables : [];
              return h('article', { key: prompt.id, class: `dex-status-card dex-prompt-card tier-${prompt.tags?.[0] || 'none'}` }, [
                h('div', { class: 'dex-prompt-card__head', style: { marginBottom: '8px' } }, [
                  h('strong', { style: { fontSize: '15px' } }, prompt.title),
                  h('div', { class: 'dex-prompt-card__meta' }, [
                    prompt.version > 1 ? h('span', { class: 'dex-tag' }, `v${prompt.version}`) : null,
                    variables.length > 0 ? h('span', { class: 'dex-tag is-active' }, `${variables.length} VARS`) : null,
                  ]),
                ]),
                h('div', { class: 'dex-prompt-tags', style: { marginBottom: '12px' } },
                  (prompt.tags || []).map((tag) => h('span', { class: `dex-tag dex-tag--${tag}`, key: `${prompt.id}-${tag}` }, tag))
                ),
                h('p', { class: 'dex-prompt-card__body', style: { opacity: 0.8, fontSize: '13px', lineHeight: '1.6' } }, prompt.body),
                h('div', { class: 'dex-folder-actions' }, [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--accent',
                    onClick: () => insertPrompt(prompt),
                  }, variables.length > 0 ? 'Fill Variables' : 'Insert'),
                  h('button', { type: 'button', class: 'dex-link-btn', onClick: () => startEdit(prompt) }, 'Edit'),
                  h('button', { type: 'button', class: 'dex-link-btn', onClick: () => branchPrompt(prompt) }, 'Branch'),
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
                      h('div', { class: 'dex-status-card dex-status-card--glow', style: { marginTop: '16px' } }, [
                        h('span', { class: 'dex-status-card__label' }, 'Resolved Preview'),
                        h('pre', { class: 'dex-toast__details', style: { background: 'rgba(0,0,0,0.2)', maxHeight: '120px' } }, resolveVariablePrompt(prompt) || 'Fill variables to compile…'),
                      ]),
                      h('div', { class: 'dex-form__actions' }, [
                        h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => runResolvedPrompt(prompt, 'insert') }, 'Insert'),
                        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => runResolvedPrompt(prompt, 'queue') }, 'Queue'),
                        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => runResolvedPrompt(prompt, 'send') }, 'Send'),
                        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => { setActiveVariablePromptId(''); setVariableValues({}); } }, 'Cancel'),
                      ]),
                    ])
                  : null,
              ]);
            })
          ),
        ]) : currentSection === 'chains' ? h('div', { class: 'dex-drawer-stack' }, [
          h(ContextualHint, {
            hintId: 'chain-engine',
            visible: true,
            title: 'Action Chains',
            message: 'Multi-step AI workflows. Output from one step can be piped into the next using {{LAST_RESULT}}.',
          }),
          h('div', { class: 'dex-prompt-list' },
            chains.map((chain) => {
              const isActive = activeChainId === chain.id;
              const allVars = [...new Set(chain.steps.flatMap(s => s.variables || []))].filter(v => v !== 'LAST_RESULT');
              return h('article', { key: chain.id, class: 'dex-status-card dex-prompt-card tier-advanced' }, [
                h('div', { class: 'dex-prompt-card__head' }, [
                  h('strong', null, chain.name),
                  h('span', { class: 'dex-tag' }, `${chain.steps.length} Steps`),
                ]),
                h('p', { class: 'dex-prompt-card__body', style: { fontSize: '12px' } }, chain.description),
                h('div', { class: 'dex-folder-actions' }, [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn dex-link-btn--accent',
                    onClick: () => {
                      setActiveChainId(chain.id);
                      setVariableValues(Object.fromEntries(allVars.map(v => [v, ''])));
                    }
                  }, 'Run Chain'),
                ]),
                isActive ? h('div', { class: 'dex-inline-variable-form' }, [
                  h('strong', null, `Configure ${chain.name}`),
                  allVars.map(v => h('div', { key: v }, [
                    h('label', { class: 'dex-sidebar__label' }, v),
                    h('input', {
                      class: 'dex-input',
                      value: variableValues[v] || '',
                      onInput: (e) => setVariableValues(prev => ({ ...prev, [v]: e.currentTarget.value }))
                    })
                  ])),
                  h('div', { class: 'dex-form__actions' }, [
                    h('button', {
                      type: 'button',
                      class: 'dex-link-btn dex-link-btn--accent',
                      onClick: () => {
                        onRunChain?.(chain, variableValues);
                        setActiveChainId('');
                        onClose?.();
                      }
                    }, 'Start Workflow'),
                    h('button', { type: 'button', class: 'dex-link-btn', onClick: () => setActiveChainId('') }, 'Cancel')
                  ])
                ]) : null
              ]);
            })
          )
        ]) : null,
  ]);
}
