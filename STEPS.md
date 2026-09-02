# Step Tracker — Multi-Framework Micro-Frontend Reference Architecture

Resume guide: work top-to-bottom; the first `⬜ pending` step is where to continue.
Status legend: `⬜ pending` → `🔄 in-progress` → `✅ done` (after git commit) | `⛔ blocked` (reason noted).

Workspace: `d:\workspace` (git root) · Project: `d:\workspace\microfrontend` (Nx + pnpm monorepo)

## Documentation tracking (applies to ALL phases)

> **Rule:** Every phase that creates or substantially changes a module MUST add or
> update that module's `README.md` **before** its commit step is marked ✅. The
> README is the canonical knowledge reference (after `plan.md`) so future work
> doesn't re-investigate the codebase. Status mirrors the phase status.

| Module README | Phase | Status |
| --- | --- | --- |
| `libs/shared/contracts/README.md` | 1 | ✅ |
| `libs/shared/event-bus/README.md` | 1 | ✅ |
| `libs/shared/design-tokens/README.md` | 1 | ✅ |
| `libs/shared/db/README.md` | 1.5 | ✅ |
| `libs/mf/catalog/README.md` | 2 | ✅ |
| `libs/mf/cart/README.md` | 2 | ✅ |
| `libs/mf/user/README.md` | 2 | ✅ |
| `apps/shell/README.md` | 3 | ✅ |
| `libs/server/shared/README.md` | 4 | ✅ |
| `libs/server/catalog-svc/README.md` | 4 | ✅ |
| `libs/server/cart-svc/README.md` | 4 | ✅ |
| `libs/server/user-svc/README.md` | 4 | ✅ |
| `apps/api-gateway/README.md` | 4 | ✅ |
| `libs/shared/bridge/README.md` | 5 | ✅ |
| `apps/mobile/README.md` | 5 | ✅ |
| `microfrontend/README.md` (root) | 6 | ✅ |

## Phase 0 — Monorepo scaffolding
- [x] 0.1 Environment check (node 22 / pnpm 11 / git / docker) — ✅ done (2026-08-24)
- [x] 0.2 `git init` at `d:\workspace` + `.gitignore` + initial commit — ✅ done (commit 1155874)
- [x] 0.3 Scaffold Nx workspace (pnpm, TS, eslint) in `microfrontend/` — ✅ done (2026-08-24)
- [x] 0.4 Add Nx plugins: `@nx/angular`, `@nx/react`, `@nx/vue`, `@nx/nest`, `@nx/web` — ✅ done (2026-08-24)
- [x] 0.5 `tsconfig.base.json` path aliases (`@mf/*`, `@shared/*`, `@server/*`) — ✅ done (2026-08-24)
- [x] 0.6 Verify: `nx graph` renders; `nx run-many -t lint` passes — ✅ re-verified (2026-08-25; contracts lint passes after TS parser fix)
- [x] 0.7 Commit Phase 0 — ✅ done (2026-08-24)

## Phase 1 — Shared contracts
- [x] 1.1 OpenAPI specs: `openapi/{catalog,cart,user}.yaml` — ✅ done (2026-08-25; all 3 specs present & valid, incl. DTOs + `Error` model)
- [x] 1.2 GraphQL SDL: `graphql/{catalog,cart,user,gateway}.graphql` — ✅ done (2026-08-25; all 4 SDL files present; `gateway.graphql` = federated composition)
- [x] 1.3 `libs/shared/contracts` + graphql-codegen Nx target `generate:graphql` (TS types + Apollo client) — ✅ done (2026-08-25; `codegen.mjs` + `generate:graphql` target; `generated/graphql.ts` valid TS; commit 811ae2f)
- [x] 1.4 openapi-typescript + openapi-fetch generation target `generate:api` — ✅ done (2026-08-25; `generate:api` target + `openapi-fetch` client in `clients.ts`; commit 811ae2f)
- [x] 1.5 `libs/shared/event-bus` — typed custom-event names/payloads — ✅ done (2026-08-25; DOM-free `EventBus` + `MFEventMap` contract; 6/6 tests; lint/test/build ✅)
- [x] 1.6 `libs/shared/design-tokens` — CSS custom properties + `tokens.css` — ✅ done (2026-08-25; `tokens.css` + typed `tokens.ts` + `cssVar()`; 2/2 tests; lint/test/build ✅; `tokens.css` copied to dist)
- [x] 1.7 Verify: generated types compile; DTO round-trip unit test; `nx build contracts` — ✅ done (2026-08-25; `nx test contracts` 4/4 ✅ · `nx build contracts` ✅ · `nx lint contracts` ✅; actual Nx project name is `contracts`)
- [x] 1.8 Commit Phase 1 — ✅ done (2026-08-25; commit f3e15ac "feat(shared): complete Phase 1 — event-bus + design-tokens libs"; 25 files, 846 insertions)

