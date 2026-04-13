/**
 * prompt-utils.js
 * Shared utilities for prompt variable resolution.
 */

/**
 * Fills variables in a prompt template.
 * @param {string|{body:string, variables:string[]}} prompt 
 * @param {Record<string, string>} values 
 * @returns {string}
 */
export function fillPromptVariables(prompt, values) {
  const body = typeof prompt === 'string' ? prompt : prompt.body;
  const variables = (typeof prompt === 'object' && Array.isArray(prompt.variables)) 
    ? prompt.variables 
    : extractVariables(body);
    
  let text = body;
  for (const key of variables) {
    const value = values[key] || '';
    const pattern = new RegExp(`\\\\{\\\\{\\\\s*${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}\\\\s*\\\\}\\\\}`, 'g');
    text = text.replace(pattern, value);
  }
  return text;
}

/**
 * Extracts {{variable}} keys from text.
 * @param {string} text 
 * @returns {string[]}
 */
export function extractVariables(text) {
  const matches = text.matchAll(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g);
  return [...new Set([...matches].map(m => m[1]))];
}

/**
 * Normalizes tags from a comma-separated string.
 * @param {string} input 
 * @returns {string[]}
 */
export function normalizeTags(input) {
  if (typeof input !== 'string') return [];
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))];
}
