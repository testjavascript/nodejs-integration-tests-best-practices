const MessageQueueClient = require("../../example-application/libraries/message-queue-client");

beforeEach(() => {
    await MessageQueueClient.purgeQueue('user.deleted');
    await setTimeout(1000);
    await MessageQueueClient.purgeQueue('user.deleted');
});

test('When user deleted message arrives, then all corresponding orders are deleted', () => {
    // Arrange
  const orderToAdd = {userId: 1, productId: 2, status: 'approved'};
  const addedOrderId = (await axiosAPIClient.post('/order', orderToAdd)).data.id;

  // Act
  await new MessageQueueClient.publish('user.events', 'user.deleted', {id: addedOrderId});

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