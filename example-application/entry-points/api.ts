//@ts-nocheck
import bodyParser from 'body-parser';
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import util from 'util';
import orderService from '../business-logic/order-service';
import { errorHandler } from '../error-handling';
import { authenticationMiddleware } from '../libraries/authentication-middleware';

let connection: Server | null = null;

export const startWebServer = (): Promise<AddressInfo> => {
  return new Promise<AddressInfo>((resolve, reject) => {
    const expressApp = express();
    expressApp.use(
      bodyParser.urlencoded({
        extended: true,
      }),
    );
    expressApp.use(bodyParser.json());
    expressApp.use(authenticationMiddleware);
    defineRoutes(expressApp);
    // ️️️✅ Best Practice 8.13: Specify no port for testing, only in production
    // 📖 Read more at: bestpracticesnodejs.com/bp/8.13
    const webServerPort = process.env.PORT ? process.env.PORT : null;
    connection = expressApp.listen(webServerPort, () => {
      resolve(connection!.address() as AddressInfo);
    });
  });
};

export const stopWebServer = async () => {
  return new Promise<void>((resolve, reject) => {
    if (connection) {
      connection.close(() => {
        return resolve();
      });
    }
    return resolve();
  });
};

const defineRoutes = (expressApp: express.Application) => {
  const router = express.Router();

  // add new order
  router.post(
    '/',
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        console.log(
          `Order API was called to add new Order ${util.inspect(req.body)}`,
        );
        const addOrderResponse = await orderService.addOrder(req.body);
        return res.json(addOrderResponse);
      } catch (error) {
        next(error);
      }
    },
  );

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

  // update order by id
  router.put('/:id', async (req, res, next) => {
    try {
      console.log(`Order API was called to update order ${req.params.id} with ${util.inspect(req.body)}`);
      const updatedOrder = await orderService.updateOrder(req.params.id, req.body);
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });

  // delete order by id
  router.delete('/:id', async (req, res, next) => {
    console.log(`Order API was called to delete order ${req.params.id}`);
    await orderService.deleteOrder(req.params.id);
    res.status(204).end();
  });

  expressApp.use('/order', router);

  expressApp.use(
    //An error can be any unknown thing, this is why we're being careful here
    async (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (!error || typeof error !== 'object') {
        await errorHandler.handleError(error);
        return res.status(500).end();
      }
      const status = 'status' in error ? error.status : 500;
      const richError = error as Record<string, unknown>;
      if (!('isTrusted' in error)) {
        //Error during a specific request is usually not catastrophic and should not lead to process exit
        richError.isTrusted = true;
      }
      await errorHandler.handleError(richError);
      res.status(status as number).end();
    },
  );
};

process.on('uncaughtException', (error) => {
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
  errorHandler.handleError(reason);
});
