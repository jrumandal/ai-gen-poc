/**
 * Cart page.
 *
 * Hosts the `mf-cart` custom element (the React micro-frontend). The element
 * is defined by `@jrumandal/cart` and registered in `main.ts` before Angular
 * bootstrap.
 *
 * The page binds the pre-rendered SSR HTML (from `MfSsrService`) to the
 * element via the `appMfSsrHtml` directive. On the server this injects the
 * SSR markup; on the client the bound value is empty so the MF's own
 * light-DOM rendering is left untouched.
 */
import { NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, take } from 'rxjs';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';
import { load as cartLoad } from './store/cart.actions';
import {
  selectCart,
  selectCartError,
  selectCartLoading,
} from './store/cart.selectors';

@Component({
  selector: 'app-cart-page',
  imports: [NgIf, MfSsrHtmlDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Cart</h1>
    <p *ngIf="loading" class="status">Loading cart…</p>
    <p *ngIf="error" class="error">{{ error }}</p>
    <mf-cart #mf [appMfSsrHtml]="ssrHtml"></mf-cart>
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
      .status {
        color: var(--color-text-secondary);
      }
      .error {
        color: #b00020;
      }
      mf-cart {
        display: block;
      }
    `,
  ],
})
export class CartPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mf', { static: false }) mfEl?: ElementRef<HTMLElement>;

  loading = false;
  error: string | null = null;

  private readonly ssrService = new MfSsrService();

  /** The pre-rendered SSR HTML for the cart MF (empty on the client). */
  readonly ssrHtml = this.ssrService.cart;

  private readonly subs: Subscription[] = [];

  private readonly store = inject(Store);

  ngOnInit(): void {
    // Request the cart from the store. The effect resolves the current user
    // (loading it first if needed) and fetches the cart for that user, or an
    // empty cart when signed out.
    this.store.dispatch(cartLoad());

    this.subs.push(
      this.store
        .select(selectCartLoading)
        .subscribe((loading) => (this.loading = loading))
    );
    this.subs.push(
      this.store
        .select(selectCartError)
        .subscribe((error) => (this.error = error))
    );
    // Push the store state into the web component whenever the cart changes,
    // so the MF re-renders on every navigation (the shell is the source of
    // truth; the MF is a plain web component with no store of its own).
    this.subs.push(
      this.store.select(selectCart).subscribe((cart) => {
        this.pushStateToElement(cart);
      })
    );
  }

  ngAfterViewInit(): void {
    // `mfEl` is only resolved after view init (static: false). On re-navigation
    // the store already holds the cart, so the ngOnInit subscription fired
    // before the element existed and the push was dropped. Re-push the current
    // state now that the element is present.
    this.store
      .select(selectCart)
      .pipe(take(1))
      .subscribe((cart) => this.pushStateToElement(cart));
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private pushStateToElement(cart: unknown): void {
    const el = this.mfEl?.nativeElement;
    if (!el) {
      return;
    }
    (el as unknown as { cart: unknown }).cart = cart;
  }
}
