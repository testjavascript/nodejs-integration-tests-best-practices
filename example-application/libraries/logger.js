// This is not a real logger as its just writes to the console
// but it has the structure of a real logger

module.exports.info = (message) => {
  console.log(message);
};

module.exports.error = (message) => {
  console.error(message);
};