## Phase 1.5 — Database layer (PostgreSQL + Prisma)
- [x] 15.1 `prisma/schema.prisma` — ✅ done (2026-08-26; Product, Category, ProductCategory, ProductAttribute, User, Session, Cart, CartItem, Order, OrderItem + OrderStatus enum; money as integer cents + currency)
- [x] 15.2 `docker-compose.yml` (PostgreSQL 16 + pgAdmin) + `.env`/`.env.example` — ✅ done (2026-08-26; postgres healthy; `DATABASE_URL` in `.env` (gitignored); `.env.example` committed)
- [x] 15.3 `libs/shared/db` — ✅ done (2026-08-26; PrismaClient singleton cached on `globalThis`; `db:up/down/validate/generate/migrate/deploy/seed/studio` targets; 3/3 tests; lint/test/build ✅)
- [x] 15.4 Verify — ✅ done (2026-08-26; `prisma validate` ✅; `migrate dev --name init` created all 10 tables; `db seed` idempotent (identical counts on re-run))
- [x] 15.5 Commit Phase 1.5 — ✅ done (2026-08-26; commit 7778e6b "feat(db): Phase 1.5 — PostgreSQL + Prisma schema, docker-compose, @shared/db lib, idempotent seed")

## Phase 2 — Micro-Frontends (Web Components)
- [x] 2A.1 Angular MF `libs/mf/catalog` (custom element `catalog-mf`, customElements mode) — ✅ done (2026-08-27; `CatalogComponent` + `createCustomElement` via `@angular/elements`; shared libs externalized via `peerDependencies` + `paths`→dist; `nx build catalog-mf` ✅)
- [x] 2A.2 Catalog SSR entry (`ssr.ts` renderApplication → HTML string) + `hydrate.ts` + `register.ts` — ✅ done (2026-08-27; `ssr.ts` uses `bootstrapApplication`+`renderApplication`; `register.ts` async `createApplication`→`appRef.injector`; `hydrate.ts` async; 6/6 tests ✅ · lint ✅ · build ✅)
- [x] 2B.1 React MF `libs/mf/cart` (custom element `cart-mf`, light-DOM createRoot) — ✅ done (2026-08-27; `Cart` React component + `CartElement` (HTMLElement, light-DOM `createRoot`); `@nx/js:tsc` ESM build; `react`/`react-dom` externalized via `peerDependencies`; `@shared/*` via `workspace:*` + `paths`→dist; `nx build cart-mf` ✅)
- [x] 2B.2 Cart SSR (`renderToString`) + hydrate (`hydrateRoot`) + register — ✅ done (2026-08-27; `ssr.tsx` `renderToString`; `hydrate.ts` attaches event-bus; `register.ts` idempotent `customElements.define`; 9/9 tests ✅ · lint ✅ · build ✅)
- [x] 2C.1 Vue MF `libs/mf/user` (custom element `user-mf`, light-DOM `createApp`) — ✅ done (2026-08-27; `UserPanel` Vue component + `UserElement` (HTMLElement, light-DOM `createApp().mount()`); `@nx/js:tsc` ESM build; `vue`/`@vue/server-renderer` externalized via `peerDependencies`; `@shared/*` via `workspace:*` + `paths`→dist; `nx build user-mf` ✅)
- [x] 2C.2 User SSR (`renderToString` from `@vue/server-renderer`) + hydrate + register — ✅ done (2026-08-27; `ssr.ts` async `renderToString`; `hydrate.ts` attaches event-bus; `register.ts` idempotent `customElements.define`; 10/10 tests ✅ · lint ✅ · build ✅)
- [x] 2.3 All MFs: import design-tokens, emit/subscribe event-bus, no cross-MF imports — ✅ done (2026-08-27; verified all 3 MFs import `@jrumandal/contracts`+`design-tokens`+`event-bus`; no `@mf/*` cross-imports)
- [x] 2.4 Verify per MF: `nx build` emits ESM + SSR entry; SSR-string test; custom-element JSDOM test — ✅ done (2026-08-27; catalog FESM2022 bundle exports `render`/`register`/`hydrate`; cart+user ESM `ssr.js`; all 3 MFs build/test/lint green)
- [x] 2.5 Commit Phase 2 — ✅ done (2026-08-27; commit 41d173b "feat(mf): Phase 2 — Angular/React/Vue micro-frontends as Web Components"; 52 files, 4015 insertions)

