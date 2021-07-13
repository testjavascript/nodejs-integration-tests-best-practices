const { EventEmitter } = require('events');

// This class is the heart of the MQ testing - It replaces the MQ provider client library
// and implement the same signature, but each method does nothing but emit an event which the test
// can verify that indeed happened
class FakeMessageQueueProvider extends EventEmitter {
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

  async sendToQueue(queueName, message) {
    this.emit('message-sent', message);
  }

  async assertQueue() {}

  async consume(queueName, messageHandler) {
    // We just save the callback (handler) locally, whenever a message will put into this queue
    // we will fire this handler
    this.messageHandler = messageHandler;
  }

  // This is the only method that does not exist in the MQ client library
  // It allows us to fake like there is a new message in the queue and start a flow
  async pushMessageToQueue(queue, newMessage) {
    if (this.messageHandler) {
      const wrappedMessage = {
        content: Buffer.from(JSON.stringify(newMessage)),
      };
      this.messageHandler(wrappedMessage);
    } else {
      // Just warning and no exception because the test might want to simulate that
      console.error(
        'A new message put into the fake queue but no handlers exist'
      );
    }
  }

  async createChannel() {
    return this;
  }

  async connect() {
    return this;
  }
}

module.exports = { FakeMessageQueueProvider };
