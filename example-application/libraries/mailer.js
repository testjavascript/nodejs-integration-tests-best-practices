const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  await axios.post(
    `http://mailer.com/send`,
    {
      subject,
      body,
      recipientAddress,
    },
    { timeout: 1000 }
  );
};
