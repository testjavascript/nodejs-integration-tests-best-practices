test('When multiple redundant discount messages arrive, then apply only one discount', async () => {
  // Arrange
  const messageQueueClient = new MessageQueueClient(
    new FakeMessageQueueProvider()
  );
  await new QueueConsumer(messageQueueClient, 'order.discount').start();

  const orderRequest = { userId: 1, productId: 2, status: 'approved' };
  const orderToApplyDiscount = (
    await axiosAPIClient.post('/order', orderRequest)
  ).data;
  await messageQueueClient.publish('order.events', 'order.discount', {
    orderId: orderToApplyDiscount.id,
    discountAmount: 50,
    discountId: 1,
  });

  // Act
  await messageQueueClient.publish('order.events', 'order.discount', {
    orderId: orderToApplyDiscount.id,
    discountAmount: 50,
    discountId: 1,
  });

  // Assert
  await messageQueueClient.waitFor('ack', 2);
  const orderAfterDiscount = await axiosAPIClient.get(
    `/order/${orderToApplyDiscount.id}`
  );
  expect(orderAfterDiscount.data.price).toBe(
    orderToApplyDiscount.data.price - 50
  );
});
