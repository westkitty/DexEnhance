/**
 * Ring buffer for local diagnostics and events.
 * Keeps only the last N events in memory (persisted via service worker if needed).
 */
export class DiagnosticsBuffer {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.buffer = [];
  }

  /**
   * Add an event to the buffer.
   * @param {string} category 
   * @param {string} action 
   * @param {any} [data] 
   */
  log(category, action, data = null) {
    const entry = {
      timestamp: Date.now(),
      category,
      action,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    };
    
    this.buffer.push(entry);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }
  }

  getEntries() {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

export const diagnostics = new DiagnosticsBuffer(200);
