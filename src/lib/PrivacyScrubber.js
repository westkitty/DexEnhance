/**
 * PrivacyScrubber.js
 * Utility for redacting sensitive information from LLM prompts.
 */

const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  IPV4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  API_KEY: /\b(?:sk|pk|key)-[a-zA-Z0-9]{32,}\b/g,
  PHONE: /\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
};

/**
 * Redacts matches in text with a placeholder.
 * @param {string} text 
 * @returns {string}
 */
export function scrubText(text) {
  if (typeof text !== 'string') return '';
  
  let scrubbed = text;
  
  scrubbed = scrubbed.replace(PATTERNS.EMAIL, '[REDACTED_EMAIL]');
  scrubbed = scrubbed.replace(PATTERNS.CREDIT_CARD, '[REDACTED_CARD]');
  scrubbed = scrubbed.replace(PATTERNS.IPV4, '[REDACTED_IP]');
  scrubbed = scrubbed.replace(PATTERNS.API_KEY, '[REDACTED_KEY]');
  scrubbed = scrubbed.replace(PATTERNS.PHONE, '[REDACTED_PHONE]');
  
  return scrubbed;
}

/**
 * Checks if text contains potentially sensitive data.
 * @param {string} text 
 * @returns {string[]} List of detected types.
 */
export function detectSensitiveData(text) {
  const detected = [];
  if (PATTERNS.EMAIL.test(text)) detected.push('email');
  if (PATTERNS.CREDIT_CARD.test(text)) detected.push('credit_card');
  if (PATTERNS.API_KEY.test(text)) detected.push('api_key');
  return detected;
}
