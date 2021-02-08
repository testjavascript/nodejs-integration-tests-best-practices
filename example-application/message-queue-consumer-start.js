const messageQueueClient = require('./libraries/message-queue-client');
const { errorHandler } = require('./error-handling');
const OrderRepository = require('./data-access/order-repository');
const { EventEmitter } = require('events');

class MessageQueueStarter extends EventEmitter {
  constructor() {
    super();
  }

  async startMessageQueueConsumer() {
    await messageQueueClient.consume('deleted-user', async (message) => {
      const orderRepository = new OrderRepository();
      const newMessageAsObject = JSON.parse(message);
      console.log('Consumer msg arrived', newMessageAsObject);
      await orderRepository.deleteOrder(newMessageAsObject.id);
      this.emit('message-handled');
      return;
    });
    return;
  }
}
module.exports = { MessageQueueStarter };

process.on('uncaughtException', (error) => {
  //errorHandler.handleError(error);
  console.log(error);
});

process.on('unhandledRejection', (reason) => {
  //errorHandler.handleError(reason);
  console.log(reason);
});
