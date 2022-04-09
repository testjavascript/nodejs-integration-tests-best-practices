const axios = require('axios');
const nock = require('nock');
const gqlt = require('gql-query-builder');
const { initializeWebServer, stopWebServer } = require('../main');

let axiosGraphQLClient;

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}/graphql`, // All calls hit the graphql route
    validateStatus: () => true, // Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosGraphQLClient = axios.create(axiosConfig);
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();

  nock.enableNetConnect();
});

const HELLO_QUERY = gqlt.query({
  operation: 'hello',
}).query;

describe('/graphql', () => {
  describe('hello Query', () => {
    test('When valid request, Then should return hello', async () => {
      // Act
      const { data, status } = await axiosGraphQLClient.post('', {
        query: HELLO_QUERY,
      });

      // Assert
      expect(status).toEqual(200);
      expect(data).toMatchObject({
        data: { hello: 'Hello world!' },
      });
    });
  });
});
