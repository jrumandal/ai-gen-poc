import { EventBus } from './event-bus';
import {
  CartEvent,
  CartUpdatedPayload,
  MF_EVENT_NAMES,
  MFEventMap,
  UserEvent,
} from './event-contract';

describe('EventBus', () => {
  it('emits and receives a typed event', () => {
    const bus = new EventBus<MFEventMap>();
    const received: CartUpdatedPayload[] = [];

    const off = bus.on(CartEvent['cart:updated'], (payload) => {
      received.push(payload);
    });

    const payload: CartUpdatedPayload = {
      itemCount: 2,
      subtotal: { amount: 40, currency: 'USD' },
    };
    bus.emit(CartEvent['cart:updated'], payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);

    off();
    bus.emit(CartEvent['cart:updated'], payload);
    expect(received).toHaveLength(1);
  });

  it('once fires exactly one time', () => {
    const bus = new EventBus<MFEventMap>();
    let count = 0;

    bus.once(UserEvent['user:signedIn'], () => {
      count += 1;
    });

    bus.emit(UserEvent['user:signedIn'], { userId: 'u-1' });
    bus.emit(UserEvent['user:signedIn'], { userId: 'u-1' });

    expect(count).toBe(1);
  });

  it('isolates listeners per event name', () => {
    const bus = new EventBus<MFEventMap>();
    let cartHits = 0;
    let userHits = 0;

    bus.on(CartEvent['cart:updated'], () => {
      cartHits += 1;
    });
    bus.on(UserEvent['user:signedIn'], () => {
      userHits += 1;
    });

    bus.emit(CartEvent['cart:updated'], {
      itemCount: 1,
      subtotal: { amount: 10, currency: 'USD' },
    });
    bus.emit(UserEvent['user:signedIn'], { userId: 'u-2' });

    expect(cartHits).toBe(1);
    expect(userHits).toBe(1);
  });

  it('off() removes the specific handler by reference', () => {
    const bus = new EventBus<MFEventMap>();
    const received: CartUpdatedPayload[] = [];

    const handler = (payload: CartUpdatedPayload) => {
      received.push(payload);
    };

    bus.on(CartEvent['cart:updated'], handler);
    bus.on(CartEvent['cart:updated'], (payload) => {
      received.push({ ...payload, itemCount: payload.itemCount + 100 });
    });

    const payload: CartUpdatedPayload = {
      itemCount: 1,
      subtotal: { amount: 5, currency: 'USD' },
    };

    // Two listeners → two entries.
    bus.emit(CartEvent['cart:updated'], payload);
    expect(received).toHaveLength(2);

    // Remove only the first handler.
    bus.off(CartEvent['cart:updated'], handler);

    received.length = 0;
    bus.emit(CartEvent['cart:updated'], payload);
    expect(received).toHaveLength(1);
    expect(received[0].itemCount).toBe(101);
  });

  it('listenerCount reflects subscriptions', () => {
    const bus = new EventBus<MFEventMap>();
    const name = CartEvent['cart:updated'];

    expect(bus.listenerCount(name)).toBe(0);

    const off1 = bus.on(name, () => {});
    expect(bus.listenerCount(name)).toBe(1);

    bus.on(name, () => {});
    expect(bus.listenerCount(name)).toBe(2);

    off1();
    expect(bus.listenerCount(name)).toBe(1);
  });
});

describe('event contract', () => {
  it('exposes a stable, non-empty event name list', () => {
    expect(MF_EVENT_NAMES.length).toBeGreaterThan(0);
    expect(new Set(MF_EVENT_NAMES).size).toBe(MF_EVENT_NAMES.length);
  });
});
