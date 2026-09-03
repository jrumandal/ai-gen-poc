import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { CatalogState } from './catalog.reducer';

/** Root selector for the catalog feature slice. */
export const selectCatalogFeature =
  createFeatureSelector<CatalogState>('catalog');

export const selectProducts = createSelector(
  selectCatalogFeature,
  (state) => state.products
);

export const selectCategories = createSelector(
  selectCatalogFeature,
  (state) => state.categories
);

export const selectCatalogLoading = createSelector(
  selectCatalogFeature,
  (state) => state.loading
);

export const selectCatalogLoaded = createSelector(
  selectCatalogFeature,
  (state) => state.loaded
);

export const selectCatalogError = createSelector(
  selectCatalogFeature,
  (state) => state.error
);
