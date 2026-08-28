/**
 * Client-side MF bootstrap.
 *
 * Called from `main.ts` around Angular bootstrap:
 *  - `registerMfElements()` is called BEFORE bootstrap so that the custom
 *    elements are defined before Angular creates (or upgrades) them.
 *  - `attachMfSharedServices()` is called AFTER bootstrap so that the shared
 *    event bus and the shared Apollo client are attached to the now-connected
 *    elements.
 *
 * The MF elements self-hydrate via their `connectedCallback` →
 * `hasSSRContent()` → `hydrate()` pattern, so the shell does not need to
 * re-render them.
 */
import { register as catalogRegister } from '@mf/catalog';
import { register as cartRegister } from '@mf/cart';
import { register as userRegister } from '@mf/user';
import {
  hydrate as catalogHydrate,
} from '@mf/catalog';
import { hydrate as cartHydrate } from '@mf/cart';
import { hydrate as userHydrate } from '@mf/user';
import { EventBus, type MFEventMap } from '@shared/event-bus';
import {
  createSharedApolloClient,
  type MfApolloClient,
} from '@shared/contracts';

let _eventBus: EventBus<MFEventMap> | null = null;
let _apolloClient: MfApolloClient | null = null;

/** Returns the shared event bus instance (created lazily). */
export function getSharedEventBus(): EventBus<MFEventMap> {
  if (!_eventBus) {
    _eventBus = new EventBus<MFEventMap>();
  }
  return _eventBus;
}

/**
 * The GraphQL endpoint for the shared Apollo client. Defaults to the Phase-4
 * Apollo Federation gateway; override with the `GATEWAY_URI` env var (e.g.
 * `http://localhost:4200/graphql`).
 */
function resolveGatewayUri(): string {
  return (
    (typeof process !== 'undefined' && process.env?.['GATEWAY_URI']) ||
    'http://localhost:4200/graphql'
  );
}

/**
 * Returns the shared Apollo Client instance (created lazily). A single client
 * is shared across the shell and all MFs so they use one cache and one network
 * link (see `plan.md`: "Shell bootstraps a shared Apollo `ApolloClient`
 * instance (injected into each MF via props or `window`)").
 */
export function getSharedApolloClient(): MfApolloClient {
  if (!_apolloClient) {
    _apolloClient = createSharedApolloClient({ uri: resolveGatewayUri() });
  }
  return _apolloClient;
}

/**
 * Defines the three MF custom elements. Call BEFORE Angular bootstrap so
 * that elements are upgraded (SSR) or created as custom elements (client).
 */
export async function registerMfElements(): Promise<void> {
  await Promise.all([catalogRegister(), cartRegister(), userRegister()]);
}

/**
 * Attaches the shared services (event bus + Apollo client) to the connected
 * MF elements. Call AFTER Angular bootstrap so the elements exist in the DOM.
 */
export async function attachMfSharedServices(): Promise<void> {
  const eventBus = getSharedEventBus();
  const apolloClient = getSharedApolloClient();
  await Promise.all([
    catalogHydrate({ eventBus, apolloClient }),
    cartHydrate({ eventBus, apolloClient }),
    userHydrate({ eventBus, apolloClient }),
  ]);
}
