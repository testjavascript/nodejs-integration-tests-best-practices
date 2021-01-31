const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  await axios.post(
    `http://localhost/mailer/send`,
    {
      subject,
      body,
      recipientAddress,
    },
    { timeout: 1000 }
  );
};
