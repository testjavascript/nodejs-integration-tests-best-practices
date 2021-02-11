const request = require('supertest');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/entry-points/api');
const ordersData = require('./orders-data-for-paramterized-test.json');

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
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('POST /orders', () => {
    test.each(ordersData)(
      'When adding a new valid order, Then should get back 200 response',
      async (orderToAdd) => {
        //Act
        const receivedAPIResponse = await request(expressApp)
          .post('/order')
          .send(orderToAdd);
        //Assert
        const { status } = receivedAPIResponse;

        expect(status).toBe(200);
      }
    );
  });
});
