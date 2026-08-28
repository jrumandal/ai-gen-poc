# @server/cart-svc — Cart domain micro-service

The **cart-svc** service owns the cart domain: reading a cart and mutating its
items (add / update / remove / clear). It is a NestJS application that exposes a
**GraphQL** schema (Apollo, via `@nestjs/graphql`) backed by **Prisma** queries
against the shared PostgreSQL database, and also publishes an **OpenAPI**
schema at `/api-docs` for admin/REST fallback.

> **Project name is `cart-svc`** — see `project.json`.
> **Package name is `@server/cart-svc`** — see `package.json`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service info (name, status, links). |
| `POST /graphql` | GraphQL endpoint (Playground enabled in dev). |
| `GET /api-docs` | Swagger UI (OpenAPI). |
| `GET /health` | Database ping (via `@server/shared` `HealthModule`). |

Default port: **4002** (override with `PORT`).

## GraphQL schema

Canonical contract: [`graphql/cart.graphql`](../../../graphql/cart.graphql).

```graphql
type Query {
  cart(cartId: ID!): Cart
}

type Mutation {
  addItemToCart(cartId: ID!, input: AddItemInput!): Cart!
  updateCartItem(cartId: ID!, itemId: ID!, input: UpdateItemInput!): Cart!
  removeItemFromCart(cartId: ID!, itemId: ID!): Cart!
  clearCart(cartId: ID!): Cart!
}

type Cart {
  id: ID!
  items: [CartItem!]!
  subtotal: Money!
  itemCount: Int!
}

type CartItem {
  id: ID!
  productId: ID!
  quantity: Int!
  unitPrice: Money!
  product: ProductRef!
}

type ProductRef {
  id: ID!
  name: String!
  imageUrl: String
}

type Money {
  amount: Int!
  currency: String!
}

input AddItemInput {
  productId: ID!
  quantity: Int!
}

input UpdateItemInput {
  quantity: Int!
}
```

## Resolvers

`CartResolver` (`src/app/resolvers/cart.resolver.ts`) is backed by `PrismaService`
from `@server/shared`:

- **`cart(cartId)`** — `findUnique` with `items { product }` included; returns
  `null` when the cart does not exist.
- **`addItemToCart`** — upserts a `CartItem` on the `(cartId, productId)`
  composite key; increments `quantity` on update, or creates with the product's
  current price/currency.
- **`updateCartItem`** — updates an item's `quantity`.
- **`removeItemFromCart`** — deletes a single item.
- **`clearCart`** — deletes all items in the cart.

`subtotal` is computed as `Σ(quantity × unitPrice)`; `itemCount` as `Σ(quantity)`.
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
npx nx build cart-svc   # webpack-cli build → dist/libs/server/cart-svc
npx nx test cart-svc
npx nx lint cart-svc
npx nx serve cart-svc   # development (NODE_ENV=development)
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
