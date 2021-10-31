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

let axiosAPIClient, mqClient, activeQueue;

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

  mqClient = new messageQueueClient(amqplib);

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
  console.log('After each about delete queue', activeQueue);

  if (activeQueue) {
    //await mqClient.deleteQueue(activeQueue);
  }
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  //await messageQueueClient.close();
  nock.enableNetConnect();
  done();
});

// Playground
test.skip('playground 2 When a message is poisoned, then its rejected and put back to queue', async () => {
  // Arrange
  const userDeletedQueueName = `user-deleted-${getShortUnique()}`;
  console.time('queue-creation');
  await mqClient.assertQueue(userDeletedQueueName);
  await mqClient.bindQueue(userDeletedQueueName, 'user-events', 'user.deleted');
  console.timeEnd('queue-creation');

  // Act

  console.log('before publish');
  await mqClient.publish('user-events', 'user.deleted', {
    invalidField: 'invalid-value',
  });
  console.log('after publish');

  // Assert
});

test('When a delete message fails ONCE, than thanks to retry the order is deleted', async () => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const addedOrderId = (await axiosAPIClient.post('/order', orderToAdd)).data
    .id;
  console.time('putq');
  activeQueue = `user-deleted-${getShortUnique()}`;
  const exchangeName = `user-events-${getShortUnique()}`;
  mqClient.assertExchange(exchangeName, 'topic');
  await mqClient.assertQueue(activeQueue);
  await mqClient.bindQueue(activeQueue, exchangeName, 'user.deleted');
  const mqClient2 = await testHelpers.startMQSubscriber(activeQueue);
  const waitForAck = once(mqClient2, 'ack');
  const deleteOrderStub = sinon.stub(orderRepository.prototype, 'deleteOrder');
  deleteOrderStub.onFirstCall().rejects(new Error('Cant delete order'));
  orderRepository.prototype.deleteOrder.callThrough();

  // Act
  await mqClient.publish(exchangeName, 'user.deleted', { id: addedOrderId });

  // Assert
  await waitForAck;
  console.timeEnd('putq');
  const aQueryForDeletedOrder = await axiosAPIClient.get(
    `/order/${addedOrderId}`
  );
  expect(aQueryForDeletedOrder.status).toBe(404);
  console.log('final', aQueryForDeletedOrder.status);
});
