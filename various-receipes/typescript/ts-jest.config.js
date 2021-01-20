const config = require('../../jest.config');
config.testMatch = ['**/various-receipes/typescript/test/*.ts', '!**/playground/**', '!**/stryker-tmp/**'];
config.preset = 'ts-jest',
config.rootDir = '../../',
module.exports = config;
