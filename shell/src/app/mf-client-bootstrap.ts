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
import { register as catalogRegister } from '@jrumandal/catalog';
import { register as cartRegister } from '@jrumandal/cart';
import { register as userRegister } from '@jrumandal/user';
import { hydrate as catalogHydrate } from '@jrumandal/catalog';
import { hydrate as cartHydrate } from '@jrumandal/cart';
import { hydrate as userHydrate } from '@jrumandal/user';
import { EventBus, type MFEventMap } from '@jrumandal/event-bus';
import {
  createSharedApolloClient,
  type MfApolloClient,
} from '@jrumandal/contracts';
import { getBridgeAdapter } from '@jrumandal/bridge';

let _eventBus: EventBus<MFEventMap> | null = null;
let _apolloClient: MfApolloClient | null = null;
let _bridgeAdapter: ReturnType<typeof getBridgeAdapter> | null = null;

/** Returns the shared event bus instance (created lazily). */
export function getSharedEventBus(): EventBus<MFEventMap> {
  if (!_eventBus) {
    _eventBus = new EventBus<MFEventMap>();
  }
  return _eventBus;
}

/**
 * Returns the shared bridge adapter instance (created lazily).
 *
 * This is a **direct** dependency of the shell (not just a transitive
 * dependency of `@jrumandal/catalog`) so that the build bundles it from source
 * rather than pre-bundling it with esbuild (which fails on the
 * source-only TypeScript package).
 */
export function getSharedBridgeAdapter() {
  if (!_bridgeAdapter) {
    _bridgeAdapter = getBridgeAdapter();
  }
  return _bridgeAdapter;
}

/**
 * The GraphQL endpoint for the shared Apollo client. Defaults to the
 * Apollo Federation gateway; override with the `GATEWAY_URI` env var
 * (e.g. `http://localhost:4200/graphql`).
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
 * link.
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
