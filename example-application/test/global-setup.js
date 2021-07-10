const isPortReachable = require('is-port-reachable');
const path = require('path');
const dockerCompose = require('docker-compose');
const npm = require('npm');
const util = require('util');

module.exports = async () => {
  console.time('global-setup');

  // ️️️✅ Best Practice: Speed up during development, if already live then do nothing
  const isDBReachable = await isPortReachable(54310);
  if (!isDBReachable) {
    // ️️️✅ Best Practice: Start the infrastructure within a test hook - No failures occur because the DB is down
    await dockerCompose.upAll({
      cwd: path.join(__dirname),
      log: true,
    });

    await dockerCompose.exec(
      'database',
      ['sh', '-c', 'until pg_isready ; do sleep 1; done'],
      {
        cwd: path.join(__dirname),
      }
    );

    // ️️️✅ Best Practice: Use npm script for data seeding and migrations
    const npmLoadAsPromise = util.promisify(npm.load);
    await npmLoadAsPromise();
    const npmCommandAsPromise = util.promisify(npm.commands.run);
    await npmCommandAsPromise(['db:migrate']);
    // ✅ Best Practice: Seed only metadata and not test record, read "Dealing with data" section for further information
    await npmCommandAsPromise(['db:seed']);
  }

  // 👍🏼 We're ready
  console.timeEnd('global-setup');
};
