import { createReducer, on } from '@ngrx/store';
import type { Cart } from '@jrumandal/contracts';
import { load, loadFailure, loadSuccess } from './cart.actions';

/**
 * Cart slice state.
 *
 * `cart` is the current user's cart (or `null` when not yet loaded / the user
 * has no cart). `loading` / `loaded` / `error` track the fetch lifecycle so
 * the page can render a sensible state and the effect can avoid redundant
 * fetches.
 */
export interface CartState {
  cart: Cart | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialState: CartState = {
  cart: null,
  loading: false,
  loaded: false,
  error: null,
};

export const cartReducer = createReducer(
  initialState,
  on(load, (state) => ({ ...state, loading: true, error: null })),
  on(loadSuccess, (state, { cart }) => ({
    ...state,
    cart,
    loading: false,
    loaded: true,
    error: null,
  })),
  on(loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
