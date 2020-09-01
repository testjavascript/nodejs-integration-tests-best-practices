const Sequelize = require('sequelize');
const sequelizeConfig = require('./config/config');

let repository;
let orderModel;

module.exports = class OrderReposiroty {
  constructor() {
    if (!repository) {
      repository = new Sequelize('shop', 'myuser', 'myuserpassword', sequelizeConfig);
      orderModel = repository.define('Order', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        mode: {
          type: Sequelize.STRING,
        },
        userId: {
          type: Sequelize.INTEGER,
        },
        productId: {
          type: Sequelize.INTEGER,
        },
      });
    }
  }

  async addOrder(orderDetails) {
    
    return await orderModel.create(orderDetails);
  }
};
