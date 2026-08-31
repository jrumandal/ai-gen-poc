import type { MFEventMap } from './event-contract.ts';

/**
 * A stored listener entry.
 *
 * - `identity` keeps the original handler reference so `off()` can match it.
 * - `invoke` is the closure that actually dispatches the payload to the
 *   handler.
 */
type StoredHandler = {
  identity: unknown;
  invoke: (payload: unknown) => void;
};

/**
 * A thin, typed, dependency-free event bus.
 *
 * - Generic `E` is an event map: `{ [eventName]: payloadType }`.
 * - `emit` / `on` / `once` / `off` are fully typed against that map.
 * - Backed by an internal listener registry (NOT the DOM `EventTarget`), so it
 *   behaves identically in the browser, in jsdom (tests), in Node SSR, and in
 *   web workers — no `window` / `CustomEvent` required.
 *
 * This is intentionally a small, dependency-free class: every micro-frontend
 * gets the same contract without importing each other.
 */
export class EventBus<E extends Record<string, unknown> = MFEventMap> {
  private readonly listeners = new Map<string, StoredHandler[]>();

  /**
   * Dispatch `payload` to every handler registered for `name`.
   *
   * Handlers that unsubscribe mid-dispatch are handled safely (we iterate a
   * snapshot of the listener list).
   */
  emit<K extends keyof E & string>(name: K, payload: E[K]): void {
    const list = this.listeners.get(name);
    if (!list) return;
    for (const entry of [...list]) {
      entry.invoke(payload);
    }
  }

  /**
   * Subscribe `handler` to `name`. Returns an unsubscribe function.
   */
  on<K extends keyof E & string>(
    name: K,
    handler: (payload: E[K]) => void,
  ): () => void {
    const entry: StoredHandler = {
      identity: handler,
      invoke: (payload: unknown) => handler(payload as E[K]),
    };
    const list = this.listeners.get(name) ?? [];
    list.push(entry);
    this.listeners.set(name, list);
    return () => this.remove(name, entry);
  }

  /**
   * Subscribe `handler` to `name` for a single dispatch. The returned
   * function also unsubscribes early if called before the event fires.
   */
  once<K extends keyof E & string>(
    name: K,
    handler: (payload: E[K]) => void,
  ): () => void {
    let unsubscribe: () => void = () => {};
    unsubscribe = this.on(name, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  /**
   * Unsubscribe a specific `handler` previously registered via `on()`.
   * Matches by handler reference, so it works even when the caller did not
   * retain the unsubscribe function returned by `on()`.
   */
  off<K extends keyof E & string>(
    name: K,
    handler: (payload: E[K]) => void,
  ): void {
    const list = this.listeners.get(name);
    if (!list) return;
    const idx = list.findIndex((entry) => entry.identity === handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  /** Number of handlers currently subscribed to `name`. */
  listenerCount(name: string): number {
    return this.listeners.get(name)?.length ?? 0;
  }

  /** Remove a specific stored entry (used by the `on()` unsubscribe closure). */
  private remove(name: string, entry: StoredHandler): void {
    const list = this.listeners.get(name);
    if (!list) return;
    const idx = list.indexOf(entry);
    if (idx !== -1) list.splice(idx, 1);
  }
}

/**
 * The shared, workspace-wide bus instance.
 *
 * Every micro-frontend should import this singleton (not create its own) so
 * that events emitted by one MF are observed by the others.
 */
export const defaultEventBus = new EventBus<MFEventMap>();

export type { MFEventMap };
