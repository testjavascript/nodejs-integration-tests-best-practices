const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const { once } = require('events');
const {
  getNextMQConfirmation,
  startFakeMessageQueue,
} = require('./test-helpers');
const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');

const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');

let expressApp;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

beforeEach(() => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mail.com').post('/send').reply(202);
});

afterEach(() => {
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

// ️️️✅ Best Practice: Test a flow that starts via a queue message and ends with removing/confirming the message
test('Whenever a user deletion message arrive, then his orders are deleted', async () => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const addedOrderId = (
    await request(expressApp).post('/order').send(orderToAdd)
  ).body.id;
  const fakeMessageQueue = await startFakeMessageQueue();
  const getNextMQEvent = getNextMQConfirmation(fakeMessageQueue);

  // Act
  fakeMessageQueue.pushMessageToQueue('deleted-user', { id: addedOrderId });

  // Assert
  await getNextMQEvent;
  const aQueryForDeletedOrder = await request(expressApp).get(
    `/order/${addedOrderId}`
  );
  expect(aQueryForDeletedOrder.status).toBe(404);
});

test('When a poisoned message arrives, then it is being rejected back', async () => {
  // Arrange
  const messageWithInvalidSchema = { nonExistingProperty: 'invalid' };
  const fakeMessageQueue = await startFakeMessageQueue();
  const getNextMQEvent = getNextMQConfirmation(fakeMessageQueue);

  // Act
  fakeMessageQueue.pushMessageToQueue('deleted-user', messageWithInvalidSchema);

  // Assert
  const eventFromMessageQueue = await getNextMQEvent;
  expect(eventFromMessageQueue).toEqual([{ event: 'message-rejected' }]);
});

// ️️️✅ Best Practice: Verify that messages are put in queue whenever the requirements state so
test('When a valid order is added, then a message is emitted to the new-order queue', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const spyOnSendMessage = sinon.stub(
    FakeMessageQueueProvider.prototype,
    'sendToQueue'
  );

  //Act
  await request(expressApp).post('/order').send(orderToAdd);

  // Assert
  expect(spyOnSendMessage.called).toBe(true);
  expect(spyOnSendMessage.lastCall.args).toMatchObject({}); //TODO
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
