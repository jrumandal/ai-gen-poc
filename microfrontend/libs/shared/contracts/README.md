# @shared/contracts — API contracts & generated types

The **contracts** library is the single source of truth for the API surface
shared by the micro-frontends, the shell, and the NestJS services. It contains
**generated TypeScript types** (committed) plus a small ergonomic layer over
them.

> **Project name is `contracts`** (not `shared-contracts`) — see `project.json`.

## What's inside

| File | Purpose |
| --- | --- |
| `src/index.ts` | Public entry — re-exports `./api` and `./clients`. |
| `src/api.ts` | Ergonomic type re-exports (`Money`, `Product`, `Cart`, `User`, …) + `catalog`/`cart`/`user` namespaces over the raw generated docs. |
| `src/clients.ts` | `createContractClients(baseUrls)` — typed `openapi-fetch` clients for REST. |
| `src/generated/graphql.ts` | **Generated** — GraphQL types from `graphql/gateway.graphql`. |
| `src/generated/catalog.ts` | **Generated** — OpenAPI types from `openapi/catalog.yaml`. |
| `src/generated/cart.ts` | **Generated** — OpenAPI types from `openapi/cart.yaml`. |
| `src/generated/user.ts` | **Generated** — OpenAPI types from `openapi/user.yaml`. |

The `src/generated/*` files are **auto-generated and committed** so consumers
don't need a codegen step. Re-run the generators when a spec changes.

## Generation pipeline

| Target | Command | Source → Output |
| --- | --- | --- |
| `generate:graphql` | `nx run contracts:generate:graphql` | `graphql/gateway.graphql` → `src/generated/graphql.ts` (graphql-codegen, `codegen.mjs`) |
| `generate:api` | `nx run contracts:generate:api` | `openapi/{catalog,cart,user}.yaml` → `src/generated/{catalog,cart,user}.ts` (`scripts/generate-contracts.mjs`, openapi-typescript) |

```bash
nx run contracts:generate:graphql   # regenerate GraphQL types
nx run contracts:generate:api       # regenerate OpenAPI types
nx build contracts                  # @nx/js:tsc → dist/libs/shared/contracts
nx test contracts
```

## Usage

```ts
import type { Product, Cart, User, Money } from '@shared/contracts';
import { createContractClients } from '@shared/contracts';

// Typed REST clients (openapi-fetch)
const { catalog, cart, user } = createContractClients({
  catalog: 'http://localhost:4001',
  cart: 'http://localhost:4002',
  user: 'http://localhost:4003',
});
```

## Conventions

- **Money** is always `{ amount: number (minor units/cents), currency: string }`
  — never a float.
- **GraphQL** is the primary integration contract (Apollo Federation); the
  OpenAPI docs are the REST mirror used for typed clients and contract tests.
- Types are **type-only** imports in consumers to keep the runtime bundle lean.
