const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/entry-points/api');
const OrderRepository = require('../../../example-application/data-access/order-repository');

let expressApp, mailerNock;

beforeAll(async (done) => {
  expressApp = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls except for the api
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

beforeEach(() => {
  // ️️️✅ Best Practice: Define a sensible default for all the tests.
  // Otherwise, all tests must repeat this nock again and again
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  mailerNock = nock('http://mail.com').post('/send').reply(202);
});

afterEach(() => {
  // ️️️✅ Best Practice: Clean nock interceptors and sinon test-doubles between tests
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();

  // ️️️✅ Best Practice: Clean-up all nocks before the next file starts
  nock.enableNetConnect();
  done();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('POST /orders', () => {
    test('When order succeed, send mail to store manager', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';

      // ️️️✅ Best Practice: Intercept requests for 3rd party services to eliminate undesired side effects like emails or SMS
      // ️️️✅ Best Practice: Save the body when you need to make sure you call the external service as expected
      nock.removeInterceptor({
        hostname: 'mail.com',
        method: 'POST',
        path: '/send',
      });
      let emailPayload;
      nock('http://mail.com')
        .post('/send', (payload) => ((emailPayload = payload), true))
        .times(1)
        .reply(202);

      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      // ️️️✅ Best Practice: Assert that the app called the mailer service appropriately
      expect(emailPayload).toMatchObject({
        subject: expect.any(String),
        body: expect.any(String),
        recipientAddress: expect.stringMatching(
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
        ),
      });
    });

    test('When adding a new valid order , Then should get back 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      // ➿ Nock intercepts the request for users service as declared in the BeforeAll function
      const orderAddResult = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(200);
    });

    test('When the user does not exist, return http 404', async () => {
      //Arrange
      const orderToAdd = {
        userId: 7,
        productId: 2,
        mode: 'draft',
      };

      // ️️️✅ Best Practice: Simulate non-happy external services responses like 404, 422 or 500.
      // ✅ Best Practice: Override the default response with a custom scenario by triggering a unique path
      nock('http://localhost/user/').get(`/7`).reply(404, {
        message: 'User does not exist',
        code: 'nonExisting',
      });

      //Act
      const orderAddResult = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(404);
    });
  });
});
