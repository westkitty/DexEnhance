import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_HUD_SETTINGS,
  normalizeHudSettings,
  updatePanelInSettings,
} from '../../src/lib/ui-settings.js';
import { filterCommands } from '../../src/ui/components/CommandPalette.jsx';

describe('ui-settings migration', () => {
  test('migrates legacy fab and prompt library geometry into launcher and drawer shell settings', () => {
    const legacy = {
      accentHue: 202,
      panels: {
        fab: { x: 900, y: 620, width: 72, height: 72 },
        promptLibrary: { x: 120, y: 80, width: 560, height: 500 },
      },
      visibility: {
        welcome: false,
        fab: true,
      },
    };

    const normalized = normalizeHudSettings(legacy, { width: 1280, height: 760 });

    expect(normalized.themePreset).toBe(DEFAULT_HUD_SETTINGS.themePreset);
    expect(normalized.visibility.launcher).toBe(true);
    expect(normalized.panels.launcher.width).toBe(72);
    expect(normalized.drawer.width).toBe(560);
    expect(normalized.panels.drawer.width).toBe(560);
  });

  test('keeps drawer width clamped when updated beyond viewport bounds', () => {
    const base = normalizeHudSettings({}, { width: 900, height: 700 });
    const updated = updatePanelInSettings(base, 'drawer', { width: 1200 }, { width: 900, height: 700 });

    expect(updated.drawer.width).toBeLessThanOrEqual(720);
    expect(updated.panels.drawer.width).toBe(updated.drawer.width);
  });
});

describe('command palette filtering', () => {
  const commands = [
    {
      id: 'open-prompts',
      title: 'Open Prompt Library',
      subtitle: 'Saved prompts and templates',
      group: 'Navigate',
      keywords: ['prompt', 'template'],
    },
    {
      id: 'inject-context',
      title: 'Inject Context',
      subtitle: 'Semantic Clipboard action',
      group: 'Actions',
      keywords: ['semantic', 'clipboard'],
    },
  ];

  test('returns all commands for empty query', () => {
    expect(filterCommands(commands, '').length).toBe(2);
  });

  test('matches commands by title', () => {
    const result = filterCommands(commands, 'prompt');
    expect(result.map((command) => command.id)).toEqual(['open-prompts']);
  });

  test('matches commands by keyword and subtitle text', () => {
    const result = filterCommands(commands, 'clipboard');
    expect(result.map((command) => command.id)).toEqual(['inject-context']);
  });
});
