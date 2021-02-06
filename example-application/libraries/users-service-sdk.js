const axios = require('axios');
const axiosRetry = require('axios-retry')

const client = axios.create();
axiosRetry(client, { retries: 3 });

module.exports = {
  async getUserFromUserService(userId) {
    return await client.get(
      `http://localhost/user/${userId}`,
      {
        timeout: 2000,
      }
    );
  },
}
