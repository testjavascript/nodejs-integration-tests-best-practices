const path = require('path');
const axios = require('axios');
const request = require('supertest');
const nock = require('nock');
const jestOpenAPI = require('jest-openapi');
const {
  initializeWebServer,
  stopWebServer,
} = require('../../../example-application/api');

jestOpenAPI(
  path.join(__dirname, '../../../example-application/openapi/openapi.json')
);

let expressApp;

beforeAll(async () => {
  expressApp = await initializeWebServer();
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(async () => {
  await stopWebServer();
});

describe('Verify openApi spec', () => {
  describe('POST /orders', () => {
    test('When added a valid order and 200 was expected', async () => {
      nock('http://localhost/user/').get(`/1`).reply(200, {
        id: 1,
        name: 'John',
      });
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const res = await request(expressApp).post('/order').send(orderToAdd);

      // const res = await axios.post('http://localhost:33666/post', orderToAdd);

      expect(res).toSatisfyApiSpec();
    });

    test('When an invalid order is sent, then response 400 is expected', async () => {
      nock('http://localhost/user/').get(`/1`).reply(200, {
        id: 1,
        name: 'John',
      });
      const orderToAdd = {
        userId: 1,
        mode: 'approved',
      };

      const receivedResponse = await request(expressApp)
        .post('/order')
        .send(orderToAdd);

      expect(receivedResponse).toSatisfyApiSpec();
    });

    test('When an external call failed and 404 was expected', async () => {
      nock('http://localhost/user/').get(`/1`).reply(404);
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
      };

      const res = await request(expressApp).post('/order').send(orderToAdd);

      expect(res).toSatisfyApiSpec();
    });
  });
});
