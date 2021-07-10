module.exports = {
  up: async (queryInterface, Sequelize) => {
    //Configuration ✅
    await queryInterface.bulkInsert('Countries', [{
      name: 'Italy',
      name: 'USA',
      name: 'India'
    }], {});

    //Test data ❌ 
    const now = new Date();
    await queryInterface.bulkInsert('Orders', [{
      id: 1,
      userId: 5,
      createdAt: now,
      updatedAt: now,
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  },
};