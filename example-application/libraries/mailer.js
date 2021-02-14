const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  await axios.post(`https://mail.com/send`, {
    subject,
    body,
    recipientAddress,
  });
};
