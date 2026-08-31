/**
 * @shared/contracts — the canonical home of the shared domain types and the
 * shared GraphQL client for the micro-frontend architecture.
 *
 * MFs consume these types (via `import type`) and the shared Apollo client so
 * all frameworks (Angular, React, Vue) share a single source of truth for the
 * catalog, cart, and user/order domains.
 */
export * from './types.ts';
export * from './apollo.ts';
export * from './clients.ts';
