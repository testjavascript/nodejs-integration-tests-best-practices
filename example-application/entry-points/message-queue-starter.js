const MessageQueueClient = require('../libraries/message-queue-client');
const { errorHandler, AppError } = require('../error-handling');
const OrderRepository = require('../data-access/order-repository');
const { EventEmitter } = require('events');

// This is message queue entry point. Like API routes but for message queues.
class MessageQueueStarter extends EventEmitter {
  constructor(customMessageQueueProvider) {
    super();
    console.log('Starter-constructor', customMessageQueueProvider);
    this.messageQueueClient = new MessageQueueClient(
      customMessageQueueProvider
    );
  }

  async start() {
    return await this.consumeUserDeletionQueue();
  }

  async consumeUserDeletionQueue() {
    // This function is what handles a new message. Like API route handler, but for MQ.
    // When it finishes, it emits a message, otherwise the tests does not know when to assert
    const deletedOrderMessageHandler = (message) => {
      return new Promise((resolve, reject) => {
        // Validate to ensure it is not a poisoned message (invalid) that will loop into the queue
        const newMessageAsObject = JSON.parse(message);
        // ️️️✅ Best Practice: Validate incoming MQ messages using your validator framework (simplistic implementation below)
        if (!newMessageAsObject.id) {
          return reject(new AppError('invalid-message', true));
        }

        const orderRepository = new OrderRepository();

        orderRepository.deleteOrder(newMessageAsObject.id).then(() => {
          this.emit('message-handled');
          return resolve();
        });
      });
    };

    await this.messageQueueClient.consume(
      'deleted-user',
      deletedOrderMessageHandler
    );
    return;
  }
}

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

module.exports = { MessageQueueStarter };
