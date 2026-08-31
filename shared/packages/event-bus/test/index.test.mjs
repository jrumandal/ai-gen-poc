import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EventBus,
  defaultEventBus,
  MF_EVENT_NAMES,
  CartEvent,
} from '../src/index.ts';

test('on/emit dispatches payload to subscribers', () => {
  const bus = new EventBus();
  const received = [];
  bus.on('cart:updated', (p) => received.push(p));

  bus.emit('cart:updated', { itemCount: 1, subtotal: { amount: 10, currency: 'USD' } });

  assert.equal(received.length, 1);
  assert.equal(received[0].itemCount, 1);
});

test('on returns an unsubscribe function', () => {
  const bus = new EventBus();
  const received = [];
  const off = bus.on('cart:updated', (p) => received.push(p));

  bus.emit('cart:updated', { itemCount: 1, subtotal: { amount: 1, currency: 'USD' } });
  off();
  bus.emit('cart:updated', { itemCount: 2, subtotal: { amount: 2, currency: 'USD' } });

  assert.equal(received.length, 1);
});

test('off removes a specific handler by reference', () => {
  const bus = new EventBus();
  let a = 0;
  let b = 0;
  const handlerA = () => {
    a += 1;
  };
  const handlerB = () => {
    b += 1;
  };
  bus.on('cart:updated', handlerA);
  bus.on('cart:updated', handlerB);

  bus.off('cart:updated', handlerA);
  bus.emit('cart:updated', { itemCount: 0, subtotal: { amount: 0, currency: 'USD' } });

  assert.equal(a, 0);
  assert.equal(b, 1);
});

test('once fires exactly one time', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.once('cart:updated', () => {
    calls += 1;
  });

  bus.emit('cart:updated', { itemCount: 1, subtotal: { amount: 1, currency: 'USD' } });
  bus.emit('cart:updated', { itemCount: 2, subtotal: { amount: 2, currency: 'USD' } });

  assert.equal(calls, 1);
});

test('listenerCount reflects registered handlers', () => {
  const bus = new EventBus();
  assert.equal(bus.listenerCount('cart:updated'), 0);
  const off = bus.on('cart:updated', () => {});
  assert.equal(bus.listenerCount('cart:updated'), 1);
  off();
  assert.equal(bus.listenerCount('cart:updated'), 0);
});

test('defaultEventBus is a shared singleton', () => {
  const received = [];
  const off = defaultEventBus.on('cart:updated', (p) => received.push(p));
  defaultEventBus.emit('cart:updated', { itemCount: 3, subtotal: { amount: 3, currency: 'USD' } });
  off();
  assert.equal(received.length, 1);
});

test('MF_EVENT_NAMES exposes all contract event names', () => {
  assert.ok(MF_EVENT_NAMES.includes('cart:updated'));
  assert.ok(MF_EVENT_NAMES.includes('catalog:productViewed'));
  assert.ok(MF_EVENT_NAMES.includes('user:signedIn'));
  assert.equal(MF_EVENT_NAMES.length, 9);
});

test('CartEvent const map matches its keys', () => {
  assert.equal(CartEvent['cart:updated'], 'cart:updated');
  assert.equal(CartEvent['cart:cleared'], 'cart:cleared');
});
