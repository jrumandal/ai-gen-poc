# @server/catalog-svc — Catalog domain micro-service

The **catalog-svc** service owns the catalog domain: products and categories,
with filtering, sorting, and attribute lookups. It is a NestJS application that
exposes a **GraphQL** schema (Apollo, via `@nestjs/graphql`) backed by **Prisma**
queries against the shared PostgreSQL database, and also publishes an **OpenAPI**
schema at `/api-docs` for admin/REST fallback.

> **Project name is `catalog-svc`** — see `project.json`.
> **Package name is `@server/catalog-svc`** — see `package.json`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service info (name, status, links). |
| `POST /graphql` | GraphQL endpoint (Playground enabled in dev). |
| `GET /api-docs` | Swagger UI (OpenAPI). |
| `GET /health` | Database ping (via `@server/shared` `HealthModule`). |

Default port: **4001** (override with `PORT`).

## GraphQL schema

Canonical contract: [`graphql/catalog.graphql`](../../../graphql/catalog.graphql).

```graphql
type Query {
  products(input: ProductFilterInput): [Product!]!
  product(id: ID!): Product
  categories: [Category!]!
}

type Product {
  id: ID!
  name: String!
  description: String
  price: Money!
  imageUrl: String
  inStock: Boolean!
  categories: [Category!]!
  attributes: [ProductAttribute!]!
}

type Category {
  id: ID!
  name: String!
  slug: String!
  parentId: ID
  children: [Category!]!
}

type ProductAttribute {
  name: String!
  value: String!
}

type Money {
  amount: Int!
  currency: String!
}

enum ProductSort {
  PRICE_ASC
  PRICE_DESC
  NAME_ASC
  NAME_DESC
}

input ProductFilterInput {
  category: String
  minPrice: Int
  maxPrice: Int
  inStock: Boolean
  sort: ProductSort
  search: String
}
```

## Resolvers

`CatalogResolver` (`src/app/resolvers/catalog.resolver.ts`) is backed by
`PrismaService` from `@server/shared`:

- **`products(input)`** — lists products with optional filtering (search,
  category, stock, price range) and sorting. Builds a Prisma `where`/`orderBy`
  from the `ProductFilterInput` input. Includes `categories { category }` and
  `attributes`.
- **`product(id)`** — fetches a single product by id, or `null`.
- **`categories`** — lists all categories with their parent/children tree.

Money is always integer minor units (cents) + `currency` — never a float.

### Enum

**`ProductSort`** (`src/app/dto/product-sort.enum.ts`) is a TS enum registered
with `registerEnumType(ProductSort, { name: 'ProductSort' })`.

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
npx nx build catalog-svc   # webpack-cli build → dist/libs/server/catalog-svc
npx nx test catalog-svc
npx nx lint catalog-svc
npx nx serve catalog-svc   # development (NODE_ENV=development)
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
