const Express = require('express');
const { expressjwt: jwt } = require('express-jwt'); //validates the token
//const logger = require('debug')('express');
const { expressJwtSecret } = require('jwks-rsa'); //fetches the public key from the JWKS endpoint

const jwksHost = 'localhost:3000/.well-known/jwks.json';
const audience = 'frontend';
const issuer = 'org-issuer';

// Initialize the app
const app = new Express();
app.use(
  jwt({
    // secret: expressJwtSecret({
    //   cache: true,
    //   rateLimit: true,
    //   jwksRequestsPerMinute: 2,
    //   jwksUri: `${jwksHost}/.well-known/jwks.json`,
    // }),
    secret: 'secret',
    audience: audience,
    issuer: issuer,
    algorithms: ['HS256'],
  })
);
app.use((req, res, next) => {
  console.log('checking login', req.auth);
  if (!req.auth) {
    return res.status(401).send('Unauthorized');
  }
  next();
});

app.get('/me', (req, res) => {
  console.log('route /me called');
  res.status(409).json(req.user);
});

app.use((err, req, res, next) => {
  console.error(err.name, err.message);
  res.status(500).json({
    name: err.name,
    message: err.message,
  });
});

// Start the server.
const port = process.env.PORT || 4001;
app.listen(port, function (error) {
  if (error) {
    console.error(error);
  } else {
    console.log('Listening on http://localhost:' + port);
  }
});
