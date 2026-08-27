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
          // `tslib` is a compile-time helper (importHelpers); `react` and
          // `react-dom` are peer dependencies provided by the host shell.
          ignoredDependencies: ['tslib', 'react', 'react-dom'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
