const amqplib = require('amqplib');
const { EventEmitter } = require('events');

let channel, connection;
let isReady = false;

// This is a simplistic client for a popular message queue product - RabbitMQ
// It's generic in order to be used by any service in the organization
class MessageQueueClient extends EventEmitter {
  constructor(customMessageQueueProvider) {
    super();

    if (customMessageQueueProvider) {
      this.messageQueueProvider = customMessageQueueProvider;
    } else {
      this.messageQueueProvider = amqplib;
    }
    console.log('Client-constuctor', this.messageQueueProvider);
  }

  setMessageQueueProvider(customMessageQueueProvider) {
    this.messageQueueProvider = customMessageQueueProvider;
  }

  async connect() {
    const connectionProperties = {
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      username: 'rabbitmq',
      password: 'rabbitmq', // This is a demo app, no security considerations. This is the password for the local dev server
      locale: 'en_US',
      frameMax: 0,
      heartbeat: 0,
      vhost: '/',
    };
    connection = await this.messageQueueProvider.connect(connectionProperties);
    channel = await connection.createChannel();
    isReady = true;
  }

  async close() {
    if (connection) {
      await connection.close();
    }
    return;
  }

  async sendMessage(queueName, message) {
    if (!isReady) {
      await this.connect();
    }
    await channel.assertQueue(queueName);
    const sendResponse = await channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message))
    );

    return sendResponse;
  }

  async consume(queueName, onMessageCallback) {
    if (!isReady) {
      await this.connect();
    }
    channel.assertQueue(queueName);
    console.log('Client-consume start');

    await channel.consume(queueName, async (theNewMessage) => {
      console.log('Client msg arrived', theNewMessage, onMessageCallback);
      //Not awaiting because some MQ client implementation get back to fetch messages again only after handling a message
      onMessageCallback(theNewMessage.content.toString())
        .then(() => {
          // ️️️✅ Best Practice: Emit events from the message queue client/wrapper to facilitate testing and metrics
          this.emit('handled-successfully');
          channel.ack(theNewMessage);
          this.emit('message-acknowledged');
        })
        .catch((error) => {
          console.log('Client-error', error);
          this.emit('handling-failure');
          channel.nack(theNewMessage);
          this.emit('message-rejected');
          throw error;
        });
    });

    return;
  }
}

module.exports = MessageQueueClient;
