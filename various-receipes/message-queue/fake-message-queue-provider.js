const { EventEmitter } = require('events');

let channel;

class Channel extends EventEmitter {
  async nack() {
    const eventDescription = { name: 'message-rejected' };
    this.emit('message-rejected', eventDescription);
  }

  async ack() {
    const eventDescription = { name: 'message-acknowledged' };
    this.emit('message-acknowledged', eventDescription);
  }

  async sendToQueue(message) {
    this.emit('message-sent', message);
  }

  async assertQueue() {}

  async consume(queueName, messageHandler) {
    this.messageHandler = messageHandler;
  }

  async fakeANewMessageInQueue(newMessage) {
    if (this.messageHandler) {
      const wrappedMessage = {
        content: Buffer.from(JSON.stringify(newMessage)),
      };
      this.messageHandler(wrappedMessage);
    }
  }
}

class Connection {
  async createChannel() {
    if (!channel) {
      channel = new Channel();
    }

    return channel;
  }
}

async function connect() {
  return new Connection(channel);
}

function fakeANewMessageInQueue(message) {
  if (!channel) {
    channel = new Channel();
  }
  channel.fakeANewMessageInQueue(message);
}

function getChannel() {
  if (!channel) {
    channel = new Channel();
  }
  return channel;
}

module.exports = { connect, fakeANewMessageInQueue, getChannel };

// Send spy should have access to this without instantiating starter
// Listen should be able to fetch ack/nack
// Listen should be able to inject multiple message
// Listen should be able to isolate from other tests
