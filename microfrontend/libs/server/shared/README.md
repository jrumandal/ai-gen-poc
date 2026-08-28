# @server/shared — shared NestJS modules for micro-services

The **shared** server library provides the common NestJS building blocks used by
every micro-service (`catalog-svc`, `cart-svc`, `user-svc`) and the `api-gateway`.
It keeps each service thin: services only declare their domain resolvers and
import these ready-made modules.

> **Project name is `shared`** (not `server-shared`) — see `project.json`.
> **Package name is `@server/shared`** — see `package.json`.

## What's inside

| Module / Export | Purpose |
| --- | --- |
| `PrismaModule` / `PrismaService` | `@Global()` module exposing a single `PrismaClient` (extends `PrismaClient`, `$connect`/`$disconnect` on module init/destroy). |
| `AppConfigModule` / `configuration` | Global `@nestjs/config` module with a typed `AppConfig` (`serviceName`, `port`, `env`, `databaseUrl`) loaded from env. |
| `HealthModule` / `HealthController` | `GET /health` endpoint (via `@nestjs/terminus`) that pings the database with `PrismaHealthIndicator.pingCheck`. |
| `LoggingInterceptor` | `NestInterceptor` that logs `METHOD url` on request and `METHOD url +<ms>` on completion. |
| `AllExceptionsFilter` | Global `ExceptionFilter` that normalizes every error into a consistent JSON body and logs it. |
| `SharedModule` | Convenience module that imports + re-exports `PrismaModule`. |

## Public API

```ts
import {
  PrismaModule,
  PrismaService,
  AppConfigModule,
  HealthModule,
  LoggingInterceptor,
  AllExceptionsFilter,
  SharedModule,
} from '@server/shared';
```

## Wiring a service

A service module imports the shared modules; `main.ts` applies the global
filter + interceptor:

```ts
// app.module.ts
@Module({
  imports: [AppConfigModule, SharedModule, HealthModule, /* GraphQLModule, … */],
  controllers: [AppController],
  providers: [/* domain resolvers */],
})
export class AppModule {}
```

```ts
// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new AllExceptionsFilter());
app.useGlobalInterceptors(new LoggingInterceptor());
```

This gives every service, for free:

- `GET /health` — database ping (terminus)
- structured request logging
- a consistent error envelope for every exception

## Build & test

```bash
npx nx build shared     # @nx/js:tsc → dist/libs/server/shared
npx nx test shared
npx nx lint shared
```

## Consumer gotcha — webpack `resolve.alias`

The `package.json` `main` points at `./src/index.js`, which does **not** exist
until the consumer's own build runs. Nx 23's webpack does **not** alias tsconfig
paths by default, and it resolves the `node_modules` symlink *before* the
tsconfig-paths fallback kicks in — so a consumer that imports `@server/shared`
will fail to resolve unless it adds an explicit alias.

**Every consumer (catalog-svc, cart-svc, user-svc, api-gateway) must add:**

```js
// webpack.config.js
resolve: {
  alias: {
    '@server/shared': join(__dirname, '../shared/src/index.ts'),
  },
},
```

(Adjust the relative path to the shared lib's `src/index.ts` from the consumer's
directory.)

## Prisma client generation

`@prisma/client` is a dependency of this lib. pnpm 11 blocks postinstall build
scripts by default, so after any `pnpm install` you must generate the client
manually:

```bash
npx prisma generate
```

Both `shared` and the services resolve `@prisma/client` to the **same**
generated copy, so a single `prisma generate` covers all of them.

## Conventions

- **Money** is always integer minor units (cents) + `currency` — never a float.
- The Prisma client is a **singleton** per process (one `PrismaService`).
- Services are stateless; all persistence goes through `PrismaService`.
