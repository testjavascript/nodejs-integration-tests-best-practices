// ❌ Anti-Pattern file: This code contains bad practices for educational purposes
const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/entry-points/api');
const OrderRepository = require('../../../example-application/data-access/order-repository');

let expressApp;

beforeAll(async (done) => {
  expressApp = await initializeWebServer();

  // ❌ Anti-Pattern: By default, we allow outgoing network calls -
  // If some unknown code locations will issue HTTP request - It will passthrough out
  done();
});

beforeEach(() => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  // ❌ Anti-Pattern: There is no default behaviour for the users and email external service, if one test forgets to define a nock than
  // there will be an outgoing call
});

afterEach(() => {
  // ❌ Anti-Pattern: No clean-up for the network interceptions, the next test will face the same behaviour
  sinon.restore();
});

afterAll(async (done) => {
  await stopWebServer();

  done();
});

describe('/api', () => {
  describe('POST /orders', () => {
    test('When order succeed, send mail to store manager', async () => {
      //Arrange
      process.env.SEND_MAILS = 'true';

      // ❌ Anti-Pattern: The call will succeed regardless if the input, even if no mail address will get provided
      // We're not really simulating the integration data
      const emailHTTPCall = nock('http://mail.com').post('/send').reply(202);
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      expect(emailHTTPCall.isDone()).toBe(true);
    });
  });
});

// ❌ Anti-Pattern: We didn't test the scenario where the mailer reply with error
// ❌ Anti-Pattern: We didn't test the scenario where the mailer does not reply (timeout)
// ❌ Anti-Pattern: We didn't test the scenario where the mailer reply slowly (delay)
// ❌ Anti-Pattern: We didn't test the scenario of occasional one-time response failure which can be mitigated with retry
// ❌ Anti-Pattern: We didn't test that WE send the right payload
// ❌ Anti-Pattern: We have no guarantee that we covered all the outgoing network calls
