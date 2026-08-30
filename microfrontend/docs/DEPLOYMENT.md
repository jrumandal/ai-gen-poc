# Deployment Pipeline

This document defines the deployment pipeline for both the **web** and **native (Android)**
versions of the micro-frontend reference architecture, and documents the local Docker Desktop
implementation of the web deployment.

> **Scope:** This is a *reference* deployment pipeline. It is designed to run on GitHub Actions
> (CI) and to be reproducible locally. The web pipeline is fully implemented and verified in
> local Docker Desktop. The native pipeline is implemented as a CI job + local Gradle build.

---

## 1. Architecture overview

The application is a **multi-framework micro-frontend** (Angular shell + React/Vue/Angular
micro-frontends) backed by a **NestJS GraphQL gateway** that stitches three domain services
(catalog, cart, user) over a single Postgres database.

```
Browser / Capacitor WebView
        │  (SSR HTML + client JS)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  shell (Angular SSR, node dist/apps/shell/server/server.mjs) │  :4000
│  - pre-renders the 3 MFs to HTML (static sample data)        │
│  - serves static assets from dist/apps/shell/browser         │
└─────────────────────────────────────────────────────────────┘
        │  (client-side GraphQL, GATEWAY_URI)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  api-gateway (NestJS + Apollo, node dist/apps/api-gateway)   │  :4200
│  - stitches catalog/cart/user schemas (introspection)        │
│  - GATEWAY_SERVICES points at the 3 service endpoints        │
└─────────────────────────────────────────────────────────────┘
        │  (per-domain GraphQL)
   ┌────┴─────┬──────────┐
   ▼          ▼          ▼
catalog-svc  cart-svc   user-svc          :4001 :4002 :4003
   └──────────┴──────────┘
        ▼
   Postgres (mf-postgres, :5432)
```

**Key runtime facts (verified):**

| Concern | Value |
|---|---|
| Shell SSR entry | `dist/apps/shell/server/server.mjs` (NOT `main.server.mjs`) |
| Shell port | `4000` (env `PORT`) |
| Gateway port | `4200` (env `PORT`) |
| Service ports | catalog `4001`, cart `4002`, user `4003` (env `PORT`) |
| Gateway → services | `GATEWAY_SERVICES` (comma-separated endpoints) |
| Shell → gateway (browser) | `GATEWAY_URI` (default `http://localhost:4200/graphql`) |
| DB | `DATABASE_URL` (Postgres), `PRISMA_CLIENT_ENGINE_TYPE=binary` |
| SSR data | **static sample data** — the shell does NOT call the gateway server-side |

> **Ordering constraint:** the gateway's `onModuleInit()` introspects all three services and
> **throws if any is unreachable**. The gateway must therefore start only after all three
> services are healthy. `docker-compose.web.yml` enforces this with `depends_on` +
> `condition: service_healthy`.

---

## 2. Web deployment pipeline

### 2.1 Pipeline stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Source  │──▶│  Install │──▶│  Build   │──▶│  Image   │──▶│  Deploy  │
│  (git)   │   │  (pnpm)  │   │ (nx)     │   │ (docker) │   │ (compose)│
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

1. **Source** — git checkout (tag or branch).
2. **Install** — `pnpm install --frozen-lockfile` (Node 22, pnpm 11.24.0).
3. **Build** — `pnpm db:generate` (Prisma client) + `pnpm build:all` (14 projects → `dist/`).
4. **Image** — multi-stage Docker build (`Dockerfile`) → `microfrontend-web:latest`.
5. **Deploy** — `docker compose -f docker-compose.web.yml up -d` (5 services + external Postgres).

### 2.2 Dockerfile (multi-stage)

`Dockerfile` (at repo root `microfrontend/`):

- **Stage 1 `builder`** (`node:22-slim`): installs pnpm 11.24.0, copies the workspace,
  runs `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm build:all`.
- **Stage 2 `runtime`** (`node:22-slim`): copies `dist/`, `node_modules/`, `prisma/`,
  `package.json`. Exposes `4000 4001 4002 4003 4200`. Default CMD runs the shell SSR server.

