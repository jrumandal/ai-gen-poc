/**
 * Account page.
 *
 * Hosts the `mf-user` custom element (the Vue micro-frontend). The element
 * is defined by `@jrumandal/user` and registered in `main.ts` before Angular
 * bootstrap.
 *
 * The page binds the pre-rendered SSR HTML (from `MfSsrService`) to the
 * element via the `appMfSsrHtml` directive. On the server this injects the
 * SSR markup; on the client the bound value is empty so the MF's own
 * light-DOM rendering is left untouched.
 */
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
import { load as userLoad } from './store/user.actions';
import {
  selectUser,
  selectUserError,
  selectUserLoading,
} from './store/user.selectors';

@Component({
  selector: 'app-account-page',
  imports: [MfSsrHtmlDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Account</h1>
    @if (loading) {
      <p class="status">Loading account…</p>
    }
    @if (error) {
      <p class="error">{{ error }}</p>
    }
    <mf-user #mf [appMfSsrHtml]="ssrHtml"></mf-user>
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
      mf-user {
        display: block;
      }
    `,
  ],
})
export class AccountPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mf', { static: false }) mfEl?: ElementRef<HTMLElement>;

  loading = false;
  error: string | null = null;

  private readonly ssrService = new MfSsrService();

  /** The pre-rendered SSR HTML for the user MF (empty on the client). */
  readonly ssrHtml = this.ssrService.user;

  private readonly subs: Subscription[] = [];

  private readonly store = inject(Store);

  ngOnInit(): void {
    // Request the signed-in user from the store. The effect fetches it only
    // when the slice is not yet loaded, so re-navigating reuses the cached
    // state.
    this.store.dispatch(userLoad());

    this.subs.push(
      this.store
        .select(selectUserLoading)
        .subscribe((loading) => (this.loading = loading))
    );
    this.subs.push(
      this.store
        .select(selectUserError)
        .subscribe((error) => (this.error = error))
    );
    // Push the store state into the web component whenever the user changes,
    // so the MF re-renders on every navigation (the shell is the source of
    // truth; the MF is a plain web component with no store of its own).
    this.subs.push(
      this.store.select(selectUser).subscribe((user) => {
        this.pushStateToElement(user);
      })
    );
  }

  ngAfterViewInit(): void {
    // `mfEl` is only resolved after view init (static: false). On re-navigation
    // the store already holds the user, so the ngOnInit subscription fired
    // before the element existed and the push was dropped. Re-push the current
    // state now that the element is present.
    this.store
      .select(selectUser)
      .pipe(take(1))
      .subscribe((user) => this.pushStateToElement(user));
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private pushStateToElement(user: unknown): void {
    const el = this.mfEl?.nativeElement;
    if (!el) {
      return;
    }
    (el as unknown as { user: unknown }).user = user;
  }
}
