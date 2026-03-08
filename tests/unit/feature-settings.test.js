import { describe, expect, test } from 'bun:test';
import { normalizeFeatureSettings, updateFeatureModule } from '../../src/lib/feature-settings.js';

describe('feature-settings defaults', () => {
  test('required shipped features default to enabled', () => {
    const normalized = normalizeFeatureSettings({});

    expect(normalized.modules.semanticClipboard.enabled).toBe(true);
    expect(normalized.modules.popoutCanvas.enabled).toBe(true);
    expect(normalized.modules.tokenOverlay.enabled).toBe(true);
  });

  test('token overlay module accepts compact mode updates', () => {
    const updated = updateFeatureModule(normalizeFeatureSettings({}), 'tokenOverlay', { compactMode: false });

    expect(updated.modules.tokenOverlay.enabled).toBe(true);
    expect(updated.modules.tokenOverlay.compactMode).toBe(false);
  });
});
