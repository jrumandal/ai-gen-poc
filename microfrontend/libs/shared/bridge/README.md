# `@shared/bridge` — Capacitor bridge adapter

The single integration surface for **native (Capacitor) capabilities** in the
micro-frontend shell and its micro-frontends.

Micro-frontends and the shell import from `@shared/bridge` — **never from
`@capacitor/*` directly** — so that:

1. **Native calls are isolated in one place** (easy to swap, mock, and test).
2. **A Web-API fallback is available in the browser**, so the same code runs in
   both the Capacitor WebView and a plain browser tab.

This is the "bridge adapter" called out in `plan.md` (Phase 5): it isolates
native calls from web code and provides a Web-API fallback in the browser.

## Why an adapter (and not direct `@capacitor/*` imports)?

- **Browser-safe.** The adapter detects the native runtime via the
  `window.Capacitor` global (installed by `@capacitor/core` at runtime) rather
  than a hard import, so it has **no runtime dependency on Capacitor in the
  browser** and is trivially unit-testable in Node/Jest.
- **Clean bundles.** The camera plugin is loaded via a **dynamic
  `import('@capacitor/camera')`** only when we are on a native platform. This
  keeps the browser bundle free of the native plugin and avoids ESM/CJS interop
  issues in non-native environments. (This is also why the catalog MF can list
  `@shared/bridge` in `allowedNonPeerDependencies` without bundling
  `@capacitor/*`.)
- **One place to change.** Swapping the camera plugin, adding a new native
  capability, or changing the fallback strategy touches a single file.

## Public API

```ts
import { getBridgeAdapter, BridgeAdapter } from '@shared/bridge';

const bridge = getBridgeAdapter();          // shared lazy singleton
bridge.isNativePlatform();                  // boolean — are we in a Capacitor WebView?
bridge.getPlatformInfo();                   // { isNative, platform: 'android'|'ios'|'web', userAgent }
bridge.scanProduct({ quality: 80 });        // Promise<ScanResult> — capture a product image
```

### Types

| Type | Shape |
| --- | --- |
| `ScanResult` | `{ image: string /* data: URL */, source: 'capacitor' \| 'web' }` |
| `ScanOptions` | `{ quality?: number /* 0–100, default 80 */, width?: number, height?: number }` |
| `PlatformInfo` | `{ isNative: boolean, platform: 'android' \| 'ios' \| 'web', userAgent: string }` |

### `scanProduct(options?)`

Captures a product image for the "scan product" demo:

- **Native (Capacitor):** uses `@capacitor/camera` (loaded on demand) —
  `Camera.getPhoto` with `resultType: Base64`, `direction: Rear`,
  `source: Camera`. Returns the base64 as a `data:` URL (or reads a local
  `webPath` via `fetch` + `FileReader`).
- **Browser:** falls back to `getUserMedia({ video: { facingMode: 'environment' } })`
  + a canvas snapshot → `toDataURL('image/jpeg', 0.8)`. Throws a descriptive
  error when no camera path is available (e.g. an insecure context without
  `getUserMedia`).

## Native detection

`detectNative()` returns `true` only inside a Capacitor native WebView:

- Uses `window.Capacitor.isNativePlatform()` when available, else the
  `window.__CAPACITOR__` marker.
- Returns `false` in Node / SSR / a plain browser (where `window` is undefined
  or the marker is absent).

## Usage in a micro-frontend (catalog MF example)

The catalog MF (`libs/mf/catalog`) wires the adapter into a "scan product"
demo:

```ts
import { getBridgeAdapter } from '@shared/bridge';

onScanProduct() {
  this.scanning = true;
  this.scanError = null;
  getBridgeAdapter()
    .scanProduct()
    .then((result) => {
      this.scanResult = result; // { image, source }
      this.scanning = false;
    })
    .catch((err) => {
      this.scanError = err instanceof Error ? err.message : String(err);
      this.scanning = false;
    });
}
```

The catalog MF declares `@shared/bridge` as a `dependency` and lists it in
`ng-package.json` → `allowedNonPeerDependencies` (ng-packagr requires non-peer
deps to be listed there). Because the adapter loads `@capacitor/camera`
dynamically, the catalog MF's browser bundle stays free of the native plugin.

## Testing

`src/lib/bridge-adapter.spec.ts` — 7 tests covering native detection, platform
info, and the Web-API fallback path (the native path is exercised via the
dynamic-import boundary). Run with:

```bash
npx nx test bridge
```

## Files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Public API (re-exports `BridgeAdapter`, `getBridgeAdapter`, types). |
| `src/lib/bridge-adapter.ts` | The adapter: detection, `scanProduct`, native + Web-API paths. |
| `src/lib/bridge-adapter.spec.ts` | Unit tests. |
| `package.json` | `@shared/bridge` (deps: `@capacitor/core`, `@capacitor/camera`, `tslib`). |
| `project.json` | Nx project `bridge` (build `@nx/js:tsc`, lint, test). |
