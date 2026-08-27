import type { EventBus, MFEventMap } from '@shared/event-bus';
import { register } from './register';

/**
 * Hydrate all `<user-mf>` elements on the page.
 *
 * Registers the custom element (if not already registered) and attaches the
 * shared event bus to each element so cross-MF events flow through a single
 * bus instance. The element's `connectedCallback` performs the actual Vue
 * hydration against the existing SSR markup.
 */
export async function hydrate(options?: { eventBus?: EventBus<MFEventMap> | null }): Promise<void> {
  await register();
  const elements = document.querySelectorAll('user-mf');
  elements.forEach((element) => {
    const el = element as HTMLElement & { eventBus?: EventBus<MFEventMap> | null };
    if (options?.eventBus) {
      el.eventBus = options.eventBus;
    }
  });
}
