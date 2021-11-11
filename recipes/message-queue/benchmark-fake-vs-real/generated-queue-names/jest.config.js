module.exports = {
  verbose: false,
  testMatch: ['**/*test*.js', '!**/playground/**', '!**/*test-helper*'],
  collectCoverage: false,
  coverageReporters: ['text-summary', 'lcov'],
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/test/**'],
  forceExit: true,
  testEnvironment: 'node',
  notify: true,
  globalSetup: '../../../../example-application/test/global-setup.js',
  globalTeardown: '../../../../example-application/test/global-teardown.js',

  setupFilesAfterEnv: [
    // This script must be inside `setupFilesAfterEnv` as we need to access the testing framework.
    // Make sure tests can access the `jasmin.currentTest` global variable
    // This is used so we can only delete queues of successful tests
    '../helpers/store-current-spec-result.js',
  ],

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
