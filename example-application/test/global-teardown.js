const isCI = require('is-ci');
const dockerCompose = require('docker-compose');

module.exports = async () => {
  if (isCI) {
    dockerCompose.down();
  }
};
