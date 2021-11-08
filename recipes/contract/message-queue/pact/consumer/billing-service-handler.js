module.exports = async (message) => {
  const { order, user } = message;

  if (typeof order !== 'number')
    throw new Error(`order should be a number`);

  if (typeof user !== 'number')
    throw new Error(`user should be a number`);

  // pass message to business logic 
}
