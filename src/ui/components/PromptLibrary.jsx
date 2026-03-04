import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { PanelFrame } from './PanelFrame.jsx';

async function callAction(action, payload = {}) {
  const response = await sendRuntimeMessage(action, payload);
  if (!response.ok) throw new Error(response.error || action);
  return response.data;
}

function normalizeTags(input) {
  if (typeof input !== 'string') return [];
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

function applyVariables(prompt) {
  const vars = Array.isArray(prompt.variables) ? prompt.variables : [];
  if (vars.length === 0) return prompt.body;

  let output = prompt.body;
  for (const key of vars) {
    const value = window.prompt(`Value for ${key}`, '') ?? '';
    const pattern = new RegExp(`{{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`, 'g');
    output = output.replace(pattern, value);
  }
  return output;
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

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsText, setTagsText] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await callAction(MESSAGE_ACTIONS.PROMPT_LIST);
      setPrompts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) {
      void refresh();
    }
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
  }

  async function submitPrompt(event) {
    event.preventDefault();
    const prompt = {
      title: title.trim(),
      body,
      tags: normalizeTags(tagsText),
    };
    try {
      if (editingId) {
        await callAction(MESSAGE_ACTIONS.PROMPT_UPDATE, {
          prompt: { id: editingId, ...prompt },
        });
      } else {
        await callAction(MESSAGE_ACTIONS.PROMPT_CREATE, { prompt });
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function removePrompt(id) {
    const confirmed = window.confirm('Delete this prompt?');
    if (!confirmed) return;
    try {
      await callAction(MESSAGE_ACTIONS.PROMPT_DELETE, { id });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function startEdit(prompt) {
    setEditingId(prompt.id);
    setTitle(prompt.title || '');
    setBody(prompt.body || '');
    setTagsText(Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '');
  }

  function insertPrompt(prompt) {
    const text = applyVariables(prompt);
    onInsert?.(text);
    onClose?.();
  }

  if (!visible) return null;

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
      minWidth: 520,
      minHeight: 320,
      zIndex: 2147483647,
      showPin: true,
      showClose: true,
      allowResize: true,
    },
    [
      h('p', { class: 'dex-tour__description' }, 'Reusable prompts with variable placeholders and instant insertion.'),
      h('div', { class: 'dex-prompt-filter-row' }, [
        h(
          'button',
          {
            type: 'button',
            class: `dex-link-btn${tierFilter === 'all' ? ' dex-link-btn--accent' : ''}`,
            onClick: () => setTierFilter('all'),
          },
          `All (${tierCounts.all})`
        ),
        h(
          'button',
          {
            type: 'button',
            class: `dex-link-btn${tierFilter === 'common' ? ' dex-link-btn--accent' : ''}`,
            onClick: () => setTierFilter('common'),
          },
          `Common (${tierCounts.common})`
        ),
        h(
          'button',
          {
            type: 'button',
            class: `dex-link-btn${tierFilter === 'advanced' ? ' dex-link-btn--accent' : ''}`,
            onClick: () => setTierFilter('advanced'),
          },
          `Advanced (${tierCounts.advanced})`
        ),
        h(
          'button',
          {
            type: 'button',
            class: `dex-link-btn${tierFilter === 'epic' ? ' dex-link-btn--accent' : ''}`,
            onClick: () => setTierFilter('epic'),
          },
          `Epic (${tierCounts.epic})`
        ),
      ]),
      h(
        'form',
        { class: 'dex-form', onSubmit: submitPrompt },
        [
          h('input', {
            class: 'dex-input',
            placeholder: 'Prompt title',
            value: title,
            onInput: (e) => setTitle(e.currentTarget.value),
          }),
          h('textarea', {
            class: 'dex-textarea',
            placeholder: 'Prompt body (supports {{variable}})',
            value: body,
            rows: 4,
            onInput: (e) => setBody(e.currentTarget.value),
          }),
          h('input', {
            class: 'dex-input',
            placeholder: 'Tags (comma separated)',
            value: tagsText,
            onInput: (e) => setTagsText(e.currentTarget.value),
          }),
          h('div', { class: 'dex-form__actions' }, [
            h('button', { type: 'submit', class: 'dex-link-btn' }, editingId ? 'Update Prompt' : 'Save Prompt'),
            editingId
              ? h('button', { type: 'button', class: 'dex-link-btn', onClick: resetForm }, 'Cancel Edit')
              : null,
          ]),
        ]
      ),
      h('input', {
        class: 'dex-input',
        placeholder: 'Search prompts',
        value: search,
        onInput: (e) => setSearch(e.currentTarget.value),
      }),
      h(
        'p',
        { class: 'dex-folder-state' },
        'Tip: Use {{variables}} in prompt bodies and DexEnhance will ask for values before insertion.'
      ),
      loading ? h('div', { class: 'dex-folder-state' }, 'Loading prompts...') : null,
      error ? h('div', { class: 'dex-folder-state error' }, error) : null,
      h(
        'div',
        { class: 'dex-prompt-list' },
        filteredPrompts.map((prompt) =>
          h('article', { key: prompt.id, class: 'dex-prompt-card' }, [
            h('div', { class: 'dex-prompt-card__head' }, [
              h('strong', null, prompt.title),
              h('span', { class: 'dex-folder-count' }, String((prompt.variables || []).length)),
            ]),
            h('p', { class: 'dex-prompt-card__body' }, prompt.body),
            h(
              'div',
              { class: 'dex-prompt-tags' },
              (prompt.tags || []).map((tag) => h('span', { class: 'dex-tag', key: `${prompt.id}-${tag}` }, tag))
            ),
            h('div', { class: 'dex-folder-actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => insertPrompt(prompt) }, 'Insert'),
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => startEdit(prompt) }, 'Edit'),
              h('button', { type: 'button', class: 'dex-link-btn danger', onClick: () => removePrompt(prompt.id) }, 'Delete'),
            ]),
          ])
        )
      ),
    ]
  );
}
