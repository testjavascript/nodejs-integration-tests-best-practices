const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');
const {
  MessageQueueStarter,
} = require('../../example-application/entry-points/message-queue-starter');
const { once } = require('events');
const { resolve } = require('path');

// Starts the message queue client with a fake MQ - Ideal for testing
module.exports.startFakeMessageQueue = async () => {
  const fakeMessageQueue = new FakeMessageQueueProvider();
  const messageQueueStarter = new MessageQueueStarter(fakeMessageQueue);
  await messageQueueStarter.start();
  return fakeMessageQueue;
};

// The fake message queue emits events which can make the test syntax cumbersome and based on callbacks
// This method returns a promise and will fire event from the MQ or a timeout
module.exports.getNextMQConfirmation = async (
  fakeMessageQueue,
  timeoutInMS = 500,
  eventName = 'message-handled'
) => {
  const timeout = new Promise((resolve) =>
    setTimeout(resolve.bind(this, { event: 'time-out' }), timeoutInMS)
  );
  const eventFromMQ = once(fakeMessageQueue, eventName);
  const errorFromMQ = new Promise((resolve, reject) => {
    fakeMessageQueue.on('error', (error) => {
      console.error(`Error caught from fake MQ`, error);
      resolve({ event: 'error' });
    });
  });

  return Promise.race([timeout, eventFromMQ, errorFromMQ]);
};
