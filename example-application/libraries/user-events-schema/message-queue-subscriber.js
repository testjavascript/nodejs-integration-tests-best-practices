const { validateDeletionMessage } = require('./user-deleted-message-schema');

const subscribe = () => {
  messageQueueClient.subscribe('user.deleted', (userDeletedMessage) => {});
};

/**
 * @param {import('./user-deleted-message-schema').UserDeletionMessageSchema} userDeletedMessage
 */
const userDeletedMessageHandler = async (userDeletedMessage) => {};

const messageQueueClient = {
  subscribe: (queueName, onNewMessageCallback) => {
    onNewMessageCallback();
  },
};
