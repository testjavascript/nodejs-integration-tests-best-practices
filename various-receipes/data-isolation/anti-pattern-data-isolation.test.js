// ❌ Anti-Pattern file: This code contains bad practices for educational purposes
const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../../example-application/entry-points/api");
const OrderRepository = require("../../example-application/data-access/order-repository");

let expressApp, existingOrderId;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();

  // ❌ Anti-Pattern: Adding global records which are mutated by the tests. This will lead to high coupling and flakiness
  existingOrderId = (
    await request(expressApp)
      .post('/order')
      .send({ userId: 1, mode: 'approved' })
  ).body.id;

  done();
});

beforeEach(() => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://localhost').post('/mailer/send').reply(202);
});

afterEach(async () => {
  nock.cleanAll();
  sinon.restore();

  //await new OrderRepository().cleanup();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
  done();
});

describe('/api', () => {
  describe('POST /orders', () => {
    test('When adding a new valid order, Then should get back 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
        externalIdentifier: `some-external-${getShortUnique()}`, //unique value
      };

      //Act
      const receivedAPIResponse = await request(expressApp)
        .post('/order')
        .send(orderToAdd);
      existingOrderId = receivedAPIResponse.body.id;

      //Assert
      expect(receivedAPIResponse.status).toBe(200);
    });
  });

  describe('GET /order/:id', () => {
    test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
        externalIdentifier: `some-external-${getShortUnique()}`, //unique value
      };
      const receivedAPIResponse = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      //Act
      // ❌ Anti-Pattern: This test relies on previous tests records and will fail when get executed alone
      const receivedResponse = await request(expressApp).get(
        `/order/${receivedAPIResponse.body.id}`
      );

      //Assert
      expect(receivedResponse.status).toBe(200);
    });
  });

  describe('Get /order', () => {
    // ❌ Anti-Pattern: Avoid assuming that only known records exist as other tests run in parallel
    // and might add more records to the table
    test.todo(
      'When adding 2 orders, then get two orders when querying for all'
    );
  });
});
