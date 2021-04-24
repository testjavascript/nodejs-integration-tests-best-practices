const express = require('express');
const util = require('util');
const bodyParser = require('body-parser');
const { wrapper } = require('./repository');

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
        const webServerPort = process.env.PORT ? process.env.PORT : null;
        connection = expressApp.listen(webServerPort, () => {
            resolve({ expressApp, wrapper });
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
        console.log(`Order API was called to add new Order ${util.inspect(req.body)}`);

        const DBResponse = await wrapper.repository().addOrder(req.body);
        res.json(DBResponse);
    });

    // get existing order by id
    router.get('/:id', async (req, res, next) => {
        console.log(`Order API was called to get user by id ${req.params.id}`);

        const response = await wrapper.repository().getOrderById(req.params.id);

        if (!response) {
            res.status(404).end();
            return;
        }

        res.json(response);
    });

    router.delete('/:id', async (req, res, next) => {
        console.log(`Order API was called to delete order ${req.params.id}`);

        await wrapper.repository().deleteOrder(req.params.id);
        res.status(204).end();
    });

    expressApp.use('/order', router);

    expressApp.use(async (error, req, res, next) => {
        if (typeof error === 'object') {
            if (error.isTrusted === undefined || error.isTrusted === null) {
                error.isTrusted = true; //Error during a specific request is usually not catastrophic and should not lead to process exit
            }
        }
        // await errorHandler.handleError(error);
        res.status(500).end();
    });
};

process.on('uncaughtException', (error) => {
    // errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason) => {
    // errorHandler.handleError(reason);
});

module.exports = {
    initializeWebServer,
    stopWebServer,
};
