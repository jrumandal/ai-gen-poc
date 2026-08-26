# @shared/event-bus

Typed cross-MF event contract.

- **Event names + payload types** — `event-contract.ts` (pure types).
- **`EventBus<E>`** — thin typed wrapper over the native `CustomEvent` API
  (`emit` / `on` / `once` / `off`).
- **`defaultEventBus`** — the shared workspace-wide singleton every MF imports.

## Usage

```ts
import { defaultEventBus, CartEvent } from '@shared/event-bus';

defaultEventBus.on(CartEvent['cart:updated'], (payload) => {
  console.log(payload.itemCount);
});

defaultEventBus.emit(CartEvent['cart:updated'], {
  itemCount: 2,
  subtotal: { amount: 40, currency: 'USD' },
});
```

## Why a shared bus?

Micro-frontends must not import each other. They communicate through this
contract-only event bus, so the catalog MF can notify the cart MF (and the
shell) of `cart:updated` without any direct coupling.
