# `@jrumandal/user-svc` — User microservice

The **user-svc** is the NestJS microservice that owns the **user domain**
(user accounts, sessions, and orders). It exposes a GraphQL API (via
`@nestjs/graphql` + Apollo) backed by **Prisma** (PostgreSQL), and is one of
the three upstream services that the **api-gateway** stitches together.

> **Package name is `@jrumandal/user-svc`** — see `package.json`.
> **Status:** Faithful port of the reference `libs/server/user-svc`,
> re-homed as a standalone, independently versioned repository.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service info (name, status, links). |
| `POST /graphql` | GraphQL endpoint (user domain). |
| `GET /api-docs` | Swagger UI (OpenAPI). |
| `GET /health` | Health check (Prisma DB ping) — from `@jrumandal/shared`. |

Default port: **4003** (override with `PORT`).

## GraphQL schema

The schema is **auto-generated** by `@nestjs/graphql` from the resolvers + DTOs
(`autoSchemaFile: ./dist/schema.gql`). It mirrors the canonical
`graphql/user.graphql`:

```graphql
scalar DateTime

type Query {
  me: User
  orders: [Order!]!
}

type Mutation {
  login(input: LoginInput!): User!
  updateProfile(input: UpdateProfileInput!): User!
}

type User {
  id: ID!
  email: String!
  name: String!
  address: Address!
}

type Address {
  line1: String!
  city: String!
  state: String
  postalCode: String!
  country: String!
}

type Order {
  id: ID!
  createdAt: DateTime!
  status: OrderStatus!
  items: [OrderItem!]!
  total: Money!
}

type OrderItem {
  productId: ID!
  quantity: Int!
  unitPrice: Money!
}

enum OrderStatus {
  PLACED
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

type Money {
  amount: Int!
  currency: String!
}

input LoginInput {
  email: String!
  password: String!
}

input UpdateProfileInput {
  name: String!
  address: AddressInput!
}

input AddressInput {
  line1: String!
  city: String!
  state: String
  postalCode: String!
  country: String!
}
```

> The `DateTime` scalar is a custom `GraphQLScalarType` (ISO 8601) registered
> as a DI provider in `app.module.ts` so the schema builder can resolve
> `@Field(() => DateTime)` in the `Order` type.

## Data model (Prisma)

The service is backed by the **shared Prisma schema** in `@jrumandal/shared`
(`prisma/schema.prisma`). The user domain uses the `User`, `Session`, `Order`,
and `OrderItem` models. Money is stored as integer cents (`total` /
`unitPrice`) + `currency` and mapped to the `Money` GraphQL type.

> The Prisma schema, migrations, and seed live in **`server-shared`** so all
> three services share one database contract. This service consumes the
> generated `PrismaClient` through `@jrumandal/shared`'s `PrismaService`.

## Consuming `@jrumandal/shared`

`app.module.ts` imports `AppConfigModule`, `SharedModule`, and `HealthModule`
from `@jrumandal/shared`; `main.ts` applies the global `AllExceptionsFilter` and
`LoggingInterceptor`. This gives the service, for free:

- typed env config
- a global `PrismaService` (shared `PrismaClient`)
- a `/health` endpoint with a Prisma DB ping
- structured request logging
- a consistent error envelope for every exception

`@jrumandal/shared` is a **workspace dependency** (`workspace:*`). In this
standalone repo it resolves through the pnpm workspace link to
`server-shared/dist/index.js` (main) + `dist/index.d.ts` (types) — so
**`server-shared` must be built (`tsc` → `dist/`) before this repo is
typechecked, tested, or built**. CI does this automatically (see
`.github/workflows/ci.yml`).

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node 22 LTS, CommonJS |
| Framework | NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/platform-express`, `@nestjs/swagger`) |
| GraphQL | `@nestjs/graphql` + `@nestjs/apollo` (Apollo) |
| ORM | Prisma 6 (shared schema from `@jrumandal/shared`) |
| Build | `tsc` → `dist/` (CommonJS) |
| Tests | Jest + ts-jest |
| Lint | ESLint 9 (flat) + typescript-eslint |
| Types | TypeScript 5.9 |

## Repository layout

```
user-svc/
├── .github/workflows/ci.yml   # lint → typecheck → test → build
├── .npmrc                     # @server → GitHub Packages
├── .nvmrc                     # Node 22
├── .env.example               # PORT, DATABASE_URL, …
├── eslint.config.mjs          # flat ESLint 9 config
├── jest.config.cts            # Jest + ts-jest
├── package.json               # @jrumandal/user-svc (private)
├── tsconfig.json              # base compiler options
├── tsconfig.build.json        # build → dist/
├── tsconfig.spec.json         # test (Jest)
└── src/
    ├── main.ts                # bootstrap (Swagger + /graphql + /health)
    └── app/
        ├── app.module.ts
        ├── app.controller.ts
        ├── app.controller.spec.ts
        ├── dto/               # GraphQL types (User, Order, Money, DateTime, …)
        └── resolvers/         # UserResolver (Prisma-backed)
```

## Build & run

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm start          # node dist/main.js
pnpm dev            # tsx watch src/main.ts
pnpm test           # Jest
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
```

> **Prerequisite:** `server-shared` must be built first (it provides
> `@jrumandal/shared` + the generated Prisma client). In CI this is automatic;
> locally run `cd ../server-shared && pnpm install && pnpm prisma:generate &&
> pnpm build` before building this service.

## Dependencies

The service declares (in `package.json`):

- `@nestjs/graphql` + `@nestjs/apollo` — GraphQL schema generation + Apollo.
- `@nestjs/*` — the NestJS runtime (common, core, config, platform-express, swagger, terminus).
- `@jrumandal/shared` — shared config / Prisma / health / logging (workspace dep).
- `graphql` — the GraphQL runtime.
