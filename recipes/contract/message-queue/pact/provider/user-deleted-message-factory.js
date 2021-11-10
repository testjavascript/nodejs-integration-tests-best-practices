module.exports.factorUserDeletedMessage = (
  userId,
  deletionDate,
  deletionReason
) => {
  return {
    userId,
    deletionDate,
    deletionReason,
    userAddress: 'Ruth Avenue 28 NY',
  };
};
