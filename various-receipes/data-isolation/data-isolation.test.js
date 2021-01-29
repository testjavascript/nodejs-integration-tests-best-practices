const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../../example-application/api");
const OrderRepository = require("../../example-application/data-access/order-repository");
const { getShortUnique } = require("./test-helper");

let expressApp;

beforeAll(async (done) => {
  expressApp = await initializeWebServer();

  done();
});

beforeEach(() => {
  nock("http://localhost/user/").get(`/1`).reply(200, {
    id: 1,
    name: "John",
  });
});

afterEach(() => {
  nock.cleanAll();
  sinon.restore();
});

afterAll(async (done) => {
  await stopWebServer();
  nock.enableNetConnect();
  done();

  // ️️️✅ Best Practice: Avoid cleaning-up the database after each test or afterAll
  // This will interfere with other tests that run in different processes
});

describe("/api", () => {
  describe("POST /orders", () => {
    test("When adding a new valid order, Then should get back 200 response", async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: "approved",
        // ️️️✅ Best Practice: Set unique value to unique fields so that tests writer wouldn't have to
        // read previous tests before adding a new one
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };

      //Act
      const receivedAPIResponse = await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(receivedAPIResponse.status).toBe(200);
    });

    test("When adding a new valid order, Then it should be approved", async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: "approved",
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };

      //Act
      const receivedAPIResponse = await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(receivedAPIResponse.body.mode).toBe("approved");
    });
  });
  describe("GET /order:/id", () => {
    test("When asked for an existing order, Then should retrieve it and receive 200 response", async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      // ️️️✅ Best Practice: Each test acts on its own record. Avoid relying on records from previous tests
      const {
        body: { id: existingOrderId },
      } = await request(expressApp).post("/order").send(orderToAdd);

      // Act
      const receivedResponse = await request(expressApp).get(`/order/${existingOrderId}`);

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });
  describe("Get /order", () => {

    // ️️️✅ Best Practice: Acknowledge that other unknown records might exist, find your expectations within
    // the result
    test.only("When adding 2 orders, then get both when querying for all", async () => {
      //Arrange
      // TODO: Should we nock every call or persist?
      nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
      });
      const orderToAdd1 = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`,
        mode: "approved"
      };
      const orderToAdd2 = {
        userId: 1,
        productId: 3,
        externalIdentifier: `id-${getShortUnique()}`,
        mode: "pending"
      };
      const [{ body: { id: id1 } }, { body: { id: id2 } }] = await Promise.all([
        request(expressApp).post("/order").send(orderToAdd1),
        request(expressApp).post("/order").send(orderToAdd2)
      ]);

      //Act
      const { body: allOrders } = await request(expressApp).get("/order");

      //Assert
      expect(allOrders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: id1, ...orderToAdd1 }),
          expect.objectContaining({ id: id2, ...orderToAdd2 })
        ])
      );
    });

  });

  describe("DELETE /order", () => {
    test("When deleting an existing order, Then should get a successful message", async () => {
      // Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      // ️️️✅ Best Practice: Each test acts on its own record. Avoid relying on records from previous tests
      const {
        body: { id: existingOrderId },
      } = await request(expressApp).post("/order").send(orderToAdd);

      // Act
      const receivedResponse = await request(expressApp).get(`/order/${existingOrderId}`);

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });

});
