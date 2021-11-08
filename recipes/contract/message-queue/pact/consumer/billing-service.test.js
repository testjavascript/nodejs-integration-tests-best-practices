const {
  MessageConsumerPact,
  Matchers,
  asynchronousBodyHandler
} = require('@pact-foundation/pact');
const path = require('path');
const handler = require('./billing-service-handler');

describe('message consumer', () => {
  const messagePact = new MessageConsumerPact({
    consumer: 'billing-service',
    provider: 'order-service',
    dir: path.resolve(process.cwd(), 'recipes', 'contract', 'message-queue', 'pact', 'pacts'),
    pactfileWriteMode: 'update',
    logLevel: 'info',
  });

  test('should accept a valid created order message', async () => {
    await messagePact
      .expectsToReceive('a new order created')
      .withContent({
        order: Matchers.like(1),
        user: Matchers.like(1),
      })
      .withMetadata({
        'content-type': 'application/json',
      })
      .verify(asynchronousBodyHandler(handler));
  });
});