> **Build-script approval (pnpm 11):** pnpm 11 uses the `allowBuilds` map in
> `pnpm-workspace.yaml` as the *authoritative* build-script decision. A dependency with a build
> script that is not listed there causes `[ERR_PNPM_IGNORED_BUILDS]` on a fresh (CI-like) install.
> `less` and `workerd` are explicitly denied (`false`) in `allowBuilds` to satisfy this check.

### 2.3 docker-compose.web.yml

`docker-compose.web.yml` (at repo root `microfrontend/`) defines 5 services, all from the same
image, each with a different entrypoint:

| Service | Entrypoint | Port | Depends on |
|---|---|---|---|
| `catalog-svc` | `node dist/libs/server/catalog-svc/main.js` | 4001 | postgres (healthy) |
| `cart-svc` | `node dist/libs/server/cart-svc/main.js` | 4002 | postgres (healthy) |
| `user-svc` | `node dist/libs/server/user-svc/main.js` | 4003 | postgres (healthy) |
| `api-gateway` | `node dist/apps/api-gateway/main.js` | 4200 | all 3 services (healthy) |
| `shell` | `node dist/apps/shell/server/server.mjs` | 4000 | api-gateway (started) |

All services attach to the **external** `microfrontend-db_default` network (the one
`mf-postgres` already lives on), so they resolve `postgres` by service name and reach the
already-running database.

### 2.4 Local Docker Desktop runbook (verified)

> **WSL note:** the WSL `docker` shim is broken (WSL integration not enabled). Call the Docker
> Desktop binary directly:
> `/mnt/c/Users/Gaming/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe`

```bash
cd microfrontend

DOCKER=/mnt/c/Users/Gaming/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe

# 1. Ensure the database is up (already running as mf-postgres)
$DOCKER ps --filter name=mf-postgres

# 2. Build the image
$DOCKER compose -f docker-compose.web.yml build

# 3. Start the stack
$DOCKER compose -f docker-compose.web.yml up -d

# 4. Watch startup (services → gateway → shell)
$DOCKER compose -f docker-compose.web.yml ps
$DOCKER compose -f docker-compose.web.yml logs -f

# 5. Verify
curl -s http://localhost:4200/health          # gateway
curl -sL http://localhost:4000/catalog        # shell SSR (302 → /catalog)

# 6. Tear down (keeps the DB)
$DOCKER compose -f docker-compose.web.yml down
```

**Access the web version:** open `http://localhost:4000/catalog` in a browser. The shell SSR
server pre-renders the three micro-frontends; the browser then hydrates and calls the gateway at
`http://localhost:4200/graphql` (the default `GATEWAY_URI`).

### 2.5 CI (GitHub Actions)

`.github/workflows/ci.yml` — job `ci`:

1. Checkout
2. `pnpm/action-setup@v4` (v11.24.0)
3. `setup-node@v4` (node-22, pnpm cache)
4. `pnpm install --frozen-lockfile`
5. `pnpm lint:all`
6. `pnpm typecheck`
7. `pnpm test:all`
8. `pnpm build:all`

> The CI job validates the *build* half of the web pipeline. The Docker image build + compose
> deploy is the local/production step (see 2.4). A `docker/build-push-action` step can be added
> to push the image to a registry for a full CI→CD loop.

---

## 3. Native (Android) deployment pipeline

### 3.1 Pipeline stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Source  │──▶│  Build   │──▶│  Sync    │──▶│  Android │──▶│  Package │
│  (git)   │   │ (shell)  │   │ (cap)    │   │ (gradle) │   │ (apk/aab)│
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

1. **Source** — git checkout.
2. **Build shell** — `pnpm nx build shell` (SSR build → `dist/apps/shell/browser/`).
3. **Sync** — `scripts/sync-mobile-web.mjs` copies the browser build into `apps/mobile/web/`
   (renaming `index.csr.html` → `index.html`), then `npx cap sync`.
