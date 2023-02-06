const MessageQueueClient = require('../libraries/message-queue-client');
const { errorHandler, AppError } = require('../error-handling');
const orderService = require('../business-logic/order-service');

// This is message queue entry point. Like API routes but for message queues.
class QueueConsumer {
  constructor(messageQueueClient) {
    this.messageQueueClient = messageQueueClient;
  }

  async start() {
    await this.consumeUserDeletionQueue();
  }

  async consumeUserDeletionQueue() {
    await this.messageQueueClient.consume('user.deleted', async (message) => {
      console.log(
        `user.deleted consumer got a new message about user ${message}`
      );
      // ️️️Validate message
      const newMessageAsObject = JSON.parse(message);
      if (!newMessageAsObject.id) {
        throw new AppError('invalid-message', 'Unknown message schema');
      }

      await orderService.deleteUserOrders(newMessageAsObject.id);
    });
  }
}

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

module.exports = { QueueConsumer };
