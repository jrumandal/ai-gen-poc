import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Shell root component.
 *
 * Renders the top navigation (links to the three micro-frontend routes),
 * a theme toggle, and the active route via `<router-outlet>`. The MF
 * custom elements themselves are hosted by the page components (see
 * `catalog-page.ts`, `cart-page.ts`, `account-page.ts`).
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'Micro-Frontend Shell';

  /** Current theme: 'light' or 'dark'. */
  protected readonly theme = signal<'light' | 'dark'>('light');

  /** Toggle between light and dark themes. */
  protected toggleTheme(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
  }
}
