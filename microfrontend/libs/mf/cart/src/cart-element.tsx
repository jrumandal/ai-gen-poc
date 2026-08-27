import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { Cart, type CartProps } from './lib/cart';
import type { Cart as CartModel } from '@shared/contracts';
import type { EventBus, MFEventMap } from '@shared/event-bus';

/**
 * The `<cart-mf>` custom element.
 *
 * It wraps the React `Cart` component and renders it into the element's
 * **light DOM** (no Shadow DOM) so the host shell's global styles and design
 * tokens apply. The element exposes:
 *
 *  - `cart` — the cart model to render (set as a property or via the
 *    `data-cart` JSON attribute).
 *  - `eventBus` — the shared event bus for cross-MF events.
 *  - `onAddItem` / `onRemoveItem` / `onUpdateQuantity` / `onClearCart` —
 *    callbacks the host shell wires to its GraphQL data layer.
 *
 * The element renders with `createRoot` on the client, or hydrates existing
 * SSR markup with `hydrateRoot` (see `hydrate.ts`).
 */
export class CartElement extends HTMLElement {
  static readonly observedAttributes = ['data-cart'];

  private root: Root | null = null;
  private _cart: CartModel | null = null;
  private _eventBus: EventBus<MFEventMap> | null = null;
  private _onAddItem?: (input: { productId: string; quantity: number }) => void;
  private _onRemoveItem?: (itemId: string) => void;
  private _onUpdateQuantity?: (itemId: string, quantity: number) => void;
  private _onClearCart?: () => void;

  /** The cart model to render. */
  set cart(value: CartModel | null) {
    this._cart = value;
    this.render();
  }
  get cart(): CartModel | null {
    return this._cart;
  }

  /** The shared event bus for cross-MF events. */
  set eventBus(value: EventBus<MFEventMap> | null) {
    this._eventBus = value;
    this.render();
  }
  get eventBus(): EventBus<MFEventMap> | null {
    return this._eventBus;
  }

  set onAddItem(value: ((input: { productId: string; quantity: number }) => void) | undefined) {
    this._onAddItem = value;
  }
  set onRemoveItem(value: ((itemId: string) => void) | undefined) {
    this._onRemoveItem = value;
  }
  set onUpdateQuantity(value: ((itemId: string, quantity: number) => void) | undefined) {
    this._onUpdateQuantity = value;
  }
  set onClearCart(value: (() => void) | undefined) {
    this._onClearCart = value;
  }

  connectedCallback(): void {
    this.syncCartFromAttribute();
    // If the element already contains SSR markup, hydrate it; otherwise
    // render fresh with createRoot.
    if (this.hasSSRContent()) {
      this.hydrate();
    } else {
      this.render();
    }
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
  }

  attributeChangedCallback(name: string): void {
    if (name === 'data-cart') {
      this.syncCartFromAttribute();
      this.render();
    }
  }

  /** True if the element already contains server-rendered child markup. */
  private hasSSRContent(): boolean {
    return this.childNodes.length > 0;
  }

  /** Parse the `data-cart` JSON attribute into the `cart` property. */
  private syncCartFromAttribute(): void {
    const raw = this.getAttribute('data-cart');
    if (raw) {
      try {
        this.cart = JSON.parse(raw) as CartModel;
      } catch {
        this.cart = null;
      }
    }
  }

  private buildProps(): CartProps {
    return {
      cart: this.cart ?? {
        id: 'empty',
        items: [],
        subtotal: { amount: 0, currency: 'USD' },
        itemCount: 0,
      },
      eventBus: this.eventBus,
      onAddItem: this.onAddItem,
      onRemoveItem: this.onRemoveItem,
      onUpdateQuantity: this.onUpdateQuantity,
      onClearCart: this.onClearCart,
    };
  }

  /**
   * Render the React `Cart` component into the element's light DOM using
   * `createRoot` (client-side, no existing markup).
   */
  render(): void {
    if (typeof document === 'undefined') return;
    if (this.root) {
      this.root.render(<Cart {...this.buildProps()} />);
      return;
    }
    this.root = createRoot(this);
    this.root.render(<Cart {...this.buildProps()} />);
  }

  /**
   * Hydrate existing SSR markup in the element's light DOM using
   * `hydrateRoot`. This should be called when the element already contains
   * server-rendered HTML (see `hydrate.ts`).
   */
  hydrate(): void {
    if (typeof document === 'undefined') return;
    if (this.root) {
      // Already mounted; just reconcile.
      this.root.render(<Cart {...this.buildProps()} />);
      return;
    }
    this.root = hydrateRoot(this, <Cart {...this.buildProps()} />);
  }
}
