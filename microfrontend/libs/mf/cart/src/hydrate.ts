import type { EventBus, MFEventMap } from '@shared/event-bus';
import { register } from './register';

/**
 * Hydrate the `<cart-mf>` custom element(s) on the client.
 *
 * This is the client-side hydration entry point for the cart MF. It:
 *
 *  1. Registers the `<cart-mf>` custom element (idempotent).
 *  2. Attaches the shared `eventBus` to every existing `<cart-mf>` element so
 *     cross-MF events flow.
 *
 * The element's `connectedCallback` detects existing SSR markup and calls
 * `hydrateRoot` to attach React event handlers without re-rendering the DOM.
 *
 * @param options - Optional configuration (e.g. the shared event bus).
 */
export async function hydrate(options?: {
  eventBus?: EventBus<MFEventMap> | null;
}): Promise<void> {
  await register();

  const elements = document.querySelectorAll('cart-mf');
  elements.forEach((el) => {
    const cartEl = el as HTMLElement & { eventBus?: EventBus<MFEventMap> | null };
    if (options?.eventBus) {
      cartEl.eventBus = options.eventBus;
    }
  });
}
