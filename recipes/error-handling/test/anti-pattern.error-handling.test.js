const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/entry-points/api');
const OrderRepository = require('../../../example-application/data-access/order-repository');
const {
  metricsExporter,
} = require('../../../example-application/error-handling');
const { AppError } = require('../../../example-application/error-handling');
const logger = require('../../../example-application/libraries/logger');

let axiosAPIClient;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls except for the Api-Under-Test
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

beforeEach(() => {
  // ️️️✅ Best Practice: Isolate the service under test by intercepting requests to 3rd party services
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
  nock('http://mailer.com').post('/send').reply(202);

  sinon.stub(process, 'exit');
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

describe('Error Handling', () => {
  // ⚠️ Warning: This by itself is a valid test that checks a requirement. However, one must go beyond planned
  // and known error types and responses and simulate unknown errors and the entire error handling flow
  test('When no user exists, Then get error status 404', async () => {
    //Arrange
    const orderToAdd = {
      userId: 0, // ❌ No such user
      productId: 2,
      mode: 'approved',
    };

    //Act
    const receivedResult = await axiosAPIClient.post('/order', orderToAdd);

    //Assert
    expect(receivedResult.status).toBe(404);
  });

  // ❌ Anti-Pattern: Just checking that some logging happened without verifying the existence
  // of imperative fields is not detailed enough
  test('When exception is throw during request, Then logger reports the error', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };
    // ️️️✅ Best Practice: Simulate also internal error
    sinon
      .stub(OrderRepository.prototype, 'addOrder')
      .rejects(new AppError('saving-failed', true));
    const loggerDouble = sinon.stub(logger, 'error');

    //Act
    await axiosAPIClient.post('/order', orderToAdd);

    //Assert
    // ❌ Check here the existence of imperative fields, not just that a function was called
    expect(loggerDouble.lastCall.firstArg).toEqual(expect.any(Object));
  });
});
