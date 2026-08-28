# `@server/api-gateway-e2e`

End-to-end test suite for the **`api-gateway`** (`apps/api-gateway`). It proves the
gateway's core job — **stitching the three upstream GraphQL services into one schema
and delegating cross-service queries** — without needing a real database or the real
services running.

## What it verifies

- The gateway **introspects** each upstream service (catalog / cart / user) and
  **stitches** their schemas into a single merged schema.
- A **single cross-service query** (products + cart + user in one request) resolves
  correctly, with each field delegated to the right upstream over HTTP.
- A **single-entity query** (`product(id)`) resolves correctly.

## Approach

The e2e does **not** boot the full `AppModule` (that would instantiate `PrismaService`
and require a live DB). Instead it:

1. **Boots three mock upstream services** (`src/support/mock-services.ts`) — plain
   `http.createServer` + `graphql` (no NestJS) — each serving a small schema:
   - `catalog-svc` → `products`, `product(id)` (port **4101**)
   - `cart-svc` → `cart(cartId)` (port **4102**)
   - `user-svc` → `me` (port **4103**)

   Ports are **4101/4102/4103** (not the real 4001/4002/4003) to avoid colliding with
   any real services.

2. **Instantiates `GatewayService` directly** and calls `onModuleInit()`, which
   introspects the three mock endpoints, wraps each with `buildHTTPExecutor`, and
   stitches the merged schema.

3. **Runs GraphQL queries in-process** against `gatewayService.schema`. The gateway
   delegates each field to the mocks over real HTTP, so the full
   introspect → wrap → stitch → delegate path is exercised.

`GATEWAY_SERVICES` is set to the mock endpoints **before** `onModuleInit()` so the
gateway resolves the mocks instead of the default `localhost:4001/4002/4003`.

## Dependency note (pnpm strictness)

The e2e's own files import only `graphql` and `reflect-metadata` (declared in this
package's `package.json`). `GatewayService`'s own imports (`@graphql-tools/*`,
`@nestjs/*`) resolve from **`apps/api-gateway`'s** `package.json`, because pnpm
resolves a module from the **importing file's** location. This keeps the e2e's
dependency surface minimal while still importing the gateway source.

## Run

```bash
npx nx e2e api-gateway-e2e
```

## Files

| File | Purpose |
| --- | --- |
| `src/api-gateway/api-gateway.spec.ts` | The stitching e2e (cross-service + single-entity queries) |
| `src/support/mock-services.ts` | Mock catalog/cart/user GraphQL services (raw `http` + `graphql`) |
| `jest.config.cts` | Jest config (node env, ts-jest, 30s timeout) |
| `project.json` | Nx project (`e2e` target, `implicitDependencies: [api-gateway]`) |
