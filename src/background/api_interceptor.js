// API interceptor rule manager (Phase 2 skeleton with working DNR operations).
// Phase 9 will define concrete interception rules and lifecycle.

/**
 * @returns {boolean}
 */
function hasDynamicRulesApi() {
  return Boolean(chrome.declarativeNetRequest?.updateDynamicRules);
}

/**
 * Normalize and validate dynamic rules.
 * @param {any[]} rules
 * @returns {chrome.declarativeNetRequest.Rule[]}
 */
function normalizeRules(rules) {
  return rules
    .filter((rule) => rule && typeof rule === 'object')
    .map((rule) => ({ ...rule, id: Number(rule.id) }))
    .filter((rule) => Number.isInteger(rule.id) && rule.id > 0);
}

/**
 * Add or replace dynamic declarativeNetRequest rules by ID.
 * @param {chrome.declarativeNetRequest.Rule[]} rules
 * @returns {Promise<void>}
 */
export async function updateRules(rules) {
  if (!Array.isArray(rules)) {
    throw new Error('updateRules requires an array of rules.');
  }

  if (!hasDynamicRulesApi()) {
    console.warn('[DexEnhance] declarativeNetRequest API unavailable; skipping updateRules.');
    return;
  }

  const normalized = normalizeRules(rules);
  if (normalized.length === 0) {
    console.warn('[DexEnhance] No valid rules provided to updateRules.');
    return;
  }

  const removeRuleIds = normalized.map((rule) => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: normalized,
  });
}

/**
 * Remove all active dynamic declarativeNetRequest rules.
 * @returns {Promise<void>}
 */
export async function clearRules() {
  if (!hasDynamicRulesApi()) {
    console.warn('[DexEnhance] declarativeNetRequest API unavailable; skipping clearRules.');
    return;
  }

  const activeRules = await chrome.declarativeNetRequest.getDynamicRules();
  if (activeRules.length === 0) {
    return;
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: activeRules.map((rule) => rule.id),
    addRules: [],
  });
}
