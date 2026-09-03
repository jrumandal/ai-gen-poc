import { createAction, props } from '@ngrx/store';
import type { Cart } from '@jrumandal/contracts';

/**
 * Cart slice actions.
 *
 * The cart slice holds the current user's cart. It is loaded once (via the
 * `load` action) and cached in the store so that navigating away and back
 * does not re-fetch — the page simply re-subscribes and re-hydrates the
 * `<mf-cart>` element from the cached state.
 */

/** Dispatched to request the current user's cart from the gateway. */
export const load = createAction('[Cart] Load');

/**
 * Dispatched by the effect when the cart has been fetched successfully.
 *
 * `cart` is nullable: when the user is signed out there is no cart, so the
 * effect dispatches `null` and the page renders an empty cart.
 */
export const loadSuccess = createAction(
  '[Cart] Load Success',
  props<{ cart: Cart | null }>()
);

/** Dispatched by the effect when the cart fetch fails. */
export const loadFailure = createAction(
  '[Cart] Load Failure',
  props<{ error: string }>()
);

export type CartActions =
  | ReturnType<typeof load>
  | ReturnType<typeof loadSuccess>
  | ReturnType<typeof loadFailure>;
