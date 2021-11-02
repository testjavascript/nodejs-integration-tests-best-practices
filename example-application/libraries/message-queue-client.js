const amqplib = require('amqplib');
const { EventEmitter } = require('events');
const { throwIfEmpty } = require('rxjs/operators');
const { AppError, errorHandler } = require('../error-handling');
const { FakeMessageQueueProvider } = require('./fake-message-queue-provider');

// This is a simplistic client for a popular message queue product - RabbitMQ
// It's generic in order to be used by any service in the organization
class MessageQueueClient extends EventEmitter {
  constructor(customMessageQueueProvider) {
    super();
    this.isReady = false;
    this.requeue = true; // Tells whether to return failed messages to the queue

    // To facilitate testing, the client allows working with a fake MQ provider
    // It can get one in the constructor here or even change by environment variables
    if (customMessageQueueProvider) {
      this.messageQueueProvider = customMessageQueueProvider;
    } 
    else if(process.env.USE_FAKE_MQ === 'true'){
      this.messageQueueProvider = new FakeMessageQueueProvider();
    }
    else {
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

    const sendResponse = await this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { messageId }
    );
    this.emit('publish', { exchangeName, routingKey, message });

    return sendResponse;
  }

  async deleteQueue(queueName) {
    if (!this.channel) {
      await this.connect();
    }
    const queueDeletionResult = await this.channel.deleteQueue(queueName);

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

    await this.channel.consume(queueName, async (theNewMessage) => {
      //Not awaiting because some MQ client implementation get back to fetch messages again only after handling a message
      onMessageCallback(theNewMessage.content.toString())
        .then(() => {
          this.emit('ack', theNewMessage);
          this.channel.ack(theNewMessage);
        })
        .catch((error) => {
          this.channel.nack(theNewMessage, false, this.requeue);
          this.emit('nack', theNewMessage);
          error.isTrusted = true; //Since it's related to a single message, there is no reason to let the process crash
          //errorHandler.handleError(error);
        });
    });

    return;
  }

  setRequeue(newValue) {
    this.requeue = newValue;
  }

  // This function stores all the MQ events in a local data structure so later
  // one query this
  countEvents() {
    const eventsToListen = ['nack', 'ack', 'publish'];
    if (this.eventsRecorder !== undefined) {
      return; // Already initialized and set up
    }
    this.eventsRecorder = {};
    eventsToListen.forEach((eventToListenTo) => {
      this.eventsRecorder[eventToListenTo] = {
        count: 0,
        lastEventData: null,
        name: eventToListenTo,
      };
      this.on(eventToListenTo, (eventData) => {
        this.eventsRecorder[eventToListenTo].count++;
        this.eventsRecorder[eventToListenTo].lastEventData = eventData;
        this.emit('message-queue-event', {
          name: eventToListenTo,
          eventsRecorder: this.eventsRecorder,
        });
      });
    });
  }

  resolveIfEventExceededThreshold(eventName, threshold, resolve) {
    if (this.eventsRecorder[eventName].count >= threshold) {
      resolve({
        name: eventName,
        lastEventData: this.eventsRecorder[eventName].lastEventData,
        count: this.eventsRecorder[eventName].count,
      });
    }
  }
  // Helper methods for testing - Resolves/fires when some event happens
  async waitFor(eventName, howMuch) {
    return new Promise((resolve, reject) => {
      // The first resolve is for cases where the caller has approached AFTER the event has already happen
      this.resolveIfEventExceededThreshold(eventName, howMuch, resolve);
      this.on('message-queue-event', (eventInfo) => {
        this.resolveIfEventExceededThreshold(eventName, howMuch, resolve);
      });
    });
  }
}

module.exports = MessageQueueClient;
