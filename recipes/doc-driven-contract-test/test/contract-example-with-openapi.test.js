const path = require('path');
const axios = require('axios');
const nock = require('nock');
const jestOpenAPI = require('jest-openapi');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/entry-points/api');

jestOpenAPI(path.join(__dirname, '../../../example-application/openapi.json'));

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

afterEach(() => {
  nock.cleanAll();
});

afterAll(async () => {
  await stopWebServer();
});

describe('Verify openApi (Swagger) spec', () => {
  // ️️️✅ Best Practice: When testing the API contract/doc, write a test against each route and potential HTTP status
  describe('POST /orders', () => {
    test('When added a valid order and 200 was expected', async () => {
      nock('http://localhost/user/').get(`/1`).reply(200, {
        id: 1,
        name: 'John',
      });
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const res = await axiosAPIClient.post('/order', orderToAdd);

      // ️️️✅ Best Practice: When testing the API contract/doc
      expect(res).toSatisfyApiSpec();
    });

    test('When an invalid order was send, then error 400 is expected', async () => {
      // Arrange
      nock('http://localhost/user/').get(`/1`).reply(200, {
        id: 1,
        name: 'John',
      });
      const orderToAdd = {
        userId: 1,
        productId: undefined, //❌
        mode: 'approved',
      };

      // Act
      const receivedResponse = await axiosAPIClient.post('/order', orderToAdd);

      // Assert
      expect(receivedResponse).toSatisfyApiSpec();
      expect(receivedResponse.status).toBe(400);
    });

    test('When a call to the users microservice fails, then get back 404 error', async () => {
      nock('http://localhost/user/').get(`/1`).reply(404);
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const res = await axiosAPIClient.post('/order', orderToAdd);
    });
  });
});
