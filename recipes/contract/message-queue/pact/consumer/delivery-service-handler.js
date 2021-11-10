module.exports = async (message) => {
  const { userId, userAddress } = message;

  if (typeof userId !== 'number') throw new Error(`User ID should be a number`);

  if (typeof userAddress !== 'string')
    throw new Error(`Address should be a string`);

  // pass message to business logic
};
