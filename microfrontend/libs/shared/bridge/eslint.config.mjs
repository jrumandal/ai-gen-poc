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
          // `@capacitor/core` is a legitimate runtime dependency: it installs the
          // `window.Capacitor` global that the bridge adapter relies on, but it is
          // intentionally NOT directly imported (the bridge uses the global + the
          // on-demand `@capacitor/camera` plugin). Tell the rule not to flag it as
          // an obsolete/unused dependency.
          ignoredDependencies: ['@capacitor/core'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
