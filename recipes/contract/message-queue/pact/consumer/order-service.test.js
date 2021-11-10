const {
  MessageConsumerPact,
  Matchers,
  asynchronousBodyHandler,
} = require('@pact-foundation/pact');
const path = require('path');
const handler = require('./order-user-deleted-handler');

describe('user deleted message', () => {
  const messagePact = new MessageConsumerPact({
    consumer: 'order-service',
    provider: 'user-service',
    dir: path.resolve(
      process.cwd(),
      'recipes',
      'contract',
      'message-queue',
      'pact',
      'pacts'
    ),
    pactfileWriteMode: 'update',
    logLevel: 'info',
  });

  test('When user deleted message arrives, then the schema is well formed', async () => {
    await messagePact
      .expectsToReceive('A user was deleted event')
      .withContent({
        userId: Matchers.like(1),
        deletionDate: Matchers.like(new Date()),
        deletionReason: Matchers.like('user-opted-out'),
      })
      .withMetadata({
        authentication: Matchers.like('Bearer some-token-here'),
      })
      .verify(asynchronousBodyHandler(handler));
  });
});
