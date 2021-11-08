const {
  MessageConsumerPact,
  Matchers,
  asynchronousBodyHandler
} = require('@pact-foundation/pact');
const path = require('path');
const handler = require('./delivery-service-handler');

describe('message consumer', () => {
  const messagePact = new MessageConsumerPact({
    consumer: 'delivery-service',
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
        item: Matchers.like(1),
      })
      .withMetadata({
        'content-type': 'application/json',
      })
      // .verify(asynchronousBodyHandler(handler));
      .verify(asynchronousBodyHandler((message) => {}));
  });
});
