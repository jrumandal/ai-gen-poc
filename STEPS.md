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
| `libs/server/shared/README.md` | 4 | ⬜ |
| `libs/server/catalog-svc/README.md` | 4 | ⬜ |
| `libs/server/cart-svc/README.md` | 4 | ⬜ |
| `libs/server/user-svc/README.md` | 4 | ⬜ |
| `apps/api-gateway/README.md` | 4 | ⬜ |
| `apps/mobile/README.md` | 5 | ⬜ |
| `microfrontend/README.md` (root) | 6 | ⬜ |

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
- [x] 2.3 All MFs: import design-tokens, emit/subscribe event-bus, no cross-MF imports — ✅ done (2026-08-27; verified all 3 MFs import `@shared/contracts`+`design-tokens`+`event-bus`; no `@mf/*` cross-imports)
- [x] 2.4 Verify per MF: `nx build` emits ESM + SSR entry; SSR-string test; custom-element JSDOM test — ✅ done (2026-08-27; catalog FESM2022 bundle exports `render`/`register`/`hydrate`; cart+user ESM `ssr.js`; all 3 MFs build/test/lint green)
- [x] 2.5 Commit Phase 2 — ✅ done (2026-08-27; commit 41d173b "feat(mf): Phase 2 — Angular/React/Vue micro-frontends as Web Components"; 52 files, 4015 insertions)

