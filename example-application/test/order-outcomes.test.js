const axios = require('axios');
const sinon = require('sinon');
const { initializeWebServer, stopWebServer } = require('../entry-points/api');
const nock = require('nock');
const OrderRepository = require('../data-access/order-repository');

// Configuring file-level HTTP client with base URL will allow
// all the tests to approach with a shortened syntax
let axiosAPIClient;

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  process.env.SEND_MAILS = 'true';
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
});

beforeEach(() => {
  sinon.restore();
  nock.cleanAll();
  nock('http://mailer.com').post('/send').reply(200);
});


describe('/api', () => {
  describe('POST: /order', () => {
    test('When email fails, then response is HTTP 500', async () => {
      // Arrange
      nock.removeInterceptor({
        hostname: 'mailer.com',
        method: 'POST',
        path: '/send',
      });
      nock('http://mailer.com').post('/send').reply(500);

      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      // Act
      const newOrderResponse = await axiosAPIClient.post('/order', orderToAdd);

      // Assert
      expect(newOrderResponse.status).toBe(500);
    });

    test.only('When having duplicated order, then get back HTTP 409 conflict', async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        orderId: 4,
        productId: 2,
        mode: 'approved',
      };
      await axiosAPIClient.post('/order', orderToAdd);

      // Act
      const receivedResult = await axiosAPIClient.post('/order', orderToAdd);

      // Assert
      const received = [{ a: 2 }];
      expect(received).toContainEqual({ a: 1 });
    });

    test('When user service replies with 500 twice and circuit breaker is on, then the order is saved finally', async () => {
      // Arrange
      nock.removeInterceptor({
        hostname: 'localhost',
        method: 'GET',
        path: '/user/1',
      });
      nock('http://localhost/user/').get('/1').times(2).reply(500, undefined);
      nock('http://localhost/user/').get('/1').reply(200, {
        id: 1,
        name: 'John',
      });
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      // Act
      const receivedResponse = await axiosAPIClient.post('/order', orderToAdd);

      // Assert
      expect(receivedResponse.status).toBe(200);
    });

    test('When a valid order is accepted, then send mail to store manager', async () => {
      // Arrange
      nock.removeInterceptor({
        hostname: 'mailer.com',
        method: 'POST',
        path: '/send',
      });
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };
      await axiosAPIClient.post('/order', orderToAdd);
      let mailPayload;
      const mailerHTTPCall = nock('http://mailer.com')
        .post('/send', (payload) => {
          mailPayload = payload;
        })
        .reply(200);

      // Act
      await axiosAPIClient.post('/order', orderToAdd);

      // Assert
      expect(mailPayload).toMatchObject({
        subject: expect.any(String),
        body: expect.any(String),
        recipientAddress: expect.stringMatching(
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
        ),
      });
    });


  });

  test("When users service doesn't reply, return 503", async () => {
    //Arrange
    const clock = sinon.useFakeTimers();
    nock.removeInterceptor({
      hostname: 'localhost',
      method: 'GET',
      path: '/user/1',
    });
    nock('http://localhost/user/')
      .get('/1', () => clock.tick(5000))
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

  test('When users service replies with 500 twice and retry mechanism is applied, then an order is added successfully', async () => {
    //Arrange
    nock.removeInterceptor({
      hostname: 'localhost',
      method: 'GET',
      path: '/user/1',
    });
    nock('http://localhost/user/').get('/1').times(2).reply(500, undefined);
    nock('http://localhost/user/').get('/1').reply(200, {
      id: 1,
      name: 'John',
    });
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const receivedResponse = await axiosAPIClient.post('/order', orderToAdd);

    //Assert
    expect(receivedResponse.status).toBe(200);
  });
});
