import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');

let app: INestApplication;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');

  done();
});

beforeEach(() => {
  nock('http://localhost/user/').get(`/1`).reply(200, {
    id: 1,
    name: 'John',
  });
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await app.close();
  nock.enableNetConnect();
  done();
});

// ️️️✅ Best Practice: Structure tests
describe('/api', () => {
  describe('GET /hello', () => {
    test('When request, Then should return hello', async () => {      
      //Act
      const getResponse = await request(app.getHttpServer()).get('/hello');

      //Assert
      expect(getResponse).toMatchObject({
        status: 200,
        body: {
          greeting: 'Testing is fun!'
        },
      });
    });
  });
});
