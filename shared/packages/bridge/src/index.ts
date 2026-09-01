/**
 * @shared/bridge — minimal web-component bridge utilities.
 *
 * Phase B expands this into the full host/bridge layer (lifecycle management,
 * shared context injection, error isolation). This placeholder provides a
 * working `mountWebComponent` helper so Phase A CI is green.
 */
export interface MountOptions {
  /** Custom-element tag name, e.g. `mf-catalog`. */
  tag: string;
  /** Container element to mount into. */
  container: HTMLElement;
  /** Optional attributes set on the element. */
  attributes?: Record<string, string>;
}

/**
 * Create (or reuse) a custom element and attach it to a container.
 * Returns the element so callers can set properties / listen for events.
 */
export function mountWebComponent(options: MountOptions): HTMLElement {
  const { tag, container, attributes = {} } = options;
  let el = container.querySelector<HTMLElement>(tag);
  if (!el) {
    el = document.createElement(tag);
    container.appendChild(el);
  }
  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, value);
  }
  return el;
}

export const BRIDGE_VERSION = '0.0.1';
