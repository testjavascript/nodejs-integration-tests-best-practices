// ️️️✅ Best Practice: This file is a duplication of 'data-isolation.test.js' and aims to show that
// the two can run together simultaneously without interfering with each other thanks
// to the data isolation

const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');
const OrderRepository = require('../../example-application/data-access/order-repository');
const { getShortUnique } = require('./test-helper');

let expressApp;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();

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
      const receivedAPIResponse = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

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
      const receivedAPIResponse = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      //Assert
      expect(receivedAPIResponse.body.mode).toBe('approved');
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
        body: { id: existingOrderId },
      } = await request(expressApp).post('/order').send(orderToAdd);

      // Act
      const receivedResponse = await request(expressApp).get(
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
        body: { id: existingOrderId },
      } = await request(expressApp).post('/order').send(orderToAdd);

      // Act
      const receivedResponse = await request(expressApp).get(
        `/order/${existingOrderId}`
      );

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });
});
