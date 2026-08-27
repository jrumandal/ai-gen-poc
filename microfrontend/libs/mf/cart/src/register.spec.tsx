import { act } from 'react';
import { register, CART_ELEMENT_TAG, CartElement } from './index';
import type { Cart } from '@shared/contracts';

// Enable React's `act` environment for deterministic flushing in JSDOM.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const cart: Cart = {
  id: 'cart-1',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      quantity: 2,
      unitPrice: { amount: 1999, currency: 'USD' },
      product: { id: 'prod-1', name: 'Mechanical Keyboard', imageUrl: '' },
    },
  ],
  subtotal: { amount: 3998, currency: 'USD' },
  itemCount: 1,
};

describe('cart MF custom element (JSDOM)', () => {
  it('registers the cart-mf custom element', async () => {
    await register();
    expect(customElements.get(CART_ELEMENT_TAG)).toBe(CartElement);
  });

  it('is idempotent when registered twice', async () => {
    await register();
    await expect(register()).resolves.toBeUndefined();
  });

  it('renders the cart into its light DOM', async () => {
    await register();
    const el = document.createElement('cart-mf') as CartElement;
    document.body.appendChild(el);
    await act(async () => {
      el.cart = cart;
    });
    expect(el.innerHTML).toContain('Your cart');
    expect(el.innerHTML).toContain('Mechanical Keyboard');
    expect(el.innerHTML).toContain('USD 39.98');
    el.remove();
  });

  it('renders an empty cart when no cart is set', async () => {
    await register();
    const el = document.createElement('cart-mf') as CartElement;
    document.body.appendChild(el);
    await act(async () => {});
    expect(el.innerHTML).toContain('Your cart is empty.');
    el.remove();
  });
});
