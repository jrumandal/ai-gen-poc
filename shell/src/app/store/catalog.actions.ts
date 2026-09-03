import { createAction, props } from '@ngrx/store';
import type { Category, Product } from '@jrumandal/contracts';

/**
 * Catalog slice actions.
 *
 * The catalog slice holds the product list and the category list. It is
 * loaded once (via the `load` action) and cached in the store so that
 * navigating away and back does not re-fetch — the page simply re-subscribes
 * and re-hydrates the `<mf-catalog>` element from the cached state.
 */

/** Dispatched to request the catalog (products + categories) from the gateway. */
export const load = createAction('[Catalog] Load');

/** Dispatched by the effect when the catalog has been fetched successfully. */
export const loadSuccess = createAction(
  '[Catalog] Load Success',
  props<{ products: Product[]; categories: Category[] }>()
);

/** Dispatched by the effect when the catalog fetch fails. */
export const loadFailure = createAction(
  '[Catalog] Load Failure',
  props<{ error: string }>()
);

export type CatalogActions =
  | typeof load
  | ReturnType<typeof loadSuccess>
  | ReturnType<typeof loadFailure>;
