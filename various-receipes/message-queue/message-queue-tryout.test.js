const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const { FakeMessageQueueProvider } = require('./fake-message-queue-provider');

const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');
const messageQueueClient = require('../../example-application/libraries/message-queue-client');
const {
  MessageQueueStarter,
} = require('../../example-application/entry-points/message-queue-starter');
const { default: Axios } = require('axios');

let expressApp, messageQueueClientStub;

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
  nock('https://mail.com').post('/send').reply(202);
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

test.skip('When adding a new valid order, a message is put in queue', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  messageQueueClientStub.sendMessage.returns(Promise.resolve({}));

  //Act
  await request(expressApp).post('/order').send(orderToAdd);

  //Assert
  expect(messageQueueClientStub.sendMessage.called).toBe(true);
});

test('Whenever a user deletion message arrive, then his orders are deleted', async (done) => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  console.log('test-before order added');
  const response = await request(expressApp).post('/order').send(orderToAdd);
  console.log('response', response.status);
  const addedOrderId = response.body.id;
  console.log('test-order added', addedOrderId);

  const fakeMessageQueue = new FakeMessageQueueProvider();
  const messageQueueStarter = new MessageQueueStarter(fakeMessageQueue);
  await messageQueueStarter.start();

  // Act
  fakeMessageQueue.on('message-handled', async () => {
    const deletedOrder = await request(expressApp).get(
      `/order/${addedOrderId}`
    );
    expect(deletedOrder.body).toEqual({});
    done();
  });

  console.log('test-id', addedOrderId);
  fakeMessageQueue.fakeANewMessageInQueue({ id: addedOrderId });
});

test('When a poisoned message arrives, then it is being rejected back', async (done) => {
  // Arrange
  const messageWithInvalidSchema = { nonExistingProperty: 'invalid' };
  const fakeMessageQueue = new FakeMessageQueueProvider();
  const messageQueueStarter = new MessageQueueStarter(fakeMessageQueue);
  await messageQueueStarter.start();

  fakeMessageQueue.on('message-rejected', (eventDescription) => {
    done();
  });

  // Act
  fakeMessageQueue.fakeANewMessageInQueue(messageWithInvalidSchema);

  // Assert
});
