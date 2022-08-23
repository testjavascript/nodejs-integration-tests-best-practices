const { Verifier } = require('@pact-foundation/pact');
const opts = {
  ...
};

new Verifier(opts).verifyProvider().then(function () {
    // do something
});