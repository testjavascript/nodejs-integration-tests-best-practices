const express = require('express');

expressApp = express();
expressApp.listen(3000);
expressApp.all('/', (req, res) => {
  console.log('foo');
});
