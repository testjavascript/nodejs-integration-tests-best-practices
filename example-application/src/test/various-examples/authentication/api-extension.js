const authenticationMiddleware = require('./authentication-middleware');
//ℹ️ Based on the main example app to avoid coding a new backend for every example
const {
    initializeWebServer,
    stopWebServer
} = require('../../../api-under-test');

async function initializeWebServerAndAddHooks() {
    // Let's add login middleware to the main api
    const expressApp = await initializeWebServer(authenticationMiddleware.authenticationMiddleware);
    return expressApp;
}


module.exports = {
    initializeWebServer: initializeWebServerAndAddHooks,
    stopWebServer
}