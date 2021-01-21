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

  async getOrderById(id) {
    return orderModel.findOne({ where: { id: id } });
  }

  async addOrder(orderDetails) {
    return orderModel.create(orderDetails);
  }

};
