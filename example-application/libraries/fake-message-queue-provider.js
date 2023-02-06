const { EventEmitter } = require('events');

// This class is the heart of the MQ testing - It replaces the MQ provider client library
// and implement the same signature, but each method does nothing but emit an event which the test
// can verify that indeed happened
class FakeMessageQueueProvider extends EventEmitter {
  async consume(queueName, messageHandler) {
    this.messageHandler = messageHandler;
    Promise.resolve();
  }

  async publish(exchangeName, routingKey, newMessage) {
    if (this.messageHandler) {
      this.messageHandler({ content: newMessage });
      this.emit('publish', { exchangeName, routingKey, newMessage });
    }
    Promise.resolve();
  }

  async nack() {
    const eventDescription = { event: 'message-rejected' };
    this.emit('message-rejected', eventDescription); // Multiple events allows the test to filter for the relevant event
    this.emit('message-handled', eventDescription);
  }

  async ack() {
    const eventDescription = { event: 'message-acknowledged' };
    this.emit('message-acknowledged', eventDescription);
    this.emit('message-handled', eventDescription);
  }

  async assertQueue(queueName) {}

  async createChannel() {
    return this;
  }

  async connect() {
    return this;
  }
}

module.exports = { FakeMessageQueueProvider };
