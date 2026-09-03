import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  registerMfElements,
  attachMfSharedServices,
} from './app/mf-client-bootstrap';

/**
 * Client bootstrap.
 *
 * 1. Register the three MF custom elements BEFORE Angular bootstraps so
 *    they are defined when Angular creates (or upgrades) them.
 * 2. Bootstrap the Angular app.
 * 3. Attach the shared services (event bus + Apollo client) to the connected
 *    MF elements.
 *
 * Data loading is no longer a one-shot step here: each page dispatches a
 * `load` action on navigation and the NgRx effects fetch (or reuse the cached
 * slice), then the page pushes the store state into the MF element. This is
 * what fixes the "state not propagated on re-navigation" bug.
 */
(async () => {
  await registerMfElements();
  await bootstrapApplication(App, appConfig);
  await attachMfSharedServices();
})().catch((err) => console.error(err));
