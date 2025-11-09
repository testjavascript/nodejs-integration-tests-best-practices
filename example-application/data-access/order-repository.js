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
        sequelizeConfig,
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
        contactEmail: {
          type: Sequelize.STRING,
        },
        productId: {
          type: Sequelize.INTEGER,
        },
        totalPrice: {
          type: Sequelize.INTEGER,
        },
        isPremiumUser: {
          type: Sequelize.BOOLEAN,
        },
      });
    }
  }

  async getOrderById(id) {
    return await orderModel.findOne({ where: { id } });
  }

  async addOrder(orderDetails) {
    const addingResponse = await orderModel.create(orderDetails);

    return addingResponse.dataValues;
  }

  async deleteOrder(orderToDelete) {
    await orderModel.destroy({ where: { id: orderToDelete } });
    return;
  }

  async updateOrder(id, orderDetails) {
    await orderModel.update(orderDetails, {
      where: { id },
    });
    
    return await this.getOrderById(id);
  }

  async cleanup() {
    await orderModel.truncate();
  }
};
