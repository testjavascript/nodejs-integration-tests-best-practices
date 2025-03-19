import { buildOrder } from '../order-data-factory';
import { testSetup } from '../setup/test-file-setup';

beforeAll(async () => {
  await testSetup.start({
    startAPI: true,
    disableNetConnect: true,
    includeTokenInHttpClient: true,
    mockGetUserCalls: true,
    mockMailerCalls: true,
  });
});

beforeEach(() => {
  testSetup.resetBeforeEach();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  testSetup.tearDownTestFile();
});

describe('POST /orders', () => {
  // ️️️✅ Best Practice: Check the new state
  // In a real-world project, this test can be combined with the previous test
  test('When adding a new valid order, Then should be able to retrieve it', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const {
      data: { id: addedOrderId },
    } = await testSetup.getHTTPClient().post('/order', orderToAdd);

    //Assert
    const getOrderResponse = await testSetup
      .getHTTPClient()
      .get(`/order/${addedOrderId}`);

    expect(getOrderResponse.data).toMatchObject({
      ...orderToAdd,
      id: addedOrderId,
    });
  });
});

describe('DELETE /order', () => {
  test.only('When deleting an existing order, Then it should NOT be retrievable', async () => {
    // Arrange
    const deletedOrder = (
      await testSetup.getHTTPClienForArrange().post('/order', buildOrder())
    ).data.id;
    const notDeletedOrder = (
      await testSetup.getHTTPClienForArrange().post('/order', buildOrder())
    ).data.id;

    // Act
    await testSetup.getHTTPClient().delete(`/order/${deletedOrder}`);

    // Assert
    const getDeletedOrderStatus = await testSetup
      .getHTTPClient()
      .get(`/order/${deletedOrder}`);
    const getNotDeletedOrderStatus = await testSetup
      .getHTTPClient()
      .get(`/order/${notDeletedOrder}`);
    expect(getDeletedOrderStatus.status).toBe(404);
    expect(getNotDeletedOrderStatus.status).toBe(200);
  });
});
