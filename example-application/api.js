const express = require('express');
const util = require('util');
const axios = require('axios');
const bodyParser = require('body-parser');
const mailer = require('./libraries/mailer');
const OrderRepository = require('./data-access/order-repository');
const errorHandler = require('./error-handling').errorHandler;
const axiosRetry = require('axios-retry');
const { AppError } = require('./error-handling');

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

      // verify user existence by calling external Microservice
      const existingUserResponse = await getUserFromUsersService(
        req.body.userId
      );
      console.log(
        `Asked to get user and get response with status ${existingUserResponse}`
      );

      if (existingUserResponse.status !== 200) {
        res.status(existingUserResponse.status).end();
        return;
      }

      // save to DB (Caution: simplistic code without layers and validation)
      const DBResponse = await new OrderRepository().addOrder(req.body);

      if (process.env.SEND_MAILS === 'true') {
        await mailer.send(
          'New order was placed',
          `user ${DBResponse.userId} ordered ${DBResponse.productId}`,
          'admin@app.com'
        );
      }

      res.json(DBResponse);
    } catch (error) {
      next(error);
    }
  });

  // get existing order by id
  router.get('/:id', async (req, res, next) => {
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
    if (typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
      }
    }

    await errorHandler.handleError(error);

    res.status(error.status || 500).end();
  });
};

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});

async function getUserFromUsersService(userId) {
  try {
    const client = axios.create({
      validateStatus: function (status) {
        return status !== 503;
      },
    });
    axiosRetry(client, { retries: 3 });
    return await client.get(`http://localhost/user/${userId}`, {
      timeout: 2000,
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new AppError('http-service-unavailable', true, 503);
    } else {
      throw new AppError('http-request-error', true, 500);
    }
  }
}

module.exports = {
  initializeWebServer,
  stopWebServer,
};
