const resolvers = {
  Query: {
    hello: (_, { value }) => 'Hello world!',
  },
};

module.exports = { resolvers };
