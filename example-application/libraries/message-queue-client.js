const amqplib = require('amqplib');
const { EventEmitter } = require('events');
const { AppError, errorHandler } = require('../error-handling');
const { FakeMessageQueueProvider } = require('./fake-message-queue-provider');

// This is a simplistic client for a popular message queue product - RabbitMQ
// It's generic in order to be used by any service in the organization
class MessageQueueClient extends EventEmitter {
  constructor(customMessageQueueProvider) {
    super();
    this.isReady = false;

    // To facilitate testing, the client allows working with a fake MQ provider
    // It can get one in the constructor here or even change by environment variables
    if (customMessageQueueProvider) {
      this.messageQueueProvider = customMessageQueueProvider;
    } else {
      this.messageQueueProvider = amqplib;
    }

    this.countEvents();
  }

  async connect() {
    const connectionProperties = {
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      username: 'guest',
      password: 'guest', // This is a demo app, no security considerations. This is the password for the local dev server
      locale: 'en_US',
      frameMax: 0,
      heartbeat: 0,
      vhost: '/',
    };
    this.connection = await this.messageQueueProvider.connect(
      connectionProperties
    );
    this.channel = await this.connection.createChannel();
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
    return;
  }

  async sendMessage(queueName, message) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertQueue(queueName);
    const sendResponse = await this.channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message))
    );

    return sendResponse;
  }

  async publish(exchangeName, routingKey, message, messageId) {
    if (!this.channel) {
      await this.connect();
    }
    console.log('publish', exchangeName, routingKey);

    const sendResponse = await this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { messageId }
    );

    return sendResponse;
  }

  async deleteQueue(queueName) {
    if (!this.channel) {
      await this.connect();
    }
    const queueDeletionResult = await this.channel.deleteQueue(queueName);
    console.log(queueDeletionResult);

    return;
  }

  async assertQueue(queueName) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertQueue(queueName);

    return;
  }

  async assertExchange(name, type) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertExchange(name, type, { durable: false });

    return;
  }

  async bindQueue(queueToBind, exchangeToBindTo, bindingPattern) {
    if (!this.channel) {
      await this.connect();
    }

    await this.channel.bindQueue(queueToBind, exchangeToBindTo, bindingPattern);

    return;
  }

  async consume(queueName, onMessageCallback) {
    if (!this.channel) {
      await this.connect();
    }
    this.channel.assertQueue(queueName);
    console.log('consume start', queueName);

    await this.channel.consume(queueName, async (theNewMessage) => {
      //Not awaiting because some MQ client implementation get back to fetch messages again only after handling a message
      onMessageCallback(theNewMessage.content.toString())
        .then(() => {
          console.log('ack');
          this.emit('ack', theNewMessage);
          this.channel.ack(theNewMessage);
        })
        .catch((error) => {
          this.channel.nack(theNewMessage, false, true);
          this.emit('nack', theNewMessage);
          console.log('nack', error.message);
          error.isTrusted = true; //Since it's related to a single message, there is no reason to let the process crash
          //errorHandler.handleError(error);
        });
    });

    return;
  }

  countEvents() {
    const eventsToListen = ['nack', 'ack'];
    if (this.eventsCounter === undefined) {
      this.eventsCounter = {};
      eventsToListen.forEach((eventToListenTo) => {
        this.eventsCounter[eventToListenTo] = 0;
        this.on(eventToListenTo, (eventData) => {
          this.eventsCounter[eventToListenTo]++;
          console.log('events counting', this.eventsCounter);
          this.emit('event-counted', {
            name: eventToListenTo,
            lastEventData: eventData,
            count: this.eventsCounter[eventToListenTo],
          });
        });
      });
    }
  }

  // Helper methods for testing
  async waitFor(eventName, howMuch) {
    return new Promise((resolve, reject) => {
      this.on('event-counted', (eventInfo) => {
        if (eventInfo.name !== eventName) {
          return;
        }
        if (eventInfo.count >= howMuch) {
          resolve({
            lastEventData: eventInfo.lastEventData,
            count: eventInfo.count,
          });
        }
      });
    });
  }
}

module.exports = MessageQueueClient;
