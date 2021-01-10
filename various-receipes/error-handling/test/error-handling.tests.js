const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const { initializeWebServer, stopWebServer } = require("../../../example-application/api-under-test");
const errorHandler = require("../../../example-application/error-handling").errorHandler;
const OrderRepository = require("../../../example-application/data-access/order-repository");
const { metricsExporter } = require("../../../example-application/error-handling");

let expressApp;
let sinonSandbox;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();
  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls except for the Api-Under-Test
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");

  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

beforeEach(() => {
  nock.cleanAll();
  // ️️️✅ Best Practice: Isolate the service under test by intercepting requests to 3rd party services
  nock("http://localhost/user/").get(`/1`).reply(200, {
    id: 1,
    name: "John",
  });

  sinon.restore();
});

// ️️️✅ Best Practice: Structure tests
describe("Error Handling", () => {
  describe("Selected Examples", () => {
    test("When exception is throw during request, Then logger reports the error", async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: "approved",
      };
      // Arbitrarily choose which an object and error to throw
      sinon.stub(OrderRepository.prototype, "addOrder").throws(new Error("Failed!"));
      const consoleErrorDouble = sinon.stub(console, "error");

      //Act
      await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(consoleErrorDouble.called).toBe(true);
    });

    test("When exception is throw during request, Then a metric is fired", async () => {
      //Arrange
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: "approved",
      };
      // Arbitrarily choose which an object and error to throw
      sinon.stub(OrderRepository.prototype, "addOrder").throws(new Error("Failed!"));
      const metricsExporterDouble = sinon.stub(metricsExporter, "fireMetric");

      //Act
      await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(metricsExporterDouble.called).toBe(true);
    });
  });
});
