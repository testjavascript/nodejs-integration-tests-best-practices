// Inspired by https://stackoverflow.com/a/62557472/5923666
// Need to know how it gonna work with tests that uses test.concurrent (probably won't work)

// To use this in your tests, just use `jasmine.currentTest`
// DON'T IMPORT THIS FILE from your tests as we don't wanna add another reporter,
// this is being imported in jest.config.js
jasmine.getEnv().addReporter({
  specStarted: (result) => (jasmine.currentTest = result),
});
