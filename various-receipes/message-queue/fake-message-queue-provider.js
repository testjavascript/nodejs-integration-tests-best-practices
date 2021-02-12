const { EventEmitter } = require('events');

class Channel extends EventEmitter {
  async nack() {
    this.emit('message-rejected');
  }

  async ack() {
    this.emit('message-acknowledged');
  }

  async sendToQueue() {
    this.emit('message-sent');
  }

  async assertQueue() {}

  async consume(queueName, callback) {
    this.messageHandler = callback;
  }

  async fakeANewMessageInQueue(newMessage) {
    if (this.messageHandler) {
      this.messageHandler(newMessage);
      this.emit('message-arrived');
    }
  }
}

class Connection {
  async createChannel() {
    return new Channel();
  }
}

async function connect() {
  return new Connection();
}

module.exports = { connect };