## Phase 3 — Shell (Angular SSR) + composition
- [x] 3.1 Shell app `apps/shell` (Angular + `@angular/ssr` Express adapter) — ✅ done (2026-08-28; `@nx/angular:application apps/shell --ssr`; `@angular/build:application` + Express `AngularNodeAppEngine` adapter; routing + Jest enabled)
- [x] 3.2 Register 3 custom elements; routes `/catalog`, `/cart`, `/account`; top nav + theme — ✅ done (2026-08-28; `mf-client-bootstrap.ts` registers 3 elements + attaches shared event bus; `app.routes.ts` 3 routes + redirect; `app.html` top nav + theme toggle; `app.spec.ts` 4/4 ✅)
- [x] 3.3 SSR composition: server calls each MF `ssr.render(props)`, injects markup; client hydrates — ✅ done (2026-08-28; `mf-ssr.server.ts` `renderMfSsrHtml()` (cached `Promise.all` of 3 renders) → `provideMfSsrHtml` → pages inject via `[innerHTML]`; **SSRF host-allowlist fixed** by passing `allowedHosts` to `AngularNodeAppEngine` ctor (see README); verified SSR HTML for all 3 MFs)
- [x] 3.4 Shared ApolloClient bootstrap injected into MFs — ✅ done (2026-08-28; `@jrumandal/contracts` owns `MfApolloClient` type + `createSharedApolloClient(uri)` factory (`src/apollo.ts`, `@apollo/client ^4.2.12` dep); shell `mf-client-bootstrap.ts` creates the singleton (`GATEWAY_URI` env or `http://localhost:4200/graphql`) and injects it via each MF's `hydrate({ eventBus, apolloClient })`; all 3 MFs accept + store `apolloClient` (type-only, erased at runtime) — catalog `@Input`, cart element prop, user element prop; all MFs + shell rebuilt ✅; SSR regression re-verified on :4100 (all 3 MFs server-render); `cache-and-network` factory confirmed in client bundle)
- [x] 3.5 Verify: `nx serve shell` → curl shows server-rendered markup for all 3 MFs — ✅ done (2026-08-28; verified via production SSR server `node dist/apps/shell/server/server.mjs` on :4100; `/catalog`→`catalog-mf`+Mechanical Keyboard+USB-C Hub, `/cart`→`cart-mf`+USD 149.99, `/account`→`user-mf`+Ada Lovelace+Analytical Engine; **no** "Falling back to client side rendering" in log)
- [x] 3.6 Commit Phase 3 — ✅ done (2026-08-28; commit 8322441 "feat(shell): Phase 3 — Angular SSR shell + MF composition + shared Apollo bootstrap"; 48 files, 7709 insertions)
- [x] 3.7 Documentation: `apps/shell/README.md` (SSR composition, routes, Apollo bootstrap, run/verify) — ✅ done (2026-08-28; covers SSR composition flow, SSRF host-allowlist fix, client bootstrap, shared Apollo client, routes, build/run/verify)

## Phase 4 — NestJS micro-services + gateway
- [x] 4.1 `catalog-svc` (NestJS + GraphQL + Prisma) — ✅ done (2026-08-28; `libs/server/catalog-svc` NestJS 11 + Apollo Server 4 + graphql@16 + Prisma; `CatalogResolver` (products/product/categories) backed by Prisma; `@jrumandal/shared` via `resolve.alias` in webpack; Swagger `/api-docs`; `nx build` ✅ · `nx test` 1/1 ✅ · `nx lint` ✅; commit at 4.7)
- [x] 4.2 `cart-svc` (NestJS + GraphQL + Prisma) — ✅ done (2026-08-28; `libs/server/cart-svc` NestJS 11 + Apollo Server 4 + graphql@16 + Prisma; `CartResolver` (cart query + addItemToCart/updateCartItem/removeItemFromCart/clearCart) backed by Prisma; `@jrumandal/shared` via `resolve.alias` in webpack; Swagger `/api-docs`; port 4002; `nx build` ✅ · `nx test` 1/1 ✅ · `nx lint` ✅; README ✅; commit at 4.7)
- [x] 4.3 `user-svc` (NestJS + GraphQL + Prisma) — ✅ done (2026-08-28; `libs/server/user-svc` NestJS 11 + Apollo Server 4 + graphql@16 + Prisma; `UserResolver` (me/orders queries + login/updateProfile mutations) backed by Prisma; `DateTime` scalar via `@Scalar('DateTime')` class decorator; `OrderStatus` enum via `registerEnumType`; `@jrumandal/shared` via `resolve.alias` in webpack; Swagger `/api-docs`; port 4003; `nx build` ✅ · `nx test` 1/1 ✅ · `nx lint` ✅; README ✅; commit at 4.7)
- [x] 4.4 `libs/server/shared` — health, logging, error filter, config, Prisma module — ✅ done (2026-08-28; added `AppConfigModule` (typed env config), `HealthModule` (terminus `/health` + Prisma ping), `LoggingInterceptor`, `AllExceptionsFilter`; reorganized Prisma into `prisma/` subfolder; added `@nestjs/config` + `@nestjs/terminus` deps; `nx build shared` ✅; catalog-svc refactored to consume shared modules — build ✅ · test 1/1 ✅ · lint ✅; README ✅)
- [x] 4.5 `api-gateway` (introspection-based GraphQL gateway, CORS, JWT stub, `/health` aggregate) — ✅ done (2026-08-28; `apps/api-gateway` NestJS 11 + Apollo Server 4 + `@graphql-tools/stitch` + `@graphql-tools/wrap` + `@graphql-tools/executor-http`; `GatewayService` introspects catalog/cart/user services and stitches their schemas; `buildHTTPExecutor` for delegation; `/health` aggregates the 3 service health endpoints; port 4200; `nx build` ✅ · `nx test` 1/1 ✅ · `nx lint` ✅; README ✅; commit at 4.7)
- [x] 4.6 Verify: services serve GraphQL; gateway federates cross-service query; `/health` green; contract test — ✅ done (2026-08-28; `libs/server/api-gateway-e2e` new project: mock catalog/cart/user GraphQL services (raw `http`+`graphql`, ports 4101/4102/4103) + `GatewayService.onModuleInit()` introspect→wrap→stitch; e2e runs a cross-service query (products+cart+me) and a single-entity query in-process against the stitched schema, delegating over real HTTP; `nx e2e api-gateway-e2e` 2/2 ✅; services-serve-GraphQL + `/health` verified in 4.1–4.3/4.5; README ✅; commit at 4.7)
- [x] 4.7 Commit Phase 4 — ✅ done (2026-08-28; commit dc4de8e "feat(server): Phase 4 — NestJS micro-services + introspection-based GraphQL gateway"; 118 files; clean tree)
- [x] 4.8 Documentation: `libs/server/shared`, `catalog-svc`, `cart-svc`, `user-svc`, `apps/api-gateway` READMEs — ✅ done (2026-08-28; all 6 Phase 4 READMEs present: `libs/server/shared` (111L), `catalog-svc` (144L), `cart-svc` (137L), `user-svc` (170L), `apps/api-gateway` (177L), `api-gateway-e2e` (62L))

## Phase 5 — Capacitor hybrid mobile
- [x] 5.1 `apps/mobile` Capacitor project (webDir = shell build output) — ✅ done (2026-08-28; `apps/mobile` workspace package: `capacitor.config.ts` (appId `com.microfrontend.shell`, `webDir: 'web'`), `package.json` (`@capacitor/core`/`android`/`ios` 8.5.0, `@capacitor/camera` 8.2.3, `@capacitor/cli` 8.5.0 devDep), `project.json` (Nx targets: `sync`, `build-web`, `build-android`, `build-ios`, `open-android`, `open-ios`), `tsconfig.json`; `scripts/sync-mobile-web.mjs` copies `dist/apps/shell/browser` → `apps/mobile/web`; `pnpm install` added 51 pkgs, Capacitor in `apps/mobile/node_modules`; `nx show project mobile` ✅)
- [x] 5.2 Sync shell build → `apps/mobile/web`; `cap sync` — ✅ done (2026-08-28; `nx build shell` → `dist/apps/shell/browser`; `scripts/sync-mobile-web.mjs` copies to `apps/mobile/web` + creates `index.html` from `index.csr.html` (SSR client entry); `npx cap add android` + `npx cap add ios` (camera plugin wired into both); `npx cap sync` copies web assets to `android/app/src/main/assets/public` + `ios/App/App/public`, `index.html` present)
- [x] 5.3 Bridge adapter (Capacitor detection + Web-API fallback) + `@capacitor/camera` demo — ✅ done (2026-08-28; `libs/shared/bridge` shared lib: `BridgeAdapter` (Capacitor detection via `window.Capacitor`/`window.__CAPACITOR__`, no hard import) + `scanProduct()` (native → dynamic `import('@capacitor/camera')` `Camera.getPhoto` base64; web → `getUserMedia`+canvas snapshot) + `getBridgeAdapter()` singleton; 7/7 tests pass; camera demo wired into catalog MF (`@jrumandal/bridge` dep + `allowedNonPeerDependencies`, scan button + result panel, `onScanProduct()`); catalog MF builds clean, camera plugin stays external)
- [x] 5.4 Verify: `cap sync` ok; `cap build android` (requires Android SDK — note if absent) — ✅ done (2026-08-28; `cap sync` verified ok (web assets → `android/app/src/main/assets/public` + `ios/App/App/public`, `index.html` present); `cap build android` **attempted from WSL** — Gradle wrapper runs but **cannot execute the Windows `java.exe`** (PE binary, not runnable by a Linux process) → `cap build android` is **Windows-host-only**; Windows SDK/JDK confirmed present on host (`/mnt/c/Users/Gaming/AppData/Local/Android/Sdk`, JDK 26) but cross-OS Gradle build is not viable from WSL; **build path: run `npx cap build android` from Windows PowerShell, or `npx cap open android` → Android Studio → Run; emulator on Windows host**; documented in `apps/mobile/README.md`)
- [x] 5.5 Commit Phase 5 — ✅ done (2026-08-28; commit a418904 "feat(mobile): Phase 5 — Capacitor hybrid mobile wrapper + bridge adapter + camera demo"; 22 files, 1486 insertions; clean tree)
- [x] 5.6 Documentation: `apps/mobile/README.md` (Capacitor setup, bridge adapter, sync/build) — ✅ done (2026-08-28; `apps/mobile/README.md` (layout, sync/build flow, `index.csr.html`→`index.html` + `cap add`-before-`cap sync` gotchas, commands, WSL/Windows-host Android build note) + `libs/shared/bridge/README.md` (adapter API, native detection, camera demo, Web-API fallback, testing); both doc-tracking rows ✅)

## Phase 6 — DX, docs, CI
- [x] 6.1 Root `README.md` (architecture, run instructions, add-MF guide, DB guide) — ✅ done (2026-08-28; commit fdf60e9 "docs(root): Phase 6.1/6.6 — root README"; replaced Nx boilerplate with reference-architecture README: architecture diagram, monorepo layout, ports table, quick start, common commands, adding-a-new-MF guide, database guide, mobile notes, documentation map)
- [x] 6.2 Nx targets: `serve:all`, `build:all`, `test:all`, `lint:all`, `typecheck`, `db:migrate`, `db:seed`, `db:studio` — ✅ done (2026-08-28; commit 75d857f "feat(dx): Phase 6.2 — aggregate Nx targets + repo-wide typecheck"; `scripts/serve-all.mjs` orchestrates DB + 3 services + gateway + shell with port-waiting & teardown; `scripts/typecheck.mjs` runs tsc --noEmit over all 17 projects (concurrency 4); typecheck 17/17 PASS; runtime bug fixes committed separately at 0af0bbc)
- [x] 6.3 GitHub Actions CI (lint → typecheck → test → build) — ✅ done (2026-08-29; commit 404696c "ci: Phase 6.3 — GitHub Actions CI workflow + pnpm allowBuilds fix"; `.github/workflows/ci.yml`: `ci` job = install → lint → typecheck → test → build on Node 22 + pnpm 11.24.0, `NX_DAEMON=false`; optional `android` job (JDK 17 + Android SDK 36) gated to `workflow_dispatch`; fixed `pnpm-workspace.yaml` `allowBuilds` placeholders → real booleans so build scripts run in fresh CI installs)
- [x] 6.4 Final end-to-end verification (per plan §Verification) — ✅ done (2026-08-29; full stack verified live: 3 services healthy on 4001/4002/4003; gateway `/health` all 3 up + cross-domain stitched GraphQL query returns 4 products / 3 categories / `me` (Demo User); shell SSR on 4300 returns 302→200 with real HTML — `/` → `<catalog-mf>`, `/cart` → `<cart-mf>`, `/account` → `<user-mf>`; fixed gateway bootstrap (eager `onModuleInit` + `/graphql` before `app.listen`) and shell SSR bridge/vue resolution (`externalDependencies` + root `@jrumandal/bridge` dep + bridge `main`→dist + direct imports); no residual errors in shell log)
- [x] 6.5 Commit Phase 6 — ✅ done (2026-08-29; commit e570763 "fix: Phase 6.4 — gateway bootstrap + shell SSR bridge/vue resolution"; 11 files: gateway bootstrap fix, shell SSR externalDependencies + bridge direct imports, bridge main→dist, root deps + tsconfig paths, pnpm-lock, STEPS.md)
- [x] 6.6 Documentation: root `microfrontend/README.md` (architecture, run guide, add-MF guide, DB migrations) — ✅ done (2026-08-28; commit fdf60e9; root README authored as 6.1, tracked here per doc-tracking table)

## Phase A — Multi-repo split (frontend)

> **Context (2026-08-29):** Per the architectural re-design, the monorepo is split into
> **separate repositories**, each with its own environment (Node/TS/library versions),
> its own segregated CI/CD pipeline, and independent versioning. The original monorepo
> at `microfrontend/` is **kept as reference**. Shared packages are distributed as
> **source-only ESM npm packages** (consumed by the shell's Angular build, which does
> the bundling). Tag names standardized to `mf-*` (`mf-cart`, `mf-catalog`, `mf-user`).
>
> **Distribution model:** `@shared/*` + `@mf/*` are published to GitHub Packages
> (`npm.pkg.github.com`). Each consumer repo's CI checks out the `shared` repo (and,
> for the shell, the 3 MF repos) as **siblings** and wires a pnpm workspace so
> `workspace:*` resolves without a registry — keeping CI self-contained.

