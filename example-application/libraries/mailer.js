const axios = require('axios');

module.exports.send = async (subject, body, recipientAddress) => {
  await axios.post(
    `http://mailer.com/send`,
    {
      subject,
      body,
      recipientAddress,
    },
    { timeout: 3000 } //It's a bit slow sometime, we are willing to wait for it
  );
};
