import { CartElement } from './cart-element';

/** The custom element tag name for the cart MF. */
export const CART_ELEMENT_TAG = 'mf-cart';

/**
 * Register the `<mf-cart>` custom element.
 *
 * Idempotent: if the element is already defined, this is a no-op.
 *
 * @returns A promise that resolves once the element is registered.
 */
export async function register(): Promise<void> {
  if (typeof customElements === 'undefined') {
    throw new Error('customElements is not available in this environment.');
  }
  if (customElements.get(CART_ELEMENT_TAG)) {
    return;
  }
  customElements.define(CART_ELEMENT_TAG, CartElement);
}
