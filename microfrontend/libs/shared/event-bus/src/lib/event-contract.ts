/**
 * Typed cross-MF event contract.
 *
 * Every event the micro-frontends emit/subscribe to is declared here with an
 * explicit payload type so producers and consumers share one source of truth.
 * Keep this file free of runtime dependencies — it is pure type surface.
 */

/** Catalog domain events. */
export const CatalogEvent = {
  'catalog:productViewed': 'catalog:productViewed',
  'catalog:filterChanged': 'catalog:filterChanged',
} as const;

export type CatalogProductViewedPayload = {
  readonly productId: string;
  readonly source: string;
};

export type CatalogFilterChangedPayload = {
  readonly category?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly query?: string;
};

/** Cart domain events. */
export const CartEvent = {
  'cart:updated': 'cart:updated',
  'cart:itemAdded': 'cart:itemAdded',
  'cart:itemRemoved': 'cart:itemRemoved',
  'cart:cleared': 'cart:cleared',
} as const;

export type CartUpdatedPayload = {
  readonly itemCount: number;
  readonly subtotal: { readonly amount: number; readonly currency: string };
};

export type CartItemAddedPayload = {
  readonly productId: string;
  readonly quantity: number;
};

export type CartItemRemovedPayload = {
  readonly productId: string;
};

/** User / session domain events. */
export const UserEvent = {
  'user:signedIn': 'user:signedIn',
  'user:signedOut': 'user:signedOut',
  'user:profileUpdated': 'user:profileUpdated',
} as const;

export type UserSignedInPayload = {
  readonly userId: string;
};

export type UserSignedOutPayload = {
  readonly reason?: string;
};

export type UserProfileUpdatedPayload = {
  readonly userId: string;
  readonly fields: string[];
};

/**
 * The full event map: event name → payload type.
 *
 * `EventBus<MFEventMap>` is the default bus type used across the workspace.
 *
 * Note: the keys are the literal event-name strings (identical to the values
 * in the `*Event` const objects). TypeScript forbids computed property names
 * in a type literal unless they are literal types, so we spell the names out.
 */
export type MFEventMap = {
  'catalog:productViewed': CatalogProductViewedPayload;
  'catalog:filterChanged': CatalogFilterChangedPayload;

  'cart:updated': CartUpdatedPayload;
  'cart:itemAdded': CartItemAddedPayload;
  'cart:itemRemoved': CartItemRemovedPayload;
  'cart:cleared': undefined;

  'user:signedIn': UserSignedInPayload;
  'user:signedOut': UserSignedOutPayload;
  'user:profileUpdated': UserProfileUpdatedPayload;
};

/** All known event names, handy for `Object.values` / iteration. */
export const MF_EVENT_NAMES = [
  CatalogEvent['catalog:productViewed'],
  CatalogEvent['catalog:filterChanged'],
  CartEvent['cart:updated'],
  CartEvent['cart:itemAdded'],
  CartEvent['cart:itemRemoved'],
  CartEvent['cart:cleared'],
  UserEvent['user:signedIn'],
  UserEvent['user:signedOut'],
  UserEvent['user:profileUpdated'],
] as const;

export type MFEventName = (typeof MF_EVENT_NAMES)[number];
