module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ Best Practice: Seed only metadata and not test record, read "Dealing with data" section for further information
    await queryInterface.bulkInsert('Countries', [{
      name: 'Italy',
      name: 'USA',
      name: 'India'
    }], {});

    // ❌ Anti-Pattern: Seed test records, read "Dealing with data" section for further information
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