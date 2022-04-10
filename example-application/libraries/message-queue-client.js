const { EventEmitter } = require('events');
const amqplib = require('amqplib');

const { FakeMessageQueueProvider } = require('./fake-message-queue-provider');

// This is a simplistic client for a popular message queue product - RabbitMQ
// It's generic in order to be used by any service in the organization
class MessageQueueClient extends EventEmitter {
  recordingStarted = false;

  constructor(customMessageQueueProvider) {
    super();
    this.isReady = false;
    this.requeue = true; // Tells whether to return failed messages to the queue

    // To facilitate testing, the client allows working with a fake MQ provider
    // It can get one in the constructor here or even change by environment variables
    // For the sake of simplicity HERE, since it's demo code - The default is a fake MQ
    if (customMessageQueueProvider) {
      this.messageQueueProvider = customMessageQueueProvider;
    } else if (process.env.USE_FAKE_MQ === 'false') {
      this.messageQueueProvider = amqplib;
    } else {
      this.messageQueueProvider = new FakeMessageQueueProvider();
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
    await this.channel.deleteQueue(queueName);
  }

  async assertQueue(queueName, options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertQueue(queueName, options);
  }

  async assertExchange(name, type) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertExchange(name, type, { durable: false });
  }

  async bindQueue(queueToBind, exchangeToBindTo, bindingPattern) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.bindQueue(queueToBind, exchangeToBindTo, bindingPattern);
  }

  async consume(queueName, onMessageCallback) {
    if (!this.channel) {
      await this.connect();
    }

    await this.channel.consume(queueName, async (theNewMessage) => {
      this.emit('consume', { queueName, message: theNewMessage });

      //Not awaiting because some MQ client implementation get back to fetch messages again only after handling a message
      onMessageCallback(theNewMessage.content.toString())
        .then(() => {
          this.emit('ack', { queueName, message: theNewMessage });
          this.channel.ack(theNewMessage);
        })
        .catch(async (error) => {
          this.channel.nack(theNewMessage, false, this.requeue);
          this.emit('nack', { queueName, message: theNewMessage });
          error.isTrusted = true; //Since it's related to a single message, there is no reason to let the process crash
          //errorHandler.handleError(error);
        });
    });
  }

  setRequeue(newValue) {
    this.requeue = newValue;
  }

  // This function stores all the MQ events in a local data structure so later
  // one query this
  countEvents() {
    if (this.recordingStarted === true) {
      return; // Already initialized and set up
    }

    const eventsName = ['ack', 'nack', 'publish', 'sendToQueue', 'consume'];

    this.records = {};

    eventsName.forEach((eventToListenTo) => {
      this.records[eventToListenTo] = {
        count: 0,
        events: [],
        lastEventData: null,
      };

      this.on(eventToListenTo, (eventData) => {
        // Not needed anymore when having the `events` array
        this.records[eventToListenTo].count++;
        this.records[eventToListenTo].lastEventData = eventData;

        this.records[eventToListenTo].events.push(eventData);

        this.emit('message-queue-event', {
          name: eventToListenTo,
          eventsRecorder: this.records,
        });
      });
    });
  }

  /**
   * Helper methods for testing - Resolves/fires when some event happens
   * @param eventName
   * @param {number} howMuch how much
   * @param {object?} query
   * @param {string?} query.exchangeName
   * @param {string?} query.queueName
   * @returns {Promise<unknown>}
   */
  async waitFor(eventName, howMuch, query = {}) {
    let options = query || {};
    options.howMuch = howMuch;

    return new Promise((resolve) => {
      // The first resolve is for cases where the caller has approached AFTER the event has already happen
      if (this.resolveIfEventExceededThreshold(eventName, options, resolve)) {
        return;
      }

      const handler = () => {
        if (this.resolveIfEventExceededThreshold(eventName, options, resolve)) {
          this.off('message-queue-event', handler);
        }
      };

      this.on('message-queue-event', handler);
    });
  }

  /**
   * @param eventName
   * @param {object} options
   * @param {number} options.howMuch
   * @param {string?} options.exchangeName
   * @param {string?} options.queueName
   * @param resolve
   * @returns {boolean} Return true if resolve fn called, otherwise false
   */
  resolveIfEventExceededThreshold(eventName, options, resolve) {
    const eventRecords = this.records[eventName];

    // Can be optimized by:
    // - Only run it if the options have such filter
    // - Check only what asked
    const filteredEvents = eventRecords.events.filter((eventData) => {
      return (
        // If the queue name is the same (in case it was provided)
        (!options.queueName || eventData.queueName === options.queueName) &&
        // If the exchange name is the same (in case the it was provided)
        (!options.exchangeName ||
          eventData.exchangeName === options.exchangeName)
      );
    });

    if (filteredEvents.length >= options.howMuch) {
      resolve({
        name: eventName,
        lastEventData: filteredEvents[filteredEvents.length - 1],
        count: filteredEvents.length,
      });

      return true;
    }

    return false;
  }
}

module.exports = MessageQueueClient;
