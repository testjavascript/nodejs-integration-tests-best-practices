const { EventEmitter } = require('events');

class FakeMessageQueueProvider extends EventEmitter {
  async nack() {
    console.log('Faker nack');
    const eventDescription = { name: 'message-rejected' };
    this.emit('message-rejected', eventDescription);
    this.emit('message-handled', eventDescription);
  }

  async ack() {
    const eventDescription = { name: 'message-acknowledged' };
    this.emit('message-acknowledged', eventDescription);
    this.emit('message-handled', eventDescription);
  }

  async sendToQueue(queueName, message) {
    this.emit('message-sent', message);
  }

  async assertQueue() {}

  async consume(queueName, messageHandler) {
    console.log('faker consume', messageHandler);
    this.messageHandler = messageHandler;
  }

  async fakeANewMessageInQueue(queue, newMessage) {
    console.log('Fake MQ new message', newMessage, this.messageHandler);
    if (this.messageHandler) {
      console.log('Fake message handler exists', newMessage);
      const wrappedMessage = {
        content: Buffer.from(JSON.stringify(newMessage)),
      };
      this.messageHandler(wrappedMessage);
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

// Send spy should have access to this without instantiating starter
// Listen should be able to fetch ack/nack
// Listen should be able to inject multiple message
// Listen should be able to isolate from other tests
