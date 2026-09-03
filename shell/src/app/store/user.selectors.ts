import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { UserState } from './user.reducer';

/**
 * User (account) slice selectors.
 *
 * `selectUserFeature` is the feature selector for the `user` slice; the
 * derived selectors expose the individual pieces of state the page needs to
 * hydrate the `<mf-user>` element.
 */
export const selectUserFeature = createFeatureSelector<UserState>('user');

export const selectUser = createSelector(
  selectUserFeature,
  (state) => state.user
);

export const selectUserLoading = createSelector(
  selectUserFeature,
  (state) => state.loading
);

export const selectUserLoaded = createSelector(
  selectUserFeature,
  (state) => state.loaded
);

export const selectUserError = createSelector(
  selectUserFeature,
  (state) => state.error
);
