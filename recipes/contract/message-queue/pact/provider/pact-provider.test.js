const { MessageProviderPact, Interaction } = require('@pact-foundation/pact');
const { factorUserDeletedMessage } = require('./user-deleted-message-factory');

describe('User deleted message publishing', () => {
  const PACTSchemaVerifier = new MessageProviderPact({
    provider: 'user-service',
    pactBrokerUrl: 'http://localhost:9292',
    messageProviders: {
      'A user was deleted event': () => {
        return factorUserDeletedMessage(1, new Date(),
         'user-request');
      },
    },
  })

  test(`When publishing user deleted message, then schema matches 
  consumers expectations`, async () => {
    await PACTSchemaVerifier.verify();
  });
});
