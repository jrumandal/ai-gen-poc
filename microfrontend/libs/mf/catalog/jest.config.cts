module.exports = {
  displayName: 'catalog-mf',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.mjs$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // Angular ships ESM-only (.mjs) packages; let Jest transform them to CJS.
  // pnpm stores real packages under node_modules/.pnpm/<name>@<ver>/, so key
  // the exception off the .pnpm segment (scoped names use "+" for "/").
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(@angular\\+|rxjs@|zone\\.js@|tslib@))',
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  moduleNameMapper: {
    '^@shared/design-tokens$': '<rootDir>/../../shared/design-tokens/src/index.ts',
    '^@shared/event-bus$': '<rootDir>/../../shared/event-bus/src/index.ts',
    '^@shared/contracts$': '<rootDir>/../../shared/contracts/src/index.ts',
  },
  coverageDirectory: '../../../coverage/libs/mf/catalog',
};
