//ℹ️ This file extends tha base example with more functionality to avoid coding all from scratch
// Here we add a JWT auth middleware so the app is secured

const authenticationMiddleware = require('./authentication-middleware');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');

async function initializeWebServerAndAddHooks() {
  // Let's add login middleware to the main api
  const expressApp = await initializeWebServer(
    authenticationMiddleware.authenticationMiddleware
  );
  return expressApp;
}

module.exports = {
  initializeWebServer: initializeWebServerAndAddHooks,
  stopWebServer,
};
