const axios = require('axios');
const api = require('../index.js');
const {
  signTokenSynchronously,
  signExpiredTokenSynchronously,
} = require('../../helper');

test('When providing a fake JWT, then get back HTTP 400', async () => {
  // Arrange
  // Act
  console.log('act');
  const token = signTokenSynchronously('test-user', 'user');
  const receivedResponse = await axios.post(
    'http://localhost:4001/me',
    {},
    { headers: { authorization: `Bearer ${token}` } }
  );
  // Assert
  expect(receivedResponse.status).toBe(400);
});
