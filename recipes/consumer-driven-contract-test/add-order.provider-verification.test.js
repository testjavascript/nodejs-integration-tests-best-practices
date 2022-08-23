const { Verifier } = require('@pact-foundation/pact');
const opts = {
  ...
};

new Verifier(opts).verifyProvider().then(function () {
    // do something
});


providerBaseUrl: 'http://localhost:3001'await new Verifier({
    providerBaseUrl: 'http://localhost:8080',
    pactUrls: [path.resolve(__dirname, './pacts/orderclient-orderapi.json')],
  }).verifyProvider()

  publishVerificationResult: true