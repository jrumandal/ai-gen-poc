# Step Tracker — Multi-Framework Micro-Frontend Reference Architecture

Resume guide: work top-to-bottom; the first `⬜ pending` step is where to continue.
Status legend: `⬜ pending` → `🔄 in-progress` → `✅ done` (after git commit) | `⛔ blocked` (reason noted).

Workspace: `d:\workspace` (git root) · Project: `d:\workspace\microfrontend` (Nx + pnpm monorepo)

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
- [ ] 1.8 Commit Phase 1 — 🔄 in-progress (1.1–1.7 all done & verified; awaiting commit)

## Phase 1.5 — Database layer (PostgreSQL + Prisma)
- [ ] 15.1 `prisma/schema.prisma` — Product, Category, Cart, CartItem, User, Session
- [ ] 15.2 `docker-compose.yml` (PostgreSQL + pgAdmin) + `.env`
- [ ] 15.3 `libs/shared/db` — Prisma client singleton + `db:migrate` / `db:seed` / `db:studio` targets
- [ ] 15.4 Verify: `prisma validate`; `migrate dev` creates tables; seed idempotent
- [ ] 15.5 Commit Phase 1.5

## Phase 2 — Micro-Frontends (Web Components)
- [ ] 2A.1 Angular MF `libs/mf/catalog` (custom element `catalog-mf`, customElements mode)
- [ ] 2A.2 Catalog SSR entry (`ssr.ts` renderModule → HTML string) + `hydrate.ts` + `register.ts`
- [ ] 2B.1 React MF `libs/mf/cart` (custom element `cart-mf`, light-DOM createRoot)
- [ ] 2B.2 Cart SSR (`renderToString`) + hydrate (`hydrateRoot`) + register
- [ ] 2C.1 Vue MF `libs/mf/user` (custom element `user-mf`, defineCustomElement)
- [ ] 2C.2 User SSR (`renderToString` from `@vue/server-renderer`) + hydrate + register
- [ ] 2.3 All MFs: import design-tokens, emit/subscribe event-bus, no cross-MF imports
- [ ] 2.4 Verify per MF: `nx build` emits ESM + SSR entry; SSR-string test; custom-element JSDOM test
- [ ] 2.5 Commit Phase 2

## Phase 3 — Shell (Angular SSR) + composition
- [ ] 3.1 Shell app `apps/shell` (Angular + `@angular/ssr` Express adapter)
- [ ] 3.2 Register 3 custom elements; routes `/catalog`, `/cart`, `/account`; top nav + theme
- [ ] 3.3 SSR composition: server calls each MF `ssr.render(props)`, injects markup; client hydrates
- [ ] 3.4 Shared ApolloClient bootstrap injected into MFs
- [ ] 3.5 Verify: `nx serve shell` → curl shows server-rendered markup for all 3 MFs
- [ ] 3.6 Commit Phase 3

## Phase 4 — NestJS micro-services + gateway
- [ ] 4.1 `catalog-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.2 `cart-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.3 `user-svc` (NestJS + GraphQL + Prisma)
- [ ] 4.4 `libs/server/shared` — health, logging, error filter, config, Prisma module
- [ ] 4.5 `api-gateway` (Apollo Federation gateway, CORS, JWT stub, `/health` aggregate)
- [ ] 4.6 Verify: services serve GraphQL; gateway federates cross-service query; `/health` green; contract test
- [ ] 4.7 Commit Phase 4

## Phase 5 — Capacitor hybrid mobile
- [ ] 5.1 `apps/mobile` Capacitor project (webDir = shell build output)
- [ ] 5.2 Sync shell build → `apps/mobile/web`; `cap sync`
- [ ] 5.3 Bridge adapter (Capacitor detection + Web-API fallback) + `@capacitor/camera` demo
- [ ] 5.4 Verify: `cap sync` ok; `cap build android` (requires Android SDK — note if absent)
- [ ] 5.5 Commit Phase 5

## Phase 6 — DX, docs, CI
- [ ] 6.1 Root `README.md` (architecture, run instructions, add-MF guide, DB guide)
- [ ] 6.2 Nx targets: `serve:all`, `build:all`, `test:all`, `lint:all`, `typecheck`, `db:migrate`, `db:seed`, `db:studio`
- [ ] 6.3 GitHub Actions CI (lint → typecheck → test → build)
- [ ] 6.4 Final end-to-end verification (per plan §Verification)
- [ ] 6.5 Commit Phase 6

## Notes / blockers
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
