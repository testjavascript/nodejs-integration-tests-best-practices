const amqplib = require('amqplib');
const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const fakeMessageQueueProvider = require('./fake-message-queue-provider');

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
  nock('https://mailer.com')
    .post('/send', (payload) => ((emailPayload = payload), true))
    .reply(202);
  messageQueueClientStub = sinon.stub(messageQueueClient);
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

// ️️️✅ Best Practice: Ensure that your app stop early enough when a poisoned 💉 message arrives
test('When a poisoned message arrives, then it being ignored', async () => {
  // Arrange
  const messageWithInvalidSchema = { id: 650 };

  // Assert
  const messageQueueStarter = new MessageQueueStarter(fakeMessageQueueProvider);
  messageQueueStarter.on('message-handled', async () => {
    done();
  });

  // Act
  messageQueueStarter.start();
});
