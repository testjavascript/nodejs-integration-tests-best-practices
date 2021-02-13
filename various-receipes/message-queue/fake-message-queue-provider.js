const { EventEmitter } = require('events');

let channel;

class Channel extends EventEmitter {
  async nack() {
    console.log('Faker-nack');
    this.emit('message-rejected');
  }

  async ack() {
    console.log('Faker-ack');
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
    console.log('Faker-fake');
    if (this.messageHandler) {
      console.log('Faker-fake-msg-handler-exist');
      this.messageHandler(newMessage);
      this.emit('message-arrived');
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
