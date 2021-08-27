const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    hello(value: Int): String
  }
`;

module.exports = { typeDefs };