- [x] A.1 `shared/` repo — 4 packages (`@jrumandal/design-tokens`, `@jrumandal/event-bus`, `@jrumandal/contracts`, `@jrumandal/bridge`) — ✅ done (2026-08-29; commit `59f1bcd`; all 4 packages source-only ESM, `main`/`types`→`src/index.ts`; lint ✓, typecheck ✓, test ✓ 17/17, build ✓; `contracts` types aligned to reference OpenAPI (`User.address` singular, `Address` shape); `scripts/publish.mjs` + `.github/workflows/ci.yml` (ci + publish jobs))
- [x] A.2 `cart/` repo — `@jrumandal/cart` (React 19) — ✅ done (2026-08-29; commit `c1d025c`; full faithful port: `register`/`hydrate`/`render` + `cart-element` web component; `mf-cart` tag; lint ✓, typecheck ✓, test ✓ 8/8, build ✓; self-contained CI checks out `shared` sibling)
- [x] A.3 `catalog/` repo — `@jrumandal/catalog` (Angular 20) — ✅ done (2026-08-29; commit `965cc2c`; full faithful port: `@if`/`@for` control flow, `ViewEncapsulation.None`, design tokens via `cssVar`/`Tokens`, bridge `scanProduct`, eventBus `source: 'mf-catalog'`; `mf-catalog` tag; lint ✓, typecheck ✓, test ✓ 6/6, build ✓; self-contained CI)
- [x] A.4 `user/` repo — `@jrumandal/user` (Vue 3) — ✅ done (2026-08-29; commit `8912ea4`; full faithful port: `UserPanel` render-function component + `UserElement` web component, byte-for-byte match to reference; `mf-user` tag; lint ✓, typecheck ✓, test ✓ 10/10, build ✓; self-contained CI)
- [x] A.5 `shell/` repo — `@jrumandal/shell` (Angular 20 SSR) — ✅ done (2026-08-29; commit `3e1c04f`; standalone Angular CLI (`angular.json`, `@angular/build:application`), consumes all 3 MFs as ESM modules; SSR composition (`mf-ssr.server.ts` renders catalog/cart/user server-side) + client bootstrap (`mf-client-bootstrap.ts` register/hydrate + shared Apollo/EventBus/Bridge); `mf-*` tags; lint ✓, typecheck ✓, test ✓ 4/4, build ✓, SSR runtime ✓ (catalog/cart/account render MF HTML, `/`→302→`/catalog`); self-contained CI checks out `shared`+`cart`+`catalog`+`user` siblings)
- [x] A.6 Root workspace glue — ✅ done (2026-08-29; commit `ccf7b18`; root `package.json` + `pnpm-workspace.yaml` (local dev workspace spanning `shared/packages/*`, `cart`, `catalog`, `user`, `shell`) + `pnpm-lock.yaml`)
- [x] A.7 Tailwind v4 + design-tokens design system — ✅ done (2026-08-29; commits `578fee0` + `13f0ff4`; full Tailwind v4 adoption: `tailwindcss@4.3.3` + `@tailwindcss/postcss` in shell (the Tailwind v4 host) + all 3 MFs; `@jrumandal/design-tokens` `tokens.css` canonical token set (colors/spacing/typography/radius/shadow/duration/layout + dark theme); shell `styles.css` `@import "tailwindcss"` + `@theme inline` token→utility mapping + `@source` for sibling MF repos; reworked `cart.tsx` (React), `catalog.component.ts` (Angular), `user-panel.ts` (Vue) from inline styles to Tailwind utility classes; READMEs updated; all repos lint ✓, typecheck ✓, test ✓, build ✓)

