# `shared` — Shared Libraries

Shared, framework-agnostic libraries consumed by every other repository in the
micro-frontend platform. This repo is the **foundation** of the dependency graph:
it is built and published first, and all micro-frontends, the shell, and the
services depend on its packages.

## Packages

| Package | Description |
| --- | --- |
| `@jrumandal/design-tokens` | Design tokens: typed `Tokens` const + `cssVar()` helper, and `tokens.css` (CSS variables + dark theme). The shell maps these into Tailwind v4 via `@theme inline`. |
| `@jrumandal/contracts` | Typed API contracts (OpenAPI + GraphQL) shared by clients and services. |
| `@jrumandal/event-bus` | Framework-agnostic event bus for cross-MF communication. |
| `@jrumandal/bridge` | Web-component bridge / host utilities used by the shell and MFs. |

## Repository layout

```
shared/
├── .github/workflows/ci.yml   # lint → typecheck → test → build → publish
├── .npmrc                     # @jrumandal / @mf → GitHub Packages
├── .nvmrc                     # Node 22
├── eslint.config.mjs          # flat ESLint 9 config
├── package.json               # workspace root (private)
├── pnpm-workspace.yaml        # packages/*
├── scripts/publish.mjs        # auto-increment publish to GitHub Packages
├── tsconfig.base.json
└── packages/
    ├── design-tokens/
    ├── contracts/
    ├── event-bus/
    └── bridge/
```

## Toolchain (pinned)

| Tool | Version |
| --- | --- |
| Node | 22 LTS |
| pnpm | 11.24.0 |
| TypeScript | 5.9.x |
| ESLint | 9.39.5 |

## Local development

```bash
nvm use            # Node 22
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Publishing

Publishing is automated: on every push to `main`, after CI is green, the
`publish` job runs `scripts/publish.mjs`, which:

1. Enumerates `packages/*` (skipping `private: true`).
2. Queries GitHub Packages for the highest published version.
3. Bumps the **patch** segment (auto-increment — safe for "publish on every push").
4. Runs `npm publish --access public` against `npm.pkg.github.com`.

Auth comes from the `NPM_TOKEN` repo secret (a PAT with `read:packages` +
`write:packages`). Locally, auth is read from your global `~/.npmrc`.

### Consumers

Other repos install these as versioned dependencies:

```jsonc
// .npmrc
@jrumandal:registry=https://npm.pkg.github.com/
```

```jsonc
// package.json
{ "dependencies": { "@jrumandal/design-tokens": "^0.0.1" } }
```

## Dependency graph

```
        ┌────────────────────────────┐
        │         shared (this)      │
        │ design-tokens · contracts  │
        │ event-bus · bridge         │
        └──────────────┬─────────────┘
                       │ published to GitHub Packages
      ┌────────────────┼────────────────┬───────────────┐
      ▼                ▼                ▼               ▼
   catalog           cart             user          shell / services
```

## CI/CD

- **`ci` job** — lint, typecheck, test, build (runs on PR + push).
- **`publish` job** — publishes to GitHub Packages on `main` push (needs `ci`).
- Tag-based publishing is stubbed (commented) in `ci.yml` for future use.

Cross-repo orchestration (build order, coordinated releases) is handled by the
[`mf-orchestrator`](https://github.com/jrumandal/mf-orchestrator) repo via
`repository_dispatch`.
