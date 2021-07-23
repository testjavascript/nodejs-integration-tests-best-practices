// ❌ Anti-Pattern file: This code contains bad practices for educational purposes
const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/api');
const { getShortUnique } = require('./test-helper');

// ❌ Anti-Pattern: Test data is a global variable instead of being scoped inside tests
let axiosAPIClient, existingOrderId = 0, existingOrder;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  // ❌ Anti-Pattern: Adding global records which are mutated by the tests. This will lead to high coupling and flakiness
  existingOrder = await axiosAPIClient.post('/order', {
    userId: 1,
    mode: 'approved',
    externalIdentifier: `some-id-1`,
  });

  done();
});

beforeEach(() => {
  nock('http://localhost/user/')
    .get(`/1`)
    .reply(200, {
      id: 1,
      name: 'John',
    })
    .persist();
  nock('http://localhost').post('/mailer/send').reply(202).persist();
});

afterEach(async () => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
  done();
});

describe('/api', () => {
  describe('POST /orders', () => {
    test('When adding a new valid order, Then should get back HTTP 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `100-${getShortUnique()}`,
      };

      //Act
      const receivedAPIResponse = await axiosAPIClient.post(
        '/order',
        orderToAdd
      );
      existingOrderId = receivedAPIResponse.data.id;

      //Assert
      expect(receivedAPIResponse.status).toBe(200);
    });
  });

  describe('GET /order/:id', () => {
    test.only('When asked for an existing order, Then get back HTTP 200 response', async () => {
      //Arrange

      //Act
      // ❌ Anti-Pattern: This test relies on previous tests records and will fail when get executed alone
      const receivedResponse = await axiosAPIClient.get(
        `/order/${existingOrderId}`
      );

      //Assert
      expect(receivedResponse.status).toBe(200);
    });
  });

  describe('DELETE /order/:id', () => {
    test('When deleting for an existing order, Then should get back 204 HTTP status', async () => {
      //Arrange

      //Act
      // ❌ Anti-Pattern: This test relies on previous tests records and will fail when get executed alone
      const receivedResponse = await axiosAPIClient.delete(
        `/order/${existingOrderId}`
      );

      //Assert
      expect(receivedResponse.status).toBe(204);
    });
  });

  test('When updating an already dispatched order, then should get get conflict 409', () => {
    
  });

  describe('Get /order', () => {
    test('When calling get all, Then it returns 10 records', async () => {
      //Arrange

      //Act
      const receivedResponse = await axiosAPIClient.get();

      //Assert
      // ❌ Anti-Pattern: 👽 The mystery-visitor syndrome, something is affecting this test, but where is it?
      expect(receivedResponse.data.length).toBe(10);
    });

    // ❌ Anti-Pattern: Avoid assuming that only known records exist as other tests run in parallel
    // and might add more records to the table
    test.todo(
      'When adding 2 orders, then get two orders when querying for all'
    );

    // 🤔 Questionable-Pattern: Counting records in the DB. This means the test assuming it owns the
    // DB during the runtime
    test('When querying for all orders, then get all of them back', () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `some-external-id-2`,
      };
      await axiosAPIClient.post('/order',orderToAdd);
      await axiosAPIClient.post('/order',orderToAdd);

      //Act
      const receivedResponse = await axiosAPIClient.get();

      //Assert
      expect(receivedResponse.data.length).toBe(2);
    });
  });
});
