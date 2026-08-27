/**
 * Public API for the `@mf/catalog` micro-frontend.
 *
 * Exports:
 *  - `CatalogComponent` — the Angular component (for direct use / testing).
 *  - `render` — SSR entry: renders the component to an HTML string (Node).
 *  - `register` — client entry: registers the `<catalog-mf>` custom element.
 *  - `hydrate` — client entry: hydrates the element after first paint.
 *  - `CatalogProps` — the props interface accepted by `render`.
 */
export { CatalogComponent, CATALOG_SSR_PROPS } from './lib/catalog.component';
export { render, type CatalogProps } from './ssr';
export { register, CATALOG_ELEMENT_TAG } from './register';
export { hydrate } from './hydrate';
