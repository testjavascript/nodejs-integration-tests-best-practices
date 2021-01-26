const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../api-extension");
const authenticationMiddleware = require("../authentication-middleware");

let expressApp;
console.log("-1");
beforeAll(async (done) => {
  console.log("0");

  
  sinon.stub(authenticationMiddleware, "authenticationMiddleware").callsFake((req, res, next) => {
    if (req.headers["authorization"] === "special-back-door") {
      next();
    } else {
      res.status(401).end();
      return;
    }
  });

  expressApp = await initializeWebServer();
  
  console.log("1");
  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

beforeEach(() => {
  console.log("2");
  userNock = nock("http://localhost/user/").get(`/1`).reply(200, {
    id: 1,
    name: "John",
  });
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
      console.log("2.5");
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
      console.log("3");

      //Act
      const receivedAPIResponse = await request(expressApp)
        .post("/order")
        .set("authorization", "special-back-door")
        .send(orderToAdd);

      //Assert
      const { status, body } = receivedAPIResponse;
      console.log("4");

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
