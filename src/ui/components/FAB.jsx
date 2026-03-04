import { h } from 'preact';
import { useState } from 'preact/hooks';

export function FAB({ site, onAction, iconUrl = '' }) {
  const [open, setOpen] = useState(false);

  return h('div', { class: 'dex-fab', 'aria-label': 'DexEnhance Quick Actions' }, [
    open
      ? h('div', { class: 'dex-fab__menu' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('tour');
                setOpen(false);
              },
            },
            'Feature Tour'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('optimize');
                setOpen(false);
              },
            },
            'Optimize Prompt'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('prompts');
                setOpen(false);
              },
            },
            'Prompt Library'
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'dex-fab__action',
              onClick: () => {
                onAction?.('export');
                setOpen(false);
              },
            },
            'Export'
          ),
        ])
      : null,
    h(
      'button',
      {
        type: 'button',
        class: 'dex-fab__button',
        onClick: () => setOpen((value) => !value),
        'aria-label': open ? 'Close quick actions' : 'Open quick actions',
      },
      open
        ? '×'
        : iconUrl
          ? h('img', {
              src: iconUrl,
              alt: `${site} quick actions`,
              class: 'dex-fab__icon',
            })
          : '+'
    ),
  ]);
}
