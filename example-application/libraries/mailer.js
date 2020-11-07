const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  console.log('Not really a mailer, right?', subject, body, recipientAddress);
  await axios.post(`http://localhost/mailer`, { subject, body, recipientAddress });
};
