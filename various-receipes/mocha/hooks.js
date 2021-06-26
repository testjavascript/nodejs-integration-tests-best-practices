const setup = require('../../example-application/test/global-setup.js');
const teardown = require('../../example-application/test/global-teardown.js');

exports.mochaHooks = {
  async beforeAll() {
    this.timeout(null);
    await setup();
  },
  async afterAll() {
    this.timeout(null);
    await teardown();
  },
};
