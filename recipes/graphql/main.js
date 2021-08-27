const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs } = require('./app/typeDefs');
const { resolvers } = require('./app/resolvers');

let app;
let connection;
let apolloServer;

const initializeWebServer = async () => {
  // Apollo-Express Server setup
  app = express();
  apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  const webServerPort = process.env.PORT ? process.env.PORT : null;

  const address = await new Promise((resolve, reject) => {
    connection = app.listen(webServerPort, () => {
      resolve(connection.address());
    });
  });

  return address;
};

const stopWebServer = async () => {
  await apolloServer.stop();

  await new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    });
  });
};

module.exports = { initializeWebServer, stopWebServer };
