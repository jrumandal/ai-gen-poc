import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

/**
 * The shared Apollo Client instance type used across the shell and all
 * micro-frontends.
 *
 * A single `ApolloClient` is bootstrapped by the shell (see
 * `apps/shell/src/app/mf-client-bootstrap.ts`) and injected into each MF via
 * the `hydrate()` options. MFs consume only the *type* (erased at runtime via
 * `import type`), so they do not each need a direct `@apollo/client`
 * dependency — `@shared/contracts` is the canonical home of the shared
 * GraphQL client (see `plan.md`: "Each MF consumes the shared GraphQL client
 * (`libs/shared/contracts`) for typed queries/mutations.").
 *
 * `ApolloClient` without an explicit generic defaults to
 * `ApolloClient<NormalizedCacheObject>`, the standard normalized-cache shape.
 */
export type MfApolloClient = ApolloClient;

export interface SharedApolloClientOptions {
  /**
   * The GraphQL endpoint to query — the Phase-4 Apollo Federation gateway
   * (e.g. `http://localhost:4200/graphql`).
   */
  uri: string;
  /** Additional HTTP headers sent with every request (e.g. auth tokens). */
  headers?: Record<string, string>;
  /**
   * `fetch` credentials mode for cross-origin gateway requests. Defaults to
   * `same-origin`.
   */
  credentials?: RequestCredentials;
}

/**
 * Create the shared Apollo Client instance.
 *
 * This is the canonical factory for the shared GraphQL client. The shell calls
 * it once at bootstrap and injects the resulting client into every MF, so all
 * frameworks (Angular, React, Vue) share a single cache and a single network
 * link.
 */
export function createSharedApolloClient(options: SharedApolloClientOptions): MfApolloClient {
  const link = new HttpLink({
    uri: options.uri,
    headers: options.headers,
    credentials: options.credentials ?? 'same-origin',
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}
