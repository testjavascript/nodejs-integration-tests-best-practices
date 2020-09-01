const isPortReachable = require('is-port-reachable');
const path = require('path');
const waitPort = require('wait-port');
const dockerCompose = require('docker-compose');
const npm = require('npm');
const util = require('util');

module.exports = async () => {
  console.time('global-setup');
  /*  #region ️️️⚙️ Database initialization */
  const isDBReachable = await isPortReachable(54320);
  if (!isDBReachable) {
    await dockerCompose.upAll({
      cwd: path.join(__dirname),
      log: true,
    });
  }
  await waitPort({
    host: 'localhost',
    port: 54320,
  });
  /* #endregion */

  /*  #region ️️️⚙️ DB migration */
  const npmLoadAsPromise = util.promisify(npm.load);
  await npmLoadAsPromise();
  const npmCommandAsPromise = util.promisify(npm.commands.run);
  await npmCommandAsPromise(['db:migrate']);

  /* #endregion */


  // 👍🏼 We're ready
  console.timeEnd('global-setup');
};
