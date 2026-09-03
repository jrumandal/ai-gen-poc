import { createReducer, on } from '@ngrx/store';
import type { User } from '@jrumandal/contracts';
import { load, loadFailure, loadSuccess } from './user.actions';

/**
 * User (account) slice state.
 *
 * `user` is the signed-in user's profile (or `null` when signed out / not yet
 * loaded). `loading` / `loaded` / `error` track the fetch lifecycle so the
 * page can render a sensible state and the effect can avoid redundant fetches.
 */
export interface UserState {
  user: User | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialState: UserState = {
  user: null,
  loading: false,
  loaded: false,
  error: null,
};

export const userReducer = createReducer(
  initialState,
  on(load, (state) => ({ ...state, loading: true, error: null })),
  on(loadSuccess, (state, { user }) => ({
    ...state,
    user,
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
