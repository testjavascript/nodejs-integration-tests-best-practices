const resolvers = {
  Query: {
    hello: (_, { value }) => value !== 42 ? 'Hello world!' : (() => { throw new Error('42') })(),
  },
};

module.exports = { resolvers };
