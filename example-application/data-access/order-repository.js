const Sequelize = require('sequelize');
const sequelizeConfig = require('./config/config');

let repository;
let orderModel;

module.exports = class OrderRepository {
  constructor() {
    if (!repository) {
      repository = new Sequelize(
        'shop',
        'myuser',
        'myuserpassword',
        sequelizeConfig
      );
      orderModel = repository.define('Order', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        externalIdentifier: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: true,
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
    return await orderModel.findOne({ where: { id: id } });
  }

  async getAllOrders() {
    return await orderModel.findAll();
  }

  async addOrder(orderDetails) {
    return await orderModel.create(orderDetails);
  }

  async deleteOrder(orderToDelete) {
    await orderModel.destroy({ where: { id: orderToDelete } });
    return;
  }

  async cleanup() {
    await orderModel.destroy({ where: {}, truncate: false });
    return;
  }
};
