// src/lib/utils.js
// Pure utility functions — no external dependencies.

/**
 * Strip HTML tags and normalize whitespace from a string.
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/&[a-z]+;/gi, ' ')    // replace HTML entities with space
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

/**
 * Truncate a string to maxLength characters, appending suffix if truncated.
 * @param {string} str
 * @param {number} maxLength - Maximum length of the returned string including suffix
 * @param {string} [suffix='...']
 * @returns {string}
 */
export function truncate(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Estimate token count using character-based heuristic.
 * Rule of thumb: ~4 characters per token (GPT/Claude convention).
 * Sufficient for UI hints; not a replacement for a real tokenizer.
 * @param {string} str
 * @returns {number}
 */
export function estimateTokens(str) {
  if (typeof str !== 'string' || str.length === 0) return 0;
  return Math.ceil(str.length / 4);
}
