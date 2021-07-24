const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const mailer = require('./libraries/mailer');
const OrderRepository = require('./data-access/order-repository');
const errorHandler = require('./error-handling').errorHandler;
const { AppError } = require('./error-handling');

let connection;

const client = axios.create();
axiosRetry(client, { retries: 3 });

const initializeWebServer = customMiddleware => {
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

const defineRoutes = expressApp => {
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
      try {
        const user = await getUserFromUsersService(req.body.userId);
      } catch (error) {
        const { response } = error;
    
        if (response && response.status === 404) {
          res.status(404).end();
          return;
        }

        if (error?.code === 'ECONNABORTED') {
          throw new AppError(error.code, {
            status: 503
          });
        }

        throw error;
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

async function getUserFromUsersService(userId) {
  return await client.get(
    `http://localhost/user/${userId}`,
    {
      timeout: 2000,
    }
  );
}

module.exports = {
  initializeWebServer,
  stopWebServer,
};
