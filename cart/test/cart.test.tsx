import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Cart, formatMoney, lineTotal } from '../src/index';
import type { Cart as CartModel, CartItem } from '@shared/contracts';

const sampleItem: CartItem = {
  id: 'item-1',
  productId: 'prod-1',
  quantity: 2,
  unitPrice: { amount: 1999, currency: 'USD' },
  product: {
    id: 'prod-1',
    name: 'Widget',
    imageUrl: 'https://example.com/widget.png',
  },
};

const sampleCart: CartModel = {
  id: 'cart-1',
  items: [sampleItem],
  subtotal: { amount: 3998, currency: 'USD' },
  itemCount: 2,
};

describe('formatMoney', () => {
  it('formats a Money value (minor units → major)', () => {
    expect(formatMoney({ amount: 1999, currency: 'USD' })).toBe('USD 19.99');
  });
});

describe('lineTotal', () => {
  it('multiplies unit price by quantity', () => {
    expect(lineTotal(sampleItem)).toEqual({ amount: 3998, currency: 'USD' });
  });
});

describe('Cart', () => {
  it('renders the cart heading and item count', () => {
    render(<Cart cart={sampleCart} />);
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeTruthy();
    expect(screen.getByText('2 items')).toBeTruthy();
  });

  it('renders each item with name, unit price, and line total', () => {
    render(<Cart cart={sampleCart} />);
    expect(screen.getByText('Widget')).toBeTruthy();
    expect(screen.getByText('USD 19.99 each')).toBeTruthy();
    // Line total (2 × 19.99) and subtotal both render as USD 39.98.
    expect(screen.getAllByText('USD 39.98').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the empty state when there are no items', () => {
    render(
      <Cart
        cart={{
          id: 'empty',
          items: [],
          subtotal: { amount: 0, currency: 'USD' },
          itemCount: 0,
        }}
      />,
    );
    expect(screen.getByText('Your cart is empty.')).toBeTruthy();
  });

  it('calls onRemoveItem when the user removes an item', () => {
    const onRemoveItem = vi.fn();
    render(<Cart cart={sampleCart} onRemoveItem={onRemoveItem} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Widget' }));
    expect(onRemoveItem).toHaveBeenCalledWith('item-1');
  });

  it('calls onUpdateQuantity when the user increases quantity', () => {
    const onUpdateQuantity = vi.fn();
    render(<Cart cart={sampleCart} onUpdateQuantity={onUpdateQuantity} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 3);
  });

  it('calls onClearCart when the user clears the cart', () => {
    const onClearCart = vi.fn();
    render(<Cart cart={sampleCart} onClearCart={onClearCart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear cart' }));
    expect(onClearCart).toHaveBeenCalled();
  });
});
