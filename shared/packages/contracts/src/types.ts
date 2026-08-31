/**
 * Hand-written domain types for the shared contracts package.
 *
 * These mirror the OpenAPI schemas in `openapi/{catalog,cart,user}.yaml` so the
 * package is self-contained (no codegen pipeline required). The MFs consume
 * these types (via `import type`) to share a single source of truth for the
 * catalog, cart, and user/order domains across Angular, React, and Vue.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** Amount in minor units (cents) + ISO-4217 currency code. */
export interface Money {
  amount: number;
  currency: string;
}

/** Standard API error payload. */
export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: Money;
  imageUrl?: string;
  inStock: boolean;
  categories: Category[];
  attributes?: ProductAttribute[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children: Category[];
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface ProductRef {
  id: string;
  name: string;
  imageUrl: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: Money;
  product: ProductRef;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: Money;
  itemCount: number;
}

export interface AddItemInput {
  productId: string;
  quantity: number;
}

export interface UpdateItemInput {
  quantity: number;
}

// ---------------------------------------------------------------------------
// User & Orders
// ---------------------------------------------------------------------------

export interface Address {
  line1: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  address: Address;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: Money;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: Money;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name: string;
  address: Address;
}
