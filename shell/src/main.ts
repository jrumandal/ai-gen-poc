import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  registerMfElements,
  attachMfSharedServices,
  loadMfData,
} from './app/mf-client-bootstrap';

/**
 * Client bootstrap.
 *
 * 1. Register the three MF custom elements BEFORE Angular bootstraps so
 *    they are defined when Angular creates (or upgrades) them.
 * 2. Bootstrap the Angular app.
 * 3. Attach the shared services (event bus + Apollo client) to the connected
 *    MF elements.
 */
(async () => {
  await registerMfElements();
  await bootstrapApplication(App, appConfig);
  await attachMfSharedServices();
  await loadMfData();
})().catch((err) => console.error(err));
