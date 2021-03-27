const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const OrderService = require('./domain/order-service');
const errorHandler = require('./error-handling').errorHandler;

let connection;

const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
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
    defineRoutes(expressApp);
    // ️️️✅ Best Practice: Specify no port for testing, only in production
    const webServerPort = process.env.PORT ? process.env.PORT : null;
    connection = expressApp.listen(webServerPort, () => {
      resolve(expressApp);
    });
  });
};

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    });
  });
};

const defineRoutes = (expressApp) => {
  const router = express.Router();

  // add new order
  router.post('/', async (req, res, next) => {
    console.log(`Order API was called to add new Order ${util.inspect(req.body)}`);

    try {
      const response = await new OrderService().addOrder(req.body);
      res.json(response);
    } catch (error) {
      if (error.isTrusted) {
        if (error.name == 'bad-order') {
          res.status(400).end();
          return;
        }

        if (error.name == 'user-not-found') {
          res.status(404).end();
          return;
        }
      }

      next(error);
    }
  });

  // get existing order by id
  router.get('/:id', async (req, res, next) => {
    console.log(`Order API was called to get user by id ${req.params.id}`);
    
    try {
      const response = await new OrderService().getOrderById(req.params.id);
      res.json(response);
    } catch(error) {
      if (error.isTrusted) {
        if (error.name == 'non-existing-order') {
          res.status(404).end();
          return;
        }
      }

      next(error);
    }
    
  });

  router.delete('/:id', async (req, res, next) => {
    console.log(`Order API was called to delete order ${req.params.id}`);
    await new OrderService().deleteOrderById(req.params.id);
    res.status(204).end();
  });

  expressApp.use('/order', router);

  expressApp.use(async (error, req, res, next) => {
    if (typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true; // Error during a specific request is usually not catastrophic and should not lead to process exit
      }
    }
    await errorHandler.handleError(error);
    res.status(500).end();
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
