// This returns a numerical value that is 99.99% unique in a multi-process test runner where the state/DB
// is cleaned-up at least once a day
module.exports.getShortUnique = () => {
  const now = new Date();
  // We add this weak random just to cover the case where two test started at the very same millisecond
  const aBitOfMoreSalt = Math.ceil(Math.random() * 990);
  return `${process.pid}${aBitOfMoreSalt}${now.getMilliseconds()}`;
};

