import { setTimeout } from 'timers/promises';
import sinon from 'sinon';
import OrderRepository from '../../data-access/order-repository';
import { AppError, metricsExporter } from '../../error-handling';
import * as logger from '../../libraries/logger';
import { testSetup } from '../setup/test-file-setup';
import { describe, test, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
let processExitStub: sinon.SinonStub;

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
  processExitStub = sinon.stub(process, 'exit');
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  testSetup.tearDownTestFile();
});

describe('Error Handling', () => {
  describe('Selected Examples', () => {
    test('When exception is throw during request, Then logger reports the mandatory fields', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      vi.spyOn(OrderRepository.prototype, 'addOrder').
        mockRejectedValue(new AppError('saving-failed', 'Order could not be saved', 500));
      //const loggerDouble = sinon.stub(logger, 'error');

      //Act
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      expect(loggerDouble.lastCall.firstArg).toMatchObject({
        name: 'saving-failed',
        status: 500,
        stack: expect.any(String),
        message: expect.any(String),
      });
    });

    test('When exception is throw during request, Then a metric is fired', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const errorToThrow = new AppError(
        'example-error',
        'some example message',
        500,
      );
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);
      const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');

      //Act
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      expect(
        metricsExporterDouble.calledWith('error', {
          errorName: 'example-error',
        }),
      ).toBe(true);
    });

    test('When a non-trusted exception is throw, Then the process should exit', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };
      processExitStub.restore();
      const processExitListener = sinon.stub(process, 'exit');
      const errorToThrow = new AppError(
        'saving-failed',
        'Order could not be saved',
        500,
        false, // ❌ Non-trusted error!
      );
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);

      //Act
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      expect(processExitListener.called).toBe(true);
    });

    test('When unknown exception is throw during request, Then the process stays alive', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };
      processExitStub.restore();
      const processExitListener = sinon.stub(process, 'exit');
      // Arbitrarily choose an object that throws an error
      const errorToThrow = new Error('Something vague and unknown');
      sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);

      //Act
      await testSetup.getHTTPClient().post('/order', orderToAdd);

      //Assert
      expect(processExitListener.called).toBe(false);
    });
  });
  describe('Various Throwing Scenarios And Locations', () => {
    test('When unhandled exception is throw, Then the logger+process exit reports correctly', async () => {
      vi.spyOn(logger, 'info');

    logger.info('Test message');

    expect(logger.info).toHaveBeenCalledWith('Test message');

    //Arrange
    const loggerDouble = vi.spyOn(logger, 'error');
    const errorToThrow = new Error('An error that wont be caught 😳');
    processExitStub.restore();
    const processExitListener = vi.spyOn(process, 'exit').mockImplementation(() => {});

    //Act
    process.emit('uncaughtException', errorToThrow);

    // Assert
    expect(loggerDouble).toHaveBeenCalled()
    expect(processExitListener).toHaveBeenCalled()
    });

    test.todo(
      "When an error is thrown during web request, then it's handled correctly",
    );
    test.todo(
      "When an error is thrown during a queue message processing , then it's handled correctly",
    );
    test.todo(
      "When an error is thrown from a timer, then it's handled correctly",
    );
    test.todo(
      "When an error is thrown from a middleware, then it's handled correctly",
    );
  });

  describe('Various Error Types', () => {
    test.skip.each`
      errorInstance                                       | errorTypeDescription
      ${null}                                             | ${'Null as error'}
      ${'This is a string'}                               | ${'String as error'}
      ${1}                                                | ${'Number as error'}
      ${{}}                                               | ${'Object as error'}
      ${new Error('JS basic error')}                      | ${'JS error'}
      ${new AppError('error-name', 'something bad', 500)} | ${'AppError'}
      ${'🐤'}                                             | ${'Small cute duck 🐤 as error'}
    `(
      `When throwing $errorTypeDescription, Then it's handled correctly`,
      async ({ errorInstance }) => {
        //Arrange
        const orderToAdd = {
          userId: 1,
          productId: 2,
          mode: 'approved',
        };
        vi.mock('../../data-access/order-repository', () => ({
          default: class {
            addOrder: (() => Promise<unknown>)
          }
        }));
        OrderRepository.prototype.addOrder = vi.fn().mockRejectedValue(errorInstance);
        //vi.spyOn(OrderRepository.prototype, 'addOrder').mockRejectedValue(errorInstance);
        const metricsExporterDouble = vi.spyOn(metricsExporter, 'fireMetric').mockImplementation(async() => {});
        const loggerDouble = vi.spyOn(logger, 'error').mockImplementation(async() => {});

        //Act
        await testSetup.getHTTPClient().post('/order', orderToAdd);

        //Assert
        expect(metricsExporterDouble).toHaveBeenCalled()
        expect(loggerDouble).toHaveBeenCalled()
      },
    );
  });
});
