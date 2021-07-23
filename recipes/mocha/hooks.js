const setup = require('../../example-application/test/global-setup.js');
const teardown = require('../../example-application/test/global-teardown.js');

exports.mochaGlobalSetup = async () => {
  await setup();
};

exports.mochaGlobalTeardown = async () => {
  await teardown();
};
