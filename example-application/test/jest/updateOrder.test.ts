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
  testSetup.tearDownTestFile();
});

describe('PUT /order/:id', () => {
  test('When updating an existing order with valid data, Then should return updated order', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = {
      totalPrice: 150,
      mode: 'pending',
      contactEmail: 'updated@example.com'
    };

    // Act
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data).toMatchObject({
      id: createdOrder.id,
      userId: originalOrder.userId,
      productId: originalOrder.productId,
      isPremiumUser: originalOrder.isPremiumUser,
      externalIdentifier: originalOrder.externalIdentifier,
      ...updates,
    });
  });

  test('When updating premium user order with new price, Then should apply discount', async () => {
    // Arrange
    const originalOrder = buildOrder({ isPremiumUser: true, totalPrice: 100 });
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { totalPrice: 200 };

    // Act
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.totalPrice).toBe(180); // 200 * 0.9 = 180
  });

  test('When updating order to premium user, Then existing price should not change', async () => {
    // Arrange
    const originalOrder = buildOrder({ isPremiumUser: false, totalPrice: 100 });
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { isPremiumUser: true };

    // Act
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.totalPrice).toBe(100); // Price unchanged since totalPrice not updated
    expect(updateResponse.data.isPremiumUser).toBe(true);
  });

  test('When updating both price and premium status, Then should apply discount', async () => {
    // Arrange
    const originalOrder = buildOrder({ isPremiumUser: false, totalPrice: 100 });
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { isPremiumUser: true, totalPrice: 200 };

    // Act
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);

    // Assert
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.totalPrice).toBe(180); // 200 * 0.9 = 180
    expect(updateResponse.data.isPremiumUser).toBe(true);
  });

  test('When updated order can be retrieved, Then should return the updated data', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { mode: 'cancelled', contactEmail: 'cancelled@example.com' };

    // Act
    await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);
    
    // Assert - verify state persistence
    const getResponse = await testSetup.getHTTPClient().get(`/order/${createdOrder.id}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data).toMatchObject({
      id: createdOrder.id,
      userId: originalOrder.userId,
      productId: originalOrder.productId,
      isPremiumUser: originalOrder.isPremiumUser,
      externalIdentifier: originalOrder.externalIdentifier,
      ...updates,
    });
  });
});

describe('PUT /order/:id - Validation Tests', () => {
  test('When updating non-existent order, Then should return 404', async () => {
    // Arrange
    const nonExistentId = 99999;
    const updates = { mode: 'pending' };

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${nonExistentId}`, updates);
    expect(updateResponse.status).toBe(404);
  });

  test('When updating with empty data, Then should return 400', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, {});
    expect(updateResponse.status).toBe(400);
  });

  test('When trying to update order ID, Then should return 400', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { id: 12345, mode: 'pending' };

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);
    expect(updateResponse.status).toBe(400);
  });

  test('When updating with empty productId, Then should return 400', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { productId: null };

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);
    expect(updateResponse.status).toBe(400);
  });

  test('When updating with non-existent userId, Then should return 404', async () => {
    // Arrange
    const originalOrder = buildOrder();
    const { data: createdOrder } = await testSetup.getHTTPClienForArrange().post('/order', originalOrder);
    const updates = { userId: 99999 };

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put(`/order/${createdOrder.id}`, updates);
    expect(updateResponse.status).toBe(404);
  });

  test('When updating without order ID in URL, Then should return 404', async () => {
    // Arrange
    const updates = { mode: 'pending' };

    // Act & Assert
    const updateResponse = await testSetup.getHTTPClient().put('/order/', updates);
    expect(updateResponse.status).toBe(404); // Express returns 404 for missing route parameter
  });
});