const mailer = require('./libraries/mailer');
const logger = require('./libraries/logger');

// This file simulates real-world error handler that makes this component observable
const errorHandler = {
  handleError: async (errorToHandle) => {
    try {
      logger.error(errorToHandle);
      metricsExporter.fireMetric('error', {
        errorName: errorToHandle.name || 'generic-error',
      });
      // This is used to simulate sending email to admin when an error occurs
      // In real world - The right flow is sending alerts from the monitoring system
      await mailer.send(
        'Error occured',
        `Error is ${errorToHandle}`,
        'admin@our-domain.io'
      );

      // A common best practice is to crash when an unknown error (non-trusted) is being thrown
      decideWhetherToCrash(errorToHandle);
    } catch (e) {
      // Continue the code flow if failed to handle the error
      console.log(`handleError threw an error ${e}`);
    }
  },
};

const decideWhetherToCrash = (error) => {
  if (!error.isTrusted) {
    process.exit();
  }
};

class AppError extends Error {
  constructor(name, message, HTTPStatus, isTrusted) {
    super(message);
    this.name = name;
    this.status = HTTPStatus;
    this.isTrusted = isTrusted === undefined ? true : false;
  }
}

// This simulates a typical monitoring solution that allow firing custom metrics when
// like Prometheus, DataDog, CloudWatch, etc
const metricsExporter = {
  fireMetric: async (name, labels) => {
    console.log('In real production code I will really fire metrics');
  },
};

module.exports.errorHandler = errorHandler;
module.exports.metricsExporter = metricsExporter;
module.exports.AppError = AppError;
