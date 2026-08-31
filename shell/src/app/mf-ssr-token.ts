/**
 * Injection token carrying the pre-rendered SSR HTML for the three
 * micro-frontends.
 *
 * On the server, the HTML is computed once at module-load time (see
 * `main.server.ts`) and exposed through this token so page components can
 * bind it synchronously during the initial SSR pass.
 *
 * On the client, the token resolves to empty strings — the MF custom
 * elements self-activate via their `connectedCallback` → `hasSSRContent()`
 * → `hydrate()`/`render()` pattern once the shell calls `register()`.
 */
import { InjectionToken } from '@angular/core';

/** The pre-rendered SSR HTML for each micro-frontend. */
export interface MfSsrHtml {
  catalog: string;
  cart: string;
  user: string;
}

/** Empty SSR HTML (client-side default). */
export const EMPTY_MF_SSR_HTML: MfSsrHtml = { catalog: '', cart: '', user: '' };

export const MF_SSR_HTML = new InjectionToken<MfSsrHtml>('MF_SSR_HTML', {
  factory: () => EMPTY_MF_SSR_HTML,
});
