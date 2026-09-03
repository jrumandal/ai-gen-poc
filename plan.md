# Plan: Multi-Framework Micro-Frontend Reference Architecture (Web + Capacitor)

## TL;DR
Build a generic, runnable reference architecture in `d:\workspace\microfrontend` that composes Web Components written in **Angular, React, and Vue** into one shell, with **shell-level SSR + per-MF hydration** for SEO/perf, backed by **NestJS micro-services**, and wrapped for hybrid mobile via **Capacitor**. Nx monorepo with pnpm. Sample domain: e-commerce (catalog, cart, user) so each framework owns a real module.

**Chosen stack (per user)**
- Monorepo: **Nx + pnpm**
- Shell: **Angular** (SSR via `@angular/ssr` / Express adapter) — composes remote Web Components
- Micro-frontends: **Angular** (custom-elements), **React** (Vite, `react` custom element wrapper), **Vue 3** (Vite, custom element wrapper) — each exposed as a **Web Component**
- Composition strategy: **Web Components as the integration contract** (framework-agnostic, works inside Capacitor's WebView and inside any shell; light DOM is the default for SSR-compatible hydration)
- SSR: **shell-level SSR + per-MF hydration** — server renders each MF's markup to HTML string, shell streams/composites it, client hydrates each MF
- Backend: **Node.js + NestJS** micro-services (catalog, cart, user) with **GraphQL (Apollo)** + OpenAPI contracts
- Database: **PostgreSQL** with **Prisma ORM** (TypeScript-first, code-first schema, migrations)
- Mobile: **Capacitor** wrapper (single web build in `web/`, native plugins for camera/device, bridge adapter with Web-API fallback)
- Shared: GraphQL-generated TS types + clients, OpenAPI specs, shared design tokens, event bus contract

## Architecture Overview

```
Browser / Capacitor WebView
└── Shell (Angular SSR)                    ← owns routing, layout, SSR entry
    ├── <catalog-mf>   (Angular custom element, SSR-rendered, hydrated)
    ├── <cart-mf>      (React, SSR-rendered, hydrated)
    └── <user-mf>      (Vue 3, SSR-rendered, hydrated)
            │  (query via shared GraphQL clients)
            ▼
   API Gateway (NestJS + GraphQL Federation)  ──▶  catalog-svc / cart-svc / user-svc (NestJS)
                                                    │
                                                    ▼
                                              PostgreSQL (Prisma ORM)
```

Integration contract = **Web Components** (custom elements + light DOM by default + custom events). This is what makes mixed-framework composition, SSR string rendering, and Capacitor compatibility all work with one mechanism. Shadow DOM remains an opt-in choice for components that need strict style isolation.

API contract = **GraphQL** (Apollo Federation) with code-generated TS types — frontends query exactly what they need, NestJS services expose typed resolvers backed by Prisma.

## Monorepo Layout (Nx + pnpm)

```
microfrontend/
├── apps/
│   ├── shell/                    # Angular app (SSR) — composes the MFs
│   ├── mobile/                   # Capacitor wrapper project (web/ = shell build)
│   └── api-gateway/              # NestJS gateway (GraphQL Federation)
├── libs/
│   ├── mf/
│   │   ├── catalog/              # Angular MF (custom element)
│   │   ├── cart/                 # React MF (custom element)
│   │   └── user/                 # Vue MF (custom element)
│   ├── shared/
│   │   ├── contracts/            # GraphQL-generated TS types + clients
│   │   ├── design-tokens/        # CSS custom properties, theme
│   │   └── event-bus/            # typed custom-event names/payloads
│   └── server/
│       ├── catalog-svc/          # NestJS service (Prisma)
│       ├── cart-svc/             # NestJS service (Prisma)
│       ├── user-svc/             # NestJS service (Prisma)
│       └── db/                   # shared Prisma schema + client
├── openapi/                      # canonical .yaml specs (source of truth)
├── graphql/                      # canonical GraphQL schemas (per service + federation)
├── prisma/                       # Prisma schema + migrations
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Documentation (canonical per-module references)

> **Convention:** After `plan.md`, the **module READMEs are the canonical knowledge
> reference** for each area. Read the relevant README before working on a phase to
> avoid re-investigating the codebase. Each phase below lists its **References**.
> When a phase creates a new module, it must add that module's README (tracked in
> `STEPS.md` under the documentation step).

| Module | README |
| --- | --- |
| Contracts (GraphQL + OpenAPI types) | `microfrontend/libs/shared/contracts/README.md` |
| Event bus (typed cross-MF events) | `microfrontend/libs/shared/event-bus/README.md` |
| Design tokens (theme) | `microfrontend/libs/shared/design-tokens/README.md` |
| Database (Prisma client + tooling) | `microfrontend/libs/shared/db/README.md` |
| Catalog MF (Angular) | `microfrontend/libs/mf/catalog/README.md` |
| Cart MF (React) | `microfrontend/libs/mf/cart/README.md` |
| User MF (Vue) | `microfrontend/libs/mf/user/README.md` |
| Shell (Angular SSR) | `microfrontend/apps/shell/README.md` *(Phase 3)* |
| Server shared (NestJS) | `microfrontend/libs/server/shared/README.md` *(Phase 4)* |
| Catalog service | `microfrontend/libs/server/catalog-svc/README.md` *(Phase 4)* |
| Cart service | `microfrontend/libs/server/cart-svc/README.md` *(Phase 4)* |
| User service | `microfrontend/libs/server/user-svc/README.md` *(Phase 4)* |
| API gateway | `microfrontend/apps/api-gateway/README.md` *(Phase 4)* |
| Mobile (Capacitor) | `microfrontend/apps/mobile/README.md` *(Phase 5)* |
| Root (architecture + run guide) | `microfrontend/README.md` *(Phase 6)* |

## Phases & Steps

### Phase 0 — Monorepo scaffolding (foundation, blocks everything)
1. `pnpm init` + install Nx CLI; `nx init` (or `create-nx-workspace`) with pnpm, TypeScript.
2. Configure `nx.json` (caching, `pnpm` package manager, project graph), `tsconfig.base.json` path aliases (`@mf/*`, `@shared/*`, `@server/*`).
3. Add shared dev tooling: ESLint, Prettier, TypeScript project references, `@nx/eslint`, `@nx/js`.
4. Define Nx plugins: `@nx/angular`, `@nx/react`, `@nx/vue`, `@nx/nest`, `@nx/web` (Vite).
5. **Verify:** `nx graph` renders the project graph; `nx run-many -t lint` passes on empty libs.

**References:** workspace config (`nx.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`); no module READMEs yet (scaffolding phase).

### Phase 1 — Shared contracts (parallel with Phase 2 once Phase 0 done)
6. Author OpenAPI specs in `openapi/` (catalog.yaml, cart.yaml, user.yaml) — DTOs, endpoints, error model.
7. Define GraphQL schemas in `graphql/` — per-service SDL files + federation schema for the gateway.
8. Add `graphql-codegen` as an Nx target `generate:graphql`; generate TS types + typed Apollo clients from the federation schema; output to `libs/shared/contracts`.
9. Add `openapi-typescript` (types) + `openapi-fetch` (client) generator as an Nx target `generate:api`; output to `libs/shared/contracts` (REST fallback + admin APIs).
10. `libs/shared/event-bus`: typed `CustomEvent` names + payload interfaces (e.g., `cart:updated`, `user:signedIn`) used across MFs.
11. `libs/shared/design-tokens`: CSS custom properties (colors, spacing, type) + a `tokens.css` each MF imports.
12. **Verify:** generated types compile; a unit test round-trips a DTO; `nx build shared-contracts` succeeds.

**References:** `libs/shared/contracts/README.md`, `libs/shared/event-bus/README.md`, `libs/shared/design-tokens/README.md`.

### Phase 1.5 — Database layer (depends on Phase 0, parallel with Phase 1)
13. `prisma/`: define Prisma schema (`schema.prisma`) with models for **Product, Category, Cart, CartItem, User, Session** — aligned with the e-commerce domain.
14. Configure Prisma for **PostgreSQL** (local Docker compose for dev, env vars for connection string).
15. `libs/shared/db`: shared Prisma client singleton, migration runner as Nx target `db:migrate`, seed script (`db:seed`) with sample e-commerce data.
16. **Verify:** `prisma validate` passes; `prisma migrate dev` creates tables; `prisma studio` shows seeded data; seed script idempotent.

**References:** `libs/shared/db/README.md`.

### Phase 2 — Micro-Frontends (3 parallel tracks, each depends on Phase 0 + 1)
Each MF is a **custom element** with: a `render`/template, SSR string rendering, hydration entry, and a `dist` that the shell can import.
Each MF consumes the **shared GraphQL client** (`libs/shared/contracts`) for typed queries/mutations.

**2A. Angular MF (`libs/mf/catalog`)**
14. `nx generate @nx/angular:library` + enable `customElements: true` in its tsconfig (`@angular/compiler-cli` custom elements mode).
15. Implement `CatalogComponent` wrapped in a `catalog-mf` custom element; consumes `@jrumandal/contracts` GraphQL client (product queries, category browse).
16. SSR: `@angular/ssr` render entry (`renderModule`) producing an HTML string for the element; expose `ssr.ts` + `hydrate.ts`.

**2B. React MF (`libs/mf/cart`)**
17. `nx generate @nx/react:library` (Vite). Implement `Cart` as a React component; wrap in a `cart-mf` custom element (class extending `HTMLElement`, renders into its light DOM via `createRoot`).
18. SSR: `react-dom/server` `renderToString` → HTML string; `hydrateRoot` on the existing light-DOM markup on the client.
19. Cart MF issues GraphQL mutations (`addToCart`, `removeFromCart`) and subscribes to `cart:updated` events.

**2C. Vue MF (`libs/mf/user`)**
20. `nx generate @nx/vue:library` (Vite). Implement `UserPanel`; wrap in a `user-mf` custom element (render via `createApp` into its light DOM).
21. SSR: `vue/server-renderer` `renderToString` → HTML string; client re-hydration against the existing light-DOM markup.
22. User MF issues GraphQL mutations (`signIn`, `signOut`, `updateProfile`).

23. All MFs: import `design-tokens`, emit/subscribe `event-bus` events, no cross-MF direct imports (contract only).
24. **Verify (per MF):** `nx build <mf>` emits ESM + SSR entry; a small Vite/Jest or Vitest SSR test asserts the rendered HTML string contains expected markup; custom element registers in a JSDOM test.

**References:** `libs/mf/catalog/README.md`, `libs/mf/cart/README.md`, `libs/mf/user/README.md`.

### Phase 3 — Shell (Angular SSR) + composition (depends on Phase 2)
25. `nx generate @nx/angular:application shell --ssr` (Express adapter from `@angular/ssr`).
26. Shell registers all three custom elements (import each MF's `register()`), renders them inside the layout at routes: `/catalog`, `/cart`, `/account`.
27. **SSR composition:** shell server, during `renderModule`, calls each MF's `ssr.render(props)` to get an HTML string and injects it as the element's initial light-DOM content (server-rendered markup). On the client, after first paint, each MF's `hydrate()` runs.
28. Shell owns: routing, top nav, theme switch, global state bootstrap (user session), and the Capacitor bridge adapter (see Phase 5).
29. Shell bootstraps a shared Apollo `ApolloClient` instance (injected into each MF via props or `window`).
30. **Verify:** `nx serve shell` → `curl` the SSR HTML shows server-rendered markup for all three MFs; browser DevTools shows each hydrated (no full re-render flash); Lighthouse SSR pass.

**References:** `apps/shell/README.md` (created in this phase).

### Phase 4 — NestJS micro-services + gateway + DB (parallel with Phase 3, depends on Phase 1 + 1.5)
31. `nx generate @nx/nest:application` for `catalog-svc`, `cart-svc`, `user-svc`; each:
- Exposes a **GraphQL schema** (Apollo, via `@nestjs/graphql`) — resolvers backed by **Prisma** queries (real DB, not in-memory).
- Also publishes OpenAPI schema at `/api-docs` (for admin/REST fallback).
32. `api-gateway` (NestJS + Apollo Federation): federated GraphQL gateway that stitches the three service schemas, CORS, auth guard (JWT stub), and a `/health` aggregate.
33. Shared: `libs/server/*` for common NestJS modules (health, logging, error filter, config, Prisma module).
34. Docker Compose (`docker-compose.yml`): PostgreSQL + pgAdmin for local dev.
35. **Verify:** `nx serve` each service; GraphQL Playground shows correct schema; gateway federation resolves cross-service queries; `/health` returns all green; Prisma migrations applied; a contract test (GraphQL query/response validation) passes.

**References:** `libs/server/shared/README.md`, `libs/server/catalog-svc/README.md`, `libs/server/cart-svc/README.md`, `libs/server/user-svc/README.md`, `apps/api-gateway/README.md` (created in this phase).

### Phase 5 — Capacitor hybrid mobile (depends on Phase 3)
36. Create `apps/mobile` Capacitor project, configure the Android and iOS platforms, and keep the web output under `apps/mobile/web`.
37. Build shell (`nx build shell`) → copy or sync the output to `apps/mobile/web`; configure Capacitor's `webDir` and run `cap sync`.
38. Add native plugins as needed (for example, `@capacitor/camera` for a "scan product" demo in catalog MF) behind the **Capacitor bridge adapter** so the web code detects Capacitor and falls back to Web APIs in the browser.
39. **Verify:** `cap build android` / `cap build ios` produces an app; run on an emulator; the native plugin call works; offline/online fallback is sane.

**References:** `apps/mobile/README.md` (created in this phase).

### Phase 6 — DX, docs, CI (polish, depends on all above)
40. Root `README.md`: architecture diagram, how to run each part, how to add a new MF, how to run DB migrations.
41. Nx targets: `serve:all` (shell + 3 services + DB via `concurrently`), `build:all`, `test:all`, `lint:all`, `typecheck`, `db:migrate`, `db:seed`, `db:studio`.
42. CI workflow (GitHub Actions): install (pnpm) → lint → typecheck → test → build → (optional) Capacitor Android build.
43. **Verify:** fresh clone → `pnpm i` → `pnpm nx serve:all` → open shell in browser and in a Capacitor emulator.

**References:** `microfrontend/README.md` (root, created in this phase).

### Phase C — NgRx state management + state hydration (shell-level store)
> **Context (2026-08-29):** The shell's pages (catalog, cart, account) were hydrating MFs with state on initial navigation, but re-navigation within the same session did not re-propagate state — only a full page refresh re-hydrated. Root cause: no centralized state management; each page independently fetched data and set it on the MF element, but re-navigation did not re-trigger the fetch.

**Design decision:** Store is implemented at the **shell level** (composition root), NOT inside each MF. Rationale: the three MFs are plain Web Components (Angular/React/Vue) with no Angular DI and no store of their own; the shell is the single source of truth. Pages dispatch `load` actions, `ShellEffects` fetch from the gateway via the shared `ApolloClient`, and pages push the store state into the MF element's properties so the MF re-renders on every navigation. The cart effect sequences the cross-slice user→cart dependency (it waits for the user's `loaded` flag before fetching the cart). A `navigation` slice records every completed navigation (backtracing) via `ROUTER_NAVIGATED`.

44. Install `@ngrx/store`, `@ngrx/router-store`, `@ngrx/effects` in the shell.
45. Create per-slice store files under `shell/src/app/store/`: `{catalog,cart,user,navigation}.{actions,reducer,selectors}.ts` (12 files) + `shell.effects.ts`. Slices: `catalog` (`products`, `categories`), `cart` (`cart`), `user` (`user` profile), `navigation` (`current` + bounded `history`).
46. Create `ShellEffects` (functional `createEffect`) for the catalog/cart/user loads; the cart effect sequences the cross-slice user→cart dependency (waits for the user's `loaded` flag before fetching the cart).
47. Wire `provideStore({ catalog, cart, user, navigation, router: routerReducer })`, `provideEffects([ShellEffects])`, `provideRouterStore()` into `app.config.ts`.
48. Update pages (`catalog-page.ts`, `cart-page.ts`, `account-page.ts`) to dispatch `load` actions in `ngOnInit`, subscribe to store state, and push state into MF element properties.
49. Remove `loadMfData()` from `mf-client-bootstrap.ts` — data now flows through the NgRx store.
50. **Verify:** `ng build` passes; re-navigation re-propagates state without full page refresh; `navigation` slice records backtracing history.
51. **Fix re-navigation hydration timing:** `@ViewChild('mf', { static: false })` is not resolved in `ngOnInit()`, so on re-navigation (store already holds data) the subscription fires before the element exists and the push is dropped. Add `ngAfterViewInit()` to each page to re-select the current store state (`take(1)`) and push it into the MF element now that `mfEl` is available. Verified in browser: catalog/cart/account all re-hydrate on re-navigation without a full page refresh.

**References:** `shell/README.md` (updated with NgRx state management section).

## Relevant files (to be created)
- `microfrontend/nx.json`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` — workspace config
- `microfrontend/openapi/{catalog,cart,user}.yaml` — canonical API contracts
- `microfrontend/graphql/{catalog,cart,user,gateway}.graphql` — GraphQL schemas (SDL) per service + federation
- `microfrontend/prisma/schema.prisma` — Prisma ORM schema (Product, Category, Cart, CartItem, User, Session)
- `microfrontend/prisma/migrations/` — Prisma migration files
- `microfrontend/docker-compose.yml` — PostgreSQL + pgAdmin for local dev
- `microfrontend/libs/shared/contracts/` — generated TS clients/types (GraphQL codegen + `openapi-typescript`)
- `microfrontend/libs/shared/event-bus/` — typed custom-event contract
- `microfrontend/libs/shared/design-tokens/` — theme CSS
- `microfrontend/libs/shared/db/` — shared Prisma client singleton + migration helpers
- `microfrontend/libs/mf/catalog/{src,ssr.ts,hydrate.ts,register.ts}` — Angular MF
- `microfrontend/libs/mf/cart/{src,ssr.ts,hydrate.ts,register.ts}` — React MF
- `microfrontend/libs/mf/user/{src,ssr.ts,hydrate.ts,register.ts}` — Vue MF
- `microfrontend/apps/shell/src/{main.ts,server.ts,app/...}` — Angular SSR shell + composition
- `microfrontend/apps/api-gateway/src/...` — NestJS gateway (Apollo Federation)
- `microfrontend/libs/server/{catalog-svc,cart-svc,user-svc}/src/...` — NestJS services (GraphQL resolvers + Prisma)
- `microfrontend/apps/mobile/{capacitor.config.ts,android,ios,web/...}` — Capacitor wrapper

## Key technical decisions & references
- **Web Components as the integration contract** — framework-agnostic, works in any shell and in Capacitor's WebView, and each framework has a supported path to expose a custom element:
  - Angular: `customElements: true` (tsconfig) + `@angular/ssr` `renderModule` for SSR string.
  - React: `react-dom/server` `renderToString` for SSR; wrap component in a `HTMLElement` subclass using `createRoot`/`hydrateRoot` in the light DOM.
  - Vue 3: `vue/server-renderer` `renderToString` for SSR; wrap with `createApp` into the light DOM.
- **SSR = shell-level + per-MF hydration**: the shell's Angular SSR server calls each MF's `ssr.render()` to produce markup, composites it into the page HTML, then each MF hydrates on the client. This gives SEO + fast first paint without running three independent SSR servers.
- **GraphQL as the API contract** (Apollo Federation) — frontends query exactly what they need; `graphql-codegen` generates TS types and typed Apollo clients; each NestJS service exposes a GraphQL schema with resolvers; gateway federates them. OpenAPI retained for admin/REST fallback.
- **PostgreSQL + Prisma ORM** — single relational DB for all services; Prisma provides TypeScript-first type safety, code-first schema, and migration management; shared Prisma client in `libs/shared/db`; Docker Compose for local dev.
- **Contracts via OpenAPI + GraphQL** (dual-source) so frontends and NestJS services never drift; generated clients keep the frontend types in sync.
- **Capacitor over Cordova**: single web build in `web/`, native plugins for device features, and a bridge adapter isolates native calls from web code. Capacitor is the selected wrapper because it is actively maintained and has better Angular/SSR interoperability while preserving the WebView-based integration contract.
- **Nx** for generators, project graph, caching, and per-framework plugins (Angular/React/Vue/Nest/Vite) in one repo.

## Recommended strategy (adopted)
The following recommendations are **adopted into scope** (previously open/non-blocking) and are now binding for the build:
1. **Light-DOM hydration for React/Vue MFs** — the React and Vue micro-frontends render into the **light DOM** (no Shadow DOM) so SSR string output and client hydration reliably reuse the same markup. Shadow DOM is reserved for a component with a demonstrated need for strict style isolation, and must be validated for SSR + hydration compatibility before adoption.
2. **Decoupled cross-MF state** — MFs communicate via the typed **event bus** plus a small shared store (a `BroadcastChannel`/`window`-based observable). Direct cross-MF imports are prohibited; the shared contracts are the only integration surface.
3. **Capacitor (not Cordova) for hybrid mobile** — Capacitor is the selected wrapper: single web build in `web/`, native plugins for device features, and a **bridge adapter** that isolates native calls from web code (with Web-API fallback in the browser). Revisit only if a required native capability has no suitable Capacitor plugin or custom native implementation.

## Scope boundaries
**Included:** reference architecture + working sample e-commerce domain (catalog/cart/user), 3 MFs in 3 frameworks, shell SSR composition, 3 NestJS services + gateway, **PostgreSQL + Prisma ORM**, **GraphQL (Apollo Federation)**, **Capacitor** hybrid wrapper (bridge adapter + Web-API fallback), shared contracts/tokens/events, **adopted recommended strategy** (light-DOM hydration for React/Vue, decoupled event-bus + shared-store state, Capacitor over Cordova), DX targets, CI, docs.
**Excluded (deliberately):** real auth/identity provider, payment/checkout, i18n, feature-flag service, observability stack (tracing/APM), production deployment/infra (K8s, CDN), e2e test suite (manual + light unit/SSR tests only), data replication/cross-service DB transactions.

## Verification (end-to-end)
1. `pnpm i && pnpm nx run-many -t lint,typecheck` — green across all projects.
2. `pnpm nx test:all` — unit + SSR-string tests per MF pass.
3. `pnpm nx serve:all` → `curl -s localhost:4200/catalog | grep '<catalog-mf'` → server-rendered markup present (SSR works).
4. Browser: each MF interactive (add to cart → `cart:updated` event → cart MF updates; sign in → user MF updates). No framework-isolation errors; React/Vue hydration reuses server-rendered light-DOM markup without a full re-render.
5. `pnpm nx build shell && pnpm nx build:all` → `apps/mobile/web` populated → `npx cap sync` and `npx cap build android` succeed → run on emulator, native plugin (camera) works.
6. `nx graph` shows clean dependency direction: `shell → mf/* → shared/*`; `mf/* → shared/contracts → graphql`; `server/* → shared/db → prisma`.
7. `pnpm nx db:migrate` → PostgreSQL schema created; `pnpm nx db:seed` → sample data loaded; `pnpm nx db:studio` → Prisma Studio opens.
8. GraphQL Playground: federated queries across services resolve correctly (e.g., query products + user cart in one request).

## Decisions (from user)
- Purpose: **generic reference architecture** with sample e-commerce domain.
- Hybrid mobile: **Capacitor** (over Cordova).
- Backend: **Node.js + NestJS**.
- API layer: **GraphQL (Apollo Federation)** + OpenAPI fallback.
- Database: **PostgreSQL + Prisma ORM**.
- Monorepo: **Nx + pnpm**.
- SSR: **shell-level SSR + per-MF hydration**.
- Frameworks: **Angular (shell + 1 MF), React (1 MF), Vue (1 MF)**.

## Further considerations
The three items below were previously open/non-blocking and are now **adopted into scope** (see "Recommended strategy (adopted)"):
1. **React/Vue SSR string → light-DOM hydration** — **adopted**: render MF content into the **light DOM** (no Shadow DOM) for the React/Vue MFs so SSR hydration reliably reuses the server-rendered markup. Shadow DOM is reserved for a component with a demonstrated need for strict style isolation, and must be validated for SSR + hydration compatibility before adoption.
2. **State sharing across MFs** — **adopted**: use the typed **event bus** + a small shared store (a `BroadcastChannel`/`window`-based observable) rather than direct imports; MFs stay decoupled.
3. **Capacitor over Cordova** — **adopted**: switch the hybrid wrapper from Cordova to **Capacitor** (more actively developed, better Angular/SSR interop), with native APIs isolated behind a bridge adapter and Web-API fallback in the browser. Revisit only if a required native capability has no suitable Capacitor plugin or custom native implementation.
