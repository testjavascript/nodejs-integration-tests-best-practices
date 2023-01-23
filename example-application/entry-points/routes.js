const util = require('util');
const express = require('express');
const orderService = require('../business-logic/order-service');
const OrderRepository = require('../data-access/order-repository');
const { errorHandler, AppError } = require('../error-handling');

module.exports.defineRoutes = (expressApp) => {
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

  // get existing order by external identifier (a field that lets caller assign some unique value to their order)
  router.get(
    '/externalIdentifier/:externalIdentifier',
    async (req, res, next) => {
      console.log(
        `Order API was called to get order by external identifier ${req.params.externalIdentifier}`
      );
      const response = await orderService.getOrderByExternalIdentifier(
        req.params.externalIdentifier
      );

      if (!response) {
        res.status(404).end();
        return;
      }

      res.json(response);
    }
  );

  // delete order by id
  router.delete('/:id', async (req, res, next) => {
    console.log(`Order API was called to delete order ${req.params.id}`);
    await orderService.deleteOrder(req.params.id);
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
