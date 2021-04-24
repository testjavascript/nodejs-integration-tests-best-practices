const { Sequelize } = require('sequelize');
const sequelizeConfig = require('./config')

const sequelize = new Sequelize(sequelizeConfig);

const externals = ['ExternalA', 'ExternalB', 'ExternalC', 'ExternalD', 'ExternalE', 'ExternalF', 'ExternalG', 'ExternalH', 'ExternalI', 'ExternalJ'];

class TransactionManager {

    constructor() {

        this.date = new Date();

        this.order = sequelize.define(`Order`, {
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
            }
        });

        this.external = externals.map(e => sequelize.define(e, {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            orderId: {
                type: Sequelize.INTEGER
            }
        }));

        this.external.forEach(e => this.order.hasOne(e, { onDelete: 'CASCADE' }));

    }

    repository() {
        return new OrderRepository(this.order, this.transaction, this.date);
    }

    async start() {
        console.log(this.date)
        this.transaction = await sequelize.transaction();
    }

    async commit() {
        if (this.transaction) {
            await this.transaction.commit();
            this.transaction = null;
        }
    }

    async rollback() {
        console.log(this.date, !!this.transaction);
        if (this.transaction) {
            await this.transaction.rollback();
            this.transaction = null;
        }
    }

}

class OrderRepository {

    constructor(order, transaction) {
        this.order = order;
        this.transaction = transaction;
    }

    async getOrderById(id) {
        return await this.order.findOne({ where: { id: id }, include: externals, transaction: this.transaction });
    }

    async addOrder(orderDetails) {
        const order = await this.order.create(orderDetails, { transaction: this.transaction });
        await Promise.all(externals.map(e => order[`create${e}`]({ orderId: order.id }, { transaction: this.transaction })));
        return order;
    }

    async deleteOrder(id) {
        await this.order.destroy({ where: { id: id } }, { transaction: this.transaction });
    }

    async cleanup() {
        await this.order.destroy({ where: {}, truncate: false }, { transaction: this.transaction });
    }

};

module.exports.wrapper = new TransactionManager();
