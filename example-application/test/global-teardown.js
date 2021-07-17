const isCI = require('is-ci');
const dockerCompose = require('docker-compose');
const OrderRepository = require('../data-access/order-repository');

module.exports = async () => {
  if (isCI) {
    // ️️️✅ Best Practice: Leave the DB up in dev environment
    dockerCompose.down();
  } else {
    // ✅ Best Practice: Clean the database occasionally
    if (Math.ceil(Math.random() * 10) === 10) {
      await new OrderRepository().cleanup();
    }
  }
};
