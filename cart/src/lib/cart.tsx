import type { Cart, CartItem, Money, MfApolloClient } from "@jrumandal/contracts";
import type { EventBus, MFEventMap } from "@jrumandal/event-bus";
import { CartEvent } from "@jrumandal/event-bus";

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
  /** Shared Apollo client for typed GraphQL queries/mutations (optional). */
  apolloClient?: MfApolloClient | null;
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

/**
 * A presentational React `Cart` component.
 *
 * It renders the cart's items, quantity controls, and subtotal, and emits
 * cross-MF events (via the shared `EventBus`) when the user interacts with it.
 * The actual GraphQL mutations are performed by the host shell, which wires
 * the `on*` callbacks to its data layer.
 *
 * Styling uses Tailwind v4 utility classes. The design tokens are mapped into
 * Tailwind namespaces by the host shell (see `@theme inline` in the shell's
 * `styles.css`), so utilities like `bg-brand-500` / `p-4` / `rounded-md`
 * resolve to the shared CSS custom properties.
 */
export function Cart(props: CartProps) {
  const { cart, eventBus, onRemoveItem, onUpdateQuantity, onClearCart } = props;

  const changeQuantity = (item: CartItem, delta: number): void => {
    const next = Math.max(0, item.quantity + delta);
    if (next === item.quantity) return;
    if (next === 0) {
      onRemoveItem?.(item.id);
      eventBus?.emit(CartEvent["cart:itemRemoved"], {
        productId: item.productId,
      });
      return;
    }
    onUpdateQuantity?.(item.id, next);
    eventBus?.emit(CartEvent["cart:updated"], {
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
    });
  };

  const removeItem = (item: CartItem): void => {
    onRemoveItem?.(item.id);
    eventBus?.emit(CartEvent["cart:itemRemoved"], {
      productId: item.productId,
    });
  };

  const clearCart = (): void => {
    onClearCart?.();
    eventBus?.emit(CartEvent["cart:cleared"], undefined);
  };

  const isEmpty = cart.items.length === 0;

  return (
    <section
      className="mf-cart flex flex-col gap-3 font-sans text-text-primary text-md leading-normal p-4 border border-border rounded-md bg-surface"
      aria-label="Shopping cart"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-semibold">Your cart</h2>
        <span className="inline-block px-2 py-1 rounded-full bg-brand-500 text-text-inverse text-sm font-medium" aria-live="polite">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
        </span>
      </header>

      {isEmpty ? (
        <p className="p-4 text-center text-text-secondary">Your cart is empty.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-3">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-2 border border-border rounded-sm bg-surface-subtle">
              {item.product.imageUrl ? (
                <img
                  className="w-12 h-12 object-cover rounded-sm shrink-0"
                  src={item.product.imageUrl}
                  alt={item.product.name}
                />
              ) : null}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="m-0 text-md font-medium overflow-hidden text-ellipsis whitespace-nowrap">{item.product.name}</p>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span>{formatMoney(item.unitPrice)} each</span>
                  <span className="inline-flex items-center gap-1" aria-label={`Quantity ${item.quantity}`}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-7 border border-border rounded-sm bg-surface text-text-primary cursor-pointer text-md leading-none p-0"
                      aria-label="Decrease quantity"
                      onClick={() => changeQuantity(item, -1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-7 border border-border rounded-sm bg-surface text-text-primary cursor-pointer text-md leading-none p-0"
                      aria-label="Increase quantity"
                      onClick={() => changeQuantity(item, 1)}
                    >
                      +
                    </button>
                  </span>
                </div>
              </div>
              <span className="text-md font-semibold whitespace-nowrap">{formatMoney(lineTotal(item))}</span>
              <button
                type="button"
                className="border-0 bg-transparent text-danger cursor-pointer text-sm p-1"
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
        <footer className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span className="flex items-baseline gap-2">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-lg font-semibold">{formatMoney(cart.subtotal)}</span>
          </span>
          <button type="button" className="border-0 bg-transparent text-danger cursor-pointer text-sm p-1" onClick={clearCart}>
            Clear cart
          </button>
        </footer>
      ) : null}
    </section>
  );
}
