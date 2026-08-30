/**
 * Cart page component.
 *
 * Hosts the `<cart-mf>` custom element. On the server, the component injects
 * the pre-rendered SSR markup (from `MfSsrService`) into the element via the
 * `mfSsrHtml` directive. On the client, the element self-hydrates via its
 * `connectedCallback` → `hasSSRContent()` → `hydrate()` pattern, and the
 * directive leaves the element's light-DOM content untouched.
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';

@Component({
  selector: 'app-cart-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [MfSsrHtmlDirective],
  template: `
    <h1>Cart</h1>
    <cart-mf [appMfSsrHtml]="ssrHtml"></cart-mf>
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
      cart-mf {
        display: block;
      }
    `,
  ],
})
export class CartPage {
  private readonly ssrService = inject(MfSsrService);

  /** The pre-rendered SSR HTML for the cart MF. */
  readonly ssrHtml = this.ssrService.cart;
}
