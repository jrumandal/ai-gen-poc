import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createSharedApolloClient,
  createContractClients,
} from '../src/index.ts';

test('createSharedApolloClient returns an ApolloClient with a cache', () => {
  const client = createSharedApolloClient({ uri: 'http://localhost:4200/graphql' });
  assert.equal(typeof client.query, 'function');
  assert.equal(typeof client.watchQuery, 'function');
  assert.equal(typeof client.mutate, 'function');
  assert.ok(client.cache);
});

test('createSharedApolloClient applies default watchQuery fetchPolicy', () => {
  const client = createSharedApolloClient({ uri: 'http://localhost:4200/graphql' });
  const defaults = client.defaultOptions;
  assert.equal(defaults.watchQuery.fetchPolicy, 'cache-and-network');
});

test('createContractClients returns one client per service', () => {
  const clients = createContractClients({
    catalog: 'http://localhost:4001',
    cart: 'http://localhost:4002',
    user: 'http://localhost:4003',
  });
  assert.ok(clients.catalog);
  assert.ok(clients.cart);
  assert.ok(clients.user);
  for (const c of [clients.catalog, clients.cart, clients.user]) {
    assert.equal(typeof c.get, 'function');
    assert.equal(typeof c.post, 'function');
    assert.equal(typeof c.put, 'function');
    assert.equal(typeof c.delete, 'function');
  }
});
