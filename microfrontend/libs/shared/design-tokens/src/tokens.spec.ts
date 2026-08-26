import { cssVar, Tokens } from './tokens';

describe('design tokens', () => {
  it('exposes grouped token names', () => {
    expect(Tokens.color.brand500).toBe('--color-brand-500');
    expect(Tokens.space.s4).toBe('--space-4');
    expect(Tokens.radius.md).toBe('--radius-md');
  });

  it('cssVar wraps a token in var()', () => {
    expect(cssVar(Tokens.color.textPrimary)).toBe('var(--color-text-primary)');
  });
});
