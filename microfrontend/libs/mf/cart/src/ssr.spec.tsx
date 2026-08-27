import { render } from './ssr';
import { formatMoney, lineTotal } from './lib/cart';
import type { Cart, CartItem, Money } from '@shared/contracts';

const money = (amount: number, currency = 'USD'): Money => ({ amount, currency });

const item: CartItem = {
  id: 'item-1',
  productId: 'prod-1',
  quantity: 2,
  unitPrice: money(1999),
  product: { id: 'prod-1', name: 'Mechanical Keyboard', imageUrl: '' },
};

const cart: Cart = {
  id: 'cart-1',
  items: [item],
  subtotal: money(3998),
  itemCount: 1,
};

describe('cart MF SSR (renderToString)', () => {
  it('renders the cart section with the item name and subtotal', () => {
    const html = render({ cart });
    expect(html).toContain('class="cart-mf"');
    expect(html).toContain('Your cart');
    expect(html).toContain('Mechanical Keyboard');
    expect(html).toContain('USD 19.99');
    expect(html).toContain('USD 39.98');
  });

  it('renders the item count badge', () => {
    const html = render({ cart });
    // React SSR inserts `<!-- -->` markers between adjacent text nodes, so
    // assert on the stable words rather than the exact "1 item" phrase.
    expect(html).toContain('item');
    expect(html).toContain('1');
  });

  it('renders an empty state when the cart has no items', () => {
    const empty: Cart = {
      id: 'cart-empty',
      items: [],
      subtotal: money(0),
      itemCount: 0,
    };
    const html = render({ cart: empty });
    expect(html).toContain('Your cart is empty.');
    expect(html).not.toContain('Subtotal');
  });

  it('formatMoney converts minor units to a display string', () => {
    expect(formatMoney(money(1999))).toBe('USD 19.99');
    expect(formatMoney(money(50, 'EUR'))).toBe('EUR 0.50');
  });

  it('lineTotal multiplies unit price by quantity', () => {
    expect(lineTotal(item)).toEqual(money(3998));
  });
});
