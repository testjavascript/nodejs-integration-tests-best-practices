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
    } else if (process.env.USE_FAKE_MQ === 'true') {
      this.messageQueueProvider = new FakeMessageQueueProvider();
    } else {
      this.messageQueueProvider = new FakeMessageQueueProvider();
    }

    this.countEvents();
  }

  // This function stores all the MQ events in a local data structure so later
  // one query this
  countEvents() {
    if (this.recordingStarted === true) {
      return; // Already initialized and set up
    }
    this.records = {
      ack: { count: 0, lastEventData: null },
      nack: { count: 0, lastEventData: null },
      publish: { count: 0, lastEventData: null },
      consume: { count: 0, lastEventData: null },
    };
    ['nack', 'ack', 'publish'].forEach((eventToListenTo) => {
      this.on(eventToListenTo, (eventData) => {
        this.records[eventToListenTo].count++;
        this.records[eventToListenTo].lastEventData = eventData;
        this.emit('message-queue-event', {
          name: eventToListenTo,
          eventsRecorder: this.recordingStarted,
        });
      });
    });
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
    // TODO - It's problematic as if I wanna send to queue that has some options this will fail as the queues options are conflicting
    // await this.channel.assertQueue(queueName);

    const sendResponse = await this.channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message))
    );

    return sendResponse;
  }

  async publish(
    exchangeName,
    routingKey,
    message,
    { messageId, maxRetries } = {}
  ) {
    if (!this.channel) {
      await this.connect();
    }

    const sendResponse = await this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        messageId,
        headers: {
          maxRetries,
        },
      }
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

  async assertQueue(queueName, options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    await this.channel.assertQueue(queueName, options);

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

    // TODO - It's problematic as if I wanna send to queue that has some options this will fail as the queues options are conflicting
    // this.channel.assertQueue(queueName);

    await this.channel.consume(queueName, async (theNewMessage) => {
      //Not awaiting because some MQ client implementation get back to fetch messages again only after handling a message
      onMessageCallback(theNewMessage.content.toString())
        .then(() => {
          this.emit('ack', theNewMessage);
          this.emit(`ack:${queueName}`, theNewMessage);
          this.channel.ack(theNewMessage);
        })
        .catch(async (error) => {
          // If need to have retry
          if (theNewMessage.properties?.headers.maxRetries) {
            await this._handleRetry(queueName, theNewMessage, error);
            return;
          }

          this.channel.nack(theNewMessage, false, this.requeue);
          this.emit('nack', theNewMessage);
          this.emit(`nack:${queueName}`, theNewMessage);
          error.isTrusted = true; //Since it's related to a single message, there is no reason to let the process crash
          //errorHandler.handleError(error);
        });
    });

    return;
  }

  async _handleRetry(queueName, message, error) {
    const currentRetry = (message.properties.headers?.currentRetry ?? 0) + 1;

    // We don't check for equality with max retries because the first run should not count as a retry
    if (currentRetry > message.properties.headers?.maxRetries) {
      // We count the first run as a retry so we subtract it here
      console.log('Max retries exceeded: ' + (currentRetry - 1));

      // Drop the message (if queue have dead letter exchange/queue it will move the message there)
      this.channel.nack(message, false, false);

      this.emit('nack', message);
      this.emit(`nack:${queueName}`, message);
      error.isTrusted = true; //Since it's related to a single message, there is no reason to let the process crash
      //errorHandler.handleError(error);

      return;
    }

    // Note that messages still may be re-queued in the case that your consumer disconnects before sending any acknowledgement, positive or negative, back to the server.
    // In this case, the original message will be delivered as-is (no custom header) and the redelivered flag will be set.

    // TODO - should I requque or send to the exchange again?
    let messageUpdatedOptions = {
      headers: {
        ...message.properties.headers,
        currentRetry: currentRetry,
      },
      expiration: message.properties.expiration,
      userId: message.properties.userId,
      // Missing CC

      // Missing mandatory
      // Missing persistent
      deliveryMode: message.properties.deliveryMode,
      // Missing BCC

      contentType: message.properties.contentType,
      contentEncoding: message.properties.contentEncoding,
      priority: message.properties.priority,
      correlationId: message.properties.correlationId,
      replyTo: message.properties.replyTo,
      messageId: message.properties.messageId,
      timestamp: message.properties.timestamp,
      type: message.properties.type,
      appId: message.properties.appId,
    };
    // If exchange name is empty it's means that the message was pushed to queue directly
    // TODO - (I think need to check)
    if (message.fields.exchange === '') {
      await this.channel.sendToQueue(
        // From what I checked when the routing key is the queue name
        message.fields.routingKey,
        message.content,
        messageUpdatedOptions
      );
    } else {
      // TODO - Do we want to publish again to the exchange or just requeue
      await this.channel.publish(
        message.fields.exchange,
        message.fields.routingKey,
        message.content,
        messageUpdatedOptions
      );
    }

    this.channel.ack(message);
    this.emit('ack', message);
    this.emit(`ack:${queueName}`, message);
  }

  setRequeue(newValue) {
    this.requeue = newValue;
  }

  emit(eventName, ...args) {
    this.addNewlyEmittedToEventRecorder(eventName, ...args);

    return super.emit(eventName, ...args);
  }

  addNewlyEmittedToEventRecorder(eventName, ...args) {
    // Don't add this event to the recorder
    // TODO - Maybe we can change this so the ignored event name is not hard coded
    //        and we can set only wanted events using glob (e.g. ack:*) or something
    if (eventName === 'message-queue-event') {
      return;
    }

    // Already initialized with this event
    if (this.eventsRecorder && this.eventsRecorder[eventName]) {
      return;
    }

    // Stores all the MQ events in a local data structure so later
    // one query this

    this.eventsRecorder = this.eventsRecorder ?? {};

    this.eventsRecorder[eventName] = {
      count: 0,
      lastEventData: null,
      name: eventName,
    };

    // TODO - maybe remove this on and immediately update the event recorder
    // Although adding `.on` will add it in the end of the listeners array
    // and if we update the event recorder immediately here we executing it immediately
    this.on(eventName, (eventData) => {
      this.eventsRecorder[eventName].count++;
      this.eventsRecorder[eventName].lastEventData = eventData;

      this.emit('message-queue-event', {
        name: eventName,
        eventsRecorder: this.eventsRecorder,
      });
    });
  }

  /**
   * This function stores all the MQ events in a local data structure so later
   * one query this
   * @deprecated just emit regularity and it would work
   */
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
    if (this.records[eventName].count >= threshold) {
      resolve({
        name: eventName,
        lastEventData: this.records[eventName].lastEventData,
        count: this.records[eventName].count,
      });
    }
  }
}

module.exports = MessageQueueClient;
