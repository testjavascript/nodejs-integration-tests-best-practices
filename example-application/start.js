const { initializeWebServer } = require('./entry-points/api');
const { QueueConsumer } = require('./entry-points/message-queue-consumer');

async function start() {
  await initializeWebServer();
  await new QueueConsumer().start();
}

start()
  .then(() => {
    console.log('The app has started successfully');
  })
  .catch((error) => {
    console.log('App occured during startup', error);
  });
