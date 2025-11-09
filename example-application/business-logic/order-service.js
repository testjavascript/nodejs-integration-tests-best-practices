const util = require('util');
const axios = require('axios').default;
const mailer = require('../libraries/mailer');
const axiosRetry = require('axios-retry').default;
const OrderRepository = require('../data-access/order-repository');
const { AppError } = require('../error-handling');
const MessageQueueClient = require('../libraries/message-queue-client');
const { AxiosError } = require('axios');

const axiosHTTPClient = axios.create({});

module.exports.addOrder = async function (newOrder) {
  // validation
  if (!newOrder.productId) {
    throw new AppError('invalid-order', `No product-id specified`, 400);
  }

  // verify user existence by calling external Microservice
  const userWhoOrdered = await getUserFromUsersService(newOrder.userId);
  console.log('userWhoOrdered', userWhoOrdered);
  if (!userWhoOrdered) {
    console.log('The user was not found');
    throw new AppError(
      'user-doesnt-exist',
      `The user ${newOrder.userId} doesnt exist`,
      404,
    );
  }

  // A little logic to calculate the total price
  if (newOrder.isPremiumUser) {
    newOrder.totalPrice = Math.ceil(newOrder.totalPrice * 0.9);
  }

  // save to DB (Caution: simplistic code without layers and validation)
  const DBResponse = await new OrderRepository().addOrder(newOrder);

  console.log('DBResponse', DBResponse);
  if (process.env.SEND_MAILS === 'true') {
    await mailer.send(
      'New order was placed',
      `user ${DBResponse.userId} ordered ${DBResponse.productId}`,
      'admin@app.com',
    );
  }

  // We should notify others that a new order was added - Let's put a message in a queue
  await new MessageQueueClient().publish(
    'order.events',
    'order.events.new',
    newOrder,
  );

  return DBResponse;
};

module.exports.deleteOrder = async function (id) {
  return await new OrderRepository().deleteOrder(id);
};

module.exports.getOrder = async function (id) {
  return await new OrderRepository().getOrderById(id);
};

module.exports.updateOrder = async function (id, orderUpdates) {
  await validateUpdateRequest(id, orderUpdates);
  
  const existingOrder = await getExistingOrder(id);
  await validateUserIfUpdated(orderUpdates, existingOrder);
  
  const processedUpdates = applyBusinessLogic(orderUpdates, existingOrder);
  
  return await new OrderRepository().updateOrder(id, processedUpdates);
};

async function validateUpdateRequest(id, orderUpdates) {
  if (!id) {
    throw new AppError('invalid-id', 'No order ID specified', 400);
  }

  if (!orderUpdates || Object.keys(orderUpdates).length === 0) {
    throw new AppError('invalid-update', 'No update data provided', 400);
  }

  if (orderUpdates.id !== undefined) {
    throw new AppError('invalid-field', 'Cannot update order ID', 400);
  }

  if (orderUpdates.productId !== undefined && !orderUpdates.productId) {
    throw new AppError('invalid-order', 'Product ID cannot be empty', 400);
  }
}

async function getExistingOrder(id) {
  const existingOrder = await new OrderRepository().getOrderById(id);
  if (!existingOrder) {
    throw new AppError('order-not-found', `Order with ID ${id} not found`, 404);
  }
  return existingOrder;
}

async function validateUserIfUpdated(orderUpdates, existingOrder) {
  if (orderUpdates.userId !== undefined && orderUpdates.userId !== existingOrder.userId) {
    const userWhoOrdered = await getUserFromUsersService(orderUpdates.userId);
    if (!userWhoOrdered) {
      throw new AppError(
        'user-doesnt-exist',
        `The user ${orderUpdates.userId} doesnt exist`,
        404,
      );
    }
  }
}

function applyBusinessLogic(orderUpdates, existingOrder) {
  const processedUpdates = { ...orderUpdates };
  
  if (processedUpdates.totalPrice !== undefined) {
    const isPremium = processedUpdates.isPremiumUser !== undefined 
      ? processedUpdates.isPremiumUser 
      : existingOrder.isPremiumUser;
    
    if (isPremium) {
      processedUpdates.totalPrice = Math.ceil(processedUpdates.totalPrice * 0.9);
    }
  }
  
  return processedUpdates;
}

async function getUserFromUsersService(userId) {
  try {
    const getUserResponse = await axiosHTTPClient.get(
      `http://localhost/user/${userId}`,
      {
        timeout: process.env.HTTP_TIMEOUT
          ? parseInt(process.env.HTTP_TIMEOUT)
          : 2000,
        validateStatus: (status) => {
          return status < 500;
        },
      },
    );
    return getUserResponse.data;
  } catch (error) {
    if (error?.code === 'ECONNABORTED') {
      throw new AppError(
        'user-verification-failed',
        `Request to user service failed so user cant be verified`,
        503,
      );
    }

    throw error;
  }
}
