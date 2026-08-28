# @mf/catalog — Angular micro-frontend

The **catalog** micro-frontend, written in **Angular 20** and exposed as the
`<catalog-mf>` Web Component. It renders a product grid with category filter
chips. It is the reference for the **Angular custom-element** track of Phase 2.

## Public API (`src/index.ts`)

| Export | Kind | Purpose |
| --- | --- | --- |
| `CatalogComponent` | Angular component | The standalone, light-DOM component (direct use / tests). |
| `CATALOG_SSR_PROPS` | `InjectionToken` | Carries initial SSR props into the component on the server. |
| `render(props)` | `async (props) => Promise<string>` | **SSR entry** — renders the element to an HTML string (Node). |
| `register()` | `async () => Promise<void>` | **Client entry** — defines the `<catalog-mf>` custom element (idempotent). |
| `hydrate(options?)` | `async () => Promise<void>` | **Client entry** — registers + attaches the shared event bus. |
| `CatalogProps` | type | `{ products?, categories?, eventBus? }` accepted by `render`. |

## How it works

- **Custom element** — `register.ts` wraps `CatalogComponent` with
  `@angular/elements`' `createCustomElement`. The component uses
  `ViewEncapsulation.None` (light DOM) so the shell's global styles and the
  shared design tokens apply.
- **SSR** — `ssr.ts` uses `@angular/platform-server`'s `renderApplication` with
  a `bootstrapApplication` bootstrap function (Angular 20 SSR surface). Initial
  inputs are injected via the `CATALOG_SSR_PROPS` token so the serialized markup
  reflects the given props. The function returns the **inner HTML** of
  `<catalog-mf>` so the shell can inline it.
- **Hydration** — `hydrate.ts` calls `register()` (async, because it builds the
  Angular application injector via `createApplication`) and attaches the shared
  `EventBus` to any existing `<catalog-mf>` elements.
- **Data** — receives `products` / `categories` as inputs (framework-agnostic,
  testable). Emits a DOM `Event` and, when an `EventBus` is provided, a typed
  cross-MF event (e.g. `catalog:productViewed`).

## Shared contracts consumed

- `@shared/contracts` — `Product`, `Category` types (type-only).
- `@shared/design-tokens` — `cssVar`, `Tokens` for styling.
- `@shared/event-bus` — `EventBus`, `MFEventMap`, `CatalogEvent`.

## Build & test

```bash
nx build catalog-mf   # @nx/angular:package (ng-packagr) → dist/libs/mf/catalog
nx test catalog-mf    # Jest (SSR-string + custom-element JSDOM tests)
nx lint catalog-mf
```

> **Externalization:** Angular peer deps (`@angular/*`, `rxjs`, `zone.js`) are
> `peerDependencies` (ng-packagr externalizes them); `@shared/*` are
> `workspace:*` deps resolved via `tsconfig.lib.json` `paths` → `dist`.
