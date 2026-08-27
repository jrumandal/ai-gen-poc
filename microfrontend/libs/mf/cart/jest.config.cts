module.exports = {
  displayName: 'cart-mf',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.mjs$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // React 19 ships ESM-only packages; let Jest transform them to CJS.
  // pnpm stores real packages under node_modules/.pnpm/<name>@<ver>/, so key
  // the exception off the .pnpm segment (scoped names use "+" for "/").
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(@react\\+|react-dom@|react@|scheduler@|tslib@))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'html'],
  moduleNameMapper: {
    '^@shared/design-tokens$': '<rootDir>/../../shared/design-tokens/src/index.ts',
    '^@shared/event-bus$': '<rootDir>/../../shared/event-bus/src/index.ts',
    '^@shared/contracts$': '<rootDir>/../../shared/contracts/src/index.ts',
  },
  coverageDirectory: '../../../coverage/libs/mf/cart',
};
