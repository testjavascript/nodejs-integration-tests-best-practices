const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');
const {
  QueueConsumer,
} = require('../../example-application/entry-points/message-queue-consumer');
const amqplib = require('amqplib');
const MessageQueueClient = require('../../example-application/libraries/message-queue-client');

module.exports.startMQConsumer = async (
  fakeOrReal,
  messageQueueClient = undefined
) => {
  if (!messageQueueClient) {
    const messageQueueProvider =
      fakeOrReal === 'fake' ? new FakeMessageQueueProvider() : amqplib;
    messageQueueClient = new MessageQueueClient(messageQueueProvider);
  }

  await new QueueConsumer(messageQueueClient).start();

  return messageQueueClient;
};
