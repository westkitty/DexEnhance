import { useEffect, useRef } from 'preact/hooks';
import { PersonaAvatar } from './PersonaAvatar.jsx';

export function DexDrawer({
  open,
  title,
  hostLabel = '',
  activeView,
  viewTabs = [],
  width = 420,
  banner = null,
  onClose,
  onSelectView,
  onWidthChange,
  onSaveCheckpoint,
  children,
  statusBar = null,
  model = 'dex',
  isGenerating = false,
}) {
  const handleRef = useRef(null);

  useEffect(() => {
    if (!open || typeof onWidthChange !== 'function') return undefined;
    const handleEl = handleRef.current;
    if (!(handleEl instanceof HTMLElement)) return undefined;

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      const onMove = (moveEvent) => {
        const delta = startX - moveEvent.clientX;
        onWidthChange(startWidth + delta);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    handleEl.addEventListener('pointerdown', onPointerDown);
    return () => handleEl.removeEventListener('pointerdown', onPointerDown);
  }, [open, onWidthChange, width]);

  return h('aside', {
    class: `dex-drawer${open ? ' is-open' : ''}`,
    style: { width: `${Math.round(width)}px` },
    'aria-hidden': open ? 'false' : 'true',
  }, [
    h('div', { ref: handleRef, class: 'dex-drawer__resize-handle', 'aria-hidden': 'true' }),
    h('div', { class: 'dex-drawer__frame' }, [
      h('header', { class: 'dex-drawer__header' }, [
        h('div', { class: 'dex-drawer__title-wrap' }, [
          h(PersonaAvatar, { model, isGenerating, size: 'small' }),
          h('div', null, [
            h('strong', { class: 'dex-drawer__title' }, title || 'DexEnhance'),
            h('span', { class: 'dex-drawer__host' }, hostLabel),
          ]),
        ]),
        h('div', { class: 'dex-drawer__header-actions' }, [
          h('button', {
            type: 'button',
            class: 'dex-link-btn dex-link-btn--accent',
            style: { minHeight: '30px', padding: '4px 10px', fontSize: '11px' },
            onClick: () => onSaveCheckpoint?.(),
          }, 'Snapshot'),
          h('button', {
            type: 'button',
            class: 'dex-link-btn',
            onClick: () => onClose?.(),
          }, 'Close'),
        ]),
      ]),
      h('nav', { class: 'dex-drawer__tabs', 'aria-label': 'Drawer views' },
        viewTabs.map((tab) => h('button', {
          key: tab.id,
          type: 'button',
          class: `dex-drawer__tab${tab.id === activeView ? ' is-active' : ''}`,
          onClick: () => onSelectView?.(tab.id),
          'aria-current': tab.id === activeView ? 'page' : 'false',
        }, tab.label))
      ),
      banner
        ? h('div', { class: `dex-inline-banner dex-inline-banner--${banner.type || 'warning'}`, role: banner.type === 'error' ? 'alert' : 'status' }, [
            h('strong', null, banner.title || 'Attention'),
            h('p', null, banner.message || ''),
            banner.actions?.length
              ? h('div', { class: 'dex-inline-banner__actions' }, banner.actions.map((action) => h('button', {
                  key: action.label,
                  type: 'button',
                  class: 'dex-link-btn',
                  onClick: () => action.onSelect?.(),
                }, action.label)))
              : null,
          ])
        : null,
      h('div', { class: 'dex-drawer__body' }, children),
      statusBar,
    ]),
  ]);
}
