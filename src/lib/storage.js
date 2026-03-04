// src/lib/storage.js
// Chrome MV3: chrome.storage.local is natively Promise-based.
// No callbacks, no polyfills required.
// Available in both content scripts and service worker contexts.

const storage = chrome.storage.local;

/**
 * Get one or more values from chrome.storage.local.
 * @param {string|string[]|null} keys - Key(s) to retrieve. Pass null to get all.
 * @returns {Promise<Record<string, any>>}
 */
export async function storageGet(keys) {
  return storage.get(keys);
}

/**
 * Get a single value by key. Returns undefined if the key does not exist.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function storageGetOne(key) {
  const result = await storage.get(key);
  return result[key];
}

/**
 * Set one or more key-value pairs in chrome.storage.local.
 * @param {Record<string, any>} items
 * @returns {Promise<void>}
 */
export async function storageSet(items) {
  return storage.set(items);
}

/**
 * Remove one or more keys from chrome.storage.local.
 * @param {string|string[]} keys
 * @returns {Promise<void>}
 */
export async function storageRemove(keys) {
  return storage.remove(keys);
}

/**
 * Clear ALL data from chrome.storage.local.
 * Use with caution — this wipes all extension data for the user.
 * @returns {Promise<void>}
 */
export async function storageClear() {
  return storage.clear();
}

/**
 * Subscribe to storage change events.
 * Fires whenever any key changes in chrome.storage.local.
 * @param {function} callback - (changes: {[key]: {oldValue, newValue}}, areaName: string) => void
 */
export function onStorageChange(callback) {
  chrome.storage.onChanged.addListener(callback);
}
