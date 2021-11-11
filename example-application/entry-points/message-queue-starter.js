const { UserDeletedMessageValidator } = require('user-payloads');
/**
 * @typedef { import("user-payloads").UserDeletedMessageSchema } UserDeletedMessageSchema
 */

const MessageQueueClient = require('../libraries/message-queue-client');
const { errorHandler, AppError } = require('../error-handling');
const OrderRepository = require('../data-access/order-repository');

// This is message queue entry point. Like API routes but for message queues.
class QueueSubscriber {
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
        /**
         * @type {UserDeletedMessageSchema}
         */
        const newMessageAsObject = JSON.parse(message);
        const deletionReason = newMessageAsObject.deletionReason;
        console.log(deletionReason);
        if (!UserDeletedMessageValidator(newMessageAsObject)) {
          throw new AppError('invalid-mq-message');
        }
        console.log(newMessageAsObject.deletionReason);

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

module.exports = { QueueSubscriber };
