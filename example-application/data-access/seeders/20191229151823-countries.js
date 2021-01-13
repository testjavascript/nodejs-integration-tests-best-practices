module.exports = {
  up: (queryInterface, Sequelize) => {
    //Configuration ✅
    queryInterface.bulkInsert('Countries', [{
      name: 'Italy',
      name: 'USA',
      name: 'India'
    }], {})

    //Test data ❌ 
    queryInterface.bulkInsert('Order', [{
      id: 1,
      price: 55,
      userId: 5,
    }], {})


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