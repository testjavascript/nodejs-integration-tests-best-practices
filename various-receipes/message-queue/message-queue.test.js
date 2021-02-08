const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/api');
const messageQueueClient = require('../../example-application/libraries/message-queue-client');
const {
  MessageQueueStarter,
} = require('../../example-application/message-queue-consumer-start');

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

test.skip('When a user deletion message arrive, then his orders are disabled', async (done) => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  console.log('test-add-order');
  const {
    body: { id: addedOrderId },
  } = await request(expressApp).post('/order').send(orderToAdd);
  console.log('test-added-order', addedOrderId);
  sinon
    .stub(messageQueueClient, 'consume')
    .callsFake(async (queueName, onMessageCallback) => {
      console.log('test-fake-consume');
      await onMessageCallback(JSON.stringify({ id: addedOrderId }));
    });

  // Act
  const messageQueueStarter = new MessageQueueStarter();
  messageQueueStarter.on('message-handled', async () => {
    console.log('test-msg-handled');
    // Assert
    const deletedOrder = await request(expressApp).get(
      `/order/${addedOrderId}`
    );
    console.log('Test done', deletedOrder.body);
    expect(deletedOrder.body).toEqual({});
    done();
  });
  messageQueueStarter.startMessageQueueConsumer();
});

test.skip('When adding a new valid order, a message is put in queue', () => {});

test('When a user deletion message arrive, then his orders are disabled', async (done) => {
  // Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const {
    body: { id: addedOrderId },
  } = await request(expressApp).post('/order').send(orderToAdd);
  const messageQueueStarter = new MessageQueueStarter();
  messageQueueStarter.on('message-handled', async () => {
    console.log('Test got handled');
    const deletedOrder = await request(expressApp).get(
      `/order/${addedOrderId}`
    );
    console.log('Test done', deletedOrder.body);
    expect(deletedOrder.body).toEqual({});
    done();
  });
  messageQueueStarter.startMessageQueueConsumer();
  //   messageQueueClient.on('message-handled', () => {
  //     console.log('Handled');
  //     done();
  //   });
  //   messageQueueClient.consume('deleted-user', (message) => {
  //     console.log('1');
  //     console.log('test subscriber', message);
  //     //done();
  //   });

  // Act
  console.log('0');
  console.log('2');
  await messageQueueClient.sendMessage('deleted-user', { id: addedOrderId });
  console.log('3');
  //await startMessageQueueConsumer();

  // Assert
});
