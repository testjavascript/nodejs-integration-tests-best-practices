const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const { once } = require('events');
const amqplib = require('amqplib');
const messageQueueClient = require('../../example-application/libraries/message-queue-client');
const testHelpers = require('./test-helpers');
const orderRepository = require('../../example-application/data-access/order-repository');

const {
  getNextMQConfirmation,
  startFakeMessageQueue,
  getMQMessageOrTimeout,
  getShortUnique,
} = require('./test-helpers');
const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');

const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');

let axiosAPIClient, mqClient, perTestQueue;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  // TODO: I don't like this global initialization
  mqClient = new messageQueueClient(amqplib);
  mqClient.assertExchange('order.events', 'topic');

  done();
});

beforeEach(async () => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mail.com').post('/send').reply(202);
});

afterEach(async () => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  //await messageQueueClient.close();
  nock.enableNetConnect();
  done();
});

// Playground
test('When a message is poisoned, then its rejected and put back to queue', async () => {
  // Arrange
  perTestQueue = await testHelpers.createQueueForTest(
    'user-events',
    'user-deleted',
    'user.deleted'
  );
  mqClient.setRequeue(false);

  // Act
  await mqClient.publish(perTestQueue.exchangeName, 'user.deleted', {
    invalidField: 'invalid-value',
  });

  // Assert
});

test('When a delete message fails ONCE, than thanks to retry the order is deleted', async () => {
  // Arrange
  const addedOrderId = await testHelpers.addNewOrder(axiosAPIClient);
  perTestQueue = await testHelpers.createQueueForTest(
    'user-events',
    'user-deleted',
    'user.deleted'
  );
  const messageQueueClient = await testHelpers.startMQSubscriber(
    'real',
    perTestQueue.queueName
  );
  const deleteOrderStub = sinon.stub(orderRepository.prototype, 'deleteOrder');
  deleteOrderStub.onFirstCall().rejects(new Error('Cant delete order')); // Fail only once
  orderRepository.prototype.deleteOrder.callThrough(); // Then on retry succeed

  // Act
  await messageQueueClient.publish(perTestQueue.exchangeName, 'user.deleted', {
    id: addedOrderId,
  });

  // Assert
  await messageQueueClient.waitFor('ack', 1);
  const aQueryForDeletedOrder = await axiosAPIClient.get(
    `/order/${addedOrderId}`
  );
  expect(aQueryForDeletedOrder.status).toBe(404);
});

test('When a batch of messages has ONE poisoned message, than only one is rejected (nack)', async () => {
  // Arrange
  const addedOrderId = await testHelpers.addNewOrder(axiosAPIClient);
  perTestQueue = await testHelpers.createQueueForTest(
    'user-events',
    'user-deleted',
    'user.deleted'
  );
  const messageQueueClient = await testHelpers.startMQSubscriber(
    'real',
    perTestQueue.queueName
  );
  const badMessageId = getShortUnique();
  const goodMessageId = getShortUnique();
  messageQueueClient.setRequeue(false);

  // Act
  await messageQueueClient.publish(
    perTestQueue.exchangeName,
    'user.deleted',
    {
      id: addedOrderId,
    },
    { messageId: goodMessageId }
  ); //good message
  await messageQueueClient.publish(
    perTestQueue.exchangeName,
    'user.deleted',
    {
      nonExisting: 'invalid',
    },
    { messageId: badMessageId }
  ); // bad message

  // Assert
  const lastNackEvent = await messageQueueClient.waitFor('nack', 1);
  expect(lastNackEvent.lastEventData.properties.messageId).toBe(badMessageId);
});
