import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { registerEscapeHandler } from '../runtime/keyboard-router.js';

function focusableElements(root) {
  if (!(root instanceof HTMLElement)) return [];
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return [...root.querySelectorAll(selectors.join(','))].filter((node) => node instanceof HTMLElement);
}

export function DexDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'dialog',
  danger = false,
  allowEscape = true,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const root = dialogRef.current;
    const focusables = focusableElements(root);
    if (focusables[0]) {
      focusables[0].focus();
    } else {
      root?.focus?.();
    }

    const removeEscape = registerEscapeHandler(() => {
      if (!allowEscape) return false;
      onCancel?.();
      return true;
    }, {
      priority: 300,
      isActive: () => open,
      allowFromEditable: true,
    });

    const onKeyDown = (event) => {
      if (!open) return;
      if (event.key !== 'Tab') return;

      const activeFocusable = focusableElements(root);
      if (activeFocusable.length === 0) {
        event.preventDefault();
        root?.focus?.();
        return;
      }

      const first = activeFocusable[0];
      const last = activeFocusable[activeFocusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !root?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !root?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      removeEscape();
      document.removeEventListener('keydown', onKeyDown, true);
      previousFocusRef.current?.focus?.();
    };
  }, [allowEscape, onCancel, open]);

  if (!open) return null;

  const headingId = 'dex-dialog-title';
  const descriptionId = 'dex-dialog-description';

  return h('div', {
    class: 'dex-dialog-overlay',
    onMouseDown: (event) => {
      if (event.target === event.currentTarget) {
        onCancel?.();
      }
    },
  }, [
    h('section', {
      class: 'dex-dialog',
      role: variant === 'alertdialog' ? 'alertdialog' : 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': headingId,
      'aria-describedby': description ? descriptionId : undefined,
      ref: dialogRef,
      tabIndex: -1,
    }, [
      h('h2', { id: headingId, class: 'dex-dialog__title' }, title || 'Confirm action'),
      description
        ? h('p', { id: descriptionId, class: 'dex-dialog__description' }, description)
        : null,
      h('div', { class: 'dex-dialog__actions' }, [
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          onClick: () => onCancel?.(),
        }, cancelText),
        h('button', {
          type: 'button',
          class: `dex-link-btn dex-link-btn--accent${danger ? ' danger' : ''}`,
          onClick: () => onConfirm?.(),
        }, confirmText),
      ]),
    ]),
  ]);
}
