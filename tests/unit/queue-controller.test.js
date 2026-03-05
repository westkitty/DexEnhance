import { beforeAll, describe, expect, test } from 'bun:test';
import { setupQueueController } from '../../src/content/shared/queue-controller.js';

class MockAdapter {
  constructor() {
    this._startHandlers = [];
    this._endHandlers = [];
  }

  isGenerating() {
    return false;
  }

  getTextarea() {
    return null;
  }

  getSubmitButton() {
    return null;
  }

  onGeneratingStart(callback) {
    this._startHandlers.push(callback);
    return () => {};
  }

  onGeneratingEnd(callback) {
    this._endHandlers.push(callback);
    return () => {};
  }
}

beforeAll(() => {
  if (!globalThis.window) {
    globalThis.window = globalThis;
  }
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  }
});

describe('queue-controller state operations', () => {
  test('pause/resume toggles state', () => {
    const controller = setupQueueController({ adapter: new MockAdapter(), siteLabel: 'Test' });
    controller.pause();
    expect(controller.getState().paused).toBe(true);
    controller.resume();
    expect(controller.getState().paused).toBe(false);
    controller.destroy();
  });

  test('remove/clear/restore supports undo flows', () => {
    const controller = setupQueueController({ adapter: new MockAdapter(), siteLabel: 'Test' });
    const first = controller.enqueue('First prompt', 'test');
    const second = controller.enqueue('Second prompt', 'test');

    expect(controller.getState().items.length).toBe(2);
    const removed = controller.removeItem(first.id);
    expect(removed.id).toBe(first.id);
    expect(controller.getState().items.length).toBe(1);

    const cleared = controller.clearAll();
    expect(cleared.length).toBe(1);
    expect(controller.getState().items.length).toBe(0);

    controller.restoreItems([removed, second]);
    expect(controller.getState().items.length).toBe(2);
    controller.destroy();
  });

  test('moveItem reorders queue entries', () => {
    const controller = setupQueueController({ adapter: new MockAdapter(), siteLabel: 'Test' });
    const one = controller.enqueue('One', 'test');
    const two = controller.enqueue('Two', 'test');
    const three = controller.enqueue('Three', 'test');

    const moved = controller.moveItem(three.id, 'up');
    expect(moved).toBe(true);

    const ids = controller.getState().items.map((item) => item.id);
    expect(ids).toEqual([one.id, three.id, two.id]);
    controller.destroy();
  });
});
