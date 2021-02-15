const express = require('express');
const util = require('util');
const axios = require('axios');
const bodyParser = require('body-parser');
const mailer = require('../libraries/mailer');
const OrderRepository = require('../data-access/order-repository');
const errorHandler = require('../error-handling').errorHandler;
const MessageQueueClient = require('../libraries/message-queue-client');

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
    try {
      console.log(
        `Order API was called to add new Order ${util.inspect(req.body)}`
      );

      // validation
      if (!req.body.productId) {
        res.status(400).end();
        return;
      }

      console.log('API before user');
      // verify user existence by calling external Microservice
      const existingUserResponse = await axios.get(
        `http://localhost/user/${req.body.userId}`,
        { validateStatus: false }
      );

      if (existingUserResponse.status === 404) {
        res.status(404).end();
        return;
      }

      const responseToCaller = await new OrderRepository().addOrder(req.body);

      if (process.env.SEND_MAILS === 'true') {
        await mailer.send(
          'New order was placed',
          `user ${responseToCaller.userId} ordered ${responseToCaller.productId}`,
          'admin@app.com'
        );
      }

      // We should notify others that a new order was added - Let's put a message in a queue
      new MessageQueueClient().sendMessage('new-order', req.body);

      res.json(responseToCaller);
    } catch (error) {
      next(error);
    }
  });

  // get existing order by id
  router.get('/:id', async (req, res, next) => {
    console.log(`Order API was called to get user by id ${req.params.id}`);
    const response = await new OrderRepository().getOrderById(req.params.id);

    if (!response) {
      res.status(404).end();
      return;
    }

    res.json(response);
  });

  router.delete('/:id', async (req, res, next) => {
    console.log(`Order API was called to delete order ${req.params.id}`);
    await new OrderRepository().deleteOrder(req.params.id);
    res.status(204).end();
  });

  expressApp.use('/order', router);

  expressApp.use(async (error, req, res, next) => {
    console.log('error', error);
    if (typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
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
