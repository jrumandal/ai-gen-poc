/**
 * Catalog page component.
 *
 * Hosts the `<catalog-mf>` custom element. On the server, the component
 * injects the pre-rendered SSR markup (from `MfSsrService`) into the element
 * via the `mfSsrHtml` directive. On the client, the element self-hydrates
 * via its `connectedCallback` → `hasSSRContent()` → `hydrate()` pattern, and
 * the directive leaves the element's light-DOM content untouched.
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';

@Component({
  selector: 'app-catalog-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [MfSsrHtmlDirective],
  template: `
    <h1>Catalog</h1>
    <catalog-mf [appMfSsrHtml]="ssrHtml"></catalog-mf>
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
