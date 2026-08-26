/**
 * Design token names as a typed constant.
 *
 * Use these in inline styles / JS-driven CSS to avoid hard-coded property
 * strings and get autocomplete + rename safety across all frameworks:
 *
 *   el.style.color = `var(${Tokens.color.textPrimary})`;
 */
export const Tokens = {
  color: {
    brand50: '--color-brand-50',
    brand100: '--color-brand-100',
    brand500: '--color-brand-500',
    brand600: '--color-brand-600',
    brand700: '--color-brand-700',
    textPrimary: '--color-text-primary',
    textSecondary: '--color-text-secondary',
    textInverse: '--color-text-inverse',
    surface: '--color-surface',
    surfaceSubtle: '--color-surface-subtle',
    border: '--color-border',
    success: '--color-success',
    warning: '--color-warning',
    danger: '--color-danger',
    focusRing: '--color-focus-ring',
  },
  space: {
    s1: '--space-1',
    s2: '--space-2',
    s3: '--space-3',
    s4: '--space-4',
    s5: '--space-5',
    s6: '--space-6',
    s7: '--space-7',
  },
  font: {
    familySans: '--font-family-sans',
    familyMono: '--font-family-mono',
    sizeSm: '--font-size-sm',
    sizeMd: '--font-size-md',
    sizeLg: '--font-size-lg',
    sizeXl: '--font-size-xl',
    size2xl: '--font-size-2xl',
    weightRegular: '--font-weight-regular',
    weightMedium: '--font-weight-medium',
    weightSemibold: '--font-weight-semibold',
    lineHeightTight: '--line-height-tight',
    lineHeightNormal: '--line-height-normal',
  },
  radius: {
    sm: '--radius-sm',
    md: '--radius-md',
    lg: '--radius-lg',
    full: '--radius-full',
  },
  shadow: {
    sm: '--shadow-sm',
    md: '--shadow-md',
    lg: '--shadow-lg',
  },
  duration: {
    fast: '--duration-fast',
    base: '--duration-base',
    slow: '--duration-slow',
  },
  layout: {
    maxWidth: '--layout-max-width',
    gutter: '--layout-gutter',
  },
} as const;

export type TokenGroup = keyof typeof Tokens;
export type TokenName = (typeof Tokens)[TokenGroup][keyof (typeof Tokens)[TokenGroup]];

/** Convenience: `var(--color-brand-500)` */
export function cssVar(name: string): string {
  return `var(${name})`;
}
