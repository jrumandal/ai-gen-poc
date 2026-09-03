import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { CartState } from './cart.reducer';

/**
 * Cart slice selectors.
 *
 * `selectCartFeature` is the feature selector for the `cart` slice; the
 * derived selectors expose the individual pieces of state the page needs to
 * hydrate the `<mf-cart>` element.
 */
export const selectCartFeature = createFeatureSelector<CartState>('cart');

export const selectCart = createSelector(
  selectCartFeature,
  (state) => state.cart
);

export const selectCartLoading = createSelector(
  selectCartFeature,
  (state) => state.loading
);

export const selectCartLoaded = createSelector(
  selectCartFeature,
  (state) => state.loaded
);

export const selectCartError = createSelector(
  selectCartFeature,
  (state) => state.error
);
