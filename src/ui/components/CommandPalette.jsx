import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function filterCommands(commands, query) {
  const needle = normalizeText(query);
  if (!needle) return Array.isArray(commands) ? commands : [];
  return (Array.isArray(commands) ? commands : []).filter((command) => {
    const haystack = [
      command?.title,
      command?.subtitle,
      command?.group,
      ...(Array.isArray(command?.keywords) ? command.keywords : []),
    ].map(normalizeText).join(' ');
    return haystack.includes(needle);
  });
}

export function CommandPalette({
  open,
  commands = [],
  hostLabel = '',
  onClose,
  onExecute,
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 0);
  }, [open]);

  useEffect(() => {
    if (!filtered.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => Math.max(0, Math.min(current, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const grouped = filtered.reduce((acc, command) => {
    const group = command.group || 'Commands';
    if (!acc[group]) acc[group] = [];
    acc[group].push(command);
    return acc;
  }, {});

  const orderedGroups = Object.entries(grouped);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) onExecute?.(selected);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  };

  let cursor = 0;

  return h('div', {
    class: 'dex-command-palette__overlay',
    role: 'presentation',
    onMouseDown: (event) => {
      if (event.target === event.currentTarget) onClose?.();
    },
  }, [
    h('section', {
      class: 'dex-command-palette',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `DexEnhance command palette${hostLabel ? ` for ${hostLabel}` : ''}`,
    }, [
      h('div', { class: 'dex-command-palette__head' }, [
        h('div', null, [
          h('strong', { class: 'dex-command-palette__title' }, 'Command Palette'),
          h('p', { class: 'dex-command-palette__subtitle' }, `Navigate DexEnhance on ${hostLabel || 'this host'} without window juggling.`),
        ]),
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          onClick: () => onClose?.(),
        }, 'Close'),
      ]),
      h('label', { class: 'dex-command-palette__search-wrap' }, [
        h('span', { class: 'dex-command-palette__search-label' }, 'Find command'),
        h('input', {
          ref: inputRef,
          class: 'dex-input dex-command-palette__search',
          type: 'text',
          value: query,
          placeholder: 'Type a tool, action, or setting…',
          'aria-label': 'Search DexEnhance commands',
          onInput: (event) => setQuery(event.currentTarget.value),
          onKeyDown: handleKeyDown,
        }),
      ]),
      h('div', { class: 'dex-command-palette__results', role: 'listbox', 'aria-label': 'Matching commands' },
        filtered.length === 0
          ? h('div', { class: 'dex-command-palette__empty' }, 'No matching commands.')
          : orderedGroups.map(([group, groupCommands]) => h('section', { key: group, class: 'dex-command-palette__group' }, [
              h('h3', { class: 'dex-command-palette__group-title' }, group),
              h('div', { class: 'dex-command-palette__group-items' },
                groupCommands.map((command) => {
                  const itemIndex = cursor;
                  cursor += 1;
                  const isActive = itemIndex === activeIndex;
                  return h('button', {
                    key: command.id,
                    type: 'button',
                    class: `dex-command-palette__item${isActive ? ' is-active' : ''}`,
                    role: 'option',
                    'aria-selected': isActive ? 'true' : 'false',
                    onMouseEnter: () => setActiveIndex(itemIndex),
                    onClick: () => onExecute?.(command),
                  }, [
                    h('span', { class: 'dex-command-palette__item-main' }, [
                      h('strong', null, command.title),
                      command.subtitle ? h('span', { class: 'dex-command-palette__item-subtitle' }, command.subtitle) : null,
                    ]),
                    command.shortcut ? h('span', { class: 'dex-command-palette__shortcut' }, command.shortcut) : null,
                  ]);
                })
              ),
            ]))
      ),
      h('div', { class: 'dex-command-palette__footer' }, [
        h('span', null, 'Arrow keys move. Enter runs. Escape closes.'),
        h('span', null, 'Primary launcher shortcut: Cmd/Ctrl+K'),
      ]),
    ]),
  ]);
}
