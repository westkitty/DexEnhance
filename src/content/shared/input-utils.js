function setNativeValue(inputEl, value) {
  const prototype = Object.getPrototypeOf(inputEl);
  const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value') : null;
  if (descriptor?.set) {
    descriptor.set.call(inputEl, value);
    return;
  }
  inputEl.value = value;
}

/**
 * @param {HTMLElement|null|undefined} inputEl
 * @returns {string}
 */
export function readTextFromInputElement(inputEl) {
  if (!(inputEl instanceof HTMLElement)) return '';

  if ('value' in inputEl && typeof inputEl.value === 'string') {
    return inputEl.value.trim();
  }
  return (inputEl.textContent || '').trim();
}

/**
 * @param {HTMLElement|null|undefined} inputEl
 * @param {string} text
 * @returns {boolean}
 */
export function writeTextToInputElement(inputEl, text) {
  if (!(inputEl instanceof HTMLElement)) return false;
  const value = typeof text === 'string' ? text : '';

  inputEl.focus();
  if ('value' in inputEl && typeof inputEl.value === 'string') {
    setNativeValue(inputEl, value);
  } else {
    inputEl.textContent = value;
  }

  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/**
 * @param {HTMLElement|null|undefined} inputEl
 * @returns {boolean}
 */
export function clearTextInInputElement(inputEl) {
  return writeTextToInputElement(inputEl, '');
}

/**
 * Set textarea/editor text using adapter-accessed element and dispatch input events.
 * @param {import('./chat-interface.js').ChatInterface} adapter
 * @param {string} text
 */
export function insertTextThroughAdapter(adapter, text) {
  const inputEl = adapter.getTextarea();
  return writeTextToInputElement(inputEl, text);
}
