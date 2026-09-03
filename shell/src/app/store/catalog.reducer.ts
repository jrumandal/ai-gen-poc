import { createReducer, on } from '@ngrx/store';
import type { Category, Product } from '@jrumandal/contracts';
import { load, loadFailure, loadSuccess } from './catalog.actions';

/**
 * Catalog slice state.
 *
 * `loaded` is a one-shot flag: once the catalog has been fetched successfully
 * it stays `true` for the lifetime of the session, so subsequent navigations
 * reuse the cached data instead of re-fetching.
 */
export interface CatalogState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialState: CatalogState = {
  products: [],
  categories: [],
  loading: false,
  loaded: false,
  error: null,
};

export const catalogReducer = createReducer(
  initialState,
  on(load, (state) => ({ ...state, loading: true, error: null })),
  on(loadSuccess, (state, { products, categories }) => ({
    ...state,
    products,
    categories,
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
