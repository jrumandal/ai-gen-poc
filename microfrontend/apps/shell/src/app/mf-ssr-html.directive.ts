/**
 * Directive that sets `innerHTML` on a host element only when the bound
 * value is non-empty.
 *
 * This is used to inject pre-rendered SSR markup into MF custom elements
 * during the server pass, without overwriting the MF's own light-DOM
 * rendering on the client (where the bound value is empty).
 *
 * Usage:
 *   <catalog-mf [mfSsrHtml]="ssrHtml"></catalog-mf>
 */
import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[mfSsrHtml]',
  standalone: true,
})
export class MfSsrHtmlDirective {
  private readonly el: HTMLElement;

  constructor(ref: ElementRef<HTMLElement>) {
    this.el = ref.nativeElement;
  }

  @Input()
  set mfSsrHtml(html: string | null | undefined) {
    // Only set innerHTML when we have actual content (server-side SSR).
    // On the client, html is empty/null, so we leave the element's
    // light-DOM content (rendered by the MF) untouched.
    if (html && html.length > 0) {
      this.el.innerHTML = html;
    }
  }
}
