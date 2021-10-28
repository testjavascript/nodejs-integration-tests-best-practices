const amqplib = require('amqplib');
const MessageQueueClient = require('../../example-application/libraries/message-queue-client');
const {
  getNextMQConfirmation,
  startFakeMessageQueue,
  getMQMessageOrTimeout,
  getShortUnique,
} = require('./test-helpers');
const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');

(async function (arguments) {
  const mqClient = new MessageQueueClient(amqplib);
  mqClient.assertExchange('user-events', 'topic');
  let overallTime = 0;
  const numOfIterations = 200;

  for (let index = 0; index < numOfIterations; index++) {
    console.time('measure');
    const startTime = new Date();
    const userDeletedQueueName = `user-deleted-${getShortUnique()}`;
    await mqClient.assertQueue(userDeletedQueueName);
    await mqClient.bindQueue(
      userDeletedQueueName,
      'user-events',
      'user.deleted'
    );
    await mqClient.publish('user-events', 'user.deleted', { id: 100 });
    await mqClient.deleteQueue(userDeletedQueueName);
    const endTime = new Date();
    const singleTime = endTime.getTime() - startTime.getTime();
    overallTime += singleTime;
    console.log('Single time', singleTime);
    console.timeEnd('measure');
  }

  console.log('Overall time', overallTime / numOfIterations);
})();
