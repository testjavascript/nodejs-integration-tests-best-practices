const amqplib = require('amqplib');
const { send } = require('./mailer');
const { EventEmitter } = require('events');

let channel, connection;
let isReady = false;

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
      password: 'rabbitmq', // This is a demo app, not security considerations
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
    console.log('2.5', sendResponse);

    return sendResponse;
  }

  async consume(queueName, onMessageCallback) {
    if (!isReady) {
      await this.connect();
    }
    console.log('0.1');
    channel.assertQueue(queueName);
    console.log('0.2', queueName);

    await channel.consume(queueName, async (theNewMessage) => {
      console.log('Client just asked to consume')
      await onMessageCallback(theNewMessage.content.toString());
      this.emit('message-handled');
      console.log('after callaback ');
      channel.ack(theNewMessage);
    });

    return;
  }
}

module.exports = new MessageQueueClient();
