/**
 * Account (user) page component.
 *
 * Hosts the `<user-mf>` custom element. On the server, the component injects
 * the pre-rendered SSR markup (from `MfSsrService`) into the element via the
 * `mfSsrHtml` directive. On the client, the element self-hydrates via its
 * `connectedCallback` → `hasSSRContent()` → `hydrate()` pattern, and the
 * directive leaves the element's light-DOM content untouched.
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';

@Component({
  selector: 'app-account-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [MfSsrHtmlDirective],
  template: `
    <h1>Account</h1>
    <user-mf [appMfSsrHtml]="ssrHtml"></user-mf>
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
      user-mf {
        display: block;
      }
    `,
  ],
})
export class AccountPage {
  private readonly ssrService = inject(MfSsrService);

  /** The pre-rendered SSR HTML for the user MF. */
  readonly ssrHtml = this.ssrService.user;
}
