/**
 * Catalog page component.
 *
 * Hosts the `<catalog-mf>` custom element. On the server, the component
 * binds the pre-rendered SSR markup (from `MfSsrService`) into the element
 * via `[innerHTML]`. On the client, the element self-hydrates via its
 * `connectedCallback` → `hasSSRContent()` → `hydrate()` pattern.
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { MfSsrService } from './mf-ssr.service';

@Component({
  selector: 'app-catalog-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Catalog</h1>
    <catalog-mf [innerHTML]="ssrHtml"></catalog-mf>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: var(--space-6);
        max-width: var(--layout-max-width);
        margin: 0 auto;
      }
      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 var(--space-4);
        color: var(--color-text-primary);
      }
      catalog-mf {
        display: block;
      }
    `,
  ],
})
export class CatalogPage {
  private readonly ssrService = inject(MfSsrService);

  /** The pre-rendered SSR HTML for the catalog MF. */
  readonly ssrHtml = this.ssrService.catalog;
}
