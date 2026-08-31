/**
 * SSR composition accessor for the shell.
 *
 * The actual MF HTML is pre-rendered at server module-load time (see
 * `main.server.ts`) and exposed through the `MF_SSR_HTML` injection token.
 * This service is a thin, synchronous accessor over that token so page
 * components can bind the markup during the initial SSR pass without
 * awaiting async work (which Angular SSR does not reliably wait for).
 *
 * On the client the token resolves to empty strings — the MF custom
 * elements self-activate via their `connectedCallback` → `hasSSRContent()`
 * → `hydrate()`/`render()` pattern once the shell calls `register()`.
 */
import { Injectable, inject } from '@angular/core';
import { MF_SSR_HTML, type MfSsrHtml } from './mf-ssr-token';

@Injectable({ providedIn: 'root' })
export class MfSsrService {
  private readonly html = inject(MF_SSR_HTML);

  /** The pre-rendered SSR HTML for the catalog MF. */
  get catalog(): string {
    return this.html.catalog;
  }

  /** The pre-rendered SSR HTML for the cart MF. */
  get cart(): string {
    return this.html.cart;
  }

  /** The pre-rendered SSR HTML for the user MF. */
  get user(): string {
    return this.html.user;
  }

  /** The full SSR HTML bundle for all three MFs. */
  get all(): MfSsrHtml {
    return this.html;
  }
}
