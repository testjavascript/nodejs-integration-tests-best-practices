module.exports = async (message) => {
  const { order, item, status } = message;

  if (typeof order !== 'number')
    throw new Error(`order should be a number`);

  if (typeof item !== 'number')
    throw new Error(`product should be a number`);

  // if (status !== 'Created' && status !== 'Paid'  && status !== 'Delivered')
  //   throw new Error(`wrong status `);

  // pass message to business logic
}
