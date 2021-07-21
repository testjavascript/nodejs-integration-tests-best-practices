const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/api');
const OrderRepository = require('../../../example-application/data-access/order-repository');

let axiosAPIClient, mailerNock, userServiceNock;

beforeAll(async (done) => {
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  
  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls except for the api
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

beforeEach(() => {
  // ️️️✅ Best Practice: Define a sensible default for all the tests.
  // Otherwise, all tests must repeat this nock again and again
  userServiceNock = nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  mailerNock = nock('http://mailer.com').post('/send').reply(202);
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
        hostname: 'mailer.com',
        method: 'POST',
        path: '/send',
      });
      let emailPayload;
      nock('http://mailer.com')
        .post('/send', (payload) => ((emailPayload = payload), true))
        .times(1)
        .reply(202);

      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      await axiosAPIClient.post('/order', orderToAdd);

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
      const orderAddResult = await axiosAPIClient.post('/order', orderToAdd);

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
      const orderAddResult = await axiosAPIClient.post('/order', orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(404);
    });

    test('When order failed, send mail to admin', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';
      sinon
        .stub(OrderRepository.prototype, 'addOrder')
        .throws(new Error('Unknown error'));

      nock.removeInterceptor(mailerNock.interceptors[0])
      let emailPayload;
      nock('http://mailer.com')
        .post('/send', (payload) => ((emailPayload = payload), true))
        .reply(202);
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      await axiosAPIClient.post('/order', orderToAdd);

      //Assert
      // ️️️✅ Best Practice: Assert that the app called the mailer service appropriately with the right input
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
    // ✅ Best Practice: use "fake timers" to simulate long requests. 
    const clock = sinon.useFakeTimers();
    nock.removeInterceptor(userServiceNock.interceptors[0]);
    nock('http://localhost/user/')
      .get('/1', () => (clock.tick(5000)))
      .reply(200);

    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const response = await axiosAPIClient.post('/order', orderToAdd);
    
    //Assert
    expect(response.status).toBe(503);

    //Clean
    clock.uninstall();
  });

  test('When users service replies with 503 once and retry mechanism is applied, then an order is added successfully', async () => {
    //Arrange
    nock.removeInterceptor(userServiceNock.interceptors[0])
    nock('http://localhost/user/')
      .get('/1')
      .reply(503, undefined, { 'Retry-After': 100 });
    nock('http://localhost/user/')
      .get('/1')
      .reply(200);
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const response = await axiosAPIClient.post('/order', orderToAdd);

    //Assert
    expect(response.status).toBe(200);
  });
});
