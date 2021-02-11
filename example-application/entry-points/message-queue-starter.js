const messageQueueClient = require('../libraries/message-queue-client');
const { errorHandler } = require('../error-handling');
const OrderRepository = require('../data-access/order-repository');
const { EventEmitter } = require('events');

// This is message queue entry point. Like API routes but for message queues.
class MessageQueueStarter extends EventEmitter {
  constructor() {
    super();
  }

  async start() {
    // This promise is what handles a new message. Like API route handler, but for MQ.
    // When it finishes, it emits a message, otherwise the tests can't know when to assert
    const deletedOrderMessageHandler = (message) => {
      return new Promise((resolve, reject) => {
        const orderRepository = new OrderRepository();
        const newMessageAsObject = JSON.parse(message);
        orderRepository.deleteOrder(newMessageAsObject.id).then(() => {
          this.emit('message-handled');
          return resolve();
        });
      });
    };

    await messageQueueClient.consume(
      'deleted-user',
      deletedOrderMessageHandler
    );
    return;
  }
}
module.exports = { MessageQueueStarter };

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
  console.log(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});
