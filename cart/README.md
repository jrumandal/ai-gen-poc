# `@jrumandal/cart` — Cart Micro-Frontend

React 19 micro-frontend for the multi-framework micro-frontend reference
architecture. Built with **Vite 6** and published to **GitHub Packages** as an
IIFE bundle (`dist/cart.iife.js`) that the shell mounts into the page.

> **Status:** Phase A scaffold (placeholder UI). Phase C ports the full cart
> feature and applies the Tailwind v4 + `@jrumandal/design-tokens` redesign.

## Stack

| Concern    | Choice                          |
| ---------- | ------------------------------- |
| Framework  | React 19                        |
| Build      | Vite 6 (library mode, IIFE)     |
| Tests      | Vitest + Testing Library + jsdom|
| Lint       | ESLint 9 (flat) + typescript-eslint + eslint-plugin-react |
| Types      | TypeScript 5.9                  |
| Styling    | Tailwind v4 (via `@jrumandal/design-tokens`) |

## Shared dependencies

This repo consumes the shared libraries published from the `shared` repo:

- `@jrumandal/contracts` — typed API contracts
- `@jrumandal/design-tokens` — Tailwind v4 theme + design tokens
- `@jrumandal/event-bus` — cross-MF event bus

These are resolved from the GitHub Packages registry (see `.npmrc`).

## Development

```bash
pnpm install
pnpm dev        # watch build
pnpm test       # vitest
pnpm lint
pnpm typecheck
pnpm build      # emits dist/cart.iife.js
```

## Publishing

`pnpm publish` (or the CI `publish` job) publishes `@jrumandal/cart` to GitHub
Packages. The shell consumes it as a versioned dependency.

## Repository layout

```
cart/
├── src/
│   ├── index.tsx      # entry: mount() + re-exports
│   └── cart.tsx       # cart component (placeholder)
├── test/
│   └── cart.test.tsx  # vitest + Testing Library
├── vite.config.ts
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```
