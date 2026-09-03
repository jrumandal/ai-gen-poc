import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { NavigationState } from './navigation.reducer';

/**
 * Navigation slice selectors.
 *
 * Expose the current route and the bounded navigation trail so the shell can
 * inspect "where the user has been" (backtracing of navigation).
 */
export const selectNavigationFeature =
  createFeatureSelector<NavigationState>('navigation');

export const selectCurrentRoute = createSelector(
  selectNavigationFeature,
  (state) => state.current
);

export const selectNavigationHistory = createSelector(
  selectNavigationFeature,
  (state) => state.history
);
