/**
 * Cart page.
 *
 * Hosts the `mf-cart` custom element (the React micro-frontend). The element
 * is defined by `@mf/cart` and registered in `main.ts` before Angular
 * bootstrap.
 *
 * The page binds the pre-rendered SSR HTML (from `MfSsrService`) to the
 * element via the `appMfSsrHtml` directive. On the server this injects the
 * SSR markup; on the client the bound value is empty so the MF's own
 * light-DOM rendering is left untouched.
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';

@Component({
  selector: 'app-cart-page',
  imports: [MfSsrHtmlDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Cart</h1>
    <mf-cart [appMfSsrHtml]="ssrHtml"></mf-cart>
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
        font-weight: var(--font-weight-600);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-4);
      }
      mf-cart {
        display: block;
      }
    `,
  ],
})
export class CartPage {
  private readonly ssrService = new MfSsrService();

  /** The pre-rendered SSR HTML for the cart MF (empty on the client). */
  readonly ssrHtml = this.ssrService.cart;
}
