import { createReducer, on } from '@ngrx/store';
import { routeChanged, type NavigationEntry } from './navigation.actions';

/**
 * Navigation slice state.
 *
 * `current` is the most recent route; `history` is a bounded trail of the
 * routes visited in this session (newest last). The trail is capped so it
 * cannot grow unbounded during a long session.
 */
export interface NavigationState {
  current: string | null;
  history: NavigationEntry[];
}

/** Maximum number of entries kept in the navigation trail. */
const MAX_HISTORY = 50;

export const initialState: NavigationState = {
  current: null,
  history: [],
};

export const navigationReducer = createReducer(
  initialState,
  on(routeChanged, (state, { route, timestamp }) => ({
    current: route,
    history: [...state.history, { route, timestamp }].slice(-MAX_HISTORY),
  }))
);
