const amqplib = require('amqplib');
const { EventEmitter } = require('events');

let channel, connection;
let isReady = false;

// This is a simplistic client for a popular message queue product - RabbitMQ
// It's generic in order to be used by any service in the organization
class MessageQueueClient extends EventEmitter {
  constructor() {
    super();
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
    connection = await amqplib.connect(connectionProperties);
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

    await channel.consume(queueName, async (theNewMessage) => {
      onMessageCallback(theNewMessage.content.toString()).then(() => {
        this.emit('message-handled');
        channel.ack(theNewMessage);
      });
    });

    return;
  }
}

module.exports = new MessageQueueClient();
