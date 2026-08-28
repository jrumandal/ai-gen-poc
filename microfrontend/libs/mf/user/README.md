# @mf/user — Vue micro-frontend

The **user** micro-frontend, written in **Vue 3** and exposed as the `<user-mf>`
Web Component. It renders a sign-in / profile panel. It is the reference for the
**Vue custom-element** track of Phase 2.

## Public API (`src/index.ts`)

| Export | Kind | Purpose |
| --- | --- | --- |
| `UserPanel` | Vue component | The presentational component (direct use / tests). |
| `UserPanelProps` | type | Props accepted by `UserPanel` / `render`. |
| `formatAddress` | helper | Address formatting. |
| `UserElement` | `HTMLElement` subclass | The `<user-mf>` custom element (light-DOM `createApp`). |
| `render(props)` | `async (props) => Promise<string>` | **SSR entry** — `@vue/server-renderer` `renderToString` (async). |
| `register()` | `async () => Promise<void>` | **Client entry** — defines `<user-mf>` (idempotent). |
| `hydrate(options?)` | `async () => Promise<void>` | **Client entry** — registers + attaches the shared event bus. |

## How it works

- **Custom element** — `user-element.ts` defines `UserElement extends
  HTMLElement`. It renders the Vue `UserPanel` into the element's **light DOM**
  via `createApp(UserPanel, props).mount(container)` (no Shadow DOM), so the
  shell's global styles and design tokens apply.
- **Props / attributes** — the user model is set via the `user` property or the
  `data-user` JSON attribute (`observedAttributes = ['data-user']`). Action
  callbacks (`onSignIn`, `onSignOut`, `onUpdateProfile`) are wired by the host
  shell to its GraphQL data layer.
- **SSR** — `ssr.ts` uses `@vue/server-renderer`'s `renderToString`. **Vue's
  `renderToString` is async**, so `render()` returns `Promise<string>`.
- **Hydration** — on `connectedCallback`, if the element already contains SSR
  markup it mounts the Vue app into a fresh child container and removes the
  original server markup (client tree becomes the single source of truth);
  otherwise it renders fresh. `hydrate.ts` registers the element and attaches
  the shared `EventBus`.
- **Events** — emits `user:signedIn` / `user:signedOut` on the shared bus.

## Shared contracts consumed

- `@shared/contracts` — `User`, `LoginInput`, `UpdateProfileInput` types (type-only).
- `@shared/design-tokens` — `cssVar`, `Tokens` for styling.
- `@shared/event-bus` — `EventBus`, `MFEventMap`, `UserEvent`.

## Build & test

```bash
nx build user-mf   # @nx/js:tsc (ESM) → dist/libs/mf/user
nx test user-mf    # Jest (SSR-string + custom-element JSDOM tests)
nx lint user-mf
```

> **Externalization:** `vue` / `@vue/server-renderer` are `peerDependencies`;
> `@shared/*` are `workspace:*` deps resolved via `tsconfig.lib.json` `paths` →
> `dist`.
>
> **Vue `createApp` props cast:** `createApp` expects `Data` (an index-signature
> type); a typed props interface is not assignable, so the props object is cast
> through `unknown` → `props as unknown as Record<string, unknown>` (see
> `user-element.ts` `createAppInstance()` and `ssr.ts`).
