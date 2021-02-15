const {
  FakeMessageQueueProvider,
} = require('../../example-application/libraries/fake-message-queue-provider');
const {
  MessageQueueStarter,
} = require('../../example-application/entry-points/message-queue-starter');

module.exports.startFakeMessageQueue = async () => {
  const fakeMessageQueue = new FakeMessageQueueProvider();
  const messageQueueStarter = new MessageQueueStarter(fakeMessageQueue);
  await messageQueueStarter.start();
  return fakeMessageQueue;
};
