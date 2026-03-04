import { test, expect, describe } from 'bun:test';
import { createQueue } from '../../src/content/shared/queue.js';

// Phase 6: src/content/shared/queue.js — FIFO message queue

describe('createQueue', () => {
  test('creates an empty queue', () => {
    const q = createQueue();
    expect(q.isEmpty()).toBe(true);
    expect(q.size()).toBe(0);
  });

  test('isEmpty returns false after enqueue', () => {
    const q = createQueue();
    q.enqueue('msg');
    expect(q.isEmpty()).toBe(false);
  });

  test('size increments with each enqueue', () => {
    const q = createQueue();
    q.enqueue('a');
    expect(q.size()).toBe(1);
    q.enqueue('b');
    expect(q.size()).toBe(2);
    q.enqueue('c');
    expect(q.size()).toBe(3);
  });

  test('dequeue returns messages in FIFO order', () => {
    const q = createQueue();
    q.enqueue('first');
    q.enqueue('second');
    q.enqueue('third');
    expect(q.dequeue()).toBe('first');
    expect(q.dequeue()).toBe('second');
    expect(q.dequeue()).toBe('third');
  });

  test('dequeue decrements size', () => {
    const q = createQueue();
    q.enqueue('a');
    q.enqueue('b');
    q.dequeue();
    expect(q.size()).toBe(1);
  });

  test('dequeue returns undefined when queue is empty', () => {
    const q = createQueue();
    expect(q.dequeue()).toBeUndefined();
  });

  test('isEmpty returns true after all items dequeued', () => {
    const q = createQueue();
    q.enqueue('only');
    q.dequeue();
    expect(q.isEmpty()).toBe(true);
  });

  test('peek returns front item without removing it', () => {
    const q = createQueue();
    q.enqueue('front');
    q.enqueue('back');
    expect(q.peek()).toBe('front');
    expect(q.size()).toBe(2); // not removed
  });

  test('peek returns undefined on empty queue', () => {
    const q = createQueue();
    expect(q.peek()).toBeUndefined();
  });

  test('multiple queues are independent', () => {
    const q1 = createQueue();
    const q2 = createQueue();
    q1.enqueue('q1-msg');
    expect(q2.isEmpty()).toBe(true);
    expect(q1.size()).toBe(1);
  });
});
