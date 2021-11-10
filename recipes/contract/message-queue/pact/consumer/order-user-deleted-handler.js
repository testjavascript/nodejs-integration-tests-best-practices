module.exports = async (message) => {
  const { deletionReason, userId } = message;

  if (typeof userId !== 'number') {
    throw new Error(`User ID should be a number`);
  }

  if (typeof deletionReason !== 'string') {
    throw new Error(`Delete reason should be a string`);
  }

  // More validation and handling here
};




