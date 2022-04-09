const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

module.exports = { typeDefs };
