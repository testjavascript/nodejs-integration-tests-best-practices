const MessageQueueClient = require('../libraries/message-queue-client');
const { errorHandler } = require('../error-handling');
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
    // This function is what handles a new message. Like API route handler, but for MQ.
    // When it finishes, it emits a message, otherwise the tests does not know when to assert
    const deletedOrderMessageHandler = (message) => {
      return new Promise((resolve, reject) => {
        // Validate to ensure it is not a poisoned message (invalid) that will loop into the queue
        console.log('Starter-start', JSON.stringify(message));
        const newMessageAsObject = JSON.parse(message);
        // ️️️✅ Best Practice: Validate incoming MQ messages using your validator framework (simplistic implementation below)
        if (!newMessageAsObject.id) {
          console.log('Starter-reject');
          return reject(new Error('Invalid message schema, poisoned maybe?'));
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
    console.log('Starter-register-finish');
    return;
  }
}
module.exports = { MessageQueueStarter };

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});
