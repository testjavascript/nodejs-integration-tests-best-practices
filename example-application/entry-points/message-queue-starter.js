const MessageQueueClient = require('../libraries/message-queue-client');
const { errorHandler, AppError } = require('../error-handling');
const OrderRepository = require('../data-access/order-repository');

// This is message queue entry point. Like API routes but for message queues.
class MessageQueueStarter {
  constructor(messageQueueClient, queueName) {
    this.messageQueueClient = messageQueueClient;
    this.queueName = queueName;
  }

  async start() {
    await this.consumeUserDeletionQueue();
  }

  async consumeUserDeletionQueue() {
    // Let's now register to new delete messages from the queue
    return await this.messageQueueClient.consume(
      this.queueName,
      async (message) => {
       
        // Validate to ensure it is not a poisoned message (invalid) that will loop into the queue
        const newMessageAsObject = JSON.parse(message);

        // ️️️✅ Best Practice: Validate incoming MQ messages using your validator framework (simplistic implementation below)
        if (!newMessageAsObject.id) {
          throw new AppError('invalid-message', 'Unknown message schema');
        }

        const orderRepository = new OrderRepository();
        await orderRepository.deleteOrder(newMessageAsObject.id);
      }
    );
  }
}

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

module.exports = { MessageQueueStarter };
