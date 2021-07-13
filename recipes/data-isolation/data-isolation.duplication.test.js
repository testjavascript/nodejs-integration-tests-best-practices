// ️️️✅ Best Practice: This file is a duplication of 'data-isolation.test.js' and aims to show that
// the two can run together simultaneously without interfering with each other thanks
// to the data isolation

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

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  done();
});

beforeEach(() => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
  done();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('POST /orders', () => {
    test('When adding a new valid order, Then should get back 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
        externalIdentifier: `id-${getShortUnique()}`, //unique value
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
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };

      //Act
      const receivedAPIResponse = await axiosAPIClient.post(
        '/order',
        orderToAdd
      );

      //Assert
      expect(receivedAPIResponse.data.mode).toBe('approved');
    });
  });
  describe('GET /order', () => {
    test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      const {
        data: { id: existingOrderId },
      } = await axiosAPIClient.post('/order', orderToAdd);

      // Act
      const receivedResponse = await axiosAPIClient.get(
        `/order/${existingOrderId}`
      );

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });
  describe('DELETE /order', () => {
    test('When deleting an existing order, Then should get a successful message', async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      const {
        data: { id: existingOrderId },
      } = await axiosAPIClient.post('/order', orderToAdd);

      // Act
      const receivedResponse = await axiosAPIClient.get(
        `/order/${existingOrderId}`
      );

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });
});
