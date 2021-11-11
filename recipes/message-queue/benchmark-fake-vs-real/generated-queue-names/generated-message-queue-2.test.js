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

let axiosAPIClient, mqClient, deleteOrderPerTestQueue, generatedQueueName;

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

  // TODO: I don't like this global initialization

  mqClient = new messageQueueClient(amqplib);
  await mqClient.assertExchange('order.events', 'topic');
});

beforeEach(async () => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mail.com').post('/send').reply(202);

  generatedQueueName = undefined;
});

afterEach(async () => {
  const failedExpectations = jasmine.currentTest.failedExpectations;

  // If not test passed and the generated queue was created than delete the queue
  if (failedExpectations.length === 0 && generatedQueueName) {
    await mqClient
      .deleteQueue(generatedQueueName)
      // Don't wanna throw as we want to continue the test cleanup
      .catch(() =>
        console.log(
          'Failed to delete queue of successful test, queue name:',
          generatedQueueName
        )
      );
  } else if (generatedQueueName) {
    console.log(
      'Queue that was involved with the failed test called:',
      generatedQueueName
    );
  }

  nock.cleanAll();
  sinon.restore();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  // await mqClient.close();
  nock.enableNetConnect();
});

for (let i = 0; i < 10; i++) {
  test(`#${i} When a message is valid, than it should be ack-ed ${testHelpers.getShortUnique()}`, async () => {
    // Arrange
    const addedOrderId = await testHelpers.addNewOrder(axiosAPIClient);

    deleteOrderPerTestQueue = await testHelpers.createQueueForTest({
      mqClient,
      exchangeName: 'user-events',
      queueName: 'user-deleted',
      bindingPattern: 'user.deleted',
    });

    // Save the generated queue name for later cleanup
    generatedQueueName = deleteOrderPerTestQueue.queueName;

    await testHelpers.startMQSubscriber(
      'real',
      deleteOrderPerTestQueue.queueName,
      undefined,
      mqClient
    );

    // Act
    await mqClient.publish(
      deleteOrderPerTestQueue.exchangeName,
      'user.deleted',
      { id: addedOrderId }
    );

    // Assert
    await mqClient.waitFor('ack', 1);
  });
}
