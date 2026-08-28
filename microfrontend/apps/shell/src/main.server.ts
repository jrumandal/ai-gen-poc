import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { renderMfSsrHtml, provideMfSsrHtml } from './app/mf-ssr.server';
import { mergeApplicationConfig } from '@angular/core';

/**
 * Server bootstrap.
 *
 * Before bootstrapping the Angular app, we pre-render the three
 * micro-frontends to HTML strings (via their `render(props)` entry points)
 * and inject the result into the DI tree through the `MF_SSR_HTML` token.
 * Page components then bind this HTML synchronously during the initial SSR
 * pass, so the server output includes the MF markup.
 */
const bootstrap = async (context: BootstrapContext) => {
  const ssrHtml = await renderMfSsrHtml();
  const serverConfig = mergeApplicationConfig(config, provideMfSsrHtml(ssrHtml));
  return bootstrapApplication(App, serverConfig, context);
};

export default bootstrap;
