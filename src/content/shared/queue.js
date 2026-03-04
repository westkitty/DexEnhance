// Smart message queue — stub for Phase 6
// FIFO queue used to hold messages while AI is generating.

/**
 * @returns {object} A new queue instance
 */
export function createQueue() {
  const items = [];
  return {
    /** @param {string} message */
    enqueue(message) { items.push(message); },
    /** @returns {string|undefined} */
    dequeue() { return items.shift(); },
    /** @returns {string|undefined} */
    peek() { return items[0]; },
    /** @returns {boolean} */
    isEmpty() { return items.length === 0; },
    /** @returns {number} */
    size() { return items.length; },
  };
}
