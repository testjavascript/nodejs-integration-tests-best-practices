const request = require('supertest');
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

let expressApp;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();
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
  nock('http://mail.com').post('/send').reply(202);

  sinon.stub(process, 'exit');
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

describe('Error Handling', () => {
  describe('Selected Examples', () => {
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
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      expect(loggerDouble.lastCall.firstArg).toEqual(expect.any(String));
    });

    test('When exception is throw during request, Then a metric is fired', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const errorToThrow = new AppError('example-error-name', true);

      // Arbitrarily choose an object that throws an error
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);
      const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');

      //Act
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      expect(
        metricsExporterDouble.calledWith('error', {
          errorName: 'example-error-name',
        })
      ).toBe(true);
    });

    test('When a non-trusted exception is throw, Then the process should exit', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };
      sinon.restore();
      const processExitListener = sinon.stub(process, 'exit');
      // Arbitrarily choose an object that throws an error
      const errorToThrow = new AppError('example-error-name', false);
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);

      //Act
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      expect(processExitListener.called).toBe(true);
    });

    test('When unknown exception is throw during request, Then its treated as trusted error and the process stays alive', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };
      sinon.restore();
      const processExitListener = sinon.stub(process, 'exit');
      // Arbitrarily choose an object that throws an error
      const errorToThrow = new Error('Something vague and unknown');
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);

      //Act
      await request(expressApp).post('/order').send(orderToAdd);

      //Assert
      expect(processExitListener.called).toBe(false);
    });
  });

  describe('Various Throwing Scenarios And Locations', () => {
    test.todo(
      "When an error is thrown during startup, then it's handled correctly"
    );
    test.todo(
      "When an error is thrown during web request, then it's handled correctly"
    );
    test.todo(
      "When an error is thrown during a queue message processing , then it's handled correctly"
    );
    test.todo(
      "When an error is thrown from a timer, then it's handled correctly"
    );
    test.todo(
      "When an error is thrown from a middleware, then it's handled correctly"
    );
  });

  describe('Various Error Types', () => {
    test.each`
      errorInstance                       | errorTypeDescription
      ${null}                             | ${'Null as error'}
      ${'This is a string'}               | ${'String as error'}
      ${1}                                | ${'Number as error'}
      ${{}}                               | ${'Object as error'}
      ${new Error('JS basic error')}      | ${'JS error'}
      ${new AppError('error-name', true)} | ${'AppError'}
    `(
      `When throwing $errorTypeDescription, Then it's handled correctly`,
      async ({ errorInstance }) => {
        //Arrange
        const orderToAdd = {
          userId: 1,
          productId: 2,
          mode: 'approved',
        };

        sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorInstance);
        const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');
        const loggerDouble = sinon.stub(logger, 'error');

        //Act
        await request(expressApp).post('/order').send(orderToAdd);

        //Assert
        expect(metricsExporterDouble.called).toBe(true);
        expect(loggerDouble.called).toBe(true);
      }
    );
  });
});
