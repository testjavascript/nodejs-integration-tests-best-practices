const MessageQueueClient = require("../../example-application/libraries/message-queue-client");


beforeEach(async() => {
    const messageQueueClient = new MessageQueueClient();
    await messageQueueClient.purgeQueue('user.deleted');
    await setTimeout(1000);
    await messageQueueClient.purgeQueue('user.deleted');
});

test('When user deleted message arrives, then all corresponding orders are deleted', async() => {
    // Arrange
  const orderToAdd = {userId: 1, productId: 2, status: 'approved'};
  const addedOrderId = (await axiosAPIClient.post('/order', orderToAdd)).data.id;
  const messageQueueClient = new MessageQueueClient();
  await new QueueSubscriber(messageQueueClient, 'user.deleted').start();

  // Act
  await messageQueueClient.publish('user.events', 'user.deleted', {id: addedOrderId});

  // Assert
  let aQueryForDeletedOrder;
  await poller(10, () => {
    aQueryForDeletedOrder = await axiosAPIClient.get(`/order/${addedOrderId}`);
    if(aQueryForDeletedOrder.status === 404){
        return true;
    }
    return false;
    });
  expect(aQueryForDeletedOrder.status).toBe(404);
});


/**
 * @param  {number} frequency
 * @param  {Function} checkCompletion
 */
const poller = async (frequency, checkCompletion) => {
    
}