let initialized = false;
let nextHandlerId = 1;
const escapeHandlers = [];

function isEditableElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return element.isContentEditable === true;
}

function eventInsideDexUi(event) {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  return path.some((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.id === 'dex-app') return true;
    if (node.getAttribute?.('data-dex-panel')) return true;
    return node.className?.toString?.()?.includes?.('dex-') === true;
  });
}

function install() {
  if (initialized) return;
  initialized = true;

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!eventInsideDexUi(event)) return;

    const activeElement = document.activeElement;
    const inEditable = isEditableElement(activeElement);

    const activeHandlers = escapeHandlers
      .filter((handler) => (typeof handler.isActive === 'function' ? handler.isActive() : true))
      .sort((a, b) => b.priority - a.priority);

    for (const handler of activeHandlers) {
      if (inEditable && handler.allowFromEditable !== true) {
        continue;
      }
      const handled = handler.onEscape?.(event);
      if (handled !== false) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }, true);
}

export function registerEscapeHandler(onEscape, options = {}) {
  if (typeof onEscape !== 'function') {
    return () => {};
  }

  install();

  const record = {
    id: `dex-escape-${nextHandlerId}`,
    onEscape,
    priority: Number.isFinite(Number(options.priority)) ? Number(options.priority) : 0,
    isActive: typeof options.isActive === 'function' ? options.isActive : null,
    allowFromEditable: options.allowFromEditable === true,
  };

  nextHandlerId += 1;
  escapeHandlers.push(record);

  return () => {
    const index = escapeHandlers.findIndex((item) => item.id === record.id);
    if (index >= 0) escapeHandlers.splice(index, 1);
  };
}
