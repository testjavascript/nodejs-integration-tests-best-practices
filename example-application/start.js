const { initializeWebServer } = require('./entry-points/api');
const {MessageQueueStarter} = require('./entry-points/message-queue-starter');

async function start() {
  await initializeWebServer();
  await new MessageQueueStarter().start();
}

start()
  .then(() => {
    console.log('The app has started successfully');
  })
  .catch((error) => {
    console.log('App occured during startup', error);
  });
