import { beforeEach, describe, expect, test } from 'bun:test';
import {
  dismissDexToast,
  selectDexToastAction,
  showDexToast,
  subscribeDexToasts,
} from '../../src/ui/runtime/dex-toast-controller.js';

describe('dex-toast-controller', () => {
  beforeEach(() => {
    dismissDexToast();
  });

  test('deduplicates identical toast spam in short window', () => {
    let snapshot = [];
    const unsubscribe = subscribeDexToasts((next) => {
      snapshot = next;
    });

    const firstId = showDexToast({
      type: 'error',
      title: 'Network failure',
      message: 'Request timed out.',
    });
    const secondId = showDexToast({
      type: 'error',
      title: 'Network failure',
      message: 'Request timed out.',
    });

    expect(firstId).toBeString();
    expect(secondId).toBeNull();
    expect(snapshot.length).toBe(1);
    unsubscribe();
  });

  test('executes action callback on select', () => {
    let called = 0;
    const toastId = showDexToast({
      type: 'action',
      title: 'Queue item removed',
      message: 'Undo is available.',
      actions: [{
        label: 'Undo',
        onSelect: () => {
          called += 1;
        },
      }],
    });

    let snapshot = [];
    const unsubscribe = subscribeDexToasts((next) => {
      snapshot = next;
    });

    const actionId = snapshot[0]?.actions?.[0]?.id;
    expect(actionId).toBeString();
    selectDexToastAction(toastId, actionId);
    expect(called).toBe(1);
    unsubscribe();
  });

  test('dismiss without id clears all toasts', () => {
    showDexToast({ type: 'info', message: 'One' });
    showDexToast({ type: 'info', message: 'Two different message' });

    let snapshot = [];
    const unsubscribe = subscribeDexToasts((next) => {
      snapshot = next;
    });
    expect(snapshot.length).toBe(2);

    dismissDexToast();
    expect(snapshot.length).toBe(0);
    unsubscribe();
  });
});
