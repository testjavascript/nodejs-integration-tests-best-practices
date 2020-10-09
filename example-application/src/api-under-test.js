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
    expressApp.use(bodyParser.urlencoded({
      extended: true,
    }));
    expressApp.use(bodyParser.json());
    if (customMiddleware) {
      expressApp.use(customMiddleware);
    }
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}

const defineRoutes = (expressApp) => {
  const router = express.Router();

  // add new order
  router.post('/', async (req, res, next) => {
    try {
      console.log(`Order API was called to add new Order ${util.inspect(req.body)}`);

      // validation
      if (!req.body.productId) {
        res.status(400).end();

        return;
      }

      // verify user existence by calling external Microservice
      const existingUserResponse = (await axios.get(`http://localhost/user/${req.body.userId}`, {
        validateStatus: false,
      }));
      console.log(`Asked to get user and get response with status ${existingUserResponse.status}`)

      if (existingUserResponse.status === 404) {
        res.status(404).end();
        return;
      }

      // save to DB (Caution: simplistic code without layers and validation)
      const DBResponse = await new OrderRepository().addOrder(req.body);

      res.json(DBResponse);
    } catch (error) {
      next(error);
    }
  });


  // get existing order
  router.get('/', (req, res, next) => {
    res.json({
      a: 1
    });
  });

  expressApp.use('/order', router);

  expressApp.use((err, req, res, next) => {
    console.log(err);
    if (process.env.SEND_MAILS === 'true') {
      // important notification logic here
      mailer.send();

      // Other important notification logic here
    }
    res.status(500).end();
  });
}


process.on('uncaughtException', () => {
  // a log of other logic here
  console.log('Error occured!');
});

initializeWebServer();

module.exports = {
  initializeWebServer,
  stopWebServer
};