const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');
const messageQueueClient = require('../../example-application/libraries/message-queue-client');
const {
  MessageQueueStarter,
} = require('../../example-application/entry-points/message-queue-starter');

let expressApp, sendMQMessageStub;

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
  nock('https://mailer.com')
    .post('/send', (payload) => ((emailPayload = payload), true))
    .reply(202);
  sendMQMessageStub = sinon.stub(messageQueueClient);
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

test('When adding a new valid order, a message is put in queue', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  sendMQMessageStub.sendMessage.returns(Promise.resolve({}));

  //Act
  await request(expressApp).post('/order').send(orderToAdd);

  //Assert
  expect(sendMQMessageStub.sendMessage.called).toBe(true);
});

test('When a user deletion message arrive, then his orders are deleted', async (done) => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const {
    body: { id: addedOrderId },
  } = await request(expressApp).post('/order').send(orderToAdd);

  sendMQMessageStub.consume.callsFake(async (queueName, onMessageCallback) => {
    await onMessageCallback(JSON.stringify({ id: addedOrderId }));
  });

  const messageQueueStarter = new MessageQueueStarter();

  messageQueueStarter.on('message-handled', async () => {
    const deletedOrder = await request(expressApp).get(
      `/order/${addedOrderId}`
    );
    expect(deletedOrder.body).toEqual({});
    done();
  });
  messageQueueStarter.start();
});
