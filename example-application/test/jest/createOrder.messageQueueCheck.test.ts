import sinon from 'sinon';
import * as testHelpers from '../../libraries/test-helpers';

import { QueueConsumer } from '../../entry-points/message-queue-consumer';
import { FakeMessageQueueProvider } from '../../libraries/fake-message-queue-provider';
import MessageQueueClient from '../../libraries/message-queue-client';
import { testSetup } from '../setup/test-file-setup';

beforeAll(async () => {
  await testSetup.start({
    startAPI: true,
    disableNetConnect: true,
    includeTokenInHttpClient: true,
    mockGetUserCalls: true,
    mockMailerCalls: true,
  });
  process.env.USE_FAKE_MQ = 'true';
});

beforeEach(() => {
  testSetup.resetBeforeEach();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  testSetup.tearDownTestFile();
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
    await testSetup.getHTTPClient().post('/order', orderToAdd)
  ).data.id;
  const messageQueueClient = await testHelpers.startMQConsumer(true);

  // Act
  await messageQueueClient.publish('user.events', 'user.deleted', {
    id: addedOrderId,
  });

  // Assert
  await messageQueueClient.waitFor('ack', 1);
  const aQueryForDeletedOrder = await testSetup
    .getHTTPClient()
    .get(`/order/${addedOrderId}`);
  expect(aQueryForDeletedOrder.status).toBe(404);
});

test('When a poisoned message arrives, then it is being rejected back', async () => {
  // Arrange
  const messageWithInvalidSchema = { nonExistingProperty: 'invalid❌' };
  const messageQueueClient = await testHelpers.startMQConsumer(true);

  // Act
  await messageQueueClient.publish(
    'user.events',
    'user.deleted',
    messageWithInvalidSchema,
  );

  // Assert
  await messageQueueClient.waitFor('nack', 1);
});

test('When user deleted message arrives, then all corresponding orders are deleted', async () => {
  // Arrange
  const orderToAdd = { userId: 1, productId: 2, status: 'approved' };
  const addedOrderId = (
    await testSetup.getHTTPClient().post('/order', orderToAdd)
  ).data.id;
  const messageQueueClient = new MessageQueueClient(
    new FakeMessageQueueProvider(),
  );
  await new QueueConsumer(messageQueueClient).start();

  // Act
  await messageQueueClient.publish('user.events', 'user.deleted', {
    id: addedOrderId,
  });

  // Assert
  await messageQueueClient.waitFor('ack', 1);
  const aQueryForDeletedOrder = await testSetup
    .getHTTPClient()
    .get(`/order/${addedOrderId}`);
  expect(aQueryForDeletedOrder.status).toBe(404);
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
  await testSetup.getHTTPClient().post('/order', orderToAdd);

  // Assert
  expect(spyOnSendMessage.lastCall.args[0]).toBe('order.events');
  expect(spyOnSendMessage.lastCall.args[1]).toBe('order.events.new');
});

test.todo('When an error occurs, then the message is not acknowledged');
test.todo(
  'When a new valid user-deletion message is processes, then the message is acknowledged',
);
test.todo(
  'When two identical create-order messages arrives, then the app is idempotent and only one is created',
);
test.todo(
  'When occasional failure occur during message processing , then the error is handled appropriately',
);
test.todo(
  'When multiple user deletion message arrives, then all the user orders are deleted',
);
test.todo(
  'When multiple user deletion message arrives and one fails, then only the failed message is not acknowledged',
);
