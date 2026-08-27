/**
 * Client-side hydration entry for the catalog micro-frontend.
 *
 * After the shell's first paint (which includes the server-rendered light-DOM
 * markup from `ssr.ts`), the shell calls `hydrate()` to:
 *  1. Register the `<catalog-mf>` custom element (if not already done).
 *  2. Optionally attach a shared `EventBus` so the element can publish
 *     cross-MF events (e.g. `catalog:productViewed`).
 *
 * The Angular element framework takes over rendering from this point; the
 * existing light-DOM markup is preserved (no full re-render flash) because
 * the component's initial state matches the server-rendered output.
 */
import type { EventBus, MFEventMap } from '@shared/event-bus';
import { register } from './register';

/**
 * Hydrate the catalog micro-frontend on the client.
 *
 * `register()` is asynchronous (it builds the Angular application injector),
 * so this returns a promise that resolves once the element is registered and
 * the event bus is attached.
 *
 * @param options Optional hydration options.
 * @param options.eventBus Shared event bus to attach to the element.
 */
export async function hydrate(options?: {
  eventBus?: EventBus<MFEventMap> | null;
}): Promise<void> {
  await register();

  // Attach the event bus to any existing `<catalog-mf>` elements on the page.
  if (options?.eventBus && typeof document !== 'undefined') {
    const elements = document.querySelectorAll('catalog-mf');
    elements.forEach((el) => {
      (el as unknown as { eventBus: EventBus<MFEventMap> | null }).eventBus =
        options.eventBus ?? null;
    });
  }
}
