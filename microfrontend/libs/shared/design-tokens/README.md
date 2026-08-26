# @shared/design-tokens

Shared design tokens for every micro-frontend.

- **`tokens.css`** — CSS custom properties (color, spacing, type, shape,
  elevation, motion, layout) + a `[data-theme="dark"]` override.
- **`tokens.ts`** — typed token names (`Tokens.color.brand500`) and a
  `cssVar()` helper for JS-driven styling.

## Usage

```css
/* shell root (once) */
@import "@shared/design-tokens/tokens.css";

.button {
  background: var(--color-brand-600);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
}
```

```ts
import { cssVar, Tokens } from '@shared/design-tokens';

el.style.color = cssVar(Tokens.color.textPrimary);
```
