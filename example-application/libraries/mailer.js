const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  return await axios.post(`https://mailer.com/send`, {
    subject,
    body,
    recipientAddress
  });
};
