const publisher = require('@pact-foundation/pact-node');
const path = require('path');

const opts = {
  pactFilesOrDirs: [
    path.resolve(
      process.cwd(),
      'recipes',
      'contract',
      'message-queue',
      'pact',
      'pacts'
    ),
  ],
  pactBroker: 'http://localhost:9292',
  pactBrokerUsername: process.env.PACT_USERNAME,
  pactBrokerPassword: process.env.PACT_PASSWORD,
  consumerVersion: '1',
  tags: ['main'],
};

publisher
  .publishPacts(opts)
  .then(() => console.log('Pacts successfully published'));
