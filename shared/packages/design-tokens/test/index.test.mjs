import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tokens, cssVar } from '../src/index.ts';

test('Tokens exposes the full token map', () => {
  assert.equal(Tokens.color.brand500, '--color-brand-500');
  assert.equal(Tokens.space.s4, '--space-4');
  assert.equal(Tokens.radius.md, '--radius-md');
  assert.equal(Tokens.font.familySans, '--font-family-sans');
});

test('cssVar wraps a token name in var()', () => {
  assert.equal(cssVar(Tokens.color.textPrimary), 'var(--color-text-primary)');
});
