const path = require('path');

module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: process.env.GITHUB_ACTIONS ? ['lcovonly', 'text'] : ['html', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^@minddocdev/mou-pr-action/(.*)$': '<rootDir>/src/$1',
    '^@minddocdev/mou-pr-action/test/(.*)$': '<rootDir>/test/$1',
  },
  preset: 'ts-jest',
  rootDir: path.resolve(__dirname),
  testEnvironment: require.resolve(`jest-environment-node`),
  testMatch: ['**/*.spec.ts'],
  verbose: true,
};
