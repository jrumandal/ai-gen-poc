import { createAction, props } from '@ngrx/store';

/**
 * Navigation slice actions.
 *
 * This slice records a lightweight history of the routes the user has visited
 * ("backtracing of navigation"). It is populated by an effect that listens to
 * `@ngrx/router-store`'s `RouterNavigated` action, so the shell can inspect
 * the navigation trail in the store (e.g. for debugging, analytics, or to
 * drive side effects).
 */

/** A single entry in the navigation history. */
export interface NavigationEntry {
  route: string;
  timestamp: number;
}

/** Dispatched (by the effect) whenever the router completes a navigation. */
export const routeChanged = createAction(
  '[Navigation] Route Changed',
  props<{ route: string; timestamp: number }>()
);

export type NavigationActions = ReturnType<typeof routeChanged>;
