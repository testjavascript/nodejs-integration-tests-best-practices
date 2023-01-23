const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');
const OrderRepository = require('../../example-application/data-access/order-repository');
const { getShortUnique } = require('./test-helper');

let axiosAPIClient;

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);
});

beforeEach(() => {
  nock('http://localhost/user/')
    .get(`/1`)
    .reply(200, {
      id: 1,
      name: 'John',
    })
    .persist();
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async () => {
  await stopWebServer();
  nock.enableNetConnect();

  // ️️️✅ Best Practice: Avoid cleaning-up the database after each test or afterAll
  // This will interfere with other tests that run in different processes
});

describe('/api', () => {
  describe('POST /orders', () => {
    test('When adding a new valid order, Then should get back 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
        // ️️️✅ Best Practice: Set unique value to unique fields so that tests writer wouldn't have to
        // read previous tests before adding a new one
        externalIdentifier: `100-${getShortUnique()}`, //unique value;
      };

      //Act
      const receivedAPIResponse = await axiosAPIClient.post(
        '/order',
        orderToAdd
      );

      //Assert
      expect(receivedAPIResponse.status).toBe(200);
    });

    test('When adding a new valid order, Then it should be approved', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
        externalIdentifier: `100-${getShortUnique()}`, //unique value
      };

      //Act
      const receivedAPIResponse = await axiosAPIClient.post(
        '/order',
        orderToAdd
      );

      //Assert
      expect(receivedAPIResponse.data.mode).toBe('approved');
    });

    it('When adding an invalid order, then it returns 400 and NOT retrievable', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        mode: 'draft',
        externalIdentifier: `100-${getShortUnique()}`, //unique value
      };

      //Act
      const { status: addingHTTPStatus } = await axiosAPIClient.post(
        '/order',
        orderToAdd
      );

      //Assert
      const { status: fetchingHTTPStatus } = await axiosAPIClient.get(
        `/order/externalIdentifier/${orderToAdd.externalIdentifier}`
      ); // Trying to get the order that should have fail early
      expect({ addingHTTPStatus, fetchingHTTPStatus }).toMatchObject({
        addingHTTPStatus: 400,
        fetchingHTTPStatus: 404,
      });
    });
  });
  describe('GET /order:/id', () => {
    test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      const existingOrder = await axiosAPIClient.post('/order', orderToAdd);

      // Act
      const receivedResponse = await axiosAPIClient.get(
        `/order/${existingOrder.data.id}`
      );

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });

  describe('Get /order', () => {
    // ️️️✅ Best Practice: Acknowledge that other unknown records might exist, find your expectations within
    // the result
    test.todo(
      'When adding 2 orders, then these orders exist in result when querying for all'
    );
  });
  describe('DELETE /order', () => {
    test('When deleting an existing order, Then it should NOT be retrievable', async () => {
      // Arrange
      const orderToDelete = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`,
      };
      const deletedOrder = (await axiosAPIClient.post('/order', orderToDelete))
        .data.id;
      const orderNotToBeDeleted = orderToDelete;
      orderNotToBeDeleted.externalIdentifier = `id-${getShortUnique()}`;
      const notDeletedOrder = (
        await axiosAPIClient.post('/order', orderNotToBeDeleted)
      ).data.id;

      // Act
      const deleteRequestResponse = await axiosAPIClient.delete(
        `/order/${deletedOrder}`
      );

      // Assert
      const getDeletedOrderStatus = (
        await axiosAPIClient.get(`/order/${deletedOrder}`)
      ).status;
      const getNotDeletedOrderStatus = (
        await axiosAPIClient.get(`/order/${notDeletedOrder}`)
      ).status;
      expect(getNotDeletedOrderStatus).toBe(200);
      expect(getDeletedOrderStatus).toBe(404);
      expect(deleteRequestResponse.status).toBe(204);
    });
  });
});
