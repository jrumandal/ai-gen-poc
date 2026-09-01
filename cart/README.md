# `@mf/cart` — Cart Micro-Frontend

React 19 micro-frontend for the multi-framework micro-frontend reference
architecture. Published to **GitHub Packages** as a **source-only ESM package**
(`main`/`types` → `src/index.ts`) that the shell imports and bundles — the shell
owns the build, so this repo ships TypeScript source, not a pre-bundled IIFE.

> **Status:** Full faithful port of the reference cart feature, styled with
> **Tailwind v4** utility classes driven by the `@jrumandal/design-tokens` design
> system (CSS variables).

## Stack

| Concern    | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | React 19 (peer dependency)                          |
| Module     | Source-only ESM (`src/index.ts`)                    |
| Tests      | Vitest + React Testing Library + jsdom              |
| Lint       | ESLint 9 (flat) + typescript-eslint + eslint-plugin-react |
| Types      | TypeScript 5.9                                      |
| Styling    | Tailwind v4 utility classes (hosted by the shell)   |

## Shared dependencies

This repo consumes the shared libraries published from the `shared` repo:

- `@jrumandal/contracts` — typed API contracts (`Cart`, `CartItem`, `Money`, `MfApolloClient`)
- `@jrumandal/design-tokens` — design tokens (`Tokens`, `cssVar`) + `tokens.css`
- `@jrumandal/event-bus` — cross-MF event bus (`CartEvent`, `defaultEventBus`)

These are resolved from the GitHub Packages registry (see `.npmrc`).

## Public API

```ts
import { register, hydrate, render, Cart, CART_ELEMENT_TAG } from '@mf/cart';

register();            // define <mf-cart> custom element (idempotent)
hydrate();             // hydrate existing <mf-cart> elements
render(props);         // SSR: render to an HTML string
```

The `<mf-cart>` element accepts `data-cart` (JSON) and `data-apollo` (client
handle) attributes and renders the cart with quantity steppers, line totals,
subtotal, and a clear-cart action.

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build     # no-op (source-only package)
```

## Publishing

`pnpm publish` runs `scripts/publish.mjs`, which auto-increments the patch
version and publishes to GitHub Packages (`@mf` scope).
