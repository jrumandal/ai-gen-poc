import baseConfig from '../../../eslint.config.mjs';
import nxPlugin from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    plugins: {
      '@nx': nxPlugin,
    },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
          // `tslib` is a compile-time helper (importHelpers); `@angular/common`
          // and `rxjs` are transitive peers of `@angular/core`/`@angular/elements`;
          // `@angular/compiler` is imported only in the spec (JIT compiler).
          ignoredDependencies: [
            'tslib',
            '@angular/common',
            'rxjs',
            '@angular/compiler',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
