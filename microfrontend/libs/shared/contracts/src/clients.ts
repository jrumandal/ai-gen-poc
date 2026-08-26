import createClient from 'openapi-fetch';

import type { paths as CartPaths } from './generated/cart';
import type { paths as CatalogPaths } from './generated/catalog';
import type { paths as UserPaths } from './generated/user';

export type ContractClients = {
  catalog: ReturnType<typeof createClient<CatalogPaths>>;
  cart: ReturnType<typeof createClient<CartPaths>>;
  user: ReturnType<typeof createClient<UserPaths>>;
};

export function createContractClients(baseUrls: {
  catalog: string;
  cart: string;
  user: string;
}): ContractClients {
  return {
    catalog: createClient<CatalogPaths>({ baseUrl: baseUrls.catalog }),
    cart: createClient<CartPaths>({ baseUrl: baseUrls.cart }),
    user: createClient<UserPaths>({ baseUrl: baseUrls.user }),
  };
}
