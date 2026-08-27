import type { CSSProperties } from 'react';
import type { Cart, CartItem, Money } from '@shared/contracts';
import { cssVar, Tokens } from '@shared/design-tokens';
import type { EventBus, MFEventMap } from '@shared/event-bus';
import { CartEvent } from '@shared/event-bus';

/**
 * Props accepted by the `Cart` component.
 *
 * The component is presentational: it renders the cart and emits cross-MF
 * events. The host shell performs the actual GraphQL mutations by wiring the
 * `on*` callbacks to its data layer (e.g. `addToCart` / `removeFromCart`).
 */
export interface CartProps {
  /** The cart to render. */
  cart: Cart;
  /** Shared event bus for cross-MF events (optional). */
  eventBus?: EventBus<MFEventMap> | null;
  /** Called when the user requests to add an item (host performs the mutation). */
  onAddItem?: (input: { productId: string; quantity: number }) => void;
  /** Called when the user requests to remove an item (host performs the mutation). */
  onRemoveItem?: (itemId: string) => void;
  /** Called when the user requests to change an item's quantity. */
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  /** Called when the user requests to clear the cart. */
  onClearCart?: () => void;
}

/**
 * Format a `Money` value (amount in minor units) for display.
 *
 * @example formatMoney({ amount: 1999, currency: 'USD' }) // "USD 19.99"
 */
export function formatMoney(money: Money): string {
  const major = money.amount / 100;
  return `${money.currency} ${major.toFixed(2)}`;
}

/** Compute a line total (unit price × quantity) as a `Money` value. */
export function lineTotal(item: CartItem): Money {
  return {
    amount: item.unitPrice.amount * item.quantity,
    currency: item.unitPrice.currency,
  };
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s3),
    fontFamily: cssVar(Tokens.font.familySans),
    color: cssVar(Tokens.color.textPrimary),
    fontSize: cssVar(Tokens.font.sizeMd),
    lineHeight: cssVar(Tokens.font.lineHeightNormal),
    padding: cssVar(Tokens.space.s4),
    border: `1px solid ${cssVar(Tokens.color.border)}`,
    borderRadius: cssVar(Tokens.radius.md),
    background: cssVar(Tokens.color.surface),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: cssVar(Tokens.space.s2),
  },
  title: {
    margin: 0,
    fontSize: cssVar(Tokens.font.sizeLg),
    fontWeight: cssVar(Tokens.font.weightSemibold),
  },
  count: {
    display: 'inline-block',
    padding: `${cssVar(Tokens.space.s1)} ${cssVar(Tokens.space.s2)}`,
    borderRadius: cssVar(Tokens.radius.full),
    background: cssVar(Tokens.color.brand500),
    color: cssVar(Tokens.color.textInverse),
    fontSize: cssVar(Tokens.font.sizeSm),
    fontWeight: cssVar(Tokens.font.weightMedium),
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s3),
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: cssVar(Tokens.space.s3),
    padding: cssVar(Tokens.space.s2),
    border: `1px solid ${cssVar(Tokens.color.border)}`,
    borderRadius: cssVar(Tokens.radius.sm),
    background: cssVar(Tokens.color.surfaceSubtle),
  },
  thumb: {
    width: 48,
    height: 48,
    objectFit: 'cover',
    borderRadius: cssVar(Tokens.radius.sm),
    flexShrink: 0,
  },
  itemBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar(Tokens.space.s1),
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: 0,
    fontSize: cssVar(Tokens.font.sizeMd),
    fontWeight: cssVar(Tokens.font.weightMedium),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: cssVar(Tokens.space.s2),
    fontSize: cssVar(Tokens.font.sizeSm),
    color: cssVar(Tokens.color.textSecondary),
  },
  qty: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: cssVar(Tokens.space.s1),
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: `1px solid ${cssVar(Tokens.color.border)}`,
    borderRadius: cssVar(Tokens.radius.sm),
    background: cssVar(Tokens.color.surface),
    color: cssVar(Tokens.color.textPrimary),
    cursor: 'pointer',
    fontSize: cssVar(Tokens.font.sizeMd),
    lineHeight: 1,
    padding: 0,
  },
  remove: {
    border: 'none',
    background: 'transparent',
    color: cssVar(Tokens.color.danger),
    cursor: 'pointer',
    fontSize: cssVar(Tokens.font.sizeSm),
    padding: cssVar(Tokens.space.s1),
  },
  lineTotal: {
    fontSize: cssVar(Tokens.font.sizeMd),
    fontWeight: cssVar(Tokens.font.weightSemibold),
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: cssVar(Tokens.space.s2),
    paddingTop: cssVar(Tokens.space.s2),
    borderTop: `1px solid ${cssVar(Tokens.color.border)}`,
  },
  subtotalLabel: {
    color: cssVar(Tokens.color.textSecondary),
  },
  subtotalValue: {
    fontSize: cssVar(Tokens.font.sizeLg),
    fontWeight: cssVar(Tokens.font.weightSemibold),
  },
  empty: {
    padding: cssVar(Tokens.space.s4),
    textAlign: 'center',
    color: cssVar(Tokens.color.textSecondary),
  },
};

