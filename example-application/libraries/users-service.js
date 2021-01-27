const axios = require('axios');

module.exports = {
  async getUser(userId) {
    let response = await axios.get(
      `http://localhost/user/${userId}`,
      {
        validateStatus: false,
        timeout: 2000,
      }
    );

    console.log(
      `Asked to get user and get response with status ${response.status}`
    );

    if (response.status === 503) {
      await new Promise(resolve => setTimeout(resolve, Number(response.headers['retry-after']) ?? 100));

      response = await axios.get(
        `http://localhost/user/${userId}`,
        {
          validateStatus: false,
          timeout: 2000,
        }
      );
  
      console.log(
        `Asked to get user and get response with status ${response.status}`
      );
    }

    return response;
  }
}
