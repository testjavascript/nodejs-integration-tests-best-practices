const config = require('./jest.config');
config.testMatch = ['**/test/**/*test*.ts', '!**/playground/**', '!**/stryker-tmp/**'];
config.preset = 'ts-jest',
module.exports = config;
