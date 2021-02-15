const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  await axios.post(`http://mail.com/send`, {
    subject,
    body,
    recipientAddress,
  });
};