## Phase 3 — Shell (Angular SSR) + composition
- [x] 3.1 Shell app `apps/shell` (Angular + `@angular/ssr` Express adapter) — ✅ done (2026-08-28; `@nx/angular:application apps/shell --ssr`; `@angular/build:application` + Express `AngularNodeAppEngine` adapter; routing + Jest enabled)
- [x] 3.2 Register 3 custom elements; routes `/catalog`, `/cart`, `/account`; top nav + theme — ✅ done (2026-08-28; `mf-client-bootstrap.ts` registers 3 elements + attaches shared event bus; `app.routes.ts` 3 routes + redirect; `app.html` top nav + theme toggle; `app.spec.ts` 4/4 ✅)
- [x] 3.3 SSR composition: server calls each MF `ssr.render(props)`, injects markup; client hydrates — ✅ done (2026-08-28; `mf-ssr.server.ts` `renderMfSsrHtml()` (cached `Promise.all` of 3 renders) → `provideMfSsrHtml` → pages inject via `[innerHTML]`; **SSRF host-allowlist fixed** by passing `allowedHosts` to `AngularNodeAppEngine` ctor (see README); verified SSR HTML for all 3 MFs)
- [x] 3.4 Shared ApolloClient bootstrap injected into MFs — ✅ done (2026-08-28; `@shared/contracts` owns `MfApolloClient` type + `createSharedApolloClient(uri)` factory (`src/apollo.ts`, `@apollo/client ^4.2.12` dep); shell `mf-client-bootstrap.ts` creates the singleton (`GATEWAY_URI` env or `http://localhost:4200/graphql`) and injects it via each MF's `hydrate({ eventBus, apolloClient })`; all 3 MFs accept + store `apolloClient` (type-only, erased at runtime) — catalog `@Input`, cart element prop, user element prop; all MFs + shell rebuilt ✅; SSR regression re-verified on :4100 (all 3 MFs server-render); `cache-and-network` factory confirmed in client bundle)
- [x] 3.5 Verify: `nx serve shell` → curl shows server-rendered markup for all 3 MFs — ✅ done (2026-08-28; verified via production SSR server `node dist/apps/shell/server/server.mjs` on :4100; `/catalog`→`catalog-mf`+Mechanical Keyboard+USB-C Hub, `/cart`→`cart-mf`+USD 149.99, `/account`→`user-mf`+Ada Lovelace+Analytical Engine; **no** "Falling back to client side rendering" in log)
- [ ] 3.6 Commit Phase 3
- [x] 3.7 Documentation: `apps/shell/README.md` (SSR composition, routes, Apollo bootstrap, run/verify) — ✅ done (2026-08-28; covers SSR composition flow, SSRF host-allowlist fix, client bootstrap, shared Apollo client, routes, build/run/verify)

## Phase 4 — NestJS micro-services + gateway
- [ ] 4.1 `catalog-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.2 `cart-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.3 `user-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.4 `libs/server/shared` — health, logging, error filter, config, Prisma module
- [ ] 4.5 `api-gateway` (Apollo Federation gateway, CORS, JWT stub, `/health` aggregate)
- [ ] 4.6 Verify: services serve GraphQL; gateway federates cross-service query; `/health` green; contract test
- [ ] 4.7 Commit Phase 4
- [ ] 4.8 Documentation: `libs/server/shared`, `catalog-svc`, `cart-svc`, `user-svc`, `apps/api-gateway` READMEs — ⬜ pending (required before 4.7 ✅)

## Phase 5 — Capacitor hybrid mobile
- [ ] 5.1 `apps/mobile` Capacitor project (webDir = shell build output)
- [ ] 5.2 Sync shell build → `apps/mobile/web`; `cap sync`
- [ ] 5.3 Bridge adapter (Capacitor detection + Web-API fallback) + `@capacitor/camera` demo
- [ ] 5.4 Verify: `cap sync` ok; `cap build android` (requires Android SDK — note if absent)
- [ ] 5.5 Commit Phase 5
- [ ] 5.6 Documentation: `apps/mobile/README.md` (Capacitor setup, bridge adapter, sync/build) — ⬜ pending (required before 5.5 ✅)

## Phase 6 — DX, docs, CI
- [ ] 6.1 Root `README.md` (architecture, run instructions, add-MF guide, DB guide)
- [ ] 6.2 Nx targets: `serve:all`, `build:all`, `test:all`, `lint:all`, `typecheck`, `db:migrate`, `db:seed`, `db:studio`
- [ ] 6.3 GitHub Actions CI (lint → typecheck → test → build)
- [ ] 6.4 Final end-to-end verification (per plan §Verification)
- [ ] 6.5 Commit Phase 6
- [ ] 6.6 Documentation: root `microfrontend/README.md` (architecture, run guide, add-MF guide, DB migrations) — ⬜ pending (required before 6.5 ✅; authored as 6.1)

## Notes / blockers
- **✅ VUE USER MF (2C) RESOLVED (2026-08-27):** `nx build/test/lint user-mf` all green (10/10 tests).
  - **Vue SSR is async**: `renderToString` from `@vue/server-renderer` returns `Promise<string>` — so `ssr.ts` `render()` is `async` and tests `await` it (unlike React's sync `renderToString`).
  - **`createApp` props cast**: `createApp(Component, props)` expects `Data` (index-signature type); a typed props interface is NOT assignable, and a direct `as Record<string, unknown>` is illegal (types not mutually assignable). Fix: cast through `unknown` → `props as unknown as Record<string, unknown>` (applied in `user-element.ts` `createAppInstance()` helper + `ssr.ts`).
  - **Vue custom-element approach**: use `createApp(UserPanel, props).mount(container)` into a light-DOM child div (NOT `defineCustomElement`), mirroring the cart pattern. Hydration mounts into a fresh child div then removes the original SSR markup.
  - **jsdom limitation**: `customElements.undefine` is NOT available in jsdom — do NOT use it in tests. Rely on `register()` idempotency + fresh jsdom per test file (same as cart spec).
  - **Vue installed at root**: `vue@^3.5.41` + `@vue/server-renderer@^3.5.41` via `pnpm add -w vue @vue/server-renderer`.
- **✅ CATALOG MF (2A) RESOLVED (2026-08-27):** `nx build/test/lint catalog-mf` all green (6/6 tests).
  - **NG0201 `ComponentFactoryResolver`**: `@angular/elements` `createCustomElement` needs the config injector to provide `ComponentFactoryResolver`, `NgZone`, `ApplicationRef`, `ChangeDetectionScheduler`. A bare `Injector.create([])` provides none. Fix: `const appRef = await createApplication({ providers: [] })` (from `@angular/platform-browser`) then pass `appRef.injector`. `createApplication` returns a **Promise** (must `await`); `ApplicationConfig` **requires** `providers` (full-compilation type check).
  - **Shared-lib externalization (REUSE for cart/user)**: bare `@shared/*` imports + shared libs in `peerDependencies` (ng-packagr externalizes peers, bundles deps) + `tsconfig.lib.json` `paths`→`dist/libs/shared/*` (built `.d.ts`, avoids TS6059). Type-only `@shared/contracts` is erased from FESM (expected) but present in `index.d.ts`.
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
