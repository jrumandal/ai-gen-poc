/**
 * Server-side MF pre-rendering.
 *
 * This module is imported by `main.server.ts` before the Angular app is
 * bootstrapped. It calls each micro-frontend's `render(props)` entry point
 * and caches the resulting HTML strings. The cached HTML is then injected
 * into the Angular DI tree via the `MF_SSR_HTML` token so page components
 * can bind it synchronously during the initial SSR pass.
 *
 * The rendering is performed once per server process (module-level cache)
 * and is shared across all requests. In a production system, the props
 * would be fetched per-request from the API; for the Phase 3 reference
 * architecture, static sample data is used so the SSR output is
 * deterministic.
 */
import type { ApplicationConfig } from '@angular/core';
import { render as catalogRender, type CatalogProps } from '@mf/catalog';
import { render as cartRender, type CartProps } from '@mf/cart';
import { render as userRender, type UserPanelProps } from '@mf/user';
import { MF_SSR_HTML, type MfSsrHtml } from './mf-ssr-token';

/* ------------------------------------------------------------------ */
/* Sample props                                                        */
/* ------------------------------------------------------------------ */

const SAMPLE_CATALOG_PROPS: CatalogProps = {
  products: [
    {
      id: 'p-1',
      name: 'Mechanical Keyboard',
      description: 'Hot-swappable, RGB backlit',
      price: { amount: 14999, currency: 'USD' },
      imageUrl: '/images/keyboard.jpg',
      inStock: true,
      categories: [{ id: 'c-1', name: 'Peripherals', slug: 'peripherals', children: [] }],
    },
    {
      id: 'p-2',
      name: 'USB-C Hub',
      description: '7-in-1, 100W PD',
      price: { amount: 5999, currency: 'USD' },
      imageUrl: '/images/hub.jpg',
      inStock: true,
      categories: [{ id: 'c-1', name: 'Peripherals', slug: 'peripherals', children: [] }],
    },
  ],
  categories: [
    { id: 'c-1', name: 'Peripherals', slug: 'peripherals', children: [] },
    { id: 'c-2', name: 'Displays', slug: 'displays', children: [] },
  ],
};

const SAMPLE_CART_PROPS: CartProps = {
  cart: {
    id: 'cart-1',
    items: [
      {
        id: 'ci-1',
        productId: 'p-1',
        quantity: 1,
        unitPrice: { amount: 14999, currency: 'USD' },
        product: { id: 'p-1', name: 'Mechanical Keyboard', imageUrl: '/images/keyboard.jpg' },
      },
    ],
    subtotal: { amount: 14999, currency: 'USD' },
    itemCount: 1,
  },
};

const SAMPLE_USER_PROPS: UserPanelProps = {
  user: {
    id: 'u-1',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    address: {
      line1: '12 Analytical Engine Way',
      city: 'London',
      state: null,
      postalCode: 'EC1A 1BB',
      country: 'United Kingdom',
    },
  },
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

let ssrPromise: Promise<MfSsrHtml> | null = null;

/**
 * Render all three micro-frontends to HTML strings.
 *
 * The result is cached at module level so subsequent calls (e.g. from
 * multiple requests) reuse the same rendering.
 */
export function renderMfSsrHtml(): Promise<MfSsrHtml> {
  if (!ssrPromise) {
    ssrPromise = Promise.all([
      catalogRender(SAMPLE_CATALOG_PROPS),
      cartRender(SAMPLE_CART_PROPS),
      userRender(SAMPLE_USER_PROPS),
    ]).then(([catalog, cart, user]) => ({ catalog, cart, user }));
  }
  return ssrPromise;
}

/**
 * Create an `ApplicationConfig` that provides the pre-rendered MF HTML
 * through the `MF_SSR_HTML` injection token.
 */
export function provideMfSsrHtml(html: MfSsrHtml): ApplicationConfig {
  return {
    providers: [{ provide: MF_SSR_HTML, useValue: html }],
  };
}