## Phase B — Per-repo CI/CD + cross-repo orchestration

> **Goal:** Each repository has its own segregated deployment pipeline; the pipelines
> are **orchestrated/organized/coordinated** across repos (shared → MFs → shell →
> backend → mobile). The `mf-orchestrator` repo holds the cross-repo coordination
> (release ordering, version bumping, publish fan-out).

- [x] B.1 `server-shared/` + `gateway/` repos — shared NestJS server lib (`@jrumandal/shared`: Prisma, config, health, logging, error filter) + GraphQL gateway (`@jrumandal/gateway`, stitched `@graphql-tools/stitch` + `@apollo/server`) — ✅ done (2026-08-27; ported from `microfrontend/libs/server/shared` + `microfrontend/apps/api-gateway`; each own CI/CD; gateway depends on `@jrumandal/shared` via `workspace:*`; both validated: lint/typecheck/test/build ✅)
- [x] B.2 `catalog-svc/` + `cart-svc/` + `user-svc/` repos — NestJS GraphQL micro-services (catalog/cart/user backends + Prisma) — ✅ done (2026-08-27; ported from `microfrontend/libs/server/*`; each own CI/CD; all depend on `@jrumandal/shared` via `workspace:*`; PostgreSQL via Prisma; all validated: lint/typecheck/test/build ✅)
- [x] B.3 `mobile/` repo — Capacitor hybrid app (JDK 21, AGP 8.13.0, compileSdk 36) — ✅ done (2026-08-27; thin wrapper around shell build; `capacitor.config.ts` + `scripts/sync-mobile-web.mjs` (shell `dist/shell/browser` → `web/`, `index.csr.html`→`index.html`); `android/`/`ios/`/`web/` gitignored; own ci-only CI (builds shell, syncs web, typechecks); validated: install + typecheck + sync ✅)
- [x] B.4 `mf-orchestrator/` repo — cross-repo CI/CD coordination (release ordering shared→MFs→shell→backend→mobile, version bumping, publish fan-out to GitHub Packages) — ✅ done (2026-08-27; `repos.json` registry of 11 repos + `repos.schema.json`; scripts: `topo-sort.mjs` (Kahn topo order), `bump-version.mjs`, `orchestrate.mjs` (bump-all + publish fan-out plan), `trigger-release.mjs` (fan-out dispatch via GitHub REST API, waits per repo, aborts on failure); ci-only CI (`pnpm validate`) + manual `release.yml` (workflow_dispatch); validated: topo order + dry-run orchestrate + syntax checks ✅)
- [x] B.5 Push all repos to origin + verify per-repo CI green — ✅ done (all 12 repos pushed to `main`; **12/12 CI green**: shared, server-shared, mf-orchestrator, gateway, catalog-svc, cart-svc, user-svc, catalog, user, cart, shell, mobile)
- [x] B.6 README consistency pass across all repos (cross-repo references, versioning, CI/CD) — ✅ done (stale @shared/@server scopes corrected to @jrumandal; all 12 READMEs consistent; 12/12 CI green)

