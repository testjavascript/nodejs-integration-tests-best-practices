const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../api-extension");
const authenticationMiddleware = require("../authentication-middleware");

let expressApp;
let sinonSandbox;
const userNockScope;

beforeAll(async (done) => {
  sinon.stub(authenticationMiddleware, "authenticationMiddleware").callsFake((req, res, next) => {
    if (req.headers["authorization"] === "special-back-door") {
      next();
    } else {
      res.status(401).end();
      return;
    }
  });

  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();

  // ️️️✅ Best Practice: use a sandbox for test doubles for proper clean-up between tests
  sinonSandbox = sinon.createSandbox();

  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

beforeEach(() => {
  userNock = nock("http://localhost/user/").get(`/1`).reply(200, {
    id: 1,
    name: "John",
  });

  if (sinonSandbox) {
    sinonSandbox.restore();
  }
});

afterEach(() => {
  sinon.restore();
  nock.cleanAll();
});

afterAll(() => {});

// ️️️✅ Best Practice: Structure tests
describe("/api", () => {
  describe("POST /orders", () => {
    test("When adding a new valid order, Then should get back 200 response", async () => {
      //Arrange
      const orderToAdd = {
        userId: 2,
        productId: 2,
        mode: "approved",
      };
      nock("http://localhost/user/").get(`/2`).reply(500, {
        id: 1,
        name: "John",
      });

      //Act
      const receivedAPIResponse = await request(expressApp)
        .post("/order")
        .set("authorization", "special-back-door")
        .send(orderToAdd);

      //Assert
      const { status, body } = receivedAPIResponse;

      expect({
        status,
        body,
      }).toMatchObject({
        status: 200,
        body: {
          mode: "approved",
        },
      });
    });
  });
});
