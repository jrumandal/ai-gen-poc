/**
 * Public API for the `@shared/bridge` Capacitor bridge adapter.
 *
 * This is the single integration surface for native (Capacitor) capabilities.
 * Micro-frontends and the shell import from here — never from `@capacitor/*`
 * directly — so that native calls are isolated and a Web-API fallback is
 * available in the browser.
 *
 * Exports:
 *  - `BridgeAdapter` — the adapter class (Capacitor detection + camera scan).
 *  - `getBridgeAdapter()` — lazily-created shared instance.
 *  - `ScanResult`, `ScanOptions`, `PlatformInfo` — the type surface.
 */
export {
  BridgeAdapter,
  getBridgeAdapter,
  type ScanResult,
  type ScanOptions,
  type PlatformInfo,
} from './lib/bridge-adapter';
