const express = require("express");
const util = require("util");
const axios = require("axios");
const bodyParser = require("body-parser");
const mailer = require("./libraries/mailer");
const OrderRepository = require("./data-access/order-repository");
const PubsubHandler = require("../various-receipes/message-queue/src/pubsub");
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
  const pubsubRouter = express.Router();
  // add new order
  router.post("/", async (req, res, next) => {
    try {
      console.log(`Order API was called to add new Order ${util.inspect(req.body)}`);

      // validation
      if (!req.body.productId) {
        res.status(400).end();

        return;
      }

      // verify user existence by calling external Microservice
      const existingUserResponse = await axios.get(`http://localhost/user/${req.body.userId}`, {
        validateStatus: false,
      });
      console.log(`Asked to get user and get response with status ${existingUserResponse.status}`);

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
  router.get("/", (req, res, next) => {
    res.json({
      a: 1,
    });
  });

  /**
   * Pubsub API
   */

  const topicName = 'test-topic';
  const subscriptionName = 'test-subscription';
  const pubsubHandler = new PubsubHandler();
  const instanceMessages = [];

  // send a message to the pubsub
  pubsubRouter.post('/emit', async (req, res, next) => {
    try {
      console.log(`Pubsub API was called to emit a new message ${util.inspect(req.body)}`);
      // validation
      const message = req.body.message;
      if (!message) {
        res.status(400).end();

        return;
      }

      const response = await pubsubHandler.emitMessage(message, topicName);

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  pubsubRouter.get('/messages', async (req, res, next) => {
    try {
      console.log('Pubsub API was called to listen for new messages');

      const opts = {
        onMessage(message) {
          instanceMessages.push(JSON.parse(message.data));
        },
        options: {
          autoAck: true,
        },
      }
      await pubsubHandler.listen(topicName, subscriptionName, opts);

      res.json(instanceMessages);
    } catch (error) {
      next(error);
    }
  });

  expressApp.use('/pubsub', pubsubRouter);
  /**
   * End of pubsub API
   */

  expressApp.use("/order", router);

  expressApp.use((err, req, res, next) => {
    console.log(err);
    if (process.env.SEND_MAILS === "true") {
      // important notification logic here
      mailer.send();

      // Other important notification logic here
    }
    res.status(500).end();
  });
};

process.on("uncaughtException", () => {
  // a log of other logic here
  console.log("Error occured!");
});

initializeWebServer();

module.exports = {
  initializeWebServer,
  stopWebServer,
};
