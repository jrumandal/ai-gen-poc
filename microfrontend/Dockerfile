# syntax=docker/dockerfile:1
# =============================================================================
# microfrontend — web deployment image (multi-stage)
#
# Builds the full web stack (Angular SSR shell + 3 NestJS/GraphQL services +
# GraphQL gateway) from source, then produces a slim runtime image that can run
# ANY of the five entry points (selected per-service in docker-compose.web.yml).
#
#   shell        -> node dist/apps/shell/server/server.mjs   (port 4000)
#   catalog-svc  -> node dist/libs/server/catalog-svc/main.js (port 4001)
#   cart-svc     -> node dist/libs/server/cart-svc/main.js    (port 4002)
#   user-svc     -> node dist/libs/server/user-svc/main.js    (port 4003)
#   api-gateway  -> node dist/apps/api-gateway/main.js        (port 4200)
#
# Node 22 + pnpm 11.24.0 (pinned to the workspace). Debian slim base so the
# Prisma binary engine works out of the box (no musl/openssl shims needed).
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — build
# -----------------------------------------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app

# Pin pnpm to the exact version the workspace was developed with.
RUN npm install -g pnpm@11.24.0

# 1) Install workspace dependencies (frozen lockfile, workspace-aware).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json nx.json jest.config.ts jest.preset.js eslint.config.mjs codegen.mjs ./
COPY apps ./apps
COPY libs ./libs
COPY prisma ./prisma
COPY scripts ./scripts
COPY graphql ./graphql
RUN pnpm install --frozen-lockfile

# 2) Generate the Prisma client (reads prisma/schema.prisma; no live DB needed).
RUN pnpm db:generate

# 3) Build every web project (shell SSR + 3 services + gateway + shared libs).
#    `build:all` = `nx run-many -t build --exclude @microfrontend/source`.
#    The mobile app has no plain `build` target, so it is skipped automatically.
RUN pnpm build:all

# -----------------------------------------------------------------------------
# Stage 2 — runtime
# -----------------------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# The services `require()` their npm deps at runtime (webpack externalizes them),
# so the runtime image ships the built `dist/` alongside the installed
# `node_modules/` and the Prisma schema (for the generated client + migrations).
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# pnpm links workspace packages into node_modules as SYMLINKS pointing at their
# source dir (e.g. node_modules/@shared/bridge -> ../../libs/shared/bridge).
# The shell's Vite SSR build externalizes @shared/bridge (see apps/shell/project.json
# `externalDependencies`), so it is resolved at RUNTIME from that symlink. Copy the
# workspace package dir so the symlink target exists; its `main` then resolves to
# the already-copied dist/libs/shared/bridge output. (The NestJS services bundle
# their @server/* deps with webpack, so they don't need this.)
COPY --from=builder /app/libs/shared/bridge ./libs/shared/bridge

# Ports used by the five web entry points (only the ones a given container
# serves are actually bound; the rest are documented for reference).
EXPOSE 4000 4001 4002 4003 4200

# Default entry point: the Angular SSR shell. Compose overrides this per service.
CMD ["node", "dist/apps/shell/server/server.mjs"]
