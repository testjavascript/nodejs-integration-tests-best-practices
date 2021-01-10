const express = require("express");
const util = require("util");
const axios = require("axios");
const bodyParser = require("body-parser");
const OrderRepository = require("./data-access/order-repository");
const errorHandler = require("./error-handling").errorHandler;

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

  expressApp.use("/order", router);

  expressApp.use(async (err, req, res, next) => {
    if (typeof err === "object") {
      if (err.isTrusted === undefined || err.isTrusted === null) {
        err.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
      }
    }
    await errorHandler.handleError(err);
    res.status(500).end();
  });
};

process.on("uncaughtException", (error) => {
  errorHandler.handleError(error);
});

process.on("unhandledRejection", (reason, originPromise) => {
  errorHandler.handleError(reason);
});

module.exports = {
  initializeWebServer,
  stopWebServer,
};
