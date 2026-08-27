import { renderToString } from 'react-dom/server';
import { Cart, type CartProps } from './lib/cart';

/**
 * Server-side render the `Cart` component to an HTML string.
 *
 * This is the SSR entry point for the cart MF. The host shell calls this on
 * the server to produce the initial HTML, which is then hydrated on the
 * client via `hydrateRoot` (see `hydrate.ts`).
 *
 * @param props - The cart props to render.
 * @returns The rendered HTML string (the `<section class="cart-mf">…</section>`).
 */
export function render(props: CartProps): string {
  return renderToString(<Cart {...props} />);
}
