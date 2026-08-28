# @mf/cart — React micro-frontend

The **cart** micro-frontend, written in **React 19** and exposed as the
`<cart-mf>` Web Component. It renders a cart line-item list with quantity
controls and a subtotal. It is the reference for the **React custom-element**
track of Phase 2.

## Public API (`src/index.ts`)

| Export | Kind | Purpose |
| --- | --- | --- |
| `Cart` | React component | The presentational component (direct use / tests). |
| `CartProps` | type | Props accepted by `Cart` / `render`. |
| `formatMoney`, `lineTotal` | helpers | Money formatting + line-total math. |
| `CartElement` | `HTMLElement` subclass | The `<cart-mf>` custom element (light-DOM `createRoot`). |
| `render(props)` | `(props) => string` | **SSR entry** — `react-dom/server` `renderToString` (synchronous). |
| `register()` | `async () => Promise<void>` | **Client entry** — defines `<cart-mf>` (idempotent). |
| `hydrate(options?)` | `async () => Promise<void>` | **Client entry** — registers + attaches the shared event bus. |

## How it works

- **Custom element** — `cart-element.tsx` defines `CartElement extends
  HTMLElement`. It renders the React `Cart` into the element's **light DOM** via
  `createRoot` (no Shadow DOM), so the shell's global styles and design tokens
  apply.
- **Props / attributes** — the cart model is set via the `cart` property or the
  `data-cart` JSON attribute (`observedAttributes = ['data-cart']`). Action
  callbacks (`onAddItem`, `onRemoveItem`, `onUpdateQuantity`, `onClearCart`) are
  wired by the host shell to its GraphQL data layer.
- **SSR** — `ssr.tsx` uses `react-dom/server`'s `renderToString` (synchronous,
  returns the `<section class="cart-mf">…</section>` markup).
- **Hydration** — on `connectedCallback`, if the element already contains SSR
  markup it calls `hydrateRoot` (attaches React handlers without re-rendering);
  otherwise it renders fresh with `createRoot`. `hydrate.ts` registers the
  element and attaches the shared `EventBus`.
- **Events** — emits `cart:updated` on the shared bus when items change.

## Shared contracts consumed

- `@shared/contracts` — `Cart`, `CartItem` types (type-only).
- `@shared/design-tokens` — `cssVar`, `Tokens` for styling.
- `@shared/event-bus` — `EventBus`, `MFEventMap`, `CartEvent`.

## Build & test

```bash
nx build cart-mf   # @nx/js:tsc (ESM) → dist/libs/mf/cart
nx test cart-mf    # Jest (SSR-string + custom-element JSDOM tests)
nx lint cart-mf
```

> **Externalization:** `react` / `react-dom` are `peerDependencies`; `@shared/*`
> are `workspace:*` deps resolved via `tsconfig.lib.json` `paths` → `dist`.
