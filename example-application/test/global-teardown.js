const isCI = require('is-ci');
const dockerCompose = require('docker-compose');

module.exports = async () => {
  if (isCI) {
    // ️️️✅ Best Practice: Leave the DB up in dev environment
    dockerCompose.down();
  }
};
