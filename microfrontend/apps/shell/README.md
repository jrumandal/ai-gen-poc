# @microfrontend/shell — Angular SSR shell

The **shell** is the host application of the micro-frontend reference
architecture. It is an **Angular 20** app (standalone components, signals)
served through the **`@angular/ssr` Express adapter**, and it composes the three
micro-frontends (`@mf/catalog`, `@mf/cart`, `@mf/user`) as **Web Components**
(`<catalog-mf>`, `<cart-mf>`, `<user-mf>`).

The shell owns:

- routing (`/catalog`, `/cart`, `/account`) and the top-level chrome (header,
  nav, theme toggle);
- **SSR composition** — the server renders each MF's markup and injects it into
  the page before first paint;
- **client bootstrap** — registering the MF custom elements and attaching the
  shared services (event bus + Apollo client) after hydration;
- the **shared `ApolloClient` singleton** that is injected into every MF.

## Public surface (`src/`)

| File | Purpose |
| --- | --- |
| `main.ts` | Client entry — registers MF elements, bootstraps Angular, attaches shared services. |
| `main.server.ts` | Server entry — renders MF SSR HTML, provides it, bootstraps Angular per request. |
| `server.ts` | Express app + `AngularNodeAppEngine` (SSR) + static hosting of `dist/.../browser`. |
| `app/app.ts` | Root component (header, nav, theme toggle, `<router-outlet>`). |
| `app/app.routes.ts` | Client routes: `/catalog`, `/cart`, `/account` (redirect `''` → `catalog`). |
| `app/app.routes.server.ts` | Server routes: `**` → `RenderMode.Server` (SSR every request). |
| `app/app.config.ts` | `provideClientHydration(withEventReplay())`, zone change detection, router. |
| `app/app.config.server.ts` | Merges `provideServerRendering(withRoutes(serverRoutes))`. |
| `app/mf-client-bootstrap.ts` | Client MF registration + shared-service attachment (event bus + Apollo). |
| `app/mf-ssr-token.ts` | `MF_SSR_HTML` injection token + `MfSsrHtml` shape. |
| `app/mf-ssr.service.ts` | `MfSsrService` — typed access to the per-MF SSR HTML. |
| `app/mf-ssr.server.ts` | `renderMfSsrHtml()` (cached) + `provideMfSsrHtml()` + sample props. |
| `app/catalog-page.ts` / `cart-page.ts` / `account-page.ts` | Route components that inject the SSR HTML. |

## Routes

| Path | Component | MF element |
| --- | --- | --- |
| `/catalog` | `CatalogPage` | `<catalog-mf>` |
| `/cart` | `CartPage` | `<cart-mf>` |
| `/account` | `AccountPage` | `<user-mf>` |

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
   `MF_SSR_HTML` token) and inject it into the MF element via `[innerHTML]`.
3. **`server.ts`** wires the Express app:
   - static hosting of `dist/apps/shell/browser` (1-year max-age, no index);
   - `AngularNodeAppEngine` handles `/**` and streams the rendered HTML;
   - listens on `PORT` (default `4000`).

> **SSRF host-allowlist fix.** Angular's SSRF validation rejects requests whose
> host is not allow-listed. The generated engine manifest ships with
> `allowedHosts: []`, and the `security.allowedHosts` build option is stripped by
> Nx schema validation. The fix is to pass the allow-list **directly to the
> engine constructor**:
>
> ```ts
> const angularApp = new AngularNodeAppEngine({
>   allowedHosts: ['localhost', '127.0.0.1'],
> });
> ```
>
> Without this, SSR silently falls back to CSR (empty `<catalog-mf>` etc.).

## Client bootstrap flow

`main.ts` runs, in order:

1. `registerMfElements()` — `Promise.all` of the three MFs' `register()` (defines
   the custom elements; idempotent).
2. `bootstrapApplication(App, appConfig)` — boots Angular.
3. `attachMfSharedServices()` — for each MF, `hydrate({ eventBus, apolloClient })`
   attaches the shared services to the already-connected elements.

Each MF's custom element, on `connectedCallback`, checks for existing SSR content
(`childNodes.length > 0`): if present it **hydrates** (attaches handlers without
re-rendering); otherwise it renders fresh.

## Shared Apollo client (Phase 3.4)

The shell owns a single `ApolloClient` and injects it into every MF so they can
issue typed GraphQL queries/mutations against the gateway.

- **Type + factory** live in `@shared/contracts` (`src/apollo.ts`):
  - `MfApolloClient` — the shared client type (an `ApolloClient`).
  - `createSharedApolloClient({ uri, headers?, credentials? })` — builds an
    `ApolloClient` with an `HttpLink` and `InMemoryCache`, defaulting to
    `watchQuery: { fetchPolicy: 'cache-and-network' }`.
- **Shell singleton** (`mf-client-bootstrap.ts`):
  - `getSharedApolloClient()` lazily creates the client.
  - The gateway URI comes from `GATEWAY_URI` (env) or defaults to
    `http://localhost:4200/graphql`.
- **Injection** — `attachMfSharedServices()` passes `{ eventBus, apolloClient }`
  to each MF's `hydrate()`.
- **MF side** — each MF accepts + stores `apolloClient` (type-only, erased at
  runtime via `import type`):
  - `@mf/catalog` — `@Input() apolloClient` on `CatalogComponent`.
  - `@mf/cart` — `apolloClient` prop on `CartElement` / `CartProps`.
  - `@mf/user` — `apolloClient` prop on `UserElement` / `UserPanelProps`.

Because the MFs only consume the **type** (not the runtime), they do not each
need a direct `@apollo/client` dependency — they import `MfApolloClient` from
`@shared/contracts`.

## Build & run

```bash
# Build (browser + server bundles)
npx nx build shell

# Run the SSR server (Express + Angular SSR)
PORT=4100 node dist/apps/shell/server/server.mjs

# Verify SSR — each route should return server-rendered MF markup
curl -s http://localhost:4100/catalog | grep -o 'catalog-mf' | head -1
curl -s http://localhost:4100/cart    | grep -o 'cart-mf'    | head -1
curl -s http://localhost:4100/account | grep -o 'user-mf'    | head -1
```

> **Entry point note:** `dist/apps/shell/server/server.mjs` is the Express
> server (boots and listens). `dist/apps/shell/server/main.server.mjs` is the
> Angular bootstrap entry and **exits immediately** when run directly — do not
> use it to serve.

## Test & lint

```bash
npx nx test shell    # Jest (root component: brand, nav links, theme toggle)
npx nx lint shell
```

## Shared contracts consumed

- `@shared/contracts` — `MfApolloClient`, `createSharedApolloClient` (runtime),
  plus the generated GraphQL types (type-only).
- `@shared/event-bus` — `EventBus`, `MFEventMap`.
- `@shared/design-tokens` — `tokens.css` (imported in `styles.css`).
- `@mf/catalog`, `@mf/cart`, `@mf/user` — `register`, `hydrate`, `render`.
