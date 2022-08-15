const jestOpenAPI = require('jest-openapi');
jestOpenAPI(path.join(__dirname, '../openapi.json'));

let axiosClient;

beforeAll(() => {
  axiosClient = axios.create();

  axiosClient.interceptors.response.use((res) => {
    expect(res).toSatisfyApiSpec();
  });
});

test('When having duplicate order, Then should get back HTTP 409', async () => {
  //Arrange
  testHelpers.addOrder({ id: 1 });

  //Act
  const receivedAPIResponse = await axiosClient.post('/order', { id: 1 });

  //Assert
  expect(receivedAPIResponse.status).toBe(409);
});