const express = require('express');
const bodyParser = require('body-parser');
const { errorHandler, AppError } = require('../error-handling');
const routes = require('./routes');

let connection;

const initializeWebServer = (customMiddleware) => {
  return new Promise((resolve, reject) => {
    try {
      // A typical Express setup
      expressApp = express();
      expressApp.use(
        bodyParser.urlencoded({
          extended: true,
        })
      );
      expressApp.use(bodyParser.json());
      if (customMiddleware) {
        expressApp.use(customMiddleware);
      }
      routes.defineRoutes(expressApp);
      // ️️️✅ Best Practice 8.13: Specify no port for testing, only in production
      // 📖 Read more at: bestpracticesnodejs.com/bp/8.13
      const webServerPort = process.env.PORT ? process.env.PORT : null;
      connection = expressApp.listen(webServerPort, () => {
        resolve(connection.address());
      });
    } catch (error) {
      const catastrophicError = new AppError(
        'initialization-failure',
        'An error occurred while trying to initialize the web server',
        500,
        false
      );
      errorHandler.handleError(catastrophicError).then(() => {
        return reject(error);
      });
    }
  });
};

const stopWebServer = () => {
  return new Promise((resolve, reject) => {
    if (connection) {
      connection.close(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
};

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

module.exports = {
  initializeWebServer,
  stopWebServer,
};
