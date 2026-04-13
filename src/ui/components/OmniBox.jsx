import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

export function OmniBox({ 
  visible, 
  onClose, 
  prompts = [], 
  chains = [], 
  onExecutePrompt, 
  onExecuteChain 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const combined = [
      ...prompts.map(p => ({ ...p, dexType: 'prompt' })),
      ...chains.map(c => ({ ...c, dexType: 'chain', title: c.name }))
    ];

    if (!q) return combined.slice(0, 10);

    return combined
      .map(item => {
        const title = item.title.toLowerCase();
        const score = title.indexOf(q);
        return { item, score };
      })
      .filter(entry => entry.score !== -1)
      .sort((a, b) => a.score - b.score)
      .map(entry => entry.item)
      .slice(0, 8);
  }, [prompts, chains, query]);

  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results, selectedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        if (selected.dexType === 'prompt') onExecutePrompt(selected);
        else onExecuteChain(selected);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!visible) return null;

  return h('div', { 
    class: 'dex-omnibox-overlay',
    onClick: (e) => e.target === e.currentTarget && onClose()
  }, [
    h('div', { class: 'dex-omnibox' }, [
      h('div', { class: 'dex-omnibox__input-wrap' }, [
        h('span', { class: 'dex-omnibox__icon' }, '🔍'),
        h('input', {
          ref: inputRef,
          class: 'dex-omnibox__input',
          placeholder: 'Search prompts and chains...',
          value: query,
          onInput: (e) => setQuery(e.currentTarget.value),
          onKeyDown: handleKeyDown
        }),
        h('kbd', { class: 'dex-kbd' }, 'ESC')
      ]),
      h('div', { 
        ref: resultsRef,
        class: 'dex-omnibox__results' 
      }, [
        results.length === 0 
          ? h('div', { class: 'dex-omnibox__empty' }, 'No results found.')
          : results.map((item, idx) => h('div', {
              class: `dex-omnibox__result ${idx === selectedIndex ? 'is-selected' : ''}`,
              onClick: () => {
                if (item.dexType === 'prompt') onExecutePrompt(item);
                else onExecuteChain(item);
                onClose();
              },
              onMouseEnter: () => setSelectedIndex(idx)
            }, [
              h('div', { class: 'dex-omnibox__result-meta' }, [
                h('span', { class: `dex-tag dex-tag--${item.dexType}` }, item.dexType.toUpperCase()),
                item.tags?.slice(0, 2).map(t => h('span', { class: 'dex-tag' }, t))
              ]),
              h('div', { class: 'dex-omnibox__result-title' }, item.title),
              item.body && h('div', { class: 'dex-omnibox__result-preview' }, item.body.slice(0, 80) + '...')
            ]))
      ]),
      h('div', { class: 'dex-omnibox__footer' }, [
        h('span', null, [h('kbd', { class: 'dex-kbd' }, '↑↓'), ' Navigate']),
        h('span', null, [h('kbd', { class: 'dex-kbd' }, '↵'), ' Run']),
        h('span', null, [h('kbd', { class: 'dex-kbd' }, 'ESC'), ' Close'])
      ])
    ])
  ]);
}
