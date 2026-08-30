module.exports = {
  displayName: 'shared',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // This library currently has no spec files; pass so `nx test shared`
  // (and `pnpm test:all`) succeeds instead of failing with "No tests found".
  passWithNoTests: true,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/server/shared'
};
