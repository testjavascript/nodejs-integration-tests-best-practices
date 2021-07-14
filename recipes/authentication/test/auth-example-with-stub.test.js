const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const { initializeWebServer, stopWebServer } = require('../api-extension');
const authenticationMiddleware = require('../authentication-middleware');

let axiosAPIClient;

beforeAll(async (done) => {
  sinon
    .stub(authenticationMiddleware, 'authenticationMiddleware')
    .callsFake((req, res, next) => {
      if (req.headers['authorization'] === 'special-back-door') {
        next();
      } else {
        res.status(401).end();
        return;
      }
    });

  nock('http://localhost/user/')
    .get(`/1`)
    .reply(200, {
      id: 1,
      name: 'John',
    })
    .persist();

  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  sinon.restore();
  nock.cleanAll();
  done();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('POST /orders', () => {
    test('When adding a new valid order, Then should get back 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      //Act
      const receivedAPIResponse = await axiosAPIClient.post('/order', orderToAdd, {
        headers: {
          authorization: 'special-back-door',
        }
      });

      //Assert
      const { status, data } = receivedAPIResponse;

      expect({
        status,
        data,
      }).toMatchObject({
        status: 200,
        data: {
          mode: 'approved',
        },
      });
    });
  });
});