/**
 * A presentational React `Cart` component.
 *
 * It renders the cart's items, quantity controls, and subtotal, and emits
 * cross-MF events (via the shared `EventBus`) when the user interacts with it.
 * The actual GraphQL mutations are performed by the host shell, which wires
 * the `on*` callbacks to its data layer.
 */
export function Cart(props: CartProps) {
  const { cart, eventBus, onRemoveItem, onUpdateQuantity, onClearCart } = props;

  const changeQuantity = (item: CartItem, delta: number): void => {
    const next = Math.max(0, item.quantity + delta);
    if (next === item.quantity) return;
    if (next === 0) {
      onRemoveItem?.(item.id);
      eventBus?.emit(CartEvent['cart:itemRemoved'], {
        productId: item.productId,
      });
      return;
    }
    onUpdateQuantity?.(item.id, next);
    eventBus?.emit(CartEvent['cart:updated'], {
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
    });
  };

  const removeItem = (item: CartItem): void => {
    onRemoveItem?.(item.id);
    eventBus?.emit(CartEvent['cart:itemRemoved'], {
      productId: item.productId,
    });
  };

  const clearCart = (): void => {
    onClearCart?.();
    eventBus?.emit(CartEvent['cart:cleared'], undefined);
  };

  const isEmpty = cart.items.length === 0;

  return (
    <section className="cart-mf" style={styles.root} aria-label="Shopping cart">
      <header style={styles.header}>
        <h2 style={styles.title}>Your cart</h2>
        <span style={styles.count} aria-live="polite">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
        </span>
      </header>

      {isEmpty ? (
        <p style={styles.empty}>Your cart is empty.</p>
      ) : (
        <ul style={styles.list}>
          {cart.items.map((item) => (
            <li key={item.id} style={styles.item}>
              {item.product.imageUrl ? (
                <img
                  style={styles.thumb}
                  src={item.product.imageUrl}
                  alt={item.product.name}
                />
              ) : null}
              <div style={styles.itemBody}>
                <p style={styles.itemName}>{item.product.name}</p>
                <div style={styles.itemMeta}>
                  <span>{formatMoney(item.unitPrice)} each</span>
                  <span style={styles.qty} aria-label={`Quantity ${item.quantity}`}>
                    <button
                      type="button"
                      style={styles.btn}
                      aria-label="Decrease quantity"
                      onClick={() => changeQuantity(item, -1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      style={styles.btn}
                      aria-label="Increase quantity"
                      onClick={() => changeQuantity(item, 1)}
                    >
                      +
                    </button>
                  </span>
                </div>
              </div>
              <span style={styles.lineTotal}>{formatMoney(lineTotal(item))}</span>
              <button
                type="button"
                style={styles.remove}
                aria-label={`Remove ${item.product.name}`}
                onClick={() => removeItem(item)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isEmpty ? (
        <footer style={styles.footer}>
          <span style={styles.subtotalLabel}>Subtotal</span>
          <span style={styles.subtotalValue}>{formatMoney(cart.subtotal)}</span>
        </footer>
      ) : null}
    </section>
  );
}
