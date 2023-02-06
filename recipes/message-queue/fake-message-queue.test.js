const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const testHelpers = require('./test-helpers');

const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');
const MessageQueueClient = require('../../example-application/libraries/message-queue-client');
const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');
const {
  QueueConsumer,
} = require('../../example-application/entry-points/message-queue-consumer');

let axiosAPIClient;

beforeAll(async () => {
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

  process.env.USE_FAKE_MQ = 'true';
});

beforeEach(() => {
  nock('http://localhost/user/').get(/\d/).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mail.com').post('/send').reply(202);
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  //await messageQueueClient.close();
  nock.enableNetConnect();
  process.env.USE_FAKE_MQ = undefined;
});

test('When a poisoned message arrives, then it is being rejected back', async () => {
  // Arrange
  const messageWithInvalidSchema = { nonExistingProperty: 'invalid❌' };
  const messageQueueClient = await testHelpers.startMQConsumer('fake');

  // Act
  await messageQueueClient.publish(
    'user.events',
    'user.deleted',
    messageWithInvalidSchema
  );

  // Assert
  await messageQueueClient.waitFor('nack', 1);
});

test('When user deleted message arrives, then all corresponding orders are deleted', async () => {
  // Arrange
  const orderToAdd = { userId: 7, productId: 2, status: 'approved' };
  await axiosAPIClient.post('/order', orderToAdd);
  const messageQueueClient = new MessageQueueClient(
    new FakeMessageQueueProvider()
  );
  await new QueueConsumer(messageQueueClient, 'user.deleted').start();

  // Act
  await messageQueueClient.publish('user.events', 'user.deleted', {
    id: orderToAdd.userId,
  });

  // Assert
  await messageQueueClient.waitFor('ack', 1);
  const aQueryForDeletedOrder = await axiosAPIClient.get(
    `/order/byUserId/${orderToAdd.userId}`
  );
  expect(aQueryForDeletedOrder.data).toMatchObject([]);
});

// ️️️✅ Best Practice: Verify that messages are put in queue whenever the requirements state so
test('When a valid order is added, then a message is emitted to the new-order queue', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const spyOnSendMessage = sinon.spy(MessageQueueClient.prototype, 'publish');

  //Act
  await axiosAPIClient.post('/order', orderToAdd);

  // Assert
  expect(spyOnSendMessage.lastCall.args[0]).toBe('order.events');
  expect(spyOnSendMessage.lastCall.args[1]).toBe('order.events.new');
});

test.todo('When an error occurs, then the message is not acknowledged');
test.todo(
  'When a new valid user-deletion message is processes, then the message is acknowledged'
);
test.todo(
  'When two identical create-order messages arrives, then the app is idempotent and only one is created'
);
test.todo(
  'When occasional failure occur during message processing , then the error is handled appropriately'
);
test.todo(
  'When multiple user deletion message arrives, then all the user orders are deleted'
);
test.todo(
  'When multiple user deletion message arrives and one fails, then only the failed message is not acknowledged'
);
