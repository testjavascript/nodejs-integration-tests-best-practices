const {
    initializeWebServer,
    stopWebServer
} = require('../../example-application/api-under-test');



async function initializeWebServerAndAddHooks() {
    // Let's add login middleware to the main api
    const expressApp = await initializeWebServer();
    return expressApp;
}


module.exports = {
    initializeWebServer: initializeWebServerAndAddHooks,
    stopWebServer
}