# @jrumandal/shell — Angular SSR shell

The **shell** is the host application of the micro-frontend reference
architecture. It is an **Angular 20** app (standalone components, signals)
served through the **`@angular/ssr` Express adapter**, and it composes the three
micro-frontends (`@jrumandal/catalog`, `@jrumandal/cart`, `@jrumandal/user`) as **Web Components**
(`<mf-catalog>`, `<mf-cart>`, `<mf-user>`).

The shell owns:

- routing (`/catalog`, `/cart`, `/account`) and the top-level chrome (header,
  nav, theme toggle);
- **SSR composition** — the server renders each MF's markup and injects it into
  the page before first paint;
- **client bootstrap** — registering the MF custom elements and attaching the
  shared services (event bus + Apollo client) after hydration;
- the **shared `ApolloClient` singleton** that is injected into every MF;
- the **NgRx store** — the single source of truth for catalog, cart, user, and
  navigation state, hydrated from the gateway and pushed into the MF elements
  on every navigation (see [State management](#state-management-ngrx)).

## Dependencies

The shell consumes the micro-frontends and shared packages as **versioned
dependencies** (published to the npm registry, or linked as a local pnpm
workspace during development):

| Package | Role |
| --- | --- |
| `@jrumandal/catalog` | Angular micro-frontend (catalog) |
| `@jrumandal/cart` | React micro-frontend (cart) |
| `@jrumandal/user` | Vue micro-frontend (account) |
| `@jrumandal/contracts` | Shared domain types + Apollo client factory |
| `@jrumandal/design-tokens` | Design tokens (CSS variables) + `Tokens`/`cssVar` |
| `@jrumandal/event-bus` | Cross-MF event bus (`emit`/`on`/`once`/`off`) |
| `@jrumandal/bridge` | Native bridge adapter (Capacitor) |
| `@ngrx/store` | NgRx state management (single source of truth) |
| `@ngrx/effects` | NgRx side-effect handling (gateway fetches) |
| `@ngrx/router-store` | NgRx router state (navigation backtracing) |

The shell also provides `react`, `react-dom`, `vue`, and
`@vue/server-renderer` as its **own** dependencies so the MFs' `peerDependencies`
resolve to a single copy.

## Design system (Tailwind v4 host)

The shell is the **Tailwind v4 host** for the whole platform. The micro-frontends
emit **Tailwind utility classes** in their markup; the shell generates the
corresponding CSS and ships it to the browser.

- `postcss.config.json` — enables `@tailwindcss/postcss` (Tailwind v4).
- `src/styles.css` —
  - `@import "tailwindcss";` (triggers Tailwind processing);
  - `@import "@jrumandal/design-tokens/tokens.css";` (the CSS-variable token set);
  - `@theme inline { … }` — maps every design token into the Tailwind v4 theme
    namespace (`--color-*`, `--spacing-*`, `--font-*`, `--radius-*`,
    `--shadow-*`, …) so utilities like `bg-brand-500`, `text-text-primary`,
    `p-4`, `rounded-md` resolve to the shared CSS variables;
  - `@source "../../cart/src";` `@source "../../catalog/src";`
    `@source "../../user/src";` — lets Tailwind scan the sibling MF repos for
    the utility classes they use;
  - `@layer base { … }` — global reset + body typography.

Because the tokens are CSS variables, the `[data-theme='dark']` overrides in
`tokens.css` re-theme the entire UI (including every MF) with a single attribute
flip — no per-MF CSS.


## Public surface (`src/`)

| File | Purpose |
| --- | --- |
| `main.ts` | Client entry — registers MF elements, bootstraps Angular, attaches shared services. |
| `main.server.ts` | Server entry — renders MF SSR HTML, provides it, bootstraps Angular per request. |
| `server.ts` | Express app + `AngularNodeAppEngine` (SSR) + static hosting of `dist/shell/browser`. |
| `app/app.ts` | Root component (header, nav, theme toggle, `<router-outlet>`). |
| `app/app.routes.ts` | Client routes: `/catalog`, `/cart`, `/account` (redirect `''` → `catalog`). |
| `app/app.routes.server.ts` | Server routes: `**` → `RenderMode.Server` (SSR every request). |
| `app/app.config.ts` | `provideClientHydration(withEventReplay())`, zone change detection, router. |
| `app/app.config.server.ts` | Merges `provideServerRendering(withRoutes(serverRoutes))`. |
| `app/mf-client-bootstrap.ts` | Client MF registration + shared-service attachment (event bus + Apollo). |
| `app/mf-ssr-token.ts` | `MF_SSR_HTML` injection token + `MfSsrHtml` shape. |
| `app/mf-ssr.service.ts` | `MfSsrService` — typed access to the per-MF SSR HTML. |
| `app/mf-ssr.server.ts` | `renderMfSsrHtml()` (cached) + `provideMfSsrHtml()` + sample props. |
| `app/store/catalog.actions.ts` | Catalog actions — `load`, `loadSuccess`, `loadFailure`. |
| `app/store/catalog.reducer.ts` | `catalogReducer` — `CatalogState { products, categories, loading, loaded, error }`. |
| `app/store/catalog.selectors.ts` | `selectProducts`, `selectCategories`, `selectCatalogLoading`, `selectCatalogLoaded`, `selectCatalogError`. |
| `app/store/cart.actions.ts` | Cart actions — `load`, `loadSuccess`, `loadFailure`. |
| `app/store/cart.reducer.ts` | `cartReducer` — `CartState { cart, loading, loaded, error }`. |
| `app/store/cart.selectors.ts` | `selectCart`, `selectCartLoading`, `selectCartLoaded`, `selectCartError`. |
| `app/store/user.actions.ts` | User actions — `load`, `loadSuccess`, `loadFailure`. |
| `app/store/user.reducer.ts` | `userReducer` — `UserState { user, loading, loaded, error }`. |
| `app/store/user.selectors.ts` | `selectUser`, `selectUserLoading`, `selectUserLoaded`, `selectUserError`. |
| `app/store/navigation.actions.ts` | `routeChanged` action + `NavigationEntry` type. |
| `app/store/navigation.reducer.ts` | `navigationReducer` — `NavigationState { current, history }` (bounded to 50 entries). |
| `app/store/navigation.selectors.ts` | `selectCurrentRoute`, `selectNavigationHistory`. |
| `app/store/shell.effects.ts` | `ShellEffects` — functional `createEffect` fetches via the shared `ApolloClient`; cart effect sequences the cross-slice user→cart dependency. |
| `app/catalog-page.ts` / `cart-page.ts` / `account-page.ts` | Route components that hydrate the MF element from the store on every navigation. |

## Routes

| Path | Component | MF element |
| --- | --- | --- |
| `/catalog` | `CatalogPage` | `<mf-catalog>` |
| `/cart` | `CartPage` | `<mf-cart>` |
| `/account` | `AccountPage` | `<mf-user>` |

`/` redirects to `/catalog`. All routes are SSR-rendered per request
(`RenderMode.Server`).

## SSR composition flow

1. **`main.server.ts`** runs per request:
   - `renderMfSsrHtml()` (from `mf-ssr.server.ts`) calls each MF's `render(props)`
     in parallel (`Promise.all`, result cached for the process lifetime) and
     returns `{ catalog, cart, user }` HTML strings.
   - `provideMfSsrHtml(html)` merges that into the application config.
   - `bootstrapApplication(App, serverConfig, context)` renders the shell.
2. **Route components** read the HTML from `MfSsrService` (backed by the
   `MF_SSR_HTML` token) and inject it into the MF element via the
   `appMfSsrHtml` directive.
3. **`server.ts`** wires the Express app:
   - static hosting of `dist/shell/browser` (1-year max-age, no index);
   - `AngularNodeAppEngine` handles `/**` and streams the rendered HTML.

## Client bootstrap flow

1. **`main.ts`** runs once on the client:
   - `registerMfElements()` — registers the three MF custom elements
     (`<mf-catalog>`, `<mf-cart>`, `<mf-user>`).
   - `bootstrapApplication(App, appConfig)` — bootstraps Angular (the NgRx
     store, effects, and router-store are provided in `app.config.ts`).
   - `attachMfSharedServices()` — hydrates each MF with the shared event bus +
     Apollo client.

Data loading is **not** done in the bootstrap. Each route component dispatches
a `load` action and hydrates the MF element from the store on every navigation
(see [State management](#state-management-ngrx)).

## State management (NgRx)

The shell is the **composition root** and the **single source of truth** for
cross-MF state. The three micro-frontends are plain Web Components (Angular,
React, Vue) with no shared DI container, so the store lives in the shell rather
than inside each MF.

**Why shell-level, not per-MF:**

- The MFs are independent frameworks with no common DI; a per-MF store would be
  three isolated stores with no way to coordinate.
- The shell is the only place that sees *all three* MFs and the router, so it is
  the natural owner of shared state and navigation history.
- Keeping the store in the shell keeps the MFs **self-contained** (they render
  whatever props they are given) and preserves the "no direct cross-MF imports"
  rule.

**Shape of the store** (`app/store/`):

| Slice | Contents |
| --- | --- |
| `catalog` | `products`, `categories`, `loading`, `loaded`, `error` |
| `cart` | `cart` (the `Cart` object or `null`), `loading`, `loaded`, `error` |
| `user` | `user` (the `User` object or `null`), `loading`, `loaded`, `error` |
| `navigation` | `current`, `history` (backtrace of completed navigations, capped at 50) |
| `router` | `@ngrx/router-store` state (current/previous router state) |

**Flow:**

1. A route component dispatches the slice's `load` action on `ngOnInit`.
2. `ShellEffects` (functional `createEffect`) fetches from the gateway via the
   shared `ApolloClient`. The cart effect first ensures the `user` slice is
   loaded (the cart is fetched per user), then fetches the cart.
3. The reducer stores the result in the matching slice.
4. The route component subscribes to the slice and **pushes the state into the
   MF element's properties** (`el.products = …`, `el.categories = …`,
   `el.cart = …`, `el.user = …`), so the MF re-renders on every navigation.
5. `ShellEffects.navigation$` listens to `ROUTER_NAVIGATED` and records every
   completed navigation into the `navigation` slice (`current` plus a bounded
   `history`), giving a **backtrace** of the session.

This fixes the "state not propagated on re-navigation" issue: the store persists
across route changes, and each navigation re-hydrates the MF from the store.

> **Hydration timing note:** the MF element is captured with
> `@ViewChild('mf', { static: false })`, which is **not resolved in
> `ngOnInit()`**. On re-navigation the store already holds the data, so the
> `ngOnInit` subscription fires before the element exists and the push is
> dropped. Each page therefore also re-selects the current store state in
> `ngAfterViewInit()` (`take(1)`) and pushes it into the element once the view
> is initialized — this is what makes re-navigation re-hydrate without a full
> page refresh.

## Development

```bash
pnpm install
pnpm serve        # dev server (http://localhost:4200)
pnpm build        # production build (dist/shell)
pnpm start        # run the SSR server (node dist/shell/server/server.mjs)
pnpm test         # Jest (jest-preset-angular)
pnpm lint         # ESLint (angular-eslint)
pnpm typecheck    # tsc --noEmit
```

## CI

The shell's CI is **self-contained**: it checks out the `shared`, `cart`,
`catalog`, and `user` repos as siblings and links them into a pnpm workspace so
the `workspace:*` dependencies resolve without a registry. See
`.github/workflows/ci.yml`.
