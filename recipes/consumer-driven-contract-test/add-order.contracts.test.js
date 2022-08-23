const { Pact, Matchers } = require('@pact-foundation/pact');
const express = require('express');
const axios = require('axios');
const sinon = require('sinon');
const nock = require('nock');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../example-application/entry-points/api');

let axiosAPIClient, pactProviderDefinition;

const { Pact, Matchers } = require('@pact-foundation/pact');

beforeAll(async () => {
  pactProviderDefinition = new Pact({
    port: 8080,
    consumer: 'order-service',
    provider: 'user-service',
  });
}

  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

  pactProviderDefinition = new Pact({
    port: 8080,
    consumer: 'order-service',
    provider: 'user-service',
  });
  pactProviderDefinition.addInteraction({
    state: 'User was deleted',
    uponReceiving: 'A check if user was deleted',
    withRequest: {
      path: '/user/1',
      method: 'GET',
    },
    willRespondWith: {
      body: eachLike({
        id: 1,
        name: 'Kent Beck',
        deletionDate: new Date(),
        deletionReason: 'user-unsubscribed',
      }),
    },
    status: 200,
  });
  console.log('pact2');
  await pactProviderDefinition.setup();
  console.log('pact3');
  console.log('🚀', pactProviderDefinition.mockService.url);
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  pactProviderDefinition.finalize();
});

beforeEach(() => {
  nock('http://mailer.com').post('/send').reply(202);

  sinon.stub(process, 'exit');
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

describe('Add order (contract examples)', () => {
  test('When the user is deleted due to inactivity, the order reactivate the user and succeed', () => {
    // Arrange
    pactProvider.addInteraction({
      state: 'User was deleted due to inactivity',
      uponReceiving: 'A request for deleted user due to inactivity',
      withRequest: {path: '/user/1', method: 'GET',},
      willRespondWith: {
        body: eachLike({
          name: 'Kent Beck',
          deletionDate: new Date().setDate(new Date().getDay() - 5),
          deletionReason: 'no-activity',
        }),
      }, status: 200,});
    
    // Act
    const receivedResponse = await axiosAPIClient.post(`/order`, getDefaultOrder());

    // Assert
    expect(receivedResponse.status).toBe(200);
  });

  test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };
    const {
      data: { id: addedOrderId },
    } = await axiosAPIClient.post(`/order`, orderToAdd);

    //Act
    // ️️️✅ Best Practice: Use generic and reputable HTTP client like Axios or Fetch. Avoid libraries that are coupled to
    // the web framework or include custom assertion syntax (e.g. Supertest)
    const getResponse = await axiosAPIClient.get(`/order/${addedOrderId}`);

    //Assert
    expect(getResponse).toMatchObject({
      status: 200,
      data: {
        userId: 1,
        productId: 2,
        mode: 'approved',
      },
    });
  });
});
