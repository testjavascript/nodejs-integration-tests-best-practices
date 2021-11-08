const { MessageProviderPact, Interaction } = require('@pact-foundation/pact');
const newOrderCreatedEvent = require('./new-order-event');

describe('message producer', () => {
  const messagePact = new MessageProviderPact({
    messageProviders: {
      // 'a new order created': () => newOrderCreatedEvent(1, 1, 1, 'created')
      'a new order created': () => Promise.resolve({ order: 1, user: 1, item: 1 })
    },
    provider: 'order-service',
    pactBrokerUrl: 'http://localhost:9292',
    publishVerificationResult: true,
    providerVersion: '1',
    includeWipPactsSince: '2021-11-06',
    enablePending: false
  });

  test('should create a valid order created message', async () => {
    console.log(await messagePact.verify());
  });
});
