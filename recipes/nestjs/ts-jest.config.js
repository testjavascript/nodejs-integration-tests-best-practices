const config = require('../../jest.config');

module.exports = {
  ...config,
  testMatch: [
    '**/*.test.ts',
  ],
  preset:  'ts-jest',
  rootDir: '../../',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'recipes/nestjs/tsconfig.json'
    }
  }
};