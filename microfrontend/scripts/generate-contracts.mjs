#!/usr/bin/env node
/**
 * Generates TypeScript types from the OpenAPI specs in `openapi/`
 * into `libs/shared/contracts/src/generated/`.
 *
 *   node scripts/generate-contracts.mjs
 *
 * The generated files are committed to the repo so consumers of
 * `@shared/contracts` don't need a code-generation step. Re-run this
 * script whenever a spec in `openapi/` changes.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseYaml } from '@redocly/openapi-core';
import openapiTS, { astToString } from 'openapi-typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const specsDir = join(root, 'openapi');
const outDir = join(root, 'libs', 'shared', 'contracts', 'src', 'generated');

const SPECS = [
  { file: 'catalog.yaml', out: 'catalog.ts' },
  { file: 'cart.yaml', out: 'cart.ts' },
  { file: 'user.yaml', out: 'user.ts' },
];

function banner(file) {
  return [
    '/**',
    ' * AUTO-GENERATED FILE — DO NOT EDIT BY HAND.',
    ` * Generated from openapi/${file} by scripts/generate-contracts.mjs`,
    ' * Run `node scripts/generate-contracts.mjs` to regenerate.',
    ' */',
    '',
  ].join('\n');
}

mkdirSync(outDir, { recursive: true });

for (const { file, out } of SPECS) {
  const raw = readFileSync(join(specsDir, file), 'utf8');
  const spec = parseYaml(raw);
  const ast = await openapiTS(spec);
  const types = astToString(ast);
  writeFileSync(join(outDir, out), banner(file) + types);
  console.log(`generated libs/shared/contracts/src/generated/${out} from openapi/${file}`);
}
