const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const OrderRepository = require('../data-access/order-repository');
const errorHandler = require('../error-handling').errorHandler;
const orderService = require('../business-logic/order-service');

let connection;

const initializeWebServer = (customMiddleware) => {
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
    // ️️️✅ Best Practice 8.13: Specify no port for testing, only in production
    // 📖 Read more at: bestpracticesnodejs.com/bp/8.13
    const webServerPort = process.env.PORT ? process.env.PORT : null;
    connection = expressApp.listen(webServerPort, () => {
      resolve(connection.address());
    });
  });
};

const stopWebServer = () => {
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
    try {
      console.log(
        `Order API was called to add new Order ${util.inspect(req.body)}`
      );
      const addOrderResponse = await orderService.addOrder(req.body);
      return res.json(addOrderResponse);
    } catch (error) {
      next(error);
    }
  });

  // get existing order by id
  router.get('/:id', async (req, res, next) => {
    console.log(`Order API was called to get order by id ${req.params.id}`);
    const response = await orderService.getOrder(req.params.id);

    if (!response) {
      res.status(404).end();
      return;
    }

    res.json(response);
  });

  // delete order by id
  router.delete('/:id', async (req, res, next) => {
    console.log(`Order API was called to delete order ${req.params.id}`);
    await orderService.deleteOrder(req.params.id);
    res.status(204).end();
  });

  // get orders by user id
  router.get('/byUserId/:id', async (req, res, next) => {
    console.log(
      `Order API was called to get orders by user id ${req.params.id}`
    );
    const response = await orderService.getOrdersByUserId(req.params.id);

    res.json(response);
  });

  expressApp.use('/order', router);

  expressApp.use(async (error, req, res, next) => {
    if (typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
      }
    }
    await errorHandler.handleError(error);

    res.status(error?.status || 500).end();
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
