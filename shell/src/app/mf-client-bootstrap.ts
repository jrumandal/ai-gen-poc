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
import { gql } from '@apollo/client';
import { EventBus, type MFEventMap } from '@jrumandal/event-bus';
import {
  createSharedApolloClient,
  type MfApolloClient,
  type Product,
  type Category,
  type Cart,
  type User,
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

/* ------------------------------------------------------------------ */
/* Client-side data loading                                            */
/* ------------------------------------------------------------------ */

/**
 * The MFs are purely presentational: they render whatever data the shell sets
 * on them. During SSR the shell injects sample data; on the client the shell
 * must fetch real data from the gateway and set it on the elements, otherwise
 * the elements re-render with their initial (empty) state and the SSR markup
 * is wiped.
 *
 * This function fetches the catalog, user, and cart data from the gateway
 * (via the shared Apollo client) and sets it on the connected MF elements.
 * Call AFTER `attachMfSharedServices()` so the elements exist in the DOM.
 */
export async function loadMfData(): Promise<void> {
  if (typeof document === 'undefined') return;
  const apolloClient = getSharedApolloClient();

  // ---- Catalog (products + categories) ----
  try {
    const { data } = await apolloClient.query<{
      products: Product[];
      categories: Category[];
    }>({
      query: gql`
        query Catalog {
          products {
            id
            name
            description
            price {
              amount
              currency
            }
            imageUrl
            inStock
            categories {
              id
              name
              slug
            }
          }
          categories {
            id
            name
            slug
          }
        }
      `,
    });
    const products = data?.products ?? [];
    const categories = data?.categories ?? [];
    document.querySelectorAll('mf-catalog').forEach((el) => {
      const target = el as unknown as {
        products: Product[];
        categories: Category[];
      };
      target.products = products;
      target.categories = categories;
    });
  } catch (err) {
    console.warn('[mf] failed to load catalog data', err);
  }

  // ---- User + Cart ----
  try {
    const { data } = await apolloClient.query<{ me: User | null }>({
      query: gql`
        query Me {
          me {
            id
            name
            email
            address {
              line1
              city
              state
              postalCode
              country
            }
          }
        }
      `,
    });
    const user = data?.me ?? null;
    if (user) {
      document.querySelectorAll('mf-user').forEach((el) => {
        (el as unknown as { user: User | null }).user = user;
      });

      // Resolve the cart from the user id (no hard-coded cart id).
      const { data: cartData } = await apolloClient.query<{
        cartForUser: Cart | null;
      }>({
        query: gql`
          query CartForUser($userId: ID!) {
            cartForUser(userId: $userId) {
              id
              itemCount
              subtotal {
                amount
                currency
              }
              items {
                id
                productId
                quantity
                unitPrice {
                  amount
                  currency
                }
                product {
                  id
                  name
                  imageUrl
                }
              }
            }
          }
        `,
        variables: { userId: user.id },
      });
      const cart = cartData?.cartForUser ?? null;
      if (cart) {
        document.querySelectorAll('mf-cart').forEach((el) => {
          (el as unknown as { cart: Cart | null }).cart = cart;
        });
      }
    }
  } catch (err) {
    console.warn('[mf] failed to load user/cart data', err);
  }
}
