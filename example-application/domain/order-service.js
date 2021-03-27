const axios = require('axios');

const OrderRepository = require('./../data-access/order-repository');
const AppError = require('./../error-handling').AppError;

const mailer = require('./../libraries/mailer');

module.exports = class OrderService {

    async getOrderById(id) {
        const response = await new OrderRepository().getOrderById(id);

        if (!response) {
            throw new AppError('non-existing-order', true);
        }

        return response;
    }

    async addOrder(order) {

        if (!order.productId) {
            throw new AppError('bad-order', true);
        }

        // verify user existence by calling external Microservice
        const existingUserResponse = await axios.get(
            `http://localhost/user/${order.userId}`,
            {
                validateStatus: false,
            }
        );
        console.log(
            `Asked to get user and get response with status ${existingUserResponse.status}`
        );

        if (existingUserResponse.status === 404) {
            throw new AppError('user-not-found', true);
        }

        // save to DB (Caution: simplistic code without layers and validation)
        const DBResponse = await new OrderRepository().addOrder(order);

        if (process.env.SEND_MAILS === 'true') {
            await mailer.send(
                'New order was placed',
                `user ${DBResponse.userId} ordered ${DBResponse.productId}`,
                'admin@app.com'
            );
        }

        return DBResponse;
    }

    async deleteOrderById(id) {
        await new OrderRepository().deleteOrder(id);
    }

};
