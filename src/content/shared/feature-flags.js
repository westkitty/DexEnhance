import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { FEATURE_SETTINGS_KEY, normalizeFeatureSettings } from '../../lib/feature-settings.js';

export async function fetchFeatureSettings() {
  const response = await sendRuntimeMessage(MESSAGE_ACTIONS.FEATURE_SETTINGS_GET, {});
  if (!response.ok) {
    return normalizeFeatureSettings({});
  }
  return normalizeFeatureSettings(response.data);
}

export function watchFeatureSettings(onChange) {
  const listener = (changes, areaName) => {
    if (areaName !== 'local') return;
    if (!changes[FEATURE_SETTINGS_KEY]) return;
    onChange(normalizeFeatureSettings(changes[FEATURE_SETTINGS_KEY].newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
