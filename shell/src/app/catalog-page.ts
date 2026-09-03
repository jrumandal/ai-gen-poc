/**
 * Catalog page.
 *
 * Hosts the `mf-catalog` custom element (the Angular micro-frontend). The
 * element is defined by `@jrumandal/catalog` and registered in `main.ts` before
 * Angular bootstrap.
 *
 * The page binds the pre-rendered SSR HTML (from `MfSsrService`) to the
 * element via the `appMfSsrHtml` directive. On the server this injects the
 * SSR markup; on the client the bound value is empty so the MF's own
 * light-DOM rendering is left untouched.
 */
import { NgIf } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Subscription } from 'rxjs';
import type { Category, Product } from '@jrumandal/contracts';
import { MfSsrService } from './mf-ssr.service';
import { MfSsrHtmlDirective } from './mf-ssr-html.directive';
import { load as catalogLoad } from './store/catalog.actions';
import {
  selectCatalogError,
  selectCatalogLoading,
  selectCategories,
  selectProducts,
} from './store/catalog.selectors';

@Component({
  selector: 'app-catalog-page',
  imports: [NgIf, MfSsrHtmlDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Catalog</h1>
    <p *ngIf="loading" class="status">Loading catalog…</p>
    <p *ngIf="error" class="error">{{ error }}</p>
    <mf-catalog #mf [appMfSsrHtml]="ssrHtml"></mf-catalog>
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
      mf-catalog {
        display: block;
      }
    `,
  ],
})
export class CatalogPage implements OnInit, OnDestroy {
  @ViewChild('mf', { static: false }) mfEl?: ElementRef<HTMLElement>;

  loading = false;
  error: string | null = null;

  private readonly ssrService = new MfSsrService();

  /** The pre-rendered SSR HTML for the catalog MF (empty on the client). */
  readonly ssrHtml = this.ssrService.catalog;

  private readonly subs: Subscription[] = [];

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    // Request the catalog from the store. The effect fetches it only when the
    // slice is not yet loaded, so re-navigating reuses the cached state.
    this.store.dispatch(catalogLoad());

    this.subs.push(
      this.store
        .select(selectCatalogLoading)
        .subscribe((loading) => (this.loading = loading))
    );
    this.subs.push(
      this.store
        .select(selectCatalogError)
        .subscribe((error) => (this.error = error))
    );
    // Push the store state into the web component whenever the data changes,
    // so the MF re-renders on every navigation (the shell is the source of
    // truth; the MF is a plain web component with no store of its own).
    this.subs.push(
      combineLatest([
        this.store.select(selectProducts),
        this.store.select(selectCategories),
      ]).subscribe(([products, categories]) => {
        this.pushStateToElement(products, categories);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private pushStateToElement(products: unknown[], categories: unknown[]): void {
    const el = this.mfEl?.nativeElement;
    if (!el) {
      return;
    }
    (el as unknown as { products: unknown[] }).products = products;
    (el as unknown as { categories: unknown[] }).categories = categories;
  }
}
