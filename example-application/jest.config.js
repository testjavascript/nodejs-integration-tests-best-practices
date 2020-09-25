module.exports = {
  verbose: false,
  testMatch: ['**/test/*test*.js', '!**/playground/**', '!**/stryker-tmp/**'],
  collectCoverage: false,
  // reporters: [
  //   ["jest-silent-reporter", {
  //     "useDots": false
  //   }]
  // ],
  coverageReporters: ['text-summary', 'lcov'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  forceExit: true,
  testEnvironment: 'node',
  notify: true,
  globalSetup: './src/test/global-setup.js',
  globalTeardown: './src/test/global-teardown.js',
  notifyMode: 'change',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    ['jest-watch-repeat', {
      key: 'r',
      prompt: 'repeat test runs.',
    }],
    'jest-watch-master',
    ['jest-watch-toggle-config', {
      setting: 'verbose',
    }],
    ['jest-watch-toggle-config', {
      setting: 'collectCoverage',
    }],
  ],
};
