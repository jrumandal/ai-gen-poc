# Multi-Framework Micro-Frontend Reference Architecture

A runnable reference architecture that composes **Web Components written in
Angular, React, and Vue** into a single shell, with **shell-level SSR +
per-MF hydration**, backed by **NestJS micro-services** (GraphQL + Prisma),
and wrapped for hybrid mobile via **Capacitor**. Monorepo: **Nx + pnpm**.

Sample domain: e-commerce (catalog, cart, user) so each framework owns a real
module. The integration contract is **Web Components** — framework-agnostic,
SSR-string-renderable, and Capacitor-WebView-compatible with one mechanism.

> **Read this first, then the module READMEs.** After `plan.md`, the module
> READMEs are the canonical knowledge reference for each area. See
> [Documentation map](#documentation-map) below.

## Architecture

```
Browser / Capacitor WebView
└── Shell (Angular SSR)                    ← owns routing, layout, SSR entry
    ├── <catalog-mf>   (Angular custom element, SSR-rendered, hydrated)
    ├── <cart-mf>      (React, SSR-rendered, hydrated)
    └── <user-mf>      (Vue 3, SSR-rendered, hydrated)
            │  (query via shared GraphQL client)
            ▼
   API Gateway (NestJS + introspection-based GraphQL stitching)
            │
            ├──▶ catalog-svc (NestJS + Apollo + Prisma)  :4001
            ├──▶ cart-svc    (NestJS + Apollo + Prisma)  :4002
            └──▶ user-svc    (NestJS + Apollo + Prisma)  :4003
                        │
                        ▼
                  PostgreSQL (Prisma ORM)  :5432
```

- **Frontend contract** — Web Components (custom elements + light DOM by
  default + custom events). Shadow DOM is an opt-in choice for strict style
  isolation.
- **API contract** — GraphQL (Apollo). The gateway stitches the three
  non-federation service schemas via introspection (`@graphql-tools/stitch` +
  `wrap` + `executor-http`), so every MF talks to a single `/graphql`
  endpoint.
- **Data** — PostgreSQL + Prisma (code-first schema, migrations).

## Monorepo layout

```
microfrontend/
├── apps/
│   ├── shell/                    # Angular SSR app — composes the MFs
│   ├── mobile/                   # Capacitor wrapper (web/ = shell build)
│   └── api-gateway/              # NestJS gateway (GraphQL stitching)
├── libs/
│   ├── mf/
│   │   ├── catalog/              # Angular MF (custom element)
│   │   ├── cart/                 # React MF (custom element)
│   │   └── user/                 # Vue MF (custom element)
│   ├── shared/
│   │   ├── contracts/            # GraphQL-generated TS types + Apollo client
│   │   ├── design-tokens/        # CSS custom properties, theme
│   │   ├── event-bus/            # typed cross-MF custom events
│   │   ├── db/                   # Prisma client singleton + tooling
│   │   └── bridge/               # Capacitor bridge adapter + Web-API fallback
│   └── server/
│       ├── shared/               # NestJS shared modules (health, logging, errors, Prisma)
│       ├── catalog-svc/          # NestJS service (Prisma)
│       ├── cart-svc/             # NestJS service (Prisma)
│       └── user-svc/             # NestJS service (Prisma)
├── openapi/                      # canonical .yaml specs (source of truth)
├── graphql/                      # canonical GraphQL SDL (per service + gateway)
├── prisma/                       # Prisma schema + migrations
├── scripts/                      # serve-all.mjs, typecheck.mjs, codegen, etc.
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- **Node.js 22** (global `fetch` is used by the gateway and scripts)
- **pnpm 11** (workspace package manager)
- **Docker** (for PostgreSQL) — or a reachable Postgres at `localhost:5432`
- **Android SDK + JDK** (Windows host) — only for the Capacitor Android build

## Quick start

```bash
pnpm install

# 1. Database (Postgres 16 + pgAdmin via docker-compose)
pnpm db:up                 # docker compose up -d
pnpm db:migrate            # prisma migrate dev (applies migrations)
pnpm db:seed               # prisma db seed (idempotent demo data)

# 2. Whole stack in one command (DB best-effort + 3 services + gateway + shell)
pnpm serve:all
```

`serve:all` starts everything in dependency order and streams prefixed output.
Ctrl+C tears down all child processes.

### Ports

| Service            | Port | Notes |
| ------------------ | ---- | ----- |
| catalog-svc        | 4001 | NestJS + Apollo + Prisma |
| cart-svc           | 4002 | NestJS + Apollo + Prisma |
| user-svc           | 4003 | NestJS + Apollo + Prisma |
| api-gateway        | 4200 | GraphQL stitching entry point (`/graphql`) |
| shell (dev-server) | 4300 | Angular SSR dev server |
| shell (prod SSR)   | 4100 | `node dist/apps/shell/server/server.mjs` |
| mock e2e services  | 4101/4102/4103 | used by `api-gateway-e2e` only |
| PostgreSQL         | 5432 | via docker-compose |

> **Ordering constraint:** the gateway introspects all three services on module
> init and **throws if any is unreachable**, so it must start only after the
> services are listening. `serve:all` enforces this by waiting on ports
> 4001/4002/4003 before starting the gateway.

### Verify

```bash
# Gateway health (aggregates the 3 upstream services)
curl http://localhost:4200/health

# A cross-domain GraphQL query through the gateway
curl -s http://localhost:4200/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ products { id name } me { name } }"}'

# Shell SSR (server-rendered markup for all 3 MFs)
curl http://localhost:4300/catalog
```

## Common commands

All commands run from the `microfrontend/` root.

| Command | What it does |
| --- | --- |
| `pnpm serve:all` | One-command dev stack (DB + services + gateway + shell) |
| `pnpm build:all` | `nx run-many -t build` across all projects |
| `pnpm test:all` | `nx run-many -t test` across all projects |
| `pnpm lint:all` | `nx run-many -t lint` across all projects |
| `pnpm typecheck` | `tsc --noEmit` over all 17 projects (concurrency 4) |
| `pnpm db:up` / `db:down` | Start / stop Postgres via docker-compose |
| `pnpm db:migrate` | `prisma migrate dev` (dev migrations) |
| `pnpm db:deploy` | `prisma migrate deploy` (CI/prod migrations) |
| `pnpm db:seed` | `prisma db seed` (idempotent demo data) |
| `pnpm db:studio` | `prisma studio` (data browser) |
| `pnpm db:validate` | `prisma validate` |
| `pnpm db:generate` | `prisma generate` (regenerate Prisma client) |
| `pnpm graph` | `nx graph` (project dependency graph) |

Per-project targets (e.g. `nx build catalog-mf`, `nx test cart-svc`,
`nx serve user-svc`) are defined in each project's `project.json`.

## Adding a new micro-frontend

The pattern is: **a framework-specific lib that exposes a Web Component**,
registered by the shell, SSR-rendered by the shell, and hydrated on the client.

1. **Create the lib** under `libs/mf/<name>` with the framework's Nx plugin
   (`@nx/angular`, `@nx/react`, or `@nx/vue`).
2. **Expose a custom element** (`<name-mf>`) that:
   - renders in **light DOM** (SSR-compatible hydration);
   - imports `@shared/design-tokens` for theming;
   - emits/subscribes via `@shared/event-bus` for cross-MF communication;
   - accepts the shared `ApolloClient` (type-only) via `hydrate({ apolloClient })`.
3. **Add SSR + hydrate + register entries** (`ssr.ts`, `hydrate.ts`,
   `register.ts`) mirroring the existing MFs.
4. **Externalize framework deps** via `peerDependencies`; keep `@shared/*`
   as `workspace:*` with `paths` → `dist` in `tsconfig.lib.json`.
5. **Register in the shell** — add the element to
   `apps/shell/src/app/mf-client-bootstrap.ts`, a route in
   `app.routes.ts`, and an SSR render call in `mf-ssr.server.ts`.
6. **Add a backend service** (optional) under `libs/server/<name>-svc`
   (NestJS + Apollo + Prisma), then register it in the gateway's
   `GatewayService` introspection list.
7. **Add a README** for the new module (tracked in `STEPS.md`).

> **No cross-MF imports.** MFs communicate only through the event bus and the
> shared GraphQL client. This is enforced by ESLint dependency constraints
> (`mf` → `shared` only).

## Database guide

- **Schema** — `prisma/schema.prisma` (code-first). Models: Product, Category,
  ProductCategory, ProductAttribute, User, Session, Cart, CartItem, Order,
  OrderItem + `OrderStatus` enum. Money is stored as **integer cents + currency**.
- **Migrations** — `prisma/migrations/`. Use `pnpm db:migrate` (dev) or
  `pnpm db:deploy` (CI/prod).
- **Seed** — `prisma/seed.mjs` (idempotent; safe to re-run).
- **Client** — `libs/shared/db` exposes a `PrismaClient` singleton cached on
  `globalThis`. Services import it from `@shared/db`.
- **Env** — `DATABASE_URL` in `.env` (gitignored); `.env.example` is committed.

## Mobile (Capacitor)

`apps/mobile` wraps the shell build. The web assets are synced from
`dist/apps/shell/browser` into `apps/mobile/web` (see
`scripts/sync-mobile-web.mjs`). The bridge adapter (`libs/shared/bridge`)
detects Capacitor and falls back to Web APIs (e.g. camera via `getUserMedia`).

> **Android build is Windows-host-only.** `cap build android` runs Gradle,
> which cannot execute the Windows `java.exe` from WSL. Run
> `npx cap build android` from Windows PowerShell, or `npx cap open android`
> → Android Studio → Run. See `apps/mobile/README.md`.

## Documentation map

| Module | README |
| --- | --- |
| Contracts (GraphQL + OpenAPI types) | `libs/shared/contracts/README.md` |
| Event bus (typed cross-MF events) | `libs/shared/event-bus/README.md` |
| Design tokens (theme) | `libs/shared/design-tokens/README.md` |
| Database (Prisma client + tooling) | `libs/shared/db/README.md` |
| Catalog MF (Angular) | `libs/mf/catalog/README.md` |
| Cart MF (React) | `libs/mf/cart/README.md` |
| User MF (Vue) | `libs/mf/user/README.md` |
| Shell (Angular SSR) | `apps/shell/README.md` |
| Server shared (NestJS) | `libs/server/shared/README.md` |
| Catalog service | `libs/server/catalog-svc/README.md` |
| Cart service | `libs/server/cart-svc/README.md` |
| User service | `libs/server/user-svc/README.md` |
| API gateway | `apps/api-gateway/README.md` |
| Mobile (Capacitor) | `apps/mobile/README.md` |
| Bridge adapter | `libs/shared/bridge/README.md` |
| **Root (this file)** | `README.md` |

## Status

Phases 0–5 are complete and committed. Phase 6 (DX, docs, CI) is in progress —
see `STEPS.md` for the live tracker.
