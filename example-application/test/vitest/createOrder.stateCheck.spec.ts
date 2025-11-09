import { buildOrder } from '../order-data-factory';
import { testSetup } from '../setup/test-file-setup';
import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from 'vitest';
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

  test('When editing an order, then the data is saved', async () => {
    //Arrange
    const orderToEdit = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };
    const {data: { id: editOrderId },} = await testSetup.getHTTPClient().post('/order', orderToEdit);
    orderToEdit.mode = 'rejected';

    //Act
    await testSetup.getHTTPClient().put(`/order/${editOrderId}`, orderToEdit);

    //Assert
    const orderAfterEdit = await testSetup.getHTTPClient()
      .get(`/order/${editOrderId}`);
    expect(orderAfterEdit.data.mode).toBe('rejected');
  });

  test('When editing an order, then only the edited fields are saved', async () => {
    //Arrange
    const orderToEdit = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };
    const {
      data: { id: editOrderId },
    } = await testSetup.getHTTPClient().post('/order', orderToEdit);
    const dataToEdit = getRandomEditSubset();
    const orderBeforeEdit = await testSetup.getHTTPClient()
      .get(`/order/${editOrderId}`);

    //Act
    await testSetup.getHTTPClient()
      .put(`/order/${editOrderId}`, { ...orderToEdit, ...dataToEdit });

    //Assert
    const orderAfterEdit = await testSetup.getHTTPClient()
      .get(`/order/${editOrderId}`);
    expect(orderAfterEdit.data).toMatchObject({
      ...orderBeforeEdit.data,
      ...dataToEdit,
    });
  });
});

describe('DELETE /order', () => {
  test('When deleting an existing order, Then it should NOT be retrievable', async () => {
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
function getRandomEditSubset : Partial<Order>() {
  throw new Error('Function not implemented.');
}

