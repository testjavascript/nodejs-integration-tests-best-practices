const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');
const {
  QueueSubscriber: MessageQueueStarter,
} = require('../../example-application/entry-points/message-queue-starter');
const amqplib = require('amqplib');
const MessageQueueClient = require('../../example-application/libraries/message-queue-client');

module.exports.startMQSubscriber = async (
  fakeOrReal,
  queueName,
  deadLetterQueueName = undefined,
  messageQueueClient = undefined
) => {
  if (!messageQueueClient) {
    const messageQueueProvider =
      fakeOrReal === 'fake' ? new FakeMessageQueueProvider() : amqplib;
    messageQueueClient = new MessageQueueClient(messageQueueProvider);
  }

  await new MessageQueueStarter(
    messageQueueClient,
    queueName,
    deadLetterQueueName
  ).start();

  return messageQueueClient;
};
