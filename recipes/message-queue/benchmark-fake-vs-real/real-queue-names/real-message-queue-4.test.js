const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const amqplib = require('amqplib');
const messageQueueClient = require('../../../../example-application/libraries/message-queue-client');
const testHelpers = require('../../test-helpers');

const {
  initializeWebServer,
  stopWebServer,
} = require('../../../../example-application/entry-points/api');

let axiosAPIClient, mqClient;
const QUEUE_NAME = 'user-deleted';

// Type 1:
// Random queue name = multi-process

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };

  axiosAPIClient = axios.create(axiosConfig);
});

beforeEach(async () => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mail.com').post('/send').reply(202);

  // TODO: I don't like this global initialization
  mqClient = new messageQueueClient(amqplib);
  await mqClient.assertExchange('order.events', 'topic');
});

afterEach(async () => {
  nock.cleanAll();
  sinon.restore();

  await mqClient.deleteQueue(QUEUE_NAME);
  await mqClient.close();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
});

for (let i = 0; i < 10; i++) {
  test(`#${i} When a message is valid, than it should be ack-ed ${testHelpers.getShortUnique()}`, async () => {
    // Arrange
    await testHelpers.createQueueForTest({
      mqClient,
      exchangeName: 'user-events',
      queueName: QUEUE_NAME,
      bindingPattern: 'user.deleted',
      randomize: false,
    });

    const addedOrderId = await testHelpers.addNewOrder(axiosAPIClient);

    await testHelpers.startMQSubscriber(
      'real',
      QUEUE_NAME,
      undefined,
      mqClient
    );

    // Act
    await mqClient.publish('user-events', 'user.deleted', {
      id: addedOrderId,
    });

    // Assert
    await mqClient.waitFor('ack', 1);
  });
}
