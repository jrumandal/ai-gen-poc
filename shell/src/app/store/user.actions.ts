import { createAction, props } from '@ngrx/store';
import type { User } from '@jrumandal/contracts';

/**
 * User (account) slice actions.
 *
 * The user slice holds the signed-in user's profile. It is loaded once (via
 * the `load` action) and cached in the store so that navigating away and back
 * does not re-fetch — the page simply re-subscribes and re-hydrates the
 * `<mf-user>` element from the cached state.
 */

/** Dispatched to request the signed-in user's profile from the gateway. */
export const load = createAction('[User] Load');

/** Dispatched by the effect when the user profile has been fetched. */
export const loadSuccess = createAction(
  '[User] Load Success',
  props<{ user: User | null }>()
);

/** Dispatched by the effect when the user fetch fails. */
export const loadFailure = createAction(
  '[User] Load Failure',
  props<{ error: string }>()
);

export type UserActions =
  | ReturnType<typeof load>
  | ReturnType<typeof loadSuccess>
  | ReturnType<typeof loadFailure>;
