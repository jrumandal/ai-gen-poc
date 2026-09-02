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
- the **shared `ApolloClient` singleton** that is injected into every MF.

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
| `app/catalog-page.ts` / `cart-page.ts` / `account-page.ts` | Route components that inject the SSR HTML. |

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
   - `bootstrapApplication(App, appConfig)` — bootstraps Angular.
   - `attachMfSharedServices()` — hydrates each MF with the shared event bus +
     Apollo client.
   - `loadMfData()` — fetches real data (catalog, cart, user) and sets it on the
     MF elements.

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
