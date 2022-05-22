import { initializeWebServer, stopWebServer } from '../main';
import axios, { AxiosInstance } from "axios";
import * as nock from 'nock'

// Configuring file-level HTTP client with base URL will allow
// all the tests to approach with a shortened syntax
let axiosAPIClient: AxiosInstance;

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  nock.enableNetConnect();
});

// ️️️Here we just exemplifies a simple route and the setup of Nest.js.
// To learn about testing patterns of real-world app, look at the main example under "example-application/test" folder
describe('/api', () => {
  describe('GET /hello', () => {
    test('When request, Then should return hello', async () => {
      //Act
      const getResponse = await axiosAPIClient.get('/hello');

      //Assert
      expect(getResponse).toMatchObject({
        status: 200,
        data: {
          greeting: 'Testing is fun!'
        },
      });
    });
  });
});
