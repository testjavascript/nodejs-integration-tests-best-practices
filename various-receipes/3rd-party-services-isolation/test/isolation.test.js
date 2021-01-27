const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/api');
const OrderRepository = require('../../../example-application/data-access/order-repository');

let expressApp;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();
  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls except for the api
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

beforeEach(() => {
  // ️️️✅ Best Practice: Isolate the service under test by intercepting requests to 3rd party services
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
});

afterEach(() => {
  // ️️️✅ Best Practice: Clean nock interceptors and sinon test-doubles between tests
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
    test('When adding  a new valid order , Then should get back 200 response', async () => {
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
      // ️️️✅ Best Practice: Simulate 3rd party service responses to test different scenarios like 404, 422 or 500.
      //                    Use specific params (like ids) to easily bypass the beforeEach interceptor.
      nock('http://localhost/user/').get(`/7`).reply(404, {
        message: 'User does not exist',
        code: 'nonExisting',
      });
      const orderToAdd = {
        userId: 7,
        productId: 2,
        mode: 'draft',
      };

      //Act
      const orderAddResult = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(404);
    });

    test('When order failed, send mail to admin', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';
      sinon
        .stub(OrderRepository.prototype, 'addOrder')
        .throws(new Error('Unknown error'));
      // ️️️✅ Best Practice: Intercept requests for 3rd party services to eliminate undesired side effects like emails or SMS
      // ️️️✅ Best Practice: Save the body when you need to make sure you call the 3rd party service as expected
      let emailPayload;
      nock('https://mailer.com')
        .post('/send', (payload) => ((emailPayload = payload), true))
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
  });

  test('When users service doesn\'t reply within 2 seconds, return 503', async () => {
    //Arrange
    nock.cleanAll();
    nock('http://localhost/user/')
      .get('/1')
      .delay(3000)
      .reply(200);
    nock('https://mailer.com')
      .post('/send')
      .reply(202);
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const response = await request(expressApp).post('/order').send(orderToAdd);
    
    //Assert
    expect(response.status).toBe(503);
  });

  test.only('When users service replies with 503, should retry the request', async () => {
    // Arrange
    nock.cleanAll();
    const firstRequest = nock('http://localhost/user/')
      .get('/1')
      .reply(503, undefined, { 'Retry-After': 100 });
    const secondRequest = nock('http://localhost/user/')
      .get('/1')
      .reply(200);
    nock('https://mailer.com')
      .post('/send')
      .reply(202);
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const response = await request(expressApp).post('/order').send(orderToAdd);

    //Assert
    expect(response.status).toBe(200);
    expect(firstRequest.isDone()).toBeTruthy();
    expect(secondRequest.isDone()).toBeTruthy();
  });
});