4. **Android** — `./gradlew assembleDebug` (debug) or `assembleRelease` (release, needs signing).
5. **Package** — `app-debug.apk` / `app-release.aab` from `apps/mobile/android/app/build/outputs/`.

### 3.2 Toolchain requirements (verified)

| Component | Version | Notes |
|---|---|---|
| JDK | **21** (Temurin) | `capacitor-camera` requires Java 21 (JDK 17 is insufficient) |
| Android SDK | `platforms;android-36`, `build-tools;36.0.0` | `compileSdk = 36`, `minSdk = 24`, `targetSdk = 36` |
| Gradle | 8.14.3 (wrapper) | AGP 8.13.0 |
| Capacitor | 8.5.0 | `@capacitor/android`, `@capacitor/camera` |

> **Signing:** `cap build android` defaults to **release**, which requires a signing keystore.
> For a locally-runnable artifact, build the **debug** variant directly:
> `./gradlew assembleDebug` (auto-signed). For release, configure `signingConfigs` in
> `apps/mobile/android/app/build.gradle` and provide a keystore.

### 3.3 Local runbook (verified)

```bash
cd microfrontend

# JDK 21 (required by capacitor-camera)
export JAVA_HOME=~/android-toolchain/jdk-21.0.12.1+1
export ANDROID_HOME=~/android-toolchain/sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

# 1. Build the shell (SSR) + sync into the Capacitor web dir
pnpm nx build-web mobile

# 2. Build the debug APK (auto-signed)
cd apps/mobile/android
./gradlew assembleDebug

# 3. Artifact
ls app/build/outputs/apk/debug/app-debug.apk
```

### 3.4 CI (GitHub Actions)

`.github/workflows/ci.yml` — job `android` (manual `workflow_dispatch`, `needs: ci`):

1. Checkout
2. `pnpm/action-setup@v4` (v11.24.0)
3. `setup-node@v4` (node-22, pnpm cache)
4. **`setup-java@v4` (temurin, **21**)** ← *must be 21, not 17*
5. `android-actions/setup-android@v3`
6. `sdkmanager "platforms;android-36" "build-tools;36.0.0"`
7. `pnpm install --frozen-lockfile`
8. `pnpm nx build-web mobile`
9. **`cd apps/mobile/android && ./gradlew assembleDebug`** ← *debug, not release*
10. Upload `app-debug.apk` as an artifact

> **Known CI gaps (to fix):** the current `android` job uses JDK **17** (needs **21**) and runs
> `pnpm nx build-android mobile` (defaults to **release**, needs a keystore). The runbook above
> (3.3) is the verified-correct sequence.

---

## 4. Environment variables reference

| Variable | Service | Default | Purpose |
|---|---|---|---|
| `PORT` | shell, gateway, services | 4000 / 4200 / 4001-4003 | Listen port |
| `DATABASE_URL` | services | — | Postgres connection string |
| `PRISMA_CLIENT_ENGINE_TYPE` | services | `binary` | Prisma engine type |
| `GATEWAY_SERVICES` | api-gateway | localhost:4001/4002/4003 | Comma-separated service endpoints |
| `GATEWAY_URI` | shell (browser) | `http://localhost:4200/graphql` | GraphQL endpoint for the client |

---

## 5. Verification checklist

- [x] `pnpm install --frozen-lockfile` succeeds (no `ERR_PNPM_IGNORED_BUILDS`)
- [x] `pnpm build:all` produces all 5 dist entrypoints
- [x] `docker compose -f docker-compose.web.yml config --quiet` validates
- [x] `docker compose -f docker-compose.web.yml build` produces `microfrontend-web:latest`
- [x] `docker compose -f docker-compose.web.yml up -d` starts all 5 services healthy
- [x] `curl http://localhost:4200/health` → gateway OK
- [x] `curl -L http://localhost:4000/catalog` → shell SSR HTML
- [x] Browser: `http://localhost:4000/catalog` renders the micro-frontends
- [x] `./gradlew assembleDebug` → `app-debug.apk`
