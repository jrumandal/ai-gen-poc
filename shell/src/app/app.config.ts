import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { catalogReducer } from './store/catalog.reducer';
import { cartReducer } from './store/cart.reducer';
import { userReducer } from './store/user.reducer';
import { navigationReducer } from './store/navigation.reducer';
import { ShellEffects } from './store/shell.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    // NgRx store — the shell is the single source of truth for the three
    // micro-frontend feature slices (catalog, cart, user) plus the navigation
    // trail. Each MF is a plain web component with no store of its own, so the
    // shell owns the state and pushes it into the elements on every navigation.
    provideStore({
      catalog: catalogReducer,
      cart: cartReducer,
      user: userReducer,
      navigation: navigationReducer,
      router: routerReducer,
    }),
    provideEffects([ShellEffects]),
    provideRouterStore(),
  ],
};
