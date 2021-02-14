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

  async addOrder(orderDetails) {
    const DBResponse = await orderModel.create(orderDetails);

    return DBResponse.dataValues;
  }

  async deleteOrder(orderToDelete) {
    console.log(`Order is about to be deleted`, orderToDelete);
    await orderModel.destroy({ where: { id: orderToDelete } });
    return;
  }

  async cleanup() {
    await orderModel.destroy({ where: {}, truncate: false });
    return;
  }
};
