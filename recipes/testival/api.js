const axios = require('axios');

const result = axios.post('/api/order', { id: 1, product: 'Book' });
if (result.duplicated) {
  showMessageToUser();
}
