import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { ContextualHint } from './ContextualHint.jsx';

async function fetchStats() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_STATS, {});
  if (!response.ok) throw new Error(response.error || 'Could not load semantic clipboard stats.');
  return response.data || {};
}

async function runQuery(queryText, topK) {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.SEMANTIC_CLIPBOARD_BUILD_PREAMBLE, { queryText, topK });
  if (!response.ok) throw new Error(response.error || 'Could not query semantic clipboard.');
  return response.data || {};
}

export function SemanticClipboardPanel({
  visible,
  onIngestCurrentContext,
  onInsertPreamble,
  onClearRequested,
}) {
  const [stats, setStats] = useState(null);
  const [queryText, setQueryText] = useState('');
  const [queryState, setQueryState] = useState({ loading: false, error: '', results: [], preamble: '', status: 'empty' });
  const [busyIngest, setBusyIngest] = useState(false);
  const [busyClear, setBusyClear] = useState(false);
  const [topK, setTopK] = useState(5);

  useEffect(() => {
    if (!visible) return;
    void fetchStats()
      .then((value) => setStats(value))
      .catch((error) => setQueryState((current) => ({ ...current, error: error.message, status: 'error' })));
  }, [visible]);

  if (!visible) return null;

  const hasChunks = Number(stats?.chunkCount || 0) > 0;

  async function handleQuery() {
    if (!queryText.trim()) {
      setQueryState({ loading: false, error: '', results: [], preamble: '', status: 'empty' });
      return;
    }
    setQueryState({ loading: true, error: '', results: [], preamble: '', status: 'loading' });
    try {
      const data = await runQuery(queryText, topK);
      setQueryState({
        loading: false,
        error: '',
        results: Array.isArray(data.matches) ? data.matches : [],
        preamble: typeof data.preamble === 'string' ? data.preamble : '',
        status: 'success',
      });
    } catch (error) {
      setQueryState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
        results: [],
        preamble: '',
        status: 'error',
      });
    }
  }

  return h('section', { class: 'dex-drawer-view dex-form', 'aria-label': 'Semantic Clipboard' }, [
    h(ContextualHint, {
      hintId: 'semantic-clipboard',
      visible: true,
      title: 'Semantic Clipboard',
      message: 'Ingest the current thread context locally, query matching chunks, then inject the generated preamble into the composer.',
    }),
    h('div', { class: 'dex-status-card dex-status-card--neutral' }, [
      h('strong', null, 'Semantic store'),
      h('span', { class: 'dex-status-card__value' }, `${Number(stats?.chunkCount || 0)} chunks`),
      h('p', { class: 'dex-folder-state' }, hasChunks ? 'Context is ready for ranked retrieval.' : 'Nothing has been ingested yet.'),
      h('div', { class: 'dex-folder-actions' }, [
        h('button', {
          type: 'button',
          class: 'dex-link-btn dex-link-btn--accent',
          disabled: busyIngest,
          onClick: async () => {
            setBusyIngest(true);
            try {
              await onIngestCurrentContext?.();
              const nextStats = await fetchStats();
              setStats(nextStats);
              setQueryState((current) => ({ ...current, status: 'success', error: '' }));
            } catch (error) {
              setQueryState((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : String(error) }));
            } finally {
              setBusyIngest(false);
            }
          },
        }, busyIngest ? 'Ingesting…' : 'Ingest Current Context'),
        h('button', {
          type: 'button',
          class: 'dex-link-btn danger',
          disabled: busyClear,
          onClick: async () => {
            setBusyClear(true);
            try {
              await onClearRequested?.();
              setStats(await fetchStats());
              setQueryState({ loading: false, error: '', results: [], preamble: '', status: 'empty' });
            } catch (error) {
              setQueryState((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : String(error) }));
            } finally {
              setBusyClear(false);
            }
          },
        }, busyClear ? 'Clearing…' : 'Clear Store'),
      ]),
    ]),
    h('label', { class: 'dex-sidebar__label' }, 'Query'),
    h('textarea', {
      class: 'dex-textarea',
      rows: 4,
      placeholder: 'Ask for the relevant context you want DexEnhance to inject.',
      value: queryText,
      onInput: (event) => setQueryText(event.currentTarget.value),
    }),
    h('label', { class: 'dex-sidebar__label' }, `Top matches (${topK})`),
    h('input', {
      type: 'range',
      class: 'dex-panel-frame__slider',
      min: 1,
      max: 10,
      step: 1,
      value: topK,
      onInput: (event) => setTopK(Number(event.currentTarget.value)),
    }),
    h('div', { class: 'dex-folder-actions' }, [
      h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: handleQuery, disabled: queryState.loading }, queryState.loading ? 'Querying…' : 'Run Query'),
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onInsertPreamble?.(queryState.preamble), disabled: !queryState.preamble }, 'Insert Preamble'),
    ]),
    queryState.status === 'empty'
      ? h('p', { class: 'dex-folder-state' }, 'Empty state: ingest context and query to generate a preamble.')
      : null,
    queryState.status === 'loading'
      ? h('p', { class: 'dex-folder-state', role: 'status' }, 'Loading matches and generated preamble…')
      : null,
    queryState.status === 'error'
      ? h('p', { class: 'dex-folder-state error', role: 'alert' }, queryState.error || 'Semantic Clipboard query failed.')
      : null,
    queryState.status === 'success'
      ? h('div', { class: 'dex-drawer-stack' }, [
          h('div', { class: 'dex-status-card dex-status-card--success' }, [
            h('strong', null, 'Generated preamble'),
            queryState.preamble
              ? h('pre', { class: 'dex-toast__details' }, queryState.preamble)
              : h('p', { class: 'dex-folder-state' }, 'No preamble generated for this query.'),
          ]),
          h('div', { class: 'dex-drawer-stack' },
            (queryState.results || []).length > 0
              ? queryState.results.map((match, index) => h('article', { key: `${index}-${match.sourceUrl || 'match'}`, class: 'dex-status-card dex-status-card--neutral' }, [
                  h('strong', null, `Match ${index + 1}`),
                  h('span', { class: 'dex-folder-state' }, `${match.title || 'Untitled'} • score ${Number(match.score || 0).toFixed(3)}`),
                  h('p', { class: 'dex-prompt-card__body' }, match.chunkText || ''),
                ]))
              : h('p', { class: 'dex-folder-state' }, 'No ranked matches were returned.'),
          ),
        ])
      : null,
  ]);
}
