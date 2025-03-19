import nock from 'nock';
import sinon from 'sinon';
import OrderRepository from '../../data-access/order-repository';
import { testSetup } from '../setup/test-file-setup';

beforeAll(async () => {
  await testSetup.start({
    startAPI: true,
    disableNetConnect: true,
    includeTokenInHttpClient: true,
    mockGetUserCalls: true,
    mockMailerCalls: true,
  });
});

beforeEach(() => {
  testSetup.resetBeforeEach();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  testSetup.tearDownTestFile();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('POST /orders', () => {
    test('When order succeed, then send mail to store manager', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';

      // ️️️✅ Best Practice: Intercept requests for 3rd party services to eliminate undesired side effects like emails or SMS
      // ️️️✅ Best Practice: Save the body when you need to make sure you call the external service as expected
      testSetup.removeMailNock();
      let emailPayload;
      nock('http://mailer.com')
        .post('/send', (payload: undefined) => ((emailPayload = payload), true))
        .reply(202);

      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      // ️️️✅ Best Practice: Assert that the app called the mailer service with the right payload
      expect(emailPayload).toMatchObject({
        subject: expect.any(String),
        body: expect.any(String),
        recipientAddress: expect.stringMatching(
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        ),
      });
    });

    test('When the user does not exist, return http 404', async () => {
      //Arrange
      const orderToAdd = {
        userId: 7,
        productId: 2,
        mode: 'draft',
      };

      // ️️️✅ Best Practice: Simulate non-happy external services responses like 404, 422 or 500
      // ✅ Best Practice: Override the default response with a custom scenario by triggering a unique path
      nock('http://localhost/user/').get(`/7`).reply(404, undefined);

      //Act
      const orderAddResult = await testSetup
        .getHTTPClient()
        .post('/order', orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(404);
    });

    test('When order failed, send mail to admin', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';
      sinon
        .stub(OrderRepository.prototype, 'addOrder')
        .throws(new Error('Unknown error'));

      testSetup.removeMailNock();
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
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      // ️️️✅ Best Practice: Assert that the app called the mailer service appropriately with the right input
      expect(emailPayload).toMatchObject({
        subject: expect.any(String),
        body: expect.any(String),
        recipientAddress: expect.stringMatching(
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        ),
      });
    });
  });

  test("When users service doesn't reply and times out, then return 503", async () => {
    //Arrange
    // ✅ Best Practice: Let nock fail fast a timeout scenario (or use "fake timers" to simulate long requests withou actually slowing down the tests)
    process.env.HTTP_TIMEOUT = '2000';
    testSetup.removeUserNock();
    nock('http://localhost')
      .get('/user/1')
      .delay(3000)
      .reply(200, { id: 1, name: 'John' });
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const response = await testSetup.getHTTPClient().post('/order', orderToAdd);

    // //Assert
    expect(response.status).toBe(503);
  });

  //TODO: Fix a bug here
  test.skip('When users service replies with 503 once and retry mechanism is applied, then an order is added successfully', async () => {
    //Arrange
    testSetup.removeUserNock();
    nock('http://localhost/user/')
      .get('/1')
      .times(1)
      .reply(503, undefined, { 'Retry-After': '100' });
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
    const response = await testSetup.getHTTPClient().post('/order', orderToAdd);

    //Assert
    expect(response.status).toBe(200);
  });
});
