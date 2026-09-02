import type { EventBus, MFEventMap } from '@jrumandal/event-bus';
import type { MfApolloClient } from '@jrumandal/contracts';
import { register } from './register';

/**
 * Hydrate the `<mf-cart>` custom element(s) on the client.
 *
 * This is the client-side hydration entry point for the cart MF. It:
 *
 *  1. Registers the `<mf-cart>` custom element (idempotent).
 *  2. Attaches the shared `eventBus` to every existing `<mf-cart>` element so
 *     cross-MF events flow.
 *  3. Attaches the shared `apolloClient` so the component can issue typed
 *     GraphQL queries/mutations against the gateway.
 *
 * The element's `connectedCallback` detects existing SSR markup and calls
 * `hydrateRoot` to attach React event handlers without re-rendering the DOM.
 *
 * @param options - Optional configuration (shared event bus + Apollo client).
 */
export async function hydrate(options?: {
  eventBus?: EventBus<MFEventMap> | null;
  apolloClient?: MfApolloClient | null;
}): Promise<void> {
  await register();

  const elements = document.querySelectorAll('mf-cart');
  elements.forEach((el) => {
    const cartEl = el as HTMLElement & {
      eventBus?: EventBus<MFEventMap> | null;
      apolloClient?: MfApolloClient | null;
    };
    if (options?.eventBus) {
      cartEl.eventBus = options.eventBus;
    }
    if (options?.apolloClient) {
      cartEl.apolloClient = options.apolloClient;
    }
  });
}
