import { Route } from '@angular/router';
import { CatalogPage } from './catalog-page';
import { CartPage } from './cart-page';
import { AccountPage } from './account-page';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: CatalogPage, title: 'Catalog — Shell' },
  { path: 'cart', component: CartPage, title: 'Cart — Shell' },
  { path: 'account', component: AccountPage, title: 'Account — Shell' },
];