## Notes / blockers
- **✅ VUE USER MF (2C) RESOLVED (2026-08-27):** `nx build/test/lint user-mf` all green (10/10 tests).
  - **Vue SSR is async**: `renderToString` from `@vue/server-renderer` returns `Promise<string>` — so `ssr.ts` `render()` is `async` and tests `await` it (unlike React's sync `renderToString`).
  - **`createApp` props cast**: `createApp(Component, props)` expects `Data` (index-signature type); a typed props interface is NOT assignable, and a direct `as Record<string, unknown>` is illegal (types not mutually assignable). Fix: cast through `unknown` → `props as unknown as Record<string, unknown>` (applied in `user-element.ts` `createAppInstance()` helper + `ssr.ts`).
  - **Vue custom-element approach**: use `createApp(UserPanel, props).mount(container)` into a light-DOM child div (NOT `defineCustomElement`), mirroring the cart pattern. Hydration mounts into a fresh child div then removes the original SSR markup.
  - **jsdom limitation**: `customElements.undefine` is NOT available in jsdom — do NOT use it in tests. Rely on `register()` idempotency + fresh jsdom per test file (same as cart spec).
  - **Vue installed at root**: `vue@^3.5.41` + `@vue/server-renderer@^3.5.41` via `pnpm add -w vue @vue/server-renderer`.
- **✅ CATALOG MF (2A) RESOLVED (2026-08-27):** `nx build/test/lint catalog-mf` all green (6/6 tests).
  - **NG0201 `ComponentFactoryResolver`**: `@angular/elements` `createCustomElement` needs the config injector to provide `ComponentFactoryResolver`, `NgZone`, `ApplicationRef`, `ChangeDetectionScheduler`. A bare `Injector.create([])` provides none. Fix: `const appRef = await createApplication({ providers: [] })` (from `@angular/platform-browser`) then pass `appRef.injector`. `createApplication` returns a **Promise** (must `await`); `ApplicationConfig` **requires** `providers` (full-compilation type check).
  - **Shared-lib externalization (REUSE for cart/user)**: bare `@shared/*` imports + shared libs in `peerDependencies` (ng-packagr externalizes peers, bundles deps) + `tsconfig.lib.json` `paths`→`dist/libs/shared/*` (built `.d.ts`, avoids TS6059). Type-only `@jrumandal/contracts` is erased from FESM (expected) but present in `index.d.ts`.
  - **Lint**: added `mf` depConstraint (`onlyDependOnLibsWithTags: ["shared"]`) to root `eslint.config.mjs`; gave `contracts` the `shared` tag (was `[]`); `dependency-checks` `ignoredDependencies: [tslib, @angular/common, rxjs, @angular/compiler]` (transitive/spec-only false positives).
- **✅ LINT BLOCKER RESOLVED (2026-08-25):** root `microfrontend/eslint.config.mjs` now configures the installed `@typescript-eslint/parser` for `.ts`/`.tsx` and excludes ESLint config files from module-boundary checks. `nx run-many -t lint,typecheck` is green for the available targets (`contracts:lint`; no separate `typecheck` target exists yet).
  - Installed: `@typescript-eslint/parser` 8.67.0 + `@typescript-eslint/eslint-plugin` 8.67.0.
  - **NOT** installed: `typescript-eslint`, `@eslint/js` — so the `@nx/eslint-plugin` flat `flat/typescript` config can't be dropped in as-is.
  - Resolution: wired `@typescript-eslint/parser` directly into the root flat config for `**/*.ts(x)`.
  - Secondary: `@nx/enforce-module-boundaries` flags `libs/shared/contracts/eslint.config.mjs` importing the base config by relative path.
- Project name for the contracts lib in Nx is **`contracts`** (not `shared-contracts`); use `nx test contracts` / `nx build contracts`.
- Stray `nul` (0-byte Windows `> nul` redirect artifact) sits in `microfrontend/` — gitignored, do not commit. `.verdaccio/config.yml` is legit (Nx local-registry target) — commit it.
- Windows: default shell is PowerShell; wrap commands in `cmd /c`. Avoid nested double quotes in cmd (use `git commit -F file` for messages).
- Docker Desktop is installed at `C:\Users\Gaming\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`; start it before DB phases.
- pnpm 11: build scripts must be approved in `pnpm-workspace.yaml` `allowBuilds` (`@parcel/watcher`, `unrs-resolver` = true), otherwise `pnpm add` exits 1 with `ERR_PNPM_IGNORED_BUILDS`.
- PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM — do NOT use it for JSON/JS files; write via Node (`node -e` or a .js script).
- Pin `typescript@~5.9` — the npm `latest` tag is the TS 7.x native preview, incompatible with the Nx 23.1.1 toolchain.
- ESLint 10 flat config: `@nx/enforce-module-boundaries` uses `enforceBuildableLibDependency` + `depConstraints[].onlyDependOnLibsWithTags` (not `onlyAllowImports`).
