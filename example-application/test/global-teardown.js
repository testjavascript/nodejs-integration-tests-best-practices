const isCI = require('is-ci');
const dockerCompose = require('docker-compose');

module.exports = async () => {
  if (process.env.noInfrastructure) {
    return;
  }

  /*  #region ️️️⚙️ Tear DB down */
  if (isCI) {
    dockerCompose.down();
  }

  // 😕 TODO: tear data down!

  /* #endregion */
};
