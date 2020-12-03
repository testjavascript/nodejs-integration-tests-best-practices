const isPortReachable = require('is-port-reachable');
const path = require('path');
const waitPort = require('wait-port');
const dockerCompose = require('docker-compose');
const npm = require('npm');
const util = require('util');

module.exports = async () => {
  if (process.env.noInfrastructure) {
    return;
  }

  console.time('global-setup');

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

  const npmLoadAsPromise = util.promisify(npm.load);
  await npmLoadAsPromise();
  const npmCommandAsPromise = util.promisify(npm.commands.run);
  await npmCommandAsPromise(['db:migrate']);

  // 👍🏼 We're ready
  console.timeEnd('global-setup');
};