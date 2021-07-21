const axios = require('axios');
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../../example-application/api");
const OrderRepository = require("../../example-application/data-access/order-repository");
const { getShortUnique } = require("./test-helper");

let axiosAPIClient;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  const apiConnection = await initializeWebServer();
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${apiConnection.port}`,
    validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
  };
  axiosAPIClient = axios.create(axiosConfig);

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
      const receivedAPIResponse = await axiosAPIClient.post("/order", orderToAdd);

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
      const receivedAPIResponse = await axiosAPIClient.post("/order", orderToAdd);

      //Assert
      expect(receivedAPIResponse.data.mode).toBe("approved");
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
        data: { id: existingOrderId },
      } = await axiosAPIClient.post("/order", orderToAdd);

      // Act
      const receivedResponse = await axiosAPIClient.get(`/order/${existingOrderId}`);

      // Assert
      expect(receivedResponse.status).toBe(200);
    });
  });
  describe("Get /order", () => {
    // ️️️✅ Best Practice: Acknowledge that other unknown records might exist, find your expectations within
    // the result
    test.todo("When adding 2 orders, then these orders exist in result when querying for all");
  });
  describe("DELETE /order", () => {
    test("When deleting an existing order, Then should get a successful message", async () => {
      // Arrange
      const orderToDelete = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };
      // ️️️✅ Best Practice: Each test acts on its own record. Avoid relying on records from previous tests
      const {
        data: { id: orderToDeleteId },
      } = await axiosAPIClient.post("/order", orderToDelete);

      // ✅ Best Practice: Create another order to make sure the delete request deletes only the correct record
      const anotherOrder = {
        userId: 1,
        productId: 2,
        externalIdentifier: `id-${getShortUnique()}`, //unique value
      };

      nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
      });
      const {
        data: { id: anotherOrderId },
      } = await axiosAPIClient.post("/order", anotherOrder);

      // Act
      const deleteResponse = await axiosAPIClient.delete(`/order/${orderToDeleteId}`);
      const getOrderResponse = await axiosAPIClient.get(`/order/${anotherOrderId}`);

      // Assert
      expect(deleteResponse.status).toBe(204);
      expect(getOrderResponse.status).toBe(200);
    });
  });
});
