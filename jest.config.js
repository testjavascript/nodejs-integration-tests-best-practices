module.exports = {
  verbose: false,
  testMatch: [
    '**/test/**/*test*.js',
    '**/*test*.js',
    '!**/mocha/**',
    '!**/playground/**',
    '!**/*test-helper*',
    '!**/*anti-pattern*', // Uncomment this only when you want to inspect the consequences of anti-patterns
    '!**/*performance*', //Uncomment this only when you want to inspect the performance of tests
  ],
  collectCoverage: false,
  coverageReporters: ['text-summary', 'lcov'],
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/test/**'],
  forceExit: true,
  testEnvironment: 'node',
  notify: true,
  globalSetup: './example-application/test/global-setup.js',
  globalTeardown: './example-application/test/global-teardown.js',
  notifyMode: 'change',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    [
      'jest-watch-repeat',
      {
        key: 'r',
        prompt: 'repeat test runs.',
      },
    ],
    [
      'jest-watch-suspend',
      {
        key: 's',
        prompt: 'suspend watch mode',
      },
    ],
    'jest-watch-master',
    [
      'jest-watch-toggle-config',
      {
        setting: 'verbose',
      },
    ],
    [
      'jest-watch-toggle-config',
      {
        setting: 'collectCoverage',
      },
    ],
  ],
};
