# @server/user-svc — User domain micro-service

The **user-svc** service owns the user domain: the current user profile,
login/session, and the user's orders. It is a NestJS application that exposes a
**GraphQL** schema (Apollo, via `@nestjs/graphql`) backed by **Prisma** queries
against the shared PostgreSQL database, and also publishes an **OpenAPI**
schema at `/api-docs` for admin/REST fallback.

> **Project name is `user-svc`** — see `project.json`.
> **Package name is `@server/user-svc`** — see `package.json`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service info (name, status, links). |
| `POST /graphql` | GraphQL endpoint (Playground enabled in dev). |
| `GET /api-docs` | Swagger UI (OpenAPI). |
| `GET /health` | Database ping (via `@server/shared` `HealthModule`). |

Default port: **4003** (override with `PORT`).

## GraphQL schema

Canonical contract: [`graphql/user.graphql`](../../../graphql/user.graphql).

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

## Resolvers

`UserResolver` (`src/app/resolvers/user.resolver.ts`) is backed by `PrismaService`
from `@server/shared`:

- **`me`** — resolves the demo user (`demo@example.com`) and returns their
  profile + address, or `null` when not present.
- **`orders`** — lists the demo user's orders (newest first) with their line
  items.
- **`login(input)`** — verifies the email + password (SHA-256 hash compare),
  creates a `Session` (random token, 30-day expiry), and returns the user.
  Throws `404` for an unknown email and `400` for a bad password.
- **`updateProfile(input)`** — updates the demo user's `name` and address.

### Custom scalar & enum

- **`DateTime`** (`src/app/dto/datetime.type.ts`) is a `GraphQLScalarType`
  subclass registered with the `@Scalar('DateTime')` class decorator. It
  serializes/parses ISO 8601 strings.
- **`OrderStatus`** (`src/app/dto/order-status.enum.ts`) is a TS enum registered
  with `registerEnumType(OrderStatus, { name: 'OrderStatus' })`.

Money is always integer minor units (cents) + `currency` — never a float.

## Consuming `@server/shared`

`app.module.ts` imports `AppConfigModule`, `SharedModule`, and `HealthModule`
from `@server/shared`; `main.ts` applies the global `AllExceptionsFilter` and
`LoggingInterceptor`. This gives the service, for free:

- `GET /health` — database ping (terminus)
- structured request logging
- a consistent error envelope for every exception

### webpack `resolve.alias` gotcha

`@server/shared`'s `package.json` `main` points at `./src/index.js`, which does
not exist until the consumer's own build runs. Nx 23's webpack resolves the
`node_modules` symlink *before* the tsconfig-paths fallback, so this service
declares an explicit alias in `webpack.config.js`:

```js
resolve: {
  alias: {
    '@server/shared': join(__dirname, '../shared/src/index.ts'),
  },
},
```

## Build & test

```bash
npx nx build user-svc   # webpack-cli build → dist/libs/server/user-svc
npx nx test user-svc
npx nx lint user-svc
npx nx serve user-svc   # development (NODE_ENV=development)
```

## Prisma client generation

`@prisma/client` is a transitive dependency (via `@server/shared`). pnpm 11
blocks postinstall build scripts by default, so after any `pnpm install` you
must generate the client manually:

```bash
npx prisma generate
```

All services resolve `@prisma/client` to the **same** generated copy, so a
single `prisma generate` covers them all.
