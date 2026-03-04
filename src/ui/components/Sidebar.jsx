import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { FolderTree } from './FolderTree.jsx';

export function Sidebar({
  site,
  currentChatUrl,
  queueSize = 0,
  onRequestExport,
  onRequestTour,
  onRequestPrompts,
  onRequestOptimizer,
  iconUrl = '',
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [liveUrl, setLiveUrl] = useState(currentChatUrl || window.location.href);

  useEffect(() => {
    setLiveUrl(currentChatUrl || window.location.href);
  }, [currentChatUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveUrl((previous) => (window.location.href !== previous ? window.location.href : previous));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return h(
    'aside',
    {
      class: `dex-sidebar${collapsed ? ' is-collapsed' : ''}`,
      'aria-label': 'DexEnhance Sidebar',
    },
    [
      h('header', { class: 'dex-sidebar__header' }, [
        !collapsed
          ? h('h2', { class: 'dex-sidebar__title' }, [
              iconUrl
                ? h('img', {
                    src: iconUrl,
                    alt: 'DexEnhance',
                    class: 'dex-sidebar__icon',
                  })
                : null,
              h('span', null, `DexEnhance • ${site}`),
            ])
          : null,
        h(
          'button',
          {
            class: 'dex-sidebar__toggle',
            type: 'button',
            onClick: () => setCollapsed((value) => !value),
            'aria-label': collapsed ? 'Expand sidebar' : 'Collapse sidebar',
          },
          collapsed ? '>' : '<'
        ),
      ]),
      !collapsed
        ? h('div', { class: 'dex-sidebar__body' }, [
            h('div', { class: 'dex-sidebar__meta' }, [
              h('span', { class: 'dex-sidebar__label' }, 'Current Chat'),
              h('span', { class: 'dex-sidebar__url' }, liveUrl || 'Unknown'),
          ]),
            h('div', { class: 'dex-sidebar__meta' }, [
              h('span', { class: 'dex-sidebar__label' }, 'Queued Messages'),
              h('span', { class: 'dex-sidebar__url' }, String(queueSize)),
            ]),
            h(
              'button',
              {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => onRequestExport?.(),
              },
              'Export Chat'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => onRequestOptimizer?.(),
              },
              'Optimize Prompt'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => onRequestPrompts?.(),
              },
              'Prompt Library'
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'dex-link-btn dex-link-btn--accent',
                onClick: () => onRequestTour?.(),
              },
              'Feature Tour'
            ),
            h(FolderTree, { currentChatUrl: liveUrl }),
          ])
        : null,
    ]
  );
}
