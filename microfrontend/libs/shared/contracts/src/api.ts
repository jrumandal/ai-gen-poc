/**
 * Public, ergonomic API over the generated OpenAPI documents.
 *
 * The raw generated documents are also re-exported for advanced use
 * (e.g. catalog.paths['/catalog/products'].get).
 */
import type { components as CatalogComponents, operations as CatalogOps } from './generated/catalog';
import type { components as CartComponents, operations as CartOps } from './generated/cart';
import type { components as UserComponents, operations as UserOps } from './generated/user';

export * as catalog from './generated/catalog';
export * as cart from './generated/cart';
export * as user from './generated/user';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** Amount in minor units (cents) + ISO-4217 currency code. */
export type Money = CatalogComponents['schemas']['Money'];

/** Standard API error payload. */
export type ApiError = CatalogComponents['schemas']['Error'];

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export type Product = CatalogComponents['schemas']['Product'];
export type Category = CatalogComponents['schemas']['Category'];
export type ProductAttribute = CatalogComponents['schemas']['ProductAttribute'];

export type ListProductsQuery = NonNullable<
  CatalogOps['listProducts']['parameters']['query']
>;
export type GetProductPath = CatalogOps['getProduct']['parameters']['path'];

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type Cart = CartComponents['schemas']['Cart'];
export type CartItem = CartComponents['schemas']['CartItem'];
export type ProductRef = CartComponents['schemas']['ProductRef'];
export type AddItemInput = CartComponents['schemas']['AddItemInput'];
export type UpdateItemInput = CartComponents['schemas']['UpdateItemInput'];

export type CartPath = CartOps['getCart']['parameters']['path'];
export type CartItemPath = CartOps['updateCartItem']['parameters']['path'];

// ---------------------------------------------------------------------------
// User & Orders
// ---------------------------------------------------------------------------

export type User = UserComponents['schemas']['User'];
export type Address = UserComponents['schemas']['Address'];
export type Order = UserComponents['schemas']['Order'];
export type OrderItem = UserComponents['schemas']['OrderItem'];
export type OrderStatus = UserComponents['schemas']['OrderStatus'];
export type LoginInput = UserComponents['schemas']['LoginInput'];
export type UpdateProfileInput = UserComponents['schemas']['UpdateProfileInput'];

