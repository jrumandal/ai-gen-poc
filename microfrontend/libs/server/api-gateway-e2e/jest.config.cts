export default {
  displayName: 'api-gateway-e2e',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@server/api-gateway$':
      '<rootDir>/../../../apps/api-gateway/src/app/gateway/gateway.service.ts',
  },
  coverageDirectory: '../../../coverage/libs/server/api-gateway-e2e',
  testTimeout: 30000,
};
