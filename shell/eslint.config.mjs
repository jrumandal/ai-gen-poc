// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import aef from 'angular-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'angular.json'],
  },
  js.configs.recommended,
  // TypeScript rules — scoped to **/*.ts so they do NOT apply to the virtual
  // `.html` files produced by the inline-template processor below.
  ...tseslint.configs.recommended.map((c) => ({ files: ['**/*.ts'], ...c })),
  // Angular TypeScript rules — scoped to **/*.ts (NOT all files), with the
  // inline-template processor so inline templates in .ts files are extracted
  // and linted as Angular templates.
  ...aef.configs.tsRecommended.map((c) => ({ files: ['**/*.ts'], ...c })),
  {
    files: ['**/*.ts'],
    processor: aef.processInlineTemplates,
    plugins: { '@angular-eslint': aef.tsPlugin },
  },
  // Angular template rules — scoped to **/*.html only (extracted inline
  // templates are handled by the processor above).
  {
    files: ['**/*.html'],
    extends: [
      ...aef.configs.templateRecommended,
      ...aef.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    // Node-based scripts (server entry, jest config, etc.)
    files: ['**/*.mjs', '**/*.cts', '**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
);
