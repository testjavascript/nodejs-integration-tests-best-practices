const express = require('express');
const util = require('util');
const axios = require('axios');
const bodyParser = require('body-parser');
const mailer = require('./libraries/mailer');
const OrderRepository = require('./data-access/order-repository');

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
      const existingUserResponse = await axios.get(
        `http://localhost/user/${req.body.userId}`,
        {
          validateStatus: false,
        }
      );
      console.log(
        `Asked to get user and get response with status ${existingUserResponse.status}`
      );

      if (existingUserResponse.status === 404) {
        res.status(404).end();
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

  expressApp.use(async (err, req, res, next) => {
    console.log(err);
    if (process.env.SEND_MAILS === 'true') {
      // important notification logic here
      await mailer.send('Error', err.message, 'admin@app.com');

      // Other important notification logic here
    }
    res.status(500).end();
  });
};

process.on('uncaughtException', () => {
  // a log of other logic here
  console.log('Error occured!');
});

module.exports = {
  initializeWebServer,
  stopWebServer,
};
