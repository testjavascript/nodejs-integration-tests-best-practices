module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('Countries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      }
    });
  },

  down: (queryInterface, Sequelize) => queryInterface.dropTable("Orders"),
};
