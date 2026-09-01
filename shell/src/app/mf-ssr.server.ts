/**
 * Server-side MF rendering.
 *
 * Pre-renders the three micro-frontends to HTML at server module-load time
 * (see `main.server.ts`) and exposes the result through the `MF_SSR_HTML`
 * injection token. This is the SSR path: the MFs are rendered on the server
 * and their markup is injected into the page components during the initial
 * SSR pass.
 *
 * The MFs are purely presentational: they render whatever data the shell
 * passes to them. For SSR we pass sample data (the shell has no real data
 * on the server). On the client, the shell fetches real data and sets it on
 * the elements (see `mf-client-bootstrap.ts`).
 *
 * This file is only imported by `main.server.ts` (the server entry), so it
 * is never bundled into the client.
 */
import { render as renderCatalog, type CatalogProps } from '@mf/catalog';
import { render as renderCart, type CartProps } from '@mf/cart';
import { render as renderUser, type UserPanelProps } from '@mf/user';
import { getBridgeAdapter } from '@jrumandal/bridge';
import { MF_SSR_HTML, type MfSsrHtml } from './mf-ssr-token';
import type { ApplicationConfig } from '@angular/core';

/**
 * Returns the shared bridge adapter instance (created lazily).
 *
 * This is a **direct** dependency of the shell (not just a transitive
 * dependency of `@mf/catalog`) so that the build bundles it from source
 * rather than pre-bundling it with esbuild (which fails on the
 * source-only TypeScript package).
 */
export function getSharedBridgeAdapter() {
  return getBridgeAdapter();
}

/**
 * Sample catalog data for SSR. The shell has no real data on the server, so
 * we pass a small, representative dataset. On the client, the shell fetches
 * real data and sets it on the elements.
 */
const SAMPLE_CATALOG_PROPS: CatalogProps = {
  products: [
    {
      id: 'p-1',
      name: 'Mechanical Keyboard',
      description: 'Hot-swappable, RGB backlit',
      price: { amount: 129.99, currency: 'USD' },
      imageUrl: 'https://example.com/images/keyboard.jpg',
      inStock: true,
      categories: [{ id: 'c-1', name: 'Peripherals', slug: 'peripherals', children: [] }],
    },
    {
      id: 'p-2',
      name: 'USB-C Hub',
      description: '7-in-1, 100W PD',
      price: { amount: 49.99, currency: 'USD' },
      imageUrl: 'https://example.com/images/hub.jpg',
      inStock: true,
      categories: [{ id: 'c-2', name: 'Displays', slug: 'displays', children: [] }],
    },
  ],
  categories: [
    { id: 'c-1', name: 'Peripherals', slug: 'peripherals', children: [] },
    { id: 'c-2', name: 'Displays', slug: 'displays', children: [] },
  ],
};

/** Sample cart data for SSR. */
const SAMPLE_CART_PROPS: CartProps = {
  cart: {
    id: 'cart-1',
    itemCount: 1,
    subtotal: { amount: 129.99, currency: 'USD' },
    items: [
      {
        id: 'ci-1',
        productId: 'p-1',
        quantity: 1,
        unitPrice: { amount: 129.99, currency: 'USD' },
        product: {
          id: 'p-1',
          name: 'Mechanical Keyboard',
          imageUrl: 'https://example.com/images/keyboard.jpg',
        },
      },
    ],
  },
};

/** Sample user data for SSR. */
const SAMPLE_USER_PROPS: UserPanelProps = {
  user: {
    id: 'u-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    address: {
      line1: '12 Analytical Way',
      city: 'London',
      state: null,
      postalCode: 'EC1A 1BB',
      country: 'United Kingdom',
    },
  },
};

/**
 * Renders all three micro-frontends to HTML.
 *
 * This is called once at server module-load time (see `main.server.ts`) and
 * the result is cached in a module-level variable. Subsequent calls return
 * the cached result.
 */
let _ssrHtml: MfSsrHtml | null = null;

export async function renderMfSsrHtml(): Promise<MfSsrHtml> {
  if (_ssrHtml) {
    return _ssrHtml;
  }
  const [catalog, cart, user] = await Promise.all([
    renderCatalog(SAMPLE_CATALOG_PROPS),
    renderCart(SAMPLE_CART_PROPS),
    renderUser(SAMPLE_USER_PROPS),
  ]);
  _ssrHtml = { catalog, cart, user };
  return _ssrHtml;
}

/**
 * Returns an `ApplicationConfig` that provides the pre-rendered SSR HTML
 * through the `MF_SSR_HTML` injection token.
 *
 * This is merged into the server config in `main.server.ts` so page
 * components can bind the markup synchronously during the initial SSR pass.
 */
export function provideMfSsrHtml(html: MfSsrHtml): ApplicationConfig {
  return {
    providers: [{ provide: MF_SSR_HTML, useValue: html }],
  };
}
